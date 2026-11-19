const test=require('node:test');
const assert=require('node:assert/strict');
const E=require('../engine.js');
test('cipher examples independently match expected values',()=>{
  assert.equal(E.caesar('TIMUR',3),'WLPXU');
  assert.equal(E.caesar('WLPXU',-3),'TIMUR');
  assert.equal(E.atbash('BINTANG'),'YRMGZMT');
  assert.equal(E.atbash('YRMGZMT'),'BINTANG');
  assert.equal(E.polybius('AKAR','AKSARA'),'11 12 11 14');
  assert.equal(E.vigenere('PULANG','KOTA'),'ZIEAXU');
  assert.equal(E.vigenere('ATTACKATDAWN','LEMON'),'LXFOPVEFRNHR');
});
test('Polybius key grid has 25 unique cells and merges J into I',()=>{
  const grid=E.grid('AKSARA');assert.equal(grid.length,25);assert.equal(new Set(grid).size,25);
  assert.deepEqual(grid.slice(0,5),['A','K','S','R','B']);assert.equal(E.polybius('J','AKSARA'),E.polybius('I','AKSARA'));
});
test('all quest ciphertexts agree with their cipher and accepted answers',()=>{
  const fns=[q=>E.caesar(q.answer,3),q=>E.atbash(q.answer),q=>E.polybius(q.answer,'AKSARA'),q=>E.vigenere(q.answer,'KOTA')];
  E.quests.forEach((q,i)=>assert.equal(q.ciphertext,fns[i](q)));
});
test('final location requires all four distinct valid keys',()=>{
  assert.equal(E.canUnlock([]),false);assert.equal(E.canUnlock(['tower','tower','tower','tower']),false);
  assert.equal(E.canUnlock(['tower','observatory','garden','archive']),true);
});
test('saved progress rejects forged completion and invalid inventory',()=>{
  const s=E.validateState({solved:['tower','tower','fake'],finished:true,storyPage:100,name:'Nara'});
  assert.deepEqual(s.solved,['tower']);assert.equal(s.finished,false);assert.equal(s.storyPage,3);
  assert.equal(E.validateState(null).solved.length,0);
  assert.equal(E.validateState({solved:E.quests.map(q=>q.id),finished:true}).finished,true);
});
test('answer normalization ignores punctuation, spaces and case',()=>assert.equal(E.normalize(' tI-mur! '),'TIMUR'));
