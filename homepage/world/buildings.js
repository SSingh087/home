// Chunky miniature landmarks, modelled loosely on the photos in reference-assets/buildings/.
// Every builder fills group `g` in local space (front = +z, ground = y 0) and returns
// { r, front, h, cols } : footprint radius, z of the pad, label height, local collision circles.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { flagpole, gem, wellington, brandenburg } from './props.js';

export const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, metalness: 0, ...o });
const add = (g, m, x, y, z) => { m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
const rbox = (g, w, h, d, x, y, z, mat, r = 0.25) => mat.map && mat.userData.base !== undefined
  ? add(g, new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [mat, mat, M(mat.userData.base), M(mat.userData.base), mat, mat]), x, y + h / 2, z)
  : add(g, new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.max(0.01, Math.min(r, w / 2 - 0.01, h / 2 - 0.01, d / 2 - 0.01))), mat), x, y + h / 2, z);
const cyl = (g, rt, rb, h, x, y, z, mat, seg = 28) => add(g, new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat), x, y + h / 2, z);
const cone = (g, r, h, x, y, z, mat, seg = 24) => add(g, new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat), x, y + h / 2, z);
const ball = (g, r, x, y, z, mat) => add(g, new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat), x, y, z);
const dome = (g, r, x, y, z, mat) => add(g, new THREE.Mesh(new THREE.SphereGeometry(r, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2), mat), x, y, z);
// triangular prism: gable width w, height h, ridge along z unless ridgeX
function prism(g, w, h, d, x, y, z, mat, ridgeX = false) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); geo.translate(0, 0, -d / 2);
  const m = add(g, new THREE.Mesh(geo, mat), x, y, z); if (ridgeX) m.rotation.y = Math.PI / 2; return m;
}
// ribs on a dome, like the Sorbonne's slate dome
function ribs(g, r, n, x, y, z, mat) {
  for (let i = 0; i < n; i++) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.07, 6, 24, Math.PI / 2), mat);
    t.position.set(x, y, z); t.rotation.y = (i / n) * Math.PI * 2; g.add(t);
  }
}

// wall texture: stone courses + windows (optionally arched / gothic)
function facade({ base, line = null, win = '#35404f', frame = null, cols = 4, rows = 2, arch = false, tall = false }) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const k = c.getContext('2d'); k.fillStyle = base; k.fillRect(0, 0, 256, 256);
  if (line) { k.fillStyle = line; for (let y = 0; y < 256; y += 16) k.fillRect(0, y, 256, 2); }
  const w = 256 / cols, h = 256 / rows, ww = w * 0.46, wh = h * (tall ? 0.7 : 0.55);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x = i * w + (w - ww) / 2, y = j * h + (h - wh) / 2;
    if (frame) { k.fillStyle = frame; k.fillRect(x - 3, y - 3, ww + 6, wh + 6); }
    k.fillStyle = win; k.beginPath();
    if (arch) { k.rect(x, y + ww / 2, ww, wh - ww / 2); k.arc(x + ww / 2, y + ww / 2, ww / 2, Math.PI, 0); } else k.rect(x, y, ww, wh);
    k.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}
const wall = (opts, rx, ry, extra = {}) => { const t = facade(opts); t.repeat.set(rx, ry); const m = M(0xffffff, { map: t, ...extra }); m.userData.base = new THREE.Color(opts.base).getHex(); return m; };
const label = (text, w, h, bg, fg, font = 600) => {
  const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w);
  const k = c.getContext('2d'); k.fillStyle = bg; k.fillRect(0, 0, c.width, c.height);
  k.fillStyle = fg; k.font = `${font} ${c.height * 0.5}px sans-serif`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(text, c.width / 2, c.height / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
const clockFace = () => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const k = c.getContext('2d');
  k.fillStyle = '#f7f3e8'; k.beginPath(); k.arc(64, 64, 62, 0, 7); k.fill(); k.strokeStyle = '#2b2b2b'; k.lineWidth = 7; k.lineCap = 'round';
  k.beginPath(); k.moveTo(64, 64); k.lineTo(64, 22); k.moveTo(64, 64); k.lineTo(92, 78); k.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ map: t }));
};

const CREAM = 0xf0dfba, SLATE = 0x4b5563, WHITE = 0xf7f1e6, DARK = 0x2a3038;

