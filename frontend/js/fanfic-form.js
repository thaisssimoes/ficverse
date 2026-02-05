// FanficForm component for creating and editing fanfics with tags, warnings, and draft/publish functionality

class FanficForm {
    constructor(mode = 'create', fanficId = null) {
        this.mode = mode; // 'create' or 'edit'
        this.fanficId = fanficId;
        this.editors = {};
        this.tags = {
            fandom: [],
            warning: [],
            pairing: []
        };
        this.maxTagsPerType = 5;
    }

    async init() {
        // Initialize rich text editors
        this.initializeEditors();
        
        // Setup tag inputs
        this.setupTagInputs();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load existing data if editing
        if (this.mode === 'edit' && this.fanficId) {
            await this.loadFanficData();
        }
    }

    initializeEditors() {
        // Synopsis editor
        this.editors.synopsis = new RichTextEditor('new-fanfic-synopsis', {
            placeholder: 'Escreva a sinopse da sua fanfic...'
        });
        this.editors.synopsis.init();

        // Disclaimer editor
        this.editors.disclaimer = new RichTextEditor('new-fanfic-disclaimer', {
            placeholder: 'Adicione avisos ou disclaimers (opcional)...'
        });
        this.editors.disclaimer.init();

        // Trigger warnings editor
        this.editors.triggerWarnings = new RichTextEditor('new-fanfic-trigger-warnings', {
            placeholder: 'Liste conteúdos potencialmente perturbadores...'
        });
        this.editors.triggerWarnings.init();
    }

    setupTagInputs() {
        const tagTypes = ['fandom', 'warning', 'pairing'];
        
        tagTypes.forEach(type => {
            const input = document.getElementById(`${type}-tag-input`);
            if (!input) return;

            // Handle Enter key to add tag
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = input.value.trim();
                    if (value) {
                        this.addTag(type, value);
                        input.value = '';
                    }
                }
            });

            // Handle input for autocomplete
            input.addEventListener('input', (e) => {
                this.handleTagAutocomplete(type, e.target.value);
            });

