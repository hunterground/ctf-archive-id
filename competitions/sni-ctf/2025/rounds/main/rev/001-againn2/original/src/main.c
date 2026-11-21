#include <stdio.h>
#include <string.h>
#include <stdint.h>

const char custom_table[] =
    "Z1aB2bC3cD4dE5eF6fG7gH8hI9iJ0jKkLlMmNnOoPpQqRrSsTtUuVvWwXxYy+/";

uint8_t swap_bits(uint8_t b) {
    // swap bit1 and bit5 (0-indexed)
    uint8_t bit1 = (b >> 1) & 1;
    uint8_t bit5 = (b >> 5) & 1;

    if (bit1 != bit5) {
        b ^= (1 << 1);
        b ^= (1 << 5);
    }
    return b;
}

void custom64_encode(const char *input, char *output) {
    int len = strlen(input);
    int out_idx = 0;

    for (int i = 0; i < len; i++) {
        uint8_t b = swap_bits((uint8_t)input[i]);
        uint8_t index = b % 64;          // simple mapping
        output[out_idx++] = custom_table[index];
    }
    output[out_idx] = '\0';
}

int main() {
    char buf[256];
    char encoded[256];

    printf("Enter message: ");
    fgets(buf, sizeof(buf), stdin);
    buf[strcspn(buf, "\n")] = 0;

    custom64_encode(buf, encoded);

    printf("Encoded message: %s\n", encoded);

    return 0;
}
