from utils import *

# HADES's Advanced Dual-Key Encryption Standard (HADES)
# We replaced the S-Box with a brand new key-dependent operation for double the security!
class HADES:
    def __init__(self, key1: bytes, key2: bytes):
        self.Nb = 4
        self.Nk = len(key1) // 4
        self.Nr = 4 # 4 rounds is probably enough riigghhtt??
        self.k1 = expand_key(key1, self.Nr)
        self.k2 = expand_key(key2, self.Nr)
        self.block_size = 16

    def encrypt_block(self, block: bytes) -> bytes:
        state = bytes2matrix(block)
        state = add_round_key(state, self.k1[0])
        state = matrix_mul(self.k2[0], state)

        for round in range(1, self.Nr):
            state = matrix_mul(self.k2[round], state)
            state = shift_rows(state)
            state = mix_columns(state)
            state = add_round_key(state, self.k1[round])

        state = matrix_mul(self.k2[self.Nr], state)
        state = shift_rows(state)
        state = add_round_key(state, self.k1[self.Nr])

        return matrix2bytes(state)

    def decrypt_block(self, block: bytes) -> bytes:
        state = bytes2matrix(block)
        state = add_round_key(state, self.k1[self.Nr])
        state = inv_shift_rows(state)
        state = matrix_mul(matrix_inv(self.k2[self.Nr]), state)

        for round in range(self.Nr - 1, 0, -1):
            state = add_round_key(state, self.k1[round])
            state = inv_mix_columns(state)
            state = inv_shift_rows(state)
            state = matrix_mul(matrix_inv(self.k2[round]), state)

        state = matrix_mul(matrix_inv(self.k2[0]), state)
        state = add_round_key(state, self.k1[0])

        return matrix2bytes(state)
    
    def encrypt(self, plaintext: bytes) -> bytes:
        ciphertext = b""
        for i in range(0, len(plaintext), self.block_size):
            block = plaintext[i : i + self.block_size]
            ciphertext += self.encrypt_block(block)
        return ciphertext

    def decrypt(self, ciphertext: bytes) -> bytes:
        plaintext = b""
        for i in range(0, len(ciphertext), self.block_size):
            block = ciphertext[i : i + self.block_size]
            plaintext += self.decrypt_block(block)
        return plaintext