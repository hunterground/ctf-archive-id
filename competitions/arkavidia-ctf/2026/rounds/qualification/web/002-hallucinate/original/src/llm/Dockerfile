FROM python:3.11-slim

WORKDIR /app

# Install only what llama-cpp-python needs
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    llama-cpp-python>=0.3.0

# Download model
RUN mkdir -p /app/models && \
    apt-get update && apt-get install -y curl && \
    curl -SfL \
    https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf \
    -o /app/models/llama-3.2-1b-instruct-q4_k_m.gguf && \
    apt-get purge -y curl && \
    rm -rf /var/lib/apt/lists/*

COPY app.py .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

# The easiest way to host this externally is to use the existing Docker configuration. You can build and run just the LLM container on your external server:

# Transfer the llm/ folder to your external host.

# Build the image:

# Bash

# docker build -t konoha-llm ./llm
# Run the container:

# Bash

# docker run -d -p 8000:8000 --name llm-service konoha-llm
# Note: Ensure your external firewall allows traffic on port 8000.
