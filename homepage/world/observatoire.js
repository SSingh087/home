// Observatoire de Paris (Perrault's building): severe pale-limestone block in three storeys of tall
// round-arched windows, a projecting pedimented pavilion with a clock, octagonal corner towers and a
// central drum, each carrying a white observing dome with a slit; wrought-iron fence and the statue of
// Le Verrier. Modelled on reference-assets/buildings/observatoire-de-paris/. Contract as the other builders.
import * as THREE from 'three';
import { Batch, I, mat4, materials, parts } from './detail.js';
import { flagpole } from './props.js';

const clockTex = () => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const k = c.getContext('2d');
  k.fillStyle = '#9cc8c0'; k.beginPath(); k.arc(64, 64, 62, 0, 7); k.fill(); k.strokeStyle = '#2b3a38'; k.lineWidth = 3; k.beginPath(); k.arc(64, 64, 59, 0, 7); k.stroke();
  k.fillStyle = '#1f2b2a'; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; k.beginPath(); k.arc(64 + Math.sin(a) * 51, 64 - Math.cos(a) * 51, 3.2, 0, 7); k.fill(); }
  k.lineWidth = 6; k.lineCap = 'round'; k.strokeStyle = '#1f2b2a'; k.beginPath(); k.moveTo(64, 64); k.lineTo(64, 26); k.moveTo(64, 64); k.lineTo(86, 78); k.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

