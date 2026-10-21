import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// The ZIP contains a complete static site, not a framework application.
await rm('dist', { recursive: true, force: true });
await cp('public', 'dist', { recursive: true });
async function walk(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    result.push(...(entry.isDirectory() ? await walk(path) : [path]));
  }
  return result;
}
const files = await walk('dist');
for (const file of files.filter(file => file.endsWith('.html'))) {
  let html = await readFile(file, 'utf8');
  // The archive references an ICO and social images it does not include.
  // Keep its supplied SVG favicon and use its actual brand image for sharing.
  html = html.replace(/<link\b[^>]*href="[^"]*favicon\.ico"[^>]*>\s*/g, '')
    .replaceAll('https://doptiva.com/assets/og/og-sl.png', 'https://doptiva.com/assets/brand/doptiva-logo.png')
    .replaceAll('https://doptiva.com/assets/og/og-en.png', 'https://doptiva.com/assets/brand/doptiva-logo.png')
    .replace(/<meta property="og:image:(?:width|height)"[^>]*>\s*/g, '');
  await writeFile(file, html);
}
await writeFile('dist/site.webmanifest', JSON.stringify({
  name: 'Doptiva', short_name: 'Doptiva', lang: 'sl', start_url: '/',
  display: 'browser', background_color: '#F4F6F3', theme_color: '#F4F6F3',
  icons: [192, 512].map(size => ({ src: `/icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png' }))
}, null, 2));
const xml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
for (const [directory, language] of [['blog', 'sl'], ['en/blog', 'en']]) {
  const items = [];
  for (const file of files.filter(file => file.startsWith(`dist/${directory}/`) && file.endsWith('/index.html') && file !== `dist/${directory}/index.html`)) {
    const html = await readFile(file, 'utf8');
    const title = html.match(/<title>(.*?)<\/title>/s)?.[1] || 'Doptiva';
    const url = `https://doptiva.com/${file.slice(5).replace(/index\.html$/, '')}`;
    items.push(`<item><title>${xml(title)}</title><link>${xml(url)}</link><guid>${xml(url)}</guid></item>`);
  }
  await mkdir(`dist/${directory}`, { recursive: true });
  await writeFile(`dist/${directory}/rss.xml`, `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Doptiva blog</title><link>https://doptiva.com/${directory}/</link><description>Doptiva blog</description><language>${language}</language>${items.join('')}</channel></rss>`);
}
console.log(`Built ${files.filter(file => file.endsWith('.html')).length} HTML pages and all supplied assets into dist/.`);
