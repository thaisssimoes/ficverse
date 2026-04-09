import DOMPurify from 'dompurify';
import { fanficApi } from '../../services/api';
import TagBadge from '../ui/TagBadge';
import styles from './AuthorHeader.module.css';

/**
 * Cabeçalho editorial da história (capa + info + ações).
 * Estilo Substack: layout assimétrico com capa à esquerda.
 *
 * @param {object}    fanfic          - Dados da história
 * @param {Array}     tagsByType      - { fandom, warning, pairing }
 * @param {boolean}   favorited       - Estado de favorito
 * @param {number}    favoritesCount  - Contagem de favoritos
 * @param {function}  onFavorite      - Handler de favoritar
 * @param {boolean}   isAuthor        - Exibe barra de edição se true
 * @param {ReactNode} authorActions   - Botões para o autor (ex: link editar)
 * @param {boolean}   isAuthenticated
 * @param {ReactNode} loginFavorite   - Fallback de login para favoritar
 */
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
  compact = false,
}) {
  const coverUrl = fanfic.cover_url ? fanficApi.getAssetUrl(fanfic.cover_url) : null;
  const initial = fanfic.title?.charAt(0)?.toUpperCase() ?? '?';

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
        {/* Capa */}
        <div className={styles.coverWrapper}>
          {coverUrl ? (
            <img src={coverUrl} alt={`Capa de ${fanfic.title}`} className={styles.coverImg} />
          ) : (
            <div className={styles.coverPlaceholder}>{initial}</div>
          )}
        </div>

        {/* Informações */}
        <div className={styles.info}>
          {fanfic.category && (
            <span className={styles.category}>{fanfic.category}</span>
          )}

          <h1 className={styles.title}>{fanfic.title}</h1>

          {fanfic.author_username && (
            <span className={styles.author}>por {fanfic.author_username}</span>
          )}

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

          {/* Sinopse — oculta em modo compacto */}
          {!compact && fanfic.synopsis && (
            <div
              className={styles.synopsis}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(fanfic.synopsis) }}
            />
          )}

          {/* Ações */}
          <div className={styles.actions}>
            {isAuthenticated ? (
              <button
                className={`${styles.favoriteBtn} ${favorited ? styles.favorited : ''}`}
                onClick={onFavorite}
              >
                <IconHeart filled={favorited} />
                <span>{favoritesCount}</span>
              </button>
            ) : (
              loginFavorite
            )}
          </div>
        </div>
      </div>
    </>
  );
}
