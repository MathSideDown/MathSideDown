/* ================= MATHSIDE DOWN ================= */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ---------- Background music ----------
const MUSIC_VOL = 0.35;
const MUSIC_DUCK_VOL = 0.08; // how low the music dips while a sound effect plays
const bgMusic = new Audio('assets/sounds/bgmusic.mp3');
bgMusic.loop = true;
bgMusic.volume = MUSIC_VOL;
bgMusic.preload = 'auto';
bgMusic.addEventListener('error', () => {
  console.error('[MathSide Down] Background music failed to load:', bgMusic.currentSrc || bgMusic.src);
});
let musicMuted = localStorage.getItem('msd_music_muted') === '1';
let duckCount = 0;
function applyMusicVolume(){
  if(musicMuted)return;
  bgMusic.volume = duckCount > 0 ? MUSIC_DUCK_VOL : MUSIC_VOL;
}
function duckMusicStart(){ duckCount++; applyMusicVolume(); }
function duckMusicEnd(){ duckCount = Math.max(0, duckCount-1); applyMusicVolume(); }
const musicBtn = document.getElementById('musicToggle');
function updateMusicBtn(){
  if(!musicBtn)return;
  musicBtn.textContent = musicMuted ? '♪ Off' : '♪ Music';
  musicBtn.classList.toggle('music-off', musicMuted);
}
function tryStartMusic(){
  if(musicMuted) return;
  bgMusic.play().catch(()=>{});
}
updateMusicBtn();
// Browsers block autoplay until a user gesture. Phones suppress 'click' on buttons that use
// touchstart+preventDefault, so listen to several gesture events and keep retrying until it plays.
const UNLOCK_EVENTS = ['pointerup','touchend','click','keydown'];
function unlockMusic(e){
  // Let the Music toggle's own click handler control its on/off state.
  if(e && e.target && e.target.closest && e.target.closest('#musicToggle')) return;
  if(musicMuted) return;
  bgMusic.play().then(()=>{
    UNLOCK_EVENTS.forEach(ev=>document.removeEventListener(ev, unlockMusic, true));
  }).catch(err=>console.warn('[MathSide Down] Music could not start yet:', err));
}
UNLOCK_EVENTS.forEach(ev=>document.addEventListener(ev, unlockMusic, true));
if(musicBtn){
  musicBtn.addEventListener('click', ()=>{
    musicMuted = !musicMuted;
    localStorage.setItem('msd_music_muted', musicMuted ? '1' : '0');
    if(musicMuted) bgMusic.pause(); else { bgMusic.play().catch(()=>{}); applyMusicVolume(); }
    updateMusicBtn();
  });
}

// ---------- Sound effects (duck the music while they play) ----------
function makeSfx(src, volume){
  const base = new Audio(src);
  base.volume = volume;
  base.preload = 'auto';
  base.addEventListener('error', () => {
    console.error('[MathSide Down] Sound effect failed to load:', src);
  });
  return function(){
    try{
      const s = base.cloneNode(true);
      s.volume = base.volume;
      duckMusicStart();
      let settled = false;
      const finish = ()=>{ if(settled)return; settled = true; duckMusicEnd(); };
      s.addEventListener('ended', finish);
      s.addEventListener('error', finish);
      setTimeout(finish, 2000); // safety net in case 'ended' never fires
      s.play().catch(err=>{ console.warn('[MathSide Down] Sound blocked:', src, err); finish(); });
    }catch(e){}
  };
}
const playUiClick = makeSfx('assets/sounds/click.ogg', 1.0);
const playCorrect = makeSfx('assets/sounds/correct.mp3', 1.0);
const playWrong = makeSfx('assets/sounds/wrong.mp3', 1.0);

let lastClickSfx = 0;
function sfxButtonClick(e){
  if(!e.target.closest || !e.target.closest('button')) return;
  const now = performance.now();
  if(now - lastClickSfx < 150) return; // pointerup + click would otherwise double-fire
  lastClickSfx = now;
  playUiClick();
}
document.addEventListener('pointerup', sfxButtonClick, true);
document.addEventListener('click', sfxButtonClick, true);

