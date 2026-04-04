// Categories Menu Component
// Handles the categories dropdown menu in the header
// Requirements: 2.1, 2.2, 2.3, 2.4

class CategoriesMenu {
    constructor() {
        this.categoriesBtn = null;
        this.categoriesDropdown = null;
        this.categoryItems = null;
        this.isCategoriesMenuOpen = false;
        this.selectedCategory = 'all';
        this.onCategoryChangeCallback = null;
    }

    // Initialize the categories menu component
    init() {
        this.categoriesBtn = document.querySelector('.categories-btn');
        this.categoriesDropdown = document.querySelector('.categories-dropdown');
        this.categoryItems = document.querySelectorAll('.category-item');

        if (!this.categoriesBtn || !this.categoriesDropdown) {
            console.error('Categories menu elements not found');
            return;
        }

        // Set up event listeners
        this.setupEventListeners();
    }

    // Set up event listeners for menu interactions
    setupEventListeners() {
        // Toggle categories dropdown on button click
        // Requirement 2.1: Display dropdown when user clicks the Categories menu button
        if (this.categoriesBtn) {
            this.categoriesBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleCategoriesMenu();
            });
        }

        // Handle category item clicks
        // Requirement 2.3: Filter displayed fanfics when user selects a category
        this.categoryItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const category = item.dataset.category;
                this.selectCategory(category);
                this.closeCategoriesMenu();
            });
        });

        // Close categories menu when clicking outside
        // Requirement 2.4: Close dropdown when user clicks outside the menu
        document.addEventListener('click', (e) => {
            if (this.isCategoriesMenuOpen && this.categoriesDropdown) {
                if (!this.categoriesDropdown.contains(e.target) && !this.categoriesBtn.contains(e.target)) {
                    this.closeCategoriesMenu();
                }
            }
        });

        // Close dropdown on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isCategoriesMenuOpen) {
                this.closeCategoriesMenu();
            }
        });
    }

    // Toggle categories dropdown menu
    // Requirement 2.1: Toggle dropdown on button click
    toggleCategoriesMenu() {
        if (this.isCategoriesMenuOpen) {
            this.closeCategoriesMenu();
        } else {
            this.openCategoriesMenu();
        }
    }

    // Open categories dropdown menu
    openCategoriesMenu() {
        if (this.categoriesDropdown) {
            // Position below the header using fixed coordinates
            if (this.categoriesBtn) {
                const headerEl = document.querySelector('.main-header');
                const headerBottom = headerEl
                    ? headerEl.getBoundingClientRect().bottom
                    : this.categoriesBtn.getBoundingClientRect().bottom + 10;
                this.categoriesDropdown.style.position = 'fixed';
                this.categoriesDropdown.style.top = (headerBottom + 4) + 'px';
                this.categoriesDropdown.style.left = '1rem';
                this.categoriesDropdown.style.right = '1rem';
                this.categoriesDropdown.style.maxWidth = '1400px';
                this.categoriesDropdown.style.margin = '0 auto';
            }

            this.categoriesDropdown.style.display = 'block';
            this.isCategoriesMenuOpen = true;

            if (this.categoriesBtn) {
                this.categoriesBtn.setAttribute('aria-expanded', 'true');
            }
        }
    }

    // Close categories dropdown menu
    closeCategoriesMenu() {
        if (this.categoriesDropdown) {
            this.categoriesDropdown.style.display = 'none';
            this.isCategoriesMenuOpen = false;
            
            if (this.categoriesBtn) {
                this.categoriesBtn.setAttribute('aria-expanded', 'false');
            }
        }
    }

    // Select a category and update UI
    // Requirement 2.3: Filter fanfics when category is selected
    selectCategory(category) {
        this.selectedCategory = category;

        // Update active state on category items
        this.categoryItems.forEach(item => {
            if (item.dataset.category === category) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Dispatch event so TrendingSection and other components can react
        document.dispatchEvent(new CustomEvent('categoryFilterChanged', {
            detail: { category }
        }));

        // Trigger callback if set
        if (this.onCategoryChangeCallback) {
            this.onCategoryChangeCallback(category);
        }
    }

    // Get currently selected category
    getSelectedCategory() {
        return this.selectedCategory;
    }

    // Set callback for category change events
    onCategoryChange(callback) {
        this.onCategoryChangeCallback = callback;
    }
}

// Initialize categories menu when DOM is loaded
let categoriesMenu;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        categoriesMenu = new CategoriesMenu();
        categoriesMenu.init();
    });
} else {
    categoriesMenu = new CategoriesMenu();
    categoriesMenu.init();
}
