package main

import (
	gamepb "agaragar/ctf"
	"context"
	"fmt"
	"math"
	"math/rand"
	"os"
	"sort"
	"sync"
	"time"
)

// Helper functions to create pointers for required protobuf fields
func stringPtr(s string) *string    { return &s }
func float32Ptr(f float32) *float32 { return &f }
func uint32Ptr(u uint32) *uint32    { return &u }
func boolPtr(b bool) *bool          { return &b }

// --- Game configuration (ported from server.js)
const (
	TICK_RATE_HZ               = 30
	WORLD_SIZE                 = 2500
	INITIAL_PLAYER_MASS        = 12.0
	PELLET_COUNT_TARGET        = 350
	PELLET_MASS                = 1.0
	PLAYER_BASE_SPEED          = 320.0
	COLLISION_EAT_RATIO        = 1.15
	TAU                        = math.Pi * 2
	MAX_DT                     = 0.05
	STAR_COUNT_TARGET          = 18
	STAR_MASS                  = 6.0
	GALAXY_COUNT_TARGET        = 10
	GALAXY_MASS                = 22.0
	BLACKHOLE_COUNT_TARGET     = 6
	BLACKHOLE_MASS             = 45.0
	GRAVITY_SOFTENING          = 60.0
	STAR_GRAVITY               = 850.0
	STAR_INFLUENCE_RADIUS      = 520.0
	GALAXY_GRAVITY             = 1400.0
	GALAXY_INFLUENCE_RADIUS    = 820.0
	BLACKHOLE_GRAVITY          = 2200.0
	BLACKHOLE_INFLUENCE_RADIUS = 1100.0
	PELLET_GRAVITY_MULTIPLIER  = 0.35
	ORBIT_MASS_EXP             = 1.25
	MASS_INFLUENCE_BONUS       = 0.03
	STEER_ACCEL                = 600.0
	STEER_GAIN                 = 2.2
	MAX_SPEED                  = 900.0
	BOOST_ACCEL                = 900.0
	BOOST_SPEED_MULT           = 2.0
	BOOST_FUEL_MAX             = 100.0
	BOOST_FUEL_DRAIN_PER_S     = 35.0
	BOOST_FUEL_REGEN_PER_S     = 22.0
	LINEAR_DAMPING             = 1.6
	SPAWN_PROTECTION_S         = 5.0
	SAFE_SPAWN_DISTANCE        = 260.0
	SAFE_SPAWN_TRIES           = 20
	PELLET_MAX_SPEED           = 480.0
	PELLET_DAMPING             = 0.25
)

type debugOptions struct {
	boostSpeedMultiplier float32
	infiniteStamina      bool
	massMultiplier       float32
}

type player struct {
	id        string
	name      string
	x, y      float32
	mass      float32
	color     string
	targetX   float32
	targetY   float32
	vx, vy    float32
	spawnTime time.Time
	boosting  bool
	boostFuel float32
	debugMode bool
	debugOpts debugOptions
}

// gameServer implements the GameService.
type gameServer struct {
	gamepb.UnimplementedGameServiceServer
	mu          sync.RWMutex
	players     map[string]*player
	pellets     [][2]float32
	pelletVels  [][2]float32
	stars       [][2]float32
	galaxies    [][2]float32
	blackholes  [][2]float32
	subscribers map[gamepb.GameService_StreamStateServer]bool
	subsMu      sync.RWMutex
}

func (s *gameServer) StreamState(req *gamepb.Empty, stream gamepb.GameService_StreamStateServer) error {
	s.subsMu.Lock()
	s.subscribers[stream] = true
	s.subsMu.Unlock()

	defer func() {
		s.subsMu.Lock()
		delete(s.subscribers, stream)
		s.subsMu.Unlock()
	}()

	// Keep connection alive until context is cancelled
	<-stream.Context().Done()
	return nil
}

