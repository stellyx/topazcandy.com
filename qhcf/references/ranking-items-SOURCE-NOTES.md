# Ranking/items source notes

Generated from preserved, read-only QHCF / DIKU-WIKI captures.

## Dataset boundaries

- **RangerRanking** is a wilderness/ranger ranking guide organized by rank band, target alignment, area, and terrain.
- **ClassRanking** is a short pointer page containing an original-post link and externally hosted class-ranking images. It is not a duplicate of RangerRanking or RankingList.
- **RankingList** is the general ranking guide. It remains independent from RangerRanking.
- **RankingEquipmentGood** and **RankingEquipmentEvil** are separate alignment-specific historical equipment-advice pages. Shared entries are not deduplicated across them.
- **Item List** is a category index, glossary, damage-type reference, and pointer to the compiled list.
- **carritems.txt** is the linked compiled item dump. It is not the Item List page and is not merged with the good/evil advice pages.

## Freshness and authorship

The five ranking/equipment captures are from 2019-10-22. Item List and carritems captures are from 2025-08-16. These dates describe archive captures, not current-game verification. Individual revision-author lists are absent from the preserved renderings; credit remains QHCF / DIKU-WIKI and contributors. Exact original URLs, archive URLs, checksums, wiki permalink/last-modified notices when available, and record-level source text are retained in JSON. Location names—including literal Academy mentions—remain unresolved historical references only; they do not encode topology, admission rules, mechanics, or return behavior.

## Parsing policy

HTML list records retain their complete rendered text and links. carritems rows expose name/flags/level/details only when a conservative core regex matches; other rows are marked `raw-only`. Exact duplicate lines and same-label differing rows are reported, never resolved automatically. Empty lines delimit source blocks and do not become item records. No stat names or locations are normalized because the source is inconsistent and doing so would require guesses.
