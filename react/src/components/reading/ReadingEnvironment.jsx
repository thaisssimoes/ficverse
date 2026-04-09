import { useEffect } from 'react';
import styles from './ReadingEnvironment.module.css';

/**
 * ReadingEnvironment — wrapper de imersão total na leitura.
 *
 * Responsabilidade única: criar o "santuário de leitura" do Medium.
 * - Remove sidebar/nav durante a leitura (via classe no body)
 * - Centraliza a coluna de texto em max-width 68ch
 * - Garante a geometria correta do contêiner de leitura
 *
 * @param {ReactNode} children - Conteúdo da leitura
 */
export default function ReadingEnvironment({ children }) {
  // Adiciona classe ao body para que o PageLayout saiba ocultar elementos de nav
  useEffect(() => {
    document.body.classList.add('reading-mode');
    return () => document.body.classList.remove('reading-mode');
  }, []);

  return (
    <div className={styles.environment}>
      <div className={styles.column}>
        {children}
      </div>
    </div>
  );
}
