
export class GeminiService {
  constructor() {
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
  }

  async getApiKey() {
    const data = await chrome.storage.local.get("geminiApiKey");
    if (!data.geminiApiKey) {
      throw new Error("API key not found. Please set it in the extension's options.");
    }
    return data.geminiApiKey;
  }

  async callApi(prompt, apiKey = null) {
    try {
      const key = apiKey || await this.getApiKey();
      const url = `${this.baseUrl}?key=${key}`;
      
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
      
      let errorMessage = this.formatErrorMessage(err.message);
      
      return { success: false, error: errorMessage };
    }
  }

  formatErrorMessage(message) {
    if (message.includes("API_KEY_INVALID") || message.includes("403")) {
      return "The provided API key is not valid. Please check it.";
    } else if (message.includes("PERMISSION_DENIED")) {
      return "Permission denied. Please check your API key has the correct permissions.";
    } else if (message.includes("QUOTA_EXCEEDED")) {
      return "API quota exceeded. Please try again later.";
    }
    return message;
  }

  async testConnection(apiKey = null) {
    const testPrompt = "In one short sentence, say 'API connection successful.' in a funny tone. Return only the sentence.";
    return await this.callApi(testPrompt, apiKey);
  }
}