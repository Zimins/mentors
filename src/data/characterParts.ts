import { AvatarPartsConfig } from '@/types/mentor';

export interface CharacterPartOption {
  id: string;
  label: string;
  labelKo: string;
  icon: string;
}

export const HAIR_STYLE_PARTS: CharacterPartOption[] = [
  { id: 'short_part', label: 'Classic Side Part', labelKo: '클래식 가르마', icon: '💈' },
  { id: 'curtain', label: 'Curtain Bangs', labelKo: '커튼 뱅', icon: '✨' },
  { id: 'wavy', label: 'Long Wavy', labelKo: '롱 웨이브', icon: '🌊' },
  { id: 'bun', label: 'High Scholar Bun', labelKo: '하이번 (올림머리)', icon: '🍡' },
  { id: 'twin_tails', label: 'Twin Tails', labelKo: '트윈테일', icon: '🎀' },
  { id: 'braid', label: 'Side Braid', labelKo: '사이드 브레이드', icon: '🪢' },
  { id: 'bob', label: 'Sleek Bob Cut', labelKo: '단발 보브컷', icon: '💇‍♀️' },
  { id: 'afro', label: 'Volume Afro', labelKo: '볼륨 아프로', icon: '☁️' },
  { id: 'ponytail', label: 'Active Ponytail', labelKo: '포니테일', icon: '🐎' },
  { id: 'spiky', label: 'Spiky Fringe', labelKo: '스파이키 컷', icon: '⚡' },
];

export const HEADWEAR_PARTS: CharacterPartOption[] = [
  { id: 'none', label: 'No Hat', labelKo: '모자 없음', icon: '🙂' },
  { id: 'mortarboard', label: 'Professor Cap', labelKo: '교수 학사모', icon: '🎓' },
  { id: 'beret', label: 'Artist Beret', labelKo: '아티스트 베레모', icon: '🎨' },
  { id: 'beanie', label: 'Coder Beanie', labelKo: '해커 비니', icon: '🧶' },
  { id: 'bucket_hat', label: 'Bucket Hat', labelKo: '트렌디 버킷햇', icon: '👒' },
  { id: 'cap', label: 'Baseball Cap', labelKo: '스트릿 캡모자', icon: '🧢' },
  { id: 'headband', label: 'Sport Headband', labelKo: '헤어밴드', icon: '🎗️' },
];

export const OUTFIT_PARTS: CharacterPartOption[] = [
  { id: 'tie', label: 'Professor Tie', labelKo: '교수 넥타이 & 셔츠', icon: '👔' },
  { id: 'bowtie', label: 'Scholar Bowtie', labelKo: '보타이 & 셔츠', icon: '🎀' },
  { id: 'blazer', label: 'Tailored Blazer', labelKo: '테일러드 자켓', icon: '🧥' },
  { id: 'scarf', label: 'Cozy Scarf', labelKo: '따뜻한 머플러', icon: '🧣' },
  { id: 'hoodie', label: 'Tech Hoodie', labelKo: '테크 후드티', icon: '🎽' },
  { id: 'straps', label: 'Workshop Straps', labelKo: '크리에이터 멜빵', icon: '🛠️' },
  { id: 'collar', label: 'Clean Collar', labelKo: '깔끔한 카라 셔츠', icon: '👕' },
];

export const EYEWEAR_PARTS: CharacterPartOption[] = [
  { id: 'glasses', label: 'Smart Glasses', labelKo: '안경 착용', icon: '👓' },
  { id: 'none', label: 'Clear Eyes', labelKo: '안경 없음', icon: '👀' },
];

export const CHARM_PARTS: CharacterPartOption[] = [
  { id: 'none', label: 'Clean Look', labelKo: '기본 표정', icon: '✨' },
  { id: 'earrings', label: 'Drop Earrings', labelKo: '드롭 이어링', icon: '💎' },
  { id: 'dimples', label: 'Warm Dimples', labelKo: '미소 보조개', icon: '😊' },
  { id: 'blush', label: 'Soft Blush', labelKo: '발그레 홍조', icon: '🌸' },
  { id: 'mole', label: 'Beauty Mark', labelKo: '매력점', icon: '💫' },
];

export interface CombinatorialRigEntry {
  id: string;
  label: string;
  rivFile: string;
  archetype: 'human' | 'mascot';
  hairStyle: string;
  headwear: string;
  eyewear: 'glasses' | 'none';
  outfit: string;
  charm: string;
  defaultColor: string;
  secondaryColor: string;
  discIndex: number;
  vibeTag: string;
}

