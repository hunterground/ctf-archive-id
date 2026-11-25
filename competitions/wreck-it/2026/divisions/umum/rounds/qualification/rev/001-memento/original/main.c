#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <stdlib.h>
#ifdef _WIN32
#include <windows.h>
#include <process.h>
#else
#include <unistd.h>
#include <pthread.h>
#include <sys/ptrace.h>
#include <sys/types.h>
#endif

#if defined(_MSC_VER)
#define FORCE_INLINE __forceinline
#elif defined(__GNUC__)
#define FORCE_INLINE inline __attribute__((always_inline))
#else
#define FORCE_INLINE inline
#endif

static const uint8_t obf_table[] = {0x13, 0x88, 0xA0, 0x72, 0x91, 0x44, 0xE1, 0x5C};

typedef struct
{
    const uint8_t *data;
    size_t len;
    uint8_t salt;
} EncStr;

static const uint8_t enc_banner[] = {0xC1, 0x02, 0x46, 0x6A, 0xA6, 0xE5, 0xD6, 0x8D, 0x03, 0x24, 0xEA, 0xA2, 0x66, 0x2E, 0x83, 0xD5, 0x32, 0x69, 0xA0, 0xC6, 0x18, 0x09};
static const uint8_t enc_mem_corrupt[] = {0xC2, 0x16, 0x4A, 0x94, 0xCD, 0x02, 0xE7, 0x90, 0x40, 0x11, 0xE5, 0xAE, 0x6F, 0x2F, 0xFE, 0xCC, 0x01, 0x13, 0xA3, 0xDE, 0x0B, 0x5E, 0x84, 0xC7, 0xEA, 0xA7, 0x39};
static const uint8_t enc_fake_ok[] = {0xC5, 0x1A, 0x53, 0xC6, 0xCD, 0x55, 0xAF, 0x6C, 0x3D, 0x0C, 0xF8, 0xA7, 0x7C, 0x65, 0xE5, 0xC0, 0x12, 0x15, 0x91, 0xE8, 0x1C, 0x46, 0xC3};
static const uint8_t enc_fake_no[] = {0xF3, 0x5C, 0x5A, 0x89, 0xD4, 0x09, 0xEA, 0x74, 0x35, 0xBC, 0x80, 0x4D, 0x7E, 0x25, 0xEF, 0xC6, 0x1F, 0x1C, 0x9B, 0xE6, 0x62, 0x6D, 0xCA, 0xD7, 0xF5, 0xAE, 0x6E, 0x2C, 0xB2, 0x83, 0x5F, 0x04, 0xC9, 0x95, 0xD6, 0x0D, 0x02, 0x81, 0xF3, 0x60, 0x75, 0xAB, 0x0C, 0x88, 0xBF, 0x65, 0x24, 0xD4};
static const uint8_t enc_fake_recover1[] = {0xF9, 0x39, 0x2C, 0xBB, 0xDC, 0x42, 0xB1, 0x63, 0x60, 0xE7, 0x89, 0x4F, 0x07, 0xC0, 0x85, 0x85};
static const uint8_t enc_fake_recover2[] = {0xE4, 0x71, 0x7A, 0xBC, 0xF3, 0x7E, 0x95, 0x0D, 0x3F, 0xE4, 0x94, 0x58, 0x10, 0xDB, 0x94, 0x3F, 0x2D, 0xA6, 0xF1, 0xFC, 0x29, 0x39, 0x88, 0xAA, 0xDB, 0x84, 0x19, 0x19, 0xD2, 0x97, 0x54, 0x43};
static const uint8_t enc_real_line[] = {0xEA, 0x3E, 0x72, 0xAC, 0xF5, 0x2A, 0xCF, 0x48, 0x16, 0xD5, 0xDF, 0x50, 0x1F, 0xC2, 0x81, 0x2C, 0x62, 0xFB, 0xEB, 0x0B, 0x42, 0x33, 0xBC, 0xE3, 0xD6, 0x8B, 0x5A, 0x53, 0xD8, 0xA5, 0x2F, 0x0A, 0x87, 0xE9, 0x30, 0x6C, 0xAA, 0xBD};
static const uint8_t enc_prompt[] = {0x0B, 0x4E, 0x89, 0xBA, 0xAC, 0x2F, 0x83, 0x1E, 0x08, 0xDE, 0xAD, 0x2E, 0x2A, 0xFA, 0x81, 0x39, 0x23, 0xF9, 0xB7, 0x4E};
static const uint8_t enc_scanfmt[] = {0x66, 0x01, 0xC8, 0xCC};
static const uint8_t enc_fake_a[] = {0x1E, 0x7F, 0xA0, 0xFA, 0x3A, 0x74, 0x51, 0x06, 0x12, 0xF9, 0xA7, 0x6C, 0x32, 0xE9, 0x8A, 0x35, 0x41, 0xA8, 0xDA, 0x37, 0x5E, 0x89, 0xC0, 0x2E};
static const uint8_t enc_fake_b[] = {0x0B, 0x56, 0x85, 0xFA, 0x28, 0x54, 0x64, 0x2A, 0xE7, 0xA0, 0x7E, 0x77, 0x21, 0xF6, 0x96, 0x13, 0x11, 0x92, 0x82, 0x1A, 0x63, 0x9D, 0x9D, 0x5C, 0xA8};

