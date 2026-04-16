import { Link } from 'react-router-dom';
import { fanficApi } from '../../services/api';
import styles from './FanficCard.module.css';

export default function FanficCard({ fanfic }) {
  const coverUrl = fanficApi.getAssetUrl(fanfic.cover_url);

  return (
    <Link to={`/fanfic/${fanfic.id}`} className={styles.card}>
      <div className={styles.cover}>
        {coverUrl ? (
          <img src={coverUrl} alt={fanfic.title} className={styles.coverImg} loading="lazy" />
        ) : (
          <div className={styles.coverPlaceholder}>
            <span>{fanfic.title?.charAt(0)?.toUpperCase()}</span>
          </div>
        )}
        {fanfic.interactive_mode && (
          <span className={styles.interactiveBadge}>Interativa</span>
        )}
        <span className={`${styles.statusBadge} ${fanfic.is_complete ? styles.statusComplete : fanfic.is_hiatus ? styles.statusHiatus : styles.statusOngoing}`}>
          {fanfic.is_complete ? 'Completa' : fanfic.is_hiatus ? 'Hiatus' : 'Em andamento'}
        </span>
      </div>
      <div className={styles.info}>
        {fanfic.category && <span className={styles.category}>{fanfic.category}</span>}
        <h3 className={styles.title}>{fanfic.title}</h3>
        {fanfic.author_username && (
          <p className={styles.author}>por {fanfic.author_username}</p>
        )}
      </div>
    </Link>
  );
}
