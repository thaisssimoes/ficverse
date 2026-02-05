/**
 * UI Utilities for Interactive Fanfic Platform
 * Provides helper functions for loading states, toast notifications, and animations
 */

// Toast Notification System
const Toast = {
    container: null,

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info', duration = 3000) {
        this.init();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ',
            warning: '⚠'
        };

        const titles = {
            success: 'Sucesso',
            error: 'Erro',
            info: 'Informação',
            warning: 'Aviso'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Fechar">×</button>
        `;

        this.container.appendChild(toast);

        // Close button handler
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.remove(toast));

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }

        return toast;
    },

    remove(toast) {
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    },

    success(message, duration) {
        return this.show(message, 'success', duration);
    },

    error(message, duration) {
        return this.show(message, 'error', duration);
    },

    info(message, duration) {
        return this.show(message, 'info', duration);
    },

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }
};

// Loading State Management
const Loading = {
    // Show loading spinner on button
    showButton(button) {
        if (!button) return;
        button.classList.add('loading');
        button.disabled = true;
        button.dataset.originalText = button.textContent;
    },

    // Hide loading spinner on button
    hideButton(button) {
        if (!button) return;
        button.classList.remove('loading');
        button.disabled = false;
        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
            delete button.dataset.originalText;
        }
    },

    // Create loading spinner element
    createSpinner() {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        return spinner;
    },

    // Create loading container with spinner and text
    createContainer(text = 'Carregando...') {
        const container = document.createElement('div');
        container.className = 'loading-container';
        container.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${text}</div>
        `;
        return container;
    },

    // Show loading in a container
    show(container, text) {
        if (!container) return;
        const loadingEl = this.createContainer(text);
        container.innerHTML = '';
        container.appendChild(loadingEl);
    },

    // Create skeleton loading elements
    createSkeleton(type = 'card') {
        const skeleton = document.createElement('div');
        skeleton.className = `skeleton skeleton-${type}`;
        return skeleton;
    }
};

// Error State Management
const ErrorState = {
    // Create error message with retry button
    createContainer(message, onRetry = null) {
        const container = document.createElement('div');
        container.className = 'error-container';
        
        const icon = document.createElement('div');
        icon.className = 'error-icon';
        icon.textContent = '⚠️';
        
        const messageEl = document.createElement('p');
        messageEl.className = 'error-message';
        messageEl.textContent = message;
        
        container.appendChild(icon);
        container.appendChild(messageEl);
        
        if (onRetry) {
            const retryBtn = document.createElement('button');
            retryBtn.className = 'btn-retry';
            retryBtn.textContent = 'Tentar Novamente';
            retryBtn.addEventListener('click', onRetry);
            container.appendChild(retryBtn);
        }
        
        return container;
    },

    // Show error in a container with retry option
    show(container, message, onRetry = null) {
        if (!container) return;
        const errorEl = this.createContainer(message, onRetry);
        container.innerHTML = '';
        container.appendChild(errorEl);
    },

    // Create empty state message
    createEmptyState(message, icon = '📚') {
        const container = document.createElement('div');
        container.className = 'empty-state';
        container.innerHTML = `
            <div class="empty-icon">${icon}</div>
            <p class="empty-message">${message}</p>
        `;
        return container;
    },

    // Show empty state in container
    showEmpty(container, message, icon) {
        if (!container) return;
        const emptyEl = this.createEmptyState(message, icon);
        container.innerHTML = '';
        container.appendChild(emptyEl);
    }
};

// Image Fallback Utilities
const ImageFallback = {
    // Default placeholder image
    defaultPlaceholder: 'https://via.placeholder.com/300x450?text=Sem+Imagem',

    // Set up image error handling
    setupFallback(img, fallbackUrl = null) {
        if (!img) return;
        
        const placeholder = fallbackUrl || this.defaultPlaceholder;
        
        img.addEventListener('error', function() {
            // Prevent infinite loop if placeholder also fails
            if (this.src !== placeholder) {
                this.src = placeholder;
                this.classList.add('image-fallback');
            }
        });
    },

    // Set up fallback for all images in container
    setupAllInContainer(container) {
        if (!container) return;
        
        const images = container.querySelectorAll('img');
        images.forEach(img => this.setupFallback(img));
    },

    // Create image with fallback
    createWithFallback(src, alt = '', fallbackUrl = null) {
        const img = document.createElement('img');
        img.alt = alt;
        img.loading = 'lazy';
        
        this.setupFallback(img, fallbackUrl);
        
        // Set src after setting up error handler
        img.src = src;
        
        return img;
    }
};

// Animation Utilities
const Animate = {
    // Add page transition animation
    pageEnter(element) {
        if (!element) return;
        element.classList.add('page-transition');
    },

    // Stagger animation for list items
    staggerIn(elements, delay = 100) {
        if (!elements || elements.length === 0) return;
        
        elements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                element.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * delay);
        });
    },

    // Fade in element
    fadeIn(element, duration = 300) {
        if (!element) return;
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease`;
        
        setTimeout(() => {
            element.style.opacity = '1';
        }, 10);
    },

    // Fade out element
    fadeOut(element, duration = 300) {
        if (!element) return;
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.opacity = '0';
        
        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    },

    // Slide in from direction
    slideIn(element, direction = 'up', duration = 300) {
        if (!element) return;
        
        const transforms = {
            up: 'translateY(20px)',
            down: 'translateY(-20px)',
            left: 'translateX(20px)',
            right: 'translateX(-20px)'
        };

        element.style.opacity = '0';
        element.style.transform = transforms[direction];
        element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translate(0, 0)';
        }, 10);
    }
};

// Modal Utilities
const Modal = {
    // Close modal with animation
    close(modal) {
        if (!modal) return;
        
        modal.classList.add('closing');
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    },

    // Prevent body scroll when modal is open
    lockScroll() {
        document.body.style.overflow = 'hidden';
    },

    // Restore body scroll
    unlockScroll() {
        document.body.style.overflow = '';
    }
};

// Form Utilities
const Form = {
    // Show field error
    showError(input, message) {
        if (!input) return;
        
        input.classList.add('error');
        
        // Remove existing error message
        const existingError = input.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorEl = document.createElement('span');
        errorEl.className = 'field-error';
        errorEl.textContent = message;
        input.parentNode.appendChild(errorEl);
    },

    // Clear field error
    clearError(input) {
        if (!input) return;
        
        input.classList.remove('error');
        
        const errorEl = input.parentNode.querySelector('.field-error');
        if (errorEl) {
            errorEl.remove();
        }
    },

    // Clear all errors in form
    clearAllErrors(form) {
        if (!form) return;
        
        const inputs = form.querySelectorAll('.error');
        inputs.forEach(input => this.clearError(input));
        
        const errors = form.querySelectorAll('.field-error');
        errors.forEach(error => error.remove());
    }
};

// Export utilities
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Toast, Loading, ErrorState, ImageFallback, Animate, Modal, Form };
}