// ---------- Data ----------
const LEVELS = [
  {id:'preschool',name:'Nursery',desc:'Ages 3-5 · + and -',emoji:' Nursery'},
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
const THEMES={
  hawkins:{wall:'#4a4863',floor:'#18100f',acc:'#ff2a3d'},
  upside:{wall:'#3d4a44',floor:'#0f1512',acc:'#ff3b50'},
  starcourt:{wall:'#5a4560',floor:'#150d16',acc:'#ff9f1c'},
  russian:{wall:'#565b64',floor:'#121316',acc:'#ff2a3d'},
  creel:{wall:'#5a403f',floor:'#120b0b',acc:'#ff3b50'}
};
MAPS.forEach(m=>Object.assign(m.theme,THEMES[m.id]));
const DIFF = {
  preschool :{w:35,h:21,hearts:4,mons:1,stepMs:1250,iq:1,speed:1,sight:5,  acc:.65,grace:6000,stun:5000,stepSec:.85,qSec:7,  bonus:6,label:'Nursery'},
  elementary:{w:45,h:27,hearts:3,mons:2,stepMs:900, iq:2,speed:2,sight:9,  acc:.85,grace:4500,stun:4000,stepSec:.65,qSec:6,  bonus:5,label:'Elementary'},
  highschool:{w:57,h:33,hearts:3,mons:3,stepMs:580, iq:3,speed:3,sight:16, acc:.95,grace:3500,stun:3000,stepSec:.55,qSec:5,  bonus:4,label:'High School'},
  college   :{w:71,h:41,hearts:3,mons:4,stepMs:460, iq:4,speed:4,sight:999,acc:1,  grace:2500,stun:2000,stepSec:.45,qSec:4.5,bonus:3,label:'College'}
};
const DIRS4=[[-1,0],[1,0],[0,-1],[0,1]];
const STYLE = {
  hawkins  :{straight:.75,braid:.30,rooms:3},
  upside   :{straight:.15,braid:.10,rooms:2},
  starcourt:{straight:.50,braid:.45,rooms:8},
  russian  :{straight:.92,braid:.20,rooms:3},
  creel    :{straight:.35,braid:.25,rooms:6}
};
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function bfsGrid(g,R,C,sr,sc){
  const d=new Int32Array(R*C).fill(-1), q=[sr*C+sc]; d[q[0]]=0;
  for(let i=0;i<q.length;i++){
    const cur=q[i], r=(cur/C)|0, c=cur%C;
    for(const [dr,dc] of DIRS4){
      const nr=r+dr, nc=c+dc; if(nr<0||nc<0||nr>=R||nc>=C||g[nr][nc]==='#')continue;
      const k=nr*C+nc; if(d[k]<0){d[k]=d[cur]+1;q.push(k);}
    }
  }
  return d;
}
function genMaze(mapId,W,H,nMons,rng){
  const st=STYLE[mapId]||STYLE.hawkins;
  const g=Array.from({length:H},()=>Array(W).fill('#'));
  const rint=(a,b)=>a+Math.floor(rng()*(b-a+1));
  const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const D2=[[-2,0],[2,0],[0,-2],[0,2]]; g[1][1]=' ';
  const stack=[[1,1,-1]];
  while(stack.length){
    const [r,c,ld]=stack[stack.length-1], opts=[];
    D2.forEach(([dr,dc],i)=>{const nr=r+dr,nc=c+dc; if(nr>0&&nc>0&&nr<H-1&&nc<W-1&&g[nr][nc]==='#')opts.push(i);});
    if(!opts.length){stack.pop();continue;}
    const d=(opts.includes(ld)&&rng()<st.straight)?ld:opts[Math.floor(rng()*opts.length)];
    const [dr,dc]=D2[d]; g[r+dr/2][c+dc/2]=' '; g[r+dr][c+dc]=' '; stack.push([r+dr,c+dc,d]);
  }
  for(let r=1;r<H-1;r+=2)for(let c=1;c<W-1;c+=2){
    if(DIRS4.filter(([a,b])=>g[r+a][c+b]===' ').length!==1||rng()>=st.braid)continue;
    const w=DIRS4.filter(([a,b])=>{const x=r+a*2,y=c+b*2;return x>0&&y>0&&x<H-1&&y<W-1&&g[r+a][c+b]==='#';});
    if(w.length){const [a,b]=w[Math.floor(rng()*w.length)];g[r+a][c+b]=' ';}
  }
  const nRooms=Math.round(st.rooms*W*H/1100);
  for(let i=0;i<nRooms;i++){
    const rh=rint(1,2)*2+1, rw=rint(1,3)*2+1;
    const r0=rint(0,(H-2-rh)>>1)*2+1, c0=rint(0,(W-2-rw)>>1)*2+1;
    for(let r=r0;r<r0+rh&&r<H-1;r++)for(let c=c0;c<c0+rw&&c<W-1;c++)g[r][c]=' ';
  }
  const key=(r,c)=>r*W+c;
  const dS=bfsGrid(g,H,W,1,1), dE=bfsGrid(g,H,W,H-2,W-2), pathLen=dS[key(H-2,W-2)];
  const free=[]; for(let r=1;r<H-1;r++)for(let c=1;c<W-1;c++)if(g[r][c]===' ')free.push([r,c]);
  const taken=[[1,1],[H-2,W-2]];
  const spot=(r,c,gap)=>g[r][c]===' '&&dS[key(r,c)]>=5&&dE[key(r,c)]>=3&&taken.every(([a,b])=>Math.abs(a-r)+Math.abs(b-c)>=gap);
  const put=(r,c,ch)=>{g[r][c]=ch;taken.push([r,c]);};
  const path=[]; {let r=1,c=1; while(dE[key(r,c)]>0){path.push([r,c]);for(const [a,b] of DIRS4){if(g[r+a][c+b]!=='#'&&dE[key(r+a,c+b)]===dE[key(r,c)]-1){r+=a;c+=b;break;}}}}
  const nMath=Math.max(6,Math.min(40,Math.round(free.length/45)));
  const onPath=Math.round(nMath*.6); let placed=0;
  for(let i=1;i<=onPath;i++){const base=Math.round(path.length*i/(onPath+1));for(const o of [0,1,-1,2,-2,3,-3]){const p=path[base+o]; if(p&&spot(p[0],p[1],4)){put(p[0],p[1],'M');placed++;break;}}}
  const cand=shuf(free.slice());
  for(const [r,c] of cand){if(placed>=nMath)break; if(spot(r,c,5)){put(r,c,'M');placed++;}}
  const nMys=Math.max(2,Math.round(nMath/4)); let ys=0;
  const dead=shuf(free.filter(([r,c])=>DIRS4.filter(([a,b])=>g[r+a][c+b]!=='#').length===1&&dS[key(r,c)]>=12));
  for(const [r,c] of dead){if(ys>=nMys)break; if(spot(r,c,8)){put(r,c,'Y');ys++;}}
  for(const [r,c] of cand){if(ys>=nMys)break; if(dS[key(r,c)]>=12&&spot(r,c,8)){put(r,c,'Y');ys++;}}
  const far=shuf(free.filter(([r,c])=>g[r][c]===' '&&dS[key(r,c)]>=pathLen*.4&&dE[key(r,c)]>=3)), ms=[];
  for(const gap of [10,6,3,1])for(const [r,c] of far){
    if(ms.length>=nMons)break;
    if(g[r][c]===' '&&ms.every(([a,b])=>Math.abs(a-r)+Math.abs(b-c)>=gap)){g[r][c]='G';ms.push([r,c]);}
  }
  g[1][1]='S'; g[H-2][W-2]='E';
  return {rows:g.map(r=>r.join('')),pathLen,nMath:placed};
}

// ---------- Safe storage ----------
const _mem={};
const store={
  get(k){try{return localStorage.getItem(k);}catch(e){return k in _mem?_mem[k]:null;}},
  set(k,v){try{localStorage.setItem(k,v);}catch(e){_mem[k]=String(v);}},
  remove(k){try{localStorage.removeItem(k);}catch(e){delete _mem[k];}}
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
let spawns=[], exitPos={r:0,c:0}, distExit=null;
let noise=null, invulnUntil=0, lastAlert=0, lastMT=0, rendering=false;
let pdir={r:0,c:1};
const pv={r:0,c:0};
const view={ts:16,offX:0,offY:0,cx:0,cy:0,vc:1,vr:1,snap:true};
let highScore = +store.get('msd_best')||0;

// ---------- DOM helpers ----------
const $ = id => document.getElementById(id);
function show(id){document.querySelectorAll('.overlay,.qmodal').forEach(e=>{if(e.id===id)e.classList.remove('hidden');else if(e.classList.contains('overlay')||e.classList.contains('qmodal'))e.classList.add('hidden');});}
function hideAll(){document.querySelectorAll('.overlay,.qmodal').forEach(e=>e.classList.add('hidden'));}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),1600);}
function floatText(txt,color,x,y){const f=document.createElement('div');f.className='float';f.textContent=txt;f.style.color=color;f.style.left=x+'px';f.style.top=y+'px';document.body.appendChild(f);setTimeout(()=>f.remove(),1000);}

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
function pipsHTML(n){return '<span class="pips">'+[1,2,3,4].map(i=>'<i class="'+(i<=n?'on':'')+'"></i>').join('')+'</span>';}
function setThreatHUD(cfg){
  $('spdPips').innerHTML=pipsHTML(cfg?cfg.speed:0); $('iqPips').innerHTML=pipsHTML(cfg?cfg.iq:0);
}
function renderLevelGrid(){
  const g=$('levelGrid'); g.innerHTML='';
  LEVELS.forEach(L=>{
    const c=document.createElement('div'); c.className='card'; c.dataset.id=L.id;
    const D=DIFF[L.id];
    c.innerHTML=`<div class="emoji">${L.emoji}</div><div class="name">${L.name}</div><div class="desc">${L.desc}</div><div class="desc">Speed ${pipsHTML(D.speed)}</div><div class="desc">IQ ${pipsHTML(D.iq)}</div><div class="desc">Maze ${D.w}×${D.h}</div>`;
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
    bindTap(c,()=>{char=C.id; setupPlayerCard(); document.querySelectorAll('#charGrid .card').forEach(x=>x.classList.remove('sel')); c.classList.add('sel');});
    g.appendChild(c);
  });
  const first=g.querySelector('.card'); if(first){first.classList.add('sel'); char=CHARS[0].id;}
}

// ---------- Math questions ----------
function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
// ---------- MMW-based question bank (HS = Modules 1 & 3, College = Module 4) ----------
const HINTS={
  'Fibonacci':'Each Fibonacci term = sum of the two terms before it (start 0, 1).',
  'Golden Ratio':'Golden Ratio phi ~ 1.618; Fibonacci ratios approach it.',
  'Problem Solving':'Polya: Understand -> Devise a plan -> Carry out -> Look back.',
  'Bayes':'Bayes: P(cause|evidence) = P(cause)*P(evidence|cause) / total.',
  'Probability':'All outcome probabilities sum to 1.',
  'Distribution':'Mean u = sum[x*P(x)]. Variance = sum[x^2*P(x)] - u^2. SD = sqrt(variance).',
  'Normal':'Normal curve is bell-shaped; mean = median = mode.',
  'Binomial':'Binomial: n trials, success p, failure q = 1-p. Need np>=5 and nq>=5.'
};
function mc(topic,q,ans,wrong,hint){
  ans=String(ans); const w=[...new Set(wrong.map(String))].filter(x=>x!==ans);
  return {topic,q,ans,opts:shuffle([ans,...shuffle(w).slice(0,3)]),hint:hint||HINTS[topic]||'Think carefully and check your work.'};
}
function mcNum(topic,q,ans,cands,dec,suf,hint){
  dec=dec||0; suf=suf||'';
  const f=x=>(+x).toFixed(dec)+suf, a=f(ans), set=new Set(), step=dec?Math.pow(10,-dec)*(dec>1?5:1):1;
  cands.forEach(x=>{if(isFinite(x)&&!(ans>=0&&x<0)&&f(x)!==a)set.add(f(x));});
  for(let k=1;set.size<3&&k<40;k++){const x=+ans+(k%2?1:-1)*Math.ceil(k/2)*step; if(!(ans>=0&&x<0)&&f(x)!==a)set.add(f(x));}
  return {topic,q,ans:a,opts:shuffle([a,...shuffle([...set]).slice(0,3)]),hint:hint||HINTS[topic]||'Think carefully and check your work.'};
}
const FIB=[0,1,1,2,3,5,8,13,21,34,55,89,144,233,377,610,987];
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function qFibNext(lo,hi){const i=rnd(lo,hi), a=FIB[i];
  return mcNum('Fibonacci','Each term is the sum of the previous two. If x'+(i-2)+' = '+FIB[i-2]+' and x'+(i-1)+' = '+FIB[i-1]+', then x'+i+' = ?',a,[FIB[i+1],a+1,a-1,FIB[i-1]*2,a+2]);}
function qFibSeq(){const s=rnd(1,9), a=FIB[s+4];
  return mcNum('Fibonacci','Next term: '+FIB.slice(s,s+4).join(', ')+', ?',a,[FIB[s+5],a+1,a-1,FIB[s+3]*2,a+2]);}
function qMilesKm(){const m=pick([5,8,13,21]), a=Math.round(m*1.61);
  return mcNum('Fibonacci','1 mile = 1.61 km. '+m+' miles = ? km (round off)',a,[m,a+1,a-1,m*2,a+2]);}
function qFibRatio(lo,hi){const i=rnd(lo,hi), a=FIB[i], b=FIB[i+1];
  return mcNum('Golden Ratio',b+' / '+a+' = ? (3 decimals)',b/a,[1.5,1.7,1.718,1.418,1.6],3);}
