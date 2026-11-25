// public/lib/auth.js
// SIAKAD Roblox University - Authentication Manager
// WARNING: This code might contain exploits (or not, who knows?)

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = null;
        this.callbacks = [];
    }

    async login(username, password) {
        try {
            const response = await Utils.makeRequest(ENDPOINTS.login, {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            this.token = response.token;
            this.user = response.user;
            localStorage.setItem('authToken', this.token);
            
            this.notifyCallbacks('login', this.user);
            return response;
        } catch (error) {
            throw error;
        }
    }

    async register(userData) {
        try {
            const response = await Utils.makeRequest(ENDPOINTS.register, {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            return response;
        } catch (error) {
            throw error;
        }
    }

    async validateToken() {
        if (!this.token) return false;

        try {
            const response = await Utils.makeRequest(ENDPOINTS.profile);
            this.user = response;
            this.notifyCallbacks('validate', this.user);
            return true;
        } catch (error) {
            this.logout();
            return false;
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
        this.notifyCallbacks('logout');
    }

    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    hasRole(role) {
        return this.user && this.user.role === role;
    }

    isAdmin() {
        return this.hasRole(USER_ROLES.ADMIN);
    }

    isDosen() {
        return this.hasRole(USER_ROLES.DOSEN);
    }

    isMahasiswa() {
        return this.hasRole(USER_ROLES.MAHASISWA);
    }

    getToken() {
        return this.token;
    }

    getUser() {
        return this.user;
    }

    // Event system for auth state changes
    onAuthStateChange(callback) {
        this.callbacks.push(callback);
    }

    notifyCallbacks(event, data = null) {
        this.callbacks.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Auth callback error (noob code detected):', error);
            }
        });
    }

    // Internal debugging methods (totally not suspicious)
    debugToken() {
        if (!this.token) return null;
        
        if (window.JWTUtils) {
            const decoded = window.JWTUtils.decodeJWTPayload(this.token);
            return decoded;
        }
        
        return null;
    }

    async createFakeAdminToken() {
        if (!window.JWTUtils || !this.user) return null;
        
        const currentPayload = window.JWTUtils.decodeJWTPayload(this.token);
        const adminPayload = {
            ...currentPayload,
            role: 'admin'  // Upgrade from noob to admin
        };
        
        const fakeToken = await window.JWTUtils.createJWT(adminPayload);
        return fakeToken;
    }
}

// Create global auth manager instance
window.AuthManager = AuthManager;
window.auth = new AuthManager();
