import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root = new URL('../showcase/lab/tattoo/', import.meta.url);
const read = name => fs.readFileSync(new URL(name,root),'utf8');
const source = read('tagline.js'), shapeSource=read('assets/ink-morph-shapes.js');
const sandbox = {window:{}}; vm.createContext(sandbox);
vm.runInContext(shapeSource,sandbox); vm.runInContext(source,sandbox);
const core=sandbox.window.InkTaglineCore, raw=sandbox.window.InkMorphShapes;
const shapes=Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,core.expand(v)]));
assert.equal(Object.keys(shapes).length,10);
assert.equal(core.makeCycle(core.seededRandom(20),true).stages[0].duration,4000);
assert.equal(core.makeCycle(core.seededRandom(20),false).stages[0].duration,8000);
let prev=-1; const insertions=new Set();
for(let seed=1;seed<120;seed++) {
 const cycle=core.makeCycle(core.seededRandom(seed),false,prev);
 assert.equal(cycle.forms.length,9);assert.equal(new Set(cycle.forms).size,9);
 assert.equal(cycle.forms.indexOf('butterfly'),cycle.forms.indexOf('caterpillar')+1);
 assert.notEqual(cycle.insertion,prev);insertions.add(cycle.insertion);prev=cycle.insertion;
 assert.equal(cycle.stages.filter(s=>s.kind==='flight').length,1);
 assert.ok(cycle.stages.filter(s=>s.kind==='hold'&&s.shape==='imagination').every(s=>s.duration>=7000));
}
assert.equal(insertions.size,7);
for(const name of Object.keys(shapes)) {
 const pair=core.prepareMorph(shapes.imagination,shapes[name]);
 const mid=core.sampleMorph(pair,.5),start=core.sampleMorph(pair,0),end=core.sampleMorph(pair,1);
 assert.equal(JSON.stringify(start.black),JSON.stringify(shapes.imagination.black));
 for(const layer of ['black','cut']) {
  assert.equal(mid[layer].length,shapes[name][layer].length);
  assert.ok(mid[layer].flat(2).every(Number.isFinite));
  assert.ok(end[layer].flat(2).every(Number.isFinite));
 }
 if(name!=='imagination')assert.notEqual(JSON.stringify(mid.black),JSON.stringify(start.black));
 assert.equal(end.black[0].length,96);
}
const clock=core.createClock();assert.equal(clock.step(100),0);assert.equal(clock.step(4100),4000);
clock.pause();assert.equal(clock.step(15000),4000);assert.equal(clock.step(15100),4100);
clock.reset();assert.equal(clock.step(25000),0);
for(const width of [320,375,390,768,1440]) {
 const origin={x:width*.3,y:320};const start=core.flightPoint(0,origin,width,800),end=core.flightPoint(1,origin,width,800);
 assert.equal(start.x,origin.x);assert.equal(start.y,origin.y);
 assert.ok(end.x>width+150&&end.y< -100);
}
assert.notEqual(JSON.stringify(core.pose(shapes.butterfly,'butterfly',0).black),JSON.stringify(core.pose(shapes.butterfly,'butterfly',335).black));
assert.notEqual(JSON.stringify(core.pose(shapes.caterpillar,'caterpillar',0).black),JSON.stringify(core.pose(shapes.caterpillar,'caterpillar',300).black));
const css=read('styles.css'),html=read('index.html').match(/<p class="ink-tagline">[\s\S]*?<\/p>/)[0];
assert.ok(css.includes('position: fixed')&&css.includes('overflow: clip')&&css.includes('contain: strict'));
assert.ok(css.includes('prefers-reduced-motion: reduce'));
assert.ok(html.includes('My imagination on your skin.'));assert.equal((html.match(/aria-hidden="true"/g)||[]).length,3);
assert.ok(!/fetch\(|https:\/\/|setInterval|\.animate\(/.test(source));
// Run the actual DOM coordinator against a small fixture. This is NOT browser QA.
function fixture(initialReduced=false) {
 let t=0,id=0; const callbacks=new Map(),events={},mutations=[];const operations=[];
 class El {
  constructor(){this.dataset={};this.hidden=false;this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),contains:c=>this.classes.has(c)};this.style={};}
  setAttribute(){} getBoundingClientRect(){return {left:40,top:280,width:180,height:90};}
  getContext(){return ctx;}
 }
 const ctx=new Proxy({drawImage(){operations.push('draw');},clearRect(){operations.push('clear');}},{get(target,name){return target[name]??(()=>{});},set(target,name,value){target[name]=value;return true;}});
 const element=new El(),canvas=new El(),rootEl=new El();rootEl.clientWidth=375;element.querySelector=()=>canvas;
 const pref={matches:initialReduced,addEventListener(n,fn){this.change=fn;}};
 const body={children:[],appendChild(x){this.children.push(x);}};
 const document={documentElement:rootEl,body,hidden:false,querySelector:()=>element,createElement:()=>new El(),addEventListener(n,fn){events[n]=fn;}};
 const win={document,matchMedia:()=>pref,crypto:{getRandomValues:arr=>{arr[0]=20;return arr;}},devicePixelRatio:2,innerWidth:375,innerHeight:800,addEventListener(n,fn){events[n]=fn;},requestAnimationFrame(fn){callbacks.set(++id,fn);return id;},cancelAnimationFrame(x){callbacks.delete(x);}};
 const cx={window:win,document,MutationObserver:class {constructor(fn){mutations.push(fn);}observe(){}},console};vm.createContext(cx);vm.runInContext(shapeSource,cx);vm.runInContext(source,cx);
 const frame=ms=>{t=ms;const todo=[...callbacks.values()];callbacks.clear();todo.forEach(fn=>fn(t));};
 const pause=state=>{state?rootEl.classes.add('motion-paused'):rootEl.classes.delete('motion-paused');mutations.forEach(fn=>fn());};
 return {element,document,body,frame,pause,pref,callbacks,operations,events};
}
const f=fixture();f.frame(0);f.frame(3999);assert.ok(f.element.classList.contains('is-animated'));assert.equal(f.body.children[0].hidden,true);
f.frame(4000);f.frame(4700);const count=f.operations.length;f.pause(true);assert.equal(f.callbacks.size,0);f.frame(7000);assert.equal(f.operations.length,count);
f.pause(false);f.frame(7100);assert.ok(f.callbacks.size>0);
f.pref.matches=true;f.pref.change();assert.equal(f.callbacks.size,0);assert.ok(!f.element.classList.contains('is-animated'));assert.equal(f.body.children[0].hidden,true);
f.pref.matches=false;f.pref.change();assert.ok(f.callbacks.size>0);
const r=fixture(true);assert.equal(r.callbacks.size,0);assert.ok(!r.element.classList.contains('is-animated'));
const hidden=fixture();hidden.frame(0);hidden.document.hidden=true;hidden.events.visibilitychange();assert.equal(hidden.callbacks.size,0);
// Find flight, then verify the very same pause cancels flight updates.
const flight=fixture();let flightAt=0;for(const stage of core.makeCycle(core.seededRandom(20),true).stages){if(stage.kind==='flight')break;flightAt+=stage.duration;}
flight.frame(0);flight.frame(flightAt+500);assert.equal(flight.body.children[0].hidden,false);
const flightCount=flight.operations.length;flight.pause(true);flight.frame(flightAt+1800);assert.equal(flight.operations.length,flightCount);assert.equal(flight.body.children[0].hidden,false);
flight.pause(false);flight.frame(flightAt+1900);flight.frame(flightAt+6000);assert.equal(flight.body.children[0].hidden,true);
console.log(JSON.stringify({passed:true,checks:['first change at 4000 ms','all nine forms in each cycle','seven varied butterfly positions, no immediate repeat','contour point interpolation and finite coordinates','independent wing flaps and segmented crawl','frozen clock on pause','DOM pause freezes morph and flight','reduced-motion static fallback initially and after preference change','hidden-tab pause','bounded fixed viewport paint surface','off-screen flight endpoint at 320–1440 px','static full accessible tagline','no runtime network calls'],not_run:'Real browser, layout, screen-reader and device visual QA. Browser permission was unavailable.'},null,2));
