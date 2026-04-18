/*  */

'use strict';


// Utilities

/**
 * Debounce function to limit how often a function fires.
 * Used for scroll events to prevent jank.
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, delay = 100) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Sanitize user input to prevent XSS attacks.
 * Strips HTML tags and trims whitespace.
 * @param {string} input - Raw user input
 * @returns {string} Sanitized string
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Validate email format using a robust regex pattern.
 * @param {string} email - Email string to validate
 * @returns {boolean} Whether the email is valid
 */
function isValidEmail(email) {
  // RFC 5322 simplified — handles 99.9% of valid emails
  const pattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return pattern.test(email) && email.length <= 254;
}



// Dom Ready

document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initTheme();
  initNavigation();
  initMobileMenu();
  initScrollAnimations();
  initTypingEffect();
  initSkillBars();
  initBackToTop();
  initContactForm();
  initCertsCarousel();
  initFooterYear();

  // UI Enhancements
  
  initScrollProgressBar();
  initTiltEffect();
  initHeroOrbs();
});



// Loader

function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;

  // Hide loader after a brief delay for perceived performance
  // Uses requestAnimationFrame for smooth transition
  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('is-hidden');
      // Remove from DOM after transition completes
      loader.addEventListener('transitionend', () => {
        loader.remove();
      }, { once: true });
    }, 400);
  });

  // Fallback: Force hide after 3 seconds in case of slow resources
  setTimeout(() => {
    if (!loader.classList.contains('is-hidden')) {
      loader.classList.add('is-hidden');
    }
  }, 3000);
}



// Theme

function initTheme() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  const html = document.documentElement;

  // Check for saved preference, then system preference
  const savedTheme = localStorage.getItem('portfolio-theme');
  if (savedTheme) {
    html.setAttribute('data-theme', savedTheme);
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    html.setAttribute('data-theme', 'light');
  }

  toggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', next);
    localStorage.setItem('portfolio-theme', next);

    // Update meta theme-color for mobile browser chrome
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', next === 'dark' ? '#0a0a0f' : '#fafafe');
    }

    // Announce change for screen readers
    toggle.setAttribute('aria-label',
      `Switch to ${next === 'dark' ? 'light' : 'dark'} mode`
    );
  });

  // Listen to system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('portfolio-theme')) {
      html.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });
}



// Navigation

function initNavigation() {
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.navbar__link');
  const sections = document.querySelectorAll('section[id]');

  if (!navbar || !sections.length) return;

  let lastScrollY = window.scrollY;
  let ticking = false;

  /**
   * Active section tracking using Intersection Observer
   * More performant than scroll-based section detection
   */
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle('is-active',
              link.getAttribute('href') === `#${id}`
            );
          });
        }
      });
    },
    {
      // Trigger when section is 40% visible
      threshold: 0.4,
      rootMargin: '-80px 0px -40% 0px'
    }
  );

  sections.forEach(section => sectionObserver.observe(section));

  /**
   * Navbar hide/show behavior:
   * - Scrolling DOWN: hide navbar (user is reading content)
   * - Scrolling UP: show navbar (user wants to navigate)
   * - At top of page: always show
   */
  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > 100) {
      if (currentScrollY > lastScrollY && currentScrollY > 200) {
        navbar.classList.add('is-hidden');
      } else {
        navbar.classList.remove('is-hidden');
      }
    } else {
      navbar.classList.remove('is-hidden');
    }

    lastScrollY = currentScrollY;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(handleScroll);
      ticking = true;
    }
  }, { passive: true });

  // Smooth scroll with offset for fixed navbar
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const offset = navbar.offsetHeight + 20;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Update URL without triggering scroll
        history.pushState(null, null, targetId);
      }
    });
  });
}



// Mobile Menu

function initMobileMenu() {
  const toggle = document.getElementById('mobile-toggle');
  const menu = document.getElementById('mobile-menu');

  if (!toggle || !menu) return;

  const toggleMenu = () => {
    const isOpen = menu.classList.contains('is-open');

    toggle.classList.toggle('is-active');
    menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', !isOpen);
    menu.setAttribute('aria-hidden', isOpen);

    // Lock/unlock body scroll
    document.body.style.overflow = isOpen ? '' : 'hidden';
  };

  toggle.addEventListener('click', toggleMenu);

  // Close menu when a link is clicked
  menu.querySelectorAll('.mobile-menu__link, .mobile-menu__cta').forEach(link => {
    link.addEventListener('click', () => {
      if (menu.classList.contains('is-open')) {
        toggleMenu();
      }
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      toggleMenu();
    }
  });
}



// Scroll Animations
// Elements fade in as they enter the viewport.
// Much more performant than scroll event listeners.

function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll');
  if (!elements.length) return;

  // Check for reduced-motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Once visible, stop observing (one-time animation)
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }
  );

  elements.forEach(el => observer.observe(el));
}



