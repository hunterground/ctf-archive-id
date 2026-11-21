FROM python:3.11-alpine
RUN apk add --no-cache socat libffi-dev openssl-dev
RUN adduser -D ctf
WORKDIR /home/ctf/chall
COPY . .
RUN chown -R root:root /home/ctf/chall && \
    chmod -R 555 /home/ctf/chall && \
    chmod +x /home/ctf/chall/run.sh

USER ctf
CMD ["./run.sh"]
