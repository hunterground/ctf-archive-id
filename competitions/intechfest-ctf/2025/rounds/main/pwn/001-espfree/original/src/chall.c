#include <stdio.h>
#include <sys/mman.h>
#include <stdlib.h>

void __init__(void) __attribute__((constructor));
void hidden_func(void) {
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stdin, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);

    void *addr = malloc(0x1);
    mprotect((void*)((unsigned long)addr&~0xfff), 0x21000, 7);
    free(addr);
}
void __init__(void) {
	hidden_func();
}
int main () {
	while (1) {
		char *buff = malloc(0x1000);
		gets(buff);
		printf(buff);
		free(buff);
	}
}