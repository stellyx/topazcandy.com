// Progressive enhancement: the still image and all content work without motion.
export function initSalonMotion({doc = document, win = window, connection = navigator.connection} = {}) {
  const root = doc.querySelector('[data-salon-motion]');
  const video = root?.querySelector('video');
  const button = root?.querySelector('.motion-control');
  if (!video || !button || typeof video.play !== 'function') return;
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
  const state = {userPaused:false, userRequested:false, visible:!('IntersectionObserver' in win), failed:false, starting:false};
  const lowMotion = () => reduced.matches || Boolean(connection?.saveData);
  const permitted = () => !state.failed && !state.userPaused && state.visible && !doc.hidden && (!lowMotion() || state.userRequested);
  video.muted = video.defaultMuted = true;
  button.hidden = false;

  function sync() {
    const playing = permitted() && !video.paused && !video.ended;
    root.dataset.motionPaused = String(!playing);
    button.dataset.playing = String(playing);
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} illustrative hair film and accents`);
    button.hidden = state.failed;
  }
  function reconcile() {
    if (!permitted()) { video.pause(); sync(); return; }
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    if (!state.starting && video.paused) {
      state.starting = true;
      Promise.resolve().then(() => video.play()).then(() => {
        // A preference, visibility or pause change may arrive while play is pending.
        if (!permitted()) video.pause();
        sync();
      }).catch(sync).finally(() => { state.starting = false; });
    }
    sync();
  }
  button.addEventListener('click', () => {
    if (!video.paused && !video.ended) {
      state.userPaused = true;
      video.pause();
    } else {
      state.userPaused = false;
      state.userRequested = true;
      reconcile();
    }
    sync();
  });
  video.addEventListener('playing', () => {
    if (!permitted()) { video.pause(); sync(); return; }
    root.dataset.filmReady = 'true';
    sync();
  });
  video.addEventListener('pause', sync);
  video.addEventListener('ended', sync);
  video.addEventListener('error', () => {
    state.failed = true;
    root.dataset.filmReady = 'false';
    video.pause();
    sync();
  });
  function preferencesChanged() {
    state.userRequested = false;
    if (lowMotion()) {
      video.pause();
      video.removeAttribute('src');
      video.load();
      root.dataset.filmReady = 'false';
    }
    reconcile();
  }
  reduced.addEventListener('change', preferencesChanged);
  connection?.addEventListener?.('change', preferencesChanged);
  doc.addEventListener('visibilitychange', reconcile);
  if ('IntersectionObserver' in win) {
    new win.IntersectionObserver(entries => {
      state.visible = entries[0].isIntersecting;
      reconcile();
    }, {threshold:0.05}).observe(root);
  }
  reconcile();
  return {reconcile, state};
}

export function initSalonReveals() {
  if (!('IntersectionObserver' in window)) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    if (!reduced.matches && !navigator.connection?.saveData) entry.target.classList.add('revealed');
    observer.unobserve(entry.target);
  }), {threshold:0.12});
  document.querySelectorAll('.offering,.step,.review,.template-proof>div,.care-art,.section-top').forEach(el => observer.observe(el));
}
