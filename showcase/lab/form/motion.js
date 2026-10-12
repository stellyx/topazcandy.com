export const IDLE_DELAY=12000;

// A page-local idle timer. The owner decides how to resume its showroom view.
export function createIdleRotation({isPaused,isBlocked,onPause,onResume,schedule=setTimeout,cancel=clearTimeout,delay=IDLE_DELAY}){
  let timer=null,held=false,disposed=false;
  function clear(){if(timer!==null){cancel(timer);timer=null;}}
  function refresh(){
    clear();
    if(disposed||held||isBlocked()||!isPaused())return;
    timer=schedule(()=>{timer=null;if(!disposed&&!held&&!isBlocked()&&isPaused())onResume();},delay);
  }
  function activity({pause=true}={}){if(disposed)return;if(pause)onPause();refresh();}
  function hold(options){held=true;activity(options);}
  function release(options){held=false;activity(options);}
  function dispose(){disposed=true;clear();}
  return {activity,refresh,hold,release,dispose};
}
