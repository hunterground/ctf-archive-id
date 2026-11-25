# Build stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/grpcserver

# Final stage
FROM alpine:latest

# Install ca-certificates for SSL/TLS
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/main .

# Copy proto files (needed for runtime)
COPY --from=builder /app/ctf ./ctf

# Expose the gRPC port
EXPOSE 50051

# Set environment variables
ENV GRPC_PORT=50051

# Run the binary
CMD ["./main"]
