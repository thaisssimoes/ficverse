// Notifications Component
// Handles notification bell display, badge count, and dropdown
// Requirements: 1.4, 9.1, 9.2, 9.3, 9.4

class Notifications {
    constructor() {
        this.notificationBell = null;
        this.notificationBadge = null;
        this.notificationsDropdown = null;
        this.notificationsList = null;
        this.markAllReadBtn = null;
        this.isDropdownOpen = false;
        this.notifications = [];
        this.unreadCount = 0;
        this.pollInterval = null;
        this.pollIntervalMs = 30000; // Poll every 30 seconds
    }

    // Initialize the notifications component
    init() {
        this.notificationBell = document.querySelector('.notification-bell');
        this.notificationBadge = document.querySelector('.notification-badge');
        this.notificationsDropdown = document.querySelector('.notifications-dropdown');
        this.notificationsList = document.querySelector('.notifications-list');
        this.markAllReadBtn = document.querySelector('.mark-all-read');

        if (!this.notificationBell) {
            console.error('Notification bell element not found');
            return;
        }

        // Update visibility based on authentication state
        // Requirement 9.1: Notification bell visible only when authenticated
        this.updateVisibility();

        // Set up event listeners
        this.setupEventListeners();

        // Load notifications if user is authenticated
        if (api.isAuthenticated()) {
            this.loadNotifications();
            this.startPolling();
        }
    }

    // Update notification bell visibility based on authentication
    // Requirement 9.1: Bell visible only when authenticated
    updateVisibility() {
        const isAuthenticated = api.isAuthenticated();
        
        if (this.notificationBell) {
            this.notificationBell.style.display = isAuthenticated ? 'block' : 'none';
        }
    }

