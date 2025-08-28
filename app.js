// app.js - main logic for CRM PWA
const $ = (q, root=document) => root.querySelector(q);
const $$ = (q, root=document) => Array.from(root.querySelectorAll(q));

const DB_NAME = 'crmDB';
const DB_VER = 1;
const STORE = 'clients';

function openDB(){
  return new Promise((resolve, reject)=>{
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = e=>{
      const db = e.target.result;
      if(!db.objectStoreNames.contains(STORE)){
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('name','name',{unique:false});
        store.createIndex('plate','plate',{unique:false});
        store.createIndex('brand','brand',{unique:false});
      }
    };
    req.onsuccess = ()=> resolve(req.result);
    req.onerror = ()=> reject(req.error);
  });
}
async function withStore(mode, fn){
  const db = await openDB();
  return new Promise((resolve, reject)=>{
    const tx = db.transaction(STORE, mode);
    const st = tx.objectStore(STORE);
    const out = fn(st);
    tx.oncomplete = ()=> resolve(out);
    tx.onerror = ()=> reject(tx.error);
  });
}
const DB = {
  async add(item){ return withStore('readwrite', st=> st.add(item)); },
  async all(){
    return withStore('readonly', st=> new Promise(res=>{
      const items=[]; st.openCursor().onsuccess = e=>{
        const cur = e.target.result; if(cur){ items.push(cur.value); cur.continue(); } else res(items); };
    }));
  },
  async put(item){ return withStore('readwrite', st=> st.put(item)); },
  async delete(id){ return withStore('readwrite', st=> st.delete(id)); }
};

let deferredPrompt = null;
const installBtn = $('#installBtn');
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn?.addEventListener('click', async ()=>{
  installBtn.disabled = true;
  deferredPrompt?.prompt();
  await deferredPrompt?.userChoice;
  installBtn.hidden = true;
});

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./sw.js').catch(()=>{});
}

/* UI */
const form = $('#clientForm');
const commissionEl = $('#commission');
const percentEl = $('#percent');
const amountEl = $('#amount');
const nameEl = $('#name');
const plateEl = $('#plate');
const brandEl = $('#brand');
const clientsEl = $('#clients');
const emptyEl = $('#empty');
const searchEl = $('#search');

const agencyBtn = $('.segment[data-type="agency"]');
const cessionBtn = $('.segment[data-type="cession"]');
const agencyOptions = $('#agencyOptions');
const cessionInfo = $('#cessionInfo');

let currentType = 'agency';
let currentRate = 25;

function fmt(num){
  const n = Number(num||0);
  return n.toLocaleString('ru-RU', {maximumFractionDigits: 2});
}
function calcCommission(amount, type, rate){
  const pct = type==='cession' ? 15 : (rate||25);
  const commission = (Number(amount||0) * pct) / 100;
  return { pct, commission };
}

function updateCalc(){
  const { pct, commission } = calcCommission(amountEl.value, currentType, currentRate);
  percentEl.textContent = pct;
  commissionEl.textContent = fmt(commission);
}

agencyBtn.addEventListener('click', ()=>{
  currentType='agency';
  agencyBtn.classList.add('active');
  cessionBtn.classList.remove('active');
  agencyOptions.hidden = false;
  cessionInfo.hidden = true;
  currentRate = Number($('.segmented.secondary .segment.active').dataset.rate) || 25;
  updateCalc();
});
cessionBtn.addEventListener('click', ()=>{
  currentType='cession';
  cessionBtn.classList.add('active');
  agencyBtn.classList.remove('active');
  agencyOptions.hidden = true;
  cessionInfo.hidden = false;
  currentRate = 15;
  updateCalc();
});
$$('#agencyOptions .segment').forEach(b=>{
  b.addEventListener('click', ()=>{
    $$('#agencyOptions .segment').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    currentRate = Number(b.dataset.rate);
    updateCalc();
  });
});

amountEl.addEventListener('input', updateCalc);
form.addEventListener('reset', ()=>{
  setTimeout(()=>{
    currentType='agency'; currentRate=25;
    agencyBtn.click();
    $('#agencyOptions .segment[data-rate="25"]').click();
    updateCalc();
  },0);
});

