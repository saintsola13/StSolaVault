const K={pin:'ssv_pin',photos:'ssv_photos',pass:'ssv_pass'};
let pin='',editId=null;
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const load=(k,f)=>{try{const r=localStorage.getItem(k);return r?JSON.parse(r):f}catch{return f}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){console.warn('save failed',e);return false}};
const hash=s=>{let h=0;for(let i=0;i<s.length;i++)h=((h<<5)-h)+s.charCodeAt(i)|0;return'h'+Math.abs(h).toString(36)};
const reduceMotion=()=>window.matchMedia('(prefers-reduced-motion:reduce)').matches;

function dots(){$$('.pin-dot').forEach((d,i)=>d.classList.toggle('filled',i<pin.length))}
function pinIn(n){if(pin.length>=6)return;pin+=n;dots();if(pin.length===6)setTimeout(check,130)}
function pinBk(){pin=pin.slice(0,-1);dots();const e=$('#pin-error');if(e)e.style.opacity='0'}
function check(){
  const s=localStorage.getItem(K.pin);
  if(!s){localStorage.setItem(K.pin,hash(pin));enter();return}
  if(hash(pin)===s)enter();
  else{
    const err=$('#pin-error'),tile=$('#pin-screen .glass');
    if(err)err.style.opacity='1';
    if(tile&&!reduceMotion()){tile.classList.remove('pin-shake');void tile.offsetWidth;tile.classList.add('pin-shake');setTimeout(()=>tile.classList.remove('pin-shake'),340)}
    pin='';dots();
  }
}

function showEl(el){
  if(!el)return;
  el.classList.remove('hidden');
  if(!reduceMotion()){el.classList.remove('view-leave');el.classList.add('view-enter')}
}
function hideEl(el,cb){
  if(!el||el.classList.contains('hidden')){if(cb)cb();return}
  if(reduceMotion()){el.classList.add('hidden');if(cb)cb();return}
  el.classList.remove('view-enter');
  el.classList.add('view-leave');
  setTimeout(()=>{el.classList.add('hidden');el.classList.remove('view-leave');if(cb)cb()},220);
}

function enter(){
  hideEl($('#pin-screen'),()=>{
    const v=$('#vault-screen');
    if(v){v.classList.remove('hidden');if(!reduceMotion()){v.classList.add('view-enter');setTimeout(()=>v.classList.remove('view-enter'),320)}}
    home(true);
  });
}
function lock(){
  pin='';
  hideEl($('#vault-screen'),()=>{
    const p=$('#pin-screen');
    if(p){p.classList.remove('hidden');if(!reduceMotion()){p.classList.add('view-enter');setTimeout(()=>p.classList.remove('view-enter'),320)}}
    dots();
  });
}
function home(instant){
  const h=$('#home'),ph=$('#view-photos'),pa=$('#view-pass');
  if(instant||reduceMotion()){
    if(h)h.classList.remove('hidden');
    if(ph)ph.classList.add('hidden');
    if(pa)pa.classList.add('hidden');
    return;
  }
  const leaving=[ph,pa].find(x=>x&&!x.classList.contains('hidden'));
  if(leaving)hideEl(leaving,()=>showEl(h));
  else showEl(h);
}
function goPhotos(){
  const h=$('#home'),ph=$('#view-photos'),pa=$('#view-pass');
  if(pa&&!pa.classList.contains('hidden'))hideEl(pa,()=>{if(h)h.classList.add('hidden');showEl(ph);drawPhotos()});
  else hideEl(h,()=>{showEl(ph);drawPhotos()});
}
function goPass(){
  const h=$('#home'),ph=$('#view-photos'),pa=$('#view-pass');
  if(ph&&!ph.classList.contains('hidden'))hideEl(ph,()=>{if(h)h.classList.add('hidden');showEl(pa);drawPass()});
  else hideEl(h,()=>{showEl(pa);drawPass()});
}

