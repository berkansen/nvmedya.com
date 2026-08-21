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

// Asset fallback for missing/broken cover images (loop-proof)
const defaultBlogPlaceholder = 'assets/blog-placeholder.svg';

window.handleBlogImgError = function(img) {
    if (!img) return;
    img.onerror = null;
    img.src = defaultBlogPlaceholder;
};

document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('publicBlogList');
    if (!listContainer) return;

    db.collection('blog_posts')
        .where('status', '==', 'published')
        .onSnapshot(snapshot => {
            if (snapshot.empty) {
                listContainer.innerHTML = '<div class="loader">Henüz yayınlanmış blog yazısı bulunmamaktadır.</div>';
                return;
            }

            // Client-side sort by publishedAt / createdAt desc (safe against missing composite index)
            const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            posts.sort((a, b) => new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0));

            listContainer.innerHTML = '';

            posts.forEach(post => {
                const dateVal = post.publishedAt || post.createdAt;
                const dateStr = dateVal ? new Date(dateVal).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

                // Read time tahmini (Basit: her 200 kelime 1 dk)
                const wordCount = post.content ? post.content.split(/\s+/).filter(Boolean).length : 0;
                const readTime = Math.max(1, Math.ceil(wordCount / 200));
                const coverImg = post.image && post.image.trim() !== '' ? post.image : defaultBlogPlaceholder;
                const imgAlt = post.imageAlt && post.imageAlt.trim() !== '' ? post.imageAlt : (post.title || '');

                const cardLink = document.createElement('a');
                cardLink.href = `/blog-detay.html?id=${encodeURIComponent(post.id)}`;
                cardLink.className = 'blog-card fade-in';

                const cardImg = document.createElement('img');
                cardImg.src = coverImg;
                cardImg.alt = imgAlt;
                cardImg.className = 'blog-image';
                cardImg.onerror = function () { handleBlogImgError(this); };

                const contentDiv = document.createElement('div');
                contentDiv.className = 'blog-content';

                const titleEl = document.createElement('h2');
                titleEl.className = 'blog-title';
                titleEl.textContent = post.title || '';

                const excerptEl = document.createElement('p');
                excerptEl.className = 'blog-excerpt';
                excerptEl.textContent = post.excerpt || '';

                const metaDiv = document.createElement('div');
                metaDiv.className = 'blog-meta';

                const dateSpan = document.createElement('span');
                dateSpan.innerHTML = "<i class='bx bx-calendar'></i> ";
                dateSpan.appendChild(document.createTextNode(dateStr));

                const timeSpan = document.createElement('span');
                timeSpan.innerHTML = "<i class='bx bx-time'></i> ";
                timeSpan.appendChild(document.createTextNode(`${readTime} dk okuma`));

                const ctaSpan = document.createElement('span');
                ctaSpan.className = 'blog-card-cta';
                ctaSpan.innerHTML = "Devamını Oku <i class='bx bx-right-arrow-alt'></i>";

                metaDiv.appendChild(dateSpan);
                metaDiv.appendChild(timeSpan);
                metaDiv.appendChild(ctaSpan);

                contentDiv.appendChild(titleEl);
                contentDiv.appendChild(excerptEl);
                contentDiv.appendChild(metaDiv);

                cardLink.appendChild(cardImg);
                cardLink.appendChild(contentDiv);

                listContainer.appendChild(cardLink);
            });
        }, error => {
            console.error(error);
            listContainer.innerHTML = '<div class="loader" style="color:#ff4d4d;">Yazılar yüklenirken bir hata oluştu.</div>';
        });
});
