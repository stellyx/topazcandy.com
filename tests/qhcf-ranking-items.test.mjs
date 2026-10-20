import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';

const data=JSON.parse(fs.readFileSync(new URL('../qhcf/references/ranking-items.json',import.meta.url)));
const html=fs.readFileSync(new URL('../qhcf/references/ranking-items.html',import.meta.url),'utf8');
const notes=fs.readFileSync(new URL('../qhcf/references/ranking-items-SOURCE-NOTES.md',import.meta.url),'utf8');
const bySlug=new Map(data.datasets.map(d=>[d.slug,d]));

test('seven source families stay distinct with preserved dates and URLs',()=>{
 assert.deepEqual([...bySlug.keys()],['ranger-ranking','class-ranking','ranking-list','ranking-equipment-good','ranking-equipment-evil','item-list','carritems']);
 for(const slug of ['ranger-ranking','class-ranking','ranking-list','ranking-equipment-good','ranking-equipment-evil']){
  const d=bySlug.get(slug);assert.equal(d.snapshot.snapshot_date_utc,'2019-10-22');assert.match(d.snapshot.original_url,/^http:\/\/wiki\.qhcf\.net\//);assert.match(d.snapshot.archive_url,/^https:\/\/web\.archive\.org\/web\//);assert.equal(d.snapshot.checksum_sha256,d.snapshot.verified_checksum_sha256);
 }
 for(const slug of ['item-list','carritems'])assert.equal(bySlug.get(slug).snapshot.snapshot_date_utc,'2025-08-16');
 assert.match(data.separation_note,/distinct datasets/);
});

test('known authoritative checksums and historical warning are retained',()=>{
 assert.equal(bySlug.get('ranger-ranking').snapshot.checksum_sha256,'a1dbe00cf8a29401a2b40b19255cf3b6ee6e110abde4617e0f84b244f3b5562b');
 assert.equal(bySlug.get('ranking-equipment-good').snapshot.checksum_sha256,'58691254ac07e9d29015e2152d20945abfed313166ed7d4a0dad01a6e0b877ee');
 assert.equal(bySlug.get('ranking-equipment-evil').snapshot.checksum_sha256,'75768bb73ce9da98330a301b607e5643bade39489f20052597e6b62cf3c8e0ea');
 assert.match(data.caution,/not current-game claims/);assert.match(html,/not current-game claims/);assert.match(notes,/not current-game verification/);
});

test('ClassRanking is an image-pointer page, not an empty duplicate ranking list',()=>{
 const d=bySlug.get('class-ranking');assert.equal(d.dataset_kind,'image/pointer summary page');assert.equal(d.record_count,0);assert.match(d.body_text,/Original post:/);assert.ok(d.page_links.some(link=>link.url==='http://i.imgur.com/Iguh8.png'));assert.ok(d.page_links.some(link=>link.url==='http://i.imgur.com/Xyr44.png'));
});

test('compiled items expose conservative parse status and unresolved conflicts',()=>{
 const d=bySlug.get('carritems');assert.equal(d.record_count,2229);assert.equal(d.parsed_core_count,2097);assert.equal(d.raw_only_count,132);assert.equal(d.exact_duplicate_group_count,0);assert.equal(d.possible_conflict_group_count,50);
 assert.equal(d.records.filter(r=>r.parse_status==='raw-only').length,132);assert.ok(d.possible_conflict_groups.every(g=>/No resolution inferred/.test(g.note)));
});

test('location mentions remain literal references with Academy topology excluded',()=>{
 assert.match(data.location_reference_policy,/Academy mentions/);assert.match(data.location_reference_policy,/do not encode topology/);assert.match(notes,/literal Academy mentions/);
 assert.ok(bySlug.get('ranking-equipment-good').records.some(r=>/Academy/i.test(r.text)));
 assert.ok(bySlug.get('ranking-equipment-evil').records.some(r=>/Academy/i.test(r.text)));
});

test('readable page is narrow-safe and source links remain visible',()=>{
 assert.match(html,/width=device-width/);assert.match(html,/minmax\(min\(100%,22rem\),1fr\)/);assert.match(html,/overflow-wrap:anywhere/);assert.doesNotMatch(html,/target="_blank"/);
 for(const d of data.datasets){assert.ok(html.includes(d.snapshot.original_url));assert.ok(html.includes(d.snapshot.archive_url));}
});
