FROM pwn.red/jail

COPY --from=alpine / /srv
COPY --chmod=0755 chall /srv/app/run
COPY --chmod=0755 ld-linux-x86-64.so.2 libc.so.6 /srv/app/
COPY --chmod=0644 flag.txt /srv/app/

ENV JAIL_TIME=900
