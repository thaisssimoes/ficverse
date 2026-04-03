// Hero Section with Featured Fanfics

class HeroSection {
    constructor() {
        this.featuredFanfics = [];
        this.currentIndex = 0;
        this.isLoading = false;
        
        // DOM elements
        this.heroTitle = document.getElementById('hero-title');
        this.heroSubtitle = document.getElementById('hero-subtitle');
        this.heroBadge = document.getElementById('hero-badge');
        this.heroCtaBtn = document.getElementById('hero-cta-btn');
        this.heroBgImage = document.getElementById('hero-bg-image');
        this.prevBtn = document.getElementById('hero-prev-btn');
        this.nextBtn = document.getElementById('hero-next-btn');
        
        this.init();
    }
    
    async init() {
        await this.loadFeaturedFanfics();
        this.setupEventListeners();
        this.renderCurrentFanfic();
    }
    
    async loadFeaturedFanfics() {
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            // Fetch featured fanfics from API
            const response = await fetch(`${API_BASE_URL}/fanfics`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch featured fanfics');
            }
            
            const data = await response.json();
            
            // Filter for featured fanfics or use the first few
            // For now, we'll take the first 5 fanfics as featured
            this.featuredFanfics = Array.isArray(data) ? data.slice(0, 5) : [];
            
            if (this.featuredFanfics.length === 0) {
                this.showEmptyState();
            } else {
                this.renderCurrentFanfic();
            }
        } catch (error) {
            console.error('Error loading featured fanfics:', error);
            this.showErrorState(error.message);
        } finally {
            this.isLoading = false;
        }
    }
    
    setupEventListeners() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.navigatePrev());
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.navigateNext());
        }
    }
    
    navigatePrev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.renderCurrentFanfic();
        }
    }
    
    navigateNext() {
        if (this.currentIndex < this.featuredFanfics.length - 1) {
            this.currentIndex++;
            this.renderCurrentFanfic();
        }
    }
    
    renderCurrentFanfic() {
        if (this.featuredFanfics.length === 0) {
            return;
        }
        
        const fanfic = this.featuredFanfics[this.currentIndex];
        
        // Add fade-out transition
        this.addTransitionClass('fade-out');
        
        // Wait for fade-out, then update content
        setTimeout(() => {
            // Update title
            if (this.heroTitle) {
                this.heroTitle.textContent = fanfic.title || 'Título não disponível';
            }
            
            // Update subtitle (use synopsis or description)
            if (this.heroSubtitle) {
                const subtitle = fanfic.synopsis || fanfic.description || 'Sua aventura interativa. Você decide o destino.';
                this.heroSubtitle.textContent = this.truncateText(subtitle, 150);
            }
            
            // Update badge based on whether it's interactive
            if (this.heroBadge) {
                if (fanfic.is_interactive) {
                    this.heroBadge.textContent = '✨ DESTAQUE INTERATIVO';
                } else {
                    this.heroBadge.textContent = '📖 DESTAQUE';
                }
            }
            
            // Update CTA button link
            if (this.heroCtaBtn) {
                this.heroCtaBtn.href = `fanfic-detail.html?id=${fanfic.id}`;
            }
            
            // Update background image
            if (this.heroBgImage) {
                const coverUrl = api.getAssetUrl(fanfic.cover_url) || 'https://via.placeholder.com/1920x500?text=Featured+Fanfic';
                this.heroBgImage.src = coverUrl;
                this.heroBgImage.alt = fanfic.title || 'Featured Fanfic';
                
                // Add error handler for image fallback
                this.heroBgImage.onerror = () => {
                    if (this.heroBgImage.src !== 'https://via.placeholder.com/1920x500?text=Sem+Imagem') {
                        this.heroBgImage.src = 'https://via.placeholder.com/1920x500?text=Sem+Imagem';
                        this.heroBgImage.classList.add('image-fallback');
                    }
                };
            }
            
            // Update navigation buttons state
            this.updateNavigationButtons();
            
            // Add fade-in transition
            this.removeTransitionClass('fade-out');
            this.addTransitionClass('fade-in');
            
            // Remove fade-in class after animation
            setTimeout(() => {
                this.removeTransitionClass('fade-in');
            }, 300);
        }, 300);
    }
    
    addTransitionClass(className) {
        const heroInfo = document.querySelector('.hero-info');
        const heroBg = document.querySelector('.hero-background');
        
        if (heroInfo) {
            heroInfo.classList.add(className);
        }
        if (heroBg) {
            heroBg.classList.add(className);
        }
    }
    
    removeTransitionClass(className) {
        const heroInfo = document.querySelector('.hero-info');
        const heroBg = document.querySelector('.hero-background');
        
        if (heroInfo) {
            heroInfo.classList.remove(className);
        }
        if (heroBg) {
            heroBg.classList.remove(className);
        }
    }
    
    updateNavigationButtons() {
        // Disable prev button if at the start
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentIndex === 0;
        }
        
        // Disable next button if at the end
        if (this.nextBtn) {
            this.nextBtn.disabled = this.currentIndex >= this.featuredFanfics.length - 1;
        }
    }
    
    showLoadingState() {
        if (this.heroTitle) {
            this.heroTitle.textContent = 'Carregando...';
        }
        if (this.heroSubtitle) {
            this.heroSubtitle.textContent = 'Buscando fanfics em destaque';
        }
        if (this.prevBtn) {
            this.prevBtn.disabled = true;
        }
        if (this.nextBtn) {
            this.nextBtn.disabled = true;
        }
    }
    
    showEmptyState() {
        if (this.heroTitle) {
            this.heroTitle.textContent = 'Nenhuma fanfic em destaque';
        }
        if (this.heroSubtitle) {
            this.heroSubtitle.textContent = 'Volte em breve para descobrir novas histórias!';
        }
        if (this.heroCtaBtn) {
            this.heroCtaBtn.style.display = 'none';
        }
        if (this.prevBtn) {
            this.prevBtn.disabled = true;
        }
        if (this.nextBtn) {
            this.nextBtn.disabled = true;
        }
    }
    
    showErrorState(errorMessage = 'Não foi possível carregar as fanfics em destaque') {
        if (this.heroTitle) {
            this.heroTitle.textContent = 'Erro ao carregar';
        }
        if (this.heroSubtitle) {
            this.heroSubtitle.innerHTML = `
                ${errorMessage}
                <br><br>
                <button class="btn-retry" onclick="location.reload()">Tentar Novamente</button>
            `;
        }
        if (this.heroCtaBtn) {
            this.heroCtaBtn.style.display = 'none';
        }
        if (this.prevBtn) {
            this.prevBtn.disabled = true;
        }
        if (this.nextBtn) {
            this.nextBtn.disabled = true;
        }
        
        // Set a fallback background
        if (this.heroBgImage) {
            this.heroBgImage.src = 'https://via.placeholder.com/1920x500?text=Erro+ao+Carregar';
        }
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength).trim() + '...';
    }
}

// Initialize hero section when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new HeroSection();
});
