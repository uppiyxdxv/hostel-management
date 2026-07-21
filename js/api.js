const API = 'https://hostel-management-api-0nr9.onrender.com/api';
let currentStudentId = null;

async function api(path, opts = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const r = await fetch(API + path, { headers: { ...headers, ...opts.headers }, ...opts });
  if (r.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('username'); showSection('section-login'); throw new Error('Session expired'); }
  if (!r.ok) { const e = await r.json().catch(() => ({ error: r.statusText })); throw e; }
  return r.json().catch(() => null);
}

function el(id) { return document.getElementById(id); }
function showToast(msg, type = 'success') {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.className = 'toast ' + type;
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── SECTION NAVIGATION ──
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const section = document.getElementById(id);
  if (section) section.classList.add('active');
}

// ── AUTH ──
async function handleLogin(e) {
  e.preventDefault();
  const btn = el('login-btn'); btn.disabled = true; btn.textContent = 'Signing in...';
  el('login-error').textContent = '';
  try {
    const res = await fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: el('login-username').value, password: el('login-password').value })
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Login failed'); }
    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    showToast('Welcome, ' + data.username);
    enterDashboard();
  } catch (e) {
    el('login-error').textContent = e.message || 'Invalid credentials';
    showToast(e.message, 'error');
  }
  btn.disabled = false; btn.textContent = 'Sign In';
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = el('register-btn'); btn.disabled = true; btn.textContent = 'Registering...';
  el('register-error').textContent = '';
  try {
    const data = {
      name: el('reg-name').value.trim(),
      email: el('reg-email').value.trim(),
      phone: el('reg-phone').value.trim(),
      gender: el('reg-gender').value,
      dob: el('reg-dob').value,
      address: el('reg-address').value.trim()
    };
    if (!data.name || !data.email || !data.phone) throw new Error('Name, Email & Phone required');
    await api('/auth/register', { method: 'POST', body: JSON.stringify(data) });
    showToast('Registration successful! Admin can log in to manage.');
    el('reg-name').value = ''; el('reg-email').value = ''; el('reg-phone').value = '';
    el('reg-gender').value = ''; el('reg-dob').value = ''; el('reg-address').value = '';
    showSection('section-login');
  } catch (e) {
    el('register-error').textContent = e.message || e.error || 'Registration failed';
    showToast(e.message || 'Failed', 'error');
  }
  btn.disabled = false; btn.textContent = 'Register';
}

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  showToast('Logged out');
  showSection('section-home');
  if (statsInterval) clearInterval(statsInterval);
}

function enterDashboard() {
  showSection('section-dashboard');
  el('sidebar-user').textContent = '👤 ' + (localStorage.getItem('username') || 'Admin');
  initDashboard();
}

// ── DASHBOARD ──
let statsInterval;

function showPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  const panel = el(id);
  if (panel) panel.classList.add('active');
  document.getElementById('pageTitle').textContent = panel?.querySelector('h2')?.textContent || '🏨 Dashboard';
}

function goHome() { showPanel('panel-home'); loadDashboard(); }

async function loadDashboard() {
  try {
    const [students, rooms, fees, visitors, complaints, attendance] = await Promise.all([
      api('/students'), api('/rooms'), api('/fees'), api('/visitors'), api('/complaints'), api('/attendance/stats/today')
    ]);
    el('stat-total-students').textContent = students?.length || 0;
    el('stat-total-rooms').textContent = rooms?.length || 0;
    el('stat-unpaid-fees').textContent = fees?.filter(f => f.status === 'UNPAID').length || 0;
    el('stat-visitors-today').textContent = (visitors || []).filter(v => {
      const d = new Date(v.date); const today = new Date(); return d.toDateString() === today.toDateString();
    }).length || 0;
    el('stat-pending-complaints').textContent = complaints?.filter(c => c.status !== 'RESOLVED').length || 0;
    el('stat-present-today').textContent = attendance?.present || 0;
  } catch (e) { console.error('Dashboard load error', e); }
}

function initDashboard() {
  loadDashboard();
  loadStudents();
  loadRooms();
  loadFees();
  loadVisitors();
  loadComplaints();
  loadAttendance();
  if (statsInterval) clearInterval(statsInterval);
  statsInterval = setInterval(() => { loadDashboard(); }, 30000);
}

