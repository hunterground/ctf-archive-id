CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -I/usr/include/lua5.4 -static -O0 -fno-inline -fno-omit-frame-pointer
LIBS = -llua5.4
STRIP_FLAGS = -s

# Detect OS
UNAME_S := $(shell uname -s 2>/dev/null || echo Windows)
ifeq ($(UNAME_S),Linux)
    LIBS += -lm -ldl -static
endif
ifeq ($(UNAME_S),Darwin)
    LIBS += -lm
    # macOS doesn't support static linking easily
    CFLAGS := $(filter-out -static,$(CFLAGS))
    LIBS := $(filter-out -static,$(LIBS))
endif
ifeq ($(UNAME_S),Windows)
    TARGET = main.exe
    LIBS += -static
    # If using manual Lua installation, uncomment and adjust path:
    # CFLAGS += -IC:\lua\include
    # LIBS += -LC:\lua\lib
else
    TARGET = main
endif

SOURCE = main.c

$(TARGET): $(SOURCE)
	$(CC) $(CFLAGS) -o $(TARGET) $(SOURCE) $(LIBS)
	strip $(STRIP_FLAGS) $(TARGET)

# Alternative target for debugging (with symbols)
debug: $(SOURCE)
	$(CC) -Wall -Wextra -std=c99 -I/usr/include/lua5.4 -g -o $(TARGET)_debug $(SOURCE) -llua5.4 -lm -ldl

clean:
	rm -f $(TARGET) $(TARGET)_debug

.PHONY: clean debug
