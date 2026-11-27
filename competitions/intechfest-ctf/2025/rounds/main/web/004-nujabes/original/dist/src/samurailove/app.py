
# for main app ( just for better readable bcs the source was huge )
import asyncio, logging, os, time, shutil, uuid, subprocess
import threading
import re
from collections import defaultdict, deque
from email.utils import formatdate
from typing import Callable, Deque, Dict, List, Optional, Union, cast

# for proxys
import aioquic
import wsproto
import wsproto.events
from aioquic.asyncio import QuicConnectionProtocol, serve
from aioquic.h0.connection import H0_ALPN, H0Connection
from aioquic.h3.connection import H3_ALPN, H3Connection
from aioquic.h3.events import (
    DatagramReceived, DataReceived, H3Event, HeadersReceived, WebTransportStreamDataReceived,
)
from aioquic.h3.exceptions import NoAvailablePushIDError
from aioquic.quic.configuration import QuicConfiguration
from aioquic.quic.events import DatagramFrameReceived, ProtocolNegotiated, QuicEvent
from aioquic.quic.logger import QuicFileLogger
from aioquic.tls import SessionTicket

try:
    import uvloop
except ImportError:
    uvloop = None

# combined
from flask import Flask, Request, render_template, request, jsonify
from werkzeug.utils import secure_filename
from werkzeug.routing import PathConverter
from pydub import AudioSegment
import requests
from threading import Lock
from asgiref.wsgi import WsgiToAsgi

AsgiApplication = Callable
HttpConnection = Union[H0Connection, H3Connection]
SERVER_NAME = "aioquic/" + aioquic.__version__

        
app = Flask(__name__)

def visible(s: str) -> str:
    out = []
    for ch in s:
        out.append(ch if ch.isprintable() else "")
    return ''.join(out)

class SamuraiLove:
    def __init__(self) -> None:
        self.config = None
    def default_config(self):
        self.config = {
            "UPLOAD_FOLDER": "uploads",
            "STATIC_MUSIC": "static/audio"
        }
    
app.samurailove = SamuraiLove()
app.samurailove.config = {
    "UPLOAD_FOLDER": "uploads"
}
os.makedirs(app.samurailove.config["UPLOAD_FOLDER"], exist_ok=True)
os.makedirs("static/audio", exist_ok=True)

tracks = [
    {
        "id": "1",
        "title": "Aruarian Dance",
        "artist": "Nujabes",
        "duration": "3:45",
        "plays": "2.1M",
        "audio_url": "/static/audio/aru.mp3",
        "image_url": "/static/img/aru.jpg"
    },
    {
        "id": "2",
        "title": "Luv(sic) Part 1",
        "artist": "Nujabes ft. Shing02",
        "duration": "4:36",
        "plays": "2.1M",
        "audio_url": "/static/audio/luvp1.mp3",
        "image_url": "/static/img/aru.jpg"
    },
    {
        "id": "3",
        "title": "Luv(sic) Part 2",
        "myfav": os.getenv("FLAG", "INTECHFEST{0101daythiswasnotrealflagbutahint}"),
        "artist": "Nujabes ft. Shing02",
        "duration": "4:28",
        "plays": "1.9M",
        "audio_url": "/static/audio/luvp2.mp3",
        "image_url": "/static/img/aru.jpg"
    }
]

RATE = 10         
WINDOW = 1.0      
BAN_SECONDS = 60  

ip_hits = defaultdict(deque)   
banned_until: dict[str, float] = {}
malicious_ips: set[str] = set()
_hits_lock = Lock()

def hit_too_fast(req: Request) -> bool:
    ip = req.remote_addr
    now = time.monotonic()
    with _hits_lock:
        exp = banned_until.get(ip)
        if exp and exp > now:
            return True
        elif exp and exp <= now:
            banned_until.pop(ip, None)

        dq = ip_hits[ip]
        cutoff = now - WINDOW
        while dq and dq[0] < cutoff:
            dq.popleft()
        dq.append(now)
        if len(dq) >= RATE:
            malicious_ips.add(ip)
            banned_until[ip] = now + BAN_SECONDS
            return True
    return False

@app.before_request
def global_ratelimit():
    if hit_too_fast(request):
        return jsonify({"error": "Too Many Requests"}), 429

H3_PORT = int(os.getenv("H3_PORT", "4433"))

@app.after_request
def apply_csp(response):
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src *"
    )
    response.headers["Alt-Svc"] = f'h3=":{H3_PORT}"; ma=86400, h3-29=":{H3_PORT}"; ma=86400'
    return response