function qRabbit(){const m=rnd(5,7);
  return mcNum('Fibonacci','Rabbit pairs: start 1, 1st month 1, 2nd 2, 3rd 3, 4th 5. How many pairs in month '+m+'?',FIB[m+1],[FIB[m+1]+1,FIB[m],FIB[m+2],FIB[m+1]-1,FIB[m]*2]);}
const FIB_FACTS=[
  ()=>mc('Fibonacci','Each Fibonacci term is the ___ of the two terms before it.','Sum',['Product','Difference','Average']),
  ()=>mc('Fibonacci','The Fibonacci sequence begins...','0, 1, 1, 2, 3, 5...',['1, 2, 3, 4, 5...','0, 1, 2, 3, 4...','1, 2, 4, 8, 16...']),
  ()=>mc('Fibonacci','Fibonacci introduced his sequence in 1202 with a problem about...','Rabbit population',['Bird migration','Planet orbits','Tree rings']),
  ()=>mc('Fibonacci','A Fibonacci rectangle is built from squares whose sides are...','1, 1, 2, 3, 5, 8...',['1, 2, 4, 8, 16...','2, 4, 6, 8, 10...','1, 3, 5, 7, 9...']),
  ()=>mc('Fibonacci','A Fibonacci spiral is drawn by connecting the ___ of the squares.','Corners',['Centers','Areas','Edges']),
  ()=>mc('Golden Ratio','Which symbol stands for the Golden Ratio?','phi',['pi','sigma','mu']),
  ()=>mc('Golden Ratio','The Golden Ratio phi is approximately...','1.618',['1.414','3.142','2.718']),
  ()=>mc('Golden Ratio','Ratios of larger successive Fibonacci numbers get close to...','1.618 (phi)',['1.414','2.000','3.142']),
  ()=>mc('Golden Ratio','In a / b = (a + b) / a, which quantity is a?','The larger quantity',['The smaller quantity','The sum of both','The difference'])
];
const POLYA=['Understand the problem','Devise a plan','Carry out the plan','Look back'];
function qPolyaStep(){const idx=rnd(0,3);
  return mc('Problem Solving','Polya step '+(idx+1)+': which description fits?',['Identify given/asked','Choose a strategy','Do the calculations','Check the answer'][idx],
    ['Identify given/asked','Choose a strategy','Do the calculations','Check the answer'].filter((_,i)=>i!==idx));}
function qPolyaMean(){const idx=rnd(0,3);
  return mc('Problem Solving','Which Polya step means "'+['Identify what is given, what is asked','Choose a method connecting given to answer','Follow the method and calculate','Check answer and method make sense'][idx]+'"?',
    POLYA[idx], POLYA.filter((_,i)=>i!==idx));}
function qStrategy(){const s=pick(['Logical Reasoning','Pattern Recognition','Working Backwards','Organizing Data','Making a Drawing','Accounting for All Possibilities','Intelligent Guessing and Testing','Solving a Simpler Problem','Considering Extreme Cases','Adopting a Different Point of View']);
  const desc={'Logical Reasoning':'Use facts and valid conclusions','Pattern Recognition':'Look for a repeated or growing pattern','Working Backwards':'Start with the desired result and reverse the steps','Organizing Data':'Arrange information in a table, list, or chart','Making a Drawing':'Use a diagram, picture, graph, or model','Accounting for All Possibilities':'List all valid cases without missing or double-counting','Intelligent Guessing and Testing':'Make a reasonable guess, test it, improve it','Solving a Simpler Problem':'Simplify first, then apply to original','Considering Extreme Cases':'Test very small/large/minimum/maximum cases','Adopting a Different Point of View':'Represent or attack the problem another way'};
  return mc('Problem Solving','Which strategy: "'+desc[s]+'"?',s,Object.keys(desc).filter(k=>k!==s));}
function qWorkBack(){return mc('Problem Solving','Which strategy starts with the desired result and reverses the steps?','Working Backwards',['Logical Reasoning','Pattern Recognition','Organizing Data']);}
function qPattern(){return mc('Problem Solving','Which strategy looks for a repeated or growing pattern?','Pattern Recognition',['Working Backwards','Logical Reasoning','Making a Drawing']);}
function qSimpler(){return mc('Problem Solving','Which strategy simplifies the situation first, then applies to the original?','Solving a Simpler Problem',['Considering Extreme Cases','Organizing Data','Intelligent Guessing and Testing']);}
function qPossib(){return mc('Problem Solving','Which strategy lists all valid cases without missing or double-counting?','Accounting for All Possibilities',['Working Backwards','Logical Reasoning','Making a Drawing']);}
function tenths(){const c=shuffle([1,2,3,4,5,6,7,8,9]).slice(0,3).sort((x,y)=>x-y); return [c[0],c[1]-c[0],c[2]-c[1],10-c[2]];}
const pf=p=>p.map(t=>(t/10).toFixed(1)).join(', ');
const distStats=p=>{const m=p.reduce((s,t,x)=>s+x*t,0)/10, e2=p.reduce((s,t,x)=>s+x*x*t,0)/10; return {m,e2,v:e2-m*m};};
function qBayes(){const pA=pick([50,60,70]),pB=100-pA,a=pick([5,10,15]),b=pick([20,25,30]),w=Math.random()<.5?'A':'B';
  const num=w==='A'?pA*a/100:pB*b/100, den=pA*a/100+pB*b/100;
  return mcNum('Bayes','Suppliers A/B have priors '+pA+'%/'+pB+'% and poor-quality rates '+a+'%/'+b+'%. If a random item is poor quality, P(from '+w+' | poor) = ?',num/den*100,[num/den*100+5,num/den*100-5, (w==='A'?pA:pB), a],2,'%');}
function qBayesTot(){const pA=pick([50,60,70]),pB=100-pA,gA=pick([85,90,95]),gB=pick([70,75,80,85]),ans=(pA*gA+pB*gB)/10000;
  return mcNum('Bayes','P(good quality) = P(A)P(good|A)+P(B)P(good|B) with priors '+pA+'%/'+pB+'% and good rates '+gA+'%/'+gB+'% = ?',ans*100,[ans*100+5,ans*100-5,pA*gA/100+pB*gB/100-0.1],2,'%');}
function qMean(){const p=tenths(), m=p.reduce((s,t,x)=>s+x*t,0)/10;
  return mcNum('Distribution','For discrete values x=0,1,2,3 with P(x)='+pf(p)+', mean u = ?',m,[m+0.2,m-0.2,m*2,0.5],2);}
function qVar(){const p=tenths(), st=distStats(p);
  return mcNum('Distribution','For x=0,1,2,3 with P(x)='+pf(p)+', variance sigma^2 = ?',st.v,[st.v+0.3,st.v-0.2,st.m,st.e2],2);}
function qMissing(){const p=[pick([2,3,4]),pick([2,3]),pick([1,2]),0], tot=p.slice(0,3).reduce((a,b)=>a+b,0)/10, miss=1-tot;
  return mcNum('Probability','Probabilities of three outcomes are '+(p[0]/10).toFixed(1)+', '+(p[1]/10).toFixed(1)+', '+(p[2]/10).toFixed(1)+'. The fourth must be ?',miss,[miss+0.1,miss-0.1,0.5,tot],2);}
function qZ(){const x=pick([14,15,16,49,50]), mu=pick([10,40]), sd=pick([2,3,4,5]);
  return mcNum('Normal','Z = (x-u)/sigma with x='+x+', u='+mu+', sigma='+sd+' gives Z = ?',(x-mu)/sd,[(x-mu)/sd+0.5,(x-mu)/sd-0.5,(x+mu)/sd],2);}
function qZtoX(){const z=pick([-2,-1,0,1,2]), mu=pick([10,40,50]), sd=pick([2,3,5]);
  return mcNum('Normal','x = u + Z*sigma with u='+mu+', Z='+z+', sigma='+sd+' gives x = ?',mu+z*sd,[mu+z*sd+sd,mu+z*sd-sd,mu*z+sd],2);}
function qEmpRange(){const mu=pick([50,60,70]), sd=pick([5,8,10]);
  return mcNum('Normal','Empirical rule: about 95% of data lies within u +/- ?*sigma','2',[1,3,4,2.5]);}
function qEmpPct(){return mc('Normal','Empirical rule: about what % of data lies within +/-1 sigma of the mean?','68%',['95%','99.7%','50%']);}
function qBinMean(){const n=pick([10,20,50]), p=pick([0.2,0.3,0.5,0.7]);
  return mcNum('Binomial','Binomial mean u = np with n='+n+', p='+p+' gives u = ?',n*p,[n*(1-p),n*p+1,n*p-1],2);}
