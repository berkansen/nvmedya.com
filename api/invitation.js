import { readFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

let __filename_val, __dirname_val, PROJECT_ROOT;
try {
  __filename_val = fileURLToPath(import.meta.url);
  __dirname_val = dirname(__filename_val);
  PROJECT_ROOT = resolve(__dirname_val, '..');
} catch {
  __dirname_val = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  PROJECT_ROOT = resolve(__dirname_val, '..');
}

// Resolve candidate file paths in Vercel Serverless Function environment
function resolveFilePath(relativePath) {
  const candidates = [
    join(process.cwd(), relativePath),
    join(PROJECT_ROOT, relativePath),
    join(__dirname_val, relativePath),
    join(__dirname_val, '..', relativePath),
    resolve('.', relativePath)
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return join(process.cwd(), relativePath);
}

// ─── Security Constants ────────────────────────────────────────────
const RESERVED_SLUGS = new Set([
  'www', 'mail', 'ftp', 'api', 'admin', 'ns1', 'ns2',
  'smtp', 'pop', 'imap', 'cpanel', 'webmail', 'localhost',
  'staging', 'dev', 'test', 'preview'
]);

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 80;

// ─── HTML Escape ───────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeHtmlWithFormatting(str) {
  if (!str) return '';
  return escapeHtml(str)
    .replace(/&lt;strong&gt;(.*?)&lt;\/strong&gt;/gi, '<strong>$1</strong>')
    .replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/gi, '<b>$1</b>')
    .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
    .replace(/&#039;/g, "'");
}

// ─── Escape for safe JSON injection inside <script> ────────────────
function safeJsonForScript(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027');
}

// ─── Hostname Validation ───────────────────────────────────────────
function extractSlugFromHost(host) {
  if (!host || typeof host !== 'string') return null;

  // Remove port if present
  const hostname = host.split(':')[0].toLowerCase().trim();

  // Must end with .nvmedya.com
  if (!hostname.endsWith('.nvmedya.com')) return null;

  // Extract the subdomain part
  const prefix = hostname.slice(0, hostname.length - '.nvmedya.com'.length);

  // Must be a single-level subdomain (no dots = no nested subdomains)
  if (prefix.includes('.')) return null;

  // Must not be empty
  if (!prefix) return null;

  return prefix;
}

function validateSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  if (slug.length > MAX_SLUG_LENGTH) return false;
  if (RESERVED_SLUGS.has(slug)) return false;
  if (!SLUG_REGEX.test(slug)) return false;

  // Path traversal prevention
  if (slug.includes('..') || slug.includes('/') || slug.includes('\\')) return false;
  if (slug.includes('%')) return false; // No encoded characters

  return true;
}

