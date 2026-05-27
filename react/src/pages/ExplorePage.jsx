import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { fanficApi } from '../services/api';

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

const CAT_STYLES = {
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
  default:  { bg: '#4d3f30', fg: '#f5e9cf', label: '' },
};

function getCatStyle(cat) {
  const key = (cat || '').toLowerCase().replace(/[^a-z]/g, '');
  return CAT_STYLES[key] || CAT_STYLES.default;
}

// Cover com imagem real + fallback editorial
function ExploreCover({ f, cat, viewMode }) {
  const [imgErr, setImgErr] = useState(false);
  const coverUrl = f.cover_url ? fanficApi.getAssetUrl(f.cover_url) : null;
  const h = viewMode === 'grid' ? 220 : 100;
  const w = viewMode === 'list' ? 140 : '100%';
  return (
    <div style={{ height: h, width: w, flexShrink: 0, background: cat.bg, position: 'relative', overflow: 'hidden' }}>
      {coverUrl && !imgErr
        ? <img src={coverUrl} alt={f.title} onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: 15, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.3, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                {f.title || 'Sem título'}
              </span>
            </div>
            {cat.label && (
              <span style={{ position: 'absolute', top: 8, right: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'rgba(0,0,0,0.25)', color: cat.fg, borderRadius: 4, padding: '3px 7px' }}>
                {cat.label}
              </span>
            )}
          </>
      }
    </div>
  );
}

const StatusDot = ({ status }) => {
  const c =
    status === 'Completa' ? '#5a8038' :
    status === 'Em hiato' ? '#8c7a62' :
    '#d24a2e';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: 12, color: FV.inkSoft, fontWeight: 500 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
      {status}
    </span>
  );
};

const UNIVERSE_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'Romance', label: 'Romance' },
  { key: 'Drama', label: 'Drama' },
  { key: 'Fantasia', label: 'Fantasia' },
  { key: 'K-Drama', label: 'K-Drama' },
  { key: 'Hogwarts', label: 'Hogwarts' },
  { key: 'K-pop', label: 'K-pop' },
  { key: 'Ficção Científica', label: 'Sci-Fi' },
  { key: 'Mistério', label: 'Mistério' },
];

const STATUS_FILTERS = [
  { key: 'all', label: 'Todos os status' },
  { key: 'ongoing', label: 'Em andamento' },
  { key: 'complete', label: 'Completa' },
  { key: 'hiatus', label: 'Hiato' },
];

