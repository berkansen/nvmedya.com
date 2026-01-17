document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let tasks = JSON.parse(localStorage.getItem('nvm_tasks')) || [];
    let trash = JSON.parse(localStorage.getItem('nvm_trash')) || [];

    // Cleanup old trash (older than 15 days)
    const cleanupTrash = () => {
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

        const initialLen = trash.length;
        trash = trash.filter(t => new Date(t.deletedAt) > fifteenDaysAgo);

        if (trash.length !== initialLen) {
            localStorage.setItem('nvm_trash', JSON.stringify(trash));
        }
    };
    cleanupTrash();

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

    // Modals
    const noteModal = document.getElementById('noteModal');
    const trashModal = document.getElementById('trashModal');
    const noteText = document.getElementById('noteText');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const closeNoteModal = document.getElementById('closeNoteModal');
    const closeTrashModal = document.getElementById('closeTrashModal');
    const openTrashBtn = document.getElementById('openTrashBtn');
    const trashList = document.getElementById('trashList');

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

            // Notes Html
            let notesHtml = '';
            if (task.notes && task.notes.length > 0) {
                notesHtml = '<div class="task-notes">';
                task.notes.forEach(note => {
                    const authorClass = note.author.toLowerCase() === 'yeliz' ? 'note-yeliz' : 'note-berkan';
                    notesHtml += `
                        <div class="note-item ${authorClass}">
                            <span class="note-author">${note.author}:</span> ${note.text}
                        </div>
                    `;
                });
                notesHtml += '</div>';
            }

            taskCard.innerHTML = `
                ${assigneeHtml}
                <p class="task-text">${task.text}</p>
                ${notesHtml}
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

    function renderTrash() {
        trashList.innerHTML = '';
        if (trash.length === 0) {
            trashList.innerHTML = '<p class="text-center" style="color:var(--text-muted)">Çöp kutusu boş.</p>';
            return;
        }

        trash.forEach(item => {
            const trashItem = document.createElement('div');
            trashItem.className = 'trash-item';

            const deletedDate = new Date(item.deletedAt).toLocaleDateString('tr-TR');

            trashItem.innerHTML = `
                <div class="trash-info">
                    <h4>${item.task.text}</h4>
                    <span class="trash-date">Silinme: ${deletedDate}</span>
                </div>
                <div class="trash-actions">
                    <button class="btn btn-sm btn-restore" onclick="window.restoreTask('${item.id}')">Geri Yükle</button>
                    <button class="btn btn-sm btn-delete" onclick="window.permDeleteTask('${item.id}')">Sil</button>
                </div>
            `;
            trashList.appendChild(trashItem);
        });
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
            createdAt: new Date().toISOString(),
            notes: []
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
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex > -1) {
            const task = tasks[taskIndex];
            trash.push({
                id: Date.now().toString(), // Trash ID
                task: task,
                deletedAt: new Date().toISOString()
            });
            localStorage.setItem('nvm_trash', JSON.stringify(trash));

            tasks.splice(taskIndex, 1);
            renderTasks();
            renderTrash(); // update if open
        }
    }

    // --- Notes ---
    function openNoteModal() {
        noteModal.style.display = 'block';
        noteText.value = '';
        noteText.focus();
    }

    function saveNote() {
        if (!currentTaskId) return;
        const text = noteText.value.trim();
        if (!text) {
            alert('Lütfen bir not girin.');
            return;
        }

        const author = document.querySelector('input[name="noteAuthor"]:checked').value;

        const taskIndex = tasks.findIndex(t => t.id === currentTaskId);
        if (taskIndex > -1) {
            if (!tasks[taskIndex].notes) tasks[taskIndex].notes = [];
            tasks[taskIndex].notes.push({
                text: text,
                author: author,
                createdAt: new Date().toISOString()
            });
            renderTasks();
            noteModal.style.display = 'none';
        }
    }

    // --- Global Trash Actions ---
    window.restoreTask = (trashId) => {
        const trashIndex = trash.findIndex(t => t.id === trashId);
        if (trashIndex > -1) {
            const item = trash[trashIndex];
            tasks.push(item.task);
            trash.splice(trashIndex, 1);

            localStorage.setItem('nvm_trash', JSON.stringify(trash));
            renderTasks();
            renderTrash();
        }
    }

    window.permDeleteTask = (trashId) => {
        if (!confirm('Bu öğeyi kalıcı olarak silmek istediğinize emin misiniz?')) return;

        trash = trash.filter(t => t.id !== trashId);
        localStorage.setItem('nvm_trash', JSON.stringify(trash));
        renderTrash();
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
        // Don't null currentTaskId immediately if we open a modal
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

            // Hide context menu but keep ID for actions
            contextMenu.style.display = 'none';

            switch (action) {
                case 'add-note':
                    openNoteModal();
                    break;
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
        });
    });

    // Modal Listeners
    saveNoteBtn.addEventListener('click', saveNote);
    closeNoteModal.addEventListener('click', () => noteModal.style.display = 'none');

    openTrashBtn.addEventListener('click', () => {
        renderTrash();
        trashModal.style.display = 'block';
    });
    closeTrashModal.addEventListener('click', () => trashModal.style.display = 'none');

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target == noteModal) noteModal.style.display = 'none';
        if (e.target == trashModal) trashModal.style.display = 'none';
    });

    // Initial Render
    renderTasks();
});