// Typing Effect
// Shows rotating titles to highlight versatility

function initTypingEffect() {
  const element = document.getElementById('typed-text');
  if (!element) return;

  const titles = [
    'IT Student',
    'Developer',
    'Problem Solver',
    'Tech Enthusiast'
  ];

  let titleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let isPaused = false;

  // Typing speed constants
  const TYPING_SPEED = 80;
  const DELETING_SPEED = 40;
  const PAUSE_DURATION = 2000;
  const WAIT_BEFORE_DELETE = 1500;

  function type() {
    const currentTitle = titles[titleIndex];

    if (isPaused) {
      isPaused = false;
      setTimeout(type, PAUSE_DURATION);
      return;
    }

    if (!isDeleting) {
      // Typing forward
      element.textContent = currentTitle.substring(0, charIndex + 1);
      charIndex++;

      if (charIndex === currentTitle.length) {
        // Pause before deleting
        isDeleting = true;
        setTimeout(type, WAIT_BEFORE_DELETE);
        return;
      }
      setTimeout(type, TYPING_SPEED);
    } else {
      // Deleting
      element.textContent = currentTitle.substring(0, charIndex - 1);
      charIndex--;

      if (charIndex === 0) {
        isDeleting = false;
        titleIndex = (titleIndex + 1) % titles.length;
        isPaused = true;
        setTimeout(type, 300);
        return;
      }
      setTimeout(type, DELETING_SPEED);
    }
  }

  // Start typing after a brief delay
  setTimeout(type, 1000);
}



// Stat Counters
// Triggers when stats section enters viewport

function initStatCounters() {
  const statNumbers = document.querySelectorAll('.about__stat-number[data-count]');
  if (!statNumbers.length) return;

  // Check for reduced-motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    statNumbers.forEach(el => {
      el.textContent = el.getAttribute('data-count');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  statNumbers.forEach(el => observer.observe(el));

  function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-count'), 10);
    if (isNaN(target)) return;

    const duration = 2000; // 2 seconds
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);

      element.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = target.toLocaleString();
      }
    }

    requestAnimationFrame(update);
  }
}



// Skill Bars

function initSkillBars() {
  const fills = document.querySelectorAll('.skill-item__fill[data-width]');
  if (!fills.length) return;

  // Check for reduced-motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    fills.forEach(el => {
      el.style.width = el.getAttribute('data-width') + '%';
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const width = entry.target.getAttribute('data-width');
          // Validate width is a number between 0 and 100
          const numWidth = parseInt(width, 10);
          if (!isNaN(numWidth) && numWidth >= 0 && numWidth <= 100) {
            entry.target.style.width = numWidth + '%';
          }
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  fills.forEach(el => observer.observe(el));
}



// Back To Top

function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  const toggleVisibility = debounce(() => {
    btn.classList.toggle('is-visible', window.scrollY > 500);
  }, 50);

  window.addEventListener('scroll', toggleVisibility, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}



