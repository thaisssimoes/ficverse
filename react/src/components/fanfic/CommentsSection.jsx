import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatTimestamp } from '../../utils/formatters';
import { commentApi } from '../../services/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import styles from './CommentsSection.module.css';

// ── Ícones ────────────────────────────────────────────────────────────────────

const IconReply = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 17 4 12 9 7" />
    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
  </svg>
);

const IconHeart = ({ filled }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

// ── Avatar ────────────────────────────────────────────────────────────────────

function CommentAvatar({ user, size = 'md' }) {
  const username = user?.username || 'U';
  const cls = size === 'sm' ? styles.commentAvatarSm : styles.commentAvatarImg;
  const fallbackCls = size === 'sm' ? styles.commentAvatarFallbackSm : styles.commentAvatarFallback;
  if (user?.avatar_url) {
    return <img src={user.avatar_url} alt={username} className={cls} />;
  }
  return <div className={fallbackCls}>{username[0]?.toUpperCase()}</div>;
}

// ── Modal de denúncia ─────────────────────────────────────────────────────────

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam ou propaganda' },
  { value: 'ofensivo', label: 'Conteúdo ofensivo ou abusivo' },
  { value: 'spoiler', label: 'Spoiler sem aviso' },
  { value: 'outro', label: 'Outro motivo' },
];