func (s *gameServer) SendInput(ctx context.Context, in *gamepb.Input) (*gamepb.Empty, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if p := s.players[*in.Id]; p != nil {
		p.targetX = clamp(*in.Tx, 0, WORLD_SIZE)
		p.targetY = clamp(*in.Ty, 0, WORLD_SIZE)
	}
	return &gamepb.Empty{}, nil
}

func (s *gameServer) StartBoost(ctx context.Context, in *gamepb.Input) (*gamepb.Empty, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if p := s.players[*in.Id]; p != nil {
		p.targetX = clamp(*in.Tx, 0, WORLD_SIZE)
		p.targetY = clamp(*in.Ty, 0, WORLD_SIZE)
		if p.boostFuel > 0 {
			p.boosting = true
		}
	}
	return &gamepb.Empty{}, nil
}

func (s *gameServer) EndBoost(ctx context.Context, in *gamepb.PlayerID) (*gamepb.Empty, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if p := s.players[*in.Id]; p != nil {
		p.boosting = false
	}
	return &gamepb.Empty{}, nil
}

func (s *gameServer) Disconnect(ctx context.Context, in *gamepb.PlayerID) (*gamepb.Empty, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.players, *in.Id)
	return &gamepb.Empty{}, nil
}

func (s *gameServer) SetName(ctx context.Context, in *gamepb.SetNameRequest) (*gamepb.Empty, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if p := s.players[*in.Id]; p != nil {
		name := *in.Name
		if len(name) > 20 {
			name = name[:20]
		}
		if name == "" {
			name = fmt.Sprintf("Player-%s", (*in.Id)[:4])
		}
		p.name = name
	}
	return &gamepb.Empty{}, nil
}

func (s *gameServer) Welcome(ctx context.Context, in *gamepb.Empty) (*gamepb.WelcomeReply, error) {
	id := randomID()
	s.respawn(id)
	return &gamepb.WelcomeReply{Id: stringPtr(id), World: &gamepb.World{Size: uint32Ptr(WORLD_SIZE)}}, nil
}

func (s *gameServer) ToggleDebugMode(ctx context.Context, in *gamepb.PlayerName) (*gamepb.DebugModeNotification, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Find player by name instead of ID
	var p *player
	for _, player := range s.players {
		if player.name == *in.Name {
			p = player
			break
		}
	}

	if p == nil {
		return &gamepb.DebugModeNotification{
			Message: stringPtr("Player not found"),
			Flag:    stringPtr(""),
		}, nil
	}

	// Toggle debug mode
	p.debugMode = !p.debugMode

	var message string
	if p.debugMode {
		message = "Debug Mode ACTIVATED! Use SetDebugOptions to configure boost speed, infinite stamina, and mass multipliers."
		// Set default debug options if none are set
		if p.debugOpts.boostSpeedMultiplier == 0 {
			p.debugOpts.boostSpeedMultiplier = 2.0
		}
		if p.debugOpts.massMultiplier == 0 {
			p.debugOpts.massMultiplier = 1.0
		}
		// Set fuel to max when activating debug mode
		p.boostFuel = BOOST_FUEL_MAX
	} else {
		message = "Debug Mode deactivated. Back to normal gameplay."
		// Reset debug options
		p.debugOpts = debugOptions{}
	}

	return &gamepb.DebugModeNotification{
		Message: stringPtr(message),
		Flag:    stringPtr(""),
	}, nil
}

