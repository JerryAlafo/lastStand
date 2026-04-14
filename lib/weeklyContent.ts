export type WeeklyEventId =
  | "fire_only"
  | "fast_enemies"
  | "no_powerups"
  | "infinite_wave";

export type WeeklyEventConfig = {
  id: WeeklyEventId;
  name: string;
  description: string;
  durationHours: number;
  image: string;
  modifiers: {
    fireBulletsOnly?: boolean;
    enemySpeedMult?: number;
    disablePowerups?: boolean;
    infiniteWave?: boolean;
  };
};

const WEEKLY_EVENTS: WeeklyEventConfig[] = [
  {
    id: "fire_only",
    name: "Chuva de Fogo",
    description: "Só balas de fogo e dano extra.",
    durationHours: 48,
    image: "chuva de fogo",
    modifiers: { fireBulletsOnly: true },
  },
  {
    id: "fast_enemies",
    name: "Fúria Veloz",
    description: "Inimigos 2x mais rápidos.",
    durationHours: 48,
    image: "furia veloz",
    modifiers: { enemySpeedMult: 2 },
  },
  {
    id: "no_powerups",
    name: "Sem Ajuda",
    description: "Sem power-ups de pickup durante a run.",
    durationHours: 48,
    image: "sem ajuda",
    modifiers: { disablePowerups: true },
  },
  {
    id: "infinite_wave",
    name: "Mar Infinito",
    description: "Sem pausa para upgrades entre waves.",
    durationHours: 48,
    image: "desafio semanal",
    modifiers: { infiniteWave: true },
  },
];

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

function weekIndex(date: Date) {
  const jan1 = new Date(date.getFullYear(), 0, 1);
  return Math.floor((startOfWeek(date).getTime() - startOfWeek(jan1).getTime()) / (7 * 24 * 60 * 60 * 1000));
}

export function getCurrentWeeklyEvent(now = new Date()) {
  const weekStart = startOfWeek(now);
  const weekNo = Math.abs(weekIndex(now));
  const event = WEEKLY_EVENTS[weekNo % WEEKLY_EVENTS.length];
  const eventStart = new Date(weekStart);
  eventStart.setDate(eventStart.getDate() + 5); // Saturday
  eventStart.setHours(0, 0, 0, 0);
  const eventEnd = new Date(eventStart.getTime() + event.durationHours * 60 * 60 * 1000);
  const isActive = now >= eventStart && now < eventEnd;

  return {
    event,
    isActive,
    weekStart: weekStart.toISOString().slice(0, 10),
    eventStart: eventStart.toISOString(),
    eventEnd: eventEnd.toISOString(),
  };
}

export function getWeeklyBoss(now = new Date()) {
  const bosses = [
    { id: "colossus_umbra", name: "Colosso Umbra", hpMult: 8, speedMult: 0.8 },
    { id: "hydra_ferrea", name: "Hydra Férrea", hpMult: 7, speedMult: 1.0 },
    { id: "vortex_rei", name: "Rei do Vórtice", hpMult: 6, speedMult: 1.2 },
  ];
  const idx = Math.abs(weekIndex(now)) % bosses.length;
  return bosses[idx];
}
