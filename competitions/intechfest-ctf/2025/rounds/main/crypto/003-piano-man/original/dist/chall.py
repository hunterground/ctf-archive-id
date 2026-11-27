from Crypto.Util.strxor import strxor
from Crypto.Util.number import getPrime
from secrets import randbelow
from hashlib import sha3_512
T = 20
R = 74
flag=open('flag.txt', 'rb').read()
r=getPrime(80)
k=getPrime(70)
gs=[randbelow(2**64)*65537 for _ in range(T+1)]
out=[((k+r*(g^r)))>>R for g in gs]
ct=strxor(flag,sha3_512(f"{gs};{[r]}".encode()).digest()[:len(flag)])
with open('out2.txt','w+') as f:
    f.write(f'{out=}\n')
    f.write(f'{ct=}\n')