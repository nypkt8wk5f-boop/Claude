// Ultimate Fight Fitness — shared scripts

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PREVIEW = !!window.UFF_PREVIEW;

// Loading curtain — a beat on first arrival, instant on every page after
const loader = document.querySelector('.loader');
if (loader) {
  let seen = false;
  try { seen = sessionStorage.uffSeen === '1'; } catch (e) {}
  const dismiss = () => {
    if (loader.classList.contains('done')) return;
    loader.classList.add('done');
    // once the doors have opened, take the whole thing out of the page —
    // parked-off-screen halves can peek back in when mobile browser chrome
    // collapses, which reads as a black band with a red seam over content
    setTimeout(() => { loader.style.display = 'none'; }, 500);
    try { sessionStorage.uffSeen = '1'; } catch (e) {}
  };
  // don't wait for window.load — images can hold the logo hostage on mobile
  const arm = () => setTimeout(dismiss, 0);
  if (document.readyState !== 'loading') arm();
  else document.addEventListener('DOMContentLoaded', arm);
  setTimeout(dismiss, seen ? 350 : 800); // safety net
}

// Scroll progress bar — you rank up as you read: white, blue, purple, brown, black
const progress = document.getElementById('progress');
if (progress) {
  const BELTS = ['#e9e7e2', '#2e6ad1', '#7b3fd6', '#8d5a36', '#3a3a3e'];
  let lastBelt = -1, ticking = false;
  const paint = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const frac = max > 0 ? Math.min(1, scrollY / max) : 0;
    // scaleX composites; width would relayout on every scroll event
    progress.style.transform = 'scaleX(' + frac.toFixed(4) + ')';
    const belt = Math.min(BELTS.length - 1, Math.floor(frac * BELTS.length));
    if (belt !== lastBelt) {
      lastBelt = belt;
      // the red tip is the belt's rank bar
      progress.style.background = 'linear-gradient(90deg,' + BELTS[belt] + ' 0 calc(100% - 20px), #d92730 0)';
    }
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(paint); }
  }, { passive: true });
  paint();
}

// Custom cursor ring (desktop pointers only)
const cursor = document.getElementById('cursor');
if (cursor && matchMedia('(pointer: fine)').matches && !REDUCED) {
  let tx = -100, ty = -100, x = -100, y = -100, raf = null;
  const follow = () => {
    x += (tx - x) * 0.2; y += (ty - y) * 0.2;
    cursor.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)';
    if (Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1) raf = requestAnimationFrame(follow);
    else raf = null; // parked — the next mousemove restarts it
  };
  addEventListener('mousemove', e => {
    tx = e.clientX; ty = e.clientY;
    cursor.classList.add('on');
    cursor.classList.toggle('hot', !!e.target.closest('a, button, summary, label, input, .tile, .plan, .tab-btn'));
    if (!raf) raf = requestAnimationFrame(follow);
  }, { passive: true });
  addEventListener('mouseout', e => { if (!e.relatedTarget) cursor.classList.remove('on'); });
}

// Magnetic controls — every button, nav link and chip leans toward the cursor
// from a radius around it, and springs back when you leave. One rAF, rects
// batch-measured at most every 120ms, styles written only while moving.
if (matchMedia('(pointer: fine)').matches && !REDUCED) {
  (function () {
    const els = document.querySelectorAll('.btn, .nav-links a, .tab-btn, .site-footer .link');
    const items = [];
    els.forEach(el => {
      items.push({ el, x: 0, y: 0, tx: 0, ty: 0, r: null, idle: true, last: '' });
    });
    if (!items.length) return;
    let mx = -1e4, my = -1e4, raf = null, measured = 0, moving = false;
    const measure = () => {
      for (const it of items) it.r = it.el.getBoundingClientRect();
      measured = performance.now();
    };
    const tick = () => {
      // measure at the top of the frame, before any transform writes
      if (performance.now() - measured > 120) measure();
      let busy = false;
      for (const it of items) {
        const r = it.r;
        if (r) {
          // subtract our own offset so the pull target doesn't chase itself
          const cx = r.left + r.width / 2 - it.x, cy = r.top + r.height / 2 - it.y;
          const dx = mx - cx, dy = my - cy;
          const range = Math.max(r.width, r.height) / 2 + 64;
          const d = Math.hypot(dx, dy);
          if (d < range) {
            const pull = 1 - d / range;
            it.tx = Math.max(-13, Math.min(13, dx * pull * 0.30));
            it.ty = Math.max(-9, Math.min(9, dy * pull * 0.24));
          } else { it.tx = 0; it.ty = 0; }
        }
        it.x += (it.tx - it.x) * 0.22;
        it.y += (it.ty - it.y) * 0.22;
        const home = !it.tx && !it.ty && Math.abs(it.x) < 0.12 && Math.abs(it.y) < 0.12;
        const atTarget = Math.abs(it.tx - it.x) < 0.06 && Math.abs(it.ty - it.y) < 0.06;
        if (home) {
          if (!it.idle) {
            it.idle = true; it.last = '';
            it.el.style.transform = ''; it.el.style.willChange = '';
          }
        } else {
          if (it.idle) { it.idle = false; it.el.style.willChange = 'transform'; }
          if (!atTarget) {
            busy = true;
            const t = 'translate(' + it.x.toFixed(2) + 'px,' + it.y.toFixed(2) + 'px)';
            if (t !== it.last) { it.last = t; it.el.style.transform = t; }
          }
        }
      }
      if (busy || moving) { moving = false; raf = requestAnimationFrame(tick); }
      else raf = null;
    };
    const wake = () => { moving = true; if (!raf) raf = requestAnimationFrame(tick); };
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; wake(); }, { passive: true });
    addEventListener('scroll', () => { measured = 0; wake(); }, { passive: true });
    // pointer leaves the window: let everything spring home
    addEventListener('mouseout', e => {
      if (!e.relatedTarget) { mx = -1e4; my = -1e4; wake(); }
    });
  })();
}

