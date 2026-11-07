const root=document.getElementById('tiny-surprise');
if(root.dataset.ready) return;
root.dataset.ready='1';
const C=CONFIG, reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let stopFireworks=()=>{}, fireworksActive=false, fireworksRequested=false;
let state='INTRO', epoch=0, busy=false, replay=false, timers=new Set(), finishLine=null;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=s=>esc(s.replaceAll('{name}',C.friend_name).replaceAll('{nickname}',C.nickname));
const later=(fn,ms)=>{const e=epoch,id=setTimeout(()=>{timers.delete(id);if(e===epoch)fn()},ms);timers.add(id);return id};
function clear(){stopFireworks();epoch++;timers.forEach(clearTimeout);timers.clear();busy=false;finishLine=null;}
const button=(text,event,secondary=false)=>`<button class="${secondary?'secondary':''}" data-event="${event}">${text}</button>`;
function image(key,cls=''){const path=C.assets[key];return path?`<img class="character ${cls}" src="app/static/${esc(path)}" alt="${({usagi_back:'뒤돌아본 우사기',usagi_front:'우사기',white_character_pink:'분홍 배경의 친구',character_trio:'세 친구',animated_line:'움직이는 장식',cheering_character:'응원하는 친구',usagi_hands:'축하하는 우사기',ditto:'메타몽'})[key]||'친구'}">`:`<span class="fallback ${cls}" role="img" aria-label="작은 친구">♡</span>`}
const machine=()=>`<div class="machine"><div class="machine-top">LUCKY CLUB <span>★</span></div><div class="globe"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="machine-base"><span class="dial">✳</span><span class="slot"></span></div><div class="capsule"></div></div>`;
function shell(body,theme='survey'){root.className=theme;root.innerHTML=`<div class="app-shell"><header><span>✳ TINY SURVEY</span><span class="edition">VOL. 001</span></header><section class="scene" tabindex="-1">${body}</section><footer>${theme==='finale'?'MADE WITH A WHOLE LOT OF ♡':'취향 수집소 · 아주 주관적인 분석'}</footer></div>`; root.querySelector('.scene').focus({preventScroll:true});root.querySelectorAll('img').forEach(img=>{img.onerror=()=>{const el=document.createElement('span');el.className=img.className+' fallback';el.textContent='♡';el.setAttribute('aria-label',img.alt);img.replaceWith(el)}})}
function enter(next){const launch=next==='BIRTHDAY_FINALE'&&(state==='WIN'||fireworksRequested);clear();state=next;render();if(launch)startFireworks();}
function render(){
if(state==='INTRO')shell(`<div class="eyebrow">당신을 조금 더 알고 싶어서</div><div class="sticker">100%<br>주관적</div><h1>아주 간단한<br><span class="highlight">취향 설문</span></h1><p class="lead">당신의 취향을 분석해<br>특별한 결과를 보여드립니다!</p><div class="survey-art" aria-hidden="true"><span>?</span><span>✳</span><span>!</span></div><div class="note">딱 3문항 · 약 30초 · 정답 없음</div>${button('설문 시작하기 ▶','START')}<p class="fine">※ 결과가 너무 정확해도 놀라지 마세요.</p>`);
else if(state.startsWith('SURVEY_Q')){let i=Number(state.slice(-1))-1,q=C.questions[i];shell(`<div class="progress"><span style="width:${(i+1)/3*100}%"></span></div><div class="eyebrow">QUESTION 0${i+1} <span>/ 03</span></div><h2>${esc(q.title)}</h2><p class="muted">고민 말고, 지금 떠오르는 쪽으로!</p><div class="options">${q.options.map((o,j)=>button(`<small>0${j+1}</small> ${esc(o)} <span>↗</span>`,'ANSWER')).join('')}</div><div class="mini-star" aria-hidden="true">✳</div>`)}
else if(state==='ANALYZING'){shell(`<div class="spinner">✳</div><h2>취향을 모으는 중</h2><p id="analysis" aria-live="polite">고양이 친화도 분석 중...</p><div class="progress loading"><span></span></div><p class="fine">아주 진지하게 분석하고 있습니다.</p>`);later(()=>root.querySelector('#analysis').textContent='귀여운 것에 대한 반응 확인 중...',C.timing.analyzing_ms/3);later(()=>root.querySelector('#analysis').textContent='알 수 없는 행운 측정 중...',C.timing.analyzing_ms*2/3);later(()=>send('ANALYZED'),C.timing.analyzing_ms)}
else if(state==='GACHA_FIRST'||state==='GACHA_SECOND'){let second=state==='GACHA_SECOND';shell(`<div class="eyebrow">${second?'ONE MORE CHANCE':'당신의 취향 분석 완료'}</div><h2>${second?'이번엔 느낌이 좋은데?':'행운을 뽑아 보세요'}</h2><p class="muted">${second?'마음을 담아 한 번 더!':'당첨 확률 99.9% · 믿거나 말거나'}</p>${machine()}${button(second?'한 번 더 뽑기!':'결과 뽑기!','DRAW')}<p class="fine">${second?'이번 기회는 특별하니까 ♡':'결과는 열어 봐야 알죠.'}</p>`,second?'lucky':'survey')}
else if(state==='LOSE')shell(`<div class="eyebrow">이럴 수가...</div><div class="result-mark">꽝<span>…!</span></div><h2>0.1%의 주인공 등장</h2><p>당첨 확률이 99.9%였는데<br>이걸 실패한다고?</p><div class="ticket">그래도 특별히 추가 기회를 드립니다.</div>${button('광고 보고 재도전하기','AD')}${button('포기하기','GIVEUP',true)}<p id="plea" class="fine" aria-live="polite">조금만 더 하면 좋은 일이 생길지도?</p>`);
else if(state==='FAKE_AD_LETTER'){
startCinematic()}
else if(state==='RETRY_READY')shell(`<div class="eyebrow">마음 충전 완료</div>${image('usagi_front','single')}<h2>행운도 다시 충전했어!</h2><p>자, 진짜 마지막 한 번.</p>${button('추가 기회로 뽑으러 가기 ♡','RETRY')}`,'lucky');
else if(state==='WIN'){shell(`<div class="eyebrow">CONGRATULATIONS</div><div class="win-star">★</div><h2>축하합니다!<br>1등 당첨!</h2><p>당첨 상품을 공개합니다...</p><div class="countdown" aria-live="polite">3</div>`,'lucky');[2,1].forEach((n,i)=>later(()=>root.querySelector('.countdown').textContent=n,C.timing.countdown_ms*(i+1)));later(()=>send('REVEAL'),C.timing.countdown_ms*3)}
else if(state==='BIRTHDAY_FINALE'){
shell(`<div class="party" aria-hidden="true">${Array.from({length:22},(_,i)=>`<i style="--x:${(i*47)%100}%;--delay:${i%6*.23}s;--color:${['#f287a7','#b2abf0','#f6ce62','#8ac9b3'][i%4]}"></i>`).join('')}<span class="balloon b1">●</span><span class="balloon b2">●</span></div><div class="eyebrow">A LITTLE SURPRISE, JUST FOR YOU</div><h1>${fmt(C.celebration_title)}</h1><p class="subtitle">${fmt(C.celebration_subtitle)}</p><div class="friends"><div class="friend side">${image('usagi_hands')}</div><div class="friend center">${image('character_trio')}</div><div class="friend side">${image('cheering_character')}</div></div><div class="gift" aria-label="열린 선물 상자"><span>🎁</span> 🎂</div><div class="warm"><p>${fmt(C.celebration_message)}</p>${C.celebration_message_extra?`<p class="warm-extra">${fmt(C.celebration_message_extra)}</p>`:''}</div><details class="friends-more"><summary>축하하러 온 친구들 ♡</summary><div>${image('usagi_back')}${image('white_character_pink')}${image('animated_line')}${C.assets.ditto?image('ditto'):''}</div></details><div class="final-actions">${button('축하 다시 보기','CELEBRATE')}${button('편지 다시 읽기','READ',true)}${button('처음부터 다시 하기','RESET',true)}</div>`,'finale');}
}
// The letter is a nested scene controller. All work shares the existing epoch timer guard.
const cinema = {blackout_ms:700,opening_durations_ms:[2600,3200,2800],pause_before_you_ms:1200,you_ms:1800,envelope_ms:2500,signature_pause_ms:1200,reward_delay_ms:1800,enable_stars:true,enable_envelope:true,...C.cinematic};
let letterPhase='idle', paragraphIndex=0, typing=false, charTimer=null, advanceTimer=null, lastTap=-Infinity, paragraphStarted=-Infinity;
const cancel=id=>{if(id!==null){clearTimeout(id);timers.delete(id)}};
function stars(){return cinema.enable_stars?`<div class="cosmos-stars" aria-hidden="true">${Array.from({length:24},(_,i)=>`<i style="--sx:${(i*37+11)%100}%;--sy:${(i*53+7)%100}%;--twinkle:${3+i%4}s;--lag:${i%7*.25}s"></i>`).join('')}</div>`:''}
function startCinematic(){
  letterPhase='opening';lastTap=-Infinity;
  shell(`<div class="cinema-backdrop" aria-hidden="true"></div>${stars()}<div class="birth-light" aria-hidden="true"></div><div class="cinema-label">광고 재생 중 <span>마음 제공 · 패러디</span></div><div class="cinema-stage"><p class="opening-copy" aria-live="polite"></p></div><button class="skip secondary" data-event="SKIP">오프닝 건너뛰기</button>`,'cinematic');
  if(replay){openEnvelope();return}
  root.dataset.act='blackout';later(()=>openingLine(0),cinema.blackout_ms);
}
function openingLine(i){
  const lines=cinema.opening_lines||['태초에 이 세상에 아무것도 없었다...','빛이 있으라.....','그 말의 끝에 한 존재가 태어났다....','바로','너!'];
  root.dataset.act=['dark','light','existence','pause','you'][i];
  const p=root.querySelector('.opening-copy');p.className='opening-copy'+(i===4?' you':'');p.textContent=lines[i]||'';
  // Replacing the node restarts only its CSS entrance; stars remain mounted.
  const fresh=p.cloneNode(true);p.replaceWith(fresh);
  if(i===3){later(()=>openingLine(4),800+cinema.pause_before_you_ms);return}
  const duration=i===4?cinema.you_ms:cinema.opening_durations_ms[i];
  later(()=>fresh.classList.add('leaving'),Math.max(0,duration-500));
  later(()=>i===4?openEnvelope():openingLine(i+1),duration);
}
function openEnvelope(){
  clear();letterPhase='envelope';root.dataset.act='envelope';
  const stage=root.querySelector('.cinema-stage');
  root.querySelector('.skip').textContent='편지 바로 읽기';
  if(!cinema.enable_envelope){showLetter();return}
  stage.innerHTML=`<div class="letter-envelope" role="img" aria-label="봉투가 열리며 편지가 펼쳐집니다" style="--envelope-time:${cinema.envelope_ms}ms"><div class="envelope-back"></div><div class="envelope-sheet"><span>To. ${esc(C.nickname)}</span></div><div class="envelope-front"></div><div class="envelope-flap"></div></div>`;
  later(showLetter,cinema.envelope_ms);
}
let followLetter=true, paperGesture=null, suppressPaperTapUntil=0;
function followPaper(){const paper=root.querySelector('.cinema-paper');if(paper&&followLetter&&!paperGesture)paper.scrollTop=paper.scrollHeight;}
function isBlankLetterTap(event){
  if(performance.now()<suppressPaperTapUntil)return false;
  return event.target.matches('.cinema-paper,.paragraph-window');
}
function bindPaperScroll(paper){
  paper.addEventListener('scroll',()=>{followLetter=paper.scrollHeight-paper.clientHeight-paper.scrollTop<40},{passive:true});
  paper.addEventListener('pointerdown',e=>{paperGesture={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false}},{passive:true});
  paper.addEventListener('pointermove',e=>{if(paperGesture&&e.pointerId===paperGesture.id&&Math.hypot(e.clientX-paperGesture.x,e.clientY-paperGesture.y)>10){paperGesture.moved=true;suppressPaperTapUntil=performance.now()+500}},{passive:true});
  const release=()=>{if(paperGesture?.moved)suppressPaperTapUntil=performance.now()+500;paperGesture=null;followLetter=paper.scrollHeight-paper.clientHeight-paper.scrollTop<40};
  paper.addEventListener('pointerup',release,{passive:true});paper.addEventListener('pointercancel',release,{passive:true});
}
function showLetter(){
  if(state!=='FAKE_AD_LETTER')return;
  clear();letterPhase='body';paragraphIndex=0;lastTap=-Infinity;followLetter=true;paperGesture=null;suppressPaperTapUntil=0;root.dataset.act='letter';
  root.querySelector('.cinema-stage').innerHTML=`<div class="cinema-paper" role="region" aria-label="너에게 쓰는 편지" tabindex="0"><div class="letter-heading">Dear. ${esc(C.nickname)}</div><div class="paragraph-counter" aria-live="off"></div><div class="paragraph-window"></div><div class="signature-spark" aria-hidden="true">✧</div><div class="letter-reward" aria-live="polite"></div></div><p class="cinema-hint">이전 문장은 스크롤해서 다시 읽을 수 있어요.</p><button class="letter-next secondary" data-event="LETTER_NEXT">지금 문장 완성</button>`;
  bindPaperScroll(root.querySelector('.cinema-paper'));
  const skip=root.querySelector('.skip');skip.hidden=false;skip.textContent='편지 전체 보기';typeParagraph(0);
}
function appendLetterParagraph(index){
  const previous=root.querySelector('.current-paragraph');if(previous)previous.classList.remove('current-paragraph');
  const p=document.createElement('p');p.className='letter-paragraph current-paragraph'+(index===C.letter_lines.length-1?' signature':'');
  root.querySelector('.paragraph-window').append(p);
  root.querySelector('.paragraph-counter').textContent=`${String(index+1).padStart(2,'0')} / ${String(C.letter_lines.length).padStart(2,'0')}`;
  root.querySelector('.cinema-paper').classList.toggle('signed',index===C.letter_lines.length-1);
  return p;
}
function updateLetterNext(){
  const next=root.querySelector('.letter-next');
  next.textContent=typing?'지금 문장 완성':'다음 문단';
  next.disabled=!typing&&paragraphIndex>=C.letter_lines.length-2;
}
function typeParagraph(index){
  cancel(charTimer);cancel(advanceTimer);charTimer=advanceTimer=null;
  if(index>=C.letter_lines.length){endLetter();return}
  paragraphIndex=index;paragraphStarted=performance.now();typing=true;letterPhase='body';
  const p=appendLetterParagraph(index);updateLetterNext();
  const chars=Array.from(C.letter_lines[index]);let n=0;
  finishLine=()=>{if(!typing)return;cancel(charTimer);typing=false;p.textContent=chars.join('');finishLine=null;followPaper();updateLetterNext();const signature=index===C.letter_lines.length-1;const wait=signature?cinema.reward_delay_ms:(index===C.letter_lines.length-2?cinema.signature_pause_ms:C.letter_pause_ms);advanceTimer=later(()=>typeParagraph(index+1),wait)};
  function tick(){if(!typing)return;p.textContent=chars.slice(0,++n).join('');followPaper();if(n>=chars.length)finishLine();else charTimer=later(tick,reduced?0:C.letter_char_ms)}tick();
}
function tapLetter(){
  if(state!=='FAKE_AD_LETTER'||letterPhase!=='body')return;
  const now=performance.now();if(now-lastTap<450||now-paragraphStarted<450)return;lastTap=now;
  if(typing&&finishLine){finishLine();return}
  if(paragraphIndex>=C.letter_lines.length-2)return;
  typeParagraph(paragraphIndex+1);
}
function endLetter(){
  clear();letterPhase='reward';typing=false;
  const reward=root.querySelector('.letter-reward');reward.innerHTML=`${replay?'':`<p class="reward-label">광고 시청 완료!<br><strong>추가 뽑기 기회 +1</strong></p>`}${button(replay?'피날레로 돌아가기':'선물 받으러 가기 🎁','LETTER_DONE')}`;
  root.querySelector('.skip').hidden=true;root.querySelector('.letter-next').hidden=true;followPaper();
}
function skipLetter(){
  if(letterPhase==='opening'||letterPhase==='envelope'){showLetter();return}
  if(letterPhase!=='body')return;
  if(typing&&finishLine)finishLine();clear();typing=false;
  for(let i=paragraphIndex+1;i<C.letter_lines.length;i++)appendLetterParagraph(i).textContent=C.letter_lines[i];
  paragraphIndex=C.letter_lines.length-1;endLetter();
}

