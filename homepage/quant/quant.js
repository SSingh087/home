// Dashboard for the commodity term-structure inference project. All numbers come from ./data/*.json,
// which tools/export_quant_data.py derives from the real fits (summaries only, no raw data).
const $ = id => document.getElementById(id);
const COL = { gold: '#ffc247', brent: '#5ab0ff', pink: '#ff7ab8', green: '#8be28b', red: '#ff6b6b', dim: 'rgba(255,255,255,.55)' };
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
Chart.defaults.color = 'rgba(255,255,255,.72)'; Chart.defaults.font.family = "'Outfit', sans-serif"; Chart.defaults.borderColor = 'rgba(255,255,255,.08)';
Chart.defaults.maintainAspectRatio = false; Chart.defaults.animation.duration = 250;
const f = (x, d = 2) => x == null ? '–' : Number(x).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (x, d = 1) => x == null ? '–' : (x * 100).toFixed(d) + '%';
const day = s => Date.parse(s + 'T00:00:00Z') / 86400000;
const monthTick = v => new Date(v * 86400000).toISOString().slice(0, 7);

const PARAM = {
  half_life: { label: 'Mean-reversion half-life (years)', get: (d, q) => d.post.half_life[q], note: 'ln 2 / κ: how long a shock to the short-term factor takes to decay by half.' },
  kappa: { label: 'κ  mean-reversion speed (1/year)', get: (d, q) => d.post.kappa[q], note: 'How fast the short-term deviation χ is pulled back to zero.' },
  sigma_chi: { label: 'σχ  short-term volatility', get: (d, q) => d.post.sigma_chi[q], note: 'Volatility of the transient, mean-reverting factor.' },
  sigma_xi: { label: 'σξ  long-term volatility', get: (d, q) => d.post.sigma_xi[q], note: 'Volatility of the equilibrium price level.' },
  rho: { label: 'ρ  short/long-term correlation', get: (d, q) => d.post.rho[q], note: 'Mostly prior-dominated here: the traded part of the curve says little about ρ.' },
  chi0: { label: 'χ0  short-term deviation (model state)', get: (d, q) => d.post.chi0[q], note: 'A fitted model state, not a return or trading signal.' },
  xi0: { label: 'Equilibrium price level e^ξ0 (USD)', get: (d, q) => d.post.xi0[q].map(v => Math.exp(v)), note: 'The long-term factor ξ0 expressed as a price level (log scale).', log: true },
};
const Q = ['q05', 'q16', 'q50', 'q84', 'q95'];

