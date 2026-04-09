import { useState } from 'react';
import {
  Plus,
  BookOpen,
  Edit2,
  Eye,
  Trash2,
  BarChart2,
  Heart,
  MessageSquare,
} from 'lucide-react';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const FANFICS = [
  {
    id: 1,
    title: 'A Sombra do Rei Eterno',
    category: 'Fantasia',
    status: 'publicada',
    synopsis:
      'Em um reino esquecido pelos deuses, um jovem escriba descobre que a lenda do monarca imortal não é apenas um conto — é um aviso. Agora ele carrega o segredo que pode destruir o trono ou salvá-lo.',
    publishedChapters: 10,
    totalChapters: 12,
    words: '87.420',
  },
  {
    id: 2,
    title: 'Entre Estrelas e Cinzas',
    category: 'Sci-Fi / Romance',
    status: 'publicada',
    synopsis:
      'Dois exploradores em lados opostos de uma guerra intergaláctica se encontram no único planeta neutro que resta. O tempo que têm é curto. O que constroem pode durar para sempre.',
    publishedChapters: 8,
    totalChapters: 8,
    words: '61.300',
  },
  {
    id: 3,
    title: 'O Último Acordo',
    category: 'Drama',
    status: 'rascunho',
    synopsis:
      'Uma pianista que perdeu a audição e um compositor que nunca terminou uma obra. O que nasce entre silêncios pode ser a música mais honesta que o mundo já ouviu.',
    publishedChapters: 0,
    totalChapters: 3,
    words: '18.200',
  },
  {
    id: 4,
    title: 'Fragmentos de Inverno',
    category: 'Slice of Life',
    status: 'rascunho',
    synopsis: 'Rascunho em andamento.',
    publishedChapters: 0,
    totalChapters: 1,
    words: '4.100',
  },
  {
    id: 5,
    title: 'Herança de Sangue',
    category: 'Fantasia / Ação',
    status: 'publicada',
    synopsis:
      'Três irmãos, uma maldição antiga e um trono que nenhum deles quer — mas que todos precisam conquistar para sobreviver.',
    publishedChapters: 22,
    totalChapters: 22,
    words: '194.750',
  },
  {
    id: 6,
    title: 'Noites em Neverland',
    category: 'Aventura',
    status: 'publicada',
    synopsis:
      'Peter Pan nunca foi o herói. Ele era o guardião de um lugar que não podia existir sem sacrifício.',
    publishedChapters: 6,
    totalChapters: 6,
    words: '42.900',
  },
  {
    id: 7,
    title: 'Código Vermelho',
    category: 'Thriller',
    status: 'rascunho',
    synopsis: 'Rascunho em andamento.',
    publishedChapters: 0,
    totalChapters: 2,
    words: '9.600',
  },
];

