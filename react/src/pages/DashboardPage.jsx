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
import { CATEGORIES, TAG_SUGGESTIONS, FANDOM_PAIRING_SUGGESTIONS } from '../constants';
import PageLayout from '../components/layout/PageLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import QuillEditor from '../components/editor/QuillEditor';
import styles from './DashboardPage.module.css';


// Remove HTML de dados legados do QuillEditor
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ─── TagInputWithSuggestions ───────────────────────────────────────────
function TagInputWithSuggestions({ tags, onAdd, onRemove, suggestions = [], placeholder = 'Digite e pressione Enter', maxTags, neutral = false, tagType }) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [dbSuggestions, setDbSuggestions] = useState([]);
  const wrapRef = useRef(null);

  const staticFiltered = value.length >= 3
    ? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()) && !tags.includes(s))
    : [];

  const allSuggestions = [...new Set([...staticFiltered, ...dbSuggestions.filter((s) => !tags.includes(s))])];

  // Busca sugestões do banco ao digitar 3+ chars
  useEffect(() => {
    if (value.length < 3 || !tagType) { setDbSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const results = await tagApi.search(value, tagType);
        setDbSuggestions((results || []).map((t) => t.name));
      } catch { setDbSuggestions([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [value, tagType]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed && (!maxTags || tags.length < maxTags) && !tags.includes(trimmed)) {
        onAdd(trimmed);
        setValue('');
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleSuggestionClick = (s) => {
    if (!maxTags || tags.length < maxTags) {
      onAdd(s);
      setValue('');
      setOpen(false);
    }
  };

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const chipClass = neutral ? styles.tagChipNeutral : styles.tagChip;
  const limitReached = maxTags != null && tags.length >= maxTags;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div className={styles.tagInputRow}>
        <input
          type="text"
          className={styles.formInput}
          value={value}
          onChange={(e) => { setValue(e.target.value); setOpen(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 3 && setOpen(true)}
          placeholder={limitReached ? `Máximo de ${maxTags} tags` : placeholder}
          disabled={limitReached}
        />
      </div>
      {open && allSuggestions.length > 0 && (
        <ul className={styles.tagSuggestions}>
          {allSuggestions.slice(0, 8).map((s) => (
            <li key={s} className={styles.tagSuggestionItem} onMouseDown={() => handleSuggestionClick(s)}>
              {s}
            </li>
          ))}
        </ul>
      )}
      {tags.length > 0 && (
        <div className={styles.tagChips}>
          {tags.map((t, i) => (
            <span key={i} className={chipClass}>
              {t}
              <button type="button" className={styles.tagChipRemove} onClick={() => onRemove(i)}>×</button>
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
  const synopsisRef = useRef(null);

  const handleSubmit = async () => {
    const synopsis = synopsisRef.current?.getContent() || '';
    if (!title.trim() || !category || !synopsis) {
      toast.error('Preencha título, categoria e sinopse.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fanfic = await fanficApi.create({
        title: title.trim(),
        category,
        synopsis,
        interactive_mode: interactiveMode,
        is_draft: true,
      });

      toast.success('Rascunho criado!');
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
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>Salvar</Button>
        </>
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
        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
          <label className={styles.formLabel}>Categoria *</label>
          <select className={styles.formInput} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Selecione...</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className={styles.formGroup} style={{ justifyContent: 'flex-end', marginBottom: 0 }}>
          <label className={styles.checkboxGroup}>
            <input type="checkbox" checked={interactiveMode} onChange={(e) => setInteractiveMode(e.target.checked)} />
            Modo Interativo
          </label>
        </div>
      </div>
    </Modal>
  );
}

// ─── Design tokens v3 ────────────────────────────────────────────────────
const D = {
  paper: '#fbf3e2', paperAlt: '#f5e9d0', surface: '#fffbf3',
  ink: '#1f1610', inkSoft: '#4d3f30', inkMute: '#8c7a62',
  border: '#e7d8b8', borderStrong: '#d2bd92',
  brick: '#d24a2e', brickDeep: '#a23320', brickSoft: '#fad6cc', brickBg: '#fce8df',
  moss: '#5a8038', mossBg: '#ecf2da', mossSoft: '#d6e0b9',
  mustard: '#e0a428', mustardBg: '#fcefc7', mustardSoft: '#f5dfa3',
  plum: '#6e2c52', plumBg: '#f7e0eb',
  sky: '#3a8aa8', skyBg: '#daeef5', skySoft: '#aad4e8',
};

const CAT_DB = {
  romance:  { bg: '#d24a2e', fg: '#fce8df', label: 'Romance' },
  drama:    { bg: '#6e2c52', fg: '#f7e0eb', label: 'Drama' },
  fantasia: { bg: '#3a6049', fg: '#d6e0b9', label: 'Fantasia' },
  aventura: { bg: '#a25620', fg: '#f7e0c8', label: 'Aventura' },
  comedia:  { bg: '#e0a428', fg: '#2a1a00', label: 'Comédia' },
  misterio: { bg: '#3a3548', fg: '#b8b0c8', label: 'Mistério' },
  scifi:    { bg: '#2a3a58', fg: '#b8c8e8', label: 'Sci-Fi' },
  terror:   { bg: '#26201d', fg: '#d8b0a8', label: 'Terror' },
  kdrama:   { bg: '#7e4862', fg: '#fad6cc', label: 'K-Drama' },
  kpop:     { bg: '#5a3868', fg: '#f5d0c5', label: 'K-pop' },
  hp:       { bg: '#3a4a72', fg: '#e0d0a0', label: 'Hogwarts' },
  lotr:     { bg: '#4a4528', fg: '#dec070', label: 'Terra-Média' },
  default:  { bg: '#4d3f30', fg: '#f5e9cf', label: '' },
};
function getCatDB(cat) {
  const k = (cat || '').toLowerCase().replace(/[^a-z]/g, '');
  return CAT_DB[k] || CAT_DB.default;
}

function MiniCoverDB({ title, category, interactive, status, size = 'md', coverUrl }) {
  const c = getCatDB(category);
  const isSm = size === 'sm';
  const [imgErr, setImgErr] = useState(false);
  return (
    <div style={{ width: '100%', aspectRatio: '2/3', background: c.bg, position: 'relative', overflow: 'hidden', borderRadius: 6, boxShadow: '0 1px 2px rgba(80,40,15,.05), 0 4px 12px rgba(80,40,15,.07)' }}>
      {coverUrl && !imgErr
        ? <img src={coverUrl} alt={title} onError={() => setImgErr(true)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <>
            <div style={{ position: 'absolute', top: isSm ? 6 : 10, left: 0, right: 0, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: isSm ? 6 : 8, letterSpacing: 2, textTransform: 'uppercase', color: c.fg, opacity: 0.8 }}>{c.label}</div>
            <div style={{ position: 'absolute', bottom: '20%', left: isSm ? 6 : 10, right: isSm ? 6 : 10, textAlign: 'center', fontFamily: "'Fraunces', Georgia, serif", fontSize: isSm ? 10 : 14, lineHeight: 1.1, color: c.fg, fontWeight: 400, letterSpacing: -0.3 }}>{title}</div>
            {status && <div style={{ position: 'absolute', bottom: 5, left: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 6, letterSpacing: 1, textTransform: 'uppercase', color: c.fg, opacity: 0.7 }}>{status}</div>}
            {interactive && <div style={{ position: 'absolute', top: 6, right: 6, background: D.brick, color: '#fffbf3', padding: '2px 5px', borderRadius: 3, fontFamily: 'Inter', fontSize: 7, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>✦ Inter</div>}
          </>
      }
    </div>
  );
}

function CoverBox({ title, category, interactive, status, width = 110, coverUrl }) {
  return <div style={{ width, flexShrink: 0 }}><MiniCoverDB title={title} category={category} interactive={interactive} status={status} size="sm" coverUrl={coverUrl}/></div>;
}

// ─── Helpers de campo (v3) ─────────────────────────────────────────────────
const inputSt = { width: '100%', padding: '11px 14px', border: `1px solid ${D.border}`, background: D.surface, color: D.ink, fontFamily: 'Inter', fontSize: 14, borderRadius: 6, outline: 'none', boxSizing: 'border-box' };
const labelSt = { display: 'block', fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: D.ink, marginBottom: 6 };
const hintSt  = { fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 12.5, color: D.inkMute, margin: '0 0 8px', lineHeight: 1.4 };

function DField({ label, hint, required, children }) {
  return (
    <div>
      <label style={labelSt}>{label}{required && <span style={{ color: D.brick }}> *</span>}</label>
      {hint && <p style={hintSt}>{hint}</p>}
      {children}
    </div>
  );
}

function DSectionHead({ children }) {
  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: D.brickDeep, fontWeight: 700, paddingBottom: 8, borderBottom: `1px solid ${D.border}`, marginTop: 8 }}>
      {children}
    </div>
  );
}

// ─── Aba: Info ─────────────────────────────────────────────────────────
function InfoTab({ fanfic, onUpdated }) {
  const toast = useToast();
  const [title, setTitle] = useState(fanfic.title);
  const [category, setCategory] = useState(fanfic.category);
  const [status, setStatus] = useState(
    fanfic.is_complete ? 'complete' : fanfic.is_hiatus ? 'hiatus' : 'ongoing'
  );
  const [hiatusDate, setHiatusDate] = useState(
    fanfic.hiatus_until ? fanfic.hiatus_until.slice(0, 10) : ''
  );
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverMode, setCoverMode] = useState(fanfic.cover_url ? 'upload' : 'generated');
  const [saving, setSaving] = useState(false);
  const coverInputRef = useRef(null);
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
        is_complete: status === 'complete',
        is_hiatus: status === 'hiatus',
        hiatus_until: status === 'hiatus' && hiatusDate
          ? new Date(hiatusDate + 'T00:00:00').toISOString()
          : null,
      });

      if (coverFile) {
        try {
          const result = await fanficApi.uploadCover(fanfic.id, coverFile);
          if (result?.cover_url) updated.cover_url = result.cover_url;
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

  const coverSrc = coverPreview || (fanfic.cover_url ? fanficApi.getAssetUrl(fanfic.cover_url) : null);

  return (
    <form onSubmit={handleSave}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 32, alignItems: 'flex-start' }}>

        {/* ── COLUNA PRINCIPAL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Campo de capa */}
          <DField label="Capa" hint="Tamanho ideal: 800×1200 (proporção 2:3). JPG ou PNG, até 5MB.">
            <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 6, padding: 18, display: 'grid', gridTemplateColumns: '152px 1fr', gap: 22, alignItems: 'flex-start' }}>
              {/* Preview */}
              <div style={{ width: 152 }}>
                {coverMode === 'upload' && coverSrc ? (
                  <div style={{ width: '100%', aspectRatio: '2/3', borderRadius: 6, backgroundImage: `url(${coverSrc})`, backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.15)', border: `1px solid ${D.border}` }} />
                ) : coverMode === 'empty' ? (
                  <div style={{ width: '100%', aspectRatio: '2/3', borderRadius: 6, background: D.paperAlt, border: `2px dashed ${D.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 12.5, color: D.inkMute, textAlign: 'center', padding: 12, lineHeight: 1.4, boxSizing: 'border-box' }}>
                    sem capa<br/><span style={{ fontSize: 11 }}>(usa cor da categoria)</span>
                  </div>
                ) : (
                  <MiniCoverDB title={fanfic.title} category={fanfic.category} interactive={fanfic.interactive_mode} coverUrl={coverSrc} />
                )}
              </div>
              {/* Controles */}
              <div>
                {/* Seletor de modo */}
                <div style={{ display: 'inline-flex', background: D.paperAlt, padding: 3, borderRadius: 999, border: `1px solid ${D.border}`, marginBottom: 14 }}>
                  {[{ v: 'generated', l: 'Gerada' }, { v: 'upload', l: 'Upload' }, { v: 'empty', l: 'Sem capa' }].map(o => (
                    <button key={o.v} type="button" onClick={() => setCoverMode(o.v)} style={{ padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', background: coverMode === o.v ? D.surface : 'transparent', boxShadow: coverMode === o.v ? '0 1px 3px rgba(0,0,0,.08)' : 'none', fontFamily: 'Inter', fontSize: 12.5, fontWeight: coverMode === o.v ? 600 : 500, color: coverMode === o.v ? D.brick : D.inkSoft }}>
                      {o.l}
                    </button>
                  ))}
                </div>
                {coverMode === 'generated' && (
                  <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 13, color: D.inkSoft, lineHeight: 1.5, margin: 0 }}>
                    Capa gerada automaticamente com a cor e o padrão da categoria. Bom pra começar — você pode trocar depois.
                  </p>
                )}
                {coverMode === 'upload' && !coverSrc && (
                  <button type="button" onClick={() => coverInputRef.current?.click()} style={{ width: '100%', padding: '22px 18px', borderRadius: 6, background: D.brickBg, border: `2px dashed ${D.brick}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontFamily: 'Inter', fontSize: 13, fontWeight: 500, color: D.brickDeep }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    Arraste uma imagem ou <u>escolha do computador</u>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: D.inkMute, fontWeight: 400, letterSpacing: 0.3 }}>JPG · PNG · 800×1200 ideal</span>
                  </button>
                )}
                {coverMode === 'upload' && coverSrc && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => coverInputRef.current?.click()} style={{ padding: '7px 14px', border: `1px solid ${D.border}`, borderRadius: 6, background: 'transparent', fontFamily: 'Inter', fontSize: 12.5, fontWeight: 500, color: D.ink, cursor: 'pointer' }}>Trocar imagem</button>
                    <button type="button" onClick={() => { setCoverPreview(null); setCoverMode('generated'); }} style={{ padding: '7px 14px', border: `1px solid ${D.border}`, borderRadius: 6, background: 'transparent', fontFamily: 'Inter', fontSize: 12.5, fontWeight: 500, color: D.brickDeep, cursor: 'pointer' }}>Remover</button>
                  </div>
                )}
                {coverMode === 'empty' && (
                  <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 13, color: D.inkSoft, lineHeight: 1.5, margin: 0 }}>
                    Sua fanfic vai aparecer com um placeholder na cor da categoria. Recomendamos adicionar uma capa antes de publicar.
                  </p>
                )}
                <input ref={coverInputRef} type="file" accept="image/*" onChange={(e) => { handleCoverChange(e); setCoverMode('upload'); }} style={{ display: 'none' }} />
              </div>
            </div>
          </DField>

          {/* Título */}
          <DField label="Título" required>
            <input style={inputSt} value={title} onChange={(e) => setTitle(e.target.value)} />
          </DField>

          {/* Categoria */}
          <DField label="Categoria" required>
            <div style={{ position: 'relative' }}>
              <select style={{ ...inputSt, appearance: 'none', cursor: 'pointer', paddingRight: 36 }} value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: D.inkMute }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          </DField>

          {/* Status */}
          <DField label="Status">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[{ v: 'ongoing', l: 'Em andamento' }, { v: 'complete', l: 'Completa' }, { v: 'hiatus', l: 'Em hiato' }].map(o => (
                <label key={o.v} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 6, cursor: 'pointer', background: status === o.v ? D.brickBg : D.surface, border: `1px solid ${status === o.v ? D.brick : D.border}`, fontFamily: 'Inter', fontSize: 13, fontWeight: 500, color: status === o.v ? D.brickDeep : D.ink }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${status === o.v ? D.brick : D.borderStrong}`, background: status === o.v ? D.brick : 'transparent', boxShadow: status === o.v ? `inset 0 0 0 2px ${D.brickBg}` : 'none', flexShrink: 0 }}/>
                  <input type="radio" name="status" checked={status === o.v} onChange={() => setStatus(o.v)} style={{ display: 'none' }}/>
                  {o.l}
                </label>
              ))}
            </div>
            {status === 'hiatus' && (
              <div style={{ marginTop: 12 }}>
                <label style={{ ...labelSt, fontSize: 12 }}>Data de retorno (opcional)</label>
                <input type="date" style={{ ...inputSt, maxWidth: 220 }} value={hiatusDate} onChange={(e) => setHiatusDate(e.target.value)} />
              </div>
            )}
          </DField>

          {/* Sinopse */}
          <DField label="Sinopse" required hint="O que aparece quando alguém clica na fanfic. Capricha — é o que vende.">
            <div style={{ border: `1px solid ${D.border}`, borderRadius: 6, overflow: 'hidden' }}>
              <QuillEditor key={`synopsis-${fanfic.id}`} ref={synopsisRef} initialValue={fanfic.synopsis || ''} placeholder="Sinopse da fanfic..." />
            </div>
          </DField>

          {/* Disclaimer */}
          <DField label="Disclaimer" hint="Nota da autora que aparece antes do primeiro capítulo. Avisos legais, dedicatórias, agradecimentos.">
            <div style={{ border: `1px solid ${D.border}`, borderRadius: 6, overflow: 'hidden' }}>
              <QuillEditor key={`disclaimer-${fanfic.id}`} ref={disclaimerRef} initialValue={fanfic.disclaimer || ''} placeholder="Avisos ou disclaimers (opcional)..." minHeight="100px" />
            </div>
          </DField>

          {/* Ações */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingTop: 4 }}>
            {!fanfic.is_draft && (
              <Link to={`/fanfic/${fanfic.id}`} style={{ padding: '10px 18px', border: `1px solid ${D.borderStrong}`, borderRadius: 6, fontFamily: 'Inter', fontSize: 13, fontWeight: 500, color: D.ink, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <IconEye /> Ver Fanfic
              </Link>
            )}
            <button type="submit" disabled={saving} style={{ padding: '10px 22px', background: D.brick, color: '#fffbf3', border: 'none', borderRadius: 6, fontFamily: 'Inter', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Salvando…' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        {/* ── STATUS PANEL ── */}
        <StatusPanel fanfic={fanfic} onUpdated={onUpdated} />
      </div>
    </form>
  );
}

// ─── Aba: Classificações ────────────────────────────────────────────────

function CopyTagsBtn({ tags }) {
  const toast = useToast();
  const handleCopy = () => {
    if (!tags.length) return;
    navigator.clipboard.writeText(tags.join(', ')).then(
      () => toast.success('Tags copiadas!'),
      () => toast.error('Erro ao copiar.'),
    );
  };
  return (
    <button type="button" className={styles.copyTagsBtn} onClick={handleCopy} title="Copiar tags" disabled={!tags.length}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      Copiar
    </button>
  );
}

function ClassificacoesTab({ fanfic, onUpdated }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [adultContent, setAdultContent] = useState(fanfic.is_adult_content || false);
  // trigger_warnings agora é lista de tags (legado HTML → strip)
  const [twTags, setTwTags] = useState(() => {
    const raw = stripHtml(fanfic.trigger_warnings || '');
    return raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
  });
  const [tags, setTags] = useState({ fandom: [], pairing: [], subgenre: [], trope: [] });
  const [saving, setSaving] = useState(false);

  const { data: existingTags } = useQuery({
    queryKey: ['fanfic-tags', fanfic.id],
    queryFn: () => tagApi.getFanficTags(fanfic.id),
  });

  useEffect(() => {
    if (!existingTags) return;
    setTags({
      fandom:   existingTags.filter((t) => t.type === 'fandom').map((t) => t.name),
      pairing:  existingTags.filter((t) => t.type === 'pairing').map((t) => t.name),
      subgenre: existingTags.filter((t) => t.type === 'subgenre').map((t) => t.name),
      trope:    existingTags.filter((t) => t.type === 'trope').map((t) => t.name),
    });
  }, [existingTags]);

  const addTag = (type, name) => setTags((t) => ({ ...t, [type]: [...t[type], name] }));
  const removeTag = (type, idx) => setTags((t) => ({ ...t, [type]: t[type].filter((_, i) => i !== idx) }));

  // Sugestões de casais enriquecidas com ships do(s) fandom(s) selecionados
  const pairingSuggestions = [
    ...new Set([
      ...tags.fandom.flatMap((f) => FANDOM_PAIRING_SUGGESTIONS[f] ?? []),
      ...TAG_SUGGESTIONS.pairing,
    ]),
  ];

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await fanficApi.update(fanfic.id, {
        is_adult_content: adultContent,
        trigger_warnings: twTags.join(', '),
      });

      try {
        const oldTags = existingTags || [];
        const newTagNames = [
          ...tags.fandom.map((n) => ({ name: n, type: 'fandom' })),
          ...tags.pairing.map((n) => ({ name: n, type: 'pairing' })),
          ...tags.subgenre.map((n) => ({ name: n, type: 'subgenre' })),
          ...tags.trope.map((n) => ({ name: n, type: 'trope' })),
        ];
        const oldTagNames = oldTags.map((t) => t.name.toLowerCase());
        const newTagNamesLower = newTagNames.map((t) => t.name.toLowerCase());
        for (const old of oldTags) {
          if (!newTagNamesLower.includes(old.name.toLowerCase()))
            await tagApi.removeFromFanfic(fanfic.id, old.id).catch(() => {});
        }
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

      toast.success('Classificações salvas!');
      onUpdated(updated);
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 32, alignItems: 'flex-start' }}>

        {/* ── COLUNA PRINCIPAL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>

          <DSectionHead>Avisos de conteúdo</DSectionHead>

          {/* Adult content */}
          <DField label="Conteúdo Adulto (+18)">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${adultContent ? D.brick : D.borderStrong}`, background: adultContent ? D.brick : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .12s' }}>
                {adultContent && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fffbf3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <input type="checkbox" checked={adultContent} onChange={(e) => setAdultContent(e.target.checked)} style={{ display: 'none' }}/>
              <span style={{ fontFamily: 'Inter', fontSize: 13.5, color: D.inkSoft }}>Marque se sua história tem cenas explícitas (+18)</span>
            </label>
          </DField>

          {/* Trigger Warnings */}
          <DField label="Trigger Warnings" hint="Avisos sobre temas sensíveis. Leitoras filtram por isso — capricha.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <CopyTagsBtn tags={twTags} />
            </div>
            <TagInputWithSuggestions tags={twTags} onAdd={(v) => setTwTags((p) => [...p, v])} onRemove={(i) => setTwTags((p) => p.filter((_, idx) => idx !== i))} suggestions={TAG_SUGGESTIONS.triggerWarning} placeholder="Ex: Violência, Abuso..." neutral />
          </DField>

          <DSectionHead>Subgêneros</DSectionHead>

          <DField label="Subgêneros (máx. 3)">
            <TagInputWithSuggestions neutral tagType="subgenre" tags={tags.subgenre} onAdd={(v) => addTag('subgenre', v)} onRemove={(i) => removeTag('subgenre', i)} suggestions={TAG_SUGGESTIONS.subgenre} placeholder="Ex: Romance, Horror" maxTags={3} />
          </DField>

          <DSectionHead>Tags</DSectionHead>

          <DField label="Fandom">
            <TagInputWithSuggestions neutral tagType="fandom" tags={tags.fandom} onAdd={(v) => addTag('fandom', v)} onRemove={(i) => removeTag('fandom', i)} suggestions={TAG_SUGGESTIONS.fandom} placeholder="Ex: Harry Potter" maxTags={10} />
          </DField>

          <DField label={`Casais${tags.fandom.length > 0 ? ` — sugestões para ${tags.fandom[0]}` : ''}`}>
            <TagInputWithSuggestions neutral tagType="pairing" tags={tags.pairing} onAdd={(v) => addTag('pairing', v)} onRemove={(i) => removeTag('pairing', i)} suggestions={pairingSuggestions} placeholder="Ex: Naruto x Hinata, Harry x Hermione" maxTags={5} />
          </DField>

          <DField label="Tropes (máx. 8)">
            <TagInputWithSuggestions neutral tagType="trope" tags={tags.trope} onAdd={(v) => addTag('trope', v)} onRemove={(i) => removeTag('trope', i)} suggestions={TAG_SUGGESTIONS.trope} placeholder="Ex: Enemies to Lovers, Slow Burn" maxTags={8} />
          </DField>

          {/* Faixa etária */}
          <DSectionHead>Classificação etária</DSectionHead>

          <DField label="Faixa etária" required>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[{ v: false, l: 'Livre', d: 'Pra todas as idades' }, { v: true, l: '+18', d: 'Conteúdo adulto' }].map(r => (
                <div key={String(r.v)} onClick={() => setAdultContent(r.v)} style={{ padding: 14, borderRadius: 6, cursor: 'pointer', background: adultContent === r.v ? D.brickBg : D.surface, border: `2px solid ${adultContent === r.v ? D.brick : D.border}` }}>
                  <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 400, letterSpacing: -0.4, color: adultContent === r.v ? D.brick : D.ink, lineHeight: 1 }}>{r.l}</div>
                  <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 12, color: D.inkSoft, marginTop: 6 }}>{r.d}</div>
                </div>
              ))}
            </div>
          </DField>

          <div style={{ paddingTop: 4 }}>
            <button type="submit" disabled={saving} style={{ padding: '10px 22px', background: D.brick, color: '#fffbf3', border: 'none', borderRadius: 6, fontFamily: 'Inter', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Salvando…' : 'Salvar Classificações'}
            </button>
          </div>
        </div>

        {/* ── STATUS PANEL ── */}
        <StatusPanel fanfic={fanfic} onUpdated={onUpdated} />
      </div>
    </form>
  );
}

