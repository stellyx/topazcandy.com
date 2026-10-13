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
assert.ok(!css.includes('petal-unfurl'));
assert.equal((html.match(/class="bloom-petal"/g)||[]).length,0);
assert.ok(!html.includes('word-bloom'));
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

function fixture(reduced=false, playbackBlocked=false){
 class Element {
  constructor(dataset={}){this.dataset=dataset;this.events={};this.attrs={};this.animations=[];this.value='';this.hidden=false;this.disabled=false;this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),toggle:(c,on)=>{if(on??!this.classes.has(c))this.classes.add(c);else this.classes.delete(c);},contains:c=>this.classes.has(c)};}
  animate(frames,options){const a={frames,options,canceled:false,cancel(){this.canceled=true;}};this.animations.push(a);return a;}
  getAnimations(){return this.animations.filter(a=>!a.canceled);}
  addEventListener(n,f){(this.events[n]??=[]).push(f);}
  emit(n,e={}){return Promise.all((this.events[n]||[]).map(f=>f({preventDefault(){},target:this,...e})));}
  setAttribute(k,v){this.attrs[k]=v;}
  getAttribute(k){return this.attrs[k]??null;}
  play(){this.playCalls=(this.playCalls||0)+1;this.paused=false;return playbackBlocked?Promise.reject(new Error('autoplay blocked')):Promise.resolve();}
  pause(){this.pauseCalls=(this.pauseCalls||0)+1;this.paused=true;}
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
 const pref={matches:reduced,addEventListener(n,f){this.change=e=>{this.matches=e.matches;f(e);};}};
 get('#hero-video').dataset.src='assets/moth-calm-loop.mp4';
 const doc={events:{},hidden:false,addEventListener(n,f){this.events[n]=f;},querySelector:get,querySelectorAll:s=>s==='[data-work]'?works:s==='[data-filter]'?filters:[],body:new Element(),documentElement:new Element()};
 const context=vm.createContext({document:doc,window:{matchMedia:()=>pref},navigator:{clipboard:{writeText:async s=>{context.copied=s;}}},Date,console});
 vm.runInContext(app,context);
 return{get,works,filters,pref,doc,context};
}
const f=fixture();
await f.get('#next-work').emit('click');assert.equal(f.get('#selected-title').textContent,'Eternal Return');
await f.get('#previous-work').emit('click');assert.equal(f.get('#selected-title').textContent,'Nocturne');
await f.filters[2].emit('click');assert.equal(f.get('#selected-title').textContent,'The Vigil');assert.equal(f.get('#next-work').disabled,true);assert.equal(f.works[0].hidden,true);
await f.filters[0].emit('click');assert.equal(f.get('#next-work').disabled,false);
await f.works[3].emit('click');assert.equal(f.get('#selected-title').textContent,'Relic');
await f.get('#stage-open').emit('click');assert.equal(f.get('#art-dialog').open,true);assert.equal(f.doc.body.classList.contains('modal-open'),true);
await f.get('#art-dialog').emit('keydown',{key:'ArrowRight'});assert.equal(f.get('#selected-title').textContent,'Nocturne');
await f.get('.dialog-close').emit('click');assert.equal(f.get('#art-dialog').open,false);assert.equal(f.doc.body.classList.contains('modal-open'),false);
await f.get('#stage-open').emit('pointerdown',{clientX:180,clientY:100});await f.get('#stage-open').emit('pointerup',{clientX:70,clientY:105});assert.equal(f.get('#selected-title').textContent,'Eternal Return');
await f.get('#idea-form').emit('submit');assert.ok(f.get('#idea-text').validity);
f.get('#idea-text').value='A rose';f.get('#style').value='Botanical';f.get('#placement').value='Forearm';await f.get('#idea-text').emit('input');await f.get('#idea-form').emit('submit');assert.ok(f.get('#brief-output').value.includes('A rose'));assert.equal(f.get('#brief-result').hidden,false);
await f.get('#copy-brief').emit('click');assert.equal(f.context.copied,f.get('#brief-output').value);
await f.get('#bloom-toggle').emit('click');assert.equal(f.doc.documentElement.classList.contains('motion-paused'),true);assert.equal(f.get('#bloom-toggle').attrs['aria-pressed'],'true');
await f.get('#bloom-toggle').emit('click');assert.equal(f.doc.documentElement.classList.contains('motion-paused'),false);
const r=fixture(true);assert.equal(r.doc.documentElement.classList.contains('motion-paused'),true);r.pref.change({matches:false});assert.equal(r.doc.documentElement.classList.contains('motion-paused'),false);
console.log(JSON.stringify({passed:true,checks:'13 gallery concepts, direct Topaz routes, local assets, filters, next/previous, modal open/close, keyboard/swipe, local brief/copy, effects pause/resume and reduced-motion initialization'}));

// The accessible morphing tagline is the single hero heading; the old flower is gone.
assert.equal((html.match(/<h1\b/g)||[]).length,1);
assert.ok(html.includes('<h1 id="hero-title" class="ink-tagline">'));
assert.ok(!/Darkness|blooms\.|bloom-word|word-bloom/.test(html));
assert.ok(css.includes('grid-template-columns:max-content minmax(0,1fr)'));
assert.ok(css.includes('aspect-ratio:2/1'));
console.log(JSON.stringify({passed:true,checks:'single accessible imagination headline; obsolete flower removed; responsive 2:1 morph geometry retained'}));

