/**
 * Alexander Biglane Portfolio Website
 * Project-agnostic JavaScript
 * Refactor date: 2025-07-23
 * Goal: Maintain ALL existing functionality, only changing how we detect pages & handle smooth scroll.
 */

// ───────────────────────────────────────────────────────────────────────────────
// 0. GLOBAL FLAGS / UTILITIES
// ───────────────────────────────────────────────────────────────────────────────

let isAutoScrolling = false; // Pause scroll-driven anims during programmatic scrolls
const IS_HOME = !!document.getElementById('selected-work-title'); // Feature-detect home page

// Linear interpolation helper
function interpolate(startValue, endValue, progress) {
  return startValue + (endValue - startValue) * progress;
}

// Debounce
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Smooth scroll utility (kept exactly as before, except now called from more places)
function smoothScrollTo(targetElement, duration = 800) {
  isAutoScrolling = true;

  const navOffset = 160; // adjust if your header height changes
  const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navOffset;
  const startPosition = window.scrollY;
  const distance = targetPosition - startPosition;
  let startTime = null;

  const easeInOutCubic = (t, b, c, d) => {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t * t + b;
    t -= 2;
    return (c / 2) * (t * t * t + 2) + b;
  };

  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = easeInOutCubic(timeElapsed, startPosition, distance, duration);
    window.scrollTo(0, run);
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  }

  requestAnimationFrame(animation);

  setTimeout(() => {
    isAutoScrolling = false;
    SectionAnimator.refresh();
    ProjectThumbnails.refreshThumbnails();
    ProjectThumbnails.updateThumbnailsOnScroll();
  }, duration + 50);
}

// Global state container (unchanged)
const STATE = {
  layout: {
    current: window.innerWidth <= 768 ? 'mobile' : 'desktop',
    resizeTimeout: null,
  },
  animations: {
    thumbnailPositions: new Map(),
    thumbnails: [],
    bannerHeightLocked: false,
    bannerPosition: null,
  },
  darkMode: {
    active: false,
    transitioning: false,
  },
};

// ───────────────────────────────────────────────────────────────────────────────
// 1. THEME MANAGEMENT
// ───────────────────────────────────────────────────────────────────────────────
const ThemeManager = (function () {
  let darkModeIconElement = null;

  function applyInitialThemeAndIcon() {
    darkModeIconElement = document.querySelector('.darkMode-icon');
    if (!darkModeIconElement) {
      console.warn('Dark mode icon not found for initial setup.');
      return;
    }

    const savedDarkMode = localStorage.getItem('darkMode');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedDarkMode === 'enabled' || (savedDarkMode === null && prefersDarkMode)) {
      document.body.classList.add('dark-mode');
      document.documentElement.classList.add('dark-mode');
      STATE.darkMode.active = true;
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.classList.remove('dark-mode');
      STATE.darkMode.active = false;
    }

    // Initial banner swap only on home
    const bannerImg = document.querySelector('.bannerImage');
    if (bannerImg && IS_HOME) {
      bannerImg.src = STATE.darkMode.active
        ? 'assets/images/darkmodeBanner_dsg.jpg'
        : 'assets/images/lightmodeBanner.jpg';
    }

    // Icon state
    if (STATE.darkMode.active) {
      darkModeIconElement.classList.add('is-moon');
      darkModeIconElement.setAttribute('aria-label', 'Activate light mode');
    } else {
      darkModeIconElement.classList.remove('is-moon');
      darkModeIconElement.setAttribute('aria-label', 'Activate dark mode');
    }
  }

  function setupEventListeners() {
    if (!darkModeIconElement) darkModeIconElement = document.querySelector('.darkMode-icon');
    if (!darkModeIconElement) {
      console.warn('Dark mode icon not found for event listener setup.');
      return;
    }

    darkModeIconElement.removeEventListener('click', toggleThemeAndIconState);
    darkModeIconElement.addEventListener('click', toggleThemeAndIconState);

    // Keyboard accessibility (can remove if undesired)
    darkModeIconElement.removeEventListener('keydown', handleIconKeydown);
    darkModeIconElement.addEventListener('keydown', handleIconKeydown);
  }

  function handleIconKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleThemeAndIconState();
    }
  }

  function toggleThemeAndIconState() {
    if (STATE.darkMode.transitioning) return;
    STATE.darkMode.transitioning = true;

    const isCurrentlyDark = document.body.classList.contains('dark-mode');

    if (isCurrentlyDark) {
      document.body.classList.add('light-mode-transition');
      document.body.classList.remove('dark-mode');
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'disabled');
      STATE.darkMode.active = false;
    } else {
      document.body.classList.add('dark-mode-transition');
      document.body.classList.add('dark-mode');
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'enabled');
      STATE.darkMode.active = true;
    }

    // Swap banner only on home
    const bannerImg = document.querySelector('.bannerImage');
    if (bannerImg && IS_HOME) {
      bannerImg.src = STATE.darkMode.active
        ? 'assets/images/darkmodeBanner_dsg.jpg'
        : 'assets/images/lightmodeBanner.jpg';
    }

    if (STATE.darkMode.active) {
      darkModeIconElement.classList.add('is-moon');
      darkModeIconElement.setAttribute('aria-label', 'Activate light mode');
    } else {
      darkModeIconElement.classList.remove('is-moon');
      darkModeIconElement.setAttribute('aria-label', 'Activate dark mode');
    }

    LottieLogoManager.onThemeChange();

    setTimeout(() => {
      document.body.classList.remove('light-mode-transition');
      document.body.classList.remove('dark-mode-transition');
      STATE.darkMode.transitioning = false;
    }, 300);
  }

  return { applyInitialThemeAndIcon, setupEventListeners };
})();

