/**
 * WorkforceIQ — Frontend JavaScript
 * REST API calls, Chart.js visualizations, interactive UI
 */

const API = 'http://localhost:5000/api';

// ─── MOCK DATA (when backend is offline) ───────────────────────────────────
const MOCK = {
  dashboard: {
    summary: {
      total_employees: 20, present_today: 17,
      attendance_rate: 85, scheduled_this_week: 94, avg_hours_worked: 7.8
    },
    department_stats: [
      { department: 'Engineering', count: 4, avg_hours: 8.2 },
      { department: 'Marketing',   count: 4, avg_hours: 7.5 },
      { department: 'Operations',  count: 3, avg_hours: 7.9 },
      { department: 'HR',          count: 3, avg_hours: 7.3 },
      { department: 'Sales',       count: 3, avg_hours: 8.0 },
      { department: 'Finance',     count: 3, avg_hours: 7.6 },
    ],
    top_performers: [
      { name: 'Aarav Sharma',   avg_hours: 8.9, days_present: 22, department: 'Engineering' },
      { name: 'Vikram Singh',   avg_hours: 8.7, days_present: 21, department: 'Sales' },
      { name: 'Ananya Reddy',   avg_hours: 8.5, days_present: 22, department: 'Finance' },
      { name: 'Priya Patel',    avg_hours: 8.3, days_present: 20, department: 'Marketing' },
      { name: 'Rohan Mehta',    avg_hours: 8.1, days_present: 21, department: 'Operations' },
    ]
  },
  employees: [
    { id:1, name:'Aarav Sharma',   role:'Software Engineer',   department:'Engineering', email:'aarav.sharma@workforceiq.com',  status:'active',   hourly_rate:45, hire_date:'2021-03-15' },
    { id:2, name:'Priya Patel',    role:'Marketing Manager',   department:'Marketing',   email:'priya.patel@workforceiq.com',   status:'active',   hourly_rate:35, hire_date:'2021-07-22' },
    { id:3, name:'Rohan Mehta',    role:'Operations Manager',  department:'Operations',  email:'rohan.mehta@workforceiq.com',   status:'active',   hourly_rate:30, hire_date:'2022-01-10' },
    { id:4, name:'Sneha Joshi',    role:'HR Manager',          department:'HR',          email:'sneha.joshi@workforceiq.com',   status:'active',   hourly_rate:32, hire_date:'2021-11-05' },
    { id:5, name:'Vikram Singh',   role:'Account Executive',   department:'Sales',       email:'vikram.singh@workforceiq.com',  status:'active',   hourly_rate:38, hire_date:'2022-04-18' },
    { id:6, name:'Ananya Reddy',   role:'Financial Analyst',   department:'Finance',     email:'ananya.reddy@workforceiq.com',  status:'active',   hourly_rate:40, hire_date:'2022-06-01' },
    { id:7, name:'Arjun Kumar',    role:'DevOps Engineer',     department:'Engineering', email:'arjun.kumar@workforceiq.com',   status:'active',   hourly_rate:45, hire_date:'2021-09-20' },
    { id:8, name:'Kavya Nair',     role:'Content Strategist',  department:'Marketing',   email:'kavya.nair@workforceiq.com',    status:'active',   hourly_rate:33, hire_date:'2022-02-14' },
    { id:9, name:'Siddharth Gupta',role:'Logistics Coordinator',department:'Operations', email:'siddharth.gupta@workforceiq.com',status:'on_leave', hourly_rate:28, hire_date:'2021-05-30' },
    { id:10,name:'Pooja Iyer',     role:'Recruiter',           department:'HR',          email:'pooja.iyer@workforceiq.com',    status:'active',   hourly_rate:30, hire_date:'2023-01-08' },
    { id:11,name:'Rahul Verma',    role:'Sales Rep',           department:'Sales',       email:'rahul.verma@workforceiq.com',   status:'active',   hourly_rate:36, hire_date:'2022-08-15' },
    { id:12,name:'Deepika Rao',    role:'Accountant',          department:'Finance',     email:'deepika.rao@workforceiq.com',   status:'active',   hourly_rate:38, hire_date:'2021-12-01' },
    { id:13,name:'Amit Mishra',    role:'Tech Lead',           department:'Engineering', email:'amit.mishra@workforceiq.com',   status:'active',   hourly_rate:50, hire_date:'2020-06-10' },
    { id:14,name:'Sunita Tiwari',  role:'SEO Analyst',         department:'Marketing',   email:'sunita.tiwari@workforceiq.com', status:'inactive', hourly_rate:30, hire_date:'2022-11-20' },
    { id:15,name:'Karan Malhotra', role:'Finance Manager',     department:'Finance',     email:'karan.malhotra@workforceiq.com',status:'active',   hourly_rate:48, hire_date:'2020-03-25' },
  ],
  schedules: [],
  attendance: [],
  productivity: [],
};

