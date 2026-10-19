import * as THREE from 'three';

document.body.classList.add('live');
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
const scene = new THREE.Scene();
const SKY = 0x9fd0ee;
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 60, 190);
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 400);

scene.add(new THREE.HemisphereLight(0xffffff, 0x6a8a4a, 0.9));
const sun = new THREE.DirectionalLight(0xfff2d6, 1.5);
sun.position.set(60, 90, 40);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 250 });
scene.add(sun);

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, ...o });
const colliders = []; // {x, z, r}
const add = (m, x, y, z, solid) => { m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; scene.add(m); return m; };

// ---- Ground, path, gate-to-gate road
add(new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), mat(0x5e8f45)), 0, 0, 0).castShadow = false;
add(new THREE.Mesh(new THREE.PlaneGeometry(6, 190).rotateX(-Math.PI / 2), mat(0xb9b2a4)), 0, 0.02, -10).castShadow = false;

// window texture
const winTex = (cols, rows, lit = 0x2a3b55) => {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const g = c.getContext('2d'); g.fillStyle = '#e8dcc4'; g.fillRect(0, 0, 256, 256);
  const w = 256 / cols, h = 256 / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    g.fillStyle = '#' + lit.toString(16).padStart(6, '0'); g.fillRect(i * w + w * 0.2, j * h + h * 0.25, w * 0.6, h * 0.5);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
};
const building = (x, z, w, h, d, tint = 0xffffff, rep = [6, 3]) => {
  const t = winTex(4, 3); t.repeat.set(rep[0], rep[1]);
  const m = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(tint, { map: t })), x, h / 2, z);
  colliders.push({ x, z, r: Math.hypot(w, d) / 2 * 0.85, hw: w / 2 + 1, hd: d / 2 + 1 });
  return m;
};

// Admin building with dome and columns (centre-left of road)
building(-22, -18, 28, 10, 14, 0xf3e3c3, [8, 2]);
add(new THREE.Mesh(new THREE.SphereGeometry(4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xc9d6df, { metalness: 0.3 })), -22, 10, -18);
for (let i = -3; i <= 3; i++) add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 8, 12), mat(0xffffff)), -22 + i * 3.5, 4, -10.5);
// Central library (right of road): drum + roof
building(22, -22, 20, 12, 16, 0xd9c7a6, [5, 3]);
add(new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 3, 24), mat(0x9a6a4a)), 22, 13.5, -22);
// Mechanical dept + workshop
building(-24, 14, 22, 8, 12, 0xe7d0b0, [6, 2]);
building(24, 12, 16, 6, 10, 0xcfd8c6, [4, 2]);
// Hostel blocks (far)
[[-45, -55], [-45, -80], [45, -60], [45, -85]].forEach(([x, z]) => building(x, z, 10, 18, 26, 0xe9c8a0, [3, 6]));
building(0, -100, 36, 12, 12, 0xf0dcb8, [9, 2]); // far block closing the road

// Gate with sign
const gate = new THREE.Group();
[-4, 4].forEach(x => { const p = new THREE.Mesh(new THREE.BoxGeometry(1.6, 7, 1.6), mat(0xb5553a)); p.position.set(x, 3.5, 0); p.castShadow = true; gate.add(p); });
const beam = new THREE.Mesh(new THREE.BoxGeometry(10.4, 1.6, 1.8), mat(0xb5553a)); beam.position.set(0, 7.2, 0); beam.castShadow = true; gate.add(beam);
const signC = document.createElement('canvas'); signC.width = 512; signC.height = 96;
{ const g = signC.getContext('2d'); g.fillStyle = '#1b2a4a'; g.fillRect(0, 0, 512, 96); g.fillStyle = '#fff'; g.font = '600 44px sans-serif'; g.textAlign = 'center'; g.fillText('SVNIT SURAT', 256, 62); }
const sign = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(signC) })); sign.position.set(0, 7.2, 0.95); gate.add(sign);
gate.position.set(0, 0, 58); scene.add(gate);
colliders.push({ x: -4, z: 58, r: 1.5 }, { x: 4, z: 58, r: 1.5 });

// Sports ground with track
add(new THREE.Mesh(new THREE.CircleGeometry(18, 48).rotateX(-Math.PI / 2), mat(0x3f7a38)), 52, 0.03, 20).castShadow = false;
add(new THREE.Mesh(new THREE.RingGeometry(18, 21, 48).rotateX(-Math.PI / 2), mat(0xb4503a)), 52, 0.04, 20).castShadow = false;

// Trees (instanced)
{
  const N = 220, trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.4, 3, 6), mat(0x6a4a2a), N);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.2, 1), mat(0x2f7a3a), N);
  const m = new THREE.Matrix4(); let n = 0, tries = 0;
  while (n < N && tries++ < 4000) {
    const x = (Math.random() - 0.5) * 160, z = -105 + Math.random() * 175;
    if (Math.abs(x) < 5) continue;
    if (colliders.some(c => Math.abs(x - c.x) < (c.hw || c.r) + 3 && Math.abs(z - c.z) < (c.hd || c.r) + 3)) continue;
    if (Math.hypot(x - 52, z - 20) < 24) continue;
    const s = 0.8 + Math.random() * 0.8;
    m.makeScale(s, s, s).setPosition(x, 1.5 * s, z); trunk.setMatrixAt(n, m);
    m.makeScale(s, s * 1.1, s).setPosition(x, 4.2 * s, z); crown.setMatrixAt(n, m);
    colliders.push({ x, z, r: 0.7 * s }); n++;
  }
  trunk.count = crown.count = n; trunk.castShadow = crown.castShadow = true; scene.add(trunk, crown);
}

