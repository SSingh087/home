// Synthesises a binary-merger chirp (inspiral, merger, ringdown) and plays it.
(function () {
  var btn = document.getElementById('chirp-play');
  var canvas = document.getElementById('chirp-canvas');
  if (!btn || !canvas) return;

  var RATE = 22050, T = 0.2, TOTAL = 0.7, F0 = 50, FMAX = 350;
  var samples = null;

  function build() {
    var n = RATE * TOTAL, out = new Float32Array(n), phase = 0, tc = T;
    for (var i = 0; i < n; i++) {
      var t = i / RATE, f, amp;
      if (t < tc) {
        // Newtonian inspiral: f ~ (tc - t)^(-3/8), amplitude grows with f
        var tau = Math.max((tc - t) / tc, 1e-4);
        f = Math.min(F0 * Math.pow(tau, -3 / 8), FMAX);
        amp = 0.08 + 0.9 * Math.pow(f / FMAX, 1.4);
      } else {
        // ringdown: fixed frequency, exponential decay
        f = FMAX;
        amp = Math.exp(-(t - tc) * 20);
      }
      phase += 2 * Math.PI * f / RATE;
      var fade = Math.min(1, t * 200);
      out[i] = 0.5 * amp * fade * Math.sin(phase);
    }
    return out;
  }

  function draw(progress) {
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    var n = samples.length, split = Math.floor(progress * n);
    for (var pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      var lo = pass ? split : 0, hi = pass ? n : split;
      for (var i = lo; i < hi; i += 2) {
        var x = i / n * w, y = h / 2 - samples[i] * h * 1.6;
        i === lo ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = pass ? 'rgba(120,190,255,0.7)' : 'hsl(38,100%,55%)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  var actx = null, src = null, raf = 0;

  function stop() {
    if (src) { try { src.stop(); } catch (e) {} src = null; }
    cancelAnimationFrame(raf);
    btn.textContent = '▶ Hear a black hole merger';
    draw(0);
  }

  btn.addEventListener('click', function () {
    if (src) return stop();
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { btn.textContent = 'Audio not supported'; return; }
    actx = actx || new AC();
    if (actx.state === 'suspended') actx.resume();
    var buf = actx.createBuffer(1, samples.length, RATE);
    buf.copyToChannel(samples, 0);
    src = actx.createBufferSource();
    src.buffer = buf;
    src.connect(actx.destination);
    var start = actx.currentTime;
    src.onended = function () { if (src) stop(); };
    src.start();
    btn.textContent = '■ Stop';
    (function tick() {
      draw(Math.min(1, (actx.currentTime - start) / TOTAL));
      raf = requestAnimationFrame(tick);
    })();
  });

  samples = build();
  draw(0);
  window.addEventListener('resize', function () { draw(0); });
})();
