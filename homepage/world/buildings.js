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

// SVNIT Surat lives in svnit.js (detailed build)
export { svnit } from './svnit.js';

// Sorbonne chapel lives in sorbonne.js (detailed masonry build)
export { sorbonne } from './sorbonne.js';

// Observatoire de Paris lives in observatoire.js (detailed masonry build)
export { observatoire } from './observatoire.js';

// University of Glasgow lives in glasgow.js (detailed masonry build)
export { glasgow } from './glasgow.js';

// IIT Indore lives in iit.js (detailed build)
export { iitIndore } from './iit.js';

// AEI Hannover and the plaza black-hole sculpture live in aei.js (detailed build)
export { aei, blackHoleSculpture } from './aei.js';
