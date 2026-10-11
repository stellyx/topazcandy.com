const montage = document.getElementById('cart-film');
const videos = [...montage.querySelectorAll('video[data-src]')];
const button = montage.querySelector('.cart-film-control');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
let enabled = !reduced.matches && !navigator.connection?.saveData;
let visible = false;
let token = 0;
button.hidden = false;
function status(playing) {
  button.dataset.playing = String(playing);
  button.setAttribute('aria-pressed', String(playing));
  button.setAttribute('aria-label', playing ? 'Pause design films' : 'Play design films');
}
async function sync() {
  const current = ++token;
  const play = enabled && visible && !document.hidden;
  if (!play) { videos.forEach(video => video.pause()); status(false); return; }
  const results = await Promise.all(videos.map(async video => {
    if (video.dataset.failed === 'true') return false;
    if (!video.getAttribute('src')) { video.src = video.dataset.src; video.load(); }
    try { await video.play(); return true; } catch { return false; }
  }));
  if (current !== token || !enabled || !visible || document.hidden) {
    if (!enabled || !visible || document.hidden) videos.forEach(video => video.pause());
    return;
  }
  status(results.some(Boolean));
}
videos.forEach(video => {
  video.addEventListener('playing', () => { video.dataset.loaded = 'true'; });
  video.addEventListener('error', () => { video.dataset.failed = 'true'; video.dataset.loaded = 'false'; });
});
button.addEventListener('click', () => { enabled = !enabled; sync(); });
document.addEventListener('visibilitychange', sync);
reduced.addEventListener('change', () => { if (reduced.matches) enabled = false; sync(); });
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: 0.05 }).observe(montage);
} else { visible = true; sync(); }