function drawPhotos(){
  const g=$('#photos-grid'),ps=load(K.photos,[]);
  if(!g)return;
  g.innerHTML='';
  if(!ps.length){g.innerHTML='<div class="col-span-2 text-center opacity-50 py-10 text-sm">No photos yet</div>';return}
  ps.forEach((p,i)=>{
    const c=document.createElement('div');c.className='photo-card';
    if(!reduceMotion())c.style.animationDelay=(i*40)+'ms';
    c.innerHTML=`<img src="${p.d}" alt=""><button class="del" type="button">×</button>`;
    c.querySelector('img').onclick=()=>{
      const vi=$('#viewer-img'),v=$('#viewer');
      if(vi)vi.src=p.d;
      if(v){v.classList.remove('hidden');v.classList.add('flex')}
    };
    c.querySelector('.del').onclick=e=>{
      e.stopPropagation();
      const next=load(K.photos,[]).filter(x=>x.id!==p.id);
      save(K.photos,next);
      drawPhotos();
    };
    g.appendChild(c);
  });
}

function addPhotos(files){
  const list=[...files].filter(f=>f.type.startsWith('image/')&&f.size<=4e6);
  if(!list.length)return;
  let i=0;
  function next(){
    if(i>=list.length){drawPhotos();return}
    const f=list[i++];
    const r=new FileReader();
    r.onload=()=>{
      const ps=load(K.photos,[]);
      ps.unshift({id:Date.now()+'_'+Math.random().toString(36).slice(2),d:r.result});
      const ok=save(K.photos,ps.slice(0,15));
      if(!ok)alert('Storage full. Delete a photo and try again.');
      next();
    };
    r.onerror=()=>next();
    r.readAsDataURL(f);
  }
  next();
}

function drawPass(){
  const list=$('#pass-list'),items=load(K.pass,[]);
  if(!list)return;
  list.innerHTML='';
  if(!items.length){list.innerHTML='<div class="text-center opacity-50 py-10 text-sm">No passwords yet</div>';return}
  items.forEach((it,i)=>{
    const c=document.createElement('div');c.className='pw-card';
    if(!reduceMotion())c.style.animationDelay=(i*40)+'ms';
    c.innerHTML=`<div class="t">${it.t}</div><div class="m">${it.u||''}</div><div class="m font-mono">${it.p}</div>
      ${it.n?`<div class="m opacity-50">${it.n}</div>`:''}
      <div class="actions"><button type="button" data-e="${it.id}">Edit</button><button type="button" data-d="${it.id}">Delete</button><button type="button" data-c="${it.id}">Copy</button></div>`;
    list.appendChild(c);
  });
  list.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>openM(b.dataset.e));
  list.querySelectorAll('[data-d]').forEach(b=>b.onclick=e=>{
    e.preventDefault();e.stopPropagation();
    if(confirm('Delete this password?')){
      const id=b.getAttribute('data-d');
      save(K.pass,load(K.pass,[]).filter(x=>x.id!==id));
      drawPass();
    }
  });
  list.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{
    const it=items.find(x=>x.id===b.dataset.c);
    if(it)navigator.clipboard.writeText(it.p).then(()=>{b.textContent='Copied';setTimeout(()=>b.textContent='Copy',800)});
  });
}

function openM(id=null){
  editId=id;const items=load(K.pass,[]);
  if(id){const it=items.find(x=>x.id===id);$('#modal-title').textContent='Edit';$('#f-title').value=it.t;$('#f-user').value=it.u||'';$('#f-pass').value=it.p;$('#f-notes').value=it.n||''}
  else{$('#modal-title').textContent='Add Password';$('#pass-form').reset()}
  const m=$('#modal');
  if(m){m.classList.remove('hidden');m.classList.add('flex','is-open')}
}
function closeM(){
  const m=$('#modal');
  if(m){m.classList.remove('is-open');m.classList.add('hidden');m.classList.remove('flex')}
  editId=null;
}