// One bounded Canvas loop per celebration. Coordinates stay inside this iframe.
function startFireworks(){
  stopFireworks();fireworksRequested=false;
  if(reduced)return;
  const canvas=document.createElement('canvas');canvas.className='fireworks';canvas.setAttribute('aria-hidden','true');root.append(canvas);
  const ctx=canvas.getContext('2d');if(!ctx){canvas.remove();return}
  let frame=0,disposed=false,width=0,height=0,elapsed=0,lastTime=null,launchIndex=0;
  let rockets=[],particles=[];
  const palette=['#e978a3','#dda329','#a37bdd','#55b79c','#659fd1'];
  const sequence=[{at:0,x:.18,y:.28},{at:450,x:.5,y:.2},{at:950,x:.82,y:.32},{at:1800,x:.3,y:.24},{at:2400,x:.72,y:.18},{at:3150,x:.2,y:.3},{at:3220,x:.5,y:.16},{at:3290,x:.8,y:.27}];
  function resize(){const rect=root.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);width=rect.width;height=rect.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);rockets=[];particles=[];}
  function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);rockets=[];particles=[];canvas.remove();fireworksActive=false;}
  function visibility(){if(document.hidden){cancelAnimationFrame(frame);frame=0;lastTime=null}else if(!disposed&&!frame)frame=requestAnimationFrame(draw)}
  function burst(r){for(let i=0;i<36&&particles.length<180;i++){const angle=Math.PI*2*i/36,speed=45+Math.random()*65;particles.push({x:r.x,y:r.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,age:0,life:.9+Math.random()*.6,color:r.color})}}
  function draw(now){
    frame=0;if(disposed||document.hidden)return;
    const dt=lastTime===null?0:Math.min((now-lastTime)/1000,.04);lastTime=now;elapsed+=dt*1000;
    if(elapsed>=5500){dispose();return}
    ctx.clearRect(0,0,width,height);
    while(launchIndex<sequence.length&&elapsed>=sequence[launchIndex].at){const s=sequence[launchIndex++];rockets.push({x:width*s.x,y:height+8,target:height*s.y,color:palette[(launchIndex-1)%palette.length]})}
    rockets=rockets.filter(r=>{const oldY=r.y;r.y-=height*.92*dt;ctx.globalAlpha=.7;ctx.strokeStyle=r.color;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(r.x,oldY+15);ctx.lineTo(r.x,r.y);ctx.stroke();ctx.fillStyle=r.color;ctx.beginPath();ctx.arc(r.x,r.y,2,0,Math.PI*2);ctx.fill();if(r.y<=r.target){burst(r);return false}return true});
    particles=particles.filter(p=>{p.age+=dt;if(p.age>=p.life)return false;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=48*dt;ctx.globalAlpha=.95*(1-p.age/p.life);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,2.2,0,Math.PI*2);ctx.fill();return true});
    ctx.globalAlpha=1;frame=requestAnimationFrame(draw);
  }
  fireworksActive=true;stopFireworks=dispose;resize();window.addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);if(!document.hidden)frame=requestAnimationFrame(draw);
}

