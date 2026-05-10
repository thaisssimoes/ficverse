import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { fanficApi, chapterApi, interactiveApi, profileApi, tagApi, userApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import PageLayout from '../components/layout/PageLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import styles from './FanficDetailPage.module.css';

// ── Design tokens ────────────────────────────────────────────────────────
const FD = {
  paper: '#fbf3e2', paperAlt: '#f5e9d0', surface: '#fffbf3',
  ink: '#1f1610', inkSoft: '#5c4a38', inkMute: '#9c856e',
  border: '#e8d9c4', borderStrong: '#c8b49a',
  brick: '#d24a2e', brickBg: '#fce8df', brickDeep: '#9e3320',
  moss: '#5a8038', mossBg: '#e6f0db', mossSoft: '#c8e0b4',
  mustard: '#e0a428', mustardBg: '#fff5d6',
  plum: '#6e2c52', plumBg: '#f4d5e8',
};

const FD_CATS = {
  romance:   { bg: '#b83020', fg: '#fce8df', label: 'Romance' },
  drama:     { bg: '#1e3a6a', fg: '#dfe8fc', label: 'Drama' },
  fantasia:  { bg: '#3a6828', fg: '#e6f0db', label: 'Fantasia' },
  ficcao:    { bg: '#1a5a6a', fg: '#d5eef4', label: 'Ficção Científica' },
  scifi:     { bg: '#1a5a6a', fg: '#d5eef4', label: 'Sci-Fi' },
  aventura:  { bg: '#7a3a1a', fg: '#f4e6d5', label: 'Aventura' },
  terror:    { bg: '#1a1228', fg: '#e8d5f4', label: 'Terror' },
  comedia:   { bg: '#a06800', fg: '#fff8e6', label: 'Comédia' },
  kdrama:    { bg: '#5a2244', fg: '#f4d5e8', label: 'K-Drama' },
  anime:     { bg: '#b83020', fg: '#fce8df', label: 'Anime' },
  rpf:       { bg: '#3a2a6a', fg: '#e0d5f4', label: 'RPF' },
  crossover: { bg: '#2a5a3a', fg: '#d5f4e8', label: 'Crossover' },
  default:   { bg: '#5a2244', fg: '#f4d5e8', label: '' },
};

function fdCat(cat) {
  const k = (cat || '').toLowerCase().replace(/[^a-z]/g, '');
  return FD_CATS[k] || FD_CATS.default;
}

function fmtDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

function fmtCount(n) {
  if (n == null || n === '') return '—';
  const num = Number(n);
  if (isNaN(num)) return '—';
  if (num >= 1000) return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}k`;
  return String(num);
}

// ── Componentes visuais ──────────────────────────────────────────────────
function FDCover({ title, category, interactive, coverUrl }) {
  const c = fdCat(category);
  const [imgErr, setImgErr] = useState(false);
  return (
    <div style={{ width: '100%', aspectRatio: '2/3', background: c.bg, position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
      {coverUrl && !imgErr
        ? <img src={coverUrl} alt={title} onError={() => setImgErr(true)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <>
            <div style={{ position: 'absolute', top: 12, left: 0, right: 0, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: c.fg, opacity: 0.8 }}>{c.label}</div>
            <div style={{ position: 'absolute', bottom: '22%', left: 12, right: 12, textAlign: 'center', fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, lineHeight: 1.15, color: c.fg, fontStyle: 'italic' }}>{title}</div>
            {interactive && <div style={{ position: 'absolute', top: 8, right: 8, background: FD.mustard, color: '#1f1610', padding: '2px 6px', borderRadius: 3, fontFamily: "'JetBrains Mono', monospace", fontSize: 7, fontWeight: 700, letterSpacing: 0.5 }}>✦</div>}
          </>
      }
    </div>
  );
}

function FDAvatar({ name, avatarUrl, size = 40 }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  const palette = ['#d24a2e', '#5a8038', '#e0a428', '#6e2c52', '#3a8aa8'];
  const bg = palette[(name || '').charCodeAt(0) % palette.length];
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: size * 0.38, color: '#fffbf3', flexShrink: 0 }}>
      {initial}
    </div>
  );
}

const IconChevR = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IconBookmark = ({ filled }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);
const IconPlay = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);
const IconShare = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

// ── Utilities ────────────────────────────────────────────────────────────
function hasRichContent(html) {
  if (!html) return false;
  return html.replace(/<[^>]*>/g, '').trim().length > 0;
}
function stripHtml(html) {
  return html ? html.replace(/<[^>]*>/g, '') : '';
}

// ── AgeGate ──────────────────────────────────────────────────────────────
function AgeGate({ fanfic, onConfirm, onBack }) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  return (
    <div className={styles.ageGate}>
      <div className={styles.ageGateCard}>
        <span className={styles.ageGateBadge}>+18</span>
        <h2 className={styles.ageGateTitle}>Conteúdo adulto</h2>
        <p className={styles.ageGateText}>
          Esta história contém conteúdo destinado a maiores de 18 anos.
          Ao continuar, você confirma que tem 18 anos ou mais.
        </p>
        {fanfic.trigger_warnings && fanfic.trigger_warnings.replace(/<[^>]*>/g, '').trim() && (
          <p className={styles.ageGateWarnings}>
            <strong>Avisos de conteúdo:</strong> {fanfic.trigger_warnings.replace(/<[^>]*>/g, '')}
          </p>
        )}
        <div className={styles.ageGateActions}>
          <button className={styles.ageGateConfirm} onClick={() => onConfirm(dontShowAgain)}>
            Tenho 18 anos ou mais — Continuar
          </button>
          <label className={styles.ageGateDontShow}>
            <input type="checkbox" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} />
            Não mostrar novamente para esta história
          </label>
          <button className={styles.ageGateBack} onClick={onBack}>Voltar</button>
        </div>
      </div>
    </div>
  );
}

// ── QuestionsModal v3 ────────────────────────────────────────────────────
const QM = {
  surface: '#fffbf3', paperAlt: '#f5e9d0', paper: '#fbf3e2',
  border: '#e7d8b8',
  brick: '#d24a2e', brickBg: '#fce8df', brickSoft: '#fad6cc', onBrick: '#fffbf3',
  mustard: '#e0a428', mustardBg: '#fcefc7', mustardSoft: '#f5dfa3',
  moss: '#5a8038', mossBg: '#ecf2da', mossSoft: '#d6e0b9',
  ink: '#1f1610', inkSoft: '#4d3f30', inkMute: '#8c7a62',
};

function isPronomeQ(q) {
  return (q.placeholder || q.standard_key || '').toLowerCase().includes('pronome');
}

function QuestionsModal({ isOpen, onClose, questions, existingAnswers, readerProfile, allProfiles, selectedProfileId, onSelectProfile, onSave, fanficId }) {
  const toast = useToast();
  const [inputs, setInputs] = useState({});
  const [errors, setErrors] = useState([]);
  const [saveToProfile, setSaveToProfile] = useState({});
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [localProfileId, setLocalProfileId] = useState(selectedProfileId);

  useEffect(() => {
    if (!isOpen) return;
    setLocalProfileId(selectedProfileId);
    const updated = {};
    questions.forEach((q) => {
      updated[q.placeholder] = q.variable_type === 'standard'
        ? (readerProfile[q.standard_key] || existingAnswers[q.placeholder] || '')
        : (existingAnswers[q.placeholder] || '');
    });
    setInputs(updated);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleProfileChange = (id) => {
    setLocalProfileId(id);
    onSelectProfile(id);
    const newProfile = allProfiles.find((p) => p.id === id) || {};
    setInputs((prev) => {
      const updated = { ...prev };
      questions.forEach((q) => {
        if (q.variable_type === 'standard') updated[q.placeholder] = newProfile[q.standard_key] || '';
      });
      return updated;
    });
  };

  const handleSavePreference = async () => {
    if (!localProfileId) return;
    localStorage.setItem(`lollipopfics_fanfic_${fanficId}_profile_id`, String(localProfileId));
    await onSave(inputs, saveToProfile, null, localProfileId);
    toast.success('Perfil salvo como preferência para esta história!');
    onClose();
  };

  const handleSubmit = async () => {
    setErrors([]);
    const profileName = showCreateProfile && newProfileName.trim() ? newProfileName.trim() : null;
    await onSave(inputs, saveToProfile, profileName, localProfileId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(31,22,16,0.6)', backdropFilter: 'blur(6px)',
      zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        maxWidth: 560, width: '100%',
        background: QM.surface, border: `1px solid ${QM.brickSoft}`,
        borderRadius: 14, overflow: 'hidden', position: 'relative',
        boxShadow: '0 2px 4px rgba(80,40,15,.06), 0 12px 24px rgba(80,40,15,.12), 0 24px 48px rgba(80,40,15,.10)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>

        {/* Fechar */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 14, zIndex: 2,
          width: 32, height: 32, borderRadius: '50%',
          background: QM.paper, border: `1px solid ${QM.border}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: QM.inkSoft,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* Header brick */}
        <div style={{
          padding: '28px 32px 22px', textAlign: 'center',
          borderBottom: `1px solid ${QM.border}`,
          background: QM.brickBg, position: 'relative', overflow: 'hidden',
        }}>
          {/* Dots pattern */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="qfd-dots" width="12" height="12" patternUnits="userSpaceOnUse">
                <circle cx="6" cy="6" r="1.4" fill={QM.brick} opacity="0.22"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#qfd-dots)"/>
          </svg>

          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 12,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: QM.brick, fontWeight: 700,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={QM.brick} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
              </svg>
              Personalização · modo interativo
            </div>
            <h2 style={{
              fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic',
              fontSize: 24, fontWeight: 400, letterSpacing: -0.5,
              color: QM.ink, lineHeight: 1.2, margin: '0 0 10px',
            }}>
              Antes da história começar —<br />quem você quer ser nela?
            </h2>
            <p style={{
              fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic',
              fontSize: 13, color: QM.inkSoft, margin: 0, lineHeight: 1.5,
              maxWidth: 380, marginLeft: 'auto', marginRight: 'auto',
            }}>
              Os campos aparecem ao longo da história. Pode pular qualquer um — vai aparecer com o valor padrão. Pode mudar tudo depois.
            </p>
          </div>
        </div>

        {/* Corpo — scrollável */}
        <div style={{ padding: '20px 32px', overflowY: 'auto', flex: 1 }}>

          {/* Seletor de perfil */}
          {allProfiles.length > 0 && (
            <div style={{
              background: QM.mossBg, border: `1px solid ${QM.mossSoft}`,
              borderRadius: 8, padding: '12px 16px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={QM.moss} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: QM.moss, fontWeight: 700, marginBottom: 5 }}>
                  Perfil de leitura
                </div>
                <select
                  value={localProfileId ?? allProfiles[0]?.id ?? ''}
                  onChange={(e) => handleProfileChange(Number(e.target.value))}
                  style={{
                    width: '100%', border: `1px solid ${QM.mossSoft}`,
                    background: QM.surface, borderRadius: 6, padding: '7px 10px',
                    fontFamily: 'Inter', fontSize: 13, color: QM.ink, outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {allProfiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {localProfileId && (
                <button
                  onClick={handleSavePreference}
                  style={{
                    padding: '7px 12px', borderRadius: 6, border: `1px solid ${QM.mossSoft}`,
                    background: 'transparent', color: QM.moss,
                    fontFamily: 'Inter', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  Salvar preferência
                </button>
              )}
            </div>
          )}

          {/* Erro */}
          {errors.length > 0 && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 16,
              background: QM.brickBg, border: `1px solid ${QM.brickSoft}`,
              fontFamily: 'Inter', fontSize: 13, color: QM.brick, fontWeight: 500,
            }}>
              Por favor, preencha todos os campos obrigatórios.
            </div>
          )}

          {/* Campos */}
          {questions.map((q) => (
            <div key={q.id} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
                <label style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: QM.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {q.question_text}
                  {q.required && <span style={{ color: QM.brick }}>*</span>}
                  {q.variable_type === 'standard'
                    ? <span style={{ padding: '1px 7px', borderRadius: 999, background: QM.mossBg, color: QM.moss, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>perfil</span>
                    : <span style={{ padding: '1px 7px', borderRadius: 999, background: QM.brickBg, color: QM.brick, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>livre</span>
                  }
                </label>
                {q.hint && (
                  <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 11.5, color: QM.inkMute, textAlign: 'right', flexShrink: 0 }}>
                    {q.hint}
                  </span>
                )}
              </div>

              {isPronomeQ(q) ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  {['ela/dela', 'ele/dele', 'elu/delu'].map(opt => (
                    <button key={opt} onClick={() => setInputs(p => ({ ...p, [q.placeholder]: opt }))}
                      style={{
                        flex: 1, padding: '9px 10px', cursor: 'pointer',
                        background: inputs[q.placeholder] === opt ? QM.brick : QM.surface,
                        color: inputs[q.placeholder] === opt ? QM.onBrick : QM.ink,
                        border: `1px solid ${inputs[q.placeholder] === opt ? QM.brick : QM.border}`,
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
                  onChange={(e) => {
                    setInputs((p) => ({ ...p, [q.placeholder]: e.target.value }));
                    setErrors((err) => err.filter((x) => x !== q.placeholder));
                  }}
                  placeholder={q.default_answer || 'sua resposta…'}
                  style={{
                    width: '100%', padding: '10px 14px', boxSizing: 'border-box',
                    border: `1px solid ${errors.includes(q.placeholder) ? QM.brick : QM.border}`,
                    background: QM.paperAlt, borderRadius: 8, outline: 'none',
                    fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, color: QM.ink,
                    transition: 'border-color .12s',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = QM.brick}
                  onBlur={e => e.currentTarget.style.borderColor = errors.includes(q.placeholder) ? QM.brick : QM.border}
                />
              )}

              {q.variable_type === 'standard' && (
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 5, cursor: 'pointer', fontFamily: 'Inter', fontSize: 11.5, color: QM.inkMute }}>
                  <input
                    type="checkbox"
                    defaultChecked
                    onChange={(e) => setSaveToProfile((p) => ({ ...p, [q.standard_key]: e.target.checked }))}
                    style={{ accentColor: QM.moss }}
                  />
                  Salvar no perfil para futuras histórias
                </label>
              )}
            </div>
          ))}

          {/* Criar perfil */}
          {allProfiles.length === 0 && (
            <div style={{ marginTop: 4, paddingTop: 16, borderTop: `1px solid ${QM.border}` }}>
              {!showCreateProfile ? (
                <button onClick={() => setShowCreateProfile(true)} style={{
                  background: 'transparent', border: `1px dashed ${QM.border}`,
                  borderRadius: 8, padding: '10px 16px', cursor: 'pointer', width: '100%',
                  fontFamily: 'Inter', fontSize: 13, color: QM.inkSoft, fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                  Criar um perfil de leitura
                </button>
              ) : (
                <div>
                  <label style={{ display: 'block', fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: QM.ink, marginBottom: 6 }}>Nome do perfil</label>
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="Ex: Perfil Principal"
                    autoFocus
                    style={{
                      width: '100%', padding: '10px 14px', boxSizing: 'border-box',
                      border: `1px solid ${QM.border}`, background: QM.paperAlt,
                      borderRadius: 8, outline: 'none',
                      fontFamily: "'Fraunces', Georgia, serif", fontSize: 14.5, color: QM.ink,
                    }}
                  />
                  <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 12, color: QM.inkMute, margin: '6px 0 0' }}>
                    As respostas de perfil serão salvas automaticamente aqui.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 32px', borderTop: `1px solid ${QM.border}`,
          background: QM.paperAlt,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: QM.inkSoft,
            fontFamily: 'Inter', fontSize: 12.5, fontWeight: 500,
            cursor: 'pointer', textDecoration: 'underline', padding: 0,
          }}>
            Pular · usar valores padrão
          </button>
          <button onClick={handleSubmit} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '11px 22px', borderRadius: 8, cursor: 'pointer',
            background: QM.brick, color: QM.onBrick, border: 'none',
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

// ── Página principal ─────────────────────────────────────────────────────
export default function FanficDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [detailTab, setDetailTab] = useState('capitulos');
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(
    () => localStorage.getItem(`lollipopfics_age_ok_${id}`) === '1'
  );
  const [selectedProfileId, setSelectedProfileId] = useState(() => {
    const fanficPref = localStorage.getItem(`lollipopfics_fanfic_${id}_profile_id`);
    if (fanficPref) return Number(fanficPref);
    const global = localStorage.getItem('lollipopfics_selected_profile_id');
    return global ? Number(global) : null;
  });
  const [readingMode, setReadingMode] = useState(
    () => localStorage.getItem(`lollipopfics_fanfic_${id}_reading_mode`) || 'interactive'
  );

  const handleSelectProfile = (newId) => {
    setSelectedProfileId(newId);
    localStorage.setItem('lollipopfics_selected_profile_id', String(newId));
  };
  const handleSetReadingMode = (mode) => {
    setReadingMode(mode);
    localStorage.setItem(`lollipopfics_fanfic_${id}_reading_mode`, mode);
  };

  // ── Queries ──────────────────────────────────────────────────────────
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

  const authorId = fanfic?.author_id;

  const { data: followStatus } = useQuery({
    queryKey: ['follow-status', authorId],
    queryFn: () => userApi.getFollowStatus(authorId),
    enabled: isAuthenticated && !!authorId && user?.user_id !== authorId,
  });
  const { data: favoriteStatus } = useQuery({
    queryKey: ['favorite-status', id],
    queryFn: () => fanficApi.getFavoriteStatus(id),
    enabled: !!fanfic, // backend retorna favorites_count mesmo sem auth
  });
  const { data: authorOtherWorks = [] } = useQuery({
    queryKey: ['author-fanfics', authorId],
    queryFn: () => fanficApi.getByAuthor(authorId, false),
    enabled: !!authorId,
    select: (works) => works.filter((w) => w.id !== Number(id)).slice(0, 3),
  });

  // ── Mutations ────────────────────────────────────────────────────────
  const followMutation = useMutation({
    mutationFn: () => followStatus?.following ? userApi.unfollowUser(authorId) : userApi.followUser(authorId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['follow-status', authorId] });
      const prev = queryClient.getQueryData(['follow-status', authorId]);
      queryClient.setQueryData(['follow-status', authorId], (old) => ({
        following: !old?.following,
        followers_count: (old?.followers_count ?? 0) + (old?.following ? -1 : 1),
      }));
      return { prev };
    },
    onSuccess: (data) => queryClient.setQueryData(['follow-status', authorId], data),
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['follow-status', authorId], context?.prev);
      toast.error('Erro ao atualizar seguimento.');
    },
  });
  const favoriteMutation = useMutation({
    mutationFn: () => fanficApi.toggleFavorite(id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['favorite-status', id] });
      const prev = queryClient.getQueryData(['favorite-status', id]);
      queryClient.setQueryData(['favorite-status', id], (old) => ({ ...old, favorited: !old?.favorited }));
      return { prev };
    },
    onSuccess: (data) => queryClient.setQueryData(['favorite-status', id], data),
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['favorite-status', id], context?.prev);
      toast.error('Erro ao atualizar favorito.');
    },
  });
  const chapterLikeMutation = useMutation({
    mutationFn: (chapterId) => chapterApi.toggleLike(chapterId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chapters', id] }),
    onError: () => toast.error('Erro ao curtir capítulo.'),
  });
  const saveAnswersMutation = useMutation({
    mutationFn: ({ answers }) => interactiveApi.saveAnswers(id, answers),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['answers'] }),
  });

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleSaveAnswers = async (inputs, saveToProfileMap, newProfileName = null, profileId = null) => {
    const activeProfile =
      (profileId != null ? allProfiles.find((p) => p.id === profileId) : null) || readerProfile;
    const filledInputs = Object.fromEntries(Object.entries(inputs).filter(([, v]) => v?.trim()));
    const merged = { ...existingAnswers, ...filledInputs };
    questions.forEach((q) => {
      if (!merged[q.placeholder] && q.variable_type === 'standard' && activeProfile[q.standard_key]) {
        merged[q.placeholder] = activeProfile[q.standard_key];
      }
    });
    await saveAnswersMutation.mutateAsync({ answers: merged });
    if (newProfileName) {
      const profileData = { name: newProfileName };
      questions.forEach((q) => {
        if (q.variable_type === 'standard' && inputs[q.placeholder]) profileData[q.standard_key] = inputs[q.placeholder];
      });
      try {
        await profileApi.createProfile(profileData);
        queryClient.invalidateQueries({ queryKey: ['profiles'] });
        toast.success(`Perfil "${newProfileName}" criado!`);
      } catch { toast.error('Respostas salvas, mas falha ao criar perfil.'); }
    } else if (activeProfile.id && Object.values(saveToProfileMap).some(Boolean)) {
      const updates = { ...activeProfile };
      Object.entries(saveToProfileMap).forEach(([key, save]) => { if (save && inputs[key]) updates[key] = inputs[key]; });
      try { await profileApi.updateProfile(activeProfile.id, updates); } catch {}
      toast.success('Respostas salvas!');
    } else {
      toast.success('Respostas salvas!');
    }
  };

  const readChapter = (chapterId) => {
    const mode = fanfic?.interactive_mode ? readingMode : 'non-interactive';
    navigate(`/chapter/${chapterId}?mode=${mode}`);
  };

  // ── Derived state ─────────────────────────────────────────────────────
  const readerProfile =
    allProfiles.find((p) => p.id === selectedProfileId) || allProfiles[0] || {};
  const isAuthor = isAuthenticated && fanfic && user?.user_id === fanfic.author_id;
  const authorUsername = fanfic?.author?.username;
  const authorAvatarUrl = fanfic?.author?.avatar_url;
  const authorBio = fanfic?.author?.bio;
  const authorName = fanfic?.author?.name || authorUsername;

  const sortedChapters = [...chapters]
    .filter((ch) => isAuthor || !ch.is_draft)
    .sort((a, b) => a.order - b.order);

  const hasAllDefaults = questions.length > 0 && questions.every((q) => q.default_answer && q.default_answer.trim() !== '');

  useEffect(() => {
    if (!hasAllDefaults && readingMode === 'normal') handleSetReadingMode('interactive');
  }, [hasAllDefaults]); // eslint-disable-line react-hooks/exhaustive-deps

  const pendingQuestions = questions.filter((q) => {
    if (existingAnswers[q.placeholder]) return false;
    if (q.variable_type === 'standard' && readerProfile[q.standard_key]) return false;
    return true;
  });

  const ficStatus = fanfic?.is_complete ? 'Completa' : fanfic?.is_hiatus ? 'Em hiato' : fanfic?.is_draft ? 'Rascunho' : 'Em andamento';
  const cat = fdCat(fanfic?.category);

  // ── Early returns ──────────────────────────────────────────────────────
  if (loadingFanfic) return <PageLayout><LoadingSpinner fullPage /></PageLayout>;
  if (!fanfic) return <PageLayout><p className={styles.error}>Fanfic não encontrada.</p></PageLayout>;

  if (fanfic.is_adult_content && !ageConfirmed) {
    return (
      <PageLayout>
        <AgeGate
          fanfic={fanfic}
          onConfirm={(dontShowAgain) => {
            if (dontShowAgain) localStorage.setItem(`lollipopfics_age_ok_${id}`, '1');
            setAgeConfirmed(true);
          }}
          onBack={() => navigate(-1)}
        />
      </PageLayout>
    );
  }

  const TABS_DEF = [
    { id: 'capitulos',   label: 'Capítulos',   count: sortedChapters.length },
    { id: 'sobre',       label: 'Sobre' },
    { id: 'comentarios', label: 'Comentários' },
  ];

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <PageLayout fullWidth>
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

      {/* ══ HERO ══ */}
      <div style={{ background: cat.bg, position: 'relative', overflow: 'hidden' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12, pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="fd-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.4" fill={cat.fg} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#fd-dots)" />
        </svg>

        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '48px 40px 56px', position: 'relative', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 40, alignItems: 'flex-end' }}>
          {/* Capa */}
          <div style={{ boxShadow: '0 8px 32px rgba(0,0,0,.28)', borderRadius: 6, overflow: 'hidden', transform: 'rotate(-2deg)', flexShrink: 0 }}>
            <FDCover title={fanfic.title} category={fanfic.category} interactive={fanfic.interactive_mode} coverUrl={fanfic.cover_url ? fanficApi.getAssetUrl(fanfic.cover_url) : null} />
          </div>

          {/* Info */}
          <div>
            {/* Kicker */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
              {cat.label && (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: 1.6, textTransform: 'uppercase', color: cat.fg, fontWeight: 700, opacity: 0.85 }}>
                  {cat.label}
                </span>
              )}
              <span style={{ color: cat.fg, opacity: 0.4 }}>·</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: 1.6, textTransform: 'uppercase', color: cat.fg, fontWeight: 700, opacity: 0.85 }}>
                {ficStatus}
              </span>
              {fanfic.interactive_mode && (
                <>
                  <span style={{ color: cat.fg, opacity: 0.4 }}>·</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: 1.6, textTransform: 'uppercase', color: FD.mustard, fontWeight: 700 }}>
                    ✦ Interativa
                  </span>
                </>
              )}
            </div>

            {/* Título */}
            <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 'clamp(36px,5vw,72px)', fontWeight: 400, letterSpacing: -2, margin: '0 0 20px', lineHeight: 0.95, color: cat.fg }}>
              <span style={{ fontStyle: 'italic' }}>{fanfic.title}</span>
            </h1>

            {/* Autor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
              <FDAvatar name={authorName} avatarUrl={authorAvatarUrl} size={40} />
              <div>
                <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 16, color: cat.fg, opacity: 0.9 }}>
                  por{' '}
                  <Link to={`/user/${authorUsername}`} style={{ color: 'inherit', borderBottom: `1px solid currentColor`, textDecoration: 'none' }}>
                    {authorName}
                  </Link>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  {followStatus?.followers_count !== undefined && (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: cat.fg, opacity: 0.55 }}>
                      {(followStatus.followers_count ?? 0).toLocaleString('pt-BR')} seguidoras
                    </span>
                  )}
                  {isAuthenticated && !isAuthor && followStatus !== undefined && (
                    <>
                      {followStatus?.followers_count !== undefined && (
                        <span style={{ color: cat.fg, opacity: 0.35 }}>·</span>
                      )}
                      <button
                        onClick={() => followMutation.mutate()}
                        style={{
                          padding: '3px 10px', borderRadius: 999, cursor: 'pointer', border: 'none',
                          background: followStatus?.following ? 'rgba(255,251,243,0.2)' : 'rgba(255,251,243,0.12)',
                          color: cat.fg,
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                          fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                          border: `1px solid ${followStatus?.following ? 'rgba(255,251,243,0.4)' : 'rgba(255,251,243,0.2)'}`,
                        }}
                      >
                        {followStatus?.following ? '✓ Seguindo' : '+ Seguir'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Seletor de modo — aparece acima dos CTAs quando a fic é interativa */}
            {fanfic.interactive_mode && questions.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)',
                  borderRadius: 999, padding: '4px 6px',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}>
                  {/* Normal — só disponível se todas as perguntas têm default */}
                  {hasAllDefaults && (
                    <button
                      onClick={() => handleSetReadingMode('normal')}
                      style={{
                        padding: '7px 14px', borderRadius: 999, border: 'none',
                        background: readingMode === 'normal' ? 'rgba(255,251,243,0.95)' : 'transparent',
                        color: readingMode === 'normal' ? FD.ink : cat.fg,
                        fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600,
                        cursor: 'pointer', transition: 'background .15s, color .15s',
                      }}
                    >
                      Normal
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleSetReadingMode('interactive');
                      if (isAuthenticated) setQuestionsOpen(true);
                    }}
                    style={{
                      padding: '7px 14px', borderRadius: 999, border: 'none',
                      background: readingMode === 'interactive' ? FD.mustard : 'transparent',
                      color: readingMode === 'interactive' ? '#1f1610' : cat.fg,
                      fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                      transition: 'background .15s, color .15s',
                    }}
                  >
                    <span style={{ fontSize: 11 }}>✦</span> Interativa
                  </button>
                </div>

                {/* Hint de login se não autenticada */}
                {!isAuthenticated && (
                  <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 12.5, color: cat.fg, opacity: 0.75, margin: '6px 0 0' }}>
                    <Link to="/login" style={{ color: 'inherit', textDecoration: 'underline' }}>Faça login</Link> para personalizar sua leitura.
                  </p>
                )}

                {/* Indicador de respostas preenchidas */}
                {readingMode === 'interactive' && isAuthenticated && Object.keys(existingAnswers).length > 0 && (
                  <button
                    onClick={() => setQuestionsOpen(true)}
                    style={{
                      marginLeft: 10, padding: '4px 10px', borderRadius: 999,
                      background: 'transparent', border: `1px solid rgba(255,255,255,0.3)`,
                      color: cat.fg, fontFamily: 'Inter', fontSize: 11.5, fontWeight: 500,
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Editar respostas
                  </button>
                )}
              </div>
            )}

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Botão principal — Começar a ler */}
              <button
                onClick={() => {
                  if (!sortedChapters.length) return;
                  if (fanfic.interactive_mode && readingMode === 'interactive') {
                    if (isAuthenticated && (pendingQuestions.length > 0 || Object.keys(existingAnswers).length === 0)) {
                      setQuestionsOpen(true);
                    } else {
                      readChapter(sortedChapters[0].id);
                    }
                  } else {
                    readChapter(sortedChapters[0].id);
                  }
                }}
                disabled={!sortedChapters.length}
                style={{
                  padding: '13px 24px',
                  background: FD.mustard, color: '#1f1610', border: 'none', borderRadius: 8,
                  fontFamily: 'Inter', fontSize: 14, fontWeight: 700,
                  cursor: sortedChapters.length ? 'pointer' : 'not-allowed',
                  opacity: sortedChapters.length ? 1 : 0.5,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <IconPlay />
                {sortedChapters.length ? 'Começar a ler' : 'Sem capítulos'}
              </button>

              {/* Salvar na estante */}
              {!isAuthor && (
                <button
                  onClick={() => isAuthenticated ? favoriteMutation.mutate() : navigate('/login')}
                  style={{
                    padding: '13px 20px',
                    background: 'rgba(255,251,243,0.12)', color: cat.fg,
                    border: `1px solid rgba(255,251,243,0.3)`, borderRadius: 8,
                    fontFamily: 'Inter', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,251,243,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,251,243,0.12)'}
                >
                  <IconBookmark filled={!!favoriteStatus?.favorited} />
                  {favoriteStatus?.favorited ? 'Na estante' : 'Salvar na estante'}
                </button>
              )}

              {/* Editar (autora) */}
              {isAuthor && (
                <Link
                  to={`/dashboard?fanficId=${fanfic.id}`}
                  style={{
                    padding: '13px 20px',
                    background: 'rgba(255,251,243,0.12)', color: cat.fg,
                    border: `1px solid rgba(255,251,243,0.3)`, borderRadius: 8,
                    fontFamily: 'Inter', fontSize: 14, fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  Editar história
                </Link>
              )}

              {/* Compartilhar */}
              <button
                onClick={() => {
                  const url = window.location.href;
                  if (navigator.share) {
                    navigator.share({ title: fanfic.title, url });
                  } else {
                    navigator.clipboard.writeText(url).then(() => {
                      // toast handled externally if needed
                    });
                  }
                }}
                title="Compartilhar"
                style={{
                  width: 46, height: 46,
                  background: 'rgba(255,251,243,0.12)', color: cat.fg,
                  border: `1px solid rgba(255,251,243,0.3)`, borderRadius: 8,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,251,243,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,251,243,0.12)'}
              >
                <IconShare />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '36px 40px 80px', display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 56 }}>

        {/* ── LEFT: tabs + conteúdo ── */}
        <div>
          <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${FD.border}`, marginBottom: 28 }}>
            {TABS_DEF.map((t) => (
              <button key={t.id} onClick={() => setDetailTab(t.id)} style={{ padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 13.5, fontWeight: detailTab === t.id ? 600 : 500, color: detailTab === t.id ? FD.brick : FD.inkSoft, borderBottom: detailTab === t.id ? `2px solid ${FD.brick}` : '2px solid transparent', marginBottom: -1, display: 'flex', alignItems: 'center', gap: 7 }}>
                {t.label}
                {t.count !== undefined && (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: FD.inkMute, letterSpacing: 0.3 }}>· {t.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Capítulos */}
          {detailTab === 'capitulos' && (
            <div style={{ background: FD.surface, border: `1px solid ${FD.border}`, borderRadius: 8, overflow: 'hidden' }}>
              {sortedChapters.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 17, color: FD.inkMute, margin: 0 }}>
                    Nenhum capítulo publicado ainda.
                  </p>
                </div>
              ) : (
                sortedChapters.map((ch, i) => (
                  <div
                    key={ch.id}
                    onClick={() => readChapter(ch.id)}
                    style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: 14, alignItems: 'center', padding: '14px 18px', borderTop: i === 0 ? 'none' : `1px solid ${FD.border}`, cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = FD.paperAlt}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 26, color: FD.inkMute, lineHeight: 1, letterSpacing: -0.6, textAlign: 'center' }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <h4 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 18, fontWeight: 400, letterSpacing: -0.3, margin: 0, color: FD.ink, lineHeight: 1.15 }}>
                          {ch.title}
                        </h4>
                        {ch.is_draft && (
                          <span style={{ padding: '2px 8px', borderRadius: 999, background: FD.brickBg, color: FD.brickDeep, fontFamily: 'Inter', fontSize: 10.5, fontWeight: 700 }}>rascunho</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: FD.inkMute, letterSpacing: 0.3, flexWrap: 'wrap' }}>
                        {ch.created_at && <span>{fmtDate(ch.created_at)}</span>}
                        {ch.word_count > 0 && <><span style={{ color: FD.borderStrong }}>·</span><span>{Math.ceil(ch.word_count / 200)} min</span></>}
                        {ch.likes_count > 0 && <><span style={{ color: FD.borderStrong }}>·</span><span>{ch.likes_count} curtidas</span></>}
                      </div>
                    </div>
                    <span style={{ color: FD.inkMute }}><IconChevR /></span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Sobre */}
          {detailTab === 'sobre' && (
            <div>
              {fanfic.synopsis && (
                <>
                  <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 400, letterSpacing: -0.5, margin: '0 0 14px', color: FD.ink }}>Sinopse</h3>
                  <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 17, lineHeight: 1.7, color: FD.inkSoft, whiteSpace: 'pre-line', marginBottom: 32 }}>
                    {fanfic.synopsis}
                  </div>
                </>
              )}

              {fanfic.interactive_mode && questions.length > 0 && (
                <div style={{ background: FD.mustardBg, border: `1px solid ${FD.mustard}55`, borderRadius: 8, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: '#7a5a14', fontWeight: 700, marginBottom: 4 }}>✦ Modo de leitura</div>
                    <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 13, color: FD.inkSoft }}>
                      {readingMode === 'interactive' ? 'Personalizada para você' : 'Texto com valores padrão da autora'}
                    </div>
                    {!isAuthenticated && (
                      <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 12.5, color: FD.inkMute, margin: '4px 0 0' }}>
                        <Link to="/login" style={{ color: FD.brick }}>Faça login</Link> para personalizar sua leitura.
                      </p>
                    )}
                  </div>
                  {isAuthenticated && (
                    <button
                      onClick={() => setQuestionsOpen(true)}
                      style={{ padding: '7px 14px', borderRadius: 6, background: 'transparent', border: `1px solid ${FD.mustard}88`, cursor: 'pointer', fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600, color: '#7a5a14', whiteSpace: 'nowrap' }}
                    >
                      {Object.keys(existingAnswers).length > 0 ? 'Editar respostas' : 'Preencher dados'}
                    </button>
                  )}
                </div>
              )}

              {fanfic.is_adult_content && (
                <div style={{ background: FD.brickBg, border: `1px solid ${FD.brick}44`, borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: FD.brick, letterSpacing: 0.5, flexShrink: 0 }}>+18</span>
                  <div>
                    <div style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: FD.brick, marginBottom: 2 }}>Conteúdo adulto</div>
                    {stripHtml(fanfic.trigger_warnings || '').trim() && (
                      <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 13, color: FD.brickDeep }}>
                        {stripHtml(fanfic.trigger_warnings)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {hasRichContent(fanfic.disclaimer) && (
                <div style={{ marginBottom: 28 }}>
                  <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, fontWeight: 400, letterSpacing: -0.3, margin: '0 0 10px', color: FD.ink }}>Aviso do Autor</h3>
                  <div
                    style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 15, lineHeight: 1.6, color: FD.inkSoft, background: FD.paperAlt, borderRadius: 6, padding: '14px 16px', borderLeft: `3px solid ${FD.borderStrong}` }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(fanfic.disclaimer) }}
                  />
                </div>
              )}

              {tags.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 400, letterSpacing: -0.4, margin: '0 0 12px', color: FD.ink }}>Tags</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {tags.map((t) => (
                      <Link key={t.id} to={`/tags?q=${encodeURIComponent(t.name)}`} style={{ padding: '5px 12px', borderRadius: 999, background: FD.brickBg, color: FD.brickDeep, fontFamily: 'Inter', fontSize: 13, fontWeight: 500, textDecoration: 'none', border: `1px solid ${FD.brick}33` }}>
                        {t.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 400, letterSpacing: -0.4, margin: '0 0 12px', color: FD.ink }}>Classificações</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {[
                    { k: 'Faixa etária', v: fanfic.is_adult_content ? '+18' : 'Livre' },
                    { k: 'Idioma', v: 'Português · BR' },
                    { k: 'Capítulos', v: `${sortedChapters.length} publicados` },
                    { k: 'Status', v: ficStatus },
                  ].map((c) => (
                    <div key={c.k} style={{ padding: '12px 14px', background: FD.surface, border: `1px solid ${FD.border}`, borderRadius: 8 }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', color: FD.inkMute, fontWeight: 600, marginBottom: 4 }}>{c.k}</div>
                      <div style={{ fontFamily: 'Inter', fontSize: 13.5, color: FD.ink, fontWeight: 500 }}>{c.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Comentários */}
          {detailTab === 'comentarios' && (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 18, color: FD.inkMute, margin: 0 }}>
                Comentários em breve.
              </p>
            </div>
          )}
        </div>

        {/* ── RIGHT: sidebar ── */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Status da história */}
          <div style={{ background: FD.surface, border: `1px solid ${FD.border}`, borderRadius: 8, padding: '14px 18px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { label: ficStatus, color: ficStatus === 'Completa' ? FD.moss : ficStatus === 'Em hiato' ? FD.inkMute : ficStatus === 'Rascunho' ? FD.borderStrong : FD.mustard },
              fanfic.is_adult_content && { label: '+18', color: FD.brick },
              fanfic.interactive_mode && { label: '✦ Interativa', color: FD.mustard },
            ].filter(Boolean).map(({ label, color }) => (
              <span key={label} style={{
                padding: '4px 11px', borderRadius: 999,
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color, background: `${color}18`,
                border: `1px solid ${color}44`,
              }}>{label}</span>
            ))}
            {fanfic.updated_at && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: FD.inkMute, letterSpacing: '0.05em', marginLeft: 'auto' }}>
                atualizada {fmtDate(fanfic.updated_at)}
              </span>
            )}
          </div>

          {/* Stats */}
          <div style={{ background: FD.mossBg, border: `1px solid ${FD.mossSoft}`, borderRadius: 8, padding: '20px 22px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              {[
                { n: fmtCount(fanfic.total_views), l: 'visualizações' },
                { n: fmtCount(favoriteStatus?.favorites_count), l: 'salvaram' },
                { n: fmtCount(fanfic.total_likes), l: 'curtidas' },
                { n: sortedChapters.length || '—', l: 'capítulos' },
              ].map((s) => (
                <div key={s.l}>
                  <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 30, fontWeight: 400, color: FD.moss, fontStyle: 'italic', lineHeight: 1, letterSpacing: -0.5 }}>{s.n}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: FD.moss, marginTop: 6, fontWeight: 700, opacity: 0.75 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sobre a autora */}
          <div style={{ background: FD.surface, border: `1px solid ${FD.border}`, borderRadius: 8, padding: '20px 22px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: FD.brick, fontWeight: 700, marginBottom: 14 }}>
              Sobre a autora
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
              <FDAvatar name={authorName} avatarUrl={authorAvatarUrl} size={52} />
              <div>
                <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, fontWeight: 400, letterSpacing: -0.4, color: FD.ink, lineHeight: 1.1 }}>{authorName}</div>
                {followStatus?.followers_count !== undefined && (
                  <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 12.5, color: FD.inkSoft, marginTop: 3 }}>
                    {followStatus.followers_count} seguidoras
                  </div>
                )}
              </div>
            </div>
            {authorBio && (
              <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 13.5, lineHeight: 1.55, color: FD.inkSoft, margin: '0 0 14px' }}>
                "{authorBio}"
              </p>
            )}
            {!isAuthor ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => isAuthenticated ? followMutation.mutate() : navigate('/login')}
                  style={{ flex: 1, padding: '9px 16px', background: FD.brick, color: '#fffbf3', border: 'none', borderRadius: 7, fontFamily: 'Inter', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {followStatus?.following ? 'Seguindo' : 'Seguir'}
                </button>
                <Link
                  to={`/user/${authorUsername}`}
                  style={{ padding: '9px 14px', border: `1px solid ${FD.border}`, borderRadius: 7, fontFamily: 'Inter', fontSize: 13, fontWeight: 500, color: FD.ink, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                >
                  Ver perfil
                </Link>
              </div>
            ) : (
              <Link
                to={`/dashboard?fanficId=${fanfic.id}`}
                style={{ display: 'block', padding: '9px 16px', background: FD.brick, color: '#fffbf3', border: 'none', borderRadius: 7, fontFamily: 'Inter', fontSize: 13, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}
              >
                Editar história
              </Link>
            )}
          </div>

          {/* Mais dela */}
          {authorOtherWorks.length > 0 && (
            <div style={{ background: FD.surface, border: `1px solid ${FD.border}`, borderRadius: 8, padding: '20px 22px' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: FD.plum, fontWeight: 700, marginBottom: 14 }}>
                Mais dela
              </div>
              {authorOtherWorks.map((w, i) => (
                <Link
                  key={w.id}
                  to={`/fanfic/${w.id}`}
                  style={{ display: 'flex', gap: 12, padding: '10px 0', textDecoration: 'none', alignItems: 'center', borderTop: i === 0 ? 'none' : `1px solid ${FD.border}` }}
                >
                  <div style={{ width: 40, flexShrink: 0 }}>
                    <FDCover title={w.title} category={w.category} coverUrl={w.cover_url ? fanficApi.getAssetUrl(w.cover_url) : null} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, color: FD.ink, lineHeight: 1.15, letterSpacing: -0.3 }}>{w.title}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: 0.8, textTransform: 'uppercase', color: FD.inkMute, marginTop: 4 }}>{fdCat(w.category).label}</div>
                  </div>
                  <span style={{ color: FD.inkMute, flexShrink: 0 }}><IconChevR /></span>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
    </PageLayout>
  );
}