(function(){
  const img=()=>$('#bg-img');
  let targetY=0,currentY=0,raf=null,touching=false;
  const max=14;
  function tick(){
    currentY+=(targetY-currentY)*0.08;
    if(Math.abs(targetY-currentY)<0.05)currentY=targetY;
    const el=img();
    if(el)el.style.transform=`translate3d(0,${currentY.toFixed(2)}px,0) scale(1.04)`;
    if(Math.abs(targetY-currentY)>0.05||touching)raf=requestAnimationFrame(tick);
    else raf=null;
  }
  function start(){if(!raf&&!reduceMotion())raf=requestAnimationFrame(tick)}
  let startY=0;
  document.addEventListener('touchstart',e=>{touching=true;startY=e.touches[0].clientY},{passive:true});
  document.addEventListener('touchmove',e=>{
    if(reduceMotion())return;
    const dy=(e.touches[0].clientY-startY)*0.03;
    targetY=Math.max(-max,Math.min(max,dy));
    start();
  },{passive:true});
  document.addEventListener('touchend',()=>{touching=false;targetY=0;start()},{passive:true});
  document.addEventListener('touchcancel',()=>{touching=false;targetY=0;start()},{passive:true});
})();

document.addEventListener('DOMContentLoaded',()=>{
  $$('.pin-btn[data-n]').forEach(b=>b.onclick=()=>pinIn(b.dataset.n));
  if($('#pin-back'))$('#pin-back').onclick=pinBk;
  if($('#lock-btn'))$('#lock-btn').onclick=lock;
  if($('#btn-photos'))$('#btn-photos').onclick=goPhotos;
  if($('#btn-pass'))$('#btn-pass').onclick=goPass;
  $$('[data-back]').forEach(b=>b.onclick=()=>home(false));
  if($('#btn-add-photo'))$('#btn-add-photo').onclick=()=>$('#photo-input')&&$('#photo-input').click();
  if($('#photo-input'))$('#photo-input').onchange=e=>{if(e.target.files?.length)addPhotos(e.target.files);e.target.value=''};
  if($('#btn-add-pass'))$('#btn-add-pass').onclick=()=>openM();
  if($('#pass-form'))$('#pass-form').onsubmit=e=>{
    e.preventDefault();
    const t=$('#f-title').value.trim(),u=$('#f-user').value.trim(),p=$('#f-pass').value,n=$('#f-notes').value.trim();
    if(!t||!p)return;
    let items=load(K.pass,[]);
    if(editId)items=items.map(x=>x.id===editId?{...x,t,u,p,n}:x);
    else items.unshift({id:Date.now().toString(36),t,u,p,n});
    save(K.pass,items);closeM();drawPass();
  };
  if($('#modal-cancel'))$('#modal-cancel').onclick=closeM;
  if($('#viewer-close'))$('#viewer-close').onclick=()=>{
    const v=$('#viewer');
    if(v){v.classList.add('hidden');v.classList.remove('flex')}
  };
  if($('#viewer'))$('#viewer').onclick=e=>{if(e.target===$('#viewer')){$('#viewer').classList.add('hidden');$('#viewer').classList.remove('flex')}};

  const audio=$('#bg-audio');
  let musicOn=false;
  function startMusic(){
    if(!audio||musicOn)return;
    audio.volume=0.55;
    audio.play().then(()=>{musicOn=true}).catch(()=>{});
  }
  document.addEventListener('touchstart',startMusic,{once:true,passive:true});
  document.addEventListener('click',startMusic,{once:true});
  if($('#mute-btn'))$('#mute-btn').onclick=()=>{
    if(!audio)return;
    audio.muted=!audio.muted;
    $('#mute-btn').textContent=audio.muted?'🔇':'🔊';
  };

  const has=!!localStorage.getItem(K.pin);
  if($('#pin-hint'))$('#pin-hint').classList.toggle('hidden',has);
});