/**
 * Full database of all pre-compiled Rive (.riv) rigs mapped to their exact
 * internal OpenRive vector parts so part combinations resolve in < 1ms.
 */
export const COMBINATORIAL_RIV_RIGS: CombinatorialRigEntry[] = [
  // --- 24 Combinatorial Human Rigs ---
  {
    id: 'jun',
    label: 'Jun (교수 넥타이 · 안경)',
    rivFile: '/riv/jun.riv',
    archetype: 'human',
    hairStyle: 'short_part',
    headwear: 'none',
    eyewear: 'glasses',
    outfit: 'tie',
    charm: 'none',
    defaultColor: '#38bdf8',
    secondaryColor: '#0284c7',
    discIndex: 8,
    vibeTag: 'CS / 공학 교수',
  },
  {
    id: 'mina',
    label: 'Mina (하이번 · 헤어밴드 · 보조개)',
    rivFile: '/riv/mina.riv',
    archetype: 'human',
    hairStyle: 'bun',
    headwear: 'headband',
    eyewear: 'glasses',
    outfit: 'collar',
    charm: 'dimples',
    defaultColor: '#34d399',
    secondaryColor: '#059669',
    discIndex: 3,
    vibeTag: '친근한 어학 코치',
  },
  {
    id: 'sora',
    label: 'Sora (트윈테일 · 후드 · 이어링)',
    rivFile: '/riv/sora.riv',
    archetype: 'human',
    hairStyle: 'twin_tails',
    headwear: 'headband',
    eyewear: 'glasses',
    outfit: 'hoodie',
    charm: 'earrings',
    defaultColor: '#a855f7',
    secondaryColor: '#7e22ce',
    discIndex: 6,
    vibeTag: '트렌디 멘토',
  },
  {
    id: 'aria',
    label: 'Aria (롱 웨이브 · 베레모 · 이어링)',
    rivFile: '/riv/aria.riv',
    archetype: 'human',
    hairStyle: 'wavy',
    headwear: 'beret',
    eyewear: 'glasses',
    outfit: 'collar',
    charm: 'earrings',
    defaultColor: '#f43f5e',
    secondaryColor: '#be123c',
    discIndex: 4,
    vibeTag: '디자인 / 아트',
  },
  {
    id: 'marcus',
    label: 'Marcus (아프로 · 보타이 · 안경)',
    rivFile: '/riv/marcus.riv',
    archetype: 'human',
    hairStyle: 'afro',
    headwear: 'none',
    eyewear: 'glasses',
    outfit: 'bowtie',
    charm: 'none',
    defaultColor: '#3b82f6',
    secondaryColor: '#1d4ed8',
    discIndex: 2,
    vibeTag: '시스템 아키텍트',
  },
  {
    id: 'diego',
    label: 'Diego (스파이키 · 베레모 · 머플러)',
    rivFile: '/riv/diego.riv',
    archetype: 'human',
    hairStyle: 'spiky',
    headwear: 'beret',
    eyewear: 'none',
    outfit: 'scarf',
    charm: 'dimples',
    defaultColor: '#f97316',
    secondaryColor: '#c2410c',
    discIndex: 1,
    vibeTag: '크리에이티브 코치',
  },
  {
    id: 'elena',
    label: 'Elena (브레이드 · 정장 자켓 · 안경)',
    rivFile: '/riv/elena.riv',
    archetype: 'human',
    hairStyle: 'braid',
    headwear: 'none',
    eyewear: 'glasses',
    outfit: 'blazer',
    charm: 'earrings',
    defaultColor: '#a855f7',
    secondaryColor: '#7e22ce',
    discIndex: 6,
    vibeTag: 'AI / 리서처',
  },
  {
    id: 'tariq',
    label: 'Tariq (비니 · 카라 셔츠 · 안경)',
    rivFile: '/riv/tariq.riv',
    archetype: 'human',
    hairStyle: 'short_part',
    headwear: 'beanie',
    eyewear: 'glasses',
    outfit: 'collar',
    charm: 'none',
    defaultColor: '#14b8a6',
    secondaryColor: '#0f766e',
    discIndex: 7,
    vibeTag: '알고리즘 해커',
  },
  {
    id: 'chloe',
    label: 'Chloe (단발 보브 · 베레모 · 자켓)',
    rivFile: '/riv/chloe.riv',
    archetype: 'human',
    hairStyle: 'bob',
    headwear: 'beret',
    eyewear: 'glasses',
    outfit: 'blazer',
    charm: 'mole',
    defaultColor: '#ec4899',
    secondaryColor: '#be185d',
    discIndex: 9,
    vibeTag: '커뮤니케이션 코치',
  },
  {
    id: 'noah',
    label: 'Noah (포니테일 · 버킷햇 · 머플러)',
    rivFile: '/riv/noah.riv',
    archetype: 'human',
    hairStyle: 'ponytail',
    headwear: 'bucket_hat',
    eyewear: 'glasses',
    outfit: 'scarf',
    charm: 'none',
    defaultColor: '#38bdf8',
    secondaryColor: '#0369a1',
    discIndex: 8,
    vibeTag: '오픈소스 엔지니어',
  },
  {
    id: 'priya',
    label: 'Priya (하이번 · 넥타이 · 홍조)',
    rivFile: '/riv/priya.riv',
    archetype: 'human',
    hairStyle: 'bun',
    headwear: 'none',
    eyewear: 'glasses',
    outfit: 'tie',
    charm: 'blush',
    defaultColor: '#f59e0b',
    secondaryColor: '#b45309',
    discIndex: 5,
    vibeTag: '딥러닝 아키텍트',
  },
  {
    id: 'liam',
    label: 'Liam (스파이키 · 캡모자 · 보조개)',
    rivFile: '/riv/liam.riv',
    archetype: 'human',
    hairStyle: 'spiky',
    headwear: 'cap',
    eyewear: 'none',
    outfit: 'collar',
    charm: 'dimples',
    defaultColor: '#22c55e',
    secondaryColor: '#15803d',
    discIndex: 3,
    vibeTag: '스타트업 메이커',
  },
  {
    id: 'mei',
    label: 'Mei (롱 웨이브 · 헤어밴드 · 이어링)',
    rivFile: '/riv/mei.riv',
    archetype: 'human',
    hairStyle: 'wavy',
    headwear: 'headband',
    eyewear: 'glasses',
    outfit: 'collar',
    charm: 'earrings',
    defaultColor: '#fb7185',
    secondaryColor: '#be123c',
    discIndex: 4,
    vibeTag: '인문학 / 역사',
  },
  {
    id: 'omar',
    label: 'Omar (아프로 · 학사모 · 보타이)',
    rivFile: '/riv/omar.riv',
    archetype: 'human',
    hairStyle: 'afro',
    headwear: 'mortarboard',
    eyewear: 'glasses',
    outfit: 'bowtie',
    charm: 'none',
    defaultColor: '#6366f1',
    secondaryColor: '#4338ca',
    discIndex: 6,
    vibeTag: '수리물리 / 학자',
  },
  {
    id: 'zoe',
    label: 'Zoe (단발 보브 · 비니 · 멜빵)',
    rivFile: '/riv/zoe.riv',
    archetype: 'human',
    hairStyle: 'bob',
    headwear: 'beanie',
    eyewear: 'glasses',
    outfit: 'straps',
    charm: 'blush',
    defaultColor: '#2dd4bf',
    secondaryColor: '#0f766e',
    discIndex: 7,
    vibeTag: '실전 워크숍 코치',
  },
  {
    id: 'lucas',
    label: 'Lucas (커튼 뱅 · 캡모자 · 자켓)',
    rivFile: '/riv/lucas.riv',
    archetype: 'human',
    hairStyle: 'curtain',
    headwear: 'cap',
    eyewear: 'glasses',
    outfit: 'blazer',
    charm: 'none',
    defaultColor: '#60a5fa',
    secondaryColor: '#2563eb',
    discIndex: 2,
    vibeTag: '시스템 디자인',
  },
  {
    id: 'nadia',
    label: 'Nadia (롱 웨이브 · 자켓 · 매력점)',
    rivFile: '/riv/nadia.riv',
    archetype: 'human',
    hairStyle: 'wavy',
    headwear: 'none',
    eyewear: 'glasses',
    outfit: 'blazer',
    charm: 'mole',
    defaultColor: '#c084fc',
    secondaryColor: '#7e22ce',
    discIndex: 6,
    vibeTag: '언어학 / 스피치',
  },
  {
    id: 'felix',
    label: 'Felix (아프로 · 베레모 · 보타이)',
    rivFile: '/riv/felix.riv',
    archetype: 'human',
    hairStyle: 'afro',
    headwear: 'beret',
    eyewear: 'glasses',
    outfit: 'bowtie',
    charm: 'dimples',
    defaultColor: '#fbbf24',
    secondaryColor: '#b45309',
    discIndex: 5,
    vibeTag: '그래픽스 / 수학',
  },
  {
    id: 'yuki',
    label: 'Yuki (트윈테일 · 버킷햇 · 후드)',
    rivFile: '/riv/yuki.riv',
    archetype: 'human',
    hairStyle: 'twin_tails',
    headwear: 'bucket_hat',
    eyewear: 'none',
    outfit: 'hoodie',
    charm: 'blush',
    defaultColor: '#38bdf8',
    secondaryColor: '#0284c7',
    discIndex: 8,
    vibeTag: '컬처 / 미디어',
  },
  {
    id: 'hassan',
    label: 'Hassan (가르마 · 머플러 · 자켓)',
    rivFile: '/riv/hassan.riv',
    archetype: 'human',
    hairStyle: 'short_part',
    headwear: 'none',
    eyewear: 'glasses',
    outfit: 'scarf',
    charm: 'none',
    defaultColor: '#34d399',
    secondaryColor: '#059669',
    discIndex: 3,
    vibeTag: '강화학습 / 에이전트',
  },
  {
    id: 'iris',
    label: 'Iris (브레이드 · 베레모 · 멜빵)',
    rivFile: '/riv/iris.riv',
    archetype: 'human',
    hairStyle: 'braid',
    headwear: 'beret',
    eyewear: 'glasses',
    outfit: 'straps',
    charm: 'earrings',
    defaultColor: '#f472b6',
    secondaryColor: '#db2777',
    discIndex: 9,
    vibeTag: '감성 / 크리에이티브',
  },
  {
    id: 'victor',
    label: 'Victor (포니테일 · 학사모 · 카라)',
    rivFile: '/riv/victor.riv',
    archetype: 'human',
    hairStyle: 'ponytail',
    headwear: 'mortarboard',
    eyewear: 'glasses',
    outfit: 'collar',
    charm: 'none',
    defaultColor: '#818cf8',
    secondaryColor: '#4f46e5',
    discIndex: 6,
    vibeTag: '우주 / 물리학 박사',
  },
  {
    id: 'jin',
    label: 'Jin (가르마 · 보타이 · 넥타이)',
    rivFile: '/riv/jin.riv',
    archetype: 'human',
    hairStyle: 'short_part',
    headwear: 'none',
    eyewear: 'glasses',
    outfit: 'bowtie',
    charm: 'mole',
    defaultColor: '#2dd4bf',
    secondaryColor: '#0d9488',
    discIndex: 7,
    vibeTag: '로우레벨 / 최적화',
  },
  {
    id: 'yuna',
    label: 'Yuna (하이번 · 카라 셔츠 · 안경)',
    rivFile: '/riv/yuna.riv',
    archetype: 'human',
    hairStyle: 'bun',
    headwear: 'none',
    eyewear: 'glasses',
    outfit: 'collar',
    charm: 'none',
    defaultColor: '#fb923c',
    secondaryColor: '#ea580c',
    discIndex: 1,
    vibeTag: '차분한 기초 튜터',
  },

  // --- 15 Expressive Mascot & Character Rigs ---
  {
    id: 'hoot',
    label: 'Prof. Hoot (지혜로운 부엉이)',
    rivFile: '/riv/hoot.riv',
    archetype: 'mascot',
    hairStyle: 'mascot',
    headwear: 'mortarboard',
    eyewear: 'glasses',
    outfit: 'bowtie',
    charm: 'none',
    defaultColor: '#f59e0b',
    secondaryColor: '#b45309',
    discIndex: 5,
    vibeTag: '철학 / 교양 부엉이',
  },
  {
    id: 'roxy',
    label: 'Roxy (영리한 여우 메이커)',
    rivFile: '/riv/roxy.riv',
    archetype: 'mascot',
    hairStyle: 'mascot',
    headwear: 'none',
    eyewear: 'none',
    outfit: 'scarf',
    charm: 'blush',
    defaultColor: '#f97316',
    secondaryColor: '#c2410c',
    discIndex: 1,
    vibeTag: '기획 / 그로스 여우',
  },
  {
    id: 'barnaby',
    label: 'Barnaby (든든한 곰 선배)',
    rivFile: '/riv/barnaby.riv',
    archetype: 'mascot',
    hairStyle: 'mascot',
    headwear: 'beanie',
    eyewear: 'glasses',
    outfit: 'scarf',
    charm: 'dimples',
    defaultColor: '#a855f7',
    secondaryColor: '#6b21a8',
    discIndex: 6,
    vibeTag: '기초 탄탄 곰 멘토',
  },
  {
    id: 'spark',
    label: 'Spark (AI 로봇 코치)',
    rivFile: '/riv/spark.riv',
    archetype: 'mascot',
    hairStyle: 'mascot',
    headwear: 'none',
    eyewear: 'none',
    outfit: 'hoodie',
    charm: 'none',
    defaultColor: '#38bdf8',
    secondaryColor: '#0284c7',
    discIndex: 8,
    vibeTag: 'AI / 로보틱스 봇',
  },
  {
    id: 'toto',
    label: 'Master Toto (단계별 거북이 사부)',
    rivFile: '/riv/toto.riv',
    archetype: 'mascot',
    hairStyle: 'mascot',
    headwear: 'mortarboard',
    eyewear: 'glasses',
    outfit: 'collar',
    charm: 'none',
    defaultColor: '#10b981',
    secondaryColor: '#047857',
    discIndex: 3,
    vibeTag: '차근차근 거북이 사부',
  },
  {
    id: 'bolt',
    label: 'Bolt (번개 바이브 코더)',
    rivFile: '/riv/bolt.riv',
    archetype: 'mascot',
    hairStyle: 'spiky',
    headwear: 'none',
    eyewear: 'none',
    outfit: 'hoodie',
    charm: 'none',
    defaultColor: '#6366f1',
    secondaryColor: '#4338ca',
    discIndex: 2,
    vibeTag: '초고속 프로토타이핑',
  },
  {
    id: 'coach-pen',
    label: 'Coach Pen (펭귄 알고리즘 코치)',
    rivFile: '/riv/coach-pen.riv',
    archetype: 'mascot',
    hairStyle: 'mascot',
    headwear: 'cap',
    eyewear: 'none',
    outfit: 'bowtie',
    charm: 'blush',
    defaultColor: '#ec4899',
    secondaryColor: '#db2777',
    discIndex: 9,
    vibeTag: '스파르타 코딩 펭귄',
  },
  {
    id: 'mong',
    label: 'Mong (호기심 강아지 연구원)',
    rivFile: '/riv/mong.riv',
    archetype: 'mascot',
    hairStyle: 'mascot',
    headwear: 'beret',
    eyewear: 'none',
    outfit: 'collar',
    charm: 'blush',
    defaultColor: '#14b8a6',
    secondaryColor: '#0d9488',
    discIndex: 7,
    vibeTag: '친절한 AI 메이트',
  },
  {
    id: 'nabi',
    label: 'Nabi (우주 고양이 네비게이터)',
    rivFile: '/riv/nabi.riv',
    archetype: 'mascot',
    hairStyle: 'mascot',
    headwear: 'bucket_hat',
    eyewear: 'none',
    outfit: 'scarf',
    charm: 'earrings',
    defaultColor: '#f97316',
    secondaryColor: '#ea580c',
    discIndex: 1,
    vibeTag: '호기심 고양이 항해사',
  },
  {
    id: 'leo',
    label: 'Chef Leo (요리 & 스페인어 마에스트로)',
    rivFile: '/riv/leo.riv',
    archetype: 'mascot',
    hairStyle: 'curtain',
    headwear: 'beret',
    eyewear: 'none',
    outfit: 'scarf',
    charm: 'dimples',
    defaultColor: '#ef4444',
    secondaryColor: '#b91c1c',
    discIndex: 4,
    vibeTag: '미식 & 회화 셰프',
  },
  {
    id: 'claire',
    label: 'Detective Claire (디버깅 탐정)',
    rivFile: '/riv/claire.riv',
    archetype: 'mascot',
    hairStyle: 'bob',
    headwear: 'beret',
    eyewear: 'glasses',
    outfit: 'blazer',
    charm: 'mole',
    defaultColor: '#eab308',
    secondaryColor: '#a16207',
    discIndex: 5,
    vibeTag: '원인 분석 탐정',
  },
  {
    id: 'kenji',
    label: 'Kenji (크리에이티브 오디오 & 셰이더)',
    rivFile: '/riv/kenji.riv',
    archetype: 'mascot',
    hairStyle: 'spiky',
    headwear: 'headband',
    eyewear: 'none',
    outfit: 'hoodie',
    charm: 'none',
    defaultColor: '#06b6d4',
    secondaryColor: '#0e7490',
    discIndex: 7,
    vibeTag: '사운드 & 그래픽 아티스트',
  },
];

