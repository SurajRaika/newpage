import { BaseEvent, EventPriority, type EventResponse, type ImageData } from '../types';

/**
 * InactivityEvent:
 * Displays a random image and one of several funny texts when the user is inactive.
 */
export class InactivityEvent extends BaseEvent {
  eventId = 'inactivity_event';

  private probability = 50; // 50% chance by default
  private waitTime = 1000; // in milisec
  private Priority = EventPriority.MEDIUM;

  private inactivityImages = [
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
  private readonly inactivityDelay = 60000; // 2 minutes

  constructor() {
    super();
    this.initializeListener();
    this.setupInactivityDetection();
  }

  private setupInactivityDetection() {
    const resetTimer = () => {
      if (this.inactivityTimeout) clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = setTimeout(() => {
        this.requestDisplay();
      }, this.inactivityDelay);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);

    resetTimer(); // Start timer on load
  }

  canTrigger(): boolean {
    return Math.random() * 100 < this.probability;
  }

  getPriority(): EventPriority {
    return this.Priority;
  }

  getImageData(): Omit<ImageData, 'id'> {
    const randomImage = this.inactivityImages[Math.floor(Math.random() * this.inactivityImages.length)];
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
    }
  }

  onDisplay(hideCallback: () => void): void {
    console.log(`[${this.eventId}] Displayed! Will hide in 4 seconds.`);
    setTimeout(() => {
      hideCallback(); // Hide myself after 4 seconds
    }, 4000);
  }
}
