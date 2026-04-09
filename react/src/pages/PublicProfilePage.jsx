import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fanficApi, userApi, wallApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import PageLayout from '../components/layout/PageLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import UserProfileLayout from '../components/social/UserProfileLayout';
import ConversationBoard from '../components/social/ConversationBoard';
import ReadingListCarousel from '../components/social/ReadingListCarousel';
import styles from './PublicProfilePage.module.css';

const IconZap = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

function WorksGrid({ fanfics, isLoading }) {
  if (isLoading) return <LoadingSpinner />;
  if (!fanfics.length) {
    return (
      <div className={styles.emptyTab}>
        <p>Nenhuma obra publicada ainda.</p>
      </div>
    );
  }
  return (
    <div className={styles.coversGrid}>
      {fanfics.map((f) => (
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
  );
}

export default function PublicProfilePage() {
  const { username } = useParams();
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  /* ── Perfil público ──────────────────── */
  const { data: profile, isLoading: loadingProfile, isError } = useQuery({
    queryKey: ['public-profile', username],
    queryFn: () => userApi.getPublicProfile(username),
  });

  /* ── Fanfics do usuário ──────────────── */
  const { data: fanfics = [], isLoading: loadingFanfics } = useQuery({
    queryKey: ['author-fanfics', profile?.id],
    queryFn: () => fanficApi.getByAuthor(profile.id, false),
    enabled: !!profile?.id,
  });

  /* ── Mural ───────────────────────────── */
  const { data: wallMessages = [], isLoading: loadingWall } = useQuery({
    queryKey: ['wall', profile?.id],
    queryFn: () => wallApi.getMessages(profile.id),
    enabled: !!profile?.id,
  });

  /* ── Block ───────────────────────────── */
  const isOwnProfile = isAuthenticated && user?.username === username;

  const blockMutation = useMutation({
    mutationFn: () => userApi.blockUser(profile.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-profile', username] });
      toast.success('Usuário bloqueado.');
    },
    onError: () => toast.error('Erro ao bloquear usuário.'),
  });

  const unblockMutation = useMutation({
    mutationFn: () => userApi.unblockUser(profile.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-profile', username] });
      toast.success('Usuário desbloqueado.');
    },
    onError: () => toast.error('Erro ao desbloquear usuário.'),
  });

  /* ── Wall post / delete ──────────────── */
  const postMessageMutation = useMutation({
    mutationFn: (content) => wallApi.postMessage(profile.id, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wall', profile?.id] }),
    onError: () => toast.error('Erro ao publicar mensagem.'),
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (msgId) => wallApi.deleteMessage(msgId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wall', profile?.id] }),
    onError: () => toast.error('Erro ao deletar mensagem.'),
  });

  if (loadingProfile) return <PageLayout><LoadingSpinner fullPage /></PageLayout>;
  if (isError || !profile) {
    return (
      <PageLayout>
        <div className={styles.notFound}>
          <p>Usuário não encontrado.</p>
          <Link to="/explore">Explorar histórias</Link>
        </div>
      </PageLayout>
    );
  }

  const publishedFanfics = fanfics.filter((f) => !f.is_draft);

  return (
    <PageLayout>
      <UserProfileLayout
        username={profile.username}
        bio={profile.bio}
        fanficsCount={profile.fanfics_count}
        avatarUrl={profile.avatar_url}
        bannerUrl={profile.banner_url}
        isOwn={isOwnProfile}
        showBlockMenu={isAuthenticated && !isOwnProfile}
        isBlocked={profile.is_blocked}
        onBlock={() => blockMutation.mutate()}
        onUnblock={() => unblockMutation.mutate()}
        worksTab={
          <WorksGrid fanfics={publishedFanfics} isLoading={loadingFanfics} />
        }
        boardTab={
          loadingWall ? <LoadingSpinner /> : (
            <ConversationBoard
              messages={wallMessages}
              canPost={isAuthenticated && !isOwnProfile}
              isOwner={isOwnProfile}
              currentUserId={user?.user_id}
              onPost={(content) => postMessageMutation.mutateAsync(content)}
              onDelete={(id) => deleteMessageMutation.mutateAsync(id)}
            />
          )
        }
        listsTab={
          <div className={styles.emptyTab}>
            <p>Listas de leitura de @{profile.username} em breve.</p>
          </div>
        }
      />
    </PageLayout>
  );
}
