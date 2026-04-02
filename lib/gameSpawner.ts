import * as THREE from "three";
import { Enemy, Bullet, Pickup, Particle } from "@/lib/gameTypes";
import { buildEnemyRig } from "@/lib/enemyRig";

const BULLET_SPEED = 0.35;

interface SpawnerCtx {
  scene: THREE.Scene;
  AR: number;
  enemies: Enemy[];
  bullets: Bullet[];
  pickups: Pickup[];
  particles: Particle[];
  bulletGeo: THREE.SphereGeometry;
  bulletMat: THREE.MeshBasicMaterial;
  pickupGeo: THREE.OctahedronGeometry;
  puTypes: Array<{ name: string; color: number; effect: string }>;
}

export function createSpawner(ctx: SpawnerCtx) {
  let enemyIdCounter = 0;
  let pickupIdCounter = 0;
  const { scene, AR, enemies, bullets, pickups, particles, bulletGeo, bulletMat, pickupGeo, puTypes } = ctx;

  function spawnBullet(x: number, z: number, tx: number, tz: number) {
    const b = new THREE.Mesh(bulletGeo, bulletMat.clone());
    b.position.set(x, 0.65, z);
    const dx = tx - x, dz = tz - z;
    const d = Math.sqrt(dx * dx + dz * dz) || 1;
    scene.add(b);
    bullets.push({ mesh: b, vx: (dx / d) * BULLET_SPEED, vz: (dz / d) * BULLET_SPEED, life: 80 });
  }

  function spawnEnemy(wave: number) {
    const hp = 1 + Math.floor(wave * 0.9);
    const isTank = Math.random() < 0.15;
    const type = isTank ? 2 : Math.floor(Math.random() * 3);
    const spd = (0.04 + wave * 0.005) * (isTank ? 0.6 : 1);
    const finalHp = isTank ? Math.floor(hp * 2.5) : hp;
    const { group, hpFg, col, arms, legs } = buildEnemyRig(type);
    const angle = Math.random() * Math.PI * 2;
    group.position.set(Math.cos(angle) * (AR - 1), 0, Math.sin(angle) * (AR - 1));
    scene.add(group);
    enemies.push({
      id: ++enemyIdCounter,
      mesh: group, hp: finalHp, maxHp: finalHp, speed: spd,
      type, col, hpFg, hitTimer: 0, dmgTimer: 0, arms, legs,
      animOffset: Math.random() * Math.PI * 2,
    });
  }

  function spawnPickup(x: number, z: number) {
    const t = puTypes[Math.floor(Math.random() * puTypes.length)];
    const m = new THREE.Mesh(
      pickupGeo,
      new THREE.MeshStandardMaterial({ color: t.color, emissive: new THREE.Color(t.color).multiplyScalar(0.5), roughness: 0.3 }),
    );
    m.position.set(x, 0.5, z);
    scene.add(m);
    pickups.push({ id: ++pickupIdCounter, mesh: m, effect: t.effect, name: t.name, color: t.color, life: 400 });
  }

  function spawnParticles(pos: THREE.Vector3, col: number, count: number) {
    for (let i = 0; i < count; i++) {
      const pm = new THREE.Mesh(new THREE.SphereGeometry(0.1, 4, 4), new THREE.MeshBasicMaterial({ color: col }));
      pm.position.copy(pos);
      scene.add(pm);
      particles.push({
        mesh: pm,
        vx: (Math.random() - 0.5) * 0.2,
        vy: Math.random() * 0.18 + 0.05,
        vz: (Math.random() - 0.5) * 0.2,
        life: 1,
      });
    }
  }

  return { spawnBullet, spawnEnemy, spawnPickup, spawnParticles };
}
