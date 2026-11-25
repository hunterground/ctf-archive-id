FROM alpine:3.18.3

# Install packages
RUN apk --no-cache add supervisor make musl-dev gcc go

# Add go to PATH
RUN export GOPATH=/root/go
RUN export PATH=${GOPATH}/bin:/usr/local/go/bin:$PATH
RUN export GOBIN=$GOROOT/bin
RUN mkdir -p ${GOPATH}/src ${GOPATH}/bin
RUN export GO111MODULE=on

# Create auth directory (flag location)
RUN mkdir -p /opt/craftedvitae/.auth

# Copy flag to hidden auth path
COPY flag.txt /opt/craftedvitae/.auth/key.txt

# Set environment variables that leak the flag path
# APP_BASE + AUTH_STORE = full path to flag
ENV APP_NAME=CraftedVitae
ENV APP_VERSION=1.0.3
ENV APP_BASE=/opt/craftedvitae/.auth/
ENV AUTH_STORE=key.txt
ENV THEME_DIR=/app/static/css
ENV ASSET_PATH=/app/static
ENV DEPLOY_ENV=production

# Setup app
RUN mkdir -p /app

# Switch working environment
WORKDIR /app

# Add application
COPY challenge .

# Setup supervisor
COPY config/supervisord.conf /etc/supervisord.conf

# Build server executable
RUN go build -o craftedvitae .

# Expose the port
EXPOSE 1337

# Copy entrypoint
COPY --chown=root entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
