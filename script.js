/* ================= MATHSIDE DOWN ================= */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ---------- Data ----------
const LEVELS = [
  {id:'preschool',name:'Preschool',desc:'Ages 3-5 · + and -',emoji:' Nursery'},
  {id:'elementary',name:'Elementary',desc:'Ages 6-11 · + - × ÷',emoji:' School'},
  {id:'highschool',name:'High School',desc:'Ages 12-17 · algebra',emoji:' Lab'},
  {id:'college',name:'College',desc:'Ages 18+ · advanced',emoji:' University'}
];
const MAPS = [
  {id:'hawkins',name:'Hawkins Lab',desc:'Cold corridors',emoji:' Lab',theme:{wall:'#1a2438',floor:'#0a1020',acc:'#00f0ff'}},
  {id:'upside',name:'Upside Down Forest',desc:'Dark woods',emoji:' Forest',theme:{wall:'#1a2a1a',floor:'#0a140a',acc:'#39ff14'}},
  {id:'starcourt',name:'Starcourt Mall',desc:'Neon halls',emoji:' Mall',theme:{wall:'#2a1a2a',floor:'#140a14',acc:'#ff9f1c'}},
  {id:'russian',name:'Russian Base',desc:'Steel tunnels',emoji:' Base',theme:{wall:'#2a2a2a',floor:'#141414',acc:'#ff2a3d'}},
  {id:'creel',name:'Creel House',desc:'Haunted rooms',emoji:' House',theme:{wall:'#2a1a1a',floor:'#140a0a',acc:'#b3001b'}}
];
const CHARS = [
  {id:'eleven',name:'Eleven',emoji:' Girl',color:'#ff2a3d'},
  {id:'max',name:'Max',emoji:' Skate',color:'#ff9f1c'},
  {id:'mike',name:'Mike',emoji:' Bike',color:'#00f0ff'},
  {id:'dustin',name:'Dustin',emoji:' Cap',color:'#39ff14'},
  {id:'lucas',name:'Lucas',emoji:' Bandana',color:'#b3001b'},
  {id:'will',name:'Will',emoji:' Art',color:'#8a7fa0'}
];

// Maze layouts. Chars: # wall, space floor, S start, E exit, M math, Y mystery, G monster spawn
const MAZES = {
  hawkins:[
    '#############################',
    '#S    M         M         E #',
    '# ### # # # # # # # # # # # #',
    '#   # # # # # # # # # # # # #',
    '### # # # # # # # # # # # # #',
    '#   #   #   #   #   #   #   #',
    '# # ### ### ### ### ### # # #',
    '# #     #     #     #   #   #',
    '# ##### # ##### ##### # ### #',
    '#       M       M       M   #',
    '# ### ### # # # # # # # # # #',
    '#   #   #   #   #   #   #   #',
    '# ### ### ### ### ### ### # #',
    '#   M     Y               M #',
    '#############################',
  ],
  upside:[
    '#############################',
    '#S#   #   #   #   #   #   E #',
    '# # # # # # # # # # # # # # #',
    '#   #   #   #   #   #   #   #',
    '### ##### ##### ##### ##### #',
    '#     M     M     M     M   #',
    '# ### # ### # ### # ### # # #',
    '#   # #   # #   # #   # # # #',
    '### # ### # ### # ### # # # #',
    '#   #   M   M   M   M   # # #',
    '# # ### # # # # # # # # # # #',
    '#   #   #   #   #   #   # # #',
    '### # ### # ### # ### # # # #',
    '#   Y     G                 #',
    '#############################',
  ],
  starcourt:[
    '#############################',
    '#S  M   #     M     M     E #',
    '# ####### # # # # # # # # # #',
    '# #     # # # # # # # # # # #',
    '# # ### # # # # # # # # # # #',
    '#   # M #   #   #   #   #   #',
    '### # # ### # ### # ### # # #',
    '#   # #   # #   # #   # # # #',
    '# ### ### # # ### # ### # # #',
    '#     M     M     M     M   #',
    '### # ### # # # # # # # # # #',
    '#   #   #   #   #   #   # # #',
    '### # ### # ### # ### # # # #',
    '#   Y     G                 #',
    '#############################',
  ],
  russian:[
    '#############################',
    '#S# # # # # # # # # # # # E #',
    '# # # # # # # # # # # # # # #',
    '#   #   #   #   #   #   #   #',
    '### ##### ##### ##### ##### #',
    '#     M     M     M     M   #',
    '# ### # ### # ### # ### # # #',
    '#   # #   # #   # #   # # # #',
    '### # ### # ### # ### # # # #',
    '#   #   M   M   M   M   # # #',
    '# # ### # # # # # # # # # # #',
    '#   #   #   #   #   #   # # #',
    '### # ### # ### # ### # # # #',
    '#   Y     G                 #',
    '#############################',
  ],
  creel:[
    '#############################',
    '#S  #   M   M   M   M E # # #',
    '# # # # # # # # # # # # # # #',
    '# #   # #   #   #   #   # # #',
    '### ### ### ### ### ### # # #',
    '#   #   #   #   #   #   # # #',
    '# # # # # # # # # # # # # # #',
    '# #   #   #   #   #   # # # #',
    '### ##### ##### ##### ##### #',
    '#     M     M     M     M   #',
    '# # ### # # # # # # # # # # #',
    '#   #   #   #   #   #   # # #',
    '### # ### # ### # ### # # # #',
    '#   Y     G                 #',
    '#############################',
  ],
};

