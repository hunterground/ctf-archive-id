#include <stdint.h>
#include <string.h>

static const uint8_t TIGRIS_SBOX[256] = {
    0x85, 0xD6, 0xB2, 0x29, 0x51, 0xAC, 0x1D, 0x39, 0xD0, 0xE6, 0x95, 0xDA,
    0x74, 0x78, 0x89, 0x15, 0x48, 0x9A, 0x55, 0xF5, 0x96, 0xBF, 0xB1, 0x8C,
    0xE9, 0xA4, 0xA0, 0xDE, 0xDD, 0x66, 0xC3, 0xED, 0x75, 0xCF, 0x81, 0x79,
    0x7E, 0x2A, 0x8B, 0x99, 0x21, 0x35, 0x45, 0xC7, 0xCC, 0xC5, 0x65, 0x5E,
    0xC1, 0x1F, 0x1A, 0xF2, 0xA7, 0xFE, 0x6A, 0xD8, 0xD1, 0xFB, 0x3E, 0xF3,
    0x88, 0xBB, 0x43, 0xCB, 0x17, 0xAE, 0x36, 0x82, 0x62, 0xC0, 0x64, 0x6B,
    0x20, 0x98, 0x70, 0x0F, 0xE4, 0xBE, 0x1C, 0x6E, 0x83, 0xDC, 0xB9, 0x1E,
    0xAD, 0x68, 0x71, 0x16, 0x58, 0x92, 0x09, 0x9C, 0xD9, 0x2C, 0x7B, 0x3C,
    0xDF, 0xBC, 0xBD, 0xA3, 0x54, 0x24, 0xB3, 0x60, 0x5B, 0x1B, 0xDB, 0x46,
    0xB8, 0x9D, 0x22, 0xC9, 0xF0, 0x0E, 0xE1, 0x6F, 0x25, 0x72, 0x9E, 0x52,
    0x2D, 0xF7, 0x76, 0x91, 0x53, 0xF8, 0x19, 0x4C, 0xC2, 0xC8, 0x7A, 0x6C,
    0xE5, 0xF9, 0x40, 0x7F, 0x77, 0x0D, 0x2B, 0x30, 0x06, 0xF6, 0xFD, 0x12,
    0xA8, 0xB7, 0x93, 0x23, 0x05, 0x44, 0xBA, 0x9B, 0x04, 0x11, 0x13, 0xEF,
    0xA6, 0x5C, 0x5A, 0xEB, 0xA2, 0xD3, 0x27, 0xA1, 0x00, 0x3F, 0x69, 0x07,
    0x14, 0x4F, 0xC6, 0xAA, 0x97, 0x84, 0xFF, 0xF1, 0x0C, 0x3B, 0xEE, 0x2F,
    0xB5, 0x80, 0x42, 0xF4, 0x63, 0xB4, 0xAF, 0x26, 0x0A, 0x86, 0x7D, 0x7C,
    0x5D, 0xCE, 0xB6, 0x41, 0x94, 0x4B, 0x67, 0x57, 0xA5, 0x32, 0x87, 0xEC,
    0x4A, 0x31, 0xCD, 0x4D, 0xD5, 0x38, 0xE3, 0xE0, 0xC4, 0x10, 0x2E, 0x33,
    0x9F, 0x50, 0xB0, 0x37, 0x02, 0xE2, 0x8E, 0x5F, 0xE7, 0xCA, 0xA9, 0x8A,
    0xFC, 0xD7, 0xEA, 0x56, 0x3D, 0x59, 0x8F, 0x0B, 0x61, 0xD4, 0x08, 0x34,
    0xE8, 0xD2, 0x8D, 0x4E, 0x03, 0x3A, 0x28, 0x49, 0x47, 0xAB, 0x18, 0x6D,
    0x01, 0xFA, 0x90, 0x73};

static inline uint8_t xtime(uint8_t x) {
  return (x & 0x80) ? (uint8_t)((x << 1) ^ 0x1B) : (uint8_t)(x << 1);
}

static uint8_t gf_mul(uint8_t a, uint8_t b) {
  uint8_t res = 0;
  while (b) {
    if (b & 1)
      res ^= a;
    a = xtime(a);
    b >>= 1;
  }
  return res;
}

typedef uint8_t state_t[4][4];

static void SubBytes(state_t s) {
  for (int r = 0; r < 4; r++)
    for (int c = 0; c < 4; c++)
      s[r][c] = TIGRIS_SBOX[s[r][c]];
}

static void ReversibleShiftRows(state_t s) {
  // left rotate each row by shift amounts: {0,2,2,2}
  uint8_t tmp[4];
  for (int r = 1; r < 4; r++) {
    int shift = 2 % 4;
    for (int c = 0; c < 4; c++)
      tmp[c] = s[r][(c + shift) % 4];
    for (int c = 0; c < 4; c++)
      s[r][c] = tmp[c];
  }
}

