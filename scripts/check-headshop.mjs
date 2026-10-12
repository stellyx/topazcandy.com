import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as catalog from '../showcase/lab/form/shop-data.mjs';

const {PRODUCTS,CATEGORIES,filterProducts,productFor,colorForProduct,sanitizeBag,changeBag,bagSummary,shoppingList,productArt,money}=catalog;
assert.equal(new Set(PRODUCTS.map(item=>item.id)).size,PRODUCTS.length);
assert.equal(filterProducts({category:'modular'}).length,2);
assert.equal(filterProducts({query:'pocket'}).map(item=>item.id)[0],'pocket-pebble');
assert.equal(filterProducts({category:'essentials',query:'tray'}).length,1);
assert.equal(filterProducts({query:'<script>alert(1)</script>'}).length,0);
assert.deepEqual(sanitizeBag([{product:'__proto__',color:'blue',quantity:2},{product:'loop-theory',color:'fake',quantity:2},{product:'loop-theory',color:'blue',quantity:Infinity}]),[]);
let bag=changeBag([],'loop-theory','blue',1);
bag=changeBag(bag,'loop-theory','blue',9);
assert.equal(bag[0].quantity,9);
bag=changeBag(bag,'loop-theory','amber',2);
assert.equal(bag.length,2,'Separate colors remain separate choices');
assert.equal(bagSummary(bag).subtotal,11*productFor('loop-theory').price);
assert.deepEqual(changeBag(bag,'unknown','blue',1),bag);
assert.equal(sanitizeBag([{product:'loop-theory',color:'blue',quantity:1,price:0}])[0].price,undefined,'Submitted prices are never trusted');
assert.ok(shoppingList(bag).includes('No order or payment has been placed'));

class Element{
  constructor(tag='div'){this.tag=tag;this.children=[];this.events={};this.dataset={};this.attributes={};this.open=false;this.hidden=false;this.value='';this.textContent='';this.innerHTML='';this.disabled=false;this.className='';this.parent=null;this.styles={};this.style={setProperty:(key,value)=>this.styles[key]=value};this.classList={toggle:(name,on)=>{const set=new Set(this.className.split(' ').filter(Boolean));if(on)set.add(name);else set.delete(name);this.className=[...set].join(' ');}};}
  append(...nodes){for(const node of nodes){node.parent=this;this.children.push(node);}}
  replaceChildren(...nodes){this.children=[];this.append(...nodes);}
  setAttribute(key,value){this.attributes[key]=String(value);}
  getAttribute(key){return this.attributes[key]??null;}
  addEventListener(name,handler){(this.events[name]??=[]).push(handler);}
  emit(name,event={}){for(const handler of this.events[name]||[])handler({target:this,currentTarget:this,preventDefault(){},...event});}
  click(){if(!this.disabled)this.emit('click');}
  focus(options){this.focusOptions=options;this.focused=true;}
  scrollIntoView(options){this.scrollOptions=options;}
  showModal(){this.open=true;}
  close(){this.open=false;this.emit('close');}
  getBoundingClientRect(){return {left:0,top:0,right:500,bottom:500};}
  matches(selector){
    if(selector==='button')return this.tag==='button';
    if(selector.startsWith('.'))return this.className.split(' ').includes(selector.slice(1));
    const match=selector.match(/^\[data-([a-z-]+)(?:="([^"]*)")?\]$/);
    if(match){const key=match[1].replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());return key in this.dataset&&(match[2]===undefined||this.dataset[key]===match[2]);}
    if(selector==='a[href^="#"]')return this.tag==='a'&&this.getAttribute('href')?.startsWith('#');
    return false;
  }
  querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  closest(selector){let item=this;while(item){if(item.matches(selector))return item;item=item.parent;}return null;}
}
const html=readFileSync('showcase/lab/form/index.html','utf8'),nodes=new Map();
for(const match of html.matchAll(/<([a-z0-9]+)\b([^>]*)>/gi)){
  const id=match[2].match(/\bid="([^"]+)"/)?.[1];if(!id)continue;
  assert.ok(!nodes.has(id),'Duplicate HTML ID '+id);
  const element=new Element(match[1]);element.className=match[2].match(/\bclass="([^"]+)"/)?.[1]||'';nodes.set(id,element);
}
for(const [tag,key] of [['button','all'],['button','modular'],['button','hand'],['button','glass'],['button','essentials']]){
  const button=new Element(tag);button.dataset.shopCategory=key;button.textContent=CATEGORIES.find(category=>category.id===key).name;nodes.get('shop-filters').append(button);
}
let setupClicks=0,lookClicks=0,activities=0,networkRequests=0,downloads=[];
for(const id of ['klein','coil']){const button=new Element('button');button.dataset.showcase=id;button.addEventListener('click',()=>setupClicks++);nodes.get('showcase-grid').append(button);}
for(const id of ['cosmic','desert','static']){const button=new Element('button');button.dataset.look=id;button.addEventListener('click',()=>lookClicks++);nodes.get('looks-grid').append(button);}
nodes.get('shop-enquiry-form').reportValidity=()=>true;
nodes.get('shop-enquiry-topic').selectedOptions=[{textContent:'A piece in the collection'}];
nodes.get('shop-menu-toggle').setAttribute('aria-expanded','false');
const document={
 getElementById:id=>nodes.get(id)||null,
 createElement:tag=>new Element(tag),
 querySelectorAll:selector=>selector==='dialog[open]'?[...nodes.values()].filter(node=>node.tag==='dialog'&&node.open):[],
 addEventListener(){},
 dispatchEvent:event=>{if(event.type==='headshop:activity')activities++;}
};
const fields={name:'Example visitor',email:'visitor@example.com',message:'<img src=x onerror=alert(1)> A question about my collection.'};
const source=readFileSync('showcase/lab/form/shop.mjs','utf8').replace(/^import .*;\n/,'');
vm.runInNewContext(source,{...catalog,document,window:{matchMedia:()=>({matches:true})},CustomEvent:class{constructor(type){this.type=type;}},FormData:class{get(key){return fields[key];}},Blob,URL:{createObjectURL:blob=>{downloads.push(blob);return 'blob:example';},revokeObjectURL(){}},setTimeout:handler=>handler(),fetch(){networkRequests++;throw Error('The demo must not send a network request');}});
const get=id=>nodes.get(id);
assert.equal(get('shop-products').children.length,8,'Collection loads without the 3D viewer');
assert.equal(get('shop-preview-message').disabled,false);
const filter=get('shop-filters').children[1];get('shop-filters').emit('click',{target:filter});
assert.equal(get('shop-products').children.length,2);
get('shop-search').emit('input',{target:{value:'does not exist'}});
assert.equal(get('shop-products').children.length,0);assert.equal(get('shop-empty').hidden,false);
get('shop-clear-search').click();assert.equal(get('shop-products').children.length,8);

