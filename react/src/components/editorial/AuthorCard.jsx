import { Link } from 'react-router-dom';
import styles from './AuthorCard.module.css';

const IconArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

/**
 * AuthorCard — mini-card do autor exibido abaixo da lista de capítulos.
 * Link direto para o perfil público /user/:username.
 *
 * @param {string} username
 * @param {string} [avatarUrl]
 * @param {string} [bio]
 */
export default function AuthorCard({ username, avatarUrl, bio }) {
  if (!username) return null;

  const initials = username.charAt(0).toUpperCase();

  return (
    <section className={styles.card}>
      <p className={styles.label}>Sobre o autor</p>

      <div className={styles.body}>
        <div className={styles.avatar}>
          {avatarUrl
            ? <img src={avatarUrl} alt={username} className={styles.avatarImg} />
            : <span className={styles.avatarInitial}>{initials}</span>
          }
        </div>

        <div className={styles.info}>
          <Link to={`/user/${username}`} className={styles.name}>
            {username}
          </Link>
          <p className={styles.handle}>@{username}</p>
          {bio && <p className={styles.bio}>{bio}</p>}
        </div>

        <Link to={`/user/${username}`} className={styles.profileLink} aria-label={`Ver perfil de ${username}`}>
          <IconArrowRight />
        </Link>
      </div>
    </section>
  );
}
