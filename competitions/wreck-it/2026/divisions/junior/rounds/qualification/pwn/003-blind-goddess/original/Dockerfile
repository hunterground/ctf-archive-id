FROM archlinux@sha256:417aa2d3e8e4cc8377360a94bf48ae1ed38e593cbecfcb34feb16d57e3efa1b5

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV PACMAN_KEYRING=/etc/pacman.d/gnupg

RUN pacman -Syu --noconfirm \
    && pacman -S --noconfirm qemu-base qemu-system-x86 socat \
    && pacman -Scc --noconfirm

RUN useradd -m -d /home/ctf -s /bin/bash ctf

WORKDIR /app

COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/
COPY --chmod=755 src/run.sh .
COPY src/bzImage src/initramfs.cpio.gz .

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["socat", "tcp-listen:19550,fork,reuseaddr,max-children=1", "exec:./run.sh,pty,stderr,setsid,sigint,echo=0"]
