// goals/GoalsData.js

/**
 * Manages the storage and retrieval of goals.
 * Supports both localStorage and Chrome extension storage.
 * Handles AI-powered goal title refinement.
 */
const GoalsData = (() => {
  const STORAGE_KEY = 'userGoals';
  const GOAL_SLOTS = {
    PRIMARY: 0,    // Main focus goal
    SECONDARY: 1   // Additional goal
  };

  /**
   * Generates a unique ID for a new goal.
   */
  const generateId = () => {
    return `goal-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  /**
   * Retrieves goals from local storage.
   * @returns {Array} An array of goal objects.
   */
  const getGoals = () => {
    try {
      const goals = localStorage.getItem(STORAGE_KEY);
      return goals ? JSON.parse(goals) : [];
    } catch (e) {
      console.error("Error fetching goals from localStorage", e);
      return [];
    }
  };

  /**
   * Saves the entire goals array to local storage.
   * @param {Array} goals - The array of goal objects to save.
   */
  const saveAllGoals = (goals) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    } catch (e) {
      console.error("Error saving goals to localStorage", e);
    }
  };

  /**
   * Communicates with Chrome extension background script for AI processing.
   * @param {string} goalTitle - The original goal title from user
   * @returns {Promise<Object>} Response from background script
   */
  const sendTaskInitialization = async (goalTitle) => {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        // Extension environment
        chrome.runtime.sendMessage(
          { 
            action: "TaskInitialization",
            goalTitle: goalTitle 
          },
          (response) => {
            if (chrome.runtime.lastError) {
              resolve({ 
                success: false, 
                error: "Extension communication error: " + chrome.runtime.lastError.message 
              });
            } else {
              resolve(response);
            }
          }
        );
      } else {
        // Non-extension environment - return original title
        resolve({ 
          success: true, 
          refinedTitle: goalTitle,
          message: "No extension available - using original title" 
        });
      }
    });
  };

  /**
   * Reads refined goal title from Chrome extension storage.
   * @param {string} goalId - The goal ID to look up
   * @returns {Promise<string>} The refined title from extension storage
   */
  const readRefinedTitleFromExtension = async (goalId) => {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get([`refined_goal_${goalId}`], (result) => {
          if (chrome.runtime.lastError) {
            console.error("Error reading from extension storage:", chrome.runtime.lastError);
            resolve(null);
          } else {
            const refinedData = result[`refined_goal_${goalId}`];
            resolve(refinedData ? refinedData.title : null);
          }
        });
      } else {
        resolve(null);
      }
    });
  };

  /**
   * Creates a new goal object with full data structure.
   * @param {string} shortName - The original goal name from user
   * @param {string} refinedTitle - The AI-refined title (optional)
   * @returns {Object} Complete goal object
   */
  const createGoalObject = (shortName, refinedTitle = null) => {
    return {
      id: generateId(),
      shortName: refinedTitle || shortName,
      originalName: shortName,
      creationTime: Date.now(),
      lastUpdated: Date.now(),
      isProcessing: !refinedTitle, // true if still waiting for AI processing
      slot: null // Will be assigned when added to goals array
    };
  };

  /**
   * Adds a new goal with AI processing workflow.
   * @param {string} shortName - The original goal title from user
   * @returns {Promise<Object>} Result of the operation
   */
  const addGoal = async (shortName) => {
    try {
      const goals = getGoals();
      
      // Check if we have space (max 2 goals)
      if (goals.length >= 2) {
        return { success: false, error: "Maximum goals reached (2)" };
      }

      // Create initial goal object
      const newGoal = createGoalObject(shortName);
      
      // Assign slot (0 = primary, 1 = secondary)
      newGoal.slot = goals.length === 0 ? GOAL_SLOTS.PRIMARY : GOAL_SLOTS.SECONDARY;
      
      // Add to goals array immediately (with processing flag)
      goals.push(newGoal);
      saveAllGoals(goals);

      // Start AI processing in background
      console.log(`Starting AI processing for goal: "${shortName}"`);
      const aiResponse = await sendTaskInitialization(shortName);
      
      if (aiResponse.success) {
        console.log("AI processing completed successfully");
        
        // Update the goal with refined title
        await updateGoalAfterAIProcessing(newGoal.id);
        
        return { 
          success: true, 
          goalId: newGoal.id,
          message: "Goal added and AI processing completed"
        };
      } else {
        // AI failed, but keep the original goal
        updateGoalById(newGoal.id, { isProcessing: false });
        return { 
          success: true, 
          goalId: newGoal.id,
          warning: "Goal added but AI processing failed: " + aiResponse.error
        };
      }
      
    } catch (error) {
      console.error("Error in addGoal:", error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Updates goal after AI processing is complete.
   * Reads the refined title from extension storage and updates the goal.
   * @param {string} goalId - The ID of the goal to update
   */
  const updateGoalAfterAIProcessing = async (goalId) => {
    try {
      // Read refined title from extension storage
      const refinedTitle = await readRefinedTitleFromExtension(goalId);
      
      if (refinedTitle) {
        // Update the goal with refined title
        updateGoalById(goalId, {
          shortName: refinedTitle,
          isProcessing: false,
          lastUpdated: Date.now()
        });
        
        console.log(`Goal ${goalId} updated with refined title: "${refinedTitle}"`);
        
        // Trigger UI re-render
        document.dispatchEvent(new CustomEvent('render-goals-manager'));
      } else {
        // No refined title found, just remove processing flag
        updateGoalById(goalId, {
          isProcessing: false,
          lastUpdated: Date.now()
        });
        
        console.log(`No refined title found for goal ${goalId}, using original`);
      }
    } catch (error) {
      console.error("Error updating goal after AI processing:", error);
    }
  };

  /**
   * Updates an existing goal by its ID.
   * @param {string} id - The ID of the goal to update
   * @param {Object} updates - Properties to update
   */
  const updateGoalById = (id, updates) => {
    const goals = getGoals();
    const goalIndex = goals.findIndex(goal => goal.id === id);
    
    if (goalIndex !== -1) {
      goals[goalIndex] = { 
        ...goals[goalIndex], 
        ...updates,
        lastUpdated: Date.now()
      };
      saveAllGoals(goals);
      return true;
    }
    return false;
  };

  /**
   * Deletes a goal by its ID and reorganizes slots.
   * @param {string} id - The ID of the goal to delete
   */
  const deleteGoalById = (id) => {
    const goals = getGoals();
    const updatedGoals = goals.filter(goal => goal.id !== id);
    
    // Reassign slots after deletion
    updatedGoals.forEach((goal, index) => {
      goal.slot = index === 0 ? GOAL_SLOTS.PRIMARY : GOAL_SLOTS.SECONDARY;
    });
    
    saveAllGoals(updatedGoals);
  };

  /**
   * Gets a goal by its ID.
   * @param {string} id - The goal ID
   * @returns {Object|null} The goal object or null if not found
   */
  const getGoalById = (id) => {
    const goals = getGoals();
    return goals.find(goal => goal.id === id) || null;
  };

  /**
   * Manually trigger update for a specific goal (useful for retry scenarios).
   * @param {string} goalId - The goal ID to refresh
   */
  const reloadGoal = async (goalId) => {
    const goal = getGoalById(goalId);
    if (!goal) {
      console.error(`Goal with ID ${goalId} not found`);
      return;
    }

    // Mark as processing
    updateGoalById(goalId, { isProcessing: true });

    // Re-trigger AI processing
    const aiResponse = await sendTaskInitialization(goal.originalName || goal.shortName);
    
    if (aiResponse.success) {
      await updateGoalAfterAIProcessing(goalId);
    } else {
      updateGoalById(goalId, { isProcessing: false });
      console.error("AI processing failed for goal reload:", aiResponse.error);
    }
  };

  // Public API
  return {
    getGoals,
    addGoal,
    updateGoalById,
    deleteGoalById,
    getGoalById,
    reloadGoal,
    updateGoalAfterAIProcessing,
    GOAL_SLOTS
  };
})();

export default GoalsData;