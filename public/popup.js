// popup.js

const listEl = document.getElementById("list");
const refreshBtn = document.getElementById("refresh");
const clearBtn = document.getElementById("clear");
const filterEl = document.getElementById("filter");

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function openUrl(url) {
  // Don't try to open our placeholder "Closed tab" URLs
  if (url.startsWith("Closed tabId:")) return;
  chrome.tabs.create({ url });
}

function render(visits) {
  listEl.innerHTML = "";
  if (!visits || visits.length === 0) {
    listEl.innerText = "No history recorded. Browse a bit and click Refresh!";
    return;
  }

  const filter = filterEl.value;

  // iterate in reverse (latest first)
  for (let i = visits.length - 1; i >= 0; i--) {
    const v = visits[i];
    if (filter !== "all") {
      if (!v.action || v.action.indexOf(filter) === -1) continue;
    }

    const div = document.createElement("div");
    div.className = "entry";

    // Create a title element
    const titleDiv = document.createElement("div");
    titleDiv.className = "title";
    titleDiv.textContent = v.title || "(No Title)"; // Display the title
    
    const urlDiv = document.createElement("div");
    urlDiv.className = "url";
    urlDiv.textContent = v.url;
    urlDiv.title = `Click to open: ${v.url}`;
    urlDiv.addEventListener("click", () => openUrl(v.url));

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${formatTime(v.timeISO)} — tabId:${v.tabId} — ${v.action}`;

    // Add the title above the URL
    div.appendChild(titleDiv);
    div.appendChild(urlDiv);
    div.appendChild(meta);
    listEl.appendChild(div);
  }
}

function load() {
  chrome.storage.local.get({ visits: [] }, (data) => {
    render(data.visits || []);
  });
}

refreshBtn.addEventListener("click", load);

clearBtn.addEventListener("click", () => {
  if (!confirm("Clear all recorded history?")) return;
  chrome.storage.local.set({ visits: [] }, () => {
    load();
  });
});

filterEl.addEventListener("change", load);

// initial load
load();