// Mapa de capítulos por fanfic (id → array)
const CHAPTERS_BY_FANFIC = {
  1: [
    { id: 1, title: 'Prólogo: O Começo do Fim',      date: 'Jan 10, 2024', status: 'publicado' },
    { id: 2, title: 'Capítulo 1: A Convocação',       date: 'Jan 17, 2024', status: 'publicado' },
    { id: 3, title: 'Capítulo 2: O Trono Vazio',      date: 'Jan 24, 2024', status: 'publicado' },
    { id: 4, title: 'Capítulo 3: Sombras no Corredor',date: 'Jan 31, 2024', status: 'publicado' },
    { id: 5, title: 'Capítulo 4: A Traição',          date: 'Fev 07, 2024', status: 'publicado' },
    { id: 6, title: 'Capítulo 5: O Exílio',           date: 'Fev 14, 2024', status: 'publicado' },
    { id: 7, title: 'Capítulo 6: Aliados Improváveis',date: 'Fev 21, 2024', status: 'publicado' },
    { id: 8, title: 'Capítulo 7: O Mapa Proibido',    date: 'Fev 28, 2024', status: 'publicado' },
    { id: 9, title: 'Capítulo 8: Batalha no Vale',    date: 'Mar 06, 2024', status: 'publicado' },
    { id: 10,title: 'Capítulo 9: O Preço da Vitória', date: 'Mar 13, 2024', status: 'publicado' },
    { id: 11,title: 'Capítulo 10: Revelações',        date: '—',            status: 'rascunho'  },
    { id: 12,title: 'Epílogo: Uma Nova Era',          date: '—',            status: 'rascunho'  },
  ],
  2: [
    { id: 1, title: 'Capítulo 1: Órbita Zero',          date: 'Mar 01, 2024', status: 'publicado' },
    { id: 2, title: 'Capítulo 2: O Planeta Neutro',      date: 'Mar 08, 2024', status: 'publicado' },
    { id: 3, title: 'Capítulo 3: Primeiros Sinais',      date: 'Mar 15, 2024', status: 'publicado' },
    { id: 4, title: 'Capítulo 4: Armistício Pessoal',    date: 'Mar 22, 2024', status: 'publicado' },
    { id: 5, title: 'Capítulo 5: Gravidade',             date: 'Mar 29, 2024', status: 'publicado' },
    { id: 6, title: 'Capítulo 6: O Aviso',               date: 'Abr 05, 2024', status: 'publicado' },
    { id: 7, title: 'Capítulo 7: Countdown',             date: 'Abr 12, 2024', status: 'publicado' },
    { id: 8, title: 'Epílogo: Luz que Demora',           date: 'Abr 19, 2024', status: 'publicado' },
  ],
  3: [
    { id: 1, title: 'Capítulo 1: O Silêncio Primeiro',  date: '—', status: 'rascunho' },
    { id: 2, title: 'Capítulo 2: Notas em Braille',     date: '—', status: 'rascunho' },
    { id: 3, title: 'Capítulo 3: O Acordo Final',       date: '—', status: 'rascunho' },
  ],
  4: [
    { id: 1, title: 'Capítulo 1: Dezembro',             date: '—', status: 'rascunho' },
  ],
  5: Array.from({ length: 22 }, (_, i) => ({
    id: i + 1,
    title: i === 0 ? 'Prólogo: Sangue Chama Sangue' : `Capítulo ${i}: ${['A Herança','O Ritual','Primogênito','A Maldição','Irmãos','O Trono','Traição','A Fuga','Aliança','Batalha','Segredo','O Pacto','Retorno','A Prova','Sacrifício','Renascimento','O Julgamento','Cinzas','Novo Rei','Últimas Palavras','Epílogo'][i - 1] ?? `Parte ${i}`}`,
    date: `Jan ${String(i + 1).padStart(2, '0')}, 2024`,
    status: 'publicado',
  })),
  6: [
    { id: 1, title: 'Capítulo 1: A Segunda Estrela à Direita', date: 'Dez 01, 2023', status: 'publicado' },
    { id: 2, title: 'Capítulo 2: Voo Noturno',                 date: 'Dez 08, 2023', status: 'publicado' },
    { id: 3, title: 'Capítulo 3: O Preço de Neverland',        date: 'Dez 15, 2023', status: 'publicado' },
    { id: 4, title: 'Capítulo 4: Sombras que Crescem',         date: 'Dez 22, 2023', status: 'publicado' },
    { id: 5, title: 'Capítulo 5: A Última Maré',               date: 'Dez 29, 2023', status: 'publicado' },
    { id: 6, title: 'Epílogo: Guardião',                       date: 'Jan 05, 2024', status: 'publicado' },
  ],
  7: [
    { id: 1, title: 'Capítulo 1: Alerta Silencioso', date: '—', status: 'rascunho' },
    { id: 2, title: 'Capítulo 2: A Fonte',           date: '—', status: 'rascunho' },
  ],
};

const TABS = ['Informações', 'Capítulos', 'Estatísticas'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ status, light = false }) {
  const isPublished = status === 'publicada' || status === 'publicado';
  if (light) {
    return (
      <span
        className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded ${
          isPublished
            ? 'bg-teal-100 text-teal-700'
            : 'bg-amber-100 text-amber-700'
        }`}
      >
        {isPublished ? 'Publicada' : 'Rascunho'}
      </span>
    );
  }
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded ${
        isPublished
          ? 'bg-teal-900/60 text-teal-400'
          : 'bg-amber-900/40 text-amber-400'
      }`}
    >
      {isPublished ? 'Publicada' : 'Rascunho'}
    </span>
  );
}

