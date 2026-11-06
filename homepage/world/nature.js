// Realistic-ish natural environment for the island worlds: textured turf, a craggy rock underside, swaying grass,
// proper broadleaf and pine trees, rocks, flowers and soft volumetric-looking clouds. Everything is tinted from the world theme.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------------------------------------------------------------- noise
export const rng = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const hash = (x, y, z) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };
const lerp = (a, b, t) => a + (b - a) * t, sm = t => t * t * (3 - 2 * t);
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), u = sm(x - xi), v = sm(y - yi), w = sm(z - zi);
  return lerp(lerp(lerp(hash(xi, yi, zi), hash(xi + 1, yi, zi), u), lerp(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u), v),
    lerp(lerp(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u), lerp(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u), v), w);
}
export const fbm = (x, y, z, o = 4) => { let a = 0, f = 1, m = 0.5; for (let i = 0; i < o; i++) { a += m * vnoise(x * f, y * f, z * f); f *= 2; m *= 0.5; } return a / 0.9375; };

const col = c => new THREE.Color(c);
const isGreen = c => { const h = {}; col(c).getHSL(h); return h.h > 0.17 && h.h < 0.45; };
// themes whose greens are cartoon-bright get a natural palette; stylised themes (autumn pink etc.) keep their own colours
export const naturalLeaves = T => T.leaf.every(isGreen) ? [0x4d7d34, 0x5e8f3b, 0x6f9f46, 0x41712f, 0x80ac52].map(col) : T.leaf.map(col);
export const naturalGround = T => isGreen(T.ground) ? col(0x688f44) : col(T.ground);
const tex = (c, repeat = 1) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 4; return t; };
const vcol = (geo, fn) => { const p = geo.attributes.position, a = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { fn(c, p.getX(i), p.getY(i), p.getZ(i), i); a.set([c.r, c.g, c.b], i * 3); } geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo; };
const smooth = g => { g.deleteAttribute('normal'); g.deleteAttribute('uv'); return mergeVertices(g, 1e-3); };
const mat = (o = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0, ...o });

// ---------------------------------------------------------------- textures
function turfTexture(base) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const k = c.getContext('2d'), r = rng(7), b = col(base);
  k.fillStyle = '#' + b.getHexString(); k.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) { const x = r() * 512, y = r() * 512, rad = 30 + r() * 80, g = k.createRadialGradient(x, y, 0, x, y, rad);   // large soft patches of lighter / darker turf
    const light = r() > 0.5; g.addColorStop(0, light ? 'rgba(255,255,200,.10)' : 'rgba(0,30,0,.14)'); g.addColorStop(1, 'rgba(0,0,0,0)'); k.fillStyle = g; k.fillRect(0, 0, 512, 512); }
  for (let i = 0; i < 14000; i++) { const x = r() * 512, y = r() * 512, l = 3 + r() * 6, a = r() * 6.283;                               // fine blade strokes
    k.strokeStyle = r() > 0.45 ? `rgba(${180 + r() * 60 | 0},${210 + r() * 40 | 0},90,${0.12 + r() * 0.18})` : `rgba(10,${40 + r() * 40 | 0},10,${0.12 + r() * 0.2})`;
    k.lineWidth = 1; k.beginPath(); k.moveTo(x, y); k.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); k.stroke(); }
  for (let i = 0; i < 260; i++) { k.fillStyle = `rgba(${200 + r() * 55 | 0},${180 + r() * 60 | 0},${60 + r() * 120 | 0},.35)`; k.fillRect(r() * 512, r() * 512, 2, 2); }   // clover / seed flecks
  return tex(c, 9);
}
function soilTexture(base) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const k = c.getContext('2d'), r = rng(3), b = col(base);
  k.fillStyle = '#' + b.getHexString(); k.fillRect(0, 0, 512, 256);
  for (let y = 0; y < 256; y += 3) { k.fillStyle = `rgba(${r() > 0.5 ? '255,235,200' : '30,15,5'},${0.05 + r() * 0.12})`; k.fillRect(0, y, 512, 1 + r() * 4); }
  for (let i = 0; i < 6000; i++) { k.fillStyle = r() > 0.5 ? 'rgba(255,240,215,.16)' : 'rgba(25,12,4,.22)'; k.fillRect(r() * 512, r() * 256, 1 + r() * 3, 1 + r() * 2); }
  const t = tex(c); t.repeat.set(10, 1); return t;
}