// ─── 404 Response ──────────────────────────────────────────────────
function respond404(res) {
  res.status(404);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow, noarchive, nosnippet">
  <title>Sayfa Bulunamadı — NVM Dijital Davetiye</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #FAF7F2; color: #2C2725; }
    .c { text-align: center; padding: 2rem; }
    h1 { font-size: 4rem; color: #B88E52; margin-bottom: 0.5rem; font-weight: 300; }
    p { color: #6E655F; font-size: 1rem; line-height: 1.6; max-width: 400px; margin: 0 auto; }
    a { color: #B88E52; text-decoration: none; }
  </style>
</head>
<body>
  <div class="c">
    <h1>404</h1>
    <p>Aradığınız davetiye sayfası bulunamadı veya henüz yayınlanmamış olabilir.</p>
    <p style="margin-top:1rem"><a href="https://www.nvmedya.com">nvmedya.com</a></p>
  </div>
</body>
</html>`);
}

// ─── Template Rendering ────────────────────────────────────────────
function generateTimelineHtml(timeline) {
  if (!Array.isArray(timeline) || timeline.length === 0) return '';
  return timeline.map(item => `
                <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-card">
                        <div class="timeline-content-wrap">
                            <div class="timeline-event-name">${escapeHtml(item.title)}</div>
                        </div>
                        <div class="timeline-time">${escapeHtml(item.time)}</div>
                    </div>
                </div>`).join('\n');
}

function generateTimelineSectionHtml(timeline, packageTier) {
  if (packageTier === 'standard' || !Array.isArray(timeline) || timeline.length === 0) return '';
  return `        <!-- ===================================================================
             4. DÜĞÜN AKIŞI (TIMELINE)
             =================================================================== -->
        <section class="invitation-section" id="timeline" style="background-color: var(--bg-surface); border-top: 1px solid var(--rose-border); border-bottom: 1px solid var(--rose-border);">
            <div class="text-center">
                <h2 class="section-title">Düğün Akışı</h2>
                <div class="ornament-divider"><i class='bx bx-time-five'></i></div>
                <p class="section-subtitle">Bu özel gecenin akışını sizin için özenle hazırladık.</p>
            </div>

            <div class="timeline-container">
${generateTimelineHtml(timeline)}
            </div>

            <p class="timeline-footnote">
                * Program saatlerinde küçük değişiklikler olabilir.
            </p>
        </section>`;
}

function generateGalleryHtml(gallery) {
  if (!Array.isArray(gallery) || gallery.length === 0) return '';
  return gallery.map((url, i) => {
    const num = i + 1;
    return `                <div class="gallery-item" onclick="openLightbox(${i})">
                    <img src="${escapeHtml(url)}" alt="Bizden Kareler ${num}" class="gallery-img" loading="eager" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'400\\' viewBox=\\'0 0 400 400\\'><rect width=\\'400\\' height=\\'400\\' fill=\\'%23F3ECE2\\'/><text x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'serif\\' font-size=\\'20\\' fill=\\'%23966F36\\'>Fotoğraf ${num}</text></svg>'">
                    <div class="gallery-overlay-hover"><i class='bx bx-fullscreen'></i></div>
                </div>`;
  }).join('\n');
}

function generateGallerySectionHtml(gallery, packageTier) {
  if (packageTier === 'standard' || !Array.isArray(gallery) || gallery.length === 0) return '';
  return `        <!-- ===================================================================
             5. FOTOĞRAF GALERİSİ
             =================================================================== -->
        <section class="invitation-section" id="gallery">
            <div class="text-center">
                <h2 class="section-title">Bizden Kareler</h2>
                <div class="ornament-divider"><i class='bx bx-camera'></i></div>
            </div>

            <div class="gallery-grid">
${generateGalleryHtml(gallery)}
            </div>
        </section>

        <!-- Lightbox Modal -->
        <div class="lightbox-modal" id="lightboxModal">
            <button class="lightbox-close" onclick="closeLightbox()" aria-label="Kapat">&times;</button>
            <div class="lightbox-content">
                <button class="lightbox-nav lightbox-prev" onclick="prevLightbox(event)" aria-label="Önceki"><i class='bx bx-chevron-left'></i></button>
                <img src="" alt="Önizleme" id="lightboxImg" class="lightbox-img">
                <button class="lightbox-nav lightbox-next" onclick="nextLightbox(event)" aria-label="Sonraki"><i class='bx bx-chevron-right'></i></button>
            </div>
        </div>`;
}

function generateDetailNoticesHtml(notices, packageTier) {
  if (packageTier === 'standard' || !notices || !Array.isArray(notices) || notices.length === 0) return '';
  const isSingle = notices.length === 1;
  const cardsHtml = notices.map(item => {
    let iconHtml = '';
    if (item.icon === 'paw') {
      iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="notice-svg-icon" aria-hidden="true"><path d="M14.5 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-5 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm10 4a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-15 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm7.5 1.5c-3.5 0-6.5 2.2-6.5 5 0 2.2 2 3 4 3 1.2 0 2.5-.5 2.5-.5s1.3.5 2.5.5c2 0 4-.8 4-3 0-2.8-3-5-6.5-5z"/></svg>`;
    } else {
      iconHtml = `<i class='bx ${escapeHtml(item.icon)}'></i>`;
    }
    return `                <div class="detail-notice-card">
                    <div class="detail-notice-icon-wrap">
                        ${iconHtml}
                    </div>
                    <div class="detail-notice-content">
                        <h4 class="detail-notice-title">${escapeHtml(item.title)}</h4>
                        <p class="detail-notice-desc">${escapeHtml(item.description)}</p>
                    </div>
                </div>`;
  }).join('\n');

  const gridClass = isSingle ? 'details-notices-grid is-single' : 'details-notices-grid';
  return `            <div class="${gridClass}">
${cardsHtml}
            </div>`;
}

