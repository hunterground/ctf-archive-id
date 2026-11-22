#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>
#include <unistd.h>

#define MAX_SIZE 4194304  // 2^22
#define MOD 2013265921    // 15*2^27 + 1
#define ROOT 440564289    // primitive root mod MOD

unsigned long long a[MAX_SIZE];
unsigned long long b[MAX_SIZE];
unsigned long long c[MAX_SIZE];
unsigned int digits_a[3500000];
unsigned int digits_b[3500000];
unsigned int result[7000000];
char input_buffer[3500001];

#define IS_EQ(a, b) (!(a ^ b))

unsigned long long bit_sub(unsigned long long x, unsigned long long y) {
bit_sub_loop:
    if (IS_EQ(y, 0)) goto bit_sub_done;
    unsigned long long borrow = (~x) & y;
    x = x ^ y;
    y = borrow << 1;
    goto bit_sub_loop;
bit_sub_done:
    return x;
}
#define LT(a, b) ((bit_sub(a, b) >> 63) & 1)
#define GT(a, b) LT(b, a)
#define LE(a, b) (IS_EQ(a, b) | LT(a, b))
#define GE(a, b) (IS_EQ(a, b) | GT(a, b))

unsigned long long bit_add(unsigned long long x, unsigned long long y) {
bit_add_loop:
    if (IS_EQ(y, 0)) goto bit_add_done;
    unsigned long long carry = x & y;
    x = x ^ y;
    y = carry << 1;
    goto bit_add_loop;
bit_add_done:
    return x;
}

unsigned long long mul_10(unsigned long long n) {
    unsigned long long t1 = n << 3;
    unsigned long long t2 = n << 1;
    return bit_add(t1, t2);
}

unsigned long long div10(unsigned long long n) {
    if (LT(n, 10)) return 0;
    unsigned long long q = 0, r = 0;
    int i = 63;
div_loop:
    if (LT(i, 0)) goto div_done;
    unsigned long long bit = (n >> i) & 1;
    r = (r << 1) | bit;
    if (GE(r, 10)) {
        r = bit_sub(r, 10);
        q = (q << 1) | 1;
        goto div_next;
    }
    q = q << 1;
div_next:
    i = bit_sub(i, 1);
    goto div_loop;
div_done:
    return q;
}

unsigned long long add_mod(unsigned long long x, unsigned long long y, unsigned long long mod) {
    unsigned long long sum = bit_add(x, y);
    if (GE(sum, mod)) return bit_sub(sum, mod);
    return sum;
}
unsigned long long sub_mod(unsigned long long x, unsigned long long y, unsigned long long mod) {
    unsigned long long temp = bit_sub(mod, y);
    unsigned long long res = bit_add(x, temp);
    if (GE(res, mod)) return bit_sub(res, mod);
    return res;
}
unsigned long long mul_mod(unsigned long long x, unsigned long long y, unsigned long long mod) {
    unsigned long long res = 0;
mul_mod_loop:
    if (IS_EQ(y, 0)) goto mul_mod_done;
    if (y & 1) res = add_mod(res, x, mod);
    x = add_mod(x, x, mod);
    y = y >> 1;
    goto mul_mod_loop;
mul_mod_done:
    return res;
}

unsigned long long mod_reduce(unsigned long long dividend, unsigned long long divisor) {
    if (LT(dividend, divisor)) return dividend;
    int shift = 0;
    unsigned long long temp = divisor;
loop_start:
    if (LE(temp, dividend)) {
        temp = temp << 1;
        shift = bit_add(shift, 1);
        goto loop_start;
    }
    shift = bit_sub(shift, 1);
    temp = temp >> 1;
mod_loop:
    if (IS_EQ(shift, 0) & IS_EQ(temp, divisor)) {
        if (GE(dividend, divisor)) dividend = bit_sub(dividend, divisor);
        goto mod_done;
    }
    if (GE(dividend, temp)) dividend = bit_sub(dividend, temp);
    temp = temp >> 1;
    if (GT(shift, 0)) shift = bit_sub(shift, 1);
    goto mod_loop;
mod_done:
    return dividend;
}

unsigned long long power_mod(unsigned long long base, unsigned long long exp, unsigned long long mod) {
    unsigned long long resultv = 1;
    base = mod_reduce(base, mod);
power_loop:
    if (IS_EQ(exp, 0)) goto power_done;
    if (exp & 1) resultv = mul_mod(resultv, base, mod);
    base = mul_mod(base, base, mod);
    exp = exp >> 1;
    goto power_loop;
power_done:
    return resultv;
}

