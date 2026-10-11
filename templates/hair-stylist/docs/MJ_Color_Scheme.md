# MJ Holistic Studio color scheme

Checked against the current Square website on October 11, 2026.

The existing identity is a gold logo over a photograph of lavender flowers. The saved Square theme has primary color `#000000` and an empty secondary color list. Gold and lavender come from images, rather than separately configured theme swatches. The theme's site title is `Mj hair studio`; the logo and current Phenix directory use MJ Holistic Studio.

The background photograph contains many shades. A six-color sample included `#51486b`, `#a08ac0` and `#c5afde`. These are representative image colors, not exact brand standards. The gold logo also has multiple shades, including `#c9a554`.

## Palette in the MJ preview

| Role | Color | Use |
| --- | --- | --- |
| Primary | `#000000` | Booking buttons and finder, matching the saved Square primary |
| Paper | `#f8f4ed` | Warm ivory content and logo caption |
| Body text | `#1d1920` | Near black for reading |
| Lavender | `#e3d9ed` | Light sections inspired by the flower photograph |
| Soft lavender | `#f0eaf4` | Care background |
| Purple accent | `#6e4d83` | Expressive headline wording |
| Gold | `#c9a554` | Decorative details alongside the original multicolor gold mark |
| Muted text | `#5e5365` | Supporting copy |
| Link hover | `#896341` | Darker gold with readable contrast |

The photograph's colors are adapted into pale backgrounds. Gold is not used for small body copy. Eight principal text pairs tested from 4.88:1 to 19.15:1 contrast; this does not establish every possible image or interaction state.

The film and fallback retain natural colors at 85% opacity, with no purple or gold tint. Mobile CSS places a compact visual before the headline. MJ's gold mark is in the caption, and the persistent booking action remains.

The generic Crown & Calm template retains its ivory and plum identity. MJ's palette is applied only to the MJ profile.

## Evidence

- [Current MJ website](https://www.mjholisticstudiollc.com/): public bootstrap state at `siteData.snapshot.properties.color`.
- Current header photograph: `IMG_3851_1701460272.jpeg` in the website's public uploads.
- Current gold mark: `IMG_3856_1701460272.png` in the website's public uploads.
- Implementation: `dist/assets/brand.css`.

The existing Square account has not been edited. This palette is implemented in the separate MJ preview.