// ───────────────────────────────────────────────────────────────────────────────
// 2. TEXT ANIMATIONS
// ───────────────────────────────────────────────────────────────────────────────
const TextAnimator = (function () {
  function initialize() {
    animateIntroText();
  }

  function animateIntroText() {
    const introText = document.querySelector('.introText');
    if (!introText) return;

    const spans = Array.from(introText.querySelectorAll('span'));
    spans.forEach((span) => {
      span.style.display = 'inline-block';
      span.classList.add('hidden-init');
    });

    introText.offsetHeight; // force reflow

    const rows = [];
    let currentTop = -Infinity;
    let currentRow = null;

    spans.forEach((span) => {
      const top = span.offsetTop;
      if (Math.abs(top - currentTop) > 5) {
        currentTop = top;
        currentRow = { top, spans: [] };
        rows.push(currentRow);
      }
      currentRow && currentRow.spans.push(span);
    });

    rows.sort((a, b) => a.top - b.top);

    const movementDuration = 700;
    const opacityDuration = 500;
    const staggerDelay = 50;

    rows.forEach((row, rowIndex) => {
      row.spans.forEach((span) => {
        span.animate(
          [{ opacity: 0 }, { opacity: 1 }],
          {
            duration: opacityDuration,
            delay: rowIndex * staggerDelay,
            fill: 'forwards',
            easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
          }
        );
        span.animate(
          [{ transform: 'translateY(80px)' }, { transform: 'translateY(0)' }],
          {
            duration: movementDuration,
            delay: rowIndex * staggerDelay,
            fill: 'forwards',
            easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
          }
        );
      });
    });

    // Optional sub-header animation (kept from your code)
    const subHeader = document.querySelector('.sub-header-text');
    if (subHeader) {
      subHeader.animate(
        [
          { opacity: 0, transform: 'translateY(20px)' },
          { opacity: 0.8, transform: 'translateY(0)' },
        ],
        {
          duration: 800,
          delay: 300,
          fill: 'forwards',
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        }
      );
    }
  }

  return { initialize };
})();

// ───────────────────────────────────────────────────────────────────────────────
// 3. BANNER MANAGEMENT
// ───────────────────────────────────────────────────────────────────────────────
const BannerManager = (function () {
  function initialize() {
    const bannerImg = document.querySelector('.bannerImage');
    if (bannerImg) {
      requestAnimationFrame(() => bannerImg.classList.remove('start-hidden'));
    }

    storeBannerPosition();

    window.addEventListener('resize', () => {
      STATE.animations.bannerPosition = null;
    });

    // fade/scale scroll ONLY on home
    if (IS_HOME) {
      window.addEventListener('scroll', () => {
        requestAnimationFrame(updateBannerOnScroll);
      });
    }
  }

  function storeBannerPosition() {
    const banner = document.querySelector('.component-banner');
    if (!banner) return;
    const rect = banner.getBoundingClientRect();
    STATE.animations.bannerPosition = {
      top: rect.top + window.scrollY,
      height: rect.height,
    };
  }

  function updateBannerOnScroll() {
    const bannerContainer = document.querySelector('.component-banner');
    if (!bannerContainer) return;

    const scrollTop = window.scrollY;
    let pos = STATE.animations.bannerPosition;
    if (!pos) {
      storeBannerPosition();
      pos = STATE.animations.bannerPosition;
      if (!pos) return;
    }

    const distanceFromTop = pos.top - scrollTop;
    const effectRange = window.innerWidth > 768 ? 450 : 300;

    if (distanceFromTop < 0) {
      const scrolledDistance = Math.abs(distanceFromTop);
      const progress = Math.min(scrolledDistance / effectRange, 1);
      const currentOpacity = interpolate(1, 0, progress);
      const currentScale = interpolate(1, 0.9, progress);

      bannerContainer.style.opacity = String(currentOpacity);
      bannerContainer.style.transform = `scale(${currentScale})`;
    } else {
      bannerContainer.style.opacity = '1';
      bannerContainer.style.transform = 'scale(1)';
    }
  }

  return { initialize, updateBannerOnScroll };
})();

// ───────────────────────────────────────────────────────────────────────────────
// 4. PILL ANIMATIONS
// ───────────────────────────────────────────────────────────────────────────────
const PillAnimator = (function () {
  function initialize() {
    const pillSection = document.querySelector('.component-pills');
    if (!pillSection) return;

    const pillObserver = new IntersectionObserver(
      (entries, observer) => {
        if (isAutoScrolling) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            observer.unobserve(entry.target);
            const pills = entry.target.querySelectorAll('.pill.hidden-init');
            animatePills(pills);
          }
        });
      },
      { threshold: 0.6 }
    );

    pillObserver.observe(pillSection);
  }

  function animatePills(pills) {
    pills.forEach((pill, index) => {
      const animation = pill.animate(
        [
          { opacity: 0, transform: 'translateY(80px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        {
          duration: 700,
          delay: index * 100,
          fill: 'forwards',
          easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
        }
      );
      animation.onfinish = () => pill.classList.remove('hidden-init');
    });
  }

  return { initialize };
})();

