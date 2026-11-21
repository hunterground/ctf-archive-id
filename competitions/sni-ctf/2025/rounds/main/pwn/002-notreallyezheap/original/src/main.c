#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

char *notes[12];
int count = 0;

static int get_int() {
  char input[8];
  read(0, input, sizeof(input));
  return atoi(input);
}

int main() {
  setbuf(stdin, NULL);
  setbuf(stdout, NULL);
  setbuf(stderr, NULL);

  for(;;){
    printf("> ");
    int choice = get_int();

    switch (choice) {
      case 1:
        if (count < 12){
          int size = get_int();
          if (size <= 0 || size > 0x240) _exit(1);
          notes[count] = malloc(size);
          scanf("%s", notes[count]);
          count++;
        }
        break;
      case 2:
        if (count > 0){
            int index = get_int();
          if (index < 0 || index >= count) _exit(1);
          puts(notes[index]);
        }
        break;
      case 3:
        if (count > 0){
          int index = get_int();
          if (index < 0 || index >= count) _exit(1);
          free(notes[index]);
        }
        break;
      default:
        _exit(1);
    }
  }
}