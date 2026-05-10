import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  mustard: '#e0a428', mustardBg: '#fcefc7',
  plum: '#6e2c52', plumSoft: '#e8c8d6', plumBg: '#f7e0eb',
  sky: '#3a8aa8',
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

function Cover({ title, category, interactive, coverUrl }) {
  const c = getCat(category);
  const [imgErr, setImgErr] = useState(false);
  return (
    <div style={{ width: '100%', aspectRatio: '2/3', background: c.bg, position: 'relative', overflow: 'hidden', borderRadius: 6, boxShadow: '0 1px 2px rgba(80,40,15,.05), 0 4px 12px rgba(80,40,15,.06)' }}>
      {coverUrl && !imgErr
        ? <img src={coverUrl} alt={title} onError={() => setImgErr(true)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <>
            <div style={{ position: 'absolute', top: 8, left: 0, right: 0, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 7, letterSpacing: 2, textTransform: 'uppercase', color: c.fg, opacity: 0.8 }}>{c.label}</div>
            <div style={{ position: 'absolute', bottom: '20%', left: 10, right: 10, textAlign: 'center', fontFamily: "'Fraunces', Georgia, serif", fontSize: 14, lineHeight: 1.1, color: c.fg, fontWeight: 400, letterSpacing: -0.3 }}>{title}</div>
            {interactive && <div style={{ position: 'absolute', top: 7, right: 7, background: '#d24a2e', color: '#fffbf3', padding: '2px 5px', borderRadius: 3, fontFamily: 'Inter', fontSize: 7, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>✦ Inter</div>}
          </>
      }
    </div>
  );
}

function WallPostForm({ onSubmit }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try { await onSubmit(text.trim()); setText(''); }
    finally { setLoading(false); }
  };
  return (
    <form onSubmit={handleSubmit} style={{ padding: '16px 24px', borderTop: `1px solid ${FV.border}` }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Deixe uma mensagem no mural..."
        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${FV.border}`, borderRadius: 8, fontFamily: "'Fraunces', Georgia, serif", fontSize: 14, resize: 'vertical', minHeight: 80, outline: 'none', boxSizing: 'border-box', background: FV.paper, color: FV.ink }}
      />
      <button type="submit" disabled={loading || !text.trim()} style={{ marginTop: 8, padding: '9px 18px', background: FV.brick, color: '#fffbf3', border: 'none', borderRadius: 8, fontFamily: 'Inter', fontSize: 13, fontWeight: 600, cursor: loading || !text.trim() ? 'not-allowed' : 'pointer', opacity: loading || !text.trim() ? 0.6 : 1 }}>
        {loading ? 'Enviando...' : 'Publicar'}
      </button>
    </form>
  );
}

export default function PublicProfilePage() {
  const { username } = useParams();
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('obras');

  const { data: profile, isLoading: loadingProfile, isError } = useQuery({
    queryKey: ['public-profile', username],
    queryFn: () => userApi.getPublicProfile(username),
  });

  const { data: fanfics = [], isLoading: loadingFanfics } = useQuery({
    queryKey: ['author-fanfics', profile?.id],
    queryFn: () => fanficApi.getByAuthor(profile.id, false),
    enabled: !!profile?.id,
  });

  const { data: wallMessages = [], isLoading: loadingWall } = useQuery({
    queryKey: ['wall', profile?.id],
    queryFn: () => wallApi.getMessages(profile.id),
    enabled: !!profile?.id,
  });

  const isOwnProfile = isAuthenticated && user?.username === username;

  const blockMutation = useMutation({
    mutationFn: () => userApi.blockUser(profile.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['public-profile', username] }); toast.success('Usuário bloqueado.'); },
    onError: () => toast.error('Erro ao bloquear usuário.'),
  });

  const unblockMutation = useMutation({
    mutationFn: () => userApi.unblockUser(profile.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['public-profile', username] }); toast.success('Usuário desbloqueado.'); },
    onError: () => toast.error('Erro ao desbloquear usuário.'),
  });

  const postMessageMutation = useMutation({
    mutationFn: (content) => wallApi.postMessage(profile.id, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wall', profile?.id] }),
    onError: () => toast.error('Erro ao publicar mensagem.'),
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (msgId) => wallApi.deleteMessage(msgId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wall', profile?.id] }),
    onError: () => toast.error('Erro ao deletar mensagem.'),
  });

  if (loadingProfile) return <PageLayout><LoadingSpinner fullPage /></PageLayout>;
  if (isError || !profile) {
    return (
      <PageLayout>
        <div style={{ padding: '80px 40px', textAlign: 'center', fontFamily: "'Fraunces', Georgia, serif", color: FV.inkMute }}>
          <p style={{ fontSize: 20, fontStyle: 'italic', marginBottom: 16 }}>Usuário não encontrado.</p>
          <Link to="/explore" style={{ color: FV.brick, textDecoration: 'none', fontWeight: 500 }}>Explorar histórias →</Link>
        </div>
      </PageLayout>
    );
  }

  const publishedFanfics = fanfics.filter(f => !f.is_draft);

  const TABS = [
    { id: 'obras',   label: 'Bibliografia', count: publishedFanfics.length },
    { id: 'mural',   label: 'Mural',        count: wallMessages.length },
    { id: 'estante', label: 'Estante' },
    { id: 'sobre',   label: 'Sobre' },
  ];

  const avatarTones = ['#7e4862','#5a8038','#3a4a72','#a25620','#3a3548'];
  function avatarTone(name) {
    const i = (name?.charCodeAt(0) || 0) % avatarTones.length;
    return avatarTones[i];
  }

  return (
    <PageLayout fullWidth>
      {/* PLUM HERO */}
      <div style={{ position: 'relative', overflow: 'hidden', background: FV.plum }}>
        {/* Arches pattern */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.2 }} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
          <g stroke="#f3d4e0" strokeWidth="0.6" fill="none">
            {[0,1,2,3,4].map(i => (
              <path key={i} d={`M${-20 + i * 90} 200 L${-20 + i * 90} 120 Q${30 + i * 90} 80 ${80 + i * 90} 120 L${80 + i * 90} 200`} />
            ))}
          </g>
        </svg>
        <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto', padding: '48px 40px 36px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 28, alignItems: 'flex-end' }}>
          {/* Avatar */}
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: FV.brick, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces', Georgia, serif", fontSize: 52, fontWeight: 400, color: '#fffbf3', letterSpacing: -2, flexShrink: 0, boxShadow: '0 0 0 4px #f3d4e0, 0 0 0 6px rgba(110,44,82,0.4)' }}>
            {profile.username?.charAt(0)?.toUpperCase()}
          </div>

          {/* Name + bio + stats */}
          <div style={{ color: '#f3d4e0' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.8, fontWeight: 700, marginBottom: 8 }}>
              Autora · {profile.username}
            </div>
            <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 'clamp(36px,5vw,60px)', fontWeight: 400, letterSpacing: -1.6, margin: 0, color: '#fffbf3', lineHeight: 0.95 }}>
              <span style={{ fontStyle: 'italic' }}>{profile.username}</span>
            </h1>
            {profile.bio && (
              <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 17, marginTop: 12, color: '#f3d4e0', opacity: 0.9, maxWidth: 480, lineHeight: 1.5 }}>
                "{profile.bio}"
              </div>
            )}
            <div style={{ display: 'flex', gap: 18, marginTop: 18, fontFamily: 'Inter', fontSize: 13, color: '#f3d4e0', opacity: 0.9 }}>
              <span><b style={{ color: '#fffbf3' }}>{publishedFanfics.length}</b> obras</span>
              {profile.followers_count !== undefined && <span><b style={{ color: '#fffbf3' }}>{profile.followers_count}</b> seguidoras</span>}
            </div>
          </div>

          {/* Actions */}
          {!isOwnProfile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'flex-start' }}>
              <button style={{ padding: '10px 18px', background: FV.mustard, color: FV.ink, border: 'none', borderRadius: 8, fontFamily: 'Inter', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                + Seguir
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => profile.is_blocked ? unblockMutation.mutate() : blockMutation.mutate()}
                  style={{ padding: '8px 14px', background: 'rgba(255,251,243,0.12)', color: '#fffbf3', border: '1px solid rgba(255,251,243,0.25)', borderRadius: 8, fontFamily: 'Inter', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                >
                  {profile.is_blocked ? 'Desbloquear' : 'Bloquear'}
                </button>
              )}
            </div>
          )}
          {isOwnProfile && (
            <Link to="/profile" style={{ padding: '10px 18px', background: 'rgba(255,251,243,0.15)', color: '#fffbf3', border: '1px solid rgba(255,251,243,0.3)', borderRadius: 8, fontFamily: 'Inter', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
              Editar perfil
            </Link>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${FV.border}`, padding: '0 40px', background: FV.paper, position: 'sticky', top: 0, zIndex: 5 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '16px 4px', marginRight: 32, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 13.5, fontWeight: tab === t.id ? 600 : 500, color: tab === t.id ? FV.brick : FV.inkSoft, borderBottom: tab === t.id ? `2px solid ${FV.brick}` : '2px solid transparent', marginBottom: -1, display: 'flex', alignItems: 'center', gap: 8 }}>
            {t.label}
            {t.count !== undefined && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: FV.inkMute }}>· {t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* BODY */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '36px 40px 80px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 36 }}>

        {/* MAIN TAB CONTENT */}
        <div>
          {/* OBRAS */}
          {tab === 'obras' && (
            loadingFanfics ? <LoadingSpinner /> : (
              <div>
                <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 28, fontWeight: 400, letterSpacing: -0.7, margin: '0 0 20px', color: FV.ink }}>
                  <span style={{ fontStyle: 'italic', color: FV.brick }}>{publishedFanfics.length > 0 ? publishedFanfics.length : 'Sem'}</span> histórias publicadas
                </h2>
                {publishedFanfics.length === 0 ? (
                  <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', color: FV.inkMute, fontSize: 16 }}>Nenhuma obra publicada ainda.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
                    {publishedFanfics.map(f => {
                      const c = getCat(f.category);
                      return (
                        <Link key={f.id} to={`/fanfic/${f.id}`} style={{ background: FV.surface, border: `1px solid ${FV.border}`, borderRadius: 8, overflow: 'hidden', textDecoration: 'none', color: FV.ink, display: 'flex', flexDirection: 'column' }}>
                          <Cover title={f.title} category={f.category} interactive={f.interactive_mode} status={f.is_complete ? 'Completa' : f.is_hiatus ? 'Em hiato' : 'Em andamento'} coverUrl={f.cover_url ? fanficApi.getAssetUrl(f.cover_url) : null} />
                          <div style={{ padding: '12px 14px' }}>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: c.bg, marginBottom: 5, fontWeight: 700 }}>{c.label}</div>
                            <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 17, fontWeight: 400, letterSpacing: -0.3, margin: '0 0 6px', color: FV.ink, lineHeight: 1.15 }}>{f.title}</h3>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: FV.inkMute, letterSpacing: 0.4 }}>
                              {f.chapter_count || 0} caps · {f.is_complete ? 'Completa' : f.is_hiatus ? 'Em hiato' : 'Em andamento'}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          )}

          {/* MURAL */}
          {tab === 'mural' && (
            loadingWall ? <LoadingSpinner /> : (
              <div>
                <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 28, fontWeight: 400, letterSpacing: -0.7, margin: '0 0 18px', color: FV.ink }}>
                  Mural <span style={{ fontStyle: 'italic', color: FV.brick }}>completo</span>
                </h2>
                <div style={{ background: FV.surface, border: `1px solid ${FV.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  {wallMessages.length === 0 && (
                    <p style={{ padding: '32px 24px', textAlign: 'center', fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', color: FV.inkMute }}>Nenhuma mensagem ainda.</p>
                  )}
                  {wallMessages.map((msg, i) => (
                    <div key={msg.id} style={{ padding: '20px 24px', borderTop: i === 0 ? 'none' : `1px solid ${FV.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarTone(msg.author_username), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, color: '#fffbf3', flexShrink: 0 }}>
                          {msg.author_username?.charAt(0)?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'Inter', fontSize: 13.5, color: FV.ink, fontWeight: 600 }}>{msg.author_username}</div>
                        </div>
                        {(isOwnProfile || user?.username === msg.author_username) && (
                          <button onClick={() => deleteMessageMutation.mutate(msg.id)} style={{ background: 'none', border: 'none', color: FV.inkMute, cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}>✕</button>
                        )}
                      </div>
                      <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, lineHeight: 1.55, color: FV.ink, margin: 0 }}>{msg.content}</p>
                    </div>
                  ))}
                  {isAuthenticated && !isOwnProfile && (
                    <WallPostForm onSubmit={(content) => postMessageMutation.mutateAsync(content)} />
                  )}
                </div>
              </div>
            )
          )}

          {/* ESTANTE */}
          {tab === 'estante' && (
            <div>
              <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 28, fontWeight: 400, letterSpacing: -0.7, margin: '0 0 8px', color: FV.ink }}>
                <span style={{ fontStyle: 'italic', color: FV.brick }}>Estante</span> de leitura
              </h2>
              <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 15, color: FV.inkMute, margin: '0 0 24px' }}>
                O que {profile.username} está lendo, salvou e recomendou.
              </p>
              <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', color: FV.inkMute, fontSize: 15 }}>
                A estante pública estará disponível em breve.
              </p>
            </div>
          )}

          {/* SOBRE */}
          {tab === 'sobre' && (
            <div style={{ maxWidth: 600 }}>
              <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 28, fontWeight: 400, letterSpacing: -0.7, margin: '0 0 18px', color: FV.ink }}>
                Sobre <span style={{ fontStyle: 'italic', color: FV.brick }}>{profile.username}</span>
              </h2>
              {profile.bio ? (
                <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 16, lineHeight: 1.7, color: FV.inkSoft }}>{profile.bio}</p>
              ) : (
                <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', color: FV.inkMute }}>Sem bio ainda.</p>
              )}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Mural preview */}
          <div style={{ background: FV.surface, border: `1px solid ${FV.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', background: FV.brickBg, borderBottom: `1px solid ${FV.brickSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: FV.brick, fontWeight: 700 }}>★ Mural · {wallMessages.length} posts</div>
              <button onClick={() => setTab('mural')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, color: FV.brick, fontWeight: 600 }}>Ver tudo</button>
            </div>
            {wallMessages.length === 0 ? (
              <p style={{ padding: '16px 18px', fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', color: FV.inkMute, fontSize: 13, margin: 0 }}>Nenhuma mensagem ainda.</p>
            ) : wallMessages.slice(0, 3).map((msg, i) => (
              <div key={msg.id} style={{ padding: '12px 18px', borderTop: i === 0 ? 'none' : `1px solid ${FV.border}` }}>
                <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: FV.ink, fontWeight: 600, marginBottom: 4 }}>{msg.author_username}</div>
                <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 13, lineHeight: 1.5, color: FV.inkSoft, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{msg.content}</p>
              </div>
            ))}
          </div>

          {/* Obras na sidebar — miniaturas de capa */}
          {publishedFanfics.length > 0 && (
            <div style={{ background: FV.surface, border: `1px solid ${FV.border}`, borderRadius: 8, padding: '18px' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: FV.inkMute, fontWeight: 700, marginBottom: 14 }}>
                ★ Obras publicadas
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {publishedFanfics.slice(0, 6).map(f => (
                  <Link key={f.id} to={`/fanfic/${f.id}`} style={{ textDecoration: 'none' }}>
                    <Cover title={f.title} category={f.category} interactive={f.interactive_mode} coverUrl={f.cover_url ? fanficApi.getAssetUrl(f.cover_url) : null} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Escrevendo agora — se a autora tiver rascunho visível */}
          <div style={{ background: FV.mossBg, border: `1px solid ${FV.mossSoft}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: FV.moss, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={FV.moss} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><path d="M16 8L2 22"/><path d="M17.5 15H9"/>
              </svg>
              Escrevendo agora
            </div>
            {publishedFanfics.length > 0 ? (
              <>
                <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 17, fontWeight: 400, letterSpacing: -0.3, color: FV.ink, lineHeight: 1.2 }}>
                  <span style={{ fontStyle: 'italic' }}>{publishedFanfics[0].title}</span>
                </div>
                <div style={{ height: 4, background: FV.mossSoft, borderRadius: 2, overflow: 'hidden', marginTop: 12 }}>
                  <div style={{ width: '68%', height: '100%', background: FV.moss }} />
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: FV.moss, marginTop: 6, letterSpacing: 0.3 }}>
                  Em andamento
                </div>
              </>
            ) : (
              <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', color: FV.inkMute, fontSize: 13, margin: 0 }}>
                Nada em andamento no momento.
              </p>
            )}
          </div>

          {/* Tags da autora */}
          {publishedFanfics.length > 0 && (
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: FV.brick, fontWeight: 700, marginBottom: 12 }}>
                ★ Universos da autora
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[...new Set(publishedFanfics.map(f => getCat(f.category).label).filter(Boolean))].map(label => (
                  <span key={label} style={{ padding: '5px 11px', fontFamily: 'Inter', fontSize: 12, color: FV.inkSoft, border: `1px solid ${FV.border}`, borderRadius: 999, background: FV.surface, fontWeight: 500 }}>
                    {label}
                  </span>
                ))}
                {publishedFanfics.some(f => f.interactive_mode) && (
                  <span style={{ padding: '5px 11px', fontFamily: 'Inter', fontSize: 12, color: FV.brickDeep, border: `1px solid ${FV.brickSoft}`, borderRadius: 999, background: FV.brickBg, fontWeight: 500 }}>
                    interativa
                  </span>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </PageLayout>
  );
}
