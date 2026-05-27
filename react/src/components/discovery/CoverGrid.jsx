import { useState } from 'react';
import StoryCard from './StoryCard';
import FanficPreviewModal from '../fanfic/FanficPreviewModal';
import styles from './CoverGrid.module.css';

/**
 * Grade de descoberta de histórias com layout fluido auto-fill.
 *
 * @param {Array}   stories   - Array de objetos de fanfic
 * @param {boolean} compact   - Grade mais estreita (para sidebars / seções menores)
 * @param {string}  emptyText - Texto exibido quando não há histórias
 */
export default function CoverGrid({
  stories = [],
  compact = false,
  emptyText = 'Nenhuma história encontrada.',
}) {
  const [previewId, setPreviewId] = useState(null);
  const gridClass = `${styles.grid} ${compact ? styles.compact : ''}`;

  return (
    <>
      <div className={gridClass}>
        {stories.length === 0 ? (
          <p className={styles.empty}>{emptyText}</p>
        ) : (
          stories.map((fanfic) => (
            <StoryCard
              key={fanfic.id}
              fanfic={fanfic}
              variant="grid"
              onPreview={() => setPreviewId(fanfic.id)}
            />
          ))
        )}
      </div>

      {previewId && (
        <FanficPreviewModal
          fanficId={previewId}
          onClose={() => setPreviewId(null)}
        />
      )}
    </>
  );
}
