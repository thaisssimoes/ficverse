import styles from './Tabs.module.css';

/**
 * Tabs — navegação horizontal em abas.
 * Reutilizável em Perfil, TagSearch, Dashboard, etc.
 *
 * @param {Array}  tabs        - [{ key, label, count? }]
 * @param {string} activeTab   - Key da aba ativa
 * @param {function} onChange  - Callback (key) => void
 */
export default function Tabs({ tabs = [], activeTab, onChange }) {
  return (
    <div className={styles.tabsWrapper} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={activeTab === tab.key}
          className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={styles.count}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
