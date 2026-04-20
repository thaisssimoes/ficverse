import { useQuery } from '@tanstack/react-query';
import { fanficApi, chapterApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import styles from './ContinueReadingShelf.module.css';

// Campos da API:
//   fanfic_id, fanfic_title, fanfic_cover_url, fanfic_category,
//   fanfic_interactive_mode, last_chapter_read, total_chapters,
//   progress_percentage, last_read_at

function ReadingCard({ item }) {
  const coverUrl = item.fanfic_cover_url ? fanficApi.getAssetUrl(item.fanfic_cover_url) : null;
  const initial  = item.fanfic_title?.charAt(0)?.toUpperCase() ?? '?';
  const progress = Math.round(item.progress_percentage ?? 0);

  return (
    <a href={`/fanfic/${item.fanfic_id}`} className={styles.card} title={item.fanfic_title}>
      <div className={styles.cover}>
        {coverUrl
          ? <img src={coverUrl} alt={item.fanfic_title} className={styles.coverImg} loading="lazy" />
          : <div className={styles.coverPlaceholder}>{initial}</div>
        }
      </div>

      <div className={styles.info}>
        <span className={styles.title}>{item.fanfic_title}</span>
        <span className={styles.chapter}>
          {item.total_chapters > 0
            ? `Cap. ${item.last_chapter_read} / ${item.total_chapters}`
            : `Cap. ${item.last_chapter_read}`
          }
        </span>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
        <span className={styles.progressLabel}>{progress}%</span>
      </div>
    </a>
  );
}

/**
 * Prateleira de leitura em andamento.
 *
 * @param {boolean|undefined} interactive
 *   true  → mostra só histórias interativas ("Continue Lendo · Interativa")
 *   false → mostra só histórias normais     ("Continue Lendo · Normal")
 *   undefined (padrão) → mostra todas
 */
export default function ContinueReadingShelf() {
  const { isAuthenticated } = useAuth();

  // Ambas as instâncias compartilham o mesmo cache — a API é chamada uma só vez.
  const { data, isLoading } = useQuery({
    queryKey: ['reading-list'],
    queryFn: chapterApi.getReadingList,
    enabled: isAuthenticated,
  });

  const items = Array.isArray(data)
    ? data
        .filter((item) => Math.round(item.progress_percentage ?? 0) < 100)
        .filter((item, idx, arr) => arr.findIndex((x) => x.fanfic_id === item.fanfic_id) === idx)
    : [];

  if (!isAuthenticated || (!isLoading && items.length === 0)) return null;

  const title = 'Continue Lendo';

  return (
    <section className={styles.shelf}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>

      <div className={styles.track}>
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.skeleton}>
                <div className={styles.skeletonCover} />
                <div className={styles.skeletonInfo} />
              </div>
            ))
          : items.map((item) => (
              <ReadingCard key={item.fanfic_id} item={item} />
            ))
        }
      </div>
    </section>
  );
}