export const CANDY_DISC_PALETTES = [
  {
    id: 0,
    label: 'Pearl Mint',
    accent: '#38bdf8',
    secondary: '#6366f1',
    gradient: 'radial-gradient(circle at 35% 28%, #ffffff 0%, #f1f5f9 72%, #cbd5e1 100%)',
  },
  {
    id: 1,
    label: 'Tangerine Pop',
    accent: '#fb923c',
    secondary: '#ea580c',
    gradient: 'radial-gradient(circle at 35% 28%, #fb923c 0%, #f97316 68%, #c2410c 100%)',
  },
  {
    id: 2,
    label: 'Cobalt Rush',
    accent: '#60a5fa',
    secondary: '#2563eb',
    gradient: 'radial-gradient(circle at 35% 28%, #60a5fa 0%, #2563eb 68%, #1e3a8a 100%)',
  },
  {
    id: 3,
    label: 'Emerald Fizz',
    accent: '#4ade80',
    secondary: '#16a34a',
    gradient: 'radial-gradient(circle at 35% 28%, #4ade80 0%, #22c55e 68%, #15803d 100%)',
  },
  {
    id: 4,
    label: 'Rose Berry',
    accent: '#fb7185',
    secondary: '#e11d48',
    gradient: 'radial-gradient(circle at 35% 28%, #fb7185 0%, #f43f5e 68%, #be123c 100%)',
  },
  {
    id: 5,
    label: 'Lemon Zest',
    accent: '#fbbf24',
    secondary: '#d97706',
    gradient: 'radial-gradient(circle at 35% 28%, #fde047 0%, #eab308 70%, #a16207 100%)',
  },
  {
    id: 6,
    label: 'Grape Nebula',
    accent: '#a78bfa',
    secondary: '#7c3aed',
    gradient: 'radial-gradient(circle at 35% 28%, #a78bfa 0%, #7c3aed 68%, #4c1d95 100%)',
  },
  {
    id: 7,
    label: 'Aqua Mint',
    accent: '#2dd4bf',
    secondary: '#0d9488',
    gradient: 'radial-gradient(circle at 35% 28%, #2dd4bf 0%, #0d9488 68%, #115e59 100%)',
  },
  {
    id: 8,
    label: 'Sky Glacier',
    accent: '#38bdf8',
    secondary: '#0284c7',
    gradient: 'radial-gradient(circle at 35% 28%, #38bdf8 0%, #0284c7 68%, #0c4a6e 100%)',
  },
  {
    id: 9,
    label: 'Pink Bubblegum',
    accent: '#f472b6',
    secondary: '#db2777',
    gradient: 'radial-gradient(circle at 35% 28%, #f472b6 0%, #db2777 68%, #831843 100%)',
  },
];

