'use client';

import React, { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Check,
  Flame,
  ShoppingBag,
  Snowflake,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { SHOP_ITEMS } from '@/data/shopItems';
import { ShopItem } from '@/types/mentor';
import { useUserProgress } from '@/context/UserProgressContext';

type ShopTab = 'all' | 'avatar_skin' | 'streak_item' | 'aura_and_theme';

interface CandyShopModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function CandyShopModal({ isOpen, onClose }: CandyShopModalProps = {}) {
  const {
    profile,
    storageMode,
    purchaseItem,
    equipItem,
    addCandy,
    isShopOpen,
    setIsShopOpen,
  } = useUserProgress();

  const [activeTab, setActiveTab] = useState<ShopTab>('all');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const modalVisible = typeof isOpen === 'boolean' ? isOpen : isShopOpen;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setIsShopOpen(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return SHOP_ITEMS;
    if (activeTab === 'avatar_skin') {
      return SHOP_ITEMS.filter((i) => i.category === 'avatar_skin');
    }
    if (activeTab === 'streak_item') {
      return SHOP_ITEMS.filter((i) => i.category === 'streak_item');
    }
    return SHOP_ITEMS.filter(
      (i) => i.category === 'aura_effect' || i.category === 'studio_theme'
    );
  }, [activeTab]);

  if (!modalVisible) return null;

  const isEquipped = (item: ShopItem) => {
    if (item.category === 'avatar_skin') {
      return profile.equippedSkinId === item.id;
    }
    if (item.category === 'aura_effect') {
      return profile.equippedAuraId === item.id;
    }
    if (item.category === 'studio_theme') {
      return profile.equippedThemeId === item.id;
    }
    return false;
  };

  const handleBuy = (item: ShopItem) => {
    const res = purchaseItem(item);
    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    if (res.success) {
      try {
        confetti({
          particleCount: 55,
          spread: 65,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore confetti errors in SSR/headless environments
      }
    }
  };

  const handleEquipToggle = (item: ShopItem) => {
    const currentlyEquipped = isEquipped(item);
    equipItem(item);
    setFeedback({
      type: 'success',
      text: currentlyEquipped
        ? `Unequipped "${item.name}".`
        : `✨ Equipped "${item.name}"!`,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Duolingo Style Candy Shop"
    >
      <div className="relative w-full max-w-4xl max-h-[88vh] flex flex-col rounded-3xl bg-slate-900/95 border border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.75)] overflow-hidden text-white">
        {/* Top Ambient Glow */}
        <div className="absolute -top-24 left-1/3 w-96 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 right-1/4 w-96 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-white/10 bg-slate-900/70">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-pink-500/25">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight text-white">
                  Mentors Candy Shop & Avatar Customizer
                </h2>
                <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30">
                  Duolingo Economy
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Spend Candy (🍬) earned from quizzes and deep-dive questions to unlock Rive avatar skins, auras, and Streak Freezes!
              </p>
            </div>
          </div>

          {/* Right Status Pills */}
          <div className="flex items-center gap-2.5">
            {/* Streak Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/15 border border-orange-400/30 text-orange-300 text-xs font-bold">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span>{profile.streakDays}-Day Streak</span>
            </div>

            {/* Streak Freeze Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs font-bold">
              <Snowflake className="w-4 h-4 text-sky-400" />
              <span>{profile.streakFreezeCount} Freezes</span>
            </div>

            {/* Candy Balance Pill */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-pink-500/20 border border-pink-400/40 text-pink-200 text-sm font-extrabold shadow-[0_0_15px_rgba(244,114,182,0.25)]">
              <span>🍬</span>
              <span>{profile.candyBalance} Candy</span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition"
              aria-label="Close Shop"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs & Demo Boost Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-slate-950/60 border-b border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'avatar_skin', label: 'Avatar Skins' },
              { id: 'streak_item', label: 'Streak & Boosts' },
              { id: 'aura_and_theme', label: 'Auras & Themes' },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as ShopTab)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-md shadow-pink-500/25'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              addCandy(30, 'Hackathon Demo Refill!');
              setFeedback({
                type: 'success',
                text: '🍬 Added +30 Demo Candy to your balance!',
              });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-xs font-bold transition"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>+30 Demo Candy</span>
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`mx-6 mt-4 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between border ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                : 'bg-rose-500/15 border-rose-400/40 text-rose-200'
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isConsumableStreak = item.id === 'streak-freeze';
            const unlocked =
              !isConsumableStreak && profile.unlockedItemIds.includes(item.id);
            const equipped = isEquipped(item);
            const canAfford = profile.candyBalance >= item.costCandy;
            const isEquippable =
              item.category === 'avatar_skin' ||
              item.category === 'aura_effect' ||
              item.category === 'studio_theme';

            return (
              <div
                key={item.id}
                className={`group relative flex flex-col justify-between rounded-2xl p-4 border transition-all ${
                  equipped
                    ? 'bg-gradient-to-b from-slate-800/90 to-slate-900/90 border-cyan-400/60 shadow-[0_0_25px_rgba(34,211,238,0.2)]'
                    : unlocked
                      ? 'bg-slate-800/50 border-white/15 hover:border-white/30'
                      : 'bg-slate-900/70 border-white/10 hover:border-pink-400/40'
                }`}
              >
                <div>
                  {/* Top Badge Row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      className={`w-13 h-13 rounded-2xl flex items-center justify-center text-2xl bg-slate-950/80 border border-white/10 ${
                        item.previewCssClass || ''
                      }`}
                    >
                      <span>{item.icon}</span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                        style={{
                          backgroundColor: `${item.badgeColor}20`,
                          borderColor: `${item.badgeColor}55`,
                          color: item.badgeColor,
                        }}
                      >
                        {item.category === 'avatar_skin' && 'Avatar Skin'}
                        {item.category === 'streak_item' && 'Streak / Boost'}
                        {item.category === 'aura_effect' && 'Aura Effect'}
                        {item.category === 'studio_theme' && 'Studio Theme'}
                      </span>

                      {equipped && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-400/20 text-cyan-300 border border-cyan-400/40">
                          <Sparkles className="w-3 h-3" /> Equipped
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-bold text-white leading-snug mb-1.5">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>

                {/* Action Button */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-xs font-extrabold text-pink-300">
                    <span>🍬</span>
                    <span>{item.costCandy} Candy</span>
                  </div>

                  {unlocked && isEquippable ? (
                    <button
                      type="button"
                      onClick={() => handleEquipToggle(item)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                        equipped
                          ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 hover:bg-cyan-500/30'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{equipped ? 'Unequip' : 'Equip'}</span>
                    </button>
                  ) : unlocked && !isEquippable ? (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      ⚡ Booster Active
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBuy(item)}
                      disabled={!canAfford}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition ${
                        canAfford
                          ? 'bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-400 hover:to-fuchsia-500 text-white shadow-md shadow-pink-500/20'
                          : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      {isConsumableStreak ? 'Buy More' : 'Buy Item'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Sync Bar */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Cloud Sync:{' '}
              <strong className="text-slate-200">
                {storageMode === 'firestore'
                  ? 'Google Cloud Firestore (h2gdm-hack26icn-2694)'
                  : 'Server Memory + Local Persistence (Firestore Ready)'}
              </strong>
            </span>
          </div>
          <div>
            Total XP:{' '}
            <strong className="text-indigo-300">{profile.xpTotal} XP</strong> •
            Quizzes Completed:{' '}
            <strong className="text-pink-300">
              {profile.completedQuizIds.length}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CandyShopModal;
