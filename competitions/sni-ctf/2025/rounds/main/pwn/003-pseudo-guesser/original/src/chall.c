#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define N 4

extern char *gets(char *);

void setup()
{
    setbuf(stdin, NULL);
    setbuf(stdout, NULL);
    setbuf(stderr, NULL);
    srand(time(NULL));
}

int main()
{
    char buf[64];
    uint64_t numbers[N];
    uint32_t n = 0, i = 0, operation;
    uint64_t operand, guess;
    char ans;

    setup();

    for (int i = 0; i < N; i++)
    {
        numbers[i] = (uint64_t)rand() * (uint64_t)rand();
    }
    printf("%d numbers have been generated.\n", N);

    printf("Time to guess!\n");
    printf("How many numbers do you think you can guess?\n");
    printf("> ");
    scanf("%u%*c", &n);

    if (n == 0)
    {
        printf("That's not fair.\n");
        return 1;
    }

    printf("Let's find out if you're right!\n");

    while (i < n)
    {
        printf("Round %d\n", i + 1);
        printf("I can let you do some math on the number first. Do you want to? (y/n)\n");
        printf("> ");
        scanf("%c%*c", &ans);
        if (ans == 'y' || ans == 'Y')
        {
            uint64_t temp = numbers[i];
            printf("Available operations:\n");
            printf("1. Add\n");
            printf("2. Subtract\n");
            printf("3. Multiply\n");
            printf("4. Divide\n");
            printf("> ");
            scanf("%d%*c", &operation);
            switch (operation)
            {
            case 1:
                printf("Enter an operand.\n");
                printf("> ");
                scanf("%lu%*c", &operand);
                temp += operand;
                break;
            case 2:
                printf("Enter an operand.\n");
                printf("> ");
                scanf("%lu%*c", &operand);
                temp -= operand;
                break;
            case 3:
                printf("Enter an operand.\n");
                printf("> ");
                scanf("%lu%*c", &operand);
                temp *= operand;
                break;
            case 4:
                printf("Enter an operand.\n");
                printf("> ");
                scanf("%lu%*c", &operand);
                temp /= operand;
                break;
            default:
                printf("Unknown operation.\n");
                break;
            }
            printf("Now, guess the result!\n");
            printf("> ");
            scanf("%lu%*c", &guess);
            if (guess == temp)
            {
                printf("Wow, you're correct!\n");
            }
            else
            {
                printf("Nope, that's not it.\n");
            }
        }
        else
        {
            printf("Okay, then just guess the number!\n");
            printf("> ");
            scanf("%lu%*c", &guess);
            if (guess == numbers[i])
            {
                printf("Wow, you're correct!\n");
                i++;
            }
            else
            {
                printf("Nope, that's not it.\n");
                break;
            }
        }
    }

    if (i == n)
    {
        printf("You win!\n");
        printf("What's your name?\n");
        printf("> ");
        gets(buf);
        printf("Congratulations, %s!\n", buf);
    }
    else
    {
        printf("You lose.\n");
    }

    return 0;
}
