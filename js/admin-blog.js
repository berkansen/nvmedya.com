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
    // --- Auth Logic ---
    const loginOverlay = document.getElementById('loginOverlay');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Login Action
    loginBtn?.addEventListener('click', () => {
        const username = document.getElementById('loginUsername').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value.trim();

        let email = username;
        if (!email.includes('@')) email = `${username}@nisanvitrini.com`;

        auth.signInWithEmailAndPassword(email, password)
            .catch(error => alert('Giriş başarısız: ' + error.message));
    });

    // Logout Action
    logoutBtn?.addEventListener('click', () => {
        if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
            auth.signOut().then(() => location.reload());
        }
    });

    // Toggle password
    const toggleBtn = document.getElementById('togglePasswordBtn');
    toggleBtn?.addEventListener('click', () => {
        const input = document.getElementById('loginPassword');
        if (input.type === 'password') {
            input.type = 'text';
            toggleBtn.classList.replace('bx-show', 'bx-hide');
        } else {
            input.type = 'password';
            toggleBtn.classList.replace('bx-hide', 'bx-show');
        }
    });

    // Auth State
    auth.onAuthStateChanged(user => {
        if (user) {
            loginOverlay.style.display = 'none';
            fetchBlogs(); // Load blogs after login
        } else {
            loginOverlay.style.display = 'flex';
        }
    });

    // --- Editor Logic ---
    const saveBtn = document.getElementById('saveBlogBtn');
    saveBtn?.addEventListener('click', async () => {
        const title = document.getElementById('blogTitle').value.trim();
        const image = document.getElementById('blogImage').value.trim();
        const excerpt = document.getElementById('blogExcerpt').value.trim();
        const content = document.getElementById('blogContent').value.trim();

        if (!title || !content) {
            alert('Lütfen en az "Başlık" ve "İçerik" alanlarını doldurun.');
            return;
        }

        saveBtn.disabled = true;
        saveBtn.innerText = 'Kaydediliyor...';

        try {
            await db.collection('blog_posts').add({
                title: title,
                image: image || 'assets/blog-placeholder.jpg', // Default resim eklenebilir
                excerpt: excerpt,
                content: content,
                createdAt: new Date().toISOString()
            });
            alert('Blog başarıyla yayınlandı!');
            // Temizle
            document.getElementById('blogTitle').value = '';
            document.getElementById('blogImage').value = '';
            document.getElementById('blogExcerpt').value = '';
            document.getElementById('blogContent').value = '';
            fetchBlogs();
        } catch (error) {
            alert('Hata oluştu: ' + error);
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = "<i class='bx bx-save'></i> Blog Yazısını Yayınla";
        }
    });

    // --- Fetch Blogs ---
    function fetchBlogs() {
        const listContainer = document.getElementById('adminBlogList');
        if (!listContainer) return;

        db.collection('blog_posts')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                // Sadece başlık etiketini ve mevcut öğeleri tutarak güncelle (Eğer h3 var diye tüm innerHTML silinirse, header gidiyor)
                let html = '<h3 style="margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">Mevcut Blog Yazıları</h3>';

                snapshot.forEach(doc => {
                    const post = doc.data();
                    const dateStr = new Date(post.createdAt).toLocaleDateString('tr-TR');

                    html += `
                        <div class="blog-item">
                            <div>
                                <strong>${post.title}</strong>
                                <div style="font-size: 0.8rem; color: #aaa;">Yayın: ${dateStr}</div>
                            </div>
                            <button class="btn btn-outline" style="border-color: #ff4d4d; color: #ff4d4d; padding: 0.5rem 1rem;" onclick="deleteBlog('${doc.id}')">Sil</button>
                        </div>
                    `;
                });

                if (snapshot.empty) html += '<p style="color:#aaa;">Henüz yazı eklenmedi.</p>';
                listContainer.innerHTML = html;
            });
    }

    // --- Delete Blog Global Fonksiyon ---
    window.deleteBlog = async (id) => {
        if (confirm('Yazıyı silmek istediğinizden emin misiniz?')) {
            await db.collection('blog_posts').doc(id).delete();
        }
    };
});
