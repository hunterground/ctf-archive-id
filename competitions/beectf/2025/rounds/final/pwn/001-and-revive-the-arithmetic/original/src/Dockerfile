FROM ubuntu:25.04

# Install dependencies
RUN apt-get update && \
    apt-get install -y socat && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create challenge directory
WORKDIR /home/ctf

# Copy binary and flag
COPY chall /home/ctf/chall
COPY flag.txt /home/ctf/flag.txt
COPY banner.txt /home/ctf/banner.txt

# Make binary executable and secure the flag
RUN chmod 755 /home/ctf/chall && \
    chmod 444 /home/ctf/flag.txt && \
    chmod 444 /home/ctf/banner.txt && \
    chown root:root /home/ctf/flag.txt /home/ctf/chall /home/ctf/banner.txt

# Add non-privileged user
RUN useradd -m ctf

# Drop privileges to 'ctf' for the challenge binary, but flag.txt stays owned by root and is only readable
USER ctf

# Expose port
EXPOSE 3134

# Launch the challenge with socat
ENTRYPOINT ["socat", "TCP-LISTEN:3134,reuseaddr,fork", "EXEC:/home/ctf/chall,stderr"]
