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
const auth = firebase.auth();


document.addEventListener('DOMContentLoaded', () => {
    // --- Auth Logic & State ---
    const loginOverlay = document.getElementById('loginOverlay');
    const loginBtn = document.getElementById('loginBtn');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginUsernameInput = document.getElementById('loginUsername');
    const logoutBtn = document.getElementById('logoutBtn');

    // Toggle Password Visibility
    const toggleBtn = document.getElementById('togglePasswordBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const type = loginPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            loginPasswordInput.setAttribute('type', type);
            if (type === 'text') {
                toggleBtn.classList.remove('bx-show');
                toggleBtn.classList.add('bx-hide');
            } else {
                toggleBtn.classList.remove('bx-hide');
                toggleBtn.classList.add('bx-show');
            }
        });
    }

    // Unsubscribe functions tracker
    let unsubscribers = [];

    const unlock = () => {
        loginOverlay.style.opacity = '0';
        setTimeout(() => {
            loginOverlay.style.display = 'none';
        }, 500);
    };

    // Login Action
    loginBtn.addEventListener('click', () => {
        const username = loginUsernameInput.value.trim().toLowerCase();
        const password = loginPasswordInput.value.trim();

        let email = username;
        if (!email.includes('@')) {
            email = `${username}@nisanvitrini.com`;
        }

        auth.signInWithEmailAndPassword(email, password)
            .catch((error) => {
                let msg = 'Hatalı kullanıcı adı veya şifre!';
                if (error.code === 'auth/user-not-found') msg = 'Kullanıcı bulunamadı.';
                if (error.code === 'auth/wrong-password') msg = 'Şifre hatalı.';
                console.error(error);
                alert(msg);
            });
    });

    // Logout Action
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
                auth.signOut().then(() => {
                    location.reload();
                });
            }
        });
    }

    // Auth State Change
    auth.onAuthStateChanged(user => {
        if (user) {
            // Derive display name
            let displayName = 'Misafir';
            if (user.email.includes('berkan')) displayName = 'Berkan';
            else if (user.email.includes('yeliz')) displayName = 'Yeliz';

            localStorage.setItem('nvm_active_user', displayName);
            unlock();
            setupRealtimeListeners(user);
        } else {
            localStorage.removeItem('nvm_active_user');
            loginOverlay.style.display = 'flex';
            loginOverlay.style.opacity = '1';

            // Unsubscribe from updates
            unsubscribers.forEach(unsub => unsub());
            unsubscribers = [];
        }
    });

    // Wrapper for Real-time Listeners
    function setupRealtimeListeners(user) {
        if (unsubscribers.length > 0) return; // Prevent duplicate listeners

        // 1. Listen for Tasks
        unsubscribers.push(db.collection('tasks').onSnapshot(snapshot => {
            tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            renderTasks();
        }, err => console.log('Tasks Error:', err)));

        // 2. Listen for Trash
        unsubscribers.push(db.collection('trash').onSnapshot(snapshot => {
            trash = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderTrash();
        }));

        // 3. Listen for Archive
        unsubscribers.push(db.collection('archive').onSnapshot(snapshot => {
            archive = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderArchive();
        }));

        // 4. Listen for Personal Notes
        unsubscribers.push(db.collection('personal_notes').onSnapshot(snapshot => {
            const activeUser = localStorage.getItem('nvm_active_user');
            personalNotes = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(note => note.owner === activeUser);
            personalNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            renderPersonalNotes();
        }));
    }

    // --- State Management ---
    let tasks = [];
    let trash = [];
    let archive = [];
    let personalNotes = [];

    // --- DOM Elements ---
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const colTodo = document.getElementById('list-todo');
    const colProgress = document.getElementById('list-in-progress');
    const colDone = document.getElementById('list-done');
    const contextMenu = document.getElementById('contextMenu');

    const filterMyTasksBtn = document.getElementById('filterMyTasksBtn');

    // Context Menu Items
    const menuMoveTodo = document.getElementById('menuMoveTodo');
    const menuMoveProgress = document.getElementById('menuMoveProgress');
    const menuMoveProgressBack = document.getElementById('menuMoveProgressBack');
    const menuMoveDone = document.getElementById('menuMoveDone');
    const menuMoveArchive = document.getElementById('menuMoveArchive');

    // Task Edit Elements
    const editTaskModal = document.getElementById('editTaskModal');
    const editTaskInput = document.getElementById('editTaskInput');
    const updateTaskBtn = document.getElementById('updateTaskBtn');
    const closeEditTaskModal = document.getElementById('closeEditTaskModal');

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
    const noteEditInfo = document.getElementById('noteEditInfo');
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

    // Personal Notes Elements
    const personalNotesBtn = document.getElementById('personalNotesBtn');
    const personalNotesModal = document.getElementById('personalNotesModal');
    const closePersonalNotesModal = document.getElementById('closePersonalNotesModal');
    const newPersonalNoteInput = document.getElementById('newPersonalNoteInput');
    const addPersonalNoteBtn = document.getElementById('addPersonalNoteBtn');
    const personalNotesList = document.getElementById('personalNotesList');

    let currentTaskId = null;
    let currentNoteIndex = null;
    let showMyTasks = false; // Filter state

    // --- Constants ---
    const TASK_COLORS = [
        '#FF5252', '#FF9800', '#FFD740', '#69F0AE',
        '#40C4FF', '#7C4DFF', '#FF4081'
    ];

    // --- Real-time Listeners ---

    // --- Real-time listeners are now handled in setupRealtimeListeners ---

    // --- Cleanup Logic ---
    const runCleanup = () => {
        const d15 = new Date(); d15.setDate(d15.getDate() - 15);
        const d60 = new Date(); d60.setDate(d60.getDate() - 60);

        db.collection('trash').where('deletedAt', '<', d15.toISOString()).get()
            .then(snap => snap.forEach(doc => doc.ref.delete()));

        db.collection('archive').where('archivedAt', '<', d60.toISOString()).get()
            .then(snap => snap.forEach(doc => doc.ref.delete()));
    };
    runCleanup();

    // --- Sharing Helper ---
    window.shareToWhatsApp = (text) => {
        if (!text) return;
        const encodedText = encodeURIComponent(text);
        const url = `https://wa.me/?text=${encodedText}`;
        window.open(url, '_blank');
    }

    // --- Render Functions ---

    function linkify(text) {
        if (!text) return '';
        const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        return text.replace(urlPattern, (url) => {
            let displayUrl = url;
            if (url.length > 30) {
                displayUrl = url.substring(0, 27) + '...';
            }
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #4da6ff; text-decoration: underline;" onclick="event.stopPropagation();">${displayUrl}</a>`;
        });
    }

    function renderTasks() {
        colTodo.innerHTML = '';
        colProgress.innerHTML = '';
        colDone.innerHTML = '';

        let cTodo = 0, cProgress = 0, cDone = 0;

        let displayTasks = tasks;
        if (showMyTasks) {
            const activeUser = localStorage.getItem('nvm_active_user');
            displayTasks = tasks.filter(t => t.assignee === activeUser);
        }

        displayTasks.forEach(task => {
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
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; width:100%;">
                                <div><span class="note-author">${note.author}:</span> ${linkify(note.text)}</div>
                                <i class='bx bxl-whatsapp' style="cursor:pointer; font-size:1.1rem; margin-left:5px; color:#25D366;" onclick="window.shareNote(event, '${task.id}', ${index})"></i>
                            </div>
                        </div>
                    `;
                });
                notesHtml += '</div>';
            }

            // Date Formatting
            const dateObj = new Date(task.createdAt);
            const dateStr = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            // Created By info
            const createdByInfo = task.createdByName ? ` • ${task.createdByName} oluşturdu` : '';

            taskCard.innerHTML = `
                ${assigneeHtml}
                <button class="card-menu-btn"><i class='bx bx-dots-vertical-rounded'></i></button>
                <div class="task-content">
                    <p class="task-text">${task.text}</p>
                    ${notesHtml}
                </div>
                <div class="task-date">${dateStr}${createdByInfo}</div>
                <div class="expand-hint"><i class='bx bx-chevron-down'></i></div>
            `;

            // Expand/Collapse
            taskCard.addEventListener('click', (e) => {
                if (e.target.closest('.note-item') || e.target.closest('.btn') || e.target.closest('.card-menu-btn')) return;
                taskCard.classList.toggle('expanded');
            });

            // Menu Button Click
            const menuBtn = taskCard.querySelector('.card-menu-btn');
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const rect = menuBtn.getBoundingClientRect();
                const fakeEvent = {
                    pageX: rect.left,
                    pageY: rect.bottom + 5,
                    preventDefault: () => { }
                };
                showContextMenu(fakeEvent, task.id, task.status);
            });

            // Context Menu
            taskCard.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showContextMenu(e, task.id, task.status);
            });

            // Append
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

    function renderPersonalNotes() {
        personalNotesList.innerHTML = '';
        if (personalNotes.length === 0) {
            personalNotesList.innerHTML = '<p class="text-center" style="color:var(--text-muted)">Henüz notunuz yok.</p>';
            return;
        }

        personalNotes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = 'personal-note-item';
            const dateStr = new Date(note.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });

            noteItem.innerHTML = `
                <div style="padding-right: 40px;">${linkify(note.text)}</div>
                <span class="personal-note-date">${dateStr}</span>
                <div style="position: absolute; top: 10px; right: 10px; display:flex; gap:5px;">
                     <i class='bx bxl-whatsapp' style="cursor:pointer; font-size:1.2rem; color:#25D366;" onclick="window.sharePersonalNote('${note.id}')"></i>
                     <i class='bx bx-trash' style="cursor:pointer; font-size:1.2rem; color:#ff4d4d;" onclick="window.deletePersonalNote('${note.id}')"></i>
                </div>
            `;
            personalNotesList.appendChild(noteItem);
        });
    }

    // --- Actions ---
    function addTask() {
        const text = taskInput.value.trim();
        if (!text) return;

        const activeUser = localStorage.getItem('nvm_active_user') || 'Bilinmeyen';

        // Assign a color
        const colorIndex = tasks.length % 7;

        db.collection('tasks').add({
            text: text,
            status: 'todo',
            assignee: null,
            createdByName: activeUser, // Track who created it
            createdAt: new Date().toISOString(),
            notes: [],
            colorIndex: colorIndex
        });

        taskInput.value = '';
    }

    function updateTaskStatus(id, newStatus) {
        db.collection('tasks').doc(id).update({ status: newStatus })
            .catch(err => {
                console.error("Status update error:", err);
                if (err.message.includes("No document to update") || err.code === 'not-found') {
                    alert("Bu görev veritabanında bulunamadı (daha önce silinmiş olabilir), listeden kaldırılıyor.");
                    // Ghost task cleanup
                    tasks = tasks.filter(t => t.id !== id);
                    renderTasks();
                } else {
                    alert("Durum güncellenemedi: " + err.message);
                }
            });
    }

    function assignTask(id, person) {
        db.collection('tasks').doc(id).update({ assignee: person })
            .catch(err => {
                console.error("Assign error:", err);
                if (err.message.includes("No document to update") || err.code === 'not-found') {
                    alert("Bu görev veritabanında bulunamadı, listeden kaldırılıyor.");
                    tasks = tasks.filter(t => t.id !== id);
                    renderTasks();
                } else {
                    alert("Atama yapılamadı: " + err.message);
                }
            });
    }

    function deleteTask(id) {
        // Manually remove from UI immediately to fix "stuck task" issue
        // If it exists on server, snapshot will confirm. If not, this fixes the ghost.
        const originalTasks = [...tasks]; // Backup in case of error (unlikely for delete)

        // Optimistic update
        tasks = tasks.filter(t => t.id !== id);
        renderTasks();

        const task = originalTasks.find(t => t.id === id);

        if (task) {
            // Try backup (won't block UI if fails)
            db.collection('trash').add({
                task: task,
                deletedAt: new Date().toISOString()
            }).catch(e => console.log('Trash backup skip', e));
        }

        db.collection('tasks').doc(id).delete()
            .then(() => {
                console.log("Task deleted from server (or didn't exist)");
            })
            .catch(err => {
                console.error("Delete error:", err);
                // If strictly permission error, revert UI (optional, but requested "force delete" so maybe not)
                // For now, assume if delete fails on server, we still want it gone from UI if the user commanded it,
                // unless it's a permission thing. But user is admin-ish.
                alert("Uyarı: Silme işlemi sunucuda hata verdi (" + err.message + ") ancak ekranınızdan kaldırıldı.");
            });
    }

    function archiveTask(id) {
        const task = tasks.find(t => t.id === id);

        // Optimistic remove
        tasks = tasks.filter(t => t.id !== id);
        renderTasks();

        if (task) {
            db.collection('archive').add({
                task: task,
                archivedAt: new Date().toISOString()
            }).catch(e => console.log('Archive backup skip', e));

            db.collection('tasks').doc(id).delete()
                .catch(err => {
                    console.error("Archive delete error:", err);
                    alert("Arşivleme sunucuda tamamlanamadı ancak ekranınızdan kaldırıldı: " + err.message);
                });
        }
    }

    // --- Task Editing ---
    function openEditTaskModal(id) {
        const activeUser = localStorage.getItem('nvm_active_user');
        const task = tasks.find(t => t.id === id);

        if (task) {
            editTaskInput.value = task.text;
            editTaskModal.style.display = 'block';
        }
    }

    function updateTask() {
        if (!currentTaskId) return;
        const text = editTaskInput.value.trim();
        if (!text) return;

        db.collection('tasks').doc(currentTaskId).update({ text: text });
        editTaskModal.style.display = 'none';
    }

    // --- Notes Management ---
    window.openEditNote = (taskId, noteIndex, e) => {
        e.stopPropagation();
        currentTaskId = taskId;
        currentNoteIndex = noteIndex;

        const task = tasks.find(t => t.id === taskId);
        if (task && task.notes[noteIndex]) {
            const note = task.notes[noteIndex];
            editNoteText.value = note.text;

            // Show Last Edited Info
            if (note.lastEditedBy) {
                const date = new Date(note.lastEditedAt).toLocaleString('tr-TR', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
                noteEditInfo.textContent = `Son düzenleyen: ${note.lastEditedBy} (${date})`;
                noteEditInfo.style.display = 'block';
            } else {
                noteEditInfo.style.display = 'none';
            }

            editNoteModal.style.display = 'block';
        }
    }

    function updateNote() {
        if (!currentTaskId || currentNoteIndex === null) return;
        const text = editNoteText.value.trim();
        if (!text) return;

        const activeUser = localStorage.getItem('nvm_active_user') || 'Bilinmeyen';

        const task = tasks.find(t => t.id === currentTaskId);
        if (task) {
            const updatedNotes = [...task.notes];

            // Update Text and Add Audit Trail
            updatedNotes[currentNoteIndex].text = text;
            updatedNotes[currentNoteIndex].lastEditedBy = activeUser;
            updatedNotes[currentNoteIndex].lastEditedAt = new Date().toISOString();

            db.collection('tasks').doc(currentTaskId).update({ notes: updatedNotes });
            editNoteModal.style.display = 'none';
        }
    }

    function deleteNote() {
        if (!currentTaskId || currentNoteIndex === null) return;

        const activeUser = localStorage.getItem('nvm_active_user');
        const task = tasks.find(t => t.id === currentTaskId);

        if (task && task.notes[currentNoteIndex]) {
            const note = task.notes[currentNoteIndex];

            // Permission Check
            if (note.author !== activeUser) {
                alert(`Bu notu sadece yazan kişi (${note.author}) silebilir!`);
                return;
            }

            if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;

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

        // Auto-assign author
        const author = localStorage.getItem('nvm_active_user') || 'Bilinmeyen';

        const task = tasks.find(t => t.id === currentTaskId);

        if (task) {
            const newNote = {
                text: text,
                author: author,
                createdAt: new Date().toISOString()
            };
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

    // --- Personal Notes Logic ---
    function addPersonalNote() {
        const text = newPersonalNoteInput.value.trim();
        if (!text) return;

        const activeUser = localStorage.getItem('nvm_active_user');

        db.collection('personal_notes').add({
            text: text,
            owner: activeUser,
            createdAt: new Date().toISOString()
        });

        newPersonalNoteInput.value = '';
        newPersonalNoteInput.focus();
    }

    window.shareNote = (e, taskId, index) => {
        e.stopPropagation();
        const task = tasks.find(t => t.id === taskId);
        if (task && task.notes[index]) {
            const note = task.notes[index];
            const textToShare = `*Not Paylaşımı*\n\n"${note.text}"\n\n- ${note.author}`;
            window.shareToWhatsApp(textToShare);
        }
    }

    window.sharePersonalNote = (noteId) => {
        const note = personalNotes.find(n => n.id === noteId);
        if (note) {
            const textToShare = `*Kişisel Not*\n\n"${note.text}"`;
            window.shareToWhatsApp(textToShare);
        }
    }

    window.deletePersonalNote = (noteId) => {
        if (confirm('Notu silmek istediğinize emin misiniz?')) {
            db.collection('personal_notes').doc(noteId).delete();
        }
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

    if (filterMyTasksBtn) {
        filterMyTasksBtn.addEventListener('click', () => {
            showMyTasks = !showMyTasks;

            if (showMyTasks) {
                filterMyTasksBtn.classList.add('active');
                filterMyTasksBtn.innerHTML = "<i class='bx bx-x'></i> Filtreyi Temizle";
            } else {
                filterMyTasksBtn.classList.remove('active');
                filterMyTasksBtn.innerHTML = "<i class='bx bx-user-check'></i> Bana Atananlar";
            }
            // Clear inline styles to let CSS take over
            filterMyTasksBtn.style.background = '';
            filterMyTasksBtn.style.borderColor = '';

            renderTasks();
        });
    }

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
                case 'edit-task':
                    openEditTaskModal(currentTaskId);
                    break;
                case 'share-whatsapp':
                    const taskToShare = tasks.find(t => t.id === currentTaskId);
                    if (taskToShare) {
                        const date = new Date(taskToShare.createdAt).toLocaleDateString('tr-TR');
                        const assignee = taskToShare.assignee ? taskToShare.assignee : 'Atanmadı';
                        const text = `*Proje/Görev Detayı*\n\n*İş:* ${taskToShare.text}\n*Durum:* ${getStatusText(taskToShare.status)}\n*Atanan:* ${assignee}\n*Tarih:* ${date}`;
                        window.shareToWhatsApp(text);
                    }
                    break;
            }
        });
    });

    // Helper for status text
    function getStatusText(status) {
        if (status === 'todo') return 'Sahipsiz İşler';
        if (status === 'in-progress') return 'Yapılıyor';
        if (status === 'done') return 'Tamamlandı';
        return '';
    }

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

    // Personal Notes Events
    if (personalNotesBtn) {
        personalNotesBtn.addEventListener('click', () => {
            personalNotesModal.style.display = 'block';
            newPersonalNoteInput.focus();
        });
    }
    closePersonalNotesModal.addEventListener('click', () => personalNotesModal.style.display = 'none');
    addPersonalNoteBtn.addEventListener('click', addPersonalNote);
    newPersonalNoteInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPersonalNote();
    });

    window.addEventListener('click', (e) => {
        if (e.target == noteModal) noteModal.style.display = 'none';
        if (e.target == trashModal) trashModal.style.display = 'none';
        if (e.target == editNoteModal) editNoteModal.style.display = 'none';
        if (e.target == archiveModal) archiveModal.style.display = 'none';
        if (e.target == editTaskModal) editTaskModal.style.display = 'none';
        if (e.target == personalNotesModal) personalNotesModal.style.display = 'none';
    });

    // Task Edit Events
    updateTaskBtn.addEventListener('click', updateTask);
    closeEditTaskModal.addEventListener('click', () => editTaskModal.style.display = 'none');

});
