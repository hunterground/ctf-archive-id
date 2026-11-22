#!/usr/bin/env python3
import signal
from math import gcd, ceil
from hashlib import sha256
import os, time, random as rng
from Crypto.Util.number import bytes_to_long, getPrime, isPrime, inverse

def search(n, h):
    k = n >> 1
    t = 1 << (k - 1)

    num = (t << 1) + t
    den = (h << 2) + h
    lo0 = num // den
    hi0 = t // h

    twoh = h << 1
    lo1 = (t - 1 + twoh - 1) // twoh
    hi1 = ((1 << k) - 2) // twoh

    lo = max(lo0, lo1)
    hi = min(hi0, hi1)
    return int(lo), int(hi)

def ask(n, h):
    lo, hi = search(n, h)
    while True:
        u = rng.randrange(lo, hi + 1)
        x = (h * (u << 1)) + 1
        if isPrime(x):
            return x, u

def write(n, gm):
    gb = int(ceil(n * gm))
    while True:
        h = getPrime(gb)
        p, u = ask(n, h)

        while True:
            q, v = ask(n, h)
            if gcd(u, v) == 1:
                break

        nn = p * q
        if nn.bit_length() == n:
            return p, q, h, u, v

def main():
    rounds = 10 # cuz Arkavidia 10 :P
    nbits = 1024

    seed = int(time.time()) ^ int.from_bytes(os.urandom(8), "big")
    rng.seed(seed)

    dbits = int(nbits * 0.21)
    msb_bits = int(nbits * 0.08)
    lsb_bits = int(nbits * 0.08)

    for i in range(1, rounds + 1):
        target = sha256(os.urandom(32)).hexdigest()

        p, q, h, u, v = write(nbits, 0.25)
        n = p * q
        l = (h * (u << 1)) * v

        while True:
            d = getPrime(dbits)
            if gcd(d, l) != 1:
                continue
            e = inverse(d, l)
            if gcd(e, n - 1) == 1:
                break

        z1 = d >> (dbits - msb_bits)
        z2 = d & ((1 << lsb_bits) - 1)

        m = bytes_to_long(target.encode())
        assert m < n
        c = pow(m, e, n)

        print(f"=== Round {i}/{rounds} ===")
        print(f"N={n}")
        print(f"e={e}")
        print(f"z1={z1}")
        print(f"z2={z2}")
        print(f"c={c}")

        inp = input(">> ").strip()
        if inp == target:
            print("Nice!\n")
        else:
            print("Fail!")
            exit(1)

    print("[Judge]: Here are your reward: ")
    print(open("flag.txt", "r", encoding="utf-8").read().strip())

if __name__ == "__main__":
    try:
        signal.signal(signal.SIGALRM, lambda *args: 1/0)
        signal.alarm(40)
        main()
    except Exception:
        print("\n[Judge]: Sorry, better luck next time.\n")