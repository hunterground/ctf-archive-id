from comms import relay, genpr, rng

class Jihyo:
    def __init__(self, secret: int, modulus_n: int, pub_e: int = 65537, rsa_bits: int = 1024):
        self.secret = secret
        self.n = modulus_n
        self.e = pub_e
        self.rsa_bits = rsa_bits

        self.share = 0
        self.ot = {}

    def begin(self):
        N, d, x = self.refresh()
        self.ot = {"N": N, "d": d, "x": x}
        return relay("Jihyo", "K4tou", {"N": N, "x": x})

    def answer(self, incoming, bit_index: int):
        secret_component = (pow(2, bit_index, self.n) * self.secret) % self.n

        r = rng.randrange(self.n)
        self.share = (self.share + r) % self.n
        m0 = (-r) % self.n
        m1 = (-r + secret_component) % self.n

        N = self.ot["N"]
        d = self.ot["d"]
        x0, x1 = self.ot["x"]
        v = incoming["v"] % N

        k0 = pow((v - x0) % N, d, N)
        k1 = pow((v - x1) % N, d, N)

        enc0 = (m0 + k0) % N
        enc1 = (m1 + k1) % N

        return relay("Jihyo", "K4tou", {"enc_m": [enc0, enc1]})

    def refresh(self):
        while True:
            p = genpr(self.rsa_bits // 2)
            q = genpr(self.rsa_bits // 2)
            phi = (p - 1) * (q - 1)
            if phi % self.e != 0:
                N = p * q
                d = pow(self.e, -1, phi)
                x = [rng.randrange(N), rng.randrange(N)]
                return N, d, x