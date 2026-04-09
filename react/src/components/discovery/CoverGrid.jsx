import StoryCard from './StoryCard';
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
  const gridClass = `${styles.grid} ${compact ? styles.compact : ''}`;

  return (
    <div className={gridClass}>
      {stories.length === 0 ? (
        <p className={styles.empty}>{emptyText}</p>
      ) : (
        stories.map((fanfic) => (
          <StoryCard key={fanfic.id} fanfic={fanfic} variant="grid" />
        ))
      )}
    </div>
  );
}
