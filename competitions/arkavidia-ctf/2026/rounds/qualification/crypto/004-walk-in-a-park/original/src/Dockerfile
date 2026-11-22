FROM sagemath/sagemath:latest

RUN sudo apt-get update && sudo apt install -y socat

RUN mkdir /home/sage/ctf

RUN mkdir /home/sage/ctf/src

COPY ./chall.sage /home/sage/ctf/src
COPY ./run.sh /home/sage/ctf/src
COPY ./flag.txt /home/sage/ctf/src

WORKDIR /home/sage/ctf/src

CMD ["sudo", "./run.sh"]