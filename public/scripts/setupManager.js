
   document.addEventListener('DOMContentLoaded', () => {
       const setupContainer = document.getElementById('setup-container');
       const openSetupButton = document.getElementById('open-setup-button');
       const saveButton = document.getElementById('setup-save-button');
       const deleteButton = document.getElementById('setup-delete-button');
       const apiKeyInput = document.getElementById('api-key');
       const statusMessage = document.getElementById('status-message');
       const testResultSection = document.getElementById('test-result-section');
       const testResult = document.getElementById('test-result');
       const saveText = document.getElementById('save-text');
       const loadingSpinner = document.querySelector('.loading');
   
       const showPopUp = () => {
           setupContainer.classList.add('show');
           setTimeout(() => apiKeyInput.focus(), 250);
       };
   
       const hidePopUp = () => {
           setupContainer.classList.remove('show');
           testResultSection.classList.add('hidden');
       };
   
       const showLoading = (show) => {
           if (show) {
               loadingSpinner.classList.remove('hidden');
               saveText.textContent = 'Testing...';
               saveButton.disabled = true;
           } else {
               loadingSpinner.classList.add('hidden');
               saveText.textContent = 'Save & Test';
               saveButton.disabled = false;
           }
       };
   
       const testGeminiApi = async (apiKey) => {
           return new Promise((resolve) => {
               if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                   // Extension environment
                   chrome.runtime.sendMessage(
                       { action: "testGemini", apiKey: apiKey },
                       (response) => {
                           if (chrome.runtime.lastError) {
                               resolve({ error: "Extension communication error: " + chrome.runtime.lastError.message });
                           } else {
                               resolve(response);
                           }
                       }
                   );
               } else {
                   // Fallback for non-extension environment
                   resolve({ error: "Chrome extension environment not detected. API test cannot be performed." });
               }
           });
       };
   
       const handleSave = async () => {
           const apiKey = apiKeyInput.value.trim();
           if (!apiKey) {
               statusMessage.textContent = "Please enter an API key.";
               return;
           }
   
           showLoading(true);
           statusMessage.textContent = "Saving API key and testing...";
   
           try {
               // Save to Chrome storage
               if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                   chrome.storage.local.set({ 'geminiApiKey': apiKey }, async () => {
                       statusMessage.textContent = "✅ API Key saved securely";
                       
                       // Test the API
                       const testResponse = await testGeminiApi(apiKey);
                       showLoading(false);
                       
                       testResultSection.classList.remove('hidden');
                       
                       if (testResponse.error) {
                           testResult.innerHTML = `<div class="text-red-600">❌ Error: ${testResponse.error}</div>`;
                           statusMessage.textContent = "❌ API test failed";
                       } else {
                           testResult.innerHTML = `<div class="text-green-600">✅ Success!</div><div class="mt-2 text-gray-700">${testResponse.response}</div>`;
                           statusMessage.textContent = "✅ API key saved and tested successfully";
                       }
                   });
               } else {
                   // Fallback to localStorage
                   localStorage.setItem('geminiApiKey', apiKey);
                   statusMessage.textContent = "✅ API Key saved to local storage";
                   
                   const testResponse = await testGeminiApi(apiKey);
                   showLoading(false);
                   
                   testResultSection.classList.remove('hidden');
                   testResult.innerHTML = `<div class="text-orange-600">⚠️ Extension environment not detected. API key saved locally but cannot test API connection.</div>`;
               }
           } catch (error) {
               showLoading(false);
               statusMessage.textContent = "❌ Error saving API key";
               testResultSection.classList.remove('hidden');
               testResult.innerHTML = `<div class="text-red-600">❌ Error: ${error.message}</div>`;
           }
       };
   
       const handleDelete = () => {
           if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
               chrome.storage.local.remove('geminiApiKey', () => {
                   statusMessage.textContent = "❌ API Key deleted";
               });
           } else {
               localStorage.removeItem('geminiApiKey');
               statusMessage.textContent = "❌ API Key deleted";
           }
           apiKeyInput.value = "";
           testResultSection.classList.add('hidden');
       };
   
       // Check for existing API key on load
       const loadApiKeyAndShowPopup = () => {
           if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
               chrome.storage.local.get('geminiApiKey', (data) => {
                   if (!data.geminiApiKey) {
                       setTimeout(showPopUp, 3000);
                   } else {
                       apiKeyInput.value = data.geminiApiKey;
                       statusMessage.textContent = "🔑 API Key already stored";
                   }
               });
           } else {
               const storedKey = localStorage.getItem('geminiApiKey');
               if (!storedKey) {
                   setTimeout(showPopUp, 3000);
               } else {
                   apiKeyInput.value = storedKey;
                   statusMessage.textContent = "🔑 API Key already stored";
               }
           }
       };
   
       // Event listeners
       if (openSetupButton) {
           openSetupButton.addEventListener('click', showPopUp);
       }
   
       saveButton.addEventListener('click', handleSave);
       deleteButton.addEventListener('click', handleDelete);
       
       apiKeyInput.addEventListener('keydown', (e) => {
           if (e.key === 'Enter') {
               e.preventDefault();
               handleSave();
           }
       });
   
       // Close modal when clicking outside
       document.addEventListener('click', (e) => {
           if (setupContainer.classList.contains('show') && 
               !setupContainer.querySelector('.modal-content').contains(e.target) && 
               e.target.id !== 'open-setup-button') {
               hidePopUp();
           }
       });
   
       // Close modal with Escape key
       document.addEventListener('keydown', (e) => {
           if (setupContainer.classList.contains('show') && e.key === 'Escape') {
               hidePopUp();
           }
       });
   
       // Initial load
       loadApiKeyAndShowPopup();
   });
