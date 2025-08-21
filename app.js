
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

const storeKey = 'crm-auto-records-v2';

const state = {
  records: JSON.parse(localStorage.getItem(storeKey) || '[]'),
  filter: ''
};

function save(){
  localStorage.setItem(storeKey, JSON.stringify(state.records));
  render();
}

function currency(v){
  if (!v && v !== 0) return '';
  const n = Number(v);
  return n.toLocaleString('ru-RU', { style:'currency', currency:'RUB', maximumFractionDigits:0 });
}

function render(){
  const tbody = $('#list');
  tbody.innerHTML = '';
  const filtered = state.records.filter(r => {
    const q = state.filter.trim().toLowerCase();
    if (!q) return true;
    return (r.client||'').toLowerCase().includes(q) ||
           (r.plate||'').toLowerCase().includes(q) ||
           (r.brand||'').toLowerCase().includes(q) ||
           (r.type||'').toLowerCase().includes(q);
  });

  filtered.forEach((r, idx) => {
    let salary = '';
    if(r.type === 'Цессия'){
      salary = currency(r.amount * 0.15);
    }
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><div class="row">
        <div>${r.client || ''}</div>
        <div>${r.plate || ''}</div>
        <div>${r.brand || ''}</div>
        <div><span class="badge">${r.type || ''}</span></div>
        <div>${currency(r.amount)}</div>
        <div>${salary}</div>
        <div style="display:flex; gap:6px; justify-content:flex-end;">
          <button class="btn secondary" data-edit="${r.id}">Изм.</button>
          <button class="btn danger" data-del="${r.id}">Удалить</button>
        </div>
      </div></td>
    `;
    tbody.appendChild(tr);
  });

  $$('[data-del]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-del');
    state.records = state.records.filter(x => x.id !== id);
    save();
  }));

  $$('[data-edit]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-edit');
    const r = state.records.find(x => x.id === id);
    if(!r) return;
    $('#client').value = r.client||'';
    $('#plate').value = r.plate||'';
    $('#brand').value = r.brand||'';
    $('#amount').value = r.amount||'';
    $$('#dealSegment button').forEach(b => {
      b.classList.toggle('active', b.dataset.value === r.type);
    });
    $('#addBtn').textContent = 'Сохранить изменения';
    $('#addBtn').dataset.editing = id;
    window.scrollTo({ top: 0, behavior:'smooth' });
  }));
}

function getFormData(){
  const type = $$('#dealSegment button').find(b => b.classList.contains('active'))?.dataset.value || 'Договор';
  return {
    client: $('#client').value.trim(),
    plate: $('#plate').value.trim().toUpperCase(),
    brand: $('#brand').value.trim(),
    type,
    amount: Number($('#amount').value || 0)
  };
}

function clearForm(){
  $('#client').value = '';
  $('#plate').value = '';
  $('#brand').value = '';
  $('#amount').value = '';
  $$('#dealSegment button').forEach((b,i) => b.classList.toggle('active', i===0));
  $('#addBtn').textContent = 'Добавить';
  delete $('#addBtn').dataset.editing;
}

function exportCSV(){
  const header = ['Клиент','Номер','Марка','Сделка','Сумма','Зарплата'];
  const rows = state.records.map(r => {
    const salary = r.type==='Цессия' ? (r.amount*0.15) : '';
    return [r.client, r.plate, r.brand, r.type, r.amount, salary];
  });
  const all = [header, ...rows].map(row => row.map(x => `"${String(x??'').replaceAll('"','""')}"`).join(',')).join('\n');
  const blob = new Blob([all], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'crm-auto.csv';
  a.click();
}

function exportJSON(){
  const blob = new Blob([JSON.stringify(state.records, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'crm-auto.json';
  a.click();
}

function importJSON(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      if(Array.isArray(data)){
        data.forEach(d => { if(!d.id) d.id = crypto.randomUUID(); });
        state.records = data;
        save();
        alert('Импортировано: ' + state.records.length + ' записей');
      } else {
        alert('Файл JSON имеет неверный формат');
      }
    }catch(e){
      alert('Ошибка импорта: ' + e.message);
    }
  };
  reader.readAsText(file);
}

function init(){
  state.records.forEach(r => { if(!r.id) r.id = crypto.randomUUID(); });
  save();

  $('#search').addEventListener('input', (e) => { state.filter = e.target.value; render(); });

  $$('#dealSegment button').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('#dealSegment button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  $('#addBtn').addEventListener('click', () => {
    const data = getFormData();
    if(!data.client || !data.plate || !data.brand){
      alert('Пожалуйста, заполните: Имя клиента, Номер, Марка');
      return;
    }
    const editingId = $('#addBtn').dataset.editing;
    if (editingId){
      const idx = state.records.findIndex(x => x.id === editingId);
      if (idx >= 0) state.records[idx] = { ...state.records[idx], ...data };
    } else {
      state.records.unshift({ id: crypto.randomUUID(), createdAt: Date.now(), ...data });
    }
    save();
    clearForm();
  });

  $('#clearBtn').addEventListener('click', clearForm);
  $('#exportCsv').addEventListener('click', exportCSV);
  $('#exportJson').addEventListener('click', exportJSON);
  $('#importJson').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if(file) importJSON(file);
    e.target.value = '';
  });

  render();
}

document.addEventListener('DOMContentLoaded', init);
