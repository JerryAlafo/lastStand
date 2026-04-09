import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getRoomByToken } from "@/lib/db";
import {
  getRoomLive, setPlayerLive, addPendingHits, consumePendingHits,
  type PlayerState, type EnemySync, type PickupSync, type BulletSync,
} from "@/lib/roomState";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const live = getRoomLive(params.id);
  return NextResponse.json({ host: live.host, guest: live.guest });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.userId as string | undefined;
  const username = token?.username as string | undefined;
  if (!username || !userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const room = await getRoomByToken(params.id);
  if (!room) return NextResponse.json({ error: "Sala não encontrada." }, { status: 404 });

  const role = room.host_id === userId || room.host === username ? "host" 
    : room.guest_id === userId || room.guest === username ? "guest" : null;
  if (!role) return NextResponse.json({ error: "Não és membro desta sala." }, { status: 403 });

  const body = (await req.json()) as Partial<PlayerState> & {
    hitRemote?: number;
    // Co-op: host sends enemy + pickup positions each cycle
    enemies?: EnemySync[];
    pickups?: PickupSync[];
    // PVP: host signals countdown start
    startCountdown?: boolean;
    // Either player votes to rematch
    rematchVote?: boolean;
    // Host signals a full game reset (resets both clients)
    resetGame?: boolean;
    // Co-op: guest queues enemy hits for host to apply
    enemyHits?: Array<{ id: number; damage: number }>;
    // Guest signals pickup removal (they picked it up)
    removePickupId?: number;
    // Co-op game over — either player can signal
    coopGameOver?: boolean;
    // Bullet positions for remote rendering
    hostBullets?: BulletSync[];
    guestBullets?: BulletSync[];
  };

  const state: PlayerState = {
    x: Number(body.x ?? 0),
    z: Number(body.z ?? 0),
    angle: Number(body.angle ?? 0),
    hp: Number(body.hp ?? 0),
    score: Number(body.score ?? 0),
    kills: Number(body.kills ?? 0),
    updatedAt: Date.now(),
  };

  setPlayerLive(params.id, role, state);

  const live = getRoomLive(params.id);

  // Host-only: update enemy and pickup positions (co-op)
  if (role === "host" && Array.isArray(body.enemies)) {
    live.enemies = body.enemies;
  }
  if (role === "host" && Array.isArray(body.pickups)) {
    live.pickups = body.pickups;
  }

  // Host-only: start the synced countdown clock
  if (role === "host" && body.startCountdown && live.gameStartedAt === null) {
    live.gameStartedAt = Date.now();
  }

  // Either player: rematch vote
  if (body.rematchVote) {
    live.rematch[role] = true;
  }

  // Host-only: full reset — clear everything so both clients restart
  if (role === "host" && body.resetGame) {
    live.enemies = [];
    live.pickups = [];
    live.gameStartedAt = null;
    live.rematch = { host: false, guest: false };
    live.resetSignal = (live.resetSignal ?? 0) + 1;
    live.pendingHits = { host: 0, guest: 0 };
    live.pendingEnemyHits = [];
    live.coopGameOver = false;
    live.hostBullets = [];
    live.guestBullets = [];
  }

  // Guest-only: queue enemy hits for host to apply (cap to prevent abuse)
  if (role === "guest" && Array.isArray(body.enemyHits) && body.enemyHits.length > 0) {
    live.pendingEnemyHits.push(...body.enemyHits.slice(0, 20));
  }

  // Guest signals pickup was collected — remove from host's list
  if (role === "guest" && typeof body.removePickupId === "number") {
    live.pickups = live.pickups.filter(p => p.id !== body.removePickupId);
  }

  // Either player: co-op game over signal
  if (body.coopGameOver) {
    live.coopGameOver = true;
  }

  // Bullet positions for remote rendering
  if (role === "host" && Array.isArray(body.hostBullets)) {
    live.hostBullets = body.hostBullets.slice(0, 30);
  }
  if (role === "guest" && Array.isArray(body.guestBullets)) {
    live.guestBullets = body.guestBullets.slice(0, 30);
  }

  // If the sender hit the remote player, queue damage for them
  const hitRemote = Math.min(Number(body.hitRemote ?? 0), 10); // cap per sync to prevent abuse
  if (hitRemote > 0) {
    const remoteRole = role === "host" ? "guest" : "host";
    addPendingHits(params.id, remoteRole, hitRemote);
  }

  // Return live states + any pending hits queued for me by the opponent
  const incomingHits = consumePendingHits(params.id, role);

  // Host: consume and return guest's queued enemy hits
  let pendingEnemyHitsForHost: Array<{ id: number; damage: number }> = [];
  if (role === "host") {
    pendingEnemyHitsForHost = [...live.pendingEnemyHits];
    live.pendingEnemyHits = [];
  }

  return NextResponse.json({
    host: live.host,
    guest: live.guest,
    incomingHits,
    enemies: live.enemies,
    pickups: live.pickups,
    pendingEnemyHits: pendingEnemyHitsForHost,
    coopGameOver: live.coopGameOver,
    gameStartedAt: live.gameStartedAt,
    rematch: live.rematch,
    resetSignal: live.resetSignal ?? 0,
    // Return the OTHER player's bullets for visual rendering
    hostBullets: role === "guest" ? live.hostBullets : [],
    guestBullets: role === "host" ? live.guestBullets : [],
  });
}
