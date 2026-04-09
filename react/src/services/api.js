// Serviço de API — Lollipopfics
// Adaptado do frontend/js/api.js original.
// O token é lido do localStorage diretamente para manter compatibilidade.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('auth_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let networkError;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        // Endpoints de auth retornam 401 para credenciais erradas — não redirecionar
        const isAuthEndpoint = endpoint.startsWith('/auth/');
        if (isAuthEndpoint) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || error.error?.message || 'Email ou senha incorretos.');
        }
        localStorage.removeItem('auth_token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
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
        throw new Error(error.message || 'Usuário já existe. Tente recuperar sua senha ou usar outro email.');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || error.error?.message || `Erro na requisição: ${response.status}`);
      }

      if (response.status === 204) return null;

      return await response.json();
    } catch (error) {
      networkError = error;

      if (error.message && !error.message.includes('Failed to fetch')) {
        throw error;
      }

      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_DELAY * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw networkError ?? new Error('Erro de conexão. Por favor, verifique sua internet e tente novamente.');
}

// Retorna URL absoluta para assets do backend (imagens de capa, etc.)
function getAssetUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return path;
}

// Auth
export const authApi = {
  register: (username, email, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) }),

  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  logout: () =>
    request('/auth/logout', { method: 'POST' }),

  forgotPassword: (email) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (token, password) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
};

// Fanfics
export const fanficApi = {
  getAll: () => request('/fanfics'),
  getById: (id) => request(`/fanfics/${id}`),
  getFeatured: (limit = 5) => request(`/fanfics/featured?limit=${limit}`),
  getTrending: (category = '', limit = 12) => {
    const cat = category ? `&category=${encodeURIComponent(category)}` : '';
    return request(`/fanfics/trending?limit=${limit}${cat}`);
  },
  getByAuthor: (authorId, includeDrafts = false) =>
    request(`/users/${authorId}/fanfics${includeDrafts ? '?includeDrafts=true' : ''}`),
  create: (data) => request('/fanfics', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/fanfics/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/fanfics/${id}`, { method: 'DELETE' }),
  publish: (id) => request(`/fanfics/${id}/publish`, { method: 'POST' }),
  unpublish: (id) => request(`/fanfics/${id}/unpublish`, { method: 'POST' }),
  uploadCover: async (file) => {
    const formData = new FormData();
    formData.append('cover', file);
    const token = localStorage.getItem('auth_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch(`${API_BASE_URL}/upload/cover`, { method: 'POST', headers, body: formData });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Falha no upload da imagem');
    }
    return response.json();
  },
  search: (query) => request(`/search?q=${encodeURIComponent(query)}`),
  searchSuggestions: (query) => request(`/search/suggestions?q=${encodeURIComponent(query)}`),
  searchByTags: (tagIds) => {
    const params = tagIds.map(id => `tagIds=${id}`).join('&');
    return request(`/fanfics/search/tags?${params}`);
  },
  getFavoriteStatus: (id) => request(`/fanfics/${id}/favorite`),
  toggleFavorite: (id) => request(`/fanfics/${id}/favorite`, { method: 'POST' }),
  getUserFavorites: () => request('/favorites'),
  getAssetUrl,
};

// Capítulos
export const chapterApi = {
  getAll: (fanficId) => request(`/fanfics/${fanficId}/chapters`),
  getById: (id) => request(`/chapters/${id}`),
  create: (fanficId, data) => request(`/fanfics/${fanficId}/chapters`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/chapters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/chapters/${id}`, { method: 'DELETE' }),
  publish: (id) => request(`/chapters/${id}/publish`, { method: 'POST' }),
  reorder: (fanficId, order) => request(`/fanfics/${fanficId}/chapters/reorder`, { method: 'PUT', body: JSON.stringify({ order }) }),
  uploadCover: async (chapterId, file) => {
    const formData = new FormData();
    formData.append('cover', file);
    const token = localStorage.getItem('auth_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}/cover`, { method: 'POST', headers, body: formData });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error?.message || 'Falha no upload da capa');
    }
    return response.json();
  },
  updateReadingProgress: (fanficId, lastChapterRead) =>
    request('/reading-progress', { method: 'POST', body: JSON.stringify({ fanfic_id: fanficId, last_chapter_read: lastChapterRead }) }),
  getReadingList: () => request('/reading-list'),
};

