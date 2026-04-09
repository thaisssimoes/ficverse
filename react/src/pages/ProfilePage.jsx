import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fanficApi, userApi, wallApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { formatDate } from '../utils/formatters';
import PageLayout from '../components/layout/PageLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import UserProfileLayout from '../components/social/UserProfileLayout';
import ConversationBoard from '../components/social/ConversationBoard';
import ReadingListCarousel from '../components/social/ReadingListCarousel';
import styles from './ProfilePage.module.css';

const IconZap = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

/* ── Aba Obras: grid de capas + lista ────── */
function WorksTab({ fanfics, isLoading }) {
  if (isLoading) return <LoadingSpinner />;

  const published = fanfics.filter((f) => !f.is_draft);
  const drafts    = fanfics.filter((f) => f.is_draft);

  if (published.length === 0 && drafts.length === 0) {
    return (
      <div className={styles.emptyTab}>
        <p>Nenhuma obra publicada ainda.</p>
        <Link to="/dashboard" className={styles.actionBtn}>Criar minha primeira fanfic</Link>
      </div>
    );
  }

  return (
    <div className={styles.worksSection}>
      {/* Grid de capas — publicadas */}
      {published.length > 0 && (
        <div className={styles.coversGrid}>
          {published.map((f) => (
            <Link key={f.id} to={`/fanfic/${f.id}`} className={styles.coverCard}>
              <div className={styles.coverWrapper}>
                {f.cover_url
                  ? <img src={f.cover_url} alt={f.title} className={styles.coverImg} />
                  : <div className={styles.coverPlaceholder}>{f.title?.charAt(0)}</div>
                }
                {f.interactive_mode && (
                  <span className={styles.coverBadge}><IconZap /></span>
                )}
              </div>
              <p className={styles.coverTitle}>{f.title}</p>
              <p className={styles.coverMeta}>{f.category}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Rascunhos — lista simples */}
      {drafts.length > 0 && (
        <>
          <div className={styles.draftDivider}><span>Rascunhos</span></div>
          <div className={styles.worksList}>
            {drafts.map((f) => (
              <div key={f.id} className={`${styles.workItem} ${styles.draftItem}`}>
                <div className={styles.workItemLeft}>
                  <Link to={`/dashboard?fanficId=${f.id}`} className={styles.workTitle}>{f.title}</Link>
                  <div className={styles.workMeta}>
                    <span className={styles.workCategory}>{f.category}</span>
                    <span className={styles.badgeDraft}>Rascunho</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Stats bar ─────────────────────────── */
function StatsBar({ fanfics }) {
  const published   = fanfics.filter((f) => !f.is_draft).length;
  const drafts      = fanfics.filter((f) => f.is_draft).length;
  const interactive = fanfics.filter((f) => f.interactive_mode).length;

  return (
    <div className={styles.statsBar}>
      <div className={styles.statCard}>
        <span className={styles.statValue}>{published}</span>
        <span className={styles.statLabel}>Publicadas</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statValue}>{drafts}</span>
        <span className={styles.statLabel}>Rascunhos</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statValue}>{interactive}</span>
        <span className={styles.statLabel}>Interativas</span>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  /* ── Queries ─────────────────────────── */
  const { data: myFanfics = [], isLoading: loadingFanfics } = useQuery({
    queryKey: ['my-fanfics', user?.user_id],
    queryFn: () => fanficApi.getByAuthor(user.user_id, true),
    enabled: !!user?.user_id,
  });

  const { data: favorites = [], isLoading: loadingFavorites } = useQuery({
    queryKey: ['favorites', user?.user_id],
    queryFn: () => fanficApi.getUserFavorites(),
    enabled: !!user?.user_id,
  });

  const { data: wallMessages = [], isLoading: loadingWall } = useQuery({
    queryKey: ['wall', user?.user_id],
    queryFn: () => wallApi.getMessages(user.user_id),
    enabled: !!user?.user_id,
  });

  const { data: myProfile } = useQuery({
    queryKey: ['user-me'],
    queryFn: () => userApi.getMe(),
    enabled: !!user?.user_id,
  });

  /* ── Upload mutations ────────────────── */
  const uploadAvatarMutation = useMutation({
    mutationFn: (file) => userApi.uploadAvatar(file),
    onSuccess: (data) => {
      updateUser({ avatar_url: data.avatar_url });
      queryClient.invalidateQueries({ queryKey: ['user-me'] });
      toast.success('Foto de perfil atualizada!');
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadBannerMutation = useMutation({
    mutationFn: (file) => userApi.uploadBanner(file),
    onSuccess: (data) => {
      updateUser({ banner_url: data.banner_url });
      queryClient.invalidateQueries({ queryKey: ['user-me'] });
      toast.success('Imagem de capa atualizada!');
    },
    onError: (err) => toast.error(err.message),
  });

  /* ── Wall mutations ──────────────────── */
  const postMessageMutation = useMutation({
    mutationFn: (content) => wallApi.postMessage(user.user_id, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wall', user?.user_id] }),
    onError: () => toast.error('Erro ao publicar mensagem.'),
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (msgId) => wallApi.deleteMessage(msgId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wall', user?.user_id] }),
    onError: () => toast.error('Erro ao deletar mensagem.'),
  });

  const pinMessageMutation = useMutation({
    mutationFn: (msgId) => wallApi.pinMessage(msgId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wall', user?.user_id] }),
    onError: () => toast.error('Erro ao fixar mensagem.'),
  });

  const publishedCount = myFanfics.filter((f) => !f.is_draft).length;

  const handleCopyProfileLink = () => {
    const url = `${window.location.origin}/user/${user?.username}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link do perfil copiado!');
    }).catch(() => {
      toast.error('Não foi possível copiar o link.');
    });
  };

  return (
    <PageLayout>
      <UserProfileLayout
        username={user?.username ?? ''}
        bio={myProfile?.bio ?? null}
        fanficsCount={publishedCount}
        avatarUrl={myProfile?.avatar_url || user?.avatar_url || null}
        bannerUrl={myProfile?.banner_url || user?.banner_url || null}
        isOwn={true}
        onAvatarUpload={(file) => uploadAvatarMutation.mutate(file)}
        onBannerUpload={(file) => uploadBannerMutation.mutate(file)}
        onViewPublicProfile={() => navigate(`/user/${user?.username}`)}
        onCopyProfileLink={handleCopyProfileLink}
        worksTab={
          <>
            {!loadingFanfics && myFanfics.length > 0 && <StatsBar fanfics={myFanfics} />}
            <WorksTab fanfics={myFanfics} isLoading={loadingFanfics} />
          </>
        }
        boardTab={
          loadingWall ? <LoadingSpinner /> : (
            <ConversationBoard
              messages={wallMessages}
              canPost={true}
              isOwner={true}
              currentUserId={user?.user_id}
              onPost={(content) => postMessageMutation.mutateAsync(content)}
              onDelete={(id) => deleteMessageMutation.mutateAsync(id)}
              onPin={(id) => pinMessageMutation.mutateAsync(id)}
            />
          )
        }
        listsTab={
          <ReadingListCarousel
            favorites={favorites}
            isLoading={loadingFavorites}
          />
        }
      />
    </PageLayout>
  );
}
