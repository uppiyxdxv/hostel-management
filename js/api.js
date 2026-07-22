const API = 'https://hostel-management-api-0nr9.onrender.com/api';
const ADMIN_EMAIL = 'pallolla.upendra@gmail.com';
const EMAILJS_SERVICE_ID = 'service_w95ttgc';
const EMAILJS_ADMIN_TEMPLATE_ID = 'template_6ys76fc';
const EMAILJS_STUDENT_TEMPLATE_ID = 'template_td43r45';
const EMAILJS_PUBLIC_KEY = '-lldD-ySq5Puq5qnM';

emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

let currentStudentId = null;
let loginMode = 'admin';
let cachedStudents = [];

async function api(path, opts = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const r = await fetch(API + path, { headers: { ...headers, ...opts.headers }, ...opts });
  if (r.status === 401) { localStorage.clear(); showSection('section-home'); throw new Error('Session expired'); }
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

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const section = document.getElementById(id);
  if (section) section.classList.add('active');
}

// ── FORM VALIDATION ──
const validationRules = {
  email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg: 'Enter a valid email address' },
  phone: { pattern: /^[\d\s+\-().]{7,15}$/, msg: 'Enter a valid phone number' },
  password: { pattern: /.{6,}/, msg: 'Password must be at least 6 characters' },
  name: { pattern: /.{2,}/, msg: 'Name must be at least 2 characters' },
  required: { pattern: /.+/, msg: 'This field is required' },
  amount: { pattern: /^\d+(\.\d{1,2})?$/, msg: 'Enter a valid amount' },
  date: { pattern: /^\d{4}-\d{2}-\d{2}$/, msg: 'Select a valid date' }
};

function validateField(input, rules) {
  const val = input.value.trim();
  let valid = true;
  let msg = '';
  for (const rule of rules) {
    const r = validationRules[rule];
    if (r && !r.pattern.test(val)) { valid = false; msg = r.msg; break; }
  }
  if (rules.includes('required') && !val) { valid = false; msg = 'This field is required'; }
  input.classList.toggle('invalid', !valid && val.length > 0);
  input.classList.toggle('valid', valid && val.length > 0);
  let msgEl = input.parentElement.querySelector('.validation-msg');
  if (!msgEl) { msgEl = document.createElement('span'); msgEl.className = 'validation-msg'; input.parentElement.appendChild(msgEl); }
  msgEl.textContent = (!valid && val.length > 0) ? msg : '';
  msgEl.className = 'validation-msg' + (!valid && val.length > 0 ? ' error' : '');
  return valid;
}

function validateForm(formEl) {
  let allValid = true;
  formEl.querySelectorAll('[data-validate]').forEach(input => {
    const rules = input.dataset.validate.split(',');
    if (!validateField(input, rules)) allValid = false;
  });
  return allValid;
}

function attachValidation(formEl) {
  formEl.querySelectorAll('[data-validate]').forEach(input => {
    input.addEventListener('input', () => {
      const rules = input.dataset.validate.split(',');
      validateField(input, rules);
    });
    input.addEventListener('blur', () => {
      const rules = input.dataset.validate.split(',');
      validateField(input, rules);
    });
  });
}

// ── LOGIN MODE SWITCHING ──
function showLogin(mode) {
  loginMode = mode;
  document.querySelectorAll('.login-tab').forEach(t => t.classList.toggle('active', t.dataset.role === mode));
  const alt = el('login-alt');
  if (mode === 'admin') {
    el('login-logo').textContent = '🏨';
    el('login-title').textContent = 'Admin Login';
    el('login-sub').textContent = 'Sign in to manage the hostel';
    el('login-field-label').textContent = 'Admin Email';
    el('login-username').placeholder = 'Enter admin email';
    if (alt) alt.innerHTML = '';
  } else {
    el('login-logo').textContent = '👥';
    el('login-title').textContent = 'Student Login';
    el('login-sub').textContent = 'Sign in to view your dashboard';
    el('login-field-label').textContent = 'Student Email';
    el('login-username').placeholder = 'Enter your email';
    if (alt) alt.innerHTML = 'New student? <a href="#" onclick="showSection(\'section-register\')">Register here</a>';
  }
  showSection('section-login');
}

function switchLoginMode(mode) { showLogin(mode); }

