import DOMPurify from 'dompurify';
import { Link } from 'react-router-dom';
import styles from './AuthorSidebar.module.css';

/**
 * Sidebar editorial colada ao scroll (Substack).
 * Exibe seção interativa de perfil e disclaimer.
 *
 * @param {object}   fanfic
 * @param {Array}    questions
 * @param {Array}    allProfiles
 * @param {object}   readerProfile    - Perfil ativo
 * @param {number}   selectedProfileId
 * @param {function} onSelectProfile
 * @param {function} onApplyProfile
 * @param {boolean}  applyPending
 * @param {function} onEditAnswers
 * @param {object}   existingAnswers
 * @param {boolean}  isAuthenticated
 */
export default function AuthorSidebar({
  fanfic,
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
  const hasInteractive = fanfic?.interactive_mode && questions.length > 0;
  const hasDisclaimer = !!fanfic?.disclaimer?.trim();

  if (!hasInteractive && !hasDisclaimer) return null;

  return (
    <aside className={styles.sidebar}>
      {/* Seção interativa */}
      {hasInteractive && (
        <div className={styles.block}>
          <p className={styles.blockTitle}>Modo Interativo</p>
          <p className={styles.interactiveLabel}>
            Esta história usa suas informações para personalizar a leitura.
          </p>

          {isAuthenticated && allProfiles.length > 0 && (
            <div className={styles.profileSelector}>
              <span className={styles.profileSelectorLabel}>Perfil de leitura:</span>
              <div className={styles.profileSelectorRow}>
                <select
                  className={styles.profileSelectorInput}
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
              <Link to="/profiles" className={styles.profileLink}>Gerenciar perfis</Link>
            </div>
          )}

          {isAuthenticated && (
            <button className={styles.editAnswersBtn} onClick={onEditAnswers}>
              {Object.keys(existingAnswers).length > 0
                ? '✏️ Editar minhas respostas'
                : '✏️ Preencher minhas informações'}
            </button>
          )}
        </div>
      )}

      {/* Disclaimer */}
      {hasDisclaimer && (
        <div className={`${styles.block} ${styles.disclaimerBlock}`}>
          <p className={styles.blockTitle}>⚠️ Aviso</p>
          <div
            className={styles.disclaimerContent}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(fanfic.disclaimer) }}
          />
        </div>
      )}
    </aside>
  );
}
