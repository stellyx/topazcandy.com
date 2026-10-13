/* Quiet, irregular motion for the three existing non-interactive ink ornaments. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const definitions = [
    ['.ink-ornament > svg', 'draw'],
    ['.chapter-strip .strip-flower > svg.motif', 'rock'],
    ['.collection-footer > span[aria-hidden="true"] > svg.motif', 'pulse']
  ];
  const items = definitions.map(([selector, kind]) => {
    const element = document.querySelector(selector);
    return element && {element, kind, targets: kind === 'draw' ? [...element.querySelectorAll('.ink-line')] : [element], visible: !('IntersectionObserver' in window), readyAt: 0};
  }).filter(Boolean);
  if (!items.length || items.some(item => item.targets.some(target => typeof target.animate !== 'function'))) return;
  const between = (a, b) => a + Math.random() * (b - a);
  const now = () => performance.now();
  const active = new Map();
  let timer = 0, running = false;
  let clock = 0, lastWall = now();
  const time = () => { const wall = now(); if (running) clock += Math.max(0, wall - lastWall); lastWall = wall; return clock; };
  const allowed = () => !reduced.matches && !document.hidden && !root.classList.contains('motion-paused');
  items.forEach(item => { item.readyAt = between(1900, 4200); });
  root.classList.add('doodads-ready');

  function finish(item, group) {
    if (group.closed) return;
    group.closed = true;
    active.delete(item);
    item.readyAt = time() + between(6500, 14000);
  }
  function cancel(item) {
    const group = active.get(item);
    if (!group) return;
    finish(item, group);
    group.animations.forEach(animation => animation.cancel());
  }
  function start(item) {
    const duration = item.kind === 'draw' ? between(1800, 2600) : between(1100, 1900);
    const direction = Math.random() < .5 ? -1 : 1;
    const group = {animations: [], remaining: item.targets.length, closed: false};
    active.set(item, group);
    item.targets.forEach((target, index) => {
      let frames;
      if (item.kind === 'draw') frames = [
        {strokeDashoffset: '0', opacity: 1, offset: 0},
        {strokeDashoffset: '0', opacity: 0, offset: .10},
        {strokeDashoffset: String(direction), opacity: 0, offset: .12},
        {strokeDashoffset: String(direction), opacity: 1, offset: .22},
        {strokeDashoffset: '0', opacity: 1, offset: .88},
        {strokeDashoffset: '0', opacity: 1, offset: 1}
      ];
      else if (item.kind === 'rock') frames = [
        {transform: 'translateY(0) rotate(0deg)'},
        {transform: `translateY(-1.5px) rotate(${direction * between(7, 11)}deg)`, offset: .35},
        {transform: `translateY(.5px) rotate(${-direction * 4}deg)`, offset: .7},
        {transform: 'translateY(0) rotate(0deg)'}
      ];
      else frames = [
        {transform: 'rotate(0deg) scale(1)', opacity: 1},
        {transform: `rotate(${direction * between(5, 9)}deg) scale(1.05)`, opacity: .7, offset: .4},
        {transform: `rotate(${-direction * 2}deg) scale(.98)`, opacity: 1, offset: .75},
        {transform: 'rotate(0deg) scale(1)', opacity: 1}
      ];
      const animation = target.animate(frames, {duration, delay: item.kind === 'draw' ? index * 90 : 0, iterations: 1, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'none'});
      group.animations.push(animation);
      const ended = () => { if (--group.remaining === 0) finish(item, group); };
      animation.addEventListener('finish', ended, {once: true});
      animation.addEventListener('cancel', ended, {once: true});
    });
  }
  function queue(delay = between(1700, 3400)) {
    if (timer || !running || !items.some(item => item.visible)) return;
    timer = window.setTimeout(tick, delay);
  }
  function tick() {
    timer = 0;
    if (!allowed()) { sync(); return; }
    const stamp = time();
    const pool = items.filter(item => item.visible && !active.has(item) && item.readyAt <= stamp);
    if (active.size < 2 && pool.length) start(pool[Math.floor(Math.random() * pool.length)]);
    queue();
  }
  function sync() {
    time();
    running = allowed();
    if (!running) {
      window.clearTimeout(timer); timer = 0;
      if (reduced.matches) [...active.keys()].forEach(cancel);
      else active.forEach(group => group.animations.forEach(animation => animation.pause()));
      return;
    }
    active.forEach(group => group.animations.forEach(animation => { if (animation.playState === 'paused') animation.play(); }));
    queue();
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const item = items.find(candidate => candidate.element === entry.target);
        if (!item) return;
        item.visible = entry.isIntersecting;
        if (!item.visible) cancel(item);
      });
      if (!items.some(item => item.visible)) { window.clearTimeout(timer); timer = 0; }
      sync();
    }, {threshold: .15});
    items.forEach(item => observer.observe(item.element));
  }
  new MutationObserver(sync).observe(root, {attributes: true, attributeFilter: ['class']});
  reduced.addEventListener?.('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => { time(); running = false; window.clearTimeout(timer); timer = 0; active.forEach(group => group.animations.forEach(animation => animation.pause())); });
  window.addEventListener('pageshow', sync);
  sync();
})();
