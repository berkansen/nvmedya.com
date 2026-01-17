// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyAhKpbwC3VVX7ewazNY-XvJ_en_P1tiwtI",
    authDomain: "nisan-vitrini-panel.firebaseapp.com",
    projectId: "nisan-vitrini-panel",
    storageBucket: "nisan-vitrini-panel.firebasestorage.app",
    messagingSenderId: "951374944469",
    appId: "1:951374944469:web:49f8944d4d9cf669c16a5c"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();


document.addEventListener('DOMContentLoaded', () => {
    // --- Auth Logic ---
    const loginOverlay = document.getElementById('loginOverlay');
    const loginBtn = document.getElementById('loginBtn');
    const loginInput = document.getElementById('loginPassword');

    // Check Auth
    const authDate = localStorage.getItem('nvm_check_date');
    const PASSWORD = 'nisan2026';
    const VALID_DAYS = 15;

    // Helper to hide
    const unlock = () => {
        loginOverlay.style.opacity = '0';
        setTimeout(() => {
            loginOverlay.style.display = 'none';
        }, 500); // fade out
    };

    if (authDate) {
        const date = new Date(parseInt(authDate));
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= VALID_DAYS) {
            unlock();
        }
    }

    // Login Action
    loginBtn.addEventListener('click', () => {
        if (loginInput.value === PASSWORD) {
            localStorage.setItem('nvm_check_date', Date.now().toString());
            unlock();
        } else {
            alert('Hatalı şifre!');
            loginInput.value = '';
        }
    });

    // Toggle Password Visibility
    const toggleBtn = document.getElementById('togglePasswordBtn');
    toggleBtn.addEventListener('click', () => {
        const type = loginInput.getAttribute('type') === 'password' ? 'text' : 'password';
        loginInput.setAttribute('type', type);

        // Toggle Icon
        if (type === 'text') {
            toggleBtn.classList.remove('bx-show');
            toggleBtn.classList.add('bx-hide');
        } else {
            toggleBtn.classList.remove('bx-hide');
            toggleBtn.classList.add('bx-show');
        }
    });

    // --- State Management (Local Mirrors of DB) ---
    let tasks = [];
    let trash = [];
    let archive = [];

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

    // Note Elements
    const noteText = document.getElementById('noteText');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const closeNoteModal = document.getElementById('closeNoteModal');

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
    let currentNoteIndex = null;

    // --- Constants ---
    const TASK_COLORS = [
        '#FF5252', '#FF9800', '#FFD740', '#69F0AE',
        '#40C4FF', '#7C4DFF', '#FF4081'
    ];

    // --- Real-time Listeners ---

    // 1. Listen for Tasks
    db.collection('tasks').onSnapshot(snapshot => {
        tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort newest first
        tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        renderTasks();
    });

    // 2. Listen for Trash
    db.collection('trash').onSnapshot(snapshot => {
        trash = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderTrash(); // updates modal if open
    });

    // 3. Listen for Archive
    db.collection('archive').onSnapshot(snapshot => {
        archive = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderArchive(); // updates modal if open
    });

    // --- Cleanup Logic (Run once on load) ---
    const runCleanup = () => {
        // Fix date math safely
        const d15 = new Date(); d15.setDate(d15.getDate() - 15);
        const d60 = new Date(); d60.setDate(d60.getDate() - 60);

        // Delete old trash
        db.collection('trash').where('deletedAt', '<', d15.toISOString()).get()
            .then(snap => snap.forEach(doc => doc.ref.delete()));

        // Delete old archive
        db.collection('archive').where('archivedAt', '<', d60.toISOString()).get()
            .then(snap => snap.forEach(doc => doc.ref.delete()));
    };
    runCleanup();

    // --- Render Functions ---

    function renderTasks() {
        colTodo.innerHTML = '';
        colProgress.innerHTML = '';
        colDone.innerHTML = '';

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
                <button class="card-menu-btn"><i class='bx bx-dots-vertical-rounded'></i></button>
                <div class="task-content">
                    <p class="task-text">${task.text}</p>
                    ${notesHtml}
                </div>
                <div class="task-date">${new Date(task.createdAt).toLocaleDateString('tr-TR')}</div>
                <div class="expand-hint"><i class='bx bx-chevron-down'></i></div>
            `;

            // Expand/Collapse on Click
            taskCard.addEventListener('click', (e) => {
                if (e.target.closest('.note-item') || e.target.closest('.btn') || e.target.closest('.card-menu-btn')) return;
                taskCard.classList.toggle('expanded');
            });

            // Menu Button Click
            const menuBtn = taskCard.querySelector('.card-menu-btn');
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Position menu near the button
                const rect = menuBtn.getBoundingClientRect();
                // Fake an event object with coordinates for showContextMenu
                const fakeEvent = {
                    pageX: rect.left,
                    pageY: rect.bottom + 5, // slightly below
                    preventDefault: () => { }
                };
                showContextMenu(fakeEvent, task.id, task.status);
            });

            // Context Menu
            taskCard.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showContextMenu(e, task.id, task.status);
            });

            // Append to column
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

        countTodo.textContent = cTodo;
        countProgress.textContent = cProgress;
        countDone.textContent = cDone;
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

    // --- Actions (Write to DB) ---
    function addTask() {
        const text = taskInput.value.trim();
        if (!text) return;

        // Assign a color based on current number of tasks
        const colorIndex = tasks.length % 7;

        db.collection('tasks').add({
            text: text,
            status: 'todo',
            assignee: null,
            createdAt: new Date().toISOString(),
            notes: [],
            colorIndex: colorIndex
        });

        taskInput.value = '';
    }

    function updateTaskStatus(id, newStatus) {
        db.collection('tasks').doc(id).update({ status: newStatus });
    }

    function assignTask(id, person) {
        db.collection('tasks').doc(id).update({ assignee: person });
    }

    function deleteTask(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            // Add to Trash Collection
            db.collection('trash').add({
                task: task,
                deletedAt: new Date().toISOString()
            });
            // Remove from Tasks Collection
            db.collection('tasks').doc(id).delete();
        }
    }

    function archiveTask(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            // Add to Archive Collection
            db.collection('archive').add({
                task: task,
                archivedAt: new Date().toISOString()
            });
            // Remove from Tasks Collection
            db.collection('tasks').doc(id).delete();
        }
    }

    // --- Notes Management ---
    window.openEditNote = (taskId, noteIndex, e) => {
        e.stopPropagation();
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

        const task = tasks.find(t => t.id === currentTaskId);
        if (task) {
            const updatedNotes = [...task.notes];
            updatedNotes[currentNoteIndex].text = text;
            db.collection('tasks').doc(currentTaskId).update({ notes: updatedNotes });
            editNoteModal.style.display = 'none';
        }
    }

    function deleteNote() {
        if (!currentTaskId || currentNoteIndex === null) return;
        if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;

        const task = tasks.find(t => t.id === currentTaskId);
        if (task) {
            const updatedNotes = [...task.notes];
            updatedNotes.splice(currentNoteIndex, 1);
            db.collection('tasks').doc(currentTaskId).update({ notes: updatedNotes });
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
        const task = tasks.find(t => t.id === currentTaskId);

        if (task) {
            const newNote = {
                text: text,
                author: author,
                createdAt: new Date().toISOString()
            };
            // Simplest way: read task mirrors, update, write back
            const updatedNotes = task.notes ? [...task.notes, newNote] : [newNote];
            db.collection('tasks').doc(currentTaskId).update({ notes: updatedNotes });
            noteModal.style.display = 'none';
        }
    }

    // --- Global Trash/Archive Actions ---
    window.restoreTask = (trashId) => {
        const item = trash.find(t => t.id === trashId);
        if (item) {
            // Restore to main tasks
            db.collection('tasks').add({ ...item.task, status: item.task.status || 'todo' });
            // Remove from trash
            db.collection('trash').doc(trashId).delete();
        }
    }

    window.permDeleteTask = (trashId) => {
        if (!confirm('Bu öğeyi kalıcı olarak silmek istediğinize emin misiniz?')) return;
        db.collection('trash').doc(trashId).delete();
    }

    window.restoreArchive = (archiveId) => {
        const item = archive.find(t => t.id === archiveId);
        if (item) {
            db.collection('tasks').add({ ...item.task, status: 'done' });
            db.collection('archive').doc(archiveId).delete();
        }
    }

    window.permDeleteArchive = (archiveId) => {
        if (!confirm('Bu öğeyi kalıcı olarak silmek istediğinize emin misiniz?')) return;
        db.collection('archive').doc(archiveId).delete();
    }

    // --- Context Menu ---
    function showContextMenu(e, id, status) {
        currentTaskId = id;

        menuMoveTodo.style.display = 'none';
        menuMoveProgress.style.display = 'none';
        menuMoveProgressBack.style.display = 'none';
        menuMoveDone.style.display = 'none';
        menuMoveArchive.style.display = 'none';

        if (status === 'todo') {
            menuMoveProgress.style.display = 'flex';
        } else if (status === 'in-progress') {
            menuMoveTodo.style.display = 'flex';
            menuMoveDone.style.display = 'flex';
        } else if (status === 'done') {
            menuMoveProgressBack.style.display = 'flex';
            menuMoveArchive.style.display = 'flex';
        }


        contextMenu.style.display = 'block';

        // --- Smart Positioning ---
        const menuWidth = contextMenu.offsetWidth || 200;
        const menuHeight = contextMenu.offsetHeight || 250;

        let x = e.pageX;
        let y = e.pageY;

        // Check right edge
        if (x + menuWidth > window.innerWidth) {
            x = window.innerWidth - menuWidth - 10;
        }

        // Check bottom edge
        if (y + menuHeight > window.innerHeight + window.scrollY) {
            y = y - menuHeight;
        }

        // Final clamp
        x = Math.max(10, x);
        y = Math.max(10 + window.scrollY, y);

        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
    }

    function hideContextMenu() {
        contextMenu.style.display = 'none';
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

    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const action = item.dataset.action;
            if (!currentTaskId) return;

            // Hide context menu but keep ID for actions
            contextMenu.style.display = 'none';

            switch (action) {
                case 'add-note': openNoteModal(); break;
                case 'assign-yeliz': assignTask(currentTaskId, 'Yeliz'); break;
                case 'assign-berkan': assignTask(currentTaskId, 'Berkan'); break;
                case 'move-todo':
                    assignTask(currentTaskId, null);
                    updateTaskStatus(currentTaskId, 'todo');
                    break;
                case 'move-progress':
                case 'move-progress-back':
                    updateTaskStatus(currentTaskId, 'in-progress');
                    break;
                case 'move-done': updateTaskStatus(currentTaskId, 'done'); break;
                case 'move-archive': archiveTask(currentTaskId); break;
                case 'delete':
                    if (confirm('Bu görevi silmek istediğinize emin misiniz?')) deleteTask(currentTaskId);
                    break;
            }
        });
    });

    // Modal Events
    saveNoteBtn.addEventListener('click', saveNote);
    closeNoteModal.addEventListener('click', () => noteModal.style.display = 'none');

    updateNoteBtn.addEventListener('click', updateNote);
    deleteNoteBtn.addEventListener('click', deleteNote);
    closeEditNoteModal.addEventListener('click', () => editNoteModal.style.display = 'none');

    openTrashBtn.addEventListener('click', () => {
        trashModal.style.display = 'block';
    });
    closeTrashModal.addEventListener('click', () => trashModal.style.display = 'none');

    openArchiveBtn.addEventListener('click', () => {
        archiveModal.style.display = 'block';
    });
    closeArchiveModal.addEventListener('click', () => archiveModal.style.display = 'none');

    window.addEventListener('click', (e) => {
        if (e.target == noteModal) noteModal.style.display = 'none';
        if (e.target == trashModal) trashModal.style.display = 'none';
        if (e.target == editNoteModal) editNoteModal.style.display = 'none';
        if (e.target == archiveModal) archiveModal.style.display = 'none';
    });
});
