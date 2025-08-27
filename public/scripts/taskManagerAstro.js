/* -----------------------
   Helper: sendTask (unchanged)
   ----------------------- */
const taskresponseStructure = {
  responseMimeType: "application/json",
  responseSchema: {
    type: "OBJECT",
    properties: {
      isTask: { type: "BOOLEAN" },
      requestSummary: { type: "STRING" },
      tasks: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            description: { type: "STRING" },
            estimatedTimeMinutes: { type: "NUMBER" },
            suggestedWebsites: {
              type: "ARRAY",
              items: { type: "STRING" }
            }
          },
          required: ["name", "description", "estimatedTimeMinutes"]
        }
      }
    },
    required: ["requestSummary", "tasks"]
  }
};

const sendTask = async (taskDescription) => {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      // Extension environment
      chrome.runtime.sendMessage(
        {
          action: "askGemini",
          prompt: `Break down this user task into clear subtasks in JSON array format (short actionable items only). Task: "${taskDescription}"`,
          responseStructure: taskresponseStructure
        },
        (response) => {
          if (chrome.runtime.lastError) {
            resolve({ error: "Extension communication error: " + chrome.runtime.lastError.message });
          } else {
            try {
              let parsed = response;
              if (typeof response === "string") {
                parsed = JSON.parse(response);
              }
              resolve(parsed);
            } catch (err) {
              resolve({ error: "Invalid response format", raw: response });
            }
          }
        }
      );
    } else {
      // Fallback for non-extension environment
      resolve({ error: "Chrome extension environment not detected. Cannot send task." });
    }
  });
};


