// Landmark props that say where each place is: flags, Eiffel Tower, Brandenburg Gate, a Surat diamond, the coned Duke of Wellington.
// Built from merged geometry (one mesh per material) with real proportions and detail rather than primitives.
import * as THREE from 'three';
import { Batch, I, rng, masonry, sbox, scol, worldUV } from './detail.js';

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o });
const put = (g, mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true; g.add(mesh); return mesh; };
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const Y = V(0, 1, 0), ONE = V(1, 1, 1);
const rot = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
const place = (x, y, z, ry = 0, s = 1) => new THREE.Matrix4().compose(V(x, y, z), rot(0, ry, 0), V(s, s, s));

// matrix that stands a unit-height shape (centred, along +y) between two points
const along = (a, b) => {
  const d = b.clone().sub(a), len = d.length();
  return { len, m: new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(Y, d.clone().divideScalar(len || 1)), ONE) };
};
// tapered limb: radius ra at a, rb at b
const limb = (B, mat, a, b, ra, rb, seg = 8, pre = I) => { const { len, m } = along(a, b); B.add(new THREE.CylinderGeometry(rb, ra, len, seg), mat, pre.clone().multiply(m)); };
// ellipsoid
const ell = (B, mat, p, r, e = [0, 0, 0], pre = I, seg = [14, 10]) =>
  B.add(new THREE.SphereGeometry(1, seg[0], seg[1]), mat, pre.clone().multiply(new THREE.Matrix4().compose(V(...p), rot(...e), V(...r))));
// fluted column shaft along +y (y from 0 to h)
const fluted = (r, h, N = 20) => {
  const s = new THREE.Shape();
  for (let i = 0; i <= 96; i++) { const a = i / 96 * Math.PI * 2, rr = r * (1 - 0.05 * Math.pow(0.5 - 0.5 * Math.cos(N * a), 1.5)); i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  return worldUV(new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 1 }).rotateX(-Math.PI / 2));
};
const tint = (geo, c) => { const n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo; };
const stoneMat = (o = {}) => { const m = masonry({ courses: [26, 12], widths: [70, 70], darkP: 0.1, seed: 5, ...o }); return new THREE.MeshStandardMaterial({ map: m.map, bumpMap: m.bump, bumpScale: 1.2, roughness: 0.95 }); };

// ================================================================ flags
const flagTex = kind => {
  const c = document.createElement('canvas'); c.width = 300; c.height = 200; const k = c.getContext('2d');
  if (kind === 'scotland') { k.fillStyle = '#0a5ec2'; k.fillRect(0, 0, 300, 200); k.strokeStyle = '#fff'; k.lineWidth = 30; k.beginPath(); k.moveTo(0, 0); k.lineTo(300, 200); k.moveTo(300, 0); k.lineTo(0, 200); k.stroke(); }
  if (kind === 'india') { k.fillStyle = '#ff9933'; k.fillRect(0, 0, 300, 67); k.fillStyle = '#fff'; k.fillRect(0, 67, 300, 66); k.fillStyle = '#138808'; k.fillRect(0, 133, 300, 67);
    k.strokeStyle = '#000080'; k.lineWidth = 3; k.beginPath(); k.arc(150, 100, 26, 0, 7); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; k.moveTo(150, 100); k.lineTo(150 + Math.cos(a) * 26, 100 + Math.sin(a) * 26); } k.stroke(); }
  if (kind === 'germany') { k.fillStyle = '#111'; k.fillRect(0, 0, 300, 67); k.fillStyle = '#dd0000'; k.fillRect(0, 67, 300, 66); k.fillStyle = '#ffce00'; k.fillRect(0, 133, 300, 67); }
  if (kind === 'france') { k.fillStyle = '#0055a4'; k.fillRect(0, 0, 100, 200); k.fillStyle = '#fff'; k.fillRect(100, 0, 100, 200); k.fillStyle = '#ef4135'; k.fillRect(200, 0, 100, 200); }
  k.strokeStyle = 'rgba(0,0,0,.25)'; k.lineWidth = 6; k.strokeRect(0, 0, 300, 200);        // stitched hem
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

