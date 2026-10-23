// Doptiva: fotografije za uredniške poudarke. Vir: Unsplash (unsplash.com/license).
// Vercel pred objavo prekopira slike v /assets/img/editorial/, tako brskalnik
// ne potrebuje neposredne povezave do Unsplasha.
// Ob začasni nedostopnosti vira ostane CSS rezervna možnost.
import fs from 'node:fs';
import path from 'node:path';

const PHOTOS = [
  {
    name: 'glass-corridor.jpg',
    url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=78',
  },
  {
    // Elina Mladenova — "Shadows of people are seen behind frosted glass."
    // Free Unsplash License: https://unsplash.com/photos/3sBUjgYjbug
    name: 'frosted-people.jpg',
    url: 'https://images.unsplash.com/photo-1739733901481-a467cfb0076f?auto=format&fit=crop&w=2000&q=79',
  },
  {
    // Vitaly Gariev — "Two businessmen in suits talking in a modern office."
    // Free Unsplash License: https://unsplash.com/photos/hqFPR1b2koc
    name: 'collaboration.jpg',
    url: 'https://images.unsplash.com/photo-1758519288355-7e8d0729bdf1?auto=format&fit=crop&w=1800&q=78',
  },
];

export async function cacheEditorialPhotos(out) {
  const target = path.join(out, 'assets', 'img', 'editorial');
  fs.mkdirSync(target, { recursive: true });
  await Promise.all(PHOTOS.map(async ({ name, url }) => {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(14000) });
      if (!response.ok || !(response.headers.get('content-type') || '').startsWith('image/')) {
        throw new Error(`unexpected photo response: ${response.status}`);
      }
      const buf = Buffer.from(await response.arrayBuffer());
      if (buf.length < 8000 || buf.length > 6_000_000) throw new Error('unexpected image size');
      fs.writeFileSync(path.join(target, name), buf);
      console.log(`Editorial photo cached: ${name} (${buf.length} bytes)`);
    } catch (err) {
      console.warn(`Could not cache ${name}: ${err.message}. Photo will need recheck before release.`);
    }
  }));
}
