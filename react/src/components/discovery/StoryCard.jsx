import { Link } from 'react-router-dom';
import { fanficApi } from '../../services/api';
import styles from './StoryCard.module.css';

/**
 * Componente camaleônico de card de história.
 *
 * @param {object}  fanfic         - Dados da história
 * @param {'grid'|'list'} variant  - 'grid' = foco na capa (Wattpad), 'list' = detalhes (Substack)
 */
const MAX_VISIBLE_TAGS = 3;

// Remove tags HTML da sinopse (salva pelo QuillEditor) para exibição plain-text
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function StoryCard({ fanfic, variant = 'grid', onPreview }) {
  const coverUrl = fanfic.cover_url ? fanficApi.getAssetUrl(fanfic.cover_url) : null;
  const initial = fanfic.title?.charAt(0)?.toUpperCase() ?? '?';

  if (variant === 'list') {
    const allTags = fanfic.tags || [];
    const visibleTags = allTags.slice(0, MAX_VISIBLE_TAGS);
    const hiddenCount = allTags.length - visibleTags.length;

    return (
      <Link to={`/fanfic/${fanfic.id}`} className={`${styles.card} ${styles.list}`}>
        {/* Thumbnail */}
        <div className={styles.listThumb}>
          {coverUrl ? (
            <img src={coverUrl} alt={fanfic.title} className={styles.listThumbImg} loading="lazy" />
          ) : (
            <div className={styles.listThumbPlaceholder}>{initial}</div>
          )}
        </div>

        {/* Conteúdo */}
        <div className={styles.listContent}>
          <div className={styles.listMeta}>
            {fanfic.category && (
              <span className={styles.categoryLabel}>{fanfic.category}</span>
            )}
          </div>

          <h3 className={styles.listTitle}>{fanfic.title}</h3>

          {fanfic.description && (
            <p className={styles.listSummary}>{fanfic.description}</p>
          )}

          <div className={styles.listFooter}>
            {fanfic.author_username && (
              <span className={styles.readTime}>por {fanfic.author_username}</span>
            )}
            {visibleTags.length > 0 && (
              <div className={styles.tags}>
                {visibleTags.map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
                {hiddenCount > 0 && (
                  <span className={styles.tagOverflow}>+{hiddenCount}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }

  /* variante 'grid' (padrão) — foco na capa, info mínima */
  const gridContent = (
    <>
      {/* Capa com proporção 512:800 (padrão de livro) */}
      <div className={styles.coverWrapper}>
        {coverUrl ? (
          <img src={coverUrl} alt={fanfic.title} className={styles.coverImg} loading="lazy" />
        ) : (
          <div className={styles.coverPlaceholder}>{initial}</div>
        )}
        {fanfic.interactive_mode && (
          <span className={styles.interactiveBadge}>Interativa</span>
        )}
        <span className={`${styles.statusBadge} ${fanfic.is_complete ? styles.statusComplete : fanfic.is_hiatus ? styles.statusHiatus : styles.statusOngoing}`}>
          {fanfic.is_complete ? 'Completa' : fanfic.is_hiatus ? 'Hiatus' : 'Em andamento'}
        </span>
      </div>

      {/* Info — título, sinopse (2 linhas), autor, tags */}
      <div className={styles.gridInfo}>
        <span className={styles.gridTitle}>{fanfic.title}</span>
        {fanfic.synopsis && (
          <p className={styles.gridSynopsis}>{stripHtml(fanfic.synopsis)}</p>
        )}
        {fanfic.author_username && (
          <span className={styles.gridAuthor}>{fanfic.author_username}</span>
        )}
        {fanfic.tags?.length > 0 && (
          <div className={styles.gridTags}>
            {fanfic.tags.slice(0, 2).map((tag) => (
              <span key={typeof tag === 'string' ? tag : tag.id} className={styles.gridTag}>
                {typeof tag === 'string' ? tag : tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );

  if (onPreview) {
    return (
      <button type="button" onClick={onPreview} className={`${styles.card} ${styles.grid} ${styles.gridBtn}`}>
        {gridContent}
      </button>
    );
  }

  return (
    <Link to={`/fanfic/${fanfic.id}`} className={`${styles.card} ${styles.grid}`}>
      {gridContent}
    </Link>
  );
}
