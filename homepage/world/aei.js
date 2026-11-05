// Max Planck Institute for Gravitational Physics (AEI Hannover) and the plaza black-hole sculpture.
// Frosted green ribbed cladding in a dark steel frame, a clear-glazed clerestory, a red entrance block,
// glazed bridge, lamp posts, and the spinning LISA triangle (three gold-foil spacecraft with solar wings,
// high-gain dishes and red laser arms). Modelled on reference-assets/buildings/aei-hannover/.
import * as THREE from 'three';
import { Batch, I, mat4, materials, parts, glassExtrude, rect, sbox } from './detail.js';
import { flagpole, brandenburg } from './props.js';

// vertical rib pattern for the translucent cladding (tile = 4 world units, ~24 ribs)
const claddingTex = () => {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const k = c.getContext('2d');
  for (let i = 0; i < 24; i++) {
    const g = k.createLinearGradient(i * 10.667, 0, (i + 1) * 10.667, 0); g.addColorStop(0, '#a9dcc6'); g.addColorStop(0.5, '#c7ecdb'); g.addColorStop(1, '#8fcdb4');
    k.fillStyle = g; k.fillRect(i * 10.667, 0, 10.7, 64);
  }
  k.fillStyle = 'rgba(30,70,55,.18)'; for (let i = 0; i <= 24; i++) k.fillRect(i * 10.667 - 0.5, 0, 1.2, 64);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
};
const solarTex = () => {
  const c = document.createElement('canvas'); c.width = 128; c.height = 64; const k = c.getContext('2d');
  k.fillStyle = '#12285e'; k.fillRect(0, 0, 128, 64); k.strokeStyle = '#7f9ad6'; k.lineWidth = 1.5;
  for (let x = 0; x <= 128; x += 16) { k.beginPath(); k.moveTo(x, 0); k.lineTo(x, 64); k.stroke(); } for (let y = 0; y <= 64; y += 16) { k.beginPath(); k.moveTo(0, y); k.lineTo(128, y); k.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

export function aei(g, spinners, o = {}) {
  const M = materials({ stone: { light: ['#c9ccd0', '#c1c5ca', '#d0d3d6'], dark: ['#a9aeb4'], mortar: '#9298a0', courses: [60, 20], widths: [100, 100], seed: 9, pits: 800 }, trim: 0xe6e9ec, plinth: 0xb5b9bf, bumpScale: 0.5 });
  const { glass, plinth } = M;
  const steel = new THREE.MeshStandardMaterial({ color: 0x4a5868, metalness: 0.15, roughness: 0.5 });
  const green = new THREE.MeshStandardMaterial({ map: claddingTex(), emissiveMap: null, color: 0xffffff, emissive: 0x2f6a52, emissiveIntensity: 0.35, roughness: 0.5, metalness: 0.05 });
  const red = new THREE.MeshStandardMaterial({ color: 0xd8344a, emissive: 0x6a1020, emissiveIntensity: 0.25, roughness: 0.35, metalness: 0.1 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xf0e8c8, roughness: 0.6 });
  const B = new Batch();
  const { bx, col } = parts(B, M);
  const cladBox = (w, h, d, x, y, z) => B.add(sbox(w, h, d), green, mat4(x, y + h / 2, z));
  const curtain = (base, x, y, w, h, nc, nr, mw = 0.07) => {
    const pw = w / nc, ph = h / nr;
    for (let i = 0; i < nc; i++) for (let j = 0; j < nr; j++) B.add(glassExtrude(rect(pw - mw, ph - mw), 0.03), glass, base.clone().multiply(mat4(x - w / 2 + i * pw + pw / 2, y + j * ph + mw / 2, 0.02)));
    for (let i = 0; i <= nc; i++) bx(steel, mw, h + mw, 0.12, x - w / 2 + i * pw, y - mw / 2, 0.06, base);
    for (let j = 0; j <= nr; j++) bx(steel, w + mw, mw, 0.12, x, y + j * ph - mw / 2, 0.06, base);
  };
  // steel frame around a cladded volume: corner posts, base and top rails
  const frame = (w, h, d, x, y, z) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(steel, 0.16, h, 0.16, x + sx * (w / 2), y, z + sz * (d / 2));
    bx(steel, w + 0.3, 0.2, d + 0.3, x, y + h, z); bx(steel, w + 0.1, 0.14, d + 0.1, x, y, z);
  };

  // ================================================================ main laboratory hall
  const HX = -1, HW = 13, HH = 4.2, HD = 5.4;
  bx(plinth, HW + 0.4, 0.45, HD + 0.4, HX, 0, 0);
  cladBox(HW, HH, HD, HX, 0.1, 0); frame(HW, HH, HD, HX, 0.1, 0);
  bx(steel, HW + 0.1, 0.1, HD + 0.1, HX, 2.3, 0);                                    // mid rail
  const hf = mat4(0, 0, HD / 2);
  curtain(hf, HX + 4.6, 0.7, 3.0, 2.6, 3, 2);                                       // glazed corner by the entrance
  // ================================================================ upper volume with clear clerestory
  const UX = 2.2, UW = 8, UH = 3.4, UD = 5, UZ = -0.8;
  cladBox(UW, UH * 0.5, UD, UX, 4.3, UZ);
  frame(UW, UH, UD, UX, 4.3, UZ);
  curtain(mat4(UX, 0, UZ + UD / 2), 0, 6.0, UW - 0.5, 1.5, 8, 2);
  curtain(mat4(UX, 0, UZ - UD / 2, Math.PI), 0, 6.0, UW - 0.5, 1.5, 8, 2);
  curtain(mat4(UX + UW / 2, 0, UZ, Math.PI / 2), 0, 6.0, UD - 0.5, 1.5, 4, 2);
  bx(steel, UW - 0.3, 1.5, UD - 0.3, UX, 6.0, UZ); bx(M.trim, UW, 0.12, UD, UX, 7.6, UZ);   // dark interior core behind the clerestory, roof slab
  // rooftop: plant boxes, a lab vent stack, an antenna mast
  bx(steel, 2.2, 0.9, 1.4, 0, 7.9, UZ - 1.0); bx(M.trim, 1.4, 0.7, 1.2, 4.2, 7.9, UZ + 0.8);
  col(steel, 0.05, 0.08, 4.0, 4.6, 7.7, UZ - 1.6, 6); for (let i = 0; i < 3; i++) bx(steel, 0.6, 0.04, 0.04, 4.6, 10.2 + i * 0.5, UZ - 1.6);

  // ================================================================ red entrance block + glazed bridge
  const RX = 8.2, RZ = -2.6;
  B.add(sbox(3, 4.2, 3.4), red, mat4(RX, 2.1, RZ)); frame(3, 4.2, 3.4, RX, 0, RZ);
  curtain(mat4(RX, 0, RZ + 1.7), 0, 0.6, 2.2, 3.0, 3, 3);
  bx(steel, 3.4, 0.14, 1.6, RX, 4.2, RZ + 0.6);
  // bridge from hall to red block
  bx(steel, 3.4, 0.15, 1.5, 5.7, 2.2, RZ); curtain(mat4(5.7, 0, RZ + 0.75), 0, 2.35, 3.0, 1.2, 4, 1); bx(steel, 3.4, 0.15, 1.5, 5.7, 3.6, RZ);
  bx(green, 3.2, 0.05, 1.4, 5.7, 3.75, RZ);
  // lamp posts (dark column, cream cap) and a name stele
  for (const [x, z] of [[-4.6, 4.4], [3.2, 4.2], [6.5, 3.0]]) { col(steel, 0.07, 0.07, 3.3, x, 0, z, 8); col(cream, 0.09, 0.09, 0.6, x, 3.3, z, 8); }
  bx(M.trim, 0.8, 2.3, 0.14, -7.4, 0, 4.3); bx(new THREE.MeshStandardMaterial({ color: 0x1d4fb5 }), 0.8, 0.3, 0.16, -7.4, 2.3, 4.3);
  B.flush(g);

  // ================================================================ LISA sculpture: spinning triangle of spacecraft
  const L = new THREE.Group(); L.position.set(-1, 11, 0); g.add(L);
  const R = 3.4, pts = [0, 1, 2].map(i => new THREE.Vector3(Math.cos(i * 2.094) * R, 0, Math.sin(i * 2.094) * R));
  const foil = new THREE.MeshStandardMaterial({ color: 0xf0c050, metalness: 0.25, roughness: 0.3, emissive: 0x4a3200, emissiveIntensity: 0.5 });
  const panel = new THREE.MeshStandardMaterial({ map: solarTex(), metalness: 0.15, roughness: 0.45, emissive: 0x0a1633, emissiveIntensity: 0.5 });
  const dish = new THREE.MeshStandardMaterial({ color: 0xe8ebef, metalness: 0.15, roughness: 0.4, side: THREE.DoubleSide });
  const laser = new THREE.MeshBasicMaterial({ color: 0xff4a4a });
  const add = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
  pts.forEach((p, i) => {
    const sc = new THREE.Group(); sc.position.copy(p); sc.rotation.y = -i * 2.094 + Math.PI / 2; L.add(sc);
    add(new THREE.CylinderGeometry(0.55, 0.62, 0.38, 6), foil, 0, 0, 0, sc);                          // hexagonal gold-foil body
    add(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 6), steel, 0, 0.24, 0, sc);
    for (const s of [-1, 1]) { add(new THREE.BoxGeometry(1.35, 0.04, 0.55), panel, s * 1.15, 0.02, 0, sc); add(new THREE.BoxGeometry(0.5, 0.04, 0.04), steel, s * 0.6, 0.02, 0, sc); }   // solar wings
    const d = add(new THREE.SphereGeometry(0.34, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), dish, 0, 0.34, 0.55, sc); d.rotation.x = Math.PI / 2.2;   // high-gain antenna
    add(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 5), steel, 0, 0.3, 0.45, sc).rotation.x = Math.PI / 2.4;
    add(new THREE.SphereGeometry(0.08, 8, 6), laser, 0, 0, 0.62, sc);
  });
  [[0, 1], [1, 2], [2, 0]].forEach(([a, b]) => {
    const dv = pts[b].clone().sub(pts[a]), arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, dv.length(), 6), laser);
    arm.position.copy(pts[a]).addScaledVector(dv, 0.5); arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dv.clone().normalize()); L.add(arm);
    const halo = arm.clone(); halo.material = new THREE.MeshBasicMaterial({ color: 0xff7a7a, transparent: true, opacity: 0.22 }); halo.scale.set(3, 1, 3); L.add(halo);
  });
  add(new THREE.SphereGeometry(0.3, 12, 10), steel, 0, 0, 0, L);
  for (const p of pts) { const dv = p.clone(), s = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, dv.length(), 5), steel); s.position.copy(dv).multiplyScalar(0.5); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dv.normalize()); L.add(s); }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 7.6, 10), steel); pole.position.set(-1, 4 + 3.8, 0); pole.castShadow = true; g.add(pole);
  spinners.push(L);

  const P = []; if (o.props !== false) { brandenburg(g, -14, 4); flagpole(g, 'germany', 11, 6, spinners, 6.5); P.push({ x: -14, z: 4, r: 4.8, prop: true }, { x: 11, z: 6, r: 0.5, prop: true }); }
  return { r: 9, front: 7.6, h: 15, cols: [...P, { x: -1, z: 0, r: 6.8 }, { x: 8.2, z: -2.6, r: 2.2 }] };
}