// Auto-generate mock schedules & attendance
(function buildMockData() {
  const today = new Date();
  const shifts = ['morning','afternoon','night'];
  const times  = { morning:['06:00','14:00'], afternoon:['14:00','22:00'], night:['22:00','06:00'] };
  const weekStart = getMonday(today);

  MOCK.employees.forEach((emp, i) => {
    for (let d=0; d<5; d++) {
      const day = new Date(weekStart); day.setDate(weekStart.getDate()+d);
      const shift = shifts[(i+d)%3];
      MOCK.schedules.push({
        employee_id: emp.id, employee_name: emp.name,
        department: emp.department, role: emp.role,
        shift_date: fmt(day), start_time: times[shift][0],
        end_time: times[shift][1], shift_type: shift,
        week_start: fmt(weekStart), status: 'scheduled'
      });
    }
  });

  for (let w=0; w<4; w++) {
    MOCK.employees.forEach(emp => {
      for (let d=0; d<5; d++) {
        const day = new Date(); day.setDate(day.getDate()-(w*7+d));
        if (day.getDay()===0||day.getDay()===6) return;
        const hrs = +(6.5+Math.random()*3).toFixed(1);
        const s = 8+Math.floor(Math.random()*2), sm=Math.floor(Math.random()*60);
        const eh = s+Math.floor(hrs), em=sm;
        MOCK.attendance.push({
          employee_id: emp.id, name: emp.name, department: emp.department,
          date: fmt(day),
          check_in:  `${String(s).padStart(2,'0')}:${String(sm).padStart(2,'0')}:00`,
          check_out: `${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}:00`,
          hours_worked: hrs,
          status: Math.random()>.08 ? 'present' : (Math.random()>.5 ? 'absent' : 'late')
        });
      }
      // Productivity
      const ws = new Date(); ws.setDate(ws.getDate()-w*7);
      MOCK.productivity.push({
        employee_id:emp.id, name:emp.name, department:emp.department, role:emp.role,
        days_worked: Math.floor(18+Math.random()*5),
        total_hours: +(130+Math.random()*50).toFixed(1),
        avg_daily_hours: +(6.5+Math.random()*2).toFixed(1),
        total_pay: +(emp.hourly_rate*(130+Math.random()*50)).toFixed(0)
      });
    });
  }
})();


