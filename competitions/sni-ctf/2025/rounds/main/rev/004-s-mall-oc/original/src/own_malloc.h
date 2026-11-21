#include <malloc.h>
#include <stdlib.h>
#include <sys/types.h>
#include <unistd.h>
#include <assert.h>
#include <string.h>
#include <stdint.h>
#include <ctype.h>

#if defined(__x86_64__) || defined(__LP64__)
    #define BIT_SIZE 64
    #define BYTE_SIZE 8
#else
    #define BIT_SIZE 32
    #define BYTE_SIZE 4
#endif

#define USED_BIT ((size_t)1 << (BIT_SIZE - 1))
#define SIZE_MASK (~USED_BIT)
#define METADATA_SIZE (BYTE_SIZE + sizeof(void *))

#define MAX_DUMP_BYTES SIZE_MAX  // Max bytes to dump per block (prevent spamming console).
                            // Set to SIZE_MAX to dump EVERYTHING.

#define C_RESET  "\033[0m"
#define C_RED    "\033[31m"
#define C_GREEN  "\033[32m"
#define C_YELLOW "\033[33m"
#define C_BLUE   "\033[34m"
#define C_CYAN   "\033[36m"
#define C_GRAY   "\033[90m"

void *ARENA;
unsigned long long ARENA_SIZE;

void small_init() {
  ARENA = sbrk(0);
  ARENA_SIZE = 0;
}

void *small_rmalloc(size_t size) {
  void *p = sbrk(0);
  void *request = sbrk(size);
  if (request == (void *)-1) {
    return NULL; // sbrk failed.
  } else {
    assert(p == request); // Not thread safe.
    ARENA_SIZE += size;
    return p;
  }
}

void *small_malloc(size_t size) {
  if (size == 0) {
    return NULL;
  }

  if (size >= (1ULL << (BIT_SIZE - 1))) {
    return NULL;
  }

  // Search for a free block in the existing arena
  void *current = ARENA;
  void *arena_end = ARENA + ARENA_SIZE;

  while (current < arena_end) {
    size_t *header = (size_t *)current;
    size_t block_size = *header & SIZE_MASK;
    int is_used = (*header & USED_BIT) != 0;

    if (!is_used && block_size >= size) {
      // Found a free block that's large enough
      void **next_ptr = (void **)(current + BYTE_SIZE + size);

      if (current + BYTE_SIZE + block_size >= arena_end){
        *next_ptr = NULL;
      } else if (block_size > size + METADATA_SIZE) {
        *header = size | USED_BIT;
        *next_ptr = current + BYTE_SIZE + block_size + sizeof(void *);
        size_t *next_header = (size_t *)*next_ptr;
        *next_header = block_size - size - METADATA_SIZE;
      } else {
          *header |= USED_BIT;
      }

      return current + BYTE_SIZE;
    }

    // Move to next block
    void **next_ptr = (void **)(current + BYTE_SIZE + block_size);
    void *next = *next_ptr;

    if (next == NULL) {
      break;
    }
    current = next;
  }

  // No suitable free block found, allocate new memory
  void *p = small_rmalloc(BYTE_SIZE           // for size and used flag
                    + size              // for data
                    + sizeof(void *)    // for next pointer
  );
  if (p == NULL) {
    return NULL; // small_rmalloc failed.
  }

  // Link previous block to this new block if there was a previous block
  if (current >= ARENA && current < arena_end) {
    size_t *prev_header = (size_t *)current;
    size_t prev_size = *prev_header & SIZE_MASK;
    void **prev_next = (void **)(current + BYTE_SIZE + prev_size);
    *prev_next = p;
  }

  *(size_t *)p = size | USED_BIT;
  *(void **)(p + BYTE_SIZE + size) = NULL;
  return p + BYTE_SIZE;
}

void small_free(void *ptr) {
  if (ptr == NULL) {
    return;
  }

  void *block = ptr - BYTE_SIZE;

  // Verify the pointer is within our arena
  if (block < ARENA || block >= ARENA + ARENA_SIZE) {
    return; // Invalid pointer
  }

  size_t *header = (size_t *)block;
  size_t block_size = *header & SIZE_MASK;

  // Mark as free by clearing the used bit
  *header = block_size;

  // Try to merge with next block if it's also free
  void **next_ptr = (void **)(block + BYTE_SIZE + block_size);
  void *next_block = *next_ptr;

  if (next_block != NULL && next_block < ARENA + ARENA_SIZE) {
    size_t *next_header = (size_t *)next_block;
    int next_is_used = (*next_header & USED_BIT) != 0;

    if (!next_is_used) {
      // Next block is free, merge it
      size_t next_size = *next_header & SIZE_MASK;

      // Get the next block's next pointer
      void **next_next_ptr = (void **)(next_block + BYTE_SIZE + next_size);
      void *next_next = *next_next_ptr;

      // Calculate new merged size: current_size + metadata_overhead + next_size
      size_t merged_size = block_size + BYTE_SIZE + sizeof(void *) + next_size;

      // Update current block with merged size
      *header = merged_size;

      // Update next pointer to skip the merged block
      next_ptr = (void **)(block + BYTE_SIZE + merged_size);
      *next_ptr = next_next;
    }
  }
}

