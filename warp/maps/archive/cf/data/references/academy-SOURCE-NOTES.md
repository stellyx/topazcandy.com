# Academy / temple seam source notes

## Outcome

The staged package is a coverage/reference view, not a reconstructed Academy map. No standalone `Academy` or `AcademyCaverns` raw capture or metadata exists under `qhcf-wiki-rescue/raw`. The historical NewsArchive only records that Academy “with Caverns” was added or updated.

No executable route is published. Every proposed boundary remains origin-specific, directed, non-reversible, and excluded from shortest-path routing.

## Evidence tiers

1. `source_chart`: exact preserved chart title, revision, 1-based row/Unicode column, and literal label. This proves only what the chart says.
2. `official_help`: current Carrion Fields help observed 2026-10-20. This confirms Academy admission at levels 1–5, removal/no re-entry at level 6, and the stated hometown-specific prose for Akan and Hillcrest.
3. `user_report`: trusted intended behavior—`down` from hometown temples, `south` toward “academy githing caverne,” and `north` toward newbie training/description. It is not promoted to source-confirmed topology.
4. `historical_community`: preserved guides and news. Useful context, never current topology.
5. `live_verified`: absent. No game commands were issued.

Directional serialization, if later verified, must use lowercase commands joined by `;;`. This package contains no multi-step executable command string.

## Preserved Academy-like anchors

| Chart | Revision | Exact anchor | What it proves |
|---|---:|---|---|
| Galadon | 5044 | `Acad` row 26 col 21; `Acd` row 28 col 50; `Acd` row 49 col 41 | Three preserved Academy links/abbreviations; no command or shared endpoint. |
| EvermoonHollow | 5002 | `1) To the academy` row 14 col 12 | A drawn local reference only. |
| HamsahMutaz | 4967 | `O - HEALER/ACADEMY` row 85 col 1 | A combined legend marker only. |
| JadeMountains | 5114 | `A - Pit (down to Academy)` row 75 col 1 | The chart explicitly says down, but no destination room, reverse exit, or playable validation. |
| Veran | 5103 | `A: Gates to the Academy` row 24 col 1 | An Academy gates label only. |
| TethAzeleth | 3562 | `Warrior's Academy` row 9 col 44; `Temple of Lloth` row 13 col 1 | Two distinct chart labels. It does **not** prove a shared newbie Academy seam. |

Source JSON/text authority is in `audit-current-main-20261020/qhcf/data/areas/`; derived `/qhcf/areas/*.html` pages are manual graphical references only.

## Current official help

- Academy help: <https://carrionfields.net/helpsearch.php?keywords=academy> (help 1159). Confirms levels 1–5, removal/no re-entry at 6, and that entrances are usually near recall points. “Usually” must not be rewritten as “every temple.”
- Hometowns: <https://carrionfields.net/helpsearch.php?id=78> (help 78). Supplies the current named hometown coverage list.
- Akan: <https://carrionfields.net/helpsearch.php?id=1120> (help 1120). Says the Academy is accessible through the trapdoor in the temple; it does not state the command or return behavior.
- Hillcrest: <https://carrionfields.net/helpsearch.php?id=1117> (help 1117). Says to head downward while in front of the pit; destination room and reverse behavior remain unknown.
- Grinning Skull: <https://carrionfields.net/helpsearch.php?id=1116> (help 1116). Its Academy wording is conjectural (“may” / “if such a thing exists”), so it is not topology.

## Conflicts and exclusions

- “githing caverne” remains the literal user-reported phrase. The proper name “Fighting Cavern” is unresolved.
- The north and south branches have no captured coordinates or room names. They are descriptive claims with no graph edges.
- Teth Azeleth’s Warrior’s Academy is not silently equated with the newbie Academy.
- Elemental Temple, Temple of Loch Grynmear, Temple of Red Sands, Temple of Lloth, and other religious shrines are not assumed to be hometown recall temples.
- Temple labels alone do not prove `down`, Academy admission, an origin identity, a destination room, `up`, or return-to-origin behavior.
- A shared Academy node would create unverified temple-A → Academy → temple-B fast travel, so none exists.

## Historical context (not current mechanics)

- `NewsArchive--20191022134814.html`: mentions Academy and AcademyCaverns, without geometry.
- `SvirfneblinWarriorCreation--20191022132357.html` (`sha256 280723845ee2b0b8570fe6babc19408e9ef43106e73fc0fff3705c827f0f58f7`): says “go down” and describes a fine-leather quest plus a historical south restriction.
- `TheerklaRangerFaq--20191022142356.html` (`sha256 26051321e5b00e842b4ef5d86f4c95e017b9820efe7b671be26579707856cc76`): lists possible Academy locations but explicitly expresses uncertainty and incompleteness.

## Smallest observations that would safely resolve a seam

For each hometown entrance, record a dated, non-ambiguous observation containing:

1. Exact exterior room name and hometown identity.
2. Visible exits and the command that enters Academy.
3. Exact first Academy room name after entry.
4. Whether entry is admitted/denied at levels 1–5 and level 6.
5. Visible exits from that first Academy room and the command used to leave.
6. Exact exterior room reached on leaving, proving whether it returns to origin or selects another destination.
7. For the reported branches, exact junction room plus the first north and south room names; preserve the game’s actual cavern proper name.

Until all seven fields exist for a seam, keep it manual/graphical and non-routable.
