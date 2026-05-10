import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chapterApi, fanficApi, interactiveApi, commentApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import PageLayout from '../components/layout/PageLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import CommentsSection from '../components/fanfic/CommentsSection';
import ReadingContent from '../components/reading/ReadingContent';
import StoryHeader from '../components/reading/StoryHeader';
import ReadingToolbar from '../components/reading/ReadingToolbar';
import styles from './ChapterReaderPage.module.css';

// ─── Design tokens (leitor) ───────────────────────────────────────────────────
const RD = {
  paper: '#fbf3e2', paperAlt: '#f5e9d0', surface: '#fffbf3',
  ink: '#1f1610', inkSoft: '#4d3f30', inkMute: '#8c7a62',
  border: '#e7d8b8',
  brick: '#d24a2e', brickSoft: '#fad6cc', brickBg: '#fce8df', onBrick: '#fffbf3',
};

// Dots SVG pattern para o header do modal
function DotsBg({ color }) {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="qm-dots" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="6" cy="6" r="1.4" fill={color} opacity="0.28"/>
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#qm-dots)"/>
    </svg>
  );
}

// Modal de perguntas v3 — estética "Atelier Alegre"
function QuestionsModal({ isOpen, onClose, questions, existingAnswers, onSave }) {
  const [inputs, setInputs] = useState(() => {
    const init = {};
    questions.forEach((q) => { init[q.placeholder] = existingAnswers[q.placeholder] || ''; });
    return init;
  });
  const [errors, setErrors] = useState([]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const empty = Object.entries(inputs).filter(([, v]) => !v.trim()).map(([k]) => k);
    if (empty.length) { setErrors(empty); return; }
    setErrors([]);
    await onSave(inputs);
    onClose();
  };

  const handleSkip = () => {
    // preenche com defaults vazios e fecha
    onClose();
  };

  // Detecta se uma pergunta é de pronome (placeholder contém "pronome")
  const isPronomeField = (q) => (q.placeholder || '').toLowerCase().includes('pronome');

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(31,22,16,0.6)', backdropFilter: 'blur(6px)',
      zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        maxWidth: 540, width: '100%',
        background: RD.surface, border: `1px solid ${RD.brickSoft}`,
        borderRadius: 14, overflow: 'hidden', position: 'relative',
        boxShadow: '0 2px 4px rgba(80,40,15,.06), 0 12px 24px rgba(80,40,15,.12), 0 24px 48px rgba(80,40,15,.10)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Fechar */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 14,
          width: 32, height: 32, borderRadius: '50%',
          background: RD.paper, border: `1px solid ${RD.border}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: RD.inkSoft, zIndex: 2,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* Header */}
        <div style={{
          padding: '32px 32px 24px', textAlign: 'center',
          borderBottom: `1px solid ${RD.border}`,
          background: RD.brickBg, position: 'relative', overflow: 'hidden',
        }}>
          <DotsBg color={RD.brick} />
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: RD.brick, fontWeight: 700, marginBottom: 12,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={RD.brick} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
              </svg>
              Personalização · interativa
            </div>
            <h2 style={{
              fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic',
              fontSize: 26, fontWeight: 400, letterSpacing: -0.6,
              color: RD.ink, lineHeight: 1.2, margin: '0 0 10px',
            }}>
              Antes da história começar —<br />quem você quer ser nela?
            </h2>
            <p style={{
              fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic',
              fontSize: 13.5, color: RD.inkSoft, margin: 0, lineHeight: 1.5,
              maxWidth: 380, marginLeft: 'auto', marginRight: 'auto',
            }}>
              Os campos abaixo aparecem ao longo da história. Você pode pular qualquer um — vai aparecer com o valor padrão da autora.
            </p>
          </div>
        </div>

        {/* Campos */}
        <div style={{ padding: '24px 32px', overflowY: 'auto', flex: 1 }}>
          {errors.length > 0 && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 16,
              background: RD.brickBg, border: `1px solid ${RD.brickSoft}`,
              fontFamily: 'Inter', fontSize: 13, color: RD.brick, fontWeight: 500,
            }}>
              Por favor, preencha todos os campos obrigatórios.
            </div>
          )}
          {questions.map((q, i) => (
            <div key={q.id} style={{ marginBottom: 18 }}>
              <label style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6,
              }}>
                <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: RD.ink }}>
                  {q.question_text}
                  {q.required && <span style={{ color: RD.brick, marginLeft: 3 }}>*</span>}
                </span>
                {q.hint && (
                  <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 11.5, color: RD.inkMute }}>
                    {q.hint}
                  </span>
                )}
              </label>

              {isPronomeField(q) ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  {['ela/dela', 'ele/dele', 'elu/delu'].map(opt => (
                    <button key={opt} onClick={() => setInputs(p => ({ ...p, [q.placeholder]: opt }))}
                      style={{
                        flex: 1, padding: '10px 12px', cursor: 'pointer',
                        background: inputs[q.placeholder] === opt ? RD.brick : RD.surface,
                        color: inputs[q.placeholder] === opt ? RD.onBrick : RD.ink,
                        border: `1px solid ${inputs[q.placeholder] === opt ? RD.brick : RD.border}`,
                        borderRadius: 8, fontFamily: 'Inter', fontSize: 13,
                        fontWeight: inputs[q.placeholder] === opt ? 600 : 500,
                        transition: 'background .12s, border-color .12s',
                      }}>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={inputs[q.placeholder] || ''}
                  onChange={e => {
                    setInputs(p => ({ ...p, [q.placeholder]: e.target.value }));
                    setErrors(err => err.filter(x => x !== q.placeholder));
                  }}
                  placeholder={q.default_answer || 'sua resposta…'}
                  style={{
                    width: '100%', padding: '10px 14px', boxSizing: 'border-box',
                    border: `1px solid ${errors.includes(q.placeholder) ? RD.brick : RD.border}`,
                    background: RD.paperAlt, borderRadius: 8, outline: 'none',
                    fontFamily: "'Fraunces', Georgia, serif", fontSize: 14.5, color: RD.ink,
                    transition: 'border-color .12s',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = RD.brick}
                  onBlur={e => e.currentTarget.style.borderColor = errors.includes(q.placeholder) ? RD.brick : RD.border}
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '18px 32px', borderTop: `1px solid ${RD.border}`,
          background: RD.paperAlt, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <button onClick={handleSkip} style={{
            background: 'transparent', border: 'none', color: RD.inkSoft,
            fontFamily: 'Inter', fontSize: 12.5, fontWeight: 500,
            cursor: 'pointer', textDecoration: 'underline', padding: 0,
          }}>
            Pular · usar valores padrão
          </button>
          <button onClick={handleSubmit} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
            background: RD.brick, color: RD.onBrick, border: 'none',
            fontFamily: 'Inter', fontSize: 14, fontWeight: 600,
          }}>
            Começar a ler
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
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

  // Em modo interativo autenticado, só exibe o conteúdo quando a renderização
  // com as respostas do leitor estiver pronta — evita que tags {{variavel}}
  // apareçam no texto antes das substituições serem aplicadas.
  const isContentReady =
    mode !== 'interactive' ||
    !isAuthenticated ||
    (hasAnswers && !!renderResult?.rendered_html);

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
          editHref={
            user && fanfic && user.user_id === fanfic.author_id
              ? `/dashboard?fanficId=${fanfic.id}&tab=chapters&chapterId=${chapter.id}`
              : undefined
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
            {isContentReady
              ? <ReadingContent html={displayContent} />
              : <LoadingSpinner text="Carregando história..." />
            }
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
