#!/bin/sh

socat tcp-l:20042,reuseaddr,fork exec:"python3 chall.py"