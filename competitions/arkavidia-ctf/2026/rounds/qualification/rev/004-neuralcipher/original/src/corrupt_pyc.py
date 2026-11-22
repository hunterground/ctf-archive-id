#!/usr/bin/env python3
import sys

pyc_file = sys.argv[1] if len(sys.argv) > 1 else "neural_cipher.pyc"

with open(pyc_file, 'rb') as f:
    data = bytearray(f.read())

print(f"Original magic bytes (hex): {data[0:4].hex()}")
print(f"Original first 16 bytes: {data[0:16].hex()}")

# Corrupt ONLY the first 4 bytes (magic number)
data[0] = 0x42
data[1] = 0x0F
data[2] = 0xAD
data[3] = 0xED

# Write back
with open(pyc_file, 'wb') as f:
    f.write(data)

print(f"\n✓ Corrupted magic bytes to: 42 0F AD ED")
print(f"✓ New first 16 bytes: {data[0:16].hex()}")
print(f"✓ File size: {len(data)} bytes")
print(f"\n✓ Corrupted {pyc_file} created successfully!")