function qBinSD(){const n=pick([10,20,50]), p=pick([0.2,0.3,0.5,0.7]), q=1-p;
  return mcNum('Binomial','Binomial SD = sqrt(npq) with n='+n+', p='+p+' gives SD = ?',Math.sqrt(n*p*q),[Math.sqrt(n*p*q)+0.5,Math.sqrt(n*p*q)-0.5,n*p*q],2);}
function qCont(){return mc('Probability','A continuous random variable takes...','Any value in an interval',['Only whole numbers','Only 0 or 1','Only positive integers']);}
function qCutoff(){const z=pick([-2.33,-1.96,-1.645,1.645,1.96,2.33]);
  const idx=[-2.33,-1.96,-1.645,1.645,1.96,2.33].indexOf(z);
  const areas=['0.01','0.025','0.05','0.95','0.975','0.99'];
  return mc('Normal','Common Z cutoff '+z+' corresponds to a one-tail area of about...',areas[idx],areas.filter((_,i)=>i!==idx));}
function qTable(){
  return mc('Normal','Which table is used to find areas under the standard normal (Z) curve?','Standard normal table',['Binomial table','Poisson table','F-table']);}
const STAT_FACTS=[
  ()=>mc('Bayes','Bayes Theorem updates a probability using...','New evidence (likelihood)',['Prior only','Random guessing','The mean']),
  ()=>mc('Bayes','In Bayes, P(Ei) is called the...','Prior probability',['Posterior','Likelihood','Marginal']),
  ()=>mc('Bayes','In Bayes, P(Ei | E) is called the...','Posterior probability',['Prior','Likelihood','Marginal']),
  ()=>mc('Probability','Two events are mutually exclusive if...','They cannot occur together',['They are independent','One causes the other','They always occur together']),
  ()=>mc('Probability','For a discrete distribution, the sum of all P(x) must equal...','1',['0','100','0.5']),
  ()=>mc('Distribution','The mean u is also called the...','Expected value E(X)',['Variance','Standard deviation','Mode']),
  ()=>mc('Distribution','Variance measures...','Spread of values around the mean',['Central tendency','Skewness','Kurtosis']),
  ()=>mc('Distribution','Standard deviation is the...','Square root of variance',['Variance squared','Mean of values','Sum of values']),
  ()=>mc('Normal','The normal distribution curve is...','Bell-shaped and symmetric',['U-shaped','Skewed right','Flat']),
  ()=>mc('Normal','In a normal distribution, mean = median = ...','Mode',['Variance','Range','Skewness']),
  ()=>mc('Binomial','Binomial distribution counts...','Number of successes in n trials',['Continuous values','Time between events','Rank of values'])
];
const HS_Q=[()=>qFibNext(4,12),qFibSeq,qMilesKm,()=>qFibRatio(6,11),qRabbit,...FIB_FACTS,
  qPolyaStep,qPolyaMean,qStrategy,qStrategy,qWorkBack,qPattern,qSimpler,qPossib];
const COLLEGE_Q=[qBayes,qBayes,qBayesTot,qMean,qVar,qMissing,qZ,qZ,qZtoX,qEmpRange,qEmpPct,qBinMean,qBinSD,qCont,qCutoff,qTable,
  ...STAT_FACTS,()=>qFibNext(10,15),()=>qFibRatio(11,13)];
const _recentQ=[];
function genPdfQuestion(L){
  const pool=L==='college'?COLLEGE_Q:HS_Q; let it;
  for(let i=0;i<10;i++){it=pick(pool)(); if(!_recentQ.includes(it.q))break;}
  _recentQ.push(it.q); if(_recentQ.length>10)_recentQ.shift();
  return it;
}
function genQuestion(){
  const L=level;
  if(L==='highschool'||L==='college') return genPdfQuestion(L);
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

let qOpen=false, qToken=0;
function basicHint(q){
  if(q.includes('×'))return 'Multiplication is repeated addition. Think of your times tables.';
  if(q.includes('÷'))return 'Division is the opposite of multiplying: what number times the divisor gives the total?';
  if(q.includes(' - '))return 'Subtracting: count backwards from the first number.';
  if(q.includes(' + '))return 'Adding: start from the bigger number and count up.';
  return 'Take your time and check your work.';
}
function askQuestion(typeLabel, onResult){
  const Q=genQuestion(), tok=++qToken, qs=String(Q.q);
  qOpen=true;
  $('qtype').textContent=typeLabel||'MATH CHALLENGE';
  const qt=$('qtext'); qt.textContent=qs;
  qt.className='qtext'+(qs.length<=9?'':qs.length<=16?' md':qs.length<=44?' lg':' xl');
  const hb=$('qhintBtn'), ht=$('qhint');
  ht.textContent=Q.hint||basicHint(qs); ht.classList.add('hidden');
  hb.disabled=false; hb.textContent='? Hint'; hb.classList.remove('hidden');
  const maxLen=Math.max(...Q.opts.map(v=>String(v).length));
  const o=$('qopts'); o.innerHTML=''; o.dataset.locked='';
  o.className='qopts'+(maxLen>10?' one':'');
  const cls=maxLen>10?(maxLen>22?'tx2':'tx'):maxLen>5?'tx':'';
  const btns=[];
  Q.opts.forEach(v=>{
    const b=document.createElement('button'); b.type='button';
    b.className='qopt'+(cls?' '+cls:''); b.textContent=v; b.dataset.val=String(v);
    bindTap(b,()=>{
      if(o.dataset.locked==='1')return; o.dataset.locked='1';
      const ok=String(v)===String(Q.ans);
      btns.forEach(x=>{x.style.pointerEvents='none'; if(x.dataset.val===String(Q.ans))x.classList.add('correct');});
      if(!ok)b.classList.add('wrong');
      // leave the green/red feedback on screen for a moment before closing
      setTimeout(()=>{
        if(tok!==qToken)return;
        qOpen=false;
        if(state!=='play')return;
        onResult(ok,v);
      }, ok?500:1300);
    });
    btns.push(b); o.appendChild(b);
  });
  $('qmodal').classList.remove('hidden');
}

// ---------- Game init ----------
function startGame(){
  qToken++; qOpen=false;
  const rs=$('rotateScreen'); if(rs) rs.classList.add('hidden');
  const cfg=DIFF[level]||DIFF.elementary;
  const gen=genMaze(map,cfg.w,cfg.h,cfg.mons,mulberry32((Math.random()*4294967296)>>>0));
  maze=gen.rows.map(r=>r.split(''));
  rows=maze.length; cols=maze[0].length;
  monsters=[]; spawns=[]; seenStations=new Set(); noise=null; invulnUntil=0; lastAlert=0; pdir={r:0,c:1};
  const now=performance.now();
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    if(maze[r][c]==='S'){player={r,c};maze[r][c]=' ';}
    else if(maze[r][c]==='G'){
      spawns.push({r,c});
      monsters.push({r,c,pr:r,pc:c,dr:0,dc:0,vr:r,vc:c,mem:null,moves:0,mode:'wander',prevMode:'wander',freezeUntil:now+cfg.grace,next:now+cfg.grace});
      maze[r][c]=' ';
    }
    else if(maze[r][c]==='E'){exitPos={r,c};}
  }
  distExit=bfsGrid(maze,rows,cols,exitPos.r,exitPos.c);
  hearts=cfg.hearts; score=0; correctCount=0; wrongCount=0; riftsDone=0;
  riftsTotal=maze.flat().filter(t=>t==='M').length; setupPlayerCard(); setThreatHUD(cfg);
  timeLeft=Math.round(gen.pathLen*cfg.stepSec+0.5*riftsTotal*cfg.qSec+25);
  maxHearts=5;
  paused=false;
  view.snap=true;
  hideAll();
  resize();
  updateHUD();
  gameStart=Date.now();
  clearInterval(timerInt); clearInterval(monsterInt);
  timerInt=setInterval(tickTimer,1000);
  lastMT=performance.now();
  monsterInt=setInterval(tickMonsters,80);
  if(!rendering){rendering=true;requestAnimationFrame(render);}
  toast('ESCAPE THE UPSIDE DOWN');
}

function updateHUD(){
  $('hearts').innerHTML='♥'.repeat(Math.max(0,hearts))+'<span class="off">'+'♥'.repeat(Math.max(0,maxHearts-hearts))+'</span>';
  const t=Math.max(0,Math.ceil(timeLeft));
  $('timer').textContent=String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');
  $('score').textContent=String(score).padStart(4,'0');
  $('riftCount').textContent=riftsDone+' / '+riftsTotal;
  $('riftBar').style.width=(riftsTotal?riftsDone/riftsTotal*100:0)+'%';
}

function tickTimer(){
  if(paused||state!=='play')return;
  timeLeft-=1;
  if(timeLeft<=0){timeLeft=0;updateHUD();gameOver(false,'Time ran out');return;}
  updateHUD();
  if(timeLeft<=15) toast('HURRY!');
}