// ─── HELPERS ──────────────────────────────────────────────────────────────
function fmt(d) {
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function getMonday(d) {
  const x = new Date(d);
  const day = x.getDay(), diff = x.getDate()-day+(day===0?-6:1);
  return new Date(x.setDate(diff));
}
async function apiFetch(url) {
  try {
    const res = await fetch(API + url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch { return null; }
}

const COLORS = ['#3ecf8e','#6c8ff8','#f5a623','#e05252','#9b59b6','#1abc9c'];
function avatarColor(name) {
  const h = [...name].reduce((a,c)=>a+c.charCodeAt(0),0);
  return COLORS[h%COLORS.length];
}
function initials(name) { return name.split(' ').slice(0,2).map(w=>w[0]).join(''); }

let charts = {};
function destroyChart(id) { if (charts[id]) { charts[id].destroy(); delete charts[id]; } }


// ─── NAVIGATION ──────────────────────────────────────────────────────────
const PAGE_TITLES = { dashboard:'Dashboard', employees:'Employees', schedule:'Scheduling', attendance:'Attendance', analytics:'Analytics', reports:'Reports' };

function navigate(page) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
  document.getElementById('pageTitle').textContent = PAGE_TITLES[page] || page;
  if (window.innerWidth < 769) document.getElementById('sidebar').classList.remove('open');
  loadPageData(page);
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

function loadPageData(page) {
  if (page==='dashboard')  loadDashboard();
  if (page==='employees')  loadEmployees();
  if (page==='schedule')   { initWeekPicker(); loadSchedule(); }
  if (page==='attendance') { initMonthPicker(); loadAttendance(); }
  if (page==='analytics')  loadAnalytics();
}


// ─── CLOCK ────────────────────────────────────────────────────────────────
function startClock() {
  const el = document.getElementById('liveClock');
  function tick() {
    const n = new Date();
    el.textContent = n.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  }
  tick(); setInterval(tick, 1000);
}


// ─── DASHBOARD ────────────────────────────────────────────────────────────
async function loadDashboard() {
  const data = (await apiFetch('/analytics/dashboard')) || MOCK.dashboard;
  const s = data.summary;
  document.getElementById('kpiTotal').textContent   = s.total_employees;
  document.getElementById('kpiPresent').textContent = s.present_today;
  document.getElementById('kpiAttRate').textContent = s.attendance_rate + '% rate';
  document.getElementById('kpiShifts').textContent  = s.scheduled_this_week;
  document.getElementById('kpiHours').textContent   = s.avg_hours_worked + 'h';

  renderAttendanceChart(data.department_stats);
  renderDeptChart(data.department_stats);
  renderPerformers(data.top_performers);
  renderActivity();
}

function renderAttendanceChart(deptStats) {
  destroyChart('attendanceChart');
  const ctx = document.getElementById('attendanceChart');
  charts.attendanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['4 wk ago','3 wk ago','2 wk ago','Last wk','This wk'],
      datasets: [
        { label:'Present', data:[74,78,80,82,85], borderColor:'#3ecf8e', backgroundColor:'rgba(62,207,142,.1)', fill:true, tension:.4, pointRadius:4, pointBackgroundColor:'#3ecf8e' },
        { label:'Absent',  data:[10,9,8,7,6],     borderColor:'#e05252', backgroundColor:'rgba(224,82,82,.1)',   fill:true, tension:.4, pointRadius:4, pointBackgroundColor:'#e05252' },
      ]
    },
    options: {
      responsive:true, plugins:{ legend:{ display:false } },
      scales: {
        x:{ grid:{ color:'rgba(255,255,255,.04)' }, ticks:{ color:'#8892a4', font:{size:11} } },
        y:{ grid:{ color:'rgba(255,255,255,.04)' }, ticks:{ color:'#8892a4', font:{size:11} } }
      }
    }
  });
}

function renderDeptChart(deptStats) {
  destroyChart('deptChart');
  const ctx = document.getElementById('deptChart');
  charts.deptChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: deptStats.map(d=>d.department),
      datasets:[{ data: deptStats.map(d=>d.count), backgroundColor: COLORS, borderWidth:2, borderColor:'#13161b' }]
    },
    options: {
      responsive:true,
      plugins:{ legend:{ position:'bottom', labels:{ color:'#8892a4', font:{size:11}, padding:12 } } }
    }
  });
}

function renderPerformers(list) {
  const el = document.getElementById('performersList');
  el.innerHTML = list.slice(0,5).map((p,i) => `
    <div class="performer-row">
      <div class="perf-rank">#${i+1}</div>
      <div class="perf-avatar" style="background:${avatarColor(p.name)}">${initials(p.name)}</div>
      <div class="perf-info">
        <div class="perf-name">${p.name}</div>
        <div class="perf-dept">${p.department}</div>
      </div>
      <div class="perf-hours">${p.avg_hours}h</div>
    </div>
  `).join('');
}

function renderActivity() {
  const activities = [
    { text: 'Aarav Sharma checked in at 08:42', time: '2 min ago' },
    { text: 'Auto-schedule generated for this week', time: '1 hr ago' },
    { text: 'Siddharth Gupta leave request approved', time: '2 hr ago' },
    { text: 'Priya Patel checked out — 8.5 hrs', time: '4 hr ago' },
    { text: 'New employee Neha Agarwal added', time: 'Yesterday' },
    { text: 'Weekly report generated for all depts', time: 'Yesterday' },
  ];
  document.getElementById('activityFeed').innerHTML = activities.map(a=>`
    <div class="activity-item">
      <div class="act-dot"></div>
      <div><div class="act-text">${a.text}</div><div class="act-time">${a.time}</div></div>
    </div>
  `).join('');
}


