# OCD

## Description

An OCD gamer tried to make a “simple calculator game.”
Unfortunately, his anxiety shipped with the source code.
Now the program keeps rechecking and valideating everything

| Name | Topic            | Difficulties | Level          | Author    |
| ---- | ---------------- | ------------ | -------------- | --------- |
| OCD  | Auth-base, Game, | Medium       | General/Junior | indah_LTF |

---

## Objective

- Reverse aplikasi desktop
- Temukan mekanisme validasi license
- Dapatkan akses premium
- Pertahankan premium session
- Selesaikan challenge internal
- Recover hidden flag

---

## Challenge Provided

- OCD.exe

## Flag

```
WRECKIT7{91v3_m3_my_m3d5_th15_0cd_4ff3ct_th3_g4m3_1_m4de}
```

---

## Server (Docker)

Build image dan jalankan container:

```powershell
cd server
docker build -t ocd-auth-server .
docker run --rm -p 21341:21341 ocd-auth-server
```

Server akan berjalan di:

```
http://localhost:21341
```

Jika server dijalankan di VPS, ganti `localhost` dengan IP/domain VPS,
lalu sesuaikan URL di aplikasi.
