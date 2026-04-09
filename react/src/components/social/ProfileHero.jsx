import { useRef } from 'react';
import styles from './ProfileHero.module.css';

const IconLink = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconCamera = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const IconMoreVertical = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
  </svg>
);

const IconBlock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);

/**
 * ProfileHero — cabeçalho de identidade social.
 * Suporta upload real de avatar e banner para o próprio usuário.
 * Suporta botão de bloqueio para perfis de terceiros.
 *
 * @param {string}   username
 * @param {string}   [bio]
 * @param {number}   [fanficsCount]
 * @param {string}   [avatarUrl]
 * @param {string}   [bannerUrl]
 * @param {boolean}  [isOwn]            - Exibe controles de edição
 * @param {boolean}  [showBlockMenu]    - Exibe menu de overflow com bloquear
 * @param {boolean}  [isBlocked]        - Estado atual de bloqueio
 * @param {function} [onAvatarUpload]   - (File) => void
 * @param {function} [onBannerUpload]   - (File) => void
 * @param {function} [onBlock]             - () => void
 * @param {function} [onUnblock]           - () => void
 * @param {function} [onViewPublicProfile] - () => void
 * @param {function} [onCopyProfileLink]   - () => void
 */
export default function ProfileHero({
  username,
  bio,
  fanficsCount = 0,
  avatarUrl,
  bannerUrl,
  isOwn = false,
  showBlockMenu = false,
  isBlocked = false,
  onAvatarUpload,
  onBannerUpload,
  onBlock,
  onUnblock,
  onViewPublicProfile,
  onCopyProfileLink,
}) {
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const initials = username?.charAt(0)?.toUpperCase() ?? '?';

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onAvatarUpload) onAvatarUpload(file);
    e.target.value = '';
  };

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onBannerUpload) onBannerUpload(file);
    e.target.value = '';
  };

  return (
    <div className={styles.hero}>
      {/* Banner */}
      <div
        className={`${styles.banner} ${isOwn ? styles.bannerEditable : ''}`}
        onClick={isOwn ? () => bannerInputRef.current?.click() : undefined}
        role={isOwn ? 'button' : undefined}
        tabIndex={isOwn ? 0 : undefined}
        aria-label={isOwn ? 'Alterar imagem de capa' : undefined}
        onKeyDown={isOwn ? (e) => e.key === 'Enter' && bannerInputRef.current?.click() : undefined}
      >
        {bannerUrl
          ? <img src={bannerUrl} alt="Capa do perfil" className={styles.bannerImg} />
          : <div className={styles.bannerGradient} />
        }
        {isOwn && (
          <div className={styles.bannerOverlay}>
            <IconCamera />
            <span>Alterar capa</span>
          </div>
        )}
      </div>

      {/* Inputs de arquivo ocultos */}
      {isOwn && (
        <>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={styles.fileInput}
            onChange={handleAvatarChange}
          />
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={styles.fileInput}
            onChange={handleBannerChange}
          />
        </>
      )}

      {/* Avatar circular sobreposto à linha do banner */}
      <div className={styles.avatarArea}>
        <div
          className={`${styles.avatarWrapper} ${isOwn ? styles.avatarEditable : ''}`}
          onClick={isOwn ? () => avatarInputRef.current?.click() : undefined}
          role={isOwn ? 'button' : undefined}
          tabIndex={isOwn ? 0 : undefined}
          aria-label={isOwn ? 'Alterar foto de perfil' : undefined}
          onKeyDown={isOwn ? (e) => e.key === 'Enter' && avatarInputRef.current?.click() : undefined}
        >
          {avatarUrl
            ? <img src={avatarUrl} alt={`Avatar de ${username}`} className={styles.avatarImg} />
            : <div className={styles.avatar}>{initials}</div>
          }
          {isOwn && (
            <div className={styles.avatarOverlay}>
              <IconCamera />
            </div>
          )}
        </div>
      </div>

      {/* Identidade */}
      <div className={styles.identity}>
        <div className={styles.nameRow}>
          <h1 className={styles.displayName}>{username}</h1>

          {/* Ações à direita */}
          <div className={styles.actions}>
            {isOwn && (
              <>
                {onViewPublicProfile && (
                  <button className={styles.iconActionBtn} onClick={onViewPublicProfile} title="Ver perfil público">
                    <IconEye />
                  </button>
                )}
                {onCopyProfileLink && (
                  <button className={styles.iconActionBtn} onClick={onCopyProfileLink} title="Copiar link do perfil">
                    <IconLink />
                  </button>
                )}
                <a href="/dashboard" className={styles.editBtn}>
                  Editar Perfil
                </a>
              </>
            )}
            {showBlockMenu && (
              <div className={styles.overflowMenu}>
                <button className={styles.overflowTrigger} aria-label="Mais opções">
                  <IconMoreVertical />
                </button>
                <div className={styles.dropdown}>
                  <button
                    className={styles.dropdownItem}
                    onClick={isBlocked ? onUnblock : onBlock}
                  >
                    <IconBlock />
                    {isBlocked ? 'Desbloquear usuário' : 'Bloquear usuário'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className={styles.handle}>@{username}</p>
        {bio && <p className={styles.bio}>{bio}</p>}

        <div className={styles.stats}>
          <span className={styles.stat}>
            <strong>{fanficsCount}</strong> publicações
          </span>
        </div>
      </div>
    </div>
  );
}
