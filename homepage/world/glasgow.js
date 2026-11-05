// University of Glasgow main building (Gilbert Scott), built from real architectural parts:
// coursed sandstone with bump, pointed-arch windows set in recessed surrounds, balconies, a
// battlemented tower with corner turrets and an open-work bronze spire, crow-stepped gables,
// slate roofs, dormers and chimneys. Modelled on reference-assets/buildings/glasgow-gilbert-scott/.
// Same contract as the other builders: front = +z, ground = y 0, returns { r, front, h, cols }.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { flagpole, wellington } from './props.js';

const TILE = 4;           // world units covered by one texture tile
const I = new THREE.Matrix4();
const mat4 = (x = 0, y = 0, z = 0, ry = 0) => new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z);
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const rnd = rng(11);

// ---------------------------------------------------------------- textures
const canvas = s => { const c = document.createElement('canvas'); c.width = c.height = s; return c; };
const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
// n widths/heights that sum exactly to total, so the tile repeats without a seam
const splits = (total, min, span) => { const a = []; let s = 0; while (s < total) { const v = min + Math.floor(rnd() * span); a.push(v); s += v; } return a.map(v => Math.max(4, Math.round(v * total / s))); };

function masonry() {
  const S = 512, col = canvas(S), bmp = canvas(S), k = col.getContext('2d'), b = bmp.getContext('2d');
  k.fillStyle = '#a08468'; k.fillRect(0, 0, S, S); b.fillStyle = '#1c1c1c'; b.fillRect(0, 0, S, S);
  const light = ['#dcb894', '#d5ad88', '#e0bf9c', '#d0a982', '#d9b490', '#d3ab86'], dark = ['#b79677', '#a98a70', '#bb9a7c'];
  let y = 0;
  for (const h of splits(S, 18, 18)) {
    const ws = splits(S, 40, 70); let x = -Math.floor(rnd() * S);
    for (const w of ws) {
      const c = rnd() < 0.1 ? dark[Math.floor(rnd() * dark.length)] : light[Math.floor(rnd() * light.length)], g = 170 + Math.floor(rnd() * 60);
      for (const ox of [0, S]) {
        k.fillStyle = c; k.fillRect(x + ox + 1, y + 1, w - 2, h - 2);
        k.fillStyle = `rgba(60,30,10,${0.02 + rnd() * 0.05})`; k.fillRect(x + ox + 1, y + h * 0.55, w - 2, h * 0.45 - 1);   // each course weathers darker toward its foot
        b.fillStyle = `rgb(${g},${g},${g})`; b.fillRect(x + ox + 1, y + 1, w - 2, h - 2);
      }
      x += w;
    }
    y += h;
  }
  for (let i = 0; i < 3500; i++) {            // pitting and grime
    const px = rnd() * S, py = rnd() * S, d = 1 + rnd() * 2;
    k.fillStyle = rnd() < 0.6 ? 'rgba(40,25,15,.10)' : 'rgba(255,230,200,.07)'; k.fillRect(px, py, d, d);
    b.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.18)'; b.fillRect(px, py, d, d);
  }
  return { map: tex(col, true), bump: tex(bmp) };
}

function slateTex() {
  const S = 256, col = canvas(S), bmp = canvas(S), k = col.getContext('2d'), b = bmp.getContext('2d');
  k.fillStyle = '#20252e'; k.fillRect(0, 0, S, S); b.fillStyle = '#101010'; b.fillRect(0, 0, S, S);
  const row = 14, w = 22;
  for (let r = 0; r * row < S + row; r++) for (let x = -(r % 2) * w / 2; x < S; x += w) {
    const l = 38 + Math.floor(rnd() * 16), y = r * row;
    k.fillStyle = `rgb(${l},${l + 6},${l + 16})`; k.fillRect(x + 0.5, y, w - 1, row - 1);
    k.fillStyle = 'rgba(255,255,255,.06)'; k.fillRect(x + 0.5, y, w - 1, 2);
    const g = 150 + Math.floor(rnd() * 60); b.fillStyle = `rgb(${g},${g},${g})`; b.fillRect(x + 0.5, y, w - 1, row - 3);
  }
  return { map: tex(col, true), bump: tex(bmp) };
}

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

