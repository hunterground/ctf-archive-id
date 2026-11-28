# And Revive The Arithmetic

1. Overwrite ceil GOT to printf PLT
2. Leak libc by calling printf through ceil, xmm0 will be contaminated by libc address and it will be saved in calculator memory.
3. Read leak from calculator memory.
4. Overwrite setvbuf -> system, stderr -> "/bin/sh"
5. Overwrite printf (or whatever that is easily called) with an address in setup() that do setvbuf(stderr, NULL, _IONBF, 0).
6. PWNED!

# Ref
