/**
 * Interactions Module - User Interactions and Form Handling
 * Handles form validation, button interactions, mobile menu, and UI interactions
 */

(function() {
  'use strict';

  /**
   * Get utility functions from main module
   */
  const utils = window.LandingPage?.utils || {
    log: (msg, type) => console.log(msg)
  };

  const animUtils = window.ScrollAnimations?.utils || {};

  /**
   * Mobile Menu Handler
   */
  class MobileMenuHandler {
    constructor() {
      this.menuToggle = document.querySelector('.nav-toggle');
      this.menu = document.querySelector('.nav-menu');
      this.menuLinks = document.querySelectorAll('.nav-menu .nav-link');
      this.isOpen = false;

      if (this.menuToggle && this.menu) {
        this.init();
      }
    }

    init() {
      this.menuToggle.addEventListener('click', () => this.toggle());

      this.menuLinks.forEach(link => {
        link.addEventListener('click', () => this.close());
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });

      utils.log('Mobile menu initialized');
    }

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    open() {
      this.menu.classList.add('is-open');
      this.menuToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      this.isOpen = true;

      utils.log('Mobile menu opened');
    }

    close() {
      this.menu.classList.remove('is-open');
      this.menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      this.isOpen = false;

      utils.log('Mobile menu closed');
    }
  }

  /**
   * Form Validation Handler
   */
  class FormValidator {
    constructor(formElement) {
      this.form = formElement;
      this.fields = this.form.querySelectorAll('[required]');
      this.submitButton = this.form.querySelector('[type="submit"]');
      this.init();
    }

    init() {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));

      this.fields.forEach(field => {
        field.addEventListener('blur', () => this.validateField(field));
        field.addEventListener('input', () => this.clearFieldError(field));
      });

      utils.log(`Form validation initialized for: ${this.form.id || 'unnamed form'}`);
    }

    validateField(field) {
      const value = field.value.trim();
      const type = field.type;
      const fieldName = field.name || field.id || 'field';

      this.clearFieldError(field);

      if (!value && field.required) {
        this.showFieldError(field, `${this.getFieldLabel(field)} is required`);
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
        if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
          this.showFieldError(field, 'Please enter a valid phone number');
          return false;
        }
      }

      if (field.minLength && value.length < field.minLength) {
        this.showFieldError(field, `Minimum ${field.minLength} characters required`);
        return false;
      }

      return true;
    }

    validateForm() {
      let isValid = true;

      this.fields.forEach(field => {
        if (!this.validateField(field)) {
          isValid = false;
        }
      });

      return isValid;
    }

    showFieldError(field, message) {
      field.classList.add('has-error');

      let errorElement = field.parentElement.querySelector('.form-error');

      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'form-error';
        errorElement.setAttribute('role', 'alert');
        field.parentElement.appendChild(errorElement);
      }

      errorElement.textContent = message;

      if (animUtils.shake) {
        animUtils.shake(field);
      }

      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', errorElement.id || 'error');
    }

    clearFieldError(field) {
      field.classList.remove('has-error');

      const errorElement = field.parentElement.querySelector('.form-error');
      if (errorElement) {
        errorElement.remove();
      }

      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
    }

    getFieldLabel(field) {
      const label = field.parentElement.querySelector('.form-label');
      if (label) {
        return label.textContent.trim();
      }

      return field.placeholder || field.name || 'This field';
    }

    async handleSubmit(e) {
      e.preventDefault();

      if (!this.validateForm()) {
        utils.log('Form validation failed', 'warn');
        return;
      }

      if (this.submitButton) {
        this.setButtonLoading(this.submitButton, true);
      }

      const formData = new FormData(this.form);
      const data = Object.fromEntries(formData.entries());

      utils.log('Form submitted:', data);

      try {
        await this.submitForm(data);
      } catch (error) {
        utils.log(`Form submission error: ${error.message}`, 'error');
        this.showFormError('An error occurred. Please try again.');
      } finally {
        if (this.submitButton) {
          this.setButtonLoading(this.submitButton, false);
        }
      }
    }

    async submitForm(data) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.showFormSuccess('Thank you! We will contact you soon.');
      this.form.reset();

      utils.log('Form submitted successfully');
    }

    setButtonLoading(button, isLoading) {
      if (isLoading) {
        button.classList.add('btn-loading');
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = 'Sending...';
      } else {
        button.classList.remove('btn-loading');
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Submit';
      }
    }

    showFormSuccess(message) {
      const successElement = document.createElement('div');
      successElement.className = 'form-success';
      successElement.setAttribute('role', 'status');
      successElement.textContent = message;
      successElement.style.cssText = 'padding: 1rem; background-color: var(--color-sage-100); color: var(--color-sage-700); border-radius: var(--radius-md); margin-top: 1rem;';

      this.form.appendChild(successElement);

      setTimeout(() => {
        if (animUtils.fadeOut) {
          animUtils.fadeOut(successElement, () => successElement.remove());
        } else {
          successElement.remove();
        }
      }, 5000);
    }

    showFormError(message) {
      const errorElement = document.createElement('div');
      errorElement.className = 'form-error-general';
      errorElement.setAttribute('role', 'alert');
      errorElement.textContent = message;
      errorElement.style.cssText = 'padding: 1rem; background-color: hsl(0, 70%, 95%); color: hsl(0, 70%, 40%); border-radius: var(--radius-md); margin-top: 1rem;';

      this.form.appendChild(errorElement);

      setTimeout(() => {
        if (animUtils.fadeOut) {
          animUtils.fadeOut(errorElement, () => errorElement.remove());
        } else {
          errorElement.remove();
        }
      }, 5000);
    }
  }

  /**
   * Button Ripple Effect Handler
   */
  class RippleEffect {
    constructor() {
      this.buttons = document.querySelectorAll('.btn-ripple');
      this.init();
    }

    init() {
      this.buttons.forEach(button => {
        button.addEventListener('click', (e) => this.createRipple(e, button));
      });

      utils.log(`Ripple effect initialized for ${this.buttons.length} buttons`);
    }

    createRipple(event, button) {
      const circle = document.createElement('span');
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;

      const rect = button.getBoundingClientRect();
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${event.clientX - rect.left - radius}px`;
      circle.style.top = `${event.clientY - rect.top - radius}px`;
      circle.classList.add('ripple');

      const ripple = button.getElementsByClassName('ripple')[0];

      if (ripple) {
        ripple.remove();
      }

      button.appendChild(circle);
    }
  }

  /**
   * Accordion Handler (if needed for FAQs)
   */
  class AccordionHandler {
    constructor() {
      this.accordions = document.querySelectorAll('[data-accordion]');
      if (this.accordions.length > 0) {
        this.init();
      }
    }

    init() {
      this.accordions.forEach(accordion => {
        const trigger = accordion.querySelector('[data-accordion-trigger]');
        const content = accordion.querySelector('[data-accordion-content]');

        if (trigger && content) {
          trigger.addEventListener('click', () => {
            this.toggle(accordion, trigger, content);
          });
        }
      });

      utils.log(`Accordion initialized for ${this.accordions.length} items`);
    }

    toggle(accordion, trigger, content) {
      const isOpen = accordion.classList.contains('is-open');

      if (isOpen) {
        this.close(accordion, trigger, content);
      } else {
        this.open(accordion, trigger, content);
      }
    }

    open(accordion, trigger, content) {
      accordion.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      content.style.maxHeight = content.scrollHeight + 'px';

      utils.log('Accordion opened');
    }

    close(accordion, trigger, content) {
      accordion.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      content.style.maxHeight = '0';

      utils.log('Accordion closed');
    }
  }

  /**
   * Initialize all interaction handlers
   */
  function init() {
    new MobileMenuHandler();
    new RippleEffect();
    new AccordionHandler();

    const forms = document.querySelectorAll('form[data-validate]');
    forms.forEach(form => new FormValidator(form));

    utils.log(`Interactions initialized (${forms.length} forms)`);

    document.dispatchEvent(new CustomEvent('interactionsReady'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /**
   * Export to global scope
   */
  window.Interactions = {
    MobileMenuHandler,
    FormValidator,
    RippleEffect,
    AccordionHandler
  };

})();
