// Graphics quality: pick Realistic or Standard per visitor, let them override it, and fall back automatically if Realistic runs slowly.
//   ?quality=high|low|auto  (URL, wins)  >  saved choice (localStorage)  >  auto-detection
const KEY = 'worldQuality', DOWN = 'worldQualityDowngraded';
const get = k => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} };

function weakDevice() {
  const why = [];
  try { const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl'), ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
    const r = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''; if (/swiftshader|llvmpipe|software|basic render|softpipe/i.test(r)) why.push('software renderer'); } catch { why.push('no webgl info'); }
  if (matchMedia('(pointer: coarse)').matches) why.push('touch device');
  if (navigator.deviceMemory && navigator.deviceMemory <= 4) why.push('low memory');
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) why.push('few cores');
  if (navigator.connection && navigator.connection.saveData) why.push('data saver');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) why.push('reduced motion');
  return why;
}

export function detectQuality() {
  const q = new URLSearchParams(location.search).get('quality'), saved = get(KEY);
  const mode = ['high', 'low', 'auto'].includes(q) ? q : ['high', 'low'].includes(saved) ? saved : 'auto';
  if (mode !== 'auto') return { mode, high: mode === 'high', why: [mode === 'high' ? 'chosen: Realistic' : 'chosen: Standard'] };
  if (get(DOWN)) return { mode, high: false, why: ['auto: it ran slowly last time'] };
  const why = weakDevice();
  return { mode, high: why.length === 0, why: why.length ? why : ['auto: capable device'] };
}

// small "Graphics" chip: cycles Auto -> Realistic -> Standard, remembers the choice, reloads to apply it
export function mountQualityChip(Q) {
  const b = document.createElement('button'); b.id = 'gfx'; b.className = 'chip'; b.type = 'button';
  b.style.cssText = 'left:16px;top:58px;border:0;cursor:pointer';
  const label = { auto: 'Auto', high: 'Realistic', low: 'Standard' };
  b.textContent = 'Graphics: ' + label[Q.mode] + (Q.mode === 'auto' ? ' · ' + (Q.high ? 'Realistic' : 'Standard') : '');
  b.title = 'Click to change: Auto (picks for your device) / Realistic / Standard. ' + Q.why.join(', ');
  b.addEventListener('click', () => { const next = { auto: 'high', high: 'low', low: 'auto' }[Q.mode]; set(KEY, next === 'auto' ? null : next); set(DOWN, null); const u = new URL(location.href); u.searchParams.delete('quality'); location.href = u.toString(); });
  document.body.appendChild(b); return b;
}

function toast(msg) {
  const t = document.createElement('div'); t.textContent = msg;
  t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:20;padding:.6rem 1.1rem;border-radius:999px;background:rgba(40,24,14,.82);color:#fff;font:400 .95rem "Space Grotesk",sans-serif;backdrop-filter:blur(8px)';
  document.body.appendChild(t); return t;
}

// frame-time watchdog for Auto + Realistic: if the median frame is slower than ~28 fps, drop to Standard (once) and say so
export function makeFpsWatch(Q) {
  if (!Q.high || Q.mode !== 'auto') return () => {};
  const samples = []; let seen = 0, done = false;
  return rawDt => {
    if (done || rawDt > 0.25) return; if (++seen < 90) return;   // skip shader compile / warm-up
    samples.push(rawDt); if (samples.length < 120) return; done = true;
    const med = samples.sort((a, b) => a - b)[samples.length >> 1];
    if (med > 1 / 28) { set(DOWN, '1'); toast('Running slowly — switching to Standard graphics. You can change this under "Graphics".'); setTimeout(() => location.reload(), 2600); }
  };
}
