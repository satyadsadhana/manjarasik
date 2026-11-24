# Menyiapkan papan skor bersama (Firebase)

Tanpa langkah ini, game tetap bisa dimainkan, tetapi papan skor hanya tersimpan di satu browser (mode lokal). Ikuti langkah di bawah agar semua kelompok melihat papan skor yang sama. Waktunya sekitar 10 menit dan gratis (paket Spark).

## 1. Buat project

1. Buka https://console.firebase.google.com dan masuk dengan akun Google.
2. Klik **Create a project** (atau **Add project**), beri nama misalnya `kota-aksara`, lalu ikuti langkahnya. Google Analytics boleh dimatikan.

## 2. Aktifkan Cloud Firestore

1. Di menu kiri, pilih **Build → Firestore Database → Create database**.
2. Pilih lokasi terdekat, misalnya `asia-southeast2 (Jakarta)`.
3. Pilih **Start in production mode**, lalu **Create**.

## 3. Pasang aturan keamanan

Buka tab **Rules** di Firestore, ganti seluruh isinya dengan aturan berikut, lalu klik **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leaderboard/{teamId} {
      allow read: if true;
      allow create, update: if teamId.size() <= 48
        && request.resource.data.keys().hasOnly(['team','score','solved','hints','wrong','startedAt','updatedAt','finished','elapsedMs'])
        && request.resource.data.team is string && request.resource.data.team.size() > 0 && request.resource.data.team.size() <= 30
        && request.resource.data.score is int && request.resource.data.score >= 0 && request.resource.data.score <= 3300
        && request.resource.data.solved is int && request.resource.data.solved >= 0 && request.resource.data.solved <= 10
        && request.resource.data.hints is int && request.resource.data.wrong is int
        && request.resource.data.finished is bool && request.resource.data.elapsedMs is int;
      allow delete: if false;
    }
  }
}
```

Aturan ini membolehkan siapa saja membaca papan skor dan mengirim skor dengan format yang benar, tetapi tidak membolehkan menghapus data atau menyimpan data lain.

## 4. Ambil konfigurasi web

1. Klik ikon roda gigi → **Project settings** → tab **General**.
2. Di bagian **Your apps**, klik ikon **Web** (`</>`), beri nama aplikasi, lalu **Register app**. Firebase Hosting tidak perlu dicentang.
3. Firebase menampilkan objek `firebaseConfig`. Salin nilai `apiKey` dan `projectId`.

## 5. Isi `firebase-config.js`

```js
window.KOTA_FIREBASE = {
  apiKey: "AIza...",          // dari firebaseConfig
  projectId: "kota-aksara-xxxx", // dari firebaseConfig
  collection: "leaderboard",
};
```

Simpan, commit, lalu push. Setelah Vercel selesai deploy, halaman sampul akan menulis **"Papan skor online aktif"**.

`apiKey` Firebase untuk web memang dirancang untuk terlihat publik; yang menjaga data adalah aturan di langkah 3.

## Saat presentasi

- Buka menu **Skor** di laptop yang tersambung ke proyektor. Papan skor diperbarui otomatis setiap 10 detik.
- Setiap kelompok bermain di perangkat masing-masing dan mendaftar dengan nama kelompoknya.
- Untuk mengosongkan papan skor sebelum sesi baru: buka Firestore Database di console, lalu hapus koleksi `leaderboard`. Bisa juga ganti `collection` di `firebase-config.js` menjadi nama baru, misalnya `sesi-2`, lalu tambahkan nama koleksi itu di aturan langkah 3.

## Batasan

Skor dihitung di browser pemain. Aturan Firestore menolak skor di luar batas wajar (0–3300, maksimal 10 level), tetapi kelompok yang paham kode tetap bisa mengirim angka palsu dalam batas itu. Untuk permainan di kelas ini cukup; untuk lomba sungguhan perlu server yang memeriksa jawaban.
