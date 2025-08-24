// goals/GoalsManager.js

import { formatTimeAgo } from './utils/general.js';
import GoalsData from './GoalsData.js';

const GoalsManager = (() => {
  // --- State & Elements ---
  let currentEditGoalId = null;
  let isNew = false;

  const goalsContainer = document.getElementById('goals-container');
  const editSection = document.getElementById('edit-goal-section');
  const editModal = document.querySelector('#edit-goal-section .edit-goal-modal');
  const editInput = document.getElementById('edit-goal-input');
  const actionButton = document.getElementById('edit-goal-action-button');
  const deleteButton = document.getElementById('edit-goal-delete-button');

  // --- Private Methods ---
  const render = () => {
    const userGoals = GoalsData.getGoals();
    goalsContainer.innerHTML = '';
    const maxSlots = 2;

    for (let i = 0; i < maxSlots; i++) {
      if (userGoals[i]) {
        // Render existing goal
        const goalItem = document.createElement('div');
        const goal = userGoals[i];
        
        // Add processing indicator if goal is still being processed by AI
        const processingClass = goal.isProcessing ? ' processing' : '';
        const processingIndicator = goal.isProcessing ? 
          '<span class="processing-indicator">🤖</span>' : '';
        
        goalItem.className = `goal-item flex flex-row items-center gap-2 py-1 border rounded-sm text-xs font-medium min-h-[2.2rem] box-border whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer justify-start relative hover:border-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-secondary-bg))] border-[rgb(var(--color-border-color))] text-[rgb(var(--color-text-primary))]${processingClass}`;
        
        goalItem.dataset.id = goal.id;
        goalItem.dataset.slot = i === 0 ? 'primary' : 'secondary';
        
        goalItem.innerHTML = `
          <i class="ph-fill ph-clipboard-text goal-icon text-base flex-shrink-0 ml-2 text-[rgb(var(--color-text-secondary))]"></i>
          <span class="goal-title text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis flex-grow">${goal.shortName}${processingIndicator}</span>
          <span class="time-since text-[0.7rem] font-normal whitespace-nowrap ml-auto flex-shrink-0 mr-2 text-[rgb(var(--color-text-secondary))]">${goal.creationTime ? formatTimeAgo(goal.creationTime) : ''}</span>
        `;
        
        goalItem.addEventListener('click', (e) => showEditPopup(e, goal.id));
        goalsContainer.appendChild(goalItem);
      } else {
        // Render "Add Goal" prompt
        const addPrompt = document.createElement('div');
        const slotName = i === 0 ? 'Primary' : 'Secondary';
        
        addPrompt.className = 'add-goal-prompt flex flex-row items-center gap-2 py-1 border border-dashed rounded-sm text-xs font-medium min-h-[2.2rem] box-border cursor-pointer justify-start relative hover:border-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-secondary-bg))] border-[rgb(var(--color-border-color))] text-[rgb(var(--color-text-secondary))]';
        addPrompt.dataset.slot = i === 0 ? 'primary' : 'secondary';
        
        addPrompt.innerHTML = `
          <i class="ph-fill ph-clipboard-text goal-icon text-base flex-shrink-0 ml-2"></i>
          <span>Add ${slotName} Goal</span>
        `;
        
        addPrompt.addEventListener('click', (e) => showEditPopup(e, null, true));
        goalsContainer.appendChild(addPrompt);
      }
    }
  };

  const showEditPopup = (e, id, isNewGoal = false) => {
    e.stopPropagation();
    currentEditGoalId = id;
    isNew = isNewGoal;

    let goalName = '';
    if (!isNew && id) {
      const goal = GoalsData.getGoalById(id);
      goalName = goal ? goal.shortName : '';
    }

    editInput.value = goalName;
    editInput.dataset.originalValue = goalName;

    updateActionButtonText();
    updateDeleteButtonVisibility();
    editSection.classList.add('show');
    editInput.focus();
  };

  const hideEditPopup = () => {
    editSection.classList.remove('show');
    currentEditGoalId = null;
    isNew = false;
  };

  const updateActionButtonText = () => {
    const currentValue = editInput.value.trim();
    const originalValue = editInput.dataset.originalValue.trim();
    
    if (isNew) {
      actionButton.textContent = currentValue ? "Create Goal" : "Create Goal";
    } else {
      actionButton.textContent = (currentValue !== originalValue) ? "Save Changes" : "Mark Complete";
    }
  };

  const updateDeleteButtonVisibility = () => {
    // Show delete button only for existing goals
    if (isNew) {
      deleteButton.style.display = 'none';
    } else {
      deleteButton.style.display = 'block';
    }
  };

  const handleAction = async () => {
    if (isNew || (editInput.value.trim() !== editInput.dataset.originalValue.trim())) {
      await saveGoal();
    } else {
      completeGoal();
    }
  };

  const saveGoal = async () => {
    const newShortName = editInput.value.trim();
    if (!newShortName) {
      alert('Please enter a goal name');
      return;
    }

    // Show loading state
    actionButton.textContent = 'Processing...';
    actionButton.disabled = true;

    try {
      if (isNew) {
        // Add new goal with AI processing
        const result = await GoalsData.addGoal(newShortName);
        
        if (result.success) {
          console.log('Goal added successfully:', result.message);
          if (result.warning) {
            console.warn(result.warning);
          }
        } else {
          alert('Failed to add goal: ' + result.error);
        }
      } else if (currentEditGoalId) {
        // Update existing goal
        const success = GoalsData.updateGoalById(currentEditGoalId, { shortName: newShortName });
        if (!success) {
          alert('Failed to update goal');
        }
      }
      
      render();
      hideEditPopup();
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Error saving goal: ' + error.message);
    } finally {
      // Reset button state
      actionButton.disabled = false;
      updateActionButtonText();
    }
  };

  const completeGoal = () => {
    if (isNew) {
      hideEditPopup();
      return;
    }
    
    if (currentEditGoalId) {
      GoalsData.deleteGoalById(currentEditGoalId);
      hideEditPopup();
      render();
    }
  };

  const deleteGoal = () => {
    if (!currentEditGoalId || isNew) return;
    
    if (confirm('Are you sure you want to delete this goal?')) {
      GoalsData.deleteGoalById(currentEditGoalId);
      hideEditPopup();
      render();
    }
  };

  const init = () => {
    // Listen for re-render events
    document.addEventListener('render-goals-manager', () => {
      render();
    });

    // Button event listeners
    actionButton.addEventListener('click', handleAction);
    deleteButton.addEventListener('click', deleteGoal);

    // Input event listeners
    editInput.addEventListener('input', updateActionButtonText);
    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !actionButton.disabled) {
        handleAction();
      }
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (editSection.classList.contains('show') && !editModal.contains(e.target)) {
        hideEditPopup();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideEditPopup();
      }
    });

    // Auto-refresh to update time displays and check for AI processing completion
    setInterval(render, 60 * 1000);
  };

  // Public API
  return { 
    init, 
    render,
    // Expose method to manually refresh a goal (useful for testing)
    refreshGoal: (goalId) => GoalsData.reloadGoal(goalId)
  };
})();

GoalsManager.init();