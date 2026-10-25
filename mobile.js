(()=>{
const compact=matchMedia('(max-width:800px)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const hero=document.querySelector('.hero');
const examples=[...document.querySelectorAll('.project-example')].map((example,index)=>{
 const details=document.createElement('details');details.className='code-disclosure';
 const summary=document.createElement('summary');const files=example.querySelectorAll('pre').length;
 summary.innerHTML=`<span class="disclosure-text"><small>${index===0?'PYTHON':'GO'} · ${files} ${files>1?'FILES':'FILE'}</small><span>View ${index===0?'Python':'Go'} example</span></span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 6 5 5 5-5"/></svg>`;
 example.before(details);details.append(summary,example);
 summary.addEventListener('click',event=>animateDisclosure(details,example,event));
 example.addEventListener('scroll',()=>markEnd(example),{passive:true});
 return details;
});
function markEnd(panel){panel.classList.toggle('at-end',panel.scrollTop+panel.clientHeight>=panel.scrollHeight-2)}
// Native <details> cannot animate its height; on phones the panel grows and shrinks instead of jumping.
function animateDisclosure(details,panel,event){
 if(!compact.matches||reduced.matches)return;
 event.preventDefault();
 if(details.dataset.moving)return;
 details.dataset.moving='1';
 const opening=!details.open;
 if(opening){details.open=true;panel.scrollTop=0;markEnd(panel)}
 const full=`${panel.offsetHeight}px`;
 const frames=opening?[{height:'0px',opacity:0},{height:full,opacity:1}]:[{height:full,opacity:1},{height:'0px',opacity:0}];
 const motion=panel.animate(frames,{duration:opening?320:220,easing:'cubic-bezier(.2,.75,.2,1)'});
 motion.onfinish=()=>{if(!opening)details.open=false;motion.cancel();delete details.dataset.moving};
}

// Phones: the profile is re-projected at each chapter boundary, driven by the scroll position.
// Shared rows keep their slot, so the reader sees the same object with fields swapped.
const {fields,views}=window.caspelProjection;
const phone={hero:['role','domain','practice'],about:['role','domain','group'],approach:['python','go','practice','delivery'],work:['ninja','goninja','shiori','shimwire','vault','olympus'],contact:['github','linkedin']};
const chain=[
 {from:'hero',to:'about',place:seam=>hero.insertBefore(seam,hero.querySelector('.hero-footer'))},
 {from:'about',to:'approach',place:seam=>document.querySelector('#approach').prepend(seam)},
 {from:'approach',to:'work',place:seam=>document.querySelector('#work').prepend(seam)},
 // The project list ends with these two, which is what the reader has just seen.
 {from:'work',to:'contact',keys:phone.work.slice(-2),place:seam=>document.querySelector('.contact').prepend(seam)}];
const total=String(Object.keys(fields).length).padStart(2,'0');
const count=keys=>`${String(keys.length).padStart(2,'0')} / ${total} FIELDS`;
const seams=chain.map(({from,to,keys,place})=>{
 const before=keys||phone[from],after=phone[to];
 const seam=document.createElement('div');seam.className='projection-seam';seam.setAttribute('aria-hidden','true');
 seam.innerHTML=`<div class="seam-meta"><span>schema: <span class="seam-swap seam-schema"><b class="seam-old">${views[from].schema}</b><b class="seam-new">${views[to].schema}</b></span></span><span class="seam-swap"><span class="seam-old">${count(before)}</span><span class="seam-new">${count(after)}</span></span></div><div class="seam-open">caspel26 <i>{</i></div><div class="seam-rows"></div><div class="seam-close">}</div>`;
 const list=seam.querySelector('.seam-rows');list.style.setProperty('--rows',Math.max(before.length,after.length));
 const rows=[...new Set([...before,...after])].map(id=>{
  const el=document.createElement('div');el.className='seam-row';el.innerHTML='<span class="seam-mark"></span><span class="seam-key"></span><span class="seam-value"></span>';
  el.children[1].textContent=fields[id][0]+':';el.children[2].textContent=`"${fields[id][1]}"`;list.append(el);
  const was=before.indexOf(id),is=after.indexOf(id);
  el.children[0].textContent=was<0?'+':is<0?'−':'';
  return {el,mark:el.children[0],was,is};
 });
 place(seam);
 return {seam,rows,opening:from==='hero'};
});

function paint({seam,rows},progress){
 seam.style.setProperty('--p',progress.toFixed(3));
 rows.forEach(({el,mark,was,is})=>{
  const local=Math.min(1,Math.max(0,(progress-Math.max(was,is)*.06)/.64));
  // A slot first empties, then refills, so the old and new field never overlap.
  const step=was<0?Math.max(0,local*2-1):Math.min(1,local*2);
  let x=0,y=is,opacity=1,clip='inset(0 0 0 0)';
  if(was<0){x=(1-step)*96;opacity=step;clip=`inset(0 ${((1-step)*100).toFixed(1)}% 0 0)`}
  else if(is<0){x=-step*96;y=was;opacity=1-step;clip=`inset(0 ${(step*100).toFixed(1)}% 0 0)`}
  el.style.transform=`translate3d(${x.toFixed(1)}px,calc(${y} * var(--gap)),0)`;el.style.opacity=opacity.toFixed(3);el.style.clipPath=clip;
  mark.style.opacity=Math.sin(step*Math.PI).toFixed(3);
 });
}
// Chapters re-project while entering the lower part of the screen; the opening one while leaving the top.
function progress({seam,opening}){
 const top=seam.getBoundingClientRect().top,start=opening?Math.min(innerHeight*.42,top+scrollY-1):innerHeight*.9,span=innerHeight*(opening?.36:.4);
 const value=Math.min(1,Math.max(0,(start-top)/span));
 return reduced.matches||document.querySelector('.ambient-toggle')?.getAttribute('aria-pressed')==='true'?Math.round(value):value;
}
let scheduled=false;
function update(){scheduled=false;if(compact.matches)seams.forEach(item=>paint(item,progress(item)))}
function queue(){if(!scheduled){scheduled=true;requestAnimationFrame(update)}}
function mount(){examples.forEach(d=>d.open=!compact.matches);queue()}
addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue,{passive:true});reduced.addEventListener('change',queue);document.querySelector('.ambient-toggle')?.addEventListener('click',queue);compact.addEventListener('change',mount);mount();
})();
