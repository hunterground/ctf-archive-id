#!/bin/sh
export PYTHONDONTWRITEBYTECODE=1 

socat tcp-l:8342,reuseaddr,fork exec:"python3 checker.py"