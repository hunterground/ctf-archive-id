import os
import random
import subprocess
import asyncio
import requests
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Header
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

# --- CONFIGURATION ---
CTFD_URL = "https://ctf.arkavidia.com" 
HOST_IP = "127.0.0.1" 
CHALLENGE_DIR = "challenge" 
INSTANCE_TIMEOUT = 900 # 15 minutes in seconds

# --- STATE MANAGEMENT ---
active_instances = {}
used_ports = set()
state_lock = asyncio.Lock()

def cleanup_orphans():
    print("[*] Sweeping host for orphaned challenge containers...", flush=True)
    try:
        prefix = "deadend_team_" 
        container_req = subprocess.run(
            ["docker", "ps", "-a", "--filter", f"name={prefix}", "--format", "{{.ID}}"],
            capture_output=True, text=True, check=True
        )
        container_ids = container_req.stdout.split()
        if container_ids:
            print(f"[*] Nuking {len(container_ids)} leftover containers...", flush=True)
            subprocess.run(["docker", "rm", "-f"] + container_ids, capture_output=True)

        network_req = subprocess.run(
            ["docker", "network", "ls", "--filter", f"name={prefix}", "--format", "{{.ID}}"],
            capture_output=True, text=True, check=True
        )
        network_ids = network_req.stdout.split()
        if network_ids:
            print(f"[*] Deleting {len(network_ids)} leftover networks...", flush=True)
            subprocess.run(["docker", "network", "rm"] + network_ids, capture_output=True)

        print("[*] Sweep complete. Clean slate.", flush=True)
    except Exception as e:
        print(f"[!] Error during orphan cleanup: {e}", flush=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[*] Instancer Gateway Starting Up...", flush=True)
    cleanup_orphans() 
    yield
    print("\n[*] Instancer Gateway Shutting Down...", flush=True)
    cleanup_orphans()
    print("[*] Shutdown complete. Goodbye.", flush=True)

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _verify_ctfd_token_sync(token: str) -> str:
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json"
    }
    response = requests.get(f"{CTFD_URL}/api/v1/users/me", headers=headers)
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired CTFd token")
    data = response.json().get("data", {})
    team_id = data.get("team_id")
    if not team_id:
        raise HTTPException(status_code=403, detail="You must join a team in CTFd before you can spawn this challenge.")
    return f"team_{team_id}"

async def verify_ctfd_token(token: str) -> str:
    return await asyncio.to_thread(_verify_ctfd_token_sync, token)

# --- NEW: AUTO-DESTROY BACKGROUND TASK ---
async def auto_destroy(entity_id: str, port: int, project_name: str, delay: int):
    try:
        await asyncio.sleep(delay)
        print(f"[*] Time's up for {project_name}. Auto-destroying...", flush=True)
        
        # 1. Lock and mark as destroying
        async with state_lock:
            # Check if it's still the exact same instance running
            if entity_id not in active_instances or active_instances[entity_id]["port"] != port:
                return 
            active_instances[entity_id]["status"] = "destroying"

        # 2. Run Docker Down
        cmd = ["docker", "compose", "-p", project_name, "-f", f"{CHALLENGE_DIR}/docker-compose.yml", "down", "-v"]
        process = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        await process.communicate()

        # 3. Clean up state
        async with state_lock:
            if entity_id in active_instances and active_instances[entity_id]["port"] == port:
                del active_instances[entity_id]
            if port in used_ports:
                used_ports.remove(port)

    except asyncio.CancelledError:
        # Expected behavior if the user manually destroys the container early
        pass

@app.get("/", response_class=HTMLResponse)
def serve_frontend():
    with open("static/index.html", "r") as f:
        return f.read()

@app.post("/start")
async def start_instance(ctfd_token: str = Header(..., alias="X-CTFd-Token")):
    entity_id = await verify_ctfd_token(ctfd_token)
    
    async with state_lock:
        if entity_id in active_instances:
            instance = active_instances[entity_id]
            if instance["status"] == "creating":
                return {"message": "Instance is already being deployed.", "url": None}
            elif instance["status"] == "running":
                return {
                    "message": "Instance already running.", 
                    "url": f"http://{HOST_IP}:{instance['port']}",
                    "expires_at": instance.get("expires_at")
                }
            elif instance["status"] == "destroying":
                raise HTTPException(status_code=400, detail="Instance is currently being destroyed. Please wait.")
        
        available_ports = set(range(8201, 8300)) - used_ports
        if not available_ports:
            raise HTTPException(status_code=503, detail="Server is at maximum capacity.")
        
        port = random.choice(list(available_ports))
        project_name = f"deadend_{entity_id}"
        
        active_instances[entity_id] = {
            "port": port, 
            "project": project_name, 
            "status": "creating"
        }
        used_ports.add(port)

    env = os.environ.copy()
    env["CHALLENGE_PORT"] = str(port)
    cmd = ["docker", "compose", "-p", project_name, "-f", f"{CHALLENGE_DIR}/docker-compose.yml", "up", "--build", "-d"]
    
    try:
        process = await asyncio.create_subprocess_exec(*cmd, env=env, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise Exception("Docker compose failed")
            
        # Update state, calculate expiration, and spawn the background self-destruct task
        expires_at = int(time.time()) + INSTANCE_TIMEOUT
        task = asyncio.create_task(auto_destroy(entity_id, port, project_name, INSTANCE_TIMEOUT))
        
        async with state_lock:
            if entity_id in active_instances:
                active_instances[entity_id]["status"] = "running"
                active_instances[entity_id]["expires_at"] = expires_at
                active_instances[entity_id]["task"] = task
                
        return {"message": "Instance started", "url": f"http://{HOST_IP}:{port}", "expires_at": expires_at}
        
    except Exception as e:
        async with state_lock:
            if entity_id in active_instances:
                del active_instances[entity_id]
            if port in used_ports:
                used_ports.remove(port)
        raise HTTPException(status_code=500, detail="Failed to start challenge instance")

@app.post("/stop")
async def stop_instance(ctfd_token: str = Header(..., alias="X-CTFd-Token")):
    entity_id = await verify_ctfd_token(ctfd_token)
    
    async with state_lock:
        if entity_id not in active_instances:
            raise HTTPException(status_code=404, detail="No active instance found for your team.")
            
        instance = active_instances[entity_id]
        if instance["status"] == "destroying":
            return {"message": "Instance is already being destroyed."}
        if instance["status"] == "creating":
            raise HTTPException(status_code=400, detail="Instance is currently deploying. Please wait.")
            
        instance["status"] = "destroying"
        port = instance["port"]
        project_name = instance["project"]
        
        # --- NEW: CANCEL BACKGROUND TASK ---
        if "task" in instance:
            instance["task"].cancel()

    cmd = ["docker", "compose", "-p", project_name, "-f", f"{CHALLENGE_DIR}/docker-compose.yml", "down", "-v"]
    process = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    await process.communicate()
    
    async with state_lock:
        if entity_id in active_instances:
            del active_instances[entity_id]
        if port in used_ports:
            used_ports.remove(port)
            
    return {"message": "Team instance stopped successfully."}