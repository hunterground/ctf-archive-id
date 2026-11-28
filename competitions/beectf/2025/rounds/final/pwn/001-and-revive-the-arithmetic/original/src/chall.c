#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <float.h>

#define MEM_SIZE 10
#define EPS 1e-12

#define RESET   "\033[0m"
#define RED     "\033[31m"
#define GREEN   "\033[32m"
#define YELLOW  "\033[33m"
#define BLUE    "\033[34m"
#define MAGENTA "\033[35m"
#define CYAN    "\033[36m"
#define WHITE   "\033[37m"
#define BOLD    "\033[1m"
#define UNDERLINE "\033[4m"

double mem[MEM_SIZE] = {0.0};

void setup() {
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stdin, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);
}

void display_banner(void) {
    FILE *banner_file;
    char line[256];
    banner_file = fopen("banner.txt", "r");
    if (banner_file == NULL) {
        printf("%s%sSETSUNA CALCULATOR%s\n\n", BOLD, MAGENTA, RESET);
        return;
    }
    printf("%s%s", BOLD, MAGENTA);
    while (fgets(line, sizeof(line), banner_file) != NULL) {
        printf("%s", line);
    }
    printf("%s\n", RESET);
    fclose(banner_file);
}

void flush_input(void) {
    int c;
    while ((c = getchar()) != '\n' && c != EOF) { }
}

int get_index(const char *prompt) {
    int idx;
    while (1) {
        printf("%s%s%s (0-%d): ", CYAN, prompt, RESET, MEM_SIZE - 1);
        if (scanf("%d", &idx) != 1) {
            printf("%sInvalid input. Please enter an integer.%s\n", RED, RESET);
            flush_input();
            continue;
        }
        flush_input();
        return idx;
    }
}

double get_double(const char *prompt) {
    double x;
    while (1) {
        printf("%s%s%s: ", CYAN, prompt, RESET);
        if (scanf("%lf", &x) != 1) {
            printf("%sInvalid number. Please enter a valid floating-point number.%s\n", RED, RESET);
            flush_input();
            continue;
        }
        flush_input();
        return x;
    }
}

void read_memory(void) {
    int idx = get_index("Enter memory index to read");
    if (idx < 0 || idx >= MEM_SIZE) {
    printf("%sIndex out of range. Please enter between 0 and %d.%s\n", YELLOW, MEM_SIZE - 1, RESET);
    return;
}
    printf("%s%s[%d] = %s%.15g%s\n", GREEN, "mem", idx, YELLOW, mem[idx], RESET);
}

void write_memory(void) {
    int idx = get_index("Enter memory index to write");
    if (idx < 0 || idx >= MEM_SIZE) {
    printf("%sIndex out of range. Please enter between 0 and %d.%s\n", YELLOW, MEM_SIZE - 1, RESET);
    return;
}
    double val = get_double("Enter value to store");
    mem[idx] = val;
    printf("%sSaved %s%.15g%s at %s[%d]%s\n", GREEN, YELLOW, val, RESET, GREEN, idx, RESET);
}

int get_destination_index_and_store(double result) {
    int dest = get_index("Enter memory index to save the result");
    if (dest >= MEM_SIZE) {
    printf("%sIndex out of range. Please enter between 0 and %d.%s\n", YELLOW, MEM_SIZE - 1, RESET);
    return -1;
}
    mem[dest] = result;
    printf("%sResult %s%.15g%s saved to %s[%d]%s\n", GREEN, YELLOW, result, RESET, GREEN, dest, RESET);
}

