#!/bin/bash

# 1. Generate the random filename and write the flag at run-time
RAND_NAME=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)

echo "$FLAG" > /${RAND_NAME}

# Make it read-only for everyone
chmod 444 /${RAND_NAME}

# 2. Drop privileges and execute the backend app as the 'ctf' user
exec runuser -u ctf -- python backend.py