function renderItem(item){
  const tpl = $('#clientItem').content.cloneNode(true);
  const root = tpl.querySelector('li');
  root.dataset.id = item.id;

  tpl.querySelector('.title').textContent = `${item.name} • ${item.brand}`;
  tpl.querySelector('.subtitle').textContent = `${item.plate} • ${item.dealLabel}`;
  tpl.querySelector('.meta').textContent = `Сумма: ${fmt(item.amount)} ₽ • Комиссия: ${fmt(item.commission)} ₽`;

  tpl.querySelector('.edit').addEventListener('click', ()=> openEdit(item));
  tpl.querySelector('.delete').addEventListener('click', ()=> removeItem(item.id));

  return tpl;
}

async function refreshList(filter=''){
  const items = await DB.all();
  const q = filter.trim().toLowerCase();
  const filtered = q
    ? items.filter(x =>
        [x.name, x.plate, x.brand].some(v => String(v).toLowerCase().includes(q)))
    : items;

  clientsEl.innerHTML = '';
  filtered
    .sort((a,b)=> b.id - a.id)
    .forEach(item=> clientsEl.appendChild(renderItem(item)));

  emptyEl.style.display = filtered.length ? 'none' : 'block';
}

searchEl.addEventListener('input', ()=> refreshList(searchEl.value));

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const amount = Number(amountEl.value);
  const { pct, commission } = calcCommission(amount, currentType, currentRate);

  const dealLabel = currentType==='cession'
    ? 'Цессия 15%'
    : `Агентский ${pct}%`;

  const item = {
    name: nameEl.value.trim(),
    plate: plateEl.value.trim().toUpperCase(),
    brand: brandEl.value.trim(),
    amount,
    percent: pct,
    commission,
    type: currentType,
    dealLabel,
    createdAt: Date.now()
  };

  await DB.add(item);
  form.reset();
  await refreshList(searchEl.value);
});

async function removeItem(id){
  if(confirm('Удалить запись?')) {
    await DB.delete(id);
    refreshList(searchEl.value);
  }
}

/* Edit dialog */
const editDialog = $('#editDialog');
const e_name = $('#e_name');
const e_plate = $('#e_plate');
const e_brand = $('#e_brand');
const e_amount = $('#e_amount');
const e_type = $('#e_type');
const e_commission = $('#e_commission');
const e_percent = $('#e_percent');
let editingId = null;

function updateEditCalc(){
  const [type, rateStr] = e_type.value.split('-');
  const rate = Number(rateStr);
  const { pct, commission } = calcCommission(Number(e_amount.value), type==='cession'?'cession':'agency', rate);
  e_percent.textContent = pct;
  e_commission.textContent = fmt(commission);
}

function openEdit(item){
  editingId = item.id;
  e_name.value = item.name;
  e_plate.value = item.plate;
  e_brand.value = item.brand;
  e_amount.value = item.amount;
  e_type.value = item.type==='cession' ? 'cession-15' : `agency-${item.percent}`;
  updateEditCalc();
  editDialog.showModal();
}
e_amount.addEventListener('input', updateEditCalc);
e_type.addEventListener('change', updateEditCalc);

$('#editForm').addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  const [type, rateStr] = e_type.value.split('-');
  const rate = Number(rateStr);
  const { pct, commission } = calcCommission(Number(e_amount.value), type==='cession'?'cession':'agency', rate);
  const dealLabel = type==='cession' ? 'Цессия 15%' : `Агентский ${pct}%`;

  const updated = {
    id: editingId,
    name: e_name.value.trim(),
    plate: e_plate.value.trim().toUpperCase(),
    brand: e_brand.value.trim(),
    amount: Number(e_amount.value),
    percent: pct,
    commission,
    type: type==='cession'?'cession':'agency',
    dealLabel,
    updatedAt: Date.now()
  };
  await DB.put(updated);
  editDialog.close();
  refreshList(searchEl.value);
});

/* Boot */
updateCalc();
refreshList();