// ── AUTH ──
async function handleLogin(e) {
  e.preventDefault();
  localStorage.removeItem('studentId');
  const form = e.target;
  if (!validateForm(form)) return;
  const btn = el('login-btn'); btn.disabled = true; btn.textContent = 'Signing in...';
  el('login-error').textContent = '';
  try {
    const res = await fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: el('login-username').value.trim(), password: el('login-password').value, mode: loginMode })
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Login failed'); }
    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    localStorage.setItem('role', data.role);
    if (data.studentId) localStorage.setItem('studentId', data.studentId);
    else localStorage.removeItem('studentId');
    showToast('Welcome, ' + data.username);
    if (data.role === 'student') enterStudentDashboard();
    else enterAdminDashboard();
  } catch (e) {
    el('login-error').textContent = e.message || 'Invalid credentials';
    if (e.message !== 'Session expired') showToast(e.message, 'error');
  }
  btn.disabled = false; btn.textContent = 'Sign In';
}

async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  if (!validateForm(form)) return;
  const btn = el('register-btn'); btn.disabled = true; btn.textContent = 'Registering...';
  el('register-error').textContent = '';
  try {
    const data = {
      name: el('reg-name').value.trim(),
      email: el('reg-email').value.trim(),
      phone: el('reg-phone').value.trim(),
      password: el('reg-password').value,
      gender: el('reg-gender').value,
      dob: el('reg-dob').value,
      address: el('reg-address').value.trim()
    };
    await api('/auth/register', { method: 'POST', body: JSON.stringify(data) });
    showToast('Registration successful! You can now login.');
    form.reset();
    showLogin('student');
  } catch (e) {
    el('register-error').textContent = e.message || e.error || 'Registration failed';
    if (e.message !== 'Session expired') showToast(e.message || 'Failed', 'error');
  }
  btn.disabled = false; btn.textContent = 'Register';
}

function handleLogout() {
  localStorage.clear();
  showToast('Logged out');
  showSection('section-home');
  if (statsInterval) clearInterval(statsInterval);
}

function enterAdminDashboard() {
  showSection('section-dashboard');
  el('sidebar-user').textContent = '👤 ' + (localStorage.getItem('username') || 'Admin');
  initAdminDashboard();
}

function enterStudentDashboard() {
  showSection('section-student-dashboard');
  el('sd-date').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  loadStudentDashboard();
}

// ── ADMIN DASHBOARD ──
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

function initAdminDashboard() {
  loadDashboard();
  loadStudents();
  loadRooms();
  loadFees();
  loadVisitors();
  loadComplaints();
  loadAttendance();
  populateStudentDropdowns();
  if (statsInterval) clearInterval(statsInterval);
  statsInterval = setInterval(() => { loadDashboard(); }, 30000);
}

// ── STUDENT DROPDOWNS (admin forms) ──
async function populateStudentDropdowns() {
  try {
    const list = await api('/students');
    cachedStudents = list || [];
    const opts = '<option value="">-- Select Student --</option>' +
      cachedStudents.map(s => `<option value="${s.id}" data-name="${s.name}">${s.id} — ${s.name} (${s.email})</option>`).join('');
    ['f-student', 'a-student', 'v-student'].forEach(id => {
      const sel = el(id);
      if (sel) sel.innerHTML = opts;
    });
  } catch (e) { console.error('Failed to load students for dropdowns', e); }
}

// ── STUDENTS (admin) ──
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
  } catch (e) { if (e.message !== 'Session expired') showToast('Failed to load students', 'error'); }
}

async function saveStudent() {
  const data = { name: el('s-name').value.trim(), email: el('s-email').value.trim(), phone: el('s-phone').value.trim(), address: el('s-address').value.trim(), gender: el('s-gender').value, dob: el('s-dob').value };
  if (!data.name || !data.email || !data.phone) { showToast('Name, Email & Phone required', 'error'); return; }
  try {
    await api('/students', { method: 'POST', body: JSON.stringify(data) });
    showToast('Student registered');
    el('s-name').value = ''; el('s-email').value = ''; el('s-phone').value = ''; el('s-address').value = ''; el('s-gender').value = ''; el('s-dob').value = '';
    loadStudents(); loadDashboard(); populateStudentDropdowns();
  } catch (e) { showToast(e.error || 'Failed to save', 'error'); }
}

