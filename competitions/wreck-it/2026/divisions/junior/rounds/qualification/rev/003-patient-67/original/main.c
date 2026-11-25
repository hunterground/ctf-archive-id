#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <libgen.h>
#include <stdint.h>

#define INPUT_MAX 128
#define REAL_LEN 16
#define FLAG_PREFIX "WRECKIT7{"

#define TAG_MSG 0x13579BDFu
#define TAG_ENV 0x00A55A01u
#define TAG_FAKE_KEY 0x00BEEF42u
#define TAG_FAKE_FLAG 0x00C0FFEEu
#define TAG_REAL_SIG 0xD00DFEEDu

static const unsigned char env_required_enc2[] = {
    0x11, 0x14, 0x85, 0x1A, 0xFA, 0x01, 0x3B, 0x0A,
    0xEA, 0x9C, 0x0A, 0xE4, 0x3E, 0xB1, 0xF9, 0x21};

static const unsigned char fake_flag_key_enc2[] = {
    0x48, 0x87, 0x41, 0xF5, 0x70, 0x9F, 0x47, 0x79,
    0xB9, 0x22, 0x61};

static const unsigned char msg_prompt_enc2[] = {0xCC, 0x3A, 0x8C, 0x55, 0xB9, 0x10, 0x78, 0xBD, 0xF5, 0xC2, 0x48, 0x01, 0xCE, 0xFD, 0x04, 0x6B, 0x70, 0x25};
static const unsigned char msg_fake_len_enc2[] = {0xCF, 0x3A, 0x84, 0x52, 0xBA, 0x55, 0x64, 0xF2, 0xF5, 0x8A, 0x54, 0x4E, 0xDD, 0xE3, 0x45, 0x62, 0x2B, 0x68, 0xF9, 0x3C, 0xE5, 0x51, 0x9D, 0x03, 0x50, 0xFE, 0x08, 0x4D, 0x6D, 0x5D, 0x0C, 0xF6, 0x2E, 0x75, 0xAC, 0xEE};
static const unsigned char msg_fake_retry_enc2[] = {0xCF, 0x3A, 0x80, 0x06, 0xBF, 0x1A, 0x63, 0xFE, 0xE4, 0xD9, 0x0D, 0x52, 0xC9, 0xE8, 0x45, 0x78, 0x38, 0x7C, 0xBC, 0x7C, 0xA3, 0x11, 0xD4, 0x3A, 0x16, 0x9B};
static const unsigned char msg_decode_fail_enc2[] = {0xCF, 0x3A, 0x80, 0x06, 0xBA, 0x1C, 0x6D, 0xF3, 0xE0, 0xC6, 0x0D, 0x47, 0xC7, 0xFD, 0x01, 0x69, 0x2E, 0x25, 0xF5, 0x73, 0xB0, 0x1F, 0x9D, 0x27, 0x4C, 0xF0, 0x5C, 0x65, 0x7C, 0x16, 0x26};
static const unsigned char msg_fake_fallback_enc2[] = {0xCF, 0x3A, 0x80, 0x06, 0xAD, 0x1A, 0x65, 0xEF, 0xA1, 0xC5, 0x5D, 0x44, 0xC6, 0xE2, 0x45, 0x6A, 0x25, 0x77, 0xBC, 0x69, 0xAC, 0x15, 0x9D, 0x31, 0x5B, 0xF9, 0x47, 0x22, 0x15};
static const unsigned char msg_denied_enc2[] = {0xDA, 0x3C, 0x81, 0x54, 0xAC, 0x02, 0x2A, 0xD1, 0xE0, 0xCF, 0x49, 0x45, 0xC1, 0xE2, 0x45, 0x65, 0x39, 0x25, 0xCF, 0x69, 0xAD, 0x1C, 0xD1, 0x74, 0x79, 0xFD, 0x41, 0x7A, 0x7A, 0x16, 0x0C, 0xFC, 0x29, 0x6F, 0xE6, 0x88, 0x03, 0x13, 0xE3, 0x22, 0x73, 0x24, 0xFA, 0x1E, 0xC4};
static const unsigned char msg_real_success_enc2[] = {0xD8, 0x3D, 0x8B, 0x41, 0xBB, 0x14, 0x7E, 0xEE, 0xA1, 0xFE, 0x48, 0x45, 0xCC, 0xE8, 0x45, 0x48, 0x2B, 0x6B, 0xF5, 0x78, 0xA8, 0x03, 0x9D, 0x20, 0x50, 0xF0, 0x5C, 0x7F, 0x3F, 0x6C, 0x5E, 0xDA, 0x24, 0x20, 0xD5, 0x88, 0x06, 0x54};
static const unsigned char msg_fake_success_enc2[] = {0xC2, 0x3D, 0x90, 0x06, 0xA8, 0x07, 0x6F, 0xBD, 0xEF, 0xC5, 0x5A, 0x01, 0xCE, 0xE3, 0x00, 0x69, 0x6A, 0x67, 0xE9, 0x69, 0xE8, 0x50, 0xCA, 0x31, 0x18, 0xF3, 0x47, 0x78, 0x77, 0x18, 0x47, 0xC1, 0x2E, 0x77, 0xB3, 0x8D, 0x13, 0x40, 0x88, 0x2D, 0x7E, 0x23, 0xBE};

