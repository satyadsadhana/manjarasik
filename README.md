# Kota Aksara

Buku cerita interaktif tentang penjelajah muda yang mencari Lentera Aksara untuk menyelamatkan kota dari Kabut Sunyi. Revisi dari proyek Kotak Rahasia.

## Menjalankan

Ekstrak ZIP, buka folder `kota-aksara`, lalu klik dua kali `index.html`. Semua gambar dan kode tersedia lokal; tidak perlu instalasi, akun, koneksi internet, atau API.

Untuk localhost, buka terminal di folder yang memuat `index.html` lalu jalankan:

```powershell
python -m http.server 5504
```

Buka http://localhost:5504 dan biarkan terminal tetap terbuka. Jika Python tidak tersedia, gunakan `index.html` langsung.

## Alur

1. Tentukan nama penjelajah; tokoh default bernama Nara.
2. Baca empat halaman prolog untuk mengenal tokoh, Elara, ancaman kota, dan tugas mencari lentera.
3. Pilih lokasi dari peta. Setiap lokasi memiliki adegan cerita, sandi, catatan cara membaca, tiga tingkat petunjuk, dan adegan penemuan kunci.
4. Kumpulkan keempat kunci dalam urutan bebas. Ruang Fajar terkunci sampai empat kunci ditemukan.
5. Masuk ke Ruang Fajar, temukan Lentera Aksara, nyalakan, dan baca epilog.

Progres, nama, halaman prolog, dan kunci disimpan melalui localStorage. Penyimpanan terpisah untuk setiap alamat/port/browser. Jika penyimpanan tidak tersedia, aplikasi menampilkan pemberitahuan dan tetap dapat dimainkan selama sesi berlangsung. Reset memiliki dialog konfirmasi. Nama penjelajah bukan akun/login.

## Sandi dan jawaban (untuk pengajar)

| Lokasi | Sandi | Parameter | Pesan | Jawaban |
|---|---|---|---|---|
| Menara Angin | Caesar | Geser +3 saat enkripsi | WLPXU | TIMUR |
| Observatorium | Atbash | A↔Z, B↔Y | YRMGZMT | BINTANG |
| Taman Akar | Polybius | Kata kunci AKSARA, I/J digabung | 11 12 11 14 | AKAR |
| Arsip Senja | Vigenère | Kata kunci KOTA, A=0 | ZIEAXU | PULANG |

Sandi klasik di sini digunakan untuk pembelajaran dan bukan untuk melindungi informasi sensitif. Karena aplikasi dijalankan sepenuhnya di browser, jawaban juga berada di kode sumber.

## Desain

- **Palet "Lontar Nusantara":** latar daun lontar `#EBDDB8`, teks cokelat kayu `#3A2617`/`#5A3A22`, aksen soga `#8B5A2B`, bidang nila `#2B3A55`, hiasan prada emas `#C8963E`, peringatan merah bata `#7A2E2A`. Pasangan teks dan latar memenuhi kontras WCAG AA.
- **Tipografi:** Cinzel (judul ala prasasti), Pinyon Script (kata pembuka bergaya sambung), Cormorant Garamond (teks cerita), dan font sistem untuk antarmuka. Ketiga font berlisensi SIL Open Font License dan disimpan lokal di `assets/fonts/`, jadi tetap tampil tanpa internet.
- **Elemen bentuk:** tepi kertas sobek, gambar bertepi gelombang, bingkai organik dan lingkaran bercincin emas, lencana bulat, jalur putus-putus, serta hiasan SVG kompas, gulungan, dan bulu pena.
- Ilustrasi dunia dibuat dengan AI. Tidak ada timer atau pembelian petunjuk: fokusnya mengikuti cerita dan memahami sandi. Mendukung reduced motion, reduced transparency, dan kontras tinggi.

## Pengujian

Dengan Node.js terpasang:

```bash
node --test tests/*.test.cjs
```

Delapan tes mencakup contoh sandi yang diketahui, kotak Polybius, validasi progres, normalisasi jawaban, syarat empat kunci untuk membuka lokasi akhir, serta simulasi alur antarmuka dari prolog sampai epilog dan melanjutkan progres. Simulasi DOM tidak menggantikan pemeriksaan visual pada browser/perangkat pengguna.
