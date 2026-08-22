import sanitizeHtml from 'sanitize-html';

const FIRESTORE_ENDPOINT = 'https://firestore.googleapis.com/v1/projects/nisan-vitrini-panel/databases/(default)/documents:runQuery';

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
    return escapeHtml(str);
}

function safeJsonLd(obj) {
    return JSON.stringify(obj)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026');
}

function parseFirestoreField(field) {
    if (!field || typeof field !== 'object') return null;
    if ('stringValue' in field) return field.stringValue;
    if ('timestampValue' in field) return field.timestampValue;
    if ('integerValue' in field) return parseInt(field.integerValue, 10);
    if ('doubleValue' in field) return parseFloat(field.doubleValue);
    if ('booleanValue' in field) return field.booleanValue;
    if ('nullValue' in field) return null;
    if ('mapValue' in field && field.mapValue.fields) {
        const res = {};
        for (const [k, v] of Object.entries(field.mapValue.fields)) {
            res[k] = parseFirestoreField(v);
        }
        return res;
    }
    if ('arrayValue' in field) {
        if (!field.arrayValue.values) return [];
        return field.arrayValue.values.map(parseFirestoreField);
    }
    return null;
}

function parseFirestoreDoc(doc) {
    if (!doc || !doc.fields) return null;
    const data = {};
    for (const [key, val] of Object.entries(doc.fields)) {
        data[key] = parseFirestoreField(val);
    }
    const nameParts = doc.name ? doc.name.split('/') : [];
    data.id = nameParts[nameParts.length - 1] || null;
    return data;
}

