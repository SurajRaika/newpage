// content.js
console.log("🚀 Content script started");

// Prevent double-install (content scripts share DOM so dataset is reliable)
if (document.documentElement.dataset.tabTrackerInjected === "1") {
  console.log("⚠️ content.js already initialized — skipping duplicate init");
} else {
  document.documentElement.dataset.tabTrackerInjected = "1";

  /***********************
   * Configuration
   ***********************/
  const CONFIG = {
    DEBOUNCE_MS: 300,
    SPA_STABILITY_WAIT: 500, // Wait for SPA to stabilize after navigation
    MAX_STABILITY_WAIT: 3000, // Maximum wait time
    POLL_INTERVAL: 2000,
    MIN_TEXT_LENGTH: 50, // Minimum text length to consider page loaded
    MAX_RETRIES: 3
  };


  
  /***********************
   * Utility functions
   ***********************/
  function simpleHash(str) {
    let h = 0;
    if (!str) return "0";
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return String(h);
  }


  function isElementVisible(element) {
    if (!element || !element.offsetParent) return false;
    
    try {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        parseFloat(style.opacity) > 0 &&
        rect.bottom > 0 &&
        rect.top < window.innerHeight &&
        rect.right > 0 &&
        rect.left < window.innerWidth
      );
    } catch (e) {
      return false;
    }
  }

  function waitForStableContent(maxWait = CONFIG.MAX_STABILITY_WAIT) {
    return new Promise((resolve) => {
      let attempts = 0;
      let lastContentHash = null;
      const maxAttempts = Math.ceil(maxWait / 200);

      const checkStability = () => {
        attempts++;
        const currentContent = document.body ? document.body.innerText.substring(0, 1000) : '';
        const currentHash = simpleHash(currentContent);

        // If content hasn't changed from last check, consider it stable
        if (currentHash === lastContentHash && currentContent.length > CONFIG.MIN_TEXT_LENGTH) {
          console.log("📍 Content appears stable, proceeding with capture");
          resolve();
          return;
        }

        lastContentHash = currentHash;

        // If we've reached max attempts or reasonable content exists, resolve
        if (attempts >= maxAttempts || (currentContent.length > CONFIG.MIN_TEXT_LENGTH && attempts >= 3)) {
          console.log(`📍 Content capture proceeding after ${attempts} attempts`);
          resolve();
          return;
        }

        setTimeout(checkStability, 200);
      };

      // Start checking after initial wait
      setTimeout(checkStability, CONFIG.SPA_STABILITY_WAIT);
    });
  }

  /***********************
   * Visible text capture
   ***********************/
  function getVisibleScreenText() {
    try {
      // Wait a moment for DOM to be ready
      if (!document.body) {
        console.warn("⚠️ Document body not ready");
        return [];
      }

      const root =
        document.querySelector("main, [role='main'], article, #content, .content, .main") ||
        document.body;

      if (!root) {
        console.warn("⚠️ No suitable root element found");
        return [];
      }

      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            try {
              if (!node.nodeValue || !node.nodeValue.trim()) {
                return NodeFilter.FILTER_REJECT;
              }
              
              const parent = node.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;
              
              const tagName = parent.tagName?.toUpperCase();
              if (["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "IFRAME", "HEAD"].includes(tagName)) {
                return NodeFilter.FILTER_REJECT;
              }

              // Check if the parent element is visible
              if (!isElementVisible(parent)) {
                return NodeFilter.FILTER_REJECT;
              }

              return NodeFilter.FILTER_ACCEPT;
            } catch (e) {
              console.warn("⚠️ Error in acceptNode:", e);
              return NodeFilter.FILTER_REJECT;
            }
          },
        },
        false
      );

 const seen = new Set();
  const textBlocks = [];
  let node;
 while ((node = walker.nextNode())) {
    try {
      const parent = node.parentElement;
      if (!parent) continue; // Safety check
      
      const text = node.nodeValue.replace(/\s+/g, " ").trim();
      if (text.length < 3) continue;
      
      const elementTag = parent.tagName.toLowerCase(); // Capture the tag name
      
      // Check if we've already seen this text
      if (!seen.has(text)) {
        seen.add(text);
        textBlocks.push({ tag: elementTag, text: text }); // Push an object
      }
    } catch (e) {
      console.warn("⚠️ Error processing text node:", e);
    }
  }


 console.log(`📄 Captured ${textBlocks.length} visible text blocks`);
  return textBlocks;


    } catch (error) {
      console.error("❌ Error in getVisibleScreenText:", error);
      return [];
    }
  }


  /****************************
   * Page data builder
   ****************************/
  function buildPagePayload() {
    try {
      const visibleBlocks = getVisibleScreenText();
      
      const title = document.title || "";
      const description = document.querySelector('meta[name="description"]')?.content || "";


      
      const payload = {
        title: title.trim(),
        description: description.trim(),
        visibleText: visibleBlocks,
        url: location.href,
        timestamp: Date.now(),
        textLength: visibleBlocks.reduce((acc, block) => acc + block.text.length, 0),
        blockCount: visibleBlocks.length
      };

      console.log(`📊 Page payload: ${payload.textLength} chars, ${payload.blockCount} blocks`);
      return payload;

    } catch (error) {
      console.error("❌ Error building page payload:", error);
      return {
        title: document.title || "",
        description: "",
        visibleText: [],
        url: location.href,
        timestamp: Date.now(),
        textLength: 0,
        blockCount: 0,
        error: error.message
      };
    }
  }

  /****************************
   * Send data with retry logic
   ****************************/
  let lastSentKey = null;
  let sendTimeout = null;
  let isNavigating = false;

  function sendContentData(options = {}) {
    const { 
      debounceMs = CONFIG.DEBOUNCE_MS, 
      waitForStability = true,
      retryCount = 0 
    } = options;

    if (sendTimeout) clearTimeout(sendTimeout);
    
    sendTimeout = setTimeout(async () => {
      try {
        // For SPA navigation, wait for content to stabilize
        if (waitForStability && isNavigating) {
          console.log("⏳ Waiting for SPA content to stabilize...");
          await waitForStableContent();
          isNavigating = false;
        }

        const payload = buildPagePayload();
        
        // Skip if no meaningful content
        if (payload.textLength < CONFIG.MIN_TEXT_LENGTH && retryCount < CONFIG.MAX_RETRIES) {
          console.log(`🔄 Content too short (${payload.textLength} chars), retrying in 500ms...`);
          setTimeout(() => {
            sendContentData({ ...options, retryCount: retryCount + 1, debounceMs: 0 });
          }, 500);
          return;
        }

        // Create deduplication key
        const contentKey = simpleHash(payload.visibleText + payload.title);
        const dedupeKey = `${payload.url}|${contentKey}`;

        if (dedupeKey === lastSentKey) {
          console.log("🔁 No changes detected — skipping duplicate send");
          return;
        }

        lastSentKey = dedupeKey;

        // Send to background script
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.sendMessage({
            type: "CONTENT_DATA",
            payload: {
              title: payload.title,
              description: payload.description,
              visibleText: payload.visibleText,
              url: payload.url,
              timestamp: payload.timestamp,
                    action: "created",

              metadata: {
                textLength: payload.textLength,
                blockCount: payload.blockCount
              }
            }
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.warn("⚠️ Runtime error:", chrome.runtime.lastError.message);
            } else {
              console.log("✅ Content data sent successfully");
            }
          });
        } else {
          console.warn("⚠️ Chrome runtime not available");
        }

        console.log(`📤 Sent ${payload.textLength} chars from ${payload.url}`);

      } catch (error) {
        console.error("❌ Error in sendContentData:", error);
      }
    }, debounceMs);
  }

  /*******************************
   * CSP-compliant SPA URL detection
   *******************************/
  function setupSPADetection() {
    // Use external script file instead of inline script to avoid CSP issues
    try {
      // Method 1: Override history methods directly in content script context
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      function onHistoryChange(method) {
        console.log(`🔁 History ${method} detected`);
        isNavigating = true;
        sendContentData({ waitForStability: true });
      }

      history.pushState = function(...args) {
        originalPushState.apply(this, args);
        onHistoryChange('pushState');
      };

      history.replaceState = function(...args) {
        originalReplaceState.apply(this, args);
        onHistoryChange('replaceState');
      };

      // Listen for popstate events
      window.addEventListener("popstate", () => {
        console.log("🔁 Popstate detected");
        isNavigating = true;
        sendContentData({ waitForStability: true });
      });

      // Listen for hashchange events
      window.addEventListener("hashchange", () => {
        console.log("🔁 Hashchange detected");
        sendContentData({ waitForStability: false }); // Hash changes usually don't need stability wait
      });

    } catch (error) {
      console.error("❌ Error setting up SPA detection:", error);
    }
  }

  /*******************************
   * Fallback URL polling
   *******************************/
  function setupFallbackPolling() {
    let lastHref = location.href;
    
    const pollId = setInterval(() => {
      if (location.href !== lastHref) {
        console.log("🔁 URL change detected by polling:", location.href);
        lastHref = location.href;
        isNavigating = true;
        sendContentData({ waitForStability: true });
      }
    }, CONFIG.POLL_INTERVAL);

    // Store pollId for potential cleanup
    if (window.__tabTracker) {
      window.__tabTracker.stopPoll = () => clearInterval(pollId);
    }

    return pollId;
  }

  /*******************************
   * Initialization
   *******************************/
  function initialize() {
    try {
      console.log("🔧 Initializing tab tracker...");

      // Setup SPA detection
      setupSPADetection();

      // Setup fallback polling
      setupFallbackPolling();

      // Send initial data when DOM is ready
      function sendInitialData() {
        console.log("📍 Sending initial page data...");
        sendContentData({ 
          debounceMs: 100, 
          waitForStability: true 
        });
      }

      if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(sendInitialData, 100);
      } else {
        document.addEventListener("DOMContentLoaded", sendInitialData, { once: true });
        // Backup listener for edge cases
        document.addEventListener("readystatechange", () => {
          if (document.readyState === "complete") {
            setTimeout(sendInitialData, 200);
          }
        }, { once: true });
      }

      console.log("✅ Tab tracker initialized successfully");

    } catch (error) {
      console.error("❌ Error during initialization:", error);
    }
  }

  /*******************************
   * Debug API
   *******************************/
  try {
    window.__tabTracker = {
      sendNow: () => sendContentData({ debounceMs: 0, waitForStability: false }),
      getPageData: buildPagePayload,
      getVisibleText: getVisibleScreenText,
      config: CONFIG,
      version: "2.0.0"
    };
  } catch (e) {
    // Ignore if page blocks global assignment
  }

  // Start the show
  initialize();
}