static const uint8_t a1[] = {
    0x41, 0x2E, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0x1F, 0xDA, 0x97, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0xEA, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0xDB, 0xDA, 0x3A, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0x4A, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0x7B, 0xDA, 0xE6, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0xB3, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0x82, 0xDA, 0xFE, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0xA2, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0x93, 0xDA, 0x49, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0x67, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0x56, 0xDA, 0xBE, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0xB4, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0x85, 0xDA, 0x28, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0x63, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0x52, 0xDA, 0x60, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0x76, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0x47, 0xDA, 0xA4, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0xD7, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0xE6, 0xDA, 0xEB, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0xEC};

static const uint8_t a2[] = {
    0x41, 0xE0, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0xD1, 0xDA, 0xBE, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0xC9, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0xF8, 0xDA, 0x5C, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0x46, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0x77, 0xDA, 0xC5, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0xA7, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0x96, 0xDA, 0xCC, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0xD0, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0xE1, 0xDA, 0x68, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0x21, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0x10, 0xDA, 0xD8, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0x8C, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0xBD, 0xDA, 0xE6, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0x80, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0xB1, 0xDA, 0x51, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0xA5, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0x94, 0xDA, 0xC8, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0xC7, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0xF6, 0xDA, 0xFA, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0xEC};

static const uint8_t a3[] = {
    0x41, 0xC6, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0xF7, 0xDA, 0xC6, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0xBA, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0x8B, 0xDA, 0x3E, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0x42, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0x73, 0xDA, 0xF1, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0xE3, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0xD2, 0xDA, 0x38, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0xC4, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0xF5, 0xDA, 0x6B, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0x26, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0x17, 0xDA, 0xBE, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0xA8, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0x99, 0xDA, 0xFC, 0xEE, 0xAB, 0x95, 0x9E, 0xB8,
    0x41, 0xBA, 0x3C, 0x48, 0x40, 0x3B, 0x05, 0x37, 0x8B, 0x77};

static const EncStr STR_BANNER = {enc_banner, sizeof(enc_banner), 0x21};
static const EncStr STR_MEM_CORRUPT = {enc_mem_corrupt, sizeof(enc_mem_corrupt), 0x2D};
static const EncStr STR_FAKE_OK = {enc_fake_ok, sizeof(enc_fake_ok), 0x33};
static const EncStr STR_FAKE_NO = {enc_fake_no, sizeof(enc_fake_no), 0x3A};
static const EncStr STR_FAKE_RECOVER1 = {enc_fake_recover1, sizeof(enc_fake_recover1), 0x44};
static const EncStr STR_FAKE_RECOVER2 = {enc_fake_recover2, sizeof(enc_fake_recover2), 0x4F};
static const EncStr STR_REAL_LINE = {enc_real_line, sizeof(enc_real_line), 0x55};
static const EncStr STR_PROMPT = {enc_prompt, sizeof(enc_prompt), 0x60};
static const EncStr STR_SCANFMT = {enc_scanfmt, sizeof(enc_scanfmt), 0x71};
static const EncStr STR_FAKE_A = {enc_fake_a, sizeof(enc_fake_a), 0x6B};
static const EncStr STR_FAKE_B = {enc_fake_b, sizeof(enc_fake_b), 0x77};

