// Search Bar Functionality

class SearchBar {
    constructor() {
        this.searchInput = document.querySelector('.search-input');
        this.searchButton = document.querySelector('.search-icon');
        this.searchDropdown = null;
        this.debounceTimer = null;
        this.debounceDelay = 300; // 300ms delay for debouncing
        
        this.init();
    }
    
    init() {
        if (!this.searchInput || !this.searchButton) {
            console.warn('Search bar elements not found');
            return;
        }
        
        // Create search suggestions dropdown
        this.createDropdown();
        
        // Add event listeners
        this.searchInput.addEventListener('input', (e) => this.handleInput(e));
        this.searchInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.searchButton.addEventListener('click', () => this.handleSearch());
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
    }
    
    createDropdown() {
        // Create dropdown element
        this.searchDropdown = document.createElement('div');
        this.searchDropdown.className = 'search-dropdown';
        this.searchDropdown.style.display = 'none';
        
        // Insert after search bar
        const searchBar = document.querySelector('.search-bar');
        if (searchBar) {
            searchBar.appendChild(this.searchDropdown);
        }
    }
    
    handleInput(e) {
        const query = e.target.value.trim();
        
        // Clear previous debounce timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        // If query is empty, hide dropdown
        if (!query) {
            this.hideDropdown();
            return;
        }
        
        // Debounce the search suggestions request
        this.debounceTimer = setTimeout(() => {
            this.fetchSuggestions(query);
        }, this.debounceDelay);
    }
    
    async fetchSuggestions(query) {
        try {
            // Call API for search suggestions
            const suggestions = await api.searchSuggestions(query);
            
            if (suggestions && suggestions.length > 0) {
                this.displaySuggestions(suggestions);
            } else {
                this.showNoResults();
            }
        } catch (error) {
            console.error('Error fetching search suggestions:', error);
            this.showSearchError();
        }
    }
    
    showNoResults() {
        if (!this.searchDropdown) return;
        
        this.searchDropdown.innerHTML = `
            <div class="search-no-results">
                <p>Nenhum resultado encontrado</p>
            </div>
        `;
        this.showDropdown();
    }
    
    showSearchError() {
        if (!this.searchDropdown) return;
        
        this.searchDropdown.innerHTML = `
            <div class="search-error">
                <p>Erro ao buscar sugestões</p>
            </div>
        `;
        this.showDropdown();
        
        // Hide error after 2 seconds
        setTimeout(() => {
            this.hideDropdown();
        }, 2000);
    }
    
    displaySuggestions(suggestions) {
        // Clear previous suggestions
        this.searchDropdown.innerHTML = '';
        
        // Create suggestion items
        suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'search-suggestion-item';
            item.textContent = suggestion.title;
            item.dataset.fanficId = suggestion.id;
            
            // Add click handler
            item.addEventListener('click', () => {
                this.selectSuggestion(suggestion);
            });
            
            this.searchDropdown.appendChild(item);
        });
        
        // Show dropdown
        this.showDropdown();
    }
    
    selectSuggestion(suggestion) {
        // Navigate to fanfic detail page
        window.location.href = `fanfic-detail.html?id=${suggestion.id}`;
    }
    
    handleKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.handleSearch();
        } else if (e.key === 'Escape') {
            this.hideDropdown();
        }
    }
    
    handleSearch() {
        const query = this.searchInput.value.trim();
        
        if (!query) {
            return;
        }
        
        // Navigate to search results page
        window.location.href = `explore.html?search=${encodeURIComponent(query)}`;
    }
    
    handleOutsideClick(e) {
        const searchBar = document.querySelector('.search-bar');
        if (searchBar && !searchBar.contains(e.target)) {
            this.hideDropdown();
        }
    }
    
    showDropdown() {
        if (this.searchDropdown) {
            this.searchDropdown.style.display = 'block';
        }
    }
    
    hideDropdown() {
        if (this.searchDropdown) {
            this.searchDropdown.style.display = 'none';
        }
    }
}

// Initialize search bar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SearchBar();
});
