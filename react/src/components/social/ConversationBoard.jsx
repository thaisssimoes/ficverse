import { useState } from 'react';
import styles from './ConversationBoard.module.css';
import { formatTimestamp } from '../../utils/formatters';

const IconPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="17" x2="12" y2="22" />
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z" />
  </svg>
);

const IconTrash = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

/**
 * ConversationBoard — mural público de conversas do perfil.
 *
 * @param {Array}    messages     - [{ id, author, content, created_at, pinned }]
 * @param {boolean}  canPost      - Visitante autenticado pode postar
 * @param {boolean}  isOwner      - Dono do mural (pode deletar e fixar qualquer mensagem)
 * @param {number}   currentUserId
 * @param {function} onPost       - (content) => Promise
 * @param {function} onDelete     - (msgId) => Promise
 * @param {function} onPin        - (msgId) => Promise
 */
export default function ConversationBoard({
  messages = [],
  canPost = false,
  isOwner = false,
  currentUserId,
  onPost,
  onDelete,
  onPin,
}) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const content = e.target.elements.message.value.trim();
    if (!content || !onPost || submitting) return;
    setSubmitting(true);
    try {
      await onPost(content);
      e.target.reset();
    } finally {
      setSubmitting(false);
    }
  };

  const pinnedMessages = messages.filter((m) => m.pinned);
  const regularMessages = messages.filter((m) => !m.pinned);

  return (
    <div className={styles.board}>
      {/* Input de novo recado */}
      {canPost && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <textarea
            name="message"
            className={styles.textarea}
            placeholder="Deixe um recado..."
            rows={3}
            maxLength={1000}
          />
          <div className={styles.formFooter}>
            <span className={styles.charHint}>máx. 1000 caracteres</span>
            <button type="submit" className={styles.postBtn} disabled={submitting}>
              {submitting ? 'Publicando…' : 'Publicar'}
            </button>
          </div>
        </form>
      )}

      {messages.length === 0 ? (
        <div className={styles.empty}>
          <p>Nenhuma mensagem ainda.</p>
          {canPost && <p className={styles.emptyHint}>Seja o primeiro a deixar um recado!</p>}
        </div>
      ) : (
        <div className={styles.list}>
          {/* Fixadas primeiro */}
          {pinnedMessages.map((msg) => (
            <MessageCard
              key={msg.id}
              msg={msg}
              isOwner={isOwner}
              currentUserId={currentUserId}
              onDelete={onDelete}
              onPin={onPin}
              pinned
            />
          ))}
          {regularMessages.map((msg) => (
            <MessageCard
              key={msg.id}
              msg={msg}
              isOwner={isOwner}
              currentUserId={currentUserId}
              onDelete={onDelete}
              onPin={onPin}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MessageCard({ msg, isOwner, currentUserId, onDelete, onPin, pinned = false }) {
  const canDelete = isOwner || msg.author_id === currentUserId;

  return (
    <div className={`${styles.message} ${pinned ? styles.messagePinned : ''}`}>
      {pinned && (
        <div className={styles.pinnedBadge}>
          <IconPin /> Fixada
        </div>
      )}
      <div className={styles.messageHeader}>
        <div className={styles.msgAvatar}>
          {msg.author?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
        <div className={styles.msgMeta}>
          <span className={styles.msgAuthor}>{msg.author}</span>
          {msg.created_at && (
            <span className={styles.msgDate}>{formatTimestamp(msg.created_at)}</span>
          )}
        </div>

        {/* Ações de moderação */}
        {(isOwner || canDelete) && (
          <div className={styles.msgActions}>
            {isOwner && onPin && (
              <button
                className={`${styles.actionBtn} ${pinned ? styles.actionBtnActive : ''}`}
                onClick={() => onPin(msg.id)}
                title={pinned ? 'Desafixar' : 'Fixar mensagem'}
              >
                <IconPin />
              </button>
            )}
            {canDelete && onDelete && (
              <button
                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                onClick={() => onDelete(msg.id)}
                title="Deletar mensagem"
              >
                <IconTrash />
              </button>
            )}
          </div>
        )}
      </div>
      <p className={styles.msgContent}>{msg.content}</p>
    </div>
  );
}
