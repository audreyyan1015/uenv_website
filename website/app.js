const root = document.documentElement;
const header = document.querySelector('.site-header');
const menuButton = document.getElementById('menuButton');
const mobileMenu = document.getElementById('mobileMenu');
const copyButton = document.getElementById('copyButton');
const quickstartCode = document.getElementById('quickstartCode');

root.dataset.theme = 'light';

function closeMenu() {
  menuButton?.classList.remove('is-open');
  mobileMenu?.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
}

menuButton?.addEventListener('click', () => {
  const isOpen = mobileMenu?.classList.toggle('is-open');
  menuButton.classList.toggle('is-open', isOpen);
  menuButton.setAttribute('aria-expanded', String(Boolean(isOpen)));
});

mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
window.addEventListener('resize', () => { if (window.innerWidth > 1080) closeMenu(); });

function syncHeader() {
  header?.classList.toggle('is-scrolled', window.scrollY > 16);
}
syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

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

copyButton?.addEventListener('click', async () => {
  const code = quickstartCode?.innerText.replace(/^\$ /gm, '') ?? '';
  try {
    await navigator.clipboard.writeText(code);
    const label = copyButton.querySelector('span');
    if (label) label.textContent = '已复制';
    setTimeout(() => { if (label) label.textContent = '复制'; }, 1600);
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    if (quickstartCode && selection) {
      range.selectNodeContents(quickstartCode);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
});
