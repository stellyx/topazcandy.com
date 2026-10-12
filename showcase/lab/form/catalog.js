export const COLORS = [
  { id:'clear', name:'Clear', hex:'#d2e1dd', caption:'Nothing to hide.' },
  { id:'sage', name:'Sage', hex:'#a5c69a', caption:'Soft color. Clear character.' },
  { id:'amber', name:'Amber', hex:'#c8a069', caption:'A little golden hour.' },
  { id:'rose', name:'Rose', hex:'#c09da8', caption:'A softer kind of statement.' },
  { id:'blue', name:'Cloud blue', hex:'#8cacc2', caption:'Your own patch of sky.' },
  { id:'plum', name:'Lilac', hex:'#ae94bf', caption:'A little unexpected.' },
  { id:'smoke', name:'Smoke', hex:'#778b87', caption:'Understated, by design.' },
  { id:'ink', name:'Forest', hex:'#4b685c', caption:'Deep roots. Good taste.' }
];
export const PARTS = [
  {id:'base', name:'Base', number:'01', eyebrow:'FOUNDATION', description:'Start from solid ground.', default:'beaker', options:[
    {id:'beaker', name:'Beaker', price:60, height:2.03, kind:'beaker'},
    {id:'bubble', name:'Bubble', price:65, height:2.03, kind:'bubble'},
    {id:'column', name:'Column', price:55, height:2.03, kind:'column'}
  ]},
  {id:'chamber', name:'Chamber', number:'02', eyebrow:'A LITTLE EXTRA', description:'Add another layer of personality.', default:'spiral', options:[
    {id:'honeycomb', name:'Honeycomb', price:35, height:1.17, kind:'honeycomb'},
    {id:'spiral', name:'Spiral', price:45, height:1.17, kind:'spiral'},
    {id:'tree', name:'Tree', price:50, height:1.17, kind:'tree'}
  ]},
  {id:'neck', name:'Mouthpiece', number:'03', eyebrow:'THE FINISHING TOUCH', description:'A new angle on your everyday.', default:'bent', options:[
    {id:'straight', name:'Straight', price:24, height:1.70, kind:'straight'},
    {id:'bent', name:'Bent', price:29, height:1.70, kind:'bent'},
    {id:'flared', name:'Flared', price:32, height:1.70, kind:'flared'}
  ]},
  {id:'bowl', name:'Bowl', number:'04', eyebrow:'SMALL DETAILS', description:'Small part. Big personality.', default:'classic', options:[
    {id:'classic', name:'Classic', price:12, height:.6, kind:'classic'},
    {id:'wide', name:'Wide', price:16, height:.6, kind:'wide'},
    {id:'loop', name:'Loop', price:20, height:.6, kind:'loop'}
  ]}
];
// Public manufacturer catalogs reviewed 2026-10-11. These are catalog references,
// not synchronized inventory. Illustrated colors and original art need a shop quote.
export const CATALOG_DATE='2026-10-11';
const prism=slug=>'https://prismwaterpipes.com/products/'+slug;
const grav=slug=>'https://grav.com/products/'+slug;
const product=(id,name,price,kind,url,extra={})=>({id,name,price,kind,url,status:'Catalog listed',...extra});
const cup=product('cup-14','14 mm Cup',9.99,'wide',grav('14mm-grav-cup-bowl-clear'),{manufacturer:'GRAV',joint:14,detail:'A 14 mm male bowl for a 14 mm female intake.'});
export const SYSTEMS=[
  {id:'prism',name:'Prism Classic',short:'PRISM / CLASSIC',description:'Classic parts connect with Classic Halo rings. Decorated catalog options are marked ART.',connection:'Prism Classic Halo',url:'https://prismwaterpipes.com/collections/individual-parts',defaults:{base:'prism-beaker',chamber:'prism-shower',neck:'prism-bent',bowl:'prism-included'},options:{
    base:[
      product('prism-beaker','Beaker',64.99,'beaker',prism('beaker-base'),{height:2.03,downstem:true,status:'Check stock',detail:'Includes a clear 14 mm bowl and downstem. Classic Halos are separate. Stock differs by color; shop confirms the variant.'}),
      product('prism-straight','Straight tube',64.99,'column',prism('straight-tube-base'),{height:2.03,downstem:true,detail:'Straight body with a wide foot. Includes a clear 14 mm bowl and downstem.'}),
      product('prism-honey','Big honeycomb',89.99,'honey-base',prism('big-honeycomb-base'),{height:2.03,downstem:false,detail:'Built-in honeycomb filtration. Includes a clear 14 mm bowl; no separate downstem required.'}),
      product('prism-skull-base','Skull beaker',79.98,'beaker',prism('skull-beaker-base'),{height:2.03,downstem:true,decoration:'skull',detail:'Includes a clear 14 mm bowl and downstem. Preview uses a simplified skull motif; see the product for exact art.'}),
      product('prism-klein','Klein recycler',134.98,'klein-base',prism('klein-incycler-base'),{height:2.20,includedBowl:false,bangerIncluded:true,detail:'Classic Klein incycler with an internal funnel and external return loop. Includes a 45° 14 mm banger and carb cap. The flower bowl shown here is an extra; Classic Halos are separate. Illustrative model.'})
    ],
    chamber:[
      product('prism-shower','Showerhead',49.99,'shower',prism('showerhead-percolator'),{height:1.17,detail:'An optional Classic showerhead chamber. Requires another Halo connection.'}),
      product('prism-big-shower','Big showerhead',64.99,'shower',prism('big-showerhead-percolator'),{height:1.50,detail:'A larger Classic showerhead chamber. Halos are purchased separately.'}),
      product('prism-big-tree','Big tree',64.99,'tree',prism('big-tree-percolator'),{height:1.50,detail:'A taller Classic tree chamber. Illustrated proportions only.'}),
      product('prism-glow','Glow big tree',74.98,'tree',prism('glow-big-tree-perc'),{height:1.50,decoration:'flash',detail:'A catalog decorated chamber. Preview motif is illustrative; check the actual print with the supplier.'})
    ],
    neck:[
      product('prism-standard','Standard',34.99,'straight',prism('standard-mouthpiece'),{height:1.70,detail:'Classic straight mouthpiece with an ice pinch.'}),
      product('prism-tall','Tall',54.98,'straight',prism('tall-mouthpiece'),{height:2.35,detail:'A taller Classic mouthpiece with an ice pinch.'}),
      product('prism-bent','Bent',44.98,'bent',prism('bent-mouthpiece'),{height:1.70,detail:'Angled Classic mouthpiece. This version does not fit Prism MINI.'}),
      product('prism-skull','Skull standard',47.48,'straight',prism('skull-standard-mouthpiece'),{height:1.70,decoration:'skull',detail:'A catalog decorated mouthpiece. The simplified motif here is not the manufacturer’s exact artwork.'}),
      product('prism-flower','Flower Power',47.48,'straight',prism('flower-power-standard-mouthpiece'),{height:1.70,decoration:'flower',detail:'A catalog decorated mouthpiece. Open the manufacturer listing for the exact design.'})
    ],
    bowl:[product('prism-included','Classic 14 mm',0,'classic',prism('14mm-bowl'),{height:.6,joint:14,included:true,standalonePrice:12.49,detail:'A clear 14 mm male bowl is included with the standard Classic bases here. The Klein base includes a banger set instead, so a flower bowl costs extra.'}),product('prism-bowl','Extra Prism bowl',12.49,'classic',prism('14mm-bowl'),{height:.6,joint:14,detail:'An additional 14 mm male bowl. The selected base already includes a clear bowl.'}),{...cup,height:.6}]
  }},
  {id:'stax',name:'GRAV STAX',short:'GRAV / STAX',description:'STAX parts use 34 mm glass stack joints. Clear glass and 14 mm bowl intakes.',connection:'STAX 34 mm joint + clamp',url:'https://grav.com/collections/stax',defaults:{base:'stax-straight',chamber:'stax-coil',neck:'stax-angled',bowl:'stax-included'},options:{
    base:[
      product('stax-straight','Straight base',99.99,'column',grav('7-stax-straight-base-w-angled-joint-clear'),{height:2.03,downstem:true,detail:'Includes a 14 mm funnel bowl and showerhead downstem. Clear glass.'}),
      product('stax-beaker','Beaker base',124.99,'beaker',grav('7-stax-beaker-base-clear'),{height:2.03,downstem:true,status:'Check stock',detail:'Includes a 14 mm funnel bowl and showerhead downstem. Manufacturer stock snapshots differ; confirm before quoting.'}),
      product('stax-turbine','Turbine base',124.99,'turbine-base',grav('7-stax-turbine-base-clear'),{height:2.03,detail:'A turbine disc base with a 14 mm funnel bowl included. Clear glass.'}),
      product('stax-coil-base','Coil showerhead',149.99,'coil-base',grav('grav-stax-coil-showerhead-base'),{height:2.20,detail:'A sculptural internal coil above a showerhead. Includes a 14 mm funnel bowl. Fits STAX chambers and mouthpieces; preview proportions are illustrative.'})
    ],
    chamber:[
      product('stax-coil','Coil',79.99,'spiral',grav('7-stax-coil-perc-clear'),{height:1.85,detail:'A clear coil chamber compatible with other STAX bases, chambers, and mouthpieces.'}),
      product('stax-tree','Tree',79.99,'tree',grav('7-stax-tree-perc-clear'),{height:1.70,detail:'An eight-arm clear tree chamber, made for the STAX family.'}),
      product('stax-halo','Halo',79.99,'halo',grav('grav-stax-halo-perc'),{height:1.50,detail:'A forked glass halo chamber for the STAX family.'}),
      product('stax-circle','Circle',79.99,'circle',grav('7-stax-circle-perc-clear'),{height:1.70,detail:'A ring of glass diffusion slits inside a clear STAX chamber.'})
    ],
    neck:[
      product('stax-angled','Angled',29.99,'bent',grav('grav-stax-angled-mouthpiece'),{height:1.70,detail:'A clear angled mouthpiece for any STAX base or chamber.'}),
      product('stax-pinch','Triple pinch',39.99,'straight',grav('grav-stax-triple-pinch-mouthpiece'),{height:2.20,detail:'Straight mouthpiece with three ice pinches and a 34 mm STAX connection.'}),
      product('stax-helix','Helix',79.99,'helix',grav('grav-stax-helix-mouthpiece'),{height:1.90,detail:'A Venturi-shaped mouthpiece with a 34 mm STAX joint. Illustration is approximate.'}),
      product('stax-trumpet','Trumpet + adapter',39.99,'trumpet',grav('9-stax-trumpet-mouthpiece-and-adapter-clear'),{height:2.30,adapterIncluded:true,detail:'A long flared trumpet with a 19 mm male joint. Its supplied 34 mm → 19 mm reduction adapter is required and is shown below the stem.'})
    ],
    bowl:[product('stax-included','Included funnel',0,'classic',grav('14mm-grav-funnel-bowl-clear'),{height:.6,joint:14,included:true,standalonePrice:9.99,detail:'A 14 mm funnel bowl is included with each STAX base in this selection.'}),{...cup,height:.6}]
  }},
  {id:'form',name:'FORM concepts',short:'FORM / CONCEPT',description:'The original design playground. Sample shapes and prices for exploring an idea.',connection:'Concept collar',concept:true,defaults:Object.fromEntries(PARTS.map(p=>[p.id,p.default])),options:Object.fromEntries(PARTS.map(p=>[p.id,p.options]))}
];
export const HARDWARE_COLORS=[{id:'gold',name:'Gold',hex:'#c1a47b'},{id:'black',name:'Black',hex:'#343b37'},{id:'silver',name:'Silver',hex:'#acb7ba'},{id:'purple',name:'Purple',hex:'#9176c5'},{id:'aqua',name:'Aqua',hex:'#59b8ae'}];
export const INK_COLORS=[{id:'electric',name:'Electric',colors:['#dcff76','#ab82ff','#faf4df']},{id:'sunset',name:'Sunset',colors:['#ff9c70','#ef6ca6','#fff0bd']},{id:'ice',name:'Ice',colors:['#96e7ee','#e6eef2','#9d97ff']},{id:'mono',name:'Mono',colors:['#f4f0df','#cac5b7','#f4f0df']}];
export const GRAPHICS=[{id:'catalog',name:'Catalog art',caption:'Keep the selected product’s art. Motifs here are simplified.'},{id:'none',name:'No graphic',caption:'Let the glass speak.'},{id:'orbit',name:'Night orbit',caption:'Planets, starbursts, and a little outer space.'},{id:'checker',name:'Warp check',caption:'A checkerboard with a mind of its own.'},{id:'botanical',name:'Desert bloom',caption:'Sunshine, palms, and a slow afternoon.'},{id:'topo',name:'Contour',caption:'A new landscape from every angle.'},{id:'flash',name:'Voltage',caption:'A flash of color. A bolt of personality.'}];
export const LOOKS=[{id:'cosmic',name:'After hours',color:'blue',ink:'electric',graphic:'orbit',hardware:'purple'},{id:'desert',name:'Desert radio',color:'amber',ink:'sunset',graphic:'botanical',hardware:'gold'},{id:'static',name:'Chrome static',color:'smoke',ink:'ice',graphic:'checker',hardware:'silver'}];
export const RANDOM_LOCKS=[...PARTS.map(p=>({id:p.id,name:p.name})),{id:'ink',name:'Ink palette'},{id:'hardware',name:'Connectors'}];
export const STARTERS=[{id:'essential',name:'The essentials',caption:'A simple three-part setup',chamber:false},{id:'balanced',name:'A little extra',caption:'Add a separate chamber',chamber:true},{id:'stacked',name:'Make a statement',caption:'A taller, layered setup',chamber:true}];
export const SHOWCASES=[{id:'klein',name:'Loop theory',caption:'Prism Klein recycler',system:'prism',base:'prism-klein',neck:'prism-bent',chamber:null,hardware:'purple'},{id:'coil',name:'Coil study',caption:'GRAV coil + trumpet',system:'stax',base:'stax-coil-base',neck:'stax-trumpet',chamber:null,hardware:'aqua'},{id:'halo',name:'Halo effect',caption:'GRAV turbine + halo',system:'stax',base:'stax-turbine',neck:'stax-helix',chamber:'stax-halo',hardware:'silver'}];
export function systemFor(build) {return SYSTEMS.find(s=>s.id===build.system)||SYSTEMS[0]}
export function optionsFor(build,id) {return systemFor(build).options[id]}
export function defaultBuild(system='prism') {
  const family=SYSTEMS.find(s=>s.id===system)||SYSTEMS[0];
  return {system:family.id,parts:Object.fromEntries(PARTS.map(p=>[p.id,{shape:family.defaults[p.id],color:family.id==='form'?'sage':'clear',enabled:true,graphic:'catalog'}])),ink:'electric',hardware:'gold',locks:Object.fromEntries(RANDOM_LOCKS.map(p=>[p.id,false])),selected:null,background:'dark',spin:true,smoke:true,exploded:false,view:null};
}
export function sanitizeView(raw){
  if(!raw||typeof raw!=='object'||!['azimuth','polar','zoom'].every(k=>typeof raw[k]==='number'&&Number.isFinite(raw[k])))return null;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n)),wrap=n=>((n+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
  const rotation=Array.isArray(raw.rotation)&&raw.rotation.length===3&&raw.rotation.every(n=>typeof n==='number'&&Number.isFinite(n))?raw.rotation:[0,0,0];
  return {azimuth:wrap(raw.azimuth),polar:clamp(raw.polar,.38,1.78),zoom:clamp(raw.zoom,.72,2.6),rotation:[clamp(rotation[0],-.35,.35),wrap(rotation[1]),clamp(rotation[2],-.35,.35)]};
}
export function sanitizeBuild(raw) {
  if(!raw||typeof raw!=='object')return defaultBuild();
  // Preserve saved designs from the original concept-only interface.
  const family=raw.system===undefined&&raw.parts?'form':SYSTEMS.some(s=>s.id===raw.system)?raw.system:'prism';
  const next=defaultBuild(family);
  for(const p of PARTS){
    const x=raw.parts?.[p.id];if(!x||typeof x!=='object')continue;
    if(optionsFor(next,p.id).some(o=>o.id===x.shape))next.parts[p.id].shape=x.shape;
    if(COLORS.some(c=>c.id===x.color))next.parts[p.id].color=x.color;
    if(typeof x.enabled==='boolean')next.parts[p.id].enabled=x.enabled;
    if(GRAPHICS.some(g=>g.id===x.graphic))next.parts[p.id].graphic=x.graphic;
  }
  if(INK_COLORS.some(c=>c.id===raw.ink))next.ink=raw.ink;
  if(HARDWARE_COLORS.some(c=>c.id===raw.hardware))next.hardware=raw.hardware;
  for(const lock of RANDOM_LOCKS)if(typeof raw.locks?.[lock.id]==='boolean')next.locks[lock.id]=raw.locks[lock.id];
  if(raw.selected===null||PARTS.some(p=>p.id===raw.selected))next.selected=raw.selected;
  if(raw.background==='light')next.background='light';
  if(typeof raw.spin==='boolean')next.spin=raw.spin;
  // Retain the legacy field for exported files; smoke now follows rotation.
  next.smoke=true;
  if(typeof raw.exploded==='boolean')next.exploded=raw.exploded;
  next.view=sanitizeView(raw.view);
  return next;
}
export function switchSystem(build,id) {
  const next=defaultBuild(id);next.selected=build.selected;next.background=build.background;next.spin=build.spin;next.smoke=build.smoke;next.exploded=build.exploded;next.view=build.view;next.locks=sanitizeBuild(build).locks;
  return next;
}
export function starterBuild(build,id){
  const preset=STARTERS.find(s=>s.id===id);if(!preset)return sanitizeBuild(build);
  const next=switchSystem(build,build.system);next.parts.chamber.enabled=preset.chamber;
  const choices=next.system==='prism'?{essential:{neck:'prism-standard'},stacked:{base:'prism-honey',chamber:'prism-big-tree',neck:'prism-tall'}}:next.system==='stax'?{essential:{neck:'stax-angled'},stacked:{base:'stax-turbine',chamber:'stax-tree',neck:'stax-pinch'}}:{essential:{neck:'straight'},stacked:{base:'column',chamber:'tree',neck:'flared'}};
  for(const [part,shape]of Object.entries(choices[id]||{}))if(optionsFor(next,part).some(o=>o.id===shape))next.parts[part].shape=shape;
  next.selected=null;return next;
}
export function showcaseBuild(build,id){
  const preset=SHOWCASES.find(s=>s.id===id);if(!preset)return sanitizeBuild(build);
  const next=switchSystem(build,preset.system);next.parts.base.shape=preset.base;next.parts.neck.shape=preset.neck;next.parts.chamber.enabled=!!preset.chamber;if(preset.chamber)next.parts.chamber.shape=preset.chamber;
  if(preset.id==='klein')next.parts.bowl.shape='cup-14';
  for(const p of PARTS){next.parts[p.id].color='clear';next.parts[p.id].graphic='catalog';}
  next.hardware=preset.hardware;next.selected=null;return next;
}
export function applyLook(build,id) {
  const look=LOOKS.find(l=>l.id===id);if(!look)return build;
  const next=structuredClone(build);next.ink=look.ink;next.hardware=look.hardware;
  for(const p of PARTS){next.parts[p.id].color=look.color;next.parts[p.id].graphic=p.id==='base'||p.id==='neck'?look.graphic:'none';}
  return next;
}
export function randomizeBuild(build,random=Math.random){
  const next=sanitizeBuild(build),pick=list=>list[Math.min(list.length-1,Math.max(0,Math.floor(random()*list.length)))];
  // Randomize design choices within this family; keep the viewing state intact.
  for(const p of PARTS){
    if(next.locks[p.id])continue;
    next.parts[p.id].shape=pick(optionsFor(next,p.id)).id;
    next.parts[p.id].color=pick(COLORS).id;
    next.parts[p.id].graphic=pick(GRAPHICS).id;
    next.parts[p.id].enabled=p.id==='chamber'?random()>=.22:true;
  }
  // A shared ink change would also alter artwork on a locked part.
  if(!next.locks.ink&&!PARTS.some(p=>next.locks[p.id]))next.ink=pick(INK_COLORS).id;
  if(!next.locks.hardware)next.hardware=pick(HARDWARE_COLORS).id;
  if(next.selected&&!next.parts[next.selected].enabled)next.selected=null;
  return next;
}
export function optionFor(build,id) {return optionsFor(build,id).find(o=>o.id===build.parts[id].shape)||optionsFor(build,id)[0]}
export function colorFor(build,id) {return COLORS.find(c=>c.id===build.parts[id].color)||COLORS[0]}
export function graphicFor(build,id) {const g=build.parts[id].graphic;return g==='catalog'?(optionFor(build,id).decoration||'none'):g}
export function activeParts(build) {return PARTS.filter(p=>build.parts[p.id].enabled)}
export function connectorCount(build) {return Math.max(0,['base','chamber','neck'].filter(id=>build.parts[id].enabled).length-1)}
export function isIncluded(build,id){return !!optionFor(build,id).included&&build.parts.base.enabled&&optionFor(build,'base').includedBowl!==false;}
export function effectivePrice(build,id) {const o=optionFor(build,id);return o.included&&!isIncluded(build,id)?o.standalonePrice:o.price}
export function sourceFor(build,id) {const o=optionFor(build,id);return isIncluded(build,id)?optionFor(build,'base').url:o.url}
export function hardwareFor(build) {
  const family=systemFor(build),qty=connectorCount(build),items=[];
  if(family.id==='prism'){
    if(qty)items.push({name:'Classic Halo connector',quantity:qty,unitPrice:29.99,url:prism('classic-prism-halo'),note:'Shop checks bundle inclusions; omit duplicate connectors if supplied.'});
    if(build.parts.base.enabled&&optionFor(build,'base').downstem)items.push({name:'Prism Classic downstem',quantity:1,unitPrice:0,included:true,url:optionFor(build,'base').url,note:'Included with this base. Shop confirms the supplied length.'});
    if(build.parts.base.enabled&&optionFor(build,'base').bangerIncluded)items.push({name:'45° 14 mm banger + carb cap',quantity:1,unitPrice:0,included:true,url:optionFor(build,'base').url,note:'Supplied with the Klein base. The flower bowl pictured in this configuration is a separate choice.'});
  }else if(family.id==='stax'){
    if(qty)items.push({name:'34 mm STAX joint clamp',quantity:qty,unitPrice:null,url:grav('34mm-plastic-joint-clamp-assorted-10-pack'),note:'Pack of 10 listed at $39.99. Shop checks included clips and quotes the needed quantity.'});
    if(build.parts.base.enabled&&optionFor(build,'base').downstem)items.push({name:'Showerhead downstem',quantity:1,unitPrice:0,included:true,url:optionFor(build,'base').url,note:'Included with this STAX base.'});
    if(build.parts.neck.enabled&&optionFor(build,'neck').adapterIncluded)items.push({name:'STAX 34 mm → 19 mm reduction adapter',quantity:1,unitPrice:0,included:true,url:optionFor(build,'neck').url,note:'Required for this trumpet mouthpiece; supplied with it and shown in the illustration.'});
  }
  return items;
}
export function totalFor(build) {return Math.round((activeParts(build).reduce((sum,p)=>sum+effectivePrice(build,p.id),0)+hardwareFor(build).reduce((sum,h)=>sum+(h.unitPrice||0)*h.quantity,0))*100)/100}
export function hasCustomFinish(build) {return activeParts(build).some(p=>build.parts[p.id].color!=='clear'||!['none','catalog'].includes(build.parts[p.id].graphic))}
export function fitSummary(build){
  const family=systemFor(build),missing=PARTS.filter(p=>p.id!=='chamber'&&!build.parts[p.id].enabled).map(p=>p.name.toLowerCase()),uncertain=activeParts(build).filter(p=>optionFor(build,p.id).status==='Check stock');
  return {complete:!missing.length,missing,uncertain:uncertain.map(p=>p.name),title:missing.length?'Still needs '+missing.join(', '):family.concept?'Concept composition':'Complete parts layout',connection:family.connection,note:family.concept?'Concept geometry; a shop must confirm how to construct it.':family.id==='prism'?'Classic Halo stack parts only. MINI parts need their own family. The bowl intake is 14 mm.':'STAX stack parts use 34 mm joints and clamps. The bowl intake is 14 mm.'+(optionFor(build,'neck').adapterIncluded?' The trumpet uses its included reduction adapter.':''),finish:hasCustomFinish(build)};
}
export function buildDetails(build) {
  const clean=sanitizeBuild(build),family=systemFor(clean);
  return {studio:'FORM',kind:'modular-glass-shop-brief',version:2,system:family.name,connection:family.connection,catalogReviewed:CATALOG_DATE,inventory:'Not live. Shop confirms stock, fit, actual color, and artwork.',preview:'Illustrated proportions. Custom color studies and original art are proposals to be quoted.',sample:!!family.concept,parts:activeParts(clean).map(p=>{const o=optionFor(clean,p.id);return {part:p.name,product:o.name,manufacturer:o.manufacturer||(family.concept?'FORM concept':family.name),colorStudy:colorFor(clean,p.id).name,hex:colorFor(clean,p.id).hex,graphic:GRAPHICS.find(g=>g.id===clean.parts[p.id].graphic).name,illustratedMotif:graphicFor(clean,p.id),listedPrice:effectivePrice(clean,p.id),includedWithBase:isIncluded(clean,p.id),source:sourceFor(clean,p.id)||null,status:o.status||'Concept part'};}),hardware:hardwareFor(clean),inkPalette:INK_COLORS.find(i=>i.id===clean.ink).name,connectorColorStudy:HARDWARE_COLORS.find(c=>c.id===clean.hardware).name,currency:'USD',catalogSubtotal:totalFor(clean),excluded:'Unpriced clamps, artwork, color customization, assembly, shipping, tax. Bundle inclusions may reduce the subtotal.',fulfillment:'Manual shop review, sourcing, assembly, and shipping after an agreed quote.',configuration:clean};
}
export function shopBrief(build) {
  const d=buildDetails(build);
  return ['FORM / YOUR SHOP BRIEF',d.system+' · '+d.connection,'Catalog reviewed: '+d.catalogReviewed,'',...d.parts.flatMap(p=>[p.part+': '+p.manufacturer+' '+p.product+' · '+(p.includedWithBase?'Included with base':'Listed $'+p.listedPrice.toFixed(2)), '  Color study: '+p.colorStudy+' | Graphic: '+p.graphic,p.source?'  Source: '+p.source:'  Concept component']), '', 'CONNECTIONS & SUPPORTING PARTS',...d.hardware.map(h=>h.quantity+' × '+h.name+' — '+(h.included?'included with base':h.unitPrice===null?'shop quote':'$'+(h.quantity*h.unitPrice).toFixed(2))+'\n  '+h.note+'\n  '+h.url),'','Catalog subtotal: $'+d.catalogSubtotal.toFixed(2)+' USD',d.excluded,'','Ink palette: '+d.inkPalette+' | Connector color study: '+d.connectorColorStudy,d.preview,d.inventory,'','Next: shop confirms complete parts, stock, exact variants, artwork feasibility, and final assembly / shipping quote.'].join('\n');
}
export function thumbnail(kind) {
  const paths={
    beaker:'M24 8h12v17l12 24c1 3-1 5-4 5H16c-3 0-5-2-4-5l12-24V8Zm0 5h12M13 49h34M22 32h16',
    bubble:'M24 8h12v17c8 3 13 8 13 15 0 9-8 14-19 14S11 49 11 40c0-7 5-12 13-15V8Zm0 5h12M19 47c6 3 16 3 22 0',
    column:'M24 8h12v5h-1v32h7v9H18v-9h7V13h-1V8Zm1 14h10M25 40h10',
    honeycomb:'M20 8h20v46H20V8Zm0 6h20M20 48h20M24 30h12M24 33h12M26 27v9M30 27v9M34 27v9',
    spiral:'M20 8h20v46H20V8Zm0 6h20M20 48h20M26 19c18 0-12 8 4 8s-13 8 0 8-12 8 4 8',
    tree:'M20 8h20v46H20V8Zm0 6h20M20 48h20M30 18v11M25 42V29h10v13M30 29v13M23 38h14M23 41h14',
    straight:'M24 8h12v5h-2v33h6v8H20v-8h6V13h-2V8Zm2 30h8',
    bent:'M22 54h18v-8h-5V28c0-4 3-7 7-9l4-2-6-9-5 3c-8 4-14 11-14 20v15h-1v8ZM26 37v9',
    flared:'M21 8h18l-5 15v23h6v8H20v-8h6V23L21 8Zm2 6h14M26 32h8',
    classic:'M17 14h26l-7 21-3 3v15h-6V38l-3-3-7-21Zm2 5h22M26 35h8',
    wide:'M12 14h36l-9 20-6 4v15h-6V38l-6-4-9-20Zm3 5h30M24 35h12',
    loop:'M17 14h26l-7 21-3 3v15h-6V38l-3-3-7-21Zm2 5h22M39 20c14-3 14 16-2 11'
  };
  paths['honey-base']=paths.column+'M23 32h14M24 35h12M26 29v9M30 29v9M34 29v9';
  paths['turbine-base']=paths.column+'M24 29l12 7M24 36l12-7';
  paths.shower=paths.honeycomb.replace('M24 30h12M24 33h12M26 27v9M30 27v9M34 27v9','M30 18v13M24 31h12v8H24v-8M26 35v4M30 35v4M34 35v4');
  paths.halo=paths.honeycomb.replace('M24 30h12M24 33h12M26 27v9M30 27v9M34 27v9','M30 18v13M23 32c0-8 14-8 14 0s-14 8-14 0');
  paths.circle=paths.halo;paths.helix=paths.flared;
  paths['klein-base']=paths.column+'M23 21h14l-5 9v9c0 7 15 2 9-3M37 33c14-4 13 10 0 8';
  paths['coil-base']=paths.column+'M24 21c19-4-9 11 8 10s-11 11 0 10M30 19v25';
  paths.trumpet='M19 7h22l-7 13v27h6v8H20v-8h6V20L19 7Zm4 6h14M23 48h14';
  return '<svg viewBox="0 0 60 62" aria-hidden="true"><path d="'+(paths[kind]||paths.beaker)+'"/></svg>';
}
