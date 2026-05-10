import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fanficApi, profileApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import ContinueReadingShelf from '../components/home/ContinueReadingShelf';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PageLayout from '../components/layout/PageLayout';

// ─── Design tokens ────────────────────────────────────────────────────────────
const FV = {
  paper: '#fbf3e2', paperAlt: '#f5e9d0', paperDeep: '#ead8b3',
  surface: '#fffbf3', ink: '#1f1610', inkSoft: '#4d3f30', inkMute: '#8c7a62',
  border: '#e7d8b8', borderStrong: '#d2bd92',
  brick: '#d24a2e', brickDeep: '#a23320', brickSoft: '#fad6cc', brickBg: '#fce8df', onBrick: '#fffbf3',
  moss: '#5a8038', mossSoft: '#d6e0b9', mossBg: '#ecf2da',
  mustard: '#e0a428', mustardSoft: '#f5dfa3', mustardBg: '#fcefc7',
  plum: '#6e2c52', plumSoft: '#e8c8d6', plumBg: '#f7e0eb',
  sky: '#3a8aa8', skySoft: '#c4dde5', skyBg: '#e2eef3',
};

// ─── Category color map ───────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  romance:  { bg: '#d24a2e', fg: '#fce8df', label: 'Romance' },
  drama:    { bg: '#6e2c52', fg: '#f7e0eb', label: 'Drama' },
  fantasia: { bg: '#3a6049', fg: '#d6e0b9', label: 'Fantasia' },
  aventura: { bg: '#a25620', fg: '#f7e0c8', label: 'Aventura' },
  comedia:  { bg: '#e0a428', fg: '#fff8e0', label: 'Comédia' },
  misterio: { bg: '#3a3548', fg: '#b8b0c8', label: 'Mistério' },
  scifi:    { bg: '#2a3a58', fg: '#b8c8e8', label: 'Sci-Fi' },
  terror:   { bg: '#26201d', fg: '#d8b0a8', label: 'Terror' },
  kdrama:   { bg: '#7e4862', fg: '#fad6cc', label: 'K-Drama' },
  kpop:     { bg: '#5a3868', fg: '#f5d0c5', label: 'K-pop' },
  hp:       { bg: '#3a4a72', fg: '#e0d0a0', label: 'Hogwarts' },
  lotr:     { bg: '#4a4528', fg: '#dec070', label: 'Terra-Média' },
  default:  { bg: '#4d3f30', fg: '#f5e9cf', label: '' },
};

function getCatStyle(cat) {
  const key = (cat || '').toLowerCase().replace(/[^a-z]/g, '');
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
}

// ─── Static universe cards ────────────────────────────────────────────────────
const UNIVERSOS = [
  { name: 'Hogwarts',       cat: 'hp',       count: '3.2k', href: '/tags?u=Hogwarts' },
  { name: 'K-pop & K-drama',cat: 'kpop',     count: '1.8k', href: '/tags?u=kpop' },
  { name: 'Terra-Média',    cat: 'lotr',     count: '420',  href: '/tags' },
  { name: 'Original',       cat: 'romance',  count: '5.1k', href: '/tags' },
  { name: 'Fantasia',       cat: 'fantasia', count: '2.4k', href: '/tags' },
  { name: 'Sci-Fi',         cat: 'scifi',    count: '680',  href: '/tags' },
];

// ─── Number accent colour per rank ───────────────────────────────────────────
function rankColor(i) {
  if (i === 0) return FV.brick;
  if (i === 1) return FV.mustard;
  if (i === 2) return FV.moss;
  return FV.inkMute;
}

