// /home/karma/Documents/astro_tailwind_config/src/components/DynamicGreeting/utils.ts
import type { ImageData } from './types';

export class EventUtils {
  static readonly IMAGE_SIZE_CLASSES: Record<ImageData['size'], string> = {
    'small': 'max-h-[20vh]',
    'medium': 'max-h-[25vh]',
    'large': 'max-h-[40vh]'
  };

  /**
   * Creates the HTML element for a greeting event based on ImageData.
   * @param imageData The data describing the element to create.
   * @returns The fully constructed HTMLElement, ready to be added to the DOM.
   */
  static createImageElement(imageData: ImageData): HTMLElement {
    const container = document.createElement('div');
    container.className = 'fixed overflow-visible opacity-0 pointer-events-none z-50 transition-opacity duration-300 flex items-center p-0 px-0.5';
    container.dataset.eventId = imageData.id;

    // Positioning logic
    const positionClasses = {
      'top-left': 'top-0 left-0',
      'top-right': 'top-0 right-0',
      'bottom-left': 'bottom-0 left-0',
      'bottom-right': 'bottom-0 right-0',
      'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
    };
    container.classList.add(...positionClasses[imageData.position].split(' '));

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'flex items-center gap-3 relative'; // Relative for close button
// Define font size classes for different image sizes
const FONT_SIZE_CLASSES = {
  small: 'text-base',
  medium: 'text-lg',
  large: 'text-xl'
};

// Image element
const img = document.createElement('img');
img.src = imageData.src;
img.id="greeting_image"
img.alt = 'Greeting Image';
img.className = `w-auto object-contain  drop-shadow-white rounded-md ${this.IMAGE_SIZE_CLASSES[imageData.size]}`;

// Text element
const text = document.createElement('div');
text.className = `font-schoolbell p-3 rounded-lg max-w-[220px] text-[rgb(var(--color-text-primary))] shadow-sm ${FONT_SIZE_CLASSES[imageData.size]}`;
text.textContent = imageData.text;
    // Order image and text based on screen position for better layout
    if (imageData.position.includes('left')) {
      contentWrapper.append(img, text);
    } else {
      contentWrapper.append(text, img);
    }

    container.appendChild(contentWrapper);
    return container;
  }
}