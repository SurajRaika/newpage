import { BaseEvent, EventPriority, type EventResponse, type ImageData } from '../types';

// Define the literal types based on the error messages.
type ImagePosition = 'top-right' | 'bottom-left' | 'top-left' | 'bottom-right' | 'center';
type ImageSize = 'small' | 'medium' | 'large';

/**
 * Type definition for the array elements in the image list.
 */
type InactivityImageItem = {
  texts: string[];
  src: string;
  position: ImagePosition;
  size: ImageSize;
};

/**
 * InactivityEvent:
 * Displays a random image and one of several funny texts when the user is inactive.
 */
export class InactivityEvent extends BaseEvent {
  eventId = 'inactivity_event';

  private probability = 50; // 50% chance by default
  private waitTime = 1000; // in milisec
  private Priority = EventPriority.MEDIUM;
  private readonly dataStorageKey = 'inactivity_event_data'; // New key for data persistence

  // Renamed to defaultInactivityImages to clarify it is the fallback.
  private defaultInactivityImages: InactivityImageItem[] = [
    {
      texts: [
        "I'm not lazy, I'm just on energy-saving mode.",
        "Don't ask me to do anything. The answer is no.",
        "My only goal today is to remain completely still."
      ],
      src: "https://i.pinimg.com/originals/0b/0a/8e/0b0a8e69f615d9cc4306228a77bde5f6.png",
      position: "bottom-right",
      size: "medium"
    },
    {
      texts: [
        "I refuse to move.",
        "My current mood is 'no'.",
        "Don't you dare give me a task."
      ],
      src: "https://i.pinimg.com/originals/39/97/95/399795eb77f3c0d81d3e50f890d93cdb.png",
      position: "top-right",
      size: "large"
    }
  ];

  private inactivityTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly inactivityDelay = 60000; // 60 seconds (1 minute)

  constructor() {
    super();

    // Initialize localStorage data if it doesn't exist
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedData = localStorage.getItem(this.dataStorageKey); 
      if (!storedData) {
        // Store the default data if the key is not found
        localStorage.setItem(this.dataStorageKey, JSON.stringify(this.defaultInactivityImages));
      }
    }

    this.initializeListener(); // Assuming this method is defined in BaseEvent or handles its own cleanup
    this.setupInactivityDetection();
  }

  private setupInactivityDetection() {
    const resetTimer = () => {
      if (this.inactivityTimeout) clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = setTimeout(() => {
        // Only request display if the trigger check passes
        if (this.canTrigger()) {
            this.requestDisplay();
        }
      }, this.inactivityDelay);
    };

    // Global listeners to detect user activity
    if (typeof window !== 'undefined') {
        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);
    }

    resetTimer(); // Start timer on load
  }

  canTrigger(): boolean {
    return Math.random() * 100 < this.probability;
  }

  getPriority(): EventPriority {
    return this.Priority;
  }

  /**
   * Returns a random image and text combination.
   * Prioritizes loading data from localStorage.
   */
  getImageData(): Omit<ImageData, 'id'> {
    let imageOptions: InactivityImageItem[] = this.defaultInactivityImages;
    
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedData = localStorage.getItem(this.dataStorageKey);
      
      if (storedData) {
        try {
          // Attempt to parse the stored string into the expected array structure
          const loadedImages = JSON.parse(storedData) as InactivityImageItem[];
          
          // Basic validation: ensure it's an array and not empty
          if (Array.isArray(loadedImages) && loadedImages.length > 0) {
            imageOptions = loadedImages;
          }
        } catch (e) {
          console.error(`[${this.eventId}] Failed to parse inactivity data from localStorage. Falling back to defaults.`, e);
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

  onEventResponse(response: EventResponse): void {
    if (response.action === 'clicked') {
      console.log("User interacted with inactivity event.");
      // Optional: Restart the inactivity timer immediately after a click
      // this.setupInactivityDetection(); 
    }
    // If the event is dismissed, the inactivity timer will naturally restart on the next activity.
  }

  onDisplay(hideCallback: () => void): void {
    console.log(`[${this.eventId}] Displayed! Will hide in 4 seconds.`);
    setTimeout(() => {
      hideCallback(); // Hide myself after 4 seconds
    }, 4000);
  }
}