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

/**
 * Lista editorial de capítulos (Substack).
 *
 * @param {Array}    chapters      - Lista de capítulos ordenada
 * @param {function} onReadChapter - Callback com chapterId
 */
export default function FeedList({ chapters = [], onReadChapter }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Capítulos</h2>

      {chapters.length === 0 ? (
        <p className={styles.empty}>Nenhum capítulo disponível ainda.</p>
      ) : (
        chapters.map((ch) => (
          <div key={ch.id} className={styles.item}>
            <span className={styles.chapterNum}>Cap. {ch.order}</span>
            <div className={styles.chapterInfo}>
              <span className={styles.chapterTitle}>{ch.title}</span>
              {ch.is_draft && (
                <span className={styles.badgeDraft}><IconFileText /> Rascunho</span>
              )}
            </div>
            <Button size="sm" onClick={() => onReadChapter(ch.id)}>Ler</Button>
          </div>
        ))
      )}
    </section>
  );
}
