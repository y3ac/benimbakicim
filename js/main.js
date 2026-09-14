/* Benim Bakıcım — Main JavaScript */

document.addEventListener('DOMContentLoaded', () => {
  initHeroSlider();
  initMobileNav();
  initFAQ();
  initTestimonials();
  initCookieBanner();
  initForms();
  initHeaderScroll();
  initScrollReveal();
});

/* Hero Slider */
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dots button');
  const prevBtn = document.querySelector('.hero-prev');
  const nextBtn = document.querySelector('.hero-next');
  if (!slides.length) return;

  let current = 0;
  let interval;

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current]?.classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current]?.classList.add('active');
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAutoplay() {
    interval = setInterval(next, 6000);
  }

  function resetAutoplay() {
    clearInterval(interval);
    startAutoplay();
  }

  prevBtn?.addEventListener('click', () => { prev(); resetAutoplay(); });
  nextBtn?.addEventListener('click', () => { next(); resetAutoplay(); });
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); resetAutoplay(); });
  });

  startAutoplay();
}

/* Mobile Navigation */
function initMobileNav() {
  const toggle = document.querySelector('.menu-toggle');
  const close = document.querySelector('.mobile-nav-close');
  const nav = document.querySelector('.mobile-nav');
  const subTriggers = document.querySelectorAll('[data-submenu]');

  function openNav() {
    nav?.classList.add('open');
    document.body.classList.add('nav-open');
    toggle?.setAttribute('aria-expanded', 'true');
  }

  function closeNav() {
    nav?.classList.remove('open');
    document.body.classList.remove('nav-open');
    toggle?.setAttribute('aria-expanded', 'false');
  }

  toggle?.addEventListener('click', openNav);
  close?.addEventListener('click', closeNav);

  subTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const submenu = trigger.nextElementSibling;
      submenu?.classList.toggle('open');
      const open = submenu?.classList.contains('open');
      trigger.textContent = open
        ? trigger.textContent.replace('▾', '▴')
        : trigger.textContent.replace('▴', '▾');
    });
  });

  nav?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });
}

/* FAQ Accordion */
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const answer = item.querySelector('.faq-answer');
      const isOpen = item.classList.contains('open');

      document.querySelectorAll('.faq-item.open').forEach(openItem => {
        openItem.classList.remove('open');
        openItem.querySelector('.faq-answer').style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}

/* Testimonials Expand */
function initTestimonials() {
  document.querySelectorAll('.testimonial-expand').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.previousElementSibling;
      text.classList.toggle('expanded');
      btn.textContent = text.classList.contains('expanded') ? 'Daha az göster' : 'Devamını oku';
    });
  });

  const showMore = document.querySelector('.show-more-reviews');
  const hiddenReviews = document.querySelectorAll('.testimonial-hidden');
  showMore?.addEventListener('click', () => {
    hiddenReviews.forEach(r => r.style.display = 'block');
    showMore.style.display = 'none';
  });
}

/* Cookie Banner */
function initCookieBanner() {
  const banner = document.querySelector('.cookie-banner');
  if (!banner || localStorage.getItem('cookiesAccepted')) return;

  setTimeout(() => banner.classList.add('show'), 1500);

  banner.querySelector('.cookie-accept')?.addEventListener('click', () => {
    localStorage.setItem('cookiesAccepted', 'true');
    banner.classList.remove('show');
  });

  banner.querySelector('.cookie-reject')?.addEventListener('click', () => {
    banner.classList.remove('show');
  });
}

/* Form Handling — Netlify Forms */
function initForms() {
  document.querySelectorAll('.contact-form').forEach(form => {
    form.addEventListener('submit', () => {
      const btn = form.querySelector('[type="submit"]');
      if (btn) {
        btn.textContent = 'Gönderiliyor...';
        btn.disabled = true;
      }
    });
  });
}

/* Header Scroll Effect */
function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  });
}

/* Scroll Reveal */
function initScrollReveal() {
  const els = document.querySelectorAll('.section-header, .path-card, .service-card, .testimonial-card, .featured-split > *');
  els.forEach(el => el.classList.add('animate-in'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
}
