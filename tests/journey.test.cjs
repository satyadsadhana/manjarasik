// DOM simulation exercises the real app event handlers without external dependencies.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const E=require('../engine.js');
function launch(storage=new Map(),blockStorage=false){
  const elements=new Map();let visits=[];
  class Element{
    constructor(id){this.id=id;this.events={};this.value='';this.textContent='';this.disabled=false;this.attrs={};this.hidden=false;}
    addEventListener(event,fn){this.events[event]=fn;}
    setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}
    focus(){}showModal(){this.open=true;}close(){this.open=false;}
    querySelectorAll(selector){return selector==='[data-visit]'?visits:[];}
    set innerHTML(html){this.html=html;if(this.id==='main'){
      for(const [id] of elements)if(!fixed.has(id))elements.delete(id);
      for(const m of html.matchAll(/<[^>]*\bid="([^"]+)"[^>]*>/g)){const e=new Element(m[1]);e.disabled=/\bdisabled\b/.test(m[0]);const value=m[0].match(/\bvalue="([^"]*)"/);if(value)e.value=value[1];elements.set(m[1],e);}
      visits=[...html.matchAll(/data-visit="([^"]+)"/g)].map(m=>{const e=new Element('visit');e.dataset={visit:m[1]};return e;});
    }}
    get innerHTML(){return this.html||'';}
  }
  const index=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const fixed=new Set([...index.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  for(const id of fixed)elements.set(id,new Element(id));
  const localStorage={getItem(k){if(blockStorage)throw Error('blocked');return storage.get(k)||null;},setItem(k,v){if(blockStorage)throw Error('blocked');storage.set(k,v);},removeItem(k){storage.delete(k);}};
  const context={StoryEngine:E,localStorage,document:{getElementById:id=>elements.get(id)},window:{scrollTo(){}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../app.js'),'utf8'),context);
  const click=id=>{const el=elements.get(id);assert.ok(el,`Control ${id} exists`);if(!el.disabled)el.events.click?.({preventDefault(){}});};
  const submit=id=>{assert.ok(elements.get(id),`Form ${id} exists`);elements.get(id).events.submit({preventDefault(){}});};
  return {elements,storage,click,submit,html:()=>elements.get('main').innerHTML,visit:id=>{const el=visits.find(e=>e.dataset.visit===id);assert.ok(el);el.events.click();}};
}
test('full story journey: introduction, four ciphers, locked final, lantern and resume',()=>{
  const a=launch();assert.match(a.html(),/Buka cerita/);assert.equal(a.elements.get('mapNav').disabled,true);
  a.elements.get('playerName').value='Nara';a.submit('welcomeForm');
  assert.match(a.html(),/Ini kisahmu, Nara/);assert.doesNotMatch(a.html(),/answerForm/);
  for(let i=0;i<4;i++)a.click('nextStory');
  assert.match(a.html(),/Ke mana langkahmu/);assert.equal(a.elements.get('openFinal').disabled,true);
  a.click('openFinal');assert.doesNotMatch(a.html(),/lightLantern/);
  for(const [i,q] of E.quests.entries()){
    a.visit(q.id);assert.match(a.html(),/Periksa sandi/);a.click('beginPuzzle');
    a.elements.get('answer').value='SALAH';a.submit('answerForm');assert.match(a.elements.get('answerFeedback').textContent,/Belum tepat/);
    a.click('hintButton');assert.equal(a.elements.get('hintBox').hidden,false);
    a.elements.get('answer').value=q.answer.toLowerCase();a.submit('answerForm');assert.match(a.html(),new RegExp(q.key));
    a.click('continueMap');assert.equal(a.elements.get('openFinal').disabled,i<3);
  }
  a.click('openFinal');assert.match(a.html(),/Lentera Aksara/);a.click('lightLantern');assert.match(a.html(),/Kamu membawa fajar/);
  const reload=launch(a.storage);reload.click('resume');assert.match(reload.html(),/Kamu membawa fajar/);
  reload.click('endReset');reload.click('cancelReset');assert.ok([...a.storage.values()].some(v=>JSON.parse(v).finished));
  reload.click('endReset');reload.click('confirmReset');assert.match(reload.html(),/Buka cerita/);assert.equal(a.storage.size,0);
});
test('player names render as text and unavailable storage does not block play',()=>{
  const a=launch(new Map(),true);a.elements.get('playerName').value='<img src=x>';a.submit('welcomeForm');
  assert.match(a.html(),/&lt;img src=x&gt;/);assert.doesNotMatch(a.html(),/<img src=x>/);assert.match(a.html(),/Penyimpanan browser tidak tersedia/);
  for(let i=0;i<4;i++)a.click('nextStory');assert.match(a.html(),/Ke mana langkahmu/);
});
