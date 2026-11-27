FROM ubuntu:latest

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libz1 \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy the main binary
COPY main /app/main

# Make the binary executable
RUN chmod +x /app/main

# Create static directory for the server
RUN mkdir -p /app/static

# Expose port 5000
EXPOSE 5000

# Set environment variable
ENV FLAG=INTECHFEST{aku-baru-tau-kalo-oob-di-argv-bisa-ngeleak-env-kwaokwaokawokawo}

# Run the application
CMD ["./main"]
