import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { tagApi, fanficApi } from '../services/api';
import PageLayout from '../components/layout/PageLayout';
import CoverGrid from '../components/discovery/CoverGrid';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import TagBadge from '../components/ui/TagBadge';
import styles from './TagSearchPage.module.css';

const TAG_TYPES = [
  { key: 'fandom', label: 'Fandom' },
  { key: 'warning', label: 'Avisos' },
  { key: 'pairing', label: 'Casais' },
];

export default function TagSearchPage() {
  const [searchParams] = useSearchParams();
  const [activeType, setActiveType] = useState('fandom');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Inicia com tag via URL (ex: vindo da FanficDetailPage)
  useEffect(() => {
    const tagId = searchParams.get('tagId');
    const tagName = searchParams.get('tagName');
    const tagType = searchParams.get('tagType');
    if (tagId && tagName && tagType) {
      const tag = { id: parseInt(tagId), name: decodeURIComponent(tagName), type: tagType };
      setSelectedTags([tag]);
      searchByTags([tag]);
    }
  }, []);

  // Fecha sugestões ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const tags = await tagApi.search(val.trim(), activeType);
        const filtered = (tags || []).filter((t) => !selectedTags.some((s) => s.id === t.id));
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } catch { setSuggestions([]); }
    }, 300);
  };

  const addTag = (tag) => {
    setSelectedTags((prev) => [...prev, tag]);
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const removeTag = (tagId) => setSelectedTags((prev) => prev.filter((t) => t.id !== tagId));
  const clearAll = () => { setSelectedTags([]); setResults(null); };

  const searchByTags = async (tags = selectedTags) => {
    if (tags.length === 0) return;
    setIsSearching(true);
    try {
      const res = await fanficApi.searchByTags(tags.map((t) => t.id));
      setResults(Array.isArray(res) ? res : []);
    } catch { setResults([]); }
    finally { setIsSearching(false); }
  };

  return (
    <PageLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>Buscar por Tags</h1>
          <p>Selecione tags para encontrar fanfics. Combine múltiplas tags para refinar sua busca.</p>
        </div>

        <div className={styles.content}>
          {/* Filtro */}
          <div className={styles.filterSection}>
            <div className={styles.typeTabs}>
              {TAG_TYPES.map((t) => (
                <button
                  key={t.key}
                  className={`${styles.typeTab} ${activeType === t.key ? styles.active : ''}`}
                  onClick={() => { setActiveType(t.key); setQuery(''); setSuggestions([]); }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className={styles.searchWrapper} ref={suggestionsRef}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Digite para buscar tags..."
                value={query}
                onChange={handleQueryChange}
              />
              {showSuggestions && (
                <div className={styles.suggestions}>
                  {suggestions.map((tag) => (
                    <button key={tag.id} className={styles.suggestion} onClick={() => addTag(tag)}>
                      <TagBadge tag={tag} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tags selecionadas */}
            <div className={styles.selectedSection}>
              <h3>Tags Selecionadas</h3>
              {selectedTags.length === 0 ? (
                <p className={styles.noTags}>Nenhuma tag selecionada. Busque e selecione tags acima.</p>
              ) : (
                <div className={styles.selectedTags}>
                  {selectedTags.map((tag) => (
                    <div key={tag.id} className={styles.selectedTag}>
                      <TagBadge tag={tag} />
                      <button className={styles.removeTag} onClick={() => removeTag(tag.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {selectedTags.length > 0 && (
                <div className={styles.searchActions}>
                  <button className={styles.searchBtn} onClick={() => searchByTags()} disabled={isSearching}>
                    {isSearching ? 'Buscando...' : 'Buscar Fanfics'}
                  </button>
                  <button className={styles.clearBtn} onClick={clearAll}>Limpar Todas</button>
                </div>
              )}
            </div>
          </div>

          {/* Resultados */}
          {isSearching ? (
            <LoadingSpinner text="Buscando fanfics..." />
          ) : results !== null && (
            <div className={styles.results}>
              <h2>Resultados da Busca <span>({results.length})</span></h2>
              <CoverGrid stories={results} emptyText="Nenhuma fanfic encontrada com essas tags." />
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
