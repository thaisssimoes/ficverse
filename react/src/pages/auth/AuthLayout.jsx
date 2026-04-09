import { Link } from 'react-router-dom';
import styles from './AuthLayout.module.css';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className={styles.page}>
      <div className={styles.bg} />
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>FicVerse</Link>
        <div className={styles.card}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
