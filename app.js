const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const storeKey = 'baobao-money-v1';
const today = new Date();
const isoToday = today.toISOString().slice(0, 10);
const money = (n) => `฿${Number(n || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
const defaults = { transactions: [], bills: [], goal: { name: 'เงินสำรองฉุกเฉิน', amount: 30000, saved: 0 } };
let data = JSON.parse(localStorage.getItem(storeKey) || 'null') || structuredClone(defaults);
let viewMonth = isoToday.slice(0, 7);
const save = () => { localStorage.setItem(storeKey, JSON.stringify(data)); render(); };
const monthItems = () => data.transactions.filter(t => t.date?.startsWith(viewMonth));
const expenseItems = () => monthItems().filter(t => t.type === 'expense');
const sum = (list) => list.reduce((a, x) => a + Number(x.amount || 0), 0);

function demoData() {
  const m = viewMonth;
  data.transactions = [
    ['เงินเดือน', `${m}-01`, 'income', 'งานประจำ', 42000, false], ['งานเสริมออกแบบ', `${m}-05`, 'income', 'งานเสริม', 4500, false],
    ['ค่าเช่าห้อง', `${m}-02`, 'expense', 'บ้านและที่พัก', 9000, false], ['อินเทอร์เน็ตรายเดือน', `${m}-05`, 'expense', 'บ้านและที่พัก', 599, false],
    ['Spotify Premium', `${m}-09`, 'expense', 'บันเทิง', 139, true], ['ค่าอาหารกลางวัน', `${m}-11`, 'expense', 'อาหารและเครื่องดื่ม', 120, false],
    ['บุฟเฟต์กับเพื่อน', `${m}-13`, 'expense', 'อาหารและเครื่องดื่ม', 699, true], ['ของใช้จากร้านออนไลน์', `${m}-14`, 'expense', 'ช้อปปิ้ง', 490, true],
    ['รถไฟฟ้า', `${m}-15`, 'expense', 'การเดินทาง', 280, false], ['อาหารเย็น', `${m}-15`, 'expense', 'อาหารและเครื่องดื่ม', 120, false]
  ].map(([name,date,type,category,amount,flexible], i) => ({ id: `${Date.now()}-${i}`, name, date, type, category, amount, flexible }));
  data.bills = [{ id: 'rent', name: 'ค่าเช่าห้อง', day: 2, amount: 9000, type: 'expense' }, { id: 'net', name: 'อินเทอร์เน็ตรายเดือน', day: 5, amount: 599, type: 'expense' }, { id: 'spotify', name: 'Spotify Premium', day: 9, amount: 139, type: 'expense' }];
  save();
}
function renderOverview() {
  const items = monthItems(), expenses = expenseItems();
  const income = sum(items.filter(t => t.type === 'income')), expense = sum(expenses), flexible = sum(expenses.filter(t => t.flexible));
  $('#income').textContent = money(income); $('#expense').textContent = money(expense); $('#balance').textContent = money(income - expense); $('#flexible').textContent = money(flexible);
  $('#chart-income').textContent = money(income); $('#chart-expense').textContent = money(expense); $('#donut-total').textContent = money(expense);
  const days = new Date(Number(viewMonth.slice(0,4)), Number(viewMonth.slice(5)), 0).getDate();
  const bars = Array.from({length: Math.min(days, 18)}, (_, i) => { const to = `${viewMonth}-${String(Math.ceil((i + 1) * days / 18)).padStart(2,'0')}`; const amount = sum(items.filter(t => t.date <= to)); return `<div class="bar" style="height:${Math.max(4, income ? amount / income * 100 : 3)}%"></div>`; }).join('');
  $('#bar-chart').innerHTML = bars;
  const categories = {};
  expenses.forEach(t => categories[t.category] = (categories[t.category] || 0) + Number(t.amount));
  const colors = ['#567966','#d6a674','#bd8282','#8997aa','#d5d8c8','#9cab82'];
  const pairs = Object.entries(categories).sort((a,b) => b[1]-a[1]);
  $('#category-list').innerHTML = pairs.length ? pairs.slice(0,6).map(([n,v], i) => `<li><span><i class="dot" style="background:${colors[i]}"></i>${n}</span><b>${expense ? Math.round(v / expense * 100) : 0}%</b></li>`).join('') : '<li>เพิ่มรายจ่ายเพื่อดูสัดส่วน</li>';
  $('#donut').style.background = pairs.length ? `conic-gradient(${pairs.map(([_,v],i) => `${colors[i]} ${sum(pairs.slice(0,i).map(x=>x[1])) / expense * 100}% ${sum(pairs.slice(0,i+1).map(x=>x[1])) / expense * 100}%`).join(',')})` : '#edf0eb';
  $('#latest-transactions').innerHTML = items.sort((a,b) => b.date.localeCompare(a.date)).slice(0,5).map(txnRow).join('') || '<p>ยังไม่มีรายการในเดือนนี้</p>';
  $('#upcoming-bills').innerHTML = data.bills.slice(0,4).map(b => `<div class="bill-chip"><b>${b.name}</b><span>ทุกวันที่ ${b.day} · ${b.type === 'income' ? 'รายรับ' : 'บิล'}</span><b>${b.type === 'income' ? '+' : '−'}${money(b.amount)}</b></div>`).join('') || '<p>ยังไม่มีบิลที่บันทึกไว้</p>';
  $('#transaction-count').textContent = data.transactions.length || '';
  $('#helper-title').textContent = data.transactions.length ? `บันทึกแล้ว ${data.transactions.length} รายการ ภาพเงินก็ชัดขึ้นอีกนิด` : 'เริ่มบันทึกรายการ ภาพเงินก็ชัดขึ้นอีกนิด';
}
function txnRow(t) { return `<div class="txn-row"><span><b>${escapeHtml(t.name)}</b></span><span>${fmtDate(t.date)}</span><span>${escapeHtml(t.category)}</span><span class="tag">${t.type === 'income' ? 'รายรับ' : t.flexible ? 'ปรับลดได้' : 'จำเป็น'}</span><span class="amount ${t.type}">${t.type === 'income' ? '+' : '−'}${money(t.amount)}</span><button class="icon-btn edit-txn" data-id="${t.id}" aria-label="แก้ไข ${escapeHtml(t.name)}">⋮</button></div>`; }
function renderTransactions() {
  const q = $('#search').value.trim().toLowerCase(), type = $('#type-filter').value;
  const list = data.transactions.filter(t => (!q || `${t.name} ${t.category}`.toLowerCase().includes(q)) && (type === 'all' || t.type === type)).sort((a,b) => b.date.localeCompare(a.date));
  $('#transaction-table').innerHTML = list.length ? `<div class="txn-row table-head"><span>รายการ</span><span>วันที่</span><span>หมวดหมู่</span><span>ความจำเป็น</span><span>จำนวนเงิน</span><span></span></div>${list.map(txnRow).join('')}` : '<p>ไม่พบรายการ ลองเพิ่มรายการใหม่ได้เลย</p>';
  $$('.edit-txn').forEach(b => b.onclick = () => openTransaction(data.transactions.find(t => t.id === b.dataset.id)));
}
function renderBills() { $('#bills-list').innerHTML = data.bills.length ? data.bills.map(b => `<div class="txn-row"><span><b>${escapeHtml(b.name)}</b></span><span>ทุกวันที่ ${b.day}</span><span>${b.type === 'income' ? 'รายได้ประจำ' : 'บิลรายจ่าย'}</span><span></span><span class="amount ${b.type}">${b.type === 'income'?'+':'−'}${money(b.amount)}</span><button class="icon-btn delete-bill" data-id="${b.id}">×</button></div>`).join('') : '<p>ยังไม่มีบิลหรือรายได้ประจำ</p>'; $$('.delete-bill').forEach(b=>b.onclick=()=>{data.bills=data.bills.filter(x=>x.id!==b.dataset.id);save()}); }
function renderGoal() { const g=data.goal; $('#goal-name').value=g.name; $('#goal-amount').value=g.amount; $('#saved-amount').value=g.saved; const pct=g.amount?Math.min(100,g.saved/g.amount*100):0; $('#goal-progress').style.width=`${pct}%`; $('#goal-summary').textContent=`เก็บแล้ว ${money(g.saved)} จากเป้าหมาย ${money(g.amount)} (${Math.round(pct)}%)`; }
function renderInsights() { const expenses=expenseItems(), total=sum(expenses), flex=sum(expenses.filter(x=>x.flexible)); const byCat={}; expenses.forEach(x=>byCat[x.category]=(byCat[x.category]||0)+Number(x.amount)); const top=Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0]; $('#insights').innerHTML = data.transactions.length ? `<div class="insight"><b>เดือนนี้เหลือจากรายการ ${money(sum(monthItems().filter(x=>x.type==='income'))-total)}</b><p>ตัวเลขนี้เป็นภาพจากรายการที่บันทึก ไม่ใช่ยอดคงเหลือในบัญชี</p></div><div class="insight"><b>รายจ่ายที่ปรับลดได้ ${money(flex)}</b><p>ถ้าต้องการเพิ่มเงินให้เป้าหมาย จุดนี้อาจเป็นพื้นที่ที่เริ่มดูได้</p></div>${top?`<div class="insight"><b>หมวดที่ใช้มากสุดคือ ${top[0]} (${money(top[1])})</b><p>ไม่มีหมวดไหนผิดหรือถูก นี่เป็นเพียงข้อมูลช่วยตัดสินใจ</p></div>`:''}` : '<p>เมื่อเพิ่มรายการแล้ว เบาเบาจะสรุปข้อสังเกตให้ตรงนี้</p>'; }
function render() { renderOverview(); renderTransactions(); renderBills(); renderGoal(); renderInsights(); }
function escapeHtml(s) { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function openTransaction(t) { const f=$('#transaction-form'); f.reset(); $('#transaction-title').textContent=t?'แก้ไขรายการ':'เพิ่มรายการ'; $('#edit-id').value=t?.id||''; $('#t-name').value=t?.name||''; $('#t-date').value=t?.date||isoToday; $('#t-type').value=t?.type||'expense'; $('#t-category').value=t?.category||''; $('#t-amount').value=t?.amount||''; $('#t-flexible').checked=t?.flexible||false; $('#transaction-dialog').showModal(); }
function goto(id) { $$('.page').forEach(x=>x.classList.toggle('active',x.id===id)); $$('.nav').forEach(x=>x.classList.toggle('active',x.dataset.page===id)); $('#crumb').textContent=({overview:'ภาพรวมการเงิน',transactions:'รายการเงินเข้า–ออก',bills:'บิลและรายได้ประจำ',plan:'แผนเงินของฉัน',assistant:'ผู้ช่วยเบาเบา',settings:'การตั้งค่าและข้อมูล'})[id]; window.scrollTo({top:0,behavior:'smooth'}); }
$$('[data-page]').forEach(b=>b.addEventListener('click',()=>goto(b.dataset.page)));
$('#add-transaction').onclick=()=>openTransaction(); $('#transaction-form').onsubmit=e=>{e.preventDefault();const id=$('#edit-id').value;const t={id:id||crypto.randomUUID(),name:$('#t-name').value.trim(),date:$('#t-date').value,type:$('#t-type').value,category:$('#t-category').value.trim(),amount:Number($('#t-amount').value),flexible:$('#t-flexible').checked};if(id)data.transactions=data.transactions.map(x=>x.id===id?t:x);else data.transactions.push(t);$('#transaction-dialog').close();save();};
$('#add-bill').onclick=()=>$('#bill-dialog').showModal(); $('#bill-form').onsubmit=e=>{e.preventDefault();data.bills.push({id:crypto.randomUUID(),name:$('#b-name').value.trim(),day:Number($('#b-day').value),amount:Number($('#b-amount').value),type:$('#b-type').value});$('#bill-dialog').close();save();};
$('#month-picker').value=viewMonth; $('#month-picker').onchange=e=>{viewMonth=e.target.value;render()}; $('#search').oninput=renderTransactions; $('#type-filter').onchange=renderTransactions;
$('#save-goal').onclick=()=>{data.goal={name:$('#goal-name').value,amount:Number($('#goal-amount').value),saved:Number($('#saved-amount').value)};save()};
$('#import-btn').onclick=()=>$('#csv-input').click(); $('#csv-input').onchange=async e=>{const file=e.target.files[0];if(!file)return;const text=await file.text();const lines=text.split(/\r?\n/).filter(Boolean);const first=lines[0].toLowerCase();const start=first.includes('date')||first.includes('วันที่')?1:0;let added=0;lines.slice(start).forEach(line=>{const cols=line.split(',').map(x=>x.trim().replace(/^"|"$/g,''));if(cols.length<3)return;const [date,name,amount,category='อื่น ๆ',type='expense']=cols;const n=Number(String(amount).replace(/[^\d.-]/g,''));if(!date||!name||!Number.isFinite(n))return;data.transactions.push({id:crypto.randomUUID(),date,name,amount:Math.abs(n),category,type:n<0?'expense':(type.toLowerCase().includes('income')?'income':'expense'),flexible:false});added++});if(added){save();alert(`นำเข้า ${added} รายการแล้ว`)}else alert('ไม่พบข้อมูลที่นำเข้าได้ — ใช้รูปแบบ: date,name,amount,category,type');e.target.value=''};
$('#load-demo').onclick=demoData; $('#export-data').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='baobao-backup.json';a.click();URL.revokeObjectURL(a.href)}; $('#clear-data').onclick=()=>{if(confirm('ล้างข้อมูลทั้งหมดจากเบราว์เซอร์นี้?')){data=structuredClone(defaults);save()}};
render();
