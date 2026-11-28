#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

PORT="${1:-${PORT:-44442}}"
IMAGE="${IMAGE:-logged-in}"
CONTAINER="${CONTAINER:-logged-in}"

docker build -t "$IMAGE" .
docker rm -f "$CONTAINER" 2>/dev/null || true
docker run -d --restart unless-stopped --name "$CONTAINER" -p "$PORT":80 "$IMAGE"