func (s *gameServer) SetDebugOptions(ctx context.Context, in *gamepb.DebugModeRequest) (*gamepb.DebugModeNotification, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Find player by name
	var p *player
	for _, player := range s.players {
		if player.name == *in.Name {
			p = player
			break
		}
	}

	if p == nil {
		return &gamepb.DebugModeNotification{
			Message: stringPtr("Player not found"),
			Flag:    stringPtr(""),
		}, nil
	}

	if !p.debugMode {
		return &gamepb.DebugModeNotification{
			Message: stringPtr("Debug mode is not active. Enable debug mode first."),
			Flag:    stringPtr(""),
		}, nil
	}

	// Set debug options
	if in.Options != nil {
		if *in.Options.BoostSpeedMultiplier > 0 {
			p.debugOpts.boostSpeedMultiplier = *in.Options.BoostSpeedMultiplier
		}
		p.debugOpts.infiniteStamina = *in.Options.InfiniteStamina
		if *in.Options.MassMultiplier > 0 {
			p.debugOpts.massMultiplier = *in.Options.MassMultiplier
		}
	}

	message := fmt.Sprintf("Debug options updated: Boost Speed Multiplier=%.1f, Infinite Stamina=%t, Mass Multiplier=%.1f",
		p.debugOpts.boostSpeedMultiplier, p.debugOpts.infiniteStamina, p.debugOpts.massMultiplier)

	flag := os.Getenv("DEBUG_MODE_FLAG")

	return &gamepb.DebugModeNotification{
		Message: stringPtr(message),
		Flag:    stringPtr(flag),
	}, nil
}

// --- Helper functions (ported from server.js)
func clamp(v, lo, hi float32) float32 {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

func radiusFromMass(m float32) float32 {
	return float32(math.Sqrt(float64(m))) * 4.0
}

func speedFromMass(m float32) float32 {
	return PLAYER_BASE_SPEED / float32(math.Max(1.0, math.Sqrt(float64(m))))
}

func randomColor() string {
	hue := rand.Intn(360)
	return fmt.Sprintf("hsl(%d, 70%%, 55%%)", hue)
}

func randomPos() [2]float32 {
	return [2]float32{
		50 + rand.Float32()*(WORLD_SIZE-100),
		50 + rand.Float32()*(WORLD_SIZE-100),
	}
}

func randomID() string {
	const letters = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, 12)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return string(b)
}

func (s *gameServer) safeSpawn() [2]float32 {
	for t := 0; t < SAFE_SPAWN_TRIES; t++ {
		pos := randomPos()
		x, y := pos[0], pos[1]
		ok := true

		// Check distance from other players
		for _, p := range s.players {
			dx := p.x - x
			dy := p.y - y
			if dx*dx+dy*dy < SAFE_SPAWN_DISTANCE*SAFE_SPAWN_DISTANCE {
				ok = false
				break
			}
		}

		// Check distance from blackholes
		if ok {
			for _, bh := range s.blackholes {
				dx := bh[0] - x
				dy := bh[1] - y
				if dx*dx+dy*dy < SAFE_SPAWN_DISTANCE*SAFE_SPAWN_DISTANCE {
					ok = false
					break
				}
			}
		}

		if ok {
			return pos
		}
	}
	return randomPos()
}

func (s *gameServer) respawn(id string) {
	pos := s.safeSpawn()
	// Check if player had debug mode, options, and name before respawning
	var wasDebugMode bool
	var debugOpts debugOptions
	var playerName string
	if existingPlayer := s.players[id]; existingPlayer != nil {
		wasDebugMode = existingPlayer.debugMode
		debugOpts = existingPlayer.debugOpts
		playerName = existingPlayer.name
	}

	// If no existing name, generate default name
	if playerName == "" {
		playerName = fmt.Sprintf("Player-%s", id[:4])
	}

	s.players[id] = &player{
		id:        id,
		name:      playerName,
		x:         pos[0],
		y:         pos[1],
		mass:      INITIAL_PLAYER_MASS,
		color:     randomColor(),
		targetX:   pos[0],
		targetY:   pos[1],
		vx:        0,
		vy:        0,
		spawnTime: time.Now(),
		boosting:  false,
		boostFuel: BOOST_FUEL_MAX,
		debugMode: wasDebugMode, // Preserve debug mode status through respawn
		debugOpts: debugOpts,    // Preserve debug options through respawn
	}
}

