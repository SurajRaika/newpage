// /home/karma/Documents/astro_tailwind_config/src/components/DynamicGreeting/events/InactivityEvent.ts

import { BaseEvent, EventPriority, type EventResponse, type ImageData } from '../types';

/**
 * InactivityEvent:
 * Displays a random image and one of several funny texts when the user is inactive.
 */
export class InactivityEvent extends BaseEvent {
  eventId = 'inactivity_event';

  /**
   * Array of inactivity image data.
   * Each object includes:
   *  - texts: multiple text options (we will choose one randomly)
   *  - src: image URL
   *  - position: where to display
   *  - size: image size
   */
  private inactivityImages: {
    texts: string[];
    src: string;
    position: string;
    size: string;
  }[] = [
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
      src: "https://i.pinimg.com/originals/44/b8/d9/44b8d93e9d724b08c83bf689f82a2bac.png",
      position: "bottom-right",
      size: "large"
    }
  ];

  constructor() {
    super();
    this.initializeListener();

    // DEMO: Trigger the event after 2 seconds
    setTimeout(() => {
      this.requestDisplay();
    }, 2000);

    // Example for continuous check (every 2 mins):
    // setInterval(() => this.requestDisplay(), 120000);
  }

  canTrigger(): boolean {
    return true;
  }

  getPriority(): EventPriority {
    return EventPriority.MEDIUM;
  }

  /**
   * Return a random image data with a randomly selected text.
   * The hub expects { src, position, size, text } (based on ImageData type).
   */
  getImageData(): Omit<ImageData, 'id'> {
    // Pick a random image object
    const randomImage = this.inactivityImages[Math.floor(Math.random() * this.inactivityImages.length)];
    
    // Pick a random text from the selected image's texts array
    const randomText = randomImage.texts[Math.floor(Math.random() * randomImage.texts.length)];

    // Return in correct format
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
    }
  }
}