// ---------------------------------------------------------------- island
export function makeIsland(scene, R, T) {
  const grass = new THREE.MeshStandardMaterial({ map: turfTexture(naturalGround(T)), roughness: 1 });
  const soil = new THREE.MeshStandardMaterial({ map: soilTexture(T.lip), roughness: 1 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.995, 1.4, 128), [soil, grass, soil]); top.position.y = -0.7; top.receiveShadow = true; top.castShadow = true; scene.add(top);

  // ragged turf overhang along the rim
  const lipG = new THREE.TorusGeometry(R, 0.5, 8, 192), lp = lipG.attributes.position;
  for (let i = 0; i < lp.count; i++) { const x = lp.getX(i), y = lp.getY(i), z = lp.getZ(i), a = Math.atan2(y, x), n = fbm(Math.cos(a) * 6, 0, Math.sin(a) * 6, 3);
    const s = 1 + (n - 0.5) * 0.08; lp.setXYZ(i, x * s, y * s, z * (0.8 + n * 0.5)); }
  lipG.computeVertexNormals(); const lip = new THREE.Mesh(lipG, new THREE.MeshStandardMaterial({ color: naturalGround(T).multiplyScalar(0.8), roughness: 1 })); lip.rotation.x = Math.PI / 2; lip.position.y = -0.15; lip.castShadow = true; scene.add(lip);

  // craggy underside: a displaced cone with soil -> stone -> dark strata
  const D = 46, geo = new THREE.CylinderGeometry(R - 0.5, 2.5, D, 112, 26, true), p = geo.attributes.position, soilC = col(T.rock[0]), stoneC = col(T.rock[1]).lerp(col(0x8a8378), 0.5), deep = col(0x3b3630);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = (D / 2 - y) / D, a = Math.atan2(z, x), ca = Math.cos(a), sa = Math.sin(a);
    const rad = Math.hypot(x, z), n = fbm(ca * 2.2 + 5, y * 0.12, sa * 2.2, 5), m = fbm(ca * 5, y * 0.35, sa * 5, 3);
    const shape = Math.pow(1 - t, 0.85) * (R - 0.5) * 0.92 + 2.5, jag = 1 + (n - 0.5) * (0.5 + t * 0.9) + (m - 0.5) * 0.18;
    const nr = Math.max(1.5, shape * jag), ny = y + (n - 0.5) * 3.5 * t;
    p.setXYZ(i, ca * nr, ny - D / 2 - 1.4, sa * nr);
  }
  vcol(geo, (c, x, y, z) => { const t = Math.min(1, Math.max(0, (-1.4 - y) / D)), n = fbm(x * 0.35, y * 0.55, z * 0.35, 3), band = 0.5 + 0.5 * Math.sin(y * 1.7 + n * 7);
    c.copy(soilC).lerp(stoneC, Math.min(1, t * 2.2 + n * 0.25)).lerp(deep, Math.max(0, t - 0.55) * 1.4).multiplyScalar(0.8 + band * 0.3 + (n - 0.5) * 0.3); });
  const under = new THREE.Mesh(geo, mat({ flatShading: true, side: THREE.DoubleSide })); under.castShadow = true; scene.add(under);

  // roots / stalactite crags hanging off the underside, and a few drifting rock fragments
  const r = rng(11), crag = [];
  for (let i = 0; i < 14; i++) { const a = r() * 6.283, d = r() * (R * 0.62), h = 5 + r() * 14, w = 1.3 + r() * 2.4;
    const g = smooth(new THREE.ConeGeometry(w, h, 9, 6)); const q = g.attributes.position;
    for (let j = 0; j < q.count; j++) { const x = q.getX(j), y = q.getY(j), z = q.getZ(j), n = fbm(x * 0.8 + i, y * 0.5, z * 0.8, 3); q.setXYZ(j, x * (0.7 + n * 0.6), y, z * (0.7 + n * 0.6)); }
    g.rotateX(Math.PI); g.translate(Math.cos(a) * d, -2.5 - h * 0.35 - d * 0.18 * 0 - (R - d) * 0.35, Math.sin(a) * d); crag.push(g); }
  const cg = mergeGeometries(crag.map(g => g.index ? g.toNonIndexed() : g)); vcol(cg, (c, x, y, z) => { const n = fbm(x * 0.3, y * 0.4, z * 0.3, 3); c.copy(stoneC).lerp(deep, Math.min(1, -y / 40)).multiplyScalar(0.75 + n * 0.5); });
  const crags = new THREE.Mesh(cg, mat({ flatShading: true })); crags.castShadow = true; scene.add(crags);
  for (let i = 0; i < 7; i++) { const a = r() * 6.283, d = R + 6 + r() * 22, s = 1.2 + r() * 3.2, g = smooth(new THREE.IcosahedronGeometry(s, 2)), q = g.attributes.position;
    for (let j = 0; j < q.count; j++) { const v = new THREE.Vector3().fromBufferAttribute(q, j), n = fbm(v.x * 0.6 + i * 9, v.y * 0.6, v.z * 0.6, 3); v.multiplyScalar(0.65 + n * 0.8); v.y *= 0.75; q.setXYZ(j, v.x, v.y, v.z); }
    vcol(g, (c, x, y, z) => c.copy(stoneC).multiplyScalar(0.7 + fbm(x * 0.5, y * 0.5, z * 0.5, 3) * 0.6).lerp(soilC, y > s * 0.2 ? 0.5 : 0));
    const m = new THREE.Mesh(g, mat({ flatShading: true })); m.position.set(Math.cos(a) * d, -8 - r() * 24, Math.sin(a) * d); m.castShadow = true; scene.add(m); }
  return { top };
}

