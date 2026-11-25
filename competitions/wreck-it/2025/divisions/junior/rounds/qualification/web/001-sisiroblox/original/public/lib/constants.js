// public/lib/constants.js
// Universitas Roblox - Configuration Constants
// The Most Based Academic System Ever Created

const APP_CONFIG = {
    name: 'SIAKAD Roblox',
    fullName: 'Sistem Informasi Akademik Universitas Roblox',
    version: '1.33.7',
    university: 'Universitas Roblox',
    motto: 'Oof Together, Strong Together',
    year: '2024',
    apiBaseUrl: '/api',
    tokenExpiry: 8 * 60 * 60 * 1000, // 8 hours
    
    // Configuration
    jwtSecret: 'r0bl0x_n00b_h4x0r_g3t_r3kt_m8_42069',
    debug: false
};

const ENDPOINTS = {
    // Authentication
    login: '/api/auth/login',
    register: '/api/auth/register',
    profile: '/api/user/profile',
    
    // Academic data
    grades: '/api/grades',
    myGrades: '/api/grades/my',
    stats: '/api/stats',
    
    // System
    health: '/api/health'
};

const USER_ROLES = {
    MAHASISWA: 'mahasiswa',
    DOSEN: 'dosen', 
    ADMIN: 'admin'
};

const GRADE_VALUES = {
    A: { value: 4.0, label: 'A (Sangat Baik)', color: 'green' },
    'A-': { value: 3.7, label: 'A- (Sangat Baik)', color: 'green' },
    'B+': { value: 3.3, label: 'B+ (Baik)', color: 'yellow' },
    B: { value: 3.0, label: 'B (Baik)', color: 'yellow' },
    'B-': { value: 2.7, label: 'B- (Baik)', color: 'yellow' },
    'C+': { value: 2.3, label: 'C+ (Cukup)', color: 'orange' },
    C: { value: 2.0, label: 'C (Cukup)', color: 'orange' },
    D: { value: 1.0, label: 'D (Kurang)', color: 'red' },
    E: { value: 0.0, label: 'E (Gagal)', color: 'red' }
};

const SEMESTERS = {
    GANJIL: 'Ganjil',
    GENAP: 'Genap'
};

const ACADEMIC_YEAR = '2024/2025';

const ROBLOX_FACTS = [
    "Roblox was founded in 2006 by David Baszucki and Erik Cassel.",
    "The name Roblox is a combination of 'robots' and 'blocks'.",
    "Roblox has over 200 million monthly active users.",
    "Developers on Roblox can earn money through the Roblox Developer Exchange program.",
    "The most popular game on Roblox is Adopt Me!, with over 20 billion visits.",
    "Roblox is available on PC, mobile, and Xbox One.",
    "The Roblox logo is called the 'Roblox icon' and represents infinite possibilities.",
    "Roblox uses the programming language Lua for game development.",
    "The first version of Roblox was called DynaBlocks.",
    "Roblox went public on the New York Stock Exchange in March 2021."
];

// Expose to global scope
window.APP_CONFIG = APP_CONFIG;
window.ENDPOINTS = ENDPOINTS;
window.USER_ROLES = USER_ROLES;
window.GRADE_VALUES = GRADE_VALUES;
window.SEMESTERS = SEMESTERS;
window.ACADEMIC_YEAR = ACADEMIC_YEAR;
window.ROBLOX_FACTS = ROBLOX_FACTS;