import { useState, useCallback } from 'react';
import styles from './ReadingToolbar.module.css';

const IconSun = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const IconMoon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

/**
 * Barra flutuante de controles de leitura.
 * Fica fixa na lateral direita do artigo, sempre visível durante o scroll.
 *
 * @param {number}   fontSize       - Tamanho atual da fonte em px
 * @param {number}   fontMin        - Tamanho mínimo permitido
 * @param {number}   fontMax        - Tamanho máximo permitido
 * @param {function} onFontChange   - Callback(delta: number)
 */
export default function ReadingToolbar({ fontSize, fontMin, fontMax, onFontChange }) {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  );

  const toggleTheme = useCallback(() => {
    const next = isDark ? '' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next || 'light');
    setIsDark(!isDark);
  }, [isDark]);

  return (
    <aside className={styles.toolbar} aria-label="Controles de leitura">
      {/* Toggle de tema */}
      <button
        className={styles.btn}
        onClick={toggleTheme}
        aria-label={isDark ? 'Modo claro' : 'Modo escuro'}
        title={isDark ? 'Modo Claro' : 'Modo Escuro'}
      >
        {isDark ? <IconSun /> : <IconMoon />}
      </button>

      <div className={styles.divider} />

      {/* Diminuir fonte */}
      <button
        className={styles.btn}
        onClick={() => onFontChange(-1)}
        disabled={fontSize <= fontMin}
        aria-label="Diminuir fonte"
        title="Diminuir fonte"
      >
        <span className={styles.fontLabel} style={{ fontSize: '14px' }}>A</span>
      </button>

      {/* Indicador de tamanho */}
      <span className={styles.fontValue}>{fontSize}</span>

      {/* Aumentar fonte */}
      <button
        className={styles.btn}
        onClick={() => onFontChange(1)}
        disabled={fontSize >= fontMax}
        aria-label="Aumentar fonte"
        title="Aumentar fonte"
      >
        <span className={styles.fontLabel} style={{ fontSize: '20px' }}>A</span>
      </button>
    </aside>
  );
}
