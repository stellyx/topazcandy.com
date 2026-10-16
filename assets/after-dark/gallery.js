(() => {
 const dialog=document.querySelector('#design-gallery'),opener=document.querySelector('[data-gallery-open]');
 opener.addEventListener('click',event=>{event.preventDefault();dialog.showModal();});
 document.querySelector('[data-gallery-close]').addEventListener('click',()=>{dialog.close();opener.focus();});
 dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dialog.close();opener.focus();}});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});
 const cards=[...dialog.querySelectorAll('.gallery-card')],search=document.querySelector('#gallery-search');let category='all';
 function filter(){const query=search.value.trim().toLowerCase();let count=0;cards.forEach(card=>{card.hidden=(category!=='all'&&category!==card.dataset.galleryCategory)||!card.dataset.gallerySearch.includes(query);if(!card.hidden)count++;});document.querySelector('#gallery-count').textContent=`${count} ${count===1?'design':'designs'}`;document.querySelector('#gallery-empty').hidden=count!==0;}
 dialog.querySelectorAll('[data-gallery-filter]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.galleryFilter;dialog.querySelectorAll('[data-gallery-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));filter();}));
 search.addEventListener('input',filter);
})();
