# Carpet cleaning website template

Softstep is a fictional carpet care concept for Topaz Candy. It has a responsive landing page, room and add-on estimator, itemized price breakdown, quote-request dialog, downloadable request brief, commercial inquiry route and business-name personalization.

## Website purchase path

This preview sells the website. A Buy this website action appears at entry, again after the interactive demo and in the mobile dock. Each opens a prefilled email to the verified Topaz Candy business mailbox so price, customisation, launch work and handover can be agreed. No website price, checkout transaction or purchase confirmation is invented. The carpet estimates remain clearly labeled sample service prices.

Buyers may try a business name in the page. It uses the same 80-codepoint sanitization and text-content rendering as the query-string preview, with no persistence or metadata changes. Client mode hides the entire sale offer, business-name tool and buyer dock, and exposes the cleaner’s own mobile quote action.

## Reuse

Copy this folder into a client's own repository. Edit `config.js` for the approved business name, descriptor, currency, rates, minimum visit, room rules, real service areas and verified contact routes. Keep the template separate from the Topaz Candy business repository when handing it to a client.

Use `?business=Company%20Name` for a sales preview. The value is sanitized, limited to 80 characters and applied with text content. It does not change metadata, noindex, verified contact destinations or form behavior.

The default form is a demonstration. It produces a brief in browser memory only, with explicit NOT SENT wording. It does not post to an endpoint, collect payment, save lead details, send email or reserve appointments. No personal details are retained across reloads. The visitor may copy or download the brief intentionally.

For a client launch, replace illustrative media with approved business media as appropriate; verify the service descriptions and rates; supply genuine reviews or job photographs only when approved; set the client's metadata and canonical URL; review indexing and privacy; connect the chosen authorized booking or lead system. Turning `demoMode` off changes the copy, but does not create an email backend: `quoteEmail` opens the visitor's email application and `bookingUrl` goes to a verified HTTPS booking provider. Keep demo mode on until those routes are ready.

## Design and claims

The page opens with a Topaz Candy website purchase offer in ivory, plum and topaz, followed by a carpet demo in deep green, linen, sage and warm clay. The demo uses a larger editorial hero, an arch-shaped image, textile service drawings and a receipt-style estimator. Original cleaning photography and woven details give it its own identity. The photo has gentle CSS camera motion, a pause control, reduced-motion handling and data-saving handling. It is not footage of cleaning in progress or a verified customer project. There are no fabricated reviews, customer counts, certifications, fixed drying promises or stain-removal guarantees.

The sample estimator uses $50 per standard room, a $120 minimum visit, $35 per staircase, $45 pet treatment allowance, $65 per area rug and $90 per standard sofa. These are illustrative configuration values, not verified business rates. Pet treatment is disabled without carpeted rooms. An empty selection returns zero; minimum-visit adjustments are itemized. Commercial requests do not reuse residential pricing.

## Media provenance

The hero is an original image made with the built-in image generation tool on 2026-10-11, saved as `assets/cleaning-hero.webp` and `assets/cleaning-hero-small.webp` from the generated PNG. Prompt: a realistic extraction wand on warm beige carpet in an inviting family living room, cream sofa, muted sage cushion, soft daylight, cropped worker, sensible commercial equipment, no text, logos, watermark or before/after claim. It is illustrative media for a fictional concept.

The carpet care note is grounded in The Carpet and Rug Institute's cleaning and maintenance guidance: https://carpet-rug.org/carpet-for-homes/cleaning-and-maintenance/. Manufacturer instructions and material suitability govern actual client cleaning work. Fonts: DM Sans and Fraunces via Google Fonts.

## Verification

The source project checks pricing boundaries, empty selection, minimum charges, pet eligibility, commercial wording, brand sanitization, required form controls, headings and internal links/assets. Browser interaction QA is unavailable in this managed environment because the supported browser-control skill is not present. No alternate browser or preview server is used.
