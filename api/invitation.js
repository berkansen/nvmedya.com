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

function generateTimelineSectionHtml(timeline, packageTier, isBirthday = false) {
  if (packageTier === 'standard' || !Array.isArray(timeline) || timeline.length === 0) return '';
  const sectionTitle = isBirthday ? 'Parti Akışı' : 'Düğün Akışı';
  const sectionSubtitle = isBirthday
    ? 'Bu güzel günün akışını sizin için özenle hazırladık.'
    : 'Bu özel gecenin akışını sizin için özenle hazırladık.';
  return `        <!-- ===================================================================
             4. ETKİNLİK AKIŞI (TIMELINE)
             =================================================================== -->
        <section class="invitation-section" id="timeline" style="background-color: var(--bg-surface); border-top: 1px solid var(--rose-border); border-bottom: 1px solid var(--rose-border);">
            <div class="text-center">
                <h2 class="section-title">${sectionTitle}</h2>
                <div class="ornament-divider"><i class='bx bx-time-five'></i></div>
                <p class="section-subtitle">${sectionSubtitle}</p>
            </div>

            <div class="timeline-container">
${generateTimelineHtml(timeline)}
            </div>

            <p class="timeline-footnote">
                * Program saatlerinde küçük değişiklikler olabilir.
            </p>
        </section>`;
}

function generateGalleryHtml(gallery, isBirthday = false, personName = '') {
  if (!Array.isArray(gallery) || gallery.length === 0) return '';
  const altPrefix = isBirthday ? `${personName || 'Doğum Günü'}’dan Kareler` : 'Bizden Kareler';
  return gallery.map((url, i) => {
    const num = i + 1;
    return `                <div class="gallery-item" onclick="openLightbox(${i})">
                    <img src="${escapeHtml(url)}" alt="${escapeHtml(altPrefix)} ${num}" class="gallery-img" loading="eager" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'400\\' viewBox=\\'0 0 400 400\\'><rect width=\\'400\\' height=\\'400\\' fill=\\'%23F3ECE2\\'/><text x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'serif\\' font-size=\\'20\\' fill=\\'%23966F36\\'>Fotoğraf ${num}</text></svg>'">
                    <div class="gallery-overlay-hover"><i class='bx bx-fullscreen'></i></div>
                </div>`;
  }).join('\n');
}