// ───────────────────────────────────────────────────────────────────────────────
// 5. PROJECT THUMBNAILS
// ───────────────────────────────────────────────────────────────────────────────
const ProjectThumbnails = (function () {
  function initialize() {
    STATE.animations.thumbnails = Array.from(document.querySelectorAll('.projectThumbnail'));
    if (STATE.animations.thumbnails.length === 0) return;

    STATE.animations.thumbnails.forEach(initializeThumbnail);

    window.addEventListener('scroll', () => {
      requestAnimationFrame(updateThumbnailsOnScroll);
    });

    setTimeout(updateThumbnailsOnScroll, 1500);
  }

  function initializeThumbnail(thumbnail, index) {
    thumbnail.setAttribute('data-index', index);

    const observer = new IntersectionObserver(
      (entries, obs) => {
        if (isAutoScrolling) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fadeIn-visible');
            setTimeout(() => storePosition(entry.target), 500);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(thumbnail);
  }

  function storePosition(thumbnail) {
    const rect = thumbnail.getBoundingClientRect();
    STATE.animations.thumbnailPositions.set(thumbnail, {
      top: rect.top + window.scrollY,
      height: rect.height,
    });
  }

  function updateThumbnailsOnScroll() {
    if (isAutoScrolling) return;

    const scrollTop = window.scrollY;
    const viewportBottom = scrollTop + window.innerHeight;
    const effectRange = 300;
    const startEffectOffset = 50;

    STATE.animations.thumbnails.forEach((thumbnail) => {
      thumbnail.style.opacity = '';
      thumbnail.style.transform = '';
      if (!thumbnail.classList.contains('fadeIn-visible')) return;

      let pos = STATE.animations.thumbnailPositions.get(thumbnail);
      if (!pos) {
        storePosition(thumbnail);
        pos = STATE.animations.thumbnailPositions.get(thumbnail);
        if (!pos) return;
      }

      if (pos.top < viewportBottom && pos.top + pos.height > scrollTop) {
        const distanceFromTop = pos.top - scrollTop;
        if (distanceFromTop < 0) {
          const past = Math.min(Math.max(Math.abs(distanceFromTop) - startEffectOffset, 0), effectRange);
          const progress = past / effectRange;
          const currentOpacity = interpolate(1, 0.8, progress);
          const currentScale = interpolate(1, 0.9, progress);
          thumbnail.style.opacity = String(currentOpacity);
          thumbnail.style.transform = `scale(${currentScale})`;
        }
      }
    });
  }

  function refreshThumbnails() {
    STATE.animations.thumbnails.forEach((thumbnail) => {
      if (thumbnail.classList.contains('fadeIn-visible')) return;
      const rect = thumbnail.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (inView) {
        thumbnail.classList.add('fadeIn-visible');
        storePosition(thumbnail);
      }
    });
  }

  return { initialize, updateThumbnailsOnScroll, refreshThumbnails };
})();

// ───────────────────────────────────────────────────────────────────────────────
// 6. SECTION ANIMATOR
// ───────────────────────────────────────────────────────────────────────────────
const SectionAnimator = (function () {
  let observer;
  let sections;
  const THRESHOLD = 0.3;

  function initialize() {
    const selectors = [
      '.component-description',
      '.component-sectionTitle',
      '.component-textSection',
      '.component-experience',
      '.component-cta',
      '.component-featureImage',
    ];
    sections = Array.from(document.querySelectorAll(selectors.join(', ')));

    sections.forEach((section) => {
      if (!section.classList.contains('component-pills') && !section.classList.contains('component-experience')) {
        section.classList.add('hidden-init');
      }
    });

    observer = new IntersectionObserver(onIntersect, { threshold: THRESHOLD });
    sections.forEach((section) => observer.observe(section));
  }

  function onIntersect(entries, obs) {
    if (isAutoScrolling) return;
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        triggerAnimation(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }

  function triggerAnimation(section) {
    if (section.classList.contains('component-description')) {
      animateDescriptionSection(section);
    } else if (section.classList.contains('component-experience')) {
      animateExperienceSection(section);
    } else if (section.classList.contains('component-textSection')) {
      animateTextSection(section);
    } else {
      animateGenericSection(section);
    }
  }

  function animateGenericSection(section) {
    section.animate([
      { opacity: 0, transform: 'translateY(80px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], {
      duration: 700,
      fill: 'forwards',
      easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    });
    section.classList.remove('hidden-init');
  }

  function animateDescriptionSection(section) {
    animateGenericSection(section);

    const lineSeparator = section.querySelector('.lineSeparator');
    if (lineSeparator) {
      lineSeparator.animate([
        { opacity: 0, transform: 'translateY(40px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], {
        duration: 700,
        delay: 100,
        fill: 'forwards',
        easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      });
    }

    const paragraphs = section.querySelectorAll('.paragraph-section');
    paragraphs.forEach((paragraph, index) => {
      paragraph.animate([
        { opacity: 0, transform: 'translateY(40px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], {
        duration: 700,
        delay: 200 + index * 150,
        fill: 'forwards',
        easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      });
    });
  }

  function animateTextSection(section) {
    animateGenericSection(section);
    const container = section.querySelector('.rightColumnContainer');
    if (!container) return;
    Array.from(container.children).forEach((el, index) => {
      el.animate([
        { opacity: 0, transform: 'translateY(40px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], {
        duration: 700,
        delay: 200 + index * 150,
        fill: 'forwards',
        easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      });
    });
  }

  function animateExperienceSection(section) {
    animateGenericSection(section);

    const experienceTitle = section.querySelector('.experienceTitleText');
    if (experienceTitle) {
      experienceTitle.style.transform = 'translateY(20px)';
      experienceTitle.offsetHeight;
      experienceTitle.animate([
        { opacity: 0, transform: experienceTitle.style.transform },
        { opacity: 1, transform: 'translateY(0)' },
      ], {
        duration: 600,
        delay: 100,
        fill: 'forwards',
        easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      });
    }

    const experienceItems = section.querySelectorAll('.experienceItem');
    experienceItems.forEach((item, index) => {
      item.style.transform = 'translateY(80px)';
      item.offsetHeight;
      item.animate([
        { opacity: 0, transform: item.style.transform },
        { opacity: 1, transform: 'translateY(0)' },
      ], {
        duration: 700,
        delay: 200 + index * 150 + (experienceTitle ? 100 : 0),
        fill: 'forwards',
        easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      });
    });
  }

  function refresh() {
    sections.forEach((section) => {
      if (!section.classList.contains('hidden-init')) return;
      const rect = section.getBoundingClientRect();
      const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
      if (inViewport) {
        triggerAnimation(section);
        observer.unobserve(section);
      }
    });
  }

  return { initialize, refresh };
})();

// ───────────────────────────────────────────────────────────────────────────────
// 7. EXPERIENCE ACCORDION
// ───────────────────────────────────────────────────────────────────────────────
const ExperienceManager = (function () {
  function initialize() {
    const experienceItems = document.querySelectorAll('.experienceItem');
    experienceItems.forEach((item) => {
      const container = item.querySelector('.experienceItem-container');
      const bodyText = item.querySelector('.experienceItem-bodyText');
      if (!container || !bodyText) return;

      container.setAttribute('aria-expanded', 'false');
      bodyText.setAttribute('aria-hidden', 'true');
      if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '0');

      container.addEventListener('click', toggleExperienceItem);
      container.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleExperienceItem.call(container, event);
        }
      });
    });
  }

  function toggleExperienceItem() {
    const experienceItem = this.closest('.experienceItem');
    if (!experienceItem) return;

    const bodyText = experienceItem.querySelector('.experienceItem-bodyText');
    if (!bodyText) return;

    const isExpanded = this.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
      this.setAttribute('aria-expanded', 'false');
      bodyText.setAttribute('aria-hidden', 'true');
      experienceItem.classList.remove('is-expanded');
      bodyText.style.maxHeight = '0';
    } else {
      this.setAttribute('aria-expanded', 'true');
      bodyText.setAttribute('aria-hidden', 'false');
      experienceItem.classList.add('is-expanded');
      requestAnimationFrame(() => {
        const paddingBuffer = 32;
        bodyText.style.maxHeight = `${bodyText.scrollHeight + paddingBuffer}px`;
      });
    }
  }

  return { initialize };
})();

// ───────────────────────────────────────────────────────────────────────────────
// 8. RESPONSIVE LAYOUT MANAGEMENT
// ───────────────────────────────────────────────────────────────────────────────
const LayoutManager = (function () {
  function initialize() {
    const mobileBreakpoint = window.matchMedia('(max-width: 768px)');
    mobileBreakpoint.addEventListener('change', handleMediaQueryChange);
    window.addEventListener('resize', debounce(handleResize, 250));

    handleResize();
    window.scrollTo(0, 0);
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  }

  function handleMediaQueryChange(event) {
    const newLayout = event.matches ? 'mobile' : 'desktop';
    if (newLayout !== STATE.layout.current) {
      STATE.layout.current = newLayout;
      ProjectThumbnails.refreshThumbnails();
      if (newLayout === 'desktop') STATE.animations.bannerHeightLocked = false;
    }
  }

  function handleResize() {
    const newLayout = window.innerWidth <= 768 ? 'mobile' : 'desktop';
    if (newLayout !== STATE.layout.current) {
      STATE.layout.current = newLayout;
      ProjectThumbnails.refreshThumbnails();
      if (newLayout === 'desktop') STATE.animations.bannerHeightLocked = false;
    }

    STATE.animations.thumbnailPositions.clear();
    STATE.animations.thumbnails.forEach((thumb) => {
      if (thumb.classList.contains('fadeIn-visible')) {
        const rect = thumb.getBoundingClientRect();
        STATE.animations.thumbnailPositions.set(thumb, {
          top: rect.top + window.scrollY,
          height: rect.height,
        });
      }
    });
  }

  return { initialize };
})();

// ───────────────────────────────────────────────────────────────────────────────
// 9. MOBILE MENU MANAGEMENT
// ───────────────────────────────────────────────────────────────────────────────
const MobileMenuManager = (function () {
  let hamburgerIcon = null;
  let mobileMenuOverlay = null;
  let mobileMenuLinks = null;
  let previouslyFocusedElement = null;
  let navMobileElement = null;

  function initialize() {
    hamburgerIcon = document.getElementById('hamburgerIcon');
    mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    navMobileElement = document.querySelector('.navMobile');

    if (!hamburgerIcon || !mobileMenuOverlay || !navMobileElement) {
      console.warn('Mobile menu critical elements not found.');
      return;
    }

    mobileMenuLinks = mobileMenuOverlay.querySelectorAll('.mobile-menu-nav a');

    hamburgerIcon.addEventListener('click', toggleMobileMenu);
    hamburgerIcon.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleMobileMenu();
      }
    });

    mobileMenuLinks.forEach((link) => {
      link.addEventListener('click', handleLinkClick);
    });

    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('keydown', handleFocusTrap);
  }

  function openMobileMenu() {
    if (!mobileMenuOverlay || !hamburgerIcon || !navMobileElement) return;
    if (mobileMenuOverlay.classList.contains('active')) return;

    previouslyFocusedElement = document.activeElement;

    mobileMenuOverlay.classList.add('active');
    mobileMenuOverlay.setAttribute('aria-hidden', 'false');

    hamburgerIcon.classList.add('is-active');
    hamburgerIcon.setAttribute('aria-expanded', 'true');
    hamburgerIcon.setAttribute('aria-label', 'Close navigation menu');

    navMobileElement.classList.add('nav-on-top');
    document.body.classList.add('mobile-menu-active');

    const firstFocusable = mobileMenuOverlay.querySelector('a');
    setTimeout(() => {
      if (firstFocusable) firstFocusable.focus();
      else hamburgerIcon.focus();
    }, 100);
  }

  function closeMobileMenu() {
    if (!mobileMenuOverlay || !hamburgerIcon || !navMobileElement) return;
    if (!mobileMenuOverlay.classList.contains('active')) return;

    mobileMenuOverlay.classList.remove('active');
    mobileMenuOverlay.setAttribute('aria-hidden', 'true');

    hamburgerIcon.classList.remove('is-active');
    hamburgerIcon.setAttribute('aria-expanded', 'false');
    hamburgerIcon.setAttribute('aria-label', 'Open navigation menu');

    document.body.classList.remove('mobile-menu-active');

    setTimeout(() => {
      navMobileElement && navMobileElement.classList.remove('nav-on-top');
    }, 400);

    if (previouslyFocusedElement) previouslyFocusedElement.focus();
  }

  function toggleMobileMenu() {
    if (mobileMenuOverlay.classList.contains('active')) closeMobileMenu();
    else openMobileMenu();
  }

  function handleLinkClick(event) {
    const link = event.currentTarget;
    const href = link.getAttribute('href') || '';

    // Cross-page with hash → store hash to smooth scroll after load
    if (href.includes('.html#')) {
      const hash = href.split('#')[1];
      if (hash) sessionStorage.setItem('targetHash', hash);
      closeMobileMenu();
      return; // let browser navigate normally
    }

    // Same-page hash
    if (href.startsWith('#')) {
      event.preventDefault();
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId) || document.querySelector(`[name="${targetId}"]`);
      closeMobileMenu();
      if (targetElement) {
        setTimeout(() => smoothScrollTo(targetElement), 400);
        isAutoScrolling = true;
      }
      return;
    }

    // Other links (downloads, external, etc.)
    closeMobileMenu();
  }

  function handleEscapeKey(event) {
    if (event.key === 'Escape' && mobileMenuOverlay.classList.contains('active')) {
      closeMobileMenu();
    }
  }

  function handleFocusTrap(e) {
    if (!mobileMenuOverlay || !hamburgerIcon || !mobileMenuOverlay.classList.contains('active')) return;

    const focusableInOverlay = Array.from(
      mobileMenuOverlay.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
    });

    const allFocusable = [hamburgerIcon, ...focusableInOverlay].filter(Boolean);
    if (allFocusable.length === 0) return;
    if (allFocusable.length === 1 && document.activeElement === hamburgerIcon) {
      e.preventDefault();
      return;
    }

    const firstElement = allFocusable[0];
    const lastElement = allFocusable[allFocusable.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  }

  return { initialize };
})();

