import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { tagApi, fanficApi } from '../services/api';
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

const TAG_GROUPS = [
  { id: 'universos', label: 'Universos', tone: FV.brick, tags: [
    { name: 'Hogwarts', hot: true }, { name: 'K-pop', hot: true }, { name: 'BTS' },
    { name: 'Twice' }, { name: 'Harry Potter', hot: true }, { name: 'Marauders' },
    { name: 'Senhor dos Anéis' }, { name: 'Marvel' }, { name: 'Original', hot: true }, { name: 'Disney' },
  ]},
  { id: 'vibes', label: 'Vibes & Tropos', tone: FV.plum, tags: [
    { name: 'slow-burn', hot: true }, { name: 'enemies-to-lovers' }, { name: 'fluff', hot: true },
    { name: 'angst' }, { name: 'hurt-comfort' }, { name: 'soulmates' },
    { name: 'fake-dating' }, { name: 'second-chance' }, { name: 'one-bed' }, { name: 'roommates' },
  ]},
  { id: 'temas', label: 'Temas', tone: FV.moss, tags: [
    { name: 'família' }, { name: 'amizade' }, { name: 'crescimento' }, { name: 'identidade' },
    { name: 'memória' }, { name: 'epistolar' }, { name: 'realismo-mágico' }, { name: 'reencontro' },
  ]},
  { id: 'tom', label: 'Tom', tone: FV.mustard, tags: [
    { name: 'leve', hot: true }, { name: 'profundo' }, { name: 'bittersweet' },
    { name: 'bobinho', hot: true }, { name: 'tenso' }, { name: 'cinematográfico' },
  ]},
];

