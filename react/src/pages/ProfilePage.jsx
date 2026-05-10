import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fanficApi, userApi, wallApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import PageLayout from '../components/layout/PageLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const FV = {
  paper: '#fbf3e2', paperAlt: '#f5e9d0',
  surface: '#fffbf3', ink: '#1f1610', inkSoft: '#4d3f30', inkMute: '#8c7a62',
  border: '#e7d8b8', borderStrong: '#d2bd92',
  brick: '#d24a2e', brickDeep: '#a23320', brickSoft: '#fad6cc', brickBg: '#fce8df', onBrick: '#fffbf3',
  moss: '#5a8038', mossSoft: '#d6e0b9', mossBg: '#ecf2da',
  mustard: '#e0a428', mustardSoft: '#f5dfa3', mustardBg: '#fcefc7',
  plum: '#6e2c52', plumSoft: '#e8c8d6', plumBg: '#f7e0eb',
  sky: '#3a8aa8', skySoft: '#c4dde5', skyBg: '#e2eef3',
};

const CAT = {
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
function getCat(cat) {
  const k = (cat || '').toLowerCase().replace(/[^a-z]/g, '');
  return CAT[k] || CAT.default;
}

/* ── Capa: imagem real ou editorial de fallback ──────────────────────── */
function Cover({ title, category, interactive, status, size = 'md', coverUrl }) {
  const c = getCat(category);
  const isSm = size === 'sm';
  const [imgErr, setImgErr] = useState(false);
  return (
    <div style={{
      width: '100%', aspectRatio: '2/3', background: c.bg,
      position: 'relative', overflow: 'hidden', borderRadius: 6,
      boxShadow: '0 1px 2px rgba(80,40,15,.05), 0 4px 12px rgba(80,40,15,.06)',
    }}>
      {coverUrl && !imgErr
        ? <img src={coverUrl} alt={title} onError={() => setImgErr(true)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <>
            <div style={{ position: 'absolute', top: 8, left: 0, right: 0, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: isSm ? 7 : 8, letterSpacing: 2, textTransform: 'uppercase', color: c.fg, opacity: 0.8 }}>{c.label}</div>
            <div style={{ position: 'absolute', bottom: '20%', left: 10, right: 10, textAlign: 'center', fontFamily: "'Fraunces', Georgia, serif", fontSize: isSm ? 12 : 15, lineHeight: 1.1, color: c.fg, fontWeight: 400, letterSpacing: -0.3 }}>{title}</div>
            {status && <div style={{ position: 'absolute', bottom: 6, left: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 7, letterSpacing: 1, textTransform: 'uppercase', color: c.fg, opacity: 0.7 }}>{status}</div>}
            {interactive && <div style={{ position: 'absolute', top: 7, right: 7, background: FV.brick, color: '#fffbf3', padding: '2px 5px', borderRadius: 3, fontFamily: 'Inter', fontSize: 7, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>✦ Inter</div>}
          </>
      }
    </div>
  );
}

// ─── Paletas de capa do perfil ────────────────────────────────────────────────
const COVER_PALETTES = [
  { id: 'plum-arches',    bg: '#6e2c52', fg: '#f3d4e0', name: 'Ameixa',     pat: 'arches' },
  { id: 'brick-hearts',   bg: '#d24a2e', fg: '#fce8df', name: 'Tijolo',     pat: 'hearts' },
  { id: 'moss-vines',     bg: '#3a6049', fg: '#d6e0b9', name: 'Musgo',      pat: 'vines' },
  { id: 'sky-waves',      bg: '#3a8aa8', fg: '#c4dde5', name: 'Céu',        pat: 'waves' },
  { id: 'ink-dots',       bg: '#1f1610', fg: '#f5e9cf', name: 'Tinta',      pat: 'dots' },
  { id: 'mustard-grid',   bg: '#e0a428', fg: '#2a1a00', name: 'Mostarda',   pat: 'grid' },
  { id: 'drama-deep',     bg: '#3a3548', fg: '#b8b0c8', name: 'Mistério',   pat: 'stars' },
  { id: 'lotr-runes',     bg: '#4a4528', fg: '#dec070', name: 'Terra-Média',pat: 'runes' },
];

function CoverPattern({ pat, fg, style = {} }) {
  const s = { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', ...style };
  if (pat === 'arches') return (
    <svg style={s} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
      <g stroke={fg} strokeWidth="0.6" fill="none" opacity="0.22">
        {[0,1,2,3,4].map(i => (
          <path key={i} d={`M${-20+i*90} 200 L${-20+i*90} 120 Q${30+i*90} 80 ${80+i*90} 120 L${80+i*90} 200`}/>
        ))}
      </g>
    </svg>
  );
  if (pat === 'hearts') return (
    <svg style={s} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
      {[[30,20],[90,55],[160,18],[230,48],[310,22],[370,58],[55,92],[135,125],[210,88],[285,118],[350,92],[70,158],[185,168],[265,152],[345,172]].map(([x,y],i) => (
        <path key={i} transform={`translate(${x} ${y}) scale(.5)`}
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={fg} opacity="0.2"/>
      ))}
    </svg>
  );
  if (pat === 'vines') return (
    <svg style={s} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
      <g stroke={fg} strokeWidth="0.7" fill="none" opacity="0.22">
        {[0,1,2,3,4].map(i => (
          <path key={i} d={`M${40+i*80} 0 Q${60+i*80} 50 ${40+i*80} 100 Q${20+i*80} 150 ${40+i*80} 200`}/>
        ))}
      </g>
      {[80,160,240,320].map((x,i) => (
        <circle key={i} cx={x} cy={i%2===0?60:140} r="3" fill={fg} opacity="0.2"/>
      ))}
    </svg>
  );
  if (pat === 'waves') return (
    <svg style={s} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
      {[...Array(6)].map((_,i) => (
        <path key={i} d={`M0 ${30+i*30} Q100 ${15+i*30} 200 ${30+i*30} T400 ${30+i*30}`}
          fill="none" stroke={fg} strokeWidth="0.6" opacity="0.22"/>
      ))}
    </svg>
  );
  if (pat === 'dots') return (
    <svg style={s} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
      <defs><pattern id={`pd-prof-${fg.replace('#','')}`} width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1.5" fill={fg} opacity="0.25"/></pattern></defs>
      <rect width="400" height="200" fill={`url(#pd-prof-${fg.replace('#','')})`}/>
    </svg>
  );
  if (pat === 'grid') return (
    <svg style={s} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
      <defs><pattern id={`pg-prof-${fg.replace('#','')}`} width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0v20H0" fill="none" stroke={fg} strokeWidth="0.4" opacity="0.3"/></pattern></defs>
      <rect width="400" height="200" fill={`url(#pg-prof-${fg.replace('#','')})`}/>
    </svg>
  );
  if (pat === 'stars') return (
    <svg style={s} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
      <g fill={fg} opacity="0.25">
        {[[40,30],[120,18],[200,42],[280,15],[350,35],[60,90],[160,75],[240,95],[320,65],[380,100],[30,155],[110,135],[200,160],[300,140],[370,165]].map(([cx,cy],i) => (
          <circle key={i} cx={cx} cy={cy} r={i%3===0?2.5:1.5}/>
        ))}
      </g>
    </svg>
  );
  if (pat === 'runes') return (
    <svg style={s} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
      <g stroke={fg} strokeWidth="0.8" fill="none" opacity="0.22">
        {[0,1,2,3,4].map(i => (
          <g key={i} transform={`translate(${30+i*80} 30)`}>
            <path d="M10 0 L10 40 L20 55 L10 70 L10 110"/>
            <path d="M0 25 L20 25 M0 55 L20 55"/>
          </g>
        ))}
      </g>
    </svg>
  );
  return null;
}

function CoverPickerModal({ current, onSelect, onClose }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(31,22,16,0.55)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}>
      <div style={{ background: '#fffbf3', borderRadius: 14, overflow: 'hidden', maxWidth: 520, width: '100%', boxShadow: '0 2px 4px rgba(80,40,15,.06), 0 12px 24px rgba(80,40,15,.10)' }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #e7d8b8' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#d24a2e', fontWeight: 700, marginBottom: 6 }}>
            Personalizar
          </div>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 24, fontWeight: 400, letterSpacing: -0.5, margin: 0, color: '#1f1610' }}>
            Cor + padrão da <em style={{ fontStyle: 'italic' }}>capa do perfil</em>
          </h2>
        </div>
        {/* Palette grid */}
        <div style={{ padding: '20px 28px 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {COVER_PALETTES.map(p => (
            <button key={p.id} onClick={() => { onSelect(p.id); onClose(); }}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                border: `2px solid ${current === p.id ? '#d24a2e' : hovered === p.id ? '#d2bd92' : '#e7d8b8'}`,
                borderRadius: 10, overflow: 'hidden', cursor: 'pointer', padding: 0,
                background: p.bg, position: 'relative', height: 80,
                transform: hovered === p.id ? 'scale(1.04)' : 'none',
                transition: 'transform .12s ease, border-color .12s ease',
                outline: 'none',
              }}>
              <CoverPattern pat={p.pat} fg={p.fg} />
              <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: p.fg, fontWeight: 700, opacity: 0.9 }}>
                {p.name}
              </div>
              {current === p.id && (
                <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: '#d24a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
        <div style={{ padding: '0 28px 20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e7d8b8', background: 'transparent', fontFamily: 'Inter', fontSize: 13, color: '#4d3f30', cursor: 'pointer' }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function numeralPt(n) {
  const map = {1:'Uma',2:'Duas',3:'Três',4:'Quatro',5:'Cinco',6:'Seis',7:'Sete',8:'Oito',9:'Nove',10:'Dez'};
  return map[n] || String(n);
}

function StatusDot({ status }) {
  const colors = { 'Completa': FV.moss, 'Em hiato': FV.inkMute, 'Em andamento': FV.mustard, 'Rascunho': FV.borderStrong };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: 12, color: FV.inkSoft, fontWeight: 500 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors[status] || FV.inkMute }} />
      {status}
    </span>
  );
}

// ─── Componente de edição de bio ─────────────────────────────────────────────
function BioEditor({ currentBio, onSaved }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentBio || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await userApi.updateBio(draft.trim());
      toast.success('Bio atualizada!');
      onSaved();
      setEditing(false);
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(currentBio || '');
    setEditing(false);
  };

  return (
    <div style={{ maxWidth: 600 }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 400, letterSpacing: -0.5, margin: 0, color: FV.ink }}>
          Sobre você
        </h2>
        {!editing && (
          <button
            onClick={() => { setDraft(currentBio || ''); setEditing(true); }}
            style={{
              padding: '7px 14px', borderRadius: 7, cursor: 'pointer',
              background: 'transparent', border: `1px solid ${FV.border}`,
              fontFamily: 'Inter', fontSize: 12.5, fontWeight: 500, color: FV.inkSoft,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Editar
          </button>
        )}
      </div>

      {/* Nota sobre a capa */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '12px 16px', borderRadius: 8, marginBottom: 20,
        background: FV.brickBg, border: `1px solid ${FV.brickSoft}`,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={FV.brick} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
        </svg>
        <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 13, color: FV.brickDeep, margin: 0, lineHeight: 1.5 }}>
          Essa frase aparece também na capa do seu perfil público, logo abaixo do seu nome.
        </p>
      </div>

      {editing ? (
        <div>
          <label style={{ display: 'block', fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: FV.ink, marginBottom: 8 }}>
            Bio / frase de apresentação
          </label>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            maxLength={280}
            rows={5}
            autoFocus
            placeholder='ex: "Escrevo sobre o que me faz sentir demais."'
            style={{
              width: '100%', padding: '12px 14px', boxSizing: 'border-box',
              border: `1px solid ${FV.border}`, borderRadius: 8,
              background: FV.paperAlt, outline: 'none', resize: 'vertical',
              fontFamily: "'Fraunces', Georgia, serif", fontSize: 16,
              fontStyle: 'italic', lineHeight: 1.6, color: FV.ink,
              transition: 'border-color .12s',
            }}
            onFocus={e => e.currentTarget.style.borderColor = FV.brick}
            onBlur={e => e.currentTarget.style.borderColor = FV.border}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: FV.inkMute }}>
              {draft.length}/280
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleCancel} style={{
                padding: '8px 16px', borderRadius: 7, cursor: 'pointer',
                background: 'transparent', border: `1px solid ${FV.border}`,
                fontFamily: 'Inter', fontSize: 13, color: FV.inkSoft,
              }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} style={{
                padding: '8px 18px', borderRadius: 7, cursor: saving ? 'wait' : 'pointer',
                background: FV.brick, color: '#fffbf3', border: 'none',
                fontFamily: 'Inter', fontSize: 13, fontWeight: 600,
                opacity: saving ? 0.7 : 1,
              }}>
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        currentBio ? (
          <div
            onClick={() => { setDraft(currentBio); setEditing(true); }}
            style={{
              fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic',
              fontSize: 17, lineHeight: 1.7, color: FV.inkSoft,
              padding: '16px 18px', borderRadius: 8, cursor: 'text',
              border: `1px solid ${FV.border}`, background: FV.surface,
              transition: 'border-color .12s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = FV.brick}
            onMouseLeave={e => e.currentTarget.style.borderColor = FV.border}
            title="Clique para editar"
          >
            "{currentBio}"
          </div>
        ) : (
          <div
            onClick={() => setEditing(true)}
            style={{
              padding: '40px 24px', textAlign: 'center',
              background: FV.paperAlt, borderRadius: 12,
              border: `2px dashed ${FV.border}`, cursor: 'pointer',
              transition: 'border-color .12s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = FV.brick}
            onMouseLeave={e => e.currentTarget.style.borderColor = FV.border}
          >
            <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', color: FV.inkMute, fontSize: 16, marginBottom: 10 }}>
              Você ainda não tem uma bio.
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 7,
              background: FV.brick, color: '#fffbf3',
              fontFamily: 'Inter', fontSize: 13, fontWeight: 600,
            }}>
              + Escrever agora
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState('obras');
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const avatarInputRef = useRef(null);

  const [coverPaletteId, setCoverPaletteId] = useState(
    () => localStorage.getItem(`cover_palette_${user?.user_id}`) || 'plum-arches'
  );
  const coverPalette = COVER_PALETTES.find(p => p.id === coverPaletteId) || COVER_PALETTES[0];

  const handleSelectPalette = useCallback((id) => {
    setCoverPaletteId(id);
    localStorage.setItem(`cover_palette_${user?.user_id}`, id);
  }, [user?.user_id]);

  const { data: myFanfics = [], isLoading: loadingFanfics } = useQuery({
    queryKey: ['my-fanfics', user?.user_id],
    queryFn: () => fanficApi.getByAuthor(user.user_id, true),
    enabled: !!user?.user_id,
  });

  const { data: favorites = [], isLoading: loadingFavorites } = useQuery({
    queryKey: ['favorites', user?.user_id],
    queryFn: () => fanficApi.getUserFavorites(),
    enabled: !!user?.user_id,
  });

  const { data: wallMessages = [], isLoading: loadingWall } = useQuery({
    queryKey: ['wall', user?.user_id],
    queryFn: () => wallApi.getMessages(user.user_id),
    enabled: !!user?.user_id,
  });

  const { data: myProfile } = useQuery({
    queryKey: ['user-me'],
    queryFn: () => userApi.getMe(),
    enabled: !!user?.user_id,
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file) => userApi.uploadAvatar(file),
    onSuccess: (data) => { updateUser({ avatar_url: data.avatar_url }); queryClient.invalidateQueries({ queryKey: ['user-me'] }); toast.success('Foto atualizada!'); },
    onError: (err) => toast.error(err.message),
  });

  const postMessageMutation = useMutation({
    mutationFn: (content) => wallApi.postMessage(user.user_id, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wall', user?.user_id] }),
    onError: () => toast.error('Erro ao publicar.'),
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (msgId) => wallApi.deleteMessage(msgId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wall', user?.user_id] }),
    onError: () => toast.error('Erro ao deletar.'),
  });

  const published = myFanfics.filter(f => !f.is_draft);
  const drafts    = myFanfics.filter(f => f.is_draft);
  const currentDraft = drafts[0];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/user/${user?.username}`)
      .then(() => toast.success('Link copiado!'))
      .catch(() => toast.error('Não foi possível copiar.'));
  };

  const avatarTones = ['#7e4862', '#5a8038', '#3a4a72', '#a25620', '#3a3548'];
  function getAvatarTone(name) {
    return avatarTones[(name?.charCodeAt(0) || 0) % avatarTones.length];
  }

  const TABS = [
    { id: 'obras',   label: 'Bibliografia', count: published.length },
    { id: 'mural',   label: 'Mural',        count: wallMessages.length },
    { id: 'estante', label: 'Estante',       count: favorites.length },
    { id: 'sobre',   label: 'Sobre' },
  ];

  return (
    <PageLayout fullWidth>
      {showCoverPicker && (
        <CoverPickerModal
          current={coverPaletteId}
          onSelect={handleSelectPalette}
          onClose={() => setShowCoverPicker(false)}
        />
      )}

      {/* HERO — cor+padrão dinâmico */}
      <div style={{ position: 'relative', overflow: 'hidden', background: coverPalette.bg }}>
        <CoverPattern pat={coverPalette.pat} fg={coverPalette.fg} />

        {/* Botão editar capa — canto superior direito */}
        <button
          onClick={() => setShowCoverPicker(true)}
          style={{
            position: 'absolute', top: 14, right: 16, zIndex: 10,
            padding: '6px 12px', borderRadius: 6,
            background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: coverPalette.fg, fontFamily: 'Inter', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.35)'}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Editar capa
        </button>

        <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto', padding: '48px 40px 36px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 28, alignItems: 'flex-end' }}>
          {/* Avatar — clicável para upload */}
          <div
            onClick={() => avatarInputRef.current?.click()}
            style={{ width: 120, height: 120, borderRadius: '50%', background: myProfile?.avatar_url ? 'transparent' : FV.brick, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces', Georgia, serif", fontSize: 52, fontWeight: 400, color: '#fffbf3', letterSpacing: -2, flexShrink: 0, boxShadow: '0 0 0 4px #f3d4e0, 0 0 0 6px rgba(110,44,82,0.4)', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
            title="Clique para alterar foto"
          >
            {myProfile?.avatar_url
              ? <img src={myProfile.avatar_url} alt={user?.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : user?.username?.charAt(0)?.toUpperCase()
            }
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >
              <span style={{ fontFamily: 'Inter', fontSize: 11, color: '#fff', fontWeight: 600 }}>Editar</span>
            </div>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadAvatarMutation.mutate(e.target.files[0])} />

          {/* Name + bio + stats */}
          <div style={{ color: coverPalette.fg }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.8, fontWeight: 700, marginBottom: 8 }}>
              Autora · {user?.username}
            </div>
            <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 'clamp(36px,5vw,60px)', fontWeight: 400, letterSpacing: -1.6, margin: 0, color: '#fffbf3', lineHeight: 0.95 }}>
              <span style={{ fontStyle: 'italic' }}>{user?.username}</span>
            </h1>
            {(myProfile?.bio) && (
              <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 17, marginTop: 12, color: coverPalette.fg, opacity: 0.9, maxWidth: 480, lineHeight: 1.5 }}>
                "{myProfile.bio}"
              </div>
            )}
            <div style={{ display: 'flex', gap: 18, marginTop: 18, fontFamily: 'Inter', fontSize: 13, color: coverPalette.fg, opacity: 0.9 }}>
              <span><b style={{ color: '#fffbf3' }}>{published.length}</b> obras</span>
              <span><b style={{ color: '#fffbf3' }}>{drafts.length}</b> rascunhos</span>
              <span><b style={{ color: '#fffbf3' }}>{favorites.length}</b> na estante</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'flex-start' }}>
            <button
              onClick={() => navigate(`/user/${user?.username}`)}
              style={{ padding: '10px 18px', background: FV.mustard, color: FV.ink, border: 'none', borderRadius: 8, fontFamily: 'Inter', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Ver perfil público
            </button>
            <button
              onClick={handleCopyLink}
              style={{ padding: '8px 14px', background: 'rgba(255,251,243,0.12)', color: '#fffbf3', border: '1px solid rgba(255,251,243,0.25)', borderRadius: 8, fontFamily: 'Inter', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            >
              Copiar link
            </button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${FV.border}`, padding: '0 40px', background: FV.paper, position: 'sticky', top: 0, zIndex: 5 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '16px 4px', marginRight: 32, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 13.5, fontWeight: tab === t.id ? 600 : 500, color: tab === t.id ? FV.brick : FV.inkSoft, borderBottom: tab === t.id ? `2px solid ${FV.brick}` : '2px solid transparent', marginBottom: -1, display: 'flex', alignItems: 'center', gap: 7 }}>
            {t.label}
            {t.count !== undefined && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: FV.inkMute }}>· {t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* BODY — 2 columns */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '36px 40px 80px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 36 }}>

        {/* MAIN */}
        <div>

          {/* ── OBRAS ── */}
          {tab === 'obras' && (
            loadingFanfics ? <LoadingSpinner /> : (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 28, fontWeight: 400, letterSpacing: -0.7, margin: 0, color: FV.ink }}>
                    <span style={{ fontStyle: 'italic', color: FV.brick }}>{published.length > 0 ? numeralPt(published.length) : 'Sem'}</span> histórias publicadas
                  </h2>
                  <Link to="/dashboard" style={{ padding: '8px 14px', background: FV.brick, color: '#fffbf3', borderRadius: 8, fontFamily: 'Inter', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    + Nova fanfic
                  </Link>
                </div>

                {published.length === 0 ? (
                  <div style={{ padding: '48px 24px', textAlign: 'center', background: FV.paperAlt, borderRadius: 12, border: `2px dashed ${FV.borderStrong}` }}>
                    <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', color: FV.inkMute, fontSize: 17, margin: '0 0 16px' }}>
                      Você ainda não publicou nenhuma história.
                    </p>
                    <Link to="/dashboard" style={{ padding: '10px 20px', background: FV.brick, color: '#fffbf3', borderRadius: 8, fontFamily: 'Inter', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                      Criar minha primeira fanfic
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
                    {published.map(f => {
                      const status = f.is_complete ? 'Completa' : f.is_hiatus ? 'Em hiato' : 'Em andamento';
                      return (
                        <div key={f.id} style={{ background: FV.surface, border: `1px solid ${FV.border}`, borderRadius: 8, overflow: 'hidden' }}>
                          <Link to={`/fanfic/${f.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                            <Cover title={f.title} category={f.category} interactive={f.interactive_mode} status={status} coverUrl={f.cover_url ? fanficApi.getAssetUrl(f.cover_url) : null} />
                          </Link>
                          <div style={{ padding: '12px 14px' }}>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: getCat(f.category).bg, marginBottom: 5, fontWeight: 700 }}>
                              {getCat(f.category).label}
                            </div>
                            <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 17, fontWeight: 400, letterSpacing: -0.3, margin: '0 0 8px', color: FV.ink, lineHeight: 1.15 }}>{f.title}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <StatusDot status={status} />
                              {f.interactive_mode && (
                                <span style={{ padding: '2px 7px', borderRadius: 3, background: FV.mustardBg, color: '#7a5a14', fontFamily: 'Inter', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                  interativa
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${FV.border}` }}>
                              <Link to={`/fanfic/${f.id}`} style={{ fontFamily: 'Inter', fontSize: 11.5, color: FV.inkMute, textDecoration: 'none' }}>Ver pública →</Link>
                              <Link to={`/dashboard?fanficId=${f.id}`} style={{ fontFamily: 'Inter', fontSize: 11.5, color: FV.brick, fontWeight: 600, textDecoration: 'none' }}>Editar →</Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Rascunhos */}
                {drafts.length > 0 && (
                  <div style={{ marginTop: 36 }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: 1.8, textTransform: 'uppercase', color: FV.inkMute, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ flex: 1, height: 1, background: FV.border }} />
                      Rascunhos · {drafts.length}
                      <span style={{ flex: 1, height: 1, background: FV.border }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {drafts.map(f => (
                        <Link key={f.id} to={`/dashboard?fanficId=${f.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: FV.surface, border: `1px solid ${FV.border}`, borderRadius: 8, textDecoration: 'none', color: FV.ink }}>
                          <div style={{ width: 36, height: 54, borderRadius: 4, background: getCat(f.category).bg, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 17, fontWeight: 400, letterSpacing: -0.3, color: FV.ink, lineHeight: 1.15 }}>{f.title || 'Sem título'}</div>
                            <div style={{ fontFamily: 'Inter', fontSize: 12, color: FV.inkMute, marginTop: 3 }}>{getCat(f.category).label} · Rascunho</div>
                          </div>
                          <span style={{ fontFamily: 'Inter', fontSize: 12, color: FV.brick, fontWeight: 600 }}>Continuar →</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {/* ── MURAL ── */}
          {tab === 'mural' && (
            loadingWall ? <LoadingSpinner /> : (
              <div>
                <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 28, fontWeight: 400, letterSpacing: -0.7, margin: '0 0 18px', color: FV.ink }}>
                  Mural <span style={{ fontStyle: 'italic', color: FV.brick }}>completo</span>
                </h2>
                <div style={{ background: FV.surface, border: `1px solid ${FV.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  {wallMessages.length === 0 && (
                    <p style={{ padding: '32px', textAlign: 'center', fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', color: FV.inkMute }}>Nenhuma mensagem ainda.</p>
                  )}
                  {wallMessages.map((msg, i) => (
                    <div key={msg.id} style={{ padding: '20px 24px', borderTop: i === 0 ? 'none' : `1px solid ${FV.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: getAvatarTone(msg.author_username), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, color: '#fffbf3', flexShrink: 0 }}>
                          {msg.author_username?.charAt(0)?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'Inter', fontSize: 13.5, color: FV.ink, fontWeight: 600 }}>{msg.author_username}</div>
                        </div>
                        <button onClick={() => deleteMessageMutation.mutate(msg.id)} style={{ background: 'none', border: 'none', color: FV.inkMute, cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}>✕</button>
                      </div>
                      <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, lineHeight: 1.55, color: FV.ink, margin: 0 }}>{msg.content}</p>
                    </div>
                  ))}
                  {/* Post form */}
                  <form onSubmit={async e => { e.preventDefault(); const t = e.target.elements.msg.value.trim(); if (!t) return; await postMessageMutation.mutateAsync(t); e.target.reset(); }} style={{ padding: '16px 24px', borderTop: `1px solid ${FV.border}` }}>
                    <textarea name="msg" placeholder="Escreva um post..." style={{ width: '100%', padding: '10px 12px', border: `1px solid ${FV.border}`, borderRadius: 8, fontFamily: "'Fraunces', Georgia, serif", fontSize: 14, resize: 'vertical', minHeight: 80, outline: 'none', boxSizing: 'border-box', background: FV.paper, color: FV.ink }} />
                    <button type="submit" style={{ marginTop: 8, padding: '9px 18px', background: FV.brick, color: '#fffbf3', border: 'none', borderRadius: 8, fontFamily: 'Inter', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Publicar
                    </button>
                  </form>
                </div>
              </div>
            )
          )}

          {/* ── ESTANTE ── */}
          {tab === 'estante' && (
            loadingFavorites ? <LoadingSpinner /> : (
              <div>
                <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 28, fontWeight: 400, letterSpacing: -0.7, margin: '0 0 8px', color: FV.ink }}>
                  <span style={{ fontStyle: 'italic', color: FV.brick }}>Estante</span> de leitura
                </h2>
                <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 15, color: FV.inkMute, margin: '0 0 24px' }}>
                  Fanfics que você salvou, está lendo ou quer ler.
                </p>
                {favorites.length === 0 ? (
                  <div style={{ padding: '48px 24px', textAlign: 'center', background: FV.paperAlt, borderRadius: 12, border: `2px dashed ${FV.borderStrong}` }}>
                    <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', color: FV.inkMute, fontSize: 17, margin: '0 0 16px' }}>
                      Sua estante está vazia.
                    </p>
                    <Link to="/explore" style={{ padding: '10px 20px', background: FV.brick, color: '#fffbf3', borderRadius: 8, fontFamily: 'Inter', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                      Explorar histórias
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    {favorites.map(f => (
                      <Link key={f.id} to={`/fanfic/${f.id}`} style={{ textDecoration: 'none', color: FV.ink }}>
                        <Cover title={f.title} category={f.category} coverUrl={f.cover_url ? fanficApi.getAssetUrl(f.cover_url) : null} />
                        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 14, color: FV.ink, marginTop: 8, lineHeight: 1.2, fontWeight: 400, letterSpacing: -0.2 }}>{f.title}</div>
                        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 11.5, color: FV.inkMute, marginTop: 2 }}>
                          por {f.author_username || 'Autor'}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          )}

          {/* ── SOBRE ── */}
          {tab === 'sobre' && (
            <BioEditor currentBio={myProfile?.bio} onSaved={() => queryClient.invalidateQueries({ queryKey: ['user-me'] })} />
          )}
        </div>

        {/* ── SIDEBAR DIREITA ── */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Mural preview */}
          <div style={{ background: FV.surface, border: `1px solid ${FV.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', background: FV.brickBg, borderBottom: `1px solid ${FV.brickSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: FV.brick, fontWeight: 700 }}>
                ★ Mural · {wallMessages.length} posts
              </div>
              <button onClick={() => setTab('mural')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, color: FV.brick, fontWeight: 600 }}>Ver tudo</button>
            </div>
            {wallMessages.length === 0 ? (
              <p style={{ padding: '16px 18px', fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', color: FV.inkMute, fontSize: 13, margin: 0 }}>Nenhuma mensagem ainda.</p>
            ) : wallMessages.slice(0, 3).map((msg, i) => (
              <div key={msg.id} style={{ padding: '12px 18px', borderTop: i === 0 ? 'none' : `1px solid ${FV.border}` }}>
                <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: FV.ink, fontWeight: 600, marginBottom: 4 }}>{msg.author_username}</div>
                <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 13, lineHeight: 1.5, color: FV.inkSoft, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {msg.content}
                </p>
              </div>
            ))}
          </div>

          {/* Escrevendo agora — mostra o rascunho mais recente */}
          {currentDraft && (
            <div style={{ background: FV.mossBg, border: `1px solid ${FV.mossSoft}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: FV.moss, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={FV.moss} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><path d="M16 8L2 22"/><path d="M17.5 15H9"/>
                </svg>
                Escrevendo agora
              </div>
              <Link to={`/dashboard?fanficId=${currentDraft.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 18, fontWeight: 400, letterSpacing: -0.3, color: FV.ink, lineHeight: 1.2, marginBottom: 4 }}>
                  <span style={{ fontStyle: 'italic' }}>{currentDraft.title || 'Sem título'}</span>
                </div>
              </Link>
              <div style={{ height: 4, background: FV.mossSoft, borderRadius: 2, overflow: 'hidden', marginTop: 12 }}>
                <div style={{ width: '45%', height: '100%', background: FV.moss }} />
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: FV.moss, marginTop: 6, letterSpacing: 0.3 }}>
                Rascunho em andamento
              </div>
            </div>
          )}

          {/* Tags da autora — derivadas das fanfics */}
          {published.length > 0 && (
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: FV.brick, fontWeight: 700, marginBottom: 12 }}>
                ★ Universos da autora
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[...new Set(published.map(f => getCat(f.category).label).filter(Boolean))].map(label => (
                  <span key={label} style={{ padding: '5px 11px', fontFamily: 'Inter', fontSize: 12, color: FV.inkSoft, border: `1px solid ${FV.border}`, borderRadius: 999, background: FV.surface, fontWeight: 500 }}>
                    {label}
                  </span>
                ))}
                {published.some(f => f.interactive_mode) && (
                  <span style={{ padding: '5px 11px', fontFamily: 'Inter', fontSize: 12, color: FV.brickDeep, border: `1px solid ${FV.brickSoft}`, borderRadius: 999, background: FV.brickBg, fontWeight: 500 }}>
                    interativa
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Link para o painel */}
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: FV.surface, border: `1px solid ${FV.border}`, borderRadius: 8, textDecoration: 'none', color: FV.ink }}>
            <div>
              <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 16, fontWeight: 400, letterSpacing: -0.3 }}>Ir para a oficina</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: FV.inkMute, marginTop: 2 }}>Editor · publicações · rascunhos</div>
            </div>
            <span style={{ color: FV.brick, fontSize: 18 }}>→</span>
          </Link>
        </aside>
      </div>
    </PageLayout>
  );
}