// ───────────────────────────────────────────────────────────────────────────────
// 10. CUSTOM CURSOR
// ───────────────────────────────────────────────────────────────────────────────
const CustomCursorManager = (function () {
  let customCursorElement = null;
  let activeTextHoverCount = 0;

  const largeTextSelectors = `
    .introText span,
    .sectionTitleText,
    .quoteText,
    .footerCTAText
  `;

  const smallTextSelectors = `
    .descriptionText-1,
    .descriptionText-1 p,
    .descriptionText-1 div[class*="paragraph-section"],
    .pillText,
    .pillText span,
    .projectTitle,
    .projectSubTitle,
    .sectionBodyText,
    .sectionBodyText p,
    .experienceTitleText,
    .experienceItem-company,
    .experienceItem-job,
    .experienceItem-bodyText p,
    .experienceItem-bodyTextContent,
    .downloadText,
    .imageDescription .descriptionText,
    .footerEmailText,
    .footerLinkText,
    .footerDisclaimerText,
    .vertical-text,
    .vertical-text *
    .project-detail-title,
    .project-detail-value
  `;

  let distinctLargeTextElements = null;

  function initialize() {
    customCursorElement = document.getElementById('custom-cursor');
    if (!customCursorElement) {
      console.error('[CustomCursorManager] #custom-cursor not found.');
      return;
    }

    try {
      distinctLargeTextElements = new Set(document.querySelectorAll(largeTextSelectors));
    } catch (e) {
      console.error('[CustomCursorManager] Error querying largeTextSelectors:', e);
      distinctLargeTextElements = new Set();
    }

    const trimmedLargeSelectors = largeTextSelectors.trim();
    const trimmedSmallSelectors = smallTextSelectors.trim();
    const allTextHoverSelectors = [trimmedLargeSelectors, trimmedSmallSelectors]
      .filter(Boolean)
      .join(', ');

    let hoverableTextElements;
    try {
      hoverableTextElements = document.querySelectorAll(allTextHoverSelectors);
    } catch (e) {
      console.error('[CustomCursorManager] Error during combined selector query.', e);
      return;
    }

    hoverableTextElements.forEach((el) => {
      if (el.closest('.component-pills') || el.classList.contains('pillText')) return;
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    document.addEventListener('mousemove', moveCursor);
  }

  function moveCursor(e) {
    const isHorizontalMode = customCursorElement && customCursorElement.classList.contains('horizontal-text-hover');
    if (!customCursorElement || (activeTextHoverCount === 0 && !isHorizontalMode)) {
      if (customCursorElement && activeTextHoverCount === 0 && !isHorizontalMode && customCursorElement.style.opacity !== '0') {
        customCursorElement.style.opacity = '0';
      }
      return;
    }
    customCursorElement.style.left = `${e.clientX}px`;
    customCursorElement.style.top = `${e.clientY}px`;
  }

  function handleMouseEnter(event) {
    const targetElement = event.currentTarget;

    // vertical-text special case
    if (targetElement.closest('.vertical-text')) {
      if (!customCursorElement) return;
      document.documentElement.classList.add('custom-cursor-is-active');
      customCursorElement.style.opacity = '0.8';
      customCursorElement.classList.remove('large-text-hover', 'small-text-hover');
      customCursorElement.classList.add('horizontal-text-hover');
      return;
    }

    if (!customCursorElement) return;
    const prev = activeTextHoverCount;
    activeTextHoverCount++;
    if (prev === 0 && activeTextHoverCount === 1) {
      document.documentElement.classList.add('custom-cursor-is-active');
      customCursorElement.style.opacity = '0.8';
    } else if (activeTextHoverCount > 0 && customCursorElement.style.opacity === '0') {
      if (!document.documentElement.classList.contains('custom-cursor-is-active')) {
        document.documentElement.classList.add('custom-cursor-is-active');
      }
      customCursorElement.style.opacity = '0.8';
    }

    if (activeTextHoverCount > 0) {
      if (distinctLargeTextElements.has(targetElement)) {
        customCursorElement.classList.add('large-text-hover');
        customCursorElement.classList.remove('small-text-hover', 'horizontal-text-hover');
      } else {
        customCursorElement.classList.add('small-text-hover');
        customCursorElement.classList.remove('large-text-hover', 'horizontal-text-hover');
      }
    }
  }

  function handleMouseLeave(event) {
    const targetElement = event.currentTarget;
    if (targetElement.closest('.vertical-text')) {
      if (!customCursorElement) return;
      document.documentElement.classList.remove('custom-cursor-is-active');
      customCursorElement.style.opacity = '0';
      function onEnd(e) {
        if (e.propertyName === 'opacity') {
          customCursorElement.classList.remove('horizontal-text-hover');
          customCursorElement.removeEventListener('transitionend', onEnd);
        }
      }
      customCursorElement.addEventListener('transitionend', onEnd);
      return;
    }

    if (!customCursorElement) return;
    activeTextHoverCount--;
    if (activeTextHoverCount <= 0) {
      activeTextHoverCount = 0;
      document.documentElement.classList.remove('custom-cursor-is-active');
      customCursorElement.style.opacity = '0';
      customCursorElement.classList.remove('large-text-hover', 'small-text-hover', 'horizontal-text-hover');
    }
  }

  return { initialize };
})();

// ───────────────────────────────────────────────────────────────────────────────
// 11. WORD HOVER INTERACTIVITY
// ───────────────────────────────────────────────────────────────────────────────
const WordHoverManager = (function () {
  const textContainerSelectors = `
    .introText,
    .descriptionText-1,
    .sectionTitleText,
    .quoteText,
    .sectionBodyText,
    .experienceItem-company,
    .experienceItem-job,
    .experienceItem-bodyTextContent,
    .footerCTAText,
    .footerEmailText,
    .footerLinkText
    .project-detail-title,
    .project-detail-value
  `;

  let lastHoveredWord = null;

  function initialize() {
  const containers = document.querySelectorAll(textContainerSelectors);
  containers.forEach((container) => {
    if (container.closest('a') || container.closest('button')) return;

    // Special, non-destructive handling for the intro text
    if (container.classList.contains('introText')) {
      const introSpans = container.querySelectorAll('span');
      introSpans.forEach(span => span.classList.add('interactive-word'));
    } else {
      // Original logic for all other text elements
      processNode(container);
    }

    // Attach the event listeners to ALL containers, including the introText
    container.addEventListener('mouseover', handleMouseOver);
    container.addEventListener('mouseleave', handleMouseLeave);
  });
}

  function processNode(node) {
    const childNodes = Array.from(node.childNodes);
    childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        const parts = child.textContent.match(/\S+|\s+/g) || [];
        if (parts.length > 0) {
          const fragment = document.createDocumentFragment();
          parts.forEach((part) => {
            if (/\s+/.test(part)) {
              fragment.appendChild(document.createTextNode(part));
            } else {
              const span = document.createElement('span');
              span.textContent = part;
              span.className = 'interactive-word';
              fragment.appendChild(span);
            }
          });
          node.replaceChild(fragment, child);
        }
      } else if (child.nodeType === 1) {
        processNode(child);
      }
    });
  }

  function handleMouseOver(event) {
    const target = event.target;
    if (target.classList.contains('interactive-word')) {
      if (lastHoveredWord && lastHoveredWord !== target) {
        lastHoveredWord.classList.remove('word-is-hovered');
      }
      target.classList.add('word-is-hovered');
      lastHoveredWord = target;
    }
  }

  function handleMouseLeave() {
    if (lastHoveredWord) {
      lastHoveredWord.classList.remove('word-is-hovered');
    }
    lastHoveredWord = null;
  }

  return { initialize };
})();

