// Ustvari slike za deljenje (Open Graph, 1200x630) iz scripts/og-jobs.json.
// Zaženi po `node build.mjs`:  node scripts/og.mjs
// Potrebuje razvojno odvisnost playwright (npm install).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const jobs = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/og-jobs.json'), 'utf8'));
const outDir = path.join(ROOT, 'public/assets/og');
fs.mkdirSync(outDir, { recursive: true });

const font = (f) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(ROOT, 'public/assets/fonts', f)).toString('base64');
const logo = fs.readFileSync(path.join(ROOT, 'src/logo.svg'), 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const html = (j) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: M; src: url(${font('montserrat-latin.woff2')}) format('woff2'); font-weight: 100 900; }
@font-face { font-family: N; src: url(${font('newsreader-display.woff2')}) format('woff2'); font-weight: 300 600; }
@font-face { font-family: N; src: url(${font('newsreader-display-slo.woff2')}) format('woff2'); font-weight: 300 600; unicode-range: U+0106-0107, U+010C-010D, U+0110-0111, U+0160-0161, U+017D-017E; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; font-family: M, sans-serif; color: #16324B; position: relative; overflow: hidden;
  background: #F2F0E8 repeating-linear-gradient(to bottom, transparent 0, transparent 41px, rgba(22,50,75,.09) 41px, rgba(22,50,75,.09) 42px); }
.margin { position: absolute; top: 0; bottom: 0; left: 930px; width: 2px; background: #C0552F; }
.logo { position: absolute; left: 80px; top: 64px; height: 44px; color: #16324B; }
.logo svg { height: 44px; width: auto; display: block; }
.logo .logo-o { fill: #159676; }
.label { position: absolute; left: 80px; top: 178px; font-size: 18px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; background: #A6F2D5; color: #0D3A2E; padding: 6px 12px 5px; }
h1 { position: absolute; left: 80px; top: 236px; width: 800px; font-family: N, serif; font-weight: 450; font-size: ${'${size}'}px; line-height: 1.02; letter-spacing: -0.03em; }
.url { position: absolute; left: 80px; bottom: 56px; font-size: 20px; color: #5E6763; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.note { position: absolute; left: 975px; top: 120px; width: 170px; height: 150px; background: #A6F2D5; transform: rotate(4deg); box-shadow: 6px 6px 0 #16324B; }
.note::after { content: ""; position: absolute; left: 30px; right: 30px; top: 48px; height: 2px; background: rgba(13,58,46,.35); box-shadow: 0 26px 0 rgba(13,58,46,.35), 0 52px 0 rgba(13,58,46,.35); }
</style></head><body>
<div class="margin"></div>
<div class="note"></div>
<div class="logo">${logo}</div>
<p class="label">${esc(j.kicker)}</p>
<h1>${esc(j.title)}</h1>
<p class="url">doptiva.com</p>
</body></html>`;

const exe = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell') ? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' : undefined);
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const j of jobs) {
  const size = j.title.length > 60 ? 60 : j.title.length > 40 ? 68 : 78;
  await page.setContent(html(j).replace('${size}', String(size)));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(outDir, j.file), type: 'png' });
  console.log('OG:', j.file);
}
await browser.close();
