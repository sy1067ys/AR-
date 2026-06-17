export interface TryOnItem {
  id: string;
  name: string;
  type: 'glasses' | 'necklace' | 'earrings' | 'hat';
  image: string;
  category: string;
}

export interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  image: string;
  defaultWidth: number;
  defaultHeight: number;
}

// SVG-based furniture items
const makeSVG = (content: string, w = 200, h = 150) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`)}`;

export const furnitureItems: FurnitureItem[] = [
  {
    id: 'sofa-1',
    name: '3人掛けソファ',
    category: 'ソファ',
    defaultWidth: 220,
    defaultHeight: 100,
    image: makeSVG(`
      <rect x="10" y="50" width="180" height="70" rx="10" fill="#8B7355" stroke="#6B5335" stroke-width="2"/>
      <rect x="10" y="30" width="180" height="30" rx="8" fill="#A08060" stroke="#6B5335" stroke-width="2"/>
      <rect x="5" y="40" width="20" height="80" rx="8" fill="#9B7850" stroke="#6B5335" stroke-width="2"/>
      <rect x="175" y="40" width="20" height="80" rx="8" fill="#9B7850" stroke="#6B5335" stroke-width="2"/>
      <rect x="10" y="110" width="40" height="15" rx="4" fill="#5a3e28"/>
      <rect x="150" y="110" width="40" height="15" rx="4" fill="#5a3e28"/>
      <line x1="70" y1="50" x2="70" y2="120" stroke="#6B5335" stroke-width="1.5" opacity="0.5"/>
      <line x1="130" y1="50" x2="130" y2="120" stroke="#6B5335" stroke-width="1.5" opacity="0.5"/>
    `, 200, 135),
  },
  {
    id: 'sofa-2',
    name: 'L字ソファ',
    category: 'ソファ',
    defaultWidth: 260,
    defaultHeight: 160,
    image: makeSVG(`
      <rect x="10" y="10" width="130" height="100" rx="10" fill="#607D8B" stroke="#455A64" stroke-width="2"/>
      <rect x="10" y="10" width="130" height="30" rx="8" fill="#78909C" stroke="#455A64" stroke-width="2"/>
      <rect x="100" y="80" width="90" height="70" rx="10" fill="#607D8B" stroke="#455A64" stroke-width="2"/>
      <rect x="100" y="80" width="90" height="25" rx="8" fill="#78909C" stroke="#455A64" stroke-width="2"/>
      <rect x="5" y="20" width="15" height="90" rx="6" fill="#546E7A" stroke="#455A64" stroke-width="2"/>
      <rect x="125" y="20" width="15" height="90" rx="6" fill="#546E7A" stroke="#455A64" stroke-width="2"/>
    `, 200, 155),
  },
  {
    id: 'chair-1',
    name: 'ダイニングチェア',
    category: 'チェア',
    defaultWidth: 80,
    defaultHeight: 120,
    image: makeSVG(`
      <rect x="30" y="60" width="80" height="50" rx="5" fill="#D4A853" stroke="#B8882C" stroke-width="2"/>
      <rect x="40" y="10" width="60" height="55" rx="5" fill="#E8BC6A" stroke="#B8882C" stroke-width="2"/>
      <line x1="35" y1="110" x2="30" y2="140" stroke="#8B6914" stroke-width="5" stroke-linecap="round"/>
      <line x1="105" y1="110" x2="110" y2="140" stroke="#8B6914" stroke-width="5" stroke-linecap="round"/>
      <line x1="40" y1="110" x2="38" y2="140" stroke="#8B6914" stroke-width="5" stroke-linecap="round"/>
      <line x1="100" y1="110" x2="102" y2="140" stroke="#8B6914" stroke-width="5" stroke-linecap="round"/>
    `, 140, 145),
  },
  {
    id: 'chair-2',
    name: 'アームチェア',
    category: 'チェア',
    defaultWidth: 120,
    defaultHeight: 120,
    image: makeSVG(`
      <rect x="25" y="55" width="110" height="65" rx="12" fill="#8B4513" stroke="#6B3410" stroke-width="2"/>
      <rect x="20" y="30" width="120" height="35" rx="10" fill="#A0522D" stroke="#6B3410" stroke-width="2"/>
      <rect x="10" y="40" width="25" height="70" rx="10" fill="#8B4513" stroke="#6B3410" stroke-width="2"/>
      <rect x="125" y="40" width="25" height="70" rx="10" fill="#8B4513" stroke="#6B3410" stroke-width="2"/>
      <rect x="25" y="115" width="25" height="20" rx="4" fill="#5C2E00"/>
      <rect x="110" y="115" width="25" height="20" rx="4" fill="#5C2E00"/>
    `, 160, 140),
  },
  {
    id: 'table-1',
    name: 'ダイニングテーブル',
    category: 'テーブル',
    defaultWidth: 200,
    defaultHeight: 100,
    image: makeSVG(`
      <rect x="10" y="40" width="180" height="20" rx="5" fill="#DEB887" stroke="#B8860B" stroke-width="2"/>
      <rect x="15" y="60" width="12" height="60" rx="4" fill="#C8A870" stroke="#B8860B" stroke-width="2"/>
      <rect x="173" y="60" width="12" height="60" rx="4" fill="#C8A870" stroke="#B8860B" stroke-width="2"/>
      <rect x="28" y="60" width="12" height="60" rx="4" fill="#C8A870" stroke="#B8860B" stroke-width="2"/>
      <rect x="160" y="60" width="12" height="60" rx="4" fill="#C8A870" stroke="#B8860B" stroke-width="2"/>
    `, 200, 125),
  },
  {
    id: 'table-2',
    name: 'コーヒーテーブル',
    category: 'テーブル',
    defaultWidth: 160,
    defaultHeight: 80,
    image: makeSVG(`
      <ellipse cx="100" cy="50" rx="90" ry="30" fill="#F5DEB3" stroke="#D2B48C" stroke-width="2"/>
      <ellipse cx="100" cy="50" rx="85" ry="25" fill="none" stroke="#C19A6B" stroke-width="1" opacity="0.5"/>
      <rect x="88" y="75" width="8" height="30" rx="3" fill="#D2B48C" stroke="#A0826D" stroke-width="1.5"/>
      <rect x="104" y="75" width="8" height="30" rx="3" fill="#D2B48C" stroke="#A0826D" stroke-width="1.5"/>
      <ellipse cx="100" cy="105" rx="25" ry="6" fill="#C4A882" stroke="#A0826D" stroke-width="1.5"/>
    `, 200, 115),
  },
  {
    id: 'lamp-1',
    name: 'フロアランプ',
    category: '照明',
    defaultWidth: 60,
    defaultHeight: 180,
    image: makeSVG(`
      <ellipse cx="70" cy="170" rx="35" ry="8" fill="#888" stroke="#666" stroke-width="1.5"/>
      <rect x="67" y="80" width="6" height="90" rx="3" fill="#AAA" stroke="#888" stroke-width="1"/>
      <path d="M35 80 Q70 20 105 80 Z" fill="#FFE08A" stroke="#E6C84A" stroke-width="2" opacity="0.9"/>
      <ellipse cx="70" cy="80" rx="35" ry="8" fill="#E6C84A" stroke="#C8A820" stroke-width="1.5"/>
      <circle cx="70" cy="82" r="5" fill="#FFF8E1"/>
    `, 140, 180),
  },
  {
    id: 'lamp-2',
    name: 'テーブルランプ',
    category: '照明',
    defaultWidth: 70,
    defaultHeight: 110,
    image: makeSVG(`
      <ellipse cx="70" cy="130" rx="40" ry="10" fill="#999" stroke="#777" stroke-width="1.5"/>
      <rect x="66" y="75" width="8" height="55" rx="4" fill="#BBB" stroke="#999" stroke-width="1"/>
      <path d="M40 75 Q70 10 100 75 Z" fill="#FFF3CD" stroke="#D4A017" stroke-width="2" opacity="0.85"/>
      <ellipse cx="70" cy="75" rx="30" ry="7" fill="#D4A017" stroke="#B8860B" stroke-width="1.5"/>
    `, 140, 140),
  },
  {
    id: 'plant-1',
    name: '観葉植物（大）',
    category: '植物',
    defaultWidth: 90,
    defaultHeight: 150,
    image: makeSVG(`
      <rect x="55" y="110" width="50" height="40" rx="5" fill="#8B6914" stroke="#6B4F00" stroke-width="2"/>
      <ellipse cx="80" cy="115" rx="42" ry="8" fill="#7A5C00" stroke="#6B4F00" stroke-width="1.5"/>
      <ellipse cx="80" cy="70" rx="55" ry="55" fill="#2E7D32" opacity="0.7"/>
      <ellipse cx="50" cy="55" rx="35" ry="38" fill="#388E3C" opacity="0.8"/>
      <ellipse cx="110" cy="55" rx="35" ry="38" fill="#388E3C" opacity="0.8"/>
      <ellipse cx="80" cy="35" rx="30" ry="35" fill="#43A047" opacity="0.9"/>
      <ellipse cx="80" cy="45" rx="20" ry="25" fill="#66BB6A"/>
    `, 160, 155),
  },
  {
    id: 'plant-2',
    name: 'サボテン',
    category: '植物',
    defaultWidth: 60,
    defaultHeight: 100,
    image: makeSVG(`
      <rect x="40" y="100" width="60" height="35" rx="5" fill="#A0826D" stroke="#8B6914" stroke-width="2"/>
      <rect x="55" y="40" width="30" height="70" rx="15" fill="#558B2F" stroke="#33691E" stroke-width="2"/>
      <rect x="25" y="60" width="35" height="20" rx="10" fill="#558B2F" stroke="#33691E" stroke-width="2"/>
      <rect x="80" y="55" width="35" height="20" rx="10" fill="#558B2F" stroke="#33691E" stroke-width="2"/>
      <line x1="70" y1="30" x2="70" y2="10" stroke="#33691E" stroke-width="2"/>
      <circle cx="70" cy="8" r="6" fill="#E91E63"/>
    `, 140, 140),
  },
  {
    id: 'bookshelf-1',
    name: '本棚',
    category: '収納',
    defaultWidth: 120,
    defaultHeight: 180,
    image: makeSVG(`
      <rect x="10" y="10" width="120" height="165" rx="3" fill="#D2B48C" stroke="#A0826D" stroke-width="2"/>
      <rect x="10" y="50" width="120" height="5" fill="#A0826D"/>
      <rect x="10" y="95" width="120" height="5" fill="#A0826D"/>
      <rect x="10" y="140" width="120" height="5" fill="#A0826D"/>
      <rect x="18" y="15" width="10" height="35" rx="1" fill="#E74C3C"/>
      <rect x="30" y="15" width="8" height="35" rx="1" fill="#3498DB"/>
      <rect x="40" y="15" width="12" height="35" rx="1" fill="#2ECC71"/>
      <rect x="54" y="15" width="9" height="35" rx="1" fill="#F39C12"/>
      <rect x="65" y="15" width="11" height="35" rx="1" fill="#9B59B6"/>
      <rect x="78" y="15" width="8" height="35" rx="1" fill="#1ABC9C"/>
      <rect x="88" y="15" width="10" height="35" rx="1" fill="#E74C3C"/>
      <rect x="100" y="15" width="8" height="35" rx="1" fill="#E67E22"/>
      <rect x="18" y="58" width="12" height="37" rx="1" fill="#2980B9"/>
      <rect x="32" y="58" width="9" height="37" rx="1" fill="#27AE60"/>
      <rect x="43" y="58" width="11" height="37" rx="1" fill="#8E44AD"/>
      <rect x="56" y="58" width="8" height="37" rx="1" fill="#E74C3C"/>
      <rect x="66" y="58" width="13" height="37" rx="1" fill="#F1C40F"/>
      <rect x="81" y="58" width="9" height="37" rx="1" fill="#16A085"/>
      <rect x="92" y="58" width="10" height="37" rx="1" fill="#D35400"/>
      <rect x="18" y="103" width="10" height="37" rx="1" fill="#7F8C8D"/>
      <rect x="30" y="103" width="12" height="37" rx="1" fill="#2C3E50"/>
      <rect x="44" y="103" width="9" height="37" rx="1" fill="#C0392B"/>
      <rect x="55" y="103" width="11" height="37" rx="1" fill="#27AE60"/>
      <rect x="68" y="103" width="8" height="37" rx="1" fill="#8E44AD"/>
      <rect x="78" y="103" width="13" height="37" rx="1" fill="#D4AC0D"/>
      <rect x="93" y="103" width="9" height="37" rx="1" fill="#1F618D"/>
      <rect x="18" y="148" width="95" height="20" rx="2" fill="#BDC3C7" stroke="#95A5A6" stroke-width="1"/>
    `, 140, 180),
  },
  {
    id: 'tv-1',
    name: 'テレビ',
    category: '家電',
    defaultWidth: 200,
    defaultHeight: 130,
    image: makeSVG(`
      <rect x="5" y="10" width="190" height="110" rx="8" fill="#1a1a1a" stroke="#333" stroke-width="2"/>
      <rect x="15" y="18" width="170" height="90" rx="4" fill="#0a0a0a"/>
      <rect x="18" y="21" width="164" height="84" rx="3" fill="#1565C0" opacity="0.3"/>
      <rect x="18" y="21" width="164" height="84" rx="3" fill="none" stroke="#1565C0" stroke-width="1" opacity="0.5"/>
      <circle cx="185" cy="30" r="4" fill="#F44336" opacity="0.8"/>
      <rect x="80" y="118" width="40" height="15" rx="2" fill="#222" stroke="#333" stroke-width="1"/>
      <rect x="60" y="130" width="80" height="6" rx="3" fill="#333" stroke="#222" stroke-width="1"/>
    `, 200, 140),
  },
  {
    id: 'tv-stand-1',
    name: 'テレビ台',
    category: '収納',
    defaultWidth: 200,
    defaultHeight: 80,
    image: makeSVG(`
      <rect x="5" y="20" width="190" height="80" rx="5" fill="#5D4037" stroke="#3E2723" stroke-width="2"/>
      <rect x="5" y="20" width="190" height="12" rx="5" fill="#795548" stroke="#3E2723" stroke-width="1"/>
      <rect x="5" y="65" width="90" height="35" rx="3" fill="#6D4C41" stroke="#3E2723" stroke-width="1"/>
      <rect x="105" y="65" width="90" height="35" rx="3" fill="#6D4C41" stroke="#3E2723" stroke-width="1"/>
      <circle cx="52" cy="82" r="4" fill="#8D6E63"/>
      <circle cx="148" cy="82" r="4" fill="#8D6E63"/>
      <rect x="5" y="98" width="25" height="5" rx="2" fill="#3E2723"/>
      <rect x="170" y="98" width="25" height="5" rx="2" fill="#3E2723"/>
    `, 200, 105),
  },
  {
    id: 'bed-1',
    name: 'ベッド（シングル）',
    category: 'ベッド',
    defaultWidth: 160,
    defaultHeight: 220,
    image: makeSVG(`
      <rect x="10" y="30" width="130" height="180" rx="5" fill="#FFF9C4" stroke="#F9A825" stroke-width="1.5"/>
      <rect x="10" y="30" width="130" height="50" rx="8" fill="#FFCA28" stroke="#F9A825" stroke-width="2"/>
      <rect x="5" y="10" width="140" height="25" rx="5" fill="#8D6E63" stroke="#6D4C41" stroke-width="2"/>
      <rect x="5" y="205" width="140" height="10" rx="3" fill="#8D6E63" stroke="#6D4C41" stroke-width="1.5"/>
      <rect x="5" y="5" width="10" height="30" rx="3" fill="#795548"/>
      <rect x="135" y="5" width="10" height="30" rx="3" fill="#795548"/>
      <rect x="5" y="205" width="10" height="20" rx="3" fill="#795548"/>
      <rect x="135" y="205" width="10" height="20" rx="3" fill="#795548"/>
      <rect x="25" y="85" width="55" height="120" rx="10" fill="#E3F2FD" stroke="#BBDEFB" stroke-width="1"/>
      <rect x="90" y="85" width="45" height="120" rx="10" fill="#FAFAFA" stroke="#E0E0E0" stroke-width="1"/>
    `, 150, 230),
  },
  {
    id: 'rug-1',
    name: 'ラグ（丸型）',
    category: 'ラグ',
    defaultWidth: 200,
    defaultHeight: 200,
    image: makeSVG(`
      <ellipse cx="100" cy="100" rx="95" ry="95" fill="#B71C1C" opacity="0.85"/>
      <ellipse cx="100" cy="100" rx="80" ry="80" fill="none" stroke="#FFCDD2" stroke-width="6" opacity="0.6"/>
      <ellipse cx="100" cy="100" rx="65" ry="65" fill="none" stroke="#EF9A9A" stroke-width="4" opacity="0.5"/>
      <ellipse cx="100" cy="100" rx="50" ry="50" fill="none" stroke="#FFCDD2" stroke-width="3" opacity="0.6"/>
      <ellipse cx="100" cy="100" rx="30" ry="30" fill="#C62828" stroke="#FFCDD2" stroke-width="2" opacity="0.7"/>
    `, 200, 200),
  },
  {
    id: 'rug-2',
    name: 'ラグ（長方形）',
    category: 'ラグ',
    defaultWidth: 240,
    defaultHeight: 150,
    image: makeSVG(`
      <rect x="5" y="5" width="230" height="140" rx="8" fill="#1565C0" opacity="0.8"/>
      <rect x="15" y="15" width="210" height="120" rx="5" fill="none" stroke="#BBDEFB" stroke-width="4" opacity="0.6"/>
      <rect x="30" y="30" width="180" height="90" rx="3" fill="none" stroke="#90CAF9" stroke-width="2" opacity="0.5"/>
      <line x1="5" y1="75" x2="235" y2="75" stroke="#BBDEFB" stroke-width="2" opacity="0.3"/>
      <line x1="120" y1="5" x2="120" y2="145" stroke="#BBDEFB" stroke-width="2" opacity="0.3"/>
    `, 240, 150),
  },
];

