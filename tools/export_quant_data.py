"""Exports compact JSON summaries of the QUANT_PROJECT results for the portfolio dashboard (homepage/quant/).

Only small derived summaries are written (quantiles, histograms, curves), never the raw posterior chains or price files.
Run with the project's venv, which has numpy + torch:
    /home/singh/QUANT_PROJECT/qunat_com_future/bin/python tools/export_quant_data.py
"""
from __future__ import annotations
import json, re, sys
from pathlib import Path
import numpy as np

ROOT = Path('/home/singh/QUANT_PROJECT')
GB = ROOT / 'gold_brent_population_backtest'
DATA = ROOT / 'GOLD_BRENT_DATA'
CAL = ROOT / 'COMM_DATA/results'
OUT = Path(__file__).resolve().parent.parent / 'homepage/quant/data'
OUT.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(GB)); sys.path.insert(0, str(ROOT / 'commodity_futures'))
from surrogate import SurrogateWrapper                      # noqa: E402
from population_model import sample_population, LAMBDA_NAMES  # noqa: E402
from schwartz_smith import SchwartzSmithModel, SSParams      # noqa: E402

PARAMS = ['kappa', 'mu_xi', 'sigma_chi', 'sigma_xi', 'rho', 'lambda_chi', 'chi0', 'xi0']
QS = [5, 16, 50, 84, 95]
rng = np.random.default_rng(7)
sur = SurrogateWrapper.load(DATA / 'checkpoints/surrogate_v1')
MAT = [float(x) for x in sur.maturities]
CARRY_PAIR = {'gold': (4, 5), 'brent': (2, 3)}   # same pairs as backtest_report/make_report.py
FRONT = {'gold': 4, 'brent': 2}
NAMES = {'gold': 'Gold (COMEX GC)', 'brent': 'Brent crude (BZ)'}


def r(x, n=4):
    return None if x is None or (isinstance(x, float) and not np.isfinite(x)) else round(float(x), n)


def predict_batch(theta: np.ndarray) -> np.ndarray:
    """Vectorised version of SurrogateWrapper.predict (same normalisation), returns F in surrogate (rescaled) units."""
    import torch
    t = theta.copy(); t[:, sur.kappa_index] = np.log(t[:, sur.kappa_index])
    x = torch.tensor((t - sur.theta_mean) / sur.theta_std, dtype=torch.float32)
    with torch.no_grad():
        y = sur.model(x).numpy()
    return np.exp(y * sur.log_F_std + sur.log_F_mean)


