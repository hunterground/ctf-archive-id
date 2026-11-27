#!/bin/bash

# Set up environment
export FLASK_APP=app.py
export FLASK_DEBUG=1

# Create database if not exists
if [ ! -f instance/users.db ]; then
    echo "✨ Initializing database..."
    flask shell <<EOF
from app import db
db.create_all()
exit()
EOF
fi

# Start the cute CTF platform 🎀
echo "🌸 Starting CTFify Web Interface..."
flask run --host=0.0.0.0

