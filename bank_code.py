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
  return mcNum('Bayes','Suppliers A/B have priors '+pA+'%/'+pB+'% and poor-quality rates '+a+'%/'+b+'%. If a random item is poor quality, P(from '+w+' | poor) = ?',num/den*100,[num/den*100+5,num/den*100-5, (w==='A'?pA:pB), a],2);}
function qBayesTot(){const pA=pick([50,60,70]),pB=100-pA,gA=pick([85,90,95]),gB=pick([70,75,80,85]),ans=(pA*gA+pB*gB)/10000;
  return mcNum('Bayes','P(good quality) = P(A)P(good|A)+P(B)P(good|B) with priors '+pA+'%/'+pB+'% and good rates '+gA+'%/'+gB+'% = ?',ans*100,[ans*100+5,ans*100-5,pA*gA/100+pB*gB/100-0.1],2);}
function qMean(){const p=tenths(), m=p.reduce((s,t,x)=>s+x*t,0)/10;
  return mcNum('Distribution','For discrete values x=0,1,2,3 with P(x)='+pf(p)+', mean u = ?',m,[m+0.2,m-0.2,m*2,0.5],2);}
function qVar(){const p=tenths(), st=distStats(p);
  return mcNum('Distribution','For x=0,1,2,3 with P(x)='+pf(p)+', variance sigma^2 = ?',st.v,[st.v+0.3,st.v-0.2,st.m,st.e2],2);}
function qMissing(){const p=[pick([2,3,4]),pick([3,4,5]),pick([1,2,3]),0], tot=p.slice(0,3).reduce((a,b)=>a+b,0)/10, miss=1-tot;
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
function qTable(){const t=pick(['Z','T','Chi-square']);
  return mc('Normal','Which table is used for the '+t+' distribution? (concept check)','Standard normal table',['Binomial table','Poisson table','F-table']);}
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