required_moves = 908

s = required_moves
def lcgn():
    global s
    s = (s * 7438 + 9332) % 14837
    return s

for _ in range(10000000):
    lcgn()

flag = bytearray(b"SNI{N1c3_0ne_Y0u_S0lV3d_Th3_M4zeD_Th3_Fl4g_1s_Th3_Fl4g}")

for i in range(len(flag)):
    flag[i] ^= lcgn() & 0xFF

print(flag.hex())
