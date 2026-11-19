// Polybius Square 5x5 dengan kata kunci. J digabung ke I.
(function (root) {
  const ALPHABET = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';

  function toLetter(ch) {
    const up = ch.toUpperCase();
    if (up === 'J') return 'I';
    return up >= 'A' && up <= 'Z' && up.length === 1 ? up : null;
  }

  function cleanKeyword(keyword) {
    let out = '';
    for (const ch of String(keyword || '')) {
      const l = toLetter(ch);
      if (l && !out.includes(l)) out += l;
    }
    return out;
  }

  function buildGrid(keyword) {
    const key = cleanKeyword(keyword);
    const grid = key.split('');
    for (const l of ALPHABET) if (!grid.includes(l)) grid.push(l);
    return grid;
  }

  function locate(letter, grid) {
    const l = toLetter(String(letter || ''));
    if (!l) return null;
    const i = grid.indexOf(l);
    return i < 0 ? null : { row: Math.floor(i / 5) + 1, col: (i % 5) + 1 };
  }

  function encrypt(text, keyword) {
    const grid = buildGrid(keyword);
    const words = String(text || '').trim().split(/\s+/).filter(Boolean);
    return words
      .map((raw) => {
        // Angka dan "/" di pesan asli dibungkus [..] agar tidak tertukar dengan koordinat.
        const word = raw.replace(/[\d/]+/g, (m) => '[' + m + ']');
        const parts = [];
        for (const ch of word) {
          const pos = locate(ch, grid);
          if (pos) parts.push(`${pos.row}${pos.col}`);
          else if (parts.length && !/^\d/.test(parts[parts.length - 1])) parts[parts.length - 1] += ch;
          else parts.push(ch);
        }
        return parts.join(' ');
      })
      .join(' / ');
  }

  function decrypt(code, keyword) {
    const grid = buildGrid(keyword);
    // Pisah kata di "/" yang tidak berada di dalam [..].
    const words = String(code || '').trim().split(/\s*\/\s*(?![^[]*\])/);
    const out = [];
    for (const word of words) {
      let text = '';
      let digits = '';
      const flush = () => {
        if (digits.length % 2 !== 0) return 'Jumlah angka ganjil — tiap huruf butuh 2 angka.';
        for (let i = 0; i < digits.length; i += 2) {
          const r = Number(digits[i]);
          const c = Number(digits[i + 1]);
          text += grid[(r - 1) * 5 + (c - 1)];
        }
        digits = '';
        return null;
      };
      const chars = word.replace(/\s+/g, '');
      for (let k = 0; k < chars.length; k++) {
        const ch = chars[k];
        if (ch === '[') {
          const end = chars.indexOf(']', k + 1);
          if (end < 0) return { ok: false, error: 'Kurung siku [ belum ditutup.' };
          const err = flush();
          if (err) return { ok: false, error: err };
          text += chars.slice(k + 1, end);
          k = end;
        } else if (/[0-9]/.test(ch)) {
          if (ch < '1' || ch > '5') return { ok: false, error: 'Hanya angka 1–5 yang valid.' };
          digits += ch;
        } else {
          const err = flush();
          if (err) return { ok: false, error: err };
          text += ch;
        }
      }
      const err = flush();
      if (err) return { ok: false, error: err };
      out.push(text);
    }
    return { ok: true, text: out.join(' ') };
  }

  function trace(text, keyword) {
    const grid = buildGrid(keyword);
    const out = [];
    for (const ch of String(text || '')) {
      const l = toLetter(ch);
      if (l) out.push(grid.indexOf(l));
    }
    return out;
  }

  const api = { ALPHABET, cleanKeyword, buildGrid, locate, encrypt, decrypt, trace };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Polybius = api;
})(typeof window !== 'undefined' ? window : globalThis);
