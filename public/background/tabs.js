// tabs.js
// Tab lifecycle and visit storage

export const storageGet = (keys) => new Promise((res) => chrome.storage.local.get(keys, res));
export const storageSet = (obj) => new Promise((res) => chrome.storage.local.set(obj, res));

function makeVisitId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function saveVisit(visitData) {
  const visitId = makeVisitId();
  const visit = { visitId, ...visitData };

  const data = await storageGet({ visits: [], latestVisitByTab: {} });
  const visits = Array.isArray(data.visits) ? data.visits : [];
  const latestVisitByTab = data.latestVisitByTab || {};

  visits.push(visit);
  latestVisitByTab[visit.tabId] = visitId;

  await storageSet({ visits, latestVisitByTab });
  return visitId;
}

export async function updateVisitWithContentData(visitId, contentData = {}) {
  const data = await storageGet({ visits: [] });
  const visits = Array.isArray(data.visits) ? data.visits : [];

  const index = visits.findIndex(v => v.visitId === visitId);
  if (index === -1) return { success: false, error: "Visit not found" };

  const updatedVisit = {
    ...visits[index],
    description: contentData.description || '',
    visibleText: contentData.visibleText || '',
    contentCapturedAt: new Date().toISOString(),
    hasContent: !!(contentData.description || contentData.visibleText)
  };

  visits[index] = updatedVisit;
  await storageSet({ visits });

  return { success: true, visitId, updatedVisit };
}

export function setupTabListeners() {




  chrome.tabs.onCreated.addListener((tab) => {
    saveVisit({
      tabId: tab.id,
      url: tab.pendingUrl || tab.url || '',
      title: tab.title || "New Tab",
      timeISO: new Date().toISOString(),
      action: "created"
    });
  });

  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
      saveVisit({
        tabId: tab.id,
        url: tab.url,
        title: tab.title || "New Tab",
        timeISO: new Date().toISOString(),
        action: "updated"
      });
    }
  });

  chrome.tabs.onRemoved.addListener(async (tabId) => {
    const data = await storageGet({ visits: [], latestVisitByTab: {} });
    const visits = Array.isArray(data.visits) ? data.visits : [];
    const latestVisitByTab = data.latestVisitByTab || {};

    const visitId = latestVisitByTab[tabId];
    if (visitId) {
      const index = visits.findIndex(v => v.visitId === visitId);
      if (index !== -1) {
        visits[index].action = "closed";
        visits[index].closedAt = new Date().toISOString();
        delete latestVisitByTab[tabId];
        await storageSet({ visits, latestVisitByTab });
      }
    }
  });
}
