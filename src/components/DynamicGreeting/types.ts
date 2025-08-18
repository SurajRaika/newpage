// /home/karma/Documents/astro_tailwind_config/src/components/DynamicGreeting/types.ts

/**
 * Defines the visual properties of a greeting element.
 */
export interface ImageData {
  id: string;
  src: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  size: 'small' | 'medium' | 'large';
  text: string;
}

/**
 * Defines the structure of a display request sent from an event to the hub.
 */
export interface EventRequest {
  eventId: string;
  priority: EventPriority;
  imageData: ImageData;
}

/**
 * Defines the structure of a response sent from the hub back to an event.
 */
export interface EventResponse {
  eventId: string;
  action: 'clicked' | 'dismissed' | 'timeout';
}







// NEW: A state machine to simplify logic
export enum HubState {
  IDLE,       // Ready to show an event
  DISPLAYING, // An event is currently on screen
  COOLDOWN,   // Waiting for a cooldown period to end
}


/**
 * Enum for event priority levels. Higher numbers have higher priority.
 */
export enum EventPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

/**
 * The abstract base class for all dynamic events.
 * It standardizes event creation and communication with the central hub.
 */
export abstract class BaseEvent {
  /** A unique identifier for the event type. */
  abstract eventId: string;

  constructor() {
    // This is tricky. The eventId is not available in the base constructor.
    // We need to initialize the listener after the subclass has set the eventId.
  }

  /**
   * Initializes the event listener. This MUST be called in the subclass constructor.
   */
  protected initializeListener(): void {
    if (!this.eventId) {
      console.error("Event ID is not set. Cannot initialize listener.");
      return;
    }
    console.log(`[${this.eventId}] Initializing listener.`);
    window.addEventListener(`greeting:response:${this.eventId}`, (e: CustomEvent<EventResponse>) => {
      // console.log(`[${this.eventId}] Received response:`, e.detail);
      this.onEventResponse(e.detail);
    });
  }

  // --- Abstract methods ---
  abstract canTrigger(): boolean;
  abstract getPriority(): EventPriority;
  abstract getImageData(): Omit<ImageData, 'id'>;
  abstract onEventResponse(response: EventResponse): void;

  /**
   * Optional: Called when the event's image is successfully displayed.
   * @param hideCallback A function to call to hide the currently displayed greeting.
   */
  onDisplay?(hideCallback: () => void): void;

  // --- Core logic ---
  protected requestDisplay(): void {
    if (!this.canTrigger()) return;

    const request: EventRequest = {
      eventId: this.eventId,
      priority: this.getPriority(),
      imageData: {
        ...this.getImageData(),
        id: `${this.eventId}_${Date.now()}`
      }
    };
    window.dispatchEvent(new CustomEvent('greeting:requestDisplay', { detail: request }));
  }
}

/**
 * Extends EventRequest to include additional properties for internal hub management.
 */
export interface QueuedRequest extends EventRequest {
  timestamp: number;
  retryCount?: number;
  eventInstance: BaseEvent; // Reference to the actual event instance
}





