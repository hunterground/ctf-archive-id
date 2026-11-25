#!/usr/bin/env python3
import random
import sys

# Math operation functions
def op_add(a, b):
    return a + b

def op_sub(a, b):
    return a - b

def op_xor(a, b):
    return a ^ b

# Operation mapping with IDs (only add, sub, xor)
OPERATIONS = {
    "qwx7z": op_add,    # add
    "m9kp2": op_sub,    # sub
    "j3s5l": op_xor,    # xor
}

def generate_random_key():
    """Generate a random key for encryption"""
    return random.randint(1, 255)

def encrypt_char(char_code, key, operation_id):
    """Encrypt a single character using the specified operation"""
    operation = OPERATIONS[operation_id]
    
    # For subtraction, ensure key is not larger than char_code to avoid negative results
    if operation_id == "m9kp2" and key > char_code:
        key = random.randint(1, char_code) if char_code > 1 else 1
    
    # Apply the operation with the key
    encrypted = operation(char_code, key)
    
    # Ensure result stays in reasonable range and is positive
    encrypted = abs(encrypted) & 0xFFFFFFFF  # Keep as 32-bit and positive
    
    return encrypted, key

def encrypt_string(input_text):
    """Encrypt the input string using random operations"""
    encrypted_data = []
    operation_sequence = []
    keys = []
    
    random.seed()  # Initialize random seed
    
    for char in input_text:
        char_code = ord(char)
        
        # Generate random key and operation
        key = generate_random_key()
        operation_id = random.choice(list(OPERATIONS.keys()))
        
        # Encrypt the character
        encrypted_value, actual_key = encrypt_char(char_code, key, operation_id)
        
        # Store the results
        encrypted_data.append(encrypted_value)
        operation_sequence.append(operation_id)
        keys.append(actual_key)
    
    return encrypted_data, operation_sequence, keys

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 generate_flag.py <input_string>")
        sys.exit(1)
    
    input_text = sys.argv[1]
    
    print(f"Input: {input_text}")
    print(f"Length: {len(input_text)}")
    print()
    
    # Encrypt the input
    encrypted_data, operations, keys = encrypt_string(input_text)
    
    # Output the encryption details
    print("Encryption Details:")
    print("=" * 50)
    
    for i, char in enumerate(input_text):
        print(f"Char {i}: '{char}' (ASCII: {ord(char)})")
        print(f"  Operation ID: {operations[i]}")
        print(f"  Key: {keys[i]}")
        print(f"  Encrypted: {encrypted_data[i]}")
        print()
    
    # Output arrays for easy copying
    print("Arrays for C program:")
    print("=" * 50)
    print(f"char original[] = \"{input_text}\";")
    print(f"int encrypted[] = {{{', '.join(map(str, encrypted_data))}}};")
    print(f"char* operations[] = {{{', '.join([f'"{op}"' for op in operations])}}};")
    print(f"int keys[] = {{{', '.join(map(str, keys))}}};")
    print(f"int length = {len(input_text)};")
    print()
    
    # Output compact format
    print("Compact Format:")
    print("=" * 50)
    print("Encrypted:", ','.join(map(str, encrypted_data)))
    print("Operations:", ','.join(operations))
    print("Keys:", ','.join(map(str, keys)))

if __name__ == "__main__":
    main()
