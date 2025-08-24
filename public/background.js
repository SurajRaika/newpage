// background.js

// Helper: Get API key from Chrome storage
async function getApiKey() {
  const data = await chrome.storage.local.get("geminiApiKey");
  if (!data.geminiApiKey) {
    throw new Error("API key not found. Please set it in the extension's options.");
  }
  return data.geminiApiKey;
}

// Function: Call the Gemini API using fetch
async function callGeminiApi(prompt, apiKey) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";
    
    return {
      success: true,
      prompt,
      response: responseText,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error("Gemini API Error:", err);
    
    // Provide more user-friendly error messages
    let errorMessage = err.message;
    if (err.message.includes("API_KEY_INVALID") || err.message.includes("403")) {
      errorMessage = "The provided API key is not valid. Please check it.";
    } else if (err.message.includes("PERMISSION_DENIED")) {
      errorMessage = "Permission denied. Please check your API key has the correct permissions.";
    } else if (err.message.includes("QUOTA_EXCEEDED")) {
      errorMessage = "API quota exceeded. Please try again later.";
    }
    
    return { success: false, error: errorMessage };
  }
}

// Listener: Handle messages from other parts of the extension
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg.action === "askGemini") {
        const apiKey = await getApiKey();
        const result = await callGeminiApi(msg.prompt, apiKey);
        sendResponse(result);
      } else if (msg.action === "testGemini") {
        const apiKey = msg.apiKey || await getApiKey();
        const testPrompt = "In one short sentence, say 'API connection successful.' in a funny tone. Return only the sentence.";
        const result = await callGeminiApi(testPrompt, apiKey);
        sendResponse(result);
      } else {
        sendResponse({ success: false, error: "Unknown action: " + (msg.action || "<none>") });
      }
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  })();

  // Keep message channel open for async response
  return true;
});














// background.js

// A helper function to save a new visit event
function saveVisit(visitData) {
  chrome.storage.local.get({ visits: [] }, (data) => {
    const updatedVisits = data.visits;
    updatedVisits.push(visitData);
    
    chrome.storage.local.set({ visits: updatedVisits }, () => {
      // *** NEW: After saving, send the recent history to the API ***
      sendHistoryToAPI(); 
    });
  });
}




// *** NEW: Function to send recent history to your API ***
function sendHistoryToAPI() {
  chrome.storage.local.get({ visits: [] }, (data) => {
    if (!data.visits || data.visits.length === 0) {
      console.log("No history to send to API.");
      return;
    }

    // Get the last 7 items from the history
    const recentHistory = data.visits.slice(-7);

    // Replace with your actual API endpoint
    const API_ENDPOINT = "https://api.example.com/process-history";

    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ history: recentHistory }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      return response.json();
    })
    .then(apiData => {
      console.log("Received data from API:", apiData);
      // Save the API's response
      saveApiResponse(apiData);
    })
    .catch(error => {
      console.error("Error sending data to API:", error);
    });
  });
}

// *** NEW: Helper function to save the API response ***
function saveApiResponse(responseData) {
  chrome.storage.local.get({ apiResponses: [] }, (data) => {
    const updatedResponses = data.apiResponses;
    // Add a timestamp to the response
    responseData.receivedAt = new Date().toISOString();
    updatedResponses.push(responseData);
    chrome.storage.local.set({ apiResponses: updatedResponses });
  });
}


// --- Your existing listeners remain the same ---

// When a new tab is created
chrome.tabs.onCreated.addListener((tab) => {
  console.log("Tab created:", tab.id);
  saveVisit({
    tabId: tab.id,
    url: tab.pendingUrl || tab.url,
    title: tab.title || "New Tab",
    timeISO: new Date().toISOString(),
    action: "created"
  });
});

// When a tab is updated (e.g., navigation)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log("Tab updated:", tabId, tab.url);
    saveVisit({
      tabId: tabId,
      url: tab.url,
      title: tab.title,
      timeISO: new Date().toISOString(),
      action: "navigated"
    });
  }
});

// ... and so on for your other listeners (onCommitted, onRemoved)




