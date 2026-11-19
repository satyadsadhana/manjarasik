// Papan skor: podium 3 besar + peringkat 4–10.
(function (root) {
  const $ = (id) => document.getElementById(id);

  function render() {
    const entries = Store.loadJSON(Store.KEYS.entries, []);
    const board = GameCore.aggregate(Array.isArray(entries) ? entries : []);
    const podium = $('lbPodium');
    const list = $('lbList');
    const empty = $('lbEmpty');
    podium.replaceChildren();
    list.replaceChildren();

    if (!board.length) {
      podium.hidden = true;
      list.hidden = true;
      empty.hidden = false;
      $('lbReset').hidden = true;
      const host = $('lbEmptyGrid');
      if (!host.firstChild) GridView.renderGrid(host, Polybius.buildGrid(''), { size: 'sm' });
      return;
    }
    podium.hidden = false;
    empty.hidden = true;
    $('lbReset').hidden = false;

    for (let i = 0; i < 3; i++) {
      const row = board[i];
      const col = document.createElement('div');
      col.className = `podium__col podium__col--${i + 1}` + (row ? '' : ' is-empty');
      const name = document.createElement('span');
      name.className = 'podium__name';
      name.textContent = row ? row.name : '—';
      const pts = document.createElement('span');
      pts.className = 'podium__pts';
      pts.textContent = row ? `${row.total} poin` : '';
      const solved = document.createElement('span');
      solved.className = 'podium__solved';
      solved.textContent = row ? `${row.solved}/${row.plays} terpecahkan` : '';
      const block = document.createElement('div');
      block.className = 'podium__block';
      block.textContent = i + 1;
      col.append(name, pts, solved, block);
      podium.appendChild(col);
    }

    const rest = board.slice(3);
    list.hidden = !rest.length;
    for (const row of rest) {
      const li = document.createElement('li');
      const n = document.createElement('span'); n.className = 'n'; n.textContent = row.name;
      const s = document.createElement('span'); s.className = 's'; s.textContent = `${row.solved}/${row.plays} terpecahkan`;
      const p = document.createElement('span'); p.className = 'p'; p.textContent = row.total;
      li.append(n, s, p);
      list.appendChild(li);
    }
  }

  function init() {
    render();
    document.addEventListener('kr:entry-added', render);
    $('lbReset').addEventListener('click', () => {
      if (root.confirm('Hapus semua skor di papan? Ini tidak bisa dibatalkan.')) {
        Store.saveJSON(Store.KEYS.entries, []);
        render();
      }
    });
  }

  root.Leaderboard = { init, render };
})(window);
