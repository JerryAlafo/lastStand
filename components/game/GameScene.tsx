"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useGameStore } from "@/lib/gameStore";
import HUD from "./HUD";
import { Enemy, Bullet, Pickup, Particle, MultiProps } from "@/lib/gameTypes";
import { buildPlayerRig } from "@/lib/playerRig";
import { buildEnemyRig } from "@/lib/enemyRig";
import { buildArena } from "@/lib/arenaBuilder";
import { createSpawner } from "@/lib/gameSpawner";
import { getMapById } from "@/lib/maps";

const AR = 18; // Legacy constant - no longer used for boundary checks

export interface ChallengeObjectives {
  targetScore?: number;
  targetWaves?: number;
  targetKills?: number;
}

export interface ChallengeProps {
  challengeMode: true;
  mapId: string;
  challengeToken: string;
  seed: number;
  onGameOver: (score: number, wave: number, kills: number) => void;
  objectives?: ChallengeObjectives;
  username?: string;
}

export default function GameScene({ multiProps, challengeProps }: { multiProps?: MultiProps; challengeProps?: ChallengeProps }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<any>({});
  const store = useGameStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (multiProps) {
      const t = setTimeout(() => { storeRef.current.setRunning(true); }, 400);
      return () => clearTimeout(t);
    }
    if (challengeProps?.challengeMode) {
      storeRef.current.reset(challengeProps.mapId);
      storeRef.current.setRunning(true);
    }
  }, [mounted, multiProps, challengeProps]);

  useEffect(() => {
    if (!mounted || !mountRef.current) return;
    const el = mountRef.current;
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isWeak = isMobile || isIOS || isAndroid;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(isWeak ? 1 : Math.min(devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = false;
    renderer.setClearColor(0x050010);
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050010);
    scene.fog = new THREE.Fog(0x0a0020, isWeak ? 30 : 60, isWeak ? 80 : 220);

    // Build arena with the selected map
    const mapId = challengeProps?.mapId ?? storeRef.current.selectedMap;
    const mapConfig = getMapById(mapId);
    const {
      camera, ambientLight, sun, arenaLight, ring,
      clouds, cloudMat, spectatorList,
      skyNight, skyDay, fogNight, fogDay, ambNight, ambDay, DAY_CYCLE, arenaRadius,
    } = buildArena(scene, isWeak, mapId);
    camera.aspect = el.clientWidth / el.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setClearColor(fogNight.getHex());
    scene.background = new THREE.Color(fogNight.getHex());
    scene.fog.color.copy(fogNight);

    // Player rig
    const playerRig = buildPlayerRig();
    const playerMesh = playerRig.root;
    scene.add(playerMesh);
    const uarmL = playerRig.parts.uarmL as THREE.Group;
    const uarmR = playerRig.parts.uarmR as THREE.Group;
    const farmL = playerRig.parts.farmL as THREE.Group;
    const farmR = playerRig.parts.farmR as THREE.Group;
    const playerRingMesh = playerRig.parts.ring as THREE.Mesh;
    const ulegsData = playerRig.parts.ulegsData as unknown as { upper: THREE.Group; lower: THREE.Group; side: number }[];

    const { skin: skinMat, shirt: shirtMat, shorts: shortsMat, shoe: shoeMat } = playerRig.materials;
    function applyPlayerSettings() {
      try {
        const raw = localStorage.getItem("lsa_player_settings");
        if (!raw) return;
        const cfg = JSON.parse(raw) as { skin?: string; shirt?: string; shorts?: string; shoe?: string };
        if (cfg.skin)   skinMat.color.set(cfg.skin);
        if (cfg.shirt)  { shirtMat.color.set(cfg.shirt); shirtMat.emissive.set(cfg.shirt).multiplyScalar(0.12); }
        if (cfg.shorts) shortsMat.color.set(cfg.shorts);
        if (cfg.shoe)   shoeMat.color.set(cfg.shoe);
      } catch { /* ignore */ }
    }
    applyPlayerSettings();
    window.addEventListener("playerSettingsChanged", applyPlayerSettings);

    // Player aura
    const auraMat = new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.FrontSide });
    const auraGlow = new THREE.Mesh(new THREE.SphereGeometry(1.15, 10, 7), auraMat);
    auraGlow.position.y = 0.85; playerMesh.add(auraGlow);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const auraRing1 = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 6, 28), ringMat1);
    auraRing1.position.y = 0.85; playerMesh.add(auraRing1);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const auraRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.05, 6, 28), ringMat2);
    auraRing2.position.y = 0.85; auraRing2.rotation.x = Math.PI / 3; playerMesh.add(auraRing2);

    // Magnet field ring — floor-level torus showing attraction radius
    const magnetRingMat = new THREE.MeshBasicMaterial({ color: 0x7b2ff7, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const magnetRing = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.04, 6, 40), magnetRingMat);
    magnetRing.position.y = 0.05; magnetRing.rotation.x = Math.PI / 2;
    playerMesh.add(magnetRing);

    // Game objects
    const enemies: Enemy[] = [];
    const bullets: Bullet[] = [];
    const pickups: Pickup[] = [];
    const particles: Particle[] = [];
    const bulletGeo = new THREE.SphereGeometry(0.13, 6, 6);
    const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
    const pickupGeo = new THREE.OctahedronGeometry(0.38, 0);
    const puTypes = [
      { name: "Rapidfire",   color: 0xffdd00, effect: "rapidfire" },
      { name: "Multishot",   color: 0xff6600, effect: "multishot" },
      { name: "Escudo",      color: 0x4a90d9, effect: "shield" },
      { name: "Vida",        color: 0xe74c3c, effect: "heal" },
      { name: "Blast",       color: 0xcc44ff, effect: "blast" },
      { name: "Velocidade",  color: 0x2ecc71, effect: "speed" },
    ];

    const { spawnBullet, spawnEnemy, spawnPickup, spawnParticles, tickParticles } = createSpawner({
      scene, AR: arenaRadius, enemies, bullets, pickups, particles, bulletGeo, bulletMat, pickupGeo, puTypes, isMobile: isWeak,
      speedMult: mapConfig?.speedMult ?? 1,
      hpMult: mapConfig?.hpMult ?? 1,
    });

    // Input
    const keys: Record<string, boolean> = {};
    (window as unknown as Record<string, unknown>).__keys = keys;
    const isChallenge = !!challengeProps?.challengeMode;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape" && e.type === "keydown" && !isChallenge) {
        const s = storeRef.current;
        s.setRunning(!s.running);
        s.setWaveMessage(s.running ? "PAUSA" : "RETOMANDO...");
        e.preventDefault(); return;
      }
      if (e.code === "KeyE" && e.type === "keydown") { activateUlt(); e.preventDefault(); return; }
      keys[e.code] = e.type === "keydown";
      if (["KeyW","KeyS","KeyA","KeyD","KeyQ","Space"].includes(e.code)) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

    // State
    let frame = 0, animT = 0, moving = false;
    let dashVx = 0, dashVz = 0, dashFrames = 0;
    let playerDmgTimer = 0;
    const ULT_NEEDED = 15;
    let ultKills = 0, ultActive = false, ultTimer = 0;
    let ultShockwave: THREE.Mesh | null = null;

    function getNearestEnemy(): Enemy | null {
      let best: Enemy | null = null, bestD = 999;
      for (const e of enemies) {
        const dx = e.mesh.position.x - playerMesh.position.x;
        const dz = e.mesh.position.z - playerMesh.position.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < bestD) { bestD = d; best = e; }
      }
      return best;
    }

    function killEnemy(idx: number) {
      const e = enemies[idx];
      spawnParticles(e.mesh.position.clone(), e.col, 8);
      scene.remove(e.mesh);
      enemies.splice(idx, 1);
      const s = storeRef.current;
      s.addKill(); s.addScore(10 * s.wave); s.addXp(); s.enemyDied();
      const blastBonus = (s.upgrades as string[]).includes("blast_charge") ? 2 : 1;
      ultKills = Math.min(ULT_NEEDED, ultKills + blastBonus);
      if (Math.random() < 0.22) spawnPickup(e.mesh.position.x, e.mesh.position.z);
    }

    function activateUlt() {
      if (ultKills < ULT_NEEDED || ultActive || !storeRef.current.running) return;
      ultKills = 0; ultActive = true; ultTimer = 180;
      storeRef.current.addBlast();
      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        enemies[ei].hp -= 25;
        if (enemies[ei].hp <= 0) killEnemy(ei);
        else { enemies[ei].hitTimer = 20; spawnParticles(enemies[ei].mesh.position.clone(), 0xffdd00, 6); }
      }
      const swMat = new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      ultShockwave = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.35, 8, 40), swMat);
      ultShockwave.position.copy(playerMesh.position); ultShockwave.position.y = 0.5;
      ultShockwave.rotation.x = Math.PI / 2; scene.add(ultShockwave);
      for (let pi = 0; pi < 40; pi++) spawnParticles(playerMesh.position.clone(), pi % 2 === 0 ? 0xffdd00 : 0xffffff, 1);
    }
    (window as unknown as Record<string, unknown>).__activateUlt = activateUlt;

    // ── Multiplayer ───────────────────────────────────────────────────────────
    let remoteTargetX = 3, remoteTargetZ = 3, remoteTargetAngle = 0;
    let syncIntervalId: ReturnType<typeof setInterval> | null = null;
    let remoteRig: ReturnType<typeof buildPlayerRig> | null = null;
    let pendingRemoteHits = 0;
    let pendingEnemyHitsBuffer: Array<{ id: number; damage: number }> = [];
    let removePickupIdBuffer: number | null = null;
    let coopGameOverSent = false;
    let lastResetSignal = 0;
    let deathSynced = false;
    const pvp = { countdownActive: multiProps?.mode === "pvp" };
    if (multiProps?.mode === "pvp") (window as unknown as Record<string, unknown>).__pvpCountdown = 3;

    type RemoteEnemy = ReturnType<typeof buildEnemyRig> & { targetX: number; targetZ: number; animOffset: number };
    const remoteEnemyMap = new Map<number, RemoteEnemy>();
    const remotePickupMap = new Map<number, THREE.Mesh>();
    const remotePickupEffects = new Map<number, { effect: string; color: number; name: string }>();
    const remoteBulletMeshes: THREE.Mesh[] = [];
    const remoteBulletGeo = new THREE.SphereGeometry(0.13, 6, 6);
    const remoteBulletMat = new THREE.MeshBasicMaterial({ color: multiProps?.mode === "pvp" ? 0xff3322 : 0x55aaff, transparent: true, opacity: 0.9 });

    if (multiProps) {
      remoteRig = buildPlayerRig();
      remoteRig.materials.shirt.color.set(0x1a7a2e);
      remoteRig.materials.shirt.emissive.set(0x0a2a10);
      remoteRig.root.position.set(3, 0, 3);
      scene.add(remoteRig.root);

      syncIntervalId = setInterval(async () => {
        const s = storeRef.current;
        if (!s.running && !s.gameOver) return;
        try {
          const hitsToSend = s.gameOver ? 0 : pendingRemoteHits;
          if (!s.gameOver) pendingRemoteHits = 0;
          const body: Record<string, unknown> = {
            x: playerMesh.position.x, z: playerMesh.position.z,
            angle: playerMesh.rotation.y, hp: s.hp, score: s.score, kills: s.kills,
            hitRemote: hitsToSend,
          };
          if (multiProps!.role === "host" && multiProps!.mode === "coop") {
            body.enemies = enemies.map(e => ({ id: e.id, x: e.mesh.position.x, z: e.mesh.position.z, hp: e.hp, maxHp: e.maxHp, type: e.type }));
            body.pickups = pickups.map(p => ({ id: p.id, x: p.mesh.position.x, z: p.mesh.position.z, effect: p.effect, color: p.color }));
          }
          if (multiProps!.role === "host" && multiProps!.mode === "pvp") body.startCountdown = true;
          const w = window as unknown as Record<string, unknown>;
          if (w.__pvpRematchVote)   { body.rematchVote = true; delete w.__pvpRematchVote; }
          if (multiProps!.role === "host" && w.__pvpTriggerReset) { body.resetGame = true; delete w.__pvpTriggerReset; }
          if (multiProps!.role === "guest" && pendingEnemyHitsBuffer.length > 0) body.enemyHits = pendingEnemyHitsBuffer.splice(0);
          if (multiProps!.role === "guest" && removePickupIdBuffer !== null) { body.removePickupId = removePickupIdBuffer; removePickupIdBuffer = null; }
          if (multiProps!.mode === "coop" && s.gameOver && !coopGameOverSent) { coopGameOverSent = true; body.coopGameOver = true; }
          if (multiProps!.role === "host") body.hostBullets = bullets.map(b => ({ x: b.mesh.position.x, z: b.mesh.position.z, vx: b.vx, vz: b.vz }));
          else                            body.guestBullets = bullets.map(b => ({ x: b.mesh.position.x, z: b.mesh.position.z, vx: b.vx, vz: b.vz }));

          const res = await fetch(`/api/rooms/${multiProps!.roomId}/sync`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
          if (res.ok) {
            const data = (await res.json()) as {
              host?: { x: number; z: number; angle: number; hp: number; updatedAt: number } | null;
              guest?: { x: number; z: number; angle: number; hp: number; updatedAt: number } | null;
              incomingHits?: number;
              enemies?: Array<{ id: number; x: number; z: number; hp: number; maxHp: number; type: number }>;
              pickups?: Array<{ id: number; x: number; z: number; effect: string; color: number }>;
              pendingEnemyHits?: Array<{ id: number; damage: number }>;
              coopGameOver?: boolean;
              gameStartedAt?: number | null;
              rematch?: { host: boolean; guest: boolean };
              resetSignal?: number;
              hostBullets?: Array<{ x: number; z: number; vx: number; vz: number }>;
              guestBullets?: Array<{ x: number; z: number; vx: number; vz: number }>;
            };

            if (data.gameStartedAt) {
              const elapsed = Date.now() - data.gameStartedAt;
              const cdVal = Math.max(0, 3 - Math.floor(elapsed / 1000));
              if (cdVal > 0) { w.__pvpCountdown = cdVal; pvp.countdownActive = true; }
              else { delete w.__pvpCountdown; pvp.countdownActive = false; }
            }

            const sig = data.resetSignal ?? 0;
            if (sig > lastResetSignal) {
              lastResetSignal = sig; deathSynced = false; coopGameOverSent = false; pendingRemoteHits = 0; pendingEnemyHitsBuffer.length = 0;
              delete w.__pvpResult; delete w.__pvpRematch;
              for (const e of enemies) scene.remove(e.mesh); enemies.length = 0;
              for (const p of pickups) scene.remove(p.mesh); pickups.length = 0;
              remoteEnemyMap.forEach(re => scene.remove(re.group)); remoteEnemyMap.clear();
              remotePickupMap.forEach(m => scene.remove(m)); remotePickupMap.clear(); remotePickupEffects.clear();
              for (const rb of remoteBulletMeshes) scene.remove(rb); remoteBulletMeshes.length = 0;
              storeRef.current.reset(); return;
            }

            const other = multiProps!.role === "host" ? data.guest : data.host;
            if (other) {
              remoteTargetX = other.x; remoteTargetZ = other.z; remoteTargetAngle = other.angle;
              if (multiProps!.mode === "pvp" && other.hp === 0 && !deathSynced && !w.__pvpResult) {
                w.__pvpResult = "win"; pendingRemoteHits = 0;
                fetch("/api/pvp/win", { method: "POST" }).catch(() => undefined);
              }
              if (multiProps!.mode === "pvp" && Date.now() - other.updatedAt > 5000 && !w.__pvpResult) w.__pvpResult = "abandoned";
            }
            if (s.gameOver && !deathSynced) deathSynced = true;
            if (!s.gameOver && data.incomingHits && data.incomingHits > 0) {
              storeRef.current.damage(data.incomingHits);
              if (multiProps!.mode === "pvp" && useGameStore.getState().hp <= 0) w.__pvpResult = "loss";
            }

            // Co-op: sync enemies (guest side)
            if (multiProps!.mode === "coop" && multiProps!.role === "guest" && data.enemies) {
              const seenIds = new Set<number>();
              for (const es of data.enemies) {
                seenIds.add(es.id);
                if (remoteEnemyMap.has(es.id)) {
                  const re = remoteEnemyMap.get(es.id)!;
                  re.targetX = es.x; re.targetZ = es.z;
                  const ratio = Math.max(0, es.hp / es.maxHp);
                  re.hpFg.scale.x = ratio; re.hpFg.position.x = -(0.9 * (1 - ratio)) / 2;
                } else {
                  const rig = buildEnemyRig(es.type);
                  rig.group.position.set(es.x, 0, es.z); scene.add(rig.group);
                  remoteEnemyMap.set(es.id, { ...rig, targetX: es.x, targetZ: es.z, animOffset: Math.random() * Math.PI * 2 });
                }
              }
              for (const [id, re] of Array.from(remoteEnemyMap)) {
                if (!seenIds.has(id)) { spawnParticles(re.group.position.clone(), re.col, 5); scene.remove(re.group); remoteEnemyMap.delete(id); }
              }
            }

            // Co-op: sync pickups (guest side)
            if (multiProps!.mode === "coop" && multiProps!.role === "guest" && data.pickups) {
              const seenPids = new Set<number>();
              for (const ps of data.pickups) {
                seenPids.add(ps.id);
                if (!remotePickupMap.has(ps.id)) {
                  const pm = new THREE.Mesh(pickupGeo, new THREE.MeshStandardMaterial({ color: ps.color, emissive: new THREE.Color(ps.color).multiplyScalar(0.5), roughness: 0.3 }));
                  pm.position.set(ps.x, 0.5, ps.z); scene.add(pm); remotePickupMap.set(ps.id, pm);
                  remotePickupEffects.set(ps.id, puTypes.find(t => t.effect === ps.effect) ?? { name: ps.effect, color: ps.color, effect: ps.effect });
                }
              }
              for (const [pid, pmesh] of Array.from(remotePickupMap)) {
                if (!seenPids.has(pid)) { scene.remove(pmesh); remotePickupMap.delete(pid); remotePickupEffects.delete(pid); }
              }
            }

            // Co-op: host applies guest's enemy hits
            if (multiProps!.mode === "coop" && multiProps!.role === "host" && data.pendingEnemyHits?.length) {
              for (const hit of data.pendingEnemyHits) {
                const idx = enemies.findIndex(e => e.id === hit.id);
                if (idx >= 0) {
                  enemies[idx].hp -= hit.damage; enemies[idx].hitTimer = 7;
                  const ratio = Math.max(0, enemies[idx].hp / enemies[idx].maxHp);
                  enemies[idx].hpFg.scale.x = ratio; enemies[idx].hpFg.position.x = -(0.9 * (1 - ratio)) / 2;
                  if (enemies[idx].hp <= 0) killEnemy(idx);
                }
              }
            }

            if (multiProps!.mode === "coop" && data.coopGameOver && !storeRef.current.gameOver) storeRef.current.damage(100);

            // Remote bullets visual
            const rbd = (multiProps!.role === "host" ? data.guestBullets : data.hostBullets) ?? [];
            for (const rb of remoteBulletMeshes) scene.remove(rb); remoteBulletMeshes.length = 0;
            for (const rb of rbd) { const m = new THREE.Mesh(remoteBulletGeo, remoteBulletMat); m.position.set(rb.x, 0.65, rb.z); scene.add(m); remoteBulletMeshes.push(m); }

            if (data.rematch) w.__pvpRematch = data.rematch;
          } else {
            if (!s.gameOver) pendingRemoteHits += hitsToSend;
          }
        } catch { /* ignore */ }
      }, 200);
    }

    setTimeout(() => { storeRef.current.startWave(); }, 500);

    let raf: number;

    function animate() {
      raf = requestAnimationFrame(animate);

      // Day/night cycle
      {
        const t = Math.sin((frame / DAY_CYCLE) * Math.PI * 2) * 0.5 + 0.5;
        (scene.background as THREE.Color).copy(skyNight).lerp(skyDay, t);
        if (scene.fog) (scene.fog as THREE.Fog).color.copy(fogNight).lerp(fogDay, t);
        ambientLight.color.copy(ambNight).lerp(ambDay, t);
        ambientLight.intensity = 1.2 + t * 1.2;
        sun.intensity = t * 2.2;
        sun.color.setHSL(0.1 + t * 0.05, 0.6, 0.7 + t * 0.3);
        const ang = (frame / DAY_CYCLE) * Math.PI * 2;
        sun.position.set(Math.cos(ang) * 60, Math.sin(ang) * 60 + 10, Math.sin(ang * 0.5) * 30);
        const sm = (scene.userData as { starMat?: THREE.PointsMaterial }).starMat;
        if (sm) sm.opacity = Math.max(0, 1 - t * 2.5);
        if (cloudMat) {
          cloudMat.opacity = 0.18 + t * 0.62;
          cloudMat.color.setRGB(0.13 + t * 0.87, 0.20 + t * 0.80, 0.26 + t * 0.74);
        }
        for (const c of clouds) {
          c.angle += c.speed;
          c.group.position.set(Math.cos(c.angle) * c.radius, c.y + Math.sin(c.angle * 3) * 2, Math.sin(c.angle) * c.radius);
        }
        (window as unknown as Record<string, unknown>).__dayTime = t;
      }

      renderer.render(scene, camera);

      const s = storeRef.current;
      if (multiProps?.mode === "pvp" && s.gameOver) {
        const ww = window as unknown as Record<string, unknown>;
        if (!ww.__pvpResult) ww.__pvpResult = "loss";
      }

      // Challenge mode: check if all objectives are met
      if (challengeProps?.challengeMode && challengeProps.objectives && !s.gameOver) {
        const obj = challengeProps.objectives;
        const scoreMet = !obj.targetScore || s.score >= obj.targetScore;
        const wavesMet = !obj.targetWaves || s.wave >= obj.targetWaves;
        const killsMet = !obj.targetKills || s.kills >= obj.targetKills;
        if (scoreMet && wavesMet && killsMet) {
          s.setGameOver(true);
          s.setRunning(false);
        }
      }

      if (!s.running) return;

      frame++;
      s.tickEffects(); s.tickDash(); s.tickWave();

      // Remote player interpolation
      if (remoteRig) {
        remoteRig.root.position.x += (remoteTargetX - remoteRig.root.position.x) * 0.2;
        remoteRig.root.position.z += (remoteTargetZ - remoteRig.root.position.z) * 0.2;
        remoteRig.root.rotation.y += (remoteTargetAngle - remoteRig.root.rotation.y) * 0.2;
      }

      // Co-op guest: animate remote enemies
      if (multiProps?.mode === "coop" && multiProps.role === "guest") {
        remoteEnemyMap.forEach(re => {
          re.group.position.x += (re.targetX - re.group.position.x) * 0.2;
          re.group.position.z += (re.targetZ - re.group.position.z) * 0.2;
          re.group.rotation.y += 0.025;
          const esw = Math.sin(frame * 0.24 + re.animOffset) * 0.7;
          re.arms.forEach(a => { a.upper.rotation.x = esw * a.side * 0.35; a.lower.rotation.x = Math.max(0, -esw * a.side) * 0.4; });
          re.legs.forEach(leg => { const ls = leg.side === 1 ? esw : -esw; leg.upper.rotation.x = ls * 0.45; leg.lower.rotation.x = Math.max(0, -ls) * 0.4 + 0.05; });
        });
      }

      // Wave manager
      if (!multiProps || (multiProps.mode === "coop" && multiProps.role === "host")) {
        if (s.waveTimer === 0) {
          if (s.tickSpawn()) spawnEnemy(s.wave);
          if (s.spawnQueue === 0 && enemies.length === 0 && s.enemiesLeft <= 0) {
            // In challenge mode, check if objectives are met before moving to next wave
            if (challengeProps?.challengeMode && challengeProps.objectives) {
              const obj = challengeProps.objectives;
              const scoreMet = !obj.targetScore || s.score >= obj.targetScore;
              const wavesMet = !obj.targetWaves || s.wave >= obj.targetWaves;
              const killsMet = !obj.targetKills || s.kills >= obj.targetKills;
              if (scoreMet && wavesMet && killsMet) {
                s.setGameOver(true);
                s.setRunning(false);
              } else {
                s.nextWave();
                s.setRunning(true);
              }
            } else {
              s.nextWave();
            }
          }
        } else if (s.waveTimer === 1) { s.startWave(); }
      }

      // Player movement
      let mx = 0, mz = 0;
      if (!pvp.countdownActive) {
        if (keys["KeyW"] || keys["ArrowUp"])    mz = -1;
        if (keys["KeyS"] || keys["ArrowDown"])  mz =  1;
        if (keys["KeyA"] || keys["ArrowLeft"])  mx = -1;
        if (keys["KeyD"] || keys["ArrowRight"]) mx =  1;
      }
      moving = mx !== 0 || mz !== 0;
      if (keys["KeyQ"] && s.dashTimer === 0 && moving) {
        s.triggerDash(); dashVx = mx * 0.55; dashVz = mz * 0.55; dashFrames = 12;
        spawnParticles(playerMesh.position.clone(), 0x00ffff, 5);
      }
      let spd = s.playerSpeed;
      if (dashFrames > 0) { mx = dashVx; mz = dashVz; dashFrames--; spd = 1; }
      const md = Math.sqrt(mx * mx + mz * mz) || 1;
      playerMesh.position.x += (mx / md) * spd;
      playerMesh.position.z += (mz / md) * spd;
      const pd = Math.sqrt(playerMesh.position.x ** 2 + playerMesh.position.z ** 2);
      if (pd > arenaRadius - 1) { playerMesh.position.x = (playerMesh.position.x / pd) * (arenaRadius - 1); playerMesh.position.z = (playerMesh.position.z / pd) * (arenaRadius - 1); }
      if (moving) playerMesh.rotation.y = Math.atan2(mx, mz);
      playerMesh.position.y = Math.abs(Math.sin(frame * 0.18)) * (moving ? 0.05 : 0);

      // Player animation
      animT += moving ? 1.8 : 0.2;
      const sw = Math.sin(animT * 0.18) * (moving ? 1 : 0);
      uarmL.rotation.x = sw * 0.5; uarmR.rotation.x = -sw * 0.5;
      uarmL.rotation.z = 0.15; uarmR.rotation.z = -0.15;
      farmL.rotation.x = Math.max(0, sw) * 0.4 + 0.1;
      farmR.rotation.x = Math.max(0, -sw) * 0.4 + 0.1;
      for (const leg of ulegsData) {
        const ls = leg.side === 1 ? sw : -sw;
        leg.upper.rotation.x = ls * 0.45;
        leg.lower.rotation.x = Math.max(0, -ls) * 0.5 + 0.1;
      }
      playerRingMesh.rotation.z += 0.04;

      // Aura
      {
        const fx = s.activeEffects;
        const hasEffect = Object.values(fx).some(v => (v || 0) > 0);
        let auraCol = 0xffdd00;
        if ((fx.shield || 0) > 0) auraCol = 0x00ccff;
        else if ((fx.multishot || 0) > 0) auraCol = 0xff4400;
        else if ((fx.speed || 0) > 0) auraCol = 0x00ff88;
        const pulse = Math.sin(frame * 0.15) * 0.5 + 0.5;
        auraMat.opacity += ((hasEffect ? 0.22 + pulse * 0.18 : 0) - auraMat.opacity) * 0.1;
        auraMat.color.setHex(auraCol);
        ringMat1.opacity += ((hasEffect ? 0.55 + pulse * 0.45 : 0) - ringMat1.opacity) * 0.1;
        ringMat1.color.setHex(auraCol);
        ringMat2.opacity += ((hasEffect ? (0.55 + pulse * 0.45) * 0.65 : 0) - ringMat2.opacity) * 0.1;
        ringMat2.color.setHex(auraCol);
        auraRing1.rotation.z += 0.06; auraRing2.rotation.z -= 0.04; auraRing2.rotation.y += 0.05;
        auraGlow.scale.setScalar(1 + pulse * 0.12);

        // Magnet ring
        const hasMagnet = (s.upgrades as string[]).includes("magnet");
        const magnetPulse = Math.sin(frame * 0.07) * 0.5 + 0.5;
        magnetRingMat.opacity += ((hasMagnet ? 0.25 + magnetPulse * 0.2 : 0) - magnetRingMat.opacity) * 0.08;
        magnetRing.rotation.z += 0.015;
      }

      // Ultimate shockwave
      if (ultActive) {
        ultTimer--;
        if (ultShockwave) {
          const prog = 1 - ultTimer / 180;
          ultShockwave.scale.setScalar(1 + prog * 38);
          (ultShockwave.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.95 - prog * 2.2);
          if ((ultShockwave.material as THREE.MeshBasicMaterial).opacity <= 0) { scene.remove(ultShockwave); ultShockwave = null; }
        }
        if (ultTimer <= 0) ultActive = false;
      }
      (window as unknown as Record<string, unknown>).__ult = { charge: ultKills, needed: ULT_NEEDED, active: ultActive };

      // Auto fire
      s.tickFire();
      if (!pvp.countdownActive && s.fireTimer >= s.fireRate) {
        s.resetFire();
        let tx: number | null = null, tz: number | null = null;
        if (multiProps?.mode === "pvp" && remoteRig) {
          tx = remoteRig.root.position.x; tz = remoteRig.root.position.z;
        } else if (multiProps?.mode === "coop" && multiProps.role === "guest") {
          let bestD = 999;
          remoteEnemyMap.forEach(re => {
            const ddx = re.group.position.x - playerMesh.position.x;
            const ddz = re.group.position.z - playerMesh.position.z;
            const dd = Math.sqrt(ddx * ddx + ddz * ddz);
            if (dd < bestD) { bestD = dd; tx = re.group.position.x; tz = re.group.position.z; }
          });
        } else {
          const tgt = getNearestEnemy();
          if (tgt) { tx = tgt.mesh.position.x; tz = tgt.mesh.position.z; }
        }
        if (tx !== null && tz !== null) {
          if (s.shotCount === 1) {
            spawnBullet(playerMesh.position.x, playerMesh.position.z, tx, tz);
          } else {
            const base = Math.atan2(tx - playerMesh.position.x, tz - playerMesh.position.z);
            for (let i = 0; i < s.shotCount; i++) {
              const off = (i - (s.shotCount - 1) / 2) * 0.38;
              spawnBullet(playerMesh.position.x, playerMesh.position.z, playerMesh.position.x + Math.sin(base + off) * 10, playerMesh.position.z + Math.cos(base + off) * 10);
            }
          }
          uarmR.rotation.x = -0.6; uarmR.rotation.z = -0.22; farmR.rotation.x = 0.85;
        }
      }

      // ── Upgrade: damage aura ─────────────────────────────────────────────────
      {
        const upgrades = s.upgrades as string[];
        const auraCount = upgrades.filter((u: string) => u === "damage_aura").length;
        if (auraCount > 0 && frame % 20 === 0) {
          for (let ei = enemies.length - 1; ei >= 0; ei--) {
            const en = enemies[ei];
            const dx = en.mesh.position.x - playerMesh.position.x;
            const dz = en.mesh.position.z - playerMesh.position.z;
            if (dx * dx + dz * dz < 4.0) {
              en.hp -= auraCount;
              en.hitTimer = 8;
              if (en.hp <= 0) killEnemy(ei);
            }
          }
        }
      }

      // Bullets
      for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const b = bullets[bi];
        b.mesh.position.x += b.vx; b.mesh.position.z += b.vz; b.life--;
        let hit = false;
        if (multiProps?.mode === "pvp" && remoteRig) {
          const dx = b.mesh.position.x - remoteRig.root.position.x;
          const dz = b.mesh.position.z - remoteRig.root.position.z;
          if (dx * dx + dz * dz < 0.5625) { pendingRemoteHits++; spawnParticles(b.mesh.position.clone(), 0xff4444, 4); hit = true; }
        }
        if (!hit) {
          if (multiProps?.mode === "coop" && multiProps.role === "guest") {
            for (const [eid, re] of Array.from(remoteEnemyMap)) {
              const ddx = b.mesh.position.x - re.group.position.x;
              const ddz = b.mesh.position.z - re.group.position.z;
              if (ddx * ddx + ddz * ddz < 0.5625) { pendingEnemyHitsBuffer.push({ id: eid, damage: 1 }); spawnParticles(b.mesh.position.clone(), re.col, 4); hit = true; break; }
            }
          } else {
            const piercing = (s.upgrades as string[]).includes("piercing");
            const dmg = s.bulletDamage ?? 1;
            for (let ei = enemies.length - 1; ei >= 0; ei--) {
              const en = enemies[ei];
              const dx = b.mesh.position.x - en.mesh.position.x;
              const dz = b.mesh.position.z - en.mesh.position.z;
              if (dx * dx + dz * dz < 0.5625) {
                en.hp -= dmg; en.hitTimer = 7;
                const ratio = Math.max(0, en.hp / en.maxHp);
                en.hpFg.scale.x = ratio; en.hpFg.position.x = -(0.9 * (1 - ratio)) / 2;
                if (en.hp <= 0) killEnemy(ei);
                if (!piercing) { hit = true; break; }
              }
            }
          }
        }
        if (hit || b.life <= 0) { scene.remove(b.mesh); bullets.splice(bi, 1); }
      }

      // Enemies
      playerDmgTimer = Math.max(0, playerDmgTimer - 1);
      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        const en = enemies[ei];
        let targetX = playerMesh.position.x, targetZ = playerMesh.position.z;
        if (multiProps?.mode === "coop" && remoteRig) {
          const dlx = playerMesh.position.x - en.mesh.position.x;
          const dlz = playerMesh.position.z - en.mesh.position.z;
          const drx = remoteRig.root.position.x - en.mesh.position.x;
          const drz = remoteRig.root.position.z - en.mesh.position.z;
          if (drx * drx + drz * drz < dlx * dlx + dlz * dlz) { targetX = remoteRig.root.position.x; targetZ = remoteRig.root.position.z; }
        }
        const dx = targetX - en.mesh.position.x;
        const dz = targetZ - en.mesh.position.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        en.mesh.position.x += (dx / d) * en.speed; en.mesh.position.z += (dz / d) * en.speed;
        en.mesh.rotation.y += 0.025;
        const esw = Math.sin(frame * 0.24 + en.animOffset) * 0.7;
        en.arms.forEach(a => { a.upper.rotation.x = esw * a.side * 0.35; a.lower.rotation.x = Math.max(0, -esw * a.side) * 0.4; });
        en.legs.forEach(leg => { const ls = leg.side === 1 ? esw : -esw; leg.upper.rotation.x = ls * 0.45; leg.lower.rotation.x = Math.max(0, -ls) * 0.4 + 0.05; });
        if (en.hitTimer > 0) {
          en.hitTimer--;
          const bodyMesh = en.mesh.children[0] as THREE.Mesh;
          if (bodyMesh?.material) (bodyMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = en.hitTimer > 0 ? 2 : 0.25;
        }
        if (d < 1.0 && playerDmgTimer === 0) {
          playerDmgTimer = 25; storeRef.current.damage(1);
          spawnParticles(playerMesh.position.clone(), 0xe74c3c, 5);
          camera.position.x += (Math.random() - 0.5) * 0.6; camera.position.z += (Math.random() - 0.5) * 0.6;
        }
        en.hpFg.parent?.lookAt(camera.position);
      }

      // Co-op guest: contact from remote enemies
      if (multiProps?.mode === "coop" && multiProps.role === "guest" && playerDmgTimer === 0) {
        remoteEnemyMap.forEach(re => {
          if (playerDmgTimer > 0) return;
          const edx = re.group.position.x - playerMesh.position.x;
          const edz = re.group.position.z - playerMesh.position.z;
          if (edx * edx + edz * edz < 1.0) {
            playerDmgTimer = 25; storeRef.current.damage(1);
            spawnParticles(playerMesh.position.clone(), 0xe74c3c, 5);
            camera.position.x += (Math.random() - 0.5) * 0.6; camera.position.z += (Math.random() - 0.5) * 0.6;
          }
        });
      }

      // Pickups
      const hasMagnetUpgrade = (s.upgrades as string[]).includes("magnet");
      for (let pi = pickups.length - 1; pi >= 0; pi--) {
        const pk = pickups[pi];
        pk.mesh.rotation.y += 0.06;
        pk.mesh.position.y = 0.5 + Math.sin(frame * 0.06 + pi) * 0.18;
        pk.life--;
        const dx = pk.mesh.position.x - playerMesh.position.x;
        const dz = pk.mesh.position.z - playerMesh.position.z;
        const d2 = dx * dx + dz * dz;
        const collectRange = hasMagnetUpgrade ? 2.25 : 1.21; // 1.5² or 1.1²

        // Magnet: attract pickups within radius 2.5 toward player
        if (hasMagnetUpgrade && d2 < 6.25 && d2 > collectRange) {
          const d = Math.sqrt(d2);
          const spd = 0.04 + (1 - d / 2.5) * 0.06;
          pk.mesh.position.x -= (dx / d) * spd;
          pk.mesh.position.z -= (dz / d) * spd;
        }

        if (d2 < collectRange) {
          storeRef.current.applyEffect(pk.effect as any); spawnParticles(pk.mesh.position.clone(), pk.color, 8);
          storeRef.current.setWaveMessage(pk.name + "!"); scene.remove(pk.mesh); pickups.splice(pi, 1); continue;
        }
        if (pk.life <= 0) { scene.remove(pk.mesh); pickups.splice(pi, 1); }
      }

      // Co-op guest: remote pickups
      if (multiProps?.mode === "coop" && multiProps.role === "guest") {
        let rpi = 0;
        for (const [pid, pmesh] of Array.from(remotePickupMap)) {
          pmesh.rotation.y += 0.06;
          pmesh.position.y = 0.5 + Math.sin(frame * 0.06 + rpi) * 0.18;
          const pdx = pmesh.position.x - playerMesh.position.x;
          const pdz = pmesh.position.z - playerMesh.position.z;
          if (pdx * pdx + pdz * pdz < 1.21) {
            const pu = remotePickupEffects.get(pid);
            if (pu) { storeRef.current.applyEffect(pu.effect as any); spawnParticles(pmesh.position.clone(), pu.color, 8); storeRef.current.setWaveMessage(pu.name + "!"); }
            scene.remove(pmesh); remotePickupMap.delete(pid); remotePickupEffects.delete(pid); removePickupIdBuffer = pid;
          }
          rpi++;
        }
      }

      // Particles — handled by InstancedMesh in spawner
      tickParticles();

      // Spectators — update every 3 frames to save CPU
      if (frame % 3 === 0) {
        for (const sp of spectatorList) {
          const cheer = Math.sin(frame * 0.32 + sp.animOffset) * 0.22 + 0.18;
          sp.armL.rotation.z = 0.4 + cheer; sp.armR.rotation.z = -0.4 - cheer;
          sp.group.position.y = 0.14 + Math.sin(frame * 0.18 + sp.animOffset) * 0.015;
        }
      }

      arenaLight.intensity = 1.2 + Math.sin(frame * 0.04) * 0.4;
      (ring.material as THREE.MeshBasicMaterial).color.setHSL((frame * 0.002) % 1, 1, 0.5);

      // Camera follow
      camera.position.x += (playerMesh.position.x * 0.28 - camera.position.x) * 0.06;
      camera.position.z += (playerMesh.position.z * 0.28 + 12 - camera.position.z) * 0.06;
      camera.position.y = 14;
      camera.lookAt(playerMesh.position.x, 0, playerMesh.position.z);
    }

    animate();
    stateRef.current = { scene, enemies, bullets, pickups, particles };

    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener("resize", onResize);

    const onGameRestart = () => {
      for (const e of enemies) scene.remove(e.mesh); enemies.length = 0;
      for (const p of pickups) scene.remove(p.mesh); pickups.length = 0;
      for (const b of bullets) scene.remove(b.mesh); bullets.length = 0;
      if (ultShockwave) { scene.remove(ultShockwave); ultShockwave = null; }
      playerMesh.position.set(0, 0, 0);
      playerDmgTimer = 0;
      frame = 0;
      ultKills = 0;
      ultActive = false;
      ultTimer = 0;
      dashFrames = 0;
      deathSynced = false;
      coopGameOverSent = false;
      pendingRemoteHits = 0;
      pendingEnemyHitsBuffer.length = 0;
    };
    window.addEventListener("gameRestart", onGameRestart);

    return () => {
      cancelAnimationFrame(raf);
      if (syncIntervalId) clearInterval(syncIntervalId);
      if (remoteRig) scene.remove(remoteRig.root);
      remoteEnemyMap.forEach(re => scene.remove(re.group)); remoteEnemyMap.clear();
      remotePickupMap.forEach(m => scene.remove(m)); remotePickupMap.clear(); remotePickupEffects.clear();
      for (const rb of remoteBulletMeshes) scene.remove(rb); remoteBulletMeshes.length = 0;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("playerSettingsChanged", applyPlayerSettings);
      window.removeEventListener("gameRestart", onGameRestart);
      const w = window as unknown as Record<string, unknown>;
      delete w.__keys; delete w.__activateUlt; delete w.__pvpCountdown;
      delete w.__pvpResult; delete w.__pvpRematch; delete w.__pvpRematchVote; delete w.__pvpTriggerReset;
      renderer.dispose();
      el.removeChild(renderer.domElement);
      if (multiProps) fetch(`/api/rooms/${multiProps.roomId}/close`, { method: "POST" }).catch(() => undefined);
    };
  }, [mounted]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
      <HUD multiProps={multiProps} challengeProps={challengeProps} challengeUsername={challengeProps?.username} />
    </div>
  );
}
