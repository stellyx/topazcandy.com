import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WEBSITE_PACKAGE} from '../checkout/config.mjs';
const home=readFileSync('index.html','utf8');
const cards=[...home.matchAll(/<article class="work-card[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]);
assert.equal(cards.length,12);
let buyCount=0,customCount=0;
for(const card of cards){
 const title=card.indexOf('class="preview-title ');assert.ok(title>card.indexOf('class="work-image'),'Each identity is inside its media preview');assert.ok(title<card.indexOf('class="work-meta"'),'No brand title below the preview');
 const destination=card.match(/class="work-card-link" href="([^"]+)"/)[1];
 const actions=card.match(/<div class="concept-sales[^>]*>([\s\S]*?)<\/div><\/article>/)[1];
 assert.ok(actions.startsWith(`<a href="${destination}">Preview ↗</a>`),'Preview action preserves the demonstrated destination');
 const buy=actions.match(/class="concept-buy" href="\/checkout\/\?template=([^"&]+)" data-website-purchase>Buy now <span>\$450 ↗<\/span>/);
 if(buy){assert.ok(Object.hasOwn(WEBSITE_PACKAGE.templates,buy[1]),'Only existing priced products may be sold');buyCount++;}
 else{assert.match(actions,/class="concept-configure"/);assert.match(actions,/https:\/\/topazcandy.com\/contact\/\?service=website#notes=/);assert.match(actions,/Make this yours/);assert.doesNotMatch(actions,/Buy now|\$450/);customCount++;}
}
assert.equal(buyCount,8);assert.equal(customCount,4);
for(const key of ['garden','hvac','auto','roof','hair','wonderbranch','signal','form'])assert.match(home,new RegExp(`class="concept-buy" href="/checkout/\\?template=${key}"`));
assert.match(home,/seasonal.js\?v=3/);assert.match(home,/motion.js\?v=4/);assert.match(home,/artwork-motion.js\?v=2/);
console.log('PASS: all 12 identities inside previews, 12 direct preview links, 8 existing $450 checkout products, 4 preserved customization routes; motion and pumpkin wiring preserved.');
