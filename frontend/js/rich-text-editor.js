// Rich Text Editor Component using Quill.js

class RichTextEditor {
    constructor(elementId, options = {}) {
        this.elementId = elementId;
        this.element = null;
        this.quill = null;
        this.options = {
            placeholder: options.placeholder || 'Escreva aqui...',
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['clean']
                ]
            },
            ...options
        };
    }

    /**
     * Initialize the Quill editor
     */
    init() {
        this.element = document.getElementById(this.elementId);
        
        if (!this.element) {
            console.error(`Element with id "${this.elementId}" not found`);
            return false;
        }

        // Initialize Quill
        this.quill = new Quill(`#${this.elementId}`, this.options);
        
        return true;
    }

    /**
     * Get the HTML content from the editor
     * @returns {string} HTML content
     */
    getContent() {
        if (!this.quill) {
            console.error('Editor not initialized');
            return '';
        }
        
        // Get HTML content
        const delta = this.quill.root.innerHTML;
        
        // Return empty string if only contains empty paragraph
        if (delta === '<p><br></p>') {
            return '';
        }
        
        return delta;
    }

    /**
     * Set HTML content in the editor
     * @param {string} html - HTML content to set
     */
    setContent(html) {
        if (!this.quill) {
            console.error('Editor not initialized');
            return;
        }
        
        // Set HTML content
        if (html) {
            this.quill.root.innerHTML = html;
        } else {
            this.quill.setText('');
        }
    }

    /**
     * Clear the editor content
     */
    clear() {
        if (!this.quill) {
            console.error('Editor not initialized');
            return;
        }
        
        this.quill.setText('');
    }

    /**
     * Get plain text content (without HTML)
     * @returns {string} Plain text content
     */
    getText() {
        if (!this.quill) {
            console.error('Editor not initialized');
            return '';
        }
        
        return this.quill.getText().trim();
    }

    /**
     * Check if editor is empty
     * @returns {boolean} True if empty
     */
    isEmpty() {
        return this.getText().length === 0;
    }

    /**
     * Enable the editor
     */
    enable() {
        if (this.quill) {
            this.quill.enable();
        }
    }

    /**
     * Disable the editor
     */
    disable() {
        if (this.quill) {
            this.quill.disable();
        }
    }

    /**
     * Focus the editor
     */
    focus() {
        if (this.quill) {
            this.quill.focus();
        }
    }

    /**
     * Add change listener
     * @param {Function} callback - Callback function
     */
    onChange(callback) {
        if (this.quill) {
            this.quill.on('text-change', callback);
        }
    }

    /**
     * Destroy the editor instance
     */
    destroy() {
        if (this.quill) {
            // Remove Quill instance
            const toolbar = this.element.previousSibling;
            if (toolbar && toolbar.classList.contains('ql-toolbar')) {
                toolbar.remove();
            }
            this.element.innerHTML = '';
            this.quill = null;
        }
    }
}
