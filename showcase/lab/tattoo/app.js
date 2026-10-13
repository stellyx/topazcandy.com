'use strict';
const works=[
 {title:'Nocturna',file:'moth-art.webp',category:'nocturno',label:'NOCTURNO',roman:'I',description:'Alas que parecen guardar un secreto. Simetría delicada, sombras profundas y un pulso casi vivo.',alt:'Mariposa nocturna ornamental con sombras y delicados detalles, ilustración conceptual'},
 {title:'Eterno retorno',file:'serpent-art.webp',category:'nocturno',label:'NOCTURNO',roman:'II',description:'Una serpiente entre espinas. La fuerza del movimiento y la tensión de un símbolo que vuelve sobre sí mismo.',alt:'Serpiente oscura entre ramas espinosas, ilustración conceptual'},
 {title:'La vigilia',file:'botanical-art.webp',category:'botanico',label:'BOTÁNICO',roman:'III',description:'Una rosa que florece en la sombra. Pétalos densos, hojas delicadas y el contraste de lo frágil con lo eterno.',alt:'Rosa oscura con pétalos detallados y ornamentación botánica, ilustración conceptual'},
 {title:'Reliquia',file:'ornament-art.webp',category:'ornamental',label:'ORNAMENTAL',roman:'IV',description:'Una daga de otra época. Arquitectura gótica, equilibrio y pequeños detalles que invitan a mirar dos veces.',alt:'Daga ornamental inspirada en arquitectura gótica, ilustración conceptual'}
];
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
let visible=[0,1,2,3],current=0,suppressClickUntil=0;
const dialog=$('#art-dialog');
function labelFor(work){return work.label+' / ESTUDIO '+work.roman;}
function renderWork(index){
 current=index;const work=works[index];const page=String(visible.indexOf(index)+1).padStart(2,'0')+' / '+String(visible.length).padStart(2,'0');
 $('#stage-image').src='assets/'+work.file;$('#stage-image').alt=work.alt;$('#stage-open').setAttribute('aria-label','Abrir '+work.title+' a pantalla completa');$('#stage-roman').textContent=work.roman;$('#stage-page').textContent=page;$('#selected-category').textContent=labelFor(work);$('#selected-title').textContent=work.title;$('#selected-description').textContent=work.description;
 $$('[data-work]').forEach(button=>{const selected=Number(button.dataset.work)===index;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));});
 $('#previous-work').disabled=visible.length<2;$('#next-work').disabled=visible.length<2;
 $('#dialog-img').src='assets/'+work.file;$('#dialog-img').alt=work.alt;$('#dialog-category').textContent=labelFor(work);$('#dialog-title').textContent=work.title;$('#dialog-page').textContent=page;$('#dialog-prev').disabled=visible.length<2;$('#dialog-next').disabled=visible.length<2;
}
function step(delta){const position=visible.indexOf(current);renderWork(visible[(position+delta+visible.length)%visible.length]);}
$$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 const filter=button.dataset.filter;visible=works.map((w,i)=>({w,i})).filter(({w})=>filter==='all'||w.category===filter).map(({i})=>i);
 $$('[data-filter]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 $$('[data-work]').forEach(b=>b.hidden=!visible.includes(Number(b.dataset.work)));
 renderWork(visible.includes(current)?current:visible[0]);
}));
$$('[data-work]').forEach(button=>{button.setAttribute('aria-label','Seleccionar '+works[Number(button.dataset.work)].title);button.addEventListener('click',()=>renderWork(Number(button.dataset.work)));});
$('#previous-work').addEventListener('click',()=>step(-1));$('#next-work').addEventListener('click',()=>step(1));$('#dialog-prev').addEventListener('click',()=>step(-1));$('#dialog-next').addEventListener('click',()=>step(1));
function openArt(){if(Date.now()<suppressClickUntil)return;renderWork(current);dialog.showModal();document.body.classList.add('modal-open');}
function closeArt(){dialog.close();document.body.classList.remove('modal-open');}
$('#stage-open').addEventListener('click',openArt);$('.dialog-close').addEventListener('click',closeArt);dialog.addEventListener('close',()=>document.body.classList.remove('modal-open'));
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeArt();}});
function arrowKeys(e){if(e.key==='ArrowRight'){e.preventDefault();step(1);}else if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}}
dialog.addEventListener('keydown',arrowKeys);$('#stage-open').addEventListener('keydown',arrowKeys);$('.thumbnail-list').addEventListener('keydown',arrowKeys);
function addSwipe(element){let start=null;element.addEventListener('pointerdown',e=>{if(e.isPrimary===false)return;start={x:e.clientX,y:e.clientY};});element.addEventListener('pointerup',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.abs(dx)>44&&Math.abs(dx)>Math.abs(dy)*1.3){suppressClickUntil=Date.now()+450;step(dx<0?1:-1);}});element.addEventListener('pointercancel',()=>start=null);element.addEventListener('dragstart',e=>e.preventDefault());}
addSwipe($('#stage-open'));addSwipe($('#dialog-image-area'));
const form=$('#idea-form');form.addEventListener('submit',e=>{e.preventDefault();const idea=$('#idea-text').value.trim();if(!idea){$('#idea-text').setCustomValidity('Cuéntanos un poco de tu idea.');$('#idea-text').reportValidity();return;}const style=$('#style').value,placement=$('#placement').value.trim()||'Por definir';$('#brief-output').value=`Hola, me gustaría platicar contigo sobre una idea para un tatuaje.\n\nEstilo: ${style}\nZona: ${placement}\nMi idea: ${idea}\n\n¿Podemos conversar sobre el diseño, el tamaño y la disponibilidad?`;$('#brief-result').hidden=false;$('#copy-status').textContent='';$('#brief-output').focus();});$('#idea-text').addEventListener('input',e=>e.target.setCustomValidity(''));$('#copy-brief').addEventListener('click',async()=>{const output=$('#brief-output');try{await navigator.clipboard.writeText(output.value);$('#copy-status').textContent='Mensaje copiado.';}catch{output.focus();output.select();$('#copy-status').textContent='Seleccionado. Usa Copiar en tu dispositivo.';}});
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
if('IntersectionObserver'in window&&!reduceMotion.matches){document.documentElement.classList.add('js-reveal');const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.03,rootMargin:'0px 0px 50px 0px'});$$('.reveal').forEach(el=>observer.observe(el));}
const wingToggle=document.querySelector('#wing-toggle');
const largeMoth=document.querySelector('#hero-art-window');
let wingsPaused=reduceMotion.matches;
function setWingState(paused){wingsPaused=paused;largeMoth.classList.toggle('wings-paused',paused);wingToggle.setAttribute('aria-pressed',String(paused));wingToggle.textContent=paused?'Activar alas':'Pausar alas';wingToggle.setAttribute('aria-label',paused?'Activar el aleteo de la mariposa grande':'Pausar el aleteo de la mariposa grande');}
wingToggle.addEventListener('click',()=>setWingState(!wingsPaused));
if(reduceMotion.matches)setWingState(true);
reduceMotion.addEventListener?.('change',e=>setWingState(e.matches));
