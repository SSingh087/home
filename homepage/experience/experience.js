import * as THREE from 'three';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
const scene = new THREE.Scene();
const SKY = 0x0a0618;
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 60, 230);
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 500);

scene.add(new THREE.HemisphereLight(0xb5acff, 0x4a3f6a, 1.6));
const sun = new THREE.DirectionalLight(0xdfe6ff, 2.0);
sun.position.set(70, 100, 50);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -100, right: 100, top: 100, bottom: -100, near: 1, far: 300 });
scene.add(sun);

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });
const colliders = []; // {x, z, r}
const R = 92; // island radius

function put(mesh, parent, x, y, z) { mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh; }
const box = (p, w, h, d, x, y, z, c, o) => put(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, o)), p, x, y + h / 2, z);
const cyl = (p, rt, rb, h, x, y, z, c, seg = 20, o) => put(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c, o)), p, x, y + h / 2, z);
const dome = (p, r, x, y, z, c, o) => put(new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat(c, { side: THREE.DoubleSide, ...o })), p, x, y, z);
const cone = (p, r, h, x, y, z, c, seg = 8) => put(new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat(c)), p, x, y + h / 2, z);

const winTex = (cols, rows, base = '#e8dcc4', glass = '#2a3b55') => {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  const w = 256 / cols, h = 256 / rows; g.fillStyle = glass;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) g.fillRect(i * w + w * .22, j * h + h * .22, w * .56, h * .56);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
};
const walls = (p, w, h, d, x, z, base, rep, glass) => {
  const t = winTex(4, 3, base, glass); t.repeat.set(rep[0], rep[1]);
  return box(p, w, h, d, x, 0, z, 0xffffff, { map: t });
};
const columns = (p, n, span, h, z, c = 0xf4efe4, r = 0.45) => {
  for (let i = 0; i < n; i++) cyl(p, r, r, h, -span / 2 + (span / (n - 1)) * i, 0, z, c, 12);
};

// ---- Planet platform + stars
{
  const m = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.6, 16, 64), [mat(0x3b3052), mat(0x4a3f63), mat(0x2a2240)]);
  m.position.y = -8; m.receiveShadow = true; scene.add(m);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.4, 8, 96).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x8a6cff }));
  scene.add(rim);
  const n = 4000, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const r = 200 + Math.random() * 150, t = Math.random() * 6.283, p = Math.acos(2 * Math.random() - 1);
    pos.set([r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t)], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.9, color: 0xffffff, fog: false })));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(18, 32, 32), new THREE.MeshBasicMaterial({ color: 0xe8e4f4, fog: false }));
  moon.position.set(-120, 90, -220); scene.add(moon);
}

// ---- Plaza with a spinning black-hole sculpture
const plaza = new THREE.Mesh(new THREE.CircleGeometry(13, 48).rotateX(-Math.PI / 2), mat(0x6a5f86));
plaza.position.y = 0.03; plaza.receiveShadow = true; scene.add(plaza);
cyl(scene, 1.6, 2.0, 1.2, 0, 0, 0, 0x8a8478, 16);
const bh = new THREE.Group(); bh.position.y = 3.2; scene.add(bh);
bh.add(new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 24), new THREE.MeshBasicMaterial({ color: 0x000000 })));
const disc = new THREE.Mesh(new THREE.RingGeometry(1.2, 2.3, 48), new THREE.MeshBasicMaterial({ color: 0xffa030, side: THREE.DoubleSide }));
disc.rotation.x = Math.PI / 2.2; bh.add(disc);
colliders.push({ x: 0, z: 0, r: 2.4 });