// ---------- Demogorgon AI ----------
function tileOpen(r,c){return r>=0&&c>=0&&r<rows&&c<cols&&maze[r][c]!=='#';}
function openNbrs(r,c){return DIRS4.filter(([a,b])=>tileOpen(r+a,c+b)).map(([a,b])=>({r:r+a,c:c+b,dr:a,dc:b}));}
function stepTo(m,n){m.pr=m.r;m.pc=m.c;m.dr=n.dr;m.dc=n.dc;m.r=n.r;m.c=n.c;}
function wanderPick(m,ns){
  const fwd=ns.filter(n=>!(n.r===m.pr&&n.c===m.pc)), pool=fwd.length?fwd:ns;
  const straight=pool.find(n=>n.dr===m.dr&&n.dc===m.dc);
  return straight&&Math.random()<.6?straight:pool[Math.floor(Math.random()*pool.length)];
}
function descend(m,D,acc){
  const ns=openNbrs(m.r,m.c); if(!ns.length)return;
  let best=null,bd=1e9; ns.forEach(n=>{const d=D[n.r*cols+n.c]; if(d>=0&&d<bd){bd=d;best=n;}});
  if(!best||Math.random()>acc)best=wanderPick(m,ns);
  stepTo(m,best);
}
function aheadOf(P,k){
  let r=P.r,c=P.c,dr=pdir.r,dc=pdir.c;
  for(let i=0;i<k;i++){
    const ns=DIRS4.filter(([a,b])=>tileOpen(r+a,c+b)&&!(a===-dr&&b===-dc)); if(!ns.length)break;
    const [a,b]=ns.find(([x,y])=>x===dr&&y===dc)||ns[0]; r+=a;c+=b;dr=a;dc=b;
  }
  return {r,c};
}
function cutOff(P,k){
  let r=P.r,c=P.c;
  for(let i=0;i<k;i++){
    let best=null,bd=distExit[r*cols+c];
    for(const [a,b] of DIRS4){if(!tileOpen(r+a,c+b))continue;const d=distExit[(r+a)*cols+c+b];if(d>=0&&d<bd){bd=d;best={r:r+a,c:c+b};}}
    if(!best)break; r=best.r;c=best.c;
  }
  return {r,c};
}
function thinkMonster(m,idx,cfg,pd){
  const P=player, now=performance.now(), dm=pd[m.r*cols+m.c], seen=dm>=0&&dm<=cfg.sight;
  if(seen)m.mem={r:P.r,c:P.c};
  else if(cfg.iq>=3&&noise&&now<noise.until&&(cfg.iq>=4||Math.abs(noise.r-m.r)+Math.abs(noise.c-m.c)<30))m.mem={r:noise.r,c:noise.c};
  m.mode=seen?'chase':m.mem?'hunt':'wander';
  const ns=openNbrs(m.r,m.c); if(!ns.length)return;
  if(cfg.iq===1){ if(seen)descend(m,pd,cfg.acc); else stepTo(m,wanderPick(m,ns)); return; }
  if(seen){
    const role=cfg.iq>=4?idx%3:cfg.iq===3?idx%2:0;
    let D=pd;
    if(role===1&&dm>6){const t=aheadOf(P,cfg.iq>=4?5:3);D=bfsGrid(maze,rows,cols,t.r,t.c);}
    else if(role===2&&dm>8){const t=cutOff(P,12);D=bfsGrid(maze,rows,cols,t.r,t.c);}
    if(D!==pd&&D[m.r*cols+m.c]<=1)D=pd;
    descend(m,D,cfg.acc); return;
  }
  if(m.mem){
    if(m.r===m.mem.r&&m.c===m.mem.c){m.mem=null;stepTo(m,wanderPick(m,ns));return;}
    descend(m,bfsGrid(maze,rows,cols,m.mem.r,m.mem.c),cfg.acc); return;
  }
  stepTo(m,wanderPick(m,ns));
}
function checkCatch(m,cfg){
  if(m.r!==player.r||m.c!==player.c)return false;
  const now=performance.now(); if(now<invulnUntil)return false;
  invulnUntil=now+1500;
  damagePlayer('Caught by Demogorgon!');
  const far=spawns.slice().sort((a,b)=>(Math.abs(b.r-player.r)+Math.abs(b.c-player.c))-(Math.abs(a.r-player.r)+Math.abs(a.c-player.c)))[0]||{r:m.r,c:m.c};
  m.r=m.pr=far.r; m.c=m.pc=far.c; m.vr=m.r; m.vc=m.c; m.mem=null;
  m.freezeUntil=now+cfg.stun; m.next=m.freezeUntil;
  return true;
}
function tickMonsters(){
  const now=performance.now(), dt=now-lastMT; lastMT=now;
  if(paused||state!=='play'){monsters.forEach(m=>{m.next+=dt;m.freezeUntil+=dt;});return;}
  const cfg=DIFF[level]||DIFF.elementary; let pd=null, worst='wander';
  monsters.forEach((m,i)=>{
    if(state!=='play')return;
    if(now>=m.next){
      if(!pd)pd=bfsGrid(maze,rows,cols,player.r,player.c);
      thinkMonster(m,i,cfg,pd); m.moves++;
      m.next=now+cfg.stepMs*(0.9+Math.random()*0.2);
      if(!checkCatch(m,cfg)&&cfg.iq>=4&&m.mode==='chase'&&m.moves%5===0){thinkMonster(m,i,cfg,pd);checkCatch(m,cfg);}
    }
    if(m.mode==='chase'&&m.prevMode!=='chase'&&now-lastAlert>8000){lastAlert=now;toast('The Demogorgon senses you!');}
    m.prevMode=m.mode;
    if(m.mode==='chase')worst='chase'; else if(m.mode==='hunt'&&worst!=='chase')worst='hunt';
  });
  const dormant=monsters.length&&monsters.every(m=>now<m.freezeUntil);
  const label=dormant?'Dormant':worst==='chase'?'HUNTING YOU!':worst==='hunt'?'Searching…':'Wandering';
  const el=$('threatMode'); if(el.textContent!==label){el.textContent=label;el.style.color=worst==='chase'&&!dormant?'#ff2a3d':'';}
}

function damagePlayer(reason){
  hearts=Math.max(0,hearts-1);
  updateHUD();
  const p=tileScreen(player.r,player.c);
  floatText('-1 ♥','#ff2a3d',p.x+p.ts/2-10,p.y);
  toast(reason);
  if(hearts<=0){gameOver(false,'No hearts left');}
}

function tileSize(){return view.ts;}
function tileScreen(r,c){
  const rect=canvas.getBoundingClientRect();
  return {x:rect.left+view.offX+(c-view.cx)*view.ts, y:rect.top+view.offY+(r-view.cy)*view.ts, ts:view.ts};
}

