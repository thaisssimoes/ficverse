import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chapterApi, fanficApi, interactiveApi, commentApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import PageLayout from '../components/layout/PageLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import CommentsSection from '../components/fanfic/CommentsSection';
import ReadingContent from '../components/reading/ReadingContent';
import StoryHeader from '../components/reading/StoryHeader';
import ReadingToolbar from '../components/reading/ReadingToolbar';
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

  // Buscamos questions em qualquer modo: no interativo servem para o modal de
  // perguntas; no normal, usamos os default_answer para renderizar as tags.
  const { data: questions = [] } = useQuery({
    queryKey: ['questions', chapter?.fanfic_id],
    queryFn: () => interactiveApi.getQuestions(chapter.fanfic_id),
    enabled: !!chapter?.fanfic_id,
  });

  // Mapa de substituição para o modo normal (default_answer de cada pergunta).
  const defaultVars = useMemo(() => {
    const map = {};
    for (const q of questions) {
      if (q.placeholder && q.default_answer) map[q.placeholder] = q.default_answer;
    }
    return map;
  }, [questions]);

  const { data: answers = {}, isLoading: loadingAnswers, isFetching: fetchingAnswers } = useQuery({
    queryKey: ['answers', chapter?.fanfic_id],
    queryFn: () => interactiveApi.getAnswers(chapter.fanfic_id),
    enabled: mode === 'interactive' && isAuthenticated && !!chapter?.fanfic_id,
  });

  // Modo interativo: renderiza com as respostas personalizadas do leitor.
  // O queryKey inclui answers para re-renderizar automaticamente ao salvá-los.
  const hasAnswers = Object.keys(answers).length > 0;
  const { data: renderResult } = useQuery({
    queryKey: ['rendered-content', chapter?.id, answers],
    queryFn: () => interactiveApi.render(chapter.content, answers),
    enabled: mode === 'interactive' && !!chapter?.content && hasAnswers,
    staleTime: Infinity,
  });

  // Modo normal: renderiza com os default_answer definidos pelo autor.
  const hasDefaults = Object.keys(defaultVars).length > 0;
  const { data: defaultRenderResult } = useQuery({
    queryKey: ['rendered-content-default', chapter?.id],
    queryFn: () => interactiveApi.render(chapter.content, defaultVars),
    enabled: mode !== 'interactive' && !!chapter?.content && hasDefaults,
    staleTime: Infinity,
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

  // Modo leitura — oculta nav lateral enquanto o capítulo estiver aberto
  useEffect(() => {
    document.body.classList.add('reading-mode');
    return () => document.body.classList.remove('reading-mode');
  }, []);

  // Atualiza progresso de leitura e incrementa views
  useEffect(() => {
    if (!chapter) return;
    chapterApi.incrementView(chapter.id).catch(() => {});
    if (!isAuthenticated || !fanfic) return;
    const order = chapter.order || (allChapters.findIndex((c) => c.id === chapter.id) + 1);
    chapterApi.updateReadingProgress(fanfic.id, order).catch(() => {});
  }, [chapter?.id]);

  // Tamanho da fonte — persiste no localStorage
  const FONT_MIN = 14;
  const FONT_MAX = 28;
  const FONT_STEP = 1;
  const FONT_DEFAULT = 24;
  const [fontSize, setFontSize] = useState(() => {
    const saved = Number(localStorage.getItem('lollipopfics_font_size'));
    return saved >= FONT_MIN && saved <= FONT_MAX ? saved : FONT_DEFAULT;
  });

  const changeFontSize = (delta) => {
    setFontSize((prev) => {
      const next = Math.min(FONT_MAX, Math.max(FONT_MIN, prev + delta));
      localStorage.setItem('lollipopfics_font_size', String(next));
      return next;
    });
  };

  // Botão de voltar ao topo
  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: 'smooth' }), []);

  // Like do capítulo com atualização otimista
  const [chapterLiked, setChapterLiked] = useState(null); // null = usa o valor do servidor
  const [chapterLikesCount, setChapterLikesCount] = useState(null);

  const chapterLikeMutation = useMutation({
    mutationFn: () => chapterApi.toggleLike(chapter.id),
    onMutate: () => {
      const prevLiked = chapterLiked ?? chapter?.liked_by_me ?? false;
      const prevCount = chapterLikesCount ?? chapter?.likes_count ?? 0;
      setChapterLiked(!prevLiked);
      setChapterLikesCount(prevLiked ? Math.max(prevCount - 1, 0) : prevCount + 1);
    },
    onSuccess: (data) => {
      setChapterLiked(data.liked);
      setChapterLikesCount(data.likes_count);
    },
    onError: () => {
      setChapterLiked(null);
      setChapterLikesCount(null);
    },
  });

  // Mutations
  const saveAnswersMutation = useMutation({
    mutationFn: (ans) => interactiveApi.saveAnswers(chapter.fanfic_id, ans),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers', chapter.fanfic_id] });
      toast.success('Respostas salvas!');
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ content, parentId }) => commentApi.createChapterComment(id, content, parentId ?? null),
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

  // Conteúdo final — prioridade:
  //  1. Modo interativo + leitor tem respostas → usa respostas personalizadas
  //  2. Modo normal + autor definiu defaults   → usa default_answer
  //  3. Fallback                               → HTML bruto (tags visíveis)
  const displayContent =
    mode === 'interactive' && renderResult?.rendered_html
      ? renderResult.rendered_html
      : defaultRenderResult?.rendered_html ?? (chapter?.content ?? '');

  // Navegação entre capítulos
  const sorted = [...allChapters].sort((a, b) => a.order - b.order);
  const currentIndex = sorted.findIndex((c) => c.id === parseInt(id));
  const prevChapter = currentIndex > 0 ? sorted[currentIndex - 1] : null;
  const nextChapter = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;

  const navigateTo = (chId) => navigate(`/chapter/${chId}?mode=${mode}`);

  if (loadingChapter) return <PageLayout><LoadingSpinner text="Carregando capítulo..." fullPage /></PageLayout>;
  if (!chapter) return <PageLayout><p className={styles.error}>Capítulo não encontrado.</p></PageLayout>;

  return (
    <PageLayout readingMode>
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

      <div className={styles.page}>
        {/* Header editorial do capítulo */}
        <StoryHeader
          title={chapter.title}
          chapterOrder={chapter.order}
          fanficTitle={fanfic?.title}
          fanficId={fanfic?.id}
          author={fanfic?.author?.username}
          authorAvatar={fanfic?.author?.avatar_url}
          viewsCount={chapter.views_count ?? 0}
          commentsCount={comments.length}
          likesCount={chapterLikesCount ?? chapter?.likes_count ?? 0}
          likedByMe={chapterLiked ?? chapter?.liked_by_me ?? false}
          onLike={() => chapterLikeMutation.mutate()}
          isAuthenticated={isAuthenticated}
          mode={mode}
          actions={
            user && fanfic && user.user_id === fanfic.author_id ? (
              <Link to={`/dashboard?fanficId=${fanfic.id}&tab=chapters&chapterId=${chapter.id}`}>
                <Button variant="secondary" size="sm">✏️ Editar capítulo</Button>
              </Link>
            ) : null
          }
        />

        {/* Área de leitura: toolbar sticky à esquerda + artigo centralizado */}
        <div className={styles.readingArea}>
          <ReadingToolbar
            fontSize={fontSize}
            fontMin={FONT_MIN}
            fontMax={FONT_MAX}
            onFontChange={changeFontSize}
          />
          <article
            className={styles.articleColumn}
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.75 }}
          >
            <ReadingContent html={displayContent} />
          </article>
        </div>

        {/* Navegação entre capítulos */}
        <nav className={styles.nav}>
          {prevChapter ? (
            <Button variant="secondary" onClick={() => navigateTo(prevChapter.id)}>
              ← Anterior
            </Button>
          ) : <span />}

          {sorted.length > 1 && (
            <select
              className={styles.chapterSelect}
              value={parseInt(id)}
              onChange={(e) => navigateTo(Number(e.target.value))}
              aria-label="Ir para capítulo"
            >
              {sorted.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  Cap. {ch.order} — {ch.title}
                </option>
              ))}
            </select>
          )}

          {nextChapter ? (
            <Button onClick={() => navigateTo(nextChapter.id)}>
              Próximo →
            </Button>
          ) : <span />}
        </nav>

        {/* Comentários */}
        <CommentsSection
          comments={comments}
          onAddComment={(content, parentId) => addCommentMutation.mutateAsync({ content, parentId })}
          onDeleteComment={(cid) => deleteCommentMutation.mutateAsync(cid)}
          onEditComment={(cid, content) => editCommentMutation.mutateAsync({ cid, content })}
          fanficAuthorId={fanfic?.author_id}
          isLoadingComments={loadingComments}
        />
      </div>

      {/* Botão voltar ao topo */}
      <button
        className={`${styles.backToTop} ${showBackToTop ? styles.backToTopVisible : ''}`}
        onClick={scrollToTop}
        aria-label="Voltar ao topo"
        title="Voltar ao topo"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </PageLayout>
  );
}
