const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const rootDir=path.join(__dirname,'..');
// A minimal DOM adapter keeps these tests focused on the real controller's timer
// ownership and state transitions. Layout is checked separately in a browser.
function harness(reduced=false){
 let clock=0,id=0;const queue=new Map(),slots=new Map();
 function element(key=''){const e={dataset:{},style:{},className:'',textContent:'',innerHTML:'',hidden:false,focus(){},addEventListener(){},querySelector:s=>get(s),querySelectorAll:()=>[],setAttribute(){},cloneNode(){const n=element(key);n.textContent=this.textContent;n.className=this.className;return n},replaceWith(n){for(const [k,v] of slots)if(v===this)slots.set(k,n)}};const classes=new Set();e.classList={add:(...v)=>v.forEach(x=>classes.add(x)),toggle:(v,on)=>on?classes.add(v):classes.delete(v)};return e}
 function get(key){if(!slots.has(key))slots.set(key,element(key));return slots.get(key)}
 const root=get('#tiny-surprise');
 const ctx=vm.createContext({CONFIG:JSON.parse(fs.readFileSync(path.join(rootDir,'config/birthday.json'),'utf8')),document:{getElementById:()=>root,createElement:()=>element()},matchMedia:()=>({matches:reduced}),performance:{now:()=>clock},setTimeout:(fn,ms)=>{queue.set(++id,{fn,at:clock+Math.max(0,ms)});return id},clearTimeout:i=>queue.delete(i),window:{addEventListener(){}},console});
 const run=vm.runInContext('(function(){'+fs.readFileSync(path.join(rootDir,'frontend/app.js'),'utf8')+';return code=>eval(code)})()',ctx);
 function advance(ms){const end=clock+ms;let guard=0;for(;;){const items=[...queue].sort((a,b)=>a[1].at-b[1].at||a[0]-b[0]);if(!items.length||items[0][1].at>end)break;assert.ok(++guard<20000,'timer loop');const [i,t]=items[0];clock=t.at;queue.delete(i);t.fn()}clock=end}
 return {run,advance,get,root,queue};
}
test('opening blackout, light, deliberate pause, you and envelope timing',()=>{
 const h=harness();h.run("enter('FAKE_AD_LETTER')");assert.equal(h.root.dataset.act,'blackout');h.advance(699);assert.equal(h.root.dataset.act,'blackout');h.advance(1);assert.equal(h.root.dataset.act,'dark');h.advance(2600);assert.equal(h.root.dataset.act,'light');h.advance(3200);assert.equal(h.root.dataset.act,'existence');h.advance(2800);assert.equal(h.root.dataset.act,'pause');h.advance(1999);assert.equal(h.root.dataset.act,'pause');h.advance(1);assert.equal(h.root.dataset.act,'you');h.advance(1800);assert.equal(h.root.dataset.act,'envelope');h.advance(2500);assert.equal(h.root.dataset.act,'letter');assert.equal(h.run('paragraphIndex'),0);
});
test('rapid taps complete one paragraph without skipping, manual next cancels auto-next',()=>{
 const h=harness();h.run("enter('FAKE_AD_LETTER');showLetter()");h.advance(500);h.run('tapLetter();tapLetter();tapLetter()');assert.equal(h.run('typing'),false);assert.equal(h.run('paragraphIndex'),0);h.advance(451);h.run('tapLetter()');assert.equal(h.run('paragraphIndex'),1);h.advance(550);assert.equal(h.run('paragraphIndex'),1);h.run("enter('INTRO')");h.advance(100000);assert.equal(h.run('state'),'INTRO');assert.equal(h.queue.size,0);
});
test('automatic playback visits all original paragraphs and delays signature and reward',()=>{
 const h=harness();h.run("enter('FAKE_AD_LETTER');showLetter()");const lines=h.run('C.letter_lines');for(let i=0;i<lines.length;i++){assert.equal(h.run('paragraphIndex'),i);const typingMs=(Array.from(lines[i]).length-1)*42;h.advance(typingMs);assert.equal(h.get('.current-paragraph').textContent,lines[i]);const hold=i===lines.length-1?1800:i===lines.length-2?1200:1000;h.advance(hold-1);assert.equal(h.run('paragraphIndex'),i);h.advance(1)}assert.equal(h.run('letterPhase'),'reward');assert.match(h.get('.letter-reward').innerHTML,/추가 뽑기 기회 \+1/);h.run("send('LETTER_DONE');send('LETTER_DONE')");assert.equal(h.run('state'),'GACHA_SECOND');h.run("send('DRAW');send('DRAW')");h.advance(2400);assert.equal(h.run('state'),'WIN');h.advance(3000);assert.equal(h.run('state'),'BIRTHDAY_FINALE');
});
test('skip removes timers; replay bypasses universe and returns to finale',()=>{
 const h=harness();h.run("enter('FAKE_AD_LETTER');skipLetter();skipLetter()");assert.equal(h.run('letterPhase'),'reward');h.advance(100000);assert.equal(h.run('letterPhase'),'reward');h.run("enter('BIRTHDAY_FINALE');send('READ')");assert.equal(h.root.dataset.act,'envelope');h.advance(2500);assert.equal(h.root.dataset.act,'letter');h.run("skipLetter();send('LETTER_DONE')");assert.equal(h.run('state'),'BIRTHDAY_FINALE');h.run("send('RESET')");assert.equal(h.run('state'),'INTRO');
});
test('reduced motion keeps the ordered letter readable and completes without animation events',()=>{
 const h=harness(true);h.run("enter('FAKE_AD_LETTER');showLetter()");h.advance(0);assert.equal(h.run('paragraphIndex'),0);assert.equal(h.run('typing'),false);h.advance(20000);assert.equal(h.run('letterPhase'),'reward');
});
