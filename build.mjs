// Doptiva — statični generator strani brez odvisnosti.
// Uporaba:  node build.mjs            -> dist/ (za objavo na Vercelu)
//           node build.mjs --preview  -> preview/site/ (relativne povezave za predogled)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import config from './site.config.mjs';
import { cacheEditorialPhotos } from './scripts/editorial-photos.mjs';
import sl from './content/sl.mjs';
import en from './content/en.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PREVIEW = process.argv.includes('--preview');
const OUT = path.join(ROOT, PREVIEW ? 'preview/site' : 'dist');
const C = { sl, en };
const LANGS = ['sl', 'en'];
const URL_BASE = config.url.replace(/\/$/, '');
const YEAR = new Date().getFullYear();

// ---------- poti ----------
const ROUTES = {
  home: { sl: '/', en: '/en/' },
  projects: { sl: '/projekti/', en: '/en/projects/' },
  about: { sl: '/o-nas/', en: '/en/about/' },
  contact: { sl: '/kontakt/', en: '/en/contact/' },
  blog: { sl: '/blog/', en: '/en/blog/' },
  privacy: { sl: '/pravno/zasebnost/', en: '/en/legal/privacy/' },
  cookies: { sl: '/pravno/piskotki/', en: '/en/legal/cookies/' },
  imprint: { sl: '/pravno/pravno-obvestilo/', en: '/en/legal/imprint/' },
};

// ---------- pomožne funkcije ----------
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// nedeljivi presledek med številko in znakom % (slovenski pravopis), da se ne prelomita
const nb = (s) => s.replace(/(\d) %/g, '$1\u00A0%');
const abs = (p) => URL_BASE + p;
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function href(from, to) {
  if (/^(https?:|mailto:|tel:)/.test(to)) return to;
  if (!PREVIEW) return to;
  const [p, hash] = to.split('#');
  if (p === '') return '#' + hash;
  const target = p.endsWith('/') ? p + 'index.html' : p;
  const fromDir = from.endsWith('/') ? from : path.posix.dirname(from) + '/';
  let rel = path.posix.relative(fromDir, target) || 'index.html';
  return rel + (hash ? '#' + hash : '');
}

function fileHash(p) {
  return crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex').slice(0, 8);
}

const MONTHS_SL = ['januarja', 'februarja', 'marca', 'aprila', 'maja', 'junija', 'julija', 'avgusta', 'septembra', 'oktobra', 'novembra', 'decembra'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function fmtDate(iso, lang) {
  const [y, m, d] = iso.split('-').map(Number);
  return lang === 'sl' ? `${d}. ${MONTHS_SL[m - 1]} ${y}` : `${d} ${MONTHS_EN[m - 1]} ${y}`;
}

function fill(text, lang = 'sl') {
  const L = config.legal;
  const map = {
    company: L.company, owner: L.owner, street: L.street, postal: L.postal, city: L.city,
    registrationNo: L.registrationNo, taxNo: L.taxNo, email: config.email,
    mailProvider: L.mailProvider, mailProviderLocation: lang === 'en' ? (L.mailProviderLocationEn || L.mailProviderLocation) : L.mailProviderLocation,
  };
  return text.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in map ? map[k] : m));
}

function stripAnalytics(text) {
  return config.analytics
    ? text.replace(/<!--\/?analytics-->\n?/g, '')
    : text.replace(/<!--analytics-->[\s\S]*?<!--\/analytics-->\n?/g, '');
}

// ---------- markdown ----------
function parseFront(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  const data = {};
  if (!m) return { data, body: src };
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) data[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { data, body: src.slice(m[0].length) };
}