// ─── EMPLOYEES ────────────────────────────────────────────────────────────
let allEmployees = [];
async function loadEmployees() {
  allEmployees = (await apiFetch('/employees')) || MOCK.employees;
  renderEmployeeTable(allEmployees);
}

function renderEmployeeTable(list) {
  document.getElementById('employeeTbody').innerHTML = list.map(e=>`
    <tr>
      <td><div class="emp-cell">
        <div class="emp-av" style="background:${avatarColor(e.name)};color:#0d0f12">${initials(e.name)}</div>
        <div><div style="font-weight:500">${e.name}</div><div style="font-size:.72rem;color:var(--text3)">${e.email}</div></div>
      </div></td>
      <td>${e.role}</td>
      <td>${e.department}</td>
      <td><span class="status ${e.status}">${e.status.replace('_',' ')}</span></td>
      <td>₹${e.hourly_rate}/hr</td>
      <td>${e.hire_date}</td>
      <td>
        <button class="btn-edit" onclick="openEmployeeModal(${JSON.stringify(e).replace(/"/g,"'")})">Edit</button>
        <button class="btn-del" onclick="deleteEmployee(${e.id},'${e.name}')">Del</button>
      </td>
    </tr>
  `).join('');
}

function filterEmployees(query) {
  const dept = document.getElementById('deptFilter').value;
  const q = query.toLowerCase();
  const filtered = allEmployees.filter(e =>
    (!q || e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q) || e.department.toLowerCase().includes(q)) &&
    (!dept || e.department === dept)
  );
  renderEmployeeTable(filtered);
}

function deleteEmployee(id, name) {
  if (!confirm(`Delete ${name}?`)) return;
  allEmployees = allEmployees.filter(e=>e.id!==id);
  renderEmployeeTable(allEmployees);
  showToast(`${name} removed`, 'info');
  fetch(`${API}/employees/${id}`,{method:'DELETE'}).catch(()=>{});
}

function openEmployeeModal(emp=null) {
  document.getElementById('modalTitle').textContent = emp ? 'Edit Employee' : 'Add Employee';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group"><label>Full Name</label>
      <input id="fName" value="${emp?emp.name:''}" placeholder="e.g. Aarav Sharma"/></div>
    <div class="form-row">
      <div class="form-group"><label>Role</label>
        <input id="fRole" value="${emp?emp.role:''}" placeholder="Software Engineer"/></div>
      <div class="form-group"><label>Department</label>
        <select id="fDept">
          ${['Engineering','Marketing','Operations','HR','Sales','Finance'].map(d=>`<option ${emp&&emp.department===d?'selected':''}>${d}</option>`).join('')}
        </select></div>
    </div>
    <div class="form-group"><label>Email</label>
      <input id="fEmail" type="email" value="${emp?emp.email:''}" placeholder="email@workforceiq.com"/></div>
    <div class="form-row">
      <div class="form-group"><label>Phone</label>
        <input id="fPhone" value="${emp&&emp.phone?emp.phone:''}" placeholder="9XXXXXXXXX"/></div>
      <div class="form-group"><label>Hourly Rate (₹)</label>
        <input id="fRate" type="number" value="${emp?emp.hourly_rate:25}" min="0"/></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Hire Date</label>
        <input id="fHire" type="date" value="${emp?emp.hire_date:''}"/></div>
      <div class="form-group"><label>Status</label>
        <select id="fStatus">
          <option value="active" ${emp&&emp.status==='active'?'selected':''}>Active</option>
          <option value="inactive" ${emp&&emp.status==='inactive'?'selected':''}>Inactive</option>
          <option value="on_leave" ${emp&&emp.status==='on_leave'?'selected':''}>On Leave</option>
        </select></div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveEmployee(${emp?emp.id:0})">${emp?'Update':'Add'} Employee</button>
    </div>
  `;
  document.getElementById('modalOverlay').classList.add('open');
}

function saveEmployee(id) {
  const data = {
    name: document.getElementById('fName').value.trim(),
    role: document.getElementById('fRole').value.trim(),
    department: document.getElementById('fDept').value,
    email: document.getElementById('fEmail').value.trim(),
    phone: document.getElementById('fPhone').value.trim(),
    hourly_rate: parseFloat(document.getElementById('fRate').value),
    hire_date: document.getElementById('fHire').value,
    status: document.getElementById('fStatus').value,
  };
  if (!data.name || !data.email) { showToast('Name and email are required','error'); return; }

  if (id) {
    const idx = allEmployees.findIndex(e=>e.id===id);
    if (idx>=0) allEmployees[idx] = {...allEmployees[idx],...data};
    fetch(`${API}/employees/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).catch(()=>{});
  } else {
    const newEmp = {...data, id: Date.now()};
    allEmployees.unshift(newEmp);
    fetch(`${API}/employees`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).catch(()=>{});
  }
  renderEmployeeTable(allEmployees);
  closeModal();
  showToast(id?'Employee updated!':'Employee added!','success');
}


