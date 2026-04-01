import * as THREE from "three";

export const SKIN_TONES = [0xc68642, 0x8d5524, 0xf1c27d, 0xe0ac69, 0xd49560];

export function buildPlayerRig(): {
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
