FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY app.py /app/
COPY qemu-system-riscv64 /app/
COPY requirements.txt /app/
COPY flag.txt /

RUN chmod +x /app/qemu-system-riscv64 && \
    chmod 777 /app && \
    mkdir -p /var/gatekeeper/executor/files
RUN head -c 16 /dev/urandom | tee /var/gatekeeper/executor/enc_key.bin
RUN python -m pip install -r /app/requirements.txt
RUN mv /flag.txt /flag-$(cat /dev/urandom | tr -dc 'a-f0-9' | head -c 32).txt

USER nobody

CMD ["python", "app.py"]