function generateRsvpSectionHtml(c, isClosedServer, deadlineDisplay, closedText, packageTier) {
  if (packageTier === 'standard' || !c.rsvp || c.rsvp.enabled === false) return '';
  const entries = c.rsvp.entries || {};
  const coupleDisplay = escapeHtml(c.couple.displayName);
  const formDisplay = isClosedServer ? 'style="display: none;"' : '';
  const closedCardDisplay = isClosedServer ? 'style="display: block;"' : 'style="display: none;"';

  return `        <!-- ===================================================================
             7. LCV / KATILIM FORMU (Gerçek Google Form Altyapısı + Koşullu Mantık)
             =================================================================== -->
        <section class="invitation-section" id="rsvp" style="background-color: var(--bg-surface); border-top: 1px solid var(--rose-border); border-bottom: 1px solid var(--rose-border);">
            <div class="text-center">
                <h2 class="section-title">Katılımınızı Bildirin</h2>
                <div class="ornament-divider"><i class='bx bx-envelope'></i></div>
                <p class="section-subtitle">
                    Katılım durumunuzu bizimle paylaşmanız, hazırlıklarımızı daha sağlıklı planlamamıza yardımcı olacaktır.
                </p>
            </div>

            <div class="rsvp-container">
                <!-- LCV KAPALI STATE KARTI (Deadline sonrası görünür) -->
                <div class="rsvp-closed-card" id="rsvpClosedCard" ${closedCardDisplay}>
                    <div class="rsvp-closed-icon">
                        <i class='bx bx-time-five'></i>
                    </div>
                    <h3 class="rsvp-closed-title">LCV süresi sona erdi</h3>
                    <p class="rsvp-closed-text">
                        ${escapeHtml(closedText)}
                    </p>
                </div>

                <!-- FORM -->
                <form id="rsvpForm" action="${escapeHtml(c.rsvp.formAction || '#')}" method="POST" target="hidden_iframe" onsubmit="return handleRsvpSubmit(event)" ${formDisplay}>
                    <input type="hidden" name="fvv" value="1">
                    <input type="hidden" name="pageHistory" value="0">
                    
                    <!-- 1. Ad Soyad (Zorunlu) -->
                    <div class="form-group">
                        <label for="guestName" class="form-label">Adınız ve Soyadınız *</label>
                        <input type="text" id="guestName" name="${escapeHtml(entries.name || 'entry.name')}" class="form-input" placeholder="Örn: Ayşe Yılmaz" required autocomplete="name">
                    </div>

                    <!-- 2. Katılım Durumu (Zorunlu) -->
                    <div class="form-group">
                        <label class="form-label">Katılım Durumunuz *</label>
                        <div class="rsvp-toggle-grid">
                            <label class="rsvp-toggle-card">
                                <input type="radio" name="${escapeHtml(entries.attendance || 'entry.attendance')}" value="Katılacağım" checked onchange="handleAttendanceChange(true)">
                                <div class="rsvp-toggle-content">
                                    <i class='bx bxs-check-circle'></i>
                                    <span class="toggle-title">Katılacağım</span>
                                </div>
                            </label>
                            <label class="rsvp-toggle-card">
                                <input type="radio" name="${escapeHtml(entries.attendance || 'entry.attendance')}" value="Katılamayacağım" onchange="handleAttendanceChange(false)">
                                <div class="rsvp-toggle-content">
                                    <i class='bx bxs-x-circle'></i>
                                    <span class="toggle-title">Katılamayacağım</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- 3. KATILIM DETAYLARI KAPSAYICISI (Katılacağım durumunda görünür) -->
                    <div id="attendanceDetailsContainer" class="conditional-section">
                        
                        <!-- 3A. Vejetaryen misiniz? (Hayır / Evet) -->
                        <div class="form-group" id="vegetarianGroup">
                            <label class="form-label">Vejetaryen misiniz? *</label>
                            <div class="rsvp-toggle-grid">
                                <label class="rsvp-toggle-card">
                                    <input type="radio" name="${escapeHtml(entries.vegetarian || 'entry.vegetarian')}" id="vegNo" value="Hayır">
                                    <div class="rsvp-toggle-content">
                                        <i class='bx bx-dish'></i>
                                        <span class="toggle-title">Hayır</span>
                                    </div>
                                </label>
                                <label class="rsvp-toggle-card">
                                    <input type="radio" name="${escapeHtml(entries.vegetarian || 'entry.vegetarian')}" id="vegYes" value="Evet">
                                    <div class="rsvp-toggle-content">
                                        <i class='bx bx-leaf'></i>
                                        <span class="toggle-title">Evet</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <!-- 3B. Yetişkin Kişi Sayısı (Min 1) -->
                        <div class="form-group" id="adultCountGroup">
                            <label class="form-label">Yetişkin Kişi Sayısı *</label>
                            <div class="stepper-wrap">
                                <button type="button" class="stepper-btn" onclick="updateAdultCount(-1)" aria-label="Yetişkin Sayısını Azalt">−</button>
                                <span class="stepper-display" id="adultCountDisplay">1 Yetişkin</span>
                                <button type="button" class="stepper-btn" onclick="updateAdultCount(1)" aria-label="Yetişkin Sayısını Artır">+</button>
                            </div>
                            <input type="hidden" id="adultCount" name="${escapeHtml(entries.adults || 'entry.adults')}" value="1">
                        </div>

                        <!-- 3B. Çocuk Katılımı Sorusu (Evet / Hayır) -->
                        <div class="form-group" id="childrenQuestionGroup">
                            <label class="form-label">Çocuk misafiriniz olacak mı? *</label>
                            <div class="rsvp-toggle-grid">
                                <label class="rsvp-toggle-card">
                                    <input type="radio" name="${escapeHtml(entries.hasChildren || 'entry.hasChildren')}" value="Hayır" checked onchange="handleChildrenToggle(false)">
                                    <div class="rsvp-toggle-content">
                                        <i class='bx bx-user'></i>
                                        <span class="toggle-title">Hayır</span>
                                    </div>
                                </label>
                                <label class="rsvp-toggle-card">
                                    <input type="radio" name="${escapeHtml(entries.hasChildren || 'entry.hasChildren')}" value="Evet" onchange="handleChildrenToggle(true)">
                                    <div class="rsvp-toggle-content">
                                        <i class='bx bx-face'></i>
                                        <span class="toggle-title">Evet</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <!-- 3C. Çocuk Kişi Sayısı (Yalnızca Evet seçilince açılır) -->
                        <div class="form-group" id="childCountGroup" style="display: none;">
                            <label class="form-label">Çocuk Kişi Sayısı</label>
                            <div class="stepper-wrap">
                                <button type="button" class="stepper-btn" onclick="updateChildCount(-1)" aria-label="Çocuk Sayısını Azalt">−</button>
                                <span class="stepper-display" id="childCountDisplay">1 Çocuk</span>
                                <button type="button" class="stepper-btn" onclick="updateChildCount(1)" aria-label="Çocuk Sayısını Artır">+</button>
                            </div>
                            <input type="hidden" id="childCount" name="${escapeHtml(entries.children || 'entry.children')}" value="0">
                        </div>

                        <!-- 3D. Çocuk Yaşları Dinamik Alanları -->
                        <div class="child-ages-wrap" id="childAgesWrap" style="display: none;">
                            <div class="child-ages-title">
                                <i class='bx bx-cake'></i>
                                <span>Çocuk Yaşları *</span>
                            </div>
                            <div class="child-ages-grid" id="childAgesGrid">
                                <div class="child-age-item" id="childAgeItem_1" style="display: none;">
                                    <label for="childAgeInput_1" class="child-age-label">1. Çocuğun Yaşı *</label>
                                    <input type="number" inputmode="numeric" min="0" max="17" id="childAgeInput_1" placeholder="0–17" class="child-age-input" disabled>
                                </div>
                                <div class="child-age-item" id="childAgeItem_2" style="display: none;">
                                    <label for="childAgeInput_2" class="child-age-label">2. Çocuğun Yaşı *</label>
                                    <input type="number" inputmode="numeric" min="0" max="17" id="childAgeInput_2" placeholder="0–17" class="child-age-input" disabled>
                                </div>
                                <div class="child-age-item" id="childAgeItem_3" style="display: none;">
                                    <label for="childAgeInput_3" class="child-age-label">3. Çocuğun Yaşı *</label>
                                    <input type="number" inputmode="numeric" min="0" max="17" id="childAgeInput_3" placeholder="0–17" class="child-age-input" disabled>
                                </div>
                                <div class="child-age-item" id="childAgeItem_4" style="display: none;">
                                    <label for="childAgeInput_4" class="child-age-label">4. Çocuğun Yaşı *</label>
                                    <input type="number" inputmode="numeric" min="0" max="17" id="childAgeInput_4" placeholder="0–17" class="child-age-input" disabled>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- 4. Notunuz (Opsiyonel) -->
                    <div class="form-group">
                        <label for="guestNote" class="form-label">Çiftimize mesajınız <span class="optional">(Opsiyonel)</span></label>
                        <textarea id="guestNote" name="${escapeHtml(entries.message || 'entry.message')}" class="form-textarea" placeholder="Dilerseniz tebrik veya özel notunuzu iletebilirsiniz..."></textarea>
                    </div>

                    <!-- Gönder Butonu -->
                    <div style="text-align: center; margin-top: 1.5rem;">
                        <button type="submit" class="btn btn-primary" id="rsvpSubmitBtn">
                            <i class='bx bx-send'></i> <span>Katılım Bilgimi Gönder</span>
                        </button>
                    </div>
                </form>

                <!-- GERÇEK GÖNDERİM SONRASI ONAY KARTI -->
                <div class="rsvp-success-box" id="rsvpSuccessBox">
                    <div class="rsvp-success-icon">
                        <i class='bx bxs-heart'></i>
                    </div>
                    <h3 class="rsvp-success-title">Katılım bilginiz için teşekkür ederiz.</h3>
                    <p class="rsvp-success-subtitle">
                        Yanıtınız ${coupleDisplay}'nın misafir listesine eklendi.
                    </p>
                    <div class="rsvp-summary-card" id="rsvpSummaryContent"></div>
                    <button type="button" class="btn btn-secondary" onclick="resetRsvpForm()" style="max-width: 240px; margin: 0 auto;">
                        <i class='bx bx-refresh'></i> Yanıtı Güncelle
                    </button>
                </div>
                <iframe name="hidden_iframe" id="hiddenIframe" style="display:none" aria-hidden="true"></iframe>
            </div>
        </section>`;
}

