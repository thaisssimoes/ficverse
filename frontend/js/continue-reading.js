// Continue Reading Section Component
// Shows fanfics that the user is currently reading

class ContinueReadingSection {
    constructor() {
        this.container = null;
        this.continueReadingData = [];
    }

    async init() {
        this.container = document.getElementById('continue-reading-container');
        
        if (!this.container) {
            console.error('Continue reading container not found');
            return;
        }

        // Only show if user is authenticated
        if (!api.isAuthenticated()) {
            this.container.style.display = 'none';
            return;
        }

        await this.loadContinueReading();
    }

    async loadContinueReading() {
        try {
            // Get reading list from API
            const readingList = await api.getReadingList();
            
            // Filter to only show fanfics that have been started (not completed)
            this.continueReadingData = readingList.filter(item => {
                return item.progress > 0 && item.progress < 100;
            });

            if (this.continueReadingData.length === 0) {
                this.container.style.display = 'none';
                return;
            }

            this.render();
        } catch (error) {
            console.error('Error loading continue reading:', error);
            this.container.style.display = 'none';
        }
    }

    render() {
        const html = `
            <section class="continue-reading-section">
                <div class="container">
                    <h2 class="section-title">Continue Lendo 📖</h2>
                    
                    <div class="continue-reading-carousel">
                        <div class="fanfic-grid">
                            ${this.continueReadingData.map(item => this.renderCard(item)).join('')}
                        </div>
                    </div>
                </div>
            </section>
        `;

        this.container.innerHTML = html;
        this.container.style.display = 'block';
        this.setupEventListeners();
    }

    renderCard(item) {
        const progressPercent = Math.round(item.progress || 0);
        const coverUrl = api.getAssetUrl(item.fanfic.cover_url) || 'https://via.placeholder.com/300x450/667eea/ffffff?text=No+Cover';

        return `
            <div class="fanfic-card continue-reading-card" data-fanfic-id="${item.fanfic.id}">
                <div class="fanfic-cover">
                    <img src="${coverUrl}" alt="${this.escapeHtml(item.fanfic.title)}">
                    ${item.fanfic.interactive_mode ? '<span class="fanfic-badge interactive">⚡ Interativo</span>' : ''}
                    <div class="continue-reading-overlay">
                        <div class="continue-reading-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progressPercent}%"></div>
                            </div>
                            <span class="progress-text">${progressPercent}% completo</span>
                        </div>
                    </div>
                </div>
                <div class="fanfic-info">
                    <h3 class="fanfic-title">${this.escapeHtml(item.fanfic.title)}</h3>
                    <p class="fanfic-author">por ${this.escapeHtml(item.fanfic.author_name || 'Autor Desconhecido')}</p>
                    ${item.last_chapter_read ? `
                        <p class="last-chapter-read">
                            Último capítulo: ${item.last_chapter_read}
                        </p>
                    ` : ''}
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const cards = this.container.querySelectorAll('.continue-reading-card');
        
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const fanficId = card.dataset.fanficId;
                window.location.href = `fanfic-detail.html?id=${fanficId}`;
            });
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is loaded
let continueReadingSection;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        continueReadingSection = new ContinueReadingSection();
        await continueReadingSection.init();
    });
} else {
    continueReadingSection = new ContinueReadingSection();
    continueReadingSection.init().catch(error => {
        console.error('Error initializing continue reading section:', error);
    });
}