/**
 * Given a user's selected character parts, scores all pre-compiled Rive rigs
 * and returns the best matching rig in < 1ms (zero build latency).
 */
export function matchAvatarByParts(parts: AvatarPartsConfig): CombinatorialRigEntry {
  const pool = COMBINATORIAL_RIV_RIGS.filter((r) => r.archetype === parts.archetype);
  const candidates = pool.length > 0 ? pool : COMBINATORIAL_RIV_RIGS;

  let bestRig = candidates[0];
  let bestScore = -1;

  for (const rig of candidates) {
    let score = 0;
    if (rig.headwear === parts.headwear) score += 5;
    if (rig.hairStyle === parts.hairStyle) score += 4;
    if (rig.outfit === parts.outfit) score += 4;
    if (rig.eyewear === parts.eyewear) score += 2;
    if (rig.charm === parts.charm) score += 2;

    if (score > bestScore) {
      bestScore = score;
      bestRig = rig;
    }
  }

  return bestRig;
}

/**
 * Deterministically recommends character parts & Rive rig based on a topic string
 * and teaching style so even before/without an LLM round-trip it feels magical.
 */
export function recommendAvatarPartsForTopic(
  topic: string,
  teachingStyle: 'socratic' | 'hands_on' | 'friendly' | 'strict' = 'friendly'
): {
  parts: AvatarPartsConfig;
  matchedRig: CombinatorialRigEntry;
  palette: (typeof CANDY_DISC_PALETTES)[number];
} {
  const lower = topic.toLowerCase();

  let parts: AvatarPartsConfig = {
    archetype: 'human',
    hairStyle: 'short_part',
    headwear: 'none',
    eyewear: 'glasses',
    outfit: 'tie',
    charm: 'none',
    discIndex: 8,
  };

  if (
    lower.includes('디자인') ||
    lower.includes('아트') ||
    lower.includes('미술') ||
    lower.includes('ui') ||
    lower.includes('ux') ||
    lower.includes('design') ||
    lower.includes('art') ||
    lower.includes('color')
  ) {
    parts = {
      archetype: 'human',
      hairStyle: 'wavy',
      headwear: 'beret',
      eyewear: 'glasses',
      outfit: 'collar',
      charm: 'earrings',
      discIndex: 4,
    };
  } else if (
    lower.includes('수학') ||
    lower.includes('물리') ||
    lower.includes('양자') ||
    lower.includes('우주') ||
    lower.includes('논문') ||
    lower.includes('math') ||
    lower.includes('physics') ||
    lower.includes('quantum')
  ) {
    parts = {
      archetype: 'human',
      hairStyle: 'afro',
      headwear: 'mortarboard',
      eyewear: 'glasses',
      outfit: 'bowtie',
      charm: 'none',
      discIndex: 6,
    };
  } else if (
    lower.includes('영어') ||
    lower.includes('스페인어') ||
    lower.includes('일본어') ||
    lower.includes('중국어') ||
    lower.includes('회화') ||
    lower.includes('언어') ||
    lower.includes('면접') ||
    lower.includes('스피치') ||
    lower.includes('language')
  ) {
    parts = {
      archetype: 'human',
      hairStyle: 'bob',
      headwear: 'beret',
      eyewear: 'glasses',
      outfit: 'blazer',
      charm: 'mole',
      discIndex: 9,
    };
  } else if (
    lower.includes('알고리즘') ||
    lower.includes('코딩') ||
    lower.includes('해킹') ||
    lower.includes('보안') ||
    lower.includes('백엔드') ||
    lower.includes('리눅스') ||
    lower.includes('rust') ||
    lower.includes('react') ||
    lower.includes('python')
  ) {
    parts = {
      archetype: 'human',
      hairStyle: 'short_part',
      headwear: 'beanie',
      eyewear: 'glasses',
      outfit: 'collar',
      charm: 'none',
      discIndex: 7,
    };
  } else if (
    lower.includes('창업') ||
    lower.includes('스타트업') ||
    lower.includes('마케팅') ||
    lower.includes('주식') ||
    lower.includes('재테크') ||
    lower.includes('경제') ||
    lower.includes('투자')
  ) {
    parts = {
      archetype: 'human',
      hairStyle: 'curtain',
      headwear: 'cap',
      eyewear: 'glasses',
      outfit: 'blazer',
      charm: 'none',
      discIndex: 2,
    };
  } else if (
    lower.includes('요리') ||
    lower.includes('커피') ||
    lower.includes('와인') ||
    lower.includes('베이킹') ||
    lower.includes('운동') ||
    lower.includes('헬스') ||
    lower.includes('기타') ||
    lower.includes('음악')
  ) {
    parts = {
      archetype: 'human',
      hairStyle: 'spiky',
      headwear: 'beret',
      eyewear: 'none',
      outfit: 'scarf',
      charm: 'dimples',
      discIndex: 1,
    };
  } else if (teachingStyle === 'socratic') {
    parts.headwear = 'mortarboard';
    parts.outfit = 'bowtie';
    parts.discIndex = 5;
  } else if (teachingStyle === 'hands_on') {
    parts.headwear = 'beanie';
    parts.outfit = 'straps';
    parts.hairStyle = 'bob';
    parts.discIndex = 7;
  } else if (teachingStyle === 'strict') {
    parts.headwear = 'none';
    parts.outfit = 'blazer';
    parts.hairStyle = 'braid';
    parts.discIndex = 6;
  }

  const matchedRig = matchAvatarByParts(parts);
  const palette =
    CANDY_DISC_PALETTES[parts.discIndex % CANDY_DISC_PALETTES.length] ||
    CANDY_DISC_PALETTES[8];

  return { parts, matchedRig, palette };
}
