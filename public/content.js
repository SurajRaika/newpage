// content.js
const description = document.querySelector('meta[name="description"]')?.content;
chrome.runtime.sendMessage({ type: "PAGE_DATA", description: description });