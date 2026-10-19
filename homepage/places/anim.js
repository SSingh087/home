// Small schematic explainers for each piece of work. Plain canvas 2D, no dependencies.
// Each animation: (host) => stop(). They are simplified illustrations, not simulations of the real analyses.
const W = 900, H = 320, TAU = Math.PI * 2;
const COL = { bg: '#140d26', ink: '#f3eefc', dim: 'rgba(255,255,255,.55)', gold: '#ffb347', cyan: '#6be3ff', pink: '#ff7ab8', green: '#8be28b', red: '#ff6b6b' };

function setup(host, caption) {
  host.innerHTML = '';
  const c = document.createElement('canvas'); c.width = W; c.height = H; c.className = 'anim-canvas';
  const ctl = document.createElement('div'); ctl.className = 'ctl';
  const cap = document.createElement('p'); cap.className = 'cap'; cap.textContent = caption;
  host.append(c, ctl, cap);
  const g = c.getContext('2d'); g.lineCap = 'round'; g.lineJoin = 'round';
  return { c, g, ctl };
}
const slider = (ctl, label, min, max, val, step, cb) => {
  const l = document.createElement('label'), i = document.createElement('input'), o = document.createElement('output');
  Object.assign(i, { type: 'range', min, max, step, value: val }); o.textContent = (+val).toFixed(2);
  i.oninput = () => { o.textContent = (+i.value).toFixed(2); cb(+i.value); };
  l.append(label + ' ', i, o); ctl.append(l); cb(+val); return i;
};
const toggle = (ctl, label, val, cb) => {
  const l = document.createElement('label'), i = document.createElement('input'); i.type = 'checkbox'; i.checked = val;
  i.onchange = () => cb(i.checked); l.append(i, ' ' + label); ctl.append(l); cb(val);
};
const button = (ctl, label, cb) => { const b = document.createElement('button'); b.textContent = label; b.onclick = cb; ctl.append(b); };
let CUR = null; // host currently being built, so loop() can pause itself while off-screen
function loop(draw) {
  const host = CUR; let raf, last = performance.now(), t = 0, run = true;
  const f = now => { if (!run) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; if (!host._off) { t += dt; draw(t, dt); } raf = requestAnimationFrame(f); };
  raf = requestAnimationFrame(f); return () => { run = false; cancelAnimationFrame(raf); };
}
const clear = g => { g.fillStyle = COL.bg; g.fillRect(0, 0, W, H); };
const text = (g, s, x, y, col = COL.dim, size = 13, align = 'left') => { g.fillStyle = col; g.font = `${size}px sans-serif`; g.textAlign = align; g.fillText(s, x, y); };
const line = (g, pts, col, w = 2) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
const circle = (g, x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
const chirp = (u, k = 1) => Math.sin(TAU * (3 * u + 9 * u * u * u) * k) * (0.25 + 0.75 * u); // u in 0..1, grows in frequency and amplitude

// ------------------------------------------------------------------ synthetic jet impinging on a hot plate
function jet(host) {
  const { g, ctl } = setup(host, 'Schematic of a synthetic jet: an oscillating diaphragm in a cavity pushes out vortex rings that hit a hot plate and carry heat away. The actuation waveform changes how the rings form, which is what the internship studied for thermal performance.');
  let square = false; const rings = []; let prev = 0, heat = new Float32Array(40).fill(1), cool = 0;
  toggle(ctl, 'square waveform (off = sine)', false, v => { square = v; });
  const PL = 780, OR = 250;
  return loop((t, dt) => {
    const s = Math.sin(TAU * 1.4 * t), w = square ? Math.tanh(s * 6) : s;
    if (prev <= 0 && w > 0) rings.push({ x: OR, str: 1, born: t }); prev = w;
    for (const r of rings) r.x += (square ? 210 : 170) * dt;
    for (let i = rings.length - 1; i >= 0; i--) if (rings[i].x > PL - 6) { const r = rings.splice(i, 1)[0]; for (let k = 0; k < 40; k++) heat[k] = Math.max(0.05, heat[k] - 0.55 * Math.exp(-Math.pow((k - 20) / (square ? 6 : 8), 2))); }
    for (let k = 0; k < 40; k++) heat[k] = Math.min(1, heat[k] + 0.25 * dt);
    cool = heat.reduce((a, b) => a + (1 - b), 0) / 40;
    clear(g);
    g.fillStyle = '#2a2342'; g.fillRect(60, 110, 140, 100); // cavity
    g.fillStyle = '#3a3060'; g.fillRect(200, 148, 50, 24); // orifice neck
    g.fillStyle = COL.gold; g.fillRect(64 + w * 7, 114, 8, 92); // diaphragm
    text(g, 'cavity + diaphragm', 60, 100); text(g, 'orifice', 205, 140);
    for (const r of rings) { const a = Math.min(1, (r.x - OR) / 40); [-1, 1].forEach(d => { circle(g, r.x, 160 + d * 16, 9, `rgba(107,227,255,${0.8 * a})`); circle(g, r.x, 160 + d * 16, 5, 'rgba(20,13,38,.9)'); }); }
    for (let k = 0; k < 40; k++) { const h = heat[k]; g.fillStyle = `rgb(${Math.round(80 + 175 * h)},${Math.round(90 - 40 * h + 60 * (1 - h))},${Math.round(255 - 200 * h)})`; g.fillRect(PL, 40 + k * 6, 26, 6); }
    text(g, 'hot plate', PL - 10, 28); text(g, `heat removed: ${(cool * 100).toFixed(0)}%`, PL - 110, 305, COL.cyan, 14);
    // diaphragm displacement plot
    line(g, Array.from({ length: 160 }, (_, i) => { const tt = t - (160 - i) * 0.012, ss = Math.sin(TAU * 1.4 * tt); return [60 + i * 1.5, 270 - 28 * (square ? Math.tanh(ss * 6) : ss)]; }), COL.gold, 2);
    text(g, 'actuation waveform', 60, 226);
  });
}

// ------------------------------------------------------------------ LISA constellation + arm-length signal
function lisa(host) {
  const { g, ctl } = setup(host, 'LISA is three spacecraft in a triangle with millions-of-km laser arms, trailing Earth around the Sun. A passing gravitational wave stretches one arm while squeezing another; the PyCBC module work let LISA-like signals be modelled and analysed. (Not to scale.)');
  let amp = 0.5; slider(ctl, 'wave strength', 0, 1, 0.5, 0.01, v => { amp = v; });
  const hist = [];
  return loop(t => {
    clear(g); const cx = 230, cy = 160, R = 110, th = t * 0.35;
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.setLineDash([4, 6]); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke(); g.setLineDash([]);
    circle(g, cx, cy, 16, COL.gold); text(g, 'Sun', cx, cy + 32, COL.dim, 12, 'center');
    const ex = cx + Math.cos(th) * R, ey = cy + Math.sin(th) * R; circle(g, ex, ey, 6, COL.cyan); text(g, 'Earth', ex + 10, ey - 8, COL.dim, 12);
    const la = th - 0.38, lx = cx + Math.cos(la) * R, ly = cy + Math.sin(la) * R, rot = -th * 1.0, wv = Math.sin(t * 5) * amp;
    const verts = [0, 1, 2].map(i => { const a = rot + i * TAU / 3; const k = 1 + (i === 0 ? 0.35 : -0.35) * wv * 0.5 * Math.cos(a * 2 + 0.6); return [lx + Math.cos(a) * 24 * k, ly + Math.sin(a) * 24 * k]; });
    g.fillStyle = 'rgba(255,90,90,.12)'; g.beginPath(); verts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.fill();
    line(g, [...verts, verts[0]], COL.red, 2); verts.forEach(([x, y]) => circle(g, x, y, 4, COL.gold)); text(g, 'LISA', lx + 28, ly + 4, COL.red, 12);
    hist.push(wv * Math.cos(rot) ); if (hist.length > 300) hist.shift();
    text(g, 'change in arm length (one arm)', 480, 60); g.strokeStyle = 'rgba(255,255,255,.15)'; g.strokeRect(480, 80, 380, 180);
    line(g, hist.map((v, i) => [480 + i * (380 / 300), 170 + v * 70]), COL.cyan, 2);
    text(g, 'gravitational-wave strain', 480, 285, COL.dim, 12);
  });
}

// ------------------------------------------------------------------ higher modes and pre-merger detection
function modes(host) {
  const { g, ctl } = setup(host, 'A merging binary radiates mostly in one dominant mode, but asymmetric systems also emit higher harmonics. Adding them changes the signal shape and information content, which can help detect and characterise a source before the merger.');
  let hm = true, ratio = 0.5; toggle(ctl, 'include higher harmonics', true, v => { hm = v; }); slider(ctl, 'mass-ratio asymmetry', 0.1, 1, 0.5, 0.01, v => { ratio = v; });
  const T = 9, MERGE = 8;
  return loop(t0 => {
    const t = t0 % T; clear(g); const u = Math.min(t / MERGE, 1), tau = Math.max(1 - u, 0.02);
    const sep = t < MERGE ? 15 + 85 * Math.pow(tau, 0.25) : 0, phi = (t < MERGE ? 1 : 0) * 70 * (1 - Math.pow(tau, 0.625)) + (t >= MERGE ? 70 : 0);
    const bx = 170, by = 160;
    if (t < MERGE) { circle(g, bx + Math.cos(phi) * sep * 0.4, by + Math.sin(phi) * sep * 0.4, 11, COL.gold); circle(g, bx - Math.cos(phi) * sep * 0.6, by - Math.sin(phi) * sep * 0.6, 8, COL.pink); } else circle(g, bx, by, 13 + 6 * Math.exp(-(t - MERGE) * 3) * Math.sin((t - MERGE) * 30), '#fff');
    text(g, 'binary inspiral', bx, 280, COL.dim, 12, 'center');
    const X0 = 360, X1 = 880; g.strokeStyle = 'rgba(255,255,255,.15)'; g.strokeRect(X0, 40, X1 - X0, 240); text(g, 'detector signal', X0, 30);
    const f = k => { // waveform sample at time fraction k (0..1 of inspiral)
      const tau2 = Math.max(1 - k, 0.002), ph = 2 * 70 * (1 - Math.pow(tau2, 0.625)) * (1 / 1), a = 0.12 + 0.88 * Math.pow(1 - tau2, 2.2);
      return a * (Math.cos(ph) + (hm ? ratio * 0.55 * Math.cos(1.5 * ph + 0.8) : 0));
    };
    const pts = []; const N = 520; for (let i = 0; i < N; i++) { const k = (i / N) * u; pts.push([X0 + (i / N) * (X1 - X0) * u / 1, 160 - 90 * f(k * 0.999)]); }
    line(g, pts, hm ? COL.cyan : COL.gold, 1.6);
    g.fillStyle = 'rgba(255,179,71,.12)'; g.fillRect(X0 + (X1 - X0) * 0.7, 40, (X1 - X0) * 0.3, 240); text(g, 'pre-merger window', X0 + (X1 - X0) * 0.7 + 6, 56, COL.gold, 12);
    text(g, 'merger', X1 - 4, 296, COL.dim, 12, 'right'); line(g, [[X1, 40], [X1, 280]], 'rgba(255,255,255,.3)', 1);
  });
}

// ------------------------------------------------------------------ gravitational lensing: delayed second image
function lensing(host) {
  const { g, ctl } = setup(host, 'A massive lens bends gravitational waves around it, so they reach us along two paths of different length: the same signal arrives twice, delayed and magnified differently. Detecting such repeats (or their absence) is how lensing is used to study dark matter.');
  let delay = 0.3, mag = 0.6; slider(ctl, 'time delay', 0.05, 0.6, 0.3, 0.01, v => { delay = v; }); slider(ctl, 'second-image strength', 0.2, 1, 0.6, 0.01, v => { mag = v; });
  return loop(t => {
    clear(g); const S = [70, 110], L = [260, 110], O = [450, 110];
    circle(g, S[0], S[1], 9, COL.gold); text(g, 'source', S[0], S[1] + 28, COL.dim, 12, 'center');
    const grad = g.createRadialGradient(L[0], L[1], 2, L[0], L[1], 44); grad.addColorStop(0, '#fff'); grad.addColorStop(1, 'rgba(255,122,184,0)'); g.fillStyle = grad; g.beginPath(); g.arc(L[0], L[1], 44, 0, TAU); g.fill();
    text(g, 'lens', L[0], L[1] + 60, COL.dim, 12, 'center'); circle(g, O[0], O[1], 8, COL.cyan); text(g, 'observer', O[0], O[1] + 28, COL.dim, 12, 'center');
    const path = (side, k) => { const by = L[1] + side * 70; return [S[0] + (L[0] - S[0]) * k, S[1] + (by - S[1]) * k * (2 - k)]; };
    [-1, 1].forEach(side => {
      const pts = []; for (let i = 0; i <= 40; i++) { const k = i / 40; const x = i <= 20 ? path(side, k * 2)[0] : L[0] + (O[0] - L[0]) * (k * 2 - 1), y = i <= 20 ? path(side, k * 2)[1] : L[1] + side * 70 * (1 - (k * 2 - 1) * (2 - (k * 2 - 1))) + (O[1] - L[1]) * (k * 2 - 1) * (k * 2 - 1) * 0; pts.push([x, y]); }
      line(g, pts, side < 0 ? 'rgba(107,227,255,.5)' : 'rgba(255,122,184,.5)', 1.5);
      const k = ((t * 0.5 + (side > 0 ? 0 - delay * 0.5 : 0)) % 1 + 1) % 1; const p = pts[Math.floor(k * 40)]; circle(g, p[0], p[1], 5, side < 0 ? COL.cyan : COL.pink);
    });
    // observed signal: chirp, then a delayed weaker copy
    const X0 = 520, X1 = 880; g.strokeStyle = 'rgba(255,255,255,.15)'; g.strokeRect(X0, 30, X1 - X0, 260); text(g, 'what the detector records', X0, 22);
    const dur = 0.35, pts = []; const total = 360; for (let i = 0; i < total; i++) { const x = i / total, a = (x < dur ? chirp(x / dur) : 0), b = (x > delay && x < delay + dur ? mag * chirp((x - delay) / dur) : 0); pts.push([X0 + i, 160 - 100 * (a + b)]); }
    line(g, pts, COL.ink, 1.4);
    text(g, 'first image', X0 + 20, 285, COL.cyan, 12); text(g, 'delayed second image', X0 + delay * 360, 285, COL.pink, 12);
  });
}

// ------------------------------------------------------------------ fuzzy dark matter: wave-optics interference
function fdm(host) {
  const { g, ctl } = setup(host, 'When the lens is a diffuse wave-like object such as fuzzy dark matter, the lensed signal interferes with itself, imprinting oscillations on the frequency content that depend on the lens. Looking for such patterns constrains the dark-matter model. (Schematic.)');
  let tau = 12; slider(ctl, 'lens scale (sets oscillation rate)', 4, 30, 12, 0.5, v => { tau = v; });
  return loop(t => {
    clear(g); const X0 = 60, X1 = 860, Y0 = 40, Y1 = 270; g.strokeStyle = 'rgba(255,255,255,.15)'; g.strokeRect(X0, Y0, X1 - X0, Y1 - Y0);
    text(g, 'signal amplitude vs frequency', X0, 28); text(g, 'frequency →', X1, 292, COL.dim, 12, 'right');
    const base = x => 0.9 * Math.pow(0.12 + x, -0.55) * 0.55, un = [], le = [];
    for (let i = 0; i <= 400; i++) { const x = i / 400, b = base(x), F = 1 + 0.45 * Math.sin(tau * x * 6 + t * 1.2) * Math.exp(-x * 1.6); un.push([X0 + x * (X1 - X0), Y1 - 25 - Math.min(b * 85, 200)]); le.push([X0 + x * (X1 - X0), Y1 - 25 - Math.min(b * F * 85, 200)]); }
    line(g, un, COL.gold, 2); line(g, le, COL.cyan, 2);
    text(g, 'unlensed', X0 + 560, Y0 + 24, COL.gold, 13); text(g, 'lensed (interference)', X0 + 560, Y0 + 44, COL.cyan, 13);
  });
}

// ------------------------------------------------------------------ SVD compression of waveforms
function svd(host) {
  const { g, ctl } = setup(host, 'Singular Value Decomposition finds a small set of basis shapes that describe a whole family of waveforms. Keeping only the first few components compresses a long EMRI-like signal with little error, which makes analysis much cheaper.');
  const n = 220, m = 50, X = []; for (let j = 0; j < m; j++) { const k = 0.97 + 0.06 * (j / (m - 1)), ph = (j * 2.399) % TAU; X.push(Array.from({ length: n }, (_, i) => { const u = i / n; return Math.sin(TAU * (4 * u + 10 * u * u * k) + ph) * (0.3 + 0.7 * u); })); }
  // eigen-decompose the m×m Gram matrix by power iteration + deflation, then V = Xᵀ u / σ
  const G = X.map(a => X.map(b => a.reduce((s, v, i) => s + v * b[i], 0))), basis = [];
  for (let c = 0; c < 10; c++) {
    let u = Array.from({ length: m }, (_, i) => Math.sin(i * 1.3 + c)); for (let it = 0; it < 80; it++) { const v = G.map(r => r.reduce((s, x, i) => s + x * u[i], 0)); const nr = Math.hypot(...v) || 1; u = v.map(x => x / nr); }
    const lam = G.map(r => r.reduce((s, x, i) => s + x * u[i], 0)).reduce((s, x, i) => s + x * u[i], 0); if (lam < 1e-6) break;
    const vv = Array.from({ length: n }, (_, i) => X.reduce((s, row, j) => s + row[i] * u[j], 0) / Math.sqrt(lam)); basis.push({ v: vv, s: Math.sqrt(lam) });
    for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) G[i][j] -= lam * u[i] * u[j];
  }
  let k = 4, target = 25; slider(ctl, 'components kept', 1, basis.length, 4, 1, v => { k = v; });
  button(ctl, 'new waveform', () => { target = Math.floor(Math.random() * m); });
  return loop(t => {
    clear(g); const x = X[Math.min(target, m - 1)], rec = new Array(n).fill(0);
    for (let c = 0; c < k; c++) { const co = basis[c].v.reduce((s, v, i) => s + v * x[i], 0); basis[c].v.forEach((v, i) => { rec[i] += co * v; }); }
    const err = Math.sqrt(x.reduce((s, v, i) => s + (v - rec[i]) ** 2, 0) / x.reduce((s, v) => s + v * v, 0));
    const P = (arr, y0, col, w = 1.6) => line(g, arr.map((v, i) => [60 + i * (560 / n), y0 - v * 62]), col, w);
    text(g, 'original waveform (many samples)', 60, 24); P(x, 90, COL.gold);
    text(g, `reconstruction from ${k} component${k > 1 ? 's' : ''}`, 60, 134); P(rec, 200, COL.cyan);
    text(g, 'difference', 60, 246); P(x.map((v, i) => v - rec[i]), 285, COL.pink, 1.4);
    text(g, 'basis components (SVD)', 690, 24); for (let c = 0; c < Math.min(basis.length, 5); c++) { line(g, basis[c].v.map((v, i) => [690 + i * (190 / n), 58 + c * 52 - v * 20 / (basis[c].v.reduce((a, b) => Math.max(a, Math.abs(b)), 0) || 1)]), c < k ? COL.green : 'rgba(255,255,255,.25)', 1.4); }
    text(g, `error: ${(err * 100).toFixed(1)}%   compression: ${n} → ${k} numbers`, 690, 310, COL.ink, 13);
  });
}

