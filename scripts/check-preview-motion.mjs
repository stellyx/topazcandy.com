import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('assets/topaz/motion.js','utf8');
function fixture({reduced=false,saveData=false}={}) {
  const handlers={},events={},winEvents={};let observer,plays=0,loads=0,resolvePlay;
  const button={dataset:{},hidden:true,setAttribute(k,v){this[k]=v;},addEventListener(k,v){handlers[k]=v;}};
  const video={paused:true,ended:false,dataset:{src:'/sample.mp4'},error:null,addEventListener(k,v){events[k]=v;},getAttribute(k){return this[k]||null;},pause(){this.paused=true;events.pause?.();},load(){loads++;this.error=null;this.paused=true;},play(){plays++;this.paused=false;return new Promise(r=>{resolvePlay=r;});}};
  const card={dataset:{previewName:'test'},querySelector:s=>s==='video'?video:button};
  const media={matches:reduced,addEventListener(){}},connection={saveData,addEventListener(){}};
  const document={hidden:false,querySelector:()=>null,querySelectorAll:()=>[card],addEventListener(k,v){winEvents[k]=v;}};
  class Observer{constructor(fn){observer=fn;}observe(){}}
  const window={matchMedia:()=>media,IntersectionObserver:Observer,addEventListener(k,v){winEvents[k]=v;}};
  vm.runInNewContext(source,{window,document,navigator:{connection},IntersectionObserver:Observer});
  return {video,button,media,document,get plays(){return plays;},get loads(){return loads;},visible(v){observer([{isIntersecting:v}]);},error(code){video.error={code};video.paused=true;events.error();},click(){handlers.click();},online(){winEvents.online();},visibility(v){document.hidden=!v;winEvents.visibilitychange();},async finish(){resolvePlay?.();await Promise.resolve();}};
}
const f=fixture();assert.equal(f.plays,0);f.visible(true);assert.equal(f.plays,1);assert.equal(f.video.muted,true);assert.equal(f.video.defaultMuted,true);assert.equal(f.video.src,'/sample.mp4');await f.finish();
f.error(2);assert.equal(f.button.hidden,false);assert.match(f.button['aria-label'],/^Retry/);f.visible(false);assert.equal(f.loads,0);f.visible(true);assert.equal(f.loads,1);assert.equal(f.plays,2);await f.finish();
f.error(2);f.online();assert.equal(f.loads,1,'Automatic network retry is bounded');f.click();assert.equal(f.loads,2,'Explicit retry reloads media');assert.equal(f.plays,3);await f.finish();
f.click();assert.equal(f.video.paused,true);f.online();assert.equal(f.plays,3,'User pause is preserved');
const decode=fixture();decode.visible(true);decode.error(3);decode.online();assert.equal(decode.loads,0,'Decode errors do not auto-loop');decode.click();assert.equal(decode.loads,1);
const pending=fixture();pending.visible(true);pending.visible(false);await pending.finish();assert.equal(pending.video.paused,true,'Late play cannot resume an offscreen card');
for(const prefs of [{reduced:true},{saveData:true}]){const p=fixture(prefs);p.visible(true);assert.equal(p.plays,0);p.click();assert.equal(p.plays,1);p.visibility(false);assert.equal(p.video.paused,true);}
const hidden=fixture();hidden.visibility(false);hidden.visible(true);assert.equal(hidden.plays,0);hidden.visibility(true);assert.equal(hidden.plays,1);
console.log('PASS: lazy load, muted play, transient recovery, bounded retries, manual decode retry, user pause, late play, reduced motion, data saver and hidden tabs.');
