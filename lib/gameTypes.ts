import * as THREE from "three";

export interface Enemy {
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
}

export interface Bullet {
  mesh: THREE.Mesh;
  vx: number;
  vz: number;
  life: number;
}

export interface Pickup {
  mesh: THREE.Mesh;
  effect: string;
  name: string;
  color: number;
  life: number;
}

export interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

export interface MultiProps {
  roomId: string;
  role: "host" | "guest";
  mode: "pvp" | "coop";
}