// ---------------------------------------------------------------- clouds and sun
export function makeClouds(scene, T, sunDir) {
  const puff = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const k = c.getContext('2d'), r = rng(5);
    for (let i = 0; i < 26; i++) { const x = 40 + r() * 176, y = 52 + r() * 30 - Math.abs(x - 128) * 0.18, rad = 20 + r() * 30, g = k.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(0.6, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = g; k.fillRect(0, 0, 256, 128); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const r = rng(21), tint = col(T.cloud);
  for (let i = 0; i < 34; i++) {
    const m = new THREE.SpriteMaterial({ map: puff, color: tint, transparent: true, opacity: 0.55 + r() * 0.35, depthWrite: false, fog: false }), s = new THREE.Sprite(m), a = r() * 6.283, d = 60 + r() * 100, sc = 40 + r() * 70;
    s.scale.set(sc * 2, sc, 1); s.position.set(Math.cos(a) * d, -10 - r() * 40, Math.sin(a) * d); scene.add(s);
  }
  if (sunDir && !T.stars) {   // soft sun glow low in the sky
    const c = document.createElement('canvas'); c.width = c.height = 256; const k = c.getContext('2d'), g = k.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,248,220,1)'); g.addColorStop(0.12, 'rgba(255,236,180,.55)'); g.addColorStop(0.4, 'rgba(255,214,150,.14)'); g.addColorStop(1, 'rgba(255,200,140,0)'); k.fillStyle = g; k.fillRect(0, 0, 256, 256);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
    s.position.copy(sunDir).multiplyScalar(300); s.scale.setScalar(150); scene.add(s);
  }
}

// ---------------------------------------------------------------- sky
export function makeSky(scene, sunDir) {
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uSun: { value: sunDir.clone().normalize() } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vDir; uniform vec3 uSun;
      void main(){
        vec3 d = normalize(vDir); float h = d.y;
        vec3 zen = vec3(0.07,0.25,0.66), mid = vec3(0.30,0.56,0.90), hor = vec3(0.80,0.89,0.97), low = vec3(0.40,0.64,0.94), deep = vec3(0.22,0.44,0.84);
        vec3 up = mix(hor, mix(mid, zen, smoothstep(0.25, 0.95, h)), smoothstep(0.0, 0.32, h));
        vec3 dn = mix(hor, mix(low, deep, smoothstep(0.1, 0.7, -h)), smoothstep(0.0, 0.16, -h));
        vec3 c = h > 0.0 ? up : dn;
        float s = max(dot(d, uSun), 0.0);
        c += vec3(1.0, 0.78, 0.5) * pow(s, 5.0) * 0.22 + vec3(1.0, 0.9, 0.72) * pow(s, 60.0) * 0.5 + vec3(1.0, 0.95, 0.85) * pow(s, 900.0) * 4.0;
        gl_FragColor = vec4(pow(c, vec3(2.2)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), m); dome.frustumCulled = false; dome.renderOrder = -10; scene.add(dome);
  return new THREE.Color(0xc8dcef);   // horizon haze colour, for the fog
}

// ---------------------------------------------------------------- ground materials
export function plazaMaterial(T) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const k = c.getContext('2d'), r = rng(17), b = col(T.plaza);
  k.fillStyle = '#' + b.clone().multiplyScalar(0.55).getHexString(); k.fillRect(0, 0, 512, 512);
  const n = 8, sz = 512 / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const off = (y % 2) * sz / 2, l = 0.9 + r() * 0.22; k.fillStyle = '#' + b.clone().multiplyScalar(l).getHexString();
    k.beginPath(); k.roundRect(x * sz + off + 2, y * sz + 2, sz - 4, sz - 4, 6); k.fill(); k.beginPath(); k.roundRect(x * sz + off - 512 + 2, y * sz + 2, sz - 4, sz - 4, 6); k.fill(); }
  for (let i = 0; i < 9000; i++) { k.fillStyle = r() > 0.5 ? 'rgba(255,250,235,.10)' : 'rgba(40,30,20,.12)'; k.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2); }
  const t = tex(c, 1); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.4, 1.4); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 });
}
export function pathMaterial(T, len) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const k = c.getContext('2d'), r = rng(23), b = col(T.path);
  k.fillStyle = '#' + b.getHexString(); k.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3500; i++) { const l = 0.7 + r() * 0.5; k.fillStyle = '#' + b.clone().multiplyScalar(l).getHexString(); k.globalAlpha = 0.45; k.fillRect(r() * 256, r() * 256, 1 + r() * 3, 1 + r() * 3); }
  k.globalAlpha = 1; k.strokeStyle = 'rgba(80,60,40,.28)'; k.lineWidth = 2; for (let y = 0; y < 256; y += 64) { k.beginPath(); k.moveTo(0, y); k.lineTo(256, y); k.stroke(); }
  k.beginPath(); k.moveTo(128, 0); k.lineTo(128, 256); k.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, Math.max(1, len / 3.2)); t.anisotropy = 4;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 });
}

