# gcc -O0 -fno-stack-protector -no-pie -D_FORTIFY_SOURCE=0 -o baratie baratie.c
gcc baratie.c -o baratie \
    -no-pie -fno-stack-protector -D_FORTIFY_SOURCE=0 \
    -Wl,-z,relro -Wl,-z,lazy