function ChapterStatusBadge({ status }) {
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded ${
        status === 'publicado'
          ? 'bg-teal-900/60 text-teal-400'
          : 'bg-amber-900/40 text-amber-400'
      }`}
    >
      {status === 'publicado' ? 'Publicado' : 'Rascunho'}
    </span>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

function TabInformacoes({ fanfic }) {
  return (
    <div className="space-y-8">
      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-px bg-gray-800 border border-gray-800 rounded-md overflow-hidden">
        {[
          { label: 'Categoria',          value: fanfic.category },
          { label: 'Status',             value: fanfic.status === 'publicada' ? 'Publicada' : 'Rascunho' },
          { label: 'Capítulos Totais',   value: fanfic.totalChapters },
          { label: 'Palavras (estimado)',value: fanfic.words },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#1E1E1E] px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1">
              {label}
            </p>
            <p className="text-gray-200 font-medium text-sm">{value}</p>
          </div>
        ))}
      </div>

      {/* Sinopse */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Sinopse
          </p>
          <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-400 transition-colors">
            <Edit2 size={11} />
            Editar
          </button>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed border-l-2 border-gray-700 pl-4">
          {fanfic.synopsis}
        </p>
      </div>
    </div>
  );
}

function TabCapitulos({ fanfic }) {
  const chapters = CHAPTERS_BY_FANFIC[fanfic.id] ?? [];
  const publishedCount = chapters.filter((c) => c.status === 'publicado').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm font-medium text-gray-400">
          <span className="text-gray-100 font-semibold">{publishedCount}</span>{' '}
          {publishedCount === 1 ? 'capítulo publicado' : 'capítulos publicados'}
          {chapters.length > publishedCount && (
            <span className="text-gray-600 ml-1">
              · {chapters.length - publishedCount} em rascunho
            </span>
          )}
        </p>
        <button className="flex items-center gap-2 bg-teal-700 hover:bg-teal-600 transition-colors text-white text-xs font-semibold px-3.5 py-2 rounded-md">
          <Plus size={13} />
          Adicionar Novo Capítulo
        </button>
      </div>

      {/* Header da tabela */}
      <div className="grid grid-cols-[1fr_140px_110px_80px] gap-x-4 px-4 pb-2 border-b border-gray-800">
        {['Título', 'Publicação', 'Status', ''].map((h) => (
          <p
            key={h}
            className="text-[10px] font-semibold uppercase tracking-widest text-gray-600"
          >
            {h}
          </p>
        ))}
      </div>

      {/* Linhas */}
      <ul>
        {chapters.map((ch) => (
          <li
            key={ch.id}
            className="grid grid-cols-[1fr_140px_110px_80px] gap-x-4 items-center px-4 py-3.5 border-b border-gray-800 hover:bg-white/[0.02] transition-colors group"
          >
            {/* Título */}
            <p className="text-sm text-gray-200 font-medium truncate">{ch.title}</p>

            {/* Data */}
            <p className="text-xs text-gray-500 font-mono">{ch.date}</p>

            {/* Status */}
            <div>
              <ChapterStatusBadge status={ch.status} />
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                title="Editar"
                className="p-1.5 text-gray-500 hover:text-teal-400 hover:bg-teal-400/10 rounded transition-colors"
              >
                <Edit2 size={13} />
              </button>
              <button
                title="Visualizar"
                className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded transition-colors"
              >
                <Eye size={13} />
              </button>
              <button
                title="Excluir"
                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TabEstatisticas({ fanfic }) {
  const stats = [
    { label: 'Visualizações', value: '14.320', icon: Eye,           delta: '+8%' },
    { label: 'Favoritos',     value: '832',    icon: Heart,          delta: '+12%' },
    { label: 'Comentários',   value: '247',    icon: MessageSquare,  delta: '+3%' },
    { label: 'Capítulos',     value: fanfic.totalChapters, icon: BookOpen, delta: null },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {stats.map(({ label, value, icon: Icon, delta }) => (
          <div
            key={label}
            className="bg-[#252525] border border-gray-800 rounded-md p-5 flex items-start gap-4"
          >
            <div className="p-2 bg-teal-700/20 rounded-md shrink-0">
              <Icon size={16} className="text-teal-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-100 leading-none">{value}</p>
              <p className="text-[11px] uppercase tracking-widest text-gray-500 mt-1.5">{label}</p>
              {delta && (
                <p className="text-[11px] text-teal-500 font-medium mt-1">{delta} este mês</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder do gráfico */}
      <div className="bg-[#252525] border border-gray-800 rounded-md p-6 h-52 flex flex-col items-center justify-center gap-3 text-gray-700">
        <BarChart2 size={32} strokeWidth={1.25} />
        <p className="text-xs uppercase tracking-widest">Gráfico de visualizações em breve</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MinhasFanfics() {
  const [selectedStory, setSelectedStory] = useState(1);
  const [activeTab, setActiveTab] = useState('Capítulos');

  const selected = FANFICS.find((f) => f.id === selectedStory) ?? null;
  const published = FANFICS.filter((f) => f.status === 'publicada');
  const drafts    = FANFICS.filter((f) => f.status === 'rascunho');

  return (
    <div className="flex w-full h-full bg-[#121212] text-gray-100 overflow-hidden">

      {/* ── Coluna 1 · Lista de Histórias ─────────────────────────────── */}
      <aside className="w-[320px] shrink-0 border-r border-gray-800 flex flex-col overflow-y-auto">

        {/* Botão principal */}
        <div className="p-4 border-b border-gray-800">
          <button className="w-full flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-600 transition-colors text-white text-sm font-semibold py-2.5 rounded-md">
            <Plus size={15} />
            Nova Fanfic
          </button>
        </div>

        {/* TODAS */}
        <SectionLabel label={`Todas (${FANFICS.length})`} />
        <StoryList
          items={FANFICS}
          selectedStory={selectedStory}
          onSelect={(id) => setSelectedStory(id)}
        />

        {/* RASCUNHOS */}
        <SectionLabel label={`Rascunhos (${drafts.length})`} topBorder />
        <StoryList
          items={drafts}
          selectedStory={selectedStory}
          onSelect={(id) => setSelectedStory(id)}
          compact
        />

        {/* PUBLICADAS */}
        <SectionLabel label={`Publicadas (${published.length})`} topBorder />
        <StoryList
          items={published}
          selectedStory={selectedStory}
          onSelect={(id) => setSelectedStory(id)}
          compact
        />

        {/* Espaçador final */}
        <div className="pb-6" />
      </aside>

      {/* ── Coluna 2 · Detalhe da Fanfic ──────────────────────────────── */}
      <main className="flex-1 bg-[#1E1E1E] overflow-y-auto">
        {!selected ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-700">
            <BookOpen size={44} strokeWidth={1} />
            <p className="text-sm uppercase tracking-widest">Selecione uma fanfic</p>
          </div>
        ) : (
          <div className="p-8 max-w-4xl">

            {/* Cabeçalho */}
            <div className="mb-1">
              <StatusBadge status={selected.status} />
            </div>
            <h1 className="font-serif text-[2.25rem] font-bold text-gray-50 leading-tight mt-3">
              {selected.title}
            </h1>
            <p className="text-gray-500 text-sm mt-1.5">{selected.category}</p>

            {/* Tabs */}
            <div className="flex mt-8 border-b border-gray-800">
              {TABS.map((tab) => {
                const isActive = tab === activeTab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-5 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-gray-100'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tab}
                    {isActive && (
                      <span className="absolute bottom-0 inset-x-0 h-[2px] bg-teal-600 rounded-t" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Conteúdo da tab */}
            <div className="mt-7">
              {activeTab === 'Informações'  && <TabInformacoes  fanfic={selected} />}
              {activeTab === 'Capítulos'    && <TabCapitulos    fanfic={selected} />}
              {activeTab === 'Estatísticas' && <TabEstatisticas fanfic={selected} />}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

// ─── Componentes auxiliares da sidebar ───────────────────────────────────────

function SectionLabel({ label, topBorder = false }) {
  return (
    <div
      className={`px-4 pt-5 pb-2 ${
        topBorder ? 'border-t border-gray-800/70 mt-1' : ''
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
        {label}
      </p>
    </div>
  );
}

