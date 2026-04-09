import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <Link to="/" className={styles.logo}>FicVerse</Link>
          <p>Fanfics interativas sem limites</p>
        </div>
        <div className={styles.links}>
          <div className={styles.column}>
            <h4>Plataforma</h4>
            <Link to="/home">Início</Link>
            <Link to="/explore">Explorar</Link>
            <Link to="/tags">Buscar por Tags</Link>
          </div>
          <div className={styles.column}>
            <h4>Comunidade</h4>
            <Link to="/register">Criar Conta</Link>
            <Link to="/login">Entrar</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>&copy; {new Date().getFullYear()} FicVerse. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
