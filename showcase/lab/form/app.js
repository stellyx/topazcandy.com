import {PARTS,COLORS,SYSTEMS,GRAPHICS,INK_COLORS,HARDWARE_COLORS,LOOKS,STARTERS,SHOWCASES,RANDOM_LOCKS,CATALOG_DATE,defaultBuild,sanitizeBuild,switchSystem,starterBuild,showcaseBuild,applyLook,randomizeBuild,systemFor,optionsFor,optionFor,colorFor,graphicFor,activeParts,totalFor,effectivePrice,isIncluded,sourceFor,hardwareFor,connectorCount,hasCustomFinish,fitSummary,buildDetails,shopBrief,thumbnail} from './catalog.js';
import {artThumbnail} from './art.js';
import {initScene} from './scene.js';
import {createIdleRotation,IDLE_DELAY} from './motion.js';
import {createWelcomeSequence,WELCOME_DELAY,EXHALE_DELAY,PUFF_DURATION,PUFF_REPEAT_DELAY} from './welcome.js';
import {createDesignHistory} from './history.js';
import {decodeBuild} from './studio.js';
import {initStudioTools,isAnyDialogOpen} from './studio-ui.js';

const byId=id=>document.getElementById(id),STORAGE='form-modular-build-v2',WELCOME_STORAGE='form-beach-welcome-v1',BEACH_STORAGE='form-beach-background-v1';
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
const mobilePreference=window.matchMedia('(max-width: 800px)');
const dataSaver=!!window.navigator?.connection?.saveData;
let reducedMotion=motionPreference.matches,state=showcaseBuild(defaultBuild(),'klein'),viewer=null,viewerFailed=false,assemblyPending=false,toastTimer,snapshot=null,editorMode='component',beachEnabled=true,welcomeSeen=false,welcome=null,videoPlaying=false,videoBlocked=false,ambientPuffTimer=null,puffHideTimer=null;
try {
  beachEnabled=localStorage.getItem(BEACH_STORAGE)!=='off';welcomeSeen=localStorage.getItem(WELCOME_STORAGE)==='seen';
  const saved=localStorage.getItem(STORAGE)||localStorage.getItem('form-modular-build-v1');
  if(saved&&saved.length<10000)state=sanitizeBuild(JSON.parse(saved));
}catch {}
// The arrival flag controls the initial loading presentation. Idle cycles can
// replay the whole grab; shared designs and quiet-mode settings take priority.
if(new URLSearchParams(window.location.search).get('welcome')==='1')welcomeSeen=false;
if(reducedMotion||dataSaver)welcomeSeen=true;
let sharedArrival=false,invalidShare=false;
if(window.location.hash.startsWith('#build='))try{state=decodeBuild(window.location.hash.slice(7));sharedArrival=true;window.history?.replaceState(null,'',window.location.pathname+window.location.search);}catch{invalidShare=true;}
// Arrive in the last design and expansion state. An assembled piece starts its
// showroom turn; interactions pause it until a short idle break.
state.spin=!state.exploded&&!reducedMotion;
// Every visit starts in the whole-piece view, even if a part was picked last time.
state.selected=null;
const history=createDesignHistory(state);
const money=value=>'$'+value.toFixed(2);
function announce(message) {
  clearTimeout(toastTimer);byId('toast').textContent=message;byId('toast').classList.add('show');
  toastTimer=setTimeout(()=>byId('toast').classList.remove('show'),3000);
}
function persist(captureView=true) {if(captureView&&viewer)state.view=viewer.getView();try{localStorage.setItem(STORAGE,JSON.stringify(state))}catch {}}
function markWelcomeSeen(){welcomeSeen=true;try{localStorage.setItem(WELCOME_STORAGE,'seen')}catch{}}
function hideCustomizeHint(){const hint=byId('customize-hint');hint.hidden=true;delete hint.dataset.positioned;byId('stage').dataset.customizeHint='false';}
function canPuff(){return !!viewer&&!viewerFailed&&beachEnabled&&!reducedMotion&&!dataSaver&&!document.hidden&&!isAnyDialogOpen()&&!state.exploded&&!assemblyPending&&(welcome?.active?welcome.phase==='puff':state.spin);}
function showCustomizeHint(){
  if(!canPuff())return;
  byId('customize-hint').hidden=false;byId('stage').dataset.customizeHint='true';
}
function hidePuff(){clearTimeout(ambientPuffTimer);clearTimeout(puffHideTimer);ambientPuffTimer=puffHideTimer=null;viewer?.hideExhale();hideCustomizeHint();}
function showPuff(){
  if(!canPuff())return;
  viewer.showExhale({letters:true,durationMs:PUFF_DURATION});showCustomizeHint();
  clearTimeout(puffHideTimer);puffHideTimer=setTimeout(()=>{hidePuff();if(!welcome?.active)queueIdlePuff(PUFF_REPEAT_DELAY);},PUFF_DURATION);
}
function queueIdlePuff(delayMs=EXHALE_DELAY){
  clearTimeout(ambientPuffTimer);if(!canPuff()||welcome?.active)return;
  viewer.prepareExhale();
  ambientPuffTimer=setTimeout(()=>{
    ambientPuffTimer=null;if(!canPuff()||welcome?.active)return;
    // The quiet interval already supplied the wait. Every available idle cycle
    // grabs and returns the actual pipe before the two-second exhale delay.
    if(viewer.welcomeReady&&welcome.start({delay:0}))return;
    showPuff();
  },delayMs);
}
function syncBackdrop(){
  byId('beach-backdrop').hidden=!beachEnabled;
  const play=beachEnabled&&!reducedMotion&&!dataSaver&&!document.hidden&&!isAnyDialogOpen()&&!viewerFailed&&(welcome?.active||(state.spin&&!state.exploded&&!assemblyPending));
  const video=byId('beach-video');
  if(play&&!videoPlaying&&!videoBlocked){videoPlaying=true;try{const attempt=video.play();attempt?.catch?.(()=>{videoPlaying=false;videoBlocked=true;});}catch{videoPlaying=false;videoBlocked=true;}}
  else if(!play&&videoPlaying){video.pause();videoPlaying=false;}
}
function maybeWelcome(){
  if(welcomeSeen||sharedArrival||!beachEnabled||reducedMotion||dataSaver||document.hidden||viewerFailed||isAnyDialogOpen()||!viewer?.welcomeReady)return;
  if(welcome?.start()===false){markWelcomeSeen();renderMotionControls();}
}
// Update only changed choice grids and retain keyboard focus after a selection.
function setMarkup(id,markup){
  const element=byId(id);if(element.innerHTML===markup)return;
  const active=document.activeElement,key=element.contains?.(active)&&Object.keys(active?.dataset||{}).find(k=>['shape','color','graphic','ink','part'].includes(k)),value=key?active.dataset[key]:null;
  element.innerHTML=markup;
  if(key)element.querySelector('button[data-'+key+'="'+value+'"]')?.focus({preventScroll:true});
}
function selectPart(id) {
  if(id!==null&&!PARTS.some(p=>p.id===id))return;
  const previous=state.selected;
  if(id&&!state.parts[id].enabled)editorMode='component';
  idle.activity();state.selected=id;render();viewer?.selectPart(id);persist();
  // The preview stays put. Only a new part starts at the top of its local editor.
  if(mobilePreference.matches&&previous!==id)byId('builder-scroll').scrollTop=0;
}
function clearSelection({focusView=false}={}){
  if(state.selected!==null)selectPart(null);
  if(focusView)byId('viewport').focus({preventScroll:true});
}
function render() {
  const desk=byId('builder-scroll'),scrollTop=desk.scrollTop;
  const family=systemFor(state),part=PARTS.find(p=>p.id===state.selected),parts=activeParts(state),ink=INK_COLORS.find(i=>i.id===state.ink),hardware=hardwareFor(state);
  byId('system-select').innerHTML=SYSTEMS.map(s=>'<option value="'+s.id+'"'+(s.id===state.system?' selected':'')+'>'+s.name+'</option>').join('');
  byId('system-note').textContent=family.description;
  const systemSource=byId('system-source');systemSource.hidden=!!family.concept;if(family.url)systemSource.href=family.url;
  byId('stage-family').textContent=family.short;
  byId('random-locks').innerHTML=RANDOM_LOCKS.map(l=>'<label class="random-lock '+(state.locks[l.id]?'locked':'')+'"><input type="checkbox" data-lock="'+l.id+'"'+(state.locks[l.id]?' checked':'')+'><span>'+l.name+'</span><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></label>').join('');
  byId('randomize-build').disabled=RANDOM_LOCKS.every(l=>state.locks[l.id]);
  byId('starters-grid').innerHTML=STARTERS.map(s=>{const b=starterBuild(state,s.id);return '<button type="button" data-starter="'+s.id+'" class="starter-card"><strong>'+s.name+'</strong><span>'+s.caption+'</span><em>'+money(totalFor(b))+' reference subtotal</em></button>';}).join('');
  byId('looks-grid').innerHTML=LOOKS.map(l=>{const colors=INK_COLORS.find(i=>i.id===l.ink).colors,active=state.parts.base.graphic===l.graphic&&state.parts.neck.graphic===l.graphic&&state.ink===l.ink;return '<button type="button" data-look="'+l.id+'" class="look-card '+(active?'active':'')+'" aria-pressed="'+active+'">'+artThumbnail(l.graphic,colors)+'<span>'+l.name+'</span></button>';}).join('');
  byId('part-tabs').innerHTML=PARTS.map(p=>'<button type="button" class="part-tab '+(state.selected===p.id?'active ':'')+(!state.parts[p.id].enabled?'removed':'')+'" data-part="'+p.id+'" aria-pressed="'+(state.selected===p.id)+'">'+p.name+'</button>').join('');
  byId('mobile-part-tabs').innerHTML=PARTS.map(p=>'<button type="button" class="mobile-part-tab '+(state.selected===p.id?'active ':'')+(!state.parts[p.id].enabled?'removed':'')+'" data-part="'+p.id+'" aria-pressed="'+(state.selected===p.id)+'">'+p.name+(!state.parts[p.id].enabled?'<span aria-label="Not included">+</span>':'')+'</button>').join('');
  byId('mobile-clear-selection').hidden=!part;byId('studio').dataset.editing=String(!!part);
  renderEditorPanels();
  byId('viewer-price').textContent=money(totalFor(state));
  byId('viewer-price-label').textContent=family.concept?'Sample subtotal':'Reference subtotal';
  setMarkup('viewer-parts',parts.length?parts.map(p=>{const option=optionFor(state,p.id),color=colorFor(state,p.id),art=graphicFor(state,p.id)!=='none';return '<button type="button" class="viewer-part '+(state.selected===p.id?'active':'')+'" data-part="'+p.id+'" style="--part-color:'+color.hex+'" aria-pressed="'+(state.selected===p.id)+'" aria-label="Edit '+p.name.toLowerCase()+': '+option.name+', '+color.name+(art?', with artwork':'')+'" title="'+option.name+' · '+color.name+'"><span class="viewer-part-image" aria-hidden="true">'+thumbnail(option.kind)+'<i></i>'+(art?'<small>✦</small>':'')+'</span><span>'+p.name+'</span></button>';}).join(''):'<span class="summary-empty">No parts yet</span>');
  byId('viewer-part-count').textContent=parts.length?parts.length+' '+(parts.length===1?'part':'parts')+' · tap to edit':'Choose a part below';
  byId('showcase-grid').innerHTML=SHOWCASES.map(s=>{const b=showcaseBuild(state,s.id);return '<button type="button" class="showcase-card" data-showcase="'+s.id+'"><span class="signature-preview" aria-hidden="true"><span class="signature-neck">'+thumbnail(optionFor(b,'neck').kind)+'</span>'+(b.parts.chamber.enabled?'<span class="signature-chamber">'+thumbnail(optionFor(b,'chamber').kind)+'</span>':'')+'<span class="signature-base">'+thumbnail(optionFor(b,'base').kind)+'</span></span><strong>'+s.name+'</strong><small>'+s.caption+'</small></button>';}).join('');
  byId('undo-build').disabled=!history.canUndo;byId('redo-build').disabled=!history.canRedo;
  byId('clear-selection').hidden=!part;byId('selection-overview').hidden=!!part;byId('part-editor').hidden=!part;
  byId('selection-status').textContent=part?part.name+' selected. Press Escape to view the whole piece.':'Viewing the whole piece. No part selected.';
  if(!part)byId('overview-parts').innerHTML=PARTS.map(p=>{const enabled=state.parts[p.id].enabled;return '<button type="button" class="overview-part '+(!enabled?'not-included':'')+'" data-part="'+p.id+'" aria-label="'+(enabled?'Edit ':'Add ')+p.name.toLowerCase()+'">'+thumbnail(optionFor(state,p.id).kind)+'<span><small>'+p.number+' / '+p.name+'</small><strong>'+(enabled?optionFor(state,p.id).name:'Not included')+'</strong><em>'+(enabled?colorFor(state,p.id).name+' color study':'Choose a component')+'</em></span><span class="overview-arrow" aria-hidden="true">'+(enabled?'↗':'+')+'</span></button>';}).join('');
  if(part){
  const selected=state.parts[part.id],option=optionFor(state,part.id),color=colorFor(state,part.id),graphic=GRAPHICS.find(g=>g.id===selected.graphic);
  byId('part-number').textContent=part.number+' / '+part.eyebrow;byId('part-title').textContent=part.name;
  byId('part-description').textContent=selected.enabled?(family.concept?part.description:part.id==='bowl'?'14 mm bowls fit every base in this selection.':'Made for '+family.name+'. Choose a component, then explore its finish.'):'Choose a component to add this part.';
  byId('selected-shape').textContent=selected.enabled?option.name:'Not included';
  byId('toggle-part').innerHTML=(selected.enabled?'Remove':'Add part')+' <span aria-hidden="true">'+(selected.enabled?'−':'+')+'</span>';
  byId('toggle-part').setAttribute('aria-label',(selected.enabled?'Remove ':'Add ')+part.name.toLowerCase());
  setMarkup('shape-grid',optionsFor(state,part.id).map(o=>{const included=o.included&&state.parts.base.enabled&&optionFor(state,'base').includedBowl!==false,price=o.included&&!included?o.standalonePrice:o.price;return '<button type="button" data-shape="'+o.id+'" class="shape-card '+(selected.enabled&&selected.shape===o.id?'active':'')+'" aria-pressed="'+(selected.enabled&&selected.shape===o.id)+'" aria-label="'+o.name+', '+(included?'included with base':'reference price '+money(price))+'">'+thumbnail(o.kind)+(o.decoration?'<span class="art-badge">ART</span>':'')+'<span>'+o.name+'</span><span class="shape-price">'+(included?'Included':money(price))+'</span>'+(o.status==='Check stock'?'<span class="stock-tag">Check stock</span>':'')+'</button>';}).join(''));
  byId('part-source').hidden=!!family.concept;
  byId('source-status').textContent=option.status||'Catalog listed';byId('source-status').classList.toggle('uncertain',option.status==='Check stock');
  if(sourceFor(state,part.id))byId('part-source-link').href=sourceFor(state,part.id);
  byId('source-detail').textContent=option.detail||'';
  byId('selected-color').textContent=color.name;
  setMarkup('color-grid',COLORS.map(c=>'<button type="button" class="color-swatch '+(selected.color===c.id?'active':'')+'" data-color="'+c.id+'" style="--swatch:'+c.hex+';--check-color:'+(c.id==='clear'?'#5a7350':'#fff')+'" aria-label="'+c.name+' glass color study" aria-pressed="'+(selected.color===c.id)+'"'+(!selected.enabled?' disabled':'')+'><span class="color-name">'+c.name+'</span></button>').join(''));
  byId('color-caption').textContent=color.caption;byId('match-colors').disabled=!selected.enabled;
  byId('finish-note').textContent=family.id==='stax'?'STAX catalog parts here are clear. Other tints are color studies for a shop to review.':family.concept?'Color study for your concept.':'Preview tints. The shop confirms the selected part’s actual color and price.';
  byId('selected-graphic').textContent=graphic.name;
  setMarkup('graphic-grid',GRAPHICS.map(g=>'<button type="button" data-graphic="'+g.id+'" class="graphic-card '+(selected.graphic===g.id?'active':'')+'" aria-pressed="'+(selected.graphic===g.id)+'"'+(!selected.enabled?' disabled':'')+'>'+artThumbnail(g.id,ink.colors)+'<span>'+g.name+'</span></button>').join(''));
  byId('graphic-note').textContent=selected.graphic==='catalog'?(option.decoration?'Simplified catalog motif. Open the actual part for the exact print and color.':'This component has no catalog artwork. Choose an original graphic to explore a custom finish.'):selected.graphic==='none'?graphic.caption:graphic.caption+' Original art concept; shop confirms finish and quotes it separately.';
  byId('ink-section').hidden=graphicFor(state,part.id)==='none';byId('selected-ink').textContent=ink.name;
  setMarkup('ink-grid',INK_COLORS.map(i=>'<button type="button" data-ink="'+i.id+'" class="ink-card '+(state.ink===i.id?'active':'')+'" aria-label="'+i.name+' ink palette" aria-pressed="'+(state.ink===i.id)+'"><span class="ink-dots">'+i.colors.map(c=>'<i style="background:'+c+'"></i>').join('')+'</span><span>'+i.name+'</span></button>').join(''));
  }
  byId('connector-count').textContent=connectorCount(state)+' joint'+(connectorCount(state)===1?'':'s');
  byId('hardware-list').innerHTML=hardware.length?hardware.map(h=>'<div class="hardware-item"><span>'+h.quantity+' × '+h.name+'</span><a href="'+h.url+'" target="_blank" rel="noopener noreferrer" aria-label="View '+h.name+' source">'+(h.included?'Included':h.unitPrice===null?'Shop quote':money(h.unitPrice*h.quantity))+' ↗</a></div>').join(''):'<p class="finish-note">'+(family.concept?'Concept collars are part of the illustration.':'No separate supporting parts for this partial build.')+'</p>';
  byId('hardware-colors').innerHTML=HARDWARE_COLORS.map(c=>'<button type="button" data-hardware="'+c.id+'" class="hardware-swatch '+(state.hardware===c.id?'active':'')+'" style="--swatch:'+c.hex+'" aria-label="'+c.name+' connector color study" aria-pressed="'+(state.hardware===c.id)+'"></button>').join('');
  byId('hardware-note').textContent=family.id==='stax'?'34 mm clamps secure STAX joints. Clamp price and actual colors need shop confirmation.':family.id==='prism'?'Classic Halo rings only. Shop checks bundle inclusions and downstem length. Connector color is a study.':'Illustrated concept hardware.';
  const fit=fitSummary(state);byId('fit-title').textContent=fit.title;byId('fit-dot').classList.toggle('incomplete',!fit.complete);byId('fit-connection').textContent=fit.connection;byId('fit-note').textContent=fit.note;byId('fit-stock').textContent=(fit.uncertain.length?'Confirm stock: '+fit.uncertain.join(', ')+'. ':'')+(fit.finish?'Color and artwork are finish proposals. ':'')+'The shop confirms exact variants, fit and final price.';
  byId('composition').innerHTML=parts.length?parts.map(p=>'<button type="button" class="composition-chip" data-part="'+p.id+'" aria-label="Edit '+p.name.toLowerCase()+'"><span class="chip-dot" style="background:'+colorFor(state,p.id).hex+'"></span>'+optionFor(state,p.id).name+(graphicFor(state,p.id)!=='none'?'<span class="chip-art" aria-label="Has artwork">✦</span>':'')+'</button>').join(''):'<span class="composition-chip">Your blank canvas</span>';
  for(const id of ['parts-count','composition-count'])byId(id).textContent=parts.length+' '+(parts.length===1?'part':'parts');
  byId('build-counter').textContent=String(parts.length).padStart(2,'0');
  const price=totalFor(state).toFixed(2).split('.');byId('total').innerHTML='$'+price[0]+'<span>.'+price[1]+'</span>';
  byId('total-label').textContent=family.concept?'Sample concept total':'Catalog parts subtotal';
  byId('pricing-note').textContent=family.concept?'Sample components & prices. Design concept only.':'Reference pricing · '+(family.id==='stax'?'clamps, ':'')+'art, assembly, shipping & tax quoted by shop.';
  byId('review-build').disabled=!parts.length;
  byId('stage').classList.toggle('light',state.background==='light');
  byId('stage').classList.toggle('beach',beachEnabled);
  for(const mode of ['dark','light','beach']){const active=mode==='beach'?beachEnabled:!beachEnabled&&state.background===mode,button=byId(mode+'-background');button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
  renderMotionControls();
  desk.scrollTop=scrollTop;
}
function renderEditorPanels(){
  const mobile=mobilePreference.matches;
  byId('edit-tabs').hidden=!mobile||!state.selected;
  for(const mode of ['component','color','art']){
    const active=mode===editorMode,tab=byId('edit-'+mode),panel=byId(mode+'-panel');
    tab.setAttribute('aria-selected',String(active));tab.setAttribute('tabindex',active?'0':'-1');
    panel.hidden=mobile&&!active;panel.setAttribute('role',mobile?'tabpanel':'group');panel.setAttribute('aria-labelledby','edit-'+mode);
  }
}
function chooseEditor(mode){
  if(!state.selected||!['component','color','art'].includes(mode))return;
  idle.activity();editorMode=mode;renderEditorPanels();byId('builder-scroll').scrollTop=0;
}
function renderMotionControls(){
  const turning=state.spin&&!state.exploded&&!reducedMotion;
  byId('stage').dataset.turning=String(turning);
  const welcoming=!!welcome?.active,pending=!welcomeSeen&&!sharedArrival&&beachEnabled&&!reducedMotion&&!dataSaver&&!viewerFailed&&!welcoming;
  byId('stage').dataset.welcome=String(welcoming);byId('stage').dataset.welcomePending=String(pending);byId('skip-welcome').hidden=!welcoming&&!pending;
  const smoking=turning&&['base','neck','bowl'].every(id=>state.parts[id].enabled);
  byId('motion-status').textContent=viewerFailed?'Your design can still be saved':welcoming?'A little beach break':assemblyPending?'Reassembling…':state.exploded?'Expanded · pick a part':reducedMotion?'Reduced motion · drag to explore':turning?'Slow spin'+(smoking?' · smoke':''):'Paused · resumes after '+IDLE_DELAY/1000+'s idle';
  const picked=PARTS.find(p=>p.id===state.selected);byId('mobile-guide-title').textContent=welcoming||pending?'A little beach break. Make it yours.':assemblyPending?'Reassembling your design…':picked?'Editing '+picked.name.toLowerCase():'Tap a part to edit · drag to rotate';byId('mobile-guide-detail').textContent=welcoming||pending?'Tap any part to start playing':picked?'Live preview · × finishes':state.exploded?'Pick a separated part':'Pinch to zoom';
  const explode=byId('explode-view');explode.classList.toggle('active',state.exploded);explode.setAttribute('aria-pressed',String(state.exploded));explode.querySelector('span').textContent=assemblyPending?'Assembling…':state.exploded?'Assemble':'Disassemble';explode.setAttribute('aria-label',state.exploded?'Assemble the piece, then rotate and smoke':'Disassemble the piece to explore its parts');
  explode.disabled=viewerFailed||assemblyPending;byId('reset-view').disabled=viewerFailed;
  syncBackdrop();
}
function startShowroom(){
  state.selected=null;viewer?.selectPart(null);
  if(state.exploded){state.exploded=false;state.spin=false;assemblyPending=true;render();viewer?.setExploded(false);persist();}
  else {state.spin=true;render();viewer?.update(state,false);persist();queueIdlePuff();}
}
function finishShowroomAssembly(){
  if(!assemblyPending)return;assemblyPending=false;
  if(reducedMotion||document.hidden||isAnyDialogOpen()||viewerFailed){state.spin=false;renderMotionControls();idle.refresh();persist();return;}
  state.spin=true;renderMotionControls();viewer?.update(state,false);persist();queueIdlePuff();
}
const idle=createIdleRotation({
  isPaused:()=>!state.spin,
  isBlocked:()=>welcome?.active||assemblyPending||reducedMotion||document.hidden||isAnyDialogOpen()||viewerFailed,
  onPause:()=>{hideCustomizeHint();markWelcomeSeen();welcome?.activity();hidePuff();const changing=state.spin||assemblyPending;assemblyPending=false;if(changing){state.spin=false;renderMotionControls();viewer?.update(state,false);persist();}else renderMotionControls();},
  onResume:startShowroom
});
function changeGeometry({record=true}={}) {idle.activity();if(record)history.commit(state);render();viewer?.update(state,true);persist();}
function stepHistory(direction){
  const next=history[direction](state);if(!next)return;
  state=next;changeGeometry({record:false});announce(direction==='undo'?'Design edit undone':'Design edit restored');
}
byId('undo-build').addEventListener('click',()=>stepHistory('undo'));
byId('redo-build').addEventListener('click',()=>stepHistory('redo'));
byId('clear-selection').addEventListener('click',()=>clearSelection({focusView:true}));
byId('mobile-clear-selection').addEventListener('click',()=>clearSelection({focusView:true}));
byId('system-select').addEventListener('change',e=>{state=switchSystem(state,e.target.value);changeGeometry();announce('A fresh, compatible '+systemFor(state).name+' build')});
byId('randomize-build').addEventListener('click',()=>{state=randomizeBuild(state);changeGeometry();announce('Parts, colors and art shuffled within '+systemFor(state).name)});
byId('random-locks').addEventListener('change',e=>{const id=e.target.dataset.lock;if(!RANDOM_LOCKS.some(l=>l.id===id))return;idle.activity();state.locks[id]=e.target.checked;e.target.closest('.random-lock')?.classList.toggle('locked',state.locks[id]);byId('randomize-build').disabled=RANDOM_LOCKS.every(l=>state.locks[l.id]);persist();});
byId('starters-grid').addEventListener('click',e=>{const button=e.target.closest('[data-starter]');if(!button)return;state=starterBuild(state,button.dataset.starter);changeGeometry();announce('Starter setup applied within '+systemFor(state).name)});
byId('showcase-grid').addEventListener('click',e=>{const button=e.target.closest('[data-showcase]');if(!button)return;state=showcaseBuild(state,button.dataset.showcase);changeGeometry();announce('Signature design loaded from real modular catalog parts')});
byId('looks-grid').addEventListener('click',e=>{const b=e.target.closest('[data-look]');if(!b)return;state=applyLook(state,b.dataset.look);changeGeometry();announce('Original art concept applied. The shop can quote the finish.')});
byId('part-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-part]');if(b)selectPart(state.selected===b.dataset.part?null:b.dataset.part)});
byId('mobile-part-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-part]');if(b)selectPart(state.selected===b.dataset.part?null:b.dataset.part)});
byId('viewer-parts').addEventListener('click',e=>{const b=e.target.closest('[data-part]');if(b)selectPart(state.selected===b.dataset.part?null:b.dataset.part)});
byId('edit-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-edit]');if(b)chooseEditor(b.dataset.edit)});
byId('edit-tabs').addEventListener('keydown',e=>{
  const modes=['component','color','art'],index=modes.indexOf(editorMode);
  const next=e.key==='ArrowRight'?(index+1)%3:e.key==='ArrowLeft'?(index+2)%3:e.key==='Home'?0:e.key==='End'?2:null;
  if(next===null)return;e.preventDefault();chooseEditor(modes[next]);byId('edit-'+modes[next]).focus({preventScroll:true});
});
byId('overview-parts').addEventListener('click',e=>{const b=e.target.closest('[data-part]');if(b)selectPart(b.dataset.part)});
byId('composition').addEventListener('click',e=>{const b=e.target.closest('[data-part]');if(b)selectPart(b.dataset.part)});
byId('shape-grid').addEventListener('click',e=>{const b=e.target.closest('[data-shape]');if(!b||!state.selected)return;state.parts[state.selected].shape=b.dataset.shape;state.parts[state.selected].enabled=true;state.parts[state.selected].graphic='catalog';changeGeometry()});
byId('color-grid').addEventListener('click',e=>{const b=e.target.closest('[data-color]');if(!b||b.disabled||!state.selected)return;state.parts[state.selected].color=b.dataset.color;changeGeometry()});
byId('graphic-grid').addEventListener('click',e=>{const b=e.target.closest('[data-graphic]');if(!b||b.disabled||!state.selected)return;state.parts[state.selected].graphic=b.dataset.graphic;changeGeometry()});
byId('ink-grid').addEventListener('click',e=>{const b=e.target.closest('[data-ink]');if(!b||!state.selected)return;state.ink=b.dataset.ink;changeGeometry()});
byId('hardware-colors').addEventListener('click',e=>{const b=e.target.closest('[data-hardware]');if(!b)return;state.hardware=b.dataset.hardware;changeGeometry()});
byId('toggle-part').addEventListener('click',()=>{if(!state.selected)return;const s=state.parts[state.selected];s.enabled=!s.enabled;changeGeometry();announce(PARTS.find(p=>p.id===state.selected).name+(s.enabled?' added to your build':' removed from your build'))});
byId('match-colors').addEventListener('click',()=>{if(!state.selected)return;const color=state.parts[state.selected].color;for(const p of PARTS)state.parts[p.id].color=color;changeGeometry();announce('All color studies matched in '+COLORS.find(c=>c.id===color).name.toLowerCase())});
for(const mode of ['dark','light','beach'])byId(mode+'-background').addEventListener('click',()=>{idle.activity();beachEnabled=mode==='beach';if(mode!=='beach')state.background=mode;else videoBlocked=false;try{localStorage.setItem(BEACH_STORAGE,beachEnabled?'on':'off')}catch{}render();viewer?.update(state,false);persist()});
byId('skip-welcome').addEventListener('click',()=>{idle.activity();byId('viewport').focus({preventScroll:true});});
function customizeFromHint(e){
  if(byId('customize-hint').hidden)return;
  e?.preventDefault?.();selectPart('base');byId('viewport').focus({preventScroll:true});
}
// Pointerdown starts editing before dismissing the short-lived prompt can remove
// its click target. The click handler also supports Enter, Space and assistive UI.
byId('customize-hint').addEventListener('pointerdown',e=>{if(e.button===undefined||e.button===0)customizeFromHint(e);});
byId('customize-hint').addEventListener('click',customizeFromHint);
byId('explode-view').addEventListener('click',()=>{idle.activity();if(state.exploded)startShowroom();else{state.exploded=true;state.spin=false;render();viewer?.setExploded(true);persist();}idle.refresh()});
byId('reset-view').addEventListener('click',()=>{idle.activity();viewer?.resetView();persist()});
byId('reset-build').addEventListener('click',()=>{state=applyLook(defaultBuild(),'cosmic');if(reducedMotion)state.spin=false;changeGeometry();viewer?.resetView();announce('A fresh start with Prism Classic. Make it yours.')});
byId('viewport').addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key)){e.preventDefault();idle.activity();viewer?.nudge(e.key);persist()}});

