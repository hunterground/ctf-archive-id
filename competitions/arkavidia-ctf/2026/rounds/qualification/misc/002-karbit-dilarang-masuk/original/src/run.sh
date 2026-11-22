#!/bin/sh
socat tcp-l:8780,reuseaddr,fork exec:"python3 chall.py"