@app.route("/")
def index():
    return render_template("index.html", tracks=tracks)

malicious_ips = []

@app.route("/antibot")
def antibot():
    ip = request.remote_addr
    malicious_ips.append(ip)
    return "You seem to be a bot. Your IP has been logged."    

@app.route("/song")
def getsong():    
    return render_template("song.html", tracks=tracks)

banger_song_listener = []

allowed_exts = {'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', ''}

@app.route("/check-song", methods=["POST"])
def song():
    if "file" not in request.files:
        return jsonify({"error": "No file part in request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    file.filename = visible(file.filename)
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.samurailove.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    try:
        if request.remote_addr in banger_song_listener:
            ext = os.path.splitext(filename)[1].lstrip(".")
            if ext not in allowed_exts:
                return jsonify({"error": "Unsupported file type"}), 400
            new_name = f"{uuid.uuid4().hex}.{ext}"
            dest_path = os.path.join(app.samurailove.config["STATIC_MUSIC"], new_name)
            shutil.copy(filepath, dest_path)

            title = request.form.get("title", os.path.splitext(filename)[0])
            artist = request.form.get("artist", "Unknown Artist")
            duration = request.form.get("duration", "0")
            image_url = request.form.get("image_url", "/static/img/aru.jpg")
            try:
                requests.get(image_url, timeout=3)
            except Exception:
                pass
            
            title = visible(title)
            new_track = {
                "id": str(uuid.uuid4()),
                "title": title,
                "artist": artist,
                "duration": duration,
                "plays": "0",
                "audio_url": f"/static/audio/{new_name}",
                "image_url": image_url,
                "from_ip": request.remote_addr,
            }
            tracks.append(new_track)
            return jsonify({"success": "Song uploaded successfully"}), 201
        else:
            audio = AudioSegment.from_file(filepath)
            duration = len(audio) / 1000.0
            channels = audio.channels
            frame_rate = audio.frame_rate
            if channels == 2 and frame_rate > 44200 and "nujabes" in filename.lower():
                banger_song_listener.append(request.remote_addr)

            return jsonify({
                "filename": filename,
                "duration_sec": round(duration, 2),
                "channels": channels,
                "frame_rate": frame_rate,
            })
    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({"error": str(e)}), 500
    finally:
        app.samurailove.default_config()
        if os.path.exists(filepath):
            os.remove(filepath)


@app.errorhandler(404)
def handle_404(e):
    path = request.full_path[:-1] if request.full_path.endswith('?') else request.full_path
    clean = visible(path)
    if clean.startswith("/config_upload"):
        new_upload_fldr = request.args.get("upl", "")
        app.samurailove.config["STATIC_MUSIC"] = new_upload_fldr
        return jsonify(status="ok", new_upload_folder=new_upload_fldr) 

    return jsonify(path_clean=clean), 404
    
application = WsgiToAsgi(app)

class HttpRequestHandler:
    def __init__(
        self, *, authority: bytes, connection: HttpConnection, protocol: QuicConnectionProtocol,
        scope: Dict, stream_ended: bool, stream_id: int, transmit: Callable[[], None],
    ) -> None:
        self.authority = authority
        self.connection = connection
        self.protocol = protocol
        self.queue: asyncio.Queue[Dict] = asyncio.Queue()
        self.scope = scope
        self.stream_id = stream_id
        self.transmit = transmit
        if stream_ended:
            self.queue.put_nowait({"type": "http.request"})

    def http_event_received(self, event: H3Event) -> None:
        if isinstance(event, DataReceived):
            self.queue.put_nowait({"type": "http.request","body": event.data,"more_body": not event.stream_ended})
        elif isinstance(event, HeadersReceived) and event.stream_ended:
            self.queue.put_nowait({"type": "http.request","body": b"","more_body": False})

    async def run_asgi(self, app: AsgiApplication) -> None:
        await app(self.scope, self.receive, self.send)

    async def receive(self) -> Dict:
        return await self.queue.get()

    async def send(self, message: Dict) -> None:
        if message["type"] == "http.response.start":
            self.connection.send_headers(
                stream_id=self.stream_id,
                headers=[(b":status", str(message["status"]).encode()),
                         (b"server", SERVER_NAME.encode()),
                         (b"date", formatdate(time.time(), usegmt=True).encode())]
                        + [(k, v) for k, v in message["headers"]],
            )
        elif message["type"] == "http.response.body":
            end_stream =  message.get("body", b"")
            self.connection.send_data(
                stream_id=self.stream_id,
                data=message.get("body", b""),
                end_stream=not message.get("more_body", False),
            )
            if end_stream == b"":
                cast(HttpServerProtocol, self.protocol).stream_finished(self.stream_id)
        elif message["type"] == "http.response.push" and isinstance(self.connection, H3Connection):
            request_headers = [
                (b":method", b"GET"),
                (b":scheme", b"https"),
                (b":authority", self.authority),
                (b":path", message["path"].encode()),
            ] + [(k, v) for k, v in message["headers"]]
            try:
                push_stream_id = self.connection.send_push_promise(stream_id=self.stream_id, headers=request_headers)
            except NoAvailablePushIDError:
                return
            cast(HttpServerProtocol, self.protocol).http_event_received(
                HeadersReceived(headers=request_headers, stream_ended=True, stream_id=push_stream_id)
            )
        self.transmit()

class WebSocketHandler:
    def __init__(self, *, connection: HttpConnection, scope: Dict, stream_id: int, transmit: Callable[[], None]) -> None:
        self.closed = False
        self.connection = connection
        self.http_event_queue: Deque[DataReceived] = deque()
        self.queue: asyncio.Queue[Dict] = asyncio.Queue()
        self.scope = scope
        self.stream_id = stream_id
        self.transmit = transmit
        self.websocket: Optional[wsproto.Connection] = None

    def http_event_received(self, event: H3Event) -> None:
        if isinstance(event, DataReceived) and not self.closed:
            if self.websocket is not None:
                self.websocket.receive_data(event.data)
                for ws_event in self.websocket.events():
                    self.websocket_event_received(ws_event)
            else:
                self.http_event_queue.append(event)

    def websocket_event_received(self, event: wsproto.events.Event) -> None:
        if isinstance(event, wsproto.events.TextMessage):
            self.queue.put_nowait({"type": "websocket.receive", "text": event.data})
        elif isinstance(event, wsproto.events.Message):
            self.queue.put_nowait({"type": "websocket.receive", "bytes": event.data})
        elif isinstance(event, wsproto.events.CloseConnection):
            self.queue.put_nowait({"type": "websocket.disconnect", "code": event.code})

    async def run_asgi(self, app: AsgiApplication) -> None:
        self.queue.put_nowait({"type": "websocket.connect"})
        try:
            await app(self.scope, self.receive, self.send)
        finally:
            if not self.closed:
                await self.send({"type": "websocket.close", "code": 1000})

    async def receive(self) -> Dict:
        return await self.queue.get()

    async def send(self, message: Dict) -> None:
        data = b""
        end_stream = False
        if message["type"] == "websocket.accept":
            subprotocol = message.get("subprotocol")
            self.websocket = wsproto.Connection(wsproto.ConnectionType.SERVER)
            headers = [
                (b":status", b"200"),
                (b"server", SERVER_NAME.encode()),
                (b"date", formatdate(time.time(), usegmt=True).encode()),
            ]
            if subprotocol is not None:
                headers.append((b"sec-websocket-protocol", subprotocol.encode()))
            self.connection.send_headers(stream_id=self.stream_id, headers=headers)
            while self.http_event_queue:
                self.http_event_received(self.http_event_queue.popleft())
        elif message["type"] == "websocket.close":
            if self.websocket is not None:
                data = self.websocket.send(wsproto.events.CloseConnection(code=message["code"]))
            else:
                self.connection.send_headers(stream_id=self.stream_id, headers=[(b":status", b"403")])
            end_stream = True
        elif message["type"] == "websocket.send":
            if message.get("text") is not None:
                data = self.websocket.send(wsproto.events.TextMessage(data=message["text"]))
            elif message.get("bytes") is not None:
                data = self.websocket.send(wsproto.events.Message(data=message["bytes"]))
        if data:
            self.connection.send_data(stream_id=self.stream_id, data=data, end_stream=end_stream)
        if end_stream:
            self.closed = True
        self.transmit()

class WebTransportHandler:
    def __init__(self, *, connection: H3Connection, scope: Dict, stream_id: int, transmit: Callable[[], None]) -> None:
        self.accepted = False
        self.closed = False
        self.connection = connection
        self.http_event_queue: Deque[H3Event] = deque()
        self.queue: asyncio.Queue[Dict] = asyncio.Queue()
        self.scope = scope
        self.stream_id = stream_id
        self.transmit = transmit

    def http_event_received(self, event: H3Event) -> None:
        if not self.closed:
            if self.accepted:
                if isinstance(event, DatagramReceived):
                    self.queue.put_nowait({"data": event.data, "type": "webtransport.datagram.receive"})
                elif isinstance(event, WebTransportStreamDataReceived):
                    self.queue.put_nowait({"data": event.data, "stream": event.stream_id, "type": "webtransport.stream.receive"})
            else:
                self.http_event_queue.append(event)

    async def run_asgi(self, app: AsgiApplication) -> None:
        self.queue.put_nowait({"type": "webtransport.connect"})
        try:
            await app(self.scope, self.receive, self.send)
        finally:
            if not self.closed:
                await self.send({"type": "webtransport.close"})

    async def receive(self) -> Dict:
        return await self.queue.get()

    async def send(self, message: Dict) -> None:
        data = b""
        end_stream = False
        if message["type"] == "webtransport.accept":
            self.accepted = True
            headers = [
                (b":status", b"200"),
                (b"server", SERVER_NAME.encode()),
                (b"date", formatdate(time.time(), usegmt=True).encode()),
                (b"sec-webtransport-http3-draft", b"draft02"),
            ]
            self.connection.send_headers(stream_id=self.stream_id, headers=headers)
            while self.http_event_queue:
                self.http_event_received(self.http_event_queue.popleft())
        elif message["type"] == "webtransport.close":
            if not self.accepted:
                self.connection.send_headers(stream_id=self.stream_id, headers=[(b":status", b"403")])
            end_stream = True
        elif message["type"] == "webtransport.datagram.send":
            self.connection.send_datagram(stream_id=self.stream_id, data=message["data"])
        elif message["type"] == "webtransport.stream.send":
            self.connection._quic.send_stream_data(stream_id=message["stream"], data=message["data"])
        if data or end_stream:
            self.connection.send_data(stream_id=self.stream_id, data=data, end_stream=end_stream)
        if end_stream:
            self.closed = True
        self.transmit()

Handler = Union[HttpRequestHandler, WebSocketHandler, WebTransportHandler]

class HttpServerProtocol(QuicConnectionProtocol):
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._handlers: Dict[int, Handler] = {}
        self._http: Optional[HttpConnection] = None

    def http_event_received(self, event: H3Event) -> None:
        if isinstance(event, HeadersReceived) and event.stream_id not in self._handlers:
            authority = None
            headers = []
            http_version = "0.9" if isinstance(self._http, H0Connection) else "3"
            raw_path = b""
            method = ""
            protocol = None
            for header, value in event.headers:
                if header == b":authority":
                    authority = value; headers.append((b"host", value))
                elif header == b":method":
                    method = value.decode()
                elif header == b":path":
                    # catch antibot crawler such as google bot, bing bot, etc mimic world scenario
                    if b'config_upload' in value:
                        raw_path = b"/antibot"
                    else:
                        raw_path = value
                elif header == b":protocol":
                    protocol = value.decode()
                elif header and not header.startswith(b":"):
                    headers.append((header, value))

            if b"?" in raw_path:
                path_bytes, query_string = raw_path.split(b"?", maxsplit=1)
            else:
                path_bytes, query_string = raw_path, b""

            path = path_bytes.decode()
            
            # catch antibot crawler such as google bot, bing bot, etc mimic world scenario
            if "/check-song" in path:
                path = "/antibot"
           

            # peer address (private API)
            client_addr = self._http._quic._network_paths[0].addr
            client = (client_addr[0], client_addr[1])

            if method == "CONNECT" and protocol == "websocket":
                subprotocols: List[str] = []
                for header, value in event.headers:
                    if header == b"sec-websocket-protocol":
                        subprotocols = [x.strip() for x in value.decode().split(",")]
                scope = {
                    "client": client, "headers": headers, "http_version": http_version,
                    "method": method, "path": path, "query_string": query_string,
                    "raw_path": raw_path, "root_path": "", "scheme": "wss",
                    "subprotocols": subprotocols, "type": "websocket",
                }
                handler: Handler = WebSocketHandler(connection=self._http, scope=scope,
                                                    stream_id=event.stream_id, transmit=self.transmit)
            elif method == "CONNECT" and protocol == "webtransport":
                assert isinstance(self._http, H3Connection), "WebTransport requires HTTP/3"
                scope = {
                    "client": client, "headers": headers, "http_version": http_version,
                    "method": method, "path": path, "query_string": query_string,
                    "raw_path": raw_path, "root_path": "", "scheme": "https",
                    "type": "webtransport",
                }
                handler = WebTransportHandler(connection=self._http, scope=scope,
                                              stream_id=event.stream_id, transmit=self.transmit)
            else:
                extensions: Dict[str, Dict] = {}
                if isinstance(self._http, H3Connection):
                    extensions["http.response.push"] = {}
                scope = {
                    "client": client, "extensions": extensions, "headers": headers,
                    "http_version": http_version, "method": method, "path": path,
                    "query_string": query_string, "raw_path": raw_path,
                    "root_path": "", "scheme": "https", "type": "http",
                }
                handler = HttpRequestHandler(
                    authority=authority, connection=self._http, protocol=self,
                    scope=scope, stream_ended=event.stream_ended,
                    stream_id=event.stream_id, transmit=self.transmit,
                )
            self._handlers[event.stream_id] = handler
            asyncio.ensure_future(handler.run_asgi(application))
        elif isinstance(event, (DataReceived, HeadersReceived)) and event.stream_id in self._handlers:
            self._handlers[event.stream_id].http_event_received(event)
        elif isinstance(event, DatagramReceived):
            self._handlers[event.stream_id].http_event_received(event)
        elif isinstance(event, WebTransportStreamDataReceived):
            self._handlers[event.session_id].http_event_received(event)

    def quic_event_received(self, event: QuicEvent) -> None:
        if isinstance(event, ProtocolNegotiated):
            if event.alpn_protocol in H3_ALPN:
                self._http = H3Connection(self._quic, enable_webtransport=True)
            elif event.alpn_protocol in H0_ALPN:
                self._http = H0Connection(self._quic)
        elif isinstance(event, DatagramFrameReceived):
            if event.data == b"quack":
                self._quic.send_datagram_frame(b"quack-ack")
        if self._http is not None:
            for http_event in self._http.handle_event(event):
                self.http_event_received(http_event)

    def stream_finished(self, stream_id: int) -> None:
        self._handlers.pop(stream_id, None)

class SessionTicketStore:
    def __init__(self) -> None:
        self.tickets: Dict[bytes, SessionTicket] = {}
    def add(self, ticket: SessionTicket) -> None:
        self.tickets[ticket.ticket] = ticket
    def pop(self, label: bytes) -> Optional[SessionTicket]:
        return self.tickets.pop(label, None)

def ensure_self_signed_cert(cert_path="cert.pem", key_path="key.pem", cn="localhost"):
    if os.path.exists(cert_path) and os.path.exists(key_path):
        return
    print(f"[init] generating self-signed cert to {cert_path} / {key_path}")
    try:
        subprocess.check_call([
            "openssl","req","-x509","-newkey","rsa:2048","-nodes",
            "-keyout", key_path, "-out", cert_path, "-days","365",
            "-subj", f"/CN={cn}",
            "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1"
        ])
    except Exception as e:
        raise RuntimeError("Could not create self-signed cert.") from e



def run_tcp_https(host: str, port: int, cert: str, key: str) -> None:
    from flask import Flask
    from werkzeug.serving import make_server

    tcp_app = Flask("tcp_app")

    @tcp_app.route("/")

    def index():
        return render_template("index.html", tracks=tracks)


    @tcp_app.route("/song")
    def getsong():    
        return render_template("leet.html", tracks=tracks)

    
    server = make_server(host, port, tcp_app, ssl_context=(cert, key))
    server.serve_forever()

async def main():
# generate login python

    logging.basicConfig(
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
        level=logging.INFO,
    )

    # Options via env 
    host = os.getenv("H3_HOST", "0.0.0.0")
    port = int(os.getenv("H3_PORT", "4433"))
    cert_file = os.getenv("H3_CERT", "cert.pem")
    key_file  = os.getenv("H3_KEY", "key.pem")
    quic_log_dir = os.getenv("H3_QLOG_DIR")

    ensure_self_signed_cert(cert_file, key_file)

    quic_logger = QuicFileLogger(quic_log_dir) if quic_log_dir else None

    configuration = QuicConfiguration(
        alpn_protocols=H3_ALPN + H0_ALPN + ["siduck"],
        is_client=False,
        max_datagram_frame_size=65536,
        max_datagram_size=1350, 
        quic_logger=quic_logger,
        secrets_log_file=None,
    )
    configuration.load_cert_chain(cert_file, key_file)

    if uvloop is not None:
        uvloop.install()

    # ups sorry, disabled old standard, what is tcp anyway
    threading.Thread(target=run_tcp_https,
                    args=(host, port, cert_file, key_file),
                    daemon=True).start()
    
    print(f"[h3] serving on https://{host}:{port} (HTTP/3 over QUIC, UDP)")
    
    ticket_store = SessionTicketStore()
    
    await serve(
        host,
        port,
        configuration=configuration,
        create_protocol=HttpServerProtocol,
    session_ticket_fetcher=ticket_store.pop,   
    session_ticket_handler=ticket_store.add,     
    retry=False,
    )
    await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
