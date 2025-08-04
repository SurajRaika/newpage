import { type EventRequest, EventPriority, HubState } from './types';

// The internal representation of a request in our queue
export interface QueuedRequest extends EventRequest {
  timestamp: number;
  retryCount: number;
}

export class RequestQueue {
  private queue: QueuedRequest[] = [];

  // Constants can be passed in or defined here
  private readonly MAX_REQUEST_AGE = 120000; // 2 minutes
  private readonly MAX_RETRIES = 3;

  /** Gets the current size of the queue. */
  public get size(): number {
    return this.queue.length;
  }

  /** Gets the next eventId in the queue without removing it. */
  public get nextEventId(): string | undefined {
    return this.queue[0]?.eventId;
  }

  /**
   * Adds or updates a request in the queue.
   */
  public add(request: EventRequest): void {
    console.log(`📥 [QUEUE] Received request from ${request.eventId} with priority ${EventPriority[request.priority]}.`);
    
    const queuedRequest: QueuedRequest = {
      ...request,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const existingIndex = this.queue.findIndex((q) => q.eventId === request.eventId);
    if (existingIndex !== -1) {
      console.log(`🔄 [QUEUE] Replacing existing request from ${request.eventId}`);
      this.queue[existingIndex] = queuedRequest;
    } else {
      this.queue.push(queuedRequest);
    }

    // Sort queue by priority (higher first), then by timestamp for same priority
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Retrieves the next valid request from the queue, removing it in the process.
   * It filters out stale requests and respects the hub's current state.
   */
  public getNext(currentState: HubState): QueuedRequest | null {
    for (let i = 0; i < this.queue.length; i++) {
      const req = this.queue[i];

      // 1. Discard stale requests
      if (Date.now() - req.timestamp > this.MAX_REQUEST_AGE) {
        console.log(`⏰ [QUEUE] Discarding stale request from ${req.eventId}`);
        this.queue.splice(i, 1);
        i--; // Adjust index after removal
        continue;
      }

      // 2. During cooldown, only allow CRITICAL priority events to be processed
      if (currentState === HubState.COOLDOWN && req.priority < EventPriority.CRITICAL) {
        continue; // Skip non-critical events
      }

      // Found a valid request
      this.queue.splice(i, 1); // Remove from queue
      return req;
    }

    return null; // No valid request found
  }
  
  /**
   * Puts a request back at the front of the queue, typically on a failed display attempt.
   */
   public requeue(request: QueuedRequest): boolean {
    request.retryCount = (request.retryCount || 0) + 1;
    if (request.retryCount >= this.MAX_RETRIES) {
        console.log(`⛔ [QUEUE] Discarding ${request.eventId} after max retries.`);
        return false;
    }
    console.log(`↪️ [QUEUE] Re-queueing ${request.eventId} (attempt ${request.retryCount}).`);
    this.queue.unshift(request); // Put it back at the front
    return true;
  }

  /** Clears the entire queue. */
  public clear(): void {
    this.queue = [];
  }
}