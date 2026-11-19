// Hero: kotak yang "mengetik" contoh pesan, plus contoh di Cara Kerja.
(function (root) {
  const MESSAGE = 'HALO DUNIA';
  const reduceMotion = () => root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initHero() {
    const host = document.getElementById('heroGrid');
    const plainEl = document.getElementById('heroPlain');
    const codeEl = document.getElementById('heroCode');
    if (!host) return;
    const grid = Polybius.buildGrid('');
    GridView.renderGrid(host, grid, { size: 'lg' });

    if (reduceMotion()) {
      codeEl.textContent = Polybius.encrypt(MESSAGE, '');
      GridView.highlight(host, Polybius.trace(MESSAGE, ''));
      return;
    }

    let step = 0;
    let used = [];
    const tick = () => {
      if (step === 0) { used = []; codeEl.textContent = ''; }
      if (step >= MESSAGE.length) {
        step = 0;
        setTimeout(tick, 2200);
        return;
      }
      const ch = MESSAGE[step];
      plainEl.innerHTML = '';
      for (let i = 0; i < MESSAGE.length; i++) {
        const s = document.createElement('span');
        s.textContent = MESSAGE[i];
        if (i === step && ch !== ' ') s.className = 'typed';
        plainEl.appendChild(s);
      }
      if (ch === ' ') {
        codeEl.textContent += ' /';
      } else {
        const idx = grid.indexOf(ch);
        used.push(idx);
        const pos = Polybius.locate(ch, grid);
        codeEl.textContent += (codeEl.textContent ? ' ' : '') + pos.row + pos.col;
        GridView.highlight(host, used, idx);
      }
      step++;
      setTimeout(tick, ch === ' ' ? 350 : 620);
    };
    setTimeout(tick, 600);
  }

  function initSteps() {
    const host = document.getElementById('stepGrid');
    if (!host) return;
    const grid = Polybius.buildGrid('UNAIR');
    GridView.renderGrid(host, grid, { size: 'sm', keyLen: Polybius.cleanKeyword('UNAIR').length });
    GridView.highlight(host, [], grid.indexOf('H'));
  }

  root.Hero = { init() { initHero(); initSteps(); } };
})(window);
