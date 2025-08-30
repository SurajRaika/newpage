// A very basic version of the BrowserActionAgentSystem class
// that retains the core Gemini API call function.

class BasicBrowserAgent {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.task = null;
    this.vision=null;

  }

  // The core function to call the Gemini API, as requested.
  async callGeminiApi(prompt, responseStructure) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
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

      return {
        success: true,
        response: JSON.parse(responseText),
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  async CheckCurrentPage(website_url , Website_title , desciption , headings  , bodyPreview , ){

  };
  // A single, basic agent function that uses the API call.
  async findVision(userInput) {
    this.task = userInput;
    const visionPrompt = `
You are a lightweight Vision Agent. Your job is to set a simple direction for a task.

User Request: "${userInput}"

Create a short vision that includes a simple goal.
`;

    const visionSchema = {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          sessionGoal: { type: "STRING" },
        },
        required: ["sessionGoal"]
      }
    };

    console.log("🎯 Vision Agent: Setting a simple goal...");
    const result = await this.callGeminiApi(visionPrompt, visionSchema);

    if (result.success) {
      console.log("✅ Session vision set!");
      this.vision=`   Goal: ${result.response.sessionGoal}`;
      console.log(this.vision);
    }
    
    return result;
  }
}

// Example Usage:
// This assumes you have an API key available in your environment.
async function runExample() {
  const apiKey = Bun.env.GEMINI_API_KEY;
  const agent = new BasicBrowserAgent(apiKey);
  
  const userRequest = "I will be working  on finding the client for the  my website services ";
  const visionResult = await agent.findVision(userRequest);
  
  if (visionResult.success) {
    console.log("\nFinal Vision Result:", visionResult.response);
  } else {
    console.error("\nError:", visionResult.error);
  }
}

// Uncomment the line below to run the example.
runExample();