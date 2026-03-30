/**
 * Animations Module - Scroll-Triggered Reveals
 * Implements Intersection Observer API for scroll-triggered animations
 * with staggered timing and reduced motion support
 */

(function() {
  'use strict';

  /**
   * Configuration
   */
  const animationConfig = {
    threshold: 0.15,
    rootMargin: '0px 0px -100px 0px',
    defaultDelay: 100,
    maxDelay: 500,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  /**
   * Get utility functions from main module
   */
  const utils = window.LandingPage?.utils || {
    log: (msg, type) => console.log(msg)
  };

  /**
   * Scroll Animation Manager
   */
  class ScrollAnimationManager {
    constructor() {
      this.elements = [];
      this.observer = null;
      this.initialized = false;
    }

    /**
     * Initialize the scroll animation system
     */
    init() {
      if (this.initialized) {
        utils.log('Scroll animations already initialized', 'warn');
        return;
      }

      if (animationConfig.reducedMotion) {
        utils.log('Reduced motion enabled - skipping animations');
        this.makeAllVisible();
        return;
      }

      if (!('IntersectionObserver' in window)) {
        utils.log('IntersectionObserver not supported - making all elements visible', 'warn');
        this.makeAllVisible();
        return;
      }

      this.setupElements();
      this.createObserver();
      this.observeElements();

      this.initialized = true;
      utils.log(`Initialized scroll animations for ${this.elements.length} elements`);
    }

    /**
     * Find and prepare all elements with data-reveal attribute
     */
    setupElements() {
      const revealElements = document.querySelectorAll('[data-reveal]');

      revealElements.forEach((element, index) => {
        const delay = element.dataset.delay || this.calculateStaggerDelay(index);
        element.dataset.calculatedDelay = delay;

        element.classList.add('hidden');

        this.elements.push(element);
      });
    }

    /**
     * Calculate stagger delay for sequential reveals
     * @param {number} index - Element index
     * @returns {number} Delay in milliseconds
     */
    calculateStaggerDelay(index) {
      const delay = index * animationConfig.defaultDelay;
      return Math.min(delay, animationConfig.maxDelay);
    }

    /**
     * Create Intersection Observer instance
     */
    createObserver() {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          threshold: animationConfig.threshold,
          rootMargin: animationConfig.rootMargin
        }
      );
    }

    /**
     * Handle intersection events
     * @param {IntersectionObserverEntry[]} entries - Observed entries
     */
    handleIntersection(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.revealElement(entry.target);
        }
      });
    }

    /**
     * Reveal an element with animation
     * @param {HTMLElement} element - Element to reveal
     */
    revealElement(element) {
      const delay = parseInt(element.dataset.calculatedDelay || 0, 10);

      setTimeout(() => {
        element.classList.remove('hidden');

        this.observer.unobserve(element);

        element.dispatchEvent(new CustomEvent('revealed', {
          bubbles: true,
          detail: { element }
        }));

        utils.log(`Revealed element: ${element.tagName}${element.className ? '.' + element.className : ''}`);
      }, delay);
    }

    /**
     * Start observing all elements
     */
    observeElements() {
      this.elements.forEach(element => {
        this.observer.observe(element);
      });
    }

    /**
     * Make all reveal elements visible (fallback for reduced motion or no support)
     */
    makeAllVisible() {
      const revealElements = document.querySelectorAll('[data-reveal]');
      revealElements.forEach(element => {
        element.classList.remove('hidden');
        element.style.opacity = '1';
        element.style.transform = 'none';
      });
    }

    /**
     * Refresh observer (useful after dynamic content addition)
     */
    refresh() {
      if (!this.observer) return;

      this.elements = [];
      this.observer.disconnect();
      this.setupElements();
      this.observeElements();

      utils.log('Scroll animations refreshed');
    }

    /**
     * Destroy observer and clean up
     */
    destroy() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }

      this.elements = [];
      this.initialized = false;

      utils.log('Scroll animations destroyed');
    }
  }

  /**
   * Additional animation utilities
   */
  const animationUtils = {
    /**
     * Animate element entrance
     * @param {HTMLElement} element - Element to animate
     * @param {string} animationType - Type of animation
     */
    animateEntrance(element, animationType = 'fade-in-up') {
      if (animationConfig.reducedMotion) return;

      element.classList.add(`animate-${animationType}`);

      element.addEventListener('animationend', function handler() {
        element.classList.remove(`animate-${animationType}`);
        element.removeEventListener('animationend', handler);
      });
    },

    /**
     * Add pulse animation to element
     * @param {HTMLElement} element - Element to pulse
     * @param {number} duration - Duration in milliseconds
     */
    pulse(element, duration = 1000) {
      if (animationConfig.reducedMotion) return;

      element.style.animation = `pulse ${duration}ms ease-in-out`;

      setTimeout(() => {
        element.style.animation = '';
      }, duration);
    },

    /**
     * Add shake animation to element (useful for form validation errors)
     * @param {HTMLElement} element - Element to shake
     */
    shake(element) {
      if (animationConfig.reducedMotion) return;

      const keyframes = [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(0)' }
      ];

      const options = {
        duration: 400,
        easing: 'ease-in-out'
      };

      element.animate(keyframes, options);
    },

    /**
     * Fade out element
     * @param {HTMLElement} element - Element to fade out
     * @param {Function} callback - Callback after fade completes
     */
    fadeOut(element, callback) {
      if (animationConfig.reducedMotion) {
        element.style.display = 'none';
        if (callback) callback();
        return;
      }

      element.style.transition = 'opacity 300ms ease-out';
      element.style.opacity = '0';

      setTimeout(() => {
        element.style.display = 'none';
        if (callback) callback();
      }, 300);
    },

    /**
     * Fade in element
     * @param {HTMLElement} element - Element to fade in
     * @param {string} display - Display property value
     */
    fadeIn(element, display = 'block') {
      if (animationConfig.reducedMotion) {
        element.style.display = display;
        element.style.opacity = '1';
        return;
      }

      element.style.display = display;
      element.style.opacity = '0';
      element.style.transition = 'opacity 300ms ease-in';

      requestAnimationFrame(() => {
        element.style.opacity = '1';
      });
    }
  };

  /**
   * Initialize on DOM ready
   */
  function init() {
    const manager = new ScrollAnimationManager();
    manager.init();

    window.ScrollAnimations = {
      manager,
      utils: animationUtils,
      config: animationConfig
    };

    document.dispatchEvent(new CustomEvent('scrollAnimationsReady'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /**
   * Listen for custom events to refresh animations
   */
  document.addEventListener('contentUpdated', () => {
    if (window.ScrollAnimations?.manager) {
      window.ScrollAnimations.manager.refresh();
    }
  });

})();
