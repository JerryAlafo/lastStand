"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useGameStore } from "@/lib/gameStore";
import HUD from "./HUD";

// ---- CONSTANTS ----
const AR = 18;
const BULLET_SPEED = 0.35;
const SKIN_TONES = [0xc68642, 0x8d5524, 0xf1c27d, 0xe0ac69, 0xd49560];

// ---- TYPES ----
interface Enemy {
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

interface Bullet {
  mesh: THREE.Mesh;
  vx: number;
  vz: number;
  life: number;
}

interface Pickup {
  mesh: THREE.Mesh;
  effect: string;
  name: string;
  color: number;
  life: number;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

// ---- PLAYER RIG ----
function buildPlayerRig(): {
  root: THREE.Group;
  parts: Record<string, THREE.Object3D>;
  materials: { skin: THREE.MeshStandardMaterial; shirt: THREE.MeshStandardMaterial; shorts: THREE.MeshStandardMaterial; shoe: THREE.MeshStandardMaterial };
} {
  const root = new THREE.Group();
  const skin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
  const skinM = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.8 });
  const shirtM = new THREE.MeshStandardMaterial({
    color: 0x4a90d9,
    roughness: 0.6,
    emissive: new THREE.Color(0x0a1a3a),
  });
  const shortsM = new THREE.MeshStandardMaterial({
    color: 0x1a2255,
    roughness: 0.8,
  });
  const shoeM = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.9,
  });
  const whiteM = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
  });

  // Torso
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.18, 0.6, 8),
    shirtM,
  );
  torso.position.y = 0.9;
  torso.castShadow = true;
  root.add(torso);

  // Neck
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.08, 0.14, 8),
    skinM,
  );
  neck.position.y = 1.28;
  root.add(neck);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), skinM);
  head.position.y = 1.56;
  head.castShadow = true;
  root.add(head);

  // Eyes
  for (let s of [-1, 1]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 7, 7),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    eye.position.set(s * 0.1, 1.6, 0.2);
    root.add(eye);
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.026, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x111111 }),
    );
    pupil.position.set(s * 0.1, 1.6, 0.224);
    root.add(pupil);
  }

  // Hair
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.245, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.44),
    new THREE.MeshStandardMaterial({ color: 0x1a0a00, roughness: 1 }),
  );
  hair.position.y = 1.56;
  root.add(hair);

  // Visor
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.09, 0.14),
    new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.85,
    }),
  );
  visor.position.set(0, 1.62, 0.21);
  root.add(visor);

  // Shoulders
  for (let s of [-1, 1]) {
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), shirtM);
    sh.position.set(s * 0.34, 1.1, 0);
    root.add(sh);
  }

  // Upper arms
  const uarmL = new THREE.Group();
  uarmL.position.set(-0.34, 1.0, 0);
  root.add(uarmL);
  const uarmR = new THREE.Group();
  uarmR.position.set(0.34, 1.0, 0);
  root.add(uarmR);
  const uaGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.35, 7);
  uarmL.add(Object.assign(new THREE.Mesh(uaGeo, shirtM), { castShadow: true }));
  uarmR.add(Object.assign(new THREE.Mesh(uaGeo, shirtM), { castShadow: true }));

  // Forearms
  const farmL = new THREE.Group();
  farmL.position.y = -0.22;
  uarmL.add(farmL);
  const farmR = new THREE.Group();
  farmR.position.y = -0.22;
  uarmR.add(farmR);
  const faGeo = new THREE.CylinderGeometry(0.065, 0.058, 0.3, 7);
  const fmL = new THREE.Mesh(faGeo, skinM);
  fmL.position.y = -0.16;
  farmL.add(fmL);
  const fmR = new THREE.Mesh(faGeo, skinM);
  fmR.position.y = -0.16;
  farmR.add(fmR);
  const hGeo = new THREE.SphereGeometry(0.07, 7, 7);
  const hL = new THREE.Mesh(hGeo, skinM);
  hL.position.y = -0.31;
  farmL.add(hL);
  const hR = new THREE.Mesh(hGeo, skinM);
  hR.position.y = -0.31;
  farmR.add(hR);

  // Weapon held by player
  const weapon = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 0.42),
    new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.35,
      metalness: 0.8,
    }),
  );
  weapon.position.set(0.15, -0.32, 0.15);
  weapon.rotation.set(-0.4, 0, 0);
  farmR.add(weapon);

  // Shorts
  const shorts = new THREE.Mesh(
    new THREE.CylinderGeometry(0.21, 0.2, 0.38, 8),
    shortsM,
  );
  shorts.position.y = 0.57;
  root.add(shorts);
  const stripe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.212, 0.202, 0.05, 8),
    whiteM,
  );
  stripe.position.y = 0.59;
  root.add(stripe);

  // Legs
  const ulegs: { upper: THREE.Group; lower: THREE.Group; side: number }[] = [];
  for (const s of [-1, 1] as const) {
    const ug = new THREE.Group();
    ug.position.set(s * 0.13, 0.36, 0);
    const um = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.08, 0.4, 7),
      skinM,
    );
    um.castShadow = true;
    ug.add(um);

    const lg = new THREE.Group();
    lg.position.y = -0.24;
    const lm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.06, 0.36, 7),
      skinM,
    );
    lm.position.y = -0.19;
    lm.castShadow = true;
    lg.add(lm);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.3), shoeM);
    shoe.position.set(0, -0.38, 0.04);
    lg.add(shoe);
    const sole = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.04, 0.31),
      whiteM,
    );
    sole.position.set(0, -0.43, 0.04);
    lg.add(sole);
    const sock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.07, 0.13, 7),
      whiteM,
    );
    sock.position.y = -0.28;
    lg.add(sock);

    ug.add(lg);
    root.add(ug);
    ulegs.push({ upper: ug, lower: lg, side: s });
  }

  // Glow ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.045, 6, 22),
    new THREE.MeshBasicMaterial({ color: 0x00ffff }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.02;
  root.add(ring);

  return {
    root,
    parts: { uarmL, uarmR, farmL, farmR, ring, ulegsData: ulegs as any },
    materials: { skin: skinM, shirt: shirtM, shorts: shortsM, shoe: shoeM },
  };
}