// ---------------------------------------------------------------- vegetation
const blob = (r, seed, sy = 1, detail = 2) => { const g = smooth(new THREE.IcosahedronGeometry(r, detail)), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i), n = fbm(v.x * 1.1 + seed, v.y * 1.1 + seed, v.z * 1.1, 3); v.multiplyScalar(0.72 + n * 0.55); v.y *= sy; p.setXYZ(i, v.x, v.y, v.z); } return g; };
const flat = g => { g.deleteAttribute('normal'); g.deleteAttribute('uv'); return g; };   // keep indexed so merged parts stay smooth-shaded
const join = parts => { const g = mergeGeometries(parts); g.computeVertexNormals(); return g; };

// alpha-cut foliage textures (grey-scale so per-vertex colour tints them)
const cardTex = draw => { const c = document.createElement('canvas'); c.width = c.height = 256; draw(c.getContext('2d'), rng(5)); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.colorSpace = THREE.SRGBColorSpace; return t; };
const leafTex = cardTex((k, r) => {
  for (let i = 0; i < 34; i++) { const a = r() * 6.283, d = 14 + r() * 92, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d, l = 40 + r() * 26, w = 13 + r() * 9, g = Math.round(150 + r() * 105);
    k.save(); k.translate(x, y); k.rotate(a + Math.PI / 2 + (r() - 0.5) * 0.9); k.beginPath(); k.moveTo(0, 0); k.quadraticCurveTo(w, -l * 0.45, 0, -l); k.quadraticCurveTo(-w, -l * 0.45, 0, 0);
    k.fillStyle = `rgb(${g},${g},${g})`; k.fill(); k.strokeStyle = `rgba(0,0,0,.35)`; k.lineWidth = 1.4; k.beginPath(); k.moveTo(0, 0); k.lineTo(0, -l * 0.9); k.stroke(); k.restore(); }
});
const needleTex = cardTex((k, r) => {
  k.strokeStyle = 'rgb(90,90,90)'; k.lineWidth = 3; k.beginPath(); k.moveTo(128, 254); k.lineTo(128, 6); k.stroke();
  for (let y = 250; y > 14; y -= 4.5) { const len = 20 + (y / 256) * 74 * (0.6 + 0.4 * Math.sin(y * 0.05)) + r() * 8; for (const sg of [-1, 1]) { const g = Math.round(150 + r() * 105); k.strokeStyle = `rgb(${g},${g},${g})`; k.lineWidth = 2.4; k.beginPath(); k.moveTo(128, y); k.lineTo(128 + sg * len, y - len * 0.55 - r() * 6); k.stroke(); } }
});
// foliage-card mesh builder: positions/normals/uv/colours as arrays, indexed quads
const Cards = () => ({ pos: [], nor: [], uv: [], col: [], idx: [], add(corners, normals, color) { const o = this.pos.length / 3; corners.forEach((c, i) => { this.pos.push(...c); this.nor.push(...normals[i]); this.col.push(color.r, color.g, color.b); });
    this.uv.push(0, 0, 1, 0, 1, 1, 0, 1); this.idx.push(o, o + 1, o + 2, o, o + 2, o + 3); },
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3)); g.setIndex(this.idx); return g; } });
const leafMat = (map, double = true) => { const m = new THREE.MeshStandardMaterial({ map, vertexColors: true, alphaTest: 0.5, side: double ? THREE.DoubleSide : THREE.FrontSide, roughness: 0.8 });
  m.userData.depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.5 }); return m; };

