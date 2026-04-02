import * as THREE from "three";

const AR = 18;

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
}

export function buildArena(scene: THREE.Scene, isMobile: boolean): ArenaResult {
  // Starfield
  {
    const starCount = isMobile ? 500 : 1800;
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
  if (!isMobile) {
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
  const skyNight = new THREE.Color(0x050010);
  const skyDay   = new THREE.Color(0xadd8e6);
  const fogNight = new THREE.Color(0x0a0020);
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
    new THREE.CylinderGeometry(AR, AR, 0.4, isMobile ? 24 : 64),
    new THREE.MeshStandardMaterial({ color: 0x302f55, roughness: 0.95 }),
  );
  floor.position.y = -0.2; floor.receiveShadow = true; scene.add(floor);
  const grid = new THREE.GridHelper(AR * 2, 40, 0x553366, 0x221122);
  grid.position.y = 0.02; scene.add(grid);
  const centerField = new THREE.Mesh(
    new THREE.RingGeometry(0.6, AR - 1.3, isMobile ? 32 : 96),
    new THREE.MeshStandardMaterial({ color: 0x101428, roughness: 0.95, metalness: 0.05, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }),
  );
  centerField.rotation.x = -Math.PI / 2; centerField.position.y = -0.145; scene.add(centerField);
  const ringFloor = new THREE.Mesh(
    new THREE.RingGeometry(1.5, 3.2, isMobile ? 32 : 96),
    new THREE.MeshStandardMaterial({ color: 0x44527b, roughness: 0.9, metalness: 0.15, side: THREE.DoubleSide }),
  );
  ringFloor.rotation.x = -Math.PI / 2; ringFloor.position.y = -0.14; scene.add(ringFloor);

  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x12112b, roughness: 0.85, emissive: new THREE.Color(0x180a40), emissiveIntensity: 0.25, side: THREE.DoubleSide });
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
    new THREE.TorusGeometry(AR, 0.18, 6, isMobile ? 32 : 64),
    new THREE.MeshBasicMaterial({ color: 0xff2244 }),
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
  if (!isMobile) {
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

  // Stadium lights
  if (!isMobile) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const light = new THREE.SpotLight(0xffffff, 1.6, 80, Math.PI / 6, 0.35, 1);
      light.position.set(Math.cos(angle) * (AR + 3), 8.3, Math.sin(angle) * (AR + 3));
      light.target.position.set(0, 0, 0); scene.add(light); scene.add(light.target);
    }
    const cornerColors = [0xffa500, 0xffffff];
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const light = new THREE.SpotLight(cornerColors[i % 2], 2.2, 60, 0.5, 0.5, 1);
      light.position.set(Math.cos(angle) * (AR + 9), 10, Math.sin(angle) * (AR + 9));
      light.target.position.set(0, 0, 0); scene.add(light); scene.add(light.target);
    }
  }

  return { camera, ambientLight, sun, arenaLight, ring, clouds, cloudMat, spectatorList, skyNight, skyDay, fogNight, fogDay, ambNight, ambDay, DAY_CYCLE };
}
