# InkMaster Pedro — Topaz Candy tattoo studio concept

Published directly at https://topazcandy.com/showcase/lab/tattoo/.
Static HTML, CSS and JavaScript; relative local image assets; no build step.
Source: approved tattoo revision 3, commit ec7f83a907d7c4859b3c23d2fcdec8a3aa961af8, including the builder’s stationary-body mask and stacking correction.

The large hero moth has independently hinged wing layers and a stable center relative to the wings, with pause/resume and reduced-motion support. The October 13 revision adds a seamless 9.6-second wing loop with alternating single-wing lifts and a 12-second bounded drift inside the hero. The small flying motif is absent. The gallery, filters, swipe/arrow navigation, uncropped fullscreen viewer and browser-local message builder are preserved.

The existing sample-art labels are retained. The artist is Pedro, with roots in Toluca. The studio name is InkMaster Pedro; the established studio visual direction is retained. His actual tattoo portfolio and verified contact details are still required for a real client launch. The tattoo message builder remains local-only; it does not send messages or claim a booking. The separate Topaz customization link opens the established website contact form with a reviewable sample brief.

This publication adds homepage and demo-library cards. It does not alter the checkout, prices, payment settings, DNS, CNAME, existing templates or sales-email workflows. The concept follows the demo-library noindex/nofollow convention and is not added to the public sitemap.

Validation: run node scripts/check-tattoo.mjs, node scripts/check-contact.mjs and node scripts/check-purchase.mjs from the repository root. No new third-party service or dependency is required.

## Blooming word and walking moth — October 13
The readable word “florece” now has an adjacent original SVG blossom whose petals and leaves unfurl every 6.4 seconds. A separate large-moth layer walks along a contained, curved 12.8-second return path, with alternating leg steps and a small body rise; the moon stays fixed. Two complete wing cycles and sixteen step cycles finish within each walking loop. All keyframe endpoints match, and the existing motion control pauses the flower, walking, steps and wings together. Reduced-motion displays a still composition. No image generation, new artist claims, contact-routing or price changes were made.

The latest identity correction changes only the name and origin: InkMaster Pedro / roots in Toluca. No operating address, existing premises, team, dates, license or experience has been invented. Social metadata uses the unlabelled moth artwork so the prior placeholder name is not shown in previews.
