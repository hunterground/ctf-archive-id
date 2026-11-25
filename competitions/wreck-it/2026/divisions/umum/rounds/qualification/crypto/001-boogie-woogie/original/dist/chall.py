#!/usr/bin/env python3
import os,secrets,hashlib,zlib,base64
R=secrets.SystemRandom()
P=0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f
N=0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141
G=(55066263022277343669578718895168534326250603453777594175500187360389116729240,32670510020758816978083085130507043184471273380659243275938904335757337482424)
F=R.choice((hashlib.sha256,hashlib.sha3_256,hashlib.blake2s,hashlib.sha512));C=R.randrange(17,1<<30)
def H(x):return F(x).digest()
def S(x):return hashlib.sha256(x).digest()
def I(x,l=0):x=int(x);return x.to_bytes(max(l,(x.bit_length()+7)//8 or 1),'big')
def J(x):return int.from_bytes(x,'big') if x else 0
def V(x,m):return pow(x%m,-1,m)
def A(a,b):
    if a is None:return b
    if b is None:return a
    x,y=a;u,v=b
    if x==u and (y+v)%P==0:return None
    m=((3*x*x if a==b else v-y)*V((2*y if a==b else u-x),P))%P
    z=(m*m-x-u)%P
    return z,(m*(x-z)-y)%P
def M(k,g=G):
    k%=N;q=None
    while k:
        if k&1:q=A(q,g)
        g=A(g,g);k//=2
    return q
def E(x):
    if isinstance(x,int):return E(b'' if x==0 else I(x))
    if isinstance(x,bytes):
        if len(x)==1 and x[0]<128:return x
        if len(x)<56:return bytes([128+len(x)])+x
        y=I(len(x));return bytes([183+len(y)])+y+x
    y=b''.join(map(E,x))
    if len(y)<56:return bytes([192+len(y)])+y
    z=I(len(y));return bytes([247+len(z)])+z+y
def Z(f):return J(H(E(f+[C,0,0])))%N
def Q(d):
    x,y=M(d);return H(I(x,32)+I(y,32))[-20:]
def K():return R.randrange(1,N)
def W(d,z,k):
    x,y=M(k);r=x%N;s=V(k,N)*(z+r*d)%N;v=y&1
    if s>N//2:s=N-s;v^=1
    return C*2+35+v,r,s
def X(k,m):
    s=os.urandom(16);q=S(k);z=b'';i=0
    while len(z)<len(m):z+=S(q+s+I(i,4));i+=1
    c=bytes(a^b for a,b in zip(m,z));return s+S(q+s+c)[:16]+c
def B(c,vs):return S(bytes([c])+b''.join(I(x,32) for x in sorted(vs)))
def Wt(d,c):return J(S(bytes([c])+I(d,32))[-8:])
def Pk(d,cs):return S(b'\x01'+I(d,32)+b''.join(I(x,32) for x in cs))
def T(d,k,j,to,t=None,mo=None):
    nn=j+R.randrange(1<<18);gp=R.randrange(1,10**12);gl=R.choice((21000,42000,65000,100000,180000,260000));val=R.randrange(10**17)
    data=os.urandom(R.choice((0,5,9,14,23,37)))
    if t is not None:
        off,L,src,op,le=mo;mod=(1<<(8*L))-1;v=(0,nn,gp,gl,val)[src]&mod
        u=(t^v) if op==0 else ((t+v)&mod if op==1 else (t-v)&mod)
        w=I(u,L);w=w[::-1] if le else w;data=os.urandom(off)+w+os.urandom(R.randrange(5,25))
    f=[nn,gp,gl,R.choice(to),val,data]
    return E(f+list(W(d,Z(f),k)))

d=[K() for _ in range(340)];to=[Q(K()) for _ in range(24)];j=0;L=[[] for _ in range(8)]
A0=list(range(0,8));B0=list(range(8,14));C0=list(range(14,20));D0=list(range(20,27));E0=list(range(27,33));F0=list(range(33,41));G0=list(range(41,47));H0=list(range(47,53));I0=list(range(53,58));J0=list(range(58,65));K0=list(range(65,72));L0=list(range(72,78));U=list(range(78,340))
def put(z,i,k,t=None,mo=None):
    j = 0
    j+=1;z.append(T(d[i],k,j,to,t,mo))
def rr(z,a,b):
    k=K();put(z,a,k);put(z,b,k if R.randrange(2) else N-k)
def af(z,a,b,lim=2300):
    k=K();m=R.choice((-9,-8,-7,-6,-5,-4,-3,-2,2,3,4,5,6,7,8,9));q=R.randrange(-lim,lim+1) or 31
    put(z,a,k);put(z,b,(m*k+q)%N)
def selfaf(z,a,lim=2300):
    k=K();m=R.choice((-9,-8,-7,-6,-5,-4,-3,-2,2,3,4,5,6,7,8,9));q=R.randrange(-lim,lim+1) or -37
    put(z,a,k);put(z,a,(m*k+q)%N)
def poly(z,a,deg):
    Lb=5;hi=1<<(8*Lb-5);co=[K() for _ in range(deg+1)];ts=R.sample(range(1<<20,hi),deg+2)
    mo=(4,Lb,3,0,0)
    for t in ts:put(z,a,sum(co[i]*pow(t,i,N) for i in range(deg+1))%N,t,mo)
    return co
def npoly(z,a,deg,eb=1):
    Lb=5;hi=1<<(8*Lb-5);co=[K() for _ in range(deg+1)];ts=R.sample(range(1<<21,hi),deg+2)
    mo=(4,Lb,3,0,0);es=[0]*len(ts)
    for u in R.sample(range(len(ts)),2):es[u]=R.choice((-eb,eb))
    for t,e in zip(ts,es):put(z,a,(sum(co[i]*pow(t,i,N) for i in range(deg+1))+e)%N,t,mo)
    return co,es
def wadepak(z,pool,m=5):
    for _ in range(m):put(z,R.choice(pool),K())
    for _ in range(R.randrange(1,3)):
        g=R.sample(U,R.randrange(3,6));k=K()
        for x in g:put(z,x,k if R.randrange(2) else N-k)
    if R.randrange(2)==0:
        a,b=R.sample(U,2);af(z,a,b,700)
    R.shuffle(z)
c0=poly(L[0],A0[0],6)
af(L[1],A0[0],A0[1]);rr(L[1],A0[1],A0[2]);af(L[1],A0[2],A0[3]);rr(L[1],A0[3],A0[4]);af(L[1],A0[4],A0[5]);rr(L[1],A0[5],A0[6])
rr(L[2],B0[0],B0[1]);rr(L[2],B0[0],B0[1]);af(L[2],B0[1],B0[2]);rr(L[2],B0[2],B0[3]);af(L[2],B0[3],B0[4]);rr(L[2],B0[4],B0[5])
selfaf(L[3],C0[0]);rr(L[3],C0[0],C0[1]);af(L[3],C0[1],C0[2]);rr(L[3],C0[2],C0[3]);af(L[3],C0[3],C0[4]);mk=K();put(L[3],C0[4],mk)
c1=poly(L[4],D0[0],5);af(L[4],D0[0],D0[1]);rr(L[4],D0[1],D0[2]);af(L[4],D0[2],D0[3]);rr(L[4],D0[3],D0[4]);rr(L[4],E0[0],E0[1]);rr(L[4],E0[0],E0[1]);af(L[4],E0[1],E0[2]);rr(L[4],E0[2],E0[3]);af(L[4],E0[3],E0[4])
af(L[5],D0[4],F0[0]);rr(L[5],F0[0],F0[1]);af(L[5],F0[1],F0[2]);rr(L[5],F0[2],F0[3]);af(L[5],F0[3],F0[4]);rr(L[5],F0[4],F0[5]);af(L[5],F0[5],F0[6]);rr(L[5],G0[0],G0[1]);rr(L[5],G0[0],G0[1]);af(L[5],G0[1],G0[2]);rr(L[5],G0[2],G0[3]);af(L[5],G0[3],G0[4])
c2=poly(L[6],H0[0],4);af(L[6],H0[0],H0[1]);rr(L[6],H0[1],H0[2]);af(L[6],H0[2],H0[3]);rr(L[6],H0[3],H0[4]);af(L[6],F0[6],I0[0]);rr(L[6],I0[0],I0[1]);af(L[6],I0[1],I0[2]);rr(L[6],I0[2],I0[3])
rr(L[7],J0[0],J0[1]);rr(L[7],J0[0],J0[1]);af(L[7],J0[1],J0[2]);rr(L[7],J0[2],J0[3]);af(L[7],J0[3],J0[4]);rr(L[7],J0[4],J0[5]);af(L[7],H0[4],K0[0]);rr(L[7],K0[0],K0[1]);af(L[7],K0[1],K0[2]);rr(L[7],K0[2],K0[3]);af(L[7],K0[3],K0[4])
nc0,ne0=npoly(L[7],L0[0],4,1)
for i,p,m in ((0,A0+U,4),(1,A0+U,4),(2,B0+U,5),(3,C0+U,5),(4,D0+E0+U,6),(5,F0+G0+U,6),(6,H0+I0+U,6),(7,J0+K0+U,8)):wadepak(L[i],p,m)
f=open('flag.txt','rb').read().strip()
final=[d[A0[6]],d[B0[5]],d[C0[4]],d[D0[4]],d[E0[4]],d[F0[6]],d[H0[0]],d[H0[4]],d[I0[3]],d[J0[5]],d[K0[4]],d[L0[0]]]
sel1=R.sample(final,8)
sel2=R.sample(final,9)
mod=1<<64
def Mn(dom,k,sel):
    tg=[sum(Wt(x,dom*4+i) for x in sel)%mod for i in range(3)]
    return E([dom,k,255]+[I(x,8) for x in tg]+[os.urandom(11)])
salt=R.randrange(1<<25,1<<26)
m1=Mn(10,8,sel1);m2=Mn(12,9,sel2)
core=S(B(10,sel1)+B(12,sel2))
L[7].append(X(B(9,[d[L0[0]]]),E([m1,m2,X(S(core+I(salt,4)),f),os.urandom(19),E([os.urandom(5),os.urandom(12)])])))
L[6].append(X(Pk(d[H0[0]],c2),E(L[7])))
L[5].append(X(B(6,[d[A0[6]],d[B0[5]],d[C0[4]],d[D0[4]],d[E0[4]],d[F0[6]]]),E(L[6])))
L[4].append(X(B(5,[d[C0[4]],d[D0[4]],d[E0[4]]]),E(L[5])))
L[3].append(X(B(4,[mk]),E(L[4])))
L[2].append(X(B(3,[d[A0[6]],d[B0[5]]]),E(L[3])))
L[1].append(X(B(2,[d[A0[6]]]),E(L[2])))
L[0].append(X(Pk(d[A0[0]],c0),E(L[1])))
R.shuffle(L[0])
out = base64.b85encode(zlib.compress(E(L[0]), 9)).decode()

with open("out.txt", "w") as f:
    f.write(out + "\n")
