/**
 * Analytics Module - Massage Therapy Landing Page
 * Privacy-compliant analytics with consent management
 * Tracks key events: CTA clicks, form submissions, scroll depth
 */

(function() {
  'use strict';

  /**
   * Analytics configuration
   */
  const config = {
    enabled: false,
    analyticsId: 'UA-XXXXXXXXX-X',
    trackingConsent: false,
    debug: false,
    scrollThresholds: [25, 50, 75, 90, 100],
    scrollTracked: new Set(),
    sessionId: null,
    pageLoadTime: Date.now()
  };

  /**
   * Generate unique session ID
   * @returns {string}
   */
  function generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log to console with context
   * @param {string} message
   * @param {string} type
   */
  function log(message, type = 'info') {
    if (!config.debug) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [Analytics]`;

    if (type === 'error') {
      console.error(`${prefix} ERROR:`, message);
    } else if (type === 'warn') {
      console.warn(`${prefix} WARN:`, message);
    } else {
      console.log(`${prefix}`, message);
    }
  }

  /**
   * Check if consent has been granted
   * @returns {boolean}
   */
  function hasConsent() {
    try {
      const consent = localStorage.getItem('analyticsConsent');
      return consent === 'granted';
    } catch (error) {
      log(`Error checking consent: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Initialize Google Analytics (if consent granted)
   */
  function initGoogleAnalytics() {
    if (!config.trackingConsent) {
      log('Analytics disabled - no consent', 'warn');
      return;
    }

    try {
      if (typeof gtag !== 'undefined') {
        gtag('js', new Date());
        gtag('config', config.analyticsId, {
          'anonymize_ip': true,
          'cookie_flags': 'SameSite=None;Secure'
        });
        log('Google Analytics initialized');
      }
    } catch (error) {
      log(`Error initializing Google Analytics: ${error.message}`, 'error');
    }
  }

  /**
   * Initialize Plausible Analytics (privacy-friendly alternative)
   */
  function initPlausibleAnalytics() {
    try {
      if (typeof plausible !== 'undefined') {
        log('Plausible Analytics detected');
      }
    } catch (error) {
      log(`Error initializing Plausible: ${error.message}`, 'error');
    }
  }

  /**
   * Track custom event
   * @param {string} category
   * @param {string} action
   * @param {string} label
   * @param {number} value
   */
  function trackEvent(category, action, label = '', value = 0) {
    if (!config.enabled || !config.trackingConsent) {
      log(`Event blocked (no consent): ${category} - ${action}`, 'warn');
      return;
    }

    try {
      const eventData = {
        event_category: category,
        event_label: label,
        value: value,
        session_id: config.sessionId,
        timestamp: new Date().toISOString()
      };

      if (typeof gtag !== 'undefined') {
        gtag('event', action, eventData);
        log(`Event tracked (GA): ${category} - ${action} - ${label}`);
      }

      if (typeof plausible !== 'undefined') {
        plausible(action, {
          props: {
            category: category,
            label: label
          }
        });
        log(`Event tracked (Plausible): ${category} - ${action}`);
      }

      if (!gtag && !plausible) {
        log(`Event logged (no analytics): ${category} - ${action} - ${label}`);
      }
    } catch (error) {
      log(`Error tracking event: ${error.message}`, 'error');
    }
  }

  /**
   * Track page view
   */
  function trackPageView() {
    if (!config.enabled || !config.trackingConsent) {
      return;
    }

    try {
      const pageData = {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname,
        session_id: config.sessionId
      };

      if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', pageData);
        log('Page view tracked');
      }

      if (typeof plausible !== 'undefined') {
        plausible('pageview');
        log('Page view tracked (Plausible)');
      }
    } catch (error) {
      log(`Error tracking page view: ${error.message}`, 'error');
    }
  }

  /**
   * Track CTA click events
   */
  function trackCTAClicks() {
    try {
      const ctaButtons = document.querySelectorAll('.btn-primary, .btn-secondary, [data-track-cta]');

      ctaButtons.forEach(button => {
        button.addEventListener('click', function(e) {
          const buttonText = this.textContent.trim();
          const buttonHref = this.getAttribute('href') || '';
          const buttonClass = this.className;

          trackEvent('CTA', 'click', `${buttonText} - ${buttonHref}`, 1);
          log(`CTA clicked: ${buttonText}`);
        });
      });

      log(`Initialized CTA tracking for ${ctaButtons.length} buttons`);
    } catch (error) {
      log(`Error tracking CTA clicks: ${error.message}`, 'error');
    }
  }

  /**
   * Track form submissions
   */
  function trackFormSubmissions() {
    try {
      const forms = document.querySelectorAll('form, [data-track-form]');

      forms.forEach(form => {
        form.addEventListener('submit', function(e) {
          const formId = this.id || 'unnamed-form';
          const formAction = this.action || 'no-action';

          trackEvent('Form', 'submit', formId, 1);
          log(`Form submitted: ${formId}`);
        });
      });

      log(`Initialized form tracking for ${forms.length} forms`);
    } catch (error) {
      log(`Error tracking form submissions: ${error.message}`, 'error');
    }
  }

  /**
   * Track scroll depth
   */
  function trackScrollDepth() {
    try {
      let ticking = false;

      const handleScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrollPercent = Math.round((scrollTop / scrollHeight) * 100);

            config.scrollThresholds.forEach(threshold => {
              if (scrollPercent >= threshold && !config.scrollTracked.has(threshold)) {
                config.scrollTracked.add(threshold);
                trackEvent('Scroll', 'depth', `${threshold}%`, threshold);
                log(`Scroll depth: ${threshold}%`);
              }
            });

            ticking = false;
          });
          ticking = true;
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      log('Scroll depth tracking initialized');
    } catch (error) {
      log(`Error tracking scroll depth: ${error.message}`, 'error');
    }
  }

  /**
   * Track navigation link clicks
   */
  function trackNavigation() {
    try {
      const navLinks = document.querySelectorAll('.nav-link, .footer-link');

      navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          const linkText = this.textContent.trim();
          const linkHref = this.getAttribute('href') || '';

          trackEvent('Navigation', 'click', `${linkText} - ${linkHref}`, 1);
          log(`Navigation clicked: ${linkText}`);
        });
      });

      log(`Initialized navigation tracking for ${navLinks.length} links`);
    } catch (error) {
      log(`Error tracking navigation: ${error.message}`, 'error');
    }
  }

  /**
   * Track outbound links
   */
  function trackOutboundLinks() {
    try {
      const externalLinks = document.querySelectorAll('a[href^="http"]');
      let outboundCount = 0;

      externalLinks.forEach(link => {
        try {
          const linkHostname = new URL(link.href).hostname;
          if (linkHostname !== window.location.hostname) {
            link.addEventListener('click', function(e) {
              trackEvent('Outbound', 'click', this.href, 1);
              log(`Outbound link clicked: ${this.href}`);
            });
            outboundCount++;
          }
        } catch (error) {
          log(`Invalid URL: ${link.href}`, 'warn');
        }
      });

      log(`Initialized outbound link tracking for ${outboundCount} links`);
    } catch (error) {
      log(`Error tracking outbound links: ${error.message}`, 'error');
    }
  }

  /**
   * Track time on page
   */
  function trackTimeOnPage() {
    try {
      const trackEngagement = () => {
        const timeOnPage = Math.round((Date.now() - config.pageLoadTime) / 1000);

        if (timeOnPage >= 30 && timeOnPage < 35) {
          trackEvent('Engagement', 'time_on_page', '30_seconds', 30);
        } else if (timeOnPage >= 60 && timeOnPage < 65) {
          trackEvent('Engagement', 'time_on_page', '1_minute', 60);
        } else if (timeOnPage >= 180 && timeOnPage < 185) {
          trackEvent('Engagement', 'time_on_page', '3_minutes', 180);
        } else if (timeOnPage >= 300 && timeOnPage < 305) {
          trackEvent('Engagement', 'time_on_page', '5_minutes', 300);
        }
      };

      setInterval(trackEngagement, 5000);
      log('Time on page tracking initialized');
    } catch (error) {
      log(`Error tracking time on page: ${error.message}`, 'error');
    }
  }

  /**
   * Track visibility changes
   */
  function trackVisibility() {
    try {
      let visibilityChange;
      let hidden;

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
          trackEvent('Engagement', 'visibility', isHidden ? 'hidden' : 'visible', isHidden ? 0 : 1);
        });

        log('Visibility tracking initialized');
      }
    } catch (error) {
      log(`Error tracking visibility: ${error.message}`, 'error');
    }
  }

  /**
   * Enable analytics with consent
   */
  function enable() {
    if (config.enabled) {
      log('Analytics already enabled', 'warn');
      return;
    }

    config.enabled = true;
    config.trackingConsent = true;

    try {
      localStorage.setItem('analyticsConsent', 'granted');
      log('Analytics consent granted and saved');
    } catch (error) {
      log(`Error saving consent: ${error.message}`, 'error');
    }

    initGoogleAnalytics();
    initPlausibleAnalytics();
    trackPageView();
    trackCTAClicks();
    trackFormSubmissions();
    trackScrollDepth();
    trackNavigation();
    trackOutboundLinks();
    trackTimeOnPage();
    trackVisibility();

    log('='.repeat(60));
    log('Analytics enabled with full tracking');
    log('='.repeat(60));
  }

  /**
   * Disable analytics and clear consent
   */
  function disable() {
    config.enabled = false;
    config.trackingConsent = false;

    try {
      localStorage.setItem('analyticsConsent', 'denied');
      log('Analytics consent denied and saved');
    } catch (error) {
      log(`Error saving consent: ${error.message}`, 'error');
    }

    log('Analytics disabled');
  }

  /**
   * Initialize analytics module
   */
  function init() {
    config.sessionId = generateSessionId();
    config.debug = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    log('='.repeat(60));
    log('Analytics Module Initialization');
    log('='.repeat(60));
    log(`Session ID: ${config.sessionId}`);
    log(`Debug mode: ${config.debug}`);

    const consentStatus = hasConsent();
    log(`Stored consent status: ${consentStatus ? 'granted' : 'denied'}`);

    if (consentStatus) {
      enable();
    } else {
      log('Waiting for user consent');
    }

    document.addEventListener('consentGranted', function() {
      log('Consent granted event received');
      enable();
    });

    document.addEventListener('consentDenied', function() {
      log('Consent denied event received');
      disable();
    });

    log('Analytics module ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.Analytics = {
    enable: enable,
    disable: disable,
    trackEvent: trackEvent,
    trackPageView: trackPageView,
    hasConsent: hasConsent,
    version: '1.0.0'
  };

})();
