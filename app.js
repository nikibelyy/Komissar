// LocalStorage-based PWA CRM
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

const list = $('#list');
const search = $('#search');
const newClientBtn = $('#newClient');
const dialogEl = $('#clientDialog');
const formEl = $('#clientForm');
const dialogTitle = $('#dialogTitle');

let clients = JSON.parse(localStorage.getItem('clients')||'[]');
let nextContractNumber = Number(localStorage.getItem('nextContractNumber')||1);

function save(){
  localStorage.setItem('clients', JSON.stringify(clients));
  localStorage.setItem('nextContractNumber', nextContractNumber);
}

function renderList(){
  const q = search.value.trim();
  const filtered = q ? clients.filter(c=>String(c.contract_number).includes(q)) : clients;
  list.innerHTML='';
  if(filtered.length===0){ list.innerHTML='<div class="card">Пока пусто. Добавьте клиента.</div>'; return; }
  for(const c of filtered){
    const el = document.createElement('div'); el.className='item'; el.dataset.id=c.id;
    el.innerHTML=`
      <div class="row">
        <div><div class="name">${escapeHtml(c.name)}</div>
          <div class="meta">Договор №<b>${c.contract_number}</b> • ${escapeHtml(c.status||'—')}</div></div>
        <div class="badge">${escapeHtml(c.phone||'—')}</div>
      </div>
      <div class="meta">Сумма: ${c.amount||'—'}</div>
      <menu><button class="btn mini" data-edit="${c.id}">Изменить</button>
      <button class="btn mini" data-del="${c.id}">Удалить</button></menu>`;
    list.appendChild(el);
  }
  $$('.btn[data-edit]').forEach(b=>b.onclick=()=>openEdit(b.dataset.edit));
  $$('.btn[data-del]').forEach(b=>b.onclick=()=>delClient(b.dataset.del));
}

newClientBtn.onclick = ()=>openCreate();
search.oninput = renderList;

function openCreate(){
  formEl.reset(); formEl.id.value='';
  dialogTitle.textContent='Новый клиент'; dialogEl.showModal();
}
function openEdit(id){
  const c = clients.find(x=>x.id===id); if(!c) return;
  formEl.reset(); formEl.id.value=c.id;
  formEl.name.value=c.name||'';
  formEl.phone.value=c.phone||'';
  formEl.amount.value=c.amount||'';
  formEl.status.value=c.status||'Новый';
  formEl.notes.value=c.notes||'';
  dialogTitle.textContent='Редактирование'; dialogEl.showModal();
}

formEl.addEventListener('submit',e=>{
  e.preventDefault();
  const data=Object.fromEntries(new FormData(formEl).entries());
  if(!data.name) return;
  let obj={id:data.id||Date.now().toString(), name:data.name, phone:data.phone, amount:data.amount?Number(data.amount):null,
           status:data.status, notes:data.notes, contract_number:data.id?clients.find(c=>c.id===data.id).contract_number:nextContractNumber++};
  if(data.id){ const idx=clients.findIndex(c=>c.id===data.id); if(idx>=0) clients[idx]=obj; }
  else clients.unshift(obj);
  save(); dialogEl.close(); renderList();
});

function delClient(id){
  const el=list.querySelector(`.item[data-id="${id}"]`); if(!el) return;
  if(!confirm('Удалить этого клиента?')) return;
  el.classList.add('removing');
  setTimeout(()=>{clients=clients.filter(c=>c.id!==id); save(); renderList();},280);
}

function escapeHtml(str){return String(str).replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));}

renderList();


// Форматирование телефона
function formatPhone(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 10) {
        value = value.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 ($2) $3-$4-$5');
    }
    input.value = value;
}

document.querySelectorAll('input[type=tel]').forEach(el => {
    el.addEventListener('input', () => formatPhone(el));
});
