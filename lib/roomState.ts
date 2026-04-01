// In-memory live game state for active multiplayer rooms.
// NOT persisted — only valid for the current server instance lifetime.
// Acceptable for a game session; lobby state is persisted via fileStore.

export interface PlayerState {
  x: number;
  z: number;
  angle: number;
  hp: number;
  score: number;
  kills: number;
  updatedAt: number; // Date.now()
}

/** Serialisable enemy snapshot (host-authoritative, used in co-op). */
export interface EnemySync {
  id: number;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  type: number;
}

/** Serialisable pickup snapshot (host-authoritative). */
export interface PickupSync {
  id: number;
  x: number;
  z: number;
  effect: string;
  color: number;
}

/** A bullet position snapshot for remote-visibility rendering. */
export interface BulletSync {
  x: number;
  z: number;
  vx: number;
  vz: number;
}

export interface RoomLive {
  host: PlayerState | null;
  guest: PlayerState | null;
  // Pending hits queued by the attacker, consumed by the victim on next sync
  pendingHits: { host: number; guest: number };
  // Co-op: host broadcasts enemy positions each sync cycle
  enemies: EnemySync[];
  // Co-op: host broadcasts pickup positions
  pickups: PickupSync[];
  // Co-op: guest queues enemy hits for host to apply
  pendingEnemyHits: Array<{ id: number; damage: number }>;
  // Either player can signal co-op game over (partner died)
  coopGameOver: boolean;
  // PVP: Unix ms when the countdown started (set by host on first sync)
  gameStartedAt: number | null;
  // Rematch voting — both players must agree to restart
  rematch: { host: boolean; guest: boolean };
  // Incremented by host to signal a full game reset to both clients
  resetSignal: number;
  // Bullet positions from each player so the remote can render them visually
  hostBullets: BulletSync[];
  guestBullets: BulletSync[];
}

function getLiveMap(): Record<string, RoomLive> {
  const g = globalThis as unknown as { __roomLiveState?: Record<string, RoomLive> };
  if (!g.__roomLiveState) g.__roomLiveState = {};
  return g.__roomLiveState;
}

export function getRoomLive(id: string): RoomLive {
  const map = getLiveMap();
  if (!map[id]) map[id] = {
    host: null,
    guest: null,
    pendingHits: { host: 0, guest: 0 },
    enemies: [],
    pickups: [],
    pendingEnemyHits: [],
    coopGameOver: false,
    gameStartedAt: null,
    rematch: { host: false, guest: false },
    resetSignal: 0,
    hostBullets: [],
    guestBullets: [],
  };
  return map[id];
}

/** Add hits queued for a target role (called by the attacker). */
export function addPendingHits(id: string, target: "host" | "guest", hits: number): void {
  const room = getRoomLive(id);
  room.pendingHits[target] = (room.pendingHits[target] ?? 0) + hits;
}

/** Consume and return all pending hits for a role (called by the victim on sync). */
export function consumePendingHits(id: string, role: "host" | "guest"): number {
  const room = getRoomLive(id);
  const hits = room.pendingHits[role] ?? 0;
  room.pendingHits[role] = 0;
  return hits;
}

export function setPlayerLive(id: string, role: "host" | "guest", state: PlayerState): void {
  const room = getRoomLive(id);
  room[role] = state;
}

export function clearRoomLive(id: string): void {
  const map = getLiveMap();
  delete map[id];
}