// ───────────────────────────────────────────────────────────────────────────────
// 11b. LOTTIE LOGO MANAGER
// ───────────────────────────────────────────────────────────────────────────────
const LottieLogoManager = (function () {
  let logoAnimation = null;
  let lottieLogoContainer = null;
  let isPlaying = false; // Our new flag to track the animation state
  const lightModePath = 'assets/nav-logo-light_big-lottie.json';
  const darkModePath = 'assets/nav-logo-dark_big-lottie.json';

  function loadAnimationByTheme() {
    // This was moved from outside the function to inside it
    const isDarkMode = document.documentElement.classList.contains('dark-mode');

    if (logoAnimation) {
      logoAnimation.destroy();
    }
    
    isPlaying = false; // Reset the flag whenever we load a new animation

    logoAnimation = lottie.loadAnimation({
      container: lottieLogoContainer,
      renderer: 'canvas',
      loop: false,
      autoplay: false,
      path: isDarkMode ? darkModePath : lightModePath
    });
    
    // Add a listener to reset the flag once the animation completes
    logoAnimation.addEventListener('complete', () => {
      isPlaying = false;
    });
  }

  function initialize() {
    lottieLogoContainer = document.getElementById('lottie-logo-container');

    if (!lottieLogoContainer || typeof lottie === 'undefined') {
      return;
    }
    setTimeout(() => lottieLogoContainer.classList.add('is-visible'), 100);
    loadAnimationByTheme();

    lottieLogoContainer.addEventListener('mouseenter', () => {
      // Only play the animation if it's not already playing
      if (isPlaying) {
        return; 
      }
      isPlaying = true; // Set the lock
      logoAnimation.goToAndPlay(0, true);
    });
  }

  function onThemeChange() {
    loadAnimationByTheme();
  }

  return { 
    initialize,
    onThemeChange 
  };
})();