def commodity(c: str) -> dict:
    days = []
    for d in sorted((DATA / 'data' / c).glob('event_*')):
        meta = json.load(open(d / 'meta.json'))
        days.append((meta['date'], d.name, np.load(d / 'F_obs.npy'), np.load(d / 'coverage_mask.npy'), meta.get('price_rescale', 1.0), meta['n_maturities_covered']))
    days.sort(key=lambda x: x[0])
    resc = days[0][4]
    dense = np.full((len(days), 11), np.nan)
    for k, (_, _, F, m, _, _) in enumerate(days): dense[k, m] = F
    out = {'name': NAMES[c], 'root': 'GC' if c == 'gold' else 'BZ', 'dates': [d[0] for d in days], 'n_cov': [d[5] for d in days],
           'obs': [[r(v * resc, 2) for v in row] for row in dense], 'post': {}, 'pred': {'q05': [], 'q50': [], 'q95': []}}
    cols = {p: [] for p in PARAMS + ['half_life']}
    for date, name, F, m, rs, _ in days:
        ps = np.load(DATA / 'results' / c / name / 'posterior_samples.npy')
        hl = np.log(2) / ps[:, 0]
        for i, p in enumerate(PARAMS): cols[p].append(np.percentile(ps[:, i], QS))
        cols['half_life'].append(np.percentile(hl, QS))
        sel = ps[rng.integers(0, len(ps), 200)].copy(); sel[:, 7] -= np.log(rs)   # back to the surrogate's rescaled price space
        pred = predict_batch(sel) * rs
        for q, key in zip((5, 50, 95), ('q05', 'q50', 'q95')): out['pred'][key].append([r(v, 2) for v in np.percentile(pred, q, axis=0)])
    out['post'] = {p: {f'q{q:02d}': [r(row[i], 4) for row in v] for i, q in enumerate(QS)} for p, v in cols.items()}

    # ---- carry + the same illustrative carry strategy as backtest_report/make_report.py
    i, j = CARRY_PAIR[c]; front = FRONT[c]
    carry = np.where(~np.isnan(dense[:, i]) & ~np.isnan(dense[:, j]), np.log(dense[:, i] / dense[:, j]), np.nan)
    out['carry'] = [r(v, 5) for v in carry]; out['carry_pair'] = [MAT[i], MAT[j]]; out['front'] = MAT[front]
    fp = dense[:, front] * resc
    out['front_price'] = [r(v, 2) for v in fp]
    dates = out['dates']; carry_by = {dates[k]: carry[k] for k in range(len(dates)) if not np.isnan(carry[k])}
    fd = [k for k in range(len(dates)) if not np.isnan(dense[k, front])]
    sd, rets, pos, bh = [], [], [], []
    for a in range(1, len(fd)):
        kp, kn = fd[a - 1], fd[a]
        if dates[kp] not in carry_by: continue
        p = 1.0 if carry_by[dates[kp]] > 0 else -1.0
        lr = float(np.log(dense[kn, front] / dense[kp, front]))
        sd.append(dates[kn]); pos.append(p); rets.append(lr * p)
    # benchmark exactly as in make_report.py: consecutive front-maturity returns from the day before the first strategy day
    fdates = [dates[k] for k in fd]; fprices = np.array([dense[k, front] for k in fd]); st = fdates.index(sd[0])
    bh = np.diff(np.log(fprices[st - 1: st - 1 + len(sd) + 1]))
    rets = np.array(rets)
    def stats(x):
        eq = np.exp(np.cumsum(x)); ar = x.mean() * 252; av = x.std(ddof=1) * np.sqrt(252)
        return {'ann_return': r(ar), 'ann_vol': r(av), 'sharpe': r(ar / av), 'max_drawdown': r((eq / np.maximum.accumulate(eq) - 1).min()), 'hit_rate': r((x > 0).mean())}
    out['strategy'] = {'dates': sd, 'equity': [r(v) for v in np.exp(np.cumsum(rets))], 'bh_equity': [r(v) for v in np.exp(np.cumsum(bh))], 'position': pos,
                       'stats': stats(rets), 'bh_stats': stats(bh), 'n_days': len(rets), 'frac_short': r((np.array(pos) < 0).mean()), 'frac_long': r((np.array(pos) > 0).mean())}
    return out


def population(c: str, per_day_post: dict) -> dict:
    lam = np.load(DATA / 'results' / f'{c}_hierarchical' / 'lambda_posterior_samples.npy')
    draws = np.array([sample_population(lam[k], rng, 1)[0] for k in rng.integers(0, len(lam), 4000)])
    spec = {'kappa': (0.1, 5.0), 'half_life': (0.0, 3.0), 'sigma_chi': (0.05, 0.6), 'sigma_xi': (0.05, 0.4), 'rho': (-0.9, 0.9)}
    res = {}
    for name, (lo, hi) in spec.items():
        pop = np.log(2) / draws[:, 0] if name == 'half_life' else draws[:, PARAMS.index(name)]
        dm = np.array(per_day_post[name]['q50'])
        edges = np.linspace(lo, hi, 41)
        res[name] = {'edges': [r(e, 4) for e in edges], 'pop': [r(v, 4) for v in np.histogram(pop, edges, density=True)[0]],
                     'days': [r(v, 4) for v in np.histogram(dm, edges, density=True)[0]],
                     'pop_q': [r(v, 4) for v in np.percentile(pop, [5, 16, 50, 84, 95])], 'days_median': r(np.median(dm), 4)}
    return {'n_lambda_samples': int(len(lam)), 'params': res}


