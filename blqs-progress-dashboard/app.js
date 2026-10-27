let state;
let activeFilter = 'ทั้งหมด';
const UNDER_REVIEW = 'อยู่ระหว่างประเมินการแก้ไข';
const CLOSED = 'ปิดการแก้ไขแล้ว';
const RETURNED = 'รอการแก้ไขเพิ่มเติม';
const $ = (id) => document.getElementById(id);
const thaiDate = (date) => new Intl.DateTimeFormat('th-TH',{dateStyle:'long'}).format(date);
const statuses = ['ทั้งหมด', UNDER_REVIEW, CLOSED, RETURNED];
const statusClass = (status) => status === CLOSED ? 'approved' : status === UNDER_REVIEW ? 'submitted' : '';
const esc = (value) => String(value).replace(/[&<>"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
function count(status, list = state.issues) { return list.filter(issue => issue.status === status).length; }
function renderFilters() {
  const labels = { 'ทั้งหมด': 'ทั้งหมด', [UNDER_REVIEW]: 'รอตรวจ', [CLOSED]: 'ปิดแล้ว', [RETURNED]: 'รอแก้เพิ่ม' };
  $('filters').innerHTML = statuses.map(status => `<button class="filter ${status === activeFilter ? 'active' : ''}" data-filter="${status}">${labels[status]}</button>`).join('');
  document.querySelectorAll('[data-filter]').forEach(button => button.onclick = () => { activeFilter = button.dataset.filter; renderFilters(); showRows(); });
}
function renderBars(review,closed,returned) {
  const data=[['อยู่ระหว่างประเมิน',review,'#18a79c'],['ปิดการแก้ไขแล้ว',closed,'#299766'],['รอการแก้ไขเพิ่มเติม',returned,'#f0a12c']];
  $('status-bars').innerHTML=data.map(([label,value,color])=>`<div><div class="bar-head"><span>${label}</span><strong>${value} รายการ</strong></div><div class="bar-track"><div class="bar-fill" style="width:${state.issues.length ? value/state.issues.length*100 : 0}%;background:${color}"></div></div></div>`).join('');
}
function renderAssessors() {
  const groups = new Map();
  state.issues.forEach(issue => { const name = issue.assessor || 'ไม่ระบุผู้ตรวจประเมิน'; groups.set(name, [...(groups.get(name) || []), issue]); });
  $('assessor-list').innerHTML = [...groups.entries()].map(([name, issues]) => `<article class="assessor-card"><h3 class="assessor-name">${esc(name)}</h3><p class="assessor-total">รับผิดชอบทั้งหมด <strong>${issues.length}</strong> ข้อ</p><div class="assessor-counts"><span><strong>${count(UNDER_REVIEW, issues)}</strong>รอตรวจ</span><span class="closed"><strong>${count(CLOSED, issues)}</strong>ปิดแล้ว</span><span class="returned"><strong>${count(RETURNED, issues)}</strong>รอแก้เพิ่ม</span></div></article>`).join('');
}
function render() {
  const issues=state.issues, review=count(UNDER_REVIEW), closed=count(CLOSED), returned=count(RETURNED), pct=issues.length?Math.round(closed/issues.length*100):0;
  $('total-count').textContent=issues.length; $('review-count').textContent=review; $('closed-count').textContent=closed; $('returned-count').textContent=returned;
  $('progress-pct').textContent=`${pct}%`; $('banner-pct').textContent=`${pct}%`; $('progress-copy').textContent=`${closed} จาก ${issues.length} ปิดการแก้ไขแล้ว`; $('donut').style.setProperty('--pct',`${pct}%`);
  $('audit-date').textContent=`สิ้นสุดการตรวจ: ${thaiDate(new Date(state.auditEnd))}`; $('due-date').textContent=`กำหนดส่ง: ${thaiDate(new Date(state.dueDate))}`;
  renderBars(review,closed,returned); renderAssessors(); renderFilters(); showRows(); tick();
}
function showRows() {
  if(!state)return; const q=$('search').value.trim().toLowerCase();
  const filtered=state.issues.filter(x=>(activeFilter==='ทั้งหมด'||x.status===activeFilter)&&`${x.no} ${x.assessor || ''} ${x.clause} ${x.title} ${x.type}`.toLowerCase().includes(q));
  $('row-summary').textContent=`แสดง ${filtered.length} จาก ${state.issues.length} รายการ`;
  $('issue-list').innerHTML=filtered.map(x=>`<tr><td>${esc(x.no)}</td><td>${esc(x.assessor || '-')}</td><td>${esc(x.type)}</td><td>${esc(x.clause)}</td><td>${esc(x.title)}</td><td><span class="pill ${statusClass(x.status)}">${esc(x.status)}</span></td></tr>`).join('')||'<tr><td colspan="6">ไม่พบรายการที่ตรงกับเงื่อนไข</td></tr>';
}
function tick() {
  if(!state)return; const now=new Date(),audit=new Date(`${state.auditEnd}T23:59:59`),due=new Date(`${state.dueDate}T23:59:59`),elapsed=Math.max(0,now-audit),left=due-now;
  const days=Math.floor(elapsed/86400000),hrs=String(Math.floor(elapsed/3600000)%24).padStart(2,'0'),mins=String(Math.floor(elapsed/60000)%60).padStart(2,'0'),secs=String(Math.floor(elapsed/1000)%60).padStart(2,'0');
  $('elapsed').textContent=`${days} วัน ${hrs}:${mins}:${secs}`; const leftDays=Math.ceil(left/86400000); $('remaining').textContent=leftDays>=0?`เหลือ ${leftDays} วัน`:`เกินกำหนด ${Math.abs(leftDays)} วัน`; $('remaining').style.color=leftDays<0?'var(--red)':'var(--amber)';
}
async function loadData(){try{const result=await fetch(`data/status.json?ts=${Date.now()}`,{cache:'no-store'});state=await result.json();render();$('sync-dot').style.background='var(--teal)';$('sync-text').textContent=`อัปเดต ${new Date().toLocaleTimeString('th-TH')}`;}catch{$('sync-dot').style.background='var(--red)';$('sync-text').textContent='อ่านไฟล์สถานะไม่สำเร็จ';}}
$('search').addEventListener('input',showRows);$('refresh').addEventListener('click',loadData);setInterval(tick,1000);setInterval(loadData,60000);loadData();