// ── STUDENTS ──
async function loadStudents() {
  try {
    el('studentCount').textContent = 'Loading...';
    const list = await api('/students');
    el('studentCount').textContent = list?.length || 0;
    const tbody = el('studentTbody');
    if (!list || !list.length) { tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No students registered</td></tr>'; return; }
    tbody.innerHTML = list.map(s => `<tr>
      <td>${s.id}</td><td><strong>${s.name}</strong></td><td>${s.email}</td><td>${s.phone}</td>
      <td>${s.roomNumber || '-'}</td><td>${s.gender || '-'}</td>
      <td><span class="status-badge ${s.status.toLowerCase()}">${s.status}</span></td>
      <td style="display:flex;gap:.3rem;flex-wrap:wrap;">
        <button class="btn btn-sm btn-success" onclick="openAllotModal(${s.id},'${s.name.replace(/'/g,"\\'")}')">🛏</button>
        <button class="btn btn-sm btn-danger" onclick="deleteStudent(${s.id})">✕</button>
      </td>
    </tr>`).join('');
  } catch (e) { showToast('Failed to load students', 'error'); }
}

async function saveStudent() {
  const data = { name: el('s-name').value.trim(), email: el('s-email').value.trim(), phone: el('s-phone').value.trim(), address: el('s-address').value.trim(), gender: el('s-gender').value, dob: el('s-dob').value };
  if (!data.name || !data.email || !data.phone) { showToast('Name, Email & Phone required', 'error'); return; }
  try {
    await api('/students', { method: 'POST', body: JSON.stringify(data) });
    showToast('Student registered');
    el('s-name').value = ''; el('s-email').value = ''; el('s-phone').value = ''; el('s-address').value = ''; el('s-gender').value = ''; el('s-dob').value = '';
    loadStudents(); loadDashboard();
  } catch (e) { showToast(e.error || 'Failed to save', 'error'); }
}

async function deleteStudent(id) {
  if (!confirm('Delete this student?')) return;
  try { await api('/students/' + id, { method: 'DELETE' }); showToast('Student deleted'); loadStudents(); loadDashboard(); loadRooms(); }
  catch (e) { showToast('Delete failed', 'error'); }
}

// ── ROOM ALLOTMENT MODAL ──
async function openAllotModal(studentId, studentName) {
  currentStudentId = studentId;
  el('allot-student-name').textContent = studentName;
  const sel = el('allot-room-select');
  sel.innerHTML = '<option value="">Loading rooms...</option>';
  el('allot-modal').style.display = 'flex';
  try {
    const rooms = await api('/rooms');
    const available = rooms.filter(r => r.status === 'AVAILABLE' || r.occupied < r.capacity);
    sel.innerHTML = available.length ? available.map(r =>
      `<option value="${r.id}">${r.roomNumber} — ${r.type} (${r.occupied}/${r.capacity}) ₹${r.rent}</option>`
    ).join('') : '<option value="">No rooms available</option>';
  } catch (e) { sel.innerHTML = '<option value="">Failed to load rooms</option>'; showToast('Failed to load rooms', 'error'); }
}

function closeAllotModal() {
  el('allot-modal').style.display = 'none';
  currentStudentId = null;
}

async function confirmAllot() {
  const roomId = parseInt(el('allot-room-select').value);
  if (!roomId) { showToast('Select a room', 'error'); return; }
  try {
    await api('/students/' + currentStudentId + '/allot-room', { method: 'PUT', body: JSON.stringify({ roomId }) });
    showToast('Room allotted successfully');
    closeAllotModal();
    loadStudents(); loadRooms(); loadDashboard();
  } catch (e) { showToast(e.error || 'Allotment failed', 'error'); }
}

// ── ROOMS ──
async function loadRooms() {
  try {
    const list = await api('/rooms');
    const tbody = el('roomTbody');
    if (!list || !list.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No rooms added</td></tr>'; return; }
    tbody.innerHTML = list.map(r => `<tr>
      <td><strong>${r.roomNumber}</strong></td><td>${r.floor}</td><td>${r.type}</td>
      <td>${r.occupied}/${r.capacity}</td><td>₹${r.rent}</td>
      <td><span class="status-badge ${r.status.toLowerCase()}">${r.status}</span></td>
    </tr>`).join('');
    el('roomCount').textContent = list.length;
    el('availableCount').textContent = list.filter(r => r.status === 'AVAILABLE').length;
  } catch (e) { showToast('Failed to load rooms', 'error'); }
}

async function saveRoom() {
  const data = { roomNumber: el('r-number').value.trim(), floor: el('r-floor').value.trim(), type: el('r-type').value, capacity: parseInt(el('r-capacity').value), rent: parseFloat(el('r-rent').value) || 0 };
  if (!data.roomNumber || !data.floor || !data.capacity) { showToast('Room Number, Floor & Capacity required', 'error'); return; }
  try {
    await api('/rooms', { method: 'POST', body: JSON.stringify(data) });
    showToast('Room added');
    el('r-number').value = ''; el('r-floor').value = ''; el('r-type').value = 'SINGLE'; el('r-capacity').value = ''; el('r-rent').value = '';
    loadRooms(); loadDashboard();
  } catch (e) { showToast(e.error || 'Failed to save', 'error'); }
}

// ── FEES ──
async function loadFees() {
  try {
    const list = await api('/fees');
    const tbody = el('feeTbody');
    if (!list || !list.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No fee records</td></tr>'; return; }
    tbody.innerHTML = list.map(f => `<tr>
      <td>${f.studentName || 'ID: ' + f.studentId}</td><td>₹${f.amount}</td><td>${f.type || '-'}</td>
      <td>${f.dueDate}</td>
      <td><span class="status-badge ${f.status.toLowerCase()}">${f.status}</span></td>
      <td>${f.status === 'UNPAID' ? `<button class="btn btn-sm btn-success" onclick="payFee(${f.id})">Pay Now</button>` : f.paidDate || '-'}</td>
    </tr>`).join('');
    el('totalFees').textContent = '₹' + list.reduce((s, f) => s + f.amount, 0);
    el('paidFees').textContent = list.filter(f => f.status === 'PAID').length;
    el('unpaidFees').textContent = list.filter(f => f.status === 'UNPAID').length;
  } catch (e) { showToast('Failed to load fees', 'error'); }
}

async function saveFee() {
  const data = { studentId: parseInt(el('f-student').value), studentName: el('f-student-name').value.trim(), amount: parseFloat(el('f-amount').value), dueDate: el('f-due').value, type: el('f-type').value, remark: el('f-remark').value.trim() };
  if (!data.studentId || !data.amount || !data.dueDate) { showToast('Student, Amount & Due Date required', 'error'); return; }
  try { await api('/fees', { method: 'POST', body: JSON.stringify(data) }); showToast('Fee record created'); el('f-amount').value = ''; el('f-due').value = ''; el('f-remark').value = ''; loadFees(); loadDashboard(); }
  catch (e) { showToast(e.error || 'Failed', 'error'); }
}
async function payFee(id) {
  try { await api('/fees/' + id + '/pay', { method: 'PUT' }); showToast('Fee marked as paid'); loadFees(); loadDashboard(); }
  catch (e) { showToast('Payment failed', 'error'); }
}

// ── VISITORS ──
async function loadVisitors() {
  try {
    const list = await api('/visitors');
    const tbody = el('visitorTbody');
    if (!list || !list.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No visitors today</td></tr>'; return; }
    tbody.innerHTML = list.map(v => `<tr>
      <td><strong>${v.visitorName}</strong></td><td>${v.studentName || '-'}</td><td>${v.phone || '-'}</td>
      <td>${v.purpose || '-'}</td>
      <td>${v.inTime || '-'}</td>
      <td>${v.status === 'IN' ? `<span class="status-badge in-progress">IN</span>` : `<span class="status-badge active">OUT ${v.outTime||''}</span>`}</td>
    </tr>`).join('');
  } catch (e) { showToast('Failed to load visitors', 'error'); }
}
async function saveVisitor() {
  const data = { visitorName: el('v-name').value.trim(), studentName: el('v-student').value.trim(), phone: el('v-phone').value.trim(), purpose: el('v-purpose').value.trim() };
  if (!data.visitorName || !data.studentName) { showToast('Visitor & Student name required', 'error'); return; }
  try { await api('/visitors', { method: 'POST', body: JSON.stringify(data) }); showToast('Visitor checked in'); el('v-name').value = ''; el('v-student').value = ''; el('v-phone').value = ''; el('v-purpose').value = ''; loadVisitors(); loadDashboard(); }
  catch (e) { showToast(e.error || 'Failed', 'error'); }
}

// ── COMPLAINTS ──
async function loadComplaints() {
  try {
    const list = await api('/complaints');
    const tbody = el('complaintTbody');
    if (!list || !list.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No complaints</td></tr>'; return; }
    tbody.innerHTML = list.map(c => `<tr>
      <td>${c.studentName || 'ID: ' + c.studentId}</td><td><strong>${c.title}</strong></td><td style="font-size:.8rem;color:var(--muted)">${(c.description||'').slice(0,60)}</td>
      <td>${c.category || '-'}</td><td><span class="status-badge ${c.status === 'RESOLVED' ? 'resolved' : c.status === 'IN_PROGRESS' ? 'in-progress' : 'pending'}">${c.status.replace('_', ' ')}</span></td>
      <td>${c.priority}</td>
      <td style="display:flex;gap:.3rem;flex-wrap:wrap;">
        ${c.status !== 'RESOLVED' ? `<button class="btn btn-sm btn-warning" onclick="updateComplaintStatus(${c.id},'IN_PROGRESS','')">Start</button>
        <button class="btn btn-sm btn-success" onclick="resolveComplaint(${c.id})">Resolve</button>` : '<span style="color:var(--muted);font-size:.75rem;">' + (c.resolvedAt || '') + '</span>'}
      </td>
    </tr>`).join('');
  } catch (e) { showToast('Failed to load complaints', 'error'); }
}
async function saveComplaint() {
  const data = { studentId: parseInt(el('c-student').value), studentName: el('c-student-name').value.trim(), title: el('c-title').value.trim(), description: el('c-desc').value.trim(), category: el('c-category').value, priority: el('c-priority').value };
  if (!data.studentId || !data.title) { showToast('Student & Title required', 'error'); return; }
  try { await api('/complaints', { method: 'POST', body: JSON.stringify(data) }); showToast('Complaint registered'); el('c-title').value = ''; el('c-desc').value = ''; loadComplaints(); loadDashboard(); }
  catch (e) { showToast(e.error || 'Failed', 'error'); }
}
async function updateComplaintStatus(id, status, resolution) {
  try { await api('/complaints/' + id + '/status', { method: 'PUT', body: JSON.stringify({ status, resolution }) }); showToast('Status updated'); loadComplaints(); }
  catch (e) { showToast('Failed', 'error'); }
}
async function resolveComplaint(id) {
  const resolution = prompt('Enter resolution details:');
  if (!resolution) return;
  await updateComplaintStatus(id, 'RESOLVED', resolution);
}

// ── ATTENDANCE ──
async function loadAttendance() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const list = await api('/attendance/date/' + today);
    const tbody = el('attTbody');
    if (!list || !list.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No attendance records for today.</td></tr>'; return; }
    tbody.innerHTML = list.map(a => `<tr>
      <td>${a.studentName || 'ID: ' + a.studentId}</td><td>${a.date}</td>
      <td><span class="status-badge ${a.status.toLowerCase()}">${a.status}</span></td>
      <td>${a.inTime || '-'}</td>
      <td>${a.outTime || '-'}</td>
      <td>${a.remark || '-'}</td>
    </tr>`).join('');
  } catch (e) { showToast('Failed to load attendance', 'error'); }
}
async function saveAttendance() {
  const data = { studentId: parseInt(el('a-student').value), studentName: el('a-student-name').value.trim(), status: el('a-status').value, date: new Date().toISOString().slice(0, 10), inTime: el('a-intime').value || null, remark: el('a-remark').value.trim() };
  if (!data.studentId) { showToast('Student required', 'error'); return; }
  try { await api('/attendance', { method: 'POST', body: JSON.stringify(data) }); showToast('Attendance marked'); el('a-intime').value = ''; el('a-remark').value = ''; loadAttendance(); loadDashboard(); }
  catch (e) { showToast(e.error || 'Failed', 'error'); }
}
async function markMultiplePresent() {
  try {
    const students = await api('/students');
    const today = new Date().toISOString().slice(0, 10);
    let count = 0;
    for (const s of students) {
      if (s.status !== 'ACTIVE') continue;
      await api('/attendance', { method: 'POST', body: JSON.stringify({ studentId: s.id, studentName: s.name, status: 'PRESENT', date: today, inTime: new Date().toLocaleTimeString() }) }).catch(() => {});
      count++;
    }
    showToast(count + ' students marked present');
    loadAttendance();
  } catch (e) { showToast('Failed', 'error'); }
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('token')) enterDashboard();
});
