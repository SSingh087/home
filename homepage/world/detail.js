// Shared building blocks for the realistic landmark models: procedural masonry / slate textures with
// bump maps, world-scaled box and column UVs, pointed and round-arched windows in recessed surrounds,
// and a Batch that merges hundreds of parts into one mesh per material.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const TILE = 4;           // world units covered by one texture tile
export const I = new THREE.Matrix4();
export const mat4 = (x = 0, y = 0, z = 0, ry = 0) => new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z);
export const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
export const rnd = rng(11);


// ---------------------------------------------------------------- textures
const canvas = s => { const c = document.createElement('canvas'); c.width = c.height = s; return c; };
const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
// n widths/heights that sum exactly to total, so the tile repeats without a seam
const splits = (rnd, total, min, span) => { const a = []; let s = 0; while (s < total) { const v = min + Math.floor(rnd() * span); a.push(v); s += v; } return a.map(v => Math.max(4, Math.round(v * total / s))); };

// Coursed masonry tile (512px = TILE world units) with a matching bump map. Options set the stone's character.
export function masonry(o = {}) {
  const { light = ['#dcb894', '#d5ad88', '#e0bf9c', '#d0a982', '#d9b490', '#d3ab86'], dark = ['#b79677', '#a98a70', '#bb9a7c'], mortar = '#a08468',
    darkP = 0.1, courses = [18, 18], widths = [40, 70], seed = 11, pits = 3500, joint = 1, weather = 0.05 } = o;
  const rnd = rng(seed), S = 512, col = canvas(S), bmp = canvas(S), k = col.getContext('2d'), b = bmp.getContext('2d');
  k.fillStyle = mortar; k.fillRect(0, 0, S, S); b.fillStyle = '#1c1c1c'; b.fillRect(0, 0, S, S);
  let y = 0;
  for (const h of splits(rnd, S, courses[0], courses[1])) {
    const ws = splits(rnd, S, widths[0], widths[1]); let x = -Math.floor(rnd() * S);
    for (const w of ws) {
      const c = rnd() < darkP ? dark[Math.floor(rnd() * dark.length)] : light[Math.floor(rnd() * light.length)], g = 170 + Math.floor(rnd() * 60);
      for (const ox of [0, S]) {
        k.fillStyle = c; k.fillRect(x + ox + joint, y + joint, w - 2 * joint, h - 2 * joint);
        k.fillStyle = `rgba(60,30,10,${weather * 0.4 + rnd() * weather})`; k.fillRect(x + ox + joint, y + h * 0.55, w - 2 * joint, h * 0.45 - joint);
        b.fillStyle = `rgb(${g},${g},${g})`; b.fillRect(x + ox + joint, y + joint, w - 2 * joint, h - 2 * joint);
      }
      x += w;
    }
    y += h;
  }
  for (let i = 0; i < pits; i++) {
    const px = rnd() * S, py = rnd() * S, d = 1 + rnd() * 2;
    k.fillStyle = rnd() < 0.6 ? 'rgba(40,25,15,.10)' : 'rgba(255,230,200,.07)'; k.fillRect(px, py, d, d);
    b.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.18)'; b.fillRect(px, py, d, d);
  }
  return { map: tex(col, true), bump: tex(bmp) };
}

// Slate (or, with `tint`, tile) roof tile: overlapping rows of slates, 256px per TILE units
export function slateTex(o = {}) {
  const { base = 38, tint = [0, 6, 16], row = 14, w = 22, seed = 5 } = o, rnd = rng(seed);
  const S = 256, col = canvas(S), bmp = canvas(S), k = col.getContext('2d'), b = bmp.getContext('2d');
  k.fillStyle = '#20252e'; k.fillRect(0, 0, S, S); b.fillStyle = '#101010'; b.fillRect(0, 0, S, S);
  for (let r = 0; r * row < S + row; r++) for (let x = -(r % 2) * w / 2; x < S; x += w) {
    const l = base + Math.floor(rnd() * 16), y = r * row;
    k.fillStyle = `rgb(${l + tint[0]},${l + tint[1]},${l + tint[2]})`; k.fillRect(x + 0.5, y, w - 1, row - 1);
    k.fillStyle = 'rgba(255,255,255,.06)'; k.fillRect(x + 0.5, y, w - 1, 2);
    const g = 150 + Math.floor(rnd() * 60); b.fillStyle = `rgb(${g},${g},${g})`; b.fillRect(x + 0.5, y, w - 1, row - 3);
  }
  return { map: tex(col, true), bump: tex(bmp) };
}

