import {GLASS} from './geometry.mjs';
import {createRenderer} from './renderer.mjs';

export function mountGlass(root, env=globalThis, rendererFactory=createRenderer) {
  const doc=root.ownerDocument,canvas=root.querySelector('canvas'),button=root.querySelector('[data-glass-toggle]');
  const reduce=env.matchMedia('(prefers-reduced-motion: reduce)'),data=env.navigator.connection;
  let renderer=null,frame=0,clock=GLASS.stillTime,last=null,onscreen=false,userPaused=false,failed=false,busy=0,slowFrames=0,disposed=false;
  const profile=env.matchMedia('(max-width: 760px)');let narrow=profile.matches;
  const constrained=()=>reduce.matches||Boolean(data?.saveData);
  const running=()=>!disposed&&!failed&&!userPaused&&!doc.hidden&&onscreen&&!constrained();
  function updateButton(){
    const play=running()&&Boolean(renderer);
    button.hidden=!renderer||failed;
    button.setAttribute('aria-pressed',String(play));
    button.setAttribute('aria-label',play?'Pause living glass':'Play living glass');
    button.textContent=play?'Pause motion':'Play motion';
  }
  function stop(){if(frame)env.cancelAnimationFrame(frame);frame=0;last=null;updateButton();}
  function fallback(){failed=true;stop();renderer?.dispose();renderer=null;root.dataset.glassState='poster';updateButton();}
  function draw(){
    try{renderer.render(clock);}catch{fallback();return false;}
    return true;
  }
  function tick(now){
    frame=0;if(!running()){stop();return;}
    if(last===null)last=now;
    const elapsed=now-last;
    if(elapsed>=1000/GLASS.fps){
      clock+=Math.min(elapsed,90)/1000;last=now;
      const start=env.performance.now();
      if(!draw())return;
      busy=busy*.9+(env.performance.now()-start)*.1;
      // Protect the buying experience on slow software/device renderers.
      slowFrames=busy>22||elapsed>85?slowFrames+1:Math.max(0,slowFrames-1);
      if(slowFrames>30){fallback();return;}
    }
    frame=env.requestAnimationFrame(tick);
  }
  function ensureRenderer(){
    if(renderer||failed||disposed||constrained()||!onscreen)return;
    try{renderer=rendererFactory(canvas,narrow);if(draw())root.dataset.glassState='live';}catch{fallback();}
  }
  function sync(){
    if(disposed)return;
    if(constrained()){
      stop();root.dataset.glassState='poster';
      // Keep the authored poster for reduced motion and data saving.
      button.hidden=true;return;
    }
    ensureRenderer();
    if(renderer&&!failed)root.dataset.glassState='live';
    if(running()&&renderer&&!frame)frame=env.requestAnimationFrame(tick);
    else if(!running())stop();
    updateButton();
  }
  function resize(){
    if(disposed)return;
    if(profile.matches!==narrow){
      narrow=profile.matches;stop();renderer?.dispose();renderer=null;root.dataset.glassState='poster';sync();return;
    }
    if(!renderer||failed)return;
    try{renderer.resize();if(!doc.hidden&&onscreen)draw();}catch{fallback();}
  }
  function toggle(){userPaused=!userPaused;sync();}
  function lost(event){event.preventDefault();fallback();}
  button.addEventListener('click',toggle);canvas.addEventListener('webglcontextlost',lost);
  doc.addEventListener('visibilitychange',sync);env.addEventListener('pagehide',stop);env.addEventListener('pageshow',sync);
  env.addEventListener('resize',resize,{passive:true});
  reduce.addEventListener?.('change',sync);data?.addEventListener?.('change',sync);
  profile.addEventListener?.('change',resize);
  const observer=new env.IntersectionObserver(entries=>{onscreen=entries.some(entry=>entry.isIntersecting);sync();},{threshold:0});
  observer.observe(root);
  const resizeObserver=env.ResizeObserver?new env.ResizeObserver(resize):null;resizeObserver?.observe(root);
  return {
    get state(){return {clock,userPaused,onscreen,failed,running:running()&&Boolean(renderer),scheduled:Boolean(frame)};},
    dispose(){
      disposed=true;stop();renderer?.dispose();renderer=null;root.dataset.glassState='poster';updateButton();observer.disconnect();resizeObserver?.disconnect();
      button.removeEventListener('click',toggle);canvas.removeEventListener('webglcontextlost',lost);
      doc.removeEventListener('visibilitychange',sync);env.removeEventListener('pagehide',stop);env.removeEventListener('pageshow',sync);
      env.removeEventListener('resize',resize);reduce.removeEventListener?.('change',sync);data?.removeEventListener?.('change',sync);
      profile.removeEventListener?.('change',resize);
    }
  };
}
if(typeof document!=='undefined')document.querySelectorAll('[data-living-glass]').forEach(root=>{
  try{mountGlass(root);}catch{root.dataset.glassState='poster';}
});
