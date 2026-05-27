import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fanficApi } from '../../services/api';
import styles from './HeroBanner.module.css';

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function HeroBanner({ stories = [] }) {
  const navigate  = useNavigate();
  const [index,   setIndex]   = useState(0);
  const [paused,  setPaused]  = useState(false);

  const goTo   = useCallback((i) => setIndex((i + stories.length) % stories.length), [stories.length]);
  const goPrev = () => { goTo(index - 1); setPaused(true); };
  const goNext = () => { goTo(index + 1); setPaused(true); };

  useEffect(() => {
    if (paused || stories.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % stories.length), 5000);
    return () => clearInterval(t);
  }, [paused, stories.length]);

  useEffect(() => {
    if (!paused) return;
    const t = setTimeout(() => setPaused(false), 8000);
    return () => clearTimeout(t);
  }, [paused]);

  if (!stories.length) return null;

  const current = stories[index];
  const statusLabel = current.is_complete ? 'Completa' : current.is_hiatus ? 'Hiatus' : 'Em andamento';
  const statusClass = current.is_complete ? styles.tagComplete : current.is_hiatus ? styles.tagHiatus : styles.tagOngoing;

  return (
    <section className={styles.hero}>
      {/* Slides de fundo */}
      {stories.map((s, i) => (
        <div key={s.id} className={`${styles.slide} ${i === index ? styles.slideActive : ''}`}>
          {fanficApi.getAssetUrl(s.cover_url) && (
            <img src={fanficApi.getAssetUrl(s.cover_url)} alt={s.title} className={styles.bgImg} />
          )}
          <div className={styles.overlay} />
        </div>
      ))}

      {/* Conteúdo */}
      <div className={styles.content}>
        <div className={styles.tags}>
          <span className={`${styles.tag} ${statusClass}`}>{statusLabel}</span>
          {current.is_adult_content && (
            <span className={`${styles.tag} ${styles.tagAdult}`}>+18</span>
          )}
          {current.tags
            ?.filter((t) => t.type === 'fandom' || t.type === 'pairing')
            .slice(0, 3)
            .map((t) => (
              <span key={t.id} className={styles.tag}>{t.name}</span>
            ))}
        </div>

        <h1 className={styles.title}>{current.title}</h1>
        {current.author_username && (
          <p className={styles.sub}>por @{current.author_username}</p>
        )}
        {current.synopsis && (
          <p className={styles.synopsis}>{stripHtml(current.synopsis)}</p>
        )}

        <button className={styles.cta} onClick={() => navigate(`/fanfic/${current.id}`)}>
          Começar a Ler
        </button>
      </div>

      {/* Setas */}
      {stories.length > 1 && (
        <>
          <button className={`${styles.arrow} ${styles.arrowPrev}`} onClick={goPrev} aria-label="Anterior">‹</button>
          <button className={`${styles.arrow} ${styles.arrowNext}`} onClick={goNext} aria-label="Próximo">›</button>
          <div className={styles.dots}>
            {stories.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === index ? styles.dotActive : ''}`}
                onClick={() => { goTo(i); setPaused(true); }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
