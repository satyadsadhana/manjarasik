// Lab: enkripsi / dekripsi live dengan kotak yang menyala.
(function (root) {
  const $ = (id) => document.getElementById(id);

  function init() {
    const seg = document.querySelector('.seg');
    const key = $('labKey');
    const input = $('labIn');
    const out = $('labOut');
    const err = $('labErr');
    const gridHost = $('labGrid');
    const inLabel = $('labInLabel');
    const outLabel = $('labOutLabel');
    const toast = $('labToast');
    let mode = 'enc';
    let lastResult = '';
    let lastKey = null;
    let toastTimer;

    function setEmpty(text) {
      out.innerHTML = '';
      const s = document.createElement('span');
      s.className = 'result__empty';
      s.textContent = text;
      out.appendChild(s);
      lastResult = '';
    }

    function renderGridIfNeeded() {
      const k = Polybius.cleanKeyword(key.value);
      if (k === lastKey) return;
      lastKey = k;
      GridView.renderGrid(gridHost, Polybius.buildGrid(k), { size: 'lg', keyLen: k.length });
    }

    function update() {
      renderGridIfNeeded();
      const text = input.value;
      err.hidden = true;
      if (!text.trim()) {
        setEmpty('Hasilnya muncul di sini.');
        GridView.highlight(gridHost, []);
        return;
      }
      if (mode === 'enc') {
        lastResult = Polybius.encrypt(text, key.value);
        out.textContent = lastResult || '—';
        const t = Polybius.trace(text, key.value);
        GridView.highlight(gridHost, t, t[t.length - 1]);
      } else {
        const res = Polybius.decrypt(text, key.value);
        if (res.ok) {
          lastResult = res.text;
          out.textContent = res.text || '—';
          const t = Polybius.trace(res.text, key.value);
          GridView.highlight(gridHost, t, t[t.length - 1]);
        } else {
          err.textContent = res.error;
          err.hidden = false;
          setEmpty('Perbaiki sandinya dulu, ya.');
          GridView.highlight(gridHost, []);
        }
      }
    }

    function setMode(next) {
      mode = next;
      seg.dataset.mode = next;
      seg.querySelectorAll('.seg__btn').forEach((b) => {
        const on = b.dataset.mode === next;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-selected', String(on));
      });
      if (next === 'enc') {
        inLabel.textContent = 'Pesan asli';
        outLabel.textContent = 'Pesan rahasia';
        input.placeholder = 'Ketik pesanmu di sini...';
      } else {
        inLabel.textContent = 'Pesan rahasia (angka)';
        outLabel.textContent = 'Pesan asli';
        input.placeholder = 'mis. 23 11 31 34 / 14 45 33 24 11';
      }
      update();
    }

    function flash(msg) {
      toast.textContent = msg;
      toast.classList.add('is-on');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('is-on'), 1600);
    }

    async function copy() {
      if (!lastResult) { flash('Belum ada hasil.'); return; }
      try {
        await navigator.clipboard.writeText(lastResult);
        flash('Tersalin!');
      } catch (e) {
        const range = document.createRange();
        range.selectNodeContents(out);
        const sel = root.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        flash('Tekan Ctrl+C untuk menyalin.');
      }
    }

    function swap() {
      if (!lastResult) { flash('Belum ada hasil.'); return; }
      const result = lastResult;
      input.value = result;
      setMode(mode === 'enc' ? 'dec' : 'enc');
      input.focus();
    }

    seg.addEventListener('click', (e) => {
      const b = e.target.closest('.seg__btn');
      if (b && b.dataset.mode !== mode) setMode(b.dataset.mode);
    });
    seg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        setMode(mode === 'enc' ? 'dec' : 'enc');
        seg.querySelector('.seg__btn.is-on').focus();
      }
    });
    key.addEventListener('input', update);
    input.addEventListener('input', update);
    $('labCopy').addEventListener('click', copy);
    $('labSwap').addEventListener('click', swap);
    update();
  }

  root.Lab = { init };
})(window);
