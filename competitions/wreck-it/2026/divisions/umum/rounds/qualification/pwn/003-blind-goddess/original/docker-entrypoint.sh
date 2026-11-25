#!/bin/sh

set -xe

echo "$FLAG" > /app/flag.txt
chown root:ctf /app/flag.txt
chmod 440 /app/flag.txt
unset FLAG

exec "$@"
