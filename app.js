let state;
let activeFilter = 'ทั้งหมด';
const $ = (id) => document.getElementById(id);
const thaiDate = (date) => new Intl.DateTimeFormat('th-TH',{dateStyle:'long'}).format(date);
const statuses = ['ทั้งหมด','รอการบันทึกแก้ไข','อยู่ระหว่างประเมินการแก้ไข','ผ่านการประเมินแล้ว'];
const statusClass = (status) => status === 'ผ่านการประเมินแล้ว' ? 'approved' : status === 'อยู่ระหว่างประเมินการแก้ไข' ? 'submitted' : '';
const esc = (value) => String(value).replace(/[&<>"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
function count(status) { return state.issues.filter(issue => issue.status === status).length; }
function renderFilters() {
  $('filters').innerHTML = statuses.map(status => `<button class="filter ${status === activeFilter ? 'active' : ''}" data-filter="${status}">${status === 'ทั้งหมด' ? 'ทั้งหมด' : status.replace('การบันทึก','').replace('การแก้ไข','')}</button>`).join('');
  document.querySelectorAll('[data-filter]').forEach(button => button.onclick = () => { activeFilter = button.dataset.filter; renderFilters(); showRows(); });
}
function renderBars(submitted,pending,approved) {
  const data=[['รอดำเนินการ',pending,'#f0a12c'],['อยู่ระหว่างประเมิน',submitted-approved,'#18a79c'],['ผ่านการประเมิน',approved,'#299766']];
  $('status-bars').innerHTML=data.map(([label,value,color])=>`<div><div class="bar-head"><span>${label}</span><strong>${value} รายการ</strong></div><div class="bar-track"><div class="bar-fill" style="width:${state.issues.length ? value/state.issues.length*100 : 0}%;background:${color}"></div></div></div>`).join('');
}
function render() {
  const issues=state.issues, submitted=issues.filter(x=>x.status!=='รอการบันทึกแก้ไข').length, approved=count('ผ่านการประเมินแล้ว'), pending=issues.length-submitted, pct=issues.length?Math.round(submitted/issues.length*100):0;
  $('total-count').textContent=issues.length; $('submitted-count').textContent=submitted; $('pending-count').textContent=pending; $('approved-count').textContent=approved;
  $('progress-pct').textContent=`${pct}%`; $('banner-pct').textContent=`${pct}%`; $('progress-copy').textContent=`${submitted} จาก ${issues.length} รายการ`; $('donut').style.setProperty('--pct',`${pct}%`);
  $('audit-date').textContent=`สิ้นสุดการตรวจ: ${thaiDate(new Date(state.auditEnd))}`; $('due-date').textContent=`กำหนดส่ง: ${thaiDate(new Date(state.dueDate))}`;
  renderBars(submitted,pending,approved); renderFilters(); showRows(); tick();
}
function showRows() {
  if(!state)return; const q=$('search').value.trim().toLowerCase();
  const filtered=state.issues.filter(x=>(activeFilter==='ทั้งหมด'||x.status===activeFilter)&&`${x.no} ${x.clause} ${x.title} ${x.type}`.toLowerCase().includes(q));
  $('row-summary').textContent=`แสดง ${filtered.length} จาก ${state.issues.length} รายการ`;
  $('issue-list').innerHTML=filtered.map(x=>`<tr><td>${esc(x.no)}</td><td>${esc(x.type)}</td><td>${esc(x.clause)}</td><td>${esc(x.title)}</td><td><span class="pill ${statusClass(x.status)}">${esc(x.status)}</span></td></tr>`).join('')||'<tr><td colspan="5">ไม่พบรายการที่ตรงกับเงื่อนไข</td></tr>';
}
function tick() {
  if(!state)return; const now=new Date(),audit=new Date(`${state.auditEnd}T23:59:59`),due=new Date(`${state.dueDate}T23:59:59`),elapsed=Math.max(0,now-audit),left=due-now;
  const days=Math.floor(elapsed/86400000),hrs=String(Math.floor(elapsed/3600000)%24).padStart(2,'0'),mins=String(Math.floor(elapsed/60000)%60).padStart(2,'0'),secs=String(Math.floor(elapsed/1000)%60).padStart(2,'0');
  $('elapsed').textContent=`${days} วัน ${hrs}:${mins}:${secs}`; const leftDays=Math.ceil(left/86400000); $('remaining').textContent=leftDays>=0?`เหลือ ${leftDays} วัน`:`เกินกำหนด ${Math.abs(leftDays)} วัน`; $('remaining').style.color=leftDays<0?'var(--red)':'var(--amber)';
}
async function loadData(){try{const result=await fetch(`data/status.json?ts=${Date.now()}`,{cache:'no-store'});state=await result.json();render();$('sync-dot').style.background='var(--teal)';$('sync-text').textContent=`อัปเดต ${new Date().toLocaleTimeString('th-TH')}`;}catch{$('sync-dot').style.background='var(--red)';$('sync-text').textContent='อ่านไฟล์สถานะไม่สำเร็จ';}}
$('search').addEventListener('input',showRows);$('refresh').addEventListener('click',loadData);setInterval(tick,1000);setInterval(loadData,60000);loadData();
