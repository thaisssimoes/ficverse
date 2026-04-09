import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner({ text = 'Carregando...', fullPage = false }) {
  return (
    <div className={`${styles.container} ${fullPage ? styles.fullPage : ''}`}>
      <div className={styles.spinner} />
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );
}
