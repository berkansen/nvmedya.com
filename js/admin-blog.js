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

    // Set SESSION Persistence for Admin Panel
    auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
        .catch(err => console.error("Persistence error:", err));

    // Login Action
    loginBtn?.addEventListener('click', async () => {
        const username = document.getElementById('loginUsername').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value.trim();

        if (!username || !password) {
            alert('Lütfen kullanıcı adı ve şifrenizi giriniz.');
            return;
        }

        let email = username;
        if (!email.includes('@')) email = `${username}@nisanvitrini.com`;

        try {
            await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            console.error("Auth error:", error.code);
            // Generic security error message (Prevents user enumeration)
            alert('Giriş bilgileri hatalı veya erişim yetkiniz bulunmuyor.');
        }
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

    const BERKAN_ADMIN_UID = '1fkHpAlnCkTVp0h4k8BOqI2PBGt2';

    // Auth State
    auth.onAuthStateChanged(user => {
        if (user) {
            const isAuthorized = user.uid === BERKAN_ADMIN_UID;

            if (!isAuthorized) {
                alert('Bu panele erişim yetkiniz bulunmamaktadır.');
                auth.signOut().then(() => {
                    loginOverlay.style.display = 'flex';
                });
                return;
            }

            loginOverlay.style.display = 'none';
            fetchBlogs(); // Load blogs after login
        } else {
            loginOverlay.style.display = 'flex';
        }
    });

    // --- Slug Normalization Standard ---
    function slugify(text) {
        if (!text) return '';
        const trMap = {
            'ç': 'c', 'Ç': 'c',
            'ğ': 'g', 'Ğ': 'g',
            'ı': 'i', 'I': 'i', 'İ': 'i',
            'ö': 'o', 'Ö': 'o',
            'ş': 's', 'Ş': 's',
            'ü': 'u', 'Ü': 'u'
        };
        let str = text.toString();
        for (const [key, val] of Object.entries(trMap)) {
            str = str.split(key).join(val);
        }
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // remove diacritics
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric except space and hyphen
            .replace(/[\s_]+/g, '-') // spaces and underscores to hyphen
            .replace(/-+/g, '-') // collapse consecutive hyphens
            .replace(/^-+|-+$/g, '') // trim hyphens
            .substring(0, 120); // max 120 chars
    }

    // --- Editor Logic ---
    let currentEditId = null;
    let isSlugManuallyEdited = false;

    const titleInput = document.getElementById('blogTitle');
    const slugInput = document.getElementById('blogSlug');
    const metaDescInput = document.getElementById('blogMetaDesc');
    const metaCounter = document.getElementById('metaCounter');

    if (titleInput && slugInput) {
        titleInput.addEventListener('input', () => {
            if (!isSlugManuallyEdited && !slugInput.disabled) {
                slugInput.value = slugify(titleInput.value);
            }
        });

        slugInput.addEventListener('input', () => {
            isSlugManuallyEdited = slugInput.value.trim().length > 0;
        });
    }

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
        if (document.getElementById('blogStatus')) document.getElementById('blogStatus').value = 'draft';
        if (titleInput) titleInput.value = '';
        if (slugInput) {
            slugInput.value = '';
            slugInput.disabled = false;
            slugInput.style.opacity = '1';
            slugInput.style.cursor = 'text';
        }
        isSlugManuallyEdited = false;
        document.getElementById('blogImage').value = '';
        if (document.getElementById('blogImageAlt')) document.getElementById('blogImageAlt').value = '';
        if (document.getElementById('blogAuthor')) document.getElementById('blogAuthor').value = 'Nisan Vitrini Media';
        document.getElementById('blogExcerpt').value = '';
        if (document.getElementById('blogSeoTitle')) document.getElementById('blogSeoTitle').value = '';
        document.getElementById('blogMetaDesc').value = '';
        document.getElementById('blogKeywords').value = '';
        if (document.getElementById('blogGeoSummary')) document.getElementById('blogGeoSummary').value = '';
        document.getElementById('blogContent').value = '';
        if (metaCounter) metaCounter.textContent = '0 / 160';
        currentEditId = null;
        if (saveBtn) saveBtn.innerHTML = "<i class='bx bx-save'></i> Blog Yazısını Kaydet";
        if (cancelEditBtn) cancelEditBtn.style.display = 'none';
    }

    cancelEditBtn?.addEventListener('click', resetForm);

    saveBtn?.addEventListener('click', async () => {
        const status = (document.getElementById('blogStatus')?.value || 'draft') === 'published' ? 'published' : 'draft';
        const title = document.getElementById('blogTitle').value.trim();
        const rawSlug = document.getElementById('blogSlug')?.value.trim() || '';
        const image = document.getElementById('blogImage').value.trim();
        const imageAlt = document.getElementById('blogImageAlt')?.value.trim() || '';
        const authorName = document.getElementById('blogAuthor')?.value.trim() || 'Nisan Vitrini Media';
        const excerpt = document.getElementById('blogExcerpt').value.trim();
        const rawContent = document.getElementById('blogContent').value.trim();

        // SEO & GEO Fields
        const seoTitle = document.getElementById('blogSeoTitle')?.value.trim() || '';
        const metaDesc = document.getElementById('blogMetaDesc').value.trim();
        const keywords = document.getElementById('blogKeywords').value.trim();
        const geoSummary = document.getElementById('blogGeoSummary')?.value.trim() || '';

        if (!title || !rawContent) {
            alert('Lütfen en az "Başlık" ve "İçerik" alanlarını doldurun.');
            return;
        }

        // Slug Validation & Normalization
        const cleanSlug = slugify(rawSlug || title);
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

        if (!cleanSlug || !slugRegex.test(cleanSlug) || cleanSlug.length > 120) {
            alert('Geçersiz URL Slug formatı. Slug yalnızca küçük harfler, rakamlar ve tire içermelidir (En fazla 120 karakter).');
            return;
        }

        // Save-time sanitization (Defense in depth)
        const purifyConfig = {
            ALLOWED_TAGS: [
                'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
                'strong', 'b', 'em', 'i', 'u', 's', 'strike',
                'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
                'a', 'img', 'figure', 'figcaption', 'span', 'div'
            ],
            ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'class', 'width', 'height'],
            ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
            ADD_ATTR: ['target'],
            FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'style'],
            FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'style']
        };

        const cleanContent = (typeof DOMPurify !== 'undefined') ? DOMPurify.sanitize(rawContent, purifyConfig) : rawContent;
        const cleanTitle = (typeof DOMPurify !== 'undefined') ? DOMPurify.sanitize(title) : title;
        const cleanExcerpt = (typeof DOMPurify !== 'undefined') ? DOMPurify.sanitize(excerpt) : excerpt;
        const cleanMetaDesc = (typeof DOMPurify !== 'undefined') ? DOMPurify.sanitize(metaDesc) : metaDesc;
        const cleanImageAlt = (typeof DOMPurify !== 'undefined') ? DOMPurify.sanitize(imageAlt) : imageAlt;
        const cleanSeoTitle = (typeof DOMPurify !== 'undefined') ? DOMPurify.sanitize(seoTitle) : seoTitle;
        const cleanAuthor = (typeof DOMPurify !== 'undefined') ? DOMPurify.sanitize(authorName) : authorName;
        const cleanGeoSummary = (typeof DOMPurify !== 'undefined') ? DOMPurify.sanitize(geoSummary) : geoSummary;

        saveBtn.disabled = true;
        saveBtn.innerText = 'Doğrulanıyor ve Kaydediliyor...';

        try {
            // Slug Uniqueness Check (Operational Protection)
            const slugCheckSnap = await db.collection('blog_posts').where('slug', '==', cleanSlug).get();
            const isDuplicate = slugCheckSnap.docs.some(docSnap => docSnap.id !== currentEditId);

            if (isDuplicate) {
                alert(`"${cleanSlug}" URL slugı başka bir blog yazısında kullanılıyor. Lütfen benzersiz bir URL slugı belirleyin.`);
                saveBtn.disabled = false;
                saveBtn.innerHTML = currentEditId ? "<i class='bx bx-edit'></i> Blog Yazısını Güncelle" : "<i class='bx bx-save'></i> Blog Yazısını Kaydet";
                return;
            }

            const now = new Date().toISOString();

            if (currentEditId) {
                const docRef = await db.collection('blog_posts').doc(currentEditId).get();
                const prevData = docRef.exists ? docRef.data() : {};

                // Slug Immutability: If post was previously published (has publishedAt), keep original slug
                const finalSlug = prevData.publishedAt ? (prevData.slug || cleanSlug) : cleanSlug;

                const updatePayload = {
                    title: cleanTitle,
                    slug: finalSlug,
                    image: image || 'assets/blog-placeholder.svg',
                    imageAlt: cleanImageAlt || cleanTitle,
                    authorName: cleanAuthor || 'Nisan Vitrini Media',
                    excerpt: cleanExcerpt,
                    seoTitle: cleanSeoTitle || cleanTitle,
                    metaDescription: cleanMetaDesc || cleanExcerpt,
                    keywords: keywords,
                    geoSummary: cleanGeoSummary,
                    content: cleanContent,
                    status: status,
                    updatedAt: now
                };

                // Manage publishedAt timestamp preservation
                if (status === 'published') {
                    updatePayload.publishedAt = prevData.publishedAt || now;
                } else if (prevData.publishedAt) {
                    updatePayload.publishedAt = prevData.publishedAt;
                }

                await db.collection('blog_posts').doc(currentEditId).update(updatePayload);
                alert('Blog başarıyla güncellendi!');
            } else {
                const createPayload = {
                    title: cleanTitle,
                    slug: cleanSlug,
                    image: image || 'assets/blog-placeholder.svg',
                    imageAlt: cleanImageAlt || cleanTitle,
                    authorName: cleanAuthor || 'Nisan Vitrini Media',
                    excerpt: cleanExcerpt,
                    seoTitle: cleanSeoTitle || cleanTitle,
                    metaDescription: cleanMetaDesc || cleanExcerpt,
                    keywords: keywords,
                    geoSummary: cleanGeoSummary,
                    content: cleanContent,
                    status: status,
                    createdAt: now,
                    updatedAt: now
                };

                if (status === 'published') {
                    createPayload.publishedAt = now;
                }

                await db.collection('blog_posts').add(createPayload);
                alert(status === 'published' ? 'Blog başarıyla yayınlandı!' : 'Blog taslak olarak kaydedildi!');
            }
            resetForm();
            fetchBlogs();
        } catch (error) {
            console.error("Save error:", error);
            alert('Kayıt sırasında yetki veya işlem hatası oluştu: ' + (error.message || ''));
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = currentEditId ? "<i class='bx bx-edit'></i> Blog Yazısını Güncelle" : "<i class='bx bx-save'></i> Blog Yazısını Kaydet";
        }
    });

    // --- Fetch Blogs ---
    function fetchBlogs() {
        const listContainer = document.getElementById('adminBlogList');
        if (!listContainer) return;

        db.collection('blog_posts')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                let html = '<h3 style="margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">Mevcut Blog Yazıları</h3>';

                snapshot.forEach(doc => {
                    const post = doc.data();
                    const dateStr = new Date(post.createdAt || Date.now()).toLocaleDateString('tr-TR');
                    const isPublished = post.status === 'published';
                    const statusBadge = isPublished
                        ? '<span style="background: rgba(46, 213, 115, 0.15); color: #2ed573; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; margin-left: 8px; font-weight: 500;">Yayında</span>'
                        : '<span style="background: rgba(255, 171, 0, 0.15); color: #ffab00; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; margin-left: 8px; font-weight: 500;">Taslak</span>';

                    html += `
                        <div class="blog-item">
                            <div>
                                <strong>${post.title}</strong> ${statusBadge}
                                <div style="font-size: 0.8rem; color: #aaa; margin-top: 4px;">Kayıt: ${dateStr}${post.publishedAt ? ' • Yayın: ' + new Date(post.publishedAt).toLocaleDateString('tr-TR') : ''}</div>
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
                
                if (document.getElementById('blogStatus')) {
                    document.getElementById('blogStatus').value = post.status === 'published' ? 'published' : 'draft';
                }
                if (document.getElementById('blogTitle')) {
                    document.getElementById('blogTitle').value = post.title || '';
                }
                const editSlugInput = document.getElementById('blogSlug');
                if (editSlugInput) {
                    editSlugInput.value = post.slug || slugify(post.title || '');
                    if (post.publishedAt) {
                        editSlugInput.disabled = true;
                        editSlugInput.style.opacity = '0.6';
                        editSlugInput.style.cursor = 'not-allowed';
                    } else {
                        editSlugInput.disabled = false;
                        editSlugInput.style.opacity = '1';
                        editSlugInput.style.cursor = 'text';
                    }
                }
                isSlugManuallyEdited = true;
                document.getElementById('blogImage').value = (post.image === 'assets/blog-placeholder.svg' || post.image === 'assets/blog-placeholder.jpg') ? '' : (post.image || '');
                if (document.getElementById('blogImageAlt')) {
                    document.getElementById('blogImageAlt').value = post.imageAlt || '';
                }
                if (document.getElementById('blogAuthor')) {
                    document.getElementById('blogAuthor').value = post.authorName || 'Nisan Vitrini Media';
                }
                document.getElementById('blogExcerpt').value = post.excerpt || '';
                if (document.getElementById('blogSeoTitle')) {
                    document.getElementById('blogSeoTitle').value = post.seoTitle || '';
                }
                document.getElementById('blogMetaDesc').value = post.metaDescription || '';
                document.getElementById('blogKeywords').value = post.keywords || '';
                if (document.getElementById('blogGeoSummary')) {
                    document.getElementById('blogGeoSummary').value = post.geoSummary || '';
                }
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
