// Profile Page Functionality

class Profile {
    constructor() {
        this.user = null;
        this.init();
    }

    async init() {
        // Check authentication
        if (!api.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        // Get user info from token
        this.user = this.getUserFromToken();
        
        if (!this.user) {
            window.location.href = 'login.html';
            return;
        }

        // Load profile data
        await this.loadProfile();
        await this.loadStats();
        await this.loadRecentFanfics();
        await this.loadReaderProfile();
    }

    getUserFromToken() {
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

    async loadProfile() {
        const container = document.getElementById('profile-info');
        
        container.innerHTML = `
            <div class="profile-info-grid">
                <div class="profile-avatar">
                    <div class="avatar-circle">
                        ${this.user.username.charAt(0).toUpperCase()}
                    </div>
                </div>
                <div class="profile-details">
                    <div class="profile-field">
                        <label class="profile-label">Nome de Usuário</label>
                        <div class="profile-value">${this.escapeHtml(this.user.username)}</div>
                    </div>
                    <div class="profile-field">
                        <label class="profile-label">Email</label>
                        <div class="profile-value">${this.escapeHtml(this.user.email)}</div>
                    </div>
                    <div class="profile-field">
                        <label class="profile-label">ID do Usuário</label>
                        <div class="profile-value">#${this.user.id}</div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadStats() {
        const container = document.getElementById('profile-stats');
        
        try {
            // Get user's fanfics to calculate stats
            const response = await api.getFanfics();
            const allFanfics = Object.values(response).flat();
            const userFanfics = allFanfics.filter(f => f.author_id === this.user.id);
            
            const totalFanfics = userFanfics.length;
            const interactiveFanfics = userFanfics.filter(f => f.interactive_mode).length;
            
            // Calculate total chapters (would need API call per fanfic in real implementation)
            // For now, we'll show placeholder
            
            container.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon">📚</div>
                    <div class="stat-value">${totalFanfics}</div>
                    <div class="stat-label">Fanfics Publicadas</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">✨</div>
                    <div class="stat-value">${interactiveFanfics}</div>
                    <div class="stat-label">Fanfics Interativas</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-value">-</div>
                    <div class="stat-label">Leitores</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💬</div>
                    <div class="stat-value">-</div>
                    <div class="stat-label">Comentários</div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading stats:', error);
            container.innerHTML = `
                <div class="error-message">
                    Erro ao carregar estatísticas
                </div>
            `;
        }
    }

    async loadRecentFanfics() {
        const container = document.getElementById('recent-fanfics');
        
        try {
            const response = await api.getFanfics();
            const allFanfics = Object.values(response).flat();
            const userFanfics = allFanfics
                .filter(f => f.author_id === this.user.id)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5);
            
            if (userFanfics.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>Você ainda não publicou nenhuma fanfic.</p>
                        <a href="dashboard.html" class="btn btn-primary" style="margin-top: 1rem;">
                            Criar Minha Primeira Fanfic
                        </a>
                    </div>
                `;
                return;
            }

            container.innerHTML = userFanfics.map(fanfic => `
                <div class="fanfic-item">
                    <div class="fanfic-item-header">
                        <h4 class="fanfic-item-title">
                            <a href="fanfic-detail.html?id=${fanfic.id}">${this.escapeHtml(fanfic.title)}</a>
                        </h4>
                        <span class="fanfic-badge">${this.escapeHtml(fanfic.category)}</span>
                    </div>
                    <p class="fanfic-item-synopsis">${this.escapeHtml(fanfic.synopsis).substring(0, 150)}...</p>
                    <div class="fanfic-item-footer">
                        <span class="fanfic-item-date">${this.formatDate(fanfic.created_at)}</span>
                        ${fanfic.interactive_mode ? '<span class="fanfic-badge-interactive">✨ Interativa</span>' : ''}
                        <a href="dashboard.html" class="btn btn-sm btn-secondary">Editar</a>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading fanfics:', error);
            container.innerHTML = `
                <div class="error-message">
                    Erro ao carregar fanfics
                </div>
            `;
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    async loadReaderProfile() {
        const form = document.getElementById('reader-profile-form');
        const status = document.getElementById('reader-profile-status');
        if (!form) return;

        const fieldMap = {
            first_name: 'rp-first_name',
            last_name: 'rp-last_name',
            nickname: 'rp-nickname',
            eye_color: 'rp-eye_color',
            hair_color: 'rp-hair_color',
            favorite_color: 'rp-favorite_color',
            favorite_food: 'rp-favorite_food',
        };

        // Pre-fill from backend
        try {
            const profile = await api.getReaderProfile();
            Object.entries(fieldMap).forEach(([key, inputId]) => {
                const el = document.getElementById(inputId);
                if (el && profile[key]) el.value = profile[key];
            });
        } catch (e) { /* no profile yet */ }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            status.textContent = 'Salvando...';
            const data = {};
            Object.entries(fieldMap).forEach(([key, inputId]) => {
                const el = document.getElementById(inputId);
                if (el) data[key] = el.value.trim();
            });
            try {
                await api.updateReaderProfile(data);
                status.textContent = 'Salvo!';
                setTimeout(() => { status.textContent = ''; }, 2500);
            } catch (err) {
                status.textContent = 'Erro ao salvar.';
                console.error(err);
            }
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize profile when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Profile();
});
