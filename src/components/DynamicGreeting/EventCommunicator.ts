import { DynamicGreetingHub } from './index';
import { EventPriority, ImageData } from './types';
import type { EventRequest, EventResponse } from './types';

export class EventCommunicator {
  private static instance: EventCommunicator;
  private hub: DynamicGreetingHub | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor() {
    //console.log('EventCommunicator: Constructor called.');
  }

  static getInstance(): EventCommunicator {
    if (!EventCommunicator.instance) {
      EventCommunicator.instance = new EventCommunicator();
      //console.log('EventCommunicator: New instance created.');
    }
    //console.log('EventCommunicator: getInstance called, returning instance.');
    return EventCommunicator.instance;
  }

  setHub(hub: DynamicGreetingHub): void {
    this.hub = hub;
    //console.log('EventCommunicator: setHub called with hub:', hub);
  }

  // Events call this to request display
  requestDisplay(eventId: string, priority: EventPriority, imageData: ImageData, metadata?: any): void {
    //console.log('EventCommunicator: requestDisplay called with eventId:', eventId, 'priority:', priority, 'imageData:', imageData, 'metadata:', metadata);
    if (this.hub) {
      //console.log('EventCommunicator: Forwarding request to hub.');
      this.hub.handleEventRequest({
        eventId,
        priority,
        imageData,
        metadata
      });
    } else {
      console.warn('EventCommunicator: Hub not set, cannot request display.');
    }
  }

  // Hub calls this to send responses back to events
  sendEventResponse(response: EventResponse): void {
    //console.log('EventCommunicator: sendEventResponse called with response:', response);
    this.emit(`response_${response.eventId}`, response);
  }

  // Event system for internal communication
  on(eventName: string, callback: Function): void {
    //console.log('EventCommunicator: on called for eventName:', eventName);
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
      //console.log('EventCommunicator: Created new listener array for eventName:', eventName);
    }
    this.eventListeners.get(eventName)!.push(callback);
    //console.log('EventCommunicator: Added callback for eventName:', eventName);
  }

  off(eventName: string, callback: Function): void {
    //console.log('EventCommunicator: off called for eventName:', eventName);
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
        //console.log('EventCommunicator: Removed callback for eventName:', eventName);
      } else {
        //console.log('EventCommunicator: Callback not found for eventName:', eventName);
      }
    } else {
      //console.log('EventCommunicator: No listeners found for eventName:', eventName);
    }
  }

  emit(eventName: string, data?: any): void {
    //console.log('EventCommunicator: emit called for eventName:', eventName, 'with data:', data);
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      //console.log('EventCommunicator: Found listeners for eventName:', eventName, 'count:', listeners.length);
      listeners.forEach(callback => callback(data));
    } else {
      //console.log('EventCommunicator: No listeners to emit for eventName:', eventName);
    }
  }
}