import { TasksManager } from './utils/tasks.js';
  import { ThemeManager } from './utils/theme.js';

  /**
   * More Menu Class
   * Handles menu visibility and interactions
   */
  class MoreMenu {
    constructor() {
      this.transitionDuration = 200; // milliseconds
      this.showClass = 'show';
      
      // Get DOM elements
      this.elements = {
        button: document.getElementById('more-button'),
        menu: document.getElementById('more-menu'),
        themeToggle: document.getElementById('theme-toggle'),
        tasksToggle: document.getElementById('tasks-toggle')
      };

      // Initialize managers
      this.themeManager = new ThemeManager();
      this.tasksManager = new TasksManager();

      // Bind methods to preserve context
      this.show = this.show.bind(this);
      this.hide = this.hide.bind(this);
      this.toggle = this.toggle.bind(this);
      this.handleOutsideClick = this.handleOutsideClick.bind(this);
      this.handleEscapeKey = this.handleEscapeKey.bind(this);
      this.handleThemeToggle = this.handleThemeToggle.bind(this);
      this.handleTasksToggle = this.handleTasksToggle.bind(this);
    }

    /**
     * Initialize the menu system
     */
    init() {
      this.updateButtonTexts();
      this.attachEventListeners();
    }

    /**
     * Update button texts based on current states
     */
    updateButtonTexts() {
      this.elements.themeToggle.textContent = this.themeManager.getThemeButtonText();
      this.elements.tasksToggle.textContent = this.tasksManager.getTasksButtonText();
    }

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
      // More button click
      this.elements.button.addEventListener('click', this.handleButtonClick.bind(this));
      
      // Theme toggle
      this.elements.themeToggle.addEventListener('click', this.handleThemeToggle);
      
      // Tasks toggle
      this.elements.tasksToggle.addEventListener('click', this.handleTasksToggle);
      
      // Outside click
      document.addEventListener('click', this.handleOutsideClick);
      
      // Escape key
      document.addEventListener('keydown', this.handleEscapeKey);
    }

    /**
     * Handle more button click
     * @param {Event} e - Click event
     */
    handleButtonClick(e) {
      e.stopPropagation();
      this.toggle();
    }

    /**
     * Handle theme toggle click
     */
    handleThemeToggle() {
      this.themeManager.toggleTheme();
      this.updateButtonTexts();
      this.hide();
    }

    /**
     * Handle tasks toggle click
     */
    handleTasksToggle() {
      this.tasksManager.toggleTasks();
      this.updateButtonTexts();
      this.hide();
    }

    /**
     * Handle clicks outside the menu
     * @param {Event} e - Click event
     */
    handleOutsideClick(e) {
      if (this.isVisible() && 
          !this.elements.menu.contains(e.target) && 
          e.target !== this.elements.button) {
        this.hide();
      }
    }

    /**
     * Handle escape key press
     * @param {Event} e - Keyboard event
     */
    handleEscapeKey(e) {
      if (e.key === 'Escape' && this.isVisible()) {
        this.hide();
      }
    }

    /**
     * Check if menu is currently visible
     * @returns {boolean} Visibility state
     */
    isVisible() {
      return this.elements.menu.classList.contains(this.showClass);
    }

    /**
     * Show the menu
     */
    show() {
      this.elements.menu.classList.add(this.showClass);
      this.elements.menu.style.visibility = 'visible';
      this.elements.menu.style.pointerEvents = 'auto';
    }

    /**
     * Hide the menu
     */
    hide() {
      this.elements.menu.classList.remove(this.showClass);
      
      setTimeout(() => {
        this.elements.menu.style.visibility = 'hidden';
        this.elements.menu.style.pointerEvents = 'none';
      }, this.transitionDuration);
    }

    /**
     * Toggle menu visibility
     */
    toggle() {
      this.isVisible() ? this.hide() : this.show();
    }

    /**
     * Destroy the menu and clean up event listeners
     */
    destroy() {
      this.elements.button.removeEventListener('click', this.handleButtonClick);
      this.elements.themeToggle.removeEventListener('click', this.handleThemeToggle);
      this.elements.tasksToggle.removeEventListener('click', this.handleTasksToggle);
      document.removeEventListener('click', this.handleOutsideClick);
      document.removeEventListener('keydown', this.handleEscapeKey);
    }
  }

  /**
   * Initialize the More Menu when DOM is loaded
   */
  document.addEventListener('DOMContentLoaded', () => {
    const moreMenu = new MoreMenu();
    moreMenu.init();

    // Make available globally if needed for debugging
    window.moreMenu = moreMenu;
  });