// ─── Painel lateral: Status ─────────────────────────────────────────────
function StatusPanel({ fanfic, onUpdated }) {
  const toast = useToast();
  const [publishing, setPublishing] = useState(false);

  const { data: chapters = [] } = useQuery({
    queryKey: ['dash-chapters', fanfic.id],
    queryFn: () => chapterApi.getAll(fanfic.id),
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['dash-questions', fanfic.id],
    queryFn: () => interactiveApi.getQuestions(fanfic.id),
  });

  const lastChapter = chapters.length > 0
    ? [...chapters].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))[0]
    : null;

  const handlePublish = async () => {
    if (fanfic.interactive_mode && questions.length === 0) {
      const proceed = window.confirm(
        'Esta história está em Modo Interativo, mas não tem nenhuma variável associada.\n\n' +
        'Leitores não poderão personalizar a experiência de leitura.\n\n' +
        'Deseja publicar mesmo assim?'
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

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  const mono = { fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', color: D.inkMute, fontWeight: 600, marginBottom: 4 };
  const val  = { fontFamily: 'Inter', fontSize: 13.5, color: D.ink, fontWeight: 500 };
  const sep  = { height: 1, background: D.border, margin: '16px 0' };

  return (
    <aside style={{ position: 'sticky', top: 24 }}>
      <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8, padding: 18 }}>
        <div style={mono}>Status</div>
        {(() => {
          const st = fanfic.is_draft ? 'Rascunho' : fanfic.is_complete ? 'Completa' : fanfic.is_hiatus ? 'Em hiato' : 'Em andamento';
          const bg = { Rascunho: D.brickBg, Completa: D.mossBg, 'Em hiato': D.paperAlt, 'Em andamento': D.mustardBg }[st];
          const fg = { Rascunho: D.brickDeep, Completa: D.moss, 'Em hiato': D.inkMute, 'Em andamento': '#7a5a14' }[st];
          const dot = { Rascunho: D.brick, Completa: D.moss, 'Em hiato': D.inkMute, 'Em andamento': D.mustard }[st];
          return (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: bg, color: fg, fontFamily: 'Inter', fontSize: 12, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }}/>
              {st}
            </div>
          );
        })()}

        <div style={sep}/>

        {!fanfic.is_draft && (
          <>
            <div style={mono}>Publicada em</div>
            <div style={val}>{fmtDate(fanfic.published_at)}</div>
            <div style={sep}/>
          </>
        )}

        <div style={mono}>Última alteração</div>
        <div style={val}>
          {lastChapter
            ? fmtDate(lastChapter.updated_at || lastChapter.created_at)
            : fmtDate(fanfic.updated_at)}
        </div>

        <div style={sep}/>

        {fanfic.is_draft ? (
          <button type="button" onClick={handlePublish} disabled={publishing} style={{ width: '100%', padding: '9px 14px', background: D.brick, color: '#fffbf3', border: 'none', borderRadius: 6, fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600, cursor: publishing ? 'not-allowed' : 'pointer', opacity: publishing ? 0.7 : 1 }}>
            {publishing ? 'Publicando…' : 'Publicar'}
          </button>
        ) : (
          <button type="button" onClick={handleUnpublish} disabled={publishing} style={{ width: '100%', padding: '9px 14px', background: 'transparent', color: D.inkSoft, border: `1px solid ${D.border}`, borderRadius: 6, fontFamily: 'Inter', fontSize: 12.5, fontWeight: 500, cursor: publishing ? 'not-allowed' : 'pointer', opacity: publishing ? 0.7 : 1 }}>
            {publishing ? 'Aguarde…' : 'Mover para Rascunho'}
          </button>
        )}
      </div>
    </aside>
  );
}

