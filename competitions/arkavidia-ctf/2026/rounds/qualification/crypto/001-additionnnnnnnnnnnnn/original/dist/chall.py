#!/usr/local/bin/python
import signal
from Crypto.Util.number import *
from secrets import randbits
import os ; import random ; random.seed(os.urandom(12)) # azuketto style

def main() :
    secrets = [randbits(980) for _ in "Etynso"]
    secrets = sorted(secrets)

    n = getPrime(1024) * getPrime(1024)
    e = 3

    print(f'{n, e = }')

    for _ in range(100):
        cs = [s + random.getrandbits(72) for s in secrets]
        scramble = int(input("scramble: "))
        c = sum([pow(m + scramble, e, n) for m in cs]) % n
        print(f'{c = }')

    print("Free Leaks!")
    print([s & ((1 << 80) - 1) for s in secrets])

    print("Now tell me the secrets!")
    for s in secrets :
        guess = int(input("Guess: "))
        if guess != s :
            print("You Fail!")
            exit(1)

    flag = open('flag.txt', 'r').read().strip()
    print(flag)

    exit(0)

if __name__ == "__main__" :
    signal.alarm(180)
    try :
        main()
    except Exception as e :
        print(e.__class__)
