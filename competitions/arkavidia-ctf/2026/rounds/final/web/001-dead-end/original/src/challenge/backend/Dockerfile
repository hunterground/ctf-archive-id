FROM python:3.11-slim

RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*
RUN useradd -m ctf
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend.py .

# Copy the entrypoint script and make it executable
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Give the ctf user ownership of the app directory for the SQLite database
RUN chown -R ctf:ctf /app

EXPOSE 5555

# Set the entrypoint to our script
ENTRYPOINT ["/entrypoint.sh"]