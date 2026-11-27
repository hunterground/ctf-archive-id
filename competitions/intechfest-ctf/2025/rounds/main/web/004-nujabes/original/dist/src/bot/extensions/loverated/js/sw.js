chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    const headers = details.responseHeaders.filter(
      (h) => h.name.toLowerCase() !== "content-security-policy"
    );
    headers.push({
      name: "Content-Security-Policy",
      value: "default-src 'self'; script-src 'self'; object-src 'none';",
    });
    return { responseHeaders: headers };
  },
  { urls: ["<all_urls>"] },
  ["blocking", "responseHeaders"]
);

chrome.runtime.onStartup.addListener(() => {
  console.log("[EXT] Ready");
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("[EXT] onInstalled triggered");

  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      console.log("Tab:", tab.title || "(no title)");
    }
  });
});

cookie = "";

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    console.log(`[EXT] Tab ${tabId} finished loading: ${tab.url}`);
    if (tab.url && tab.url.includes("localhost:1337")) {
      chrome.cookies.getAll({ domain: "localhost" }, (cookies) => {
        console.log("[EXT] Cookies from localhost:", cookies);
        const cookieString = cookies
          .map((c) => `${c.name}=${c.value}`)
          .join("; ");
        console.log("[EXT] Cookie string:", cookieString);
      });
    }
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        const isDirectoryListing = document.body.innerText.includes("Index of");
        if (isDirectoryListing) {
          console.log("[EXT] Detected directory listing");
          chrome.runtime.sendMessage({ type: "close-tab" });
        } else {
          console.log("[EXT] File page or not a typical directory listing");
        }
      },
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "close-tab" && sender.tab?.id) {
    console.log(
      `[EXT] Closing tab ${sender.tab.id} with url ${sender.tab.url}`
    );
    if (name) {
    }
    chrome.tabs.remove(sender.tab.id);
  }
});
