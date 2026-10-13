/* Native contour interpolation. No network calls, dependencies or generated video. */
(function (global) {
  'use strict';
  const POINTS = 96;
  const clamp = (value, a = 0, b = 1) => Math.max(a, Math.min(b, value));
  const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const baseForms = ['rose', 'snake', 'eye', 'dagger', 'heart', 'crescent', 'skull'];

  function seededRandom(seed) {
    return () => {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function makeCycle(random, first = false, previousInsertion = -1) {
    const forms = baseForms.slice();
    for (let i = forms.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [forms[i], forms[j]] = [forms[j], forms[i]];
    }
    // The butterfly always develops from a caterpillar, but its place varies.
    let insertion = 1 + Math.floor(random() * 7);
    if (insertion === previousInsertion) insertion = insertion % 7 + 1;
    forms.splice(insertion, 0, 'caterpillar', 'butterfly');
    const stages = [{kind: 'hold', shape: 'imagination', duration: first ? 4000 : 8000}];
    let from = 'imagination';
    for (const shape of forms) {
      stages.push({kind: 'morph', from, shape, duration: shape === 'butterfly' ? 1850 : 1450});
      stages.push({kind: 'hold', shape, duration: shape === 'caterpillar' ? 2400 : shape === 'butterfly' ? 1100 : 1800});
      if (shape === 'butterfly') {
        stages.push({kind: 'flight', shape, duration: 3800});
        stages.push({kind: 'hold', shape: 'imagination', duration: 7200});
        from = 'imagination';
      } else from = shape;
    }
    if (from !== 'imagination') stages.push({kind: 'morph', from, shape: 'imagination', duration: 1650});
    return {forms, insertion, stages};
  }

  function expand(shape) {
    return {
      ...shape,
      black: shape.black.map(points => points.length === 1 ? Array.from({length: POINTS}, () => points[0].slice()) : points),
      cut: shape.cut.map(points => points.length === 1 ? Array.from({length: POINTS}, () => points[0].slice()) : points)
    };
  }

  function align(a, b) {
    let best = 0, minimum = Infinity;
    // Contours have matching winding. Align seams to limit unnecessary twists.
    for (let offset = 0; offset < POINTS; offset++) {
      let score = 0;
      for (let j = 0; j < POINTS; j += 4) {
        const q = b[(j + offset) % POINTS];
        score += (a[j][0] - q[0]) ** 2 + (a[j][1] - q[1]) ** 2;
      }
      if (score < minimum) { minimum = score; best = offset; }
    }
    return b.map((_, i) => b[(i + best) % POINTS]);
  }

  function prepareMorph(from, to) {
    return {
      from, to,
      black: from.black.map((p, i) => align(p, to.black[i])),
      cut: from.cut.map((p, i) => align(p, to.cut[i]))
    };
  }

  function sampleMorph(pair, progress) {
    const t = ease(progress), twist = Math.sin(Math.PI * t) ** 2;
    const interpolate = (contours, targets, kind) => contours.map((p, i) => p.map((a, j) => {
      const b = targets[i][j];
      // Each actual outline travels, bends and stretches into the next outline.
      // There is no cross-fading of icons and no particle-only stand-in.
      const phase = j / POINTS * Math.PI * 4 + i * 1.73;
      const curl = kind === 'cut' ? 1.8 : 3.5;
      return [a[0] + (b[0] - a[0]) * t + Math.sin(phase) * curl * twist,
        a[1] + (b[1] - a[1]) * t + Math.cos(phase * .77) * curl * twist];
    }));
    return {black: interpolate(pair.from.black, pair.black, 'black'), cut: interpolate(pair.from.cut, pair.cut, 'cut'), tags: pair.to.tags};
  }

  function pose(shape, name, time) {
    if (name !== 'butterfly' && name !== 'caterpillar') return shape;
    // Wing coordinates squeeze around a common hinge; the creature really flaps.
    const wing = .22 + .78 * (.5 + .5 * Math.cos(time * Math.PI * 2 / 670));
    function deform(p, tag, isCut) {
      const mean = p.reduce((sum, v) => sum + v[0], 0) / p.length;
      const butterflyWing = tag === 'wingL' || tag === 'wingR' || isCut && Math.abs(mean - 120) > 5;
      if (name === 'butterfly' && butterflyWing) return p.map(([x, y]) => [120 + (x - 120) * wing, y + (1 - wing) * Math.abs(x - 120) * -.13]);
      if (name === 'caterpillar') {
        const segment = tag?.startsWith('segment:') ? Number(tag.split(':')[1]) : Math.round((mean - 57) / 16);
        const bounce = Math.sin(time / 200 - segment * .7) * 1.55;
        return p.map(([x, y]) => [x + Math.sin(time / 1000) * 4, y + bounce]);
      }
      return p;
    }
    return {black: shape.black.map((p, i) => deform(p, shape.tags[i], false)), cut: shape.cut.map(p => deform(p, '', true)), tags: shape.tags};
  }

  function flightPoint(t, origin, width, height) {
    const u = clamp(t), v = 1 - u;
    const p1 = {x: origin.x + 90, y: origin.y - 120};
    const p2 = {x: Math.max(origin.x + 180, width * .79), y: Math.max(35, origin.y * .16)};
    const p3 = {x: width + 180, y: -150};
    return {
      x: v ** 3 * origin.x + 3 * v * v * u * p1.x + 3 * v * u * u * p2.x + u ** 3 * p3.x,
      y: v ** 3 * origin.y + 3 * v * v * u * p1.y + 3 * v * u * u * p2.y + u ** 3 * p3.y + Math.sin(u * Math.PI * 5) * 13 * Math.sin(u * Math.PI)
    };
  }

  function createClock() {
    let elapsed = 0, last = null;
    return {
      step(now) { if (last !== null) elapsed += Math.max(0, now - last); last = now; return elapsed; },
      pause() { last = null; },
      reset() { elapsed = 0; last = null; },
      get elapsed() { return elapsed; }
    };
  }

  // Pure functions are exposed for deterministic, browser-free verification.
  const core = {baseForms, seededRandom, makeCycle, expand, prepareMorph, sampleMorph, pose, flightPoint, createClock};
  global.InkTaglineCore = core;
  if (!global.document) return;
  const element = document.querySelector('[data-ink-metamorph]');
  const source = global.InkMorphShapes;
  if (!element || !source || element.dataset.inkReady === 'true') return;
  const canvas = element.querySelector('canvas');
  const context = canvas?.getContext('2d');
  if (!context) return;
  const art = document.createElement('canvas'); art.width = 960; art.height = 480;
  const brush = art.getContext('2d');
  if (!brush) return;
  const flight = document.createElement('canvas');
  flight.className = 'ink-flight-layer'; flight.setAttribute('aria-hidden', 'true'); flight.hidden = true;
  const flightContext = flight.getContext('2d');
  if (!flightContext) return;
  document.body.appendChild(flight);
  element.dataset.inkReady = 'true';

  const data = Object.fromEntries(Object.entries(source).map(([key, value]) => [key, expand(value)]));
  const reduced = global.matchMedia('(prefers-reduced-motion: reduce)');
  const seed = global.crypto?.getRandomValues ? global.crypto.getRandomValues(new Uint32Array(1))[0] : Date.now();
  const random = seededRandom(seed), clock = createClock();
  let cycle = makeCycle(random, true), cycleStart = 0, raf = 0, inView = true;
  let previousStage = null, pairing = null, stageStart = 0, lastPaint = '', lastFrame = null;
  let viewport = {width: 0, height: 0, dpr: 1};

  function resize() {
    const box = element.getBoundingClientRect();
    const dpr = Math.min(global.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(box.width * dpr));
    canvas.height = Math.max(1, Math.round(box.height * dpr));
    viewport = {width: document.documentElement.clientWidth || global.innerWidth, height: global.innerHeight, dpr};
    flight.width = Math.round(viewport.width * dpr); flight.height = Math.round(viewport.height * dpr);
    lastPaint = '';
    if (lastFrame && !reduced.matches && inView && !document.hidden) render(lastFrame.stage, lastFrame.local);
  }

  function trace(contours, rough = false) {
    brush.beginPath();
    contours.forEach((p, i) => {
      p.forEach(([x, y], j) => {
        const jitter = rough ? .2 * Math.sin(j * 1.91 + i * 2.1) : 0;
        if (!j) brush.moveTo(x + jitter, y - jitter);
        else brush.lineTo(x + jitter, y - jitter);
      });
      brush.closePath();
    });
  }

  function drawArtwork(frame) {
    brush.setTransform(4, 0, 0, 4, 0, 0);
    brush.clearRect(0, 0, 240, 120);
    brush.globalCompositeOperation = 'source-over'; brush.globalAlpha = 1;
    brush.fillStyle = '#342d31'; trace(frame.black); brush.fill();
    // Restrained irregular edge, then short charcoal grain inside the silhouette.
    brush.lineWidth = .65; brush.strokeStyle = '#54464b'; brush.globalAlpha = .55; trace(frame.black, true); brush.stroke();
    brush.globalCompositeOperation = 'source-atop'; brush.globalAlpha = .16; brush.strokeStyle = '#c5b3aa'; brush.lineWidth = .42;
    brush.beginPath();
    for (let i = 0; i < 70; i++) {
      const x = 9 + i * 47.83 % 220, y = 9 + i * 31.17 % 103;
      brush.moveTo(x, y); brush.lineTo(x + 1.4 + i % 4, y - .8 - i % 2);
    }
    brush.stroke(); brush.globalAlpha = 1;
    brush.globalCompositeOperation = 'destination-out'; trace(frame.cut); brush.fill();
    brush.globalCompositeOperation = 'source-over';
  }

  function paintLocal(frame, alpha = 1) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!alpha) return;
    drawArtwork(frame); context.globalAlpha = alpha;
    context.drawImage(art, 0, 0, canvas.width, canvas.height); context.globalAlpha = 1;
  }

  function render(stage, local) {
    lastFrame = {stage, local};
    const progress = clamp(local / stage.duration);
    if (stage.kind === 'flight') {
      flight.hidden = false;
      // The script gently returns while its butterfly continues toward the edge.
      paintLocal(data.imagination, ease((local - 700) / 1000));
      drawArtwork(pose(data.butterfly, 'butterfly', local + 1100));
      const box = element.getBoundingClientRect();
      const origin = {x: box.left + box.width / 2, y: box.top + box.height / 2};
      const p = flightPoint(progress, origin, viewport.width, viewport.height);
      const width = box.width * (1 - .15 * progress);
      const angle = (-15 + Math.sin(progress * Math.PI * 3) * 12) * Math.PI / 180;
      flightContext.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
      flightContext.clearRect(0, 0, viewport.width, viewport.height);
      flightContext.save(); flightContext.translate(p.x, p.y); flightContext.rotate(angle);
      flightContext.shadowColor = '#6d5a594d'; flightContext.shadowBlur = 3; flightContext.shadowOffsetX = 2; flightContext.shadowOffsetY = 3;
      flightContext.drawImage(art, -width / 2, -width / 4, width, width / 2); flightContext.restore();
      return;
    }
    flight.hidden = true;
    if (stage.kind === 'morph') {
      if (stage !== previousStage) pairing = prepareMorph(data[stage.from], data[stage.shape]);
      paintLocal(sampleMorph(pairing, progress));
    } else {
      const moving = stage.shape === 'caterpillar' || stage.shape === 'butterfly';
      const key = `${stageStart}:${stage.shape}`;
      if (moving || key !== lastPaint) paintLocal(pose(data[stage.shape], stage.shape, local));
      lastPaint = key;
    }
    previousStage = stage;
  }

  function allowed() {
    return !reduced.matches && !document.hidden && inView && !document.documentElement.classList.contains('motion-paused');
  }

  function tick(now) {
    raf = 0;
    if (!allowed()) { clock.pause(); return; }
    const elapsed = clock.step(now);
    let cursor = elapsed - cycleStart;
    let stage = cycle.stages[0]; stageStart = cycleStart;
    const duration = cycle.stages.reduce((total, item) => total + item.duration, 0);
    if (cursor >= duration) {
      cycleStart += duration; cycle = makeCycle(random, false, cycle.insertion);
      cursor = elapsed - cycleStart; stageStart = cycleStart; previousStage = null;
    }
    for (const candidate of cycle.stages) {
      stage = candidate;
      if (cursor < candidate.duration) break;
      cursor -= candidate.duration; stageStart += candidate.duration;
    }
    element.classList.add('is-animated');
    render(stage, cursor);
    raf = global.requestAnimationFrame(tick);
  }

  function sync() {
    if (!allowed()) {
      global.cancelAnimationFrame(raf); raf = 0; clock.pause();
      if (reduced.matches) {
        element.classList.remove('is-animated'); flight.hidden = true;
        clock.reset(); cycleStart = 0; cycle = makeCycle(random, true, cycle.insertion);
        previousStage = null; lastFrame = null; lastPaint = '';
      } else if (!inView || document.hidden) flight.hidden = true;
      // User pause deliberately retains every visible pose, including mid-flight.
      return;
    }
    if (!raf) raf = global.requestAnimationFrame(tick);
  }

  new MutationObserver(sync).observe(document.documentElement, {attributes: true, attributeFilter: ['class']});
  reduced.addEventListener?.('change', sync);
  document.addEventListener('visibilitychange', sync);
  global.addEventListener('resize', resize, {passive: true});
  global.addEventListener('pagehide', () => { global.cancelAnimationFrame(raf); raf = 0; clock.pause(); });
  global.addEventListener('pageshow', sync);
  if ('IntersectionObserver' in global) {
    const observer = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting; sync();
    }, {threshold: 0});
    observer.observe(element);
  }
  resize(); sync();
})(typeof window !== 'undefined' ? window : globalThis);
