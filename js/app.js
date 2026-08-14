// StSolaVault - Simple PIN vault
const STORAGE_KEYS = {
  pin: 'ssv_pin',
  photos: 'ssv_photos',
  passwords: 'ssv_passwords'
};

let currentPin = '';
let isSetupMode = false;
let editingPasswordId = null;

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return 'h' + Math.abs(h).toString(36);
}

function initPinScreen() {
  const stored = localStorage.getItem(STORAGE_KEYS.pin);
  isSetupMode = !stored;
  $('#pin-setup-hint').classList.toggle('hidden', !isSetupMode);
  currentPin = '';
  updatePinDots();
  $('#pin-error').style.opacity = '0';
}

function updatePinDots() {
  $$('.pin-dot').forEach((dot, i) => {
    dot.classList.toggle('filled', i < currentPin.length);
  });
}

function handlePinInput(num) {
  if (currentPin.length >= 6) return;
  currentPin += num;
  updatePinDots();
  if (currentPin.length === 6) {
    setTimeout(checkPin, 180);
  }
}

function handlePinBack() {
  currentPin = currentPin.slice(0, -1);
  updatePinDots();
  $('#pin-error').style.opacity = '0';
}

function checkPin() {
  const storedHash = localStorage.getItem(STORAGE_KEYS.pin);
  if (isSetupMode) {
    localStorage.setItem(STORAGE_KEYS.pin, simpleHash(currentPin));
    enterVault();
    return;
  }
  if (simpleHash(currentPin) === storedHash) {
    enterVault();
  } else {
    $('#pin-error').style.opacity = '1';
    currentPin = '';
    updatePinDots();
    const tile = $('#pin-screen .glass-tile');
    tile.style.transform = 'translateX(8px)';
    setTimeout(() => tile.style.transform = 'translateX(-8px)', 60);
    setTimeout(() => tile.style.transform = 'translateX(4px)', 120);
    setTimeout(() => tile.style.transform = '', 180);
  }
}

function enterVault() {
  $('#pin-screen').classList.add('hidden');
  $('#vault-screen').classList.remove('hidden');
  showHome();
}

function lockVault() {
  currentPin = '';
  $('#vault-screen').classList.add('hidden');
  $('#pin-screen').classList.remove('hidden');
  initPinScreen();
}

function showHome() {
  $('#home-tiles').classList.remove('hidden');
  $('#photos-view').classList.add('hidden');
  $('#passwords-view').classList.add('hidden');
}

function showPhotos() {
  $('#home-tiles').classList.add('hidden');
  $('#photos-view').classList.remove('hidden');
  $('#passwords-view').classList.add('hidden');
  renderPhotos();
}

function showPasswords() {
  $('#home-tiles').classList.add('hidden');
  $('#photos-view').classList.add('hidden');
  $('#passwords-view').classList.remove('hidden');
  renderPasswords();
}

function getPhotos() {
  return load(STORAGE_KEYS.photos, []);
}

function renderPhotos() {
  const grid = $('#photos-grid');
  const photos = getPhotos();
  grid.innerHTML = '';
  if (photos.length === 0) {
    grid.innerHTML = `<div class="col-span-2 text-center opacity-60 py-12 text-sm">No photos yet</div>`;
    return;
  }
  photos.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.innerHTML = `
      <img src="${p.data}" alt="Photo" loading="lazy" />
      <button class="delete-btn" data-idx="${idx}">×</button>
    `;
    card.querySelector('img').addEventListener('click', () => openViewer(p.data));
    card.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deletePhoto(idx);
    });
    grid.appendChild(card);
  });
}

function addPhotos(files) {
  const photos = getPhotos();
  const readers = [];
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 4 * 1024 * 1024) {
      alert('Image too large (max ~4MB)');
      return;
    }
    const reader = new FileReader();
    readers.push(new Promise(resolve => {
      reader.onload = () => {
        photos.unshift({
          id: Date.now() + Math.random().toString(36).slice(2),
          data: reader.result,
          name: file.name,
          added: new Date().toISOString()
        });
        resolve();
      };
      reader.readAsDataURL(file);
    }));
  });
  Promise.all(readers).then(() => {
    save(STORAGE_KEYS.photos, photos.slice(0, 40));
    renderPhotos();
  });
}

