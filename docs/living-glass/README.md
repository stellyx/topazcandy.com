# Living-glass homepage review v1

Status: implemented review draft, awaiting visual approval before replacing the live homepage.

This direction uses warm ivory, deep ink and an authored amber ribbon, with the existing website selector immediately below a compact hero. The headline follows the concept board and remains review copy. The full orbital brand identity remains in the header. Website evaluation/repair and other services are retained below buying; the class is a secondary navigation destination.

## Source and cost

Base: `8721177dccd222564cf3eb928ee0be4f42608503`, including the concurrent Dusk & Dice and Wonderbranch video-loop integration.

Branch: `design/living-glass-review-v1-20261013`.

The original concept is preserved as Library `libfile_0cd28a60a0808191b1875e0235b54de4`, SHA-256 `33296f5044d376469f35b3ecea384fbfb17b8a53a296a68371470a0eee8b847a`. Its handoff package is `libfile_ec238734279c81918fdde24d32415482`.

No paid media generation, assets, subscriptions or hosting were purchased. Extra media cost: USD 0.

## Actual editable assets

- `assets/topaz/glass/geometry.mjs`: closed ribbon geometry, deterministic motion constants, 64-second period, CPU sampling helper and actual vertex/fragment shaders.
- `assets/topaz/glass/renderer.mjs`: native WebGL mesh and four material passes. Multiplicative transmission and additive reflections are independent of triangle order.
- `assets/topaz/glass/living-glass.mjs`: lazy initialization, pause/resume, visibility, reduced-motion/data-saving behavior, resize/profile changes, context failure and slow-render fallback.
- `assets/topaz/glass/amber-ribbon-poster.webp`: an isolated deliberate pose rendered from those same shaders, not a crop of the concept board.
- `assets/topaz/living-glass.css`: homepage-only styling. Shared service, catalog and checkout styles remain in their existing files.
- `scripts/apply-living-glass.py`: a guarded transform for a fresh current homepage. It refuses an unexpected catalog count or hero and preserves current card blocks byte-for-byte.
- `scripts/export-glass.mjs` and `scripts/render-living-glass.py`: repeatable shader/mesh export and EGL rendering. Rendering requires installed Pillow, libEGL and libGL; it uses no browser or paid service.

The renderer intentionally approximates studio glass. It filters light through the ribbon walls and adds reflection cues; it does not implement geometric refraction, physically accurate caustics or an HDR texture pipeline. Do not promise a pixel match to the generated concept.

## Rendering targets

Native motion is capped at 30 rendered frames per second. Desktop uses 192 longitudinal segments, 24 cross-section samples, at most 1.5 device pixel ratio and 1.1 million backing pixels. Mobile uses 112 segments, 16 cross-section samples, at most 1.25 device pixel ratio and 420,000 backing pixels. Breakpoint changes rebuild the quality profile without resetting the animation clock. The poster loads immediately and remains usable if graphics fail or preferences suppress motion.

These are implementation budgets, not measured phone performance. The render-submission and frame-gap guard falls back to the poster under sustained slow execution. It is not a GPU timer.

## Verification

Passed:

- Required contact and purchase checks, including failed intake retention and the existing email-before-PayPal handoff, using the repository's simulated providers. No live email or payment was submitted.
- Existing 12-panel portfolio action/filter/keyboard checks, and both concurrent subsite motion-controller checks.
- All 12 current card blocks match the fresh base by SHA-256. All seven checkout files match the manifest hashes; prices, selected-template routes and the existing PayPal product are preserved.
- Numerical checks for finite closed geometry, sampled noncollapsed tangents, and pose/velocity agreement at the loop seam. Maximum velocity seam difference was approximately 1.1e-11.
- Simulated pause/resume, offscreen/hidden-page suspension, back/forward cache events, reduced motion, data saving, resize/profile changes, disposal, context loss and slow-render fallback.
- Actual shaders compiled and rendered through EGL/Mesa under both desktop OpenGL and OpenGL ES. Varying precision is explicit and matched between shader stages. All 768 frames in the 64-second, 12-fps motion review exported successfully. Software render throughput is not device performance evidence.

Not exercised: browser desktop/mobile layout, native keyboard interactions in a rendered browser, real device performance, live checkout submission and physical payment completion. Browser QA was unavailable in this workspace. The in-conversation desktop/mobile review uses the actual homepage components and motion code, with embedded static catalog posters instead of its movie downloads.

## Review and eventual publication

Before a live replacement, obtain visual approval of this exact draft, fetch current main again, incorporate any further concurrent changes and run required checks. Keep this draft separate from production until then. The guarded homepage transform is provided to preserve newer carousel media on a future update; it does not deploy.

Run from the repository root:

```bash
node scripts/check-contact.mjs
node scripts/check-purchase.mjs
node scripts/check-portfolio-actions.mjs
node scripts/check-portfolio-browser.mjs
node scripts/check-living-glass.mjs
python3 scripts/render-living-glass.py --poster assets/topaz/glass/amber-ribbon-poster.webp
python3 scripts/render-living-glass.py --gles --poster /absolute/scratch/gles-check.webp
```
