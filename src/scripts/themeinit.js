(function() {
  const themePreference = localStorage.getItem('themePreference');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (themePreference === 'dark' || (themePreference === null && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
})();