// ---- Landmarks
const places = [], spinners = [];
function place(name, angleDeg, dist, build, info) {
  const a = angleDeg * Math.PI / 180, x = Math.sin(a) * dist, z = Math.cos(a) * dist;
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(-x, -z); // front (+z local) faces plaza
  scene.add(g);
  const radius = build(g);
  colliders.push({ x, z, r: radius });
  // path to plaza
  const len = dist - 13 - radius * 0.3, p = new THREE.Mesh(new THREE.PlaneGeometry(5, len).rotateX(-Math.PI / 2), mat(0xb9b2a4));
  p.position.set(Math.sin(a) * (13 + len / 2), 0.02, Math.cos(a) * (13 + len / 2)); p.rotation.y = a; p.receiveShadow = true; scene.add(p);
  // floating label
  const c = document.createElement('canvas'); c.width = 512; c.height = 96;
  const k = c.getContext('2d'); k.fillStyle = 'rgba(15,10,35,.8)'; k.roundRect(0, 0, 512, 96, 40); k.fill();
  k.fillStyle = '#fff'; k.font = '600 44px sans-serif'; k.textAlign = 'center'; k.fillText(name, 256, 62);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false, fog: false }));
  s.scale.set(16, 3, 1); s.position.set(x, info.labelY, z); scene.add(s);
  places.push({ name, x, z, r: radius, ...info });
}

const CONC = 0xcfd0d6;
const glow = (c) => ({ emissive: c, emissiveIntensity: 0.6 });

place('IIT Indore', -120, 56, g => { // modern lab: glass bays, slanted roof, jet-nozzle sculpture
  walls(g, 28, 9, 14, 0, 0, '#cfd0d6', [7, 2], '#3a7f93');
  box(g, 28, 1, 15, 0, 9, 0, 0x4a4f63).rotation.z = 0.04;
  box(g, 12, 12, 8, 8, 0, 9, 0x3a7f93, { transparent: true, opacity: 0.8, metalness: 0.5, roughness: 0.2 });
  cyl(g, 0.5, 1.4, 7, -14, 0, 9, 0xb9bcc6, 14);
  put(new THREE.Mesh(new THREE.TorusGeometry(2, 0.3, 8, 24), mat(0x5ad1ff, glow(0x5ad1ff))), g, -14, 9, 9).rotation.x = Math.PI / 2;
  return 15;
}, { short: 'IIT Indore', title: 'IIT Indore · Research internship', text: 'Summer 2019 (05/19): studied the effects of synthetic jet impingement and its applications, including thermal performance and its variation with the waveform.', labelY: 20 });

place('Max Planck Institute (AEI)', 0, 56, g => { // institute block with a LISA-triangle sculpture
  walls(g, 30, 10, 12, 0, 0, '#d8d4e4', [8, 2], '#2a3b6a');
  box(g, 6, 16, 6, -11, 0, 0, 0xbfb8d8);
  box(g, 20, 2, 5, 2, 10, 4, 0x4a4f63);
  const L = new THREE.Group(); L.position.set(0, 24, 0); g.add(L);
  const pts = [0, 1, 2].map(i => new THREE.Vector3(Math.cos(i * 2.094) * 7, 0, Math.sin(i * 2.094) * 7));
  pts.forEach(p => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffd27a })); m.position.copy(p); L.add(m); });
  L.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xff5a5a })));
  g.userData.L = L; spinners.push(L);
  return 17;
}, { short: 'AEI', title: 'Max Planck Institute for Gravitational Physics (AEI)', text: 'Three stints: 06/2020 LISA module for PyCBC; 07/2022 higher modes and pre-merger detection of GWs; 02/2023 Master thesis on exploring the dark sector with GW lensing.', labelY: 36 });

