FROM ubuntu:24.04@sha256:80dd3c3b9c6cecb9f1667e9290b3bc61b78c2678c02cbdae5f0fea92cc6734ab
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends socat && \
    rm -rf /var/cache/apt/archives /var/lib/apt/lists

COPY chall /app/chall
COPY flag.txt /app/flag.txt

RUN chmod 644 /app/flag.txt && \
    chmod 755 /app/chall

WORKDIR /app

CMD socat -T30 -t30 tcp-l:1337,reuseaddr,fork EXEC:"./chall",stderr,su=nobodyls