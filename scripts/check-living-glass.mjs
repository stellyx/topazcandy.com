import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GLASS,ribbonPoint,createMesh,phaseAt} from '../assets/topaz/glass/geometry.mjs';
import {mountGlass} from '../assets/topaz/glass/living-glass.mjs';

let maxSeam=0,maxVelocitySeam=0,minArea=Infinity;
const distance=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
const difference=(a,b)=>a.map((x,i)=>x-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
for(let u=0;u<Math.PI*2;u+=.17)for(let v=0;v<Math.PI*2;v+=.4){
  maxSeam=Math.max(maxSeam,distance(ribbonPoint(u,v,0),ribbonPoint(u,v,64)));
  const velocity=t=>difference(ribbonPoint(u,v,t+.001),ribbonPoint(u,v,t-.001)).map(x=>x/.002);
  maxVelocitySeam=Math.max(maxVelocitySeam,distance(velocity(0),velocity(64)));
}
assert.ok(maxSeam<1e-10);assert.ok(maxVelocitySeam<1e-9);
for(let t=0;t<=64;t+=2)for(let u=0;u<=Math.PI*2;u+=.19)for(let v=0;v<=Math.PI*2;v+=.45){
  const p=ribbonPoint(u,v,t);assert.ok(p.every(Number.isFinite));assert.ok(Math.hypot(...p)<2);
  assert.ok(distance(ribbonPoint(u+Math.PI*2,v,t),p)<1e-10,'Closed longitudinal seam');
  assert.ok(distance(ribbonPoint(u,v+Math.PI*2,t),p)<1e-10,'Closed cross-section seam');
  const du=difference(ribbonPoint(u+.001,v,t),ribbonPoint(u-.001,v,t));
  const dv=difference(ribbonPoint(u,v+.001,t),ribbonPoint(u,v-.001,t));
  minArea=Math.min(minArea,Math.hypot(...cross(du,dv)));
}
assert.ok(minArea>1e-7,'No sampled collapsed surface tangents');
assert.ok(distance(ribbonPoint(1.2,.6,0),ribbonPoint(1.2,.6,18))>.3,'Motion changes the actual geometry');
for(const quality of [GLASS.desktop,GLASS.mobile]){
  const mesh=createMesh(quality.segments,quality.sides);
  assert.ok(Math.max(...mesh.indices)<mesh.parameters.length/2);
  assert.equal(mesh.indices.length,quality.segments*quality.sides*6);
}
assert.equal(phaseAt(0),phaseAt(64));assert.equal(phaseAt(-1),phaseAt(63));

function target(initial={}){
  return Object.assign({listeners:{},attrs:{},hidden:false,
    addEventListener(key,fn){(this.listeners[key]??=new Set()).add(fn);},
    removeEventListener(key,fn){this.listeners[key]?.delete(fn);},
    emit(key,event={}){for(const fn of this.listeners[key]??[])fn(event);},
    setAttribute(key,value){this.attrs[key]=value;}
  },initial);
}
function setup({reduced=false,saving=false,fail=false,slow=false}={}){
  let id=0,cpu=0;const pending=new Map(),doc=target({hidden:false}),button=target({hidden:true}),canvas=target();
  const reduce=target({matches:reduced}),data=target({saveData:saving}),profile=target({matches:true});let intersection;
  const env=target({navigator:{connection:data},performance:{now:()=>cpu},
    matchMedia:query=>query.includes('reduced')?reduce:profile,
    requestAnimationFrame(fn){pending.set(++id,fn);return id;},
    cancelAnimationFrame(key){pending.delete(key);},
    IntersectionObserver:class{constructor(fn){intersection=fn;}observe(){}disconnect(){}},
    ResizeObserver:class{constructor(fn){this.callback=fn;}observe(){}disconnect(){}}
  });
  const renderer={calls:0,resizes:0,disposed:false,render(t){assert.ok(Number.isFinite(t));this.calls++;if(slow)cpu+=30;},resize(){this.resizes++;},dispose(){this.disposed=true;}};
  const root={ownerDocument:doc,dataset:{glassState:'poster'},querySelector:selector=>selector==='canvas'?canvas:button};
  let creations=0;
  const state=mountGlass(root,env,(_canvas,narrow)=>{creations++;assert.equal(narrow,profile.matches);if(fail)throw Error('No graphics');return renderer;});
  const enter=visible=>intersection([{isIntersecting:visible}]);
  const advance=now=>{const first=pending.entries().next().value;if(first){pending.delete(first[0]);first[1](now);}};
  return {state,root,doc,button,canvas,reduce,data,profile,env,renderer,pending,enter,advance,get creations(){return creations;}};
}
const live=setup();assert.equal(live.creations,0,'Do not initialize offscreen');live.enter(true);
assert.equal(live.root.dataset.glassState,'live');assert.equal(live.pending.size,1);assert.equal(live.button.hidden,false);
live.advance(0);live.advance(40);assert.ok(live.state.state.clock>7);assert.equal(live.pending.size,1);
live.button.emit('click');assert.equal(live.pending.size,0);assert.equal(live.state.state.userPaused,true);
const frozen=live.state.state.clock;live.advance(1000);assert.equal(live.state.state.clock,frozen);
live.button.emit('click');assert.equal(live.pending.size,1);
live.enter(false);assert.equal(live.pending.size,0);live.enter(true);assert.equal(live.pending.size,1);
live.doc.hidden=true;live.doc.emit('visibilitychange');assert.equal(live.pending.size,0);
live.doc.hidden=false;live.doc.emit('visibilitychange');assert.equal(live.pending.size,1);
live.env.emit('resize');assert.equal(live.renderer.resizes,1);
live.env.emit('pagehide');assert.equal(live.pending.size,0);live.env.emit('pageshow');assert.equal(live.pending.size,1);
live.reduce.matches=true;live.reduce.emit('change');assert.equal(live.pending.size,0);assert.equal(live.root.dataset.glassState,'poster');assert.equal(live.button.hidden,true);
live.reduce.matches=false;live.reduce.emit('change');assert.equal(live.pending.size,1);
live.data.saveData=true;live.data.emit('change');assert.equal(live.pending.size,0);assert.equal(live.root.dataset.glassState,'poster');
live.data.saveData=false;live.data.emit('change');assert.equal(live.pending.size,1);
live.canvas.emit('webglcontextlost',{preventDefault(){}});assert.equal(live.root.dataset.glassState,'poster');assert.equal(live.pending.size,0);assert.equal(live.renderer.disposed,true);
live.state.dispose();live.enter(true);assert.equal(live.pending.size,0);assert.equal(live.state.state.running,false);
assert.equal(live.root.dataset.glassState,'poster');assert.equal(live.button.hidden,true);
const resize=setup();resize.enter(true);resize.profile.matches=false;resize.profile.emit('change');
assert.equal(resize.creations,2);assert.equal(resize.pending.size,1);resize.state.dispose();
for(const options of [{reduced:true},{saving:true},{fail:true}]){
  const view=setup(options);view.enter(true);assert.equal(view.root.dataset.glassState,'poster');assert.equal(view.pending.size,0);
  assert.equal(view.button.hidden,true);view.state.dispose();
}
const slow=setup({slow:true});slow.enter(true);for(let i=0;i<70;i++)slow.advance(i*40);
assert.equal(slow.root.dataset.glassState,'poster');assert.equal(slow.pending.size,0);

const home=readFileSync('index.html','utf8'),manifest=JSON.parse(readFileSync('docs/living-glass/manifest.json','utf8'));
const {createHash}=await import('node:crypto');
const cards=[...home.matchAll(/<article class="work-card[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]);
assert.equal(cards.length,12);assert.equal(createHash('sha256').update(cards.join('')).digest('hex'),manifest.catalog_sha256);
for(const [path,hash]of Object.entries(manifest.checkout_hashes))assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),hash,path);
assert.equal((home.match(/<h1\b/g)||[]).length,1);assert.ok(home.indexOf('id="work"')<home.indexOf('id="repair"'));
assert.match(home,/<img class="glass-poster"[^>]+fetchpriority="high"/);assert.match(home,/Browse websites/);
console.log(JSON.stringify({passed:true,maxSeam,maxVelocitySeam,minSampledArea:minArea,
  checks:'closed finite ribbon, pose and velocity loop seams, real deformation, mesh indices, lifecycle pause/visibility/bfcache/preferences, failed and slow graphics fallbacks, resize, catalog and checkout byte preservation',
  limit:'CPU geometry and lifecycle tests; not browser/device layout or GPU performance QA'}));
