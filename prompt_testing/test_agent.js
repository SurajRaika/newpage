// browser-action-agents.js
class BrowserActionAgentSystem {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.actionHistory = [];
    this.currentContext = {};
  }

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

  // Agent 1: Vision Agent - Simple session-based vision
  async createVision(userInput) {
    const visionPrompt = `
You are a lightweight Vision Agent. 
Your job is NOT to make a big long-term plan, 
but just to set a simple direction for THIS browsing session.

User Request: "${userInput}"

Create a short vision that includes:
1. What is the immediate goal for this browsing session?
2. What does "done" look like today?
Keep it simple, short, and practical for right now. No big life strategy.
`;

    const visionSchema = {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          sessionGoal: { type: "STRING" },
          doneDefinition: { type: "STRING" },
          considerations: {
            type: "ARRAY",
            items: { type: "STRING" }
          },
          quickLimits: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        },
        required: ["sessionGoal", "doneDefinition"]
      }
    };

    console.log("🎯 Vision Agent: Setting simple browsing session goal...");
    const result = await this.callGeminiApi(visionPrompt, visionSchema);

    if (result.success) {
      this.currentContext.vision = result.response;
      console.log("✅ Session vision set!");
      console.log(`   Goal: ${result.response.sessionGoal}`);
      console.log(`   Done = ${result.response.doneDefinition}`);
      
      this.displayVision(result.response);
    }

    return result;
  }

  displayVision(vision) {
    console.log("\n" + "═".repeat(60));
    console.log("🌐 SIMPLE SESSION VISION");
    console.log("═".repeat(60));
    
    console.log(`\n🎯 Goal for this session:`);
    console.log(`   ${vision.sessionGoal}`);
    
    console.log(`\n✅ Done looks like:`);
    console.log(`   ${vision.doneDefinition}`);
    
    if (vision.considerations?.length) {
      console.log(`\n🔑 Keep in mind:`);
      vision.considerations.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c}`);
      });
    }

    if (vision.quickLimits?.length) {
      console.log(`\n⚠️ Quick limits:`);
      vision.quickLimits.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c}`);
      });
    }

    console.log("\n" + "═".repeat(60));
  }

  // Agent 2: Browser Action Detector - Session context applied
  async detectBrowserActions(userInput) {
    const vision = this.currentContext.vision;
    const detectorPrompt = `
You are a Browser Action Detector. Identify ONLY actions the user can do RIGHT NOW in their browser.

SESSION CONTEXT:
- Session Goal: ${vision.sessionGoal}
- Done Definition: ${vision.doneDefinition}
- Considerations: ${vision.considerations?.join(', ') || "None"}
- Quick Limits: ${vision.quickLimits?.join(', ') || "None"}

User wants: "${userInput}"

Focus ONLY on immediate browser actions that match the session goal.
Examples: visit websites, sign up, download tools, search, create accounts, fill forms.
IGNORE abstract tasks like "research", "plan", "think".
`;

    const detectorSchema = {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          hasActionableTasks: { type: "BOOLEAN" },
          immediateActions: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                action: { type: "STRING" },
                website: { type: "STRING" },
                specificSteps: { type: "STRING" },
                estimatedMinutes: { type: "NUMBER" },
                prerequisite: { type: "STRING" }
              },
              required: ["action", "website", "specificSteps", "estimatedMinutes"]
            }
          },
          recommendedFirstAction: { type: "STRING" }
        },
        required: ["hasActionableTasks", "immediateActions"]
      }
    };

    console.log("🔍 Browser Action Detector: Finding immediate actions...");
    const result = await this.callGeminiApi(detectorPrompt, detectorSchema);

    if (result.success) {
      this.currentContext.detectedActions = result.response;
      console.log("✅ Actions detected!");
      console.log(`   Found ${result.response.immediateActions.length} actionable tasks`);
    }

    return result;
  }

  // Agent 3: Action Prioritizer - unchanged except context already applied
  async prioritizeActions() {
    const actions = this.currentContext.detectedActions.immediateActions;
    
    const prioritizerPrompt = `
You are an Action Prioritizer. Given these browser actions, determine the logical order.

Available Actions:
${actions.map((a, i) => `${i+1}. ${a.action} - ${a.website} (${a.estimatedMinutes} min)`).join('\n')}

Consider:
- Which actions are prerequisites for others?
- What's the quickest win?
- What builds momentum?

Return them in priority order (most important first).
`;

    const prioritizerSchema = {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          prioritizedActions: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                action: { type: "STRING" },
                website: { type: "STRING" },
                priority: { type: "NUMBER" },
                reasoning: { type: "STRING" },
                estimatedMinutes: { type: "NUMBER" }
              },
              required: ["action", "website", "priority", "reasoning"]
            }
          },
          nextAction: { type: "STRING" }
        },
        required: ["prioritizedActions", "nextAction"]
      }
    };

    console.log("\n📊 Action Prioritizer: Ordering tasks by priority...");
    const result = await this.callGeminiApi(prioritizerPrompt, prioritizerSchema);

    if (result.success) {
      this.currentContext.prioritizedActions = result.response;
      console.log("✅ Actions prioritized!");
      console.log(`   Next: ${result.response.nextAction}`);
    }

    return result;
  }

  // Agent 4: Step Generator - unchanged
  async generateActionSteps(actionName) {
    const action = this.currentContext.prioritizedActions.prioritizedActions
      .find(a => a.action === actionName);
    
    const stepGeneratorPrompt = `
You are a Step Generator. Create EXACT browser steps for this action.

Action: ${action.action}
Website: ${action.website}
Time: ${action.estimatedMinutes} minutes

Generate step-by-step browser instructions:
1. Exact URL to visit
2. What to click (be specific - button text, link names)
3. What to type in forms
4. What to look for on the page
5. Expected result
`;

    const stepGeneratorSchema = {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          actionName: { type: "STRING" },
          startUrl: { type: "STRING" },
          steps: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                stepNumber: { type: "NUMBER" },
                instruction: { type: "STRING" },
                elementToFind: { type: "STRING" },
                actionType: { type: "STRING" },
                expectedResult: { type: "STRING" },
                screenshot: { type: "STRING" }
              },
              required: ["stepNumber", "instruction", "actionType", "expectedResult"]
            }
          },
          completionSignal: { type: "STRING" },
          troubleshooting: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        },
        required: ["actionName", "startUrl", "steps", "completionSignal"]
      }
    };

    console.log(`\n🎯 Step Generator: Creating exact steps for "${actionName}"...`);
    const result = await this.callGeminiApi(stepGeneratorPrompt, stepGeneratorSchema);

    if (result.success) {
      this.actionHistory.push({
        action: actionName,
        steps: result.response,
        timestamp: new Date().toISOString(),
        status: 'ready'
      });
      console.log("✅ Steps ready!");
      console.log(`   Start at: ${result.response.startUrl}`);
      console.log(`   ${result.response.steps.length} specific steps`);
    }

    return result;
  }

  // Agent 5: Progress Tracker - unchanged except context
  async trackProgress(completedAction, userFeedback) {
    const trackerPrompt = `
You are a Progress Tracker. The user just completed this action: "${completedAction}"

User feedback: "${userFeedback}"

Determine:
1. Was it successful?
2. What should they do next?
3. Are there any immediate follow-up actions on the same website?

Current available actions: ${this.currentContext.prioritizedActions.prioritizedActions.map(a => a.action).join(', ')}
`;

    const trackerSchema = {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          wasSuccessful: { type: "BOOLEAN" },
          completionNotes: { type: "STRING" },
          immediateFollowUp: { type: "STRING" },
          nextRecommendedAction: { type: "STRING" },
          estimatedProgress: { type: "NUMBER" }
        },
        required: ["wasSuccessful", "nextRecommendedAction", "estimatedProgress"]
      }
    };

    console.log(`\n📈 Progress Tracker: Checking completion of "${completedAction}"...`);
    const result = await this.callGeminiApi(trackerPrompt, trackerSchema);

    if (result.success) {
      const actionRecord = this.actionHistory.find(a => a.action === completedAction);
      if (actionRecord) {
        actionRecord.status = result.response.wasSuccessful ? 'completed' : 'failed';
        actionRecord.feedback = userFeedback;
        actionRecord.completedAt = new Date().toISOString();
      }
      
      console.log("✅ Progress tracked!");
      console.log(`   Success: ${result.response.wasSuccessful ? 'Yes' : 'No'}`);
      console.log(`   Next: ${result.response.nextRecommendedAction}`);
    }

    return result;
  }

  // Main method - Get the next actionable task
  async getNextBrowserAction(userInput) {
    console.log("🚀 Finding your next browser action...\n");

    const visionCreation = await this.createVision(userInput);
    if (!visionCreation.success) return visionCreation;

    const detection = await this.detectBrowserActions(userInput);
    if (!detection.success) return detection;

    if (!detection.response.hasActionableTasks) {
      return {
        success: false,
        message: "No immediate browser actions found. Try being more specific about what you want to do online."
      };
    }

    const prioritization = await this.prioritizeActions();
    if (!prioritization.success) return prioritization;

    const nextAction = prioritization.response.nextAction;
    const steps = await this.generateActionSteps(nextAction);

    return {
      success: true,
      nextAction: nextAction,
      actionSteps: steps.success ? steps.response : null,
      allActions: prioritization.response.prioritizedActions,
      totalActions: detection.response.immediateActions.length
    };
  }

  async continueToNextAction(completedAction, feedback = "completed") {
    const progress = await this.trackProgress(completedAction, feedback);
    
    if (progress.success && progress.response.nextRecommendedAction) {
      const nextSteps = await this.generateActionSteps(progress.response.nextRecommendedAction);
      
      return {
        success: true,
        previousAction: completedAction,
        wasSuccessful: progress.response.wasSuccessful,
        nextAction: progress.response.nextRecommendedAction,
        actionSteps: nextSteps.success ? nextSteps.response : null,
        progress: progress.response.estimatedProgress
      };
    }

    return progress;
  }
}

