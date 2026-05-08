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
    let currentEditId = null;
    const metaDescInput = document.getElementById('blogMetaDesc');
    const metaCounter = document.getElementById('metaCounter');

    if (metaDescInput && metaCounter) {
        metaDescInput.addEventListener('input', () => {
            const length = metaDescInput.value.length;
            metaCounter.textContent = `${length} / 160`;
            if (length > 160) {
                metaCounter.style.color = '#ff4d4d';
            } else {
                metaCounter.style.color = 'var(--text-muted)';
            }
        });
    }

    const saveBtn = document.getElementById('saveBlogBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    function resetForm() {
        document.getElementById('blogTitle').value = '';
        document.getElementById('blogImage').value = '';
        document.getElementById('blogExcerpt').value = '';
        document.getElementById('blogMetaDesc').value = '';
        document.getElementById('blogKeywords').value = '';
        document.getElementById('blogContent').value = '';
        if (metaCounter) metaCounter.textContent = '0 / 160';
        currentEditId = null;
        if (saveBtn) saveBtn.innerHTML = "<i class='bx bx-save'></i> Blog Yazısını Yayınla";
        if (cancelEditBtn) cancelEditBtn.style.display = 'none';
    }

    cancelEditBtn?.addEventListener('click', resetForm);

    saveBtn?.addEventListener('click', async () => {
        const title = document.getElementById('blogTitle').value.trim();
        const image = document.getElementById('blogImage').value.trim();
        const excerpt = document.getElementById('blogExcerpt').value.trim();
        const content = document.getElementById('blogContent').value.trim();

        // SEO Fields
        const metaDesc = document.getElementById('blogMetaDesc').value.trim();
        const keywords = document.getElementById('blogKeywords').value.trim();

        if (!title || !content) {
            alert('Lütfen en az "Başlık" ve "İçerik" alanlarını doldurun.');
            return;
        }

        saveBtn.disabled = true;
        saveBtn.innerText = 'Kaydediliyor...';

        try {
            if (currentEditId) {
                await db.collection('blog_posts').doc(currentEditId).update({
                    title: title,
                    image: image || 'assets/blog-placeholder.jpg',
                    excerpt: excerpt,
                    metaDescription: metaDesc || excerpt,
                    keywords: keywords,
                    content: content
                });
                alert('Blog başarıyla güncellendi!');
            } else {
                await db.collection('blog_posts').add({
                    title: title,
                    image: image || 'assets/blog-placeholder.jpg',
                    excerpt: excerpt,
                    metaDescription: metaDesc || excerpt,
                    keywords: keywords,
                    content: content,
                    createdAt: new Date().toISOString()
                });
                alert('Blog başarıyla yayınlandı!');
            }
            resetForm();
            fetchBlogs();
        } catch (error) {
            alert('Hata oluştu: ' + error);
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = currentEditId ? "<i class='bx bx-edit'></i> Blog Yazısını Güncelle" : "<i class='bx bx-save'></i> Blog Yazısını Yayınla";
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
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn btn-outline" style="border-color: #4da6ff; color: #4da6ff; padding: 0.5rem 1rem;" onclick="editBlog('${doc.id}')">Düzenle</button>
                                <button class="btn btn-outline" style="border-color: #ff4d4d; color: #ff4d4d; padding: 0.5rem 1rem;" onclick="deleteBlog('${doc.id}')">Sil</button>
                            </div>
                        </div>
                    `;
                });

                if (snapshot.empty) html += '<p style="color:#aaa;">Henüz yazı eklenmedi.</p>';
                listContainer.innerHTML = html;
            });
    }

    // --- Edit Blog Global Fonksiyon ---
    window.editBlog = async (id) => {
        try {
            const docRef = await db.collection('blog_posts').doc(id).get();
            if (docRef.exists) {
                const post = docRef.data();
                
                document.getElementById('blogTitle').value = post.title || '';
                document.getElementById('blogImage').value = (post.image === 'assets/blog-placeholder.jpg') ? '' : (post.image || '');
                document.getElementById('blogExcerpt').value = post.excerpt || '';
                document.getElementById('blogMetaDesc').value = post.metaDescription || '';
                document.getElementById('blogKeywords').value = post.keywords || '';
                document.getElementById('blogContent').value = post.content || '';
                
                if (metaCounter) {
                    const len = (post.metaDescription || '').length;
                    metaCounter.textContent = `${len} / 160`;
                    metaCounter.style.color = len > 160 ? '#ff4d4d' : 'var(--text-muted)';
                }

                currentEditId = id;
                const saveBtn = document.getElementById('saveBlogBtn');
                const cancelEditBtn = document.getElementById('cancelEditBtn');
                
                if (saveBtn) saveBtn.innerHTML = "<i class='bx bx-edit'></i> Blog Yazısını Güncelle";
                if (cancelEditBtn) cancelEditBtn.style.display = 'block';
                
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            console.error("Düzenleme hatası:", err);
            alert("Blog bilgileri alınırken hata oluştu.");
        }
    };

    // --- Delete Blog Global Fonksiyon ---
    window.deleteBlog = async (id) => {
        if (confirm('Yazıyı silmek istediğinizden emin misiniz?')) {
            await db.collection('blog_posts').doc(id).delete();
        }
    };
});
