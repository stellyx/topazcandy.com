'use strict';
(() => {
  // A one-time seasonal treatment. Normal branding resumes on November 1.
  const START = '2026-10-12';
  const END = '2026-11-01';
  const pumpkin = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 44" aria-hidden="true"><path d="M21 12c-3-5-1-8 4-10" fill="none" stroke="#5c7345" stroke-width="3" stroke-linecap="round"/><path d="M20 12C3 6-4 36 11 40c4 1 6-1 9 0 4 1 8 1 12-2 11-8 7-31-6-27Z" fill="#c08a43"/><path d="M18 12C8 20 10 35 18 40m5-28c8 9 8 22 0 28" fill="none" stroke="#986331" stroke-width="1.2" opacity=".65"/><path d="m10 25 5-3 1 5m8-4 5 3-6 1m-9 6q6 4 12-1" fill="none" stroke="#775332" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  function dayInChicago(now) {
    const values = Object.fromEntries(new Intl.DateTimeFormat('en-US', {timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(part => [part.type,part.value]));
    return values.year + '-' + values.month + '-' + values.day;
  }
  function isActive(now = new Date()) { try { const day = dayInChicago(now); return day >= START && day < END; } catch { return false; } }
  function sync() {
    const active = isActive();
    document.documentElement.classList.toggle('tc-halloween', active);
    if (!active) { document.getElementById('tc-season-decor')?.remove(); document.querySelectorAll('.tc-season-mark,.tc-season-note').forEach(node => node.remove()); document.getElementById('tc-season-style')?.remove(); return; }
    if (!document.getElementById('tc-season-style')) { const link = document.createElement('link'); link.id = 'tc-season-style'; link.rel = 'stylesheet'; link.href = 'https://topazcandy.com/assets/topaz/seasonal.css?v=1'; document.head.appendChild(link); }
    if (!document.getElementById('tc-season-decor')) {
      const decor = document.createElement('div'); decor.id = 'tc-season-decor'; decor.setAttribute('aria-hidden','true');
      decor.innerHTML = '<svg class="tc-season-bats" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" aria-hidden="true"><path d="M5 27q14-22 27-7l5-5 4 5q13-15 28 7-13-2-15 9-7-9-15-1-8-8-15 1Q20 25 5 27Z" fill="currentColor"/><path d="M65 9q11-12 20-3l3-3 3 4q9-9 22 4-9-1-12 7-5-7-12-2-6-5-11 0-2-8-13-7Z" fill="currentColor"/></svg><span class="tc-season-pumpkin">' + pumpkin + '</span>';
      document.body.appendChild(decor);
    }
    const brand = document.querySelector('.site-header .topaz-brand,.head .topaz-brand');
    if (brand && !brand.querySelector('.tc-season-mark')) { const mark = document.createElement('span'); mark.className = 'tc-season-mark'; mark.setAttribute('aria-hidden','true'); mark.innerHTML = pumpkin; brand.appendChild(mark); }
  }
  window.TopazSeason = Object.freeze({ isActive, ends: END, timeZone: 'America/Chicago' });
  sync();
  window.addEventListener('pageshow',sync); window.addEventListener('focus',sync);
  document.addEventListener('visibilitychange',() => { if (!document.hidden) sync(); });
  // Also expires on a page left open across midnight; this never blocks a visitor.
  setInterval(() => { if (!document.hidden) sync(); }, 60000);
})();