static const unsigned char real_flag_sig_enc2[] = {
    0x95, 0x57, 0xF0, 0x14, 0x5C, 0x04, 0x29, 0xD8,
    0x28, 0xF3, 0x9C, 0x61, 0x97, 0x90, 0x98, 0xDC,
    0x5C, 0xFE, 0x55, 0x9C, 0xF9, 0x80, 0x8C, 0xD7,
    0x9E, 0x6E, 0x76, 0x87, 0xC5, 0x0E, 0xE1, 0x66,
    0xF3, 0x69, 0x39, 0x94, 0x7E, 0xC9, 0xEE, 0x50,
    0x3B, 0x79, 0x88, 0x8B, 0x55, 0xDC, 0xE5, 0xA4,
    0x60, 0x2E, 0xBE, 0x26, 0x76, 0x25, 0x1A, 0x64,
    0x75, 0xA5, 0xB0, 0x10, 0x9F, 0xCB, 0xC5, 0xE9,
    0x17, 0xFE, 0x13, 0xF4, 0x1E, 0x45, 0xF9, 0x16,
    0x3A, 0xE4, 0x23};

static const unsigned char fake_flag_enc2[] = {
    0xE4, 0xD1, 0x9A, 0x04, 0x01, 0x1F, 0x66, 0xF9,
    0xC1, 0xED, 0xDB, 0x29, 0x4C, 0x3E, 0xB5, 0x48,
    0x4C, 0x31, 0x08, 0xE0, 0x8F, 0xF7, 0x7B, 0x28,
    0xF8, 0x06, 0x0B, 0x17, 0x4F, 0x45, 0x3B, 0x09,
    0x7D, 0xFE, 0xA0, 0x8F, 0xBB, 0xAF, 0x1F, 0x0A,
    0xED};

static const unsigned char sbox[16] = {
    0xE, 0x4, 0xD, 0x1,
    0x2, 0xF, 0xB, 0x8,
    0x3, 0xA, 0x6, 0xC,
    0x5, 0x9, 0x0, 0x7};

static const unsigned char pbox[16] = {
    0, 5, 10, 15,
    4, 9, 14, 3,
    8, 13, 2, 7,
    12, 1, 6, 11};

static const unsigned char round_key[16] = {
    0x1, 0x2, 0x3, 0x4,
    0x5, 0x6, 0x7, 0x8,
    0x9, 0xA, 0xB, 0xC,
    0xD, 0xE, 0xF, 0x0};

static const unsigned char target_state[16] = {
    0x7, 0x1, 0x0, 0x1,
    0x1, 0xC, 0x2, 0x9,
    0x0, 0xB, 0xA, 0x7,
    0xF, 0xD, 0x1, 0x4};

typedef struct
{
    int name_ok;
    int env_ok;
} Context;

static int decode_blob(const unsigned char *enc, size_t len,
                       unsigned int tag, unsigned char *out, size_t out_size);
static void print_msg(const unsigned char *enc, size_t len, int newline);
static int opaque_gate(void);
static unsigned char real_transform(unsigned char b, size_t i);

static int name_score(const char *s)
{
    int score = 0;
    int vowels = 0;
    size_t i;

    if (s == NULL)
    {
        return 0;
    }

    for (i = 0; s[i] != '\0'; i++)
    {
        char c = s[i];
        score += (unsigned char)c;

        if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u' ||
            c == 'A' || c == 'E' || c == 'I' || c == 'O' || c == 'U')
        {
            vowels++;
        }
    }

    return score + (vowels * 7);
}

static Context collect_context(int argc, char **argv)
{
    Context ctx;
    const char *name = NULL;
    char *base = NULL;
    const char *env = NULL;
    char env_buf[32];

    ctx.name_ok = 0;
    ctx.env_ok = 0;

    if (argc > 0)
    {
        name = argv[0];
    }

    if (name)
    {
        base = basename((char *)name);
    }

    if (base && (name_score(base) % 7) == 3)
    {
        ctx.name_ok = 1;
    }

    env = getenv("THERAPY_SESSION");
    if (env)
    {
        if (decode_blob(env_required_enc2, sizeof(env_required_enc2), TAG_ENV,
                        (unsigned char *)env_buf, sizeof(env_buf)))
        {
            if (strcmp(env, env_buf) == 0)
            {
                ctx.env_ok = 1;
            }
        }
    }

    return ctx;
}

