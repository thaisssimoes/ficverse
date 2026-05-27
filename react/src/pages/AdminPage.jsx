import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import PageLayout from '../components/layout/PageLayout';

// ─── Design tokens ────────────────────────────────────────────────────────────
const FV = {
  paper: '#fbf3e2', paperAlt: '#f5e9d0', surface: '#fffbf3',
  ink: '#1f1610', inkSoft: '#4d3f30', inkMute: '#8c7a62',
  border: '#e7d8b8', borderStrong: '#d2bd92',
  brick: '#d24a2e', brickBg: '#fce8df', brickSoft: '#fad6cc', onBrick: '#fffbf3',
  moss: '#5a8038', mossBg: '#ecf2da', mossSoft: '#d6e0b9',
  mustard: '#e0a428', mustardBg: '#fcefc7', mustardSoft: '#f5dfa3',
  plum: '#6e2c52', plumBg: '#f7e0eb', plumSoft: '#e8c8d6',
  sky: '#3a8aa8', skyBg: '#e2eef3',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, tone, icon }) {
  return (
    <div style={{
      background: FV.surface, border: `1px solid ${FV.border}`,
      borderRadius: 12, padding: '20px 24px',
      borderLeft: `4px solid ${tone}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: FV.inkMute, fontWeight: 700 }}>
          {label}
        </div>
        <div style={{ fontSize: 20 }}>{icon}</div>
      </div>
      <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 38, fontWeight: 400, fontStyle: 'italic', color: tone, lineHeight: 1, letterSpacing: -0.5 }}>
        {value ?? '—'}
      </div>
    </div>
  );
}

function SectionHead({ kicker, title }) {
  return (
    <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${FV.border}` }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: FV.brick, fontWeight: 700, marginBottom: 4 }}>
        {kicker}
      </div>
      <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 400, letterSpacing: -0.5, margin: 0, color: FV.ink }}>
        {title}
      </h2>
    </div>
  );
}

function Pill({ children, color, bg }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 9px', borderRadius: 999,
      background: bg, color, fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>
      {children}
    </span>
  );
}

// ─── Abas ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Visão geral' },
  { id: 'users',     label: 'Usuárias' },
  { id: 'fanfics',   label: 'Fanfics' },
  { id: 'reports',   label: 'Denúncias' },
];