function deletePhoto(idx) {
  const photos =// ---------- Passwords ----------
function getPasswords() {
  return load(STORAGE_KEYS.passwords, []);
}

function renderPasswords() {
  const list = $('#passwords-list');
  const items = getPasswords();
  list.innerHTML = '';

  if (items.length === 0) {
    list.innerHTML = `<div class="text-center opacity-60 py-12 text-sm">No passwords saved</div>`;
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'pw-card';
    card.innerHTML = `
      <div class="pw-title">${escapeHtml(item.title)}</div>
      <div class="pw-meta">${escapeHtml(item.username || '')}</div>
      <div class="pw-meta font-mono tracking-wide mt-1">${escapeHtml(item.password)}</div>
      ${item.notes ? `<div class="pw-meta mt-1 opacity-60">${escapeHtml(item.notes)}</div>` : ''}
      <div class="pw-actions">
        <button data-edit="${item.id}">Edit</button>
        <button data-delete="${item.id}">Delete</button>
        <button data-copy="${item.id}">Copy PW</button>
      </div>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openPasswordModal(btn.dataset.edit));
  });
  list.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => deletePassword(btn.dataset.delete));
  });
  list.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = getPasswords().find(p => p.id === btn.dataset.copy);
      if (item) {
        navigator.clipboard.writeText(item.password).then(() => {
          btn.textContent = 'Copied!';
          setTimeout(() => btn.textContent = 'Copy PW', 1200);
        });
      }
    });
  });
}

function openPasswordModal(id = null) {
  editingPasswordId = id;
  const modal = $('#password-modal');
  const title = $('#modal-title');
  const form = $('#password-form');

  if (id) {
    const item = getPasswords().find(p => p.id === id);
    if (!item) return;
    title.textContent = 'Edit Password';
    $('#pw-title').value = item.title;
    $('#pw-username').value = item.username || '';
    $('#pw-password').value = item.password;
    $('#pw-notes').value = item.notes || '';
  } else {
    title.textContent = 'Add Password';
    form.reset();
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  $('#pw-title').focus();
}

function closePasswordModal() {
  $('#password-modal').classList.add('hidden');
  $('#password-modal').classList.remove('flex');
  editingPasswordId = null;
}

function savePassword(e) {
  e.preventDefault();
  const title = $('#pw-title').value.trim();
  const username = $('#pw-username').value.trim();
  const password = $('#pw-password').value;
  const notes = $('#pw-notes').value.trim();

  if (!title || !password) return;

  let items = getPasswords();

  if (editingPasswordId) {
    items = items.map(p => p.id === editingPasswordId ? {
      ...p, title, username, password, notes, updated: new Date().toISOString()
    } : p);
  } else {
    items.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      title, username, password, notes,
      created: new Date().toISOString()
    });
  }

  save(STORAGE_KEYS.passwords, items);
  closePasswordModal();
  renderPasswords();
}

function deletePassword(id) {
  if (!confirm('Delete this password?')) return;
  const items = getPasswords().filter(p => p.id !== id);
  save(STORAGE_KEYS.passwords, items);
  renderPasswords();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Events ----------
function bindEvents() {
  // PIN pad
  $$('.pin-btn[data-num]').forEach(btn => {
    btn.addEventListener('click', () => handlePinInput(btn.dataset.num));
  });
  $('#pin-back').addEventListener('click', handlePinBack);

  // Navigation
  $('#photos-tile').addEventListener('click', showPhotos);
  $('#passwords-tile').addEventListener('click', showPasswords);
  $$('[data-back]').forEach(btn => btn.addEventListener('click', showHome));
  $('#logout-btn').addEventListener('click', lockVault);

  // Photos
  $('#photo-input').addEventListener('change', (e) => {
    if (e.target.files?.length) addPhotos(e.target.files);
    e.target.value = '';
  });

  // Passwords
  $('#add-password-btn').addEventListener('click', () => openPasswordModal());
  $('#password-form').addEventListener('submit', savePassword);
  $('#modal-cancel').addEventListener('click', closePasswordModal);

  // Viewer
  $('#viewer-close').addEventListener('click', closeViewer);
  $('#photo-viewer').addEventListener('click', (e) => {
    if (e.target === $('#photo-viewer')) closeViewer();
  });

  // Keyboard support for PIN
  document.addEventListener('keydown', (e) => {
    if ($('#pin-screen').classList.contains('hidden')) return;
    if (e.key >= '0' && e.key <= '9') handlePinInput(e.key);
    if (e.key === 'Backspace') handlePinBack();
  });
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  initPinScreen();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