// waving flag on a stepped-base pole with a finial, pulley, halyard and cleat; `animators` receives a per-frame function
export function flagpole(g, kind, x, z, animators, h = 7) {
  const steel = std(0xd9dce2, { metalness: 0.55, roughness: 0.35 }), gold = std(0xe3b64a, { metalness: 0.8, roughness: 0.3, emissive: 0x3a2800 }), rope = std(0xe9e2cf, { roughness: 0.9 }), base = stoneMat({ seed: 9 });
  const B = new Batch(), at = new THREE.Matrix4().makeTranslation(x, 0, z);
  B.add(sbox(0.8, 0.18, 0.8), base, at.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.09, 0)));
  B.add(sbox(0.55, 0.28, 0.55), base, at.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.32, 0)));
  B.add(new THREE.CylinderGeometry(0.2, 0.26, 0.18, 12), steel, at.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.55, 0)));
  const prof = [[0.12, 0.6], [0.105, h * 0.5], [0.085, h * 0.9], [0.07, h]].map(p => new THREE.Vector2(...p));
  B.add(new THREE.LatheGeometry(prof, 10), steel, at);                                                      // tapered shaft
  B.add(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 10), gold, at.clone().multiply(new THREE.Matrix4().makeTranslation(0, h * 0.5, 0)));   // collar
  B.add(new THREE.SphereGeometry(0.17, 12, 10), gold, at.clone().multiply(new THREE.Matrix4().makeTranslation(0, h + 0.1, 0)));            // truck
  B.add(new THREE.ConeGeometry(0.05, 0.4, 8), gold, at.clone().multiply(new THREE.Matrix4().makeTranslation(0, h + 0.4, 0)));             // spear finial
  B.add(new THREE.TorusGeometry(0.06, 0.018, 6, 12), steel, at.clone().multiply(new THREE.Matrix4().compose(V(0.12, h - 0.15, 0), rot(0, Math.PI / 2, 0), ONE)));   // pulley
  limb(B, rope, V(0.13, 0.9, 0.02), V(0.13, h - 0.2, 0.02), 0.012, 0.012, 4, at);                         // halyard, two runs
  limb(B, rope, V(0.16, 0.9, 0.0), V(0.16, h - 0.2, 0.0), 0.012, 0.012, 4, at);
  B.add(new THREE.BoxGeometry(0.1, 0.05, 0.05), steel, at.clone().multiply(new THREE.Matrix4().makeTranslation(0.17, 1.2, 0.0)));          // cleat
  B.flush(g);
  const geo = new THREE.PlaneGeometry(3.2, 2.1, 16, 4), baseP = geo.attributes.position.array.slice();
  const flag = put(g, new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: flagTex(kind), side: THREE.DoubleSide, roughness: 0.9 })), x + 1.7, h - 1.1, z); flag.castShadow = false;   // waves every frame; would force a shadow refresh
  for (const dy of [-0.8, 0.8]) put(g, new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 5, 10), steel), x + 0.12, h - 1.1 + dy, z).castShadow = false;     // grommets
  animators.push(t => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const bx = baseP[i * 3] + 1.6; p.setZ(i, Math.sin(bx * 1.6 - t * 4) * 0.22 * (bx / 3.2)); } p.needsUpdate = true; });
}

// ================================================================ Eiffel Tower
const rivetTex = () => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const k = c.getContext('2d'); k.fillStyle = '#7c7c7c'; k.fillRect(0, 0, 64, 64);
  const r = rng(17); for (let i = 0; i < 160; i++) { k.fillStyle = r() < 0.5 ? '#3a3a3a' : '#c8c8c8'; k.fillRect(r() * 64, r() * 64, 2, 2); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
};

