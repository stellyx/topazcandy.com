import {PARTS,systemFor,optionFor,colorFor,totalFor,thumbnail,sanitizeBuild} from './catalog.js';
import {FAVORITES_LIMIT,escapeHTML,cleanName,sanitizeFavorites,saveFavorite,shareURL,qrSVG,comparisonFor} from './studio.js';

const byId=id=>document.getElementById(id),SHELF_KEY='form-modular-favorites-v1';
const DIALOGS=['review-dialog','favorites-dialog','compare-dialog','share-dialog'];
export const isAnyDialogOpen=()=>[...DIALOGS,'shop-product-dialog','shop-bag-dialog'].some(id=>Boolean(byId(id)?.open));
function illustratedPreview(build){
  return '<div class="mini-composition" aria-label="Component illustrations">'+PARTS.filter(p=>build.parts[p.id].enabled).map(p=>'<span style="color:'+colorFor(build,p.id).hex+'">'+thumbnail(optionFor(build,p.id).kind)+'</span>').join('')+'</div><span class="saved-view-label">Component illustration</span>';
}
const preview=(item)=>item.image?'<img src="'+item.image+'" alt="Saved view of '+escapeHTML(item.name)+'" loading="lazy"><span class="saved-view-label">Saved 3D view</span>':illustratedPreview(item.configuration);
export function initStudioTools({getBuild,onLoad,onActivity,announce,capture,download}){
  let favorites=[],currentItem=null,sharedLink='',sharedQR='';
  try{const raw=localStorage.getItem(SHELF_KEY);if(raw&&raw.length<3000000)favorites=sanitizeFavorites(JSON.parse(raw));}catch{}
  function saveShelf(){
    try{localStorage.setItem(SHELF_KEY,JSON.stringify(favorites));return true;}
    catch{favorites=favorites.map(f=>({...f,image:null}));try{localStorage.setItem(SHELF_KEY,JSON.stringify(favorites));return true;}catch{return false;}}
  }
  function openDialog(id){onActivity();for(const other of DIALOGS)if(other!==id&&byId(other).open)byId(other).close();byId(id).showModal();}
  function load(build){onLoad(sanitizeBuild(build));for(const id of DIALOGS)if(byId(id).open)byId(id).close();}
  function renderShelf(){
    byId('favorites-count').textContent=String(favorites.length);
    byId('favorite-save').disabled=favorites.length>=FAVORITES_LIMIT;
    byId('favorite-capacity').textContent=favorites.length+' of '+FAVORITES_LIMIT+' saved designs';
    byId('favorites-list').innerHTML=favorites.length?favorites.map(f=>'<article class="favorite-card"><div class="favorite-preview">'+preview(f)+'</div><div class="favorite-meta"><h3>'+escapeHTML(f.name)+'</h3><p>'+systemFor(f.configuration).name+' <span>$'+totalFor(f.configuration).toFixed(2)+'</span></p></div><div class="favorite-actions"><button type="button" data-load="'+f.id+'" aria-label="Load '+escapeHTML(f.name)+'">Load</button><button type="button" data-compare="'+f.id+'" aria-label="Compare '+escapeHTML(f.name)+'">Compare</button><button type="button" data-remove="'+f.id+'" aria-label="Remove '+escapeHTML(f.name)+'">×</button></div></article>').join(''):'<div class="empty-shelf"><span aria-hidden="true">✧</span><h3>Room for a great idea.</h3><p>Give your current design a name and save it above. Try another, then compare the two.</p></div>';
  }
  function current(){const configuration=getBuild();let image=null;try{image=capture(420);}catch{}return {id:'current',name:'Current design',configuration,image};}
  const item=id=>id==='current'?currentItem:favorites.find(f=>f.id===id);
  function renderComparison(){
    const left=item(byId('compare-left').value),right=item(byId('compare-right').value);if(!left||!right)return;
    const result=comparisonFor(left.configuration,right.configuration);
    byId('compare-previews').innerHTML=[left,right].map(f=>'<div class="compare-preview">'+preview(f)+'</div>').join('');
    byId('compare-left-name').textContent=left.name;byId('compare-right-name').textContent=right.name;
    byId('compare-rows').innerHTML=result.rows.map(r=>'<tr class="'+(r.different?'different':'')+'"><th scope="row">'+r.label+'</th><td>'+escapeHTML(r.left)+'</td><td>'+escapeHTML(r.right)+'</td></tr>').join('')+'<tr class="subtotal-row"><th scope="row">Parts subtotal</th><td>$'+result.leftSubtotal.toFixed(2)+'</td><td>$'+result.rightSubtotal.toFixed(2)+'</td></tr>';
    byId('compare-note').textContent=(result.delta===0?'Same catalog subtotal.':Math.abs(result.delta).toFixed(2)+' USD '+(result.delta>0?'more':'less')+' in the second design.')+' '+(!result.sameFamily?'These are different connection families; their stack parts do not mix. ':'')+'Stock, finishes, assembly, shipping and tax need a shop quote'+(result.unpriced?', including STAX clamps.':'.');
    byId('compare-load-left').disabled=left.id==='current';byId('compare-load-right').disabled=right.id==='current';
  }
  function openCompare(id){
    currentItem=current();const choices=[currentItem,...favorites];
    for(const side of ['left','right']){const select=byId('compare-'+side);select.innerHTML=choices.map(f=>'<option value="'+f.id+'">'+escapeHTML(f.name)+'</option>').join('');select.value=side==='left'?'current':id;}
    renderComparison();openDialog('compare-dialog');
  }
  function openShelf(focusName=false){openDialog('favorites-dialog');renderShelf();if(focusName){byId('favorite-name').value='';byId('favorite-name').focus();}}
  byId('favorite-save-open').addEventListener('click',()=>openShelf(true));
  byId('favorites-open').addEventListener('click',()=>openShelf());
  byId('favorite-form').addEventListener('submit',e=>{
    e.preventDefault();onActivity();let image=null;try{image=capture(420);}catch{}
    try{favorites=saveFavorite(favorites,getBuild(),cleanName(byId('favorite-name').value),image);const saved=saveShelf();renderShelf();byId('favorite-name').value='';announce(saved?'Favorite saved on your shelf':'Saved for this visit. Download a brief to keep a separate copy.');}catch(error){announce(error.message);}
  });
  byId('favorites-list').addEventListener('click',e=>{
    const button=e.target.closest('[data-load], [data-compare], [data-remove]');if(!button)return;
    const id=button.dataset.load||button.dataset.compare||button.dataset.remove,favorite=favorites.find(f=>f.id===id);if(!favorite)return;
    if(button.dataset.load){load(favorite.configuration);announce(favorite.name+' loaded');}
    else if(button.dataset.compare)openCompare(id);
    else {favorites=favorites.filter(f=>f.id!==id);const saved=saveShelf();renderShelf();announce(saved?'Favorite removed':'Removed for this visit. Browser storage is unavailable.');}
  });
  for(const side of ['left','right']){
    byId('compare-'+side).addEventListener('change',renderComparison);
    byId('compare-load-'+side).addEventListener('click',()=>{const chosen=item(byId('compare-'+side).value);if(chosen)load(chosen.configuration);});
  }
  byId('share-open').addEventListener('click',()=>{
    onActivity();sharedLink=shareURL(getBuild(),window.location.href);sharedQR=qrSVG(sharedLink);
    byId('share-link').value=sharedLink;byId('share-qr').innerHTML=sharedQR;byId('native-share').hidden=typeof navigator.share!=='function';openDialog('share-dialog');
  });
  byId('copy-share').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(sharedLink);announce('Build link copied');}catch{const field=byId('share-link');field.focus();field.select();announce('Your link is selected. Copy it to share this exact design.');}
  });
  byId('download-qr').addEventListener('click',()=>download(new Blob([sharedQR],{type:'image/svg+xml'}),'form-design-qr.svg'));
  byId('native-share').addEventListener('click',async()=>{try{await navigator.share({title:'FORM / My design',url:sharedLink});}catch(error){if(error.name!=='AbortError')announce('Use Copy link to share your design.');}});
  for(const name of ['favorites','compare','share']){
    const dialog=byId(name+'-dialog');byId('close-'+name).addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>onActivity());
    dialog.addEventListener('click',e=>{const b=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom))dialog.close();});
  }
  renderShelf();
}
