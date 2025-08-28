/* app.js — CRM without notifications */
const clientForm = document.getElementById('clientForm');
const nameInput = document.getElementById('name');
const plateInput = document.getElementById('plate');
const brandInput = document.getElementById('brand');
const amountInput = document.getElementById('amount');
const dealType = document.getElementById('dealType');
const depositEl = document.getElementById('deposit');
const remainderEl = document.getElementById('remainder');
const clientsList = document.getElementById('clientsList');

const installBtn = document.getElementById('installBtn');
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredPrompt = e; installBtn.style.display='inline-flex'; });
installBtn.addEventListener('click', async ()=>{
  if (!deferredPrompt) return alert('Use browser install option');
  deferredPrompt.prompt();
  deferredPrompt = null;
});

let clients = JSON.parse(localStorage.getItem('clients') || '[]');
function saveClients(){ localStorage.setItem('clients', JSON.stringify(clients)); }

function calcAndRender() {
  const amt = parseFloat(amountInput.value || 0);
  const pct = parseFloat(dealType.value || 0);
  const deposit = +(amt * pct / 100).toFixed(2);
  const remainder = +(amt - deposit).toFixed(2);
  depositEl.textContent = isNaN(deposit) ? '—' : deposit + ' ₽';
  remainderEl.textContent = isNaN(remainder) ? '—' : remainder + ' ₽';
}
dealType.addEventListener('change', calcAndRender);
amountInput.addEventListener('input', calcAndRender);

function renderClients() {
  clientsList.innerHTML = '';
  if (!clients.length) {
    clientsList.innerHTML = '<li class="client" style="justify-content:center;color:var(--muted)">Нет клиентов</li>';
    return;
  }
  clients.forEach((c, idx) => {
    const li = document.createElement('li');
    li.className = 'client';
    li.innerHTML = `
      <div class="meta">
        <strong>${escapeHtml(c.name)}</strong>
        <span>${escapeHtml(c.brand)} • ${escapeHtml(c.plate)}</span>
        <small style="color:var(--muted)">${c.amount} ₽ • ${c.deal}%</small>
      </div>
      <div class="actions">
        <button class="btn" data-idx="${idx}" data-action="del">Удалить</button>
      </div>
    `;
    clientsList.appendChild(li);
  });
}

clientsList.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const idx = Number(btn.dataset.idx);
  const action = btn.dataset.action;
  if (action === 'del') {
    clients.splice(idx,1);
    saveClients();
    renderClients();
  }
});

clientForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const plate = plateInput.value.trim();
  const brand = brandInput.value.trim();
  const amount = parseFloat(amountInput.value) || 0;
  const deal = parseInt(dealType.value,10) || 30;
  const deposit = +(amount * deal / 100).toFixed(2);
  const remainder = +(amount - deposit).toFixed(2);
  clients.unshift({ name, plate, brand, amount, deal, deposit, remainder, created: Date.now() });
  saveClients();
  renderClients();
  clientForm.reset();
  calcAndRender();
});

/* register service worker for offline caching */
if ('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').then(reg=>{
    console.log('SW registered', reg);
  }).catch(err=>console.warn('SW error', err));
}

function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

document.addEventListener('DOMContentLoaded', () => {
  renderClients();
  calcAndRender();
});
