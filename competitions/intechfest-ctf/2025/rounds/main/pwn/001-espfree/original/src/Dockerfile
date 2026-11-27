FROM ubuntu:latest

RUN apt-get update -y && \
    apt-get dist-upgrade -y && \
    apt-get install -y xinetd build-essential && \
	rm -rf /var/lib/apt/lists/*

RUN useradd -M ctf
WORKDIR /ctf

COPY ./chall.c ./flag.txt ./xinetd.conf ./run.sh ./
RUN gcc -Wall -Wextra -fstack-protector-all -D_FORTIFY_SOURCE=2 -fPIE -pie -Wl,-z,relro,-z,now -o chall chall.c -Wno-implicit-function-declaration

CMD ["xinetd","-dontfork","-f","/ctf/xinetd.conf"]