// ───────────────────────────────────────────────────────────────────────────────
// 12. IMAGE CAROUSEL MANAGER
// ───────────────────────────────────────────────────────────────────────────────
const ImageCarouselManager = (function () {
  function initializeCarousel(carouselElement) {
    const projectThumbnail = carouselElement.closest('.projectThumbnail');
    const slides = carouselElement.querySelectorAll('.carousel-slide');
    const captionsContainer = projectThumbnail?.querySelector('.carousel-captions-container');
    const captions = captionsContainer ? captionsContainer.querySelectorAll('.carousel-caption') : [];
    const navPrev = projectThumbnail?.querySelector('.carousel-nav.prev');
    const navNext = projectThumbnail?.querySelector('.carousel-nav.next');

    let currentIndex = 0;
    let intervalId = null;
    const slideDuration = 6000;

    if (slides.length <= 1) {
      if (navPrev) navPrev.style.display = 'none';
      if (navNext) navNext.style.display = 'none';
      return;
    }

    function showSlide(index) {
      if (index >= slides.length) currentIndex = 0;
      else if (index < 0) currentIndex = slides.length - 1;
      else currentIndex = index;

      slides.forEach((slide) => slide.classList.remove('active'));
      slides[currentIndex].classList.add('active');

      if (captions.length === slides.length) {
        captions.forEach((c) => c.classList.remove('active'));
        captions[currentIndex].classList.add('active');
      }
    }

    function startInterval() {
      intervalId = setInterval(() => showSlide(currentIndex + 1), slideDuration);
    }

    function resetInterval() {
      clearInterval(intervalId);
      startInterval();
    }

    navPrev && navPrev.addEventListener('click', () => {
      showSlide(currentIndex - 1);
      resetInterval();
    });

    navNext && navNext.addEventListener('click', () => {
      showSlide(currentIndex + 1);
      resetInterval();
    });

    startInterval();
  }

  function initialize() {
    const allCarousels = document.querySelectorAll('.image-carousel');
    allCarousels.forEach(initializeCarousel);
  }

  return { initialize };
})();

