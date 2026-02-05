// Auth Area Component
// Handles the display of authentication area in the header
// Requirements: 1.5, 1.6, 3.1, 3.4, 3.5

class AuthArea {
    constructor() {
        this.authArea = null;
        this.authButtons = null;
        this.userMenu = null;
        this.userAvatarBtn = null;
        this.userAvatar = null;
        this.userDropdown = null;
        this.logoutBtn = null;
        this.isUserMenuOpen = false;
    }

    // Initialize the auth area component
    async init() {
        this.authArea = document.querySelector('.auth-area');
        this.authButtons = document.querySelector('.auth-buttons');
        this.userMenu = document.querySelector('.user-menu');
        this.userAvatarBtn = document.querySelector('.user-avatar-btn');
        this.userAvatar = document.querySelector('.user-avatar');
        this.userDropdown = document.querySelector('.user-dropdown');
        this.logoutBtn = document.querySelector('.logout-btn');

        if (!this.authArea) {
            console.error('Auth area element not found');
            return;
        }

        console.log('Auth area initialized:', {
            authArea: !!this.authArea,
            authButtons: !!this.authButtons,
            userMenu: !!this.userMenu,
            userAvatarBtn: !!this.userAvatarBtn,
            userDropdown: !!this.userDropdown
        });

        // Verify JWT token validity
        await this.verifyToken();

        // Update display based on authentication state
        this.updateAuthDisplay();

        // Set up event listeners
        this.setupEventListeners();
    }

    // Verify JWT token validity
    // Requirement 21.1: Verificar token JWT
    async verifyToken() {
        if (!api.isAuthenticated()) {
            return;
        }

        try {
            const token = api.getToken();
            
            // Check if token is expired
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expirationTime = payload.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();
            
            if (currentTime >= expirationTime) {
                console.log('Token expired, clearing authentication');
                api.clearToken();
                return;
            }

            // Token is valid
            console.log('Token is valid, user authenticated');
        } catch (error) {
            console.error('Error verifying token:', error);
            // If token is invalid, clear it
            api.clearToken();
        }
    }

    // Update the auth area display based on authentication state
    // Requirement 1.5: Display login/register buttons when not authenticated
    // Requirement 1.6: Display user avatar when authenticated
    // Requirement 21.1: Atualizar estado de autenticação
    async updateAuthDisplay() {
        const isAuthenticated = api.isAuthenticated();

        if (isAuthenticated) {
            // User is authenticated - show avatar
            await this.showAuthenticatedState();
        } else {
            // User is not authenticated - show login/register buttons
            this.showUnauthenticatedState();
        }
    }

    // Show login/register buttons (not authenticated state)
    // Requirement 3.1: Display "Entrar" and "Cadastrar" buttons
    showUnauthenticatedState() {
        if (this.authButtons) {
            this.authButtons.style.display = 'flex';
        }
        if (this.userMenu) {
            this.userMenu.style.display = 'none';
        }
    }

    // Show user avatar and menu (authenticated state)
    // Requirement 3.4: Display user's avatar image
    // Requirement 3.5: Display dropdown menu with profile options
    // Requirement 21.1: Buscar dados do usuário
    async showAuthenticatedState() {
        if (this.authButtons) {
            this.authButtons.style.display = 'none';
        }
        if (this.userMenu) {
            this.userMenu.style.display = 'block';
        }

        // Get user info from token and update avatar
        const user = await this.getUserData();
        if (user && this.userAvatar) {
            // Set avatar image (use placeholder if no avatar URL)
            const avatarUrl = user.avatar || this.getDefaultAvatar(user.username);
            this.userAvatar.src = avatarUrl;
            this.userAvatar.alt = `Avatar de ${user.username}`;
        }
    }

    // Set up event listeners for user menu interactions
    setupEventListeners() {
        // Toggle user dropdown menu on avatar click
        // Requirement 3.5: User menu toggle behavior
        if (this.userAvatarBtn) {
            this.userAvatarBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Avatar button clicked, current menu state:', this.isUserMenuOpen);
                this.toggleUserMenu();
            });
        } else {
            console.warn('User avatar button not found, event listener not attached');
        }

        // Close user menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isUserMenuOpen && this.userDropdown) {
                const clickedInsideDropdown = this.userDropdown.contains(e.target);
                const clickedAvatar = this.userAvatarBtn && this.userAvatarBtn.contains(e.target);
                
                if (!clickedInsideDropdown && !clickedAvatar) {
                    console.log('Clicked outside, closing menu');
                    this.closeUserMenu();
                }
            }
        });

        // Handle logout button click
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.handleLogout();
            });
        }

        // Close dropdown on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isUserMenuOpen) {
                console.log('Escape key pressed, closing menu');
                this.closeUserMenu();
            }
        });
    }

    // Toggle user dropdown menu
    // Requirement 3.5: Toggle dropdown menu on avatar click
    toggleUserMenu() {
        console.log('Toggle menu called, current state:', this.isUserMenuOpen);
        if (this.isUserMenuOpen) {
            this.closeUserMenu();
        } else {
            this.openUserMenu();
        }
    }

    // Open user dropdown menu
    openUserMenu() {
        if (this.userDropdown) {
            console.log('Opening user menu');
            this.userDropdown.style.display = 'block';
            this.isUserMenuOpen = true;
            
            if (this.userAvatarBtn) {
                this.userAvatarBtn.setAttribute('aria-expanded', 'true');
            }
        } else {
            console.error('Cannot open menu: userDropdown element not found');
        }
    }

    // Close user dropdown menu
    closeUserMenu() {
        if (this.userDropdown) {
            console.log('Closing user menu');
            this.userDropdown.style.display = 'none';
            this.isUserMenuOpen = false;
            
            if (this.userAvatarBtn) {
                this.userAvatarBtn.setAttribute('aria-expanded', 'false');
            }
        } else {
            console.error('Cannot close menu: userDropdown element not found');
        }
    }

    // Handle user logout
    async handleLogout() {
        try {
            await api.logout();
            // Redirect to homepage after logout
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Clear token anyway and redirect
            api.clearToken();
            window.location.href = 'index.html';
        }
    }

    // Get user information from JWT token
    // Requirement 21.1: Buscar dados do usuário
    getUserFromToken() {
        if (!api.isAuthenticated()) {
            return null;
        }

        try {
            const token = api.getToken();
            const payload = JSON.parse(atob(token.split('.')[1]));
            return {
                id: payload.user_id,
                username: payload.username,
                email: payload.email,
                avatar: payload.avatar || null
            };
        } catch (error) {
            console.error('Error parsing token:', error);
            return null;
        }
    }

    // Get user data (from token for now, could be extended to fetch from API)
    // Requirement 21.1: Buscar dados do usuário
    async getUserData() {
        // For now, we get user data from the JWT token
        // In the future, this could be extended to fetch fresh data from the API
        return this.getUserFromToken();
    }

    // Generate a default avatar URL based on username
    getDefaultAvatar(username) {
        // Use a placeholder service or generate initials-based avatar
        const initial = username ? username.charAt(0).toUpperCase() : 'U';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6366f1&color=fff&size=128`;
    }
}

// Initialize auth area when DOM is loaded
let authArea;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        authArea = new AuthArea();
        await authArea.init();
    });
} else {
    authArea = new AuthArea();
    authArea.init().catch(error => {
        console.error('Error initializing auth area:', error);
    });
}
