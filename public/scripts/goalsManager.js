import { getGoals, saveGoals, formatTimeAgo } from './utils/general.js';

    const GoalsManager = (() => {
    // --- State & Elements ---
    let currentEditIndex = -1;
    let isNew = false;
    
    const goalsContainer = document.getElementById('goals-container');
    const editSection = document.getElementById('edit-goal-section');
    const editModal = document.querySelector('#edit-goal-section .edit-goal-modal');
    const editInput = document.getElementById('edit-goal-input');
    const actionButton = document.getElementById('edit-goal-action-button');
    const deleteButton = document.getElementById('edit-goal-delete-button');
    // const contextMenu = document.getElementById('goal-context-menu');

    // --- Private Methods ---
    const render = () => {
        const userGoals = getGoals();
        goalsContainer.innerHTML = '';
        const maxSlots = 2;

        for (let i = 0; i < maxSlots; i++) {
            if (userGoals[i]) {
                // Render existing goal
                const goalItem = document.createElement('div');
                goalItem.className = 'goal-item flex flex-row items-center gap-2 py-1 border border-dashed rounded-sm text-xs font-medium  min-h-[2.2rem] box-border cursor-pointer justify-start relative hover:border-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-secondary-bg))] border-[rgb(var(--color-border-color))] text-[rgb(var(--color-text-secondary))]';

                goalItem.dataset.index = i;
                goalItem.innerHTML = `
                    <i class="ph-fill ph-clipboard-text goal-icon text-base flex-shrink-0 ml-2 text-[rgb(var(--color-text-secondary))]"></i>
                    <span class="goal-title text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis flex-grow first-letter:uppercase ">${userGoals[i].text}</span>
                    <span class="time-since text-[0.7rem] font-normal whitespace-nowrap ml-auto flex-shrink-0 mr-2 text-[rgb(var(--color-text-secondary))]">${userGoals[i].creationTime ? formatTimeAgo(userGoals[i].creationTime) : ''}</span>
                `;
                // ✅ FIX: Pass the event object 'e' to stop propagation
                goalItem.addEventListener('click', (e) => showEditPopup(e, i));

                // goalItem.addEventListener('contextmenu', (e) => showContextMenu(e, i));

                goalsContainer.appendChild(goalItem);
            } else {
                // Render "Add Goal" prompt
                const addPrompt = document.createElement('div');
                addPrompt.className = 'add-goal-prompt flex flex-row items-center gap-2 py-1 border border-dashed rounded-sm text-xs font-medium min-h-[2.2rem] box-border cursor-pointer justify-start relative hover:border-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-secondary-bg))] border-[rgb(var(--color-border-color))] text-[rgb(var(--color-text-secondary))] opacity-50 ';
                addPrompt.innerHTML = `
                    <i class="ph-fill ph-clipboard-text goal-icon text-base flex-shrink-0 ml-2"></i>
                    <span>Click here to add your next goal</span>
                `;
                // ✅ FIX: Pass the event object 'e' to stop propagation
                addPrompt.addEventListener('click', (e) => showEditPopup(e, -1, true));
                goalsContainer.appendChild(addPrompt);
            }
        }
    };

    // ✅ FIX: Accept the event 'e' and call stopPropagation()
    const showEditPopup = (e, index, isNewGoal = false) => {
        e.stopPropagation(); // Prevents the click from bubbling to the document
        
        currentEditIndex = index;
        isNew = isNewGoal;
        
        const goalText = isNew ? '' : getGoals()[index]?.text || '';
        editInput.value = goalText;
        editInput.dataset.originalValue = goalText;
        
        updateActionButtonText();
        editSection.classList.add('show');
        editInput.focus();
    };

    const hideEditPopup = () => {
        editSection.classList.remove('show');
        currentEditIndex = -1;
        isNew = false;
    };
    
    const updateActionButtonText = () => {
        actionButton.textContent = (editInput.value.trim() !== editInput.dataset.originalValue.trim()) ? "Save" : "Completed";
    };

    const handleAction = () => {
        if (actionButton.textContent === "Save") saveGoal();
        else completeGoal();
    };

    const saveGoal = () => {
        const newText = editInput.value.trim();
        if (!newText) return;

        let goals = getGoals();
        if (isNew) {
            goals.push({ text: newText, creationTime: new Date().toISOString() });
        } else if (currentEditIndex !== -1) {
            goals[currentEditIndex].text = newText;
        }
        saveGoals(goals);
        render();
        hideEditPopup();
    };

    const completeGoal = () => {
        if (isNew) {
            hideEditPopup();
            return;
        }
        deleteGoal(currentEditIndex);
        hideEditPopup();
    };
    
    const deleteGoal = (index) => {
        if (index === -1) return;
        let goals = getGoals();
        goals.splice(index, 1);
        saveGoals(goals);
        render();
    };

    // const showContextMenu = (e, index) => {
    //     e.preventDefault();
    //     e.stopPropagation(); // Also good practice here
    //     contextMenu.style.left = `${e.clientX}px`;
    //     contextMenu.style.top = `${e.clientY}px`;
    //     contextMenu.dataset.goalIndex = index;
    //     contextMenu.classList.add('show');
    // };

    // const hideContextMenu = () => {
    //     contextMenu.classList.remove('show');
    // };

    const init = () => {



        document.addEventListener('render-goals-manager', ()=>{
            render();
        });


        actionButton.addEventListener('click', handleAction);
        deleteButton.addEventListener('click', () => {
            deleteGoal(currentEditIndex);
            hideEditPopup();
        });
        editInput.addEventListener('input', updateActionButtonText);
        editInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAction(); });

        // contextMenu.addEventListener('click', (e) => {
        //     const action = e.target.dataset.action;
        //     const index = parseInt(contextMenu.dataset.goalIndex, 10);
        //     if (action === 'completed' || action === 'delete') {
        //         deleteGoal(index);
        //     }
        //     hideContextMenu();
        // });
        
        document.addEventListener('click', (e) => {
            if (editSection.classList.contains('show') && !editModal.contains(e.target)) hideEditPopup();
            // if (contextMenu.classList.contains('show') && !contextMenu.contains(e.target)) hideContextMenu();
        });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { hideEditPopup(); hideContextMenu(); } });
        
        setInterval(render, 60 * 1000);
    };

    return { init, render };
})();

GoalsManager.init();
