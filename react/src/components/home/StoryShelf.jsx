import { useState } from 'react';
import ShelfCard from './ShelfCard';
import FanficPreviewModal from '../fanfic/FanficPreviewModal';
import styles from './StoryShelf.module.css';

/**
 * Prateleira horizontal de histórias estilo Netflix.
 *
 * @param {string} title     - Título da seção
 * @param {Array}  stories   - Array de fanfics
 * @param {string} viewAllTo - Rota para "ver tudo" (opcional)
 */
export default function StoryShelf({ title, stories = [], viewAllTo }) {
  const [previewId, setPreviewId] = useState(null);

  if (!stories.length) return null;

  return (
    <>
      <section className={styles.shelf}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          {viewAllTo && (
            <a href={viewAllTo} className={styles.viewAll}>Ver tudo →</a>
          )}
        </div>

        <div className={styles.track}>
          {stories.map((fanfic) => (
            <ShelfCard
              key={fanfic.id}
              fanfic={fanfic}
              onPreview={() => setPreviewId(fanfic.id)}
            />
          ))}
        </div>
      </section>

      {previewId && (
        <FanficPreviewModal
          fanficId={previewId}
          onClose={() => setPreviewId(null)}
        />
      )}
    </>
  );
}
