import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const path='assets/topaz/portfolio-browser.css';
const css=readFileSync(path,'utf8');
const old=execFileSync('git',['show','7567c787bcc1e21cc5e7293185c3d8b37f38d1ff:'+path],{encoding:'utf8'});
const split=content=>{const start=content.indexOf('@media(max-width:760px){'),end=content.indexOf('@media(prefers-reduced-motion:reduce)',start);return [content.slice(0,start),content.slice(start,end),content.slice(end)];};
const [before,mobile,after]=split(css);const [oldBefore,,oldAfter]=split(old);
assert.equal(before,oldBefore,'Accepted desktop declarations are byte-for-byte preserved');assert.equal(after,oldAfter,'Reduced-motion defaults preserved');
assert.match(mobile,/\.portfolio-filters\{flex-wrap:nowrap;overflow-x:auto;max-width:100%;min-width:0/);
assert.match(mobile,/\.portfolio-filter\{flex:0 0 auto;white-space:nowrap/);
assert.match(mobile,/\.portfolio-filter:focus-visible,\.portfolio-tab:focus-visible\{outline-offset:-3px\}/,'Focus ring stays inside scrolling strips');
assert.match(mobile,/\.work-meta\{[^}]*min-height:0/);assert.doesNotMatch(mobile,/144px/);
assert.match(mobile,/\.work-meta h3\{display:none\}/);assert.match(mobile,/\.work-meta p\{font-size:12px;line-height:1\.45;min-height:2\.9em/);
assert.match(mobile,/grid-template-columns:minmax\(0,1fr\) minmax\(0,1\.5fr\)/);
assert.match(mobile,/\.concept-sales>a:first-child\{[^}]*min-height:44px/);
assert.match(mobile,/\.concept-configure\{[^}]*min-height:44px/);
assert.equal((mobile.match(/touch-action:auto/g)||[]).length,2,'Both strips preserve pinch zoom and native vertical page gestures');
assert.match(mobile,/\.portfolio-tab\{flex-basis:96px;width:96px;min-height:76px/);
assert.match(mobile,/font-size:clamp\(28px,8vw,34px\)!important/);
for(const viewport of [320,390,430]){
 const width=viewport-40; // Existing <=480px .wrap has 20px padding per side.
 const previewButton=(width-8)/2.5,primaryButton=previewButton*1.5;
 assert.ok(previewButton>=108,'Preview grid track remains comfortably wider than its 44px hit target');
 assert.ok(primaryButton>=163,'Primary grid track has room for the existing price/action labels');
 assert.ok(width/1.6>=175,'The film retains a natural 16:10 aspect box');
 console.log(JSON.stringify({viewport,contentWidth:width,previewTrack:previewButton,primaryTrack:primaryButton,thumbnailWidth:96,scope:'CSS geometry assertions, not a rendered-device test'}));
}
// Media can change independently of the accepted phone geometry. Keep its
// structural contract instead of pinning the entire homepage to an old film.
const html=readFileSync('index.html','utf8');
assert.match(html,/portfolio-browser.css\?v=2/);
const cards=[...html.matchAll(/<article class="work-card[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]);
assert.equal(cards.length,12);
for(const card of cards){assert.match(card,/role="tabpanel"/);assert.match(card,/class="concept-sales/);assert.match(card,/class="work-card-link"/);assert.ok(card.indexOf('class="preview-title ')<card.indexOf('class="work-meta"'),'Identity stays in the preview above the compact phone summary');}
console.log('PASS: phone cascade, preserved desktop CSS, natural summary height, single-row filters, reachable rail, 44px actions and preview structure. Visual phone QA remains unavailable.');
