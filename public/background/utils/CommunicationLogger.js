export class CommunicationLogger {
  constructor() {
    this.logKey = 'extension_communication_log';
    this.maxLogEntries = 100;
  }

  async log(type, action, data, sender = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      type, // 'message', 'storage', 'api', 'error', 'goal', 'history'
      action,
      sender: sender ? {
        tab: sender.tab?.id,
        url: sender.tab?.url,
        origin: sender.origin
      } : null,
      data: this.sanitizeLogData(data)
    };

    try {
      const { [this.logKey]: logs = [] } = await chrome.storage.local.get([this.logKey]);
      logs.push(logEntry);
      
      if (logs.length > this.maxLogEntries) {
        logs.splice(0, logs.length - this.maxLogEntries);
      }
      
      await chrome.storage.local.set({ [this.logKey]: logs });
      console.log(`[${type.toUpperCase()}] ${action}:`, logEntry);
    } catch (error) {
      console.error('Failed to log communication:', error);
    }
  }

  sanitizeLogData(data) {
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      if (sanitized.apiKey) sanitized.apiKey = '[REDACTED]';
      if (sanitized.key) sanitized.key = '[REDACTED]';
      return sanitized;
    }
    return data;
  }

  async getLogs(limit = 50) {
    try {
      const { [this.logKey]: logs = [] } = await chrome.storage.local.get([this.logKey]);
      return logs.slice(-limit).reverse();
    } catch (error) {
      console.error('Failed to get logs:', error);
      return [];
    }
  }

  async clearLogs() {
    try {
      await chrome.storage.local.remove([this.logKey]);
      console.log('Communication logs cleared');
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }
}