// ─── SCHEDULE ─────────────────────────────────────────────────────────────
function initWeekPicker() {
  const wp = document.getElementById('weekPicker');
  if (!wp.value) {
    const m = getMonday(new Date());
    wp.value = m.getFullYear()+'-W'+String(getWeekNumber(m)).padStart(2,'0');
  }
}
function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  date.setUTCDate(date.getUTCDate()+4-(date.getUTCDay()||7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date-yearStart)/86400000)+1)/7);
}

async function loadSchedule() {
  const schedules = (await apiFetch('/schedules?week='+fmt(getMonday(new Date())))) || MOCK.schedules;
  renderScheduleTable(schedules);
}

function renderScheduleTable(list) {
  document.getElementById('scheduleTbody').innerHTML = list.map(s=>`
    <tr>
      <td><div class="emp-cell">
        <div class="emp-av" style="background:${avatarColor(s.employee_name||s.name||'X')};color:#0d0f12">${initials(s.employee_name||s.name||'?')}</div>
        ${s.employee_name||s.name}
      </div></td>
      <td>${s.department}</td>
      <td>${s.shift_date}</td>
      <td><span class="shift-badge ${s.shift_type}">${s.shift_type}</span></td>
      <td>${s.start_time}</td>
      <td>${s.end_time}</td>
      <td><span class="status ${s.status}">${s.status}</span></td>
    </tr>
  `).join('');
}

async function autoGenerate() {
  const week = fmt(getMonday(new Date()));
  showToast('Auto-generating schedule…','info');
  const res = await fetch(`${API}/schedules/auto-generate`,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({week_start:week})
  }).then(r=>r.json()).catch(()=>null);
  if (res) showToast(res.message,'success');
  else showToast('Using mock schedule (backend offline)','info');
  loadSchedule();
}

