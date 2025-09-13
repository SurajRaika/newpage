// A very basic version of the BrowserActionAgentSystem class
// that retains the core Gemini API call function.

class BasicBrowserAgent {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.task = null;
    this.vision = null;
    this.historyLog = []; // Stores the summaries and relevance for previous pages.
  }

  // The core function to call the Gemini API, as requested.
  async callGeminiApi(prompt, responseStructure, ai_model = 'gemini-2.5-flash-lite') {
    try {
      const isGemma = ai_model.includes('gemma');

      let finalPrompt = prompt;

      // Conditionally modify the prompt for Gemma models to request JSON output
      if (isGemma) {
        finalPrompt += '\n\nPlease respond with a valid JSON object only. Do not include any additional text, explanations, or formatting outside the JSON.';
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${ai_model}:generateContent?key=${this.apiKey}`;

      // Build payload conditionally
      const payload = {
        contents: [{ parts: [{ text: finalPrompt }] }]
      };

      // Only add generationConfig for non-Gemma models
      if (!isGemma) {
        payload.generationConfig = responseStructure;
      }

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

      let parsedResponse;
      try {
        // Clean the response text for Gemma models (remove potential markdown formatting)
        let cleanedText = responseText;
        if (isGemma) {
          // Remove markdown code blocks if present
          cleanedText = responseText.replace(/```json\s?/g, '').replace(/```/g, '').trim();
        }

        parsedResponse = JSON.parse(cleanedText);
      } catch (e) {
        if (isGemma) {
          throw new Error(`Gemma model failed to return valid JSON. Response: ${responseText}`);
        } else {
          throw new Error(`Failed to parse response as JSON: ${e.message}`);
        }
      }

      return {
        success: true,
        response: parsedResponse,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async processVisitedHistory(historyData, strictness = 'normal') {
    for (const page of historyData) {
      const { url, title, description, visibleText } = page;
      console.log(url);

      // First, get a summary of the page using the existing CheckCurrentPage method.
      const summaryResult = await this.CheckCurrentPage(url, title, description, visibleText);

      if (summaryResult.success) {
        console.log(`\n--- Page: ${title} ---`);
        const websiteSummary = summaryResult.response.short_summary;
        console.log(`Summary: ${summaryResult.response.summary}`);
        console.log(`short_summary: ${websiteSummary} `);

        // Now, use the new method to process the summary and determine relevance.
        const relevanceResult = await this.assessTaskRelevance(websiteSummary, strictness);

        if (relevanceResult.success) {
          const isRelated = relevanceResult.response.is_related.toUpperCase();
          const reason = relevanceResult.response.reason;
          console.log(`Related to Task: ${isRelated}`);
          console.log(`Reason: ${reason}`);

          // Record the output for the history log.
          this.historyLog.push({
            summary: websiteSummary,
            is_related: isRelated,
            reason: reason
          });
          // Keep the history log limited to the last 5 entries.
          if (this.historyLog.length > 5) {
            this.historyLog.shift();
          }

        } else {
          console.error(`Error processing summary for ${title}: ${relevanceResult.error}`);
        }
      } else {
        console.error(`Error processing ${title}: ${summaryResult.error}`);
      }

      // Wait for user input before proceeding to the next page.
      console.log("Press Enter to process the next website...");
      await new Promise(resolve => process.stdin.once('data', resolve));
    }
  }

  async CheckCurrentPage(website_url, Website_title, description, visibleText) {
    const prompt = `
You are an AI agent tasked with summarizing a webpage in the context of a user's task.

Overall Task: "${this.task}"
Session Vision: "${this.vision}"

Webpage Information:
- URL: ${website_url}
- Title: ${Website_title}
- Description: ${description}
- Visible Text: ${visibleText}

Generate TWO summaries:
1) "summary" → a concise, one-line summary of the webpage's purpose.
2) "short_summary" → a super short version (just a few words, max 6) capturing the essence +  with short website url summary .

Respond ONLY in valid JSON.
    `;

    const summariesSchema = {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          summary: { type: "STRING" },
          short_summary: { type: "STRING" },
        },
        required: ["summary", "short_summary"]
      }
    };

    try {
      const result = await this.callGeminiApi(prompt, summariesSchema, 'gemma-3-4b-it');
      if (result.success) {
        return { success: true, response: result.response };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async getHistoryOverview() {
    // If there's no history, return a default message.
    if (this.historyLog.length === 0) {
      return {
        success: true,
        response: {
          history_summary: "No browsing history has been recorded yet."
        }
      };
    }

    // Format the history log into a readable string for the prompt.
    const formattedHistory = this.historyLog.map(entry =>
      `- Summary: "${entry.summary}", Related to Task: ${entry.is_related}`
    ).join('\n');

    const prompt = `
You are a summary agent. Your task is to analyze a log of visited websites and create a single, concise, one-line summary of the user's journey.

Overall Task Context: "${this.task}"

Browsing History Log:
${formattedHistory}

Based on the log above, what has the user been doing or looking for? Summarize their activity in one single sentence.
Focus on the pages that were considered related to the task.
`;

    const historySummarySchema = {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          history_summary: {
            type: "STRING"
          },
        },
        required: ["history_summary"]
      }
    };

    console.log("\n🔄 Summarizing browsing history...");
    try {
      // Using a capable flash model for the summarization task.
      const result = await this.callGeminiApi(prompt, historySummarySchema, 'gemini-1.5-flash-latest');
      if (result.success) {
        console.log("✅ History summary generated!");
        return {
          success: true,
          response: result.response
        };
      } else {
        console.error("❌ Failed to generate history summary.");
        return {
          success: false,
          error: result.error
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
    }
  }

  async assessTaskRelevance(websiteSummary, strictness) {
    // First, get the history overview for short context.
    const historyOverviewResult = await this.getHistoryOverview();
    let historyContext = "No history context available.";
    if (historyOverviewResult.success) {
      historyContext = historyOverviewResult.response.history_summary;
    } else {
      console.error(`Error getting history overview: ${historyOverviewResult.error}`);
    }

    // Get the previous 1 website's summary and reason.
    const lastWebsite = this.historyLog[this.historyLog.length - 1] || null;
    const lastSummary = lastWebsite ? `Summary: ${lastWebsite.summary}, Reason: ${lastWebsite.reason}` : "No previous website summary available.";

    // Get the previous 4 websites' summaries and relevance.
    const previousFour = this.historyLog.slice(-4).map(item => `Summary: ${item.summary}, Related: ${item.is_related}`).join('\n- ');
    const previousFourText = previousFour ? `\n\nPrevious 4 websites visited:\n- ${previousFour}` : "No previous history available.";

    const prompt = `
You MUST decide whether a single Website Summary is related to the Overall Task.
Use ONLY these inputs: Overall Task: "${this.task}", Session Vision: "${this.vision}",
Website Summary: "${websiteSummary}", Last Website: ${lastSummary}, Previous 4: ${previousFourText}.
History Overview (short context on user's journey so far): "${historyContext}".

This history overview provides a high-level summary of what the user has been doing. Use it to guide your relevance decision, especially for ambiguous cases.

Strictness = "${strictness}" (low = permissive, normal = balanced, high = strict).

Rules (apply in order):
1) If the summary explicitly matches task resources (docs, API, tutorial, repo, issue, StackOverflow Q), return "yes".
2) If clearly unrelated AND prior history shows no related pages, return "no".
3) If the summary is a general homepage/landing root (YouTube, Google, Wikipedia, etc.), default to "uncertain" unless its a pure  entertainment website  then 'yes' its realted .
   - If previous 4 contain clearly related pages, low/normal strictness may return "yes"; high should remain "uncertain" unless explicit evidence exists.
