FROM pwn.red/jail
COPY --from=python:latest / /srv
COPY server.py /srv/app/run

ENV JAIL_TIME 300

RUN chmod 755 /srv/app/run