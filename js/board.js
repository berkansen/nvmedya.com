document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let tasks = JSON.parse(localStorage.getItem('nvm_tasks')) || [];
    let trash = JSON.parse(localStorage.getItem('nvm_trash')) || [];
    let archive = JSON.parse(localStorage.getItem('nvm_archive')) || [];

    // Cleanup old trash and archive
    const cleanupStorage = () => {
        const now = new Date();
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(now.getDate() - 15);

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(now.getDate() - 60);

        // Trash Cleanup (15 days)
        const initTrashLen = trash.length;
        trash = trash.filter(t => new Date(t.deletedAt) > fifteenDaysAgo);
        if (trash.length !== initTrashLen) {
            localStorage.setItem('nvm_trash', JSON.stringify(trash));
        }

        // Archive Cleanup (60 days)
        const initArchiveLen = archive.length;
        archive = archive.filter(t => new Date(t.archivedAt) > sixtyDaysAgo);
        if (archive.length !== initArchiveLen) {
            localStorage.setItem('nvm_archive', JSON.stringify(archive));
        }
    };
    cleanupStorage();

    // --- DOM Elements ---
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const colTodo = document.getElementById('list-todo');
    const colProgress = document.getElementById('list-in-progress');
    const colDone = document.getElementById('list-done');
    const contextMenu = document.getElementById('contextMenu');

    // Context Menu Items
    const menuMoveTodo = document.getElementById('menuMoveTodo');
    const menuMoveProgress = document.getElementById('menuMoveProgress');
    const menuMoveProgressBack = document.getElementById('menuMoveProgressBack');
    const menuMoveDone = document.getElementById('menuMoveDone');
    const menuMoveArchive = document.getElementById('menuMoveArchive');


    // Counts
    const countTodo = document.getElementById('count-todo');
    const countProgress = document.getElementById('count-progress');
    const countDone = document.getElementById('count-done');


    // Modals
    const noteModal = document.getElementById('noteModal');
    const editNoteModal = document.getElementById('editNoteModal');
    const trashModal = document.getElementById('trashModal');
    const archiveModal = document.getElementById('archiveModal');

    // Note Add Elements
    const noteText = document.getElementById('noteText');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const closeNoteModal = document.getElementById('closeNoteModal');

    // Note Edit Elements
    const editNoteText = document.getElementById('editNoteText');
    const updateNoteBtn = document.getElementById('updateNoteBtn');
    const deleteNoteBtn = document.getElementById('deleteNoteBtn');
    const closeEditNoteModal = document.getElementById('closeEditNoteModal');

    // Trash & Archive Elements
    const closeTrashModal = document.getElementById('closeTrashModal');
    const closeArchiveModal = document.getElementById('closeArchiveModal');
    const openTrashBtn = document.getElementById('openTrashBtn');
    const openArchiveBtn = document.getElementById('openArchiveBtn');
    const trashList = document.getElementById('trashList');
    const archiveList = document.getElementById('archiveList');

    let currentTaskId = null;
    let currentNoteIndex = null; // for editing

    // --- Constants ---
    const TASK_COLORS = [
        '#FF5252', // Red
        '#FF9800', // Orange
        '#FFD740', // Yellow
        '#69F0AE', // Green
        '#40C4FF', // Blue
        '#7C4DFF', // Deep Purple
        '#FF4081'  // Pink
    ];

    // --- Render ---
    function renderTasks() {
        // Sort tasks: Newest first
        tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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

            // Apply Color
            const color = TASK_COLORS[task.colorIndex || 0];
            taskCard.style.borderLeft = `4px solid ${color}`;

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
                task.notes.forEach((note, index) => {
                    const authorClass = note.author.toLowerCase() === 'yeliz' ? 'note-yeliz' : 'note-berkan';
                    notesHtml += `
                        <div class="note-item ${authorClass}" onclick="window.openEditNote('${task.id}', ${index}, event)">
                            <span class="note-author">${note.author}:</span> ${note.text}
                        </div>
                    `;
                });
                notesHtml += '</div>';
            }

            taskCard.innerHTML = `
                ${assigneeHtml}
                <div class="task-content">
                    <p class="task-text">${task.text}</p>
                    ${notesHtml}
                </div>
                <div class="task-date">${new Date(task.createdAt).toLocaleDateString('tr-TR')}</div>
                <div class="expand-hint"><i class='bx bx-chevron-down'></i></div>
            `;

            // Expand/Collapse on Click
            taskCard.addEventListener('click', (e) => {
                // Ignore if clicked on specific buttons/notes handled separately
                if (e.target.closest('.note-item') || e.target.closest('.btn')) return;

                taskCard.classList.toggle('expanded');
            });

            // Add Event Listener for Context Menu
            taskCard.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showContextMenu(e, task.id, task.status);
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

    function renderArchive() {
        archiveList.innerHTML = '';
        if (archive.length === 0) {
            archiveList.innerHTML = '<p class="text-center" style="color:var(--text-muted)">Arşiv boş.</p>';
            return;
        }

        archive.forEach(item => {
            const archiveItem = document.createElement('div');
            archiveItem.className = 'archive-item';

            const archivedDate = new Date(item.archivedAt).toLocaleDateString('tr-TR');

            archiveItem.innerHTML = `
                <div class="trash-info">
                    <h4>${item.task.text}</h4>
                    <span class="trash-date">Arşivleme: ${archivedDate}</span>
                </div>
                <div class="trash-actions">
                    <button class="btn btn-sm btn-restore" onclick="window.restoreArchive('${item.id}')">Geri Yükle</button>
                    <button class="btn btn-sm btn-delete" onclick="window.permDeleteArchive('${item.id}')">Sil</button>
                </div>
            `;
            archiveList.appendChild(archiveItem);
        });
    }

    // --- Actions ---
    function addTask() {
        const text = taskInput.value.trim();
        if (!text) return;

        // Assign a color based on current number of tasks
        const colorIndex = tasks.length % 7;

        const newTask = {
            id: Date.now().toString(),
            text: text,
            status: 'todo',
            assignee: null,
            createdAt: new Date().toISOString(),
            notes: [],
            colorIndex: colorIndex
        };

        tasks.unshift(newTask); // Add to beginning (though we sort anyway)
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

    function archiveTask(id) {
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex > -1) {
            const task = tasks[taskIndex];
            archive.push({
                id: Date.now().toString(), // Archive ID
                task: task,
                archivedAt: new Date().toISOString()
            });
            localStorage.setItem('nvm_archive', JSON.stringify(archive));

            tasks.splice(taskIndex, 1);
            renderTasks();
            renderArchive(); // if open
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

    // --- Notes Management ---
    window.openEditNote = (taskId, noteIndex, e) => {
        e.stopPropagation(); // prevent card click/action
        currentTaskId = taskId;
        currentNoteIndex = noteIndex;

        const task = tasks.find(t => t.id === taskId);
        if (task && task.notes[noteIndex]) {
            editNoteText.value = task.notes[noteIndex].text;
            editNoteModal.style.display = 'block';
        }
    }

    function updateNote() {
        if (!currentTaskId || currentNoteIndex === null) return;

        const text = editNoteText.value.trim();
        if (!text) return;

        const taskIndex = tasks.findIndex(t => t.id === currentTaskId);
        if (taskIndex > -1) {
            tasks[taskIndex].notes[currentNoteIndex].text = text;
            renderTasks();
            editNoteModal.style.display = 'none';
        }
    }

    function deleteNote() {
        if (!currentTaskId || currentNoteIndex === null) return;
        if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;

        const taskIndex = tasks.findIndex(t => t.id === currentTaskId);
        if (taskIndex > -1) {
            tasks[taskIndex].notes.splice(currentNoteIndex, 1);
            renderTasks();
            editNoteModal.style.display = 'none';
        }
    }

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

    // --- Global Archive Actions ---
    window.restoreArchive = (archiveId) => {
        const index = archive.findIndex(t => t.id === archiveId);
        if (index > -1) {
            const item = archive[index];
            // Restore to 'done' status
            item.task.status = 'done';
            tasks.push(item.task);
            archive.splice(index, 1);

            localStorage.setItem('nvm_archive', JSON.stringify(archive));
            renderTasks();
            renderArchive();
        }
    }

    window.permDeleteArchive = (archiveId) => {
        if (!confirm('Bu öğeyi kalıcı olarak silmek istediğinize emin misiniz?')) return;

        archive = archive.filter(t => t.id !== archiveId);
        localStorage.setItem('nvm_archive', JSON.stringify(archive));
        renderArchive();
    }

    // --- Context Menu ---
    function showContextMenu(e, id, status) {
        currentTaskId = id;

        // Dynamic Menu Items based on Status
        // Reset defaults
        menuMoveTodo.style.display = 'none';
        menuMoveProgress.style.display = 'none';
        menuMoveProgressBack.style.display = 'none';
        menuMoveDone.style.display = 'none';
        menuMoveArchive.style.display = 'none';

        if (status === 'todo') {
            menuMoveProgress.style.display = 'flex';
        } else if (status === 'in-progress') {
            menuMoveTodo.style.display = 'flex'; // Back to Todo
            menuMoveDone.style.display = 'flex'; // Forward to Done
        } else if (status === 'done') {
            menuMoveProgressBack.style.display = 'flex'; // Back to Progress
            menuMoveArchive.style.display = 'flex'; // Archive
        }

        contextMenu.style.display = 'block';
        contextMenu.style.left = `${e.pageX}px`;
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
                case 'move-todo':
                    // Reset assignee when moving back to Todo (Sahipsiz)
                    assignTask(currentTaskId, null);
                    updateTaskStatus(currentTaskId, 'todo');
                    break;
                case 'move-progress':
                case 'move-progress-back':
                    updateTaskStatus(currentTaskId, 'in-progress');
                    break;
                case 'move-done':
                    updateTaskStatus(currentTaskId, 'done');
                    break;
                case 'move-archive':
                    archiveTask(currentTaskId);
                    break;
                case 'delete':
                    if (confirm('Bu görevi silmek istediğinize emin misiniz?')) {
                        deleteTask(currentTaskId);
                    }
                    break;
            }
        });
    });

    // Modal Listeners
    saveNoteBtn.addEventListener('click', saveNote);
    closeNoteModal.addEventListener('click', () => noteModal.style.display = 'none');

    // Edit Modal
    updateNoteBtn.addEventListener('click', updateNote);
    deleteNoteBtn.addEventListener('click', deleteNote);
    closeEditNoteModal.addEventListener('click', () => editNoteModal.style.display = 'none');

    openTrashBtn.addEventListener('click', () => {
        renderTrash();
        trashModal.style.display = 'block';
    });
    closeTrashModal.addEventListener('click', () => trashModal.style.display = 'none');

    openArchiveBtn.addEventListener('click', () => {
        renderArchive();
        archiveModal.style.display = 'block';
    });
    closeArchiveModal.addEventListener('click', () => archiveModal.style.display = 'none');

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target == noteModal) noteModal.style.display = 'none';
        if (e.target == trashModal) trashModal.style.display = 'none';
        if (e.target == editNoteModal) editNoteModal.style.display = 'none';
        if (e.target == archiveModal) archiveModal.style.display = 'none';
    });

    // Initial Render
    renderTasks();
});