// the usual set of materials for a masonry building
export function materials(o = {}) {
  const m = masonry(o.stone), sl = slateTex(o.slate);
  const stone = new THREE.MeshStandardMaterial({ map: m.map, bumpMap: m.bump, bumpScale: o.bumpScale ?? 1.3, roughness: 0.95, color: 0xffffff });
  const trim = stone.clone(); trim.color.set(o.trim ?? 0xf4dcc0);
  const plinth = stone.clone(); plinth.color.set(o.plinth ?? 0xa89480);
  const slate = new THREE.MeshStandardMaterial({ map: sl.map, bumpMap: sl.bump, bumpScale: 1.6, roughness: 0.55, metalness: 0.05 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x3a4a60, roughness: 0.18, metalness: 0.4, emissive: 0x101a28 });
  const bar = new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.7 });
  const door = new THREE.MeshStandardMaterial({ color: 0x3a281c, roughness: 0.8 });
  const bronze = new THREE.MeshStandardMaterial({ color: 0x5d5a3a, roughness: 0.5, metalness: 0.45 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xe0b34c, roughness: 0.3, metalness: 0.8, emissive: 0x4a3200 });
  return { stone, trim, plinth, slate, glass, bar, door, bronze, gold };
}

// ---------------------------------------------------------------- geometry helpers
// UVs in world units so every wall shows the same block size, whatever its dimensions
export function sbox(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]], ox = rnd(), oy = rnd();
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const j = f * 4 + i; uv.setXY(j, uv.getX(j) * dims[f][0] / TILE + ox, uv.getY(j) * dims[f][1] / TILE + oy); }
  return g;
}
export function scol(rt, rb, h, seg) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg), uv = g.attributes.uv, n = (seg + 1) * 2, r = Math.max(rt, rb);
  for (let j = 0; j < n; j++) uv.setXY(j, uv.getX(j) * 2 * Math.PI * r / TILE, uv.getY(j) * h / TILE);
  return g;
}
export const worldUV = g => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / TILE, uv.getY(i) / TILE); return g; };

// pointed (lancet) arch outline, base at oy
export function arch(w, h, oy = 0, hole = false) {
  const p = hole ? new THREE.Path() : new THREE.Shape(), sp = Math.max(0.05, h - w * 0.9) + oy, top = h + oy;
  p.moveTo(-w / 2, oy); p.lineTo(-w / 2, sp);
  p.bezierCurveTo(-w / 2, sp + w * 0.45, -w * 0.1, top - w * 0.12, 0, top);
  p.bezierCurveTo(w * 0.1, top - w * 0.12, w / 2, sp + w * 0.45, w / 2, sp);
  p.lineTo(w / 2, oy); p.closePath(); return p;
}
// round (semicircular) arch outline, base at oy
export function rarch(w, h, oy = 0, hole = false) {
  const p = hole ? new THREE.Path() : new THREE.Shape(), r = w / 2, sp = oy + h - r;
  p.moveTo(-r, oy); p.lineTo(-r, sp); p.absarc(0, sp, r, Math.PI, 0, true); p.lineTo(r, oy); p.closePath(); return p;
}
// rectangle outline
export function rect(w, h, oy = 0, hole = false) {
  const p = hole ? new THREE.Path() : new THREE.Shape(); p.moveTo(-w / 2, oy); p.lineTo(w / 2, oy); p.lineTo(w / 2, oy + h); p.lineTo(-w / 2, oy + h); p.closePath(); return p;
}
export const extrude = (shape, depth) => worldUV(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 8 }));

// collects geometry per material, then merges into one mesh each (hundreds of parts, a handful of draw calls)
export class Batch {
  constructor() { this.m = new Map(); }
  add(geo, mat, m = I) {
    geo.applyMatrix4(m); if (geo.index) geo = geo.toNonIndexed();
    if (!this.m.has(mat)) this.m.set(mat, []); this.m.get(mat).push(geo);
  }
  flush(g) {
    for (const [mat, arr] of this.m) { const mesh = new THREE.Mesh(mergeGeometries(arr), mat); mesh.castShadow = mesh.receiveShadow = true; g.add(mesh); }
  }
}

