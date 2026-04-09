import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.glitch} data-text="404">404</div>
        <h1 className={styles.title}>Página não encontrada</h1>
        <p className={styles.subtitle}>
          Parece que esta história ainda não foi escrita…
        </p>
        <div className={styles.actions}>
          <Link to="/" className={styles.btnPrimary}>Voltar ao início</Link>
          <Link to="/explore" className={styles.btnSecondary}>Explorar fanfics</Link>
        </div>
      </div>
      <div className={styles.decoration} aria-hidden="true">
        <span className={styles.star} style={{ top: '15%', left: '10%', animationDelay: '0s' }}>✦</span>
        <span className={styles.star} style={{ top: '30%', right: '8%', animationDelay: '0.8s' }}>✦</span>
        <span className={styles.star} style={{ bottom: '25%', left: '15%', animationDelay: '1.5s' }}>✦</span>
        <span className={styles.star} style={{ bottom: '15%', right: '20%', animationDelay: '0.4s' }}>✦</span>
        <span className={styles.star} style={{ top: '60%', left: '5%', animationDelay: '2s' }}>✦</span>
      </div>
    </div>
  );
}
