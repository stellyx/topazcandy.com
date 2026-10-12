import { COPY, COURSE, WEEKS, makePrompt } from './content.mjs?v=1';
import { createEnrollmentSender } from './enrollment.mjs?v=1';
import { sendMessage } from '../assets/topaz/form.mjs?v=1';

let language = document.documentElement.lang === 'es' ? 'es' : 'en';
let translating = false, promptBuilt=false, formState='', languageChosen=false;
const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));
const form = $('#enrollment-form');
const status = $('#enrollment-status');
const submit = $('#enrollment-submit');
const wave = $('#wave-displacement');
const promptResult = $('#prompt-result');
const promptGoal = $('#prompt-goal');
const progressKey='topaz-ai-practice-v1';
let completed=[];
let storageAvailable=true;
let motionPaused=reducedMotion.matches;

function setFormState(state) {
  formState=state;
  status.dataset.state=state;
  status.textContent=state ? COPY[language][state] : '';
  submit.querySelector('[data-i18n]').textContent=COPY[language][state==='sending'?'sending':state==='received'?'sent':'submit'];
}
function updatePrompt(announce=false) {
  if(!promptBuilt) {promptResult.value=COPY[language].sampleDefault;return;}
  promptResult.value=makePrompt(promptGoal.value,$('#prompt-kind').value,language);
  $('#prompt-copy').disabled=!promptResult.value;
  $('#prompt-save').disabled=!promptResult.value;
  if(announce)$('#prompt-status').textContent=COPY[language].promptReady;
}
function applyLanguage(next) {
  language=next;
  document.documentElement.lang=next;
  const t=COPY[next];
  $$('[data-i18n]').forEach(el=>{el.textContent=t[el.dataset.i18n];});
  for(const attribute of ['aria-label','placeholder']) {
    $$('[data-i18n-'+attribute+']').forEach(el=>{el.setAttribute(attribute,t[el.getAttribute('data-i18n-'+attribute)]);});
  }
  $$('[data-week]').forEach(el=>{el.textContent=WEEKS[Number(el.dataset.week)][next].title;});
  $$('[data-practice]').forEach(el=>{el.textContent=WEEKS[Number(el.dataset.practice)][next].note;});
  $$('[data-lesson]').forEach(el=>{
    const lesson=WEEKS.flatMap(w=>w.lessons).find(l=>l.n===Number(el.dataset.lesson));
    el.textContent=lesson[next][el.dataset.lessonField];
  });
  $$('[data-language]').forEach(el=>el.setAttribute('aria-current',String(el.dataset.language===next)));
  if(!languageChosen)form.elements.language.value=next;
  document.title=t.title;
  $$('meta[name=description],meta[property="og:description"],meta[name="twitter:description"]').forEach(el=>el.content=t.description);
  $$('meta[property="og:title"],meta[name="twitter:title"]').forEach(el=>el.content=t.title);
  const url='https://topazcandy.com'+COURSE.routes[next];
  $('link[rel=canonical]').href=url;
  $('meta[property="og:url"]').content=url;
  $('[data-course-home]').href=COURSE.routes[next];
  $('[data-nav-label]').setAttribute('aria-label',next==='es'?'Secciones del curso':'Course sections');
  $('[data-footer-label]').setAttribute('aria-label',next==='es'?'Navegación del pie':'Footer navigation');
  const schema=JSON.parse($('#course-schema').textContent);
  schema.description=t.description;schema.url=url;schema.offers.url=url+'#enroll';
  schema.coursePrerequisites=next==='es'?'No se requiere experiencia con IA ni programación.':'No AI or coding experience required.';
  $('#course-schema').textContent=JSON.stringify(schema);
  history.replaceState(null,'',COURSE.routes[next]+location.search+location.hash);
  if(formState)setFormState(formState);
  // Revalidate displayed messages in the selected language without sending.
  if($$('#enrollment-form [aria-invalid=true]').length)clearFormErrors();
  updatePrompt();
  if(!storageAvailable)$('#storage-status').textContent=t.progressUnavailable;
  updateMotion();
}

