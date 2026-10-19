import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x04020b, 0.018);
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
camera.position.set(0, 13, 24);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 10;
controls.maxDistance = 38;
controls.maxPolarAngle = Math.PI * 0.62;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.35;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.9, 0.7, 0.15);
composer.addPass(bloom);

// ---- Stars
{
  const n = 5000, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = 80 + Math.random() * 120, t = Math.random() * 6.283, p = Math.acos(2 * Math.random() - 1);
    pos.set([r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t)], i * 3);
    new THREE.Color().setHSL(0.55 + Math.random() * 0.2, 0.5, 0.5 + Math.random() * 0.5).toArray(col, i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.5, vertexColors: true, fog: false, sizeAttenuation: true })));
}

// ---- Spacetime grid, displaced by the gravitational-wave field
const N = 140, SIZE = 60;
const gridGeo = new THREE.PlaneGeometry(SIZE, SIZE, N, N);
gridGeo.rotateX(-Math.PI / 2);
const base = gridGeo.attributes.position.array.slice();
const grid = new THREE.Mesh(gridGeo, new THREE.MeshBasicMaterial({
  color: 0x6a3cff, wireframe: true, transparent: true, opacity: 0.14, depthWrite: false }));
grid.position.y = -2.5;
scene.add(grid);

// ---- Black holes
const makeBH = (r) => {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 48, 48), new THREE.MeshBasicMaterial({ color: 0x000000 })));
  const ring = new THREE.Mesh(new THREE.RingGeometry(r * 1.3, r * 2.3, 96, 1),
    new THREE.MeshBasicMaterial({ color: 0xffa030, side: THREE.DoubleSide, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(r * 1.12, r * 0.05, 16, 96),
    new THREE.MeshBasicMaterial({ color: 0xfff0c0 }));
  g.add(halo);
  g.userData = { ring, halo };
  scene.add(g);
  return g;
};
const bhA = makeBH(1.0), bhB = makeBH(0.75);

// flash on merger
const flash = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
scene.add(flash);

// ---- Accretion dust around the binary
const DUST = 2500;
const dustGeo = new THREE.BufferGeometry();
const dustR = new Float32Array(DUST), dustA = new Float32Array(DUST), dustY = new Float32Array(DUST);
for (let i = 0; i < DUST; i++) { dustR[i] = 3 + Math.pow(Math.random(), 1.6) * 9; dustA[i] = Math.random() * 6.283; dustY[i] = (Math.random() - 0.5) * 0.5; }
dustGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DUST * 3), 3));
scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.07, color: 0xffb870, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })));

// ---- Binary evolution: inspiral -> merger -> ringdown -> reset
const CYCLE = 22, INSPIRAL = 16;
let phase = 0, last = 0;
function binary(t) {
  const c = t % CYCLE;
  const tau = Math.max(INSPIRAL - c, 0.02);
  const sep = c < INSPIRAL ? 1.2 + 6.8 * Math.pow(tau / INSPIRAL, 0.25) : 0;
  const omega = 1.6 * Math.pow(8 / Math.max(sep, 1.2), 1.5) * 0.35;
  const amp = c < INSPIRAL ? 0.12 + 1.1 * (1 - tau / INSPIRAL) ** 2 : Math.max(0, 1.2 * Math.exp(-(c - INSPIRAL) * 1.3));
  return { c, sep, omega, amp };
}

// ---- Navigation orbs: bodies on tilted orbits, projected to HTML buttons
const orbEls = [...document.querySelectorAll('.orb')];
const orbits = orbEls.map((el, i) => ({
  el, r: 11 + (i % 3) * 2.4, speed: 0.12 + 0.03 * i, off: (i / orbEls.length) * 6.283,
  tilt: (i - 2) * 0.09, pos: new THREE.Vector3() }));
