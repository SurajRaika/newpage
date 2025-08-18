    // /home/karma/Documents/astro_tailwind_config/src/components/DynamicGreeting/events/RandomTipEvent.ts

    import { BaseEvent, EventPriority, type EventResponse, type ImageData } from '../types';

    /**
     * RandomTipEvent:
     * Displays random fun tips/images at intervals (e.g., every few minutes).
     */
    export class OfflineEvent extends BaseEvent {
    eventId = 'OfflineEvent_event';
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
    {
        texts: [
            "The internet is gone... and so is my will to live.",
            "My connection is as dead as I feel right now.",
            "I've tried everything. I give up.",
            "Looks like the world is offline today.",
            "Just let me be sad in the corner with no Wi-Fi."
        ],
        src: "https://i.pinimg.com/originals/02/51/07/02510742b39f0b2e1040993a5dcc0c73.png",
        position: "bottom-left",
        size: "medium"
    }
];

constructor() {
    super();

    // Trigger event when device goes offline
    window.addEventListener('offline', () => {
        if (this.canTrigger()) {
            this.requestDisplay();
        }
    });

    // Optional: also trigger immediately if already offline on load
    if (!navigator.onLine) {
    // if (true) {
setTimeout(() => {
    this.requestDisplay();
}, 10);
    }

    // Example: trigger every 2 minutes (if you still want it)
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
        console.log(`[${this.eventId}] Displayed! Will hide in 4 seconds.`);
        setTimeout(() => {
          hideCallback(); // Hide myself after 4 seconds
        }, 4000);
      }
    }
