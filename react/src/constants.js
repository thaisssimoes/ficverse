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


export const TAG_TYPES = ['fandom', 'pairing', 'subgenre', 'trope'];

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
  pairing: [
    'M/F', 'M/M', 'F/F', 'M/M/F', 'F/F/M', 'Multiple',
    'Gen (sem romance)', 'Het', 'Slash', 'Femslash', 'Poly',
  ],
  trope: [
    // Dinâmicas de Relacionamento
    'Enemies to Lovers',
    'Friends to Lovers',
    'Slow Burn',
    'Fake Dating',
    'Grumpy x Sunshine',
    'Soulmates',
    'Mutual Pining',
    'Love Triangle',
    'Forbidden Love',
    'Enemies with Benefits',
    'Right Person, Wrong Time',
    // Situações de Enredo
    'Only One Bed',
    'Marriage of Convenience',
    'Found Family',
    'Roommates',
    'Workplace Romance',
    'Amnesia',
    'Time Travel',
    'Secret Identity',
    // Tom / Estilo
    'Fluff',
    'Angst',
    'Hurt/Comfort',
    'Smut / Lemon',
    'Crack Fic',
    'Dark Fic',
  ],
  subgenre: [
    'Romance', 'Fantasia', 'Ficção Científica', 'Horror', 'Mistério',
    'Drama', 'Comédia', 'Ação', 'Aventura', 'Suspense', 'Thriller',
    'Sobrenatural', 'Distopia', 'Histórico', 'Slice of Life',
    'Dark', 'Fluff', 'Angst', 'Hurt/Comfort', 'Crack Fic',
    'Realismo Mágico', 'Faroeste', 'Cyberpunk', 'Steampunk', 'Policial', 'Dark Romance',
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

// Ships sugeridos por fandom — usados para enriquecer as sugestões de Casais
// quando o autor já selecionou um fandom específico.
export const FANDOM_PAIRING_SUGGESTIONS = {
  'Harry Potter':           ['Harry x Hermione', 'Harry x Ginny', 'Draco x Hermione', 'Ron x Hermione', 'Draco x Harry', 'Sirius x Remus', 'Snape x Hermione', 'Tom Riddle x Hermione'],
  'Naruto':                 ['Naruto x Hinata', 'Sasuke x Sakura', 'Naruto x Sasuke', 'Kakashi x Iruka', 'Minato x Kushina', 'Shikamaru x Temari', 'Neji x Tenten'],
  'One Piece':              ['Zoro x Sanji', 'Luffy x Nami', 'Robin x Zoro', 'Law x Luffy', 'Shanks x Mihawk', 'Ace x Marco'],
  'Attack on Titan':        ['Eren x Mikasa', 'Levi x Petra', 'Armin x Annie', 'Erwin x Levi', 'Historia x Ymir', 'Jean x Marco'],
  'My Hero Academia':       ['Midoriya x Uraraka', 'Bakugo x Kirishima', 'Todoroki x Midoriya', 'Endeavor x Hawks', 'Midoriya x Todoroki'],
  'Demon Slayer':           ['Tanjiro x Kanao', 'Zenitsu x Nezuko', 'Rengoku x Akaza', 'Inosuke x Aoi'],
  'Fullmetal Alchemist':    ['Edward x Winry', 'Roy x Riza', 'Edward x Roy', 'Greed x Ling'],
  'Death Note':             ['Light x L', 'Light x Misa', 'L x Misa'],
  'Vampire Diaries':        ['Elena x Damon', 'Elena x Stefan', 'Caroline x Klaus', 'Bonnie x Damon', 'Caroline x Stefan'],
  'Twilight':               ['Bella x Edward', 'Bella x Jacob', 'Edward x Jacob', 'Alice x Jasper'],
  'Stranger Things':        ['Eleven x Mike', 'Steve x Robin', 'Max x Lucas', 'Steve x Eddie', 'Will x Mike'],
  'Marvel':                 ['Tony x Steve', 'Peter x Wade', 'Wanda x Vision', 'Natasha x Clint', 'Bucky x Steve', 'Thor x Loki'],
  'BTS':                    ['Jungkook x Jimin', 'Taehyung x Jungkook', 'Yoongi x Hoseok', 'Namjoon x Seokjin', 'Jimin x Taehyung', 'Yoongi x Jimin'],
  'BLACKPINK':              ['Jennie x Lisa', 'Rosé x Jisoo', 'Jennie x Rosé'],
  'Stray Kids':             ['Bang Chan x Lee Know', 'Felix x Hyunjin', 'Changbin x Han'],
  'Teen Wolf':              ['Stiles x Derek', 'Scott x Allison', 'Stiles x Lydia', 'Derek x Peter'],
  'Game of Thrones':        ['Jon x Daenerys', 'Robb x Talisa', 'Cersei x Jaime', 'Arya x Gendry', 'Brienne x Jaime'],
  'The Witcher':            ['Geralt x Yennefer', 'Geralt x Jaskier', 'Ciri x Yennefer'],
  'Avatar: The Last Airbender': ['Aang x Katara', 'Zuko x Katara', 'Sokka x Suki', 'Zuko x Mai', 'Toph x Sokka'],
  'Hunger Games':           ['Katniss x Peeta', 'Katniss x Gale', 'Finnick x Annie'],
};