void calculator_menu(void) {
    int choice;
    while (1) {
        printf("\n%s%s--- Calculator Menu ---%s\n", BOLD, MAGENTA, RESET);
        printf("%s%sArithmetic%s\n", BOLD, BLUE, RESET);
        printf("%s1.%s Addition        %s2.%s Subtraction\n", YELLOW, WHITE, YELLOW, WHITE);
        printf("%s3.%s Multiplication  %s4.%s Division\n\n", YELLOW, WHITE, YELLOW, WHITE);

        printf("%s%sTrigonometric%s\n", BOLD, CYAN, RESET);
        printf("%s5.%s sin             %s6.%s sinh\n", YELLOW, WHITE, YELLOW, WHITE);
        printf("%s7.%s cos             %s8.%s cosh\n", YELLOW, WHITE, YELLOW, WHITE);
        printf("%s9.%s tan             %s10.%s tanh\n", YELLOW, WHITE, YELLOW, WHITE);
        printf("%s11.%s asin           %s12.%s asinh\n", YELLOW, WHITE, YELLOW, WHITE);
        printf("%s13.%s acos           %s14.%s acosh\n", YELLOW, WHITE, YELLOW, WHITE);
        printf("%s15.%s atan           %s16.%s atanh\n\n", YELLOW, WHITE, YELLOW, WHITE);

        printf("%s%sExponential%s\n", BOLD, GREEN, RESET);
        printf("%s17.%s Power          %s18.%s Any Logarithm\n", YELLOW, WHITE, YELLOW, WHITE);
        printf("%s19.%s Square Root    %s20.%s Cubic Root\n\n", YELLOW, WHITE, YELLOW, WHITE);

        printf("%s%sOthers%s\n", BOLD, RED, RESET);
        printf("%s21.%s Ceil           %s22.%s Floor\n", YELLOW, WHITE, YELLOW, WHITE);
        printf("%s23.%s Absolute       %s24.%s Modulo\n\n", YELLOW, WHITE, YELLOW, WHITE);

        printf("%s0.%s Back to main menu\n", YELLOW, WHITE);

        printf("%sChoose operation (0-24): %s", CYAN, RESET);
        if (scanf("%d", &choice) != 1) {
            printf("%sInvalid choice. Please enter an integer.%s\n", RED, RESET);
            flush_input();
            continue;
        }
        flush_input();

        if (choice == 0) return;

        double a, b, result;
        int idx1, idx2;
        int save_idx;

        switch (choice) {
            case 1:
                idx1 = get_index("Enter first operand memory index");
                idx2 = get_index("Enter second operand memory index");
                a = mem[idx1]; b = mem[idx2];
                result = a + b;
                get_destination_index_and_store(result);
                break;
            case 2:
                idx1 = get_index("Enter first operand memory index");
                idx2 = get_index("Enter second operand memory index");
                a = mem[idx1]; b = mem[idx2];
                result = a - b;
                get_destination_index_and_store(result);
                break;
            case 3:
                idx1 = get_index("Enter first operand memory index");
                idx2 = get_index("Enter second operand memory index");
                a = mem[idx1]; b = mem[idx2];
                result = a * b;
                get_destination_index_and_store(result);
                break;
            case 4:
                idx1 = get_index("Enter numerator memory index");
                idx2 = get_index("Enter denominator memory index");
                a = mem[idx1]; b = mem[idx2];
                if (fabs(b) < EPS) {
                    printf("%sError: Division by zero (denominator is zero). Operation cancelled.%s\n", RED, RESET);
                } else {
                    result = a / b;
                    get_destination_index_and_store(result);
                }
                break;
            case 5:
                idx1 = get_index("Enter operand memory index");
                result = sin(mem[idx1]);
                get_destination_index_and_store(result);
                break;
            case 6:
                idx1 = get_index("Enter operand memory index");
                result = sinh(mem[idx1]);
                get_destination_index_and_store(result);
                break;
            case 7:
                idx1 = get_index("Enter operand memory index");
                result = cos(mem[idx1]);
                get_destination_index_and_store(result);
                break;
            case 8:
                idx1 = get_index("Enter operand memory index");
                result = cosh(mem[idx1]);
                get_destination_index_and_store(result);
                break;
            case 9:
                idx1 = get_index("Enter operand memory index");
                result = tan(mem[idx1]);
                get_destination_index_and_store(result);
                break;
            case 10:
                idx1 = get_index("Enter operand memory index");
                result = tanh(mem[idx1]);
                get_destination_index_and_store(result);
                break;
            case 11:
                idx1 = get_index("Enter operand memory index");
                a = mem[idx1];
                if (a < -1.0 - EPS || a > 1.0 + EPS) {
                    printf("%sError: asin domain is [-1, 1]. mem[%d]=%.15g is outside domain.%s\n", RED, idx1, a, RESET);
                } else {
                    result = asin(a);
                    get_destination_index_and_store(result);
                }
                break;
            case 12:
                idx1 = get_index("Enter operand memory index");
                result = asinh(mem[idx1]);
                get_destination_index_and_store(result);
                break;
            case 13:
                idx1 = get_index("Enter operand memory index");
                a = mem[idx1];
                if (a < -1.0 - EPS || a > 1.0 + EPS) {
                    printf("%sError: acos domain is [-1, 1]. mem[%d]=%.15g is outside domain.%s\n", RED, idx1, a, RESET);
                } else {
                    result = acos(a);
                    get_destination_index_and_store(result);
                }
                break;
            case 14:
                idx1 = get_index("Enter operand memory index");
                a = mem[idx1];
                if (a < 1.0 - EPS) {
                    printf("%sError: acosh domain is [1, +inf). mem[%d]=%.15g is outside domain.%s\n", RED, idx1, a, RESET);
                } else {
                    result = acosh(a);
                    get_destination_index_and_store(result);
                }
                break;
            case 15:
                idx1 = get_index("Enter operand memory index");
                result = atan(mem[idx1]);
                get_destination_index_and_store(result);
                break;
            case 16:
                idx1 = get_index("Enter operand memory index");
                a = mem[idx1];
                if (a <= -1.0 + EPS || a >= 1.0 - EPS) {
                    printf("%sError: atanh domain is (-1, 1). mem[%d]=%.15g is outside domain.%s\n", RED, idx1, a, RESET);
                } else {
                    result = atanh(a);
                    get_destination_index_and_store(result);
                }
                break;
            case 17:
                idx1 = get_index("Enter base operand memory index");
                idx2 = get_index("Enter exponent operand memory index");
                a = mem[idx1]; b = mem[idx2];
                if (fabs(a) < EPS && b < 0.0) {
                    printf("%sError: 0 raised to a negative exponent is undefined (division by zero). Operation cancelled.%s\n", RED, RESET);
                } else {
                    result = pow(a, b);
                    get_destination_index_and_store(result);
                }
                break;
            case 18:
                idx1 = get_index("Enter value memory index");
                idx2 = get_index("Enter base memory index");
                a = mem[idx1]; b = mem[idx2];
                if (a <= 0.0) {
                    printf("%sError: logarithm value must be positive. mem[%d]=%.15g is not positive.%s\n", RED, idx1, a, RESET);
                } else if (b <= 0.0 || fabs(b - 1.0) < EPS) {
                    printf("%sError: logarithm base must be positive and not equal to 1. mem[%d]=%.15g is invalid.%s\n", RED, idx2, b, RESET);
                } else {
                    result = log(a) / log(b);
                    get_destination_index_and_store(result);
                }
                break;
            case 19:
                idx1 = get_index("Enter operand memory index");
                a = mem[idx1];
                if (a < 0.0) {
                    printf("%sError: square root domain is [0, +inf). mem[%d]=%.15g is negative.%s\n", RED, idx1, a, RESET);
                } else {
                    result = sqrt(a);
                    get_destination_index_and_store(result);
                }
                break;
            case 20:
                idx1 = get_index("Enter operand memory index");
                result = cbrt(mem[idx1]);
                get_destination_index_and_store(result);
                break;
            case 21:
                idx1 = get_index("Enter operand memory index");
                result = ceil(mem[idx1]);
                get_destination_index_and_store(result);
                break;
            case 22:
                idx1 = get_index("Enter operand memory index");
                result = floor(mem[idx1]);
                get_destination_index_and_store(result);
                break;
            case 23:
                idx1 = get_index("Enter operand memory index");
                result = fabs(mem[idx1]);
                get_destination_index_and_store(result);
                break;
            case 24:
                idx1 = get_index("Enter dividend operand memory index");
                idx2 = get_index("Enter divisor operand memory index");
                a = mem[idx1]; b = mem[idx2];
                if (fabs(b) < EPS) {
                    printf("%sError: Modulo by zero (divisor is zero). Operation cancelled.%s\n", RED, RESET);
                } else {
                    result = fmod(a, b);
                    get_destination_index_and_store(result);
                }
                break;
            default:
                printf("%sInvalid operation number. Choose 0-24.%s\n", YELLOW, RESET);
                break;
        }
    }
}

int main(void) {
    setup();
    int choice;
    display_banner();
    while (1) {
        printf("\n%s--- Main Menu ---%s\n", BOLD, RESET);
        printf("1. Read Memory\n");
        printf("2. Write Memory\n");
        printf("3. Calculator\n");
        printf("4. Exit\n");
        printf("%sChoose an option (1-4): %s", CYAN, RESET);
        if (scanf("%d", &choice) != 1) {
            printf("%sInvalid input. Please enter a number.%s\n", RED, RESET);
            flush_input();
            continue;
        }
        flush_input();
        switch (choice) {
            case 1:
                read_memory();
                break;
            case 2:
                write_memory();
                break;
            case 3:
                calculator_menu();
                break;
            case 4:
                printf("%sExiting. Goodbye!%s\n", GREEN, RESET);
                return 0;
            default:
                printf("%sInvalid choice. Please choose 1-4.%s\n", YELLOW, RESET);
                break;
        }
    }
    return 0;
}