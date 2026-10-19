// Procedural astronaut: white suit, orange accents, round helmet with a gold-tinted visor, backpack.
// Faces +z. Returns { group, limbs } where limbs are pivots at the shoulders/hips for the walk cycle.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function buildAstronaut() {
  const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, ...o });
  const white = std(0xffffff, { emissive: 0x9aa0b4, emissiveIntensity: 0.35 }), grey = std(0xc8d0de, { emissive: 0x555a68, emissiveIntensity: 0.25 }), orange = std(0xff7a1a), dark = std(0x2a2f3a), panel = std(0x1c2230);
  const visor = std(0x2b3560, { metalness: 0.9, roughness: 0.15, emissive: 0xb07a12, emissiveIntensity: 0.55 });
  const root = new THREE.Group(), limbs = {};
  const mk = (geo, mat, x, y, z, parent = root) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
  const rb = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 3, r);

  // torso, belt, chest panel, backpack
  mk(rb(0.95, 1.0, 0.62, 0.22), white, 0, 1.5, 0);
  mk(rb(0.99, 0.14, 0.66, 0.06), orange, 0, 1.08, 0);
  const cp = mk(rb(0.46, 0.3, 0.06, 0.03), panel, 0, 1.6, 0.33);
  [[-0.12, 0xff5a5a], [0, 0x5aff8a], [0.12, 0x5ab0ff]].forEach(([x, c]) => mk(new THREE.SphereGeometry(0.04, 8, 6), std(c, { emissive: c, emissiveIntensity: 0.9 }), x, 1.6, 0.37));
  mk(rb(0.78, 0.98, 0.4, 0.12), grey, 0, 1.52, -0.5);
  mk(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 8), dark, 0.3, 1.52, -0.72).rotation.z = 0;

  // neck ring, helmet, visor, antenna
  mk(new THREE.CylinderGeometry(0.42, 0.46, 0.18, 20), grey, 0, 2.02, 0);
  mk(new THREE.SphereGeometry(0.62, 28, 22), white, 0, 2.55, 0);
  const v = mk(new THREE.SphereGeometry(0.5, 28, 20), visor, 0, 2.55, 0.26); v.scale.set(1.05, 0.88, 0.7);
  mk(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), 0.22, 2.7, 0.62);
  mk(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6), grey, -0.5, 3.0, -0.05);
  mk(new THREE.SphereGeometry(0.07, 8, 6), std(0xff4a4a, { emissive: 0xff2a2a, emissiveIntensity: 0.9 }), -0.5, 3.22, -0.05);

  // limbs hang from pivots so the walk cycle just rotates them
  const limb = (name, x, y, len, r, glove, boot) => {
    const piv = new THREE.Group(); piv.position.set(x, y, 0); root.add(piv); limbs[name] = piv;
    mk(new THREE.CapsuleGeometry(r, len, 6, 12), white, 0, -len / 2 - r * 0.2, 0, piv);
    if (glove) mk(new THREE.SphereGeometry(r * 1.15, 12, 10), orange, 0, -len - r * 0.8, 0, piv);
    if (boot) { mk(rb(r * 2.1, 0.24, r * 3.2, 0.09), grey, 0, -len - r * 1.1, r * 0.5, piv); mk(rb(r * 2.15, 0.07, r * 3.25, 0.03), orange, 0, -len - r * 1.1 + 0.1, r * 0.5, piv); }
  };
  limb('armLeft', -0.66, 1.9, 0.62, 0.17, true, false);
  limb('armRight', 0.66, 1.9, 0.62, 0.17, true, false);
  limb('legLeft', -0.25, 1.0, 0.55, 0.2, false, true);
  limb('legRight', 0.25, 1.0, 0.55, 0.2, false, true);
  root.scale.setScalar(0.82);
  return { group: root, limbs };
}
