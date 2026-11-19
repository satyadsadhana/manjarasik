const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../js/game-core.js');

test('scoreRound sesuai rumus', () => {
  assert.equal(G.scoreRound({ level: 'sedang', seconds: 30, wrong: 1, hintCost: 100, solved: true }), 700);
  assert.equal(G.scoreRound({ level: 'mudah', seconds: 200, wrong: 3, hintCost: 0, solved: true }), 50);
  assert.equal(G.scoreRound({ level: 'sulit', seconds: 5, wrong: 0, hintCost: 0, solved: false }), 0);
});

test('isCorrectGuess toleran', () => {
  assert.equal(G.isCorrectGuess('  tcp   handshake ', 'TCP HANDSHAKE'), true);
  assert.equal(G.isCorrectGuess('jaringan', 'IARINGAN'), true);
  assert.equal(G.isCorrectGuess('router!', 'ROUTER'), true);
  assert.equal(G.isCorrectGuess('ruter', 'ROUTER'), false);
  assert.equal(G.isCorrectGuess('', 'ROUTER'), false);
  assert.equal(G.isCorrectGuess('ipv4', 'IPV4'), true);
  assert.equal(G.isCorrectGuess('IPV', 'IPV4'), false);
});

test('normalizeName', () => {
  assert.equal(G.normalizeName('   '), '');
  assert.equal(G.normalizeName('a'.repeat(30)).length, 20);
  assert.equal(G.normalizeName('  Budi   Santoso '), 'Budi Santoso');
});

test('aggregate menggabungkan nama sama', () => {
  const res = G.aggregate([
    { name: 'Budi', score: 500, solved: true },
    { name: ' budi ', score: 300, solved: true },
    { name: 'Ani', score: 900, solved: true },
  ]);
  assert.equal(res.length, 2);
  assert.equal(res[0].name, 'Ani');
  assert.equal(res[0].total, 900);
  assert.deepEqual(res[1], { name: 'Budi', total: 800, solved: 2, plays: 2 });
});

test('aggregate maksimal 10 dan aman untuk entry rusak', () => {
  const many = Array.from({ length: 15 }, (_, i) => ({ name: 'P' + i, score: i, solved: true }));
  assert.equal(G.aggregate(many).length, 10);
  assert.deepEqual(G.aggregate([null, { foo: 1 }, { name: '  ', score: 5 }]), []);
});

test('pickPuzzle', () => {
  assert.equal(G.pickPuzzle(G.DEFAULT_PUZZLES, 'sedang', [], () => 0).level, 'sedang');
  const ids = G.DEFAULT_PUZZLES.filter((p) => p.level === 'sedang').map((p) => p.id);
  assert.equal(G.pickPuzzle(G.DEFAULT_PUZZLES, 'sedang', ids, () => 0).level, 'sedang');
  assert.equal(G.pickPuzzle([], 'sedang', []), null);
});

test('DEFAULT_PUZZLES 4 per level, mudah tanpa kunci', () => {
  for (const lv of ['mudah', 'sedang', 'sulit']) {
    assert.equal(G.DEFAULT_PUZZLES.filter((p) => p.level === lv).length, 4);
  }
  assert.ok(G.DEFAULT_PUZZLES.filter((p) => p.level === 'mudah').every((p) => p.keyword === ''));
  assert.ok(G.DEFAULT_PUZZLES.filter((p) => p.level !== 'mudah').every((p) => p.keyword.length > 0));
});