// ───────────────────────────────────────────────────────────────────────────────
// 13. CARET SUPPRESSOR
// ───────────────────────────────────────────────────────────────────────────────
const CaretSuppressor = (function () {
  function initialize() {
    const introTextElement = document.querySelector('.introText');
    if (introTextElement) {
      introTextElement.addEventListener('mousedown', (e) => e.preventDefault());
    }
  }
  return { initialize };
})();

// ───────────────────────────────────────────────────────────────────────────────
// 14. GLOBAL HASH / SMOOTH SCROLL HANDLERS
// ───────────────────────────────────────────────────────────────────────────────

// Same-page hash links: intercept and smooth scroll
(function attachSamePageSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href').slice(1);
      if (!targetId) return;
      const targetEl = document.getElementById(targetId) || document.querySelector(`[name="${targetId}"]`);
      if (targetEl) {
        e.preventDefault();
        smoothScrollTo(targetEl, 800);
        history.pushState(null, '', `#${targetId}`);
      }
    });
  });
})();

// Cross-page hash links anywhere (footer, etc.): store hash before leaving page
(function attachCrossPageHashSaver() {
  document.querySelectorAll('a[href*=".html#"]').forEach((link) => {
    link.addEventListener('click', () => {
      const parts = link.href.split('#');
      if (parts.length > 1 && parts[1]) {
        sessionStorage.setItem('targetHash', parts[1]);
      }
    });
  });
})();

