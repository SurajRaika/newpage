// /home/karma/Documents/astro_tailwind_config/src/components/DynamicGreeting/events/DefaultEvent.ts

// Import required types and base classes
import { BaseEvent, EventPriority, type EventResponse, type ImageData } from '../types';

/**
 * Type definition for the array elements in the image list.
 */
type DefaultImageItem = {
  texts: string[];
  src: string;
  position: 'top-right' | 'bottom-left' | 'top-left' | 'bottom-right' | 'center';
  size: 'small' | 'medium' | 'large';
};

/**
 * DefaultEvent:
 * This is a high-priority, 100% probability fallback event.
 * It ensures that a greeting is always displayed if no other specific events trigger.
 */
export class DefaultEvent extends BaseEvent {
  // A unique identifier for this event
  eventId = 'default_event';

  // Key for data persistence
  private readonly dataStorageKey = 'default_event_data'; 
  
  // Set probability to 100% so it always triggers.
  private probability = 100; 
  private Priority = EventPriority.HIGH; // Highest priority for a guaranteed display.
  private waitTime = 500; // Shorter wait time to ensure it checks quickly (0.5s)

  // Default greetings data structure (used as the fallback only)
  private defaultGreetings: DefaultImageItem[] = [
    {
        texts: [
            "The page just... won't load. Is the Wi-Fi down again?",
            "Seriously? Offline? Now?",
            "This swirling loading icon is my nemesis.",
            "Maybe if I click it again... nope.",
            "Is it my computer? Is it the internet? The eternal question."
        ],
        src: "https://i.pinimg.com/originals/6b/3d/ae/6b3dae013ed1d5fd200327692d33b6f9.png",
        position: "bottom-left",
        size: "medium"
    },
  ];

  /**
   * Constructor:
   * 1. Ensures default data is in localStorage.
   * 2. Sets a timer to request the display.
   */
  constructor() {
    super();

    // 1. Initialize localStorage data if it doesn't exist
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedData = localStorage.getItem(this.dataStorageKey); 
      if (!storedData) {
        // Store the default data if the key is not found
        localStorage.setItem(this.dataStorageKey, JSON.stringify(this.defaultGreetings));
      }
    }

    // 2. Automatically request display after the waitTime
    setTimeout(() => {
      this.requestDisplay(); 
    }, this.waitTime);
  }

  /**
   * Always returns true due to 100% probability and no cooldown logic.
   */
  canTrigger(): boolean {
    return true; // Always return true for the default event
  }

  /**
   * Event priority: HIGH
   * Used to ensure it displays over MEDIUM or LOW priority events.
   */
  getPriority(): EventPriority {
    return this.Priority;
  }

  /**
   * Returns a random image and text combination.
   * IMPORTANT: It primarily loads data from localStorage, falling back only if needed.
   */
  getImageData(): Omit<ImageData, 'id'> {
    let imageOptions: DefaultImageItem[] = this.defaultGreetings; // Start with fallback

    if (typeof window !== 'undefined' && window.localStorage) {
      const storedData = localStorage.getItem(this.dataStorageKey);
      
      if (storedData) {
        try {
          // Attempt to parse the stored string into the expected array structure
          const loadedImages = JSON.parse(storedData) as DefaultImageItem[];
          
          // Basic validation: ensure it's an array and not empty
          if (Array.isArray(loadedImages) && loadedImages.length > 0) {
            imageOptions = loadedImages;
          }
        } catch (e) {
          console.error(`[${this.eventId}] Failed to parse default event data from localStorage. Falling back to internal defaults.`, e);
          // If parsing fails, imageOptions remains the default
        }
      }
    }

    // Select a random item from the determined imageOptions array
    const randomImage = imageOptions[Math.floor(Math.random() * imageOptions.length)];
    const randomText = randomImage.texts[Math.floor(Math.random() * randomImage.texts.length)];
    
    return {
      src: randomImage.src,
      position: randomImage.position,
      size: randomImage.size,
      text: randomText
    };
  }

  /**
   * Handles user interaction responses from the hub (does nothing by default).
   */
  onEventResponse(response: EventResponse): void {
    if (response.action === 'clicked') {
        console.log(`[${this.eventId}] User acknowledged the default event.`);
    }
  }

  onDisplay(hideCallback: () => void): void {
    console.log(`[${this.eventId}] Displayed! Will hide in 4 seconds.`);
    setTimeout(() => {
      hideCallback(); // Hide myself after 4 seconds
    }, 4000);
  }
}