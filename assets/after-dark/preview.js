const rail=document.querySelector('.work-rail');
const cards=[...document.querySelectorAll('.card')];
const status=document.querySelector('#work-status');
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('[data-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
 cards.forEach(card=>card.hidden=button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter);
 rail.scrollLeft=0;status.textContent=`${cards.filter(card=>!card.hidden).length} designs shown`;
 document.dispatchEvent(new Event('portfoliochange'));
}));
document.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>rail.scrollBy({left:Number(button.dataset.step)*(rail.querySelector('.card:not([hidden])').getBoundingClientRect().width+20),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})));
document.querySelector('#brief-form').addEventListener('submit',event=>{
 event.preventDefault();const idea=document.querySelector('#idea').value.trim();if(!idea)return;
 document.querySelector('#brief-text').textContent=`Project: ${document.querySelector('#kind').value}\n\n${idea}\n\nTo discuss: intended use, deliverables, timing, budget and revisions.`;
 document.querySelector('#send-enquiry').href='/contact/?service=brand#'+new URLSearchParams({notes:document.querySelector('#brief-text').textContent});
 document.querySelector('#brief-result').hidden=false;
});
document.querySelector('#copy-brief').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(document.querySelector('#brief-text').textContent);document.querySelector('#copy-status').textContent='Copied. Paste this into the existing enquiry form when ready.';}
 catch{document.querySelector('#copy-status').textContent='Copy is unavailable here. Select and copy the brief text above.';}
});
