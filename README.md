# Kota Aksara

Petualangan sandi 10 level berantai untuk dimainkan beberapa kelompok sekaligus, lengkap dengan papan skor. Para penjelajah mencari Lentera Aksara untuk menyelamatkan kota dari Kabut Sunyi. Revisi dari proyek Kotak Rahasia.

## Menjalankan

Buka `index.html` langsung di browser, atau jalankan server lokal di folder yang memuat `index.html`:

```powershell
python -m http.server 5504
```

lalu buka http://localhost:5504. Semua gambar, font, dan kode tersedia lokal. Internet hanya dibutuhkan untuk papan skor online.

### Papan skor bersama

Isi `firebase-config.js` dengan `apiKey` dan `projectId` dari project Firebase. Langkah lengkap, termasuk aturan keamanan Firestore, ada di [FIREBASE.md](FIREBASE.md). Jika belum diisi, papan skor berjalan dalam **mode lokal**: hanya kelompok yang bermain di browser yang sama yang tercatat.

## Alur permainan

1. Daftarkan **nama kelompok**. Nama ini muncul di papan skor.
2. Baca empat halaman prolog.
3. Pecahkan **10 level** secara berurutan. Level berikutnya terbuka setelah level sebelumnya selesai.
4. Setiap jawaban adalah petunjuk untuk membaca level berikutnya: angka geseran, jumlah rel, kata kunci, atau urutan langkah.
5. Empat level menyimpan **serpihan batu**. Serpihan baru terlihat setelah levelnya terpecahkan.
6. Di level 10 (Ruang Fajar), serpihan disatukan sesuai nomornya untuk menjadi kata kunci pintu terakhir.
7. Nyalakan lentera, baca epilog, dan lihat posisi kelompok di papan skor.

## Meja kerja

Setiap level punya **meja kerja**, alat bantu interaktif di bawah pesan sandi. **Kelima alat tersedia di setiap level** dengan nama netral, supaya alat tidak membocorkan sandi yang dipakai:

| Alat | Fungsi |
|---|---|
| Geser | Penggeser 0–25 dengan baris alfabet sandi dan hasil geseran |
| Cermin | Tabel pasangan A↔Z |
| Zig-zag | Pola naik-turun untuk jumlah rel yang dipilih, plus jumlah huruf di tiap rel |
| Kotak 5×5 | Kotak yang tersusun otomatis dari kata kunci yang diketik; huruf kata kunci diwarnai |
| Kunci berulang | Huruf kunci yang diulang di bawah setiap huruf sandi, lengkap dengan nilainya |

Ketuk huruf atau angka di pesan untuk menandainya di alat. Ada juga kolom **coretan** dan **buku panduan** yang menjelaskan kelima teknik. Pengaturan alat dan coretan tersimpan per level di browser.

Meja kerja tidak pernah mengisi kunci secara otomatis dan tidak menerjemahkan pesan.

## Nama sandi dirahasiakan

Nama sandi tiap level **tidak ditampilkan** sebelum level itu terpecahkan, supaya pemain bisa menebak jenis sandinya (misalnya untuk poin tambahan dari pengajar). Nama sandi juga tidak tertulis di kode sumber: ia disegel bersama hadiah level dan baru terbuka dengan jawaban yang benar. Setelah level selesai, layar hadiah menampilkan **"Sandinya: …"**.

Game memakai lima sandi klasik, sebagian digabung menjadi sandi ganda; tiga di antaranya dari materi kuliah. Pemetaan level ke sandi ada di `JAWABAN.md` (rahasia).

## Level dan poin

| Level | Lokasi | Kunci didapat dari | Poin |
|---|---|---|---|
| 1 | Gerbang Kota | diberitahukan di cerita | 100 |
| 2 | Kolam Cermin | — | 150 |
| 3 | Menara Angin | jawaban level 2 | 200 |
| 4 | Pagar Kebun | jawaban level 3 | 250 |
| 5 | Perpustakaan Batu | jawaban level 4 | 300 |
| 6 | Observatorium | jawaban level 5 | 350 |
| 7 | Jalur Rel Tua | jawaban level 6 | 400 |
| 8 | Taman Akar | jawaban level 7 | 450 |
| 9 | Arsip Senja | jawaban level 8 + mencoba sendiri | 500 |
| 10 | Ruang Fajar | gabungan 4 serpihan | 600 |