/* -----------------------
   Minimal Markdown renderer (very small subset; safe-escaped)
   ----------------------- */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function renderMarkdown(md) {
  if (!md) return '';
  // escape HTML first
  let s = escapeHtml(md);

  // code block ``` ```
  s = s.replace(/```([\s\S]*?)```/g, function(_, code) {
    return '<pre class="text-xs p-2 border-t border-b my-2 rounded-none whitespace-pre-wrap">' + escapeHtml(code) + '</pre>';
  });

  // headings
  s = s.replace(/^### (.*$)/gim, '<h3 class="text-sm font-semibold mb-1">$1</h3>');
  s = s.replace(/^## (.*$)/gim, '<h3 class="text-sm font-semibold mb-1">$1</h3>');
  s = s.replace(/^# (.*$)/gim, '<h2 class="text-base font-bold mb-1">$1</h2>');

  // bold and italic
  s = s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // links [text](url)
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a class="underline" href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // line breaks -> paragraphs
  const paragraphs = s.split(/\n{2,}/).map(p => p.replace(/\n/g, '<br>'));
  return paragraphs.map(p => `<p class="m-0 text-sm leading-tight">${p}</p>`).join('');
}


/* -----------------------
   Render UI and attach handlers
   ----------------------- */
document.addEventListener("DOMContentLoaded", function () {
  const goalSlots = document.querySelectorAll(".add-goal-prompt");

  goalSlots.forEach(slot => {
    slot.addEventListener("click", () => {
      const slotType = slot.getAttribute("data-slot"); // "primary" or "secondary"

      // open the command palette
      window.CommandPalette.show({
        placeholder: 'Type a task…',
        initialValue: '',
        submitLabel: 'Run',
        source: 'Task-box',
        keepOpenOnSubmit: true,
        clearInputOnEnter: false
      });

      // remove previous handler if exists
      if (window._geminiHandler) {
        window.removeEventListener('command-palette-enter', window._geminiHandler);
        window._geminiHandler = null;
      }

      // handler for Enter
      const handler = async (ev) => {
        const userTask = ev.detail.value;
        console.log("User pressed Enter, value:", userTask);

        // Show loading while waiting for Gemini
        window.CommandPalette.setExtraContent(`
          <div id="gemini-subtasks-container" class="p-3 text-sm bg-[rgb(var(--color-primary-bg))] dark:bg-[rgb(var(--color-primary-bg))] text-black dark:text-white rounded-none">
            <div class="text-sm opacity-80">⏳ Breaking down your task...</div>
          </div>
        `);

        // Send task to Gemini
        const data = await sendTask(userTask);

        // Normalize response object
        let responseObj = null;
        if (data && data.error) {
          responseObj = { error: data.error };
        } else if (data && data.response) {
          responseObj = data.response;
        } else {
          // maybe the API returned directly the object
          responseObj = data;
        }

        // safe fallback if response is a JSON string inside responseObj
        if (typeof responseObj === 'string') {
          try { responseObj = JSON.parse(responseObj); } catch (e) { /* leave as string */ }
        }

        // If error case, render error
        if (responseObj && responseObj.error) {
          window.CommandPalette.setExtraContent(`
            <div id="gemini-subtasks-container" class="p-3 text-sm bg-[rgb(var(--color-primary-bg))] dark:bg-[rgb(var(--color-primary-bg))] text-black dark:text-white rounded-none">
              <div class="text-red-600 dark:text-red-400 text-sm">❌ ${escapeHtml(responseObj.error)}</div>
            </div>
          `);
          // action buttons: Cancel only
          window.CommandPalette.setActionButtons([
            { label: 'Cancel', action: () => { window.CommandPalette.close?.(); }, closeOnClick: true }
          ]);
          return;
        }

        // Ensure structure exists
        if (!responseObj || typeof responseObj !== 'object') {
          window.CommandPalette.setExtraContent(`
            <div id="gemini-subtasks-container" class="p-3 text-sm bg-[rgb(var(--color-primary-bg))] dark:bg-[rgb(var(--color-primary-bg))] text-black dark:text-white rounded-none">
              <div class="text-red-600 dark:text-red-400 text-sm">❌ Unexpected response format.</div>
              <pre class="text-xs mt-2">${escapeHtml(JSON.stringify(responseObj))}</pre>
            </div>
          `);
          window.CommandPalette.setActionButtons([
            { label: 'Cancel', action: () => { window.CommandPalette.close?.(); }, closeOnClick: true }
          ]);
          return;
        }

        // Internal state for edits
        const state = {
          originalTaskText: userTask,
          response: {
            requestSummary: responseObj.requestSummary || '',
            isTask: !!responseObj.isTask,
            tasks: Array.isArray(responseObj.tasks) ? responseObj.tasks.slice() : []
          }
        };

        // Build HTML for UI
        const html = `
<div id="gemini-subtasks-container" class="p-3 text-sm bg-[rgb(var(--color-primary-bg))] dark:bg-[rgb(var(--color-primary-bg))] text-black dark:text-white rounded-none">
  <!-- requestSummary -->
  <div id="gp-request-summary" class="mb-3">
    ${renderMarkdown(state.response.requestSummary)}
  </div>

  ${state.response.isTask ? `
  <div id="gp-tasks" class="space-y-2">
    ${state.response.tasks.map((t, idx) => `
      <div class="gp-task-item flex items-start gap-2 p-2 border-t last:border-b-0 border-gray-200 dark:border-gray-800 rounded-none" data-index="${idx}">
        <div class="flex-1 min-w-0">
          <input class="gp-task-name w-full text-sm font-semibold bg-transparent border-none outline-none p-0 m-0 text-black dark:text-white" value="${escapeHtml(t.name || '')}" />
          <textarea class="gp-task-desc mt-1 w-full text-xs bg-transparent border-none outline-none p-0 m-0 text-black dark:text-white" rows="2">${escapeHtml(t.description || '')}</textarea>
          <div class="mt-1 text-xs opacity-80">
            <span>Est: </span>
            <input type="number" class="gp-task-time w-16 text-xs bg-transparent border-none outline-none p-0 m-0" value="${Number(t.estimatedTimeMinutes || 0)}" /> <span class="opacity-70">min</span>
          </div>
          <div class="mt-1 text-xs gp-task-sites">${(Array.isArray(t.suggestedWebsites) ? t.suggestedWebsites : []).map(s => `<div><a class="underline text-xs" href="${escapeHtml(s)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s)}</a></div>`).join('')}</div>
        </div>
        <div class="flex flex-col items-end gap-1">
          <button class="gp-delete-btn text-xs px-2 py-1 border rounded-none">Delete</button>
        </div>
      </div>
    `).join('')}
  </div>

  <div class="mt-2 flex gap-2">
    <button id="gp-add-task" class="text-xs px-2 py-1 border rounded-none">+ Add task</button>
    <div class="flex-1"></div>
  </div>
  ` : `<div class="text-xs opacity-80">No structured tasks detected.</div>`}

</div>
        `;

        // Set content
        window.CommandPalette.setExtraContent(html);

        // Set action buttons (Accept / Cancel)
        window.CommandPalette.setActionButtons([
          {
            label: 'Accept',
            action: (payload) => {
              // Resolve with the current edited state
              window.CommandPalette.resolve({
                value: state.originalTaskText,
                subtasks: state.response,
                accepted: true
              });
            }
          },
          {
            label: 'Cancel',
            action: (payload) => {
              window.CommandPalette.close?.();
            },
            closeOnClick: true
          }
        ]);

        // Attach event handlers to the inserted DOM nodes
        // Delay to ensure DOM insertion
        setTimeout(() => attachHandlers(state), 0);
      }; // end handler

      window._geminiHandler = handler;
      window.addEventListener('command-palette-enter', handler);
    });
  });

  /* -----------------------
     Attach handlers for edit/delete/add behavior
     ----------------------- */
  function attachHandlers(state) {
    const container = document.getElementById('gemini-subtasks-container');
    if (!container) return;

    // helper: update state from DOM for a given index
    function syncTaskFromDOM(idx) {
      const taskNode = container.querySelector(`.gp-task-item[data-index="${idx}"]`);
      if (!taskNode) return;
      const nameEl = taskNode.querySelector('.gp-task-name');
      const descEl = taskNode.querySelector('.gp-task-desc');
      const timeEl = taskNode.querySelector('.gp-task-time');
      // update state safely
      state.response.tasks[idx] = state.response.tasks[idx] || {};
      state.response.tasks[idx].name = nameEl ? nameEl.value.trim() : '';
      state.response.tasks[idx].description = descEl ? descEl.value.trim() : '';
      state.response.tasks[idx].estimatedTimeMinutes = timeEl ? Number(timeEl.value) : 0;
    }

    // attach delete handlers
    const deleteButtons = container.querySelectorAll('.gp-delete-btn');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const item = e.currentTarget.closest('.gp-task-item');
        if (!item) return;
        const idx = Number(item.getAttribute('data-index'));
        // remove from state
        state.response.tasks.splice(idx, 1);
        // re-render tasks area quickly
        rerenderTasks(container, state);
      });
    });

    // attach input blur handlers to sync edits
    const nameInputs = container.querySelectorAll('.gp-task-name');
    nameInputs.forEach((inp, idx) => {
      inp.addEventListener('blur', () => {
        syncTaskFromDOM(idx);
      });
      // allow Enter to blur (save)
      inp.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') { ev.preventDefault(); inp.blur(); }
      });
    });

    const descInputs = container.querySelectorAll('.gp-task-desc');
    descInputs.forEach((ta, idx) => {
      ta.addEventListener('blur', () => {
        syncTaskFromDOM(idx);
      });
    });

    const timeInputs = container.querySelectorAll('.gp-task-time');
    timeInputs.forEach((ti, idx) => {
      ti.addEventListener('change', () => {
        syncTaskFromDOM(idx);
      });
      ti.addEventListener('blur', () => {
        syncTaskFromDOM(idx);
      });
    });

    // add task button
    const addBtn = container.querySelector('#gp-add-task');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const newTask = {
          name: "New task",
          description: "",
          estimatedTimeMinutes: 5,
          suggestedWebsites: []
        };
        state.response.tasks.push(newTask);
        rerenderTasks(container, state);
      });
    }
  }

  // rerender only tasks portion to keep rest intact
  function rerenderTasks(container, state) {
    const tasksRoot = container.querySelector('#gp-tasks');
    if (!tasksRoot) {
      // if tasks container doesn't exist, re-render whole extra content
      const newHtml = `
        <div id="gemini-subtasks-container" class="p-3 text-sm bg-[rgb(var(--color-primary-bg))] dark:bg-[rgb(var(--color-primary-bg))] text-black dark:text-white rounded-none">
          ${renderMarkdown(state.response.requestSummary)}
          <div id="gp-tasks" class="space-y-2">
            ${state.response.tasks.map((t, idx) => taskHtml(t, idx)).join('')}
          </div>
          <div class="mt-2 flex gap-2">
            <button id="gp-add-task" class="text-xs px-2 py-1 border rounded-none">+ Add task</button>
            <div class="flex-1"></div>
          </div>
        </div>
      `;
      window.CommandPalette.setExtraContent(newHtml);
      setTimeout(() => attachHandlers(state), 0);
      return;
    }

    // replace innerHTML of tasksRoot
    tasksRoot.innerHTML = state.response.tasks.map((t, idx) => taskHtml(t, idx)).join('');
    // re-attach handlers for the replaced nodes
    setTimeout(() => attachHandlers(state), 0);
  }

  function taskHtml(t, idx) {
    return `
      <div class="gp-task-item flex items-start gap-2 p-2 border-t last:border-b-0 border-gray-200 dark:border-gray-800 rounded-none" data-index="${idx}">
        <div class="flex-1 min-w-0">
          <input class="gp-task-name w-full text-sm font-semibold bg-transparent border-none outline-none p-0 m-0 text-black dark:text-white" value="${escapeHtml(t.name || '')}" />
          <textarea class="gp-task-desc mt-1 w-full text-xs bg-transparent border-none outline-none p-0 m-0 text-black dark:text-white" rows="2">${escapeHtml(t.description || '')}</textarea>
          <div class="mt-1 text-xs opacity-80">
            <span>Est: </span>
            <input type="number" class="gp-task-time w-16 text-xs bg-transparent border-none outline-none p-0 m-0" value="${Number(t.estimatedTimeMinutes || 0)}" /> <span class="opacity-70">min</span>
          </div>
          <div class="mt-1 text-xs gp-task-sites">${(Array.isArray(t.suggestedWebsites) ? t.suggestedWebsites : []).map(s => `<div><a class="underline text-xs" href="${escapeHtml(s)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s)}</a></div>`).join('')}</div>
        </div>
        <div class="flex flex-col items-end gap-1">
          <button class="gp-delete-btn text-xs px-2 py-1 border rounded-none">Delete</button>
        </div>
      </div>
    `;
  }

});

