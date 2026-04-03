// Homepage functionality

document.addEventListener('DOMContentLoaded', async () => {
    await loadHomepage();
});

// Load and display fanfics grouped by category
async function loadHomepage() {
    const container = document.getElementById('fanfics-container');
    
    try {
        // Show loading state
        container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p class="loading-text">Carregando fanfics...</p>
            </div>
        `;
        
        // Fetch fanfics from API
        const fanficsByCategory = await api.getFanfics();
        
        // Check if there are any fanfics
        if (!fanficsByCategory || Object.keys(fanficsByCategory).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📚</div>
                    <h3>Nenhuma fanfic publicada ainda</h3>
                    <p>Seja o primeiro a publicar uma história!</p>
                </div>
            `;
            return;
        }
        
        // Render fanfics grouped by category
        container.innerHTML = renderFanficsByCategory(fanficsByCategory);
        
    } catch (error) {
        console.error('Error loading fanfics:', error);
        container.innerHTML = `
            <div class="error-message">
                <p>Erro ao carregar fanfics. Por favor, tente novamente.</p>
            </div>
        `;
    }
}

// Render fanfics grouped by category
function renderFanficsByCategory(fanficsByCategory) {
    let html = '';
    
    // Sort categories alphabetically
    const categories = Object.keys(fanficsByCategory).sort();
    
    for (const category of categories) {
        const fanfics = fanficsByCategory[category];
        
        // Sort fanfics by date (newest first) within each category
        fanfics.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        html += `
            <section class="category-section">
                <h2 class="category-title">${escapeHtml(category)}</h2>
                <div class="fanfics-grid">
                    ${fanfics.map(fanfic => renderFanficCard(fanfic)).join('')}
                </div>
            </section>
        `;
    }
    
    return html;
}

// Render a single fanfic card
function renderFanficCard(fanfic) {
    const coverUrl = api.getAssetUrl(fanfic.cover_url) || 'https://via.placeholder.com/300x450?text=No+Cover';
    
    // Build badges HTML
    let badgesHtml = '';
    
    // Adult content badge
    if (fanfic.is_adult_content) {
        badgesHtml += '<span class="fanfic-badge badge-adult" title="Conteúdo adulto">🔞 18+</span>';
    }
    
    // Trigger warning badge
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
            tagsHtml += `<span class="tag-badge tag-badge-${tag.type}" title="${escapeHtml(tag.name)}">${escapeHtml(tag.name)}</span>`;
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
                <img src="${coverUrl}" alt="${escapeHtml(fanfic.title)}" class="fanfic-card-cover">
                ${badgesHtml ? `<div class="fanfic-badges">${badgesHtml}</div>` : ''}
                <div class="fanfic-card-overlay">
                    <div class="fanfic-card-synopsis">
                        <p>${escapeHtml(fanfic.synopsis)}</p>
                    </div>
                    <button class="btn btn-primary fanfic-card-btn" onclick="viewFanficDetail(${fanfic.id})">
                        Ler Mais
                    </button>
                </div>
            </div>
            <div class="fanfic-card-info">
                ${fanfic.category ? `<span class="fanfic-badge badge-category">${escapeHtml(fanfic.category)}</span>` : ''}
                <h3 class="fanfic-card-title">${escapeHtml(fanfic.title)}</h3>
                ${tagsHtml}
            </div>
        </div>
    `;
}

// Function to navigate to fanfic detail page
function viewFanficDetail(fanficId) {
    window.location.href = `fanfic-detail.html?id=${fanficId}`;
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load reading list for authenticated users
async function loadReadingList() {
    // Check if user is authenticated
    if (!api.isAuthenticated()) {
        return null;
    }
    
    try {
        // Call API to fetch reading list
        const readingList = await api.getReadingList();
        return readingList;
    } catch (error) {
        console.error('Error loading reading list:', error);
        // Return null on error to handle gracefully
        return null;
    }
}

// Render reading list section
function renderReadingListSection(readingList) {
    // Handle empty state or null
    if (!readingList || readingList.length === 0) {
        return `
            <section class="reading-list-section">
                <h2 class="section-title">Sua Lista de Leitura 📚</h2>
                <div class="empty-reading-list">
                    <p>Você ainda não começou nenhuma leitura</p>
                    <a href="explore.html" class="btn-primary">Explorar Fanfics</a>
                </div>
            </section>
        `;
    }
    
    // Render section with fanfic cards
    return `
        <section class="reading-list-section">
            <h2 class="section-title">Sua Lista de Leitura 📚</h2>
            <div class="reading-list-carousel">
                <div class="fanfic-grid">
                    ${readingList.map(item => renderReadingListCard(item)).join('')}
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
    
    return `
        <div class="fanfic-card reading-list-card" data-fanfic-id="${item.fanfic_id}">
            <div class="fanfic-card-cover-container">
                <img src="${coverUrl}" alt="${escapeHtml(item.fanfic_title)}" class="fanfic-card-cover">
                <div class="fanfic-card-overlay">
                    <div class="fanfic-card-synopsis">
                        <p>${escapeHtml(item.fanfic_synopsis || 'Sem sinopse disponível')}</p>
                    </div>
                    <button class="btn btn-primary fanfic-card-btn" onclick="viewFanficDetail(${item.fanfic_id})">
                        Continuar Leitura
                    </button>
                </div>
            </div>
            <div class="fanfic-card-info">
                <h3 class="fanfic-card-title">${escapeHtml(item.fanfic_title)}</h3>
                <span class="fanfic-card-category">${escapeHtml(item.fanfic_category)}</span>
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