Serpihan ada di level 3, 5, 7, dan 9.

## Skor

- Skor maksimal **3.300**.
- Setiap petunjuk yang dibuka: **−20%** dari poin level itu (2 petunjuk per level).
- Setiap jawaban salah: **−10** poin.
- Poin sebuah level tidak pernah kurang dari 20% nilainya.
- Peringkat: skor tertinggi, lalu level terbanyak, lalu waktu tercepat sejak mendaftar.

## Keamanan jawaban

- Jawaban tidak disimpan sebagai teks. Yang ada di `engine.js` hanya **hash SHA-256**; input pemain di-hash lalu dibandingkan.
- Serpihan, nama sandi, dan catatan pelajaran **dikunci dengan jawaban levelnya** (XOR dengan aliran kunci turunan SHA-256), sehingga tidak bisa dibaca dari kode sumber sebelum level itu terpecahkan.
- Progres yang tersimpan diperiksa ulang dengan hash saat halaman dibuka, jadi mengubah localStorage tidak menambah skor.
- Batasan: skor dihitung di browser. Aturan Firestore menolak angka di luar batas wajar, tetapi tidak mencegah kecurangan oleh orang yang paham kode. Untuk permainan kelas ini cukup.

Sandi klasik di sini untuk pembelajaran, bukan untuk melindungi informasi sensitif.

## Struktur

| File | Isi |
|---|---|
| `index.html` | Kerangka halaman |
| `style.css` | Tampilan |
| `engine.js` | Fungsi sandi, SHA-256, skor, data 10 level (tanpa jawaban) |
| `app.js` | Layar permainan dan papan skor |
| `leaderboard.js` | Penyimpanan skor: Firestore REST atau localStorage |
| `firebase-config.js` | Konfigurasi Firebase |
| `FIREBASE.md` | Panduan menyiapkan Firebase |
| `tests/` | **Rahasia.** Tes dan `buat-level.cjs` (kunci jawaban + pembuat pesan sandi) |
| `JAWABAN.md` | **Rahasia.** Kunci jawaban untuk kelompok dan pengajar |

`tests/` dan `JAWABAN.md` dicantumkan di `.gitignore` agar tidak ikut ter-push dan tidak bisa dibuka lewat situs yang di-deploy. Jika repo kalian private dan ingin menyimpannya di GitHub, hapus dua baris itu dari `.gitignore`.

## Desain

- **Palet "Lontar Nusantara":** latar daun lontar `#EBDDB8`, teks cokelat kayu `#3A2617`/`#5A3A22`, aksen soga `#8B5A2B`, bidang nila `#2B3A55`, hiasan prada emas `#C8963E`, peringatan merah bata `#7A2E2A`. Pasangan teks dan latar memenuhi kontras WCAG AA.
- **Tipografi:** Cinzel (judul ala prasasti), Pinyon Script (kata pembuka bergaya sambung), Cormorant Garamond (teks cerita), dan font sistem untuk antarmuka. Ketiganya berlisensi SIL Open Font License dan disimpan lokal di `assets/fonts/`.
- **Elemen bentuk:** tepi kertas sobek, gambar bertepi gelombang, bingkai organik dan lingkaran bercincin emas, lencana bulat, serpihan batu bersudut, jalur putus-putus, serta hiasan SVG kompas, gulungan, dan bulu pena.
- Ilustrasi dunia dibuat dengan AI. Mendukung reduced motion, reduced transparency, dan kontras tinggi.

## Pengujian

```bash
node --test tests/engine.test.cjs tests/journey.test.cjs
```

17 tes mencakup contoh sandi (termasuk contoh zig-zag dari materi), pengecekan bahwa nama sandi tidak terlihat sebelum level terpecahkan, vektor uji SHA-256, kecocokan setiap level dengan kunci dari level sebelumnya, gabungan serpihan, hash dan segel hadiah, pengecekan bahwa jawaban tidak bocor di file yang dibagikan, urutan buka level, perhitungan skor, peringkat, validasi progres, serta simulasi alur dari pendaftaran sampai epilog dan papan skor (mode lokal dan Firebase tiruan).

Setelah mengubah jawaban di `tests/buat-level.cjs`, jalankan `node tests/buat-level.cjs` untuk membuat ulang pesan sandi dan hash di `engine.js`.
