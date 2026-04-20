import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import styles from './GuiaPage.module.css';

function Step({ number, title, children }) {
  return (
    <div className={styles.step}>
      <div className={styles.stepNumber}>{number}</div>
      <div className={styles.stepBody}>
        <h3 className={styles.stepTitle}>{title}</h3>
        <div className={styles.stepContent}>{children}</div>
      </div>
    </div>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id} className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

const TABS = [
  { key: 'normal',    label: 'História Normal'    },
  { key: 'interativa', label: 'História Interativa' },
  { key: 'dicas',    label: 'Dicas Gerais'        },
];

export default function GuiaPage() {
  const [activeTab, setActiveTab] = useState('normal');

  return (
    <PageLayout>
      <div className={styles.page}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Guia</p>
          <h1 className={styles.title}>Como publicar sua história</h1>
          <p className={styles.subtitle}>
            Tudo o que você precisa saber para criar, configurar e publicar uma
            fanfic na Lollipopfics — passo a passo.
          </p>
          <nav className={styles.toc}>
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`${styles.tocLink} ${activeTab === t.key ? styles.tocLinkActive : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </header>

        {/* ── História Normal ── */}
        {activeTab === 'normal' && (
          <Section id="normal" title="Publicando uma história normal">
            <p className={styles.sectionIntro}>
              Uma história normal é lida por todos os leitores da mesma forma,
              sem personalização. Ideal para quem quer começar rápido.
            </p>

            <Step number="1" title="Crie um rascunho">
              <p>
                No seu <Link to="/dashboard" className={styles.inlineLink}>painel do autor</Link>,
                clique em <strong>+ Nova História</strong>. Preencha o título,
                escolha uma categoria e escreva a sinopse. A história começa como
                rascunho — invisível para os leitores até você publicar.
              </p>
              <div className={styles.tip}>
                A sinopse é o primeiro contato do leitor com a sua história.
                Seja direta e evite spoilers.
              </div>
            </Step>

            <Step number="2" title="Configure as informações">
              <p>
                Na aba <strong>Informações</strong>, você pode adicionar uma capa,
                editar o título e marcar a história como <em>Completa</em> ou
                <em> Em andamento</em>.
              </p>
              <p>
                No campo <strong>Disclaimer</strong>, coloque avisos autorais,
                créditos de personagens ou qualquer nota ao leitor.
              </p>
            </Step>

            <Step number="3" title="Classifique a história">
              <p>
                Na aba <strong>Classificações</strong>, marque se o conteúdo é
                adulto (+18) e adicione <em>Trigger Warnings</em> — avisos sobre
                temas sensíveis que podem aparecer na história.
              </p>
              <p>
                Adicione também as <strong>tags</strong> de Fandom e Pairing.
                Digite pelo menos 3 letras para ver sugestões.
                Boas tags ajudam leitores a encontrar sua história.
              </p>
            </Step>

            <Step number="4" title="Escreva os capítulos">
              <p>
                Na aba <strong>Capítulos</strong>, clique em{' '}
                <strong>+ Novo Capítulo</strong>. Use o editor para escrever o
                conteúdo, defina o título e escolha publicar ou salvar como
                rascunho.
              </p>
              <p>
                Capítulos em rascunho ficam visíveis apenas para você no painel.
                Publique cada capítulo quando estiver pronto para os leitores.
              </p>
            </Step>

            <Step number="5" title="Publique a história">
              <p>
                Com pelo menos um capítulo publicado, vá ao painel lateral direito
                e clique em <strong>Publicar</strong>. A história passa a aparecer
                nas buscas e na página de exploração.
              </p>
              <div className={styles.tip}>
                Você pode mover a história de volta para rascunho a qualquer
                momento — ela sai das buscas mas seus dados são preservados.
              </div>
            </Step>
          </Section>
        )}

        {/* ── História Interativa ── */}
        {activeTab === 'interativa' && (
          <Section id="interativa" title="Publicando uma história interativa">
            <p className={styles.sectionIntro}>
              No modo interativo, o leitor responde a perguntas antes de ler e o
              texto da história é personalizado com as respostas. Ótimo para
              histórias de inserção de leitor ou narrativas personalizadas.
            </p>

            <Step number="1" title="Ative o modo interativo">
              <p>
                Ao criar a história, marque a opção <strong>Modo Interativo</strong>
                ou vá até a aba <em>Modo Interativo</em> no painel — onde você pode
                ativar ou desativar o modo a qualquer momento.
              </p>
            </Step>

            <Step number="2" title="Crie as variáveis">
              <p>
                Na aba <strong>Modo Interativo</strong>, adicione as perguntas que
                serão feitas ao leitor. Cada pergunta gera uma{' '}
                <strong>variável</strong> — um marcador que você insere no texto do
                capítulo.
              </p>
              <p>Existem dois tipos de variável:</p>
              <ul className={styles.varList}>
                <li>
                  <strong>Variável padrão</strong> — pré-definida pela plataforma
                  (ex: primeiro nome, apelido, cor dos olhos). O leitor pode salvar
                  esses dados no <em>Perfil de Leitura</em> e reutilizá-los em
                  qualquer história que use as mesmas variáveis.
                </li>
                <li>
                  <strong>Variável customizada</strong> — específica desta
                  história (ex: nome do personagem favorito, cidade natal do
                  herói). O nome da variável deve usar apenas letras minúsculas,
                  números, hífen e underscore — sem espaços ou acentos.
                </li>
              </ul>
              <div className={styles.tip}>
                Exemplo de variável padrão: <code>{'{{primeiro_nome}}'}</code>
                {' '}→ aparece no texto como o nome que o leitor salvou no perfil.
              </div>
            </Step>

            <Step number="3" title="Use as variáveis nos capítulos">
              <p>
                No editor de capítulos, insira as variáveis diretamente no texto
                usando a sintaxe <code>{'{{nome_da_variavel}}'}</code>. O sistema
                substitui automaticamente pelo valor respondido pelo leitor.
              </p>
              <p>Exemplo de trecho com variáveis:</p>
              <div className={styles.example}>
                <p>
                  {'"'}Bem-vindo, <code>{'{{primeiro_nome}}'}</code>.{'"'} ele disse,
                  os olhos fixos em você. {'"'}Sabia que você viria de{' '}
                  <code>{'{{cidade_origem}}'}</code>.{'"'}
                </p>
              </div>
              <p>Depois que o leitor responder às perguntas, o texto renderizado ficará assim:</p>
              <div className={styles.example}>
                <p>
                  {'"'}Bem-vindo, <em>Ana</em>.{'"'} ele disse, os olhos fixos em você.{' '}
                  {'"'}Sabia que você viria de <em>São Paulo</em>.{'"'}
                </p>
              </div>
            </Step>

            <Step number="4" title="Defina respostas padrão">
              <p>
                Para cada variável, você pode definir uma{' '}
                <strong>resposta padrão</strong>. Leitores que escolherem o{' '}
                <em>Modo Normal</em> verão o texto com esses valores padrão em vez
                de tags visíveis.
              </p>
              <div className={styles.tip}>
                Respostas padrão são obrigatórias se você quiser que a história
                faça sentido no modo não-interativo.
              </div>
            </Step>

            <Step number="5" title="Publique normalmente">
              <p>
                O restante do fluxo é igual ao de uma história normal: adicione
                capítulos, classifique e publique. Quando um leitor acessar a
                história, verá a opção de escolher entre o{' '}
                <em>Modo Interativo</em> (com suas respostas) e o{' '}
                <em>Modo Normal</em> (com os padrões).
              </p>
            </Step>
          </Section>
        )}

        {/* ── Dicas Gerais ── */}
        {activeTab === 'dicas' && (
          <Section id="dicas" title="Dicas gerais">
            <div className={styles.tipsGrid}>
              <div className={styles.tipCard}>
                <h4 className={styles.tipCardTitle}>Capas</h4>
                <p>Use imagens com proporção 512×800 px (proporção de livro). Máximo de 5 MB. Formatos aceitos: JPG, PNG, WebP.</p>
              </div>
              <div className={styles.tipCard}>
                <h4 className={styles.tipCardTitle}>Tags</h4>
                <p>Tags bem escolhidas aumentam a visibilidade da história. Use tags de fandom reconhecíveis e trigger warnings precisos.</p>
              </div>
              <div className={styles.tipCard}>
                <h4 className={styles.tipCardTitle}>Rascunhos</h4>
                <p>Escreva e revise no rascunho sem pressa. Publique capítulos individualmente conforme ficam prontos.</p>
              </div>
              <div className={styles.tipCard}>
                <h4 className={styles.tipCardTitle}>Modo interativo</h4>
                <p>Nomes de variáveis customizadas: apenas letras minúsculas (a-z), números, hífen e underscore. Sem espaços, sem acentos. Ex: <code>espada_magica</code>, <code>cidade-natal</code>.</p>
              </div>
            </div>
          </Section>
        )}

        <div className={styles.footer}>
          <p>Ficou com dúvidas? Encontrou algum problema?</p>
          <Link to="/dashboard" className={styles.ctaBtn}>Ir para o painel do autor</Link>
        </div>
      </div>
    </PageLayout>
  );
}
