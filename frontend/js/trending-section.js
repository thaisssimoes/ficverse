// Trending Section Component
// Handles the "Bombando Hoje" section with fanfic carousel

class TrendingSection {
    constructor() {
        this.grid = document.getElementById('trending-fanfics-grid');
        this.prevBtn = document.getElementById('trending-prev-btn');
        this.nextBtn = document.getElementById('trending-next-btn');
        this.trendingFanfics = [];
        this.currentCategory = 'all';
        
        this.init();
    }
    
    init() {
        // Load trending fanfics on initialization
        this.loadTrendingFanfics();
        
        // Set up navigation buttons
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.scrollPrev());
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.scrollNext());
        }
        
        // Listen for category filter changes
        document.addEventListener('categoryFilterChanged', (e) => {
            this.currentCategory = e.detail.category;
            this.filterFanfics();
        });
    }
    
    async loadTrendingFanfics() {
        if (!this.grid) return;
        
        try {
            // Show loading state
            this.grid.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p class="loading-text">Carregando histórias...</p>
                </div>
            `;
            
            // Fetch fanfics from API
            const fanfics = await api.getFanfics();
            
            // Convert object to array if needed
            let fanficsArray = [];
            if (Array.isArray(fanfics)) {
                fanficsArray = fanfics;
            } else if (typeof fanfics === 'object') {
                // If it's an object with categories, flatten it
                fanficsArray = Object.values(fanfics).flat();
            }
            
            // Store all fanfics
            this.trendingFanfics = fanficsArray;
            
            // Render fanfics
            this.renderFanfics(this.trendingFanfics);
            
        } catch (error) {
            console.error('Error loading trending fanfics:', error);
            this.showErrorState();
        }
    }
    
    showErrorState() {
        if (!this.grid) return;
        
        this.grid.innerHTML = `
            <div class="error-container">
                <div class="error-icon">⚠️</div>
                <p class="error-message">Não foi possível carregar as fanfics. Por favor, tente novamente.</p>
                <button class="btn-retry" onclick="location.reload()">Tentar Novamente</button>
            </div>
        `;
    }
    
    filterFanfics() {
        if (this.currentCategory === 'all') {
            this.renderFanfics(this.trendingFanfics);
        } else if (this.currentCategory === 'interactive') {
            const filtered = this.trendingFanfics.filter(fanfic => fanfic.interactive_mode === true);
            this.renderFanfics(filtered);
        } else {
            // Normalize category for comparison
            const normalizeCategory = (cat) => {
                if (!cat) return '';
                return cat.toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '') // Remove accents
                    .replace(/\s+/g, '-'); // Replace spaces with hyphens
            };
            
            const targetCategory = normalizeCategory(this.currentCategory);
            const filtered = this.trendingFanfics.filter(fanfic => {
                const fanficCategory = normalizeCategory(fanfic.category || '');
                return fanficCategory === targetCategory;
            });
            this.renderFanfics(filtered);
        }
    }
    
    renderFanfics(fanfics) {
        if (!this.grid) return;
        
        if (!fanfics || fanfics.length === 0) {
            this.grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📚</div>
                    <h3>Nenhuma fanfic encontrada</h3>
                    <p>Tente outro filtro ou volte mais tarde!</p>
                </div>
            `;
            return;
        }
        
        // Render fanfic cards
        this.grid.innerHTML = fanfics.map(fanfic => this.renderFanficCard(fanfic)).join('');
        
        // Add click handlers to cards
        this.grid.querySelectorAll('.fanfic-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't navigate if clicking on a button
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                    return;
                }
                const fanficId = card.dataset.fanficId;
                if (fanficId) {
                    window.location.href = `fanfic-detail.html?id=${fanficId}`;
                }
            });
        });
    }
    
    renderFanficCard(fanfic) {
        const coverUrl = fanfic.cover_url || 'https://via.placeholder.com/300x450?text=No+Cover';
        const isInteractive = fanfic.is_interactive || false;
        const badge = isInteractive ? '⚡ INTERATIVO' : '📖 LEITURA';
        const badgeClass = isInteractive ? 'interactive' : 'reading';
        
        // Get stats
        const views = fanfic.views || 0;
        const likes = fanfic.likes || 0;
        
        // Format numbers
        const formatNumber = (num) => {
            if (num >= 1000) {
                return (num / 1000).toFixed(1) + 'k';
            }
            return num.toString();
        };
        
        // Build additional badges HTML
        let additionalBadges = '';
        if (fanfic.is_adult_content) {
            additionalBadges += '<span class="fanfic-badge badge-adult" title="Conteúdo adulto">🔞 18+</span>';
        }
        if (fanfic.trigger_warnings && fanfic.trigger_warnings.trim()) {
            additionalBadges += '<span class="fanfic-badge badge-warning" title="Contém avisos de gatilho">⚠️ TW</span>';
        }
        
        return `
            <div class="fanfic-card" data-fanfic-id="${fanfic.id}">
                <div class="fanfic-cover">
                    <img src="${this.escapeHtml(coverUrl)}" 
                         alt="${this.escapeHtml(fanfic.title)}" 
                         loading="lazy"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/300x450?text=Sem+Imagem'; this.classList.add('image-fallback');">
                    <span class="fanfic-badge ${badgeClass}">${badge}</span>
                    ${additionalBadges}
                </div>
                <div class="fanfic-info">
                    <h3 class="fanfic-title">${this.escapeHtml(fanfic.title)}</h3>
                    <p class="fanfic-author">Por @${this.escapeHtml(fanfic.author?.username || 'Anônimo')}</p>
                    <div class="fanfic-stats">
                        <span class="stat-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            ${formatNumber(views)}
                        </span>
                        <span class="stat-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            ${formatNumber(likes)}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }
    
    scrollPrev() {
        if (!this.grid) return;
        const scrollAmount = this.grid.offsetWidth * 0.8;
        this.grid.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    }
    
    scrollNext() {
        if (!this.grid) return;
        const scrollAmount = this.grid.offsetWidth * 0.8;
        this.grid.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize trending section when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TrendingSection();
});
