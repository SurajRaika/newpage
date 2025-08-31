document.addEventListener('DOMContentLoaded', () => {
    const historyList = document.getElementById('historyList');

    function formatTime(iso) {
        const d = new Date(iso);
        return d.toLocaleString();
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
            const pageFirstTitle = visit.pageFirstTitle || '(No First Title)';
            const url = visit.url || '(No URL)';
            const time = formatTime(visit.timeISO);
            const action = visit.action || 'unknown';
            const visibleText = visit.visibleText || 'NOTHING';
            const tabId = visit.tabId !== undefined ? `<span>Tab ID: ${visit.tabId}</span><br>` : '';
            const description = visit.description ? `<br><span>Description: ${visit.description}</span>` : '';
            const extractedContent = visit.extractedContent ? `<br><span>Extracted Content (partial): ${visit.extractedContent.substring(0, 200)}...</span>` : '';

            if (visibleText == 'NOTHING') {
return false;                
            }
            

            let rawData = '';
            for (const key in visit) {
                if (!['title', 'pageFirstTitle', 'url', 'timeISO', 'action', 'tabId', 'description', 'extractedContent'].includes(key)) {
                    rawData += `<br><span>${key}: ${JSON.stringify(visit[key])}</span>`;
                }
            }

            div.innerHTML = `
                <strong><a href="${visit.url}" target="_blank">${title}</a></strong>
                <span>tabId: ${tabId}</span><br>
                <span>URL: ${url}</span><br>
                <span>Time: ${time}</span><br>
                <span>Action: ${action}</span><br>
                
                <span>visibleText: ${visibleText}</span><br>
                <span>description: ${description}</span><br>
            `;
            historyList.appendChild(div);
        });
    }

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get({ visits: [] }, (data) => {
            renderHistory(data.visits);
        });
    } else {
        historyList.innerText = 'Chrome extension storage not available.';
    }
});
