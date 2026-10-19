import * as THREE from 'three';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
const scene = new THREE.Scene();
const SKY = 0x9fd0ee;
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 70, 260);
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 500);

scene.add(new THREE.HemisphereLight(0xffffff, 0x6a8a4a, 0.9));
const sun = new THREE.DirectionalLight(0xfff2d6, 1.5);
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

// ---- Island
{
  const g = new THREE.CylinderGeometry(R, R * 0.7, 14, 64);
  const m = new THREE.Mesh(g, [mat(0x7a6a58), mat(0x5e8f45), mat(0x5a4a3a)]);
  m.position.y = -7; m.receiveShadow = true; scene.add(m);
  // drifting clouds
  const cm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false });
  for (let i = 0; i < 14; i++) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), cm);
    const a = Math.random() * 6.283, d = 130 + Math.random() * 120;
    c.position.set(Math.cos(a) * d, -12 - Math.random() * 25, Math.sin(a) * d);
    c.scale.set(14 + Math.random() * 18, 3, 8 + Math.random() * 8); scene.add(c);
  }
}

// ---- Plaza with a spinning black-hole sculpture
const plaza = new THREE.Mesh(new THREE.CircleGeometry(13, 48).rotateX(-Math.PI / 2), mat(0xcfc6b4));
plaza.position.y = 0.03; plaza.receiveShadow = true; scene.add(plaza);
cyl(scene, 1.6, 2.0, 1.2, 0, 0, 0, 0x8a8478, 16);
const bh = new THREE.Group(); bh.position.y = 3.2; scene.add(bh);
bh.add(new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 24), new THREE.MeshBasicMaterial({ color: 0x000000 })));
const disc = new THREE.Mesh(new THREE.RingGeometry(1.2, 2.3, 48), new THREE.MeshBasicMaterial({ color: 0xffa030, side: THREE.DoubleSide }));
disc.rotation.x = Math.PI / 2.2; bh.add(disc);
colliders.push({ x: 0, z: 0, r: 2.4 });

// ---- Landmarks
const places = [];
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

const SANDSTONE = 0xc9a26b, CREAM = 0xf0e2c2;

place('SVNIT Surat', -135, 56, g => { // admin-block style: wings, columns, shallow dome
  walls(g, 26, 9, 12, 0, 0, '#e9d7b4', [7, 2], '#3a2d2a');
  box(g, 10, 12, 13, 0, 0, 0.3, 0xb5553a);
  dome(g, 4, 0, 12, 0, 0xd8e0e6, { metalness: 0.2 });
  columns(g, 6, 9, 9, 7.2);
  box(g, 14, 0.6, 2.5, 0, 8.8, 7.2, 0xf4efe4);
  return 15;
}, { short: 'SVNIT', title: 'SVNIT, Surat · B.Tech', text: 'Undergraduate studies in mechanical engineering, alongside machine learning for astronomy: GW parameter estimation, galaxy-merger prediction and interacting galaxies.', labelY: 24 });

place('Sorbonne Université', -45, 56, g => { // classical front, drum and dome
  walls(g, 32, 12, 14, 0, 0, '#d9c9a3', [8, 2], '#38404f');
  box(g, 14, 14, 3, 0, 0, 8, 0xe2d3ae);
  columns(g, 6, 11, 11, 10);
  box(g, 15, 1.2, 3.5, 0, 11, 9.5, 0xf4efe4);
  cone(g, 7.5, 3, 0, 14, 8, 0xe2d3ae, 4).rotation.y = Math.PI / 4;
  cyl(g, 4, 4.6, 7, 0, 12, -1, 0xe6d8b4, 24);
  dome(g, 4.6, 0, 19, -1, 0x6f8190, { metalness: 0.3 });
  cyl(g, 0.8, 0.8, 2, 0, 23.5, -1, 0xe6d8b4, 10);
  cone(g, 0.8, 2, 0, 25.5, -1, 0xd8b45a, 10);
  return 17;
}, { short: 'Sorbonne', title: 'Sorbonne Université, Paris · MSc', text: 'Master in Fundamental Physics and Applications (from 09/2021). Developed tools to study gravitational-wave lensing.', labelY: 32 });

