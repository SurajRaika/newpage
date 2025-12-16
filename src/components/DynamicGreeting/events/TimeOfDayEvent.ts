// /home/karma/Documents/astro_tailwind_config/src/components/DynamicGreeting/events/TimeOfDayEvent.ts

// Import required types and base classes
import { BaseEvent, EventPriority, type EventResponse, type ImageData } from '../types';

/**
 * TimeOfDayEvent:
 * This event triggers based on the current time of day (morning, afternoon, evening, night).
 * It displays a random image with a relevant message to the user.
 */
export class TimeOfDayEvent extends BaseEvent {
  // A unique identifier for this event (used by the event hub)
  eventId = 'time_of_day_event';
  // Local storage key for managing the cooldown period (1 hour)
  private localStorageKey = 'time_of_day_event_expiry';
  // Local storage key for storing/retrieving the greeting data structure itself
  private dataStorageKey = 'time_of_day_event_data'; 

  private probability = 50; // 50% chance by default
  private waitTime = 1000; // in milisec
  private Priority = EventPriority.MEDIUM;
  
  /**
   * Type definition for the complex greetings data structure.
   */
  private static GreetingDataStructure: Record<'morning' | 'afternoon' | 'evening' | 'night', {
    texts: string[];
    src: string;
    position: 'top-right' | 'bottom-left' | 'top-left' | 'bottom-right';
    size: 'small' | 'medium' | 'large';
  }[]> = {
      morning: [
        {
          texts: [
            "Good morning! Let's make this day awesome!",
            "Rise and shine! It's a brand new day.",
            "Morning vibes are the best vibes."
          ],
          src: 'https://i.pinimg.com/originals/0b/0a/8e/0b0a8e69f615d9cc4306228a77bde5f6.png',
          position: 'bottom-right',
          size: 'medium'
        }
      ],
      afternoon: [
        {
          texts: [
            "Good afternoon! Keep up the great work.",
            "Don't let the post-lunch slump get you.",
            "Halfway through the day—keep going!"
          ],
          src: 'https://i.pinimg.com/originals/39/97/95/399795eb77f3c0d81d3e50f890d93cdb.png',
          position: 'top-right',
          size: 'medium'
        }
      ],
      evening: [
        {
          texts: [
            "Good evening! Time to wind down.",
            "Evenings are for relaxation and reflection.",
            "Hope you had a productive day!"
          ],
          src: 'https://i.pinimg.com/originals/19/ed/31/19ed3192c2ef2c4f4916722de08543fa.png',
          position: 'bottom-right',
          size: 'medium'
        }
      ],
      night: [
        {
          texts: [
            "Good night! Time to rest and recharge.",
            "Late night? Don't forget to sleep soon!",
            "Nighttime is for dreaming big."
          ],
          src: 'https://i.pinimg.com/originals/0a/a7/43/0aa74374c354c8a381bfb1ffb16c9dbf.png',
          position: 'bottom-right',
          size: 'medium'
        }
      ]
    };

  // Renamed from 'greetings' to 'defaultGreetings' as it's the fallback.
  private defaultGreetings = TimeOfDayEvent.GreetingDataStructure; 

  // Stores the current greeting key (morning, afternoon, evening, night)
  private currentGreetingKey: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';

  /**
   * Constructor:
   * - Calls parent constructor (BaseEvent)
   * - Determines the current time of day
   * - Sets a timer to request the display after the waitTime
   */
  constructor() {
    super();

    this.currentGreetingKey = this.getTimeOfDay();

    // Automatically request display after the waitTime
    setTimeout(() => {
      if (this.canTrigger()) {
        this.requestDisplay(); // Requests the hub to display this event
      }
    }, this.waitTime);
    
    // Initial check: if data isn't in localStorage, store the defaults.
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedData = localStorage.getItem(this.dataStorageKey); 
      if (!storedData) {
        localStorage.setItem(this.dataStorageKey, JSON.stringify(this.defaultGreetings));
      }
    }
  }

  /**
   * Determines the current time of day as one of four buckets.
   */
  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Determines if the event can be triggered.
   * Checks local storage for cooldown period (1 hour).
   */
  canTrigger(): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return Math.random() * 100 < this.probability;
    }

    const raw = localStorage.getItem(this.localStorageKey);
    if (!raw) {
      return Math.random() * 100 < this.probability;
    }

    try {
      const parsed = JSON.parse(raw) as {
        period: 'morning' | 'afternoon' | 'evening' | 'night';
        date: string;
        expiry: number;
      };

      const now = Date.now();
      const today = new Date().toISOString().slice(0, 10);

      // Check for active cooldown period
      if (
        parsed.expiry &&
        now < parsed.expiry &&
        parsed.period === this.getTimeOfDay() &&
        parsed.date === today
      ) {
        return false; // Cooldown active, same period and same day
      }
    } catch (e) {
      console.warn(`[${this.eventId}] Failed to parse stored expiry, clearing key.`, e);
      localStorage.removeItem(this.localStorageKey);
    }

    // Only proceed if a random check passes (50% chance by default)
    return Math.random() * 100 < this.probability;
  }

  /**
   * Event priority:
   * Used by the event hub to decide which event to show if multiple are eligible.
   * Higher priority = shown first.
   */
  getPriority(): EventPriority {
    return this.Priority;
  }

  /**
   * Returns a random image and text combination for the current time of day.
   * It loads the data from localStorage first, falling back to defaultGreetings.
   */
  getImageData(): Omit<ImageData, 'id'> {
    let optionsList;
    
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedData = localStorage.getItem(this.dataStorageKey);
      
      if (storedData) {
        try {
          // Attempt to parse the stored string into the expected object structure
          const loadedGreetings = JSON.parse(storedData) as typeof this.defaultGreetings;
          
          // Check if the current time period key exists in the loaded data
          if (loadedGreetings && loadedGreetings[this.currentGreetingKey]) {
            optionsList = loadedGreetings[this.currentGreetingKey];
          }
        } catch (e) {
          console.error(`[${this.eventId}] Failed to parse greeting data from localStorage. Falling back to defaults.`, e);
          // If parsing fails, fall back to defaults
        }
      }
    }

    // Fallback: If localStorage could not be loaded or parsed, use the default structure.
    if (!optionsList) {
      optionsList = this.defaultGreetings[this.currentGreetingKey];
    }

    // Proceed with selecting a random image and text from the determined optionsList
    const randomImage = optionsList[Math.floor(Math.random() * optionsList.length)];
    const randomText = randomImage.texts[Math.floor(Math.random() * randomImage.texts.length)];
    
    return { ...randomImage, text: randomText };
  }

  /**
   * Handles user interaction responses from the hub.
   * Updates the cooldown period when dismissed or clicked.
   */
  onEventResponse(response: EventResponse): void {
    if (response.action === 'clicked' || response.action === 'dismissed') {
      const expiryTime = Date.now() + 60 * 60 * 1000; // 1 hour cooldown
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const payload = {
        period: this.getTimeOfDay() as 'morning' | 'afternoon' | 'evening' | 'night',
        date: today,
        expiry: expiryTime
      };
      localStorage.setItem(this.localStorageKey, JSON.stringify(payload));
    }
  }

  onDisplay(hideCallback: () => void): void {
    console.log(`[${this.eventId}] Displayed! Will hide in 4 seconds.`);
    setTimeout(() => {
      hideCallback(); // Hide myself after 4 seconds
    }, 4000);
  }
}