def calibration() -> dict:
    grid = np.linspace(0, 1, 41); runs = []
    def parse(name, kind):
        g = lambda pat, cast=float: cast(re.search(pat, name).group(1)) if re.search(pat, name) else None
        return {'kind': kind, 'batch': g(r'bs(\d+)', int), 'alpha': g(r'_a([\d.]+)'), 'lr': g(r'lr([\d.e+-]+)_'), 'wd': g(r'wd([\d.e+-]+)_'), 'ens': g(r'^ens(\d+)', int)}
    for kind, sub in (('single', 'CALLIBRATION_S3_L1'), ('ensemble', 'CALLIBRATION_S3_L2')):
        for run in sorted((CAL / sub).iterdir()):
            ips = {p: [] for p in PARAMS}; cov = {p: [] for p in PARAMS}
            for inj in sorted(run.glob('inj_*')):
                f = inj / 'coverage_results.json'
                if not f.exists(): continue
                j = json.load(open(f))
                for p in PARAMS:
                    if p in j: ips[p].append(j[p]['insertion_percentile']); cov[p].append(bool(j[p]['covered']))
            n = len(ips['kappa'])
            if n < 10: continue
            have = [p for p in PARAMS if len(ips[p]) >= 10]   # chi0 / xi0 are not part of the injection-recovery summaries
            pp = {p: [r(np.mean(np.array(ips[p]) <= g), 4) for g in grid] for p in have}
            ks = {p: r(max(abs(np.mean(np.array(ips[p]) <= g) - g) for g in grid), 4) for p in have}
            runs.append({**parse(run.name, kind), 'id': run.name.split('_')[-1], 'n': n, 'pp': pp, 'ks': ks, 'mean_ks': r(np.mean(list(ks.values())), 4),
                         'coverage90': {p: r(np.mean(cov[p]), 3) for p in have}})
    lc = json.load(open(ROOT / 'population_results/layer2_hierarchical/lambda_coverage.json'))
    return {'grid': [r(g, 3) for g in grid], 'runs': runs, 'dkw95': r(np.sqrt(np.log(2 / 0.05) / (2 * 70)), 4),
            'hyper': {'n_total': len(lc), 'n_covered': int(sum(v['covered'] for v in lc.values())), 'names': {k: bool(v['covered']) for k, v in lc.items()}}}


def surrogate_accuracy() -> dict:
    n = 3000; b = {'kappa': (0.1, 5.0), 'mu_xi': (0.0, 0.1), 'sigma_chi': (0.05, 0.6), 'sigma_xi': (0.05, 0.4), 'rho': (-0.9, 0.9), 'lambda_chi': (-0.5, 0.5), 'chi0': (-0.5, 0.5), 'xi0': (2.5, 5.0)}
    th = np.stack([rng.uniform(*b[p], n) for p in PARAMS], 1)
    true = np.array([SchwartzSmithModel(SSParams(kappa=t[0], mu_xi=t[1], sigma_chi=t[2], sigma_xi=t[3], rho=t[4], lambda_chi=t[5], chi0=t[6], xi0=t[7])).forward_curve(np.array(MAT)) for t in th])
    pred = predict_batch(th); err = np.abs(pred / true - 1) * 100
    ex = []
    for k in rng.integers(0, n, 3): ex.append({'theta': {p: r(v, 3) for p, v in zip(PARAMS, th[k])}, 'analytic': [r(v, 3) for v in true[k]], 'surrogate': [r(v, 3) for v in pred[k]]})
    return {'maturities': MAT, 'n_test': n, 'rel_err_pct': {q: [r(v, 4) for v in np.percentile(err, p, axis=0)] for q, p in (('median', 50), ('p95', 95), ('p99', 99))},
            'overall': {'median': r(np.median(err), 4), 'p95': r(np.percentile(err, 95), 4), 'p99': r(np.percentile(err, 99), 4), 'max': r(err.max(), 3)},
            'scatter': {'mat': MAT[5], 'analytic': [r(v, 3) for v in true[:300, 5]], 'surrogate': [r(v, 3) for v in pred[:300, 5]]}, 'examples': ex}


if __name__ == '__main__':
    meta = {'maturities': MAT, 'params': PARAMS, 'commodities': {}}
    for c in ('gold', 'brent'):
        d = commodity(c); (OUT / f'{c}.json').write_text(json.dumps(d, separators=(',', ':')))
        pop = population(c, d['post']); (OUT / f'population_{c}.json').write_text(json.dumps(pop, separators=(',', ':')))
        meta['commodities'][c] = {'name': d['name'], 'root': d['root'], 'start': d['dates'][0], 'end': d['dates'][-1], 'n_days': len(d['dates']), 'strategy_stats': d['strategy']['stats'], 'bh_stats': d['strategy']['bh_stats'],
                                  'carry_pair': d['carry_pair'], 'front': d['front'], 'frac_short': d['strategy']['frac_short'], 'frac_long': d['strategy']['frac_long'], 'n_strategy_days': d['strategy']['n_days']}
        print(c, len(d['dates']), 'days; sharpe', d['strategy']['stats']['sharpe'], 'bh', d['strategy']['bh_stats']['sharpe'], 'maxdd', d['strategy']['stats']['max_drawdown'])
    (OUT / 'calibration.json').write_text(json.dumps(calibration(), separators=(',', ':')))
    (OUT / 'surrogate.json').write_text(json.dumps(surrogate_accuracy(), separators=(',', ':')))
    (OUT / 'meta.json').write_text(json.dumps(meta, separators=(',', ':')))
    print('wrote', [f.name + f' {f.stat().st_size // 1024}KB' for f in sorted(OUT.iterdir())])
