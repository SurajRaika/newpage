import type { ImageData } from './types';

// Callbacks the UI component will use to communicate with the Hub
export interface UICallbacks {
  onClick: () => void;
  onDismiss: () => void;
  onTimeout: () => void;
}

export class GreetingUI {
  private container: HTMLElement;
  private currentElement: HTMLElement | null = null;
  private timeoutId: number | null = null;
  
  constructor(container: HTMLElement = document.body) {
    this.container = container;
  }
  
  /**
   * Creates and displays the greeting element on the screen.
   */
  public display(imageData: ImageData, duration: number, callbacks: UICallbacks): void {
    // If another greeting is somehow already present, remove it first
    if (this.currentElement) {
      this.hide();
    }
    
    this.currentElement = this.createImageElement(imageData);
    const closeButton = this.createCloseButton();
    
    // Wire up events to the provided callbacks
    closeButton.onclick = (e) => {
      e.stopPropagation();
      callbacks.onDismiss();
    };
    this.currentElement.addEventListener('click', callbacks.onClick);
    
    // Append elements to the DOM
    this.currentElement.querySelector('.flex')?.appendChild(closeButton);
    this.container.appendChild(this.currentElement);
    
    // Trigger fade-in animation
    requestAnimationFrame(() => {
        if (!this.currentElement) return;
        this.currentElement.style.opacity = '1';
        this.currentElement.style.pointerEvents = 'auto';
    });
    
    // Set up auto-dismiss timer if a duration is provided
    if (duration > 0) {
        this.timeoutId = window.setTimeout(callbacks.onTimeout, duration);
    }
  }

  /**
   * Hides and removes the current greeting element from the DOM.
   * Returns a promise that resolves when the hide animation is complete.
   */
  public hide(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.currentElement) {
        resolve();
        return;
      }
      
      // Clear any pending auto-dismiss timers
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }

      const el = this.currentElement;
      this.currentElement = null;
      
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';

      setTimeout(() => {
        el.remove();
        resolve();
      }, 300); // Match CSS transition duration
    });
  }

  private createImageElement(imageData: ImageData): HTMLElement {
    // This logic is moved from the old EventUtils
    const wrapper = document.createElement('div');
    wrapper.id = `greeting-${imageData.id}`;
    wrapper.className = 'fixed bottom-5 right-5 w-80 bg-white rounded-lg shadow-2xl p-4 transition-opacity duration-300 opacity-0 pointer-events-none z-50 cursor-pointer';
    wrapper.innerHTML = `
      <div class="flex items-start space-x-4">
        <img src="${imageData.url}" alt="${imageData.alt}" class="w-16 h-16 object-cover rounded-md">
        <div class="flex-1">
          <h3 class="font-bold text-gray-800">${imageData.title}</h3>
          <p class="text-sm text-gray-600">${imageData.message}</p>
        </div>
      </div>
    `;
    return wrapper;
  }
  
  private createCloseButton(): HTMLElement {
    const button = document.createElement('button');
    button.innerHTML = '×';
    button.className = 'absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-lg font-bold flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer z-10';
    return button;
  }
}