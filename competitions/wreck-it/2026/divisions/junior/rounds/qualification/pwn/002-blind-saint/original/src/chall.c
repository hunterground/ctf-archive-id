#include <stdio.h>
#include <stdint.h>
#include <signal.h>
#include <unistd.h>
#include <string.h>

uint64_t arr[1];

void init()
{
    setbuf(stdin, NULL);
    setbuf(stdout, NULL);
    setbuf(stderr, NULL);
}

int main()
{
    uint64_t index, value;
    char buf[0x100];

    init();
    puts("commands:");
    puts("read <index>");
    puts("write <index> <value>");
    puts("quit");
    while (1)
    {
        index = 0;
        value = 0;

        printf(">>> ");
        fgets(buf, sizeof(buf), stdin);
        if (sscanf(buf, "read %llu", &index) == 1)
            printf("%#llx\n", arr[index]);
        else if (sscanf(buf, "write %llu %llu", &index, &value) == 2)
        {
            arr[index] = value;
            puts("ok");
        }
        else if (memcmp("quit", buf, 4) == 0)
            break;
    }
}
