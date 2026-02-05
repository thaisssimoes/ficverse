// Application constants

// Predefined categories for fanfics
const CATEGORIES = [
    'Romance',
    'Aventura',
    'Drama',
    'Comédia',
    'Ficção Científica',
    'Fantasia',
    'Terror',
    'Mistério'
];

// Category display names (for consistency)
const CATEGORY_NAMES = {
    'Romance': 'Romance',
    'Aventura': 'Aventura',
    'Drama': 'Drama',
    'Comédia': 'Comédia',
    'Ficção Científica': 'Ficção Científica',
    'Fantasia': 'Fantasia',
    'Terror': 'Terror',
    'Mistério': 'Mistério'
};

// Category icons (optional, for visual enhancement)
const CATEGORY_ICONS = {
    'Romance': '💕',
    'Aventura': '⚔️',
    'Drama': '🎭',
    'Comédia': '😄',
    'Ficção Científica': '🚀',
    'Fantasia': '🔮',
    'Terror': '👻',
    'Mistério': '🔍'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CATEGORIES,
        CATEGORY_NAMES,
        CATEGORY_ICONS
    };
}
