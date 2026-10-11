# HAIR-01: Crown & Calm hairstylist template and MJ Holistic Studio adaptation

This project includes a branded website proposal for MJ Holistic Studio and a reusable, separately configured hairstylist template. Created October 11, 2026 for Topaz Candy.

## Run

No framework or installed dependencies are required. Use Node 18 or later.

```
node scripts/build.mjs
node scripts/check.mjs
node scripts/check-motion.mjs
```

Static output: `dist/` for MJ; `dist/template/` for the generic template. Each includes a homepage and four service guides.

## Files

| File | Purpose |
| --- | --- |
| `profiles/mj.json` | Verified MJ contact, booking, gift card and current location references |
| `profiles/template.json` | Generic template with Topaz inquiry routing and a preview booking destination |
| `content/services.json` | Published menu snapshot, normalized labels and original scheduler labels |
| `scripts/build.mjs` | Deterministic static generation for the two separate profiles |
| `dist/assets/finder.mjs` | Appointment suggestions and correctly encoded SMS links |
| `dist/assets/app.mjs` | Filters, finder, mobile navigation and preview dialog |
| `dist/assets/motion.mjs` | Quiet film, visibility suspension and motion preference handling |
| `dist/assets/motion.css` | Natural 85% media opacity, small pause/play icons and restrained accents |
| `dist/assets/brand.css` | MJ palette, mobile first screen and service-guide heading layout |
| `docs/motion-generation.json` | Media provenance, delivery metadata and verification limits |
| `docs/MJ_Holistic_Studio_Package.md` | Audit, research, funnel and launch package |
| `docs/MJ_Color_Scheme.md` | Current color settings, image identity and adapted palette |
| `docs/MJ_SEO_and_Funnel_Audit_2026-10-11.md` | Detailed SEO, listing consistency and booking funnel audit |

## Adapt for a stylist

1. Copy the code into a dedicated client repository. Remove unused profiles, client documents and Site identity from the retained template.
2. Set the client's real booking, text, email, gift card and directions destinations. Refresh the menu and confirm prices, appointment lengths, hours, arrival details, branding and policies with the stylist.
3. Replace the generated editorial image with approved salon or client photography when available. Preserve clear captions until then. MJ's logo and reviews are only for her adaptation.
4. Update content and the structured data from verified details. Do not copy MJ's identity, contact information, reviews or location into another salon build.
5. Build, check links, exercise desktop and phone navigation, and complete the booking journey in the real scheduler without creating an unintended appointment.
6. On the final client domain, configure canonical URLs, indexability, sitemap, redirects and any approved analytics. Keep portfolio copies noindex. Never use this private Sites origin as the canonical for a public client domain.

## Actual functionality

The MJ version opens her existing booking and gift card pages, makes call and SMS links available, filters 27 menu entries and suggests a starting point for ten guest/goal combinations. It does not preselect a service in Square, reserve times, submit forms, handle payments, transmit photos, enable marketing or send messages automatically. A service row opens the complete menu; the visitor chooses the matching service there.

The generic template never calls or texts MJ. Booking and gift buttons open an explanatory preview dialog, followed by a legitimate Topaz Candy inquiry route. The service guides lead to the homepage finder and template inquiry route.

The arched hero now uses a silent 9.5 second hair film at 85% opacity, with natural colors and no tint overlay. A transparent 44px pause/play target contains a 14px icon, matching the existing Topaz template controls. The film and decorative accent pause offscreen, in hidden tabs and on explicit pause. Reduced motion and data saver prevent automatic media download; visitors can deliberately opt in. The still poster remains available when playback fails. Gentle content reveals never hide content when JavaScript is absent.

Quick hero links set a matching appointment goal. Visitors can copy their current visit notes, or manually copy the selected text if clipboard access is unavailable. The notes explicitly say no appointment has been reserved. These actions do not store data or send messages.

`salon:conversion` browser events are integration hooks, not installed analytics or confirmed booking events. Booking completion must come from authorized scheduler reporting. No prospect or visitor personal information is stored by this static site.

## Assets and evidence

`hair-editorial.webp` is generated conceptual editorial photography. It does not depict MJ's completed work. Prompt: flowing chestnut brunette waves with soft honey balayage, cream linen blouse, softly blurred lavender salon wall, warm window light, no visible face, tools, logos or text. Generated with the built-in image generation tool and optimized for the website.

`hair-loop.mp4` animates that concept with a slow camera glide and a small shoulder adjustment. `hair-poster.webp` matches the film's opening. The media are illustrative, not customer results or footage of MJ's salon. Generation, encoding and frame review evidence are recorded in `docs/motion-generation.json`.

`mj-logo.png` was retrieved from MJ's current website and resized for this adaptation. It is not part of the generic template. Two short attributed review excerpts come from the public Birdeye page reflecting Google reviews; no numeric rating or aggregate review schema is invented.

## Verification

Source and asset references, appointment decision logic, encoded contact routes, template identity isolation and main text color contrast were checked. Full visual and browser interaction QA remains pending because the supported browser-control plugin was unavailable. No customer appointment was placed. MJ's original domain, Square account, Google Business Profile and DNS have not been changed.

The motion controller passed checks for viewport/tab suspension, explicit pause persistence, reduced motion, data saver, blocked autoplay, media failure and a delayed-play visibility race. The final film fully decodes and source/delivery frames and the narrow hero crop were inspected. Frame review is not full browser or real-device playback QA.

## Booking and phone control follow-up

New color guests and visitors who are unsure now get a message action first, with the full booking menu available beside it. Their copied notes ask for service guidance and no longer suggest a color correction appointment. Known-service paths retain booking as the primary action. The latest service wording cleanup is preserved. Finder guest choices, text actions, service links, FAQ controls and dialog close targets have a 44px minimum height. Source and decision checks passed; actual browser/phone layout and playback remain unverified.
