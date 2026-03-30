/**
 * Interactions Module - User Interactions and Form Handling
 * Handles form validation with real-time feedback, mobile menu functionality,
 * button state management, honeypot spam protection, and accessible error messaging
 */

(function() {
  'use strict';

  /**
   * Get utility functions from main module
   */
  const utils = window.LandingPage?.utils || {
    log: (msg, type) => {
      const method = type === 'error' ? console.error : type === 'warn' ? console.warn : console.log;
      method(`[Interactions] ${msg}`);
    }
  };

  const animUtils = window.ScrollAnimations?.utils || {};

  /**
   * Configuration
   */
  const config = {
    formSubmitDelay: 1500,
    successMessageDuration: 5000,
    errorMessageDuration: 5000
  };

  /**
   * Mobile Menu Handler
   */
  class MobileMenuHandler {
    constructor() {
      this.menuToggle = document.querySelector('.mobile-menu-toggle');
      this.nav = document.querySelector('.nav');
      this.navList = document.querySelector('.nav-list');
      this.navLinks = document.querySelectorAll('.nav-link');
      this.isOpen = false;

      if (this.menuToggle && this.nav) {
        this.init();
      } else {
        utils.log('Mobile menu elements not found - skipping initialization');
      }
    }

    init() {
      try {
        this.menuToggle.addEventListener('click', () => this.toggle());

        this.navLinks.forEach(link => {
          link.addEventListener('click', () => this.close());
        });

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && this.isOpen) {
            this.close();
          }
        });

        document.addEventListener('click', (e) => {
          if (this.isOpen && !this.nav.contains(e.target) && !this.menuToggle.contains(e.target)) {
            this.close();
          }
        });

        utils.log('Mobile menu initialized');
      } catch (error) {
        utils.log(`Error initializing mobile menu: ${error.message}`, 'error');
      }
    }

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    open() {
      try {
        if (this.navList) {
          this.navList.classList.add('is-open');
        }

        this.menuToggle.setAttribute('aria-expanded', 'true');
        this.menuToggle.classList.add('is-active');

        document.body.style.overflow = 'hidden';

        this.isOpen = true;

        utils.log('Mobile menu opened');
      } catch (error) {
        utils.log(`Error opening mobile menu: ${error.message}`, 'error');
      }
    }

    close() {
      try {
        if (this.navList) {
          this.navList.classList.remove('is-open');
        }

        this.menuToggle.setAttribute('aria-expanded', 'false');
        this.menuToggle.classList.remove('is-active');

        document.body.style.overflow = '';

        this.isOpen = false;

        utils.log('Mobile menu closed');
      } catch (error) {
        utils.log(`Error closing mobile menu: ${error.message}`, 'error');
      }
    }
  }

  /**
   * Form Validation Handler
   */
  class FormValidator {
    constructor(formElement) {
      if (!formElement) {
        throw new Error('Form element is required');
      }

      this.form = formElement;
      this.fields = this.form.querySelectorAll('[required], [data-validate]');
      this.submitButton = this.form.querySelector('[type="submit"]');
      this.statusElement = this.form.querySelector('.form-status');
      this.honeypot = this.createHoneypot();

      this.init();
    }

    init() {
      try {
        this.form.noValidate = true;

        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        this.fields.forEach(field => {
          field.addEventListener('blur', () => this.validateField(field));
          field.addEventListener('input', () => this.clearFieldError(field));

          if (field.tagName === 'INPUT' && field.type === 'email') {
            field.addEventListener('input', utils.debounce(() => this.validateField(field), 500));
          }
        });

        utils.log(`Form validation initialized for: ${this.form.id || this.form.name || 'unnamed form'}`);
      } catch (error) {
        utils.log(`Error initializing form validation: ${error.message}`, 'error');
      }
    }

    /**
     * Create honeypot field for spam protection
     * @returns {HTMLElement}
     */
    createHoneypot() {
      try {
        const honeypot = document.createElement('input');
        honeypot.type = 'text';
        honeypot.name = 'website';
        honeypot.setAttribute('tabindex', '-1');
        honeypot.setAttribute('autocomplete', 'off');
        honeypot.setAttribute('aria-hidden', 'true');
        honeypot.style.cssText = 'position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0;';

        this.form.appendChild(honeypot);

        utils.log('Honeypot spam protection added');
        return honeypot;
      } catch (error) {
        utils.log(`Error creating honeypot: ${error.message}`, 'error');
        return null;
      }
    }

    /**
     * Validate a single field
     * @param {HTMLElement} field - Field to validate
     * @returns {boolean}
     */
    validateField(field) {
      try {
        const value = field.value.trim();
        const type = field.type;
        const fieldName = this.getFieldLabel(field);

        this.clearFieldError(field);

        if (!value && field.required) {
          this.showFieldError(field, `${fieldName} is required`);
          return false;
        }

        if (type === 'email' && value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            this.showFieldError(field, 'Please enter a valid email address');
            return false;
          }
        }

        if (type === 'tel' && value) {
          const phoneRegex = /^[\d\s\-\+\(\)]+$/;
          const digitCount = value.replace(/\D/g, '').length;

          if (!phoneRegex.test(value)) {
            this.showFieldError(field, 'Please enter a valid phone number');
            return false;
          }

          if (digitCount < 10) {
            this.showFieldError(field, 'Phone number must be at least 10 digits');
            return false;
          }
        }

        if (field.minLength && value.length > 0 && value.length < field.minLength) {
          this.showFieldError(field, `Minimum ${field.minLength} characters required`);
          return false;
        }

        if (field.maxLength && value.length > field.maxLength) {
          this.showFieldError(field, `Maximum ${field.maxLength} characters allowed`);
          return false;
        }

        if (field.pattern && value) {
          const pattern = new RegExp(field.pattern);
          if (!pattern.test(value)) {
            this.showFieldError(field, field.title || 'Please match the required format');
            return false;
          }
        }

        field.classList.add('is-valid');
        return true;
      } catch (error) {
        utils.log(`Error validating field: ${error.message}`, 'error');
        return false;
      }
    }

    /**
     * Validate entire form
     * @returns {boolean}
     */
    validateForm() {
      let isValid = true;
      let firstInvalidField = null;

      this.fields.forEach(field => {
        if (!this.validateField(field)) {
          isValid = false;
          if (!firstInvalidField) {
            firstInvalidField = field;
          }
        }
      });

      if (!isValid && firstInvalidField) {
        firstInvalidField.focus();
      }

      return isValid;
    }

    /**
     * Show field error
     * @param {HTMLElement} field - Field with error
     * @param {string} message - Error message
     */
    showFieldError(field, message) {
      try {
        field.classList.add('has-error');
        field.classList.remove('is-valid');

        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        let errorElement = formGroup.querySelector('.form-error');

        if (!errorElement) {
          errorElement = document.createElement('span');
          errorElement.className = 'form-error';
          errorElement.setAttribute('role', 'alert');
          errorElement.setAttribute('aria-live', 'polite');
          formGroup.appendChild(errorElement);
        }

        errorElement.textContent = message;

        if (animUtils.shake) {
          animUtils.shake(field);
        }

        field.setAttribute('aria-invalid', 'true');

        const errorId = `error-${field.id || field.name || Math.random().toString(36).substr(2, 9)}`;
        errorElement.id = errorId;
        field.setAttribute('aria-describedby', errorId);

        utils.log(`Field error: ${field.name} - ${message}`);
      } catch (error) {
        utils.log(`Error showing field error: ${error.message}`, 'error');
      }
    }

    /**
     * Clear field error
     * @param {HTMLElement} field - Field to clear error from
     */
    clearFieldError(field) {
      try {
        field.classList.remove('has-error');

        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        const errorElement = formGroup.querySelector('.form-error');
        if (errorElement) {
          errorElement.textContent = '';
          errorElement.remove();
        }

        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
      } catch (error) {
        utils.log(`Error clearing field error: ${error.message}`, 'error');
      }
    }

    /**
     * Get field label text
     * @param {HTMLElement} field - Field element
     * @returns {string}
     */
    getFieldLabel(field) {
      try {
        const formGroup = field.closest('.form-group');
        if (formGroup) {
          const label = formGroup.querySelector('.form-label, label');
          if (label) {
            return label.textContent.replace(/\*/g, '').trim();
          }
        }

        return field.placeholder || field.name || 'This field';
      } catch (error) {
        return 'This field';
      }
    }

    /**
     * Handle form submission
     * @param {Event} e - Submit event
     */
    async handleSubmit(e) {
      e.preventDefault();

      try {
        if (this.honeypot && this.honeypot.value) {
          utils.log('Spam detected via honeypot', 'warn');
          this.showFormMessage('Thank you! We will contact you soon.', 'success');
          return;
        }

        if (!this.validateForm()) {
          utils.log('Form validation failed', 'warn');
          return;
        }

        this.setButtonState('loading');

        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());

        if (this.honeypot) {
          delete data.website;
        }

        utils.log('Form submitted:', data);

        try {
          await this.submitForm(data);
        } catch (error) {
          utils.log(`Form submission error: ${error.message}`, 'error');
          this.showFormMessage('An error occurred. Please try again.', 'error');
        } finally {
          this.setButtonState('default');
        }
      } catch (error) {
        utils.log(`Error handling form submit: ${error.message}`, 'error');
        this.setButtonState('default');
      }
    }

    /**
     * Submit form data (simulated - replace with actual API call)
     * @param {Object} data - Form data
     * @returns {Promise}
     */
    async submitForm(data) {
      await new Promise(resolve => setTimeout(resolve, config.formSubmitDelay));

      this.setButtonState('success');

      this.showFormMessage('Thank you! We will contact you soon.', 'success');

      this.form.reset();

      this.fields.forEach(field => {
        field.classList.remove('is-valid', 'has-error');
      });

      setTimeout(() => {
        this.setButtonState('default');
      }, 2000);

      utils.log('Form submitted successfully');
    }

    /**
     * Set button state
     * @param {string} state - Button state (default, loading, success, error)
     */
    setButtonState(state) {
      if (!this.submitButton) return;

      try {
        this.submitButton.classList.remove('btn-loading', 'btn-success', 'btn-error');

        const btnText = this.submitButton.querySelector('.btn-text');
        const btnSpinner = this.submitButton.querySelector('.btn-spinner');

        if (state === 'loading') {
          this.submitButton.classList.add('btn-loading');
          this.submitButton.disabled = true;

          if (btnText) btnText.textContent = 'Sending...';
          if (btnSpinner) btnSpinner.style.display = 'inline-block';

          utils.log('Button state: loading');
        } else if (state === 'success') {
          this.submitButton.classList.add('btn-success');
          this.submitButton.disabled = false;

          if (btnText) btnText.textContent = 'Sent!';
          if (btnSpinner) btnSpinner.style.display = 'none';

          utils.log('Button state: success');
        } else if (state === 'error') {
          this.submitButton.classList.add('btn-error');
          this.submitButton.disabled = false;

          if (btnText) btnText.textContent = 'Try Again';
          if (btnSpinner) btnSpinner.style.display = 'none';

          utils.log('Button state: error');
        } else {
          this.submitButton.disabled = false;

          if (btnText) btnText.textContent = 'Send Message';
          if (btnSpinner) btnSpinner.style.display = 'none';

          utils.log('Button state: default');
        }
      } catch (error) {
        utils.log(`Error setting button state: ${error.message}`, 'error');
      }
    }

    /**
     * Show form message
     * @param {string} message - Message text
     * @param {string} type - Message type (success or error)
     */
    showFormMessage(message, type = 'success') {
      try {
        if (this.statusElement) {
          this.statusElement.textContent = message;
          this.statusElement.className = `form-status form-status-${type}`;
          this.statusElement.setAttribute('role', type === 'error' ? 'alert' : 'status');
          this.statusElement.setAttribute('aria-live', 'polite');

          const duration = type === 'error' ? config.errorMessageDuration : config.successMessageDuration;

          setTimeout(() => {
            if (animUtils.fadeOut) {
              animUtils.fadeOut(this.statusElement, () => {
                this.statusElement.textContent = '';
                this.statusElement.className = 'form-status';
              });
            } else {
              this.statusElement.textContent = '';
              this.statusElement.className = 'form-status';
            }
          }, duration);
        }

        utils.log(`Form message (${type}): ${message}`);
      } catch (error) {
        utils.log(`Error showing form message: ${error.message}`, 'error');
      }
    }
  }

  /**
   * Button Interaction Handler
   */
  class ButtonInteractionHandler {
    constructor() {
      this.buttons = document.querySelectorAll('.btn, button:not([type="submit"])');
      this.init();
    }

    init() {
      try {
        this.buttons.forEach(button => {
          button.addEventListener('mouseenter', () => this.handleHover(button, true));
          button.addEventListener('mouseleave', () => this.handleHover(button, false));
          button.addEventListener('mousedown', () => this.handlePress(button, true));
          button.addEventListener('mouseup', () => this.handlePress(button, false));
          button.addEventListener('focus', () => this.handleFocus(button, true));
          button.addEventListener('blur', () => this.handleFocus(button, false));
        });

        utils.log(`Button interactions initialized for ${this.buttons.length} buttons`);
      } catch (error) {
        utils.log(`Error initializing button interactions: ${error.message}`, 'error');
      }
    }

    handleHover(button, isHovering) {
      try {
        if (isHovering) {
          button.classList.add('is-hovering');
        } else {
          button.classList.remove('is-hovering');
        }
      } catch (error) {
        utils.log(`Error handling button hover: ${error.message}`, 'error');
      }
    }

    handlePress(button, isPressed) {
      try {
        if (isPressed) {
          button.classList.add('is-pressed');
        } else {
          button.classList.remove('is-pressed');
        }
      } catch (error) {
        utils.log(`Error handling button press: ${error.message}`, 'error');
      }
    }

    handleFocus(button, isFocused) {
      try {
        if (isFocused) {
          button.classList.add('is-focused');
        } else {
          button.classList.remove('is-focused');
        }
      } catch (error) {
        utils.log(`Error handling button focus: ${error.message}`, 'error');
      }
    }
  }

  /**
   * Smooth Scroll Enhancement (extends main module's smooth scrolling)
   */
  class SmoothScrollEnhancement {
    constructor() {
      this.init();
    }

    init() {
      try {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
          link.addEventListener('click', () => {
            utils.log(`Navigation to: ${link.getAttribute('href')}`);
          });
        });

        utils.log('Smooth scroll enhancement initialized');
      } catch (error) {
        utils.log(`Error initializing smooth scroll enhancement: ${error.message}`, 'error');
      }
    }
  }

  /**
   * Initialize all interaction handlers
   */
  function init() {
    try {
      new MobileMenuHandler();
      new ButtonInteractionHandler();
      new SmoothScrollEnhancement();

      const forms = document.querySelectorAll('form.contact-form, form[data-validate]');
      const validators = [];

      forms.forEach(form => {
        try {
          const validator = new FormValidator(form);
          validators.push(validator);
        } catch (error) {
          utils.log(`Error creating form validator: ${error.message}`, 'error');
        }
      });

      window.Interactions = {
        MobileMenuHandler,
        FormValidator,
        ButtonInteractionHandler,
        SmoothScrollEnhancement,
        validators
      };

      document.dispatchEvent(new CustomEvent('interactionsReady', {
        detail: {
          formsInitialized: validators.length
        }
      }));

      utils.log(`Interactions initialized (${validators.length} forms)`);
    } catch (error) {
      utils.log(`Error initializing interactions module: ${error.message}`, 'error');
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

})();