function broadleaf(seed, T) {
  const r = rng(seed), wood = [], bark = col(T.trunk), leaves = naturalLeaves(T);
  const th = 3.1 + r() * 0.8, tr = new THREE.CylinderGeometry(0.17, 0.46, th, 9, 6, true), tp = tr.attributes.position;
  for (let i = 0; i < tp.count; i++) { const y = tp.getY(i), n = fbm(tp.getX(i) * 2 + seed, y * 0.8, tp.getZ(i) * 2, 3), f = (y + th / 2) / th, k = 1 + (n - 0.5) * 0.35 + Math.max(0, 0.25 - f) * 1.2; tp.setXYZ(i, tp.getX(i) * k + Math.sin(y * 1.1 + seed) * 0.12, y, tp.getZ(i) * k); }
  tr.translate(0, th / 2, 0); vcol(tr, (c, x, y, z) => c.copy(bark).multiplyScalar(0.55 + fbm(x * 6, y * 3, z * 6, 3) * 0.55)); wood.push(flat(tr));
  const C = new THREE.Vector3(0, th + 1.5, 0), RAD = new THREE.Vector3(2.2 + r() * 0.5, 1.75 + r() * 0.4, 2.2 + r() * 0.5);
  const nB = 4 + (r() * 3 | 0);
  for (let i = 0; i < nB; i++) { const a = i / nB * 6.283 + r(), len = 1.5 + r() * 0.9, b = new THREE.CylinderGeometry(0.04, 0.13, len, 6); b.translate(0, len / 2, 0); b.rotateZ(-0.6 - r() * 0.35); b.rotateY(a); b.translate(0, th - 0.9 - r() * 0.6, 0);
    vcol(b, c => c.copy(bark).multiplyScalar(0.7)); wood.push(flat(b)); }
  for (let i = 0; i < 4; i++) { const g = blob(1.0 + r() * 0.5, seed + i * 3.3, 0.8), a = r() * 6.283, d = r() * 0.9; vcol(g, (c, x, y, z) => c.copy(leaves[0]).multiplyScalar(0.42 + fbm(x, y, z, 2) * 0.12)); g.translate(C.x + Math.cos(a) * d, C.y - 0.2 + r() * 0.5, C.z + Math.sin(a) * d); wood.push(flat(g)); }   // dark inner core hides see-through gaps
  const cards = Cards(), N = 240, q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    let px, py, pz; do { px = r() * 2 - 1; py = r() * 2 - 1; pz = r() * 2 - 1; } while (px * px + py * py + pz * pz > 1);
    const p = new THREE.Vector3(px * RAD.x, py * RAD.y * (py > 0 ? 1 : 0.75), pz * RAD.z).add(C), out = p.clone().sub(C).divide(RAD), dist = Math.min(1, out.length()), s = 0.95 + r() * 0.8;
    e.set((r() - 0.5) * 2.4, r() * 6.283, (r() - 0.5) * 2.4); q.setFromEuler(e);
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => v.set(a * s / 2, b * s / 2, 0).applyQuaternion(q).add(p).toArray());
    n.copy(p).sub(C).normalize(); n.y += 0.35; n.normalize(); const nn = n.toArray(), base = leaves[(r() * leaves.length) | 0].clone();
    const light = 0.66 + 0.5 * Math.pow(Math.max(0, (p.y - C.y) / RAD.y * 0.5 + 0.5), 1.1) + 0.22 * dist + (r() - 0.5) * 0.2;
    cards.add(corners, [nn, nn, nn, nn], base.multiplyScalar(light));
  }
  return { wood: join(wood), leaves: cards.geo(), tex: leafTex };
}
function pine(seed, T) {
  const r = rng(seed), wood = [], bark = col(T.trunk), needle = naturalLeaves(T).map(c => c.clone().multiplyScalar(0.8).lerp(col(0x24543a), 0.4));
  const tr = new THREE.CylinderGeometry(0.12, 0.34, 7.2, 8, 3); tr.translate(0, 3.6, 0); vcol(tr, (c, x, y, z) => c.copy(bark).multiplyScalar(0.5 + fbm(x * 6, y * 3, z * 6, 3) * 0.5)); wood.push(flat(tr));
  const tiers = 8, cards = Cards(), v = new THREE.Vector3();
  for (let i = 0; i < tiers; i++) {
    const f = i / (tiers - 1), rad = 2.5 * (1 - f * 0.86) + 0.35, y = 1.5 + f * 5.6, nc = Math.round(13 + (1 - f) * 8), core = new THREE.ConeGeometry(rad * 0.5, 1.5, 8); core.translate(0, y + 0.1, 0);
    vcol(core, c => c.copy(needle[0]).multiplyScalar(0.8)); wood.push(flat(core));
    for (let j = 0; j < nc; j++) {
      const a = (j / nc) * 6.283 + (i % 2) * 0.2 + (r() - 0.5) * 0.3, dr = 0.5 + (1 - f) * 0.15 + r() * 0.12, len = rad * (0.95 + r() * 0.25), w = 1.1 - f * 0.45 + r() * 0.2, yy = y + (r() - 0.5) * 0.35;
      const d = new THREE.Vector3(Math.cos(a) * Math.cos(dr), -Math.sin(dr), Math.sin(a) * Math.cos(dr)), wd = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)), st = new THREE.Vector3(0, yy, 0), en = st.clone().addScaledVector(d, len);
      const corners = [st.clone().addScaledVector(wd, -w * 0.18), st.clone().addScaledVector(wd, w * 0.18), en.clone().addScaledVector(wd, w * 0.5), en.clone().addScaledVector(wd, -w * 0.5)].map(p => p.toArray());
      const nrm = new THREE.Vector3(Math.cos(a) * 0.35, 0.9, Math.sin(a) * 0.35).normalize().toArray(), base = needle[(r() * needle.length) | 0].clone().multiplyScalar(0.95 + f * 0.25 + r() * 0.3);
      // card's uv v-axis runs trunk -> tip, u across; reorder corners so v=0 at the trunk end
      cards.add(corners, [nrm, nrm, nrm, nrm], base);
    }
  }
  return { wood: join(wood), leaves: cards.geo(), tex: needleTex };
}
function bush(seed, T) {
  const r = rng(seed), parts = [], leaves = naturalLeaves(T);
  for (let i = 0; i < 4; i++) { const g = blob(0.55 + r() * 0.35, seed + i * 5, 0.75, 2), base = leaves[i % leaves.length].clone().multiplyScalar(0.7 + r() * 0.3);
    vcol(g, (c, x, y, z) => c.copy(base).multiplyScalar(0.72 + (y + 0.5) * 0.4 + fbm(x * 3, y * 3, z * 3, 2) * 0.25)); g.translate((r() - 0.5) * 1.1, 0.35, (r() - 0.5) * 1.1); parts.push(flat(g)); }
  return join(parts);
}
function bushLeaves(seed, T) {   // a few leaf cards poking out of the bush so it isn't a smooth lump
  const r = rng(seed + 99), cards = Cards(), leaves = naturalLeaves(T), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3();
  for (let i = 0; i < 70; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * 0.95, p = new THREE.Vector3(Math.cos(a) * d, 0.1 + r() * 0.8, Math.sin(a) * d), s = 0.5 + r() * 0.35; e.set((r() - 0.5) * 2, r() * 6.283, (r() - 0.5) * 2); q.setFromEuler(e);
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => v.set(x * s / 2, y * s / 2, 0).applyQuaternion(q).add(p).toArray()), nn = new THREE.Vector3(p.x, 0.5, p.z).normalize().toArray();
    cards.add(corners, [nn, nn, nn, nn], leaves[(r() * leaves.length) | 0].clone().multiplyScalar(0.8 + p.y * 0.5 + r() * 0.2)); }
  return cards.geo();
}
function rock(seed, T) {
  const g = blob(1, seed, 0.7, 2), stone = col(T.rock[1]).lerp(col(0x9a948a), 0.55), moss = naturalGround(T).multiplyScalar(0.6);
  vcol(g, (c, x, y, z) => { const n = fbm(x * 2.5 + seed, y * 2.5, z * 2.5, 3), m = fbm(x * 7, y * 7, z * 7, 2); c.copy(stone).multiplyScalar(0.6 + n * 0.5 + (m - 0.5) * 0.2); if (y > 0.15 && n > 0.42) c.lerp(moss, 0.6); }); return flat(g);
}
function flower() {
  const stem = new THREE.CylinderGeometry(0.012, 0.016, 0.34, 4); stem.translate(0, 0.17, 0); vcol(stem, c => c.set(0x3f7a2c));
  const parts = [flat(stem)];
  for (let i = 0; i < 6; i++) { const p = new THREE.SphereGeometry(0.07, 6, 4); p.scale(1.5, 0.35, 0.8); p.translate(0.085, 0, 0); p.rotateY(i / 6 * 6.283); p.translate(0, 0.35, 0); vcol(p, c => c.set(0xffffff)); parts.push(flat(p)); }
  const ctr = new THREE.SphereGeometry(0.045, 6, 4); ctr.translate(0, 0.36, 0); vcol(ctr, c => c.set(0xf2c230)); parts.push(flat(ctr));
  return join(parts);
}
function tuft(T) {
  const parts = [], g0 = naturalGround(T), base = g0.clone().multiplyScalar(0.8), tip = g0.clone().lerp(col(0xe4eea0), 0.45), r = rng(9);
  for (let b = 0; b < 5; b++) { const a = r() * 6.283, lean = 0.12 + r() * 0.4, h = 0.22 + r() * 0.3, w = 0.016 + r() * 0.014, pos = [], idx = [], cols = [], nor = [], seg = 3;
    for (let s = 0; s <= seg; s++) { const f = s / seg, ww = w * (1 - f * 0.9), y = f * h, off = lean * f * f * h; pos.push(-ww, y, off, ww, y, off); const c = base.clone().lerp(tip, Math.pow(f, 0.8) * 0.9 + r() * 0.1); cols.push(c.r, c.g, c.b, c.r, c.g, c.b); nor.push(0, 1, 0, 0, 1, 0);
      if (s < seg) { const i = s * 2; idx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2, i, i + 2, i + 1, i + 1, i + 2, i + 3); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
    g.rotateY(a); g.translate((r() - 0.5) * 0.22, 0, (r() - 0.5) * 0.22); parts.push(g); }
  return mergeGeometries(parts);
}

// place `count` instances using `okFn` (x, z, margin) -> bool
function scatter(count, okFn, r, minD, maxD, margin, tries = 4000) {
  const out = []; for (let t = 0; t < tries && out.length < count; t++) { const a = r() * 6.283, d = minD + Math.sqrt(r()) * (maxD - minD), x = Math.sin(a) * d, z = Math.cos(a) * d; if (okFn(x, z, margin)) out.push({ x, z }); } return out;
}
const blobTexture = (() => { let t; return () => t || (t = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const k = c.getContext('2d'), g = k.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, 'rgba(10,18,5,.55)'); g.addColorStop(0.55, 'rgba(10,18,5,.25)'); g.addColorStop(1, 'rgba(0,0,0,0)'); k.fillStyle = g; k.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })()); })();

