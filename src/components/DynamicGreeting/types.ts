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
    // Automatically listen for responses from the hub directed at this specific event.
    window.addEventListener(`greeting:response:${this.eventId}`, (e: CustomEvent<EventResponse>) => {
      console.log("TEST Received response for event:", this.eventId, e.detail);
      this.onEventResponse(e.detail);
    });
  }

  // --- Abstract methods that MUST be implemented by each specific event ---

  /** Determines if the event's conditions are met to be shown. */
  abstract canTrigger(): boolean;

  /** Returns the event's priority level. */
  abstract getPriority(): EventPriority;

  /** Returns the image and text data for the event. */
  abstract getImageData(): Omit<ImageData, 'id'>;

  /** Handles user interaction feedback from the hub (e.g., click, dismiss). */
  abstract onEventResponse(response: EventResponse): void;


  // --- Core communication logic ---

  /**
   * Sends a display request to the central hub.
   * Any event can call this to ask for permission to be displayed.
   */
  protected requestDisplay(): void {
    if (!this.canTrigger()) {
      //console.log(`[${this.eventId}] Request denied: canTrigger() returned false.`);
      return;
    }

    const request: EventRequest = {
      eventId: this.eventId,
      priority: this.getPriority(),
      imageData: {
        ...this.getImageData(),
        id: `${this.eventId}_${Date.now()}` // Ensure a unique ID for this instance
      }
    };

    // Dispatch a custom event on the window for the hub to catch.
    // This decouples the event from the hub.
    //console.log(`[${this.eventId}] Dispatching display request with priority ${EventPriority[request.priority]}.`, request);
    window.dispatchEvent(new CustomEvent('greeting:requestDisplay', { detail: request }));
  }
}