// Contact Form

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  // Rate limiting — prevent spam submissions
  let lastSubmitTime = 0;
  const RATE_LIMIT_MS = 10000; // 10 seconds between submissions

  // Field references
  const fields = {
    name: {
      input: document.getElementById('contact-name'),
      error: document.getElementById('name-error'),
      validate: (value) => {
        if (!value) return 'Name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        if (value.length > 100) return 'Name must be less than 100 characters';
        // Only allow letters, spaces, hyphens, apostrophes (including accented chars)
        if (!/^[a-zA-Z\u00C0-\u00FF\s'-]+$/.test(value)) return 'Name contains invalid characters';
        return '';
      }
    },
    email: {
      input: document.getElementById('contact-email'),
      error: document.getElementById('email-error'),
      validate: (value) => {
        if (!value) return 'Email is required';
        if (!isValidEmail(value)) return 'Please enter a valid email address';
        return '';
      }
    },
    subject: {
      input: document.getElementById('contact-subject'),
      error: document.getElementById('subject-error'),
      validate: (value) => {
        if (!value) return 'Subject is required';
        if (value.length < 3) return 'Subject must be at least 3 characters';
        if (value.length > 200) return 'Subject must be less than 200 characters';
        return '';
      }
    },
    message: {
      input: document.getElementById('contact-message'),
      error: document.getElementById('message-error'),
      validate: (value) => {
        if (!value) return 'Message is required';
        if (value.length < 10) return 'Message must be at least 10 characters';
        if (value.length > 5000) return 'Message must be less than 5000 characters';
        return '';
      }
    }
  };

  // Real-time validation on blur
  Object.values(fields).forEach(({ input, error, validate }) => {
    if (!input || !error) return;

    input.addEventListener('blur', () => {
      const msg = validate(input.value.trim());
      error.textContent = msg;
      input.classList.toggle('is-invalid', !!msg);
      input.classList.toggle('is-valid', !msg && input.value.trim() !== '');
    });

    // Clear error on input
    input.addEventListener('input', () => {
      if (input.classList.contains('is-invalid')) {
        error.textContent = '';
        input.classList.remove('is-invalid');
      }
    });
  });

  // Form submission handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const statusEl = document.getElementById('form-status');
    const submitBtn = document.getElementById('contact-submit');
// Security: Honeypot check
    const honeypot = document.getElementById('contact-honeypot');
    if (honeypot && honeypot.value) {
      // Bot detected — silently reject
      console.warn('Bot submission detected');
      showStatus(statusEl, 'success', 'Message sent successfully!');
      return;
    }
// Security: Rate limiting
    const now = Date.now();
    if (now - lastSubmitTime < RATE_LIMIT_MS) {
      const waitSeconds = Math.ceil((RATE_LIMIT_MS - (now - lastSubmitTime)) / 1000);
      showStatus(statusEl, 'error', `Please wait ${waitSeconds} seconds before sending another message.`);
      return;
    }
// Validate all fields
    let hasErrors = false;

    Object.values(fields).forEach(({ input, error, validate }) => {
      if (!input || !error) return;
      const msg = validate(input.value.trim());
      error.textContent = msg;
      input.classList.toggle('is-invalid', !!msg);
      input.classList.toggle('is-valid', !msg);
      if (msg) hasErrors = true;
    });

    if (hasErrors) {
      // Focus first invalid field for accessibility
      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }
// Collect sanitized data
    const formData = {
      name: sanitizeInput(fields.name.input.value),
      email: sanitizeInput(fields.email.input.value),
      subject: sanitizeInput(fields.subject.input.value),
      message: sanitizeInput(fields.message.input.value),
      timestamp: new Date().toISOString()
    };
// Submit via Gmail Compose
    // Opens Gmail in a new tab with all form data pre-filled.
    // This way the message goes directly to your inbox — no backend needed.
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="spinning" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path></svg>
      <span>Opening Gmail...</span>
    `;

    // Build the Gmail compose URL with pre-filled fields
    const gmailUrl = `https://mail.google.com/mail/?view=cm`
      + `&to=${encodeURIComponent('abug.ezekielsimoun.ariola@gmail.com')}`
      + `&su=${encodeURIComponent(formData.subject)}`
      + `&body=${encodeURIComponent(`Hi Ezekiel,\n\n${formData.message}\n\n--- Sent from your portfolio ---\nName: ${formData.name}\nEmail: ${formData.email}`)}`;

    // Brief delay for UX feedback, then open Gmail
    setTimeout(() => {
      window.open(gmailUrl, '_blank');

      // Success
      showStatus(statusEl, 'success',
        'Gmail opened! Complete sending the message from there.'
      );

      // Reset form
      form.reset();
      Object.values(fields).forEach(({ input }) => {
        if (input) {
          input.classList.remove('is-valid', 'is-invalid');
        }
      });

      // Reset button
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        <span>Send Message</span>
      `;

      lastSubmitTime = Date.now();

      // Auto-hide status after 8 seconds
      setTimeout(() => {
        statusEl.className = 'form__status';
        statusEl.textContent = '';
      }, 8000);
    }, 800);
  });

  /**
   * Show form status message
   * @param {HTMLElement} el - Status element
   * @param {'success'|'error'} type - Message type
   * @param {string} message - Message text
   */
  function showStatus(el, type, message) {
    if (!el) return;
    el.className = `form__status is-${type}`;
    el.textContent = message;
  }
}



// Certifications Carousel

function initCertsCarousel() {
  const track = document.getElementById('certs-track');
  const prevBtn = document.getElementById('certs-prev');
  const nextBtn = document.getElementById('certs-next');
  const dotsContainer = document.getElementById('certs-dots');
  const carousel = document.getElementById('certs-carousel');

  if (!track || !prevBtn || !nextBtn || !dotsContainer || !carousel) return;

  const cards = track.querySelectorAll('.cert-card');
  const totalSlides = cards.length;
  let currentIndex = 0;

  // Build dot indicators
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('button');
    dot.className = 'certs__dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to certificate ${i + 1}`);
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
  }

  const dots = dotsContainer.querySelectorAll('.certs__dot');

  function getSlideOffset(index) {
    // Measure actual card width + gap for pixel-perfect sliding
    if (!cards.length) return 0;
    const cardWidth = cards[0].offsetWidth;
    const trackStyle = getComputedStyle(track);
    const gap = parseFloat(trackStyle.gap) || 0;
    return index * (cardWidth + gap);
  }

  function goToSlide(index) {
    if (index < 0 || index >= totalSlides) return;
    currentIndex = index;

    // Pixel-based slide for precise alignment
    const offset = getSlideOffset(currentIndex);
    track.style.transform = `translateX(-${offset}px)`;

    // Update dots
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === currentIndex);
      dot.setAttribute('aria-selected', i === currentIndex ? 'true' : 'false');
    });

    // Update arrow states — disable at boundaries
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === totalSlides - 1;
  }

  // Recalculate on resize so the slide stays aligned
  window.addEventListener('resize', debounce(() => {
    const offset = getSlideOffset(currentIndex);
    track.style.transition = 'none';
    track.style.transform = `translateX(-${offset}px)`;
    // Re-enable transition after reflow
    requestAnimationFrame(() => {
      track.style.transition = '';
    });
  }, 150));

  // Arrow click handlers
  prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
  nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

  // Keyboard navigation when carousel is focused or hovered
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToSlide(currentIndex - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToSlide(currentIndex + 1);
    }
  });

  // Make carousel focusable for keyboard nav
  carousel.setAttribute('tabindex', '0');
  carousel.setAttribute('role', 'region');
  carousel.setAttribute('aria-label', 'Certifications carousel');

  // Touch / swipe support
  let touchStartX = 0;
  let touchEndX = 0;
  const SWIPE_THRESHOLD = 50;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) {
        // Swiped left — go next
        goToSlide(currentIndex + 1);
      } else {
        // Swiped right — go prev
        goToSlide(currentIndex - 1);
      }
    }
  }, { passive: true });
}



