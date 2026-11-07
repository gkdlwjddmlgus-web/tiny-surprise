const root=document.getElementById('tiny-surprise');
if(root.dataset.ready) return;
root.dataset.ready='1';
const C=CONFIG, reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let state='INTRO', epoch=0, busy=false, replay=false, timers=new Set(), finishLine=null;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=s=>esc(s.replaceAll('{name}',C.friend_name).replaceAll('{nickname}',C.nickname));
const later=(fn,ms)=>{const e=epoch,id=setTimeout(()=>{timers.delete(id);if(e===epoch)fn()},ms);timers.add(id);return id};
function clear(){epoch++;timers.forEach(clearTimeout);timers.clear();busy=false;finishLine=null;}
const button=(text,event,secondary=false)=>`<button class="${secondary?'secondary':''}" data-event="${event}">${text}</button>`;
function image(key,cls=''){const path=C.assets[key];return path?`<img class="character ${cls}" src="app/static/${esc(path)}" alt="${({usagi_back:'뒤돌아본 우사기',usagi_front:'우사기',white_character_pink:'분홍 배경의 친구',character_trio:'세 친구',animated_line:'움직이는 장식',cheering_character:'응원하는 친구',usagi_hands:'축하하는 우사기',ditto:'메타몽'})[key]||'친구'}">`:`<span class="fallback ${cls}" role="img" aria-label="작은 친구">♡</span>`}
const machine=()=>`<div class="machine"><div class="machine-top">LUCKY CLUB <span>★</span></div><div class="globe"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="machine-base"><span class="dial">✳</span><span class="slot"></span></div><div class="capsule"></div></div>`;
function shell(body,theme='survey'){root.className=theme;root.innerHTML=`<div class="app-shell"><header><span>✳ TINY SURVEY</span><span class="edition">VOL. 001</span></header><section class="scene" tabindex="-1">${body}</section><footer>${theme==='finale'?'MADE WITH A WHOLE LOT OF ♡':'취향 수집소 · 아주 주관적인 분석'}</footer></div>`; root.querySelector('.scene').focus({preventScroll:true});root.querySelectorAll('img').forEach(img=>{img.onerror=()=>{const el=document.createElement('span');el.className=img.className+' fallback';el.textContent='♡';el.setAttribute('aria-label',img.alt);img.replaceWith(el)}})}
function enter(next){clear();state=next;render();}
function render(){
if(state==='INTRO')shell(`<div class="eyebrow">당신을 조금 더 알고 싶어서</div><div class="sticker">100%<br>주관적</div><h1>아주 간단한<br><span class="highlight">취향 설문</span></h1><p class="lead">당신의 취향을 분석해<br>특별한 결과를 보여드립니다!</p><div class="survey-art" aria-hidden="true"><span>?</span><span>✳</span><span>!</span></div><div class="note">딱 3문항 · 약 30초 · 정답 없음</div>${button('설문 시작하기 ▶','START')}<p class="fine">※ 결과가 너무 정확해도 놀라지 마세요.</p>`);
else if(state.startsWith('SURVEY_Q')){let i=Number(state.slice(-1))-1,q=C.questions[i];shell(`<div class="progress"><span style="width:${(i+1)/3*100}%"></span></div><div class="eyebrow">QUESTION 0${i+1} <span>/ 03</span></div><h2>${esc(q.title)}</h2><p class="muted">고민 말고, 지금 떠오르는 쪽으로!</p><div class="options">${q.options.map((o,j)=>button(`<small>0${j+1}</small> ${esc(o)} <span>↗</span>`,'ANSWER')).join('')}</div><div class="mini-star" aria-hidden="true">✳</div>`)}
else if(state==='ANALYZING'){shell(`<div class="spinner">✳</div><h2>취향을 모으는 중</h2><p id="analysis" aria-live="polite">고양이 친화도 분석 중...</p><div class="progress loading"><span></span></div><p class="fine">아주 진지하게 분석하고 있습니다.</p>`);later(()=>root.querySelector('#analysis').textContent='귀여운 것에 대한 반응 확인 중...',C.timing.analyzing_ms/3);later(()=>root.querySelector('#analysis').textContent='알 수 없는 행운 측정 중...',C.timing.analyzing_ms*2/3);later(()=>send('ANALYZED'),C.timing.analyzing_ms)}
else if(state==='GACHA_FIRST'||state==='GACHA_SECOND'){let second=state==='GACHA_SECOND';shell(`<div class="eyebrow">${second?'ONE MORE CHANCE':'당신의 취향 분석 완료'}</div><h2>${second?'이번엔 느낌이 좋은데?':'행운을 뽑아 보세요'}</h2><p class="muted">${second?'마음을 담아 한 번 더!':'당첨 확률 99.9% · 믿거나 말거나'}</p>${machine()}${button(second?'한 번 더 뽑기!':'결과 뽑기!','DRAW')}<p class="fine">${second?'이번 기회는 특별하니까 ♡':'결과는 열어 봐야 알죠.'}</p>`,second?'lucky':'survey')}
else if(state==='LOSE')shell(`<div class="eyebrow">이럴 수가...</div><div class="result-mark">꽝<span>…!</span></div><h2>0.1%의 주인공 등장</h2><p>당첨 확률이 99.9%였는데<br>이걸 실패한다고?</p><div class="ticket">그래도 특별히 추가 기회를 드립니다.</div>${button('광고 보고 재도전하기','AD')}${button('포기하기','GIVEUP',true)}<p id="plea" class="fine" aria-live="polite">조금만 더 하면 좋은 일이 생길지도?</p>`);
else if(state==='FAKE_AD_LETTER'){
shell(`<div class="ad-label">광고 재생 중... <span>마음 제공 · 패러디</span></div><div class="progress loading"><span></span></div><div class="letter-stage"><div class="envelope">✉</div><p>잠시 후 마음이 도착합니다.</p></div><button class="skip secondary" data-event="SKIP">편지 바로 펼치기</button>`,'letter');later(showLetter,C.timing.ad_ms)}
else if(state==='RETRY_READY')shell(`<div class="eyebrow">마음 충전 완료</div>${image('usagi_front','single')}<h2>행운도 다시 충전했어!</h2><p>자, 진짜 마지막 한 번.</p>${button('추가 기회로 뽑으러 가기 ♡','RETRY')}`,'lucky');
else if(state==='WIN'){shell(`<div class="eyebrow">CONGRATULATIONS</div><div class="win-star">★</div><h2>축하합니다!<br>1등 당첨!</h2><p>당첨 상품을 공개합니다...</p><div class="countdown" aria-live="polite">3</div>`,'lucky');[2,1].forEach((n,i)=>later(()=>root.querySelector('.countdown').textContent=n,C.timing.countdown_ms*(i+1)));later(()=>send('REVEAL'),C.timing.countdown_ms*3)}
else if(state==='BIRTHDAY_FINALE'){
shell(`<div class="party" aria-hidden="true">${Array.from({length:22},(_,i)=>`<i style="--x:${(i*47)%100}%;--delay:${i%6*.23}s;--color:${['#f287a7','#b2abf0','#f6ce62','#8ac9b3'][i%4]}"></i>`).join('')}<span class="balloon b1">●</span><span class="balloon b2">●</span></div><div class="eyebrow">A LITTLE SURPRISE, JUST FOR YOU</div><h1>${fmt(C.celebration_title)}</h1><p class="subtitle">${fmt(C.celebration_subtitle)}</p><div class="friends"><div class="friend side">${image('usagi_hands')}</div><div class="friend center">${image('character_trio')}</div><div class="friend side">${image('cheering_character')}</div></div><div class="gift" aria-label="열린 선물 상자"><span>🎁</span> 🎂</div><p class="warm">${fmt(C.celebration_message)}</p><details class="friends-more"><summary>축하하러 온 친구들 ♡</summary><div>${image('usagi_back')}${image('white_character_pink')}${image('animated_line')}${C.assets.ditto?image('ditto'):''}</div></details><div class="final-actions">${button('축하 다시 보기','CELEBRATE')}${button('편지 다시 읽기','READ',true)}${button('처음부터 다시 하기','RESET',true)}</div>`,'finale');}
}
function showLetter(){if(state!=='FAKE_AD_LETTER')return;clear();root.classList.add('dimmed');root.querySelector('.letter-stage').innerHTML=`<div class="paper" role="region" aria-label="너에게 쓰는 편지" tabindex="0"><div class="letter-heading">Dear. ${esc(C.nickname)} ♡</div><div id="lines"></div><div id="letter-end"></div></div><p class="tap-hint">편지 터치: 지금 문장 바로 읽기</p>`;root.querySelector('.skip').textContent='편지 전체 보기';typeLine(0)}
function typeLine(index){if(index>=C.letter_lines.length){endLetter();return}let p=document.createElement('p');p.className='letter-line';root.querySelector('#lines').append(p);const chars=Array.from(C.letter_lines[index]);let n=0,done=false;const complete=()=>{if(done)return;done=true;p.textContent=chars.join('');finishLine=null;later(()=>typeLine(index+1),C.letter_pause_ms)};finishLine=complete;function tick(){if(done)return;p.textContent=chars.slice(0,++n).join('');p.scrollIntoView({block:'nearest'});if(n>=chars.length)complete();else later(tick,reduced?0:C.letter_char_ms)}tick()}
function endLetter(){finishLine=null;root.querySelector('#letter-end').innerHTML=button(replay?'피날레로 돌아가기 ♡':'추가 기회 받기 ♡','LETTER_DONE');root.querySelector('.skip').hidden=true;}
function skipLetter(){if(!root.querySelector('#lines'))showLetter();clear();root.querySelector('#lines').innerHTML=C.letter_lines.map(s=>`<p class="letter-line">${esc(s)}</p>`).join('');endLetter()}
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
else if(state==='FAKE_AD_LETTER'&&event==='LETTER_DONE')enter(replay?'BIRTHDAY_FINALE':'RETRY_READY');
else if(state==='RETRY_READY'&&event==='RETRY')enter('GACHA_SECOND');
else if(state==='WIN'&&event==='REVEAL')enter('BIRTHDAY_FINALE');
else if(state==='BIRTHDAY_FINALE'&&event==='CELEBRATE')enter('BIRTHDAY_FINALE');
else if(state==='BIRTHDAY_FINALE'&&event==='READ'){replay=true;enter('FAKE_AD_LETTER')}
}
function fail(){clear();root.className='survey';root.innerHTML='<div class="app-shell"><h2>잠깐, 설문지가 엉켰어요.</h2><p>새로고침하면 처음부터 다시 시작할 수 있어요.</p><button onclick="location.reload()">새로고침</button></div>'}
root.addEventListener('click',e=>{try{const b=e.target.closest('button[data-event]');if(b){send(b.dataset.event);return}if(e.target.closest('.paper')&&finishLine)finishLine()}catch(error){console.error(error);fail()}});
window.addEventListener('error',e=>{if(e.error)fail()});
try{render()}catch(error){console.error(error);fail()}
