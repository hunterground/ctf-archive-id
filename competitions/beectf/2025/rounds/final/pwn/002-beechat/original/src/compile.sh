#!/bin/bash

# This script compiles chall.c with full security mitigations.

GCC_FLAGS=(
    "-fPIE"                 # Position-Independent Executable
    "-pie"                  # Link as PIE
    "-fstack-protector-all" # Enable stack canaries for all functions
    "-Wl,-z,relro,-z,now"   # Full RELRO
    "-Wl,-z,noexecstack"    # Non-executable stack
)

gcc -o chall chall.c "${GCC_FLAGS[@]}"

echo "[+] Compilation complete! Output file: chall_secure"
echo "[*] Note: The binary is linked against your system's default libc."
echo "[*] To link against glibc-2.27, run this script inside the Ubuntu 18.04 Docker container."
