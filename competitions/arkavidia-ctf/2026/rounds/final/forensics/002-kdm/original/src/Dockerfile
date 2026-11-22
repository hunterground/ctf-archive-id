FROM python:3.13-alpine

RUN apk update && apk add --no-cache socat

RUN adduser -D -u 1001 ctf

WORKDIR /home/ctf/chall

COPY ./checker.py /home/ctf/chall/
COPY ./run.sh /home/ctf/chall/

RUN chown -R root:root /home/ctf/chall
RUN chmod 555 /home/ctf/chall/*
USER ctf

CMD ["./run.sh"]