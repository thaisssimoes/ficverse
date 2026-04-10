import Navbar from './Navbar';
import styles from './PageLayout.module.css';

/**
 * Layout principal da aplicação.
 *
 * @param {ReactNode} children   - Conteúdo da página
 * @param {boolean}  noNav      - Remove sidebar/nav (usado na tela de leitura)
 * @param {boolean}  noFooter   - Remove o rodapé (legado, mantido por compatibilidade)
 * @param {boolean}  fullWidth  - Remove o max-width do container de conteúdo
 */
export default function PageLayout({
  children,
  noNav = false,
  noFooter = false,
  fullWidth = false,
  readingMode = false,
}) {
  return (
    <div className={`${styles.root} ${noNav ? styles.noNav : ''}`}>
      {!noNav && <Navbar readingMode={readingMode} />}
      <main className={[
        styles.main,
        fullWidth    ? styles.fullWidth    : '',
        readingMode  ? styles.readingMain  : '',
        'page-transition',
      ].join(' ')}>
        {children}
      </main>
    </div>
  );
}
