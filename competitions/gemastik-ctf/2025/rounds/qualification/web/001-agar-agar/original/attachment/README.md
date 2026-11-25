# 🏗 Server Architecture

## 1. Overview

This architecture is composed of:

* **Traefik v3.5** as the **TLS-enabled load balancer** and reverse proxy.
* A **Game Server** exposing a gRPC API (`GameService`) for real-time multiplayer game state management.
* Secure networking and dynamic configuration using **Docker** and file-based providers.

---

## 2. Load Balancer — Traefik

Traefik is responsible for:

* Handling **TLS termination** on port `443`.
* Routing requests based on **Host rules**.
* Providing a **secure API dashboard** (only accessible via HTTPS).
* Loading dynamic configuration from `dynamic.yml`.
* Watching for configuration changes in real-time.

### Configuration Summary

| Feature         | Value                                    |
| --------------- | ---------------------------------------- |
| Image           | `traefik:v3.5`                           |
| Restart Policy  | `unless-stopped`                         |
| TLS Port        | `443` (bound to localhost only)          |
| Docker Provider | Enabled, default exposure disabled       |
| File Provider   | Enabled, watching `/etc/traefik/dynamic` |
| Dashboard       | Enabled at `https://traefik.gemas.tik`   |
| Logging Level   | INFO                                     |

### Key Volume Mounts

* `/var/run/docker.sock` — Read-only for container service discovery.
* `/etc/traefik/dynamic` — File provider directory (dynamic routes, middlewares).
* `/certs` — TLS certificates for HTTPS.

### Example Routing Rule

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.traefik.rule=Host(`traefik.gemas.tik`)"
  - "traefik.http.routers.traefik.entrypoints=websecure"
  - "traefik.http.routers.traefik.tls=true"
  - "traefik.http.routers.traefik.service=api@internal"
```

This routes any HTTPS traffic for `traefik.gemas.tik` to the Traefik dashboard service.

---

## 3. Game Server API — `GameService`

The **GameService** uses **gRPC** to provide a **real-time multiplayer API** for clients.

### Service Overview

| RPC Method      | Direction                | Purpose                                              |
| --------------- | ------------------------ | ---------------------------------------------------- |
| `StreamState`   | Server → Client (stream) | Streams world snapshots at a target tick rate.       |
| `SendInput`     | Client → Server          | Sends player movement or action inputs.              |
| `StartBoost`    | Client → Server          | Initiates a player speed boost.                      |
| `EndBoost`      | Client → Server          | Ends a player speed boost.                           |
| `SetName`       | Client → Server          | Sets the player's display name.                      |
| `Disconnect`    | Client → Server          | Disconnects a player from the game.                  |
| `Welcome`       | Server → Client          | Sends initial world info & player ID.                |
| `ToggleGodMode` | Client ↔ Server          | Enables/disables god mode for a player (admin only). |

### Protocol Buffer Definition

```protobuf
protobuf
syntax = "proto3";
package game;
option go_package = "./ctf;gamepb";

service GameService {
  // Server-streamed world snapshots at a target tick rate
  rpc StreamState(Empty) returns (stream State);
  // Input/control
  rpc SendInput(...) returns (...);
  rpc StartBoost(...) returns (...);
  rpc EndBoost(...) returns (...);
  rpc SetName(...) returns (...);
  rpc Disconnect(...) returns (...);
  // Optional one-shot welcome/world info
  rpc Welcome(...) returns (...);
  // Debug mode functionality
  rpc ToggleDebugMode(...) returns (...);
  rpc SetDebugOptions(...) returns (...);
}
```

---

## 4. High-Level Flow

```plaintext
[ Client ]
   │  gRPC over HTTPS
   ▼
[ Traefik Load Balancer ]
   │  Routes based on Host rules
   ▼
[ Game Server ]
   │
   ├── StreamState → Sends real-time world data
   ├── SendInput / Boost → Receives player actions
   ├── SetName / Disconnect → Manages player sessions
   └── ToggleGodMode → For admin only
```

---

## 5. Security Considerations

* **TLS Termination** at Traefik ensures encrypted client-server communication.
* **`exposedByDefault=false`** prevents accidental exposure of internal services.
* Certificates stored in `/certs` directory should be **managed securely**.
* gRPC endpoints can be **authenticated via middleware** or token validation.
