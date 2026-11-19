// Akses localStorage yang aman: tidak pernah melempar error.
(function (root) {
  function loadJSON(key, fallback) {
    try {
      const store = globalThis.localStorage;
      if (!store) return fallback;
      const raw = store.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      const store = globalThis.localStorage;
      if (!store) return false;
      store.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  const api = { loadJSON, saveJSON, KEYS: { entries: 'kr.entries', puzzles: 'kr.puzzles' } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Store = api;
})(typeof window !== 'undefined' ? window : globalThis);
