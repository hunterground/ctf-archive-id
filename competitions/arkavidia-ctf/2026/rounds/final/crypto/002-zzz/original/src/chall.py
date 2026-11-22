from Crypto.Util.number import *
from monster import chomp
import signal

NBITS = 512
p, q = getPrime(NBITS // 2), getPrime(NBITS // 2)
n = p * q
e = 0x10001
phi = (p - 1) * (q - 1)
d = pow(e, -1, phi)
secret = getRandomRange(0, n)

def menu() :
    print(
"""[1] Decrypt
[2] Claim Flag
[3] Exit"""
    )

def get_bit_at(x, k) :
    return (x >> k) & 1

k = 0
ban_list = {}

def decrypt(c):
    global k
    bits = []
    val = pow(c, d, n)
    for i in range(k, k + 8) :
        bits.append(get_bit_at(val, i % NBITS))
    perm = input("Permutation: ")
    perm = list(map(int, perm.split(" ")))
    assert len(set(perm)) == 8
    bits = [bits[i] for i in perm]
    k = (k + 1) % NBITS
    return chomp(*bits)

def main() :
    print(f"{n, e = }")
    print(f"Encrypted: 0x{pow(secret, e, n):x}")

    for _ in range(15 * NBITS) :
        menu()
        cmd = int(input("> "))
        if cmd == 1 :
            enc = int(input("enc: "), 16) % n
            print(f"dec: 0x{decrypt(enc):x}")
        elif cmd == 2 :
            guess = int(input("secret: "), 16)
            if guess == secret :
                print(open('flag.txt', 'r').read())
            else :
                print("fail")
            exit()
        else :
            exit()

if __name__ == "__main__" :
    signal.alarm(60 * 30)
    try :
        main()
    except Exception as e :
        print(e) # side channel :D