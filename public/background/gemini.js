// gemini.js
// Handles Gemini API calls + key management

const storageGet = (keys) => new Promise((res) => chrome.storage.local.get(keys, res));

export async function getApiKey() {
  const data = await storageGet({ geminiApiKey: null });
  if (!data.geminiApiKey) {
    throw new Error("API key not found. Please set it in the extension's options.");
  }
  return data.geminiApiKey;
}

export async function callGeminiApi(prompt, apiKey) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";

    return { success: true, prompt, response: responseText, timestamp: new Date().toISOString() };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function callGeminiApiscehma(prompt, apiKey, responseStructure) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: responseStructure
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return { success: true, prompt, response: JSON.parse(responseText), timestamp: new Date().toISOString() };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