    // Set up event listeners
    setupEventListeners() {
        // Toggle dropdown on bell click
        // Requirement 9.3: Display dropdown with recent notifications
        if (this.notificationBell) {
            this.notificationBell.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isDropdownOpen && this.notificationsDropdown) {
                if (!this.notificationsDropdown.contains(e.target) && 
                    !this.notificationBell.contains(e.target)) {
                    this.closeDropdown();
                }
            }
        });

        // Mark all as read button
        if (this.markAllReadBtn) {
            this.markAllReadBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.markAllAsRead();
            });
        }

        // Close dropdown on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDropdownOpen) {
                this.closeDropdown();
            }
        });
    }

    // Load notifications from API
    // Requirement 9.2: Fetch unread notifications from API
    async loadNotifications() {
        if (!api.isAuthenticated()) {
            return;
        }

        try {
            const data = await api.getNotifications();
            this.notifications = data.notifications || [];
            this.updateBadgeCount();
            this.renderNotifications();
        } catch (error) {
            console.error('Error loading notifications:', error);
            // Show error in dropdown if it's open
            if (this.isDropdownOpen && this.notificationsList) {
                this.notificationsList.innerHTML = `
                    <div class="error-container">
                        <div class="error-icon">⚠️</div>
                        <p class="error-message">Erro ao carregar notificações</p>
                        <button class="btn-retry" onclick="notifications.loadNotifications()">Tentar Novamente</button>
                    </div>
                `;
            }
        }
    }

    // Update badge count
    // Requirement 9.2: Display badge with unread count
    updateBadgeCount() {
        this.unreadCount = this.notifications.filter(n => !n.is_read).length;
        
        if (this.notificationBadge) {
            if (this.unreadCount > 0) {
                this.notificationBadge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                this.notificationBadge.style.display = 'block';
            } else {
                this.notificationBadge.style.display = 'none';
            }
        }
    }

    // Render notifications in dropdown
    renderNotifications() {
        if (!this.notificationsList) {
            return;
        }

        // Clear existing content
        this.notificationsList.innerHTML = '';

        if (this.notifications.length === 0) {
            this.notificationsList.innerHTML = '<p class="no-notifications">Nenhuma notificação</p>';
            return;
        }

        // Render each notification
        this.notifications.forEach(notification => {
            const notificationItem = this.createNotificationElement(notification);
            this.notificationsList.appendChild(notificationItem);
        });
    }

    // Create notification element
    // Requirement 9.4: Navigate to relevant page on click
    createNotificationElement(notification) {
        const div = document.createElement('div');
        div.className = `notification-item ${notification.is_read ? '' : 'unread'}`;
        div.dataset.notificationId = notification.id;

        const content = document.createElement('div');
        content.className = 'notification-content';

        const text = document.createElement('p');
        text.innerHTML = this.formatNotificationText(notification);
        content.appendChild(text);

        const time = document.createElement('span');
        time.className = 'notification-time';
        time.textContent = this.formatTimeAgo(notification.created_at);
        content.appendChild(time);

        div.appendChild(content);

        // Add click handler for navigation
        // Requirement 9.4: Navigate to relevant page
        div.addEventListener('click', async () => {
            await this.handleNotificationClick(notification);
        });

        return div;
    }

    // Format notification text with actor name
    formatNotificationText(notification) {
        const actorName = notification.actor_username || 'Alguém';
        
        switch (notification.type) {
            case 'comment':
                return `<strong>${actorName}</strong> comentou em sua fanfic`;
            case 'like':
                return `<strong>${actorName}</strong> curtiu sua fanfic`;
            case 'follow':
                return `<strong>${actorName}</strong> começou a seguir você`;
            case 'system':
                return notification.content;
            default:
                return notification.content;
        }
    }

    // Format time ago (e.g., "há 5 minutos")
    formatTimeAgo(timestamp) {
        const now = new Date();
        const notificationTime = new Date(timestamp);
        const diffMs = now - notificationTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'agora mesmo';
        } else if (diffMins < 60) {
            return `há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
        } else if (diffHours < 24) {
            return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        } else if (diffDays < 7) {
            return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
        } else {
            return notificationTime.toLocaleDateString('pt-BR');
        }
    }

    // Handle notification click
    // Requirement 9.4: Navigate to relevant page
    async handleNotificationClick(notification) {
        try {
            // Mark as read if unread
            if (!notification.is_read) {
                await api.markNotificationAsRead(notification.id);
                notification.is_read = true;
                this.updateBadgeCount();
                this.renderNotifications();
            }

            // Navigate to target URL
            if (notification.target_url) {
                window.location.href = notification.target_url;
            }
        } catch (error) {
            console.error('Error handling notification click:', error);
        }
    }

    // Toggle dropdown
    // Requirement 9.3: Toggle dropdown on bell click
    toggleDropdown() {
        if (this.isDropdownOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    // Open dropdown
    openDropdown() {
        if (this.notificationsDropdown) {
            this.notificationsDropdown.style.display = 'block';
            this.isDropdownOpen = true;
            
            if (this.notificationBell) {
                this.notificationBell.setAttribute('aria-expanded', 'true');
            }

            // Reload notifications when opening
            this.loadNotifications();
        }
    }

    // Close dropdown
    closeDropdown() {
        if (this.notificationsDropdown) {
            this.notificationsDropdown.style.display = 'none';
            this.isDropdownOpen = false;
            
            if (this.notificationBell) {
                this.notificationBell.setAttribute('aria-expanded', 'false');
            }
        }
    }

    // Mark all notifications as read
    async markAllAsRead() {
        try {
            await api.markAllNotificationsAsRead();
            
            // Update local state
            this.notifications.forEach(n => n.is_read = true);
            this.updateBadgeCount();
            this.renderNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }

    // Start polling for new notifications
    startPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }

        this.pollInterval = setInterval(() => {
            this.loadNotifications();
        }, this.pollIntervalMs);
    }

    // Stop polling
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    // Clean up
    destroy() {
        this.stopPolling();
    }
}

// Initialize notifications when DOM is loaded
let notifications;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        notifications = new Notifications();
        notifications.init();
    });
} else {
    notifications = new Notifications();
    notifications.init();
}
