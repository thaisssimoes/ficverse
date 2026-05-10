import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fanficApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import PageLayout from '../components/layout/PageLayout';

// ─── Design tokens ────────────────────────────────────────────────────────────
const FV = {
  paper: '#fbf3e2', paperAlt: '#f5e9d0',
  surface: '#fffbf3',
  ink: '#1f1610', inkSoft: '#4d3f30', inkMute: '#8c7a62',
  border: '#e7d8b8', borderStrong: '#d2bd92',
  brick: '#d24a2e', brickDeep: '#a23320', brickSoft: '#fad6cc', brickBg: '#fce8df', onBrick: '#fffbf3',
  moss: '#5a8038', mossSoft: '#d6e0b9', mossBg: '#ecf2da',
  mustard: '#e0a428', mustardSoft: '#f5dfa3', mustardBg: '#fcefc7',
  plum: '#6e2c52', plumSoft: '#e8c8d6', plumBg: '#f7e0eb',
  sky: '#3a8aa8', skySoft: '#c4dde5', skyBg: '#e2eef3',
  shadowSoft: '0 1px 2px rgba(80,40,15,.04), 0 2px 6px rgba(80,40,15,.05)',
};

// ─── Category map ─────────────────────────────────────────────────────────────
const CATS = {
  comedia:  { label: 'Comédia',    bg: '#e0a428', fg: '#fff8e0', pat: 'dots' },
  drama:    { label: 'Drama',      bg: '#6e2c52', fg: '#f7e0eb', pat: 'arches' },
  romance:  { label: 'Romance',    bg: '#d24a2e', fg: '#fce8df', pat: 'hearts' },
  aventura: { label: 'Aventura',   bg: '#a25620', fg: '#f7e0c8', pat: 'runes' },
  fantasia: { label: 'Fantasia',   bg: '#3a6049', fg: '#d6e0b9', pat: 'vines' },
  scifi:    { label: 'Sci-Fi',     bg: '#2a3a58', fg: '#b8c8e8', pat: 'grid' },
  misterio: { label: 'Mistério',   bg: '#3a3548', fg: '#b8b0c8', pat: 'stars' },
  terror:   { label: 'Terror',     bg: '#26201d', fg: '#d8b0a8', pat: 'arches' },
  kdrama:   { label: 'K-drama',    bg: '#7e4862', fg: '#fad6cc', pat: 'hearts' },
  kpop:     { label: 'K-pop',      bg: '#5a3868', fg: '#f5d0c5', pat: 'waves' },
  hp:       { label: 'Hogwarts',   bg: '#3a4a72', fg: '#e0d0a0', pat: 'stars' },
  lotr:     { label: 'Terra-Média',bg: '#4a4528', fg: '#dec070', pat: 'runes' },
  medico:   { label: 'Médico',     bg: '#2a5a52', fg: '#c0e0d8', pat: 'dots' },
  default:  { label: '',           bg: '#4d3f30', fg: '#f5e9cf', pat: 'dots' },
};

function getCat(cat) {
  const k = (cat || '').toLowerCase().replace(/[^a-z]/g, '');
  return CATS[k] || CATS.default;
}

// ─── Pattern SVGs ─────────────────────────────────────────────────────────────
function CatPattern({ name, color }) {
  switch (name) {
    case 'hearts':
      return (
        <svg viewBox="0 0 100 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.25 }}>
          {[[15,25],[55,40],[80,65],[25,75],[70,100],[35,120],[85,135]].map(([x,y],i) => (
            <path key={i} transform={`translate(${x} ${y}) scale(.4)`}
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill={color}/>
          ))}
        </svg>
      );
    case 'waves':
      return (
        <svg viewBox="0 0 100 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.25 }}>
          {[...Array(8)].map((_, i) => (
            <path key={i} d={`M0 ${20+i*18} Q25 ${10+i*18} 50 ${20+i*18} T100 ${20+i*18}`}
              fill="none" stroke={color} strokeWidth="0.6"/>
          ))}
        </svg>
      );
    case 'arches':
      return (
        <svg viewBox="0 0 100 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.3 }}>
          <g stroke={color} strokeWidth="0.6" fill="none">
            {[...Array(5)].map((_, i) => (
              <path key={i} d={`M${10+i*20} 150 L${10+i*20} 80 Q${20+i*20} 60 ${30+i*20} 80 L${30+i*20} 150`}/>
            ))}
          </g>
        </svg>
      );
    case 'vines':
      return (
        <svg viewBox="0 0 100 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.3 }}>
          <g stroke={color} strokeWidth="0.7" fill="none">
            <path d="M10 0 Q30 30 20 60 Q10 90 30 120 Q50 135 40 150"/>
            <path d="M70 0 Q60 40 80 70 Q90 100 70 130"/>
            <circle cx="22" cy="45" r="2" fill={color}/>
            <circle cx="25" cy="90" r="1.5" fill={color}/>
            <circle cx="76" cy="55" r="2" fill={color}/>
          </g>
        </svg>
      );
    case 'dots':
      return (
        <svg viewBox="0 0 100 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.3 }}>
          <defs>
            <pattern id="pd-fav" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="7" cy="7" r="1.5" fill={color}/>
            </pattern>
          </defs>
          <rect width="100" height="150" fill="url(#pd-fav)"/>
        </svg>
      );
    case 'stars':
      return (
        <svg viewBox="0 0 100 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.25 }}>
          <g fill={color}>
            {[[20,30],[45,22],[72,38],[85,60],[30,75],[60,90],[15,110],[80,125],[50,135]].map(([cx,cy],i) => (
              <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 2.5 : 1.8}/>
            ))}
          </g>
        </svg>
      );
    case 'runes':
      return (
        <svg viewBox="0 0 100 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.3 }}>
          <g stroke={color} strokeWidth="0.8" fill="none">
            <path d="M20 30 L20 50 L35 60 L20 70 L20 90"/>
            <path d="M50 40 L50 80 M40 50 L60 50 M40 70 L60 70"/>
            <path d="M75 45 L80 35 L85 45 L85 85 L75 85"/>
          </g>
        </svg>
      );
    case 'grid':
      return (
        <svg viewBox="0 0 100 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.2 }}>
          <defs>
            <pattern id="pg-fav" width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M12 0v12H0" fill="none" stroke={color} strokeWidth="0.4"/>
            </pattern>
          </defs>
          <rect width="100" height="150" fill="url(#pg-fav)"/>
        </svg>
      );
    default: return null;
  }
}

