// messenger.js
// Central runtime message listener

import { getApiKey, callGeminiApi, callGeminiApiscehma } from "./gemini.js";
import {  storageGet, saveVisit } from "./tabs.js";
// exmaple of saveVisit
//  saveVisit({
//       tabId: tab.id,
//       url: tab.pendingUrl || tab.url || '',
//       title: tab.title || "New Tab",
//       timeISO: new Date().toISOString(),
//       action: "created"
//     });

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
          console.log("Received CONTENT_DATA message", msg);
          const tabId = sender.tab?.id;
          if (!tabId) {
            console.log("if (!tabId) {");
            sendResponse({ success: false, error: "No valid tab ID" });
            return;
          }

          const { description, visibleText, title, url } = msg.payload || {};
          if (!description && !visibleText) {
            console.log("          if (!description && !visibleText) {");

            sendResponse({ success: false, error: "No content data provided" });
            return;
          }
          
          const data = await storageGet({ latestVisitByTab: {} });
          

          // const result = await updateVisitWithContentData(visitId, {
          //   description: description?.trim() || '',
          //   visibleText: visibleText?.trim() || '',
          //   title: title || sender.tab?.title || '',
          //   url: url || sender.tab?.url || '',
          // });


          console.log("DATA ::::")
          console.log({
      tabId: sender.tab.id,
url: url || sender.tab?.url || '',
      visibleText: visibleText,
      description: description?.trim(),
      title: title || sender.tab?.title,
      timeISO: new Date().toISOString(),
      action: "created"
    });
          
          await saveVisit({
      tabId: sender.tab.id,
url: url || sender.tab?.url || '',
      visibleText: visibleText,
      
      description: description?.trim(),
      title: title || sender.tab?.title,
      timeISO: new Date().toISOString(),
      action: "created"
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
