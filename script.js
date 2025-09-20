/**
 * Alexander Biglane Portfolio Website
 * Refactored JavaScript - Clean Modular Organization
 * Updated: 2025
 * 
 * Structure:
 * 1. Global Configuration & State
 * 2. Utility Functions
 * 3. Theme Management
 * 4. Animation Modules
 * 5. UI Components
 * 6. Navigation & Menu
 * 7. Interactive Features
 * 8. Page Initialization
 */

// =============================================================================
// 1. GLOBAL CONFIGURATION & STATE
// =============================================================================

// Global flags
let isAutoScrolling = false;

// Feature detection
const IS_HOME = !!document.getElementById('selected-work-title');

// Global state container
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

// =============================================================================
// 2. UTILITY FUNCTIONS
// =============================================================================

/**
 * Linear interpolation helper
 */
function interpolate(startValue, endValue, progress) {
  return startValue + (endValue - startValue) * progress;
}

/**
 * Debounce function
 */
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Smooth scroll utility
 */
function smoothScrollTo(targetElement, duration = 400) {
  isAutoScrolling = true;

  const navOffset = 160;
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

// =============================================================================
// 3. THEME MANAGEMENT
// =============================================================================

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

    const themeAwareLogos = document.querySelectorAll('.theme-aware-logo');
    themeAwareLogos.forEach(logo => {
      const darkSrc = logo.getAttribute('data-dark-src');
      const lightSrc = logo.getAttribute('data-light-src');

      if (darkSrc && lightSrc) {
        logo.src = STATE.darkMode.active ? darkSrc : lightSrc;
      }
    });

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

    // Swap theme-aware logos
    const themeAwareLogos = document.querySelectorAll('.theme-aware-logo');
    themeAwareLogos.forEach(logo => {
      const darkSrc = logo.getAttribute('data-dark-src');
      const lightSrc = logo.getAttribute('data-light-src');

      if (darkSrc && lightSrc) {
        logo.src = STATE.darkMode.active ? darkSrc : lightSrc;
      }
    });

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

  return {
    applyInitialThemeAndIcon,
    setupEventListeners
  };
})();

// =============================================================================
// 4. ANIMATION MODULES
// =============================================================================