async function deleteStudent(id) {
  if (!confirm('Delete this student?')) return;
  try { await api('/students/' + id, { method: 'DELETE' }); showToast('Student deleted'); loadStudents(); loadDashboard(); loadRooms(); populateStudentDropdowns(); }
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
  } catch (e) { sel.innerHTML = '<option value="">Failed to load rooms</option>'; if (e.message !== 'Session expired') showToast('Failed to load rooms', 'error'); }
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
  } catch (e) { if (e.message !== 'Session expired') showToast('Failed to load rooms', 'error'); }
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

// ── FEES (admin) ──
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
  } catch (e) { if (e.message !== 'Session expired') showToast('Failed to load fees', 'error'); }
}
async function saveFee() {
  const sel = el('f-student');
  const studentId = parseInt(sel.value);
  const studentName = sel.options[sel.selectedIndex]?.dataset?.name || '';
  const amount = parseFloat(el('f-amount').value);
  const dueDate = el('f-due').value;
  const data = { studentId, studentName, amount, dueDate, type: el('f-type').value, remark: el('f-remark').value.trim() };
  if (!studentId || !amount || !dueDate) { showToast('Student, Amount & Due Date required', 'error'); return; }
  try { await api('/fees', { method: 'POST', body: JSON.stringify(data) }); showToast('Fee record created'); el('f-amount').value = ''; el('f-due').value = ''; el('f-remark').value = ''; sel.value = ''; loadFees(); loadDashboard(); }
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
    if (!list || !list.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No visitors</td></tr>'; return; }
    tbody.innerHTML = list.map(v => `<tr>
      <td><strong>${v.visitorName}</strong></td><td>${v.studentName || '-'}</td><td>${v.phone || '-'}</td>
      <td>${v.purpose || '-'}</td>
      <td>${v.inTime || '-'}</td>
      <td>${v.status === 'IN' ? `<span class="status-badge in-progress">IN</span>` : `<span class="status-badge active">OUT ${v.outTime||''}</span>`}</td>
      <td>${v.status === 'IN' ? `<button class="btn btn-sm btn-warning" onclick="checkoutVisitor(${v.id})">Check Out</button>` : '-'}</td>
    </tr>`).join('');
  } catch (e) { if (e.message !== 'Session expired') showToast('Failed to load visitors', 'error'); }
}
async function saveVisitor() {
  const sel = el('v-student');
  const studentId = parseInt(sel.value);
  const studentName = sel.options[sel.selectedIndex]?.dataset?.name || '';
  const data = { visitorName: el('v-name').value.trim(), studentId, studentName, phone: el('v-phone').value.trim(), purpose: el('v-purpose').value.trim() };
  if (!data.visitorName || !studentId) { showToast('Visitor & Student required', 'error'); return; }
  try { await api('/visitors', { method: 'POST', body: JSON.stringify(data) }); showToast('Visitor checked in'); el('v-name').value = ''; sel.value = ''; el('v-phone').value = ''; el('v-purpose').value = ''; loadVisitors(); loadDashboard(); }
  catch (e) { showToast(e.error || 'Failed', 'error'); }
}
async function checkoutVisitor(id) {
  try { await api('/visitors/' + id + '/checkout', { method: 'PUT' }); showToast('Visitor checked out'); loadVisitors(); }
  catch (e) { showToast('Checkout failed', 'error'); }
}

// ── COMPLAINTS (admin) ──
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
  } catch (e) { if (e.message !== 'Session expired') showToast('Failed to load complaints', 'error'); }
}
async function updateComplaintStatus(id, status, resolution) {
  try { await api('/complaints/' + id + '/status', { method: 'PUT', body: JSON.stringify({ status, resolution }) }); showToast('Status updated'); loadComplaints(); }
  catch (e) { showToast('Failed', 'error'); }
}
async function resolveComplaint(id) {
  const resolution = prompt('Enter resolution details:');
  if (!resolution) return;
  try {
    await api('/complaints/' + id + '/status', { method: 'PUT', body: JSON.stringify({ status: 'RESOLVED', resolution }) });
    showToast('Status updated');
    loadComplaints();
    try {
      const c = await api('/complaints/' + id);
      if (c?.studentEmail) {
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_STUDENT_TEMPLATE_ID, {
          to_email: c.studentEmail,
          student_name: c.studentName || 'Student',
          title: c.title,
          resolution,
          resolved_at: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        }).catch(() => {});
      }
    } catch (_) {}
  } catch (e) { showToast('Failed', 'error'); }
}

