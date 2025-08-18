// /home/karma/Documents/astro_tailwind_config/src/components/DynamicGreeting/events/InactivityEvent.ts

// Import required types and base classes
import { BaseEvent, EventPriority, type EventResponse, type ImageData } from '../types';

/**
 * InactivityEvent:
 * This event triggers when the system detects inactivity or after a set delay.
 * It displays a random image with a funny/sarcastic message to the user.
 */
export class InactivityEvent extends BaseEvent {
  // A unique identifier for this event (used by the event hub)
  eventId = 'inactivity_event';

  private probability = 50; // 50% chance by default
  private waitTime = 1000; // in milisec
  private Priority = EventPriority.MEDIUM;

  /**
   * Array of images and text that will be randomly displayed
   * - We omit 'id' because it will be added dynamically by the hub when needed.
   * - Each object contains:
   *    src: URL of the image
   *    position: Where the image should appear on the screen (e.g., bottom-left)
   *    size: The size of the image (e.g., small, medium, large)
   *    text: A funny/sarcastic message to show with the image
   */
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

  /**
   * Constructor:
   * - Calls parent constructor (BaseEvent)
   * - Initializes the listener for user activity
   * - Sets a timer to trigger the event after 2 seconds (for demo purposes)
   */
  constructor() {
    super(); // Call BaseEvent constructor

    this.initializeListener(); // Hook up any activity listeners  very important , must be called

    // DEMO: Automatically trigger this event after 2 seconds
    setTimeout(() => {
      this.requestDisplay(); // Requests the hub to display this event
    }, 2000);

    // Example of triggering repeatedly every 2 minutes:
    // setInterval(() => this.requestDisplay(), 120000); // 2 minutes
  }

  /**
   * Determines if the event can be triggered.
   * For inactivity, the hub controls when this is called, so we return true.
   */
  canTrigger(): boolean {
    // This event is triggered by the hub, so we always allow it to trigger
    // you can also set random function so that it randomly true or false or soem event match 
    return true;
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
   * Returns a random image/text combination from our array.
   * The hub will use this data to render the event.
   */
  getImageData(): Omit<ImageData, 'id'> {
    const randomIndex = Math.floor(Math.random() * this.inactivityImages.length);
    return this.inactivityImages[randomIndex];
  }

  /**
   * Handles user interaction responses from the hub.
   * For example, if the user clicks the image, we can log it or trigger another action.
   */
  onEventResponse(response: EventResponse): void {
    if (response.action === 'clicked') {
      console.log('User interacted with inactivity event. Maybe show a welcome back message.');
    }
  }
}
