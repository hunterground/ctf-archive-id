FROM ubuntu:24.04@sha256:cd1dba651b3080c3686ecf4e3c4220f026b521fb76978881737d24f200828b2b
ENV DEBIAN_FRONTEND noninteractive

# Challenge setup. Not important.
RUN apt-get -y update --fix-missing && \
    apt-get -y install xinetd
RUN groupadd -r pwn && useradd -r -g pwn pwn

RUN echo '#!/bin/bash\n\
service xinetd restart && /bin/sleep infinity' > /etc/init.sh
RUN echo 'service pwn\n\
{\n\
  type = UNLISTED\n\
  disable = no\n\
  socket_type = stream\n\
  protocol = tcp\n\
  wait = no\n\
  user = pwn\n\
  bind = 0.0.0.0\n\
  port = 9999\n\
  server = /home/pwn/chall\n\
}' > /etc/xinetd.d/pwn
RUN chmod 500 /etc/init.sh
RUN chmod 444 /etc/xinetd.d/pwn
RUN chmod 1733 /tmp /var/tmp /dev/shm

# The flag is here
COPY ./flag.txt /flag.txt
RUN chmod 444 /flag.txt

WORKDIR /home/pwn
ADD --chmod=550 chall .

# The challenge is working on port 9999
RUN chown -R root:pwn /home/pwn
RUN service xinetd restart