// Four lattice legs on the real exponential taper, open arches with lattice ribs, X-braced faces with finer sub-bracing low down,
// three platforms with railings, an upper cabin, a lattice spire and antenna. All ironwork merges into a single mesh.
export function eiffel(g, x, z, s = 1) {
  const iron = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.62, metalness: 0.2, emissive: 0x2a1a0c, emissiveIntensity: 0.35, bumpMap: rivetTex(), bumpScale: 0.8 });
  const deckMat = std(0xb8a07f, { roughness: 0.6 });
  const B = new Batch(), D = new Batch(), rnd = rng(3), brown = new THREE.Color(0x7e6048);
  const t = new THREE.Group(); t.position.set(x, 0, z); t.scale.setScalar(s); g.add(t);
  const H = 19, W0 = 4.2, w = f => W0 * (0.93 * Math.exp(-4.3 * f) + 0.07);
  const beam = (a, b, r) => {
    const { len, m } = along(a, b), geo = new THREE.BoxGeometry(2 * r, len, 2 * r), uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.3, uv.getY(i) * len / 1.2);
    B.add(tint(geo, brown.clone().multiplyScalar(0.82 + rnd() * 0.3)), iron, m);
  };
  const FT = 0.215, N = 22, FP = [0.27, 0.56, 0.8];
  const P = (a, f, ax, sg) => ax === 0 ? V(a * w(f), f * H, sg * w(f)) : V(sg * w(f), f * H, a * w(f));   // point on a lattice face
  // legs: four thin members per corner, tied by square rungs
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    const sub = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
    const at = (i, f) => { const o = 0.5 * (1 - f) + 0.08, [ox, oz] = sub[i]; return V(a * w(f) + ox * o, f * H, b * w(f) + oz * o); };
    for (let i = 0; i < N; i++) {
      const f0 = i / N, f1 = (i + 1) / N, r = 0.075 * (1 - f0) + 0.035;
      for (let k = 0; k < 4; k++) beam(at(k, f0), at(k, f1), r);
      if (i % 2 === 0) for (const [p, q] of [[0, 1], [1, 3], [3, 2], [2, 0], [0, 3]]) beam(at(p, f0), at(q, f0), 0.035);
      for (const [p, q] of [[0, 1], [2, 3], [0, 2], [1, 3]]) { beam(at(p, f0), at(q, f1), 0.03); beam(at(q, f0), at(p, f1), 0.03); }   // X bracing inside the leg
    }
  }
  // faces above the arches: horizontal girders, X bracing, and a mid post with finer X's on the lower tiers
  for (let ax = 0; ax < 2; ax++) for (const sg of [-1, 1]) for (let i = Math.ceil(FT * N); i < N; i++) {
    const f0 = i / N, f1 = (i + 1) / N, low = f0 < 0.56;
    beam(P(-1, f0, ax, sg), P(1, f0, ax, sg), 0.07);
    beam(P(-1, f0, ax, sg), P(1, f1, ax, sg), 0.05); beam(P(1, f0, ax, sg), P(-1, f1, ax, sg), 0.05);
    if (low) {
      beam(P(0, f0, ax, sg), P(0, f1, ax, sg), 0.045);
      beam(P(-1, f0, ax, sg), P(0, f1, ax, sg), 0.035); beam(P(0, f0, ax, sg), P(-1, f1, ax, sg), 0.035);
      beam(P(1, f0, ax, sg), P(0, f1, ax, sg), 0.035); beam(P(0, f0, ax, sg), P(1, f1, ax, sg), 0.035);
    }
  }
  // the four great arches: an outer and an inner rib following the leaning face, joined by spokes
  for (let ax = 0; ax < 2; ax++) for (const sg of [-1, 1]) {
    const K = 28, ft2 = FT - 0.05;
    for (let k = 0; k < K; k++) {
      const p0 = Math.PI * k / K, p1 = Math.PI * (k + 1) / K;
      beam(P(Math.cos(p0), FT * Math.sin(p0), ax, sg), P(Math.cos(p1), FT * Math.sin(p1), ax, sg), 0.15);
      beam(P(Math.cos(p0), ft2 * Math.sin(p0), ax, sg), P(Math.cos(p1), ft2 * Math.sin(p1), ax, sg), 0.09);
      if (k % 2 === 1) beam(P(Math.cos(p0), ft2 * Math.sin(p0), ax, sg), P(Math.cos(p0), FT * Math.sin(p0), ax, sg), 0.05);
    }
  }
  // platforms: deck, girder skirt, balustrade
  FP.forEach((f, n) => {
    const half = w(f) + [0.75, 0.6, 0.5][n], y = f * H, th = [0.34, 0.3, 0.26][n];
    D.add(new THREE.BoxGeometry(half * 2, th, half * 2), deckMat, new THREE.Matrix4().makeTranslation(0, y, 0));
    for (const sg of [-1, 1]) {
      beam(V(-half, y - th * 0.7, sg * half), V(half, y - th * 0.7, sg * half), 0.1); beam(V(sg * half, y - th * 0.7, -half), V(sg * half, y - th * 0.7, half), 0.1);
      beam(V(-half, y + 0.55, sg * half), V(half, y + 0.55, sg * half), 0.035); beam(V(sg * half, y + 0.55, -half), V(sg * half, y + 0.55, half), 0.035);
    }
    const post = (px, pz) => beam(V(px, y + th / 2, pz), V(px, y + 0.55, pz), 0.03), cnt = Math.ceil(half * 2 / 0.42);
    for (let i = 0; i <= cnt; i++) { const q = -half + i * half * 2 / cnt; post(q, half); post(q, -half); post(half, q); post(-half, q); }
    if (n === 0) for (const sg of [-1, 1]) { beam(V(-half, y - th * 0.7 - 0.5, sg * half), V(half, y - th * 0.7 - 0.5, sg * half), 0.07); beam(V(sg * half, y - th * 0.7 - 0.5, -half), V(sg * half, y - th * 0.7 - 0.5, half), 0.07); }
  });
  // upper cabin and lattice spire
  { const y0 = 0.86 * H, c = 0.55; D.add(new THREE.BoxGeometry(c * 2, 1.1, c * 2), deckMat, new THREE.Matrix4().makeTranslation(0, y0 + 0.55, 0));
    for (let i = 0; i < 4; i++) beam(V(i % 2 ? c : -c, y0, i < 2 ? c : -c), V(i % 2 ? c * 0.55 : -c * 0.55, y0 + 1.7, i < 2 ? c * 0.55 : -c * 0.55), 0.05); }
  const sw = 0.3, sy = H;
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) beam(V(a * sw, sy, b * sw), V(a * 0.04, sy + 3.5, b * 0.04), 0.05);
  for (const f of [0.25, 0.55, 0.8]) { const r = sw * (1 - f); for (const sgn of [-1, 1]) { beam(V(-r, sy + f * 3.5, sgn * r), V(r, sy + f * 3.5, sgn * r), 0.035); beam(V(sgn * r, sy + f * 3.5, -r), V(sgn * r, sy + f * 3.5, r), 0.035); } }
  beam(V(0, sy + 3.4, 0), V(0, sy + 5.7, 0), 0.04);
  B.flush(t); D.flush(t);
  put(t, new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), std(0xff4a4a, { emissive: 0xff2a2a, emissiveIntensity: 1 })), 0, H + 5.8, 0).castShadow = false;
  return { r: W0 * s * 1.05 };
}

