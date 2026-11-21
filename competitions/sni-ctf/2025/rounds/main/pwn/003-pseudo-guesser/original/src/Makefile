chall: chall.c ld-linux-x86-64.so.2 libc.so.6
	gcc -pie -fstack-protector -Wl,-z,relro,-z,now -o chall chall.c
	patchelf --set-rpath '$$ORIGIN' chall
	patchelf --set-interpreter ld-linux-x86-64.so.2 chall

clean:
	rm chall
