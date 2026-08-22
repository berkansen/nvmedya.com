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
  return timeline.map(item => {
    const iconHtml = item.icon ? `<div class="timeline-icon-wrap"><i class='${escapeHtml(item.icon)}'></i></div>` : '';
    return `
                <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-card">
                        <div class="timeline-content-wrap">
                            ${iconHtml}
                            <div class="timeline-event-name">${escapeHtml(item.title)}</div>
                        </div>
                        <div class="timeline-time">${escapeHtml(item.time)}</div>
                    </div>
                </div>`;
  }).join('\n');
}

function generateGalleryHtml(gallery) {
  const tallIndices = [0, 4]; // 1st and 5th images are tall
  return gallery.map((url, i) => {
    const isTall = tallIndices.includes(i);
    const num = i + 1;
    return `                <div class="gallery-item${isTall ? ' tall' : ''}" onclick="openLightbox(${i})">
                    <img src="${escapeHtml(url)}" alt="Bizden Kareler ${num}" class="gallery-img" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'${isTall ? 500 : 400}\\' viewBox=\\'0 0 400 ${isTall ? 500 : 400}\\'><rect width=\\'400\\' height=\\'${isTall ? 500 : 400}\\' fill=\\'%23F3ECE2\\'/><text x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'serif\\' font-size=\\'20\\' fill=\\'%23966F36\\'>Fotoğraf ${num}</text></svg>'">
                    <div class="gallery-overlay-hover"><i class='bx bx-fullscreen'></i></div>
                </div>`;
  }).join('\n');
}

function renderTemplate(templateHtml, config) {
  const c = config;
  const coupleDisplay = escapeHtml(c.couple.displayName);

  // Build client-side config (safe for <script> injection)
  const clientConfig = {
    countdownTarget: c.date.countdownTarget,
    galleryFullRes: c.galleryFullRes,
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
    rsvp: {
      entries: c.rsvp.entries
    }
  };

  const replacements = {
    '{{PAGE_TITLE}}': escapeHtml(`${c.couple.displayName} | Düğün Davetiyesi`),
    '{{OG_TITLE}}': escapeHtml(`${c.couple.displayName} — Düğün Davetiyesi`),
    '{{OG_DESCRIPTION}}': escapeHtml(`Hayatımızın en özel gününü birlikte kutlamaya davet ediyoruz. ${c.date.short} • ${c.venue.name}, ${c.venue.city}`),
    '{{OG_IMAGE}}': escapeHtml(c.venue.image),
    '{{HERO_BG_IMAGE}}': escapeHtml(c.hero.backgroundImage),
    '{{BRIDE_NAME}}': escapeHtml(c.couple.bride),
    '{{GROOM_NAME}}': escapeHtml(c.couple.groom),
    '{{COUPLE_DISPLAY}}': coupleDisplay,
    '{{DATE_DISPLAY}}': escapeHtml(c.date.display),
    '{{DATE_SHORT}}': escapeHtml(c.date.short),
    '{{DAY_OF_WEEK}}': escapeHtml(c.date.dayOfWeek),
    '{{TIME_START}}': escapeHtml(c.date.time),
    '{{HERO_MESSAGE}}': escapeHtml(c.hero.message),
    '{{LETTER_TEXT}}': escapeHtml(c.messages.letterText),
    '{{VENUE_NAME}}': escapeHtml(c.venue.name),
    '{{VENUE_ADDRESS_FULL}}': escapeHtml(c.venue.address),
    '{{VENUE_ADDRESS_LINE1}}': escapeHtml(c.venue.addressLine1),
    '{{VENUE_ADDRESS_LINE2}}': escapeHtml(c.venue.addressLine2),
    '{{VENUE_ADDRESS_SHORT}}': escapeHtml(c.venue.addressShort),
    '{{VENUE_CITY}}': escapeHtml(c.venue.city),
    '{{VENUE_IMAGE}}': escapeHtml(c.venue.image),
    '{{VENUE_IMAGE_ALT}}': escapeHtml(c.venue.imageAlt),
    '{{VENUE_MAPS_URL}}': escapeHtml(c.venue.mapsUrl),
    '{{VENUE_DESC}}': escapeHtml(c.venue.description),
    '{{FORM_ACTION}}': escapeHtml(c.rsvp.formAction),
    '{{ENTRY_NAME}}': escapeHtml(c.rsvp.entries.name),
    '{{ENTRY_ATTENDANCE}}': escapeHtml(c.rsvp.entries.attendance),
    '{{ENTRY_ADULTS}}': escapeHtml(c.rsvp.entries.adults),
    '{{ENTRY_HAS_CHILDREN}}': escapeHtml(c.rsvp.entries.hasChildren),
    '{{ENTRY_CHILDREN}}': escapeHtml(c.rsvp.entries.children),
    '{{ENTRY_MESSAGE}}': escapeHtml(c.rsvp.entries.message),
    '{{GOOGLE_CAL_URL}}': escapeHtml(c.calendar.googleCalUrl),
    '{{FINAL_TEXT}}': escapeHtml(c.messages.finalText),
    '{{TIMELINE_ITEMS_HTML}}': generateTimelineHtml(c.timeline),
    '{{GALLERY_GRID_HTML}}': generateGalleryHtml(c.gallery),
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
  if (!queryDemo && !querySlug && req.url) {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      queryDemo = parsedUrl.searchParams.get('demo');
      querySlug = parsedUrl.searchParams.get('slug');
    } catch {}
  }

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
  const html = renderTemplate(templateHtml, config);

  // Response headers
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

  return res.status(200).send(html);
}
