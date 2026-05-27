import styles from './FilterPills.module.css';

export default function FilterPills({ filters = [], active, onChange }) {
  return (
    <div className={styles.bar} role="tablist" aria-label="Filtrar por categoria">
      {filters.map((f) => (
        <button
          key={f.key}
          role="tab"
          aria-selected={active === f.key}
          className={`${styles.pill} ${active === f.key ? styles.pillActive : ''}`}
          onClick={() => onChange(f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