static int calculate_state(Context ctx)
{
    int sanity = 0x20;

    if (ctx.name_ok)
    {
        sanity += 0x12;
    }

    if (ctx.env_ok)
    {
        sanity += 0x10;
    }

    return sanity;
}

static void read_input(char *out, size_t out_size)
{
    size_t len = 0;

    memset(out, 0, out_size);
    if (fgets(out, (int)out_size, stdin) == NULL)
    {
        return;
    }

    len = strlen(out);
    if (len > 0 && out[len - 1] == '\n')
    {
        out[len - 1] = '\0';
    }
}

static unsigned int derive_seed(unsigned int tag)
{
    unsigned int x = tag ^ 0x9E3779B9u;

    x ^= (x >> 16);
    x *= 0x85EBCA6Bu;
    x ^= (x >> 13);
    x *= 0xC2B2AE35u;
    x ^= (x >> 16);
    return x;
}

static unsigned char stream_byte(unsigned int seed, size_t i)
{
    unsigned int k = seed ^ (unsigned int)(i * 0x45u + 0xA3u);

    k = (k << 7) | (k >> 25);
    k *= 0x9E3779B1u;
    k ^= (k >> 11);
    k += 0x7F4A7C15u;
    return (unsigned char)(k & 0xFFu);
}

static int decode_blob(const unsigned char *enc, size_t len,
                       unsigned int tag, unsigned char *out, size_t out_size)
{
    size_t i;
    unsigned int seed = derive_seed(tag);

    if (out_size < len + 1)
    {
        if (out_size > 0)
        {
            out[0] = '\0';
        }
        return 0;
    }

    for (i = 0; i < len; i++)
    {
        out[i] = (unsigned char)(enc[i] ^ stream_byte(seed, i));
    }
    out[len] = '\0';
    return 1;
}

static void print_msg(const unsigned char *enc, size_t len, int newline)
{
    char buf[160];

    if (!enc || len + 1 > sizeof(buf))
    {
        return;
    }

    if (!decode_blob(enc, len, TAG_MSG, (unsigned char *)buf, sizeof(buf)))
    {
        return;
    }

    printf("%s", buf);
    if (newline)
    {
        printf("\n");
    }
}

static int opaque_gate(void)
{
    volatile unsigned int x = 0xA5A5A5A5u;
    x ^= (x >> 3);
    return (x & 1u) == (x & 1u);
}

static unsigned char real_transform(unsigned char b, size_t i)
{
    unsigned char v = (unsigned char)(b ^ (unsigned char)(0x55u + i));
    v = (unsigned char)(v + (unsigned char)(i * 7u + 0x13u));
    v = (unsigned char)((v << 3) | (v >> 5));
    v ^= (unsigned char)(i * 0x5Du + 0xA7u);
    return v;
}

static int fake_checker(void)
{
    char input[INPUT_MAX];
    unsigned char keybuf[32];
    unsigned char basebuf[64];
    size_t key_len = sizeof(fake_flag_key_enc2) - 1;
    size_t expected_len = sizeof(fake_flag_enc2);
    size_t i;
    unsigned int diff = 0;
    unsigned int acc = 0xC3u;

    print_msg(msg_prompt_enc2, sizeof(msg_prompt_enc2), 0);
    read_input(input, sizeof(input));

    if (key_len == 0 ||
        !decode_blob(fake_flag_key_enc2, sizeof(fake_flag_key_enc2),
                     TAG_FAKE_KEY, keybuf, sizeof(keybuf)) ||
        !decode_blob(fake_flag_enc2, sizeof(fake_flag_enc2), TAG_FAKE_FLAG,
                     basebuf, sizeof(basebuf)))
    {
        print_msg(msg_decode_fail_enc2, sizeof(msg_decode_fail_enc2), 0);
        return 0;
    }

    if (strlen(input) != expected_len)
    {
        print_msg(msg_fake_len_enc2, sizeof(msg_fake_len_enc2), 0);
        return 0;
    }

    for (i = 0; i < expected_len; i++)
    {
        unsigned char k = keybuf[i % key_len];
        unsigned char expected = (unsigned char)(basebuf[i] ^
                                                 (unsigned char)(k + i));
        unsigned char v_in = (unsigned char)input[i];
        unsigned char mask = (unsigned char)(((unsigned int)sbox[i & 0xFu] << 4) |
                                             pbox[i & 0xFu]);

        mask ^= (unsigned char)(0xA5u + (i * 13u));
        v_in ^= mask;
        expected ^= mask;
        v_in = (unsigned char)((v_in << 3) | (v_in >> 5));
        expected = (unsigned char)((expected << 3) | (expected >> 5));
        diff |= (unsigned int)(v_in ^ expected);
        acc ^= (unsigned int)(v_in + expected + (unsigned int)(i * 3u));
        acc = (acc << 5) | (acc >> 27);
    }

    diff |= (unsigned int)((acc & 1u) ^ (acc & 1u));
    if (diff == 0)
    {
        return 1;
    }

    print_msg(msg_fake_retry_enc2, sizeof(msg_fake_retry_enc2), 0);
    return 0;
}

