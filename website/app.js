const root = document.documentElement;
const header = document.querySelector('.site-header');
const menuButton = document.getElementById('menuButton');
const mobileMenu = document.getElementById('mobileMenu');

root.dataset.theme = 'light';
mobileMenu?.setAttribute('aria-hidden', 'true');

function closeMenu() {
  menuButton?.classList.remove('is-open');
  mobileMenu?.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  mobileMenu?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('menu-open');
}

menuButton?.addEventListener('click', () => {
  const isOpen = mobileMenu?.classList.toggle('is-open');
  menuButton.classList.toggle('is-open', isOpen);
  menuButton.setAttribute('aria-expanded', String(Boolean(isOpen)));
  mobileMenu?.setAttribute('aria-hidden', String(!isOpen));
  document.body.classList.toggle('menu-open', Boolean(isOpen));
  if (isOpen) mobileMenu?.querySelector('a')?.focus();
});

mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
window.addEventListener('resize', () => { if (window.innerWidth > 1080) closeMenu(); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mobileMenu?.classList.contains('is-open')) {
    closeMenu();
    menuButton?.focus();
  }
});

function syncHeader() {
  header?.classList.toggle('is-scrolled', window.scrollY > 16);
}
syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px' },
  );
  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
}
