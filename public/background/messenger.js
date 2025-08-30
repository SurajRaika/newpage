// messenger.js
// Central runtime message listener

import { getApiKey, callGeminiApi, callGeminiApiscehma } from "./gemini.js";
import { updateVisitWithContentData, storageGet, storageSet } from "./tabs.js";


export function setupMessenger() {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    (async () => {
      try {
        if (msg.action === "askGemini") {
          const apiKey = await getApiKey();
          const result = await callGeminiApiscehma(msg.prompt, apiKey, msg.responseStructure);
          sendResponse(result);

        } else if (msg.action === "testGemini") {
          const apiKey = msg.apiKey || await getApiKey();
          const testPrompt = "In one short sentence, say 'API connection successful.' in a funny tone.";
          const result = await callGeminiApi(testPrompt, apiKey);
          sendResponse(result);

        } else if (msg.type === "CONTENT_DATA") {
          const tabId = sender.tab?.id;
          if (!tabId) {
            sendResponse({ success: false, error: "No valid tab ID" });
            return;
          }

          const { description, visibleText, title, url } = msg.payload || {};
          if (!description && !visibleText) {
            sendResponse({ success: false, error: "No content data provided" });
            return;
          }
          
          const data = await storageGet({ latestVisitByTab: {} });
          const visitId = data.latestVisitByTab[tabId];
          
          if (!visitId) {
            sendResponse({ success: false, error: "No active visit found for this tab" });
            return;
          }

          const result = await updateVisitWithContentData(visitId, {
            description: description?.trim() || '',
            visibleText: visibleText?.trim() || '',
            title: title || sender.tab?.title || '',
            url: url || sender.tab?.url || '',
          });

          sendResponse({ success: true, visitId: visitId });
        } else {
          sendResponse({ success: false, error: "Unknown action: " + (msg.action || msg.type) });
        }
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // async
  });
}