#ifdef AUTHORING
static void print_state(const unsigned char *state)
{
    size_t i;

    for (i = 0; i < REAL_LEN; i++)
    {
        printf("0x%X, ", state[i]);
    }

    printf("\n");
}
#endif

static void xor_key(unsigned char *state)
{
    size_t i;

    for (i = 0; i < REAL_LEN; i++)
    {
        state[i] ^= round_key[i];
        state[i] &= 0xF;
    }
}

static void apply_sbox(unsigned char *state)
{
    size_t i;

    for (i = 0; i < REAL_LEN; i++)
    {
        state[i] = sbox[state[i] & 0xF];
    }
}

static void permute(unsigned char *state)
{
    unsigned char tmp[REAL_LEN];
    size_t i;

    memset(tmp, 0, sizeof(tmp));

    for (i = 0; i < REAL_LEN; i++)
    {
        tmp[i] = state[pbox[i]];
    }

    memcpy(state, tmp, REAL_LEN);
}

static int real_checker(void)
{
    char input[INPUT_MAX];
    unsigned char sig[sizeof(real_flag_sig_enc2) + 1];
    size_t expected_len = sizeof(real_flag_sig_enc2);
    size_t i;
    unsigned int diff = 0;
    unsigned int acc = 0x6D2B79F5u;

    print_msg(msg_prompt_enc2, sizeof(msg_prompt_enc2), 0);
    read_input(input, sizeof(input));

    if (strlen(input) != expected_len)
    {
        return 0;
    }

    if (!decode_blob(real_flag_sig_enc2, sizeof(real_flag_sig_enc2), TAG_REAL_SIG,
                     sig, sizeof(sig)))
    {
        return 0;
    }

    if (!opaque_gate())
    {
        volatile unsigned int sink = (unsigned int)expected_len;
        sink ^= 0xC3u;
    }

    for (i = 0; i < expected_len; i++)
    {
        size_t idx = (i * 13u + 7u) % expected_len;
        unsigned char v = real_transform((unsigned char)input[idx], idx);
        unsigned char mask = (unsigned char)(((unsigned int)sbox[idx & 0xFu] << 4) |
                                             pbox[idx & 0xFu]);
        unsigned char s;

        mask ^= (unsigned char)(idx * 0xA7u + 0x3Du);
        v ^= mask;
        s = (unsigned char)(sig[idx] ^ mask);
        diff |= (unsigned int)(v ^ s);
        acc ^= (unsigned int)(v + sig[idx] + (unsigned int)idx);
        acc = (acc << 3) | (acc >> 29);
    }

    diff |= (unsigned int)((acc & 0x10u) ^ (acc & 0x10u));
    memset(input, 0, expected_len);
    memset(sig, 0, expected_len);
    return diff == 0;
}

static int run_real_flow(void)
{
    if (!real_checker())
    {
        return 0;
    }

    print_msg(msg_real_success_enc2, sizeof(msg_real_success_enc2), 1);
    return 1;
}

static int run_fake_flow(void)
{
    char flag[64];

    if (!fake_checker())
    {
        return 0;
    }

    if (decode_blob(fake_flag_enc2, sizeof(fake_flag_enc2), TAG_FAKE_FLAG,
                    (unsigned char *)flag, sizeof(flag)))
    {
        print_msg(msg_fake_success_enc2, sizeof(msg_fake_success_enc2), 1);
    }
    else
    {
        print_msg(msg_fake_fallback_enc2, sizeof(msg_fake_fallback_enc2), 0);
    }

    return 1;
}

int main(int argc, char **argv)
{
    Context ctx = collect_context(argc, argv);
    int is_real = (ctx.name_ok && ctx.env_ok);

    if (is_real)
    {
        if (run_real_flow())
        {
            return 0;
        }
    }
    else
    {
        if (run_fake_flow())
        {
            return 0;
        }
    }

    print_msg(msg_denied_enc2, sizeof(msg_denied_enc2), 0);
    return 1;
}
