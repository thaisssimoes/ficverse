import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fanficApi } from '../services/api';
import PageLayout from '../components/layout/PageLayout';
import CoverGrid from '../components/discovery/CoverGrid';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import styles from './FavoritesPage.module.css';

export default function FavoritesPage() {
  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: fanficApi.getUserFavorites,
  });

  const list = Array.isArray(favorites) ? favorites : [];

  return (
    <PageLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>Meus Favoritos <span>♥</span></h1>
        </div>

        <div className={styles.content}>
          {isLoading ? (
            <LoadingSpinner text="Carregando favoritos..." />
          ) : list.length === 0 ? (
            <div className={styles.empty}>
              <p>Você ainda não favoritou nenhuma fanfic.</p>
              <Link to="/explore" className={styles.exploreBtn}>Explorar Fanfics</Link>
            </div>
          ) : (
            <CoverGrid stories={list} emptyText="Nenhum favorito encontrado." />
          )}
        </div>
      </div>
    </PageLayout>
  );
}
