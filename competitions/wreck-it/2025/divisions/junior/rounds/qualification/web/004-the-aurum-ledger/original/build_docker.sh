#!/bin/bash
docker rm -f the_aurum_ledger
docker build -t the_aurum_ledger . && \
docker run --name=the_aurum_ledger --rm -p1337:1337 -it the_aurum_ledger