#!/usr/bin/env python3

import random

SBOX = [0x6,0x4,0xC,0x5,0x0,0x7,0x2,0xE,0x1,0xF,0x3,0xD,0x8,0xA,0x9,0xB]

def _sn32(x):
    y = 0
    for i in range(8):
        y |= (SBOX[(x >> (i*4)) & 0xF] & 0xF) << (i*4)
    return y

def _rotl32(x, r):
    x &= 0xFFFFFFFF
    return ((x << r) | (x >> (32 - r))) & 0xFFFFFFFF

def _mix32(x):
    b0=(x>>0)&0xFF; b1=(x>>8)&0xFF; b2=(x>>16)&0xFF; b3=(x>>24)&0xFF
    y0=(b0 ^ ((b1<<1)&0xFF) ^ (b2>>1) ^ 0x63) & 0xFF
    y1=(b1 ^ ((b2<<1)&0xFF) ^ (b3>>1) ^ 0xA5) & 0xFF
    y2=(b2 ^ ((b3<<1)&0xFF) ^ (b0>>1) ^ 0x3C) & 0xFF
    y3=(b3 ^ ((b0<<1)&0xFF) ^ (b1>>1) ^ 0xC3) & 0xFF
    return y0 | (y1<<8) | (y2<<16) | (y3<<24)

def _f(r, x, sk):
    t = (x ^ sk) & 0xFFFFFFFF
    t = _sn32(t)
    t = _mix32(t)
    return _rotl32(t, (r*3) % 32)

def _split64(b):
    return ((b>>32)&0xFFFFFFFF, b&0xFFFFFFFF)

def _join64(l, r):
    return ((l&0xFFFFFFFF)<<32) | (r&0xFFFFFFFF)

def key_schedule(k):
    s = (int.from_bytes(k[0:4],'big') ^ int.from_bytes(k[4:8],'big') ^ 0xA5A5A5A5) & 0xFFFFFFFF
    pr = random.Random(s)
    w = [int.from_bytes(k[i*4:(i+1)*4], 'big') for i in range(4)]
    rks = []
    c = 0x9E3779B1
    for r in range(12):
        if r < 4:
            rk = w[r]
        else:
            rk = ((w[-1] ^ w[-2]) + c) & 0xFFFFFFFF
            w.append(((rk << 7) | (rk >> 25)) & 0xFFFFFFFF)
        rk ^= pr.getrandbits(32)
        rk = _rotl32(rk, (5*r + 7) % 32)
        rks.append(rk)
    return tuple(rks)

def enc_block(blk, rks):
    l, r = _split64(int.from_bytes(blk, 'big'))
    for i in range(12):
        f = _f(i+1, r, rks[i])
        l, r = r, (l ^ f) & 0xFFFFFFFF
    return _join64(l, r).to_bytes(8, 'big')
