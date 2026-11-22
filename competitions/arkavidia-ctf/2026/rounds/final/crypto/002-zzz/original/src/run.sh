#!/bin/sh
socat tcp-l:1337,reuseaddr,fork exec:"python3 chall.py"