async function switchLanguage(next) {
  if(next===language||translating||!Object.hasOwn(COPY,next))return;
  translating=true;
  document.body.dataset.translating='true';
  const scrollYBefore=window.scrollY;
  const visible=$$('[data-i18n],[data-week],[data-lesson],[data-practice]').filter(el=>{
    const rect=el.getBoundingClientRect();
    return rect.width>0 && rect.height>0 && rect.top<innerHeight+20 && rect.bottom>-20;
  });
  const animated=visible.filter(el=>!el.querySelector('[data-i18n],[data-week],[data-lesson]'));
  let animations=[];
  const animate=typeof Element.prototype.animate==='function';
  if(!reducedMotion.matches&&animate) {
    animated.forEach((el,index)=>{
      el.classList.add('translation-wave');
      animations.push(el.animate([
        {opacity:1,transform:'translateX(0) skewX(0deg)'},
        {opacity:.5,transform:'translateX(3px) skewX(-2deg)',offset:.5},
        {opacity:0,transform:'translateX(-3px) skewX(2deg)'}
      ],{duration:270,delay:Math.min(index*4,70),fill:'forwards',easing:'ease-in-out'}));
    });
    const began=performance.now();
    const ripple=now=>{const p=Math.min(1,(now-began)/340);wave.setAttribute('scale',String(13*p));if(p<1)requestAnimationFrame(ripple);};
    requestAnimationFrame(ripple);
    await Promise.all(animations.map(a=>a.finished.catch(()=>{})));
    wave.setAttribute('scale','13');
  } else if(animate) {
    animated.forEach(el=>animations.push(el.animate([{opacity:1},{opacity:0}],{duration:120,fill:'forwards'})));
    await Promise.all(animations.map(a=>a.finished.catch(()=>{})));
  }
  // Measure the section above the reader and preserve its visible position.
  const sections=$$('main>section[id]');
  const anchor=sections.filter(el=>el.getBoundingClientRect().top<=95).pop();
  const anchorBefore=anchor?.getBoundingClientRect().top;
  applyLanguage(next);
  if(anchor && typeof anchorBefore==='number')window.scrollTo({top:window.scrollY+anchor.getBoundingClientRect().top-anchorBefore,behavior:'instant'});
  else if(scrollYBefore<150)window.scrollTo({top:scrollYBefore,behavior:'instant'});
  animations.forEach(a=>a.cancel());
  animations=[];
  if(!reducedMotion.matches&&animate) {
    animated.forEach((el,index)=>animations.push(el.animate([
      {opacity:0,transform:'translateX(4px) skewX(-2deg)'},
      {opacity:.6,transform:'translateX(-2px) skewX(1deg)',offset:.55},
      {opacity:1,transform:'translateX(0) skewX(0deg)'}
    ],{duration:330,delay:Math.min(index*3,55),fill:'forwards',easing:'ease-out'})));
    const started=performance.now();
    const settle=now=>{const p=Math.min(1,(now-started)/380);wave.setAttribute('scale',String(13*(1-p)));if(p<1)requestAnimationFrame(settle);};
    requestAnimationFrame(settle);
    await Promise.all(animations.map(a=>a.finished.catch(()=>{})));
  } else if(animate) {
    animated.forEach(el=>animations.push(el.animate([{opacity:0},{opacity:1}],{duration:120,fill:'forwards'})));
    await Promise.all(animations.map(a=>a.finished.catch(()=>{})));
  }
  animations.forEach(a=>a.cancel());
  animated.forEach(el=>el.classList.remove('translation-wave'));
  wave.setAttribute('scale','0');
  document.body.dataset.translating='false';
  $('#language-announcement').textContent=COPY[next].languageAnnouncement;
  translating=false;
}
$$('[data-language]').forEach(el=>el.addEventListener('click',event=>{event.preventDefault();switchLanguage(el.dataset.language);}));

