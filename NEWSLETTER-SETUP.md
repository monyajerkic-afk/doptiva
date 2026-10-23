# Doptiva — prijava na e-novice

Prijavno okno se samodejno pokaže po 45 sekundah obiska. Po zaprtju se v istem zavihku med sejo ne pokaže znova, v nogi strani pa je vedno na voljo povezava »Novice« / »Newsletter«. Brez izrecne potrditve soglasja se obrazec ne odda.

## Vključitev

V Vercel > Doptiva > Settings > Environment Variables dodaj naslednje strežniške spremenljivke:

- `RESEND_API_KEY` — ključ Resend z dovoljenjem za pošiljanje ter upravljanje kontaktov.
- `NEWSLETTER_FROM` — pošiljatelj s preverjene domene, npr. `Doptiva <novice@doptiva.com>`.
- `NEWSLETTER_SEGMENT_ID` — ID ločenega segmenta Resend, npr. »Doptiva novice«. Segment je namenjen samo potrjenim prijavam.
- `NEWSLETTER_SIGNING_SECRET` — naključen skrivni niz, dolg najmanj 32 znakov; generiraj in hrani samo v Vercel, ne v GitHub.

Potrditvena povezava je namenoma vezana na `https://doptiva.com/`; zato celoten postopek testiraj po objavi na pravi domeni, z lastnim testnim e-naslovom. Povezava velja 48 ur. Nepotrjeni naslovi niso dodani v Resend segment. Pred prvo kampanjo preveri način odjave v Resend Broadcasts in uporabi povezavo za odjavo v vsaki izdaji.

Če katere od spremenljivk ni, API vrne napako; prijava ne sme prikazati lažnega uspeha. Dodatna obvezna kontrola pred objavo: odstraniti oglate oklepaje pri pravnih podatkih v `site.config.mjs`, pregledati politiko zasebnosti, preveriti prikaz SL/EN in delovanje na telefonu.

## Vsebina

Občasni praktični nasveti o digitalizaciji, AI in procesih ter novice o projektih. Brez samodejnega vpisa oseb, ki pošljejo povpraševanje.
