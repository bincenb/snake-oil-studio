/* Analytical / Quantitative Chemistry — virtual lab definitions */
(function () {
  'use strict';
  const C = CL.chem;
  CL.course({ id: 'an', code: 'CHEM 311L', title: 'Quantitative Analysis', short: 'Quant', color: '#1E7B46', blurb: 'Statistics of measurement, gravimetry, complexometric and redox titrations, spectrophotometry and HPLC.' });
  const mean = a => (a.length && a.every(isFinite) ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
  const sd = a => { if (a.length < 2 || !a.every(isFinite)) return NaN; const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / (a.length - 1)); };
  const vol = (D, k) => D(k + '_Vf') - D(k + '_Vi');
  const rhoW = T => 0.999974950 * (1 - Math.pow(T - 3.983035, 2) * (T + 301.797) / (522528.9 * (T + 69.34881)));
  const TT = { 2: 12.706, 3: 4.303, 4: 3.182, 5: 2.776, 6: 2.571, 7: 2.447, 8: 2.365, 9: 2.306, 10: 2.262 };
  const qtest = arr => { const s = arr.slice().sort((a, b) => a - b); const rng = s[s.length - 1] - s[0]; const lo = (s[1] - s[0]) / rng, hi = (s[s.length - 1] - s[s.length - 2]) / rng; return hi >= lo ? { q: hi, v: s[s.length - 1] } : { q: lo, v: s[0] }; };

  // ------------------------------------------------------------------ 1
  const masses = D => Array.from({ length: 10 }, (_, i) => D('cal_' + (i + 1)));
  const kept = D => { const m = masses(D); const t = qtest(m); return t.q > 0.466 ? m.filter((x, i) => i !== m.indexOf(t.v)) : m; };
  CL.lab({
    id: 'an-01', course: 'an', n: 1, title: 'Statistics of Measurement: Calibrating a Volumetric Pipet', time: '2.5 h', skills: 'mean · s · Q-test · confidence intervals',
    goals: ['Calibrate a 10-mL volumetric pipet gravimetrically.', 'Apply the Q-test to a suspect result.', 'Report the volume with standard deviation, RSD and a 95% confidence interval.'],
    intro: `<p>A Class A 10-mL pipet has a tolerance of ±0.02 mL. To find its true volume, deliver water many times, weigh each portion, and convert mass to volume with the density of water at the measured temperature: V = m/ρ (buoyancy is neglected here).</p>
      <div class="eq">x̄ = Σx/n &nbsp;&nbsp; s = √[Σ(x − x̄)²/(n − 1)] &nbsp;&nbsp; RSD (ppt) = s/x̄ × 1000 &nbsp;&nbsp; 95% CI: μ = x̄ ± t s/√n</div>
      <p><b>Dixon Q-test:</b> Q = |suspect − nearest| / range. Reject the point if Q &gt; Q<sub>crit</sub>; for n = 10 at 95% confidence, Q<sub>crit</sub> = 0.466.</p>
      <table><tr><th>degrees of freedom</th><td>7</td><td>8</td><td>9</td></tr><tr><th>t (95%)</th><td>2.365</td><td>2.306</td><td>2.262</td></tr></table>`,
    safety: ['Use a pipet bulb. Drain the pipet against the wall of the vessel; do not blow out the last drop.'],
    setup: R => ({ Vp: R.between(9.985, 10.015, 4), T: R.between(20.5, 24.0, 1), out: R.int(2, 9), oe: R.between(0.05, 0.09) * R.pick([1, -1]) }),
    prelab: [
      { q: 'Mean of 10.012, 10.006, 10.009 mL.', unit: 'mL', ans: 10.009, atol: 0.0005 },
      { q: 'Q for the suspect value 10.30 in the set 10.01, 10.02, 10.03, 10.30.', ans: 0.27 / 0.29, atol: 0.005 },
      { q: 'Degrees of freedom for a 95% CI with n = 9.', ans: 8, int: true }
    ],
    parts: [{
      title: 'Ten deliveries', steps: ['Read the water temperature.', 'For each trial, pipet 10 mL of water into a weighed, stoppered flask and weigh it again (mass by difference).'],
      sim: { type: 'bench', title: 'Analytical balance (±0.0001 g)', instrument: 'Mass delivered (g)', controls: [{ k: 't', l: 'Trial', opts: Array.from({ length: 10 }, (_, i) => ({ v: i + 1, l: 'Trial ' + (i + 1) })) }], actions: [{ l: 'Read thermometer', key: 'T', label: 'Water temperature', read: S => ({ v: S.T, u: '°C', dp: 1 }) }, { l: 'Deliver & weigh by difference', key: c => 'cal_' + c.t, label: c => 'Mass of water, trial ' + c.t, read: (S, c) => ({ v: CL.round((S.Vp + (c.t === S.out ? S.oe : 0) + 0.006 * CL.gauss()) * rhoW(S.T), 4), u: 'g', dp: 4, note: c.t === S.out ? 'You noticed an air bubble in the pipet on this delivery.' : '' }) }] }
    }],
    questions: [
      { q: 'Q value for the most suspect mass in your 10 trials.', ans: (S, D) => qtest(masses(D)).q, atol: 0.01, needs: 'all 10 trials' },
      { q: 'Should the suspect value be rejected at 95% confidence?', choices: ['Yes — Q > 0.466', 'No — Q < 0.466'], ans: (S, D) => (qtest(masses(D)).q > 0.466 ? 0 : 1) },
      { q: 'Density of water at your temperature.', unit: 'g/mL', ans: (S, D) => rhoW(D('T')), atol: 0.00006 },
      { q: 'Mean volume delivered (retained data).', unit: 'mL', ans: (S, D) => mean(kept(D)) / rhoW(D('T')), atol: 0.0006, truth: S => S.Vp, tatol: 0.006 },
      { q: 'Standard deviation of the volume (retained data).', unit: 'mL', ans: (S, D) => sd(kept(D)) / rhoW(D('T')), tol: 0.06, atol: 0.0003 },
      { q: 'Relative standard deviation.', unit: 'ppt', ans: (S, D) => sd(kept(D)) / mean(kept(D)) * 1000, tol: 0.06, atol: 0.03 },
      { q: 'Half-width of the 95% confidence interval (t·s/√n).', unit: 'mL', ans: (S, D) => { const k = kept(D); return TT[k.length - 1] * sd(k) / rhoW(D('T')) / Math.sqrt(k.length); }, tol: 0.06, atol: 0.0003 },
      { q: 'Is your pipet within its Class A tolerance (10.00 ± 0.02 mL)?', choices: ['Yes', 'No'], ans: S => (Math.abs(S.Vp - 10) <= 0.02 ? 0 : 1) },
      { q: 'Distinguish systematic from random error, using your calibration as an example.', text: true }
    ],
    key: S => [['True pipet volume', S.Vp + ' mL'], ['Outlier', `trial ${S.out} (${S.oe > 0 ? '+' : ''}${S.oe.toFixed(3)} mL)`], ['T', S.T + ' °C']]
  });

  // ------------------------------------------------------------------ 2
  const pctCl = (D, i) => (D('ga_' + i) - D('gc_' + i)) * (35.45 / 143.32) / D('gs_' + i) * 100;
  CL.lab({
    id: 'an-02', course: 'an', n: 2, title: 'Gravimetric Determination of Chloride', time: '2 × 3 h', skills: 'precipitation · digestion · constant mass',
    goals: ['Precipitate chloride quantitatively as AgCl.', 'Filter, dry and weigh the precipitate to constant mass.', 'Report the percent chloride with precision statistics.'],
    intro: `<div class="eq">Ag⁺(aq) + Cl⁻(aq) → AgCl(s) &nbsp;&nbsp; %Cl = m_AgCl × (35.45/143.32) / m_sample × 100</div>
      <p>Precipitate in dilute HNO₃, so that other silver salts such as carbonate and phosphate do not form. Digest the precipitate near boiling to coagulate the colloid. Wash with dilute HNO₃, because pure water would peptize the colloid. Protect the precipitate from light, since AgCl slowly photodecomposes to purple Ag metal. Filter through weighed sintered-glass crucibles and dry to constant mass at 110 °C.</p>`,
    safety: ['AgNO₃ stains skin and is toxic to aquatic life — collect all silver waste.', 'Conc. HNO₃ is corrosive.'],
    setup: R => ({ pct: R.between(30, 60, 2), ms: [1, 2, 3].map(() => R.between(0.18, 0.22, 4)), cr: [1, 2, 3].map(() => R.between(20, 24, 4)), rec: [1, 2, 3].map(() => R.between(0.996, 1.001)) }),
    prelab: [
      { q: 'A 0.2000-g sample gives 0.3500 g AgCl. %Cl?', unit: '%', ans: 0.35 * 35.45 / 143.32 / 0.2 * 100, atol: 0.02 },
      { q: 'Why is the precipitate washed with dilute HNO₃ instead of water?', choices: ['Water would peptize (redisperse) the colloid', 'HNO₃ dissolves AgCl', 'Water reacts with AgCl', 'To remove silver'], ans: 0 }
    ],
    parts: [{
      title: 'Three replicate determinations', sim: {
        type: 'bench', title: 'Gravimetry bench', instrument: 'Balance (g)', controls: [{ k: 'i', l: 'Replicate', opts: [1, 2, 3].map(i => ({ v: i, l: 'Sample ' + i })) }],
        actions: [{ l: 'Weigh sample', key: c => 'gs_' + c.i, label: c => `Sample ${c.i}: mass of unknown`, read: (S, c) => ({ v: S.ms[c.i - 1], u: 'g', dp: 4 }) }, { l: 'Weigh empty crucible (constant mass)', key: c => 'gc_' + c.i, label: c => `Crucible ${c.i}: empty`, read: (S, c) => ({ v: S.cr[c.i - 1], u: 'g', dp: 4 }) }, { l: 'Precipitate, digest, filter, dry & weigh', key: c => 'ga_' + c.i, label: c => `Crucible ${c.i}: + dry AgCl`, read: (S, c, ctx) => (ctx.D.has('gc_' + c.i) ? { v: CL.round(S.cr[c.i - 1] + S.ms[c.i - 1] * S.pct / 100 * 143.32 / 35.45 * S.rec[c.i - 1] + 0.00008 * CL.gauss(), 4), u: 'g', dp: 4 } : { err: 'Weigh the empty crucible first.' }) }]
      }
    }],
    questions: [
      { q: 'Mass of AgCl from sample 1.', unit: 'g', ans: (S, D) => D('ga_1') - D('gc_1'), atol: 0.0002 },
      { q: '%Cl in sample 1.', unit: '%', ans: (S, D) => pctCl(D, 1), atol: 0.03, truth: S => S.pct, tatol: 0.5 },
      { q: 'Mean %Cl (3 replicates).', unit: '%', ans: (S, D) => mean([1, 2, 3].map(i => pctCl(D, i))), atol: 0.03, truth: S => S.pct, tatol: 0.4 },
      { q: 'Standard deviation of %Cl.', unit: '%', ans: (S, D) => sd([1, 2, 3].map(i => pctCl(D, i))), tol: 0.08, atol: 0.005 },
      { q: 'Why is the solution acidified with HNO₃ before adding AgNO₃?', choices: ['To prevent precipitation of other silver salts (e.g. Ag₂CO₃)', 'To dissolve AgCl', 'To oxidize chloride', 'To speed filtration'], ans: 0 },
      { q: 'If the AgCl was exposed to sunlight and turned purple, would %Cl be high or low? Explain.', text: true }
    ],
    key: S => [['%Cl', S.pct + '%'], ['Sample masses', S.ms.join(', ') + ' g']]
  });

  // ------------------------------------------------------------------ 3
  CL.lab({
    id: 'an-03', course: 'an', n: 3, title: 'Water Hardness by EDTA Titration', time: '3 h', skills: 'complexometry · metal-ion indicators',
    goals: ['Standardize EDTA against a CaCO₃ primary standard.', 'Titrate Ca²⁺/Mg²⁺ in a water sample at pH 10 with Eriochrome Black T.', 'Report hardness in ppm CaCO₃.'],
    intro: `<p>EDTA (Y⁴⁻) binds metal ions 1 : 1. At pH 10 (NH₃/NH₄⁺ buffer), Eriochrome Black T forms a <b>wine-red</b> complex with Mg²⁺/Ca²⁺. When EDTA has taken up all the free metal, it pulls the metal off the indicator, which turns <b>sky blue</b>.</p>
      <div class="eq">M²⁺ + Y⁴⁻ → MY²⁻ &nbsp;&nbsp; hardness (ppm CaCO₃) = M_EDTA × V_EDTA × 100.09 / V_sample(L) (mg/L)</div>
      <p>Standard: dissolve the CaCO₃ in a little HCl and dilute to 250.0 mL. Each titration uses a 25.00-mL aliquot. Classification: soft &lt; 60, moderately hard 61–120, hard 121–180, very hard &gt; 180 ppm.</p>`,
    safety: ['The pH 10 buffer contains concentrated ammonia — use it in the hood.'],
    setup: R => ({ mCa: R.between(0.2400, 0.2600, 4), Ce: R.between(0.00950, 0.01050, 5), H: R.between(80, 320, 0) }),
    prelab: [
      { q: '[Ca²⁺] in the standard made from 0.2500 g CaCO₃ in 250.0 mL.', unit: 'M', ans: 0.25 / 100.09 / 0.25, tol: 0.003 },
      { q: '50.00 mL of water needs 10.20 mL of 0.01000 M EDTA. Hardness?', unit: 'ppm CaCO₃', ans: 0.0102 * 0.01 * 100.09 / 0.05 * 1000, tol: 0.005 }
    ],
    parts: [
      { title: 'Part A — Standardize EDTA', note: S => `<p>CaCO₃ primary standard: <b>${S.mCa.toFixed(4)} g</b> in 250.0 mL. Each flask holds a 25.00-mL aliquot + 5 mL pH 10 buffer + EBT (with a little Mg–EDTA added so the endpoint is sharp).</p>`, sim: S => ({ type: 'titration', title: 'EDTA standardization', titrant: { l: 'EDTA (~0.01 M)', C: S.Ce, kind: 'base', short: 'EDTA' }, endpoint: { Veq: (SS, tr) => tr.veq, from: '#a0204a', to: '#3a6fd0', w: 0.01 }, trials: [1, 2, 3].map(i => ({ k: 's' + i, l: `Ca standard aliquot ${i}`, veq: S.mCa / 100.09 / 10 / S.Ce * 1000, desc: '25.00 mL Ca²⁺ standard + buffer + EBT', logs: i === 1 ? [{ k: 'mCa', l: 'Mass of CaCO₃ in 250.0 mL', v: S.mCa, u: 'g', dp: 4 }] : [] })) }) },
      { title: 'Part B — Water sample', note: '<p>Each flask: 50.00 mL water sample + 5 mL buffer + EBT.</p>', sim: S => ({ type: 'titration', title: 'Water hardness', titrant: { l: 'EDTA (your standardized solution)', C: S.Ce, kind: 'base', short: 'EDTA' }, endpoint: { Veq: () => S.H * 0.05 / 100.09 / S.Ce, from: '#a0204a', to: '#3a6fd0', w: 0.01 }, trials: [1, 2, 3].map(i => ({ k: 'w' + i, l: `Water sample ${i}`, desc: '50.00 mL tap water + buffer + EBT' })) }) }
    ],
    questions: [
      { q: 'Moles of Ca²⁺ in each 25.00-mL standard aliquot.', unit: 'mol', ans: (S, D) => D('mCa') / 100.09 / 10, tol: 0.002 },
      { q: 'Mean molarity of EDTA.', unit: 'M', ans: (S, D) => mean([1, 2, 3].map(i => D('mCa') / 100.09 / 10 / (vol(D, 's' + i) / 1000))), tol: 0.004, truth: S => S.Ce, ttol: 0.01 },
      { q: 'Mean hardness of the water.', unit: 'ppm CaCO₃', ans: (S, D) => { const Ce = mean([1, 2, 3].map(i => D('mCa') / 100.09 / 10 / (vol(D, 's' + i) / 1000))); return mean([1, 2, 3].map(i => Ce * vol(D, 'w' + i) / 1000 * 100.09 / 0.05 * 1000)); }, tol: 0.006, truth: S => S.H, ttol: 0.02 },
      { q: 'Classification of the water.', choices: ['Soft', 'Moderately hard', 'Hard', 'Very hard'], ans: S => (S.H <= 60 ? 0 : S.H <= 120 ? 1 : S.H <= 180 ? 2 : 3) },
      { q: 'Why is the titration done at pH 10?', choices: ['EDTA must be largely deprotonated to bind Ca²⁺/Mg²⁺ strongly, and EBT changes colour there', 'To dissolve CaCO₃', 'To prevent precipitation of EDTA', 'To oxidize the indicator'], ans: 0 },
      { q: 'Explain the colour change at the endpoint in terms of competing metal–ligand equilibria.', text: true }
    ],
    key: S => [['[EDTA]', S.Ce + ' M'], ['Hardness', S.H + ' ppm'], ['Veq (std / water)', (S.mCa / 100.09 / 10 / S.Ce * 1000).toFixed(2) + ' / ' + (S.H * 0.05 / 100.09 / S.Ce).toFixed(2) + ' mL']]
  });

  // ------------------------------------------------------------------ 4
  const Cmn = D => mean([1, 2, 3].map(i => D('ox_m' + i) / 134.00 * 2 / 5 / (vol(D, 'o' + i) / 1000)));
  CL.lab({
    id: 'an-04', course: 'an', n: 4, title: 'Redox Titration: Iron in an Ore by Permanganate', time: '3 h', skills: 'redox stoichiometry · self-indicating titrant',
    goals: ['Standardize KMnO₄ against sodium oxalate.', 'Titrate Fe²⁺ in an unknown with standard permanganate.', 'Report the percent iron.'],
    intro: `<div class="eq">2 MnO₄⁻ + 5 C₂O₄²⁻ + 16 H⁺ → 2 Mn²⁺ + 10 CO₂ + 8 H₂O &nbsp;&nbsp; (Na₂C₂O₄ = 134.00 g/mol, titrate hot, 80 °C)<br>MnO₄⁻ + 5 Fe²⁺ + 8 H⁺ → Mn²⁺ + 5 Fe³⁺ + 4 H₂O</div>
      <p>Permanganate is intensely purple while Mn²⁺ is almost colourless, so KMnO₄ is its own indicator. The endpoint is the first <b>faint pink</b> that lasts 30 s. Your unknown has already been dissolved and all its iron reduced to Fe²⁺ (Zimmermann–Reinhardt procedure).</p>`,
    safety: ['KMnO₄ is a strong oxidizer and stains skin brown.', 'Hot H₂SO₄ solutions — use tongs.'],
    setup: R => ({ Cm: R.between(0.0190, 0.0210, 5), mox: [1, 2, 3].map(() => R.between(0.180, 0.220, 4)), mFe: [1, 2].map(() => R.between(0.90, 1.10, 4)), pFe: R.between(10, 16, 2) }),
    prelab: [
      { q: 'Moles of MnO₄⁻ needed for 0.2000 g Na₂C₂O₄.', unit: 'mol', ans: 0.2 / 134 * 2 / 5, tol: 0.003 },
      { q: 'Electrons gained per MnO₄⁻ reduced to Mn²⁺.', ans: 5, int: true }
    ],
    parts: [
      { title: 'Part A — Standardize KMnO₄', sim: S => ({ type: 'titration', title: 'KMnO₄ vs oxalate', titrant: { l: 'KMnO₄ (~0.02 M)', C: S.Cm, kind: 'base', short: 'KMnO₄', color: 'rgba(120,20,110,.75)' }, endpoint: { Veq: (SS, tr) => tr.veq, from: '#f0f0f0', fa: 0.05, to: '#d04a9a', ta: 0.45, w: 0.008 }, trials: [1, 2, 3].map(i => ({ k: 'o' + i, l: `Oxalate trial ${i}`, veq: S.mox[i - 1] / 134 * 2 / 5 / S.Cm * 1000, desc: `${S.mox[i - 1].toFixed(4)} g Na₂C₂O₄ in 1 M H₂SO₄ at 80 °C`, logs: [{ k: 'ox_m' + i, l: `Oxalate trial ${i}: mass`, v: S.mox[i - 1], u: 'g', dp: 4 }] })) }) },
      { title: 'Part B — Iron unknown', sim: S => ({ type: 'titration', title: 'KMnO₄ vs Fe²⁺', titrant: { l: 'KMnO₄ (standardized)', C: S.Cm, kind: 'base', short: 'KMnO₄', color: 'rgba(120,20,110,.75)' }, endpoint: { Veq: (SS, tr) => tr.veq, from: '#f0e0a0', fa: 0.25, to: '#d8709a', ta: 0.5, w: 0.008 }, trials: [1, 2].map(i => ({ k: 'f' + i, l: `Iron sample ${i}`, veq: S.mFe[i - 1] * S.pFe / 100 / 55.845 / 5 / S.Cm * 1000, desc: `${S.mFe[i - 1].toFixed(4)} g unknown, reduced to Fe²⁺, in H₂SO₄/H₃PO₄`, logs: [{ k: 'fe_m' + i, l: `Iron sample ${i}: mass`, v: S.mFe[i - 1], u: 'g', dp: 4 }] })) }) }
    ],
    questions: [
      { q: 'Mean molarity of KMnO₄.', unit: 'M', ans: (S, D) => Cmn(D), tol: 0.004, truth: S => S.Cm, ttol: 0.01 },
      { q: '%Fe in sample 1.', unit: '%', ans: (S, D) => Cmn(D) * vol(D, 'f1') / 1000 * 5 * 55.845 / D('fe_m1') * 100, atol: 0.03, truth: S => S.pFe, tatol: 0.25 },
      { q: 'Mean %Fe.', unit: '%', ans: (S, D) => mean([1, 2].map(i => Cmn(D) * vol(D, 'f' + i) / 1000 * 5 * 55.845 / D('fe_m' + i) * 100)), atol: 0.03, truth: S => S.pFe, tatol: 0.25 },
      { q: 'Why is no separate indicator needed?', choices: ['MnO₄⁻ is intensely coloured and its reduction product is nearly colourless', 'Fe³⁺ is pink', 'Oxalate changes colour', 'The solution is heated'], ans: 0 },
      { q: 'Why must the oxalate titration be done hot?', text: true }
    ],
    key: S => [['[KMnO₄]', S.Cm + ' M'], ['%Fe', S.pFe + '%']]
  });

  // ------------------------------------------------------------------ 5
  const ferroin0 = C.bands([[510, 1, 38], [470, 0.3, 20]]);
  const FEMAX = (() => { let b = 0, bl = 0; for (let l = 400; l <= 650; l += 0.5) { const v = ferroin0(l); if (v > b) { b = v; bl = l; } } return { v: b, l: bl }; })();
  const ferroin = l => ferroin0(l) / FEMAX.v;
  CL.lab({
    id: 'an-05', course: 'an', n: 5, title: 'Spectrophotometric Determination of Iron in a Supplement', time: '3 h', skills: 'complexation · calibration · dilution factors',
    goals: ['Convert iron to the red tris(1,10-phenanthroline)iron(II) complex.', 'Build a calibration curve from standards.', 'Determine the mass of iron in a supplement tablet.'],
    intro: `<p>Fe²⁺ forms an intensely red complex with three 1,10-phenanthroline ligands (λ<sub>max</sub> ≈ 510 nm, ε ≈ 11 100 M⁻¹cm⁻¹). Hydroxylamine reduces any Fe³⁺ to Fe²⁺, and a sodium acetate buffer keeps the pH near 4–5.</p>
      <p><b>Standards:</b> 5, 10, 15, 20, 25 mL of a 10.0-ppm Fe stock, each diluted to 50.00 mL with reagents (1–5 ppm). <b>Tablet:</b> dissolved in HCl and diluted to 250.0 mL. Then 2.00 mL of that solution is diluted to 100.0 mL with reagents.</p>
      <div class="eq">mg Fe per tablet = ppm(measured) × (100.0/2.00) × 0.2500 L</div>`,
    safety: ['1,10-Phenanthroline is toxic.', 'Hydroxylamine hydrochloride is a skin sensitizer.'],
    setup: R => ({ mg: R.between(18, 65, 1), f: R.between(0.97, 1.03) }),
    prelab: [
      { q: 'Concentration of the standard made from 15.00 mL of 10.0 ppm stock diluted to 50.00 mL.', unit: 'ppm', ans: 3, atol: 0.001 },
      { q: 'The measured solution reads 2.40 ppm Fe. mg Fe per tablet?', unit: 'mg', ans: 2.4 * 50 * 0.25, tol: 0.003 }
    ],
    parts: [{
      title: 'Standards and unknown', sim: [{ type: 'spectro', title: 'Spectrophotometer', l0: 450, samples: S => [{ v: 'blank', l: 'Reagent blank', blank: true }].concat([1, 2, 3, 4, 5].map(p => ({ v: 'std' + p, l: `Standard ${p}.00 ppm Fe`, A: l => 0.1988 * S.f * ferroin(l) * p }))).concat([{ v: 'unk', l: 'Tablet solution (diluted)', A: l => 0.1988 * S.f * ferroin(l) * S.mg / 12.5 + 0.003 }]) }, { type: 'graph', k: 'fe', title: 'Calibration: A vs ppm Fe', short: 'Calibration', xl: 'Fe (ppm)', yl: 'Absorbance', rows: 6, fill: (S, D) => [[0, 0]].concat([1, 2, 3, 4, 5].map(p => [p, D('A_std' + p)])) }]
    }],
    questions: [
      { q: 'λmax of the iron–phenanthroline complex.', unit: 'nm', ans: () => FEMAX.l, atol: 6 },
      { q: 'Slope of your calibration line.', unit: 'ppm⁻¹', ans: (S, D) => D('fe_slope'), tol: 0.01, truth: S => 0.1988 * S.f, ttol: 0.05 },
      { q: 'ppm Fe in the measured (diluted) tablet solution.', unit: 'ppm', ans: (S, D) => (D('A_unk') - D('fe_int')) / D('fe_slope'), tol: 0.015, truth: S => S.mg / 12.5, ttol: 0.05 },
      { q: 'mg of iron per tablet.', unit: 'mg', ans: (S, D) => (D('A_unk') - D('fe_int')) / D('fe_slope') * 12.5, tol: 0.015, truth: S => S.mg, ttol: 0.05 },
      { q: 'Role of hydroxylamine:', choices: ['Reduce Fe³⁺ to Fe²⁺', 'Buffer the pH', 'Complex the iron', 'Oxidize Fe²⁺'], ans: 0 },
      { q: 'Compare your result with the label value (your instructor will provide it) and suggest reasons for any difference.', text: true }
    ],
    key: S => [['Fe per tablet', S.mg + ' mg'], ['Measured soln', (S.mg / 12.5).toFixed(3) + ' ppm']]
  });

  // ------------------------------------------------------------------ 6
  const stds = [10, 25, 50, 100, 150];
  CL.lab({
    id: 'an-06', course: 'an', n: 6, title: 'HPLC Determination of Caffeine in Beverages', time: '3 h', skills: 'reversed-phase HPLC · external calibration',
    goals: ['Identify caffeine by retention time on a C18 column.', 'Construct an external-standard calibration of peak area against concentration.', 'Determine caffeine in a cola, an energy drink and brewed coffee.'],
    intro: `<p>In reversed-phase HPLC (C18 column, 25% methanol/water mobile phase, UV detection at 273 nm), more polar compounds elute first. Compounds are identified by <b>retention time</b> compared with standards. The <b>peak area</b> is proportional to concentration.</p>
      <p>Degassed samples are filtered (0.45 µm). The energy drink is diluted 1 : 4 and the coffee 1 : 10 before injection, so multiply by the dilution factor. 1 can = 355 mL, 1 cup = 240 mL.</p>`,
    safety: ['Methanol is toxic and flammable.', 'Never exceed the column pressure limit.'],
    setup: R => ({ k: R.between(1150, 1350, 0), rt: R.between(4.10, 4.30, 2), cola: R.between(88, 110, 1), en: R.between(280, 340, 0), cof: R.between(400, 700, 0) }),
    prelab: [
      { q: 'A peak area corresponds to 80.0 mg/L in an energy drink diluted 1:4. Concentration in the original drink?', unit: 'mg/L', ans: 320, atol: 0.5 },
      { q: 'mg caffeine in 355 mL of a 96.0 mg/L cola.', unit: 'mg', ans: 96 * 0.355, tol: 0.003 }
    ],
    parts: [
      { title: 'Chromatograms', note: '<p>For each chromatogram, press <b>Record integration report</b> to save its retention times and peak areas.</p>', sim: S => ({ type: 'spectrum', title: 'HPLC chromatograms (UV 273 nm)', recordChrom: true, spectra: stds.map(c => ({ v: 'std' + c, l: `Caffeine standard ${c} mg/L`, kind: 'chrom', tmax: 9, peaks: [[S.rt + 0.01 * ((c * 7) % 3 - 1), S.k * c / 1000, 0.07]] })).concat([{ v: 'cola', l: 'Cola (undiluted)', kind: 'chrom', tmax: 9, peaks: [[2.62, 6, 0.06], [S.rt, S.k * S.cola / 1000, 0.07], [6.10, 120, 0.09], [7.45, 40, 0.1]] }, { v: 'en', l: 'Energy drink (diluted 1:4)', kind: 'chrom', tmax: 9, peaks: [[3.05, 30, 0.07], [S.rt, S.k * S.en / 4000, 0.07], [5.60, 15, 0.08]] }, { v: 'cof', l: 'Brewed coffee (diluted 1:10)', kind: 'chrom', tmax: 9, peaks: [[3.30, 55, 0.09], [S.rt, S.k * S.cof / 10000, 0.07], [6.80, 20, 0.12]] }]) }) },
      { title: 'Calibration', sim: { type: 'graph', k: 'caf', title: 'Peak area vs concentration', short: 'Calibration', xl: 'Caffeine (mg/L)', yl: 'Peak area', rows: 5, fill: (S, D) => stds.map(c => [c, D(`std${c}_area1`)]) } }
    ],
    questions: [
      { q: 'Retention time of caffeine.', unit: 'min', ans: S => S.rt, atol: 0.05 },
      { q: 'Slope of your calibration line.', unit: 'area per mg/L', ans: (S, D) => D('caf_slope'), tol: 0.01, truth: S => S.k, ttol: 0.03 },
      { q: 'Caffeine in the cola.', unit: 'mg/L', ans: (S, D) => (D('cola_area2') - D('caf_int')) / D('caf_slope'), tol: 0.015, truth: S => S.cola, ttol: 0.04, needs: 'cola integration report and calibration' },
      { q: 'mg of caffeine per 355-mL can of cola.', unit: 'mg', ans: (S, D) => (D('cola_area2') - D('caf_int')) / D('caf_slope') * 0.355, tol: 0.015 },
      { q: 'Caffeine in the original energy drink.', unit: 'mg/L', ans: (S, D) => (D('en_area2') - D('caf_int')) / D('caf_slope') * 4, tol: 0.015, truth: S => S.en, ttol: 0.04 },
      { q: 'mg of caffeine per 240-mL cup of coffee.', unit: 'mg', ans: (S, D) => (D('cof_area2') - D('caf_int')) / D('caf_slope') * 10 * 0.24, tol: 0.015, truth: S => S.cof * 0.24, ttol: 0.04 },
      { q: 'How do you know which peak in the cola chromatogram is caffeine?', choices: ['Its retention time matches the caffeine standards', 'It is always the largest peak', 'It elutes first', 'It is the last peak'], ans: 0 },
      { q: 'Why is an external-standard calibration acceptable here, and when would an internal standard be better?', text: true }
    ],
    key: S => [['Response factor', S.k + ' area/(mg/L)'], ['Cola / energy / coffee', `${S.cola} / ${S.en} / ${S.cof} mg/L`]]
  });
})();