// Footer Year

function initFooterYear() {
  const yearEl = document.getElementById('footer-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}



// CSS ANIMATION for spinning loader (inline style)

const style = document.createElement('style');
style.textContent = `
  @keyframes spinning {
    to { transform: rotate(360deg); }
  }
  .spinning {
    animation: spinning 1s linear infinite;
  }
`;
document.head.appendChild(style);

// ==========================================
// UI / UX Enhancements
// ==========================================

// Scroll Progress Bar
function initScrollProgressBar() {
  const progressBar = document.getElementById('scroll-progress');
  if (!progressBar) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercent = scrollTop / docHeight;
        
        progressBar.style.transform = `scaleX(${scrollPercent})`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// 3D Tilt Effect
function initTiltEffect() {
  const tiltElements = document.querySelectorAll('.project-card, .cert-card');
  if (!tiltElements.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(pointer: fine)').matches) return;

  const MAX_TILT = 8; 

  tiltElements.forEach(el => {
    el.addEventListener('mouseenter', () => el.style.transition = 'none');
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left; 
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const tiltX = ((y - centerY) / centerY) * -MAX_TILT;
      const tiltY = ((x - centerX) / centerX) * MAX_TILT;

      el.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
  });
}

// Mouse-tracking Hero Orbs
function initHeroOrbs() {
  const heroSection = document.getElementById('hero');
  const orbs = document.querySelectorAll('.hero__orb');
  if (!heroSection || !orbs.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(pointer: fine)').matches) return;

  let mouseX = 0;
  let mouseY = 0;
  let currentOrbs = Array.from(orbs).map(() => ({ x: 0, y: 0 }));
  
  heroSection.addEventListener('mousemove', (e) => {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
  });

  const render = () => {
    const targetOffsetX = (mouseX - 0.5) * 50; 
    const targetOffsetY = (mouseY - 0.5) * 50;
    
    // Lerp logic for pure fluidity
    if(orbs[0]) {
      currentOrbs[0].x += (targetOffsetX - currentOrbs[0].x) * 0.05;
      currentOrbs[0].y += (targetOffsetY - currentOrbs[0].y) * 0.05;
      orbs[0].style.transform = `translate(${currentOrbs[0].x}px, ${currentOrbs[0].y}px)`;
    }
    if(orbs[1]) {
      currentOrbs[1].x += (-targetOffsetX * 1.5 - currentOrbs[1].x) * 0.05;
      currentOrbs[1].y += (-targetOffsetY * 1.5 - currentOrbs[1].y) * 0.05;
      orbs[1].style.transform = `translate(${currentOrbs[1].x}px, ${currentOrbs[1].y}px)`;
    }
    if(orbs[2]) {
      currentOrbs[2].x += (targetOffsetX * 0.8 - currentOrbs[2].x) * 0.05;
      currentOrbs[2].y += (-targetOffsetY * 0.8 - currentOrbs[2].y) * 0.05;
      orbs[2].style.transform = `translate(${currentOrbs[2].x}px, ${currentOrbs[2].y}px)`;
    }
    
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);
}
