// server.js - WRECK IT 6.0 Challenge - Sistem Informasi Akademik
const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// VULNERABILITY: Secret key yang akan terekspos di client-side
const JWT_SECRET = 'r0bl0x_n00b_h4x0r_g3t_r3kt_m8_42069';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock database mahasiswa
const users = new Map([
  ['mahasiswa1', { username: 'mahasiswa1', password: 'password123', role: 'mahasiswa', nim: '160411100001', nama: 'Budi Santoso' }],
  ['admin', { username: 'admin', password: 'admin123', role: 'admin', nim: '000000000000', nama: 'Administrator' }],
  ['dosen1', { username: 'dosen1', password: 'dosen123', role: 'dosen', nip: '196001011985031001', nama: 'Dr. Ahmad Wijaya' }]
]);

// Mock data nilai (mengandung flag)
const grades = [
  {
    id: '72bec4b5-2d78-40a7-a175-7f82e37c74ad',
    nim: '160411100001',
    matakuliah: 'Keamanan Sistem Informasi',
    semester: 'Ganjil 2024/2025',
    nilai: 'A',
    komentar: 'WRECKIT60{r0bl0x_n00b_g0t_pwn3d_1n_cl13nt_s1d3}',
    dosen: 'Dr. Cyber Security',
    sks: 3,
    tanggal_update: '2024-12-01T10:30:00.000Z'
  },
  {
    id: '03ac6478-ce1a-422b-879c-b7e2c5d712db',
    nim: '160411100002',
    matakuliah: 'Pemrograman Web',
    semester: 'Ganjil 2024/2025',
    nilai: 'B+',
    komentar: 'Mahasiswa menunjukkan pemahaman yang baik dalam pengembangan aplikasi web',
    dosen: 'Dr. Web Developer',
    sks: 3,
    tanggal_update: '2024-11-28T14:20:00.000Z'
  },
  {
    id: 'ed0d3a68-3b35-4466-8a65-23ebe73c1ab6',
    nim: '160411100003',
    matakuliah: 'Basis Data',
    semester: 'Ganjil 2024/2025',
    nilai: 'A-',
    komentar: 'Excellent understanding of database concepts and SQL implementation',
    dosen: 'Prof. Database Expert',
    sks: 3,
    tanggal_update: '2024-11-25T09:15:00.000Z'
  },
  {
    id: 'f1d2e3c4-b5a6-9876-5432-1098765432ab',
    nim: '160411100001',
    matakuliah: 'Algoritma dan Struktur Data',
    semester: 'Genap 2023/2024',
    nilai: 'A',
    komentar: 'Selamat! Anda berhasil menemukan kerentanan JWT. Flag: WRECKIT60{JWT_S3cr3t_Exp0s3d_1n_Cl13nt_S1d3}',
    dosen: 'Dr. Algorithm Master',
    sks: 4,
    tanggal_update: '2024-06-15T16:45:00.000Z'
  }
];

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const cookieToken = req.headers.cookie?.split(';')
    .find(c => c.trim().startsWith('authToken='))
    ?.split('=')[1];
  
  const token = authHeader?.split(' ')[1] || cookieToken;
  
  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak. Token diperlukan.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid.' });
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SIAKAD Roblox API berjalan normal',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Register endpoint
app.post('/api/auth/register', (req, res) => {
  const { username, password, nama, nim } = req.body;
  
  // Basic validation
  if (!username || !password || !nama) {
    return res.status(400).json({ message: 'Username, password, dan nama wajib diisi' });
  }
  
  if (username.length < 3) {
    return res.status(400).json({ message: 'Username minimal 3 karakter' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password minimal 6 karakter' });
  }
  
  if (users.has(username)) {
    return res.status(409).json({ message: 'Username sudah terdaftar' });
  }
  
  // Generate NIM otomatis jika tidak diisi
  const generatedNim = nim || `1604111000${String(users.size + 1).padStart(2, '0')}`;
  
  // Create new user
  const newUser = {
    username,
    password, // In real apps, hash this!
    role: 'mahasiswa',
    nim: generatedNim,
    nama,
    userId: uuidv4()
  };
  
  users.set(username, newUser);
  
  res.status(201).json({ 
    message: 'Akun berhasil dibuat',
    user: { 
      username: newUser.username, 
      role: newUser.role,
      nim: newUser.nim,
      nama: newUser.nama
    }
  });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi' });
  }
  
  const user = users.get(username);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Username atau password salah' });
  }
  
  // Generate JWT token
  const payload = {
    userId: user.userId || 'd3a7d941-d260-4b36-adf0-b8ce98380555',
    username: user.username,
    role: user.role,
    nim: user.nim || user.nip,
    nama: user.nama,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60) // 8 hours
  };
  
  const token = jwt.sign(payload, JWT_SECRET);
  
  res.json({ 
    token,
    user: { 
      username: user.username, 
      role: user.role,
      nim: user.nim || user.nip,
      nama: user.nama
    }
  });
});

// VULNERABLE ENDPOINT: Nilai mahasiswa (requires admin role)
app.get('/api/grades', authenticateToken, (req, res) => {
  // Check if user has admin or dosen role
  if (req.user.role !== 'admin' && req.user.role !== 'dosen') {
    return res.status(401).json({ 
      message: 'Akses ditolak. Hanya admin dan dosen yang dapat melihat semua nilai.',
      required_role: 'admin atau dosen',
      your_role: req.user.role
    });
  }
  
  // Return grades with flag
  res.json({
    message: 'Data nilai berhasil dimuat',
    total: grades.length,
    data: grades
  });
});

// Get nilai for specific student (mahasiswa can see their own)
app.get('/api/grades/my', authenticateToken, (req, res) => {
  if (req.user.role === 'mahasiswa') {
    const myGrades = grades.filter(grade => grade.nim === req.user.nim);
    res.json({
      message: 'Nilai Anda berhasil dimuat',
      nim: req.user.nim,
      nama: req.user.nama,
      total: myGrades.length,
      data: myGrades
    });
  } else {
    res.status(403).json({ message: 'Endpoint ini hanya untuk mahasiswa' });
  }
});

// User profile endpoint
app.get('/api/user/profile', authenticateToken, (req, res) => {
  res.json({
    userId: req.user.userId,
    username: req.user.username,
    role: req.user.role,
    nim: req.user.nim,
    nama: req.user.nama,
    login_time: new Date(req.user.iat * 1000).toISOString()
  });
});

// Get user statistics (admin only)
app.get('/api/stats', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(401).json({ message: 'Akses ditolak. Hanya admin yang dapat melihat statistik.' });
  }
  
  const totalUsers = users.size;
  const totalGrades = grades.length;
  const mahasiswaCount = Array.from(users.values()).filter(u => u.role === 'mahasiswa').length;
  const dosenCount = Array.from(users.values()).filter(u => u.role === 'dosen').length;
  
  res.json({
    total_users: totalUsers,
    total_grades: totalGrades,
    mahasiswa: mahasiswaCount,
    dosen: dosenCount,
    admin: 1,
    system_status: 'Online',
    last_updated: new Date().toISOString()
  });
});

// Serve main app for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Terjadi kesalahan pada server!' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WRECK IT 6.0 - SIAKAD Challenge server berjalan di port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 API: http://localhost:${PORT}/api`);
  console.log(`🎯 Challenge: JWT Security - SIAKAD Roblox`);
  console.log(`🏆 Flag: WRECKIT60{JWT_S3cr3t_Exp0s3d_1n_Cl13nt_S1d3}`);
});

module.exports = app;