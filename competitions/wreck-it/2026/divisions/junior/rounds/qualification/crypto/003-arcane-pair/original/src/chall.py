from hashlib import sha512
from os import urandom

F = open("flag.txt", "rb").read()
I = lambda x: int.from_bytes(sha512(x).digest(), "big")
X = lambda a, b: bytes(i ^ j for i, j in zip(a, b))

t = urandom(8)
P = (1 << 127) - 1
A, B = I(t+b"A") % P, I(t+b"B") % P
G = (I(t+b"X") % P, I(t+b"Y") % P)
N = 1 << 42

def o(x, y):
    a, b = x; c, d = y
    return ((a*c + b*d*B) % P, (a*d + b*c + b*d*A) % P)

def e(x, n):
    r = (1, 0)
    while n:
        if n & 1: r = o(r, x)
        x = o(x, x); n >>= 1
    return r

def z(k, n):
    r = b""; i = 0
    while len(r) < n:
        r += sha512(k+i.to_bytes(4, "big")).digest(); i += 1
    return r[:n]

s = int.from_bytes(urandom(6), "big") % N
q = e(G, s)
m = F + urandom(16 - len(F) % 16)
k = sha512(t + str(s).encode()).digest()
c = X(m, z(k, len(m)))

open("out.txt", "w").write(f"{t.hex()}\n{q[0]}\n{q[1]}\n{c.hex()}\n")