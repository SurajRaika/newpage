// /home/karma/Documents/astro_tailwind_config/src/components/DynamicGreeting/events/InactivityEvent.ts
import { BaseEvent, EventPriority, type EventResponse, type ImageData } from '../types';

export class InactivityEvent extends BaseEvent {
  eventId = 'inactivity_event';

  private inactivityImages: Omit<ImageData, 'id'>[] = [
    {
      src: 'https://i.pinimg.com/736x/20/6c/1d/206c1d2674e08f28e84cf781290ccf8c.jpg',
      position: 'bottom-left',
      size: 'medium',
      text: 'You sure are lazier than I am!'
    },
    {
      src: 'https://i.pinimg.com/736x/1f/50/27/1f50270d8661c9ca8d714ef9a10ccb97.jpg',
      position: 'top-left',
      size: 'small',
      text: 'Bro, are you sure you are awake?'
    }
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
  /** This event is triggered by the hub, so canTrigger is always true when called. */
  canTrigger(): boolean {
    return true;
  }

  getPriority(): EventPriority {
    return EventPriority.MEDIUM;
  }

  getImageData(): Omit<ImageData, 'id'> {
    return this.inactivityImages[Math.floor(Math.random() * this.inactivityImages.length)];
  }



  onEventResponse(response: EventResponse): void {
    //console.log(`[${this.eventId}] Received response from hub:`, response);
    if (response.action === 'clicked') {
      //console.log('User is back! Maybe show a welcome back message next time.');
    }
  }
}