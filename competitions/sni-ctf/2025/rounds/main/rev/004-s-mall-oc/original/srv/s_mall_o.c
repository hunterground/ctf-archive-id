#include "./own_malloc.h"
#include "./tigris.h"
#include <stdio.h>
#include <stdlib.h>

char input[8196];
size_t input_pos = 0;
size_t input_len = 0;

char *arr[256];
size_t n = 0;

const uint8_t key[16] = {0x3A, 0x7F, 0x12, 0xC4, 0x9B, 0x08, 0xE1, 0x55,
                         0x2D, 0xA7, 0x6C, 0xF0, 0x13, 0x48, 0xBE, 0x91};

unsigned char ct[] = {
    0xDB, 0xBA, 0x55, 0xF5, 0xD3, 0x90, 0x90, 0xE2,
    0x46, 0x8C, 0x85, 0x99, 0x98, 0xE6, 0x66, 0xDD,
    0xB2, 0x0E, 0x04, 0x87, 0x32, 0xD3, 0x69, 0xAC,
    0xB5, 0xC7, 0x96, 0x3A, 0x4D, 0xD2, 0x47, 0x46,
    0x81, 0xA2, 0xA9, 0x66, 0x15, 0x9A, 0x9B, 0x1B,
    0x7D, 0x44, 0xC6, 0xE3, 0xF7, 0xDE, 0x16, 0x34,
    0x15, 0x27, 0x82, 0xBB, 0x1C, 0x3D, 0x95, 0xDA,
    0x55, 0xE4, 0x38, 0x4C, 0x72, 0x4C, 0x73, 0xFA,
    0x5A, 0x2A, 0xDA, 0x40, 0xEC, 0xD5, 0x8E, 0x5F,
    0x73, 0x84, 0x23, 0x23, 0x8F, 0x5F, 0x28, 0x1A,
    0x3C, 0x74, 0x7F, 0x3B, 0x1A, 0x51, 0x88, 0x41,
    0x53, 0xD6, 0x55, 0xB9, 0xFF, 0x99, 0x2B, 0xB4
};

int getchar() {
  char c;
  do {
    if (input_pos >= input_len) {
      exit(EXIT_FAILURE);
    }
    c = input[input_pos++];
  } while (c < 0x20 || c > 0x7F);
  return c;
}

int get_int() {
  int res = 0;
  for (int i = 0; i < 3; i++) {
    res *= 10;
    res += getchar() - '0';
  }
  return res;
}

void get_input(char *ptr, size_t size) {
  char c;
  int flag = 0;
  size_t i = 0;
  while (i < size) {
    c = getchar();
    if (flag == 2) {
      if (c == 'F') {
        break;
      }
      *ptr++ = 'E';
      *ptr++ = 'O';
      i += 2;
      flag = 0;
    }
    if (flag == 1) {
      if (c == 'O') {
        flag++;
        continue;
      }
      *ptr++ = 'E';
      i++;
      flag = 0;
    }
    if (flag == 0 && c == 'E') {
      flag++;
      continue;
    }
    *ptr++ = c;
    i++;
  }
}

void print_hex(const unsigned char *data, size_t len) {
    for (size_t i = 0; i < len; i++) {
        printf("%02X ", data[i]);       // print as two-digit hex

        if ((i + 1) % 16 == 0)          // every 16 bytes → new line
            printf("\n");
    }

    // final newline if data not multiple of 16
    if (len % 16 != 0)
        printf("\n");
}

void submit_getflag() {
  uint8_t plain_mem[96];
  uint8_t cipher_mem[96];

  if (n < 3) {
    exit(EXIT_FAILURE);
  }

  memcpy(plain_mem, arr[0], 16);
  memcpy(plain_mem + 16, arr[1], 47);
  memcpy(plain_mem + 63, arr[2], 33);

  Tigris_Encrypt_ECB(key, plain_mem, cipher_mem, 96);

  for (size_t i = 0; i < 96; i++) {
      if (cipher_mem[i] != ct[i]) {
          exit(EXIT_FAILURE);
      }
  }

  // open flag.txt and print the flag
  FILE *fp = fopen("flag.txt", "r");
  if (fp == NULL) {
      printf("Failed to open flag.txt\n");
      exit(EXIT_FAILURE);
  }

  char flag[100];
  if (fgets(flag, sizeof(flag), fp) == NULL) {
      printf("Failed to read flag from flag.txt\n");
      exit(EXIT_FAILURE);
  }

  printf("Flag: %s\n", flag);

  fclose(fp);
}

void action(char action) {
  switch (action) {
  case 'C': {
    size_t size = get_int();
    char *ptr = (char *)small_malloc(size);
    if (ptr == NULL) {
      printf("Malloc failed!\n");
      exit(EXIT_FAILURE);
    }
    arr[n++] = ptr;
    get_input(ptr, size);
    break;
  }
  case 'D': {
    size_t idx = get_int();
    if (idx >= n) {
      exit(EXIT_FAILURE);
    }
    small_free(arr[idx]);
    for (size_t i = idx; i < n - 1; i++) {
      arr[i] = arr[i + 1];
    }
    n--;
    break;
  }
  case 'P':
    exit(EXIT_FAILURE);
    break;
  case 'S':
    submit_getflag();
    break;
  default:
    exit(EXIT_FAILURE);
  }
}

void setup(void)
{
    setbuf(stdin, NULL);
    setbuf(stdout, NULL);
    setbuf(stderr, NULL);
}

int main() {
  setup();
  printf("Give your input >> ");
  fgets(input, sizeof(input), stdin);
  input_len = strlen(input);
  small_init();
  while (input_pos < input_len) {
    action(getchar());
  }
}
