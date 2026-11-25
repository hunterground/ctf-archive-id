# The Aurum Ledger (Web Challenge)

A small Node.js + Fastify web challenge with a headless-bot flow. Includes a Docker setup for easy deployment.

## Stack
- Node.js, Fastify, Pug
- SQLite (file DB)
- Puppeteer (system Chrome in Docker)

## Run locally (Node.js)
1. Open terminal at this folder, then:
   - Windows PowerShell
     ```powershell
     cd .\challenge
     npm install
     npm start
     ```
2. App listens on http://127.0.0.1:1337

Notes:
- Routes `/list` and `/alien` are restricted to 127.0.0.1 only.
- The SQLite database file `challenge/feedback.db` is local-only and ignored by Git.

## Run with Docker
1. Build image:
   ```powershell
   docker build -t the_aurum_ledger .
   ```
2. Run container:
   ```powershell
   docker run --rm -p 1337:1337 --name the_aurum_ledger the_aurum_ledger
   ```
3. App available at http://127.0.0.1:1337

## Project layout
- `challenge/` — application code (server, routes, views, static)
- `config/supervisord.conf` — used in container to run the app
- `Dockerfile`, `run_docker.ps1`, `build_docker.sh` — container tooling

## Development
- Do not commit `node_modules` or local DB files.
- See `.gitignore` for ignored artifacts.