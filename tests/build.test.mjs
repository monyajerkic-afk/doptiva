import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

async function walk(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    result.push(...(entry.isDirectory() ? await walk(path) : [path]));
  }
  return result;
}
test('all built pages have resolvable local navigation and assets', async () => {
  const root = resolve('dist');
  const pages = (await walk(root)).filter(file => file.endsWith('.html'));
  assert.equal(pages.length, 24);
  for (const page of pages) {
    const html = await readFile(page, 'utf8');
    for (const [, value] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value)) continue;
      const path = decodeURIComponent(value.split(/[?#]/)[0]);
      if (!path) continue;
      const target = path.startsWith('/') ? resolve(root, `.${path}`) : resolve(dirname(page), path);
      assert.ok(target.startsWith(root + '/') || target === root, `${page}: ${value} escapes output`);
      await assert.doesNotReject(access(target), `${page}: missing ${value}`);
    }
  }
});
test('preserves original styling, scripts and explicit contact preview behavior', async () => {
  for (const file of ['assets/css/site.css', 'assets/js/site.js', 'assets/js/theme-init.js']) {
    assert.deepEqual(await readFile(`dist/${file}`), await readFile(`public/${file}`));
  }
  for (const file of ['kontakt/index.html', 'en/contact/index.html']) {
    assert.match(await readFile(`dist/${file}`, 'utf8'), /data-preview/);
  }
  const manifest = JSON.parse(await readFile('dist/site.webmanifest', 'utf8'));
  assert.equal(manifest.icons.length, 2);
  for (const file of ['blog/rss.xml', 'en/blog/rss.xml']) {
    assert.equal((await readFile(`dist/${file}`, 'utf8')).match(/<item>/g).length, 3);
  }
});
