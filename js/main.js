// Titik masuk: jalankan tiap bagian bila modulnya ada.
(function (root) {
  function start() {
    for (const name of ['Hero', 'Lab', 'Game', 'Leaderboard']) {
      const mod = root[name];
      if (mod && typeof mod.init === 'function') {
        try { mod.init(); } catch (e) { console.error('[Kotak Rahasia] gagal memulai ' + name, e); }
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window);
