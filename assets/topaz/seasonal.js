'use strict';
(() => {
  // One still seasonal accent below the header. Normal branding resumes November 1.
  const START = '2026-10-12';
  const END = '2026-11-01';
  const STYLE_URL = new URL('seasonal.css?v=3', document.currentScript.src).href;
  const pumpkin = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 62" focusable="false" aria-hidden="true"><defs><radialGradient id="tc-pumpkin-light" cx="35%" cy="30%" r="75%"><stop stop-color="#c9a16b"/><stop offset=".6" stop-color="#b38953"/><stop offset="1" stop-color="#927043"/></radialGradient></defs><path d="M31 17c-2-8 1-11 6-13l3 3c-5 2-6 5-5 10" fill="#73734f"/><path d="M32 17C14 9 3 23 5 39c1 16 13 21 27 19 16 2 27-5 28-19 2-17-10-29-28-22Z" fill="url(#tc-pumpkin-light)"/><path d="M29 18C16 19 13 48 27 57m8-39c12 3 14 29 2 39M21 18C6 22 8 45 17 52m27-34c13 6 13 26 4 34M32 18c-4 10-4 27 0 40" fill="none" stroke="#896b45" stroke-width="1"/><path d="M16 26c-2 3-3 6-3 10" fill="none" stroke="#d5b884" stroke-width="1.4" stroke-linecap="round"/></svg>';
  function dayInChicago(now) {
    const values = Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(part=>[part.type,part.value]));
    return values.year+'-'+values.month+'-'+values.day;
  }
  function isActive(now = new Date()) { try { const day=dayInChicago(now); return day>=START && day<END; } catch { return false; } }
  function position() {
    const decor=document.getElementById('tc-season-decor');
    if (!decor) return;
    const header=document.querySelector('.site-header,.head,header');
    const top=header ? header.getBoundingClientRect().bottom+window.scrollY+18 : 118;
    decor.style.top=Math.max(18,top)+'px';
  }
  function sync() {
    const active=isActive();
    document.documentElement.classList.toggle('tc-halloween',active);
    // No header decoration, bats, moon or motion controls in this treatment.
    document.querySelectorAll('.tc-season-mark,.tc-season-note,#tc-season-toggle').forEach(node=>node.remove());
    if (!active) {
      document.getElementById('tc-season-decor')?.remove();
      document.getElementById('tc-season-style')?.remove(); return;
    }
    if (!document.getElementById('tc-season-style')) {
      const link=document.createElement('link'); link.id='tc-season-style'; link.rel='stylesheet'; link.href=STYLE_URL; document.head.appendChild(link);
    }
    if (!document.getElementById('tc-season-decor')) {
      const decor=document.createElement('div'); decor.id='tc-season-decor'; decor.setAttribute('aria-hidden','true'); decor.innerHTML=pumpkin; document.body.appendChild(decor);
    }
    position();
  }
  window.TopazSeason=Object.freeze({isActive,ends:END,timeZone:'America/Chicago'});
  sync();
  window.addEventListener('pageshow',sync); window.addEventListener('focus',sync);
  window.addEventListener('resize',position); window.addEventListener('load',position);
  document.fonts?.ready.then(position);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});
  setInterval(()=>{if(!document.hidden)sync();},60000);
})();
