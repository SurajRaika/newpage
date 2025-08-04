// Refactored DynamicGreetingHub/index.ts - UI/UX logic moved to UIManager
import { BaseEvent, EventPriority, type EventRequest, type EventResponse } from './types';
import { UIManager } from './UIManager';

// Import all your event classes here
import { InactivityEvent } from './events/InactivityEvent';
import { RandomTipEvent } from './events/RandomTipEvent';
import { TimeOfDayEvent } from './events/TimeOfDayEvent';

interface QueuedRequest extends EventRequest {
  timestamp: number;
  retryCount?: number;
}

// State machine to simplify logic
enum HubState {
  IDLE,           // Ready to show an event
  THROTTLING,     // Waiting for the initial throttle period to end
  DISPLAYING,     // An event is currently on screen
  COOLDOWN,       // Waiting for a cooldown period to end
}

export class DynamicGreetingHub {
  // Constants
  private readonly THROTTLE_PERIOD = 2000;         // 2 seconds
  private readonly COOLDOWN_PERIOD = 5000;         // 5 seconds
  private readonly MAX_QUEUE_TIME = 120000;        // 2 minutes
  private readonly MAX_RETRIES = 3;

  // State Management
  private events: BaseEvent[] = [];
  private requestQueue: QueuedRequest[] = [];
  private state: HubState = HubState.IDLE;
  private currentRequest: QueuedRequest | null = null;
  private cooldownTimer: number | null = null;
  private throttleTimer: number | null = null;
  private autoTimeoutTimer: number | null = null;

  // UI Manager
  private uiManager: UIManager;

  // Event listener reference
  private boundHandleRequest: (e: CustomEvent<EventRequest>) => void;

  constructor() {
    this.uiManager = new UIManager();
    this.boundHandleRequest = this.queueRequest.bind(this);
    this.registerEvents();
    this.listenForRequests();
    console.log('🎯 DynamicGreetingHub initialized.');
  }

  /** Instantiates all event classes. */
  private registerEvents(): void {
    this.events = [new RandomTipEvent(), new InactivityEvent(), new TimeOfDayEvent()];
    console.log(`📋 Registered ${this.events.length} event types.`);
  }

  /** Sets up the global listener for display requests. */
  private listenForRequests(): void {
    window.addEventListener('greeting:requestDisplay', this.boundHandleRequest as EventListener);
  }

  /**
   * Adds incoming requests to the queue and tries to process it.
   */
  private queueRequest(event: CustomEvent<EventRequest> | EventRequest): void {
    const request = 'detail' in event ? event.detail : event;

    // If the hub is busy (displaying an event OR in cooldown), be selective.
    if (this.state === HubState.DISPLAYING || this.state === HubState.COOLDOWN) {
      // Only queue HIGH/CRITICAL events that can interrupt or be shown next.
      // Ignore LOW/MEDIUM priority requests when the hub is busy.
      if (request.priority < EventPriority.HIGH) {
        console.log(`🚫 [BUSY] Ignoring ${EventPriority[request.priority]} priority request (${request.eventId}) because state is ${HubState[this.state]}.`);
        return; // Exit early, do not queue.
      }
      console.log(`⏳ [BUSY] Queuing high-priority request (${request.eventId}) during ${HubState[this.state]} state.`);
    }

    console.log(`📥 [QUEUE] Queuing request from ${request.eventId} with priority ${EventPriority[request.priority]}.`);
    
    const queuedRequest: QueuedRequest = {
      ...request,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const existingIndex = this.requestQueue.findIndex((q) => q.eventId === request.eventId);
    if (existingIndex !== -1) {
      console.log(`🔄 [QUEUE] Replacing existing request from ${request.eventId}`);
      this.requestQueue[existingIndex] = queuedRequest;
    } else {
      this.requestQueue.push(queuedRequest);
    }

    // Sort queue by priority (higher first), then by timestamp for same priority
    this.requestQueue.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.timestamp - b.timestamp;
    });

