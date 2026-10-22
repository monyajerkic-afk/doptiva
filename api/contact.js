// Vercel funkcija: sprejme povpraševanje z obrazca in ga prek Resend pošlje na tvoj e-naslov.
// Potrebne spremenljivke okolja (Vercel > Project > Settings > Environment Variables):
//   RESEND_API_KEY  ključ iz resend.com
//   CONTACT_TO      kam naj pridejo povpraševanja, npr. info@doptiva.com
//   CONTACT_FROM    pošiljatelj na preverjeni domeni, npr. "Doptiva obrazec <obrazec@doptiva.com>"

const MAX = { name: 120, company: 160, email: 160, phone: 40, topic: 120, message: 4000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 20000) req.destroy(); });
    req.on('end', () => {
      const type = req.headers['content-type'] || '';
      try {
        if (type.includes('application/json')) return resolve(JSON.parse(raw || '{}'));
        return resolve(Object.fromEntries(new URLSearchParams(raw)));
      } catch { return resolve({}); }
    });
  });
}

const clean = (v, max) => String(v || '').replace(/\r/g, '').trim().slice(0, max);
const escHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  // Sprejmi samo zahteve z lastne domene.
  const origin = req.headers.origin || '';
  const host = req.headers.host || '';
  if (origin && !origin.endsWith('://' + host)) return res.status(403).json({ ok: false });

  const b = await readBody(req);
  const isForm = !(req.headers['content-type'] || '').includes('application/json');

  // Zaščita pred neželeno pošto: skrito polje in prehitro oddan obrazec.
  const started = Number(b.started || 0);
  if (b.website || (started && Date.now() - started < 3000)) {
    return isForm ? res.redirect(303, b.lang === 'en' ? '/en/contact/?sent=1' : '/kontakt/?poslano=1') : res.status(200).json({ ok: true });
  }

  const data = {
    name: clean(b.name, MAX.name),
    company: clean(b.company, MAX.company),
    email: clean(b.email, MAX.email),
    phone: clean(b.phone, MAX.phone),
    topic: clean(b.topic, MAX.topic),
    message: clean(b.message, MAX.message),
    consent: b.consent === 'yes' || b.consent === true || b.consent === 'on',
    lang: b.lang === 'en' ? 'en' : 'sl',
  };
  if (!data.name || !EMAIL_RE.test(data.email) || data.message.length < 5 || !data.consent) {
    return res.status(422).json({ ok: false, error: 'invalid' });
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  const from = process.env.CONTACT_FROM;
  if (!key || !to || !from) return res.status(500).json({ ok: false, error: 'not_configured' });

  const lines = [
    `Ime: ${data.name}`,
    `Podjetje: ${data.company || '-'}`,
    `E-pošta: ${data.email}`,
    `Telefon: ${data.phone || '-'}`,
    `Zanima ga/jo: ${data.topic || '-'}`,
    `Jezik strani: ${data.lang}`,
    '',
    data.message,
    '',
    '---',
    `Privolitev v obdelavo podatkov: da (${new Date().toISOString()})`,
  ];

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: data.email,
      subject: `Novo povpraševanje: ${data.name}${data.company ? ' (' + data.company + ')' : ''}`,
      text: lines.join('\n'),
      html: `<pre style="font:14px/1.5 system-ui,sans-serif;white-space:pre-wrap">${escHtml(lines.join('\n'))}</pre>`,
    }),
  });

  if (!r.ok) return res.status(502).json({ ok: false, error: 'send_failed' });
  if (isForm) return res.redirect(303, data.lang === 'en' ? '/en/contact/?sent=1' : '/kontakt/?poslano=1');
  return res.status(200).json({ ok: true });
}