const bodies = orbits.map((o, i) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 24),
    new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.08 + i * 0.13, 0.9, 0.6) }));
  scene.add(m);
  return m;
});
const hovered = new Set();
orbEls.forEach((el, i) => {
  el.addEventListener('pointerenter', () => hovered.add(i));
  el.addEventListener('pointerleave', () => hovered.delete(i));
});

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce) controls.autoRotate = false;
const v = new THREE.Vector3(), clock = new THREE.Clock();
const gp = gridGeo.attributes.position;

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime * (reduce ? 0.3 : 1);
  const b = binary(t);
  phase += b.omega * dt;

  // black holes
  const ma = 0.75 / 1.75, mb = 1 / 1.75;
  bhA.position.set(Math.cos(phase) * b.sep * ma, 0, Math.sin(phase) * b.sep * ma);
  bhB.position.set(-Math.cos(phase) * b.sep * mb, 0, -Math.sin(phase) * b.sep * mb);
  const merged = b.c >= INSPIRAL;
  bhA.visible = bhB.visible = !merged;
  const ringdown = merged ? Math.exp(-(b.c - INSPIRAL) * 0.9) : 0;
  const remnant = merged ? 1.0 + 0.15 * Math.sin((b.c - INSPIRAL) * 18) * ringdown : 0;
  flash.scale.setScalar(merged ? 1.8 + (b.c - INSPIRAL) * 3 : 0.01);
  flash.material.opacity = merged ? Math.max(0, 0.9 * Math.exp(-(b.c - INSPIRAL) * 3.5)) : 0;
  // remnant BH reuses bhA scaled up
  if (merged) { bhA.visible = true; bhA.position.set(0, 0, 0); bhA.scale.setScalar(Math.min(1.35, remnant * 1.35)); }
  else bhA.scale.setScalar(1);
  for (const bh of [bhA, bhB]) {
    bh.userData.ring.rotation.z += dt * 1.5;
    bh.userData.ring.rotation.x = Math.PI / 2;
  }

  // gravitational waves: h ~ A/sqrt(r) * sin(k r - 2*phase)  (quadrupole => 2x orbital freq)
  const arr = gp.array;
  const k = 0.9, wavePhase = 2 * phase;
  for (let i = 0; i < gp.count; i++) {
    const x = base[i * 3], z = base[i * 3 + 2];
    const r = Math.hypot(x, z), th = Math.atan2(z, x);
    const fall = 1 / Math.sqrt(r + 2);
    const well = -2.2 / (1 + r * r * 0.12);                 // gravitational potential well
    const wave = b.amp * fall * Math.sin(k * r - wavePhase + 2 * th) * 2.2;
    arr[i * 3 + 1] = well + wave * Math.min(1, r / 3);
  }
  gp.needsUpdate = true;

  // dust swirls
  const dp = dustGeo.attributes.position.array;
  for (let i = 0; i < DUST; i++) {
    dustA[i] += dt * 1.8 / Math.pow(dustR[i], 0.9);
    dp[i * 3] = Math.cos(dustA[i]) * dustR[i];
    dp[i * 3 + 1] = dustY[i];
    dp[i * 3 + 2] = Math.sin(dustA[i]) * dustR[i];
  }
  dustGeo.attributes.position.needsUpdate = true;

  // nav orbs
  orbits.forEach((o, i) => {
    const a = o.off + t * o.speed;
    o.pos.set(Math.cos(a) * o.r, Math.sin(a * 1.3) * 0.8 + Math.sin(o.tilt * 6) , Math.sin(a) * o.r);
    o.pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), o.tilt);
    bodies[i].position.copy(o.pos);
    bodies[i].scale.setScalar(hovered.has(i) ? 1.8 : 1);
    v.copy(o.pos).project(camera);
    const sx = (v.x * 0.5 + 0.5) * innerWidth, sy = (-v.y * 0.5 + 0.5) * innerHeight;
    const behind = v.z > 1;
    const depth = THREE.MathUtils.clamp(1.3 - camera.position.distanceTo(o.pos) / 45, 0.35, 1);
    o.el.style.transform = `translate(${sx}px, ${sy - 28}px) translate(-50%, -100%) scale(${depth.toFixed(3)})`;
    o.el.style.opacity = behind ? 0 : 1;
    o.el.style.pointerEvents = behind ? 'none' : 'auto';
  });

  controls.autoRotate = !reduce && hovered.size === 0;
  controls.update();
  composer.render();
  requestAnimationFrame(frame);
}
frame();
