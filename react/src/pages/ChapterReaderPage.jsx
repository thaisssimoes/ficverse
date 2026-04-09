import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chapterApi, fanficApi, interactiveApi, commentApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { substitutePlaceholders } from '../utils/substitution';
import PageLayout from '../components/layout/PageLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import CommentsSection from '../components/fanfic/CommentsSection';
import ReadingEnvironment from '../components/reading/ReadingEnvironment';
import ReadingContent from '../components/reading/ReadingContent';
import StoryHeader from '../components/reading/StoryHeader';
import styles from './ChapterReaderPage.module.css';

// Modal de perguntas (pendentes ou iniciais)
function QuestionsModal({ isOpen, onClose, questions, existingAnswers, onSave }) {
  const [inputs, setInputs] = useState(() => {
    const init = {};
    questions.forEach((q) => { init[q.placeholder] = existingAnswers[q.placeholder] || ''; });
    return init;
  });
  const [errors, setErrors] = useState([]);

  const handleSubmit = async () => {
    const empty = Object.entries(inputs).filter(([, v]) => !v.trim()).map(([k]) => k);
    if (empty.length) { setErrors(empty); return; }
    setErrors([]);
    await onSave(inputs);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Perguntas Interativas"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit}>Salvar Respostas</Button>
        </>
      }
    >
      {errors.length > 0 && (
        <p className={styles.validationMsg}>Por favor, responda todas as perguntas antes de continuar.</p>
      )}
      <div className={styles.questionsList}>
        {questions.map((q, i) => (
          <div key={q.id} className={styles.questionItem}>
            <label className={styles.questionLabel}>{i + 1}. {q.question_text}</label>
            <input
              type="text"
              className={`${styles.questionInput} ${errors.includes(q.placeholder) ? styles.inputError : ''}`}
              value={inputs[q.placeholder] || ''}
              onChange={(e) => {
                setInputs((p) => ({ ...p, [q.placeholder]: e.target.value }));
                setErrors((err) => err.filter((x) => x !== q.placeholder));
              }}
              placeholder="Digite sua resposta..."
            />
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default function ChapterReaderPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const mode = searchParams.get('mode') || 'non-interactive';
  const [questionsOpen, setQuestionsOpen] = useState(false);

  // Queries
  const { data: chapter, isLoading: loadingChapter } = useQuery({
    queryKey: ['chapter', id],
    queryFn: () => chapterApi.getById(id),
  });

  const { data: fanfic } = useQuery({
    queryKey: ['fanfic', chapter?.fanfic_id],
    queryFn: () => fanficApi.getById(chapter.fanfic_id),
    enabled: !!chapter?.fanfic_id,
  });

  const { data: allChapters = [] } = useQuery({
    queryKey: ['chapters', chapter?.fanfic_id],
    queryFn: () => chapterApi.getAll(chapter.fanfic_id),
    enabled: !!chapter?.fanfic_id,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['questions', chapter?.fanfic_id],
    queryFn: () => interactiveApi.getQuestions(chapter.fanfic_id),
    enabled: mode === 'interactive' && !!chapter?.fanfic_id,
  });

  const { data: answers = {}, isLoading: loadingAnswers, isFetching: fetchingAnswers } = useQuery({
    queryKey: ['answers', chapter?.fanfic_id],
    queryFn: () => interactiveApi.getAnswers(chapter.fanfic_id),
    enabled: mode === 'interactive' && isAuthenticated && !!chapter?.fanfic_id,
  });

  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['chapter-comments', id],
    queryFn: () => commentApi.getChapterComments(id),
    enabled: !!chapter,
  });

  // Abre o modal de perguntas apenas se o leitor não tiver respostas salvas.
  useEffect(() => {
    if (mode !== 'interactive' || !chapter?.fanfic_id || !isAuthenticated) return;
    if (loadingAnswers || fetchingAnswers || questions.length === 0) return;
    if (Object.keys(answers).length === 0) setQuestionsOpen(true);
  }, [mode, chapter?.fanfic_id, isAuthenticated, questions.length, loadingAnswers, fetchingAnswers]);

  // Atualiza progresso de leitura
  useEffect(() => {
    if (!isAuthenticated || !chapter || !fanfic) return;
    const order = chapter.order || (allChapters.findIndex((c) => c.id === chapter.id) + 1);
    chapterApi.updateReadingProgress(fanfic.id, order).catch(() => {});
  }, [chapter?.id]);

  // Mutations
  const saveAnswersMutation = useMutation({
    mutationFn: (ans) => interactiveApi.saveAnswers(chapter.fanfic_id, ans),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers', chapter.fanfic_id] });
      toast.success('Respostas salvas!');
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (content) => commentApi.createChapterComment(id, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chapter-comments', id] }),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (cid) => commentApi.delete(cid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chapter-comments', id] }),
  });

  const editCommentMutation = useMutation({
    mutationFn: ({ cid, content }) => commentApi.update(cid, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chapter-comments', id] }),
  });

  const handleSaveAnswers = async (inputs) => {
    const merged = { ...answers, ...inputs };
    await saveAnswersMutation.mutateAsync(merged);
  };

  // Conteúdo do capítulo (com substituição de placeholders)
  const getContent = () => {
    if (!chapter?.content) return '';
    if (mode === 'interactive' && Object.keys(answers).length > 0) {
      return substitutePlaceholders(chapter.content, answers);
    }
    return chapter.content;
  };

  // Navegação entre capítulos
  const sorted = [...allChapters].sort((a, b) => a.order - b.order);
  const currentIndex = sorted.findIndex((c) => c.id === parseInt(id));
  const prevChapter = currentIndex > 0 ? sorted[currentIndex - 1] : null;
  const nextChapter = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;

  const navigateTo = (chId) => navigate(`/chapter/${chId}?mode=${mode}`);

  if (loadingChapter) return <PageLayout><LoadingSpinner text="Carregando capítulo..." fullPage /></PageLayout>;
  if (!chapter) return <PageLayout><p className={styles.error}>Capítulo não encontrado.</p></PageLayout>;

  return (
    <PageLayout noNav>
      {/* Modal de perguntas */}
      {questionsOpen && (
        <QuestionsModal
          isOpen={questionsOpen}
          onClose={() => setQuestionsOpen(false)}
          questions={questions}
          existingAnswers={answers}
          onSave={handleSaveAnswers}
        />
      )}

      <ReadingEnvironment>
        {/* Header editorial do capítulo */}
        <StoryHeader
          title={chapter.title}
          chapterOrder={chapter.order}
          fanficTitle={fanfic?.title}
          fanficId={fanfic?.id}
          author={fanfic?.author_username}
          mode={mode}
          actions={
            user && fanfic && user.user_id === fanfic.author_id ? (
              <Link to={`/dashboard?fanficId=${fanfic.id}`}>
                <Button variant="secondary" size="sm">✏️ Editar história</Button>
              </Link>
            ) : null
          }
        />

        {/* Conteúdo com tipografia Lora — 18-20px, line-height 1.6 */}
        <article>
          <ReadingContent html={getContent()} />
        </article>

        {/* Navegação entre capítulos */}
        <nav className={styles.nav}>
          {prevChapter && (
            <Button variant="secondary" onClick={() => navigateTo(prevChapter.id)}>
              ← Capítulo Anterior
            </Button>
          )}
          {nextChapter && (
            <Button onClick={() => navigateTo(nextChapter.id)}>
              Próximo Capítulo →
            </Button>
          )}
        </nav>

        {/* Comentários */}
        <CommentsSection
          comments={comments}
          onAddComment={(content) => addCommentMutation.mutateAsync(content)}
          onDeleteComment={(cid) => deleteCommentMutation.mutateAsync(cid)}
          onEditComment={(cid, content) => editCommentMutation.mutateAsync({ cid, content })}
          fanficAuthorId={fanfic?.author_id}
          isLoadingComments={loadingComments}
        />
      </ReadingEnvironment>
    </PageLayout>
  );
}
