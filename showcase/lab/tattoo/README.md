# Tinta Umbría — Topaz Candy portfolio concept

Published directly at https://topazcandy.com/showcase/lab/tattoo/.
Static HTML, CSS and JavaScript; relative local image assets; no build step.
Source: approved tattoo revision 3, commit ec7f83a907d7c4859b3c23d2fcdec8a3aa961af8, including the builder’s stationary-body mask and stacking correction.

The large hero moth has independently hinged wing layers and a stable center relative to the wings, with pause/resume and reduced-motion support. The October 13 revision adds a seamless 9.6-second wing loop with alternating single-wing lifts and a 12-second bounded drift inside the hero. The small flying motif is absent. The gallery, filters, swipe/arrow navigation, uncropped fullscreen viewer and browser-local message builder are preserved.

The existing concept labels and artist placeholders are retained. The artist’s actual identity, portfolio and verified contact details are still required for a real client launch. The tattoo message builder remains local-only; it does not send messages or claim a booking. The separate Topaz customization link opens the established website contact form with a reviewable sample brief.

This publication adds homepage and demo-library cards. It does not alter the checkout, prices, payment settings, DNS, CNAME, existing templates or sales-email workflows. The concept follows the demo-library noindex/nofollow convention and is not added to the public sitemap.

Validation: run node scripts/check-tattoo.mjs, node scripts/check-contact.mjs and node scripts/check-purchase.mjs from the repository root. No new third-party service or dependency is required.