function renderTemplate(templateHtml, config, options = {}) {
  const c = config;
  const isShowcase = Boolean(options && options.isShowcase);
  const coupleDisplay = escapeHtml(c.couple.displayName);
  const packageTier = c.packageTier || (c.rsvp ? 'plus' : 'standard');
  const isDemo = Boolean(c.isDemo);
  const themeClass = c.theme ? `theme-${c.theme}` : '';

  const rsvpEntries = (c.rsvp && c.rsvp.entries) || {};
  const closesAtIso = (c.rsvp && c.rsvp.closesAt) || null;
  // In showcase mode, the deadline override prevents closing the form on the server
  const isClosedServer = isShowcase ? false : (closesAtIso ? (Date.now() >= new Date(closesAtIso).getTime()) : false);
  const deadlineDisplay = (c.rsvp && c.rsvp.deadlineDisplay) || '8 Kasım 2026 • 23:59';
  const closedText = (c.rsvp && c.rsvp.closedText) || `Katılım bildirimleri ${deadlineDisplay.replace(' • ', ' saat ')} itibarıyla kapanmıştır. İlginiz için teşekkür ederiz.`;
  const isDemoRsvp = Boolean(c.rsvp && c.rsvp.demoMode) || isShowcase;

  // Build client-side config (safe for <script> injection)
  const clientConfig = {
    packageTier: packageTier,
    isDemo: isDemo,
    isShowcase: isShowcase,
    countdownTarget: c.date.countdownTarget,
    galleryFullRes: c.galleryFullRes || [],
    venue: {
      name: c.venue.name,
      address: c.venue.address,
      mapsUrl: c.venue.mapsUrl
    },
    calendar: c.calendar,
    couple: {
      displayName: c.couple.displayName,
      bride: c.couple.bride,
      groom: c.couple.groom
    },
    rsvp: (packageTier !== 'standard' && c.rsvp && c.rsvp.enabled !== false) ? {
      demoMode: isDemoRsvp,
      isShowcase: isShowcase,
      entries: rsvpEntries,
      closesAt: closesAtIso,
      timezone: (c.rsvp && c.rsvp.timezone) || 'Europe/Istanbul',
      deadlineDisplay: deadlineDisplay,
      closedText: closedText,
      isClosed: isClosedServer
    } : null
  };

  const ogImage = c.socialPreviewImage || (c.social && c.social.previewImage) || (c.gallery && c.gallery[0]) || c.hero.backgroundImage;
  const ogUrl = `https://${c.slug}.nvmedya.com`;

  const mobileBarButtonsHtml = (packageTier === 'standard')
    ? `            <a href="${escapeHtml(c.venue.mapsUrl)}" target="_blank" rel="noopener noreferrer" class="mobile-bar-btn secondary">
                <i class='bx bx-navigation'></i> Yol Tarifi
            </a>
            <a href="#calendar" class="mobile-bar-btn primary">
                <i class='bx bx-calendar-plus'></i> <span>Takvime Ekle</span>
            </a>`
    : `            <a href="${escapeHtml(c.venue.mapsUrl)}" target="_blank" rel="noopener noreferrer" class="mobile-bar-btn secondary">
                <i class='bx bx-navigation'></i> Yol Tarifi
            </a>
            <a id="mobileRsvpBtn" ${isClosedServer ? 'class="mobile-bar-btn primary disabled"' : 'href="#rsvp" class="mobile-bar-btn primary"'}>
                <i class='${isClosedServer ? 'bx bx-time-five' : 'bx bx-envelope'}'></i> <span>${isClosedServer ? 'LCV Süresi Sona Erdi' : 'LCV / Katılım'}</span>
            </a>`;

  const heroTopBadge = isDemo ? 'NVM Demo Davetiye' : 'Düğün Davetiyesi';
  const demoFooterNote = isDemo ? '<div class="nvm-demo-notice"><i class=\'bx bx-info-circle\'></i> NVM Demo Davetiye — Bu sayfa örnek amaçlı hazırlanmıştır.</div>' : '';

  const replacements = {
    '{{THEME_CLASS}}': themeClass,
    '{{HERO_TOP_BADGE}}': heroTopBadge,
    '{{DEMO_FOOTER_NOTE_HTML}}': demoFooterNote,
    '{{PAGE_TITLE}}': escapeHtml(`${c.couple.displayName} | Düğün Davetiyesi`),
    '{{OG_TITLE}}': escapeHtml(`${c.couple.displayName} — Düğün Davetiyesi`),
    '{{OG_DESCRIPTION}}': escapeHtml(`Hayatımızın en özel gününü birlikte kutlamaya davet ediyoruz. ${c.date.short} • ${c.venue.name}, ${c.venue.city}`),
    '{{OG_URL}}': escapeHtml(ogUrl),
    '{{OG_IMAGE}}': escapeHtml(ogImage),
    '{{HERO_BG_IMAGE}}': escapeHtml(c.hero.backgroundImage),
    '{{BRIDE_NAME}}': escapeHtml(c.couple.bride),
    '{{GROOM_NAME}}': escapeHtml(c.couple.groom),
    '{{COUPLE_DISPLAY}}': coupleDisplay,
    '{{DATE_DISPLAY}}': escapeHtml(c.date.display),
    '{{DATE_SHORT}}': escapeHtml(c.date.short),
    '{{DAY_OF_WEEK}}': escapeHtml(c.date.dayOfWeek),
    '{{TIME_START}}': escapeHtml(c.date.time),
    '{{HERO_MESSAGE}}': escapeHtml(c.hero.message),
    '{{LETTER_TEXT}}': escapeHtml(c.messages ? c.messages.letterText : (c.letter ? c.letter.text : '')),
    '{{VENUE_NAME}}': escapeHtml(c.venue.name),
    '{{VENUE_ADDRESS_FULL}}': escapeHtml(c.venue.address),
    '{{VENUE_ADDRESS_LINE1}}': escapeHtml(c.venue.addressLine1),
    '{{VENUE_ADDRESS_LINE2}}': escapeHtml(c.venue.addressLine2),
    '{{VENUE_ADDRESS_SHORT}}': escapeHtml(c.venue.addressShort),
    '{{VENUE_CITY}}': escapeHtml(c.venue.city),
    '{{VENUE_IMAGE}}': escapeHtml(c.venue.image),
    '{{VENUE_IMAGE_ALT}}': escapeHtml(c.venue.imageAlt),
    '{{VENUE_MAPS_URL}}': escapeHtml(c.venue.mapsUrl),
    '{{VENUE_DESC}}': escapeHtmlWithFormatting(c.venue.description),
    '{{FORM_ACTION}}': escapeHtml((c.rsvp && c.rsvp.formAction) || '#'),
    '{{ENTRY_NAME}}': escapeHtml(rsvpEntries.name || ''),
    '{{ENTRY_ATTENDANCE}}': escapeHtml(rsvpEntries.attendance || ''),
    '{{ENTRY_VEGETARIAN}}': escapeHtml(rsvpEntries.vegetarian || ''),
    '{{ENTRY_ADULTS}}': escapeHtml(rsvpEntries.adults || ''),
    '{{ENTRY_HAS_CHILDREN}}': escapeHtml(rsvpEntries.hasChildren || ''),
    '{{ENTRY_CHILDREN}}': escapeHtml(rsvpEntries.children || ''),
    '{{ENTRY_MESSAGE}}': escapeHtml(rsvpEntries.message || ''),
    '{{RSVP_DEADLINE_DISPLAY}}': escapeHtml(deadlineDisplay),
    '{{RSVP_CLOSED_TEXT}}': escapeHtml(closedText),
    '{{RSVP_FORM_DISPLAY}}': isClosedServer ? 'style="display: none;"' : '',
    '{{RSVP_NOTICE_DISPLAY}}': isClosedServer ? 'style="display: none;"' : '',
    '{{RSVP_CLOSED_CARD_DISPLAY}}': isClosedServer ? 'style="display: block;"' : 'style="display: none;"',
    '{{RSVP_MOBILE_BTN_ATTRS}}': isClosedServer ? 'class="mobile-bar-btn primary disabled"' : 'href="#rsvp" class="mobile-bar-btn primary"',
    '{{RSVP_MOBILE_BTN_ICON}}': isClosedServer ? 'bx bx-time-five' : 'bx bx-envelope',
    '{{RSVP_MOBILE_BTN_TEXT}}': isClosedServer ? 'LCV Süresi Sona Erdi' : 'LCV / Katılım',
    '{{GOOGLE_CAL_URL}}': escapeHtml(c.calendar.googleCalUrl),
    '{{FINAL_TEXT}}': escapeHtml(c.messages ? c.messages.finalText : ''),
    '{{TIMELINE_ITEMS_HTML}}': generateTimelineHtml(c.timeline),
    '{{TIMELINE_SECTION_HTML}}': generateTimelineSectionHtml(c.timeline, packageTier),
    '{{GALLERY_GRID_HTML}}': generateGalleryHtml(c.gallery),
    '{{GALLERY_SECTION_HTML}}': generateGallerySectionHtml(c.gallery, packageTier),
    '{{RSVP_SECTION_HTML}}': generateRsvpSectionHtml(c, isClosedServer, deadlineDisplay, closedText, packageTier),
    '{{DETAIL_NOTICES_HTML}}': generateDetailNoticesHtml(c.detailNotices, packageTier),
    '{{MOBILE_BAR_BUTTONS_HTML}}': mobileBarButtonsHtml,
    '{{CLIENT_CONFIG_JSON}}': safeJsonForScript(clientConfig)
  };

  let html = templateHtml;
  for (const [marker, value] of Object.entries(replacements)) {
    html = html.replaceAll(marker, value);
  }

  return html;
}


