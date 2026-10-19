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

// low-poly Eiffel Tower
export function eiffel(g, x, z, s = 1) {
  const iron = std(0x7b6350, { roughness: 0.6 }), t = new THREE.Group(); t.position.set(x, 0, z); t.scale.setScalar(s); g.add(t);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const leg = box(t, 0.55, 8.4, 0.55, a * 2.7, 0, b * 2.7, iron); leg.position.y = 4.2; leg.rotation.set(b * 0.27, 0, -a * 0.27); });
  box(t, 6, 0.4, 6, 0, 7.6, 0, iron); box(t, 4.6, 0.3, 4.6, 0, 2.2, 0, iron);
  [[0, 1], [1, 0]].forEach(([a, b]) => { const arch = put(t, new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.22, 6, 14, Math.PI), iron), 0, 0.4, 0); arch.rotation.y = a ? Math.PI / 2 : 0; arch.position.y = 0.2; });
  const mid = put(t, new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.9, 7.2, 4, 1), iron), 0, 11.4, 0); mid.rotation.y = Math.PI / 4;
  box(t, 2.2, 0.35, 2.2, 0, 15, 0, iron);
  const top = put(t, new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.7, 4.6, 4), iron), 0, 17.6, 0); top.rotation.y = Math.PI / 4;
  cyl(t, 0.04, 0.04, 2.2, 0, 19.8, 0, std(0xd8d8e0), 6);
  return { r: 4.2 * s };
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

// Glasgow's Duke of Wellington, traditionally wearing a traffic cone
export function wellington(g, x, z) {
  const bronze = std(0x6f8a74, { roughness: 0.5, metalness: 0.2 }), t = new THREE.Group(); t.position.set(x, 0, z); g.add(t);
  box(t, 2.2, 1.9, 1.6, 0, 0, 0, std(0xc7b99c));
  const body = put(t, new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.1, 4, 8), bronze), 0, 2.7, 0); body.rotation.z = Math.PI / 2;
  [[-0.7, 0.3], [-0.7, -0.3], [0.7, 0.3], [0.7, -0.3]].forEach(([lx, lz]) => cyl(t, 0.1, 0.12, 0.8, lx, 1.9, lz, bronze, 6));
  put(t, new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), bronze), 1.25, 3.2, 0);
  put(t, new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.6, 4, 8), bronze), 0.1, 3.7, 0);
  put(t, new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), bronze), 0.1, 4.3, 0);
  put(t, new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 12), std(0xff7a1a, { emissive: 0xff5a00, emissiveIntensity: 0.4 })), 0.1, 4.75, 0);
  return { r: 1.6 };
}