// ---------------------------------------------------------------- geometry helpers
// UVs in world units so every wall shows the same block size, whatever its dimensions
function sbox(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]], ox = rnd(), oy = rnd();
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const j = f * 4 + i; uv.setXY(j, uv.getX(j) * dims[f][0] / TILE + ox, uv.getY(j) * dims[f][1] / TILE + oy); }
  return g;
}
function scol(rt, rb, h, seg) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg), uv = g.attributes.uv, n = (seg + 1) * 2, r = Math.max(rt, rb);
  for (let j = 0; j < n; j++) uv.setXY(j, uv.getX(j) * 2 * Math.PI * r / TILE, uv.getY(j) * h / TILE);
  return g;
}
const worldUV = g => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / TILE, uv.getY(i) / TILE); return g; };

// pointed (lancet) arch outline, base at oy
function arch(w, h, oy = 0, hole = false) {
  const p = hole ? new THREE.Path() : new THREE.Shape(), sp = Math.max(0.05, h - w * 0.9) + oy, top = h + oy;
  p.moveTo(-w / 2, oy); p.lineTo(-w / 2, sp);
  p.bezierCurveTo(-w / 2, sp + w * 0.45, -w * 0.1, top - w * 0.12, 0, top);
  p.bezierCurveTo(w * 0.1, top - w * 0.12, w / 2, sp + w * 0.45, w / 2, sp);
  p.lineTo(w / 2, oy); p.closePath(); return p;
}
const extrude = (shape, depth) => worldUV(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 8 }));

// collects geometry per material, then merges into one mesh each (hundreds of parts, a handful of draw calls)
class Batch {
  constructor() { this.m = new Map(); }
  add(geo, mat, m = I) {
    geo.applyMatrix4(m); if (geo.index) geo = geo.toNonIndexed();
    if (!this.m.has(mat)) this.m.set(mat, []); this.m.get(mat).push(geo);
  }
  flush(g) {
    for (const [mat, arr] of this.m) { const mesh = new THREE.Mesh(mergeGeometries(arr), mat); mesh.castShadow = mesh.receiveShadow = true; g.add(mesh); }
  }
}