func (s *gameServer) ensurePellets() {
	for len(s.pellets) < PELLET_COUNT_TARGET {
		pos := randomPos()
		s.pellets = append(s.pellets, pos)
		ang := rand.Float64() * TAU
		speed := 30 + rand.Float32()*60
		s.pelletVels = append(s.pelletVels, [2]float32{
			float32(math.Cos(ang)) * speed,
			float32(math.Sin(ang)) * speed,
		})
	}
}

func (s *gameServer) ensureCollectibles() {
	for len(s.stars) < STAR_COUNT_TARGET {
		s.stars = append(s.stars, randomPos())
	}
	for len(s.galaxies) < GALAXY_COUNT_TARGET {
		s.galaxies = append(s.galaxies, randomPos())
	}
	for len(s.blackholes) < BLACKHOLE_COUNT_TARGET {
		s.blackholes = append(s.blackholes, randomPos())
	}
}

func applyGravity(px, py float32, centers [][2]float32, centerMass, strength, influenceRadius float32) (float32, float32) {
	var ax, ay float32
	effRadius := influenceRadius * (1.0 + MASS_INFLUENCE_BONUS*centerMass)
	inf2 := effRadius * effRadius
	effStrength := strength * float32(math.Pow(float64(centerMass), ORBIT_MASS_EXP))

	for _, center := range centers {
		cx, cy := center[0], center[1]
		dx := cx - px
		dy := cy - py
		d2 := dx*dx + dy*dy
		if d2 <= inf2 && d2 > 1e-6 {
			inv := 1.0 / float32(math.Sqrt(float64(d2+GRAVITY_SOFTENING*GRAVITY_SOFTENING)))
			ux := dx * inv
			uy := dy * inv
			a := effStrength * inv * inv
			ax += ux * a
			ay += uy * a
		}
	}
	return ax, ay
}

func (s *gameServer) isProtected(p *player) bool {
	return time.Since(p.spawnTime).Seconds() < SPAWN_PROTECTION_S
}