// Lamps along the road
for (let z = 50; z > -95; z -= 16) [-4, 4].forEach(x => {
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.4, 6), mat(0x333333)), x, 2.2, z);
  add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfff1b0 })), x, 4.5, z);
});

// ---- Stations
const stations = [
  { z: 44, title: 'Welcome to SVNIT, Surat', text: 'Sardar Vallabhbhai National Institute of Technology. Undergraduate studies in mechanical engineering.' },
  { z: 12, title: 'Machine learning meets astronomy', text: 'Alongside mechanical engineering: ML for parameter estimation of gravitational waves, predicting galaxy mergers, and interacting galaxies.' },
  { z: -18, title: 'First research steps', text: 'Summer 2019: IIT Indore internship on synthetic jet impingement and its thermal performance.' },
  { z: -50, title: 'Onwards to Paris', text: 'From here the road leads to Sorbonne Université, the Paris Observatory and beyond.', next: true },
];
const beacons = stations.map(s => {
  const g = new THREE.Group();
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffaa28, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  col.position.y = 3; g.add(col);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
  orb.position.y = 1.6; g.add(orb);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.6, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffaa28, side: THREE.DoubleSide }));
  ring.position.y = 0.05; g.add(ring);
  g.position.set(0, 0, s.z); scene.add(g); return { g, orb };
});

// ---- Player
const player = { x: 0, z: 64, yaw: 0, pitch: 0 }; // yaw 0 faces -z
const keys = {}; const stick = { x: 0, y: 0 };
addEventListener('keydown', e => { keys[e.code] = true; });
addEventListener('keyup', e => { keys[e.code] = false; });
let drag = null;
canvas.addEventListener('pointerdown', e => { if (e.target === canvas && !(e.pointerType === 'touch' && e.clientX < 160 && e.clientY > innerHeight - 160)) drag = { x: e.clientX, y: e.clientY }; });
addEventListener('pointerup', () => { drag = null; });
addEventListener('pointermove', e => {
  if (!drag) return;
  player.yaw -= (e.clientX - drag.x) * 0.004; player.pitch = Math.max(-1, Math.min(1, player.pitch - (e.clientY - drag.y) * 0.003));
  drag.x = e.clientX; drag.y = e.clientY;
});
// touch joystick
const stickEl = document.getElementById('stick'), knob = document.getElementById('knob');
if (matchMedia('(pointer: coarse)').matches) {
  stickEl.hidden = false;
  const move = e => {
    const r = stickEl.getBoundingClientRect(), dx = e.clientX - (r.left + 55), dy = e.clientY - (r.top + 55), l = Math.min(1, Math.hypot(dx, dy) / 50);
    const a = Math.atan2(dy, dx); stick.x = Math.cos(a) * l; stick.y = Math.sin(a) * l;
    knob.style.transform = `translate(${stick.x * 35}px, ${stick.y * 35}px)`;
  };
  stickEl.addEventListener('pointerdown', e => { stickEl.setPointerCapture(e.pointerId); move(e); });
  stickEl.addEventListener('pointermove', e => { if (e.buttons || e.pressure) move(e); });
  const end = () => { stick.x = stick.y = 0; knob.style.transform = ''; };
  stickEl.addEventListener('pointerup', end); stickEl.addEventListener('pointercancel', end);
}

let started = false;
document.getElementById('go').onclick = () => { started = true; document.getElementById('start').style.display = 'none'; };

const card = document.getElementById('card');
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  if (started) {
    let f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - stick.y;
    let s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + stick.x;
    if (keys.ArrowLeft) player.yaw += 1.8 * dt; if (keys.ArrowRight) player.yaw -= 1.8 * dt;
    const sp = (keys.ShiftLeft || keys.ShiftRight ? 11 : 5.5) * dt;
    const dx = (-Math.sin(player.yaw) * f + Math.cos(player.yaw) * s) * sp;
    const dz = (-Math.cos(player.yaw) * f - Math.sin(player.yaw) * s) * sp;
    const free = (x, z) => Math.abs(x) < 90 && z < 66 && z > -96 && !colliders.some(c => c.hw ? Math.abs(x - c.x) < c.hw + 0.4 && Math.abs(z - c.z) < c.hd + 0.4 : Math.hypot(x - c.x, z - c.z) < c.r + 0.4);
    if (free(player.x + dx, player.z)) player.x += dx;
    if (free(player.x, player.z + dz)) player.z += dz;
  }
  const bob = started ? Math.sin(t * 9) * 0.03 * (Math.abs(keys.KeyW) || Math.abs(stick.y) ? 1 : 0) : 0;
  camera.position.set(player.x, 1.7 + bob, player.z);
  camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');

  let near = null;
  stations.forEach((s, i) => {
    beacons[i].orb.position.y = 1.6 + Math.sin(t * 2 + i) * 0.2;
    if (Math.hypot(player.x, player.z - s.z) < 5) near = s;
  });
  if (near) { card.hidden = false; card.querySelector('h2').textContent = near.title; card.querySelector('p').textContent = near.text; }
  else card.hidden = true;
  renderer.render(scene, camera);
});
