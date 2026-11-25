// app.js - WRECK IT 6.0 - SIAKAD Noobmaster69 Main Application
class SIAKADApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'landing';
        this.authToken = localStorage.getItem('authToken') || '';
        
        this.init();
    }

    init() {
        // Check if user is already logged in
        if (this.authToken) {
            this.validateToken();
        } else {
            this.showLandingPage();
        }

        // Bind event listeners
        this.bindEvents();
        console.log('🚀 SIAKAD Noobmaster69 Application initialized');
        console.log('🎯 WRECK IT 6.0');
    }

    async validateToken() {
        try {
            const response = await fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const user = await response.json();
                this.currentUser = user;
                this.showDashboard();
            } else {
                // Invalid token, remove it
                localStorage.removeItem('authToken');
                this.authToken = '';
                this.showLandingPage();
            }
        } catch (error) {
            console.error('Token validation failed:', error);
            this.showLandingPage();
        }
    }

    bindEvents() {
        // Navigation events will be bound dynamically when pages are rendered
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            // Handle navigation clicks
            if (target.dataset.navigate) {
                e.preventDefault();
                this.navigateTo(target.dataset.navigate);
            }
            
            // Handle form submissions
            if (target.dataset.action) {
                e.preventDefault();
                this.handleAction(target.dataset.action, target);
            }
        });

        // Handle form submissions
        document.addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.target;
            if (form.dataset.form) {
                this.handleFormSubmit(form.dataset.form, new FormData(form));
            }
        });
    }

    navigateTo(page) {
        this.currentPage = page;
        switch (page) {
            case 'landing':
                this.showLandingPage();
                break;
            case 'login':
                this.showLoginPage();
                break;
            case 'register':
                this.showRegisterPage();
                break;
            case 'dashboard':
                if (this.currentUser) {
                    this.showDashboard();
                } else {
                    this.showLoginPage();
                }
                break;
            default:
                this.showLandingPage();
        }
    }

    async handleFormSubmit(formType, formData) {
        switch (formType) {
            case 'login':
                await this.handleLogin(formData);
                break;
            case 'register':
                await this.handleRegister(formData);
                break;
        }
    }

    async handleLogin(formData) {
        const username = formData.get('username');
        const password = formData.get('password');

        if (!this.validateLoginForm(username, password)) {
            return;
        }

        try {
            this.showLoading('Sedang login...');
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.authToken = data.token;
                this.currentUser = data.user;
                localStorage.setItem('authToken', data.token);
                
                this.showSuccess('Login berhasil!');
                setTimeout(() => this.showDashboard(), 1000);
            } else {
                this.showError(data.message || 'Login gagal');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login gagal. Silakan coba lagi.');
        } finally {
            this.hideLoading();
        }
    }

    async handleRegister(formData) {
        const username = formData.get('username');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const nama = formData.get('nama');
        const nim = formData.get('nim');

        if (!this.validateRegisterForm(username, password, confirmPassword, nama)) {
            return;
        }

        try {
            this.showLoading('Membuat akun...');
            
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, nama, nim })
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess('Akun berhasil dibuat! Silakan login.');
                setTimeout(() => this.showLoginPage(), 1500);
            } else {
                this.showError(data.message || 'Registrasi gagal');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('Registrasi gagal. Silakan coba lagi.');
        } finally {
            this.hideLoading();
        }
    }

    validateLoginForm(username, password) {
        if (!username || username.length < 3) {
            this.showError('Username minimal 3 karakter');
            return false;
        }
        if (!password || password.length < 6) {
            this.showError('Password minimal 6 karakter');
            return false;
        }
        return true;
    }

    validateRegisterForm(username, password, confirmPassword, nama) {
        if (!username || username.length < 3) {
            this.showError('Username minimal 3 karakter');
            return false;
        }
        if (!password || password.length < 6) {
            this.showError('Password minimal 6 karakter');
            return false;
        }
        if (password !== confirmPassword) {
            this.showError('Password tidak cocok');
            return false;
        }
        if (!nama || nama.length < 2) {
            this.showError('Nama lengkap wajib diisi');
            return false;
        }
        return true;
    }

    async loadGrades() {
        try {
            this.showLoading('Memuat data nilai...');
            
            const response = await fetch('/api/grades', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.displayGrades(result.data);
            } else {
                const error = await response.json();
                this.showUnauthorizedMessage(error.message);
            }
        } catch (error) {
            console.error('Failed to load grades:', error);
            this.showError('Gagal memuat data nilai');
        } finally {
            this.hideLoading();
        }
    }

    async loadMyGrades() {
        if (this.currentUser.role !== 'mahasiswa') {
            this.showError('Fitur ini hanya untuk mahasiswa');
            return;
        }

        try {
            this.showLoading('Memuat nilai Anda...');
            
            const response = await fetch('/api/grades/my', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.displayMyGrades(result.data);
            } else {
                const error = await response.json();
                this.showError(error.message);
            }
        } catch (error) {
            console.error('Failed to load my grades:', error);
            this.showError('Gagal memuat nilai Anda');
        } finally {
            this.hideLoading();
        }
    }

    logout() {
        this.authToken = '';
        this.currentUser = null;
        localStorage.removeItem('authToken');
        this.showLandingPage();
        this.showSuccess('Logout berhasil');
    }

    // UI Rendering Methods
    showLandingPage() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
                <nav class="bg-white bg-opacity-10 backdrop-blur-md p-4">
                    <div class="container mx-auto flex justify-between items-center">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                                <span class="text-blue-900 font-bold text-lg">🎓</span>
                            </div>
                            <div>
                                <span class="text-xl font-bold">SIAKAD Noobmaster69</span>
                                <div class="text-xs text-blue-200">Sistem Informasi Akademik</div>
                            </div>
                        </div>
                        <div class="space-x-4">
                            <button data-navigate="login" class="text-blue-200 hover:text-white transition-colors">
                                Masuk
                            </button>
                            <button data-navigate="register" class="bg-yellow-500 hover:bg-yellow-400 text-blue-900 px-6 py-2 rounded-lg font-medium transition-colors">
                                Daftar
                            </button>
                        </div>
                    </div>
                </nav>

                <div class="container mx-auto px-6 py-20">
                    <div class="text-center mb-16">
                        <div class="inline-block bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-6">
                            🏆 
                        </div>
                        <h1 class="text-5xl lg:text-6xl font-bold mb-6">
                            Sistem Informasi Akademik
                            <span class="text-yellow-400">Roblox noobmaster69</span>
                        </h1>
                        <p class="text-xl text-blue-200 max-w-3xl mx-auto mb-8">
                            Platform digital terintegrasi untuk manajemen akademik mahasiswa, dosen, dan administrasi di lingkungan Noobmaster69
                        </p>
                        <button data-navigate="register" class="bg-yellow-500 hover:bg-yellow-400 text-blue-900 px-8 py-4 rounded-lg text-lg font-bold transition-colors">
                            Mulai Akses SIAKAD
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div class="bg-white bg-opacity-10 backdrop-blur-md p-6 rounded-xl">
                            <div class="text-yellow-400 text-3xl mb-4">📊</div>
                            <h3 class="text-xl font-semibold mb-3">Manajemen Nilai</h3>
                            <p class="text-blue-200">Akses dan kelola nilai akademik dengan sistem terintegrasi dan real-time</p>
                        </div>
                        
                        <div class="bg-white bg-opacity-10 backdrop-blur-md p-6 rounded-xl">
                            <div class="text-yellow-400 text-3xl mb-4">👨‍🎓</div>
                            <h3 class="text-xl font-semibold mb-3">Portal Mahasiswa</h3>
                            <p class="text-blue-200">Akses informasi akademik, jadwal kuliah, dan riwayat studi lengkap</p>
                        </div>
                        
                        <div class="bg-white bg-opacity-10 backdrop-blur-md p-6 rounded-xl">
                            <div class="text-yellow-400 text-3xl mb-4">🔒</div>
                            <h3 class="text-xl font-semibold mb-3">Keamanan Data</h3>
                            <p class="text-blue-200">Sistem keamanan berlapis untuk melindungi data akademik mahasiswa</p>
                        </div>
                        
                        <div class="bg-white bg-opacity-10 backdrop-blur-md p-6 rounded-xl">
                            <div class="text-yellow-400 text-3xl mb-4">👨‍🏫</div>
                            <h3 class="text-xl font-semibold mb-3">Portal Dosen</h3>
                            <p class="text-blue-200">Interface khusus untuk dosen mengelola mata kuliah dan penilaian</p>
                        </div>
                        
                        <div class="bg-white bg-opacity-10 backdrop-blur-md p-6 rounded-xl">
                            <div class="text-yellow-400 text-3xl mb-4">📈</div>
                            <h3 class="text-xl font-semibold mb-3">Analisis Akademik</h3>
                            <p class="text-blue-200">Dashboard analitik untuk monitoring performa akademik secara komprehensif</p>
                        </div>
                        
                        <div class="bg-white bg-opacity-10 backdrop-blur-md p-6 rounded-xl">
                            <div class="text-yellow-400 text-3xl mb-4">🔒</div>
                            <h3 class="text-xl font-semibold mb-3">Keamanan Data</h3>
                            <p class="text-blue-200">Sistem keamanan berlapis untuk melindungi data akademik mahasiswa dan dosen</p>
                        </div>
                    </div>
                </div>
                
                <footer class="bg-blue-900 bg-opacity-50 py-8 px-6 mt-20">
                    <div class="container mx-auto text-center">
                        <div class="flex justify-center space-x-6 text-blue-300 mb-4">
                            <a href="#" class="hover:text-white transition-colors">Kebijakan Privasi</a>
                            <a href="#" class="hover:text-white transition-colors">Syarat & Ketentuan</a>
                            <a href="#" class="hover:text-white transition-colors">Bantuan</a>
                        </div>
                        <p class="text-blue-400 text-sm">© 2025 Noobmaster69 - Sistem Informasi Akademik</p>
                    </div>
                </footer>
            </div>
        `;
    }

    showLoginPage() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-green-900 text-white flex items-center justify-center">
                <div class="bg-white bg-opacity-10 backdrop-blur-md p-8 rounded-xl w-96 max-w-md">
                    <div class="text-center mb-8">
                        <div class="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-blue-900 font-bold text-2xl">🎮</span>
                        </div>
                        <h2 class="text-2xl font-bold mb-2">Welcome Back Gamer!</h2>
                        <p class="text-blue-200">Ready to access your epic academic journey?</p>
                    </div>
                    
                    <form data-form="login" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Username</label>
                            <div class="relative">
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Enter your epic username"
                                    required
                                    class="w-full bg-white bg-opacity-20 border border-blue-300 border-opacity-30 rounded-lg px-4 py-3 pl-12 text-white placeholder-blue-200 focus:outline-none focus:border-yellow-400 focus:bg-opacity-30 transition-all"
                                />
                                <span class="absolute left-4 top-3.5 text-blue-300">🎯</span>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Password</label>
                            <div class="relative">
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Enter your secret code"
                                    required
                                    class="w-full bg-white bg-opacity-20 border border-blue-300 border-opacity-30 rounded-lg px-4 py-3 pl-12 text-white placeholder-blue-200 focus:outline-none focus:border-yellow-400 focus:bg-opacity-30 transition-all"
                                />
                                <span class="absolute left-4 top-3.5 text-blue-300">🔐</span>
                            </div>
                        </div>

                        <button type="submit" class="w-full bg-yellow-500 hover:bg-yellow-400 text-blue-900 py-3 rounded-lg font-bold text-lg transition-colors">
                            🚀 Let's Get Epic!
                        </button>
                    </form>
                    
                    <div class="text-center mt-6">
                        <p class="text-blue-200 text-sm">
                            Belum punya akun? 
                            <button data-navigate="register" class="text-yellow-400 hover:text-yellow-300 font-medium transition-colors">
                                Daftar sekarang
                            </button>
                        </p>
                        <button data-navigate="landing" class="text-blue-300 hover:text-white text-sm mt-2 transition-colors">
                            ← Kembali ke Beranda
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    showRegisterPage() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-green-900 via-blue-800 to-purple-900 text-white flex items-center justify-center py-8">
                <div class="bg-white bg-opacity-10 backdrop-blur-md p-8 rounded-xl w-96 max-w-md">
                    <div class="text-center mb-8">
                        <div class="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-blue-900 font-bold text-2xl">✨</span>
                        </div>
                        <h2 class="text-2xl font-bold mb-2">Join the Epic Squad!</h2>
                        <p class="text-blue-200">Create your legendary academic account</p>
                    </div>
                    
                    <form data-form="register" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Nama Lengkap</label>
                            <div class="relative">
                                <input
                                    type="text"
                                    name="nama"
                                    placeholder="Enter your real name"
                                    required
                                    class="w-full bg-white bg-opacity-20 border border-blue-300 border-opacity-30 rounded-lg px-4 py-3 pl-12 text-white placeholder-blue-200 focus:outline-none focus:border-yellow-400 focus:bg-opacity-30 transition-all"
                                />
                                <span class="absolute left-4 top-3.5 text-blue-300">👤</span>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">NIM</label>
                            <div class="relative">
                                <input
                                    type="text"
                                    name="nim"
                                    placeholder="160411100xxx"
                                    class="w-full bg-white bg-opacity-20 border border-blue-300 border-opacity-30 rounded-lg px-4 py-3 pl-12 text-white placeholder-blue-200 focus:outline-none focus:border-yellow-400 focus:bg-opacity-30 transition-all"
                                />
                                <span class="absolute left-4 top-3.5 text-blue-300">🎓</span>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Username</label>
                            <div class="relative">
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Choose your epic username"
                                    required
                                    class="w-full bg-white bg-opacity-20 border border-blue-300 border-opacity-30 rounded-lg px-4 py-3 pl-12 text-white placeholder-blue-200 focus:outline-none focus:border-yellow-400 focus:bg-opacity-30 transition-all"
                                />
                                <span class="absolute left-4 top-3.5 text-blue-300">🎯</span>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Password</label>
                            <div class="relative">
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Create a strong password"
                                    required
                                    class="w-full bg-white bg-opacity-20 border border-blue-300 border-opacity-30 rounded-lg px-4 py-3 pl-12 text-white placeholder-blue-200 focus:outline-none focus:border-yellow-400 focus:bg-opacity-30 transition-all"
                                />
                                <span class="absolute left-4 top-3.5 text-blue-300">🔐</span>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Konfirmasi Password</label>
                            <div class="relative">
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Confirm your password"
                                    required
                                    class="w-full bg-white bg-opacity-20 border border-blue-300 border-opacity-30 rounded-lg px-4 py-3 pl-12 text-white placeholder-blue-200 focus:outline-none focus:border-yellow-400 focus:bg-opacity-30 transition-all"
                                />
                                <span class="absolute left-4 top-3.5 text-blue-300">🔒</span>
                            </div>
                        </div>

                        <button type="submit" class="w-full bg-yellow-500 hover:bg-yellow-400 text-blue-900 py-3 rounded-lg font-bold text-lg transition-colors">
                            🌟 Create Epic Account
                        </button>
                    </form>
                    
                    <div class="text-center mt-6">
                        <p class="text-blue-200 text-sm">
                            Sudah punya akun? 
                            <button data-navigate="login" class="text-yellow-400 hover:text-yellow-300 font-medium transition-colors">
                                Login sekarang
                            </button>
                        </p>
                        <button data-navigate="landing" class="text-blue-300 hover:text-white text-sm mt-2 transition-colors">
                            ← Kembali ke Beranda
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    showDashboard() {
        if (!this.currentUser) {
            this.showLoginPage();
            return;
        }

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-900 text-white">
                <nav class="bg-white bg-opacity-10 backdrop-blur-md p-4 border-b border-white border-opacity-20">
                    <div class="container mx-auto flex justify-between items-center">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                <span class="text-white font-bold text-lg">🎮</span>
                            </div>
                            <div>
                                <span class="text-xl font-bold">SIAKAD ROBLOX</span>
                                <div class="text-xs text-blue-200">Epic Academic System</div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-6">
                            <div class="text-right">
                                <div class="font-medium">${this.currentUser.nama}</div>
                                <div class="text-xs text-blue-300">${this.currentUser.role.toUpperCase()}${this.currentUser.nim ? ' - ' + this.currentUser.nim : ''}</div>
                            </div>
                            <button data-action="logout" class="bg-red-500 hover:bg-red-400 px-4 py-2 rounded-lg font-medium transition-colors">
                                Logout
                            </button>
                        </div>
                    </div>
                </nav>

                <div class="container mx-auto px-6 py-8">
                    <div class="text-center mb-12">
                        <h1 class="text-4xl font-bold mb-4">
                            Welcome, <span class="text-yellow-400">${this.currentUser.nama}!</span>
                        </h1>
                        <p class="text-blue-200 text-lg">Ready to manage your epic academic journey?</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                        ${this.renderDashboardCards()}
                    </div>

                    <div id="content-area" class="bg-white bg-opacity-10 backdrop-blur-md p-8 rounded-xl">
                        <div class="text-center text-blue-200">
                            <div class="text-6xl mb-4">🚀</div>
                            <h3 class="text-2xl font-bold mb-2">Choose Your Adventure!</h3>
                            <p>Select a feature from the cards above to begin your epic academic quest.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindDashboardEvents();
    }

    renderDashboardCards() {
        const baseCards = `
            <div class="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-xl cursor-pointer hover:scale-105 transition-transform" data-action="load-profile">
                <div class="text-4xl mb-4">👤</div>
                <h3 class="text-xl font-bold mb-2">Profile Gamer</h3>
                <p class="text-blue-100">View and edit your epic profile details</p>
            </div>
        `;

        if (this.currentUser.role === 'mahasiswa') {
            return baseCards + `
                <div class="bg-gradient-to-r from-green-500 to-blue-600 p-6 rounded-xl cursor-pointer hover:scale-105 transition-transform" data-action="load-my-grades">
                    <div class="text-4xl mb-4">📊</div>
                    <h3 class="text-xl font-bold mb-2">My Epic Scores</h3>
                    <p class="text-green-100">Check your legendary academic achievements</p>
                </div>
                
                <div class="bg-gradient-to-r from-purple-500 to-pink-600 p-6 rounded-xl cursor-pointer hover:scale-105 transition-transform">
                    <div class="text-4xl mb-4">📅</div>
                    <h3 class="text-xl font-bold mb-2">Schedule Quest</h3>
                    <p class="text-purple-100">View your class schedule and missions</p>
                </div>
            `;
        } else if (this.currentUser.role === 'admin') {
            return baseCards + `
                <div class="bg-gradient-to-r from-red-500 to-orange-600 p-6 rounded-xl cursor-pointer hover:scale-105 transition-transform" data-action="load-all-grades">
                    <div class="text-4xl mb-4">👑</div>
                    <h3 class="text-xl font-bold mb-2">All Player Scores</h3>
                    <p class="text-red-100">Manage all student grades (Admin Only)</p>
                </div>
                
                <div class="bg-gradient-to-r from-yellow-500 to-red-600 p-6 rounded-xl cursor-pointer hover:scale-105 transition-transform">
                    <div class="text-4xl mb-4">🏆</div>
                    <h3 class="text-xl font-bold mb-2">Admin Panel</h3>
                    <p class="text-yellow-100">Manage system settings and users</p>
                </div>
            `;
        } else {
            return baseCards + `
                <div class="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-xl cursor-pointer hover:scale-105 transition-transform">
                    <div class="text-4xl mb-4">📚</div>
                    <h3 class="text-xl font-bold mb-2">My Classes</h3>
                    <p class="text-indigo-100">Manage your teaching assignments</p>
                </div>
                
                <div class="bg-gradient-to-r from-teal-500 to-blue-600 p-6 rounded-xl cursor-pointer hover:scale-105 transition-transform">
                    <div class="text-4xl mb-4">📝</div>
                    <h3 class="text-xl font-bold mb-2">Grade Students</h3>
                    <p class="text-teal-100">Input and manage student grades</p>
                </div>
            `;
        }
    }

    bindDashboardEvents() {
        // Bind action events
        document.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (action) {
                this.handleDashboardAction(action);
            }
        });
    }

    handleDashboardAction(action) {
        switch (action) {
            case 'logout':
                this.logout();
                break;
            case 'load-profile':
                this.loadProfile();
                break;
            case 'load-my-grades':
                this.loadMyGrades();
                break;
            case 'load-all-grades':
                this.loadGrades();
                break;
        }
    }

    loadProfile() {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="text-center">
                <h2 class="text-3xl font-bold mb-8 text-yellow-400">🎮 Player Profile</h2>
                
                <div class="bg-white bg-opacity-20 p-8 rounded-xl max-w-md mx-auto">
                    <div class="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span class="text-white font-bold text-3xl">🎯</span>
                    </div>
                    
                    <div class="space-y-4 text-left">
                        <div>
                            <label class="block text-sm font-medium text-blue-200 mb-1">Player Name</label>
                            <div class="bg-white bg-opacity-10 p-3 rounded-lg">${this.currentUser.nama}</div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-blue-200 mb-1">Username</label>
                            <div class="bg-white bg-opacity-10 p-3 rounded-lg">${this.currentUser.username}</div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-blue-200 mb-1">Player Class</label>
                            <div class="bg-white bg-opacity-10 p-3 rounded-lg">${this.currentUser.role.toUpperCase()}</div>
                        </div>
                        
                        ${this.currentUser.nim ? `
                        <div>
                            <label class="block text-sm font-medium text-blue-200 mb-1">Player ID (NIM)</label>
                            <div class="bg-white bg-opacity-10 p-3 rounded-lg">${this.currentUser.nim}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    displayMyGrades(grades) {
        const contentArea = document.getElementById('content-area');
        if (!grades || grades.length === 0) {
            contentArea.innerHTML = `
                <div class="text-center">
                    <h2 class="text-3xl font-bold mb-8 text-yellow-400">📊 My Epic Scores</h2>
                    <div class="text-blue-200">
                        <div class="text-6xl mb-4">😅</div>
                        <p>No grades found. Time to start your academic adventure!</p>
                    </div>
                </div>
            `;
            return;
        }

        const gradesHtml = grades.map(grade => `
            <div class="bg-white bg-opacity-20 p-6 rounded-xl">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-bold text-yellow-400">${grade.matakuliah}</h3>
                    <span class="bg-green-500 text-white px-3 py-1 rounded-full font-bold">${grade.nilai}</span>
                </div>
                
                <div class="space-y-2 text-sm text-blue-200">
                    <p><strong>Semester:</strong> ${grade.semester}</p>
                    <p><strong>SKS:</strong> ${grade.sks}</p>
                    <p><strong>Dosen:</strong> ${grade.dosen}</p>
                    <p><strong>Last Update:</strong> ${new Date(grade.tanggal_update).toLocaleDateString('id-ID')}</p>
                    ${grade.komentar ? `<p><strong>Comments:</strong> ${grade.komentar}</p>` : ''}
                </div>
            </div>
        `).join('');

        contentArea.innerHTML = `
            <div>
                <h2 class="text-3xl font-bold mb-8 text-yellow-400 text-center">📊 My Epic Academic Scores</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${gradesHtml}
                </div>
            </div>
        `;
    }

    displayGrades(grades) {
        const contentArea = document.getElementById('content-area');
        if (!grades || grades.length === 0) {
            contentArea.innerHTML = `
                <div class="text-center">
                    <h2 class="text-3xl font-bold mb-8 text-yellow-400">👑 All Player Scores</h2>
                    <div class="text-blue-200">
                        <div class="text-6xl mb-4">📋</div>
                        <p>No grades found in the system.</p>
                    </div>
                </div>
            `;
            return;
        }

        const gradesHtml = grades.map(grade => `
            <div class="bg-white bg-opacity-20 p-6 rounded-xl">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-bold text-yellow-400">${grade.matakuliah}</h3>
                        <p class="text-blue-300">NIM: ${grade.nim}</p>
                    </div>
                    <span class="bg-green-500 text-white px-3 py-1 rounded-full font-bold">${grade.nilai}</span>
                </div>
                
                <div class="space-y-2 text-sm text-blue-200">
                    <p><strong>Semester:</strong> ${grade.semester}</p>
                    <p><strong>SKS:</strong> ${grade.sks}</p>
                    <p><strong>Dosen:</strong> ${grade.dosen}</p>
                    <p><strong>Last Update:</strong> ${new Date(grade.tanggal_update).toLocaleDateString('id-ID')}</p>
                    ${grade.komentar ? `<p><strong>Comments:</strong> ${grade.komentar}</p>` : ''}
                </div>
            </div>
        `).join('');

        contentArea.innerHTML = `
            <div>
                <h2 class="text-3xl font-bold mb-8 text-yellow-400 text-center">👑 All Player Scores (Admin View)</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${gradesHtml}
                </div>
            </div>
        `;
    }

    showUnauthorizedMessage(message) {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="text-center">
                <div class="text-red-400 text-6xl mb-4">🚫</div>
                <h2 class="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
                <p class="text-blue-200">${message}</p>
                <div class="mt-6">
                    <button data-action="load-profile" class="bg-blue-500 hover:bg-blue-400 px-6 py-2 rounded-lg font-medium transition-colors">
                        Back to Profile
                    </button>
                </div>
            </div>
        `;
    }

    // Utility methods
    showLoading(message = 'Loading...') {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.querySelector('p').textContent = message;
            loadingEl.classList.remove('hidden');
        }
    }

    hideLoading() {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.classList.add('hidden');
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelectorAll('.notification');
        existing.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification fixed top-4 right-4 p-4 rounded-lg text-white font-medium z-50 transform translate-x-full transition-transform duration-300 ${
            type === 'error' ? 'bg-red-500' : 
            type === 'success' ? 'bg-green-500' : 
            'bg-blue-500'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // Auto remove
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize the application
const app = new SIAKADApp();

// Expose app to global scope for debugging
window.app = app;
window.SIAKADApp = SIAKADApp;