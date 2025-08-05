// /home/karma/Documents/astro_tailwind_config/src/components/DynamicGreeting/events/RandomTipEvent.ts
import { BaseEvent, EventPriority, type EventResponse, type ImageData } from '../types';

export class RandomTipEvent extends BaseEvent {
    eventId = 'random_tip_event';

    private tips: Omit<ImageData, 'id'>[] = [
        { text: " Pro tip: Take a 5-minute break every hour!", src: 'https://i.pinimg.com/originals/3b/af/c1/3bafc1f31c40c5f80803cfaa0e4c4f20.png', position: 'top-right', size: 'small' },
        { text: " Remember to stay hydrated!", src: 'https://i.pinimg.com/originals/3b/af/c1/3bafc1f31c40c5f80803cfaa0e4c4f20.png', position: 'top-right', size: 'small' },
        { text: " You're doing great! Keep it up!", src: 'https://i.pinimg.com/originals/3b/af/c1/3bafc1f31c40c5f80803cfaa0e4c4f20.png', position: 'bottom-right', size: 'medium' }
    ];

    constructor() {
        super();



        // Every 2 minutes, try to show a tip.
        // setInterval(() => this.requestDisplay(), 1200); // 2 minut

        setTimeout(() => {
            this.requestDisplay()
        }, 2000);


        // 



    }

    /** 15% chance to trigger each time it's checked. */
    canTrigger(): boolean {
        // return Math.random() < 1;
    return true;

    }

    getPriority(): EventPriority {
        return EventPriority.LOW;
    }

    getImageData(): Omit<ImageData, 'id'> {
        return this.tips[Math.floor(Math.random() * this.tips.length)];
    }

    onEventResponse(response: EventResponse): void {
        //console.log(`[${this.eventId}] Received response from hub:`, response);
    }
}