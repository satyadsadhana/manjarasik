# 🔲 Kotak Rahasia

**Kirim dan pecahkan pesan rahasia dengan Polybius Square, lalu adu cepat di game _Tebak Pesan_.**

Website satu halaman untuk tugas *Exercise* TM12 Cryptography, mata kuliah Manajemen Jaringan, FTMM Universitas Airlangga. Algoritma yang dipakai, **Polybius Square dengan kata kunci**, tidak dibahas di materi kuliah.

> HTML, CSS, dan JavaScript murni: tanpa framework, tanpa build, tanpa install. Bisa dibuka dengan double-click.

---

## Fitur

| Bagian | Isi |
|---|---|
| **Cara Kerja** | Penjelasan 3 langkah dengan contoh kata kunci `UNAIR`, plus sejarah singkat Polybius. |
| **Lab** | Mode *Kirim Pesan* (enkripsi) dan *Pecahkan Pesan* (dekripsi). Hasil langsung muncul saat mengetik, dan sel kotak 5×5 yang dipakai ikut menyala. Ada tombol salin dan tukar. |
| **Game Tebak Pesan** | Dimainkan bergantian di satu laptop. Ada 3 level, timer, petunjuk berbayar poin, dan konfeti kalau berhasil. |
| **Panel Host** | Tempat menambah soal sendiri (pesan, kata kunci, level). |
| **Papan Skor** | Podium 3 besar dan peringkat sampai 10. Skor pemain dengan nama yang sama digabung. |

## Cara kerja Polybius Square

1. **Susun kotak 5×5.** Huruf kata kunci ditulis lebih dulu (tanpa huruf ganda), lalu sisa alfabet. Karena cuma ada 25 sel, **J digabung ke I**.
2. **Ganti tiap huruf dengan nomor baris dan kolomnya.**
3. **Gabungkan.** Huruf dipisah spasi, kata dipisah ` / `.

Contoh dengan kata kunci `UNAIR`:

```
     1 2 3 4 5
  1  U N A I R
  2  B C D E F
  3  G H K L M        HALO  →  32 13 34 41
  4  O P Q S T
  5  V W X Y Z
```

Angka dan `/` di pesan asli dibungkus kurung siku supaya tidak tertukar dengan koordinat. Contohnya `TM12` dienkripsi jadi `44 32 [12]` dengan kotak standar.

## Aturan game

| Level | Skor dasar | Kotak |
|---|---|---|
| Mudah | 500 | Kotak standar, terbuka penuh |
| Sedang | 1000 | Pakai kata kunci, panjang kunci ditampilkan |
| Sulit | 1500 | Pakai kata kunci, tanpa info |

**Potongan skor:**
- −5 poin per detik
- −50 poin per tebakan salah
- Petunjuk: buka 1 huruf kunci −100, buka 1 baris kotak −150, huruf pertama tiap kata −200

Skor minimum 50 kalau berhasil, dan 0 kalau menyerah. Saat mengecek tebakan, huruf besar/kecil, spasi berlebih, dan J/I tidak dibedakan.

## Menjalankan

**Cara paling gampang:** download atau clone repo ini, lalu double-click `index.html`.

**Lewat server lokal** (opsional):

```bash
python -m http.server 5500
```

Setelah itu buka http://localhost:5500.

Font diambil dari Google Fonts. Kalau offline, halaman tetap jalan dengan font sistem.

## Deploy ke Vercel

Repo ini static site, jadi bisa langsung di-deploy:

1. Di Vercel, pilih **Add New → Project**, lalu impor repo ini.
2. Pilih Framework Preset **Other**, dan biarkan build command kosong.
3. Klik **Deploy**.

> ⚠️ Papan skor dan soal buatan disimpan di `localStorage` browser, jadi **tiap perangkat dan tiap alamat punya datanya sendiri**. Untuk presentasi, siapkan soal dan mainkan semuanya di laptop dan alamat yang sama.

## Struktur

```
index.html          halaman
style.css           seluruh tampilan (palet krem, navy, teal, mustard, oranye bata)
js/polybius.js      algoritma: buildGrid, encrypt, decrypt, trace
js/game-core.js     bank soal, rumus skor, agregasi papan skor
js/storage.js       akses localStorage yang aman
js/grid-view.js     render kotak 5×5
js/hero.js          animasi hero dan contoh Cara Kerja
js/lab.js           Lab enkripsi/dekripsi
js/game.js          game Tebak Pesan dan Panel Host
js/leaderboard.js   papan skor
js/main.js          titik masuk
tests/              unit test
```

## Test

Butuh Node.js 18 atau lebih baru:

```bash
node --test
```

## Kelompok

Kelompok ? · Anggota: _(menyusul)_
