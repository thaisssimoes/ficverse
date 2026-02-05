// API Client for the Interactive Fanfic Platform

const API_BASE_URL = 'http://localhost:8080/api';

class APIClient {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
    }

    // Helper method to make requests with retry logic
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        console.log('API Request:', { method: options.method || 'GET', url, body: options.body });

        let lastError;
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                const response = await fetch(url, {
                    ...options,
                    headers,
                });

                console.log('API Response:', { status: response.status, statusText: response.statusText });

                // Handle different HTTP status codes
                if (response.status === 401) {
                    // Unauthorized - clear token and redirect to login
                    this.clearToken();
                    if (typeof window !== 'undefined' && !window.location.pathname.includes('login')) {
                        window.location.href = '/login.html';
                    }
                    throw new Error('Sessão expirada. Por favor, faça login novamente.');
                }

                if (response.status === 403) {
                    throw new Error('Você não tem permissão para realizar esta ação.');
                }

                if (response.status === 404) {
                    throw new Error('Recurso não encontrado.');
                }

                if (response.status === 409) {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(error.message || 'Conflito: o recurso já existe.');
                }

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    console.error('API Error Response:', error);
                    throw new Error(error.message || error.error?.message || `Erro na requisição: ${response.status}`);
                }

                // Handle 204 No Content
                if (response.status === 204) {
                    return null;
                }

                const data = await response.json();
                console.log('API Response Data:', data);
                return data;
            } catch (error) {
                lastError = error;
                console.error('API Request Error:', error);

                // Don't retry on client errors (4xx) except for network errors
                if (error.message && !error.message.includes('Failed to fetch')) {
                    throw error;
                }

                // Retry on network errors with exponential backoff
                if (attempt < this.maxRetries - 1) {
                    const delay = this.retryDelay * Math.pow(2, attempt);
                    console.log(`Tentativa ${attempt + 1} falhou. Tentando novamente em ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error('API request failed after retries:', error);
                    throw new Error('Erro de conexão. Por favor, verifique sua internet e tente novamente.');
                }
            }
        }

        throw lastError;
    }

    // Authentication methods
    async register(username, email, password) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password }),
        });
        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }

    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }

    async logout() {
        await this.request('/auth/logout', { method: 'POST' });
        this.clearToken();
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('auth_token');
    }

    isAuthenticated() {
        return !!this.token;
    }

    getToken() {
        return this.token;
    }

    // Fanfic methods
    async getFanfics() {
        return await this.request('/fanfics');
    }

    async getFanfic(id) {
        return await this.request(`/fanfics/${id}`);
    }

    async getFeaturedFanfics(limit = 5) {
        return await this.request(`/fanfics/featured?limit=${limit}`);
    }

    async getTrendingFanfics(category = '', limit = 12) {
        const categoryParam = category ? `&category=${encodeURIComponent(category)}` : '';
        return await this.request(`/fanfics/trending?limit=${limit}${categoryParam}`);
    }

    async createFanfic(fanficData) {
        return await this.request('/fanfics', {
            method: 'POST',
            body: JSON.stringify(fanficData),
        });
    }

    async updateFanfic(id, fanficData) {
        return await this.request(`/fanfics/${id}`, {
            method: 'PUT',
            body: JSON.stringify(fanficData),
        });
    }

    async deleteFanfic(id) {
        return await this.request(`/fanfics/${id}`, {
            method: 'DELETE',
        });
    }

    async getAuthorFanfics(authorId) {
        return await this.request(`/users/${authorId}/fanfics`);
    }

    async uploadCover(file) {
        const formData = new FormData();
        formData.append('cover', file);

        const url = `${API_BASE_URL}/upload/cover`;
        const headers = {};

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Falha no upload da imagem');
            }

            return await response.json();
        } catch (error) {
            console.error('Cover upload failed:', error);
            throw error;
        }
    }

    // Chapter methods
    async getChapters(fanficId) {
        return await this.request(`/fanfics/${fanficId}/chapters`);
    }

    async getChapter(id) {
        return await this.request(`/chapters/${id}`);
    }

    async createChapter(fanficId, chapterData) {
        return await this.request(`/fanfics/${fanficId}/chapters`, {
            method: 'POST',
            body: JSON.stringify(chapterData),
        });
    }

    async updateChapter(id, chapterData) {
        return await this.request(`/chapters/${id}`, {
            method: 'PUT',
            body: JSON.stringify(chapterData),
        });
    }

    async deleteChapter(id) {
        return await this.request(`/chapters/${id}`, {
            method: 'DELETE',
        });
    }

    async publishChapter(id) {
        return await this.request(`/chapters/${id}/publish`, {
            method: 'POST',
        });
    }

    async reorderChapters(fanficId, chapterOrder) {
        return await this.request(`/fanfics/${fanficId}/chapters/reorder`, {
            method: 'PUT',
            body: JSON.stringify({ order: chapterOrder }),
        });
    }

    // Interactive mode methods
    async getQuestions(fanficId) {
        return await this.request(`/fanfics/${fanficId}/questions`);
    }

    async createQuestion(fanficId, questionData) {
        return await this.request(`/fanfics/${fanficId}/questions`, {
            method: 'POST',
            body: JSON.stringify(questionData),
        });
    }

    async updateQuestion(questionId, questionData) {
        return await this.request(`/questions/${questionId}`, {
            method: 'PUT',
            body: JSON.stringify(questionData),
        });
    }

    async deleteQuestion(questionId) {
        return await this.request(`/questions/${questionId}`, {
            method: 'DELETE',
        });
    }

    async getAnswers(fanficId) {
        const response = await this.request(`/fanfics/${fanficId}/answers`);
        return response.answers || {};
    }

    async saveAnswers(fanficId, answers) {
        console.log('API saveAnswers called with:', { fanficId, answers });
        const response = await this.request(`/fanfics/${fanficId}/answers`, {
            method: 'POST',
            body: JSON.stringify({ answers }),
        });
        console.log('API saveAnswers response:', response);
        return response;
    }

    async updateAnswers(fanficId, answers) {
        console.log('API updateAnswers called with:', { fanficId, answers });
        const response = await this.request(`/fanfics/${fanficId}/answers`, {
            method: 'PUT',
            body: JSON.stringify({ answers }),
        });
        console.log('API updateAnswers response:', response);
        return response;
    }

    async getPendingQuestions(fanficId) {
        return await this.request(`/fanfics/${fanficId}/pending-questions`);
    }

    // Comment methods
    async getComments(fanficId) {
        return await this.request(`/fanfics/${fanficId}/comments`);
    }

    async getChapterComments(chapterId) {
        return await this.request(`/chapters/${chapterId}/comments`);
    }

    async createComment(fanficId, content) {
        return await this.request(`/fanfics/${fanficId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    }

    async createChapterComment(chapterId, content) {
        return await this.request(`/chapters/${chapterId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    }

    async deleteComment(id) {
        return await this.request(`/comments/${id}`, {
            method: 'DELETE',
        });
    }

    // Notification methods
    async getNotifications(unreadOnly = false) {
        const unreadParam = unreadOnly ? '?unread=true' : '';
        return await this.request(`/notifications${unreadParam}`);
    }

    async getUnreadNotificationCount() {
        return await this.request('/notifications/unread-count');
    }

    async markNotificationAsRead(notificationId) {
        return await this.request(`/notifications/${notificationId}/read`, {
            method: 'PUT',
        });
    }

    async markAllNotificationsAsRead() {
        return await this.request('/notifications/read-all', {
            method: 'PUT',
        });
    }

    async deleteNotification(notificationId) {
        return await this.request(`/notifications/${notificationId}`, {
            method: 'DELETE',
        });
    }

    // Reading list methods
    async getReadingList() {
        return await this.request('/reading-list');
    }

    // Search methods
    async searchSuggestions(query) {
        return await this.request(`/search/suggestions?q=${encodeURIComponent(query)}`);
    }

    async searchFanfics(query) {
        return await this.request(`/search?q=${encodeURIComponent(query)}`);
    }

    // Tag methods
    async getTags(type = '') {
        const typeParam = type ? `?type=${encodeURIComponent(type)}` : '';
        return await this.request(`/tags${typeParam}`);
    }

    async searchTags(query, type = '') {
        const typeParam = type ? `&type=${encodeURIComponent(type)}` : '';
        return await this.request(`/tags/search?q=${encodeURIComponent(query)}${typeParam}`);
    }

    async createTag(name, type) {
        return await this.request('/tags', {
            method: 'POST',
            body: JSON.stringify({ name, type }),
        });
    }

    async addTagsToFanfic(fanficId, tagIds) {
        return await this.request(`/fanfics/${fanficId}/tags`, {
            method: 'POST',
            body: JSON.stringify({ tag_ids: tagIds }),
        });
    }

    async removeTagFromFanfic(fanficId, tagId) {
        return await this.request(`/fanfics/${fanficId}/tags/${tagId}`, {
            method: 'DELETE',
        });
    }

    async getFanficTags(fanficId) {
        return await this.request(`/fanfics/${fanficId}/tags`);
    }

    async searchFanficsByTags(tagIds) {
        const tagIdsParam = tagIds.map(id => `tagIds=${id}`).join('&');
        return await this.request(`/fanfics/search/tags?${tagIdsParam}`);
    }

    // Fanfic publish/unpublish methods
    async publishFanfic(fanficId) {
        return await this.request(`/fanfics/${fanficId}/publish`, {
            method: 'POST',
        });
    }

    async unpublishFanfic(fanficId) {
        return await this.request(`/fanfics/${fanficId}/unpublish`, {
            method: 'POST',
        });
    }

    // Chapter publish method
    async publishChapter(chapterId) {
        return await this.request(`/chapters/${chapterId}/publish`, {
            method: 'POST',
        });
    }
}

// Export a singleton instance
const api = new APIClient();