function generateGallerySectionHtml(gallery, packageTier, isBirthday = false, personName = '') {
  if (packageTier === 'standard' || !Array.isArray(gallery) || gallery.length === 0) return '';
  const galleryTitle = isBirthday ? `${personName || 'Günün'}’dan Kareler` : 'Bizden Kareler';
  return `        <!-- ===================================================================
             5. FOTOĞRAF GALERİSİ
             =================================================================== -->
        <section class="invitation-section" id="gallery">
            <div class="text-center">
                <h2 class="section-title">${escapeHtml(galleryTitle)}</h2>
                <div class="ornament-divider"><i class='bx bx-camera'></i></div>
            </div>

            <div class="gallery-grid">
${generateGalleryHtml(gallery, isBirthday, personName)}
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
  const isBirthday = c.eventType === 'birthday';
  const isConnected = c.rsvp.connected !== false;
  const collectVegetarian = c.rsvp.collectVegetarian !== false && !isBirthday;
  const collectHasChildrenQuestion = c.rsvp.collectHasChildrenQuestion !== false && !isBirthday;

  const entries = c.rsvp.entries || {};
  const hostDisplay = escapeHtml((c.person && c.person.name) || c.couple.displayName);
  const formDisplay = isClosedServer ? 'style="display: none;"' : '';
  const closedCardDisplay = isClosedServer ? 'style="display: block;"' : 'style="display: none;"';

  const rsvpTitle = escapeHtml(c.rsvp.title || (isBirthday ? 'Partimize Katılıyor musunuz?' : 'Katılımınızı Bildirin'));
  const rsvpSubtitle = escapeHtml(
    c.rsvp.subtitle ||
    (isBirthday
      ? 'Hazırlıklarımızı daha güzel planlayabilmemiz için katılım bilginizi bizimle paylaşabilirsiniz.'
      : 'Katılım durumunuzu bizimle paylaşmanız, hazırlıklarımızı daha sağlıklı planlamamıza yardımcı olacaktır.')
  );
  const messageLabel = escapeHtml(c.rsvp.messageLabel || (isBirthday ? 'Lina’ya Mesajınız' : 'Çiftimize mesajınız'));
  const messagePlaceholder = escapeHtml(
    c.rsvp.messagePlaceholder ||
    (isBirthday
      ? 'Lina için güzel dileklerinizi paylaşabilirsiniz.'
      : 'Dilerseniz tebrik veya özel notunuzu iletebilirsiniz...')
  );
  const submitText = escapeHtml(c.rsvp.submitText || (isBirthday ? 'Katılımımı Bildir' : 'Katılım Bilgimi Gönder'));
  const notConnectedMessage = escapeHtml(c.rsvp.notConnectedMessage || 'LCV sistemi yakında aktif olacak.');

  const vegetarianHtml = collectVegetarian ? `
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
                        </div>` : '';

  const childrenQuestionHtml = collectHasChildrenQuestion ? `
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
                        </div>` : '';

  const childCountGroupStyle = collectHasChildrenQuestion ? 'style="display: none;"' : '';
  const initialChildDisplay = collectHasChildrenQuestion ? '1 Çocuk' : '0 Çocuk';

  const childAgeLabel = (idx) => isBirthday ? `Çocuk ${idx} Yaşı *` : `${idx}. Çocuğun Yaşı *`;

  const formAttrs = isConnected
    ? `id="rsvpForm" action="${escapeHtml(c.rsvp.formAction || '#')}" method="POST" target="hidden_iframe" onsubmit="return handleRsvpSubmit(event)" ${formDisplay}`
    : `id="rsvpForm" action="#" method="POST" onsubmit="return handleRsvpSubmit(event)" ${formDisplay}`;

  const googleHiddenInputs = isConnected
    ? `                    <input type="hidden" name="fvv" value="1">\n                    <input type="hidden" name="pageHistory" value="0">`
    : '';

  const iframeHtml = isConnected
    ? `                <iframe name="hidden_iframe" id="hiddenIframe" style="display:none" aria-hidden="true"></iframe>`
    : '';

  const pendingNoticeHtml = !isConnected
    ? `                    <div id="rsvpPendingNotice" class="rsvp-pending-notice" style="display: none;" role="status" aria-live="polite">
                        <i class='bx bx-info-circle'></i>
                        <span>${notConnectedMessage}</span>
                    </div>`
    : '';

  return `        <!-- ===================================================================
             7. LCV / KATILIM FORMU
             =================================================================== -->
        <section class="invitation-section" id="rsvp" style="background-color: var(--bg-surface); border-top: 1px solid var(--rose-border); border-bottom: 1px solid var(--rose-border);">
            <div class="text-center">
                <h2 class="section-title">${rsvpTitle}</h2>
                <div class="ornament-divider"><i class='bx bx-envelope'></i></div>
                <p class="section-subtitle">
                    ${rsvpSubtitle}
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
                <form ${formAttrs}>
${googleHiddenInputs}
                    
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
${vegetarianHtml}

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
${childrenQuestionHtml}

                        <!-- 3C. Çocuk Kişi Sayısı -->
                        <div class="form-group" id="childCountGroup" ${childCountGroupStyle}>
                            <label class="form-label">Çocuk Kişi Sayısı</label>
                            <div class="stepper-wrap">
                                <button type="button" class="stepper-btn" onclick="updateChildCount(-1)" aria-label="Çocuk Sayısını Azalt">−</button>
                                <span class="stepper-display" id="childCountDisplay">${initialChildDisplay}</span>
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
                                    <label for="childAgeInput_1" class="child-age-label">${childAgeLabel(1)}</label>
                                    <input type="number" inputmode="numeric" min="0" max="17" id="childAgeInput_1" placeholder="0–17" class="child-age-input" disabled>
                                </div>
                                <div class="child-age-item" id="childAgeItem_2" style="display: none;">
                                    <label for="childAgeInput_2" class="child-age-label">${childAgeLabel(2)}</label>
                                    <input type="number" inputmode="numeric" min="0" max="17" id="childAgeInput_2" placeholder="0–17" class="child-age-input" disabled>
                                </div>
                                <div class="child-age-item" id="childAgeItem_3" style="display: none;">
                                    <label for="childAgeInput_3" class="child-age-label">${childAgeLabel(3)}</label>
                                    <input type="number" inputmode="numeric" min="0" max="17" id="childAgeInput_3" placeholder="0–17" class="child-age-input" disabled>
                                </div>
                                <div class="child-age-item" id="childAgeItem_4" style="display: none;">
                                    <label for="childAgeInput_4" class="child-age-label">${childAgeLabel(4)}</label>
                                    <input type="number" inputmode="numeric" min="0" max="17" id="childAgeInput_4" placeholder="0–17" class="child-age-input" disabled>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- 4. Mesaj / Not (Opsiyonel) -->
                    <div class="form-group">
                        <label for="guestNote" class="form-label">${messageLabel} <span class="optional">(Opsiyonel)</span></label>
                        <textarea id="guestNote" name="${escapeHtml(entries.message || 'entry.message')}" class="form-textarea" placeholder="${messagePlaceholder}"></textarea>
                    </div>

                    <!-- Gönder Butonu -->
                    <div style="text-align: center; margin-top: 1.5rem;">
                        <button type="submit" class="btn btn-primary" id="rsvpSubmitBtn">
                            <i class='bx bx-send'></i> <span>${submitText}</span>
                        </button>
${pendingNoticeHtml}
                    </div>
                </form>

                <!-- GERÇEK GÖNDERİM SONRASI ONAY KARTI -->
                <div class="rsvp-success-box" id="rsvpSuccessBox">
                    <div class="rsvp-success-icon">
                        <i class='bx bxs-heart'></i>
                    </div>
                    <h3 class="rsvp-success-title">Katılım bilginiz için teşekkür ederiz.</h3>
                    <p class="rsvp-success-subtitle">
                        Yanıtınız ${hostDisplay}'nın misafir listesine eklendi.
                    </p>
                    <div class="rsvp-summary-card" id="rsvpSummaryContent"></div>
                    <button type="button" class="btn btn-secondary" onclick="resetRsvpForm()" style="max-width: 240px; margin: 0 auto;">
                        <i class='bx bx-refresh'></i> Yanıtı Güncelle
                    </button>
                </div>
${iframeHtml}
            </div>
        </section>`;
}

function generateVenueMediaHtml(c, isBirthday) {
  const shortAddr = escapeHtml(c.venue.addressShort || c.venue.city || '');
  if (c.venue.image) {
    const fallbackTitle = escapeHtml(c.venue.name || 'Mekan');
    return `                <div class="venue-media-wrapper">
                    <img src="${escapeHtml(c.venue.image)}" 
                         alt="${escapeHtml(c.venue.imageAlt || c.venue.name)}" 
                         class="venue-media-img"
                         loading="lazy"
                         onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'600\\' height=\\'300\\' viewBox=\\'0 0 600 300\\'><rect width=\\'600\\' height=\\'300\\' fill=\\'%23F3ECE2\\'/><text x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'serif\\' font-size=\\'24\\' fill=\\'%23966F36\\'>${fallbackTitle}</text></svg>'">
                    <div class="venue-badge-overlay">
                        <i class='bx bxs-map-pin'></i> ${shortAddr}
                    </div>
                </div>`;
  }
  if (isBirthday) {
    return `                <div class="venue-botanical-header">
                    <svg class="venue-botanical-svg" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                        <circle cx="32" cy="32" r="9" fill="#D99B26" fill-opacity="0.22" stroke="#8C6218" stroke-width="1.5"/>
                        <g stroke="#C88A1E" stroke-width="1.4" fill="#F2BE54" fill-opacity="0.32">
                            <ellipse cx="32" cy="14" rx="3.5" ry="7"/>
                            <ellipse cx="32" cy="50" rx="3.5" ry="7"/>
                            <ellipse cx="14" cy="32" rx="7" ry="3.5"/>
                            <ellipse cx="50" cy="32" rx="7" ry="3.5"/>
                            <ellipse cx="19.3" cy="19.3" rx="3.5" ry="7" transform="rotate(-45 19.3 19.3)"/>
                            <ellipse cx="44.7" cy="44.7" rx="3.5" ry="7" transform="rotate(-45 44.7 44.7)"/>
                            <ellipse cx="44.7" cy="19.3" rx="3.5" ry="7" transform="rotate(45 44.7 19.3)"/>
                            <ellipse cx="19.3" cy="44.7" rx="3.5" ry="7" transform="rotate(45 19.3 44.7)"/>
                        </g>
                    </svg>
                    <div class="venue-badge-pill">
                        <i class='bx bxs-map-pin'></i> ${shortAddr}
                    </div>
                </div>`;
  }
  return '';
}

function generateVenueActionsHtml(c, isBirthday) {
  if (isBirthday && c.venue.whatsappUrl) {
    return `                        <div class="venue-cta-row">
                            <a href="${escapeHtml(c.venue.mapsUrl)}" 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               class="btn btn-primary venue-cta-btn">
                                <i class='bx bx-navigation'></i> <span>Yol Tarifi</span>
                            </a>
                            <a href="${escapeHtml(c.venue.whatsappUrl)}" 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               class="btn btn-secondary venue-cta-btn venue-whatsapp-btn">
                                <i class='bx bxl-whatsapp'></i> <span>WhatsApp</span>
                            </a>
                        </div>`;
  }
  return `                        <a href="${escapeHtml(c.venue.mapsUrl)}" 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           class="btn btn-primary">
                            <i class='bx bx-navigation'></i> Yol Tarifi Al
                        </a>
                        <button type="button" class="copy-address-btn" onclick="copyAddressText()">
                            <i class='bx bx-copy'></i> Adresi Kopyala
                        </button>`;
}

function generateMusicControlHtml(c) {
  if (!c.music || c.music.enabled !== true || !c.music.src) return '';
  const loopAttr = c.music.loop !== false ? ' loop' : '';
  return `    <!-- ===================================================================
         FLOATING MUSIC CONTROL & NATIVE AUDIO
         =================================================================== -->
    <audio id="invitationAudio" preload="metadata"${loopAttr} src="${escapeHtml(c.music.src)}"></audio>
    <button type="button"
            id="musicToggleBtn"
            class="music-floating-btn is-paused has-label"
            aria-label="Müziği Aç"
            aria-pressed="false"
            onclick="toggleInvitationMusic(event)">
        <span class="music-btn-icon-wrap" aria-hidden="true">
            <i class="bx bx-volume-mute" id="musicToggleIcon"></i>
        </span>
        <span class="music-btn-label" id="musicToggleLabel">Müziği Aç</span>
    </button>`;
}

function renderTemplate(templateHtml, config, options = {}) {
  const c = config;
  const isBirthday = c.eventType === 'birthday';
  const eventType = c.eventType || 'wedding';
  const isShowcase = Boolean(options && options.isShowcase);
  const coupleDisplay = escapeHtml(c.couple.displayName);
  const personName = (c.person && c.person.name) || c.couple.bride || c.couple.displayName;
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
  const isRsvpConnected = !(c.rsvp && c.rsvp.connected === false);
  const collectVegetarian = (c.rsvp && c.rsvp.collectVegetarian !== undefined) ? Boolean(c.rsvp.collectVegetarian) : !isBirthday;
  const collectHasChildrenQuestion = (c.rsvp && c.rsvp.collectHasChildrenQuestion !== undefined) ? Boolean(c.rsvp.collectHasChildrenQuestion) : !isBirthday;

  // Build client-side config (safe for <script> injection)
  const clientConfig = {
    eventType: eventType,
    packageTier: packageTier,
    isDemo: isDemo,
    isShowcase: isShowcase,
    countdownTarget: c.date.countdownTarget,
    galleryFullRes: c.galleryFullRes || [],
    venue: {
      name: c.venue.name,
      address: c.venue.address,
      mapsUrl: c.venue.mapsUrl,
      whatsappUrl: c.venue.whatsappUrl || null
    },
    calendar: c.calendar,
    couple: {
      displayName: c.couple.displayName,
      bride: c.couple.bride,
      groom: c.couple.groom
    },
    music: (c.music && c.music.enabled === true && c.music.src) ? {
      enabled: true,
      src: c.music.src,
      loop: c.music.loop !== false,
      volume: typeof c.music.volume === 'number' ? c.music.volume : 0.7,
      title: c.music.title || ''
    } : null,
    rsvp: (packageTier !== 'standard' && c.rsvp && c.rsvp.enabled !== false) ? {
      connected: isRsvpConnected,
      notConnectedMessage: (c.rsvp && c.rsvp.notConnectedMessage) || 'LCV sistemi yakında aktif olacak.',
      maxAdults: (c.rsvp && c.rsvp.maxAdults) || 10,
      maxChildren: (c.rsvp && c.rsvp.maxChildren) || 4,
      collectVegetarian: collectVegetarian,
      collectHasChildrenQuestion: collectHasChildrenQuestion,
      submitText: (c.rsvp && c.rsvp.submitText) || (isBirthday ? 'Katılımımı Bildir' : 'Katılım Bilgimi Gönder'),
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

  const heroTopBadge = (c.hero && c.hero.badge)
    ? escapeHtml(c.hero.badge)
    : (isDemo ? 'NVM Demo Davetiye' : (isBirthday ? 'Doğum Günü Davetiyesi' : 'Düğün Davetiyesi'));
  const demoFooterNote = isDemo ? '<div class="nvm-demo-notice"><i class=\'bx bx-info-circle\'></i> NVM Demo Davetiye — Bu sayfa örnek amaçlı hazırlanmıştır.</div>' : '';

  const heroTitleHtml = (c.hero && c.hero.title)
    ? escapeHtml(c.hero.title)
    : (isBirthday ? coupleDisplay : `${escapeHtml(c.couple.bride)} <span>&amp;</span> ${escapeHtml(c.couple.groom)}`);

  const heroDateLine = (c.hero && c.hero.dateLine)
    ? escapeHtml(c.hero.dateLine)
    : `${escapeHtml(c.date.short)} • ${escapeHtml(c.date.dayOfWeek)} • ${escapeHtml(c.date.time)}`;

  const countdownTitle = (c.date && c.date.countdownTitle)
    ? escapeHtml(c.date.countdownTitle)
    : (isBirthday ? `${escapeHtml(personName)}’nın Doğum Gününe` : 'Büyük Güne Kalan Süre');

  const letterTitle = (c.letter && c.letter.title) || (c.messages && c.messages.letterTitle) || '';
  const letterTitleHtml = letterTitle ? `<h2 class="letter-title">${escapeHtml(letterTitle)}</h2>` : '';
  const letterSignature = escapeHtml((c.letter && c.letter.signature) || (c.person && c.person.signature) || c.couple.displayName);

  const sunflowerOrnamentSvg = `<svg class="sunflower-divider-svg" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3.5" fill="currentColor" fill-opacity="0.35" stroke="currentColor" stroke-width="1.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  const letterOrnamentHtml = isBirthday ? sunflowerOrnamentSvg : `<i class='bx bxs-heart'></i>`;

  const detailsTitle = isBirthday ? 'Parti Detayları' : 'Davet Detayları';
  const detailsSubtitle = isBirthday
    ? 'Bu güzel güne dair tüm önemli bilgiler aşağıda yer almaktadır.'
    : 'Düğün günümüze dair tüm önemli bilgiler aşağıda yer almaktadır.';
  const dateSubvalue = isBirthday ? escapeHtml(c.date.dayOfWeek) : `${escapeHtml(c.date.dayOfWeek)} Günü`;

  const venueSectionTitle = isBirthday ? 'Parti Nerede?' : 'Mekan';
  const venueSectionSubtitle = isBirthday
    ? 'Parti mekanımızın konumu ve iletişim bilgileri.'
    : 'Düğün mekanımızın konumu ve detaylı adres bilgileri.';

  const calendarEventTitle = escapeHtml(
    (c.calendar && c.calendar.eventTitle) ||
    (isBirthday ? `${c.couple.displayName} Doğum Günü Partisi` : `${c.couple.displayName} Düğün Töreni`)
  );

  const pageTitle = escapeHtml(
    (c.social && c.social.title) ||
    (isBirthday ? `${c.couple.displayName} | Dijital Davetiye` : `${c.couple.displayName} | Düğün Davetiyesi`)
  );
  const ogTitle = escapeHtml(
    (c.social && c.social.title) ||
    (isBirthday ? `${c.couple.displayName} | Dijital Davetiye` : `${c.couple.displayName} — Düğün Davetiyesi`)
  );
  const ogDescription = escapeHtml(
    (c.social && c.social.description) ||
    (isBirthday
      ? `${personName}’nın ${(c.person && c.person.age) || 2}. yaşını birlikte kutlayalım. ${c.date.short} • ${c.venue.city}`
      : `Hayatımızın en özel gününü birlikte kutlamaya davet ediyoruz. ${c.date.short} • ${c.venue.name}, ${c.venue.city}`)
  );

  const replacements = {
    '{{THEME_CLASS}}': themeClass,
    '{{HERO_TOP_BADGE}}': heroTopBadge,
    '{{HERO_TITLE_HTML}}': heroTitleHtml,
    '{{HERO_DATE_LINE}}': heroDateLine,
    '{{COUNTDOWN_TITLE}}': countdownTitle,
    '{{LETTER_TITLE_HTML}}': letterTitleHtml,
    '{{LETTER_ORNAMENT_HTML}}': letterOrnamentHtml,
    '{{LETTER_SIGNATURE}}': letterSignature,
    '{{DETAILS_TITLE}}': detailsTitle,
    '{{DETAILS_SUBTITLE}}': detailsSubtitle,
    '{{DATE_SUBVALUE}}': dateSubvalue,
    '{{VENUE_SECTION_TITLE}}': venueSectionTitle,
    '{{VENUE_SECTION_SUBTITLE}}': venueSectionSubtitle,
    '{{VENUE_MEDIA_HTML}}': generateVenueMediaHtml(c, isBirthday),
    '{{VENUE_ACTIONS_HTML}}': generateVenueActionsHtml(c, isBirthday),
    '{{CALENDAR_EVENT_TITLE}}': calendarEventTitle,
    '{{DEMO_FOOTER_NOTE_HTML}}': demoFooterNote,
    '{{PAGE_TITLE}}': pageTitle,
    '{{OG_TITLE}}': ogTitle,
    '{{OG_DESCRIPTION}}': ogDescription,
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
    '{{VENUE_IMAGE}}': escapeHtml(c.venue.image || ''),
    '{{VENUE_IMAGE_ALT}}': escapeHtml(c.venue.imageAlt || c.venue.name),
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
    '{{TIMELINE_SECTION_HTML}}': generateTimelineSectionHtml(c.timeline, packageTier, isBirthday),
    '{{GALLERY_GRID_HTML}}': generateGalleryHtml(c.gallery, isBirthday, personName),
    '{{GALLERY_SECTION_HTML}}': generateGallerySectionHtml(c.gallery, packageTier, isBirthday, personName),
    '{{RSVP_SECTION_HTML}}': generateRsvpSectionHtml(c, isClosedServer, deadlineDisplay, closedText, packageTier),
    '{{DETAIL_NOTICES_HTML}}': generateDetailNoticesHtml(c.detailNotices, packageTier),
    '{{MUSIC_CONTROL_HTML}}': generateMusicControlHtml(c),
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

  return res.status(200).send(html);
}
