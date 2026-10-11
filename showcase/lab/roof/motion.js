(() => {
  const video = document.querySelector('.roof__video');
  const button = document.querySelector('.roof-video-toggle');
  if (!video || !button || typeof video.play !== 'function') return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  let userPaused = false;
  let userRequested = false;
  let visible = true;

  video.muted = true;
  video.defaultMuted = true;
  button.hidden = false;

  function sync() {
    const playing = !video.paused && !video.ended;
    button.dataset.playing = String(playing);
    button.setAttribute('aria-label', playing ? 'Pause illustrative roofing film' : 'Play illustrative roofing film');
    button.setAttribute('aria-pressed', String(playing));
  }

  function allowed() {
    return userRequested || (!reduced.matches && !connection?.saveData);
  }

  function reconcile() {
    if (userPaused || !visible || document.hidden || !allowed()) {
      video.pause();
      sync();
      return;
    }
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    video.play().catch(sync);
  }

  button.addEventListener('click', () => {
    if (!video.paused && !video.ended) {
      userPaused = true;
      video.pause();
    } else {
      userPaused = false;
      userRequested = true;
      video.classList.add('requested');
      reconcile();
    }
    sync();
  });
  video.addEventListener('playing', () => { video.classList.add('ready'); sync(); });
  video.addEventListener('pause', sync);
  video.addEventListener('error', () => { video.classList.remove('ready'); sync(); });
  document.addEventListener('visibilitychange', reconcile);

  function preferenceChanged() {
    userRequested = false;
    video.classList.remove('requested');
    if (!allowed()) {
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.classList.remove('ready');
    }
    reconcile();
  }
  reduced.addEventListener('change', preferenceChanged);
  connection?.addEventListener?.('change', preferenceChanged);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      reconcile();
    }, {threshold: 0.05}).observe(video);
  }
  reconcile();
})();
