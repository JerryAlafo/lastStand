import * as THREE from "three";
import { getMapById } from "./maps";

export interface CloudEntry { group: THREE.Group; speed: number; angle: number; radius: number; y: number }
export interface SpectatorEntry { group: THREE.Group; armL: THREE.Mesh; armR: THREE.Mesh; animOffset: number }

export interface ArenaResult {
  camera: THREE.PerspectiveCamera;
  ambientLight: THREE.AmbientLight;
  sun: THREE.DirectionalLight;
  arenaLight: THREE.PointLight;
  ring: THREE.Mesh;
  clouds: CloudEntry[];
  cloudMat: THREE.MeshStandardMaterial | null;
  spectatorList: SpectatorEntry[];
  skyNight: THREE.Color; skyDay: THREE.Color;
  fogNight: THREE.Color; fogDay: THREE.Color;
  ambNight: THREE.Color; ambDay: THREE.Color;
  DAY_CYCLE: number;
  arenaRadius: number;
  mapEffects?: { update: (frame: number) => void };
}

export function buildArena(scene: THREE.Scene, isMobile: boolean, mapId = "arena"): ArenaResult {
  const map = getMapById(mapId);
  const AR = map?.arenaRadius ?? 18;
  const floorColor = map?.floorColor ?? 0x302f55;
  const wallColor = map?.wallColor ?? 0x12112b;
  const ringColor = map?.ringColor ?? 0xff2244;
  const fogColor = map?.fogColor ?? 0x0a0020;
  const skyColor = map?.skyColor ?? 0x050010;
  const accentColor = map?.accentColor ?? "#7b2ff7";
  // Weak device: Android, iOS, or any mobile (use minimal scene)
  const isAndroid = /Android/i.test(typeof navigator !== "undefined" ? navigator.userAgent : "");
  const isWeak = isMobile || isAndroid;

  // Starfield
  {
    const starCount = isWeak ? 300 : 1800;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 160 + Math.random() * 20;
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.abs(r * Math.cos(phi));
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.55, sizeAttenuation: true, transparent: true, opacity: 1 });
    scene.add(new THREE.Points(starGeo, starMat));
    Object.assign(scene.userData, { starMat });
  }

  // Clouds
  const clouds: CloudEntry[] = [];
  let cloudMat: THREE.MeshStandardMaterial | null = null;
  if (!isWeak) {
    cloudMat = new THREE.MeshStandardMaterial({ color: 0x223344, transparent: true, opacity: 0.18, roughness: 1, metalness: 0, depthWrite: false });
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

  // Camera
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
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

  // Day/night colours
  const skyNight = new THREE.Color(skyColor);
  const skyDay   = new THREE.Color(0xadd8e6);
  const fogNight = new THREE.Color(fogColor);
  const fogDay   = new THREE.Color(0xadd8e6);
  const ambNight = new THREE.Color(0x2233aa);
  const ambDay   = new THREE.Color(0xfff5d0);
  const DAY_CYCLE = 7200;

  const arenaLight = new THREE.PointLight(0xff6677, 2.5, 50);
  arenaLight.position.set(0, 8, 0);
  scene.add(arenaLight);
  const blueLight = new THREE.PointLight(0x6699ff, 1.5, 45);
  blueLight.position.set(0, 4, 0);
  scene.add(blueLight);

  // Floor & grid
  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(AR, AR, 0.4, isWeak ? 20 : 48),
    new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.95 }),
  );
  floor.position.y = -0.2; floor.receiveShadow = true; scene.add(floor);
  const grid = new THREE.GridHelper(AR * 2, 40, 0x553366, 0x221122);
  grid.position.y = 0.02; scene.add(grid);
  const centerField = new THREE.Mesh(
    new THREE.RingGeometry(0.6, AR - 1.3, isWeak ? 24 : 64),
    new THREE.MeshStandardMaterial({ color: 0x101428, roughness: 0.95, metalness: 0.05, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }),
  );
  centerField.rotation.x = -Math.PI / 2; centerField.position.y = -0.145; scene.add(centerField);
  const ringFloor = new THREE.Mesh(
    new THREE.RingGeometry(1.5, 3.2, isWeak ? 24 : 64),
    new THREE.MeshStandardMaterial({ color: 0x44527b, roughness: 0.9, metalness: 0.15, side: THREE.DoubleSide }),
  );
  ringFloor.rotation.x = -Math.PI / 2; ringFloor.position.y = -0.14; scene.add(ringFloor);

  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.85, emissive: new THREE.Color(wallColor).multiplyScalar(0.6), emissiveIntensity: 0.25, side: THREE.DoubleSide });
  const wallDepth = 0.4, wallHeight = 2.5, wallLength = AR * 2 + 1;
  for (const w of [
    { x: 0, y: wallHeight / 2, z: -AR - wallDepth / 2, ry: 0 },
    { x: 0, y: wallHeight / 2, z:  AR + wallDepth / 2, ry: 0 },
    { x: -AR - wallDepth / 2, y: wallHeight / 2, z: 0, ry: Math.PI / 2 },
    { x:  AR + wallDepth / 2, y: wallHeight / 2, z: 0, ry: Math.PI / 2 },
  ]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(wallLength, wallHeight, wallDepth), wallMat);
    wall.position.set(w.x, w.y, w.z); wall.rotation.y = w.ry; wall.receiveShadow = true; scene.add(wall);
  }

  // Boundary ring + pillars
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(AR, 0.18, 6, isWeak ? 24 : 48),
    new THREE.MeshBasicMaterial({ color: ringColor }),
  );
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.05; scene.add(ring);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 2.5, 0.3),
      new THREE.MeshBasicMaterial({ color: 0xff1133, transparent: true, opacity: 0.5 }),
    );
    pillar.position.set(Math.cos(a) * AR, 1.2, Math.sin(a) * AR); scene.add(pillar);
  }

  // Bleachers & spectators
  const crowdShirtColors = [0xcc1122, 0x1133cc, 0xffaa00, 0x228833, 0x9922aa, 0x1f8bff, 0xa763d3];
  const crowdSkin = [0xf0c080, 0xe0a56c, 0xd49a5b, 0xc48947];
  const spectatorList: SpectatorEntry[] = [];
  const bleacherMat = new THREE.MeshStandardMaterial({ color: 0x2b2b3f, roughness: 0.9, metalness: 0.12 });
  const bleachers = new THREE.Group();
  for (let side = -1; side <= 1; side += 2) {
    for (let row = 0; row < 7; row++) {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(AR * 2 + 3, 0.09, 0.48), bleacherMat);
      bench.position.set(0, 0.1 + row * 0.26, side * (AR + 0.7 + row * 0.34));
      bleachers.add(bench);
    }
  }
  if (!isWeak) {
    const buildSpec = (color: number, skin: number) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.54, 10), new THREE.MeshStandardMaterial({ color, roughness: 0.65 }));
      body.position.y = 0.32; body.castShadow = true; g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), new THREE.MeshStandardMaterial({ color: skin, roughness: 0.85 }));
      head.position.y = 0.78; head.castShadow = true; g.add(head);
      const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8), new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.7 }));
      armL.position.set(-0.16, 0.47, 0); armL.rotation.z = 0.4; g.add(armL);
      const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8), new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.7 }));
      armR.position.set(0.16, 0.47, 0); armR.rotation.z = -0.4; g.add(armR);
      const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.25, 7), new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 }));
      legL.position.set(-0.06, 0, 0); g.add(legL);
      const legR = legL.clone(); legR.position.x = 0.06; g.add(legR);
      return { g, armL, armR };
    };
    for (let side = -1; side <= 1; side += 2) {
      for (let row = 0; row < 7; row++) {
        const y = 0.1 + row * 0.26;
        for (let i = -10; i <= 10; i++) {
          if (Math.random() > 0.78) continue;
          const shirt = crowdShirtColors[Math.floor(Math.random() * crowdShirtColors.length)];
          const skin  = crowdSkin[Math.floor(Math.random() * crowdSkin.length)];
          const { g, armL, armR } = buildSpec(shirt, skin);
          g.position.set(i * 0.42, y + 0.18, side * (AR + 0.7 + row * 0.34 + side * 0.28));
          g.rotation.y = -side * 0.12;
          spectatorList.push({ group: g, armL, armR, animOffset: Math.random() * Math.PI * 2 });
          bleachers.add(g);
        }
      }
    }
  }
  scene.add(bleachers);

  // Banner walls + screens
  const bannerMat = new THREE.MeshStandardMaterial({ color: 0x121b34, roughness: 0.8, metalness: 0.2 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(AR * 1.8, 2.2, 0.25), bannerMat);
    wall.position.set(Math.cos(a) * (AR + 1.4), 1.6, Math.sin(a) * (AR + 1.4));
    wall.rotation.y = a + Math.PI / 2; scene.add(wall);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x66ccff, emissive: 0x66ccff, emissiveIntensity: 0.35, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
    );
    screen.position.set(Math.cos(a) * (AR + 1.35), 1.95, Math.sin(a) * (AR + 1.35));
    screen.rotation.y = a + Math.PI / 2; scene.add(screen);
  }

  // Stadium atmosphere lights — simple PointLights only, no SpotLights (too expensive)
  if (!isWeak) {
    const cornerColors = [0xffa500, 0x8888ff, 0xff6600, 0x44aaff];
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const light = new THREE.PointLight(cornerColors[i], 1.2, 55);
      light.position.set(Math.cos(angle) * (AR + 6), 9, Math.sin(angle) * (AR + 6));
      scene.add(light);
    }
  }

  // Map-specific visual effects
  let mapEffects: { update: (frame: number) => void } | undefined;

  if (mapId === "desert") {
    // Sand storm particles - fewer on mobile for performance
    const sandCount = isWeak ? 40 : 120;
    const sandPositions = new Float32Array(sandCount * 3);
    const sandVelocities: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < sandCount; i++) {
      sandPositions[i * 3] = (Math.random() - 0.5) * AR * 2;
      sandPositions[i * 3 + 1] = Math.random() * 4 + 0.5;
      sandPositions[i * 3 + 2] = (Math.random() - 0.5) * AR * 2;
      sandVelocities.push({
        x: (Math.random() - 0.5) * 0.08,
        y: (Math.random() - 0.5) * 0.02,
        z: (Math.random() - 0.5) * 0.08,
      });
    }
    const sandGeo = new THREE.BufferGeometry();
    sandGeo.setAttribute("position", new THREE.BufferAttribute(sandPositions, 3));
    const sandMat = new THREE.PointsMaterial({ color: 0xd4a055, size: isWeak ? 0.25 : 0.15, transparent: true, opacity: 0.6, depthWrite: false });
    const sandParticles = new THREE.Points(sandGeo, sandMat);
    scene.add(sandParticles);

    const updateInterval = isWeak ? 3 : 1; // Update less frequently on mobile
    mapEffects = {
      update: (frame: number) => {
        if (frame % updateInterval !== 0) return;
        const pos = sandGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < sandCount; i++) {
          pos[i * 3] += sandVelocities[i].x;
          pos[i * 3 + 1] += sandVelocities[i].y + Math.sin(frame * 0.02 + i) * 0.01;
          pos[i * 3 + 2] += sandVelocities[i].z;
          if (pos[i * 3] > AR) pos[i * 3] = -AR;
          if (pos[i * 3] < -AR) pos[i * 3] = AR;
          if (pos[i * 3 + 1] > 5) pos[i * 3 + 1] = 0.5;
          if (pos[i * 3 + 1] < 0.5) pos[i * 3 + 1] = 5;
          if (pos[i * 3 + 2] > AR) pos[i * 3 + 2] = -AR;
          if (pos[i * 3 + 2] < -AR) pos[i * 3 + 2] = AR;
        }
        sandGeo.attributes.position.needsUpdate = true;
      },
    };
  }

  if (mapId === "ice") {
    // Snow particles - fewer on mobile
    const snowCount = isWeak ? 50 : 150;
    const snowPositions = new Float32Array(snowCount * 3);
    const snowVelocities: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < snowCount; i++) {
      snowPositions[i * 3] = (Math.random() - 0.5) * AR * 2;
      snowPositions[i * 3 + 1] = Math.random() * 6;
      snowPositions[i * 3 + 2] = (Math.random() - 0.5) * AR * 2;
      snowVelocities.push({
        x: (Math.random() - 0.5) * 0.03,
        y: -0.02 - Math.random() * 0.02,
        z: (Math.random() - 0.5) * 0.03,
      });
    }
    const snowGeo = new THREE.BufferGeometry();
    snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPositions, 3));
    const snowMat = new THREE.PointsMaterial({ color: 0xffffff, size: isWeak ? 0.2 : 0.12, transparent: true, opacity: 0.8, depthWrite: false });
    const snowParticles = new THREE.Points(snowGeo, snowMat);
    scene.add(snowParticles);

    // Ice crystals on walls (desktop only)
    if (!isWeak) {
      const crystalGroup = new THREE.Group();
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const crystalGeo = new THREE.ConeGeometry(0.15, 0.4 + Math.random() * 0.3, 5);
        const crystalMat = new THREE.MeshStandardMaterial({
          color: 0xaaeeff,
          emissive: 0x66ccff,
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.7,
          roughness: 0.1,
          metalness: 0.3,
        });
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        crystal.position.set(Math.cos(angle) * (AR - 0.5), 1 + Math.random(), Math.sin(angle) * (AR - 0.5));
        crystal.rotation.x = Math.random() * 0.3;
        crystal.rotation.z = Math.random() * 0.3;
        crystalGroup.add(crystal);
      }
      scene.add(crystalGroup);
    }

    const updateInterval = isWeak ? 3 : 1;
    mapEffects = {
      update: (frame: number) => {
        if (frame % updateInterval !== 0) return;
        const pos = snowGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < snowCount; i++) {
          pos[i * 3] += snowVelocities[i].x + Math.sin(frame * 0.01 + i * 0.5) * 0.02;
          pos[i * 3 + 1] += snowVelocities[i].y;
          pos[i * 3 + 2] += snowVelocities[i].z + Math.cos(frame * 0.01 + i * 0.5) * 0.02;
          if (pos[i * 3 + 1] < 0.2) {
            pos[i * 3 + 1] = 6;
            pos[i * 3] = (Math.random() - 0.5) * AR * 2;
            pos[i * 3 + 2] = (Math.random() - 0.5) * AR * 2;
          }
        }
        snowGeo.attributes.position.needsUpdate = true;
      },
    };
  }

  if (mapId === "lava") {
    // Fire/Lava particles - fewer on mobile
    const fireCount = isWeak ? 35 : 80;
    const firePositions = new Float32Array(fireCount * 3);
    const fireVelocities: { x: number; y: number; z: number; life: number }[] = [];
    for (let i = 0; i < fireCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * (AR - 2);
      firePositions[i * 3] = Math.cos(angle) * r;
      firePositions[i * 3 + 1] = Math.random() * 0.5;
      firePositions[i * 3 + 2] = Math.sin(angle) * r;
      fireVelocities.push({
        x: (Math.random() - 0.5) * 0.04,
        y: 0.05 + Math.random() * 0.08,
        z: (Math.random() - 0.5) * 0.04,
        life: Math.random(),
      });
    }
    const fireGeo = new THREE.BufferGeometry();
    fireGeo.setAttribute("position", new THREE.BufferAttribute(firePositions, 3));
    const fireMat = new THREE.PointsMaterial({
      color: 0xff4400,
      size: isWeak ? 0.35 : 0.25,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const fireParticles = new THREE.Points(fireGeo, fireMat);
    scene.add(fireParticles);

    // Glowing lava cracks on floor (desktop only)
    if (!isWeak) {
      const crackMat = new THREE.MeshStandardMaterial({
        color: 0xff2200,
        emissive: 0xff4400,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.6,
      });
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const crack = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.05, AR * 0.7),
          crackMat,
        );
        crack.position.set(
          Math.cos(angle) * AR * 0.5,
          0.03,
          Math.sin(angle) * AR * 0.5,
        );
        crack.rotation.y = angle + Math.PI / 2;
        scene.add(crack);
      }

      // Lava bubbles
      const bubbleMat = new THREE.MeshStandardMaterial({
        color: 0xff3300,
        emissive: 0xff5500,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.8,
      });
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 2 + Math.random() * (AR - 4);
        const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.2 + Math.random() * 0.3, 8, 8), bubbleMat);
        bubble.position.set(Math.cos(angle) * r, 0.1, Math.sin(angle) * r);
        scene.add(bubble);
      }
    }

    const updateInterval = isWeak ? 3 : 1;
    mapEffects = {
      update: (frame: number) => {
        if (frame % updateInterval !== 0) return;
        const pos = fireGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < fireCount; i++) {
          pos[i * 3] += fireVelocities[i].x + Math.sin(frame * 0.05 + i) * 0.02;
          pos[i * 3 + 1] += fireVelocities[i].y;
          pos[i * 3 + 2] += fireVelocities[i].z + Math.cos(frame * 0.05 + i) * 0.02;
          fireVelocities[i].life += 0.02;
          if (pos[i * 3 + 1] > 3 || fireVelocities[i].life > 1) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * (AR - 2);
            pos[i * 3] = Math.cos(angle) * r;
            pos[i * 3 + 1] = 0.1;
            pos[i * 3 + 2] = Math.sin(angle) * r;
            fireVelocities[i].life = 0;
          }
        }
        fireGeo.attributes.position.needsUpdate = true;
      },
    };
  }

  return { camera, ambientLight, sun, arenaLight, ring, clouds, cloudMat, spectatorList, skyNight, skyDay, fogNight, fogDay, ambNight, ambDay, DAY_CYCLE, arenaRadius: AR, mapEffects };
}
