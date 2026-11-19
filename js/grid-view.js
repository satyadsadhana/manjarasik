// Render kotak Polybius 5x5 dengan label baris/kolom.
(function (root) {
  function renderGrid(el, grid, opts = {}) {
    const hidden = opts.hidden || [];
    const keyLen = opts.keyLen || 0;
    const wrap = document.createElement('div');
    wrap.className = 'pgrid' + (opts.size ? ' pgrid--' + opts.size : '');
    wrap.setAttribute('role', 'grid');
    wrap.setAttribute('aria-label', 'Kotak Polybius 5 kali 5');

    const corner = document.createElement('span');
    corner.className = 'pgrid__axis';
    wrap.appendChild(corner);
    for (let c = 1; c <= 5; c++) {
      const a = document.createElement('span');
      a.className = 'pgrid__axis pgrid__axis--col';
      a.dataset.col = c;
      a.textContent = c;
      wrap.appendChild(a);
    }
    for (let r = 1; r <= 5; r++) {
      const a = document.createElement('span');
      a.className = 'pgrid__axis';
      a.dataset.row = r;
      a.textContent = r;
      wrap.appendChild(a);
      for (let c = 1; c <= 5; c++) {
        const i = (r - 1) * 5 + (c - 1);
        const cell = document.createElement('span');
        cell.className = 'cell';
        cell.dataset.index = i;
        if (i < keyLen) cell.classList.add('is-key');
        if (hidden[i]) {
          // Huruf asli tidak ditaruh di DOM supaya tidak bisa diseleksi/disalin.
          cell.classList.add('is-hidden');
          cell.setAttribute('aria-label', 'tertutup');
        } else {
          cell.textContent = grid[i];
        }
        wrap.appendChild(cell);
      }
    }
    el.replaceChildren(wrap);
  }

  function highlight(el, indices, activeIndex) {
    const used = new Set(indices || []);
    el.querySelectorAll('.cell').forEach((cell) => {
      const i = Number(cell.dataset.index);
      cell.classList.toggle('is-used', used.has(i));
      const isActive = i === activeIndex;
      if (isActive) {
        cell.classList.remove('is-active');
        void cell.offsetWidth; // ulang animasi pop
      }
      cell.classList.toggle('is-active', isActive);
    });
    const hasActive = typeof activeIndex === 'number' && activeIndex >= 0;
    const row = hasActive ? Math.floor(activeIndex / 5) + 1 : -1;
    const col = hasActive ? (activeIndex % 5) + 1 : -1;
    el.querySelectorAll('.pgrid__axis').forEach((a) => {
      a.classList.toggle('is-hit', Number(a.dataset.row) === row || Number(a.dataset.col) === col);
    });
  }

  function reveal(el, indices, grid) {
    for (const i of indices) {
      const cell = el.querySelector(`.cell[data-index="${i}"]`);
      if (cell && cell.classList.contains('is-hidden')) {
        cell.textContent = grid[i];
        cell.classList.remove('is-hidden');
        cell.removeAttribute('aria-label');
        cell.classList.add('is-revealed');
      }
    }
  }

  root.GridView = { renderGrid, highlight, reveal };
})(window);
