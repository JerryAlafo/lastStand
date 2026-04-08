export interface UpgradeCard {
  id: string;
  name: string;
  desc: string;
  icon: string;
  rarity: "comum" | "raro" | "épico";
}

export const UPGRADE_POOL: UpgradeCard[] = [
  { id: "fire_bullets",   name: "Balas de Fogo",        icon: "🔥", rarity: "raro",  desc: "+1 dano por bala" },
  { id: "regen",          name: "Regeneração",           icon: "💚", rarity: "comum", desc: "+1 HP a cada 3 waves" },
  { id: "damage_aura",    name: "Aura de Dano",          icon: "💜", rarity: "épico", desc: "Inimigos próximos perdem HP" },
  { id: "triple_shot",    name: "Tiro Extra",            icon: "🔱", rarity: "raro",  desc: "+1 bala permanente" },
  { id: "speed_boost",    name: "Impulso",               icon: "💨", rarity: "comum", desc: "+0.02 velocidade permanente" },
  { id: "fast_reload",    name: "Carregamento Rápido",   icon: "⚡", rarity: "raro",  desc: "-4 frames entre disparos" },
  { id: "piercing",       name: "Bala Perfurante",       icon: "🎯", rarity: "épico", desc: "Balas atravessam inimigos" },
  { id: "magnet",         name: "Ímã de Power-ups",      icon: "🧲", rarity: "comum", desc: "Raio de coleta duplicado" },
  { id: "double_xp",      name: "XP Duplo",              icon: "⭐", rarity: "raro",  desc: "Dobra XP por morte" },
  { id: "blast_charge",   name: "Fúria Rápida",          icon: "🌀", rarity: "raro",  desc: "Ult carrega 2x mais rápido" },
  { id: "shield_start",   name: "Escudo Inicial",        icon: "🛡️", rarity: "épico", desc: "Começa cada wave com escudo" },
];

const RARITY_WEIGHTS = { comum: 5, raro: 3, épico: 1 };

export function pickUpgradeOptions(used: string[]): UpgradeCard[] {
  const counts = used.reduce<Record<string, number>>((a, id) => { a[id] = (a[id] ?? 0) + 1; return a; }, {});
  const available = UPGRADE_POOL.filter(c => (counts[c.id] ?? 0) < 3);
  if (available.length === 0) return [];
  if (available.length < 3) return available.slice(0, 3);

  const picked: UpgradeCard[] = [];
  const pool = [...available];
  while (picked.length < 3 && pool.length > 0) {
    const totalWeight = pool.reduce((s, c) => s + RARITY_WEIGHTS[c.rarity], 0);
    let r = Math.random() * totalWeight;
    for (let i = 0; i < pool.length; i++) {
      r -= RARITY_WEIGHTS[pool[i].rarity];
      if (r <= 0) { picked.push(pool.splice(i, 1)[0]); break; }
    }
  }
  return picked;
}

export function hasUpgradesAvailable(used: string[]): boolean {
  const counts = used.reduce<Record<string, number>>((a, id) => { a[id] = (a[id] ?? 0) + 1; return a; }, {});
  return UPGRADE_POOL.some(c => (counts[c.id] ?? 0) < 3);
}

export const RARITY_COLORS: Record<string, string> = {
  comum: "rgba(255,255,255,0.15)",
  raro:  "rgba(0,120,255,0.25)",
  épico: "rgba(140,0,255,0.3)",
};
export const RARITY_BORDER: Record<string, string> = {
  comum: "rgba(255,255,255,0.2)",
  raro:  "rgba(80,160,255,0.5)",
  épico: "rgba(180,80,255,0.6)",
};