place('SYRTE · Paris Observatory', 120, 56, g => { // clock tower and radio dish
  walls(g, 22, 9, 12, 0, 0, '#dcd2bb', [6, 2], '#3a4457');
  cyl(g, 3.5, 3.5, 20, 0, 9, 0, 0xdcd2bb, 20);
  const c = document.createElement('canvas'); c.width = c.height = 128; const k = c.getContext('2d');
  k.fillStyle = '#fff'; k.beginPath(); k.arc(64, 64, 62, 0, 6.283); k.fill(); k.strokeStyle = '#111'; k.lineWidth = 6;
  k.beginPath(); k.moveTo(64, 64); k.lineTo(64, 20); k.moveTo(64, 64); k.lineTo(96, 76); k.stroke();
  const face = new THREE.Mesh(new THREE.CircleGeometry(3, 32), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) })); face.position.set(0, 25, 3.6); g.add(face);
  cone(g, 4.2, 3, 0, 29, 0, 0x4fa08b, 20);
  const dish = put(new THREE.Mesh(new THREE.SphereGeometry(5, 24, 12, 0, Math.PI * 2, 0, 1), mat(0xe8e8f0, { side: THREE.DoubleSide })), g, 14, 11, 0); dish.rotation.x = 2.2;
  cyl(g, 0.4, 0.5, 8, 14, 3, 0, 0x888898, 8);
  return 15;
}, { short: 'SYRTE', title: 'SYRTE, Observatoire de Paris', text: 'Systèmes de Référence Temps-Espace (09/2022): worked on waveform compression of EMRIs using Singular Value Decomposition.', labelY: 33 });

// ---- Glowing crystals
{
  const N = 130, cr = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1.4, 0), new THREE.MeshStandardMaterial({ color: 0x8a6cff, emissive: 0x5a3cff, emissiveIntensity: 0.9, roughness: 0.3 }), N);
  const m = new THREE.Matrix4(); let n = 0, tries = 0;
  const onPath = (x, z) => places.some(p => { const a = Math.atan2(p.x, p.z), d = Math.hypot(x, z), t = d * Math.cos(Math.atan2(x, z) - a), perp = Math.abs(d * Math.sin(Math.atan2(x, z) - a)); return t > 0 && perp < 11; });
  while (n < N && tries++ < 6000) {
    const a = Math.random() * 6.283, d = 24 + Math.random() * (R - 28), x = Math.sin(a) * d, z = Math.cos(a) * d;
    if (onPath(x, z) || colliders.some(c => Math.hypot(x - c.x, z - c.z) < c.r + 10)) continue;
    const s = 0.7 + Math.random() * 1.6;
    m.makeScale(s * 0.7, s * 1.8, s * 0.7).setPosition(x, s * 1.6, z); cr.setMatrixAt(n, m);
    colliders.push({ x, z, r: 0.9 * s }); n++;
  }
  cr.count = n; cr.castShadow = true; scene.add(cr);
}

// ---- Player + controls
const player = { x: 0, z: 11, yaw: 0, pitch: 0 };
{ const p0 = places[0], a0 = Math.atan2(p0.x, p0.z); player.yaw = a0 + Math.PI; } // face the first landmark
const keys = {}, stick = { x: 0, y: 0 };
addEventListener('keydown', e => { keys[e.code] = true; });
addEventListener('keyup', e => { keys[e.code] = false; });
let drag = null;
canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY }; });
addEventListener('pointerup', () => { drag = null; });
addEventListener('pointermove', e => {
  if (!drag) return;
  player.yaw -= (e.clientX - drag.x) * 0.004; player.pitch = Math.max(-1, Math.min(1, player.pitch - (e.clientY - drag.y) * 0.003));
  drag.x = e.clientX; drag.y = e.clientY;
});
const stickEl = document.getElementById('stick'), knob = document.getElementById('knob');
if (matchMedia('(pointer: coarse)').matches) {
  stickEl.hidden = false;
  const move = e => {
    const r = stickEl.getBoundingClientRect(), dx = e.clientX - (r.left + 55), dy = e.clientY - (r.top + 55), l = Math.min(1, Math.hypot(dx, dy) / 50), a = Math.atan2(dy, dx);
    stick.x = Math.cos(a) * l; stick.y = Math.sin(a) * l; knob.style.transform = `translate(${stick.x * 35}px, ${stick.y * 35}px)`;
  };
  stickEl.addEventListener('pointerdown', e => { e.stopPropagation(); stickEl.setPointerCapture(e.pointerId); move(e); });
  stickEl.addEventListener('pointermove', e => { if (e.buttons || e.pressure) move(e); });
  const end = () => { stick.x = stick.y = 0; knob.style.transform = ''; };
  stickEl.addEventListener('pointerup', end); stickEl.addEventListener('pointercancel', end);
}
let started = false;
document.getElementById('go').onclick = () => { started = true; document.getElementById('start').style.display = 'none'; };