// ---------- State ----------
let state = 'intro';
let level = null, map = null, char = null;
let maze = null, rows=0, cols=0;
let player = {r:0,c:0};
let monsters = [];
let hearts = 3, maxHearts=5;
let score = 0;
let timeLeft = 120;
let timerInt = null;
let monsterInt = null;
let gameStart = 0;
let correctCount=0, wrongCount=0;
let seenStations = new Set();
let paused=false;
let qResolve=null;
let highScore = +localStorage.getItem('msd_best')||0;

// ---------- DOM helpers ----------
const $ = id => document.getElementById(id);
function show(id){document.querySelectorAll('.overlay,.qmodal').forEach(e=>{if(e.id===id)e.classList.remove('hidden');else if(e.classList.contains('overlay')||e.classList.contains('qmodal'))e.classList.add('hidden');});}
function hideAll(){document.querySelectorAll('.overlay,.qmodal').forEach(e=>e.classList.add('hidden'));}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),1600);}
function floatText(txt,color,x,y){const f=document.createElement('div');f.className='float';f.textContent=txt;f.style.color=color;f.style.left=x+'px';f.style.top=y+'px';document.querySelector('.stage').appendChild(f);setTimeout(()=>f.remove(),1000);}

// ---------- Canvas sizing ----------
function resize(){
  const dpr=window.devicePixelRatio||1;
  const rect=canvas.parentElement.getBoundingClientRect();
  canvas.width=Math.floor(rect.width*dpr);
  canvas.height=Math.floor(rect.height*dpr);
  canvas.style.width=rect.width+'px';
  canvas.style.height=rect.height+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener('resize',resize);

// ---------- Screens ----------
function renderLevelGrid(){
  const g=$('levelGrid'); g.innerHTML='';
  LEVELS.forEach(L=>{
    const c=document.createElement('div'); c.className='card'; c.dataset.id=L.id;
    c.innerHTML=`<div class="emoji">${L.emoji}</div><div class="name">${L.name}</div><div class="desc">${L.desc}</div>`;
    bindTap(c,()=>{level=L.id; document.querySelectorAll('#levelGrid .card').forEach(x=>x.classList.remove('sel')); c.classList.add('sel'); setTimeout(()=>show('mapScreen'),250);});
    g.appendChild(c);
  });
}
function renderMapGrid(){
  const g=$('mapGrid'); g.innerHTML='';
  MAPS.forEach(M=>{
    const c=document.createElement('div'); c.className='card'; c.dataset.id=M.id;
    c.innerHTML=`<div class="emoji">${M.emoji}</div><div class="name">${M.name}</div><div class="desc">${M.desc}</div>`;
    bindTap(c,()=>{map=M.id; document.querySelectorAll('#mapGrid .card').forEach(x=>x.classList.remove('sel')); c.classList.add('sel'); setTimeout(()=>show('charScreen'),250);});
    g.appendChild(c);
  });
}
function renderCharGrid(){
  const g=$('charGrid'); g.innerHTML='';
  CHARS.forEach(C=>{
    const c=document.createElement('div'); c.className='card'; c.dataset.id=C.id;
    c.innerHTML=`<div class="emoji">${C.emoji}</div><div class="name">${C.name}</div>`;
    bindTap(c,()=>{char=C.id; document.querySelectorAll('#charGrid .card').forEach(x=>x.classList.remove('sel')); c.classList.add('sel');});
    g.appendChild(c);
  });
  // default select first
  const first=g.querySelector('.card'); if(first){first.classList.add('sel'); char=CHARS[0].id;}
}

// ---------- Math questions ----------
function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function genQuestion(){
  const L=level;
  let q,ans;
  if(L==='preschool'){
    if(Math.random()<0.5){const a=rnd(1,9),b=rnd(1,9-a>0?9-a:1);q=`${a} + ${b} = ?`;ans=a+b;}
    else{const a=rnd(2,10),b=rnd(1,a-1);q=`${a} - ${b} = ?`;ans=a-b;}
  } else if(L==='elementary'){
    const t=rnd(0,3);
    if(t===0){const a=rnd(1,20),b=rnd(1,20);q=`${a} + ${b} = ?`;ans=a+b;}
    else if(t===1){const a=rnd(5,30),b=rnd(1,a-1);q=`${a} - ${b} = ?`;ans=a-b;}
    else if(t===2){const a=rnd(2,12),b=rnd(2,12);q=`${a} × ${b} = ?`;ans=a*b;}
    else{const b=rnd(2,12),ansv=rnd(2,12);const a=b*ansv;q=`${a} ÷ ${b} = ?`;ans=ansv;}
  } else if(L==='highschool'){
    const t=rnd(0,3);
    if(t===0){const x=rnd(1,15),a=rnd(1,20);q=`x + ${a} = ${x+a}. x = ?`;ans=x;}
    else if(t===1){const x=rnd(2,12);q=`${x}² = ?`;ans=x*x;}
    else if(t===2){const a=rnd(2,9),b=rnd(2,9);q=`${a} + ${b} × 2 = ?`;ans=a+b*2;}
    else{const pct=rnd(10,50);const base=rnd(20,100);q=`${pct}% of ${base} = ?`;ans=Math.round(base*pct/100);}
  } else {
    const t=rnd(0,3);
    if(t===0){const x=rnd(2,12);q=`√${x*x} = ?`;ans=x;}
    else if(t===1){const x=rnd(1,8),a=rnd(1,10),b=rnd(1,10);const res=x*x+a*x+b; q=`If f(x)=x²+${a}x+${b}, f(${x})=?`;ans=res;}
    else if(t===2){const a=rnd(2,6),b=rnd(2,6);q=`(${a}+${b})² = ?`;ans=(a+b)*(a+b);}
    else{const x=rnd(2,9);q=`2^${x} = ?`;ans=Math.pow(2,x);}
  }
  // distractors
  const opts=new Set([ans]);
  let guard=0;
  while(opts.size<4 && guard<50){guard++;const d=ans+rnd(-6,6);if(d!==ans && d>=0)opts.add(d);}
  while(opts.size<4){opts.add(rnd(0,99));}
  const arr=[...opts].sort(()=>Math.random()-0.5);
  return {q,ans,opts:arr};
}

function askQuestion(typeLabel, onResult){
  const Q=genQuestion();
  $('qtype').textContent=typeLabel||'MATH CHALLENGE';
  $('qtext').textContent=Q.q;
  const o=$('qopts'); o.innerHTML='';
  Q.opts.forEach(v=>{
    const b=document.createElement('button'); b.className='qopt'; b.textContent=v;
    bindTap(b,()=>{
      document.querySelectorAll('.qopt').forEach(x=>x.style.pointerEvents='none');
      if(v===Q.ans){b.classList.add('correct'); onResult(true,v);}
      else{b.classList.add('wrong'); document.querySelectorAll('.qopt').forEach(x=>{if(+x.textContent===Q.ans)x.classList.add('correct');}); onResult(false,v);}
    });
    o.appendChild(b);
  });
  $('qmodal').classList.remove('hidden');
}

// ---------- Game init ----------
function startGame(){
  const mazeStr=MAZES[map];
  maze=mazeStr.map(r=>r.split(''));
  rows=maze.length; cols=maze[0].length;
  // find start/exit/spawns
  monsters=[]; seenStations=new Set();
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    if(maze[r][c]==='S'){player={r,c};maze[r][c]=' ';}
    if(maze[r][c]==='G'){monsters.push({r,c,cd:0});maze[r][c]=' ';}
  }
  hearts=3; score=0; correctCount=0; wrongCount=0;
  const times={preschool:180,elementary:150,highschool:120,college:90};
  timeLeft=times[level]||120;
  maxHearts=5;
  paused=false;
  hideAll();
  resize();
  updateHUD();
  gameStart=Date.now();
  clearInterval(timerInt); clearInterval(monsterInt);
  timerInt=setInterval(tickTimer,1000);
  monsterInt=setInterval(tickMonsters,850);
  requestAnimationFrame(render);
  toast('ESCAPE THE UPSIDE DOWN');
}

