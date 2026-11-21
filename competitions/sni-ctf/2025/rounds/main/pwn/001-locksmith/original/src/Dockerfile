FROM pwn.red/jail

COPY --from=alpine / /srv
COPY --chmod=0755 chall /srv/app/run
COPY --chmod=0644 flag.txt /srv/app/flag.txt

ENV JAIL_POW=30000 JAIL_TIME=120