function handleInitialHashScroll() {
  // Read—and immediately clear—the stored cross‑page hash
  const storedHash = sessionStorage.getItem('targetHash');
  sessionStorage.removeItem('targetHash');

  // If we never clicked a cross‑page hash link, bail
  if (!storedHash) return;

  // Otherwise smooth‑scroll to that section
  const target = document.getElementById(storedHash)
    || document.querySelector(`[name="${storedHash}"]`);
  if (target) {
    setTimeout(() => smoothScrollTo(target, 800), 100);
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// 15. PRELOADER & MAIN INIT
// ───────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('preloading');
  ThemeManager.applyInitialThemeAndIcon();
});

window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  const pageContent = document.querySelector('.pageContent');

  if (preloader && pageContent) {
    pageContent.style.opacity = '0';
  }

  function onPreloaderFinishedAndModulesReady() {
    document.body.classList.remove('preloading');
    if (preloader) {
      preloader.style.display = 'none';
    }

    ThemeManager.setupEventListeners();
    LayoutManager.initialize();
    TextAnimator.initialize();
    BannerManager.initialize();
    PillAnimator.initialize();
    ProjectThumbnails.initialize();
    SectionAnimator.initialize();
    ExperienceManager.initialize();
    MobileMenuManager.initialize();
    WordHoverManager.initialize();
    LottieLogoManager.initialize(); 
    ImageCarouselManager.initialize();
    CaretSuppressor.initialize();
    ChatIconAnimator.initialize();

    if (window.matchMedia('(pointer: fine)').matches) {
      CustomCursorManager.initialize();
    }

    if (pageContent) {
      pageContent.style.opacity = '1';
      pageContent.style.transition = 'opacity 0.3s ease-in';
    }
    const footer = document.querySelector('.component-footer');
    if (footer) {
      footer.style.opacity = '1';
      footer.style.pointerEvents = 'auto';
    }
    handleInitialHashScroll();
  }

  function hidePreloader() {
    if (!preloader) {
      onPreloaderFinishedAndModulesReady();
      return;
    }
    preloader.classList.add('loading--out');
    let ended = false;
    function onEnd(e) {
      if (e.propertyName === 'opacity' && !ended) {
        ended = true;
        preloader.removeEventListener('transitionend', onEnd);
        onPreloaderFinishedAndModulesReady();
      }
    }
    preloader.addEventListener('transitionend', onEnd);
    // Fallback timer for the fade-out transition
    setTimeout(() => {
      if (!ended) {
        onPreloaderFinishedAndModulesReady();
      }
    }, 750);
  }

  // --- NEW Lottie-based preloader logic ---
  if (preloader) {
    const lottieContainer = document.getElementById('lottie-container');
    if (lottieContainer && typeof lottie !== 'undefined') {
      
      // --- Define your animation files here ---
      const lightModePath = 'assets/logo-lightMode_big-lottie_pngs.json';
      const darkModePath = 'assets/darkmodeTest2.json';

      // Check the <html> element for the dark-mode class to prevent flashing
      const isDarkMode = document.documentElement.classList.contains('dark-mode');

      const lottieAnimation = lottie.loadAnimation({
        container: lottieContainer,
        renderer: 'canvas',
        loop: false,
        autoplay: true,
        path: isDarkMode ? darkModePath : lightModePath // Choose path based on theme
      });

      // When the Lottie animation is complete, start hiding the preloader
      lottieAnimation.addEventListener('complete', hidePreloader);

    } else {
      // Fallback if Lottie isn't loaded or the container is missing
      setTimeout(hidePreloader, 500);
    }
  } else {
    // If there's no preloader on the page, initialize modules immediately
    onPreloaderFinishedAndModulesReady();
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// 13.5. FOOTER ICON ANIMATOR
// ───────────────────────────────────────────────────────────────────────────────
const ChatIconAnimator = (function () {
  function initialize() {
    const footerCTA = document.querySelector('.footerCTA');
    const chatIconSVG = document.querySelector('.chatIcon svg');

    if (!footerCTA || !chatIconSVG) {
      return; // Exit if elements aren't on the page
    }

    // When the mouse enters the CTA area...
    footerCTA.addEventListener('mouseenter', () => {
      // ...add the class to start the animation, but only if it's not already running.
      if (!chatIconSVG.classList.contains('is-wiggling')) {
        chatIconSVG.classList.add('is-wiggling');
      }
    });

    // When the animation finishes...
    chatIconSVG.addEventListener('animationend', () => {
      // ...remove the class to reset it for the next hover.
      chatIconSVG.classList.remove('is-wiggling');
    });
  }
  return { initialize };
})();

// ───────────────────────────────────────────────────────────────────────────────
// 16. FINAL LOG
// ───────────────────────────────────────────────────────────────────────────────
console.log('script.js (project-agnostic) loaded.');
