import Button from '../ui/Button';
import styles from './FeedList.module.css';

const IconFileText = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconHeart = ({ filled = false }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const IconEye = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/**
 * Lista editorial de capítulos (Substack).
 *
 * @param {Array}    chapters        - Lista de capítulos ordenada
 * @param {function} onReadChapter   - Callback com chapterId
 * @param {function} [onLikeChapter] - Callback com chapterId (toggle like)
 * @param {boolean}  [isAuthenticated]
 */
export default function FeedList({ chapters = [], onReadChapter, onLikeChapter, isAuthenticated = false }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Capítulos</h2>

      {chapters.length === 0 ? (
        <p className={styles.empty}>Nenhum capítulo disponível ainda.</p>
      ) : (
        chapters.map((ch, i) => (
          <div key={ch.id} className={styles.item}>
            <span className={styles.chapterNum}>Cap. {i + 1}</span>

            <div className={styles.chapterInfo}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
                <span className={styles.chapterTitle}>{ch.title}</span>
                {ch.is_draft && (
                  <span className={styles.badgeDraft}><IconFileText /> Rascunho</span>
                )}
              </div>
              {onLikeChapter && isAuthenticated ? (
                <button
                  className={`${styles.likeBtn} ${ch.liked_by_me ? styles.likeBtnLiked : ''}`}
                  onClick={() => onLikeChapter(ch.id)}
                  aria-label={ch.liked_by_me ? 'Descurtir capítulo' : 'Curtir capítulo'}
                >
                  <IconHeart filled={ch.liked_by_me} />
                  {ch.likes_count ?? 0}
                </button>
              ) : (
                <span className={styles.likeBtn}>
                  <IconHeart />
                  {ch.likes_count ?? 0}
                </span>
              )}
            </div>

            {/* Visualizações */}
            <div className={styles.stats}>
              <span className={styles.statItem}>
                <IconEye />
                {ch.views_count ?? 0}
              </span>
            </div>

            <Button size="sm" onClick={() => onReadChapter(ch.id)}>Ler</Button>
          </div>
        ))
      )}
    </section>
  );
}
