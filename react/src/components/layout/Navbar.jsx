import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../services/api';
import styles from './Navbar.module.css';

/* ── Ícones SVG inline ─────────────────────────────────────────── */
const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconExplore = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden>
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const IconTag = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);
const IconBook = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const IconGuia = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconHeart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconSun = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);
const IconMoon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);
const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
/* Ícone de painel com seta — indica recolher/expandir sidebar */
const IconAdmin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconPanelClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="16" height="16" aria-hidden>
    {/* painel esquerdo */}
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    {/* seta apontando para a esquerda (recolher) */}
    <polyline points="13 8 17 12 13 16" />
  </svg>
);
const IconPanelOpen = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="16" height="16" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    {/* seta apontando para a direita (expandir) */}
    <polyline points="11 8 7 12 11 16" />
  </svg>
);

export default function Navbar({ readingMode = false }) {
  const { isAuthenticated, user, logout } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const publishGuideOpen = location.pathname === '/dashboard' || location.pathname === '/como-publicar';

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('navCollapsed') === 'true'
  );
  const navigate = useNavigate();

  // Em modo leitura, o usuário pode clicar para expandir temporariamente
  // readingExpanded sobrescreve o comportamento compacto forçado pelo readingMode
  const [readingExpanded, setReadingExpanded] = useState(false);

  // isCompact: ícones apenas, sem labels
  const isCompact = readingMode
    ? !readingExpanded   // no modo leitura: compacto exceto quando expandido manualmente
    : collapsed;         // fora da leitura: segue o estado persistido

  // Sincroniza a CSS variable --nav-sidebar-width com o estado atual
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--nav-sidebar-width',
      isCompact ? '56px' : '240px'
    );
  }, [isCompact]);

  const toggleCollapsed = () => {
    if (readingMode) {
      // Em leitura: alterna a expansão temporária (não persiste)
      setReadingExpanded((v) => !v);
    } else {
      const next = !collapsed;
      setCollapsed(next);
      localStorage.setItem('navCollapsed', String(next));
    }
  };

  const mobileSearchRef = useRef(null);

  const toggleTheme = useCallback(() => {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next === 'dark' ? 'dark' : '');
    localStorage.setItem('theme', next);
    setIsDark(next === 'dark');
  }, [isDark]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target)) {
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    queryClient.clear();
    navigate('/');
  };

  const initials = user?.username?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          DESKTOP: Sidebar fixa à esquerda
          ═══════════════════════════════════════════════════ */}
      <aside className={[
        styles.sidebar,
        isCompact   ? styles.sidebarCompact  : '',
        readingMode ? styles.sidebarReading  : '',
      ].join(' ')}>

        {/* Logo */}
        <Link
          to={isAuthenticated ? '/home' : '/'}
          className={styles.logo}
          title="ficverse"
        >
          {isCompact ? (
            <span className={styles.logoCompact}>
              <span className={styles.logoItalic}>f</span>
              <span className={styles.logoDot} />
            </span>
          ) : (
            <>
              <span className={styles.logoItalic}>fic</span>
              <span className={styles.logoDot} />
              <span>verse</span>
            </>
          )}
        </Link>


        {/* Navegação principal */}
        <nav className={styles.sideNav}>
          <NavLink
            to={isAuthenticated ? '/home' : '/'}
            className={({ isActive }) => `${styles.navItem} ${isCompact ? styles.navItemCompact : ''} ${isActive ? styles.navActive : ''}`}
            title="Início"
          >
            <IconHome />{!isCompact && <span>Início</span>}
          </NavLink>
          <NavLink
            to="/explore"
            className={({ isActive }) => `${styles.navItem} ${isCompact ? styles.navItemCompact : ''} ${isActive ? styles.navActive : ''}`}
            title="Explorar"
          >
            <IconExplore />{!isCompact && <span>Explorar</span>}
          </NavLink>
          <NavLink
            to="/tags"
            className={({ isActive }) => `${styles.navItem} ${isCompact ? styles.navItemCompact : ''} ${isActive ? styles.navActive : ''}`}
            title="Buscar Tags"
          >
            <IconTag />{!isCompact && <span>Buscar Tags</span>}
          </NavLink>
        </nav>

        {isAuthenticated && (
          <>
            <div className={styles.navDivider} />
            <nav className={styles.sideNav}>
              {/* Minhas Publicações com submenu "Como Publicar" */}
              <div className={styles.navGroup}>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) => `${styles.navItem} ${isCompact ? styles.navItemCompact : ''} ${isActive ? styles.navActive : ''}`}
                  title="Minhas Publicações"
                >
                  <IconBook />{!isCompact && <span>Minhas Publicações</span>}
                </NavLink>
                {!isCompact && publishGuideOpen && (
                  <NavLink
                    to="/como-publicar"
                    className={({ isActive }) => `${styles.navSubItem} ${isActive ? styles.navSubItemActive : ''}`}
                  >
                    <IconGuia />
                    Como Publicar
                  </NavLink>
                )}
              </div>
              <NavLink
                to="/favorites"
                className={({ isActive }) => `${styles.navItem} ${isCompact ? styles.navItemCompact : ''} ${isActive ? styles.navActive : ''}`}
                title="Favoritos"
              >
                <IconHeart />{!isCompact && <span>Favoritos</span>}
              </NavLink>
              <NavLink
                to="/profiles"
                className={({ isActive }) => `${styles.navItem} ${isCompact ? styles.navItemCompact : ''} ${isActive ? styles.navActive : ''}`}
                title="Perfis de Leitura"
              >
                <IconUser />{!isCompact && <span>Perfis de Leitura</span>}
              </NavLink>
            </nav>
          </>
        )}


        {/* Rodapé da sidebar */}
        <div className={styles.sidebarFooter}>
          {isAuthenticated ? (
            <>
              {/* Logout */}
              <button
                className={`${styles.logoutBtn} ${isCompact ? styles.navItemCompact : ''}`}
                onClick={handleLogout}
                title="Sair"
              >
                <IconLogout />{!isCompact && <span>Sair</span>}
              </button>
            </>
          ) : (
            !isCompact ? (
              <div className={styles.authBtns}>
                <Link to="/login" className={styles.btnEntrar}>Entrar</Link>
                <Link to="/register" className={styles.btnCadastrar}>Cadastrar</Link>
              </div>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) => `${styles.navItem} ${styles.navItemCompact} ${isActive ? styles.navActive : ''}`}
                title="Entrar"
              >
                <IconUser />
              </NavLink>
            )
          )}

          {/* Toggle de tema */}
          <button
            className={`${styles.themeBtn} ${isCompact ? styles.navItemCompact : ''}`}
            onClick={toggleTheme}
            aria-label={isDark ? 'Modo claro' : 'Modo escuro'}
            title={isDark ? 'Modo Claro' : 'Modo Escuro'}
          >
            {isDark ? <IconSun /> : <IconMoon />}
            {!isCompact && <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>}
          </button>

          {/* Botão Admin — visível apenas para admins */}
          {isAuthenticated && user?.is_admin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `${styles.navItem} ${isCompact ? styles.navItemCompact : ''} ${isActive ? styles.navActive : ''}`}
              title="Painel Admin"
            >
              <IconAdmin />{!isCompact && <span>Admin</span>}
            </NavLink>
          )}

          {/* Botão de recolher/expandir — sempre visível */}
          <button
            className={styles.collapseBtn}
            onClick={toggleCollapsed}
            title={isCompact ? 'Expandir menu' : 'Recolher menu'}
            aria-label={isCompact ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCompact ? <IconPanelOpen /> : <IconPanelClose />}
            {!isCompact && <span className={styles.collapseBtnLabel}>Recolher</span>}
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════
          DESKTOP: Content-area top bar (search + avatar)
          ═══════════════════════════════════════════════════ */}
      <div className={styles.contentTopBar}>
        <form className={styles.contentTopBarSearch} onSubmit={handleSearch}>
          <IconExplore />
          <input
            type="text"
            className={styles.contentTopBarInput}
            placeholder="Buscar histórias, autoras, universos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Buscar fanfics"
          />
        </form>
        <div className={styles.contentTopBarRight}>
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className={styles.newFanficBtn}
              title="Nova fanfic"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14" aria-hidden>
                <path d="M12 5v14M5 12h14" />
              </svg>
              Nova fanfic
            </Link>
          )}
          {isAuthenticated ? (
            <NavLink
              to="/profile"
              className={styles.contentTopBarAvatar}
              title={user?.username}
            >
              <div className={styles.avatar}>{initials}</div>
            </NavLink>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login" className={styles.btnEntrar} style={{ padding: '7px 14px' }}>Entrar</Link>
              <Link to="/login?tab=register" className={styles.btnCadastrar} style={{ padding: '7px 14px' }}>Cadastrar</Link>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          MOBILE: Topbar
          ═══════════════════════════════════════════════════ */}
      <header className={styles.topBar}>
        <Link to={isAuthenticated ? '/home' : '/'} className={styles.logo} title="ficverse">
          <span className={styles.logoItalic}>fic</span>
          <span className={styles.logoDot} />
          <span>verse</span>
        </Link>
        <div className={styles.topBarActions}>
          {/* Busca mobile */}
          <div ref={mobileSearchRef} className={styles.mobileSearchWrapper}>
            <button
              className={styles.topIconBtn}
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label="Buscar"
            >
              <IconExplore />
            </button>
            {mobileSearchOpen && (
              <form className={styles.mobileSearchForm} onSubmit={handleSearch}>
                <input
                  type="text"
                  className={styles.mobileSearchInput}
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </form>
            )}
          </div>

          {/* Theme toggle mobile */}
          <button
            className={styles.topIconBtn}
            onClick={toggleTheme}
            aria-label={isDark ? 'Modo claro' : 'Modo escuro'}
          >
            {isDark ? <IconSun /> : <IconMoon />}
          </button>

          {/* Auth mobile */}
          {!isAuthenticated && (
            <Link to="/login" className={styles.btnEntrar}>Entrar</Link>
          )}
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════
          MOBILE: Bottom navigation bar
          ═══════════════════════════════════════════════════ */}
      <nav className={styles.bottomNav} aria-label="Navegação principal">
        <NavLink
          to={isAuthenticated ? '/home' : '/'}
          className={({ isActive }) => `${styles.bottomNavItem} ${isActive ? styles.bottomNavActive : ''}`}
        >
          <IconHome />
          <span>Início</span>
        </NavLink>
        <NavLink
          to="/explore"
          className={({ isActive }) => `${styles.bottomNavItem} ${isActive ? styles.bottomNavActive : ''}`}
        >
          <IconExplore />
          <span>Explorar</span>
        </NavLink>
        <NavLink
          to="/tags"
          className={({ isActive }) => `${styles.bottomNavItem} ${isActive ? styles.bottomNavActive : ''}`}
        >
          <IconTag />
          <span>Tags</span>
        </NavLink>
        {isAuthenticated ? (
          <NavLink
            to="/profile"
            className={({ isActive }) => `${styles.bottomNavItem} ${isActive ? styles.bottomNavActive : ''}`}
          >
            <div className={styles.bottomAvatar}>{initials}</div>
            <span>Perfil</span>
          </NavLink>
        ) : (
          <NavLink
            to="/login"
            className={({ isActive }) => `${styles.bottomNavItem} ${isActive ? styles.bottomNavActive : ''}`}
          >
            <IconUser />
            <span>Entrar</span>
          </NavLink>
        )}
      </nav>
    </>
  );
}
