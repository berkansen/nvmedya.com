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
    const detailContainer = document.getElementById('blogDetayContent');
    if (!detailContainer) return;

    // Get ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId) {
        detailContainer.innerHTML = '<div class="loader" style="color:#ff4d4d">Makale bulunamadı.</div>';
        return;
    }

    db.collection('blog_posts').doc(postId).get()
        .then(doc => {
            if (!doc.exists) {
                detailContainer.innerHTML = '<div class="loader" style="color:#ff4d4d">Makale bulunamadı veya silinmiş.</div>';
                return;
            }

            const post = doc.data();
            const dateStr = new Date(post.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

            const wordCount = post.content ? post.content.split(' ').length : 0;
            const readTime = Math.max(1, Math.ceil(wordCount / 200));

            // Update Page Title
            document.title = `${post.title} - Nisan Vitrini Media`;

            // Inject SEO Meta Tags dynamically
            function setMetaTag(name, content, isProperty = false) {
                if (!content) return;
                const attribute = isProperty ? 'property' : 'name';
                let tag = document.querySelector(`meta[${attribute}="${name}"]`);
                if (!tag) {
                    tag = document.createElement('meta');
                    tag.setAttribute(attribute, name);
                    document.head.appendChild(tag);
                }
                tag.setAttribute('content', content);
            }

            // Standard SEO
            setMetaTag('description', post.metaDescription || post.excerpt);
            if (post.keywords) setMetaTag('keywords', post.keywords);

            // Open Graph (Social Media)
            setMetaTag('og:title', post.title, true);
            setMetaTag('og:description', post.metaDescription || post.excerpt, true);
            if (post.image) setMetaTag('og:image', post.image, true);
            setMetaTag('og:type', 'article', true);
            setMetaTag('og:url', window.location.href, true);

            // Strict DOMPurify sanitization profile for blog content
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

            const rawBody = post.content ? post.content.replace(/\n/g, '<br>') : '';
            const cleanBody = (typeof DOMPurify !== 'undefined') ? DOMPurify.sanitize(rawBody, purifyConfig) : rawBody;
            const cleanTitle = (typeof DOMPurify !== 'undefined') ? DOMPurify.sanitize(post.title || '') : (post.title || '');

            const imgHtml = post.image ? `<img src="${post.image}" alt="${cleanTitle}" class="detay-image">` : '';

            // Render Sanitized Content
            detailContainer.innerHTML = `
                ${imgHtml}
                <div class="detay-content">
                    <h1 class="detay-title">${cleanTitle}</h1>
                    <div class="detay-meta">
                        <span><i class='bx bx-calendar'></i> ${dateStr}</span>
                        <span><i class='bx bx-time'></i> ${readTime} dk okuma</span>
                    </div>
                    <div class="detay-body">
                        ${cleanBody}
                    </div>
                </div>
            `;

            // Attach error handler to blog image programmatically (avoids inline event)
            if (post.image) {
                const blogImg = detailContainer.querySelector('.detay-image');
                if (blogImg) {
                    blogImg.addEventListener('error', function () {
                        this.style.display = 'none';
                    });
                }
            }
        })
        .catch(err => {
            console.error(err);
            detailContainer.innerHTML = '<div class="loader" style="color:#ff4d4d">Bir hata oluştu.</div>';
        });
});
