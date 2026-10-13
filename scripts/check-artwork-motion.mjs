import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('assets/topaz/artwork-motion.js','utf8');
function fixture({kind='forest', reduced=false, saveData=false, observer=true}={}) {
  let observed,click,requests=0,replaced=0,resolveFetch;const documentEvents={},preferences={};
  const button={dataset:{},hidden:true,setAttribute(k,v){this[k]=v;},addEventListener(k,v){click=v;}};
  const poster={id:'home-artwork-wonderbranch',alt:'Autumn tree',replaceWith(){replaced++;}};
  const card={dataset:{artworkPreview:kind,artworkName:'Example'},querySelector:s=>s==='.artwork-toggle'?button:poster};
  const media={matches:reduced,addEventListener(k,v){preferences.reduced=v;}},connection={saveData,addEventListener(k,v){preferences.connection=v;}};
  const document={hidden:false,querySelectorAll:()=>[card],importNode:n=>n,addEventListener(k,v){documentEvents[k]=v;}};
  class Observer{constructor(fn){observed=fn;}observe(){}}
  class Parser{parseFromString(){return {documentElement:{localName:'svg',classList:{add(){}},querySelector:()=>({}),setAttribute(){},removeAttribute(){}},querySelector:()=>null};}}
  const window={matchMedia:()=>media};if(observer)window.IntersectionObserver=Observer;
  vm.runInNewContext(source,{window,document,navigator:{connection},IntersectionObserver:Observer,DOMParser:Parser,fetch:()=>{requests++;return new Promise(r=>resolveFetch=r);}});
  return {card,button,media,connection,get requests(){return requests;},get replaced(){return replaced;},visible(v){observed([{isIntersecting:v}]);},click(){click();},visibility(v){document.hidden=!v;documentEvents.visibilitychange();},change(){preferences.reduced();},async resolve(ok=true){resolveFetch({ok,text:async()=>'<svg/>'});for(let i=0;i<8;i++)await Promise.resolve();}};
}
const forest=fixture();assert.equal(forest.card.dataset.artworkPaused,'true');forest.visible(true);assert.equal(forest.card.dataset.artworkPaused,'false');assert.equal(forest.requests,0);forest.click();assert.equal(forest.card.dataset.artworkPaused,'true');forest.visible(false);forest.visible(true);assert.equal(forest.card.dataset.artworkPaused,'true');forest.click();assert.equal(forest.card.dataset.artworkPaused,'false');forest.visibility(false);assert.equal(forest.card.dataset.artworkPaused,'true');forest.visibility(true);assert.equal(forest.card.dataset.artworkPaused,'false');
for(const opts of [{reduced:true},{saveData:true}]){const f=fixture(opts);f.visible(true);assert.equal(f.card.dataset.artworkPaused,'true');f.click();assert.equal(f.card.dataset.artworkPaused,'false');f.change();assert.equal(f.card.dataset.artworkPaused,'true');}
const tree=fixture({kind:'tree'});assert.equal(tree.requests,0);tree.visible(true);tree.visible(true);assert.equal(tree.requests,1);tree.click();await tree.resolve();assert.equal(tree.replaced,1);assert.equal(tree.card.dataset.artworkPaused,'true','Late artwork response respects pause');tree.click();assert.equal(tree.card.dataset.artworkPaused,'false');
const failure=fixture({kind:'tree'});failure.visible(true);await failure.resolve(false);assert.equal(failure.replaced,0);assert.match(failure.button['aria-label'],/^Retry/);failure.visible(true);assert.equal(failure.requests,1,'No unbounded fetch retry');failure.click();assert.equal(failure.requests,2);await failure.resolve();assert.equal(failure.replaced,1);assert.equal(failure.card.dataset.artworkPaused,'false');
const offscreen=fixture({kind:'tree'});offscreen.visible(true);offscreen.visible(false);await offscreen.resolve();assert.equal(offscreen.card.dataset.artworkPaused,'true');
const preference=fixture({kind:'tree',saveData:true});preference.visible(true);assert.equal(preference.requests,0);preference.click();assert.equal(preference.requests,1);
const fallback=fixture({observer:false});assert.equal(fallback.card.dataset.artworkPaused,'false');
const home=readFileSync('index.html','utf8');for(const concept of ['wonderbranch','dusk']){const article=home.match(new RegExp(`<article class="work-card work-card--${concept}"[\\s\\S]*?</article>`))[0];assert.match(article,/data-artwork-preview/);assert.match(article,/class="work-card-link" href=/);assert.match(article,/artwork-toggle/);assert.match(article,/data-artwork-paused="true"/);assert.doesNotMatch(article,/<video/);}
assert.match(home,/artwork-motion.js\?v=1/);assert.match(home,/artwork-motion.css\?v=1/);
const css=readFileSync('assets/topaz/artwork-motion.css','utf8');assert.match(css,/pointer-events:none/);assert.match(css,/prefers-reduced-motion/);assert.match(css,/animation-play-state:paused/);assert.equal((home.match(/class="artwork-firefly"/g)||[]).length,6);
console.log('PASS: artwork lazy mounting, static fallback/retry, offscreen/hidden pause, delayed loads, manual pause, reduced motion/data saver, unchanged card links and native SVG motion wiring. Browser visual QA not run.');