// ================================================================ horse (shared by the Wellington statue and the Brandenburg quadriga)
// Local frame: ground y=0, facing +x, ~2.1 long. `pre` places it. o.raise lifts the near fore-leg; o.head tilts the head up (0..1).
function horse(B, M, pre, o = {}) {
  const { bronze, dark } = M, raise = o.raise ?? false, hu = o.head ?? 0.5;
  ell(B, bronze, [0.0, 1.85, 0], [1.05, 0.62, 0.52], [0, 0, 0], pre);                      // barrel
  ell(B, bronze, [0.72, 1.95, 0], [0.55, 0.64, 0.5], [0, 0, 0.1], pre);                    // chest
  ell(B, bronze, [-0.78, 1.95, 0], [0.62, 0.62, 0.52], [0, 0, -0.1], pre);                 // croup
  limb(B, bronze, V(0.85, 2.05, 0), V(1.28, 2.78 + hu * 0.1, 0), 0.4, 0.28, 10, pre);       // neck, in two arched runs
  limb(B, bronze, V(1.28, 2.78 + hu * 0.1, 0), V(1.55, 3.08 + hu * 0.18, 0), 0.28, 0.2, 10, pre);
  const hx = 1.72, hy = 3.04 + hu * 0.18, tilt = -0.85 + hu * 0.25;
  ell(B, bronze, [hx, hy, 0], [0.32, 0.17, 0.15], [0, 0, tilt], pre);                       // skull / jaw
  limb(B, bronze, V(hx + 0.12, hy - 0.08, 0), V(hx + 0.38, hy - 0.4, 0), 0.14, 0.1, 8, pre);   // muzzle
  ell(B, dark, [hx + 0.42, hy - 0.45, 0], [0.09, 0.08, 0.1], [0, 0, tilt], pre, [8, 6]);      // nose
  for (const sg of [-1, 1]) {
    ell(B, dark, [hx + 0.05, hy + 0.07, sg * 0.13], [0.03, 0.03, 0.03], [0, 0, 0], pre, [6, 5]);   // eyes
    B.add(new THREE.ConeGeometry(0.05, 0.24, 6), bronze, pre.clone().multiply(new THREE.Matrix4().compose(V(hx - 0.2, hy + 0.2, sg * 0.09), rot(0, 0, 0.25), ONE)));   // ears
  }
  for (let i = 0; i < 7; i++) { const u = i / 6; ell(B, dark, [0.95 + u * 0.62, 2.35 + u * 0.78 + hu * 0.1, 0], [0.1, 0.13, 0.035], [0, 0, -0.7], pre, [8, 6]); }   // mane along the crest
  const leg = (x, z, hind, lift) => {
    if (!hind && lift) { limb(B, bronze, V(x, 1.5, z), V(x + 0.18, 1.1, z), 0.16, 0.1, 8, pre); limb(B, bronze, V(x + 0.18, 1.1, z), V(x - 0.15, 0.82, z), 0.085, 0.07, 8, pre); ell(B, dark, [x - 0.17, 0.74, z], [0.11, 0.08, 0.11], [0, 0, 0.5], pre, [8, 6]); return; }
    const knee = hind ? V(x - 0.28, 0.85, z) : V(x + 0.05, 0.82, z), fet = hind ? V(x - 0.14, 0.22, z) : V(x + 0.08, 0.22, z);
    limb(B, bronze, V(x, 1.55, z), knee, hind ? 0.19 : 0.16, 0.1, 8, pre); limb(B, bronze, knee, fet, 0.08, 0.07, 8, pre);
    ell(B, bronze, [fet.x, fet.y, fet.z], [0.085, 0.07, 0.085], [0, 0, 0], pre, [6, 5]);
    B.add(new THREE.CylinderGeometry(0.11, 0.13, 0.15, 8), dark, pre.clone().multiply(new THREE.Matrix4().makeTranslation(fet.x + 0.04, 0.075, fet.z)));   // hoof
  };
  leg(0.85, 0.3, false, false); leg(0.85, -0.3, false, raise); leg(-0.88, 0.34, true); leg(-0.88, -0.34, true);
  ell(B, bronze, [0.85, 1.7, 0.3], [0.25, 0.3, 0.14], [0, 0, 0], pre, [8, 6]); ell(B, bronze, [0.85, 1.7, -0.3], [0.25, 0.3, 0.14], [0, 0, 0], pre, [8, 6]);   // shoulders
  ell(B, bronze, [-0.9, 1.75, 0.34], [0.36, 0.46, 0.2], [0, 0, 0], pre, [8, 6]); ell(B, bronze, [-0.9, 1.75, -0.34], [0.36, 0.46, 0.2], [0, 0, 0], pre, [8, 6]);  // haunches
  const tail = [[-1.35, 2.35], [-1.65, 2.15], [-1.85, 1.65], [-1.9, 1.05], [-1.85, 0.5]];                   // tail, a drooping chain
  for (let i = 0; i < tail.length - 1; i++) limb(B, dark, V(tail[i][0], tail[i][1], 0), V(tail[i + 1][0], tail[i + 1][1], 0), 0.1 - i * 0.012, 0.09 - i * 0.014, 7, pre);
  ell(B, dark, [-1.85, 0.4, 0], [0.09, 0.2, 0.08], [0, 0, 0], pre, [8, 6]);
}

