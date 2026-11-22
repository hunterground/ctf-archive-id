#include "ministd.h"
#include "trusted_lib_api.h"
#include <stdint.h>

ENTRY_POINT_ATTR void start();

#define BUF_SIZE 64

uint64_t test_create_plain()
{
    uint8_t buf[BUF_SIZE] = "AAAAAAAAAAAAAAAA";
    uint32_t len = sizeof(buf);

    uint64_t res = TRUSTED_CALL(create_file_plain, buf, len);
    TRUSTED_CALL_VOID(mini_printf, "create_file_plain(...) -> %llx\n", res);
    return res;
}

void test_read_plain(uint64_t h_plain)
{
    uint8_t buf[BUF_SIZE] = { 0 };
    uint32_t len = BUF_SIZE;
    int32_t res = TRUSTED_CALL(read_file_plain, h_plain, buf, &len);
    TRUSTED_CALL_VOID(mini_printf, "read_file_plain(...) -> %d\n", res);
    TRUSTED_CALL_VOID(mini_printf, "File contents is: %s, returned size is %d bytes\n", buf, len);
}

uint64_t test_create_encrypted(uint8_t* target_tag)
{
    uint8_t buf[BUF_SIZE] = "BBBBBBBBBBBBBBBB";
    uint32_t len = sizeof(buf);
    uint8_t iv[12] = { 0 };
    memset(iv, 0xFF, sizeof(iv));
    uint8_t hex_tag[64] = { 0 };

    uint64_t res = TRUSTED_CALL(create_file_enc, buf, len, (uint32_t*)iv, (uint32_t*)target_tag);
    TRUSTED_CALL_VOID(mini_printf, "create_file_enc(...) -> %llx. ", res);
    hex_encode(target_tag, 16, (char*)hex_tag, 0);
    TRUSTED_CALL_VOID(mini_printf, "Tag is: %s\n", hex_tag);
    return res;
}

void test_read_encrypted(uint64_t h_enc, uint8_t* tag)
{
    uint8_t buf[BUF_SIZE] = { 0 };
    uint32_t len = BUF_SIZE;

    int32_t res = TRUSTED_CALL(read_file_enc, h_enc, (uint32_t*)tag, buf, &len);
    TRUSTED_CALL_VOID(mini_printf, "read_file_enc(...) -> %d\n", res);
    TRUSTED_CALL_VOID(mini_printf, "File contents is: %s, returned size is %d bytes\n", buf, len);
}

ENTRY_POINT_ATTR void start()
{
    uint64_t h_plain = test_create_plain();
    test_read_plain(h_plain);

    uint8_t tag[16] = { 0 };
    uint64_t h_enc = test_create_encrypted(tag);
    test_read_encrypted(h_enc, tag);

    ENTRY_POINT_END();
}