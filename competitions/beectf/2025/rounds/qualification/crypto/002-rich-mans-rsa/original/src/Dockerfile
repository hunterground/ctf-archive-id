FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN apt update --fix-missing && apt install libseccomp-dev python3 python3-pip socat -y

RUN groupadd -r ctf && useradd -r -g ctf ctf

RUN pip install pycryptodome

ENV TERM=linux
ENV TERMINFO=/etc/terminfo

WORKDIR /home/ctf

COPY chall.py .
COPY flag.txt .
COPY secret.txt .

RUN chmod 440 /home/ctf/flag.txt
RUN chmod 440 /home/ctf/secret.txt
RUN chmod 550 /home/ctf/chall.py

RUN echo '#!/bin/bash' > /home/ctf/run \
    && echo 'cd /home/ctf && exec python3 chall.py' >> /home/ctf/run
RUN chmod 750 /home/ctf/run

RUN chown -R root:ctf /home/ctf

EXPOSE 5959

CMD socat TCP-L:5959,fork EXEC:"/home/ctf/run",reuseaddr,stderr