// Hero hearts pattern
function HeartsHero({ color }) {
  return (
    <svg viewBox="0 0 400 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.35 }}>
      {[[30,20],[90,50],[160,15],[230,45],[310,20],[370,55],[50,90],[130,120],[210,85],[280,115],[350,90],[70,155],[180,165],[260,150],[340,170]].map(([x,y],i) => (
        <path key={i} transform={`translate(${x} ${y}) scale(.55)`}
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={color}/>
      ))}
    </svg>
  );
}

// ─── Cover art (editorial + real image) ──────────────────────────────────────
function FavCover({ fanfic }) {
  const [imgErr, setImgErr] = useState(false);
  const cat = getCat(fanfic.category || fanfic.tags?.find(t => t.type === 'category')?.name);
  const coverUrl = fanfic.cover_url ? fanficApi.getAssetUrl(fanfic.cover_url) : null;

  if (coverUrl && !imgErr) {
    return (
      <img
        src={coverUrl}
        alt={fanfic.title}
        onError={() => setImgErr(true)}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: cat.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <CatPattern name={cat.pat} color={cat.fg} />
      </div>
      <div style={{
        position: 'absolute', inset: 8,
        border: `1px solid ${cat.fg}`, opacity: 0.25, borderRadius: 4, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 10, left: 0, right: 0, textAlign: 'center',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: 2,
        textTransform: 'uppercase', color: cat.fg, opacity: 0.8,
      }}>
        {cat.label}
      </div>
      {fanfic.interactive_mode && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: FV.mustard, color: FV.ink,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 7, fontWeight: 700,
          padding: '2px 5px', borderRadius: 3,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>✦</div>
      )}
      <div style={{
        position: 'absolute', bottom: '20%', left: 10, right: 10, textAlign: 'center',
        fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic',
        fontSize: 14, lineHeight: 1.1, color: cat.fg, letterSpacing: -0.3,
      }}>
        {fanfic.title}
      </div>
    </div>
  );
}

