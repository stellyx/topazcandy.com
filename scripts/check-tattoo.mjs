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
assert.ok(!/moth-wing|moth-walker|moth-legs|moth-step|moth-moon/.test(html+app));
assert.ok(html.includes('id="hero-image" src="assets/moth-art.webp"'));
assert.ok(html.includes('id="bloom-toggle"'));
assert.ok(css.includes('petal-unfurl 6.4s'));
assert.equal((html.match(/class="bloom-petal"/g)||[]).length,8);
assert.ok(css.includes('.motion-paused .bloom-petal'));
assert.ok(css.includes('.hero-art-window #hero-image{mix-blend-mode:normal;transform:none;animation:none}'));
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
for(const document of [html,home,lab])assert.ok(document.includes('https://topazcandy.com/contact/?service=website#notes=I%20would%20like%20to%20customize%20the%20InkMaster'));

function fixture(reduced=false){
 class Element {
  constructor(dataset={}){this.dataset=dataset;this.events={};this.attrs={};this.animations=[];this.value='';this.hidden=false;this.disabled=false;this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),toggle:(c,on)=>{if(on??!this.classes.has(c))this.classes.add(c);else this.classes.delete(c);},contains:c=>this.classes.has(c)};}
  animate(frames,options){const a={frames,options,canceled:false,cancel(){this.canceled=true;}};this.animations.push(a);return a;}
  getAnimations(){return this.animations.filter(a=>!a.canceled);}
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
await f.get('#bloom-toggle').emit('click');assert.equal(f.doc.documentElement.classList.contains('motion-paused'),true);assert.equal(f.get('#bloom-toggle').attrs['aria-pressed'],'true');
await f.get('#bloom-toggle').emit('click');assert.equal(f.doc.documentElement.classList.contains('motion-paused'),false);
const r=fixture(true);assert.equal(r.doc.documentElement.classList.contains('motion-paused'),true);r.pref.change({matches:false});assert.equal(r.doc.documentElement.classList.contains('motion-paused'),false);
console.log(JSON.stringify({passed:true,checks:'13 gallery concepts, direct Topaz routes, local assets, filters, next/previous, modal open/close, keyboard/swipe, local brief/copy, flower pause/resume and reduced-motion initialization'}));

// Source-level loop closure and conservative frame bounds, without a browser.
function keyframeBody(name){
 const start=css.indexOf('@keyframes '+name+'{');assert.ok(start>=0,name);
 let depth=1,end=css.indexOf('{',start)+1,index=end;
 for(;depth&&index<css.length;index++){if(css[index]==='{')depth++;if(css[index]==='}')depth--;}
 return css.slice(end,index-1);
}
for(const name of ['petal-unfurl','leaf-unfurl','bloom-heart']){
 const frames=[...keyframeBody(name).matchAll(/([^{}]+)\{([^{}]*)\}/g)];
 const at=p=>frames.find(m=>m[1].split(',').map(s=>s.trim()).includes(p))?.[2].trim();
 assert.ok(at('0%'),name+' starts explicitly');assert.equal(at('0%'),at('100%'),name+' has identical loop endpoints');
}
console.log(JSON.stringify({passed:true,checks:'three matching flower-loop endpoints; butterfly image static and all walking/wing layers removed'}));

assert.ok(html.includes('<title>InkMaster Pedro ·'));
assert.ok(html.includes('assets/inkmaster-pedro-wordmark.svg'));
assert.equal((html.match(/class="brand-engraving"/g)||[]).length,2);
assert.ok(html.includes('RAÍCES EN TOLUCA'));
assert.ok(!/Tinta|Umbría|umbría|TAMAULIPAS|NOMBRE DEL ARTISTA/.test(html));
assert.ok(!html.includes('assets/social-cover.png'));
assert.ok(home.includes('InkMaster Pedro')&&lab.includes('InkMaster'));

assert.ok(css.includes('.motion-paused .ink-line{animation-play-state:paused}'));
assert.ok(css.includes('@media(prefers-reduced-motion:reduce){.ink-line{animation:none'));
assert.ok(app.includes('element.getAnimations?.().forEach(animation=>animation.cancel())'));
assert.ok(existsSync(base+'assets/wordmark-typeface-OFL.txt'));
assert.ok(readFileSync(base+'assets/inkmaster-pedro-wordmark.svg','utf8').includes('<title id="brand-title">InkMaster Pedro</title>'));

const rapid=fixture();
await rapid.get('#next-work').emit('click');
const firstReveal=rapid.get('#stage-image').animations[0];
assert.equal(firstReveal.options.duration,340);
await rapid.get('#next-work').emit('click');
assert.equal(firstReveal.canceled,true);
assert.equal(rapid.get('#selected-title').textContent,'La vigilia');
await rapid.get('#bloom-toggle').emit('click');
const beforePaused=rapid.get('#stage-image').animations.length;
await rapid.get('#next-work').emit('click');
assert.equal(rapid.get('#stage-image').animations.length,beforePaused);
assert.equal(rapid.get('#selected-title').textContent,'Reliquia');
const still=fixture(true);await still.get('#next-work').emit('click');
assert.equal(still.get('#stage-image').animations.length,0);
console.log(JSON.stringify({passed:true,checks:'latest gallery selection wins, prior animation canceled, paused/reduced motion keeps interactions immediate'}));
