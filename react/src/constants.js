export const CATEGORIES = [
  'Romance',
  'Aventura',
  'Drama',
  'Comédia',
  'Ficção Científica',
  'Fantasia',
  'Terror',
  'Mistério',
];

export const CATEGORY_ICONS = {
  'Romance': '💕',
  'Aventura': '⚔️',
  'Drama': '🎭',
  'Comédia': '😄',
  'Ficção Científica': '🚀',
  'Fantasia': '🔮',
  'Terror': '👻',
  'Mistério': '🔍',
};

export const TAG_TYPES = ['fandom', 'warning', 'pairing', 'subgenre'];

export const MAX_TAGS_PER_TYPE = 5;

// Sugestões de tags por tipo (exibidas após 3 caracteres digitados)
export const TAG_SUGGESTIONS = {
  fandom: [
    'Harry Potter', 'Percy Jackson', 'Senhor dos Anéis', 'O Hobbit',
    'Game of Thrones', 'Naruto', 'Attack on Titan', 'One Piece', 'Demon Slayer',
    'Fullmetal Alchemist', 'Death Note', 'Dragon Ball', 'Bleach', 'Fairy Tail',
    'Digimon', 'Pokémon', 'Sword Art Online', 'My Hero Academia', 'Hunter x Hunter',
    'Gossip Girl', 'Vampire Diaries', 'Twilight', 'Teen Wolf', 'Shadowhunters',
    'The Witcher', 'Stranger Things', 'Dark', 'Breaking Bad', 'The Last of Us',
    'Marvel', 'DC Comics', 'Star Wars', 'Star Trek', 'Avatar: The Last Airbender',
    'Hunger Games', 'Divergente', 'Maze Runner', 'Jogos Vorazes',
    'BTS', 'BLACKPINK', 'EXO', 'Stray Kids', 'NCT', 'ATEEZ', 'TWICE', 'ENHYPEN',
    'One Direction', 'Banda Real', 'RPF',
  ],
  warning: [
    'Violência', 'Violência explícita', 'Linguagem forte', 'Conteúdo sexual',
    'Conteúdo sexual explícito', 'Uso de substâncias', 'Abuso', 'Abuso emocional',
    'Morte de personagem', 'Morte de personagem principal', 'Tortura',
    'Suicídio', 'Auto-lesão', 'Transtornos alimentares', 'Racismo', 'Homofobia',
    'Transfobia', 'Violência sexual', 'Violência doméstica', 'Trauma',
    'Gore', 'Horror', 'Manipulação psicológica', 'Menores em situações inadequadas',
    'Dark fic', 'Non-con', 'Dub-con', 'Angst', 'Alternate Universe',
  ],
  pairing: [
    'M/F', 'M/M', 'F/F', 'M/M/F', 'F/F/M', 'Multiple',
    'Gen (sem romance)', 'Het', 'Slash', 'Femslash', 'Poly',
    'Amor não correspondido', 'Slow burn', 'Friends to lovers',
    'Enemies to lovers', 'Forced proximity', 'Soulmates',
  ],
  subgenre: [
    'Romance', 'Fantasia', 'Ficção Científica', 'Horror', 'Mistério',
    'Drama', 'Comédia', 'Ação', 'Aventura', 'Suspense', 'Thriller',
    'Sobrenatural', 'Distopia', 'Histórico', 'Slice of Life',
    'Dark', 'Fluff', 'Angst', 'Hurt/Comfort', 'Crack Fic',
    'Realismo Mágico', 'Faroeste', 'Cyberpunk', 'Steampunk', 'Policial',
  ],
  triggerWarning: [
    'Abuso', 'Abuso infantil', 'Abuso emocional', 'Abuso físico', 'Abuso sexual',
    'Automutilação', 'Suicídio', 'Ideação suicida', 'Transtornos alimentares',
    'Anorexia', 'Bulimia', 'Dependência química', 'Alcoolismo',
    'Violência doméstica', 'Violência sexual', 'Estupro', 'Assédio',
    'Racismo', 'Homofobia', 'Transfobia', 'Discriminação',
    'Morte', 'Morte de criança', 'Doença grave', 'Câncer',
    'Trauma', 'PTSD', 'Ansiedade', 'Depressão', 'Psicose',
    'Gore', 'Tortura', 'Sequestro', 'Tráfico humano',
    'Gravidez', 'Aborto', 'Perda gestacional',
  ],
};
