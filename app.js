/* Kota Aksara: petualangan sandi 10 level berantai dengan papan skor antarkelompok. */
(function () {
  "use strict";
  const E = StoryEngine,
    quests = E.quests,
    TOTAL = quests.length,
    STORE = "kota-aksara-journey-v2";
  let safeStorage = null;
  try {
    safeStorage = localStorage;
  } catch {}
  const board = KotaBoard.create(typeof KOTA_FIREBASE !== "undefined" ? KOTA_FIREBASE : null, {
    storage: safeStorage,
    fetch: typeof fetch !== "undefined" ? (url, opts) => fetch(url, opts) : null,
  });
  const main = document.getElementById("main");
  let state = E.validateState(null),
    hasSave = false,
    storageWorks = true,
    boardTimer = null,
    syncError = "";
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) {
      state = E.validateState(JSON.parse(raw));
      hasSave = !!state.team;
    }
  } catch {
    storageWorks = false;
  }
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const team = () => esc(state.team || "Kelompok");
  const fmt = (n) => Number(n || 0).toLocaleString("id-ID");
  const iconPaths = {
    arrow: "M4 12h16m-6-6 6 6-6 6",
    back: "M20 12H4m6-6-6 6 6 6",
    check: "m5 12 4 4 10-10",
    key: "M14 10a5 5 0 1 0-4 4l-7 7m2-2 3 3m0-6 3 3",
    lock: "M6 10h12v11H6zM8 10V7a4 4 0 0 1 8 0v3m-4 4v3",
    sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5",
    star: "m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1Z",
    leaf: "M20 3C7 2 2 10 6 16s13 5 14-13ZM4 21 16 9m-7 6v-5m0 5h5",
    door: "M5 21V3h14v18M2 21h20M9 21V7l6-2v16m-3-7v1",
    book: "M12 5C8 2 4 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-2-7-1-10 1Zm0 0v16",
    compass: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4 6-3 5-5 3 3-5Z",
    trophy: "M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0ZM7 6H3v2a4 4 0 0 0 4 4m10-6h4v2a4 4 0 0 1-4 4",
    shard: "m12 2 7 6-3 13H8L5 8Z",
  };
  const decoPaths = {
    compass:
      '<circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 4"/><path d="M50 10 58 50 50 90 42 50Z" fill="currentColor" opacity=".9"/><path d="M10 50 50 42 90 50 50 58Z" fill="currentColor" opacity=".45"/><circle cx="50" cy="50" r="4" fill="var(--paper)"/>',
    scroll:
      '<path d="M22 22h50a8 8 0 0 1 8 8v44a8 8 0 0 1-8 8H30a8 8 0 0 1-8-8V22Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M22 22a8 8 0 0 0-8 8v6h8M80 74v6a8 8 0 0 1-8 8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M34 38h34M34 48h34M34 58h22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 5"/>',
    quill:
      '<path d="M84 12C52 18 30 40 22 78l6 2c6-14 14-24 24-32-6 10-10 20-12 30 22-10 38-34 44-66Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M14 90 28 76" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    path: '<path d="M4 80C40 20 80 90 120 40s70-10 92 20" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="6 8" stroke-linecap="round"/>',
  };
  const deco = (n, cls = "") =>
    `<svg class="deco deco-${n} ${cls}" viewBox="${n === "path" ? "0 0 216 100" : "0 0 100 100"}" aria-hidden="true" focusable="false">${decoPaths[n]}</svg>`;
  const icon = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${iconPaths[n] || iconPaths.key}"/></svg>`;
  const bind = (id, event, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, fn);
  };
  const tierDots = (q) =>
    `<span class="tier" aria-label="Tingkat kesulitan ${q.tier} dari 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= q.tier ? "on" : ""}"></i>`).join("")}</span>`;
  const elapsed = () => {
    if (!state.startedAt) return 0;
    return (state.finished && state.finishedAt ? state.finishedAt : Date.now()) - state.startedAt;
  };
  const clock = (ms) => {
    if (!ms) return "–";
    const s = Math.floor(ms / 1000),
      h = Math.floor(s / 3600),
      m = Math.floor((s % 3600) / 60),
      ss = String(s % 60).padStart(2, "0");
    return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
  };
  const newTeamId = (name) => {
    const slug =
      String(name)
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 20) || "kelompok";
    const rand = Array.from({ length: 8 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
    return `${slug}-${rand}`;
  };

  function save() {
    hasSave = true;
    try {
      localStorage.setItem(STORE, JSON.stringify(state));
    } catch {
      storageWorks = false;
    }
    updateChrome();
  }
  function entry() {
    const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);
    return {
      team: state.team,
      score: E.totalScore(state),
      solved: state.solved.length,
      hints: sum(state.hints),
      wrong: sum(state.wrong),
      startedAt: state.startedAt,
      updatedAt: Date.now(),
      finished: state.finished,
      elapsedMs: elapsed(),
    };
  }
  function sync() {
    if (!state.teamId) return Promise.resolve();
    return board
      .push(state.teamId, entry())
      .then(() => {
        syncError = "";
      })
      .catch((err) => {
        syncError = err && err.message ? err.message : "Skor belum tersimpan ke papan skor.";
      })
      .finally(updateChrome);
  }
  function updateChrome() {
    document.getElementById("keyCount").textContent = `${state.solved.length}/${TOTAL}`;
    document.getElementById("mapNav").disabled = !state.introDone;
    const sc = document.getElementById("scoreCount");
    if (sc) sc.textContent = fmt(E.totalScore(state));
  }
  function show(html, view) {
    if (boardTimer) {
      clearInterval(boardTimer);
      boardTimer = null;
    }
    main.innerHTML =
      (storageWorks
        ? ""
        : '<div class="storage-warning" role="status">Penyimpanan browser tidak tersedia. Kamu tetap bisa bermain, tetapi progres tidak akan tersimpan setelah halaman ditutup.</div>') +
      `<div class="screen" data-view="${view}">${html}</div>`;
    main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    updateChrome();
  }
  function art(scene, caption = "", label = "") {
    return `<div class="scene ${scene}" role="img" aria-label="${esc(label || "Ilustrasi dunia Kota Aksara")}"><span class="coordinate" aria-hidden="true">AKSARA / CATATAN PERJALANAN</span>${caption ? `<div class="art-caption"><span class="eyebrow">DARI JURNAL ELARA</span><p>${caption}</p></div>` : ""}</div>`;
  }

  // ---------- sampul ----------
  function cover() {
    const resume = hasSave
      ? `<div class="resume-card"><p><span class="script">Selamat kembali,</span> <b>${team()}</b>. ${state.finished ? "Kota Aksara telah kembali bercahaya." : `${state.solved.length} dari ${TOTAL} level selesai · ${fmt(E.totalScore(state))} poin.`}</p><div class="actions"><button class="button" id="resume">${state.finished ? "Baca akhir cerita" : "Lanjutkan perjalanan"} ${icon("arrow")}</button><button class="button secondary-button" id="coverBoard">${icon("trophy")} Papan skor</button><button class="text-button" id="resetFromCover">Mulai ulang</button></div></div>`
      : `<form id="welcomeForm" class="welcome-form"><div class="bar-field"><label for="playerName">Nama kelompok</label><input id="playerName" class="input" autocomplete="off" maxlength="24" placeholder="Contoh: Kelompok 3" required></div><div class="bar-stat"><span>Level</span><b>10 sandi</b></div><div class="bar-stat"><span>Skor maks.</span><b>${fmt(E.MAX_SCORE)}</b></div><button class="button" type="submit">Mulai bermain ${icon("arrow")}</button><p class="feedback form-feedback" id="welcomeFeedback" role="alert"></p></form>`;
    show(
      `<section class="hero">${art("city", "", "Kota fantasi Aksara dan seorang penjelajah bersyal biru di jalan menuju menara")}<div class="hero-copy"><span class="script hero-script">Temukan</span><h1 class="hero-title">Kota Aksara</h1><p>Kabut mulai menelan Kota Aksara. Sepuluh pesan sandi berantai adalah satu-satunya jalan menuju lentera yang hilang. Kelompok mana yang pertama membawa cahaya pulang?</p></div><div class="hero-badge" aria-hidden="true"><b>10</b><span>level</span></div>${deco("compass", "hero-compass")}</section><div class="quest-bar">${resume}</div><section class="steps-block" aria-labelledby="stepsTitle"><div class="section-head"><span class="script">Tiga langkah</span><h2 id="stepsTitle">Menyelamatkan kota</h2></div><ol class="step-cards"><li><span class="step-num">1</span><div><b>Daftarkan kelompok</b><p>Nama kelompokmu akan muncul di papan skor bersama kelompok lain.</p></div>${deco("scroll", "step-deco")}</li><li><span class="step-num">2</span><div><b>Pecahkan 10 sandi berantai</b><p>Jawaban satu level menjadi kunci level berikutnya. Makin jauh, makin sulit.</p></div>${deco("quill", "step-deco")}</li><li><span class="step-num">3</span><div><b>Satukan serpihan</b><p>Empat level menyimpan serpihan. Gabungkan semuanya untuk membuka Ruang Fajar.</p></div>${deco("compass", "step-deco")}</li></ol></section><aside class="quote-band"><span class="eyebrow">Aturan skor</span><p>Setiap level bernilai ${E.POINTS[0]}–${E.POINTS[TOTAL - 1]} poin. Setiap petunjuk mengurangi ${Math.round(E.HINT_PENALTY * 100)}% poin level itu, dan setiap jawaban salah −${E.WRONG_PENALTY}. Jika skor sama, yang lebih cepat menang.</p></aside><p class="saved">${board.online ? "Papan skor online aktif. Progres juga tersimpan di browser ini." : "Papan skor mode lokal: hanya tersimpan di browser ini."}</p>`,
      "cover",
    );
    bind("welcomeForm", "submit", (event) => {
      event.preventDefault();
      const name = document.getElementById("playerName").value.trim().slice(0, 24);
      if (!E.normalize(name)) {
        document.getElementById("welcomeFeedback").textContent = "Tulis nama kelompok terlebih dahulu (minimal satu huruf).";
        return;
      }
      state = E.validateState({ team: name, teamId: newTeamId(name), startedAt: Date.now() });
      save();
      sync();
      story(0);
    });
    bind("resume", "click", () => (state.finished ? ending() : state.introDone ? map() : story(state.storyPage)));
    bind("coverBoard", "click", leaderboard);
    bind("resetFromCover", "click", askReset);
  }

  // ---------- prolog ----------
  function introPages() {
    return [
      {
        label: "PROLOG / SEBELUM KOTA TERLELAP",
        scene: "city",
        speaker: state.team || "Kelompok",
        role: "Para penjelajah muda · penjaga pesan",
        title: `Ini kisah kalian, ${team()}.`,
        body: `<p>Di Kota Aksara, setiap pesan punya tempatnya. Surat-surat disimpan di menara. Nama-nama bintang dicatat di kubah. Dan cerita tumbuh bersama akar pepohonan.</p><p>Kalian, <b>${team()}</b>, adalah para pembawa pesan muda yang hafal setiap gang kecil di kota. Biasanya tugas kalian sederhana: memastikan setiap surat sampai ke rumah yang tepat.</p><p>Malam ini, sebuah surat datang justru untuk kalian.</p>`,
        caption: "Sebelum menjadi penyelamat,<br>kalian hanyalah pembawa pesan.",
      },
      {
        label: "PROLOG / SURAT DARI ELARA",
        scene: "archive",
        speaker: "Elara",
        role: "Penjaga Arsip Kota",
        title: "“Kota ini membutuhkan kalian.”",
        body: `<p>Surat itu bersegel emas. Tulisan Elara, penjaga arsip yang mengajari kalian membaca sandi, tampak lebih tergesa daripada biasanya.</p><p class="quote">“Kabut Sunyi telah melewati gerbang. Ia tidak menghancurkan bangunan. Ia mengambil ingatan. Jika kita menunggu, besok tak seorang pun akan ingat nama kotanya sendiri.”</p><p>Di balik jendela, cahaya rumah-rumah mulai padam satu per satu.</p>`,
        caption: "Ketika nama-nama mulai terlupakan,<br>sebuah pesan menjadi harapan.",
      },
      {
        label: "PROLOG / JEJAK BERANTAI",
        scene: "sky",
        speaker: "Elara",
        role: "Pesan yang ditinggalkan untuk kalian",
        title: "Sepuluh pesan. Satu jalan.",
        body: `<p class="quote">“Lentera Aksara kusembunyikan di Ruang Fajar. Jalannya kutandai dengan sepuluh pesan bersandi. Setiap pesan memberi tahu cara membaca pesan berikutnya.”</p><p>Empat penjaga juga menyimpan <b>serpihan batu</b>. Serpihan itu tidak berarti apa-apa sendirian, tetapi jika disatukan akan menjadi kunci pintu terakhir.</p><p>Simpan setiap jawaban baik-baik. Jawaban hari ini adalah kunci esok hari.</p>`,
        caption: "Setiap jawaban<br>membuka pintu berikutnya.",
      },
      {
        label: "PROLOG / LANGKAH PERTAMA",
        scene: "garden",
        speaker: state.team || "Kelompok",
        role: "Penjelajah · sebuah perjalanan baru",
        title: "Kalian membuka halaman berikutnya.",
        body: `<p>Kalian menyelipkan surat Elara ke dalam jurnal, lalu melangkah keluar. Kabut menyentuh ujung sepatu, dingin dan tanpa suara.</p><p>Kelompok lain juga sudah berangkat. <b>Papan skor</b> akan mencatat siapa yang paling jauh, paling teliti, dan paling cepat.</p><p>Di halaman kosong jurnal, kalian menulis satu janji:</p><p class="quote">“Kami akan membawa cahaya itu pulang.”</p>`,
        caption: "Tidak semua penjelajah tahu arah.<br>Yang penting, mereka mulai melangkah.",
      },
    ];
  }
  function story(page) {
    state.storyPage = page;
    save();
    const s = introPages()[page];
    show(
      `<div class="reading-bar"><span class="eyebrow">${s.label}</span><div class="page-dots" aria-label="Halaman ${page + 1} dari 4">${[0, 1, 2, 3].map((i) => `<i class="${i === page ? "active" : i < page ? "done" : ""}">${i + 1}</i>`).join("")}</div></div><article class="book"><div class="book-art">${art(s.scene, s.caption)}<span class="page-badge" aria-hidden="true"><b>0${page + 1}</b><span>halaman</span></span></div><div class="book-copy"><div class="character"><span class="avatar" aria-hidden="true">${esc(s.speaker.slice(0, 1))}</span><div><b>${esc(s.speaker)}</b><small>${s.role}</small></div></div><h1>${s.title}</h1><div class="story-text">${s.body}</div><div class="book-controls"><button class="button ghost" id="prevStory">${icon("back")} ${page ? "Sebelumnya" : "Sampul"}</button><small>${page + 1} / 4</small><button class="button" id="nextStory">${page === 3 ? "Buka peta" : "Lanjut cerita"} ${icon("arrow")}</button></div></div></article>`,
      "story",
    );
    bind("prevStory", "click", () => (page ? story(page - 1) : cover()));
    bind("nextStory", "click", () => {
      if (page < 3) story(page + 1);
      else {
        state.introDone = true;
        save();
        map();
      }
    });
  }

  // ---------- peta ----------
  function fragmentStrip(dark = false) {
    const frags = E.fragments(state);
    return `<div class="shard-strip ${dark ? "on-dark" : ""}" aria-label="Serpihan batu">${frags
      .map(
        (f) =>
          `<div class="shard ${f.text ? "found" : ""}"><span class="shard-num">${f.n}</span><b>${f.text ? esc(f.text) : "?"}</b><small>${esc(f.from.name)}</small></div>`,
      )
      .join("")}</div>`;
  }
  function map() {
    if (!state.introDone) {
      cover();
      return;
    }
    const n = state.solved.length,
      finalQ = quests[TOTAL - 1],
      finalOpen = E.isUnlocked(state, finalQ),
      finalDone = state.solved.includes(finalQ.id);
    const cards = quests
      .slice(0, TOTAL - 1)
      .map((q) => {
        const done = state.solved.includes(q.id),
          open = E.isUnlocked(state, q);
        return `<article class="location ${open ? "" : "locked"} ${done ? "done" : ""}"><div class="scene ${q.scene}" role="img" aria-label="Ilustrasi ${esc(q.name)}">${done ? `<span class="complete-mark" aria-label="Level selesai">${icon("check")}</span>` : ""}${!open ? `<span class="lock-mark" aria-hidden="true">${icon("lock")}</span>` : ""}${q.fragment ? `<span class="shard-tag" title="Menyimpan serpihan">${icon("shard")} Serpihan ${q.fragment}</span>` : ""}</div><div class="location-content"><span class="location-number" aria-label="Level ${q.level}">${q.number}</span><div class="location-meta"><span class="pill ${open ? q.color : ""}">${open ? `${icon(q.symbol)} ${q.cipher}` : `${icon("lock")} Terkunci`}</span>${tierDots(q)}</div><h2>${open ? esc(q.name) : "Lokasi tersembunyi"}</h2><p>${open ? esc(q.subtitle) : `Selesaikan level ${q.level - 1} untuk membuka jalan ke sini.`}</p><div class="location-foot"><span class="points">${done ? `${fmt(state.scores[q.id])} / ${fmt(q.points)} poin` : `${fmt(q.points)} poin`}</span></div><button class="button ${done ? "secondary-button" : ""}" data-visit="${q.id}" ${open ? "" : "disabled"}>${done ? "Lihat catatan" : open ? "Jelajahi" : "Terkunci"} ${icon(done ? "book" : open ? "arrow" : "lock")}</button></div></article>`;
      })
      .join("");
    show(
      `<section><div class="map-head"><div><span class="eyebrow">Bab I</span><span class="script">Jejak sepuluh penjaga</span><h1>Ke mana langkah kalian, ${team()}?</h1><p>Level terbuka satu per satu. Jawaban setiap level adalah petunjuk untuk membaca level berikutnya, jadi catat baik-baik.</p></div><div class="progress-box"><span>${n} dari ${TOTAL} level · <b id="mapScore">${fmt(E.totalScore(state))}</b> poin</span><div class="progress-track" role="progressbar" aria-label="Level selesai" aria-valuemin="0" aria-valuemax="${TOTAL}" aria-valuenow="${n}"><i style="width:${(n / TOTAL) * 100}%"></i></div><button class="text-button" id="mapBoard">${icon("trophy")} Lihat papan skor</button></div></div>${deco("path", "map-path")}<div class="map-grid">${cards}</div><article class="final-gate ${finalOpen ? "unlocked" : ""}"><div class="gate-count" aria-hidden="true"><b>10</b><span class="script">level terakhir</span></div><div class="gate-text"><span class="eyebrow">Tujuan akhir · ${fmt(finalQ.points)} poin</span><h2>Ruang Fajar</h2><p>${finalDone ? "Lentera Aksara telah ditemukan." : finalOpen ? "Keempat serpihan sudah di tangan. Satukan mereka untuk membuka pintu." : "Pintu ini dikunci dengan gabungan empat serpihan batu. Kumpulkan dari para penjaga."}</p>${fragmentStrip(true)}</div><button class="button" id="openFinal" ${finalOpen ? "" : "disabled"}>${finalDone ? "Baca epilog" : finalOpen ? "Masuk ke Ruang Fajar" : "Terkunci · " + n + "/" + (TOTAL - 1)} ${icon(finalOpen ? "arrow" : "lock")}</button></article><div class="map-note"><p><span aria-hidden="true">01—10</span> &nbsp;Setiap petunjuk −${Math.round(E.HINT_PENALTY * 100)}% poin level, setiap jawaban salah −${E.WRONG_PENALTY}.</p><button class="text-button" id="reread">Baca ulang prolog</button></div></section>`,
      "map",
    );
    main.querySelectorAll("[data-visit]").forEach((b) => b.addEventListener("click", () => visit(b.dataset.visit)));
    bind("openFinal", "click", () => {
      if (finalDone) state.finished ? ending() : finalStory();
      else if (finalOpen) visit(finalQ.id);
    });
    bind("mapBoard", "click", leaderboard);
    bind("reread", "click", () => story(0));
  }

  // ---------- level ----------
  function visit(id) {
    const q = quests.find((x) => x.id === id);
    if (!q || !E.isUnlocked(state, q)) {
      map();
      return;
    }
    if (state.solved.includes(id)) {
      q.final ? (state.finished ? ending() : finalStory()) : reward(q);
      return;
    }
    show(
      `<div class="reading-bar"><button class="button ghost" id="backMap">${icon("back")} Kembali ke peta</button><span class="pill ${q.color}">Level ${q.level} · ${q.cipher}</span></div><article class="book"><div class="book-art">${art(q.scene, `“${q.clue}”`)}<span class="page-badge" aria-hidden="true"><b>${q.number}</b><span>level</span></span></div><div class="book-copy"><span class="eyebrow">Level ${q.level} dari ${TOTAL} · ${fmt(q.points)} poin</span><span class="script">${q.subtitle}</span><h1>${q.name}</h1>${tierDots(q)}<div class="story-text"><p>${q.text}</p>${q.fragment ? `<p><b>Penjaga di sini menyimpan serpihan ${q.fragment}.</b> Pecahkan sandinya untuk mendapatkannya.</p>` : ""}</div><div class="book-controls"><small>Baca. Pahami. Coba.</small><button class="button" id="beginPuzzle">Periksa sandi ${icon("arrow")}</button></div></div></article>`,
      "location",
    );
    bind("backMap", "click", map);
    bind("beginPuzzle", "click", () => puzzle(q));
  }
  const NUMBERS = `<div class="alphabet">A=0  B=1  C=2  D=3  E=4  F=5  G=6<br>H=7  I=8  J=9  K=10 L=11 M=12 N=13<br>O=14 P=15 Q=16 R=17 S=18 T=19 U=20<br>V=21 W=22 X=23 Y=24 Z=25</div>`;
  const TIP = `<p>Pesan huruf ditulis tanpa spasi dan dikelompokkan per lima huruf. Jawaban boleh diketik dengan atau tanpa spasi.</p>`;
  function polyTable(keyword, label) {
    const g = E.grid(keyword),
      unique = new Set(E.normalize(keyword).replace(/J/g, "I")).size;
    return `<div class="polygrid" aria-label="${esc(label)}"><span class="axis"></span>${[1, 2, 3, 4, 5].map((v) => `<span class="axis">${v}</span>`).join("")}${[0, 1, 2, 3, 4]
      .map(
        (row) =>
          `<span class="axis">${row + 1}</span>${g
            .slice(row * 5, row * 5 + 5)
            .map((c, col) => `<span class="${row * 5 + col < unique ? "key-letter" : ""}" aria-label="baris ${row + 1} kolom ${col + 1}: ${c === "I" ? "I/J" : c}">${c === "I" ? "I/J" : c}</span>`)
            .join("")}`,
      )
      .join("")}</div>`;
  }
  function railDemo() {
    return `<p>Contoh dari materi kuliah, 3 rel: <b>WE ARE DISCOVERED RUN AT ONCE</b> ditulis zig-zag, lalu dibaca per baris menjadi <b>WECRUO ERDSOEERNTNE AIVDAC</b>.</p><div class="alphabet">W . . . E . . . C . . . R . . . U . . . O<br>. E . R . D . S . O . E . E . R . N . T . N . E<br>. . A . . . I . . . V . . . D . . . A . . . C</div><p>Untuk membuka: hitung panjang pesan, gambar pola zig-zag, hitung berapa huruf di tiap rel, potong pesan sesuai jumlah itu, lalu baca mengikuti zig-zag.</p>`;
  }
  function guide(q) {
    switch (q.type) {
      case "caesar-known":
        return `<p>${q.method} Untuk membaca, mundurkan setiap huruf sebanyak jarak itu. Alfabet berputar: jika melewati A, lanjut dari Z.</p>${TIP}<div class="alphabet">Asli  A B C D E F G H I J K L M<br>      N O P Q R S T U V W X Y Z<br>Sandi D E F G H I J K L M N O P<br>      Q R S T U V W X Y Z A B C</div>`;
      case "caesar-hidden":
        return `<p>${q.method} Setelah tahu jaraknya, mundurkan setiap huruf sebanyak itu.</p>${TIP}${NUMBERS}`;
      case "atbash":
        return `<p>${q.method} Cari huruf pesan pada salah satu baris, lalu baca huruf pasangannya.</p>${TIP}<div class="alphabet">A B C D E F G H I J K L M<br>Z Y X W V U T S R Q P O N</div>`;
      case "rail":
        return `<p>${q.method}</p>${TIP}${railDemo()}`;
      case "polybius-plain":
        return `<p>${q.method}</p>${polyTable("", "Kotak Polybius alfabet biasa")}`;
      case "polybius-key":
        return `<p>${q.method}</p><p>Contoh susunan dengan kata kunci <b>KOTA</b> (bukan kata kunci peti ini): baris pertama dimulai K, O, T, A, lalu sisa alfabet.</p>${polyTable("KOTA", "Contoh kotak Polybius dengan kata kunci KOTA")}`;
      case "vigenere":
        return `<p>${q.method}</p>${TIP}<table class="vtable"><caption>Contoh dengan kata kunci KOTA (bukan kata kunci level ini)</caption><tr><th>Huruf sandi</th><td>Z (25)</td><td>I (8)</td></tr><tr><th>Huruf kunci</th><td>K (10)</td><td>O (14)</td></tr><tr><th>Hasil asli</th><td>P (15)</td><td>U (20)</td></tr></table>${NUMBERS}`;
      case "double":
        return `<p>${q.method}</p>${TIP}<p>Ingat: Atbash memasangkan A↔Z, B↔Y, dan seterusnya. Caesar menggeser semua huruf dengan jarak yang sama.</p><div class="alphabet">A B C D E F G H I J K L M<br>Z Y X W V U T S R Q P O N</div>${NUMBERS}`;
      default:
        return `<p>${q.method}</p>${TIP}<p><b>Langkah 1, Rail Fence:</b> susun ulang huruf mengikuti pola zig-zag.</p>${railDemo()}<p><b>Langkah 2, Vigenère:</b> kurangi setiap huruf dengan huruf kata kunci yang diulang (A = 0). Jika negatif, tambahkan 26.</p>${NUMBERS}`;
    }
  }
  // ---------- meja kerja (alat bantu interaktif) ----------
  // Membantu menyusun kotak, menggeser alfabet, dan menggambar pola. Kunci tidak pernah diisikan otomatis,
  // dan alat ini tidak menerjemahkan pesan: pemain tetap mencocokkan sendiri.
  const WB_KEY = "kota-aksara-meja-v1";
  function wbLoad(id) {
    try {
      const all = JSON.parse(localStorage.getItem(WB_KEY) || "{}");
      return all && typeof all[id] === "object" && all[id] ? all[id] : {};
    } catch {
      return {};
    }
  }
  function wbSave(id, patch) {
    try {
      const all = JSON.parse(localStorage.getItem(WB_KEY) || "{}") || {};
      all[id] = Object.assign({}, all[id], patch);
      localStorage.setItem(WB_KEY, JSON.stringify(all));
    } catch {}
  }
  const TOOLS = {
    "caesar-known": ["caesar"],
    "caesar-hidden": ["caesar"],
    atbash: ["atbash"],
    rail: ["rail"],
    "polybius-plain": ["poly"],
    "polybius-key": ["poly"],
    vigenere: ["vig"],
    double: ["atbash"], // tanpa penggeser: geseran level 9 harus dicari sendiri
    final: ["rail", "vig"],
  };
  const isPairs = (q) => q.type.startsWith("polybius");
  const AZL = E.AZ.split("");
  function alphaRows(top, bottom, labels, hit) {
    const block = (s, e) =>
      `<div class="wb-alpha"><span class="wb-label">${labels[0]}</span>${top
        .slice(s, e)
        .map((c) => `<span class="wb-cell ${c === hit ? "is-hit" : ""}">${c}</span>`)
        .join("")}<span class="wb-label">${labels[1]}</span>${bottom
        .slice(s, e)
        .map((c, i) => `<span class="wb-cell low ${top[s + i] === hit ? "is-hit" : ""}">${c}</span>`)
        .join("")}</div>`;
    return block(0, 13) + block(13, 26);
  }
  function wbRender(tool, q, st, sel) {
    const letters = E.normalize(q.ciphertext);
    if (tool === "caesar") {
      const k = st.shift;
      const bottom = AZL.map((_, i) => E.AZ[(i - k + 26) % 26]);
      return alphaRows(AZL, bottom, ["Sandi", k ? `−${k}` : "±0"], sel && sel.ch);
    }
    if (tool === "atbash") {
      return alphaRows(AZL, [...AZL].reverse(), ["Huruf", "Cermin"], sel && sel.ch);
    }
    if (tool === "poly") {
      const key = E.normalize(st.key).replace(/J/g, "I"),
        g = E.grid(key),
        unique = new Set(key).size;
      return `<div class="wb-grid" role="grid" aria-label="Kotak Polybius dari kata kunci ${esc(key || "kosong")}"><span class="axis"></span>${[1, 2, 3, 4, 5].map((v) => `<span class="axis">${v}</span>`).join("")}${[0, 1, 2, 3, 4]
        .map(
          (r) =>
            `<span class="axis">${r + 1}</span>${g
              .slice(r * 5, r * 5 + 5)
              .map((c, col) => {
                const coord = `${r + 1}${col + 1}`;
                return `<span class="wb-sq ${r * 5 + col < unique ? "from-key" : ""} ${sel && sel.ch === coord ? "is-hit" : ""}"><small>${coord}</small>${c === "I" ? "I/J" : c}</span>`;
              })
              .join("")}`,
        )
        .join("")}</div><p class="wb-legend"><i class="sw from-key"></i> dari kata kunci <i class="sw is-hit"></i> pasangan yang ditandai</p>`;
    }
    if (tool === "vig") {
      const key = E.normalize(st.vkey);
      return `<div class="wb-vig">${letters
        .split("")
        .map((c, i) => {
          const kc = key ? key[i % key.length] : "";
          return `<span class="wb-col ${sel && sel.i === i ? "is-hit" : ""}"><b>${c}</b><small>${E.AZ.indexOf(c)}</small><i>${kc || "·"}</i><small>${kc ? E.AZ.indexOf(kc) : "–"}</small></span>`;
        })
        .join("")}</div><p class="wb-legend">Atas: huruf sandi dan nilainya. Bawah: huruf kunci yang diulang. Hasil = (sandi − kunci + 26) mod 26.</p>`;
    }
    if (tool === "rail") {
      const r = st.rails,
        n = letters.length,
        rows = E.railPattern(n, r),
        counts = Array.from({ length: r }, (_, i) => rows.filter((x) => x === i).length);
      let start = 0;
      const ranges = counts.map((c) => {
        const s = start + 1;
        start += c;
        return [s, start];
      });
      return `<div class="wb-rail" style="--cols:${n}">${Array.from({ length: r }, (_, row) =>
        rows.map((x, i) => `<span class="wb-dot ${x === row ? "on" : ""}">${x === row ? i + 1 : ""}</span>`).join(""),
      ).join("")}</div><p class="wb-legend">Angka = urutan huruf pada pesan asli. ${counts
        .map((c, i) => `Rel ${i + 1}: <b>${c}</b> huruf (huruf sandi ke-${ranges[i][0]}–${ranges[i][1]})`)
        .join(" · ")}.</p>`;
    }
    return "";
  }
  function workbench(q) {
    const tools = TOOLS[q.type] || [];
    const tokens = isPairs(q)
      ? q.ciphertext
          .split(" ")
          .map((p, i) => `<button type="button" class="tok" data-i="${i}" data-ch="${p}">${p}</button>`)
          .join("")
      : (() => {
          let i = 0;
          return q.ciphertext
            .split(" ")
            .map((g) => `<span class="tok-group">${g.split("").map((c) => `<button type="button" class="tok" data-i="${i++}" data-ch="${c}">${c}</button>`).join("")}</span>`)
            .join("");
        })();
    const control = {
      caesar: `<div class="wb-control"><label for="wbShift">Geseran</label><input type="range" id="wbShift" min="0" max="25" step="1"><output id="wbShiftOut">0</output></div>`,
      atbash: `<div class="wb-control"><span class="wb-control-label">Pasangan cermin A↔Z</span></div>`,
      poly: `<div class="wb-control"><label for="wbKey">Kata kunci kotak</label><input class="input" id="wbKey" maxlength="25" autocomplete="off" spellcheck="false" placeholder="${q.type === "polybius-plain" ? "Kosongkan untuk kotak polos" : "Ketik kata kunci yang kalian temukan"}"></div>`,
      vig: `<div class="wb-control"><label for="wbVkey">Kata kunci Vigenère</label><input class="input" id="wbVkey" maxlength="25" autocomplete="off" spellcheck="false" placeholder="Ketik kata kunci yang kalian temukan"></div>`,
      rail: `<div class="wb-control"><label for="wbRails">Jumlah rel</label><input type="number" class="input wb-num" id="wbRails" min="2" max="6" step="1"></div>`,
    };
    const titles = { caesar: "Penggeser Caesar", atbash: "Cermin Atbash", poly: "Kotak Polybius", vig: "Pasangan Vigenère", rail: "Pola Rail Fence" };
    return `<section class="workbench" aria-labelledby="wbTitle"><div class="wb-head"><span class="eyebrow">Meja kerja</span><h2 id="wbTitle">Alat bantu ${esc(q.cipher)}</h2><p>Ketuk huruf atau angka di pesan untuk menandainya di alat. Alat ini membantu menyusun dan mencocokkan; kuncinya tetap harus kalian temukan, dan menerjemahkan tetap tugas kalian.</p></div><div class="wb-tokens" id="wbTokens" aria-label="Pesan sandi, ketuk untuk menandai">${tokens}</div>${tools
      .map((t) => `<div class="wb-tool"><h3>${titles[t]}</h3>${control[t]}<div class="wb-out" id="wbOut-${t}" aria-live="polite"></div></div>`)
      .join("")}<div class="wb-tool"><h3><label for="wbNotes">Coretan</label></h3><textarea class="input wb-notes" id="wbNotes" rows="3" maxlength="600" spellcheck="false" placeholder="Tulis hasil sementara di sini. Coretan tersimpan di browser ini."></textarea></div></section>`;
  }
  function bindWorkbench(q) {
    const tools = TOOLS[q.type] || [];
    const saved = wbLoad(q.id);
    const clampInt = (v, lo, hi, d) => {
      const n = parseInt(v, 10);
      return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d;
    };
    const st = {
      shift: clampInt(saved.shift, 0, 25, q.type === "caesar-known" ? 3 : 0),
      key: typeof saved.key === "string" ? saved.key.slice(0, 25) : "",
      vkey: typeof saved.vkey === "string" ? saved.vkey.slice(0, 25) : "",
      rails: clampInt(saved.rails, 2, 6, 2),
    };
    let sel = null;
    const draw = () => {
      tools.forEach((t) => {
        const out = document.getElementById("wbOut-" + t);
        if (out) out.innerHTML = wbRender(t, q, st, sel);
      });
      const so = document.getElementById("wbShiftOut");
      if (so) so.textContent = st.shift;
      if (main.querySelectorAll) main.querySelectorAll(".tok").forEach((b) => b.classList && b.classList.toggle("is-hit", !!sel && String(sel.i) === b.dataset.i));
    };
    const setVal = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.value = v;
    };
    setVal("wbShift", st.shift);
    setVal("wbKey", st.key);
    setVal("wbVkey", st.vkey);
    setVal("wbRails", st.rails);
    setVal("wbNotes", typeof saved.notes === "string" ? saved.notes.slice(0, 600) : "");
    bind("wbShift", "input", (e) => {
      st.shift = clampInt(e.target.value, 0, 25, 0);
      wbSave(q.id, { shift: st.shift });
      draw();
    });
    bind("wbKey", "input", (e) => {
      st.key = e.target.value.slice(0, 25);
      wbSave(q.id, { key: st.key });
      draw();
    });
    bind("wbVkey", "input", (e) => {
      st.vkey = e.target.value.slice(0, 25);
      wbSave(q.id, { vkey: st.vkey });
      draw();
    });
    bind("wbRails", "input", (e) => {
      st.rails = clampInt(e.target.value, 2, 6, 2);
      wbSave(q.id, { rails: st.rails });
      draw();
    });
    bind("wbNotes", "input", (e) => wbSave(q.id, { notes: e.target.value.slice(0, 600) }));
    bind("wbTokens", "click", (e) => {
      const b = e.target && e.target.closest ? e.target.closest(".tok") : null;
      if (!b) return;
      const i = Number(b.dataset.i);
      sel = sel && sel.i === i ? null : { i, ch: b.dataset.ch };
      draw();
    });
    draw();
  }
  function elaraNote(q) {
    const m = q.text.match(/“([^”]+)”\s*$/);
    return m ? m[1] : q.text;
  }
  function puzzle(q) {
    if (!E.isUnlocked(state, q)) {
      map();
      return;
    }
    const used = state.hints[q.id] || 0,
      wrong = state.wrong[q.id] || 0,
      penaltyHint = Math.round(q.points * E.HINT_PENALTY);
    const hintHtml = q.hints
      .slice(0, used)
      .map((h, i) => `<p><b>Petunjuk ${i + 1}.</b> ${esc(h)}</p>`)
      .join("");
    const shards =
      q.final || q.type === "final"
        ? `<div class="lesson-box"><h2>Serpihan yang kalian bawa</h2>${fragmentStrip()}</div>`
        : "";
    show(
      `<div class="puzzle-header"><button class="button ghost" id="backLocation">${icon("back")} Cerita lokasi</button><span class="pill ${q.color}">${icon(q.symbol)} Level ${q.level} · ${esc(q.name)}</span></div><div class="puzzle-layout"><aside class="puzzle-side"><div class="lore-art">${art(q.scene)}</div><div class="puzzle-lore"><span class="eyebrow">Level ${q.number} · ${esc(q.name)}</span><h2>Pesan Elara</h2><blockquote><p>${elaraNote(q)}</p></blockquote><div class="score-card"><span>Poin level ini</span><b id="levelPoints">${fmt(E.levelScore(q, used, wrong))}</b><small>dari ${fmt(q.points)}</small></div></div></aside><section class="puzzle-work" aria-labelledby="puzzleTitle"><div class="location-meta"><span class="pill ${q.color}">Sandi ${q.cipher}</span>${tierDots(q)}</div><h1 id="puzzleTitle">Apa pesan di balik sandi?</h1><p class="secondary">Buka catatan cara membaca jika ini pertama kalinya kalian menjumpai sandi ${q.cipher}.</p><div class="cipher-box"><div class="cipher-label">PESAN YANG DITEMUKAN</div><div class="cipher-code" aria-label="Pesan sandi ${q.ciphertext}">${q.ciphertext}</div><p class="cipher-clue">“${q.clue}”</p></div>${shards}${workbench(q)}<form id="answerForm" class="answer-form"><label for="answer">Pesan yang kalian temukan</label><div class="answer-row"><input class="input" id="answer" autocomplete="off" spellcheck="false" maxlength="80" aria-describedby="answerHelp answerFeedback" placeholder="Tulis seluruh pesan"><button class="button" type="submit">Buka kunci ${icon("key")}</button></div><p class="helper-text" id="answerHelp">Spasi, tanda baca, dan huruf besar/kecil diabaikan. Jawaban salah −${E.WRONG_PENALTY} poin.</p><p class="feedback" id="answerFeedback" role="alert"></p></form><div class="hint-row"><button class="text-button" id="hintButton" ${used >= q.hints.length ? "disabled" : ""}>${used >= q.hints.length ? "Semua petunjuk terbuka" : used ? "Petunjuk berikutnya" : "Butuh petunjuk?"} (−${penaltyHint} poin)</button><span id="hintCount">${used} dari ${q.hints.length} petunjuk</span></div><div id="hintBox" class="hint-box" role="status" ${used ? "" : "hidden"}>${hintHtml}</div><details class="guide"><summary>Cara membaca sandi ${q.cipher}</summary>${guide(q)}</details></section></div>`,
      "puzzle",
    );
    bind("backLocation", "click", () => visit(q.id));
    bindWorkbench(q);
    const refreshPoints = () => {
      const el = document.getElementById("levelPoints");
      if (el) el.textContent = fmt(E.levelScore(q, state.hints[q.id] || 0, state.wrong[q.id] || 0));
    };
    bind("answerForm", "submit", (event) => {
      event.preventDefault();
      const input = document.getElementById("answer"),
        value = E.normalize(input.value);
      if (!value) {
        document.getElementById("answerFeedback").textContent = "Tulis pesannya terlebih dahulu.";
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }
      if (E.checkAnswer(q, value)) {
        state.answers[q.id] = value;
        if (!state.solved.includes(q.id)) state.solved.push(q.id);
        state.scores[q.id] = E.levelScore(q, state.hints[q.id] || 0, state.wrong[q.id] || 0);
        if (q.final) {
          state.finished = true;
          state.finishedAt = Date.now();
        }
        save();
        sync();
        document.getElementById("announcement").textContent = `${q.name} selesai. ${state.scores[q.id]} poin.`;
        q.final ? finalStory() : reward(q);
      } else {
        state.wrong[q.id] = (state.wrong[q.id] || 0) + 1;
        save();
        refreshPoints();
        document.getElementById("answerFeedback").textContent =
          `Belum tepat (−${E.WRONG_PENALTY} poin). Periksa lagi kunci dan setiap hurufnya, atau buka petunjuk.`;
        input.setAttribute("aria-invalid", "true");
        input.focus();
      }
    });
    bind("answer", "input", () => {
      document.getElementById("answer").removeAttribute("aria-invalid");
      document.getElementById("answerFeedback").textContent = "";
    });
    bind("hintButton", "click", () => {
      const n = state.hints[q.id] || 0;
      if (n >= q.hints.length) return;
      state.hints[q.id] = n + 1;
      save();
      const box = document.getElementById("hintBox");
      box.hidden = false;
      box.innerHTML = q.hints
        .slice(0, n + 1)
        .map((h, i) => `<p><b>Petunjuk ${i + 1}.</b> ${esc(h)}</p>`)
        .join("");
      document.getElementById("hintCount").textContent = `${n + 1} dari ${q.hints.length} petunjuk`;
      const button = document.getElementById("hintButton");
      const last = n + 1 >= q.hints.length;
      button.textContent = `${last ? "Semua petunjuk terbuka" : "Petunjuk berikutnya"} (−${penaltyHint} poin)`;
      button.disabled = last;
      refreshPoints();
    });
  }
  function reward(q) {
    const n = state.solved.length,
      secret = E.openSecret(q, state.answers[q.id]) || {},
      next = quests[q.level];
    show(
      `<article class="reward-shell"><div class="reward-hero"><div class="ring-art">${art(q.scene)}</div><div class="ring-badge" aria-hidden="true"><b>${n}/${TOTAL}</b><span>level</span></div><div class="key-medallion">${icon(q.symbol)}</div></div><div class="reward-copy"><span class="script">Level ${q.level} terpecahkan</span><h1>${q.key}</h1><div class="story-text"><p>${q.reward}</p></div><div class="actions"><span class="pill ${q.color}">${icon("check")} +${fmt(state.scores[q.id])} poin</span><span class="pill">${fmt(E.totalScore(state))} poin total</span></div>${secret.fragment ? `<div class="fragment-reveal"><span class="eyebrow">Serpihan ${q.fragment} dari 4 ditemukan</span><div class="fragment-stone">${esc(secret.fragment)}</div><p>Simpan serpihan ini. Di Ruang Fajar, keempat serpihan disatukan sesuai nomornya.</p></div>` : ""}<div class="lesson-box"><h2>Yang kalian pelajari · ${q.cipher}</h2><p>${esc(secret.lesson || "")}</p></div><div class="actions"><button class="button" id="continueMap">${next && E.isUnlocked(state, next) && !state.solved.includes(next.id) ? `Lanjut ke level ${next.level}` : "Kembali ke peta"} ${icon("arrow")}</button><button class="text-button" id="toMap">Peta</button></div></div></article>`,
      "reward",
    );
    bind("continueMap", "click", () => (next && E.isUnlocked(state, next) && !state.solved.includes(next.id) ? visit(next.id) : map()));
    bind("toMap", "click", map);
  }
  function finalStory() {
    const finalQ = quests[TOTAL - 1];
    if (!state.solved.includes(finalQ.id)) {
      map();
      return;
    }
    const secret = E.openSecret(finalQ, state.answers[finalQ.id]) || {};
    show(
      `<div class="reading-bar"><button class="button ghost" id="finalBack">${icon("back")} Peta perjalanan</button><span class="eyebrow">BAB II / RUANG FAJAR</span></div><article class="book"><div class="book-art">${art("sky", "“Cahaya tidak pernah benar-benar hilang.<br>Ia hanya menunggu untuk ditemukan.”")}<span class="page-badge" aria-hidden="true"><b>10</b><span>level</span></span></div><div class="book-copy"><span class="eyebrow">Empat serpihan, satu pintu · +${fmt(state.scores[finalQ.id])} poin</span><h1>Di sini, semua jalan bertemu.</h1><div class="story-text"><p>${finalQ.reward}</p><p>Di tengah ruangan berdiri <b>Lentera Aksara</b>. Cahayanya hampir padam, tetapi di dalamnya masih bergerak huruf-huruf kecil, seperti kunang-kunang.</p><p>Di alasnya terukir pesan terakhir Elara:</p><p class="quote">“Kota hidup selama seseorang masih mau menjaga ceritanya. Kini, giliran kalian.”</p></div><div class="lesson-box"><h2>Yang kalian pelajari · ${finalQ.cipher}</h2><p>${esc(secret.lesson || "")}</p></div><div class="book-controls"><small>Lentera telah ditemukan.</small><button class="button" id="lightLantern">Nyalakan lentera ${icon("sun")}</button></div></div></article>`,
      "final",
    );
    bind("finalBack", "click", map);
    bind("lightLantern", "click", ending);
  }
  function ending() {
    if (!state.finished) {
      map();
      return;
    }
    show(
      `<article class="reward-shell ending"><div class="reward-hero"><div class="ring-art">${art("city")}</div><div class="ring-badge" aria-hidden="true"><b>${TOTAL}/${TOTAL}</b><span>level</span></div><div class="key-medallion">${icon("sun")}</div></div><div class="reward-copy"><span class="eyebrow">Epilog</span><span class="script">Cahaya yang pulang</span><h1>Kalian membawa fajar,<br>${team()}.</h1><div class="story-text"><p>Cahaya Lentera Aksara mengalir melewati gang-gang kota. Kabut terangkat, huruf-huruf kembali ke halaman, dan nama-nama yang sempat terlupa terdengar lagi di setiap rumah.</p><p class="quote">“Sekarang kalian tahu,” kata Elara, “membaca sandi bukan sekadar menemukan kata. Kadang, itu berarti menemukan jalan pulang.”</p></div><div class="end-rule"></div><div class="final-stats"><div><span>Skor akhir</span><b>${fmt(E.totalScore(state))}</b><small>dari ${fmt(E.MAX_SCORE)}</small></div><div><span>Waktu</span><b>${clock(elapsed())}</b><small>sejak mendaftar</small></div><div><span>Petunjuk</span><b>${Object.values(state.hints).reduce((a, b) => a + b, 0)}</b><small>dibuka</small></div></div><div class="ending-keys">${[...new Set(quests.map((q) => q.cipher.split(" + ")).flat())].map((c) => `<span class="pill">${esc(c)}</span>`).join("")}</div><div class="actions"><button class="button" id="endBoard">${icon("trophy")} Lihat papan skor</button><button class="button secondary-button" id="endMap">Peta</button><button class="text-button" id="endReset">Main lagi</button></div></div></article>`,
      "ending",
    );
    bind("endBoard", "click", leaderboard);
    bind("endMap", "click", map);
    bind("endReset", "click", askReset);
  }

  // ---------- papan skor ----------
  function leaderboard() {
    show(
      `<section class="board"><div class="map-head"><div><span class="eyebrow">Papan skor</span><span class="script">Siapa yang membawa cahaya?</span><h1>Peringkat kelompok</h1><p>Urutan berdasarkan skor, lalu jumlah level, lalu waktu tercepat. ${board.online ? "Diperbarui otomatis setiap 10 detik." : "<b>Mode lokal:</b> hanya kelompok yang bermain di browser ini yang tercatat. Isi <code>firebase-config.js</code> untuk papan skor bersama."}</p></div><div class="progress-box"><span>Skor kalian</span><b class="board-own">${state.team ? fmt(E.totalScore(state)) : "–"}</b><button class="text-button" id="refreshBoard">Muat ulang</button></div></div><div id="boardBody" class="board-card" aria-live="polite"><p class="secondary">Memuat papan skor…</p></div><div class="actions board-actions"><button class="button" id="boardBack">${icon("back")} ${state.introDone ? "Kembali ke peta" : "Kembali"}</button></div></section>`,
      "board",
    );
    const render = (rows) => {
      const body = document.getElementById("boardBody");
      if (!body) return;
      if (!rows.length) {
        body.innerHTML = `<p class="secondary">Belum ada kelompok yang tercatat.</p>`;
        return;
      }
      body.innerHTML = `<table class="board-table"><thead><tr><th scope="col">#</th><th scope="col">Kelompok</th><th scope="col">Level</th><th scope="col">Skor</th><th scope="col">Waktu</th><th scope="col">Status</th></tr></thead><tbody>${E.rankBoard(rows)
        .map(
          (r, i) =>
            `<tr class="${r.id === state.teamId ? "own" : ""} ${i < 3 ? "top top-" + (i + 1) : ""}"><td><span class="rank">${i + 1}</span></td><td><b>${esc(r.team || "Tanpa nama")}</b>${r.id === state.teamId ? ' <span class="pill gold">kalian</span>' : ""}</td><td>${Math.min(TOTAL, Number(r.solved) || 0)}/${TOTAL}</td><td><b>${fmt(r.score)}</b></td><td>${clock(r.elapsedMs)}</td><td>${r.finished ? '<span class="pill green">Selesai</span>' : '<span class="pill">Bermain</span>'}</td></tr>`,
        )
        .join("")}</tbody></table>${syncError ? `<p class="feedback">${esc(syncError)}</p>` : ""}`;
    };
    const load = () =>
      (state.teamId ? sync() : Promise.resolve())
        .then(() => board.list())
        .then(render)
        .catch((err) => {
          const body = document.getElementById("boardBody");
          if (body) body.innerHTML = `<p class="feedback">Papan skor gagal dimuat: ${esc(err.message || err)}. Periksa koneksi internet atau konfigurasi Firebase.</p>`;
        });
    load();
    boardTimer = setInterval(load, 10000);
    bind("refreshBoard", "click", load);
    bind("boardBack", "click", () => (state.introDone ? map() : cover()));
  }

  // ---------- jurnal & reset ----------
  function openJournal() {
    document.getElementById("journalIntro").textContent = state.team
      ? `Kelompok: ${state.team} · ${state.solved.length} dari ${TOTAL} level · ${fmt(E.totalScore(state))} poin.`
      : "Belum ada kelompok terdaftar.";
    document.getElementById("journalKeys").innerHTML =
      `<div class="journal-shards"><h3>Serpihan batu</h3>${fragmentStrip()}</div>` +
      quests
        .map((q) => {
          const done = state.solved.includes(q.id),
            open = E.isUnlocked(state, q);
          return `<div class="journal-key ${done ? "" : "missing"}"><div class="key-icon">${icon(done ? q.symbol : "lock")}</div><div><h3>${q.number} · ${open ? esc(q.name) : "Lokasi tersembunyi"}</h3><p>${open ? q.cipher : "Belum terbuka"}${done ? ` · ${fmt(state.scores[q.id])} poin` : ""}</p></div><span class="pill ${done ? "green" : ""}">${done ? "Selesai" : open ? "Terbuka" : "Terkunci"}</span></div>`;
        })
        .join("");
    document.getElementById("saveNote").textContent = storageWorks
      ? "Perjalanan disimpan otomatis di browser ini."
      : "Penyimpanan tidak tersedia. Progres hanya berlaku selama sesi ini.";
    document.getElementById("journal").showModal();
  }
  function askReset() {
    document.getElementById("resetDialog").showModal();
  }
  bind("brandHome", "click", (event) => {
    event.preventDefault();
    cover();
  });
  bind("mapNav", "click", map);
  bind("boardNav", "click", leaderboard);
  bind("journalNav", "click", openJournal);
  bind("closeJournal", "click", () => document.getElementById("journal").close());
  bind("cancelReset", "click", () => document.getElementById("resetDialog").close());
  bind("cancelResetX", "click", () => document.getElementById("resetDialog").close());
  bind("confirmReset", "click", () => {
    state = E.validateState(null);
    hasSave = false;
    try {
      localStorage.removeItem(STORE);
      localStorage.removeItem(WB_KEY);
    } catch {}
    document.getElementById("resetDialog").close();
    cover();
  });
  if (state.teamId) sync();
  cover();
})();