// ================================================================ Duke of Wellington (Glasgow), with the traditional traffic cone
export function wellington(g, x, z, s = 1.3) {
  const verd = std(0x4f8a72, { roughness: 0.42, metalness: 0.4 }), dark = std(0x2f4f42, { roughness: 0.5, metalness: 0.35 }), stone = stoneMat({ light: ['#d3c7aa', '#cbbe9f', '#dacfb3'], dark: ['#b2a283'], mortar: '#a39673' });
  const orange = std(0xff6a00, { emissive: 0xff4a00, emissiveIntensity: 0.5 }), white = std(0xffffff, { emissive: 0xaaaaaa, emissiveIntensity: 0.4 });
  const t = new THREE.Group(); t.position.set(x, 0, z); t.rotation.y = 0.5; t.scale.setScalar(s); g.add(t);
  const B = new Batch(), Y0 = 2.86, S = new THREE.Matrix4().makeTranslation(0, Y0, 0), M = { bronze: verd, dark };
  const bx = (w, h, d, px, py, pz) => B.add(sbox(w, h, d), stone, new THREE.Matrix4().makeTranslation(px, py + h / 2, pz));
  // carved plinth: steps, die with panels, dentil cornice and cap
  bx(3.9, 0.28, 2.5, 0, 0, 0); bx(3.5, 0.26, 2.1, 0, 0.28, 0); bx(3.0, 1.9, 1.65, 0, 0.54, 0);
  bx(3.35, 0.2, 1.95, 0, 2.44, 0); bx(3.55, 0.22, 2.15, 0, 2.64, 0);
  for (let i = 0; i < 12; i++) { const px = -1.55 + i * 0.28; bx(0.12, 0.12, 0.1, px, 2.32, 0.88); bx(0.12, 0.12, 0.1, px, 2.32, -0.88); }
  for (let i = 0; i < 6; i++) { const pz = -0.75 + i * 0.3; bx(0.1, 0.12, 0.12, 1.55, 2.32, pz); bx(0.1, 0.12, 0.12, -1.55, 2.32, pz); }
  for (const sg of [-1, 1]) {                                            // raised panel frames
    for (const [w, h, d, px, py, pz] of [[1.5, 0.08, 0.06, 0, 1.92, sg * 0.84], [1.5, 0.08, 0.06, 0, 1.08, sg * 0.84], [0.08, 0.92, 0.06, 0.71, 1.0, sg * 0.84], [0.08, 0.92, 0.06, -0.71, 1.0, sg * 0.84]]) bx(w, h, d, px, py, pz);
    bx(0.05, 0.72, 1.3, sg * 1.52, 1.1, 0);
  }
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const k = c.getContext('2d');
  k.fillStyle = '#4e7a64'; k.fillRect(0, 0, 256, 128); k.strokeStyle = '#2a4538'; k.lineWidth = 6; k.strokeRect(5, 5, 246, 118); k.fillStyle = '#d9e8d8'; k.textAlign = 'center'; k.font = '600 24px serif';
  k.fillText('THE DUKE OF', 128, 52); k.fillText('WELLINGTON', 128, 88);
  const ptex = new THREE.CanvasTexture(c); ptex.colorSpace = THREE.SRGBColorSpace;
  put(t, new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.65), new THREE.MeshStandardMaterial({ map: ptex, roughness: 0.5, metalness: 0.3 })), 0, 1.45, 0.88).castShadow = false;
  const back = put(t, new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.65), new THREE.MeshStandardMaterial({ map: ptex, roughness: 0.5, metalness: 0.3 })), 0, 1.45, -0.88); back.rotation.y = Math.PI; back.castShadow = false;
  horse(B, M, S, { raise: true, head: 0.55 });
  // saddle, cloth and stirrups
  ell(B, dark, [0.05, 2.55, 0], [0.5, 0.1, 0.42], [0, 0, 0], S); ell(B, std(0x3d5a4a), [0.05, 2.45, 0], [0.56, 0.14, 0.5], [0, 0, 0], S);
  for (const sg of [-1, 1]) { limb(B, dark, V(0.25, 2.45, sg * 0.45), V(0.3, 1.85, sg * 0.52), 0.02, 0.02, 5, S); B.add(new THREE.TorusGeometry(0.1, 0.025, 5, 12), dark, S.clone().multiply(new THREE.Matrix4().compose(V(0.3, 1.75, sg * 0.52), rot(0, Math.PI / 2, 0), ONE))); }
  // rider: boots, legs, coat, epaulettes, head, bicorne, arms with reins and baton
  for (const sg of [-1, 1]) {
    limb(B, verd, V(-0.05, 2.72, sg * 0.17), V(0.42, 2.35, sg * 0.42), 0.17, 0.12, 8, S);
    limb(B, verd, V(0.42, 2.35, sg * 0.42), V(0.32, 1.78, sg * 0.5), 0.12, 0.09, 8, S);
    limb(B, dark, V(0.32, 1.78, sg * 0.5), V(0.46, 1.64, sg * 0.5), 0.1, 0.11, 8, S);
  }
  limb(B, verd, V(-0.12, 2.75, 0), V(-0.05, 3.5, 0), 0.31, 0.3, 12, S);
  limb(B, verd, V(-0.18, 2.5, 0), V(-0.08, 3.0, 0), 0.4, 0.3, 12, S);   // coat skirt over the saddle
  ell(B, verd, [-0.05, 3.5, 0], [0.2, 0.12, 0.42], [0, 0, 0], S);
  ell(B, verd, [0.0, 3.8, 0], [0.2, 0.23, 0.19], [0, 0, 0], S); ell(B, dark, [0.14, 3.76, 0], [0.05, 0.05, 0.05], [0, 0, 0], S, [6, 5]);
  ell(B, dark, [0.0, 4.02, 0], [0.18, 0.1, 0.45], [0, 0, 0.15], S);                                   // bicorne
  limb(B, verd, V(-0.05, 3.45, 0.4), V(0.12, 3.1, 0.5), 0.1, 0.09, 7, S); limb(B, verd, V(0.12, 3.1, 0.5), V(0.4, 2.95, 0.3), 0.09, 0.075, 7, S);
  limb(B, verd, V(-0.05, 3.45, -0.4), V(0.1, 3.15, -0.5), 0.1, 0.09, 7, S); limb(B, verd, V(0.1, 3.15, -0.5), V(0.45, 3.45, -0.38), 0.09, 0.075, 7, S);
  limb(B, dark, V(0.45, 3.45, -0.38), V(0.95, 3.78, -0.38), 0.035, 0.03, 6, S);                        // baton
  for (const sg of [-1, 1]) limb(B, dark, V(0.4, 2.95, 0.3), V(1.98, 2.62, sg * 0.1), 0.012, 0.012, 4, S);   // reins
  // the cone: orange with two white bands and a square base, as worn by the real statue
  const cb = 4.1;
  B.add(sbox(0.95, 0.05, 0.95), orange, S.clone().multiply(new THREE.Matrix4().makeTranslation(0.0, cb, 0)));
  B.add(new THREE.ConeGeometry(0.42, 1.1, 18), orange, S.clone().multiply(new THREE.Matrix4().makeTranslation(0.0, cb + 0.6, 0)));
  B.add(new THREE.CylinderGeometry(0.29, 0.34, 0.16, 18), white, S.clone().multiply(new THREE.Matrix4().makeTranslation(0.0, cb + 0.4, 0)));
  B.add(new THREE.CylinderGeometry(0.17, 0.21, 0.12, 18), white, S.clone().multiply(new THREE.Matrix4().makeTranslation(0.0, cb + 0.78, 0)));
  B.flush(t);
  return { r: 2.4 * s };
}

