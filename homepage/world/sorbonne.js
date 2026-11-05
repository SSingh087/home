// Sorbonne chapel (Chapelle de la Sorbonne, Lemercier): cream limestone, a Corinthian portico under a
// two-storey façade with clock, niches, volutes and a pediment, then a pilastered drum carrying a
// ribbed slate dome, a balustraded lantern and a bell-shaped lead spire with a verdigris cross.
// Modelled on reference-assets/buildings/sorbonne-chapel/. Contract as the other builders.
import * as THREE from 'three';
import { Batch, I, mat4, extrude, rarch, materials, parts } from './detail.js';
import { flagpole } from './props.js';

const clockTex = () => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const k = c.getContext('2d');
  k.fillStyle = '#f4efe2'; k.beginPath(); k.arc(64, 64, 62, 0, 7); k.fill(); k.strokeStyle = '#2b2b2b'; k.lineWidth = 3; k.beginPath(); k.arc(64, 64, 59, 0, 7); k.stroke();
  k.lineWidth = 3; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; k.beginPath(); k.moveTo(64 + Math.sin(a) * 50, 64 - Math.cos(a) * 50); k.lineTo(64 + Math.sin(a) * 57, 64 - Math.cos(a) * 57); k.stroke(); }
  k.lineWidth = 6; k.lineCap = 'round'; k.beginPath(); k.moveTo(64, 64); k.lineTo(64, 24); k.moveTo(64, 64); k.lineTo(90, 80); k.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