func (s *gameServer) gameTick() {
	s.mu.Lock()
	defer s.mu.Unlock()

	dt := float32(1.0 / TICK_RATE_HZ) // Fixed timestep for consistency
	if dt > MAX_DT {
		dt = MAX_DT
	}

	// Steering + boost for all players
	for _, p := range s.players {
		dx := p.targetX - p.x
		dy := p.targetY - p.y
		dist := float32(math.Hypot(float64(dx), float64(dy)))
		desiredSpeed := speedFromMass(p.mass)

		var ux, uy float32
		if dist > 1e-3 {
			ux = dx / dist
			uy = dy / dist
		}

		desiredVx := ux * desiredSpeed
		desiredVy := uy * desiredSpeed
		ax := (desiredVx - p.vx) * STEER_GAIN
		ay := (desiredVy - p.vy) * STEER_GAIN

		amag := float32(math.Hypot(float64(ax), float64(ay)))
		if amag > STEER_ACCEL {
			s := STEER_ACCEL / amag
			ax *= s
			ay *= s
		}

		cap := float32(math.Max(60, float64(desiredSpeed*1.2)))
		if p.boosting && (p.boostFuel > 0 || (p.debugMode && p.debugOpts.infiniteStamina)) {
			if dist <= 1e-3 {
				vmag := float32(math.Hypot(float64(p.vx), float64(p.vy)))
				if vmag > 1e-6 {
					ux = p.vx / vmag
					uy = p.vy / vmag
				}
			}

			boostAccel := float32(BOOST_ACCEL)
			boostSpeedMult := float32(BOOST_SPEED_MULT)

			// Apply debug mode boost speed multiplier
			if p.debugMode && p.debugOpts.boostSpeedMultiplier > 0 {
				boostSpeedMult *= p.debugOpts.boostSpeedMultiplier
				boostAccel *= p.debugOpts.boostSpeedMultiplier
			}

			ax += ux * boostAccel
			ay += uy * boostAccel
			cap *= boostSpeedMult

			// Debug mode players with infinite stamina have infinite fuel
			if p.debugMode && p.debugOpts.infiniteStamina {
				p.boostFuel = BOOST_FUEL_MAX // Keep fuel at max for debug mode players with infinite stamina
			} else {
				p.boostFuel = float32(math.Max(0, float64(p.boostFuel-BOOST_FUEL_DRAIN_PER_S*dt)))
				if p.boostFuel <= 0 {
					p.boosting = false
				}
			}
		} else {
			// Only regenerate fuel if not in debug mode with infinite stamina
			if !(p.debugMode && p.debugOpts.infiniteStamina) {
				p.boostFuel = float32(math.Min(BOOST_FUEL_MAX, float64(p.boostFuel+BOOST_FUEL_REGEN_PER_S*dt)))
			}
		}

		p.vx += ax * dt
		p.vy += ay * dt

		sp := float32(math.Hypot(float64(p.vx), float64(p.vy)))
		if sp > cap {
			s := cap / sp
			p.vx *= s
			p.vy *= s
		}
		sp = float32(math.Hypot(float64(p.vx), float64(p.vy)))
		if sp > MAX_SPEED {
			s := MAX_SPEED / sp
			p.vx *= s
			p.vy *= s
		}
	}

	// Integrate + damping + walls
	for _, p := range s.players {
		p.x += p.vx * dt
		p.y += p.vy * dt
		decay := float32(math.Exp(-float64(LINEAR_DAMPING * dt)))
		p.vx *= decay
		p.vy *= decay

		if p.x <= 0 || p.x >= WORLD_SIZE {
			p.x = clamp(p.x, 0, WORLD_SIZE)
			p.vx = 0
		}
		if p.y <= 0 || p.y >= WORLD_SIZE {
			p.y = clamp(p.y, 0, WORLD_SIZE)
			p.vy = 0
		}
	}

	// Pellets gravity
	if len(s.stars) > 0 || len(s.galaxies) > 0 || len(s.blackholes) > 0 {
		for i := range s.pellets {
			px, py := s.pellets[i][0], s.pellets[i][1]
			var vx, vy float32
			if i < len(s.pelletVels) {
				vx, vy = s.pelletVels[i][0], s.pelletVels[i][1]
			}

			var ax, ay float32
			if len(s.stars) > 0 {
				gx, gy := applyGravity(px, py, s.stars, STAR_MASS, STAR_GRAVITY*PELLET_GRAVITY_MULTIPLIER, STAR_INFLUENCE_RADIUS)
				ax += gx
				ay += gy
			}
			if len(s.galaxies) > 0 {
				gx, gy := applyGravity(px, py, s.galaxies, GALAXY_MASS, GALAXY_GRAVITY*PELLET_GRAVITY_MULTIPLIER, GALAXY_INFLUENCE_RADIUS)
				ax += gx
				ay += gy
			}
			if len(s.blackholes) > 0 {
				gx, gy := applyGravity(px, py, s.blackholes, BLACKHOLE_MASS, BLACKHOLE_GRAVITY*PELLET_GRAVITY_MULTIPLIER, BLACKHOLE_INFLUENCE_RADIUS)
				ax += gx
				ay += gy
			}

			vx += ax * dt
			vy += ay * dt
			dec := float32(math.Exp(-float64(PELLET_DAMPING * dt)))
			vx *= dec
			vy *= dec

			sp := float32(math.Hypot(float64(vx), float64(vy)))
			if sp > PELLET_MAX_SPEED {
				s := PELLET_MAX_SPEED / sp
				vx *= s
				vy *= s
			}

			px = clamp(px+vx*dt, 0, WORLD_SIZE)
			py = clamp(py+vy*dt, 0, WORLD_SIZE)
			s.pellets[i] = [2]float32{px, py}
			if i < len(s.pelletVels) {
				s.pelletVels[i] = [2]float32{vx, vy}
			}
		}
	}

	// Collision detection and eating
	s.handleCollisions()
	s.checkMassLimits()
	s.ensurePellets()
	s.ensureCollectibles()

	// Broadcast state to all subscribers
	s.broadcastState()
}

