// A rotate, pinch or cancelled gesture must never be mistaken for a part pick.
export function createSelectionGesture({threshold=7}={}){
  const pointers=new Set();let start=null;
  return {
    begin(e){
      pointers.add(e.pointerId);
      start=pointers.size===1&&(e.button===undefined||e.button===0)
        ?{id:e.pointerId,x:e.clientX,y:e.clientY,moved:false}:null;
    },
    move(e){
      if(start?.id===e.pointerId&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>threshold)start.moved=true;
    },
    end(e){
      const candidate=start;pointers.delete(e.pointerId);start=null;
      return !!candidate&&candidate.id===e.pointerId&&!pointers.size&&!candidate.moved
        &&Math.hypot(e.clientX-candidate.x,e.clientY-candidate.y)<=threshold;
    },
    cancel(e){pointers.delete(e.pointerId);start=null;}
  };
}
