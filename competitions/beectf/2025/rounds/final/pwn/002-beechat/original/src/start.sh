#!/usr/bin/env bash
set -euxo pipefail
cd "$(dirname "$0")"
export COMPOSE_PROJECT_NAME=beechat
if docker compose version >/dev/null 2>&1; then
    DC="docker compose"
elif command -v docker-compose >/dev/null; then
    DC="docker-compose"
else
    echo "Docker Compose not found" >&2
    exit 127
fi
$DC down -v --rmi all --remove-orphans || true
$DC pull || true
$DC build --pull
$DC up -d --force-recreate --renew-anon-volumes
