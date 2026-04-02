import * as THREE from "three";

export function buildEnemyRig(type: number): {
  group: THREE.Group;
  hpFg: THREE.Mesh;
  col: number;
  arms: Array<{ upper: THREE.Group; lower: THREE.Group; side: number }>;
  legs: Array<{ upper: THREE.Group; lower: THREE.Group; side: number }>;
} {
  const g = new THREE.Group();
  const configs = [
    { col: 0xe74c3c, scale: 1.0 },
    { col: 0xff8800, scale: 0.85 },
    { col: 0xaa22ff, scale: 1.4 },
  ];
  const cfg = configs[type % 3];
  const col = cfg.col;
  const sc = cfg.scale;

  const skinM = new THREE.MeshStandardMaterial({ color: 0xd4a276, roughness: 0.8 });
  const bodyM = new THREE.MeshStandardMaterial({
    color: col, roughness: 0.6,
    emissive: new THREE.Color(col).multiplyScalar(0.25),
  });
  const darkM = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * sc, 0.17 * sc, 0.55 * sc, 8), bodyM);
  torso.position.y = 0.85 * sc; torso.castShadow = true; g.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22 * sc, 10, 10), skinM);
  head.position.y = 1.38 * sc; head.castShadow = true; g.add(head);

  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.055 * sc, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffff00 }),
    );
    eye.position.set(s * 0.09 * sc, 1.42 * sc, 0.18 * sc);
    g.add(eye);
  }

  const arms: Array<{ upper: THREE.Group; lower: THREE.Group; side: number }> = [];
  for (const s of [-1, 1]) {
    const armUpper = new THREE.Group();
    armUpper.position.set(s * 0.3 * sc, 1.0 * sc, 0);
    g.add(armUpper);
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.11 * sc, 7, 7), bodyM);
    armUpper.add(shoulder);
    const armLower = new THREE.Group();
    armLower.position.set(0, -0.18 * sc, 0);
    armUpper.add(armLower);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * sc, 0.06 * sc, 0.55 * sc, 6), bodyM);
    arm.position.set(0, -0.22 * sc, 0); armLower.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.07 * sc, 6, 6), skinM);
    hand.position.set(0, -0.35 * sc, 0); armLower.add(hand);
    arms.push({ upper: armUpper, lower: armLower, side: s });
  }

  const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.19 * sc, 0.18 * sc, 0.34 * sc, 8), darkM);
  shorts.position.y = 0.54 * sc; g.add(shorts);

  const legs: Array<{ upper: THREE.Group; lower: THREE.Group; side: number }> = [];
  for (const s of [-1, 1]) {
    const upperLeg = new THREE.Group();
    upperLeg.position.set(s * 0.12 * sc, 0.34 * sc, 0);
    g.add(upperLeg);
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.085 * sc, 0.075 * sc, 0.36 * sc, 7), skinM);
    thigh.castShadow = true; thigh.position.y = -0.18 * sc; upperLeg.add(thigh);
    const lowerLeg = new THREE.Group();
    lowerLeg.position.set(0, -0.36 * sc, 0); upperLeg.add(lowerLeg);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.065 * sc, 0.055 * sc, 0.33 * sc, 7), skinM);
    shin.position.y = -0.16 * sc; lowerLeg.add(shin);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.14 * sc, 0.09 * sc, 0.26 * sc), darkM);
    shoe.position.set(0, -0.25 * sc, 0.03 * sc); lowerLeg.add(shoe);
    legs.push({ upper: upperLeg, lower: lowerLeg, side: s });
  }

  const hpBg = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.09, 0.04),
    new THREE.MeshBasicMaterial({ color: 0x330000 }),
  );
  hpBg.position.set(0, 1.85 * sc, 0); g.add(hpBg);
  const hpFg = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.09, 0.05),
    new THREE.MeshBasicMaterial({ color: 0xff2244 }),
  );
  hpFg.position.set(0, 1.85 * sc, 0.02); g.add(hpFg);

  return { group: g, hpFg, col, arms, legs };
}
