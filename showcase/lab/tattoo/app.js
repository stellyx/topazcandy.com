'use strict';
const works=[
 {title:'Nocturne',file:'moth-art.webp',category:'nocturno',label:'NOCTURNAL',roman:'I',description:'Wings that seem to hold a secret. Delicate symmetry, deep shadows and an almost living pulse.',alt:'Ornamental moth with shadows and delicate details, concept artwork'},
 {title:'Eternal Return',file:'serpent-art.webp',category:'nocturno',label:'NOCTURNAL',roman:'II',description:'A serpent among thorns. The force of movement and the tension of a symbol returning to itself.',alt:'Dark serpent among thorny branches, concept artwork'},
 {title:'The Vigil',file:'botanical-art.webp',category:'botanico',label:'BOTANICAL',roman:'III',description:'A rose blooming in the shadows. Dense petals, delicate leaves and the contrast between the fragile and the eternal.',alt:'Dark rose with detailed petals and botanical ornamentation, concept artwork'},
 {title:'Relic',file:'ornament-art.webp',category:'ornamental',label:'ORNAMENTAL',roman:'IV',description:'A dagger from another era. Gothic architecture, balance and small details that invite a second look.',alt:'Ornamental dagger inspired by Gothic architecture, concept artwork'}
];
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
let visible=[0,1,2,3],current=0,suppressClickUntil=0;
const dialog=$('#art-dialog');
function animateArtwork(){
 const targets=[$('#stage-image'),$('.selected-info'),$('#dialog-img')];
 for(const element of targets){
  element.getAnimations?.().forEach(animation=>animation.cancel());
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.classList.contains('motion-paused'))continue;
  element.animate?.([{opacity:.55,transform:'translateY(7px) scale(.995)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:340,easing:'cubic-bezier(.2,.7,.2,1)'});
 }
}

function labelFor(work){return work.label+' / STUDY '+work.roman;}
function renderWork(index){
 current=index;const work=works[index];const page=String(visible.indexOf(index)+1).padStart(2,'0')+' / '+String(visible.length).padStart(2,'0');
 $('#stage-image').src='assets/'+work.file;$('#stage-image').alt=work.alt;$('#stage-open').setAttribute('aria-label','Open '+work.title+' in fullscreen');$('#stage-roman').textContent=work.roman;$('#stage-page').textContent=page;$('#selected-category').textContent=labelFor(work);$('#selected-title').textContent=work.title;$('#selected-description').textContent=work.description;
 $$('[data-work]').forEach(button=>{const selected=Number(button.dataset.work)===index;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));});
 $('#previous-work').disabled=visible.length<2;$('#next-work').disabled=visible.length<2;
 $('#dialog-img').src='assets/'+work.file;$('#dialog-img').alt=work.alt;$('#dialog-category').textContent=labelFor(work);$('#dialog-title').textContent=work.title;$('#dialog-page').textContent=page;$('#dialog-prev').disabled=visible.length<2;$('#dialog-next').disabled=visible.length<2;
 animateArtwork();
}
function step(delta){const position=visible.indexOf(current);renderWork(visible[(position+delta+visible.length)%visible.length]);}
$$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 const filter=button.dataset.filter;visible=works.map((w,i)=>({w,i})).filter(({w})=>filter==='all'||w.category===filter).map(({i})=>i);
 $$('[data-filter]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 $$('[data-work]').forEach(b=>b.hidden=!visible.includes(Number(b.dataset.work)));
 renderWork(visible.includes(current)?current:visible[0]);
}));
$$('[data-work]').forEach(button=>{button.setAttribute('aria-label','Select '+works[Number(button.dataset.work)].title);button.addEventListener('click',()=>renderWork(Number(button.dataset.work)));});
$('#previous-work').addEventListener('click',()=>step(-1));$('#next-work').addEventListener('click',()=>step(1));$('#dialog-prev').addEventListener('click',()=>step(-1));$('#dialog-next').addEventListener('click',()=>step(1));
function openArt(){if(Date.now()<suppressClickUntil)return;renderWork(current);dialog.showModal();document.body.classList.add('modal-open');}
function closeArt(){dialog.close();document.body.classList.remove('modal-open');}
$('#stage-open').addEventListener('click',openArt);$('.dialog-close').addEventListener('click',closeArt);dialog.addEventListener('close',()=>document.body.classList.remove('modal-open'));
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeArt();}});
function arrowKeys(e){if(e.key==='ArrowRight'){e.preventDefault();step(1);}else if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}}
dialog.addEventListener('keydown',arrowKeys);$('#stage-open').addEventListener('keydown',arrowKeys);$('.thumbnail-list').addEventListener('keydown',arrowKeys);
function addSwipe(element){let start=null;element.addEventListener('pointerdown',e=>{if(e.isPrimary===false)return;start={x:e.clientX,y:e.clientY};});element.addEventListener('pointerup',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.abs(dx)>44&&Math.abs(dx)>Math.abs(dy)*1.3){suppressClickUntil=Date.now()+450;step(dx<0?1:-1);}});element.addEventListener('pointercancel',()=>start=null);element.addEventListener('dragstart',e=>e.preventDefault());}
addSwipe($('#stage-open'));addSwipe($('#dialog-image-area'));
const form=$('#idea-form');form.addEventListener('submit',e=>{e.preventDefault();const idea=$('#idea-text').value.trim();if(!idea){$('#idea-text').setCustomValidity('Tell us a little about your idea.');$('#idea-text').reportValidity();return;}const style=$('#style').value,placement=$('#placement').value.trim()||'To be decided';$('#brief-output').value=`Hi, I would like to talk with you about an idea for a tattoo.\n\nStyle: ${style}\nPlacement: ${placement}\nMy idea: ${idea}\n\nCould we discuss the design, size and availability?`;$('#brief-result').hidden=false;$('#copy-status').textContent='';$('#brief-output').focus();});$('#idea-text').addEventListener('input',e=>e.target.setCustomValidity(''));$('#copy-brief').addEventListener('click',async()=>{const output=$('#brief-output');try{await navigator.clipboard.writeText(output.value);$('#copy-status').textContent='Message copied.';}catch{output.focus();output.select();$('#copy-status').textContent='Text selected. Use Copy on your device.';}});
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
if('IntersectionObserver'in window&&!reduceMotion.matches){document.documentElement.classList.add('js-reveal');const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.03,rootMargin:'0px 0px 50px 0px'});$$('.reveal').forEach(el=>observer.observe(el));}
const bloomToggle=document.querySelector('#bloom-toggle');
const heroVideo=document.querySelector('#hero-video');
let bloomPaused=reduceMotion.matches;
let videoFailed=false;
function videoAllowed(){return !bloomPaused&&!reduceMotion.matches&&!document.hidden&&!videoFailed;}
function syncHeroVideo(){
 if(!heroVideo)return;
 if(!videoAllowed()){
  heroVideo.pause();
  if(reduceMotion.matches||videoFailed)heroVideo.classList.remove('is-playing');
  return;
 }
 if(!heroVideo.getAttribute('src')){
  heroVideo.muted=true;
  heroVideo.defaultMuted=true;
  heroVideo.setAttribute('src',heroVideo.dataset.src);
 }
 try{heroVideo.play()?.catch(()=>heroVideo.classList.remove('is-playing'));}
 catch{heroVideo.classList.remove('is-playing');}
}
heroVideo?.addEventListener('playing',()=>{
 if(videoAllowed())heroVideo.classList.add('is-playing');
 else heroVideo.pause();
});
heroVideo?.addEventListener('error',()=>{videoFailed=true;syncHeroVideo();});
document.addEventListener('visibilitychange',syncHeroVideo);
function setBloomState(paused){
 bloomPaused=paused;
 document.documentElement.classList.toggle('motion-paused',paused);
 bloomToggle.setAttribute('aria-pressed',String(paused));
 bloomToggle.textContent=paused?'Play effects':'Pause effects';
 bloomToggle.setAttribute('aria-label',paused?'Play the butterfly and decorative effects':'Pause the butterfly and decorative effects');
 syncHeroVideo();
}
bloomToggle.addEventListener('click',()=>setBloomState(!bloomPaused));
setBloomState(bloomPaused);
reduceMotion.addEventListener?.('change',e=>setBloomState(e.matches));
