// Tag Search Component

class TagSearch {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.selectedTags = [];
        this.searchResults = [];
        this.isLoading = false;
    }

    /**
     * Initialize the tag search component
     */
    init() {
        this.render();
        this.setupEventListeners();
    }

    /**
     * Render the tag search UI
     */
    render() {
        if (!this.container) {
            console.error('Tag search container not found');
            return;
        }

        this.container.innerHTML = `
            <div class="tag-search-container">
                <!-- Tag Filter Section -->
                <div class="tag-filter-section">
                    <h2 class="tag-filter-title">Buscar por Tags</h2>
                    <p class="tag-filter-description">
                        Selecione tags para encontrar fanfics. Você pode combinar múltiplas tags para refinar sua busca.
                    </p>
                    
                    <!-- Tag Type Tabs -->
                    <div class="tag-type-tabs">
                        <button class="tag-type-tab active" data-type="fandom">
                            Fandom
                        </button>
                        <button class="tag-type-tab" data-type="warning">
                            Avisos
                        </button>
                        <button class="tag-type-tab" data-type="pairing">
                            Casais
                        </button>
                    </div>

                    <!-- Tag Search Input -->
                    <div class="tag-search-input-container">
                        <input 
                            type="text" 
                            id="tag-search-input" 
                            class="tag-search-input" 
                            placeholder="Digite para buscar tags..."
                        />
                        <div id="tag-suggestions" class="tag-suggestions" style="display: none;">
                            <!-- Tag suggestions will appear here -->
                        </div>
                    </div>

                    <!-- Selected Tags -->
                    <div class="selected-tags-section">
                        <h3 class="selected-tags-title">Tags Selecionadas</h3>
                        <div id="selected-tags-container" class="selected-tags-container">
                            <p class="no-tags-message">Nenhuma tag selecionada. Busque e selecione tags acima.</p>
                        </div>
                        <button id="search-by-tags-btn" class="btn btn-primary" style="display: none;">
                            Buscar Fanfics
                        </button>
                        <button id="clear-tags-btn" class="btn btn-secondary" style="display: none;">
                            Limpar Todas
                        </button>
                    </div>
                </div>

                <!-- Search Results Section -->
                <div class="tag-search-results-section">
                    <div id="search-results-header" class="search-results-header" style="display: none;">
                        <h2 class="search-results-title">Resultados da Busca</h2>
                        <p id="results-count" class="results-count"></p>
                    </div>
                    
                    <div id="search-results-container" class="search-results-container">
                        <!-- Results will be displayed here -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Tag type tabs
        const tabs = this.container.querySelectorAll('.tag-type-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => this.handleTabClick(tab));
        });

        // Tag search input
        const searchInput = this.container.querySelector('#tag-search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.handleTagSearch(e.target.value);
                }, 300); // Debounce 300ms
            });

            // Hide suggestions when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.tag-search-input-container')) {
                    this.hideSuggestions();
                }
            });
        }

        // Search button
        const searchBtn = this.container.querySelector('#search-by-tags-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.searchFanficsByTags());
        }

        // Clear button
        const clearBtn = this.container.querySelector('#clear-tags-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllTags());
        }
    }

    /**
     * Handle tag type tab click
     */
    handleTabClick(clickedTab) {
        // Update active tab
        const tabs = this.container.querySelectorAll('.tag-type-tab');
        tabs.forEach(tab => tab.classList.remove('active'));
        clickedTab.classList.add('active');

        // Clear search input and suggestions
        const searchInput = this.container.querySelector('#tag-search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        this.hideSuggestions();
    }

    /**
     * Get currently active tag type
     */
    getActiveTagType() {
        const activeTab = this.container.querySelector('.tag-type-tab.active');
        return activeTab ? activeTab.dataset.type : 'fandom';
    }

    /**
     * Handle tag search input
     */
    async handleTagSearch(query) {
        if (!query || query.trim().length < 2) {
            this.hideSuggestions();
            return;
        }

        const tagType = this.getActiveTagType();

        try {
            const tags = await api.searchTags(query.trim(), tagType);
            this.displaySuggestions(tags);
        } catch (error) {
            console.error('Error searching tags:', error);
            this.hideSuggestions();
        }
    }

    /**
     * Display tag suggestions
     */
    displaySuggestions(tags) {
        const suggestionsContainer = this.container.querySelector('#tag-suggestions');
        
        if (!tags || tags.length === 0) {
            this.hideSuggestions();
            return;
        }

        // Filter out already selected tags
        const availableTags = tags.filter(tag => 
            !this.selectedTags.some(selected => selected.id === tag.id)
        );

        if (availableTags.length === 0) {
            this.hideSuggestions();
            return;
        }

        suggestionsContainer.innerHTML = availableTags.map(tag => `
            <div class="tag-suggestion-item" data-tag-id="${tag.id}" data-tag-name="${tag.name}" data-tag-type="${tag.type}">
                <span class="tag-badge tag-badge-${tag.type}">${tag.name}</span>
            </div>
        `).join('');

        // Add click listeners to suggestions
        suggestionsContainer.querySelectorAll('.tag-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const tagId = parseInt(item.dataset.tagId);
                const tagName = item.dataset.tagName;
                const tagType = item.dataset.tagType;
                this.addTagFilter({ id: tagId, name: tagName, type: tagType });
            });
        });

        suggestionsContainer.style.display = 'block';
    }

    /**
     * Hide tag suggestions
     */
    hideSuggestions() {
        const suggestionsContainer = this.container.querySelector('#tag-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }

    /**
     * Add a tag to the filter
     */
    addTagFilter(tag) {
        // Check if tag is already selected
        if (this.selectedTags.some(t => t.id === tag.id)) {
            return;
        }

        // Add tag to selected tags
        this.selectedTags.push(tag);

        // Update UI
        this.renderSelectedTags();
        this.hideSuggestions();

        // Clear search input
        const searchInput = this.container.querySelector('#tag-search-input');
        if (searchInput) {
            searchInput.value = '';
        }
    }

    /**
     * Remove a tag from the filter
     */
    removeTagFilter(tagId) {
        this.selectedTags = this.selectedTags.filter(tag => tag.id !== tagId);
        this.renderSelectedTags();

        // If no tags selected, clear results
        if (this.selectedTags.length === 0) {
            this.clearResults();
        }
    }

    /**
     * Clear all selected tags
     */
    clearAllTags() {
        this.selectedTags = [];
        this.renderSelectedTags();
        this.clearResults();
    }

    /**
     * Render selected tags
     */
    renderSelectedTags() {
        const container = this.container.querySelector('#selected-tags-container');
        const searchBtn = this.container.querySelector('#search-by-tags-btn');
        const clearBtn = this.container.querySelector('#clear-tags-btn');

        if (this.selectedTags.length === 0) {
            container.innerHTML = '<p class="no-tags-message">Nenhuma tag selecionada. Busque e selecione tags acima.</p>';
            searchBtn.style.display = 'none';
            clearBtn.style.display = 'none';
            return;
        }

        container.innerHTML = this.selectedTags.map(tag => `
            <div class="selected-tag-item">
                <span class="tag-badge tag-badge-${tag.type}">${tag.name}</span>
                <button class="remove-tag-btn" data-tag-id="${tag.id}" title="Remover tag">
                    ×
                </button>
            </div>
        `).join('');

        // Add click listeners to remove buttons
        container.querySelectorAll('.remove-tag-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tagId = parseInt(btn.dataset.tagId);
                this.removeTagFilter(tagId);
            });
        });

        searchBtn.style.display = 'inline-block';
        clearBtn.style.display = 'inline-block';
    }

    /**
     * Search fanfics by selected tags
     */
    async searchFanficsByTags() {
        if (this.selectedTags.length === 0) {
            return;
        }

        this.isLoading = true;
        this.showLoading();

        try {
            const tagIds = this.selectedTags.map(tag => tag.id);
            const fanfics = await api.searchFanficsByTags(tagIds);
            
            this.searchResults = fanfics || [];
            this.displayResults();
        } catch (error) {
            console.error('Error searching fanfics by tags:', error);
            this.showError('Erro ao buscar fanfics. Por favor, tente novamente.');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        const resultsContainer = this.container.querySelector('#search-results-container');
        const resultsHeader = this.container.querySelector('#search-results-header');
        
        resultsHeader.style.display = 'block';
        resultsContainer.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p class="loading-text">Buscando fanfics...</p>
            </div>
        `;
    }

    /**
     * Display search results
     */
    displayResults() {
        const resultsContainer = this.container.querySelector('#search-results-container');
        const resultsHeader = this.container.querySelector('#search-results-header');
        const resultsCount = this.container.querySelector('#results-count');

        resultsHeader.style.display = 'block';

        if (this.searchResults.length === 0) {
            resultsCount.textContent = 'Nenhum resultado encontrado';
            resultsContainer.innerHTML = `
                <div class="no-results-message">
                    <p>😔 Nenhuma fanfic encontrada com as tags selecionadas.</p>
                    <p>Tente remover algumas tags ou selecionar tags diferentes.</p>
                </div>
            `;
            return;
        }

        resultsCount.textContent = `${this.searchResults.length} fanfic${this.searchResults.length > 1 ? 's' : ''} encontrada${this.searchResults.length > 1 ? 's' : ''}`;

        resultsContainer.innerHTML = `
            <div class="fanfics-grid">
                ${this.searchResults.map(fanfic => this.createFanficCard(fanfic)).join('')}
            </div>
        `;

        // Add click listeners to fanfic cards
        resultsContainer.querySelectorAll('.fanfic-card').forEach(card => {
            card.addEventListener('click', () => {
                const fanficId = card.dataset.fanficId;
                window.location.href = `fanfic-detail.html?id=${fanficId}`;
            });
        });
    }

    /**
     * Create a fanfic card HTML
     */
    createFanficCard(fanfic) {
        const coverUrl = api.getAssetUrl(fanfic.cover_url) || 'https://via.placeholder.com/250x350?text=Sem+Capa';
        const synopsis = fanfic.synopsis || 'Sem sinopse disponível';
        const truncatedSynopsis = synopsis.length > 150 ? synopsis.substring(0, 150) + '...' : synopsis;

        // Build badges HTML
        let badgesHtml = '';
        if (fanfic.is_adult_content) {
            badgesHtml += '<span class="fanfic-badge badge-adult" title="Conteúdo adulto">🔞 18+</span>';
        }
        if (fanfic.trigger_warnings && fanfic.trigger_warnings.trim()) {
            badgesHtml += '<span class="fanfic-badge badge-warning" title="Contém avisos de gatilho">⚠️ TW</span>';
        }

        // Build tags HTML grouped by type
        let tagsHtml = '';
        if (fanfic.tags && fanfic.tags.length > 0) {
            // Group tags by type
            const fandomTags = fanfic.tags.filter(tag => tag.type === 'fandom');
            const warningTags = fanfic.tags.filter(tag => tag.type === 'warning');
            const pairingTags = fanfic.tags.filter(tag => tag.type === 'pairing');
            
            tagsHtml = '<div class="fanfic-tags">';
            
            // Display up to 3 tags total (prioritize fandom, then pairing, then warning)
            const displayTags = [...fandomTags.slice(0, 2), ...pairingTags.slice(0, 1), ...warningTags.slice(0, 1)].slice(0, 3);
            
            displayTags.forEach(tag => {
                tagsHtml += `<span class="tag-badge tag-badge-${tag.type}" title="${tag.name}">${tag.name}</span>`;
            });
            
            // Show "+X more" if there are more tags
            const remainingCount = fanfic.tags.length - displayTags.length;
            if (remainingCount > 0) {
                tagsHtml += `<span class="tag-badge tag-badge-more">+${remainingCount}</span>`;
            }
            
            tagsHtml += '</div>';
        }

        return `
            <div class="fanfic-card" data-fanfic-id="${fanfic.id}">
                <div class="fanfic-card-cover-container">
                    <img src="${coverUrl}" alt="${fanfic.title}" class="fanfic-card-cover" />
                    ${badgesHtml ? `<div class="fanfic-badges">${badgesHtml}</div>` : ''}
                    <div class="fanfic-card-overlay">
                        <p class="fanfic-card-synopsis">${truncatedSynopsis}</p>
                        <button class="btn btn-primary fanfic-card-btn">Ver Detalhes</button>
                    </div>
                </div>
                <div class="fanfic-card-info">
                    ${fanfic.category ? `<span class="fanfic-badge badge-category">${fanfic.category}</span>` : ''}
                    <h3 class="fanfic-card-title">${fanfic.title}</h3>
                    ${tagsHtml}
                </div>
            </div>
        `;
    }

    /**
     * Show error message
     */
    showError(message) {
        const resultsContainer = this.container.querySelector('#search-results-container');
        const resultsHeader = this.container.querySelector('#search-results-header');
        
        resultsHeader.style.display = 'block';
        resultsContainer.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
            </div>
        `;
    }

    /**
     * Clear search results
     */
    clearResults() {
        const resultsContainer = this.container.querySelector('#search-results-container');
        const resultsHeader = this.container.querySelector('#search-results-header');
        
        resultsHeader.style.display = 'none';
        resultsContainer.innerHTML = '';
        this.searchResults = [];
    }
}