// Gentle parallax on feature photos
if (!REDUCED) {
  const pxEls = Array.from(document.querySelectorAll('.split .photo img'));
  if (pxEls.length) {
    let ticking = false;
    const move = () => {
      // read every rect, then write every transform — no interleaved layout
      const rects = pxEls.map(img => img.getBoundingClientRect());
      pxEls.forEach((img, i) => {
        const r = rects[i];
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

// Page-to-page red wipe. The curtain rises with the logo and a live loading
// bar while the next page is already fetching; the destination arrives with a
// matching red curtain (html.wiped) that slides away, so slow connections show
// a branded loading screen instead of a dead red wall.
if (!PREVIEW && !REDUCED) {
  document.addEventListener('click', e => {
    // leave modified clicks (new tab / new window) to the browser
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.defaultPrevented) return;
    const a = e.target.closest('a[href$=".html"], a[href*=".html#"]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    if (a.closest('.site-header') && a.classList.contains('logo')) return; // logo taps feed FIGHT MODE
    const href = a.getAttribute('href');
    if (/^https?:|^mailto:/.test(href)) return;
    e.preventDefault();
    if (window.__uffWipe) { window.__uffWipe(href); return; }
    document.body.classList.add('leaving');
    setTimeout(() => { window.location.href = href; }, 180);
  });
  // back-swipe out of the bfcache must not land on a leftover wipe/fade
  addEventListener('pageshow', e => {
    if (!e.persisted) return;
    document.body.classList.remove('leaving');
    const w = document.getElementById('wipe');
    if (w) { w.classList.remove('go'); w.style.visibility = 'hidden'; }
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
  const esc = ev => { if (ev.key === 'Escape') close(); };
  const close = () => { box.remove(); document.removeEventListener('keydown', esc); };
  box.addEventListener('click', close);
  document.addEventListener('keydown', esc);
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

  var film = document.createElement('div');
  film.className = 'film';
  film.setAttribute('aria-hidden', 'true');
  document.body.appendChild(film);

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
  var pulseCv = null, pulseCtx = null, pulseBpm = 46;

  var tilts = [];
  document.querySelectorAll('.tile').forEach(function (tile) {
    var sheen = document.createElement('span');
    sheen.className = 'sheen';
    var b1 = document.createElement('span'); b1.className = 'brk tl';
    var b2 = document.createElement('span'); b2.className = 'brk br';
    tile.appendChild(sheen); tile.appendChild(b1); tile.appendChild(b2);
    if (RICH) bindTilt(tile, tile.querySelector('img'), 9, 34);
  });
  if (RICH) {
    document.querySelectorAll('.card, .plan, .step').forEach(function (el) {
      bindTilt(el, null, 4, 0);
    });
    document.querySelectorAll('.coach-media, .gallery figure, .split .photo').forEach(function (el) {
      bindTilt(el, null, 5, 0);
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
        if (!active) {
          el.style.transform = ''; if (inner) inner.style.transform = '';
          /* restore whatever transitions the element normally has (.reveal etc.) */
          el.style.transitionProperty = '';
        }
      }
    }
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      tX = (e.clientX - r.left) / r.width - 0.5;
      tY = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--mx', ((tX + 0.5) * 100).toFixed(1) + '%');
      el.style.setProperty('--my', ((tY + 0.5) * 100).toFixed(1) + '%');
      /* while tilting, a lingering transform transition (from .reveal) would
         retarget every frame and fight the lerp — park it until we rest */
      if (!active) el.style.transitionProperty = 'opacity, box-shadow, filter';
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
  var inView = new Set();
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) inView.add(en.target); else inView.delete(en.target);
        if (en.target === hero) S.heroIn = en.isIntersecting;
      });
    }, { rootMargin: '80px' });
    if (hero) io.observe(hero);
  }

  /* ---------- 4b. touch: the tile under your eyes lifts ---------- */
  var focusTiles = FINE ? [] : Array.prototype.slice.call(document.querySelectorAll('.tile, .plan, .card'));
  var focused = null, lastFocusY = -1;
  function focusPass() {
    if (S.sy === lastFocusY) return;
    lastFocusY = S.sy;
    var mid = innerHeight / 2, best = null, bestD = 1e9, i, r, d;
    for (i = 0; i < focusTiles.length; i++) {
      r = focusTiles[i].getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestD) { bestD = d; best = focusTiles[i]; }
    }
    /* return the change instead of applying it here — the caller applies it
       after the frame's other rect reads, so the toggle can't force a relayout
       mid-read */
    if (best !== focused && bestD < innerHeight * 0.46) return best;
    if (best !== focused && focused) return null;
    return focused;
  }
  function applyFocus(next) {
    if (next === focused) return;
    if (focused) focused.classList.remove('focus');
    focused = next;
    if (focused) focused.classList.add('focus');
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

  if (!FINE) {
    var gyroSeen = false;
    addEventListener('deviceorientation', function (e) {
      if (e.gamma === null || e.gamma === undefined) return;
      if (!gyroSeen) { gyroSeen = true; root.classList.add('gyro'); }
      /* gamma: left/right tilt, beta: front/back. Small window, heavy damping. */
      S.tx = Math.max(-1, Math.min(1, e.gamma / 28));
      S.ty = Math.max(-1, Math.min(1, (e.beta - 45) / 32));
    }, { passive: true });
  }

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
  var last = performance.now(), lastVel = 0, frameN = 0, heroH = 0, lastDeepY = -1, lastMx = -1, lastMy = -1, lastHeroBg = '', lastHeroWrap = '';
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

    /* all rect READS first (focusPass), then the frame's writes below;
       the class toggle itself is applied at the end of the frame */
    var focusNext;
    if (focusTiles.length) focusNext = focusPass();

    /* hero camera: slow breath + pointer look + scroll dolly.
       The room and the words move against each other, so the hero
       reads as a space with the text floating inside it. */
    if (heroBg && S.heroIn) {
      var breath = (RICH ? 1.075 : 1.055) + Math.sin(S.t * 0.16) * 0.014;
      var dolly = Math.min(1, S.sy / (heroH || innerHeight || 1));
      var tx = S.px * -16, ty = S.py * -11 + dolly * 42;
      var hb = 'scale(' + (breath + dolly * 0.05).toFixed(4) + ') translate3d(' +
        tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0)';
      if (hb !== lastHeroBg) { lastHeroBg = hb; heroBg.style.transform = hb; }
      if (heroWrap) {
        var hw = 'translate3d(' + (S.px * 7).toFixed(1) + 'px,' +
          (S.py * 5 - dolly * 74).toFixed(1) + 'px,0)|' + Math.max(0, 1 - dolly * 1.25).toFixed(3);
        if (hw !== lastHeroWrap) {
          lastHeroWrap = hw;
          var parts = hw.split('|');
          heroWrap.style.transform = parts[0];
          heroWrap.style.opacity = parts[1];
        }
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

    bagStep(dt);
    pulseStep(dt);
    if (focusNext !== undefined) applyFocus(focusNext);

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
      setTimeout(function () {
        b.classList.add('landed');
        var stat = b.closest('.stat') || b.parentNode;
        dustBurst(stat);
        if (i === 0) jolt();
      }, 1150 + i * 90);
    });
  }, 400);

  /* ---------- 9. live now ---------- */
  /* minutes from midnight -> [start, minutes, name, sub] */
  var M = function (h, m) { return h * 60 + m; };
  var BJJ = 60, SC = 45, MT = 60, KID = 45;
  var SCHED = {
    1: [[M(9,0), SC, 'Strength', 'S&C'],
        [M(12,30), BJJ, 'BJJ Beginners & Intermediates', 'Gi'],
        [M(17,30), BJJ, 'BJJ Beginners & Intermediates', 'Gi'],
        [M(18,0), SC, 'Sweat', 'S&C'],
        [M(18,45), BJJ, 'BJJ Beginners & Intermediates', 'No-Gi'],
        [M(18,45), MT, 'Muay Thai Adults', 'All levels']],
    2: [[M(9,0), SC, 'Sweat', 'S&C'],
        [M(12,30), BJJ, 'BJJ Beginners & Intermediates', 'No-Gi'],
        [M(16,15), KID, 'BJJ Kids (4–15)', 'Gi'],
        [M(17,30), MT, 'Muay Thai Kids', 'Ages 4–15'],
        [M(17,30), BJJ, 'BJJ Beginners & Intermediates', 'No-Gi'],
        [M(18,30), SC, 'Strength', 'S&C'],
        [M(18,45), BJJ, 'BJJ Beginners & Intermediates', 'Gi']],
    3: [[M(9,0), SC, 'Strength', 'S&C'],
        [M(12,30), BJJ, 'Open Mat', 'BJJ'],
        [M(17,30), BJJ, 'Open Mat', 'BJJ'],
        [M(18,0), SC, 'Sweat', 'S&C'],
        [M(18,45), MT, 'Muay Thai Adults', 'All levels']],
    4: [[M(9,0), SC, 'Sweat', 'S&C'],
        [M(12,30), BJJ, 'BJJ Beginners & Intermediates', 'Gi'],
        [M(16,30), KID, 'BJJ Kids (4–15)', 'No-Gi'],
        [M(17,30), BJJ, 'BJJ Beginners & Intermediates', 'No-Gi'],
        [M(18,0), SC, 'Strength', 'S&C'],
        [M(18,45), BJJ, 'BJJ Beginners & Intermediates', 'Gi']],
    5: [[M(9,0), SC, 'Strength', 'S&C'],
        [M(12,30), BJJ, 'BJJ Beginners & Intermediates', 'No-Gi'],
        [M(17,30), BJJ, 'BJJ Beginners & Intermediates', 'Gi'],
        [M(18,0), SC, 'Sweat', 'S&C'],
        [M(18,45), BJJ, 'BJJ Beginners & Intermediates', 'No-Gi'],
        [M(18,45), MT, 'Muay Thai Adults', 'All levels']],
    6: [[M(10,0), KID, 'Muay Thai Kids', 'Ages 4–15'], [M(12,30), BJJ, 'Open Mat', 'BJJ']],
    0: [[M(12,30), BJJ, 'Open Mat', 'BJJ']]
  };
  function schedFor(d) {
    return (SCHED[d] || []).slice().sort(function (a, b) { return a[0] - b[0]; });
  }
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
    var today = schedFor(d);
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
      var nd = (d + k) % 7, list = schedFor(nd);
      if (list.length) {
        var when = k === 1 ? 'Tomorrow' : DAYS[nd];
        return { cls: '', label: 'Next session', text: when + ' · ' + list[0][2] + ' · ' + hhmm(list[0][0]) };
      }
    }
    return { cls: '', label: 'Timetable', text: 'See the full week' };
  }

  /* the hero ticker reads today's actual classes; rebuilt if the day rolls over */
  var tickerDay = -1;
  function buildTicker() {
    var track = document.querySelector('.marquee-track');
    var d = new Date().getDay();
    if (d === tickerDay) return;
    tickerDay = d;
    if (track) {
      var today = schedFor(d);
      if (today.length) {
        var bits = ['<span class="o">Today at UFF</span><i>&#9679;</i>'];
        for (var i = 0; i < today.length; i++) {
          bits.push('<span>' + hhmm(today[i][0]) + ' ' + today[i][2] + '</span><i>&#9679;</i>');
        }
        bits.push('<span class="o">First session free</span><i>&#9679;</i>');
        /* two copies: the CSS loop shifts -50%, which is seamless only on even counts */
        var seq = bits.join('');
        track.innerHTML = seq + seq;
      }
    }
    /* keep the timetable's Today column honest across midnight too */
    var dayName = DAYS[d];
    document.querySelectorAll('.day h4').forEach(function (h) {
      h.parentElement.classList.toggle('today', h.textContent.trim() === dayName);
    });
  }
  buildTicker();

  var liveEl = null;
  if (hero) {
    var anchor = hero.querySelector('.hero-ctas') || hero.querySelector('.hero-inner') || hero.querySelector('.wrap');
    if (anchor) {
      liveEl = document.createElement('a');
      liveEl.className = 'live-now';
      liveEl.href = 'timetables.html';
      liveEl.innerHTML = '<span class="dot"></span><canvas class="pulse" width="104" height="28" aria-hidden="true"></canvas><b></b><span class="sep">|</span><span class="txt"></span>';
      if (anchor.classList.contains('hero-ctas')) anchor.parentNode.insertBefore(liveEl, anchor.nextSibling);
      else anchor.appendChild(liveEl);
      var paintLive = function () {
        if (document.hidden) return;
        buildTicker(); /* no-op unless the day rolled over */
        var st = liveState();
        liveEl.className = 'live-now ' + st.cls;
        liveEl.querySelector('b').textContent = st.label;
        liveEl.querySelector('.txt').textContent = st.text;
        pulseBpm = st.cls === 'is-live' ? 128 : st.cls === 'is-open' ? 72 : 46;
      };
      paintLive();
      setInterval(paintLive, 20000);
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) paintLive();
      });
      pulseCv = liveEl.querySelector('.pulse');
      /* size the backing store from the CSS box so the trace never squashes */
      var pr = Math.min(2, window.devicePixelRatio || 1);
      var pb = pulseCv.getBoundingClientRect();
      if (pb.width > 4) { pulseCv.width = Math.round(pb.width * pr); pulseCv.height = Math.round(pb.height * pr); }
      pulseCtx = pulseCv.getContext('2d');
      pulseCtx.fillStyle = '#00000000';
    }
  }

  /* the browser-tab favicon wears a red dot while a class is on the mats */
  (function () {
    var link = document.querySelector('link[rel="icon"]');
    if (!link) return;
    var home = link.href, dot = null, isLive = false;
    function setFav(live) {
      if (live === isLive) return;
      isLive = live;
      if (!live) { link.href = home; return; }
      if (dot) { link.href = dot; return; }
      var img = new Image();
      img.onload = function () {
        try {
          var c = document.createElement('canvas'); c.width = 64; c.height = 64;
          var x = c.getContext('2d');
          x.drawImage(img, 0, 0, 64, 64);
          x.beginPath(); x.arc(49, 15, 12, 0, 6.3);
          x.fillStyle = '#d92730'; x.fill();
          x.lineWidth = 4; x.strokeStyle = '#141415'; x.stroke();
          dot = c.toDataURL('image/png');
          if (isLive) link.href = dot;
        } catch (e) {}
      };
      img.src = home;
    }
    var favPaint = function () { setFav(liveState().cls === 'is-live'); };
    favPaint();
    setInterval(favPaint, 60000);
  })();

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

  /* ---------- 9c. the gym pulse ---------- */
  /* declared up-front; section 9 assigns them when the pill exists */
  var pulsePhase = 0, pulseCol = 0;
  function ecgY(p) {
    /* one heartbeat, p in 0..1 -> deflection -1..1 */
    if (p < 0.10) return Math.sin(p / 0.10 * Math.PI) * 0.14;          /* P */
    if (p < 0.14) return 0;
    if (p < 0.17) return -(p - 0.14) / 0.03 * 0.22;                    /* Q */
    if (p < 0.21) return -0.22 + (p - 0.17) / 0.04 * 1.22;             /* R */
    if (p < 0.25) return 1.0 - (p - 0.21) / 0.04 * 1.35;               /* S */
    if (p < 0.30) return -0.35 + (p - 0.25) / 0.05 * 0.35;
    if (p < 0.45) return 0;
    if (p < 0.60) return Math.sin((p - 0.45) / 0.15 * Math.PI) * 0.26; /* T */
    return 0;
  }
  function pulseStep(dt) {
    if (!pulseCtx || !S.heroIn || document.hidden) return;
    var w = pulseCv.width, h = pulseCv.height, mid = h * 0.62;
    var speed = 34; /* px per second */
    pulseCol += speed * dt / 1000;
    var cols = Math.floor(pulseCol);
    if (cols < 1) return;
    pulseCol -= cols;
    if (cols > 6) cols = 6;
    /* scroll left */
    pulseCtx.globalCompositeOperation = 'copy';
    pulseCtx.drawImage(pulseCv, -cols, 0);
    pulseCtx.globalCompositeOperation = 'source-over';
    pulseCtx.clearRect(w - cols, 0, cols, h);
    pulseCtx.strokeStyle = '#d92730';
    pulseCtx.lineWidth = 2;
    pulseCtx.beginPath();
    for (var i = cols; i >= 1; i--) {
      pulsePhase += (pulseBpm / 60) * (1 / speed);
      if (pulsePhase >= 1) pulsePhase -= 1;
      var y = mid - ecgY(pulsePhase) * (h * 0.42);
      var x = w - i + 0.5;
      if (i === cols) pulseCtx.moveTo(x, y); else pulseCtx.lineTo(x, y);
    }
    pulseCtx.stroke();
  }

  /* ---------- 9d. the building runs on gym time ---------- */
  function gymOpenNow() {
    var now = new Date();
    var o = HOURS[now.getDay()];
    if (!o) return false;
    var t = now.getHours() * 60 + now.getMinutes();
    return t >= o[0] && t < o[1];
  }
  var lastTod = '';
  function paintGymState() {
    if (document.hidden) return;
    var open = gymOpenNow();
    root.classList.toggle('gym-open', open);
    root.classList.toggle('gym-shut', !open);
    /* time of day follows the clock, not just the first paint */
    var h = new Date().getHours();
    var tod = h < 8 ? 'dawn' : h < 16 ? 'day' : h < 20 ? 'dusk' : 'night';
    if (tod !== lastTod) {
      if (lastTod) root.classList.remove('tod-' + lastTod);
      root.classList.add('tod-' + tod);
      lastTod = tod;
    }
  }
  paintGymState();
  setInterval(paintGymState, 60000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) paintGymState();
  });

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
  function thump(gain, force) {
    if (!on && !force) return;
    var c = audio(); if (!c) return;
    var t0 = c.currentTime; gain = gain || 0.4;
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(95, t0);
    o.frequency.exponentialRampToValueAtTime(42, t0 + 0.16);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + 0.24);
    var len = Math.floor(c.sampleRate * 0.05);
    var buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    var src = c.createBufferSource(); src.buffer = buf;
    var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 620; bp.Q.value = 0.9;
    var ng = c.createGain(); ng.gain.value = gain * 0.9;
    src.connect(bp); bp.connect(ng); ng.connect(master); src.start(t0);
  }
  function bell(gain, force) {
    if (!on && !force) return;
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
    wipe.style.visibility = 'hidden';
    wipe.setAttribute('aria-hidden', 'true');
    var mark = document.createElement('img');
    mark.src = 'assets/img/logo-small.png';
    mark.alt = '';
    wipe.appendChild(mark);
    var wbar = document.createElement('span');
    wbar.className = 'wbar';
    wipe.appendChild(wbar);
    document.body.appendChild(wipe);
    window.__uffWipe = function (href) {
      try { sessionStorage.uffWipe = '1'; } catch (e) {}
      wipe.style.visibility = 'visible';
      wipe.classList.add('go');
      /* navigate while the curtain is still rising — the fetch overlaps the
         animation and the next page opens under its own red curtain */
      setTimeout(function () { location.href = href; }, 240);
    };
  }

  /* ---------- 13. punch the screen ---------- */
  var mainEl = document.querySelector('main') || document.body;
  var joltLock = false;
  function jolt() {
    if (joltLock) return;
    joltLock = true;
    mainEl.classList.add('jolt');
    setTimeout(function () { mainEl.classList.remove('jolt'); joltLock = false; }, 180);
  }
  function shockwave(x, y) {
    var p = document.createElement('span');
    p.className = 'pow';
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    document.body.appendChild(p);
    setTimeout(function () { p.remove(); }, 500);
  }
  var comboEl = document.createElement('div');
  comboEl.id = 'combo';
  comboEl.setAttribute('aria-hidden', 'true');
  document.body.appendChild(comboEl);
  var comboN = 0, comboAt = 0;

  document.addEventListener('pointerdown', function (e) {
    if (e.button && e.button !== 0) return;
    /* touch scrolling must not shake the page — desktop pointers only */
    if (!FINE || e.pointerType === 'touch') return;
    shockwave(e.clientX, e.clientY);
    var interactive = e.target.closest && e.target.closest('a, button, input, textarea, select, summary, label, .tab-btn');
    if (!interactive) { jolt(); thump(0.32); }
    /* fist jab */
    if (cursor) {
      cursor.classList.remove('jab');
      void cursor.offsetWidth;
      cursor.classList.add('jab');
    }
    /* combo counter (desktop, outside interactive elements) */
    if (FINE && !interactive) {
      var now = performance.now();
      comboN = (now - comboAt < 750) ? comboN + 1 : 1;
      comboAt = now;
      if (comboN >= 2) {
        comboEl.textContent = comboN + '-hit combo';
        comboEl.style.left = e.clientX + 'px';
        comboEl.style.top = e.clientY + 'px';
        comboEl.classList.remove('hit');
        void comboEl.offsetWidth;
        comboEl.classList.add('hit');
      }
    }
  }, { passive: true });

  if (cursor && FINE) {
    var glove = document.createElement('span');
    glove.className = 'glove';
    glove.textContent = '\uD83E\uDD4A';
    cursor.appendChild(glove);
  }

  /* ---------- 14. the bag ---------- */
  var bagSwing = document.getElementById('bagSwing');
  var bagState = null;
  if (bagSwing) {
    var bagHitsEl = document.getElementById('bagHits');
    var bagPrize = document.getElementById('bagPrize');
    var hits = 0;
    try { hits = parseInt(sessionStorage.uffBagHits || '0', 10) || 0; } catch (e) {}
    if (bagHitsEl && hits) bagHitsEl.textContent = hits;
    bagState = { th: 0, w: 0, active: false, px: 0, pt: 0, dragging: false };
    if (io) io.observe(bagSwing.closest('.bagzone') || bagSwing);
    inView.add(bagSwing);

    var bagZone = bagSwing.closest('.bagzone');
    if (bagZone && 'IntersectionObserver' in window) {
      var bio = new IntersectionObserver(function (es) {
        es.forEach(function (en) { bagState.active = en.isIntersecting; });
      }, { rootMargin: '60px' });
      bio.observe(bagZone);
    } else { bagState.active = true; }

    function bagHit(strength, dir, auto) {
      bagState.w += dir * strength;
      if (bagState.w > 5.2) bagState.w = 5.2;
      if (bagState.w < -5.2) bagState.w = -5.2;
      if (auto) return; /* the gym's own nudge: no score, no sound, no prize */
      hits++;
      try { sessionStorage.uffBagHits = String(hits); } catch (e) {}
      if (bagHitsEl) {
        bagHitsEl.textContent = hits;
        bagHitsEl.classList.remove('bump');
        void bagHitsEl.offsetWidth;
        bagHitsEl.classList.add('bump');
      }
      thump(0.5);
      var done = false;
      try { done = sessionStorage.uffBag10 === '1'; } catch (e) {}
      if (hits >= 10 && !done && bagPrize) {
        try { sessionStorage.uffBag10 = '1'; } catch (e) {}
        bagPrize.hidden = false;
        bagPrize.classList.add('show');
        bell(0.5);
      }
    }

    var bagArena = bagSwing.closest('.bag-stage') || bagSwing;
    bagArena.addEventListener('pointerdown', function (e) {
      if (e.target.closest && e.target.closest('.bag-prize')) return;
      bagState.dragging = true;
      bagState.px = e.clientX;
      bagState.pt = performance.now();
      var r = bagSwing.getBoundingClientRect();
      var mid = r.left + r.width / 2;
      var off = Math.max(-1, Math.min(1, (e.clientX - mid) / (r.width * 0.7)));
      bagHit(1.4 + Math.random() * 0.9 + Math.abs(off) * 0.8, off <= 0 ? 1 : -1);
      e.preventDefault();
    });
    addEventListener('pointerup', function (e) {
      if (!bagState.dragging) return;
      bagState.dragging = false;
      var dt = performance.now() - bagState.pt;
      var vx = (e.clientX - bagState.px) / Math.max(40, dt);   /* px per ms */
      if (Math.abs(vx) > 0.25) bagState.w += Math.max(-4, Math.min(4, vx * 2.4));
    }, { passive: true });
    /* a vertical swipe that starts on the bag cancels the pointer — don't
       let the next unrelated tap inherit stale drag state */
    addEventListener('pointercancel', function () { bagState.dragging = false; }, { passive: true });

    /* if you stop moving, the gym doesn't — the bag takes a hit on its own */
    var idleAt = performance.now();
    var pokeIn = 34000 + Math.random() * 20000;
    ['pointerdown', 'pointermove', 'keydown', 'scroll'].forEach(function (ev) {
      addEventListener(ev, function () { idleAt = performance.now(); }, { passive: true });
    });
    setInterval(function () {
      if (document.hidden) return;
      if (performance.now() - idleAt < pokeIn) return;
      var r = bagArena.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      bagHit(0.55 + Math.random() * 0.5, Math.random() < 0.5 ? -1 : 1, true);
      idleAt = performance.now();
      pokeIn = 34000 + Math.random() * 20000;
    }, 4000);
  }

  function bagStep(dt) {
    if (!bagState || !bagState.active) return;
    var st = bagState, sec = Math.min(0.05, dt / 1000);
    /* pendulum with damping + a faint idle sway so it is never dead still */
    var acc = -8.2 * Math.sin(st.th) - 1.35 * st.w;
    st.w += acc * sec;
    st.th += st.w * sec + Math.sin(S.t * 0.7) * 0.00016;
    if (st.th > 1.15) { st.th = 1.15; st.w *= -0.55; }
    if (st.th < -1.15) { st.th = -1.15; st.w *= -0.55; }
    bagSwing.style.transform = 'rotate(' + (st.th * 57.2958).toFixed(2) + 'deg)';
  }

  /* ---------- 15. stats that punch in ---------- */
  function dustBurst(el) {
    for (var i = 0; i < 6; i++) {
      var d = document.createElement('span');
      d.className = 'stat-dust';
      var a = (i / 6) * 6.283 + Math.random() * 0.8;
      d.style.setProperty('--dx', (Math.cos(a) * (26 + Math.random() * 22)).toFixed(0) + 'px');
      d.style.setProperty('--dy', (Math.sin(a) * (20 + Math.random() * 18) - 8).toFixed(0) + 'px');
      d.style.left = '50%';
      d.style.top = '40%';
      el.appendChild(d);
      setTimeout(function (n) { return function () { n.remove(); }; }(d), 600);
    }
  }

  /* every CTA lands with a puff of chalk */
  document.querySelectorAll('.btn').forEach(function (b) {
    b.addEventListener('click', function () { dustBurst(b); });
  });

  /* ---------- 16. FIGHT MODE (the secret) ---------- */
  var fmBusy = false;
  function fightMode() {
    if (fmBusy) return;
    fmBusy = true;
    bell(0.55, true);
    setTimeout(function () { thump(0.5, true); }, 350);
    var fm = document.createElement('div');
    fm.id = 'fightmode';
    fm.innerHTML =
      '<div class="fm-flash"></div>' +
      '<div class="fm-tape fm-t1"><span>' + new Array(9).join('FIGHT MODE &nbsp;&#9679;&nbsp; ') + '</span></div>' +
      '<div class="fm-tape fm-t2"><span>' + new Array(9).join('OSS &nbsp;&#9679;&nbsp; ') + '</span></div>' +
      '<div class="fm-card"><h3>Fight mode <b>unlocked</b></h3>' +
      '<p>You found it. Say <b>&ldquo;OSS&rdquo;</b> at the front desk when you come for your free session &mdash; the coaches will know. \uD83D\uDC4A</p>' +
      '<a class="btn" href="classes.html">Claim the free session</a></div>';
    document.body.appendChild(fm);
    jolt();
    setTimeout(jolt, 420);
    setTimeout(function () { fm.classList.add('out'); }, 6200);
    setTimeout(function () { fm.remove(); fmBusy = false; }, 6900);
    fm.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a')) return;
      fm.classList.add('out');
      setTimeout(function () { fm.remove(); fmBusy = false; }, 600);
    });
  }
  /* trigger 1: three quick hits on the logo. The logo owns its own navigation:
     every tap is held for 650ms so a triple-tap (works on touch too) can win;
     a lone tap still goes home, just a beat later. */
  var logoEl = document.querySelector('.site-header .logo');
  if (logoEl) {
    var logoTaps = 0, logoAt = 0, logoNav = null;
    logoEl.addEventListener('click', function (e) {
      e.preventDefault();
      var now = performance.now();
      logoTaps = (now - logoAt < 900) ? logoTaps + 1 : 1;
      logoAt = now;
      if (logoNav) clearTimeout(logoNav);
      if (logoTaps >= 3) { logoTaps = 0; fightMode(); return; }
      var href = logoEl.getAttribute('href');
      logoNav = setTimeout(function () {
        if (window.__uffWipe) window.__uffWipe(href);
        else window.location.href = href;
      }, 650);
    });
  }
  /* trigger 2: type OSS */
  var kbuf = '';
  document.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (!e.key || e.key.length !== 1) return;
    kbuf = (kbuf + e.key.toLowerCase()).slice(-3);
    if (kbuf === 'oss') { kbuf = ''; fightMode(); }
  });

  /* ---------- utils ---------- */
  function debounce(fn, ms) {
    var id;
    return function () { clearTimeout(id); id = setTimeout(fn, ms); };
  }
})();