export function observatoire(g, sp, o = {}) {
  const M = materials({
    stone: { light: ['#cfbf9f', '#c8b794', '#d5c6a7', '#c1b08d', '#cbbb9a'], dark: ['#aa9a7a', '#b3a283'], mortar: '#a39373', courses: [30, 14], widths: [80, 80], darkP: 0.1, seed: 41, weather: 0.07, pits: 3200 },
    trim: 0xe9dcbf, plinth: 0xa39478, bumpScale: 1.1,
  });
  const { stone, trim, plinth, bar } = M;
  const dome = new THREE.MeshStandardMaterial({ color: 0xeceff2, roughness: 0.42, metalness: 0.3 });
  const rib = new THREE.MeshStandardMaterial({ color: 0xc3c9d0, roughness: 0.5, metalness: 0.3 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x23272c, roughness: 0.55, metalness: 0.5 });
  const bronze = new THREE.MeshStandardMaterial({ color: 0x4d4a3e, roughness: 0.5, metalness: 0.4 });
  M.recess = bar;
  const B = new Batch();
  const { bx, col, cone, swin, rwin, dentils, balustrade } = parts(B, M);

  // ================================================================ main block (three storeys + attic)
  const W = 14, D = 6, H = 8.0;
  bx(plinth, W + 0.5, 0.45, D + 0.5, 0, 0, 0);
  bx(stone, W, H, D, 0, 0, 0);
  bx(trim, W + 0.1, 0.18, D + 0.1, 0, 2.65, 0);
  bx(trim, W + 0.1, 0.18, D + 0.1, 0, 6.2, 0);
  bx(trim, W + 0.55, 0.3, D + 0.55, 0, H, 0);                            // cornice
  dentils(W + 0.3, 0, H - 0.14, D / 2 + 0.28); dentils(W + 0.3, 0, H - 0.14, -D / 2 - 0.28);
  bx(stone, W, 0.7, 0.4, 0, H + 0.3, D / 2 - 0.25); bx(stone, W, 0.7, 0.4, 0, H + 0.3, -D / 2 + 0.25);   // parapet
  bx(stone, 0.4, 0.7, D - 0.8, -W / 2 + 0.25, H + 0.3, 0); bx(stone, 0.4, 0.7, D - 0.8, W / 2 - 0.25, H + 0.3, 0);
  bx(trim, W + 0.4, 0.12, D + 0.4, 0, H + 1.0, 0);                         // parapet coping

  const face = (fz, ry = 0, fx = 0) => mat4(fx, 0, fz, ry);
  const wing = (base, xs) => { for (const x of xs) { rwin(base, x, 0.6, 0.85, 1.7); rwin(base, x, 3.0, 0.95, 2.8); swin(base, x, 6.55, 0.8, 1.0); } };
  wing(face(D / 2), [-5.8, -4.4, -3.0, 3.0, 4.4, 5.8]);
  wing(face(-D / 2, Math.PI), [-5.8, -4.4, -3.0, 0, 3.0, 4.4, 5.8]);
  for (const s of [-1, 1]) wing(face(0, s * Math.PI / 2, s * W / 2), [-1.5, 0, 1.5]);

  // ================================================================ central pavilion with pediment and clock
  const PW = 4.6, PD = 3.1, PZ = D / 2 + PD / 2 - 1.3, PF = PZ + PD / 2;     // front face z
  bx(plinth, PW + 0.5, 0.45, PD + 0.5, 0, 0, PZ);
  bx(stone, PW, 9.0, PD, 0, 0, PZ);
  bx(trim, PW + 0.1, 0.18, PD + 0.1, 0, 2.65, PZ); bx(trim, PW + 0.1, 0.18, PD + 0.1, 0, 6.2, PZ);
  bx(trim, PW + 0.7, 0.34, PD + 0.7, 0, 9.0, PZ);
  dentils(PW + 0.5, 0, 8.86, PF + 0.3);
  const pf = mat4(0, 0, PF);
  rwin(pf, 0, 0.5, 1.4, 2.0, { f: 0.18 });
  rwin(pf, 0, 3.1, 1.3, 3.0, { f: 0.18 });
  bx(trim, 2.0, 0.25, 0.14, 0, 2.5, 0.0, pf);                              // sill band under the tall window
  // pediment with a clock in the tympanum
  { const s = new THREE.Shape(); s.moveTo(-(PW + 0.8) / 2, 0); s.lineTo((PW + 0.8) / 2, 0); s.lineTo(0, 1.4); s.closePath();
    const mk = (d) => new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
    const uvScale = geo => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 4, uv.getY(i) / 4); return geo; };
    B.add(uvScale(mk(0.5)), trim, mat4(0, 9.34, PF - 0.45));
    const inner = new THREE.Shape(); inner.moveTo(-(PW + 0.1) / 2, 0); inner.lineTo((PW + 0.1) / 2, 0); inner.lineTo(0, 1.08); inner.closePath();
    B.add(uvScale(new THREE.ExtrudeGeometry(inner, { depth: 0.1, bevelEnabled: false }), 1), stone, mat4(0, 9.36, PF + 0.02));
    const clk = new THREE.Mesh(new THREE.CircleGeometry(0.46, 28), new THREE.MeshStandardMaterial({ map: clockTex(), roughness: 0.6 }));
    clk.position.set(0, 9.95, PF + 0.14); g.add(clk);
    B.add(new THREE.TorusGeometry(0.5, 0.06, 6, 28), trim, mat4(0, 9.95, PF + 0.13)); }
  bx(stone, PW - 0.6, 1.7, 1.3, 0, 9.34, PZ - 0.6);                          // attic block behind the pediment

  // ================================================================ corner towers + central drum, each with a white dome
  const addDome = (cx, cz, y, r, hr) => {
    const prof = []; for (let i = 0; i <= 24; i++) { const th = i / 24 * Math.PI / 2 * 0.99; prof.push(new THREE.Vector2(r * Math.cos(th), r * hr * Math.sin(th))); }
    B.add(new THREE.LatheGeometry(prof, 36), dome, mat4(cx, y, cz));
    for (let k = 0; k < 8; k++) {
      const ph = k * Math.PI / 4, pts = [];
      for (let i = 0; i <= 14; i++) { const th = i / 14 * Math.PI / 2 * 0.97; pts.push(new THREE.Vector3(Math.sin(ph) * (r + 0.03) * Math.cos(th), (r * hr + 0.03) * Math.sin(th), Math.cos(ph) * (r + 0.03) * Math.cos(th))); }
      B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, 0.035, 5), rib, mat4(cx, y, cz));
    }
    // observing slit facing the front-right
    const th = 0.62, ph = 0.35, pos = new THREE.Vector3(Math.sin(ph) * r * Math.cos(th), r * hr * Math.sin(th), Math.cos(ph) * r * Math.cos(th)), ob = new THREE.Object3D();
    ob.position.set(cx, y, cz).add(pos); ob.lookAt(ob.position.clone().add(new THREE.Vector3(pos.x, pos.y * 0.6, pos.z))); ob.updateMatrix();
    B.add(new THREE.PlaneGeometry(r * 0.2, r * 0.6), bar, ob.matrix.clone().multiply(mat4(0, 0, 0.02)));
    cone(iron, 0.04, 0.5, cx, y + r * hr, cz, 5);
  };
  for (const s of [-1, 1]) {
    const tx = s * 6.35, tz = -2.4, tr = 1.75, th = 9.8;
    col(plinth, tr + 0.15, tr + 0.2, 0.45, tx, 0, tz, 8);
    col(stone, tr, tr, th, tx, 0.1, tz, 8);
    col(trim, tr + 0.12, tr + 0.12, 0.2, tx, 3.2, tz, 8); col(trim, tr + 0.12, tr + 0.12, 0.2, tx, 6.6, tz, 8);
    col(trim, tr + 0.28, tr + 0.28, 0.32, tx, th, tz, 8);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + Math.PI / 8, tb = mat4(tx, 0, tz, a).multiply(mat4(0, 0, tr * Math.cos(Math.PI / 8) - 0.01));
      rwin(tb, 0, 0.8, 0.5, 1.7, { f: 0.1 }); rwin(tb, 0, 3.5, 0.5, 2.3, { f: 0.1 }); swin(tb, 0, 6.9, 0.5, 1.3);
    }
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; B.add(new THREE.CylinderGeometry(0.035, 0.05, 0.4, 5), trim, mat4(tx + Math.sin(a) * (tr + 0.15), th + 0.52, tz + Math.cos(a) * (tr + 0.15))); }
    B.add(new THREE.TorusGeometry(tr + 0.15, 0.04, 5, 24).rotateX(Math.PI / 2), trim, mat4(tx, th + 0.75, tz));
    addDome(tx, tz, th + 0.32, tr * 0.9, 0.85);
  }
  { const cx = 0, cz = -2.6, r = 2.9;                                      // central rear drum and big dome
    col(stone, r, r, 3.4, cx, H + 0.3, cz, 32); col(trim, r + 0.2, r + 0.2, 0.28, cx, H + 3.7, cz, 32);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8, db = mat4(cx, 0, cz, a).multiply(mat4(0, 0, r - 0.02)); rwin(db, 0, H + 1.1, 0.7, 1.5, { f: 0.1 }); }
    addDome(cx, cz, H + 3.98, r * 0.98, 0.9); }

  // ================================================================ wrought-iron fence with stone piers
  const FZ = 7.4;
  for (let i = 0; i <= 26; i++) { const x = -6.5 + i * 0.5; B.add(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 5), iron, mat4(x, 0.75, FZ)); B.add(new THREE.ConeGeometry(0.06, 0.2, 4), iron, mat4(x, 1.6, FZ)); }
  bx(iron, 13.2, 0.07, 0.07, 0, 0.35, FZ); bx(iron, 13.2, 0.07, 0.07, 0, 1.25, FZ);
  for (const x of [-6.9, -3.2, 3.2, 6.9]) { bx(stone, 0.5, 1.9, 0.5, x, 0, FZ); bx(trim, 0.64, 0.14, 0.64, x, 1.9, FZ); cone(trim, 0.2, 0.3, x, 2.04, FZ, 4); }

  // ================================================================ statue of Le Verrier (stepped plinth, bronze figure with a globe)
  const SX = -3.4, SZ = 6.2;
  bx(plinth, 1.7, 0.18, 1.7, SX, 0, SZ); bx(stone, 1.3, 0.2, 1.3, SX, 0.18, SZ); bx(stone, 0.95, 1.5, 0.95, SX, 0.38, SZ); bx(trim, 1.15, 0.16, 1.15, SX, 1.88, SZ);
  B.add(new THREE.CylinderGeometry(0.2, 0.3, 1.15, 8), bronze, mat4(SX, 2.64, SZ));                    // coat
  B.add(new THREE.CapsuleGeometry(0.17, 0.45, 3, 8), bronze, mat4(SX, 3.45, SZ));                      // torso
  B.add(new THREE.SphereGeometry(0.13, 10, 8), bronze, mat4(SX, 3.95, SZ));                            // head
  B.add(new THREE.SphereGeometry(0.17, 10, 8), bronze, mat4(SX + 0.22, 3.2, SZ + 0.25));               // globe
  B.add(new THREE.CapsuleGeometry(0.06, 0.4, 3, 6), bronze, mat4(SX + 0.12, 3.35, SZ + 0.12).multiply(new THREE.Matrix4().makeRotationX(-0.9)));

  B.flush(g);

  const P = []; if (o.props !== false) { flagpole(g, 'france', -8, 8.8, sp, 6); P.push({ x: -8, z: 8.8, r: 0.5, prop: true }); }
  return { r: 9, front: 10, h: 17, cols: [...P, { x: -7, z: 6, r: 0.6 }, { x: 6.5, z: 6.5, r: 0.6 }, { x: -7.5, z: -4.5, r: 0.6 }, { x: 7.5, z: -4.5, r: 0.6 }, { x: 7.5, z: 3.5, r: 0.6 }, { x: -8, z: 3, r: 0.6 }, { x: -6, z: 7.5, r: 0.6 }, { x: 3.5, z: 7.5, r: 0.6 }, { x: -8, z: -2.5, r: 0.6 }, { x: 8, z: -2.5, r: 0.6 }, { x: -8, z: 7.5, r: 0.6 }, { x: 8, z: 5.5, r: 0.6 }, { x: 8, z: 7.5, r: 0.6 }, { x: 0, z: 0, r: 7.4 }, { x: 0, z: -2, r: 4.2 }, { x: SX, z: SZ, r: 0.9, prop: true }] };
}
