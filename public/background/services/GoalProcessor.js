
export class GoalProcessor {
  constructor(geminiService, logger) {
    this.geminiService = geminiService;
    this.logger = logger;
    this.storageKeys = {
      primaryGoal: 'goal_primary',
      secondaryGoal: 'goal_secondary',
      goalTasks: 'goal_tasks'
    };
  }

  async processGoal(originalGoalName, goalId, slot = 'primary') {
    await this.logger.log('goal', 'process_start', { originalGoalName, goalId, slot });

    try {
      // Step 1: Refine goal with AI
      const refinedGoalData = await this.refineGoalWithAI(originalGoalName);
      
      if (!refinedGoalData.success) {
        throw new Error('Failed to refine goal: ' + refinedGoalData.error);
      }

      // Step 2: Generate suggested actions
      const suggestedActions = await this.generateSuggestedActions(refinedGoalData.refinedTitle);

      // Step 3: Create complete goal data structure
      const goalData = this.createGoalDataStructure(
        goalId, 
        originalGoalName, 
        refinedGoalData, 
        suggestedActions, 
        slot
      );

      // Step 4: Save to storage
      await this.saveGoalToStorage(goalData, slot);
      await this.saveSuggestedTasks(goalId, suggestedActions.actions || []);
      await this.saveGoalReference(goalId, refinedGoalData.refinedTitle);

      await this.logger.log('goal', 'process_complete', { goalId, refinedTitle: refinedGoalData.refinedTitle });

      return {
        success: true,
        goalData: goalData,
        message: 'Goal processed and saved successfully'
      };

    } catch (error) {
      await this.logger.log('error', 'goal_processing_failed', { goalId, error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  async refineGoalWithAI(originalGoalName) {
    const prompt = `You are a goal refinement assistant. Take this user's goal and improve it:

Original Goal: "${originalGoalName}"

Please provide a JSON response with:
1. A refined, clear, and actionable goal title (max 60 characters)
2. A brief description explaining what this goal entails
3. A category for this goal (health, career, learning, personal, financial, creative, etc.)
4. An estimated duration (days, weeks, months, or ongoing)

Format your response as valid JSON:
{
  "refinedTitle": "Clear and actionable goal title",
  "description": "Brief explanation of what this goal involves",
  "category": "appropriate category",
  "estimatedDuration": "time estimate"
}

Make the refined title specific, measurable, and motivating. Keep it concise but clear.`;

    try {
      const result = await this.geminiService.callApi(prompt);
      
      if (result.success) {
        try {
          const parsedData = JSON.parse(result.response);
          return {
            success: true,
            ...parsedData
          };
        } catch (parseError) {
          return {
            success: true,
            refinedTitle: result.response.substring(0, 60),
            description: 'AI-refined goal',
            category: 'general',
            estimatedDuration: 'unknown'
          };
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      await this.logger.log('error', 'ai_refinement_failed', { originalGoalName, error: error.message });
      throw error;
    }
  }

  async generateSuggestedActions(goalTitle) {
    const prompt = `For the goal: "${goalTitle}"

Generate 3-5 specific, actionable steps that someone could take to work towards this goal. 

Return as JSON:
{
  "actions": [
    {
      "title": "Action title",
      "description": "What to do",
      "priority": "high|medium|low",
      "estimatedTime": "time needed",
      "category": "research|planning|action|review"
    }
  ]
}

Make each action concrete and doable. Focus on immediate next steps.`;

    try {
      const result = await this.geminiService.callApi(prompt);
      
      if (result.success) {
        try {
          return JSON.parse(result.response);
        } catch (parseError) {
          return { actions: [] };
        }
      } else {
        return { actions: [] };
      }
    } catch (error) {
      await this.logger.log('error', 'action_generation_failed', { goalTitle, error: error.message });
      return { actions: [] };
    }
  }

  createGoalDataStructure(goalId, originalName, refinedData, suggestedActions, slot) {
    return {
      id: goalId,
      originalName: originalName,
      refinedTitle: refinedData.refinedTitle,
      description: refinedData.description,
      slot: slot,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      suggestedActions: suggestedActions.actions || [],
      metadata: {
        aiProcessingCompleted: true,
        category: refinedData.category || 'general',
        priority: slot === 'primary' ? 'high' : 'medium',
        estimatedDuration: refinedData.estimatedDuration || 'unknown'
      }
    };
  }

  async saveGoalToStorage(goalData, slot) {
    const storageKey = slot === 'primary' ? this.storageKeys.primaryGoal : this.storageKeys.secondaryGoal;
    await chrome.storage.local.set({ [storageKey]: goalData });
  }

  async saveSuggestedTasks(goalId, actions) {
    if (actions && actions.length > 0) {
      const tasksKey = `${this.storageKeys.goalTasks}_${goalId}`;
      await chrome.storage.local.set({ [tasksKey]: actions });
    }
  }

  async saveGoalReference(goalId, refinedTitle) {
    await chrome.storage.local.set({ [`refined_goal_${goalId}`]: { title: refinedTitle } });
  }
}
