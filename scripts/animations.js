/**
 * Animations Module - Scroll-Triggered Reveals
 * Implements Intersection Observer API for scroll-triggered animations
 * with staggered timing, reduced motion support, and multiple animation types
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
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    animationTypes: {
      'fade-in': 'fade-in',
      'fade-in-up': 'fade-in-up',
      'fade-in-down': 'fade-in-down',
      'fade-in-left': 'fade-in-left',
      'fade-in-right': 'fade-in-right',
      'slide-up': 'slide-up',
      'slide-down': 'slide-down',
      'slide-left': 'slide-left',
      'slide-right': 'slide-right',
      'scale': 'scale',
      'scale-up': 'scale-up',
      'zoom-in': 'zoom-in',
      'zoom-out': 'zoom-out'
    }
  };

  /**
   * Get utility functions from main module
   */
  const utils = window.LandingPage?.utils || {
    log: (msg, type) => {
      const method = type === 'error' ? console.error : type === 'warn' ? console.warn : console.log;
      method(`[Animations] ${msg}`);
    }
  };

  /**
   * Scroll Animation Manager
   * Manages scroll-triggered animations using Intersection Observer API
   */
  class ScrollAnimationManager {
    constructor() {
      this.elements = [];
      this.observer = null;
      this.initialized = false;
      this.animatedElements = new Set();
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
        utils.log('Reduced motion enabled - skipping scroll animations');
        this.makeAllVisible();
        return;
      }

      if (!('IntersectionObserver' in window)) {
        utils.log('IntersectionObserver not supported - making all elements visible', 'warn');
        this.makeAllVisible();
        return;
      }

      try {
        this.setupElements();
        this.createObserver();
        this.observeElements();

        this.initialized = true;
        utils.log(`Initialized scroll animations for ${this.elements.length} elements`);
      } catch (error) {
        utils.log(`Error initializing scroll animations: ${error.message}`, 'error');
        this.makeAllVisible();
      }
    }

    /**
     * Find and prepare all elements with data-reveal attribute
     */
    setupElements() {
      const revealElements = document.querySelectorAll('[data-reveal]');

      if (revealElements.length === 0) {
        utils.log('No elements with data-reveal attribute found');
        return;
      }

      revealElements.forEach((element, index) => {
        try {
          const delay = element.dataset.revealDelay || this.calculateStaggerDelay(index);
          const animationType = element.dataset.revealAnimation || 'fade-in-up';

          element.dataset.calculatedDelay = delay;
          element.dataset.animationType = animationType;

          element.classList.add('reveal-hidden');

          element.setAttribute('aria-hidden', 'true');

          this.elements.push(element);
        } catch (error) {
          utils.log(`Error setting up element: ${error.message}`, 'error');
        }
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
      const observerOptions = {
        threshold: animationConfig.threshold,
        rootMargin: animationConfig.rootMargin
      };

      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        observerOptions
      );
    }

    /**
     * Handle intersection events
     * @param {IntersectionObserverEntry[]} entries - Observed entries
     */
    handleIntersection(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
          this.revealElement(entry.target);
        }
      });
    }

    /**
     * Reveal an element with animation
     * @param {HTMLElement} element - Element to reveal
     */
    revealElement(element) {
      if (this.animatedElements.has(element)) {
        return;
      }

      const delay = parseInt(element.dataset.calculatedDelay || 0, 10);
      const animationType = element.dataset.animationType || 'fade-in-up';

      setTimeout(() => {
        try {
          element.classList.remove('reveal-hidden');
          element.classList.add('reveal-visible', `animate-${animationType}`);

          element.removeAttribute('aria-hidden');

          this.animatedElements.add(element);

          this.observer.unobserve(element);

          const event = new CustomEvent('revealed', {
            bubbles: true,
            detail: {
              element: element,
              animationType: animationType,
              delay: delay
            }
          });
          element.dispatchEvent(event);

          utils.log(`Revealed element: ${element.tagName}${element.className ? '.' + element.className.split(' ')[0] : ''} with ${animationType} animation`);
        } catch (error) {
          utils.log(`Error revealing element: ${error.message}`, 'error');
        }
      }, delay);
    }

    /**
     * Start observing all elements
     */
    observeElements() {
      this.elements.forEach(element => {
        try {
          this.observer.observe(element);
        } catch (error) {
          utils.log(`Error observing element: ${error.message}`, 'error');
        }
      });
    }

    /**
     * Make all reveal elements visible (fallback for reduced motion or no support)
     */
    makeAllVisible() {
      try {
        const revealElements = document.querySelectorAll('[data-reveal]');
        revealElements.forEach(element => {
          element.classList.remove('reveal-hidden');
          element.classList.add('reveal-visible');
          element.removeAttribute('aria-hidden');
          element.style.opacity = '1';
          element.style.transform = 'none';
          element.style.visibility = 'visible';
        });

        utils.log(`Made ${revealElements.length} elements visible (no animation)`);
      } catch (error) {
        utils.log(`Error making elements visible: ${error.message}`, 'error');
      }
    }

    /**
     * Refresh observer (useful after dynamic content addition)
     */
    refresh() {
      if (!this.observer) {
        utils.log('Cannot refresh - observer not initialized', 'warn');
        return;
      }

      try {
        this.elements = [];
        this.observer.disconnect();
        this.animatedElements.clear();
        this.setupElements();
        this.observeElements();

        utils.log('Scroll animations refreshed');
      } catch (error) {
        utils.log(`Error refreshing scroll animations: ${error.message}`, 'error');
      }
    }

    /**
     * Destroy observer and clean up
     */
    destroy() {
      try {
        if (this.observer) {
          this.observer.disconnect();
          this.observer = null;
        }

        this.elements = [];
        this.animatedElements.clear();
        this.initialized = false;

        utils.log('Scroll animations destroyed');
      } catch (error) {
        utils.log(`Error destroying scroll animations: ${error.message}`, 'error');
      }
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
      if (animationConfig.reducedMotion || !element) {
        return;
      }

      try {
        const validAnimationType = animationConfig.animationTypes[animationType] || 'fade-in-up';

        element.classList.add(`animate-${validAnimationType}`);

        const handleAnimationEnd = function() {
          element.classList.remove(`animate-${validAnimationType}`);
          element.removeEventListener('animationend', handleAnimationEnd);
        };

        element.addEventListener('animationend', handleAnimationEnd);

        utils.log(`Applied ${validAnimationType} animation to element`);
      } catch (error) {
        utils.log(`Error animating entrance: ${error.message}`, 'error');
      }
    },

    /**
     * Add pulse animation to element
     * @param {HTMLElement} element - Element to pulse
     * @param {number} duration - Duration in milliseconds
     */
    pulse(element, duration = 1000) {
      if (animationConfig.reducedMotion || !element) {
        return;
      }

      try {
        const originalAnimation = element.style.animation;
        element.style.animation = `pulse ${duration}ms ease-in-out`;

        setTimeout(() => {
          element.style.animation = originalAnimation;
        }, duration);

        utils.log('Applied pulse animation');
      } catch (error) {
        utils.log(`Error applying pulse animation: ${error.message}`, 'error');
      }
    },

    /**
     * Add shake animation to element (useful for form validation errors)
     * @param {HTMLElement} element - Element to shake
     */
    shake(element) {
      if (animationConfig.reducedMotion || !element) {
        return;
      }

      try {
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

        if (element.animate) {
          element.animate(keyframes, options);
          utils.log('Applied shake animation');
        } else {
          element.classList.add('shake');
          setTimeout(() => element.classList.remove('shake'), 400);
        }
      } catch (error) {
        utils.log(`Error applying shake animation: ${error.message}`, 'error');
      }
    },

    /**
     * Fade out element
     * @param {HTMLElement} element - Element to fade out
     * @param {Function} callback - Callback after fade completes
     */
    fadeOut(element, callback) {
      if (!element) {
        if (callback) callback();
        return;
      }

      if (animationConfig.reducedMotion) {
        element.style.display = 'none';
        if (callback) callback();
        return;
      }

      try {
        element.style.transition = 'opacity 300ms ease-out';
        element.style.opacity = '0';

        setTimeout(() => {
          element.style.display = 'none';
          if (callback) callback();
        }, 300);

        utils.log('Applied fade-out animation');
      } catch (error) {
        utils.log(`Error fading out element: ${error.message}`, 'error');
        if (callback) callback();
      }
    },

    /**
     * Fade in element
     * @param {HTMLElement} element - Element to fade in
     * @param {string} display - Display property value
     */
    fadeIn(element, display = 'block') {
      if (!element) {
        return;
      }

      if (animationConfig.reducedMotion) {
        element.style.display = display;
        element.style.opacity = '1';
        return;
      }

      try {
        element.style.display = display;
        element.style.opacity = '0';
        element.style.transition = 'opacity 300ms ease-in';

        requestAnimationFrame(() => {
          element.style.opacity = '1';
        });

        utils.log('Applied fade-in animation');
      } catch (error) {
        utils.log(`Error fading in element: ${error.message}`, 'error');
      }
    },

    /**
     * Slide element in from direction
     * @param {HTMLElement} element - Element to slide in
     * @param {string} direction - Direction (up, down, left, right)
     * @param {number} duration - Duration in milliseconds
     */
    slideIn(element, direction = 'up', duration = 400) {
      if (animationConfig.reducedMotion || !element) {
        return;
      }

      try {
        element.classList.add(`slide-in-${direction}`);

        setTimeout(() => {
          element.classList.remove(`slide-in-${direction}`);
        }, duration);

        utils.log(`Applied slide-in-${direction} animation`);
      } catch (error) {
        utils.log(`Error sliding in element: ${error.message}`, 'error');
      }
    },

    /**
     * Scale animation
     * @param {HTMLElement} element - Element to scale
     * @param {number} scale - Scale value (0.5-2.0)
     * @param {number} duration - Duration in milliseconds
     */
    scale(element, scale = 1.05, duration = 300) {
      if (animationConfig.reducedMotion || !element) {
        return;
      }

      try {
        const originalTransform = element.style.transform;
        element.style.transition = `transform ${duration}ms ease-out`;
        element.style.transform = `scale(${scale})`;

        setTimeout(() => {
          element.style.transform = originalTransform;
        }, duration);

        utils.log(`Applied scale animation (${scale})`);
      } catch (error) {
        utils.log(`Error applying scale animation: ${error.message}`, 'error');
      }
    }
  };

  /**
   * Initialize on DOM ready
   */
  function init() {
    try {
      const manager = new ScrollAnimationManager();
      manager.init();

      window.ScrollAnimations = {
        manager,
        utils: animationUtils,
        config: animationConfig
      };

      document.dispatchEvent(new CustomEvent('scrollAnimationsReady', {
        detail: {
          manager: manager,
          config: animationConfig
        }
      }));

      utils.log('Scroll animations module initialized');
    } catch (error) {
      utils.log(`Error initializing animations module: ${error.message}`, 'error');
    }
  }

  /**
   * DOM ready check
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /**
   * Listen for custom events to refresh animations
   */
  document.addEventListener('contentUpdated', () => {
    try {
      if (window.ScrollAnimations?.manager) {
        window.ScrollAnimations.manager.refresh();
        utils.log('Animations refreshed after content update');
      }
    } catch (error) {
      utils.log(`Error refreshing animations: ${error.message}`, 'error');
    }
  });

  /**
   * Listen for reduced motion preference changes
   */
  document.addEventListener('reducedMotionChange', (event) => {
    try {
      animationConfig.reducedMotion = event.detail.reducedMotion;

      if (animationConfig.reducedMotion && window.ScrollAnimations?.manager) {
        window.ScrollAnimations.manager.makeAllVisible();
        utils.log('Disabled animations due to reduced motion preference');
      }
    } catch (error) {
      utils.log(`Error handling reduced motion change: ${error.message}`, 'error');
    }
  });

})();
