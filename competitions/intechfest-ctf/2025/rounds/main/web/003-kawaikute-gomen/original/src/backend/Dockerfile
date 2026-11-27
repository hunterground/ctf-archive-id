# Build stage
FROM golang:1.22-alpine AS builder
WORKDIR /app
ENV GOTOOLCHAIN=auto
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/server ./cmd/server

# Runtime stage
FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=builder /out/server /app/server
COPY music /app/music
EXPOSE 50051
USER nonroot
ENTRYPOINT ["/app/server", "--port", "50051", "--baseDir", "/app"]


