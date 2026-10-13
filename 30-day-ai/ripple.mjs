// One cancellable wave keeps the outgoing and incoming text in phase.
export function createRipple(node, {requestFrame=globalThis.requestAnimationFrame, cancelFrame=globalThis.cancelAnimationFrame, now=()=>performance.now()}={}) {
  let frame=0;
  function stop() { if(frame)cancelFrame(frame); frame=0; }
  function ramp(target,duration) {
    stop();
    const from=Number(node.getAttribute('scale'))||0, began=now();
    const tick=time=>{
      const progress=Math.max(0,Math.min(1,(time-began)/duration));
      const eased=(1-Math.cos(Math.PI*progress))/2;
      node.setAttribute('scale',String(from+(target-from)*eased));
      frame=progress<1?requestFrame(tick):0;
    };
    frame=requestFrame(tick);
  }
  return {ramp,stop,reset(){stop();node.setAttribute('scale','0');}};
}
