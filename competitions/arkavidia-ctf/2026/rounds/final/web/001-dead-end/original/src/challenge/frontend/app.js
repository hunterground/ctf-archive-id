const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); 

const BACKEND = { host: 'backend', port: 5555 };

function pushToCore(path, payload, options = {}) {
    return new Promise((resolve, reject) => {
        const requestBody = typeof payload === 'object' ? JSON.stringify(payload) : (payload || '');
        
        const reqConfig = {
            hostname: BACKEND.host,
            port: BACKEND.port,
            path: path,
            method: 'POST',
            headers: Object.assign({
                'Content-Type': 'application/json',
                'X-Proxy-Service': 'frontend-gateway'
            }, options.headers || {})
        };
        
        const req = http.request(reqConfig, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch {
                    resolve({ status: "error", raw: data });
                }
            });
        });
        
        req.setTimeout(3000, () => {
            req.abort();
            reject(new Error("Core engine timeout"));
        });
        
        req.on('error', (e) => {
            console.error("[PROXY ERROR] Request failed:", e.message);
            reject(e);  
        });
        
        if (requestBody) {
            req.write(requestBody);
        }
        req.end();
    });
}

// --- ROUTES ---

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const response = await pushToCore('/v1/auth/login', { username, password });
        res.status(response.status === "success" ? 200 : 401).json(response);
    } catch (err) {
        res.status(502).json({ status: "error", message: 'Login service unavailable' });
    }
});

app.post('/activate', async (req, res) => {
    try {
        const { username, token } = req.body;
        const response = await pushToCore('/v1/auth/activate', { username, token });
        res.json(response);
    } catch (err) {
        res.status(502).json({ status: "error", message: 'Activation service unavailable' });
    }
});

app.post('/debug', async (req, res) => {
    const { payload, trace_options, access_token } = req.body; 
    
    try {
        const options = trace_options || {};
        options.headers = options.headers || {};

        if (access_token) {
            options.headers['Authorization'] = `Bearer ${access_token}`;
        }

        const response = await pushToCore('/v1/debug', payload, options);
        res.json(response);
    } catch (err) {
        res.status(502).json({ status: "error", message: 'Bad Gateway Error' });
    }
});

app.post('/digest', async (req, res) => {
    try {
        const { username, script, access_token } = req.body;
        
        if (!access_token) {
            return res.status(401).json({ status: "error", message: 'Missing access_token' });
        }
        
        const options = { headers: { 'Authorization': `Bearer ${access_token}` } };
        const response = await pushToCore('/v1/digest', { username, script }, options);
        res.json(response);
        
    } catch (err) {
        res.status(502).json({ status: "error", message: 'Digest service unavailable' });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Gateway service running on port ${PORT}`));