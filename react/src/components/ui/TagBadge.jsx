import { useNavigate } from 'react-router-dom';
import styles from './TagBadge.module.css';

export default function TagBadge({ tag, clickable = false }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!clickable) return;
    const params = new URLSearchParams({ tagId: tag.id, tagName: tag.name, tagType: tag.type });
    navigate(`/tags?${params.toString()}`);
  };

  const handleKeyDown = (e) => {
    if (!clickable) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <span
      className={`${styles.badge} ${styles[tag.type]} ${clickable ? styles.clickable : ''}`}
      onClick={clickable ? handleClick : undefined}
      onKeyDown={clickable ? handleKeyDown : undefined}
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? 'button' : undefined}
      title={clickable ? `Buscar por ${tag.name}` : undefined}
    >
      {tag.name}
    </span>
  );
}
