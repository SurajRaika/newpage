// UIManager.ts - Handles all UI/UX related operations
import { EventPriority, type EventResponse, type QueuedRequest } from './types';
import { EventUtils } from './utils';

export class UIManager {
  private currentImageElement: HTMLElement | null = null;
  // Reduced duration for a faster, less dramatic fade/slide
  private readonly POPUP_ANIMATION_DURATION = 300; // ms

  /**
   * Creates and displays an event on the screen.
   * Waits for image to load before showing with a subtle animation.
   */
  public async displayEvent(
    request: QueuedRequest, 
    onResponse: (action: EventResponse['action'], request: QueuedRequest) => void
  ): Promise<HTMLElement> {
    console.log(`🎭 [UI] Preparing to display event: ${request.eventId}`);

    // Create the main image element
    this.currentImageElement = EventUtils.createImageElement(request.imageData);
    
    // Add click handler for the main element to handle dismissal
    this.currentImageElement.addEventListener('click', () => onResponse('clicked', request));
    
    // Set initial state for a subtle animation
    this.prepareForSubtleAnimation(request.imageData.position);
    
    // Add to DOM (hidden initially)
    document.body.appendChild(this.currentImageElement);

    // Wait for image to load
    await this.waitForImageLoad();

    console.log(`🎭 [UI] Image loaded, displaying event: ${request.eventId}`);
    
    // Animate in with a subtle effect
    this.animateSubtlyIn();

    // NEW: Call onDisplay if implemented by the event
    if (request.eventInstance && typeof request.eventInstance.onDisplay === 'function') {
      request.eventInstance.onDisplay(() => {
        // This is the hideCallback passed to the event
        // Ensure we only hide if this is still the current displayed request
        if (this.currentImageElement && this.currentImageElement.dataset.eventId === request.imageData.id) {
          onResponse('dismissed', request); // Notify hub that it was dismissed by event itself
        }
      });
    }

    return this.currentImageElement;
  }

  /**
   * Waits for the image within the element to fully load.
   */
  private waitForImageLoad(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.currentImageElement) {
        resolve(); // No element to wait for
        return;
      }

      const imgElement = this.currentImageElement.querySelector('img');
      if (!imgElement) {
        resolve(); // No image to wait for
        return;
      }

      // If image is already loaded
      if (imgElement.complete && imgElement.naturalHeight !== 0) {
        resolve();
        return;
      }

      // Set up load/error handlers
      const onLoad = () => {
        imgElement.removeEventListener('load', onLoad);
        imgElement.removeEventListener('error', onError);
        resolve();
      };

      const onError = () => {
        imgElement.removeEventListener('load', onLoad);
        imgElement.removeEventListener('error', onError);
        console.warn('🖼️ [UI] Image failed to load, showing anyway');
        resolve(); // Show anyway, don't block
      };

      imgElement.addEventListener('load', onLoad);
      imgElement.addEventListener('error', onError);

