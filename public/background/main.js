
import { GeminiService } from './services/GeminiService.js';
import { GoalProcessor } from './services/GoalProcessor.js';
import { HistoryTracker } from './services/HistoryTracker.js';
import { CommunicationLogger } from './utils/CommunicationLogger.js';
import { MessageHandler } from './handlers/MessageHandler.js';

// Initialize services
const logger = new CommunicationLogger();
const geminiService = new GeminiService();
const goalProcessor = new GoalProcessor(geminiService, logger);
const historyTracker = new HistoryTracker(logger);
const messageHandler = new MessageHandler({
  geminiService,
  goalProcessor,
  historyTracker,
  logger
});

// Set up message listener
chrome.runtime.onMessage.addListener(messageHandler.handle.bind(messageHandler));

// Set up tab listeners for history tracking
chrome.tabs.onCreated.addListener(historyTracker.onTabCreated.bind(historyTracker));
chrome.tabs.onUpdated.addListener(historyTracker.onTabUpdated.bind(historyTracker));
chrome.tabs.onRemoved.addListener(historyTracker.onTabRemoved.bind(historyTracker));

console.log('Background script initialized with distributed services');
