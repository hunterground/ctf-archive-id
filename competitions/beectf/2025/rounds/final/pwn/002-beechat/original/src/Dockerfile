# Use Ubuntu 18.04 as the base image for glibc 2.27
FROM ubuntu:18.04

# Install the C compiler and build tools
RUN apt-get update && \
    apt-get install -y build-essential socat && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /home/ctf

# Copy the source code and the compile script
COPY chall.c /home/ctf/chall.c
COPY compile.sh /home/ctf/compile.sh
COPY flag.txt /home/ctf/flag.txt

RUN chmod +x /home/ctf/compile.sh

RUN /home/ctf/compile.sh

RUN rm /home/ctf/compile.sh /home/ctf/chall.c

RUN chmod 755 /home/ctf/chall && \
    chmod 444 /home/ctf/flag.txt && \
    chown root:root /home/ctf/flag.txt /home/ctf/chall

RUN useradd -m ctf

USER ctf

EXPOSE 3135

ENTRYPOINT ["socat", "TCP-LISTEN:3135,reuseaddr,fork", "EXEC:/home/ctf/chall,stderr"]
