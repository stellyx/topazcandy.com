
const safeGet=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const safeSet=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
document.querySelectorAll('[data-brief]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;const values=[...new FormData(form)].map(([k,v])=>k+': '+v).join('\n');form.querySelector('[role=status]').textContent='Your preview brief\n'+values+'\n\nPreview only. No request was sent and no appointment was booked.'}));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
