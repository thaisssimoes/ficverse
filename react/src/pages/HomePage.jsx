import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fanficApi, profileApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';

import PageLayout   from '../components/layout/PageLayout';
import Tabs         from '../components/ui/Tabs';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SocialFeed   from '../components/social/SocialFeed';

// Componentes da home
import HeroBanner           from '../components/home/HeroBanner';
import OnboardingBanner     from '../components/home/OnboardingBanner';
import StoryShelf           from '../components/home/StoryShelf';
import ContinueReadingShelf from '../components/home/ContinueReadingShelf';

import styles from './HomePage.module.css';

const HOME_TABS = [
  { key: 'highlights', label: 'Destaques'          },
  { key: 'feed',       label: 'Feed da Comunidade' },
];

function hasTagType(fanfic, type) {
  return fanfic.tags?.some((t) => t.type === type);
}

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('highlights');

  // Perfis de leitura — decide se mostra o onboarding banner
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

  // Feed da comunidade
  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ['feed-recent'],
    queryFn: () => fanficApi.getTrending('', 20),
    enabled: activeTab === 'feed',
  });

  const heroStories = Array.isArray(heroData) ? heroData : [];
  const pool        = Array.isArray(poolData)  ? poolData  : [];
  const feedItems   = Array.isArray(feedData)  ? feedData  : [];

  // Prateleiras derivadas do pool (sem chamadas extras)
  const allStories       = pool.slice(0, 16);
  const fandomStories    = pool.filter((f) => hasTagType(f, 'fandom')).slice(0, 16);
  const tropeStories     = pool.filter((f) => hasTagType(f, 'trope')).slice(0, 16);
  const interactiveStories = pool.filter((f) => f.interactive_mode).slice(0, 16);

  return (
    <PageLayout>
      {showOnboarding && <OnboardingBanner />}
      {!showOnboarding && <HeroBanner stories={heroStories} />}

      <div className={styles.tabsBar}>
        <Tabs tabs={HOME_TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* ── Aba: Destaques ── */}
      {activeTab === 'highlights' && (
        <div className={styles.section}>
          {poolLoading ? (
            <LoadingSpinner text="Carregando histórias..." />
          ) : (
            <div className={styles.shelves}>
              <ContinueReadingShelf />

              <StoryShelf
                title="Em Alta Agora"
                stories={allStories}
                viewAllTo="/explore"
              />

              {fandomStories.length > 0 && (
                <StoryShelf
                  title="Universos que Não Saem da Cabeça"
                  stories={fandomStories}
                  viewAllTo="/explore"
                />
              )}

              {tropeStories.length > 0 && (
                <StoryShelf
                  title="As Dinâmicas que a Gente Ama"
                  stories={tropeStories}
                  viewAllTo="/explore"
                />
              )}

              {interactiveStories.length > 0 && (
                <StoryShelf
                  title="Você É o Protagonista"
                  stories={interactiveStories}
                  viewAllTo="/explore?mode=interactive"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Aba: Feed da Comunidade ── */}
      {activeTab === 'feed' && (
        <div className={styles.feedLayout}>
          <div className={styles.feedMain}>
            <SocialFeed stories={feedItems} isLoading={feedLoading} />
          </div>
          <aside className={styles.feedSidebar}>
            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarTitle}>Bem-vindo, {user?.username}!</h3>
              <p className={styles.sidebarText}>
                Aqui você acompanha as últimas histórias publicadas pela comunidade.
              </p>
              <a href="/explore" className={styles.sidebarLink}>
                Ver catálogo completo →
              </a>
            </div>
          </aside>
        </div>
      )}
    </PageLayout>
  );
}
