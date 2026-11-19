const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../js/storage.js');

function withStorage(fake, fn) {
  const had = Object.prototype.hasOwnProperty.call(globalThis, 'localStorage');
  const prev = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', { value: fake, configurable: true, writable: true });
  try { fn(); } finally {
    if (had) Object.defineProperty(globalThis, 'localStorage', { value: prev, configurable: true, writable: true });
    else delete globalThis.localStorage;
  }
}

test('JSON rusak memberi fallback', () => {
  withStorage({ getItem: () => '{rusak', setItem() {} }, () => {
    assert.deepEqual(S.loadJSON('x', []), []);
  });
});

test('storage melempar error', () => {
  const boom = () => { throw new Error('blocked'); };
  withStorage({ getItem: boom, setItem: boom }, () => {
    assert.equal(S.saveJSON('x', [1]), false);
    assert.deepEqual(S.loadJSON('x', ['f']), ['f']);
  });
});

test('tanpa localStorage', () => {
  withStorage(undefined, () => {
    assert.deepEqual(S.loadJSON('x', { a: 1 }), { a: 1 });
    assert.equal(S.saveJSON('x', 1), false);
  });
});

test('simpan lalu muat', () => {
  const mem = {};
  withStorage({ getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); } }, () => {
    assert.equal(S.saveJSON('kr.entries', [{ a: 1 }]), true);
    assert.deepEqual(S.loadJSON('kr.entries', []), [{ a: 1 }]);
    assert.deepEqual(S.loadJSON('kosong', 'f'), 'f');
  });
});
