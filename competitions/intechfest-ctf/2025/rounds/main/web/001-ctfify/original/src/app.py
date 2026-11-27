from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import subprocess
import shlex
import os
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
import secrets

app = Flask(__name__)
app.config['SECRET_KEY'] = secrets.token_hex(32)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

BASE_WORKSPACE = os.path.join(os.path.dirname(__file__), 'ctf_workspaces')

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    workspace_token = db.Column(db.String(36), unique=True, nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    if request.method == 'POST':
        username = request.form['username']
        password = generate_password_hash(request.form['password'])
        
        if User.query.filter_by(username=username).first():
            flash('Username already exists. Please choose a different one.', 'error')
            return render_template('auth/register.html')
            
        new_user = User(username=username, password=password)
        new_user.workspace_token = str(uuid.uuid4())
        db.session.add(new_user)
        db.session.commit()
        
        # Create user's workspace using UUID token
        user_workspace = os.path.join(BASE_WORKSPACE, new_user.workspace_token)
        os.makedirs(user_workspace, exist_ok=True)
        
        return redirect(url_for('login'))
    
    return render_template('auth/register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for('index'))
        flash('Invalid credentials!', 'error')
        return render_template('auth/login.html')
    
    return render_template('auth/login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/', methods=['GET', 'POST'])
@login_required
def index():
    result = None
    if request.method == 'POST':
        ctf_args = request.form.get('ctf_args', '')
        try:
            user_workspace = os.path.join(BASE_WORKSPACE, current_user.workspace_token)
            command = ['ctfify'] + shlex.split(ctf_args)

            process = subprocess.run(
                command,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                cwd=user_workspace,
                timeout=30
            )
            result = process.stdout
        except subprocess.TimeoutExpired:
            result = "Command timed out after 30 seconds"
        except subprocess.CalledProcessError as e:
            result = f"Error: {e.output}"
        except Exception as e:
            result = f"Unexpected error: {str(e)}"
    
    return render_template('index.html', result=result)

# Error Handlers
@app.errorhandler(404)
def page_not_found(e):
    return render_template('error.html', error_code=404, error_message="Page Not Found", error_description="The page you are looking for does not exist."), 404

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('error.html', error_code=500, error_message="Internal Server Error", error_description="An error occurred on the server. Please try again later or contact the administrator."), 500

if __name__ == '__main__':
    app.run()
