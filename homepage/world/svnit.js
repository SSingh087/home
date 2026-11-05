// SVNIT Surat (Sardar Vallabhbhai National Institute of Technology): weathered terracotta-red institute
// blocks with cream bands, a taller hostel block with sun-shade ledges, a round cream tower with circular
// openings, rooftop water tanks and parapets, and the campus gate (pylons, banner board, iron gates).
// Modelled on reference-assets/buildings/svnit-surat/ and the old chunky version. Contract as the other builders.
import * as THREE from 'three';
import { Batch, I, mat4, materials, parts, extrude, rect } from './detail.js';
import { flagpole, gem } from './props.js';

const bannerMat = () => {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 120; const k = c.getContext('2d');
  k.fillStyle = '#1d2f55'; k.fillRect(0, 0, 1024, 120);
  k.strokeStyle = '#e8c874'; k.lineWidth = 5; k.strokeRect(10, 10, 1004, 100);
  k.fillStyle = '#ffffff'; k.font = '600 68px sans-serif'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('SVNIT SURAT', 512, 63);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 });
};

export function svnit(g, sp, o = {}) {
  // three masonry finishes: terracotta institute blocks, darker red hostel, cream plaster tower/gate
  const Mt = materials({
    stone: { light: ['#d98a4e', '#d1814a', '#dc9257', '#cf7f47', '#d68a52'], dark: ['#b66a3a', '#a8613a'], mortar: '#a85f33', courses: [44, 10], widths: [96, 64], darkP: 0.12, seed: 7, weather: 0.12, pits: 5000 },
    trim: 0xf3e2c0, plinth: 0x9c5a35, bumpScale: 0.7,
  });
  const Mh = materials({
    stone: { light: ['#c8643a', '#bd5c35', '#cf6c40', '#b95a34'], dark: ['#8f4528', '#7f3c24'], mortar: '#8c4226', courses: [44, 10], widths: [96, 64], darkP: 0.14, seed: 19, weather: 0.14, pits: 5000 },
    trim: 0xefd8b4, plinth: 0x7f3c24, bumpScale: 0.7,
  });
  const Mw = materials({
    stone: { light: ['#efe6d0', '#e9dfc6', '#f3ebd8', '#e4d9bd'], dark: ['#cfc4a8', '#c9bd9f'], mortar: '#cfc4a8', courses: [60, 20], widths: [110, 70], darkP: 0.08, seed: 31, weather: 0.12, pits: 4500 },
    trim: 0xf7efdc, plinth: 0xbfb398, bumpScale: 0.5,
  });
  const tank = new THREE.MeshStandardMaterial({ color: 0x1b1d21, roughness: 0.45, metalness: 0.1 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x3a4650, roughness: 0.55, metalness: 0.5 });
  const B = new Batch();
  const T = parts(B, Mt), H = parts(B, Mh), W = parts(B, Mw);

  const faces = (cx, cz, w, d) => [mat4(cx, 0, cz + d / 2), mat4(cx, 0, cz - d / 2, Math.PI), mat4(cx + w / 2, 0, cz, Math.PI / 2), mat4(cx - w / 2, 0, cz, -Math.PI / 2)];
  const parapet = (P, cx, cz, w, d, y) => {   // 0.75 high wall with a cream coping, all four sides
    P.bx(P === T ? Mt.stone : Mh.stone, w, 0.75, 0.28, cx, y, cz + d / 2 - 0.14); P.bx(P === T ? Mt.stone : Mh.stone, w, 0.75, 0.28, cx, y, cz - d / 2 + 0.14);
    P.bx(P === T ? Mt.stone : Mh.stone, 0.28, 0.75, d - 0.56, cx - w / 2 + 0.14, y, cz); P.bx(P === T ? Mt.stone : Mh.stone, 0.28, 0.75, d - 0.56, cx + w / 2 - 0.14, y, cz);
    P.bx(P === T ? Mt.trim : Mh.trim, w + 0.14, 0.1, 0.42, cx, y + 0.75, cz + d / 2 - 0.14); P.bx(P === T ? Mt.trim : Mh.trim, w + 0.14, 0.1, 0.42, cx, y + 0.75, cz - d / 2 + 0.14);
    P.bx(P === T ? Mt.trim : Mh.trim, 0.42, 0.1, d - 0.4, cx - w / 2 + 0.14, y + 0.75, cz); P.bx(P === T ? Mt.trim : Mh.trim, 0.42, 0.1, d - 0.4, cx + w / 2 - 0.14, y + 0.75, cz);
  };
  const waterTank = (x, y, z, s = 1) => {      // black plastic tank on a small platform with stand legs
    B.add(new THREE.BoxGeometry(1.5 * s, 0.14, 1.5 * s), Mt.plinth, mat4(x, y + 0.42, z));
    for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) B.add(new THREE.BoxGeometry(0.12, 0.4, 0.12), Mt.plinth, mat4(x + dx * 0.6 * s, y + 0.2, z + dz * 0.6 * s));
    B.add(new THREE.CylinderGeometry(0.62 * s, 0.62 * s, 0.9 * s, 20), tank, mat4(x, y + 0.49 + 0.45 * s, z));
    B.add(new THREE.SphereGeometry(0.62 * s, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.55, 1), tank, mat4(x, y + 0.49 + 0.9 * s, z));
    B.add(new THREE.CylinderGeometry(0.16 * s, 0.16 * s, 0.1, 10), tank, mat4(x, y + 0.49 + 0.9 * s + 0.3 * s, z));
    for (const yy of [0.25, 0.65]) B.add(new THREE.TorusGeometry(0.625 * s, 0.018, 4, 20).rotateX(Math.PI / 2), tank, mat4(x, y + 0.49 + yy * s, z));
  };

  // ================================================================ main institute block (terracotta)
  const MW = 14, MD = 6, MH = 5.4;
  T.bx(Mt.plinth, MW + 0.4, 0.55, MD + 0.4, 0, 0, 0);
  T.bx(Mt.stone, MW, MH, MD, 0, 0, 0);
  T.bx(Mt.trim, MW + 0.12, 0.2, MD + 0.12, 0, 2.7, 0);                  // floor band
  T.bx(Mt.trim, MW + 0.5, 0.28, MD + 0.5, 0, MH, 0);                      // cornice
  parapet(T, 0, 0, MW + 0.4, MD + 0.4, MH + 0.28);
  const [mf, mb, mr, ml] = faces(0, 0, MW, MD);
  const bays = [-5.8, -4.2, -2.6, 2.6, 4.2, 5.8];
  const chajja = (P, base, x, y, w) => P.bx(P === T ? Mt.trim : Mh.trim, w + 0.5, 0.08, 0.4, x, y, 0.2, base);
  const win2 = (f, x) => { T.swin(f, x, 0.95, 0.9, 1.45); T.swin(f, x, 3.45, 0.9, 1.45); chajja(T, f, x, 2.45, 0.9); chajja(T, f, x, 4.95, 0.9); };
  for (const x of bays) win2(mf, x);
  for (const x of bays) if (x > -4) win2(mb, x);                          // back face: the round tower (world x > 4) hides the other bays
  for (const x of [-1.8, 0, 1.8]) win2(ml, x);
  for (const x of [-1.8]) win2(mr, x);                                    // right face: only the bay clear of the tower
  for (const f of []) for (const x of [-1.8, 0, 1.8]) { T.swin(f, x, 0.95, 0.9, 1.45); T.swin(f, x, 3.45, 0.9, 1.45); chajja(T, f, x, 2.45, 0.9); chajja(T, f, x, 4.95, 0.9); }
  for (const x of [-6.75, -3.4, -1.45, 1.45, 3.4, 6.75]) T.bx(Mt.trim, 0.22, MH - 0.5, 0.1, x, 0.55, 0, mf);      // pilaster strips
  for (const x of [3.4, 6.75]) T.bx(Mt.trim, 0.22, MH - 0.5, 0.1, x, 0.55, 0, mb);
  // entrance bay: door, upper window, canopy on slim posts, steps
  T.swin(mf, 0, 0.55, 1.4, 2.1, { pedi: true });
  T.bx(Mt.door, 1.3, 2.05, 0.08, 0, 0.6, 0.04, mf);
  T.swin(mf, 0, 3.45, 1.1, 1.45);
  T.bx(Mt.trim, 3.0, 0.18, 1.5, 0, 2.75, 0.75, mf);
  for (const s of [-1, 1]) T.col(Mt.trim, 0.12, 0.14, 2.2, s * 1.35, 0.55, 1.35, 12, mf);
  T.bx(Mt.plinth, 3.4, 0.14, 0.55, 0, 0, 1.85, mf); T.bx(Mt.plinth, 3.0, 0.28, 0.5, 0, 0, 1.55, mf);
  // upper set-back floor
  const UW = 6, UD = 3.6, UZ = -0.5, UY = MH + 0.28 + 0.2;
  T.bx(Mt.stone, UW, 3.0, UD, 0, UY, UZ);
  T.bx(Mt.trim, UW + 0.4, 0.22, UD + 0.4, 0, UY + 3.0, UZ);
  parapet(T, 0, UZ, UW + 0.4, UD + 0.4, UY + 3.22);
  const [uf, ub, ur, ul] = faces(0, UZ, UW, UD);
  for (const x of [-1.9, 0, 1.9]) { for (const f of [uf, ub]) { T.swin(f, x, UY + 0.8, 0.9, 1.4); chajja(T, f, x, UY + 2.35, 0.9); } }
  for (const f of [ur, ul]) for (const x of [-0.9, 0.9]) T.swin(f, x, UY + 0.8, 0.9, 1.4);
  T.bx(Mt.stone, 1.7, 1.5, 1.5, 3.9, MH + 0.28, -1.8);                   // roof stair-head
  T.bx(Mt.trim, 1.9, 0.12, 1.7, 3.9, MH + 0.28 + 1.5, -1.8); T.bx(Mt.door, 0.7, 1.15, 0.06, 3.9, MH + 0.28, -1.03);
  waterTank(-3.8, MH + 0.28, 0.6, 0.9);

  // ================================================================ taller hostel block (darker red)
  const HX = -6.2, HZ = -5.5, HW = 5, HD = 5, HH = 9;
  H.bx(Mh.plinth, HW + 0.4, 0.55, HD + 0.4, HX, 0, HZ);
  H.bx(Mh.stone, HW, HH, HD, HX, 0, HZ);
  for (const y of [2.8, 5.6]) H.bx(Mh.trim, HW + 0.1, 0.16, HD + 0.1, HX, y, HZ);
  H.bx(Mh.trim, HW + 0.45, 0.26, HD + 0.45, HX, HH, HZ);
  parapet(H, HX, HZ, HW + 0.4, HD + 0.4, HH + 0.26);
  for (const f of faces(HX, HZ, HW, HD)) for (let r = 0; r < 5; r++) for (const x of [-1.4, 0, 1.4]) {
    const y = 0.9 + r * 1.68; H.swin(f, x, y, 0.8, 1.05); chajja(H, f, x, y + 1.3, 0.8);
  }
  H.bx(Mh.stone, 1.6, 1.2, 1.4, HX + 1.1, HH + 0.26, HZ + 0.6); H.bx(Mh.trim, 1.8, 0.1, 1.6, HX + 1.1, HH + 1.46, HZ + 0.6);
  waterTank(HX - 1.0, HH + 0.26, HZ - 0.8, 1.1); waterTank(HX + 0.3, HH + 0.26, HZ - 1.5, 1.1);
  B.add(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 6), iron, mat4(HX + 1.8, HH + 0.26 + 1.2, HZ - 1.4));  // aerial mast

  // ================================================================ round cream tower with circular openings
  const RX = 6.3, RZ = -1.2, RR = 2.1, RH = 7.4;
  W.col(Mw.plinth, RR + 0.18, RR + 0.22, 0.55, RX, 0, RZ, 36);
  W.col(Mw.stone, RR, RR, RH, RX, 0, RZ, 36);
  for (const y of [3.7]) W.col(Mw.trim, RR + 0.1, RR + 0.1, 0.18, RX, y, RZ, 36);
  W.col(Mw.trim, RR + 0.3, RR + 0.3, 0.3, RX, RH, RZ, 36);
  W.col(Mw.stone, RR + 0.12, RR + 0.12, 0.6, RX, RH + 0.3, RZ, 36);
  W.col(Mw.trim, RR + 0.26, RR + 0.26, 0.1, RX, RH + 0.9, RZ, 36);
  for (let j = 0; j < 2; j++) for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2 + j * Math.PI / 12, ob = mat4(RX, 0, RZ, a).multiply(mat4(0, 1.9 + j * 2.0, RR - 0.01));
    B.add(new THREE.TorusGeometry(0.31, 0.07, 8, 18), Mw.trim, ob);
    B.add(new THREE.CircleGeometry(0.26, 18), Mw.glass, ob.clone().multiply(mat4(0, 0, 0.02)));
  }
  B.add(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6), iron, mat4(RX, RH + 0.9 + 1.1, RZ));

  // ================================================================ campus gate: pylons, banner board, iron gates, walls
  const GZ = 6.6;
  for (const s of [-1, 1]) {
    const x = s * 3.6;
    W.bx(Mw.plinth, 1.5, 0.35, 1.5, x, 0, GZ); W.bx(Mw.stone, 1.2, 3.9, 1.2, x, 0.35, GZ);
    W.bx(Mw.trim, 1.4, 0.18, 1.4, x, 3.5, GZ); W.bx(Mw.trim, 1.4, 0.16, 1.4, x, 4.25, GZ);
    B.add(new THREE.ConeGeometry(0.95, 1.2, 4), Mt.stone, mat4(x, 4.41 + 0.6, GZ, Math.PI / 4));
    B.add(new THREE.SphereGeometry(0.1, 8, 6), Mt.trim, mat4(x, 5.7, GZ));
    // low boundary wall with cream coping, running outward
    const wx = s * 5.35;
    W.bx(Mw.stone, 2.2, 1.2, 0.4, wx, 0, GZ); W.bx(Mw.trim, 2.3, 0.12, 0.5, wx, 1.2, GZ);
    // gate leaf (iron bars) leaving the middle open
    for (let i = 0; i < 6; i++) B.add(new THREE.CylinderGeometry(0.03, 0.03, 2.3, 5), iron, mat4(s * (1.7 + i * 0.22), 1.3, GZ));
    for (const y of [0.35, 1.15, 2.35]) B.add(new THREE.BoxGeometry(1.4, 0.07, 0.07), iron, mat4(s * 2.25, y, GZ));
  }
  { // banner board spanning the pylons, over the carriageway
    const m = new THREE.Mesh(new THREE.BoxGeometry(8.6, 1, 0.45), [Mw.trim, Mw.trim, Mw.trim, Mw.trim, bannerMat(), Mw.trim]);
    m.position.set(0, 3.3 + 0.5, GZ); m.castShadow = m.receiveShadow = true; g.add(m); }
  W.bx(Mw.trim, 8.8, 0.14, 0.6, 0, 4.3, GZ); W.bx(Mw.trim, 8.8, 0.14, 0.6, 0, 3.2, GZ);
  W.bx(Mw.stone, 1.4, 1.3, 0.8, 0, 4.44, GZ);                              // centre pylon above the board
  B.add(new THREE.ConeGeometry(1.0, 1.7, 4), Mt.stone, mat4(0, 5.74 + 0.85, GZ, Math.PI / 4));
  B.add(new THREE.SphereGeometry(0.12, 8, 6), Mt.trim, mat4(0, 7.55, GZ));
  W.bx(Mw.plinth, 3.4, 0.05, 3.2, 0, 0, 4.7);                              // paved approach from the gate to the steps

  B.flush(g);

  const P = []; if (o.props !== false) { const gm = gem(g, -7.5, 6.5, sp); flagpole(g, 'india', 8, 5.5, sp, 6.5); P.push({ x: -7.5, z: 6.5, r: gm.r, prop: true }, { x: 8, z: 5.5, r: 0.5, prop: true }); }
  return { r: 9, front: 9.8, h: 12, cols: [...P, { x: 0, z: 0, r: 7.5 }, { x: HX, z: HZ, r: 3.8 }, { x: RX, z: RZ, r: 2.6 }, { x: -3.6, z: GZ, r: 0.9 }, { x: 3.6, z: GZ, r: 0.9 }] };
}
