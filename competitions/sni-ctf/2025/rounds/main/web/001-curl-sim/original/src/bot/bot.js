const puppeteer = require('puppeteer');
const fs = require('fs');
const dns = require('dns').promises;

const CONFIG = {
    APPNAME: process.env['APPNAME'] || "Admin",
    APPURL: process.env['APPURL'] || "http://localhost:3000",
    APPURLREGEX: process.env['APPURLREGEX'] || "^.*$",
    APPFLAG: process.env['APPFLAG'] || "dev{flag}",
    APPLIMITTIME: Number(process.env['APPLIMITTIME'] || "60000"),
    APPLIMIT: Number(process.env['APPLIMIT'] || "5"),
};

console.table(CONFIG);

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const launchOptions = (() => {
    const is_x11_exists = fs.existsSync('/tmp/.X11-unix');
    const headless = !(process.env['DISPLAY'] && is_x11_exists);

    /** @type {import('puppeteer').PuppeteerLaunchOptions} */
    const base = {
        headless,
        browser: 'firefox',
        ignoreHTTPSErrors: true,
        args: [
            "-no-remote",
            "--no-sandbox",
            "--disable-setuid-sandbox",
        ],
    };

    return base;
})();

/** @type {import('puppeteer').Browser | null} */
let browserInstance = null;

async function getBrowser() {
    if (!browserInstance) {
        browserInstance = await puppeteer.launch(launchOptions);
        console.log("[BOT] Firefox browser launched");
    }
    return browserInstance;
}

console.log("Bot started (Puppeteer + Firefox)...");

const ipFlagMap = new Map();

async function getFlagForUrl(urlToVisit) {
    let hostname;
    try {
        hostname = new URL(urlToVisit).hostname;
    } catch {
        hostname = new URL(CONFIG.APPURL).hostname;
    }
    const address = await dns.lookup(hostname).then(res => res.address).catch(() => hostname);
    if (!ipFlagMap.has(address)) {
        const suffix = Math.random().toString(36).substring(2, 8);
        const flag_w = `SNI{xss_w1th_h34d3rs${suffix}_f1ref0x}`;
        ipFlagMap.set(address, flag_w);
        console.log(`[BOT] Assigned new flag ${flag_w} for ${address}`);
    }
    return ipFlagMap.get(address);
}

module.exports = {
    name: CONFIG.APPNAME,
    urlRegex: CONFIG.APPURLREGEX,
    rateLimit: {
        windowMs: Number(CONFIG.APPLIMITTIME),
        limit: Number(CONFIG.APPLIMIT)
    },
    /**
     * @param {string} urlToVisit
     */
    bot: async (urlToVisit) => {
        const browser = await getBrowser();
        const page = await browser.newPage();

        // Debug logs so you can see what’s actually happening
        page.on('console', msg => {
            console.log('[PAGE]', msg.type(), msg.text());
        });

        page.on('request', req => {
            console.log('[REQ]', req.method(), req.url());
        });

        page.on('response', res => {
            console.log('[RES]', res.status(), res.url());
        });

        try {
            const perIpFlag = await getFlagForUrl(urlToVisit);
            await browser.setCookie({
                name: 'flag',
                value: perIpFlag,
                domain: new URL(CONFIG.APPURL).hostname,
                url: CONFIG.APPURL,
                httpOnly: false,
            });



            console.log(`[BOT] Visiting: ${urlToVisit}`);

            await page.goto(urlToVisit, {
                waitUntil: 'domcontentloaded',
                timeout: 30 * 1000,
            });

            console.log('[BOT] Page loaded, waiting for payload...');
            await sleep(15000);

            console.log("[BOT] Done waiting, closing page...");
            await page.close();
            return true;
        } catch (e) {
            console.error('[BOT ERROR]', e);
            try {
                await page.close();
            } catch { }
            return false;
        }
    }
};