// ------------------------------------------------------------------ two interacting galaxies
function galaxies(host) {
  const { g, ctl } = setup(host, 'Two galaxies on a close encounter: stars (test particles) orbiting each centre get pulled into tidal tails. The deep-learning work estimates the dynamical parameters of such pairs, like the offset and relative speed, directly from images.');
  let b = 90, v = 1.0, st; const NP = 260;
  const reset = () => {
    const M1 = 1, M2 = 0.8; st = { c: [{ x: -150, y: -b / 2, vx: 0.55 * v, vy: 0, m: M1 }, { x: 150, y: b / 2, vx: -0.55 * v, vy: 0, m: M2 }], p: [] };
    for (let i = 0; i < NP; i++) { const gi = i < NP * 0.55 ? 0 : 1, c = st.c[gi], r = 12 + Math.random() * 38, a = Math.random() * TAU, vc = Math.sqrt(c.m * 60 / r) * 0.9; st.p.push({ g: gi, x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r, vx: c.vx - Math.sin(a) * vc, vy: c.vy + Math.cos(a) * vc }); }
  };
  slider(ctl, 'impact offset', 20, 160, 90, 1, x => { b = x; reset(); }); slider(ctl, 'encounter speed', 0.5, 1.6, 1, 0.01, x => { v = x; reset(); }); button(ctl, 'restart', reset);
  let age = 0;
  return loop((t, dt) => {
    age += dt; if (age > 32) { reset(); age = 0; }
    const GM = 60, eps = 144;
    for (let s = 0; s < 16; s++) {
      const h = 0.045; const [A, B] = st.c, dx = B.x - A.x, dy = B.y - A.y, d2 = dx * dx + dy * dy + eps, f = GM / (d2 * Math.sqrt(d2));
      A.vx += f * B.m * dx * h; A.vy += f * B.m * dy * h; B.vx -= f * A.m * dx * h; B.vy -= f * A.m * dy * h;
      for (const c of st.c) { c.x += c.vx * h; c.y += c.vy * h; }
      for (const p of st.p) { let ax = 0, ay = 0; for (const c of st.c) { const ex = c.x - p.x, ey = c.y - p.y, e2 = ex * ex + ey * ey + 40, ff = GM * c.m / (e2 * Math.sqrt(e2)); ax += ff * ex; ay += ff * ey; } p.vx += ax * h; p.vy += ay * h; p.x += p.vx * h; p.y += p.vy * h; }
    }
    clear(g); g.save(); g.translate(W / 2, H / 2);
    for (const p of st.p) circle(g, p.x * 1.25, p.y * 1.25, 1.5, p.g ? 'rgba(255,122,184,.85)' : 'rgba(107,227,255,.85)');
    st.c.forEach((c, i) => circle(g, c.x * 1.25, c.y * 1.25, 4.5, i ? COL.pink : COL.cyan)); g.restore();
    text(g, 'top view of the encounter', 16, 24);
  });
}

