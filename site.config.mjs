// Osnovne nastavitve strani. Vse, kar je v [oglatih oklepajih], zamenjaj s pravimi podatki.
export default {
  url: 'https://doptiva.com',
  name: 'Doptiva',
  email: 'info@doptiva.com',
  replyDays: 2, // v koliko delovnih dneh odgovoriš na povpraševanje

  // Pravni podatki (Zakon o elektronskem poslovanju na trgu zahteva te podatke na spletni strani).
  legal: {
    company: '[Polno ime s.p. kot v AJPES]',
    owner: 'Monja Jerkič',
    street: '[Ulica in hišna številka]',
    postal: '1310',
    city: 'Ribnica',
    country: 'Slovenija',
    countryEn: 'Slovenia',
    registrationNo: '[matična številka]',
    taxNo: '[davčna številka]',
    vatRegistered: false,
    register: 'Poslovni register Slovenije (AJPES)',
    registerEn: 'Slovenian Business Register (AJPES)',
    // Kje imaš e-poštni predal (navedeno v politiki zasebnosti med obdelovalci).
    mailProvider: 'Google Workspace (Google Ireland Ltd.)',
    mailProviderLocation: 'EU in ZDA; standardne pogodbene klavzule Evropske komisije',
    mailProviderLocationEn: 'EU and USA; European Commission standard contractual clauses',
  },

  // Avtor člankov. Če ne želiš objaviti imena, napiši 'Ekipa Doptiva' / 'Doptiva team'.
  author: { sl: 'Monja Jerkič', en: 'Monja Jerkič' },

  social: {
    linkedin: 'https://www.linkedin.com/in/monya-jerkic-114999230/',
  },

  projects: {
    refilo: 'https://refilo.app',
  },

  // Vercel Web Analytics (brez piškotkov). Vklopi v Vercelu in nastavi spremenljivko ANALYTICS=1.
  analytics: process.env.ANALYTICS === '1',

  // Datum zadnje posodobitve pravnih besedil.
  legalUpdated: '2026-10-21',
  // Datum zadnje vsebinske posodobitve strani (za sitemap.xml).
  siteUpdated: '2026-10-21',
};
