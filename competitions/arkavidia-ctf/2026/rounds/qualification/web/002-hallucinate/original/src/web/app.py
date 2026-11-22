import os
import re
import uuid
import requests
import pymysql
from pathlib import Path
from functools import lru_cache
from typing import List
from flask import Flask, request, render_template, session
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__, template_folder="templates", static_folder="static")
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY") or os.urandom(32)

# Rate Limiter setup: 3 requests per 15 minutes per session
limiter = Limiter(
    key_func=lambda: session.get("uid", get_remote_address()),
    app=app,
    storage_uri="memory://",
)

DB_HOST = os.environ.get("DB_HOST", "db")
DB_USER = os.environ.get("DB_USER", "predictor_user")
DB_PASS = os.environ.get("DB_PASS", "prediksi_jayajayajaya")
DB_NAME = "konoha_oracle"

KEYWORDS_FILE = Path(__file__).parent.joinpath("sql_keywords.txt")

@lru_cache(maxsize=1)
def _load_keywords(path: Path = KEYWORDS_FILE) -> List[str]:
    words = []
    if not path.exists(): return words
    with path.open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line and not line.startswith("#"): words.append(line)
    return words

def sanitize_output(v: str) -> str:
    if not v: return ""
    words = _load_keywords()
    if words:
        pattern = "|".join([re.escape(w) for w in words])
        v = re.sub(pattern, "", v, flags=re.IGNORECASE)
    return v

def get_conn():
    return pymysql.connect(
        host=DB_HOST, user=DB_USER, password=DB_PASS, database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor, autocommit=True
    )

@app.before_request
def ensure_session():
    if "uid" not in session:
        session["uid"] = str(uuid.uuid4())

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/search")
@limiter.limit("3 per 15 minutes")
def search():
    name1 = request.args.get("name1", "")
    name2 = request.args.get("name2", "")

    try:
        llm_url = os.environ.get("LLM_URL", "http://llm:8000/predict")
        r = requests.get(llm_url, params={"name1": name1, "name2": name2}, timeout=45)
        prophecy = r.json().get("result", "The stars are silent.")
    except:
        prophecy = "The Oracle is currently meditating."
    
    prophecy = sanitize_output(prophecy)

    exec_query = f"INSERT INTO fate_logs (session_id, prophecy) VALUES ('{session['uid']}', '{prophecy}')"
    
    rows = []
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute(exec_query)

            cur.execute(f"SELECT prophecy FROM fate_logs WHERE session_id = '{session['uid']}' ORDER BY id DESC")
            rows = cur.fetchall()
    except Exception as e:
        return render_template("results.html", error=str(e), exec_query=exec_query)
    finally:
        conn.close()

    return render_template("results.html", exec_query=exec_query, rows=rows)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)