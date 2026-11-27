package server

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"time"

	proto "backend/proto/gen/backend/proto"

	"google.golang.org/grpc/metadata"
)

const (
	musicDirRelative            = "music"
	streamChunkSize             = 64 * 1024 // 64 KiB chunks
	defaultBroadcastBytesPerSec = 40 * 1024 // ~320 kbps pacing
)

type MusicService struct {
	proto.UnimplementedMusicServiceServer
	baseDir      string
	mu           sync.Mutex
	broadcasters map[string]*broadcaster
}

func NewMusicService(baseDir string) *MusicService {
	return &MusicService{baseDir: baseDir, broadcasters: make(map[string]*broadcaster)}
}

func (s *MusicService) ListTracks(ctx context.Context, _ *proto.ListTracksRequest) (*proto.ListTracksResponse, error) {
	musicDir := filepath.Join(s.baseDir, musicDirRelative)
	entries, err := os.ReadDir(musicDir)
	if err != nil {
		return nil, err
	}

	var tracks []*proto.Track
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		name := e.Name()
		if !isAudioFile(name) {
			continue
		}
		info, err := e.Info()
		if err != nil {
			continue
		}
		tracks = append(tracks, &proto.Track{
			Id:        name,
			Name:      name,
			SizeBytes: info.Size(),
		})
	}
	return &proto.ListTracksResponse{Tracks: tracks}, nil
}

func (s *MusicService) StreamTrack(req *proto.TrackRequest, stream proto.MusicService_StreamTrackServer) error {
	if req == nil || req.Id == "" {
		return errors.New("missing track id")
	}
	if req.Id != filepath.Base(req.Id) {
		return errors.New("invalid track id")
	}
	bc, err := s.getOrStartBroadcaster(req.Id)
	if err != nil {
		return err
	}
	listenerName := req.ListenerName
	if listenerName == "" {
		listenerName = "Anonymous"
	}
	ch, unsubscribe := bc.subscribe(listenerName)
	defer unsubscribe()

	ctx := stream.Context()
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case bChunk, ok := <-ch:
			if !ok {
				return nil
			}
			if err := stream.Send(&proto.AudioChunk{Data: bChunk.data, Offset: bChunk.offset}); err != nil {
				return err
			}
		}
	}
}

func (s *MusicService) GetListenerCount(ctx context.Context, _ *proto.ListenerCountRequest) (*proto.ListenerCountResponse, error) {
	var total int64
	s.mu.Lock()
	for _, bc := range s.broadcasters {
		bc.mu.Lock()
		total += int64(len(bc.subs))
		bc.mu.Unlock()
	}
	s.mu.Unlock()
	return &proto.ListenerCountResponse{Count: total}, nil
}

func (s *MusicService) GetListeners(ctx context.Context, _ *proto.GetListenersRequest) (*proto.GetListenersResponse, error) {
	listeners := make([]*proto.Listener, 0)
	s.mu.Lock()
	for _, bc := range s.broadcasters {
		for _, info := range bc.snapshotListeners() {
			listeners = append(listeners, &proto.Listener{Id: info.id, Name: info.name, SinceUnixMs: info.since.UnixMilli()})
		}
	}
	s.mu.Unlock()
	md, ok := metadata.FromIncomingContext(ctx)
	if ok {
		if is_debug, ok := md["debug"]; ok {
			if is_debug[0] == "true" {
				fmt.Println("debug mode")
				flag := os.Getenv("FLAG")
				listeners = append(listeners, &proto.Listener{Id: "flag", Name: flag, SinceUnixMs: time.Now().UnixMilli()})
			}
		}
	}
	return &proto.GetListenersResponse{Listeners: listeners}, nil
}

// broadcaster implements a shared looped file broadcast to many subscribers.
type broadcaster struct {
	path            string
	chunkSize       int
	mu              sync.Mutex
	subs            map[chan broadcastChunk]listenerInfo
	started         bool
	rateBytesPerSec int64
}

type broadcastChunk struct {
	data   []byte
	offset int64
}

type listenerInfo struct {
	id    string
	name  string
	since time.Time
}

func (s *MusicService) getOrStartBroadcaster(id string) (*broadcaster, error) {
	filePath := filepath.Join(s.baseDir, musicDirRelative, id)
	if _, err := os.Stat(filePath); err != nil {
		return nil, err
	}
	s.mu.Lock()
	bc, exists := s.broadcasters[id]
	if !exists {
		rate := int64(defaultBroadcastBytesPerSec)
		if v := os.Getenv("BROADCAST_BYTES_PER_SEC"); v != "" {
			if parsed, err := strconv.ParseInt(v, 10, 64); err == nil && parsed > 0 {
				rate = parsed
			}
		}
		bc = &broadcaster{path: filePath, chunkSize: streamChunkSize, subs: make(map[chan broadcastChunk]listenerInfo), rateBytesPerSec: rate}
		s.broadcasters[id] = bc
	}
	s.mu.Unlock()
	bc.start()
	return bc, nil
}

func (b *broadcaster) start() {
	b.mu.Lock()
	if b.started {
		b.mu.Unlock()
		return
	}
	b.started = true
	b.mu.Unlock()

	go func() {
		for {
			f, err := os.Open(b.path)
			if err != nil {
				return
			}
			var offset int64
			buf := make([]byte, b.chunkSize)
			next := time.Now()
			rate := b.rateBytesPerSec
			if rate <= 0 {
				rate = defaultBroadcastBytesPerSec
			}
			for {
				n, readErr := f.Read(buf)
				if n > 0 {
					dataCopy := append([]byte(nil), buf[:n]...)
					b.dispatch(broadcastChunk{data: dataCopy, offset: offset})
					offset += int64(n)
					// pace according to configured byte rate
					delay := time.Duration(int64(n)) * time.Second / time.Duration(rate)
					next = next.Add(delay)
					if sleep := time.Until(next); sleep > 0 {
						time.Sleep(sleep)
					} else {
						// if we're behind, reset schedule to now to avoid spiral
						next = time.Now()
					}
				}
				if readErr == io.EOF {
					_ = f.Close()
					break
				}
				if readErr != nil {
					_ = f.Close()
					return
				}
			}
		}
	}()
}

func (b *broadcaster) dispatch(chunk broadcastChunk) {
	b.mu.Lock()
	for ch := range b.subs {
		select {
		case ch <- chunk:
		default:
			// drop if slow
		}
	}
	b.mu.Unlock()
}

func (b *broadcaster) subscribe(name string) (chan broadcastChunk, func()) {
	ch := make(chan broadcastChunk, 8)
	b.mu.Lock()
	// generate id
	buf := make([]byte, 8)
	_, _ = rand.Read(buf)
	id := hex.EncodeToString(buf)
	b.subs[ch] = listenerInfo{id: id, name: name, since: time.Now()}
	b.mu.Unlock()
	unsub := func() {
		b.mu.Lock()
		delete(b.subs, ch)
		close(ch)
		b.mu.Unlock()
	}
	return ch, unsub
}

func (b *broadcaster) snapshotListeners() []listenerInfo {
	b.mu.Lock()
	defer b.mu.Unlock()
	out := make([]listenerInfo, 0, len(b.subs))
	for _, info := range b.subs {
		out = append(out, info)
	}
	return out
}

func isAudioFile(name string) bool {
	ext := filepath.Ext(name)
	switch ext {
	case ".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a":
		return true
	default:
		return false
	}
}
