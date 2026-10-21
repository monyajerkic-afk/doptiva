# Doptiva website

Static HTML, CSS and vanilla JavaScript website extracted from `Doptiva splet.zip`. No React, Next.js or other application framework is used. The actual website lives in `public/`; the archive's outer redirect/preview launcher is intentionally not the homepage. The original Slovenian/English pages, responsive styles, branding, embedded fonts, theme switcher, navigation and slider are retained.

## Local development

Requires Node.js 24. There are no npm dependencies.

```sh
npm run build
npm test
npm run dev
```

The development command serves `dist/` on port 3000 using Python 3. The build recreates `dist/` from `public/`, adds the missing web manifest and bilingual RSS feeds, removes references to the absent ICO (the supplied SVG favicon remains), and uses the supplied logo instead of nonexistent social preview images. It does not change the site's visual design or scripts.

## Vercel deployment

Import this GitHub repository, use branch `main`, and leave Root Directory at the repository root. `vercel.json` configures:

- Framework Preset: Other (static site)
- Build Command: `npm run build`
- Output Directory: `dist`
- Node.js: 24.x, as pinned in `package.json`

No environment variables or external packages are required for the existing preview functionality. Directory routes such as `/projekti/`, `/en/` and `/en/contact/` serve their corresponding HTML pages; existing `index.html` links continue to work. `404.html` supplies the not-found page. Do not configure an SPA catch-all rewrite: this is a multipage site.

## Existing launch limitations

The supplied website explicitly has `data-preview` on its HTML pages. Its form validates input and displays a preview message, and the direct `info@doptiva.com` mail links work. The ZIP contains no `/api/contact` implementation, so preview mode is deliberately preserved rather than claiming enquiries are sent. A working mail backend and verified delivery are needed before removing that attribute.

Company/legal placeholders and the preview notice/placeholder slide artwork are part of the supplied content and remain unchanged. Complete them before production launch. This repository configuration does not itself create a Vercel project, attach a domain, or establish a successful production deployment.