      // Fallback timeout in case image never loads/errors
      setTimeout(() => {
        imgElement.removeEventListener('load', onLoad);
        imgElement.removeEventListener('error', onError);
        console.warn('🖼️ [UI] Image load timeout, showing anyway');
        resolve();
      }, 5000); // 5 second timeout
    });
  }

  /**
   * Prepares the element for a subtle animation based on position.
   */
  private prepareForSubtleAnimation(position: string): void {
    if (!this.currentImageElement) return;

    // Set initial state - hidden and slightly offset
    this.currentImageElement.style.opacity = '0';
    this.currentImageElement.style.pointerEvents = 'none';
    // Use a standard, simple cubic-bezier for a smooth ease-in effect
    this.currentImageElement.style.transition = `all ${this.POPUP_ANIMATION_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;

    // Position-based initial transforms for subtle sliding
    switch (position.toLowerCase()) {
      case 'top':
      case 'top-left':
      case 'top-right':
        this.currentImageElement.style.transform = 'translateY(-20px)';
        break;
      case 'bottom':
      case 'bottom-left':
      case 'bottom-right':
        this.currentImageElement.style.transform = 'translateY(20px)';
        break;
      case 'left':
      case 'center-left':
        this.currentImageElement.style.transform = 'translateX(-20px)';
        break;
      case 'right':
      case 'center-right':
        this.currentImageElement.style.transform = 'translateX(20px)';
        break;
      case 'center':
      default:
        // For center, a simple fade-in
        this.currentImageElement.style.transform = 'scale(0.95)';
        break;
    }
  }

  /**
   * Animates the popup into view with a subtle effect.
   */
  private animateSubtlyIn(): void {
    if (!this.currentImageElement) return;

    requestAnimationFrame(() => {
      if (!this.currentImageElement) return;
      
      // Animate to final state with no bounce
      this.currentImageElement.style.opacity = '1';
      this.currentImageElement.style.transform = 'translate(0, 0) scale(1)';
      this.currentImageElement.style.pointerEvents = 'auto';
    });
  }

  /**
   * Hides and removes the current event element from the DOM with a subtle animation.
   */
  public hideCurrentEvent(interrupted = false): Promise<void> {
    return new Promise((resolve) => {
      if (!this.currentImageElement) {
        resolve();
        return;
      }

      if (interrupted) {
        console.log(`⚡ [UI] Event was interrupted`);
      }

      // Start subtle exit animation
      this.animateSubtlyOut();

      // Remove from DOM after animation completes
      setTimeout(() => {
        this.currentImageElement?.remove();
        this.currentImageElement = null;
        resolve();
      }, this.POPUP_ANIMATION_DURATION);
    });
  }

  /**
   * Animates the popup out of view with a subtle effect.
   */
  private animateSubtlyOut(): void {
    if (!this.currentImageElement) return;

    // Use a standard, simple cubic-bezier for a smooth ease-out effect
    this.currentImageElement.style.transition = `all ${this.POPUP_ANIMATION_DURATION}ms cubic-bezier(0.42, 0, 0.58, 1)`;

    // Animate opacity and transform for a clean, subtle exit
    this.currentImageElement.style.opacity = '0';
    this.currentImageElement.style.transform = 'translate(0, 0) scale(0.95)'; // Shrink slightly on exit
    this.currentImageElement.style.pointerEvents = 'none';
  }

  /**
   * Sets up auto-dismiss timeout for non-critical events.
   */
  public setupAutoTimeout(
    request: QueuedRequest,
    onTimeout: () => void
  ): number | null {
    // If the event instance has its own onDisplay method, it will handle its own dismissal.
    // So, we don't set up an auto-timeout here to avoid conflicts.
    if (request.eventInstance && typeof request.eventInstance.onDisplay === 'function') {
      return null;
    }

    if (request.priority >= EventPriority.CRITICAL) {
      return null; // Critical events don't auto-dismiss
    }

    const timeoutDuration = this.getTimeoutForPriority(request.priority);
    
    return window.setTimeout(() => {
      onTimeout();
    }, timeoutDuration);
  }

  /**
   * Gets timeout duration based on event priority.
   */
  private getTimeoutForPriority(priority: EventPriority): number {
    switch (priority) {
      case EventPriority.LOW: return 8000;
      case EventPriority.MEDIUM: return 12000;
      case EventPriority.HIGH: return 15000;
      default: return 0; // CRITICAL does not auto-dismiss
    }
  }

  /**
   * Checks if there's currently a UI element being displayed.
   */
  public hasActiveElement(): boolean {
    return this.currentImageElement !== null;
  }

  /**
   * Gets the current active element (for debugging).
   */
  public getCurrentElement(): HTMLElement | null {
    return this.currentImageElement;
  }

  /**
   * Cleanup method to remove any active UI elements.
   */
  public cleanup(): void {
    if (this.currentImageElement) {
      this.currentImageElement.remove();
      this.currentImageElement = null;
    }
  }
}