func (s *gameServer) handleCollisions() {
	// Player vs pellets
	for _, p := range s.players {
		pr := radiusFromMass(p.mass)
		pelletR := radiusFromMass(PELLET_MASS)

		var toRemove []int
		for i, pellet := range s.pellets {
			px, py := pellet[0], pellet[1]
			dx := p.x - px
			dy := p.y - py
			if dx*dx+dy*dy <= (pr+pelletR)*(pr+pelletR) {
				toRemove = append(toRemove, i)
			}
		}

		// Remove pellets (from end to start)
		for k := len(toRemove) - 1; k >= 0; k-- {
			idx := toRemove[k]
			s.pellets = append(s.pellets[:idx], s.pellets[idx+1:]...)
			if idx < len(s.pelletVels) {
				s.pelletVels = append(s.pelletVels[:idx], s.pelletVels[idx+1:]...)
			}
			massGain := float32(PELLET_MASS)
			if p.debugMode && p.debugOpts.massMultiplier > 0 {
				massGain *= p.debugOpts.massMultiplier
			}
			p.mass += massGain
		}

		// Player vs stars
		for i := len(s.stars) - 1; i >= 0; i-- {
			sx, sy := s.stars[i][0], s.stars[i][1]
			dx := p.x - sx
			dy := p.y - sy
			if dx*dx+dy*dy <= (pr+radiusFromMass(STAR_MASS))*(pr+radiusFromMass(STAR_MASS)) {
				s.stars = append(s.stars[:i], s.stars[i+1:]...)
				massGain := float32(STAR_MASS)
				if p.debugMode && p.debugOpts.massMultiplier > 0 {
					massGain *= p.debugOpts.massMultiplier
				}
				p.mass += massGain
			}
		}

		// Player vs galaxies
		for i := len(s.galaxies) - 1; i >= 0; i-- {
			gx, gy := s.galaxies[i][0], s.galaxies[i][1]
			dx := p.x - gx
			dy := p.y - gy
			if dx*dx+dy*dy <= (pr+radiusFromMass(GALAXY_MASS))*(pr+radiusFromMass(GALAXY_MASS)) {
				s.galaxies = append(s.galaxies[:i], s.galaxies[i+1:]...)
				massGain := float32(GALAXY_MASS)
				if p.debugMode && p.debugOpts.massMultiplier > 0 {
					massGain *= p.debugOpts.massMultiplier
				}
				p.mass += massGain
			}
		}

		// Player vs blackholes
		for i := len(s.blackholes) - 1; i >= 0; i-- {
			bx, by := s.blackholes[i][0], s.blackholes[i][1]
			dx := p.x - bx
			dy := p.y - by
			if dx*dx+dy*dy <= (pr+radiusFromMass(BLACKHOLE_MASS))*(pr+radiusFromMass(BLACKHOLE_MASS)) {
				s.blackholes = append(s.blackholes[:i], s.blackholes[i+1:]...)
				massGain := float32(BLACKHOLE_MASS)
				if p.debugMode && p.debugOpts.massMultiplier > 0 {
					massGain *= p.debugOpts.massMultiplier
				}
				p.mass += massGain
			}
		}
	}

	// Player vs player
	var playerList []*player
	for _, p := range s.players {
		playerList = append(playerList, p)
	}

	for i := 0; i < len(playerList); i++ {
		for j := i + 1; j < len(playerList); j++ {
			a, b := playerList[i], playerList[j]
			if s.isProtected(a) || s.isProtected(b) {
				continue
			}

			dx := a.x - b.x
			dy := a.y - b.y
			rsum := radiusFromMass(a.mass) + radiusFromMass(b.mass)

			if dx*dx+dy*dy <= rsum*rsum {
				if a.mass >= b.mass*COLLISION_EAT_RATIO {
					a.mass += b.mass * 0.9
					s.respawn(b.id)
				} else if b.mass >= a.mass*COLLISION_EAT_RATIO {
					b.mass += a.mass * 0.9
					s.respawn(a.id)
				}
			}
		}
	}
}

