import json
from gmpy2 import is_prime
from random import SystemRandom

rng = SystemRandom()

def relay(sender, receiver, payload):
    print(f"{sender} -> {receiver}: {json.dumps(payload)}")
    intercepted = json.loads(input(">> "))
    return intercepted

def genpr(bits: int) -> int:
    lo, hi = 2 ** (bits - 1), 2 ** bits
    while True:
        cand = (rng.randrange(lo, hi) | 1)
        if is_prime(cand):
            return cand