"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/layout/PageTransition";
import { useUserStore } from "@/store/userStore";
import { shopItems, CATEGORY_LABELS } from "@/data/shop";
import type { ShopCategory, ShopItem } from "@/types";
import { cn } from "@/lib/utils";

type Filter = "all" | ShopCategory;
const FILTERS: Filter[] = ["all", "avatar", "title", "frame"];

const FILTER_ICONS: Record<string, string> = {
  all: "✦", avatar: "😀", title: "🏷️", frame: "🖼️",
};

const CATEGORY_COUNTS: Record<string, number> = {
  all:    shopItems.length,
  avatar: shopItems.filter((i) => i.category === "avatar").length,
  title:  shopItems.filter((i) => i.category === "title").length,
  frame:  shopItems.filter((i) => i.category === "frame").length,
};

const FEATURED_IDS = ["av_dragon", "title_champion", "frame_gold"];
const featuredItems = FEATURED_IDS.map((id) => shopItems.find((i) => i.id === id)!).filter(Boolean);

// ─── Stat chip in hero ──────────────────────────────────────────────────────
function HeroStat({ emoji, label, value }: { emoji: string; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2.5 bg-white/8 border border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-sm">
      <span className="text-lg leading-none">{emoji}</span>
      <div>
        <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest leading-none mb-0.5">{label}</p>
        <p className="text-white font-black text-base leading-none">{value}</p>
      </div>
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────
const ProductCard = memo(function ProductCard({
  item,
  xp,
  purchasedIds,
  user,
  buying,
  justBought,
  errItem,
  onBuy,
}: {
  item: ShopItem;
  xp: number;
  purchasedIds: string[];
  user: { avatarId?: string; titleId?: string; frameId?: string } | null;
  buying: string | null;
  justBought: string | null;
  errItem: string | null;
  onBuy: (item: ShopItem) => void;
}) {
  const owned      = purchasedIds.includes(item.id);
  const canAfford  = xp >= item.cost;
  const isError    = errItem    === item.id;
  const isBuying   = buying     === item.id;
  const isBought   = justBought === item.id;
  const isEquipped =
    (item.category === "avatar" && user?.avatarId === item.id) ||
    (item.category === "title" && user?.titleId  === item.id) ||
    (item.category === "frame" && user?.frameId  === item.id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: isError ? 1 : !canAfford && !owned ? 0.72 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "flex flex-col rounded-2xl overflow-hidden bg-white shadow-sm border transition-shadow duration-200 hover:shadow-md",
        isError ? "border-red-300 ring-1 ring-red-200" : "border-border",
      )}
    >
      {/* Preview */}
      <div className={cn("relative flex items-center justify-center overflow-hidden", item.color)} style={{ aspectRatio: "4/3" }}>
        {/* Decorative blobs */}
        <div className="absolute -right-6 -top-6 w-20 h-20 bg-black/10 rounded-full pointer-events-none" />
        <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full pointer-events-none" />

        {/* Status badge */}
        {owned ? (
          <span className={cn(
            "absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-full z-10",
            isEquipped ? "bg-accent text-zinc-900" : "bg-black/30 text-white"
          )}>
            {isEquipped ? "✓ Активно" : "Куплено"}
          </span>
        ) : !canAfford && (
          <span className="absolute top-2 left-2 text-sm z-10">🔒</span>
        )}

        <motion.span
          animate={isBought ? { scale: [1, 1.45, 1], rotate: [0, -12, 12, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="text-5xl relative z-10 select-none"
        >
          {item.preview}
        </motion.span>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex-1">
          <p className="font-black text-text text-sm leading-tight">{item.name}</p>
          <p className="text-[11px] text-text-muted mt-0.5 leading-snug">{item.description}</p>
        </div>

        <button
          onClick={() => onBuy(item)}
          disabled={isBuying || (!owned && !canAfford && !isError)}
          aria-label={owned ? `Надеть ${item.name}` : `Купить ${item.name} за ${item.cost} XP`}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black",
            "transition-all duration-200 active:scale-95",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            isBought
              ? "bg-emerald-50 text-emerald-600"
              : isError
              ? "bg-red-50 text-red-500 cursor-default"
              : owned
              ? isEquipped
                ? "bg-primary/8 text-primary cursor-default"
                : "bg-gray-100 text-text hover:bg-primary/8 hover:text-primary"
              : canAfford
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-gray-100 text-text-muted cursor-not-allowed"
          )}
        >
          {isBuying ? (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isBought ? (
            "✓ Куплено!"
          ) : isError ? (
            `Нужно ещё ${item.cost - xp} XP`
          ) : owned ? (
            isEquipped ? "Активно" : "Надеть"
          ) : (
            <>⚡ <span>{item.cost} XP</span></>
          )}
        </button>
      </div>
    </motion.div>
  );
});

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ShopPage() {
  const xp            = useUserStore((s) => s.xp);
  const purchasedIds  = useUserStore((s) => s.purchasedIds);
  const purchase           = useUserStore((s) => s.purchase);
  const reconcileXP        = useUserStore((s) => s.reconcileXP);
  const reconcilePurchases = useUserStore((s) => s.reconcilePurchases);
  const updateAvatar  = useUserStore((s) => s.updateAvatar);
  const equipTitle    = useUserStore((s) => s.equipTitle);
  const equipFrame    = useUserStore((s) => s.equipFrame);
  const showToast     = useUserStore((s) => s.showToast);
  const user          = useUserStore((s) => s.user);

  const [filter,     setFilter]     = useState<Filter>("all");
  const [buying,     setBuying]     = useState<string | null>(null);
  const [justBought, setJustBought] = useState<string | null>(null);
  const [errItem,    setErrItem]    = useState<string | null>(null);

  const visible = useMemo(
    () => filter === "all" ? shopItems : shopItems.filter((i) => i.category === filter),
    [filter],
  );
  const ownedCount      = purchasedIds.length;
  const affordableCount = useMemo(
    () => shopItems.filter((i) => xp >= i.cost && !purchasedIds.includes(i.id)).length,
    [xp, purchasedIds],
  );
  const collectionPct = Math.round((ownedCount / shopItems.length) * 100);

  const handleBuy = useCallback(async (item: ShopItem) => {
    const owned = purchasedIds.includes(item.id);
    if (owned) {
      if (item.category === "avatar") {
        updateAvatar(item.id as import("@/types").AvatarId);
        showToast("Аватар активирован", `Теперь на тебе «${item.name}».`);
      }
      if (item.category === "title") {
        equipTitle(item.id);
        showToast("Титул активирован", `Теперь на тебе «${item.name}».`);
      }
      if (item.category === "frame") {
        equipFrame(item.id);
        showToast("Рамка активирована", `Для аватара выбрана «${item.name}».`);
      }
      return;
    }
    if (xp < item.cost) {
      setErrItem(item.id);
      setTimeout(() => setErrItem(null), 2000);
      return;
    }
    setBuying(item.id);
    try {
      const res = await fetch("/api/shop/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      const data: { ok?: boolean; newXP?: number; purchasedIds?: string[]; error?: string } = await res.json();

      if (!res.ok) {
        setErrItem(item.id);
        setTimeout(() => setErrItem(null), 2000);
        showToast("Ошибка покупки", data.error ?? "Попробуй снова");
        return;
      }

      // Local update using server-confirmed state
      purchase(item.id, item.cost);
      if (data.newXP !== undefined) reconcileXP(data.newXP);
      if (data.purchasedIds) reconcilePurchases(data.purchasedIds);

      setJustBought(item.id);
      showToast("Покупка успешна", `«${item.name}» добавлен в инвентарь.`);
      setTimeout(() => setJustBought(null), 2200);
    } finally {
      setBuying(null);
    }
  }, [xp, purchasedIds, purchase, reconcileXP, reconcilePurchases, updateAvatar, equipTitle, equipFrame, showToast]);

  return (
    <AppLayout fluid>
      <PageTransition>

        {/* ── Sticky page header ─────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 md:px-10 py-3 bg-white/90 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-3">
            <h1 className="font-black text-text text-base leading-none">Магазин</h1>
            <span className="text-[11px] font-bold text-text-muted bg-gray-100 px-2 py-0.5 rounded-full">
              {shopItems.length} товаров
            </span>
          </div>
          {/* Compact XP balance */}
          <div className="flex items-center gap-2 bg-[#1A1A2E] rounded-xl px-3.5 py-2">
            <span className="text-accent text-base leading-none">⚡</span>
            <div>
              <p className="text-white/45 text-[9px] font-semibold uppercase tracking-widest leading-none">Баланс</p>
              <p className="text-white font-black text-sm leading-none">{xp} XP</p>
            </div>
          </div>
        </header>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="relative bg-[#1A1A2E] overflow-hidden">
          {/* Ambient blobs */}
          <div className="absolute -top-28 -right-28 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 left-8 w-72 h-72 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-8 left-1/2 w-48 h-48 bg-violet-500/8 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 px-6 md:px-10 pt-10 pb-10 md:pb-12">
            <div className="grid md:grid-cols-3 gap-8 items-start">

              {/* Left: headline + stats */}
              <div className="md:col-span-2 flex flex-col gap-6">
                <div>
                  <p className="text-accent text-[10px] font-black uppercase tracking-[0.22em] mb-3">
                    ✦ Магазин наград
                  </p>
                  <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.05] tracking-tight">
                    Трать XP<br />
                    <span className="text-accent">с умом</span>
                  </h2>
                  <p className="text-white/40 text-sm mt-3 max-w-sm leading-relaxed">
                    Аватары, титулы и рамки — кастомизируй профиль и&nbsp;выделись в&nbsp;рейтинге
                  </p>
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap gap-3">
                  <HeroStat emoji="⚡" label="Баланс" value={`${xp} XP`} />
                  <HeroStat emoji="🎒" label="Куплено" value={`${ownedCount} из ${shopItems.length}`} />
                  <HeroStat emoji="✅" label="Доступно купить" value={`${affordableCount} товаров`} />
                </div>

                {/* Collection progress bar */}
                <div className="max-w-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-white/35 text-[10px] font-semibold uppercase tracking-widest">Коллекция</p>
                    <p className="text-white/50 text-[10px] font-bold">{collectionPct}%</p>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${collectionPct}%` }}
                      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                      className="h-full bg-accent rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Right: featured items */}
              <div className="hidden md:flex flex-col gap-3">
                <p className="text-white/35 text-[10px] font-black uppercase tracking-[0.2em]">Популярные</p>
                {featuredItems.map((item) => {
                  const owned = purchasedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 bg-white/6 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-sm"
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0", item.color)}>
                        {item.preview}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-bold text-sm truncate leading-tight">{item.name}</p>
                        <p className="text-white/35 text-[11px]">{item.cost} XP</p>
                      </div>
                      <div className="shrink-0">
                        {owned ? (
                          <span className="text-accent text-sm font-black">✓</span>
                        ) : xp >= item.cost ? (
                          <span className="w-2 h-2 bg-accent rounded-full block" />
                        ) : (
                          <span className="text-white/20 text-xs">🔒</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Catalog ───────────────────────────────────────────────────────── */}
        <section className="px-6 md:px-10 py-6 bg-bg min-h-screen">

          {/* Filter row */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  aria-pressed={f === filter}
                  className={cn(
                    "shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold",
                    "transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    f === filter
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white text-text-muted border border-border hover:border-primary/30 hover:text-primary"
                  )}
                >
                  <span className="text-base leading-none">{FILTER_ICONS[f]}</span>
                  {CATEGORY_LABELS[f]}
                  <span className={cn(
                    "text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center leading-none",
                    f === filter ? "bg-white/20 text-white" : "bg-gray-100 text-text-muted"
                  )}>
                    {CATEGORY_COUNTS[f]}
                  </span>
                </button>
              ))}
            </div>

            <p className="text-sm text-text-muted font-medium shrink-0">
              {visible.length}&nbsp;
              {visible.length === 1 ? "товар" : visible.length < 5 ? "товара" : "товаров"}
            </p>
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-10">
            <AnimatePresence mode="popLayout">
              {visible.map((item, idx) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.18, delay: idx * 0.025 }}
                >
                  <ProductCard
                    item={item}
                    xp={xp}
                    purchasedIds={purchasedIds}
                    user={user}
                    buying={buying}
                    justBought={justBought}
                    errItem={errItem}
                    onBuy={handleBuy}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* XP how-to strip */}
          <div className="border border-border rounded-2xl p-5 md:p-6 bg-white mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 bg-accent/15 rounded-xl flex items-center justify-center text-xl shrink-0">⚡</div>
                <div>
                  <p className="font-black text-text text-sm leading-tight">Как заработать XP?</p>
                  <p className="text-[11px] text-text-muted mt-0.5">Выполняй задания и получай очки опыта</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5 md:border-l md:border-border md:pl-8">
                {[
                  { label: "Урок",        reward: "+10 XP" },
                  { label: "Тест",         reward: "+25 XP" },
                  { label: "Ежедневный стрик", reward: "+15 XP" },
                  { label: "Достижение",   reward: "+50 XP" },
                ].map(({ label, reward }) => (
                  <div key={label} className="flex items-center gap-1.5 bg-bg border border-border rounded-lg px-3 py-2">
                    <span className="text-[11px] font-semibold text-text-muted">{label}</span>
                    <span className="text-[11px] font-black text-accent">{reward}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </section>

      </PageTransition>
    </AppLayout>
  );
}
