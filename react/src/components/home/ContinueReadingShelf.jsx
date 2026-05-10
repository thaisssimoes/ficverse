import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fanficApi, chapterApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

// Category color map — same palette as the rest of the v3 design
const CAT_COLORS = {
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
  return CAT_COLORS[k] || CAT_COLORS.default;
}

function CoverArt({ coverUrl, category, title, interactive }) {
  const c = getCat(category);
  const [imgErr, setImgErr] = useState(false);

  if (coverUrl && !imgErr) {
    return (
      <img
        src={coverUrl}
        alt={title}
        onError={() => setImgErr(true)}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    );
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, background: c.bg,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{
        padding: '7px 6px 0', fontFamily: "'JetBrains Mono', monospace",
        fontSize: 7, letterSpacing: 1.5, textTransform: 'uppercase',
        color: c.fg, opacity: 0.8, textAlign: 'center',
      }}>
        {c.label}
      </div>
      {interactive && (
        <div style={{
          position: 'absolute', top: 5, right: 5,
          background: '#e0a428', color: '#1f1610',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 6,
          fontWeight: 700, padding: '1px 4px', borderRadius: 3,
        }}>✦</div>
      )}
      <div style={{
        position: 'absolute', bottom: '18%', left: 6, right: 6,
        fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic',
        fontSize: 11, lineHeight: 1.2, color: c.fg, textAlign: 'center',
      }}>
        {title}
      </div>
    </div>
  );
}

function ReadingCard({ item }) {
  const coverUrl = item.fanfic_cover_url ? fanficApi.getAssetUrl(item.fanfic_cover_url) : null;
  const progress = Math.round(item.progress_percentage ?? 0);
  const chapterHref = item.last_chapter_id
    ? `/chapter/${item.last_chapter_id}`
    : `/fanfic/${item.fanfic_id}`;

  return (
    <div style={{
      background: '#fffbf3',
      border: '1px solid #e7d8b8',
      borderRadius: 12,
      padding: 16,
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start',
    }}>
      {/* Cover */}
      <Link to={`/fanfic/${item.fanfic_id}`} style={{
        flexShrink: 0,
        width: 76,
        position: 'relative',
        borderRadius: 6,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,.14)',
        textDecoration: 'none',
        display: 'block',
      }}>
        <div style={{ paddingTop: '150%' }} />
        <CoverArt
          coverUrl={coverUrl}
          category={item.fanfic_category}
          title={item.fanfic_title}
          interactive={item.fanfic_interactive_mode}
        />
      </Link>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Chapter + interactive badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            color: '#d24a2e', textTransform: 'uppercase',
          }}>
            Cap. {item.last_chapter_read}
          </span>
          {item.fanfic_interactive_mode && (
            <span style={{
              background: '#e0a428', color: '#1f1610',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>✦ interativa</span>
          )}
        </div>

        {/* Title */}
        <Link to={`/fanfic/${item.fanfic_id}`} style={{ textDecoration: 'none' }}>
          <div style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 16, fontWeight: 400, letterSpacing: -0.3,
            color: '#1f1610', lineHeight: 1.2,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {item.fanfic_title}
          </div>
        </Link>

        {/* Author */}
        {item.author_name && (
          <div style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontStyle: 'italic', fontSize: 12.5, color: '#8c7a62',
          }}>
            por {item.author_name}
          </div>
        )}

        {/* Progress bar */}
        <div style={{
          width: '100%', height: 3, background: '#e7d8b8',
          borderRadius: 99, overflow: 'hidden', marginTop: 6,
        }}>
          <div style={{
            width: `${Math.min(progress, 100)}%`, height: '100%',
            background: '#d24a2e', borderRadius: 99,
            transition: 'width 0.4s ease',
          }} />
        </div>

        {/* Footer: % + Continuar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, color: '#8c7a62', letterSpacing: 0.3,
          }}>
            {progress}% lido
          </span>
          <Link to={chapterHref} style={{
            fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600,
            color: '#4d3f30', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            Continuar <span aria-hidden="true">▶</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  const pulse = {
    background: 'linear-gradient(90deg, #f5e9d0 25%, #e7d8b8 50%, #f5e9d0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
    borderRadius: 6,
  };
  return (
    <div style={{
      background: '#fffbf3', border: '1px solid #e7d8b8',
      borderRadius: 12, padding: 16, display: 'flex', gap: 14,
    }}>
      <div style={{ ...pulse, width: 76, aspectRatio: '2/3', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ ...pulse, height: 12, width: '40%' }} />
        <div style={{ ...pulse, height: 16, width: '85%' }} />
        <div style={{ ...pulse, height: 12, width: '55%' }} />
        <div style={{ ...pulse, height: 3, width: '100%', marginTop: 8 }} />
      </div>
    </div>
  );
}

export default function ContinueReadingShelf() {
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['reading-list'],
    queryFn: chapterApi.getReadingList,
    enabled: isAuthenticated,
  });

  const items = Array.isArray(data)
    ? data
        .filter((item) => Math.round(item.progress_percentage ?? 0) < 100)
        .filter((item, idx, arr) => arr.findIndex((x) => x.fanfic_id === item.fanfic_id) === idx)
        .slice(0, 3)
    : [];

  if (!isAuthenticated || (!isLoading && items.length === 0)) return null;

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : items.map((item) => <ReadingCard key={item.fanfic_id} item={item} />)
        }
      </div>
    </>
  );
}
