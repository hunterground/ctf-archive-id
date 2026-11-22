from flask import Flask, render_template, request, redirect, url_for, session, flash, send_from_directory
import redis
import os
import json
import hashlib
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

app = Flask(__name__)
app.secret_key = os.urandom(36)

REDIS_HOST = os.environ.get('REDIS_HOST', 'redis')
REDIS_PORT = int(os.environ.get('REDIS_PORT', 8379))
UPLOAD_BASE = '/data/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'pdf', 'mp4', 'mp3', 'txt', 'zip'}

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def get_user(username):
    data = r.get(f'user:{username}')
    return json.loads(data) if data else None

def save_user(username, user_data):
    r.set(f'user:{username}', json.dumps(user_data))

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def user_upload_dir(username):
    path = os.path.join(UPLOAD_BASE, username)
    os.makedirs(path, exist_ok=True)
    return path

def get_notes(username):
    keys = r.keys(f'note:{username}:*')
    notes = []
    for key in keys:
        data = r.get(key)
        if data:
            note = json.loads(data)
            note['id'] = key.split(':')[-1]
            notes.append(note)
    notes.sort(key=lambda x: x.get('updated_at', ''), reverse=True)
    return notes

def get_note(username, note_id):
    data = r.get(f'note:{username}:{note_id}')
    if data:
        note = json.loads(data)
        note['id'] = note_id
        return note
    return None

