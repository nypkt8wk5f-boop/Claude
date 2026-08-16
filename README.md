# Ultimate Fight Fitness — Website

Static website for **Ultimate Fight Fitness**, Unit 7 Twyford Road, Bishop Stortford CM23 3LJ.

Built as plain HTML/CSS/JS — no build step, no frameworks. Open `index.html` in a browser, or host the folder on any static host (GitHub Pages, Netlify, Cloudflare Pages, etc.).

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home — hero, intro, class tiles, community/motivation/results, Instagram, contact form |
| `about.html` | About the gym, facility gallery, coach profiles (Rodrigo, Jack, Ruby) |
| `classes.html` | Class descriptions — BJJ, Muay Thai, Kids, Hybrid, Sweat, Small Group PT |
| `timetables.html` | Weekly timetables with tabs — BJJ / Muay Thai / Strength & Conditioning |
| `memberships.html` | Membership plans and pricing |
| `privacy-policy.html`, `equality-policy.html` | Policies |

## Editing

- **Text**: edit the HTML files directly — the copy is plain text in each page.
- **Timetables**: each class slot is a `<li>` inside `timetables.html`, grouped per day.
- **Prices**: in `memberships.html`, each plan is a `.plan` card.
- **Photos**: all images live in `assets/img/` with descriptive names. Replace a file (keeping the name) and the site picks it up.
- **Colours**: defined once at the top of `css/style.css` (`--bg` grey matches the logo, `--red` accent).

Fonts (Oswald + Inter) are self-hosted in `assets/fonts/` so the site has no external dependencies.

## Founding 50 counter

The memberships page shows "X of 50 founding spots remaining" with a progress bar.
As spots sell, edit `memberships.html`: change the `<strong>50 of 50</strong>` text and
the `width:100%` on the `spots-fill` span (width = remaining ÷ 50 × 100). When the offer
sells out, delete the whole `<section>` containing the `founding` block, and remove the
`announce` bar link at the top of each page.

## Contact form

The form opens the visitor's email app with the message pre-filled, addressed to
`info@ultimatefightfitness.co.uk` — no server needed. If you later want in-page
submission, wire it to a form service (e.g. Formspree) in `js/main.js`.
