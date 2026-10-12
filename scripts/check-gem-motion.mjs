import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { anchorInset, bindCenteredAnchors } from '../assets/topaz/anchors.mjs';

assert.equal(anchorInset(800,400,0),200);
assert.equal(anchorInset(800,400,80),240);
assert.equal(anchorInset(600,700,70),86);
assert.equal(anchorInset(400,368,0),16);

function fixture({reduced=false,type='navigate'}={}) {
  let clicks,loads,frames=[],scrolls=[],focuses=0;
  const target={style:{},getBoundingClientRect:()=>({height:400}),scrollIntoView:options=>scrolls.push(options),focus:options=>{assert.equal(options.preventScroll,true);focuses++;}};
  const doc={querySelectorAll:selector=>selector==='[data-center-anchor]'?[target]:[],getElementById:id=>id==='session-includes'?target:null,fonts:{ready:Promise.resolve()},readyState:'complete',addEventListener:(name,fn)=>{if(name==='click')clicks=fn;}};
  const win={innerHeight:800,matchMedia:()=>({matches:reduced}),location:new URL('https://topazcandy.com/services/ai-work-session/#session-includes'),performance:{getEntriesByType:()=>[{type}]},addEventListener:(name,fn)=>{if(name==='load')loads=fn;},requestAnimationFrame:fn=>frames.push(fn)};
  bindCenteredAnchors(doc,win);
  return {target,scrolls,get focuses(){return focuses;},async settle(){await Promise.resolve();frames.splice(0).forEach(fn=>fn());},click(href=win.location.href){clicks({target:{closest:()=>({href})},button:0});},win};
}
for (const reduced of [false,true]) {
  const f=fixture({reduced});await f.settle();
  assert.equal(f.target.style.scrollMarginTop,'200px');
  assert.equal(f.scrolls[0].behavior,'instant');
  f.click();await f.settle();f.click();await f.settle();
  assert.equal(f.scrolls.length,3);
  assert.equal(f.scrolls[2].behavior,reduced?'instant':'smooth');
  assert.equal(f.focuses,3);
  f.click('https://example.com/#session-includes');await f.settle();assert.equal(f.scrolls.length,3);
}
const history=fixture({type:'back_forward'});await history.settle();assert.equal(history.scrolls.length,0);
const home=readFileSync('index.html','utf8');assert.match(home,/href="\/services\/ai-work-session\/#session-includes">See what’s included/);
const offer=readFileSync('services/ai-work-session/index.html','utf8');assert.match(offer,/<aside[^>]+id="session-includes" data-center-anchor tabindex="-1"/);assert.match(offer,/anchors\.mjs/);
const brand=readFileSync('assets/topaz/brand.css','utf8');assert.match(brand,/topaz-brand-shimmer 17s/);assert.match(brand,/prefers-reduced-motion/);
const motion=readFileSync('assets/topaz/motion.css','utf8');
assert.ok(!/animation:service-(orbit|counter)/.test(motion),'Navigation labels do not move');
assert.match(motion,/topaz-prism-drift/);assert.match(motion,/data-motion-paused/);
for (const page of ['30-day-ai/index.html','30-day-ai/es/index.html']) assert.match(readFileSync(page,'utf8'),/class="stage-gem-core"/);
const svg=readFileSync('assets/topaz/logo-mark.svg','utf8');assert.match(svg,/prefers-reduced-motion/);assert.match(svg,/mark-tumble/);
console.log(JSON.stringify({passed:true,checks:'centered deep link, short viewport/sticky inset, repeated clicks, Back restoration, reduced-motion instant scrolling, fixed navigation labels, shared prism motion and bilingual generated markup'}));