export const tryOnItems: TryOnItem[] = [
  {
    id: 'glasses-1',
    name: 'クラシック眼鏡',
    type: 'glasses',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjAwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB4PSIxMCIgeT0iMjAiIHdpZHRoPSI3MCIgaGVpZ2h0PSI0MCIgcng9IjIwIiBzdHJva2U9IiMyMzFmMjAiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0icmdiYSgwLDAsMCwwLjEpIi8+CjxyZWN0IHg9IjEyMCIgeT0iMjAiIHdpZHRoPSI3MCIgaGVpZ2h0PSI0MCIgcng9IjIwIiBzdHJva2U9IiMyMzFmMjAiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0icmdiYSgwLDAsMCwwLjEpIi8+CjxsaW5lIHgxPSI4MCIgeTE9IjQwIiB4Mj0iMTIwIiB5Mj0iNDAiIHN0cm9rZT0iIzIzMWYyMCIgc3Ryb2tlLXdpZHRoPSIzIi8+Cjwvc3ZnPg==',
    category: '眼鏡',
  },
  {
    id: 'glasses-2',
    name: 'サングラス',
    type: 'glasses',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjAwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB4PSIxMCIgeT0iMjAiIHdpZHRoPSI3MCIgaGVpZ2h0PSI0MCIgcng9IjE1IiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0icmdiYSgwLDAsMCwwLjcpIi8+CjxyZWN0IHg9IjEyMCIgeT0iMjAiIHdpZHRoPSI3MCIgaGVpZ2h0PSI0MCIgcng9IjE1IiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0icmdiYSgwLDAsMCwwLjcpIi8+CjxsaW5lIHgxPSI4MCIgeTE9IjQwIiB4Mj0iMTIwIiB5Mj0iNDAiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSI0Ii8+Cjwvc3ZnPg==',
    category: '眼鏡',
  },
  {
    id: 'glasses-3',
    name: 'ラウンド眼鏡',
    type: 'glasses',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjAwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8Y2lyY2xlIGN4PSI0NSIgY3k9IjQwIiByPSIyNSIgc3Ryb2tlPSIjNDQ0IiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9InJnYmEoMTUwLDE1MCwyNTAsMC4xKSIvPgo8Y2lyY2xlIGN4PSIxNTUiIGN5PSI0MCIgcj0iMjUiIHN0cm9rZT0iIzQ0NCIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJyZ2JhKDE1MCwxNTAsMjUwLDAuMSkiLz4KPGxpbmUgeDE9IjcwIiB5MT0iNDAiIHgyPSIxMzAiIHkyPSI0MCIgc3Ryb2tlPSIjNDQ0IiBzdHJva2Utd2lkdGg9IjMiLz4KPC9zdmc+',
    category: '眼鏡',
  },
  {
    id: 'necklace-1',
    name: 'パールネックレス',
    type: 'necklace',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDIwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI4IiBmaWxsPSIjZmZmIiBzdHJva2U9IiNkZGQiIHN0cm9rZS13aWR0aD0iMSIvPgo8Y2lyY2xlIGN4PSI4MCIgY3k9IjcwIiByPSI2IiBmaWxsPSIjZmZmIiBzdHJva2U9IiNkZGQiIHN0cm9rZS13aWR0aD0iMSIvPgo8Y2lyY2xlIGN4PSIxMjAiIGN5PSI3MCIgcj0iNiIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjZGRkIiBzdHJva2Utd2lkdGg9IjEiLz4KPGNpcmNsZSBjeD0iNjAiIGN5PSI1MCIgcj0iNSIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjZGRkIiBzdHJva2Utd2lkdGg9IjEiLz4KPGNpcmNsZSBjeD0iMTQwIiBjeT0iNTAiIHI9IjUiIGZpbGw9IiNmZmYiIHN0cm9rZT0iI2RkZCIgc3Ryb2tlLXdpZHRoPSIxIi8+CjxjaXJjbGUgY3g9IjQwIiBjeT0iMzAiIHI9IjQiIGZpbGw9IiNmZmYiIHN0cm9rZT0iI2RkZCIgc3Ryb2tlLXdpZHRoPSIxIi8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjMwIiByPSI0IiBmaWxsPSIjZmZmIiBzdHJva2U9IiNkZGQiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=',
    category: 'ネックレス',
  },
  {
    id: 'necklace-2',
    name: 'ゴールドチェーン',
    type: 'necklace',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDIwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0yMCAyMCBRIDEwMCA5MCAxODAgMjAiIHN0cm9rZT0iI0ZGRDcwMCIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJub25lIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9Ijc1IiByPSIxMCIgZmlsbD0iI0ZGRDcwMCIgc3Ryb2tlPSIjRkZBNTAwIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+',
    category: 'ネックレス',
  },
  {
    id: 'earrings-1',
    name: 'ドロップピアス',
    type: 'earrings',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSI1IiByPSIzIiBmaWxsPSIjRkZENzAwIi8+CjxlbGxpcHNlIGN4PSIyMCIgY3k9IjI1IiByeD0iOCIgcnk9IjEyIiBmaWxsPSIjRkZENzAwIiBvcGFjaXR5PSIwLjgiLz4KPC9zdmc+',
    category: 'ピアス',
  },
  {
    id: 'earrings-2',
    name: 'フープピアス',
    type: 'earrings',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTIiIHN0cm9rZT0iI0MwQzBDMCIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+Cjwvc3ZnPg==',
    category: 'ピアス',
  },
  {
    id: 'hat-1',
    name: 'ベレー帽',
    type: 'hat',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDIwMCAxNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxlbGxpcHNlIGN4PSIxMDAiIGN5PSI4MCIgcng9IjgwIiByeT0iNjAiIGZpbGw9IiMzMzMiLz4KPGVsbGlwc2UgY3g9IjEwMCIgY3k9IjEzMCIgcng9IjkwIiByeT0iMTUiIGZpbGw9IiMyMjIiLz4KPC9zdmc+',
    category: '帽子',
  },
  {
    id: 'hat-2',
    name: 'キャップ',
    type: 'hat',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDIwMCAxNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHg9IjMwIiB5PSI4MCIgd2lkdGg9IjE0MCIgaGVpZ2h0PSI1MCIgcng9IjI1IiBmaWxsPSIjMDA1NWZmIi8+CjxlbGxpcHNlIGN4PSIzMCIgY3k9IjEwNSIgcng9IjQwIiByeT0iMTAiIGZpbGw9IiMwMDMzYWEiLz4KPC9zdmc+',
    category: '帽子',
  },
];