async function boot() {
  const names = ['meta', 'gold', 'brent', 'population_gold', 'population_brent', 'calibration', 'surrogate'];
  const [meta, gold, brent, pg, pb, cal, sur] = await Promise.all(names.map(n => fetch(`./data/${n}.json`).then(r => { if (!r.ok) throw new Error(n); return r.json(); })));
  const D = { gold, brent }, POP = { gold: pg, brent: pb }, S = { c: 'gold', i: gold.dates.length - 1 };

  // ---- KPIs and pipeline
  const nDays = gold.dates.length + brent.dates.length, goodRuns = cal.runs.filter(r => Object.values(r.ks).every(v => v < cal.dkw95)).length;
  $('kpis').innerHTML = [[nDays, 'daily forward curves fitted (gold + Brent)'], ['8', 'model parameters inferred per day, with full posteriors'], [`${sur.overall.median.toFixed(3)}%`, `median surrogate error vs the analytic model (99th pct ${sur.overall.p99.toFixed(2)}%)`], [`${goodRuns}/${cal.runs.length}`, 'training configurations with every parameter inside the 95% calibration envelope'], [`${cal.hyper.n_covered}/${cal.hyper.n_total}`, 'population hyperparameters recovered in a simulated-data test']]
    .map(([a, b]) => `<div class="kpi"><b>${a}</b><span>${b}</span></div>`).join('');
  $('stages').innerHTML = [
    ['#validation', 'Train a surrogate', 'An MLP (64-128-128-64, GELU) trained on 500,000 simulated Schwartz–Smith forward curves maps the 8 parameters to the curve at 11 maturities.'],
    ['#validation', 'Check calibration', 'Recovery tests on simulated data with known truth: PP plots and coverage across 13 training configurations before trusting any posterior.'],
    ['#dynamics', 'Infer hierarchically', 'Layer 1: nested sampling (nessai) per trading day. Layer 2: a population hyper-distribution pooled over the days, per commodity.'],
    ['#backtest', 'Run on real markets', 'Real gold and Brent futures chains, with a masked likelihood that compares the model only at maturities that actually trade.'],
  ].map(([h, t, p], i) => `<a class="card" href="${h}"><span class="n">${i + 1}</span><h4>${t}</h4><p>${p}</p></a>`).join('');

  // ---- 1. curve explorer
  const mats = meta.maturities;
  const extrap = { id: 'extrap', beforeDatasetsDraw(ch) {
    const { ctx, chartArea: a, scales: { x } } = ch; if (ch.$maxCov == null) return; const x0 = x.getPixelForValue(ch.$maxCov + 0.15);
    ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.045)'; ctx.fillRect(x0, a.top, a.right - x0, a.bottom - a.top); ctx.fillStyle = COL.dim; ctx.font = '12px Outfit'; ctx.textAlign = 'right';
    ctx.fillText('beyond traded contracts: model extrapolation', a.right - 8, a.top + 16); ctx.restore(); } };
  const chCurve = new Chart($('chCurve'), { type: 'line', plugins: [extrap], data: { datasets: [
    { label: '5%', data: [], borderWidth: 0, pointRadius: 0, fill: false },
    { label: '90% credible band', data: [], borderWidth: 0, pointRadius: 0, fill: '-1' },
    { label: 'model (median)', data: [], pointRadius: 3, borderWidth: 2 },
    { label: 'observed futures', data: [], showLine: false, pointRadius: 7, pointStyle: 'rectRot', borderWidth: 2 }] },
    options: { parsing: false, scales: { x: { type: 'linear', min: 0, max: 10.4, title: { display: true, text: 'time to maturity (years)' } }, y: { title: { display: true, text: 'futures price (USD)' } } },
      plugins: { legend: { labels: { filter: i => i.text !== '5%' } }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${f(c.parsed.y)}` } } } } });
  function drawCurve() {
    const d = D[S.c], i = S.i, col = COL[S.c], ds = chCurve.data.datasets, pts = a => mats.map((m, k) => ({ x: m, y: a[i][k] }));
    ds[0].data = pts(d.pred.q05); ds[1].data = pts(d.pred.q95); ds[1].backgroundColor = rgba(col, .2); ds[2].data = pts(d.pred.q50); ds[2].borderColor = col; ds[2].backgroundColor = col;
    ds[3].data = mats.map((m, k) => ({ x: m, y: d.obs[i][k] })).filter(p => p.y != null); ds[3].borderColor = '#fff'; ds[3].backgroundColor = col;
    chCurve.$maxCov = Math.max(...ds[3].data.map(p => p.x)); chCurve.update();
    $('dateOut').textContent = d.dates[i]; $('slider').value = i;
    const q = p => d.post[p]; const row = (n, p, fn = v => f(v, 3)) => `<tr><td>${n}</td><td>${fn(q(p).q50[i])} <span class="note">[${fn(q(p).q16[i])}, ${fn(q(p).q84[i])}]</span></td></tr>`;
    $('daySide').innerHTML = `<h4>${d.name} · ${d.dates[i]}</h4><table>${row('half-life (yr)', 'half_life')}${row('κ', 'kappa')}${row('σχ', 'sigma_chi')}${row('σξ', 'sigma_xi')}${row('ρ', 'rho')}${row('χ0', 'chi0')}
      <tr><td>price level e^ξ0</td><td>${f(Math.exp(q('xi0').q50[i]), 0)}</td></tr><tr><td>maturities traded</td><td>${d.n_cov[i]} of 11</td></tr></table><p class="note">Median [68% interval]. The band is the posterior-predictive curve from 200 posterior draws through the surrogate.</p>`;
  }
  function setCommodity(c, i) { S.c = c; S.i = i ?? D[c].dates.length - 1; $('slider').max = D[c].dates.length - 1; document.querySelectorAll('#segC button').forEach(b => b.classList.toggle('on', b.dataset.c === c)); drawCurve(); }
  document.querySelectorAll('#segC button').forEach(b => b.onclick = () => setCommodity(b.dataset.c));
  $('slider').oninput = e => { S.i = +e.target.value; drawCurve(); };
  let timer = null; $('play').onclick = () => { if (timer) { clearInterval(timer); timer = null; $('play').innerHTML = '&#9654; Play'; return; } $('play').innerHTML = '&#10073;&#10073; Pause';
    timer = setInterval(() => { S.i = (S.i + 1) % D[S.c].dates.length; drawCurve(); }, 110); };
  setCommodity('gold');

  // ---- 2. parameter dynamics
  $('selParam').innerHTML = Object.entries(PARAM).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');
  const chDyn = new Chart($('chDyn'), { type: 'line', data: { datasets: [] }, options: { parsing: false, interaction: { mode: 'nearest', axis: 'x', intersect: false },
    scales: { x: { type: 'linear', ticks: { callback: monthTick, maxTicksLimit: 9 } }, y: { title: { display: true, text: '' } } },
    plugins: { legend: { labels: { filter: i => /median/.test(i.text) } }, tooltip: { callbacks: { title: it => monthTick(it[0].parsed.x) + ' (' + new Date(it[0].parsed.x * 86400000).toISOString().slice(0, 10) + ')', label: c => `${c.dataset.label}: ${f(c.parsed.y, 3)}` } } },
    onClick: (e, els, ch) => { const xv = ch.scales.x.getValueForPixel(e.x); let best = null; for (const c of ['gold', 'brent']) if (S.dyn === 'both' || S.dyn === c) { D[c].dates.forEach((s, k) => { const dd = Math.abs(day(s) - xv); if (!best || dd < best.d) best = { d: dd, c, k }; }); } if (best) { setCommodity(best.c, best.k); $('curves').scrollIntoView(); } } } });
  S.dyn = 'both'; S.param = 'half_life';
  function drawDyn() {
    const P = PARAM[S.param], sets = []; const cs = S.dyn === 'both' ? ['gold', 'brent'] : [S.dyn];
    cs.forEach(c => { const d = D[c], col = COL[c], x = d.dates.map(day), g = q => P.get(d, q), ser = a => a.map((y, k) => ({ x: x[k], y }));
      sets.push({ label: 'lo90', data: ser(g('q05')), borderWidth: 0, pointRadius: 0, fill: false }, { label: '90%', data: ser(g('q95')), borderWidth: 0, pointRadius: 0, fill: '-1', backgroundColor: rgba(col, .12) },
        { label: 'lo68', data: ser(g('q16')), borderWidth: 0, pointRadius: 0, fill: false }, { label: '68%', data: ser(g('q84')), borderWidth: 0, pointRadius: 0, fill: '-1', backgroundColor: rgba(col, .26) },
        { label: d.name + ' median', data: ser(g('q50')), borderColor: col, backgroundColor: col, borderWidth: 2, pointRadius: 0, pointHitRadius: 6 }); });
    chDyn.data.datasets = sets; chDyn.options.scales.y.title.text = P.label; chDyn.options.scales.y.type = P.log ? 'logarithmic' : 'linear'; chDyn.update(); $('dynNote').textContent = P.note;
  }
  $('selParam').onchange = e => { S.param = e.target.value; drawDyn(); };
  document.querySelectorAll('#segD button').forEach(b => b.onclick = () => { S.dyn = b.dataset.c; document.querySelectorAll('#segD button').forEach(x => x.classList.toggle('on', x === b)); drawDyn(); });
  drawDyn();

  // ---- 3. populations
  const POPN = { half_life: 'Half-life (years)', kappa: 'κ  mean-reversion speed (1/year)', sigma_chi: 'σχ  short-term volatility', sigma_xi: 'σξ  long-term volatility', rho: 'ρ  correlation' };
  $('selPop').innerHTML = Object.entries(POPN).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  const chPop = new Chart($('chPop'), { type: 'bar', data: { labels: [], datasets: [] }, options: { scales: { y: { title: { display: true, text: 'density' } }, x: { title: { display: true, text: '' }, ticks: { maxTicksLimit: 10 } } }, plugins: { legend: { labels: { usePointStyle: true } } } } });
  S.popMode = 'both'; S.popParam = 'half_life';
  function drawPop() {
    const k = S.popParam, ref = POP.gold.params[k], centers = ref.edges.slice(0, -1).map((e, i) => (e + ref.edges[i + 1]) / 2), cs = S.popMode === 'both' ? ['gold', 'brent'] : [S.popMode], sets = [];
    cs.forEach(c => { const p = POP[c].params[k], col = COL[c], nm = D[c].name;
      if (cs.length === 1) sets.push({ type: 'bar', label: `${nm}: individual days (posterior medians)`, data: p.days, backgroundColor: rgba(col, .35), borderWidth: 0, order: 2, categoryPercentage: 1, barPercentage: 1 });
      sets.push({ type: 'line', label: `${nm}: hierarchical population`, data: p.pop, borderColor: col, backgroundColor: rgba(col, cs.length === 1 ? 0 : .15), fill: cs.length > 1, borderWidth: 2.5, pointRadius: 0, tension: .35, order: 1 }); });
    chPop.data.labels = centers.map(v => v.toFixed(2)); chPop.data.datasets = sets; chPop.options.scales.x.title.text = POPN[k]; chPop.update();
    $('popChips').innerHTML = ['gold', 'brent'].map(c => { const p = POP[c].params[k]; return `<span class="chip"><b style="color:${COL[c]}">${D[c].name}</b> population median ${f(p.pop_q[2], 3)} · 90% range [${f(p.pop_q[0], 3)}, ${f(p.pop_q[4], 3)}] · median of daily fits ${f(p.days_median, 3)}</span>`; }).join('');
  }
  $('selPop').onchange = e => { S.popParam = e.target.value; drawPop(); };
  document.querySelectorAll('#segP button').forEach(b => b.onclick = () => { S.popMode = b.dataset.c; document.querySelectorAll('#segP button').forEach(x => x.classList.toggle('on', x === b)); drawPop(); });
  drawPop();

  // ---- 4. validation: surrogate accuracy
  const so = sur.rel_err_pct;
  new Chart($('chSurErr'), { type: 'bar', data: { labels: sur.maturities.map(m => m + 'y'), datasets: [['median', COL.green], ['p95', COL.gold], ['p99', COL.pink]].map(([k, c]) => ({ label: k === 'median' ? 'median' : k === 'p95' ? '95th pct' : '99th pct', data: so[k], backgroundColor: c })) },
    options: { scales: { y: { type: 'logarithmic', title: { display: true, text: 'relative error vs analytic (%)' } }, x: { title: { display: true, text: 'maturity' } } }, plugins: { title: { display: true, text: `Surrogate error on ${sur.n_test} random parameter sets`, color: '#fff' } } } });
  const sc = sur.scatter; new Chart($('chSurScatter'), { type: 'scatter', data: { datasets: [{ label: `surrogate vs analytic at ${sc.mat}y`, data: sc.analytic.map((a, i) => ({ x: a, y: sc.surrogate[i] })), backgroundColor: rgba('#5ab0ff', .6), pointRadius: 2.5 },
    { type: 'line', label: 'identity', data: [{ x: Math.min(...sc.analytic), y: Math.min(...sc.analytic) }, { x: Math.max(...sc.analytic), y: Math.max(...sc.analytic) }], borderColor: COL.gold, borderDash: [6, 4], pointRadius: 0, borderWidth: 1.5 }] },
    options: { scales: { x: { title: { display: true, text: 'analytic forward price' } }, y: { title: { display: true, text: 'surrogate forward price' } } } } });
  $('surChips').innerHTML = `<span class="chip">median error <b>${sur.overall.median.toFixed(3)}%</b></span><span class="chip">95th pct <b>${sur.overall.p95.toFixed(3)}%</b></span><span class="chip">99th pct <b>${sur.overall.p99.toFixed(3)}%</b></span><span class="chip">worst of ${sur.n_test * 11} points <b>${sur.overall.max.toFixed(2)}%</b></span>`;

  // ---- 4b. PP plots
  const runLabel = r => r.kind === 'ensemble' ? `Ensemble of ${r.ens} · batch ${r.batch}, lr ${r.lr}, wd ${r.wd}` : `Single net · batch ${r.batch}, α=β=${r.alpha}, lr ${r.lr}, wd ${r.wd}`;
  $('selRun').innerHTML = cal.runs.map((r, i) => `<option value="${i}">${runLabel(r)}  (KS ${r.mean_ks})</option>`).join('');
  const PPC = { kappa: '#ffc247', mu_xi: '#8be28b', sigma_chi: '#5ab0ff', sigma_xi: '#ff7ab8', rho: '#c39bff', lambda_chi: '#ff9d5c' }, PPN = { kappa: 'κ', mu_xi: 'μξ', sigma_chi: 'σχ', sigma_xi: 'σξ', rho: 'ρ', lambda_chi: 'λχ' };
  const chPP = new Chart($('chPP'), { type: 'line', data: { datasets: [] }, options: { parsing: false, scales: { x: { type: 'linear', min: 0, max: 1, title: { display: true, text: 'credible level p' } }, y: { min: 0, max: 1, title: { display: true, text: 'fraction of simulated curves with truth below p' } } }, plugins: { legend: { labels: { filter: i => !/^(lo|band)/.test(i.text) } } } } });
  function drawPP() {
    const r = cal.runs[+$('selRun').value], g = cal.grid, e = cal.dkw95, sets = [];
    sets.push({ label: 'lo', data: g.map(p => ({ x: p, y: Math.max(0, p - e) })), borderWidth: 0, pointRadius: 0, fill: false }, { label: 'band', data: g.map(p => ({ x: p, y: Math.min(1, p + e) })), borderWidth: 0, pointRadius: 0, fill: '-1', backgroundColor: 'rgba(255,255,255,.1)' },
      { label: 'ideal', data: [{ x: 0, y: 0 }, { x: 1, y: 1 }], borderColor: 'rgba(255,255,255,.6)', borderDash: [5, 4], borderWidth: 1.2, pointRadius: 0 });
    Object.keys(PPC).forEach(p => { if (r.pp[p]) sets.push({ label: PPN[p], data: g.map((x, i) => ({ x, y: r.pp[p][i] })), borderColor: PPC[p], borderWidth: 1.8, pointRadius: 0 }); });
    chPP.data.datasets = sets; chPP.update();
    $('runInfo').textContent = `${r.n} simulated curves`;
    $('ppSide').innerHTML = `<h4>This configuration</h4><table><tr><td>mean KS distance</td><td>${f(r.mean_ks, 3)}</td></tr><tr><td>95% envelope (n=${r.n})</td><td>±${f(cal.dkw95, 3)}</td></tr>${Object.keys(PPC).filter(p => r.ks[p] != null).map(p => `<tr><td>${PPN[p]}  max deviation</td><td style="color:${r.ks[p] < cal.dkw95 ? COL.green : COL.red}">${f(r.ks[p], 3)}</td></tr>`).join('')}</table>
      <p class="note">Green: that parameter&rsquo;s curve stays inside the 95% envelope. Several parameters sit close to the edge, so I treat calibration as good but not perfect.</p>
      <h4 style="margin-top:1rem">Population hyperparameters</h4><p class="note">Recovered in a simulated-data test: <b style="color:#fff">${cal.hyper.n_covered} of ${cal.hyper.n_total}</b> inside their 90% interval.</p>`;
  }
  $('selRun').onchange = drawPP; drawPP();

  // ---- 5. backtest
  const chCarry = new Chart($('chCarry'), { type: 'line', data: { labels: [], datasets: [{ label: 'carry', data: [], borderWidth: 1.6, pointRadius: 0, fill: { target: 'origin', above: rgba('#8be28b', .18), below: rgba('#ff6b6b', .18) } }] },
    options: { scales: { x: { ticks: { maxTicksLimit: 8 } }, y: { title: { display: true, text: 'ln F(near) / F(far)' } } }, plugins: { legend: { display: false }, title: { display: true, text: 'Carry (positive = backwardation)', color: '#fff' } } } });
  const chEq = new Chart($('chEq'), { type: 'line', data: { labels: [], datasets: [{ label: 'carry strategy', data: [], borderWidth: 2, pointRadius: 0 }, { label: 'buy & hold, same days', data: [], borderWidth: 2, borderDash: [6, 4], pointRadius: 0 }] }, options: { scales: { x: { ticks: { maxTicksLimit: 8 } }, y: { title: { display: true, text: 'growth of 1' } } }, plugins: { title: { display: true, text: 'Equity curve: static carry position vs buy-and-hold (no costs)', color: '#fff' } } } });
  S.b = 'gold';
  function drawBT() {
    const d = D[S.b], col = COL[S.b], st = d.strategy;
    chCarry.data.labels = d.dates; chCarry.data.datasets[0].data = d.carry; chCarry.data.datasets[0].borderColor = col; chCarry.update();
    chEq.data.labels = st.dates; chEq.data.datasets[0].data = st.equity; chEq.data.datasets[0].borderColor = col; chEq.data.datasets[1].data = st.bh_equity; chEq.data.datasets[1].borderColor = 'rgba(255,255,255,.7)'; chEq.update();
    const a = st.stats, b = st.bh_stats, m = meta.commodities[S.b];
    $('btTable').innerHTML = `<table class="bt"><tr><th>${d.name}, ${st.n_days} strategy days</th><th>Carry strategy</th><th>Buy &amp; hold</th></tr>
      <tr><td>Annualised return</td><td>${pct(a.ann_return)}</td><td>${pct(b.ann_return)}</td></tr><tr><td>Annualised volatility</td><td>${pct(a.ann_vol)}</td><td>${pct(b.ann_vol)}</td></tr>
      <tr><td>Sharpe (rf = 0)</td><td>${f(a.sharpe)}</td><td>${f(b.sharpe)}</td></tr><tr><td>Max drawdown</td><td>${pct(a.max_drawdown)}</td><td>${pct(b.max_drawdown)}</td></tr>
      <tr><td>Share of days long / short</td><td colspan="2">${pct(st.frac_long, 0)} long · ${pct(st.frac_short, 0)} short (carry pair ${m.carry_pair[0]}y/${m.carry_pair[1]}y, front ${m.front}y)</td></tr></table>`;
  }
  document.querySelectorAll('#segB button').forEach(b => b.onclick = () => { S.b = b.dataset.c; document.querySelectorAll('#segB button').forEach(x => x.classList.toggle('on', x === b)); drawBT(); });
  drawBT();
}
boot().catch(e => { document.body.insertAdjacentHTML('beforeend', `<div id="err"><b>Could not load the dashboard data</b> (${e.message}). If you opened this file directly, serve the site over HTTP instead, for example <code>python3 -m http.server</code> in the repo root.</div>`); console.error(e); });
