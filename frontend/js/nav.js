// Dynamic Navigation Component
// Automatically updates navigation based on authentication state

class Navigation {
    constructor() {
        this.init();
    }

    init() {
        this.updateNav();
    }

    updateNav() {
        const nav = document.querySelector('.nav');
        if (!nav) return;

        const isAuthenticated = api.isAuthenticated();

        if (isAuthenticated) {
            // User is logged in - show Dashboard, Profile, Logout
            nav.innerHTML = `
                <a href="index.html" class="nav-link">Início</a>
                <a href="dashboard.html" class="nav-link">Minhas Fanfics</a>
                <a href="profile.html" class="nav-link">Perfil</a>
                <a href="#" id="nav-logout" class="nav-link">Sair</a>
            `;

            // Add logout handler
            const logoutLink = document.getElementById('nav-logout');
            if (logoutLink) {
                logoutLink.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await this.handleLogout();
                });
            }
        } else {
            // User is not logged in - show Login, Register
            nav.innerHTML = `
                <a href="index.html" class="nav-link">Início</a>
                <a href="login.html" class="nav-link">Login</a>
                <a href="register.html" class="nav-link">Registrar</a>
            `;
        }
    }

    async handleLogout() {
        try {
            await api.logout();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Clear token anyway
            api.clearToken();
            window.location.href = 'index.html';
        }
    }

    // Get current user info from token
    getCurrentUser() {
        if (!api.isAuthenticated()) return null;

        try {
            const token = api.getToken();
            const payload = JSON.parse(atob(token.split('.')[1]));
            return {
                id: payload.user_id,
                username: payload.username,
                email: payload.email
            };
        } catch (error) {
            console.error('Error parsing token:', error);
            return null;
        }
    }
}

// Initialize navigation when DOM is ready
let navigation;
document.addEventListener('DOMContentLoaded', () => {
    navigation = new Navigation();
});
