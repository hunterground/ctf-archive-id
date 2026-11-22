FROM archlinux@sha256:417aa2d3e8e4cc8377360a94bf48ae1ed38e593cbecfcb34feb16d57e3efa1b5 AS app

# Set environment variables to avoid prompts during installation
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV PACMAN_KEYRING=/etc/pacman.d/gnupg

# Update system and install required packages
RUN pacman -Syu --noconfirm \
    && pacman -S --noconfirm qemu-base qemu-system-x86 socat \
    && pacman -Scc --noconfirm

WORKDIR /app

COPY --chmod=555 run.sh .
COPY bzImage rootfs.cpio.gz flag .

CMD socat TCP-LISTEN:8998,reuseaddr,fork EXEC:"./run.sh",pty,stderr,setsid,sigint,echo=0