function ReportModal({ isOpen, onClose, onConfirm }) {
  const [reason, setReason] = useState('spam');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onConfirm(reason);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Denunciar comentário"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} isLoading={loading}>Enviar denúncia</Button>
        </>
      }
    >
      <div className={styles.reportBody}>
        <p className={styles.reportDesc}>Selecione o motivo da denúncia:</p>
        <div className={styles.reportOptions}>
          {REPORT_REASONS.map((r) => (
            <label key={r.value} className={styles.reportOption}>
              <input
                type="radio"
                name="report-reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
              />
              <span>{r.label}</span>
            </label>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// ── Card de comentário (reutilizado para top-level e replies) ─────────────────

function CommentCard({
  comment,
  isReply = false,
  onReply,
  onLike,
  onDelete,
  onEdit,
  onReport,
  canEdit,
  canDelete,
  isAuthenticated,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const toast = useToast();

  const commentUser = comment.user || {};
  const username = commentUser.username || 'Usuário';
  const userId = commentUser.id;

  const startEdit = () => {
    setEditingId(comment.id);
    setEditText(comment.content);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async () => {
    if (!editText.trim()) return;
    setIsSavingEdit(true);
    try {
      await onEdit(comment.id, editText.trim());
      setEditingId(null);
    } catch (err) {
      toast.error(err.message || 'Erro ao editar comentário.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className={isReply ? styles.replyCard : styles.commentCard}>
      <div className={styles.commentAvatar}>
        <CommentAvatar user={commentUser} size={isReply ? 'sm' : 'md'} />
      </div>

      <div className={styles.commentCardContent}>
        {/* Cabeçalho */}
        <div className={styles.commentMeta}>
          <div className={styles.commentMetaLeft}>
            {userId
              ? <Link to={`/user/${userId}`} className={styles.commentAuthorLink}>{username}</Link>
              : <span className={styles.commentAuthor}>{username}</span>
            }
            {comment.edited && <span className={styles.editedBadge}>editado</span>}
            <span className={styles.commentDate}>{formatTimestamp(comment.created_at)}</span>
          </div>

          {/* Botões de moderação */}
          {editingId !== comment.id && (canEdit || canDelete) && (
            <div className={styles.modActions}>
              {canEdit && (
                <button className={styles.modBtn} onClick={startEdit} title="Editar">
                  <IconEdit />
                </button>
              )}
              {canDelete && (
                <button className={`${styles.modBtn} ${styles.modBtnDanger}`} onClick={() => onDelete(comment.id)} title="Excluir">
                  <IconTrash />
                </button>
              )}
            </div>
          )}
          {editingId === comment.id && (
            <div className={styles.modActions}>
              <button className={`${styles.modBtn} ${styles.modBtnConfirm}`} onClick={saveEdit} disabled={isSavingEdit} title="Salvar">
                <IconCheck />
              </button>
              <button className={styles.modBtn} onClick={cancelEdit} disabled={isSavingEdit} title="Cancelar">
                <IconX />
              </button>
            </div>
          )}
        </div>

        {/* Corpo */}
        {editingId === comment.id ? (
          <textarea
            className={`${styles.textarea} ${styles.editTextarea}`}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={2}
            autoFocus
          />
        ) : (
          <p className={styles.commentBody}>{comment.content}</p>
        )}

        {/* Ações sociais */}
        {editingId !== comment.id && (
          <div className={styles.commentActions}>
            {!isReply && isAuthenticated && (
              <button className={styles.commentActionBtn} onClick={() => onReply(comment)} title="Responder">
                <IconReply /> <span>Responder</span>
              </button>
            )}
            <button
              className={`${styles.commentActionBtn} ${comment.liked_by_me ? styles.commentActionLiked : ''}`}
              onClick={() => onLike(comment.id)}
              title={comment.liked_by_me ? 'Descurtir' : 'Curtir'}
            >
              <IconHeart filled={comment.liked_by_me} />
              <span>{comment.likes_count > 0 ? comment.likes_count : 'Curtir'}</span>
            </button>
            {isAuthenticated && (
              <button
                className={`${styles.commentActionBtn} ${styles.commentActionReport}`}
                onClick={() => onReport(comment.id)}
                title="Denunciar"
              >
                <IconFlag /> <span>Denunciar</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CommentsSection({
  comments: initialComments,
  onAddComment,
  onDeleteComment,
  onEditComment,
  fanficAuthorId,
  isLoadingComments,
}) {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  // Estado local dos comentários para atualizações otimistas de like
  const [comments, setComments] = useState(initialComments || []);
  // Sincroniza quando o prop muda (nova busca)
  useState(() => setComments(initialComments || []), [initialComments]);

  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply
  const [replyingTo, setReplyingTo] = useState(null); // { id, username }
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Report
  const [reportTargetId, setReportTargetId] = useState(null);

  // Atualiza comentários quando o prop muda (refetch do React Query)
  useMemo(() => { setComments(initialComments || []); }, [initialComments]);

  const canDeleteComment = (c) => {
    if (!user) return false;
    return c.user_id === user.user_id || fanficAuthorId === user.user_id;
  };

  const canEditComment = (c) => {
    if (!user) return false;
    return c.user_id === user.user_id;
  };

  // ── Submit comentário raiz ─────────────────────────────────────────────────

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

  // ── Reply ──────────────────────────────────────────────────────────────────

  const handleReply = (parentComment) => {
    setReplyingTo({ id: parentComment.id, username: parentComment.user?.username || 'Usuário' });
    setReplyText('');
  };

  const cancelReply = () => setReplyingTo(null);

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);
    try {
      await onAddComment(replyText.trim(), replyingTo.id);
      setReplyingTo(null);
      setReplyText('');
    } catch (err) {
      toast.error(err.message || 'Erro ao enviar resposta.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) return;
    try {
      await onDeleteComment(id);
    } catch {
      toast.error('Erro ao excluir comentário.');
    }
  };

  // ── Like (otimista) ────────────────────────────────────────────────────────

  const handleLike = async (commentId) => {
    if (!isAuthenticated) {
      toast.error('Faça login para curtir comentários.');
      return;
    }
    // Atualização otimista
    setComments((prev) => prev.map((c) => {
      if (c.id === commentId) {
        const liked = !c.liked_by_me;
        return { ...c, liked_by_me: liked, likes_count: c.likes_count + (liked ? 1 : -1) };
      }
      return c;
    }));
    try {
      const { liked, likes_count } = await commentApi.toggleLike(commentId);
      setComments((prev) => prev.map((c) =>
        c.id === commentId ? { ...c, liked_by_me: liked, likes_count } : c
      ));
    } catch {
      // Reverte o otimismo em caso de erro
      setComments((prev) => prev.map((c) => {
        if (c.id === commentId) {
          const reverted = !c.liked_by_me;
          return { ...c, liked_by_me: reverted, likes_count: c.likes_count + (reverted ? 1 : -1) };
        }
        return c;
      }));
      toast.error('Erro ao curtir comentário.');
    }
  };

  // ── Report ─────────────────────────────────────────────────────────────────

  const handleReport = async (reason) => {
    try {
      await commentApi.report(reportTargetId, reason);
      toast.success('Denúncia enviada. Obrigado!');
    } catch (err) {
      if (err?.message?.includes('ALREADY_REPORTED') || err?.status === 409) {
        toast.error('Você já denunciou este comentário.');
      } else {
        toast.error('Erro ao enviar denúncia.');
      }
    }
  };

  // ── Monta árvore: top-level + replies agrupadas por parent_id ──────────────

  const sorted = [...comments].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const topLevel = sorted.filter((c) => !c.parent_id);
  const repliesByParent = sorted.reduce((acc, c) => {
    if (c.parent_id) {
      acc[c.parent_id] = acc[c.parent_id] || [];
      acc[c.parent_id].push(c);
    }
    return acc;
  }, {});

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Comentários</h2>

      {/* Formulário de novo comentário */}
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

      {/* Lista */}
      {isLoadingComments ? (
        <p className={styles.loading}>Carregando comentários...</p>
      ) : topLevel.length === 0 ? (
        <p className={styles.empty}>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
      ) : (
        <div className={styles.list}>
          {topLevel.map((c) => (
            <div key={c.id}>
              <CommentCard
                comment={c}
                onReply={handleReply}
                onLike={handleLike}
                onDelete={handleDelete}
                onEdit={onEditComment}
                onReport={setReportTargetId}
                canEdit={canEditComment(c)}
                canDelete={canDeleteComment(c)}
                isAuthenticated={isAuthenticated}
              />

              {/* Respostas */}
              {repliesByParent[c.id]?.length > 0 && (
                <div className={styles.repliesList}>
                  {repliesByParent[c.id].map((reply) => (
                    <CommentCard
                      key={reply.id}
                      comment={reply}
                      isReply
                      onReply={handleReply}
                      onLike={handleLike}
                      onDelete={handleDelete}
                      onEdit={onEditComment}
                      onReport={setReportTargetId}
                      canEdit={canEditComment(reply)}
                      canDelete={canDeleteComment(reply)}
                      isAuthenticated={isAuthenticated}
                    />
                  ))}
                </div>
              )}

              {/* Formulário de resposta inline */}
              {replyingTo?.id === c.id && (
                <div className={styles.replyForm}>
                  <div className={styles.replyFormLabel}>
                    Respondendo a <strong>@{replyingTo.username}</strong>
                    <button className={styles.cancelReplyBtn} onClick={cancelReply} title="Cancelar resposta">
                      <IconX />
                    </button>
                  </div>
                  <textarea
                    className={styles.textarea}
                    placeholder={`Responder @${replyingTo.username}...`}
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    autoFocus
                  />
                  <div className={styles.formActions}>
                    <Button variant="secondary" onClick={cancelReply}>Cancelar</Button>
                    <Button
                      isLoading={isSubmittingReply}
                      disabled={!replyText.trim()}
                      onClick={submitReply}
                    >
                      Responder
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de denúncia */}
      <ReportModal
        isOpen={reportTargetId !== null}
        onClose={() => setReportTargetId(null)}
        onConfirm={handleReport}
      />
    </section>
  );
}
