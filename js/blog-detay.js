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

            // Draft Guard (Public view check)
            if (post.status !== 'published') {
                // Inject noindex for drafts
                let robotsMeta = document.querySelector('meta[name="robots"]');
                if (!robotsMeta) {
                    robotsMeta = document.createElement('meta');
                    robotsMeta.name = 'robots';
                    document.head.appendChild(robotsMeta);
                }
                robotsMeta.content = 'noindex, nofollow';

                detailContainer.innerHTML = '<div class="loader" style="color:#ffab00; padding: 4rem 1rem;">Bu yazı henüz taslak aşamasındadır ve yayında değildir.</div>';
                return;
            }

            const pubDate = post.publishedAt || post.createdAt;
            const dateStr = pubDate ? new Date(pubDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
            const authorDisplayName = post.authorName || 'Nisan Vitrini Media';

            const wordCount = post.content ? post.content.split(' ').length : 0;
            const readTime = Math.max(1, Math.ceil(wordCount / 200));

            // Dynamic Page Title (SEO title fallback)
            const resolvedTitle = post.seoTitle || post.title || '';
            document.title = `${resolvedTitle} - Nisan Vitrini Media`;

            // Dynamic Canonical URL
            const canonicalUrl = `https://www.nvmedya.com/blog-detay.html?id=${postId}`;
            let canonicalTag = document.querySelector('link[rel="canonical"]');
            if (!canonicalTag) {
                canonicalTag = document.createElement('link');
                canonicalTag.rel = 'canonical';
                document.head.appendChild(canonicalTag);
            }
            canonicalTag.href = canonicalUrl;

            // Inject SEO & Social Meta Tags dynamically
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

            const resolvedDesc = post.metaDescription || post.excerpt || post.title || '';

            // Standard SEO
            setMetaTag('description', resolvedDesc);
            if (post.keywords) setMetaTag('keywords', post.keywords);
            setMetaTag('author', authorDisplayName);

            // Open Graph (Social Media)
            setMetaTag('og:title', resolvedTitle, true);
            setMetaTag('og:description', resolvedDesc, true);
            if (post.image) setMetaTag('og:image', post.image, true);
            setMetaTag('og:type', 'article', true);
            setMetaTag('og:url', canonicalUrl, true);
            setMetaTag('og:site_name', 'Nisan Vitrini Media', true);
            if (pubDate) setMetaTag('article:published_time', new Date(pubDate).toISOString(), true);
            if (post.updatedAt) setMetaTag('article:modified_time', new Date(post.updatedAt).toISOString(), true);

            // Twitter Card
            setMetaTag('twitter:card', 'summary_large_image');
            setMetaTag('twitter:title', resolvedTitle);
            setMetaTag('twitter:description', resolvedDesc);
            if (post.image) setMetaTag('twitter:image', post.image);

            // BlogPosting JSON-LD Structured Data
            try {
                const schemaData = {
                    "@context": "https://schema.org",
                    "@type": "BlogPosting",
                    "headline": resolvedTitle,
                    "description": resolvedDesc,
                    "image": post.image ? [post.image] : ["https://www.nvmedya.com/assets/blog-placeholder.svg"],
                    "datePublished": pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
                    "dateModified": post.updatedAt ? new Date(post.updatedAt).toISOString() : (pubDate ? new Date(pubDate).toISOString() : new Date().toISOString()),
                    "author": {
                        "@type": "Person",
                        "name": authorDisplayName
                    },
                    "publisher": {
                        "@type": "Organization",
                        "name": "Nisan Vitrini Media",
                        "logo": {
                            "@type": "ImageObject",
                            "url": "https://www.nvmedya.com/assets/nisanvitrini-logo.png"
                        }
                    },
                    "mainEntityOfPage": {
                        "@type": "WebPage",
                        "@id": canonicalUrl
                    }
                };

                const ldScript = document.createElement('script');
                ldScript.type = 'application/ld+json';
                ldScript.text = JSON.stringify(schemaData);
                document.head.appendChild(ldScript);
            } catch (schemaErr) {
                console.error("Schema error:", schemaErr);
            }

            // Strict DOMPurify sanitization profile for blog content HTML body
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
            const cleanImageAlt = post.imageAlt && post.imageAlt.trim() !== '' ? post.imageAlt : (post.title || '');

            detailContainer.innerHTML = '';

            // Image Element
            if (post.image && post.image.trim() !== '') {
                const imgEl = document.createElement('img');
                imgEl.src = post.image;
                imgEl.alt = cleanImageAlt;
                imgEl.className = 'detay-image';
                imgEl.onerror = function () { this.style.display = 'none'; };
                detailContainer.appendChild(imgEl);
            }

            // Content Wrapper
            const contentDiv = document.createElement('div');
            contentDiv.className = 'detay-content';

            // Title (Plain Text via textContent)
            const titleEl = document.createElement('h1');
            titleEl.className = 'detay-title';
            titleEl.textContent = post.title || '';
            contentDiv.appendChild(titleEl);

            // Meta Info (Author, Date, Read Time)
            const metaDiv = document.createElement('div');
            metaDiv.className = 'detay-meta';

            const authorSpan = document.createElement('span');
            authorSpan.innerHTML = "<i class='bx bx-user'></i> ";
            authorSpan.appendChild(document.createTextNode(authorDisplayName));

            const dateSpan = document.createElement('span');
            dateSpan.innerHTML = "<i class='bx bx-calendar'></i> ";
            dateSpan.appendChild(document.createTextNode(dateStr));

            const timeSpan = document.createElement('span');
            timeSpan.innerHTML = "<i class='bx bx-time'></i> ";
            timeSpan.appendChild(document.createTextNode(`${readTime} dk okuma`));

            metaDiv.appendChild(authorSpan);
            metaDiv.appendChild(dateSpan);
            metaDiv.appendChild(timeSpan);
            contentDiv.appendChild(metaDiv);

            // GEO Summary (Rendered as plain text in callout box)
            if (post.geoSummary && post.geoSummary.trim() !== '') {
                const geoCard = document.createElement('div');
                geoCard.className = 'geo-summary-card';
                geoCard.style.cssText = 'background: rgba(255, 255, 255, 0.03); border-left: 3px solid #00f0ff; border-radius: 8px; padding: 1.25rem 1.5rem; margin-bottom: 2rem;';

                const geoHeader = document.createElement('div');
                geoHeader.style.cssText = 'font-size: 0.85rem; font-weight: 600; color: #00f0ff; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 6px;';
                geoHeader.innerHTML = "<i class='bx bx-check-circle'></i> Kısa Doğrudan Cevap";

                const geoP = document.createElement('p');
                geoP.style.cssText = 'color: #e2e8f0; font-size: 1rem; line-height: 1.6; margin: 0;';
                geoP.textContent = post.geoSummary.trim();

                geoCard.appendChild(geoHeader);
                geoCard.appendChild(geoP);
                contentDiv.appendChild(geoCard);
            }

            // Body (Sanitized HTML)
            const bodyDiv = document.createElement('div');
            bodyDiv.className = 'detay-body';
            bodyDiv.innerHTML = cleanBody;
            contentDiv.appendChild(bodyDiv);

            detailContainer.appendChild(contentDiv);
        })
        .catch(err => {
            console.error("Blog fetch error:", err);
            let robotsMeta = document.querySelector('meta[name="robots"]');
            if (!robotsMeta) {
                robotsMeta = document.createElement('meta');
                robotsMeta.name = 'robots';
                document.head.appendChild(robotsMeta);
            }
            robotsMeta.content = 'noindex, nofollow';

            detailContainer.innerHTML = '<div class="loader" style="color:var(--text-muted); padding: 4rem 1rem;">Yazı bulunamadı veya henüz yayında değil.</div>';
        });
});