// ─── Reusable section head ────────────────────────────────────────────────────
function SectionHead({ kicker, title, action, actionHref }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
        color: FV.brick, textTransform: 'uppercase',
        display: 'block', marginBottom: 4,
      }}>
        — {kicker}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <h2 style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 28, fontWeight: 400,
          color: FV.ink, margin: 0,
        }}>
          {title}
        </h2>
        {action && actionHref && (
          <Link to={actionHref} style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 13, color: FV.brick, textDecoration: 'none',
            marginLeft: 'auto', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {action} →
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Constellation SVG ────────────────────────────────────────────────────────
function ConstellationSVG() {
  return (
    <svg
      width="340" height="200" viewBox="0 0 340 200" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', top: 0, right: 0, opacity: 0.25, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      {/* Stars */}
      {[
        [40,30],[120,18],[200,42],[280,12],[310,60],[260,90],
        [180,75],[100,88],[60,130],[150,140],[240,120],[300,150],
        [320,100],[80,170],[200,180],[270,190],
      ].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 2.5 : 1.8} fill={FV.plum} />
      ))}
      {/* Lines */}
      {[
        [40,30,120,18],[120,18,200,42],[200,42,280,12],[280,12,310,60],
        [310,60,260,90],[260,90,180,75],[180,75,100,88],[100,88,60,130],
        [60,130,150,140],[150,140,240,120],[240,120,300,150],[300,150,320,100],
        [200,42,180,75],[260,90,240,120],[150,140,200,180],[80,170,150,140],
      ].map(([x1,y1,x2,y2],i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={FV.plum} strokeWidth={0.8} strokeOpacity={0.6} />
      ))}
    </svg>
  );
}