const SANITIZE_OPTIONS = {
    allowedTags: [
        'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
        'strong', 'b', 'em', 'i', 'u', 's', 'strike',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
        'a', 'img', 'figure', 'figcaption', 'span', 'div',
        'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    allowedAttributes: {
        'a': ['href', 'title', 'target', 'rel', 'class'],
        'img': ['src', 'alt', 'title', 'class', 'width', 'height', 'loading'],
        '*': ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {},
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    allowProtocolRelative: false,
    transformTags: {
        'a': (tagName, attribs) => {
            const href = attribs.href || '';
            if (href.startsWith('http://') || href.startsWith('https://')) {
                attribs.target = '_blank';
                attribs.rel = 'noopener noreferrer';
            }
            return {
                tagName: 'a',
                attribs
            };
        }
    }
};

function renderNotFoundPage() {
    return `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yazı Bulunamadı - Nisan Vitrini Media</title>
    <meta name="robots" content="noindex, nofollow">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/style.css?v=11">
    <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">
    <link rel="icon" type="image/png" href="/assets/favicon.png">
    <style>
        .blog-detay-container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 4rem 2rem;
            text-align: center;
        }
        .not-found-msg {
            color: var(--text-muted, #9ca3af);
            font-size: 1.15rem;
            margin-bottom: 2rem;
        }
        .back-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--secondary-color, #00f0ff);
            text-decoration: none;
            transition: color 0.3s ease;
        }
        .back-btn:hover {
            color: #fff;
        }
    </style>
</head>
<body>
    <header id="header">
        <nav class="navbar container">
            <a href="/" class="logo">
                <img src="/assets/nisanvitrini-logo.png" alt="Nisan Vitrini Media" width="140" height="140">
            </a>
            <div class="nav-toggle" id="nav-toggle" role="button" aria-label="Gezinti menüsünü aç" aria-expanded="false" aria-controls="nav-list" tabindex="0"><i class='bx bx-menu' aria-hidden="true"></i></div>
            <ul class="nav-list" id="nav-list">
                <li class="nav-item"><a href="/" class="nav-link">Ana Sayfa</a></li>
                <li class="nav-item"><a href="/hizmetler" class="nav-link">Hizmetlerimiz</a></li>
                <li class="nav-item"><a href="/projeler" class="nav-link">Projeler</a></li>
                <li class="nav-item"><a href="/blog" class="nav-link active">Blog</a></li>
                <li class="nav-item"><a href="/about" class="nav-link">Hakkımızda</a></li>
                <li class="nav-item"><a href="/contact" class="nav-link">İletişim</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section class="section" style="padding-top: 120px;">
            <div class="container blog-detay-container">
                <h1 style="color:#fff; font-size:1.75rem; margin-bottom:1rem;">Yazı Bulunamadı</h1>
                <p class="not-found-msg">Aradığınız blog yazısı mevcut değil veya henüz yayında değil.</p>
                <a href="/blog" class="back-btn"><i class='bx bx-arrow-back'></i> Blog Listesine Dön</a>
            </div>
        </section>
    </main>

    <footer class="footer section">
        <div class="container footer-container">
            <div class="footer-box">
                <a href="#" class="footer-logo">nisan vitrini media<span class="dot">.</span></a>
                <p>Yeni nesil medya.</p>
            </div>
            <div class="footer-box">
                <h4 class="footer-title">Linkler</h4>
                <ul class="footer-links">
                    <li><a href="/">Ana Sayfa</a></li>
                    <li><a href="/about">Hakkımızda</a></li>
                    <li><a href="/hizmetler">Hizmetlerimiz</a></li>
                    <li><a href="/projeler">Projeler</a></li>
                    <li><a href="/contact">İletişim</a></li>
                </ul>
            </div>
            <div class="footer-box">
                <h4 class="footer-title">Yasal</h4>
                <ul class="footer-links">
                    <li><a href="/yasal">Yasal Bilgilendirmeler</a></li>
                    <li><a href="/yasal/web-sitesi-kvkk-aydinlatma-metni">Web Sitesi KVKK Aydınlatma Metni</a></li>
                    <li><a href="/yasal/iletisim-formu-aydinlatma-metni">İletişim Formu KVKK Aydınlatma Metni</a></li>
                    <li><a href="/yasal/gizlilik-politikasi">Gizlilik Politikası</a></li>
                    <li><a href="/yasal/cerez-politikasi">Çerez Politikası</a></li>
                    <li><a href="/yasal/kvkk-basvuru">KVKK Başvuru</a></li>
                    <li><a href="/yasal/kullanim-kosullari">Site Kullanım Koşulları</a></li>
                    <li><a href="/ai-kullanim-politikasi">AI Kullanım Politikası</a></li>
                    <li><a href="#cerez-tercihleri" class="cookie-settings-btn">Çerez Tercihleri</a></li>
                </ul>
            </div>
            <div class="footer-box">
                <h4 class="footer-title">Bizi Takip Edin</h4>
                <div class="social-links">
                    <a href="https://www.instagram.com/nisanvitrinimedia" target="_blank" class="social-link instagram" rel="noopener noreferrer"><i class='bx bxl-instagram'></i></a>
                    <a href="https://www.threads.com/@nisanvitrinimedia" target="_blank" class="social-link threads" rel="noopener noreferrer">
                        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 1.2rem; height: 1.2rem; fill: currentColor;"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z"/></svg>
                    </a>
                    <a href="https://www.youtube.com/@nisanvitrinimedia" target="_blank" class="social-link youtube" rel="noopener noreferrer"><i class='bx bxl-youtube'></i></a>
                    <a href="https://tr.linkedin.com/company/nisan-vitrini-media" target="_blank" class="social-link linkedin" rel="noopener noreferrer"><i class='bx bxl-linkedin'></i></a>
                </div>
            </div>
        </div>
        <div class="container footer-parent-brand">
            <p class="footer-parent-text">nisan vitrini media bir <a href="https://www.nisanvitrini.com/hakkimizda/" target="_blank" rel="noopener noreferrer">nisan vitrini</a> markasıdır.</p>
            <h4 class="footer-parent-title">nisan vitrini sosyal medya hesapları</h4>
            <div class="social-links">
                <a href="https://www.instagram.com/nisanvitrini" target="_blank" class="social-link" rel="noopener noreferrer"><i class='bx bxl-instagram'></i></a>
                <a href="https://www.tiktok.com/@nisanvitrini" target="_blank" class="social-link" rel="noopener noreferrer"><i class='bx bxl-tiktok'></i></a>
                <a href="https://www.youtube.com/@nisanvitrini" target="_blank" class="social-link" rel="noopener noreferrer"><i class='bx bxl-youtube'></i></a>
                <a href="https://www.linkedin.com/company/nisanvitrini" target="_blank" class="social-link" rel="noopener noreferrer"><i class='bx bxl-linkedin'></i></a>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 Nisan Vitrini Media. Tüm hakları saklıdır.</p>
        </div>
    </footer>
    <script src="/js/main.js"></script>
    <script src="/js/cookie-consent.js"></script>
</body>
</html>`;
}

function renderErrorPage() {
    return `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sunucu Hatası - Nisan Vitrini Media</title>
    <meta name="robots" content="noindex, nofollow">
    <link rel="stylesheet" href="/css/style.css?v=11">
</head>
<body style="background:#0a0a0c; color:#fff; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; text-align:center;">
    <div>
        <h1 style="font-size:2rem; margin-bottom:1rem;">Hizmet Geçici Olarak Kullanılamıyor</h1>
        <p style="color:#9ca3af; margin-bottom:1.5rem;">İçerik yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyiniz.</p>
        <a href="/blog" style="color:#00f0ff; text-decoration:none;">Blog Listesine Dön &rarr;</a>
    </div>
</body>
</html>`;
}

function renderBlogPage(post, slug) {
    const canonicalUrl = `https://www.nvmedya.com/blog/${slug}`;
    const resolvedTitle = post.seoTitle || post.title || 'Blog Detay';
    const pageTitle = `${resolvedTitle} - Nisan Vitrini Media`;
    const resolvedDesc = post.metaDescription || post.excerpt || post.title || '';
    const authorDisplayName = post.authorName || 'Nisan Vitrini Media';
    const pubDate = post.publishedAt || post.createdAt || null;
    const modDate = post.updatedAt || pubDate;

    let dateStr = '';
    let isoPubDate = new Date().toISOString();
    let isoModDate = new Date().toISOString();

    if (pubDate) {
        const d = new Date(pubDate);
        if (!isNaN(d.getTime())) {
            dateStr = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            isoPubDate = d.toISOString();
        }
    }
    if (modDate) {
        const md = new Date(modDate);
        if (!isNaN(md.getTime())) {
            isoModDate = md.toISOString();
        }
    }

    const wordCount = post.content ? post.content.split(/\s+/).filter(Boolean).length : 0;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    let imageUrl = 'https://www.nvmedya.com/assets/blog-placeholder.svg';
    if (post.image && post.image.trim() !== '') {
        const trimmed = post.image.trim();
        if (/^https?:\/\//i.test(trimmed)) {
            imageUrl = trimmed;
        } else if (trimmed.startsWith('/')) {
            imageUrl = `https://www.nvmedya.com${trimmed}`;
        } else {
            imageUrl = `https://www.nvmedya.com/${trimmed}`;
        }
    }
    const imageAlt = post.imageAlt && post.imageAlt.trim() !== '' ? post.imageAlt.trim() : (post.title || '');

    // Structured Data (BlogPosting)
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": resolvedTitle,
        "description": resolvedDesc,
        "image": [imageUrl],
        "datePublished": isoPubDate,
        "dateModified": isoModDate,
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
    const jsonLdScript = safeJsonLd(schemaData);

    // Sanitize Article Body
    let rawBody = post.content || '';
    if (!/<[a-z][\s\S]*>/i.test(rawBody)) {
        rawBody = rawBody.replace(/\n/g, '<br>');
    }
    const cleanBody = sanitizeHtml(rawBody, SANITIZE_OPTIONS);

    // GEO Summary
    let geoHtml = '';
    if (post.geoSummary && post.geoSummary.trim() !== '') {
        geoHtml = `
                <div class="geo-summary-card" style="background: rgba(255, 255, 255, 0.03); border-left: 3px solid #00f0ff; border-radius: 8px; padding: 1.25rem 1.5rem; margin-bottom: 2rem;">
                    <div style="font-size: 0.85rem; font-weight: 600; color: #00f0ff; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 6px;">
                        <i class='bx bx-check-circle'></i> Kısa Doğrudan Cevap
                    </div>
                    <p style="color: #e2e8f0; font-size: 1rem; line-height: 1.6; margin: 0;">${escapeHtml(post.geoSummary.trim())}</p>
                </div>`;
    }

    // Featured Image HTML
    let imageHtml = '';
    if (post.image && post.image.trim() !== '') {
        imageHtml = `<img src="${escapeAttr(imageUrl)}" alt="${escapeAttr(imageAlt)}" class="detay-image" onerror="this.style.display='none'">`;
    }

    return `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeAttr(resolvedDesc)}">
    ${post.keywords ? `<meta name="keywords" content="${escapeAttr(post.keywords)}">` : ''}
    <meta name="author" content="${escapeAttr(authorDisplayName)}">
    <link rel="canonical" href="${escapeAttr(canonicalUrl)}">

    <!-- Open Graph (Facebook, LinkedIn, etc.) -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="${escapeAttr(resolvedTitle)}">
    <meta property="og:description" content="${escapeAttr(resolvedDesc)}">
    <meta property="og:url" content="${escapeAttr(canonicalUrl)}">
    <meta property="og:image" content="${escapeAttr(imageUrl)}">
    <meta property="og:site_name" content="Nisan Vitrini Media">
    <meta property="article:published_time" content="${escapeAttr(isoPubDate)}">
    <meta property="article:modified_time" content="${escapeAttr(isoModDate)}">

    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeAttr(resolvedTitle)}">
    <meta name="twitter:description" content="${escapeAttr(resolvedDesc)}">
    <meta name="twitter:image" content="${escapeAttr(imageUrl)}">

    <!-- Structured Data (JSON-LD) -->
    <script type="application/ld+json">${jsonLdScript}</script>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700&display=swap" rel="stylesheet">

    <!-- Styles -->
    <link rel="stylesheet" href="/css/style.css?v=11">

    <!-- Icons -->
    <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">
    <link rel="icon" type="image/png" href="/assets/favicon.png">

    <style>
        .blog-header {
            margin-top: 120px;
            text-align: center;
        }
        .blog-detay-container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .detay-image {
            width: 100%;
            max-height: 400px;
            object-fit: cover;
        }
        .detay-content {
            padding: 2rem 3rem;
        }
        .detay-title {
            font-size: 2rem;
            font-weight: 700;
            color: #fff;
            margin-bottom: 1rem;
        }
        .detay-meta {
            font-size: 0.9rem;
            color: var(--text-muted);
            margin-bottom: 2rem;
            display: flex;
            gap: 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 1.5rem;
        }
        .detay-body {
            color: #d1d5db;
            line-height: 1.8;
            font-size: 1.05rem;
        }
        .detay-body p {
            margin-bottom: 1.5rem;
        }
        .detay-body h2,
        .detay-body h3 {
            color: #fff;
            margin: 2rem 0 1rem;
        }
        .back-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--secondary-color);
            text-decoration: none;
            margin-top: 2rem;
            transition: color 0.3s ease;
        }
        .back-btn:hover {
            color: #fff;
        }
        @media (max-width: 768px) {
            .detay-content {
                padding: 1.5rem;
            }
            .detay-title {
                font-size: 1.5rem;
            }
        }
    </style>
</head>

<body>
    <!-- Header -->
    <header id="header">
        <nav class="navbar container">
            <a href="/" class="logo">
                <img src="/assets/nisanvitrini-logo.png" alt="Nisan Vitrini Media" width="140" height="140">
            </a>
            <div class="nav-toggle" id="nav-toggle" role="button" aria-label="Gezinti menüsünü aç" aria-expanded="false" aria-controls="nav-list" tabindex="0"><i class='bx bx-menu' aria-hidden="true"></i></div>
            <ul class="nav-list" id="nav-list">
                <li class="nav-item"><a href="/" class="nav-link">Ana Sayfa</a></li>
                <li class="nav-item"><a href="/hizmetler" class="nav-link">Hizmetlerimiz</a></li>
                <li class="nav-item"><a href="/projeler" class="nav-link">Projeler</a></li>
                <li class="nav-item"><a href="/blog" class="nav-link active">Blog</a></li>
                <li class="nav-item"><a href="/about" class="nav-link">Hakkımızda</a></li>
                <li class="nav-item"><a href="/contact" class="nav-link">İletişim</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section class="section" style="padding-top: 100px;">
            <div class="container blog-detay-container" id="blogDetayContent">
                ${imageHtml}
                <div class="detay-content">
                    <h1 class="detay-title">${escapeHtml(post.title || '')}</h1>
                    <div class="detay-meta">
                        <span><i class='bx bx-user'></i> ${escapeHtml(authorDisplayName)}</span>
                        ${dateStr ? `<span><i class='bx bx-calendar'></i> ${escapeHtml(dateStr)}</span>` : ''}
                        <span><i class='bx bx-time'></i> ${readTime} dk okuma</span>
                    </div>
                    ${geoHtml}
                    <div class="detay-body">
                        ${cleanBody}
                    </div>
                </div>
            </div>

            <div class="container" style="max-width: 800px;">
                <a href="/blog" class="back-btn"><i class='bx bx-arrow-back'></i> Blog'a Dön</a>
            </div>
        </section>
    </main>

    <footer class="footer section">
        <div class="container footer-container">
            <div class="footer-box">
                <a href="#" class="footer-logo">nisan vitrini media<span class="dot">.</span></a>
                <p>Yeni nesil medya.</p>
            </div>
            <div class="footer-box">
                <h4 class="footer-title">Linkler</h4>
                <ul class="footer-links">
                    <li><a href="/">Ana Sayfa</a></li>
                    <li><a href="/about">Hakkımızda</a></li>
                    <li><a href="/hizmetler">Hizmetlerimiz</a></li>
                    <li><a href="/projeler">Projeler</a></li>
                    <li><a href="/contact">İletişim</a></li>
                </ul>
            </div>
            <div class="footer-box">
                <h4 class="footer-title">Yasal</h4>
                <ul class="footer-links">
                    <li><a href="/yasal">Yasal Bilgilendirmeler</a></li>
                    <li><a href="/yasal/web-sitesi-kvkk-aydinlatma-metni">Web Sitesi KVKK Aydınlatma Metni</a></li>
                    <li><a href="/yasal/iletisim-formu-aydinlatma-metni">İletişim Formu KVKK Aydınlatma Metni</a></li>
                    <li><a href="/yasal/gizlilik-politikasi">Gizlilik Politikası</a></li>
                    <li><a href="/yasal/cerez-politikasi">Çerez Politikası</a></li>
                    <li><a href="/yasal/kvkk-basvuru">KVKK Başvuru</a></li>
                    <li><a href="/yasal/kullanim-kosullari">Site Kullanım Koşulları</a></li>
                    <li><a href="/ai-kullanim-politikasi">AI Kullanım Politikası</a></li>
                    <li><a href="#cerez-tercihleri" class="cookie-settings-btn">Çerez Tercihleri</a></li>
                </ul>
            </div>
            <div class="footer-box">
                <h4 class="footer-title">Bizi Takip Edin</h4>
                <div class="social-links">
                    <a href="https://www.instagram.com/nisanvitrinimedia" target="_blank" class="social-link instagram" rel="noopener noreferrer"><i class='bx bxl-instagram'></i></a>
                    <a href="https://www.threads.com/@nisanvitrinimedia" target="_blank" class="social-link threads" rel="noopener noreferrer">
                        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 1.2rem; height: 1.2rem; fill: currentColor;"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z"/></svg>
                    </a>
                    <a href="https://www.youtube.com/@nisanvitrinimedia" target="_blank" class="social-link youtube" rel="noopener noreferrer"><i class='bx bxl-youtube'></i></a>
                    <a href="https://tr.linkedin.com/company/nisan-vitrini-media" target="_blank" class="social-link linkedin" rel="noopener noreferrer"><i class='bx bxl-linkedin'></i></a>
                </div>
            </div>
        </div>
        <div class="container footer-parent-brand">
            <p class="footer-parent-text">nisan vitrini media bir <a href="https://www.nisanvitrini.com/hakkimizda/" target="_blank" rel="noopener noreferrer">nisan vitrini</a> markasıdır.</p>
            <h4 class="footer-parent-title">nisan vitrini sosyal medya hesapları</h4>
            <div class="social-links">
                <a href="https://www.instagram.com/nisanvitrini" target="_blank" class="social-link" rel="noopener noreferrer"><i class='bx bxl-instagram'></i></a>
                <a href="https://www.tiktok.com/@nisanvitrini" target="_blank" class="social-link" rel="noopener noreferrer"><i class='bx bxl-tiktok'></i></a>
                <a href="https://www.youtube.com/@nisanvitrini" target="_blank" class="social-link" rel="noopener noreferrer"><i class='bx bxl-youtube'></i></a>
                <a href="https://www.linkedin.com/company/nisanvitrini" target="_blank" class="social-link" rel="noopener noreferrer"><i class='bx bxl-linkedin'></i></a>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 Nisan Vitrini Media. Tüm hakları saklıdır.</p>
        </div>
    </footer>

    <script src="/js/main.js"></script>
    <script src="/js/cookie-consent.js"></script>
</body>
</html>`;
}

function sendResponse(res, statusCode, body, isHead = false) {
    if (isHead) {
        if (typeof res.status === 'function' && typeof res.end === 'function') {
            return res.status(statusCode).end();
        }
        res.statusCode = statusCode;
        return res.end();
    }
    if (typeof res.status === 'function' && typeof res.send === 'function') {
        return res.status(statusCode).send(body);
    }
    res.statusCode = statusCode;
    return res.end(body);
}

export default async function handler(req, res) {
    const method = (req.method || 'GET').toUpperCase();
    const isHead = method === 'HEAD';

    // Disallow methods other than GET and HEAD (e.g. POST, PUT, DELETE)
    if (method !== 'GET' && method !== 'HEAD') {
        res.setHeader('Allow', 'GET, HEAD');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return sendResponse(res, 405, '405 Method Not Allowed', isHead);
    }

    try {
        // 1. Extract slug strictly from query or path (ignoring UTM / other search params)
        let rawSlug = '';
        if (req.query && req.query.slug) {
            rawSlug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
        } else if (req.url) {
            try {
                const parsedUrl = new URL(req.url, 'https://www.nvmedya.com');
                const querySlug = parsedUrl.searchParams.get('slug');
                if (querySlug) {
                    rawSlug = querySlug;
                } else {
                    const segments = parsedUrl.pathname.split('/').filter(Boolean);
                    if (segments.length >= 2 && segments[0].toLowerCase() === 'blog') {
                        rawSlug = segments[1];
                    }
                }
            } catch (urlErr) {
                rawSlug = '';
            }
        }

        // Decode slug safely
        let slug = null;
        try {
            const decoded = decodeURIComponent(rawSlug).trim().toLowerCase();
            const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
            if (slugRegex.test(decoded) && decoded.length <= 120 && decoded.length > 0) {
                slug = decoded;
            }
        } catch (decodeErr) {
            slug = null;
        }

        // Invalid slug: Fail-closed HTTP 404 immediately without Firestore query
        if (!slug) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            return sendResponse(res, 404, renderNotFoundPage(), isHead);
        }

        // 2. Query Firestore REST with 7s timeout
        const queryBody = {
            structuredQuery: {
                from: [{ collectionId: 'blog_posts' }],
                where: {
                    compositeFilter: {
                        op: 'AND',
                        filters: [
                            {
                                fieldFilter: {
                                    field: { fieldPath: 'slug' },
                                    op: 'EQUAL',
                                    value: { stringValue: slug }
                                }
                            },
                            {
                                fieldFilter: {
                                    field: { fieldPath: 'status' },
                                    op: 'EQUAL',
                                    value: { stringValue: 'published' }
                                }
                            }
                        ]
                    }
                },
                limit: 2
            }
        };

        const firestoreRes = await fetch(FIRESTORE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(queryBody),
            signal: AbortSignal.timeout(7000)
        });

        if (!firestoreRes.ok) {
            console.error(`Firestore REST error: status ${firestoreRes.status} ${firestoreRes.statusText}`);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            return sendResponse(res, 500, renderErrorPage(), isHead);
        }

        const data = await firestoreRes.json();
        const matchingDocs = Array.isArray(data) ? data.filter(item => item && item.document) : [];

        // 0 matching documents -> 404
        if (matchingDocs.length === 0) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            return sendResponse(res, 404, renderNotFoundPage(), isHead);
        }

        // Duplicate slug detected -> fail-closed 500
        if (matchingDocs.length > 1) {
            console.warn(`Duplicate published slug detected for slug: "${slug}". Failing closed.`);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            return sendResponse(res, 500, renderErrorPage(), isHead);
        }

        const post = parseFirestoreDoc(matchingDocs[0].document);
        if (!post || post.status !== 'published') {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            return sendResponse(res, 404, renderNotFoundPage(), isHead);
        }

        // Render SSR HTML
        const html = renderBlogPage(post, slug);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
        return sendResponse(res, 200, html, isHead);

    } catch (err) {
        console.error('Unhandled Blog SSR handler error:', err);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return sendResponse(res, 500, renderErrorPage(), isHead);
    }
}
