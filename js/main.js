// Ultimate Fight Fitness — shared scripts

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PREVIEW = !!window.UFF_PREVIEW;

// Loading curtain — shows once per browsing session
const loader = document.querySelector('.loader');
if (loader) {
  const dismiss = () => {
    if (loader.classList.contains('done')) return;
    loader.classList.add('done');
    try { sessionStorage.uffSeen = '1'; } catch (e) {}
  };
  window.addEventListener('load', () => setTimeout(dismiss, 700));
  setTimeout(dismiss, 2400); // safety net
}

// Scroll progress bar
const progress = document.getElementById('progress');
if (progress) {
  const paint = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
  };
  addEventListener('scroll', paint, { passive: true });
  paint();
}

// Custom cursor ring (desktop pointers only)
const cursor = document.getElementById('cursor');
if (cursor && matchMedia('(pointer: fine)').matches && !REDUCED) {
  let tx = -100, ty = -100, x = -100, y = -100;
  addEventListener('mousemove', e => {
    tx = e.clientX; ty = e.clientY;
    cursor.classList.add('on');
    cursor.classList.toggle('hot', !!e.target.closest('a, button, summary, .tile, .plan'));
  }, { passive: true });
  (function follow() {
    x += (tx - x) * 0.2; y += (ty - y) * 0.2;
    cursor.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)';
    requestAnimationFrame(follow);
  })();
  addEventListener('mouseout', e => { if (!e.relatedTarget) cursor.classList.remove('on'); });
}

// Magnetic buttons
if (matchMedia('(pointer: fine)').matches && !REDUCED) {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) / r.width;
      const dy = (e.clientY - r.top - r.height / 2) / r.height;
      btn.style.transform = 'translate(' + dx * 5 + 'px,' + (dy * 4 - 1) + 'px)';
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
}

// Gentle parallax on feature photos
if (!REDUCED) {
  const pxEls = Array.from(document.querySelectorAll('.split .photo img'));
  if (pxEls.length) {
    let ticking = false;
    const move = () => {
      pxEls.forEach(img => {
        const r = img.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        img.style.transform = 'translateY(' + (p * -16).toFixed(1) + 'px) scale(1.06)';
      });
      ticking = false;
    };
    addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(move); ticking = true; }
    }, { passive: true });
    move();
  }
}

// Page-to-page fade (real site only, not the single-file preview)
if (!PREVIEW && !REDUCED) {
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href$=".html"], a[href*=".html#"]');
    if (!a || a.target === '_blank') return;
    const href = a.getAttribute('href');
    if (/^https?:|^mailto:/.test(href)) return;
    e.preventDefault();
    if (window.__uffWipe) { window.__uffWipe(href); return; }
    document.body.classList.add('leaving');
    setTimeout(() => { window.location.href = href; }, 200);
  });
}

// Mobile navigation
const burger = document.querySelector('.burger');
const navLinks = document.querySelector('.nav-links');
if (burger && navLinks) {
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
}

// Timetable tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
function activateTab(id, updateHash) {
  const target = document.getElementById(id);
  if (!target) return;
  tabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab === id));
  tabPanels.forEach(p => p.classList.toggle('active', p.id === id));
  if (updateHash) history.replaceState(null, '', '#' + id);
}
if (tabButtons.length) {
  tabButtons.forEach(btn => btn.addEventListener('click', () => activateTab(btn.dataset.tab, true)));
  const initial = location.hash.replace('#', '');
  activateTab(document.getElementById(initial) ? initial : tabButtons[0].dataset.tab, false);
  window.addEventListener('hashchange', () => {
    const id = location.hash.replace('#', '');
    if (document.getElementById(id)) activateTab(id, false);
  });
}

// Contact form -> opens the visitor's email app with the message filled in
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const get = n => (form.querySelector('[name="' + n + '"]') || { value: '' }).value.trim();
    const name = (get('first') + ' ' + get('last')).trim();
    const body =
      'Name: ' + name + '\n' +
      'Email: ' + get('email') + '\n' +
      (get('phone') ? 'Phone: ' + get('phone') + '\n' : '') +
      '\n' + get('message');
    const subject = 'Website enquiry' + (name ? ' from ' + name : '');
    window.location.href = 'mailto:info@ultimatefightfitness.co.uk' +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
  });
}

