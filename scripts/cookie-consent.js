/**
 * Cookie Consent Module - Massage Therapy Landing Page
 * GDPR/CCPA compliant cookie consent management
 * Features: granular controls, keyboard navigation, accessible design
 */

(function() {
  'use strict';

  /**
   * Configuration
   */
  const config = {
    consentKey: 'cookieConsent',
    analyticsConsentKey: 'analyticsConsent',
    preferencesKey: 'cookiePreferences',
    expiryDays: 365,
    showDelay: 1000,
    bannerVisible: false
  };

  /**
   * Consent state
   */
  const state = {
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  };

  /**
   * Log to console
   * @param {string} message
   * @param {string} type
   */
  function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [Cookie Consent]`;

    if (type === 'error') {
      console.error(`${prefix} ERROR:`, message);
    } else if (type === 'warn') {
      console.warn(`${prefix} WARN:`, message);
    } else {
      console.log(`${prefix}`, message);
    }
  }

  /**
   * Check if consent has been given
   * @returns {boolean}
   */
  function hasConsent() {
    try {
      const consent = localStorage.getItem(config.consentKey);
      return consent !== null;
    } catch (error) {
      log(`Error checking consent: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Get stored preferences
   * @returns {object}
   */
  function getStoredPreferences() {
    try {
      const stored = localStorage.getItem(config.preferencesKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          necessary: true,
          analytics: parsed.analytics || false,
          marketing: parsed.marketing || false,
          preferences: parsed.preferences || false
        };
      }
    } catch (error) {
      log(`Error reading preferences: ${error.message}`, 'error');
    }

    return {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
  }

  /**
   * Save consent preferences
   * @param {object} preferences
   */
  function savePreferences(preferences) {
    try {
      const timestamp = new Date().toISOString();

      localStorage.setItem(config.consentKey, timestamp);
      localStorage.setItem(config.preferencesKey, JSON.stringify(preferences));

      if (preferences.analytics) {
        localStorage.setItem(config.analyticsConsentKey, 'granted');
        document.dispatchEvent(new CustomEvent('consentGranted', {
          detail: { analytics: true }
        }));
        log('Analytics consent granted');
      } else {
        localStorage.setItem(config.analyticsConsentKey, 'denied');
        document.dispatchEvent(new CustomEvent('consentDenied', {
          detail: { analytics: false }
        }));
        log('Analytics consent denied');
      }

      Object.assign(state, preferences);

      document.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
        detail: preferences
      }));

      log(`Preferences saved: ${JSON.stringify(preferences)}`);
    } catch (error) {
      log(`Error saving preferences: ${error.message}`, 'error');
    }
  }

  /**
   * Create consent banner HTML
   * @returns {string}
   */
  function createBannerHTML() {
    return `
      <div id="cookie-consent-banner" class="cookie-consent-banner" role="dialog" aria-labelledby="cookie-consent-title" aria-describedby="cookie-consent-description" aria-modal="true">
        <div class="cookie-consent-container">
          <div class="cookie-consent-content">
            <h2 id="cookie-consent-title" class="cookie-consent-title">Your Privacy Matters</h2>
            <p id="cookie-consent-description" class="cookie-consent-description">
              We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
              By clicking "Accept All", you consent to our use of cookies.
              You can customize your preferences or learn more in our <a href="#privacy" class="cookie-consent-link">Privacy Policy</a>.
            </p>

            <div class="cookie-consent-actions">
              <button type="button" id="cookie-consent-accept-all" class="btn btn-primary cookie-consent-btn" aria-label="Accept all cookies">
                Accept All
              </button>
              <button type="button" id="cookie-consent-reject-all" class="btn btn-secondary cookie-consent-btn" aria-label="Reject all optional cookies">
                Reject All
              </button>
              <button type="button" id="cookie-consent-customize" class="btn btn-secondary cookie-consent-btn" aria-label="Customize cookie preferences">
                Customize
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="cookie-consent-preferences" class="cookie-consent-preferences" role="dialog" aria-labelledby="cookie-preferences-title" aria-modal="true" style="display: none;">
        <div class="cookie-consent-overlay"></div>
        <div class="cookie-preferences-modal">
          <div class="cookie-preferences-header">
            <h2 id="cookie-preferences-title" class="cookie-preferences-title">Cookie Preferences</h2>
            <button type="button" id="cookie-preferences-close" class="cookie-preferences-close" aria-label="Close preferences">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="cookie-preferences-body">
            <div class="cookie-category">
              <div class="cookie-category-header">
                <div class="cookie-category-info">
                  <h3 class="cookie-category-title">Necessary Cookies</h3>
                  <p class="cookie-category-description">Required for the website to function properly. Cannot be disabled.</p>
                </div>
                <div class="cookie-toggle">
                  <input type="checkbox" id="cookie-necessary" checked disabled aria-label="Necessary cookies (always enabled)">
                  <label for="cookie-necessary" class="cookie-toggle-label">
                    <span class="cookie-toggle-switch"></span>
                  </label>
                </div>
              </div>
            </div>

            <div class="cookie-category">
              <div class="cookie-category-header">
                <div class="cookie-category-info">
                  <h3 class="cookie-category-title">Analytics Cookies</h3>
                  <p class="cookie-category-description">Help us understand how visitors interact with our website by collecting and reporting information anonymously.</p>
                </div>
                <div class="cookie-toggle">
                  <input type="checkbox" id="cookie-analytics" aria-label="Analytics cookies">
                  <label for="cookie-analytics" class="cookie-toggle-label">
                    <span class="cookie-toggle-switch"></span>
                  </label>
                </div>
              </div>
            </div>

            <div class="cookie-category">
              <div class="cookie-category-header">
                <div class="cookie-category-info">
                  <h3 class="cookie-category-title">Marketing Cookies</h3>
                  <p class="cookie-category-description">Used to track visitors across websites to display relevant advertisements.</p>
                </div>
                <div class="cookie-toggle">
                  <input type="checkbox" id="cookie-marketing" aria-label="Marketing cookies">
                  <label for="cookie-marketing" class="cookie-toggle-label">
                    <span class="cookie-toggle-switch"></span>
                  </label>
                </div>
              </div>
            </div>

            <div class="cookie-category">
              <div class="cookie-category-header">
                <div class="cookie-category-info">
                  <h3 class="cookie-category-title">Preference Cookies</h3>
                  <p class="cookie-category-description">Enable the website to remember your choices (such as language or region).</p>
                </div>
                <div class="cookie-toggle">
                  <input type="checkbox" id="cookie-preferences" aria-label="Preference cookies">
                  <label for="cookie-preferences" class="cookie-toggle-label">
                    <span class="cookie-toggle-switch"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="cookie-preferences-footer">
            <button type="button" id="cookie-preferences-save" class="btn btn-primary cookie-preferences-btn" aria-label="Save cookie preferences">
              Save Preferences
            </button>
            <button type="button" id="cookie-preferences-accept-all" class="btn btn-secondary cookie-preferences-btn" aria-label="Accept all cookies">
              Accept All
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Inject consent banner styles
   */
  function injectStyles() {
    const styleId = 'cookie-consent-styles';

    if (document.getElementById(styleId)) {
      return;
    }

    const styles = `
      .cookie-consent-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #ffffff;
        box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideUp 0.3s ease-out;
      }

      @keyframes slideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }

      .cookie-consent-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1.5rem;
      }

      .cookie-consent-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .cookie-consent-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
        color: #1a1a1a;
      }

      .cookie-consent-description {
        font-size: 0.9rem;
        line-height: 1.6;
        margin: 0;
        color: #4a4a4a;
      }

      .cookie-consent-link {
        color: #007bff;
        text-decoration: underline;
      }

      .cookie-consent-link:hover {
        color: #0056b3;
      }

      .cookie-consent-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .cookie-consent-btn {
        padding: 0.75rem 1.5rem;
        font-size: 0.9rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
      }

      .cookie-consent-preferences {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .cookie-consent-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
      }

      .cookie-preferences-modal {
        position: relative;
        background: #ffffff;
        border-radius: 8px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      }

      .cookie-preferences-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e0e0e0;
      }

      .cookie-preferences-title {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0;
        color: #1a1a1a;
      }

      .cookie-preferences-close {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        color: #666;
        transition: color 0.2s ease;
      }

      .cookie-preferences-close:hover {
        color: #000;
      }

      .cookie-preferences-body {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
      }

      .cookie-category {
        margin-bottom: 1.5rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid #e0e0e0;
      }

      .cookie-category:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }

      .cookie-category-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
      }

      .cookie-category-info {
        flex: 1;
      }

      .cookie-category-title {
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        color: #1a1a1a;
      }

      .cookie-category-description {
        font-size: 0.9rem;
        line-height: 1.5;
        margin: 0;
        color: #666;
      }

      .cookie-toggle {
        flex-shrink: 0;
      }

      .cookie-toggle input[type="checkbox"] {
        display: none;
      }

      .cookie-toggle-label {
        display: block;
        width: 50px;
        height: 28px;
        background: #ccc;
        border-radius: 14px;
        position: relative;
        cursor: pointer;
        transition: background 0.3s ease;
      }

      .cookie-toggle input[type="checkbox"]:checked + .cookie-toggle-label {
        background: #007bff;
      }

      .cookie-toggle input[type="checkbox"]:disabled + .cookie-toggle-label {
        background: #007bff;
        opacity: 0.6;
        cursor: not-allowed;
      }

      .cookie-toggle-switch {
        display: block;
        width: 24px;
        height: 24px;
        background: #ffffff;
        border-radius: 12px;
        position: absolute;
        top: 2px;
        left: 2px;
        transition: transform 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .cookie-toggle input[type="checkbox"]:checked + .cookie-toggle-label .cookie-toggle-switch {
        transform: translateX(22px);
      }

      .cookie-preferences-footer {
        padding: 1.5rem;
        border-top: 1px solid #e0e0e0;
        display: flex;
        gap: 0.75rem;
      }

      .cookie-preferences-btn {
        flex: 1;
        padding: 0.75rem 1.5rem;
        font-size: 0.9rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
      }

      @media (max-width: 768px) {
        .cookie-consent-actions {
          flex-direction: column;
        }

        .cookie-consent-btn,
        .cookie-preferences-btn {
          width: 100%;
        }

        .cookie-preferences-footer {
          flex-direction: column;
        }
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

    log('Styles injected');
  }

  /**
   * Show consent banner
   */
  function showBanner() {
    if (config.bannerVisible) {
      return;
    }

    const bannerHTML = createBannerHTML();
    const container = document.createElement('div');
    container.innerHTML = bannerHTML;

    document.body.appendChild(container.firstElementChild);
    document.body.appendChild(container.lastElementChild);

    config.bannerVisible = true;

    attachEventListeners();

    const banner = document.getElementById('cookie-consent-banner');
    if (banner) {
      const firstButton = banner.querySelector('button');
      if (firstButton) {
        setTimeout(() => firstButton.focus(), 100);
      }
    }

    log('Banner displayed');
  }

  /**
   * Hide consent banner
   */
  function hideBanner() {
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) {
      banner.style.animation = 'slideDown 0.3s ease-out';
      setTimeout(() => {
        banner.remove();
        config.bannerVisible = false;
        log('Banner hidden');
      }, 300);
    }
  }

  /**
   * Show preferences modal
   */
  function showPreferences() {
    const modal = document.getElementById('cookie-consent-preferences');
    if (modal) {
      modal.style.display = 'flex';

      const storedPrefs = getStoredPreferences();
      document.getElementById('cookie-analytics').checked = storedPrefs.analytics;
      document.getElementById('cookie-marketing').checked = storedPrefs.marketing;
      document.getElementById('cookie-preferences').checked = storedPrefs.preferences;

      const firstToggle = modal.querySelector('input[type="checkbox"]:not([disabled])');
      if (firstToggle) {
        setTimeout(() => firstToggle.focus(), 100);
      }

      log('Preferences modal opened');
    }
  }

  /**
   * Hide preferences modal
   */
  function hidePreferences() {
    const modal = document.getElementById('cookie-consent-preferences');
    if (modal) {
      modal.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        modal.style.display = 'none';
        modal.style.animation = '';
      }, 300);

      log('Preferences modal closed');
    }
  }

  /**
   * Accept all cookies
   */
  function acceptAll() {
    const preferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    };

    savePreferences(preferences);
    hideBanner();
    hidePreferences();

    log('All cookies accepted');
  }

  /**
   * Reject all optional cookies
   */
  function rejectAll() {
    const preferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    };

    savePreferences(preferences);
    hideBanner();
    hidePreferences();

    log('Optional cookies rejected');
  }

  /**
   * Save custom preferences
   */
  function saveCustomPreferences() {
    const preferences = {
      necessary: true,
      analytics: document.getElementById('cookie-analytics').checked,
      marketing: document.getElementById('cookie-marketing').checked,
      preferences: document.getElementById('cookie-preferences').checked
    };

    savePreferences(preferences);
    hideBanner();
    hidePreferences();

    log('Custom preferences saved');
  }

  /**
   * Attach event listeners
   */
  function attachEventListeners() {
    const acceptAllBtn = document.getElementById('cookie-consent-accept-all');
    const rejectAllBtn = document.getElementById('cookie-consent-reject-all');
    const customizeBtn = document.getElementById('cookie-consent-customize');
    const closeBtn = document.getElementById('cookie-preferences-close');
    const saveBtn = document.getElementById('cookie-preferences-save');
    const acceptAllPrefsBtn = document.getElementById('cookie-preferences-accept-all');
    const overlay = document.querySelector('.cookie-consent-overlay');

    if (acceptAllBtn) {
      acceptAllBtn.addEventListener('click', acceptAll);
    }

    if (rejectAllBtn) {
      rejectAllBtn.addEventListener('click', rejectAll);
    }

    if (customizeBtn) {
      customizeBtn.addEventListener('click', showPreferences);
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', hidePreferences);
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', saveCustomPreferences);
    }

    if (acceptAllPrefsBtn) {
      acceptAllPrefsBtn.addEventListener('click', acceptAll);
    }

    if (overlay) {
      overlay.addEventListener('click', hidePreferences);
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        hidePreferences();
      }
    });

    log('Event listeners attached');
  }

  /**
   * Initialize cookie consent module
   */
  function init() {
    log('='.repeat(60));
    log('Cookie Consent Module Initialization');
    log('='.repeat(60));

    injectStyles();

    if (hasConsent()) {
      const storedPrefs = getStoredPreferences();
      Object.assign(state, storedPrefs);
      log(`Existing consent found: ${JSON.stringify(storedPrefs)}`);

      if (storedPrefs.analytics) {
        document.dispatchEvent(new CustomEvent('consentGranted', {
          detail: { analytics: true }
        }));
      }
    } else {
      setTimeout(() => {
        showBanner();
      }, config.showDelay);
    }

    log('Cookie consent module ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.CookieConsent = {
    showBanner: showBanner,
    showPreferences: showPreferences,
    acceptAll: acceptAll,
    rejectAll: rejectAll,
    hasConsent: hasConsent,
    getPreferences: getStoredPreferences,
    version: '1.0.0'
  };

})();