// ─── Grid card ────────────────────────────────────────────────────────────────
function FavCard({ fanfic, shelves, onToggleShelf, onCreateShelf }) {
  const cat = getCat(fanfic.category || fanfic.tags?.find(t => t.type === 'category')?.name);
  const [hovered, setHovered] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const inAnyShelf = shelves.some(s => (s.fanficIds || []).includes(fanfic.id));

  return (
    <div
      style={{ position: 'relative', transform: hovered && !popoverOpen ? 'translateY(-4px)' : 'none', transition: 'transform .15s ease' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Cover */}
      <div style={{ aspectRatio: '2 / 3', borderRadius: 8, overflow: 'hidden', boxShadow: FV.shadowSoft, marginBottom: 12, position: 'relative' }}>
        <Link to={`/fanfic/${fanfic.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
          <FavCover fanfic={fanfic} />
        </Link>

        {/* Heart badge */}
        <div style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', background: 'rgba(31,22,16,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={FV.brick} stroke={FV.brick} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>

        {/* Botão adicionar à lista */}
        <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPopoverOpen(p => !p); }}
            title="Adicionar à lista"
            style={{
              width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
              background: inAnyShelf ? FV.brick : 'rgba(31,22,16,0.65)',
              backdropFilter: 'blur(4px)',
              border: inAnyShelf ? 'none' : '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .15s',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={inAnyShelf ? '#fff' : FV.border} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              {!inAnyShelf && <path d="M12 7v6M9 10h6"/>}
            </svg>
          </button>

          {popoverOpen && (
            <ShelfPopover
              fanficId={fanfic.id}
              shelves={shelves}
              onToggle={(shelfId, fanficId) => onToggleShelf(shelfId, fanficId)}
              onCreateNew={() => { setPopoverOpen(false); onCreateShelf(); }}
              onClose={() => setPopoverOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Info */}
      <Link to={`/fanfic/${fanfic.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: cat.bg, fontWeight: 700, marginBottom: 4 }}>
          {cat.label}{fanfic.interactive_mode ? ' · interativa' : ''}
        </div>
        <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 16, fontWeight: 400, letterSpacing: -0.3, margin: '0 0 3px', color: FV.ink, lineHeight: 1.2 }}>
          {fanfic.title}
        </h3>
        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 12.5, color: FV.inkMute, marginBottom: 5 }}>
          por {fanfic.author?.username || fanfic.author_name || '—'}
        </div>
        {fanfic.chapters_count != null && (
          <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11.5, color: FV.inkSoft, fontWeight: 500 }}>
            {fanfic.chapters_count} capítulos
          </div>
        )}
      </Link>
    </div>
  );
}

