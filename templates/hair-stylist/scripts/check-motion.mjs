import assert from 'node:assert/strict';
import {initSalonMotion} from '../dist/assets/motion.mjs';
class Element extends EventTarget {
  dataset={}; attrs=new Map(); hidden=false;
  setAttribute(k,v){this.attrs.set(k,v);}
  getAttribute(k){return this.attrs.get(k)||null;}
  removeAttribute(k){this.attrs.delete(k);}
  fire(type){this.dispatchEvent(new Event(type));}
}
function harness({reduced=false,saveData=false,blocked=false,slow=false}={}){
  const video=new Element(),button=new Element(),root=new Element(),doc=new Element(),media=new Element(),connection=new Element();
  video.paused=true;video.ended=false;video.dataset.src='assets/hair-loop.mp4';video.calls=0;
  Object.defineProperty(video,'src',{get(){return this.getAttribute('src');},set(v){this.setAttribute('src',v);}});
  let resolvePlay;
  video.play=()=>{
    video.calls++;
    if(blocked)return Promise.reject(new Error('Autoplay blocked'));
    const start=()=>{video.paused=false;video.fire('playing');};
    if(slow)return new Promise(resolve=>{resolvePlay=()=>{start();resolve();};});
    start();return Promise.resolve();
  };
  video.pause=()=>{video.paused=true;video.fire('pause');};video.load=()=>{};
  root.querySelector=s=>s==='video'?video:button;
  doc.querySelector=()=>root;doc.hidden=false;
  media.matches=reduced;connection.saveData=saveData;
  let intersection;
  const win={matchMedia:()=>media,IntersectionObserver:class {constructor(cb){intersection=cb;}observe(){}}};
  initSalonMotion({doc,win,connection});
  return {video,button,root,doc,media,connection,visible(v){intersection([{isIntersecting:v}]);},finish(){resolvePlay();}};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const h=harness();
assert.equal(h.video.src,null,'Offscreen media must not download');
h.visible(true);await tick();
assert.equal(h.video.paused,false);assert.equal(h.button.dataset.playing,'true');
assert.equal(h.root.dataset.motionPaused,'false');
h.visible(false);assert.equal(h.video.paused,true);
h.visible(true);await tick();assert.equal(h.video.paused,false);
h.button.fire('click');assert.equal(h.video.paused,true);
h.doc.hidden=true;h.doc.fire('visibilitychange');
h.doc.hidden=false;h.doc.fire('visibilitychange');await tick();
assert.equal(h.video.paused,true,'Explicit pause must survive tab visibility changes');
h.button.fire('click');await tick();assert.equal(h.video.paused,false);
h.doc.hidden=true;h.doc.fire('visibilitychange');assert.equal(h.video.paused,true);
h.doc.hidden=false;h.doc.fire('visibilitychange');await tick();assert.equal(h.video.paused,false);
h.video.fire('error');assert.equal(h.root.dataset.filmReady,'false');assert.equal(h.button.hidden,true);
for(const mode of [{reduced:true},{saveData:true}]){
  const p=harness(mode);p.visible(true);await tick();
  assert.equal(p.video.src,null,'Motion preferences must prevent automatic download');
  p.button.fire('click');await tick();assert.equal(p.video.paused,false,'Explicit opt-in may play film');
  p.media.matches=true;p.media.fire('change');await tick();
  assert.equal(p.video.paused,true);assert.equal(p.video.src,null);
  assert.equal(p.root.dataset.filmReady,'false');
}
const blocked=harness({blocked:true});blocked.visible(true);await tick();
assert.equal(blocked.video.paused,true);assert.equal(blocked.root.dataset.motionPaused,'true');
assert.match(blocked.button.getAttribute('aria-label'),/^Play/);
assert.notEqual(blocked.root.dataset.filmReady,'true','Blocked autoplay keeps the poster');
const race=harness({slow:true});race.visible(true);await tick();
race.doc.hidden=true;race.doc.fire('visibilitychange');race.finish();await tick();
assert.equal(race.video.paused,true,'A delayed play cannot override a hidden tab');
assert.equal(race.root.dataset.motionPaused,'true');
console.log(JSON.stringify({passed:true,checks:'viewport and tab suspension, pause persistence, reduced motion, data saver, autoplay rejection, error fallback, asynchronous play race'}));
