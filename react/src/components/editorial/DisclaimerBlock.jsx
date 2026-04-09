import DOMPurify from 'dompurify';
import styles from './DisclaimerBlock.module.css';

const IconAlertTriangle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/**
 * DisclaimerBlock — aviso/disclaimer da história.
 * Renderizado abaixo da lista de capítulos (e do painel interativo, se houver).
 */
export default function DisclaimerBlock({ disclaimer }) {
  if (!disclaimer?.trim()) return null;

  return (
    <section className={styles.block}>
      <header className={styles.header}>
        <IconAlertTriangle />
        <span>Aviso do Autor</span>
      </header>
      <div
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(disclaimer) }}
      />
    </section>
  );
}