func (s *gameServer) checkMassLimits() {
	// Kill players whose mass exceeds the world size
	var playersToRespawn []string
	for _, p := range s.players {
		if p.mass > WORLD_SIZE*10 {
			playersToRespawn = append(playersToRespawn, p.id)
		}
	}

	// Respawn players that exceeded the mass limit
	for _, playerID := range playersToRespawn {
		s.respawn(playerID)
	}
}

func (s *gameServer) broadcastState() {
	rf := func(v float32) float32 {
		return float32(math.Round(float64(v)*10) / 10)
	}

	// Build player states
	var playerStates []*gamepb.PlayerState
	for _, p := range s.players {
		playerStates = append(playerStates, &gamepb.PlayerState{
			Id:        stringPtr(p.id),
			Name:      stringPtr(p.name),
			X:         float32Ptr(rf(p.x)),
			Y:         float32Ptr(rf(p.y)),
			Mass:      float32Ptr(rf(p.mass)),
			Color:     stringPtr(p.color),
			Protected: boolPtr(s.isProtected(p)),
			Fuel:      float32Ptr((p.boostFuel / BOOST_FUEL_MAX) * 100),
			Boosting:  boolPtr(p.boosting),
			DebugMode: boolPtr(p.debugMode),
		})
	}

	// Build pellets
	var pelletStates []*gamepb.Pellet
	for _, pellet := range s.pellets {
		pelletStates = append(pelletStates, &gamepb.Pellet{
			X: float32Ptr(rf(pellet[0])),
			Y: float32Ptr(rf(pellet[1])),
		})
	}

	// Build massive objects
	var starStates []*gamepb.Massive
	for _, star := range s.stars {
		starStates = append(starStates, &gamepb.Massive{
			X:    float32Ptr(rf(star[0])),
			Y:    float32Ptr(rf(star[1])),
			Mass: float32Ptr(STAR_MASS),
		})
	}

	var galaxyStates []*gamepb.Massive
	for _, galaxy := range s.galaxies {
		galaxyStates = append(galaxyStates, &gamepb.Massive{
			X:    float32Ptr(rf(galaxy[0])),
			Y:    float32Ptr(rf(galaxy[1])),
			Mass: float32Ptr(GALAXY_MASS),
		})
	}

	var blackholeStates []*gamepb.Massive
	for _, blackhole := range s.blackholes {
		blackholeStates = append(blackholeStates, &gamepb.Massive{
			X:    float32Ptr(rf(blackhole[0])),
			Y:    float32Ptr(rf(blackhole[1])),
			Mass: float32Ptr(BLACKHOLE_MASS),
		})
	}

	// Build leaderboard
	sort.Slice(playerStates, func(i, j int) bool {
		return *playerStates[i].Mass > *playerStates[j].Mass
	})
	var leaderboard []*gamepb.PlayerState
	if len(playerStates) > 5 {
		leaderboard = playerStates[:5]
	} else {
		leaderboard = playerStates
	}

	state := &gamepb.State{
		Players:     playerStates,
		Pellets:     pelletStates,
		Stars:       starStates,
		Galaxies:    galaxyStates,
		Blackholes:  blackholeStates,
		Leaderboard: leaderboard,
		World:       &gamepb.World{Size: uint32Ptr(WORLD_SIZE)},
	}

	// Send to all subscribers
	s.subsMu.RLock()
	for stream := range s.subscribers {
		go func(stream gamepb.GameService_StreamStateServer) {
			defer func() { recover() }() // Ignore closed stream errors
			stream.Send(state)
		}(stream)
	}
	s.subsMu.RUnlock()
}

func (s *gameServer) startGameLoop() {
	ticker := time.NewTicker(time.Second / TICK_RATE_HZ)
	defer ticker.Stop()

	for range ticker.C {
		s.gameTick()
	}
}
