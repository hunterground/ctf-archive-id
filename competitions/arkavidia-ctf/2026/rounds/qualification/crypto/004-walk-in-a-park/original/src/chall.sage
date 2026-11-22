PRIME = 9568331647090687

x = var("x")
F2 = GF(PRIME**2, name="z2", modulus=x**2 + 1)
F4 = F2.extension(2, name="z4")

BASE_CURVE = EllipticCurve(F4, [1, 0])
BASE_CURVE.set_order((PRIME**2 - 1) ** 2, num_checks=0)
BASE_J = BASE_CURVE.j_invariant()


def bits_from_int(n, bit_len):
    return [int(c) for c in format(abs(n), f"0{bit_len}b")]


def step_isogeny(curve, prev_j, bit):
    f = curve.division_polynomial(2)
    kernels = [
        pt
        for pt in sorted([curve.lift_x(x) for x in f.roots(multiplicities=False)])
        if curve.isogeny(pt).codomain().j_invariant() != prev_j
    ]
    assert len(kernels) == 2

    phi = curve.isogeny(kernels[bit])
    domain = phi.domain()
    codomain = phi.codomain()

    domain_j = domain.j_invariant()
    codomain_j = codomain.j_invariant()
    assert domain_j != codomain_j

    return codomain, domain_j, codomain_j


def walk_hash(bits):
    prev_j = BASE_J
    walk = set()
    curve = BASE_CURVE.isogeny(BASE_CURVE(0, 0)).codomain()

    for idx, bit in enumerate(bits):
        bit = int(bit)
        print(idx, end=":", flush=True)
        curve, prev_j, codomain_j = step_isogeny(curve, prev_j, bit)
        assert codomain_j not in walk
        walk.add(codomain_j)

    h = curve.j_invariant()
    walk.remove(h)
    return h, walk


def read_int():
    return int(input("? "))


def main():
    msg_cnt = 2

    bit_lens = [read_int() for _ in range(msg_cnt)]
    assert all(bit_len >= 256 for bit_len in bit_lens), 'bit lengths must be at least 256'

    preimages = [list(format(abs(read_int()), f"0{bit_lens[idx]}b")) for idx in range(msg_cnt)]
    assert preimages[0] != preimages[1], 'preimages must be different'

    hs, walks = zip(*map(walk_hash, preimages))
    assert len(set(hs)) == 1, 'hashes must be the same'

    w0, w1 = walks
    assert len(w0 & w1) == 67, 'six seven?'
    assert len(w0) >= bit_lens[0] - msg_cnt
    assert len(w1) >= bit_lens[1] - msg_cnt

    print(open("flag.txt").read(), end="")


if __name__ == "__main__":
    main()
