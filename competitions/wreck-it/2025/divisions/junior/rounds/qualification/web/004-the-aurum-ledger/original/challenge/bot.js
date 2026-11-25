const puppeteer = require('puppeteer');

const browser_options = {
    headless: true,
    // Use system Chrome installed by Dockerfile to avoid missing libs for bundled Chromium
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome-stable',
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-gpu',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-first-run',
        '--safebrowsing-disable-auto-update'
    ]
};

async function purgeData(db){
    const browser = await puppeteer.launch(browser_options);
    const page = await browser.newPage();

    // Bridge browser console to container logs
    page.on('console', msg => {
        try { console.log('[BOT][console]', msg.type(), msg.text()); } catch(_) {}
    });
    page.on('pageerror', err => {
        try { console.log('[BOT][pageerror]', err.message); } catch(_) {}
    });

    // Log all network requests for debugging/exfil visibility
    page.on('request', req => {
        try { console.log('[BOT] request:', req.method(), req.url()); } catch(_) {}
    });
    page.on('requestfinished', req => {
        try { console.log('[BOT] finished:', req.method(), req.url()); } catch(_) {}
    });

    await page.goto('http://127.0.0.1:1337/list', { waitUntil: 'networkidle2' });
    // Allow any client-side payload to run (Angular load + sync XHR + redirect)
    // If payload performs a top-level redirect (e.g., to webhook), wait for it.
    // Debug: check whether payload is present and Angular loads
    try {
        const html = await page.content();
        console.log('[BOT] Contains ng-app:', html.includes('ng-app'));
        console.log('[BOT] Contains angular cdn tag:', html.includes('cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.19/angular.min.js'));
        // Try to wait for window.angular to exist (Angular loaded)
        await page.waitForFunction('window.angular !== undefined', { timeout: 10000 });
        console.log('[BOT] Angular detected on window');
    } catch (e) {
        console.log('[BOT] Angular not detected or payload missing');
    }

    try {
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 });
    } catch(e) {
        // No navigation occurred within 10s; continue
    }
    // Log final URL for debugging
    try { console.log('[BOT] Final URL:', page.url()); } catch(_) {}
    // Small grace period to ensure outbound request flushes
    await page.waitForTimeout(3000);

    await browser.close();
    await db.migrate();
};

module.exports = { purgeData };