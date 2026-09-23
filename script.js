const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const showPage = () => requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('page-ready')));
if (document.fonts?.ready) document.fonts.ready.then(showPage);
else showPage();
setTimeout(() => document.body.classList.add('page-ready'), 900);

const scrollBar = $('#scrollBar');
const navLinks = $$('.nav a');
const sections = $$('main section[id]');
const menuToggle = $('#menuToggle');
const mainNav = $('#mainNav');
const header = $('.site-header');
let scrollTicking = false;

function updateScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const pageProgress = max > 0 ? scrollY / max : 0;
  scrollBar.style.width = `${pageProgress * 100}%`;
  document.documentElement.style.setProperty('--hero-progress', Math.min(1, scrollY / Math.max(innerHeight, 1)).toFixed(3));
  header.classList.toggle('scrolled', scrollY > 60);
  let current = '';
  sections.forEach(section => {
    if (scrollY >= section.offsetTop - 160) current = section.id;
  });
  navLinks.forEach(link => link.classList.toggle('active', link.hash === `#${current}`));
  scrollTicking = false;
}
addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(updateScroll);
    scrollTicking = true;
  }
}, { passive: true });
updateScroll();

menuToggle.addEventListener('click', () => {
  const open = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', open);
});
navLinks.forEach(link => link.addEventListener('click', () => {
  mainNav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
$$('.reveal').forEach((item, index) => {
  item.style.setProperty('--reveal-delay', `${(index % 3) * 70}ms`);
  revealObserver.observe(item);
});

function replayClass(element, className, duration = 450) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  setTimeout(() => element.classList.remove(className), duration);
}
$$('button').forEach(button => button.addEventListener('click', () => replayClass(button, 'tap-pop', 400)));

const logoMap = {
  vertical: { src: 'assets/logo-vertical.svg', label: 'Versión vertical', className: 'logo-vertical' },
  horizontal: { src: 'assets/logo-horizontal.svg', label: 'Versión horizontal', className: 'logo-horizontal' },
  isotipo: { src: 'assets/isotipo.svg', label: 'Versión de isotipo', className: 'logo-isotipo' }
};
const logoPreview = $('#logoPreview');
const logoStage = $('#logoStage');
const stageLabel = $('#stageLabel');
const logoSize = $('#logoSize');
const sizeOutput = $('#sizeOutput');
let activeLogo = 'vertical';
let logoSwapTimer;

$$('[data-logo]').forEach(button => button.addEventListener('click', () => {
  $$('[data-logo]').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  activeLogo = button.dataset.logo;
  const item = logoMap[activeLogo];
  clearTimeout(logoSwapTimer);
  logoStage.classList.add('switching');
  logoSwapTimer = setTimeout(() => {
    logoPreview.src = item.src;
    logoPreview.alt = `Vista previa: ${item.label.toLowerCase()}`;
    logoPreview.classList.remove('logo-vertical', 'logo-horizontal', 'logo-isotipo');
    logoPreview.classList.add(item.className);
    stageLabel.textContent = `${item.label} · tamaño ${logoSize.value}%`;
    logoStage.classList.remove('switching');
  }, reducedMotion ? 0 : 170);
}));

logoSize.addEventListener('input', () => {
  logoPreview.style.setProperty('--logo-scale', logoSize.value / 100);
  sizeOutput.value = `${logoSize.value}%`;
  stageLabel.textContent = `${logoMap[activeLogo].label} · tamaño ${logoSize.value}%`;
});

$$('[data-bg]').forEach(button => button.addEventListener('click', () => {
  $$('[data-bg]').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  logoStage.classList.remove('bg-pink', 'bg-brown', 'bg-black');
  if (button.dataset.bg !== 'white') logoStage.classList.add(`bg-${button.dataset.bg}`);
  replayClass(logoStage, 'stage-flash', 520);
}));

const toast = $('#toast');
let toastTimer;
$$('.swatch').forEach(swatch => swatch.addEventListener('click', async () => {
  const color = swatch.dataset.color;
  try { await navigator.clipboard.writeText(color); }
  catch { const input = document.createElement('input'); input.value = color; document.body.append(input); input.select(); document.execCommand('copy'); input.remove(); }
  replayClass(swatch, 'copied', 700);
  toast.textContent = `${color} copiado`;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}));

let typeTimer;
$('#typeInput').addEventListener('input', event => {
  const value = event.target.value || 'Cada creación es una obra';
  const samples = $$('[data-type-sample]');
  samples.forEach(sample => {
    sample.textContent = value;
    sample.classList.remove('typing');
    void sample.offsetWidth;
    sample.classList.add('typing');
  });
  clearTimeout(typeTimer);
  typeTimer = setTimeout(() => samples.forEach(sample => sample.classList.remove('typing')), 360);
});

const gallery = $('#gallery');
const galleryItems = $$('.gallery-item');
const galleryPreloaders = [];
let galleryHeightAnimation;
let galleryFilterRun = 0;

const warmGalleryImages = () => galleryItems.forEach(item => {
  const image = item.querySelector('img');
  if (!image || image.complete) return;
  const preloader = new Image();
  preloader.decoding = 'async';
  preloader.src = image.currentSrc || image.src;
  galleryPreloaders.push(preloader);
});

if ('requestIdleCallback' in window) requestIdleCallback(warmGalleryImages, { timeout: 1200 });
else setTimeout(warmGalleryImages, 350);

$$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  if (button.classList.contains('active')) return;
  $$('[data-filter]').forEach(item => item.classList.remove('active'));
  button.classList.add('active');

  const filter = button.dataset.filter;
  const run = ++galleryFilterRun;
  const oldHeight = gallery.getBoundingClientRect().height;
  const firstRects = new Map();

  galleryItems.forEach(item => {
    if (!item.classList.contains('hidden')) firstRects.set(item, item.getBoundingClientRect());
    item.getAnimations?.().forEach(animation => animation.cancel());
  });
  galleryHeightAnimation?.cancel();

  galleryItems.forEach(item => {
    const matches = filter === 'all' || item.dataset.category === filter;
    item.classList.toggle('hidden', !matches);
  });

  if (reducedMotion || !gallery.animate) return;

  const newHeight = gallery.getBoundingClientRect().height;
  const visibleItems = galleryItems.filter(item => !item.classList.contains('hidden'));
  gallery.classList.add('is-filtering');

  galleryHeightAnimation = gallery.animate(
    [{ height: `${oldHeight}px` }, { height: `${newHeight}px` }],
    { duration: 440, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' }
  );
  galleryHeightAnimation.onfinish = () => {
    if (run !== galleryFilterRun) return;
    gallery.classList.remove('is-filtering');
    galleryHeightAnimation.cancel();
    galleryHeightAnimation = null;
  };

  visibleItems.forEach((item, index) => {
    const lastRect = item.getBoundingClientRect();
    const firstRect = firstRects.get(item);
    const translateX = firstRect ? firstRect.left - lastRect.left : 0;
    const translateY = firstRect ? firstRect.top - lastRect.top : 12;
    const itemAnimation = item.animate(
      [
        {
          opacity: firstRect ? .82 : 0,
          transform: `translate3d(${translateX}px,${translateY}px,0) scale(.985)`
        },
        { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' }
      ],
      {
        duration: 360,
        delay: Math.min(index * 18, 90),
        easing: 'cubic-bezier(.22,1,.36,1)',
        fill: 'both'
      }
    );
    itemAnimation.onfinish = () => itemAnimation.cancel();
  });
}));

const lightbox = $('#lightbox');
const lightboxImage = $('#lightboxImage');
const lightboxTitle = $('#lightboxTitle');
galleryItems.forEach(item => item.addEventListener('click', () => {
  lightboxImage.src = item.dataset.image;
  lightboxImage.alt = item.dataset.title;
  lightboxTitle.textContent = item.dataset.title;
  lightbox.showModal();
}));
$('#lightboxClose').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', event => {
  if (event.target === lightbox) lightbox.close();
});
