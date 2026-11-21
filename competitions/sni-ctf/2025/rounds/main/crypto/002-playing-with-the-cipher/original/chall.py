#!/usr/bin/env python3
import os, binascii
from cipher import key_schedule as ks, enc_block, _f

flag = open("flag.txt", "rb").read() 
n        = 443426488243037769948249630619149892803
rand_vals = (0x1234, 0x5678, 0x9ABC, 0xDEF0, 0x1111)

def evaluate(x, m):
    acc = 0
    power = 1
    for c in rand_vals:
        acc = (acc + c * power) % m
        power = (power * x) % m
    return acc

def ops(x):
    x0 = x % 3
    t0, t1, t2, t3, t4 = [c % 3 for c in rand_vals]
    x2 = (x0 * x0) % 3
    x3 = (x2 * x0) % 3
    return (t1 + 2 * t2 * x0 + 3 * t3 * x2 + 4 * t4 * x3) % 3

while True:
    secret = int.from_bytes(os.urandom(16), "big") % n
    if ops(secret) != 0:
        break

check = evaluate(secret, n)
check2 = check & ((1 << 128) - 1)

k = secret.to_bytes(32, "big")[-16:]
r = ks(k)

def ch(z, n=8):
    return [z[i:i+n].ljust(n, b"\x00") for i in range(0, len(z), n)]

ct = b"".join(enc_block(t, r) for t in ch(flag, 8))
print("ct =", ct.hex())

hex_charset = set("0123456789abcdefABCDEF")

def is_hex(s):
    return len(s) % 2 == 0 and all(c in hex_charset for c in s)

def st():
    if not hasattr(st, "b"):
        st.b = bytearray(4)
    return st.b

def le():
    return 8 + ((os.urandom(3))[0] & 7)

def ls():
    return 1 + ((os.urandom(3))[1] & 1)

def s6(pt):
    q = int.from_bytes(pt, 'big')
    L = (q >> 32) & 0xFFFFFFFF
    R = q & 0xFFFFFFFF
    for i in range(6):
        T = _f(i + 1, R, r[i])
        L, R = R, (L ^ T) & 0xFFFFFFFF
    return L, R

def go():
    b = st()
    if b[0] >= le():
        print("bye")
        exit(0)
    t = input("pt: ").strip()
    if not (is_hex(t) and len(t) == 16):
        print("zzz")
        return
    w = binascii.unhexlify(t)
    print(binascii.hexlify(enc_block(w, r)).decode())
    b[0] = (b[0] + 1) & 0xFF

def pk1():
    b = st()
    if b[2] & 1:
        print("zzz")
        return
    t = input("pt: ").strip()
    if not (is_hex(t) and len(t) == 16):
        print("zzz")
        return
    _ = binascii.unhexlify(t)

    low = check2 & ((1 << 64) - 1)
    b[2] |= 1
    print(f"a={low:016X}")

def pk2():
    b = st()
    if b[2] & 2:
        print("zzz")
        return
    t = input("pt: ").strip()
    if not (is_hex(t) and len(t) == 16):
        print("zzz")
        return
    _ = binascii.unhexlify(t)

    high = (check2 >> 64) & ((1 << 64) - 1)
    b[2] |= 2
    print(f"b={high:016X}")

def ok():
    b = st()
    if b[1] >= ls():
        print("bye")
        exit(0)
    t = input("key: ").strip()
    if not (is_hex(t) and len(t) == 32):
        print("zzz")
        b[1] = (b[1] + 1) & 0xFF
        return
    a = binascii.unhexlify(t)
    print("nice" if a == k else "zzz")
    b[1] = (b[1] + 1) & 0xFF

while True:
    opt = input(">> ").strip().lower()
    if opt in ("1", "enc"):
        go()
    elif opt in ("2", "submit"):
        ok()
    elif opt in ("3", "peek1"):
        pk1()
    elif opt in ("4", "peek2"):
        pk2()
    elif opt in ("5", "exit"):
        print("bye")
        break
    else:
        print("zzz")