const heldPointers=new Map(),inStudio=e=>!!e.target?.closest?.('.studio, dialog, #reset-build');
document.addEventListener('pointerdown',e=>{if(!inStudio(e))return;const options={pause:true};heldPointers.set(e.pointerId,options);idle.hold(options);},{capture:true});
window.addEventListener('pointerup',e=>{const options=heldPointers.get(e.pointerId);if(!options)return;heldPointers.delete(e.pointerId);if(!heldPointers.size)idle.release(options);},{capture:true});
window.addEventListener('pointercancel',e=>{heldPointers.delete(e.pointerId);if(!heldPointers.size)idle.release();},{capture:true});
// User scrolling is covered by wheel, pointer and key events. Layout-driven
// scroll adjustments must not immediately interrupt an idle showroom restart.
for(const event of ['pointermove','wheel','keydown','input','change'])document.addEventListener(event,e=>{if(event==='pointermove'&&!heldPointers.size)return;if(inStudio(e))idle.activity();},{capture:true,passive:event!=='keydown'});
document.addEventListener('visibilitychange',()=>{if(document.hidden){welcome?.stop('hidden');hidePuff();heldPointers.clear();idle.release();persist();}else maybeWelcome();syncBackdrop();idle.refresh();});
window.addEventListener('pagehide',()=>persist());
motionPreference.addEventListener?.('change',e=>{reducedMotion=e.matches;if(reducedMotion){welcome?.stop('reduced-motion');hidePuff();assemblyPending=false;state.spin=false;}renderMotionControls();viewer?.update(state,false);idle.refresh();persist()});
function arrangeDesk(){for(const id of ['desk-options','build-details','part-source'])byId(id).open=!mobilePreference.matches;byId('art-options').open=true;renderEditorPanels();}
mobilePreference.addEventListener?.('change',arrangeDesk);

