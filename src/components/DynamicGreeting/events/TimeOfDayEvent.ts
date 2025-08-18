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

  // Local storage key to manage cooldown period
  private localStorageKey = 'time_of_day_event_expiry';
  private probability = 50; // 50% chance by default
  private waitTime = 1000; // in milisec
  private Priority = EventPriority.MEDIUM; 
  /**
   * Greeting images grouped by time of day.
   * Each key represents a time of day, containing an array of objects:
   * - texts: List of possible messages for that time of day
   * - src: Image URL
   * - position: Screen position for the image
   * - size: Image size
   */
  private greetings: Record<'morning' | 'afternoon' | 'evening' | 'night', {
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

  // Stores the current greeting key (morning, afternoon, evening, night)
  private currentGreetingKey: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';

  /**
   * Constructor:
   * - Calls parent constructor (BaseEvent)
   * - Determines the current time of day
   * - Sets a timer to request the display after 2 seconds
   */
  constructor() {
    super();

    this.currentGreetingKey = this.getTimeOfDay();

    // Automatically request display after 2 seconds
    setTimeout(() => {
      if (this.canTrigger()) {
        this.requestDisplay(); // Requests the hub to display this event
      }
    }, this.waitTime);
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

      if (
        parsed.expiry &&
        now < parsed.expiry &&
        parsed.period === this.getTimeOfDay() &&
        parsed.date === today
      ) {
        return false; // cooldown active
      }
    } catch (e) {
      console.warn(`[${this.eventId}] Failed to parse stored expiry, clearing key.`, e);
      localStorage.removeItem(this.localStorageKey);
    }

    return Math.random() * 100 < this.probability;
  }

  /**
   * Event priority:
   * Used by the event hub to decide which event to show if multiple are eligible.
   * Higher priority = shown first.
   */
  getPriority(): EventPriority {
    return this.Priority;
    // return EventPriority.MEDIUM; // Medium priority for this event
  }

  /**
   * Returns a random image and text combination for the current time of day.
   */
  getImageData(): Omit<ImageData, 'id'> {
    const options = this.greetings[this.currentGreetingKey];
    const randomImage = options[Math.floor(Math.random() * options.length)];
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
