FROM ubuntu:latest

RUN apt-get update 
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /etc/xinetd.d/*

RUN useradd -U -m -s /bin/bash support

WORKDIR /home/support

COPY ./flag.txt .
COPY ./chall .
COPY ./ynetd /usr/bin/ynetd

RUN chown -R root:support /home/support
RUN chmod -R 750 /home/support && chmod 440 flag.txt
RUN chown root:support /usr/bin/ynetd
RUN chmod 750 /usr/bin/ynetd

EXPOSE 43013

CMD ["/usr/bin/ynetd", "-p", "43013", "/home/support/chall"]