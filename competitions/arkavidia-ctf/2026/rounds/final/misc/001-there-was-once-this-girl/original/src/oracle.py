import secrets
import sympy
import hashlib
from typing import Tuple

HOLD = 512
lim = 1 << HOLD

def diff(x: int) -> int:
    return sum(int(y) for y in bin(x)[2:])

def gen(bits: int) -> int:
    half = lim // 2
    while True:
        cand = secrets.randbelow(half) + half
        if sympy.isprime(cand) and (cand - 1) % 3 != 0:
            return cand

def keygen(secret: int, bits: int = HOLD) -> Tuple[int, int]:
    e = 3
    while True:
        p = gen(bits)
        q = gen(bits)
        n = p * q
        if n > (1 << 1023):
            break
    phi = (p - 1) * (q - 1)
    d = pow(e, -1, phi)
    sig = pow(secret, d, n)
    return n, sig

def run_oracle(rsa_n: int, secret: int, sig: int) -> bool:
    print("The truth is: " + str(sig))
    while True:
        msg = input().strip()
        if msg == "guess":
            try:
                guess_val = int(input().strip())
            except ValueError:
                print("I'm sorry...")
                return False

            if guess_val == secret:
                h = hashlib.sha256(str(secret).encode()).hexdigest()
                print("Ok, no more games:")
                print(h)
                return True
            else:
                print("I'm sorry...")
                return False

        msg_int = int(msg)
        enc = pow(msg_int, 3, rsa_n)
        print(diff(enc) % 2)