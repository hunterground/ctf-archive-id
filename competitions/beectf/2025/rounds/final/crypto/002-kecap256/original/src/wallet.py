import random

def _rotl64(value, shift):
    return ((value << shift) | (value >> (64 - shift))) & 0xFFFFFFFFFFFFFFFF

class _Kecap256:
    _RC = [
        0x0000000000000001, 0x0000000000008082, 0x800000000000808A, 0x8000000080008000,
        0x000000000000808B, 0x0000000080000001, 0x8000000080008081, 0x8000000000008009,
        0x000000000000008A, 0x0000000000000088, 0x0000000080008009, 0x000000008000000A,
        0x000000008000808B, 0x800000000000008B, 0x8000000000008089, 0x8000000000008003,
        0x8000000000008002, 0x8000000000000080, 0x000000000000800A, 0x800000008000000A,
        0x8000000080008081, 0x8000000000008080, 0x0000000080000001, 0x8000000080008008,
    ]

    _RHO = [
        [0, 36, 3, 41, 18],
        [1, 44, 10, 45, 2],
        [62, 6, 43, 15, 61],
        [28, 55, 25, 21, 56],
        [27, 20, 39, 8, 14],
    ]

    def __init__(self):
        self._state = [0] * 25
        self._rate_bytes = 136
        self._buffer = bytearray()

    def update(self, data):
        if not isinstance(data, (bytes, bytearray)):
            raise TypeError("data must be bytes-like")
        self._buffer.extend(data)
        while len(self._buffer) >= self._rate_bytes:
            block = self._buffer[: self._rate_bytes]
            del self._buffer[: self._rate_bytes]
            self._absorb_block(block)
            self._kecap_f()
        return self

    def _absorb_block(self, block):
        assert len(block) == self._rate_bytes
        for i in range(0, self._rate_bytes, 8):
            lane = int.from_bytes(block[i : i + 8], "little")
            self._state[i // 8] ^= lane

    def _squeeze_bytes(self, length):
        out = bytearray()
        st = self._state
        rate = self._rate_bytes
        while len(out) < length:
            block = bytearray()
            for i in range(rate // 8):
                block.extend(st[i].to_bytes(8, "little"))
            take = min(length - len(out), len(block))
            out.extend(block[:take])
            if len(out) < length:
                self._kecap_f()
        return bytes(out)

    def digest(self):
        buf = bytearray(self._buffer)
        buf.append(0x01)
        padlen = (self._rate_bytes - (len(buf) % self._rate_bytes)) % self._rate_bytes
        if padlen == 0:
            buf.extend(b"\x00" * (self._rate_bytes - 1))
            buf.append(0x80)
        else:
            if padlen == 1:
                buf.append(0x80)
            else:
                buf.extend(b"\x00" * (padlen - 1))
                buf.append(0x80)

        for i in range(0, len(buf), self._rate_bytes):
            self._absorb_block(buf[i : i + self._rate_bytes])
            self._kecap_f()

        return self._squeeze_bytes(32)

    def hexdigest(self):
        return self.digest().hex()

    def _kecap_f(self):
        st = self._state
        for rc in self._RC:
            c0 = st[0] ^ st[5] ^ st[10] ^ st[15] ^ st[20]
            c1 = st[1] ^ st[6] ^ st[11] ^ st[16] ^ st[21]
            c2 = st[2] ^ st[7] ^ st[12] ^ st[17] ^ st[22]
            c3 = st[3] ^ st[8] ^ st[13] ^ st[18] ^ st[23]
            c4 = st[4] ^ st[9] ^ st[14] ^ st[19] ^ st[24]
            d0 = c4 ^ _rotl64(c1, 1)
            d1 = c0 ^ _rotl64(c2, 1)
            d2 = c1 ^ _rotl64(c3, 1)
            d3 = c2 ^ _rotl64(c4, 1)
            d4 = c3 ^ _rotl64(c0, 1)
            st[0] ^= d0; st[5] ^= d0; st[10] ^= d0; st[15] ^= d0; st[20] ^= d0
            st[1] ^= d1; st[6] ^= d1; st[11] ^= d1; st[16] ^= d1; st[21] ^= d1
            st[2] ^= d2; st[7] ^= d2; st[12] ^= d2; st[17] ^= d2; st[22] ^= d2
            st[3] ^= d3; st[8] ^= d3; st[13] ^= d3; st[18] ^= d3; st[23] ^= d3
            st[4] ^= d4; st[9] ^= d4; st[14] ^= d4; st[19] ^= d4; st[24] ^= d4

            B = [0] * 25
            for y in range(5):
                for x in range(5):
                    idx = x + 5 * y
                    rot = self._RHO[y][x]
                    val = _rotl64(st[idx], rot)
                    B[y + 5 * ((2 * x + 3 * y) % 5)] = val

            for y in range(5):
                y5 = 5 * y
                b0 = B[y5 + 0]; b1 = B[y5 + 1]; b2 = B[y5 + 2]; b3 = B[y5 + 3]; b4 = B[y5 + 4]
                st[y5 + 0] = b0 ^ ((~b1) & b2)
                st[y5 + 1] = b1 ^ ((~b2) & b3)
                st[y5 + 2] = b2 ^ ((~b3) & b4)
                st[y5 + 3] = b3 ^ ((~b4) & b0)
                st[y5 + 4] = b4 ^ ((~b0) & b1)

            st[0] ^= rc

class _KecapNamespace:
    def new(self, digest_bits: int = 256) -> _Kecap256:
        if digest_bits != 256:
            raise ValueError("Only kecap-256 is supported")
        return _Kecap256()

kecap = _KecapNamespace()

_P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
_A = 0
_B = 7
_Gx = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798
_Gy = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8
G = (_Gx, _Gy)
q = _N
C = 1.157920892373162

def _mod_inv(x, m):
    return pow(x, -1, m)

def _point_add(P, Q):
    if P is None:
        return Q
    if Q is None:
        return P
    x1, y1 = P
    x2, y2 = Q
    if x1 == x2:
        if (y1 + y2) % _P == 0:
            return None
    if P == Q:
        return _point_double(P)
    s = ((y2 - y1) * _mod_inv((x2 - x1) % _P, _P)) % _P
    x3 = (s * s - x1 - x2) % _P
    y3 = (s * (x1 - x3) - y1) % _P
    R = (x3, y3)
    return R

def _point_double(P):
    if P is None:
        return None
    x, y = P
    if y % _P == 0:
        return None
    s = ((3 * x * x + _A) * _mod_inv((2 * y) % _P, _P)) % _P
    x3 = (s * s - 2 * x) % _P
    y3 = (s * (x - x3) - y) % _P
    return (x3, y3)

def _scalar_mult(k, P):
    if k % _N == 0 or P is None:
        return None
    if k < 0:
        return _scalar_mult(-k, (P[0], (-P[1]) % _P))
    result = None
    addend = P
    while k:
        if k & 1:
            result = _point_add(result, addend)
        addend = _point_double(addend)
        k >>= 1
    return result

def kecap_enc(types, values):
    if len(types) != len(values):
        raise ValueError("types and values length mismatch")
    encoded = bytearray()
    for t, v in zip(types, values):
        if t == "string":
            encoded += str(v).encode("utf-8")
        elif t == "uint256":
            encoded += int(v).to_bytes(32, "big", signed=False)
        else:
            raise ValueError(f"unsupported type: {t}")
    return kecap.new(digest_bits=256).update(bytes(encoded)).digest()

def hash(data: bytes):
    prefix = b"BEECTF{" + b"KECAP256-SIGNED-MSG}:"
    h = kecap.new(digest_bits=256)
    h.update(prefix + data)
    return int.from_bytes(h.digest(), "big")

def generate_signature(pk, types, values):
    a = pk
    n = 30
    mn = int(C * (10 ** (77 - (a - (a // n) * n))))
    if mn < 2:
        mn = 2
    k = random.randint(1, mn - 1)
    rh = kecap_enc(types, values)
    h = hash(rh)
    R = _scalar_mult(k, G)
    r = R[0] % q
    s = (pow(k, -1, q) * (h + r * pk)) % q
    v = 27 + (R[1] % 2)
    return (v, r, s)
