"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useGameStore } from "@/lib/gameStore";
import HUD from "./HUD";
import { Enemy, Bullet, Pickup, Particle, MultiProps } from "@/lib/gameTypes";
import { buildPlayerRig } from "@/lib/playerRig";

// ---- CONSTANTS ----
const AR = 18;
const BULLET_SPEED = 0.35;

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
export default function GameScene({ multiProps }: { multiProps?: MultiProps }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<any>({});
  const store = useGameStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-start for multiplayer — skip the main-menu screen
  useEffect(() => {
    if (!multiProps || !mounted) return;
    const t = setTimeout(() => {
      storeRef.current.setRunning(true);
    }, 400);
    return () => clearTimeout(t);
  }, [mounted, multiProps]);

  useEffect(() => {
    if (!mounted || !mountRef.current) return;
    const el = mountRef.current;
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);

    // Renderer — aggressive pixel ratio cap on iOS/mobile for smooth framerate
    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile && !isIOS,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(isIOS ? 1 : isMobile ? Math.min(devicePixelRatio, 1.5) : Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isMobile && !isIOS;
    renderer.setClearColor(0x050010);
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050010);
    scene.fog = new THREE.Fog(0x0a0020, isMobile ? 30 : 60, isMobile ? 90 : 220);

    // Starfield
    {
      const starCount = isMobile ? 500 : 1800;
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
    interface Cloud { group: THREE.Group; speed: number; angle: number; radius: number; y: number }
    const clouds: Cloud[] = [];
    let cloudMat: THREE.MeshStandardMaterial | null = null;
    if (!isMobile) {
      cloudMat = new THREE.MeshStandardMaterial({
        color: 0x223344,  // starts dark (night)
        transparent: true,
        opacity: 0.18,    // always slightly visible
        roughness: 1,
        metalness: 0,
        depthWrite: false,
      });
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
      new THREE.CylinderGeometry(AR, AR, 0.4, isMobile ? 24 : 64),
      new THREE.MeshStandardMaterial({ color: 0x302f55, roughness: 0.95 }),
    );
    floor.position.y = -0.2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(AR * 2, 40, 0x553366, 0x221122);
    grid.position.y = 0.02;
    scene.add(grid);

    const centerField = new THREE.Mesh(
      new THREE.RingGeometry(0.6, AR - 1.3, isMobile ? 32 : 96),
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
      new THREE.RingGeometry(1.5, 3.2, isMobile ? 32 : 96),
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
      new THREE.TorusGeometry(AR, 0.18, 6, isMobile ? 32 : 64),
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
      }
    }

    if (!isMobile) {
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

      for (let side = -1; side <= 1; side += 2) {
        for (let row = 0; row < 7; row++) {
          const y = 0.1 + row * 0.26;

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
    if (!isMobile) {
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
    }

    const spectatorList = spectators;

    // Stadium focal lights
    if (!isMobile) {
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
    let enemyIdCounter = 0;
    let pickupIdCounter = 0;
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
        id: ++enemyIdCounter,
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
        id: ++pickupIdCounter,
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

    // ── Multiplayer: remote player mesh + position sync ───────────────────────
    let remoteTargetX = 3, remoteTargetZ = 3, remoteTargetAngle = 0;
    let syncIntervalId: ReturnType<typeof setInterval> | null = null;
    let remoteRig: ReturnType<typeof buildPlayerRig> | null = null;
    let pendingRemoteHits = 0; // hits queued to send to remote on next sync
    // Co-op: guest queues enemy hits to send to host
    let pendingEnemyHitsBuffer: Array<{ id: number; damage: number }> = [];
    // Co-op: guest signals pickup removal
    let removePickupIdBuffer: number | null = null;
    // Co-op: track if we already sent the coopGameOver signal
    let coopGameOverSent = false;
    // Used to detect resetSignal changes from server
    let lastResetSignal = 0;
    // Tracks whether we've already sent our death notification (prevents duplicate win records)
    let deathSynced = false;

    // PVP countdown — driven by server gameStartedAt so both clients are in sync
    // countdownActive blocks movement and auto-fire
    const pvp = { countdownActive: multiProps?.mode === "pvp" };
    if (multiProps?.mode === "pvp") {
      // Show initial "3" immediately while waiting for server ACK
      (window as unknown as Record<string, unknown>).__pvpCountdown = 3;
    }

    // Co-op guest: maintain remote enemy meshes keyed by enemy id
    type RemoteEnemy = ReturnType<typeof buildEnemyRig> & { targetX: number; targetZ: number; animOffset: number };
    const remoteEnemyMap = new Map<number, RemoteEnemy>();
    // Co-op guest: remote pickup meshes + their effect data
    const remotePickupMap = new Map<number, THREE.Mesh>();
    const remotePickupEffects = new Map<number, { effect: string; color: number; name: string }>();
    // Remote bullet meshes (visual only, no collision)
    const remoteBulletMeshes: THREE.Mesh[] = [];
    const remoteBulletGeo = new THREE.SphereGeometry(0.1, 4, 4);
    const remoteBulletMat = new THREE.MeshBasicMaterial({ color: 0x55aaff, transparent: true, opacity: 0.75 });

    if (multiProps) {
      remoteRig = buildPlayerRig();
      // Green shirt to distinguish from local player
      remoteRig.materials.shirt.color.set(0x1a7a2e);
      remoteRig.materials.shirt.emissive.set(0x0a2a10);
      remoteRig.root.position.set(3, 0, 3);
      scene.add(remoteRig.root);

      syncIntervalId = setInterval(async () => {
        const s = storeRef.current;
        // Skip while on main menu (not started yet)
        if (!s.running && !s.gameOver) return;
        try {
          const hitsToSend = s.gameOver ? 0 : pendingRemoteHits;
          if (!s.gameOver) pendingRemoteHits = 0;

          const body: Record<string, unknown> = {
            x: playerMesh.position.x,
            z: playerMesh.position.z,
            angle: playerMesh.rotation.y,
            hp: s.hp,
            score: s.score,
            kills: s.kills,
            hitRemote: hitsToSend,
          };

          // Host: broadcast enemy + pickup positions for co-op
          if (multiProps!.role === "host" && multiProps!.mode === "coop") {
            body.enemies = enemies.map(e => ({
              id: e.id,
              x: e.mesh.position.x,
              z: e.mesh.position.z,
              hp: e.hp,
              maxHp: e.maxHp,
              type: e.type,
            }));
            body.pickups = pickups.map(p => ({
              id: p.id,
              x: p.mesh.position.x,
              z: p.mesh.position.z,
              effect: p.effect,
              color: p.color,
            }));
          }

          // Host: start PVP countdown clock on server (only once)
          if (multiProps!.role === "host" && multiProps!.mode === "pvp") {
            body.startCountdown = true;
          }

          // Rematch vote: send once when flagged by HUD
          const w = window as unknown as Record<string, unknown>;
          if (w.__pvpRematchVote) {
            body.rematchVote = true;
            delete w.__pvpRematchVote;
          }
          // Host sends reset when both voted
          if (multiProps!.role === "host" && w.__pvpTriggerReset) {
            body.resetGame = true;
            delete w.__pvpTriggerReset;
          }

          // Co-op: guest sends queued enemy hits
          if (multiProps!.role === "guest" && pendingEnemyHitsBuffer.length > 0) {
            body.enemyHits = pendingEnemyHitsBuffer.splice(0);
          }
          // Co-op: guest signals pickup removal
          if (multiProps!.role === "guest" && removePickupIdBuffer !== null) {
            body.removePickupId = removePickupIdBuffer;
            removePickupIdBuffer = null;
          }
          // Co-op game over signal
          if (multiProps!.mode === "coop" && s.gameOver && !coopGameOverSent) {
            coopGameOverSent = true;
            body.coopGameOver = true;
          }

          // Bullet sync for remote visual rendering
          if (multiProps!.mode === "coop") {
            if (multiProps!.role === "host") {
              body.hostBullets = bullets.map(b => ({ x: b.mesh.position.x, z: b.mesh.position.z, vx: b.vx, vz: b.vz }));
            } else {
              body.guestBullets = bullets.map(b => ({ x: b.mesh.position.x, z: b.mesh.position.z, vx: b.vx, vz: b.vz }));
            }
          }

          const res = await fetch(`/api/rooms/${multiProps!.roomId}/sync`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          });
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

            // ── Synced PVP countdown ──
            if (data.gameStartedAt) {
              const elapsed = Date.now() - data.gameStartedAt;
              const cdVal = Math.max(0, 3 - Math.floor(elapsed / 1000));
              if (cdVal > 0) {
                w.__pvpCountdown = cdVal;
                pvp.countdownActive = true;
              } else {
                delete w.__pvpCountdown;
                pvp.countdownActive = false;
              }
            }

            // ── Reset signal: server incremented → full restart ──
            const sig = data.resetSignal ?? 0;
            if (sig > lastResetSignal) {
              lastResetSignal = sig;
              deathSynced = false;
              coopGameOverSent = false;
              pendingRemoteHits = 0;
              pendingEnemyHitsBuffer.length = 0;
              delete w.__pvpResult;
              delete w.__pvpRematch;
              // Clear all local enemies + pickups
              for (const e of enemies) scene.remove(e.mesh);
              enemies.length = 0;
              for (const p of pickups) scene.remove(p.mesh);
              pickups.length = 0;
              // Clear remote enemies
              remoteEnemyMap.forEach(re => scene.remove(re.group));
              remoteEnemyMap.clear();
              // Clear remote pickups
              remotePickupMap.forEach(m => scene.remove(m));
              remotePickupMap.clear();
              remotePickupEffects.clear();
              // Clear remote bullets
              for (const rb of remoteBulletMeshes) scene.remove(rb);
              remoteBulletMeshes.length = 0;
              storeRef.current.reset();
              return;
            }

            // ── Remote player position ──
            const other = multiProps!.role === "host" ? data.guest : data.host;
            if (other) {
              remoteTargetX = other.x;
              remoteTargetZ = other.z;
              remoteTargetAngle = other.angle;
              // PVP: remote player died → we won
              if (
                multiProps!.mode === "pvp" &&
                other.hp === 0 &&
                !deathSynced &&
                !(w.__pvpResult)
              ) {
                w.__pvpResult = "win";
                pendingRemoteHits = 0;
                fetch("/api/pvp/win", { method: "POST" }).catch(() => undefined);
              }
              // Remote went stale >5s → abandoned
              if (
                multiProps!.mode === "pvp" &&
                Date.now() - other.updatedAt > 5000 &&
                !(w.__pvpResult)
              ) {
                w.__pvpResult = "abandoned";
              }
            }

            // Push own death to server once so winner detects it
            if (s.gameOver && !deathSynced) {
              deathSynced = true;
            }

            // ── Incoming hits (only apply if still alive) ──
            if (!s.gameOver && data.incomingHits && data.incomingHits > 0) {
              storeRef.current.damage(data.incomingHits);
              // If PVP damage killed us, show loss modal (suppress solo GameOverScreen)
              if (multiProps!.mode === "pvp" && storeRef.current.hp <= 0) {
                (w as Record<string, unknown>).__pvpResult = "loss";
              }
            }

            // ── Co-op guest: sync enemy positions ──
            if (multiProps!.mode === "coop" && multiProps!.role === "guest" && data.enemies) {
              const seenIds = new Set<number>();
              for (const es of data.enemies) {
                seenIds.add(es.id);
                if (remoteEnemyMap.has(es.id)) {
                  // Update position target
                  const re = remoteEnemyMap.get(es.id)!;
                  re.targetX = es.x;
                  re.targetZ = es.z;
                  // Update HP bar
                  const ratio = Math.max(0, es.hp / es.maxHp);
                  re.hpFg.scale.x = ratio;
                  re.hpFg.position.x = -(0.9 * (1 - ratio)) / 2;
                } else {
                  // Spawn new remote enemy mesh
                  const rig = buildEnemyRig(es.type);
                  rig.group.position.set(es.x, 0, es.z);
                  scene.add(rig.group);
                  remoteEnemyMap.set(es.id, { ...rig, targetX: es.x, targetZ: es.z, animOffset: Math.random() * Math.PI * 2 });
                }
              }
              // Remove enemies that disappeared on host
              for (const [id, re] of Array.from(remoteEnemyMap)) {
                if (!seenIds.has(id)) {
                  spawnParticles(re.group.position.clone(), re.col, 5);
                  scene.remove(re.group);
                  remoteEnemyMap.delete(id);
                }
              }
            }

            // ── Co-op guest: sync pickup positions ──
            if (multiProps!.mode === "coop" && multiProps!.role === "guest" && data.pickups) {
              const seenPids = new Set<number>();
              for (const ps of data.pickups) {
                seenPids.add(ps.id);
                if (!remotePickupMap.has(ps.id)) {
                  const pm = new THREE.Mesh(
                    pickupGeo,
                    new THREE.MeshStandardMaterial({
                      color: ps.color,
                      emissive: new THREE.Color(ps.color).multiplyScalar(0.5),
                      roughness: 0.3,
                    }),
                  );
                  pm.position.set(ps.x, 0.5, ps.z);
                  scene.add(pm);
                  remotePickupMap.set(ps.id, pm);
                  const pu = puTypes.find(t => t.effect === ps.effect) ?? { name: ps.effect, color: ps.color, effect: ps.effect };
                  remotePickupEffects.set(ps.id, pu);
                }
              }
              // Remove pickups no longer present on host
              for (const [pid, pmesh] of Array.from(remotePickupMap)) {
                if (!seenPids.has(pid)) {
                  scene.remove(pmesh);
                  remotePickupMap.delete(pid);
                  remotePickupEffects.delete(pid);
                }
              }
            }

            // ── Co-op host: apply enemy hits from guest ──
            if (multiProps!.mode === "coop" && multiProps!.role === "host" && data.pendingEnemyHits && data.pendingEnemyHits.length > 0) {
              for (const hit of data.pendingEnemyHits) {
                const idx = enemies.findIndex(e => e.id === hit.id);
                if (idx >= 0) {
                  enemies[idx].hp -= hit.damage;
                  enemies[idx].hitTimer = 7;
                  const ratio = Math.max(0, enemies[idx].hp / enemies[idx].maxHp);
                  enemies[idx].hpFg.scale.x = ratio;
                  enemies[idx].hpFg.position.x = -(0.9 * (1 - ratio)) / 2;
                  if (enemies[idx].hp <= 0) killEnemy(idx);
                }
              }
            }

            // ── Co-op game over: partner died ──
            if (multiProps!.mode === "coop" && data.coopGameOver) {
              const cs = storeRef.current;
              if (!cs.gameOver) {
                cs.damage(100); // force local game over
              }
            }

            // ── Remote bullets (visual only) ──
            if (multiProps!.mode === "coop") {
              const remoteBulletsData = (multiProps!.role === "host" ? data.guestBullets : data.hostBullets) ?? [];
              for (const rb of remoteBulletMeshes) scene.remove(rb);
              remoteBulletMeshes.length = 0;
              for (const rb of remoteBulletsData) {
                const m = new THREE.Mesh(remoteBulletGeo, remoteBulletMat);
                m.position.set(rb.x, 0.65, rb.z);
                scene.add(m);
                remoteBulletMeshes.push(m);
              }
            }

            // ── Rematch state → expose to HUD ──
            if (data.rematch) {
              w.__pvpRematch = data.rematch;
            }
          } else {
            // Failed to send — put hits back
            if (!s.gameOver) pendingRemoteHits += hitsToSend;
          }
        } catch { /* ignore */ }
      }, 200);
    }

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
        if (cloudMat) {
          cloudMat.opacity = 0.18 + t * 0.62;
          cloudMat.color.setRGB(
            0.13 + t * 0.87,  // R: dark→white
            0.20 + t * 0.80,  // G
            0.26 + t * 0.74,  // B
          );
        }
        if (clouds.length > 0) {
          for (const c of clouds) {
            c.angle += c.speed;
            c.group.position.set(
              Math.cos(c.angle) * c.radius,
              c.y + Math.sin(c.angle * 3) * 2,
              Math.sin(c.angle) * c.radius,
            );
          }
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

      // Remote player smooth interpolation
      if (remoteRig) {
        remoteRig.root.position.x += (remoteTargetX - remoteRig.root.position.x) * 0.2;
        remoteRig.root.position.z += (remoteTargetZ - remoteRig.root.position.z) * 0.2;
        remoteRig.root.rotation.y += (remoteTargetAngle - remoteRig.root.rotation.y) * 0.2;
      }

      // Co-op guest: interpolate and animate remote enemy meshes
      if (multiProps?.mode === "coop" && multiProps.role === "guest") {
        remoteEnemyMap.forEach(re => {
          re.group.position.x += (re.targetX - re.group.position.x) * 0.2;
          re.group.position.z += (re.targetZ - re.group.position.z) * 0.2;
          re.group.rotation.y += 0.025;
          const esw = Math.sin(frame * 0.24 + re.animOffset) * 0.7;
          re.arms.forEach(a => {
            a.upper.rotation.x = esw * a.side * 0.35;
            a.lower.rotation.x = Math.max(0, -esw * a.side) * 0.4;
          });
          re.legs.forEach(leg => {
            const ls = leg.side === 1 ? esw : -esw;
            leg.upper.rotation.x = ls * 0.45;
            leg.lower.rotation.x = Math.max(0, -ls) * 0.4 + 0.05;
          });
        });
      }

      // Wave manager — solo, or host in co-op only (guest receives enemies via sync)
      if (!multiProps || (multiProps.mode === "coop" && multiProps.role === "host")) {
        if (s.waveTimer === 0) {
          const shouldSpawn = s.tickSpawn();
          if (shouldSpawn) spawnEnemy(s.wave);
          if (s.spawnQueue === 0 && enemies.length === 0 && s.enemiesLeft <= 0) {
            s.nextWave();
          }
        } else if (s.waveTimer === 1) {
          s.startWave();
        }
      }

      // Player movement — frozen during PVP countdown
      let mx = 0,
        mz = 0;
      if (!pvp.countdownActive) {
      if (keys["KeyW"] || keys["ArrowUp"]) mz = -1;
      if (keys["KeyS"] || keys["ArrowDown"]) mz = 1;
      if (keys["KeyA"] || keys["ArrowLeft"]) mx = -1;
      if (keys["KeyD"] || keys["ArrowRight"]) mx = 1;
      }

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

      // Auto fire — frozen during PVP countdown
      s.tickFire();
      if (!pvp.countdownActive && s.fireTimer >= s.fireRate) {
        s.resetFire();
        // PVP: target remote player; co-op guest: target remote enemy; co-op host/solo: nearest local enemy
        let tx: number | null = null, tz: number | null = null;
        if (multiProps?.mode === "pvp" && remoteRig) {
          tx = remoteRig.root.position.x;
          tz = remoteRig.root.position.z;
        } else if (multiProps?.mode === "coop" && multiProps.role === "guest") {
          // Guest targets remote enemies
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
        // In PVP, check collision against the remote player mesh
        if (multiProps?.mode === "pvp" && remoteRig) {
          const dx = b.mesh.position.x - remoteRig.root.position.x;
          const dz = b.mesh.position.z - remoteRig.root.position.z;
          if (Math.sqrt(dx * dx + dz * dz) < 0.75) {
            pendingRemoteHits++;
            spawnParticles(b.mesh.position.clone(), 0xff4444, 4);
            hit = true;
          }
        }
        // In non-PVP, check collision against enemies (local for host/solo, remote for co-op guest)
        if (!hit) {
          if (multiProps?.mode === "coop" && multiProps.role === "guest") {
            // Guest: hit remote enemies, queue damage for host to apply
            for (const [eid, re] of Array.from(remoteEnemyMap)) {
              const ddx = b.mesh.position.x - re.group.position.x;
              const ddz = b.mesh.position.z - re.group.position.z;
              if (Math.sqrt(ddx * ddx + ddz * ddz) < 0.75) {
                pendingEnemyHitsBuffer.push({ id: eid, damage: 1 });
                spawnParticles(b.mesh.position.clone(), re.col, 4);
                hit = true;
                break;
              }
            }
          } else {
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
        // In co-op, chase the nearest player (local or remote)
        let targetX = playerMesh.position.x;
        let targetZ = playerMesh.position.z;
        if (multiProps?.mode === "coop" && remoteRig) {
          const dlx = playerMesh.position.x - en.mesh.position.x;
          const dlz = playerMesh.position.z - en.mesh.position.z;
          const dLocal = Math.sqrt(dlx * dlx + dlz * dlz);
          const drx = remoteRig.root.position.x - en.mesh.position.x;
          const drz = remoteRig.root.position.z - en.mesh.position.z;
          const dRemote = Math.sqrt(drx * drx + drz * drz);
          if (dRemote < dLocal) {
            targetX = remoteRig.root.position.x;
            targetZ = remoteRig.root.position.z;
          }
        }
        const dx = targetX - en.mesh.position.x;
        const dz = targetZ - en.mesh.position.z;
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

        // Contact damage (local enemies vs local player)
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

      // Co-op guest: contact damage from remote enemies
      if (multiProps?.mode === "coop" && multiProps.role === "guest" && playerDmgTimer === 0) {
        remoteEnemyMap.forEach(re => {
          if (playerDmgTimer > 0) return;
          const edx = re.group.position.x - playerMesh.position.x;
          const edz = re.group.position.z - playerMesh.position.z;
          if (Math.sqrt(edx * edx + edz * edz) < 1.0) {
            playerDmgTimer = 45;
            storeRef.current.damage(1);
            spawnParticles(playerMesh.position.clone(), 0xe74c3c, 5);
            camera.position.x += (Math.random() - 0.5) * 0.6;
            camera.position.z += (Math.random() - 0.5) * 0.6;
          }
        });
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

      // Co-op guest: animate + collect remote pickups (from host)
      if (multiProps?.mode === "coop" && multiProps.role === "guest") {
        let rpi = 0;
        for (const [pid, pmesh] of Array.from(remotePickupMap)) {
          pmesh.rotation.y += 0.06;
          pmesh.position.y = 0.5 + Math.sin(frame * 0.06 + rpi) * 0.18;
          const pdx = pmesh.position.x - playerMesh.position.x;
          const pdz = pmesh.position.z - playerMesh.position.z;
          if (Math.sqrt(pdx * pdx + pdz * pdz) < 1.1) {
            const pu = remotePickupEffects.get(pid);
            if (pu) {
              storeRef.current.applyEffect(pu.effect as any);
              spawnParticles(pmesh.position.clone(), pu.color, 8);
              storeRef.current.setWaveMessage(pu.name + "!");
            }
            scene.remove(pmesh);
            remotePickupMap.delete(pid);
            remotePickupEffects.delete(pid);
            removePickupIdBuffer = pid;
          }
          rpi++;
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
      if (spectators.length > 0) {
        for (const s of spectatorList) {
          const cheer = Math.sin(frame * 0.32 + s.animOffset) * 0.22 + 0.18;
          s.armL.rotation.z = 0.4 + cheer;
          s.armR.rotation.z = -0.4 - cheer;
          s.group.position.y =
            0.14 + Math.sin(frame * 0.18 + s.animOffset) * 0.015;
        }
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
      if (syncIntervalId) clearInterval(syncIntervalId);
      if (remoteRig) scene.remove(remoteRig.root);
      remoteEnemyMap.forEach(re => scene.remove(re.group));
      remoteEnemyMap.clear();
      remotePickupMap.forEach(m => scene.remove(m));
      remotePickupMap.clear();
      remotePickupEffects.clear();
      for (const rb of remoteBulletMeshes) scene.remove(rb);
      remoteBulletMeshes.length = 0;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("playerSettingsChanged", applyPlayerSettings);
      const w = window as unknown as Record<string, unknown>;
      delete w.__keys;
      delete w.__activateUlt;
      delete w.__pvpCountdown;
      delete w.__pvpResult;
      delete w.__pvpRematch;
      delete w.__pvpRematchVote;
      delete w.__pvpTriggerReset;
      renderer.dispose();
      el.removeChild(renderer.domElement);
      // Close the multiplayer room when leaving the game
      if (multiProps) {
        fetch(`/api/rooms/${multiProps.roomId}/close`, { method: "POST" }).catch(() => undefined);
      }
    };
  }, [mounted]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
      <HUD multiProps={multiProps} />
    </div>
  );
}
