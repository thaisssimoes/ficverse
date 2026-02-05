// Quick Filters Component
// Handles category filtering for the homepage

class QuickFilters {
    constructor() {
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.currentCategory = 'all';
        this.init();
    }

    init() {
        // Add click event listeners to all filter buttons
        this.filterButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleFilterClick(e));
        });
    }

    handleFilterClick(event) {
        const button = event.currentTarget;
        const category = button.getAttribute('data-category');

        // Only proceed if clicking a different filter
        if (category === this.currentCategory) {
            return;
        }

        // Remove active class from all buttons
        this.filterButtons.forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked button
        button.classList.add('active');

        // Update current category
        this.currentCategory = category;

        // Trigger filter event
        this.applyFilter(category);
    }

    applyFilter(category) {
        // Dispatch custom event that other components can listen to
        const filterEvent = new CustomEvent('categoryFilterChanged', {
            detail: { category }
        });
        document.dispatchEvent(filterEvent);

        // Also filter the trending section if it exists
        this.filterTrendingSection(category);
    }

    filterTrendingSection(category) {
        const trendingContainer = document.getElementById('trending-stories');
        if (!trendingContainer) return;

        // Get all story cards
        const storyCards = trendingContainer.querySelectorAll('.story-card');

        storyCards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');
            
            if (category === 'all') {
                // Show all cards
                card.style.display = '';
            } else {
                // Show only cards matching the selected category
                if (cardCategory === category) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            }
        });

        // Check if any cards are visible
        const visibleCards = Array.from(storyCards).filter(card => card.style.display !== 'none');
        
        if (visibleCards.length === 0 && category !== 'all') {
            // Show empty state
            const loadingContainer = trendingContainer.querySelector('.loading-container');
            if (loadingContainer) {
                loadingContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📚</div>
                        <h3>Nenhuma fanfic encontrada</h3>
                        <p>Não há fanfics nesta categoria no momento.</p>
                    </div>
                `;
            }
        }
    }

    // Public method to get current category
    getCurrentCategory() {
        return this.currentCategory;
    }

    // Public method to set category programmatically
    setCategory(category) {
        const button = Array.from(this.filterButtons).find(
            btn => btn.getAttribute('data-category') === category
        );

        if (button) {
            button.click();
        }
    }
}

// Initialize quick filters when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.quickFilters = new QuickFilters();
});
