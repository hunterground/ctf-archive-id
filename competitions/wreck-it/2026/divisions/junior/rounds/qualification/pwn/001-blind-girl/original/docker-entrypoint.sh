#!/bin/sh

set -xe

echo "$FLAG" > /home/ctf/flag.txt
chown root:ctf /home/ctf/flag.txt
chmod 440 /home/ctf/flag.txt
unset FLAG

exec "$@"