// ─── Aba: Capítulos ─────────────────────────────────────────────────────
function ChaptersTab({ fanfic, initialChapterId, onModalClose }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [chapterModal, setChapterModal] = useState(null); // null | chapter object | 'new'
  const [openMenuId, setOpenMenuId] = useState(null); // ID do capítulo com dropdown aberto

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    if (!openMenuId) return;
    const handler = () => setOpenMenuId(null);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId]);

  const { data: chapters = [], isLoading } = useQuery({
    queryKey: ['dash-chapters', fanfic.id],
    queryFn: () => chapterApi.getAll(fanfic.id),
  });

  // Abre o modal de edição direto quando vem de um link externo (ex: página do capítulo)
  useEffect(() => {
    if (!initialChapterId || chapters.length === 0 || chapterModal !== null) return;
    const target = chapters.find((c) => c.id === Number(initialChapterId));
    if (target) setChapterModal(target);
  }, [initialChapterId, chapters.length]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleCancelSchedule = async (chapterId) => {
    setOpenMenuId(null);
    try {
      await chapterApi.update(chapterId, { scheduled_at: null });
      invalidate();
      toast.success('Agendamento cancelado.');
    } catch (err) {
      toast.error(err.message || 'Erro ao cancelar agendamento.');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const publishedChapters = sorted.filter((ch) => !ch.is_draft);
  const drafts = sorted.filter((ch) => ch.is_draft);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'flex-start' }}>

        {/* ── SIDEBAR DE CAPÍTULOS ── */}
        <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8, overflow: 'hidden', position: 'sticky', top: 24 }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase', color: D.brick, fontWeight: 700 }}>
              {sorted.length} cap{sorted.length !== 1 ? 's' : ''} · {drafts.length} rascunho{drafts.length !== 1 ? 's' : ''}
            </div>
            <button onClick={() => setChapterModal('new')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: D.brick, padding: '4px 6px', borderRadius: 4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Novo
            </button>
          </div>

          {sorted.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 13.5, color: D.inkMute }}>
              Nenhum capítulo ainda.
            </div>
          ) : (
            sorted.map((ch, i) => (
              <div key={ch.id} onClick={() => setChapterModal(ch)} style={{ padding: '12px 14px', borderTop: i === 0 ? 'none' : `1px solid ${D.border}`, cursor: 'pointer', display: 'grid', gridTemplateColumns: '24px 1fr', gap: 10, alignItems: 'center', background: 'transparent', borderLeft: `3px solid transparent`, transition: 'background .12s' }}
                onMouseEnter={e => e.currentTarget.style.background = D.paperAlt}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: D.inkMute, letterSpacing: 0.4, textAlign: 'center', fontWeight: 600 }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 500, color: D.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ch.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: D.inkMute, letterSpacing: 0.3 }}>
                    {ch.is_draft ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: D.brick, fontWeight: 600 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: D.brick }}/>rascunho
                      </span>
                    ) : ch.scheduled_at ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: D.mustard, fontWeight: 600 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: D.mustard }}/>agendado
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: D.moss }}/>publicado
                      </span>
                    )}
                    <span style={{ color: D.borderStrong }}>·</span>
                    <span>{formatAbsoluteDate(ch.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── ÁREA PRINCIPAL ── */}
        <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8, overflow: 'hidden' }}>
          {/* Cabeçalho */}
          <div style={{ padding: '14px 22px', borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase', color: D.brick, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: D.moss }}/>
              {publishedChapters.length} publicado{publishedChapters.length !== 1 ? 's' : ''} · {drafts.length} rascunho{drafts.length !== 1 ? 's' : ''}
            </div>
            <button onClick={() => setChapterModal('new')} style={{ padding: '8px 16px', background: D.brick, color: '#fffbf3', border: 'none', borderRadius: 6, fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Novo capítulo
            </button>
          </div>

          {sorted.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 18, color: D.inkMute, margin: '0 0 16px' }}>
                Nenhum capítulo ainda.
              </p>
              <button onClick={() => setChapterModal('new')} style={{ padding: '10px 20px', background: D.brick, color: '#fffbf3', border: 'none', borderRadius: 6, fontFamily: 'Inter', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                + Novo Capítulo
              </button>
            </div>
          ) : (
            sorted.map((ch, i) => (
              <div key={ch.id} style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: 14, alignItems: 'center', padding: '14px 22px', borderTop: i === 0 ? 'none' : `1px solid ${D.border}`, background: 'transparent', transition: 'background .12s' }}
                onMouseEnter={e => e.currentTarget.style.background = D.paperAlt}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 26, color: D.inkMute, lineHeight: 1, letterSpacing: -0.6, textAlign: 'center' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 18, fontWeight: 400, letterSpacing: -0.3, color: D.ink, lineHeight: 1.15 }}>{ch.title}</span>
                    {ch.is_draft && <span style={{ padding: '2px 8px', borderRadius: 999, background: D.brickBg, color: D.brickDeep, fontFamily: 'Inter', fontSize: 10.5, fontWeight: 700 }}>rascunho</span>}
                    {ch.scheduled_at && <span style={{ padding: '2px 8px', borderRadius: 999, background: D.mustardBg, color: '#7a5a14', fontFamily: 'Inter', fontSize: 10.5, fontWeight: 700 }}>agendado</span>}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: D.inkMute, letterSpacing: 0.3 }}>
                    {ch.scheduled_at ? `Agendado · ${formatAbsoluteDate(ch.scheduled_at)}` : formatAbsoluteDate(ch.created_at)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {ch.is_draft && (
                    <button title="Publicar" onClick={(e) => { e.stopPropagation(); handlePublish(ch.id); }} style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${D.mossSoft}`, background: D.mossBg, color: D.moss, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconPublish />
                    </button>
                  )}
                  <button title="Editar" onClick={() => setChapterModal(ch)} style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${D.border}`, background: D.surface, color: D.inkSoft, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconPencil />
                  </button>
                  <Link to={`/chapter/${ch.id}`} title="Visualizar" style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${D.border}`, background: D.surface, color: D.inkSoft, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                    <IconEye />
                  </Link>
                  <div style={{ position: 'relative' }}>
                    <button title="Mais opções" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === ch.id ? null : ch.id); }} style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${D.border}`, background: D.surface, color: D.inkSoft, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconMoreVertical />
                    </button>
                    {openMenuId === ch.id && (
                      <div onMouseDown={e => e.stopPropagation()} style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 10, background: D.surface, border: `1px solid ${D.borderStrong}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,.12)', minWidth: 180, overflow: 'hidden' }}>
                        {!ch.is_draft && (
                          <button onClick={(e) => { e.stopPropagation(); handleUnpublish(ch.id); }} style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: `1px solid ${D.border}`, fontFamily: 'Inter', fontSize: 13, textAlign: 'left', color: D.ink, cursor: 'pointer' }}>
                            Salvar como Rascunho
                          </button>
                        )}
                        {ch.scheduled_at && (
                          <button onClick={(e) => { e.stopPropagation(); handleCancelSchedule(ch.id); }} style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: `1px solid ${D.border}`, fontFamily: 'Inter', fontSize: 13, textAlign: 'left', color: D.ink, cursor: 'pointer' }}>
                            Cancelar agendamento
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(ch.id); }} style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', fontFamily: 'Inter', fontSize: 13, textAlign: 'left', color: D.brickDeep, cursor: 'pointer', fontWeight: 600 }}>
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {chapterModal !== null && (
        <ChapterModal
          fanficId={fanfic.id}
          chapter={chapterModal === 'new' ? null : chapterModal}
          onClose={() => { setChapterModal(null); onModalClose?.(); }}
          onSaved={() => { invalidate(); setChapterModal(null); onModalClose?.(); }}
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
  const [scheduleMode, setScheduleMode] = useState(!!chapter?.scheduled_at);
  const [scheduledAt, setScheduledAt] = useState(
    chapter?.scheduled_at ? chapter.scheduled_at.slice(0, 16) : ''
  );
  const [saving, setSaving] = useState(false);
  const contentRef = useRef(null);
  const isEdit = chapter !== null;

  const handleSave = async () => {
    const content = contentRef.current?.getContent() || '';
    if (!title.trim() || contentRef.current?.isEmpty()) {
      toast.error('Preencha título e conteúdo.');
      return;
    }
    setSaving(true);
    try {
      const payload = { title: title.trim(), content, is_draft: isDraft };
      if (scheduleMode && scheduledAt) {
        payload.is_draft = true;
        payload.scheduled_at = new Date(scheduledAt).toISOString();
      } else {
        payload.scheduled_at = null;
      }

      if (isEdit) {
        await chapterApi.update(chapter.id, payload);
      } else {
        await chapterApi.create(fanficId, payload);
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
        <input type="checkbox" checked={isDraft} onChange={(e) => setIsDraft(e.target.checked)} disabled={scheduleMode} />
        Salvar como Rascunho
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 400 }}>
          — Rascunhos não são visíveis para os leitores
        </span>
      </label>

      <label className={styles.checkboxGroup} style={{ marginTop: 'var(--space-3)' }}>
        <input type="checkbox" checked={scheduleMode} onChange={(e) => setScheduleMode(e.target.checked)} />
        Agendar publicação
      </label>
      {scheduleMode && (
        <div className={styles.formGroup} style={{ marginTop: 'var(--space-3)' }}>
          <label className={styles.formLabel}>Data e hora de publicação</label>
          <input
            type="datetime-local"
            className={styles.formInput}
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
          <p className={styles.formHint}>Máximo de 5 capítulos agendados por vez.</p>
        </div>
      )}
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28, alignItems: 'flex-start' }}>

        {/* ── COLUNA PRINCIPAL ── */}
        <div>
          {/* Toggle master */}
          <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8, padding: '18px 22px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: interactiveMode ? D.brick : D.paperAlt, color: interactiveMode ? '#fffbf3' : D.inkMute, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 400, letterSpacing: -0.4, color: D.ink, lineHeight: 1.1 }}>Modo Interativo</div>
                <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 13.5, color: D.inkSoft, marginTop: 4 }}>Permite personalizar a história com o nome e dados da leitora.</div>
              </div>
            </div>
            <button type="button" onClick={() => handleToggleMode(!interactiveMode)} disabled={togglingMode} style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: togglingMode ? 'not-allowed' : 'pointer', background: interactiveMode ? D.brick : D.borderStrong, position: 'relative', flexShrink: 0, transition: 'background .15s' }}>
              <span style={{ position: 'absolute', top: 3, left: interactiveMode ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fffbf3', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .15s' }}/>
            </button>
          </div>

          {interactiveMode && (
            <>
              {/* Callout explicação */}
              <div style={{ background: D.skyBg, border: `1px solid ${D.skySoft}`, borderRadius: 8, padding: '16px 20px', marginBottom: 22, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={D.sky} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <div>
                  <div style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: D.sky, marginBottom: 4 }}>Como funciona</div>
                  <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 13.5, color: D.inkSoft, lineHeight: 1.55 }}>
                    Declare aqui quais variáveis sua história usa. Use{' '}
                    <code style={{ fontFamily: "'JetBrains Mono', monospace", fontStyle: 'normal', fontSize: 12, background: D.surface, padding: '1px 6px', borderRadius: 3, color: D.brickDeep, border: `1px solid ${D.skySoft}` }}>
                      {'{{nome_da_variavel}}'}
                    </code>{' '}
                    nos capítulos. Antes de ler, o sistema pedirá que a leitora preencha os dados. A <b style={{ color: D.ink, fontStyle: 'normal' }}>resposta padrão</b> é usada no modo normal de leitura.
                  </div>
                </div>
              </div>

              {/* Ações de adicionar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '14px 16px', background: D.paperAlt, border: `1px solid ${D.border}`, borderRadius: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: D.ink, whiteSpace: 'nowrap' }}>Variável padrão:</span>
                {availableStdVars.length > 0 ? (
                  <>
                    <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                      <select style={{ ...inputSt, appearance: 'none', cursor: 'pointer', paddingRight: 32 }} value={selectedStdKey} onChange={(e) => setSelectedStdKey(e.target.value)}>
                        <option value="">Selecione…</option>
                        {availableStdVars.map((v) => <option key={v.key} value={v.key}>{v.label} ({`{{${v.key}}}`})</option>)}
                      </select>
                      <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: D.inkMute }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
                      </div>
                    </div>
                    <button onClick={handleAddStdClick} disabled={!selectedStdKey} style={{ padding: '9px 16px', background: D.brick, color: '#fffbf3', border: 'none', borderRadius: 6, fontFamily: 'Inter', fontSize: 13, fontWeight: 600, cursor: selectedStdKey ? 'pointer' : 'not-allowed', opacity: selectedStdKey ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Adicionar
                    </button>
                  </>
                ) : (
                  <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 13, color: D.inkMute }}>Todas as variáveis padrão já adicionadas.</span>
                )}
                <button onClick={() => setQuestionModal('new')} style={{ padding: '9px 16px', background: 'transparent', color: D.ink, border: `1px solid ${D.border}`, borderRadius: 6, fontFamily: 'Inter', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Variável Customizada
                </button>
              </div>

              {/* Lista de variáveis */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {questions.length === 0 ? (
                  <div style={{ padding: '32px 24px', textAlign: 'center', background: D.paperAlt, borderRadius: 8, border: `2px dashed ${D.borderStrong}` }}>
                    <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 15, color: D.inkMute, margin: 0 }}>
                      Nenhuma variável ainda. Adicione uma acima.
                    </p>
                  </div>
                ) : questions.map((q) => (
                  <div key={q.id} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 16, alignItems: 'center' }}>
                      {/* Badge + type */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 700, padding: '4px 9px', borderRadius: 4, background: q.variable_type === 'standard' ? D.skyBg : D.brickBg, color: q.variable_type === 'standard' ? D.sky : D.brickDeep, border: `1px solid ${q.variable_type === 'standard' ? D.skySoft : D.brickSoft}` }}>
                          {q.variable_type === 'standard' ? 'padrão' : 'custom'}
                        </span>
                      </div>
                      {/* Info */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: 'Inter', fontSize: 14.5, fontWeight: 600, color: D.ink, marginBottom: 3 }}>{q.question_text}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', fontFamily: 'Inter', fontSize: 12, color: D.inkSoft }}>
                          <span>Placeholder: <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: D.sky, fontWeight: 600 }}>{`{{${q.placeholder}}}`}</code></span>
                          <span style={{ color: D.borderStrong }}>·</span>
                          <span>Padrão: {q.default_answer
                            ? <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: D.brickDeep, fontWeight: 600, background: D.brickBg, padding: '1px 7px', borderRadius: 3 }}>{q.default_answer}</code>
                            : <span style={{ color: D.mustard, fontWeight: 600 }}>não definido</span>}
                          </span>
                        </div>
                      </div>
                      {/* Ações */}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setQuestionModal(q)} style={{ width: 34, height: 34, borderRadius: 6, background: D.skyBg, color: D.sky, border: `1px solid ${D.skySoft}`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Editar">
                          <IconPencil />
                        </button>
                        <button onClick={() => handleDelete(q.id)} style={{ width: 34, height: 34, borderRadius: 6, background: D.brickBg, color: D.brickDeep, border: `1px solid ${D.brickSoft}`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Excluir">
                          <IconTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* CTA criar custom */}
                <button onClick={() => setQuestionModal('new')} style={{ padding: 14, borderRadius: 8, background: 'transparent', border: `2px dashed ${D.borderStrong}`, cursor: 'pointer', fontFamily: 'Inter', fontSize: 13, fontWeight: 500, color: D.inkSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Criar variável customizada
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── PREVIEW: como a leitora vê ── */}
        <aside style={{ position: 'sticky', top: 24 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: D.brickDeep, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconEye /> Como a leitora vê
          </div>
          {/* Mockup de browser */}
          <div style={{ background: D.ink, padding: 8, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,.2)' }}>
            <div style={{ background: D.paper, borderRadius: 10, overflow: 'hidden', maxHeight: 600, display: 'flex', flexDirection: 'column' }}>
              {/* Barra do browser */}
              <div style={{ padding: '8px 12px', background: D.paperAlt, borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                {[D.mustard, D.moss, D.brick].map((c) => (
                  <span key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.5 }}/>
                ))}
                <span style={{ flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: D.inkMute, textAlign: 'center', letterSpacing: 0.5 }}>
                  ficverse / {(fanfic.title || 'historia').toLowerCase().replace(/\s+/g, '-').slice(0, 24)}
                </span>
              </div>
              {/* Conteúdo do formulário */}
              <div style={{ padding: '20px 18px', overflowY: 'auto', flex: 1 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', color: D.brick, fontWeight: 700, marginBottom: 6 }}>Antes de começar</div>
                <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 400, letterSpacing: -0.5, margin: '0 0 6px', color: D.ink, lineHeight: 1.1 }}>
                  Personalize sua <span style={{ fontStyle: 'italic', color: D.brick }}>{fanfic.title?.split(' ')[0] || 'história'}</span>.
                </h3>
                <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 12.5, color: D.inkSoft, margin: '0 0 16px', lineHeight: 1.5 }}>
                  Responda o que quiser. O que ficar em branco usa a resposta padrão.
                </p>
                {!interactiveMode || questions.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', background: D.paperAlt, borderRadius: 8, fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 12.5, color: D.inkMute }}>
                    Nenhuma variável ainda. Adicione uma e ela aparece aqui.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {questions.map((q) => (
                      <div key={q.id}>
                        <label style={{ display: 'block', fontFamily: 'Inter', fontSize: 11.5, fontWeight: 600, color: D.ink, marginBottom: 4 }}>
                          {q.question_text}
                        </label>
                        <input readOnly placeholder={q.default_answer || '—'} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${D.border}`, background: D.surface, borderRadius: 4, outline: 'none', fontFamily: 'Inter', fontSize: 12, color: D.inkSoft, boxSizing: 'border-box' }}/>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: D.inkMute, marginTop: 3, letterSpacing: 0.3 }}>
                          padrão: <span style={{ color: D.brickDeep, fontWeight: 600 }}>{q.default_answer || '—'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
                  <button style={{ flex: 1, padding: '10px 14px', borderRadius: 6, background: 'transparent', border: `1px solid ${D.borderStrong}`, fontFamily: 'Inter', fontSize: 12, fontWeight: 500, color: D.inkSoft, cursor: 'pointer' }}>Pular tudo</button>
                  <button style={{ flex: 1.4, padding: '10px 14px', borderRadius: 6, background: D.brick, border: `1px solid ${D.brick}`, fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: '#fffbf3', cursor: 'pointer' }}>Começar a ler →</button>
                </div>
              </div>
            </div>
          </div>
          <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 12, color: D.inkMute, lineHeight: 1.5, margin: '14px 4px 0' }}>
            Esse é o formulário que aparece pra leitora antes do primeiro capítulo. Ela pode pular e usar as respostas padrão.
          </p>
        </aside>
      </div>

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
  const [placeholderError, setPlaceholderError] = useState('');

  const handleSave = async () => {
    if (!isPendingStd && !isStandard && (!text.trim() || !placeholder.trim())) {
      toast.error('Preencha todos os campos.');
      return;
    }
    if (!isEdit && !isPendingStd && !/^[a-z0-9_-]+$/.test(placeholder)) {
      setPlaceholderError(
        'Nome de variável inválido. Use apenas letras minúsculas (a-z), números (0-9), hífen (-) e underscore (_). Espaços e acentos não são permitidos.'
      );
      return;
    }
    setPlaceholderError('');
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
            onChange={(e) => {
              setPlaceholder(e.target.value.replace(/[^a-z0-9_-]/g, '').toLowerCase());
              setPlaceholderError('');
            }}
            placeholder="Ex: espada_magica"
          />
          {placeholderError ? (
            <p className={styles.formHint} style={{ color: '#e11d48', fontWeight: 600 }}>{placeholderError}</p>
          ) : (
            <p className={styles.formHint}>
              Apenas letras minúsculas, números, hífen e underscore. Sem espaços ou acentos. Use no capítulo como <code style={{ color: 'var(--tag-fandom-color)' }}>{'{{'}{placeholder || 'variavel'}{'}}'}</code>
            </p>
          )}
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

  const { data: comments = [], isLoading: loadingC } = useQuery({
    queryKey: ['dash-comments', fanfic.id],
    queryFn: () => commentApi.getFanficComments(fanfic.id),
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ['dash-chapters', fanfic.id],
    queryFn: () => chapterApi.getAll(fanfic.id),
  });

  if (loadingC) return <LoadingSpinner />;

  const allComments = comments;
  const total = allComments.length;

  const chapterOf = (c) => {
    if (!c.chapter_id) return null;
    const ch = chapters.find((x) => x.id === c.chapter_id);
    return ch ? `Cap. ${ch.order}: ${ch.title}` : null;
  };

  const palette = ['#d24a2e', '#5a8038', '#e0a428', '#6e2c52', '#3a8aa8'];
  const avatarColor = (name) => palette[(name || '').charCodeAt(0) % palette.length];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 32 }}>

      {/* ── LISTA DE COMENTÁRIOS ── */}
      <div>
        <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 30, fontWeight: 400, letterSpacing: -0.8, margin: '0 0 18px', color: D.ink }}>
          {total} comentário{total !== 1 ? 's' : ''} nesta obra
        </h2>

        {total === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', background: D.paperAlt, borderRadius: 8, border: `2px dashed ${D.borderStrong}` }}>
            <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 17, color: D.inkMute, margin: 0 }}>
              Nenhum comentário ainda.
            </p>
          </div>
        ) : (
          allComments.map((c, i) => {
            const u = c.user || {};
            const username = u.username || 'Usuário';
            const chLabel = chapterOf(c);
            return (
              <div key={c.id} style={{ display: 'flex', gap: 12, padding: '18px 0', borderTop: i === 0 ? 'none' : `1px solid ${D.border}` }}>
                {/* Avatar */}
                {u.avatar_url
                  ? <img src={u.avatar_url} alt={username} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}/>
                  : <div style={{ width: 40, height: 40, borderRadius: '50%', background: avatarColor(username), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 16, color: '#fffbf3', flexShrink: 0 }}>
                      {username[0]?.toUpperCase()}
                    </div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                    {u.id
                      ? <Link to={`/user/${u.id}`} style={{ fontFamily: 'Inter', fontSize: 13.5, fontWeight: 600, color: D.ink, textDecoration: 'none' }}>{username}</Link>
                      : <b style={{ fontFamily: 'Inter', fontSize: 13.5, fontWeight: 600 }}>{username}</b>
                    }
                    {chLabel && (
                      <span style={{ padding: '2px 8px', borderRadius: 999, background: D.brickBg, color: D.brickDeep, fontFamily: 'Inter', fontSize: 11, fontWeight: 600 }}>{chLabel}</span>
                    )}
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: D.inkMute, letterSpacing: 0.4 }}>{formatTimestamp(c.created_at)}</span>
                  </div>
                  <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 14.5, lineHeight: 1.55, color: D.inkSoft, margin: '0 0 10px' }}>{c.content}</p>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <button onClick={() => toast.info('Curtida em breve.')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, color: D.inkSoft }}>
                      <IconHeart /> Curtir
                    </button>
                    <button onClick={() => toast.info('Resposta em breve.')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, color: D.inkSoft }}>Responder</button>
                    <button onClick={() => toast.info('Denúncia em breve.')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, color: D.inkSoft }}>Reportar</button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── SIDEBAR: FILTROS ── */}
      <aside style={{ position: 'sticky', top: 24 }}>
        <div style={{ background: D.brickBg, border: `1px solid ${D.brickSoft}`, borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: D.brick, fontWeight: 700, marginBottom: 14 }}>
            Filtros
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Todos os capítulos', 'Não respondidos', 'Mais curtidos', 'Em escolhas'].map((f, i) => (
              <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Inter', fontSize: 13, color: i === 0 ? D.brick : D.ink, fontWeight: i === 0 ? 600 : 500, cursor: 'pointer' }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${i === 0 ? D.brick : D.borderStrong}`, background: i === 0 ? D.brick : 'transparent', boxShadow: i === 0 ? `inset 0 0 0 2px ${D.brickBg}` : 'none', flexShrink: 0 }}/>
                {f}
              </label>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