// ─── List row ─────────────────────────────────────────────────────────────────
function FavRow({ fanfic, isLast, shelves, onToggleShelf, onCreateShelf }) {
  const cat = getCat(fanfic.category || fanfic.tags?.find(t => t.type === 'category')?.name);
  const [hovered, setHovered] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const inAnyShelf = shelves.some(s => (s.fanficIds || []).includes(fanfic.id));

  return (
    <div
      style={{
        display: 'grid', gridTemplateColumns: '56px 1fr auto',
        alignItems: 'center', gap: 16,
        padding: '14px 20px',
        borderBottom: isLast ? 'none' : `1px solid ${FV.border}`,
        background: hovered ? FV.paperAlt : 'transparent',
        transition: 'background .12s ease',
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Cover */}
      <div style={{ width: 56, height: 84, borderRadius: 4, overflow: 'hidden', position: 'relative', flexShrink: 0, boxShadow: FV.shadowSoft }}>
        <FavCover fanfic={fanfic} />
      </div>

      {/* Meta */}
      <div style={{ minWidth: 0 }}>
        <h4 style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 17, fontWeight: 400, letterSpacing: -0.3,
          margin: '0 0 2px', color: FV.ink, lineHeight: 1.2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {fanfic.title}
        </h4>
        <div style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontStyle: 'italic', fontSize: 12.5, color: FV.inkMute, marginBottom: 6,
        }}>
          por {fanfic.author?.username || fanfic.author_name || '—'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{
            background: cat.bg, color: cat.fg,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em',
            padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase',
          }}>
            {cat.label}
          </span>
          {fanfic.interactive_mode && (
            <span style={{
              background: FV.mustardBg, color: '#7a5a14',
              border: `1px solid ${FV.mustardSoft}`,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9.5, fontWeight: 700,
              padding: '2px 7px', borderRadius: 4,
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>✦ interativa</span>
          )}
          {fanfic.chapters_count != null && (
            <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12, color: FV.inkSoft }}>
              {fanfic.chapters_count} caps
            </span>
          )}
        </div>
      </div>

      {/* Ações: bookmark toggle + heart */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, position: 'relative' }}>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); setPopoverOpen(p => !p); }}
          title="Adicionar à lista"
          style={{
            width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
            background: inAnyShelf ? FV.brick : 'transparent',
            border: `1px solid ${inAnyShelf ? FV.brick : FV.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .15s, border-color .15s',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={inAnyShelf ? '#fff' : FV.inkSoft} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            {!inAnyShelf && <path d="M12 7v6M9 10h6"/>}
          </svg>
        </button>

        {popoverOpen && (
          <ShelfPopover
            fanficId={fanfic.id}
            shelves={shelves}
            onToggle={onToggleShelf}
            onCreateNew={() => { setPopoverOpen(false); onCreateShelf(); }}
            onClose={() => setPopoverOpen(false)}
          />
        )}

        <svg width="15" height="15" viewBox="0 0 24 24" fill={FV.brick} stroke={FV.brick} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </div>
    </div>
  );
}

// ─── Paleta de tons para shelves ─────────────────────────────────────────────
const SHELF_TONES = [
  { id: 'brick',   bg: FV.brickBg,   tone: FV.brick,   pat: 'hearts',  label: 'Tijolo' },
  { id: 'plum',    bg: FV.plumBg,    tone: FV.plum,    pat: 'waves',   label: 'Ameixa' },
  { id: 'moss',    bg: FV.mossBg,    tone: FV.moss,    pat: 'vines',   label: 'Musgo'  },
  { id: 'sky',     bg: FV.skyBg,     tone: FV.sky,     pat: 'arches',  label: 'Céu'    },
  { id: 'mustard', bg: FV.mustardBg, tone: FV.mustard, pat: 'dots',    label: 'Ouro'   },
];

// SVG pattern inline para shelf cards
function ShelfPattern({ pat, tone }) {
  if (pat === 'hearts') return (
    <svg viewBox="0 0 200 130" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.22 }}>
      {[[20,20],[60,40],[100,15],[150,38],[185,20],[35,75],[85,90],[135,70],[175,88]].map(([x,y],i) => (
        <path key={i} transform={`translate(${x} ${y}) scale(.45)`}
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={tone}/>
      ))}
    </svg>
  );
  if (pat === 'waves') return (
    <svg viewBox="0 0 200 130" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.22 }}>
      {[...Array(5)].map((_,i) => (
        <path key={i} d={`M0 ${22+i*22} Q50 ${10+i*22} 100 ${22+i*22} T200 ${22+i*22}`}
          fill="none" stroke={tone} strokeWidth="1"/>
      ))}
    </svg>
  );
  if (pat === 'vines') return (
    <svg viewBox="0 0 200 130" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.22 }}>
      <g stroke={tone} strokeWidth="1" fill="none">
        {[0,1,2].map(i => (
          <path key={i} d={`M${30+i*70} 0 Q${50+i*70} 40 ${30+i*70} 80 Q${10+i*70} 110 ${30+i*70} 130`}/>
        ))}
      </g>
    </svg>
  );
  if (pat === 'arches') return (
    <svg viewBox="0 0 200 130" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.22 }}>
      <g stroke={tone} strokeWidth="1" fill="none">
        {[0,1,2,3].map(i => (
          <path key={i} d={`M${10+i*50} 130 L${10+i*50} 80 Q${35+i*50} 55 ${60+i*50} 80 L${60+i*50} 130`}/>
        ))}
      </g>
    </svg>
  );
  // dots
  return (
    <svg viewBox="0 0 200 130" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.22 }}>
      <defs><pattern id="shd" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="1.5" fill={tone}/></pattern></defs>
      <rect width="200" height="130" fill="url(#shd)"/>
    </svg>
  );
}

// Card de shelf existente
function ShelfCard({ shelf, onDelete, onOpen, active }) {
  const t = SHELF_TONES.find(x => x.id === shelf.tone) || SHELF_TONES[0];
  const [hovered, setHovered] = useState(false);
  const words = (shelf.name || '').split(' ');

  return (
    <div
      onClick={onOpen}
      style={{
        borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
        border: `2px solid ${active ? t.tone : FV.border}`,
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? '0 4px 16px rgba(80,40,15,.1)' : active ? `0 0 0 3px ${t.tone}22` : 'none',
        transition: 'transform .15s ease, box-shadow .15s ease, border-color .15s',
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Pattern header */}
      <div style={{ height: 110, background: t.bg, position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${FV.border}` }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <ShelfPattern pat={t.pat} tone={t.tone} />
        </div>
        {/* Mini book spines */}
        <div style={{ position: 'absolute', bottom: 0, left: 16, right: 16, display: 'flex', gap: 5, alignItems: 'flex-end' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              flex: 1, aspectRatio: '2/3',
              background: t.tone, opacity: 0.3 + i * 0.12,
              borderRadius: '3px 3px 0 0',
              transform: `translateY(${i % 2 === 0 ? 8 : 0}px)`,
            }}/>
          ))}
        </div>
        {/* Delete button */}
        {hovered && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(shelf.id); }}
            style={{
              position: 'absolute', top: 8, right: 8,
              width: 26, height: 26, borderRadius: '50%',
              background: 'rgba(255,251,243,0.9)', border: `1px solid ${FV.border}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: FV.brick,
            }}
            title="Remover lista"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Text */}
      <div style={{ padding: '14px 16px 16px', background: FV.surface }}>
        <h3 style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 17, fontWeight: 400, letterSpacing: -0.3,
          margin: '0 0 3px', color: FV.ink, lineHeight: 1.2,
        }}>
          <em style={{ fontStyle: 'italic' }}>{words[0]}</em>{words.length > 1 ? ' ' + words.slice(1).join(' ') : ''}
        </h3>
        {shelf.description && (
          <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 12, color: FV.inkMute, margin: '0 0 8px', lineHeight: 1.4 }}>
            {shelf.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: t.tone, fontWeight: 700, letterSpacing: '0.06em' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={t.tone} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          {shelf.count || 0} fanfics
        </div>
      </div>
    </div>
  );
}

// Modal de criação de lista
function CreateShelfModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTone, setSelectedTone] = useState('brick');
  const nameRef = useState(null);

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: description.trim(), tone: selectedTone });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(31,22,16,0.55)', backdropFilter: 'blur(5px)',
      zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div style={{
        maxWidth: 480, width: '100%',
        background: FV.surface, borderRadius: 14,
        border: `1px solid ${FV.border}`,
        boxShadow: '0 8px 32px rgba(80,40,15,.14)',
        overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: `1px solid ${FV.border}` }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: FV.brick, fontWeight: 700, marginBottom: 6 }}>
            Nova lista
          </div>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 400, letterSpacing: -0.4, margin: 0, color: FV.ink }}>
            Como você quer <em style={{ fontStyle: 'italic' }}>chamar</em> essa lista?
          </h2>
        </div>

        {/* Form */}
        <div style={{ padding: '20px 28px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Nome */}
          <div>
            <label style={{ display: 'block', fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: FV.ink, marginBottom: 6 }}>
              Nome <span style={{ color: FV.brick }}>*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              maxLength={60}
              placeholder='ex: "domingo de chuva"'
              style={{
                width: '100%', padding: '10px 14px', boxSizing: 'border-box',
                border: `1px solid ${FV.border}`, background: FV.paperAlt,
                borderRadius: 8, outline: 'none',
                fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic',
                fontSize: 15, color: FV.ink,
              }}
              onFocus={e => e.currentTarget.style.borderColor = FV.brick}
              onBlur={e => e.currentTarget.style.borderColor = FV.border}
            />
          </div>

          {/* Descrição */}
          <div>
            <label style={{ display: 'block', fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: FV.ink, marginBottom: 6 }}>
              Descrição <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontWeight: 400, color: FV.inkMute, fontSize: 12 }}>opcional</span>
            </label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={120}
              placeholder='ex: "lentas, doces, dolorosas"'
              style={{
                width: '100%', padding: '10px 14px', boxSizing: 'border-box',
                border: `1px solid ${FV.border}`, background: FV.paperAlt,
                borderRadius: 8, outline: 'none',
                fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic',
                fontSize: 14, color: FV.ink,
              }}
              onFocus={e => e.currentTarget.style.borderColor = FV.brick}
              onBlur={e => e.currentTarget.style.borderColor = FV.border}
            />
          </div>

          {/* Cor */}
          <div>
            <label style={{ display: 'block', fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: FV.ink, marginBottom: 8 }}>
              Cor
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {SHELF_TONES.map(t => (
                <button key={t.id} onClick={() => setSelectedTone(t.id)} style={{
                  width: 34, height: 34, borderRadius: '50%', cursor: 'pointer',
                  background: t.tone,
                  border: selectedTone === t.id ? `3px solid ${FV.ink}` : `3px solid transparent`,
                  outline: selectedTone === t.id ? `2px solid ${t.tone}` : 'none',
                  outlineOffset: 2,
                  transition: 'border .1s, outline .1s',
                }} title={t.label}/>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: `1px solid ${FV.border}`, background: FV.paperAlt, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: `1px solid ${FV.border}`, background: 'transparent', fontFamily: 'Inter', fontSize: 13, color: FV.inkSoft, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            style={{
              padding: '9px 22px', borderRadius: 7, border: 'none',
              background: name.trim() ? FV.brick : FV.border,
              color: name.trim() ? FV.onBrick : FV.inkMute,
              fontFamily: 'Inter', fontSize: 13, fontWeight: 600,
              cursor: name.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Criar lista
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Hook de listas (estado compartilhado via localStorage) ──────────────────
function useShelves(userId) {
  const key = `fav_shelves_${userId || 'guest'}`;
  const [shelves, setShelves] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  });

  const save = useCallback((next) => {
    setShelves(next);
    localStorage.setItem(key, JSON.stringify(next));
  }, [key]);

  const addShelf = useCallback(({ name, description, tone }) => {
    save(prev => {
      const next = [...prev, { id: Date.now(), name, description, tone, fanficIds: [] }];
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key, save]);

  const deleteShelf = useCallback((id) => {
    save(prev => {
      const next = prev.filter(s => s.id !== id);
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key, save]);

  const toggleFanficInShelf = useCallback((shelfId, fanficId) => {
    setShelves(prev => {
      const next = prev.map(s => {
        if (s.id !== shelfId) return s;
        const ids = s.fanficIds || [];
        const has = ids.includes(fanficId);
        return { ...s, fanficIds: has ? ids.filter(x => x !== fanficId) : [...ids, fanficId] };
      });
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);

  return { shelves, addShelf, deleteShelf, toggleFanficInShelf };
}

// ─── Popover de seleção de lista ──────────────────────────────────────────────
function ShelfPopover({ fanficId, shelves, onToggle, onCreateNew, onClose }) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  const TONES = { brick: FV.brick, plum: FV.plum, moss: FV.moss, sky: FV.sky, mustard: FV.mustard };

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onCloseRef.current(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{
      position: 'absolute', bottom: '100%', right: 0,
      marginBottom: 8, zIndex: 50,
      background: FV.surface, border: `1px solid ${FV.border}`,
      borderRadius: 10, overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(80,40,15,.14)',
      minWidth: 220,
    }}>
      <div style={{ padding: '10px 14px 6px', fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: FV.inkMute, fontWeight: 700 }}>
        Adicionar à lista
      </div>

      {shelves.length === 0 ? (
        <div style={{ padding: '10px 14px 6px', fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 13, color: FV.inkMute }}>
          Nenhuma lista ainda.
        </div>
      ) : (
        shelves.map(s => {
          const inShelf = (s.fanficIds || []).includes(fanficId);
          const tone = TONES[s.tone] || FV.brick;
          return (
            <button key={s.id} onClick={() => onToggle(s.id, fanficId)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '9px 14px',
              background: inShelf ? `${tone}12` : 'transparent',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              transition: 'background .1s',
            }}
            onMouseEnter={e => { if (!inShelf) e.currentTarget.style.background = FV.paperAlt; }}
            onMouseLeave={e => { e.currentTarget.style.background = inShelf ? `${tone}12` : 'transparent'; }}
            >
              {/* Dot cor */}
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: tone, flexShrink: 0 }}/>
              <span style={{ flex: 1, fontFamily: "'Fraunces', Georgia, serif", fontSize: 14, color: FV.ink, lineHeight: 1.2 }}>
                {s.name}
              </span>
              {inShelf && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tone} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              )}
            </button>
          );
        })
      )}

      <div style={{ borderTop: `1px solid ${FV.border}`, padding: '6px 8px' }}>
        <button onClick={onCreateNew} style={{
          width: '100%', padding: '8px 10px', borderRadius: 6,
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: 'Inter', fontSize: 12.5, color: FV.brick, fontWeight: 600,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Nova lista
        </button>
      </div>
    </div>
  );
}

// ─── Seção de listas (recebe estado externo) ──────────────────────────────────
function ShelvesSection({ shelves, onAddShelf, onDeleteShelf, activeShelfId, onOpenShelf }) {
  const [showCreate, setShowCreate] = useState(false);
  const [addHovered, setAddHovered] = useState(false);

  return (
    <>
      {showCreate && (
        <CreateShelfModal onClose={() => setShowCreate(false)} onCreate={(data) => { onAddShelf(data); setShowCreate(false); }} />
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {shelves.map(s => (
          <ShelfCard
            key={s.id}
            shelf={{ ...s, count: (s.fanficIds || []).length }}
            onDelete={(id) => { if (activeShelfId === id) onOpenShelf(null); onDeleteShelf(id); }}
            onOpen={() => onOpenShelf(activeShelfId === s.id ? null : s.id)}
            active={activeShelfId === s.id}
          />
        ))}

        <button
          onClick={() => setShowCreate(true)}
          onMouseEnter={() => setAddHovered(true)}
          onMouseLeave={() => setAddHovered(false)}
          style={{
            background: 'transparent',
            border: `2px dashed ${addHovered ? FV.brick : FV.border}`,
            borderRadius: 14, padding: '36px 20px', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 12,
            color: addHovered ? FV.brick : FV.inkMute,
            fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13, fontWeight: 500,
            minHeight: shelves.length === 0 ? 200 : 180, width: '100%',
            transition: 'border-color .15s ease, color .15s ease',
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: addHovered ? FV.brickBg : FV.paperAlt,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .15s',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </div>
          <div style={{ textAlign: 'center', lineHeight: 1.4 }}>
            <div style={{ fontWeight: 600, marginBottom: 3 }}>Criar nova lista</div>
            {shelves.length === 0 && (
              <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 12, color: FV.inkMute }}>
                ex: "domingo de chuva", "pra ler com chá"
              </div>
            )}
          </div>
        </button>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'todas',       label: 'Todas' },
  { id: 'interativas', label: 'Interativas' },
  { id: 'completas',   label: 'Completas' },
  { id: 'andamento',   label: 'Em andamento' },
];

export default function FavoritesPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('todas');
  const [view, setView] = useState('grid');
  const [showCreateShelf, setShowCreateShelf] = useState(false);
  const [activeShelfId, setActiveShelfId] = useState(null); // null = ver todas

  const { shelves, addShelf, deleteShelf, toggleFanficInShelf } = useShelves(user?.user_id);

  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: fanficApi.getUserFavorites,
  });

  const all = Array.isArray(favorites) ? favorites : [];

  const activeShelf = shelves.find(s => s.id === activeShelfId) || null;
  const shelfFanficIds = activeShelf ? (activeShelf.fanficIds || []) : null;

  const filtered = all.filter(f => {
    // se uma lista está ativa, mostrar apenas as histórias dela
    if (shelfFanficIds !== null && !shelfFanficIds.includes(f.id)) return false;
    if (filter === 'todas') return true;
    if (filter === 'interativas') return f.interactive_mode;
    if (filter === 'completas') return f.status === 'complete' || f.status === 'completed';
    if (filter === 'andamento') return f.status === 'published' || f.status === 'ongoing';
    return true;
  });

  const stats = [
    { label: 'Favoritadas', value: all.length || '0',                                    tone: FV.brick },
    { label: 'Interativas', value: all.filter(f => f.interactive_mode).length,            tone: FV.moss },
    { label: 'Completas',   value: all.filter(f => f.status === 'complete' || f.status === 'completed').length, tone: FV.plum },
  ];

  return (
    <PageLayout fullWidth>
      <div style={{ background: FV.paper, minHeight: '100vh', paddingBottom: 80 }}>

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <div style={{
          background: FV.brickBg, borderBottom: `1px solid ${FV.border}`,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Pattern background */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <HeartsHero color={FV.brick} />
          </div>

          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 40px 32px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={FV.brick} stroke={FV.brick} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                color: FV.brick, fontWeight: 700,
              }}>
                Sua estante
              </span>
            </div>

            <h1 style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 'clamp(36px, 4.5vw, 54px)', fontWeight: 400,
              letterSpacing: -1.2, margin: '0 0 8px', color: FV.ink, lineHeight: 1.05,
            }}>
              <em style={{ fontStyle: 'italic', color: FV.brick }}>Favoritas</em>
              {' · suas histórias preferidas'}
            </h1>

            <p style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontStyle: 'italic', fontSize: 16.5, color: FV.inkSoft,
              margin: '0 0 28px', maxWidth: 540, lineHeight: 1.5,
            }}>
              Aqui ficam as fanfics que você marcou — organizadas em listas, prontas pra reler, terminar, ou recomendar pra uma amiga.
            </p>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              {stats.map(s => (
                <div key={s.label}>
                  <div style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontSize: 34, fontWeight: 400, fontStyle: 'italic',
                    color: s.tone, lineHeight: 1, letterSpacing: -0.5,
                  }}>{s.value}</div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: FV.inkMute, marginTop: 4, fontWeight: 600,
                  }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 40px 80px' }}>

          {/* ── SUAS LISTAS ──────────────────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${FV.border}`,
          }}>
            <div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                color: FV.brick, fontWeight: 700, marginBottom: 4,
              }}>Suas listas</div>
              <h2 style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 28, fontWeight: 400, letterSpacing: -0.6,
                margin: 0, color: FV.ink,
              }}>
                Como <em style={{ fontStyle: 'italic' }}>você</em> organiza
              </h2>
            </div>
          </div>

          <div style={{ marginBottom: 52 }}>
            {showCreateShelf && (
              <CreateShelfModal onClose={() => setShowCreateShelf(false)} onCreate={(data) => { addShelf(data); setShowCreateShelf(false); }} />
            )}
            <ShelvesSection
              shelves={shelves}
              onAddShelf={addShelf}
              onDeleteShelf={deleteShelf}
              activeShelfId={activeShelfId}
              onOpenShelf={setActiveShelfId}
            />
          </div>

          {/* ── TODAS AS FAVORITADAS ─────────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${FV.border}`,
          }}>
            <div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                color: FV.brick, fontWeight: 700, marginBottom: 4,
              }}>
                {activeShelf ? `Lista · ${(activeShelf.fanficIds || []).length} história${(activeShelf.fanficIds || []).length !== 1 ? 's' : ''}` : `Tudo que você favoritou · ${all.length}`}
              </div>
              <h2 style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 28, fontWeight: 400, letterSpacing: -0.6,
                margin: 0, color: FV.ink, display: 'flex', alignItems: 'center', gap: 10,
              }}>
                {activeShelf ? (
                  <>
                    <em style={{ fontStyle: 'italic' }}>{activeShelf.name}</em>
                    <button onClick={() => setActiveShelfId(null)} style={{ padding: '3px 10px', borderRadius: 999, border: `1px solid ${FV.border}`, background: FV.surface, cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, color: FV.inkMute }}>
                      Ver todas
                    </button>
                  </>
                ) : (
                  <><em style={{ fontStyle: 'italic' }}>Recentes</em> primeiro</>
                )}
              </h2>
            </div>

            {/* Grid/List toggle */}
            <div style={{ display: 'flex', gap: 6 }}>
              {['grid', 'list'].map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  width: 36, height: 36,
                  background: view === v ? FV.surface : 'transparent',
                  border: `1px solid ${view === v ? FV.brick : FV.border}`,
                  borderRadius: 8, cursor: 'pointer',
                  color: view === v ? FV.brick : FV.inkSoft,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {v === 'grid' ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── FILTER PILLS ─────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 26, flexWrap: 'wrap', alignItems: 'center' }}>
            {FILTERS.map(f => {
              const active = filter === f.id;
              const count = f.id === 'todas' ? all.length
                : f.id === 'interativas' ? all.filter(x => x.interactive_mode).length
                : f.id === 'completas' ? all.filter(x => x.status === 'complete' || x.status === 'completed').length
                : all.filter(x => x.status === 'published' || x.status === 'ongoing').length;
              return (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  padding: '8px 14px', borderRadius: 999,
                  background: active ? FV.brick : FV.surface,
                  border: `1px solid ${active ? FV.brick : FV.border}`,
                  color: active ? FV.onBrick : FV.ink,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 12.5, fontWeight: active ? 600 : 500,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7,
                }}>
                  {f.label}
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5,
                    opacity: active ? 0.85 : 0.55, fontWeight: 600,
                  }}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* ── CONTENT ──────────────────────────────────────────────────────── */}
          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 22 }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState filter={filter} />
          ) : view === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 22 }}>
              {filtered.map(f => (
                <FavCard
                  key={f.id} fanfic={f}
                  shelves={shelves}
                  onToggleShelf={toggleFanficInShelf}
                  onCreateShelf={() => setShowCreateShelf(true)}
                />
              ))}
            </div>
          ) : (
            <div style={{ background: FV.surface, border: `1px solid ${FV.border}`, borderRadius: 8, overflow: 'hidden' }}>
              {filtered.map((f, i) => (
                <FavRow
                  key={f.id} fanfic={f} isLast={i === filtered.length - 1}
                  shelves={shelves}
                  onToggleShelf={toggleFanficInShelf}
                  onCreateShelf={() => setShowCreateShelf(true)}
                />
              ))}
            </div>
          )}

          {/* ── FOOTER PROMPT ─────────────────────────────────────────────────── */}
          {!isLoading && all.length > 0 && (
            <div style={{
              marginTop: 60, padding: '36px 32px',
              background: FV.mustardBg, border: `1px solid ${FV.mustardSoft}`,
              borderRadius: 14,
              display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center',
            }}>
              <div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: '#7a5a14', fontWeight: 700, marginBottom: 6,
                }}>
                  Dica · descobrir
                </div>
                <div style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: 23, fontWeight: 400, letterSpacing: -0.4,
                  color: FV.ink, marginBottom: 6,
                }}>
                  Quer encontrar algo <em style={{ fontStyle: 'italic' }}>parecido</em> com o que você já ama?
                </div>
                <div style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontStyle: 'italic', fontSize: 14, color: FV.inkSoft,
                  lineHeight: 1.5, maxWidth: 500,
                }}>
                  A gente vê padrões nas suas favoritas e sugere histórias que tocam os mesmos lugares.
                </div>
              </div>
              <Link to="/explore" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: FV.brick, color: FV.onBrick,
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: 600, fontSize: 14,
                padding: '12px 22px', borderRadius: 8,
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                Ver sugestões →
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div>
      <div style={{
        aspectRatio: '2 / 3', borderRadius: 8, marginBottom: 12,
        background: 'linear-gradient(90deg, #f5e9d0 25%, #e7d8b8 50%, #f5e9d0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }}/>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ height: 11, width: '40%', background: '#e7d8b8', borderRadius: 4, marginBottom: 7 }}/>
      <div style={{ height: 16, width: '80%', background: '#e7d8b8', borderRadius: 4, marginBottom: 6 }}/>
      <div style={{ height: 12, width: '55%', background: '#e7d8b8', borderRadius: 4 }}/>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ filter }) {
  return (
    <div style={{
      textAlign: 'center', padding: '64px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: FV.brickBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={FV.brick} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </div>
      <div style={{
        fontFamily: "'Fraunces', Georgia, serif",
        fontSize: 22, fontWeight: 400, color: FV.ink,
      }}>
        {filter === 'todas'
          ? 'Sua estante está vazia por enquanto'
          : 'Nenhuma história nesse filtro'}
      </div>
      <div style={{
        fontFamily: "'Fraunces', Georgia, serif",
        fontStyle: 'italic', fontSize: 15, color: FV.inkMute, maxWidth: 380,
      }}>
        {filter === 'todas'
          ? 'Explore histórias e toque no coração pra salvar as que você ama.'
          : 'Tente outro filtro ou explore mais histórias.'}
      </div>
      <Link to="/explore" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: FV.brick, color: FV.onBrick,
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: 600, fontSize: 14,
        padding: '11px 22px', borderRadius: 8,
        textDecoration: 'none', marginTop: 8,
      }}>
        Explorar histórias →
      </Link>
    </div>
  );
}