// ─── Tab: Overview ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
    retry: false,
  });

  const statCards = [
    { label: 'Usuárias',    value: stats?.total_users,    tone: FV.plum,    icon: '👤' },
    { label: 'Fanfics',     value: stats?.total_fanfics,  tone: FV.brick,   icon: '📖' },
    { label: 'Capítulos',   value: stats?.total_chapters, tone: FV.moss,    icon: '✍️' },
    { label: 'Comentários', value: stats?.total_comments, tone: FV.mustard, icon: '💬' },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div style={{ background: FV.mustardBg, border: `1px solid ${FV.mustardSoft}`, borderRadius: 12, padding: '20px 24px' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a5a14', fontWeight: 700, marginBottom: 6 }}>
          Nota
        </div>
        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, color: FV.inkSoft, lineHeight: 1.5 }}>
          Algumas métricas dependem de endpoints <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, background: FV.mustardSoft, padding: '1px 5px', borderRadius: 3 }}>/admin/*</code> no backend Go. Ative-os para ver dados reais.
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Usuárias ─────────────────────────────────────────────────────────────
function UsersTab() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: res, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => adminApi.getUsers({ page, search }),
    retry: false,
  });

  const users = Array.isArray(res?.users) ? res.users : [];
  const total = res?.total ?? 0;

  const banMutation = useMutation({
    mutationFn: ({ userId, ban }) => ban ? adminApi.banUser(userId) : adminApi.unbanUser(userId),
    onSuccess: (_, { ban }) => {
      toast.success(ban ? 'Usuária banida.' : 'Usuária desbanida.');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const makeAdminMutation = useMutation({
    mutationFn: (userId) => adminApi.setAdmin(userId, true),
    onSuccess: () => { toast.success('Permissão de admin concedida.'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div>
      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: FV.surface, border: `1px solid ${FV.border}`, borderRadius: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={FV.inkMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nome ou email…"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'Inter', fontSize: 13.5, color: FV.ink }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: FV.surface, border: `1px solid ${FV.border}`, borderRadius: 8, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 120px 140px', gap: 16, padding: '10px 18px', background: FV.paperAlt, borderBottom: `1px solid ${FV.border}` }}>
          {['Usuária', 'Email', 'Status', 'Ações'].map(h => (
            <div key={h} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: FV.inkMute, fontWeight: 700 }}>
              {h}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: '32px', textAlign: 'center', fontFamily: 'Inter', fontSize: 14, color: FV.inkMute }}>
            Carregando…
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 15, color: FV.inkMute }}>
            Nenhuma usuária encontrada.
          </div>
        ) : users.map((u, i) => (
          <div key={u.id} style={{
            display: 'grid', gridTemplateColumns: '1fr 200px 120px 140px', gap: 16,
            padding: '12px 18px', alignItems: 'center',
            borderTop: i === 0 ? 'none' : `1px solid ${FV.border}`,
          }}>
            <div>
              <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, fontWeight: 400, color: FV.ink, marginBottom: 2 }}>
                {u.username}
              </div>
              <Link to={`/user/${u.username}`} style={{ fontFamily: 'Inter', fontSize: 11.5, color: FV.brick, textDecoration: 'none' }}>
                Ver perfil →
              </Link>
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: FV.inkSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {u.email}
            </div>
            <div>
              {u.is_banned
                ? <Pill color="#a23320" bg={FV.brickBg}>Banida</Pill>
                : u.is_admin
                  ? <Pill color={FV.plum} bg={FV.plumBg}>Admin</Pill>
                  : <Pill color={FV.moss} bg={FV.mossBg}>Ativa</Pill>
              }
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => banMutation.mutate({ userId: u.id, ban: !u.is_banned })}
                disabled={u.is_admin}
                style={{
                  padding: '5px 10px', borderRadius: 6, cursor: u.is_admin ? 'not-allowed' : 'pointer',
                  background: u.is_banned ? FV.mossBg : FV.brickBg,
                  color: u.is_banned ? FV.moss : FV.brick,
                  border: `1px solid ${u.is_banned ? FV.mossSoft : FV.brickSoft}`,
                  fontFamily: 'Inter', fontSize: 11.5, fontWeight: 600,
                  opacity: u.is_admin ? 0.4 : 1,
                }}>
                {u.is_banned ? 'Desbanir' : 'Banir'}
              </button>
              {!u.is_admin && (
                <button
                  onClick={() => makeAdminMutation.mutate(u.id)}
                  style={{
                    padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
                    background: FV.plumBg, color: FV.plum,
                    border: `1px solid ${FV.plumSoft}`,
                    fontFamily: 'Inter', fontSize: 11.5, fontWeight: 600,
                  }}>
                  Admin
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${FV.border}`, background: FV.surface, cursor: 'pointer', fontFamily: 'Inter', fontSize: 13, color: FV.inkSoft }}>
            ← Anterior
          </button>
          <span style={{ padding: '7px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: FV.inkMute }}>
            Pág. {page} · {Math.ceil(total / 20)} total
          </span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}
            style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${FV.border}`, background: FV.surface, cursor: 'pointer', fontFamily: 'Inter', fontSize: 13, color: FV.inkSoft }}>
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Fanfics ─────────────────────────────────────────────────────────────
function FanficsTab() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: res, isLoading } = useQuery({
    queryKey: ['admin-fanfics', search],
    queryFn: () => adminApi.getFanfics({ search }),
    retry: false,
  });

  const fanfics = Array.isArray(res?.fanfics) ? res.fanfics : [];

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteFanfic(id),
    onSuccess: () => { toast.success('Fanfic removida.'); queryClient.invalidateQueries({ queryKey: ['admin-fanfics'] }); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: FV.surface, border: `1px solid ${FV.border}`, borderRadius: 8, marginBottom: 20 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={FV.inkMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar fanfic por título…"
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'Inter', fontSize: 13.5, color: FV.ink }}
        />
      </div>

      <div style={{ background: FV.surface, border: `1px solid ${FV.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 90px', gap: 16, padding: '10px 18px', background: FV.paperAlt, borderBottom: `1px solid ${FV.border}` }}>
          {['Título', 'Autora', 'Status', 'Ação'].map(h => (
            <div key={h} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: FV.inkMute, fontWeight: 700 }}>
              {h}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: '32px', textAlign: 'center', fontFamily: 'Inter', fontSize: 14, color: FV.inkMute }}>Carregando…</div>
        ) : fanfics.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 15, color: FV.inkMute }}>
            Nenhuma fanfic encontrada.
          </div>
        ) : fanfics.map((f, i) => (
          <div key={f.id} style={{
            display: 'grid', gridTemplateColumns: '1fr 140px 100px 90px', gap: 16,
            padding: '12px 18px', alignItems: 'center',
            borderTop: i === 0 ? 'none' : `1px solid ${FV.border}`,
          }}>
            <div>
              <Link to={`/fanfic/${f.id}`} style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, color: FV.ink, textDecoration: 'none' }}>
                {f.title}
              </Link>
              <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: FV.inkMute, marginTop: 2 }}>
                {f.chapters_count ?? 0} caps · {f.views_count ?? 0} views
              </div>
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: FV.inkSoft }}>
              {f.author?.username || '—'}
            </div>
            <div>
              <Pill
                color={f.is_draft ? FV.inkMute : FV.moss}
                bg={f.is_draft ? FV.paperAlt : FV.mossBg}
              >
                {f.is_draft ? 'Rascunho' : 'Publicada'}
              </Pill>
            </div>
            <button
              onClick={() => {
                if (window.confirm(`Remover "${f.title}"? Essa ação não pode ser desfeita.`)) {
                  deleteMutation.mutate(f.id);
                }
              }}
              style={{
                padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
                background: FV.brickBg, color: FV.brick,
                border: `1px solid ${FV.brickSoft}`,
                fontFamily: 'Inter', fontSize: 11.5, fontWeight: 600,
              }}>
              Remover
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Denúncias ───────────────────────────────────────────────────────────
function ReportsTab() {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: adminApi.getReports,
    retry: false,
  });

  return (
    <div>
      {isLoading ? (
        <div style={{ padding: '32px', textAlign: 'center', fontFamily: 'Inter', fontSize: 14, color: FV.inkMute }}>Carregando…</div>
      ) : reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: FV.mossBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✅</div>
          <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, color: FV.ink }}>Nenhuma denúncia pendente</div>
          <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 14, color: FV.inkMute }}>Tudo limpo por aqui.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.map((r, i) => (
            <div key={i} style={{ background: FV.surface, border: `1px solid ${FV.border}`, borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div>
                  <div style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: FV.ink, marginBottom: 4 }}>
                    {r.type === 'fanfic' ? '📖' : '💬'} {r.target_title || 'Conteúdo denunciado'}
                  </div>
                  <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 13.5, color: FV.inkSoft, lineHeight: 1.4 }}>
                    "{r.reason}"
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: FV.inkMute, marginTop: 6 }}>
                    por {r.reporter_username} · {r.created_at}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button style={{ padding: '6px 12px', borderRadius: 6, background: FV.mossBg, color: FV.moss, border: `1px solid ${FV.mossSoft}`, fontFamily: 'Inter', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Ignorar
                  </button>
                  <button style={{ padding: '6px 12px', borderRadius: 6, background: FV.brickBg, color: FV.brick, border: `1px solid ${FV.brickSoft}`, fontFamily: 'Inter', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const [tab, setTab] = useState('overview');

  // Protege: só admin pode ver
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.is_admin) {
    return (
      <PageLayout>
        <div style={{ textAlign: 'center', padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 28, fontWeight: 400, color: FV.ink }}>
            Acesso restrito
          </div>
          <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 16, color: FV.inkMute, maxWidth: 400 }}>
            Apenas administradoras têm acesso a esta área.
          </div>
          <Link to="/home" style={{ marginTop: 8, padding: '10px 22px', background: FV.brick, color: FV.onBrick, borderRadius: 8, textDecoration: 'none', fontFamily: 'Inter', fontSize: 14, fontWeight: 600 }}>
            Voltar ao início
          </Link>
        </div>
      </PageLayout>
    );
  }

  const TAB_CONTENT = { overview: OverviewTab, users: UsersTab, fanfics: FanficsTab, reports: ReportsTab };
  const ActiveTab = TAB_CONTENT[tab];

  return (
    <PageLayout fullWidth>
      <div style={{ background: FV.paper, minHeight: '100vh' }}>

        {/* Hero */}
        <div style={{ background: FV.ink, position: 'relative', overflow: 'hidden' }}>
          {/* Dot pattern */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.08 }} viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice">
            <defs><pattern id="adm-dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1.5" fill="#f5e9cf"/></pattern></defs>
            <rect width="400" height="120" fill="url(#adm-dots)"/>
          </svg>
          <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto', padding: '36px 40px 28px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: FV.brick, fontWeight: 700, marginBottom: 8 }}>
              Painel · Administração
            </div>
            <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 400, letterSpacing: -1, margin: '0 0 6px', color: '#fffbf3', lineHeight: 1.05 }}>
              <em style={{ fontStyle: 'italic', color: FV.brick }}>Admin</em> · ficverse
            </h1>
            <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 15, color: '#c8b89a', margin: 0 }}>
              Logada como {user?.username}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${FV.border}`, padding: '0 40px', background: FV.surface, position: 'sticky', top: 0, zIndex: 5 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '14px 4px', marginRight: 28, background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'Inter', fontSize: 13.5, fontWeight: tab === t.id ? 600 : 500,
              color: tab === t.id ? FV.brick : FV.inkSoft,
              borderBottom: tab === t.id ? `2px solid ${FV.brick}` : '2px solid transparent',
              marginBottom: -1,
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '36px 40px 80px' }}>
          <SectionHead
            kicker={TABS.find(t => t.id === tab)?.label.toUpperCase()}
            title={
              tab === 'overview' ? 'Métricas da plataforma' :
              tab === 'users'    ? 'Gerenciar usuárias' :
              tab === 'fanfics'  ? 'Gerenciar publicações' :
              'Denúncias pendentes'
            }
          />
          <ActiveTab />
        </div>
      </div>
    </PageLayout>
  );
}