function updateHUD(){
  $('hearts').textContent='♥'.repeat(Math.max(0,hearts))+'♡'.repeat(Math.max(0,maxHearts-hearts));
  $('timer').textContent=Math.ceil(timeLeft);
  $('score').textContent=score;
}

function tickTimer(){
  if(paused||state!=='play')return;
  timeLeft-=1;
  if(timeLeft<=0){timeLeft=0;updateHUD();gameOver(false,'Time ran out');return;}
  updateHUD();
  if(timeLeft<=15) toast('HURRY!');
}

function tickMonsters(){
  if(paused||state!=='play')return;
  monsters.forEach(m=>{
    // move one step toward player
    const dr=player.r-m.r, dc=player.c-m.c;
    let nr=m.r, nc=m.c;
    if(Math.abs(dr)>=Math.abs(dc)){ nr += dr>0?1:-1; } else { nc += dc>0?1:-1; }
    if(nr>=0&&nr<rows&&nc>=0&&nc<cols&&maze[nr][nc]!=='#'){m.r=nr;m.c=nc;}
    else {
      // try other axis
      if(Math.abs(dc)>Math.abs(dr)){ nr=m.r+(dr>0?1:-1); nc=m.c; if(nr>=0&&nr<rows&&nc>=0&&nc<cols&&maze[nr][nc]!=='#'){m.r=nr;m.c=nc;} }
    }
    // collision
    if(m.r===player.r && m.c===player.c){
      damagePlayer('Caught by Demogorgon!');
      // push monster back to a spawn-ish
      m.r=Math.max(1,Math.min(rows-2,m.r-2));
    }
  });
}

