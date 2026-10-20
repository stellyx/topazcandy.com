# WARP maps rebuild

The public-town page is built from two separately reviewed inputs:

1. `scripts/build-warp-map-migration.mjs` imports the sealed public topology and refreshes the historical archive. Set `WARP_SEALED_EXPORT_ROOT` to the reviewed generated export before running it. Its embedded page assets are bootstrap fallbacks only; an existing graphical UI is never overwritten.
2. `scripts/enrich-warp-public-town.mjs <fakedb.data.CMROOM>` adds only the 204 `WarpGaladonSeed` public-town titles and descriptions. It rejects incomplete or unexpected room sets. Never point it at a different area without reviewing and extending the record filter.
3. `scripts/update-warp-path-manifest.mjs` refreshes `path-manifest.json` after every map-facing change.
4. Run `node --test tests/*.test.mjs` and complete browser checks before publication.

The committed output is a sealed offline candidate, not proof of the installed game map. Route previews never connect to a game client and must remain non-executable. The authentic southwest/northeast pair depends on the unresolved `DIRECTIONS=11` integration decision. Protected Palace, player, authentication, and unrelated database records must remain excluded.
