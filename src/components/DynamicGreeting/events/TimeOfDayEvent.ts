
import { BaseEvent, EventPriority, type EventResponse, type ImageData } from '../types';

export class TimeOfDayEvent extends BaseEvent {
  eventId = 'time_of_day_event';
  private localStorageKey = 'time_of_day_event_expiry';

  private greetings: { [key: string]: Array<{ texts: string[]; src: string; position: 'top-right' | 'bottom-left' | 'top-left' | 'bottom-right'; size: 'small' | 'medium' | 'large'; }> } = {
    morning: [
      {
        texts: ["Good Morning! Have a great day!", "Rise and shine!", "Morning, sunshine!"],
        src: 'https://i.pinimg.com/564x/76/ee/49/76ee4939f5dcf57605ed76d9c6f475bf.jpg',
        position: 'top-right',
        size: 'small'
      },
      {
        texts: ["A new day, a new beginning!", "Good morning! Let's make it a good one."],
        src: 'https://i.pinimg.com/564x/76/ee/49/76ee4939f5dcf57605ed76d9c6f475bf.jpg',
        position: 'top-left',
        size: 'medium'
      }
    ],
    afternoon: [
      {
        texts: ["Good Afternoon! Hope you're having a productive day!", "Midday greetings!", "Time for a quick break?"],
        src: 'https://i.pinimg.com/564x/76/ee/49/76ee4939f5dcf57605ed76d9c6f475bf.jpg',
        position: 'top-right',
        size: 'small'
      },
      {
        texts: ["Afternoon vibes!", "Keep up the great work this afternoon!"],
        src: 'https://i.pinimg.com/564x/76/ee/49/76ee4939f5dcf57605ed76d9c6f475bf.jpg',
        position: 'bottom-right',
        size: 'medium'
      }
    ],
    evening: [
      {
        texts: [
  "Bhai, so ja na ab toh 😴",
  "Tu abhi bhi kaam kar raha hai? 😳",
  "Phir se all-nighter? Kya hi dedication hai 😂",
  "Neend nahi aa rahi ya kaam khatam nahi ho raha? 😅",
  "Chhod na ab, kal dekh lenge. Soya ja! 🌙",
  "Bhai, raat ke is time pe bhi active? 😐",
  "Work-life balance ka naam suna hai? 😜"
],
        src: 'https://i.pinimg.com/474x/04/be/c4/04bec46856edd7d9014fa4a81980c90e.jpg',
        position: 'top-right',
        size: 'small'
      },
      {
        texts: ["Unwind and recharge.", "Hope you had a good day!"],
        src: 'https://i.pinimg.com/564x/76/ee/49/76ee4939f5dcf57605ed76d9c6f475bf.jpg',
        position: 'bottom-left',
        size: 'medium'
      }
    ],
    night: [
     {
        texts: [
  "Bhai, so ja na ab toh 😴",
  "Tu abhi bhi kaam kar raha hai? 😳",
  "Phir se all-nighter? Kya hi dedication hai 😂",
  "Neend nahi aa rahi ya kaam khatam nahi ho raha? 😅",
  "Chhod na ab, kal dekh lenge. Soya ja! 🌙",
  "Bhai, raat ke is time pe bhi active? 😐",
  "Work-life balance ka naam suna hai? 😜"
],
        src: 'https://i.pinimg.com/474x/04/be/c4/04bec46856edd7d9014fa4a81980c90e.jpg',
        position: 'top-right',
        size: 'small'
      },
     
    ]
  };

  private currentGreetingKey: string = '';

  constructor() {
    super();
            this.initializeListener();

    setTimeout(() => {
      this.requestDisplay();
    }, 2000);


  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'morning';
    } else if (hour >= 12 && hour < 17) {
      return 'afternoon';
    } else if (hour >= 17 && hour < 21) {
      return 'evening';
    } else {
      return 'night';
    }
  }

  canTrigger(): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return true; // Cannot store in localStorage, so always allow triggering
    }

    const expiryTime = localStorage.getItem(this.localStorageKey);
    if (expiryTime) {
      const now = new Date().getTime();
      if (now < parseInt(expiryTime, 10)) {
        return false; // Still within the cool-down period
      }
    }
    this.currentGreetingKey = this.getTimeOfDay();
    return true;
  }

  getPriority(): EventPriority {
    return EventPriority.HIGH;
  }

  getImageData(): Omit<ImageData, 'id'> {
    const timeOfDayImages = this.greetings[this.currentGreetingKey];
    const selectedImage = timeOfDayImages[Math.floor(Math.random() * timeOfDayImages.length)];
    const selectedText = selectedImage.texts[Math.floor(Math.random() * selectedImage.texts.length)];
    return { ...selectedImage, text: selectedText };
  }

  onEventResponse(response: EventResponse): void {
    if (response.action === 'clicked' || response.action === 'dismissed') {
        const expiryTime = new Date().getTime() + (60 * 60 * 1000); // 1 hour from now
        localStorage.setItem(this.localStorageKey, expiryTime.toString());
    }
  }
}
