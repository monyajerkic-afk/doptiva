# doptiva.com

Spletna stran Doptive. Statična, dvojezična (slovenščina na `/`, angleščina na `/en/`), brez ogrodja in brez zunanjih odvisnosti v produkciji. Gradi se z enim ukazom, gosti na Vercelu.

## Kaj je v mapi

| Pot | Vsebina |
| --- | --- |
| `site.config.mjs` | e-naslov, pravni podatki, avtor člankov, analitika |
| `content/sl.mjs`, `content/en.mjs` | vsa besedila strani |
| `content/blog/sl/*.md`, `content/blog/en/*.md` | članki |
| `content/legal/` | politika zasebnosti, piškotki, pravno obvestilo |
| `public/` | slike, pisave, CSS, JS, ikone (kopira se v `dist/`) |
| `api/contact.js` | funkcija, ki povpraševanje pošlje na tvoj e-naslov (Resend) |
| `build.mjs` | generator strani |
| `vercel.json` | nastavitve gostovanja in varnostne glave |
| `docs/` | navodila za zagon, DNS, SEO in fotografije |

## Ukazi

```bash
node build.mjs            # zgradi stran v dist/
node build.mjs --preview  # predogled z relativnimi povezavami v preview/site/
npm install --no-save playwright@1.48.2 && node scripts/og.mjs   # ponovno ustvari slike za deljenje (po novem članku)
```

Potrebuješ Node.js 24 (enako kot Vercel). `npm test` zgradi stran in preveri povezave, SEO glave, sitemap in strukturirane podatke.

## Pred objavo izpolni

V `site.config.mjs` zamenjaj vse vrednosti v [oglatih oklepajih]:

- polno ime s.p. kot v AJPES, ulica, matična in davčna številka,
- preveri e-naslov (`info@doptiva.com`) in ime avtorice člankov.

Ti podatki niso izpisani v nogi ali na kontaktni strani. Prikazani so samo v pravnem obvestilu (`/pravno/pravno-obvestilo/`) in kot upravljavec v politiki zasebnosti. Do pravnega obvestila vodi povezava v nogi vsake strani in v osnovnih podatkih na strani O nas, kar zadošča 5. členu ZEPT (dostop prek povezave z domače strani).

## Objava na Vercelu

Repozitorij je povezan z Vercelom (projekt `doptiva`). Vercel ob vsaki spremembi na veji `main` zažene `npm run build` in objavi mapo `dist`. Vsaka druga veja dobi svoj predogledni naslov.

Da bo kontaktni obrazec pošiljal povpraševanja, v Vercelu (**Settings → Environment Variables**) dodaj:

- `RESEND_API_KEY`: ključ iz resend.com
- `CONTACT_TO`: kam pridejo povpraševanja, npr. `info@doptiva.com`
- `CONTACT_FROM`: `Doptiva obrazec <obrazec@doptiva.com>` (domena doptiva.com je potrjena v Resendu)
- `ANALYTICS=1`: samo če vklopiš Vercel Web Analytics

Dokler spremenljivk ni, obrazec obiskovalcu pokaže e-naslov za neposreden stik. Po nastavitvi pošlji testno povpraševanje. Navodila za DNS, e-pošto in iskalnike so v `docs/ZAGON-SEO-DNS.md`.

## Fotografije

Drsnik ima zdaj nadomestne ilustracije. Ko dodaš fotografijo z istim imenom in končnico `.webp` ali `.jpg` v `public/assets/img/slides/`, jo generator uporabi namesto ilustracije. Navodila in predlogi so v `docs/FOTOGRAFIJE.md`.

## Nov članek

1. Ustvari `content/blog/sl/ime-clanka.md` (in po želji angleški prevod v `content/blog/en/`).
2. Na vrh dodaj:
   ```
   ---
   title: Naslov članka
   description: Opis za Google, do 155 znakov.
   date: 2026-11-04
   key: kratek-kljuc
   ---
   ```
   Isti `key` v obeh jezikih poveže prevoda.
3. Zaženi `node build.mjs` in `node scripts/og.mjs`. Članek se samodejno doda v blog, sitemap, RSS in llms.txt.

## Kaj stran že ima

- ločene strani in naslovi za vsak jezik, `hreflang`, kanonični URL-ji, sitemap.xml, robots.txt, RSS
- strukturirani podatki (organizacija, storitve, pogosta vprašanja, članki, drobtinice, produkta)
- `llms.txt` in dovoljen dostop AI-iskalnikom (ChatGPT, Claude, Perplexity, Google AI) za vidnost v AI-odgovorih
- slike za deljenje na družbenih omrežjih za vsako stran in članek
- pisave gostovane na lastnem strežniku (ni prenosa IP-naslova Googlu), brez piškotkov za sledenje, zato ni potrebna pasica za privolitev
- svetla in temna tema, prilagojeno za telefone; Lighthouse: 100 za dostopnost, dobre prakse in SEO, 95 za hitrost (lokalno, brez stiskanja)
- varnostne glave (HSTS, CSP, X-Frame-Options), `/.well-known/security.txt`
- kontaktni obrazec z zaščito pred neželeno pošto (skrito polje, časovna zaščita)
