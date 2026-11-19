const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../js/polybius.js');

test('kotak standar tanpa kata kunci', () => {
  assert.equal(P.buildGrid('').join(''), 'ABCDEFGHIKLMNOPQRSTUVWXYZ');
});

test('kata kunci kotor dibersihkan', () => {
  assert.equal(P.cleanKeyword('jaringan 2026'), 'IARNG');
  const g = P.buildGrid('jaringan 2026');
  assert.equal(g.slice(0, 5).join(''), 'IARNG');
  assert.equal(g.length, 25);
  assert.equal(new Set(g).size, 25);
});

test('enkripsi contoh standar', () => {
  assert.equal(P.encrypt('HALO DUNIA', ''), '23 11 31 34 / 14 45 33 24 11');
});

test('enkripsi meneruskan tanda baca dan J = I', () => {
  const out = P.encrypt('Halo, Jaka!', '');
  assert.ok(out.includes(','));
  assert.ok(out.includes('!'));
  assert.equal(P.encrypt('J', ''), '24');
  assert.equal(P.encrypt('I', ''), '24');
});

test('dekripsi standar', () => {
  assert.deepEqual(P.decrypt('23 11 31 34 / 14 45 33 24 11', ''), { ok: true, text: 'HALO DUNIA' });
  assert.equal(P.decrypt('2311 3134', '').text, 'HALO');
  assert.equal(P.decrypt('  23\n11  ', '').text, 'HA');
});

test('round-trip dengan kata kunci', () => {
  assert.equal(P.decrypt(P.encrypt('jaringan komputer', 'KUNCI'), 'KUNCI').text, 'IARINGAN KOMPUTER');
});

test('round-trip meneruskan tanda baca', () => {
  assert.equal(P.decrypt(P.encrypt('Halo, dunia!', 'UNAIR'), 'UNAIR').text, 'HALO, DUNIA!');
});

test('round-trip dengan angka dan garis miring', () => {
  for (const msg of ['LAB 12', 'TM12', 'IP 192.168.1.1', 'TCP/IP', 'IPV4']) {
    const res = P.decrypt(P.encrypt(msg, 'UNAIR'), 'UNAIR');
    assert.equal(res.ok, true, msg);
    assert.equal(res.text, msg, msg);
  }
  assert.equal(P.encrypt('TM12', ''), '44 32 [12]');
});

test('dekripsi input tidak valid', () => {
  const odd = P.decrypt('231', '');
  assert.equal(odd.ok, false);
  assert.equal(typeof odd.error, 'string');
  assert.equal(P.decrypt('23 61', '').ok, false);
  assert.equal(P.decrypt('23 01', '').ok, false);
});

test('trace dan locate', () => {
  assert.deepEqual(P.trace('HA', ''), [7, 0]);
  assert.deepEqual(P.locate('J', P.buildGrid('')), { row: 2, col: 4 });
  assert.equal(P.locate('7', P.buildGrid('')), null);
});