            // Handle blur to close autocomplete
            input.addEventListener('blur', () => {
                setTimeout(() => this.closeAutocomplete(type), 200);
            });
        });
    }

    setupEventListeners() {
        // Save draft button
        const saveDraftBtn = document.getElementById('save-draft-btn');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => this.saveDraft());
        }

        // Form submission (publish)
        const form = document.getElementById('new-fanfic-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.publish();
            });
        }

        // Cover upload preview
        const coverInput = document.getElementById('new-fanfic-cover');
        if (coverInput) {
            coverInput.addEventListener('change', (e) => {
                this.validateCoverImage(e.target.files[0]);
            });
        }
    }

    async handleTagAutocomplete(type, query) {
        if (!query || query.length < 2) {
            this.closeAutocomplete(type);
            return;
        }

        try {
            // Search for existing tags
            const tags = await api.searchTags(query, type);
            this.showAutocomplete(type, tags, query);
        } catch (error) {
            console.error('Error searching tags:', error);
        }
    }

    showAutocomplete(type, tags, query) {
        const input = document.getElementById(`${type}-tag-input`);
        if (!input) return;

        // Remove existing autocomplete
        this.closeAutocomplete(type);

        // Create autocomplete container
        const autocomplete = document.createElement('div');
        autocomplete.className = 'tag-autocomplete';
        autocomplete.id = `${type}-tag-autocomplete`;

        if (tags.length === 0) {
            autocomplete.innerHTML = `
                <div class="tag-autocomplete-item create-new" data-tag="${this.escapeHtml(query)}">
                    ➕ Criar nova tag: "${this.escapeHtml(query)}"
                </div>
            `;
        } else {
            autocomplete.innerHTML = tags.map(tag => `
                <div class="tag-autocomplete-item" data-tag="${this.escapeHtml(tag.name)}">
                    ${this.escapeHtml(tag.name)}
                </div>
            `).join('') + `
                <div class="tag-autocomplete-item create-new" data-tag="${this.escapeHtml(query)}">
                    ➕ Criar nova tag: "${this.escapeHtml(query)}"
                </div>
            `;
        }

        // Add click handlers
        autocomplete.querySelectorAll('.tag-autocomplete-item').forEach(item => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const tagName = item.dataset.tag;
                this.addTag(type, tagName);
                input.value = '';
                this.closeAutocomplete(type);
            });
        });

        // Position autocomplete
        const container = input.parentElement;
        container.style.position = 'relative';
        container.appendChild(autocomplete);
    }

    closeAutocomplete(type) {
        const autocomplete = document.getElementById(`${type}-tag-autocomplete`);
        if (autocomplete) {
            autocomplete.remove();
        }
    }

    addTag(type, tagName) {
        // Check if tag limit reached
        if (this.tags[type].length >= this.maxTagsPerType) {
            this.showError(`Máximo de ${this.maxTagsPerType} tags de ${type} permitidas`);
            return false;
        }

        // Check if tag already exists
        if (this.tags[type].includes(tagName)) {
            this.showError('Esta tag já foi adicionada');
            return false;
        }

        // Add tag to array
        this.tags[type].push(tagName);

        // Update UI
        this.renderTags(type);
        
        return true;
    }

    removeTag(type, tagName) {
        this.tags[type] = this.tags[type].filter(t => t !== tagName);
        this.renderTags(type);
    }

    renderTags(type) {
        const container = document.getElementById(`${type}-tags-list`);
        if (!container) return;

        container.innerHTML = this.tags[type].map(tag => `
            <div class="tag-item ${type}">
                <span>${this.escapeHtml(tag)}</span>
                <button type="button" class="tag-remove" data-type="${type}" data-tag="${this.escapeHtml(tag)}">
                    ×
                </button>
            </div>
        `).join('');

        // Add remove handlers
        container.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                this.removeTag(btn.dataset.type, btn.dataset.tag);
            });
        });
    }

    validateCoverImage(file) {
        if (!file) return true;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            this.showError('Formato de imagem inválido. Use JPG, PNG, GIF ou WEBP');
            document.getElementById('new-fanfic-cover').value = '';
            return false;
        }

        // Validate file size (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showError('Imagem muito grande. Tamanho máximo: 5MB');
            document.getElementById('new-fanfic-cover').value = '';
            return false;
        }

        return true;
    }

    validateForm(isDraft = false) {
        const title = document.getElementById('new-fanfic-title').value.trim();
        const category = document.getElementById('new-fanfic-category').value;
        const synopsis = this.editors.synopsis.getContent();

        console.log('Validating form:', { title, category, synopsis, isDraft });

        // Title is always required
        if (!title) {
            this.showError('Título é obrigatório');
            return false;
        }

        // Category is always required (even for drafts)
        if (!category) {
            this.showError('Categoria é obrigatória');
            return false;
        }

        // For publishing, synopsis must also be filled
        if (!isDraft) {
            if (this.editors.synopsis.isEmpty()) {
                this.showError('Sinopse é obrigatória para publicação');
                return false;
            }
        }

        console.log('Form validation passed');
        return true;
    }

    async saveDraft() {
        if (!this.validateForm(true)) {
            return;
        }

        try {
            const formData = await this.collectFormData(true);
            
            if (this.mode === 'create') {
                // Use fetch directly for FormData
                const url = 'http://localhost:8080/api/fanfics';
                const headers = {};
                if (api.token) {
                    headers['Authorization'] = `Bearer ${api.token}`;
                }

                console.log('Saving draft to:', url);
                console.log('FormData entries:');
                for (let pair of formData.entries()) {
                    console.log(pair[0] + ': ' + pair[1]);
                }

                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: formData
                });

                console.log('Response status:', response.status);

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    console.error('Error response:', error);
                    throw new Error(error.error?.message || error.message || 'Erro ao salvar rascunho');
                }

                const result = await response.json();
                console.log('Save result:', result);
                
                // Add tags to the fanfic
                await this.updateFanficTags(result.id);
                
                this.showSuccess('Rascunho salvo com sucesso!');
                
                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                // Use fetch directly for FormData
                const url = `http://localhost:8080/api/fanfics/${this.fanficId}`;
                const headers = {};
                if (api.token) {
                    headers['Authorization'] = `Bearer ${api.token}`;
                }

                const response = await fetch(url, {
                    method: 'PUT',
                    headers,
                    body: formData
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(error.error?.message || error.message || 'Erro ao salvar alterações');
                }

                // Update tags
                await this.updateFanficTags(this.fanficId);
                
                this.showSuccess('Alterações salvas!');
            }
        } catch (error) {
            console.error('Error saving draft:', error);
            this.showError('Erro ao salvar rascunho: ' + error.message);
        }
    }

    async publish() {
        if (!this.validateForm(false)) {
            return;
        }

        try {
            const formData = await this.collectFormData(false);
            
            if (this.mode === 'create') {
                // Use fetch directly for FormData
                const url = 'http://localhost:8080/api/fanfics';
                const headers = {};
                if (api.token) {
                    headers['Authorization'] = `Bearer ${api.token}`;
                }

                console.log('Publishing fanfic to:', url);
                console.log('FormData entries:');
                for (let pair of formData.entries()) {
                    console.log(pair[0] + ': ' + pair[1]);
                }

                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: formData
                });

                console.log('Response status:', response.status);

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    console.error('Error response:', error);
                    throw new Error(error.error?.message || error.message || 'Erro ao criar fanfic');
                }

                const result = await response.json();
                console.log('Publish result:', result);
                
                // Add tags to the fanfic
                await this.updateFanficTags(result.id);
                
                // If created as draft, publish it
                if (result.is_draft) {
                    await api.publishFanfic(result.id);
                }
                
                this.showSuccess('Fanfic publicada com sucesso!');
                
                // Redirect to dashboard instead of fanfic detail
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                // Use fetch directly for FormData
                const url = `http://localhost:8080/api/fanfics/${this.fanficId}`;
                const headers = {};
                if (api.token) {
                    headers['Authorization'] = `Bearer ${api.token}`;
                }

                const response = await fetch(url, {
                    method: 'PUT',
                    headers,
                    body: formData
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(error.error?.message || error.message || 'Erro ao atualizar fanfic');
                }
                
                // Update tags
                await this.updateFanficTags(this.fanficId);
                
                // Publish if it's a draft
                const fanfic = await api.getFanfic(this.fanficId);
                if (fanfic.is_draft) {
                    await api.publishFanfic(this.fanficId);
                }
                
                this.showSuccess('Fanfic publicada com sucesso!');
                
                // Redirect to dashboard instead of fanfic detail
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            }
        } catch (error) {
            console.error('Error publishing fanfic:', error);
            this.showError('Erro ao publicar fanfic: ' + error.message);
        }
    }

    async collectFormData(isDraft) {
        const title = document.getElementById('new-fanfic-title').value.trim();
        const category = document.getElementById('new-fanfic-category').value;
        const synopsis = this.editors.synopsis.getContent();
        const disclaimer = this.editors.disclaimer.getContent();
        const triggerWarnings = this.editors.triggerWarnings.getContent();
        const isAdultContent = document.getElementById('new-fanfic-adult-content').checked;
        const interactiveMode = document.getElementById('new-fanfic-interactive').checked;
        const coverFile = document.getElementById('new-fanfic-cover').files[0];

        console.log('Collecting form data:', {
            title,
            category,
            synopsis: synopsis.substring(0, 50) + '...',
            isDraft,
            isAdultContent,
            interactiveMode,
            hasCover: !!coverFile
        });

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('title', title);
        formData.append('category', category || '');
        formData.append('synopsis', synopsis);
        formData.append('disclaimer', disclaimer);
        formData.append('trigger_warnings', triggerWarnings);
        formData.append('is_adult_content', isAdultContent);
        formData.append('interactive_mode', interactiveMode);
        formData.append('is_draft', isDraft);

        // Add cover file if selected
        if (coverFile) {
            formData.append('cover', coverFile);
        }

        console.log('FormData created successfully');

        // Note: Tags are handled separately via updateFanficTags method

        return formData;
    }

    async updateFanficTags(fanficId) {
        try {
            // Get existing tags for the fanfic
            const existingTags = await api.getFanficTags(fanficId);
            
            // Create or get tag IDs for all current tags
            const tagIds = {
                fandom: [],
                warning: [],
                pairing: []
            };

            for (const type of ['fandom', 'warning', 'pairing']) {
                for (const tagName of this.tags[type]) {
                    // Try to find existing tag or create new one
                    const searchResults = await api.searchTags(tagName, type);
                    let tag;
                    
                    if (searchResults.length > 0 && searchResults[0].name.toLowerCase() === tagName.toLowerCase()) {
                        tag = searchResults[0];
                    } else {
                        // Create new tag
                        tag = await api.createTag(tagName, type);
                    }
                    
                    tagIds[type].push(tag.id);
                }
            }

            // Flatten all tag IDs
            const allNewTagIds = [...tagIds.fandom, ...tagIds.warning, ...tagIds.pairing];
            
            // Remove tags that are no longer present
            for (const existingTag of existingTags) {
                if (!allNewTagIds.includes(existingTag.id)) {
                    await api.removeTagFromFanfic(fanficId, existingTag.id);
                }
            }

            // Add new tags
            const existingTagIds = existingTags.map(t => t.id);
            const tagsToAdd = allNewTagIds.filter(id => !existingTagIds.includes(id));
            
            if (tagsToAdd.length > 0) {
                await api.addTagsToFanfic(fanficId, tagsToAdd);
            }
        } catch (error) {
            console.error('Error updating tags:', error);
            // Don't throw - tags are not critical for fanfic creation/update
            this.showError('Aviso: Erro ao atualizar tags: ' + error.message);
        }
    }

    async loadFanficData() {
        try {
            const fanfic = await api.getFanfic(this.fanficId);
            
            // Populate form fields
            document.getElementById('new-fanfic-title').value = fanfic.title;
            document.getElementById('new-fanfic-category').value = fanfic.category || '';
            this.editors.synopsis.setContent(fanfic.synopsis);
            this.editors.disclaimer.setContent(fanfic.disclaimer || '');
            this.editors.triggerWarnings.setContent(fanfic.trigger_warnings || '');
            document.getElementById('new-fanfic-adult-content').checked = fanfic.is_adult_content || false;
            document.getElementById('new-fanfic-interactive').checked = fanfic.interactive_mode || false;

            // Display current cover if exists
            if (fanfic.cover_url) {
                const coverPreview = document.getElementById('current-cover-preview');
                const coverImage = document.getElementById('current-cover-image');
                if (coverPreview && coverImage) {
                    coverImage.src = `http://localhost:8080${fanfic.cover_url}`;
                    coverPreview.style.display = 'block';
                }
            }

            // Load tags
            if (fanfic.tags && fanfic.tags.length > 0) {
                fanfic.tags.forEach(tag => {
                    if (this.tags[tag.type]) {
                        this.tags[tag.type].push(tag.name);
                    }
                });
                
                // Render all tags
                Object.keys(this.tags).forEach(type => {
                    this.renderTags(type);
                });
            }

            // Update page title
            const pageTitle = document.querySelector('.form-header h2');
            if (pageTitle) {
                pageTitle.textContent = `Editar: ${fanfic.title}`;
            }
        } catch (error) {
            console.error('Error loading fanfic data:', error);
            this.showError('Erro ao carregar dados da fanfic: ' + error.message);
            
            // Redirect to dashboard after error
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 3000);
        }
    }

    showError(message) {
        // Create or update error message
        let errorDiv = document.querySelector('.form-error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'form-error-message';
            errorDiv.style.cssText = `
                background-color: var(--pastel-pink);
                color: var(--intense-pink);
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 1rem;
                font-weight: 600;
                text-align: center;
            `;
            const form = document.getElementById('new-fanfic-form');
            form.insertBefore(errorDiv, form.firstChild);
        }
        
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    showSuccess(message) {
        // Create success message
        const successDiv = document.createElement('div');
        successDiv.className = 'form-success-message';
        successDiv.style.cssText = `
            background-color: var(--pastel-blue);
            color: var(--intense-blue);
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-weight: 600;
            text-align: center;
        `;
        successDiv.textContent = message;
        
        const form = document.getElementById('new-fanfic-form');
        form.insertBefore(successDiv, form.firstChild);
    }

    destroy() {
        // Clean up editors
        Object.values(this.editors).forEach(editor => {
            if (editor && editor.destroy) {
                editor.destroy();
            }
        });
        this.editors = {};
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
