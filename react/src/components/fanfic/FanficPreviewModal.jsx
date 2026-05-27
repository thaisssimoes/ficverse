import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { fanficApi, tagApi } from '../../services/api';
import TagBadge from '../ui/TagBadge';
import LoadingSpinner from '../ui/LoadingSpinner';
import styles from './FanficPreviewModal.module.css';

export default function FanficPreviewModal({ fanficId, onClose }) {
  const { data: fanfic, isLoading } = useQuery({
    queryKey: ['fanfic', String(fanficId)],
    queryFn: () => fanficApi.getById(fanficId),
    enabled: !!fanficId,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['fanfic-tags', String(fanficId)],
    queryFn: () => tagApi.getFanficTags(fanficId),
    enabled: !!fanfic,
  });

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const coverUrl = fanfic?.cover_url ? fanficApi.getAssetUrl(fanfic.cover_url) : null;
  const initial = fanfic?.title?.charAt(0)?.toUpperCase() ?? '?';

  const statusLabel = fanfic?.is_complete ? 'Completa' : fanfic?.is_hiatus ? 'Hiatus' : 'Em andamento';
  const statusClass = fanfic?.is_complete ? styles.statusComplete : fanfic?.is_hiatus ? styles.statusHiatus : styles.statusOngoing;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={fanfic?.title ?? 'Prévia da história'}
      >
        <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">✕</button>

        {isLoading ? (
          <div className={styles.loading}>
            <LoadingSpinner text="Carregando..." />
          </div>
        ) : fanfic ? (
          <>
            <div className={styles.body}>
              {/* Capa */}
              <div className={styles.coverCol}>
                <div className={styles.coverWrapper}>
                  {coverUrl ? (
                    <img src={coverUrl} alt={`Capa de ${fanfic.title}`} className={styles.coverImg} />
                  ) : (
                    <div className={styles.coverPlaceholder}>{initial}</div>
                  )}
                  {fanfic.interactive_mode && (
                    <span className={styles.interactiveBadge}>Interativa</span>
                  )}
                </div>
              </div>

              {/* Informações */}
              <div className={styles.info}>
                <div className={styles.metaRow}>
                  {fanfic.category && (
                    <span className={styles.category}>{fanfic.category}</span>
                  )}
                  <span className={`${styles.statusBadge} ${statusClass}`}>{statusLabel}</span>
                </div>

                <h2 className={styles.title}>{fanfic.title}</h2>

                {fanfic.author?.username && (
                  <p className={styles.author}>por {fanfic.author.username}</p>
                )}

                {fanfic.synopsis && (
                  <div
                    className={styles.synopsis}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(fanfic.synopsis) }}
                  />
                )}

                {(tags.length > 0 || fanfic.is_adult_content) && (
                  <div className={styles.tagsSection}>
                    <span className={styles.tagsLabel}>Tags</span>
                    <div className={styles.tagList}>
                      {fanfic.is_adult_content && (
                        <TagBadge tag={{ id: 'adult', name: '+18', type: 'adult' }} />
                      )}
                      {tags.map((t) => <TagBadge key={t.id} tag={t} />)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.footer}>
              <Link to={`/fanfic/${fanfic.id}`} className={styles.readBtn} onClick={onClose}>
                Ir para a história →
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