@app.route('/')
def index():
    if 'username' not in session:
        return redirect(url_for('login'))
    return redirect(url_for('dashboard'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username', '').strip().lower()
        password = request.form.get('password', '')
        confirm = request.form.get('confirm_password', '')

        if not username or not password:
            flash('Username and password are required.', 'error')
            return render_template('register.html')
        if len(username) < 3:
            flash('Username must be at least 3 characters.', 'error')
            return render_template('register.html')
        if len(password) < 6:
            flash('Password must be at least 6 characters.', 'error')
            return render_template('register.html')
        if password != confirm:
            flash('Passwords do not match.', 'error')
            return render_template('register.html')
        if get_user(username):
            flash('Username already taken.', 'error')
            return render_template('register.html')

        save_user(username, {
            'username': username,
            'password': hash_password(password),
            'created_at': datetime.now().isoformat(),
            'display_name': username
        })
        user_upload_dir(username)
        flash('Account created! Please log in.', 'success')
        return redirect(url_for('login'))

    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip().lower()
        password = request.form.get('password', '')
        user = get_user(username)
        if user and user['password'] == hash_password(password):
            session['username'] = username
            session['display_name'] = user.get('display_name', username)
            return redirect(url_for('dashboard'))
        flash('Invalid username or password.', 'error')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/dashboard')
def dashboard():
    if 'username' not in session:
        return redirect(url_for('login'))
    username = session['username']
    notes = get_notes(username)
    upload_dir = user_upload_dir(username)
    files = []
    for fname in os.listdir(upload_dir):
        fpath = os.path.join(upload_dir, fname)
        stat = os.stat(fpath)
        files.append({
            'name': fname,
            'size': stat.st_size,
            'modified': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M'),
            'ext': fname.rsplit('.', 1)[-1].lower() if '.' in fname else ''
        })
    files.sort(key=lambda x: x['modified'], reverse=True)
    return render_template('dashboard.html', notes=notes, files=files, active='dashboard')

@app.route('/notes')
def notes():
    if 'username' not in session:
        return redirect(url_for('login'))
    notes_list = get_notes(session['username'])
    return render_template('notes.html', notes=notes_list, active='notes')

@app.route('/notes/new', methods=['GET', 'POST'])
def new_note():
    if 'username' not in session:
        return redirect(url_for('login'))
    if request.method == 'POST':
        title = request.form.get('title', 'Untitled').strip()
        content = request.form.get('content', '').strip()
        note_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        r.set(f'note:{session["username"]}:{note_id}', json.dumps({
            'title': title,
            'content': content,
            'created_at': now,
            'updated_at': now
        }))
        flash('Note saved!', 'success')
        return redirect(url_for('notes'))
    return render_template('note_edit.html', note=None, active='notes')

@app.route('/notes/<note_id>/edit', methods=['GET', 'POST'])
def edit_note(note_id):
    if 'username' not in session:
        return redirect(url_for('login'))
    username = session['username']
    note = get_note(username, note_id)
    if not note:
        flash('Note not found.', 'error')
        return redirect(url_for('notes'))
    if request.method == 'POST':
        title = request.form.get('title', 'Untitled').strip()
        content = request.form.get('content', '').strip()
        r.set(f'note:{username}:{note_id}', json.dumps({
            'title': title,
            'content': content,
            'created_at': note.get('created_at'),
            'updated_at': datetime.now().isoformat()
        }))
        flash('Note updated!', 'success')
        return redirect(url_for('notes'))
    return render_template('note_edit.html', note=note, active='notes')

@app.route('/notes/<note_id>/delete', methods=['POST'])
def delete_note(note_id):
    if 'username' not in session:
        return redirect(url_for('login'))
    r.delete(f'note:{session["username"]}:{note_id}')
    flash('Note deleted.', 'success')
    return redirect(url_for('notes'))

@app.route('/files')
def files():
    if 'username' not in session:
        return redirect(url_for('login'))
    username = session['username']
    upload_dir = user_upload_dir(username)
    file_list = []
    for fname in os.listdir(upload_dir):
        fpath = os.path.join(upload_dir, fname)
        stat = os.stat(fpath)
        file_list.append({
            'name': fname,
            'size': stat.st_size,
            'size_human': human_size(stat.st_size),
            'modified': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M'),
            'ext': fname.rsplit('.', 1)[-1].lower() if '.' in fname else 'file'
        })
    file_list.sort(key=lambda x: x['modified'], reverse=True)
    return render_template('files.html', files=file_list, active='files')

def human_size(size):
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size < 1024:
            return f'{size:.1f} {unit}'
        size /= 1024
    return f'{size:.1f} TB'

@app.route('/files/upload', methods=['POST'])
def upload_file():
    if 'username' not in session:
        return redirect(url_for('login'))
    if 'file' not in request.files:
        flash('No file selected.', 'error')
        return redirect(url_for('files'))
    file = request.files['file']
    if file.filename == '':
        flash('No file selected.', 'error')
        return redirect(url_for('files'))
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        upload_dir = user_upload_dir(session['username'])
        file.save(os.path.join(upload_dir, filename))
        flash(f'"{filename}" uploaded successfully!', 'success')
    else:
        flash('File type not allowed.', 'error')
    return redirect(url_for('files'))

@app.route('/files/upload_url', methods=['POST'])
def upload_from_url():
    if 'username' not in session:
        return redirect(url_for('login'))
    url = request.form.get('image_url', '').strip()
    if not url:
        flash('No URL provided.', 'error')
        return redirect(url_for('files'))
    try:
        req = Request(url, headers={'User-Agent': 'Mozilla/5.0'})

        with urlopen(req, timeout=10) as response:
            filename = os.path.basename(url)
            
            if '.' in filename:
                ext = filename.rsplit('.', 1)[1].lower()
                if not allowed_file(filename):
                    flash(f'URL does not point to an image file', 'error')
                    return redirect(url_for('files'))
            else:
                flash('URL does not have a file extension.', 'error')
                return redirect(url_for('files'))
            
            image_data = response.read()
            
            suggested = f'image_{uuid.uuid4().hex[:8]}.{ext}'
            
            upload_dir = user_upload_dir(session['username'])
            save_path = os.path.join(upload_dir, suggested)
            
            with open(save_path, 'wb') as f:
                f.write(image_data)
            
            flash(f'Image downloaded from URL successfully!', 'success')

    except HTTPError as e:
        flash(f'HTTP Error: {e.code} - {e.reason}', 'error')
    except URLError as e:
        flash(f'URL Error: {str(e.reason)}', 'error')
    except Exception as e:
        flash(f'Failed to fetch URL: {str(e)}', 'error')
    return redirect(url_for('files'))

@app.route('/files/download/<filename>')
def download_file(filename):
    if 'username' not in session:
        return redirect(url_for('login'))
    upload_dir = user_upload_dir(session['username'])
    return send_from_directory(upload_dir, filename, as_attachment=True)

@app.route('/files/view/<filename>')
def view_file(filename):
    if 'username' not in session:
        return redirect(url_for('login'))
    upload_dir = user_upload_dir(session['username'])
    return send_from_directory(upload_dir, filename)

@app.route('/files/delete/<filename>', methods=['POST'])
def delete_file(filename):
    if 'username' not in session:
        return redirect(url_for('login'))
    fpath = os.path.join(user_upload_dir(session['username']), secure_filename(filename))
    if os.path.exists(fpath):
        os.remove(fpath)
        flash(f'"{filename}" deleted.', 'success')
    return redirect(url_for('files'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8898, debug=True)


