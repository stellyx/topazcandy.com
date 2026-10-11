import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {recommendation,messageLink,visitNotes} from '../dist/assets/finder.mjs';
const services=JSON.parse(await readFile(new URL('../content/services.json',import.meta.url),'utf8'));
const mj=JSON.parse(await readFile(new URL('../profiles/mj.json',import.meta.url),'utf8'));
const template=JSON.parse(await readFile(new URL('../profiles/template.json',import.meta.url),'utf8'));
// Verify decisions that matter: new guests are not routed to a color transformation,
// and no template preview ever sends messages to the real business.
assert.equal(recommendation('color','new',services).service.id,'correction-consult');
assert.equal(recommendation('color','returning',services).service.id,'root-color');
assert.equal(recommendation('extensions','new',services).service.price,0);
for(const goal of ['cut','color','care','extensions','unsure'])for(const guest of ['new','returning']){
 assert.ok(recommendation(goal,guest,services).service);
 const link=messageLink(mj,goal,guest);
 assert.ok(link.startsWith('sms:+15127169236?body='));
 assert.match(decodeURIComponent(link),/Hi MJ!/);
 assert.ok(messageLink(template,goal,guest).startsWith('mailto:andrew@topazcandy.com'));
 assert.ok(visitNotes(mj,goal,guest,services).includes(mj.bookingUrl));
 assert.ok(!visitNotes(template,goal,guest,services).includes('mjholisticstudiollc'));
 assert.ok(visitNotes(mj,goal,guest,services).includes('No appointment has been reserved.'));
}
const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const demo=await readFile(new URL('../dist/template/index.html',import.meta.url),'utf8');
assert.equal((html.match(/<h1>/g)||[]).length,1);
assert.equal((demo.match(/<h1>/g)||[]).length,1);
assert.ok(html.includes(mj.bookingUrl));
assert.ok(html.includes('noindex,nofollow'));
assert.ok(!demo.includes('15127169236'));
assert.ok(!demo.includes('mjanethdu'));
assert.ok(!demo.includes('mjholisticstudiollc'));
assert.ok(!demo.includes('Maddy'));
assert.ok(!demo.includes('mj-logo'));
assert.ok(!html.includes('maximum-scale'));
assert.ok(html.includes('prefers-reduced-motion')===false); // stylesheet owns motion preferences
console.log(JSON.stringify({passed:true,checks:'appointment recommendations, contact isolation, accessibility metadata, preview indexing',recommendationPaths:10}));