function damagePlayer(reason){
  hearts=Math.max(0,hearts-1);
  updateHUD();
  const rect=canvas.getBoundingClientRect();
  const ts=tileSize();
  floatText('-1 ♥','#ff2a3d', rect.left + player.c*ts + ts/2 - 10, rect.top + player.r*ts);
  toast(reason);
  if(hearts<=0){gameOver(false,'No hearts left');}
}

function tileSize(){
  const r=canvas.getBoundingClientRect();
  return Math.floor(Math.min(r.width/cols, r.height/rows));
}

function movePlayer(dr,dc){
  if(paused||state!=='play')return;
  const nr=player.r+dr, nc=player.c+dc;
  if(nr<0||nr>=rows||nc<0||nc>=cols)return;
  if(maze[nr][nc]==='#')return;
  player.r=nr; player.c=nc;
  const tile=maze[nr][nc];
  if(tile==='M'){handleStation('math',nr,nc);}
  else if(tile==='Y'){handleStation('mystery',nr,nc);}
  else if(tile==='E'){gameOver(true,'You reached the exit!');}
}

function handleStation(kind,r,c){
  const key=r+','+c;
  if(seenStations.has(key)){maze[r][c]=' ';return;}
  paused=true;
  const label = kind==='mystery' ? 'MYSTERY STATION' : 'MATH STATION';
  askQuestion(label, (ok)=>{
    $('qmodal').classList.add('hidden');
    paused=false;
    if(ok){
      correctCount++;
      score += kind==='mystery'? 80 : 30;
      if(kind==='mystery' && hearts<maxHearts){hearts++; toast('Extra heart earned!');}
      seenStations.add(key);
      maze[r][c]=' ';
      const rect=canvas.getBoundingClientRect();
      const ts=tileSize();
      floatText('+'+(kind==='mystery'?80:30),'#39ff14',rect.left+c*ts+ts/2-12,rect.top+r*ts);
      toast(kind==='mystery'?'Mystery solved! +80':'Correct! Door opened');
      updateHUD();
    } else {
      wrongCount++;
      damagePlayer('Wrong answer');
      // regenerate a new question on retry by keeping station; but avoid infinite loop: allow move away
    }
  });
}

