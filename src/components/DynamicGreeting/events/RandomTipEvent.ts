// /home/karma/Documents/astro_tailwind_config/src/components/DynamicGreeting/events/RandomTipEvent.ts

import { BaseEvent, EventPriority, type EventResponse, type ImageData } from '../types';

/**
 * RandomTipEvent:
 * Displays random fun tips/images at intervals (e.g., every few minutes).
 */
export class RandomTipEvent extends BaseEvent {
  eventId = 'random_tip_event';

  private probability = 50; // 50% chance by default
  private waitTime = 1000; // in milisec
  private Priority = EventPriority.MEDIUM;

  /**
   * Array of tips with multiple text options for variety.
   * Each tip contains:
   *  - texts: multiple strings (we pick one randomly)
   *  - src: image URL
   *  - position: placement of image
   *  - size: image size
   */
  private tips: {
    texts: string[];
    src: string;
    position: string;
    size: string;
  }[] = [
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

    // DEMO: Trigger this event after 2 seconds
    setTimeout(() => {
      this.requestDisplay();
    }, 10);

    // Example: trigger every 2 minutes
    // setInterval(() => this.requestDisplay(), 120000);
  }

  /** 
   * Only show occasionally. For now, always true.
   * Example: 15% chance -> return Math.random() < 0.15;
   */
  canTrigger(): boolean {
    return Math.random() * 100 < this.probability;
  }

  getPriority(): EventPriority {
    return this.Priority;
  }

  /**
   * Picks a random tip and a random text from its `texts` array.
   * Returns data in correct format: { src, position, size, text }
   */
  getImageData(): Omit<ImageData, 'id'> {
    // Random tip object
    const randomTip = this.tips[Math.floor(Math.random() * this.tips.length)];

    // Random text from that tip
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
    console.log(`[${this.eventId}] Displayed! Will hide in 80 seconds.`);
    let count = 0;
const intervalId = setInterval(() => {
  console.log("Count is", count);

  if (count >= 8) {
    console.log("Closing the displayed image");
    hideCallback(); // Hide myself after 8 seconds

    clearInterval(intervalId); // stop the interval
  }

  count += 1;
}, 1000);



    setTimeout(() => {
      hideCallback(); // Hide myself after 8 seconds
    }, 80000);




  }
}
