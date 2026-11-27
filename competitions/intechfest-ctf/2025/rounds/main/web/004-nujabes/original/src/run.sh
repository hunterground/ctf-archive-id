#!/bin/bash

set -e

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <slug> <mode: start|stop>"
  exit 1
fi

slug="$1"
mode="$2"

if [[ "$mode" == "start" ]]; then
  echo "[*] Building and starting all services for project: $slug"
  docker compose -p "$slug" up --build -d

  while true; do
    echo "[*] Resetting proxy container..."

    docker compose -p "$slug" stop proxy
    docker compose -p "$slug" rm -f proxy
    rm -rf ./.docker/log/*
    docker compose -p "$slug" up -d --build proxy
    echo "[✓] Proxy reset complete. Waiting 3 minutes..."
    sleep 180
  done

elif [[ "$mode" == "stop" ]]; then
  echo "[*] Stopping all services for project: $slug"
  docker compose -p "$slug" down
else
  echo "[!] Invalid mode: $mode"
  echo "Use 'start' or 'stop'"
  exit 1
fi
