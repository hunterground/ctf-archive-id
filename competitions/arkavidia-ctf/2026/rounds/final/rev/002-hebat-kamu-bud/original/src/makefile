CC      = gcc
CFLAGS  = -O2 -static
TARGET  = chall
SRC     = hebatkamubud.c
.PHONY: all clean

all: $(TARGET)

$(TARGET): $(SRC)
	$(CC) $(CFLAGS) -o $@ $<

clean:
	rm -f $(TARGET)