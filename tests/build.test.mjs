// Preverjanje zgrajene strani: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

execFileSync(process.execPath, ['build.mjs'], { stdio: 'ignore' });
const root = path.resolve('dist');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(root);
const pages = files.filter((f) => f.endsWith('.html'));

test('ustvari vse strani v obeh jezikih', () => {
  assert.equal(pages.length, 23);
  for (const p of ['index.html', 'en/index.html', 'projekti/index.html', 'en/projects/index.html', 'kontakt/index.html', 'blog/index.html', 'pravno/zasebnost/index.html', '404.html']) {
    assert.ok(fs.existsSync(path.join(root, p)), p);
  }
});

test('notranje povezave, slike in sidra obstajajo', () => {
  const ids = new Map(pages.map((f) => [f, new Set([...fs.readFileSync(f, 'utf8').matchAll(/ id="([^"]+)"/g)].map((m) => m[1]))]));
  for (const f of pages) {
    const html = fs.readFileSync(f, 'utf8');
    for (const [, u] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|mailto:|tel:|data:)/.test(u) || u.startsWith('/api/') || u.startsWith('/_vercel/')) continue;
      const [p, hash] = u.split('#');
      let target = p === '' ? f : path.join(root, p.split('?')[0]);
      if (p.endsWith('/')) target = path.join(target, 'index.html');
      assert.ok(fs.existsSync(target), `${path.relative(root, f)}: manjka ${u}`);
      if (hash && target.endsWith('.html')) assert.ok(ids.get(target)?.has(hash), `${path.relative(root, f)}: ni sidra ${u}`);
    }
  }
});

test('vsaka stran ima SEO osnove in veljavne strukturirane podatke', () => {
  for (const f of pages) {
    const html = fs.readFileSync(f, 'utf8');
    const rel = path.relative(root, f);
    assert.match(html, /<title>[^<]{10,}<\/title>/, rel);
    assert.match(html, /<meta name="description" content="[^"]{50,}"/, rel);
    assert.doesNotMatch(html, /data-preview/, `${rel}: ostanek predogleda`);
    if (rel !== '404.html') {
      assert.match(html, /<link rel="canonical" href="https:\/\/doptiva\.com\//, rel);
      assert.match(html, /hreflang="en"/, rel);
    }
    for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(json);
  }
});

test('sitemap, robots, llms.txt, RSS in manifest', () => {
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  assert.equal((sitemap.match(/<url>/g) || []).length, 22);
  assert.match(fs.readFileSync(path.join(root, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/doptiva\.com\/sitemap\.xml/);
  assert.match(fs.readFileSync(path.join(root, 'llms.txt'), 'utf8'), /^# Doptiva/);
  for (const r of ['blog/rss.xml', 'en/blog/rss.xml']) assert.equal((fs.readFileSync(path.join(root, r), 'utf8').match(/<item>/g) || []).length, 3);
  JSON.parse(fs.readFileSync(path.join(root, 'site.webmanifest'), 'utf8'));
});
