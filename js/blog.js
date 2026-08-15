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

// SVG Fallback for missing/broken cover images (loop-proof)
const defaultBlogPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Crect width='800' height='400' fill='%23111116'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23ff5e15' font-family='sans-serif' font-size='22' font-weight='600' opacity='0.7'%3Enisan vitrini media%3C/text%3E%3C/svg%3E";

document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('publicBlogList');
    if (!listContainer) return;

    db.collection('blog_posts')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            if (snapshot.empty) {
                listContainer.innerHTML = '<div class="loader">Henüz blog yazısı bulunmamaktadır.</div>';
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const post = doc.data();
                const dateStr = new Date(post.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

                // Read time tahmini (Basit: her 200 kelime 1 dk)
                const wordCount = post.content ? post.content.split(' ').length : 0;
                const readTime = Math.max(1, Math.ceil(wordCount / 200));
                const coverImg = post.image && post.image.trim() !== '' ? post.image : defaultBlogPlaceholder;

                html += `
                    <a href="/blog-detay.html?id=${doc.id}" class="blog-card fade-in">
                        <img src="${coverImg}" alt="${post.title}" class="blog-image" onerror="this.onerror=null; this.src='${defaultBlogPlaceholder}';">
                        <div class="blog-content">
                            <h2 class="blog-title">${post.title}</h2>
                            <p class="blog-excerpt">${post.excerpt}</p>
                            <div class="blog-meta">
                                <span><i class='bx bx-calendar'></i> ${dateStr}</span>
                                <span><i class='bx bx-time'></i> ${readTime} dk okuma</span>
                                <span class="blog-card-cta">Devamını Oku <i class='bx bx-right-arrow-alt'></i></span>
                            </div>
                        </div>
                    </a>
                `;
            });

            listContainer.innerHTML = html;
        }, error => {
            console.error(error);
            listContainer.innerHTML = '<div class="loader" style="color:#ff4d4d;">Yazılar yüklenirken bir hata oluştu.</div>';
        });
});
