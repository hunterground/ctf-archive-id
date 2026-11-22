import struct

def emit(bc, op, operand=None):
    bc.append(op)
    if operand is not None:
        bc += struct.pack("<H", operand)

def rotl(x, r):
    return ((x << r) | (x >> (32 - r))) & 0xFFFFFFFF

def rotr(x, r):
    return ((x >> r) | (x << (32 - r))) & 0xFFFFFFFF

def compile_program(flag_inner=b"Ch0smky_Gr3at3st_Dr34m55", iterations=24):
    bc = bytearray()

    # Simulate VM state to compute per-character XOR targets
    state = 0xA2DDC87C
    targets = []

    for i in range(iterations):
        ch = flag_inner[i]

        # Target byte: reg XOR'd with low byte of current state
        targets.append(ch ^ (state & 0xFF))

        # Simulate base computation
        if ord('a') <= ch <= ord('z'):
            base = ((ch - ord('a')) % 3) + 1
        elif ord('A') <= ch <= ord('Z'):
            base = ((ch - ord('A')) % 3) + 1
        elif ord('0') <= ch <= ord('9'):
            base = ((ch - ord('0')) % 3) + 1
        elif ch == ord('_'):
            base = 2
        else:
            raise ValueError(f"Invalid char: {chr(ch)}")

        v = ((base ^ (state & 3)) % 3) + 1

        if (state & 1) == 0:
            state = rotl(state, 3) ^ ((v * 0x9E3779B1) & 0xFFFFFFFF)
            state &= 0xFFFFFFFF
            state = (state + (state >> 5)) & 0xFFFFFFFF
        else:
            state = rotr(state, 2) ^ ((v * 0x85EBCA77) & 0xFFFFFFFF)
            state &= 0xFFFFFFFF
            state = state ^ ((state << 7) & 0xFFFFFFFF)
            state &= 0xFFFFFFFF

    assert state == 0xA44D0530, f"Final state mismatch: 0x{state:08X}"

    # Emit bytecode with per-char XOR check inside each iteration
    for i in range(iterations):

        bc.append(0x01)            # read input -> reg
        bc.append(0x0C)            # state-dependent XOR check
        bc.append(targets[i])      #   target byte

        bc.append(0x02)
        bc.append(0x03)
        bc.append(0x04)

        jz_pos = len(bc)
        emit(bc, 0x05, 0)

        bc.append(0x07)
        bc.append(0x09)

        jmp_pos = len(bc)
        emit(bc, 0x06, 0)

        pop_addr = len(bc)

        bc.append(0x08)
        bc.append(0x0A)

        end_addr = len(bc)

        struct.pack_into("<H", bc, jz_pos+1, pop_addr)
        struct.pack_into("<H", bc, jmp_pos+1, end_addr)

    bc.append(0x0B)

    return bc


bc = compile_program()
with open("CFG","wb") as f:
    f.write(bc)