void *small_realloc(void *ptr, size_t size) {
  if (ptr == NULL) {
    return small_malloc(size);
  }

  if (size == 0) {
    free(ptr);
    return NULL;
  }

  void *block = ptr - BYTE_SIZE;
  size_t *header = (size_t *)block;
  size_t old_size = *header & SIZE_MASK;

  // If new size is smaller or equal, just return same pointer
  if (size <= old_size) {
    return ptr;
  }

  void *new_ptr = small_malloc(size);
  if (new_ptr == NULL) {
    return NULL; // malloc failed.
  }

  memcpy(new_ptr, ptr, old_size);
  free(ptr);
  return new_ptr;
}

void *small_calloc(size_t nmemb, size_t size) {
  if (nmemb == 0 || size == 0) {
    return NULL;
  }

  // Check for overflow
  if (nmemb > SIZE_MAX / size) {
    return NULL;
  }

  size_t total_size = nmemb * size;
  void *ptr = small_malloc(total_size);

  if (ptr != NULL) {
    memset(ptr, 0, total_size);
  }

  return ptr;
}

void* get_arena_start() {
    return ARENA;
}

void print_arena() {
    if (ARENA == NULL || ARENA_SIZE == 0) {
        printf(C_RED "Arena is empty/uninitialized.\n" C_RESET);
        return;
    }

    printf("\n" C_BLUE "=== MEMORY ARENA DUMP ===" C_RESET "\n");
    printf("Range:  [%p - %p]\n", ARENA, (char*)ARENA + ARENA_SIZE);
    printf("Size:   %llu bytes\n", (unsigned long long)ARENA_SIZE);
    printf(C_BLUE "=========================" C_RESET "\n");

    void *current = ARENA;
    void *arena_end = (char*)ARENA + ARENA_SIZE;
    int block_num = 0;

    // Stats
    int used_count = 0;
    int free_count = 0;
    size_t total_used = 0;
    size_t total_free = 0;

    while (current < arena_end && block_num < 1000) {
        size_t *header_ptr = (size_t *)current;
        size_t raw_header = *header_ptr;

        size_t block_size = raw_header & SIZE_MASK;
        int is_used = (raw_header & USED_BIT) != 0;

        void *data_start = (char*)current + BYTE_SIZE;
        void **next_ptr_loc = (void **)((char*)current + BYTE_SIZE + block_size);

        void *next_block = NULL;
        if ((char*)next_ptr_loc + sizeof(void*) <= (char*)arena_end) {
             next_block = *next_ptr_loc;
        }

        if (is_used) { used_count++; total_used += block_size; }
        else         { free_count++; total_free += block_size; }

        printf("\n" C_GRAY "----------------------------------------------------" C_RESET "\n");
        printf("BLOCK #%d @ " C_BLUE "%p" C_RESET, block_num, current);

        if (is_used) printf(" [" C_GREEN " USED " C_RESET "]");
        else         printf(" [" C_YELLOW " FREED " C_RESET "]");

        printf("\n  Header: 0x%zx (Size: %zu bytes)\n", raw_header, block_size);

        printf("  Next:   ");
        if (next_block == NULL) printf(C_GRAY "(End of List)" C_RESET);
        else if (next_block <= current || next_block >= arena_end) printf(C_RED "%p (INVALID)" C_RESET, next_block);
        else printf("%p", next_block);
        printf("\n");

        printf("  Content:\n");
        unsigned char *p = (unsigned char *)data_start;

        // Loop through the data in 16-byte chunks
        // We limit it by MAX_DUMP_BYTES to avoid freezing if you have a 1GB block
        size_t limit = (block_size > MAX_DUMP_BYTES) ? MAX_DUMP_BYTES : block_size;

        for (size_t i = 0; i < limit; i += 16) {
            printf(C_GRAY "    +%04zx: " C_RESET, i);

            for (size_t j = 0; j < 16; j++) {
                if (i + j < limit) {
                    printf("%02x ", p[i + j]);
                } else {
                    printf("   "); // Padding for incomplete last row
                }
            }

            printf(C_GRAY "| " C_RESET);

            printf(C_CYAN);
            for (size_t j = 0; j < 16; j++) {
                if (i + j < limit) {
                    unsigned char c = p[i + j];
                    printf("%c", isprint(c) ? c : '.');
                }
            }
            printf(C_RESET "\n");
        }

        if (block_size > MAX_DUMP_BYTES) {
            printf(C_GRAY "    ... (%zu bytes truncated) ..." C_RESET "\n", block_size - MAX_DUMP_BYTES);
        }

        if (next_block == NULL || next_block <= current || next_block >= arena_end) break;
        current = next_block;
        block_num++;
    }

    printf("\n" C_BLUE "STATS:" C_RESET "\n");
    printf("  Blocks: %d  (Used: %d, Free: %d)\n", block_num + 1, used_count, free_count);
    printf("  Memory: %zu used, %zu free, %zu overhead\n",
            total_used, total_free,
            (size_t)(block_num + 1) * (BYTE_SIZE + sizeof(void*)));
    printf("\n");
}
