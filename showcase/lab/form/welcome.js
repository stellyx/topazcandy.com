export const WELCOME_DELAY=5000;
export const EXHALE_DELAY=2000;
export const PUFF_DURATION=3400;
export const PUFF_REPEAT_DELAY=18000;
export const GRAB_TIMING=Object.freeze({reach:1.15,lift:.85,hold:.55,putBack:.85,withdraw:.65});
export const RETURN_AT=GRAB_TIMING.reach+GRAB_TIMING.lift+GRAB_TIMING.hold+GRAB_TIMING.putBack;
export const HAND_DONE_AT=RETURN_AT+GRAB_TIMING.withdraw;
const smooth=x=>{const n=Math.max(0,Math.min(1,x));return n*n*(3-2*n);};

// The live model is carried temporarily. Returning or canceling restores its
// exact origin without changing its materials, design or orbit camera.
export function grabPose(seconds){
  const t=Math.max(0,seconds),liftStart=GRAB_TIMING.reach,holdStart=liftStart+GRAB_TIMING.lift,backStart=holdStart+GRAB_TIMING.hold;
  const approach=t<liftStart?smooth(t/liftStart):t<RETURN_AT?1:1-smooth((t-RETURN_AT)/GRAB_TIMING.withdraw);
  const carry=t<liftStart?0:t<holdStart?smooth((t-liftStart)/GRAB_TIMING.lift):t<backStart?1:1-smooth((t-backStart)/GRAB_TIMING.putBack);
  return {approach,carry,returned:t>=RETURN_AT,done:t>=HAND_DONE_AT};
}

export function createWelcomeSequence({isBlocked=()=>false,onStart,onGrab,onPuff,onFinish,schedule=setTimeout,cancel=clearTimeout}){
  let active=false,phase='off',hasReturned=false;const timers=new Set();
  function arm(delay,fn){const id=schedule(()=>{timers.delete(id);if(!active)return;if(isBlocked()){finish('blocked');return;}fn();},delay);timers.add(id);}
  function finish(reason='finished'){
    if(!active)return;active=false;phase='off';for(const id of timers)cancel(id);timers.clear();onFinish?.(reason);
  }
  function start({delay=WELCOME_DELAY}={}){
    if(active||isBlocked())return false;
    active=true;phase='beach';hasReturned=false;
    if(onStart?.()===false){active=false;phase='off';return false;}
    arm(delay,()=>{phase='grab';onGrab?.();});
    arm(24000,()=>finish('timeout'));return true;
  }
  function returned(){
    if(!active||hasReturned||phase!=='grab')return false;
    hasReturned=true;phase='rest';
    arm(EXHALE_DELAY,()=>{phase='puff';onPuff?.();arm(PUFF_DURATION,()=>finish());});return true;
  }
  return {start,returned,stop:finish,activity:()=>finish('interaction'),get active(){return active;},get phase(){return phase;}};
}
