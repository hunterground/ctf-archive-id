#!/bin/sh
socat tcp-l:8455,reuseaddr,fork exec:"python3 chall.py"

