import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fanficApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { CATEGORIES } from '../constants';
import PageLayout from '../components/layout/PageLayout';
import CoverGrid from '../components/discovery/CoverGrid';
import Tabs from '../components/ui/Tabs';
import SocialFeed from '../components/social/SocialFeed';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import styles from './HomePage.module.css';

const QUICK_FILTERS = [
  { key: 'all',       label: 'Todos' },
  { key: 'Romance',   label: '💕 Romance' },
  { key: 'Aventura',  label: '⚔️ Aventura' },
  { key: 'Fantasia',  label: '🔮 Fantasia' },
  { key: 'Drama',     label: '🎭 Drama' },
];

const HOME_TABS = [
  { key: 'highlights', label: 'Destaques' },
  { key: 'feed',       label: 'Feed da Comunidade' },
];

export default function HomePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab]     = useState('highlights');
  const [activeFilter, setActiveFilter] = useState('all');

  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending', activeFilter],
    queryFn: () => fanficApi.getTrending(activeFilter === 'all' ? '' : activeFilter, 12),
  });

  const { data: featuredData } = useQuery({
    queryKey: ['featured'],
    queryFn: () => fanficApi.getFeatured(1),
  });

  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ['feed-recent'],
    queryFn: () => fanficApi.getTrending('', 20),
    enabled: activeTab === 'feed',
  });

  const featured  = Array.isArray(featuredData) ? featuredData[0] : null;
  const trending  = Array.isArray(trendingData) ? trendingData : [];
  const feedItems = Array.isArray(feedData) ? feedData : [];

  return (
    <PageLayout>
      {/* ── Hero com fanfic em destaque ── */}
      {featured && (
        <section className={styles.hero}>
          <div className={styles.heroBg}>
            {fanficApi.getAssetUrl(featured.cover_url) && (
              <img
                src={fanficApi.getAssetUrl(featured.cover_url)}
                alt={featured.title}
                className={styles.heroBgImg}
              />
            )}
            <div className={styles.heroOverlay} />
          </div>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>✨ Destaque</span>
            <h1 className={styles.heroTitle}>{featured.title}</h1>
            {featured.author_username && (
              <p className={styles.heroSub}>por {featured.author_username}</p>
            )}
            <a href={`/fanfic/${featured.id}`} className={styles.heroBtn}>
              Começar a Ler
            </a>
          </div>
        </section>
      )}

      {/* ── Abas: Destaques / Feed ── */}
      <div className={styles.tabsBar}>
        <Tabs tabs={HOME_TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* ── Aba: Destaques ── */}
      {activeTab === 'highlights' && (
        <section className={styles.section}>
          {/* Filtros rápidos de categoria */}
          <div className={styles.filters}>
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.key}
                className={`${styles.filterBtn} ${activeFilter === f.key ? styles.active : ''}`}
                onClick={() => setActiveFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Grade de histórias */}
          {trendingLoading ? (
            <LoadingSpinner text="Carregando histórias..." />
          ) : (
            <CoverGrid stories={trending} emptyText="Nenhuma fanfic disponível no momento." />
          )}
        </section>
      )}

      {/* ── Aba: Feed da Comunidade ── */}
      {activeTab === 'feed' && (
        <section className={styles.section}>
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
        </section>
      )}
    </PageLayout>
  );
}
