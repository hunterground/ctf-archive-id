#!/bin/sh

exec timeout 600 qemu-system-x86_64 \
    -m 64M \
    -nographic \
    -kernel bzImage \
    -initrd rootfs.cpio.gz \
    -append "console=ttyS0 quiet nosmap" \
    -drive file=flag,format=raw,index=0,media=disk,snapshot=on \
    -no-reboot \
    -cpu kvm64,+smep \
    -monitor /dev/null \
    -net nic,model=virtio \
    -net user \
    -serial mon:stdio