$$('[data-stage]').forEach(button=>button.addEventListener('click',()=>{
  $$('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  $$('[data-stage-panel]').forEach(panel=>{panel.hidden=panel.dataset.stagePanel!==button.dataset.stage;});
}));

function updateMotion() {
  const paused=motionPaused||document.hidden;
  $('.project-stage').dataset.paused=String(paused);
  const toggle=$('[data-motion-toggle]');
  toggle.hidden=false;toggle.textContent=motionPaused?'▶':'Ⅱ';
  toggle.setAttribute('aria-pressed',String(motionPaused));
  toggle.setAttribute('aria-label',COPY[language][motionPaused?'motionPlay':'motionPause']);
}
$('[data-motion-toggle]').addEventListener('click',()=>{motionPaused=!motionPaused;updateMotion();});
document.addEventListener('visibilitychange',updateMotion);
reducedMotion.addEventListener('change',()=>{motionPaused=reducedMotion.matches;updateMotion();});
updateMotion();

$('#prompt-build').addEventListener('click',()=>{
  if(!promptGoal.value.trim()){$('#prompt-status').textContent=COPY[language].promptEmpty;promptGoal.focus();return;}
  promptBuilt=true;updatePrompt(true);
});
$('#prompt-kind').addEventListener('change',()=>{if(promptBuilt)updatePrompt();});
promptGoal.addEventListener('input',()=>{if(promptBuilt)updatePrompt();});
$('#prompt-copy').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(promptResult.value);$('#prompt-status').textContent=COPY[language].promptCopied;}
  catch{promptResult.focus();promptResult.select();$('#prompt-status').textContent=COPY[language].promptSelect;}
});
$('#prompt-save').addEventListener('click',()=>{
  const url=URL.createObjectURL(new Blob([promptResult.value],{type:'text/plain;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='30-day-AI-prompt-'+language+'.txt';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('#prompt-status').textContent=COPY[language].promptDownloaded;
});

try{const stored=JSON.parse(localStorage.getItem(progressKey)||'[]');completed=Array.isArray(stored)?stored.filter(n=>Number.isInteger(n)&&n>=1&&n<=8):[];}
catch{storageAvailable=false;}
function updateProgress(save=false) {
  const checked=$$('[data-progress]').filter(el=>el.checked).map(el=>Number(el.dataset.progress));
  $('#progress-count').textContent=String(checked.length);$('#project-progress').value=checked.length;
  if(save)try{localStorage.setItem(progressKey,JSON.stringify(checked));}catch{storageAvailable=false;}
  if(!storageAvailable)$('#storage-status').textContent=COPY[language].progressUnavailable;
}
$$('[data-progress]').forEach(el=>{el.checked=completed.includes(Number(el.dataset.progress));el.addEventListener('change',()=>updateProgress(true));});
updateProgress();
$('#progress-reset').addEventListener('click',()=>{
  $$('[data-progress]').forEach(el=>{el.checked=false;});updateProgress(true);
});

function clearFormErrors() {
  for(const field of Array.from(form.elements)){field.setCustomValidity?.('');field.removeAttribute('aria-invalid');}
}
const sender=createEnrollmentSender({
  send:sendMessage,
  referenceFactory:()=> 'TC-AI-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+crypto.randomUUID().slice(0,8).toUpperCase()
});
form.elements.language.addEventListener('change',()=>{languageChosen=true;});
const dirty=()=>{languageChosen=true;if(!sender.busy){clearFormErrors();setFormState('');submit.disabled=false;}};
form.addEventListener('input',dirty);form.addEventListener('change',dirty);
form.addEventListener('submit',async event=>{
  event.preventDefault();if(sender.busy)return;
  clearFormErrors();
  const raw=Object.fromEntries(new FormData(form));
  if(raw._honey){setFormState('reload');return;}
  const prior=Array.from(form.elements).map(el=>[el,el.disabled]);
  prior.forEach(([el])=>{el.disabled=true;});
  form.setAttribute('aria-busy','true');setFormState('sending');
  const result=await sender.submit(raw,language);
  prior.forEach(([el,disabled])=>{el.disabled=disabled;});form.setAttribute('aria-busy','false');
  if(result.state==='invalid') {
    for(const[name,message]of Object.entries(result.errors)){
      const field=form.elements[name];field.setCustomValidity(message);field.setAttribute('aria-invalid','true');
      const details=field.closest('details');if(details)details.open=true;
    }
    setFormState('invalid');form.reportValidity();
  }else setFormState(result.state);
  submit.disabled=result.state==='received';
});
submit.disabled=false;
$('[data-question-link]').addEventListener('click',()=>{
  form.elements.notes.closest('details').open=true;
  if(!form.elements.notes.value)form.elements.notes.value=language==='es'?'Tengo una pregunta sobre el curso o el grupo de clase: ':'I have a question about the class or class group: ';
});
$$('[data-year]').forEach(el=>{el.textContent=String(new Date().getFullYear());});
