// Keep native hash/history behavior; only marked content receives centering.
export function anchorInset(viewportHeight, targetHeight, headerHeight = 0) {
  return headerHeight + Math.max(16, (viewportHeight - headerHeight - targetHeight) / 2);
}

export function bindCenteredAnchors(doc = document, win = window) {
  const targets = [...doc.querySelectorAll('[data-center-anchor]')];
  if (!targets.length) return;
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
  function stickyHeight() {
    let height = 0;
    for (const header of doc.querySelectorAll('[data-sticky-header], .course-nav-wrap')) {
      const style = win.getComputedStyle(header);
      if (style.position === 'sticky' || style.position === 'fixed') {
        height = Math.max(height, header.getBoundingClientRect().height);
      }
    }
    return height;
  }
  function prepare() {
    const viewport = win.visualViewport?.height || win.innerHeight;
    const header = stickyHeight();
    for (const target of targets) {
      target.style.scrollMarginTop = `${anchorInset(viewport, target.getBoundingClientRect().height, header)}px`;
    }
  }
  function targetFor(hash) {
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return null; }
    const target = doc.getElementById(id);
    return target && targets.includes(target) ? target : null;
  }
  function center(target, deliberate = false) {
    prepare();
    target.scrollIntoView({block:'start', behavior:deliberate && !reduced.matches ? 'smooth' : 'instant'});
    target.focus({preventScroll:true});
  }
  prepare();
  win.addEventListener('resize', prepare);
  win.visualViewport?.addEventListener('resize', prepare);
  if (win.ResizeObserver) {
    const observer = new win.ResizeObserver(prepare);
    targets.forEach(target => observer.observe(target));
  }
  // Repeated same-hash clicks still center. We do not replace native navigation,
  // create history entries ourselves, or override Back/Forward scroll restoration.
  doc.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, win.location.href);
    if (url.origin !== win.location.origin || url.pathname !== win.location.pathname || url.search !== win.location.search) return;
    const target = targetFor(url.hash);
    if (target) win.requestAnimationFrame(() => center(target, true));
  });
  async function initial() {
    if (win.performance.getEntriesByType('navigation')[0]?.type === 'back_forward') return;
    await doc.fonts?.ready;
    const target = targetFor(win.location.hash);
    if (target) win.requestAnimationFrame(() => center(target));
  }
  if (doc.readyState === 'complete') initial();
  else win.addEventListener('load', initial, {once:true});
}

if (typeof document !== 'undefined') bindCenteredAnchors();
