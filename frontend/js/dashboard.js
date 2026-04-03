// Dashboard functionality for author management

class Dashboard {
    constructor() {
        this.currentFanfic = null;
        this.currentTab = 'info';
        this.fanfics = [];
        this.editors = {}; // Store rich text editor instances
        this.filterStatus = 'all'; // 'all', 'draft', 'published'
        this.init();
    }

    async init() {
        // Check authentication
        if (!api.token) {
            window.location.href = 'login.html';
            return;
        }

        // Setup event listeners
        this.setupEventListeners();

        // Load author's fanfics
        await this.loadFanfics();
    }

    setupEventListeners() {
        // New fanfic button
        document.getElementById('new-fanfic-btn').addEventListener('click', () => {
            this.createNewFanfic();
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
    }

    async loadFanfics() {
        const listContainer = document.getElementById('fanfics-list');
        
        try {
            // Get current user from token
            const currentUser = this.getCurrentUser();
            if (!currentUser) {
                window.location.href = 'login.html';
                return;
            }

            // Get all fanfics
            const response = await api.getFanfics();
            
            // Extract fanfics from category groups and filter by current user
            const allFanfics = Object.values(response).flat();
            this.fanfics = allFanfics.filter(f => f.author_id === currentUser.id);

            // Apply status filter
            const filteredFanfics = this.getFilteredFanfics();

            if (this.fanfics.length === 0) {
                listContainer.innerHTML = `
                    <div class="empty-state">
                        <p>Você ainda não tem fanfics.</p>
                        <p>Clique em "Nova Fanfic" para começar!</p>
                    </div>
                `;
                return;
            }

            // Render filter buttons
            const filterHtml = `
                <div class="fanfic-filter-buttons" style="display: flex; gap: 0.5rem; margin-bottom: 1rem; padding: 0 1rem;">
                    <button class="filter-btn ${this.filterStatus === 'all' ? 'active' : ''}" data-filter="all">
                        Todas (${this.fanfics.length})
                    </button>
                    <button class="filter-btn ${this.filterStatus === 'draft' ? 'active' : ''}" data-filter="draft">
                        Rascunhos (${this.fanfics.filter(f => f.is_draft).length})
                    </button>
                    <button class="filter-btn ${this.filterStatus === 'published' ? 'active' : ''}" data-filter="published">
                        Publicadas (${this.fanfics.filter(f => !f.is_draft).length})
                    </button>
                </div>
            `;

            if (filteredFanfics.length === 0) {
                listContainer.innerHTML = filterHtml + `
                    <div class="empty-state" style="padding: 1rem;">
                        <p>Nenhuma fanfic ${this.filterStatus === 'draft' ? 'em rascunho' : 'publicada'}.</p>
                    </div>
                `;
                
                // Add filter button listeners
                this.setupFilterButtons();
                return;
            }

            listContainer.innerHTML = filterHtml + filteredFanfics.map(fanfic => `
                <div class="fanfic-list-item" data-id="${fanfic.id}">
                    <div class="fanfic-list-info">
                        <div class="fanfic-list-title">${this.escapeHtml(fanfic.title)}</div>
                        <div class="fanfic-list-meta">
                            <span class="fanfic-list-category">${this.escapeHtml(fanfic.category)}</span>
                            ${fanfic.is_draft ? 
                                '<span class="status-badge status-draft">📝 Rascunho</span>' : 
                                '<span class="status-badge status-published">✓ Publicada</span>'
                            }
                        </div>
                    </div>
                    <button class="btn-edit-fanfic" data-id="${fanfic.id}" title="Editar fanfic">
                        ✏️
                    </button>
                </div>
            `).join('');

            // Add filter button listeners
            this.setupFilterButtons();

            // Add click listeners to fanfic items
            document.querySelectorAll('.fanfic-list-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    // Don't select if clicking the edit button
                    if (!e.target.classList.contains('btn-edit-fanfic')) {
                        this.selectFanfic(parseInt(item.dataset.id));
                    }
                });
            });

            // Add click listeners to edit buttons
            document.querySelectorAll('.btn-edit-fanfic').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const fanficId = parseInt(btn.dataset.id);
                    window.location.href = `edit-fanfic.html?id=${fanficId}`;
                });
            });

        } catch (error) {
            console.error('Error loading fanfics:', error);
            listContainer.innerHTML = `
                <div class="error-message">
                    Erro ao carregar fanfics: ${error.message}
                </div>
            `;
        }
    }

    getFilteredFanfics() {
        if (this.filterStatus === 'draft') {
            return this.fanfics.filter(f => f.is_draft);
        } else if (this.filterStatus === 'published') {
            return this.fanfics.filter(f => !f.is_draft);
        }
        return this.fanfics;
    }

    setupFilterButtons() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterStatus = e.target.dataset.filter;
                this.loadFanfics();
            });
        });
    }

    getCurrentUser() {
        try {
            const token = api.getToken();
            const payload = JSON.parse(atob(token.split('.')[1]));
            return {
                id: payload.user_id,
                username: payload.username,
                email: payload.email
            };
        } catch (error) {
            console.error('Error parsing token:', error);
            return null;
        }
    }

    selectFanfic(fanficId) {
        // Update active state in sidebar
        document.querySelectorAll('.fanfic-list-item').forEach(item => {
            item.classList.remove('active');
            if (parseInt(item.dataset.id) === fanficId) {
                item.classList.add('active');
            }
        });

        // Find the fanfic
        this.currentFanfic = this.fanfics.find(f => f.id === fanficId);

        // Show editor and hide empty state
        document.getElementById('no-selection').style.display = 'none';
        document.getElementById('fanfic-editor').style.display = 'block';

        // Load the current tab content
        this.loadTabContent(this.currentTab);
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // Update tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Load tab content
        this.loadTabContent(tabName);
    }

    async loadTabContent(tabName) {
        if (!this.currentFanfic) return;

        const tabPane = document.getElementById(`${tabName}-tab`);
        tabPane.innerHTML = '<div class="loading">Carregando...</div>';

        try {
            switch (tabName) {
                case 'info':
                    await this.loadInfoTab(tabPane);
                    break;
                case 'chapters':
                    await this.loadChaptersTab(tabPane);
                    break;
                case 'questions':
                    await this.loadQuestionsTab(tabPane);
                    break;
                case 'comments':
                    await this.loadCommentsTab(tabPane);
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${tabName} tab:`, error);
            tabPane.innerHTML = `
                <div class="error-message">
                    Erro ao carregar conteúdo: ${error.message}
                </div>
            `;
        }
    }

    async loadInfoTab(container) {
        const fanfic = this.currentFanfic;
        
        // Clean up existing editors
        if (this.editors.synopsis) {
            this.editors.synopsis.destroy();
            delete this.editors.synopsis;
        }
        if (this.editors.disclaimer) {
            this.editors.disclaimer.destroy();
            delete this.editors.disclaimer;
        }
        
        container.innerHTML = `
            <form id="fanfic-info-form" class="fanfic-info-form">
                <!-- Publication Status Section -->
                <div class="form-section" style="background-color: ${fanfic.is_draft ? 'var(--pastel-yellow)' : 'var(--pastel-green)'}; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h4 style="color: ${fanfic.is_draft ? 'var(--intense-yellow)' : 'var(--intense-green)'}; margin: 0 0 0.5rem 0;">
                                ${fanfic.is_draft ? '📝 Status: Rascunho' : '✓ Status: Publicada'}
                            </h4>
                            <p style="margin: 0; color: var(--dark-gray); font-size: 0.9rem;">
                                ${fanfic.is_draft ? 
                                    'Esta fanfic está em modo rascunho e não é visível para outros usuários.' :
                                    `Publicada em ${new Date(fanfic.published_at).toLocaleDateString('pt-BR')}`
                                }
                            </p>
                        </div>
                        <div>
                            ${fanfic.is_draft ? 
                                '<button type="button" class="btn btn-success" id="publish-fanfic-btn">📢 Publicar</button>' :
                                '<button type="button" class="btn btn-warning" id="unpublish-fanfic-btn">📝 Despublicar</button>'
                            }
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3>Informações Básicas</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="fanfic-title">Título</label>
                            <input type="text" id="fanfic-title" class="form-input" 
                                   value="${this.escapeHtml(fanfic.title)}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="fanfic-category">Categoria</label>
                            <select id="fanfic-category" class="form-input" required>
                                <option value="Romance" ${fanfic.category === 'Romance' ? 'selected' : ''}>Romance</option>
                                <option value="Aventura" ${fanfic.category === 'Aventura' ? 'selected' : ''}>Aventura</option>
                                <option value="Drama" ${fanfic.category === 'Drama' ? 'selected' : ''}>Drama</option>
                                <option value="Comédia" ${fanfic.category === 'Comédia' ? 'selected' : ''}>Comédia</option>
                                <option value="Ficção Científica" ${fanfic.category === 'Ficção Científica' ? 'selected' : ''}>Ficção Científica</option>
                                <option value="Fantasia" ${fanfic.category === 'Fantasia' ? 'selected' : ''}>Fantasia</option>
                                <option value="Terror" ${fanfic.category === 'Terror' ? 'selected' : ''}>Terror</option>
                                <option value="Mistério" ${fanfic.category === 'Mistério' ? 'selected' : ''}>Mistério</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="fanfic-synopsis">Sinopse</label>
                        <div id="fanfic-synopsis" style="background: white; min-height: 150px;"></div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="fanfic-disclaimer">Aviso/Disclaimer</label>
                        <div id="fanfic-disclaimer" style="background: white; min-height: 100px;"></div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">
                            <input type="checkbox" id="fanfic-interactive-mode" ${fanfic.interactive_mode ? 'checked' : ''} style="width: auto; margin-right: 0.5rem;">
                            Modo Interativo
                        </label>
                        <small style="display: block; margin-top: 0.5rem; color: var(--text-secondary);">
                            ${fanfic.interactive_mode ? 
                                '✨ Modo interativo ativado! Use a aba "Perguntas" para criar perguntas personalizadas.' :
                                'Ative para permitir que leitores personalizem a história com suas próprias respostas.'
                            }
                        </small>
                    </div>
                </div>

                <div class="form-section">
                    <h3>Imagem de Capa</h3>
                    <div class="cover-upload-container">
                        <div class="cover-preview">
                            ${fanfic.cover_url ?
                                `<img src="${api.getAssetUrl(fanfic.cover_url)}" alt="Capa" class="cover-preview-img" id="cover-preview">` :
                                `<div class="cover-preview-placeholder" id="cover-preview">📖</div>`
                            }
                        </div>
                        <div class="cover-upload-controls">
                            <div class="file-input-wrapper">
                                <input type="file" id="cover-upload" accept="image/*">
                                <label for="cover-upload" class="file-input-label">
                                    Escolher Nova Capa
                                </label>
                            </div>
                            <p style="margin-top: 1rem; color: var(--medium-gray); font-size: 0.9rem;">
                                Formatos aceitos: JPG, PNG, GIF, WEBP<br>
                                Tamanho máximo: 5MB<br>
                                Proporção recomendada: 2:3 (ex: 400x600px)
                            </p>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="delete-fanfic-btn">
                        Excluir Fanfic
                    </button>
                    <button type="submit" class="btn btn-primary">
                        Salvar Alterações
                    </button>
                </div>
            </form>
        `;

        // Initialize rich text editors
        this.editors.synopsis = new RichTextEditor('fanfic-synopsis', {
            placeholder: 'Escreva a sinopse da sua fanfic...'
        });
        this.editors.synopsis.init();
        this.editors.synopsis.setContent(fanfic.synopsis || '');

        this.editors.disclaimer = new RichTextEditor('fanfic-disclaimer', {
            placeholder: 'Adicione avisos ou disclaimers (opcional)...'
        });
        this.editors.disclaimer.init();
        this.editors.disclaimer.setContent(fanfic.disclaimer || '');

        // Setup form submission
        document.getElementById('fanfic-info-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveFanficInfo();
        });

        // Setup cover upload preview
        document.getElementById('cover-upload').addEventListener('change', (e) => {
            this.previewCover(e.target.files[0]);
        });

        // Setup delete button
        document.getElementById('delete-fanfic-btn').addEventListener('click', async () => {
            await this.deleteFanfic();
        });

        // Setup publish/unpublish buttons
        const publishBtn = document.getElementById('publish-fanfic-btn');
        const unpublishBtn = document.getElementById('unpublish-fanfic-btn');
        
        if (publishBtn) {
            publishBtn.addEventListener('click', async () => {
                await this.publishFanfic();
            });
        }
        
        if (unpublishBtn) {
            unpublishBtn.addEventListener('click', async () => {
                await this.unpublishFanfic();
            });
        }
    }

    async saveFanficInfo() {
        const title = document.getElementById('fanfic-title').value.trim();
        const category = document.getElementById('fanfic-category').value;
        const synopsis = this.editors.synopsis.getContent();
        const disclaimer = this.editors.disclaimer.getContent();
        const interactiveMode = document.getElementById('fanfic-interactive-mode').checked;
        const coverFile = document.getElementById('cover-upload').files[0];

        if (!title || !category || this.editors.synopsis.isEmpty()) {
            alert('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        try {
            // Create FormData to send file and data together
            const formData = new FormData();
            formData.append('title', title);
            formData.append('category', category);
            formData.append('synopsis', synopsis);
            formData.append('disclaimer', disclaimer);
            formData.append('interactive_mode', interactiveMode);

            // Add cover file if selected
            if (coverFile) {
                formData.append('cover', coverFile);
            }

            // Send update with FormData
            const url = `${API_BASE_URL}/fanfics/${this.currentFanfic.id}`;
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

            const updatedFanfic = await response.json();

            // Update local data
            this.currentFanfic.title = updatedFanfic.title;
            this.currentFanfic.category = updatedFanfic.category;
            this.currentFanfic.synopsis = updatedFanfic.synopsis;
            this.currentFanfic.disclaimer = updatedFanfic.disclaimer;
            this.currentFanfic.interactive_mode = updatedFanfic.interactive_mode;
            this.currentFanfic.cover_url = updatedFanfic.cover_url;

            // Reload fanfics list to show updated title/category
            await this.loadFanfics();

            // Reload the info tab to show the new cover
            await this.loadTabContent('info');

            // Show success message
            this.showNotification('Alterações salvas com sucesso!', 'success');

        } catch (error) {
            console.error('Error saving fanfic:', error);
            alert('Erro ao salvar alterações: ' + error.message);
        }
    }

    previewCover(file) {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione um arquivo de imagem válido');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('O arquivo é muito grande. Tamanho máximo: 5MB');
            return;
        }

        // Preview the image
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('cover-preview');
            preview.outerHTML = `<img src="${e.target.result}" alt="Capa" class="cover-preview-img" id="cover-preview">`;
        };
        reader.readAsDataURL(file);
    }

    async deleteFanfic() {
        if (!confirm('Tem certeza que deseja excluir esta fanfic? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            await api.deleteFanfic(this.currentFanfic.id);

            // Remove from local list
            this.fanfics = this.fanfics.filter(f => f.id !== this.currentFanfic.id);
            this.currentFanfic = null;

            // Reload UI
            await this.loadFanfics();

            // Hide editor
            document.getElementById('fanfic-editor').style.display = 'none';
            document.getElementById('no-selection').style.display = 'flex';

            alert('Fanfic excluída com sucesso!');

        } catch (error) {
            console.error('Error deleting fanfic:', error);
            alert('Erro ao excluir fanfic: ' + error.message);
        }
    }

    async loadChaptersTab(container) {
        try {
            const chapters = await api.getChapters(this.currentFanfic.id);
            
            container.innerHTML = `
                <div class="chapters-manager">
                    <div class="chapters-header">
                        <h3>Capítulos</h3>
                        <button class="btn btn-primary" id="add-chapter-btn">+ Novo Capítulo</button>
                    </div>
                    <div id="chapters-list">
                        ${chapters.length === 0 ? 
                            '<div class="placeholder-text">Nenhum capítulo ainda. Clique em "Novo Capítulo" para adicionar.</div>' :
                            chapters.map(chapter => this.renderChapterCard(chapter)).join('')
                        }
                    </div>
                </div>
            `;

            // Setup event listeners
            document.getElementById('add-chapter-btn').addEventListener('click', () => {
                this.showChapterForm();
            });

            // Setup edit/delete buttons for each chapter
            chapters.forEach(chapter => {
                const editBtn = document.getElementById(`edit-chapter-${chapter.id}`);
                const deleteBtn = document.getElementById(`delete-chapter-${chapter.id}`);
                const publishBtn = document.getElementById(`publish-chapter-${chapter.id}`);

                if (editBtn) {
                    editBtn.addEventListener('click', () => this.editChapter(chapter));
                }
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => this.deleteChapter(chapter.id));
                }
                if (publishBtn) {
                    publishBtn.addEventListener('click', () => this.publishChapter(chapter.id));
                }
            });

        } catch (error) {
            console.error('Error loading chapters:', error);
            container.innerHTML = `
                <div class="error-message">
                    Erro ao carregar capítulos: ${error.message}
                </div>
            `;
        }
    }

    renderChapterCard(chapter) {
        return `
            <div class="chapter-card" data-chapter-id="${chapter.id}">
                <div class="chapter-card-info">
                    <div class="chapter-card-number">Capítulo ${chapter.order}</div>
                    <h4 class="chapter-card-title">${this.escapeHtml(chapter.title)}</h4>
                    ${chapter.is_draft ? 
                        '<span class="status-badge status-draft" style="margin-left: 0.5rem;">📝 Rascunho</span>' : 
                        ''
                    }
                </div>
                <div class="chapter-card-actions">
                    ${chapter.is_draft ? 
                        `<button class="btn btn-success btn-icon" id="publish-chapter-${chapter.id}">
                            📢 Publicar
                        </button>` : 
                        ''
                    }
                    <button class="btn btn-secondary btn-icon" id="edit-chapter-${chapter.id}">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-danger btn-icon" id="delete-chapter-${chapter.id}">
                        🗑️ Excluir
                    </button>
                </div>
            </div>
        `;
    }

    showChapterForm(chapter = null) {
        const isEdit = chapter !== null;
        
        // Clean up existing chapter editor if any
        if (this.editors.chapterContent) {
            this.editors.chapterContent.destroy();
            delete this.editors.chapterContent;
        }
        
        const modalHtml = `
            <div class="modal" id="chapter-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${isEdit ? 'Editar Capítulo' : 'Novo Capítulo'}</h2>
                        <button class="modal-close" id="close-chapter-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="chapter-form">
                            <div class="form-group">
                                <label class="form-label" for="chapter-title">Título do Capítulo</label>
                                <input type="text" id="chapter-title" class="form-input" 
                                       value="${isEdit ? this.escapeHtml(chapter.title) : ''}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="chapter-content">Conteúdo</label>
                                <div id="chapter-content" style="background: white; min-height: 300px;"></div>
                                <small style="color: var(--medium-gray); display: block; margin-top: 0.5rem;">
                                    Dica: Use {{placeholder}} para criar espaços interativos
                                </small>
                            </div>
                            <div class="form-group">
                                <label class="form-label">
                                    <input type="checkbox" id="chapter-is-draft" ${isEdit && chapter.is_draft ? 'checked' : ''} style="width: auto; margin-right: 0.5rem;">
                                    Salvar como Rascunho
                                </label>
                                <small style="display: block; margin-top: 0.5rem; color: var(--text-secondary);">
                                    Capítulos em rascunho não são visíveis para os leitores
                                </small>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancel-chapter-btn">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="save-chapter-btn">
                            ${isEdit ? 'Salvar Alterações' : 'Criar Capítulo'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Initialize rich text editor for chapter content
        this.editors.chapterContent = new RichTextEditor('chapter-content', {
            placeholder: 'Escreva o conteúdo do capítulo...'
        });
        this.editors.chapterContent.init();
        
        if (isEdit && chapter.content) {
            this.editors.chapterContent.setContent(chapter.content);
        }

        // Setup event listeners
        document.getElementById('close-chapter-modal').addEventListener('click', () => {
            if (this.editors.chapterContent) {
                this.editors.chapterContent.destroy();
                delete this.editors.chapterContent;
            }
            document.getElementById('chapter-modal').remove();
        });

        document.getElementById('cancel-chapter-btn').addEventListener('click', () => {
            if (this.editors.chapterContent) {
                this.editors.chapterContent.destroy();
                delete this.editors.chapterContent;
            }
            document.getElementById('chapter-modal').remove();
        });

        document.getElementById('save-chapter-btn').addEventListener('click', async () => {
            await this.saveChapter(chapter);
        });
    }

    async saveChapter(existingChapter) {
        const title = document.getElementById('chapter-title').value.trim();
        const content = this.editors.chapterContent.getContent();
        const isDraft = document.getElementById('chapter-is-draft').checked;

        if (!title || this.editors.chapterContent.isEmpty()) {
            alert('Por favor, preencha todos os campos');
            return;
        }

        try {
            if (existingChapter) {
                // Update existing chapter
                await api.updateChapter(existingChapter.id, { title, content, is_draft: isDraft });
            } else {
                // Create new chapter (order is calculated automatically by backend)
                await api.createChapter(this.currentFanfic.id, { title, content, is_draft: isDraft });
            }

            // Clean up editor
            if (this.editors.chapterContent) {
                this.editors.chapterContent.destroy();
                delete this.editors.chapterContent;
            }

            // Close modal
            document.getElementById('chapter-modal').remove();

            // Reload chapters tab
            await this.loadTabContent('chapters');

        } catch (error) {
            console.error('Error saving chapter:', error);
            alert('Erro ao salvar capítulo: ' + error.message);
        }
    }

    async editChapter(chapter) {
        this.showChapterForm(chapter);
    }

    async deleteChapter(chapterId) {
        // Show confirmation modal
        const confirmed = await this.showConfirmationModal(
            'Excluir Capítulo',
            'Tem certeza que deseja excluir este capítulo? Esta ação não pode ser desfeita. Os capítulos restantes serão reordenados automaticamente.',
            'Excluir',
            'Cancelar'
        );

        if (!confirmed) {
            return;
        }

        try {
            // Show loading state
            this.showNotification('Excluindo capítulo...', 'info');

            // Delete chapter - backend automatically reorders remaining chapters
            await api.deleteChapter(chapterId);

            // Reload chapters tab to show updated list with new ordering
            await this.loadTabContent('chapters');

            this.showNotification('Capítulo excluído com sucesso! Os capítulos foram reordenados.', 'success');

        } catch (error) {
            console.error('Error deleting chapter:', error);
            this.showNotification('Erro ao excluir capítulo: ' + error.message, 'error');
        }
    }

    async publishChapter(chapterId) {
        if (!confirm('Tem certeza que deseja publicar este capítulo? Ele ficará visível para todos os leitores.')) {
            return;
        }

        try {
            await api.publishChapter(chapterId);

            // Reload chapters tab
            await this.loadTabContent('chapters');

            this.showNotification('Capítulo publicado com sucesso! 🎉', 'success');

        } catch (error) {
            console.error('Error publishing chapter:', error);
            alert('Erro ao publicar capítulo: ' + error.message);
        }
    }

    async loadQuestionsTab(container) {
        try {
            const questions = await api.getQuestions(this.currentFanfic.id);
            
            container.innerHTML = `
                <div class="questions-manager">
                    <div class="questions-header">
                        <h3>Perguntas Interativas</h3>
                        <button class="btn btn-primary" id="add-question-btn">+ Nova Pergunta</button>
                    </div>
                    <div class="info-box" style="background-color: var(--pastel-blue); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                        <p style="margin: 0; color: var(--dark-gray);">
                            <strong>💡 Dica:</strong> Use placeholders como {{nome}}, {{lugar}}, {{objeto}} no texto dos capítulos. 
                            As respostas dos leitores substituirão esses placeholders durante a leitura interativa.
                        </p>
                    </div>
                    <div id="questions-list">
                        ${questions.length === 0 ? 
                            '<div class="placeholder-text">Nenhuma pergunta ainda. Clique em "Nova Pergunta" para adicionar.</div>' :
                            questions.map(question => this.renderQuestionCard(question)).join('')
                        }
                    </div>
                </div>
            `;

            // Setup event listeners
            document.getElementById('add-question-btn').addEventListener('click', () => {
                this.showQuestionForm();
            });

            // Setup edit/delete buttons for each question
            questions.forEach(question => {
                const editBtn = document.getElementById(`edit-question-${question.id}`);
                const deleteBtn = document.getElementById(`delete-question-${question.id}`);

                if (editBtn) {
                    editBtn.addEventListener('click', () => this.editQuestion(question));
                }
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => this.deleteQuestion(question.id));
                }
            });

        } catch (error) {
            console.error('Error loading questions:', error);
            container.innerHTML = `
                <div class="error-message">
                    Erro ao carregar perguntas: ${error.message}
                </div>
            `;
        }
    }

    renderQuestionCard(question) {
        return `
            <div class="question-card" data-question-id="${question.id}">
                <div class="question-card-info">
                    <div class="question-card-text">${this.escapeHtml(question.question_text)}</div>
                    <div class="question-card-placeholder">Placeholder: {{${this.escapeHtml(question.placeholder)}}}</div>
                </div>
                <div class="question-card-actions">
                    <button class="btn btn-secondary btn-icon" id="edit-question-${question.id}">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-danger btn-icon" id="delete-question-${question.id}">
                        🗑️ Excluir
                    </button>
                </div>
            </div>
        `;
    }

    showQuestionForm(question = null) {
        const isEdit = question !== null;
        const modalHtml = `
            <div class="modal" id="question-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${isEdit ? 'Editar Pergunta' : 'Nova Pergunta'}</h2>
                        <button class="modal-close" id="close-question-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="question-form">
                            <div class="form-group">
                                <label class="form-label" for="question-text">Pergunta</label>
                                <input type="text" id="question-text" class="form-input" 
                                       value="${isEdit ? this.escapeHtml(question.question_text) : ''}" 
                                       placeholder="Ex: Qual é o seu nome?" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="question-placeholder">Placeholder</label>
                                <input type="text" id="question-placeholder" class="form-input" 
                                       value="${isEdit ? this.escapeHtml(question.placeholder) : ''}" 
                                       placeholder="Ex: nome (sem chaves)" required>
                                <small style="color: var(--medium-gray);">
                                    Use apenas letras, números e underscores. Não inclua {{ }}
                                </small>
                            </div>
                            <div class="info-box" style="background-color: var(--pastel-purple); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                                <p style="margin: 0; color: var(--dark-gray); font-size: 0.9rem;">
                                    <strong>Exemplo:</strong><br>
                                    Pergunta: "Qual é o seu nome?"<br>
                                    Placeholder: "nome"<br>
                                    No capítulo: "Olá, {{nome}}! Bem-vindo à história."
                                </p>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancel-question-btn">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="save-question-btn">
                            ${isEdit ? 'Salvar Alterações' : 'Criar Pergunta'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Setup event listeners
        document.getElementById('close-question-modal').addEventListener('click', () => {
            document.getElementById('question-modal').remove();
        });

        document.getElementById('cancel-question-btn').addEventListener('click', () => {
            document.getElementById('question-modal').remove();
        });

        document.getElementById('save-question-btn').addEventListener('click', async () => {
            await this.saveQuestion(question);
        });
    }

    async saveQuestion(existingQuestion) {
        const questionText = document.getElementById('question-text').value.trim();
        const placeholder = document.getElementById('question-placeholder').value.trim();

        if (!questionText || !placeholder) {
            alert('Por favor, preencha todos os campos');
            return;
        }

        // Validate placeholder format (alphanumeric and underscores only)
        if (!/^[a-zA-Z0-9_]+$/.test(placeholder)) {
            alert('O placeholder deve conter apenas letras, números e underscores');
            return;
        }

        try {
            const questionData = {
                question_text: questionText,
                placeholder: placeholder
            };

            if (existingQuestion) {
                // Update existing question
                await api.updateQuestion(existingQuestion.id, questionData);
            } else {
                // Create new question
                await api.createQuestion(this.currentFanfic.id, questionData);
            }

            // Close modal
            document.getElementById('question-modal').remove();

            // Reload questions tab
            await this.loadTabContent('questions');

        } catch (error) {
            console.error('Error saving question:', error);
            alert('Erro ao salvar pergunta: ' + error.message);
        }
    }

    async editQuestion(question) {
        this.showQuestionForm(question);
    }

    async deleteQuestion(questionId) {
        if (!confirm('Tem certeza que deseja excluir esta pergunta? Isso afetará a experiência interativa dos leitores.')) {
            return;
        }

        try {
            await api.deleteQuestion(questionId);

            // Reload questions tab
            await this.loadTabContent('questions');

        } catch (error) {
            console.error('Error deleting question:', error);
            alert('Erro ao excluir pergunta: ' + error.message);
        }
    }

    async loadCommentsTab(container) {
        try {
            // Get all comments for the fanfic
            const fanficComments = await api.getComments(this.currentFanfic.id);
            
            // Get chapters to group comments
            const chapters = await api.getChapters(this.currentFanfic.id);

            // Group comments by chapter
            const commentsByChapter = this.groupCommentsByChapter(fanficComments, chapters);

            container.innerHTML = `
                <div class="comments-viewer">
                    <h3 style="color: var(--intense-purple); margin-bottom: 1.5rem;">Comentários</h3>
                    ${commentsByChapter.length === 0 ? 
                        '<div class="placeholder-text">Nenhum comentário ainda.</div>' :
                        commentsByChapter.map(group => this.renderCommentsGroup(group)).join('')
                    }
                </div>
            `;

            // Setup delete buttons
            fanficComments.forEach(comment => {
                const deleteBtn = document.getElementById(`delete-comment-${comment.id}`);
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => this.deleteComment(comment.id));
                }
            });

        } catch (error) {
            console.error('Error loading comments:', error);
            container.innerHTML = `
                <div class="error-message">
                    Erro ao carregar comentários: ${error.message}
                </div>
            `;
        }
    }

    groupCommentsByChapter(comments, chapters) {
        const groups = [];

        // Group comments for the fanfic itself (no chapter)
        const fanficComments = comments.filter(c => !c.chapter_id);
        if (fanficComments.length > 0) {
            groups.push({
                title: 'Comentários Gerais da Fanfic',
                comments: fanficComments
            });
        }

        // Group comments by chapter
        chapters.forEach(chapter => {
            const chapterComments = comments.filter(c => c.chapter_id === chapter.id);
            if (chapterComments.length > 0) {
                groups.push({
                    title: `Capítulo ${chapter.order}: ${chapter.title}`,
                    comments: chapterComments
                });
            }
        });

        return groups;
    }

    renderCommentsGroup(group) {
        return `
            <div class="comments-group">
                <h4 class="comments-group-header">${this.escapeHtml(group.title)}</h4>
                ${group.comments.map(comment => this.renderCommentItem(comment)).join('')}
            </div>
        `;
    }

    renderCommentItem(comment) {
        const date = new Date(comment.created_at);
        const formattedDate = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="comment-item">
                <div class="comment-content">
                    <div class="comment-author">${this.escapeHtml(comment.username || 'Usuário')}</div>
                    <div class="comment-date">${formattedDate}</div>
                    <div class="comment-text">${this.escapeHtml(comment.content)}</div>
                </div>
                <div class="comment-actions">
                    <button class="btn btn-danger btn-sm" id="delete-comment-${comment.id}">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }

    async deleteComment(commentId) {
        if (!confirm('Tem certeza que deseja excluir este comentário?')) {
            return;
        }

        try {
            await api.deleteComment(commentId);

            // Reload comments tab
            await this.loadTabContent('comments');

        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Erro ao excluir comentário: ' + error.message);
        }
    }

    createNewFanfic() {
        // Clean up existing new fanfic editors if any
        if (this.editors.newSynopsis) {
            this.editors.newSynopsis.destroy();
            delete this.editors.newSynopsis;
        }
        if (this.editors.newDisclaimer) {
            this.editors.newDisclaimer.destroy();
            delete this.editors.newDisclaimer;
        }
        if (this.editors.newTriggerWarnings) {
            this.editors.newTriggerWarnings.destroy();
            delete this.editors.newTriggerWarnings;
        }
        
        // Create modal HTML
        const modalHtml = `
            <div class="modal-overlay" id="new-fanfic-modal">
                <div class="modal-content" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h2>Nova Fanfic</h2>
                        <button class="modal-close" id="close-new-fanfic-modal">&times;</button>
                    </div>
                    <form id="new-fanfic-form">
                        <div class="form-group">
                            <label class="form-label">Título *</label>
                            <input type="text" id="new-fanfic-title" class="form-input" required maxlength="255">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Sinopse *</label>
                            <div id="new-fanfic-synopsis" style="background: white; min-height: 120px;"></div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Categoria *</label>
                            <select id="new-fanfic-category" class="form-input" required>
                                <option value="">Selecione uma categoria</option>
                                <option value="Romance">Romance</option>
                                <option value="Aventura">Aventura</option>
                                <option value="Drama">Drama</option>
                                <option value="Comédia">Comédia</option>
                                <option value="Ficção Científica">Ficção Científica</option>
                                <option value="Fantasia">Fantasia</option>
                                <option value="Terror">Terror</option>
                                <option value="Mistério">Mistério</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Disclaimer</label>
                            <div id="new-fanfic-disclaimer" style="background: white; min-height: 80px;"></div>
                        </div>
                        
                        <!-- Content Warnings Section -->
                        <div class="form-section" style="background-color: var(--pastel-pink); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                            <h4 style="color: var(--intense-pink); margin-bottom: 1rem;">⚠️ Avisos de Conteúdo</h4>
                            <div class="form-group">
                                <label class="form-label">
                                    <input type="checkbox" id="new-fanfic-adult-content" style="width: auto; margin-right: 0.5rem;">
                                    Conteúdo Adulto (+18)
                                </label>
                                <small style="display: block; margin-top: 0.25rem; color: var(--dark-gray);">
                                    Marque se a fanfic contém conteúdo adulto ou sensível
                                </small>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Trigger Warnings (Avisos de Gatilho)</label>
                                <div id="new-fanfic-trigger-warnings" style="background: white; min-height: 80px;"></div>
                                <small style="display: block; margin-top: 0.25rem; color: var(--dark-gray);">
                                    Liste conteúdos potencialmente perturbadores (ex: violência, temas sensíveis)
                                </small>
                            </div>
                        </div>
                        
                        <!-- Tags Section -->
                        <div class="form-section" style="background-color: var(--pastel-purple); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                            <h4 style="color: var(--intense-purple); margin-bottom: 1rem;">🏷️ Tags</h4>
                            
                            <!-- Fandom Tags -->
                            <div class="form-group">
                                <label class="form-label">Fandom Tags (máx. 5)</label>
                                <div class="tag-input-container">
                                    <input type="text" id="fandom-tag-input" class="form-input" placeholder="Digite e pressione Enter">
                                    <div id="fandom-tags-list" class="tags-list"></div>
                                </div>
                                <small style="display: block; margin-top: 0.25rem; color: var(--dark-gray);">
                                    Ex: Harry Potter, Marvel, Naruto
                                </small>
                            </div>
                            
                            <!-- Warning Tags -->
                            <div class="form-group">
                                <label class="form-label">Warning Tags (máx. 5)</label>
                                <div class="tag-input-container">
                                    <input type="text" id="warning-tag-input" class="form-input" placeholder="Digite e pressione Enter">
                                    <div id="warning-tags-list" class="tags-list"></div>
                                </div>
                                <small style="display: block; margin-top: 0.25rem; color: var(--dark-gray);">
                                    Ex: Violência, Linguagem Forte, Temas Sensíveis
                                </small>
                            </div>
                            
                            <!-- Pairing Tags -->
                            <div class="form-group">
                                <label class="form-label">Pairing Tags (máx. 5)</label>
                                <div class="tag-input-container">
                                    <input type="text" id="pairing-tag-input" class="form-input" placeholder="Digite e pressione Enter">
                                    <div id="pairing-tags-list" class="tags-list"></div>
                                </div>
                                <small style="display: block; margin-top: 0.25rem; color: var(--dark-gray);">
                                    Ex: Harry/Hermione, Steve/Tony, Naruto/Sasuke
                                </small>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Capa da Fanfic</label>
                            <input type="file" id="new-fanfic-cover" class="form-input" accept="image/*">
                            <small style="display: block; margin-top: 0.25rem; color: var(--text-secondary);">
                                Formatos aceitos: JPG, PNG, GIF, WEBP (máx. 5MB)
                            </small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">
                                <input type="checkbox" id="new-fanfic-interactive" style="width: auto; margin-right: 0.5rem;">
                                Modo Interativo
                            </label>
                            <small style="display: block; margin-top: 0.25rem; color: var(--text-secondary);">
                                Permite que leitores personalizem a história com suas próprias respostas
                            </small>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="cancel-new-fanfic-btn">Cancelar</button>
                            <button type="button" class="btn btn-secondary" id="save-draft-btn">Salvar como Rascunho</button>
                            <button type="submit" class="btn btn-primary">Publicar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Initialize FanficForm component
        this.fanficForm = new FanficForm('create');
        this.fanficForm.init();

        // Setup close handlers
        const closeModal = () => {
            if (this.fanficForm) {
                this.fanficForm.destroy();
                this.fanficForm = null;
            }
            document.getElementById('new-fanfic-modal').remove();
        };

        document.getElementById('close-new-fanfic-modal').addEventListener('click', closeModal);
        document.getElementById('cancel-new-fanfic-btn').addEventListener('click', closeModal);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const colors = {
            success: { bg: 'var(--pastel-green, #90EE90)', text: 'var(--intense-green, #228B22)' },
            error: { bg: 'var(--pastel-pink, #FFB6C1)', text: 'var(--intense-pink, #DC143C)' },
            info: { bg: 'var(--pastel-blue, #ADD8E6)', text: 'var(--intense-blue, #0066CC)' }
        };
        
        const color = colors[type] || colors.info;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${color.bg};
            color: ${color.text};
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    async publishFanfic() {
        // Validate required fields
        const title = this.currentFanfic.title;
        const synopsis = this.currentFanfic.synopsis;

        if (!title || !synopsis || synopsis.trim() === '' || synopsis === '<p><br></p>') {
            alert('Não é possível publicar: título e sinopse são obrigatórios.');
            return;
        }

        if (!confirm('Tem certeza que deseja publicar esta fanfic? Ela ficará visível para todos os usuários.')) {
            return;
        }

        try {
            await api.publishFanfic(this.currentFanfic.id);

            // Update local data
            this.currentFanfic.is_draft = false;
            this.currentFanfic.published_at = new Date().toISOString();

            // Update the fanfic in the list
            const fanficIndex = this.fanfics.findIndex(f => f.id === this.currentFanfic.id);
            if (fanficIndex !== -1) {
                this.fanfics[fanficIndex].is_draft = false;
                this.fanfics[fanficIndex].published_at = this.currentFanfic.published_at;
            }

            // Reload the fanfics list to update the badge
            await this.loadFanfics();

            // Reload the info tab to show the new status
            await this.loadTabContent('info');

            this.showNotification('Fanfic publicada com sucesso! 🎉', 'success');

        } catch (error) {
            console.error('Error publishing fanfic:', error);
            alert('Erro ao publicar fanfic: ' + error.message);
        }
    }

    async unpublishFanfic() {
        if (!confirm('Tem certeza que deseja despublicar esta fanfic? Ela voltará ao modo rascunho e não será mais visível para outros usuários.')) {
            return;
        }

        try {
            await api.unpublishFanfic(this.currentFanfic.id);

            // Update local data
            this.currentFanfic.is_draft = true;
            this.currentFanfic.published_at = null;

            // Update the fanfic in the list
            const fanficIndex = this.fanfics.findIndex(f => f.id === this.currentFanfic.id);
            if (fanficIndex !== -1) {
                this.fanfics[fanficIndex].is_draft = true;
                this.fanfics[fanficIndex].published_at = null;
            }

            // Reload the fanfics list to update the badge
            await this.loadFanfics();

            // Reload the info tab to show the new status
            await this.loadTabContent('info');

            this.showNotification('Fanfic despublicada com sucesso!', 'success');

        } catch (error) {
            console.error('Error unpublishing fanfic:', error);
            alert('Erro ao despublicar fanfic: ' + error.message);
        }
    }

    showConfirmationModal(title, message, confirmText = 'Confirmar', cancelText = 'Cancelar') {
        return new Promise((resolve) => {
            const modalHtml = `
                <div class="modal" id="confirmation-modal">
                    <div class="modal-overlay"></div>
                    <div class="modal-content" style="max-width: 500px;">
                        <div class="modal-header">
                            <h2>${this.escapeHtml(title)}</h2>
                        </div>
                        <div class="modal-body">
                            <p style="color: var(--dark-gray); line-height: 1.6;">${this.escapeHtml(message)}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="confirmation-cancel-btn">
                                ${this.escapeHtml(cancelText)}
                            </button>
                            <button type="button" class="btn btn-danger" id="confirmation-confirm-btn">
                                ${this.escapeHtml(confirmText)}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);

            const modal = document.getElementById('confirmation-modal');
            const confirmBtn = document.getElementById('confirmation-confirm-btn');
            const cancelBtn = document.getElementById('confirmation-cancel-btn');

            const cleanup = () => {
                modal.remove();
            };

            confirmBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            // Close on overlay click
            modal.querySelector('.modal-overlay').addEventListener('click', () => {
                cleanup();
                resolve(false);
            });
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});
