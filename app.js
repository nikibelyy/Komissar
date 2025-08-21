// LocalStorage-based CRM with animations
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

const list = $('#list');
const search = $('#search');
const newClientBtn = $('#newClient');
const dialogEl = $('#clientDialog');
const formEl = $('#clientForm');
const dialogTitle = $('#dialogTitle');

let clients = loadClients();

function loadClients(){
  try{
    return JSON.parse(localStorage.getItem('clients')||'[]');
  }catch(e){return [];}
}
function saveClients(){
  localStorage.setItem('clients', JSON.stringify(clients));
}

function renderList(){
  const q = search.value.trim().toLowerCase();
  const filtered = q ? clients.filter(c =>
    [c.name, c.contract_number, c.phone, c.email].filter(Boolean).some(s => String(s).toLowerCase().includes(q))
  ) : clients;

  list.innerHTML = '';
  if (filtered.length === 0){
    list.innerHTML = '<div class="card">Пока пусто. Добавьте первого клиента.</div>';
    return;
  }
  for(const c of filtered){
    const el = document.createElement('div');
    el.className = 'item';
    el.dataset.id = c.id;
    el.innerHTML = `
      <div class="row">
        <div><div class="name">${escapeHtml(c.name)}</div>
          <div class="meta">Договор: <b>${escapeHtml(c.contract_number || '')}</b> • ${escapeHtml(c.status || '—')}</div>
        </div>
        <div class="badge">${formatDate(c.contract_date) || '—'}</div>
      </div>
      <div class="meta">☎ ${escapeHtml(c.phone || '—')} • ✉ ${escapeHtml(c.email || '—')}</div>
      <menu>
        <button class="btn mini" data-edit="${c.id}">Изменить</button>
        <button class="btn mini" data-del="${c.id}">Удалить</button>
      </menu>
    `;
    list.appendChild(el);
  }
  $$('.btn[data-edit]').forEach(b=>b.onclick=()=>openEdit(b.dataset.edit));
  $$('.btn[data-del]').forEach(b=>b.onclick=()=>delClient(b.dataset.del));
}

newClientBtn.addEventListener('click', ()=>openCreate());
search.addEventListener('input', renderList);

function openCreate(){
  formEl.reset();
  formEl.id.value = '';
  dialogTitle.textContent = 'Новый клиент';
  dialogEl.showModal();
}

function openEdit(id){
  const c = clients.find(x=>x.id===id);
  if(!c) return;
  formEl.reset();
  formEl.id.value = c.id;
  formEl.name.value = c.name||'';
  formEl.phone.value = c.phone||'';
  formEl.email.value = c.email||'';
  formEl.contract_number.value = c.contract_number||'';
  formEl.contract_date.value = c.contract_date||'';
  formEl.amount.value = c.amount||'';
  formEl.status.value = c.status||'Новый';
  formEl.notes.value = c.notes||'';
  dialogTitle.textContent = 'Редактирование';
  dialogEl.showModal();
}

formEl.addEventListener('submit', e=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(formEl).entries());
  if(!data.name || !data.contract_number) return;
  const obj = {
    id: data.id || Date.now().toString(),
    name: data.name,
    phone: data.phone,
    email: data.email,
    contract_number: data.contract_number,
    contract_date: data.contract_date,
    amount: data.amount?Number(data.amount):null,
    status: data.status,
    notes: data.notes
  };
  if(data.id){
    const idx = clients.findIndex(x=>x.id===data.id);
    if(idx>=0) clients[idx]=obj;
  }else{
    clients.unshift(obj);
  }
  saveClients();
  dialogEl.close();
  renderList();
});

function delClient(id){
  const el = list.querySelector(`.item[data-id="${id}"]`);
  if(!el) return;
  if(!confirm('Удалить этого клиента?')) return;
  el.classList.add('removing');
  setTimeout(()=>{
    clients = clients.filter(c=>c.id!==id);
    saveClients();
    renderList();
  }, 280);
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[s]));
}
function formatDate(d){
  if(!d) return '';
  try{
    const dd = new Date(d);
    if(isNaN(dd)) return d;
    return dd.toLocaleDateString('ru-RU');
  }catch{return d;}
}

renderList();