assert.ok(html.includes('<title>InkMaster Pedro ·'));
assert.ok(html.includes('assets/inkmaster-pedro-wordmark.svg'));
assert.equal((html.match(/class="brand-engraving"/g)||[]).length,2);
assert.ok(html.includes('ROOTS IN TOLUCA'));
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
assert.equal(rapid.get('#selected-title').textContent,'The Vigil');
await rapid.get('#bloom-toggle').emit('click');
const beforePaused=rapid.get('#stage-image').animations.length;
await rapid.get('#next-work').emit('click');
assert.equal(rapid.get('#stage-image').animations.length,beforePaused);
assert.equal(rapid.get('#selected-title').textContent,'Relic');
const still=fixture(true);await still.get('#next-work').emit('click');
assert.equal(still.get('#stage-image').animations.length,0);
console.log(JSON.stringify({passed:true,checks:'latest gallery selection wins, prior animation canceled, paused/reduced motion keeps interactions immediate'}));

// Selected calm movie never requests bytes for reduced motion and fails back to original art.
assert.ok(html.includes('autoplay muted playsinline loop preload="none"'));
assert.ok(html.includes('data-src="assets/moth-calm-loop.mp4"'));
assert.ok(!/<video[^>]*\ssrc=/.test(html));
assert.ok(html.includes('poster="assets/moth-calm-poster.jpg"'));
for(const name of ['moth-calm-loop.mp4','moth-calm-poster.jpg'])assert.ok(existsSync(base+'assets/'+name));
assert.ok(css.includes('.hero-art-window .hero-video{display:none;transition:none}'));
const movie=fixture();const video=movie.get('#hero-video');
assert.equal(video.getAttribute('src'),'assets/moth-calm-loop.mp4');
assert.equal(video.muted,true);assert.equal(video.defaultMuted,true);assert.ok(video.playCalls>0);
assert.equal(video.classList.contains('is-playing'),false);
await video.emit('playing');assert.equal(video.classList.contains('is-playing'),true);
await movie.get('#bloom-toggle').emit('click');assert.equal(video.paused,true);
await video.emit('playing');assert.equal(video.paused,true);
await movie.get('#bloom-toggle').emit('click');assert.equal(video.paused,false);
movie.doc.hidden=true;movie.doc.events.visibilitychange();assert.equal(video.paused,true);
movie.doc.hidden=false;movie.doc.events.visibilitychange();assert.equal(video.paused,false);
movie.pref.change({matches:true});assert.equal(video.paused,true);assert.equal(video.classList.contains('is-playing'),false);
movie.pref.change({matches:false});await video.emit('playing');assert.equal(video.classList.contains('is-playing'),true);
await video.emit('error');assert.equal(video.paused,true);assert.equal(video.classList.contains('is-playing'),false);
const playCallsAfterError=video.playCalls;movie.doc.events.visibilitychange();assert.equal(video.playCalls,playCallsAfterError);
const reduce=fixture(true);assert.equal(reduce.get('#hero-video').getAttribute('src'),null);assert.equal(reduce.get('#hero-video').playCalls,undefined);
const blocked=fixture(false,true);await Promise.resolve();assert.equal(blocked.get('#hero-video').classList.contains('is-playing'),false);
console.log(JSON.stringify({passed:true,checks:'calm video muted inline loop, lazy source, original fallback, pause/resume, hidden tab, dynamic reduced motion, blocked autoplay and media-error fallback'}));

assert.ok(html.includes('<html lang="en">'));
assert.ok(html.includes('<span class="ink-tagline__accessible">My imagination on your skin.</span>'));
assert.ok(html.includes('<title>InkMaster Pedro · My imagination on your skin.</title>'));
assert.ok(f.get('#brief-output').value.startsWith('Hi, I would like to talk with you about an idea for a tattoo.'));
assert.ok(f.get('#brief-output').value.includes('Style: Botanical'));
assert.equal(f.get('#copy-status').textContent,'Message copied.');
assert.equal(f.get('#bloom-toggle').textContent,'Pause effects');
assert.ok(!/Saltar a la obra|Pausar|Activar|Estilo|Cuéntanos|Ilustración|El artista|a pantalla completa|RAÍCES EN|florece\./.test(html+app));
console.log(JSON.stringify({passed:true,checks:'English document, exact requested tagline, translated inquiry and effects UI'}));
const english=fixture();
await english.get('#idea-form').emit('submit');
assert.equal(english.get('#idea-text').validity,'Tell us a little about your idea.');
english.get('#idea-text').value='A moon';english.get('#style').value='Blackwork';
await english.get('#idea-form').emit('submit');
assert.ok(english.get('#brief-output').value.includes('Placement: To be decided'));
english.context.navigator.clipboard.writeText=async()=>{throw new Error('clipboard unavailable');};
await english.get('#copy-brief').emit('click');
assert.equal(english.get('#copy-status').textContent,'Text selected. Use Copy on your device.');
await english.get('#next-work').emit('click');
assert.equal(english.get('#stage-open').attrs['aria-label'],'Open Eternal Return in fullscreen');
assert.equal(english.works[0].attrs['aria-label'],'Select Nocturne');
assert.ok(html.includes('>Nocturnal</button>'));
console.log(JSON.stringify({passed:true,checks:'English validation, default placement, clipboard failure and dynamic accessibility labels'}));
assert.ok(!html.includes('class="hero-art-ring"'));
assert.ok(existsSync(base+'assets/hero-wood-frame.svg'));
assert.ok(css.includes("background:url('assets/hero-wood-frame.svg') center/100% 100% no-repeat"));
assert.ok(css.includes('border-radius:50% 50% 1px 1px / 48.15% 48.15% 1px 1px'));
console.log(JSON.stringify({passed:true,checks:'tilted outline removed; aligned responsive wood-arch overlay preserves hero media'}));
