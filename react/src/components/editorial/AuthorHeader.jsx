import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { fanficApi } from '../../services/api';
import TagBadge from '../ui/TagBadge';
import styles from './AuthorHeader.module.css';

const IconHeart = ({ filled = false }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export default function AuthorHeader({
  fanfic,
  tagsByType = { fandom: [], warning: [], pairing: [] },
  favorited = false,
  favoritesCount = 0,
  onFavorite,
  isAuthor = false,
  authorActions,
  isAuthenticated = false,
  loginFavorite,
  showSynopsis = true,
}) {
  const coverUrl = fanfic.cover_url ? fanficApi.getAssetUrl(fanfic.cover_url) : null;
  const initial = fanfic.title?.charAt(0)?.toUpperCase() ?? '?';
  const authorUsername = fanfic.author?.username;
  const authorAvatarUrl = fanfic.author?.avatar_url;
  const authorInitial = authorUsername?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <>
      {/* Barra do autor */}
      {isAuthor && (
        <div className={styles.authorBar}>
          <span className={styles.authorBarLabel}>Você é o autor desta história</span>
          {authorActions}
        </div>
      )}

      <div className={styles.header}>
        {/* Coluna esquerda: capa + strip do autor */}
        <div className={styles.coverCol}>
          <div className={styles.coverWrapper}>
            {coverUrl ? (
              <img src={coverUrl} alt={`Capa de ${fanfic.title}`} className={styles.coverImg} />
            ) : (
              <div className={styles.coverPlaceholder}>{initial}</div>
            )}
          </div>

          {/* Strip do autor — abaixo da capa */}
          {authorUsername && (
            <div className={styles.authorStrip}>
              <Link to={`/user/${authorUsername}`} className={styles.authorAvatarLink} aria-label={`Perfil de ${authorUsername}`}>
                {authorAvatarUrl
                  ? <img src={authorAvatarUrl} alt={authorUsername} className={styles.authorAvatarImg} />
                  : <span className={styles.authorAvatarInitial}>{authorInitial}</span>
                }
              </Link>
              <div className={styles.authorStripInfo}>
                <Link to={`/user/${authorUsername}`} className={styles.authorStripName}>
                  {authorUsername}
                </Link>
                <span className={styles.authorStripHandle}>@{authorUsername}</span>
              </div>
              {isAuthenticated ? (
                <button
                  className={`${styles.favoriteBtn} ${favorited ? styles.favorited : ''}`}
                  onClick={onFavorite}
                  aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  <IconHeart filled={favorited} />
                  <span>{favoritesCount}</span>
                </button>
              ) : (
                loginFavorite
              )}
            </div>
          )}
        </div>

        {/* Coluna direita: categoria, título, tags, sinopse, ações */}
        <div className={styles.info}>
          {fanfic.category && (
            <span className={styles.category}>{fanfic.category}</span>
          )}

          <h1 className={styles.title}>{fanfic.title}</h1>

          {/* Tags */}
          {(tagsByType.fandom.length > 0 || tagsByType.warning.length > 0 || tagsByType.pairing.length > 0) && (
            <div className={styles.tagGroups}>
              {tagsByType.fandom.length > 0 && (
                <div className={styles.tagGroup}>
                  <span className={styles.tagGroupLabel}>Fandom:</span>
                  <div className={styles.tagList}>
                    {tagsByType.fandom.map((t) => <TagBadge key={t.id} tag={t} clickable />)}
                  </div>
                </div>
              )}
              {tagsByType.warning.length > 0 && (
                <div className={styles.tagGroup}>
                  <span className={styles.tagGroupLabel}>Avisos:</span>
                  <div className={styles.tagList}>
                    {tagsByType.warning.map((t) => <TagBadge key={t.id} tag={t} clickable />)}
                  </div>
                </div>
              )}
              {tagsByType.pairing.length > 0 && (
                <div className={styles.tagGroup}>
                  <span className={styles.tagGroupLabel}>Casais:</span>
                  <div className={styles.tagList}>
                    {tagsByType.pairing.map((t) => <TagBadge key={t.id} tag={t} clickable />)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sinopse */}
          {showSynopsis && fanfic.synopsis && (
            <div
              className={styles.synopsis}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(fanfic.synopsis) }}
            />
          )}

        </div>
      </div>
    </>
  );
}
