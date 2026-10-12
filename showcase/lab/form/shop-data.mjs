export const CATEGORIES = [
  {id:'all',name:'All goods'},
  {id:'modular',name:'Modular glass'},
  {id:'hand',name:'Hand pipes'},
  {id:'glass',name:'Statement glass'},
  {id:'essentials',name:'Everyday essentials'}
];
const blue={id:'blue',name:'Ocean',hex:'#4c9dc2',look:'cosmic'};
const amber={id:'amber',name:'Honey',hex:'#cd964a',look:'desert'};
const smoke={id:'smoke',name:'Smoke',hex:'#65786f',look:'static'};
const jade={id:'jade',name:'Jade',hex:'#75a888'};
const lilac={id:'lilac',name:'Lilac',hex:'#a18bbe'};
const rose={id:'rose',name:'Rose',hex:'#d58f86'};
export const PRODUCTS = [
  {id:'loop-theory',name:'Loop Theory',category:'modular',kind:'recycler',price:248,badge:'Make it yours',colors:[blue,amber,smoke],showcase:'klein',description:'A sculptural loop, a bent neck and room for your own color story. Explore a compatible modular setup in the live design desk.',details:['Modular silhouette','Customize parts and artwork in 3D','Illustrated collection; shop confirms final details']},
  {id:'coil-study',name:'Coil Study',category:'modular',kind:'coil',price:185,badge:'The design desk',colors:[smoke,blue,amber],showcase:'coil',description:'A layered coil silhouette with a tall, clean finish. Start with the signature setup, then make the individual pieces your own.',details:['Coil-inspired modular silhouette','Try the matching studio setup','Colors shown are visual studies']},
  {id:'pocket-pebble',name:'Pocket Pebble',category:'hand',kind:'spoon',price:48,badge:'Small pleasures',colors:[jade,lilac,amber],description:'Soft curves and a little color. A compact spoon-shaped design for the everyday glass shelf.',details:['Rounded spoon silhouette','Three color studies','Sample product and price']},
  {id:'little-lilac',name:'Little Lilac',category:'hand',kind:'steamroller',price:56,badge:'Keep it simple',colors:[lilac,blue,smoke],description:'A simple straight silhouette with two small resting feet. Let the glass and your favorite color do the talking.',details:['Straight glass silhouette','Minimal surface detail','Sample product and price']},
  {id:'golden-hour',name:'Golden Hour',category:'glass',kind:'beaker',price:118,badge:'A warm glow',colors:[amber,rose,smoke],description:'Warm amber, a broad base and a sunburst detail. An illustrated statement piece with a little late-afternoon character.',details:['Beaker-inspired shape','Sunburst surface motif','Sample product and price']},
  {id:'cloud-nine',name:'Cloud Nine',category:'glass',kind:'bubbler',price:92,badge:'A little character',colors:[rose,lilac,jade],description:'A rounded body, curved neck and speckled finish. A playful glass study for a shelf that could use something unexpected.',details:['Curved glass silhouette','Speckled color treatment','Sample product and price']},
  {id:'daily-tray',name:'The Daily Tray',category:'essentials',kind:'tray',price:24,badge:'Counter companion',colors:[jade,rose,lilac],description:'A small home for the little things. Rounded edges and a graphic sun make this illustrated tray an easy companion to the glass collection.',details:['Rounded tray illustration','Graphic sun and wave detail','Sample product and price']},
  {id:'cut-above',name:'Cut Above',category:'essentials',kind:'grinder',price:32,badge:'Everyday ritual',colors:[smoke,amber,lilac],description:'A compact, ridged metal silhouette in a restrained color palette. A simple accessory study for the everyday lineup.',details:['Ridged metal silhouette','Three finish studies','Sample product and price']}
];
export const money = amount => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(amount);
export function productFor(id){return PRODUCTS.find(product=>product.id===id)||null;}
export function colorForProduct(product,id){return product?.colors.find(color=>color.id===id)||product?.colors[0]||null;}
export function filterProducts({category='all',query=''}={}){
  const q=String(query).trim().toLowerCase().slice(0,100);
  return PRODUCTS.filter(product=>(category==='all'||product.category===category)&&(!q||(product.name+' '+product.description+' '+product.category).toLowerCase().includes(q)));
}
export function sanitizeBag(raw){
  const rows=new Map();
  if(!Array.isArray(raw))return [];
  for(const item of raw.slice(0,64)){
    if(!item||typeof item!=='object')continue;
    const product=productFor(item.product),color=product?.colors.find(value=>value.id===item.color);
    const quantity=Math.trunc(Number(item.quantity));
    if(!product||!color||!Number.isFinite(quantity)||quantity<1)continue;
    const key=product.id+':'+color.id,previous=rows.get(key);
    rows.set(key,{product:product.id,color:color.id,quantity:Math.min(9,quantity+(previous?.quantity||0))});
  }
  return [...rows.values()];
}
export function changeBag(raw,id,color,delta){
  const bag=sanitizeBag(raw),product=productFor(id);
  if(!product||!product.colors.some(value=>value.id===color)||!Number.isInteger(delta)||Math.abs(delta)>9)return bag;
  const row=bag.find(item=>item.product===id&&item.color===color);
  if(row)row.quantity=Math.min(9,Math.max(0,row.quantity+delta));
  else if(delta>0)bag.push({product:id,color,quantity:Math.min(9,delta)});
  return bag.filter(item=>item.quantity>0);
}
export function bagSummary(raw){
  const bag=sanitizeBag(raw);
  return {items:bag.reduce((sum,item)=>sum+item.quantity,0),subtotal:bag.reduce((sum,item)=>sum+productFor(item.product).price*item.quantity,0)};
}
export function shoppingList(raw){
  const bag=sanitizeBag(raw),summary=bagSummary(bag);
  return 'HEAD SHOP / DEMO SHOPPING LIST\n\n'+bag.map(item=>productFor(item.product).name+' / '+colorForProduct(productFor(item.product),item.color).name+' / quantity '+item.quantity+' / '+money(productFor(item.product).price*item.quantity)).join('\n')+'\n\nIllustrative subtotal: '+money(summary.subtotal)+' USD\nSample products, color studies and prices. No order or payment has been placed. Availability, finish, delivery and final pricing require a real retailer.';
}
export function productArt(product,color=product.colors[0],suffix='card'){
  // Original vector illustrations, deliberately distinct from product photographs.
  const prefix='shop-'+product.id+'-'+color.id+'-'+String(suffix).replace(/[^a-z0-9-]/gi,'');
  const glass='url(#'+prefix+'-glass)',edge=color.hex,highlight='url(#'+prefix+'-shine)';
  const attrs='fill="'+glass+'" stroke="'+edge+'" stroke-width="2.5" stroke-linejoin="round"';
  let shape='';
  if(product.kind==='recycler'){
    shape='<path d="M145 277v-91c0-22 17-36 38-36h21c14 0 24 10 24 24v89c0 28-19 43-44 43h-13c-17 0-26-12-26-29Z" '+attrs+'/>'+
      '<path d="M192 157v-58c0-15 10-26 23-26h21v19h-12c-5 0-8 5-8 11v64" '+attrs+'/>'+
      '<path d="M148 220c-58-24-63-108-20-113 35-4 35 62 13 92" fill="none" stroke="'+edge+'" stroke-width="17" opacity=".6"/>'+
      '<path d="M148 220c-58-24-63-108-20-113 35-4 35 62 13 92" fill="none" stroke="#effbf5" stroke-width="5" opacity=".7"/>'+
      '<path d="m227 229 22-27 19 15-27 29" '+attrs+'/><ellipse cx="263" cy="211" rx="12" ry="6" transform="rotate(36 263 211)" fill="#e1eee2" stroke="'+edge+'" stroke-width="2"/>'+
      '<ellipse cx="182" cy="310" rx="56" ry="10" '+attrs+'/><path d="M159 274v-79m45-48v-33" stroke="'+highlight+'" stroke-width="7" stroke-linecap="round"/>'+
      '<path d="M174 217c18 6 24 14 15 24m-17 7 32 12" fill="none" stroke="#f3e9b4" stroke-width="2"/><circle cx="192" cy="235" r="13" fill="none" stroke="#f3e9b4" stroke-width="2"/>';
  }else if(product.kind==='coil'){
    shape='<path d="M158 295V176c0-17 13-29 29-29s29 12 29 29v119Z" '+attrs+'/>'+
      '<path d="M171 150v-42l-19-18v-20h70v20l-20 18v42" '+attrs+'/>'+
      '<path d="M163 279c54-8 54-31 0-36 53-8 52-32 0-36 52-7 51-32 3-34" fill="none" stroke="'+edge+'" stroke-width="10" opacity=".65"/>'+
      '<path d="M164 278c52-7 52-29 0-34 52-8 52-30 0-35 50-6 50-29 3-34" fill="none" stroke="#e9f3e7" stroke-width="3" opacity=".85"/>'+
      '<path d="m217 264 32-26 15 18-47 34" '+attrs+'/>'+
      '<ellipse cx="187" cy="311" rx="57" ry="10" '+attrs+'/><ellipse cx="187" cy="78" rx="29" ry="6" fill="#dce8da" stroke="'+edge+'" stroke-width="2"/>';
  }else if(product.kind==='spoon'){
    shape='<path d="M259 247c-32 1-50-11-72-28l-40-30c-24-16-56-12-70 10-15 27-1 57 25 66 19 7 39 2 52-7 25-17 68-7 101 5l14-5Z" '+attrs+'/>'+
      '<ellipse cx="119" cy="209" rx="29" ry="20" transform="rotate(12 119 209)" fill="'+edge+'" opacity=".43"/>'+
      '<ellipse cx="119" cy="208" rx="17" ry="11" transform="rotate(12 119 208)" fill="#e6ecdf" opacity=".9"/>'+
      '<path d="M82 223c0 19 20 30 39 31m41-47 64 36" stroke="'+highlight+'" stroke-width="7" stroke-linecap="round"/>'+
      '<circle cx="246" cy="251" r="4" fill="#eff8e7"/>';
  }else if(product.kind==='steamroller'){
    shape='<path d="m83 191 176 12c23 2 26 49 0 49L78 237c-19-2-17-48 5-46Z" '+attrs+'/>'+
      '<ellipse cx="85" cy="214" rx="13" ry="23" transform="rotate(4 85 214)" fill="'+edge+'" opacity=".5"/>'+
      '<ellipse cx="83" cy="214" rx="7" ry="15" fill="#e1e9dc"/>'+
      '<path d="m134 198 3-21 35 3-3 22" '+attrs+'/>'+
      '<ellipse cx="155" cy="179" rx="16" ry="6" fill="#e9eede" stroke="'+edge+'" stroke-width="2"/>'+
      '<path d="m119 240 5 20h13l4-18m77 6 3 19h13l5-18" '+attrs+'/>'+
      '<path d="m105 204 131 10" stroke="'+highlight+'" stroke-width="7" stroke-linecap="round"/>';
  }else if(product.kind==='beaker'){
    shape='<path d="M163 73h44v127l50 81c15 28-5 31-27 31h-92c-27 0-37-9-24-32l49-80Z" '+attrs+'/>'+
      '<ellipse cx="185" cy="75" rx="22" ry="6" fill="#eee7d0" stroke="'+edge+'" stroke-width="2"/>'+
      '<path d="m222 238 29-31 14 15-29 32" '+attrs+'/>'+
      '<path d="M175 102v95l-42 81" stroke="'+highlight+'" stroke-width="7" stroke-linecap="round"/>'+
      '<circle cx="182" cy="256" r="21" fill="none" stroke="#eee5bd" stroke-width="2"/>'+
      '<path d="M182 226v-12m0 72v12m-30-42h-12m72 0h12m-61-21-9-9m51 51 9 9m-9-51 9-9m-51 51-9 9" stroke="#eee5bd" stroke-width="2"/>';
  }else if(product.kind==='bubbler'){
    shape='<path d="M151 200v-36h39v32c39 11 54 35 47 69-7 31-35 48-68 47-36-1-60-23-59-56 1-25 16-44 41-56Z" '+attrs+'/>'+
      '<path d="M187 169c35-15 43-38 34-61-6-15-18-22-26-29l12-18c22 16 39 29 40 57 2 40-19 63-57 73" '+attrs+'/>'+
      '<ellipse cx="170" cy="162" rx="19" ry="6" fill="#eee6da" stroke="'+edge+'" stroke-width="2"/>'+
      '<path d="M133 258c-1 25 18 39 39 40" stroke="'+highlight+'" stroke-width="8" stroke-linecap="round"/>'+
      '<g fill="#f1e8d0" opacity=".9"><circle cx="166" cy="231" r="4"/><circle cx="190" cy="261" r="5"/><circle cx="161" cy="283" r="3"/><circle cx="208" cy="242" r="3"/><circle cx="150" cy="252" r="3"/></g>';
  }else if(product.kind==='tray'){
    shape='<rect x="64" y="153" width="239" height="143" rx="28" transform="rotate(-8 183 224)" fill="'+edge+'" opacity=".84" stroke="#e9ecd8" stroke-width="2"/>'+
      '<rect x="77" y="165" width="214" height="116" rx="18" transform="rotate(-8 183 224)" fill="#f0ecd7" stroke="'+edge+'" stroke-width="5"/>'+
      '<g transform="rotate(-8 183 224)"><circle cx="179" cy="206" r="24" fill="'+edge+'"/><path d="M108 249c20-15 33 15 54 0s32 15 53 0 34 13 48 0" fill="none" stroke="'+edge+'" stroke-width="4"/><path d="M144 206h-10m89 0h-10m-34-36v-10m-25 20-7-7m57 7 7-7" stroke="'+edge+'" stroke-width="3"/></g>';
  }else{
    shape='<path d="M109 186v83c0 28 144 28 144 0v-83Z" fill="'+edge+'" opacity=".9"/>'+
      '<ellipse cx="181" cy="186" rx="72" ry="27" fill="'+edge+'" stroke="#e6eedc" stroke-width="2"/>'+
      '<ellipse cx="181" cy="183" rx="58" ry="19" fill="#e3e8d7" opacity=".5"/>'+
      '<path d="M110 223c26 19 115 19 142 0m-142 24c29 19 112 19 142 0" fill="none" stroke="#f0f2dd" stroke-width="2" opacity=".5"/>'+
      '<path d="M121 195v25m13-21v26m15-23v26m64-26v26m15-29v26m13-30v25" stroke="#e2ead7" stroke-width="2" opacity=".8"/>'+
      '<path d="m173 177 8-7 8 7-8 7Z" fill="#f1f3e7"/>';
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 380" class="shop-product-art" role="img" aria-label="'+product.name+' in '+color.name+', product illustration"><defs><linearGradient id="'+prefix+'-glass" x1="0" x2="1"><stop stop-color="'+edge+'" stop-opacity=".64"/><stop offset=".25" stop-color="#fcfff5" stop-opacity=".8"/><stop offset=".5" stop-color="'+edge+'" stop-opacity=".29"/><stop offset="1" stop-color="'+edge+'" stop-opacity=".84"/></linearGradient><linearGradient id="'+prefix+'-shine"><stop stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient><radialGradient id="'+prefix+'-halo"><stop stop-color="'+edge+'" stop-opacity=".12"/><stop offset="1" stop-color="'+edge+'" stop-opacity="0"/></radialGradient></defs><circle cx="180" cy="208" r="143" fill="url(#'+prefix+'-halo)" stroke="none"/><ellipse cx="180" cy="328" rx="81" ry="10" fill="#213d32" opacity=".07" stroke="none"/><g>'+shape+'</g></svg>';
}