// ---------------------------------------------------------------- SVNIT Surat
export function svnit(g, sp, o = {}) {
  const terra = wall({ base: '#d98a4e', line: 'rgba(120,60,20,.12)', win: '#5a3422', frame: '#f3e2c0', cols: 6, rows: 2 }, 3, 1);
  rbox(g, 14, 5, 6, 0, 0, 0, terra, 0.35);
  rbox(g, 14.5, 0.6, 6.5, 0, 5, 0, M(CREAM), 0.2);
  rbox(g, 6, 3.4, 4, 0, 5.6, -0.5, wall({ base: '#e0955a', win: '#5a3422', frame: '#f3e2c0', cols: 3, rows: 1 }, 1, 1), 0.3);
  // taller hostel-style block behind
  rbox(g, 5, 9, 5, -6.2, 0, -5.5, wall({ base: '#c8643a', line: 'rgba(0,0,0,.1)', win: '#3f2418', frame: '#f3e2c0', cols: 3, rows: 5 }, 1, 1), 0.3);
  // round white tower with circular openings
  cyl(g, 2.1, 2.1, 7.4, 6.3, 0, -1.2, M(WHITE));
  cyl(g, 2.4, 2.4, 0.5, 6.3, 7.4, -1.2, M(0xd9cfbd));
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { const a = -0.9 + i * 0.36 + Math.PI / 2 * 0; ball(g, 0.26, 6.3 + Math.sin(a + 0.6) * 2.12, 2.6 + j * 2.2, -1.2 + Math.cos(a + 0.6) * 2.12, M(0x3a2a22)).scale.set(1, 1, 0.3); }
  // gate: pointed centre pylon over a banner, as on the campus entrance
  [-3.6, 3.6].forEach(x => { rbox(g, 1.2, 3.8, 1.2, x, 0, 6.6, M(CREAM), 0.2); cone(g, 0.85, 1.2, x, 3.8, 6.6, M(0xc8643a), 4).rotation.y = Math.PI / 4; });
  rbox(g, 8.6, 1, 0.6, 0, 3, 6.6, new THREE.MeshStandardMaterial({ map: label('SVNIT SURAT', 8.6, 1, '#1d2f55', '#ffffff'), roughness: 0.7 }), 0.15);
  cone(g, 1.1, 2.4, 0, 4, 6.6, M(CREAM), 4).rotation.y = Math.PI / 4;
  const P = []; if (o.props !== false) { const gm = gem(g, -7.5, 6.5, sp); flagpole(g, 'india', 8, 5.5, sp, 6.5); P.push({ x: -7.5, z: 6.5, r: gm.r, prop: true }, { x: 8, z: 5.5, r: 0.5, prop: true }); }
  return { r: 9, front: 9.8, h: 11, cols: [...P, { x: 0, z: 0, r: 7.5 }, { x: -6.2, z: -5.5, r: 3.8 }, { x: 6.3, z: -1.2, r: 2.6 }, { x: -3.6, z: 6.6, r: 0.9 }, { x: 3.6, z: 6.6, r: 0.9 }] };
}

// Sorbonne chapel lives in sorbonne.js (detailed masonry build)
export { sorbonne } from './sorbonne.js';

// Observatoire de Paris lives in observatoire.js (detailed masonry build)
export { observatoire } from './observatoire.js';

// University of Glasgow lives in glasgow.js (detailed masonry build)
export { glasgow } from './glasgow.js';

// ---------------------------------------------------------------- IIT Indore
export function iitIndore(g, sp, o = {}) {
  const glass = wall({ base: '#e9ecf1', line: null, win: '#4d8fa8', cols: 5, rows: 3 }, 3, 1);
  rbox(g, 14, 6, 5.5, 0, 0, -3, glass, 0.35);
  rbox(g, 14.6, 0.5, 6, 0, 6, -3, M(0xcfd5de), 0.15);
  [-7.6, 7.6].forEach(x => rbox(g, 4, 4.2, 3.4, x, 0, 3, M(0xdfe3ea), 0.3).material = wall({ base: '#dfe3ea', win: '#4d8fa8', cols: 2, rows: 2 }, 1, 1));
  // the white winged gateway from the entrance photo, over the blue sign board
  const white = M(0xffffff, { roughness: 0.4 });
  rbox(g, 1, 7.4, 1, 0, 0, 4.6, white, 0.12);
  [-1, 1].forEach(s => {
    const wing = rbox(g, 6.4, 0.55, 1.6, s * 3.2, 0, 4.6, white, 0.15); wing.position.y = 6.5 + 0.55; wing.rotation.z = s * 0.3;
    const strut = rbox(g, 5.4, 0.25, 0.25, s * 2.6, 0, 4.6, white, 0.08); strut.position.y = 6.9; strut.rotation.z = -s * 0.28;
  });
  rbox(g, 7.6, 2.2, 0.4, 0, 0.6, 5.3, new THREE.MeshStandardMaterial({ map: label('IIT INDORE', 7.6, 2.2, '#1f4fb5', '#e8eef7'), roughness: 0.6 }), 0.12);
  const P = []; if (o.props !== false) { flagpole(g, 'india', -9, 8, sp, 6.5); P.push({ x: -9, z: 8, r: 0.5, prop: true }); }
  return { r: 9, front: 8, h: 10, cols: [...P, { x: 0, z: -3, r: 7.2 }, { x: 0, z: 4.6, r: 1 }, { x: -7.6, z: 3, r: 2.4 }, { x: 7.6, z: 3, r: 2.4 }] };
}

