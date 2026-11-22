#!/usr/bin/env python3
import numpy as np
import os
import sys

def gcd_extended(a, b):
    if a == 0:
        return b, 0, 1
    gcd, x1, y1 = gcd_extended(b % a, a)
    x = y1 - (b // a) * x1
    y = x1
    return gcd, x, y

def mod_inverse(a, m):
    gcd, x, _ = gcd_extended(a % m, m)
    if gcd != 1:
        raise ValueError(f"Modular inverse does not exist for {a} mod {m}")
    return (x % m + m) % m

def is_invertible_mod256(matrix):
    det = int(round(np.linalg.det(matrix)))
    det_mod = det % 256
    return det_mod % 2 == 1

def generate_invertible_matrix_mod256(n, max_attempts=1000):
    diagonal_value = np.random.randint(1, 127) * 2 + 1  
    matrix = np.diag([diagonal_value] * n).astype(np.int32)
    
    for i in range(n):
        for j in range(i + 1, n):
            matrix[i, j] = np.random.randint(0, 50)
    
    matrix = matrix % 256

    return matrix


def preprocess_flag(flag):
    return np.array([ord(c) for c in flag], dtype=np.int32)

def neural_encrypt(flag_vector, weight_matrix):
    encrypted = (weight_matrix @ flag_vector) % 256
    return encrypted.astype(np.uint8)


def generate_challenge(flag_text):
    flag_vector = preprocess_flag(flag_text)
    n = len(flag_vector)
    weight_matrix = generate_invertible_matrix_mod256(n)
    encrypted_vector = neural_encrypt(flag_vector, weight_matrix)
    os.makedirs("../dist", exist_ok=True)
    np.savetxt("../dist/output", encrypted_vector, fmt='%d')
    np.save("../dist/weights", weight_matrix)
    if os.path.exists("../dist/weights.npy"):
        os.rename("../dist/weights.npy", "../dist/weights")

    

if __name__ == "__main__":
    np.random.seed(67)
    try:
        with open("flag.txt", "r") as f:
            FLAG = f.read().strip()
        generate_challenge(FLAG)
    except Exception as e:
        print(f"\n[✗] ERROR: {e}", file=sys.stderr)
        sys.exit(1)