// ---- ENEMY RIG ----
function buildEnemyRig(type: number): {
  group: THREE.Group;
  hpFg: THREE.Mesh;
  col: number;
  arms: Array<{ upper: THREE.Group; lower: THREE.Group; side: number }>;
  legs: Array<{ upper: THREE.Group; lower: THREE.Group; side: number }>;
} {
  const g = new THREE.Group();
  const configs = [
    { col: 0xe74c3c, scale: 1.0, speed: 1.0 },
    { col: 0xff8800, scale: 0.85, speed: 1.4 },
    { col: 0xaa22ff, scale: 1.4, speed: 0.65 },
  ];
  const cfg = configs[type % 3];
  const col = cfg.col;
  const sc = cfg.scale;

  const skinM = new THREE.MeshStandardMaterial({
    color: 0xd4a276,
    roughness: 0.8,
  });
  const bodyM = new THREE.MeshStandardMaterial({
    color: col,
    roughness: 0.6,
    emissive: new THREE.Color(col).multiplyScalar(0.25),
  });
  const darkM = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.9,
  });

  // Torso
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2 * sc, 0.17 * sc, 0.55 * sc, 8),
    bodyM,
  );
  torso.position.y = 0.85 * sc;
  torso.castShadow = true;
  g.add(torso);

  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.22 * sc, 10, 10),
    skinM,
  );
  head.position.y = 1.38 * sc;
  head.castShadow = true;
  g.add(head);

  // Eyes
  for (let s of [-1, 1]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.055 * sc, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffff00 }),
    );
    eye.position.set(s * 0.09 * sc, 1.42 * sc, 0.18 * sc);
    g.add(eye);
  }

  // Arms
  const arms: Array<{ upper: THREE.Group; lower: THREE.Group; side: number }> =
    [];
  for (let s of [-1, 1]) {
    const armUpper = new THREE.Group();
    armUpper.position.set(s * 0.3 * sc, 1.0 * sc, 0);
    g.add(armUpper);

    const shoulder = new THREE.Mesh(
      new THREE.SphereGeometry(0.11 * sc, 7, 7),
      bodyM,
    );
    shoulder.position.set(0, 0, 0);
    armUpper.add(shoulder);

    const armLower = new THREE.Group();
    armLower.position.set(0, -0.18 * sc, 0);
    armUpper.add(armLower);

    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07 * sc, 0.06 * sc, 0.55 * sc, 6),
      bodyM,
    );
    arm.position.set(0, -0.22 * sc, 0);
    armLower.add(arm);

    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.07 * sc, 6, 6),
      skinM,
    );
    hand.position.set(0, -0.35 * sc, 0);
    armLower.add(hand);

    arms.push({ upper: armUpper, lower: armLower, side: s });
  }

  // Shorts
  const shorts = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19 * sc, 0.18 * sc, 0.34 * sc, 8),
    darkM,
  );
  shorts.position.y = 0.54 * sc;
  g.add(shorts);

  // Legs
  const legs: Array<{ upper: THREE.Group; lower: THREE.Group; side: number }> =
    [];
  for (let s of [-1, 1]) {
    const upperLeg = new THREE.Group();
    upperLeg.position.set(s * 0.12 * sc, 0.34 * sc, 0);
    g.add(upperLeg);

    const thigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085 * sc, 0.075 * sc, 0.36 * sc, 7),
      skinM,
    );
    thigh.castShadow = true;
    thigh.position.y = -0.18 * sc;
    upperLeg.add(thigh);

    const lowerLeg = new THREE.Group();
    lowerLeg.position.set(0, -0.36 * sc, 0);
    upperLeg.add(lowerLeg);

    const shin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065 * sc, 0.055 * sc, 0.33 * sc, 7),
      skinM,
    );
    shin.position.y = -0.16 * sc;
    lowerLeg.add(shin);

    const shoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.14 * sc, 0.09 * sc, 0.26 * sc),
      darkM,
    );
    shoe.position.set(0, -0.25 * sc, 0.03 * sc);
    lowerLeg.add(shoe);

    legs.push({ upper: upperLeg, lower: lowerLeg, side: s });
  }

  // HP bar
  const hpBg = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.09, 0.04),
    new THREE.MeshBasicMaterial({ color: 0x330000 }),
  );
  hpBg.position.set(0, 1.85 * sc, 0);
  g.add(hpBg);
  const hpFg = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.09, 0.05),
    new THREE.MeshBasicMaterial({ color: 0xff2244 }),
  );
  hpFg.position.set(0, 1.85 * sc, 0.02);
  g.add(hpFg);

  return { group: g, hpFg, col, arms, legs };
}