export function makeVegetation(scene, { R, PLAZA, T, solidFn, free, clear }) {
  const r = rng(2024), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3(), E = new THREE.Euler();
  const place = (mesh, i, x, y, z, s, ry, sy = s) => { P.set(x, y, z); E.set((r() - 0.5) * 0.06, ry, (r() - 0.5) * 0.06); Q.setFromEuler(E); S.set(s, sy, s); M.compose(P, Q, S); mesh.setMatrixAt(i, M); };
  const shadowDecals = [];
  const lm = (map, geo, count) => { const mt = leafMat(map), m = new THREE.InstancedMesh(geo, mt, count); m.customDepthMaterial = mt.userData.depth; m.castShadow = true; m.receiveShadow = true; return m; };

  // trees: mixed broadleaf and pines, each = opaque wood/core mesh + alpha-cut foliage cards
  const variants = [broadleaf(1, T), broadleaf(2, T), broadleaf(3, T), broadleaf(6, T), pine(4, T), pine(5, T)];
  const spots = scatter(70, free, r, PLAZA + 5, R - 3.2, 3.6), per = variants.map(() => []);
  spots.forEach((p, i) => per[i % 6 < 4 ? i % 4 : 4 + (i % 2)].push(p));
  variants.forEach((v, vi) => { const list = per[vi]; if (!list.length) return;
    const wm = new THREE.InstancedMesh(v.wood, mat({ roughness: 0.9 }), list.length), fm = lm(v.tex, v.leaves, list.length);
    list.forEach((p, i) => { const s = 0.8 + r() * 0.5, ry = r() * 6.283; place(wm, i, p.x, 0, p.z, s, ry); r(); place(fm, i, p.x, 0, p.z, s, ry); solidFn(p.x, p.z, 0.75 * s);
      const tint = new THREE.Color().setHSL(0.02 * (r() - 0.5), 0, 0.9 + r() * 0.2); wm.setColorAt(i, tint); fm.setColorAt(i, tint); shadowDecals.push([p.x, p.z, 4.6 * s]); });
    wm.castShadow = wm.receiveShadow = true; scene.add(wm, fm); });

  // bushes
  const bGeo = [bush(31, T), bush(32, T)], bLeaf = [bushLeaves(31, T), bushLeaves(32, T)], bSpots = scatter(60, free, r, PLAZA + 2, R - 2.5, 1.6);
  bGeo.forEach((geo, v) => { const list = bSpots.filter((_, i) => i % 2 === v), m = new THREE.InstancedMesh(geo, mat(), list.length), lf = lm(leafTex, bLeaf[v], list.length);
    list.forEach((p, i) => { const s = 0.8 + r() * 0.7, ry = r() * 6.283, sy = s * (0.8 + r() * 0.3); place(m, i, p.x, 0, p.z, s, ry, sy); place(lf, i, p.x, 0, p.z, s, ry, sy); solidFn(p.x, p.z, 0.9 * s); shadowDecals.push([p.x, p.z, 2.2 * s]); });
    m.castShadow = m.receiveShadow = true; scene.add(m, lf); });

  // rocks (a few solid boulders, many pebbles) with a rocky skirt around the rim
  const rGeo = [rock(41, T), rock(42, T), rock(43, T)], rSpots = scatter(34, free, r, PLAZA + 3, R - 1.5, 1.2);
  rGeo.forEach((geo, v) => { const list = rSpots.filter((_, i) => i % 3 === v), m = new THREE.InstancedMesh(geo, mat({ flatShading: true }), list.length);
    list.forEach((p, i) => { const big = r() > 0.78, s = big ? 0.9 + r() * 0.7 : 0.25 + r() * 0.4; place(m, i, p.x, s * 0.2, p.z, s, r() * 6.283, s * (0.7 + r() * 0.4)); if (big) solidFn(p.x, p.z, s * 0.9); shadowDecals.push([p.x, p.z, s * 2.6]); });
    m.castShadow = m.receiveShadow = true; scene.add(m); });
  { const n = 56, m = new THREE.InstancedMesh(rGeo[0], mat({ flatShading: true }), n);
    for (let i = 0; i < n; i++) { const a = r() * 6.283, d = R - 0.3 - r() * 1.4, s = 0.35 + r() * 0.9; place(m, i, Math.sin(a) * d, s * 0.15, Math.cos(a) * d, s, r() * 6.283, s * 0.7); }
    m.castShadow = m.receiveShadow = true; scene.add(m); }

  // soft contact shadows under everything standing on the grass (cheap ambient occlusion)
  { const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), shadowDecals.length);
    shadowDecals.forEach(([x, z, s], i) => { M.compose(P.set(x, 0.045, z), Q.identity(), S.set(s, 1, s)); m.setMatrixAt(i, M); }); m.renderOrder = 1; scene.add(m); }

  // wild flowers in drifts
  const fGeo = flower(), nF = 520, fm = new THREE.InstancedMesh(fGeo, mat({ roughness: 0.7 }), nF), pal = T.flowers.map(col); let nf = 0;
  for (let c = 0; c < 26 && nf < nF; c++) { const [cp] = scatter(1, free, r, PLAZA + 3, R - 4, 0.5); if (!cp) continue; const k = pal[c % pal.length];
    for (let j = 0; j < 20 && nf < nF; j++) { const a = r() * 6.283, d = Math.sqrt(r()) * 3, x = cp.x + Math.cos(a) * d, z = cp.z + Math.sin(a) * d; if (!clear(x, z)) continue;
      place(fm, nf, x, 0, z, 0.8 + r() * 0.6, r() * 6.283); fm.setColorAt(nf++, k.clone().offsetHSL(0.03 * (r() - 0.5), 0, 0.08 * (r() - 0.5))); } }
  fm.count = nf; scene.add(fm);

  // grass: dense fine tufts, lit like the turf under them, swaying in the wind
  const tGeo = tuft(T), tMat = mat({ roughness: 1 }), uT = { value: 0 };
  tMat.onBeforeCompile = sh => { sh.uniforms.uT = uT;
    sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float ph = instanceMatrix[3].x * 0.55 + instanceMatrix[3].z * 0.4;
      float sw = sin(uT * 1.7 + ph) * 0.6 + sin(uT * 2.9 + ph * 1.7) * 0.3;
      transformed.x += sw * position.y * position.y * 0.55;
      transformed.z += cos(uT * 1.3 + ph) * position.y * position.y * 0.3;`); };
  const NT = 17000, gm = new THREE.InstancedMesh(tGeo, tMat, NT); let ng = 0;
  for (let t = 0; t < 70000 && ng < NT; t++) { const a = r() * 6.283, d = Math.sqrt(r()) * (R - 0.8), x = Math.sin(a) * d, z = Math.cos(a) * d; if (!clear(x, z)) continue;
    place(gm, ng, x, 0, z, 0.8 + r() * 0.9, r() * 6.283, 0.7 + r() * 0.9); gm.setColorAt(ng++, new THREE.Color().setHSL(0.02 * (r() - 0.5), 0.1 * (r() - 0.5), 0.85 + r() * 0.3)); }
  gm.count = ng; scene.add(gm);

  return { update: t => { uT.value = t; } };
}
