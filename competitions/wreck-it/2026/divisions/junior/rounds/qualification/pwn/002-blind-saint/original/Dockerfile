FROM alpine@sha256:28bd5fe8b56d1bd048e5babf5b10710ebe0bae67db86916198a6eec434943f8b

RUN apk add --no-cache socat patchelf
RUN adduser -h /home/ctf -s /bin/sh -D ctf

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod 755 /usr/local/bin/docker-entrypoint.sh

COPY src/chall src/lib.tar.xz /home/ctf/
RUN tar -xJvf /home/ctf/lib.tar.xz -C/home/ctf/ \
    && rm /home/ctf/lib.tar.xz
RUN chmod 755 /home/ctf/chall \
    && chmod 755 /home/ctf/ld-linux-x86-64.so.2 \
    && chmod 755 /home/ctf/libc.so.6 \
    && chown -R root:ctf /home/ctf \
    && patchelf --set-rpath '$ORIGIN' /home/ctf/chall \
    && patchelf --set-interpreter /home/ctf/ld-linux-x86-64.so.2 /home/ctf/chall

WORKDIR /home/ctf
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["socat", "tcp-l:19540,reuseaddr,fork", "exec:./chall,stderr,su=ctf"]
