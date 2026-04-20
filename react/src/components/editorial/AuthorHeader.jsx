import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { fanficApi } from '../../services/api';
import TagBadge from '../ui/TagBadge';
import styles from './AuthorHeader.module.css';

const IconBookmark = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

export default function AuthorHeader({
  fanfic,
  tagsByType = { fandom: [], warning: [], pairing: [], subgenre: [], trope: [] },
  isAuthor = false,
  authorActions,
  isAuthenticated = false,
  showSynopsis = true,
  following = false,
  followersCount = 0,
  onFollow,
  favorited = false,
  onFavorite,
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
            </div>
          )}

          {/* Stats: views e likes totais */}
          {(fanfic.total_views > 0 || fanfic.total_likes > 0) && (
            <div className={styles.statsRow}>
              {fanfic.total_views > 0 && (
                <span className={styles.statItem}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  {fanfic.total_views.toLocaleString('pt-BR')}
                </span>
              )}
              {fanfic.total_likes > 0 && (
                <span className={styles.statItem}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  {fanfic.total_likes.toLocaleString('pt-BR')}
                </span>
              )}
              {followersCount > 0 && (
                <span className={styles.statItem}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  {followersCount.toLocaleString('pt-BR')} seguidores
                </span>
              )}
            </div>
          )}
        </div>

        {/* Coluna direita: categoria, título, tags, sinopse, ações */}
        <div className={styles.info}>
          {fanfic.category && (
            <div className={styles.categoryBlock}>
              <span className={styles.category}>{fanfic.category}</span>
              {tagsByType.subgenre?.length > 0 && (
                <span className={styles.subgenres}>
                  {tagsByType.subgenre.map((t) => t.name).join(', ')}
                </span>
              )}
            </div>
          )}

          <div className={styles.titleRow}>
            <div className={styles.titleWithBookmark}>
              <h1 className={styles.title}>{fanfic.title}</h1>
              {onFavorite && !isAuthor && (
                <button
                  className={`${styles.bookmarkBtn} ${favorited ? styles.bookmarkBtnActive : ''}`}
                  onClick={onFavorite}
                  aria-label={favorited ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
                  title={favorited ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
                >
                  <IconBookmark filled={favorited} />
                </button>
              )}
            </div>
            {(() => {
              const label = fanfic.is_complete ? 'Completa' : fanfic.is_hiatus ? 'Hiatus' : 'Em andamento';
              const cls   = fanfic.is_complete ? styles.statusComplete
                          : fanfic.is_hiatus   ? styles.statusHiatus
                          :                      styles.statusOngoing;
              return <span className={`${styles.statusBadge} ${cls}`}>{label}</span>;
            })()}
          </div>

          {/* Sinopse */}
          {showSynopsis && fanfic.synopsis && (
            <div
              className={styles.synopsis}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(fanfic.synopsis) }}
            />
          )}

          {/* Tags: status + fandom, pairing, subgênero — abaixo da sinopse */}
          {(() => {
            const statusKey   = fanfic.is_complete ? 'complete' : fanfic.is_hiatus ? 'hiatus' : 'ongoing';
            const statusLabel = fanfic.is_complete ? 'Completa' : fanfic.is_hiatus ? 'Hiatus' : 'Em andamento';
            const allTags     = [...tagsByType.fandom, ...tagsByType.pairing, ...tagsByType.subgenre, ...tagsByType.trope];
            return (
              <div className={styles.tagGroups}>
                <div className={styles.tagGroup}>
                  <span className={styles.tagGroupLabel}>Tags:</span>
                  <div className={styles.tagList}>
                    <Link
                      to={`/explore?status=${statusKey}`}
                      className={`${styles.statusTag} ${styles[`statusTag_${statusKey}`]}`}
                      title={`Ver histórias: ${statusLabel}`}
                    >
                      {statusLabel}
                    </Link>
                    {fanfic.is_adult_content && (
                      <TagBadge tag={{ id: 'adult', name: '+18', type: 'adult' }} />
                    )}
                    {allTags.map((t) => <TagBadge key={t.id} tag={t} clickable />)}
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      </div>
    </>
  );
}
