document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let tasks = JSON.parse(localStorage.getItem('nvm_tasks')) || [];

    // --- DOM Elements ---
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const colTodo = document.getElementById('list-todo');
    const colProgress = document.getElementById('list-in-progress');
    const colDone = document.getElementById('list-done');
    const contextMenu = document.getElementById('contextMenu');

    // Counts
    const countTodo = document.getElementById('count-todo');
    const countProgress = document.getElementById('count-progress');
    const countDone = document.getElementById('count-done');

    let currentTaskId = null;

    // --- Render ---
    function renderTasks() {
        // Clear lists
        colTodo.innerHTML = '';
        colProgress.innerHTML = '';
        colDone.innerHTML = '';

        // Counters
        let cTodo = 0, cProgress = 0, cDone = 0;

        tasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = 'task-card';
            taskCard.dataset.id = task.id;

            // Assignee Badge
            let assigneeHtml = '';
            if (task.assignee) {
                const assigneeClass = task.assignee.toLowerCase() === 'yeliz' ? 'badge-yeliz' : 'badge-berkan';
                assigneeHtml = `<span class="assignee-badge ${assigneeClass}">${task.assignee}</span>`;
            }

            taskCard.innerHTML = `
                ${assigneeHtml}
                <p class="task-text">${task.text}</p>
                <div class="task-date">${new Date(task.createdAt).toLocaleDateString('tr-TR')}</div>
            `;

            // Add Event Listener for Context Menu
            taskCard.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showContextMenu(e, task.id);
            });

            // Append to correct column
            if (task.status === 'todo') {
                colTodo.appendChild(taskCard);
                cTodo++;
            } else if (task.status === 'in-progress') {
                colProgress.appendChild(taskCard);
                cProgress++;
            } else if (task.status === 'done') {
                colDone.appendChild(taskCard);
                cDone++;
            }
        });

        // Update counts
        countTodo.textContent = cTodo;
        countProgress.textContent = cProgress;
        countDone.textContent = cDone;

        // Save to local storage
        localStorage.setItem('nvm_tasks', JSON.stringify(tasks));
    }

    // --- Actions ---
    function addTask() {
        const text = taskInput.value.trim();
        if (!text) return;

        const newTask = {
            id: Date.now().toString(),
            text: text,
            status: 'todo', // todo, in-progress, done
            assignee: null, // 'Yeliz', 'Berkan'
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);
        taskInput.value = '';
        renderTasks();
    }

    function updateTaskStatus(id, newStatus) {
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex > -1) {
            tasks[taskIndex].status = newStatus;
            renderTasks();
        }
    }

    function assignTask(id, person) {
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex > -1) {
            tasks[taskIndex].assignee = person;
            renderTasks();
        }
    }

    function deleteTask(id) {
        tasks = tasks.filter(t => t.id !== id);
        renderTasks();
    }

    // --- Context Menu ---
    function showContextMenu(e, id) {
        currentTaskId = id;
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${e.pageX}px`; // Use pageX/Y to account for scroll
        contextMenu.style.top = `${e.pageY}px`;
    }

    function hideContextMenu() {
        contextMenu.style.display = 'none';
        currentTaskId = null;
    }

    // --- Event Listeners ---
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
            hideContextMenu();
        }
    });

    // Menu Actions
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const action = item.dataset.action;
            if (!currentTaskId) return;

            switch (action) {
                case 'assign-yeliz':
                    assignTask(currentTaskId, 'Yeliz');
                    break;
                case 'assign-berkan':
                    assignTask(currentTaskId, 'Berkan');
                    break;
                case 'move-progress':
                    updateTaskStatus(currentTaskId, 'in-progress');
                    break;
                case 'move-done':
                    updateTaskStatus(currentTaskId, 'done');
                    break;
                case 'delete':
                    deleteTask(currentTaskId);
                    break;
            }
            hideContextMenu();
        });
    });

    // Initial Render
    renderTasks();
});
