(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const limited = () => preference.matches || Boolean(connection?.saveData);
  const states = [...document.querySelectorAll('.card')].map(card => {
    const video = card.querySelector('video');
    const button = card.querySelector('.card-motion-toggle');
    const label = card.querySelector('h3').textContent;
    const notice = card.querySelector('.film-status');
    const state = {card, video, button, label, notice, visible: onScreen(card), userPaused: false, requested: false, pending: false, failed: false};
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.controls = true;
    video.loop = true;
    video.autoplay = !limited() && state.visible && !document.hidden;
    // Assign before waiting for observers. Native controls remain usable if play is blocked.
    if (video.getAttribute('src') !== video.dataset.src) video.src = video.dataset.src;
    video.addEventListener('play', () => {
      if (!state.pending) { state.userPaused = false; state.requested = true; }
      render(state);
    });
    video.addEventListener('pause', () => {
      if (!state.pending && wanted(state)) { state.userPaused = true; video.autoplay = false; }
      render(state);
    });
    video.addEventListener('playing', () => { state.failed = false; if (notice) notice.hidden = true; render(state); });
    video.addEventListener('error', () => { state.failed = true; message(state, 'Film could not load. Retry or open the film directly.'); render(state); });
    button.addEventListener('click', () => {
      if (!video.paused || state.pending) { state.userPaused = true; state.requested = false; }
      else { state.userPaused = false; state.requested = true; state.visible = onScreen(card); if (state.failed) { video.src = video.dataset.src; video.load(); state.failed = false; } }
      sync(state);
    });
    return state;
  });
  function onScreen(card) {
    const box = card.getBoundingClientRect();
    const rail = card.parentElement?.getBoundingClientRect();
    return !card.hidden && box.bottom > 0 && box.top < innerHeight && box.right > Math.max(0, rail?.left || 0) && box.left < Math.min(innerWidth, rail?.right || innerWidth);
  }
  function message(state, text) { if (state.notice) { state.notice.hidden = false; state.notice.textContent = text; } }
  function wanted(state) { return state.visible && !state.card.hidden && !document.hidden && !state.userPaused && (!limited() || state.requested); }
  function render(state) {
    const playing = !state.video.paused;
    state.button.textContent = state.failed ? 'Retry film' : playing ? 'Pause film' : 'Play film';
    state.button.setAttribute('aria-pressed', String(playing));
    state.button.setAttribute('aria-label', `${state.failed ? 'Retry' : playing ? 'Pause' : 'Play'} ${state.label} film`);
  }
  function sync(state) {
    state.video.autoplay = wanted(state);
    if (!wanted(state)) { state.video.pause(); render(state); return; }
    if (state.failed || state.pending || !state.video.paused) return;
    if (!state.video.getAttribute('src')) state.video.src = state.video.dataset.src;
    state.pending = true;
    Promise.resolve(state.video.play()).catch(() => { state.userPaused = true; message(state, 'Automatic playback was blocked. Press Play film, use the video controls, or open the film directly.'); }).finally(() => {
      state.pending = false;
      // A filter, scroll, preference or tab change may happen while play is pending.
      if (!wanted(state)) state.video.pause();
      render(state);
    });
  }
  const syncAll = () => states.forEach(sync);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      const state = states.find(item => item.card === entry.target);
      state.visible = entry.isIntersecting;
      sync(state);
    }), {threshold: 0});
    states.forEach(state => observer.observe(state.card));
  } else {
    states.forEach(state => { state.visible = onScreen(state.card); });
  }
  const refreshGeometry = () => { states.forEach(state => state.visible = onScreen(state.card)); syncAll(); };
  document.querySelector('.work-rail')?.addEventListener('scroll', refreshGeometry, {passive: true});
  window.addEventListener('scroll', refreshGeometry, {passive: true});
  window.addEventListener('resize', refreshGeometry);
  const hero = document.querySelector('.hero');
  const heroButton = document.querySelector('.hero-motion-toggle');
  let heroPaused = false, heroVisible = true;
  function syncHero() {
    const paused = heroPaused || limited() || document.hidden || !heroVisible;
    hero.classList.toggle('motion-paused', paused);
    heroButton.setAttribute('aria-pressed', String(!paused));
    heroButton.textContent = limited() ? 'Motion reduced' : heroPaused ? 'Play hero motion' : 'Pause hero motion';
    heroButton.disabled = limited();
  }
  heroButton.addEventListener('click', () => { heroPaused = !heroPaused; syncHero(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { heroVisible = entries[0].isIntersecting; syncHero(); }).observe(hero);
  document.addEventListener('visibilitychange', () => { syncAll(); syncHero(); });
  document.addEventListener('portfoliochange', syncAll);
  function preferencesChanged() { states.forEach(state => state.requested = false); syncAll(); syncHero(); }
  preference.addEventListener('change', preferencesChanged);
  connection?.addEventListener?.('change', preferencesChanged);
  syncHero(); syncAll();
})();
