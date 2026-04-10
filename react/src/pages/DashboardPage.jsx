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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fanficApi, chapterApi, interactiveApi, commentApi, tagApi, profileApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { formatTimestamp } from '../utils/formatters';
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
          const result = await fanficApi.uploadCover(coverFile);
          if (result?.cover_url) {
            await fanficApi.update(fanfic.id, { cover_url: result.cover_url });
          }
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
            <input type="file" id="new-cover-upload" accept="image/*" onChange={handleCoverChange} style={{ display: 'none' }} />
            <label htmlFor="new-cover-upload">
              <Button variant="secondary" as="span" size="sm">Escolher Capa</Button>
            </label>
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
  const [title, setTitle] = useState(fanfic.title);
  const [category, setCategory] = useState(fanfic.category);
  const [interactiveMode, setInteractiveMode] = useState(fanfic.interactive_mode);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  // Usado para checar perguntas antes de publicar (usa cache do React Query)
  const { data: questions = [] } = useQuery({
    queryKey: ['dash-questions', fanfic.id],
    queryFn: () => interactiveApi.getQuestions(fanfic.id),
  });
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const synopsisRef = useRef(null);
  const disclaimerRef = useRef(null);

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
        interactive_mode: interactiveMode,
      });

      if (coverFile) {
        try {
          const result = await fanficApi.uploadCover(coverFile);
          if (result?.cover_url) {
            await fanficApi.update(fanfic.id, { cover_url: result.cover_url });
            updated.cover_url = result.cover_url;
          }
        } catch {
          toast.error('Dados salvos, mas a capa falhou.');
        }
      }

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

      <div className={styles.formGroup}>
        <label className={styles.checkboxGroup}>
          <input type="checkbox" checked={interactiveMode} onChange={(e) => setInteractiveMode(e.target.checked)} />
          Modo Interativo
          {interactiveMode && <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 400 }}>
            — Use a aba "Perguntas" para criar variáveis.
          </span>}
        </label>
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
            <input type="file" id={`cover-${fanfic.id}`} accept="image/*" onChange={handleCoverChange} style={{ display: 'none' }} />
            <label htmlFor={`cover-${fanfic.id}`}>
              <Button variant="secondary" as="span" size="sm">Escolher Nova Capa</Button>
            </label>
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

  const { data: chapters = [], isLoading } = useQuery({
    queryKey: ['dash-chapters', fanfic.id],
    queryFn: () => chapterApi.getAll(fanfic.id),
  });

  const sorted = [...chapters].sort((a, b) => a.order - b.order);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['dash-chapters', fanfic.id] });

  const handleDelete = async (chapterId) => {
    if (!window.confirm('Excluir este capítulo? Esta ação não pode ser desfeita.')) return;
    try {
      await chapterApi.delete(chapterId);
      invalidate();
      toast.success('Capítulo excluído. Capítulos reordenados.');
    } catch (err) {
      toast.error(err.message || 'Erro ao excluir.');
    }
  };

  const handlePublish = async (chapterId) => {
    if (!window.confirm('Publicar este capítulo? Ele ficará visível para os leitores.')) return;
    try {
      await chapterApi.publish(chapterId);
      invalidate();
      toast.success('Capítulo publicado.');
    } catch (err) {
      toast.error(err.message || 'Erro ao publicar.');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const publishedChapters = sorted.filter((ch) => !ch.is_draft);

  return (
    <>
      {/* Cabeçalho */}
      <div className={styles.chaptersHeader}>
        <p className={styles.chaptersCount}>
          {publishedChapters.length} Published{' '}
          {publishedChapters.length === 1 ? 'Chapter' : 'Chapters'}
        </p>
        <Button size="sm" onClick={() => setChapterModal('new')}>+ Novo Capítulo</Button>
      </div>

      {sorted.length === 0 ? (
        <div className={styles.emptyState}>Nenhum capítulo ainda. Clique em "+ Novo Capítulo" para começar.</div>
      ) : (
        <>
          {/* Cabeçalho das colunas */}
          <div className={styles.chapterColHeader}>
            <span>{sorted[0]?.title ?? ''}</span>
            <span>Published Date</span>
            <span>Status</span>
            <span />
          </div>

          {/* Linhas */}
          <ul className={styles.chapterRows}>
            {sorted.map((ch) => (
              <li key={ch.id} className={styles.chapterRow}>
                <p className={styles.chapterRowTitle}>{ch.title}</p>
                <p className={styles.chapterRowDate}>
                  {ch.created_at ? formatTimestamp(ch.created_at) : '—'}
                </p>
                <p className={styles.chapterRowStatus}>
                  {ch.is_draft ? 'Draft' : 'Published'}
                </p>
                <div className={styles.chapterRowActions}>
                  {ch.is_draft && (
                    <button
                      className={styles.chapterActionBtn}
                      title="Publicar"
                      onClick={() => handlePublish(ch.id)}
                    >
                      <IconPublish />
                    </button>
                  )}
                  <button
                    className={styles.chapterActionBtn}
                    title="Mais opções"
                  >
                    <IconMoreVertical />
                  </button>
                  <button
                    className={styles.chapterActionBtn}
                    title="Editar"
                    onClick={() => setChapterModal(ch)}
                  >
                    <IconPencil />
                  </button>
                  <button
                    className={`${styles.chapterActionBtn} ${styles.chapterActionDanger}`}
                    title="Excluir"
                    onClick={() => handleDelete(ch.id)}
                  >
                    <IconTrash />
                  </button>
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

      {/* Capa do capítulo (opcional) */}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Imagem do Capítulo <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opcional)</span></label>
        <div className={styles.coverUpload}>
          {coverPreview
            ? <img src={coverPreview} alt="Pré-visualização" className={styles.coverPreview} />
            : <div className={styles.coverPlaceholder} style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>—</div>
          }
          <div>
            <input
              type="file"
              id={`ch-cover-${chapter?.id ?? 'new'}`}
              accept="image/*"
              onChange={handleCoverChange}
              style={{ display: 'none' }}
            />
            <label htmlFor={`ch-cover-${chapter?.id ?? 'new'}`}>
              <Button variant="secondary" as="span" size="sm">
                {coverPreview ? 'Trocar Imagem' : 'Adicionar Imagem'}
              </Button>
            </label>
            <p className={styles.formHint}>JPG, PNG, GIF, WEBP · Máx. 5MB</p>
          </div>
        </div>
      </div>

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

// ─── Aba: Perguntas / Variáveis ─────────────────────────────────────────
function QuestionsTab({ fanfic }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [questionModal, setQuestionModal] = useState(null); // null | question | 'new'
  const [selectedStdKey, setSelectedStdKey] = useState('');

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

  const handleAddStd = async () => {
    if (!selectedStdKey) return;
    const varDef = standardVars.find((v) => v.key === selectedStdKey);
    if (!varDef) return;
    try {
      await interactiveApi.createQuestion(fanfic.id, {
        question_text: varDef.label,
        placeholder: varDef.key,
        variable_type: 'standard',
        standard_key: varDef.key,
      });
      setSelectedStdKey('');
      invalidate();
      toast.success('Variável padrão adicionada!');
    } catch (err) {
      toast.error(err.message || 'Erro ao adicionar variável.');
    }
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
      <div className={styles.infoBox}>
        <strong>Como funciona:</strong> Declare aqui quais variáveis sua história usa.
        Use <code style={{ color: 'var(--tag-fandom-color)' }}>{'{{nome_da_variavel}}'}</code> nos capítulos.
        Antes de ler, o sistema pedirá ao leitor que preencha o que estiver faltando.
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
            <Button size="sm" onClick={handleAddStd} disabled={!selectedStdKey}>+ Adicionar</Button>
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
              </div>
              <div className={styles.questionCardActions}>
                {q.variable_type !== 'standard' && (
                  <Button variant="secondary" size="sm" onClick={() => setQuestionModal(q)} title="Editar variável"><IconPencil /></Button>
                )}
                <Button variant="danger" size="sm" onClick={() => handleDelete(q.id)} title="Remover variável"><IconTrash /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {questionModal !== null && (
        <QuestionModal
          fanficId={fanfic.id}
          question={questionModal === 'new' ? null : questionModal}
          onClose={() => setQuestionModal(null)}
          onSaved={() => { invalidate(); setQuestionModal(null); }}
        />
      )}
    </>
  );
}

// ─── Modal: Variável Customizada ────────────────────────────────────────
function QuestionModal({ fanficId, question, onClose, onSaved }) {
  const toast = useToast();
  const [text, setText] = useState(question?.question_text || '');
  const [placeholder, setPlaceholder] = useState(question?.placeholder || '');
  const [saving, setSaving] = useState(false);
  const isEdit = question !== null;

  const handleSave = async () => {
    if (!text.trim() || !placeholder.trim()) { toast.error('Preencha todos os campos.'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(placeholder)) {
      toast.error('Placeholder: apenas letras, números e underscores.');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await interactiveApi.updateQuestion(question.id, { question_text: text.trim() });
      } else {
        await interactiveApi.createQuestion(fanficId, {
          question_text: text.trim(),
          placeholder: placeholder.trim(),
          variable_type: 'custom',
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

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Editar Variável Customizada' : 'Nova Variável Customizada'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} isLoading={saving}>{isEdit ? 'Salvar' : 'Criar Variável'}</Button>
        </>
      }
    >
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Pergunta para o leitor</label>
        <input
          className={styles.formInput}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex: Qual o nome da sua espada mágica?"
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Nome da variável (placeholder)</label>
        <input
          className={styles.formInput}
          value={placeholder}
          onChange={(e) => setPlaceholder(e.target.value)}
          placeholder="Ex: espada_magica"
          readOnly={isEdit}
        />
        <p className={styles.formHint}>
          Apenas letras, números e underscores. Use no capítulo como <code style={{ color: 'var(--tag-fandom-color)' }}>{'{{'}{placeholder || 'variavel'}{'}}'}</code>
        </p>
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

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['dash-comments', fanfic.id] });

  const handleDelete = async (cId) => {
    if (!window.confirm('Excluir este comentário?')) return;
    try {
      await commentApi.delete(cId);
      invalidate();
      toast.success('Comentário excluído.');
    } catch (err) {
      toast.error(err.message || 'Erro ao excluir.');
    }
  };

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
          {group.items.map((c) => (
            <div key={c.id} className={styles.commentCard}>
              <div className={styles.commentCardContent}>
                <p className={styles.commentAuthor}>{c.username || 'Usuário'}</p>
                <p className={styles.commentDate}>{formatTimestamp(c.created_at)}</p>
                <p className={styles.commentText}>{c.content}</p>
              </div>
              <Button variant="danger" size="sm" onClick={() => handleDelete(c.id)} title="Excluir comentário"><IconTrash /></Button>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

// ─── Página Principal ────────────────────────────────────────────────────
const TABS = [
  { key: 'info', label: 'Informações' },
  { key: 'chapters', label: 'Capítulos' },
  { key: 'questions', label: 'Perguntas' },
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
                <span className={styles.noSelectionIcon}><IconPen /></span>
                <p className={styles.noSelectionTitle}>Selecione uma história</p>
                <p className={styles.noSelectionText}>Clique em uma história na lista ou crie uma nova.</p>
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
                  {activeTab === 'questions'&& <QuestionsTab key={`q-${selectedFanfic.id}`}    fanfic={selectedFanfic} />}
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
