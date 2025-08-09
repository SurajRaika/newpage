let isInitialized = false;
    let animationFrameId = null;

    function updateProgressBar(type, percent, animate = true) {
        let progressBar;
        let percentText;

        if (type === 'day') {
            progressBar = document.getElementById('day-progress-bar');
            percentText = document.getElementById('day-remaining-percent');
        }

        if (progressBar && percentText) {
            const clampedPercent = Math.max(0, Math.min(100, percent));
            
            if (animate) {
                // Always animate smoothly
                progressBar.style.width = `${clampedPercent}%`;
                animateNumber(percentText, parseFloat(percentText.textContent), clampedPercent, 1000);
            } else {
                // Immediate update without animation
                progressBar.style.width = `${clampedPercent}%`;
                percentText.textContent = clampedPercent.toFixed(1);
            }
        }
    }

    function animateNumber(element, startValue, endValue, duration) {
        const startTime = performance.now();
        const difference = endValue - startValue;

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use easeOutCubic for smooth deceleration
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const currentValue = startValue + (difference * easeOutCubic);
            
            element.textContent = currentValue.toFixed(1);
            
            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            }
        }
        
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        requestAnimationFrame(animate);
    }

    function updateDayProgress() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDay = now.getDate();

        // Use stored wake/sleep times or fall back to defaults
        const wakeTime = localStorage.getItem('wakeTime') || '06:00';
        const sleepTime = localStorage.getItem('sleepTime') || '22:00';

        const [wakeHour, wakeMinute] = wakeTime.split(':').map(Number);
        const [sleepHour, sleepMinute] = sleepTime.split(':').map(Number);

        const startOfActiveDay = new Date(currentYear, currentMonth, currentDay, wakeHour, wakeMinute, 0);
        const endOfActiveDay = new Date(currentYear, currentMonth, currentDay, sleepHour, sleepMinute, 0);

        // Handle cases where sleep time might be on the next day
        if (sleepHour < wakeHour) {
            endOfActiveDay.setDate(endOfActiveDay.getDate() + 1);
        }

        let remainingPercent;

        if (now < startOfActiveDay) {
            remainingPercent = 100; // Before active day, show 100% remaining
        } else if (now > endOfActiveDay) {
            remainingPercent = 0; // After active day, show 0% remaining
        } else {
            const totalMillisecondsInActiveDay = endOfActiveDay.getTime() - startOfActiveDay.getTime();
            const elapsedMillisecondsInActiveDay = now.getTime() - startOfActiveDay.getTime();
            const elapsedPercent = (elapsedMillisecondsInActiveDay / totalMillisecondsInActiveDay) * 100;
            remainingPercent = 100 - elapsedPercent;
        }

        updateProgressBar('day', remainingPercent, isInitialized);
    }

    function initializeProgress() {
        // Calculate the target progress value
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDay = now.getDate();

        const wakeTime = localStorage.getItem('wakeTime') || '06:00';
        const sleepTime = localStorage.getItem('sleepTime') || '22:00';

        const [wakeHour, wakeMinute] = wakeTime.split(':').map(Number);
        const [sleepHour, sleepMinute] = sleepTime.split(':').map(Number);

        const startOfActiveDay = new Date(currentYear, currentMonth, currentDay, wakeHour, wakeMinute, 0);
        const endOfActiveDay = new Date(currentYear, currentMonth, currentDay, sleepHour, sleepMinute, 0);

        if (sleepHour < wakeHour) {
            endOfActiveDay.setDate(endOfActiveDay.getDate() + 1);
        }

        let targetPercent;

        if (now < startOfActiveDay) {
            targetPercent = 100;
        } else if (now > endOfActiveDay) {
            targetPercent = 0;
        } else {
            const totalMillisecondsInActiveDay = endOfActiveDay.getTime() - startOfActiveDay.getTime();
            const elapsedMillisecondsInActiveDay = now.getTime() - startOfActiveDay.getTime();
            const elapsedPercent = (elapsedMillisecondsInActiveDay / totalMillisecondsInActiveDay) * 100;
            targetPercent = 100 - elapsedPercent;
        }
        
        // Small delay to ensure DOM is ready, then animate from 0 to target
        setTimeout(() => {
            isInitialized = true;
            updateProgressBar('day', targetPercent, true);
        }, 50);
    }

    // Handle different loading scenarios
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeProgress);
    } else if (document.readyState === 'interactive') {
        // DOM is ready but resources might still be loading
        setTimeout(initializeProgress, 0);
    } else {
        // Document is completely loaded
        initializeProgress();
    }

    // Update every minute after initialization
    document.addEventListener('DOMContentLoaded', () => {
        setInterval(updateDayProgress, 60 * 1000);
    });

    // Handle visibility changes to update when tab becomes active
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && isInitialized) {
            updateDayProgress();
        }
    });