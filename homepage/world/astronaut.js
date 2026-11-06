// Procedural EVA astronaut: quilted white suit, hard upper torso with a chest control module, life-support backpack with
// tanks and hoses, bubble helmet with a gold sun visor and lamps, bellows joints, articulated gloves and treaded boots.
// Faces +z. Returns { group, limbs } where limbs are pivots at the shoulders/hips for the walk cycle (rotation.x only).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// quilted Beta-cloth texture + matching bump map
function fabric() {
  const mkc = (bg) => { const c = document.createElement('canvas'); c.width = c.height = 256; const k = c.getContext('2d'); k.fillStyle = bg; k.fillRect(0, 0, 256, 256); return [c, k]; };
  const [c, k] = mkc('#f1f0ea'), [b, kb] = mkc('#808080'); let s = 99; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < 6000; i++) { k.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '150,150,140'},${0.05 + r() * 0.08})`; k.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1 + r() * 2); }
  for (let i = -256; i < 512; i += 32) { for (const [x1, y1, x2, y2] of [[i, 0, i + 256, 256], [i, 256, i + 256, 0]]) {   // diamond quilting
    k.strokeStyle = 'rgba(120,120,110,.35)'; k.lineWidth = 2; k.beginPath(); k.moveTo(x1, y1); k.lineTo(x2, y2); k.stroke();
    kb.strokeStyle = '#2a2a2a'; kb.lineWidth = 4; kb.beginPath(); kb.moveTo(x1, y1); kb.lineTo(x2, y2); kb.stroke(); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace, t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); t.anisotropy = 4;
  const bt = new THREE.CanvasTexture(b); bt.wrapS = bt.wrapT = THREE.RepeatWrapping; bt.repeat.set(2, 2); return [t, bt];
}
// small studio-like environment so the visor / metal parts have something to reflect
function studioEnv() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const k = c.getContext('2d'), g = k.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, '#6fa8ee'); g.addColorStop(0.45, '#e8f2fb'); g.addColorStop(0.55, '#b9c7a0'); g.addColorStop(1, '#5a6b3c'); k.fillStyle = g; k.fillRect(0, 0, 256, 128);
  k.fillStyle = 'rgba(255,250,235,.95)'; k.beginPath(); k.arc(150, 30, 14, 0, 7); k.fill();
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildAstronaut() {
  const [map, bump] = fabric(), env = studioEnv();
  const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });
  const suit = new THREE.MeshStandardMaterial({ color: 0xffffff, map, bumpMap: bump, bumpScale: 2.2, roughness: 0.82, emissive: 0x8d93a6, emissiveIntensity: 0.18 });
  const hard = std(0xe9ebef, { roughness: 0.4, metalness: 0.1, emissive: 0x7a8092, emissiveIntensity: 0.15, envMap: env, envMapIntensity: 0.5 });
  const metal = std(0xb9bfca, { roughness: 0.28, metalness: 0.85, envMap: env, envMapIntensity: 1.1 });
  const darkM = std(0x30343e, { roughness: 0.5, metalness: 0.6, envMap: env, envMapIntensity: 0.6 });
  const rubber = std(0x23262d, { roughness: 0.95 });
  const orange = std(0xf26a14, { roughness: 0.5 }), red = std(0xd02a22, { roughness: 0.55 });
  const gold = std(0xc8932a, { roughness: 0.06, metalness: 1, envMap: env, envMapIntensity: 1.9, emissive: 0x2a1a02, emissiveIntensity: 0.25 });
  const glass = std(0xb8d4f0, { roughness: 0.04, metalness: 0.2, transparent: true, opacity: 0.16, envMap: env, envMapIntensity: 1.2, depthWrite: false });
  const lampM = new THREE.MeshBasicMaterial({ color: 0xfff6d8 });
  const screen = std(0x0d2b44, { emissive: 0x2a8fe0, emissiveIntensity: 0.9 });

  const root = new THREE.Group(), limbs = {};
  const mk = (geo, mat, x, y, z, parent = root) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const rb = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 4, r);
  const cap = (r, len) => new THREE.CapsuleGeometry(r, len, 8, 18);
  const ring = (R, t, mat, x, y, z, parent, seg = 22) => { const m = mk(new THREE.TorusGeometry(R, t, 8, seg), mat, x, y, z, parent); m.rotation.x = Math.PI / 2; return m; };
  const cyl = (rt, rb_, h, mat, x, y, z, parent = root, seg = 18) => mk(new THREE.CylinderGeometry(rt, rb_, h, seg), mat, x, y, z, parent);

  // ---- hard upper torso, waist bearing, quilted lower torso
  { const t = mk(rb(0.98, 1.0, 0.66, 0.3), suit, 0, 1.52, 0); t.scale.set(1, 1, 1); }
  mk(rb(0.86, 0.34, 0.6, 0.14), suit, 0, 1.02, 0);                                   // abdomen
  ring(0.43, 0.045, metal, 0, 1.2, 0, root, 28).scale.set(1.08, 0.8, 0.78);            // waist bearing
  mk(rb(1.0, 0.1, 0.66, 0.05), orange, 0, 0.86, 0, root).scale.set(0.93, 1, 0.9);     // belt / brief
  for (const sx of [-0.52, 0.52]) mk(new THREE.SphereGeometry(0.27, 20, 16), hard, sx * 0.9, 1.88, 0).scale.set(0.9, 0.8, 0.9);   // shoulder bearing caps
  // chest control module: display, switches, ports, labels
  mk(rb(0.54, 0.38, 0.16, 0.05), hard, 0, 1.55, 0.35);
  mk(rb(0.36, 0.13, 0.03, 0.015), screen, 0, 1.63, 0.44);
  [[-0.18, red], [-0.06, orange], [0.06, std(0x2fbf6a, { emissive: 0x1f8f4a, emissiveIntensity: 0.6 })], [0.18, std(0x3a8fe8, { emissive: 0x2064b0, emissiveIntensity: 0.6 })]].forEach(([x, m]) => cyl(0.028, 0.028, 0.05, m, x, 1.48, 0.45, root, 10).rotation.x = Math.PI / 2);
  mk(rb(0.4, 0.035, 0.02, 0.01), darkM, 0, 1.41, 0.44);
  for (const [sx, m] of [[-1, std(0x3a8fe8, { roughness: 0.3, metalness: 0.5 })], [1, red]]) cyl(0.055, 0.055, 0.12, m, sx * 0.3, 1.5, 0.37, root, 14).rotation.z = Math.PI / 2 * 0 + Math.PI / 2;   // oxygen / water ports
  mk(rb(0.18, 0.12, 0.05, 0.02), metal, -0.35, 1.78, 0.3);                           // collar clip

  // ---- life-support backpack: body, tanks, vents, hoses, antenna
  mk(rb(0.84, 1.08, 0.46, 0.13), hard, 0, 1.55, -0.55);
  mk(rb(0.7, 0.18, 0.4, 0.07), hard, 0, 2.17, -0.55);
  for (let i = 0; i < 6; i++) mk(rb(0.6, 0.018, 0.02, 0.005), darkM, 0, 1.15 + i * 0.07, -0.79);                // vent slats
  for (const sx of [-0.52, 0.52]) { cyl(0.11, 0.11, 0.78, metal, sx, 1.55, -0.55, root, 16); mk(new THREE.SphereGeometry(0.11, 14, 10), metal, sx, 1.94, -0.55); ring(0.115, 0.018, orange, sx, 1.4, -0.55, root, 16).rotation.x = Math.PI / 2; }
  mk(rb(0.34, 0.2, 0.06, 0.03), darkM, 0, 1.7, -0.79); mk(rb(0.2, 0.08, 0.02, 0.01), screen, 0, 1.72, -0.82);
  cyl(0.02, 0.02, 0.5, metal, -0.38, 2.4, -0.6, root, 6);
  mk(new THREE.SphereGeometry(0.045, 10, 8), std(0xff3a3a, { emissive: 0xff2a2a, emissiveIntensity: 1 }), -0.38, 2.66, -0.6);

  // ---- neck ring and helmet
  cyl(0.44, 0.5, 0.2, metal, 0, 2.06, 0, root, 28); ring(0.46, 0.04, darkM, 0, 2.16, 0, root, 28);
  const hc = 2.6;
  { const back = new THREE.SphereGeometry(0.68, 40, 26, Math.PI / 2 + 1.05, Math.PI * 2 - 2.1); mk(back, hard, 0, hc, 0).material.side = THREE.DoubleSide;        // rear shell
    const top = new THREE.SphereGeometry(0.68, 40, 14, Math.PI / 2 - 1.05, 2.1, 0, 0.62); const tm = mk(top, hard, 0, hc, 0); tm.material = hard.clone(); tm.material.side = THREE.DoubleSide; }  // brow
  mk(new THREE.SphereGeometry(0.66, 40, 26, Math.PI / 2 - 1.05, 2.1, 0.58, 1.55), gold, 0, hc, 0.01).material.side = THREE.DoubleSide;                                    // gold visor
  mk(new THREE.SphereGeometry(0.7, 36, 24), glass, 0, hc, 0);                                                                                                              // bubble
  mk(new THREE.SphereGeometry(0.42, 22, 16), std(0x14171f, { roughness: 0.9 }), 0, hc, -0.05);                                                                             // head inside
  ring(0.6, 0.05, metal, 0, hc - 0.46, 0.02, root, 36).scale.set(1, 1, 0.95);                                                                                                // neck seal
  for (const sx of [-1, 1]) { mk(rb(0.13, 0.13, 0.2, 0.04), darkM, sx * 0.66, hc + 0.18, 0.14); mk(new THREE.SphereGeometry(0.052, 10, 8), lampM, sx * 0.66, hc + 0.18, 0.26); }  // helmet lamps
  mk(rb(0.16, 0.12, 0.2, 0.04), darkM, 0.42, hc + 0.5, 0.2); mk(new THREE.CylinderGeometry(0.035, 0.035, 0.07, 10), std(0x15202b, { metalness: 0.9, roughness: 0.15 }), 0.42, hc + 0.5, 0.32).rotation.x = Math.PI / 2;   // camera

  // ---- limbs hang from pivots so the walk cycle just rotates them
  const bellows = (parent, y, r, n, gap) => { for (let i = 0; i < n; i++) ring(r, 0.034, suit, 0, y - i * gap, 0, parent, 18); };
  const glove = piv => {
    cyl(0.165, 0.165, 0.07, metal, 0, -0.8, 0, piv, 18); ring(0.17, 0.028, orange, 0, -0.85, 0, piv, 18);                  // wrist ring, cuff
    mk(rb(0.2, 0.17, 0.14, 0.05), suit, 0, -0.95, 0, piv);                                                                 // palm
    [-0.07, -0.023, 0.023, 0.07].forEach((x, i) => { const f = mk(cap(0.032, 0.09 + (i === 1 || i === 2 ? 0.02 : 0)), suit, x, -1.07, 0.02, piv); f.rotation.x = -0.35; });   // fingers, slightly curled
    const th = mk(cap(0.036, 0.08), suit, 0.12, -0.96, 0.03, piv); th.rotation.set(-0.3, 0, -0.7);                           // thumb
    mk(rb(0.18, 0.04, 0.04, 0.015), rubber, 0, -0.95, 0.08, piv);                                                          // grip pad
  };
  const arm = (name, sx) => {
    const piv = new THREE.Group(); piv.position.set(sx * 0.68, 1.9, 0); root.add(piv); limbs[name] = piv;
    mk(new THREE.SphereGeometry(0.19, 18, 14), hard, 0, 0, 0, piv);
    mk(cap(0.165, 0.16), suit, 0, -0.2, 0, piv);                                                                            // upper arm
    ring(0.17, 0.03, sx > 0 ? red : orange, 0, -0.16, 0, piv, 18);                                                          // arm stripe
    bellows(piv, -0.4, 0.15, 3, 0.055);                                                                                      // elbow bellows
    mk(cap(0.14, 0.14), suit, 0, -0.58, 0, piv);                                                                            // forearm
    glove(piv); return piv;
  };
  arm('armLeft', -1); arm('armRight', 1);
  const leg = (name, sx) => {
    const piv = new THREE.Group(); piv.position.set(sx * 0.25, 1.0, 0); root.add(piv); limbs[name] = piv;
    mk(cap(0.21, 0.2), suit, 0, -0.2, 0, piv);                                                                              // thigh
    ring(0.215, 0.03, red, 0, -0.14, 0, piv, 20); ring(0.215, 0.03, red, 0, -0.2, 0, piv, 20);                              // command stripes
    bellows(piv, -0.42, 0.185, 3, 0.055);                                                                                    // knee bellows
    mk(cap(0.175, 0.1), suit, 0, -0.52, 0, piv);                                                                            // shin
    cyl(0.185, 0.2, 0.07, metal, 0, -0.66, 0, piv, 20);                                                                      // ankle ring
    const boot = mk(rb(0.4, 0.26, 0.62, 0.11), suit, 0, -0.78, 0.09, piv); boot.scale.set(1, 1, 1);
    mk(rb(0.42, 0.08, 0.66, 0.035), rubber, 0, -0.92, 0.09, piv);                                                            // sole
    for (let i = 0; i < 4; i++) mk(rb(0.43, 0.018, 0.045, 0.006), darkM, 0, -0.965, -0.12 + i * 0.15, piv);                    // tread lugs
    mk(rb(0.3, 0.16, 0.16, 0.06), hard, 0, -0.79, 0.34, piv);                                                                // toe cap
    return piv;
  };
  leg('legLeft', -1); leg('legRight', 1);

  root.scale.setScalar(0.82);
  return { group: root, limbs };
}
