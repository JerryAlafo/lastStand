import * as THREE from "three";

export interface Enemy {
  id: number;
  mesh: THREE.Group;
  hp: number;
  maxHp: number;
  speed: number;
  type: number;
  col: number;
  hpFg: THREE.Mesh;
  hitTimer: number;
  dmgTimer: number;
  arms: Array<{ upper: THREE.Group; lower: THREE.Group; side: number }>;
  legs: Array<{ upper: THREE.Group; lower: THREE.Group; side: number }>;
  animOffset: number;
  isBoss?: boolean;
  bossId?: string;
}

export interface Bullet {
  mesh: THREE.Mesh;
  vx: number;
  vz: number;
  life: number;
}

export interface Pickup {
  id: number;
  mesh: THREE.Mesh;
  effect: string;
  name: string;
  color: number;
  life: number;
}

export interface Particle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number;
  r: number; g: number; b: number;
}

export interface MultiProps {
  roomId: string;
  role: "host" | "guest";
  mode: "pvp" | "coop";
}
