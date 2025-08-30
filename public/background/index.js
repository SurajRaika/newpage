// background.js
// Entry point

import { setupMessenger } from "./messenger.js";
import { setupTabListeners } from "./tabs.js";

setupMessenger();
setupTabListeners();

console.log("Background script initialized 🚀");
