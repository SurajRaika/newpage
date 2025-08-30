# Tab Tracker Chrome Extension

This Chrome extension records your tab visits, including navigation and reloads, and saves the data to `chrome.storage.local`. It also extracts the title, description, and visible text from the pages you visit.

## 🚀 Project Structure

Here is the structure of the project:

```text
/
├── public/
│   ├── background/
│   │   ├── index.js
│   │   ├── messenger.js
│   │   └── tabs.js
│   ├── content.js
│   ├── manifest.json
│   ├── popup.html
│   └── ...
├── src/
│   └── ...
└── package.json
```

## 🧞 How to Load the Extension

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable "Developer mode" in the top right corner.
3.  Click on "Load unpacked".
4.  Select the `public` directory in this project.

## 👀 Want to learn more?

Feel free to check the [Chrome Extension Development documentation](https://developer.chrome.com/docs/extensions/reference/).