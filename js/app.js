const STORAGE_KEYS = { pin: 'ssv_pin', photos: 'ssv_photos', passwords: 'ssv_passwords' };
let currentPin = '';
let isSetupMode = false;

function $(s) { return document.querySelector(s); }
function $$(s) { return document.querySelectorAll(s); }

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i) | 0;
  return 'h' + Math.abs(h).toString(36);
}

function updatePinDots() {
  $$('.pin-dot').forEach((dot, i) => dot.classList.toggle('filled', i < currentPin.length));
}

function handlePinInput(num) {
  if (currentPin.length >= 6) return;
  currentPin += num;
  updatePinDots();
  if (currentPin.length === 6) setTimeout(checkPin, 150);
}

function handlePinBack() {
  currentPin = currentPin.slice(0, -1);
  updatePinDots();
  $('#pin-error').style.opacity = '0';
}

function checkPin() {
  const stored = localStorage.getItem(STORAGE_KEYS.pin);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.pin, simpleHash(currentPin));
    enterVault();
    return;
  }
  if (simpleHash(currentPin) === stored) {
    enterVault();
  } else {
    $('#pin-error').style.opacity = '1';
    currentPin = '';
    updatePinDots();
  }
}

function enterVault() {
  $('#pin-screen').classList.add('hidden');
  $('#vault-screen').classList.remove('hidden');
}

function lockVault() {
  currentPin = '';
  $('#vault-screen').classList.add('hidden');
  $('#pin-screen').classList.remove('hidden');
  updatePinDots();
}

document.addEventListener('DOMContentLoaded', () => {
  $$('.pin-btn[data-num]').forEach(btn => {
    btn.addEventListener('click', () => handlePinInput(btn.dataset.num));
  });
  $('#pin-back').addEventListener('click', handlePinBack);
  $('#logout-btn').addEventListener('click', lockVault);

  const stored = localStorage.getItem(STORAGE_KEYS.pin);
  isSetupMode = !stored;
  $('#pin-setup-hint').classList.toggle('hidden', !isSetupMode);
});
