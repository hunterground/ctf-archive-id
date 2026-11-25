#include <stdio.h>
#include <stdlib.h>

int main(){
    char buf[0x20];
    gets(buf);
    puts("gemas thicc 🤤");
    close(stdin);
    close(stdout);
    close(stderr);
    return 0;
}

__attribute__((constructor))
void init() {
    setbuf(stdout, NULL);
    setbuf(stdin, NULL);
    setbuf(stderr, NULL);
}