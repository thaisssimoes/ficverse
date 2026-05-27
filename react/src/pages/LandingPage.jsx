import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fanficApi } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import styles from './LandingPage.module.css';

/* Mapa de categoria → cor (para placeholders de capa) */
const CATEGORY_COLORS = {
  romance:  { bg: '#d24a2e', label: 'Romance' },
  drama:    { bg: '#6e2c52', label: 'Drama' },
  fantasia: { bg: '#3a6049', label: 'Fantasia' },
  aventura: { bg: '#a25620', label: 'Aventura' },
  comedia:  { bg: '#e0a428', label: 'Comédia' },
  misterio: { bg: '#3a3548', label: 'Mistério' },
  scifi:    { bg: '#2a3a58', label: 'Sci-Fi' },
  terror:   { bg: '#26201d', label: 'Terror' },
  default:  { bg: '#4d3f30', label: '' },
};

function getCategoryStyle(category) {
  const key = (category || '').toLowerCase().replace(/[^a-z]/g, '');
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
}

function StoryCard({ fanfic }) {
  const coverUrl = fanficApi.getAssetUrl(fanfic.cover_url);
  const cat = getCategoryStyle(fanfic.category);

  return (
    <Link to={`/fanfic/${fanfic.id}`} className={styles.storyCard}>
      <div className={styles.storyCover} style={{ background: cat.bg }}>
        {coverUrl ? (
          <img src={coverUrl} alt={fanfic.title} className={styles.coverImg} />
        ) : (
          <div className={styles.coverPlaceholder}>
            {cat.label && (
              <span className={styles.coverCat}>{cat.label}</span>
            )}
            <span className={styles.coverInitial}>{fanfic.title?.charAt(0)}</span>
          </div>
        )}
        {fanfic.interactive_mode && (
          <span className={styles.interactiveBadge}>✦ Interativa</span>
        )}
      </div>
      <div className={styles.storyInfo}>
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

      {/* ── Navbar ── */}
      <nav className={styles.navbar}>
        <div className={styles.navInner}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoItalic}>fic</span>
            <span className={styles.logoDot} />
            <span>verse</span>
          </Link>
          <div className={styles.navLinks}>
            <a href="#como-funciona">Como funciona</a>
            <a href="#destaques">Destaques</a>
            <a href="#para-autoras">Para autoras</a>
          </div>
          <div className={styles.navActions}>
            <Link to="/login" className={styles.btnEntrar}>Entrar</Link>
            <Link to="/register" className={styles.btnCriar}>Criar conta</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        {/* decorações */}
        <svg className={styles.heroDeco1} viewBox="0 0 60 60" aria-hidden>
          <g stroke="#d24a2e" strokeWidth="2" fill="none" strokeLinecap="round">
            <path d="M30 5 L30 15"/><path d="M30 45 L30 55"/>
            <path d="M5 30 L15 30"/><path d="M45 30 L55 30"/>
            <path d="M12 12 L18 18"/><path d="M42 42 L48 48"/>
            <path d="M48 12 L42 18"/><path d="M18 42 L12 48"/>
          </g>
        </svg>
        <svg className={styles.heroDeco2} viewBox="0 0 80 80" aria-hidden>
          <circle cx="20" cy="20" r="3" fill="#e0a428"/>
          <circle cx="50" cy="35" r="4" fill="#5a8038"/>
          <circle cx="30" cy="60" r="3.5" fill="#6e2c52"/>
          <circle cx="65" cy="65" r="2.5" fill="#3a8aa8"/>
        </svg>

        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span>✦</span> Comunidade brasileira de fanfic
            </div>
            <h1 className={styles.heroTitle}>
              Aqui suas histórias{' '}
              <em className={styles.heroTitleAccent}>ganham</em>
              <br />mais de um{' '}
              <mark className={styles.heroTitleMark}>final</mark>.
            </h1>
            <p className={styles.heroSubtitle}>
              Leia, escreva e personalize fanfics onde suas características entram na história.
              Sem algoritmo agressivo — só boas histórias e leitoras de verdade.
            </p>
            <div className={styles.heroCtas}>
              <Link to="/register" className={styles.btnPrimary}>
                Entrar no Ficverse →
              </Link>
              <a href="#destaques" className={styles.btnSecondary}>
                Ler sem cadastro
              </a>
            </div>
            <div className={styles.heroStats}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {['M', 'J', 'L', 'R', 'A'].map((n, i) => (
                  <div
                    key={n}
                    style={{
                      marginLeft: i ? -8 : 0,
                      width: 28, height: 28, borderRadius: '50%',
                      background: ['#5a8038','#a25620','#6e2c52','#d24a2e','#3a8aa8'][i],
                      border: '2px solid #fbf3e2',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Fraunces', Georgia, serif",
                      fontSize: 12, color: '#fffbf3', flexShrink: 0,
                    }}
                  >{n}</div>
                ))}
              </div>
              <span className={styles.heroStat}><b>2.847</b> autoras ativas</span>
              <span className={styles.heroStatDot}>·</span>
              <span className={styles.heroStat}><b>18 mil</b> capítulos publicados</span>
            </div>
          </div>

          {/* Stack visual de capas */}
          <div className={styles.heroVisual} aria-hidden>
            <div className={styles.coverA}>
              <div className={styles.mockCover} style={{ background: '#7e4862' }}>
                <span className={styles.mockCoverLabel}>K-Drama</span>
                <span className={styles.mockCoverTitle}>Aurora ao<br/>Amanhecer</span>
              </div>
            </div>
            <div className={styles.coverB}>
              <div className={styles.mockCover} style={{ background: '#3a4a72' }}>
                <span className={styles.mockCoverLabel}>Fantasia</span>
                <span className={styles.mockCoverTitle}>A Última<br/>Carta</span>
                <span className={styles.mockInteractive}>✦ Interativa</span>
              </div>
            </div>
            <div className={styles.coverC}>
              <div className={styles.mockCover} style={{ background: '#3a6049' }}>
                <span className={styles.mockCoverLabel}>Hogwarts</span>
                <span className={styles.mockCoverTitle}>Constelações<br/>em Hogwarts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section id="como-funciona" className={styles.comoSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <div className={styles.kicker}>Como funciona</div>
            <h2 className={styles.sectionTitle}>
              Três passos. <em className={styles.titlePlum}>Mil universos.</em>
            </h2>
          </div>
          <div className={styles.comoGrid}>
            {[
              {
                num: '01', title: 'Leia', color: '#7a5a14', bg: '#fcefc7', border: '#f5dfa3',
                desc: 'Encontre fanfics por universo, gênero ou vibe. Salve em estantes, siga autoras, marque favoritas.',
              },
              {
                num: '02', title: 'Personalize', color: '#a23320', bg: '#fce8df', border: '#fad6cc',
                desc: 'Crie seu perfil de leitora. Seu nome, apelido, características — tudo isso pode aparecer na história.',
              },
              {
                num: '03', title: 'Escreva', color: '#5a8038', bg: '#ecf2da', border: '#d6e0b9',
                desc: 'Publique capítulos com modo interativo. Suas leitoras entram na trama de verdade.',
              },
            ].map((s) => (
              <div
                key={s.num}
                className={styles.comoCard}
                style={{ background: s.bg, border: `1px solid ${s.border}` }}
              >
                <div className={styles.comoNum} style={{ color: s.color }}>{s.num}</div>
                <h3 className={styles.comoTitle} style={{ color: s.color }}>{s.title}</h3>
                <p className={styles.comoDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Destaques ── */}
      <section id="destaques" className={styles.destaquesSection}>
        <div className={styles.sectionInner}>
          <div className={styles.destaquesHead}>
            <div>
              <div className={styles.kicker}>Em alta hoje</div>
              <h2 className={styles.sectionTitle}>
                Histórias que <em className={styles.titleBrick}>estão dando o que falar</em>
              </h2>
            </div>
            <Link to="/explore" className={styles.btnGhost}>Ver tudo →</Link>
          </div>
          {isLoading ? (
            <LoadingSpinner text="Carregando histórias..." />
          ) : trending.length > 0 ? (
            <div className={styles.storiesGrid}>
              {trending.map((fanfic) => (
                <StoryCard key={fanfic.id} fanfic={fanfic} />
              ))}
            </div>
          ) : (
            <p className={styles.emptyMsg}>Nenhuma história disponível no momento.</p>
          )}
        </div>
      </section>

      {/* ── Depoimentos ── */}
      <section className={styles.depoimentosSection}>
        <div className={styles.sectionInner}>
          <h2 className={styles.depoimentosTitle}>
            Quem escreve aqui <em>diz isso:</em>
          </h2>
          <div className={styles.depoimentosGrid}>
            {[
              {
                quote: 'Voltei a escrever depois de cinco anos. Aqui parece que importa de novo.',
                name: 'Mariana V.', sub: 'autora · 12k leitoras', tone: '#5a8038',
              },
              {
                quote: 'A personalização é genial. Cada leitora entra na história do jeito dela.',
                name: 'Bia L.', sub: 'autora · 28k leitoras', tone: '#a25620',
              },
              {
                quote: 'Sem algoritmo me empurrando coisa. Sigo as autoras que gosto e leio no meu ritmo.',
                name: 'Pedro M.', sub: 'leitor · 142 fanfics lidas', tone: '#6e2c52',
              },
            ].map((d) => (
              <blockquote key={d.name} className={styles.depoimentoCard}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={d.tone} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h4z"/>
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h4z"/>
                </svg>
                <p className={styles.depoimentoQuote}>{d.quote}</p>
                <div className={styles.depoimentoAuthor}>
                  <div className={styles.depoimentoAvatar} style={{ background: d.tone }}>
                    {d.name.charAt(0)}
                  </div>
                  <div>
                    <div className={styles.depoimentoName}>{d.name}</div>
                    <div className={styles.depoimentoSub}>{d.sub}</div>
                  </div>
                </div>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para autoras ── */}
      <section id="para-autoras" className={styles.autorasSection}>
        <div className={styles.autorasInner}>
          <div className={styles.autorasContent}>
            <div className={styles.kickerLight}>Para quem escreve</div>
            <h2 className={styles.autorasTitle}>
              Sua história não <em>compete</em><br/>com vídeo curto.
            </h2>
            <p className={styles.autorasSubtitle}>
              O Ficverse é feito pra leitura longa. Sem feed infinito, sem métrica
              de retenção. Só você, suas leitoras, e capítulos que respiram.
            </p>
            <ul className={styles.featureList}>
              {[
                'Modo interativo: leitoras entram nas suas histórias',
                'Estatísticas de leitura por capítulo',
                'Mural de comentários sem ranking inflado',
                'Perfis de leitura personalizados',
              ].map((item) => (
                <li key={item} className={styles.featureItem}>
                  <span className={styles.featureCheck}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/register" className={styles.btnMustard}>
              Comece a publicar →
            </Link>
          </div>
          <div className={styles.autorasMock} aria-hidden>
            <div className={styles.editorMock}>
              <div className={styles.editorMockBar}>
                <span className={styles.editorDot} style={{ background: '#e57373' }}/>
                <span className={styles.editorDot} style={{ background: '#f5cd6c' }}/>
                <span className={styles.editorDot} style={{ background: '#84c47a' }}/>
                <span className={styles.editorBadge}>Cap. 12 · rascunho</span>
              </div>
              <div className={styles.editorMockTitle}>
                <em>O baile</em> em Hogsmeade
              </div>
              <p className={styles.editorMockText}>
                A neve caía em Hogsmeade quando ela parou na frente do Three Broomsticks.
                Pela janela, viu Draco. Ela podia <em>entrar</em> ou <em>seguir</em> caminhando.
              </p>
              <div className={styles.editorBranch}>
                <div className={styles.editorBranchLabel}>↳ Modo Interativo ativo</div>
                <div className={styles.editorBranchGrid}>
                  <div className={styles.editorBranchOpt}>
                    <b>A.</b> Entrar na história
                    <span>→ leitora como personagem</span>
                  </div>
                  <div className={styles.editorBranchOpt}>
                    <b>B.</b> Modo padrão
                    <span>→ sem personalização</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>
            Sua próxima história te <em className={styles.ctaAccent}>espera</em>.
          </h2>
          <p className={styles.ctaSubtitle}>
            Cadastro grátis, sem cartão, sem cobrança. Sua biblioteca, seu mural, seu ritmo.
          </p>
          <div className={styles.ctaActions}>
            <Link to="/register" className={styles.btnPrimary}>Criar minha conta →</Link>
            <Link to="/login" className={styles.btnGhostLight}>Já tenho conta</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Link to="/" className={styles.footerLogo}>
              <span className={styles.logoItalic}>fic</span>
              <span className={styles.logoDotDark} />
              <span>verse</span>
            </Link>
            <p className={styles.footerTagline}>
              Plataforma brasileira de fanfic interativa.<br/>
              Feito por leitoras, pra leitoras e autoras.
            </p>
          </div>
          <div className={styles.footerCols}>
            {[
              {
                t: 'Plataforma',
                l: [
                  { label: 'Como funciona', href: '#como-funciona' },
                  { label: 'Destaques', href: '#destaques' },
                  { label: 'Para autoras', href: '#para-autoras' },
                  { label: 'Explorar', to: '/explore' },
                ],
              },
              {
                t: 'Comunidade',
                l: [
                  { label: 'Criar conta', to: '/register' },
                  { label: 'Entrar', to: '/login' },
                  { label: 'Painel', to: '/dashboard' },
                ],
              },
              {
                t: 'Recursos',
                l: [
                  { label: 'Editor', to: '/dashboard' },
                  { label: 'Perfis de leitura', to: '/profiles' },
                  { label: 'Buscar tags', to: '/tags' },
                ],
              },
            ].map((col) => (
              <div key={col.t} className={styles.footerCol}>
                <h4 className={styles.footerColTitle}>{col.t}</h4>
                {col.l.map((item) =>
                  item.to ? (
                    <Link key={item.label} to={item.to} className={styles.footerLink}>{item.label}</Link>
                  ) : (
                    <a key={item.label} href={item.href} className={styles.footerLink}>{item.label}</a>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} Ficverse · Brasil</span>
          <span>v3 · feito com afeto</span>
        </div>
      </footer>
    </div>
  );
}
