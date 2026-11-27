package main

import (
	"flag"
	"fmt"
	"log"
	"net"
	"os"
	"path/filepath"

	"backend/internal/server"
	proto "backend/proto/gen/backend/proto"

	"google.golang.org/grpc/reflection"

	"google.golang.org/grpc"
)

func main() {
	var (
		port       = flag.Int("port", 50051, "gRPC server port")
		baseDirArg = flag.String("baseDir", ".", "Base directory (project root)")
	)
	flag.Parse()

	baseDir, err := filepath.Abs(*baseDirArg)
	if err != nil {
		log.Fatalf("failed resolving baseDir: %v", err)
	}
	if _, err := os.Stat(filepath.Join(baseDir, "music")); err != nil {
		log.Printf("warning: music directory not found at %s", filepath.Join(baseDir, "music"))
	}

	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", *port))
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	grpcServer := grpc.NewServer()
	proto.RegisterMusicServiceServer(grpcServer, server.NewMusicService(baseDir))
	reflection.Register(grpcServer)

	log.Printf("music gRPC server listening on :%d (baseDir=%s)", *port, baseDir)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
