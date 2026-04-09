import { Link } from 'react-router-dom';
import styles from './InteractivePanel.module.css';

const IconZap = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

/**
 * InteractivePanel — painel de personalização do modo interativo.
 * Aparece abaixo da lista de capítulos quando a história tem interactive_mode.
 */
export default function InteractivePanel({
  questions = [],
  allProfiles = [],
  readerProfile = {},
  selectedProfileId,
  onSelectProfile,
  onApplyProfile,
  applyPending = false,
  onEditAnswers,
  existingAnswers = {},
  isAuthenticated = false,
}) {
  if (questions.length === 0) return null;

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <IconZap />
        <span>Modo Interativo</span>
      </header>

      <p className={styles.description}>
        Esta história usa suas informações para personalizar a experiência de leitura.
      </p>

      {isAuthenticated && allProfiles.length > 0 && (
        <div className={styles.profileSelector}>
          <span className={styles.profileLabel}>Perfil de leitura</span>
          <div className={styles.profileRow}>
            <select
              className={styles.profileSelect}
              value={selectedProfileId ?? readerProfile.id ?? ''}
              onChange={(e) => onSelectProfile(Number(e.target.value))}
            >
              {allProfiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              className={styles.applyBtn}
              onClick={onApplyProfile}
              disabled={applyPending}
            >
              Aplicar
            </button>
          </div>
          <Link to="/profiles" className={styles.manageLink}>Gerenciar perfis</Link>
        </div>
      )}

      {isAuthenticated && (
        <button className={styles.editBtn} onClick={onEditAnswers}>
          <IconEdit />
          {Object.keys(existingAnswers).length > 0
            ? 'Editar minhas respostas'
            : 'Preencher minhas informações'}
        </button>
      )}

      {!isAuthenticated && (
        <Link to="/login" className={styles.loginPrompt}>
          Faça login para personalizar sua leitura
        </Link>
      )}
    </section>
  );
}