// ── ATTENDANCE (admin) ──
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
  } catch (e) { if (e.message !== 'Session expired') showToast('Failed to load attendance', 'error'); }
}
async function saveAttendance() {
  const sel = el('a-student');
  const studentId = parseInt(sel.value);
  const studentName = sel.options[sel.selectedIndex]?.dataset?.name || '';
  const data = { studentId, studentName, status: el('a-status').value, date: new Date().toISOString().slice(0, 10), inTime: el('a-intime').value || null, remark: el('a-remark').value.trim() };
  if (!studentId) { showToast('Student required', 'error'); return; }
  try { await api('/attendance', { method: 'POST', body: JSON.stringify(data) }); showToast('Attendance marked'); el('a-intime').value = ''; el('a-remark').value = ''; sel.value = ''; loadAttendance(); loadDashboard(); }
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

// ═══════════════════════ STUDENT DASHBOARD ═══════════════════════
async function loadStudentDashboard() {
  const sid = localStorage.getItem('studentId');
  if (!sid) { showToast('Student ID not found', 'error'); handleLogout(); return; }
  try {
    const student = await api('/students/' + sid);
    if (!student) throw new Error('Student not found');
    el('sd-name').textContent = student.name;
    el('sd-profile-content').innerHTML = `
      <div class="sd-info"><span>Name</span><strong>${student.name}</strong></div>
      <div class="sd-info"><span>Email</span><strong>${student.email}</strong></div>
      <div class="sd-info"><span>Phone</span><strong>${student.phone}</strong></div>
      <div class="sd-info"><span>Gender</span><strong>${student.gender || '-'}</strong></div>
      <div class="sd-info"><span>DOB</span><strong>${student.dob || '-'}</strong></div>
      <div class="sd-info"><span>Status</span><strong>${student.status}</strong></div>
    `;
    if (student.roomNumber) {
      const rooms = await api('/rooms');
      const room = rooms.find(r => r.roomNumber === student.roomNumber);
      el('sd-room-content').innerHTML = room ? `
        <div class="sd-info"><span>Room</span><strong>${room.roomNumber}</strong></div>
        <div class="sd-info"><span>Floor</span><strong>${room.floor}</strong></div>
        <div class="sd-info"><span>Type</span><strong>${room.type}</strong></div>
        <div class="sd-info"><span>Rent</span><strong>₹${room.rent}</strong></div>
        <div class="sd-info"><span>Occupancy</span><strong>${room.occupied}/${room.capacity}</strong></div>
      ` : `<p style="color:var(--muted)">Room: ${student.roomNumber}</p>`;
    } else {
      el('sd-room-content').innerHTML = '<p style="color:var(--muted)">No room allotted yet</p>';
    }
    await loadStudentFees(sid);
    await loadStudentComplaints(sid);
    await loadStudentAttendance(sid);
    await loadStudentVisitors(sid);
  } catch (e) {
    if (e.message === 'Session expired') return;
    showToast('Failed to load dashboard', 'error');
  }
}

async function loadStudentFees(sid) {
  try {
    const fees = await api('/fees/student/' + sid);
    const c = el('sd-fees-content');
    if (!fees || !fees.length) { c.innerHTML = '<p style="color:var(--muted)">No fee records</p>'; return; }
    c.innerHTML = '<table style="font-size:.8rem"><thead><tr><th>Amount</th><th>Due</th><th>Status</th><th>Paid</th></tr></thead><tbody>' +
      fees.map(f => `<tr><td>₹${f.amount}</td><td>${f.dueDate}</td><td><span class="status-badge ${f.status.toLowerCase()}">${f.status}</span></td><td>${f.paidDate || '-'}</td></tr>`).join('') +
      '</tbody></table>';
  } catch (e) { if (e.message !== 'Session expired') el('sd-fees-content').innerHTML = '<p style="color:var(--muted)">Failed to load</p>'; }
}

async function loadStudentComplaints(sid) {
  try {
    const list = await api('/complaints/student/' + sid);
    const c = el('sd-complaints-content');
    if (!list || !list.length) { c.innerHTML = '<p style="color:var(--muted)">No complaints submitted</p>'; return; }
    c.innerHTML = list.map(cp => `<div style="padding:.5rem 0;border-bottom:1px solid var(--border);font-size:.82rem;">
      <strong>${cp.title}</strong> <span class="status-badge ${cp.status === 'RESOLVED' ? 'resolved' : cp.status === 'IN_PROGRESS' ? 'in-progress' : 'pending'}">${cp.status.replace('_',' ')}</span>
      <div style="color:var(--muted);font-size:.75rem;">${cp.description || ''}${cp.resolution ? '<br/><strong>Resolution:</strong> '+cp.resolution : ''}${cp.resolvedAt ? ' <em>('+cp.resolvedAt+')</em>' : ''}</div>
    </div>`).join('');
  } catch (e) { if (e.message !== 'Session expired') el('sd-complaints-content').innerHTML = '<p style="color:var(--muted)">Failed to load</p>'; }
}

async function sdSubmitComplaint() {
  const sid = localStorage.getItem('studentId');
  const sname = el('sd-name').textContent;
  const title = el('sd-comp-title').value.trim();
  const desc = el('sd-comp-desc').value.trim();
  if (!title) { showToast('Title required', 'error'); return; }
  try {
    let studentEmail = '';
    try { const student = await api('/students/' + sid); studentEmail = student?.email || ''; } catch (_) {}
    await api('/complaints', { method: 'POST', body: JSON.stringify({ studentId: parseInt(sid), studentName: sname, studentEmail, title, description: desc, category: 'OTHER', priority: 'MEDIUM' }) });
    showToast('Complaint submitted');
    el('sd-comp-title').value = ''; el('sd-comp-desc').value = '';
    await loadStudentComplaints(sid);
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_ADMIN_TEMPLATE_ID, {
      to_email: ADMIN_EMAIL,
      student_name: sname,
      student_email: studentEmail,
      title,
      description: desc || 'No description provided',
      category: 'Other',
      priority: 'Medium'
    }).catch(() => {});
  } catch (e) { showToast(e.error || 'Failed', 'error'); }
}