// Reveal on scroll — grid children get a small stagger
document.querySelectorAll('.tile-grid, .card-grid, .gallery, .price-grid, .day-grid').forEach(grid => {
  Array.from(grid.children).forEach((el, i) => {
    el.style.transitionDelay = (i % 9) * 70 + 'ms';
  });
});
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealEls.length) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('in'));
}

// Hero stat count-up
const counters = document.querySelectorAll('[data-count]');
if (counters.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  counters.forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    const start = performance.now();
    const dur = 1100;
    el.textContent = '0';
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

// Highlight today's column on the timetables
const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
document.querySelectorAll('.day h4').forEach(h => {
  if (h.textContent.trim() === todayName) h.parentElement.classList.add('today');
});

// Lightbox for photos
document.addEventListener('click', e => {
  const img = e.target.closest('.gallery img, .coach-media img, .split .photo img');
  if (!img) return;
  const box = document.createElement('div');
  box.className = 'lightbox';
  const full = document.createElement('img');
  full.src = img.src;
  full.alt = img.alt || '';
  box.appendChild(full);
  box.addEventListener('click', () => box.remove());
  document.addEventListener('keydown', function esc(ev) {
    if (ev.key === 'Escape') { box.remove(); document.removeEventListener('keydown', esc); }
  });
  document.body.appendChild(box);
});

/* ============================================================
   IMMERSION ENGINE
   One rAF loop, one pointer listener, one scroll listener, one
   IntersectionObserver. Never boots under prefers-reduced-motion,
   so the base site stays exactly as it was.
   ============================================================ */
(function () {
  if (REDUCED) return;

  var root = document.documentElement;
  var FINE = matchMedia('(pointer: fine)').matches;
  var LOW = (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
            (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4);
  var RICH = FINE && !LOW && innerWidth >= 900;

  root.classList.add('immersive');
  if (RICH) root.classList.add('rich');

  /* ---------- shared state ---------- */
  var S = {
    sy: scrollY, vel: 0, rawVel: 0,
    px: 0, py: 0, tx: 0, ty: 0,      /* pointer, smoothed + target */
    mx: innerWidth / 2, my: innerHeight / 2,
    t: 0, hero: null, heroIn: true
  };

  /* ---------- 1. hero atmosphere ---------- */
  var hero = document.querySelector('.hero') || document.querySelector('.page-hero');
  var heroBg = hero && hero.querySelector('.hero-bg');
  var dustCtx = null, dust = [], dustCv = null;

  if (hero) {
    S.hero = hero;
    var atmos = document.createElement('div');
    atmos.className = 'hero-atmos';
    atmos.setAttribute('aria-hidden', 'true');
    atmos.innerHTML = (RICH ? '<span class="beam b1"></span><span class="beam b2"></span>' +
                              '<canvas class="dust"></canvas>' : '') +
                      '<span class="vig"></span>';
    hero.insertBefore(atmos, hero.firstChild);

    /* full-height hero gets a cue that there is a room below */
    if (hero.classList.contains('hero')) {
      var cue = document.createElement('div');
      cue.className = 'scroll-cue';
      cue.setAttribute('aria-hidden', 'true');
      cue.innerHTML = '<span class="rail"></span>';
      hero.appendChild(cue);
    }

    dustCv = atmos.querySelector('.dust');
    if (dustCv) {
      dustCtx = dustCv.getContext('2d');
      var sizeDust = function () {
        var r = hero.getBoundingClientRect();
        var dpr = 1;  /* full-res dust is invisible work on a blurry particle */
        dustCv.width = Math.max(1, Math.round(r.width * dpr));
        dustCv.height = Math.max(1, Math.round(r.height * dpr));
        dustCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        dust = [];
        var n = Math.round(Math.min(28, r.width / 42));
        for (var i = 0; i < n; i++) {
          dust.push({
            x: Math.random() * r.width,
            y: Math.random() * r.height,
            r: 0.6 + Math.random() * 1.9,
            a: 0.05 + Math.random() * 0.16,
            vy: -(0.06 + Math.random() * 0.22),
            vx: (Math.random() - 0.5) * 0.16,
            ph: Math.random() * 6.28
          });
        }
      };
      sizeDust();
      addEventListener('resize', debounce(sizeDust, 250), { passive: true });
    }
  }

  /* ---------- 2. spotlight + cursor ---------- */
  var spot = null;
  if (RICH) {
    spot = document.createElement('div');
    spot.id = 'spotlight';
    spot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(spot);
  }

  /* ---------- 3. tiles with volume ---------- */
  var tilts = [];
  if (RICH) {
    document.querySelectorAll('.tile').forEach(function (tile) {
      var sheen = document.createElement('span');
      sheen.className = 'sheen';
      var b1 = document.createElement('span'); b1.className = 'brk tl';
      var b2 = document.createElement('span'); b2.className = 'brk br';
      tile.appendChild(sheen); tile.appendChild(b1); tile.appendChild(b2);
      bindTilt(tile, tile.querySelector('img'), 9, 34);
    });
    document.querySelectorAll('.card, .plan, .step').forEach(function (el) {
      bindTilt(el, null, 4, 0);
    });
  }

  function bindTilt(el, inner, maxDeg, imgShift) {
    var raf = null, tX = 0, tY = 0, cX = 0, cY = 0, active = false;
    var cZ = 0;
    function frame() {
      cX += (tX - cX) * 0.16;
      cY += (tY - cY) * 0.16;
      cZ += ((active ? 1 : 0) - cZ) * 0.16;
      el.style.transform = 'perspective(1100px) rotateX(' + (-cY * maxDeg).toFixed(2) + 'deg) rotateY(' +
                           (cX * maxDeg).toFixed(2) + 'deg) translateZ(' + (cZ * 16).toFixed(1) + 'px)';
      if (inner) {
        var sc = 1 + cZ * 0.09;
        inner.style.transform = 'scale(' + sc.toFixed(3) + ') translate(' + (-cX * imgShift).toFixed(1) + 'px,' +
                                (-cY * imgShift).toFixed(1) + 'px)';
      }
      if (Math.abs(tX - cX) > 0.001 || Math.abs(tY - cY) > 0.001 || Math.abs(cZ - (active ? 1 : 0)) > 0.002) {
        raf = requestAnimationFrame(frame);
      } else {
        raf = null;
        if (!active) { el.style.transform = ''; if (inner) inner.style.transform = ''; }
      }
    }
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      tX = (e.clientX - r.left) / r.width - 0.5;
      tY = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--mx', ((tX + 0.5) * 100).toFixed(1) + '%');
      el.style.setProperty('--my', ((tY + 0.5) * 100).toFixed(1) + '%');
      active = true;
      if (!raf) raf = requestAnimationFrame(frame);
    }, { passive: true });
    el.addEventListener('pointerleave', function () {
      tX = 0; tY = 0; active = false;
      if (!raf) raf = requestAnimationFrame(frame);
    }, { passive: true });
  }

  /* ---------- 4. lean into the scroll ----------
     Only the marquee leans. Skewing the big content grids meant
     re-rasterising large blocks of text every frame, which cost far
     more than it was worth. */
  var marquee = document.querySelector('.marquee');
  var leaners = [];

  var inView = new Set();
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) inView.add(en.target); else inView.delete(en.target);
        if (en.target === hero) S.heroIn = en.isIntersecting;
      });
    }, { rootMargin: '80px' });
    leaners.forEach(function (el) { io.observe(el); });
    if (hero) io.observe(hero);
  }

  /* ---------- 5. header + deep layers ---------- */
  var header = document.querySelector('.site-header');
  var heroWrap = hero && hero.querySelector('.wrap');
  if (heroWrap) heroWrap.style.willChange = 'transform, opacity';

  /* things that live further back in the scene and drift slower */
  var deepEls = [];
  document.querySelectorAll('.bg-word').forEach(function (el) { deepEls.push({ el: el, k: 58 }); });
  document.querySelectorAll('.band .hero-bg').forEach(function (el) { deepEls.push({ el: el, k: -46 }); });
  deepEls.forEach(function (d) {
    d.el.style.willChange = 'transform';
    if (io) io.observe(d.el);
    inView.add(d.el);
  });

  /* ---------- 6. listeners ---------- */
  addEventListener('scroll', function () {
    var y = scrollY;
    S.rawVel = Math.max(-1, Math.min(1, (y - S.sy) / 34));
    S.sy = y;
    if (header) header.classList.toggle('condensed', y > 70);
  }, { passive: true });

  if (FINE) {
    addEventListener('pointermove', function (e) {
      S.mx = e.clientX; S.my = e.clientY;
      S.tx = (e.clientX / innerWidth - 0.5) * 2;
      S.ty = (e.clientY / innerHeight - 0.5) * 2;
      if (spot) spot.classList.add('on');
    }, { passive: true });
    addEventListener('pointerdown', function () { if (spot) spot.classList.add('on'); }, { passive: true });
  }

  /* ---------- 7. the one loop ---------- */
  var last = performance.now(), lastVel = 0, frameN = 0, heroH = 0, lastDeepY = -1, lastMx = -1, lastMy = -1;
  var measure = function () { heroH = hero ? hero.offsetHeight : 0; };
  measure();
  addEventListener('resize', debounce(measure, 250), { passive: true });
  addEventListener('load', measure);

  function loop(now) {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    var dt = Math.min(64, now - last); last = now;
    S.t += dt / 1000;
    frameN++;

    /* smooth pointer + velocity */
    S.px += (S.tx - S.px) * 0.055;
    S.py += (S.ty - S.py) * 0.055;
    S.vel += (S.rawVel - S.vel) * 0.14;
    S.rawVel *= 0.86;

    /* the ticker lurches with the scroll. Written straight to the one
       element rather than a :root custom property, which would force a
       document-wide style recalc on every single frame. */
    if (marquee && Math.abs(S.vel - lastVel) > 0.004) {
      lastVel = S.vel;
      marquee.style.transform = 'rotate(-1.2deg) scale(1.04) translateX(' + (S.vel * -46).toFixed(1) + 'px)';
    }

    /* hero camera: slow breath + pointer look + scroll dolly.
       The room and the words move against each other, so the hero
       reads as a space with the text floating inside it. */
    if (heroBg && S.heroIn && RICH) {
      var breath = 1.075 + Math.sin(S.t * 0.16) * 0.014;
      var dolly = Math.min(1, S.sy / (heroH || innerHeight || 1));
      var tx = S.px * -16, ty = S.py * -11 + dolly * 42;
      heroBg.style.transform = 'scale(' + (breath + dolly * 0.05).toFixed(4) + ') translate3d(' +
        tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0)';
      if (heroWrap) {
        heroWrap.style.transform = 'translate3d(' + (S.px * 7).toFixed(1) + 'px,' +
          (S.py * 5 - dolly * 74).toFixed(1) + 'px,0)';
        heroWrap.style.opacity = Math.max(0, 1 - dolly * 1.25).toFixed(3);
      }
    }

    /* The big ghost words sit deeper in the room than the copy.
       All rects are read first and all transforms written after, so the
       browser does one layout pass instead of one per element. */
    if (deepEls.length && S.sy !== lastDeepY) {
      lastDeepY = S.sy;
      var vh = innerHeight || 1, i2, de, out = [];
      for (i2 = 0; i2 < deepEls.length; i2++) {
        de = deepEls[i2];
        if (!inView.has(de.el)) { out.push(null); continue; }
        var dr = de.el.getBoundingClientRect();
        out.push((dr.top + dr.height / 2 - vh / 2) / vh * de.k);
      }
      for (i2 = 0; i2 < deepEls.length; i2++) {
        if (out[i2] === null) continue;
        deepEls[i2].el.style.transform = 'translate3d(0,' + out[i2].toFixed(1) + 'px,0)';
      }
    }

    /* dust */
    if (dustCtx && S.heroIn && (frameN & 1)) {
      var w = dustCv.width, h = dustCv.height;
      dustCtx.clearRect(0, 0, w, h);
      for (var i = 0; i < dust.length; i++) {
        var p = dust[i];
        p.y += p.vy * (dt / 8);
        p.x += (p.vx + Math.sin(S.t * 0.5 + p.ph) * 0.12 + S.px * 0.25) * (dt / 8);
        if (p.y < -8) { p.y = h + 8; p.x = Math.random() * w; }
        if (p.x < -8) p.x = w + 8; else if (p.x > w + 8) p.x = -8;
        var tw = p.a * (0.65 + 0.35 * Math.sin(S.t * 1.6 + p.ph));
        dustCtx.beginPath();
        dustCtx.fillStyle = 'rgba(255,250,240,' + tw.toFixed(3) + ')';
        dustCtx.arc(p.x, p.y, p.r, 0, 6.283);
        dustCtx.fill();
      }
    }

    /* spotlight — only written when the pointer actually moved */
    if (spot && (S.mx !== lastMx || S.my !== lastMy)) {
      lastMx = S.mx; lastMy = S.my;
      spot.style.transform = 'translate3d(' + S.mx + 'px,' + S.my + 'px,0)';
    }
  }
  requestAnimationFrame(loop);

  /* ---------- 8. arrival ---------- */
  root.classList.add('booting');
  var settle = function () { root.classList.remove('booting'); };
  addEventListener('load', function () { setTimeout(settle, 1700); });
  setTimeout(settle, 3200);

  /* stat impact when the count-up lands */
  setTimeout(function () {
    document.querySelectorAll('.hero-stats b').forEach(function (b, i) {
      setTimeout(function () { b.classList.add('landed'); }, 1150 + i * 90);
    });
  }, 400);

  /* ---------- 9. live now ---------- */
  /* minutes from midnight -> [start, minutes, name, sub] */
  var M = function (h, m) { return h * 60 + m; };
  var BJJ = 60, SC = 45, MT = 60;
  var SCHED = {
    1: [[M(6,15), SC, 'Hybrid', 'S&C'], [M(7,15), SC, 'Sweat', 'S&C'], [M(9,15), SC, 'Strength', 'S&C'],
        [M(12,30), SC, 'Small Group PT', 'S&C'], [M(12,30), BJJ, 'BJJ Beginners & Intermediates', 'Gi'],
        [M(17,30), BJJ, 'BJJ Beginners & Intermediates', 'Gi'], [M(18,45), BJJ, 'BJJ Beginners & Intermediates', 'No-Gi'],
        [M(18,45), MT, 'Muay Thai Adults', 'All levels']],
    2: [[M(6,15), SC, 'Sweat', 'S&C'], [M(7,15), SC, 'Hybrid', 'S&C'], [M(9,15), SC, 'Small Group PT', 'S&C'],
        [M(12,30), SC, 'Strength', 'S&C'], [M(12,30), BJJ, 'BJJ Beginners & Intermediates', 'No-Gi'],
        [M(17,30), BJJ, 'BJJ Beginners & Intermediates', 'No-Gi'], [M(18,30), SC, 'Hybrid', 'S&C'],
        [M(18,45), BJJ, 'BJJ Beginners & Intermediates', 'Gi']],
    3: [[M(6,15), SC, 'Small Group PT', 'S&C'], [M(7,15), SC, 'Strength', 'S&C'], [M(9,15), SC, 'Hybrid', 'S&C'],
        [M(12,30), SC, 'Sweat', 'S&C'], [M(12,30), BJJ, 'BJJ Beginners & Intermediates', 'Gi'],
        [M(17,30), BJJ, 'Open Mat', 'BJJ'], [M(18,45), MT, 'Muay Thai Adults', 'All levels']],
    4: [[M(6,15), SC, 'Strength', 'S&C'], [M(7,15), SC, 'Small Group PT', 'S&C'], [M(9,15), SC, 'Sweat', 'S&C'],
        [M(12,30), SC, 'Hybrid', 'S&C'], [M(12,30), BJJ, 'BJJ Beginners & Intermediates', 'No-Gi'],
        [M(17,30), BJJ, 'BJJ Beginners & Intermediates', 'No-Gi'], [M(18,30), SC, 'Strength', 'S&C'],
        [M(18,45), BJJ, 'BJJ Beginners & Intermediates', 'Gi']],
    5: [[M(6,15), SC, 'Hybrid', 'S&C'], [M(7,15), SC, 'Sweat', 'S&C'], [M(9,15), SC, 'Small Group PT', 'S&C'],
        [M(12,30), SC, 'Strength', 'S&C'], [M(12,30), BJJ, 'BJJ Beginners & Intermediates', 'Gi'],
        [M(17,30), BJJ, 'BJJ Beginners & Intermediates', 'Gi'], [M(18,45), BJJ, 'BJJ Beginners & Intermediates', 'No-Gi'],
        [M(18,45), MT, 'Muay Thai Adults', 'All levels']],
    6: [[M(12,30), BJJ, 'Open Mat', 'BJJ']],
    0: [[M(12,30), BJJ, 'Open Mat', 'BJJ']]
  };
  var HOURS = { 1: [360, 1200], 2: [360, 1200], 3: [360, 1200], 4: [360, 1200], 5: [360, 1200], 6: [600, 840], 0: [720, 840] };
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function hhmm(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return h + ':' + (m < 10 ? '0' : '') + m;
  }
  function dur(min) {
    if (min < 60) return min + ' min';
    var h = Math.floor(min / 60), m = min % 60;
    return h + 'h' + (m ? ' ' + m + 'm' : '');
  }

  function liveState() {
    var now = new Date();
    var d = now.getDay(), t = now.getHours() * 60 + now.getMinutes();
    var today = (SCHED[d] || []).slice().sort(function (a, b) { return a[0] - b[0]; });
    var open = HOURS[d];

    for (var i = 0; i < today.length; i++) {
      var c = today[i];
      if (t >= c[0] && t < c[0] + c[1]) {
        return { cls: 'is-live', label: 'On the mats now',
                 text: c[2] + (c[3] ? ' · ' + c[3] : '') + ' · ' + (c[0] + c[1] - t) + ' min left' };
      }
    }
    for (var j = 0; j < today.length; j++) {
      if (today[j][0] > t) {
        var n = today[j];
        return { cls: 'is-open', label: 'Next up',
                 text: n[2] + ' · ' + hhmm(n[0]) + ' · in ' + dur(n[0] - t) };
      }
    }
    if (open && t >= open[0] && t < open[1]) {
      return { cls: 'is-open', label: 'Gym open', text: 'Open floor until ' + hhmm(open[1]) };
    }
    for (var k = 1; k <= 7; k++) {
      var nd = (d + k) % 7, list = (SCHED[nd] || []).slice().sort(function (a, b) { return a[0] - b[0]; });
      if (list.length) {
        var when = k === 1 ? 'Tomorrow' : DAYS[nd];
        return { cls: '', label: 'Next session', text: when + ' · ' + list[0][2] + ' · ' + hhmm(list[0][0]) };
      }
    }
    return { cls: '', label: 'Timetable', text: 'See the full week' };
  }

  var liveEl = null;
  if (hero) {
    var anchor = hero.querySelector('.hero-ctas') || hero.querySelector('.hero-inner') || hero.querySelector('.wrap');
    if (anchor) {
      liveEl = document.createElement('a');
      liveEl.className = 'live-now';
      liveEl.href = 'timetables.html';
      liveEl.innerHTML = '<span class="dot"></span><b></b><span class="sep">|</span><span class="txt"></span>';
      if (anchor.classList.contains('hero-ctas')) anchor.parentNode.insertBefore(liveEl, anchor.nextSibling);
      else anchor.appendChild(liveEl);
      var paintLive = function () {
        var st = liveState();
        liveEl.className = 'live-now ' + st.cls;
        liveEl.querySelector('b').textContent = st.label;
        liveEl.querySelector('.txt').textContent = st.text;
      };
      paintLive();
      setInterval(paintLive, 20000);
    }
  }

  /* ---------- 9b. the founding bar drains in as you reach it ---------- */
  (function () {
    var fill = document.querySelector('.spots-fill');
    if (!fill || !('IntersectionObserver' in window)) return;
    var target = fill.style.width || getComputedStyle(fill).width;
    fill.style.width = '0%';
    var fio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        setTimeout(function () { fill.style.width = target; }, 200);
        fio.disconnect();
      });
    }, { threshold: 0.35 });
    fio.observe(fill.parentNode || fill);
  })();

  /* ---------- 10. time of day ---------- */
  (function () {
    var h = new Date().getHours();
    var tod = h < 8 ? 'dawn' : h < 16 ? 'day' : h < 20 ? 'dusk' : 'night';
    root.classList.add('tod-' + tod);
  })();

  /* ---------- 11. sound layer (opt in) ---------- */
  var ctx = null, master = null, on = false, lastTick = 0;
  try { on = localStorage.uffSound === '1'; } catch (e) {}

  var sbtn = document.createElement('button');
  sbtn.id = 'sound';
  sbtn.type = 'button';
  sbtn.setAttribute('aria-label', 'Toggle sound');
  sbtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  sbtn.innerHTML = '<i></i><i></i><i></i>';
  if (on) sbtn.classList.add('on');
  document.body.appendChild(sbtn);

  function audio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tick() {
    if (!on) return;
    var n = performance.now();
    if (n - lastTick < 90) return;
    lastTick = n;
    var c = audio(); if (!c) return;
    var t0 = c.currentTime, len = Math.floor(c.sampleRate * 0.03);
    var buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    var src = c.createBufferSource(); src.buffer = buf;
    var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 1.1;
    var g = c.createGain(); g.gain.value = 0.13;
    src.connect(bp); bp.connect(g); g.connect(master); src.start(t0);
  }
  function bell(gain) {
    if (!on) return;
    var c = audio(); if (!c) return;
    var t0 = c.currentTime; gain = gain || 0.5;
    [[605, 1], [1222, .55], [1810, .4], [2513, .25]].forEach(function (p) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = p[0];
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.42 * p[1] * gain, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.7);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + 1.8);
    });
  }
  sbtn.addEventListener('click', function () {
    on = !on;
    sbtn.classList.toggle('on', on);
    sbtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    try { localStorage.uffSound = on ? '1' : '0'; } catch (e) {}
    if (on) { audio(); bell(0.4); }
  });
  if (FINE) {
    document.addEventListener('pointerenter', function (e) {
      if (e.target && e.target.closest && e.target.closest('.tile, .btn, .plan, .nav-links a, .card')) tick();
    }, true);
  }
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('.btn')) bell(0.35);
  }, true);

  /* ---------- 12. exit wipe ---------- */
  if (!PREVIEW) {
    var wipe = document.createElement('div');
    wipe.id = 'wipe';
    wipe.setAttribute('aria-hidden', 'true');
    var mark = document.createElement('img');
    mark.src = 'assets/img/logo-small.png';
    mark.alt = '';
    wipe.appendChild(mark);
    document.body.appendChild(wipe);
    window.__uffWipe = function (href) {
      wipe.classList.add('go');
      setTimeout(function () { location.href = href; }, 430);
    };
  }

  /* ---------- utils ---------- */
  function debounce(fn, ms) {
    var id;
    return function () { clearTimeout(id); id = setTimeout(fn, ms); };
  }
})();
