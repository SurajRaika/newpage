document.addEventListener('DOMContentLoaded', () => {
        const historyList = document.getElementById('historyList');
        const downloadBtn = document.getElementById('downloadBtn');
        const darkModeBtn = document.getElementById('darkModeBtn');

        // Check for saved dark mode preference
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
        }

        darkModeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');

            // Save preference to localStorage
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('darkMode', 'enabled');
            } else {
                localStorage.setItem('darkMode', 'disabled');
            }
        });

        function formatTime(iso) {
            const d = new Date(iso);
            return d.toLocaleString();
        }

        function getFavicon(url) {
            try {
                const domain = new URL(url).hostname;
                return `https://www.google.com/s2/favicons?domain=${domain}`;
            } catch {
                return '';
            }
        }

        function renderHistory(visits) {
            historyList.innerHTML = '';
            if (!visits || visits.length === 0) {
                historyList.innerText = 'No visited pages recorded yet.';
                return;
            }

            // Display in reverse chronological order (most recent first)
            visits.slice().reverse().forEach(visit => {
                const div = document.createElement('div');
                div.className = 'visit-item';

                const title = visit.title || '(No Title)';
                const url = visit.url || '(No URL)';
                const time = formatTime(visit.timeISO);
                const action = visit.action || 'unknown';
                let visibleText = visit.visibleText || 'NOTHING';

                if (typeof visibleText === 'string' && visibleText.startsWith('[')) {
                    try {
                        const blocks = JSON.parse(visibleText);
                        visibleText = blocks.map(block => `&lt;${block.tag}&gt; ${block.text}`).join('<br>');
                    } catch (e) {
                        // Not a valid JSON string, leave as is
                    }
                }


                const tabId = visit.tabId !== undefined ? `<span>Tab ID: ${visit.tabId}</span><br>` : '';
                const description = visit.description ? `<span>Description: ${visit.description}</span><br>` : '';
                const favicon = getFavicon(url);

                if (visibleText === 'NOTHING') {
                    return;
                }

                div.innerHTML = `
                    <div class="visit-header">
                        <img class="favicon" src="${favicon}" alt="">
                        <strong><a href="${url}" target="_blank">${title}</a></strong>
                    </div>
                    ${tabId}
                    <span>URL: ${url}</span><br>
                    <span>Time: ${time}</span><br>
                    <span>Action: ${action}</span><br>
                    <span>Visible Text: ${visibleText}</span><br>
                    ${description}
                `;
                historyList.appendChild(div);
            });
        }

        // Download as JSON
        downloadBtn.addEventListener('click', () => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get({ visits: [] }, (data) => {
                    const blob = new Blob([JSON.stringify(data.visits, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'visited_history.json';
                    a.click();
                    URL.revokeObjectURL(url);
                });
            } else {
                alert('Chrome extension storage not available.');
            }
        });

        // Load history
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get({ visits: [] }, (data) => {
                renderHistory(data.visits);
            });
        } else {
            historyList.innerText = 'Chrome extension storage not available.';
        }
    });