import secrets, hashlib, signal

from comms import genpr, rng
from jihyo import Jihyo
from k4tou import K4tou
from middleware import Middleware
from oracle import keygen, run_oracle, lim

def cv_sha256(x: int) -> str:
    return hashlib.sha256(str(x).encode()).hexdigest()

def main():
    mod_prime = genpr(1000)
    print("mod_prime =", mod_prime)

    jihyo_secret = rng.randrange(mod_prime)
    jihyo = Jihyo(secret=jihyo_secret, modulus_n=mod_prime)

    k4tou_ss = rng.randrange(mod_prime)
    k4tou = K4tou(secret=k4tou_ss, modulus_n=mod_prime)

    Middleware(jihyo, k4tou, rounds=1000).run()

    k4tou_secret = secrets.randbelow(lim)

    rsa_n, sig = keygen(secret=k4tou_secret)
    ok2 = run_oracle(rsa_n, k4tou_secret, sig)

    print("Jihyo secret?")
    user_j = input().strip().lower()

    print("K4tou secret?")
    user_k = input().strip().lower()

    truth1 = cv_sha256(jihyo_secret)
    truth2 = cv_sha256(k4tou_secret)

    if ok2 and user_j == truth1 and user_k == truth2:
        print(open('confession.txt', 'r').read())
    else:
        print("nope")

if __name__ == "__main__" :
    signal.alarm(3600*6) # abcd
    try :
        main()
    except Exception as e :
        print(e.__class__)