  const currentTimeSpan = document.getElementById('current-time');
  const loadingAnimationElement = document.getElementById('loading-animation');

  function updateTime() {
    const now = new Date();
    const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

    const formattedDate = now.toLocaleDateString('en-US', dateOptions);
    const formattedTime = now.toLocaleTimeString('en-US', timeOptions);

    currentTimeSpan.textContent = `${formattedDate} · ${formattedTime}`;

    // Show time and hide loader on first load
    if (loadingAnimationElement.style.display !== 'none') {
      loadingAnimationElement.style.display = 'none';
      currentTimeSpan.classList.remove('hidden');
      currentTimeSpan.classList.add('fade-in-up');
    }
  }

  // Initial update after 500ms to simulate loading
  setTimeout(updateTime, 500);

  // Update every minute
  setInterval(updateTime, 60 * 1000);