// ─── Página Principal ────────────────────────────────────────────────────
const TABS = [
  { key: 'info',            label: 'Informações',    icon: 'ℹ' },
  { key: 'classifications', label: 'Classificações', icon: '🏷' },
  { key: 'chapters',        label: 'Capítulos',      icon: '📖' },
  { key: 'questions',       label: 'Modo Interativo',icon: '✦' },
  { key: 'comments',        label: 'Comentários',    icon: '💬' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filterStatus, setFilterStatus] = useState('todas');
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedFanficOverride, setSelectedFanficOverride] = useState(null);
  const [initialChapterId, setInitialChapterId] = useState(null);

  const { data: myFanfics = [], isLoading } = useQuery({
    queryKey: ['my-fanfics', user?.user_id],
    queryFn: () => fanficApi.getByAuthor(user.user_id, true),
    enabled: !!user?.user_id,
  });

  // Pré-seleciona fanfic via ?fanficId= (vindo da página de detalhes ou capítulo)
  // Suporta também ?tab= e ?chapterId= para abrir direto em um capítulo específico.
  // Se não há fanficId na URL (ex: clicou em "Minhas histórias"), limpa a seleção.
  useEffect(() => {
    const fanficId = searchParams.get('fanficId');
    if (!fanficId) {
      setSelectedId(null);
      setSelectedFanficOverride(null);
      return;
    }
    if (myFanfics.length > 0) {
      const target = myFanfics.find((f) => f.id === Number(fanficId));
      if (target) {
        setSelectedId(target.id);
        const tab = searchParams.get('tab');
        setActiveTab(TABS.some((t) => t.key === tab) ? tab : 'info');
        const chapterId = searchParams.get('chapterId');
        if (chapterId) setInitialChapterId(Number(chapterId));
      }
    }
  }, [myFanfics.length, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

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


  // ── derived state ──────────────────────────────────────────────────────
  const pubTabs = [
    { id: 'todas',     label: 'Todas',        items: myFanfics },
    { id: 'andamento', label: 'Em andamento', items: myFanfics.filter(f => !f.is_draft && !f.is_complete && !f.is_hiatus) },
    { id: 'completas', label: 'Completas',    items: myFanfics.filter(f => f.is_complete) },
    { id: 'hiato',     label: 'Em hiato',     items: myFanfics.filter(f => f.is_hiatus) },
    { id: 'rascunhos', label: 'Rascunhos',    items: myFanfics.filter(f => f.is_draft) },
  ];
  const visibleWorks = pubTabs.find(t => t.id === filterStatus)?.items ?? myFanfics;
  const totalChapters = myFanfics.reduce((a, f) => a + (f.chapter_count || 0), 0);
  const publishedCount = myFanfics.filter(f => !f.is_draft).length;

  return (
    <PageLayout fullWidth>
      {!selectedFanfic ? (

        /* ══ PUBLICATIONS VIEW — publications-v3 ══ */
        <div style={{ background: D.paper, minHeight: '100vh' }}>

          {/* HERO */}
          <div style={{ padding: '36px 40px 28px', background: D.brickBg, borderBottom: `1px solid ${D.brickSoft}`, position: 'relative', overflow: 'hidden' }}>
            <svg style={{ position: 'absolute', bottom: -30, right: 60, width: 240, height: 350, opacity: 0.22, pointerEvents: 'none' }} viewBox="0 0 100 150">
              <g stroke={D.brick} strokeWidth="0.7" fill="none">
                <path d="M10 0 Q30 30 20 60 Q10 90 30 120 Q50 135 40 150"/>
                <path d="M70 0 Q60 40 80 70 Q90 100 70 130"/>
                <circle cx="22" cy="45" r="2" fill={D.brick}/>
                <circle cx="25" cy="90" r="1.5" fill={D.brick}/>
                <circle cx="76" cy="55" r="2" fill={D.brick}/>
                <circle cx="82" cy="115" r="1.5" fill={D.brick}/>
              </g>
            </svg>
            <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32 }}>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: D.brickDeep, fontWeight: 700, marginBottom: 10 }}>
                  Minhas publicações · {publishedCount} obra{publishedCount !== 1 ? 's' : ''}
                </div>
                <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 'clamp(36px,4vw,52px)', fontWeight: 400, letterSpacing: -1.4, margin: '0 0 12px', color: D.ink, lineHeight: 1 }}>
                  Sua <span style={{ fontStyle: 'italic', color: D.brick }}>oficina</span>.
                </h1>
                <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 17, color: D.brickDeep, margin: 0, lineHeight: 1.5, opacity: 0.9 }}>
                  Continue um capítulo. Comece uma fanfic nova. Reveja um rascunho.
                </p>
              </div>
              <button onClick={() => setShowNewModal(true)} style={{ padding: '12px 22px', background: D.brick, color: '#fffbf3', border: 'none', borderRadius: 8, fontFamily: 'Inter', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, whiteSpace: 'nowrap' }}>
                <IconPen /> Nova fanfic
              </button>
            </div>
          </div>

          <div style={{ padding: '32px 40px 80px', maxWidth: 1280, margin: '0 auto' }}>

            {/* STAT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
              {[
                { n: totalChapters,                                    l: 'capítulos publicados',    tone: D.brick,   Icon: IconBookOpen },
                { n: publishedCount,                                   l: 'obras publicadas',        tone: D.moss,    Icon: IconBookOpen },
                { n: myFanfics.filter(f => f.is_draft).length,        l: 'rascunhos',               tone: D.mustard, Icon: IconCloud },
                { n: myFanfics.filter(f => f.interactive_mode).length,l: 'histórias interativas',   tone: D.plum,    Icon: IconPen },
              ].map(s => (
                <div key={s.l} style={{ background: D.surface, border: `1px solid ${D.border}`, padding: '20px 22px', borderRadius: 8, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.12, color: s.tone }}>
                    <s.Icon />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 36, fontWeight: 400, color: s.tone, fontStyle: 'italic', lineHeight: 1, letterSpacing: -0.6 }}>{s.n}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', color: D.inkMute, marginTop: 8, fontWeight: 600 }}>{s.l}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* FILTER TABS */}
            <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${D.border}`, marginBottom: 24 }}>
              {pubTabs.map(t => (
                <button key={t.id} onClick={() => setFilterStatus(t.id)} style={{ padding: '12px 18px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 13.5, fontWeight: filterStatus === t.id ? 600 : 500, color: filterStatus === t.id ? D.brick : D.inkSoft, borderBottom: filterStatus === t.id ? `2px solid ${D.brick}` : '2px solid transparent', marginBottom: -1, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {t.label}
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, padding: '2px 7px', borderRadius: 999, background: filterStatus === t.id ? D.brickBg : D.paperAlt, color: filterStatus === t.id ? D.brick : D.inkMute, fontWeight: 600, letterSpacing: 0.3 }}>
                    {t.items.length}
                  </span>
                </button>
              ))}
            </div>

            {/* WORK LIST */}
            {isLoading ? (
              <div style={{ padding: '48px', textAlign: 'center' }}><LoadingSpinner /></div>
            ) : visibleWorks.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center', background: D.paperAlt, borderRadius: 12, border: `2px dashed ${D.borderStrong}` }}>
                <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', color: D.inkMute, fontSize: 18, margin: '0 0 20px' }}>Nenhuma obra nesta categoria ainda.</p>
                <button onClick={() => setShowNewModal(true)} style={{ padding: '10px 20px', background: D.brick, color: '#fffbf3', border: 'none', borderRadius: 8, fontFamily: 'Inter', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  + Nova fanfic
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {visibleWorks.map(w => {
                  const status = w.is_draft ? 'Rascunho' : w.is_complete ? 'Completa' : w.is_hiatus ? 'Em hiato' : 'Em andamento';
                  const dotColor = { 'Em andamento': D.mustard, 'Completa': D.moss, 'Em hiato': D.inkMute, 'Rascunho': D.borderStrong }[status];
                  const lastCap = (w.chapter_count || 0) > 0 ? `Cap. ${w.chapter_count}` : 'Sem capítulos ainda';
                  return (
                    <div key={w.id} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8, padding: 18, display: 'grid', gridTemplateColumns: '110px 1fr auto', gap: 22, alignItems: 'center' }}>
                      <CoverBox title={w.title} category={w.category} interactive={w.interactive_mode} status={status} width={110} coverUrl={w.cover_url ? fanficApi.getAssetUrl(w.cover_url) : null} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                          <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 24, fontWeight: 400, letterSpacing: -0.5, margin: 0, color: D.ink, lineHeight: 1.1 }}>{w.title}</h3>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: 12, color: D.inkSoft, fontWeight: 500 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor }} />{status}
                          </span>
                          {w.interactive_mode && (
                            <span style={{ padding: '2px 8px', borderRadius: 999, background: D.mustardBg, color: '#7a5a14', fontFamily: 'Inter', fontSize: 10.5, fontWeight: 700 }}>✦ interativa</span>
                          )}
                          {w.is_draft && (
                            <span style={{ padding: '2px 8px', borderRadius: 999, background: D.brickBg, color: D.brickDeep, fontFamily: 'Inter', fontSize: 10.5, fontWeight: 700 }}>rascunho</span>
                          )}
                        </div>
                        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 13.5, color: D.brick, marginBottom: 12 }}>
                          Último: {lastCap}
                        </div>
                        <div style={{ display: 'flex', gap: 18, fontFamily: 'Inter', fontSize: 12.5, color: D.inkSoft, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <IconBookOpen /> <b>{w.chapter_count || 0}</b> cap{(w.chapter_count || 0) !== 1 ? 's' : ''} publicados
                          </span>
                          <span style={{ color: D.borderStrong }}>·</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            <b>{w.total_views ?? w.readers_count ?? '—'}</b> leitoras
                          </span>
                          <span style={{ color: D.borderStrong }}>·</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            <b>{w.total_comments ?? w.comments_count ?? '—'}</b> comentários
                          </span>
                          <span style={{ color: D.borderStrong }}>·</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: D.inkMute }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                            {w.updated_at ? new Date(w.updated_at).toLocaleDateString('pt-BR') : 'recente'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                        <button onClick={() => handleSelect(w)} style={{ padding: '10px 20px', background: D.brick, color: '#fffbf3', border: 'none', borderRadius: 8, fontFamily: 'Inter', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
                          <IconPencil /> Continuar
                        </button>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link to={`/fanfic/${w.id}`} style={{ padding: '7px 12px', border: `1px solid ${D.border}`, borderRadius: 6, fontFamily: 'Inter', fontSize: 12, fontWeight: 500, color: D.ink, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <IconEye /> Ver pública
                          </Link>
                          <button onClick={() => handleSelect(w)} style={{ padding: '7px 10px', border: `1px solid ${D.border}`, borderRadius: 6, background: 'transparent', cursor: 'pointer', color: D.inkMute, display: 'flex', alignItems: 'center' }}>
                            <IconMoreVertical />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CTA */}
            <div style={{ marginTop: 28, padding: '28px 32px', borderRadius: 8, background: D.paperAlt, border: `2px dashed ${D.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
              <div>
                <h4 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 24, fontWeight: 400, margin: '0 0 4px', color: D.ink, letterSpacing: -0.4 }}>
                  Tem uma <span style={{ fontStyle: 'italic', color: D.brick }}>ideia</span> nova?
                </h4>
                <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 14.5, color: D.inkSoft, margin: 0 }}>
                  Comece em branco ou a partir de um rascunho. Você pode publicar quando quiser.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                <Link to="/como-publicar" style={{ padding: '10px 18px', border: `1px solid ${D.borderStrong}`, borderRadius: 8, fontFamily: 'Inter', fontSize: 13, fontWeight: 500, color: D.ink, textDecoration: 'none' }}>
                  Importar de outro lugar
                </Link>
                <button onClick={() => setShowNewModal(true)} style={{ padding: '10px 20px', background: D.brick, color: '#fffbf3', border: 'none', borderRadius: 8, fontFamily: 'Inter', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconPen /> Nova fanfic
                </button>
              </div>
            </div>
          </div>
        </div>

      ) : (

        /* ══ EDITOR VIEW — editor-v3 ══ */
        <div style={{ background: D.paper, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

          {/* HEADER */}
          <div style={{ padding: '20px 36px', background: D.surface, borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, position: 'sticky', top: 0, zIndex: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                onClick={() => { setSelectedId(null); setSelectedFanficOverride(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.inkMute, display: 'flex', alignItems: 'center', padding: 6, borderRadius: 6 }}
                title="Voltar para publicações"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <div style={{ width: 56, flexShrink: 0 }}>
                <MiniCoverDB title={selectedFanfic.title} category={selectedFanfic.category} interactive={selectedFanfic.interactive_mode} size="sm" coverUrl={selectedFanfic.cover_url ? fanficApi.getAssetUrl(selectedFanfic.cover_url) : null} />
              </div>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: D.brick, fontWeight: 700 }}>
                  Editando · {selectedFanfic.is_draft ? 'rascunho' : `${selectedFanfic.chapter_count || 0} cap${(selectedFanfic.chapter_count || 0) !== 1 ? 's' : ''}`}
                </div>
                <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 28, fontWeight: 400, letterSpacing: -0.6, margin: '4px 0 0', color: D.ink, lineHeight: 1 }}>
                  <span style={{ fontStyle: 'italic' }}>{selectedFanfic.title}</span>
                </h1>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Link
                to={`/fanfic/${selectedFanfic.id}`}
                style={{ padding: '9px 18px', border: `1px solid ${D.borderStrong}`, borderRadius: 8, fontFamily: 'Inter', fontSize: 13, fontWeight: 500, color: D.ink, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7 }}
              >
                <IconEye /> Pré-visualizar
              </Link>
              <button
                onClick={handleDelete}
                style={{ padding: '9px 14px', border: `1px solid ${D.border}`, borderRadius: 8, fontFamily: 'Inter', fontSize: 13, fontWeight: 500, color: D.inkMute, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                title="Excluir fanfic"
              >
                <IconTrash /> Excluir
              </button>
            </div>
          </div>

          {/* TABS */}
          <div style={{ padding: '0 36px', borderBottom: `1px solid ${D.border}`, background: D.paper, display: 'flex', gap: 2 }}>
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{ padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 13.5, fontWeight: activeTab === key ? 600 : 500, color: activeTab === key ? D.brick : D.inkSoft, borderBottom: activeTab === key ? `2px solid ${D.brick}` : '2px solid transparent', marginBottom: -1, display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}
              >
                {label}
                {key === 'comments' && (selectedFanfic.total_comments || selectedFanfic.comments_count) ? (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: D.inkMute, letterSpacing: 0.3 }}>
                    · {selectedFanfic.total_comments ?? selectedFanfic.comments_count}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ padding: '32px 36px 80px', maxWidth: 1280, margin: '0 auto' }}>
              {activeTab === 'info'            && <InfoTab           key={`info-${selectedFanfic.id}`} fanfic={selectedFanfic} onUpdated={handleFanficUpdated} />}
              {activeTab === 'classifications' && <ClassificacoesTab key={`cls-${selectedFanfic.id}`}  fanfic={selectedFanfic} onUpdated={handleFanficUpdated} />}
              {activeTab === 'chapters'        && <ChaptersTab       key={`ch-${selectedFanfic.id}`}   fanfic={selectedFanfic} initialChapterId={initialChapterId} onModalClose={() => setSearchParams(p => { const n = new URLSearchParams(p); n.delete('chapterId'); return n; })} />}
              {activeTab === 'questions'       && <QuestionsTab      key={`q-${selectedFanfic.id}`}    fanfic={selectedFanfic} onFanficUpdated={handleFanficUpdated} />}
              {activeTab === 'comments'        && <CommentsTab       key={`c-${selectedFanfic.id}`}    fanfic={selectedFanfic} />}
            </div>
          </div>
        </div>
      )}

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
