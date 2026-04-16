import { Link } from 'react-router-dom';
import styles from './StoryHeader.module.css';

const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);


const IconHeart = ({ filled = false, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const IconPencil = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconBubble = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

/**
 * Cabeçalho de capítulo — centralizado.
 *
 * @param {string}    title           - Título do capítulo
 * @param {number}    chapterOrder    - Número do capítulo
 * @param {string}    [fanficTitle]   - Título da história
 * @param {number}    [fanficId]      - ID da história
 * @param {string}    [author]        - Username do autor
 * @param {string}    [authorAvatar]  - URL do avatar do autor
 * @param {number}    [viewsCount]    - Total de visualizações
 * @param {number}    [likesCount]    - Total de curtidas
 * @param {boolean}   [likedByMe]     - Se o usuário atual curtiu
 * @param {function}  [onLike]        - Callback para curtir/descurtir
 * @param {boolean}   [isAuthenticated]
 * @param {string}    [editHref]        - URL para editar o capítulo (só mostrado ao autor)
 */
export default function StoryHeader({
  title,
  chapterOrder,
  fanficTitle,
  fanficId,
  author,
  authorAvatar,
  viewsCount = 0,
  commentsCount = 0,
  likesCount = 0,
  likedByMe = false,
  onLike,
  isAuthenticated = false,
  editHref,
}) {
  const initial = author?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <header className={styles.header}>
      {/* Link de volta para a história */}
      {fanficId && fanficTitle && (
        <Link to={`/fanfic/${fanficId}`} className={styles.backLink}>
          <IconArrowLeft /> Voltar para {fanficTitle}
        </Link>
      )}

      {/* Título da história — H1 proeminente */}
      {fanficTitle && (
        fanficId
          ? <Link to={`/fanfic/${fanficId}`} className={styles.storyTitle}>{fanficTitle}</Link>
          : <h1 className={styles.storyTitle}>{fanficTitle}</h1>
      )}

      {/* Autor + métricas (views · like) */}
      {author && (
        <div className={styles.authorLine}>
          <Link to={`/user/${author}`} className={styles.authorAvatar} aria-label={`Perfil de ${author}`}>
            {authorAvatar
              ? <img src={authorAvatar} alt={author} className={styles.authorAvatarImg} />
              : <span className={styles.authorAvatarInitial}>{initial}</span>
            }
          </Link>
          <span>por <Link to={`/user/${author}`} className={styles.authorLink}>{author}</Link></span>

          <span className={styles.metaDivider}>·</span>

          <span className={styles.metaStat}>
            <IconEye />
            {viewsCount}
          </span>

          <span className={styles.metaStat}>
            <IconBubble />
            {commentsCount}
          </span>

          <span className={styles.metaStat}>
            <IconHeart filled={likedByMe} />
            {likesCount}
          </span>
        </div>
      )}

      {/* Separador */}
      <div className={styles.divider} />

      {/* Número e título do capítulo */}
      {chapterOrder && (
        <span className={styles.chapterLabel}>Capítulo {chapterOrder}</span>
      )}
      <div className={styles.chapterTitleRow}>
        <h2 className={styles.chapterTitle}>{title}</h2>
        {editHref && (
          <Link to={editHref} className={styles.editBtn} title="Editar capítulo" aria-label="Editar capítulo">
            <IconPencil />
          </Link>
        )}
        {isAuthenticated && onLike && (
          <button
            className={`${styles.chapterHeartBtn} ${likedByMe ? styles.chapterHeartBtnActive : ''}`}
            onClick={onLike}
            aria-label={likedByMe ? 'Descurtir capítulo' : 'Curtir capítulo'}
          >
            <IconHeart filled={likedByMe} size={18} />
          </button>
        )}
      </div>
    </header>
  );
}
