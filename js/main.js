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

// Reveal on scroll
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
