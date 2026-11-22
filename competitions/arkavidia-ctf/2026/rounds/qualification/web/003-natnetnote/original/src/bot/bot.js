const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto'); 
const { config } = require('process');

const CONFIG = {
    APPNAME: process.env['APPNAME'] || "Admin",
    APPURL: process.env['APPURL'] || "http://172.17.0.1",
    APPURLREGEX: process.env['APPURLREGEX'] || "^.*$",
    APPLIMITTIME: Number(process.env['APPLIMITTIME'] || "60000"),
    APPLIMIT: Number(process.env['APPLIMIT'] || "5"),
    APPBROWSER: process.env['BROWSER'] || 'chromium',
    APPEXTENSIONS: (()=>{
        const extDir = path.resolve(__dirname, 'extensions');
        if (!fs.existsSync(extDir)) {
            console.log('[BOT] Extension directory not found:', extDir);
            return "";
        }

        const dirs = fs.readdirSync(extDir).filter((file) => {
            const fullPath = path.join(extDir, file);
            return fs.lstatSync(fullPath).isDirectory();
        });

        const allExt = dirs
            .map((dir) => path.join(extDir, dir))
            .map((p) => path.resolve(p))
            .join(',');

        console.info(`[BOT] Loaded extensions: ${allExt}`);
        return allExt;
    })()
};

console.table(CONFIG);

function sleep(s) {
    return new Promise((resolve) => setTimeout(resolve, s));
}

const browserArgs = {
    channel: 'chromium',
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-background-networking',
        '--disable-features=site-per-process',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        ...(()=>{
            if (CONFIG.APPEXTENSIONS) {
                return [
                    `--disable-extensions-except=${CONFIG.APPEXTENSIONS}`,
                    `--load-extension=${CONFIG.APPEXTENSIONS}`,
                ]
            }
            else {
                return [
                '--disable-extensions',
                '--disable-translate',
                '--js-flags=--jitless,--noexpose_wasm',
                ]
            } 
        })()
    ]
}

async function launchBrowserWithExtension(options) {
    const USER_DATA_DIR = path.join('/tmp', `tmp-user-data-${crypto.randomUUID()}`);
    
    if (CONFIG.APPBROWSER === 'chromium') {
        const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
            ...options,
            ignoreHTTPSErrors: true
        });
        return context;
    } else if (CONFIG.APPBROWSER === 'firefox') {
        const context = await firefox.launchPersistentContext(USER_DATA_DIR, {
            ...options,
            ignoreHTTPSErrors: true
        });
        return context;
    } else {
        throw new Error("Unsupported browser type");
    }
}

async function launchSharedBrowser(options) {
    if (CONFIG.APPBROWSER === 'firefox') {
        return await firefox.launch(options);
    } else {
        return await chromium.launch(options);
    }
}

/** @type {import('playwright').Browser} */
let sharedBrowser = null;

async function getContext() {
    if (CONFIG.APPEXTENSIONS) {
        return await launchBrowserWithExtension(browserArgs);
    }
    
    if (!sharedBrowser) {
        sharedBrowser = await launchSharedBrowser({
            ...browserArgs,
            ignoreHTTPSErrors: true
        });
    }

    return await sharedBrowser.newContext({ ignoreHTTPSErrors: true });
}

console.log("[BOT] Bot started...");

module.exports = {
    name: CONFIG.APPNAME,
    urlRegex: CONFIG.APPURLREGEX,
    rateLimit: {
        windowMs: Number(CONFIG.APPLIMITTIME) * 1000,
        limit: Number(CONFIG.APPLIMIT)
    },
    bot: async (urlToVisit, token) => {
        const context = await getContext();
        try {
            const page = await context.newPage();
            await context.addCookies([{
                name: "token",
                httpOnly: true,
                value: token,
                url: CONFIG.APPURL
            }]);

            console.log(`[BOT] bot visiting ${urlToVisit}`);
            await page.goto(urlToVisit, {
                waitUntil: 'load',
                timeout: 10 * 1000
            });
            await sleep(15000);

            console.log("browser close...");
            return true;
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            if (CONFIG.APPEXTENSIONS) {
                await context.browser().close();    
                try {
                    const userDataDir = context._options.userDataDir;
                    if (userDataDir && fs.existsSync(userDataDir)) {
                        fs.rmSync(userDataDir, { recursive: true, force: true });
                    }
                } catch (cleanupError) {
                    console.log('Error cleaning up user data:', cleanupError.message);
                }
            } else {
                await context.close();
            }
        }
    }
};