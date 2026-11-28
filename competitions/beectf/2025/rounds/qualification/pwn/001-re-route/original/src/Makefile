# Makefile for chall.c (Full RELRO)

CC       ?= gcc
BIN      := chall
SRC      := chall.c
OBJ      := $(SRC:.c=.o)

CFLAGS   := -O2 \
            -fno-stack-protector \
            -fno-pie \
            -fcf-protection=none \
            -fno-inline \
            -fcall-saved-rdi \
            -fno-omit-frame-pointer \
            -fno-optimize-sibling-calls

# Full RELRO = -z relro + -z now
LDFLAGS  := -no-pie -Wl,-z,relro -Wl,-z,now

.PHONY: all clean re debug

all: $(BIN)

$(BIN): $(OBJ)
	$(CC) $(OBJ) $(LDFLAGS) -o $@
	$(RM) -rf $(OBJ)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	$(RM) $(OBJ) $(BIN)

re: clean all

# Debug build (-O0 -g) with same hardening/ABI flags + full RELRO
debug: CFLAGS := -O0 -g \
                 -fno-stack-protector \
                 -fno-pie \
                 -fcf-protection=none \
                 -fno-inline \
                 -fcall-saved-rdi \
                 -fno-omit-frame-pointer \
                 -fno-optimize-sibling-calls
debug: LDFLAGS := -no-pie -Wl,-z,relro -Wl,-z,now
debug: re