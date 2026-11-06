// IIT Indore: modern institute building. White composite-panel walls, glazed curtain-wall atrium with
// mullions, concrete sun-shade fins and brise-soleil, an entrance canopy, and the white winged gateway
// over the blue 'IIT INDORE' sign board with its flower bed and gates (reference-assets/buildings/iit-indore/).
// Contract as the other builders: front = +z, ground = y 0, returns { r, front, h, cols }.
import * as THREE from 'three';
import { Batch, I, mat4, materials, parts, glassExtrude, rect } from './detail.js';
import { flagpole } from './props.js';

const signTex = () => {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 320; const k = c.getContext('2d');
  k.fillStyle = '#1b47b3'; k.fillRect(0, 0, 1024, 320);
  const g = k.createLinearGradient(0, 0, 0, 320); g.addColorStop(0, 'rgba(255,255,255,.10)'); g.addColorStop(1, 'rgba(0,0,0,.18)'); k.fillStyle = g; k.fillRect(0, 0, 1024, 320);
  k.fillStyle = '#f4f6fa'; k.fillRect(46, 52, 210, 216);                                  // emblem plate
  k.strokeStyle = '#1b47b3'; k.lineWidth = 8; k.beginPath(); k.arc(151, 160, 78, 0, 7); k.stroke();
  k.fillStyle = '#1b47b3'; k.beginPath(); k.arc(151, 160, 60, Math.PI, 0); k.fill(); k.fillRect(103, 168, 96, 18);
  k.strokeStyle = '#f4f6fa'; k.lineWidth = 4; for (let i = 0; i < 9; i++) { const a = Math.PI + i * Math.PI / 8; k.beginPath(); k.moveTo(151 + Math.cos(a) * 20, 158 + Math.sin(a) * 20); k.lineTo(151 + Math.cos(a) * 52, 158 + Math.sin(a) * 52); k.stroke(); }
  const word = (txt, y, size) => {
    k.font = `700 ${size}px "Noto Sans Devanagari", "Nirmala UI", sans-serif`; k.textAlign = 'left'; k.textBaseline = 'middle';
    k.fillStyle = 'rgba(0,0,0,.4)'; k.fillText(txt, 306 + 4, y + 5);
    const m = k.createLinearGradient(0, y - size / 2, 0, y + size / 2); m.addColorStop(0, '#e9edf2'); m.addColorStop(0.5, '#8b929c'); m.addColorStop(1, '#d6dbe2');
    k.fillStyle = m; k.fillText(txt, 306, y);
  };
  word('आई.आई.टी. इन्दौर', 100, 84); word('IIT INDORE', 222, 112);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
};