function inline(s, from) {
  let out = esc(nb(s));
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => {
    const ext = /^https?:/.test(u);
    return `<a href="${ext ? u : href(from, u)}"${ext ? ' rel="noopener"' : ''}>${t}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s.,;:!?)]|$)/g, '$1<em>$2</em>');
  return out;
}

function md(src, from, opts = {}) {
  const lines = src.replace(/\r/g, '').split('\n');
  const html = [];
  const toc = [];
  let para = [];
  let firstPara = true;
  const flushPara = () => {
    if (!para.length) return;
    const text = para.join(' ');
    let cls = '';
    if (opts.lead && firstPara) cls = ' class="lead"';
    if (/^(Viri|Sources):/.test(text)) cls = ' class="sources"';
    html.push(`<p${cls}>${inline(text, from)}</p>`);
    firstPara = false;
    para = [];
  };
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { flushPara(); i++; continue; }
    let m;
    if ((m = line.match(/^(#{2,4})\s+(.*)$/))) {
      flushPara();
      const level = m[1].length;
      const id = slugify(m[2]);
      if (level === 2) toc.push({ id, text: m[2] });
      html.push(`<h${level} id="${id}">${inline(m[2], from)}</h${level}>`);
      i++; continue;
    }
    if (/^---\s*$/.test(line)) { flushPara(); html.push('<hr>'); i++; continue; }
    if (/^>\s?/.test(line)) {
      flushPara();
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      html.push(`<blockquote><p>${inline(buf.join(' '), from)}</p></blockquote>`);
      continue;
    }
    if (/^\|/.test(line)) {
      flushPara();
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      const cells = (r) => r.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells);
      const hasHead = head.some((c) => c);
      let t = '<div class="table-scroll"><table>';
      if (hasHead) t += '<thead><tr>' + head.map((c) => `<th scope="col">${inline(c, from)}</th>`).join('') + '</tr></thead>';
      t += '<tbody>' + body.map((r) => '<tr>' + r.map((c, j) => (j === 0 && !hasHead ? `<th scope="row">${inline(c, from)}</th>` : `<td>${inline(c, from)}</td>`)).join('') + '</tr>').join('') + '</tbody></table></div>';
      html.push(t);
      continue;
    }
    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      flushPara();
      const ordered = /^\d+\.\s+/.test(line);
      const re = ordered ? /^\d+\.\s+/ : /^[-*]\s+/;
      const items = [];
      while (i < lines.length && re.test(lines[i])) {
        let item = lines[i].replace(re, '');
        i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i])) { item += ' ' + lines[i].trim(); i++; }
        items.push(`<li>${inline(item, from)}</li>`);
      }
      html.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }
    if (/^<!--/.test(line)) { i++; continue; }
    para.push(line.trim());
    i++;
  }
  flushPara();
  return { html: html.join('\n'), toc };
}

// ---------- vsebina bloga ----------
function loadPosts() {
  const posts = { sl: [], en: [] };
  for (const lang of LANGS) {
    const dir = path.join(ROOT, 'content/blog', lang);
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      const { data, body } = parseFront(src);
      const slug = f.replace(/\.md$/, '');
      const words = body.split(/\s+/).filter(Boolean).length;
      posts[lang].push({
        lang, slug, body, title: data.title, description: data.description,
        date: data.date, updated: data.updated || data.date, key: data.key,
        path: (lang === 'sl' ? '/blog/' : '/en/blog/') + slug + '/',
        minutes: Math.max(1, Math.round(words / 200)),
        og: `/assets/og/post-${slug}.png`,
      });
    }
    posts[lang].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title)));
  }
  // povezava prevodov prek ključa
  for (const p of posts.sl) {
    const e = posts.en.find((x) => x.key === p.key);
    if (e) { p.alt = e.path; e.alt = p.path; }
  }
  return posts;
}

// ---------- ikone ----------
const ICON = {
  partners: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M2.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><path d="M14 14.6c.8-.4 1.6-.6 2.5-.6 2.3 0 4.2 1.5 4.7 4.5"/></svg>',
  sun: '<svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>',
  moon: '<svg class="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3.5 7h17M3.5 12h17M3.5 17h17"/></svg>',
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  ne: '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 11 11 3M5 3h6v6"/></svg>',
  pause: '<svg class="i-pause" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><rect x="3" y="2" width="3" height="10"/><rect x="8" y="2" width="3" height="10"/></svg>',
  play: '<svg class="i-play" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><path d="M4 2l8 5-8 5z"/></svg>',
  down: '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 2v10M3 8l4 4 4-4"/></svg>',
};
// ročno narisane puščice (opombe)
const SKETCH = {
  hero: '<svg class="sketch" viewBox="0 0 320 260" aria-hidden="true"><path class="dash loop" d="M112 58c-38-10-66 12-60 40 6 26 48 30 62 8 12-20-6-44-32-40-28 4-44 30-28 52 16 22 56 18 68-6"/><path class="draw" d="M150 104c46 8 92 44 102 112"/><path class="draw-late" d="M238 204l14 17 12-19"/></svg>',
  arrow: '<svg class="arrow-sketch" viewBox="0 0 120 50" aria-hidden="true"><path d="M4 30c24-16 58-20 98-6"/><path d="M92 14l12 10-14 8"/></svg>',
  arrowUp: '<svg class="arrow-sketch" viewBox="0 0 150 80" aria-hidden="true"><path d="M6 70c30-6 70-26 96-58"/><path d="M84 10l20 0 0 20"/></svg>',
};

const LOGO_SVG = fs.readFileSync(path.join(ROOT, 'src/logo.svg'), 'utf8')
  .replace('<svg ', '<svg aria-hidden="true" focusable="false" ')
  .replace(' role="img" aria-label="Doptiva"', '')
  .replace(/<title>.*?<\/title>/, '');

// ---------- strukturirani podatki ----------
function orgGraph() {
  const s = sl.home.services;
  return [
    {
      '@type': 'ProfessionalService',
      '@id': abs('/#organization'),
      name: 'Doptiva',
      legalName: config.legal.company.startsWith('[') ? undefined : config.legal.company,
      url: abs('/'),
      logo: abs('/assets/brand/doptiva-logo.png'),
      image: abs('/assets/og/og-sl.png'),
      description: sl.home.description,
      email: config.email,
      address: { '@type': 'PostalAddress', addressLocality: config.legal.city, postalCode: config.legal.postal, addressCountry: 'SI' },
      areaServed: { '@type': 'Country', name: 'Slovenia' },
      knowsLanguage: ['sl', 'en'],
      founder: { '@type': 'Person', name: config.legal.owner, sameAs: config.social.linkedin ? [config.social.linkedin] : undefined },
      knowsAbout: ['digitalizacija', 'avtomatizacija poslovnih procesov', 'umetna inteligenca', 'digitalisation', 'business process automation', 'artificial intelligence for SMEs'],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Storitve Doptiva',
        itemListElement: s.map((x) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: x.title, description: x.text } })),
      },
    },
    {
      '@type': 'WebSite',
      '@id': abs('/#website'),
      url: abs('/'),
      name: 'Doptiva',
      inLanguage: ['sl-SI', 'en'],
      publisher: { '@id': abs('/#organization') },
    },
  ];
}

function breadcrumb(page, items) {
  return {
    '@type': 'BreadcrumbList',
    '@id': abs(page.path) + '#breadcrumb',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

function jsonld(nodes) {
  const clean = JSON.parse(JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }));
  return `<script type="application/ld+json">${JSON.stringify(clean).replace(/</g, '\\u003c')}</script>`;
}

// ---------- predloge ----------
let CSS_V = '', BRAND_V = '', JS_V = '';

function head(page) {
  const t = C[page.lang];
  const alts = page.alternates || {};
  const ogImage = abs(page.og || `/assets/og/og-${page.lang}.png`);
  const hreflang = alts.sl && alts.en
    ? `<link rel="alternate" hreflang="sl" href="${abs(alts.sl)}">\n<link rel="alternate" hreflang="en" href="${abs(alts.en)}">\n<link rel="alternate" hreflang="x-default" href="${abs(alts.sl)}">`
    : '';
  const p = page.path;
  const rss = page.lang === 'sl' ? '/blog/rss.xml' : '/en/blog/rss.xml';
  return `<!doctype html>
<html lang="${page.lang}"${PREVIEW ? ' data-preview' : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
${page.noindex ? '<meta name="robots" content="noindex, follow">' : `<link rel="canonical" href="${abs(p)}">\n<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">`}
${hreflang}
<meta name="theme-color" content="#F4F6F3" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#131816" media="(prefers-color-scheme: dark)">
<meta name="author" content="Doptiva">
<meta property="og:site_name" content="Doptiva">
<meta property="og:type" content="${page.type || 'website'}">
<meta property="og:title" content="${esc(page.ogTitle || page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${abs(p)}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(page.ogTitle || page.title)}">
<meta property="og:locale" content="${t.locale}">
<meta property="og:locale:alternate" content="${page.lang === 'sl' ? en.locale : sl.locale}">
${page.article ? `<meta property="article:published_time" content="${page.article.date}">\n<meta property="article:modified_time" content="${page.article.updated}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${href(p, '/favicon.ico')}" sizes="32x32">
<link rel="icon" href="${href(p, '/favicon.svg')}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${href(p, '/apple-touch-icon.png')}">
<link rel="manifest" href="${href(p, '/site.webmanifest')}">
${PREVIEW ? '' : '<link rel="preload" href="/assets/fonts/newsreader-display.woff2" as="font" type="font/woff2" crossorigin>\n<link rel="preload" href="/assets/fonts/montserrat-latin.woff2" as="font" type="font/woff2" crossorigin>'}
<link rel="stylesheet" href="${href(p, '/assets/css/site.css')}?v=${CSS_V}">
<link rel="stylesheet" href="${href(p, '/assets/css/brand-refresh.css')}?v=${BRAND_V}">
<script src="${href(p, '/assets/js/theme-init.js')}"></script>
<script src="${href(p, '/assets/js/site.js')}?v=${JS_V}" defer></script>
${config.analytics && !PREVIEW ? '<script src="/_vercel/insights/script.js" defer></script>' : ''}
<link rel="alternate" type="application/rss+xml" title="Doptiva blog (${page.lang})" href="${href(p, rss)}">
${jsonld(page.jsonld || orgGraph())}
</head>`;
}

function header(page) {
  const t = C[page.lang].ui;
  const p = page.path;
  const R = (k) => ROUTES[k][page.lang];
  const navItems = [
    ['home', t.nav.solutions], ['projects', t.nav.projects], ['about', t.nav.about], ['blog', t.nav.blog], ['contact', t.nav.contact],
  ];
  const otherLang = page.lang === 'sl' ? 'en' : 'sl';
  const altPath = (page.alternates && page.alternates[otherLang]) || ROUTES.home[otherLang];
  const links = navItems.map(([k, label]) => {
    const active = page.section === k;
    return `<a class="nav-link" href="${href(p, R(k))}"${active ? ' aria-current="page"' : ''}>${label}</a>`;
  }).join('\n      ');
  return `<body${page.section === 'blog' ? ' class="site-blog"' : page.section === 'projects' ? ' class="site-projects"' : ''}>
<a class="skip-link" href="#main">${t.skip}</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="logo" href="${href(p, R('home'))}" aria-label="Doptiva, ${esc(t.home.toLowerCase())}">${LOGO_SVG}</a>
    <nav id="site-nav" class="site-nav" aria-label="${page.lang === 'sl' ? 'Glavna navigacija' : 'Main navigation'}">
      ${links}
      <a class="btn btn-primary btn-sm nav-cta" href="${href(p, R('contact'))}">${t.cta} ${ICON.ne}</a>
    </nav>
    <div class="header-tools">
      <a class="lang-link" href="${href(p, altPath)}" hreflang="${otherLang}" lang="${otherLang}">${t.langSwitch}<span class="visually-hidden"> (${esc(t.langSwitchLabel)})</span></a>
      <button class="icon-btn theme-toggle" type="button" aria-label="${esc(t.themeLabel)}" aria-pressed="false">${ICON.moon}${ICON.sun}</button>
      <button class="icon-btn menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="${esc(t.menuOpen)}">${ICON.menu}</button>
    </div>
  </div>
</header>`;
}

function newsletterSignup(page) {
  const n = C[page.lang].newsletter;
  const privacy = href(page.path, ROUTES.privacy[page.lang]);
  return `<div id="newsletter-overlay" class="newsletter-overlay" hidden>
    <section class="newsletter-dialog" role="dialog" aria-modal="true" aria-labelledby="newsletter-heading">
      <button type="button" class="newsletter-close" data-newsletter-close aria-label="${esc(n.close)}">×</button>
      <span class="label">${esc(n.kicker)}</span>
      <h2 id="newsletter-heading">${esc(n.title)}</h2>
      <p>${esc(n.text)}</p>
      <form id="newsletter-form" novalidate>
        <label for="newsletter-email">${esc(n.email)}</label>
        <input id="newsletter-email" name="email" type="email" required maxlength="160" autocomplete="email" placeholder="${esc(n.placeholder)}">
        <label class="newsletter-consent"><input type="checkbox" name="consent" value="yes" required><span>${esc(n.consentBefore)}<a href="${privacy}">${esc(n.consentLink)}</a>.</span></label>
        <button type="submit" class="btn btn-primary">${esc(n.submit)}</button>
        <p id="newsletter-status" role="status" hidden></p>
      </form>
      <button type="button" class="newsletter-dismiss" data-newsletter-close>${esc(n.dismiss)}</button>
    </section>
  </div>`;
}

function footer(page) {
  const t = C[page.lang].ui;
  const p = page.path;
  const R = (k) => ROUTES[k][page.lang];
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="logo" href="${href(p, R('home'))}" aria-label="Doptiva">${LOGO_SVG}</a>
        <p>${esc(t.footer.tagline)}</p>
      </div>
      <div class="footer-col">
        <h2>${t.footer.pages}</h2>
        <ul>
          <li><a href="${href(p, R('home'))}">${t.nav.solutions}</a></li>
          <li><a href="${href(p, R('projects'))}">${t.nav.projects}</a></li>
          <li><a href="${href(p, R('about'))}">${t.nav.about}</a></li>
          <li><a href="${href(p, R('blog'))}">${t.nav.blog}</a></li>
          <li><a href="${href(p, R('contact'))}">${t.nav.contact}</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h2>${t.footer.legal}</h2>
        <ul>
          <li><a href="${href(p, R('privacy'))}">${t.legalNav.privacy}</a></li>
          <li><a href="${href(p, R('cookies'))}">${t.legalNav.cookies}</a></li>
          <li><a href="${href(p, R('imprint'))}">${t.legalNav.imprint}</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h2>${t.footer.contact}</h2>
        <ul>
          <li><a href="mailto:${config.email}">${config.email}</a></li>
          <li>${t.footer.remote}</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <button type="button" class="newsletter-footer-link" data-newsletter-open>${esc(C[page.lang].newsletter.footer)}</button>
      <span>© ${YEAR} Doptiva. ${t.footer.rights}</span>
    </div>
  </div>
</footer>
${newsletterSignup(page)}
</body>
</html>`;
}

function layout(page, main) {
  return `${head(page)}\n${header(page)}\n<main id="main">\n${main}\n</main>\n${footer(page)}\n`;
}

function ctaBlock(lang, p) {
  const c = C[lang].cta;
  return `<section class="cta-band">
  <div class="wrap">
    <span class="label">${esc(c.label)}</span>
    <h2>${esc(c.title)} <em>${esc(c.title2)}</em></h2>
    <p>${esc(c.text)}</p>
    <a class="btn btn-primary" href="${href(p, ROUTES.contact[lang])}">${esc(c.button)} ${ICON.ne}</a>
  </div>
  <div class="cta-sketch" data-animate>${SKETCH.arrowUp}</div>
</section>`;
}

function pageHead(lang, p, crumbs, label, h1, lede, extra = '') {
  return `<section class="page-head ruled">
  <div class="wrap">
    ${breadcrumbsHtml(lang, p, crumbs)}
    <div><span class="label">${esc(label)}</span></div>
    <h1>${esc(h1)}</h1>
    ${lede ? `<p class="lede">${esc(lede)}</p>` : ''}${extra}
  </div>
</section>`;
}

function breadcrumbsHtml(lang, p, items) {
  return `<nav class="breadcrumbs" aria-label="${lang === 'sl' ? 'Drobtinice' : 'Breadcrumbs'}"><ol>${items.map((it, i) =>
    i < items.length - 1 ? `<li><a href="${href(p, it.path)}">${esc(it.name)}</a></li>` : `<li aria-current="page">${esc(it.name)}</li>`).join('')}</ol></nav>`;
}

// ---------- slike drsnika ----------
function slideImage(key) {
  // Four original soft pastel glass motifs, distributed among six challenge cards.
  const pastel = {
    narocila: 'pastel-sage-glass.svg',
    excel: 'pastel-teal-glass.svg',
    teren: 'pastel-peach-mist.svg',
    ponudbe: 'pastel-mauve-haze.svg',
    orodja: 'pastel-sage-glass.svg',
    ai: 'pastel-teal-glass.svg',
  };
  if (pastel[key]) return '/assets/img/slides/' + pastel[key];
  const dir = path.join(ROOT, 'public/assets/img/slides');
  for (const ext of ['webp', 'jpg', 'jpeg', 'png']) {
    if (fs.existsSync(path.join(dir, `${key}.${ext}`))) return `/assets/img/slides/${key}.${ext}`;
  }
  return `/assets/img/slides/${key}.svg`;
}

// ---------- strani ----------
function renderHome(lang, posts) {
  const t = C[lang], h = t.home, p = ROUTES.home[lang];
  const page = {
    lang, path: p, section: 'home', title: h.title, description: h.description,
    alternates: ROUTES.home, ogTitle: h.h1,
  };
  page.jsonld = [
    ...orgGraph(),
    { '@type': 'WebPage', '@id': abs(p) + '#webpage', url: abs(p), name: h.title, description: h.description, inLanguage: lang, isPartOf: { '@id': abs('/#website') }, about: { '@id': abs('/#organization') } },
    { '@type': 'FAQPage', '@id': abs(p) + '#faq', inLanguage: lang, mainEntity: h.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a.join(' ') } })) },
  ];
  const tiles = h.slides.map((s, i) => `
        <figure class="tile">
          <div class="tile-media"><img src="${href(p, slideImage(s.img))}" alt="${esc(s.alt)}" width="720" height="540" loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async"></div>
          <figcaption>
            <h3>${esc(s.title)}</h3>
            <p>${esc(s.text)}</p>
            <a class="text-link" href="${s.href}">${esc(s.link)} ${ICON.down}</a>
          </figcaption>
        </figure>`).join('');

  const notes = h.services.map((s, i) => `
        <article class="note note-${s.id}" id="${s.id}">
          <span class="note-num">${String(i + 1).padStart(2, '0')}</span>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.text)}</p>
          <ul class="ticks">${s.ticks.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          <span class="annot">${esc(s.tag)}</span>
        </article>`).join('');

  const steps = h.steps.map((s) => `<li class="step"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('\n          ');

  const pr = t.projectsPage.items.map((it) => `
      <article class="project-teaser project-teaser-${it.id}">
        <div class="project-media" aria-hidden="true"><div class="project-media-inner"><span class="project-monogram">${esc(it.name)}</span><span class="project-deco"><span></span><span></span><span></span></span></div></div>
        <div class="project-teaser-body">
        <div class="project-head"><h3>${esc(it.name)}</h3><span class="stamp${it.statusType === 'mvp' ? ' stamp-mvp' : ''}">${esc(it.status)}</span></div>
        <p class="meta">${esc(it.meta)}</p>
        <p>${esc(it.summary)}</p>
        <p><a class="text-link" href="${href(p, ROUTES.projects[lang] + '#' + it.id)}">${lang === 'sl' ? 'Več o projektu' : 'More about'} ${esc(it.name)} ${ICON.ne}</a></p>
        </div>
      </article>`).join('');

  const faq = h.faq.map((f) => `
        <details>
          <summary>${esc(f.q)}</summary>
          <div class="answer">${f.a.map((x) => `<p>${esc(x)}</p>`).join('')}</div>
        </details>`).join('');

  const servicesId = lang === 'sl' ? 'storitve' : 'services';
  const main = `
<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-main">
      <div><span class="label">${esc(h.kicker)}</span></div>
      <h1><span>${esc(h.h1a)}</span><span>${esc(h.h1b)}</span><span class="hero-emphasis">${esc(h.h1c)}</span></h1>
      <p class="hero-lede">${esc(h.lede)} ${esc(h.lede2)}</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="${href(p, ROUTES.contact[lang])}">${esc(h.cta1)} ${ICON.ne}</a>
        <a class="text-link" href="#${servicesId}">${esc(h.cta2)} ${ICON.down}</a>
      </div>
    </div>
  </div>
</section>

<!-- Fotografski prehod prek celotne širine, namenoma brez marketinškega besedila. -->
<section class="photo-divider" aria-hidden="true">
  <div class="photo-divider-image"></div>
</section>

<section class="band" aria-label="${esc(h.bandLabel)}">
  <div class="wrap band-grid">
    <blockquote>${esc(h.bandText)}</blockquote>
    <div class="band-side"><span class="meta">${esc(h.bandLabel)}</span><p>${esc(h.bandText2)}</p></div>
  </div>
</section>

<section class="section section-marquee" aria-labelledby="slider-title">
  <div class="wrap">
    <div class="slider-head">
      <div><span class="label">${esc(h.sliderLabel)}</span><h2 id="slider-title">${esc(h.sliderTitle)}</h2></div>
      <button class="marquee-toggle" type="button" data-marquee-toggle aria-pressed="false" hidden>${ICON.pause}${ICON.play}<span data-label-pause>${esc(t.ui.pause)}</span><span data-label-play hidden>${esc(t.ui.play)}</span></button>
    </div>
  </div>
  <div class="marquee" data-marquee role="region" aria-label="${esc(t.ui.sliderLabel)}">
    <div class="marquee-track">${tiles}
    </div>
  </div>
</section>

<section class="section ruled" id="${servicesId}" aria-labelledby="services-title">
  <div class="wrap split">
    <div class="split-head sticky-head">
      <div><span class="label">${esc(h.servicesLabel)}</span></div>
      <h2 id="services-title">${esc(h.servicesTitle)}</h2>
      <p>${esc(h.servicesIntro)}</p>
      ${SKETCH.arrow}
    </div>
    <div>
      <div class="notes">${notes}
      </div>
      <p class="partner-note">${ICON.partners}<span>${esc(h.servicesNote)}</span></p>
    </div>
  </div>
</section>

<section class="section section-alt" aria-labelledby="steps-title">
  <div class="wrap split">
    <div class="split-head">
      <div><span class="label">${esc(h.stepsLabel)}</span></div>
      <h2 id="steps-title">${esc(h.stepsTitle)}</h2>
      <p>${esc(h.stepsIntro)}</p>
    </div>
    <ol class="steps" data-steps>
          ${steps}
    </ol>
  </div>
</section>

<section class="adoption-feature" aria-labelledby="adoption-title">
  <div class="adoption-visual" aria-hidden="true"></div>
  <div class="adoption-copy">
    <span class="label">${esc(h.adoptionLabel)}</span>
    <h2 id="adoption-title">${esc(h.adoptionTitle)}</h2>
    <p>${esc(h.adoptionText)}</p>
  </div>
</section>

<section class="section" aria-labelledby="projects-title">
  <div class="wrap">
    <div class="section-head"><div><span class="label">${esc(h.projectsLabel)}</span></div><h2 id="projects-title">${esc(h.projectsTitle)}</h2><p>${esc(h.projectsIntro)}</p></div>
    <div class="projects-row projects-editorial">${pr}
    </div>
  </div>
</section>

<section class="section ruled" aria-labelledby="faq-title">
  <div class="wrap split">
    <div class="split-head sticky-head">
      <div><span class="label">${esc(h.faqLabel)}</span></div>
      <h2 id="faq-title">${esc(h.faqTitle)}</h2>
      <p>${esc(h.faqIntro)}</p>
      <p class="annot">${esc(h.faqAnnot)}</p>
    </div>
    <div class="faq">${faq}
    </div>
  </div>
</section>

${ctaBlock(lang, p)}`;
  return { page, html: layout(page, main) };
}

function refiloUi(u) {
  const states = JSON.stringify(u.flow.map((f, k) => [f, ['open', 'wait', 'ok', 'ordered', 'ok'][k]]));
  return `<div class="ui" aria-hidden="true" data-refilo>
  <div class="ui-top"><span></span><span></span><span></span><b>${esc(u.app)}</b></div>
  <div class="ui-body">
    <div class="ui-title"><strong>${esc(u.title)}</strong><span class="ui-chip">${esc(u.chip)}</span></div>
    <div class="ui-scroll"><table class="ui-table">
      <thead><tr>${u.cols.map((c, i) => `<th${i === 2 ? ' class="num"' : ''}>${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${u.rows.map((r, k) => `<tr${k === 0 ? ' data-cycle-row' : ''}><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td class="num">${esc(r[2])}</td><td><span class="st st-${r[4]}"${k === 0 ? ` data-cycle="${esc(states)}"` : ''}>${esc(r[3])}</span></td></tr>`).join('')}</tbody>
    </table></div>
    <div class="ui-flow">${u.flow.map((f, k) => `<span${k === 0 ? ' class="is-current"' : ''}>${esc(f)}</span>`).join('<i>/</i>')}</div>
  </div>
</div>`;
}

function tertoUi(u) {
  return `<div class="phone" aria-hidden="true" data-terto><div class="phone-screen">
  <div class="ui-top"><b>${esc(u.app)}</b></div>
  <div class="ui-body">
    <strong>${esc(u.title)}</strong>
    <div class="field" data-tstep><small>${esc(u.customerLabel)}</small><div>${esc(u.customer)}</div></div>
    <div class="field"><small>${esc(u.itemsLabel)}</small>${u.items.map((it) => `<div class="qty" data-tstep><span>${esc(it[0])}</span><span><em>−</em>${esc(it[1])}<em>+</em></span></div>`).join('')}</div>
    <div class="field" data-tstep><small>${esc(u.dateLabel)}</small><div>${esc(u.date)}</div></div>
    <div class="field" data-tstep><small>${esc(u.noteLabel)}</small><div>${esc(u.note)}</div></div>
    <div class="ui-btn" data-tstep data-sent="${esc(u.sent)}">${esc(u.button)}</div>
  </div>
</div></div>`;
}

function renderProjects(lang) {
  const t = C[lang], P = t.projectsPage, p = ROUTES.projects[lang];
  const page = { lang, path: p, section: 'projects', title: P.title, description: P.description, alternates: ROUTES.projects };
  const crumbs = [{ name: t.ui.home, path: ROUTES.home[lang] }, { name: P.h1, path: p }];
  page.jsonld = [
    ...orgGraph(),
    { '@type': 'CollectionPage', '@id': abs(p) + '#webpage', url: abs(p), name: P.title, description: P.description, inLanguage: lang, isPartOf: { '@id': abs('/#website') }, breadcrumb: { '@id': abs(p) + '#breadcrumb' } },
    breadcrumb(page, crumbs),
    { '@type': 'SoftwareApplication', name: 'Refilo', url: config.projects.refilo, applicationCategory: 'BusinessApplication', operatingSystem: 'Web', description: P.items[0].summary, publisher: { '@id': abs('/#organization') } },
    { '@type': 'SoftwareApplication', name: 'Terto', applicationCategory: 'BusinessApplication', operatingSystem: 'Web, Android, iOS', description: P.items[1].summary, publisher: { '@id': abs('/#organization') } },
  ];
  const items = P.items.map((it) => {
    const link = it.href === 'refilo'
      ? `<a class="btn btn-ghost" href="${config.projects.refilo}" rel="noopener">${esc(it.link)} ${ICON.ne}</a>`
      : `<a class="btn btn-ghost" href="${href(p, ROUTES.contact[lang])}">${esc(it.link)} ${ICON.ne}</a>`;
    const visual = it.id === 'refilo' ? refiloUi(P.refiloUi) : tertoUi(P.tertoUi);
    return `
  <article class="project" id="${it.id}">
    <div class="project-body">
      <div class="project-head"><h2>${esc(it.name)}</h2><span class="stamp${it.statusType === 'mvp' ? ' stamp-mvp' : ''}">${esc(it.status)}</span></div>
      <p class="meta">${esc(it.meta)}</p>
      <p class="lead">${esc(it.summary)}</p>
      <p>${esc(it.story)}</p>
      <ul class="ticks">${it.ticks.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      ${it.extra ? `<p>${esc(it.extra)}</p>` : ''}
      <div class="actions">${link}</div>
    </div>
    <figure class="project-visual">${visual}<figcaption>${esc(P.caption)}</figcaption></figure>
  </article>`;
  }).join('');
  const main = `
${pageHead(lang, p, crumbs, P.label, P.h1, P.lede)}
<section>
  <div class="wrap">${items}
  </div>
</section>
${ctaBlock(lang, p)}`;
  return { page, html: layout(page, main) };
}

function renderAbout(lang) {
  const t = C[lang], A = t.aboutPage, p = ROUTES.about[lang];
  const page = { lang, path: p, section: 'about', title: A.title, description: A.description, alternates: ROUTES.about };
  const crumbs = [{ name: t.ui.home, path: ROUTES.home[lang] }, { name: A.h1, path: p }];
  page.jsonld = [
    ...orgGraph(),
    { '@type': 'AboutPage', '@id': abs(p) + '#webpage', url: abs(p), name: A.title, description: A.description, inLanguage: lang, isPartOf: { '@id': abs('/#website') }, about: { '@id': abs('/#organization') }, breadcrumb: { '@id': abs(p) + '#breadcrumb' } },
    breadcrumb(page, crumbs),
  ];
  // Pravni podatki s.p. niso izpisani na strani, ampak samo v pravnem obvestilu (ZEPT, 5. člen: dostop prek povezave).
  const facts = [
    ...A.facts,
    [lang === 'sl' ? 'Kontakt' : 'Contact', `<a href="mailto:${config.email}">${config.email}</a>`],
    [t.contactPage.companyTitle, `<a href="${href(p, ROUTES.imprint[lang])}">${esc(t.contactPage.companyLink)}</a>`],
  ];
  const main = `
${pageHead(lang, p, crumbs, A.label, A.h1, A.lede)}
<section class="section">
  <div class="wrap split">
    <div class="split-head"><h2>${esc(A.storyTitle)}</h2></div>
    <div class="stack">${A.story.map((x, i) => `<p${i === 0 ? ' class="lead"' : ''}>${esc(x)}</p>`).join('')}</div>
  </div>
</section>
<section class="section about-mission">
  <div class="wrap split">
    <div class="split-head"><h2>${esc(A.visionTitle)}</h2></div>
    <div class="stack"><p class="lead">${esc(A.visionText)}</p></div>
  </div>
  <div class="wrap split about-mission-secondary">
    <div class="split-head"><h2>${esc(A.missionTitle)}</h2></div>
    <div class="stack"><p>${esc(A.missionText)}</p></div>
  </div>
</section>
<section class="section section-alt">
  <div class="wrap split">
    <div class="split-head"><h2>${esc(A.principlesTitle)}</h2></div>
    <ol class="principles">${A.principles.map((x) => `<li><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></li>`).join('')}</ol>
  </div>
</section>
<section class="section ruled">
  <div class="wrap split">
    <div class="split-head"><h2>${esc(A.factsTitle)}</h2></div>
    <div class="index-card"><dl class="facts">${facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v.startsWith('<a') ? v : esc(v)}</dd>`).join('')}</dl></div>
  </div>
</section>
${ctaBlock(lang, p)}`;
  return { page, html: layout(page, main) };
}

function renderContact(lang) {
  const t = C[lang], K = t.contactPage, F = K.form, p = ROUTES.contact[lang];
  const page = { lang, path: p, section: 'contact', title: K.title, description: K.description, alternates: ROUTES.contact };
  const crumbs = [{ name: t.ui.home, path: ROUTES.home[lang] }, { name: t.ui.nav.contact, path: p }];
  page.jsonld = [
    ...orgGraph(),
    { '@type': 'ContactPage', '@id': abs(p) + '#webpage', url: abs(p), name: K.title, description: K.description, inLanguage: lang, isPartOf: { '@id': abs('/#website') }, about: { '@id': abs('/#organization') }, breadcrumb: { '@id': abs(p) + '#breadcrumb' } },
    breadcrumb(page, crumbs),
  ];
  const main = `
${pageHead(lang, p, crumbs, K.label, K.h1, K.lede)}
<section class="section">
  <div class="wrap contact-grid">
    <div class="form-card">
    <form id="contact-form" class="form"${PREVIEW ? '' : ' action="/api/contact" method="post"'} data-email="${config.email}" novalidate>
      <div class="form-row">
        <div class="form-field"><label for="f-name">${esc(F.name)}</label><input id="f-name" name="name" type="text" autocomplete="name" required maxlength="120"></div>
        <div class="form-field"><label for="f-company">${esc(F.company)} <span class="opt">${esc(F.optional)}</span></label><input id="f-company" name="company" type="text" autocomplete="organization" maxlength="160"></div>
      </div>
      <div class="form-row">
        <div class="form-field"><label for="f-email">${esc(F.email)}</label><input id="f-email" name="email" type="email" autocomplete="email" required maxlength="160"></div>
        <div class="form-field"><label for="f-phone">${esc(F.phone)} <span class="opt">${esc(F.optional)}</span></label><input id="f-phone" name="phone" type="tel" autocomplete="tel" maxlength="40"></div>
      </div>
      <div class="form-field"><label for="f-topic">${esc(F.topic)}</label>
        <select id="f-topic" name="topic">${F.topics.map((x) => `<option>${esc(x)}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label for="f-message">${esc(F.message)}</label>
        <textarea id="f-message" name="message" required maxlength="4000" aria-describedby="f-message-hint"></textarea>
        <span class="hint" id="f-message-hint">${esc(F.messageHint)}</span>
      </div>
      <div class="hp" aria-hidden="true"><label for="f-website">${esc(F.honeypot)}</label><input id="f-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>
      <input type="hidden" name="elapsed" value="">
      <label class="check"><input id="f-consent" name="consent" type="checkbox" value="yes" required><span>${esc(F.consentBefore)}<a href="${href(p, ROUTES.privacy[lang])}">${esc(F.consentLink)}</a>.</span></label>
      <div><button class="btn btn-primary" type="submit">${esc(F.submit)}</button></div>
      <p id="form-status" class="form-status" role="status" tabindex="-1" hidden></p>
    </form>
    </div>
    <aside class="contact-aside">
      <p class="sticky-note">${esc(K.reply)}</p>
      <div>
        <h2>${esc(K.emailTitle)}</h2>
        <p class="email-line"><a href="mailto:${config.email}">${config.email}</a><button class="copy-btn" type="button" data-copy="${config.email}">${esc(t.ui.copy)}</button></p>
      </div>
    </aside>
  </div>
</section>`;
  return { page, html: layout(page, main) };
}

function renderBlogIndex(lang, posts) {
  const t = C[lang], B = t.blogPage, p = ROUTES.blog[lang];
  const page = { lang, path: p, section: 'blog', title: B.title, description: B.description, alternates: ROUTES.blog };
  const crumbs = [{ name: t.ui.home, path: ROUTES.home[lang] }, { name: B.h1, path: p }];
  page.jsonld = [
    ...orgGraph(),
    { '@type': 'Blog', '@id': abs(p) + '#blog', url: abs(p), name: B.title, description: B.description, inLanguage: lang, publisher: { '@id': abs('/#organization') },
      blogPost: posts.map((x) => ({ '@type': 'BlogPosting', headline: x.title, url: abs(x.path), datePublished: x.date })) },
    breadcrumb(page, crumbs),
  ];
  const list = posts.map((x) => `
      <li class="post-item">
        <div>
          <h2><a href="${href(p, x.path)}">${esc(x.title)}</a></h2>
          <p>${esc(x.description)}</p>
          <a class="text-link" href="${href(p, x.path)}" aria-label="${esc(t.ui.readMore)}: ${esc(x.title)}">${esc(t.ui.readMore)} ${ICON.ne}</a>
        </div>
        <time datetime="${x.date}">${fmtDate(x.date, lang)} · ${x.minutes} ${t.ui.minRead}</time>
      </li>`).join('');
  const main = `
${pageHead(lang, p, crumbs, B.label, B.h1, B.lede)}
<section class="section">
  <div class="wrap">
    <ul class="posts">${list}
    </ul>
  </div>
</section>
${ctaBlock(lang, p)}`;
  return { page, html: layout(page, main) };
}

function renderPost(post) {
  const lang = post.lang, t = C[lang], B = t.blogPage, p = post.path;
  const alternates = post.alt ? (lang === 'sl' ? { sl: p, en: post.alt } : { sl: post.alt, en: p }) : null;
  const page = {
    lang, path: p, section: 'blog', title: `${post.title} | Doptiva`, ogTitle: post.title, description: post.description,
    alternates, type: 'article', og: post.og, article: { date: post.date, updated: post.updated },
  };
  const crumbs = [{ name: t.ui.home, path: ROUTES.home[lang] }, { name: B.h1, path: ROUTES.blog[lang] }, { name: post.title, path: p }];
  const { html } = md(post.body, p, { lead: true });
  page.jsonld = [
    ...orgGraph(),
    {
      '@type': 'BlogPosting', '@id': abs(p) + '#article', headline: post.title, description: post.description,
      datePublished: post.date, dateModified: post.updated, inLanguage: lang, url: abs(p),
      mainEntityOfPage: abs(p), image: abs(post.og),
      author: { '@type': 'Person', name: config.author[lang], url: abs(ROUTES.about[lang]) },
      publisher: { '@id': abs('/#organization') }, isPartOf: { '@id': abs(ROUTES.blog[lang]) + '#blog' },
    },
    breadcrumb(page, crumbs),
  ];
  const main = `
<article>
  <header class="article-head ruled">
    <div class="wrap narrow">
      ${breadcrumbsHtml(lang, p, crumbs.slice(0, 2).concat([{ name: post.title, path: p }]))}
      <div><span class="label">${esc(B.label)}</span></div>
      <h1>${esc(post.title)}</h1>
      <p class="post-meta"><span><time datetime="${post.date}">${fmtDate(post.date, lang)}</time></span><span>${post.minutes} ${t.ui.minRead}</span><span>${esc(config.author[lang])}</span></p>
    </div>
  </header>
  <div class="wrap narrow">
    <div class="prose">
${html}
      <div class="author-box"><strong>${esc(config.author[lang])}</strong>${esc(B.authorBio)}</div>
      <aside class="article-cta">
        <h2>${esc(B.ctaTitle)}</h2>
        <p>${esc(B.ctaText)}</p>
        <a class="btn btn-primary" href="${href(p, ROUTES.contact[lang])}">${esc(t.cta.button)} ${ICON.ne}</a>
      </aside>
      <p><a class="text-link" href="${href(p, ROUTES.blog[lang])}">${esc(t.ui.backToBlog)}</a></p>
    </div>
  </div>
</article>`;
  return { page, html: layout(page, main) };
}

function renderLegal(lang, kind) {
  const t = C[lang], p = ROUTES[kind][lang];
  const src = fs.readFileSync(path.join(ROOT, 'content/legal', lang, kind + '.md'), 'utf8');
  const { data, body } = parseFront(src);
  const L = config.legal;
  const vatText = L.vatRegistered ? (lang === 'sl' ? 'Zavezanec za DDV' : 'VAT registered') : (lang === 'sl' ? 'Ni zavezanec za DDV' : 'Not registered for VAT');
  const filled = fill(stripAnalytics(body), lang).replace(/\{\{vatText\}\}/g, vatText).replace(/\{\{register\}\}/g, lang === 'sl' ? L.register : L.registerEn);
  const { html } = md(filled, p);
  const page = { lang, path: p, section: null, title: `${data.title} | Doptiva`, description: data.description, alternates: ROUTES[kind] };
  const crumbs = [{ name: t.ui.home, path: ROUTES.home[lang] }, { name: data.title, path: p }];
  page.jsonld = [...orgGraph(), breadcrumb(page, crumbs)];
  const updated = `<p class="meta updated">${t.ui.updated}: <time datetime="${config.legalUpdated}">${fmtDate(config.legalUpdated, lang)}</time></p>`;
  const main = `
${pageHead(lang, p, crumbs, t.ui.legalLabel, data.title, '', updated)}
<div class="wrap narrow legal">
  <div class="prose">
${html}
  </div>
</div>`;
  return { page, html: layout(page, main) };
}

function render404() {
  const t = sl, N = sl.notFound, E = en.notFound, p = '/404.html';
  const page = { lang: 'sl', path: p, section: null, title: N.title, description: N.text, noindex: true };
  const main = `
<section class="wrap">
  <div class="notfound">
    <h1>${esc(N.h1)}</h1>
    <p class="hero-lede">${esc(N.text)}</p>
    <div class="actions"><a class="btn btn-primary" href="${href(p, '/')}">${esc(N.home)}</a><a class="btn btn-ghost" href="${href(p, ROUTES.contact.sl)}">${esc(N.contact)}</a></div>
    <p lang="en">${esc(E.h1)} <a href="${href(p, '/en/')}">${esc(E.home)}</a></p>
  </div>
</section>`;
  return { page, html: layout(page, main) };
}

// ---------- pisanje ----------
function write(rel, content) {
  let file = path.join(OUT, rel);
  if (rel.endsWith('/')) file = path.join(file, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    // HTML strani ustvari generator; morebitne stare .html datoteke v public/ se ne kopirajo.
    if (e.isDirectory()) copyDir(s, d); else if (!e.name.endsWith('.html')) fs.copyFileSync(s, d);
  }
}

async function build() {
  fs.rmSync(OUT, { recursive: true, force: true });
  copyDir(path.join(ROOT, 'public'), OUT);
  await cacheEditorialPhotos(OUT);

  // v predogledu pisave vgradimo v CSS (predogled ne nalaga ločenih datotek s pisavami)
  const cssPath = path.join(OUT, 'assets/css/site.css');
  if (PREVIEW) {
    let css = fs.readFileSync(cssPath, 'utf8');
    css = css.replace(/url\('\.\.\/fonts\/([^']+)'\)/g, (m, f) => {
      const b64 = fs.readFileSync(path.join(OUT, 'assets/fonts', f)).toString('base64');
      return `url(data:font/woff2;base64,${b64})`;
    });
    fs.writeFileSync(cssPath, css);
  }
  CSS_V = fileHash(cssPath);
  BRAND_V = fileHash(path.join(OUT, 'assets/css/brand-refresh.css'));
  JS_V = fileHash(path.join(OUT, 'assets/js/site.js'));

  const posts = loadPosts();
  const pages = [];
  const add = (r) => { pages.push(r.page); write(r.page.path, r.html); };

  for (const lang of LANGS) {
    add(renderHome(lang, posts[lang]));
    add(renderProjects(lang));
    add(renderAbout(lang));
    add(renderContact(lang));
    add(renderBlogIndex(lang, posts[lang]));
    for (const post of posts[lang]) add(renderPost(post));
    for (const kind of ['privacy', 'cookies', 'imprint']) add(renderLegal(lang, kind));
  }
  const nf = render404();
  write('404.html', nf.html);

  // sitemap.xml
  const today = new Date().toISOString().slice(0, 10);
  const urls = pages.filter((x) => !x.noindex).map((x) => {
    const lastmod = x.article ? x.article.updated : (config.siteUpdated || today);
    const alts = x.alternates && x.alternates.sl && x.alternates.en
      ? `\n    <xhtml:link rel="alternate" hreflang="sl" href="${abs(x.alternates.sl)}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${abs(x.alternates.en)}"/>\n    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(x.alternates.sl)}"/>`
      : '';
    return `  <url>\n    <loc>${abs(x.path)}</loc>\n    <lastmod>${lastmod}</lastmod>${alts}\n  </url>`;
  });
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`);

  // robots.txt — iskalniki in AI-asistenti so dobrodošli, /api/ ne
  const bots = ['*', 'Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot', 'Applebot-Extended', 'DuckAssistBot', 'MistralAI-User'];
  write('robots.txt', `# Doptiva — iskalniki in AI-asistenti so dobrodošli.\n\n${bots.map((b) => `User-agent: ${b}\nAllow: /\nDisallow: /api/\n`).join('\n')}\nSitemap: ${abs('/sitemap.xml')}\n`);

  // llms.txt — povzetek za jezikovne modele
  const lp = (lang, k) => abs(ROUTES[k][lang]);
  const llms = `# Doptiva

> Doptiva is a Slovenian company based in Ribnica that helps small and medium-sized businesses with consulting, digitalisation and automation of business processes, practical use of artificial intelligence, digital solution development and training. Doptiva je slovensko podjetje s sedežem v Ribnici, ki malim in srednjim podjetjem pomaga pri svetovanju, digitalizaciji in avtomatizaciji poslovnih procesov, smiselni uporabi umetne inteligence, razvoju digitalnih rešitev in izobraževanju.

Key facts:
- Founder: ${config.legal.owner}
- Location: Ribnica, Slovenia; works with clients across Slovenia remotely
- Languages: Slovenian, English
- Clients: small and medium-sized businesses, entrepreneurs; strong background in hospitality, tourism, field sales and multi-location businesses
- Approach: understanding first, technology second; no jargon; small steps with measurable results; larger development delivered with trusted partners
- Own products: Refilo (${config.projects.refilo}) — stock and supply ordering for multi-location businesses; Terto — digital order entry for field sales representatives (MVP)
- Contact: ${config.email}; enquiries answered within ${config.replyDays} working days

## Strani (slovenščina)
- [Rešitve](${lp('sl', 'home')}): storitve, potek sodelovanja, pogosta vprašanja
- [Projekti](${lp('sl', 'projects')}): Refilo in Terto
- [O nas](${lp('sl', 'about')}): ozadje, načela dela, osnovni podatki
- [Kontakt](${lp('sl', 'contact')}): povpraševanje
- [Blog](${lp('sl', 'blog')})

## Pages (English)
- [Solutions](${lp('en', 'home')}): services, how we work, FAQ
- [Projects](${lp('en', 'projects')}): Refilo and Terto
- [About](${lp('en', 'about')}): background, principles, key facts
- [Contact](${lp('en', 'contact')}): enquiries
- [Blog](${lp('en', 'blog')})

## Blog
${[...posts.sl, ...posts.en].map((x) => `- [${x.title}](${abs(x.path)}): ${x.description}`).join('\n')}

## Optional
- [Privacy policy](${lp('en', 'privacy')})
- [Legal notice](${lp('en', 'imprint')})
`;
  write('llms.txt', llms);

  // RSS
  for (const lang of LANGS) {
    const B = C[lang].blogPage;
    const items = posts[lang].map((x) => `    <item>\n      <title>${esc(x.title)}</title>\n      <link>${abs(x.path)}</link>\n      <guid isPermaLink="true">${abs(x.path)}</guid>\n      <pubDate>${new Date(x.date + 'T08:00:00Z').toUTCString()}</pubDate>\n      <description>${esc(x.description)}</description>\n    </item>`).join('\n');
    const rssPath = lang === 'sl' ? '/blog/rss.xml' : '/en/blog/rss.xml';
    write(rssPath, `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>${esc(B.title)}</title>\n    <link>${abs(ROUTES.blog[lang])}</link>\n    <description>${esc(B.description)}</description>\n    <language>${lang === 'sl' ? 'sl-SI' : 'en'}</language>\n    <atom:link href="${abs(rssPath)}" rel="self" type="application/rss+xml"/>\n${items}\n  </channel>\n</rss>\n`);
  }

  // manifest, security.txt
  write('site.webmanifest', JSON.stringify({
    name: 'Doptiva', short_name: 'Doptiva', lang: 'sl', start_url: '/', display: 'browser',
    background_color: '#F4F6F3', theme_color: '#0B5444',
    icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }, { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }, null, 2));
  const exp = new Date(); exp.setFullYear(exp.getFullYear() + 1);
  write('.well-known/security.txt', `Contact: mailto:${config.email}\nExpires: ${exp.toISOString()}\nPreferred-Languages: sl, en\nCanonical: ${abs('/.well-known/security.txt')}\n`);

  // naloge za OG-slike (scripts/og.mjs)
  const jobs = [
    { file: 'og-sl.png', title: sl.home.h1, kicker: sl.home.kicker },
    { file: 'og-en.png', title: en.home.h1, kicker: en.home.kicker },
    ...[...posts.sl, ...posts.en].map((x) => ({ file: `post-${x.slug}.png`, title: x.title, kicker: 'Blog' })),
  ];
  fs.writeFileSync(path.join(ROOT, 'scripts/og-jobs.json'), JSON.stringify(jobs, null, 2));

  console.log(`Zgrajeno: ${pages.length + 1} strani -> ${path.relative(ROOT, OUT)}`);
}

build().catch((error) => { console.error(error); process.exitCode = 1; });
