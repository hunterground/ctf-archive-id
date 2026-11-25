# Schizo

## Description

Who is Patient 67?
Between hallucinations, missing records, and memories that refuse to stay buried, the truth inside the island becomes harder to separate from delusion.

| Name       | Topic                              | Difficulties | Level          | Author    |
| ---------- | ---------------------------------- | ------------ | -------------- | --------- |
| Patient 67 | Environment-based, runtime context | Easy         | General/Junior | indah_LTF |

## Flag

### Real Flag

```txt
WRECKIT7{wh1ch_w0u1d_b3_w0r53_t0_l1v3_45_4_m0nst3r_0r_t0_d1e_4s_a_go0d_m4n}
```

### Fake Flag

```txt
WRECKIT7{1m_n0t_SCHIZO!!!!_btw_f4k3_fl49}
```

# Challenge Provided

- patient67

# Objective

1. Menjalankan binary normal
2. Mendapat fake flag
3. Curiga karena ada multiple flow
4. Analisis `collect_context()`
5. Menemukan env variable
6. Menemukan constraint nama executable
7. Memicu real flow
8. Reverse checker asli
9. Recover real flag

---

# Compile

```
gcc -O2 -s -fno-plt -fno-asynchronous-unwind-tables -fno-unwind-tables -fvisibility=hidden -fomit-frame-pointer -fno-stack-protector -flto -fmerge-all-constants -ffunction-sections -fdata-sections -finline-functions -o patient67 main.c
```
