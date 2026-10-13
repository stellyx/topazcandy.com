export function visibleDesigns(designs, category) {
  return designs.filter(design => category === 'all' || design.category === category);
}
export function nextDesign(designs, category, current, step) {
  const visible = visibleDesigns(designs, category);
  const index = Math.max(0, visible.findIndex(design => design.key === current));
  return visible[(index + step + visible.length) % visible.length]?.key;
}
export function bindPortfolio(root, doc = document) {
  const rail = root.querySelector('[data-portfolio-rail]');
  const status = root.querySelector('[data-portfolio-status]');
  const filters = [...root.querySelectorAll('[data-portfolio-filter]')];
  const previous = root.querySelector('[data-portfolio-previous]');
  const next = root.querySelector('[data-portfolio-next]');
  const designs = [...root.querySelectorAll('[data-portfolio-design]')].map(panel => ({
    key: panel.dataset.portfolioDesign, category: panel.dataset.portfolioCategory,
    name: panel.dataset.portfolioName, panel,
    tab: root.querySelector(`[data-design-tab="${panel.dataset.portfolioDesign}"]`)
  }));
  let category = 'all';
  let current = designs.find(design => !design.panel.hidden)?.key || designs[0]?.key;
  function revealTab(tab) {
    // Scroll the thumbnail rail only, never jump the surrounding page vertically.
    const left = tab.offsetLeft;
    const right = left + tab.offsetWidth;
    if (left < rail.scrollLeft) rail.scrollTo({left, behavior: 'auto'});
    else if (right > rail.scrollLeft + rail.clientWidth) rail.scrollTo({left: right - rail.clientWidth, behavior: 'auto'});
  }
  function render(requested = current, focus = false) {
    const visible = visibleDesigns(designs, category);
    current = visible.some(design => design.key === requested) ? requested : visible[0]?.key;
    for (const design of designs) {
      const selected = design.key === current;
      design.panel.hidden = !selected;
      design.tab.hidden = !visible.includes(design);
      design.tab.tabIndex = selected ? 0 : -1;
      design.tab.setAttribute('aria-selected', String(selected));
      if (!selected) design.panel.querySelectorAll('video').forEach(video => video.pause());
    }
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.portfolioFilter === category)));
    const selected = visible.find(design => design.key === current);
    status.textContent = `${visible.findIndex(design => design.key === current) + 1} of ${visible.length} · ${selected.name}`;
    previous.disabled = next.disabled = visible.length < 2;
    doc.dispatchEvent(new Event('portfoliochange'));
    if (focus) selected.tab.focus({preventScroll: true});
    revealTab(selected.tab);
  }
  filters.forEach(button => button.addEventListener('click', () => { category = button.dataset.portfolioFilter; render(); }));
  designs.forEach(design => {
    design.tab.addEventListener('click', () => render(design.key));
    design.tab.addEventListener('keydown', event => {
      let key;
      if (event.key === 'ArrowRight') key = nextDesign(designs, category, current, 1);
      else if (event.key === 'ArrowLeft') key = nextDesign(designs, category, current, -1);
      else if (event.key === 'Home') key = visibleDesigns(designs, category)[0].key;
      else if (event.key === 'End') key = visibleDesigns(designs, category).at(-1).key;
      if (key) { event.preventDefault(); render(key, true); }
    });
  });
  previous.addEventListener('click', () => render(nextDesign(designs, category, current, -1)));
  next.addEventListener('click', () => render(nextDesign(designs, category, current, 1)));
  render();
  return {get current() {return current;}, get category() {return category;}};
}
if (typeof document !== 'undefined') document.querySelectorAll('[data-portfolio-browser]').forEach(root => bindPortfolio(root));
