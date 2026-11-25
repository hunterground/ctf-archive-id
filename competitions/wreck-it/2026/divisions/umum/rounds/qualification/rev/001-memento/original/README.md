# Memento

## Description

I leave pieces behind, notes, fragments hoping i remembers what I was trying to find.
Somewhere in this mess is the truth about what happened.
Assuming I haven’t already lied to myself again.
Don't Believe His Lies!

| Name    | Topic             | Difficulties | Level  | Author    |
| ------- | ----------------- | ------------ | ------ | --------- |
| Memento | Mini VM, Bytecode | Easy         | Junior | indah_LTF |

## Flag

### Real Flag

```txt
WRECKIT7{0h_1_4m_ch451n9_th15_6uy!_n0_h3_15_ch451n9_m3}
```

### Fake Flag

```txt
WRECKIT7{Trust_The_Note_Not_Memory_btw_f4k3_fl49}
```

---

# Challenge Provided

- memento.exe

# Objective

1. Jalankan binary normal → terlihat hanya quote.
2. Temukan bahwa string tersimpan terenkripsi.
3. Identifikasi VM kecil + bytecode fragment.
4. Emulasi VM (atau tracing runtime) untuk rekonstruksi flag.
5. Ambil flag asli dari hasil decode.

---

# Compile

```powershell
gcc.exe .\main.c -o amnesia.exe `
-O3 `
-s `
-static `
-fvisibility=hidden `
-fomit-frame-pointer `
-fno-stack-protector `
-fmerge-all-constants `
-frename-registers `
-fweb `
-fipa-pta `
-falign-functions=1 `
-falign-jumps=1 `
-falign-loops=1 `
"-Wl,--strip-all,--gc-sections"
```
