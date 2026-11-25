#!/usr/bin/env python3
import random
from secrets import token_bytes, randbits, randbelow
from hashlib import sha256, blake2s, sha3_256
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad
from Crypto.Util.number import getPrime, isPrime

flag = open("flag.txt", "rb").read()
R = random.Random(token_bytes(32))

def A():
    return R.getrandbits(32)

def B(n):
    x = 0
    while n:
        k = min(n, A().bit_length() or 1)
        if k > 32:
            k = 32
        x = (x << k) | (A() >> (32 - k))
        n -= k
    return x

def C(n):
    k = n.bit_length()
    while 1:
        x = B(k)
        if x < n:
            return x

def D(v):
    v = list(v)
    for i in range(len(v) - 1, 0, -1):
        j = C(i + 1)
        v[i], v[j] = v[j], v[i]
    return v

def U():
    return ((A() << 32) ^ A())

def V(n):
    return (1 << n) - 1

P0 = [A() for _ in range(624)]

w0 = A().bit_length() + A().bit_length()
while w0 < 48 or w0 > 80:
    w0 = A().bit_length() + A().bit_length()
m0 = 1 << w0
z0 = m0 - 1

def X(t):
    return ((U() ^ (t * 0x9e3779b97f4a7c15)) & z0)

def G(t, o=0, u=1):
    x = X(t)
    y = (U() ^ ((x << 9) & z0) ^ (x >> 13) ^ (t << 17)) & z0
    p = 2 + (x & 31)
    q = 4 + ((y >> 7) & 31)
    v = []
    for i in range(q):
        r = p + i + ((x >> (i & 31)) & 1) + ((y >> ((i + 5) & 31)) & 1)
        if o:
            r = (r << 1) | 1
        v.append(r * u)
    return D(v)

def H(t, o=0, u=1):
    v = G(t, o, u)
    return v[C(len(v))]

def L(x, s, w):
    return x if s == 0 else ((x << s) | (x >> (w - s))) & V(w)

def O(x, s, w):
    return x if s == 0 else ((x >> s) | (x << (w - s))) & V(w)

a0 = H(A())
a1 = H(A())
while not 20 <= a0 + a1 <= 38:
    a0 = H(A())
    a1 = H(A())

a2 = a0 + a1
a3 = H(A()) + H(A())
a4 = H(A(), 1)

while 1:
    a5 = B(a3) | 1
    a6 = pow(a5, a4, m0)
    if a5 > 3 and a6 not in (1, z0):
        break

a7 = H(A(), 0, 4)
while not 104 <= a7 <= 184:
    a7 = H(A(), 0, 4)

a8 = H(A())
a9 = H(A())
aa = [1 + C(H(A())) for _ in range(a7)]

ab = C(4)
ac = C(4)
ad = C(4)
ae = C(3)

af = B(a2)
ag = B(a2) | 1
ah = B(a2)
ai = C(a2)
aj = C(a2)
ak = B(a2)
al = B(a2)

am = H(A())
while not 30 <= am <= 40:
    am = H(A())

q = getPrime(am + 1)
while 1:
    p = 2 * q + 1
    if isPrime(p):
        break
    q = getPrime(am + 1)

while 1:
    g = randbelow(p - 3) + 2
    if pow(g, 2, p) != 1 and pow(g, q, p) != 1:
        break

an = p.bit_length()
ao = C(an)
ap = B(an)
aq = B(an) | 1
ar = B(an)

s = randbits(w0)
r = randbits(w0) | 1
t = randbits(w0)
u = (randbits(w0 - 1) << 1) or 2
v = randbits(w0) | 1

bb = randbits((a2 >> 1) + H(A())) | 1
bc = sum(pow(a5, i, m0) for i in range(a4)) & z0
bd = (bb * pow(bc, -1, m0)) & z0
be = (pow(r, -1, m0) * (bd - (1 - a5) * t)) & z0

def J():
    global s
    s = (a5 * s + be) & z0

def K():
    for _ in range(a4):
        J()
    return (r * s + t) & z0

last = K()
prev = 0

def N():
    global last, prev
    x = K()
    y = (x - last) & z0
    last = x
    z = (y + u * prev) & z0
    prev = y
    return (v * z) & z0

def CUT(x, i):
    y = x
    if ab & 1:
        y ^= af
    if ab & 2:
        y = L(y, ai, an)
    if ac & 1:
        y ^= (ag * i + ah) & V(an)
    if ac & 2:
        y = O(y, aj, an)
    if ad & 1:
        y ^= ak
    if ad & 2:
        y ^= al
    return L(y, ao, an)

def HW(x):
    return x.bit_count()

for _ in range(a8):
    N()

k0 = N()

for _ in range(a9):
    N()

k1 = N()

em = V(am)
lo0 = k0 & em
lo1 = k1 & em

mk = randbits(32)
ml = mk & 0xffff
mr = mk >> 16

sc = []
for i in range(32):
    x = ((mk >> i) & 1)
    y = HW((mk * (i + 1) + lo0 + (lo1 << (i & 7))) & 0xffff)
    sc.append((y << 1) + x + randbelow(3))

def KEY(x, y):
    a = (x ^ ml).to_bytes(8, "big")
    b = (y ^ mr).to_bytes(8, "big")
    s0 = a + b + bytes([randbelow(11)])
    if ae == 0:
        return sha256(s0).digest()[:16]
    if ae == 1:
        return blake2s(s0).digest()[:16]
    return sha3_256(s0).digest()[:16]

ct = AES.new(KEY(lo0, lo1), AES.MODE_ECB).encrypt(pad(flag, 16))

le = []
for i, j in enumerate(aa):
    for _ in range(j):
        y = N()
    y = pow(g, y & em, p)
    y = CUT(y, i)
    if randbelow(100) < 28:
        y = randbits(an)
    le.append(y)

open("out.txt", "w").write(
    f"o={P0!r}\n"
    f"n={p}\n"
    f"r={g}\n"
    f"le={le!r}\n"
    f"sc={sc!r}\n"
    f"ct='{ct.hex()}'\n"
)