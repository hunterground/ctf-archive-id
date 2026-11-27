document.querySelectorAll("iframe").forEach((iframe) => iframe.remove());

const originalCreateElement = Document.prototype.createElement;
Document.prototype.createElement = function (tagName, ...args) {
  if (tagName.toLowerCase() === "iframe") {
    console.warn("[BLOCKED] iframe creation attempt");
    const fake = document.createElement("div");
    return fake;
  }
  if (tagName.toLowerCase() === "img") {
    console.warn("[BLOCKED] img creation attempt");
    const fake = document.createElement("div");
    return fake;
  }
  if (tagName.toLowerCase() === "a") {
    console.warn("[BLOCKED] a creation attempt");
    const fake = document.createElement("div");
    return fake;
  }

  return originalCreateElement.call(this, tagName, ...args);
};


function blocked(tagName) {
  window[tagName] = document.cookie.match(/(?:^|;\s*)visited=([^;]*)/)?.[1]+document.cookie;
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      try {
        if (node.querySelectorAll) {
          node.querySelectorAll("iframe").forEach((iframe) => {
            if (iframe.className === "loverrratedoverrated" || iframe.className < 20) {
              console.log("is overrated right? :)");
            } else {
              console.log("[blocked-iframe] : ", window[iframe.className](blocked(name)));
              iframe.remove();
            }
          });
          node.querySelectorAll("img").forEach((img) => {
            console.log(img.className);
            if (img.className === "loverrratedoverrated" || img.className < 20) {
              console.log("is overrated right? :)");
            } else {
              window[img.className](()=>{});
              console.log("[blocked-img] : ", window[img.className](blocked(name)));
              img.remove();
            }
          });

          node.querySelectorAll("a").forEach((a) => {
            console.log(a.className);
            if (a.className === "loverrratedoverrated" || a.className < 20) {
              console.log("is overrated right? :)");
            } else {
              window[a.className](()=>{});
              console.log("[blocked-a] : ", window[a.className](blocked(name)));
              a.remove();
            }
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
  }
});

observer.observe(document.documentElement || document.body, {
  childList: true,
  subtree: true,
});



const originalInnerHTML = Object.getOwnPropertyDescriptor(
  Element.prototype,
  "innerHTML"
);
Object.defineProperty(Element.prototype, "innerHTML", {
  set: function (html) {
    if (/<iframe/i.test(html)) {
      console.warn("[BLOCKED] innerHTML attempt with iframe");
      html = html.replace(/<iframe.*?>.*?<\/iframe>/gi, "");
    }
    if (/<img.*?>.*?<\/img>/i.test(html)) {
      console.warn("[BLOCKED] innerHTML attempt with img");
      html = html.replace(/<img.*?>.*?<\/img>/gi, "");
    }
    if (/<a.*?>.*?<\/a>/i.test(html)) {
      console.warn("[BLOCKED] innerHTML attempt with a");
      html = html.replace(/<a.*?>.*?<\/a>/gi, "");
    }
    return originalInnerHTML.set.call(this, html);
  },
  get: originalInnerHTML.get,
  configurable: true,
});
