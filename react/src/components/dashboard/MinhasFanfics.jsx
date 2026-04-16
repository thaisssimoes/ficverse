import { useState } from 'react';
import {
  Plus,
  BookOpen,
  Cloud,
  MoreVertical,
  Pencil,
  Eye,
  Heart,
  MessageSquare,
  BarChart2,
  Edit2,
} from 'lucide-react';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const FANFICS = [
  {
    id: 1,
    title: 'The Midnight Gardener',
    category: 'Fantasia',
    status: 'publicada',
    synopsis:
      'Em um jardim que floresce apenas à meia-noite, uma jovem descobre que as flores carregam memórias de quem as plantou — incluindo segredos que alguns prefeririam enterrados para sempre.',
    publishedChapters: 24,
    totalChapters: 24,
    words: '94.200',
    icon: 'book',
  },
  {
    id: 2,
    title: 'Echoes of Rain',
    category: 'Romance / Drama',
    status: 'publicada',
    synopsis:
      'Duas pessoas que se encontram repetidamente em dias de chuva começam a acreditar que o universo tem um plano para elas — ou talvez seja só coincidência.',
    publishedChapters: 18,
    totalChapters: 18,
    words: '72.800',
    icon: 'cloud',
  },
  {
    id: 3,
    title: 'The Midnight Forest',
    category: 'Terror / Mistério',
    status: 'publicada',
    synopsis:
      'Uma floresta que muda de forma toda vez que alguém entra. Ninguém sabe se o caminho de saída existe de verdade.',
    publishedChapters: 11,
    totalChapters: 11,
    words: '58.400',
    icon: 'cloud',
  },
  {
    id: 4,
    title: 'Berning Farms',
    category: 'Slice of Life',
    status: 'publicada',
    synopsis:
      'Uma família que herda uma fazenda em ruínas descobre que o solo guarda mais do que apenas sementes.',
    publishedChapters: 9,
    totalChapters: 9,
    words: '41.100',
    icon: 'book',
  },
  {
    id: 5,
    title: 'The Midnight Gardener',
    category: 'Fantasia',
    status: 'publicada',
    synopsis: 'Continuação da saga.',
    publishedChapters: 6,
    totalChapters: 6,
    words: '28.300',
    icon: 'cloud',
  },
  {
    id: 6,
    title: 'The Midnight Gardener',
    category: 'Fantasia',
    status: 'rascunho',
    synopsis: 'Rascunho da terceira parte.',
    publishedChapters: 0,
    totalChapters: 3,
    words: '9.100',
    icon: 'book',
  },
  {
    id: 7,
    title: 'Echoes of Rain',
    category: 'Romance / Drama',
    status: 'rascunho',
    synopsis: 'Spin-off em desenvolvimento.',
    publishedChapters: 0,
    totalChapters: 2,
    words: '5.700',
    icon: 'cloud',
  },
  {
    id: 8,
    title: 'The Midnight Forest',
    category: 'Terror / Mistério',
    status: 'rascunho',
    synopsis: 'Segunda temporada — rascunho.',
    publishedChapters: 0,
    totalChapters: 1,
    words: '2.200',
    icon: 'cloud',
  },
];