// ---------------------------------------------------------------- plaza centrepiece: spinning black-hole sculpture
const discTex = () => {
  const c = document.createElement('canvas'); c.width = c.height = 256; const k = c.getContext('2d');
  const g = k.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.42, 'rgba(0,0,0,0)'); g.addColorStop(0.46, 'rgba(255,248,220,1)'); g.addColorStop(0.58, 'rgba(255,196,90,1)');
  g.addColorStop(0.75, 'rgba(255,120,30,.9)'); g.addColorStop(0.9, 'rgba(170,40,10,.45)'); g.addColorStop(1, 'rgba(100,10,0,0)');
  k.fillStyle = g; k.fillRect(0, 0, 256, 256);
  k.globalCompositeOperation = 'source-atop'; k.strokeStyle = 'rgba(255,255,255,.25)'; k.lineWidth = 2;
  for (let r = 70; r < 126; r += 7) { k.beginPath(); k.arc(128, 128, r, 0, 7); k.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
export function blackHoleSculpture(scene, spinners) {
  const g = new THREE.Group(); scene.add(g);
  const M = materials({ stone: { light: ['#cbbfa6', '#c2b69d', '#d2c7b0'], dark: ['#a99d86'], mortar: '#9d917a', courses: [40, 20], widths: [90, 80], seed: 3 }, trim: 0xe0d6bf, plinth: 0xa89c85, bumpScale: 0.9 });
  const B = new Batch(), { col } = parts(B, M);
  col(M.plinth, 1.7, 1.9, 0.35, 0, 0, 0, 24); col(M.stone, 1.3, 1.6, 0.9, 0, 0.35, 0, 24); col(M.trim, 1.45, 1.45, 0.14, 0, 1.25, 0, 24);
  col(M.stone, 0.22, 0.34, 1.0, 0, 1.39, 0, 12);                                                    // stem
  B.flush(g);
  const bh = new THREE.Group(); bh.position.y = 3; g.add(bh);
  bh.add(new THREE.Mesh(new THREE.SphereGeometry(0.8, 28, 22), new THREE.MeshBasicMaterial({ color: 0x000000 })));
  const mat = new THREE.MeshBasicMaterial({ map: discTex(), transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const disc = new THREE.Mesh(new THREE.RingGeometry(0.82, 2.4, 64, 1), mat); disc.rotation.x = Math.PI / 2.2; bh.add(disc);
  const lens = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.06, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffd9a0 })); bh.add(lens);   // lensed photon ring
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.35, 40), new THREE.MeshBasicMaterial({ color: 0xff9a40, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })); bh.add(halo);
  spinners.push(bh);
  return { r: 1.8 };
}
