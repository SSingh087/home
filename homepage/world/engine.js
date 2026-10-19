// Shared miniature-world engine: fixed-angle follow camera (Q/E = 90° turns), astronaut character,
// glowing pads that open info cards, rotating minimap.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { M, blackHoleSculpture } from './buildings.js';

const R = 40, PLAZA = 6.5, SC_B = 0.7;
const $ = id => document.getElementById(id);

export async function createWorld(cfg) {
  const T = cfg.theme;
  const canvas = $('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = T.exposure ?? 1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 1, 400);

  // gradient sky
  { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const k = c.getContext('2d');
    const gr = k.createLinearGradient(0, 0, 0, 256); T.sky.forEach((col, i) => gr.addColorStop(i / (T.sky.length - 1), col));
    k.fillStyle = gr; k.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t; }
  scene.fog = new THREE.Fog(T.fog, 90, 220);

  scene.add(new THREE.HemisphereLight(T.hemi[0], T.hemi[1], T.hemi[2]));
  const sun = new THREE.DirectionalLight(T.sun[0], T.sun[1]);
  sun.position.set(30, 55, 25); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.05;
  Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 1, far: 160 });
  scene.add(sun);

  const spinners = [], colliders = [];
  const solid = (x, z, r) => colliders.push({ x, z, r });

  // ---- island: chunky layered disc with a lip
  const top = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1.2, 72), M(T.ground)); top.position.y = -0.6; top.receiveShadow = true; scene.add(top);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(R, 0.55, 10, 96), M(T.lip)); lip.rotation.x = Math.PI / 2; lip.position.y = -0.2; lip.castShadow = true; scene.add(lip);
  [[R - 1, R - 6, 5, T.rock[0]], [R - 6, R - 15, 7, T.rock[1]], [R - 15, R - 24, 7, T.rock[0]]].forEach(([a, b, h, c], i) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(a, b, h, 40, 1), M(c)); m.position.y = -1.2 - h / 2 - [0, 5, 12][i]; m.castShadow = true; scene.add(m);
  });
  // clouds / stars / particles
  const cm = new THREE.MeshBasicMaterial({ color: T.cloud, transparent: true, opacity: 0.9, fog: false });
  for (let i = 0; i < 16; i++) { const c = new THREE.Group(); for (let j = 0; j < 3; j++) { const b = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), cm); b.position.set(j * 2.2 - 2.2, Math.random() * 0.8, 0); b.scale.setScalar(1.5 + Math.random() * 1.4); c.add(b); }
    const a = Math.random() * 6.283, d = 70 + Math.random() * 70; c.position.set(Math.cos(a) * d, -14 - Math.random() * 26, Math.sin(a) * d); c.scale.setScalar(2.4); scene.add(c); }
  if (T.stars) { const n = 2500, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const r = 160 + Math.random() * 60, t = Math.random() * 6.283, p = Math.acos(Math.random() * 1.35 - 0.35); pos.set([r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t)], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.9, color: 0xfff4d8, fog: false })));
    const moon = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 24), new THREE.MeshBasicMaterial({ color: 0xfff1d0, fog: false })); moon.position.set(-90, 70, -150); scene.add(moon); }
  const FLY = 160, flyPos = new Float32Array(FLY * 3), flyG = new THREE.BufferGeometry(); flyG.setAttribute('position', new THREE.BufferAttribute(flyPos, 3));
  const fly = new THREE.Points(flyG, new THREE.PointsMaterial({ size: 0.35, color: T.particles, transparent: true, opacity: 0.85, fog: false })); scene.add(fly);
  const flySeed = Array.from({ length: FLY }, () => [Math.random() * 6.283, 4 + Math.random() * (R - 8), 0.5 + Math.random() * 7, Math.random() * 6.283, 0.2 + Math.random() * 0.5]);

  // ---- plaza
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(PLAZA, PLAZA + 0.3, 0.3, 48), M(T.plaza)); plaza.position.y = 0.05; plaza.receiveShadow = true; scene.add(plaza);
  const ring = new THREE.Mesh(new THREE.RingGeometry(PLAZA - 1.6, PLAZA - 1.2, 48).rotateX(-Math.PI / 2), M(T.path)); ring.position.y = 0.22; scene.add(ring);
  solid(0, 0, blackHoleSculpture(scene, spinners).r);

  // ---- places
  const blobTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const k = c.getContext('2d'); const g = k.createRadialGradient(32, 32, 2, 32, 32, 32);
    g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); k.fillStyle = g; k.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const places = cfg.places.map(p => {
    const a = p.angle * Math.PI / 180, x = Math.sin(a) * p.dist, z = Math.cos(a) * p.dist;
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(-x, -z); g.scale.setScalar(SC_B); scene.add(g);
    const info = p.build(g, spinners);
    info.r *= SC_B; info.front *= SC_B; info.h *= SC_B; info.cols.forEach(c => { c.x *= SC_B; c.z *= SC_B; c.r *= SC_B; });
    const cosr = Math.cos(g.rotation.y), sinr = Math.sin(g.rotation.y);
    const toWorld = (lx, lz) => ({ x: x + lx * cosr + lz * sinr, z: z - lx * sinr + lz * cosr });
    info.cols.forEach(c => { const w = toWorld(c.x, c.z); solid(w.x, w.z, c.r); });
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(info.r * 3, info.r * 3).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
    blob.position.set(x, 0.04, z); scene.add(blob);
    // path from plaza to the pad
    const pad = toWorld(0, info.front), len = Math.hypot(pad.x, pad.z) - PLAZA + 0.8;
    const path = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, len), M(T.path)); path.receiveShadow = true;
    const dir = new THREE.Vector3(pad.x, 0, pad.z).normalize(), mid = dir.clone().multiplyScalar(PLAZA - 0.8 + len / 2);
    path.position.set(mid.x, 0.07, mid.z); path.rotation.y = Math.atan2(dir.x, dir.z); scene.add(path);
    // glowing pad
    const pg = new THREE.Group(); pg.position.set(pad.x, 0.2, pad.z); scene.add(pg);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.15, 32), new THREE.MeshStandardMaterial({ color: T.pad, emissive: T.pad, emissiveIntensity: 0.9 })); pg.add(disc);
    const halo = new THREE.Mesh(new THREE.RingGeometry(2, 2.35, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: T.pad, transparent: true, opacity: 0.6, side: THREE.DoubleSide })); halo.position.y = 0.1; pg.add(halo);
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.9, 4), new THREE.MeshStandardMaterial({ color: T.pad, emissive: T.pad, emissiveIntensity: 0.9 })); arrow.rotation.x = Math.PI; pg.add(arrow);
    // name label
    const c = document.createElement('canvas'); c.width = 640; c.height = 112; const k = c.getContext('2d');
    k.fillStyle = 'rgba(30,20,10,.78)'; k.beginPath(); k.roundRect(0, 0, 640, 112, 56); k.fill(); k.fillStyle = '#fff'; k.font = '600 52px sans-serif'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(p.name, 320, 58);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false, fog: false })); sp.scale.set(7.5, 1.31, 1); sp.position.set(x, info.h + 1.8, z); scene.add(sp);
    return { ...p, x, z, pad, pg, arrow, halo, group: g, spring: 0, springV: 0, active: false, short: p.short };
  });

  // ---- decor: trees, bushes, lamps, benches
  const onPath = (x, z) => places.some(p => { const d = Math.hypot(p.pad.x, p.pad.z), t = (x * p.pad.x + z * p.pad.z) / d, perp = Math.abs((x * p.pad.z - z * p.pad.x) / d); return t > 0 && t < d + 3 && perp < 4; });
  const free = (x, z, m) => places.every(p => Math.hypot(x - p.pad.x, z - p.pad.z) > 5.5) && !colliders.some(c => Math.hypot(x - c.x, z - c.z) < c.r + m) && !onPath(x, z) && Math.hypot(x, z) > PLAZA + 2 && Math.hypot(x, z) < R - 2;
  {
    const N = 42, tr = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.28, 0.4, 1.8, 7), M(T.trunk), N);
    const c1 = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.7, 1), M(T.leaf[0]), N), c2 = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.2, 1), M(T.leaf[1]), N);
    const m = new THREE.Matrix4(); let n = 0, tries = 0;
    while (n < N && tries++ < 3000) {
      const a = Math.random() * 6.283, d = PLAZA + 4 + Math.random() * (R - PLAZA - 7), x = Math.sin(a) * d, z = Math.cos(a) * d;
      if (!free(x, z, 3.5)) continue;
      const s = 0.7 + Math.random() * 0.5;
      m.makeScale(s, s, s).setPosition(x, 0.9 * s, z); tr.setMatrixAt(n, m);
      m.makeScale(s, s * 0.95, s).setPosition(x, 3 * s, z); c1.setMatrixAt(n, m);
      m.makeScale(s, s, s).setPosition(x, 4.7 * s, z); c2.setMatrixAt(n, m);
      solid(x, z, 0.8 * s); n++;
    }
    tr.count = c1.count = c2.count = n; [tr, c1, c2].forEach(o => { o.castShadow = true; o.receiveShadow = true; scene.add(o); });
    // bushes and flowers
    const bm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.8, 1), M(T.leaf[1]), 60), fm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }), 120);
    let nb = 0, nf = 0; tries = 0; const cols = T.flowers.map(c => new THREE.Color(c));
    while (nb < 60 && tries++ < 3000) { const a = Math.random() * 6.283, d = PLAZA + 2 + Math.random() * (R - PLAZA - 5), x = Math.sin(a) * d, z = Math.cos(a) * d; if (!free(x, z, 1.5)) continue;
      m.makeScale(1, 0.7, 1).setPosition(x, 0.4, z); bm.setMatrixAt(nb++, m);
      for (let f = 0; f < 2 && nf < 120; f++) { m.makeScale(1, 1, 1).setPosition(x + (Math.random() - 0.5) * 3, 0.25, z + (Math.random() - 0.5) * 3); fm.setMatrixAt(nf, m); fm.setColorAt(nf++, cols[nf % cols.length]); } }
    bm.count = nb; fm.count = nf; bm.castShadow = true; scene.add(bm, fm);
  }
  places.forEach(p => { // lamps along each path, benches by the plaza
    const d = Math.hypot(p.pad.x, p.pad.z), dir = new THREE.Vector3(p.pad.x, 0, p.pad.z).normalize(), side = new THREE.Vector3(-dir.z, 0, dir.x);
    for (let t = PLAZA + 3; t < d - 3; t += 5.5) [-1, 1].forEach(s => {
      const pos = dir.clone().multiplyScalar(t).addScaledVector(side, s * 2.4);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 2.6, 6), M(0x3b3430)); post.position.set(pos.x, 1.3, pos.z); post.castShadow = true; scene.add(post);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), new THREE.MeshStandardMaterial({ color: 0xfff1b0, emissive: 0xffd878, emissiveIntensity: T.lamp })); bulb.position.set(pos.x, 2.8, pos.z); scene.add(bulb);
      solid(pos.x, pos.z, 0.25);
    });
  });

  // ---- player (Kenney astronaut)
  const player = { x: 0, z: PLAZA - 1, vx: 0, vz: 0, face: 0 };
  const rig = new THREE.Group(); scene.add(rig);
  const limbs = {};
  try {
    const gltf = await new GLTFLoader().loadAsync(cfg.character || '../assets/astronaut.glb');
    const model = gltf.scene; model.traverse(o => { if (o.isMesh) o.castShadow = true; if (o.name) limbs[o.name] = o; });
    const body = limbs.astronautA; if (body) body.position.set(0, 0, 0);
    model.scale.setScalar(3.2); rig.add(model);
  } catch (e) {
    const cap = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1, 4, 10), M(0xffffff)); cap.position.y = 1; cap.castShadow = true; rig.add(cap);
  }
  const shadowBlob = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })); shadowBlob.position.y = 0.06; scene.add(shadowBlob);

  // ---- input
  const keys = {}, stick = { x: 0, y: 0 };
  let camYaw = 0, camYawTarget = 0;
  const turn = d => { camYawTarget += d * Math.PI / 2; };
  addEventListener('keydown', e => { if (e.repeat) return; keys[e.code] = true; if (e.code === 'KeyQ') turn(1); if (e.code === 'KeyE') turn(-1); });
  addEventListener('keyup', e => { keys[e.code] = false; });
  $('rotL')?.addEventListener('click', () => turn(1)); $('rotR')?.addEventListener('click', () => turn(-1));
  let zoom = 1; canvas.addEventListener('wheel', e => { zoom = Math.max(0.7, Math.min(1.5, zoom + Math.sign(e.deltaY) * 0.08)); e.preventDefault(); }, { passive: false });
  const stickEl = $('stick'), knob = $('knob');
  if (matchMedia('(pointer: coarse)').matches) {
    stickEl.hidden = false; $('rotL').hidden = $('rotR').hidden = false;
    const move = e => { const r = stickEl.getBoundingClientRect(), dx = e.clientX - (r.left + 55), dy = e.clientY - (r.top + 55), l = Math.min(1, Math.hypot(dx, dy) / 50), a = Math.atan2(dy, dx);
      stick.x = Math.cos(a) * l; stick.y = Math.sin(a) * l; knob.style.transform = `translate(${stick.x * 35}px, ${stick.y * 35}px)`; };
    stickEl.addEventListener('pointerdown', e => { stickEl.setPointerCapture(e.pointerId); move(e); });
    stickEl.addEventListener('pointermove', e => { if (e.buttons || e.pressure) move(e); });
    const end = () => { stick.x = stick.y = 0; knob.style.transform = ''; }; stickEl.addEventListener('pointerup', end); stickEl.addEventListener('pointercancel', end);
  }
  let started = false;
  $('go').onclick = () => { started = true; $('start').style.display = 'none'; };

  // ---- minimap (rotates with the camera so "up" is always "forward")
  const mm = $('map'), mc = mm.getContext('2d'), MS = mm.width, SC = MS / 2 / (R + 3);
  const toMap = (x, z) => { const c = Math.cos(camYaw), s = Math.sin(camYaw); return [MS / 2 + (x * c - z * s) * SC, MS / 2 - (-x * s - z * c) * SC]; };
  function drawMap() {
    mc.clearRect(0, 0, MS, MS); mc.fillStyle = 'rgba(25,15,10,.6)'; mc.beginPath(); mc.arc(MS / 2, MS / 2, MS / 2, 0, 7); mc.fill();
    mc.fillStyle = '#' + new THREE.Color(T.ground).getHexString(); mc.beginPath(); mc.arc(MS / 2, MS / 2, R * SC, 0, 7); mc.fill();
    const [cx, cy] = toMap(0, 0); mc.fillStyle = '#' + new THREE.Color(T.plaza).getHexString(); mc.beginPath(); mc.arc(cx, cy, PLAZA * SC, 0, 7); mc.fill();
    mc.font = '600 10px sans-serif'; mc.textAlign = 'center';
    places.forEach(p => { const [px, py] = toMap(p.pad.x, p.pad.z);
      mc.strokeStyle = '#' + new THREE.Color(T.path).getHexString(); mc.lineWidth = 3; mc.beginPath(); mc.moveTo(cx, cy); mc.lineTo(px, py); mc.stroke();
      mc.fillStyle = '#' + new THREE.Color(T.pad).getHexString(); mc.beginPath(); mc.arc(px, py, p.active ? 8 : 6, 0, 7); mc.fill();
      const dx = px - cx, dy = py - cy, dl = Math.hypot(dx, dy) || 1, lx = px + dx / dl * 14, ly = py + dy / dl * 12 + 3;
      mc.font = '600 9px sans-serif'; mc.fillStyle = '#fff'; mc.strokeStyle = 'rgba(0,0,0,.7)'; mc.lineWidth = 3; mc.strokeText(p.short, lx, ly); mc.fillText(p.short, lx, ly); });
    const [px, py] = toMap(player.x, player.z), c = Math.cos(camYaw), s = Math.sin(camYaw), fx = Math.sin(player.face), fz = Math.cos(player.face);
    const ang = Math.atan2(fx * c - fz * s, -fx * s - fz * c);
    mc.save(); mc.translate(px, py); mc.rotate(ang); mc.fillStyle = '#fff'; mc.strokeStyle = '#222'; mc.lineWidth = 1.5;
    mc.beginPath(); mc.moveTo(0, -8); mc.lineTo(6, 6); mc.lineTo(-6, 6); mc.closePath(); mc.fill(); mc.stroke(); mc.restore();
  }

  const card = $('card');
  function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 0.9 ? 40 : 28; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();

  // ---- loop
  const clock = new THREE.Clock(), look = new THREE.Vector3(), camPos = new THREE.Vector3(); let walk = 0;
  const ELEV = 0.62, DIST = 84;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    camYaw += (camYawTarget - camYaw) * Math.min(1, dt * 7);
    let f = 0, s = 0;
    if (started) {
      f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - stick.y;
      s = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + stick.x;
    }
    const len = Math.hypot(f, s); if (len > 1) { f /= len; s /= len; }
    const sp = (keys.ShiftLeft || keys.ShiftRight ? 17 : 10);
    const tx = (-Math.sin(camYaw) * f + Math.cos(camYaw) * s) * sp, tz = (-Math.cos(camYaw) * f - Math.sin(camYaw) * s) * sp;
    const k = 1 - Math.exp(-dt * (len > 0 ? 9 : 12));
    player.vx += (tx - player.vx) * k; player.vz += (tz - player.vz) * k;
    const ok = (x, z) => Math.hypot(x, z) < R - 2.5 && !colliders.some(c => Math.hypot(x - c.x, z - c.z) < c.r + 0.8);
    if (ok(player.x + player.vx * dt, player.z)) player.x += player.vx * dt; else player.vx = 0;
    if (ok(player.x, player.z + player.vz * dt)) player.z += player.vz * dt; else player.vz = 0;
    const speed = Math.hypot(player.vx, player.vz);
    if (speed > 0.6) { let d = Math.atan2(player.vx, player.vz) - player.face; d = Math.atan2(Math.sin(d), Math.cos(d)); player.face += d * Math.min(1, dt * 12); }
    walk += dt * speed * 1.4;
    const amp = Math.min(1, speed / 8) * 0.9;
    if (limbs.armLeft) { limbs.armLeft.rotation.x = Math.sin(walk) * amp; limbs.armRight.rotation.x = -Math.sin(walk) * amp; limbs.legLeft.rotation.x = -Math.sin(walk) * amp; limbs.legRight.rotation.x = Math.sin(walk) * amp; }
    rig.position.set(player.x, Math.abs(Math.sin(walk)) * 0.25 * Math.min(1, speed / 8), player.z); rig.rotation.y = player.face;
    shadowBlob.position.x = player.x; shadowBlob.position.z = player.z;

    // fixed-angle follow camera
    look.lerp(new THREE.Vector3(player.x, 2, player.z), Math.min(1, dt * 4));
    const D = DIST * zoom; camPos.set(look.x + Math.sin(camYaw) * Math.cos(ELEV) * D, look.y + Math.sin(ELEV) * D, look.z + Math.cos(camYaw) * Math.cos(ELEV) * D);
    camera.position.copy(camPos); camera.lookAt(look);

    // pads, building bounce, info card
    let near = null;
    places.forEach((p, i) => {
      const on = Math.hypot(player.x - p.pad.x, player.z - p.pad.z) < 2.4;
      if (on && !p.active) p.springV = 3.2;
      p.active = on; if (on) near = p;
      p.springV += (-p.spring * 90 - p.springV * 9) * dt; p.spring += p.springV * dt; p.group.scale.set(1 - p.spring * 0.12, 1 + p.spring * 0.25, 1 - p.spring * 0.12);
      p.arrow.position.y = 2.2 + Math.sin(t * 3 + i) * 0.25; p.arrow.rotation.y = t * 2;
      p.halo.scale.setScalar(1 + (on ? 0.25 : 0) + Math.sin(t * 3 + i) * 0.06);
    });
    spinners.forEach(o => { o.rotation.y = t * 0.8; });
    if (near) { card.hidden = false; card.querySelector('h2').textContent = near.title; card.querySelector('p').textContent = near.text; } else card.hidden = true;
    const fp = flyG.attributes.position; flySeed.forEach((q, i) => fp.setXYZ(i, Math.sin(q[0] + t * 0.05 * q[4]) * q[1], q[2] + Math.sin(t * q[4] + q[3]) * 0.8, Math.cos(q[0] + t * 0.05 * q[4]) * q[1])); fp.needsUpdate = true;
    drawMap(); renderer.render(scene, camera);
  });
  return { player, places };
}