// ─── Main Handler ──────────────────────────────────────────────────
export default function handler(req, res) {
  // Determine slug source: query param (from rewrite) or hostname
  let slug = null;
  let source = 'unknown';

  // Parse query params from req.query or fallback to req.url
  let queryDemo = req.query?.demo;
  let querySlug = req.query?.slug;
  let queryShowcase = req.query?.showcase;
  if (req.url) {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      if (!queryDemo) queryDemo = parsedUrl.searchParams.get('demo');
      if (!querySlug) querySlug = parsedUrl.searchParams.get('slug');
      if (!queryShowcase) queryShowcase = parsedUrl.searchParams.get('showcase');
    } catch {}
  }

  const isShowcase = (queryShowcase === '1') || (Boolean(req.url) && req.url.includes('showcase=1'));

  // 1. Check query parameters first (from vercel.json rewrites)
  if (queryDemo) {
    slug = queryDemo;
    source = 'demo-rewrite';
  } else if (querySlug) {
    slug = querySlug;
    source = 'wildcard-rewrite';
  } else {
    // 2. Try hostname extraction (direct subdomain access)
    const host = req.headers.host || req.headers['x-forwarded-host'] || '';
    const extracted = extractSlugFromHost(host);
    if (extracted) {
      slug = extracted;
      source = 'hostname';
    }
  }

  // No slug determined
  if (!slug) {
    return respond404(res);
  }

  // Validate slug security
  if (!validateSlug(slug)) {
    return respond404(res);
  }

  // Load config
  let config;
  try {
    const configPath = resolveFilePath(join('data', 'invitations', `${slug}.json`));
    const configRaw = readFileSync(configPath, 'utf-8');
    config = JSON.parse(configRaw);
  } catch (err) {
    // Config not found or invalid → 404
    console.error(`Config not found for slug "${slug}":`, err.message);
    return respond404(res);
  }

  // Load template
  let templateHtml;
  try {
    const templatePath = resolveFilePath(join('templates', 'invitation.html'));
    templateHtml = readFileSync(templatePath, 'utf-8');
  } catch (err) {
    console.error('Template read error:', err.message);
    res.status(500);
    res.setHeader('Content-Type', 'text/plain');
    return res.send('Internal Server Error');
  }

  // Render
  const html = renderTemplate(templateHtml, config, { isShowcase });

  // Response headers
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.setHeader('X-Debug-Req-Url', req.url || '');
  res.setHeader('X-Debug-Query', JSON.stringify(req.query || {}));
  res.setHeader('X-Debug-Invoke-Query', req.headers['x-invoke-query'] || '');
  res.setHeader('X-Debug-Matched-Path', req.headers['x-matched-path'] || '');
  res.setHeader('X-Debug-Forwarded-Url', req.headers['x-forwarded-url'] || '');

  return res.status(200).send(html);
}
