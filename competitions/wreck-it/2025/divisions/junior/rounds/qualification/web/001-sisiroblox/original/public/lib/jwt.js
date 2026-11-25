// lib/jwt.js
// Universitas Roblox - JWT Utilities
// Epic Gamer Authentication System v1.33.7

const JWT_SECRET = 'r0bl0x_n00b_h4x0r_g3t_r3kt_m8_42069';
const secret = new TextEncoder().encode(JWT_SECRET);

// Base64URL encoding/decoding utilities
function base64urlEncode(str) {
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function base64urlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
        str += '=';
    }
    return atob(str);
}

// JWT payload interface untuk dokumentasi TypeScript-style
/**
 * @typedef {Object} JWTPayload
 * @property {string} userId - User ID
 * @property {string} username - Username  
 * @property {string} role - User role (mahasiswa/dosen/admin)
 * @property {string} nim - NIM atau NIP
 * @property {string} nama - Nama lengkap
 * @property {number} iat - Issued at timestamp
 * @property {number} exp - Expiration timestamp
 */

// Generate JWT token dengan HMAC-SHA256 signature
async function generateToken(payload) {
    const header = { alg: 'HS256', typ: 'JWT' };
    
    const encodedHeader = base64urlEncode(JSON.stringify(header));
    const encodedPayload = base64urlEncode(JSON.stringify(payload));
    const data = encodedHeader + '.' + encodedPayload;
    
    const signature = await createSignature(data, JWT_SECRET);
    return data + '.' + signature;
}

// Verify JWT token
async function verifyToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Format token tidak valid');
        
        const [header, payload, signature] = parts;
        const data = header + '.' + payload;
        const expectedSignature = await createSignature(data, JWT_SECRET);
        
        if (signature !== expectedSignature) {
            throw new Error('Signature tidak valid');
        }
        
        const decodedPayload = JSON.parse(base64urlDecode(payload));
        
        // Check expiration
        if (decodedPayload.exp && Date.now() >= decodedPayload.exp * 1000) {
            throw new Error('Token sudah expired');
        }
        
        return decodedPayload;
    } catch (error) {
        throw new Error('Token tidak valid: ' + error.message);
    }
}

// Decode JWT payload tanpa verifikasi (untuk debugging)
function decodeJWTPayload(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const payload = JSON.parse(base64urlDecode(parts[1]));
        return payload;
    } catch (error) {
        console.error('Gagal decode JWT:', error);
        return null;
    }
}

// HMAC-SHA256 signature creation
async function createSignature(data, key) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(data);
    
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const signatureArray = new Uint8Array(signature);
    
    // Convert ke base64url
    let binaryString = '';
    for (let i = 0; i < signatureArray.length; i++) {
        binaryString += String.fromCharCode(signatureArray[i]);
    }
    
    return btoa(binaryString)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// Manual JWT creation function (ekspos untuk "debugging")
async function createJWT(payload) {
    const header = { alg: 'HS256', typ: 'JWT' };
    
    const encodedHeader = base64urlEncode(JSON.stringify(header));
    const encodedPayload = base64urlEncode(JSON.stringify(payload));
    const data = encodedHeader + '.' + encodedPayload;
    const signature = await createSignature(data, JWT_SECRET);
    
    return data + '.' + signature;
}

// VULNERABILITY: Export secret untuk debugging purposes
window.JWT_DEBUG = {
    secret: JWT_SECRET,
    createJWT: createJWT,
    decodeJWT: decodeJWTPayload,
    verifyToken: verifyToken
};

// Export functions ke global scope
window.JWTUtils = {
    generateToken,
    verifyToken,
    decodeJWTPayload,
    createJWT,
    base64urlEncode,
    base64urlDecode
};