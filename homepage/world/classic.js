// Standard (stylised) environment: chunky layered island, puffy clouds, lollipop trees, round bushes. Used when Realistic graphics are off.
import * as THREE from 'three';

export function classicIsland(scene, R, T, M) {
  const top = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1.2, 72), M(T.ground)); top.position.y = -0.6; top.receiveShadow = true; scene.add(top);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(R, 0.55, 10, 96), M(T.lip)); lip.rotation.x = Math.PI / 2; lip.position.y = -0.2; lip.castShadow = true; scene.add(lip);
  [[R - 1, R - 6, 5, T.rock[0]], [R - 6, R - 15, 7, T.rock[1]], [R - 15, R - 24, 7, T.rock[0]]].forEach(([a, b, h, c], i) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(a, b, h, 40, 1), M(c)); m.position.y = -1.2 - h / 2 - [0, 5, 12][i]; m.castShadow = true; scene.add(m);
  });
}
export function classicClouds(scene, T) {
  const cm = new THREE.MeshBasicMaterial({ color: T.cloud, transparent: true, opacity: 0.9, fog: false });
  for (let i = 0; i < 16; i++) { const c = new THREE.Group(); for (let j = 0; j < 3; j++) { const b = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), cm); b.position.set(j * 2.2 - 2.2, Math.random() * 0.8, 0); b.scale.setScalar(1.5 + Math.random() * 1.4); c.add(b); }
    const a = Math.random() * 6.283, d = 70 + Math.random() * 70; c.position.set(Math.cos(a) * d, -14 - Math.random() * 26, Math.sin(a) * d); c.scale.setScalar(2.4); scene.add(c); }
}
// trees, bushes and flowers; `free` finds open ground, `solid` registers colliders
export function classicDecor(scene, { R, PLAZA, T, free, solid, M }) {
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
      m.makeScale(1, 0.7, 1).setPosition(x, 0.4, z); bm.setMatrixAt(nb++, m); solid(x, z, 0.9);
      for (let f = 0; f < 2 && nf < 120; f++) { m.makeScale(1, 1, 1).setPosition(x + (Math.random() - 0.5) * 3, 0.25, z + (Math.random() - 0.5) * 3); fm.setMatrixAt(nf, m); fm.setColorAt(nf++, cols[nf % cols.length]); } }
    bm.count = nb; fm.count = nf; bm.castShadow = true; scene.add(bm, fm);
  }
}
