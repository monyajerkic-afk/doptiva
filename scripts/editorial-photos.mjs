// Doptiva: fotografije za uredniške poudarke. Vir: Unsplash (unsplash.com/license).
// Vercel pred objavo prekopira slike v /assets/img/editorial/, tako brskalnik
// ne potrebuje neposredne povezave do Unsplasha.
// Ob začasni nedostopnosti vira ostane CSS rezervna možnost.
import fs from 'node:fs';
import path from 'node:path';

const PHOTOS = [
  // Six real-life images for the challenges slider in Design V4.
  // Each photograph is marked "Free to use under the Unsplash License".
  {
    name: 'challenge-orders.jpg',
    url: 'https://images.unsplash.com/photo-1721937127582-ed331de95a04?auto=format&fit=crop&w=1100&h=720&q=76',
  },
  {
    name: 'challenge-spreadsheets.jpg',
    url: 'https://images.unsplash.com/photo-1759752393975-7ca7b302fcc6?auto=format&fit=crop&w=1100&h=720&q=76',
  },
  {
    name: 'challenge-field.jpg',
    url: 'https://images.unsplash.com/photo-1764795850513-fa8a469a4600?auto=format&fit=crop&w=1100&h=720&q=76',
  },
  {
    name: 'challenge-paperwork.jpg',
    url: 'https://images.unsplash.com/photo-1743796055651-41c743ff2465?auto=format&fit=crop&w=1100&h=720&q=76',
  },
  {
    name: 'challenge-training.jpg',
    url: 'https://images.unsplash.com/photo-1579389083046-e3df9c2b3325?auto=format&fit=crop&w=1100&h=720&q=76',
  },
  {
    name: 'challenge-ai.jpg',
    url: 'https://images.unsplash.com/photo-1588750099599-09efbe4377ad?auto=format&fit=crop&w=1100&h=720&q=76',
  },
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
    // Podoben motiv tretji uporabničini referenci: sodelavki ob analitiki.
    // PikWizard: brezplačna komercialna uporaba. Vir in pogoji:
    // https://pikwizard.com/photo/two-businesswomen-collaborating-at-open-plan-office-with-digital-hud-data-analytics-overlay/830911fc68f57018f361c27e36d0fb89/
    name: 'human-centered-dashboard.jpg',
    // Najprej prvotno izbran vizual; če ponudnik blokira gradnjo, uporabi
    // prosto licencirano fotografijo dveh sodelavk ob računalniku (Unsplash).
    url: 'https://pikwizard.com/pw/medium/830911fc68f57018f361c27e36d0fb89.jpg',
    fallbackUrl: 'https://images.unsplash.com/photo-1543269865-0a740d43b90c?auto=format&fit=crop&w=1600&q=79',
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
  await Promise.all(PHOTOS.map(async ({ name, url, fallbackUrl }) => {
    for (const candidate of [url, fallbackUrl].filter(Boolean)) {
      try {
        const response = await fetch(candidate, { signal: AbortSignal.timeout(9000) });
        if (!response.ok || !(response.headers.get('content-type') || '').startsWith('image/')) {
          throw new Error(`unexpected photo response: ${response.status}`);
        }
        const buf = Buffer.from(await response.arrayBuffer());
        if (buf.length < 8000 || buf.length > 6_000_000) throw new Error('unexpected image size');
        fs.writeFileSync(path.join(target, name), buf);
        console.log(`Editorial photo cached: ${name} (${buf.length} bytes)`);
        return;
      } catch (err) {
        console.warn(`Could not cache ${name} from ${new URL(candidate).host}: ${err.message}`);
      }
    }
    // CSS ponudi še lokalno abstraktno ilustracijo; razdelek ne sme ostati prazen.
    console.warn(`No source image for ${name}; local fallback stays visible.`);
  }));
}
