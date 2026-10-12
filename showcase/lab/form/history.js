import {sanitizeBuild} from './catalog.js';

// Track design edits only. Browsing, selection and motion stay where the user left them.
function designSnapshot(build){
  const {system,parts,ink,hardware}=sanitizeBuild(build);
  return {system,parts,ink,hardware};
}
export function createDesignHistory(initial,{limit=40}={}){
  const past=[],future=[];
  let current=designSnapshot(initial);
  const restore=(snapshot,build)=>sanitizeBuild({...build,...snapshot});
  return {
    get canUndo(){return past.length>0;},
    get canRedo(){return future.length>0;},
    commit(build){
      const next=designSnapshot(build);
      if(JSON.stringify(next)===JSON.stringify(current))return false;
      past.push(current);if(past.length>limit)past.shift();
      current=next;future.length=0;return true;
    },
    undo(build){
      if(!past.length)return null;
      future.push(current);current=past.pop();return restore(current,build);
    },
    redo(build){
      if(!future.length)return null;
      past.push(current);current=future.pop();return restore(current,build);
    }
  };
}
