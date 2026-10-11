import {recommendation,messageLink,visitNotes} from './finder.mjs?v=2';
import {initSalonMotion,initSalonReveals} from './motion.mjs';
const profile=JSON.parse(document.getElementById('profile-data').textContent);
const services=JSON.parse(document.getElementById('service-data').textContent);
let goal='color',guest='new';
const result=document.getElementById('finder-result');
const title=document.getElementById('finder-title');
const note=document.getElementById('finder-note');
const message=document.getElementById('finder-message');
const booking=document.getElementById('finder-booking');
const copyStatus=document.getElementById('copy-status');
const notesField=document.getElementById('visit-notes');
function updateFinder(announce=true){
  const r=recommendation(goal,guest,services);
  title.textContent=r.title;
  note.textContent=profile.mode==='template'?r.note.replaceAll('MJ','your stylist'):r.note;
  message.href=messageLink(profile,goal,guest);
  message.textContent=profile.mode==='template'?'Ask about this template ↗':'Text MJ about this ↗';
  const ask=r.action==='ask';
  result.dataset.action=r.action;
  message.className=ask?'button':'text-link';
  booking.className=ask?'text-link':'button';
  booking.textContent=ask?'Browse the booking menu ↗':'Open the booking menu ↗';
  booking.parentElement.prepend(ask?message:booking);
  result.dataset.goal=goal;
  copyStatus.textContent='';
  notesField.hidden=true;
  if(announce)document.getElementById('finder-live').textContent='Recommendation updated: '+r.title;
  document.querySelectorAll('[data-goal]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.goal===goal)));
}
document.querySelectorAll('[data-goal]').forEach(b=>b.addEventListener('click',()=>{goal=b.dataset.goal;updateFinder();}));
document.querySelectorAll('input[name="guest"]').forEach(r=>r.addEventListener('change',()=>{guest=r.value;updateFinder();}));
document.querySelectorAll('[data-finder-goal]').forEach(a=>a.addEventListener('click',()=>{
 goal=a.dataset.finderGoal;updateFinder();
}));
updateFinder(false);
document.getElementById('copy-visit').addEventListener('click',async()=>{
 const notes=visitNotes(profile,goal,guest,services);
 try {
  if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
  await navigator.clipboard.writeText(notes);
  copyStatus.textContent='Copied. Add your hair history or inspiration before sharing.';
 } catch {
  notesField.value=notes;notesField.hidden=false;notesField.focus();notesField.select();
  copyStatus.textContent='Your notes are selected below. Copy them using your device’s copy command.';
 }
});
const filters=document.querySelectorAll('[data-filter]');
const rows=document.querySelectorAll('[data-service-group]');
filters.forEach(b=>b.addEventListener('click',()=>{
 filters.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 let n=0;rows.forEach(row=>{row.hidden=b.dataset.filter!=='all'&&row.dataset.serviceGroup!==b.dataset.filter;if(!row.hidden)n++;});
 document.getElementById('menu-live').textContent=n+' services shown';
}));
const menuButton=document.getElementById('nav-toggle');
const nav=document.getElementById('main-nav');
menuButton.addEventListener('click',()=>{const expanded=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(expanded));nav.classList.toggle('open',expanded);});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menuButton.setAttribute('aria-expanded','false');nav.classList.remove('open');}));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){menuButton.setAttribute('aria-expanded','false');nav.classList.remove('open');}});
const dialog=document.getElementById('booking-preview');
if(profile.mode==='template')document.querySelectorAll('a[href="#booking-preview"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();dialog.showModal();}));
document.getElementById('close-preview').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
// Integration hooks only. No analytics account, customer data store or automated messaging is connected.
document.querySelectorAll('[data-event]').forEach(a=>a.addEventListener('click',()=>{
 window.dispatchEvent(new CustomEvent('salon:conversion',{detail:{action:a.dataset.event,placement:a.dataset.placement||'content'}}));
}));
initSalonMotion();
initSalonReveals();