// ================================================================ Surat diamond: a brilliant-cut stone on a turned stone pedestal
function brilliant(R, hc, hp) {
  const pt = (rad, ang, y) => [Math.cos(ang) * rad, y, Math.sin(ang) * rad], q = Math.PI / 4;
  const T = [], S = [], G = [], Gh = [], LG = [];
  for (let k = 0; k < 8; k++) { T.push(pt(0.56 * R, k * q, hc)); S.push(pt(0.8 * R, (k + 0.5) * q, hc * 0.6)); G.push(pt(R, k * q, 0)); Gh.push(pt(R, (k + 0.5) * q, 0)); LG.push(pt(0.6 * R, (k + 0.5) * q, -hp * 0.45)); }
  const Tc = [0, hc, 0], C = [0, -hp, 0], tris = [];
  for (let k = 0; k < 8; k++) {
    const k1 = (k + 1) % 8, km = (k + 7) % 8;
    tris.push([Tc, T[k], T[k1]], [T[k], T[k1], S[k]],                                   // table, star facets
      [T[k], S[km], G[k]], [T[k], G[k], S[k]],                                          // bezel kites
      [S[k], G[k], Gh[k]], [S[k], Gh[k], G[k1]],                                        // upper girdle
      [G[k], Gh[k], LG[k]], [Gh[k], G[k1], LG[k]],                                      // lower girdle
      [G[k], LG[km], LG[k]], [LG[km], C, LG[k]]);                                       // pavilion mains
  }
  const pos = new Float32Array(tris.length * 9); tris.forEach((t, i) => t.forEach((v, j) => pos.set(v, i * 9 + j * 3)));
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.computeVertexNormals(); return geo;
}
export function gem(g, x, z, spinners) {
  const stone = stoneMat({ light: ['#d8cdb4', '#cfc3a8', '#dfd5bc'], mortar: '#a89c80', seed: 14 });
  const prof = [[1.75, 0], [1.75, 0.22], [1.5, 0.3], [1.5, 0.4], [1.15, 0.55], [1.0, 0.75], [1.0, 1.1], [1.18, 1.25], [1.18, 1.32], [1.42, 1.4], [1.45, 1.55], [0.2, 1.58], [0, 1.58]].map(p => new THREE.Vector2(...p));
  const lathe = new THREE.LatheGeometry(prof, 28), uv = lathe.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2.2, uv.getY(i) * 0.5);
  put(g, new THREE.Mesh(lathe, stone), x, 0, z);
  const grp = new THREE.Group(); grp.position.set(x, 3.15, z); g.add(grp);
  const geo = brilliant(1.35, 0.5, 1.3);
  const mat = new THREE.MeshStandardMaterial({ color: 0x7fe0fa, emissive: 0x1fa8d8, emissiveIntensity: 0.6, roughness: 0.05, metalness: 0.25, flatShading: true, transparent: true, opacity: 0.93, side: THREE.DoubleSide });
  const body = new THREE.Mesh(geo, mat); body.castShadow = true; grp.add(body);
  grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 1), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })));
  spinners.push(grp);
  return { r: 1.8 };
}