static void ShiftingMixColumn(state_t s, int round) {
  // coefficients for forward a(x)
  uint8_t base[4] = {0x03, 0x04, 0x01, 0x07};
  uint8_t coef[4];
  int rot = round & 3; // rotate order per round group of 4
  for (int i = 0; i < 4; i++)
    coef[i] = base[(i + rot) % 4];

  for (int c = 0; c < 4; c++) {
    uint8_t a0 = s[0][c], a1 = s[1][c], a2 = s[2][c], a3 = s[3][c];
    uint8_t res0 = gf_mul(coef[0], a0) ^ gf_mul(coef[1], a1) ^
                   gf_mul(coef[2], a2) ^ gf_mul(coef[3], a3);
    uint8_t res1 = gf_mul(coef[3], a0) ^ gf_mul(coef[0], a1) ^
                   gf_mul(coef[1], a2) ^ gf_mul(coef[2], a3);
    uint8_t res2 = gf_mul(coef[2], a0) ^ gf_mul(coef[3], a1) ^
                   gf_mul(coef[0], a2) ^ gf_mul(coef[1], a3);
    uint8_t res3 = gf_mul(coef[1], a0) ^ gf_mul(coef[2], a1) ^
                   gf_mul(coef[3], a2) ^ gf_mul(coef[0], a3);
    s[0][c] = res0;
    s[1][c] = res1;
    s[2][c] = res2;
    s[3][c] = res3;
  }
}

static void AddRoundKey(state_t s, const uint8_t *roundKey) {
  for (int c = 0; c < 4; c++) {
    for (int r = 0; r < 4; r++) {
      s[r][c] ^= roundKey[c * 4 + r];
    }
  }
}

#define ROUNDS 16
#define ROUND_KEY_BYTES ((ROUNDS + 1) * 16)

static void KeyExpansion128(const uint8_t key[16],
                            uint8_t roundKeys[ROUND_KEY_BYTES]) {
  const uint32_t Pw = 0xB7E15163u;
  const uint32_t Qw = 0x9E377969u;
  memcpy(roundKeys, key, 16);
  uint8_t temp[4];
  uint32_t bytesGenerated = 16;
  uint32_t rcon = 1;
  int i = 1;
  while (bytesGenerated < ROUND_KEY_BYTES) {
    memcpy(temp, &roundKeys[bytesGenerated - 4], 4);
    if ((bytesGenerated % 16) == 0) {
      uint8_t t = temp[0];
      temp[0] = temp[1];
      temp[1] = temp[2];
      temp[2] = temp[3];
      temp[3] = t;
      for (int j = 0; j < 4; j++)
        temp[j] = TIGRIS_SBOX[temp[j]];
      uint32_t word = ((uint32_t)temp[0] << 24) | ((uint32_t)temp[1] << 16) |
                      ((uint32_t)temp[2] << 8) | (uint32_t)temp[3];
      uint32_t mix = (i & 1) ? Pw : Qw;
      word ^= (mix ^ (rcon << 24));
      temp[0] = (word >> 24) & 0xFF;
      temp[1] = (word >> 16) & 0xFF;
      temp[2] = (word >> 8) & 0xFF;
      temp[3] = (word) & 0xFF;
      rcon <<= 1;
      i++;
    }
    for (int j = 0; j < 4; j++) {
      roundKeys[bytesGenerated] = roundKeys[bytesGenerated - 16] ^ temp[j];
      bytesGenerated++;
    }
  }
}

static void load_state(state_t s, const uint8_t in[16]) {
  for (int c = 0; c < 4; c++)
    for (int r = 0; r < 4; r++)
      s[r][c] = in[c * 4 + r];
}

static void store_state(uint8_t out[16], const state_t s) {
  for (int c = 0; c < 4; c++)
    for (int r = 0; r < 4; r++)
      out[c * 4 + r] = s[r][c];
}

static void Tigris_EncryptBlock(const uint8_t in[16], uint8_t out[16],
                                const uint8_t roundKeys[ROUND_KEY_BYTES]) {
  state_t s;
  load_state(s, in);
  AddRoundKey(s, roundKeys);

  for (int round = 1; round <= ROUNDS; ++round) {
    SubBytes(s);
    ReversibleShiftRows(s);
    if (round % 1 == 0) {
      if (round != ROUNDS)
        ShiftingMixColumn(s, round - 1);
    }
    AddRoundKey(s, roundKeys + round * 16);
  }
  store_state(out, s);
}

static void Tigris_Encrypt(const uint8_t *in, uint8_t *out, size_t in_len,
                           const uint8_t roundKeys[ROUND_KEY_BYTES]) {
  size_t blocks = in_len / 16;
  for (size_t i = 0; i < blocks; i++) {
    Tigris_EncryptBlock(in + (i * 16), out + (i * 16), roundKeys);
  }
}

static void Tigris_Encrypt_ECB(const uint8_t key[16], const uint8_t *plaintext,
                               uint8_t *ciphertext, size_t length) {
  uint8_t roundKeys[ROUND_KEY_BYTES];

  // Expand key once
  KeyExpansion128(key, roundKeys);

  // Encrypt blocks
  Tigris_Encrypt(plaintext, ciphertext, length, roundKeys);
}
