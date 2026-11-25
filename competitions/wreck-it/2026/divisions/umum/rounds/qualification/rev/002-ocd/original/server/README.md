# OCD Auth Server

## Run

```powershell
python -m pip install -r requirements.txt
python -m uvicorn app:app --host 0.0.0.0 --port 21341
```

## Docker

```powershell
docker build -t ocd-auth-server .
docker run --rm -p 21341:21341 ocd-auth-server
```

## Endpoint

POST /login

```json
{ "username": "bearwa", "password": "photocalc-2026" }
```