get('shop-products').children[0].children[0].click();
assert.equal(get('shop-product-dialog').open,true);assert.equal(get('shop-product-name').textContent,'Loop Theory');
get('shop-product-colors').children[1].click();assert.equal(get('shop-color-name').textContent,'Honey');
assert.ok(get('shop-product-picture').innerHTML.includes('in Honey'));
get('shop-add-product').click();get('shop-add-product').click();assert.equal(get('shop-bag-count').textContent,'2');
get('shop-customize-product').click();
assert.equal(get('shop-product-dialog').open,false);assert.equal(setupClicks,1);assert.equal(lookClicks,1);
assert.equal(get('studio').scrollOptions.behavior,'instant','Reduced motion keeps navigation immediate');
get('shop-bag-open').click();assert.equal(get('shop-bag-dialog').open,true);
assert.equal(get('shop-bag-total').textContent,money(2*PRODUCTS[0].price));
let item=get('shop-bag-items').children[0];item.children[1].children[2].children[0].click();
assert.equal(get('shop-bag-count').textContent,'1');
get('shop-save-bag').click();assert.ok((await downloads.at(-1).text()).includes('Loop Theory / Honey'));
get('shop-ask-bag').click();assert.equal(get('shop-bag-dialog').open,false);
assert.ok(get('shop-message').value.includes('Loop Theory in Honey'));
assert.equal(get('shop-contact').scrollOptions.behavior,'instant');

get('shop-enquiry-form').reportValidity=()=>false;get('shop-enquiry-form').emit('submit');
assert.equal(get('shop-message-preview').textContent,'');
get('shop-enquiry-form').reportValidity=()=>true;get('shop-enquiry-form').emit('submit');
assert.ok(get('shop-message-preview').textContent.includes(fields.message));
assert.equal(get('shop-message-preview').innerHTML,'','Visitor text stays text, even with HTML-shaped input');
assert.equal(get('shop-message-result').hidden,false);
get('shop-save-message').click();assert.ok((await downloads.at(-1).text()).includes('This demo has not sent your message'));
get('shop-edit-message').click();assert.equal(get('shop-message-result').hidden,true);
get('shop-menu-toggle').click();assert.equal(get('shop-menu-toggle').getAttribute('aria-expanded'),'true');
assert.ok(get('shop-nav').className.includes('is-open'));
get('shop-menu-toggle').click();assert.equal(get('shop-menu-toggle').getAttribute('aria-expanded'),'false');
assert.ok(activities>=4);
assert.equal(networkRequests,0);
const {isAnyDialogOpen}=await import('../showcase/lab/form/studio-ui.js');
globalThis.document=document;
assert.equal(isAnyDialogOpen(),false);
get('shop-product-dialog').open=true;assert.equal(isAnyDialogOpen(),true,'Product details block the actual studio motion gate');get('shop-product-dialog').open=false;
get('shop-bag-dialog').open=true;assert.equal(isAnyDialogOpen(),true,'The demo bag blocks the actual studio motion gate');get('shop-bag-dialog').open=false;
delete globalThis.document;
for(const product of PRODUCTS){const svg=productArt(product);assert.ok(svg.startsWith('<svg'));assert.ok(svg.includes(product.name));}
console.log(JSON.stringify({passed:true,checks:'collection search and categories, variant-aware bounded bag, quantity/removal and trusted totals, original-studio handoff, reduced-motion navigation, message validation and safe preview, local downloads, menu and dialog activity'}));