export function sorbonne(g, sp, o = {}) {
  const M = materials({
    stone: { light: ['#ebdcbb', '#e5d5b1', '#f0e3c7', '#e0cfaa', '#e9d9b7'], dark: ['#d0bb92', '#c7b28b'], mortar: '#b8a37e', courses: [26, 12], widths: [70, 70], darkP: 0.07, seed: 23, weather: 0.04, pits: 2500 },
    trim: 0xfff2da, plinth: 0xcdbb98, slate: { base: 92, tint: [0, 6, 16], row: 12, w: 18 }, bumpScale: 1.0,
  });
  const { stone, trim, plinth, slate, glass, bar, door } = M;
  const lead = new THREE.MeshStandardMaterial({ color: 0xaab4c0, metalness: 0.35, roughness: 0.5 });
  const verd = new THREE.MeshStandardMaterial({ color: 0x4f8f7a, metalness: 0.4, roughness: 0.45 });
  M.recess = new THREE.MeshStandardMaterial({ color: 0x4a4034, roughness: 0.9 });
  const domeSlate = slate.clone(); domeSlate.map = slate.map.clone(); domeSlate.map.repeat.set(9, 2.2); domeSlate.map.needsUpdate = true;
  domeSlate.bumpMap = slate.bumpMap.clone(); domeSlate.bumpMap.repeat.set(9, 2.2); domeSlate.bumpMap.needsUpdate = true; domeSlate.side = THREE.DoubleSide;
  const B = new Batch();
  const { bx, col, cone, roof, swin, rwin, niche, statue, dentils, balustrade, corinthian } = parts(B, M);
  const CX = 0, CZ = -0.5;                                    // drum / nave centre

  // ================================================================ side ranges (the court buildings)
  bx(plinth, 16.4, 0.5, 5.9, 0, 0, CZ);
  bx(stone, 16, 5.5, 5.5, 0, 0, CZ);
  bx(trim, 16.2, 0.14, 5.7, 0, 2.6, CZ);
  bx(trim, 16.6, 0.3, 6.1, 0, 5.5, CZ);
  const wf = mat4(0, 0, CZ + 2.75), wb = mat4(0, 0, CZ - 2.75, Math.PI);
  dentils(16.2, 0, 5.36, CZ + 3.0, I); dentils(16.2, 0, 5.36, CZ - 3.0, I);
  balustrade(15.8, 0, 5.8, CZ + 2.8); balustrade(15.8, 0, 5.8, CZ - 2.8);
  for (const s of [-1, 1]) balustrade(5.4, 0, 5.8, 0, mat4(s * 7.8, 0, CZ, Math.PI / 2));
  roof(4.2, 1.7, 15.6, 0, 5.8, CZ, Math.PI / 2);
  for (const s of [-1, 1]) for (const x of [4.3, 5.7, 7.1]) {
    swin(wf, s * x, 0.95, 0.8, 1.7, { pedi: true }); swin(wf, s * x, 3.25, 0.8, 1.55);
  }
  for (let x = -7.2; x <= 7.3; x += 1.44) { swin(wb, x, 0.95, 0.8, 1.7); swin(wb, x, 3.25, 0.8, 1.55); }
  for (const s of [-1, 1]) { const side = mat4(s * 8, 0, CZ, s * Math.PI / 2); for (const dz of [-1.8, 0, 1.8]) { swin(side, dz, 0.95, 0.8, 1.7); swin(side, dz, 3.25, 0.8, 1.55); } }

  // ================================================================ chapel front: Corinthian portico, lower storey
  bx(plinth, 7.6, 0.45, 4.4, 0, 0, 3.7);
  bx(plinth, 5.8, 0.15, 0.45, 0, 0, 6.75); bx(plinth, 5.4, 0.3, 0.45, 0, 0, 6.35);
  bx(stone, 6.4, 4.8, 3.4, 0, 0.45, 3.7);
  const fc = mat4(0, 0, 5.4);
  // doorway and flanking niches between the columns
  { const outer = rarch(1.75, 3.1); outer.holes.push(rarch(1.4, 2.8, 0.15, true));
    B.add(extrude(outer, 0.22), trim, fc.clone().multiply(mat4(0, 0.45, 0)));
    B.add(extrude(rarch(1.4, 2.8, 0.15), 0.04), door, fc.clone().multiply(mat4(0, 0.45, 0.02)));
    bx(trim, 0.2, 0.22, 0.3, 0, 3.45, 0.05, fc); }
  for (const s of [-1, 1]) niche(fc, s * 1.6, 1.4, 0.7, 1.9);
  for (const x of [-2.95, -2.3, -0.85, 0.85, 2.3, 2.95]) corinthian(x, 0.45, 5.72, 0.22, 3.55);
  bx(trim, 6.7, 0.55, 3.6, 0, 4.7, 3.75);                          // architrave + frieze
  bx(trim, 7.2, 0.28, 4.1, 0, 5.25, 3.8);                          // cornice
  dentils(7.0, 0, 5.12, 5.78);
  for (const s of [-1, 1]) {                                        // columns' entablature returns as pilasters on the end walls
    bx(trim, 0.4, 3.9, 0.12, s * 3.0, 0.7, 5.45);
  }

  // ================================================================ upper storey with clock, niches and volutes
  bx(stone, 5.2, 3.7, 2.8, 0, 5.53, 3.65);
  const uf = mat4(0, 0, 5.05);
  for (const x of [-2.45, -1.95, -0.95, 0.95, 1.95, 2.45]) { bx(trim, 0.3, 2.9, 0.14, x, 5.7, 0, uf); bx(trim, 0.42, 0.26, 0.2, x, 8.6, 0, uf); bx(trim, 0.38, 0.12, 0.18, x, 5.65, 0, uf); }
  rwin(uf, 0, 7.15, 1.2, 1.35, { f: 0.16 });
  { const clk = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), new THREE.MeshStandardMaterial({ map: clockTex(), roughness: 0.6 }));
    clk.position.set(0, 6.45, 5.08); clk.castShadow = false; g.add(clk);
    B.add(new THREE.TorusGeometry(0.46, 0.05, 6, 24), trim, mat4(0, 6.45, 5.08)); }
  bx(trim, 1.5, 0.6, 0.12, 0, 5.8, 0.02, uf);
  for (const s of [-1, 1]) niche(uf, s * 1.55, 6.2, 0.62, 1.55);
  bx(trim, 5.7, 0.5, 3.0, 0, 9.0, 3.65);                           // upper architrave/frieze
  bx(trim, 6.1, 0.24, 3.3, 0, 9.5, 3.72);                          // cornice
  dentils(5.9, 0, 9.4, 5.4);
  // pediment (rim and recessed tympanum)
  roof(6.2, 1.45, 0.45, 0, 9.74, 5.2, 0, trim);
  roof(5.3, 1.1, 0.14, 0, 9.76, 5.45, 0, stone);
  // scroll volutes linking the storeys
  for (const s of [-1, 1]) {
    const v = new THREE.Shape(); v.moveTo(0, 0); v.lineTo(0.75 * s, 0); v.quadraticCurveTo(0.14 * s, 0.3, 0.02 * s, 1.9); v.lineTo(0, 1.9); v.closePath();
    B.add(extrude(v, 0.45), trim, mat4(s * 2.62, 5.53, 4.9));
  }

  // ================================================================ drum
  const R = 3.5, DY = 8.2;
  col(stone, R, R, 4.0 + (DY - 5.4), CX, 5.4, CZ, 48);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4, pb = mat4(CX, 0, CZ, a).multiply(mat4(0, 0, R));
    bx(trim, 0.5, 3.3, 0.22, 0, DY + 0.3, 0.05, pb); bx(trim, 0.66, 0.26, 0.3, 0, DY + 3.55, 0.05, pb); bx(trim, 0.6, 0.14, 0.26, 0, DY + 0.22, 0.05, pb);
    const wb2 = mat4(CX, 0, CZ, a + Math.PI / 8).multiply(mat4(0, 0, R - 0.02));
    rwin(wb2, 0, DY + 0.9, 0.75, 1.7);
  }
  col(trim, R + 0.25, R + 0.25, 0.3, CX, DY + 4.0, CZ, 48);
  col(stone, R - 0.05, R - 0.05, 0.45, CX, DY + 4.3, CZ, 48);
  for (const s of [-1, 1]) {                                        // little corner turrets with bell caps
    const tx = s * 2.75, tz = 2.95;
    col(stone, 0.58, 0.62, 2.2, tx, 9.7, tz, 18); col(trim, 0.7, 0.7, 0.14, tx, 11.9, tz, 18);
    rwin(mat4(tx, 0, tz + 0.58), 0, 10.2, 0.34, 0.95, { f: 0.08, bars: false, mat: bar });
    B.add(new THREE.LatheGeometry([[0.72, 0], [0.64, 0.14], [0.46, 0.5], [0.24, 0.95], [0.05, 1.35]].map(p => new THREE.Vector2(p[0], p[1])), 18), domeSlate, mat4(tx, 12.04, tz));
    col(lead, 0.03, 0.05, 0.4, tx, 13.35, tz, 6);
  }

  // ================================================================ dome
  const DB = DY + 4.75, DR = 3.4, DH = 3.75, N = 36, prof = [], at = (th, off = 0) => [(DR + off) * Math.cos(th), (DH + off) * Math.sin(th)];
  for (let i = 0; i <= N; i++) { const [r, y] = at(i / N * Math.PI / 2 * 0.985); prof.push(new THREE.Vector2(r, y)); }
  B.add(new THREE.LatheGeometry(prof, 48), domeSlate, mat4(CX, DB, CZ));
  col(trim, DR + 0.12, DR + 0.12, 0.2, CX, DB - 0.1, CZ, 48);
  for (let k = 0; k < 8; k++) {                                     // lead ribs and round dormers on the slates
    const ph = k * Math.PI / 4, pts = [];
    for (let i = 0; i <= 20; i++) { const [r, y] = at(i / 20 * Math.PI / 2 * 0.97, 0.05); pts.push(new THREE.Vector3(Math.sin(ph) * r, y, Math.cos(ph) * r)); }
    B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.08, 6), lead, mat4(CX, DB, CZ));
    const ph2 = ph + Math.PI / 8;
    for (const th of [0.55, 0.95]) {
      const [r, y] = at(th, 0.03), pos = new THREE.Vector3(Math.sin(ph2) * r, y, Math.cos(ph2) * r), ob = new THREE.Object3D();
      ob.position.set(CX, DB, CZ).add(pos); ob.lookAt(ob.position.clone().add(new THREE.Vector3(pos.x, pos.y * 0.5, pos.z))); ob.updateMatrix();
      B.add(new THREE.TorusGeometry(0.14, 0.04, 6, 12), lead, ob.matrix.clone());
      B.add(new THREE.CircleGeometry(0.12, 12), bar, ob.matrix.clone().multiply(mat4(0, 0, 0.005)));
    }
  }
  // balustraded gallery, lantern, bell-shaped spire, ball and cross
  const LY = DB + 3.35;
  for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; B.add(new THREE.CylinderGeometry(0.03, 0.045, 0.4, 6), bar, mat4(CX + Math.sin(a) * 1.3, LY + 0.2, CZ + Math.cos(a) * 1.3)); }
  B.add(new THREE.TorusGeometry(1.3, 0.035, 5, 28).rotateX(Math.PI / 2), bar, mat4(CX, LY + 0.42, CZ));
  col(lead, 1.0, 1.0, 0.3, CX, LY, CZ, 16);
  col(lead, 0.82, 0.88, 1.5, CX, LY + 0.3, CZ, 16);
  for (let k = 0; k < 6; k++) {
    const a = k * Math.PI / 3, lb = mat4(CX, 0, CZ, a).multiply(mat4(0, 0, 0.87));
    B.add(extrude(rarch(0.34, 0.95, 0.0), 0.03), bar, lb.clone().multiply(mat4(0, LY + 0.65, 0)));
    const lb2 = mat4(CX, 0, CZ, a + Math.PI / 6).multiply(mat4(0, 0, 0.85)); col(lead, 0.07, 0.07, 1.2, 0, LY + 0.45, 0, 8, lb2);
  }
  col(lead, 0.95, 0.95, 0.16, CX, LY + 1.8, CZ, 16);
  B.add(new THREE.LatheGeometry([[0.98, 0], [0.9, 0.1], [0.72, 0.25], [0.5, 0.55], [0.34, 0.95], [0.24, 1.35], [0.2, 1.6]].map(p => new THREE.Vector2(p[0], p[1])), 16), lead, mat4(CX, LY + 1.95, CZ));
  B.add(new THREE.SphereGeometry(0.2, 12, 10), verd, mat4(CX, LY + 3.7, CZ));
  bx(verd, 0.1, 0.85, 0.1, CX, LY + 3.85, CZ); bx(verd, 0.5, 0.1, 0.1, CX, LY + 4.35, CZ);

  B.flush(g);

  const P = []; if (o.props !== false) { flagpole(g, 'france', 8.5, 6.5, sp, 6); P.push({ x: 8.5, z: 6.5, r: 0.5, prop: true }); }
  return { r: 9.5, front: 9.2, h: 22, cols: [...P, { x: 0, z: -0.5, r: 8 }, { x: 0, z: 4, r: 3.4 }] };
}
