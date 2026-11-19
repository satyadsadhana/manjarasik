// Logika game "Tebak Pesan": soal, skor, leaderboard. Tanpa DOM.
(function (root) {
  const LEVELS = {
    mudah: { base: 500, label: 'Mudah' },
    sedang: { base: 1000, label: 'Sedang' },
    sulit: { base: 1500, label: 'Sulit' },
  };
  const HINTS = { keyLetter: 100, gridRow: 150, firstLetters: 200 };
  const PER_SECOND = 5;
  const PER_WRONG = 50;
  const MIN_SCORE = 50;

  const DEFAULT_PUZZLES = [
    { id: 'm1', plaintext: 'ROUTER', keyword: '', level: 'mudah' },
    { id: 'm2', plaintext: 'PAKET DATA', keyword: '', level: 'mudah' },
    { id: 'm3', plaintext: 'ALAMAT IP', keyword: '', level: 'mudah' },
    { id: 'm4', plaintext: 'KABEL UTP', keyword: '', level: 'mudah' },
    { id: 's1', plaintext: 'TCP HANDSHAKE', keyword: 'JARINGAN', level: 'sedang' },
    { id: 's2', plaintext: 'SWITCH DAN HUB', keyword: 'KABEL', level: 'sedang' },
    { id: 's3', plaintext: 'PING BALIK', keyword: 'SINYAL', level: 'sedang' },
    { id: 's4', plaintext: 'FIREWALL AMAN', keyword: 'KUNCI', level: 'sedang' },
    { id: 'h1', plaintext: 'ENKRIPSI ITU SERU', keyword: 'UNAIR', level: 'sulit' },
    { id: 'h2', plaintext: 'PESAN RAHASIA TERKIRIM', keyword: 'POLYBIUS', level: 'sulit' },
    { id: 'h3', plaintext: 'JANGAN BAGIKAN PASSWORD', keyword: 'MANAJEMEN', level: 'sulit' },
    { id: 'h4', plaintext: 'PAKET HILANG DI JALAN', keyword: 'ROUTING', level: 'sulit' },
  ];

  function scoreRound({ level, seconds = 0, wrong = 0, hintCost = 0, solved }) {
    if (!solved) return 0;
    const base = (LEVELS[level] || LEVELS.mudah).base;
    const raw = base - PER_SECOND * Math.floor(seconds) - PER_WRONG * wrong - hintCost;
    return Math.max(MIN_SCORE, raw);
  }

  function canon(text) {
    return String(text || '')
      .toUpperCase()
      .replace(/J/g, 'I')
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isCorrectGuess(guess, answer) {
    const g = canon(guess);
    return g.length > 0 && g === canon(answer);
  }

  function normalizeName(name) {
    return String(name || '').replace(/\s+/g, ' ').trim().slice(0, 20).trim();
  }

  function aggregate(entries) {
    const map = new Map();
    for (const e of Array.isArray(entries) ? entries : []) {
      if (!e || typeof e !== 'object') continue;
      const name = normalizeName(e.name);
      if (!name) continue;
      const key = name.toLowerCase();
      const row = map.get(key) || { name, total: 0, solved: 0, plays: 0 };
      row.total += Number(e.score) || 0;
      row.solved += e.solved ? 1 : 0;
      row.plays += 1;
      map.set(key, row);
    }
    return [...map.values()]
      .sort((a, b) => b.total - a.total || b.solved - a.solved)
      .slice(0, 10);
  }

  function pickPuzzle(puzzles, level, usedIds = [], rng = Math.random) {
    const pool = (puzzles || []).filter((p) => p && p.level === level);
    if (!pool.length) return null;
    const fresh = pool.filter((p) => !usedIds.includes(p.id));
    const from = fresh.length ? fresh : pool;
    return from[Math.min(from.length - 1, Math.floor(rng() * from.length))];
  }

  const api = {
    LEVELS, HINTS, PER_SECOND, PER_WRONG, MIN_SCORE, DEFAULT_PUZZLES,
    scoreRound, isCorrectGuess, normalizeName, aggregate, pickPuzzle, canon,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GameCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
