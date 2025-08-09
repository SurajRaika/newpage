/**
 * Theme Management Class
 * Handles theme switching and persistence
 */
export class ThemeManager {
  constructor() {
    this.themes = {
      LIGHT: 'light',
      DARK: 'dark'
    };
    this.storageKey = 'themePreference';
  }

  /**
   * Get current theme from DOM
   * @returns {string} Current theme
   */
  getCurrentTheme() {
    return document.documentElement.classList.contains('dark') 
      ? this.themes.DARK 
      : this.themes.LIGHT;
  }

  /**
   * Apply theme to the document
   * @param {string} theme - Theme to apply
   */
  applyTheme(theme) {
    const html = document.documentElement;

    if (theme === this.themes.LIGHT) {
      html.classList.remove('dark');
    
    } else {
      html.classList.add('dark');
    
    }

    this.saveThemePreference(theme);
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === this.themes.DARK 
      ? this.themes.LIGHT 
      : this.themes.DARK;
    this.applyTheme(newTheme);
  }

  /**
   * Get theme button text based on current theme
   * @returns {string} Button text
   */
  getThemeButtonText() {
    return this.getCurrentTheme() === this.themes.LIGHT 
      ? 'Dark Mode' 
      : 'Light Mode';
  }

  /**
   * Save theme preference to localStorage
   * @param {string} theme - Theme to save
   */
  saveThemePreference(theme) {
    localStorage.setItem(this.storageKey, theme);
  }

  /**
   * Load theme preference from localStorage
   * @returns {string} Saved theme or default
   */
  loadThemePreference() {
    return localStorage.getItem(this.storageKey) || this.themes.LIGHT;
  }
}
