import struct
import random

# --- CONFIGURATION ---
FLAG = "ARKAV{C4nn07_5p311_h1ur4_m1h473_w17h0u7_H1M}"
GLOBAL_KEY = 0x55 

# --- OPCODES ---
OP_PUSH_VAL     = 0x48 # H
OP_PUSH_INPUT   = 0x49 # I
OP_ADD          = 0x55 # U
OP_XOR          = 0x52 # R
OP_CHECK        = 0x41 # A
OP_MANGLE       = 0x6D # m
OP_TRAVERSE     = 0x69 # i
OP_TIME_BOMB    = 0x68 # h
OP_NOP          = 0x61 # a
OP_MORPH        = 0x74 # t
OP_EXIT         = 0x65 # e

# --- 1. THE ENCODER ---
def simulate_encoding(s):
    encoded_bytes = []
    key = 0xA7
    for i, char in enumerate(s):
        val = ord(char)
        enc = ((val ^ key) + (i * 13)) & 0xFF
        encoded_bytes.append(enc)
        key = ((key * 7) ^ enc) & 0xFF 
    return encoded_bytes

TARGET = simulate_encoding(FLAG)

# --- 2. REWARD ---
def generate_reward():
    msg = f"\nFLAG: {FLAG}\n"
    encrypted_msg = []
    for i, char in enumerate(msg):
        key_byte = TARGET[i % len(TARGET)]
        encrypted_byte = ord(char) ^ key_byte
        encrypted_msg.append(encrypted_byte)
    return encrypted_msg

REWARD_BLOB = generate_reward()

# --- 3. COMPILATION ---
bytecode = []
def add_op(op, *args):
    bytecode.append(op)
    for arg in args:
        bytecode.append(arg)

# STAGE 1
for i in range(6):
    add_op(OP_PUSH_INPUT, i)
    add_op(OP_CHECK, TARGET[i])

# STAGE 2
for i in range(6, 13):
    add_op(OP_MORPH, 2, 0xAA) 
    op_enc = OP_PUSH_INPUT ^ 0xAA
    arg_enc = i ^ 0xAA
    add_op(op_enc, arg_enc) 
    add_op(OP_CHECK, TARGET[i])

# STAGE 3 (Reversible Math)
for i in range(13, 20):
    add_op(OP_PUSH_INPUT, i)
    val = TARGET[i]
    expected = ((val + 13) * 3) & 0xFF
    expected ^= 0x55
    add_op(OP_MANGLE, expected)

# STAGE 4
for i in range(20, 27):
    add_op(OP_PUSH_INPUT, i)
    jump_key = TARGET[i] ^ 3  
    add_op(OP_TRAVERSE, jump_key)
    add_op(OP_NOP) 
    add_op(OP_NOP)

# STAGE 5
for i in range(27, len(FLAG)):
    add_op(OP_TIME_BOMB) 
    op_enc = OP_PUSH_INPUT ^ 0xCC
    idx_enc = i ^ 0xCC
    chk_op_enc = OP_CHECK ^ 0xCC
    val_enc = TARGET[i] ^ 0xCC
    add_op(op_enc, idx_enc, chk_op_enc, val_enc)

add_op(OP_EXIT)

# --- OUTPUT ---
encrypted_bytecode = [b ^ GLOBAL_KEY for b in bytecode]

print(f"// PASTE INTO him.c")
print(f"unsigned char bytecode[] = {{ {', '.join([f'0x{b:02X}' for b in encrypted_bytecode])} }};\n")
print(f"unsigned char reward[] = {{ {', '.join([f'0x{b:02X}' for b in REWARD_BLOB])} }};\n")
print(f"int reward_len = {len(REWARD_BLOB)};")