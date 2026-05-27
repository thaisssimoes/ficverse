import { fanficApi } from '../../services/api';
import styles from './ShelfCard.module.css';

/**
 * Cartão compacto para prateleiras horizontais.
 * Clica → abre o modal de prévia (via onPreview).
 */
// Prioridade: trope → fandom → subgenre → pairing → qualquer
function pickTag(tags) {
  if (!tags?.length) return null;
  const priority = ['trope', 'fandom', 'subgenre', 'pairing'];
  for (const type of priority) {
    const found = tags.find((t) => t.type === type);
    if (found) return found;
  }
  return tags[0];
}

export default function ShelfCard({ fanfic, onPreview }) {
  const coverUrl = fanfic.cover_url ? fanficApi.getAssetUrl(fanfic.cover_url) : null;
  const initial  = fanfic.title?.charAt(0)?.toUpperCase() ?? '?';

  const statusLabel = fanfic.is_complete ? 'Completa' : fanfic.is_hiatus ? 'Hiatus' : 'Em andamento';
  const statusClass = fanfic.is_complete ? styles.statusComplete
                    : fanfic.is_hiatus   ? styles.statusHiatus
                    :                      styles.statusOngoing;
  const tag = pickTag(fanfic.tags);

  return (
    <button type="button" className={styles.card} onClick={onPreview} title={fanfic.title}>
      {/* Capa */}
      <div className={styles.cover}>
        {coverUrl
          ? <img src={coverUrl} alt={fanfic.title} className={styles.coverImg} loading="lazy" />
          : <div className={styles.coverPlaceholder}>{initial}</div>
        }
        {fanfic.interactive_mode && (
          <span className={styles.interactiveBadge}>Interativa</span>
        )}
        {fanfic.is_adult_content && (
          <span className={styles.adultBadge}>+18</span>
        )}
      </div>

      {/* Info: título+autor flutuam no topo; tag+status ancorados no fundo */}
      <div className={styles.info}>
        <div className={styles.infoTop}>
          <span className={styles.title}>{fanfic.title}</span>
          {fanfic.author_username && (
            <span className={styles.author}>{fanfic.author_username}</span>
          )}
        </div>
        <div className={styles.infoBottom}>
          {tag && <span className={styles.tagPill}>{tag.name}</span>}
          <span className={`${styles.status} ${statusClass}`}>{statusLabel}</span>
        </div>
      </div>
    </button>
  );
}
