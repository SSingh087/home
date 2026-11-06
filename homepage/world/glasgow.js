// University of Glasgow main building (Gilbert Scott), built from real architectural parts:
// coursed sandstone with bump, pointed-arch windows set in recessed surrounds, balconies, a
// battlemented tower with corner turrets and an open-work bronze spire, crow-stepped gables,
// slate roofs, dormers and chimneys. Modelled on reference-assets/buildings/glasgow-gilbert-scott/.
// Same contract as the other builders: front = +z, ground = y 0, returns { r, front, h, cols }.
import * as THREE from 'three';
import { Batch, I, mat4, arch, extrude, materials, parts } from './detail.js';
import { flagpole, wellington } from './props.js';

// open-work spire: bronze tracery with real gaps (alpha-tested)
function spireTex() {
  const W = 128, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H; const k = c.getContext('2d');
  k.fillStyle = '#6b6a42'; k.fillRect(0, 0, W, H);
  k.globalCompositeOperation = 'destination-out';
  const rows = 5;
  for (let r = 0; r < rows; r++) {
    const y0 = r * (H / rows) + 10, h = H / rows - 20;
    for (let i = 0; i < 2; i++) {
      const cx = W * (i * 0.5 + 0.25), w = 36;
      k.beginPath(); k.moveTo(cx - w / 2, y0 + h); k.lineTo(cx - w / 2, y0 + w * 0.8); k.quadraticCurveTo(cx - w / 2, y0, cx, y0 - 4); k.quadraticCurveTo(cx + w / 2, y0, cx + w / 2, y0 + w * 0.8); k.lineTo(cx + w / 2, y0 + h); k.closePath(); k.fill();
    }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(4, 1); return t;
}


export function glasgow(g, sp, o = {}) {
  const M = materials();
  const { stone, trim, plinth, slate, glass, bar, door, bronze, gold } = M;
  const spireMat = new THREE.MeshStandardMaterial({ map: spireTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.55, metalness: 0.4 });
  const B = new Batch();
  const { bx, col, cone, lancet, bay, balcony, merlons, roof, crowStep } = parts(B, M);

  // ================================================================ main range
  bx(plinth, 17.6, 0.55, 5.6, 0, 0, 0);
  bx(stone, 17, 5, 5, 0, 0, 0);
  bx(trim, 17.2, 0.16, 5.2, 0, 2.55, 0);                         // string course
  bx(trim, 17.7, 0.34, 5.7, 0, 5, 0);                            // cornice
  roof(5.6, 2.4, 17.4, 0, 5.34, 0, Math.PI / 2);
  const front = mat4(0, 0, 2.5), back = mat4(0, 0, -2.5, Math.PI);
  for (const s of [-1, 1]) for (const bxx of [2.95, 4.15]) {
    lancet(front, s * bxx, 0.9, 0.5, 1.5, 1); lancet(front, s * bxx, 3.2, 0.5, 1.5, 1);
  }
  for (let x = -4.2; x <= 4.3; x += 1.4) { lancet(back, x, 0.9, 0.5, 1.5, 1); lancet(back, x, 3.2, 0.5, 1.5, 1); }
  // dormers on the front slope
  for (const s of [-1, 1]) {
    const x = s * 3.55;
    bx(stone, 1.2, 1.3, 1.6, x, 5.3, 1.2);
    roof(1.5, 0.8, 1.9, x, 6.6, 1.15);
    lancet(mat4(0, 0, 2.0), x, 5.5, 0.42, 0.85, 0);
  }
  // chimneys
  for (const x of [-4.5, -3.0, 3.0, 4.5]) { bx(stone, 0.55, 2.0, 0.55, x, 6.4, -0.4); bx(trim, 0.7, 0.14, 0.7, x, 8.4, -0.4); col(plinth, 0.14, 0.17, 0.4, x, 8.54, -0.4, 8); }

  // ================================================================ end pavilions
  for (const s of [-1, 1]) {
    const px = s * 7.2, pz = 0.5, fz = pz + 3.1;
    bx(plinth, 4.9, 0.55, 6.5, px, 0, pz);
    bx(stone, 4.6, 7, 6.2, px, 0, pz);
    bx(trim, 4.75, 0.16, 6.35, px, 3.45, pz);
    bx(trim, 4.9, 0.34, 6.5, px, 7, pz);
    roof(4.4, 3, 6.4, px, 7.34, pz);
    // crow-stepped front and back gables, with a finial
    B.add(crowStep(4.7, 3.4, 0, 0.5), stone, mat4(px, 7.34, fz - 0.1));
    B.add(crowStep(4.7, 3.4, 0, 0.5), stone, mat4(px, 7.34, pz - 3.1 + 0.1));
    cone(gold, 0.09, 0.5, px, 10.7, fz - 0.1, 6);
    const face = mat4(px, 0, fz);
    for (const dx of [-0.85, 0.85]) { lancet(face, dx, 1.0, 0.55, 1.9, 1); lancet(face, dx, 4.0, 0.55, 1.9, 1); }
    lancet(mat4(px, 0, fz - 0.1 + 0.25), 0, 8.0, 0.5, 1.5, 1);
    const pback = mat4(px, 0, pz - 3.1, Math.PI);
    for (const dx of [-0.85, 0.85]) { lancet(pback, dx, 1.0, 0.55, 1.9, 1); lancet(pback, dx, 4.0, 0.55, 1.9, 1); }
    const side = mat4(px + s * 2.3, 0, pz, s * Math.PI / 2);
    for (const dz of [-1.7, 0, 1.7]) { lancet(side, dz, 1.0, 0.5, 1.8, 1); lancet(side, dz, 4.0, 0.5, 1.8, 1); }
    // corner turrets at the front, corbelled with slate cones
    for (const t of [-1, 1]) {
      const tx = px + t * 2.3, tz = fz;
      col(stone, 0.42, 0.46, 8.2, tx, 0, tz, 14);
      col(trim, 0.58, 0.4, 0.5, tx, 7.7, tz, 14);
      col(stone, 0.5, 0.5, 0.5, tx, 8.2, tz, 14);
      cone(slate, 0.66, 2.4, tx, 8.7, tz, 14); cone(gold, 0.05, 0.45, tx, 11.1, tz, 6);
    }
  }

  // ================================================================ central tower
  const cx = 0, cz = 1, TW = 4, TH = 14.8;
  bx(plinth, 4.6, 0.35, 4.6, cx, 0, cz);
  bx(stone, TW, TH, TW, cx, 0, cz);
  const faces = [0, 1, 2, 3].map(k => mat4(cx, 0, cz, k * Math.PI / 2).multiply(mat4(0, 0, TW / 2)));
  faces.forEach((f, k) => {
    bay(f, 0, 4.3, 0.5, 2.0, 2);                    // lower paired windows
    balcony(f, 0, 7.2, 3.0);
    bay(f, 0, 7.8, 0.62, 3.0, 2, 0.28, 2);          // tall upper paired windows
    bx(trim, TW + 0.2, 0.18, 0.2, 0, 11.4, 0, f);
    for (const x of [-1.2, -0.4, 0.4, 1.2]) lancet(f, x, 11.9, 0.42, 2.3, 1);  // belfry stage
    if (k === 0) {                                  // entrance
      const dr = arch(1.9, 3.4); dr.holes.push(arch(1.5, 3.1, 0.15, true));
      B.add(extrude(dr, 0.25), trim, f.clone().multiply(mat4(0, 0.35, 0)));
      B.add(extrude(arch(1.5, 3.1, 0.15), 0.05), door, f.clone().multiply(mat4(0, 0.35, 0.02)));
      bx(plinth, 2.8, 0.2, 0.5, 0, 0, 0.55, f);                // entrance step
    }
  });
  bx(trim, TW + 0.5, 0.34, TW + 0.5, cx, TH - 0.05, cz);
  merlons(TW + 0.4, TW + 0.4, cx, TH + 0.3, cz);
  // corner shafts rising into turrets
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const tx = cx + sx * (TW / 2 - 0.05), tz = cz + sz * (TW / 2 - 0.05);
    col(stone, 0.36, 0.4, TH + 3.2, tx, 0, tz, 14);
    col(trim, 0.52, 0.52, 0.28, tx, TH + 0.4, tz, 14);
    col(trim, 0.5, 0.36, 0.5, tx, TH + 2.6, tz, 14);
    cone(slate, 0.55, 2.8, tx, TH + 3.2, tz, 14); cone(gold, 0.04, 0.5, tx, TH + 5.95, tz, 6);
  }
  // lantern and open-work spire
  col(bronze, 1.4, 1.55, 1.5, cx, TH + 0.45, cz, 8);
  B.add(new THREE.ConeGeometry(1.35, 6.0, 8, 1, true), spireMat, mat4(cx, TH + 1.95 + 3.0, cz));
  for (let i = 0; i < 8; i++) {                                    // ribs along the spire edges
    const a = i * Math.PI / 4, p0 = new THREE.Vector3(Math.sin(a) * 1.35, 0, Math.cos(a) * 1.35), p1 = new THREE.Vector3(0, 6, 0), d = p1.clone().sub(p0);
    const geo = new THREE.CylinderGeometry(0.035, 0.05, d.length(), 5);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    B.add(geo, bronze, new THREE.Matrix4().compose(new THREE.Vector3(cx, TH + 1.95, cz).addScaledVector(p0.clone().add(d.clone().multiplyScalar(0.5)), 1), q, new THREE.Vector3(1, 1, 1)));
  }
  for (const [t, r] of [[0.0, 1.38], [0.3, 0.98], [0.62, 0.56]]) B.add(new THREE.TorusGeometry(r, 0.05, 5, 8).rotateX(Math.PI / 2), bronze, mat4(cx, TH + 1.95 + t * 6, cz));
  cone(gold, 0.1, 0.9, cx, TH + 7.95, cz, 6); B.add(new THREE.SphereGeometry(0.12, 10, 8), gold, mat4(cx, TH + 7.9, cz));

  B.flush(g);

  const P = []; if (o.props !== false) { flagpole(g, 'scotland', 9, 6, sp, 7); const w = wellington(g, -10.5, 10); P.push({ x: 9, z: 6, r: 0.5, prop: true }, { x: -10.5, z: 10, r: w.r, prop: true }); }
  return { r: 10, front: 7.6, h: 25, cols: [...P, { x: 0, z: 0, r: 6.4 }, { x: -7.2, z: 0.5, r: 3.8 }, { x: 7.2, z: 0.5, r: 3.8 }] };
}