// -----------------------------------------------------------------------------
// 4.1 Text Animations  (UPDATED: dispatch 'headerIntroDone' when finished)
// -----------------------------------------------------------------------------
const TextAnimator = (function () {
  function initialize(mobileSeparatorDelay = 1300) {
    animateIntroText(mobileSeparatorDelay);
  }

  function animateIntroText(mobileSeparatorDelay = 1300) {
    const introText = document.querySelector('.introText');

    // If there is no header intro on this page, resolve immediately
    if (!introText) {
      document.dispatchEvent(new CustomEvent('headerIntroDone'));
      return;
    }

    const allAnims = []; // collect Animation objects

    // Check if this is a project page - handle differently
    if (document.body.classList.contains('project-page')) {
      console.log('Animating project page header');

      // Remove hidden-init from all spans inside introText
      const spans = introText.querySelectorAll('span');
      spans.forEach(span => {
        span.classList.remove('hidden-init');
      });

      // Now animate the container
      introText.style.opacity = '0';
      introText.style.transform = 'translateY(40px)';

      const headerAnim = introText.animate(
        [
          { opacity: 0, transform: 'translateY(40px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        {
          duration: 800,
          delay: 0,
          fill: 'forwards',
          easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
        }
      );

      headerAnim.onfinish = () => {
        introText.style.opacity = '1';
        introText.style.transform = 'translateY(0)';
        console.log('Header animation finished');
      };

      allAnims.push(headerAnim);

      // Then animate sub-header text AFTER main header
      const subHeader = document.querySelector('.sub-header-text');
      if (subHeader) {
        subHeader.style.opacity = '0';
        subHeader.style.transform = 'translateY(20px)';

        const subAnim = subHeader.animate(
          [
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 0.8, transform: 'translateY(0)' },
          ],
          {
            duration: 600,
            delay: 400,
            fill: 'forwards',
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
          }
        );

        subAnim.onfinish = () => {
          subHeader.style.cssText = 'opacity: 0.8 !important; transform: translateY(0) !important;';
          console.log('Subheader animation finished');
        };

        allAnims.push(subAnim);
      }

      // When everything finishes, announce completion
      Promise.all(
        allAnims.map((a) => (a && a.finished ? a.finished.catch(() => { }) : Promise.resolve()))
      ).then(() => {
        document.dispatchEvent(new CustomEvent('headerIntroDone'));
      });

      return; // Exit early for project pages
    }

    // Below is the original home page animation logic (keep as is)
    const spans = Array.from(introText.querySelectorAll('span'));
    if (spans.length === 0) {
      document.dispatchEvent(new CustomEvent('headerIntroDone'));
      return;
    }

    // Rest of your home page animation code...
    spans.forEach((span) => {
      span.style.display = 'inline-block';
      span.classList.add('hidden-init');
    });

    introText.offsetHeight;

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

    const movementDuration = 1200;
    const opacityDuration = 600;
    const rowStagger = 80;
    const intraStagger = 120;

    rows.forEach((row, rowIndex) => {
      row.spans.forEach((span, spanIndex) => {
        const delay = rowIndex * rowStagger + (rowIndex === 1 ? spanIndex * intraStagger : 0);

        const aFade = span.animate(
          [{ opacity: 0 }, { opacity: 1 }],
          {
            duration: opacityDuration,
            delay,
            fill: 'forwards',
            easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
          }
        );
        allAnims.push(aFade);

        const aMove = span.animate(
          [{ transform: 'translateY(80px)' }, { transform: 'translateY(0)' }],
          {
            duration: movementDuration,
            delay,
            fill: 'forwards',
            easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
          }
        );
        allAnims.push(aMove);
      });
    });

    const mobileSeparator = document.querySelector('.mobile-only-separator');
    if (mobileSeparator) {
      mobileSeparator.style.opacity = '0';
      mobileSeparator.style.transform = 'translateY(20px)';
      const sepAnim = mobileSeparator.animate(
        [
          { opacity: 0, transform: 'translateY(20px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        {
          duration: 600,
          delay: mobileSeparatorDelay,
          fill: 'forwards',
          easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
        }
      );
      allAnims.push(sepAnim);
    }

    const subHeader = document.querySelector('.sub-header-text');
    if (subHeader) {
      const aSub = subHeader.animate(
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
      allAnims.push(aSub);
    }

    Promise.all(
      allAnims.map((a) => (a && a.finished ? a.finished.catch(() => { }) : Promise.resolve()))
    ).then(() => {
      document.dispatchEvent(new CustomEvent('headerIntroDone'));
    });
  }

  return { initialize };
})();

// -----------------------------------------------------------------------------
// 4.2 Banner Management
// -----------------------------------------------------------------------------
const BannerManager = (function () {
  function initialize(options = {}) {
    const bannerImg = document.querySelector('.bannerImage');
    if (bannerImg) {
      if (options.delayed) {
        // Keep it hidden, will be revealed later
      } else {
        requestAnimationFrame(() => bannerImg.classList.remove('start-hidden'));
      }
    }

    storeBannerPosition();

    window.addEventListener('resize', () => {
      STATE.animations.bannerPosition = null;
    });

    // Fade/scale scroll only on home
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

  function reveal() {
    const bannerImg = document.querySelector('.bannerImage');
    if (bannerImg) {
      requestAnimationFrame(() => bannerImg.classList.remove('start-hidden'));
    }
  }

  return {
    initialize,
    updateBannerOnScroll,
    reveal
  };
})();

// -----------------------------------------------------------------------------
// 4.3 Pill Animations
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// 4.4 Project Thumbnails
// -----------------------------------------------------------------------------
const ProjectThumbnails = (function () {
  function initialize() {
    STATE.animations.thumbnails = Array.from(document.querySelectorAll('.projectThumbnail'));
    if (STATE.animations.thumbnails.length === 0) return;

    // Mark the first thumbnail as the hero (preloader-controlled)
    const hero = STATE.animations.thumbnails[0];
    if (hero) hero.classList.add('is-hero');

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
            setTimeout(() => storePosition(entry.target), 100);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05 }
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

  return {
    initialize,
    updateThumbnailsOnScroll,
    refreshThumbnails
  };
})();

// -----------------------------------------------------------------------------
// 4.5 Section Animator - FIXED VERSION
// -----------------------------------------------------------------------------
const SectionAnimator = (function () {
  let observer;
  let sections;
  const THRESHOLD = 0.1;

  function initialize() {
    const selectors = [
      '.component-description',
      '.component-sectionTitle',
      '.component-projectGrid',  // ADD THIS LINE
      '.component-textSection',
      '.component-experience',
      '.component-cta',
      '.component-featureImage',
    ];
    sections = Array.from(document.querySelectorAll(selectors.join(', ')));

    // For project pages, handle visible vs below-fold elements differently
    if (document.body.classList.contains('project-page')) {
      sections.forEach((section) => {
        section.classList.add('hidden-init');
      });

      // Check which elements are already in viewport
      const viewportHeight = window.innerHeight;
      let visibleOnLoad = [];
      let belowFold = [];

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top < viewportHeight) {
          visibleOnLoad.push(section);
        } else {
          belowFold.push(section);
        }
      });

      // DEBUG: Log what's visible on load
      console.log('Visible on load:', visibleOnLoad.map(s => s.className));
      console.log('Below fold:', belowFold.map(s => s.className));

      // Animate visible elements with stagger
      visibleOnLoad.forEach((section, index) => {
        const delay = 200 + (index * 150);
        console.log(`Animating ${section.className} with delay ${delay}ms`);

        setTimeout(() => {
          if (section.classList.contains('component-description')) {
            projectPageDescriptionReveal(section);
          } else {
            simpleReveal(section);
          }
        }, delay);
      });

      // Observe only below-fold elements
      if (belowFold.length > 0) {
        observer = new IntersectionObserver(onIntersect, { threshold: THRESHOLD });
        belowFold.forEach((section) => {
          observer.observe(section);
        });
      }

      return;
    }

    // Home page logic - UPDATED TO HANDLE TEXT SECTIONS
    sections.forEach((section) => {
      // Special handling for text sections - add hidden-init to children
      if (section.classList.contains('component-textSection')) {
        const sectionBodies = section.querySelectorAll('.sectionBody');
        const quoteSection = section.querySelector('.quoteSection');

        sectionBodies.forEach(body => body.classList.add('hidden-init'));
        if (quoteSection) quoteSection.classList.add('hidden-init');

        // Don't add hidden-init to the section container itself
      } else if (section.classList.contains('component-description')) {
        // Skip description (has its own logic)
        return;
      } else if (!section.classList.contains('component-pills') &&
        !section.classList.contains('component-experience')) {
        // For other sections, add hidden-init to the section itself
        section.classList.add('hidden-init');
      }
    });

    observer = new IntersectionObserver(onIntersect, { threshold: THRESHOLD });
    sections.forEach((section) => {
      if (section.classList.contains('component-description')) return;
      observer.observe(section);
    });
  }

  // Keep all the other functions exactly the same...
  function onIntersect(entries, obs) {
    if (isAutoScrolling) return;
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        console.log(`Intersecting: ${entry.target.className}`);
        // For project pages, use appropriate animation based on section type
        if (document.body.classList.contains('project-page')) {
          if (entry.target.classList.contains('component-description')) {
            projectPageDescriptionReveal(entry.target);
          } else {
            simpleReveal(entry.target);
          }
        } else {
          triggerAnimation(entry.target);
        }
        obs.unobserve(entry.target);
      }
    });
  }

  function simpleReveal(element) {
    if (!element.classList.contains('hidden-init')) return;

    element.animate(
      [
        { opacity: 0, transform: 'translateY(40px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      {
        duration: 600,
        fill: 'forwards',
        easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      }
    ).onfinish = () => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    };

    element.classList.remove('hidden-init');
  }

  function projectPageDescriptionReveal(section) {
    if (!section.classList.contains('hidden-init')) return;

    // Animate the main section container
    const sectionAnim = section.animate(
      [
        { opacity: 0, transform: 'translateY(40px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      {
        duration: 600,
        fill: 'forwards',
        easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      }
    );

    sectionAnim.onfinish = () => {
      section.style.opacity = '1';
      section.style.transform = 'translateY(0)';
    };

    section.classList.remove('hidden-init');

    // Animate the line separator with a slight delay
    const lineSeparator = section.querySelector('.lineSeparator');
    if (lineSeparator) {
      lineSeparator.style.opacity = '0';
      setTimeout(() => {
        const sepAnim = lineSeparator.animate(
          [
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          {
            duration: 500,
            fill: 'forwards',
            easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
          }
        );
        sepAnim.onfinish = () => {
          lineSeparator.style.opacity = '1';
          lineSeparator.style.transform = 'translateY(0)';
        };
      }, 50);
    }

    // Animate section title if present
    const sectionTitle = section.querySelector('.sectionTitleText');
    if (sectionTitle) {
      sectionTitle.style.opacity = '0';
      setTimeout(() => {
        const titleAnim = sectionTitle.animate(
          [
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          {
            duration: 500,
            fill: 'forwards',
            easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
          }
        );
        titleAnim.onfinish = () => {
          sectionTitle.style.opacity = '1';
          sectionTitle.style.transform = 'translateY(0)';
        };
      }, 100);
    }

    // Animate each paragraph with staggered delays
    const paragraphs = section.querySelectorAll('.paragraph-section');
    paragraphs.forEach((paragraph, index) => {
      paragraph.style.opacity = '0';
      setTimeout(() => {
        const paraAnim = paragraph.animate(
          [
            { opacity: 0, transform: 'translateY(30px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          {
            duration: 600,
            fill: 'forwards',
            easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
          }
        );
        paraAnim.onfinish = () => {
          paragraph.style.opacity = '1';
          paragraph.style.transform = 'translateY(0)';
        };
      }, 200 + index * 80);
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
    if (!section.classList.contains('hidden-init')) return;
    section.animate(
      [
        { opacity: 0, transform: 'translateY(80px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      {
        duration: 700,
        fill: 'forwards',
        easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      }
    );
    section.classList.remove('hidden-init');
  }

  function animateDescriptionSection(section) {
    // For home page, check if already revealed
    if (!section.classList.contains('hidden-init') || section.dataset.revealed === '1') return;

    // Animate the section itself
    animateGenericSection(section);

    // Hide the chevron when the description enters
    const carat = document.querySelector('.component-banner .carat');
    if (carat) carat.classList.remove('visible');

    const lineSeparator = section.querySelector('.lineSeparator');
    if (lineSeparator) {
      lineSeparator.style.opacity = '0';
      lineSeparator.animate(
        [
          { opacity: 0, transform: 'translateY(40px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        {
          duration: 700,
          delay: 100,
          fill: 'forwards',
          easing: 'cubic-bezier(0.645,0.045,0.355,1)',
        }
      );
    }

    const paragraphs = section.querySelectorAll('.paragraph-section');
    paragraphs.forEach((paragraph, index) => {
      paragraph.style.opacity = '0';
      paragraph.animate(
        [
          { opacity: 0, transform: 'translateY(40px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        {
          duration: 700,
          delay: 200 + index * 150,
          fill: 'forwards',
          easing: 'cubic-bezier(0.645,0.045,0.355,1)',
        }
      );
    });
  }

  function animateTextSection(section) {
    animateGenericSection(section);
    const container = section.querySelector('.rightColumnContainer');
    if (!container) return;

    const elementsToAnimate = container.querySelectorAll('.sectionBody, .quoteSection');

    console.log('About section animation triggered');
    console.log('Found elements to animate:', elementsToAnimate.length);

    elementsToAnimate.forEach((el, index) => {
      console.log(`Element ${index}:`, el.className);
      console.log(`Has hidden-init:`, el.classList.contains('hidden-init'));

      if (!el.classList.contains('hidden-init')) {
        console.log('PROBLEM: Skipping element without hidden-init');
        return;
      }

      const anim = el.animate(
        [
          { opacity: 0, transform: 'translateY(40px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        {
          duration: 700,
          delay: 200 + index * 150,
          fill: 'forwards',
          easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
        }
      );

      anim.onfinish = () => {
        el.classList.remove('hidden-init');
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        console.log(`Animation finished for element ${index}`);
      };
    });
  }

  function animateExperienceSection(section) {
    animateGenericSection(section);

    const experienceTitle = section.querySelector('.experienceTitleText');
    if (experienceTitle) {
      experienceTitle.style.transform = 'translateY(20px)';
      experienceTitle.offsetHeight;
      experienceTitle.animate(
        [
          { opacity: 0, transform: experienceTitle.style.transform },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        {
          duration: 600,
          delay: 100,
          fill: 'forwards',
          easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
        }
      );
    }

    const experienceItems = section.querySelectorAll('.experienceItem');
    experienceItems.forEach((item, index) => {
      item.style.transform = 'translateY(80px)';
      item.offsetHeight;
      item.animate(
        [
          { opacity: 0, transform: item.style.transform },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        {
          duration: 700,
          delay: 200 + index * 150 + (experienceTitle ? 100 : 0),
          fill: 'forwards',
          easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
        }
      );
    });
  }

  function refresh() {
    if (!sections) return;
    sections.forEach((section) => {
      if (!section.classList.contains('hidden-init')) return;
      const rect = section.getBoundingClientRect();
      const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
      if (inViewport) {
        if (document.body.classList.contains('project-page')) {
          if (section.classList.contains('component-description')) {
            projectPageDescriptionReveal(section);
          } else {
            simpleReveal(section);
          }
        } else {
          triggerAnimation(section);
        }
        observer && observer.unobserve(section);
      }
    });
  }

  return {
    initialize,
    refresh,
  };
})();

// -----------------------------------------------------------------------------
// 4.6 Rotating Words Manager - UPDATED TO PREVENT JUMP
// -----------------------------------------------------------------------------
const RotatingWordsManager = (function () {
  const START_DELAY_MS = 3200;
  const STEP_EVERY_MS = 2400;
  const TRANSITION_MS = 1600;
  const PHRASES = [
    '<span class="thin">problem</span> solver.',
    '<span class="thin">systems</span> builder.',
    '<span class="thin">curious</span> creative.'
  ];

  let currentWordIndex = 0;
  let intervalId = null;
  let container, inner;
  let LINE_HEIGHT = 54;
  let COUNT = 0;
  let isAnimating = false;
  let lastViewportWidth = 0;

  function initialize() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const slot = document.getElementById('rotating-slot');
    if (!slot) return;

    setTimeout(() => {
      container = document.createElement('span');
      container.className = 'rotating-words';

      inner = document.createElement('span');
      inner.className = 'rotating-words-inner';

      PHRASES.forEach(text => {
        const item = document.createElement('span');
        item.className = 'rotating-word';
        item.innerHTML = text; // Changed from textContent to innerHTML
        inner.appendChild(item);
      });

      inner.appendChild(inner.children[0].cloneNode(true));
      container.appendChild(inner);

      slot.replaceWith(container);
      COUNT = PHRASES.length;

      updateLineHeight();
      lastViewportWidth = window.innerWidth;
      startLoop();

      // Immediate response to resize
      window.addEventListener('resize', () => {
        const newWidth = window.innerWidth;
        const oldBreakpoint = getBreakpoint(lastViewportWidth);
        const newBreakpoint = getBreakpoint(newWidth);

        // Only act if we crossed a breakpoint
        if (oldBreakpoint !== newBreakpoint) {
          // Immediately update line height
          updateLineHeight();

          // Instantly reposition without animation
          inner.style.transition = 'none';
          inner.style.transform = `translateY(-${currentWordIndex * LINE_HEIGHT}px)`;

          // Force the browser to apply the change
          inner.offsetHeight;

          // Re-enable transitions after a frame
          requestAnimationFrame(() => {
            inner.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(0.645, 0.045, 0.355, 1)`;
          });
        }

        lastViewportWidth = newWidth;
      });

    }, START_DELAY_MS);
  }

  function getBreakpoint(width) {
    if (width >= 769) return 'desktop';
    if (width >= 481) return 'tablet';
    return 'mobile';
  }

  function updateLineHeight() {
    const viewportWidth = window.innerWidth;

    if (viewportWidth >= 769) {
      LINE_HEIGHT = 40;
    } else if (viewportWidth >= 481) {
      LINE_HEIGHT = 64;
    } else {
      LINE_HEIGHT = 54;
    }
  }

  function step() {
    if (isAnimating) return; // Skip if already animating

    isAnimating = true;
    currentWordIndex++;

    inner.style.transform = `translateY(-${currentWordIndex * LINE_HEIGHT}px)`;

    if (currentWordIndex === COUNT) {
      setTimeout(() => {
        inner.style.transition = 'none';
        inner.style.transform = 'translateY(0)';
        currentWordIndex = 0;
        void inner.offsetHeight;
        inner.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(0.645, 0.045, 0.355, 1)`;
        isAnimating = false;
      }, TRANSITION_MS);
    } else {
      setTimeout(() => {
        isAnimating = false;
      }, TRANSITION_MS);
    }
  }

  function startLoop() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(step, STEP_EVERY_MS + TRANSITION_MS);
  }

  return { initialize };
})();

// =============================================================================
// 5. UI COMPONENTS (Rest of the file remains the same)
// =============================================================================

// -----------------------------------------------------------------------------
// 5.1 Experience Accordion
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// 5.2 Image Carousel
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// 5.3 Lottie Logo Manager
// -----------------------------------------------------------------------------
const LottieLogoManager = (function () {
  let logoAnimation = null;
  let lottieLogoContainer = null;
  let isPlaying = false;
  const lightModePath = '/assets/nav-logo-light_big-lottie.json';
  const darkModePath = '/assets/nav-logo-dark_big-lottie.json';

  function loadAnimationByTheme() {
    const isDarkMode = document.documentElement.classList.contains('dark-mode');

    if (logoAnimation) {
      logoAnimation.destroy();
    }

    isPlaying = false;

    logoAnimation = lottie.loadAnimation({
      container: lottieLogoContainer,
      renderer: 'canvas',
      loop: false,
      autoplay: false,
      path: isDarkMode ? darkModePath : lightModePath
    });

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
      if (isPlaying) {
        return;
      }
      isPlaying = true;
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

// -----------------------------------------------------------------------------
// 5.4 Footer Components
// -----------------------------------------------------------------------------
const ChatIconAnimator = (function () {
  function initialize() {
    const footerCTA = document.querySelector('.footerCTA');
    const chatIconSVG = document.querySelector('.chatIcon svg');

    if (!footerCTA || !chatIconSVG) {
      return;
    }

    footerCTA.addEventListener('mouseenter', () => {
      if (!chatIconSVG.classList.contains('is-wiggling')) {
        chatIconSVG.classList.add('is-wiggling');
      }
    });

    chatIconSVG.addEventListener('animationend', () => {
      chatIconSVG.classList.remove('is-wiggling');
    });
  }

  return { initialize };
})();

const FooterLinkManager = (function () {
  function initialize() {
    const footerLinks = document.querySelectorAll('.component-footer a[href^="#"]');

    footerLinks.forEach(link => {
      link.addEventListener('click', function (event) {
        event.preventDefault();

        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
          smoothScrollTo(targetElement, 400);
        }
      });
    });
  }

  return { initialize };
})();

// =============================================================================
// 6. NAVIGATION & MENU (Rest remains the same)
// =============================================================================

// -----------------------------------------------------------------------------
// 6.1 Mobile Menu Management
// -----------------------------------------------------------------------------
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

    // Cross-page with hash
    if (href.includes('.html#')) {
      const hash = href.split('#')[1];
      if (hash) sessionStorage.setItem('targetHash', hash);
      closeMobileMenu();
      return;
    }

    // Same-page hash
    if (href.startsWith('#')) {
      event.preventDefault();
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId) ||
        document.querySelector(`[name="${targetId}"]`);
      closeMobileMenu();
      if (targetElement) {
        setTimeout(() => smoothScrollTo(targetElement), 400);
        isAutoScrolling = true;
      }
      return;
    }

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
        'a[href], button:not([disabled]), textarea:not([disabled]), ' +
        'input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

// -----------------------------------------------------------------------------
// 6.2 Layout Manager
// -----------------------------------------------------------------------------
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

// =============================================================================
// 7. INTERACTIVE FEATURES (Rest remains the same)
// =============================================================================

// [Rest of the CustomCursorManager, WordHoverManager, CaretSuppressor, and other code remains exactly the same]
// ... (continuing with the rest of your original code from section 7 onwards)

// -----------------------------------------------------------------------------
// 7.1 Custom Cursor
// -----------------------------------------------------------------------------
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
    const isHorizontalMode = customCursorElement &&
      customCursorElement.classList.contains('horizontal-text-hover');
    if (!customCursorElement || (activeTextHoverCount === 0 && !isHorizontalMode)) {
      if (customCursorElement && activeTextHoverCount === 0 &&
        !isHorizontalMode && customCursorElement.style.opacity !== '0') {
        customCursorElement.style.opacity = '0';
      }
      return;
    }
    customCursorElement.style.left = `${e.clientX}px`;
    customCursorElement.style.top = `${e.clientY}px`;
  }

  function handleMouseEnter(event) {
    const targetElement = event.currentTarget;

    // Vertical-text special case
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

// -----------------------------------------------------------------------------
// 7.2 Word Hover Manager
// -----------------------------------------------------------------------------
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

      // Special handling for intro text
      if (container.classList.contains('introText')) {
        const introSpans = container.querySelectorAll('span');
        introSpans.forEach(span => span.classList.add('interactive-word'));
      } else {
        processNode(container);
      }

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

// -----------------------------------------------------------------------------
// 7.3 Caret Suppressor
// -----------------------------------------------------------------------------
const CaretSuppressor = (function () {
  function initialize() {
    const introTextElement = document.querySelector('.introText');
    if (introTextElement) {
      introTextElement.addEventListener('mousedown', (e) => e.preventDefault());
    }
  }
  return { initialize };
})();

// -----------------------------------------------------------------------------
// 7.4 Hash & Smooth Scroll Handlers
// -----------------------------------------------------------------------------
function attachSamePageSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id) ||
        document.querySelector(`[name="${id}"]`);
      if (target) {
        smoothScrollTo(target, 400);
      }
    });
  });
}

function attachCrossPageHashSaver() {
  document.querySelectorAll('a[href*=".html#"]').forEach((link) => {
    link.addEventListener('click', () => {
      const parts = link.href.split('#');
      if (parts.length > 1 && parts[1]) {
        sessionStorage.setItem('targetHash', parts[1]);
      }
    });
  });
}

function handleInitialHashScroll() {
  let hash = sessionStorage.getItem('targetHash');
  sessionStorage.removeItem('targetHash');

  if (!hash && window.location.hash) {
    hash = window.location.hash.slice(1);
  }

  if (!hash) return;

  const target = document.getElementById(hash) ||
    document.querySelector(`[name="${hash}"]`);

  if (target) {
    setTimeout(() => smoothScrollTo(target, 400), 100);
  }
}

// =============================================================================
// 8. PAGE INITIALIZATION
// =============================================================================

/**
 * Smoothly reveal the avatar container (image on the right).
 */
function revealHeaderAvatar() {
  return new Promise((resolve) => {
    const el = document.querySelector('.header-image-container');
    if (!el) return resolve();
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      const done = () => { el.removeEventListener('transitionend', done); resolve(); };
      el.addEventListener('transitionend', done);
      setTimeout(resolve, 400);
    });
  });
}

/**
 * Animate the Overview block (component-description) BEFORE the grid.
 */
function revealDescriptionFirst() {
  const section = document.querySelector('.component-description');
  if (!section) return Promise.resolve();

  if (!section.classList.contains('hidden-init')) return Promise.resolve();

  const EASE = 'cubic-bezier(0.645, 0.045, 0.355, 1)';
  const D_GENERIC = 400;
  const anims = [];

  const a1 = section.animate(
    [{ opacity: 0, transform: 'translateY(80px)' }, { opacity: 1, transform: 'translateY(0)' }],
    { duration: D_GENERIC, fill: 'forwards', easing: EASE }
  );
  anims.push(a1);
  section.classList.remove('hidden-init');

  const lineSeparator = section.querySelector('.lineSeparator');
  if (lineSeparator) {
    anims.push(
      lineSeparator.animate(
        [{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 400, delay: 60, fill: 'forwards', easing: EASE }
      )
    );
  }

  const paragraphs = section.querySelectorAll('.paragraph-section');
  let maxDelay = 200;
  paragraphs.forEach((p, idx) => {
    const delay = 200 + idx * 150;
    maxDelay = Math.max(maxDelay, delay);
    anims.push(
      p.animate(
        [{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 700, delay, fill: 'forwards', easing: EASE }
      )
    );
  });

  const totalAnimationTime = maxDelay + 700;

  return new Promise(resolve => {
    setTimeout(resolve, totalAnimationTime + 100);
    Promise.all(anims.map(a => a.finished?.catch(() => { }) ?? Promise.resolve()))
      .then(() => resolve());
  });
}

/**
 * Initialize all modules after preloader
 */
function onPreloaderFinishedAndModulesReady() {
  document.body.classList.add('app-ready');
  document.body.classList.remove('preloading');

  const preloader = document.getElementById('preloader');
  if (preloader) preloader.style.display = 'none';

  // ============================================
  // ANIMATION TIMING CONFIGURATION
  // Adjust these values to control when each element fades in
  // All values are in milliseconds from when preloader finishes
  // ============================================
  const ANIMATION_DELAYS = {
    headerText: 0,           // Main intro text (Alex Biglane, etc.)
    avatar: 1100,             // Profile image
    mobileSeparator: 1250,   // Mobile horizontal line
    description: 1500,        // Overview section
    descriptionStagger: 150, // Delay between description paragraphs
    socialIcons: 1000,        // Social media icons (base delay)
    socialIconStagger: 50,  // Delay between each social icon
    banner: 1000,            // Banner image (if present)
    thumbnails: 1600,        // Project grid
    rotatingWords: 3200,     // Rotating text animation
    caratIndicator: 3000,    // Scroll down arrow
  };

  // ============================================
  // INITIALIZATION (Don't modify below unless changing functionality)
  // ============================================

  // Initialize core modules immediately
  ThemeManager.setupEventListeners();
  LayoutManager.initialize();
  BannerManager.initialize({ delayed: true });
  MobileMenuManager.initialize();
  LottieLogoManager.initialize();
  ImageCarouselManager.initialize();
  CaretSuppressor.initialize();
  ChatIconAnimator.initialize();
  FooterLinkManager.initialize();

  // Make page visible
  const pageContent = document.querySelector('.pageContent');
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

  // ============================================
  // EXECUTE ANIMATIONS BASED ON CONFIG
  // ============================================

  // Header text
  setTimeout(() => {
    TextAnimator.initialize(ANIMATION_DELAYS.mobileSeparator);  // Pass the delay
    SectionAnimator.initialize();
  }, ANIMATION_DELAYS.headerText);

  // Rotating words
  setTimeout(() => {
    RotatingWordsManager.initialize();
  }, ANIMATION_DELAYS.rotatingWords);

  // Avatar
  setTimeout(() => {
    const avatar = document.querySelector('.header-image-container');
    if (avatar) {
      avatar.style.opacity = '1';
      avatar.style.transform = 'translateY(0)';
    }
  }, ANIMATION_DELAYS.avatar);

  // Social icons
  setTimeout(() => {
    const socialIcons = document.querySelectorAll('.social-icon');
    socialIcons.forEach((icon, index) => {
      setTimeout(() => {
        icon.style.opacity = '1';
        icon.style.transform = 'translateY(0)';  // Changed from translateX(0) to translateY(0)
      }, index * ANIMATION_DELAYS.socialIconStagger);
    });
  }, ANIMATION_DELAYS.socialIcons);

  // Mobile separator
  setTimeout(() => {
    const separator = document.querySelector('.mobile-only-separator');
    if (separator) {
      // First, ensure transition is set while element is still hidden
      separator.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

      // Force a reflow to ensure the transition is applied
      separator.offsetHeight;

      // Then change the values to trigger the animation
      separator.style.opacity = '1';
      separator.style.transform = 'translateY(0)';
    }
  }, ANIMATION_DELAYS.mobileSeparator);

  // Description section
  setTimeout(() => {
    // Only do immediate reveal on home page, not project pages
    if (!document.body.classList.contains('project-page')) {
      const section = document.querySelector('.component-description');
      if (section) {
        // Remove hidden-init if it exists
        if (section.classList.contains('hidden-init')) {
          section.classList.remove('hidden-init');
        }
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';

        // CRITICAL: Animate the descriptionText-1 container
        const descText = section.querySelector('.descriptionText-1');
        if (descText) {
          descText.style.opacity = '1';
          descText.style.transform = 'translateY(0)';
          descText.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
        }

        // Animate the line separator within description
        const lineSeparator = section.querySelector('.lineSeparator');
        if (lineSeparator) {
          lineSeparator.style.opacity = '0';
          lineSeparator.style.transform = 'translateY(40px)';
          setTimeout(() => {
            lineSeparator.style.opacity = '1';
            lineSeparator.style.transform = 'translateY(0)';
            lineSeparator.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          }, 60);
        }

        const paragraphs = section.querySelectorAll('.paragraph-section');
        paragraphs.forEach((p, idx) => {
          setTimeout(() => {
            p.style.opacity = '1';
            p.style.transform = 'translateY(0)';
          }, idx * ANIMATION_DELAYS.descriptionStagger);
        });
      }
    }
  }, ANIMATION_DELAYS.description);

  // Banner
  setTimeout(() => {
    BannerManager.reveal();
  }, ANIMATION_DELAYS.banner);

  // Project thumbnails and other sections
  setTimeout(() => {
    document.body.classList.add('app-stage-content');
    document.body.classList.remove('projects-locked');
    document.body.classList.add('projects-unlocked');

    const hero = document.querySelector('.projectThumbnail.is-hero');
    if (hero) {
      if (!hero.classList.contains('fadeIn-visible')) hero.classList.add('fadeIn-visible');
      try {
        ProjectThumbnails.refreshThumbnails();
        ProjectThumbnails.updateThumbnailsOnScroll();
      } catch (e) { }
    }

    PillAnimator.initialize();
    ProjectThumbnails.initialize();
    ExperienceManager.initialize();
  }, ANIMATION_DELAYS.thumbnails);

  // Carat indicator
  setTimeout(() => {
    const carat = document.querySelector('.component-banner .carat');
    if (!carat) return;
    carat.classList.add('visible');
    carat.style.pointerEvents = 'auto';
    carat.style.cursor = 'pointer';
    carat.addEventListener('click', () => {
      const desc = document.querySelector('.component-description');
      if (!desc) return;
      const nav = document.querySelector('nav');
      const navHeight = nav ? nav.offsetHeight : 0;
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const targetY = desc.getBoundingClientRect().top + window.pageYOffset - (navHeight + 2.5 * rootFontSize);
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    });
  }, ANIMATION_DELAYS.caratIndicator);
}

/**
 * Hide preloader and transition to main content
 */
function hidePreloader() {
  const preloader = document.getElementById('preloader');
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

  setTimeout(() => {
    if (!ended) onPreloaderFinishedAndModulesReady();
  }, 350);
}

// =============================================================================
// DOM READY & WINDOW LOAD HANDLERS
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('preloading', 'projects-locked');
  ThemeManager.applyInitialThemeAndIcon();
});

window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  const pageContent = document.querySelector('.pageContent');

  if (preloader && pageContent) {
    pageContent.style.opacity = '0';
  }

  attachSamePageSmoothScroll();
  attachCrossPageHashSaver();

  if (preloader) {
    const lottieContainer = document.getElementById('lottie-container');
    if (lottieContainer && typeof lottie !== 'undefined') {
      const lightModePath = 'assets/logo-light_big-lottie.json';
      const darkModePath = 'assets/logo-dark_big-lottie.json';
      const isDarkMode = document.documentElement.classList.contains('dark-mode');

      const lottieAnimation = lottie.loadAnimation({
        container: lottieContainer,
        renderer: 'canvas',
        loop: false,
        autoplay: true,
        path: isDarkMode ? darkModePath : lightModePath
      });

      lottieAnimation.setSpeed(1.3);  // Set speed after loading

      lottieAnimation.addEventListener('complete', hidePreloader);
    } else {
      setTimeout(hidePreloader, 500);
    }
  } else {
    onPreloaderFinishedAndModulesReady();
  }
});

// =============================================================================
// IMAGE SPINNER ASSIST (mouse hover + touch press)
// =============================================================================
(function () {
  const container = document.querySelector('.header-image-container');
  if (!container) return;

  const mask = container.querySelector('.avatar-mask');
  const img = container.querySelector('.header-profile-image');
  if (!mask || !img) return;

  // Get the border element
  const border = container.querySelector('.avatar-border');

  const SPIN_PERIOD_MS = 20000;
  const MAX_SPEED = 360 / SPIN_PERIOD_MS;
  const RAMP_MS = 600;
  const isMobile = window.innerWidth <= 768;
  const SCALE_ON = isMobile ? 1.20 : 1.10; // 1.20 for mobile, 1.10 for desktop
  const SCALE_OFF = 1.00;

  let rafId = null;
  let lastT = 0;
  let angle = 0;
  let currentSpeed = 0;
  let targetSpeed = 0;
  let currentScale = SCALE_OFF;
  let targetScale = SCALE_OFF;

  function stepToward(current, target, dt, rampMs) {
    const k = Math.min(1, dt / rampMs);
    return current + (target - current) * k;
  }

  function tick(t) {
    if (!lastT) lastT = t;
    const dt = t - lastT;
    lastT = t;

    currentSpeed = stepToward(currentSpeed, targetSpeed, dt, RAMP_MS);
    currentScale = stepToward(currentScale, targetScale, dt, RAMP_MS);

    angle += currentSpeed * dt;

    // Calculate different scales - image gets much less scaling
    const maskScale = currentScale; // Full scale for mask
    const imageScaleAmount = (currentScale - 1) * 0.3; // Only 30% of the scale increase
    const imageScale = 1 + imageScaleAmount; // So if mask is 1.10, image is only 1.03

    // Apply different scales
    mask.style.transform = `rotate(${angle}deg) scale(${maskScale})`;
    img.style.transform = `rotate(${-angle}deg) scale(${imageScale})`;

    // Border gets full scale like the mask
    if (border) {
      border.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    }

    rafId = requestAnimationFrame(tick);
  }

  function ensureRAF() {
    if (rafId == null) rafId = requestAnimationFrame(tick);
  }

  function startSpin() {
    container.classList.add('is-pressed');
    targetSpeed = MAX_SPEED;
    targetScale = SCALE_ON;
    lastT = 0;
    ensureRAF();
  }

  function stopSpin() {
    container.classList.remove('is-pressed');
    targetSpeed = 0;
    targetScale = SCALE_OFF;

    const check = () => {
      const nearZeroSpeed = Math.abs(currentSpeed) < 0.00001;
      const nearUnitScale = Math.abs(currentScale - SCALE_OFF) < 0.001;
      if (nearZeroSpeed && nearUnitScale) {
        if (rafId != null) cancelAnimationFrame(rafId);
        rafId = null;
      } else {
        requestAnimationFrame(check);
      }
    };
    requestAnimationFrame(check);
  }

  container.addEventListener('mouseenter', startSpin);
  container.addEventListener('mouseleave', stopSpin);

  container.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') startSpin();
  });
  container.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'mouse') stopSpin();
  });
  container.addEventListener('pointercancel', stopSpin);
  container.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') stopSpin();
  });

  container.addEventListener('touchstart', startSpin, { passive: true });
  container.addEventListener('touchend', stopSpin);
  container.addEventListener('touchcancel', stopSpin);
})();

// =============================================================================
// FINAL LOG
// =============================================================================
console.log('script.js loaded - Alexander Biglane Portfolio');