// ─── Em Alta mini-cover ───────────────────────────────────────────────────────
function TrendingCover({ story, catStyle }) {
  const [imgErr, setImgErr] = useState(false);
  const coverUrl = story.cover_url ? fanficApi.getAssetUrl(story.cover_url) : null;

  if (coverUrl && !imgErr) {
    return (
      <div style={{ width: 48, height: 70, borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={coverUrl}
          alt={story.title}
          onError={() => setImgErr(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  return (
    <div style={{
      width: 48, height: 70, borderRadius: 4, flexShrink: 0,
      background: catStyle.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <span style={{
        fontFamily: "'Fraunces', Georgia, serif",
        fontStyle: 'italic', fontSize: 11,
        color: catStyle.fg, fontWeight: 700,
        textAlign: 'center', padding: '0 4px',
        lineHeight: 1.2,
      }}>
        {catStyle.label || (story.title || '?')[0]}
      </span>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hasTagType(fanfic, type) {
  return fanfic.tags?.some((t) => t.type === type);
}

function storyCategory(fanfic) {
  const tag = fanfic.tags?.find((t) => t.type === 'category' || t.type === 'genre');
  return tag?.name || fanfic.category || '';
}

function avatarLetter(name) {
  return (name || '?')[0].toUpperCase();
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HomePage() {
  const { user, isAuthenticated } = useAuth();

  // Perfis de leitura — decide se mostra onboarding
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: profileApi.listProfiles,
    enabled: isAuthenticated,
  });
  const showOnboarding = isAuthenticated && profiles.length === 0;

  // Hero — top 6 com capa
  const { data: heroData } = useQuery({
    queryKey: ['hero-stories'],
    queryFn: () => fanficApi.getFeatured(6),
  });

  // Pool grande para derivar as prateleiras temáticas
  const { data: poolData, isLoading: poolLoading } = useQuery({
    queryKey: ['home-pool'],
    queryFn: () => fanficApi.getTrending('', 60),
  });

  const heroStories = Array.isArray(heroData) ? heroData : [];
  // Exclui histórias da própria usuária logada do feed
  const pool = (Array.isArray(poolData) ? poolData : [])
    .filter(f => !user || f.author_id !== user.user_id);

  // Prateleiras derivadas do pool
  const allStories         = pool.slice(0, 16);
  const fandomStories      = pool.filter((f) => hasTagType(f, 'fandom')).slice(0, 16);
  const tropeStories       = pool.filter((f) => hasTagType(f, 'trope')).slice(0, 16);
  const interactiveStories = pool.filter((f) => f.interactive_mode).slice(0, 16);

  // Community feed source — prefer fandom stories, fallback to allStories
  const feedSource = fandomStories.length > 0 ? fandomStories : allStories;
  const feedItems  = feedSource.slice(0, 4);

  // Stats derived from data
  const newChapterCount = heroStories.length > 0 ? heroStories.length * 3 : 0;
  const totalStories    = pool.length;

  return (
    <PageLayout fullWidth>
      <div style={{ background: FV.paper, minHeight: '100vh', paddingBottom: 80 }}>
        <div style={{ padding: '32px 40px 80px', maxWidth: 1280, margin: '0 auto' }}>

          {/* ── 1. HERO WELCOME BANNER ─────────────────────────────────────── */}
          {(() => {
            const days = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
            const dayLabel = days[new Date().getDay()];
            const heroStats = [
              { value: totalStories > 0 ? `${totalStories}+` : '60+', label: 'FANFICS DISPONÍVEIS', color: FV.brick },
              { value: fandomStories.length > 0 ? `${fandomStories.length}` : '—', label: 'EM FANDOMS ATIVOS', color: FV.moss },
              { value: heroStories.length > 0 ? `${heroStories.length}` : '—', label: 'AUTORAS SEGUIDAS', color: FV.mustard },
            ];
            return (
              <section style={{
                background: 'linear-gradient(135deg, #f7e0eb 0%, #fce8df 100%)',
                borderRadius: 14, padding: '40px 44px', marginBottom: 40,
                position: 'relative', overflow: 'hidden',
                border: `1px solid ${FV.plumSoft}`,
                display: 'flex', alignItems: 'flex-start', gap: 32,
              }}>
                <ConstellationSVG />

                {/* LEFT: text + CTAs */}
                <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                    color: FV.plum, textTransform: 'uppercase',
                    display: 'block', marginBottom: 12,
                  }}>
                    {dayLabel} · {showOnboarding ? 'BEM-VINDA' : 'BOAS-VINDAS'}
                  </span>

                  <h1 style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontSize: 'clamp(28px, 3.2vw, 42px)', fontWeight: 400, color: FV.ink,
                    margin: '0 0 10px', lineHeight: 1.1,
                  }}>
                    {isAuthenticated && user?.username ? (
                      <>
                        Oi, <em style={{ fontStyle: 'italic', color: FV.brick }}>{user.username}</em>.
                        {newChapterCount > 0 && <> Tem {newChapterCount} capítulos novos te esperando.</>}
                      </>
                    ) : (
                      <>Bem-vinda ao <em style={{ fontStyle: 'italic', color: FV.brick }}>universo</em> das fanfics.</>
                    )}
                  </h1>

                  <p style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontStyle: 'italic', fontSize: 16, color: FV.inkSoft,
                    margin: '0 0 24px', lineHeight: 1.55,
                  }}>
                    {showOnboarding
                      ? 'Crie seu perfil de leitura e descubra histórias feitas pra você.'
                      : isAuthenticated
                        ? 'Explore novas histórias ou continue de onde você parou.'
                        : 'Descubra histórias incríveis escritas pela comunidade.'}
                  </p>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Link to="/favorites" style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      background: FV.brick, color: FV.onBrick,
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontWeight: 600, fontSize: 14,
                      padding: '11px 22px', borderRadius: 8,
                      textDecoration: 'none',
                    }}>
                      Continuar lendo →
                    </Link>
                  </div>
                </div>

                {/* RIGHT: stat boxes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
                  {heroStats.map(({ value, label, color }) => (
                    <div key={label} style={{
                      background: 'rgba(255,251,243,0.9)',
                      border: `1px solid ${FV.border}`,
                      borderRadius: 10, padding: '14px 20px',
                      minWidth: 148,
                    }}>
                      <div style={{
                        fontFamily: "'Fraunces', Georgia, serif",
                        fontStyle: 'italic', fontSize: 32, fontWeight: 400,
                        color, lineHeight: 1, letterSpacing: -0.5,
                      }}>{value}</div>
                      <div style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: FV.inkMute, marginTop: 6, fontWeight: 600,
                      }}>{label}</div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}

          {/* ── 2. CONTINUE LENDO ──────────────────────────────────────────── */}
          <section style={{ marginBottom: 44 }}>
            <SectionHead kicker="CONTINUE LENDO" title="Onde você parou" />
            <ContinueReadingShelf />
          </section>

          {/* ── 3. MAIN GRID ───────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 36, marginTop: 12 }}>

            {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
            <div>

              {/* EM ALTA numbered list */}
              <section style={{ marginBottom: 44 }}>
                <SectionHead
                  kicker="EM ALTA"
                  title="O que tá bombando hoje"
                  action="Explorar →"
                  actionHref="/explore"
                />

                {poolLoading ? (
                  <LoadingSpinner text="Carregando histórias..." />
                ) : (
                  <ol style={{
                    background: FV.surface,
                    border: `1px solid ${FV.border}`,
                    borderRadius: 8,
                    margin: 0, padding: 0,
                    listStyle: 'none',
                    overflow: 'hidden',
                  }}>
                    {allStories.slice(0, 5).map((story, i) => {
                      const cat     = storyCategory(story);
                      const catStyle = getCatStyle(cat);
                      return (
                        <li key={story.id || i} style={{
                          display: 'grid',
                          gridTemplateColumns: '50px 60px 1fr auto',
                          alignItems: 'center',
                          gap: 14,
                          padding: '14px 18px',
                          borderBottom: i < 4 ? `1px solid ${FV.border}` : 'none',
                        }}>
                          {/* Rank number */}
                          <span style={{
                            fontFamily: "'Fraunces', Georgia, serif",
                            fontStyle: 'italic', fontSize: 32, fontWeight: 800,
                            color: rankColor(i), lineHeight: 1,
                            textAlign: 'center',
                          }}>
                            {i + 1}
                          </span>

                          {/* Cover */}
                          <TrendingCover story={story} catStyle={catStyle} />

                          {/* Meta */}
                          <div>
                            <div style={{
                              fontFamily: "'Fraunces', Georgia, serif",
                              fontSize: 15, fontWeight: 700, color: FV.ink,
                              marginBottom: 3,
                            }}>
                              {story.title || 'Sem título'}
                            </div>
                            <div style={{
                              fontFamily: "'Inter', system-ui, sans-serif",
                              fontSize: 12, color: FV.inkMute,
                              marginBottom: 4,
                            }}>
                              {story.author?.username || story.author_name || 'Autor desconhecido'}
                            </div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              {cat && (
                                <span style={{
                                  background: catStyle.bg, color: catStyle.fg,
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: 10, fontWeight: 600,
                                  padding: '2px 7px', borderRadius: 4,
                                }}>
                                  {catStyle.label || cat}
                                </span>
                              )}
                              {story.views != null && (
                                <span style={{
                                  fontFamily: "'Inter', system-ui, sans-serif",
                                  fontSize: 11, color: FV.inkMute,
                                }}>
                                  {story.views.toLocaleString('pt-BR')} leitores
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Read button */}
                          <Link to={`/fanfic/${story.id}`} style={{
                            fontFamily: "'Inter', system-ui, sans-serif",
                            fontSize: 12, fontWeight: 600,
                            color: FV.brick,
                            border: `1.5px solid ${FV.brick}`,
                            borderRadius: 6,
                            padding: '6px 14px',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                          }}>
                            Ler
                          </Link>
                        </li>
                      );
                    })}

                    {allStories.length === 0 && (
                      <li style={{
                        padding: '32px 18px',
                        textAlign: 'center',
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: 14, color: FV.inkMute,
                      }}>
                        Nenhuma história encontrada ainda.
                      </li>
                    )}
                  </ol>
                )}
              </section>

              {/* UNIVERSOS GRID */}
              <section>
                <SectionHead kicker="UNIVERSOS" title="Histórias por mundo" />
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12,
                }}>
                  {UNIVERSOS.map(({ name, cat, count, href }) => {
                    const cs = getCatStyle(cat);
                    return (
                      <Link key={name} to={href} style={{
                        display: 'block',
                        background: cs.bg,
                        borderRadius: 10,
                        padding: '18px 16px 14px',
                        textDecoration: 'none',
                        position: 'relative',
                        overflow: 'hidden',
                        minHeight: 110,
                      }}>
                        {/* Wave pattern overlay */}
                        <svg
                          aria-hidden="true"
                          style={{
                            position: 'absolute', bottom: 0, right: 0,
                            width: '78%', height: '80%',
                            opacity: 0.18, pointerEvents: 'none',
                          }}
                          viewBox="0 0 200 120"
                          preserveAspectRatio="xMaxYMax meet"
                        >
                          <path d="M0 30 Q35 5 70 30 Q105 55 140 30 Q165 12 200 22" stroke={cs.fg} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          <path d="M0 58 Q35 33 70 58 Q105 83 140 58 Q165 40 200 50" stroke={cs.fg} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          <path d="M0 86 Q35 61 70 86 Q105 111 140 86 Q165 68 200 78" stroke={cs.fg} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          <path d="M0 114 Q35 89 70 114 Q105 139 140 114 Q165 96 200 106" stroke={cs.fg} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        </svg>

                        {/* Name */}
                        <div style={{
                          fontFamily: "'Fraunces', Georgia, serif",
                          fontStyle: 'italic', fontWeight: 700,
                          fontSize: 19, color: cs.fg,
                          lineHeight: 1.2, position: 'relative',
                        }}>
                          {name}
                        </div>

                        {/* Count + arrow at bottom */}
                        <div style={{
                          position: 'absolute', bottom: 12, left: 16, right: 16,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 10, fontWeight: 700,
                            color: cs.fg, opacity: 0.75,
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                          }}>
                            {count} fanfics
                          </span>
                          <span style={{
                            fontFamily: "'Inter', system-ui, sans-serif",
                            fontSize: 16, color: cs.fg, opacity: 0.7,
                          }}>→</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* ── RIGHT COLUMN ────────────────────────────────────────────── */}
            <aside>

              {/* COMMUNITY FEED */}
              <section style={{ marginBottom: 28 }}>
                <SectionHead kicker="COMUNIDADE" title="Movimento agora" />

                <div style={{
                  background: FV.surface,
                  border: `1px solid ${FV.border}`,
                  borderRadius: 10,
                  overflow: 'hidden',
                }}>
                  {feedItems.length > 0 ? feedItems.map((story, i) => {
                    const authorName = story.author?.username || story.author_name || 'Autor';
                    const storyTitle = story.title || 'história sem título';
                    const cs = getCatStyle(storyCategory(story));
                    return (
                      <div key={story.id || i} style={{
                        padding: '16px 18px',
                        borderBottom: i < feedItems.length - 1 ? `1px solid ${FV.border}` : 'none',
                        display: 'flex', gap: 12, alignItems: 'flex-start',
                      }}>
                        {/* Avatar */}
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: cs.bg, color: cs.fg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: "'Fraunces', Georgia, serif",
                          fontWeight: 700, fontSize: 15,
                          flexShrink: 0,
                        }}>
                          {avatarLetter(authorName)}
                        </div>

                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontFamily: "'Inter', system-ui, sans-serif",
                            fontSize: 13, color: FV.inkSoft,
                            marginBottom: 6, lineHeight: 1.4,
                          }}>
                            <strong style={{ color: FV.ink }}>{authorName}</strong>
                            {' publicou um capítulo de '}
                            <Link to={`/fanfic/${story.id}`} style={{ color: FV.brick, textDecoration: 'none', fontWeight: 600 }}>
                              {storyTitle}
                            </Link>
                          </div>
                          {/* Quote / excerpt */}
                          {story.summary && (
                            <blockquote style={{
                              margin: '6px 0 6px',
                              padding: '6px 10px',
                              borderLeft: `3px solid ${FV.plumSoft}`,
                              background: FV.plumBg,
                              borderRadius: '0 6px 6px 0',
                              fontFamily: "'Fraunces', Georgia, serif",
                              fontStyle: 'italic', fontSize: 12,
                              color: FV.inkSoft, lineHeight: 1.45,
                            }}>
                              {story.summary.length > 80
                                ? story.summary.slice(0, 80) + '…'
                                : story.summary}
                            </blockquote>
                          )}
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 10, color: FV.inkMute,
                          }}>
                            2h atrás
                          </span>
                        </div>
                      </div>
                    );
                  }) : (
                    /* Mock feed when no data yet */
                    [
                      { letter: 'M', name: 'moonwriter', title: 'Depois da Tempestade', color: '#d24a2e', colorFg: '#fce8df' },
                      { letter: 'S', name: 'starfic_br', title: 'Universo Paralelo', color: '#6e2c52', colorFg: '#f7e0eb' },
                      { letter: 'P', name: 'palabras_hp', title: 'O Que o Silêncio Guarda', color: '#3a4a72', colorFg: '#e0d0a0' },
                      { letter: 'R', name: 'rosedream',  title: 'Entre Trevas e Luz', color: '#3a6049', colorFg: '#d6e0b9' },
                    ].map((item, i) => (
                      <div key={i} style={{
                        padding: '16px 18px',
                        borderBottom: i < 3 ? `1px solid ${FV.border}` : 'none',
                        display: 'flex', gap: 12, alignItems: 'flex-start',
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: item.color, color: item.colorFg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: "'Fraunces', Georgia, serif",
                          fontWeight: 700, fontSize: 15, flexShrink: 0,
                        }}>
                          {item.letter}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontFamily: "'Inter', system-ui, sans-serif",
                            fontSize: 13, color: FV.inkSoft,
                            marginBottom: 4, lineHeight: 1.4,
                          }}>
                            <strong style={{ color: FV.ink }}>{item.name}</strong>
                            {' publicou um capítulo de '}
                            <span style={{ color: FV.brick, fontWeight: 600 }}>{item.title}</span>
                          </div>
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 10, color: FV.inkMute,
                          }}>
                            2h atrás
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* DESAFIO DO MÊS */}
              <section>
                <div style={{
                  background: FV.mustardBg,
                  border: `1px solid ${FV.mustardSoft}`,
                  borderRadius: 10,
                  padding: '24px 22px',
                }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                    color: FV.mustard, textTransform: 'uppercase',
                    display: 'inline-block',
                    background: FV.mustardSoft,
                    padding: '3px 10px', borderRadius: 20,
                    marginBottom: 14,
                  }}>
                    Desafio do mês
                  </span>

                  <h3 style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontStyle: 'italic', fontSize: 20, fontWeight: 700,
                    color: FV.ink, margin: '0 0 10px',
                  }}>
                    Escreva em 48h
                  </h3>

                  <p style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 13, color: FV.inkSoft,
                    margin: '0 0 20px', lineHeight: 1.55,
                  }}>
                    Crie um oneshot de pelo menos 1.000 palavras usando o prompt do mês. Ganhe um selo exclusivo no perfil!
                  </p>

                  <Link to="/challenge" style={{
                    display: 'inline-block',
                    background: FV.mustard, color: '#fff',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontWeight: 600, fontSize: 13,
                    padding: '9px 20px', borderRadius: 7,
                    textDecoration: 'none',
                  }}>
                    Participar
                  </Link>
                </div>
              </section>

            </aside>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