// Modo interativo
export const interactiveApi = {
  getQuestions: (fanficId) => request(`/fanfics/${fanficId}/questions`),
  createQuestion: (fanficId, data) => request(`/fanfics/${fanficId}/questions`, { method: 'POST', body: JSON.stringify(data) }),
  updateQuestion: (id, data) => request(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuestion: (id) => request(`/questions/${id}`, { method: 'DELETE' }),
  getAnswers: async (fanficId) => {
    const response = await request(`/fanfics/${fanficId}/answers`);
    return response?.answers || {};
  },
  saveAnswers: (fanficId, answers) =>
    request(`/fanfics/${fanficId}/answers`, { method: 'POST', body: JSON.stringify({ answers }) }),
  updateAnswers: (fanficId, answers) =>
    request(`/fanfics/${fanficId}/answers`, { method: 'PUT', body: JSON.stringify({ answers }) }),
  getPendingQuestions: (fanficId) => request(`/fanfics/${fanficId}/pending-questions`),
};

// Comentários
export const commentApi = {
  getFanficComments: (fanficId) => request(`/fanfics/${fanficId}/comments`),
  getChapterComments: (chapterId) => request(`/chapters/${chapterId}/comments`),
  createFanficComment: (fanficId, content) =>
    request(`/fanfics/${fanficId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  createChapterComment: (chapterId, content) =>
    request(`/chapters/${chapterId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  update: (id, content) =>
    request(`/comments/${id}`, { method: 'PUT', body: JSON.stringify({ content }) }),
  delete: (id) => request(`/comments/${id}`, { method: 'DELETE' }),
};

// Notificações
export const notificationApi = {
  getAll: (unreadOnly = false) => request(`/notifications${unreadOnly ? '?unread=true' : ''}`),
  getUnreadCount: () => request('/notifications/unread-count'),
  markAsRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllAsRead: () => request('/notifications/read-all', { method: 'PUT' }),
  delete: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
};

// Tags
export const tagApi = {
  getAll: (type = '') => request(`/tags${type ? `?type=${encodeURIComponent(type)}` : ''}`),
  search: (query, type = '') => {
    const typeParam = type ? `&type=${encodeURIComponent(type)}` : '';
    return request(`/tags/search?q=${encodeURIComponent(query)}${typeParam}`);
  },
  create: (name, type) => request('/tags', { method: 'POST', body: JSON.stringify({ name, type }) }),
  addToFanfic: (fanficId, tagIds) =>
    request(`/fanfics/${fanficId}/tags`, { method: 'POST', body: JSON.stringify({ tag_ids: tagIds }) }),
  removeFromFanfic: (fanficId, tagId) => request(`/fanfics/${fanficId}/tags/${tagId}`, { method: 'DELETE' }),
  getFanficTags: (fanficId) => request(`/fanfics/${fanficId}/tags`),
};

// Usuário (avatar, banner, perfil público, block)
export const userApi = {
  getMe: () => request('/user/me'),

  updateBio: (bio) => request('/user/bio', { method: 'PUT', body: JSON.stringify({ bio }) }),

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const token = localStorage.getItem('auth_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch(`${API_BASE_URL}/user/avatar`, { method: 'POST', headers, body: formData });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error?.message || 'Falha no upload do avatar');
    }
    return response.json();
  },

  uploadBanner: async (file) => {
    const formData = new FormData();
    formData.append('banner', file);
    const token = localStorage.getItem('auth_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch(`${API_BASE_URL}/user/banner`, { method: 'POST', headers, body: formData });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error?.message || 'Falha no upload do banner');
    }
    return response.json();
  },

  getPublicProfile: (username) => request(`/user/${username}`),

  blockUser: (userId) => request(`/user/${userId}/block`, { method: 'POST' }),

  unblockUser: (userId) => request(`/user/${userId}/block`, { method: 'DELETE' }),
};

// Mural (wall) de conversas do perfil
export const wallApi = {
  getMessages: (userId) => request(`/wall/user/${userId}`),

  postMessage: (userId, content) =>
    request(`/wall/user/${userId}`, { method: 'POST', body: JSON.stringify({ content }) }),

  deleteMessage: (msgId) => request(`/wall/${msgId}`, { method: 'DELETE' }),

  pinMessage: (msgId) => request(`/wall/${msgId}/pin`, { method: 'PUT' }),
};

// Perfil
export const profileApi = {
  // Backward compat — retorna o perfil padrão (primeiro criado)
  getReaderProfile: () => request('/profile/reader-profile'),
  updateReaderProfile: (data) => request('/profile/reader-profile', { method: 'PUT', body: JSON.stringify(data) }),
  getStandardVariables: () => request('/profile/standard-variables'),
  // Multi-perfil
  listProfiles: () => request('/profile/profiles'),
  createProfile: (data) => request('/profile/profiles', { method: 'POST', body: JSON.stringify(data) }),
  updateProfile: (id, data) => request(`/profile/profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProfile: (id) => request(`/profile/profiles/${id}`, { method: 'DELETE' }),
};