// ---------------------------------------------------------------- Max Planck Institute / AEI Hannover
export function aei(g, spinners, o = {}) {
  const glassMat = M(0x8fd6bc, { transparent: true, opacity: 0.78, roughness: 0.2, metalness: 0.1 });
  const edge = new THREE.LineBasicMaterial({ color: 0x24343a });
  const gbox = (w, h, d, x, y, z, mat = glassMat) => {
    const m = rbox(g, w, h, d, x, y, z, mat, 0.12);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), edge); e.position.copy(m.position); g.add(e);
    for (let i = 1; i < Math.floor(w / 1.2); i++) { const s = rbox(g, 0.06, h, d + 0.02, -w / 2 + x + i * 1.2, y, z, M(0x6fb89c, { transparent: true, opacity: 0.6 }), 0.01); s.castShadow = false; }
    return m;
  };
  gbox(13, 4.2, 5.4, -1, 0, 0);
  gbox(8, 3.4, 5, 2.2, 4.2, -0.8);
  rbox(g, 3, 4.2, 3.4, 8.2, 0, -2.6, M(0xd8344a), 0.3);
  rbox(g, 5, 0.25, 0.25, 5.2, 3.4, -2.6, M(0x24343a), 0.05);
  // LISA triangle sculpture: three spacecraft joined by laser arms
  const L = new THREE.Group(); L.position.set(-1, 11, 0); g.add(L);
  const pts = [0, 1, 2].map(i => new THREE.Vector3(Math.cos(i * 2.094) * 3.4, 0, Math.sin(i * 2.094) * 3.4));
  pts.forEach(p => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xffa030, emissiveIntensity: 0.9 })); m.position.copy(p); m.castShadow = true; L.add(m); });
  [[0, 1], [1, 2], [2, 0]].forEach(([a, b]) => {
    const d = pts[b].clone().sub(pts[a]), arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, d.length(), 6), new THREE.MeshBasicMaterial({ color: 0xff5a5a }));
    arm.position.copy(pts[a]).addScaledVector(d, 0.5); arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); L.add(arm);
  });
  cyl(g, 0.15, 0.25, 7.6, -1, 4, 0, M(0x6b7380), 8);
  spinners.push(L);
  const P = []; if (o.props !== false) { brandenburg(g, -14, 4); flagpole(g, 'germany', 11, 6, spinners, 6.5); P.push({ x: -14, z: 4, r: 4.8, prop: true }, { x: 11, z: 6, r: 0.5, prop: true }); }
  return { r: 9, front: 7.6, h: 15, cols: [...P, { x: -1, z: 0, r: 6.8 }, { x: 8.2, z: -2.6, r: 2.2 }] };
}

// ---------------------------------------------------------------- Plaza centrepiece: spinning black hole sculpture
export function blackHoleSculpture(scene, spinners) {
  const g = new THREE.Group(); scene.add(g);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 1, 24), M(0xb8ab94)); base.position.y = 0.5; base.castShadow = base.receiveShadow = true; g.add(base);
  const bh = new THREE.Group(); bh.position.y = 3; g.add(bh);
  bh.add(new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 20), new THREE.MeshBasicMaterial({ color: 0x000000 })));
  const disc = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.9, 48), new THREE.MeshBasicMaterial({ color: 0xffa030, side: THREE.DoubleSide }));
  disc.rotation.x = Math.PI / 2.2; bh.add(disc); spinners.push(bh);
  return { r: 1.8 };
}
