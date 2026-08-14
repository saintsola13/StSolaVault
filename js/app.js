const K={pin:'ssv_pin',photos:'ssv_photos',passwords:'ssv_passwords'};
let pin='',editId=null;
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const load=(k,f)=>{try{const r=localStorage.getItem(k);return r?JSON.parse(r):f}catch{return f}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const hash=s=>{let h=0;for(let i=0;i<s.length;i++)h=((h<<5)-h)+s.charCodeAt(i)|0;return'h'+Math.abs(h).toString(36)};

function updateDots(){$$('.pin-dot').forEach((d,i)=>d.classList.toggle('filled',i<pin.length))}
function pinIn(n){if(pin.length>=6)return;pin+=n;updateDots();if(pin.length===6)setTimeout(check,130)}
function pinBack(){pin=pin.slice(0,-1);updateDots();$('#pin-error').style.opacity='0'}
function check(){
  const s=localStorage.getItem(K.pin);
  if(!s){localStorage.setItem(K.pin,hash(pin));goVault();return}
  if(hash(pin)===s)goVault();
  else{$('#pin-error').style.opacity='1';pin='';updateDots()}
}
function goVault(){$('#pin-screen').classList.add('hidden');$('#vault-screen').classList.remove('hidden');home()}
function lock(){pin='';$('#vault-screen').classList.add('hidden');$('#pin-screen').classList.remove('hidden');updateDots()}
function home(){$('#home-tiles').classList.remove('hidden');$('#photos-view').classList.add('hidden');$('#passwords-view').classList.add('hidden')}
function showPhotos(){$('#home-tiles').classList.add('hidden');$('#photos-view').classList.remove('hidden');$('#passwords-view').classList.add('hidden');drawPhotos()}
function showPass(){$('#home-tiles').classList.add('hidden');$('#photos-view').classList.add('hidden');$('#passwords-view').classList.remove('hidden');drawPass()}

function drawPhotos(){
  const g=$('#photos-grid'),ps=load(K.photos,[]);
  g.innerHTML='';
  if(!ps.length){g.innerHTML='<div class="col-span-2 text-center opacity-50 py-12 text-sm">No photos yet</div>';return}
  ps.forEach((p,i)=>{
    const c=document.createElement('div');c.className='photo-card';
    c.innerHTML=`<img src="${p.data}"><button class="delete-btn">×</button>`;
    c.querySelector('img').onclick=()=>{$('#viewer-img').src=p.data;$('#photo-viewer').classList.remove('hidden');$('#photo-viewer').classList.add('flex')};
    c.querySelector('.delete-btn').onclick=e=>{e.stopPropagation();ps.splice(i,1);save(K.photos,ps);drawPhotos()};
    g.appendChild(c);
  });
}
function addPhotos(files){
  const ps=load(K.photos,[]);
  [...files].forEach(f=>{
    if(!f.type.startsWith('image/')||f.size>4e6)return;
    const r=new FileReader();
    r.onload=()=>{ps.unshift({id:Date.now()+Math.random(),data:r.result});save(K.photos,ps.slice(0,25));drawPhotos()};
    r.readAsDataURL(f);
  });
}

function drawPass(){
  const list=$('#passwords-list'),items=load(K.passwords,[]);
  list.innerHTML='';
  if(!items.length){list.innerHTML='<div class="text-center opacity-50 py-12 text-sm">No passwords yet</div>';return}
  items.forEach(it=>{
    const c=document.createElement('div');c.className='pw-card';
    c.innerHTML=`<div class="pw-title">${it.title}</div><div class="pw-meta">${it.username||''}</div><div class="pw-meta font-mono tracking-wide">${it.password}</div>
      ${it.notes?`<div class="pw-meta opacity-50 mt-1">${it.notes}</div>`:''}
      <div class="pw-actions"><button data-e="${it.id}">Edit</button><button data-d="${it.id}">Delete</button><button data-c="${it.id}">Copy</button></div>`;
    list.appendChild(c);
  });
  list.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>openModal(b.dataset.e));
  list.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{if(confirm('Delete this?')){save(K.passwords,items.filter(x=>x.id!==b.dataset.d));drawPass()}});
  list.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{const it=items.find(x=>x.id===b.dataset.c);if(it)navigator.clipboard.writeText(it.password).then(()=>{b.textContent='Copied';setTimeout(()=>b.textContent='Copy',900)})});
}

function openModal(id=null){
  editId=id;const items=load(K.passwords,[]);
  if(id){const it=items.find(x=>x.id===id);$('#modal-title').textContent='Edit';$('#pw-title').value=it.title;$('#pw-username').value=it.username||'';$('#pw-password').value=it.password;$('#pw-notes').value=it.notes||''}
  else{$('#modal-title').textContent='Add Password';$('#password-form').reset()}
  $('#password-modal').classList.remove('hidden');$('#password-modal').classList.add('flex');
}
function closeModal(){$('#password-modal').classList.add('hidden');$('#password-modal').classList.remove('flex');editId=null}

document.addEventListener('DOMContentLoaded',()=>{
  $$('.pin-btn[data-num]').forEach(b=>b.onclick=()=>pinIn(b.dataset.num));
  $('#pin-back').onclick=pinBack;
  $('#logout-btn').onclick=lock;
  $('#photos-tile').onclick=showPhotos;
  $('#passwords-tile').onclick=showPass;
  $$('[data-back]').forEach(b=>b.onclick=home);
  $('#photo-input').onchange=e=>{if(e.target.files?.length)addPhotos(e.target.files);e.target.value=''};
  $('#add-password-btn').onclick=()=>openModal();
  $('#password-form').onsubmit=e=>{
    e.preventDefault();
    const t=$('#pw-title').value.trim(),u=$('#pw-username').value.trim(),p=$('#pw-password').value,n=$('#pw-notes').value.trim();
    if(!t||!p)return;
    let items=load(K.passwords,[]);
    if(editId)items=items.map(x=>x.id===editId?{...x,title:t,username:u,password:p,notes:n}:x);
    else items.unshift({id:Date.now().toString(36),title:t,username:u,password:p,notes:n});
    save(K.passwords,items);closeModal();drawPass();
  };
  $('#modal-cancel').onclick=closeModal;
  $('#viewer-close').onclick=()=>{$('#photo-viewer').classList.add('hidden');$('#photo-viewer').classList.remove('flex')};
  const has=!!localStorage.getItem(K.pin);
  $('#pin-setup-hint').classList.toggle('hidden',has);
});
