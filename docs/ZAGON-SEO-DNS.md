# Zagon doptiva.com: DNS, e-pošta, iskalniki in povezave

Vrstni red je pomemben. Vsak korak je kratek, skupaj jih je za eno do dve popoldnevi.

## 1. Domena in DNS za spletno stran

V Vercelu (**Project → Settings → Domains**) dodaj `doptiva.com` in `www.doptiva.com`. Vercel prikaže točne vrednosti za tvoj projekt. Te vrednosti so merodajne, spodnje so le primer.

| Tip | Ime | Vrednost | Opomba |
| --- | --- | --- | --- |
| A | `@` | vrednost s kartice domene v Vercelu (pogosto `76.76.21.21`, pri novejših projektih lahko drugačna) | izbriši morebitne stare A in AAAA zapise za `@` |
| CNAME | `www` | cilj s kartice domene, npr. `xxxx.vercel-dns-017.com` | |
| CAA | `@` | `0 issue "letsencrypt.org"` | Vercel izdaja certifikate prek Let's Encrypt |

Nato v Vercelu nastavi eno domeno kot glavno, drugo pa preusmeri nanjo. Stran je pripravljena za `https://doptiva.com` (brez www). Če izbereš www, spremeni `url` v `site.config.mjs`.

Pri registrarju vklopi **DNSSEC**, če ga ponuja.

## 2. E-pošta na lastni domeni

Za `info@doptiva.com` potrebuješ ponudnika e-poštnega predala (npr. Google Workspace, Microsoft 365, Zoho ali predal pri registrarju). Ponudnik ti da točne zapise.

| Tip | Ime | Vrednost | Namen |
| --- | --- | --- | --- |
| MX | `@` | strežniki ponudnika predala | prejemanje pošte |
| TXT | `@` | `v=spf1 include:<ponudnik> ~all` | SPF: kdo sme pošiljati v imenu domene |
| TXT | `<selektor>._domainkey` | ključ ponudnika | DKIM: podpis sporočil |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:info@doptiva.com` | DMARC: najprej samo opazovanje |

Na domeni je lahko samo **en** SPF zapis za `@`. Po dveh do štirih tednih brez težav spremeni DMARC na `p=quarantine`.

## 3. Pošiljanje obrazca (Resend)

1. Na resend.com dodaj domeno `doptiva.com`. Za regijo izberi **EU (Irska)**, da pošiljanje poteka v EU.
2. Resend prikaže zapise. Vneseš samo ime gostitelja (npr. `send`), ne celotne domene:

| Tip | Ime | Vrednost |
| --- | --- | --- |
| MX | `send` | vrednost iz Resenda, prioriteta 10 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` (preveri v Resendu) |
| TXT | `resend._domainkey` | ključ iz Resenda (začne se s `p=`) |

Ti zapisi so na poddomeni `send`, zato ne motijo SPF zapisa tvojega predala.

3. Ustvari API-ključ in ga vnesi v Vercel kot `RESEND_API_KEY`. Dodaj še `CONTACT_TO` in `CONTACT_FROM` (glej README).
4. Pošlji testno povpraševanje s strani.

## 4. Iskalniki

**Google Search Console**
1. Dodaj lastnost tipa **Domena** (`doptiva.com`) in jo potrdi s TXT zapisom v DNS.
2. V **Zemljevidi spletnih mest** oddaj `https://doptiva.com/sitemap.xml`.
3. Z orodjem **Pregled URL-ja** zahtevaj indeksiranje glavne strani in vseh treh člankov.

**Bing Webmaster Tools**
Prijavi se in uvozi lastnost iz Search Console (en klik). Bing je pomemben tudi za AI-odgovore, ker iz njegovega indeksa črpajo nekateri AI-asistenti.

**Google Business Profile**
Ustvari profil kot podjetje s **področjem storitev** (Slovenija) in skrij naslov, če ne sprejemaš strank na sedežu. Kategorija npr. »Svetovalec za poslovno upravljanje«. Uporabi enak opis in e-naslov kot na strani.

## 5. Optimizacija za AI-iskalnike (že narejeno in kaj sledi)

Na strani je že:

- `llms.txt` s povzetkom podjetja in povezavami,
- `robots.txt`, ki izrecno dovoli dostop AI-iskalnikom (ChatGPT, Claude, Perplexity, Google, Apple),
- strukturirani podatki o podjetju, storitvah, pogostih vprašanjih in člankih,
- članki z razdelkom »Kratek odgovor« in navedenimi viri, kar AI-odgovori najraje citirajo.

Kar pomaga naprej:

- **Enak opis povsod.** Isto ime, isti stavek o tem, kaj Doptiva dela, isti e-naslov na strani, v Google profilu, na Bizi.si, LinkedInu in v podpisu e-pošte.
- **Omembe drugje.** AI-asistenti se zanašajo na to, kar o podjetju pišejo drugi viri. Vsak vpis v imenik in vsak gostujoči članek šteje.
- **Reden članek.** En do dva na mesec, vsak odgovori na eno konkretno vprašanje lastnikov malih podjetij.

## 6. Povratne povezave (backlinki)

Brez plačljivih povezav in »paketov backlinkov«, ker jih Google kaznuje. Začni z naslednjim, po vrsti od najlažjega:

1. **Refilo → Doptiva.** V nogo refilo.app dodaj »Refilo je produkt podjetja Doptiva« s povezavo na doptiva.com. Lastna, tematsko povezana povezava.
2. **Bizi.si.** Osnovni vpis podjetja je brezplačen. Dopolni opis in dodaj povezavo na stran.
3. **Google Business Profile, Bing Places, Apple Business Connect.**
4. **LinkedIn stran podjetja Doptiva** s povezavo na doptiva.com.
5. **Območna obrtno-podjetniška zbornica Ribnica in regionalna razvojna agencija.** Če si članica ali sodeluješ v njihovih programih, prosi za vpis v seznam članov ali ponudnikov.
6. **Imeniki agencij** (npr. Clutch, GoodFirms). Brezplačen profil z opisom storitev.
7. **Refilo v imenikih programske opreme** (npr. Product Hunt, AlternativeTo, Capterra). Vsak vpis povezuje na refilo.app, ta pa na Doptivo.
8. **Gostujoči članki.** Članek »Excel ni težava. Težava je postopek.« prilagodi za glasilo gostinske ali turistične zbornice, članek o AI pa za lokalne ali panožne medije. Pod članek dodaj kratek podpis s povezavo.

Ni ti treba nastopati ali se fotografirati. Vse zgoraj je pisno.

## 7. Merjenje

- **Vercel Web Analytics** (brez piškotkov): vklopi v Vercelu in dodaj spremenljivko `ANALYTICS=1`. Politika zasebnosti se ob naslednji gradnji samodejno dopolni.
- **Search Console**: po štirih tednih preveri, za katera iskanja se stran prikazuje, in na teh temah napiši naslednje članke.

## 8. Kontrolni seznam pred objavo

- [ ] Pravni podatki v `site.config.mjs` izpolnjeni
- [ ] E-poštni predal deluje, MX, SPF, DKIM, DMARC nastavljeni
- [ ] Resend domena potrjena, spremenljivke v Vercelu vnesene
- [ ] Testno povpraševanje prispelo
- [ ] Domena in www delujeta prek HTTPS, ena preusmerja na drugo
- [ ] Search Console in Bing potrjena, sitemap oddan
- [ ] Fotografije v drsniku zamenjane
- [ ] Preverjeno na telefonu
