import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fanficApi, chapterApi, interactiveApi, tagApi, profileApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import PageLayout from '../components/layout/PageLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ContentWarningModal from '../components/fanfic/ContentWarningModal';
import AuthorHeader from '../components/editorial/AuthorHeader';
import AuthorCard from '../components/editorial/AuthorCard';
import FeedList from '../components/editorial/FeedList';
import InteractivePanel from '../components/editorial/InteractivePanel';
import DisclaimerBlock from '../components/editorial/DisclaimerBlock';
import styles from './FanficDetailPage.module.css';

// Modal para perguntas sem resposta ao aplicar perfil
function MissingQuestionsModal({ isOpen, onClose, questions, profileName, onUpdateProfile, onSaveLocal }) {
  const [inputs, setInputs] = useState(() => {
    const init = {};
    questions.forEach((q) => { init[q.placeholder] = ''; });
    return init;
  });
  const [errors, setErrors] = useState([]);

  // Reinicia inputs quando as perguntas mudam (ex: perfil diferente)
  useEffect(() => {
    const init = {};
    questions.forEach((q) => { init[q.placeholder] = ''; });
    setInputs(init);
    setErrors([]);
  }, [questions]);

  const validate = () => {
    const empty = Object.entries(inputs).filter(([, v]) => !v.trim()).map(([k]) => k);
    if (empty.length) { setErrors(empty); return false; }
    setErrors([]);
    return true;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Perguntas sem resposta"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="secondary" onClick={() => { if (validate()) onSaveLocal(inputs); }}>
            Salvar Local
          </Button>
          <Button onClick={() => { if (validate()) onUpdateProfile(inputs); }}>
            Atualizar Perfil {profileName}
          </Button>
        </>
      }
    >
      <p className={styles.modalDesc}>
        Existem perguntas sem resposta para o perfil <strong>{profileName}</strong>. Preencha para continuar:
      </p>
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

// Modal de perguntas interativas
function QuestionsModal({ isOpen, onClose, questions, existingAnswers, readerProfile, onSave, hasProfiles }) {
  const [inputs, setInputs] = useState({});
  const [errors, setErrors] = useState([]);
  const [saveToProfile, setSaveToProfile] = useState({});
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  // Sincroniza inputs sempre que perfil ou respostas mudam
  useEffect(() => {
    setInputs(() => {
      const updated = {};
      questions.forEach((q) => {
        updated[q.placeholder] =
          existingAnswers[q.placeholder] ||
          (q.variable_type === 'standard' ? readerProfile[q.standard_key] || '' : '');
      });
      return updated;
    });
  }, [readerProfile, existingAnswers]); // re-executa quando perfil/respostas chegarem

  const handleSubmit = async () => {
    const empty = Object.entries(inputs).filter(([, v]) => !v.trim()).map(([k]) => k);
    if (empty.length) { setErrors(empty); return; }
    setErrors([]);
    const profileName = showCreateProfile && newProfileName.trim() ? newProfileName.trim() : null;
    await onSave(inputs, saveToProfile, profileName);
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
          <Button onClick={handleSubmit}>Salvar Respostas</Button>
        </>
      }
    >
      <p className={styles.modalDesc}>
        Responda às perguntas abaixo para personalizar sua experiência de leitura.
        Suas respostas serão incorporadas na história!
      </p>
      {errors.length > 0 && (
        <p className={styles.validationMsg}>Por favor, responda todas as perguntas antes de continuar.</p>
      )}
      <div className={styles.questionsList}>
        {questions.map((q, i) => (
          <div key={q.id} className={styles.questionItem}>
            <label className={styles.questionLabel}>
              {i + 1}. {q.question_text}
              {q.variable_type === 'standard'
                ? <span className={styles.tagStandard}>perfil</span>
                : <span className={styles.tagCustom}>personalizada</span>
              }
            </label>
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
            {q.variable_type === 'standard' && (
              <label className={styles.saveOption}>
                <input
                  type="checkbox"
                  defaultChecked
                  onChange={(e) => setSaveToProfile((p) => ({ ...p, [q.standard_key]: e.target.checked }))}
                />
                Salvar no meu perfil para futuras histórias
              </label>
            )}
          </div>
        ))}
      </div>

      {/* Criar perfil — só exibido para usuários sem perfis */}
      {!hasProfiles && (
        <div className={styles.createProfileSection}>
          {!showCreateProfile ? (
            <button className={styles.createProfileBtn} onClick={() => setShowCreateProfile(true)}>
              + Criar um perfil de leitura
            </button>
          ) : (
            <div className={styles.createProfileForm}>
              <label className={styles.createProfileLabel}>Nome do perfil</label>
              <input
                type="text"
                className={styles.questionInput}
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Ex: Perfil Principal"
                autoFocus
              />
              <p className={styles.createProfileHint}>
                As respostas das variáveis de perfil serão salvas automaticamente neste perfil.
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function FanficDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [warningOpen, setWarningOpen] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [missingModalOpen, setMissingModalOpen] = useState(false);
  const [pendingApplyAnswers, setPendingApplyAnswers] = useState({});
  const [missingQuestions, setMissingQuestions] = useState([]);

  // Queries
  const { data: fanfic, isLoading: loadingFanfic } = useQuery({
    queryKey: ['fanfic', id],
    queryFn: () => fanficApi.getById(id),
  });

  // onSuccess foi removido no React Query v5 — usar useEffect
  useEffect(() => {
    if (!fanfic) return;
    const key = `content_warning_confirmed_${fanfic.id}`;
    const needs = fanfic.is_adult_content || fanfic.trigger_warnings?.trim();
    const confirmed = sessionStorage.getItem(key) === 'true';
    if (!needs || confirmed) setContentVisible(true);
  }, [fanfic]);

  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters', id],
    queryFn: () => chapterApi.getAll(id),
    enabled: !!fanfic,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['fanfic-tags', id],
    queryFn: () => tagApi.getFanficTags(id),
    enabled: !!fanfic,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['questions', id],
    queryFn: () => interactiveApi.getQuestions(id),
    enabled: !!fanfic && fanfic.interactive_mode,
  });

  const { data: existingAnswers = {} } = useQuery({
    queryKey: ['answers', id],
    queryFn: () => interactiveApi.getAnswers(id),
    enabled: isAuthenticated && !!fanfic && fanfic.interactive_mode,
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: profileApi.listProfiles,
    enabled: isAuthenticated,
  });

  // Perfil ativo: o selecionado ou o primeiro da lista
  const readerProfile =
    allProfiles.find((p) => p.id === selectedProfileId) ||
    allProfiles[0] ||
    {};

  const { data: favoriteStatus } = useQuery({
    queryKey: ['favorite-status', id],
    queryFn: () => fanficApi.getFavoriteStatus(id),
    enabled: isAuthenticated && !!fanfic,
  });

  // Mutations
  const favoriteMutation = useMutation({
    mutationFn: () => fanficApi.toggleFavorite(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorite-status', id] }),
    onError: () => toast.error('Erro ao atualizar favorito.'),
  });

  const saveAnswersMutation = useMutation({
    mutationFn: ({ answers }) => interactiveApi.saveAnswers(id, answers),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['answers', id] }),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (updates) => profileApi.updateProfile(readerProfile.id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
  });

  // Content warning handlers
  const handleWarningConfirm = () => {
    if (fanfic) sessionStorage.setItem(`content_warning_confirmed_${fanfic.id}`, 'true');
    setWarningOpen(false);
    setContentVisible(true);
  };

  const handleWarningCancel = () => {
    setWarningOpen(false);
    navigate(-1);
  };

  const needsWarning = fanfic && (fanfic.is_adult_content || fanfic.trigger_warnings?.trim());
  const showWarning = needsWarning && warningOpen && !contentVisible;

  const handleSaveAnswers = async (inputs, saveToProfileMap, newProfileName = null) => {
    const merged = { ...existingAnswers, ...inputs };
    // Auto-completa variáveis padrão ainda não respondidas com o perfil
    questions.forEach((q) => {
      if (!merged[q.placeholder] && q.variable_type === 'standard' && readerProfile[q.standard_key]) {
        merged[q.placeholder] = readerProfile[q.standard_key];
      }
    });
    await saveAnswersMutation.mutateAsync({ answers: merged });

    if (newProfileName) {
      // Cria um novo perfil com as respostas das variáveis standard
      const profileData = { name: newProfileName };
      questions.forEach((q) => {
        if (q.variable_type === 'standard' && inputs[q.placeholder]) {
          profileData[q.standard_key] = inputs[q.placeholder];
        }
      });
      try {
        await profileApi.createProfile(profileData);
        queryClient.invalidateQueries({ queryKey: ['profiles'] });
        toast.success(`Perfil "${newProfileName}" criado!`);
      } catch {
        toast.error('Respostas salvas, mas falha ao criar perfil.');
      }
    } else if (readerProfile.id && Object.values(saveToProfileMap).some(Boolean)) {
      // Atualiza perfil existente se checkbox marcado
      const updates = { ...readerProfile };
      Object.entries(saveToProfileMap).forEach(([key, save]) => {
        if (save && inputs[key]) updates[key] = inputs[key];
      });
      try { await profileApi.updateProfile(readerProfile.id, updates); } catch {}
      toast.success('Respostas salvas!');
    } else {
      toast.success('Respostas salvas!');
    }
  };

  const doApplyAnswers = async (answers) => {
    await saveAnswersMutation.mutateAsync({ answers });
    // Invalida todos os caches de respostas (string e number keys)
    queryClient.invalidateQueries({ queryKey: ['answers'] });
    toast.success(`Perfil "${readerProfile.name}" aplicado!`);
  };

  const handleApplyProfile = () => {
    if (!fanfic?.interactive_mode || !isAuthenticated || questions.length === 0) return;

    // Começa do zero — não mistura respostas do perfil anterior.
    // Para cada pergunta: perfil (standard) > existente custom > pendente.
    const merged = {};
    const missing = [];

    questions.forEach((q) => {
      if (q.variable_type === 'standard') {
        const profileVal = readerProfile[q.standard_key];
        if (profileVal && profileVal.trim()) {
          merged[q.placeholder] = profileVal;
        } else {
          missing.push(q);
        }
      } else {
        // Pergunta customizada: mantém resposta existente ou pede preenchimento
        const existingVal = existingAnswers[q.placeholder];
        if (existingVal && existingVal.trim()) {
          merged[q.placeholder] = existingVal;
        } else {
          missing.push(q);
        }
      }
    });

    if (missing.length > 0) {
      setPendingApplyAnswers(merged);
      setMissingQuestions(missing);
      setMissingModalOpen(true);
    } else {
      doApplyAnswers(merged);
    }
  };

  const handleUpdateProfile = async (filledInputs) => {
    const allAnswers = { ...pendingApplyAnswers, ...filledInputs };
    // Atualiza o perfil com os valores padrão preenchidos
    const profileUpdates = { ...readerProfile };
    missingQuestions.forEach((q) => {
      if (q.variable_type === 'standard' && filledInputs[q.placeholder]) {
        profileUpdates[q.standard_key] = filledInputs[q.placeholder];
      }
    });
    await updateProfileMutation.mutateAsync(profileUpdates);
    await doApplyAnswers(allAnswers);
    setMissingModalOpen(false);
  };

  const handleSaveLocal = async (filledInputs) => {
    const allAnswers = { ...pendingApplyAnswers, ...filledInputs };
    await doApplyAnswers(allAnswers);
    setMissingModalOpen(false);
  };

  // Modo de leitura vem sempre do autor (interactive_mode da fanfic)
  const readChapter = (chapterId) => {
    const mode = fanfic?.interactive_mode ? 'interactive' : 'non-interactive';
    navigate(`/chapter/${chapterId}?mode=${mode}`);
  };

  const isAuthor = isAuthenticated && fanfic && user?.user_id === fanfic.author_id;

  // O autor vê também os rascunhos; leitores veem só capítulos publicados
  const sortedChapters = [...chapters]
    .filter((ch) => isAuthor || !ch.is_draft)
    .sort((a, b) => a.order - b.order);

  const tagsByType = {
    fandom: tags.filter((t) => t.type === 'fandom'),
    warning: tags.filter((t) => t.type === 'warning'),
    pairing: tags.filter((t) => t.type === 'pairing'),
  };

  const pendingQuestions = questions.filter((q) => {
    if (existingAnswers[q.placeholder]) return false;
    if (q.variable_type === 'standard' && readerProfile[q.standard_key]) return false;
    return true;
  });

  if (loadingFanfic) return <PageLayout><LoadingSpinner fullPage /></PageLayout>;
  if (!fanfic) return <PageLayout><p className={styles.error}>Fanfic não encontrada.</p></PageLayout>;

  return (
    <PageLayout>
      {/* Content Warning */}
      <ContentWarningModal
        fanfic={fanfic}
        isOpen={showWarning}
        onConfirm={handleWarningConfirm}
        onCancel={handleWarningCancel}
      />

      {/* Modal de perguntas sem resposta ao aplicar perfil */}
      {missingModalOpen && (
        <MissingQuestionsModal
          isOpen={missingModalOpen}
          onClose={() => setMissingModalOpen(false)}
          questions={missingQuestions}
          profileName={readerProfile.name}
          onUpdateProfile={handleUpdateProfile}
          onSaveLocal={handleSaveLocal}
        />
      )}

      {/* Questions Modal */}
      {questionsOpen && (
        <QuestionsModal
          isOpen={questionsOpen}
          onClose={() => setQuestionsOpen(false)}
          questions={pendingQuestions.length > 0 ? pendingQuestions : questions}
          existingAnswers={existingAnswers}
          readerProfile={readerProfile}
          onSave={handleSaveAnswers}
          hasProfiles={allProfiles.length > 0}
        />
      )}

      {contentVisible && (
        <div className={styles.page}>
          {/* Cabeçalho: capa + título + tags (sem sinopse) */}
          <AuthorHeader
            fanfic={fanfic}
            tagsByType={tagsByType}
            favorited={favoriteStatus?.favorited}
            favoritesCount={favoriteStatus?.favorites_count ?? 0}
            onFavorite={() => favoriteMutation.mutate()}
            isAuthor={isAuthor}
            compact
            authorActions={
              <Link to={`/dashboard?fanficId=${fanfic.id}`}>
                <Button size="sm" variant="secondary">Editar</Button>
              </Link>
            }
            isAuthenticated={isAuthenticated}
            loginFavorite={
              <Link to="/login" className={styles.favoriteBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                <span>Favoritar</span>
              </Link>
            }
          />

          {/* Layout vertical: autor → interativo → disclaimer → capítulos */}
          <div className={styles.stackedLayout}>
            <AuthorCard username={fanfic.author_username} />

            {fanfic.interactive_mode && questions.length > 0 && (
              <InteractivePanel
                questions={questions}
                allProfiles={allProfiles}
                readerProfile={readerProfile}
                selectedProfileId={selectedProfileId}
                onSelectProfile={setSelectedProfileId}
                onApplyProfile={handleApplyProfile}
                applyPending={saveAnswersMutation.isPending}
                onEditAnswers={() => setQuestionsOpen(true)}
                existingAnswers={existingAnswers}
                isAuthenticated={isAuthenticated}
              />
            )}

            <DisclaimerBlock disclaimer={fanfic.disclaimer} />

            <FeedList chapters={sortedChapters} onReadChapter={readChapter} />
          </div>
        </div>
      )}
    </PageLayout>
  );
}
