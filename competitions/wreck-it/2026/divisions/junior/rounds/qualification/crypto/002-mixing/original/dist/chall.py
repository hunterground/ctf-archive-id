#!/usr/bin/env python3
from secrets import flag
import os
from Crypto.Util.number import getPrime

P = getPrime(512)
while P % 4 != 3:
    P = getPrime(512)
    
A = int.from_bytes(os.urandom(64), 'big') % P
Y1 = int.from_bytes(flag.ljust(64, b'\x00'), 'big')
X1 = int.from_bytes(os.urandom(64), 'big') % P
B = (Y1**2 - X1**3 - A*X1) % P
X = [X1]
for _ in range(5):
    curr_X = X[-1]
    num = (curr_X**2 - A)**2 - 8*B*curr_X
    den = 4*(curr_X**3 + A*curr_X + B)
    
    next_X = (num * pow(den, -1, P)) % P
    X.append(next_X)

with open("out.txt", "w") as f:
    f.write("data = " + repr(X))
