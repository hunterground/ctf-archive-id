#include <stdio.h>

char buffer[0x100];

void init()
{
    setbuf(stdin, NULL);
    setbuf(stdout, NULL);
    setbuf(stderr, NULL);
}

int main()
{
    init();

    while (1)
    {
        printf("> ");
        fgets(buffer, sizeof(buffer), stdin);
        printf(buffer);
    }
}
