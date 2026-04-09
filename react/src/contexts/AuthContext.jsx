import { createContext, useState, useCallback, useEffect } from 'react';

export const AuthContext = createContext(null);

// Decodifica o payload de um JWT sem biblioteca externa.
// JWT é: header.payload.signature — os dois primeiros são Base64URL.
function decodeJWT(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('auth_token');
    return t ? decodeJWT(t) : null;
  });

  const login = useCallback((newToken) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(decodeJWT(newToken));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  }, []);

  // Merge partial updates into the user object (e.g. after avatar/banner upload)
  const updateUser = useCallback((updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  // Verifica se o token expirou ao montar o contexto
  useEffect(() => {
    if (token) {
      const payload = decodeJWT(token);
      if (payload?.exp && payload.exp * 1000 < Date.now()) {
        logout();
      }
    }
  }, [token, logout]);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}
