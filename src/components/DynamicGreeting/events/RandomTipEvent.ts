// /home/karma/Documents/astro_tailwind_config/src/components/DynamicGreeting/events/RandomTipEvent.ts

import { BaseEvent, EventPriority, type EventResponse, type ImageData } from '../types';

/**
 * Type definition for a single Tip structure.
 */
type Tip = {
  texts: string[];
  src: string;
  position: 'top-right' | 'bottom-left' | 'top-left' | 'bottom-right' | 'center';
  size: 'small' | 'medium' | 'large';
};

/**
 * RandomTipEvent:
 * Displays random fun tips/images at intervals (e.g., every few minutes).
 */
export class RandomTipEvent extends BaseEvent {
  eventId = 'random_tip_event';

  // Local storage key for storing/retrieving the tips data structure itself
  private dataStorageKey = 'random_tip_event_data'; 
  private probability = 50; // 50% chance by default
  private waitTime = 1000; // in milisec
  private Priority = EventPriority.MEDIUM;

  /**
   * Array of tips with multiple text options for variety (Used as the default/fallback).
   */
  private defaultTips: Tip[] = [
    {
      texts: [
        "Don't mind me, just thinking about naps.",
        "This is my face when I'm not doing anything.",
        "Can't decide if I want to sleep or eat. Or both."
      ],
      src: "https://i.pinimg.com/originals/0b/0a/8e/0b0a8e69f615d9cc4306228a77bde5f6.png",
      position: "bottom-right",
      size: "medium"
    },
    {
      texts: [
        "Ahoy there! The Straw Hat Pirates are here to say hi!",
        "Just checking in with my crew.",
        "We're all here, ready for anything!"
      ],
      src: "https://i.pinimg.com/originals/19/ed/31/19ed3192c2ef2c4f4916722de08543fa.png",
      position: "bottom-right",
      size: "medium"
    },
    {
      texts: [
        "Hmpf.",
        "I am not amused.",
        "This is my resting annoyed face."
      ],
      src: "https://i.pinimg.com/originals/39/97/95/399795eb77f3c0d81d3e50f890d93cdb.png",
      position: "top-right",
      size: "medium"
    }
  ];

  constructor() {
    super();
    
    // Check if running in a browser environment and initialize localStorage data
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedData = localStorage.getItem(this.dataStorageKey);
      if (!storedData) {
        // If data is not found, store the default tips
        localStorage.setItem(this.dataStorageKey, JSON.stringify(this.defaultTips));
      }
    }

    // DEMO: Trigger this event after the waitTime
    setTimeout(() => {
      this.requestDisplay();
    }, this.waitTime);

    // Example: trigger every 2 minutes
    // setInterval(() => this.requestDisplay(), 120000);
  }

  /** * Only show occasionally.
   */
  canTrigger(): boolean {
    return Math.random() * 100 < this.probability;
  }

  getPriority(): EventPriority {
    return this.Priority;
  }

  /**
   * Picks a random tip and a random text from its `texts` array.
   * It loads the data from localStorage first, falling back to defaultTips.
   */
  getImageData(): Omit<ImageData, 'id'> {
    let activeTips: Tip[] = [];

    // 1. Attempt to load tips from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedData = localStorage.getItem(this.dataStorageKey);
      
      if (storedData) {
        try {
          // Attempt to parse the stored string into the expected array structure (Tip[])
          const loadedTips = JSON.parse(storedData) as Tip[];
          
          // Check if the loaded data is a non-empty array
          if (Array.isArray(loadedTips) && loadedTips.length > 0) {
            activeTips = loadedTips;
          }
        } catch (e) {
          console.error(`[${this.eventId}] Failed to parse tip data from localStorage. Falling back to defaults.`, e);
          // If parsing fails, activeTips remains empty, triggering the fallback below
        }
      }
    }

    // 2. Fallback: If localStorage could not be loaded or was empty/invalid, use the default structure.
    if (activeTips.length === 0) {
      activeTips = this.defaultTips;
    }

    // 3. Select a random tip from the determined list (activeTips)
    const randomTip = activeTips[Math.floor(Math.random() * activeTips.length)];

    // 4. Select a random text from that tip
    const randomText = randomTip.texts[Math.floor(Math.random() * randomTip.texts.length)];

    return {
      src: randomTip.src,
      position: randomTip.position, 
      size: randomTip.size,
      text: randomText
    };
  }

  onEventResponse(response: EventResponse): void {
    // Handle user interactions (if needed)
  }

  onDisplay(hideCallback: () => void): void {
    console.log(`[${this.eventId}] Displayed! Will hide in 8 seconds.`);
    let count = 0;
    const intervalId = setInterval(() => {
      console.log("Count is", count);

      // The original logic checked for count >= 8, making it 9 seconds total (0 through 8).
      // Let's hide after 8 complete seconds (count = 8)
      if (count >= 8) {
        console.log("Closing the displayed image");
        hideCallback(); // Hide myself
        clearInterval(intervalId); // stop the interval
      }

      count += 1;
    }, 1000);

    // Removed the redundant 80-second setTimeout from your original code.
  }
}