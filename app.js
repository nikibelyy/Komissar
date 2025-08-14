// Простая PWA с IndexedDB, офлайн и админ-панелью
;(function(){
  // Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .catch(console.error);
    });
  }

  // Online status badge
  const onlineBadge = document.getElementById('onlineStatus');
  function updateOnlineBadge(){
    onlineBadge.textContent = navigator.onLine ? 'online' : 'offline';
    onlineBadge.className = 'badge ' + (navigator.onLine ? 'online' : '');
  }
  window.addEventListener('online', updateOnlineBadge);
  window.addEventListener('offline', updateOnlineBadge);
  updateOnlineBadge();

  // Tabs
  const tabs = document.querySelectorAll('.tab');
  const views = document.querySelectorAll('.view');
  tabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      tabs.forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      views.forEach(v=>v.classList.remove('active'));
      document.getElementById(tab.dataset.target).classList.add('active');
      window.scrollTo({top:0,behavior:'smooth'});
    });
  });

  // Top toolbar nav buttons sync with tabs
  function syncTopButtons(){
    document.getElementById('nav-dashboard').classList.toggle('active', document.getElementById('view-dashboard').classList.contains('active'));
    document.getElementById('nav-clients').classList.toggle('active', document.getElementById('view-clients').classList.contains('active'));
    document.getElementById('nav-admin').classList.toggle('active', document.getElementById('view-admin').classList.contains('active'));
  }
  ['nav-dashboard','nav-clients','nav-admin'].forEach(id=>{
    document.getElementById(id).addEventListener('click',()=>{
      const map={ 'nav-dashboard':'view-dashboard', 'nav-clients':'view-clients', 'nav-admin':'view-admin' };
      document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      document.querySelector(`.tab[data-target="${map[id]}"]`).classList.add('active');
      views.forEach(v=>v.classList.remove('active'));
      document.getElementById(map[id]).classList.add('active');
      syncTopButtons();
    });
  });

  // IndexedDB
  const dbName = 'clients-db-v1';
  let db;
  const req = indexedDB.open(dbName, 1);
  req.onupgradeneeded = (e)=>{
    db = e.target.result;
    const store = db.createObjectStore('clients', { keyPath:'id', autoIncrement:true });
    store.createIndex('by_date','date');
    store.createIndex('by_name','name');
  };
  req.onsuccess = (e)=>{ db = e.target.result; refreshAll(); };
  req.onerror = (e)=>console.error('DB error', e);

  // Helpers
  const $ = sel => document.querySelector(sel);
  function tx(store, mode='readonly'){ return db.transaction(store, mode).objectStore(store) }
  function toISO(dateStr){ // ensure YYYY-MM-DD
    if(!dateStr) return new Date().toISOString().slice(0,10);
    return dateStr;
  }

  async function addClient(name, date, note){
    return new Promise((res,rej)=>{
      const obj = { name:name.trim(), date:toISO(date), note: (note||'').trim(), createdAt: Date.now() };
      const r = tx('clients','readwrite').add(obj);
      r.onsuccess=()=>res(true);
      r.onerror=rej;
    });
  }

  async function getAll(){
    return new Promise((res,rej)=>{
      const out = [];
      const r = tx('clients').openCursor(null, 'prev');
      r.onsuccess = (e)=>{
        const cursor = e.target.result;
        if(cursor){ out.push(cursor.value); cursor.continue(); } else res(out);
      };
      r.onerror=rej;
    });
  }

  async function removeClient(id){
    return new Promise((res,rej)=>{
      const r = tx('clients','readwrite').delete(id);
      r.onsuccess=()=>res(true);
      r.onerror=rej;
    });
  }

  // UI: Add client
  const form = $('#addClientForm');
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = $('#clientName').value;
    const date = $('#clientDate').value || new Date().toISOString().slice(0,10);
    const note = $('#clientNote').value;
    if(!name.trim()) return;
    await addClient(name, date, note);
    form.reset();
    $('#clientDate').value = new Date().toISOString().slice(0,10);
    refreshAll();
  });
  // default date today
  $('#clientDate').value = new Date().toISOString().slice(0,10);

  // List + search
  $('#search').addEventListener('input', renderList);

  async function renderList(){
    const list = $('#clientsList');
    list.innerHTML = '';
    const q = ($('#search').value || '').toLowerCase();
    const items = await getAll();
    const filtered = items.filter(it=> (it.name||'').toLowerCase().includes(q) || (it.note||'').toLowerCase().includes(q));

    if(filtered.length===0){
      $('#emptyNote').style.display='block';
    } else {
      $('#emptyNote').style.display='none';
    }

    filtered.forEach(it=>{
      const li = document.createElement('li');
      const left = document.createElement('div');
      left.innerHTML = `<div><strong>${escapeHtml(it.name)}</strong></div>
                        <div class="meta">${it.date}${it.note ? ' · ' + escapeHtml(it.note) : ''}</div>`;
      const right = document.createElement('div');
      const del = document.createElement('button');
      del.className='btn danger';
      del.textContent='Удалить';
      del.addEventListener('click', async ()=>{
        if(confirm('Удалить запись?')){
          await removeClient(it.id);
          refreshAll();
        }
      });
      right.appendChild(del);
      li.appendChild(left);
      li.appendChild(right);
      list.appendChild(li);
    });
  }

  function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])) }

  // KPIs + chart
  async function updateKPIs(){
    const items = await getAll();
    const today = new Date().toISOString().slice(0,10);
    const now = new Date();
    const monthKey = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');

    let total=items.length, todayCount=0, monthCount=0;
    const buckets = {}; // last 12 months
    for(let i=11;i>=0;i--){
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      const k = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
      buckets[k]=0;
    }
    items.forEach(it=>{
      if(it.date===today) todayCount++;
      if(it.date.startsWith(monthKey)) monthCount++;
      const k = it.date.slice(0,7);
      if(k in buckets) buckets[k]++;
    });

    document.getElementById('kpi-total-count').textContent = total;
    document.getElementById('kpi-today-count').textContent = todayCount;
    document.getElementById('kpi-month-count').textContent = monthCount;

    drawChart(Object.keys(buckets), Object.values(buckets));
  }

  function drawChart(labels, data){
    const canvas = document.getElementById('chart12');
    const ctx = canvas.getContext('2d');
    // clear
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // padding
    const P = { l:30, r:10, t:10, b:20 };
    const W = canvas.width - P.l - P.r;
    const H = canvas.height - P.t - P.b;

    const max = Math.max(1, Math.max(...data));
    const stepX = W / (labels.length-1);

    // grid
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth=1;
    for(let i=0;i<=4;i++){
      const y = P.t + (H * i/4);
      ctx.beginPath(); ctx.moveTo(P.l,y); ctx.lineTo(P.l+W,y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // line
    ctx.beginPath();
    data.forEach((v,i)=>{
      const x = P.l + stepX * i;
      const y = P.t + H - (v/max)*H;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.strokeStyle = '#0a84ff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // dots
    data.forEach((v,i)=>{
      const x = P.l + stepX * i;
      const y = P.t + H - (v/max)*H;
      ctx.beginPath();
      ctx.arc(x,y,3,0,Math.PI*2);
      ctx.fillStyle = '#0a84ff';
      ctx.fill();
    });

    // labels (only every 2nd to avoid clutter)
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px -apple-system, system-ui, sans-serif';
    labels.forEach((lb,i)=>{
      if(i%2!==0) return;
      const x = P.l + stepX * i;
      const y = canvas.height - 4;
      ctx.textAlign='center';
      ctx.fillText(lb.replace(/^\d{4}-/,'').replace(/^0/,'')+'м', x, y);
    });
  }

  async function refreshAll(){
    await updateKPIs();
    await renderList();
  }

  // Export / Import
  document.getElementById('exportBtn').addEventListener('click', async ()=>{
    const data = await getAll();
    downloadFile('clients.json', JSON.stringify(data, null, 2), 'application/json');
  });
  document.getElementById('importFile').addEventListener('change', async (e)=>{
    const file = e.target.files[0]; if(!file) return;
    const text = await file.text();
    const arr = JSON.parse(text);
    if(!Array.isArray(arr)) return alert('Неверный формат');
    const store = tx('clients','readwrite');
    await new Promise((res)=>{
      const clearReq = store.clear();
      clearReq.onsuccess = res;
      clearReq.onerror = res;
    });
    await Promise.all(arr.map(obj=> new Promise((res,rej)=>{
      const {id, ...rest} = obj; // ignore old IDs
      const r = store.add(rest); r.onsuccess=res; r.onerror=rej;
    })));
    refreshAll();
  });

  // Admin lock
  const adminArea = document.getElementById('adminArea');
  const adminLock = document.getElementById('adminLock');
  const pinInput = document.getElementById('pinInput');
  document.getElementById('setPinBtn').addEventListener('click',()=>{
    const pin = pinInput.value.trim();
    if(!pin) return alert('Введите PIN');
    localStorage.setItem('clients_pin', btoa(pin));
    alert('PIN сохранён');
  });
  document.getElementById('unlockBtn').addEventListener('click',()=>{
    const pin = pinInput.value.trim();
    const saved = localStorage.getItem('clients_pin');
    if(!saved){ alert('Сначала установите PIN'); return; }
    if(btoa(pin) === saved){
      adminArea.classList.remove('hidden');
      adminLock.classList.add('hidden');
    } else {
      alert('Неверный PIN');
    }
  });

  // Admin tools
  document.getElementById('backupBtn').addEventListener('click', async ()=>{
    const data = await getAll();
    const payload = { exportedAt: new Date().toISOString(), data };
    downloadFile('backup.json', JSON.stringify(payload, null, 2), 'application/json');
  });

  document.getElementById('restoreBtn').addEventListener('click', ()=> document.getElementById('restoreFile').click());
  document.getElementById('restoreFile').addEventListener('change', async (e)=>{
    const file = e.target.files[0]; if(!file) return;
    const text = await file.text();
    const obj = JSON.parse(text);
    const arr = obj.data || obj;
    if(!Array.isArray(arr)) return alert('Неверный файл');
    const store = tx('clients','readwrite');
    await new Promise((res)=>{ const clearReq = store.clear(); clearReq.onsuccess=res; clearReq.onerror=res; });
    await Promise.all(arr.map(o=> new Promise((res,rej)=>{ const {id,...rest}=o; const r=store.add(rest); r.onsuccess=res; r.onerror=rej; })));
    refreshAll();
    alert('Восстановлено');
  });

  document.getElementById('wipeBtn').addEventListener('click', async ()=>{
    if(!confirm('Стереть все данные? Это необратимо.')) return;
    await new Promise((res)=>{ const r = tx('clients','readwrite').clear(); r.onsuccess=res; r.onerror=res; });
    refreshAll();
  });

  // Exports
  document.getElementById('icsBtn').addEventListener('click', async ()=>{
    const items = await getAll();
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ClientsPWA//RU//'
    ];
    items.forEach((it,i)=>{
      lines.push('BEGIN:VEVENT');
      lines.push('UID:client-'+(it.id||i)+'@local');
      lines.push('DTSTAMP:'+formatICSDate(new Date()));
      lines.push('DTSTART;VALUE=DATE:'+it.date.replace(/-/g,''));
      lines.push('SUMMARY:'+escapeICS(it.name));
      if(it.note) lines.push('DESCRIPTION:'+escapeICS(it.note));
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    downloadFile('clients.ics', lines.join('\r\n'), 'text/calendar');
  });

  document.getElementById('csvBtn').addEventListener('click', async ()=>{
    const items = await getAll();
    const rows = [['id','name','date','note','createdAt']].concat(items.map(it=>[it.id,it.name,it.date,(it.note||'').replace(/"/g,'""'),it.createdAt]));
    const csv = rows.map(r=> r.map(v=> typeof v==='string' ? `"${v}"` : v).join(',')).join('\n');
    downloadFile('clients.csv', csv, 'text/csv');
  });

  function formatICSDate(d){
    const pad=n=>String(n).padStart(2,'0');
    return d.getUTCFullYear()+pad(d.getUTCMonth()+1)+pad(d.getUTCDate())+'T'+pad(d.getUTCHours())+pad(d.getUTCMinutes())+pad(d.getUTCSeconds())+'Z';
  }
  function escapeICS(s){ return (s||'').replace(/[\n,;]/g, m=> ({'\n':'\\n',',':'\\,',';':'\\;'}[m])) }

  function downloadFile(filename, content, type){
    const blob = new Blob([content], {type});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }
})();