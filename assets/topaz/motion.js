(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const lowMotion = () => reduced.matches || Boolean(connection?.saveData);
  const gem = document.querySelector('[data-gem-motion]');
  const gemButton = gem?.querySelector('.hero-animation-toggle');
  let gemPaused = false;
  let gemVisible = true;

  function syncGem() {
    if (!gem || !gemButton) return;
    const paused = gemPaused || lowMotion() || document.hidden || !gemVisible;
    gem.dataset.motionPaused = String(paused);
    gemButton.hidden = lowMotion();
    gemButton.dataset.playing = String(!paused);
    gemButton.setAttribute('aria-pressed', String(!paused));
    gemButton.setAttribute('aria-label', paused ? 'Play gem and service-star animation' : 'Pause gem and service-star animation');
  }
  gemButton?.addEventListener('click', () => { gemPaused = !gemPaused; syncGem(); });
  if (gem && 'IntersectionObserver' in window) {
    new IntersectionObserver(entries => { gemVisible = entries[0].isIntersecting; syncGem(); }, {threshold:0.05}).observe(gem);
  }

  const previews = [...document.querySelectorAll('[data-motion-preview]')].map(card => {
    const video = card.querySelector('video');
    const button = card.querySelector('.preview-toggle');
    if (!video || !button) return null;
    const state = {card, video, button, visible:!('IntersectionObserver' in window), userPaused:false, userRequested:false, failed:false, recoveryAttempts:0};
    video.muted = true;
    video.defaultMuted = true;
    button.hidden = false;

    function sync() {
      const playing = !video.paused && !video.ended;
      button.dataset.playing = String(playing);
      button.setAttribute('aria-pressed', String(playing));
      button.setAttribute('aria-label', `${state.failed ? 'Retry' : playing ? 'Pause' : 'Play'} ${card.dataset.previewName} template preview`);
      // A transient mobile network failure must not remove the only retry control.
      button.hidden = false;
    }
    function reloadPreview() {
      state.failed = false;
      video.load();
    }
    function reconcile() {
      if (card.hidden || state.userPaused || !state.visible || document.hidden || (lowMotion() && !state.userRequested)) {
        video.pause();
        sync();
        return;
      }
      // Retry a transient interrupted/network load once when the card is revisited
      // or connectivity returns. Decode/source failures require the explicit button.
      if (state.failed) {
        if (![1, 2].includes(video.error?.code) || state.recoveryAttempts >= 1) { sync(); return; }
        state.recoveryAttempts += 1;
        reloadPreview();
      }
      if (!video.getAttribute('src')) video.src = video.dataset.src;
      video.play().then(() => {
        // A pending play request may finish after the visitor scrolls away.
        if (card.hidden || state.userPaused || !state.visible || document.hidden || (lowMotion() && !state.userRequested)) video.pause();
        sync();
      }).catch(sync);
    }
    button.addEventListener('click', () => {
      if (!video.paused && !video.ended) {
        state.userPaused = true;
        video.pause();
      } else {
        state.userPaused = false;
        state.userRequested = true;
        if (state.failed) { state.recoveryAttempts = 0; reloadPreview(); }
        reconcile();
      }
      sync();
    });
    video.addEventListener('playing', sync);
    video.addEventListener('pause', sync);
    video.addEventListener('ended', sync);
    video.addEventListener('error', () => { state.failed = true; sync(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => { state.visible = entries[0].isIntersecting; reconcile(); }, {threshold:0.05}).observe(card);
    }
    state.reconcile = reconcile;
    state.sync = sync;
    reconcile();
    return state;
  }).filter(Boolean);

  function reconcileAll() { syncGem(); previews.forEach(state => state.reconcile()); }
  function preferencesChanged() {
    previews.forEach(state => { state.userRequested = false; });
    reconcileAll();
  }
  reduced.addEventListener('change', preferencesChanged);
  connection?.addEventListener?.('change', preferencesChanged);
  document.addEventListener('visibilitychange', reconcileAll);
  window.addEventListener('online', reconcileAll);
  document.addEventListener('portfoliochange', reconcileAll);
  reconcileAll();
})();