function movePlayer(dr,dc){
  if(paused||state!=='play')return;
  const nr=player.r+dr, nc=player.c+dc;
  if(nr<0||nr>=rows||nc<0||nc>=cols)return;
  if(maze[nr][nc]==='#')return;
  player.r=nr; player.c=nc; pdir={r:dr,c:dc};
  const cfg=DIFF[level]||DIFF.elementary;
  monsters.forEach(m=>checkCatch(m,cfg));
  if(state!=='play')return;
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
      playCorrect();
      correctCount++;
      score += kind==='mystery'? 80 : 30; if(kind==='math')riftsDone++;
      if(kind==='mystery' && hearts<maxHearts){hearts++; toast('Extra heart earned!');}
      seenStations.add(key);
      maze[r][c]=' ';
      const p=tileScreen(r,c), cfg=DIFF[level]||DIFF.elementary;
      floatText('+'+(kind==='mystery'?80:30),'#39ff14',p.x+p.ts/2-12,p.y);
      if(kind==='math')timeLeft+=cfg.bonus;
      toast(kind==='mystery'?'Mystery solved! +80':'Correct! Door opened +'+cfg.bonus+'s');
      updateHUD();
    } else {
      playWrong();
      wrongCount++;
      noise={r:player.r,c:player.c,until:performance.now()+6000};
      damagePlayer('Wrong answer');
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
  if(finalScore>highScore){highScore=finalScore;store.set('msd_best',highScore);}
  addScore(finalScore);
  $('resultTitle').textContent=win?'VICTORY':'GAME OVER';
  $('resultSub').textContent=reason;
  $('resultScore').textContent=finalScore;
  const list=$('resultList'); list.innerHTML='';
  const rows=[
    ['Status', win?'Escaped':'Trapped'],
    ['Level', (DIFF[level]||DIFF.elementary).label],
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

// ---------- Rendering (pixel art) ----------
const T=16;
const SPR={
  eleven:{hair:'#7a4a2a',skin:'#f0c8a0'}, max:{hair:'#d9531e',skin:'#f0c8a0'},
  mike:{hair:'#2a1a12',skin:'#f0c8a0'}, dustin:{hair:'#c9a45a',skin:'#f0c8a0'},
  lucas:{hair:'#1a1210',skin:'#8a5a3a'}, will:{hair:'#6b4a2f',skin:'#f0c8a0'}
};
const HUM=['...oooooo...','..ohhhhhho..','.ohhhhhhhho.','.ohssssssho.','.ohsessesho.','.osssssssso.','..oossssoo..','ooccccccccoo','osccccccccso','osccccccccso','.oppppppppo.','.oppooooppo.','.oppo..oppo.','.ooo....ooo.'];
const MON=['p..p.pp.p..p','.p.pppppp.p.','..pppmmppp..','..pppmmppp..','...pppppp...','....dddd....','..dddddddd..','.d.dddddd.d.','d..dddddd..d','d..dddddd..d','...dd..dd...','...dd..dd...','..dd....dd..','..dd....dd..'];
const STAR=['...#...','...#...','#######','.#####.','..###..','.##.##.','##...##'];
const FONT={'!':['010','010','010','000','010'],E:['111','100','110','100','111'],X:['101','101','010','101','101'],I:['111','010','010','010','111'],T:['111','010','010','010','010'],'?':['111','001','011','000','010']};
const MON_PAL={p:'#8a0a1e',d:'#2a0510',m:'#ff5a6a'};
function bmp(g,rows,pal,x,y,flip){
  rows.forEach((row,j)=>{for(let i=0;i<row.length;i++){const k=row[i];if(k!=='.'&&pal[k]){g.fillStyle=pal[k];g.fillRect(x+i,y+(flip?rows.length-1-j:j),1,1);}}});
}
function txt(g,str,x,y,c){g.fillStyle=c;[...str].forEach((ch,n)=>FONT[ch].forEach((row,j)=>{for(let i=0;i<3;i++)if(row[i]==='1')g.fillRect(x+n*4+i,y+j,1,1);}));}
function humPal(id,color){const p=SPR[id]||SPR.eleven;return{o:'#0a0610',h:p.hair,s:p.skin,e:'#0a0610',c:color,p:'#2a2a48'};}
function drawSprite(g,x,y,s,id,color){ g.fillStyle='rgba(0,0,0,.4)';g.fillRect(x+3,y+14,10,2); bmp(g,HUM,humPal(id,color),x+2,y+1); }
function drawPortrait(g,S,id,color){ g.clearRect(0,0,16,16); g.fillStyle='#2a0f16'; g.fillRect(0,0,16,16); bmp(g,HUM.slice(0,10),humPal(id,color),2,5); }
const hsh=(a,b)=>((a*73856093)^(b*19349663))>>>0;
const PREVIEW=genMaze('hawkins',31,17,0,mulberry32(1986)).rows.map(r=>r.replace(/[SG]/g,' ').split(''));
let _npcFor=null,_npcs=[];
function npcsFor(mz){
  if(_npcFor===mz)return _npcs; _npcFor=mz; _npcs=[];
  for(let r=2;r<mz.length-1;r++)for(let c=2;c<mz[0].length-1;c++){
    if(mz[r][c]===' '&&hsh(r,c)%53===0&&r+c>10&&_npcs.length<Math.max(3,Math.floor(mz.length*mz[0].length/260))){const C=CHARS[_npcs.length%CHARS.length];_npcs.push({r,c,id:C.id,col:C.color});}
  }
  return _npcs;
}
function wallTile(g,x,y,th,h,above,below){
  g.fillStyle=th.wall;g.fillRect(x,y,T,T);
  g.fillStyle='rgba(255,255,255,.07)';g.fillRect(x+1,y+1,T-2,6);
  if(!above){g.fillStyle='rgba(255,255,255,.28)';g.fillRect(x,y,T,2);}
  if(!below){g.fillStyle='rgba(0,0,0,.5)';g.fillRect(x,y+12,T,4);}
  g.fillStyle='rgba(0,0,0,.38)';
  g.fillRect(x,y+7,T,1);g.fillRect(x+(h%2?5:10),y,1,7);g.fillRect(x+(h%2?10:4),y+8,1,8);
  g.fillStyle='rgba(0,0,0,.55)';g.fillRect(x+15,y,1,T);g.fillRect(x,y+15,T,1);
  g.fillStyle='rgba(255,220,200,.16)';g.fillRect(x+1+h%12,y+2+(h>>4)%4,1,1);g.fillRect(x+2+(h>>3)%11,y+9+(h>>6)%5,1,1);
}
function vinePx(g,x,y,h){
  const side=(h>>>3)%4, v=h%2?'#d4142e':'#8a0a1c';
  for(let k=0;k<8;k++){
    const o=k%4===1?1:k%4===3?-1:0; g.fillStyle=k%3===0?'#ff4a5c':v;
    if(side<2)g.fillRect(x+(side?14:0)+(side?-o:o),y+k*2,2,2);
    else g.fillRect(x+k*2,y+(side===3?14:0)+(side===3?-o:o),2,2);
  }
}
function floorTile(g,x,y,th,h){
  g.fillStyle=th.floor;g.fillRect(x,y,T,T);
  g.fillStyle='rgba(255,225,200,.05)';g.fillRect(x+1,y+1,7,7);g.fillRect(x+9,y+9,6,6);
  g.fillStyle='rgba(0,0,0,.5)';g.fillRect(x+15,y,1,T);g.fillRect(x,y+15,T,1);
  g.fillStyle='rgba(255,220,200,.12)';g.fillRect(x+2+h%11,y+2+(h>>4)%11,1,1);g.fillRect(x+3+(h>>7)%10,y+4+(h>>10)%10,1,1);
}
function propPx(g,k,x,y){
  if(k===0){g.fillStyle='#4a2c18';g.fillRect(x+3,y+6,10,8);g.fillStyle='#7a5232';g.fillRect(x+3,y+6,10,2);g.fillStyle='#2a180c';g.fillRect(x+7,y+8,2,6);}
  else if(k===1){g.fillStyle='#5a3a22';g.fillRect(x+5,y+4,6,10);g.fillStyle='#8a6038';g.fillRect(x+5,y+4,6,2);g.fillStyle='#2a180c';g.fillRect(x+5,y+8,6,1);g.fillRect(x+5,y+11,6,1);}
  else{g.fillStyle='#4a4a66';g.fillRect(x+2,y+7,12,3);g.fillStyle='#2a2a40';g.fillRect(x+3,y+10,2,4);g.fillRect(x+11,y+10,2,4);}
}
function portalPx(g,x,y,fr){
  for(let j=0;j<16;j++)for(let i=0;i<16;i++){
    const dx=i-7.5,dy=j-7.5,d=Math.hypot(dx,dy); if(d>7.6)continue;
    const k=(Math.floor(Math.atan2(dy,dx)*1.5+d*.9+fr)%3+3)%3;
    g.fillStyle=d>6.4?'#5a0010':['#ff2a3d','#a0001a','#2a0008'][k]; g.fillRect(x+i,y+j,1,1);
  }
  txt(g,'?',x+6,y+5,'#ffe0e4');
}
function exitPx(g,x,y){
  g.fillStyle='#0a3a10';g.fillRect(x,y,T,7);txt(g,'EXIT',x,y+1,'#9aff7a');
  g.fillStyle='#39ff14';g.fillRect(x+1,y+7,14,1);g.fillRect(x+1,y+7,1,9);g.fillRect(x+14,y+7,1,9);
  g.fillStyle='#0c2a10';g.fillRect(x+2,y+8,12,8);
  g.fillStyle='#1f8a10';for(let i=0;i<4;i++)g.fillRect(x+3+i*3,y+8,1,8);
}
function glowSq(g,cx,cy,r,rgb,a){for(let i=0;i<3;i++){const q=r*(1-i*.3);g.fillStyle='rgba('+rgb+','+a+')';g.fillRect(cx-q,cy-q,q*2,q*2);}}
const buf=document.createElement('canvas'), bg=buf.getContext('2d');
const staticBuf=document.createElement('canvas'), sg=staticBuf.getContext('2d');
let staticFor=null, staticTh=null;
function buildStatic(mz,R,C,th){
  staticBuf.width=C*T; staticBuf.height=R*T;
  const at=(rr,c)=>(rr<0||c<0||rr>=R||c>=C)?'#':mz[rr][c];
  for(let rr=0;rr<R;rr++)for(let c=0;c<C;c++){
    const x=c*T,y=rr*T,h=hsh(rr,c);
    if(mz[rr][c]==='#') wallTile(sg,x,y,th,h,at(rr-1,c)==='#',at(rr+1,c)==='#');
    else{ floorTile(sg,x,y,th,h); if(mz[rr][c]===' '&&h%13===0&&!(rr===1&&c<5))propPx(sg,h%3,x,y); }
  }
  for(let rr=0;rr<R;rr++)for(let c=0;c<C;c++){ if(mz[rr][c]==='#'){const h=hsh(rr+3,c+5); if(h%3===0)vinePx(sg,c*T,rr*T,h);} }
  if(at(1,3)!=='#'){const lx=3*T+8,ly=T+8;glowSq(sg,lx,ly,28,'255,190,110',.1);sg.fillStyle='#2a2430';sg.fillRect(lx-1,ly-2,2,10);sg.fillStyle='#ffd48a';sg.fillRect(lx-3,ly-5,6,3);}
}
const MON_PALS=[
  {p:'#9a5aa8',d:'#3a1a48',m:'#ffd0ff'},
  {p:'#8a0a1e',d:'#2a0510',m:'#ff5a6a'},
  {p:'#b3001b',d:'#1a0308',m:'#ffb02e'},
  {p:'#ff2a3d',d:'#10010a',m:'#ffffff'}
];
function render(){
  const r=canvas.getBoundingClientRect(), g=ctx;
  if(!r.width||!r.height){requestAnimationFrame(render);return;}
  g.fillStyle='#05030a'; g.fillRect(0,0,r.width,r.height);
  const playing=(state==='play'||state==='paused')&&maze;
  const mz=playing?maze:PREVIEW, R=mz.length, C=mz[0].length;
  const th=(MAPS.find(x=>x.id===(playing?map:'hawkins'))||MAPS[0]).theme, t=performance.now()/1000, fr=Math.floor(t*5);
  if(staticFor!==mz||staticTh!==th){buildStatic(mz,R,C,th);staticFor=mz;staticTh=th;}
  let ts,vc,vr;
  if(playing){
    const t0=Math.max(22,Math.min(44,Math.floor(Math.min(r.width/15,r.height/12))));
    vc=Math.min(C,Math.floor(r.width/t0)); vr=Math.min(R,Math.floor(r.height/t0));
    ts=Math.floor(Math.min(r.width/vc,r.height/vr));
    vc=Math.min(C,Math.floor(r.width/ts)); vr=Math.min(R,Math.floor(r.height/ts));
  } else { ts=Math.floor(Math.min(r.width/C,r.height/R)); vc=C; vr=R; }
  const lerp=(a,b,k)=>Math.abs(b-a)<.01?b:a+(b-a)*k;
  if(playing){
    if(view.snap){pv.r=player.r;pv.c=player.c;monsters.forEach(m=>{m.vr=m.r;m.vc=m.c;});}
    pv.r=lerp(pv.r,player.r,.4); pv.c=lerp(pv.c,player.c,.4);
    monsters.forEach(m=>{m.vr=lerp(m.vr,m.r,.18);m.vc=lerp(m.vc,m.c,.18);});
    const tx=Math.max(0,Math.min(C-vc,pv.c+.5-vc/2)), ty=Math.max(0,Math.min(R-vr,pv.r+.5-vr/2));
    if(view.snap){view.cx=tx;view.cy=ty;view.snap=false;} else {view.cx=lerp(view.cx,tx,.2);view.cy=lerp(view.cy,ty,.2);}
  } else {view.cx=0;view.cy=0;view.snap=true;}
  const offX=(r.width-vc*ts)/2, offY=(r.height-vr*ts)/2;
  view.ts=ts;view.offX=offX;view.offY=offY;view.vc=vc;view.vr=vr;
  if(buf.width!==C*T||buf.height!==R*T){buf.width=C*T;buf.height=R*T;}
  bg.drawImage(staticBuf,0,0);
  for(let rr=0;rr<R;rr++)for(let c=0;c<C;c++){
    const tile=mz[rr][c]; if(tile==='#'||tile===' ')continue; const x=c*T,y=rr*T;
    if(tile==='M'){glowSq(bg,x+8,y+8,18,'255,30,50',.1);portalPx(bg,x,y,fr);}
    else if(tile==='Y'){glowSq(bg,x+8,y+8,14,'255,176,46',.1);bmp(bg,STAR,{'#':fr%2?'#ffb02e':'#ffe08a'},x+4,y+5);}
    else if(tile==='E'){glowSq(bg,x+8,y+10,24,'57,255,20',.08);exitPx(bg,x,y);}
  }
  const me=playing?char:null;
  npcsFor(mz).forEach(n=>{ if(n.id!==me) drawSprite(bg,n.c*T,n.r*T,T,n.id,n.col); });
  if(playing){
    const cfg=DIFF[level]||DIFF.elementary, pal=MON_PALS[cfg.iq-1], now=performance.now();
    monsters.forEach(m=>{
      const mx=Math.round(m.vc*T), my=Math.round(m.vr*T);
      if(cfg.iq>=4)glowSq(bg,mx+8,my+8,16,'255,30,50',.12);
      bg.globalAlpha=now<m.freezeUntil?.45:1;
      bmp(bg,MON,pal,mx+2,my+1+(fr%2));
      bg.globalAlpha=1;
      if(m.mode==='chase'&&now>=m.freezeUntil)txt(bg,'!',mx+6,my-5,'#ffdd55');
    });
    const ch=CHARS.find(x=>x.id===char);
    if(!(performance.now()<invulnUntil&&fr%2))drawSprite(bg,Math.round(pv.c*T),Math.round(pv.r*T),T,ch.id,ch.color);
  }
  g.imageSmoothingEnabled=false;
  g.drawImage(buf,Math.round(view.cx*T),Math.round(view.cy*T),vc*T,vr*T,offX,offY,vc*ts,vr*ts);
  requestAnimationFrame(render);
}
function drawArt(){
  const g=$('artCanvas').getContext('2d'),P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
  const sky=['#2e0008','#460008','#62091a','#7e1224','#9a1a2c','#7e1224'];
  sky.forEach((c,i)=>P(0,i*6,96,6,c));
  for(let i=1;i<6;i++)for(let x=i%2;x<96;x+=2)P(x,i*6,1,1,sky[i-1]);
  P(0,32,96,6,'#2a030a');for(let x=0;x<96;x+=4)P(x,30+((x*7)%3),3,3,'#2a030a');
  [[8,12],[84,8]].forEach(([x,y])=>{P(x,y,2,28,'#06010a');P(x-4,y+6,4,1,'#06010a');P(x-6,y+3,2,1,'#06010a');P(x+2,y+10,5,1,'#06010a');P(x+5,y+7,2,1,'#06010a');P(x-3,y+14,3,1,'#06010a');});
  P(26,10,2,28,'#06010a');P(22,18,4,1,'#06010a');P(28,14,4,1,'#06010a');P(70,14,2,24,'#06010a');P(66,22,4,1,'#06010a');P(72,18,4,1,'#06010a');
  g.fillStyle='rgba(255,90,80,.2)';g.fillRect(34,12,28,26);g.fillRect(39,17,18,21);
  const pal={p:'#06010a',d:'#06010a',m:'#d83a4a'};
  bmp(g,MON,pal,42,24);
  ['#7a0c18','#5a0812','#3a050c','#240308'].forEach((c,i)=>P(0,38+i*3,96,3,c));
  g.globalAlpha=.35;bmp(g,MON,pal,42,38,true);g.globalAlpha=1;
  g.fillStyle='#ff6a70';[[10,40,6],[30,43,8],[60,41,7],[75,46,5],[20,47,4],[50,45,6]].forEach(([x,y,w])=>g.fillRect(x,y,w,1));
}
function drawSky(){
  const g=$('skyCanvas').getContext('2d'),P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);},K='#050106';
  ['#12020a','#2a0410','#5a0a18','#8a1424','#b01c30'].forEach((c,i)=>P(0,i*6,160,6,c));
  P(0,24,160,6,K);for(let x=0;x<160;x+=6)P(x,22+((x*5)%3),5,3,K);
  [[12,8],[34,4],[58,10],[104,3],[126,9],[148,12]].forEach(([x,y])=>{P(x,y,1,20,K);P(x-3,y+5,3,1,K);P(x+1,y+3,3,1,K);P(x-2,y+9,2,1,K);P(x+1,y+8,3,1,K);});
  const x=76,y=12;
  [0,10].forEach(o=>{P(x+o+2,y+8,3,1,K);P(x+o+1,y+9,1,3,K);P(x+o+5,y+9,1,3,K);P(x+o+2,y+12,3,1,K);});
  P(x+3,y+7,8,1,K);P(x+7,y+2,2,2,K);P(x+6,y+4,3,3,K);P(x+9,y+5,2,1,K);P(x+4,y+8,2,1,K);
}