static FORCE_INLINE void wipe_buf(char *buf, size_t len)
{
    for (size_t i = 0; i < len; i++)
    {
        ((volatile char *)buf)[i] = 0;
    }
}

static FORCE_INLINE void decode_str(const EncStr *s, char *out, size_t out_cap)
{
    size_t n = s->len;

    if (out_cap == 0)
    {
        return;
    }
    if (n >= out_cap)
    {
        n = out_cap - 1;
    }

    for (size_t i = 0; i < n; i++)
    {
        uint8_t k = (uint8_t)(0xA7 + (i * 0x3DU) + s->salt);
        k ^= (uint8_t)(0x5B + (i * 7U));
        out[i] = (char)(s->data[i] ^ k);
    }
    out[n] = '\0';
}

static FORCE_INLINE void print_line(const EncStr *s)
{
    char buf[128];

    decode_str(s, buf, sizeof(buf));
    puts(buf);
    wipe_buf(buf, sizeof(buf));
}

static void banner(void)
{
    print_line(&STR_BANNER);
}

static void anti_debug(void)
{
#ifdef _WIN32
    if (IsDebuggerPresent())
    {
        print_line(&STR_MEM_CORRUPT);
        ExitProcess(0);
    }
#else
    if (ptrace(PTRACE_TRACEME, 0, NULL, NULL) == -1)
    {
        print_line(&STR_MEM_CORRUPT);
        exit(0);
    }
#endif
}

static uint32_t generate_key(void)
{
    uint32_t seed = 0x13579BDF;
#ifdef _WIN32
    uint32_t pid = (uint32_t)GetCurrentProcessId();
#else
    uint32_t pid = (uint32_t)getpid();
#endif
    uint32_t mix = ((pid << 7) | (pid >> 25)) ^ 0xC3C3C3C3;

    seed ^= 0xDEADBEEF;
    seed = (seed << 5) | (seed >> (32 - 5));
    seed = seed + 0x02468ACE;
    seed ^= (seed >> 7);
    seed ^= 0xA5A5A5A5;

    seed ^= mix;
    seed += (mix & 0x0F0F0F0F);
    seed -= (mix & 0x0F0F0F0F);
    seed ^= mix;

    return seed ^ 0x12345678;
}

static FORCE_INLINE uint8_t key_byte(uint32_t key, size_t index)
{
    uint8_t k = (uint8_t)((key >> ((index % 4) * 8)) & 0xFF);
    return (uint8_t)(k ^ (uint8_t)((index * 0x13U) & 0xFFU));
}

static FORCE_INLINE uint8_t add_byte(size_t index)
{
    return (uint8_t)((0x5AU + (index * 7U)) & 0xFFU);
}

static FORCE_INLINE size_t vm_run(const uint8_t *prog, size_t prog_len, char *out, size_t out_cap, size_t base_index, uint32_t key);

typedef struct
{
    const uint8_t *prog;
    size_t prog_len;
    size_t base_index;
    char *out;
    size_t out_cap;
    uint32_t key;
    uint8_t mode;
    uint32_t delay_ms;
} Task;

#ifdef _WIN32
static DWORD WINAPI worker_thread(LPVOID arg)
{
    Task *t = (Task *)arg;

    if (t->mode == 0)
    {
        vm_run(t->prog, t->prog_len, t->out, t->out_cap, t->base_index, t->key);
    }
    else
    {
        Sleep(t->delay_ms);
        SecureZeroMemory(t->out, t->out_cap);
    }

    return 0;
}
#else
static void *worker_thread(void *arg)
{
    Task *t = (Task *)arg;

    if (t->mode == 0)
    {
        vm_run(t->prog, t->prog_len, t->out, t->out_cap, t->base_index, t->key);
    }
    else
    {
        usleep(t->delay_ms * 1000);
        wipe_buf(t->out, t->out_cap);
    }

    return NULL;
}
#endif

