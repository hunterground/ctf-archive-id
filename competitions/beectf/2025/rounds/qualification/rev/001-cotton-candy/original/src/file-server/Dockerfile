# Dockerfile
FROM python:3.12-slim

# Install tini (proper signal handling) and add non-root user
RUN apt-get update && apt-get install -y --no-install-recommends tini \
  && rm -rf /var/lib/apt/lists/* \
  && useradd -m -u 10001 appuser

WORKDIR /app
# Copy your script (rename to server.py here; adjust if your filename differs)
COPY server.py /app/server.py
COPY not-a-malware.exe /app/not-a-malware.exe

# Run as non-root
USER appuser

# Helpful defaults
ENV PYTHONUNBUFFERED=1

# The server listens here
EXPOSE 6969

# Use tini as init for clean shutdowns
ENTRYPOINT ["/usr/bin/tini","--"]

# Sensible defaults; override on `docker run` as needed
CMD ["python3","/app/server.py","--file","/app/not-a-malware.exe","--user","petir","--pass","du4rm4ntab","--host","0.0.0.0","--port","6969"]
