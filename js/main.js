// Ultimate Fight Fitness — shared scripts

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