static FORCE_INLINE size_t vm_run(const uint8_t *prog, size_t prog_len, char *out, size_t out_cap, size_t base_index, uint32_t key)
{
    uint8_t decoded[256];
    uint8_t stack[32];
    uint64_t s[8] = {0};

    if (prog_len > sizeof(decoded))
    {
        return 0;
    }

    for (size_t i = 0; i < prog_len; i++)
    {
        uint8_t mix = (uint8_t)((key >> ((i % 4U) * 8U)) + (uint32_t)(i * 0x17U));
        decoded[i] = (uint8_t)(prog[i] ^ obf_table[i & 7U] ^ mix);
    }

#if defined(__GNUC__) && !defined(_WIN32)
    static void *jt[256] = {
        [0x52] = &&L_PUSH,
        [0x9C] = &&L_KEY,
        [0xD1] = &&L_ADDK,
        [0x3A] = &&L_XOR,
        [0x7F] = &&L_ADD,
        [0xE4] = &&L_STORE,
        [0x6B] = &&L_JUNK,
        [0xFF] = &&L_END};

    while ((size_t)s[0] < prog_len)
    {
        uint8_t op = decoded[s[0]++];
        void *dst = jt[op];
        if (dst == NULL)
        {
            continue;
        }
        goto *dst;

    L_PUSH:
        if ((size_t)s[0] < prog_len && (size_t)s[1] < sizeof(stack))
        {
            stack[s[1]++] = decoded[s[0]++];
        }
        continue;
    L_KEY:
        if ((size_t)s[1] < sizeof(stack))
        {
            stack[s[1]++] = key_byte(key, base_index + (size_t)s[2]);
        }
        continue;
    L_ADDK:
        if ((size_t)s[1] < sizeof(stack))
        {
            stack[s[1]++] = add_byte(base_index + (size_t)s[2]);
        }
        continue;
    L_XOR:
        if (s[1] >= 2)
        {
            stack[s[1] - 2] = (uint8_t)(stack[s[1] - 2] ^ stack[s[1] - 1]);
            s[1]--;
        }
        continue;
    L_ADD:
        if (s[1] >= 2)
        {
            stack[s[1] - 2] = (uint8_t)(stack[s[1] - 2] + stack[s[1] - 1]);
            s[1]--;
        }
        continue;
    L_STORE:
        if (s[1] > 0)
        {
            size_t idx = base_index + (size_t)s[2];
            if (idx < out_cap)
            {
                out[idx] = (char)stack[--s[1]];
            }
            else
            {
                s[1]--;
            }
            s[2]++;
        }
        continue;
    L_JUNK:
        if ((size_t)s[0] < prog_len)
        {
            s[3] ^= decoded[s[0]++];
        }
        continue;
    L_END:
        break;
    }
#else
    while ((size_t)s[0] < prog_len)
    {
        uint8_t op = decoded[s[0]++];

        switch (op)
        {
        case 0x52:
            if ((size_t)s[0] < prog_len && (size_t)s[1] < sizeof(stack))
            {
                stack[s[1]++] = decoded[s[0]++];
            }
            break;
        case 0x9C:
            if ((size_t)s[1] < sizeof(stack))
            {
                stack[s[1]++] = key_byte(key, base_index + (size_t)s[2]);
            }
            break;
        case 0xD1:
            if ((size_t)s[1] < sizeof(stack))
            {
                stack[s[1]++] = add_byte(base_index + (size_t)s[2]);
            }
            break;
        case 0x3A:
            if (s[1] >= 2)
            {
                stack[s[1] - 2] = (uint8_t)(stack[s[1] - 2] ^ stack[s[1] - 1]);
                s[1]--;
            }
            break;
        case 0x7F:
            if (s[1] >= 2)
            {
                stack[s[1] - 2] = (uint8_t)(stack[s[1] - 2] + stack[s[1] - 1]);
                s[1]--;
            }
            break;
        case 0xE4:
            if (s[1] > 0)
            {
                size_t idx = base_index + (size_t)s[2];
                if (idx < out_cap)
                {
                    out[idx] = (char)stack[--s[1]];
                }
                else
                {
                    s[1]--;
                }
                s[2]++;
            }
            break;
        case 0x6B:
            if ((size_t)s[0] < prog_len)
            {
                s[3] ^= decoded[s[0]++];
            }
            break;
        case 0xFF:
            s[0] = prog_len;
            break;
        default:
            break;
        }
    }
#endif

    return (size_t)s[2];
}

