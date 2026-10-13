import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('doodads.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('index.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('styles.css', import.meta.url), 'utf8');
function fixture(reduce = false, observe = false) {
  let now = 0, nextId = 0, seed = 20261013;
  const timers = new Map(), animations = [], events = {}, observers = [];
  const root = {classes: new Set(), classList: {contains(c) {return root.classes.has(c);}, add(c) {root.classes.add(c);}}};
  function node(kind, child = false) {
    return {kind, child, querySelectorAll() {return this.children || [];}, animate(frames, options) {
      const a = {target: this, frames, options, playState: 'running', events: {}, started: now,
        addEventListener(n,f) {this.events[n] = f;},
        pause() {this.playState = 'paused';}, play() {this.playState = 'running';},
        finish() {this.playState = 'finished'; this.events.finish?.();},
        cancel() {this.playState = 'idle'; this.events.cancel?.();}};
      animations.push(a); return a;
    }};
  }
  const ink = node('draw'); ink.children = [node('draw', true), node('draw', true), node('draw', true)];
  const nodes = [ink, node('rock'), node('pulse')];
  const selectors = ['.ink-ornament > svg', '.chapter-strip .strip-flower > svg.motif', '.collection-footer > span[aria-hidden="true"] > svg.motif'];
  const pref = {matches: reduce, addEventListener(n,f) {this.change=f;}};
  const doc = {documentElement: root, hidden: false, querySelector(s) {return nodes[selectors.indexOf(s)] || null;}, addEventListener(n,f) {events[n] = f;}};
  let mutate;
  const win = {matchMedia: () => pref, setTimeout(f,d) {timers.set(++nextId,{f,d});return nextId;}, clearTimeout(id) {timers.delete(id);}, addEventListener(n,f) {events[n]=f;}};
  const randomMath = Object.create(Math);randomMath.random = () => {seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296;};
  const scope = {window:win,document:doc,performance:{now:()=>now},Math:randomMath,MutationObserver:class{constructor(f){mutate=f;}observe(){}},console};
  if(observe) {scope.IntersectionObserver=class{constructor(f){observers.push(f);}observe(){}};win.IntersectionObserver=scope.IntersectionObserver;}
  vm.runInNewContext(source,scope);
  function tick() {const [id,entry] = [...timers.entries()][0] || [];if(!entry)return false;timers.delete(id);now+=entry.d;entry.f();return true;}
  function paused(value) {value?root.classes.add('motion-paused'):root.classes.delete('motion-paused');mutate();}
  function groups() {return new Set(animations.filter(a=>a.playState==='running'||a.playState==='paused').map(a=>a.target.kind));}
  return {tick,paused,groups,animations,timers,nodes,pref,doc,events,root,observers,advance(ms){now+=ms;}};
}
const f=fixture();
for(let i=0;i<50;i++) {f.tick();assert.ok(f.groups().size<=2);assert.ok(f.timers.size<=1);}
assert.equal(f.groups().size,2);
const count=f.animations.length;
f.paused(true);assert.equal(f.timers.size,0);assert.ok(f.animations.filter(a=>a.playState!=='finished').every(a=>a.playState==='paused'));
f.advance(50000);assert.equal(f.animations.length,count);
f.paused(false);assert.ok(f.timers.size<=1);assert.ok(f.animations.every(a=>a.playState==='running'));
f.paused(true);f.paused(false);assert.equal(f.timers.size,1);
f.doc.hidden=true;f.events.visibilitychange();assert.equal(f.timers.size,0);assert.ok(f.animations.every(a=>a.playState==='paused'));
f.doc.hidden=false;f.events.visibilitychange();assert.equal(f.timers.size,1);
f.pref.matches=true;f.pref.change();assert.equal(f.timers.size,0);assert.ok(f.animations.every(a=>a.playState==='idle'));
f.pref.matches=false;f.pref.change();assert.equal(f.timers.size,1);
const r=fixture(true);assert.equal(r.timers.size,0);assert.equal(r.animations.length,0);assert.ok(r.root.classes.has('doodads-ready'));
const o=fixture(false,true);assert.equal(o.timers.size,0);
o.observers[0]([{target:o.nodes[1],isIntersecting:true}]);assert.equal(o.timers.size,1);
for(let i=0;i<5;i++)o.tick();assert.ok(o.animations.length>0);assert.ok(o.animations.every(a=>a.target.kind==='rock'));
o.observers[0]([{target:o.nodes[1],isIntersecting:false}]);assert.equal(o.timers.size,0);assert.ok(o.animations.every(a=>a.playState==='idle'));
const varied=fixture();const durations=new Set(),delays=new Set(),kinds=new Set();
for(let i=0;i<160;i++) {
  const next=[...varied.timers.values()][0];if(next)delays.add(next.d.toFixed(2));varied.tick();
  assert.ok(varied.groups().size<=2);
  varied.animations.filter(a=>a.playState==='running').forEach(a=>{durations.add(a.options.duration.toFixed(2));kinds.add(a.target.kind);assert.equal(a.options.iterations,1);assert.equal(a.options.fill,'none');a.finish();});
}
assert.equal(kinds.size,3);assert.ok(durations.size>8&&delays.size>8);
assert.ok(varied.animations.every(a=>a.options.duration>=1100&&a.options.duration<=2600));
for(const a of varied.animations) {
  assert.equal(a.frames[0].transform,a.frames.at(-1).transform);
  if(a.target.kind==='draw')assert.equal(a.frames[0].strokeDashoffset,a.frames.at(-1).strokeDashoffset);
}
assert.ok(source.includes('active.size < 2'));
assert.ok(!/querySelectorAll\(['"]\.(icon|motif)['"]/.test(source));
assert.ok(!/requestAnimationFrame|setInterval|fetch\(/.test(source));
assert.ok(html.includes('<script src="doodads.js?v=1" defer></script>'));
assert.ok(css.includes('.doodads-ready .ink-line{animation:none;stroke-dashoffset:0;opacity:1}'));
console.log(JSON.stringify({passed:true,checks:['three explicit decorative targets only','at most two ornament groups and one timer','randomized bounded durations/delays','single-shot neutral endpoints','repeat pause/resume freezes animations','hidden-tab pause','live reduced-motion cancellation and still state','off-screen cancellation and no idle timer','existing controls, text and framed video untouched'],not_run:'Full browser/device visual QA.'},null,2));
