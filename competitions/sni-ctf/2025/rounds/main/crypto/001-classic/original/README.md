# classic
Created by : `agoyy`
## Deskripsi
classic RSA challenge + hint

## Attachment
- [chall.zip](chall.zip)

## Proof of Concept
DIberikan informasi bahwa
- $p > q$
- ```p_q.bit_length()``` > 500
- $n = .....$
- $X = .....$
- $Y = .....$
- ```e = 0x20002```
- $\frac{1}{p+1}-\frac{1}{q} = \frac{X+Y}{Y+s}$

Yang perlu disadari adalah
1. $\frac{1}{p+1}-\frac{1}{q}$ setara dengan $\frac{q-p-1}{pq+q}$, yang perlu disadari bahwa pecahan ini adalah pecahan sederhana sehingga $\frac{X+Y}{Y+s}$ bisa jadi sudah sederhana, atau bisa di sederhanakan.
2. ```(X+Y)_bit_length()``` sekitar 514 sehingga kita bisa merecover $q-p-1$ dengan memperkirakan kemungkinan faktor dari $X+Y$ yang kurang dari 14 bit.
3. Diperoleh 2 persamaan dengan 2 variabel yakni $n = pq$ dan $p-q-1 = \frac{X+Y}{factor}$, diperoleh nilai $p$ dan $q$
4. RSA pada umumnya dengan kendala tambahan $e$ genap, bisa diperoleh nilai dari $m^2 \pmod n$. dan bisa dilanjutkan dengan tonelli CRT [solvernya](solve.py).
5. brute sedikit karena flag > n
