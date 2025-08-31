// background/index.js
// Entry point

import { setupMessenger } from "./messenger.js";
import { setupTabListeners } from "./tabs.js";

setupMessenger();
setupTabListeners();


// background/index.js (use webNavigation.onCompleted)
chrome.webNavigation.onCompleted.addListener(details => {
  if (details.frameId !== 0) return;

  if (!chrome.scripting || !chrome.scripting.executeScript) {
    console.warn("chrome.scripting unavailable — add 'scripting' permission to manifest if you need it.");
    return;
  }

  chrome.tabs.get(details.tabId, tab => {
    if (chrome.runtime.lastError) {
      console.warn("Could not get tab:", chrome.runtime.lastError.message);
      return;
    }

    const url = (tab && tab.url) || details.url;
    if (!url) return;

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        console.log("Skipping injection for unsupported protocol:", parsed.protocol, url);
        return;
      }

      // At this point the page load event has fired (DOM mounted).
      chrome.scripting.executeScript({
        target: { tabId: details.tabId },
        files: ["content.js"]
      }).then(() => {
        console.log("Injected content.js into", url);
      }).catch(err => {
        console.error("executeScript failed:", err);
      });

    } catch (err) {
      console.warn("Invalid URL — skipping injection:", url, err);
    }
  });
});





console.log("Background script initialized 🚀");
