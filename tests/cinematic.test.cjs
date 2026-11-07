const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const rootDir=path.join(__dirname,'..');
// A minimal DOM adapter keeps these tests focused on the real controller's timer
// ownership and state transitions. Layout is checked separately in a browser.
function harness(reduced=false,audioOptions={}){
 let clock=0,id=0;const queue=new Map(),slots=new Map();
 const context2d={setTransform(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fill(){}};
 function element(key=''){
  const handlers=new Map();const e={dataset:{},style:{},className:'',textContent:'',innerHTML:'',hidden:false,children:[],scrollTop:0,scrollHeight:100,clientHeight:100,removed:false,focus(){},addEventListener(t,f){handlers.set(t,f)},removeEventListener(t){handlers.delete(t)},emit(t,event={}){handlers.get(t)?.(event)},querySelector:s=>get(s),querySelectorAll:()=>[],setAttribute(){},getBoundingClientRect(){return {width:360,height:800}},getContext:()=>context2d,remove(){this.removed=true},append(n){this.children.push(n);n.parentElement=this;if(n.className.split(' ').includes('current-paragraph'))slots.set('.current-paragraph',n)},cloneNode(){const n=element(key);n.textContent=this.textContent;n.className=this.className;return n},replaceWith(n){for(const [k,v] of slots)if(v===this)slots.set(k,n)}};
  e.classList={add:(...v)=>{e.className=[...new Set([...e.className.split(' '),...v])].join(' ')},remove:v=>{e.className=e.className.split(' ').filter(x=>x!==v).join(' ')},toggle:(v,on)=>on?e.classList.add(v):e.classList.remove(v)};return e;
 }
 function get(key){if(key==='.current-paragraph'&&!slots.has(key))return null;if(!slots.has(key))slots.set(key,element(key));return slots.get(key)}
 const root=get('#tiny-surprise');const documentEvents=new Map();const media=[];
 const config=JSON.parse(fs.readFileSync(path.join(rootDir,'config/birthday.json'),'utf8'));config.bgm_available=audioOptions.available===true;if(audioOptions.tracks)config.audio_tracks=audioOptions.tracks;
 function create(tag){const e=element();if(tag==='audio'){e.paused=true;e.currentTime=0;e.playCalls=0;e.mode=audioOptions.mode||'resolve';e.play=function(){this.playCalls++;if(this.mode==='reject'){this.paused=true;return Promise.reject(Object.assign(new Error('Autoplay blocked'),{name:'NotAllowedError'}))}if(this.mode==='deferred')return new Promise(resolve=>{this.resolvePlay=()=>{this.paused=false;resolve()}});this.paused=false;return Promise.resolve()};e.pause=function(){this.paused=true};media.push(e)}return e}

 const ctx=vm.createContext({CONFIG:config,document:{hidden:false,addEventListener:(t,f)=>{if(!documentEvents.has(t))documentEvents.set(t,new Set());documentEvents.get(t).add(f)},removeEventListener:(t,f)=>documentEvents.get(t)?.delete(f),emit:t=>documentEvents.get(t)?.forEach(f=>f()),getElementById:()=>root,body:element(),createElement:create},matchMedia:()=>({matches:reduced}),performance:{now:()=>clock},setTimeout:(fn,ms)=>{queue.set(++id,{fn,at:clock+Math.max(0,ms)});return id},clearTimeout:i=>queue.delete(i),requestAnimationFrame:fn=>{queue.set(++id,{fn:()=>fn(clock),at:clock+16});return id},cancelAnimationFrame:i=>queue.delete(i),devicePixelRatio:2,window:{addEventListener(){},removeEventListener(){}},console});
 const run=vm.runInContext('(function(){'+fs.readFileSync(path.join(rootDir,'frontend/app.js'),'utf8')+';return code=>eval(code)})()',ctx);
 function advance(ms){const end=clock+ms;let guard=0;for(;;){const items=[...queue].sort((a,b)=>a[1].at-b[1].at||a[0]-b[0]);if(!items.length||items[0][1].at>end)break;assert.ok(++guard<20000,'timer loop');const [i,t]=items[0];clock=t.at;queue.delete(i);t.fn()}clock=end}
 return {run,advance,get,root,queue,media};
}
test('opening blackout, light, deliberate pause, you and envelope timing',()=>{
 const h=harness();h.run("enter('FAKE_AD_LETTER')");assert.equal(h.root.dataset.act,'blackout');h.advance(699);assert.equal(h.root.dataset.act,'blackout');h.advance(1);assert.equal(h.root.dataset.act,'dark');h.advance(2600);assert.equal(h.root.dataset.act,'light');h.advance(3200);assert.equal(h.root.dataset.act,'existence');h.advance(2800);assert.equal(h.root.dataset.act,'pause');h.advance(1199);assert.equal(h.root.dataset.act,'pause');h.advance(1);assert.equal(h.root.dataset.act,'you');h.advance(1800);assert.equal(h.root.dataset.act,'envelope');h.advance(2500);assert.equal(h.root.dataset.act,'letter');assert.equal(h.run('paragraphIndex'),0);
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

test('all displayed paragraphs retain their original DOM nodes through completion and skip',()=>{
 const h=harness();h.run("enter('FAKE_AD_LETTER');showLetter()");const first=h.get('.paragraph-window').children[0];h.advance(500);h.run('tapLetter()');h.advance(451);h.run('tapLetter()');assert.equal(h.get('.paragraph-window').children.length,2);assert.equal(h.get('.paragraph-window').children[0],first);h.run('skipLetter()');assert.equal(h.get('.paragraph-window').children.length,12);assert.equal(h.get('.paragraph-window').children[0],first);assert.equal(h.get('.paragraph-window').children.at(-1).textContent,'- 나뇽이가 -');
});
test('reading older paragraphs prevents follow-scroll and reaching bottom resumes it',()=>{
 const h=harness();h.run("enter('FAKE_AD_LETTER');showLetter()");const paper=h.get('.cinema-paper');paper.scrollHeight=1000;paper.clientHeight=300;paper.scrollTop=100;paper.emit('scroll');h.advance(100);assert.equal(paper.scrollTop,100);h.advance(4000);assert.equal(paper.scrollTop,100);paper.scrollTop=700;paper.emit('scroll');h.advance(200);assert.equal(paper.scrollTop,1000);
});
test('swipe suppresses blank-area tap; old paragraph taps never advance',()=>{
 const h=harness();h.run("enter('FAKE_AD_LETTER');showLetter()");h.advance(500);const p=h.get('.cinema-paper');p.emit('pointerdown',{pointerId:1,clientX:50,clientY:200});p.emit('pointermove',{pointerId:1,clientX:50,clientY:80});p.emit('pointerup');assert.equal(h.run("isBlankLetterTap({target:{matches:()=>true}})"),false);h.advance(501);assert.equal(h.run("isBlankLetterTap({target:{matches:()=>false}})"),false);assert.equal(h.run('paragraphIndex'),0);
});
test('fireworks have one bounded loop, ignore overlapping replay and clean up on exit',()=>{
 const h=harness();h.run("enter('WIN')");h.advance(3000);assert.equal(h.run('fireworksActive'),true);const first=h.root.children.filter(c=>!c.removed).length;h.run("send('CELEBRATE');send('CELEBRATE')");assert.equal(h.root.children.filter(c=>!c.removed).length,first);h.advance(5600);assert.equal(h.run('fireworksActive'),false);assert.equal(h.root.children.filter(c=>!c.removed).length,0);h.run("send('CELEBRATE')");assert.equal(h.run('fireworksActive'),true);h.run("send('READ')");assert.equal(h.run('fireworksActive'),false);assert.equal(h.root.children.filter(c=>!c.removed).length,0);
});
test('no fireworks on ordinary rendering, letter return or reduced motion',()=>{
 const h=harness();h.run("enter('BIRTHDAY_FINALE');render()");assert.equal(h.run('fireworksActive'),false);const r=harness(true);r.run("enter('WIN')");r.advance(3000);assert.equal(r.run('fireworksActive'),false);
});

test('background visibility pauses the only animation loop and resumes without duplication',()=>{
 const h=harness();h.run("enter('WIN')");h.advance(3000);assert.equal(h.queue.size,1);h.run("document.hidden=true;document.emit('visibilitychange')");assert.equal(h.queue.size,0);h.advance(10000);assert.equal(h.run('fireworksActive'),true);h.run("document.hidden=false;document.emit('visibilitychange');document.emit('visibilitychange')");assert.equal(h.queue.size,1);h.advance(5600);assert.equal(h.run('fireworksActive'),false);assert.equal(h.queue.size,0);
});

const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('missing audio stays silent without a media element or playback request',async()=>{
 const h=harness();h.run("enter('GACHA_SECOND');send('DRAW')");h.advance(5400);await settle();assert.equal(h.run('state'),'BIRTHDAY_FINALE');assert.equal(h.media.length,0);assert.equal(h.run("musicControl().includes('data-event=\"MUSIC\"')"),false);assert.equal(h.run('bgmPlaying'),false);
});
test('second draw prepares silently; only finale plays at 40 percent; toggle and exit stop it',async()=>{
 const h=harness(false,{available:true});h.run("enter('GACHA_SECOND');send('DRAW')");assert.equal(h.media.length,1);assert.equal(h.media[0].muted,true);assert.equal(h.media[0].volume,.4);await settle();assert.equal(h.media[0].paused,true);h.advance(5400);await settle();assert.equal(h.run('bgmPlaying'),true);assert.equal(h.media[0].muted,false);assert.equal(h.media[0].loop,false);h.run("send('MUSIC')");assert.equal(h.media[0].paused,true);assert.equal(h.media[0].muted,true);h.run("send('MUSIC')");await settle();assert.equal(h.media[0].paused,false);h.run("send('READ')");assert.equal(h.media[0].paused,true);assert.equal(h.media[0].currentTime,0);assert.equal(h.media.length,1);
});
test('autoplay rejection exposes manual playback fallback and manual activation recovers',async()=>{
 const h=harness(false,{available:true,mode:'reject'});h.run("enter('BIRTHDAY_FINALE')");await settle();assert.equal(h.run('bgmPlaying'),false);assert.equal(h.get('.music-toggle').textContent,'🎵 음악 재생하기');h.media[0].mode='resolve';h.run("send('MUSIC')");await settle();assert.equal(h.run('bgmPlaying'),true);assert.equal(h.get('.music-toggle').textContent,'⏸ 음악 일시정지');
});
test('celebration replay restarts the singleton after a pause while ignoring duplicate replay',async()=>{
 const h=harness(false,{available:true});h.run("enter('BIRTHDAY_FINALE')");await settle();h.media[0].currentTime=12;h.run("send('CELEBRATE')");await settle();assert.equal(h.media[0].currentTime,0);assert.equal(h.media.length,1);const calls=h.media[0].playCalls;h.run("send('CELEBRATE');send('CELEBRATE')");await settle();assert.equal(h.media[0].playCalls,calls);h.run("send('MUSIC')");h.advance(5600);h.run("send('CELEBRATE')");await settle();assert.equal(h.run('bgmPlaying'),true);assert.equal(h.media[0].paused,false);
});
test('late playback resolution and invalid media never leak sound outside the finale',async()=>{
 const h=harness(false,{available:true,mode:'deferred'});h.run("enter('BIRTHDAY_FINALE');send('READ')");h.media[0].resolvePlay();await settle();assert.equal(h.media[0].paused,true);assert.equal(h.media[0].muted,true);assert.equal(h.run('bgmPlaying'),false);h.media[0].emit('error');assert.equal(h.run('bgmFailed'),true);assert.equal(h.run("musicControl().includes('data-event=\"MUSIC\"')"),false);
});

test('hidden finale stops music and a late play response cannot restart background audio',async()=>{
 const h=harness(false,{available:true,mode:'deferred'});h.run("enter('BIRTHDAY_FINALE');document.hidden=true;document.emit('visibilitychange')");h.media[0].resolvePlay();await settle();assert.equal(h.media[0].paused,true);assert.equal(h.media[0].muted,true);assert.equal(h.run('bgmPlaying'),false);h.run("document.hidden=false;document.emit('visibilitychange')");assert.equal(h.media[0].paused,true);
});

test('music pause preserves position, resume continues, and leaving finale resets it',async()=>{
 const h=harness(false,{available:true});h.run("enter('BIRTHDAY_FINALE')");await settle();h.media[0].currentTime=46;h.run("send('MUSIC')");assert.equal(h.media[0].currentTime,46);assert.equal(h.media[0].paused,true);h.run("send('MUSIC')");await settle();assert.equal(h.media[0].currentTime,46);assert.equal(h.media[0].paused,false);h.run("send('READ')");assert.equal(h.media[0].currentTime,0);assert.equal(h.media[0].paused,true);
});
test('track ends once, shows play control and manual play restarts the ended track',async()=>{
 const h=harness(false,{available:true});h.run("enter('BIRTHDAY_FINALE')");await settle();const a=h.media[0];a.currentTime=124;a.ended=true;a.emit('ended');assert.equal(a.loop,false);assert.equal(a.paused,true);assert.equal(a.currentTime,124);assert.equal(h.run('bgmPlaying'),false);assert.equal(h.get('.music-toggle').textContent,'🎵 음악 재생하기');const calls=a.playCalls;h.advance(30000);await settle();assert.equal(a.playCalls,calls);h.run("send('MUSIC')");await settle();assert.equal(a.currentTime,0);assert.equal(a.paused,false);
});

const everyTrack=()=>Object.fromEntries(['ad_intro','letter_bgm','birthday'].map(t=>[t,{available:true,version:t+'-test'}]));
test('ad starts from its button, fades before baro, stays silent there, then starts letter at you',async()=>{
 const h=harness(false,{tracks:everyTrack()});h.run("enter('LOSE');send('AD')");await settle();const a=h.media[0];assert.match(a.src,/ad_intro.mp3/);assert.equal(a.volume,.35);assert.equal(a.muted,false);assert.equal(a.loop,false);h.advance(9000);h.advance(125);assert.ok(a.volume>0&&a.volume<.35);h.advance(125);assert.equal(a.paused,true);assert.equal(a.muted,true);h.advance(50);assert.equal(h.root.dataset.act,'pause');const calls=a.playCalls;h.run("send('MUSIC');send('MUSIC_MUTE')");h.advance(1199);assert.equal(a.playCalls,calls);assert.equal(a.paused,true);h.advance(1);await settle();assert.equal(h.root.dataset.act,'you');assert.match(a.src,/letter_bgm.mp3/);assert.equal(a.loop,true);assert.equal(a.volume,.35);assert.equal(a.muted,false);assert.equal(h.media.length,1);
});
test('letter source and position survive envelope opening, body rendering and full-letter view',async()=>{
 const h=harness(false,{tracks:everyTrack()});h.run("enter('FAKE_AD_LETTER')");await settle();h.advance(10500);await settle();const a=h.media[0];a.currentTime=5;const calls=a.playCalls;h.advance(1800);assert.equal(h.root.dataset.act,'envelope');h.advance(2500);assert.equal(h.root.dataset.act,'letter');h.run('skipLetter()');assert.equal(a.playCalls,calls);assert.equal(a.currentTime,5);assert.equal(a.loop,true);assert.equal(a.paused,false);
});
test('letter exit fades; immediate second draw cancels the fade before preparing birthday',async()=>{
 const h=harness(false,{tracks:everyTrack()});h.run("enter('FAKE_AD_LETTER');showLetter();skipLetter()");await settle();const a=h.media[0];h.run("send('LETTER_DONE')");assert.equal(h.run('state'),'GACHA_SECOND');assert.equal(a.paused,false);h.advance(125);assert.ok(a.volume<.35);h.run("send('DRAW')");await settle();assert.match(a.src,/birthday.mp3/);assert.equal(a.muted,true);assert.equal(h.run('fadeRunning'),false);h.advance(5400);await settle();assert.equal(h.run('state'),'BIRTHDAY_FINALE');assert.equal(a.paused,false);assert.equal(a.loop,false);assert.equal(a.volume,.4);assert.equal(h.media.length,1);
});
test('late ad playback cannot break the mandatory silence',async()=>{
 const h=harness(false,{tracks:everyTrack(),mode:'deferred'});h.run("enter('FAKE_AD_LETTER')");h.advance(9300);assert.equal(h.root.dataset.act,'pause');h.media[0].resolvePlay();await settle();assert.equal(h.media[0].paused,true);assert.equal(h.media[0].muted,true);
});
test('global mute persists across ad, letter and birthday and unmuting is explicit',async()=>{
 const h=harness(false,{tracks:everyTrack()});h.run("enter('FAKE_AD_LETTER')");await settle();h.run("send('MUSIC_MUTE')");assert.equal(h.media[0].muted,true);h.advance(10500);await settle();assert.equal(h.media[0].muted,true);h.run("enter('BIRTHDAY_FINALE')");await settle();assert.equal(h.media[0].muted,true);h.run("send('MUSIC_MUTE')");assert.equal(h.media[0].muted,false);assert.equal(h.media.length,1);
});
test('missing intro prepares letter silently; missing optional tracks do not affect birthday',async()=>{
 const tracks=everyTrack();tracks.ad_intro.available=false;const h=harness(false,{tracks});h.run("enter('FAKE_AD_LETTER')");await settle();assert.match(h.media[0].src,/letter_bgm.mp3/);assert.equal(h.media[0].muted,true);assert.equal(h.media[0].paused,true);h.advance(10500);await settle();assert.equal(h.media[0].paused,false);const absent=everyTrack();absent.ad_intro.available=absent.letter_bgm.available=false;const m=harness(false,{tracks:absent});m.run("enter('FAKE_AD_LETTER')");m.advance(14800);assert.equal(m.media.length,0);m.run("enter('BIRTHDAY_FINALE')");await settle();assert.equal(m.media[0].paused,false);
});
test('one failed track does not disable the following tracks; manual gesture recovers a blocked letter',async()=>{
 const h=harness(false,{tracks:everyTrack()});h.run("enter('FAKE_AD_LETTER')");await settle();h.media[0].emit('error');assert.equal(h.run("failedMusic.has('ad_intro')"),true);h.advance(10500);await settle();assert.match(h.media[0].src,/letter_bgm.mp3/);assert.equal(h.media[0].paused,false);h.media[0].mode='reject';h.run("enter('BIRTHDAY_FINALE');send('READ')");await settle();assert.equal(h.run('bgmPlaying'),false);assert.equal(h.get('.music-toggle').textContent,'🎵 음악 재생하기');h.media[0].mode='resolve';h.run("send('MUSIC')");await settle();assert.equal(h.run('bgmPlaying'),true);
});
test('reentry and skipped opening keep one element and cancel abandoned fades and timers',async()=>{
 const h=harness(false,{tracks:everyTrack()});for(let i=0;i<3;i++){h.run("enter('FAKE_AD_LETTER')");await settle();h.advance(9100);h.run("skipLetter();skipLetter();send('LETTER_DONE');enter('INTRO')");h.advance(100000);assert.equal(h.media.length,1);assert.equal(h.media[0].paused,true);assert.equal(h.run('fadeRunning'),false);assert.equal(h.queue.size,0)}
});

test('letter exit completes its fade without requiring another user input',async()=>{
 const h=harness(false,{tracks:everyTrack()});h.run("enter('FAKE_AD_LETTER');showLetter();skipLetter()");await settle();h.run("send('LETTER_DONE')");h.advance(250);assert.equal(h.media[0].paused,true);assert.equal(h.media[0].muted,true);assert.equal(h.media[0].currentTime,0);assert.equal(h.run('fadeRunning'),false);
});

test('foreground return re-enables manual playback without autoplaying a hidden scene',async()=>{
 const h=harness(false,{tracks:everyTrack()});h.run("enter('FAKE_AD_LETTER');document.hidden=true;document.emit('visibilitychange')");await settle();h.advance(14800);assert.equal(h.get('.music-toggle').disabled,true);h.run("document.hidden=false;document.emit('visibilitychange')");assert.equal(h.get('.music-toggle').disabled,false);assert.equal(h.run('bgmPlaying'),false);h.run("send('MUSIC')");await settle();assert.match(h.media[0].src,/letter_bgm.mp3/);assert.equal(h.media[0].paused,false);
});
test('mute toggles never restart a track that has naturally ended',async()=>{
 const h=harness(false,{tracks:everyTrack()});h.run("enter('BIRTHDAY_FINALE')");await settle();const a=h.media[0];a.ended=true;a.currentTime=124;a.emit('ended');const calls=a.playCalls;h.run("send('MUSIC_MUTE');send('MUSIC_MUTE')");await settle();assert.equal(a.playCalls,calls);assert.equal(a.paused,true);assert.equal(a.currentTime,124);
});
