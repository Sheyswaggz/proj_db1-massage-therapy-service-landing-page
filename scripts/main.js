/**
 * Main JavaScript Module - Massage Therapy Landing Page
 * Handles core initialization and module coordination
 */

(function() {
  'use strict';

  /**
   * Configuration object
   */
  const config = {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    breakpoints: {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280
    }
  };

  /**
   * Utility functions
   */
  const utils = {
    /**
     * Get current viewport width
     * @returns {number} Width in pixels
     */
    getViewportWidth() {
      return window.innerWidth || document.documentElement.clientWidth;
    },

    /**
     * Check if viewport is above breakpoint
     * @param {string} breakpoint - Breakpoint name (sm, md, lg, xl)
     * @returns {boolean}
     */
    isAboveBreakpoint(breakpoint) {
      return this.getViewportWidth() >= config.breakpoints[breakpoint];
    },

    /**
     * Debounce function to limit function execution rate
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function}
     */
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    /**
     * Throttle function to limit function execution frequency
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function}
     */
    throttle(func, limit) {
      let inThrottle;
      return function executedFunction(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    /**
     * Log message to console with timestamp
     * @param {string} message - Message to log
     * @param {string} type - Type of log (info, warn, error)
     */
    log(message, type = 'info') {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [Landing Page]`;

      if (type === 'error') {
        console.error(`${prefix} ERROR:`, message);
      } else if (type === 'warn') {
        console.warn(`${prefix} WARN:`, message);
      } else {
        console.log(`${prefix}`, message);
      }
    }
  };

  /**
   * Initialize smooth scrolling for anchor links
   */
  function initSmoothScroll() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');

        if (href === '#') return;

        const target = document.querySelector(href);

        if (target) {
          e.preventDefault();

          const headerOffset = 80;
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          if (config.reducedMotion) {
            window.scrollTo({
              top: offsetPosition
            });
          } else {
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }

          utils.log(`Smooth scroll to ${href}`);
        }
      });
    });
  }

  /**
   * Initialize external link handling
   */
  function initExternalLinks() {
    const externalLinks = document.querySelectorAll('a[href^="http"]');

    externalLinks.forEach(link => {
      if (!link.hostname.includes(window.location.hostname)) {
        link.setAttribute('rel', 'noopener noreferrer');
        link.setAttribute('target', '_blank');
      }
    });

    utils.log(`Initialized ${externalLinks.length} external links`);
  }

  /**
   * Initialize lazy loading for images
   */
  function initLazyLoading() {
    if ('IntersectionObserver' in window) {
      const lazyImages = document.querySelectorAll('img[data-src]');

      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;

            if (img.dataset.srcset) {
              img.srcset = img.dataset.srcset;
            }

            img.removeAttribute('data-src');
            img.removeAttribute('data-srcset');
            imageObserver.unobserve(img);

            utils.log(`Lazy loaded image: ${img.src}`);
          }
        });
      }, {
        rootMargin: '50px 0px'
      });

      lazyImages.forEach(img => imageObserver.observe(img));
      utils.log(`Initialized lazy loading for ${lazyImages.length} images`);
    }
  }

  /**
   * Initialize page visibility handling
   */
  function initPageVisibility() {
    let hidden, visibilityChange;

    if (typeof document.hidden !== 'undefined') {
      hidden = 'hidden';
      visibilityChange = 'visibilitychange';
    } else if (typeof document.msHidden !== 'undefined') {
      hidden = 'msHidden';
      visibilityChange = 'msvisibilitychange';
    } else if (typeof document.webkitHidden !== 'undefined') {
      hidden = 'webkitHidden';
      visibilityChange = 'webkitvisibilitychange';
    }

    if (typeof document[hidden] !== 'undefined') {
      document.addEventListener(visibilityChange, function() {
        if (document[hidden]) {
          utils.log('Page hidden');
        } else {
          utils.log('Page visible');
        }
      });
    }
  }

  /**
   * Initialize performance monitoring
   */
  function initPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      try {
        const perfObserver = new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            if (entry.duration > 100) {
              utils.log(`Slow operation detected: ${entry.name} (${entry.duration.toFixed(2)}ms)`, 'warn');
            }
          });
        });

        perfObserver.observe({ entryTypes: ['measure'] });
      } catch (error) {
        utils.log(`Performance monitoring failed: ${error.message}`, 'error');
      }
    }
  }

  /**
   * Handle window resize events
   */
  function handleResize() {
    const debouncedResize = utils.debounce(() => {
      utils.log(`Window resized to ${utils.getViewportWidth()}px`);

      document.dispatchEvent(new CustomEvent('viewportResize', {
        detail: {
          width: utils.getViewportWidth(),
          isAboveMd: utils.isAboveBreakpoint('md'),
          isAboveLg: utils.isAboveBreakpoint('lg')
        }
      }));
    }, 250);

    window.addEventListener('resize', debouncedResize);
  }

  /**
   * Initialize all modules
   */
  function init() {
    performance.mark('init-start');

    utils.log('Initializing landing page...');
    utils.log(`Reduced motion: ${config.reducedMotion}`);
    utils.log(`Touch device: ${config.isTouch}`);

    try {
      initSmoothScroll();
      initExternalLinks();
      initLazyLoading();
      initPageVisibility();
      initPerformanceMonitoring();
      handleResize();

      performance.mark('init-end');
      performance.measure('initialization', 'init-start', 'init-end');

      const initTime = performance.getEntriesByName('initialization')[0].duration;
      utils.log(`Initialization complete in ${initTime.toFixed(2)}ms`);

      document.dispatchEvent(new CustomEvent('landingPageReady'));
    } catch (error) {
      utils.log(`Initialization error: ${error.message}`, 'error');
    }
  }

  /**
   * DOM ready handler
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /**
   * Export to global scope for module coordination
   */
  window.LandingPage = {
    config,
    utils,
    version: '1.0.0'
  };

})();