// ---- MAIN COMPONENT ----
export default function GameScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<any>({});
  const store = useGameStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mountRef.current) return;
    const el = mountRef.current;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x050010);
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050010);
    scene.fog = new THREE.Fog(0x0a0020, 60, 220);

    // Starfield
    {
      const starCount = 1800;
      const positions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 160 + Math.random() * 20;
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = Math.abs(r * Math.cos(phi));
        positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.55, sizeAttenuation: true, transparent: true, opacity: 1 });
      scene.add(new THREE.Points(starGeo, starMat));
    // expose starMat for day/night cycle
    Object.assign(scene.userData, { starMat });
    }

    // Clouds — one shared material, colour + opacity lerped by day/night
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0x223344,  // starts dark (night)
      transparent: true,
      opacity: 0.18,    // always slightly visible
      roughness: 1,
      metalness: 0,
      depthWrite: false,
    });
    interface Cloud { group: THREE.Group; speed: number; angle: number; radius: number; y: number }
    const clouds: Cloud[] = [];
    // Close layer: just above arena, clearly in camera FOV
    for (let ci = 0; ci < 7; ci++) {
      const group = new THREE.Group();
      const angle = (ci / 7) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 20 + Math.random() * 16;
      const y = 13 + Math.random() * 6;
      group.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      const blobCount = 4 + Math.floor(Math.random() * 3);
      for (let bi = 0; bi < blobCount; bi++) {
        const size = 2.5 + Math.random() * 3;
        const blob = new THREE.Mesh(new THREE.SphereGeometry(size, 7, 5), cloudMat);
        blob.position.set((bi - blobCount / 2) * 3.5 + Math.random() * 1.5, Math.random() * 2 - 1, Math.random() * 2 - 1);
        group.add(blob);
      }
      scene.add(group);
      clouds.push({ group, speed: 0.00018 + Math.random() * 0.00012, angle, radius, y });
    }
    // Far layer: background depth
    for (let ci = 0; ci < 6; ci++) {
      const group = new THREE.Group();
      const angle = (ci / 6) * Math.PI * 2 + 0.2;
      const radius = 38 + Math.random() * 22;
      const y = 20 + Math.random() * 10;
      group.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      const blobCount = 5 + Math.floor(Math.random() * 3);
      for (let bi = 0; bi < blobCount; bi++) {
        const size = 4 + Math.random() * 4.5;
        const blob = new THREE.Mesh(new THREE.SphereGeometry(size, 7, 5), cloudMat);
        blob.position.set((bi - blobCount / 2) * 5 + Math.random() * 2, Math.random() * 3 - 1.5, Math.random() * 2 - 1);
        group.add(blob);
      }
      scene.add(group);
      clouds.push({ group, speed: 0.00008 + Math.random() * 0.00008, angle, radius, y });
    }

    const camera = new THREE.PerspectiveCamera(
      60,
      el.clientWidth / el.clientHeight,
      0.1,
      200,
    );
    camera.position.set(0, 14, 14);
    camera.lookAt(0, 0, 0);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x2233aa, 1.2);
    scene.add(ambientLight);
    const sun = new THREE.DirectionalLight(0xaabbff, 0.6);
    sun.position.set(5, 15, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);

    // Day/night cycle colours
    const skyNight = new THREE.Color(0x050010);
    const skyDay   = new THREE.Color(0xadd8e6);
    const fogNight = new THREE.Color(0x0a0020);
    const fogDay   = new THREE.Color(0xadd8e6);
    const ambNight = new THREE.Color(0x2233aa);
    const ambDay   = new THREE.Color(0xfff5d0);
    // full cycle = 7200 frames (~2 min at 60 fps: day→dusk→night→dawn→day)
    const DAY_CYCLE = 7200;
    const arenaLight = new THREE.PointLight(0xff6677, 2.5, 50);
    arenaLight.position.set(0, 8, 0);
    scene.add(arenaLight);
    const blueLight = new THREE.PointLight(0x6699ff, 1.5, 45);
    blueLight.position.set(0, 4, 0);
    scene.add(blueLight);

    // Floor
    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(AR, AR, 0.4, 64),
      new THREE.MeshStandardMaterial({ color: 0x302f55, roughness: 0.95 }),
    );
    floor.position.y = -0.2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(AR * 2, 40, 0x553366, 0x221122);
    grid.position.y = 0.02;
    scene.add(grid);

    const centerField = new THREE.Mesh(
      new THREE.RingGeometry(0.6, AR - 1.3, 96),
      new THREE.MeshStandardMaterial({
        color: 0x101428,
        roughness: 0.95,
        metalness: 0.05,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      }),
    );
    centerField.rotation.x = -Math.PI / 2;
    centerField.position.y = -0.145;
    scene.add(centerField);

    const ringFloor = new THREE.Mesh(
      new THREE.RingGeometry(1.5, 3.2, 96),
      new THREE.MeshStandardMaterial({
        color: 0x44527b,
        roughness: 0.9,
        metalness: 0.15,
        side: THREE.DoubleSide,
      }),
    );
    ringFloor.rotation.x = -Math.PI / 2;
    ringFloor.position.y = -0.14;
    scene.add(ringFloor);

    // Arena boundary walls (scenario)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x12112b,
      roughness: 0.85,
      emissive: new THREE.Color(0x180a40),
      emissiveIntensity: 0.25,
      side: THREE.DoubleSide,
    });
    const wallDepth = 0.4;
    const wallHeight = 2.5;
    const wallLength = AR * 2 + 1;
    const walls = [
      { x: 0, y: wallHeight / 2, z: -AR - wallDepth / 2, rx: 0, ry: 0, rz: 0 },
      { x: 0, y: wallHeight / 2, z: AR + wallDepth / 2, rx: 0, ry: 0, rz: 0 },
      {
        x: -AR - wallDepth / 2,
        y: wallHeight / 2,
        z: 0,
        rx: 0,
        ry: Math.PI / 2,
        rz: 0,
      },
      {
        x: AR + wallDepth / 2,
        y: wallHeight / 2,
        z: 0,
        rx: 0,
        ry: Math.PI / 2,
        rz: 0,
      },
    ];
    for (const w of walls) {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(wallLength, wallHeight, wallDepth),
        wallMat,
      );
      wall.position.set(w.x, w.y, w.z);
      wall.rotation.set(w.rx, w.ry, w.rz);
      wall.receiveShadow = true;
      scene.add(wall);
    }

    // Boundary ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(AR, 0.18, 8, 64),
      new THREE.MeshBasicMaterial({ color: 0xff2244 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.05;
    scene.add(ring);

    // Boundary pillars
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 2.5, 0.3),
        new THREE.MeshBasicMaterial({
          color: 0xff1133,
          transparent: true,
          opacity: 0.5,
        }),
      );
      pillar.position.set(Math.cos(a) * AR, 1.2, Math.sin(a) * AR);
      scene.add(pillar);
    }

    // Realistic crowd in bleachers
    const crowdShirtColors = [
      0xcc1122, 0x1133cc, 0xffaa00, 0x228833, 0x9922aa, 0x1f8bff, 0xa763d3,
    ];
    const crowdSkin = [0xf0c080, 0xe0a56c, 0xd49a5b, 0xc48947];

    const spectators: Array<{
      group: THREE.Group;
      armL: THREE.Mesh;
      armR: THREE.Mesh;
      animOffset: number;
    }> = [];

    const buildSpectator = (color: number, skin: number) => {
      const g = new THREE.Group();

      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.14, 0.54, 10),
        new THREE.MeshStandardMaterial({ color, roughness: 0.65 }),
      );
      body.position.y = 0.32;
      body.castShadow = true;
      g.add(body);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 10, 10),
        new THREE.MeshStandardMaterial({ color: skin, roughness: 0.85 }),
      );
      head.position.y = 0.78;
      head.castShadow = true;
      g.add(head);

      const armL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8),
        new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.7 }),
      );
      armL.position.set(-0.16, 0.47, 0);
      armL.rotation.z = 0.4;
      g.add(armL);

      const armR = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8),
        new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.7 }),
      );
      armR.position.set(0.16, 0.47, 0);
      armR.rotation.z = -0.4;
      g.add(armR);

      const legL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.25, 7),
        new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 }),
      );
      legL.position.set(-0.06, 0.0, 0);
      g.add(legL);

      const legR = legL.clone();
      legR.position.x = 0.06;
      g.add(legR);

      return { g, armL, armR };
    };

    const bleacherMat = new THREE.MeshStandardMaterial({
      color: 0x2b2b3f,
      roughness: 0.9,
      metalness: 0.12,
    });

    const bleachers = new THREE.Group();
    for (let side = -1; side <= 1; side += 2) {
      for (let row = 0; row < 7; row++) {
        const y = 0.1 + row * 0.26;
        const depth = 0.48;
        const width = AR * 2 + 3;

        const bench = new THREE.Mesh(
          new THREE.BoxGeometry(width, 0.09, depth),
          bleacherMat,
        );
        bench.position.set(0, y, side * (AR + 0.7 + row * 0.34));
        bleachers.add(bench);

        // Spectators row
        for (let i = -10; i <= 10; i++) {
          if (Math.random() > 0.78) continue;
          const shirt =
            crowdShirtColors[
              Math.floor(Math.random() * crowdShirtColors.length)
            ];
          const skin = crowdSkin[Math.floor(Math.random() * crowdSkin.length)];
          const { g, armL, armR } = buildSpectator(shirt, skin);
          g.position.set(
            i * 0.42,
            y + 0.18,
            side * (AR + 0.7 + row * 0.34 + side * 0.28),
          );
          g.rotation.y = -side * 0.12;
          spectators.push({
            group: g,
            armL,
            armR,
            animOffset: Math.random() * Math.PI * 2,
          });
          bleachers.add(g);
        }
      }
    }

    scene.add(bleachers);

    const bannerWallMat = new THREE.MeshStandardMaterial({
      color: 0x121b34,
      roughness: 0.8,
      metalness: 0.2,
    });

    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(AR * 1.8, 2.2, 0.25),
        bannerWallMat,
      );
      wall.position.set(
        Math.cos(a) * (AR + 1.4),
        1.6,
        Math.sin(a) * (AR + 1.4),
      );
      wall.rotation.y = a + Math.PI / 2;
      scene.add(wall);

      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(4.4, 1.5),
        new THREE.MeshStandardMaterial({
          color: 0x66ccff,
          emissive: 0x66ccff,
          emissiveIntensity: 0.35,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide,
        }),
      );
      screen.position.set(
        Math.cos(a) * (AR + 1.35),
        1.95,
        Math.sin(a) * (AR + 1.35),
      );
      screen.rotation.y = a + Math.PI / 2;
      scene.add(screen);
    }

    // Stadium lighting arrays
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const light = new THREE.SpotLight(
        0xffffff,
        1.6,
        80,
        Math.PI / 6,
        0.35,
        1,
      );
      light.position.set(
        Math.cos(angle) * (AR + 3),
        8.3,
        Math.sin(angle) * (AR + 3),
      );
      light.target.position.set(0, 0, 0);
      scene.add(light);
      scene.add(light.target);
    }

    const spectatorList = spectators;

    // Stadium focal lights
    const cornerLightColors = [0xffa500, 0xffffff];
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const light = new THREE.SpotLight(
        cornerLightColors[i % 2],
        2.2,
        60,
        0.5,
        0.5,
        1,
      );
      light.position.set(
        Math.cos(angle) * (AR + 9),
        10,
        Math.sin(angle) * (AR + 9),
      );
      light.target.position.set(0, 0, 0);
      scene.add(light);
      scene.add(light.target);
    }

    // Player rig
    const playerRig = buildPlayerRig();
    const playerMesh = playerRig.root;
    scene.add(playerMesh);
    const uarmL = playerRig.parts.uarmL as THREE.Group;
    const uarmR = playerRig.parts.uarmR as THREE.Group;
    const farmL = playerRig.parts.farmL as THREE.Group;
    const farmR = playerRig.parts.farmR as THREE.Group;
    const playerRingMesh = playerRig.parts.ring as THREE.Mesh;
    const ulegsData = playerRig.parts.ulegsData as unknown as {
      upper: THREE.Group;
      lower: THREE.Group;
      side: number;
    }[];

    // Player appearance settings (from localStorage via Settings panel)
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

    // Player aura (Super Saiyan style — visible when power-up active)
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xffdd00, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.FrontSide,
    });
    const auraGlow = new THREE.Mesh(new THREE.SphereGeometry(1.15, 10, 7), auraMat);
    auraGlow.position.y = 0.85;
    playerMesh.add(auraGlow);

    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0xffdd00, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const auraRing1 = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 6, 28), ringMat1);
    auraRing1.position.y = 0.85;
    playerMesh.add(auraRing1);

    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xffdd00, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const auraRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.05, 6, 28), ringMat2);
    auraRing2.position.y = 0.85;
    auraRing2.rotation.x = Math.PI / 3;
    playerMesh.add(auraRing2);

    // Game objects
    const enemies: Enemy[] = [];
    const bullets: Bullet[] = [];
    const pickups: Pickup[] = [];
    const particles: Particle[] = [];

    const bulletGeo = new THREE.SphereGeometry(0.13, 6, 6);
    const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
    const pickupGeo = new THREE.OctahedronGeometry(0.38, 0);
    const puTypes = [
      { name: "⚡ rapidfire", color: 0xffdd00, effect: "rapidfire" },
      { name: "💥 multishot", color: 0xff6600, effect: "multishot" },
      { name: "🛡 shield", color: 0x4a90d9, effect: "shield" },
      { name: "❤ vida", color: 0xe74c3c, effect: "heal" },
      { name: "🌀 blast", color: 0xcc44ff, effect: "blast" },
      { name: "⬆ speed", color: 0x2ecc71, effect: "speed" },
    ];

    // Input
    const keys: Record<string, boolean> = {};
    (window as unknown as Record<string, unknown>).__keys = keys;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape" && e.type === "keydown") {
        const s = storeRef.current;
        s.setRunning(!s.running);
        s.setWaveMessage(s.running ? "PAUSA" : "RETOMANDO...");
        e.preventDefault();
        return;
      }

      if (e.code === "KeyE" && e.type === "keydown") {
        activateUlt();
        e.preventDefault();
        return;
      }
      keys[e.code] = e.type === "keydown";
      if (["KeyW", "KeyS", "KeyA", "KeyD", "KeyQ", "Space"].includes(e.code))
        e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

    // State
    let frame = 0;
    let animT = 0;
    let moving = false;
    let dashVx = 0,
      dashVz = 0,
      dashFrames = 0;
    let playerDmgTimer = 0;

    // Ultimate ability state
    const ULT_NEEDED = 15;
    let ultKills = 0;
    let ultActive = false;
    let ultTimer = 0;
    let ultShockwave: THREE.Mesh | null = null;

    function spawnBullet(x: number, z: number, tx: number, tz: number) {
      const b = new THREE.Mesh(bulletGeo, bulletMat.clone());
      b.position.set(x, 0.65, z);
      const dx = tx - x,
        dz = tz - z;
      const d = Math.sqrt(dx * dx + dz * dz) || 1;
      scene.add(b);
      bullets.push({
        mesh: b,
        vx: (dx / d) * BULLET_SPEED,
        vz: (dz / d) * BULLET_SPEED,
        life: 80,
      });
    }

    function spawnEnemy(wave: number) {
      const hp = 1 + Math.floor(wave * 0.9);
      const isTank = Math.random() < 0.15;
      const type = isTank ? 2 : Math.floor(Math.random() * 3);
      const spd = (0.04 + wave * 0.005) * (isTank ? 0.6 : 1);
      const finalHp = isTank ? Math.floor(hp * 2.5) : hp;

      const { group, hpFg, col, arms, legs } = buildEnemyRig(type);
      const angle = Math.random() * Math.PI * 2;
      group.position.set(
        Math.cos(angle) * (AR - 1),
        0,
        Math.sin(angle) * (AR - 1),
      );
      scene.add(group);
      enemies.push({
        mesh: group,
        hp: finalHp,
        maxHp: finalHp,
        speed: spd,
        type,
        col,
        hpFg,
        hitTimer: 0,
        dmgTimer: 0,
        arms,
        legs,
        animOffset: Math.random() * Math.PI * 2,
      });
    }

    function spawnPickup(x: number, z: number) {
      const t = puTypes[Math.floor(Math.random() * puTypes.length)];
      const m = new THREE.Mesh(
        pickupGeo,
        new THREE.MeshStandardMaterial({
          color: t.color,
          emissive: new THREE.Color(t.color).multiplyScalar(0.5),
          roughness: 0.3,
        }),
      );
      m.position.set(x, 0.5, z);
      scene.add(m);
      pickups.push({
        mesh: m,
        effect: t.effect,
        name: t.name,
        color: t.color,
        life: 400,
      });
    }

    function spawnParticles(pos: THREE.Vector3, col: number, count: number) {
      for (let i = 0; i < count; i++) {
        const pm = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 4, 4),
          new THREE.MeshBasicMaterial({ color: col }),
        );
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

    function getNearestEnemy(): Enemy | null {
      let best: Enemy | null = null,
        bestD = 999;
      for (const e of enemies) {
        const dx = e.mesh.position.x - playerMesh.position.x;
        const dz = e.mesh.position.z - playerMesh.position.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < bestD) {
          bestD = d;
          best = e;
        }
      }
      return best;
    }

    function activateUlt() {
      if (ultKills < ULT_NEEDED || ultActive || !storeRef.current.running) return;
      ultKills = 0;
      ultActive = true;
      ultTimer = 180;
      // Damage all enemies hard
      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        enemies[ei].hp -= 25;
        if (enemies[ei].hp <= 0) killEnemy(ei);
        else { enemies[ei].hitTimer = 20; spawnParticles(enemies[ei].mesh.position.clone(), 0xffdd00, 6); }
      }
      // Shockwave ring
      const swMat = new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      ultShockwave = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.35, 8, 40), swMat);
      ultShockwave.position.copy(playerMesh.position);
      ultShockwave.position.y = 0.5;
      ultShockwave.rotation.x = Math.PI / 2;
      scene.add(ultShockwave);
      // Burst particles
      for (let pi = 0; pi < 40; pi++) spawnParticles(playerMesh.position.clone(), pi % 2 === 0 ? 0xffdd00 : 0xffffff, 1);
    }
    (window as unknown as Record<string, unknown>).__activateUlt = activateUlt;

    function killEnemy(idx: number) {
      const e = enemies[idx];
      spawnParticles(e.mesh.position.clone(), e.col, 8);
      scene.remove(e.mesh);
      enemies.splice(idx, 1);

      const s = storeRef.current;
      s.addKill();
      s.addScore(10 * s.wave);
      s.addXp();
      s.enemyDied();
      ultKills = Math.min(ULT_NEEDED, ultKills + 1);

      if (Math.random() < 0.22)
        spawnPickup(e.mesh.position.x, e.mesh.position.z);
    }

    // Start first wave
    setTimeout(() => {
      storeRef.current.startWave();
    }, 500);

    let raf: number;

    function animate() {
      raf = requestAnimationFrame(animate);

      // Day/night cycle (runs regardless of game state)
      {
        const t = (Math.sin((frame / DAY_CYCLE) * Math.PI * 2) * 0.5 + 0.5); // 0=night, 1=day
        (scene.background as THREE.Color).copy(skyNight).lerp(skyDay, t);
        if (scene.fog) (scene.fog as THREE.Fog).color.copy(fogNight).lerp(fogDay, t);
        ambientLight.color.copy(ambNight).lerp(ambDay, t);
        ambientLight.intensity = 1.2 + t * 1.2;
        sun.intensity = t * 2.2;
        sun.color.setHSL(0.1 + t * 0.05, 0.6, 0.7 + t * 0.3);
        // Sun arc across the sky
        const angle = (frame / DAY_CYCLE) * Math.PI * 2;
        sun.position.set(Math.cos(angle) * 60, Math.sin(angle) * 60 + 10, Math.sin(angle * 0.5) * 30);
        // Stars fade out during day
        const sm = (scene.userData as { starMat?: THREE.PointsMaterial }).starMat;
        if (sm) sm.opacity = Math.max(0, 1 - t * 2.5);

        // Clouds: dark at night, white at day; always a bit visible
        cloudMat.opacity = 0.18 + t * 0.62;
        cloudMat.color.setRGB(
          0.13 + t * 0.87,  // R: dark→white
          0.20 + t * 0.80,  // G
          0.26 + t * 0.74,  // B
        );
        for (const c of clouds) {
          c.angle += c.speed;
          c.group.position.set(
            Math.cos(c.angle) * c.radius,
            c.y + Math.sin(c.angle * 3) * 2,
            Math.sin(c.angle) * c.radius,
          );
        }

        // Expose to HUD
        (window as unknown as Record<string, unknown>).__dayTime = t;
      }

      renderer.render(scene, camera);

      const s = storeRef.current;
      if (!s.running) return;

      frame++;

      // Tick store
      s.tickEffects();
      s.tickDash();
      s.tickWave();

      // Wave manager
      if (s.waveTimer === 0) {
        const shouldSpawn = s.tickSpawn();
        if (shouldSpawn) spawnEnemy(s.wave);
        if (s.spawnQueue === 0 && enemies.length === 0 && s.enemiesLeft <= 0) {
          s.nextWave();
        }
      } else if (s.waveTimer === 1) {
        s.startWave();
      }

      // Player movement
      let mx = 0,
        mz = 0;
      if (keys["KeyW"] || keys["ArrowUp"]) mz = -1;
      if (keys["KeyS"] || keys["ArrowDown"]) mz = 1;
      if (keys["KeyA"] || keys["ArrowLeft"]) mx = -1;
      if (keys["KeyD"] || keys["ArrowRight"]) mx = 1;

      moving = mx !== 0 || mz !== 0;

      // Dash
      if (keys["KeyQ"] && s.dashTimer === 0 && moving) {
        s.triggerDash();
        dashVx = mx * 0.55;
        dashVz = mz * 0.55;
        dashFrames = 12;
        spawnParticles(playerMesh.position.clone(), 0x00ffff, 5);
      }

      let spd = s.playerSpeed;
      if (dashFrames > 0) {
        mx = dashVx;
        mz = dashVz;
        dashFrames--;
        spd = 1;
      }

      const md = Math.sqrt(mx * mx + mz * mz) || 1;
      playerMesh.position.x += (mx / md) * spd;
      playerMesh.position.z += (mz / md) * spd;

      // Clamp in arena
      const pd = Math.sqrt(
        playerMesh.position.x ** 2 + playerMesh.position.z ** 2,
      );
      if (pd > AR - 1) {
        playerMesh.position.x = (playerMesh.position.x / pd) * (AR - 1);
        playerMesh.position.z = (playerMesh.position.z / pd) * (AR - 1);
      }
      if (moving) playerMesh.rotation.y = Math.atan2(mx, mz);
      playerMesh.position.y =
        Math.abs(Math.sin(frame * 0.18)) * (moving ? 0.05 : 0);

      // Player animation
      animT += moving ? 1.8 : 0.2;
      const sw = Math.sin(animT * 0.18) * (moving ? 1 : 0);
      uarmL.rotation.x = sw * 0.5;
      uarmR.rotation.x = -sw * 0.5;
      uarmL.rotation.z = 0.15;
      uarmR.rotation.z = -0.15;
      farmL.rotation.x = Math.max(0, sw) * 0.4 + 0.1;
      farmR.rotation.x = Math.max(0, -sw) * 0.4 + 0.1;
      for (const leg of ulegsData) {
        const ls = leg.side === 1 ? sw : -sw;
        leg.upper.rotation.x = ls * 0.45;
        leg.lower.rotation.x = Math.max(0, -ls) * 0.5 + 0.1;
      }
      playerRingMesh.rotation.z += 0.04;

      // Aura update — glow when any power-up is active
      {
        const fx = s.activeEffects;
        const hasEffect = Object.values(fx).some((v) => (v || 0) > 0);
        let auraCol = 0xffdd00;
        if ((fx.shield || 0) > 0) auraCol = 0x00ccff;
        else if ((fx.multishot || 0) > 0) auraCol = 0xff4400;
        else if ((fx.speed || 0) > 0) auraCol = 0x00ff88;
        else if ((fx.rapidfire || 0) > 0) auraCol = 0xffdd00;
        const pulse = Math.sin(frame * 0.15) * 0.5 + 0.5;
        const targetGlow = hasEffect ? 0.22 + pulse * 0.18 : 0;
        auraMat.opacity += (targetGlow - auraMat.opacity) * 0.1;
        auraMat.color.setHex(auraCol);
        const targetRing = hasEffect ? 0.55 + pulse * 0.45 : 0;
        ringMat1.opacity += (targetRing - ringMat1.opacity) * 0.1;
        ringMat1.color.setHex(auraCol);
        ringMat2.opacity += (targetRing * 0.65 - ringMat2.opacity) * 0.1;
        ringMat2.color.setHex(auraCol);
        auraRing1.rotation.z += 0.06;
        auraRing2.rotation.z -= 0.04;
        auraRing2.rotation.y += 0.05;
        auraGlow.scale.setScalar(1 + pulse * 0.12);
      }

      // Ultimate shockwave animation
      if (ultActive) {
        ultTimer--;
        if (ultShockwave) {
          const prog = 1 - ultTimer / 180;
          ultShockwave.scale.setScalar(1 + prog * 38);
          (ultShockwave.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.95 - prog * 2.2);
          if ((ultShockwave.material as THREE.MeshBasicMaterial).opacity <= 0) {
            scene.remove(ultShockwave);
            ultShockwave = null;
          }
        }
        if (ultTimer <= 0) ultActive = false;
      }

      // Expose ult state to HUD
      (window as unknown as Record<string, unknown>).__ult = { charge: ultKills, needed: ULT_NEEDED, active: ultActive };

      // Auto fire
      s.tickFire();
      if (s.fireTimer >= s.fireRate) {
        s.resetFire();
        const tgt = getNearestEnemy();
        if (tgt) {
          const tx = tgt.mesh.position.x,
            tz = tgt.mesh.position.z;
          if (s.shotCount === 1) {
            spawnBullet(playerMesh.position.x, playerMesh.position.z, tx, tz);
          } else {
            const base = Math.atan2(
              tx - playerMesh.position.x,
              tz - playerMesh.position.z,
            );
            for (let i = 0; i < s.shotCount; i++) {
              const off = (i - (s.shotCount - 1) / 2) * 0.38;
              spawnBullet(
                playerMesh.position.x,
                playerMesh.position.z,
                playerMesh.position.x + Math.sin(base + off) * 10,
                playerMesh.position.z + Math.cos(base + off) * 10,
              );
            }
          }
          uarmR.rotation.x = -0.6;
          uarmR.rotation.z = -0.22;
          farmR.rotation.x = 0.85;
        }
      }

      // Bullets
      for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const b = bullets[bi];
        b.mesh.position.x += b.vx;
        b.mesh.position.z += b.vz;
        b.life--;
        let hit = false;
        for (let ei = enemies.length - 1; ei >= 0; ei--) {
          const en = enemies[ei];
          const dx = b.mesh.position.x - en.mesh.position.x;
          const dz = b.mesh.position.z - en.mesh.position.z;
          if (Math.sqrt(dx * dx + dz * dz) < 0.75) {
            en.hp--;
            en.hitTimer = 7;
            const ratio = Math.max(0, en.hp / en.maxHp);
            en.hpFg.scale.x = ratio;
            en.hpFg.position.x = -(0.9 * (1 - ratio)) / 2;
            if (en.hp <= 0) killEnemy(ei);
            hit = true;
            break;
          }
        }
        if (hit || b.life <= 0) {
          scene.remove(b.mesh);
          bullets.splice(bi, 1);
        }
      }

      // Enemies
      playerDmgTimer = Math.max(0, playerDmgTimer - 1);
      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        const en = enemies[ei];
        const dx = playerMesh.position.x - en.mesh.position.x;
        const dz = playerMesh.position.z - en.mesh.position.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        en.mesh.position.x += (dx / d) * en.speed;
        en.mesh.position.z += (dz / d) * en.speed;
        en.mesh.rotation.y += 0.025;

        // Running animation for enemies
        const esw = Math.sin(frame * 0.24 + en.animOffset) * 0.7;
        en.arms.forEach((a) => {
          a.upper.rotation.x = esw * a.side * 0.35;
          a.lower.rotation.x = Math.max(0, -esw * a.side) * 0.4;
        });
        en.legs.forEach((leg) => {
          const ls = leg.side === 1 ? esw : -esw;
          leg.upper.rotation.x = ls * 0.45;
          leg.lower.rotation.x = Math.max(0, -ls) * 0.4 + 0.05;
        });

        // Hit flash
        if (en.hitTimer > 0) {
          en.hitTimer--;
          const bodyMesh = en.mesh.children[0] as THREE.Mesh;
          if (bodyMesh?.material) {
            (
              bodyMesh.material as THREE.MeshStandardMaterial
            ).emissiveIntensity = en.hitTimer > 0 ? 2 : 0.25;
          }
        }

        // Contact damage
        if (d < 1.0 && playerDmgTimer === 0) {
          playerDmgTimer = 45;
          storeRef.current.damage(1);
          spawnParticles(playerMesh.position.clone(), 0xe74c3c, 5);
          camera.position.x += (Math.random() - 0.5) * 0.6;
          camera.position.z += (Math.random() - 0.5) * 0.6;
        }

        // HP bars face camera
        const hpBarGroup = en.hpFg.parent;
        hpBarGroup?.lookAt(camera.position);
      }

      // Pickups
      for (let pi = pickups.length - 1; pi >= 0; pi--) {
        const pk = pickups[pi];
        pk.mesh.rotation.y += 0.06;
        pk.mesh.position.y = 0.5 + Math.sin(frame * 0.06 + pi) * 0.18;
        pk.life--;

        const dx = pk.mesh.position.x - playerMesh.position.x;
        const dz = pk.mesh.position.z - playerMesh.position.z;
        if (Math.sqrt(dx * dx + dz * dz) < 1.1) {
          storeRef.current.applyEffect(pk.effect as any);
          spawnParticles(pk.mesh.position.clone(), pk.color, 8);
          storeRef.current.setWaveMessage(pk.name + "!");
          scene.remove(pk.mesh);
          pickups.splice(pi, 1);
          continue;
        }
        if (pk.life <= 0) {
          scene.remove(pk.mesh);
          pickups.splice(pi, 1);
        }
      }

      // Particles
      for (let pi = particles.length - 1; pi >= 0; pi--) {
        const p = particles[pi];
        p.life -= 0.04;
        p.mesh.position.x += p.vx;
        p.mesh.position.y += p.vy;
        p.mesh.position.z += p.vz;
        p.vy -= 0.007;
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = p.life;
        (p.mesh.material as THREE.MeshBasicMaterial).transparent = true;
        if (p.life <= 0) {
          scene.remove(p.mesh);
          particles.splice(pi, 1);
        }
      }

      // Spectator animations (torcida viva)
      for (const s of spectatorList) {
        const cheer = Math.sin(frame * 0.32 + s.animOffset) * 0.22 + 0.18;
        s.armL.rotation.z = 0.4 + cheer;
        s.armR.rotation.z = -0.4 - cheer;
        s.group.position.y =
          0.14 + Math.sin(frame * 0.18 + s.animOffset) * 0.015;
      }

      // Arena effects
      arenaLight.intensity = 1.2 + Math.sin(frame * 0.04) * 0.4;
      ring.material.color.setHSL((frame * 0.002) % 1, 1, 0.5);

      // Camera follow player
      const camTx = playerMesh.position.x * 0.28;
      const camTz = playerMesh.position.z * 0.28 + 12;
      camera.position.x += (camTx - camera.position.x) * 0.06;
      camera.position.z += (camTz - camera.position.z) * 0.06;
      camera.position.y = 14;
      camera.lookAt(playerMesh.position.x, 0, playerMesh.position.z);
    }

    animate();

    // Store ref for external access
    stateRef.current = {
      scene,
      enemies,
      bullets,
      pickups,
      particles,
    };

    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("playerSettingsChanged", applyPlayerSettings);
      const w = window as unknown as Record<string, unknown>;
      delete w.__keys;
      delete w.__activateUlt;
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [mounted]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
      <HUD />
    </div>
  );
}
