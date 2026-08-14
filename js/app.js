const STORAGE_KEYS = { pin: 'ssv_pin', photos: 'ssv_photos', passwords: 'ssv_passwords' };
let currentPin = '';
let editingId = null;

function $(s){return document.querySelector(s)}
function $$(s){return document.querySelectorAll(s)}
function load(k,f){try{const r=localStorage.getItem(k);return r?JSON.parse(r):f}catch{return f}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
function hash(s){let h=0;for(let i=0;i<s.length;i++)h=((h<<5)-h)+s.charCodeAt(i)|0;return 'h'+Math.abs(h).toString(36)}

function updateDots(){$$('.pin-dot').forEach((d,i)=>d.classList.toggle('filled',i<currentPin.length))}
function pinInput(n){if(currentPin.length>=6)return;currentPin+=n;updateDots();if(currentPin.length===6)setTimeout(checkPin,120)}
function pinBack(){currentPin=currentPin.slice(0,-1);updateDots();$('#pin-error').style.opacity='0'}
function checkPin(){
  const stored=localStorage.getItem(STORAGE_KEYS.pin);
  if(!stored){localStorage.setItem(STORAGE_KEYS.pin,hash(currentPin));enter();return}
  if(hash(currentPin)===stored)enter();
  else{$('#pin-error').style.opacity='1';currentPin='';updateDots()}
}
function enter(){$('#pin-screen').classList.add('hidden');$('#vault-screen').classList.remove('hidden');showHome()}
function lock(){currentPin='';$('#vault-screen').classList.add('hidden');$('#pin-screen').classList.remove('hidden');updateDots()}
function showHome(){$('#home-tiles').classList.remove('hidden');$('#photos-view').classList.add('hidden');$('#passwords-view').classList.add('hidden')}
function showPhotos(){$('#home-tiles').classList.add('hidden');$('#photos-view').classList.remove('hidden');$('#passwords-view').classList.add('hidden');renderPhotos()}
function showPasswords(){$('#home-tiles').classList.add('hidden');$('#photos-view').classList.add('hidden');$('#passwords-view').classList.remove('hidden');renderPasswords()}

function renderPhotos(){
  const grid=$('#photos-grid'),photos=load(STORAGE_KEYS.photos,[]);
  grid.innerHTML='';
  if(!photos.length){grid.innerHTML='<div class="col-span-2 text-center opacity-60 py-10 text-sm">No photos yet</div>';return}
  photos.forEach((p,i)=>{
    const c=document.createElement('div');c.className='photo-card';
    c.innerHTML=`<img src="${p.data}"/><button class="delete-btn">×</button>`;
    c.querySelector('img').onclick=()=>{ $('#viewer-img').src=p.data;$('#photo-viewer').classList.remove('hidden');$('#photo-viewer').classList.add('flex')};
    c.querySelector('.delete-btn').onclick=e=>{e.stopPropagation();photos.splice(i,1);save(STORAGE_KEYS.photos,photos);renderPhotos()};
    grid.appendChild(c);
  });
}

function addPhotos(files){
  const photos=load(STORAGE_KEYS.photos,[]);
  Array.from(files).forEach(f=>{
    if(!f.type.startsWith('image/')||f.size>4e6)return;
    const r=new FileReader();
    r.onload=()=>{photos.unshift({id:Date.now()+Math.random(),data:r.result});save(STORAGE_KEYS.photos,photos.slice(0,30));renderPhotos()};
    r.readAsDataURL(f);
  });
}

function renderPasswords(){
  const list=$('#passwords-list'),items=load(STORAGE_KEYS.passwords,[]);
  list.innerHTML='';
  if(!items.length){list.innerHTML='<div class="text-center opacity-60 py-10 text-sm">No passwords saved</div>';return}
  items.forEach(item=>{
    const c=document.createElement('div');c.className='pw-card';
    c.innerHTML=`<div class="pw-title">${item.title}</div><div class="pw-meta">${item.username||''}</div><div class="pw-meta font-mono">${item.password}</div>
      <div class="pw-actions"><button data-e="${item.id}">Edit</button><button data-d="${item.id}">Delete</button><button data-c="${item.id}">Copy</button></div>`;
    list.appendChild(c);
  });
  list.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>openModal(b.dataset.e));
  list.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{if(confirm('Delete?')){save(STORAGE_KEYS.passwords,items.filter(x=>x.id!==b.dataset.d));renderPasswords()}});
  list.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{const it=items.find(x=>x.id===b.dataset.c);if(it)navigator.clipboard.writeText(it.password).then(()=>{b.textContent='Copied!';setTimeout(()=>b.textContent='Copy',1000)})});
}

function openModal(id=null){
  editingId=id;
  const items=load(STORAGE_KEYS.passwords,[]);
  if(id){const it=items.find(x=>x.id===id);$('#modal-title').textContent='Edit';$('#pw-title').value=it.title;$('#pw-username').value=it.username||'';$('#pw-password').value=it.password;$('#pw-notes').value=it.notes||''}
  else{$('#modal-title').textContent='Add Password';$('#password-form').reset()}
  $('#password-modal').classList.remove('hidden');$('#password-modal').classList.add('flex');
}
function closeModal(){$('#password-modal').classList.add('hidden');$('#password-modal').classList.remove('flex');editingId=null}

document.addEventListener('DOMContentLoaded',()=>{
  $$('.pin-btn[data-num]').forEach(b=>b.onclick=()=>pinInput(b.dataset.num));
  $('#pin-back').onclick=pinBack;
  $('#logout-btn').onclick=lock;
  $('#photos-tile').onclick=showPhotos;
  $('#passwords-tile').onclick=showPasswords;
  $$('[data-back]').forEach(b=>b.onclick=showHome);
  $('#photo-input').onchange=e=>{if(e.target.files?.length)addPhotos(e.target.files);e.target.value=''};
  $('#add-password-btn').onclick=()=>openModal();
  $('#password-form').onsubmit=e=>{
    e.preventDefault();
    const t=$('#pw-title').value.trim(),u=$('#pw-username').value.trim(),p=$('#pw-password').value,n=$('#pw-notes').value.trim();
    if(!t||!p)return;
    let items=load(STORAGE_KEYS.passwords,[]);
    if(editingId)items=items.map(x=>x.id===editingId?{...x,title:t,username:u,password:p,notes:n}:x);
    else items.unshift({id:Date.now().toString(36),title:t,username:u,password:p,notes:n});
    save(STORAGE_KEYS.passwords,items);closeModal();renderPasswords();
  };
  $('#modal-cancel').onclick=closeModal;
  $('#viewer-close').onclick=()=>{$('#photo-viewer').classList.add('hidden');$('#photo-viewer').classList.remove('flex')};
  const stored=localStorage.getItem(STORAGE_KEYS.pin);
  $('#pin-setup-hint').classList.toggle('hidden',!!stored);
});