unsigned int bit_reverse(unsigned int num, unsigned int bits) {
    unsigned int resultv = 0, i = 0;
bit_rev_loop:
    if (GE(i, bits)) goto bit_rev_done;
    if (num & (1u << i)) resultv |= (1u << (bit_sub(bit_sub(bits, 1), i)));
    i = bit_add(i, 1);
    goto bit_rev_loop;
bit_rev_done:
    return resultv;
}

void ntt(unsigned long long arr[], unsigned int n, unsigned int inverse) {
    unsigned int bits = 0, temp_n = n;
count_bits:
    if (LE(temp_n, 1)) goto bits_done;
    bits = bit_add(bits, 1);
    temp_n = temp_n >> 1;
    goto count_bits;
bits_done:;

    unsigned int i = 0;
bit_rev_perm:
    if (GE(i, n)) goto bit_rev_perm_done;
    unsigned int j = bit_reverse(i, bits);
    if (LT(i, j)) {
        unsigned long long tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    i = bit_add(i, 1);
    goto bit_rev_perm;
bit_rev_perm_done:;

    unsigned int len = 2;
ntt_outer:
    if (GT(len, n)) goto ntt_done;
    unsigned int k = 0, temp = len;
count_k:
    if (IS_EQ(temp, 1)) goto count_k_done;
    k = bit_add(k, 1);
    temp = temp >> 1;
    goto count_k;
count_k_done:;

    unsigned long long divisor = bit_sub(MOD, 1) >> k;
    unsigned long long wlen;
    if (inverse) {
        unsigned long long exponent = bit_sub(bit_sub(MOD, 1), divisor);
        wlen = power_mod(ROOT, exponent, MOD);
    } else {
        wlen = power_mod(ROOT, divisor, MOD);
    }

    i = 0;
ntt_groups:
    if (GE(i, n)) goto ntt_groups_done;
    unsigned long long w = 1;
    j = 0;
ntt_inner:
    if (GE(j, (len >> 1))) goto ntt_inner_done;
    {
        unsigned long long u = arr[bit_add(i, j)];
        unsigned long long v = mul_mod(arr[bit_add(bit_add(i, j), (len >> 1))], w, MOD);
        arr[bit_add(i, j)] = add_mod(u, v, MOD);
        arr[bit_add(bit_add(i, j), (len >> 1))] = sub_mod(u, v, MOD);
        w = mul_mod(w, wlen, MOD);
    }
    j = bit_add(j, 1);
    goto ntt_inner;
ntt_inner_done:
    i = bit_add(i, len);
    goto ntt_groups;
ntt_groups_done:
    len = len << 1;
    goto ntt_outer;
ntt_done:

    if (inverse) {
        unsigned long long n_inv = power_mod(n, bit_sub(MOD, 2), MOD);
        i = 0;
normalize:
        if (GE(i, n)) goto normalize_done;
        arr[i] = mul_mod(arr[i], n_inv, MOD);
        i = bit_add(i, 1);
        goto normalize;
normalize_done:;
    }
}

unsigned int flag_to_digits(char* str, unsigned int digits[]) {
    unsigned int len = 0;
find_flag_len_loop:
    if (IS_EQ(str[len], '\0') || IS_EQ(str[len], '\n')) goto flag_len_found;
    len = bit_add(len, 1);
    goto find_flag_len_loop;
flag_len_found:

    if (!IS_EQ(len, 72)) return 0;

    unsigned int i = 0, j = 0;
convert_flag_loop:
    if (GE(i, len)) goto convert_flag_done;

    unsigned int char_idx = bit_sub(bit_sub(len, 1), i);
    unsigned long long ascii_val = str[char_idx];

    unsigned int d0 = mod_reduce(ascii_val, 10);
    ascii_val = div10(ascii_val);
    unsigned int d1 = mod_reduce(ascii_val, 10);
    ascii_val = div10(ascii_val);
    unsigned int d2 = mod_reduce(ascii_val, 10);

    digits[j] = d0; j = bit_add(j, 1);
    digits[j] = d1; j = bit_add(j, 1);
    digits[j] = d2; j = bit_add(j, 1);

    i = bit_add(i, 1);
    goto convert_flag_loop;

convert_flag_done:
    digits[j] = 2; j = bit_add(j, 1);
    digits[j] = 3; j = bit_add(j, 1);
    digits[j] = 0; j = bit_add(j, 1);

    return j;
}

void perform_computation(unsigned int a_digits[], unsigned int a_len,
                         unsigned int b_digits[], unsigned int b_len) {
    unsigned int n = 1;
    unsigned int total_len = bit_add(a_len, b_len);

find_n:
    if (GE(n, total_len)) goto n_found;
    n = n << 1;
    goto find_n;
n_found:;

    unsigned int i = 0;
init_a:
    if (GE(i, n)) goto init_a_done;
    a[i] = LT(i, a_len) ? a_digits[i] : 0;
    i = bit_add(i, 1);
    goto init_a;
init_a_done:;

    i = 0;
init_b:
    if (GE(i, n)) goto init_b_done;
    b[i] = LT(i, b_len) ? b_digits[i] : 0;
    i = bit_add(i, 1);
    goto init_b;
init_b_done:;

    ntt(a, n, 0);
    ntt(b, n, 0);

    i = 0;
multiply:
    if (GE(i, n)) goto multiply_done;
    c[i] = mul_mod(a[i], b[i], MOD);
    i = bit_add(i, 1);
    goto multiply;
multiply_done:;

    ntt(c, n, 1);

    i = 0;
copy_loop:
    if (GE(i, 227)) goto copy_done;
    result[i] = c[i];
    i = bit_add(i, 1);
    goto copy_loop;
copy_done:;
}


typedef struct { uint64_t len; uint32_t st[8]; uint8_t buf[64]; } sha256_ctx;
static inline uint32_t RR(uint32_t x,int n){return (x>>n)|(x<<(32-n));}
static const uint32_t K256[64]={
0x428a2f98u,0x71374491u,0xb5c0fbcfu,0xe9b5dba5u,0x3956c25bu,0x59f111f1u,0x923f82a4u,0xab1c5ed5u,
0xd807aa98u,0x12835b01u,0x243185beu,0x550c7dc3u,0x72be5d74u,0x80deb1feu,0x9bdc06a7u,0xc19bf174u,
0xe49b69c1u,0xefbe4786u,0x0fc19dc6u,0x240ca1ccu,0x2de92c6fu,0x4a7484aau,0x5cb0a9dcu,0x76f988dau,
0x983e5152u,0xa831c66du,0xb00327c8u,0xbf597fc7u,0xc6e00bf3u,0xd5a79147u,0x06ca6351u,0x14292967u,
0x27b70a85u,0x2e1b2138u,0x4d2c6dfcu,0x53380d13u,0x650a7354u,0x766a0abbu,0x81c2c92eu,0x92722c85u,
0xa2bfe8a1u,0xa81a664bu,0xc24b8b70u,0xc76c51a3u,0xd192e819u,0xd6990624u,0xf40e3585u,0x106aa070u,
0x19a4c116u,0x1e376c08u,0x2748774cu,0x34b0bcb5u,0x391c0cb3u,0x4ed8aa4au,0x5b9cca4fu,0x682e6ff3u,
0x748f82eeu,0x78a5636fu,0x84c87814u,0x8cc70208u,0x90befffau,0xa4506cebu,0xbef9a3f7u,0xc67178f2u};
static void shainit(sha256_ctx*s){s->len=0; uint32_t iv[8]={0x6a09e667u,0xbb67ae85u,0x3c6ef372u,0xa54ff53au,0x510e527fu,0x9b05688cu,0x1f83d9abu,0x5be0cd19u}; memcpy(s->st,iv,32);}
static void shatrans(sha256_ctx*s,const uint8_t*b){
    uint32_t W[64]; for(int t=0;t<16;t++) W[t]=(b[t*4]<<24)|(b[t*4+1]<<16)|(b[t*4+2]<<8)|(b[t*4+3]);
    for(int t=16;t<64;t++){uint32_t s0=RR(W[t-15],7)^RR(W[t-15],18)^(W[t-15]>>3); uint32_t s1=RR(W[t-2],17)^RR(W[t-2],19)^(W[t-2]>>10); W[t]=W[t-16]+s0+W[t-7]+s1;}
    uint32_t a=s->st[0],b0=s->st[1],c=s->st[2],d=s->st[3],e=s->st[4],f=s->st[5],g=s->st[6],h=s->st[7];
    for(int t=0;t<64;t++){uint32_t S1=RR(e,6)^RR(e,11)^RR(e,25); uint32_t ch=(e&f)^((~e)&g);
        uint32_t T1=h+S1+ch+K256[t]+W[t]; uint32_t S0=RR(a,2)^RR(a,13)^RR(a,22); uint32_t maj=(a&b0)^(a&c)^(b0&c);
        uint32_t T2=S0+maj; h=g; g=f; f=e; e=d+T1; d=c; c=b0; b0=a; a=T1+T2;}
    s->st[0]+=a; s->st[1]+=b0; s->st[2]+=c; s->st[3]+=d; s->st[4]+=e; s->st[5]+=f; s->st[6]+=g; s->st[7]+=h;
}
static void shaup(sha256_ctx*s,const uint8_t*d,size_t n){
    size_t i=0, idx=(size_t)(s->len & 63); s->len+=n;
    if(idx){size_t fill=64-idx; if(n>=fill){memcpy(s->buf+idx,d,fill); shatrans(s,s->buf); i+=fill; idx=0;} else {memcpy(s->buf+idx,d,n); return;}}
    for(; i+64<=n; i+=64) shatrans(s,d+i);
    if(i<n) memcpy(s->buf,d+i,n-i);
}
static void shafin(sha256_ctx*s,uint8_t out[32]){
    uint64_t bits=s->len*8; size_t idx=(size_t)(s->len & 63); s->buf[idx++]=0x80;
    if(idx>56){while(idx<64) s->buf[idx++]=0; shatrans(s,s->buf); idx=0;}
    while(idx<56) s->buf[idx++]=0;
    for(int i=7;i>=0;i--) s->buf[idx++]=(uint8_t)(bits>>(i*8));
    shatrans(s,s->buf);
    for(int i=0;i<8;i++){out[i*4]=(uint8_t)(s->st[i]>>24); out[i*4+1]=(uint8_t)(s->st[i]>>16);
        out[i*4+2]=(uint8_t)(s->st[i]>>8); out[i*4+3]=(uint8_t)(s->st[i]);}
}

static void ks_idx(const uint8_t*key,size_t keylen,uint64_t idx,uint8_t out32[32]){
    sha256_ctx s; shainit(&s); shaup(&s,key,keylen);
    uint8_t le[8]; for(int k=0;k<8;k++) le[k]=(uint8_t)((idx>>(8*k))&0xFF);
    shaup(&s,le,8); shafin(&s,out32);
}

static const uint8_t k_part1[] = { 0x39,0xD4,0xA1,0x0C,0x5E,0x72,0x18,0xB7 };
static const uint8_t k_part2[] = { 0xC2,0x4F,0x93,0xE8,0x6A,0x51,0x07,0xAD };
static void build_key(uint8_t key[16]){
    for(int i=0;i<8;i++){ key[i]=k_part1[i]^0xA5; key[8+i]=k_part2[i]^0x5A; }
}

static const uint8_t ciphertext_table[227] = {
    0x7D,0x0E,0x7F,0x95,0xBE,0xBC,0x77,0x76,0x24,0x83,0x86,0x5B,0x09,0x05,0x6C,0xA5,
    0x25,0x33,0x0D,0xF6,0xD1,0xC2,0x94,0xC4,0xD7,0x99,0x6E,0x59,0xBF,0xA9,0xB4,0x8C,
    0x47,0xFC,0xFE,0x5D,0xC3,0x4E,0x80,0x0F,0x6B,0xBE,0xAB,0xF4,0x50,0x28,0x30,0xF7,
    0x42,0x5C,0x74,0x1B,0xB0,0xCB,0xC8,0xEB,0x75,0x2B,0xB2,0x5A,0x21,0xC3,0x10,0xF7,
    0x2A,0x86,0xEE,0x2D,0x88,0x79,0x3B,0x05,0xC2,0x2B,0x78,0xAF,0xB0,0xDC,0x35,0x45,
    0x01,0x33,0xF7,0x24,0x48,0x76,0x56,0xB3,0x73,0xDC,0xBB,0x9B,0x64,0x35,0x22,0xD0,
    0xBB,0x01,0xA8,0x6D,0x18,0x58,0x30,0xC2,0x6F,0x2E,0x90,0x7A,0xEF,0x14,0x92,0x2C,
    0x7D,0x73,0x7A,0x0B,0x2F,0x17,0x23,0x59,0x3F,0x52,0x81,0x81,0x20,0xB2,0xCA,0xD2,
    0xEA,0xB4,0x56,0xCF,0x6C,0x48,0x8B,0x99,0x7B,0x51,0x49,0xD9,0x82,0x19,0xD6,0xB5,
    0xAB,0x08,0x7F,0x4B,0x3A,0xC8,0xA3,0x72,0xF0,0xC5,0x82,0x0C,0xDD,0x5D,0x93,0xE0,
    0xE2,0xBE,0x93,0x41,0x77,0x20,0x01,0x03,0x3B,0x96,0x6A,0xD6,0xE3,0x3A,0x1A,0x88,
    0xD8,0xB7,0x29,0xAE,0xE6,0xB2,0x4B,0xA6,0xD3,0x8B,0x5A,0x8C,0x11,0x2E,0x23,0xFF,
    0x6A,0x28,0x55,0x89,0xB3,0x80,0xC2,0x0A,0x8E,0xF6,0xF1,0x98,0x6E,0xD6,0x1F,0xFD,
    0x2B,0x74,0x97,0x61,0xAE,0xEA,0x78,0xC5,0x55,0xB1,0xCF,0x62,0x50,0xF9,0x6D,0xB1,
    0xBC,0x77,0x00,
};


typedef struct { uint64_t token; unsigned next_idx; } table_gate_t;
static table_gate_t G = {0, 0};

static uint64_t token_update(uint64_t tok, unsigned idx) {
    sha256_ctx s; shainit(&s);
    shaup(&s,(uint8_t*)&tok,8);
    pid_t p = getpid(); time_t t = time(NULL);
    shaup(&s,(uint8_t*)&p,sizeof(p));
    shaup(&s,(uint8_t*)&t,sizeof(t));
    shaup(&s,(uint8_t*)&idx,sizeof(idx));
    uint8_t out[32]; shafin(&s,out);
    uint64_t r=0; for(int i=0;i<8;i++) r |= ((uint64_t)out[i])<<(8*i);
    volatile uint8_t *pv=out; for(int i=0;i<32;i++) pv[i]=0;
    return r ? r : 0xA5A5A5A5A5A5A5A5ULL;
}

static void table_init(void) {
    if (G.token != 0) return;
    uint64_t seed = 0x1234FEDCBA9876ULL ^ (uintptr_t)&seed ^ (uint64_t)getpid();
    G.token = token_update(seed, 0);
    G.next_idx = 0;
}

static int table_next(uint64_t token_in, uint8_t *out_byte, uint64_t *token_out) {
    if (token_in != G.token) return 0;
    unsigned i = G.next_idx;
    if (i >= 227) return 0;

    uint8_t key[16]; build_key(key);
    uint8_t ks[32];  ks_idx(key, sizeof(key), (uint64_t)i, ks);
    uint8_t val = (uint8_t)(ciphertext_table[i] ^ ks[0]);

    G.next_idx = i + 1;
    G.token = token_update(G.token, i);

    *out_byte = val;
    *token_out = G.token;

    volatile uint8_t *p = ks;  for (int z=0; z<32; z++) p[z]=0;
    volatile uint8_t *q = key; for (int z=0; z<16; z++) q[z]=0;

    return 1;
}

unsigned int verify_result(unsigned int res[], unsigned int len) {
    if (!IS_EQ(len, 227)) return 0;
    unsigned int salt = 125u;

    table_init();
    uint64_t tok = G.token;

    for (unsigned i = 0; i < 227; ++i) {
        uint8_t orig;
        uint64_t new_tok;
        if (!table_next(tok, &orig, &new_tok)) return 0;
        unsigned int expected = orig ^ ((bit_add(i, salt)) & 0xFFu);
        if (!IS_EQ(res[i], expected)) return 0;
        tok = new_tok;
    }
    return 1;
}

int main() {
    printf("flag? ");
    if (fgets(input_buffer, sizeof(input_buffer), stdin) == NULL) {
        puts("no");
        return 1;
    }

    unsigned int len_a = flag_to_digits(input_buffer, digits_a);
    if (IS_EQ(len_a, 0)) {
        puts("no");
        return 1;
    }

    unsigned int len_b = 9;
    for (unsigned i = 0; i < len_b; ++i) digits_b[i] = bit_sub(len_b, i);

    perform_computation(digits_a, len_a, digits_b, len_b);

    if (verify_result(result, 227)) {
        puts("yes its correct");
    } else {
        puts("no");
    }
    return 0;
}