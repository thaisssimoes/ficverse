import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatTimestamp } from '../../utils/formatters';
import Button from '../ui/Button';
import styles from './CommentsSection.module.css';

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function CommentsSection({
  comments,
  onAddComment,
  onDeleteComment,
  onEditComment,
  fanficAuthorId,
  isLoadingComments,
}) {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const canDelete = (comment) => {
    if (!user) return false;
    return comment.user_id === user.user_id || fanficAuthorId === user.user_id;
  };

  const canEdit = (comment) => {
    if (!user) return false;
    return comment.user_id === user.user_id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddComment(text.trim());
      setText('');
    } catch (err) {
      toast.error(err.message || 'Erro ao enviar comentário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) return;
    try {
      await onDeleteComment(id);
    } catch {
      toast.error('Erro ao excluir comentário.');
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async (id) => {
    if (!editText.trim()) return;
    setIsSavingEdit(true);
    try {
      await onEditComment(id, editText.trim());
      setEditingId(null);
      setEditText('');
    } catch (err) {
      toast.error(err.message || 'Erro ao editar comentário.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const sorted = [...(comments || [])].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Comentários</h2>

      {isAuthenticated && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <textarea
            className={styles.textarea}
            placeholder="Escreva seu comentário..."
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className={styles.formActions}>
            <Button type="submit" isLoading={isSubmitting} disabled={!text.trim()}>
              Enviar Comentário
            </Button>
          </div>
        </form>
      )}

      {isLoadingComments ? (
        <p className={styles.loading}>Carregando comentários...</p>
      ) : sorted.length === 0 ? (
        <p className={styles.empty}>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
      ) : (
        <div className={styles.list}>
          {sorted.map((c) => (
            <div key={c.id} className={styles.comment}>
              <div className={styles.commentHeader}>
                <div className={styles.meta}>
                  <div className={styles.metaTop}>
                    <span className={styles.author}>
                      {c.user?.username || 'Usuário'}
                    </span>
                    {c.edited && <span className={styles.editedBadge}>editado</span>}
                  </div>
                  <span className={styles.time}>{formatTimestamp(c.created_at)}</span>
                </div>
                <div className={styles.commentActions}>
                  {canEdit(c) && editingId !== c.id && (
                    <button
                      className={styles.actionBtn}
                      onClick={() => startEdit(c)}
                      title="Editar comentário"
                    >
                      <IconEdit />
                    </button>
                  )}
                  {canDelete(c) && editingId !== c.id && (
                    <button
                      className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                      onClick={() => handleDelete(c.id)}
                      title="Excluir comentário"
                    >
                      <IconTrash />
                    </button>
                  )}
                  {editingId === c.id && (
                    <>
                      <button
                        className={`${styles.actionBtn} ${styles.actionBtnConfirm}`}
                        onClick={() => saveEdit(c.id)}
                        disabled={isSavingEdit}
                        title="Salvar edição"
                      >
                        <IconCheck />
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={cancelEdit}
                        disabled={isSavingEdit}
                        title="Cancelar"
                      >
                        <IconX />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editingId === c.id ? (
                <textarea
                  className={`${styles.textarea} ${styles.editTextarea}`}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  autoFocus
                />
              ) : (
                <p className={styles.commentBody}>{c.content}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
