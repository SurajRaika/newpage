const searchEnginePlaceholders = {
        google: "Search Google...",
        perplexity: "Search Perplexity...",
        youtube: "Search YouTube...",
        chatgpt: "Search ChatGPT...",
        history: "View search history or search Google..."
    };
    const EngineManager = (() => {
        const engineSelection = document.getElementById('engine-selection');
        const searchInput = document.getElementById('search-input');
        const radioButtons = document.querySelectorAll('input[name="engine"]');
        const activeLine = document.getElementById('active-line');
        const engineLabels = Array.from(document.querySelectorAll('.engine-label input[name="engine"]'));
        const updateActiveLinePosition = () => {
            const currentRadio = document.querySelector('input[name="engine"]:checked');
            if (!currentRadio || !activeLine) return;
            const parentLabel = currentRadio.closest('.engine-label');
            if (!parentLabel) return;
            const parentRect = engineSelection.getBoundingClientRect();
            const labelRect = parentLabel.getBoundingClientRect();
            activeLine.style.left = `${labelRect.left - parentRect.left}px`;
            activeLine.style.width = `${labelRect.width}px`;
        };
        const updateUI = () => {
            const selectedEngine = document.querySelector('input[name="engine"]:checked').value;
            searchInput.placeholder = searchEnginePlaceholders[selectedEngine];
            setTimeout(updateActiveLinePosition, 0);
            const eventToShow = selectedEngine === 'history' ? 'show-history' : 'hide-history';
            document.dispatchEvent(new CustomEvent(eventToShow));
        };
        const switchEngine = (key) => {
            const engineMap = { 'p': 'perplexity', 'g': 'google', 'y': 'youtube', 'c': 'chatgpt', 'h': 'history' };
            if (engineMap[key]) {
                const radio = document.querySelector(`input[name="engine"][value="${engineMap[key]}"]`);
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change'));
                }
                return;
            }
            if (key === 'arrowleft' || key === 'arrowright') {
                const currentIndex = engineLabels.findIndex(radio => radio.checked);
                const offset = (key === 'arrowright') ? 1 : -1;
                const newIndex = (currentIndex + offset + engineLabels.length) % engineLabels.length;
                engineLabels[newIndex].checked = true;
                engineLabels[newIndex].dispatchEvent(new Event('change'));
            }
        };
        const init = () => {
            radioButtons.forEach(radio => radio.addEventListener('change', updateUI));
            window.addEventListener('resize', updateActiveLinePosition);
            document.addEventListener('update-active-line', updateActiveLinePosition);
            document.addEventListener('keydown', (e) => {
                const key = e.key.toLowerCase();
                const isInputActive = document.activeElement.tagName === 'INPUT';
                const engineSwitchKeys = ['p', 'g', 'y', 'c', 'h', 'arrowleft', 'arrowright'];
                if (engineSwitchKeys.includes(key)) {
                    if (isInputActive && e.altKey) {
                        e.preventDefault();
                        switchEngine(key);
                    } else if (!isInputActive) {
                        e.preventDefault();
                        switchEngine(key);
                    }
                }
            });
            updateUI();
        };
        return { init, updateActiveLinePosition };
    })();
    EngineManager.init();