function send(event){
if(busy)return;
if(event==='RESET'&&state==='BIRTHDAY_FINALE'){replay=false;enter('INTRO');return}
if(state==='INTRO'&&event==='START')enter('SURVEY_Q1');
else if(state.startsWith('SURVEY_Q')&&event==='ANSWER'){busy=true;root.querySelectorAll('button').forEach(b=>b.disabled=true);let n=Number(state.slice(-1));later(()=>enter(n<3?'SURVEY_Q'+(n+1):'ANALYZING'),220)}
else if(state==='ANALYZING'&&event==='ANALYZED')enter('GACHA_FIRST');
else if(['GACHA_FIRST','GACHA_SECOND'].includes(state)&&event==='DRAW'){busy=true;root.querySelectorAll('button').forEach(b=>b.disabled=true);root.querySelector('.machine').classList.add('drawing');later(()=>enter(state==='GACHA_FIRST'?'LOSE':'WIN'),C.timing.gacha_ms)}
else if(state==='LOSE'&&event==='AD'){replay=false;enter('FAKE_AD_LETTER')}
else if(state==='LOSE'&&event==='GIVEUP')root.querySelector('#plea').textContent='잠깐! 여기까지 왔는데… 한 번만 더 믿어 줘 🥺';
else if(state==='FAKE_AD_LETTER'&&event==='SKIP')skipLetter();
else if(state==='FAKE_AD_LETTER'&&event==='LETTER_NEXT')tapLetter();
else if(state==='FAKE_AD_LETTER'&&event==='LETTER_DONE')enter(replay?'BIRTHDAY_FINALE':'GACHA_SECOND');
else if(state==='RETRY_READY'&&event==='RETRY')enter('GACHA_SECOND');
else if(state==='WIN'&&event==='REVEAL')enter('BIRTHDAY_FINALE');
else if(state==='BIRTHDAY_FINALE'&&event==='CELEBRATE'){if(fireworksActive)return;fireworksRequested=true;enter('BIRTHDAY_FINALE');}
else if(state==='BIRTHDAY_FINALE'&&event==='READ'){replay=true;enter('FAKE_AD_LETTER')}
}
function fail(){clear();root.className='survey';root.innerHTML='<div class="app-shell"><h2>잠깐, 설문지가 엉켰어요.</h2><p>새로고침하면 처음부터 다시 시작할 수 있어요.</p><button onclick="location.reload()">새로고침</button></div>'}
root.addEventListener('click',e=>{try{const b=e.target.closest('button[data-event]');if(b){send(b.dataset.event);return}if(isBlankLetterTap(e))tapLetter()}catch(error){console.error(error);fail()}});
root.addEventListener('keydown',e=>{if(e.target.matches('.cinema-paper')&&['Enter',' '].includes(e.key)){e.preventDefault();tapLetter()}});
window.addEventListener('error',e=>{if(e.error)fail()});
try{render()}catch(error){console.error(error);fail()}
