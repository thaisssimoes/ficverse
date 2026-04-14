import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { fanficApi, chapterApi, interactiveApi, tagApi, profileApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import PageLayout from '../components/layout/PageLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import AuthorHeader from '../components/editorial/AuthorHeader';
import FeedList from '../components/editorial/FeedList';
import styles from './FanficDetailPage.module.css';

// Verifica se um campo HTML tem conteúdo real (não apenas tags vazias do editor)
function hasRichContent(html) {
  if (!html) return false;
  return html.replace(/<[^>]*>/g, '').trim().length > 0;
}

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

// Modal de perguntas interativas / configuração do modo interativo
function QuestionsModal({ isOpen, onClose, questions, existingAnswers, readerProfile, allProfiles, selectedProfileId, onSelectProfile, onSave, fanficId }) {
  const toast = useToast();
  const [inputs, setInputs] = useState({});
  const [errors, setErrors] = useState([]);
  const [saveToProfile, setSaveToProfile] = useState({});
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  // Cópia local do perfil selecionado — mudança imediata sem fechar o modal
  const [localProfileId, setLocalProfileId] = useState(selectedProfileId);

  // Na abertura do modal: inicializa localProfileId e carrega respostas.
  // Para variáveis padrão, o perfil SELECIONADO tem prioridade sobre os
  // existingAnswers (que podem ser de um perfil diferente usado anteriormente).
  // Para variáveis customizadas, não há equivalente no perfil — usa os
  // existingAnswers diretamente.
  useEffect(() => {
    if (!isOpen) return;
    setLocalProfileId(selectedProfileId);
    const updated = {};
    questions.forEach((q) => {
      if (q.variable_type === 'standard') {
        updated[q.placeholder] = readerProfile[q.standard_key] || existingAnswers[q.placeholder] || '';
      } else {
        updated[q.placeholder] = existingAnswers[q.placeholder] || '';
      }
    });
    setInputs(updated);
  }, [isOpen]); // só re-executa ao abrir

  // Quando o leitor troca de perfil DENTRO do modal: recarrega todas as
  // variáveis padrão com os dados do novo perfil. Campos sem valor no novo
  // perfil são limpos (não mantemos resíduos do perfil anterior).
  // Variáveis customizadas não são afetadas pela troca de perfil.
  const handleProfileChange = (id) => {
    setLocalProfileId(id);
    onSelectProfile(id); // propaga para o pai (atualiza readerProfile via state)
    const newProfile = allProfiles.find((p) => p.id === id) || {};
    setInputs((prev) => {
      const updated = { ...prev };
      questions.forEach((q) => {
        if (q.variable_type === 'standard') {
          // Sempre substitui — limpa o campo se o novo perfil não tiver o valor
          updated[q.placeholder] = newProfile[q.standard_key] || '';
        }
        // Variáveis customizadas mantêm o valor já digitado pelo leitor
      });
      return updated;
    });
  };

  const handleSavePreference = async () => {
    if (!localProfileId) return;
    localStorage.setItem(`lollipopfics_fanfic_${fanficId}_profile_id`, String(localProfileId));
    // Também aplica as respostas do perfil selecionado
    await onSave(inputs, saveToProfile, null, localProfileId);
    toast.success('Perfil salvo como preferência para esta história!');
    onClose();
  };

  const handleSubmit = async () => {
    // Não bloqueamos campos vazios — o backend ignora respostas vazias,
    // preservando respostas anteriores para campos não preenchidos no perfil.
    setErrors([]);
    const profileName = showCreateProfile && newProfileName.trim() ? newProfileName.trim() : null;
    await onSave(inputs, saveToProfile, profileName, localProfileId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurar Modo Interativo"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          {allProfiles.length > 0 && (
            <Button variant="secondary" onClick={handleSavePreference}>
              Salvar como preferência
            </Button>
          )}
          <Button onClick={handleSubmit}>Salvar Respostas</Button>
        </>
      }
    >
      {/* Seletor de perfil — só aparece se há perfis cadastrados */}
      {allProfiles.length > 0 && (
        <div className={styles.profileSelectorInModal}>
          <label className={styles.profileSelectorLabel}>Perfil de leitura</label>
          <select
            className={styles.profileSelectorSelect}
            value={localProfileId ?? allProfiles[0]?.id ?? ''}
            onChange={(e) => handleProfileChange(Number(e.target.value))}
          >
            {allProfiles.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <p className={styles.profileSelectorHint}>
            Selecionar um perfil preenche automaticamente as variáveis de perfil com seus dados salvos.
            Use "Salvar como preferência" para lembrar esta escolha nesta história.
          </p>
        </div>
      )}

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
      {allProfiles.length === 0 && (
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

  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(() => {
    // Preferência específica para esta história tem prioridade
    const fanficPref = localStorage.getItem(`lollipopfics_fanfic_${id}_profile_id`);
    if (fanficPref) return Number(fanficPref);
    const global = localStorage.getItem('lollipopfics_selected_profile_id');
    return global ? Number(global) : null;
  });

  const handleSelectProfile = (newId) => {
    setSelectedProfileId(newId);
    localStorage.setItem('lollipopfics_selected_profile_id', String(newId));
  };
  const [missingModalOpen, setMissingModalOpen] = useState(false);
  const [pendingApplyAnswers, setPendingApplyAnswers] = useState({});
  const [missingQuestions, setMissingQuestions] = useState([]);
  const [readingMode, setReadingMode] = useState('interactive');

  // Queries
  const { data: fanfic, isLoading: loadingFanfic } = useQuery({
    queryKey: ['fanfic', id],
    queryFn: () => fanficApi.getById(id),
  });

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

  const chapterLikeMutation = useMutation({
    mutationFn: (chapterId) => chapterApi.toggleLike(chapterId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chapters', id] }),
    onError: () => toast.error('Erro ao curtir capítulo.'),
  });

  const saveAnswersMutation = useMutation({
    mutationFn: ({ answers }) => interactiveApi.saveAnswers(id, answers),
    // Invalida todas as queries de answers — garante que ChapterReaderPage (que usa fanfic_id
    // numérico) também receba os dados atualizados, não só a query local com id string.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['answers'] }),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (updates) => profileApi.updateProfile(readerProfile.id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
  });

  const handleSaveAnswers = async (inputs, saveToProfileMap, newProfileName = null, profileId = null) => {
    // Usa o perfil explicitamente selecionado no modal; fallback para readerProfile
    const activeProfile =
      (profileId != null ? allProfiles.find((p) => p.id === profileId) : null) ||
      readerProfile;

    // Filtra inputs vazios: campos sem valor no novo perfil preservam a resposta anterior
    const filledInputs = Object.fromEntries(
      Object.entries(inputs).filter(([, v]) => v?.trim())
    );
    const merged = { ...existingAnswers, ...filledInputs };
    // Auto-completa variáveis padrão ainda vazias com dados do perfil ativo
    questions.forEach((q) => {
      if (!merged[q.placeholder] && q.variable_type === 'standard' && activeProfile[q.standard_key]) {
        merged[q.placeholder] = activeProfile[q.standard_key];
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
    } else if (activeProfile.id && Object.values(saveToProfileMap).some(Boolean)) {
      // Atualiza perfil existente se checkbox marcado
      const updates = { ...activeProfile };
      Object.entries(saveToProfileMap).forEach(([key, save]) => {
        if (save && inputs[key]) updates[key] = inputs[key];
      });
      try { await profileApi.updateProfile(activeProfile.id, updates); } catch {}
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

  const readChapter = (chapterId) => {
    const mode = fanfic?.interactive_mode ? readingMode : 'non-interactive';
    navigate(`/chapter/${chapterId}?mode=${mode}`);
  };

  const isAuthor = isAuthenticated && fanfic && user?.user_id === fanfic.author_id;
  const authorUsername = fanfic?.author?.username;
  const authorAvatarUrl = fanfic?.author?.avatar_url;
  const authorBio = fanfic?.author?.bio;

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
          allProfiles={allProfiles}
          selectedProfileId={selectedProfileId}
          onSelectProfile={handleSelectProfile}
          onSave={handleSaveAnswers}
          fanficId={id}
        />
      )}

      <div className={styles.page}>
          {/* Cabeçalho: capa + título + tags + sinopse */}
          <AuthorHeader
            fanfic={fanfic}
            tagsByType={tagsByType}
            favorited={favoriteStatus?.favorited}
            favoritesCount={favoriteStatus?.favorites_count ?? 0}
            onFavorite={() => favoriteMutation.mutate()}
            isAuthor={isAuthor}
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

          {/* Seção de trigger warning — visível apenas quando +18 */}
          {fanfic.is_adult_content && (
            <section className={styles.triggerWarningSection}>
              <p className={styles.triggerWarningBadge}>+18 — Conteúdo Adulto</p>
              {hasRichContent(fanfic.trigger_warnings) && (
                <div
                  className={styles.triggerWarningContent}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(fanfic.trigger_warnings) }}
                />
              )}
            </section>
          )}

          {/* Seções proporcionais: aviso + modo de leitura */}
          <div className={styles.sectionsRow}>

            {/* Aviso do autor */}
            {hasRichContent(fanfic.disclaimer) && (
              <section className={styles.detailSection}>
                <p className={styles.detailSectionLabel}>Aviso do Autor</p>
                <div
                  className={styles.detailContent}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(fanfic.disclaimer) }}
                />
              </section>
            )}

            {/* Modo de leitura — só para histórias interativas */}
            {fanfic.interactive_mode && questions.length > 0 && (
              <section className={styles.detailSection}>
                <p className={styles.detailSectionLabel}>Modo de Leitura</p>
                <div className={styles.modeBtns}>
                  <button
                    className={`${styles.modeBtn} ${readingMode === 'normal' ? styles.modeBtnActive : ''}`}
                    onClick={() => setReadingMode('normal')}
                  >
                    Normal
                  </button>
                  <div className={styles.modeBtnGroup}>
                    <button
                      className={`${styles.modeBtn} ${readingMode === 'interactive' ? styles.modeBtnActive : ''}`}
                      onClick={() => { setReadingMode('interactive'); if (isAuthenticated) setQuestionsOpen(true); }}
                    >
                      Interativa
                    </button>
                    {readingMode === 'interactive' && isAuthenticated && (
                      <button
                        className={styles.modeBtnEdit}
                        onClick={() => setQuestionsOpen(true)}
                        aria-label="Editar respostas interativas"
                        title="Editar respostas"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                {readingMode === 'interactive' && !isAuthenticated && (
                  <p className={styles.modeSelectorHint}>
                    <a href="/login" style={{ color: 'var(--color-accent-brand)' }}>Faça login</a> para personalizar sua leitura.
                  </p>
                )}
                {readingMode === 'normal' && (
                  <p className={styles.modeSelectorHint}>
                    A história é lida com os valores padrão definidos pelo autor.
                  </p>
                )}
              </section>
            )}
          </div>

          {/* Lista de capítulos — largura total */}
          <FeedList
            chapters={sortedChapters}
            onReadChapter={readChapter}
            onLikeChapter={(chapterId) => chapterLikeMutation.mutate(chapterId)}
            isAuthenticated={isAuthenticated}
          />
      </div>
    </PageLayout>
  );
}
