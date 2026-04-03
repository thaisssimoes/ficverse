// Landing page functionality - loads real fanfics from API

document.addEventListener('DOMContentLoaded', async () => {
    // Load reading list first (for authenticated users)
    await loadReadingList();
    
    await loadTrendingStories();
    
    // Set up category filter if categories menu is available
    if (typeof categoriesMenu !== 'undefined') {
        categoriesMenu.onCategoryChange((category) => {
            filterTrendingStories(category);
        });
    }
    
    // Listen to quick filter changes
    document.addEventListener('categoryFilterChanged', (event) => {
        const category = event.detail.category;
        filterTrendingStories(category);
    });
});

// Store all fanfics for filtering
let allFanficsData = [];

// Load reading list for authenticated users
async function loadReadingList() {
    const container = document.getElementById('reading-list-container');
    
    // Check if user is authenticated
    if (!api.isAuthenticated()) {
        // Don't show reading list for non-authenticated users
        container.innerHTML = '';
        return;
    }
    
    try {
        // Call API to fetch reading list
        const readingList = await api.getReadingList();
        
        // Render reading list section
        container.innerHTML = renderReadingListSection(readingList);
        
    } catch (error) {
        console.error('Error loading reading list:', error);
        // Show empty state on error
        container.innerHTML = renderReadingListSection(null);
    }
}

// Render reading list section
function renderReadingListSection(readingList) {
    // Handle empty state or null
    if (!readingList || readingList.length === 0) {
        return `
            <section class="reading-list-section">
                <div class="container">
                    <h2 class="section-title">Sua Lista de Leitura 📚</h2>
                    <div class="empty-reading-list">
                        <p>Você ainda não começou nenhuma leitura</p>
                        <a href="explore.html" class="btn-primary">Explorar Fanfics</a>
                    </div>
                </div>
            </section>
        `;
    }
    
    // Render section with fanfic cards
    return `
        <section class="reading-list-section">
            <div class="container">
                <h2 class="section-title">Sua Lista de Leitura 📚</h2>
                <div class="reading-list-carousel">
                    <div class="fanfic-grid">
                        ${readingList.map(item => renderReadingListCard(item)).join('')}
                    </div>
                </div>
            </div>
        </section>
    `;
}

// Render individual reading list card
function renderReadingListCard(item) {
    const coverUrl = api.getAssetUrl(item.fanfic_cover_url) || 'https://via.placeholder.com/300x450?text=No+Cover';
    const progress = item.progress_percentage || 0;
    const currentChapter = item.last_chapter_read || 0;
    const totalChapters = item.total_chapters || 0;
    const title = escapeHtml(item.fanfic_title);
    const category = escapeHtml(item.fanfic_category || 'Fanfic');
    
    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    ];
    
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
    const coverStyle = coverUrl && !coverUrl.includes('placeholder')
        ? `background-image: url('${coverUrl}'); background-size: cover; background-position: center;`
        : `background: ${randomGradient};`;
    
    return `
        <div class="story-card reading-list-card" onclick="viewFanfic(${item.fanfic_id})">
            <div class="story-cover" style="${coverStyle}">
                <span class="story-tag">${category}</span>
            </div>
            <div class="story-info">
                <h4>${title}</h4>
                <div class="reading-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">Capítulo ${currentChapter} de ${totalChapters}</span>
                </div>
            </div>
        </div>
    `;
}

// Load trending/recent fanfics
async function loadTrendingStories() {
    const container = document.getElementById('trending-stories');
    
    try {
        // Fetch fanfics from API
        const fanficsByCategory = await api.getFanfics();
        
        // Flatten all fanfics into a single array
        allFanficsData = [];
        for (const category in fanficsByCategory) {
            allFanficsData.push(...fanficsByCategory[category]);
        }
        
        // Check if there are any fanfics
        if (allFanficsData.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📚</div>
                    <h3>Nenhuma história publicada ainda</h3>
                    <p>Seja o primeiro a criar uma fanfic interativa!</p>
                    <a href="register.html" class="btn-primary" style="margin-top: 1rem;">Começar Agora</a>
                </div>
            `;
            return;
        }
        
        // Sort by date (newest first)
        allFanficsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Render all fanfics initially
        renderFanfics(allFanficsData);
        
    } catch (error) {
        console.error('Error loading trending stories:', error);
        container.innerHTML = `
            <div class="error-message">
                <p>Erro ao carregar histórias. Por favor, tente novamente.</p>
                <button onclick="loadTrendingStories()" class="btn-primary" style="margin-top: 1rem;">
                    Tentar Novamente
                </button>
            </div>
        `;
    }
}

// Filter trending stories by category
// Requirement 2.3: Filter displayed fanfics when category is selected
function filterTrendingStories(category) {
    let filteredFanfics;
    
    if (category === 'all') {
        // Show all fanfics
        filteredFanfics = allFanficsData;
    } else if (category === 'interactive') {
        // Show only interactive fanfics
        filteredFanfics = allFanficsData.filter(fanfic => fanfic.interactive_mode === true);
    } else {
        // Normalize category for comparison
        const normalizeCategory = (cat) => {
            if (!cat) return '';
            return cat.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove accents
                .replace(/\s+/g, '-'); // Replace spaces with hyphens
        };
        
        const targetCategory = normalizeCategory(category);
        
        // Filter by category name
        filteredFanfics = allFanficsData.filter(fanfic => {
            const fanficCategory = normalizeCategory(fanfic.category || '');
            return fanficCategory === targetCategory;
        });
    }
    
    // Render filtered fanfics
    renderFanfics(filteredFanfics);
}

// Render fanfics to the container
function renderFanfics(fanfics) {
    const container = document.getElementById('trending-stories');
    
    if (fanfics.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>Nenhuma história encontrada</h3>
                <p>Não há fanfics nesta categoria no momento.</p>
            </div>
        `;
        return;
    }
    
    // Take top 6 for display
    const displayFanfics = fanfics.slice(0, 6);
    
    // Render fanfic cards
    container.innerHTML = displayFanfics.map((fanfic, index) => 
        renderStoryCard(fanfic, index === 1) // Make second card featured
    ).join('');
}

// Render a single story card
function renderStoryCard(fanfic, isFeatured = false) {
    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    ];
    
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
    const coverStyle = fanfic.cover_url
        ? `background-image: url('${api.getAssetUrl(fanfic.cover_url)}'); background-size: cover; background-position: center;`
        : `background: ${randomGradient};`;
    
    const featuredClass = isFeatured ? 'featured' : '';
    const title = escapeHtml(fanfic.title);
    const category = escapeHtml(fanfic.category || 'fanfic');
    
    // Normalize category for data attribute
    const normalizeCategory = (cat) => {
        if (!cat) return 'all';
        return cat.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/\s+/g, '-'); // Replace spaces with hyphens
    };
    
    // Determine category slug for filtering
    let categorySlug = 'all';
    if (fanfic.interactive_mode) {
        categorySlug = 'interactive';
    } else if (fanfic.category) {
        categorySlug = normalizeCategory(fanfic.category);
    }
    
    return `
        <div class="story-card ${featuredClass}" data-category="${categorySlug}" onclick="viewFanfic(${fanfic.id})">
            <div class="story-cover" style="${coverStyle}">
                ${isFeatured ? '<div class="sn-badge">(S/N)</div>' : `<span class="story-tag">${category}</span>`}
            </div>
            <h4>${title}</h4>
        </div>
    `;
}

// Navigate to fanfic detail page
function viewFanfic(fanficId) {
    window.location.href = `fanfic-detail.html?id=${fanficId}`;
}

// Utility function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
