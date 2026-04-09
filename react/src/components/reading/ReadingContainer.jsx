import styles from './ReadingContainer.module.css';

/**
 * Invólucro de imersão de leitura (inspirado no Medium).
 * Aplica max-width de 680px e centralização automática.
 *
 * @param {ReactNode} children - Conteúdo da área de leitura
 * @param {string}    className - Classes adicionais
 */
export default function ReadingContainer({ children, className = '' }) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      {children}
    </div>
  );
}