// ================================================================ Brandenburg Gate: Doric colonnade, triglyph frieze, attic reliefs, quadriga
export function brandenburg(g, x, z) {
  const stone = stoneMat({ light: ['#e6dbbd', '#dfd3b3', '#ebe1c5'], dark: ['#c9bb98'], mortar: '#b0a37f', seed: 31, courses: [30, 12] }), pale = std(0xf1e8d0, { roughness: 0.9 });
  const verd = std(0x5fa08a, { metalness: 0.4, roughness: 0.4 }), dark = std(0x3c6a5b, { metalness: 0.4, roughness: 0.45 }), shade = std(0x6f6552, { roughness: 1 });
  const t = new THREE.Group(); t.position.set(x, 0, z); g.add(t);
  const B = new Batch(), bx = (m, w, h, d, px, py, pz) => B.add(sbox(w, h, d), m, new THREE.Matrix4().makeTranslation(px, py + h / 2, pz));
  bx(stone, 12.0, 0.2, 5.4, 0, 0, 0); bx(stone, 11.6, 0.2, 5.0, 0, 0.2, 0);
  const xs = Array.from({ length: 6 }, (_, i) => -4.6 + i * 1.84), shaft = fluted(0.42, 4.7, 20);
  for (let i = 1; i < 5; i++) bx(stone, 0.9, 5.3, 3.4, xs[i], 0.4, 0);                         // walls dividing the five passages
  for (let i = 0; i < 5; i++) bx(shade, 1.0, 0.02, 3.4, (xs[i] + xs[i + 1]) / 2, 0.4, 0);       // shaded roadway
  for (const zz of [-1.7, 1.7]) for (const cx of xs) {
    B.add(shaft.clone(), stone, new THREE.Matrix4().makeTranslation(cx, 0.4, zz));
    B.add(new THREE.LatheGeometry([[0.38, 0], [0.44, 0.06], [0.58, 0.18], [0.6, 0.22]].map(p => new THREE.Vector2(...p)), 16), stone, new THREE.Matrix4().makeTranslation(cx, 5.1, zz));   // echinus
    bx(stone, 1.3, 0.14, 1.3, cx, 5.32, zz);                                                          // abacus
  }
  bx(stone, 11.4, 0.4, 4.9, 0, 5.46, 0);                                                              // architrave
  bx(stone, 11.4, 0.6, 4.9, 0, 5.86, 0);                                                              // frieze
  for (const sg of [-1, 1]) for (let i = 0; i < 25; i++) { const tx = -5.5 + i * 0.46; bx(shade, 0.26, 0.5, 0.06, tx, 5.92, sg * 2.47); }   // triglyphs
  bx(stone, 11.8, 0.28, 5.2, 0, 6.46, 0);                                                             // cornice
  bx(stone, 10.2, 1.2, 4.3, 0, 6.74, 0);                                                              // attic
  for (const sg of [-1, 1]) for (let i = 0; i < 5; i++) bx(pale, 1.5, 0.78, 0.06, -4 + i * 2, 6.95, sg * 2.17);   // relief panels
  bx(stone, 10.6, 0.22, 4.7, 0, 7.94, 0);
  bx(stone, 2.8, 0.2, 2.8, 0, 8.16, 0.2);
  // quadriga: chariot, four horses abreast and Victoria with a wreath-topped staff
  const Q = new THREE.Matrix4();
  B.add(sbox(2.9, 0.6, 1.5), verd, new THREE.Matrix4().makeTranslation(0, 8.66, -0.55));
  for (const sg of [-1, 1]) B.add(new THREE.TorusGeometry(0.5, 0.07, 6, 18), verd, new THREE.Matrix4().compose(V(sg * 1.55, 8.86, -0.55), rot(0, Math.PI / 2, 0), ONE));
  limb(B, verd, V(0, 8.7, -0.2), V(0, 8.7, 1.4), 0.05, 0.05, 6);                                  // pole
  for (let i = 0; i < 4; i++) horse(B, { bronze: verd, dark }, place(-1.2 + i * 0.8, 8.36, 1.05, -Math.PI / 2, 0.66), { raise: i === 1, head: 0.4 + (i % 2) * 0.25 });
  B.add(new THREE.ConeGeometry(0.34, 0.95, 10), verd, new THREE.Matrix4().makeTranslation(0, 9.5, -0.5));
  limb(B, verd, V(0, 9.9, -0.5), V(0, 10.35, -0.5), 0.2, 0.2, 8);
  ell(B, verd, [0, 10.55, -0.5], [0.14, 0.16, 0.14]);
  limb(B, verd, V(0.14, 10.25, -0.5), V(0.38, 10.7, -0.45), 0.07, 0.05, 6); limb(B, verd, V(0.38, 10.7, -0.45), V(0.42, 11.15, -0.4), 0.05, 0.04, 6);
  limb(B, dark, V(0.42, 9.6, -0.4), V(0.42, 11.6, -0.4), 0.03, 0.03, 6);                           // staff
  B.add(new THREE.TorusGeometry(0.24, 0.04, 6, 14), verd, new THREE.Matrix4().compose(V(0.42, 11.55, -0.4), rot(0, Math.PI / 2, 0), ONE));  // wreath
  ell(B, dark, [0.42, 11.95, -0.4], [0.1, 0.12, 0.2], [0, 0, 0]);                                  // eagle
  limb(B, verd, V(-0.14, 10.25, -0.5), V(-0.4, 10.4, -0.5), 0.07, 0.05, 6);
  B.flush(t);
  return { r: 6 };
}