async function loadStudentAttendance(sid) {
  try {
    const list = await api('/attendance/student/' + sid);
    const c = el('sd-attendance-content');
    if (!list || !list.length) { c.innerHTML = '<p style="color:var(--muted)">No attendance records</p>'; return; }
    c.innerHTML = '<table style="font-size:.8rem"><thead><tr><th>Date</th><th>Status</th><th>In</th><th>Out</th></tr></thead><tbody>' +
      list.slice(-10).reverse().map(a => `<tr><td>${a.date}</td><td><span class="status-badge ${a.status.toLowerCase()}">${a.status}</span></td><td>${a.inTime || '-'}</td><td>${a.outTime || '-'}</td></tr>`).join('') +
      '</tbody></table>';
  } catch (e) { if (e.message !== 'Session expired') el('sd-attendance-content').innerHTML = '<p style="color:var(--muted)">Failed to load</p>'; }
}

async function loadStudentVisitors(sid) {
  try {
    const list = await api('/visitors/student/' + sid);
    const c = el('sd-visitors-content');
    if (!list || !list.length) { c.innerHTML = '<p style="color:var(--muted)">No visitor records</p>'; return; }
    c.innerHTML = '<table style="font-size:.8rem"><thead><tr><th>Visitor</th><th>Phone</th><th>Purpose</th><th>In</th><th>Out</th><th>Status</th></tr></thead><tbody>' +
      list.slice(-10).reverse().map(v => `<tr>
        <td><strong>${v.visitorName}</strong></td><td>${v.phone || '-'}</td><td>${v.purpose || '-'}</td>
        <td>${v.inTime || '-'}</td><td>${v.outTime || '-'}</td>
        <td><span class="status-badge ${v.status === 'IN' ? 'in-progress' : 'active'}">${v.status}</span></td>
      </tr>`).join('') +
      '</tbody></table>';
  } catch (e) { if (e.message !== 'Session expired') el('sd-visitors-content').innerHTML = '<p style="color:var(--muted)">Failed to load</p>'; }
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  showSection('section-home');
  document.querySelectorAll('form[data-validate-form]').forEach(attachValidation);
});
