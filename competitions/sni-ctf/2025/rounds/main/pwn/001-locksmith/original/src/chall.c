#define _GNU_SOURCE

#include <stdlib.h>
#include <stdio.h>
#include <unistd.h>
#include <sys/random.h>
#include <string.h>
#include <ctype.h>

#define MAX_ATTEMPT 20
#define MAX_PIN_LENGTH 8
#define MAX_NAME_LENGTH 28

void setup(void);
int check(const char *guess, const char *pin, int pin_size);
void win(void);
int create_pin(char *buf, int min_digits, int max_digits);
int randrange(int lower_bound, int upper_bound);
int is_valid_pin(const char *s, int size);

typedef struct {
    int size;
    char buffer[MAX_PIN_LENGTH];
} PIN;

int main()
{
    int attempt = 0;
    char name[MAX_NAME_LENGTH] = {0};
    char guess[MAX_PIN_LENGTH] = {0};
    PIN pin = {0};

    setup();

    pin.size = create_pin(pin.buffer, MAX_PIN_LENGTH-2, MAX_PIN_LENGTH);

    printf("What's your name? ");
    read(STDIN_FILENO, name, sizeof(name));
    name[strcspn(name, "\n")] = '\0';

    printf("Greetings, Mr. %s.\n", name);
    printf("The vault before you is locked with a %d-digit PIN.\n", pin.size);
    printf("Enter your guesses and see if you can crack it.\n");
    printf("You only have %d attempts to proof your worth.\n", MAX_ATTEMPT);

    for (attempt = 1; attempt <= MAX_ATTEMPT; attempt++)
    {
        printf("Your guess> ");

        read(STDIN_FILENO, guess, sizeof(guess));
        guess[strcspn(guess, "\n")] = '\0';

        if (!is_valid_pin(guess, strnlen(guess, sizeof(guess))))
        {
            printf("Hmmm... Are you really a locksmith?\n");
            printf("I think you aren't\n");
            printf("Therefore, the game must end.\n");
            return 1;
        }

        if (check(guess, pin.buffer, pin.size))
        {
            printf("You're truly exceptional, Mr. %s.\n", name);
            printf("Congratulations.\n");
            printf("The content of the vault is now yours.\n");
            win();
            return 0;
        }
    }

    printf("Very unfortunate, Mr. %s.\n", name);
    printf("We wish you the best of luck in your future endeavors.\n");

    return 0;
}

void setup(void)
{
    setbuf(stdin, NULL);
    setbuf(stdout, NULL);
    setbuf(stderr, NULL);
}

int check(const char *guess, const char *pin, int pin_size)
{
    int correct_digits;
    for (correct_digits = 0; correct_digits < pin_size && guess[correct_digits]; correct_digits++)
        if (guess[correct_digits] != pin[correct_digits])
            break;
    printf("You have %d correct%s.\n", correct_digits, correct_digits == 1 ? "" : "s");
    return correct_digits == pin_size;
}

int create_pin(char *buf, int min_digits, int max_digits)
{
    int pin_size;
    if (pin_size = randrange(6, 8), pin_size == -1)
        exit(1);

    memset(buf, 0, max_digits);
    for (size_t i = 0; i < pin_size; i++)
        if (buf[i] = randrange('0', '9'), buf[i] == -1)
            exit(1);

    return pin_size;
}

int randrange(int lower_bound, int upper_bound)
{
    size_t result;
    if (getrandom(&result, sizeof(result), 0) == -1)
    {
        perror("getrandom");
        return -1;
    }
    return lower_bound + result % (upper_bound - lower_bound + 1);
}

int is_valid_pin(const char *s, int size)
{
    if (size == 0)
        return 0;
    for (int i = 0; i < size; i++)
        if (!isdigit(s[i]))
            return 0;
    return 1;
}

void win(void)
{
    char buffer[0x100];
    FILE *f = fopen("flag.txt", "r");
    if (f == NULL)
    {
        perror("fopen");
        fprintf(stderr, "Please contact admin.\n");
        exit(1);
    }
    fgets(buffer, sizeof(buffer), f);
    printf("%s", buffer);
}