place('Observatoire de Paris', 45, 56, g => { // long stone block with copper domes
  walls(g, 36, 9, 10, 0, 0, '#dcd2bb', [9, 2], '#3a4457');
  const copper = { metalness: 0.5, roughness: 0.4 };
  cyl(g, 5.5, 5.5, 5, 0, 9, 0, 0xdcd2bb, 28);
  dome(g, 5.8, 0, 14, 0, 0x4fa08b, copper);
  box(g, 1.6, 6, 1.2, 0, 14.2, 4.2, 0x1a2a28).rotation.x = -0.5; // observing slit
  [-15, 15].forEach(x => { cyl(g, 2.8, 2.8, 3, x, 9, 0, 0xdcd2bb, 18); dome(g, 3, x, 12, 0, 0x4fa08b, copper); });
  columns(g, 8, 18, 8, 5.6);
  return 19;
}, { short: 'Observatoire', title: 'Observatoire de Paris, PSL · MSc', text: 'Master in Astrophysics (from 09/2022). Interned at SYRTE on waveform compression of EMRIs using SVD, then a thesis at the Max Planck Institute on exploring the dark sector with GW lensing.', labelY: 26 });

place('University of Glasgow', 135, 56, g => { // Gilbert Scott: gothic, tall tower and spire
  walls(g, 36, 13, 13, 0, 0, '#c4986a', [9, 3], '#2c2622');
  box(g, 8, 28, 8, 0, 0, 0, SANDSTONE, { map: (() => { const t = winTex(2, 6, '#c4986a', '#2c2622'); t.repeat.set(1, 1); return t; })() });
  cone(g, 6.2, 14, 0, 28, 0, 0x6f7a7a, 4).rotation.y = Math.PI / 4;
  [[-17, -5], [17, -5], [-17, 5], [17, 5]].forEach(([x, z]) => { cyl(g, 1.8, 1.8, 17, x, 0, z, SANDSTONE, 10); cone(g, 2.3, 5, x, 17, z, 0x6f7a7a, 10); });
  box(g, 10, 9, 4, 0, 0, 8, 0xb88e60);
  cone(g, 4, 4, 0, 9, 8, 0x6f7a7a, 4).rotation.y = Math.PI / 4;
  return 20;
}, { short: 'Glasgow', title: 'University of Glasgow · PhD', text: 'Since 10/2023: population inference of compact objects with gravitational waves.', labelY: 48 });

// ---- Trees (instanced), kept clear of buildings and paths
{
  const N = 130, trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.4, 3, 6), mat(0x6a4a2a), N);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.2, 1), mat(0x2f7a3a), N);
  const m = new THREE.Matrix4(); let n = 0, tries = 0;
  const onPath = (x, z) => places.some(p => { const a = Math.atan2(p.x, p.z), d = Math.hypot(x, z), t = d * Math.cos(Math.atan2(x, z) - a), perp = Math.abs(d * Math.sin(Math.atan2(x, z) - a)); return t > 0 && perp < 11; });
  while (n < N && tries++ < 6000) {
    const a = Math.random() * 6.283, d = 24 + Math.random() * (R - 28), x = Math.sin(a) * d, z = Math.cos(a) * d;
    if (onPath(x, z) || colliders.some(c => Math.hypot(x - c.x, z - c.z) < c.r + 10)) continue;
    const s = 0.8 + Math.random() * 0.9;
    m.makeScale(s, s, s).setPosition(x, 1.5 * s, z); trunk.setMatrixAt(n, m);
    m.makeScale(s, s * 1.1, s).setPosition(x, 4.2 * s, z); crown.setMatrixAt(n, m);
    colliders.push({ x, z, r: 0.7 * s }); n++;
  }
  trunk.count = crown.count = n; trunk.castShadow = crown.castShadow = true; scene.add(trunk, crown);
}

// ---- Player + controls
const player = { x: 0, z: 11, yaw: Math.PI / 4, pitch: 0 }; // yaw 0 faces -z; start facing SVNIT
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
  mc.fillStyle = '#5e8f45'; mc.beginPath(); mc.arc(MS / 2, MS / 2, R * SC, 0, 6.283); mc.fill();
  mc.fillStyle = '#cfc6b4'; mc.beginPath(); mc.arc(MS / 2, MS / 2, 13 * SC, 0, 6.283); mc.fill();
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
  bh.rotation.y = t * 0.6; disc.rotation.z = t * 1.5;

  const near = places.find(p => Math.hypot(player.x - p.x, player.z - p.z) < p.r + 14);
  if (near) { card.hidden = false; card.querySelector('h2').textContent = near.title; card.querySelector('p').textContent = near.text; }
  else card.hidden = true;
  drawMap();
  renderer.render(scene, camera);
});
