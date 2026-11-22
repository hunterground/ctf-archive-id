#include<stdio.h>
#include<stdlib.h>

void init() {
    setvbuf(stdin, NULL, _IONBF, 0);
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);
}

int main(int argc, char *argv[]) {
    init();
    puts("The heap is all yours!");

    long long *arr = malloc(0x10 * sizeof(unsigned long long));
    unsigned long long index = 0;

    while(1) {
        printf("Index: ");
        if (scanf("%lld", &index)){
            if (index < 0x40000){
                printf("Value: ");
                if (scanf("%lld", &arr[index])){
                    printf("Index %lld value set to %lld\n", index, arr[index]);
                }
            }
        }
    }
    
    return 0;
}