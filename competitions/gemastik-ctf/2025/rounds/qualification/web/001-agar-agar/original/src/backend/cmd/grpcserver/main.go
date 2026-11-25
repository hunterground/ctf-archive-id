package main

import (
	"log"
	"math/rand"
	"net"
	"os"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"

	gamepb "agaragar/ctf"
)

func main() {
	rand.Seed(time.Now().UnixNano())

	port := os.Getenv("GRPC_PORT")
	if port == "" {
		port = "50051"
	}

	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("listen: %v", err)
	}

	// Initialize game server
	gs := &gameServer{
		players:     make(map[string]*player),
		pellets:     make([][2]float32, 0),
		pelletVels:  make([][2]float32, 0),
		stars:       make([][2]float32, 0),
		galaxies:    make([][2]float32, 0),
		blackholes:  make([][2]float32, 0),
		subscribers: make(map[gamepb.GameService_StreamStateServer]bool),
	}

	// Initialize world
	gs.ensurePellets()
	gs.ensureCollectibles()

	// Start game loop
	go gs.startGameLoop()

	s := grpc.NewServer()

	// Health service
	hs := health.NewServer()
	healthpb.RegisterHealthServer(s, hs)
	// reflection.Register(s)

	gamepb.RegisterGameServiceServer(s, gs)

	log.Printf("gRPC server listening on %s", lis.Addr())
	if err := s.Serve(lis); err != nil {
		log.Fatalf("serve: %v", err)
	}
}
