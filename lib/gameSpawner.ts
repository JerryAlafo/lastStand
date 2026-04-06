import * as THREE from "three";
import { Enemy, Bullet, Pickup, Particle } from "@/lib/gameTypes";
import { buildEnemyRig } from "@/lib/enemyRig";

const BULLET_SPEED = 0.35;
const MAX_PARTICLES = 160;

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
  isMobile: boolean;
  speedMult?: number;
  hpMult?: number;
}

export function createSpawner(ctx: SpawnerCtx) {
  let enemyIdCounter = 0;
  let pickupIdCounter = 0;
  const { scene, AR, enemies, bullets, pickups, particles, bulletGeo, bulletMat, pickupGeo, puTypes, isMobile, speedMult = 1, hpMult = 1 } = ctx;

  // ── Instanced particle system ────────────────────────────────────────────
  const _dummy = new THREE.Object3D();
  const _col   = new THREE.Color();
  const _particleGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
  const _particleMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, vertexColors: true });
  const _instanced = new THREE.InstancedMesh(_particleGeo, _particleMat, MAX_PARTICLES);
  _instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  _instanced.count = 0;
  // hide all instances initially
  _dummy.scale.setScalar(0);
  _dummy.updateMatrix();
  for (let i = 0; i < MAX_PARTICLES; i++) _instanced.setMatrixAt(i, _dummy.matrix);
  scene.add(_instanced);

  // call once per frame from the game loop to animate particles
  function tickParticles() {
    if (particles.length === 0 && _instanced.count === 0) return;
    let active = 0;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= 0.055;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx; p.y += p.vy; p.z += p.vz; p.vy -= 0.007;
      if (active < MAX_PARTICLES) {
        _dummy.position.set(p.x, p.y, p.z);
        _dummy.scale.setScalar(p.life * 0.9 + 0.1);
        _dummy.updateMatrix();
        _instanced.setMatrixAt(active, _dummy.matrix);
        _col.setRGB(p.r * p.life, p.g * p.life, p.b * p.life);
        _instanced.setColorAt(active, _col);
        active++;
      }
    }
    _instanced.count = active;
    if (active > 0) {
      _instanced.instanceMatrix.needsUpdate = true;
      if (_instanced.instanceColor) _instanced.instanceColor.needsUpdate = true;
    }
  }

  function spawnBullet(x: number, z: number, tx: number, tz: number) {
    const b = new THREE.Mesh(bulletGeo, bulletMat); // shared material — no clone
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
    const spd = (0.04 + wave * 0.005) * (isTank ? 0.6 : 1) * speedMult;
    const finalHp = Math.floor((isTank ? hp * 2.5 : hp) * hpMult);
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
    const c = new THREE.Color(col);
    const n = isMobile ? Math.ceil(count * 0.5) : count; // half on mobile
    for (let i = 0; i < n; i++) {
      if (particles.length >= MAX_PARTICLES) break;
      particles.push({
        x: pos.x, y: pos.y, z: pos.z,
        vx: (Math.random() - 0.5) * 0.2,
        vy: Math.random() * 0.18 + 0.05,
        vz: (Math.random() - 0.5) * 0.2,
        life: 1,
        r: c.r, g: c.g, b: c.b,
      });
    }
  }

  return { spawnBullet, spawnEnemy, spawnPickup, spawnParticles, tickParticles };
}
