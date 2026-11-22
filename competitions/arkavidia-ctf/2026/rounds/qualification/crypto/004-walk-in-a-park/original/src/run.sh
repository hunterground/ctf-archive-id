#!/bin/sh
socat tcp-l:8010,reuseaddr,fork exec:"sage chall.sage"