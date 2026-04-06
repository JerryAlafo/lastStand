export interface MapConfig {
  id: string;
  name: string;
  namePt: string;
  descPt: string;
  seed: number;
  arenaRadius: number;
  floorColor: number;
  wallColor: number;
  ringColor: number;
  fogColor: number;
  skyColor: number;
  accentColor: string;
  difficulty: "normal" | "hard" | "extreme";
  speedMult: number;
  hpMult: number;
  spawnMult: number;
}

export const MAPS: MapConfig[] = [
  {
    id: "arena", name: "arena", namePt: "Arena Clássica",
    descPt: "A arena original. O campo de batalha onde tudo começou.",
    seed: 42, arenaRadius: 18, floorColor: 0x302f55, wallColor: 0x12112b,
    ringColor: 0xff2244, fogColor: 0x0a0020, skyColor: 0x050010,
    accentColor: "#7b2ff7", difficulty: "normal", speedMult: 1.0, hpMult: 1.0, spawnMult: 1.0,
  },
  {
    id: "desert", name: "desert", namePt: "Deserto Ardente",
    descPt: "Areia escaldante e tempestades de areia. Inimigos mais rápidos.",
    seed: 101, arenaRadius: 16, floorColor: 0xc2956b, wallColor: 0x8b6914,
    ringColor: 0xff6600, fogColor: 0xd4a055, skyColor: 0x1a0e05,
    accentColor: "#ff6600", difficulty: "hard", speedMult: 1.15, hpMult: 1.0, spawnMult: 1.1,
  },
  {
    id: "ice", name: "ice", namePt: "Fortaleza de Gelo",
    descPt: "Superfícies geladas e ventos cortantes. Inimigos mais resistentes.",
    seed: 202, arenaRadius: 17, floorColor: 0x88aacc, wallColor: 0x445566,
    ringColor: 0x00ccff, fogColor: 0x99bbdd, skyColor: 0x0a0e14,
    accentColor: "#00ccff", difficulty: "hard", speedMult: 0.9, hpMult: 1.3, spawnMult: 0.85,
  },
  {
    id: "void", name: "void", namePt: "Vazio Sombrio",
    descPt: "Escuridão total. Sem espectadores, sem piedade.",
    seed: 303, arenaRadius: 14, floorColor: 0x111118, wallColor: 0x0a0a10,
    ringColor: 0xaa00ff, fogColor: 0x080010, skyColor: 0x000005,
    accentColor: "#aa00ff", difficulty: "extreme", speedMult: 1.1, hpMult: 1.4, spawnMult: 1.2,
  },
  {
    id: "jungle", name: "jungle", namePt: "Selva Perdida",
    descPt: "Vegetação densa e ruínas antigas. Equilíbrio perfeito.",
    seed: 404, arenaRadius: 19, floorColor: 0x2d5a1e, wallColor: 0x1a3a10,
    ringColor: 0x00ff44, fogColor: 0x1a3a10, skyColor: 0x050a05,
    accentColor: "#00ff44", difficulty: "normal", speedMult: 1.05, hpMult: 1.1, spawnMult: 1.0,
  },
  {
    id: "lava", name: "lava", namePt: "Caldeirão de Lava",
    descPt: "Magma borbulhante. Apenas para os mais corajosos!",
    seed: 505, arenaRadius: 15, floorColor: 0x4a1a0a, wallColor: 0x2a0a0a,
    ringColor: 0xff2200, fogColor: 0x2a0800, skyColor: 0x0a0000,
    accentColor: "#ff2200", difficulty: "extreme", speedMult: 1.2, hpMult: 1.5, spawnMult: 1.15,
  },
];

export function getMapById(id: string): MapConfig | undefined {
  return MAPS.find(m => m.id === id);
}

export function getDifficultyColor(d: string): string {
  switch (d) {
    case "normal": return "#2ecc71";
    case "hard": return "#f39c12";
    case "extreme": return "#e74c3c";
    default: return "#888";
  }
}

export function getDifficultyLabel(d: string): string {
  switch (d) {
    case "normal": return "Normal";
    case "hard": return "Difícil";
    case "extreme": return "Extremo";
    default: return d;
  }
}
