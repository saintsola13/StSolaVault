const K={pin:'ssv_pin',photos:'ssv_photos',pass:'ssv_pass'};
let pin='',editId=null;
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const load=(k,f)=>{try{const r=localStorage.getItem(k);return r?JSON.parse(r):f}catch{return f}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const hash=s=>{let h=0;for(let i=0;i<s.length;i++)h=((h<<5)-h)+s.charCodeAt(i)|0;return'h'+Math.abs(h).toString(36)};

function dots(){$$('.pin-dot').forEach((d,i)=>d.classList.toggle('filled',i<pin.length))}
function pinIn(n){if(pin.length>=6)return;pin+=n;dots();if(pin.length===6)setTimeout(check,120)}
function pinBk(){pin=pin.slice(0,-1);dots();if($('#pin-error'))$('#pin-error').style.opacity='0'}
function check(){
  const s=localStorage.getItem(K.pin);
  if(!s){localStorage.setItem(K.pin,hash(pin));enter();return}
  if(hash(pin)===s)enter();
  else{if($('#pin-error'))$('#pin-error').style.opacity='1';pin='';dots()}
}
function enter(){$('#pin-screen').classList.add('hidden');$('#vault-screen').classList.remove('hidden');home()}
function lock(){pin='';$('#vault-screen').classList.add('hidden');$('#pin-screen').classList.remove('hidden');dots()}
function home(){$('#home').classList.remove('hidden');$('#view-photos').classList.add('hidden');$('#view-pass').classList.add('hidden')}
function goPhotos(){$('#home').classList.add('hidden');$('#view-photos').classList.remove('hidden');$('#view-pass').classList.add('hidden');drawPhotos()}
function goPass(){$('#home').classList.add('hidden');$('#view-photos').classList.add('hidden');$('#view-pass').classList.remove('hidden');drawPass()}

function drawPhotos(){
  const g=$('#photos-grid'),ps=load(K.photos,[]);
  if(!g)return;
  g.innerHTML='';
  if(!ps.length){g.innerHTML='<div class="col-span-2 text-center opacity-50 py-10 text-sm">No photos yet</div>';return}
  ps.forEach((p,i)=>{
    const c=document.createElement('div');c.className='photo-card';
    c.innerHTML=`<img src="${p.d}"><button class="del">×</button>`;
    c.querySelector('img').onclick=()=>{if($('#viewer-img'))$('#viewer-img').src=p.d;$('#viewer').classList.remove('hidden');$('#viewer').classList.add('flex')};
    c.querySelector('.del').onclick=e=>{e.stopPropagation();ps.splice(i,1);save(K.photos,ps);drawPhotos()};
    g.appendChild(c);
  });
}
function addPhotos(files){
  const ps=load(K.photos,[]);
  [...files].forEach(f=>{
    if(!f.type.startsWith('image/')||f.size>3.5e6)return;
    const r=new FileReader();
    r.onload=()=>{ps.unshift({id:Date.now()+Math.random(),d:r.result});save(K.photos,ps.slice(0,20));drawPhotos()};
    r.readAsDataURL(f);
  });
}function drawPass(){
  const list=$('#pass-list'),items=load(K.pass,[]);
  if(!list)return;
  list.innerHTML='';
  if(!items.length){list.innerHTML='<div class="text-center opacity-50 py-10 text-sm">No passwords yet</div>';return}
  items.forEach(it=>{
    const c=document.createElement('div');c.className='pw-card';
    c.innerHTML=`<div class="t">${it.t}</div><div class="m">${it.u||''}</div><div class="m font-mono">${it.p}</div>
      ${it.n?`<div class="m opacity-50">${it.n}</div>`:''}
      <div class="actions"><button data-e="${it.id}">Edit</button><button data-d="${it.id}">Delete</button><button data-c="${it.id}">Copy</button></div>`;
    list.appendChild(c);
  });
  list.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>openM(b.dataset.e));
  list.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{if(confirm('Delete?')){save(K.pass,items.filter(x=>x.id!==b.dataset.d));drawPass()}});
  list.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{const it=items.find(x=>x.id===b.dataset.c);if(it)navigator.clipboard.writeText(it.p).then(()=>{b.textContent='Copied';setTimeout(()=>b.textContent='Copy',800)})});
}

function openM(id=null){
  editId=id;const items=load(K.pass,[]);
  if(id){const it=items.find(x=>x.id===id);$('#modal-title').textContent='Edit';$('#f-title').value=it.t;$('#f-user').value=it.u||'';$('#f-pass').value=it.p;$('#f-notes').value=it.n||''}
  else{$('#modal-title').textContent='Add Password';$('#pass-form').reset()}
  $('#modal').classList.remove('hidden');$('#modal').classList.add('flex');
}
function closeM(){$('#modal').classList.add('hidden');$('#modal').classList.remove('flex');editId=null}

document.addEventListener('DOMContentLoaded',()=>{
  $$('.pin-btn[data-n]').forEach(b=>b.onclick=()=>pinIn(b.dataset.n));
  if($('#pin-back'))$('#pin-back').onclick=pinBk;
  if($('#lock-btn'))$('#lock-btn').onclick=lock;
  if($('#btn-photos'))$('#btn-photos').onclick=goPhotos;
  if($('#btn-pass'))$('#btn-pass').onclick=goPass;
  $$('[data-back]').forEach(b=>b.onclick=home);
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
  if($('#viewer-close'))$('#viewer-close').onclick=()=>{$('#viewer').classList.add('hidden');$('#viewer').classList.remove('flex')};

  let startY=0;
  document.addEventListener('touchstart',e=>{startY=e.touches[0].clientY},{passive:true});
  document.addEventListener('touchmove',e=>{
    const dy=(e.touches[0].clientY-startY)*0.05;
    const img=$('#bg-img');
    if(img)img.style.transform=`translate3d(0,${dy}px,0) scale(1.06)`;
  },{passive:true});

  const has=!!localStorage.getItem(K.pin);
  if($('#pin-hint'))$('#pin-hint').classList.toggle('hidden',has);
});
