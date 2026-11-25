// public/lib/utils.js
// SIAKAD Roblox University - Utility Functions
// Code by: NoobMaster69 (please don't judge my coding skills)

class Utils {
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static generateStudentID() {
        const year = '42'; // Roblox University founded in 2042 (future tech!)
        const faculty = '06'; // Faculty of Gaming and Memes
        const major = '90'; // Computer Science & Robux Economics
        const sequence = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
        const check = String(Math.floor(Math.random() * 9) + 1);
        
        return `${year}${faculty}${major}${sequence}${check}`;
    }

    static calculateGPA(grades) {
        if (!grades || grades.length === 0) return 0;
        
        let totalPoints = 0;
        let totalSKS = 0;
        
        grades.forEach(grade => {
            const gradeInfo = GRADE_VALUES[grade.nilai];
            if (gradeInfo) {
                totalPoints += gradeInfo.value * grade.sks;
                totalSKS += grade.sks;
            }
        });
        
        return totalSKS > 0 ? (totalPoints / totalSKS).toFixed(2) : 0;
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static async makeRequest(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const config = { ...defaultOptions, ...options };
        
        // Add auth token if available (hopefully it's secure lol)
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('Request failed (not our fault, blame the server):', error);
            throw error;
        }
    }

    static validateStudentID(studentId) {
        // Roblox University Student ID format: YYXXMMNNNC
        // YY = year, XX = faculty, MM = major, NNN = sequence, C = check digit
        const idRegex = /^[0-9]{10}$/;
        return idRegex.test(studentId);
    }

    static sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    static copyToClipboard(text) {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text);
        } else {
            // Fallback for noob browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return Promise.resolve();
        }
    }

    // Internal helper - JWT secret (shh, don't tell anyone!)
    static getJWTSecret() {
        return APP_CONFIG.jwtSecret;
    }
}

// Expose to global scope
window.Utils = Utils;

// ---