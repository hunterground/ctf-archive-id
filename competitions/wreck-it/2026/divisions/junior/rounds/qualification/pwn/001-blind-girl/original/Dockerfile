FROM debian@sha256:35ae959f6e83ffb465e7614d27b4fddd28288caa551fbca2798367567cce80d3 AS builder

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

COPY src/chall.c src/Makefile .
RUN make

FROM debian@sha256:35ae959f6e83ffb465e7614d27b4fddd28288caa551fbca2798367567cce80d3

RUN apt-get update \
    && apt-get install -y --no-install-recommends socat \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -d /home/ctf -s /bin/bash ctf

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod 755 /usr/local/bin/docker-entrypoint.sh

COPY --from=builder /build/chall /home/ctf/
RUN chmod 755 /home/ctf/chall && chown -R root:ctf /home/ctf

WORKDIR /home/ctf
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["socat", "tcp-l:19530,reuseaddr,fork", "exec:./chall,stderr,su=ctf"]