// Part builders bound to a Batch and a material set. Positions are in the local frame of `base` (a Matrix4,
// e.g. a wall face whose +z points outwards); y is the BOTTOM of each part.
export function parts(B, M) {
  const { stone, trim, plinth, slate, glass, bar } = M;
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
  const roof = (w, h, d, x, y, z, ry = 0, mat = slate) => {   // gable roof, ridge along z before rotation
    const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
    const geo = worldUV(new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false })); geo.translate(0, 0, -d / 2);
    B.add(geo, mat, mat4(x, y, z, ry));
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

  // ---- classical parts
  // rectangular window: surround, recessed glass, glazing bars, sill, optional triangular pediment
  const swin = (base, x, y, w, h, o = {}) => {
    const f = 0.13, outer = rect(w + 2 * f, h + f * 1.4, 0); outer.holes.push(rect(w, h, f * 0.5, true));
    B.add(extrude(outer, 0.17), o.surround ?? trim, base.clone().multiply(mat4(x, y, 0)));
    B.add(extrude(rect(w, h, f * 0.5), 0.02), glass, base.clone().multiply(mat4(x, y, 0.01)));
    bx(bar, 0.035, h, 0.05, x, y + f * 0.5, 0.03, base); bx(bar, w, 0.03, 0.05, x, y + h * 0.62, 0.03, base);
    bx(trim, w + 0.4, 0.09, 0.3, x, y - 0.07, 0.15, base);
    if (o.pedi) { const s = new THREE.Shape(); s.moveTo(-(w + 0.5) / 2, 0); s.lineTo((w + 0.5) / 2, 0); s.lineTo(0, 0.32); s.closePath();
      B.add(extrude(s, 0.18), trim, base.clone().multiply(mat4(x, y + h + f * 1.4, 0))); }
  };
  // round-arched window with a moulded ring and keystone
  const rwin = (base, x, y, w, h, o = {}) => {
    const f = o.f ?? 0.14, outer = rarch(w + 2 * f, h + f * 1.2, 0); outer.holes.push(rarch(w, h, f * 0.5, true));
    B.add(extrude(outer, 0.17), trim, base.clone().multiply(mat4(x, y, 0)));
    B.add(extrude(rarch(w, h, f * 0.5), 0.02), o.mat ?? glass, base.clone().multiply(mat4(x, y, 0.01)));
    if (o.bars !== false) { bx(bar, 0.035, h * 0.8, 0.05, x, y + f * 0.5, 0.03, base); bx(bar, w, 0.03, 0.05, x, y + h * 0.55, 0.03, base); }
    bx(trim, f * 1.5, f * 1.4, 0.24, x, y + h + f * 0.2, 0.05, base);                    // keystone
  };
  // niche: dark round-headed recess; with an optional statue
  const niche = (base, x, y, w, h, statueOn = true) => {
    const o = rarch(w + 0.2, h + 0.1); o.holes.push(rarch(w, h, 0.05, true));
    B.add(extrude(o, 0.1), trim, base.clone().multiply(mat4(x, y, 0)));
    B.add(extrude(rarch(w, h, 0.05), 0.02), M.recess ?? bar, base.clone().multiply(mat4(x, y, 0.005)));
    if (statueOn) statue(base, x, y + 0.1, 0.1, h * 0.55);
  };
  const statue = (base, x, y, z, h = 1) => {
    const m = base.clone().multiply(mat4(x, y, z));
    B.add(sbox(h * 0.4, h * 0.12, h * 0.3), trim, m.clone().multiply(mat4(0, h * 0.06, 0)));
    B.add(new THREE.CapsuleGeometry(h * 0.1, h * 0.4, 3, 8), trim, m.clone().multiply(mat4(0, h * 0.12 + h * 0.3, 0)));
    B.add(new THREE.SphereGeometry(h * 0.085, 8, 6), trim, m.clone().multiply(mat4(0, h * 0.12 + h * 0.62, 0)));
  };
  // row of dentil blocks under a cornice, along x
  const dentils = (w, x, y, z, base = I, step = 0.26) => { for (let t = 0; t <= w - 0.1; t += step) bx(trim, 0.13, 0.15, 0.13, x - w / 2 + 0.1 + t, y, z, base); };
  // balustrade along x
  const balustrade = (w, x, y, z, base = I, h = 0.5) => {
    bx(trim, w, 0.1, 0.22, x, y, z, base); bx(trim, w, 0.09, 0.2, x, y + h - 0.09, z, base);
    for (let t = 0; t <= w - 0.1; t += 0.28) B.add(scol(0.045, 0.07, h - 0.19, 6), trim, base.clone().multiply(mat4(x - w / 2 + 0.1 + t, y + 0.1 + (h - 0.19) / 2, z)));
  };
  // fluted Corinthian column (base, 16-flute shaft, bell capital with abacus and volutes)
  const corinthian = (x, y, z, r, h, base = I) => {
    const m = base.clone().multiply(mat4(x, y, z)), N = 16, s = new THREE.Shape();
    for (let i = 0; i <= 96; i++) { const a = i / 96 * Math.PI * 2, rr = r * (1 - 0.06 * Math.pow(0.5 - 0.5 * Math.cos(N * a), 1.5)); i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    B.add(worldUV(new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 1 }).rotateX(-Math.PI / 2)), trim, m.clone().multiply(mat4(0, 0.16, 0)));
    B.add(sbox(r * 2.9, 0.08, r * 2.9), trim, m.clone().multiply(mat4(0, 0.04, 0)));
    B.add(new THREE.TorusGeometry(r * 1.05, r * 0.2, 6, 14).rotateX(Math.PI / 2), trim, m.clone().multiply(mat4(0, 0.14, 0)));
    const cap = new THREE.LatheGeometry([[r * 0.92, 0], [r * 1.0, 0.1], [r * 1.25, 0.28], [r * 1.5, 0.46], [r * 1.55, 0.5]].map(p => new THREE.Vector2(p[0], p[1])), 14);
    B.add(cap, trim, m.clone().multiply(mat4(0, 0.16 + h, 0)));
    B.add(sbox(r * 3.3, 0.1, r * 3.3), trim, m.clone().multiply(mat4(0, 0.16 + h + 0.5, 0)));
    for (const [cx, cz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) B.add(new THREE.SphereGeometry(r * 0.2, 6, 5), trim, m.clone().multiply(mat4(cx * r * 1.35, 0.16 + h + 0.42, cz * r * 1.35)));
  };
  return { bx, col, cone, lancet, bay, balcony, merlons, roof, crowStep, swin, rwin, niche, statue, dentils, balustrade, corinthian };
}
