#!/bin/sh
socat tcp-l:8777,reuseaddr,fork exec:"python3 main.py"