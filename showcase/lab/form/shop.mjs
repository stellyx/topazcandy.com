import {PRODUCTS,CATEGORIES,productFor,colorForProduct,filterProducts,changeBag,bagSummary,money,shoppingList,productArt} from './shop-data.mjs?v=1';

const byId=id=>document.getElementById(id);
const gallery=byId('shop-products'),productDialog=byId('shop-product-dialog'),bagDialog=byId('shop-bag-dialog');
let category='all',query='',bag=[],currentProduct=null,currentColor=null;
const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function activity(){document.dispatchEvent(new CustomEvent('headshop:activity'));}
function announce(message){byId('shop-status').textContent=message;}
function jump(id){byId(id).scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});}
function setMenu(open){
  byId('shop-menu-toggle').setAttribute('aria-expanded',String(open));
  byId('shop-nav').classList.toggle('is-open',open);
}
byId('shop-menu-toggle').addEventListener('click',()=>setMenu(byId('shop-menu-toggle').getAttribute('aria-expanded')!=='true'));
document.addEventListener('pointerdown',event=>{if(!event.target.closest('.header'))setMenu(false);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&byId('shop-menu-toggle').getAttribute('aria-expanded')==='true'){setMenu(false);byId('shop-menu-toggle').focus();}});
byId('shop-nav').addEventListener('click',event=>{
  const link=event.target.closest('a[href^="#"]');if(!link)return;
  event.preventDefault();setMenu(false);jump(link.getAttribute('href').slice(1));
});
function openDialog(dialog){
  setMenu(false);
  for(const other of document.querySelectorAll('dialog[open]'))if(other!==dialog)other.close();
  dialog.showModal();activity();
}
for(const dialog of [productDialog,bagDialog]){
  dialog.addEventListener('close',activity);
  dialog.addEventListener('click',event=>{
    const box=dialog.getBoundingClientRect();
    if(event.target===dialog&&(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom))dialog.close();
  });
}
byId('shop-product-close').addEventListener('click',()=>productDialog.close());
byId('shop-bag-close').addEventListener('click',()=>bagDialog.close());
function renderProducts(){
  const products=filterProducts({category,query});
  gallery.replaceChildren();
  for(const product of products){
    const card=document.createElement('article');card.className='shop-product-card';
    const picture=document.createElement('button');picture.type='button';picture.className='shop-card-picture';
    picture.setAttribute('aria-label','View '+product.name+' details');picture.innerHTML=productArt(product);
    const badge=document.createElement('span');badge.className='shop-product-badge';badge.textContent=product.badge;picture.append(badge);
    const info=document.createElement('div');info.className='shop-card-info';
    const small=document.createElement('span');small.className='shop-product-category';small.textContent=CATEGORIES.find(item=>item.id===product.category).name;
    const row=document.createElement('div');row.className='shop-card-title';
    const name=document.createElement('h3');name.textContent=product.name;
    const price=document.createElement('span');price.textContent=money(product.price);
    row.append(name,price);
    const detail=document.createElement('button');detail.type='button';detail.className='shop-card-detail';detail.textContent='Take a closer look ↗';
    picture.addEventListener('click',()=>openProduct(product.id));detail.addEventListener('click',()=>openProduct(product.id));
    info.append(small,row,detail);card.append(picture,info);gallery.append(card);
  }
  byId('shop-empty').hidden=products.length!==0;
  byId('shop-result-count').textContent=products.length+' '+(products.length===1?'piece':'pieces');
  for(const button of byId('shop-filters').querySelectorAll('[data-shop-category]'))button.setAttribute('aria-pressed',String(button.dataset.shopCategory===category));
}
byId('shop-filters').addEventListener('click',event=>{
  const button=event.target.closest('[data-shop-category]');if(!button)return;
  category=button.dataset.shopCategory;renderProducts();announce(byId('shop-result-count').textContent+' in '+button.textContent+'.');
});
byId('shop-search').addEventListener('input',event=>{query=event.target.value;renderProducts();});
byId('shop-clear-search').addEventListener('click',()=>{query='';category='all';byId('shop-search').value='';renderProducts();byId('shop-search').focus();});
function updateProduct(){
  byId('shop-product-picture').innerHTML=productArt(currentProduct,currentColor,'detail');
  byId('shop-color-name').textContent=currentColor.name;
  for(const button of byId('shop-product-colors').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.shopColor===currentColor.id));
}
function openProduct(id){
  const product=productFor(id);if(!product)return;
  currentProduct=product;currentColor=product.colors[0];
  byId('shop-product-name').textContent=product.name;
  byId('shop-product-category').textContent=CATEGORIES.find(item=>item.id===product.category).name;
  byId('shop-product-price').textContent=money(product.price);
  byId('shop-product-description').textContent=product.description;
  byId('shop-product-details').replaceChildren();
  for(const text of product.details){const item=document.createElement('li');item.textContent=text;byId('shop-product-details').append(item);}
  byId('shop-product-colors').replaceChildren();
  for(const color of product.colors){
    const button=document.createElement('button');button.type='button';button.dataset.shopColor=color.id;
    button.setAttribute('aria-label',color.name+' color study');button.style.setProperty('--shop-swatch',color.hex);
    button.addEventListener('click',()=>{currentColor=color;updateProduct();});
    byId('shop-product-colors').append(button);
  }
  byId('shop-customize-product').hidden=!product.showcase;
  byId('shop-product-feedback').textContent='';
  updateProduct();openDialog(productDialog);
}
function updateBagBadge(){
  const summary=bagSummary(bag);
  byId('shop-bag-count').textContent=String(summary.items);
  byId('shop-bag-open').setAttribute('aria-label','Open demo bag, '+summary.items+' '+(summary.items===1?'item':'items'));
}
byId('shop-add-product').addEventListener('click',()=>{
  if(!currentProduct)return;
  bag=changeBag(bag,currentProduct.id,currentColor.id,1);updateBagBadge();
  const message=currentProduct.name+' in '+currentColor.name+' is in your demo bag.';
  byId('shop-product-feedback').textContent=message;announce(message);
});
byId('shop-customize-product').addEventListener('click',()=>{
  if(!currentProduct?.showcase)return;
  const setup=byId('showcase-grid').querySelector('[data-showcase="'+currentProduct.showcase+'"]');
  if(!setup){byId('shop-product-feedback').textContent='The design desk is loading. Try again in a moment.';return;}
  productDialog.close();setup.click();
  if(currentColor.look){const look=byId('looks-grid').querySelector('[data-look="'+currentColor.look+'"]');look?.click();}
  jump('studio');announce(currentProduct.name+' opened in the live design desk.');
});
function renderBag(){
  const list=byId('shop-bag-items');list.replaceChildren();
  for(const item of bag){
    const product=productFor(item.product),color=colorForProduct(product,item.color);
    const row=document.createElement('article');row.className='shop-bag-item';
    const art=document.createElement('div');art.className='shop-bag-art';art.innerHTML=productArt(product,color,'bag');
    const info=document.createElement('div');
    const name=document.createElement('h3');name.textContent=product.name;
    const finish=document.createElement('p');finish.textContent=color.name+' · '+money(product.price)+' each';
    const controls=document.createElement('div');controls.className='shop-quantity';
    for(const [delta,label] of [[-1,'−'],[1,'+']]){
      const button=document.createElement('button');button.type='button';button.textContent=label;
      button.setAttribute('aria-label',(delta<0?'Remove one ':'Add one ')+product.name);
      button.disabled=delta>0&&item.quantity>=9;
      button.addEventListener('click',()=>{bag=changeBag(bag,item.product,item.color,delta);renderBag();updateBagBadge();announce('Demo bag updated.');});
      if(delta<0){controls.append(button);const quantity=document.createElement('span');quantity.textContent=String(item.quantity);controls.append(quantity);}else controls.append(button);
    }
    const remove=document.createElement('button');remove.type='button';remove.className='shop-bag-remove';remove.textContent='Remove';
    remove.setAttribute('aria-label','Remove all '+product.name+' in '+color.name);
    remove.addEventListener('click',()=>{bag=bag.filter(value=>value.product!==item.product||value.color!==item.color);renderBag();updateBagBadge();announce(product.name+' removed from the demo bag.');});
    info.append(name,finish,controls,remove);
    const total=document.createElement('strong');total.textContent=money(product.price*item.quantity);
    row.append(art,info,total);list.append(row);
  }
  byId('shop-bag-empty').hidden=bag.length!==0;
  byId('shop-bag-summary').hidden=bag.length===0;
  byId('shop-bag-total').textContent=money(bagSummary(bag).subtotal);
}
byId('shop-bag-open').addEventListener('click',()=>{renderBag();openDialog(bagDialog);});
byId('shop-bag-browse').addEventListener('click',()=>{bagDialog.close();jump('shop');});
function downloadText(name,text){
  const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
byId('shop-save-bag').addEventListener('click',()=>{if(bag.length)downloadText('head-shop-shopping-list.txt',shoppingList(bag));});
byId('shop-ask-bag').addEventListener('click',()=>{
  const names=bag.map(item=>productFor(item.product).name+' in '+colorForProduct(productFor(item.product),item.color).name+' × '+item.quantity).join('\n');
  byId('shop-message').value='I would like to ask about:\n'+names+'\n\n';byId('shop-enquiry-topic').value='collection';
  bagDialog.close();jump('shop-contact');byId('shop-message').focus({preventScroll:true});
});
byId('shop-enquiry-form').addEventListener('submit',event=>{
  event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
  const data=new FormData(form),topic=byId('shop-enquiry-topic').selectedOptions[0].textContent;
  const preview='HEAD SHOP / DEMO MESSAGE\n\n'+String(data.get('name')).trim()+' <'+String(data.get('email')).trim()+'>\n'+topic+'\n\n'+String(data.get('message')).trim()+'\n\nMessage preview only. This demo has not sent your message.';
  byId('shop-message-preview').textContent=preview;byId('shop-message-result').hidden=false;
  announce('Your message preview is ready. Nothing has been sent.');byId('shop-message-result').focus({preventScroll:true});
});
byId('shop-save-message').addEventListener('click',()=>downloadText('head-shop-message.txt',byId('shop-message-preview').textContent));
byId('shop-edit-message').addEventListener('click',()=>{byId('shop-message-result').hidden=true;byId('shop-message').focus();});
byId('shop-preview-message').disabled=false;
byId('shop-about-illustration').innerHTML=productArt(PRODUCTS[4],PRODUCTS[4].colors[0],'story');
renderProducts();updateBagBadge();