export function iitIndore(g, sp, o = {}) {
  const M = materials({
    stone: { light: ['#ffffff', '#fafbfc', '#f6f8fa', '#fdfdfe'], dark: ['#e4e8ee', '#dde2e9'], mortar: '#dfe3e9', courses: [90, 30], widths: [150, 110], darkP: 0.12, seed: 77, weather: 0.03, pits: 700, joint: 2 },
    trim: 0xffffff, plinth: 0xb9c0cb, bumpScale: 0.5,
  });
  const { stone, trim, plinth, glass } = M;
  const alu = new THREE.MeshStandardMaterial({ color: 0x56606f, metalness: 0.15, roughness: 0.45 });
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.32 });
  const mirror = new THREE.MeshStandardMaterial({ color: 0x8d99a8, metalness: 0.25, roughness: 0.3 });
  const green = new THREE.MeshStandardMaterial({ color: 0x3f8f3f, roughness: 0.9 });
  const gold = M.gold;
  const B = new Batch();
  const { bx, col } = parts(B, M);

  // curtain wall: individual glass panes (each with the baked sky gradient) in an aluminium grid
  const curtain = (base, x, y, w, h, nc, nr, mw = 0.07) => {
    const pw = w / nc, ph = h / nr;
    for (let i = 0; i < nc; i++) for (let j = 0; j < nr; j++) B.add(glassExtrude(rect(pw - mw, ph - mw), 0.03), glass, base.clone().multiply(mat4(x - w / 2 + i * pw + pw / 2, y + j * ph + mw / 2, 0.02)));
    for (let i = 0; i <= nc; i++) bx(alu, mw, h + mw, 0.12, x - w / 2 + i * pw, y - mw / 2, 0.06, base);
    for (let j = 0; j <= nr; j++) bx(alu, w + mw, mw, 0.12, x, y + j * ph - mw / 2, 0.06, base);
  };
  const fins = (base, x0, x1, y, h, step = 0.8) => { for (let x = x0; x <= x1 + 1e-6; x += step) bx(trim, 0.12, h, 0.5, x, y, 0.25, base); };
  const shade = (base, x, y, w, d = 0.6) => bx(trim, w, 0.1, d, x, y, d / 2, base);

  // ================================================================ main block: panels, ribbon glazing, central atrium
  const MZ = -3;
  bx(plinth, 14.4, 0.4, 5.9, 0, 0, MZ);
  bx(stone, 14, 6.4, 5.5, 0, 0, MZ);
  bx(trim, 14.2, 0.26, 5.7, 0, 3.1, MZ);
  bx(trim, 14.6, 0.4, 6.0, 0, 6.4, MZ);
  const fb = mat4(0, 0, MZ + 2.75), bk = mat4(0, 0, MZ - 2.75, Math.PI);
  curtain(fb, 0, 0.5, 6.4, 5.6, 8, 4);                                      // central atrium
  bx(trim, 0.35, 6.4, 0.45, -3.4, 0, 0.1, fb); bx(trim, 0.35, 6.4, 0.45, 3.4, 0, 0.1, fb);
  for (const s of [-1, 1]) {
    const cx = s * 5.35;
    curtain(fb, cx, 0.9, 3.3, 1.9, 4, 1); curtain(fb, cx, 3.6, 3.3, 2.0, 4, 1);
    fins(fb, cx - 1.6, cx + 1.6, 0.8, 2.1); fins(fb, cx - 1.6, cx + 1.6, 3.5, 2.2);
    shade(fb, cx, 2.85, 3.6); shade(fb, cx, 5.7, 3.6);
    const side = mat4(s * 7, 0, MZ, s * Math.PI / 2);
    curtain(side, 0, 0.9, 4.2, 1.9, 4, 1); curtain(side, 0, 3.6, 4.2, 2.0, 4, 1);
  }
  curtain(bk, 0, 0.9, 11.6, 1.9, 12, 1); curtain(bk, 0, 3.6, 11.6, 2.0, 12, 1);
  // roof plant
  bx(stone, 2.4, 0.9, 1.7, -3.2, 6.8, MZ - 0.5); bx(stone, 1.6, 0.7, 1.4, 3.8, 6.8, MZ - 1.0); bx(trim, 0.5, 1.4, 0.5, 5.6, 6.8, MZ + 0.4);
  for (let i = 0; i < 6; i++) bx(alu, 1.8, 0.05, 0.08, -3.2, 6.9 + i * 0.12, MZ + 0.37);                     // louvres

  // ================================================================ entrance canopy
  bx(trim, 6.4, 0.24, 2.6, 0, 3.0, 1.3, fb); bx(alu, 6.4, 0.08, 0.08, 0, 2.94, 2.58, fb);
  for (const x of [-2.9, 2.9]) col(trim, 0.1, 0.1, 3.0, x, 0, MZ + 2.75 + 2.4, 10);

  // ================================================================ front wing pavilions
  for (const s of [-1, 1]) {
    const wx = s * 7.6, wz = 3, wf = mat4(wx, 0, wz + 1.7);
    bx(plinth, 4.3, 0.4, 3.7, wx, 0, wz); bx(stone, 4, 4.2, 3.4, wx, 0, wz); bx(trim, 4.3, 0.3, 3.7, wx, 4.2, wz); bx(trim, 4.15, 0.18, 3.55, wx, 2.2, wz);
    curtain(wf, 0, 0.7, 3.2, 1.3, 3, 1); curtain(wf, 0, 2.6, 3.2, 1.35, 3, 1); fins(wf, -1.5, 1.5, 0.6, 1.5, 1.0); shade(wf, 0, 2.1, 3.4, 0.45);
    const ws = mat4(wx + s * 2, 0, wz, s * Math.PI / 2); curtain(ws, 0, 0.7, 2.6, 1.3, 3, 1); curtain(ws, 0, 2.6, 2.6, 1.35, 3, 1);
  }

  // ================================================================ gateway: winged pylon over the blue sign board
  const GZ = 4.6;
  bx(white, 1.0, 10.2, 0.85, 0, 0, GZ);
  for (let i = 1; i < 7; i++) bx(alu, 1.02, 0.025, 0.87, 0, i * 1.45, GZ);                                    // panel joints
  const beam = (mat, a, b, w, h) => {
    const d = b.clone().sub(a), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    B.add(new THREE.BoxGeometry(w, d.length(), h), mat, new THREE.Matrix4().compose(a.clone().addScaledVector(d, 0.5), q, new THREE.Vector3(1, 1, 1)));
  };
  for (const s of [-1, 1]) {
    const root = new THREE.Vector3(s * 0.4, 7.9, GZ), tip = new THREE.Vector3(s * 4.8, 9.2, GZ);
    beam(white, root, tip, 0.62, 0.9);
    beam(mirror, root.clone().add(new THREE.Vector3(0, -0.34, 0)), tip.clone().add(new THREE.Vector3(0, -0.34, 0)), 0.5, 0.7);
    beam(white, new THREE.Vector3(s * 0.4, 10.15, GZ), new THREE.Vector3(s * 4.7, 9.5, GZ), 0.2, 0.2);              // upper struts
    beam(white, new THREE.Vector3(s * 0.4, 9.2, GZ), new THREE.Vector3(s * 2.7, 8.7, GZ), 0.18, 0.18);
  }
  bx(white, 1.1, 0.3, 0.95, 0, 10.2, GZ);
  // sign board with frame, flower bed and gates
  const SBZ = 5.35;
  bx(plinth, 7.9, 0.25, 0.8, 0, 0, SBZ);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(7.6, 2.4, 0.3), [alu, alu, alu, alu, new THREE.MeshStandardMaterial({ map: signTex(), roughness: 0.55 }), alu]);
  sign.position.set(0, 1.5, SBZ); sign.castShadow = sign.receiveShadow = true; g.add(sign);
  bx(white, 7.8, 0.12, 0.38, 0, 2.7, SBZ); bx(white, 0.12, 2.5, 0.38, -3.85, 0.25, SBZ); bx(white, 0.12, 2.5, 0.38, 3.85, 0.25, SBZ);
  bx(green, 7.2, 0.35, 0.6, 0, 0.0, SBZ + 0.65);
  for (let i = 0; i < 18; i++) B.add(new THREE.SphereGeometry(0.1, 6, 5), new THREE.MeshStandardMaterial({ color: i % 3 ? 0xff5c8a : 0xffd24a, roughness: 0.8 }), mat4(-3.3 + i * 0.39, 0.45 + (i % 2) * 0.05, SBZ + 0.65 + ((i * 7) % 3) * 0.12));
  for (const s of [-1, 1]) {                                                                                  // gate leaves
    const gx = s * 5.1; bx(white, 2.4, 0.08, 0.08, gx, 0.2, SBZ); bx(white, 2.4, 0.08, 0.08, gx, 2.1, SBZ); bx(white, 0.08, 2.0, 0.08, gx - 1.16, 0.2, SBZ); bx(white, 0.08, 2.0, 0.08, gx + 1.16, 0.2, SBZ);
    for (let i = 0; i < 14; i++) bx(white, 0.035, 1.9, 0.035, gx - 1.05 + i * 0.16, 0.25, SBZ);
  }
  B.flush(g);

  const P = []; if (o.props !== false) { flagpole(g, 'india', -9, 8, sp, 6.5); P.push({ x: -9, z: 8, r: 0.5, prop: true }); }
  return { r: 9, front: 8, h: 13, cols: [...P, { x: 0, z: -3, r: 7.2 }, { x: 0, z: 4.6, r: 1 }, { x: -7.6, z: 3, r: 2.4 }, { x: 7.6, z: 3, r: 2.4 }] };
}
