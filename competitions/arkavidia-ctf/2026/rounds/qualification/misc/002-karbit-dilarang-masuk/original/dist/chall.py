import re, signal
import numpy as np
from Crypto.Util.number import isPrime

def usir_karbit():
    print("Hati hati terdeteksi karbit")
    exit(1)

def cek_surat_nikah(my):
    if not re.fullmatch(r"(?=.*\d)(?=.*[A-Z])(?=.*[a-z])\w*", my, flags=re.ASCII):
        usir_karbit()

    array = np.array(list(map(ord, my)))
    s, p = int(array.sum()), array.prod()

    if isPrime(s) and s == p:
        print(open("flag.txt", "r", encoding="utf-8").read().strip())
    else:
        usir_karbit()

if __name__ == "__main__":
    signal.alarm(7) # gak perlu mikir lama
    my = input("Siapa your kisah kamu?: ").strip()
    cek_surat_nikah(my)