from fastapi import FastAPI, Request, Header, HTTPException
from fastapi.responses import JSONResponse
import uvicorn
import jwt
import uuid
import sqlite3
import datetime
from contextlib import asynccontextmanager
import numpy
import os

DATABASE = '/app/ctf.db'
SECRET_KEY = os.getenv("SECRET_KEY", "JANGAN_BILANG_SIAPA_SIAPA_YAAA!!")

def get_db():
    db = sqlite3.connect(DATABASE, timeout=10)
    db.execute('PRAGMA journal_mode=WAL;')
    db.row_factory = sqlite3.Row
    return db

@asynccontextmanager
async def lifespan(app: FastAPI):
    db = get_db()
    cursor = db.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            active BOOLEAN NOT NULL CHECK (active IN (0, 1)),
            token TEXT
        )
    ''')
    db.commit()
    db.close()
    yield

app = FastAPI(lifespan=lifespan)

@app.post("/v1/auth/login")
async def login(request: Request):    
    try:
        data = await request.json()
    except Exception:
        data = {}
        
    username = data.get('username', '')
    password = data.get('password', '')

    if len(username) < 11 or len(password) < 11:
        return JSONResponse(status_code=400, content={"status": "error", "message": "Username and password must be >= 11 chars", "tracking_id": str(uuid.uuid1())})

    db = get_db()
    user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    db.close()

    if user and user['password'] == password:
        if user['active']:
            payload = {"username": username, "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=20)}
            access_token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
            return {"status": "success", "message": "Login successful", "access_token": access_token, "tracking_id": str(uuid.uuid1())}
        else:
            return JSONResponse(status_code=403, content={"status": "error", "message": "Account pending activation", "tracking_id": str(uuid.uuid1())})

    return JSONResponse(status_code=401, content={"status": "error", "message": "Invalid credentials", "tracking_id": str(uuid.uuid1())})


@app.post("/v1/debug")
async def debug(request: Request):
    tracking_id = str(uuid.uuid1())
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return JSONResponse(status_code=401, content={"status": "error", "message": "Missing token", "tracking_id": tracking_id})
    
    if request.method == "TRACE":
        return {
            "method": request.method, 
            "path": request.url.path, 
            "headers": dict(request.headers),
            "message": "TRACE diagnostic successful"
        }
    
    try:
        token = auth_header.split(" ")[1]
        jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except Exception:
        return JSONResponse(status_code=401, content={"status": "error", "message": "Invalid token", "tracking_id": tracking_id})
        
    return {"status": "success", "message": "Telemetry synced", "tracking_id": tracking_id}


@app.post("/v1/digest")
async def digest_engine(request: Request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JSONResponse(status_code=401, content={"status": "error", "message": "Missing or invalid token"})

    token = auth_header.split(" ")[1]
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        username = decoded.get("username")
    except Exception:
        return JSONResponse(status_code=401, content={"status": "error", "message": "Invalid token"})

    db = get_db()
    user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    db.close()

    if not user or not user['active']:
        return JSONResponse(status_code=403, content={"status": "error", "message": "Unauthorized. Active session required."})

    try:
        data = await request.json()
    except Exception:
        data = {}
        
    script = data.get('script', '')
    if not script:
        return JSONResponse(status_code=400, content={"status": "error", "message": "No script provided"})

    blacklist = ['sys', 'os', 'system', 'bin', 'sh', 'bash', 'eval', 'exec']
    
    for word in blacklist:
        if word in script.lower():
            print(f"[-] SECURITY ALERT: The keyword '{word}' is strictly blocked!")
            return
        
    allowed_globals = {
        '__builtins__': {}, 
        'numpy': numpy
    }

    try:
        exec(script, allowed_globals, {})
        return {"status": "success", "message": "Task executed successfully."}
    except Exception:
        return JSONResponse(status_code=500, content={"status": "error", "message": "Task execution failed."})


@app.post("/v1/auth/register")
async def register(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}
        
    username = data.get('username', '')
    password = data.get('password', '')

    if len(username) < 11 or len(password) < 11:
        return JSONResponse(status_code=400, content={"status": "error", "message": "Username and password must be >= 11 chars"})

    db = get_db()
    user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    
    if user:
        db.close()
        return JSONResponse(status_code=400, content={"status": "error", "message": "User already exists"})

    activation_token = str(uuid.uuid1())
    db.execute('INSERT INTO users (username, password, active, token) VALUES (?, ?, ?, ?)', 
               (username, password, 0, activation_token))
    db.commit()
    db.close()
    
    print(f"Token activation: {activation_token}", flush=True)

    return {"status": "success", "message": "Your account is ready! Please activate it to get started."}


@app.post("/v1/auth/activate")
async def activate(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}
        
    username = data.get('username', '')
    token = data.get('token', '')

    db = get_db()
    user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()

    if not user:
        db.close()
        return JSONResponse(status_code=404, content={"status": "error", "message": "User not found"})

    if user['active']:
        db.close()
        return {"status": "success", "message": "Account already active"}

    if user['token'] == token:
        db.execute('UPDATE users SET active = 1 WHERE username = ?', (username,))
        db.commit()
        db.close()
        return {"status": "success", "message": "Account activated. You may now login."}

    db.close()
    return JSONResponse(status_code=403, content={"status": "error", "message": "Invalid activation token"})


if __name__ == '__main__':
    uvicorn.run("backend:app", host="0.0.0.0", port=5555, log_level="info")