// Small landmark props that say where each place is: flags, Eiffel Tower, Brandenburg Gate, a Surat diamond, the coned Duke of Wellington.
import * as THREE from 'three';

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o });
const put = (g, mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true; g.add(mesh); return mesh; };
const cyl = (g, rt, rb, h, x, y, z, m, seg = 12) => put(g, new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m), x, y + h / 2, z);
const box = (g, w, h, d, x, y, z, m) => put(g, new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m), x, y + h / 2, z);

const flagTex = kind => {
  const c = document.createElement('canvas'); c.width = 300; c.height = 200; const k = c.getContext('2d');
  if (kind === 'scotland') { k.fillStyle = '#0a5ec2'; k.fillRect(0, 0, 300, 200); k.strokeStyle = '#fff'; k.lineWidth = 30; k.beginPath(); k.moveTo(0, 0); k.lineTo(300, 200); k.moveTo(300, 0); k.lineTo(0, 200); k.stroke(); }
  if (kind === 'india') { k.fillStyle = '#ff9933'; k.fillRect(0, 0, 300, 67); k.fillStyle = '#fff'; k.fillRect(0, 67, 300, 66); k.fillStyle = '#138808'; k.fillRect(0, 133, 300, 67);
    k.strokeStyle = '#000080'; k.lineWidth = 3; k.beginPath(); k.arc(150, 100, 26, 0, 7); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; k.moveTo(150, 100); k.lineTo(150 + Math.cos(a) * 26, 100 + Math.sin(a) * 26); } k.stroke(); }
  if (kind === 'germany') { k.fillStyle = '#111'; k.fillRect(0, 0, 300, 67); k.fillStyle = '#dd0000'; k.fillRect(0, 67, 300, 66); k.fillStyle = '#ffce00'; k.fillRect(0, 133, 300, 67); }
  if (kind === 'france') { k.fillStyle = '#0055a4'; k.fillRect(0, 0, 100, 200); k.fillStyle = '#fff'; k.fillRect(100, 0, 100, 200); k.fillStyle = '#ef4135'; k.fillRect(200, 0, 100, 200); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

// waving flag on a pole; `animators` receives a per-frame function
export function flagpole(g, kind, x, z, animators, h = 7) {
  cyl(g, 0.09, 0.12, h, x, 0, z, std(0xd8d8e0, { metalness: 0.5 }), 8);
  put(g, new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), std(0xffd25a, { metalness: 0.6 })), x, h + 0.1, z);
  const geo = new THREE.PlaneGeometry(3.2, 2.1, 16, 4), base = geo.attributes.position.array.slice();
  const flag = put(g, new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: flagTex(kind), side: THREE.DoubleSide, roughness: 0.9 })), x + 1.7, h - 1.1, z);
  animators.push(t => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const bx = base[i * 3] + 1.6; p.setZ(i, Math.sin(bx * 1.6 - t * 4) * 0.22 * (bx / 3.2)); } p.needsUpdate = true; });
}

// Eiffel Tower: four legs on the real exponential-taper profile, arches, X-bracing, three platforms and a spire
export function eiffel(g, x, z, s = 1) {
  const iron = std(0x8a6c52, { roughness: 0.5, metalness: 0.15, emissive: 0x2a1a0c, emissiveIntensity: 0.4 }), light = std(0xb89a78, { roughness: 0.5 });
  const t = new THREE.Group(); t.position.set(x, 0, z); t.scale.setScalar(s); g.add(t);
  const H = 19, W0 = 4.2, w = f => W0 * (0.93 * Math.exp(-4.3 * f) + 0.07); // half-width at height fraction f
  const strut = (a, b, r, m = iron, shadow = false) => {
    const d = b.clone().sub(a), len = d.length(), c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), m);
    c.position.copy(a).addScaledVector(d, 0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); c.castShadow = shadow; t.add(c); return c;
  };
  const P = (a, f, b) => new THREE.Vector3(a * w(f), f * H, b * w(f));
  const N = 14;
  for (const a of [-1, 1]) for (const b of [-1, 1]) for (let i = 0; i < N; i++) { // the four curved legs / shaft corners
    const f0 = i / N, f1 = (i + 1) / N; strut(P(a, f0, b), P(a, f1, b), 0.34 * (1 - f0 * 0.65) + 0.1, iron, true);
  }
  for (let i = 0; i < N - 1; i += 2) { // X-bracing on all four faces
    const f0 = i / N, f1 = (i + 2) / N;
    for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const pa = (a, f) => ax ? new THREE.Vector3(ax * w(f), f * H, a * w(f)) : new THREE.Vector3(a * w(f), f * H, az * w(f));
      strut(pa(-1, f0), pa(1, f1), 0.09); strut(pa(1, f0), pa(-1, f1), 0.09); strut(pa(-1, f1), pa(1, f1), 0.1);
    }
  }
  // the big arches between the legs
  for (const [ry, off] of [[0, 1], [Math.PI / 2, 1], [0, -1], [Math.PI / 2, -1]]) {
    const r = w(0.04) * 0.82, arch = new THREE.Mesh(new THREE.TorusGeometry(r, 0.26, 6, 22, Math.PI), iron);
    arch.rotation.y = ry; arch.position.set(ry ? off * w(0.045) : 0, 0.05, ry ? 0 : off * w(0.045)); arch.castShadow = true; t.add(arch);
  }
  // platforms with a thin railing
  [[0.27, 1.0], [0.56, 1.0], [0.8, 1.0]].forEach(([f]) => {
    const half = w(f) + 0.55; box(t, half * 2, 0.4, half * 2, 0, f * H, 0, light);
    box(t, half * 2 + 0.2, 0.12, half * 2 + 0.2, 0, f * H + 0.4, 0, iron);
  });
  const top = new THREE.Mesh(new THREE.ConeGeometry(0.42, 4.2, 4), iron); top.position.y = H + 1.8; top.rotation.y = Math.PI / 4; top.castShadow = true; t.add(top);
  strut(new THREE.Vector3(0, H + 3.6, 0), new THREE.Vector3(0, H + 5.6, 0), 0.05, light);
  put(t, new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), std(0xff4a4a, { emissive: 0xff2a2a, emissiveIntensity: 1 })), 0, H + 5.7, 0);
  return { r: W0 * s * 1.05 };
}

