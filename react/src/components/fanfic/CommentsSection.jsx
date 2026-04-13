import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatTimestamp } from '../../utils/formatters';
import Button from '../ui/Button';
import styles from './CommentsSection.module.css';

const IconReply = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 17 4 12 9 7" />
    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
  </svg>
);

const IconHeart = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const IconFlag = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function CommentAvatar({ user }) {
  const username = user?.username || 'U';
  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={username}
        className={styles.commentAvatarImg}
      />
    );
  }
  return (
    <div className={styles.commentAvatarFallback}>
      {username[0]?.toUpperCase()}
    </div>
  );
}

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
          {sorted.map((c) => {
            const commentUser = c.user || {};
            const username = commentUser.username || 'Usuário';
            const userId = commentUser.id;

            return (
              <div key={c.id} className={styles.commentCard}>
                {/* Avatar */}
                <div className={styles.commentAvatar}>
                  <CommentAvatar user={commentUser} />
                </div>

                <div className={styles.commentCardContent}>
                  {/* Cabeçalho: nome + data + ações de moderação */}
                  <div className={styles.commentMeta}>
                    <div className={styles.commentMetaLeft}>
                      {userId
                        ? <Link to={`/user/${userId}`} className={styles.commentAuthorLink}>{username}</Link>
                        : <span className={styles.commentAuthor}>{username}</span>
                      }
                      {c.edited && <span className={styles.editedBadge}>editado</span>}
                      <span className={styles.commentDate}>{formatTimestamp(c.created_at)}</span>
                    </div>

                    {/* Editar / Excluir — visíveis só para quem tem permissão */}
                    {editingId !== c.id && (canEdit(c) || canDelete(c)) && (
                      <div className={styles.modActions}>
                        {canEdit(c) && (
                          <button
                            className={styles.modBtn}
                            onClick={() => startEdit(c)}
                            title="Editar comentário"
                          >
                            <IconEdit />
                          </button>
                        )}
                        {canDelete(c) && (
                          <button
                            className={`${styles.modBtn} ${styles.modBtnDanger}`}
                            onClick={() => handleDelete(c.id)}
                            title="Excluir comentário"
                          >
                            <IconTrash />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Confirmar / Cancelar edição */}
                    {editingId === c.id && (
                      <div className={styles.modActions}>
                        <button
                          className={`${styles.modBtn} ${styles.modBtnConfirm}`}
                          onClick={() => saveEdit(c.id)}
                          disabled={isSavingEdit}
                          title="Salvar edição"
                        >
                          <IconCheck />
                        </button>
                        <button
                          className={styles.modBtn}
                          onClick={cancelEdit}
                          disabled={isSavingEdit}
                          title="Cancelar"
                        >
                          <IconX />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Corpo */}
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

                  {/* Ações sociais */}
                  {editingId !== c.id && (
                    <div className={styles.commentActions}>
                      <button
                        className={styles.commentActionBtn}
                        title="Responder"
                        onClick={() => toast.info?.('Resposta em breve.')}
                      >
                        <IconReply /> <span>Responder</span>
                      </button>
                      <button
                        className={styles.commentActionBtn}
                        title="Curtir"
                        onClick={() => toast.info?.('Curtida em breve.')}
                      >
                        <IconHeart /> <span>Curtir</span>
                      </button>
                      <button
                        className={`${styles.commentActionBtn} ${styles.commentActionReport}`}
                        title="Denunciar"
                        onClick={() => toast.info?.('Denúncia em breve.')}
                      >
                        <IconFlag /> <span>Denunciar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
