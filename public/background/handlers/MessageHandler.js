
export class MessageHandler {
  constructor(services) {
    this.geminiService = services.geminiService;
    this.goalProcessor = services.goalProcessor;
    this.historyTracker = services.historyTracker;
    this.logger = services.logger;
  }

  async handle(msg, sender, sendResponse) {
    await this.logger.log('message', 'received', { action: msg.action, sender });

    try {
      let result;

      switch (msg.action) {
        case "askGemini":
          result = await this.geminiService.callApi(msg.prompt);
          break;

        case "testGemini":
          result = await this.geminiService.testConnection(msg.apiKey);
          break;

        case "TaskInitialization":
          result = await this.goalProcessor.processGoal(
            msg.goalTitle,
            msg.goalId || `goal_${Date.now()}`,
            msg.slot || 'primary'
          );
          break;

        case "getGoalData":
          result = await this.getGoalData(msg.goalId);
          break;

        case "getCommunicationLogs":
          result = await this.getCommunicationLogs(msg.limit);
          break;

        case "clearLogs":
          result = await this.clearLogs();
          break;

        default:
          result = { success: false, error: "Unknown action: " + (msg.action || "<none>") };
      }

      await this.logger.log('message', 'response_sent', { action: msg.action, success: result.success });
      sendResponse(result);

    } catch (err) {
      const errorResult = { success: false, error: err.message };
      await this.logger.log('error', 'message_handling_failed', { action: msg.action, error: err.message });
      sendResponse(errorResult);
    }

    return true; // Keep message channel open for async response
  }

  async getGoalData(goalId) {
    try {
      const data = await chrome.storage.local.get([`refined_goal_${goalId}`]);
      return {
        success: true,
        data: data[`refined_goal_${goalId}`] || null
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getCommunicationLogs(limit = 50) {
    try {
      const logs = await this.logger.getLogs(limit);
      return { success: true, logs };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async clearLogs() {
    try {
      await this.logger.clearLogs();
      return { success: true, message: 'Logs cleared successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}