    console.log(`📊 [QUEUE] Queue size: ${this.requestQueue.length}, Next: ${this.requestQueue[0]?.eventId || 'none'}`);

    this.tryProcessQueue();
  }

  /**
   * Main logic loop, triggered when state changes.
   */
  private tryProcessQueue(): void {
    // If we're already displaying or in cooldown, do nothing here.
    if (this.state === HubState.DISPLAYING || this.state === HubState.COOLDOWN) {
        return;
    }
    
    // If we're IDLE and a request comes in, start the throttle timer.
    if (this.state === HubState.IDLE && this.requestQueue.length > 0) {
        console.log(`⏱️ [THROTTLE] Request received while IDLE. Starting ${this.THROTTLE_PERIOD / 1000}s throttle period.`);
        this.state = HubState.THROTTLING;
        this.throttleTimer = window.setTimeout(() => {
            console.log('✅ [THROTTLE] Period finished. Processing highest priority request.');
            this.processSingleHighestPriorityRequest();
        }, this.THROTTLE_PERIOD);
        return;
    }

    // If we're THROTTLING and more requests come in, just let them queue.
    // The timer will handle processing when it expires.
    if (this.state === HubState.THROTTLING) {
        return;
    }
  }

  /**
   * Processes the single highest priority request after the throttle period.
   */
  private processSingleHighestPriorityRequest(): void {
    // A "guard" clause to prevent processing under wrong conditions
    if (this.state !== HubState.THROTTLING && this.state !== HubState.IDLE) {
      return;
    }

    const nextRequest = this.getNextValidRequest();
    if (!nextRequest) {
      this.state = HubState.IDLE; // No valid request to process, return to IDLE
      return;
    }

    // If we got a request, process it
    this.handleRequest(nextRequest);
  }

  /**
   * Helper to find the next valid request in the queue.
   */
  private getNextValidRequest(): QueuedRequest | null {
    for (let i = 0; i < this.requestQueue.length; i++) {
      const req = this.requestQueue[i];

      // Discard stale requests
      if (Date.now() - req.timestamp > this.MAX_QUEUE_TIME) {
        console.log(`⏰ [QUEUE] Discarding stale request from ${req.eventId}`);
        this.requestQueue.splice(i, 1);
        i--; // Adjust index after removal
        continue;
      }

      // During cooldown, only allow CRITICAL priority events
      if (this.state === HubState.COOLDOWN && req.priority < EventPriority.CRITICAL) {
        continue; // Skip non-critical events
      }

      // Found a valid request
      this.requestQueue.splice(i, 1); // Remove from queue
      return req;
    }

    return null; // No valid request found
  }

  /**
   * Processes a validated request.
   */
  private async handleRequest(request: QueuedRequest): Promise<void> {
    if (this.currentRequest) {
      if (request.priority > this.currentRequest.priority) {
        console.log(`⚡ [HUB] Interrupting ${this.currentRequest.eventId} for ${request.eventId}`);
        await this.hideCurrentEvent(true); // true = interrupted
      } else {
        console.log(`⛔ [HUB] Cannot interrupt. Re-queueing ${request.eventId}.`);
        request.retryCount = (request.retryCount || 0) + 1;
        if (request.retryCount < this.MAX_RETRIES) {
          this.requestQueue.unshift(request); // Put it back at the front
        }
        return;
      }
    }
    await this.displayEvent(request);
  }

  /**
   * Renders the event on the screen using UIManager.
   * Now waits for image to load before proceeding.
   */
  private async displayEvent(request: QueuedRequest): Promise<void> {
    console.log(`🎭 [HUB] Preparing to display event: ${request.eventId}`);

    this.state = HubState.DISPLAYING;
    this.currentRequest = request;

    try {
      // Use UIManager to handle the display (now async and waits for image load)
      await this.uiManager.displayEvent(request, (action, req) => {
        this.respondToEvent(action, req);
      });

      console.log(`✅ [HUB] Event displayed successfully: ${request.eventId}`);

      // Setup auto-timeout using UIManager (after image is loaded and displayed)
      this.autoTimeoutTimer = this.uiManager.setupAutoTimeout(request, () => {
        if (this.currentRequest?.imageData.id === request.imageData.id) {
          this.respondToEvent('timeout', request);
        }
      });

    } catch (error) {
      console.error(`❌ [HUB] Failed to display event ${request.eventId}:`, error);
      // Reset state on error
      this.currentRequest = null;
      this.state = HubState.IDLE;
      this.tryProcessQueue(); // Try next request
    }
  }

  /**
   * Sends a response back to the originating event class.
   */
  private respondToEvent(action: EventResponse['action'], request: QueuedRequest): void {
    if (this.currentRequest?.imageData.id !== request.imageData.id) {
      return; // Ignore response for a non-current event
    }
    console.log(`📤 [HUB] Responding to ${request.eventId} with action: ${action}`);

    const response: EventResponse = { eventId: request.eventId, action };
    window.dispatchEvent(new CustomEvent(`greeting:response:${request.eventId}`, { detail: response }));

    this.hideCurrentEvent();
  }

  /** Hides and removes the current event element using UIManager. */
  private async hideCurrentEvent(interrupted = false): Promise<void> {
    if (!this.uiManager.hasActiveElement()) {
      this.state = HubState.IDLE;
      return;
    }

    if (interrupted) {
      console.log(`⚡ [HUB] Event ${this.currentRequest?.eventId} was interrupted`);
    }

    // Clear auto-timeout if it exists
    if (this.autoTimeoutTimer) {
      clearTimeout(this.autoTimeoutTimer);
      this.autoTimeoutTimer = null;
    }

    // Use UIManager to handle the hiding
    await this.uiManager.hideCurrentEvent(interrupted);
    
    this.currentRequest = null;

    // Enter cooldown state
    this.enterCooldown();
  }

  /**
   * Centralized method to handle cooldown state transition.
   */
  private enterCooldown(): void {
    console.log(`❄️ [COOLDOWN] Starting ${this.COOLDOWN_PERIOD / 1000}s cooldown.`);
    this.state = HubState.COOLDOWN;

    if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
    
    this.cooldownTimer = window.setTimeout(() => {
      console.log('✅ [HUB] Cooldown finished. State is now IDLE.');
      this.state = HubState.IDLE;
      this.cooldownTimer = null;

      // Try processing queue again in case high-priority events were added during cooldown
      this.tryProcessQueue();
    }, this.COOLDOWN_PERIOD);
  }

  // --- Public Debugging Methods ---
  public getQueueStatus() {
    return {
      state: HubState[this.state],
      queueLength: this.requestQueue.length,
      currentRequest: this.currentRequest?.eventId || null,
      hasActiveUI: this.uiManager.hasActiveElement()
    };
  }

  public getQueue() {
    return this.requestQueue.map(req => ({
      eventId: req.eventId,
      priority: EventPriority[req.priority],
      timestamp: new Date(req.timestamp).toISOString(),
      retryCount: req.retryCount || 0
    }));
  }

  /**
   * Cleanup when the hub is destroyed.
   */
  public destroy(): void {
    // Remove event listener
    window.removeEventListener('greeting:requestDisplay', this.boundHandleRequest as EventListener);
    
    // Clear timers
    if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
    if (this.throttleTimer) clearTimeout(this.throttleTimer);
    if (this.autoTimeoutTimer) clearTimeout(this.autoTimeoutTimer);
    
    // Cleanup UI
    this.uiManager.cleanup();
    
    // Clear state
    this.requestQueue = [];
    this.currentRequest = null;
    this.state = HubState.IDLE;
    
    console.log('🔌 DynamicGreetingHub destroyed.');
  }
}

// Ensure only one instance is created and exposed for debugging
if (!(window as any).greetingHub) {
  (window as any).greetingHub = new DynamicGreetingHub();
}