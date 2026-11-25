from __future__ import annotations

import base64
import hmac
import json
import time
from hashlib import sha256
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

APP_SECRET = b"photocalc-premium-secret"
TOKEN_TTL_SECONDS = 15
USERNAME = "admin_ocd"
SECRET_PART_A = "chroma"
SECRET_PART_B = "shift"
KEY_COUNT = 100
COUNTER_XOR = 0x5A17

app = FastAPI()


class LoginRequest(BaseModel):
    username: str
    key: str
    session_id: str


def _sign(payload: dict[str, Any]) -> str:
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    sig = hmac.new(APP_SECRET, raw, sha256).digest()
    return base64.urlsafe_b64encode(sig).decode("ascii").rstrip("=")


def _secret() -> str:
    return f"{SECRET_PART_A}{SECRET_PART_B}"


def _format_key(digest_hex: str) -> str:
    chunk = digest_hex[:8].upper()
    return f"PCP-{chunk[:4]}-{chunk[4:]}"


def _mix_counter(counter: int) -> int:
    return counter ^ COUNTER_XOR


def _generate_keys() -> list[str]:
    keys: list[str] = []
    secret = _secret()
    for counter in range(KEY_COUNT):
        mixed = _mix_counter(counter)
        raw = f"{USERNAME}:{secret}:{mixed}".encode("utf-8")
        digest = sha256(raw).hexdigest()
        keys.append(_format_key(digest))
    return keys


def _hash_key(key: str) -> str:
    return sha256(key.encode("utf-8")).hexdigest()


VALID_HASHES = set(map(_hash_key, _generate_keys()))


@app.post("/login")
def login(req: LoginRequest) -> dict[str, Any]:
    # Server only validates hashed licenses and usage state.
    if req.username.strip() != USERNAME:
        raise HTTPException(status_code=401, detail="invalid username")
    license_hash = _hash_key(req.key.strip().upper())
    if license_hash not in VALID_HASHES:
        raise HTTPException(status_code=401, detail="invalid license")

    now = int(time.time())
    payload = {
        "sub": USERNAME,
        "exp": now + TOKEN_TTL_SECONDS,
        "premium": True,
    }
    token = {"payload": payload, "sig": _sign(payload)}

    return {
        "token": base64.urlsafe_b64encode(json.dumps(token).encode("utf-8")).decode("ascii"),
        "expires_in": TOKEN_TTL_SECONDS,
    }