static FORCE_INLINE void build_fake_flag(char *out, size_t out_cap)
{
    char a[64];
    char b[64];
    size_t pos = 0;

    decode_str(&STR_FAKE_A, a, sizeof(a));
    decode_str(&STR_FAKE_B, b, sizeof(b));

    for (size_t i = 0; a[i] != '\0' && pos + 1 < out_cap; i++)
    {
        out[pos++] = a[i];
    }
    for (size_t i = 0; b[i] != '\0' && pos + 1 < out_cap; i++)
    {
        out[pos++] = b[i];
    }
    out[pos] = '\0';

    wipe_buf(a, sizeof(a));
    wipe_buf(b, sizeof(b));
}

static void fake_validation(const char *input)
{
    char buf[128];

    build_fake_flag(buf, sizeof(buf));
    if (strcmp(input, buf) == 0)
    {
        print_line(&STR_FAKE_OK);
    }
    else
    {
        print_line(&STR_FAKE_NO);
    }
    wipe_buf(buf, sizeof(buf));
}

static void fake_recover(void)
{
    print_line(&STR_FAKE_RECOVER1);
    print_line(&STR_FAKE_RECOVER2);
}

static int sanity_check(const char *input)
{
    size_t len = strlen(input);
    uint32_t h = 0xC001D00D;

    for (size_t i = 0; i < len; i++)
    {
        uint32_t v = (uint8_t)input[i];
        h += v + (uint32_t)(i * 0x1337U);
        h ^= (h << 7) | (h >> 25);
        h *= 0x45D9F3BU;
        h ^= (h >> 11);
    }

    h ^= (uint32_t)(len * 0x9E3779B1U);

    return (len > 80) && (h == 0xDEADC0DE);
}

static void real_recover(void)
{
    char flag[64];
    size_t total = 55;
    uint32_t key = generate_key();

    Task tasks[3] = {
        {a1, sizeof(a1), 0, flag, sizeof(flag), key, 0, 0},
        {a2, sizeof(a2), 20, flag, sizeof(flag), key, 0, 0},
        {a3, sizeof(a3), 40, flag, sizeof(flag), key, 0, 0}};
    Task wipe_task = {NULL, 0, 0, flag, sizeof(flag), 0, 1, 1200};

    memset(flag, 0, sizeof(flag));

#ifdef _WIN32
    HANDLE threads[3];
    for (int i = 0; i < 3; i++)
    {
        threads[i] = CreateThread(NULL, 0, worker_thread, &tasks[i], 0, NULL);
    }
    for (int i = 0; i < 3; i++)
    {
        if (threads[i])
        {
            WaitForSingleObject(threads[i], INFINITE);
            CloseHandle(threads[i]);
        }
    }

    HANDLE wipe = CreateThread(NULL, 0, worker_thread, &wipe_task, 0, NULL);
    if (wipe)
    {
        CloseHandle(wipe);
    }
#else
    pthread_t threads[3];
    for (int i = 0; i < 3; i++)
    {
        pthread_create(&threads[i], NULL, worker_thread, &tasks[i]);
    }
    for (int i = 0; i < 3; i++)
    {
        pthread_join(threads[i], NULL);
    }

    pthread_t wipe;
    if (pthread_create(&wipe, NULL, worker_thread, &wipe_task) == 0)
    {
        pthread_detach(wipe);
    }
#endif

    if (total < sizeof(flag))
    {
        flag[total] = '\0';
    }

    print_line(&STR_REAL_LINE);

#ifdef _WIN32
    Sleep(3000);
    SecureZeroMemory(flag, sizeof(flag));
#else
    usleep(3000 * 1000);
    for (size_t i = 0; i < sizeof(flag); i++)
    {
        ((volatile char *)flag)[i] = 0;
    }
#endif
}

static void recover_memory(const char *input)
{
    if (sanity_check(input))
    {
        fake_recover();
    }
    else
    {
        real_recover();
    }
}

int main(void)
{
    char input[64];

    banner();
    anti_debug();

    {
        char buf[128];

        decode_str(&STR_PROMPT, buf, sizeof(buf));
        fputs(buf, stdout);
        wipe_buf(buf, sizeof(buf));
    }
    {
        char fmt[16];

        decode_str(&STR_SCANFMT, fmt, sizeof(fmt));
        if (scanf(fmt, input) != 1)
        {
            wipe_buf(fmt, sizeof(fmt));
            return 0;
        }
        wipe_buf(fmt, sizeof(fmt));
    }

    fake_validation(input);

#ifdef _WIN32
    Sleep(1000);
#else
    usleep(1000 * 1000);
#endif

    recover_memory(input);

    return 0;
}
