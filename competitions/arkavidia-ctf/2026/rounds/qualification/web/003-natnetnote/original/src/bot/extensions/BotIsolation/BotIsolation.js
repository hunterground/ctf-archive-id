let tabBlocklist = {};
let verifiedTab = {};

console.log('[BOT-EXT] CHECK CHECK')

function isAllowedHost(hostname) {
  const host = hostname.trim().toLowerCase();
  
  // Bot is contained in the frontend
  if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host === 'frontend') {
    return true;
  }
  return false
}

function checkUrlIsAllowed(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    
    return isAllowedHost(host);
  } catch (e) {
    return false;
  }
}

function checkUrlIsExternal(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    
    if (host.includes('.') && 
        !host.endsWith('.localhost') &&
        host !== 'localhost' &&
        !host.match(/^[0-9.]+$/) &&
        !host.endsWith('.internal') &&
        !host.endsWith('.local')) {
      return true;
    }
    
    return false;
  } catch (e) {
    return false;
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.url &&
    !changeInfo.url.startsWith("chrome://") &&
    (changeInfo.url.startsWith("http://") ||
      changeInfo.url.startsWith("https://"))
  ) {
    (async () => {
      if (checkUrlIsExternal(tab.url)) {
        console.log(`[EXT] Blocking external navigation to: ${tab.url}`);
        tabBlocklist[tabId] = true;
        await chrome.tabs.remove(tab.id);
        return;
      }
      
      if (!checkUrlIsAllowed(tab.url) && !tabBlocklist[tabId] && !verifiedTab[tabId]) {
        console.log(`[EXT] Blocking disallowed URL: ${tab.url}`);
        tabBlocklist[tabId] = true;
        await chrome.tabs.remove(tab.id);
      } else {
        verifiedTab[tabId] = true;
      }
    })();
  }
});


chrome.runtime.onInstalled.addListener(() => {
  console.log("[EXT] Bot isolation installed");
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (checkUrlIsExternal(tab.url)) {
        console.log(`[EXT] Initial cleanup - blocking: ${tab.url}`);
        chrome.tabs.remove(tab.id);
      }
    }
  });
});