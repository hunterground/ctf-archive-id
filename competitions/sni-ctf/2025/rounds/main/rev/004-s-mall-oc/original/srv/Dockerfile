FROM pwn.red/jail

# FIX: Use ubuntu:22.04 instead of alpine to get the correct glibc libraries
COPY --from=ubuntu:22.04 / /srv

COPY chall /srv/app/run
COPY flag.txt /srv/app/flag.txt

# Good practice: Ensure the binary is executable
RUN chmod +x /srv/app/run

ENV JAIL_POW=10000 JAIL_TIME=120