// Capítulos por fanfic
const CHAPTERS_BY_FANFIC = {
  1: [
    { id: 1,  title: 'Ch 01: The Awakening',      date: 'Jan 15, 2024', status: 'publicado' },
    { id: 2,  title: 'Ch 02: Roots and Shadows',   date: 'Jan 12, 2024', status: 'publicado' },
    { id: 3,  title: 'Ch 03: Midnight Bloom',      date: 'Jan 10, 2024', status: 'publicado' },
    { id: 4,  title: 'Ch 04: The First Petal',     date: 'Jan 08, 2024', status: 'publicado' },
    { id: 5,  title: 'Ch 05: Whispers in Soil',    date: 'Jan 05, 2024', status: 'publicado' },
    { id: 6,  title: 'Ch 06: The Gardener\'s Vow', date: 'Jan 03, 2024', status: 'publicado' },
    { id: 7,  title: 'Ch 07: Thorns',              date: 'Dez 28, 2023', status: 'publicado' },
    { id: 8,  title: 'Ch 08: Memory Blossoms',     date: 'Dez 20, 2023', status: 'publicado' },
    { id: 9,  title: 'Ch 09: Buried Secrets',      date: 'Dez 14, 2023', status: 'publicado' },
    { id: 10, title: 'Ch 10: The Last Frost',       date: 'Dez 07, 2023', status: 'publicado' },
    { id: 11, title: 'Ch 11: Spring\'s Return',    date: 'Nov 30, 2023', status: 'publicado' },
    { id: 12, title: 'Ch 12: New Growth',          date: 'Nov 22, 2023', status: 'publicado' },
    { id: 13, title: 'Ch 13: The Dark Season',     date: 'Nov 15, 2023', status: 'publicado' },
    { id: 14, title: 'Ch 14: Seeds of Truth',      date: 'Nov 08, 2023', status: 'publicado' },
    { id: 15, title: 'Ch 15: Harvest',             date: 'Nov 01, 2023', status: 'publicado' },
    { id: 16, title: 'Ch 16: The Withering',       date: 'Out 25, 2023', status: 'publicado' },
    { id: 17, title: 'Ch 17: Echoes Underground',  date: 'Out 18, 2023', status: 'publicado' },
    { id: 18, title: 'Ch 18: A Flower\'s Memory',  date: 'Out 11, 2023', status: 'publicado' },
    { id: 19, title: 'Ch 19: The Visitor',         date: 'Out 04, 2023', status: 'publicado' },
    { id: 20, title: 'Ch 20: Roots Run Deep',      date: 'Set 27, 2023', status: 'publicado' },
    { id: 21, title: 'Ch 21: Midnight Rain',       date: 'Set 20, 2023', status: 'publicado' },
    { id: 22, title: 'Ch 22: The Final Garden',    date: 'Set 13, 2023', status: 'publicado' },
    { id: 23, title: 'Ch 23: What Remains',        date: 'Set 06, 2023', status: 'publicado' },
    { id: 24, title: 'Ch 24: Epilogue',            date: 'Set 01, 2023', status: 'publicado' },
  ],
  2: Array.from({ length: 18 }, (_, i) => ({
    id: i + 1,
    title: `Ch ${String(i + 1).padStart(2, '0')}: Title`,
    date: `Jan ${String(15 - i).padStart(2, '0')}, 2024`,
    status: 'publicado',
  })),
  3: Array.from({ length: 11 }, (_, i) => ({
    id: i + 1,
    title: `Ch ${String(i + 1).padStart(2, '0')}: Title`,
    date: `Fev ${String(i + 1).padStart(2, '0')}, 2024`,
    status: 'publicado',
  })),
  4: Array.from({ length: 9 }, (_, i) => ({
    id: i + 1,
    title: `Ch ${String(i + 1).padStart(2, '0')}: Title`,
    date: `Mar ${String(i + 1).padStart(2, '0')}, 2024`,
    status: 'publicado',
  })),
  5: Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    title: `Ch ${String(i + 1).padStart(2, '0')}: Title`,
    date: `Abr ${String(i + 1).padStart(2, '0')}, 2024`,
    status: 'publicado',
  })),
  6: Array.from({ length: 3 }, (_, i) => ({
    id: i + 1,
    title: `Ch ${String(i + 1).padStart(2, '0')}: Title`,
    date: '—',
    status: 'rascunho',
  })),
  7: Array.from({ length: 2 }, (_, i) => ({
    id: i + 1,
    title: `Ch ${String(i + 1).padStart(2, '0')}: Title`,
    date: '—',
    status: 'rascunho',
  })),
  8: [{ id: 1, title: 'Ch 01: Title', date: '—', status: 'rascunho' }],
};

const TABS = ['Information', 'Chapters', 'Questions', 'Comments'];
const PREVIEW_COUNT = 6; // linhas visíveis antes do "View All"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StoryIcon({ type }) {
  return type === 'book'
    ? <BookOpen size={15} className="text-gray-500 shrink-0" />
    : <Cloud     size={15} className="text-gray-500 shrink-0" />;
}

// ─── Tab: Chapters ────────────────────────────────────────────────────────────