// Brandenburg Gate: columns, entablature, attica and a quadriga
export function brandenburg(g, x, z) {
  const stone = std(0xe4d9bd), green = std(0x5fa08a, { metalness: 0.4, roughness: 0.4 }), t = new THREE.Group(); t.position.set(x, 0, z); g.add(t);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) cyl(t, 0.42, 0.48, 5.4, -4.6 + i * 1.84, 0.4, r ? -1.6 : 1.6, stone, 14);
  box(t, 11.2, 0.4, 5, 0, 0, 0, stone); box(t, 11.2, 1.3, 4.6, 0, 5.8, 0, stone); box(t, 11.6, 0.35, 5, 0, 7.1, 0, stone); box(t, 10, 1.1, 4.2, 0, 7.45, 0, stone);
  box(t, 2.4, 0.5, 1.6, 0, 8.55, 0, green); // chariot
  [-0.9, -0.3, 0.3, 0.9].forEach(hx => { box(t, 0.4, 1.1, 0.9, hx, 8.6, 1.2, green); put(t, new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), green), hx, 9.8, 1.6); });
  cyl(t, 0.05, 0.05, 1.4, 0, 9.1, -0.4, green, 6);
  return { r: 6 };
}

// Surat, the diamond city: a floating gem on a plinth
export function gem(g, x, z, spinners) {
  cyl(g, 1.4, 1.7, 1.2, x, 0, z, std(0xd8cdb4), 16);
  const grp = new THREE.Group(); grp.position.set(x, 3.6, z); g.add(grp);
  const mat = new THREE.MeshStandardMaterial({ color: 0x8fe8ff, emissive: 0x2ab8e0, emissiveIntensity: 0.55, roughness: 0.1, metalness: 0.3, flatShading: true });
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.7, 0.8, 8), mat), pav = new THREE.Mesh(new THREE.ConeGeometry(1.7, 2.2, 8), mat);
  crown.position.y = 0.4; pav.position.y = -1.1; pav.rotation.x = Math.PI; crown.castShadow = pav.castShadow = true; grp.add(crown, pav); spinners.push(grp);
  return { r: 1.8 };
}

// Glasgow's Duke of Wellington on his horse, wearing the traditional traffic cone. Built large so the silhouette reads from the camera.
export function wellington(g, x, z, s = 1.3) {
  const bronze = std(0x5f8a73, { roughness: 0.45, metalness: 0.25 }), stone = std(0xcfc3a6), dark = std(0x486b58, { roughness: 0.5 });
  const t = new THREE.Group(); t.position.set(x, 0, z); t.rotation.y = 0.5; t.scale.setScalar(s); g.add(t);
  const cap = (r, len, px, py, pz, rx, rz, m = bronze) => { const c = put(t, new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), m), px, py, pz); c.rotation.set(rx, 0, rz); return c; };
  // stepped plinth
  box(t, 3.6, 0.45, 2.2, 0, 0, 0, stone); box(t, 3.0, 2.1, 1.7, 0, 0.45, 0, stone); box(t, 3.3, 0.3, 2.0, 0, 2.55, 0, stone);
  box(t, 1.1, 0.7, 0.06, 0, 1.2, 0.87, dark); // plaque
  // horse: barrel, neck, head, ears, legs, tail
  cap(0.62, 1.9, 0, 3.85, 0, 0, Math.PI / 2);
  cap(0.34, 1.0, 1.35, 4.65, 0, 0, -0.75);
  cap(0.27, 0.6, 1.95, 5.2, 0, 0, -1.05);
  [[0.06, 0.1], [-0.06, -0.1]].forEach(([dz]) => cyl(t, 0.05, 0.08, 0.3, 1.78, 5.55, dz * 1.6, bronze, 6));
  [[1.0, 0.38], [1.0, -0.38], [-0.95, 0.38], [-0.95, -0.38]].forEach(([lx, lz], i) => { const leg = cyl(t, 0.14, 0.1, 1.3, lx, 2.85, lz, bronze, 8); if (i === 0) { leg.rotation.z = 0.5; leg.position.x += 0.25; leg.position.y += 0.1; } });
  cap(0.12, 0.9, -1.75, 3.65, 0, 0, 0.35);
  // rider
  cap(0.34, 0.9, 0.1, 5.1, 0, 0, 0.1);
  put(t, new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), bronze), 0.12, 5.95, 0);
  cap(0.1, 0.7, 0.55, 5.25, 0.35, 0.3, -1.0); // raised arm
  box(t, 0.9, 0.12, 0.5, 0.12, 6.2, 0, dark); // bicorne hat brim
  // the traffic cone: bright orange with a white band
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 16), std(0xff6a00, { emissive: 0xff4a00, emissiveIntensity: 0.55 })); put(t, cone, 0.12, 6.9, 0);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.32, 0.18, 16), std(0xffffff, { emissive: 0xaaaaaa, emissiveIntensity: 0.4 })); put(t, band, 0.12, 6.85, 0);
  cyl(t, 0.5, 0.5, 0.08, 0.12, 6.28, 0, std(0xff6a00, { emissive: 0xff4a00, emissiveIntensity: 0.5 }), 16);
  return { r: 2.4 * s };
}