function openShiftModal() {
  document.getElementById('modalTitle').textContent = 'Add Shift';
  const empOptions = allEmployees.map(e=>`<option value="${e.id}">${e.name} — ${e.department}</option>`).join('');
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group"><label>Employee</label><select id="sEmp">${empOptions}</select></div>
    <div class="form-row">
      <div class="form-group"><label>Date</label><input id="sDate" type="date"/></div>
      <div class="form-group"><label>Shift Type</label>
        <select id="sType">
          <option value="morning">Morning (06:00–14:00)</option>
          <option value="afternoon">Afternoon (14:00–22:00)</option>
          <option value="night">Night (22:00–06:00)</option>
        </select></div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveShift()">Add Shift</button>
    </div>
  `;
  document.getElementById('modalOverlay').classList.add('open');
}

function saveShift() {
  const empId   = parseInt(document.getElementById('sEmp').value);
  const date    = document.getElementById('sDate').value;
  const type    = document.getElementById('sType').value;
  const times   = { morning:['06:00','14:00'], afternoon:['14:00','22:00'], night:['22:00','06:00'] };
  const emp     = allEmployees.find(e=>e.id===empId);
  if (!date) { showToast('Select a date','error'); return; }

  const newShift = {
    employee_id:empId, employee_name:emp.name, department:emp.department, role:emp.role,
    shift_date:date, start_time:times[type][0], end_time:times[type][1],
    shift_type:type, week_start:fmt(getMonday(new Date(date))), status:'scheduled'
  };
  MOCK.schedules.unshift(newShift);
  fetch(`${API}/schedules`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newShift)}).catch(()=>{});
  loadSchedule();
  closeModal();
  showToast('Shift added!','success');
}


// ─── ATTENDANCE ───────────────────────────────────────────────────────────
function initMonthPicker() {
  const mp = document.getElementById('monthPicker');
  if (!mp.value) {
    const n = new Date();
    mp.value = n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0');
  }
}

async function loadAttendance() {
  const month = document.getElementById('monthPicker')?.value || '';
  const data = (await apiFetch('/attendance?month='+month)) || MOCK.attendance;
  document.getElementById('attendanceTbody').innerHTML = data.slice(0,50).map(a=>`
    <tr>
      <td><div class="emp-cell">
        <div class="emp-av" style="background:${avatarColor(a.name||'X')};color:#0d0f12">${initials(a.name||'?')}</div>
        ${a.name}
      </div></td>
      <td>${a.department}</td>
      <td>${a.date}</td>
      <td>${a.check_in||'—'}</td>
      <td>${a.check_out||'—'}</td>
      <td>${a.hours_worked?a.hours_worked+'h':'—'}</td>
      <td><span class="status ${a.status}">${a.status}</span></td>
    </tr>
  `).join('');
}

function checkIn() {
  showToast('Check-in recorded at '+new Date().toLocaleTimeString(),'success');
  fetch(`${API}/attendance/checkin`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({employee_id:1})}).catch(()=>{});
}
function checkOut() {
  showToast('Check-out recorded at '+new Date().toLocaleTimeString(),'info');
  fetch(`${API}/attendance/checkout`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({employee_id:1})}).catch(()=>{});
}


// ─── ANALYTICS ────────────────────────────────────────────────────────────
async function loadAnalytics() {
  const data = (await apiFetch('/analytics/productivity')) || MOCK.productivity;
  // Deduplicate by name
  const seen = new Set(); const unique = data.filter(r=>{ if(seen.has(r.name)) return false; seen.add(r.name); return true; });
  document.getElementById('productivityTbody').innerHTML = unique.slice(0,15).map(r=>`
    <tr>
      <td><div class="emp-cell">
        <div class="emp-av" style="background:${avatarColor(r.name)};color:#0d0f12">${initials(r.name)}</div>
        ${r.name}
      </div></td>
      <td>${r.department}</td>
      <td>${r.days_worked}</td>
      <td>${r.total_hours}h</td>
      <td>${r.avg_daily_hours}h</td>
      <td>₹${Number(r.total_pay).toLocaleString()}</td>
    </tr>
  `).join('');
  renderLeaderboard(data);
  renderHoursChart(data);
}

function renderLeaderboard(data) {
  destroyChart('leaderboardChart');
  const depts = {};
  data.forEach(r=>{ if(!depts[r.department]) depts[r.department]=[]; depts[r.department].push(r.avg_daily_hours); });
  const labels = Object.keys(depts);
  const vals   = labels.map(d=>+(depts[d].reduce((a,b)=>a+b,0)/depts[d].length).toFixed(1));
  charts.leaderboardChart = new Chart(document.getElementById('leaderboardChart'), {
    type:'bar',
    data:{ labels, datasets:[{ label:'Avg Daily Hours', data:vals, backgroundColor:COLORS, borderRadius:6 }] },
    options:{ responsive:true, plugins:{legend:{display:false}},
      scales:{ x:{ticks:{color:'#8892a4',font:{size:11}},grid:{display:false}},
               y:{ticks:{color:'#8892a4',font:{size:11}},grid:{color:'rgba(255,255,255,.04)'}} } }
  });
}

function renderHoursChart(data) {
  destroyChart('hoursChart');
  const seen=new Set(); const unique=data.filter(r=>{if(seen.has(r.name))return false;seen.add(r.name);return true;});
  charts.hoursChart = new Chart(document.getElementById('hoursChart'), {
    type:'bar', indexAxis:'y',
    data:{ labels:unique.slice(0,8).map(r=>r.name.split(' ')[0]),
           datasets:[{label:'Total Hours',data:unique.slice(0,8).map(r=>r.total_hours),backgroundColor:'#6c8ff8',borderRadius:4}] },
    options:{ responsive:true, plugins:{legend:{display:false}},
      scales:{ x:{ticks:{color:'#8892a4',font:{size:10}},grid:{color:'rgba(255,255,255,.04)'}},
               y:{ticks:{color:'#8892a4',font:{size:10}},grid:{display:false}} } }
  });
}


// ─── REPORTS ──────────────────────────────────────────────────────────────
function generateReport(type) {
  const out = document.getElementById('reportOutput');
  out.style.display = 'block';
  const titles = { weekly:'Weekly Schedule Report', productivity:'Productivity Report', labor_cost:'Labor Cost Analysis', attendance:'Attendance Summary' };
  let html = `<h3 style="font-family:Syne;margin-bottom:16px;font-size:1.1rem">${titles[type]}</h3>`;

  if (type==='weekly') {
    html += `<p style="color:var(--text2);margin-bottom:12px">Week: ${fmt(getMonday(new Date()))}</p>`;
    html += '<div class="table-wrap"><table class="data-table"><thead><tr><th>Employee</th><th>Dept</th><th>Date</th><th>Shift</th><th>Start</th><th>End</th><th>Status</th></tr></thead><tbody>';
    html += MOCK.schedules.slice(0,20).map(s=>`
      <tr><td>${s.employee_name}</td><td>${s.department}</td><td>${s.shift_date}</td>
      <td><span class="shift-badge ${s.shift_type}">${s.shift_type}</span></td>
      <td>${s.start_time}</td><td>${s.end_time}</td>
      <td><span class="status ${s.status}">${s.status}</span></td></tr>
    `).join('');
    html += '</tbody></table></div>';
  } else if (type==='productivity') {
    const seen=new Set();
    const unique=MOCK.productivity.filter(r=>{if(seen.has(r.name))return false;seen.add(r.name);return true;});
    html += '<div class="table-wrap"><table class="data-table"><thead><tr><th>Employee</th><th>Dept</th><th>Days</th><th>Hours</th><th>Avg/day</th><th>Pay</th></tr></thead><tbody>';
    html += unique.map(r=>`<tr><td>${r.name}</td><td>${r.department}</td><td>${r.days_worked}</td><td>${r.total_hours}h</td><td>${r.avg_daily_hours}h</td><td>₹${Number(r.total_pay).toLocaleString()}</td></tr>`).join('');
    html += '</tbody></table></div>';
  } else if (type==='labor_cost') {
    const total = MOCK.productivity.reduce((s,r)=>s+r.total_pay,0)/4;
    html += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">`;
    ['Engineering','Marketing','Operations','HR','Sales','Finance'].forEach((d,i) => {
      const emps = MOCK.employees.filter(e=>e.department===d);
      const cost = emps.reduce((s,e)=>s+e.hourly_rate*160,0);
      html += `<div class="kpi-card" style="--accent:${COLORS[i]}"><div class="kpi-label">${d}</div><div class="kpi-value" style="font-size:1.4rem">₹${cost.toLocaleString()}</div><div class="kpi-sub">Monthly est.</div></div>`;
    });
    html += `</div><p style="color:var(--text2)">Total Estimated Monthly Labor Cost: <strong style="color:var(--accent)">₹${Math.round(total*4).toLocaleString()}</strong></p>`;
  } else {
    const stats = {present:0,absent:0,late:0};
    MOCK.attendance.forEach(a=>{ if(stats[a.status]!==undefined) stats[a.status]++; });
    const total = stats.present+stats.absent+stats.late;
    html += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
      <div class="kpi-card" style="--accent:#3ecf8e"><div class="kpi-label">Present</div><div class="kpi-value">${stats.present}</div><div class="kpi-sub">${Math.round(stats.present/total*100)}%</div></div>
      <div class="kpi-card" style="--accent:#e05252"><div class="kpi-label">Absent</div><div class="kpi-value">${stats.absent}</div><div class="kpi-sub">${Math.round(stats.absent/total*100)}%</div></div>
      <div class="kpi-card" style="--accent:#f5a623"><div class="kpi-label">Late</div><div class="kpi-value">${stats.late}</div><div class="kpi-sub">${Math.round(stats.late/total*100)}%</div></div>
    </div>`;
  }
  out.innerHTML = html;
  showToast('Report generated!','success');
}


// ─── MODAL & TOAST ────────────────────────────────────────────────────────
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }

let toastTimer;
function showToast(msg, type='success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 3200);
}


// ─── INIT ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  startClock();
  loadDashboard();
});
