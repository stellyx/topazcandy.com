'use strict';
(() => {
  // One seasonal window, evaluated in the site's existing Chicago timezone.
  const START = '2026-10-12';
  const END = '2026-11-01';
  const STYLE_URL = new URL('seasonal.css?v=2', document.currentScript.src).href;
  const pumpkin = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 44" aria-hidden="true"><path d="M21 12c-3-5-1-8 4-10" fill="none" stroke="#5c7345" stroke-width="3" stroke-linecap="round"/><path d="M20 12C3 6-4 36 11 40c4 1 6-1 9 0 4 1 8 1 12-2 11-8 7-31-6-27Z" fill="#c08a43"/><path d="M18 12C8 20 10 35 18 40m5-28c8 9 8 22 0 28" fill="none" stroke="#986331" stroke-width="1.2" opacity=".65"/><path d="m10 25 5-3 1 5m8-4 5 3-6 1m-9 6q6 4 12-1" fill="none" stroke="#775332" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  let paused = false;
  try { paused = sessionStorage.getItem('tc-season-paused') === 'true'; } catch { /* Storage is optional. */ }
  let running = false;
  let flights = 0;
  const timers = new Set();
  const animations = new Set();
  const bat = '<svg viewBox="0 0 80 42" focusable="false" aria-hidden="true"><g class="tc-bat-wings"><path d="M38 20C29 9 15 9 2 3c3 10 2 16 0 24 8-5 14-6 18 2 6-5 11-3 17 8l3-13Z"/><path d="M42 20C51 9 65 9 78 3c-3 10-2 16 0 24-8-5-14-6-18 2-6-5-11-3-17 8l-3-13Z"/></g><path d="m35 17 1-10 5 5 5-5-1 12c5 8 1 15-5 21-6-6-10-14-5-23Z"/></svg>';
  function dayInChicago(now) {
    const values = Object.fromEntries(new Intl.DateTimeFormat('en-US', {timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(part => [part.type,part.value]));
    return values.year + '-' + values.month + '-' + values.day;
  }
  function isActive(now = new Date()) { try { const day = dayInChicago(now); return day >= START && day < END; } catch { return false; } }
  const random = (min, max) => min + Math.random() * (max - min);
  function later(fn, delay) {
    const timer = setTimeout(() => { timers.delete(timer); fn(); }, delay);
    timers.add(timer);
  }
  // Sample a smooth Catmull-Rom route. Each new flight gets its own route,
  // spacing and rest, rather than repeating an obvious screensaver pattern.
  function frames(points) {
    const result = [];
    for (let segment = 0; segment < points.length - 1; segment++) {
      const p0 = points[Math.max(0, segment - 1)], p1 = points[segment];
      const p2 = points[segment + 1], p3 = points[Math.min(points.length - 1, segment + 2)];
      for (let step = 0; step <= 18; step++) {
        const t = step / 18, t2 = t*t, t3 = t2*t;
        const value = axis => .5*((2*p1[axis])+(-p0[axis]+p2[axis])*t+(2*p0[axis]-5*p1[axis]+4*p2[axis]-p3[axis])*t2+(-p0[axis]+3*p1[axis]-3*p2[axis]+p3[axis])*t3);
        const bank = Math.sin((segment + t) * Math.PI) * 12;
        result.push({transform:`translate3d(${value(0)}px,${value(1)}px,0) rotate(${bank}deg)`});
      }
    }
    return result;
  }
  function fly(pair) {
    if (!running || !pair.isConnected) return;
    const w = window.innerWidth, h = window.innerHeight;
    const moon = document.querySelector('.tc-season-moon').getBoundingClientRect();
    const leftToRight = Math.random() > .5;
    const start = leftToRight ? -130 : w + 130, end = leftToRight ? w + 130 : -130;
    const moonPass = flights++ % 3 === 0;
    const center = moonPass ? [moon.left + moon.width/2 - 30, moon.top + moon.height/2 - 18] : [random(.25,.75)*w,random(.25,.75)*h];
    const points = [[start,random(.18,.8)*h], [w*(leftToRight ? .25 : .75),random(.15,.8)*h], center, [w*(leftToRight ? .72 : .28),random(.2,.85)*h], [end,random(.15,.8)*h]];
    pair.hidden = false;
    const animation = pair.animate(frames(points), {duration:random(20000,28000),easing:'linear',fill:'both'});
    animations.add(animation);
    animation.onfinish = () => {
      animations.delete(animation); animation.cancel(); pair.hidden = true;
      if (running) later(() => fly(pair), random(14000,25000));
    };
  }
  function stop() {
    running = false;
    timers.forEach(clearTimeout); timers.clear();
    animations.forEach(animation => { animation.onfinish = null; animation.cancel(); }); animations.clear();
    document.querySelectorAll('.tc-season-pair').forEach(pair => { pair.hidden = true; });
  }
  function reconcile() {
    const enabled = isActive() && !paused && !reduced.matches && !connection?.saveData && !document.hidden;
    const button = document.getElementById('tc-season-toggle');
    if (button) {
      button.hidden = reduced.matches || Boolean(connection?.saveData);
      button.textContent = paused ? 'Play bats' : 'Pause bats';
      button.setAttribute('aria-pressed', String(paused));
    }
    if (!enabled) { stop(); return; }
    if (running) return;
    running = true;
    document.querySelectorAll('.tc-season-pair').forEach((pair, index) => later(() => fly(pair), index ? 13000 : 1200));
  }
  function sync() {
    const active = isActive();
    document.documentElement.classList.toggle('tc-halloween', active);
    if (!active) {
      stop(); document.getElementById('tc-season-decor')?.remove();
      document.querySelectorAll('.tc-season-mark,.tc-season-note,#tc-season-toggle').forEach(node => node.remove());
      document.getElementById('tc-season-style')?.remove(); return;
    }
    if (!document.getElementById('tc-season-style')) {
      const link = document.createElement('link'); link.id = 'tc-season-style'; link.rel = 'stylesheet';
      link.href = STYLE_URL; document.head.appendChild(link);
    }
    if (!document.getElementById('tc-season-decor')) {
      const decor = document.createElement('div'); decor.id = 'tc-season-decor'; decor.setAttribute('aria-hidden','true');
      decor.innerHTML = '<span class="tc-season-moon"></span>' + [0,1].map(() => '<div class="tc-season-pair" hidden><span class="tc-season-bat">' + bat + '</span><span class="tc-season-bat tc-season-companion">' + bat + '</span></div>').join('');
      document.body.appendChild(decor);
      const button = document.createElement('button'); button.id = 'tc-season-toggle'; button.type = 'button';
      button.addEventListener('click', () => {
        paused = !paused;
        try { sessionStorage.setItem('tc-season-paused', String(paused)); } catch { /* Storage is optional. */ }
        reconcile();
      });
      (document.querySelector('.site-footer,footer,.foot') || document.body).appendChild(button);
    }
    const brand = document.querySelector('.site-header .topaz-brand,.head .topaz-brand');
    if (brand && !brand.querySelector('.tc-season-mark')) {
      const mark = document.createElement('span'); mark.className = 'tc-season-mark'; mark.setAttribute('aria-hidden','true'); mark.innerHTML = pumpkin; brand.appendChild(mark);
    }
    reconcile();
  }
  window.TopazSeason = Object.freeze({ isActive, ends:END, timeZone:'America/Chicago' });
  sync();
  window.addEventListener('pageshow',sync); window.addEventListener('focus',sync);
  window.addEventListener('pagehide',stop);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : sync());
  reduced.addEventListener('change',reconcile);
  connection?.addEventListener?.('change',reconcile);
  window.addEventListener('resize', () => { stop(); reconcile(); });
  setInterval(() => { if (!document.hidden) sync(); }, 60000);
})();
