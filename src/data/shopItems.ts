import { ShopItem } from '@/types/mentor';

export const SHOP_ITEMS: ShopItem[] = [
  // Avatar Skins
  {
    id: 'skin-neon-cyber',
    name: 'Cyber Neon Ring',
    description:
      'Surrounds your Rive mentor avatar with a high-voltage cyan & magenta neon pulse ring.',
    category: 'avatar_skin',
    costCandy: 30,
    icon: '💠',
    badgeColor: '#00f2fe',
    previewCssClass:
      'ring-2 ring-cyan-400 shadow-[0_0_25px_rgba(0,242,254,0.65)]',
  },
  {
    id: 'skin-hologram-crown',
    name: 'Hologram Master Crown',
    description:
      'A holographic royal crown and prismatic aura frame awarded to dedicated master learners.',
    category: 'avatar_skin',
    costCandy: 60,
    icon: '👑',
    badgeColor: '#c084fc',
    previewCssClass:
      'ring-2 ring-purple-400 shadow-[0_0_30px_rgba(192,132,252,0.75)]',
  },
  {
    id: 'skin-golden-prof',
    name: 'Golden Scholar Emblem',
    description:
      'Ivy-league inspired golden academic frame with warm radiant sparkle effects.',
    category: 'avatar_skin',
    costCandy: 80,
    icon: '🎓',
    badgeColor: '#fbbf24',
    previewCssClass:
      'ring-2 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.75)]',
  },
  {
    id: 'skin-pixel-visor',
    name: '8-Bit Arcade Visor',
    description:
      'Retro-futuristic emerald synthwave laser visor frame with crisp pixel energy.',
    category: 'avatar_skin',
    costCandy: 50,
    icon: '🕶️',
    badgeColor: '#34d399',
    previewCssClass:
      'ring-2 ring-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.65)]',
  },

  // Streak & Boost Items
  {
    id: 'streak-freeze',
    name: 'Streak Freeze 🧊',
    description:
      'Protects your daily learning streak for one full day if you miss a study session.',
    category: 'streak_item',
    costCandy: 40,
    icon: '🧊',
    badgeColor: '#38bdf8',
    previewCssClass:
      'ring-1 ring-sky-400/60 bg-sky-500/10 shadow-[0_0_20px_rgba(56,189,248,0.4)]',
  },
  {
    id: 'double-candy-boost',
    name: '2x Candy Booster ⚡',
    description:
      'Doubles the Candy rewards earned from your quizzes and deep-dive mentor questions.',
    category: 'streak_item',
    costCandy: 45,
    icon: '⚡',
    badgeColor: '#facc15',
    previewCssClass:
      'ring-1 ring-yellow-400/60 bg-yellow-500/10 shadow-[0_0_20px_rgba(250,204,21,0.4)]',
  },

  // Aura Effects
  {
    id: 'aura-quantum-orbit',
    name: 'Quantum Orbit Aura',
    description:
      'Activates an orbital field of quantum particles circulating around your mentor avatar.',
    category: 'aura_effect',
    costCandy: 55,
    icon: '⚛️',
    badgeColor: '#818cf8',
    previewCssClass:
      'bg-gradient-to-tr from-indigo-500/20 via-cyan-500/15 to-purple-500/20',
  },
  {
    id: 'aura-matrix-rain',
    name: 'Matrix Pulse Aura',
    description:
      'Streams cybernetic digital code ripples across the mentor avatar backdrop.',
    category: 'aura_effect',
    costCandy: 70,
    icon: '🧬',
    badgeColor: '#10b981',
    previewCssClass:
      'bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-cyan-500/20',
  },

  // Studio Themes
  {
    id: 'theme-aurora-lab',
    name: 'Aurora Deep-Space Lab',
    description:
      'Infuses your learning studio backdrop with ambient northern-lights nebula illumination.',
    category: 'studio_theme',
    costCandy: 50,
    icon: '🌌',
    badgeColor: '#f472b6',
    previewCssClass:
      'bg-gradient-to-br from-fuchsia-500/15 via-violet-600/10 to-cyan-500/15',
  },
];

export function getShopItemById(id?: string | null): ShopItem | undefined {
  if (!id) return undefined;
  return SHOP_ITEMS.find((item) => item.id === id);
}
