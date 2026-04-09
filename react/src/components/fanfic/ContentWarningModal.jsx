import { useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import styles from './ContentWarningModal.module.css';

function needsWarning(fanfic) {
  return fanfic?.is_adult_content === true ||
    (fanfic?.trigger_warnings && fanfic.trigger_warnings.trim() !== '');
}

export function useContentWarning(fanfic) {
  const sessionKey = fanfic ? `content_warning_confirmed_${fanfic.id}` : null;
  const hasConfirmed = sessionKey ? sessionStorage.getItem(sessionKey) === 'true' : false;
  const shouldShow = fanfic ? needsWarning(fanfic) && !hasConfirmed : false;

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
      title="⚠️ Aviso de Conteúdo"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Voltar</Button>
          <Button variant="primary" onClick={onConfirm}>Confirmar e Continuar</Button>
        </>
      }
    >
      <div className={styles.body}>
        {fanfic?.is_adult_content && (
          <div className={styles.warningItem}>
            <span className={styles.icon}>🔞</span>
            <div>
              <h3>Conteúdo Adulto</h3>
              <p>Esta fanfic contém conteúdo destinado a maiores de 18 anos. Pode incluir temas maduros, linguagem adulta, violência ou conteúdo sexual.</p>
            </div>
          </div>
        )}
        {fanfic?.trigger_warnings?.trim() && (
          <div className={styles.warningItem}>
            <span className={styles.icon}>⚠️</span>
            <div>
              <h3>Avisos de Gatilho</h3>
              <p>Esta fanfic contém os seguintes avisos de conteúdo potencialmente sensível:</p>
              <div className={styles.triggerList}>{fanfic.trigger_warnings}</div>
            </div>
          </div>
        )}
        <div className={styles.notice}>
          <p><strong>Ao continuar, você confirma que:</strong></p>
          <ul>
            <li>Você tem idade apropriada para visualizar este conteúdo</li>
            <li>Você está ciente dos avisos apresentados</li>
            <li>Você deseja prosseguir por sua própria escolha</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
