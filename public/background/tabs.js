// tabs.js
// Tab lifecycle and visit storage

export const storageGet = (keys) => new Promise((res) => chrome.storage.local.get(keys, res));
export const storageSet = (obj) => new Promise((res) => chrome.storage.local.set(obj, res));

function makeVisitId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function saveVisit(visitData) {
  console.log("saveVisit fn start running ..." );
  
  if (Array.isArray(visitData.visibleText)) {
    visitData.visibleText = JSON.stringify(visitData.visibleText);
  }
  
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


export function setupTabListeners() {




  chrome.tabs.onCreated.addListener((tab) => {
  });

  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  });

  chrome.tabs.onRemoved.addListener(async (tabId) => {
  });
}