const dialog=byId('review-dialog');
document.addEventListener('keydown',e=>{
  if(e.defaultPrevented||isAnyDialogOpen())return;
  if(e.key==='Escape'&&(welcome?.active||byId('stage').dataset.welcomePending==='true')){e.preventDefault();idle.activity();byId('viewport').focus({preventScroll:true});return;}
  if(e.key==='Escape'&&state.selected!==null){e.preventDefault();clearSelection({focusView:true});return;}
  if(e.target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)||e.altKey||!(e.ctrlKey||e.metaKey))return;
  const key=e.key.toLowerCase(),direction=key==='z'?(e.shiftKey?'redo':'undo'):key==='y'&&e.ctrlKey?'redo':null;
  if(direction&&history[direction==='undo'?'canUndo':'canRedo']){e.preventDefault();stepHistory(direction);}
});
byId('review-build').addEventListener('click',()=>{
  idle.activity();
  try{snapshot=viewer?.capture()||null}catch{snapshot=null}
  const image=byId('review-image');image.parentElement.hidden=!snapshot;if(snapshot)image.src=snapshot;
  const parts=activeParts(state),family=systemFor(state),hardware=hardwareFor(state);
  byId('review-system').textContent=family.name+' · '+family.connection;
  byId('review-parts').innerHTML=parts.map(p=>'<div class="review-part"><span class="chip-dot" style="background:'+colorFor(state,p.id).hex+'"></span><span class="part-name">'+optionFor(state,p.id).name+'<small>'+p.name+' · '+colorFor(state,p.id).name+' color study</small></span><strong>'+(isIncluded(state,p.id)?'Included':money(effectivePrice(state,p.id)))+'</strong></div>').join('');
  byId('review-hardware').innerHTML=hardware.map(h=>'<div class="hardware-item"><span>'+h.quantity+' × '+h.name+'</span><span>'+(h.included?'Included':h.unitPrice===null?'Shop quote':money(h.quantity*h.unitPrice))+'</span></div>').join('');
  byId('review-total-label').textContent=family.concept?'Sample total':'Catalog parts subtotal';byId('review-total').textContent=money(totalFor(state));
  const missing=PARTS.filter(p=>p.id!=='chamber'&&!state.parts[p.id].enabled).map(p=>p.name.toLowerCase());
  byId('review-status').textContent=missing.length?'This build is missing '+missing.join(', ')+'. Save the idea or keep building.':'Ready for manual shop review. Stock, exact variants, fit, and final price still need confirmation.';
  byId('review-finish').textContent=(hasCustomFinish(state)?'Color and original artwork are design proposals. The shop confirms available finishes and how artwork can be applied. ':'Catalog motifs are simplified in this preview. ')+(family.concept?'Concept shapes and prices are samples.':'Reference prices vary by variant or sale. Artwork, assembly, shipping, tax'+(family.id==='stax'?', and unpriced clamps':'')+' are excluded; bundle inclusions may reduce the subtotal.');
  byId('save-image').disabled=!snapshot;dialog.showModal();idle.refresh();
});
byId('close-review').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>idle.activity());
dialog.addEventListener('click',e=>{const box=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom))dialog.close()});
function download(blob,name) {
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
byId('save-build').addEventListener('click',()=>{download(new Blob([JSON.stringify(buildDetails(state),null,2)],{type:'application/json'}),'form-your-build.json');announce('Your build details are ready')});
byId('print-build').addEventListener('click',()=>window.print());
byId('save-brief').addEventListener('click',()=>{download(new Blob([shopBrief(state)],{type:'text/plain;charset=utf-8'}),'form-shop-brief.txt');announce('Your shop brief is ready, with parts and source links')});
byId('save-image').addEventListener('click',async()=>{
  if(!snapshot)return;
  try{
    const image=new Image();image.src=snapshot;await image.decode();
    const canvas=document.createElement('canvas'),parts=activeParts(state),family=systemFor(state);canvas.width=1000;canvas.height=1410;const ctx=canvas.getContext('2d');
    ctx.fillStyle='#f5f4ef';ctx.fillRect(0,0,1000,1410);ctx.fillStyle='#22321e';ctx.font='bold 55px Arial';ctx.fillText('form.',55,83);
    ctx.font='14px Arial';ctx.fillStyle='#7d8d70';ctx.fillText('YOUR PIECE. YOUR RULES.',610,75);
    ctx.drawImage(image,35,118,930,930);
    ctx.fillStyle='#22321e';ctx.font='22px Arial';ctx.fillText(family.name+' / Your original',55,1100);
    ctx.font='13px Arial';ctx.fillStyle='#7d8d70';ctx.fillText('Illustrated preview · colors & artwork subject to shop confirmation',55,1132);
    for(let i=0;i<parts.length;i++){const p=parts[i],x=i%2?515:55,y=1170+Math.floor(i/2)*59;ctx.fillStyle=colorFor(state,p.id).hex;ctx.beginPath();ctx.arc(x+6,y-5,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#334d2b';ctx.font='16px Arial';ctx.fillText(optionFor(state,p.id).name,x+24,y);ctx.fillStyle='#7d8d70';ctx.font='12px Arial';ctx.fillText(p.name+' / '+colorFor(state,p.id).name+' / '+GRAPHICS.find(g=>g.id===state.parts[p.id].graphic).name,x+24,y+20);}
    ctx.fillStyle='#334d2b';ctx.font='16px Arial';ctx.fillText('Catalog subtotal '+money(totalFor(state))+' · '+connectorCount(state)+' stack joints',55,1308);
    ctx.fillStyle='#7d8d70';ctx.font='12px Arial';ctx.fillText('Manual shop quote for supporting parts, finishes, assembly, shipping & tax.',55,1334);
    ctx.fillStyle='#8a987d';ctx.font='11px Arial';ctx.fillText('Catalog reviewed '+CATALOG_DATE,55,1381);ctx.textAlign='right';ctx.fillText('FORM / DESIGN STUDIO',945,1381);
    canvas.toBlob(blob=>{if(blob){download(blob,'form-your-design.png');announce('Your design is ready to keep')}},'image/png');
  }catch{announce('The image could not be saved. Your shop brief is still available.')}
});
byId('beach-video').addEventListener('error',()=>{videoPlaying=false;videoBlocked=true;});
welcome=createWelcomeSequence({
  isBlocked:()=>reducedMotion||dataSaver||document.hidden||isAnyDialogOpen()||viewerFailed||!beachEnabled,
  onStart:()=>{if(!viewer?.startWelcome())return false;markWelcomeSeen();renderMotionControls();idle.refresh();return true;},
  onGrab:()=>viewer?.grabWelcome(),onPuff:showPuff,
  onFinish:reason=>{viewer?.stopWelcome();hidePuff();renderMotionControls();idle.refresh();if(reason==='finished')queueIdlePuff(PUFF_REPEAT_DELAY);}
});
hideCustomizeHint();
arrangeDesk();render();
try {
  viewer=initScene(byId('viewport'),state,{onSelect:selectPart,onInteraction:()=>idle.activity(),onAssembled:finishShowroomAssembly,onViewChange:view=>{state.view=view;persist(false)},isReducedMotion:()=>reducedMotion,isBeach:()=>beachEnabled,backgroundVideo:byId('beach-video'),smokeVideo:byId('smoke-letter-video'),enableWelcome:!reducedMotion&&!dataSaver&&beachEnabled,onWelcomeReady:maybeWelcome,onWelcomeReturned:()=>welcome?.returned(),onWelcomeInterrupted:()=>welcome?.activity(),onWelcomeUnavailable:()=>{markWelcomeSeen();renderMotionControls();}});
  byId('loading').remove();
  persist();maybeWelcome();
}catch(error){
  byId('loading').remove();byId('fallback').hidden=false;viewerFailed=true;state.spin=false;renderMotionControls();idle.refresh();
  console.error('FORM viewer unavailable',error);
}
byId('viewport').addEventListener('viewer-lost',()=>{viewerFailed=true;welcome?.stop('viewer-lost');hidePuff();assemblyPending=false;state.spin=false;byId('fallback').hidden=false;renderMotionControls();idle.refresh();announce('Reload the page to restore the viewer')});
window.FORM={getBuild:()=>buildDetails(state)};
initStudioTools({getBuild:()=>{persist();return sanitizeBuild(state);},onLoad:build=>{const savedView=build.view;state=build;state.selected=null;state.spin=false;changeGeometry();viewer?.restoreView(savedView);persist();},onActivity:()=>idle.activity(),announce,capture:size=>viewer?.capture(size)||null,download});
idle.refresh();
if(welcomeSeen&&!sharedArrival&&!welcome.active&&state.spin&&!state.exploded)queueIdlePuff(WELCOME_DELAY);
if(sharedArrival)announce('Shared design loaded. Make it yours.');else if(invalidShare)announce('That build link is invalid. Your saved design is still here.');