// Usage Example
async function main() {
  const apiKey = Bun.env.GEMINI_API_KEY;
  const browserAgent = new BrowserActionAgentSystem(apiKey);

  const userRequest = "I want to create a website for my startup";
  let somedata="";
  const result = await browserAgent.getNextBrowserAction(userRequest);
  
  if (result.success) {
    console.log("\n" + "=".repeat(60));
    console.log("🎯 YOUR NEXT BROWSER ACTION");
    console.log("=".repeat(60));
    
    console.log(`\n📋 Action: ${result.nextAction}`);
    
    if (result.actionSteps) {
      console.log(`\n🌐 Start here: ${result.actionSteps.startUrl}`);
      
      console.log("\n👆 Follow these exact steps:");
      result.actionSteps.steps.forEach(step => {
        console.log(`${step.stepNumber}. [${step.actionType.toUpperCase()}] ${step.instruction}`);
        if (step.elementToFind) {
          console.log(`    Look for: ${step.elementToFind}`);
        }
        console.log(`    Expected: ${step.expectedResult}`);
        console.log();
      });

      console.log(`✅ You'll know it's done when: ${result.actionSteps.completionSignal}`);
      
      if (result.actionSteps.troubleshooting?.length) {
        console.log("\n🔧 If you get stuck:");
        result.actionSteps.troubleshooting.forEach(tip => console.log(`   • ${tip}`));
      }
    }

    console.log(`\n📊 Actions remaining: ${result.totalActions - 1}`);
    
    console.log("\n" + "-".repeat(40));
    console.log("When done, call:");
    console.log(`browserAgent.continueToNextAction("${result.nextAction}", "completed");`);
    somedata=
    
  } else {
    console.error("❌ Error:", result.error || result.message);
  }
  
}

// Run if executed directly
if (import.meta.main) {
  main().catch(console.error);
}

export default BrowserActionAgentSystem;
