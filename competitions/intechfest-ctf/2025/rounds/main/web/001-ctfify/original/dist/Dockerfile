FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies including Go
RUN apt-get update && apt-get install -y \
    gcc \
    wget \
    curl \
    git \
    bash \
    ca-certificates \
    tar \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Go (pinned stable version)
ARG GO_VERSION=1.25.1
RUN curl -fsSLo /tmp/go.tar.gz https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz \
    && rm -rf /usr/local/go \
    && tar -C /usr/local -xzf /tmp/go.tar.gz \
    && rm /tmp/go.tar.gz

# Set Go environment variables
ENV PATH="/usr/local/go/bin:${PATH}"
ENV GOPATH="/go"
ENV PATH="${GOPATH}/bin:${PATH}"

# Install ctfify
RUN go install github.com/dimasma0305/ctfify@latest

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p instance ctf_workspaces

# Set Flask environment variables
ENV FLASK_APP=app.py
ENV FLASK_DEBUG=1
ENV FLASK_ENV=development

# Expose port
EXPOSE 5000

# Create startup script
RUN echo '#!/bin/bash\n\
if [ ! -f instance/users.db ]; then\n\
    echo "✨ Initializing database..."\n\
    python -c "from app import app, db; app.app_context().push(); db.create_all()"\n\
fi\n\
echo "🌸 Starting CTFify Web Interface..."\n\
flask run --host=0.0.0.0' > /app/start.sh && chmod +x /app/start.sh


# make user ctfify (Debian/Ubuntu syntax)
RUN useradd -m -u 1001 -s /bin/bash ctfify \
    && chown -R ctfify:ctfify /app \
    && chown -R ctfify:ctfify ctf_workspaces instance

RUN mv ./flag.txt /root/flag.txt

RUN go build -o /readflag readflag.go

RUN chmod +s /readflag

USER ctfify

# Run the application
CMD ["/app/start.sh"]
