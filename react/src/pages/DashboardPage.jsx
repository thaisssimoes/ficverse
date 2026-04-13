import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

// ─── Ícones SVG (sem emojis estruturais) ──────────────────────────────
const IconPencil = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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

const IconPublish = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 8 16 12 12 16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const IconEye = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconPen = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const IconBookOpen = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const IconCloud = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

const IconMoreVertical = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
  </svg>
);

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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fanficApi, chapterApi, interactiveApi, commentApi, tagApi, profileApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { formatTimestamp, formatAbsoluteDate } from '../utils/formatters';
import { CATEGORIES } from '../constants';
import PageLayout from '../components/layout/PageLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import QuillEditor from '../components/editor/QuillEditor';
import styles from './DashboardPage.module.css';

// ─── Tag Input (reutilizado em vários lugares) ─────────────────────────
function TagInput({ tags, onAdd, onRemove, maxTags = 5, placeholder = 'Digite e pressione Enter' }) {
  const [value, setValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed && tags.length < maxTags) {
        onAdd(trimmed);
        setValue('');
      }
    }
  };

  return (
    <div>
      <div className={styles.tagInputRow}>
        <input
          type="text"
          className={styles.formInput}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`${placeholder} (máx. ${maxTags})`}
          disabled={tags.length >= maxTags}
        />
      </div>
      {tags.length > 0 && (
        <div className={styles.tagChips}>
          {tags.map((t, i) => (
            <span key={i} className={styles.tagChip}>
              {t}
              <button
                type="button"
                className={styles.tagChipRemove}
                onClick={() => onRemove(i)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal: Nova Fanfic ────────────────────────────────────────────────
function NewFanficModal({ isOpen, onClose, onCreated }) {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [interactiveMode, setInteractiveMode] = useState(false);
  const [adultContent, setAdultContent] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [tags, setTags] = useState({ fandom: [], warning: [], pairing: [] });

  const synopsisRef = useRef(null);
  const disclaimerRef = useRef(null);
  const triggerWarningsRef = useRef(null);
  const newCoverInputRef = useRef(null);

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione um arquivo de imagem válido.'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande. Máximo: 5MB.'); return; }
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const addTag = (type, name) => setTags((t) => ({ ...t, [type]: [...t[type], name] }));
  const removeTag = (type, idx) => setTags((t) => ({ ...t, [type]: t[type].filter((_, i) => i !== idx) }));

  const handleSubmit = async (isDraft) => {
    const synopsis = synopsisRef.current?.getContent() || '';
    if (!title.trim() || !category || !synopsis) {
      toast.error('Preencha título, categoria e sinopse.');
      return;
    }

    // Alerta ao publicar (não rascunho) com modo interativo mas sem poder adicionar perguntas ainda
    if (!isDraft && interactiveMode) {
      const proceed = window.confirm(
        'Esta história será criada em Modo Interativo.\n\n' +
        'Lembre-se de adicionar as variáveis na aba "Perguntas" do Dashboard antes de compartilhar com leitores.\n\n' +
        'Deseja publicar agora mesmo assim?'
      );
      if (!proceed) return;
    }

    setIsSubmitting(true);
    try {
      // 1) Criar a fanfic
      const fanfic = await fanficApi.create({
        title: title.trim(),
        category,
        synopsis,
        disclaimer: disclaimerRef.current?.getContent() || '',
        trigger_warnings: triggerWarningsRef.current?.getContent() || '',
        adult_content: adultContent,
        interactive_mode: interactiveMode,
        is_draft: isDraft,
      });

      // 2) Upload da capa, se houver
      if (coverFile) {
        try {
          await fanficApi.uploadCover(fanfic.id, coverFile);
        } catch {
          toast.error('Fanfic criada, mas a capa falhou ao subir.');
        }
      }

      // 3) Criar e associar tags
      for (const [type, names] of Object.entries(tags)) {
        for (const name of names) {
          try {
            const tag = await tagApi.create(name, type);
            await tagApi.addToFanfic(fanfic.id, [tag.id]);
          } catch {
            // tag pode já existir — tenta buscar e associar
            try {
              const results = await tagApi.search(name, type);
              const existing = results?.find?.((t) => t.name.toLowerCase() === name.toLowerCase());
              if (existing) await tagApi.addToFanfic(fanfic.id, [existing.id]);
            } catch { /* ignora */ }
          }
        }
      }

      toast.success(isDraft ? 'Rascunho salvo.' : 'Fanfic publicada.');
      onCreated(fanfic);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Erro ao criar fanfic.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Fanfic"
      size="xl"
      footer={
        <div className={styles.modalFooterMulti}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button variant="secondary" onClick={() => handleSubmit(true)} isLoading={isSubmitting}>Salvar Rascunho</Button>
          <Button onClick={() => handleSubmit(false)} isLoading={isSubmitting}>Publicar</Button>
        </div>
      }
    >
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Título *</label>
        <input className={styles.formInput} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da fanfic" maxLength={255} />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Sinopse *</label>
        <QuillEditor ref={synopsisRef} placeholder="Escreva a sinopse da sua fanfic..." minHeight="120px" />
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Categoria *</label>
          <select className={styles.formInput} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Selecione...</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className={styles.formGroup} style={{ justifyContent: 'flex-end' }}>
          <label className={styles.checkboxGroup}>
            <input type="checkbox" checked={interactiveMode} onChange={(e) => setInteractiveMode(e.target.checked)} />
            Modo Interativo
          </label>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Disclaimer</label>
        <QuillEditor ref={disclaimerRef} placeholder="Avisos ou disclaimers (opcional)..." minHeight="80px" />
      </div>

      {/* Avisos de conteúdo */}
      <div className={styles.warningSection}>
        <p className={styles.warningSectionTitle}>Avisos de Conteúdo</p>
        <label className={styles.checkboxGroup} style={{ marginBottom: '0.75rem' }}>
          <input type="checkbox" checked={adultContent} onChange={(e) => setAdultContent(e.target.checked)} />
          Conteúdo Adulto (+18)
        </label>
        <div className={styles.formGroup} style={{ margin: 0 }}>
          <label className={styles.formLabel}>Trigger Warnings</label>
          <QuillEditor ref={triggerWarningsRef} placeholder="Liste conteúdos potencialmente perturbadores..." minHeight="80px" />
        </div>
      </div>

      {/* Tags */}
      <div className={styles.tagsSection}>
        <p className={styles.tagsSectionTitle}>Tags</p>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Fandom</label>
          <TagInput tags={tags.fandom} onAdd={(v) => addTag('fandom', v)} onRemove={(i) => removeTag('fandom', i)} placeholder="Ex: Harry Potter" />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Avisos</label>
          <TagInput tags={tags.warning} onAdd={(v) => addTag('warning', v)} onRemove={(i) => removeTag('warning', i)} placeholder="Ex: Violência" />
        </div>
        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
          <label className={styles.formLabel}>Pairing</label>
          <TagInput tags={tags.pairing} onAdd={(v) => addTag('pairing', v)} onRemove={(i) => removeTag('pairing', i)} placeholder="Ex: Harry/Hermione" />
        </div>
      </div>

      {/* Capa */}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Capa da Fanfic</label>
        <div className={styles.coverUpload}>
          {coverPreview
            ? <img src={coverPreview} alt="Pré-visualização" className={styles.coverPreview} />
            : <div className={styles.coverPlaceholder}>—</div>
          }
          <div>
            <input ref={newCoverInputRef} type="file" accept="image/*" onChange={handleCoverChange} style={{ display: 'none' }} />
            <Button variant="secondary" size="sm" type="button" onClick={() => newCoverInputRef.current?.click()}>Escolher Capa</Button>
            <p className={styles.formHint}>JPG, PNG, GIF, WEBP · Máx. 5MB · Proporção recomendada: 2:3</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Aba: Info ─────────────────────────────────────────────────────────
function InfoTab({ fanfic, onUpdated }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(fanfic.title);
  const [category, setCategory] = useState(fanfic.category);
  const [interactiveMode, setInteractiveMode] = useState(fanfic.interactive_mode);
  const [adultContent, setAdultContent] = useState(fanfic.is_adult_content || false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [tags, setTags] = useState({ fandom: [], warning: [], pairing: [] });
  const coverInputRef = useRef(null);

  // Carrega tags existentes da fanfic
  // Sem default = [] aqui: o default inline criaria um array novo a cada render,
  // fazendo o useEffect abaixo disparar em loop infinito.
  const { data: existingTags } = useQuery({
    queryKey: ['fanfic-tags', fanfic.id],
    queryFn: () => tagApi.getFanficTags(fanfic.id),
  });

  // Inicializa o estado de tags quando os dados chegam do servidor (só roda uma vez por carga)
  useEffect(() => {
    if (!existingTags) return;
    setTags({
      fandom:  existingTags.filter((t) => t.type === 'fandom').map((t) => t.name),
      warning: existingTags.filter((t) => t.type === 'warning').map((t) => t.name),
      pairing: existingTags.filter((t) => t.type === 'pairing').map((t) => t.name),
    });
  }, [existingTags]);

  // Usado para checar perguntas antes de publicar (usa cache do React Query)
  const { data: questions = [] } = useQuery({
    queryKey: ['dash-questions', fanfic.id],
    queryFn: () => interactiveApi.getQuestions(fanfic.id),
  });
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const synopsisRef = useRef(null);
  const disclaimerRef = useRef(null);
  const triggerWarningsRef = useRef(null);

  const addTag = (type, name) => setTags((t) => ({ ...t, [type]: [...t[type], name] }));
  const removeTag = (type, idx) => setTags((t) => ({ ...t, [type]: t[type].filter((_, i) => i !== idx) }));

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione um arquivo de imagem válido.'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande. Máximo: 5MB.'); return; }
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const synopsis = synopsisRef.current?.getContent() || '';
    if (!title.trim() || !synopsis) { toast.error('Título e sinopse são obrigatórios.'); return; }

    setSaving(true);
    try {
      const updated = await fanficApi.update(fanfic.id, {
        title: title.trim(),
        category,
        synopsis,
        disclaimer: disclaimerRef.current?.getContent() || '',
        trigger_warnings: triggerWarningsRef.current?.getContent() || '',
        is_adult_content: adultContent,
      });

      if (coverFile) {
        try {
          const result = await fanficApi.uploadCover(fanfic.id, coverFile);
          if (result?.cover_url) {
            updated.cover_url = result.cover_url;
          }
        } catch {
          toast.error('Dados salvos, mas a capa falhou.');
        }
      }

      // Sincroniza tags: remove as antigas, adiciona as novas
      try {
        const oldTags = existingTags || [];
        const newTagNames = [
          ...tags.fandom.map((n) => ({ name: n, type: 'fandom' })),
          ...tags.warning.map((n) => ({ name: n, type: 'warning' })),
          ...tags.pairing.map((n) => ({ name: n, type: 'pairing' })),
        ];
        const oldTagNames = oldTags.map((t) => t.name.toLowerCase());
        const newTagNamesLower = newTagNames.map((t) => t.name.toLowerCase());

        // Remove tags que não estão mais na lista
        for (const old of oldTags) {
          if (!newTagNamesLower.includes(old.name.toLowerCase())) {
            await tagApi.removeFromFanfic(fanfic.id, old.id).catch(() => {});
          }
        }
        // Adiciona tags novas
        for (const { name, type } of newTagNames) {
          if (!oldTagNames.includes(name.toLowerCase())) {
            try {
              const tag = await tagApi.create(name, type);
              await tagApi.addToFanfic(fanfic.id, [tag.id]);
            } catch {
              try {
                const results = await tagApi.search(name, type);
                const existing = results?.find?.((t) => t.name.toLowerCase() === name.toLowerCase());
                if (existing) await tagApi.addToFanfic(fanfic.id, [existing.id]);
              } catch { /* ignora */ }
            }
          }
        }
        queryClient.invalidateQueries({ queryKey: ['fanfic-tags', fanfic.id] });
      } catch { /* tags são melhor-esforço */ }

      toast.success('Alterações salvas!');
      onUpdated(updated);
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    const synopsis = synopsisRef.current?.getContent() || '';
    if (!title.trim() || !synopsis) { toast.error('Salve título e sinopse antes de publicar.'); return; }

    // Alerta se modo interativo mas sem perguntas
    if (interactiveMode && questions.length === 0) {
      const proceed = window.confirm(
        'Esta história está em Modo Interativo, mas não tem nenhuma variável associada.\n\n' +
        'Leitores não poderão personalizar a experiência de leitura.\n\n' +
        'Deseja publicar mesmo assim? (Você pode adicionar variáveis na aba "Perguntas")'
      );
      if (!proceed) return;
    }

    setPublishing(true);
    try {
      await fanficApi.publish(fanfic.id);
      toast.success('Fanfic publicada.');
      onUpdated({ ...fanfic, is_draft: false });
    } catch (err) {
      toast.error(err.message || 'Erro ao publicar.');
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setPublishing(true);
    try {
      await fanficApi.unpublish(fanfic.id);
      toast.success('Fanfic despublicada.');
      onUpdated({ ...fanfic, is_draft: true });
    } catch (err) {
      toast.error(err.message || 'Erro ao despublicar.');
    } finally {
      setPublishing(false);
    }
  };

  const coverSrc = coverPreview || (fanfic.cover_url ? fanficApi.getAssetUrl(fanfic.cover_url) : null);

  return (
    <form onSubmit={handleSave}>
      {/* Status banner */}
      <div className={`${styles.statusBanner} ${fanfic.is_draft ? styles.statusBannerDraft : styles.statusBannerPublished}`}>
        <div>
          <p className={styles.statusBannerTitle}>
            {fanfic.is_draft ? 'Rascunho' : 'Publicada'}
          </p>
          <p className={styles.statusBannerSub}>
            {fanfic.is_draft
              ? 'Não visível para outros usuários.'
              : fanfic.published_at ? `Publicada em ${new Date(fanfic.published_at).toLocaleDateString('pt-BR')}` : 'Publicada'
            }
          </p>
        </div>
        {fanfic.is_draft
          ? <Button type="button" size="sm" onClick={handlePublish} isLoading={publishing}><IconPublish /> Publicar</Button>
          : <Button type="button" variant="secondary" size="sm" onClick={handleUnpublish} isLoading={publishing}>Despublicar</Button>
        }
      </div>

      {/* Informações básicas */}
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Título</label>
          <input className={styles.formInput} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Categoria</label>
          <select className={styles.formInput} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Sinopse</label>
        <QuillEditor key={`synopsis-${fanfic.id}`} ref={synopsisRef} initialValue={fanfic.synopsis || ''} placeholder="Sinopse da fanfic..." />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Disclaimer</label>
        <QuillEditor key={`disclaimer-${fanfic.id}`} ref={disclaimerRef} initialValue={fanfic.disclaimer || ''} placeholder="Avisos ou disclaimers (opcional)..." minHeight="100px" />
      </div>

      {/* Avisos de conteúdo */}
      <div className={styles.warningSection}>
        <p className={styles.warningSectionTitle}>Avisos de Conteúdo</p>
        <label className={styles.checkboxGroup} style={{ marginBottom: '0.75rem' }}>
          <input type="checkbox" checked={adultContent} onChange={(e) => setAdultContent(e.target.checked)} />
          Conteúdo Adulto (+18)
        </label>
        <div className={styles.formGroup} style={{ margin: 0 }}>
          <label className={styles.formLabel}>Trigger Warnings</label>
          <QuillEditor key={`tw-${fanfic.id}`} ref={triggerWarningsRef} initialValue={fanfic.trigger_warnings || ''} placeholder="Liste conteúdos potencialmente perturbadores..." minHeight="80px" />
        </div>
      </div>

      {/* Tags */}
      <div className={styles.tagsSection}>
        <p className={styles.tagsSectionTitle}>Tags</p>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Fandom</label>
          <TagInput tags={tags.fandom} onAdd={(v) => addTag('fandom', v)} onRemove={(i) => removeTag('fandom', i)} placeholder="Ex: Harry Potter" />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Avisos</label>
          <TagInput tags={tags.warning} onAdd={(v) => addTag('warning', v)} onRemove={(i) => removeTag('warning', i)} placeholder="Ex: Violência" />
        </div>
        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
          <label className={styles.formLabel}>Pairing</label>
          <TagInput tags={tags.pairing} onAdd={(v) => addTag('pairing', v)} onRemove={(i) => removeTag('pairing', i)} placeholder="Ex: Harry/Hermione" />
        </div>
      </div>

      {/* Capa */}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Imagem de Capa</label>
        <div className={styles.coverUpload}>
          {coverSrc
            ? <img src={coverSrc} alt="Capa" className={styles.coverPreview} />
            : <div className={styles.coverPlaceholder}>—</div>
          }
          <div>
            <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} style={{ display: 'none' }} />
            <Button variant="secondary" size="sm" type="button" onClick={() => coverInputRef.current?.click()}>Escolher Nova Capa</Button>
            <p className={styles.formHint}>JPG, PNG, GIF, WEBP · Máx. 5MB · Proporção: 2:3</p>
          </div>
        </div>
      </div>

      <div className={styles.formActions}>
        {!fanfic.is_draft && (
          <Link to={`/fanfic/${fanfic.id}`} style={{ textDecoration: 'none' }}>
            <Button type="button" variant="secondary" size="sm"><IconEye /> Ver Fanfic</Button>
          </Link>
        )}
        <Button type="submit" isLoading={saving}>Salvar Alterações</Button>
      </div>
    </form>
  );
}

// ─── Aba: Capítulos ─────────────────────────────────────────────────────
function ChaptersTab({ fanfic }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [chapterModal, setChapterModal] = useState(null); // null | chapter object | 'new'
  const [openMenuId, setOpenMenuId] = useState(null); // ID do capítulo com dropdown aberto

  const { data: chapters = [], isLoading } = useQuery({
    queryKey: ['dash-chapters', fanfic.id],
    queryFn: () => chapterApi.getAll(fanfic.id),
  });

  const sorted = [...chapters].sort((a, b) => a.order - b.order);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['dash-chapters', fanfic.id] });

  const handleDelete = async (chapterId) => {
    setOpenMenuId(null);
    if (!window.confirm('Excluir este capítulo? Esta ação não pode ser desfeita.')) return;
    try {
      await chapterApi.delete(chapterId);
      invalidate();
      toast.success('Capítulo excluído.');
    } catch (err) {
      toast.error(err.message || 'Erro ao excluir.');
    }
  };

  const handlePublish = async (chapterId) => {
    setOpenMenuId(null);
    if (!window.confirm('Publicar este capítulo? Ele ficará visível para os leitores.')) return;
    try {
      await chapterApi.publish(chapterId);
      invalidate();
      toast.success('Capítulo publicado.');
    } catch (err) {
      toast.error(err.message || 'Erro ao publicar.');
    }
  };

  const handleUnpublish = async (chapterId) => {
    setOpenMenuId(null);
    if (!window.confirm('Converter para rascunho? O capítulo ficará invisível para os leitores.')) return;
    try {
      await chapterApi.update(chapterId, { is_draft: true });
      invalidate();
      toast.success('Capítulo convertido para rascunho.');
    } catch (err) {
      toast.error(err.message || 'Erro ao converter.');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const publishedChapters = sorted.filter((ch) => !ch.is_draft);

  return (
    <>
      {/* Cabeçalho */}
      <div className={styles.chaptersHeader}>
        <p className={styles.chaptersCount}>
          {publishedChapters.length} {publishedChapters.length === 1 ? 'Capítulo publicado' : 'Capítulos publicados'}
        </p>
        <Button size="sm" onClick={() => setChapterModal('new')}>+ Novo Capítulo</Button>
      </div>

      {sorted.length === 0 ? (
        <div className={styles.emptyState}>Nenhum capítulo ainda. Clique em "+ Novo Capítulo" para começar.</div>
      ) : (
        <>
          {/* Cabeçalho das colunas */}
          <div className={styles.chapterColHeader}>
            <span>Título</span>
            <span>Data</span>
            <span>Status</span>
            <span />
          </div>

          {/* Linhas */}
          <ul className={styles.chapterRows}>
            {sorted.map((ch) => (
              <li key={ch.id} className={styles.chapterRow} onClick={() => openMenuId === ch.id && setOpenMenuId(null)}>
                <p className={styles.chapterRowTitle}>{ch.title}</p>
                <p className={styles.chapterRowDate}>
                  {formatAbsoluteDate(ch.created_at)}
                </p>
                <p className={styles.chapterRowStatus}>
                  {ch.is_draft ? 'Rascunho' : 'Publicado'}
                </p>
                <div className={styles.chapterRowActions}>
                  {/* Publicar (apenas rascunhos) */}
                  {ch.is_draft && (
                    <button
                      className={styles.chapterActionBtn}
                      title="Publicar capítulo"
                      onClick={(e) => { e.stopPropagation(); handlePublish(ch.id); }}
                    >
                      <IconPublish />
                    </button>
                  )}
                  {/* Editar */}
                  <button
                    className={styles.chapterActionBtn}
                    title="Editar capítulo"
                    onClick={(e) => { e.stopPropagation(); setChapterModal(ch); }}
                  >
                    <IconPencil />
                  </button>
                  {/* Visualizar (link para o capítulo) */}
                  <Link
                    to={`/chapter/${ch.id}`}
                    className={styles.chapterActionBtn}
                    title="Visualizar capítulo"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconEye />
                  </Link>
                  {/* Menu 3 pontos */}
                  <div className={styles.chapterMenuWrapper}>
                    <button
                      className={styles.chapterActionBtn}
                      title="Mais opções"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === ch.id ? null : ch.id);
                      }}
                    >
                      <IconMoreVertical />
                    </button>
                    {openMenuId === ch.id && (
                      <div className={styles.chapterDropdown}>
                        {!ch.is_draft && (
                          <button
                            className={styles.chapterDropdownItem}
                            onClick={(e) => { e.stopPropagation(); handleUnpublish(ch.id); }}
                          >
                            Salvar como Rascunho
                          </button>
                        )}
                        <button
                          className={`${styles.chapterDropdownItem} ${styles.chapterDropdownDanger}`}
                          onClick={(e) => { e.stopPropagation(); handleDelete(ch.id); }}
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {chapterModal !== null && (
        <ChapterModal
          fanficId={fanfic.id}
          chapter={chapterModal === 'new' ? null : chapterModal}
          onClose={() => setChapterModal(null)}
          onSaved={() => { invalidate(); setChapterModal(null); }}
        />
      )}
    </>
  );
}

// ─── Modal: Capítulo ────────────────────────────────────────────────────
function ChapterModal({ fanficId, chapter, onClose, onSaved }) {
  const toast = useToast();
  const [title, setTitle] = useState(chapter?.title || '');
  const [isDraft, setIsDraft] = useState(chapter?.is_draft ?? true);
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(chapter?.cover_url || null);
  const contentRef = useRef(null);
  const chCoverInputRef = useRef(null);
  const isEdit = chapter !== null;

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione um arquivo de imagem válido.'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande. Máximo: 5MB.'); return; }
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const content = contentRef.current?.getContent() || '';
    if (!title.trim() || contentRef.current?.isEmpty()) {
      toast.error('Preencha título e conteúdo.');
      return;
    }
    setSaving(true);
    try {
      let savedChapter;
      if (isEdit) {
        savedChapter = await chapterApi.update(chapter.id, { title: title.trim(), content, is_draft: isDraft });
      } else {
        savedChapter = await chapterApi.create(fanficId, { title: title.trim(), content, is_draft: isDraft });
      }

      // Upload da capa do capítulo, se selecionada
      if (coverFile && savedChapter?.id) {
        try {
          await chapterApi.uploadCover(savedChapter.id, coverFile);
        } catch {
          toast.error('Capítulo salvo, mas a capa falhou ao subir.');
        }
      }

      toast.success(isEdit ? 'Capítulo salvo!' : 'Capítulo criado!');
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Editar Capítulo' : 'Novo Capítulo'}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} isLoading={saving}>{isEdit ? 'Salvar Alterações' : 'Criar Capítulo'}</Button>
        </>
      }
    >
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Título do Capítulo</label>
        <input className={styles.formInput} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título..." />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Conteúdo</label>
        <QuillEditor
          key={chapter?.id ?? 'new'}
          ref={contentRef}
          initialValue={chapter?.content || ''}
          placeholder="Escreva o conteúdo do capítulo..."
          minHeight="300px"
        />
        <p className={styles.editorHint}>Dica: Use {'{{'} placeholder {'}} '}para criar espaços interativos</p>
      </div>

      {/* Upload de imagem de capítulo — desabilitado por ora */}

      <label className={styles.checkboxGroup}>
        <input type="checkbox" checked={isDraft} onChange={(e) => setIsDraft(e.target.checked)} />
        Salvar como Rascunho
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 400 }}>
          — Rascunhos não são visíveis para os leitores
        </span>
      </label>
    </Modal>
  );
}

// ─── Aba: Modo Interativo ────────────────────────────────────────────────
function QuestionsTab({ fanfic, onFanficUpdated }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [questionModal, setQuestionModal] = useState(null); // null | question | 'new' | { pendingStd: varDef }
  const [selectedStdKey, setSelectedStdKey] = useState('');
  const [interactiveMode, setInteractiveMode] = useState(fanfic.interactive_mode || false);
  const [togglingMode, setTogglingMode] = useState(false);

  const { data: questions = [], isLoading: loadingQ } = useQuery({
    queryKey: ['dash-questions', fanfic.id],
    queryFn: () => interactiveApi.getQuestions(fanfic.id),
  });

  const { data: standardVars = [] } = useQuery({
    queryKey: ['standard-vars'],
    queryFn: profileApi.getStandardVariables,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['dash-questions', fanfic.id] });

  const usedStdKeys = new Set(questions.filter((q) => q.variable_type === 'standard').map((q) => q.standard_key));
  const availableStdVars = standardVars.filter((v) => !usedStdKeys.has(v.key));

  // Toggle do modo interativo
  const handleToggleMode = async (enabled) => {
    setTogglingMode(true);
    try {
      await fanficApi.update(fanfic.id, { interactive_mode: enabled });
      setInteractiveMode(enabled);
      onFanficUpdated({ ...fanfic, interactive_mode: enabled });
      toast.success(enabled ? 'Modo Interativo ativado.' : 'Modo Interativo desativado.');
    } catch (err) {
      toast.error(err.message || 'Erro ao alterar modo.');
    } finally {
      setTogglingMode(false);
    }
  };

  // Selecionar variável padrão abre modal para preencher resposta padrão
  const handleAddStdClick = () => {
    if (!selectedStdKey) return;
    const varDef = standardVars.find((v) => v.key === selectedStdKey);
    if (!varDef) return;
    // Abre modal com a variável padrão pendente
    setQuestionModal({ pendingStd: varDef });
  };

  const handleDelete = async (qId) => {
    if (!window.confirm('Remover esta variável? Leitores com respostas existentes podem ser afetados.')) return;
    try {
      await interactiveApi.deleteQuestion(qId);
      invalidate();
      toast.success('Variável removida.');
    } catch (err) {
      toast.error(err.message || 'Erro ao remover.');
    }
  };

  if (loadingQ) return <LoadingSpinner />;

  return (
    <>
      {/* Toggle do Modo Interativo */}
      <div className={styles.interactiveModeToggle}>
        <div>
          <p className={styles.interactiveModeTitle}>Modo Interativo</p>
          <p className={styles.interactiveModeDesc}>
            Permite personalizar a história com o nome e dados do leitor.
          </p>
        </div>
        <label className={styles.toggleSwitch}>
          <input
            type="checkbox"
            checked={interactiveMode}
            onChange={(e) => handleToggleMode(e.target.checked)}
            disabled={togglingMode}
          />
          <span className={styles.toggleSlider} />
        </label>
      </div>

      {interactiveMode && (
        <>
          <div className={styles.infoBox}>
            <strong>Como funciona:</strong> Declare aqui quais variáveis sua história usa.
            Use <code style={{ color: 'var(--tag-fandom-color)' }}>{'{{nome_da_variavel}}'}</code> nos capítulos.{' '}
            Antes de ler, o sistema pedirá ao leitor que preencha os dados.{' '}
            A <strong>resposta padrão</strong> é usada quando o leitor lê sem personalizar — ela substitui a variável no modo normal de leitura.
          </div>

          <div className={styles.questionActions}>
            {availableStdVars.length > 0 ? (
              <div className={styles.standardVarRow}>
                <label className={styles.formLabel} style={{ whiteSpace: 'nowrap' }}>Variável padrão:</label>
                <select className={styles.formInput} value={selectedStdKey} onChange={(e) => setSelectedStdKey(e.target.value)}>
                  <option value="">Selecione...</option>
                  {availableStdVars.map((v) => (
                    <option key={v.key} value={v.key}>{v.label} ({'{{'}{v.key}{'}}'})</option>
                  ))}
                </select>
                <Button size="sm" onClick={handleAddStdClick} disabled={!selectedStdKey}>+ Adicionar</Button>
              </div>
            ) : (
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                Todas as variáveis padrão já foram adicionadas.
              </span>
            )}
            <Button variant="secondary" size="sm" onClick={() => setQuestionModal('new')}>+ Variável Customizada</Button>
          </div>

          {questions.length === 0 ? (
            <div className={styles.emptyState}>Nenhuma variável ainda. Adicione variáveis padrão ou crie customizadas.</div>
          ) : (
            <div className={styles.questionsList}>
              {questions.map((q) => (
                <div key={q.id} className={styles.questionCard}>
                  <div className={styles.questionCardInfo}>
                    <div className={styles.questionCardTop}>
                      {q.variable_type === 'standard'
                        ? <span className={styles.badgeStandard}>PADRÃO</span>
                        : <span className={styles.badgeCustom}>CUSTOM</span>
                      }
                      <span className={styles.questionCardText}>{q.question_text}</span>
                    </div>
                    <div className={styles.questionCardPlaceholder}>
                      Placeholder: <code>{'{{'}{q.placeholder}{'}}'}</code>
                    </div>
                    {q.default_answer ? (
                      <div className={styles.questionCardPlaceholder}>
                        Resposta padrão: <code>{q.default_answer}</code>
                      </div>
                    ) : (
                      <div className={styles.questionCardPlaceholder} style={{ color: 'var(--color-warning)' }}>
                        Sem resposta padrão — a variável não será substituída no modo normal.
                      </div>
                    )}
                      </div>
                  <div className={styles.questionCardActions}>
                    <Button variant="secondary" size="sm" onClick={() => setQuestionModal(q)} title="Editar variável"><IconPencil /></Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(q.id)} title="Remover variável"><IconTrash /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {questionModal !== null && (
        <QuestionModal
          fanficId={fanfic.id}
          pendingStd={questionModal?.pendingStd || null}
          question={questionModal === 'new' || questionModal?.pendingStd ? null : questionModal}
          onClose={() => { setQuestionModal(null); setSelectedStdKey(''); }}
          onSaved={() => { invalidate(); setQuestionModal(null); setSelectedStdKey(''); }}
        />
      )}
    </>
  );
}

// ─── Modal: Variável (Custom ou Padrão pendente) ─────────────────────────
function QuestionModal({ fanficId, question, pendingStd, onClose, onSaved }) {
  const toast = useToast();
  // pendingStd = { key, label, placeholder } → novo padrão a adicionar
  const isPendingStd = !!pendingStd;
  const isEdit = question !== null && !isPendingStd;
  const isStandard = isEdit && question?.variable_type === 'standard';

  const [text, setText] = useState(isPendingStd ? pendingStd.label : (question?.question_text || ''));
  const [placeholder, setPlaceholder] = useState(isPendingStd ? pendingStd.key : (question?.placeholder || ''));
  const [defaultAnswer, setDefaultAnswer] = useState(question?.default_answer || '');
  const [skipDefault, setSkipDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!isPendingStd && !isStandard && (!text.trim() || !placeholder.trim())) {
      toast.error('Preencha todos os campos.');
      return;
    }
    if (!isEdit && !isPendingStd && !/^[a-zA-Z0-9_]+$/.test(placeholder)) {
      toast.error('Placeholder: apenas letras, números e underscores.');
      return;
    }
    const finalDefault = skipDefault ? '' : defaultAnswer.trim();
    setSaving(true);
    try {
      if (isEdit) {
        await interactiveApi.updateQuestion(question.id, {
          question_text: isStandard ? undefined : text.trim(),
          default_answer: finalDefault,
        });
      } else if (isPendingStd) {
        await interactiveApi.createQuestion(fanficId, {
          question_text: pendingStd.label,
          placeholder: pendingStd.key,
          variable_type: 'standard',
          standard_key: pendingStd.key,
          default_answer: finalDefault,
        });
      } else {
        await interactiveApi.createQuestion(fanficId, {
          question_text: text.trim(),
          placeholder: placeholder.trim(),
          variable_type: 'custom',
          default_answer: finalDefault,
        });
      }
      toast.success(isEdit ? 'Variável atualizada!' : 'Variável criada!');
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar variável.');
    } finally {
      setSaving(false);
    }
  };

  const modalTitle = isPendingStd
    ? `Adicionar: ${pendingStd.label}`
    : isEdit
      ? `Editar Variável${isStandard ? ' Padrão' : ' Customizada'}`
      : 'Nova Variável Customizada';

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={modalTitle}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} isLoading={saving}>{isEdit ? 'Salvar' : isPendingStd ? 'Adicionar Variável' : 'Criar Variável'}</Button>
        </>
      }
    >
      {/* Variável padrão pendente — mostra qual variável será adicionada */}
      {isPendingStd && (
        <div className={styles.infoBox} style={{ marginBottom: 'var(--space-4)' }}>
          <strong>{pendingStd.label}</strong> — será usada como{' '}
          <code style={{ color: 'var(--tag-fandom-color)' }}>{'{{'}{pendingStd.key}{'}}'}</code> nos capítulos.
        </div>
      )}

      {/* Pergunta para o leitor — apenas variáveis customizadas e edições */}
      {!isPendingStd && (
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Pergunta para o leitor</label>
          <input
            className={styles.formInput}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ex: Qual o nome da sua espada mágica?"
            readOnly={isStandard}
          />
        </div>
      )}

      {/* Placeholder — apenas ao criar variável customizada */}
      {!isEdit && !isPendingStd && (
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Nome da variável (placeholder)</label>
          <input
            className={styles.formInput}
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
            placeholder="Ex: espada_magica"
          />
          <p className={styles.formHint}>
            Apenas letras, números e underscores. Use no capítulo como <code style={{ color: 'var(--tag-fandom-color)' }}>{'{{'}{placeholder || 'variavel'}{'}}'}</code>
          </p>
        </div>
      )}

      {/* Resposta padrão */}
      <div className={styles.formGroup} style={{ marginBottom: skipDefault ? 0 : undefined }}>
        <label className={styles.formLabel}>
          Resposta padrão{' '}
          <span className={styles.formHint}>(substitui a variável para leitores sem personalização)</span>
        </label>
        {!skipDefault && (
          <input
            className={styles.formInput}
            value={defaultAnswer}
            onChange={(e) => setDefaultAnswer(e.target.value)}
            placeholder={isPendingStd ? `Ex: ${pendingStd.placeholder || '—'}` : 'Ex: uma guerreira destemida'}
            disabled={skipDefault}
          />
        )}
        <label className={styles.checkboxGroup} style={{ marginTop: '0.5rem' }}>
          <input
            type="checkbox"
            checked={skipDefault}
            onChange={(e) => setSkipDefault(e.target.checked)}
          />
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
            Deixar sem resposta padrão (a variável não será substituída no modo normal)
          </span>
        </label>
      </div>
    </Modal>
  );
}

// ─── Aba: Comentários ───────────────────────────────────────────────────
function CommentsTab({ fanfic }) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading: loadingC } = useQuery({
    queryKey: ['dash-comments', fanfic.id],
    queryFn: () => commentApi.getFanficComments(fanfic.id),
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ['dash-chapters', fanfic.id],
    queryFn: () => chapterApi.getAll(fanfic.id),
  });

  if (loadingC) return <LoadingSpinner />;

  // Agrupar por capítulo
  const fanficComments = comments.filter((c) => !c.chapter_id);
  const groups = [];
  if (fanficComments.length > 0) groups.push({ title: 'Comentários Gerais', items: fanficComments });
  chapters.forEach((ch) => {
    const chComments = comments.filter((c) => c.chapter_id === ch.id);
    if (chComments.length > 0) groups.push({ title: `Cap. ${ch.order}: ${ch.title}`, items: chComments });
  });

  if (groups.length === 0) {
    return <div className={styles.emptyState}>Nenhum comentário ainda.</div>;
  }

  return (
    <>
      {groups.map((group) => (
        <div key={group.title} className={styles.commentsGroup}>
          <p className={styles.commentsGroupTitle}>{group.title}</p>
          {group.items.map((c) => {
            const user = c.user || {};
            const username = user.username || 'Usuário';
            const userId = user.id;
            const avatarUrl = user.avatar_url;
            return (
              <div key={c.id} className={styles.commentCard}>
                {/* Avatar */}
                <div className={styles.commentAvatar}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt={username} className={styles.commentAvatarImg} />
                    : <div className={styles.commentAvatarFallback}>{username[0]?.toUpperCase()}</div>
                  }
                </div>

                <div className={styles.commentCardContent}>
                  <div className={styles.commentMeta}>
                    {userId
                      ? <Link to={`/user/${userId}`} className={styles.commentAuthorLink}>{username}</Link>
                      : <span className={styles.commentAuthor}>{username}</span>
                    }
                    <span className={styles.commentDate}>{formatTimestamp(c.created_at)}</span>
                  </div>
                  <p className={styles.commentText}>{c.content}</p>
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
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

// ─── Página Principal ────────────────────────────────────────────────────
const TABS = [
  { key: 'info', label: 'Informações' },
  { key: 'chapters', label: 'Capítulos' },
  { key: 'questions', label: 'Modo Interativo' },
  { key: 'comments', label: 'Comentários' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedFanficOverride, setSelectedFanficOverride] = useState(null);

  const { data: myFanfics = [], isLoading } = useQuery({
    queryKey: ['my-fanfics', user?.user_id],
    queryFn: () => fanficApi.getByAuthor(user.user_id, true),
    enabled: !!user?.user_id,
  });

  // Pré-seleciona fanfic via ?fanficId= (vindo da página de detalhes ou capítulo)
  useEffect(() => {
    const fanficId = searchParams.get('fanficId');
    if (fanficId && myFanfics.length > 0 && !selectedId) {
      const target = myFanfics.find((f) => f.id === Number(fanficId));
      if (target) {
        setSelectedId(target.id);
        setActiveTab('info');
      }
    }
  }, [myFanfics.length, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = filterStatus === 'all' ? myFanfics
    : filterStatus === 'draft' ? myFanfics.filter((f) => f.is_draft)
    : myFanfics.filter((f) => !f.is_draft);

  const published = myFanfics.filter((f) => !f.is_draft);
  const drafts    = myFanfics.filter((f) => f.is_draft);

  const selectedFanfic = selectedFanficOverride || myFanfics.find((f) => f.id === selectedId) || null;

  const handleSelect = useCallback((f) => {
    setSelectedId(f.id);
    setSelectedFanficOverride(null);
    setActiveTab('info');
  }, []);

  const invalidateMyFanfics = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['my-fanfics', user?.user_id] });
  }, [queryClient, user?.user_id]);

  const handleFanficUpdated = useCallback((updated) => {
    setSelectedFanficOverride(updated);
    invalidateMyFanfics();
  }, [invalidateMyFanfics]);

  const handleFanficCreated = useCallback((fanfic) => {
    invalidateMyFanfics();
    setSelectedId(fanfic.id);
    setSelectedFanficOverride(fanfic);
    setActiveTab('info');
  }, [invalidateMyFanfics]);

  const handleDelete = async () => {
    if (!selectedFanfic) return;
    if (!window.confirm('Excluir esta fanfic? Esta ação não pode ser desfeita.')) return;
    try {
      await fanficApi.delete(selectedFanfic.id);
      invalidateMyFanfics();
      setSelectedId(null);
      setSelectedFanficOverride(null);
      toast.success('Fanfic excluída.');
    } catch (err) {
      toast.error(err.message || 'Erro ao excluir.');
    }
  };

  return (
    <PageLayout fullWidth>
      <div className={styles.page}>
        <div className={styles.layout}>

          {/* ── Sidebar ── */}
          <aside className={styles.sidebar}>
            {/* Botão no topo, acima de tudo */}
            <div className={styles.sidebarNewRow}>
              <Button onClick={() => setShowNewModal(true)} size="sm" className={styles.newBtn}>
                + Nova História
              </Button>
            </div>

            <div className={styles.sidebarTop}>
              <p className={styles.sidebarLabel}>Suas Histórias</p>
            </div>

            {isLoading ? (
              <div className={styles.emptyList}><LoadingSpinner /></div>
            ) : (
              <>
                {/* Publicadas */}
                <div className={styles.sidebarGroupHeader}>
                  <p className={styles.sidebarGroupTitle}>
                    Public Stories{' '}
                    <span className={styles.sidebarGroupCount}>({published.length})</span>
                  </p>
                </div>
                <ul className={styles.storyList}>
                  {published.map((f) => {
                    const isActive = f.id === selectedId;
                    return (
                      <li key={f.id} className={styles.storyListItem}>
                        <button
                          className={`${styles.storyItem} ${isActive ? styles.storyItemActive : ''}`}
                          onClick={() => handleSelect(f)}
                        >
                          <span className={`${styles.storyDot} ${isActive ? styles.storyDotActive : ''}`} />
                          <div className={styles.storyItemBody}>
                            <p className={`${styles.storyItemTitle} ${isActive ? styles.storyItemTitleActive : ''}`}>{f.title}</p>
                            <p className={styles.storyItemStatus}>Publicado</p>
                          </div>
                          <span className={styles.storyItemIcon}><IconBookOpen /></span>
                        </button>
                        <Link
                          to={`/fanfic/${f.id}`}
                          className={styles.storyViewLink}
                          title="Ver página da história"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <IconEye />
                        </Link>
                      </li>
                    );
                  })}
                  {published.length === 0 && (
                    <li className={styles.emptyList}>Nenhuma história publicada.</li>
                  )}
                </ul>

                {/* Rascunhos */}
                <div className={`${styles.sidebarGroupHeader} ${styles.sidebarGroupBorderTop}`}>
                  <p className={styles.sidebarGroupTitle}>
                    Drafts{' '}
                    <span className={styles.sidebarGroupCount}>({drafts.length})</span>
                  </p>
                </div>
                <ul className={styles.storyList}>
                  {drafts.map((f) => {
                    const isActive = f.id === selectedId;
                    return (
                      <li key={f.id}>
                        <button
                          className={`${styles.storyItem} ${isActive ? styles.storyItemActive : ''}`}
                          onClick={() => handleSelect(f)}
                        >
                          <span className={`${styles.storyDot} ${isActive ? styles.storyDotActive : ''}`} />
                          <div className={styles.storyItemBody}>
                            <p className={`${styles.storyItemTitle} ${isActive ? styles.storyItemTitleActive : ''}`}>{f.title}</p>
                            <p className={styles.storyItemStatus}>Rascunho</p>
                          </div>
                          <span className={styles.storyItemIcon}><IconCloud /></span>
                        </button>
                      </li>
                    );
                  })}
                  {drafts.length === 0 && (
                    <li className={styles.emptyList}>Nenhum rascunho.</li>
                  )}
                </ul>
              </>
            )}

          </aside>

          {/* ── Painel principal ── */}
          <div className={styles.editorArea}>
            {!selectedFanfic ? (
              <div className={styles.noSelection}>
                <h1 className={styles.noSelectionHeading}>Minhas Histórias</h1>
                <p className={styles.noSelectionText}>Selecione uma história na lista ou crie uma nova.</p>
              </div>
            ) : (
              <div className={styles.editorInner}>
                <h1 className={styles.storyTitle}>{selectedFanfic.title}</h1>

                <div className={styles.tabBar}>
                  {TABS.map(({ key, label }) => (
                    <button
                      key={key}
                      className={`${styles.tabBtn} ${activeTab === key ? styles.tabActive : ''}`}
                      onClick={() => setActiveTab(key)}
                    >
                      {label}
                    </button>
                  ))}
                  <div style={{ flex: 1 }} />
                  <button
                    className={styles.deleteBtn}
                    onClick={handleDelete}
                    title="Excluir fanfic"
                  >
                    <IconTrash /> Excluir
                  </button>
                </div>

                <div className={styles.tabContent}>
                  {activeTab === 'info'     && <InfoTab      key={`info-${selectedFanfic.id}`} fanfic={selectedFanfic} onUpdated={handleFanficUpdated} />}
                  {activeTab === 'chapters' && <ChaptersTab  key={`ch-${selectedFanfic.id}`}   fanfic={selectedFanfic} />}
                  {activeTab === 'questions'&& <QuestionsTab key={`q-${selectedFanfic.id}`}    fanfic={selectedFanfic} onFanficUpdated={handleFanficUpdated} />}
                  {activeTab === 'comments' && <CommentsTab  key={`c-${selectedFanfic.id}`}    fanfic={selectedFanfic} />}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {showNewModal && (
        <NewFanficModal
          isOpen
          onClose={() => setShowNewModal(false)}
          onCreated={handleFanficCreated}
        />
      )}
    </PageLayout>
  );
}
