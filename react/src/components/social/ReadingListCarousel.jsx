import { Link } from 'react-router-dom';
import { fanficApi } from '../../services/api';
import styles from './ReadingListCarousel.module.css';

/**
 * ReadingListCarousel — playlists de leitura do usuário.
 * Funciona como as Playlists do Spotify: mostra curadoria pessoal
 * e permite que outros descubram livros através do gosto do curador.
 *
 * Por enquanto exibe os favoritos do usuário como uma lista.
 * Quando a API de listas for implementada, basta passar `lists` ao invés de `favorites`.
 *
 * @param {Array}   favorites - Array de fanfics favoritas
 * @param {boolean} isLoading
 */
export default function ReadingListCarousel({ favorites = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className={styles.loading}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Nenhuma história nos favoritos ainda.</p>
        <Link to="/explore" className={styles.exploreLink}>Explorar histórias →</Link>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Favoritas</h3>
        <span className={styles.sectionCount}>{favorites.length} histórias</span>
      </div>
      <div className={styles.grid}>
        {favorites.map((fanfic) => {
          const coverUrl = fanfic.cover_url ? fanficApi.getAssetUrl(fanfic.cover_url) : null;
          const initial = fanfic.title?.charAt(0)?.toUpperCase() ?? '?';
          return (
            <Link key={fanfic.id} to={`/fanfic/${fanfic.id}`} className={styles.card}>
              <div className={styles.cover}>
                {coverUrl ? (
                  <img src={coverUrl} alt={fanfic.title} className={styles.coverImg} loading="lazy" />
                ) : (
                  <div className={styles.coverPlaceholder}>{initial}</div>
                )}
              </div>
              <p className={styles.cardTitle}>{fanfic.title}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
