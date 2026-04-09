import { Link } from 'react-router-dom';
import { fanficApi } from '../../services/api';
import styles from './SocialFeed.module.css';
import { formatTimestamp } from '../../utils/formatters';

/**
 * SocialFeed — feed de atividade da rede social.
 * Mostra atualizações em tempo real das conexões:
 * "X adicionou Y à lista Z", "X publicou nova história", etc.
 *
 * Por enquanto exibe as histórias em tendência como "atividade recente".
 * Quando a API de feed social for implementada, basta passar `events` com
 * os dados de atividade reais.
 *
 * @param {Array}   stories   - Histórias em tendência (fallback)
 * @param {boolean} isLoading
 */
export default function SocialFeed({ stories = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className={styles.feed}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Sem atividade recente.</p>
        <Link to="/explore" className={styles.exploreLink}>Explorar histórias →</Link>
      </div>
    );
  }

  return (
    <div className={styles.feed}>
      {stories.map((story) => {
        const coverUrl = story.cover_url ? fanficApi.getAssetUrl(story.cover_url) : null;
        const initial = story.title?.charAt(0)?.toUpperCase() ?? '?';

        return (
          <Link key={story.id} to={`/fanfic/${story.id}`} className={styles.item}>
            {/* Thumbnail */}
            <div className={styles.thumb}>
              {coverUrl ? (
                <img src={coverUrl} alt={story.title} className={styles.thumbImg} loading="lazy" />
              ) : (
                <div className={styles.thumbPlaceholder}>{initial}</div>
              )}
            </div>

            {/* Info */}
            <div className={styles.info}>
              <div className={styles.eventLine}>
                <span className={styles.author}>{story.author_username}</span>
                <span className={styles.eventDesc}>publicou uma história</span>
              </div>
              <p className={styles.title}>{story.title}</p>
              {story.category && (
                <span className={styles.category}>{story.category}</span>
              )}
            </div>

            {/* Chevron */}
            <svg className={styles.chevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        );
      })}
    </div>
  );
}
