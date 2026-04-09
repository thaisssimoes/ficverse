import { Link } from 'react-router-dom';
import styles from './StoryHeader.module.css';

const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconZap = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconBook = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

/**
 * Cabeçalho de capítulo.
 * Hierarquia: fanficTitle (H1 display) → author (subtitle) → chapter (secondary) → chapterTitle
 *
 * @param {string}    title         - Título do capítulo
 * @param {number}    chapterOrder  - Número do capítulo
 * @param {string}    [fanficTitle] - Título da história
 * @param {number}    [fanficId]    - ID da história
 * @param {string}    [author]      - Username do autor
 * @param {'interactive'|'non-interactive'} mode
 * @param {ReactNode} [actions]
 */
export default function StoryHeader({
  title,
  chapterOrder,
  fanficTitle,
  fanficId,
  author,
  mode = 'non-interactive',
  actions,
}) {
  return (
    <header className={styles.header}>
      {/* Título da história — H1 proeminente */}
      {fanficTitle && (
        fanficId
          ? <Link to={`/fanfic/${fanficId}`} className={styles.storyTitle}>{fanficTitle}</Link>
          : <h1 className={styles.storyTitle}>{fanficTitle}</h1>
      )}

      {/* Autor — subtítulo */}
      {author && (
        <p className={styles.authorLine}>
          por <Link to={`/user/${author}`} className={styles.authorLink}>{author}</Link>
        </p>
      )}

      {/* Separador */}
      <div className={styles.divider} />

      {/* Número e título do capítulo */}
      {chapterOrder && (
        <span className={styles.chapterLabel}>Capítulo {chapterOrder}</span>
      )}
      <h2 className={styles.chapterTitle}>{title}</h2>

      <div className={styles.actions}>
        {mode === 'interactive' ? (
          <span className={styles.badgeInteractive}><IconZap /> Modo Interativo</span>
        ) : (
          <span className={styles.badgeNormal}><IconBook /> Modo Normal</span>
        )}
        {actions}
      </div>
    </header>
  );
}
