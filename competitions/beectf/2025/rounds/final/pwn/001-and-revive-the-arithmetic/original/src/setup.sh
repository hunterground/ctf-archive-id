gcc -fstack-protector-strong -fno-pie -no-pie \
    -Wl,-z,relro -Wl,-z,noexecstack \
    -o chall chall.c -lm
cp chall chall_patched
patchelf --set-rpath . ./chall_patched
patchelf --set-interpreter ./ld-linux-x86-64.so.2 ./chall_patched