function TabChapters({ fanfic }) {
  const [expanded, setExpanded] = useState(false);
  const all      = CHAPTERS_BY_FANFIC[fanfic.id] ?? [];
  const published = all.filter((c) => c.status === 'publicado');
  const visible   = expanded ? all : all.slice(0, PREVIEW_COUNT);

  return (
    <div>
      {/* Cabeçalho da seção */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-100">
          {published.length} Published{' '}
          {published.length === 1 ? 'Chapter' : 'Chapters'}
        </p>
        <button className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 transition-colors text-white text-xs font-semibold px-3.5 py-2 rounded-md">
          <Plus size={13} />
          Add New Chapter
        </button>
      </div>

      {/* Coluna headers */}
      <div className="grid grid-cols-[1fr_140px_110px_64px] gap-x-4 px-0 pb-2 border-b border-gray-800">
        <p className="text-xs text-gray-500">
          {all[0]?.title ?? ''}
        </p>
        <p className="text-xs text-gray-500">Published Date</p>
        <p className="text-xs text-gray-500">Status</p>
        <p />
      </div>

      {/* Linhas */}
      <ul>
        {visible.map((ch) => (
          <li
            key={ch.id}
            className="grid grid-cols-[1fr_140px_110px_64px] gap-x-4 items-center py-3 border-b border-gray-800 hover:bg-white/[0.02] transition-colors group"
          >
            <p className="text-sm text-gray-200 truncate">{ch.title}</p>
            <p className="text-sm text-gray-400 font-mono">{ch.date}</p>
            <p className="text-sm text-gray-300">
              {ch.status === 'publicado' ? 'Published' : 'Draft'}
            </p>
            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                title="Mais opções"
                className="p-1 text-gray-500 hover:text-gray-300 rounded transition-colors"
              >
                <MoreVertical size={14} />
              </button>
              <button
                title="Editar"
                className="p-1 text-gray-500 hover:text-gray-300 rounded transition-colors"
              >
                <Pencil size={13} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Ver todos */}
      {all.length > PREVIEW_COUNT && (
        <button
          onClick={() => setExpanded((p) => !p)}
          className="mt-4 text-sm text-teal-500 hover:text-teal-400 transition-colors font-medium"
        >
          {expanded
            ? 'Show Less'
            : `View All Chapters (${all.length})`}
        </button>
      )}
    </div>
  );
}

// ─── Tab: Information ────────────────────────────────────────────────────────

function TabInformation({ fanfic }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-px bg-gray-800 border border-gray-800 rounded-md overflow-hidden">
        {[
          { label: 'Category',         value: fanfic.category },
          { label: 'Status',           value: fanfic.status === 'publicada' ? 'Published' : 'Draft' },
          { label: 'Total Chapters',   value: fanfic.totalChapters },
          { label: 'Word Count (est.)', value: fanfic.words },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#1E1E1E] px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1">
              {label}
            </p>
            <p className="text-gray-200 font-medium text-sm">{value}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Synopsis
          </p>
          <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-400 transition-colors">
            <Edit2 size={11} />
            Edit
          </button>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed border-l-2 border-gray-700 pl-4">
          {fanfic.synopsis}
        </p>
      </div>
    </div>
  );
}

// ─── Tab: Questions / Comments ────────────────────────────────────────────────

function TabEmpty({ icon: Icon, label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-700">
      <Icon size={36} strokeWidth={1.25} />
      <p className="text-xs uppercase tracking-widest">{label}</p>
    </div>
  );
}

// ─── Tab: Statistics ─────────────────────────────────────────────────────────

function TabStats({ fanfic }) {
  const stats = [
    { label: 'Views',    value: '14,320', icon: Eye,          delta: '+8%' },
    { label: 'Likes',    value: '832',    icon: Heart,         delta: '+12%' },
    { label: 'Comments', value: '247',    icon: MessageSquare, delta: '+3%' },
    { label: 'Chapters', value: String(fanfic.totalChapters), icon: BookOpen, delta: null },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {stats.map(({ label, value, icon: Icon, delta }) => (
          <div key={label} className="bg-[#252525] border border-gray-800 rounded-md p-5 flex items-start gap-4">
            <div className="p-2 bg-teal-700/20 rounded-md shrink-0">
              <Icon size={16} className="text-teal-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-100 leading-none">{value}</p>
              <p className="text-[11px] uppercase tracking-widest text-gray-500 mt-1.5">{label}</p>
              {delta && <p className="text-[11px] text-teal-500 font-medium mt-1">{delta} this month</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-[#252525] border border-gray-800 rounded-md p-6 h-52 flex flex-col items-center justify-center gap-3 text-gray-700">
        <BarChart2 size={32} strokeWidth={1.25} />
        <p className="text-xs uppercase tracking-widest">Analytics chart coming soon</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MinhasFanfics() {
  const [selectedStory, setSelectedStory] = useState(1);
  const [activeTab, setActiveTab]         = useState('Chapters');

  const selected  = FANFICS.find((f) => f.id === selectedStory) ?? null;
  const published = FANFICS.filter((f) => f.status === 'publicada');
  const drafts    = FANFICS.filter((f) => f.status === 'rascunho');

  return (
    <div className="flex w-full h-full bg-[#121212] text-gray-100 overflow-hidden">

      {/* ── Coluna 1 · Sidebar de histórias ───────────────────────────── */}
      <aside className="w-[320px] shrink-0 border-r border-gray-800 flex flex-col overflow-y-auto">

        {/* Título fixo do painel */}
        <div className="px-5 pt-6 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
            Your Stories
          </p>
        </div>

        {/* PUBLIC STORIES */}
        <div className="px-5 pb-2">
          <p className="text-sm font-semibold text-gray-200">
            Publicadas{' '}
            <span className="text-gray-500 font-normal">({published.length})</span>
          </p>
        </div>
        <ul className="px-3 pb-3">
          {published.map((fanfic) => {
            const isActive = fanfic.id === selectedStory;
            return (
              <li key={fanfic.id}>
                <button
                  onClick={() => setSelectedStory(fanfic.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-md flex items-center gap-2.5 transition-colors ${
                    isActive
                      ? 'bg-[#F5F0E8] text-gray-900'
                      : 'hover:bg-gray-800/50 text-gray-300'
                  }`}
                >
                  {/* Dot de seleção */}
                  <span
                    className={`shrink-0 w-2 h-2 rounded-full transition-colors ${
                      isActive ? 'bg-teal-600' : 'bg-transparent'
                    }`}
                  />

                  {/* Textos */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-snug truncate ${isActive ? 'text-gray-900' : 'text-gray-200'}`}>
                      {fanfic.title}
                    </p>
                    <p className={`text-xs mt-0.5 ${isActive ? 'text-gray-500' : 'text-gray-600'}`}>
                      Publicado
                    </p>
                  </div>

                  {/* Ícone à direita */}
                  <span className={isActive ? 'text-gray-500' : 'text-gray-700'}>
                    <StoryIcon type={fanfic.icon} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* DRAFTS */}
        <div className="px-5 pt-3 pb-2 border-t border-gray-800/70">
          <p className="text-sm font-semibold text-gray-200">
            Rascunhos{' '}
            <span className="text-gray-500 font-normal">({drafts.length})</span>
          </p>
        </div>
        <ul className="px-3 pb-6">
          {drafts.map((fanfic) => {
            const isActive = fanfic.id === selectedStory;
            return (
              <li key={fanfic.id}>
                <button
                  onClick={() => setSelectedStory(fanfic.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-md flex items-center gap-2.5 transition-colors ${
                    isActive
                      ? 'bg-[#F5F0E8] text-gray-900'
                      : 'hover:bg-gray-800/50 text-gray-300'
                  }`}
                >
                  <span
                    className={`shrink-0 w-2 h-2 rounded-full transition-colors ${
                      isActive ? 'bg-teal-600' : 'bg-transparent'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-snug truncate ${isActive ? 'text-gray-900' : 'text-gray-200'}`}>
                      {fanfic.title}
                    </p>
                    <p className={`text-xs mt-0.5 ${isActive ? 'text-gray-500' : 'text-gray-600'}`}>
                      Rascunho
                    </p>
                  </div>
                  <span className={isActive ? 'text-gray-500' : 'text-gray-700'}>
                    <StoryIcon type={fanfic.icon} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* ── Coluna 2 · Detalhe ────────────────────────────────────────── */}
      <main className="flex-1 bg-[#1E1E1E] overflow-y-auto">
        {!selected ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-700">
            <BookOpen size={44} strokeWidth={1} />
            <p className="text-sm uppercase tracking-widest">Select a story</p>
          </div>
        ) : (
          <div className="p-8 max-w-4xl">

            {/* Título grande (serif) */}
            <h1 className="font-serif text-[2.5rem] font-bold text-gray-50 leading-tight">
              {selected.title}
            </h1>

            {/* Tabs */}
            <div className="flex mt-6 border-b border-gray-800">
              {TABS.map((tab) => {
                const isActive = tab === activeTab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
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
            <div className="mt-6">
              {activeTab === 'Information' && <TabInformation fanfic={selected} />}
              {activeTab === 'Chapters'    && <TabChapters    fanfic={selected} />}
              {activeTab === 'Questions'   && <TabEmpty icon={MessageSquare} label="No questions yet" />}
              {activeTab === 'Comments'    && <TabEmpty icon={MessageSquare} label="No comments yet" />}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
