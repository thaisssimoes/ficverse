import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fanficApi } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import styles from './LandingPage.module.css';

function FanficCard({ fanfic }) {
  const coverUrl = fanficApi.getAssetUrl(fanfic.cover_url);
  return (
    <Link to={`/fanfic/${fanfic.id}`} className={styles.storyCard}>
      <div className={styles.storyCover}>
        {coverUrl ? (
          <img src={coverUrl} alt={fanfic.title} className={styles.coverImg} />
        ) : (
          <div className={styles.coverPlaceholder}>
            <span>{fanfic.title?.charAt(0)}</span>
          </div>
        )}
      </div>
      <div className={styles.storyInfo}>
        {fanfic.category && <span className={styles.categoryBadge}>{fanfic.category}</span>}
        <h3 className={styles.storyTitle}>{fanfic.title}</h3>
        <p className={styles.storyAuthor}>por {fanfic.author_username || 'Autor'}</p>
      </div>
    </Link>
  );
}

export default function LandingPage() {
  const { data: trendingData, isLoading } = useQuery({
    queryKey: ['trending-landing'],
    queryFn: () => fanficApi.getTrending('', 6),
  });

  const trending = Array.isArray(trendingData) ? trendingData : [];

  return (
    <div className={styles.page}>
      {/* Navbar simples da landing */}
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <Link to="/" className={styles.logo}>FicVerse</Link>
          <div className={styles.navLinks}>
            <a href="#como-funciona">Como Funciona</a>
            <a href="#bombando">O que está bombando</a>
            <Link to="/login" className={styles.btnLogin}>Entrar</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Pare de imaginar o S/N.<br />
              <span className="gradient-text">Torne-se o S/N.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Fanfics interativas. Sem anúncios. Imersão total.
            </p>
            <Link to="/register" className={styles.btnPrimary}>
              Criar Minha Persona
            </Link>
          </div>

          <div className={styles.heroImage}>
            <div className={styles.phoneMockup}>
              <div className={styles.phoneScreen}>
                <div className={styles.storyPreview}>
                  <h3>(S/N)</h3>
                  <p className={styles.storyName}>Thaís</p>
                  <p className={styles.storyText}>Uma história onde você é...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className={styles.featuresSection}>
        <h2 className={styles.sectionTitle}>Como Funciona</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3>Crie sua Persona</h3>
            <p>Personalize seu perfil de leitora e entre de verdade nas histórias.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h3>Escolha o Universo</h3>
            <p>Explore fanfics interativas dos seus fandoms favoritos.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h3>Entre na Cena</h3>
            <p>Suas respostas são incorporadas na história. Você é a protagonista.</p>
          </div>
        </div>
      </section>

      {/* O que está bombando */}
      <section id="bombando" className={styles.benefitsSection}>
        <div className={styles.benefitsContainer}>
          <h2 className={styles.sectionTitle}>O que está bombando</h2>
          {isLoading ? (
            <LoadingSpinner text="Carregando histórias..." />
          ) : trending.length > 0 ? (
            <div className={styles.storiesShowcase}>
              {trending.map((fanfic) => (
                <FanficCard key={fanfic.id} fanfic={fanfic} />
              ))}
            </div>
          ) : (
            <p className={styles.emptyMsg}>Nenhuma história disponível no momento.</p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContainer}>
          <h2>Pronto para sua história?</h2>
          <p>Junte-se a leitoras que já vivem suas próprias aventuras</p>
          <Link to="/register" className={styles.btnPrimary}>Começar Agora</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerBrand}>
            <Link to="/" className={styles.logo}>FicVerse</Link>
            <p>Fanfics interativas sem limites</p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerColumn}>
              <h4>Plataforma</h4>
              <a href="#como-funciona">Como Funciona</a>
              <a href="#bombando">O que está bombando</a>
              <Link to="/explore">Explorar</Link>
            </div>
            <div className={styles.footerColumn}>
              <h4>Comunidade</h4>
              <Link to="/register">Criar Conta</Link>
              <Link to="/login">Entrar</Link>
              <Link to="/dashboard">Dashboard</Link>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} FicVerse. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
