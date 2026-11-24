/* Kota Aksara — papan skor.
   Mode online: Firebase Cloud Firestore lewat REST API (tanpa SDK, cukup fetch).
   Mode lokal: localStorage, dipakai jika firebase-config.js belum diisi. */
(function (root) {
  "use strict";
  const LOCAL_KEY = "kota-aksara-board-v2";
  const FIELDS = ["team", "score", "solved", "hints", "wrong", "startedAt", "updatedAt", "finished", "elapsedMs"];

  function create(config, deps) {
    const cfg = config || {};
    const fetchFn = (deps && deps.fetch) || (typeof fetch !== "undefined" ? fetch.bind(root) : null);
    const storage = (deps && deps.storage) || (typeof localStorage !== "undefined" ? localStorage : null);
    const online = !!(cfg.apiKey && cfg.projectId && fetchFn);
    const collection = encodeURIComponent(cfg.collection || "leaderboard");
    const base = online
      ? `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(cfg.projectId)}/databases/(default)/documents/${collection}`
      : "";

    function toFirestore(entry) {
      const fields = {};
      for (const k of FIELDS) {
        const v = entry[k];
        if (typeof v === "boolean") fields[k] = { booleanValue: v };
        else if (typeof v === "number") fields[k] = { integerValue: String(Math.max(0, Math.round(v))) };
        else fields[k] = { stringValue: String(v == null ? "" : v).slice(0, 30) };
      }
      return { fields };
    }
    function fromFirestore(doc) {
      const f = doc.fields || {};
      const read = (k) => {
        const v = f[k];
        if (!v) return k === "team" ? "" : k === "finished" ? false : 0;
        if ("booleanValue" in v) return v.booleanValue;
        if ("integerValue" in v) return Number(v.integerValue);
        if ("doubleValue" in v) return Number(v.doubleValue);
        return v.stringValue || "";
      };
      const out = { id: String(doc.name || "").split("/").pop() };
      for (const k of FIELDS) out[k] = read(k);
      return out;
    }
    function readLocal() {
      try {
        const raw = storage && storage.getItem(LOCAL_KEY);
        const data = raw ? JSON.parse(raw) : {};
        return data && typeof data === "object" ? data : {};
      } catch {
        return {};
      }
    }
    function writeLocal(data) {
      try {
        storage && storage.setItem(LOCAL_KEY, JSON.stringify(data));
      } catch {}
    }

    async function push(id, entry) {
      if (!id) throw new Error("ID kelompok kosong");
      if (!online) {
        const data = readLocal();
        data[id] = Object.assign({ id }, entry);
        writeLocal(data);
        return true;
      }
      const mask = FIELDS.map((f) => "updateMask.fieldPaths=" + f).join("&");
      const res = await fetchFn(`${base}/${encodeURIComponent(id)}?key=${encodeURIComponent(cfg.apiKey)}&${mask}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toFirestore(entry)),
      });
      if (!res.ok) throw new Error("Gagal menyimpan skor (" + res.status + ")");
      return true;
    }
    async function list() {
      if (!online) return Object.values(readLocal());
      const out = [];
      let token = "";
      for (let page = 0; page < 10; page++) {
        const res = await fetchFn(
          `${base}?key=${encodeURIComponent(cfg.apiKey)}&pageSize=300${token ? "&pageToken=" + encodeURIComponent(token) : ""}`,
        );
        if (!res.ok) throw new Error("Gagal memuat papan skor (" + res.status + ")");
        const data = await res.json();
        (data.documents || []).forEach((d) => out.push(fromFirestore(d)));
        if (!data.nextPageToken) break;
        token = data.nextPageToken;
      }
      return out;
    }
    return { online, push, list, toFirestore, fromFirestore };
  }

  const api = { create };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.KotaBoard = api;
})(typeof window !== "undefined" ? window : globalThis);
