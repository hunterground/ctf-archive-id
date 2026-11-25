# Use the official Bun image
FROM oven/bun:1 as base

WORKDIR /app

# install curl
# RUN apt-get update && apt-get install -y curl

# Copy package.json and install dependencies
COPY package.json ./
RUN bun install

# Copy the proto file from backend (this will be handled by docker-compose context)
COPY ctf/ ./ctf/

# Copy the rest of the application code
COPY . .

# Create skins directory
RUN mkdir -p static/skins

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables
ENV PORT=5000
ENV GRPC_ADDR=backend:50051

# Start the application
CMD ["bun", "run", "start"]