4) If ambiguous, use previous history: bias toward "yes" at low, require stronger evidence at normal, require explicit evidence at high.

Output JSON exactly: { "is_related": "yes"|"no"|"uncertain", "reason": "<1 short sentence citing the clue (e.g. 'previous: \"StackOverflow Q on X\"')>" }.
Keep reason concise.
  `;

    const relevanceSchema = {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          is_related: {
            type: "STRING",
            enum: ["yes", "no", "uncertain"]
          },
          reason: { type: "STRING" }
        },
        required: ["is_related", "reason"]
      }
    };

    try {
      const result = await this.callGeminiApi(prompt, relevanceSchema);
      if (result.success) {
        return { success: true, response: result.response };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

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
    const result = await this.callGeminiApi(visionPrompt, visionSchema, "gemini-2.5-flash");

    if (result.success) {
      console.log("✅ Session vision set!");
      this.vision = `  Goal: ${result.response.sessionGoal}`;
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

  const userRequest = "I will be working on ai agent extension";
  const visionResult = await agent.findVision(userRequest);

  if (visionResult.success) {
    console.log("\nFinal Vision Result:", visionResult.response);
    const filePath = 'prompt_testing/visited_history.json';
    const visitedHistoryData = await Bun.file(filePath).json();

    // Now, pass the data to the new method with a strictness level.
    await agent.processVisitedHistory(visitedHistoryData, 'normal');

  } else {
    console.error("\nError:", visionResult.error);
  }
}

// Uncomment the line below to run the example.
runExample();