// Game "Tebak Pesan": satu laptop, pemain bergantian.
(function (root) {
  const $ = (id) => document.getElementById(id);
  const G = () => root.GameCore;
  const reduceMotion = () => root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CONFETTI_COLORS = ['#FFC94A', '#0F9D8A', '#F2643D', '#4CB5F5', '#FFF8EC'];

  let state = null;
  let timer = null;
  const usedIds = [];
  let lastName = '';
  let lastLevel = 'mudah';

  function customPuzzles() {
    const list = Store.loadJSON(Store.KEYS.puzzles, []);
    return Array.isArray(list) ? list.filter((p) => p && p.plaintext && G().LEVELS[p.level]) : [];
  }
  const allPuzzles = () => G().DEFAULT_PUZZLES.concat(customPuzzles());

  function show(id) {
    for (const s of ['gStart', 'gPlay', 'gResult']) $(s).hidden = s !== id;
    const card = document.querySelector('.game');
    const top = card.getBoundingClientRect().top;
    if (top < 60 || top > root.innerHeight * 0.6) {
      card.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }
  const elapsed = () => Math.floor((Date.now() - state.startedAt) / 1000);

  // ---------- Start ----------
  function selectedLevel() {
    const r = document.querySelector('input[name="level"]:checked');
    return r ? r.value : 'mudah';
  }
  function refreshGo() {
    $('gGo').disabled = !G().normalizeName($('gName').value);
  }

  function startRound(name, level) {
    const puzzle = G().pickPuzzle(allPuzzles(), level, usedIds);
    if (!puzzle) return;
    usedIds.push(puzzle.id);
    lastName = name;
    lastLevel = level;
    const key = Polybius.cleanKeyword(puzzle.keyword);
    const grid = Polybius.buildGrid(key);
    const open = level === 'mudah';
    state = {
      name, level, puzzle, key, grid,
      hidden: grid.map(() => !open),
      keyShown: 0, rowsShown: open ? 5 : 0, firstShown: false,
      hintCost: 0, wrong: 0, startedAt: Date.now(), done: false,
    };

    $('gWho').textContent = name;
    $('gLvl').textContent = G().LEVELS[level].label;
    renderCipher();
    GridView.renderGrid($('gGrid'), grid, { size: 'lg', hidden: state.hidden });
    $('gGridNote').textContent = open
      ? 'Kotak standar, tanpa kata kunci.'
      : 'Kotak tersusun dari kata kunci rahasia. Beli petunjuk untuk membukanya.';
    $('gGuess').value = '';
    $('gForm').classList.remove('is-wrong');
    $('gFeedback').textContent = '';
    $('gFeedback').className = 'feedback';
    renderKeyInfo();
    refreshHints();
    tick();
    clearInterval(timer);
    timer = setInterval(tick, 250);
    show('gPlay');
    setTimeout(() => $('gGuess').focus({ preventScroll: true }), 60);
  }

  // ---------- Play ----------
  function renderCipher() {
    const code = Polybius.encrypt(state.puzzle.plaintext, state.key);
    const el = $('gCipher');
    el.replaceChildren();
    code.split(' / ').forEach((word, wi) => {
      if (wi > 0) el.append(' / ');
      word.split(' ').forEach((tok, ti) => {
        if (ti > 0) el.append(' ');
        const s = document.createElement('span');
        s.textContent = tok;
        if (ti === 0) s.dataset.first = '1';
        el.appendChild(s);
      });
    });
  }

  function renderKeyInfo() {
    const el = $('gKeyInfo');
    el.replaceChildren();
    const { level, key, keyShown } = state;
    if (level === 'mudah') {
      el.textContent = 'Level mudah: baca koordinatnya di kotak.';
    } else {
      el.append(level === 'sedang' ? `Kata kunci: ${key.length} huruf` : 'Kata kunci: rahasia');
      const slots = document.createElement('span');
      slots.className = 'keyslots';
      const count = level === 'sedang' ? key.length : keyShown;
      for (let i = 0; i < count; i++) {
        const s = document.createElement('i');
        if (i < keyShown) { s.textContent = key[i]; s.className = 'on'; } else s.textContent = '·';
        slots.appendChild(s);
      }
      if (level === 'sulit' && keyShown > 0 && keyShown < key.length) {
        const more = document.createElement('i');
        more.textContent = '…';
        slots.appendChild(more);
      }
      if (count) el.appendChild(slots);
    }
    if (state.firstShown) {
      const firsts = state.puzzle.plaintext.trim().split(/\s+/)
        .map((w) => (w.match(/[A-Za-z]/) || ['?'])[0].toUpperCase().replace('J', 'I'));
      const line = document.createElement('span');
      line.style.display = 'block';
      line.textContent = 'Huruf pertama tiap kata: ' + firsts.join(' · ');
      el.appendChild(line);
    }
  }

  function refreshHints() {
    const s = state;
    const locked = s.done;
    $('hKey').disabled = locked || s.level === 'mudah' || s.keyShown >= s.key.length;
    $('hRow').disabled = locked || s.rowsShown >= 5 || !s.hidden.some(Boolean);
    $('hFirst').disabled = locked || s.firstShown;
  }

  function buyHint(kind) {
    if (!state || state.done) return;
    const s = state;
    if (kind === 'keyLetter') {
      if (s.level === 'mudah' || s.keyShown >= s.key.length) return;
      const i = s.keyShown++;
      s.hidden[i] = false;
      GridView.reveal($('gGrid'), [i], s.grid);
    } else if (kind === 'gridRow') {
      const row = [0, 1, 2, 3, 4].find((r) => s.hidden.slice(r * 5, r * 5 + 5).some(Boolean));
      if (row === undefined) return;
      const idx = [0, 1, 2, 3, 4].map((c) => row * 5 + c);
      idx.forEach((i) => { s.hidden[i] = false; });
      s.rowsShown++;
      // Sel yang terbuka selalu awalan kotak; huruf kunci di dalamnya ikut terbuka.
      s.keyShown = Math.max(s.keyShown, Math.min(s.key.length, (row + 1) * 5));
      GridView.reveal($('gGrid'), idx, s.grid);
    } else if (kind === 'firstLetters') {
      if (s.firstShown) return;
      s.firstShown = true;
      $('gCipher').querySelectorAll('[data-first]').forEach((el) => el.classList.add('first'));
    } else return;
    s.hintCost += G().HINTS[kind];
    if (!s.hidden.some(Boolean)) s.rowsShown = 5;
    renderKeyInfo();
    refreshHints();
    tick();
  }

  function tick() {
    if (!state || state.done) return;
    const sec = elapsed();
    $('gTime').textContent = fmtTime(sec);
    $('gScore').textContent = G().scoreRound({ level: state.level, seconds: sec, wrong: state.wrong, hintCost: state.hintCost, solved: true });
  }

  function onGuess(e) {
    e.preventDefault();
    if (!state || state.done) return;
    const input = $('gGuess');
    const fb = $('gFeedback');
    if (!input.value.trim()) { fb.textContent = 'Ketik tebakanmu dulu.'; fb.className = 'feedback is-bad'; return; }
    if (G().isCorrectGuess(input.value, state.puzzle.plaintext)) {
      finish(true);
    } else {
      state.wrong++;
      fb.textContent = `Belum tepat. −${G().PER_WRONG} poin, coba lagi!`;
      fb.className = 'feedback is-bad';
      const form = $('gForm');
      form.classList.remove('is-wrong');
      void form.offsetWidth;
      form.classList.add('is-wrong');
      input.select();
      tick();
    }
  }

  // ---------- Result ----------
  function finish(solved) {
    if (!state || state.done) return;
    state.done = true;
    clearInterval(timer);
    const seconds = elapsed();
    const score = G().scoreRound({ level: state.level, seconds, wrong: state.wrong, hintCost: state.hintCost, solved });
    const entries = Store.loadJSON(Store.KEYS.entries, []);
    const list = Array.isArray(entries) ? entries : [];
    list.push({ name: state.name, score, level: state.level, seconds, solved, date: new Date().toISOString() });
    const saved = Store.saveJSON(Store.KEYS.entries, list);
    document.dispatchEvent(new CustomEvent('kr:entry-added'));

    const badge = $('rBadge');
    badge.textContent = solved ? 'Terpecahkan!' : 'Menyerah';
    badge.classList.toggle('is-lose', !solved);
    $('rScore').textContent = score;
    $('rAnswer').textContent = state.puzzle.plaintext.toUpperCase();

    const base = G().LEVELS[state.level].base;
    const rows = solved
      ? [
          ['Skor dasar ' + G().LEVELS[state.level].label, '+' + base],
          ['Waktu ' + fmtTime(seconds), '−' + G().PER_SECOND * seconds],
          ['Tebakan salah ×' + state.wrong, '−' + G().PER_WRONG * state.wrong],
          ['Petunjuk', '−' + state.hintCost],
        ]
      : [['Menyerah', '0']];
    const ul = $('rBreak');
    ul.replaceChildren();
    for (const [a, b] of rows) {
      const li = document.createElement('li');
      li.innerHTML = '<span></span><span></span>';
      li.children[0].textContent = a;
      li.children[1].textContent = b;
      ul.appendChild(li);
    }
    const total = document.createElement('li');
    total.className = 'total';
    total.innerHTML = '<span>Total</span><span></span>';
    total.children[1].textContent = score + (solved && score === G().MIN_SCORE ? ' (minimum)' : '');
    ul.appendChild(total);

    const board = G().aggregate(list);
    const pos = board.findIndex((r) => r.name.toLowerCase() === state.name.toLowerCase());
    $('rRank').textContent = !saved
      ? 'Skor tidak bisa disimpan di browser ini.'
      : pos >= 0
        ? `${state.name} sekarang peringkat #${pos + 1} di papan skor.`
        : `${state.name} belum masuk 10 besar. Ayo lagi!`;

    show('gResult');
    if (solved) confetti();
  }

  function confetti() {
    if (reduceMotion()) return;
    const host = $('confetti');
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 70; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      p.style.setProperty('--x', (Math.random() * 30 - 15) + 'vw');
      p.style.setProperty('--r', (Math.random() * 900 - 450) + 'deg');
      p.style.setProperty('--d', (1.4 + Math.random() * 1.4) + 's');
      p.style.animationDelay = Math.random() * 0.25 + 's';
      if (i % 3 === 0) p.style.borderRadius = '50%';
      frag.appendChild(p);
    }
    host.appendChild(frag);
    setTimeout(() => host.replaceChildren(), 3400);
  }

  // ---------- Host panel ----------
  function renderHostList() {
    const ul = $('hostList');
    ul.replaceChildren();
    const list = customPuzzles();
    if (!list.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'Belum ada soal buatan.';
      ul.appendChild(li);
      return;
    }
    for (const p of list) {
      const li = document.createElement('li');
      const txt = document.createElement('span');
      txt.className = 'mono';
      txt.textContent = p.plaintext.toUpperCase();
      const meta = document.createElement('small');
      meta.textContent = `${G().LEVELS[p.level].label} · kunci ${p.keyword ? p.keyword.toUpperCase() : 'standar'}`;
      const del = document.createElement('button');
      del.type = 'button';
      del.textContent = 'Hapus';
      del.setAttribute('aria-label', 'Hapus soal ' + p.plaintext);
      del.addEventListener('click', () => {
        Store.saveJSON(Store.KEYS.puzzles, customPuzzles().filter((q) => q.id !== p.id));
        renderHostList();
      });
      li.append(txt, meta, del);
      ul.appendChild(li);
    }
  }

  function onHostSubmit(e) {
    e.preventDefault();
    const plain = $('hPlain').value.replace(/\s+/g, ' ').trim();
    const keyword = $('hKeyIn').value.trim();
    const level = $('hLevel').value;
    const err = $('hostErr');
    err.hidden = true;
    if (!/[A-Za-z]/.test(plain)) { err.textContent = 'Pesan harus berisi minimal satu huruf.'; err.hidden = false; return; }
    if (level !== 'mudah' && !Polybius.cleanKeyword(keyword)) {
      err.textContent = 'Level sedang/sulit butuh kata kunci (minimal satu huruf).'; err.hidden = false; return;
    }
    const list = customPuzzles();
    list.push({ id: 'c' + Date.now().toString(36), plaintext: plain.toUpperCase(), keyword: level === 'mudah' ? '' : keyword, level });
    if (!Store.saveJSON(Store.KEYS.puzzles, list)) { err.textContent = 'Gagal menyimpan: penyimpanan browser diblokir.'; err.hidden = false; return; }
    $('hPlain').value = '';
    $('hKeyIn').value = '';
    renderHostList();
    $('hPlain').focus();
  }

  function init() {
    $('gName').addEventListener('input', refreshGo);
    $('gName').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !$('gGo').disabled) $('gGo').click(); });
    $('gGo').addEventListener('click', () => {
      const name = G().normalizeName($('gName').value);
      if (!name) return;
      startRound(name, selectedLevel());
    });
    $('gForm').addEventListener('submit', onGuess);
    $('hKey').addEventListener('click', () => buyHint('keyLetter'));
    $('hRow').addEventListener('click', () => buyHint('gridRow'));
    $('hFirst').addEventListener('click', () => buyHint('firstLetters'));
    $('gGiveUp').addEventListener('click', () => {
      if (state && !state.done && root.confirm('Yakin menyerah? Skor giliran ini jadi 0.')) finish(false);
    });
    $('rNext').addEventListener('click', () => {
      $('gName').value = '';
      refreshGo();
      show('gStart');
      $('gName').focus({ preventScroll: true });
    });
    $('rAgain').addEventListener('click', () => startRound(lastName, lastLevel));

    const dlg = $('hostDlg');
    $('gHostOpen').addEventListener('click', () => {
      renderHostList();
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    });
    $('hostForm').addEventListener('submit', onHostSubmit);
    document.addEventListener('visibilitychange', tick);
    refreshGo();
  }

  root.Game = { init };
})(window);