function StoryList({ items, selectedStory, onSelect, compact = false }) {
  return (
    <ul className="px-2">
      {items.map((fanfic) => {
        const isActive = fanfic.id === selectedStory;

        if (compact) {
          return (
            <li key={fanfic.id}>
              <button
                onClick={() => onSelect(fanfic.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors truncate ${
                  isActive
                    ? 'text-gray-900 bg-gray-100 font-semibold'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                {fanfic.title}
              </button>
            </li>
          );
        }

        return (
          <li key={fanfic.id}>
            <button
              onClick={() => onSelect(fanfic.id)}
              className={`w-full text-left px-3 py-3 rounded-md flex items-start gap-2.5 transition-colors ${
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'hover:bg-gray-800/50 text-gray-300'
              }`}
            >
              {/* Dot indicador de seleção */}
              <span
                className={`mt-[7px] shrink-0 w-1.5 h-1.5 rounded-full transition-colors ${
                  isActive ? 'bg-teal-600' : 'bg-transparent'
                }`}
              />

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold leading-snug truncate ${
                    isActive ? 'text-gray-900' : 'text-gray-200'
                  }`}
                >
                  {fanfic.title}
                </p>
                <p className="text-xs mt-0.5 text-gray-500 truncate">{fanfic.category}</p>
                <div className="mt-2">
                  <StatusBadge status={fanfic.status} light={isActive} />
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
