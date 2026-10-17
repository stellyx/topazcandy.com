# The Wes Foundation motion preview

Status: approved for publication on October 17, 2026. This pass adds CSS/SVG motion and inactive donation/volunteer concept sections. The user approved publication while accepting that desktop/mobile visual verification remains incomplete.

## Source and provenance

- Existing original `landscape.svg`: 1600 x 1100 viewBox. The sun, mountains and tortoise tracks remain the still background.
- Existing original `tortoise.svg`: 900 x 600 viewBox. The entire tortoise translates and rotates by less than a degree, so its anatomy and shell drawing do not deform.
- Existing original `shell-pattern.svg`: decorative support-section motif.
- New `motion.css` and `motion.js`: lightweight loop and pause control. No generated video, stock footage, audio, paid asset, new dependency or animation export was used.

The background drifts slowly and warm light changes opacity. All keyframes return to the starting state for a seamless loop. Motion pauses when its section is offscreen, when the tab is hidden, or when the visitor uses the pause button. `prefers-reduced-motion: reduce` displays the existing still art and hides the motion control. Text, navigation and links remain regular HTML above the animated layers.

## Runway decision

The connected Runway MCP described video generation as credit billed and reported 188 purchased credits with `unlimited: false`. The browser showed a Personal Max workspace and a credit balance, but the selected video generation did not display an explicit Unlimited mode. No Runway generation was submitted and no credits were spent. Do not substitute the MCP or use credits without a confirmed Unlimited generation mode.

## Preview-only support sections

Donation amounts and the volunteer interest form are illustrative, disabled UI. No payment or personal information can be submitted. Before activation, verify the legal organization and recipient, mission and campaign claims, tax status, payment processor, volunteer program lead, privacy notice, safe data recipient and operational review. The fictional demo status remains visible on the page.

## Review

The release target is `https://topazcandy.com/showcase/lab/slowground/`. The connected browser blocked access to both localhost and file URLs for preview QA; no alternate browser route was used after that restriction. Source-level checks passed. Desktop/mobile visual verification remains open after release.
