(() => {
  const toggle = document.querySelector('.motion-toggle');
  const hero = document.querySelector('.hero');
  const interlude = document.querySelector('.interlude');
  if (!toggle || !hero) return;

  let userPaused = false;
  const sync = () => {
    const paused = userPaused || document.hidden;
    document.documentElement.classList.toggle('motion-paused', paused);
    toggle.setAttribute('aria-pressed', String(userPaused));
    toggle.textContent = userPaused ? 'Play motion' : 'Pause motion';
  };

  document.documentElement.classList.add('motion-ready');
  toggle.addEventListener('click', () => { userPaused = !userPaused; sync(); });
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) {
    const watch = new IntersectionObserver(entries => {
      for (const entry of entries) {
        entry.target.classList.toggle('motion-idle', !entry.isIntersecting);
      }
    }, { threshold: 0.01 });
    watch.observe(hero);
    if (interlude) watch.observe(interlude);
  }
  sync();
})();