// ---------- Input ----------
function handleDir(d){
  if(d==='up')movePlayer(-1,0);
  if(d==='down')movePlayer(1,0);
  if(d==='left')movePlayer(0,-1);
  if(d==='right')movePlayer(0,1);
}
function bindTap(el, fn){
  const fire=(e)=>{ if(e){e.preventDefault();} try{fn();}catch(err){console.error(err);} };
  el.addEventListener('click', fire);
  el.addEventListener('touchstart', fire, {passive:false});
}
function bindDir(btn, dir){
  const fire=(e)=>{ if(e){e.preventDefault();} try{handleDir(dir);}catch(err){} };
  btn.addEventListener('click', fire);
  btn.addEventListener('touchstart', fire, {passive:false});
}
bindDir($('upBtn'),'up');
bindDir($('downBtn'),'down');
bindDir($('leftBtn'),'left');
bindDir($('rightBtn'),'right');
function togglePause(){ if(state!=='play'||qOpen)return; paused=!paused; if(paused)show('pauseScreen'); else hideAll(); }
$('actionBtn').onclick=togglePause;

document.addEventListener('keydown',e=>{
  if(state!=='play')return;
  const wasd={w:'up',a:'left',s:'down',d:'right'}[e.key.toLowerCase()]; if(wasd)handleDir(wasd);
  if(e.key==='ArrowUp')handleDir('up');
  if(e.key==='ArrowDown')handleDir('down');
  if(e.key==='ArrowLeft')handleDir('left');
  if(e.key==='ArrowRight')handleDir('right');
  if(e.key==='Escape'||e.key==='p')togglePause();
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
    const rect=canvas.getBoundingClientRect();
    const c=Math.floor((t.clientX-rect.left-view.offX)/view.ts+view.cx);
    const r=Math.floor((t.clientY-rect.top-view.offY)/view.ts+view.cy);
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
bindTap($('introNext'),()=>goFromIntro());
bindTap($('qhintBtn'),()=>{ const hb=$('qhintBtn'); if(hb.disabled)return; $('qhint').classList.remove('hidden'); hb.disabled=true; hb.textContent='Hint used'; });
bindTap($('charStart'),()=>{ if(!char){char=CHARS[0].id;} state='play'; startGame(); });
bindTap($('continuePortrait'),()=>{ $('rotateScreen').classList.add('hidden'); });
bindTap($('resumeBtn'),()=>{paused=false;hideAll();});
bindTap($('quitBtn'),quitToMenu);
bindTap($('quitGameBtn'),()=>{ if(confirm('Quit game?')) quitToMenu(); });
bindTap($('pauseBtn'),togglePause);
bindTap($('replayBtn'),()=>{ state='play'; startGame(); });
bindTap($('menuBtn'),quitToMenu);

function quitToMenu(){
  qToken++; qOpen=false;
  clearInterval(timerInt); clearInterval(monsterInt);
  timerInt=null; monsterInt=null;
  state='intro';
  show('introScreen');
}

// ---- Orientation handling ----
function checkOrientation(){
  const isPortrait = window.innerHeight > window.innerWidth;
  const isSmall = window.innerWidth < 700;
  const rs = $('rotateScreen');
  if(!rs) return;
  if(isPortrait && isSmall){
    if(state==='intro' || state==='register' || state==='level' || state==='map' || state==='char'){
      rs.classList.remove('hidden');
    }
  } else {
    rs.classList.add('hidden');
  }
}
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', ()=>{ setTimeout(checkOrientation, 300); });

// ---------- Panels, leaderboard, nav ----------
let riftsDone=0, riftsTotal=0, infoBack='introScreen';
function setupPlayerCard(){
  const ch=CHARS.find(x=>x.id===char)||CHARS[0];
  const name=getPlayerName();
  $('pName').textContent=name||ch.name;
  const a=$('pAvatar').getContext('2d'); a.clearRect(0,0,16,16);
  drawPortrait(a,64,ch.id,ch.color);
}
const DEFAULT_BOARD=[{n:'Stranger',s:2800},{n:'Eleven',s:2430},{n:'Dustin',s:2010},{n:'Lucas',s:1760},{n:'Max',s:1420}];
const nameKey=n=>String(n||'').trim().toLowerCase();
function bestPerPlayer(list){
  const m=new Map();
  list.forEach(e=>{
    if(!e||typeof e.s!=='number'||!isFinite(e.s))return;
    const k=nameKey(e.n), p=m.get(k);
    if(!p||e.s>p.s)m.set(k,{n:String(e.n),s:e.s});
  });
  return [...m.values()].sort((x,y)=>y.s-x.s);
}
function loadBoard(){
  const raw=store.get('msd_board');
  if(raw===null||raw===undefined) return bestPerPlayer(DEFAULT_BOARD);   // nothing saved yet: starter scores
  try{const b=JSON.parse(raw); if(Array.isArray(b)) return bestPerPlayer(b);}catch(e){}
  return [];
}
let lastScore=null;
function renderBoard(){
  const l=$('boardList'); l.innerHTML='';
  const b=loadBoard().slice(0,5), me=nameKey(getPlayerName());
  if(!b.length){const li=document.createElement('li'); li.className='empty'; li.textContent='No scores yet'; l.appendChild(li); return;}
  b.forEach((e,i)=>{
    const li=document.createElement('li'); if(me&&nameKey(e.n)===me)li.className='me';
    const rk=document.createElement('span'); rk.className='rk'; rk.textContent=i+1;
    const nm=document.createElement('span'); nm.className='nm'; nm.textContent=e.n;
    const sc=document.createElement('span'); sc.className='sc'; sc.textContent=e.s;
    li.append(rk,nm,sc); l.appendChild(li);
  });
}
function getPlayerName(){ return store.get('msd_name') || null; }
function setPlayerName(n){ store.set('msd_name',n); }
function openRegister(){
  if(getPlayerName()){ state='level'; setNav('play'); show('levelScreen'); return; }   // already registered: never ask again
  state='register'; setNav('play');
  regName.value=getPlayerName()||''; regName.classList.remove('bad'); regErr.textContent='';
  show('registerScreen');
  setTimeout(()=>{ try{regName.focus();}catch(e){} },60);
}
function goFromIntro(){
  // Start music directly in the player's Enter gesture for mobile-browser compatibility.
  tryStartMusic();
  if(getPlayerName()){ state='level'; show('levelScreen'); }
  else openRegister();
}
function addScore(sc){
  const name = getPlayerName() || (CHARS.find(x=>x.id===char)||CHARS[0]).name;
  // one row per player: a new match only replaces their row if it beats their best
  const b=bestPerPlayer([...loadBoard(),{n:name,s:sc}]);
  store.set('msd_board',JSON.stringify(b.slice(0,5))); lastScore=sc; renderBoard();
}
function validateName(name){
  name=(name||'').trim();
  if(name.length<3||name.length>12) return 'Name must be 3-12 characters.';
  if(!/^[A-Za-z0-9 _-]+$/.test(name)) return 'Only letters, numbers, spaces, _ or -.';
  return '';
}
function clearBoard(){ store.set('msd_board','[]'); lastScore=null; renderBoard(); toast('Leaderboard cleared'); }
function setNav(n){document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.nav===n));}
function openInfo(id){
  if(state==='play') paused=true;
  const vis=[...document.querySelectorAll('.stage .overlay')].find(o=>!o.classList.contains('hidden'));
  if(!vis) infoBack='pauseScreen'; else if(vis.id!=='howScreen'&&vis.id!=='aboutScreen') infoBack=vis.id;
  show(id);
}
document.querySelectorAll('.nav button').forEach(b=>bindTap(b,()=>{
  if(qOpen)return;
  const n=b.dataset.nav; setNav(n);
  if(n==='home') quitToMenu();
  else if(n==='play'){
    if(state==='play'){ if(!qOpen){paused=false;hideAll();} }
    else if(!getPlayerName()) openRegister();
    else {state='level';show('levelScreen');}
  }
  else openInfo(n==='how'?'howScreen':'aboutScreen');
}));
document.querySelectorAll('[data-back]').forEach(b=>bindTap(b,()=>{show(infoBack);setNav(state==='play'?'play':'home');}));
// register screen
const regContinue=$('regContinue'), regBack=$('regBack'), regName=$('regName'), regErr=$('regErr');
function submitName(){
  if(getPlayerName()){ state='level'; show('levelScreen'); return; }   // name is locked after first registration
  const err=validateName(regName.value);
  regName.classList.toggle('bad',!!err);
  regErr.textContent=err;
  if(err) return;
  setPlayerName(regName.value.trim());
  setupPlayerCard();
  state='level'; show('levelScreen');
}
bindTap(regContinue,submitName);
bindTap(regBack,()=>{ state='intro'; show('introScreen'); setNav('home'); });
regName.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();submitName();} });
regName.addEventListener('input',()=>{ regErr.textContent=''; regName.classList.remove('bad'); });
// leaderboard clear
bindTap($('boardClear'), clearBoard);
[['upBtn2','up'],['downBtn2','down'],['leftBtn2','left'],['rightBtn2','right']].forEach(([id,d])=>bindDir($(id),d));

drawArt(); drawSky(); renderBoard(); setThreatHUD(null); riftsTotal=PREVIEW.flat().filter(t=>t==='M').length; setupPlayerCard(); updateHUD();

// init grids
renderLevelGrid(); renderMapGrid(); renderCharGrid();

// fallback: tap anywhere to advance from intro
document.addEventListener('touchstart', (e)=>{ if(state==='intro' && e.target.closest('.stage') && !e.target.closest('button')){ goFromIntro(); } }, {passive:true});

// initial
resize();
show('introScreen');
state='intro';
checkOrientation();