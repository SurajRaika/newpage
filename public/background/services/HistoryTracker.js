
export class HistoryTracker {
  constructor(logger) {
    this.logger = logger;
    this.apiEndpoint = "https://api.example.com/process-history"; // Replace with actual endpoint
  }

  async saveVisit(visitData) {
    try {
      const { visits: currentVisits = [] } = await chrome.storage.local.get({ visits: [] });
      const updatedVisits = [...currentVisits, visitData];
      
      await chrome.storage.local.set({ visits: updatedVisits });
      await this.logger.log('history', 'visit_saved', visitData);
      
      // Send recent history to API
      await this.sendHistoryToAPI();
    } catch (error) {
      await this.logger.log('error', 'visit_save_failed', { visitData, error: error.message });
    }
  }

  async sendHistoryToAPI() {
    try {
      const { visits = [] } = await chrome.storage.local.get({ visits: [] });
      
      if (!visits || visits.length === 0) {
        console.log("No history to send to API.");
        return;
      }

      const recentHistory = visits.slice(-7);

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ history: recentHistory }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const apiData = await response.json();
      await this.logger.log('api', 'history_sent', { historyCount: recentHistory.length });
      await this.saveApiResponse(apiData);

    } catch (error) {
      await this.logger.log('error', 'api_send_failed', { error: error.message });
    }
  }

  async saveApiResponse(responseData) {
    try {
      const { apiResponses = [] } = await chrome.storage.local.get({ apiResponses: [] });
      const updatedResponses = [...apiResponses, {
        ...responseData,
        receivedAt: new Date().toISOString()
      }];
      
      await chrome.storage.local.set({ apiResponses: updatedResponses });
      await this.logger.log('storage', 'api_response_saved', { responseId: responseData.id });
    } catch (error) {
      await this.logger.log('error', 'api_response_save_failed', { error: error.message });
    }
  }

  // Tab event handlers
  onTabCreated(tab) {
    this.saveVisit({
      tabId: tab.id,
      url: tab.pendingUrl || tab.url,
      title: tab.title || "New Tab",
      timeISO: new Date().toISOString(),
      action: "created"
    });
  }

  onTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      this.saveVisit({
        tabId: tabId,
        url: tab.url,
        title: tab.title,
        timeISO: new Date().toISOString(),
        action: "navigated"
      });
    }
  }

  onTabRemoved(tabId, removeInfo) {
    this.saveVisit({
      tabId: tabId,
      url: null,
      title: null,
      timeISO: new Date().toISOString(),
      action: "removed"
    });
  }
}