export default function ExplorePage() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeSearch, setActiveSearch] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeStatus, setActiveStatus] = useState(searchParams.get('status') || 'all');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('recent');
  const [showInteractive, setShowInteractive] = useState(false);
  const [visibleCount, setVisibleCount] = useState(16);

  const { data: allData, isLoading } = useQuery({
    queryKey: ['explore-fanfics'],
    queryFn: fanficApi.getAll,
  });

  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['search', activeSearch],
    queryFn: () => fanficApi.search(activeSearch),
    enabled: !!activeSearch,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchQuery.trim());
  };

  const getRawFanfics = () => {
    if (activeSearch && searchResults) return Array.isArray(searchResults) ? searchResults : [];
    if (!allData) return [];
    if (typeof allData === 'object' && !Array.isArray(allData)) {
      return Object.values(allData).flat();
    }
    return allData;
  };

  const fanfics = getRawFanfics().filter((f) => {
    if (activeCategory !== 'all' && f.category?.toLowerCase() !== activeCategory.toLowerCase()) return false;
    if (activeStatus === 'complete') return f.is_complete;
    if (activeStatus === 'hiatus') return f.is_hiatus && !f.is_complete;
    if (activeStatus === 'ongoing') return !f.is_complete && !f.is_hiatus;
    if (showInteractive && !f.interactive_mode) return false;
    return true;
  });

  const getStatus = (f) =>
    f.is_complete ? 'Completa' : f.is_hiatus ? 'Em hiato' : 'Em andamento';

  const loading = isLoading || searching;

  const activeChips = [
    activeCategory !== 'all' && { label: UNIVERSE_FILTERS.find(u => u.key === activeCategory)?.label || activeCategory, clear: () => setActiveCategory('all') },
    activeStatus !== 'all' && { label: STATUS_FILTERS.find(s => s.key === activeStatus)?.label || activeStatus, clear: () => setActiveStatus('all') },
    showInteractive && { label: 'Só interativas', clear: () => setShowInteractive(false) },
  ].filter(Boolean);

  return (
    <PageLayout fullWidth>
      {/* SKY HERO */}
      <div style={{
        padding: '36px 40px 28px',
        background: FV.skyBg,
        borderBottom: '1px solid ' + FV.skySoft,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Wave SVG pattern */}
        <svg
          style={{ position: 'absolute', top: 0, right: 0, opacity: 0.3, pointerEvents: 'none' }}
          width="340" height="160" viewBox="0 0 340 160" fill="none"
        >
          <path d="M0 80 Q85 20 170 80 T340 80" stroke={FV.sky} strokeWidth="2.5" fill="none" />
          <path d="M0 110 Q85 50 170 110 T340 110" stroke={FV.sky} strokeWidth="2.5" fill="none" />
          <path d="M0 140 Q85 80 170 140 T340 140" stroke={FV.sky} strokeWidth="2.5" fill="none" />
        </svg>

        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: FV.sky, textTransform: 'uppercase', marginBottom: 10 }}>
              EXPLORAR · {fanfics.length} FANFICS
            </p>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 52, fontWeight: 700, color: FV.ink, margin: 0, lineHeight: 1.1 }}>
              Encontre sua{' '}
              <em style={{ fontStyle: 'italic', color: FV.sky }}>próxima</em>{' '}
              história favorita.
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search form */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 0 }}>
              <input
                type="text"
                placeholder="Buscar por título ou autor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 14, color: FV.ink,
                  background: FV.surface, border: '1.5px solid ' + FV.borderStrong,
                  borderRight: 'none', borderRadius: '6px 0 0 6px',
                  padding: '9px 14px', outline: 'none', width: 280,
                }}
              />
              <button
                type="submit"
                style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
                  background: FV.sky, color: FV.onBrick,
                  border: '1.5px solid ' + FV.sky, borderRadius: '0 6px 6px 0',
                  padding: '9px 18px', cursor: 'pointer',
                }}
              >
                Buscar
              </button>
            </form>

            {/* Sort select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                fontFamily: 'Inter, sans-serif', fontSize: 13, color: FV.inkSoft,
                background: FV.surface, border: '1.5px solid ' + FV.borderStrong,
                borderRadius: 6, padding: '9px 12px', cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="recent">Mais recentes</option>
              <option value="popular">Mais populares</option>
              <option value="az">A–Z</option>
            </select>

            {/* Grid/List toggle */}
            {['grid', 'list'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                title={mode === 'grid' ? 'Grade' : 'Lista'}
                style={{
                  width: 36, height: 36, borderRadius: 6, cursor: 'pointer',
                  border: '1.5px solid ' + (viewMode === mode ? FV.sky : FV.borderStrong),
                  background: viewMode === mode ? FV.skyBg : FV.surface,
                  color: viewMode === mode ? FV.sky : FV.inkMute,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15,
                }}
              >
                {mode === 'grid' ? '⊞' : '☰'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{
        padding: '28px 40px 80px',
        maxWidth: 1280,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: 36,
      }}>
        {/* FILTER SIDEBAR */}
        <aside>
          {/* Universo group */}
          <div style={{ marginBottom: 28 }}>
            <p style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.13em', color: FV.brick, textTransform: 'uppercase',
              marginBottom: 10, paddingBottom: 7,
              borderBottom: '2px solid ' + FV.brickSoft,
            }}>
              Universo
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {UNIVERSE_FILTERS.map(({ key, label }) => {
                const active = activeCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    style={{
                      fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: active ? 600 : 400,
                      textAlign: 'left', padding: '7px 12px', borderRadius: 6, cursor: 'pointer',
                      border: '1px solid ' + (active ? FV.brick : 'transparent'),
                      background: active ? FV.brick : 'transparent',
                      color: active ? FV.onBrick : FV.inkSoft,
                      transition: 'all 0.12s',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status group */}
          <div style={{ marginBottom: 28 }}>
            <p style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.13em', color: FV.moss, textTransform: 'uppercase',
              marginBottom: 10, paddingBottom: 7,
              borderBottom: '2px solid ' + FV.mossSoft,
            }}>
              Status
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {STATUS_FILTERS.map(({ key, label }) => {
                const active = activeStatus === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveStatus(key)}
                    style={{
                      fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: active ? 600 : 400,
                      textAlign: 'left', padding: '7px 12px', borderRadius: 6, cursor: 'pointer',
                      border: '1px solid ' + (active ? FV.moss : 'transparent'),
                      background: active ? FV.moss : 'transparent',
                      color: active ? '#fff' : FV.inkSoft,
                      transition: 'all 0.12s',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive-only box */}
          <div style={{
            background: showInteractive ? FV.brick : FV.brickBg,
            border: '1px solid ' + FV.brickSoft,
            borderRadius: 8, padding: '16px 14px',
          }}>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: showInteractive ? FV.onBrick : FV.brick,
              marginBottom: 6,
            }}>
              Só interativas
            </p>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: 12,
              color: showInteractive ? FV.brickSoft : FV.inkMute,
              marginBottom: 12, lineHeight: 1.5,
            }}>
              Mostra apenas histórias com modo interativo ativado.
            </p>
            <button
              onClick={() => setShowInteractive((v) => !v)}
              style={{
                fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
                padding: '6px 14px', borderRadius: 5, cursor: 'pointer',
                border: '1px solid ' + (showInteractive ? FV.onBrick : FV.brick),
                background: showInteractive ? FV.onBrick : FV.brick,
                color: showInteractive ? FV.brick : FV.onBrick,
              }}
            >
              {showInteractive ? 'Desativar filtro' : 'Ativar filtro'}
            </button>
          </div>
        </aside>

        {/* STORY GRID */}
        <div>
          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: FV.inkMute }}>Filtros:</span>
              {activeChips.map((chip, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500,
                    background: FV.paperAlt, border: '1px solid ' + FV.borderStrong,
                    borderRadius: 20, padding: '4px 10px 4px 12px', color: FV.inkSoft,
                  }}
                >
                  {chip.label}
                  <button
                    onClick={chip.clear}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: FV.inkMute, fontSize: 13, padding: 0, lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={() => { setActiveCategory('all'); setActiveStatus('all'); setShowInteractive(false); }}
                style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 12, color: FV.brick,
                  background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500,
                }}
              >
                Limpar tudo
              </button>
            </div>
          )}

          {loading ? (
            <LoadingSpinner />
          ) : fanfics.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '64px 0',
              fontFamily: 'Fraunces, serif', fontSize: 20, color: FV.inkMute, fontStyle: 'italic',
            }}>
              Nenhuma fanfic encontrada.
            </div>
          ) : (
            <>
              {/* 4-column card grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: viewMode === 'grid' ? 'repeat(4, 1fr)' : '1fr',
                gap: viewMode === 'grid' ? 20 : 12,
              }}>
                {fanfics.slice(0, visibleCount).map((f, i) => {
                  const cat = getCatStyle(f.category);
                  const status = getStatus(f);
                  return (
                    <div
                      key={f.id || i}
                      style={{
                        background: FV.surface,
                        border: '1px solid ' + FV.border,
                        borderRadius: 8,
                        overflow: 'hidden',
                        display: viewMode === 'list' ? 'flex' : 'block',
                        cursor: 'pointer',
                        transition: 'box-shadow 0.15s',
                      }}
                    >
                      {/* Cover */}
                      <ExploreCover f={f} cat={cat} viewMode={viewMode} />

                      {/* Body */}
                      <div style={{ padding: '14px 14px 12px' }}>
                        <p style={{
                          fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 700,
                          color: FV.ink, margin: '0 0 3px', lineHeight: 1.25,
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {f.title}
                        </p>
                        {f.author_pen_name && (
                          <p style={{
                            fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 13,
                            color: FV.inkMute, margin: '0 0 8px',
                          }}>
                            {f.author_pen_name}
                          </p>
                        )}
                        {f.description && (
                          <p style={{
                            fontFamily: 'Inter, sans-serif', fontSize: 12, color: FV.inkSoft,
                            margin: '0 0 10px', lineHeight: 1.5,
                            display: '-webkit-box', WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>
                            {f.description}
                          </p>
                        )}
                        <StatusDot status={status} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load more */}
              {visibleCount < fanfics.length && (
                <div style={{ textAlign: 'center', marginTop: 36 }}>
                  <button
                    onClick={() => setVisibleCount((v) => v + 16)}
                    style={{
                      fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600,
                      color: FV.sky, background: FV.skyBg,
                      border: '1.5px solid ' + FV.skySoft, borderRadius: 7,
                      padding: '11px 32px', cursor: 'pointer',
                    }}
                  >
                    Carregar mais ({fanfics.length - visibleCount} restantes)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