export default function TagSearchPage() {
  const [searchParams] = useSearchParams();
  const [activeType, setActiveType] = useState('fandom');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const tagId = searchParams.get('tagId');
    const tagName = searchParams.get('tagName');
    const tagType = searchParams.get('tagType');
    if (tagId && tagName && tagType) {
      const tag = { id: parseInt(tagId), name: decodeURIComponent(tagName), type: tagType };
      setSelectedTags([tag]);
      searchByTags([tag]);
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const tags = await tagApi.search(val.trim(), activeType);
        const filtered = (tags || []).filter((t) => !selectedTags.some((s) => s.id === t.id));
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } catch { setSuggestions([]); }
    }, 300);
  };

  const addTag = (tag) => {
    if (selectedTags.some(t => t.name === tag.name)) return;
    const newTags = [...selectedTags, tag];
    setSelectedTags(newTags);
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    searchByTags(newTags);
  };

  const removeTag = (tagId) => {
    const next = selectedTags.filter((t) => t.id !== tagId);
    setSelectedTags(next);
    if (next.length === 0) setResults(null);
    else searchByTags(next);
  };

  const clearAll = () => { setSelectedTags([]); setResults(null); };

  const searchByTags = async (tags = selectedTags) => {
    if (tags.length === 0) return;
    setIsSearching(true);
    try {
      const tagIds = tags.filter(t => typeof t.id === 'number').map(t => t.id);
      if (tagIds.length > 0) {
        const res = await fanficApi.searchByTags(tagIds);
        setResults(Array.isArray(res) ? res : []);
      } else {
        setResults([]);
      }
    } catch { setResults([]); }
    finally { setIsSearching(false); }
  };

  const addStaticTag = (name) => {
    addTag({ id: Date.now(), name, type: 'trope' });
  };

  return (
    <PageLayout fullWidth>
      {/* MUSTARD HERO */}
      <div style={{
        padding: '36px 40px 32px',
        background: FV.mustardBg,
        borderBottom: `1px solid ${FV.mustardSoft}`,
        position: 'relative', overflow: 'hidden',
      }}>
        <svg style={{ position: 'absolute', top: -20, right: 40, width: 200, height: 200, opacity: 0.25, pointerEvents: 'none' }} viewBox="0 0 100 100">
          <defs><pattern id="td" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="1.5" fill={FV.mustard}/></pattern></defs>
          <rect width="100" height="100" fill="url(#td)"/>
        </svg>
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#7a5a14', fontWeight: 700, marginBottom: 10 }}>
            Buscar por tags
          </div>
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 'clamp(36px,4vw,50px)', fontWeight: 400, letterSpacing: -1.4, margin: '0 0 14px', color: FV.ink, lineHeight: 1 }}>
            Procure pelo <span style={{ fontStyle: 'italic', color: '#7a5a14' }}>jeito</span> que você lê.
          </h1>
          <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 17, color: '#7a5a14', margin: 0, maxWidth: 600, lineHeight: 1.5, opacity: 0.9 }}>
            Cruza universo + vibe + tema. Selecione quantas tags quiser — o resultado afina conforme você combina.
          </p>
        </div>
      </div>

      <div style={{ padding: '32px 40px 80px', maxWidth: 1280, margin: '0 auto' }}>

        {/* ACTIVE FILTERS + SEARCH BAR */}
        <div style={{ background: FV.surface, border: `1px solid ${FV.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase', color: FV.inkMute, fontWeight: 700, flexShrink: 0 }}>
            {selectedTags.length > 0 ? `Filtrando por · ${selectedTags.length}` : 'Selecione tags abaixo ou busque:'}
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
            {selectedTags.map(t => (
              <button key={t.id} onClick={() => removeTag(t.id)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 10px', borderRadius: 4,
                background: FV.brick, color: FV.onBrick, border: 'none',
                fontFamily: 'Inter', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              }}>
                {t.name} ×
              </button>
            ))}
          </div>
          {/* Search input */}
          <div style={{ position: 'relative' }} ref={suggestionsRef}>
            <div style={{ display: 'flex', gap: 4 }}>
              {['fandom','warning','pairing'].map(t => (
                <button key={t} onClick={() => { setActiveType(t); setQuery(''); setSuggestions([]); }} style={{
                  padding: '5px 10px', borderRadius: 6, border: `1px solid ${activeType === t ? FV.brick : FV.border}`,
                  background: activeType === t ? FV.brickBg : 'transparent',
                  color: activeType === t ? FV.brick : FV.inkSoft,
                  fontFamily: 'Inter', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                }}>
                  {t === 'fandom' ? 'Fandom' : t === 'warning' ? 'Avisos' : 'Casais'}
                </button>
              ))}
              <input
                type="text"
                placeholder="Buscar tags..."
                value={query}
                onChange={handleQueryChange}
                style={{
                  padding: '6px 12px', border: `1px solid ${FV.border}`, borderRadius: 6,
                  fontFamily: 'Inter', fontSize: 13, color: FV.ink, background: FV.paper,
                  outline: 'none', minWidth: 160,
                }}
              />
            </div>
            {showSuggestions && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: FV.surface, border: `1px solid ${FV.border}`, borderRadius: 8,
                boxShadow: '0 4px 12px rgba(31,22,16,.08)', marginTop: 4,
              }}>
                {suggestions.map(tag => (
                  <button key={tag.id} onClick={() => addTag(tag)} style={{
                    display: 'block', width: '100%', padding: '8px 14px', background: 'none',
                    border: 'none', textAlign: 'left', fontFamily: 'Inter', fontSize: 13,
                    color: FV.ink, cursor: 'pointer',
                  }}>
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedTags.length > 0 && (
            <button onClick={clearAll} style={{ fontFamily: 'Inter', fontSize: 12.5, color: FV.inkMute, background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500, flexShrink: 0 }}>
              Limpar tudo
            </button>
          )}
        </div>

        {/* TAG GROUPS */}
        <div style={{ marginBottom: 36 }}>
          {TAG_GROUPS.map(g => (
            <div key={g.id} style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: g.tone, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 18, height: 1, background: g.tone, display: 'inline-block' }} />
                {g.label}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {g.tags.map(t => {
                  const isSelected = selectedTags.some(s => s.name === t.name);
                  return (
                    <button key={t.name} onClick={() => addStaticTag(t.name)} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: 999,
                      background: isSelected ? g.tone : FV.surface,
                      color: isSelected ? '#fffbf3' : FV.ink,
                      border: `1px solid ${isSelected ? g.tone : FV.border}`,
                      fontFamily: 'Inter', fontSize: 13, fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer', transition: 'all .12s',
                    }}>
                      {t.hot && !isSelected && <span style={{ color: g.tone, fontSize: 11 }}>⚡</span>}
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* DIVIDER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: FV.border, marginBottom: 36 }}>
          <div style={{ flex: 1, height: 1, background: FV.border }} />
          <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 14, color: FV.brick }}>✦</div>
          <div style={{ flex: 1, height: 1, background: FV.border }} />
        </div>

        {/* RESULTS */}
        {selectedTags.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', color: FV.inkMute, fontSize: 17 }}>
            Selecione tags acima para encontrar fanfics.
          </div>
        ) : isSearching ? (
          <LoadingSpinner text="Buscando fanfics..." />
        ) : results !== null && (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 28, fontWeight: 400, letterSpacing: -0.6, margin: 0, color: FV.ink }}>
                {results.length > 0
                  ? <>Resultados pra <span style={{ fontStyle: 'italic', color: FV.brick }}>{selectedTags.map(t => t.name).join(' + ')}</span></>
                  : 'Nenhuma fanfic encontrada'}
              </h2>
              <Link to="/explore" style={{ fontFamily: 'Inter', fontSize: 13, color: FV.brick, textDecoration: 'none', fontWeight: 500 }}>Ver explorar completo →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
              {results.map(f => {
                const c = getCat(f.category);
                return (
                  <article key={f.id} style={{ background: FV.surface, border: `1px solid ${FV.border}`, borderRadius: 8, overflow: 'hidden' }}>
                    <Link to={`/fanfic/${f.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                      <div style={{ height: 200, background: c.bg, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 12 }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: c.fg, opacity: 0.8, marginBottom: 4 }}>{c.label}</div>
                        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, fontWeight: 400, color: c.fg, lineHeight: 1.15, letterSpacing: -0.3 }}>{f.title}</div>
                        {f.interactive_mode && (
                          <div style={{ position: 'absolute', top: 8, right: 8, background: FV.brick, color: '#fffbf3', padding: '2px 7px', borderRadius: 4, fontFamily: 'Inter', fontSize: 8, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Interativa</div>
                        )}
                      </div>
                      <div style={{ padding: '14px 16px' }}>
                        <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 17, fontWeight: 400, letterSpacing: -0.3, margin: '0 0 4px', color: FV.ink, lineHeight: 1.15 }}>{f.title}</h3>
                        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 12, color: FV.inkSoft, marginBottom: 10 }}>por {f.author_username || 'Autor'}</div>
                        {f.synopsis && (
                          <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 13, lineHeight: 1.5, color: FV.inkSoft, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {f.synopsis.replace(/<[^>]*>/g, ' ').trim()}
                          </p>
                        )}
                        <div style={{ paddingTop: 10, borderTop: `1px solid ${FV.border}`, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {f.tags?.slice(0, 2).map(t => (
                            <span key={t.id} style={{ padding: '3px 8px', borderRadius: 4, background: FV.brickBg, color: FV.brickDeep, fontFamily: 'Inter', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{t.name}</span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
