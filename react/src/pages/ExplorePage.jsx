import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { fanficApi } from '../services/api';
import { CATEGORIES, CATEGORY_ICONS } from '../constants';
import PageLayout from '../components/layout/PageLayout';
import CoverGrid from '../components/discovery/CoverGrid';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import styles from './ExplorePage.module.css';

export default function ExplorePage() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeSearch, setActiveSearch] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeStatus, setActiveStatus] = useState(searchParams.get('status') || 'all');

  const { data: allData, isLoading } = useQuery({
    queryKey: ['explore-fanfics'],
    queryFn: fanficApi.getAll,
  });

  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['search', activeSearch],
    queryFn: () => fanficApi.search(activeSearch),
    enabled: !!activeSearch,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchQuery.trim());
  };

  // Aplica filtro de categoria nos dados
  const getRawFanfics = () => {
    if (activeSearch && searchResults) return Array.isArray(searchResults) ? searchResults : [];
    if (!allData) return [];
    // allData é um objeto com categorias como chave
    if (typeof allData === 'object' && !Array.isArray(allData)) {
      return Object.values(allData).flat();
    }
    return allData;
  };

  const fanfics = getRawFanfics().filter((f) => {
    if (activeCategory !== 'all' && f.category?.toLowerCase() !== activeCategory.toLowerCase()) return false;
    if (activeStatus === 'complete') return f.is_complete;
    if (activeStatus === 'hiatus') return f.is_hiatus && !f.is_complete;
    if (activeStatus === 'ongoing') return !f.is_complete && !f.is_hiatus;
    return true;
  });

  return (
    <PageLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>Explorar Fanfics</h1>
          <p>Descubra histórias interativas organizadas por categoria</p>

          <form className={styles.searchForm} onSubmit={handleSearch}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar fanfic por título ou autor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className={styles.searchBtn}>Buscar</button>
          </form>
        </div>

        {/* Filtros de status */}
        <div className={styles.categories} style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 'var(--space-2)' }}>
          {[
            { key: 'all',     label: 'Todos os status' },
            { key: 'ongoing', label: 'Em andamento' },
            { key: 'complete',label: 'Completa' },
            { key: 'hiatus',  label: 'Hiatus' },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`${styles.catBtn} ${activeStatus === key ? styles.active : ''}`}
              onClick={() => setActiveStatus(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filtros de categoria */}
        <div className={styles.categories}>
          <button
            className={`${styles.catBtn} ${activeCategory === 'all' ? styles.active : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            Todos
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`${styles.catBtn} ${activeCategory === cat ? styles.active : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {CATEGORY_ICONS[cat]} {cat}
            </button>
          ))}
        </div>

        {/* Resultados */}
        <div className={styles.content}>
          {(isLoading || searching) ? (
            <LoadingSpinner text="Carregando fanfics..." />
          ) : (
            <CoverGrid stories={fanfics} emptyText="Nenhuma fanfic encontrada." />
          )}
        </div>
      </div>
    </PageLayout>
  );
}
