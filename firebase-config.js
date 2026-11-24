/* Konfigurasi papan skor bersama (Firebase Cloud Firestore).
   Isi apiKey dan projectId dari Firebase console > Project settings > General > Your apps (Web).
   Kosongkan untuk memakai papan skor lokal (hanya tersimpan di browser ini).
   apiKey Firebase untuk web memang boleh terlihat publik; keamanannya diatur lewat Firestore Rules (lihat FIREBASE.md). */
window.KOTA_FIREBASE = {
  apiKey: "",
  projectId: "",
  collection: "leaderboard",
};
