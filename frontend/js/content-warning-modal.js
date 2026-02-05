// Content Warning Modal Component
// Displays warnings for adult content and trigger warnings before allowing access to fanfic content

class ContentWarningModal {
    constructor() {
        this.modal = null;
        this.fanfic = null;
        this.onConfirmCallback = null;
        this.sessionKey = null;
    }

    /**
     * Show the content warning modal for a fanfic
     * @param {Object} fanfic - The fanfic object with is_adult_content and trigger_warnings
     * @param {Function} onConfirm - Callback function to execute when user confirms
     */
    show(fanfic, onConfirm) {
        this.fanfic = fanfic;
        this.onConfirmCallback = onConfirm;
        this.sessionKey = `content_warning_confirmed_${fanfic.id}`;

        // Check if user has already confirmed for this session
        if (this.hasConfirmed()) {
            // User already confirmed, proceed directly
            if (this.onConfirmCallback) {
                this.onConfirmCallback();
            }
            return;
        }

        // Check if warnings are needed
        if (!this.needsWarning()) {
            // No warnings needed, proceed directly
            if (this.onConfirmCallback) {
                this.onConfirmCallback();
            }
            return;
        }

        // Create and show modal
        this.createModal();
        this.displayModal();
    }

    /**
     * Check if this fanfic needs a content warning
     * @returns {boolean}
     */
    needsWarning() {
        if (!this.fanfic) return false;
        
        const hasAdultContent = this.fanfic.is_adult_content === true;
        const hasTriggerWarnings = this.fanfic.trigger_warnings && 
                                   this.fanfic.trigger_warnings.trim() !== '';
        
        return hasAdultContent || hasTriggerWarnings;
    }

    /**
     * Check if user has already confirmed warnings for this session
     * @returns {boolean}
     */
    hasConfirmed() {
        return sessionStorage.getItem(this.sessionKey) === 'true';
    }

    /**
     * Store confirmation in session storage
     */
    storeConfirmation() {
        sessionStorage.setItem(this.sessionKey, 'true');
    }

    /**
     * Create the modal HTML structure
     */
    createModal() {
        // Remove existing modal if present
        const existingModal = document.getElementById('content-warning-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal element
        this.modal = document.createElement('div');
        this.modal.id = 'content-warning-modal';
        this.modal.className = 'modal content-warning-modal';
        this.modal.style.display = 'none';

        // Build warning content
        const warningContent = this.buildWarningContent();

        this.modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content content-warning-content">
                <div class="modal-header content-warning-header">
                    <h2>⚠️ Aviso de Conteúdo</h2>
                </div>
                <div class="modal-body content-warning-body">
                    ${warningContent}
                    <div class="content-warning-notice">
                        <p><strong>Ao continuar, você confirma que:</strong></p>
                        <ul>
                            <li>Você tem idade apropriada para visualizar este conteúdo</li>
                            <li>Você está ciente dos avisos apresentados</li>
                            <li>Você deseja prosseguir por sua própria escolha</li>
                        </ul>
                    </div>
                </div>
                <div class="modal-footer content-warning-footer">
                    <button type="button" class="btn btn-secondary" id="content-warning-cancel">
                        Voltar
                    </button>
                    <button type="button" class="btn btn-primary" id="content-warning-confirm">
                        Confirmar e Continuar
                    </button>
                </div>
            </div>
        `;

        // Append to body
        document.body.appendChild(this.modal);

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Build the warning content HTML based on fanfic properties
     * @returns {string} HTML string
     */
    buildWarningContent() {
        let content = '<div class="content-warning-items">';

        // Adult content warning
        if (this.fanfic.is_adult_content) {
            content += `
                <div class="content-warning-item adult-content-warning">
                    <div class="warning-icon">🔞</div>
                    <div class="warning-text">
                        <h3>Conteúdo Adulto</h3>
                        <p>Esta fanfic contém conteúdo destinado a maiores de 18 anos. 
                        Pode incluir temas maduros, linguagem adulta, violência ou conteúdo sexual.</p>
                    </div>
                </div>
            `;
        }

        // Trigger warnings
        if (this.fanfic.trigger_warnings && this.fanfic.trigger_warnings.trim() !== '') {
            content += `
                <div class="content-warning-item trigger-warnings">
                    <div class="warning-icon">⚠️</div>
                    <div class="warning-text">
                        <h3>Avisos de Gatilho</h3>
                        <p>Esta fanfic contém os seguintes avisos de conteúdo potencialmente sensível:</p>
                        <div class="trigger-warnings-list">
                            ${this.escapeHtml(this.fanfic.trigger_warnings)}
                        </div>
                    </div>
                </div>
            `;
        }

        content += '</div>';
        return content;
    }

    /**
     * Setup event listeners for modal buttons
     */
    setupEventListeners() {
        // Cancel button
        const cancelBtn = this.modal.querySelector('#content-warning-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hide());
        }

        // Confirm button
        const confirmBtn = this.modal.querySelector('#content-warning-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirm());
        }

        // Overlay click (optional - can be disabled for stricter confirmation)
        const overlay = this.modal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.hide());
        }

        // Escape key to close
        this.escapeKeyHandler = (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        };
        document.addEventListener('keydown', this.escapeKeyHandler);
    }

    /**
     * Display the modal
     */
    displayModal() {
        if (this.modal) {
            this.modal.style.display = 'flex';
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
            
            // Focus on confirm button for accessibility
            setTimeout(() => {
                const confirmBtn = this.modal.querySelector('#content-warning-confirm');
                if (confirmBtn) {
                    confirmBtn.focus();
                }
            }, 100);
        }
    }

    /**
     * Hide the modal
     */
    hide() {
        if (this.modal) {
            // Add closing animation
            this.modal.classList.add('closing');
            
            setTimeout(() => {
                this.modal.style.display = 'none';
                this.modal.classList.remove('closing');
                // Restore body scroll
                document.body.style.overflow = '';
                
                // Remove modal from DOM
                this.modal.remove();
                this.modal = null;
            }, 300); // Match animation duration
        }

        // Remove escape key listener
        if (this.escapeKeyHandler) {
            document.removeEventListener('keydown', this.escapeKeyHandler);
            this.escapeKeyHandler = null;
        }
    }

    /**
     * Handle confirmation
     */
    confirm() {
        // Store confirmation in session
        this.storeConfirmation();

        // Hide modal
        this.hide();

        // Execute callback
        if (this.onConfirmCallback) {
            this.onConfirmCallback();
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Clear confirmation for a specific fanfic (useful for testing or logout)
     * @param {number} fanficId
     */
    static clearConfirmation(fanficId) {
        sessionStorage.removeItem(`content_warning_confirmed_${fanficId}`);
    }

    /**
     * Clear all content warning confirmations
     */
    static clearAllConfirmations() {
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
            if (key.startsWith('content_warning_confirmed_')) {
                sessionStorage.removeItem(key);
            }
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentWarningModal;
}
