import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const [treePath,dicePath]=process.argv.slice(2);
if(!treePath||!dicePath)throw Error('Pass the Wonderbranch and DUSK & DICE app.js paths.');
const tree=readFileSync(treePath,'utf8'),dice=readFileSync(dicePath,'utf8');
function fixture(kind,{reduced=false,saveData=false,saved=false}={}){
  const attrs={},handlers={},body={dataset:{},classList:{toggle(k,v){attrs[k]=v;}}};
  let resolvePlay,rejectPlay,plays=0,loads=0;
  const video={dataset:{src:'lake.mp4'},parentElement:{dataset:{}},paused:true,error:null,src:null,getAttribute(k){return this[k];},addEventListener(k,v){handlers[k]=v;},pause(){this.paused=true;},load(){loads++;this.error=null;},play(){plays++;this.paused=false;return new Promise((yes,no)=>{resolvePlay=yes;rejectPlay=no;});}};
  const symbol={setAttribute(k,v){attrs[k]=v;}};
  const toggle={setAttribute(k,v){attrs[k]=v;},querySelector(){return{textContent:''};}};
  const doc={body,documentElement:{dataset:{}},hidden:false,querySelector(s){return s==='#forest-video'?video:toggle;}};
  const context={document:doc,navigator:{connection:{saveData}},window:{matchMedia(){return{matches:reduced};}},localStorage:{getItem(){return saved?'paused':null;},setItem(){}},lakeVideo:video,sceneVisible:true,paused:reduced||saveData||saved,playbackRevision:0,oneShotAnimations:new Set(),limbFrames:new Map(),cancelAnimationFrame(){},storage:{set(){}},$(s){return s==='#motion-toggle use'?symbol:toggle;}};
  const fragment=kind==='tree'?tree.slice(tree.indexOf('  function reconcileScene()'),tree.indexOf('  const limbShapes')):dice.slice(dice.indexOf('const video ='),dice.indexOf("document.addEventListener('click'"));
  vm.runInNewContext(fragment+(kind==='tree'?';globalThis.api={sync:reconcileScene,pause:setPaused,visible(v){sceneVisible=v;reconcileScene();}};':';globalThis.api={sync:updateMotion,pause(v){motionPaused=v;updateMotion();},visible(v){heroVisible=v;updateMotion();}};'),context);
  return{video,doc,attrs,get plays(){return plays;},get loads(){return loads;},...context.api,async finish(){resolvePlay?.();await Promise.resolve();await Promise.resolve();},async reject(){rejectPlay?.(Error('Autoplay blocked'));await Promise.resolve();await Promise.resolve();}};
}
for(const kind of ['tree','dice']){
  for(const prefs of [{reduced:true},{saveData:true},{saved:true}]){const f=fixture(kind,prefs);f.sync();assert.equal(f.plays,0,kind+' respects initial preferences');f.pause(false);assert.equal(f.plays,1);f.pause(true);await f.finish();assert.equal(f.video.paused,true,'Pending play cannot undo pause');}
  const offscreen=fixture(kind);offscreen.sync();offscreen.visible(false);await offscreen.finish();assert.equal(offscreen.video.paused,true);const n=offscreen.plays;offscreen.sync();assert.equal(offscreen.plays,n);offscreen.visible(true);assert.equal(offscreen.plays,n+1);
  const hidden=fixture(kind);hidden.sync();hidden.doc.hidden=true;hidden.sync();await hidden.finish();assert.equal(hidden.video.paused,true);hidden.doc.hidden=false;hidden.sync();assert.equal(hidden.plays,2);
  const failure=fixture(kind);failure.sync();await failure.reject();assert.equal(failure.video.paused,true);assert.match(failure.attrs['aria-label'],/Play|Resume/);failure.pause(false);assert.equal(failure.plays,2);
  const stale=fixture(kind);stale.sync();stale.pause(true);await stale.reject();stale.pause(false);assert.equal(stale.plays,2,'A stale rejection does not permanently disable retry');
}
console.log('PASS: both subsite controllers respect preferences, saved pause, offscreen/hidden suspension, pending plays, autoplay failure and explicit retry.');
