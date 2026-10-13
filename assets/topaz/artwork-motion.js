(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const lowMotion = () => reduced.matches || Boolean(connection?.saveData);
  const states = [...document.querySelectorAll('[data-artwork-preview]')].map(card => {
    const button = card.querySelector('.artwork-toggle');
    const state = {visible: !('IntersectionObserver' in window), userPaused: false, userRequested: false, ready: card.dataset.artworkPreview !== 'tree', loading: false, failed: false};
    const wantsMotion = () => state.visible && !document.hidden && !state.userPaused && (!lowMotion() || state.userRequested);
    function sync() {
      const playing = wantsMotion() && state.ready;
      card.dataset.artworkPaused = String(!playing);
      button.hidden = false;
      button.dataset.playing = String(playing);
      button.setAttribute('aria-pressed', String(playing));
      button.setAttribute('aria-label', `${state.failed ? 'Retry' : wantsMotion() ? 'Pause' : 'Play'} ${card.dataset.artworkName} artwork preview`);
    }
    async function prepareTree() {
      if (state.ready || state.loading || state.failed) return;
      state.loading = true;
      try {
        // Reuse the existing same-origin artwork; no frame render or video download.
        const response = await fetch('/assets/topaz/wonderbranch-preview.svg');
        if (!response.ok) throw new Error('Artwork unavailable');
        const doc = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
        const svg = doc.documentElement;
        if (svg.localName !== 'svg' || !svg.querySelector('#front-leaves') || doc.querySelector('parsererror')) throw new Error('Invalid artwork');
        const poster = card.querySelector('.work-image img');
        svg.id = poster.id;
        svg.classList.add('artwork-tree');
        svg.setAttribute('role', 'img');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        svg.setAttribute('aria-label', poster.alt);
        svg.removeAttribute('aria-labelledby');
        poster.replaceWith(document.importNode(svg, true));
        state.ready = true;
      } catch {
        state.failed = true; // Keep the original image and offer an explicit retry.
      } finally {
        state.loading = false;
        sync();
      }
    }
    function reconcile() {
      if (wantsMotion()) prepareTree();
      sync();
    }
    button.addEventListener('click', () => {
      if (wantsMotion() && !state.failed) state.userPaused = true;
      else { state.userPaused = false; state.userRequested = true; state.failed = false; }
      reconcile();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => { state.visible = entries[0].isIntersecting; reconcile(); }, {threshold: .05}).observe(card);
    }
    reconcile();
    return {state, reconcile};
  });
  const reconcileAll = () => states.forEach(({reconcile}) => reconcile());
  function preferencesChanged() {
    states.forEach(({state}) => { state.userRequested = false; });
    reconcileAll();
  }
  document.addEventListener('visibilitychange', reconcileAll);
  reduced.addEventListener('change', preferencesChanged);
  connection?.addEventListener?.('change', preferencesChanged);
})();
