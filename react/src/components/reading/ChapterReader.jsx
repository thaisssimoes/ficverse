import DOMPurify from 'dompurify';
import styles from './ChapterReader.module.css';

/**
 * Renderiza o HTML final gerado pelo motor de renderização Go (RenderContent).
 *
 * O conteúdo passa obrigatoriamente pelo DOMPurify antes de ser injetado,
 * eliminando vetores de XSS enquanto preserva a marcação semântica usada
 * pelo editor (negrito, itálico, parágrafos, citações, etc.).
 *
 * @param {string} html  - String HTML já processada pelo backend.
 */
export default function ChapterReader({ html }) {
  const clean = DOMPurify.sanitize(html ?? '', {
    // Tags semânticas permitidas pelo editor Quill + estrutura básica.
    ALLOWED_TAGS: [
      'p', 'br', 'span', 'div',
      'b', 'strong', 'i', 'em', 'u', 's',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'ul', 'ol', 'li',
      'a', 'img', 'hr', 'code', 'pre',
    ],
    // Atributos permitidos — classes de tipografia e links.
    ALLOWED_ATTR: ['class', 'href', 'target', 'rel', 'src', 'alt', 'width', 'height'],
    // Garante que links externos não abram na mesma aba sem rel="noopener".
    ADD_ATTR: ['target'],
    FORCE_BODY: true,
  });

  return (
    <div
      className={styles.chapterReader}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
