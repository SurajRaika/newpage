/**
 * Tasks Management Class
 * Handles tasks/goals visibility toggle
 */
export class TasksManager {
  constructor() {
    this.storageKey = 'goalsEnabled';
    this.eventName = 'toggle-tasks';

    // Initialize default state (enabled)
    if (localStorage.getItem(this.storageKey) === null) {
      localStorage.setItem(this.storageKey, 'true');
    }
  }

  /**
   * Check if tasks are currently enabled
   * @returns {boolean} Tasks enabled status
   */
  isTasksEnabled() {
    return localStorage.getItem(this.storageKey) === 'true';
  }

  /**
   * Toggle tasks visibility
   */
  toggleTasks() {
    const newState = !this.isTasksEnabled();
    localStorage.setItem(this.storageKey, newState.toString());
    
    // Dispatch custom event for other components
    const event = new CustomEvent(this.eventName, { detail: { newState } });
    document.dispatchEvent(event);
  }

  /**
   * Get tasks button text based on current state
   * @returns {string} Button text
   */
  getTasksButtonText() {
    return this.isTasksEnabled() ? 'Disable Tasks' : 'Enable Tasks';
  }
}