// ---- Minimap
const mm = document.getElementById('map'), mc = mm.getContext('2d'), MS = mm.width, SC = MS / 2 / (R + 4);
function drawMap() {
  mc.clearRect(0, 0, MS, MS);
  mc.fillStyle = 'rgba(15,10,35,.65)'; mc.beginPath(); mc.arc(MS / 2, MS / 2, MS / 2, 0, 6.283); mc.fill();
  mc.fillStyle = '#4a3f63'; mc.beginPath(); mc.arc(MS / 2, MS / 2, R * SC, 0, 6.283); mc.fill();
  mc.fillStyle = '#6a5f86'; mc.beginPath(); mc.arc(MS / 2, MS / 2, 13 * SC, 0, 6.283); mc.fill();
  mc.font = '10px sans-serif'; mc.textAlign = 'center';
  places.forEach(p => {
    const x = MS / 2 + p.x * SC, y = MS / 2 + p.z * SC;
    mc.strokeStyle = '#b9b2a4'; mc.lineWidth = 3; mc.beginPath(); mc.moveTo(MS / 2, MS / 2); mc.lineTo(x, y); mc.stroke();
    mc.fillStyle = '#ffaa28'; mc.beginPath(); mc.arc(x, y, 6, 0, 6.283); mc.fill();
    mc.fillStyle = '#fff'; mc.fillText(p.short, x, y + (p.z > 0 ? 18 : -10));
  });
  const px = MS / 2 + player.x * SC, py = MS / 2 + player.z * SC;
  mc.save(); mc.translate(px, py); mc.rotate(-player.yaw); mc.fillStyle = '#fff';
  mc.beginPath(); mc.moveTo(0, -7); mc.lineTo(5, 5); mc.lineTo(-5, 5); mc.closePath(); mc.fill(); mc.restore();
}

const card = document.getElementById('card');
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  let moving = false;
  if (started) {
    const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - stick.y;
    const s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + stick.x;
    if (keys.ArrowLeft) player.yaw += 1.8 * dt; if (keys.ArrowRight) player.yaw -= 1.8 * dt;
    moving = f !== 0 || s !== 0;
    const sp = (keys.ShiftLeft || keys.ShiftRight ? 12 : 6) * dt;
    const dx = (-Math.sin(player.yaw) * f + Math.cos(player.yaw) * s) * sp;
    const dz = (-Math.cos(player.yaw) * f - Math.sin(player.yaw) * s) * sp;
    const free = (x, z) => Math.hypot(x, z) < R - 3 && !colliders.some(c => Math.hypot(x - c.x, z - c.z) < c.r + 0.4);
    if (free(player.x + dx, player.z)) player.x += dx;
    if (free(player.x, player.z + dz)) player.z += dz;
  }
  camera.position.set(player.x, 1.7 + (moving ? Math.sin(t * 9) * 0.03 : 0), player.z);
  camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
  spinners.forEach(l => { l.rotation.y = t * 0.8; }); bh.rotation.y = t * 0.6; disc.rotation.z = t * 1.5;

  const near = places.find(p => Math.hypot(player.x - p.x, player.z - p.z) < p.r + 14);
  if (near) { card.hidden = false; card.querySelector('h2').textContent = near.title; card.querySelector('p').textContent = near.text; }
  else card.hidden = true;
  drawMap();
  renderer.render(scene, camera);
});
