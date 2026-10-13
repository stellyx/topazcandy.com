import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
const base='showcase/lab/tattoo/';
const html=readFileSync(base+'index.html','utf8');
const css=readFileSync(base+'styles.css','utf8');
const app=readFileSync(base+'app.js','utf8');
assert.ok(html.includes('https://topazcandy.com/showcase/lab/tattoo/'));
assert.ok(!html.includes('chatgpt.site'));
assert.ok(html.includes('<meta name="robots" content="noindex,nofollow">'));
assert.ok(!/butterfly-flight|flying-butterfly|small-butterfly/.test(html+app));
assert.ok(html.includes('moth-wing-left')&&html.includes('moth-wing-right'));
assert.ok(css.includes('prefers-reduced-motion:reduce')||css.includes('prefers-reduced-motion: reduce'));
assert.ok(css.includes('.hero-art-plane .moth-body{position:relative;z-index:2}'));
assert.ok(css.includes('large-wing-left 9.6s ease-in-out infinite'));
assert.ok(css.includes('large-wing-right 9.6s ease-in-out infinite'));
assert.ok(css.includes('moth-hover 12s ease-in-out infinite'));
assert.ok(css.includes('.wings-paused .hero-art-plane{animation-play-state:paused}'));
assert.ok(!/fetch\(|localStorage|sessionStorage|mailto:|window\.open/.test(app));
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
 const href=match[1]; if(/^(https?:|\/)/.test(href))continue;
 assert.ok(existsSync(base+href.split(/[?#]/)[0]),href);
}
for(const name of ['moth-art.webp','serpent-art.webp','botanical-art.webp','ornament-art.webp'])assert.ok(existsSync(base+'assets/'+name));
const home=readFileSync('index.html','utf8'),lab=readFileSync('showcase/lab/index.html','utf8');
assert.equal((home.match(/data-concept="tattoo"/g)||[]).length,1);
assert.ok(home.includes('href="/showcase/lab/tattoo/"'));
assert.equal((lab.match(/<section class="direction /g)||[]).length,13);
assert.ok(lab.includes('THIRTEEN DISTINCT WEBSITE DIRECTIONS'));
assert.ok(lab.includes('href="tattoo/"'));
for(const document of [html,home,lab])assert.ok(document.includes('https://topazcandy.com/contact/?service=website#notes=I%20would%20like%20to%20customize%20the%20Tinta'));

function fixture(reduced=false){
 class Element {
  constructor(dataset={}){this.dataset=dataset;this.events={};this.attrs={};this.value='';this.hidden=false;this.disabled=false;this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),toggle:(c,on)=>{if(on??!this.classes.has(c))this.classes.add(c);else this.classes.delete(c);},contains:c=>this.classes.has(c)};}
  addEventListener(n,f){(this.events[n]??=[]).push(f);}
  emit(n,e={}){return Promise.all((this.events[n]||[]).map(f=>f({preventDefault(){},target:this,...e})));}
  setAttribute(k,v){this.attrs[k]=v;}
  setCustomValidity(v){this.validity=v;}
  reportValidity(){return !this.validity;}
  focus(){this.focused=true;}
  select(){this.selected=true;}
  showModal(){this.open=true;}
  close(){this.open=false;this.emit('close');}
  getBoundingClientRect(){return {left:100,right:800,top:100,bottom:800};}
 }
 const nodes=new Map(), works=Array.from({length:4},(_,i)=>new Element({work:String(i)})), filters=['all','nocturno','botanico','ornamental'].map(filter=>new Element({filter}));
 const get=s=>{if(!nodes.has(s))nodes.set(s,new Element());return nodes.get(s);};
 const pref={matches:reduced,addEventListener(n,f){this.change=f;}};
 const doc={querySelector:get,querySelectorAll:s=>s==='[data-work]'?works:s==='[data-filter]'?filters:[],body:new Element(),documentElement:new Element()};
 const context=vm.createContext({document:doc,window:{matchMedia:()=>pref},navigator:{clipboard:{writeText:async s=>{context.copied=s;}}},Date,console});
 vm.runInContext(app,context);
 return{get,works,filters,pref,doc,context};
}
const f=fixture();
await f.get('#next-work').emit('click');assert.equal(f.get('#selected-title').textContent,'Eterno retorno');
await f.get('#previous-work').emit('click');assert.equal(f.get('#selected-title').textContent,'Nocturna');
await f.filters[2].emit('click');assert.equal(f.get('#selected-title').textContent,'La vigilia');assert.equal(f.get('#next-work').disabled,true);assert.equal(f.works[0].hidden,true);
await f.filters[0].emit('click');assert.equal(f.get('#next-work').disabled,false);
await f.works[3].emit('click');assert.equal(f.get('#selected-title').textContent,'Reliquia');
await f.get('#stage-open').emit('click');assert.equal(f.get('#art-dialog').open,true);assert.equal(f.doc.body.classList.contains('modal-open'),true);
await f.get('#art-dialog').emit('keydown',{key:'ArrowRight'});assert.equal(f.get('#selected-title').textContent,'Nocturna');
await f.get('.dialog-close').emit('click');assert.equal(f.get('#art-dialog').open,false);assert.equal(f.doc.body.classList.contains('modal-open'),false);
await f.get('#stage-open').emit('pointerdown',{clientX:180,clientY:100});await f.get('#stage-open').emit('pointerup',{clientX:70,clientY:105});assert.equal(f.get('#selected-title').textContent,'Eterno retorno');
await f.get('#idea-form').emit('submit');assert.ok(f.get('#idea-text').validity);
f.get('#idea-text').value='Una rosa';f.get('#style').value='Botánico';f.get('#placement').value='Antebrazo';await f.get('#idea-text').emit('input');await f.get('#idea-form').emit('submit');assert.ok(f.get('#brief-output').value.includes('Una rosa'));assert.equal(f.get('#brief-result').hidden,false);
await f.get('#copy-brief').emit('click');assert.equal(f.context.copied,f.get('#brief-output').value);
await f.get('#wing-toggle').emit('click');assert.equal(f.get('#hero-art-window').classList.contains('wings-paused'),true);assert.equal(f.get('#wing-toggle').attrs['aria-pressed'],'true');
await f.get('#wing-toggle').emit('click');assert.equal(f.get('#hero-art-window').classList.contains('wings-paused'),false);
const r=fixture(true);assert.equal(r.get('#hero-art-window').classList.contains('wings-paused'),true);r.pref.change({matches:false});assert.equal(r.get('#hero-art-window').classList.contains('wings-paused'),false);
console.log(JSON.stringify({passed:true,checks:'13 gallery concepts, direct Topaz routes, local assets, filters, next/previous, modal open/close, keyboard/swipe, local brief/copy, wing pause/resume and reduced-motion initialization'}));
