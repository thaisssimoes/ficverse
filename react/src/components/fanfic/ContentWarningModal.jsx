import DOMPurify from 'dompurify';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import styles from './ContentWarningModal.module.css';

function hasRichContent(html) {
  if (!html) return false;
  return html.replace(/<[^>]*>/g, '').trim().length > 0;
}

export function useContentWarning(fanfic) {
  const sessionKey = fanfic ? `content_warning_confirmed_${fanfic.id}` : null;
  const hasConfirmed = sessionKey ? sessionStorage.getItem(sessionKey) === 'true' : false;
  const shouldShow = fanfic
    ? (fanfic.is_adult_content === true || hasRichContent(fanfic.disclaimer)) && !hasConfirmed
    : false;

  const confirm = () => {
    if (sessionKey) sessionStorage.setItem(sessionKey, 'true');
  };

  return { shouldShow, confirm };
}

export default function ContentWarningModal({ fanfic, isOpen, onConfirm, onCancel }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Aviso do Autor"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Voltar</Button>
          <Button variant="primary" onClick={onConfirm}>Continuar</Button>
        </>
      }
    >
      <div className={styles.body}>
        {fanfic?.is_adult_content && (
          <div className={styles.warningItem}>
            <div>
              <h3>Conteúdo Adulto (+18)</h3>
              <p>Esta fanfic contém conteúdo destinado a maiores de 18 anos.</p>
            </div>
          </div>
        )}
        {hasRichContent(fanfic?.disclaimer) && (
          <div
            className={styles.disclaimerContent}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(fanfic.disclaimer) }}
          />
        )}
      </div>
    </Modal>
  );
}
