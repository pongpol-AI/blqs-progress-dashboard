let state;
const $ = (id) => document.getElementById(id);
const thaiDate = (date) => new Intl.DateTimeFormat('th-TH',{dateStyle:'long'}).format(date);

function statusClass(status) { return status === 'ผ่านการประเมินแล้ว' ? 'approved' : status === 'อยู่ระหว่างประเมินการแก้ไข' ? 'submitted' : ''; }
function render() {
  const issues = state.issues;
  const submitted = issues.filter(x => x.status !== 'รอการบันทึกแก้ไข').length;
  const approved = issues.filter(x => x.status === 'ผ่านการประเมินแล้ว').length;
  const pending = issues.length - submitted;
  const pct = issues.length ? Math.round((submitted / issues.length) * 100) : 0;
  $('submitted-count').textContent = submitted; $('pending-count').textContent = pending; $('approved-count').textContent = approved;
  $('progress-pct').textContent = `${pct}%`; $('progress-copy').textContent = `${submitted} จาก ${issues.length} รายการ`;
  $('donut').style.setProperty('--pct', `${pct}%`);
  $('audit-date').textContent = `สิ้นสุดการตรวจ: ${thaiDate(new Date(state.auditEnd))}`;
  $('due-date').textContent = `กำหนดส่งปัจจุบัน: ${thaiDate(new Date(state.dueDate))}`;
  showRows(issues);
  tick();
}
function showRows(issues) {
  const q = $('search').value.trim().toLowerCase();
  const filtered = issues.filter(x => `${x.clause} ${x.title} ${x.type}`.toLowerCase().includes(q));
  $('issue-list').innerHTML = filtered.map(x => `<tr><td>${x.no}</td><td>${x.type}</td><td>${x.clause}</td><td>${x.title}</td><td><span class="pill ${statusClass(x.status)}">${x.status}</span></td></tr>`).join('');
}
function tick() {
  if (!state) return;
  const now = new Date(), audit = new Date(`${state.auditEnd}T23:59:59`), due = new Date(`${state.dueDate}T23:59:59`);
  const elapsed = Math.max(0, now - audit), left = due - now;
  const days = Math.floor(elapsed / 86400000), hrs = String(Math.floor(elapsed / 3600000) % 24).padStart(2,'0'), mins = String(Math.floor(elapsed / 60000) % 60).padStart(2,'0'), secs = String(Math.floor(elapsed / 1000) % 60).padStart(2,'0');
  $('elapsed').textContent = `${days} วัน ${hrs}:${mins}:${secs}`;
  const leftDays = Math.ceil(left / 86400000);
  $('remaining').textContent = leftDays >= 0 ? `เหลือ ${leftDays} วัน` : `เกินกำหนด ${Math.abs(leftDays)} วัน`;
  $('remaining').style.color = leftDays < 0 ? 'var(--red)' : 'var(--amber)';
}
async function loadData(isRefresh=false) {
  try { const result = await fetch(`data/status.json?ts=${Date.now()}`, {cache:'no-store'}); state = await result.json(); render(); $('sync-text').textContent = `อัปเดตข้อมูล: ${new Date().toLocaleTimeString('th-TH')}`; }
  catch { $('sync-dot').style.background = 'var(--red)'; $('sync-text').textContent = 'อ่านไฟล์สถานะไม่สำเร็จ'; }
}
$('search').addEventListener('input', () => showRows(state.issues));
setInterval(tick, 1000); setInterval(() => loadData(true), 60000); loadData();
