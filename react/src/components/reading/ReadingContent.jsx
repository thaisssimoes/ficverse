import DOMPurify from 'dompurify';
import styles from './ReadingContent.module.css';

/**
 * Injeta HTML rico (Quill) com tipografia editorial Lora.
 * Sanitiza o conteúdo via DOMPurify antes de renderizar.
 *
 * @param {string} html - HTML a ser renderizado
 */
export default function ReadingContent({ html }) {
  const clean = DOMPurify.sanitize(html ?? '');
  return (
    <div
      className={styles.content}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