// ------------------------------------------------------------------ population inference
function population(host) {
  const { g, ctl } = setup(host, 'Each detection is a noisy measurement of one object. Individually they tell us little, but together they reveal the underlying population: as events accumulate, the inferred distribution converges on the true one.');
  const truth = x => 0.65 * Math.exp(-Math.pow((x - 0.3) / 0.07, 2)) + 0.4 * Math.exp(-Math.pow((x - 0.7) / 0.1, 2));
  const gauss = () => { let a = 0; for (let i = 0; i < 6; i++) a += Math.random(); return (a - 3) / 0.7071; };
  const sample = () => { for (;;) { const x = Math.random(), y = Math.random() * 0.65; if (y < truth(x)) return x; } };
  let rate = 8, ev = [], falling = []; slider(ctl, 'detections per second', 2, 40, 8, 1, v => { rate = v; }); button(ctl, 'start over', () => { ev = []; });
  const X0 = 60, X1 = 860, Y1 = 270; let acc = 0;
  return loop((t, dt) => {
    acc += dt * rate; while (acc > 1) { acc--; if (ev.length > 600) ev = []; const x = sample(), obs = x + gauss() * 0.045; ev.push(obs); falling.push({ x: obs, y: 30, err: 0.045 }); }
    for (const f of falling) f.y += 260 * dt; falling = falling.filter(f => f.y < Y1 - 5);
    clear(g); g.strokeStyle = 'rgba(255,255,255,.15)'; g.strokeRect(X0, 40, X1 - X0, Y1 - 40);
    const bins = 40, hist = new Array(bins).fill(0); ev.forEach(o => { const b = Math.floor(o * bins); if (b >= 0 && b < bins) hist[b]++; });
    const Z = Array.from({ length: 200 }, (_, i) => truth(i / 200)).reduce((s, v) => s + v, 0) / 200, SCY = 40; // density scale shared by all three layers
    hist.forEach((h, i) => { const dens = ev.length ? h / (ev.length / bins) : 0, hh = Math.min(dens * SCY, 215); g.fillStyle = 'rgba(255,179,71,.35)'; g.fillRect(X0 + i * (X1 - X0) / bins + 1, Y1 - hh, (X1 - X0) / bins - 2, hh); });
    line(g, Array.from({ length: 200 }, (_, i) => { const x = i / 200; return [X0 + x * (X1 - X0), Y1 - (truth(x) / Z) * SCY]; }), COL.cyan, 2);
    const bw = Math.max(0.025, 0.12 / Math.sqrt(ev.length + 1)), est = i => { const x = i / 200; return ev.reduce((s, o) => s + Math.exp(-Math.pow((x - o) / bw, 2) / 2), 0) / (ev.length * bw * 2.5066); };
    if (ev.length > 3) line(g, Array.from({ length: 200 }, (_, i) => [X0 + (i / 200) * (X1 - X0), Y1 - Math.min(est(i) * SCY, 215)]), COL.pink, 2.5);
    for (const f of falling) { circle(g, X0 + f.x * (X1 - X0), f.y, 3.5, COL.gold); line(g, [[X0 + (f.x - f.err) * (X1 - X0), f.y], [X0 + (f.x + f.err) * (X1 - X0), f.y]], 'rgba(255,179,71,.6)', 1.2); }
    text(g, 'true population', X0 + 10, 62, COL.cyan, 13); text(g, 'inferred from detections', X0 + 10, 82, COL.pink, 13); text(g, `${ev.length} detections`, X1 - 6, 62, COL.ink, 14, 'right'); text(g, 'property of the object →', X1, 292, COL.dim, 12, 'right');
  });
}

export const ANIMS = { jet, lisa, modes, lensing, fdm, svd, galaxies, population };

// Mounts an animation; it pauses itself while scrolled out of view.
export function mount(name, host) {
  const make = ANIMS[name]; if (!make) return;
  CUR = host; make(host);
  new IntersectionObserver(es => es.forEach(e => { host._off = !e.isIntersecting; }), { threshold: 0.05 }).observe(host);
}