function gameOver(win,reason){
  state='result';
  clearInterval(timerInt); clearInterval(monsterInt);
  timerInt=null; monsterInt=null;
  const timeTaken=Math.round((Date.now()-gameStart)/1000);
  let finalScore=score + (win?200:0) + hearts*20 + Math.max(0,Math.round(timeLeft));
  if(win){ finalScore+=100; }
  if(finalScore>highScore){highScore=finalScore;localStorage.setItem('msd_best',highScore);}
  $('resultTitle').textContent=win?'VICTORY':'GAME OVER';
  $('resultSub').textContent=reason;
  $('resultScore').textContent=finalScore;
  const list=$('resultList'); list.innerHTML='';
  const rows=[
    ['Status', win?'Escaped':'Trapped'],
    ['Correct', correctCount],
    ['Wrong', wrongCount],
    ['Hearts left', hearts],
    ['Time left', Math.ceil(timeLeft)+'s'],
    ['Time taken', timeTaken+'s'],
    ['Best score', highScore]
  ];
  rows.forEach(([k,v])=>{const r=document.createElement('div');r.className='res-row';r.innerHTML=`<span class="k">${k}</span><span class="v">${v}</span>`;list.appendChild(r);});
  show('resultScreen');
}

// ---------- Rendering ----------
function render(){
  const _r=canvas.getBoundingClientRect();
  if(state!=='play' && state!=='paused'){ ctx.fillStyle='#05030a'; ctx.fillRect(0,0,_r.width,_r.height); return requestAnimationFrame(render); }
  if(!maze){ ctx.fillStyle='#05030a'; ctx.fillRect(0,0,_r.width,_r.height); return requestAnimationFrame(render); }
  const r=canvas.getBoundingClientRect();
  const ts=tileSize();
  const offX=(r.width-cols*ts)/2, offY=(r.height-rows*ts)/2;
  ctx.fillStyle='#05030a'; ctx.fillRect(0,0,r.width,r.height);
  const m=MAPS.find(x=>x.id===map);
  const theme=m.theme;
  // draw tiles
  for(let rr=0;rr<rows;rr++)for(let c=0;c<cols;c++){
    const t=maze[rr][c];
    const x=offX+c*ts, y=offY+rr*ts;
    if(t==='#'){
      ctx.fillStyle=theme.wall; ctx.fillRect(x,y,ts,ts);
      ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.strokeRect(x,y,ts,ts);
      // brick detail
      ctx.fillStyle='rgba(0,0,0,0.25)';
      if((rr+c)%2===0) ctx.fillRect(x+2,y+2,ts-4,ts/2-2);
    } else {
      ctx.fillStyle=theme.floor; ctx.fillRect(x,y,ts,ts);
      if(t==='M'){
        ctx.fillStyle=theme.acc; ctx.globalAlpha=0.25; ctx.fillRect(x+2,y+2,ts-4,ts-4); ctx.globalAlpha=1;
        ctx.fillStyle=theme.acc; ctx.font=`bold ${Math.floor(ts*0.5)}px monospace`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('?',x+ts/2,y+ts/2);
      } else if(t==='Y'){
        ctx.fillStyle='#ff9f1c'; ctx.globalAlpha=0.3; ctx.fillRect(x+2,y+2,ts-4,ts-4); ctx.globalAlpha=1;
        ctx.fillStyle='#ff9f1c'; ctx.font=`bold ${Math.floor(ts*0.5)}px monospace`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('★',x+ts/2,y+ts/2);
      } else if(t==='E'){
        ctx.fillStyle='#39ff14'; ctx.globalAlpha=0.35; ctx.fillRect(x+2,y+2,ts-4,ts-4); ctx.globalAlpha=1;
        ctx.fillStyle='#39ff14'; ctx.font=`bold ${Math.floor(ts*0.45)}px monospace`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('EXIT',x+ts/2,y+ts/2);
      }
    }
  }
  // monsters
  monsters.forEach(m=>{
    const x=offX+m.c*ts, y=offY+m.r*ts;
    ctx.fillStyle='#ff0033'; ctx.shadowColor='#ff0033'; ctx.shadowBlur=12;
    ctx.beginPath(); ctx.arc(x+ts/2,y+ts/2,ts*0.38,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle='#000'; ctx.font=`bold ${Math.floor(ts*0.4)}px monospace`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('D',x+ts/2,y+ts/2);
  });
  // player
  const ch=CHARS.find(x=>x.id===char);
  const px=offX+player.c*ts, py=offY+player.r*ts;
  ctx.fillStyle=ch.color; ctx.shadowColor=ch.color; ctx.shadowBlur=14;
  ctx.beginPath(); ctx.arc(px+ts/2,py+ts/2,ts*0.4,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur=0;
  ctx.fillStyle='#fff'; ctx.font=`bold ${Math.floor(ts*0.45)}px monospace`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(ch.name[0],px+ts/2,py+ts/2);
  requestAnimationFrame(render);
}

// ---------- Input ----------
function handleDir(d){
  if(d==='up')movePlayer(-1,0);
  if(d==='down')movePlayer(1,0);
  if(d==='left')movePlayer(0,-1);
  if(d==='right')movePlayer(0,1);
}
function bindTap(el, fn){
  const fire=(e)=>{ if(e){e.preventDefault();} try{fn();}catch(err){window.onerror(err.message);} };
  el.addEventListener('click', fire);
  el.addEventListener('touchstart', fire, {passive:false});
}
function bindDir(btn, dir){
  const fire=(e)=>{ if(e){e.preventDefault();} try{handleDir(dir);}catch(err){window.onerror(err.message);} };
  btn.addEventListener('click', fire);
  btn.addEventListener('touchstart', fire, {passive:false});
}
bindDir($('upBtn'),'up');
bindDir($('downBtn'),'down');
bindDir($('leftBtn'),'left');
bindDir($('rightBtn'),'right');
$('actionBtn').onclick=()=>{ if(state==='play'){paused=!paused; if(paused)show('pauseScreen'); else hideAll();} };

document.addEventListener('keydown',e=>{
  if(state!=='play')return;
  if(e.key==='ArrowUp')handleDir('up');
  if(e.key==='ArrowDown')handleDir('down');
  if(e.key==='ArrowLeft')handleDir('left');
  if(e.key==='ArrowRight')handleDir('right');
  if(e.key==='Escape'||e.key==='p'){paused=!paused;if(paused)show('pauseScreen');else hideAll();}
});

// swipe
let touchStart=null;
canvas.addEventListener('touchstart',e=>{const t=e.touches[0];touchStart={x:t.clientX,y:t.clientY}; e.preventDefault();},{passive:false});
canvas.addEventListener('touchend',e=>{
  if(!touchStart)return;
  const t=e.changedTouches[0];
  const dx=t.clientX-touchStart.x, dy=t.clientY-touchStart.y;
  if(Math.abs(dx)>15 || Math.abs(dy)>15){
    if(Math.abs(dx)>Math.abs(dy)){ if(dx>0)handleDir('right'); else handleDir('left'); }
    else { if(dy>0)handleDir('down'); else handleDir('up'); }
  } else {
    // tap-to-move: move one step toward tapped tile
    const rect=canvas.getBoundingClientRect();
    const ts=tileSize();
    const offX=(rect.width-cols*ts)/2, offY=(rect.height-rows*ts)/2;
    const c=Math.floor((t.clientX-rect.left-offX)/ts);
    const r=Math.floor((t.clientY-rect.top-offY)/ts);
    if(r>=0&&r<rows&&c>=0&&c<cols){
      const dr = r-player.r, dc = c-player.c;
      if(Math.abs(dr)>=Math.abs(dc)){
        if(dr>0) handleDir('down'); else if(dr<0) handleDir('up');
      } else {
        if(dc>0) handleDir('right'); else if(dc<0) handleDir('left');
      }
    }
  }
  touchStart=null;
  e.preventDefault();
},{passive:false});
canvas.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});

// ---------- Wiring ----------
bindTap($('introNext'),()=>{state='level';show('levelScreen');});
bindTap($('charStart'),()=>{ if(!char){char=CHARS[0].id;} state='play'; startGame(); });
bindTap($('resumeBtn'),()=>{paused=false;hideAll();});
bindTap($('quitBtn'),quitToMenu);
bindTap($('quitGameBtn'),()=>{ if(confirm('Quit game?')) quitToMenu(); });
bindTap($('pauseBtn'),()=>{ if(state==='play'){paused=!paused;if(paused)show('pauseScreen');else hideAll();} });
bindTap($('replayBtn'),()=>{ state='play'; startGame(); });
bindTap($('menuBtn'),quitToMenu);

function quitToMenu(){
  clearInterval(timerInt); clearInterval(monsterInt);
  timerInt=null; monsterInt=null;
  state='intro';
  show('introScreen');
}

// init grids
renderLevelGrid(); renderMapGrid(); renderCharGrid();

// fallback: tap anywhere to advance from intro
document.addEventListener('touchstart', (e)=>{ if(state==='intro'){ state='level'; show('levelScreen'); } }, {passive:true});

// initial
resize();
show('introScreen');
state='intro';