export function glasgow(g, sp, o = {}) {
  const m = masonry(), sl = slateTex();
  const stone = new THREE.MeshStandardMaterial({ map: m.map, bumpMap: m.bump, bumpScale: 1.3, roughness: 0.95, color: 0xffffff });
  const trim = stone.clone(); trim.color.set(0xf4dcc0);                        // paler dressed stone
  const plinth = stone.clone(); plinth.color.set(0xa89480);
  const slate = new THREE.MeshStandardMaterial({ map: sl.map, bumpMap: sl.bump, bumpScale: 1.6, roughness: 0.55, metalness: 0.05 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x3a4a60, roughness: 0.18, metalness: 0.4, emissive: 0x101a28 });
  const bar = new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.7 });
  const door = new THREE.MeshStandardMaterial({ color: 0x3a281c, roughness: 0.8 });
  const bronze = new THREE.MeshStandardMaterial({ color: 0x5d5a3a, roughness: 0.5, metalness: 0.45 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xe0b34c, roughness: 0.3, metalness: 0.8, emissive: 0x4a3200 });
  const spireMat = new THREE.MeshStandardMaterial({ map: spireTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.55, metalness: 0.4 });
  const B = new Batch();

  // ---- part builders (y = bottom of the part)
  const bx = (mat, w, h, d, x, y, z, base = I) => B.add(sbox(w, h, d), mat, base.clone().multiply(mat4(x, y + h / 2, z)));
  const col = (mat, rt, rb, h, x, y, z, seg = 14, base = I) => B.add(scol(rt, rb, h, seg), mat, base.clone().multiply(mat4(x, y + h / 2, z)));
  const cone = (mat, r, h, x, y, z, seg = 12) => B.add(new THREE.ConeGeometry(r, h, seg), mat, mat4(x, y + h / 2, z));

  // window set into a surround: stone frame with a hole, glass recessed behind, mullions and a transom
  const lancet = (base, x, y, w, h, mull = 1) => {
    const f = 0.14, outer = arch(w + 2 * f, h + f * 1.6);
    outer.holes.push(arch(w, h, f * 0.5, true));
    B.add(extrude(outer, 0.18), trim, base.clone().multiply(mat4(x, y, 0)));
    B.add(extrude(arch(w, h, f * 0.5), 0.02), glass, base.clone().multiply(mat4(x, y, 0.01)));
    for (let i = 1; i <= mull; i++) bx(bar, 0.035, h * 0.78, 0.05, x - w / 2 + i * w / (mull + 1), y + f * 0.5, 0.03, base);
    if (h > 1.4) bx(bar, w, 0.03, 0.05, x, y + h * 0.58, 0.03, base);
  };
  // n lancets sharing one hood moulding
  const bay = (base, x, y, w, h, n, gap = 0.22, mull = 1) => {
    const total = n * (w + 0.28) + (n - 1) * gap;
    const hood = arch(total + 0.34, h + 0.6, 0); hood.holes.push(arch(total + 0.16, h + 0.42, 0.0, true));
    B.add(extrude(hood, 0.1), trim, base.clone().multiply(mat4(x, y - 0.06, 0)));
    for (let i = 0; i < n; i++) lancet(base, x - total / 2 + (w + 0.28) / 2 + i * (w + 0.28 + gap), y, w, h, mull);
  };
  const balcony = (base, x, y, w) => {
    bx(trim, w, 0.14, 0.45, x, y, 0.22, base); bx(trim, w, 0.07, 0.08, x, y + 0.44, 0.42, base);
    const n = Math.max(2, Math.round(w / 0.2));
    for (let i = 0; i < n; i++) bx(trim, 0.06, 0.3, 0.06, x - w / 2 + 0.1 + i * (w - 0.2) / (n - 1), y + 0.14, 0.42, base);
  };
  const merlons = (w, d, x, y, z, step = 0.46) => {      // battlement around a rectangle
    for (let t = 0; t < w; t += step) { bx(trim, 0.26, 0.3, 0.26, x - w / 2 + 0.13 + t, y, z - d / 2 + 0.13); bx(trim, 0.26, 0.3, 0.26, x - w / 2 + 0.13 + t, y, z + d / 2 - 0.13); }
    for (let t = step; t < d - 0.2; t += step) { bx(trim, 0.26, 0.3, 0.26, x - w / 2 + 0.13, y, z - d / 2 + 0.13 + t); bx(trim, 0.26, 0.3, 0.26, x + w / 2 - 0.13, y, z - d / 2 + 0.13 + t); }
  };
  const roof = (w, h, d, x, y, z, ry = 0) => {            // gable roof, ridge along z before rotation
    const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
    const geo = worldUV(new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false })); geo.translate(0, 0, -d / 2);
    B.add(geo, slate, mat4(x, y, z, ry));
  };
  const crowStep = (w, hh, z, depth) => {                  // stepped gable wall over a roof end
    const n = 5, st = hh / n, hs = i => Math.max(0.18, (w / 2) * (1 - i / n)), s = new THREE.Shape();
    s.moveTo(-hs(0), 0);
    for (let i = 0; i < n; i++) { s.lineTo(-hs(i), (i + 1) * st); s.lineTo(-hs(i + 1), (i + 1) * st); }
    s.lineTo(hs(n), hh);
    for (let i = n - 1; i >= 0; i--) { s.lineTo(hs(i), (i + 1) * st); s.lineTo(hs(i), i * st); }
    s.closePath();
    return extrude(s, depth).translate(0, 0, z - depth / 2);
  };

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
