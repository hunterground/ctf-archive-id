from comms import relay, rng

class K4tou:
    def __init__(self, secret: int, modulus_n: int, pub_e: int = 65537, rsa_bits: int = 1024):
        self.secret = secret
        self.n = modulus_n
        self.e = pub_e
        self.rsa_bits = rsa_bits

        self.share = 0
        self._N = None
        self._pick = None
        self._mask = None

    def choose(self, setup_msg, bit_index: int):
        N = setup_msg["N"]
        assert self.rsa_bits - 1 <= N.bit_length() <= self.rsa_bits
        self._N = N

        self._pick = (self.secret >> bit_index) & 1
        self._mask = rng.randrange(N)

        x = setup_msg["x"]
        v = (x[self._pick] + pow(self._mask, self.e, N)) % N
        return relay("K4tou", "Jihyo", {"v": v})

    def absorb(self, enc_msg):
        part = (enc_msg["enc_m"][self._pick] - self._mask) % self._N
        self.share = (self.share + part) % self.n