// content.js
console.log("🚀 Content script started");

// Prevent double-install (content scripts share DOM so dataset is reliable)
if (document.documentElement.dataset.tabTrackerInjected === "1") {
  console.log("⚠️ content.js already initialized — skipping duplicate init");
} else {
  document.documentElement.dataset.tabTrackerInjected = "1";

  /***********************
   * Visible text capture
   ***********************/
  function getVisibleScreenText() {
    const root =
      document.querySelector("main, [role='main'], article, #content, .main") ||
      document.body;

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const p = node.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          const tag = p.tagName.toUpperCase();
          if (["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "IFRAME"].includes(tag)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      },
      false
    );

    function isRenderedVisible(node) {
      let el = node.parentElement;
      while (el) {
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) {
          return false;
        }
        el = el.parentElement;
      }

      try {
        const range = document.createRange();
        range.selectNodeContents(node);
        const rects = range.getClientRects();
        for (let i = 0; i < rects.length; i++) {
          const r = rects[i];
          if (
            r.width > 0 &&
            r.height > 0 &&
            r.bottom > 0 &&
            r.top < window.innerHeight &&
            r.right > 0 &&
            r.left < window.innerWidth
          ) {
            return true;
          }
        }
        return false;
      } catch (e) {
        console.warn("⚠️ Error while checking node visibility:", e);
        return false;
      }
    }

    const seen = new Set();
    const out = [];
    let n;
    while ((n = walker.nextNode())) {
      if (!isRenderedVisible(n)) continue;
      const txt = n.nodeValue.replace(/\s+/g, " ").trim();
      if (!txt) continue;
      if (!seen.has(txt)) {
        seen.add(txt);
        out.push(txt);
      }
    }

    return out;
  }

  /****************************
   * Send data helper + dedupe
   ****************************/
  let lastSentKey = null;
  let sendTimeout = null;

  function simpleHash(str) {
    // quick non-crypto hash for dedupe
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return String(h);
  }

  function buildPayload() {
    const visibleBlocks = getVisibleScreenText();
    const description = document.querySelector('meta[name="description"]')?.content || "";
    const payloadObj = {
      title: document.title || "",
      description,
      visibleText: visibleBlocks.join("\n\n"),
      url: location.href,
      timestamp: Date.now(),
    };
    return payloadObj;
  }

  function sendContentData(debounceMs = 200) {
    if (sendTimeout) clearTimeout(sendTimeout);
    sendTimeout = setTimeout(() => {
      const payload = buildPayload();
      const key = payload.url + "|" + simpleHash(payload.visibleText || payload.title || "");
      if (key === lastSentKey) {
        console.log("🔁 No changes since last send — skipping message for", payload.url);
        return;
      }
      lastSentKey = key;

      try {
        chrome.runtime.sendMessage({
          type: "CONTENT_DATA",
          payload: {
            title: payload.title,
            description: payload.description,
            visibleText: payload.visibleText,
            url: payload.url,
          },
        }, (resp) => {
          // optional: handle response if needed
        });
        console.log("📤 Visible blocks sent for", payload.url);
      } catch (e) {
        console.warn("❌ Failed to send message to background:", e);
      }
    }, debounceMs);
  }

  /*******************************
   * SPA URL-change detection
   *******************************/
  // 1) inject a tiny page script to patch history methods and dispatch 'locationchange'
  //    so we catch pushState/replaceState invoked by the page.
  (function injectHistoryListener() {
    try {
      const script = document.createElement("script");
      script.textContent = `
        (function() {
          if (window.__tabTrackerHistoryPatched) return;
          window.__tabTrackerHistoryPatched = true;
          const _push = history.pushState;
          const _replace = history.replaceState;
          function dispatchLocationChange() {
            window.dispatchEvent(new Event('locationchange'));
          }
          history.pushState = function() {
            _push.apply(this, arguments);
            dispatchLocationChange();
          };
          history.replaceState = function() {
            _replace.apply(this, arguments);
            dispatchLocationChange();
          };
          window.addEventListener('popstate', dispatchLocationChange);
        })();
      `;
      // add + remove quickly (we don't want this script to persist in DOM)
      (document.head || document.documentElement).appendChild(script);
      script.parentNode.removeChild(script);
    } catch (e) {
      console.warn("⚠️ Could not inject history patcher:", e);
    }
  })();

  // 2) listen for locationchange (dispatched by page-patched script), popstate and hashchange
  window.addEventListener("locationchange", () => {
    console.log("🔁 locationchange event detected (history API)");
    sendContentData();
  });

  window.addEventListener("popstate", () => {
    console.log("🔁 popstate detected");
    sendContentData();
  });

  window.addEventListener("hashchange", () => {
    console.log("🔁 hashchange detected");
    sendContentData();
  });

  // 3) fallback polling (in case page uses weird navigation without history API)
  let lastHref = location.href;
  const pollInterval = 1000; // 1s — light but responsive
  const pollId = setInterval(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      console.log("🔁 URL changed (poller) to", lastHref);
      sendContentData();
    }
  }, pollInterval);

  // Optional: stop polling after a long time if you prefer — left running for reliability

  /*******************************
   * DOM readiness & initial send
   *******************************/
  function onReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    }
  }

  onReady(() => {
    // initial send once DOM is mounted
    sendContentData(0);
  });

  /*******************************
   * Expose a small API for debugging (optional)
   *******************************/
  try {
    window.__tabTracker = window.__tabTracker || {};
    window.__tabTracker.sendNow = () => sendContentData(0);
    window.__tabTracker.stopPoll = () => clearInterval(pollId);
  } catch (e) {
    // ignore if page blocks it
  }
}
