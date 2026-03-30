/**
 * Main JavaScript Module - Massage Therapy Landing Page
 * Handles core initialization and module coordination
 * Coordinates animations.js and interactions.js modules
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
    },
    features: {
      intersectionObserver: 'IntersectionObserver' in window,
      performanceObserver: 'PerformanceObserver' in window,
      customEvents: typeof CustomEvent !== 'undefined'
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
      return this.getViewportWidth() >= (config.breakpoints[breakpoint] || 0);
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
    },

    /**
     * Safe querySelector with error handling
     * @param {string} selector - CSS selector
     * @param {Element} context - Context element (default: document)
     * @returns {Element|null}
     */
    safeQuerySelector(selector, context = document) {
      try {
        return context.querySelector(selector);
      } catch (error) {
        this.log(`Invalid selector: ${selector}`, 'error');
        return null;
      }
    },

    /**
     * Safe querySelectorAll with error handling
     * @param {string} selector - CSS selector
     * @param {Element} context - Context element (default: document)
     * @returns {NodeList}
     */
    safeQuerySelectorAll(selector, context = document) {
      try {
        return context.querySelectorAll(selector);
      } catch (error) {
        this.log(`Invalid selector: ${selector}`, 'error');
        return [];
      }
    }
  };

  /**
   * Initialize smooth scrolling for anchor links
   */
  function initSmoothScroll() {
    try {
      const anchorLinks = utils.safeQuerySelectorAll('a[href^="#"]');

      if (anchorLinks.length === 0) {
        utils.log('No anchor links found for smooth scrolling');
        return;
      }

      anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          const href = this.getAttribute('href');

          if (!href || href === '#') {
            return;
          }

          const target = utils.safeQuerySelector(href);

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

            if (target.hasAttribute('tabindex')) {
              target.focus();
            } else {
              target.setAttribute('tabindex', '-1');
              target.focus();
              target.addEventListener('blur', function removeTempTabindex() {
                target.removeAttribute('tabindex');
                target.removeEventListener('blur', removeTempTabindex);
              });
            }
          }
        });
      });

      utils.log(`Initialized smooth scrolling for ${anchorLinks.length} anchor links`);
    } catch (error) {
      utils.log(`Error initializing smooth scroll: ${error.message}`, 'error');
    }
  }

  /**
   * Initialize external link handling for security and UX
   */
  function initExternalLinks() {
    try {
      const externalLinks = utils.safeQuerySelectorAll('a[href^="http"]');
      let externalCount = 0;

      externalLinks.forEach(link => {
        try {
          const linkHostname = new URL(link.href).hostname;
          if (linkHostname !== window.location.hostname) {
            link.setAttribute('rel', 'noopener noreferrer');
            link.setAttribute('target', '_blank');
            externalCount++;
          }
        } catch (error) {
          utils.log(`Invalid URL in link: ${link.href}`, 'warn');
        }
      });

      utils.log(`Initialized ${externalCount} external links with security attributes`);
    } catch (error) {
      utils.log(`Error initializing external links: ${error.message}`, 'error');
    }
  }

  /**
   * Initialize lazy loading module coordination
   */
  function initLazyLoading() {
    try {
      if (typeof window.LazyLoading !== 'undefined') {
        utils.log('Lazy loading module detected and ready');

        document.addEventListener('lazyLoadingReady', function(event) {
          const detail = event.detail;
          utils.log(`Lazy loading ready - WebP: ${detail.supportsWebP}, Images: ${detail.imageCount}`);

          if (config.features.customEvents) {
            document.dispatchEvent(new CustomEvent('imagesInitialized', {
              detail: {
                count: detail.imageCount,
                webpSupport: detail.supportsWebP
              }
            }));
          }
        });

        document.addEventListener('lazyload', function(event) {
          const img = event.target;

          if (img && img.parentElement) {
            const parentRect = img.parentElement.getBoundingClientRect();
            if (parentRect.height === 0) {
              img.parentElement.style.minHeight = 'auto';
            }
          }

          utils.log(`Image loaded: ${event.detail.src}`);
        });

        document.addEventListener('layoutstable', function() {
          if (typeof window.ScrollAnimations !== 'undefined' &&
              typeof window.ScrollAnimations.refresh === 'function') {
            window.ScrollAnimations.refresh();
          }
        });

        utils.log('Lazy loading event listeners configured');
      } else {
        utils.log('Lazy loading module not found - using fallback', 'warn');

        if (!config.features.intersectionObserver) {
          utils.log('IntersectionObserver not supported - skipping lazy loading', 'warn');
          return;
        }

        const lazyImages = utils.safeQuerySelectorAll('img[data-src]');

        if (lazyImages.length === 0) {
          return;
        }

        const imageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;

              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
              }

              if (img.dataset.srcset) {
                img.srcset = img.dataset.srcset;
                img.removeAttribute('data-srcset');
              }

              img.classList.add('lazy-loaded');
              imageObserver.unobserve(img);

              utils.log(`Lazy loaded image: ${img.src}`);
            }
          });
        }, {
          rootMargin: '50px 0px',
          threshold: 0.01
        });

        lazyImages.forEach(img => imageObserver.observe(img));
        utils.log(`Initialized fallback lazy loading for ${lazyImages.length} images`);
      }
    } catch (error) {
      utils.log(`Error initializing lazy loading: ${error.message}`, 'error');
    }
  }

  /**
   * Initialize page visibility handling for performance optimization
   */
  function initPageVisibility() {
    try {
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
          const isHidden = document[hidden];

          document.dispatchEvent(new CustomEvent('pageVisibilityChange', {
            detail: { hidden: isHidden }
          }));

          utils.log(isHidden ? 'Page hidden' : 'Page visible');
        });

        utils.log('Page visibility tracking initialized');
      }
    } catch (error) {
      utils.log(`Error initializing page visibility: ${error.message}`, 'error');
    }
  }

  /**
   * Initialize performance monitoring
   */
  function initPerformanceMonitoring() {
    if (!config.features.performanceObserver) {
      utils.log('PerformanceObserver not supported', 'warn');
      return;
    }

    try {
      const perfObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.duration > 100) {
            utils.log(`Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`, 'warn');
          }
        });
      });

      perfObserver.observe({ entryTypes: ['measure'] });
      utils.log('Performance monitoring enabled');
    } catch (error) {
      utils.log(`Performance monitoring failed: ${error.message}`, 'error');
    }
  }

  /**
   * Handle window resize events with debouncing
   */
  function handleResize() {
    const debouncedResize = utils.debounce(() => {
      const width = utils.getViewportWidth();
      const detail = {
        width: width,
        isAboveSm: utils.isAboveBreakpoint('sm'),
        isAboveMd: utils.isAboveBreakpoint('md'),
        isAboveLg: utils.isAboveBreakpoint('lg'),
        isAboveXl: utils.isAboveBreakpoint('xl')
      };

      if (config.features.customEvents) {
        document.dispatchEvent(new CustomEvent('viewportResize', { detail }));
      }

      utils.log(`Viewport resized to ${width}px`);
    }, 250);

    window.addEventListener('resize', debouncedResize);
    utils.log('Resize handler initialized');
  }

  /**
   * Handle reduced motion preference changes
   */
  function initReducedMotionListener() {
    try {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

      const handleMotionChange = (e) => {
        config.reducedMotion = e.matches;

        if (config.features.customEvents) {
          document.dispatchEvent(new CustomEvent('reducedMotionChange', {
            detail: { reducedMotion: e.matches }
          }));
        }

        utils.log(`Reduced motion preference changed: ${e.matches}`);
      };

      if (motionQuery.addEventListener) {
        motionQuery.addEventListener('change', handleMotionChange);
      } else if (motionQuery.addListener) {
        motionQuery.addListener(handleMotionChange);
      }

      utils.log('Reduced motion listener initialized');
    } catch (error) {
      utils.log(`Error initializing reduced motion listener: ${error.message}`, 'error');
    }
  }

  /**
   * Wait for other modules to load
   * @param {number} maxWait - Maximum wait time in milliseconds
   * @returns {Promise}
   */
  function waitForModules(maxWait = 5000) {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const checkModules = () => {
        const animationsReady = typeof window.ScrollAnimations !== 'undefined';
        const interactionsReady = typeof window.Interactions !== 'undefined';
        const lazyLoadingReady = typeof window.LazyLoading !== 'undefined';

        if (animationsReady && interactionsReady && lazyLoadingReady) {
          utils.log('All modules loaded successfully (animations, interactions, lazy-loading)');
          resolve(true);
        } else if (Date.now() - startTime > maxWait) {
          const missing = [];
          if (!animationsReady) missing.push('animations');
          if (!interactionsReady) missing.push('interactions');
          if (!lazyLoadingReady) missing.push('lazy-loading');
          utils.log(`Module loading timeout - missing: ${missing.join(', ')}`, 'warn');
          resolve(false);
        } else {
          setTimeout(checkModules, 100);
        }
      };

      checkModules();
    });
  }

  /**
   * Initialize all modules and coordinate startup
   */
  async function init() {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('init-start');
    }

    utils.log('='.repeat(60));
    utils.log('Massage Therapy Landing Page - Initialization Started');
    utils.log('='.repeat(60));
    utils.log(`Reduced motion: ${config.reducedMotion}`);
    utils.log(`Touch device: ${config.isTouch}`);
    utils.log(`IntersectionObserver: ${config.features.intersectionObserver}`);
    utils.log(`PerformanceObserver: ${config.features.performanceObserver}`);

    try {
      initSmoothScroll();
      initExternalLinks();
      initLazyLoading();
      initPageVisibility();
      initPerformanceMonitoring();
      handleResize();
      initReducedMotionListener();

      await waitForModules();

      if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
        performance.mark('init-end');
        performance.measure('initialization', 'init-start', 'init-end');

        const initMeasure = performance.getEntriesByName('initialization')[0];
        if (initMeasure) {
          utils.log(`Initialization complete in ${initMeasure.duration.toFixed(2)}ms`);
        }
      }

      if (config.features.customEvents) {
        document.dispatchEvent(new CustomEvent('landingPageReady', {
          detail: {
            config: config,
            timestamp: Date.now()
          }
        }));
      }

      utils.log('='.repeat(60));
      utils.log('All systems ready - Landing page fully initialized');
      utils.log('='.repeat(60));
    } catch (error) {
      utils.log(`Critical initialization error: ${error.message}`, 'error');
      console.error('Stack trace:', error);
    }
  }

  /**
   * Global error handler for uncaught errors
   */
  window.addEventListener('error', function(event) {
    utils.log(`Uncaught error: ${event.message} at ${event.filename}:${event.lineno}`, 'error');
  });

  /**
   * Global error handler for unhandled promise rejections
   */
  window.addEventListener('unhandledrejection', function(event) {
    utils.log(`Unhandled promise rejection: ${event.reason}`, 'error');
  });

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
    version: '1.0.0',
    init: init
  };

})();
