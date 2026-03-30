/**
 * Lazy Loading Module - Image Performance Optimization
 * Implements Intersection Observer for lazy loading images with WebP format detection,
 * progressive loading with blur-up effect, error handling for failed loads,
 * and responsive srcset support for optimal performance across devices.
 */

(function() {
  'use strict';

  /**
   * Configuration for lazy loading behavior
   */
  const config = {
    rootMargin: '50px 0px',
    threshold: 0.01,
    loadDelay: 100,
    retryAttempts: 3,
    retryDelay: 1000,
    blurUpDuration: 300,
    placeholderColor: '#f0f0f0',
    enableWebP: true,
    enableLogging: true
  };

  /**
   * State management
   */
  const state = {
    observer: null,
    loadedImages: new Set(),
    failedImages: new Map(),
    supportsWebP: false,
    supportsIntersectionObserver: 'IntersectionObserver' in window,
    imageLoadMetrics: []
  };

  /**
   * Utility functions
   */
  const utils = {
    /**
     * Log messages with timestamp
     * @param {string} message - Message to log
     * @param {string} type - Log type (info, warn, error)
     */
    log(message, type = 'info') {
      if (!config.enableLogging) return;

      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [Lazy Loading]`;

      switch (type) {
        case 'error':
          console.error(`${prefix} ERROR:`, message);
          break;
        case 'warn':
          console.warn(`${prefix} WARN:`, message);
          break;
        default:
          console.log(`${prefix}`, message);
      }
    },

    /**
     * Check if element is already loaded
     * @param {HTMLImageElement} img - Image element
     * @returns {boolean}
     */
    isLoaded(img) {
      return state.loadedImages.has(img);
    },

    /**
     * Mark image as loaded
     * @param {HTMLImageElement} img - Image element
     */
    markAsLoaded(img) {
      state.loadedImages.add(img);
    },

    /**
     * Get retry count for failed image
     * @param {HTMLImageElement} img - Image element
     * @returns {number}
     */
    getRetryCount(img) {
      return state.failedImages.get(img) || 0;
    },

    /**
     * Increment retry count
     * @param {HTMLImageElement} img - Image element
     */
    incrementRetryCount(img) {
      const count = this.getRetryCount(img);
      state.failedImages.set(img, count + 1);
    },

    /**
     * Record image load metric
     * @param {HTMLImageElement} img - Image element
     * @param {number} loadTime - Load time in milliseconds
     */
    recordMetric(img, loadTime) {
      state.imageLoadMetrics.push({
        src: img.currentSrc || img.src,
        loadTime: loadTime,
        timestamp: Date.now()
      });
    }
  };

  /**
   * WebP format detection
   */
  function detectWebPSupport() {
    return new Promise((resolve) => {
      if (!config.enableWebP) {
        resolve(false);
        return;
      }

      const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
      const img = new Image();

      img.onload = () => {
        const supported = img.width === 1 && img.height === 1;
        state.supportsWebP = supported;
        utils.log(`WebP support detected: ${supported}`);
        resolve(supported);
      };

      img.onerror = () => {
        state.supportsWebP = false;
        utils.log('WebP not supported');
        resolve(false);
      };

      img.src = webpData;
    });
  }

  /**
   * Convert image URL to WebP if supported
   * @param {string} url - Original image URL
   * @returns {string} - WebP URL or original URL
   */
  function getWebPUrl(url) {
    if (!state.supportsWebP || !url) return url;

    try {
      const urlObj = new URL(url, window.location.href);

      if (urlObj.hostname.includes('unsplash.com')) {
        urlObj.searchParams.set('fm', 'webp');
        return urlObj.toString();
      }

      if (url.match(/\.(jpg|jpeg|png)$/i)) {
        return url.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      }
    } catch (error) {
      utils.log(`Error converting to WebP: ${error.message}`, 'warn');
    }

    return url;
  }

  /**
   * Apply blur-up effect to image
   * @param {HTMLImageElement} img - Image element
   */
  function applyBlurUpEffect(img) {
    img.style.filter = 'blur(10px)';
    img.style.transform = 'scale(1.05)';
    img.style.transition = `filter ${config.blurUpDuration}ms ease-out, transform ${config.blurUpDuration}ms ease-out`;
  }

  /**
   * Remove blur-up effect from image
   * @param {HTMLImageElement} img - Image element
   */
  function removeBlurUpEffect(img) {
    img.style.filter = 'blur(0)';
    img.style.transform = 'scale(1)';

    setTimeout(() => {
      img.style.filter = '';
      img.style.transform = '';
      img.style.transition = '';
    }, config.blurUpDuration);
  }

  /**
   * Create and insert placeholder for image
   * @param {HTMLImageElement} img - Image element
   */
  function createPlaceholder(img) {
    if (img.style.backgroundColor) return;

    const width = img.getAttribute('width');
    const height = img.getAttribute('height');

    if (width && height) {
      const aspectRatio = (parseFloat(height) / parseFloat(width)) * 100;
      const wrapper = img.parentElement;

      if (wrapper && !wrapper.style.paddingBottom) {
        img.style.backgroundColor = config.placeholderColor;
      }
    }
  }

  /**
   * Load image with retry logic
   * @param {HTMLImageElement} img - Image element
   * @param {string} src - Image source URL
   * @param {string|null} srcset - Image srcset attribute
   * @returns {Promise<void>}
   */
  function loadImage(img, src, srcset = null) {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();

      const onLoad = () => {
        const loadTime = performance.now() - startTime;
        utils.recordMetric(img, loadTime);
        utils.log(`Image loaded: ${src} (${loadTime.toFixed(2)}ms)`);

        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);

        resolve();
      };

      const onError = () => {
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);

        const retryCount = utils.getRetryCount(img);

        if (retryCount < config.retryAttempts) {
          utils.incrementRetryCount(img);
          utils.log(`Image load failed, retry ${retryCount + 1}/${config.retryAttempts}: ${src}`, 'warn');

          setTimeout(() => {
            loadImage(img, src, srcset)
              .then(resolve)
              .catch(reject);
          }, config.retryDelay * (retryCount + 1));
        } else {
          utils.log(`Image load failed after ${config.retryAttempts} attempts: ${src}`, 'error');
          reject(new Error(`Failed to load image: ${src}`));
        }
      };

      img.addEventListener('load', onLoad);
      img.addEventListener('error', onError);

      const webpSrc = getWebPUrl(src);

      if (srcset) {
        img.srcset = srcset;
      }

      img.src = webpSrc;
    });
  }

  /**
   * Handle image load error with fallback
   * @param {HTMLImageElement} img - Image element
   * @param {Error} error - Error object
   */
  function handleImageError(img, error) {
    utils.log(`Handling image error: ${error.message}`, 'error');

    img.classList.add('lazy-load-error');
    img.alt = img.alt || 'Image failed to load';

    img.style.backgroundColor = '#f8d7da';
    img.style.border = '1px solid #f5c6cb';
    img.style.minHeight = '200px';
    img.style.display = 'flex';
    img.style.alignItems = 'center';
    img.style.justifyContent = 'center';

    const errorIcon = document.createElement('span');
    errorIcon.textContent = '⚠ Image unavailable';
    errorIcon.style.color = '#721c24';
    errorIcon.style.fontFamily = 'system-ui, sans-serif';
    errorIcon.style.fontSize = '14px';
    errorIcon.setAttribute('aria-hidden', 'true');

    if (img.parentElement && !img.nextElementSibling) {
      img.parentElement.appendChild(errorIcon);
    }
  }

  /**
   * Process image element for lazy loading
   * @param {HTMLImageElement} img - Image element
   * @returns {Promise<void>}
   */
  async function processImage(img) {
    if (utils.isLoaded(img)) {
      return;
    }

    const dataSrc = img.getAttribute('data-src');
    const dataSrcset = img.getAttribute('data-srcset');

    if (!dataSrc) {
      utils.log('Image missing data-src attribute', 'warn');
      return;
    }

    try {
      createPlaceholder(img);

      if (img.complete && img.naturalHeight !== 0) {
        applyBlurUpEffect(img);
      }

      img.classList.add('lazy-loading');

      await new Promise(resolve => setTimeout(resolve, config.loadDelay));

      await loadImage(img, dataSrc, dataSrcset);

      removeBlurUpEffect(img);

      img.removeAttribute('data-src');
      img.removeAttribute('data-srcset');

      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');

      utils.markAsLoaded(img);

      const loadEvent = new CustomEvent('lazyload', {
        detail: { src: img.currentSrc || img.src }
      });
      img.dispatchEvent(loadEvent);

      if (typeof document.fonts !== 'undefined') {
        document.fonts.ready.then(() => {
          const layoutEvent = new CustomEvent('layoutstable', {
            detail: { element: img }
          });
          document.dispatchEvent(layoutEvent);
        });
      }

    } catch (error) {
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-load-failed');
      handleImageError(img, error);
    }
  }

  /**
   * Intersection Observer callback
   * @param {IntersectionObserverEntry[]} entries - Observer entries
   * @param {IntersectionObserver} observer - Observer instance
   */
  function onIntersection(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;

        utils.log(`Image entering viewport: ${img.getAttribute('data-src') || img.src}`);

        processImage(img);

        observer.unobserve(img);
      }
    });
  }

  /**
   * Initialize Intersection Observer
   * @returns {IntersectionObserver|null}
   */
  function initObserver() {
    if (!state.supportsIntersectionObserver) {
      utils.log('IntersectionObserver not supported', 'warn');
      return null;
    }

    try {
      const observer = new IntersectionObserver(onIntersection, {
        root: null,
        rootMargin: config.rootMargin,
        threshold: config.threshold
      });

      utils.log('IntersectionObserver initialized successfully');
      return observer;
    } catch (error) {
      utils.log(`Failed to initialize IntersectionObserver: ${error.message}`, 'error');
      return null;
    }
  }

  /**
   * Observe images for lazy loading
   * @param {NodeList|HTMLImageElement[]} images - Images to observe
   */
  function observeImages(images) {
    if (!state.observer) {
      utils.log('Observer not initialized', 'error');
      return;
    }

    images.forEach(img => {
      if (img.hasAttribute('data-src') && !utils.isLoaded(img)) {
        state.observer.observe(img);
      }
    });

    utils.log(`Observing ${images.length} images for lazy loading`);
  }

  /**
   * Fallback for browsers without IntersectionObserver
   */
  function fallbackLoad() {
    utils.log('Using fallback loading method', 'warn');

    const images = document.querySelectorAll('img[data-src]');

    images.forEach(img => {
      const dataSrc = img.getAttribute('data-src');
      if (dataSrc) {
        img.src = dataSrc;

        if (img.hasAttribute('data-srcset')) {
          img.srcset = img.getAttribute('data-srcset');
          img.removeAttribute('data-srcset');
        }

        img.removeAttribute('data-src');
        img.classList.add('lazy-loaded');
      }
    });

    utils.log(`Fallback loaded ${images.length} images`);
  }

  /**
   * Get performance statistics
   * @returns {Object}
   */
  function getStats() {
    const metrics = state.imageLoadMetrics;

    if (metrics.length === 0) {
      return { count: 0, avgLoadTime: 0, totalLoadTime: 0 };
    }

    const totalLoadTime = metrics.reduce((sum, m) => sum + m.loadTime, 0);
    const avgLoadTime = totalLoadTime / metrics.length;

    return {
      count: metrics.length,
      avgLoadTime: avgLoadTime.toFixed(2),
      totalLoadTime: totalLoadTime.toFixed(2),
      metrics: metrics
    };
  }

  /**
   * Initialize lazy loading system
   */
  async function init() {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('lazy-loading-init-start');
    }

    utils.log('='.repeat(60));
    utils.log('Lazy Loading Module - Initialization Started');
    utils.log('='.repeat(60));

    try {
      await detectWebPSupport();

      if (!state.supportsIntersectionObserver) {
        utils.log('IntersectionObserver not available, using fallback', 'warn');
        fallbackLoad();
        return;
      }

      state.observer = initObserver();

      if (!state.observer) {
        utils.log('Failed to create observer, using fallback', 'error');
        fallbackLoad();
        return;
      }

      const lazyImages = document.querySelectorAll('img[data-src]');

      if (lazyImages.length === 0) {
        utils.log('No images with data-src attribute found');
        return;
      }

      observeImages(lazyImages);

      const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) {
                const newImages = node.querySelectorAll ?
                  node.querySelectorAll('img[data-src]') :
                  [];

                if (node.tagName === 'IMG' && node.hasAttribute('data-src')) {
                  observeImages([node]);
                } else if (newImages.length > 0) {
                  observeImages(newImages);
                }
              }
            });
          }
        });
      });

      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });

      if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
        performance.mark('lazy-loading-init-end');
        performance.measure('lazy-loading-initialization', 'lazy-loading-init-start', 'lazy-loading-init-end');

        const initMeasure = performance.getEntriesByName('lazy-loading-initialization')[0];
        if (initMeasure) {
          utils.log(`Initialization complete in ${initMeasure.duration.toFixed(2)}ms`);
        }
      }

      document.dispatchEvent(new CustomEvent('lazyLoadingReady', {
        detail: {
          supportsWebP: state.supportsWebP,
          supportsIntersectionObserver: state.supportsIntersectionObserver,
          imageCount: lazyImages.length
        }
      }));

      utils.log('='.repeat(60));
      utils.log(`Lazy loading initialized successfully for ${lazyImages.length} images`);
      utils.log(`WebP support: ${state.supportsWebP}`);
      utils.log('='.repeat(60));

    } catch (error) {
      utils.log(`Critical initialization error: ${error.message}`, 'error');
      console.error('Stack trace:', error);
      fallbackLoad();
    }
  }

  /**
   * Global error handler
   */
  window.addEventListener('error', (event) => {
    if (event.target && event.target.tagName === 'IMG') {
      const img = event.target;
      if (img.hasAttribute('data-src')) {
        utils.log(`Image load error caught: ${img.getAttribute('data-src')}`, 'error');
      }
    }
  }, true);

  /**
   * DOM ready handler
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /**
   * Export to global scope
   */
  window.LazyLoading = {
    init: init,
    processImage: processImage,
    getStats: getStats,
    config: config,
    state: state,
    version: '1.0.0'
  };

})();
