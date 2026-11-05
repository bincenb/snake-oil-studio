/* Physical Chemistry — virtual lab definitions */
(function () {
  'use strict';
  const C = CL.chem;
  CL.course({ id: 'pc', code: 'CHEM 341L', title: 'Physical Chemistry', short: 'P-Chem', color: '#0B5C8A', blurb: 'Thermochemistry, phase equilibria, quantum mechanics and electrochemical thermodynamics.' });

  // ------------------------------------------------------------------ 1
  CL.lab({
    id: 'pc-01', course: 'pc', n: 1, title: 'Bomb Calorimetry: Enthalpy of Combustion of Naphthalene', time: '3 h', skills: 'constant-volume calorimetry · ΔU vs ΔH',
    goals: ['Calibrate a bomb calorimeter with benzoic acid.', 'Measure the internal energy of combustion of naphthalene.', 'Convert ΔcU to ΔcH and compare with the literature.'],
    intro: `<p>In a bomb calorimeter, the sample burns at constant volume in excess O₂, so the heat measured is ΔU: q<sub>V</sub> = −C<sub>cal</sub>ΔT. Calibrate C<sub>cal</sub> with benzoic acid, ΔcU = −26.434 kJ/g. Correct ΔT for heat leak by extrapolating the pre- and post-firing drift lines to the time of firing.</p>
      <div class="eq">C_cal = 26.434 kJ/g × m_BA / ΔT &nbsp;&nbsp; ΔcU = −C_cal ΔT / n &nbsp;&nbsp; ΔcH = ΔcU + Δn_gas RT</div>
      <p>C₁₀H₈(s) + 12 O₂(g) → 10 CO₂(g) + 4 H₂O(l), so Δn<sub>gas</sub> = −2. Literature ΔcH(naphthalene) = −5156.3 kJ/mol. Fuse-wire and nitric-acid corrections are neglected in this exercise.</p>`,
    safety: ['Never fire a bomb that has not passed its leak test.', 'Pressurize to 25–30 atm O₂ only; stand behind the shield when firing.'],
    setup: R => ({ Cc: R.between(9.80, 10.60, 3), mBA: R.between(0.950, 1.050, 4), mN: R.between(0.550, 0.650, 4), T1: R.between(23.0, 25.0, 3), T2: R.between(23.0, 25.0, 3) }),
    prelab: [
      { q: '1.000 g benzoic acid raises the temperature 2.600 °C. Ccal?', unit: 'kJ/°C', ans: 26.434 / 2.6, tol: 0.003 },
      { q: 'Δn_gas RT term at 298 K for Δn = −2.', unit: 'kJ/mol', ans: -2 * 8.314 * 298.15 / 1000, tol: 0.005 }
    ],
    parts: [{
      title: 'Fire the bomb', steps: ['Press a pellet, weigh it, attach the fuse wire, seal and fill the bomb with O₂.', 'Start recording. Fire at t = 120 s and record until the drift is steady again.'],
      sim: [{ type: 'bench', title: 'Analytical balance', instrument: 'Balance (g)', actions: [{ l: 'Weigh benzoic acid pellet', key: 'mBA', label: 'Benzoic acid pellet', read: S => ({ v: S.mBA, u: 'g', dp: 4 }) }, { l: 'Weigh naphthalene pellet', key: 'mN', label: 'Naphthalene pellet', read: S => ({ v: S.mN, u: 'g', dp: 4 }) }] },
        { type: 'series', title: 'Bucket thermometer', x: { l: 'Time', u: 's', max: 600, dt: 5 }, y: { l: 'Temperature', u: '°C', dp: 3 }, noise: 0.002, controls: [{ k: 's', l: 'Sample', opts: [{ v: 'ba', l: 'Benzoic acid (calibration)' }, { v: 'nap', l: 'Naphthalene' }] }], run: (S, c) => { const q = c.s === 'ba' ? S.mBA * 26.434 : S.mN / 128.17 * 5151.3; const dT = q / S.Cc; const T0 = c.s === 'ba' ? S.T1 : S.T2; return { key: 'bomb_' + c.s, l: c.s === 'ba' ? 'Benzoic acid' : 'Naphthalene', short: c.s === 'ba' ? 'Benzoic acid' : 'Naphthalene', f: t => T0 + 0.0004 * t + (t < 120 ? 0 : dT * (1 - Math.exp(-(t - 120) / 35))) - (t < 120 ? 0 : 0.0007 * (t - 120)) }; } }]
    }],
    questions: [
      { q: 'Corrected ΔT for benzoic acid.', unit: '°C', ans: S => S.mBA * 26.434 / S.Cc, atol: 0.03 },
      { q: 'Heat capacity of the calorimeter.', unit: 'kJ/°C', ans: S => S.Cc, tol: 0.02 },
      { q: 'Corrected ΔT for naphthalene.', unit: '°C', ans: S => S.mN / 128.17 * 5151.3 / S.Cc, atol: 0.03 },
      { q: 'ΔcU of naphthalene.', unit: 'kJ/mol', ans: -5151.3, tol: 0.025 },
      { q: 'ΔcH of naphthalene.', unit: 'kJ/mol', ans: -5156.3, tol: 0.025 },
      { q: 'Why is a calibration run with a standard necessary?', text: true }
    ],
    key: S => [['Ccal', S.Cc + ' kJ/°C'], ['ΔT (BA / naph)', (S.mBA * 26.434 / S.Cc).toFixed(3) + ' / ' + (S.mN / 128.17 * 5151.3 / S.Cc).toFixed(3) + ' °C']]
  });

  // ------------------------------------------------------------------ 2
  const VPL = [{ n: 'Acetone', H: 31.3, Tb: 56.1 }, { n: 'Hexane', H: 31.6, Tb: 68.7 }, { n: 'Methanol', H: 37.6, Tb: 64.7 }, { n: 'Ethyl acetate', H: 35.0, Tb: 77.1 }, { n: 'Ethanol', H: 42.3, Tb: 78.3 }, { n: 'Water', H: 43.0, Tb: 100.0 }];
  const vp = (L, T) => 760 * Math.exp(-L.H * 1000 / 8.314 * (1 / (T + 273.15) - 1 / (L.Tb + 273.15)));
  CL.lab({
    id: 'pc-02', course: 'pc', n: 2, title: 'Vapor Pressure & Enthalpy of Vaporization', time: '3 h', skills: 'Clausius–Clapeyron · phase equilibria',
    goals: ['Measure the vapor pressure of a liquid at several temperatures.', 'Determine ΔHvap from a Clausius–Clapeyron plot.', 'Estimate the normal boiling point, test Trouton’s rule and identify the liquid.'],
    intro: `<div class="eq">ln P = −(ΔH_vap/R)(1/T) + C &nbsp;&nbsp;&nbsp; normal boiling point: P = 760 torr &nbsp;&nbsp; ΔS_vap = ΔH_vap / T_b</div>
      <p>A degassed sample in a sealed flask, held in a thermostatted bath and connected to a pressure transducer, reaches liquid–vapour equilibrium at each temperature. Trouton's rule says ΔS<sub>vap</sub> ≈ 85–88 J/(mol·K) for many non-associated liquids. Hydrogen-bonded liquids come out higher.</p>`,
    safety: ['Volatile organics are flammable; the apparatus must be leak-tight.'],
    setup: R => ({ L: R.pick(VPL) }),
    prelab: [
      { q: 'A Clausius–Clapeyron plot has slope −4500 K. ΔHvap?', unit: 'kJ/mol', ans: 4500 * 8.314 / 1000, tol: 0.005 },
      { q: 'Which liquid should have the largest ΔHvap?', choices: ['Hexane', 'Acetone', 'Water'], ans: 2 }
    ],
    parts: [{ title: 'Vapor pressure measurements', sim: [{ type: 'bench', title: 'Isoteniscope & pressure transducer', instrument: 'Vapour pressure (torr)', icon: 'meter', controls: [{ k: 'T', l: 'Bath temperature', type: 'range', min: 10, max: 50, step: 5, val: 25, u: '°C', auto: [10, 20, 30, 40, 50] }], actions: [{ l: 'Equilibrate & read', key: c => 'vp_' + c.T, label: c => `Vapour pressure at ${c.T}.0 °C`, read: (S, c) => ({ v: CL.meas(vp(S.L, c.T), vp(S.L, c.T) * 0.003, 1), u: 'torr', dp: 1 }) }] }, { type: 'graph', k: 'cc', title: 'Clausius–Clapeyron plot', short: 'ln P vs 1/T', xl: '1/T (K⁻¹)', yl: 'ln(P/torr)', rows: 5, fill: (S, D) => [10, 15, 20, 25, 30, 35, 40, 45, 50].filter(T => D.has('vp_' + T)).map(T => [1 / (T + 273.15), Math.log(D('vp_' + T))]) }] }],
    questions: [
      { q: 'ΔHvap from your plot.', unit: 'kJ/mol', ans: (S, D) => -D('cc_slope') * 8.314 / 1000, tol: 0.01, truth: S => S.L.H, ttol: 0.05 },
      { q: 'Normal boiling point from your plot.', unit: '°C', ans: (S, D) => 1 / ((Math.log(760) - D('cc_int')) / D('cc_slope')) - 273.15, atol: 0.5, truth: S => S.L.Tb, tatol: 4 },
      { q: 'ΔSvap at the normal boiling point.', unit: 'J/(mol·K)', ans: (S, D) => -D('cc_slope') * 8.314 / (1 / ((Math.log(760) - D('cc_int')) / D('cc_slope'))), tol: 0.015 },
      { q: 'Identity of the liquid.', choices: VPL.map(l => l.n), ans: S => VPL.indexOf(S.L) },
      { q: 'Does your liquid obey Trouton’s rule? Explain any deviation in terms of intermolecular forces.', text: true }
    ],
    key: S => [['Liquid', `${S.L.n} (ΔHvap ${S.L.H} kJ/mol, bp ${S.L.Tb} °C)`]]
  });

  // ------------------------------------------------------------------ 3
  const h = 6.62607e-34, me = 9.10938e-31, c0 = 2.99792e8;
  const DYES = [{ n: '1,1′-diethyl-2,2′-cyanine iodide', N: 6, l: 523 }, { n: '1,1′-diethyl-2,2′-carbocyanine iodide', N: 8, l: 605 }, { n: '1,1′-diethyl-2,2′-dicarbocyanine iodide', N: 10, l: 707 }];
  const Lbox = (lam, N) => Math.sqrt(h * lam * 1e-9 * (N + 1) / (8 * me * c0)) * 1e10;
  CL.lab({
    id: 'pc-03', course: 'pc', n: 3, title: 'Particle in a Box: Spectra of Conjugated Cyanine Dyes', time: '2.5 h', skills: 'quantum model · UV–vis spectroscopy',
    goals: ['Record the visible spectra of three cyanine dyes.', 'Model their π electrons as particles in a one-dimensional box.', 'Calculate box lengths and relate them to conjugation length.'],
    intro: `<p>In cyanine dyes the N π electrons are delocalized along the conjugated chain between the two nitrogens. Treat them as particles in a box of length L, with energies E<sub>n</sub> = n²h²/(8mL²). Two electrons fill each level up to n = N/2. The lowest-energy absorption promotes one electron from n = N/2 to n = N/2 + 1:</p>
      <div class="eq">ΔE = (N + 1) h² / (8 m L²) = hc/λ &nbsp;&nbsp;⇒&nbsp;&nbsp; L = √[h λ (N + 1) / (8 m c)]</div>
      <p>N = 6, 8 and 10 for the cyanine, carbocyanine and dicarbocyanine. Constants: h = 6.626 × 10⁻³⁴ J·s, m = 9.109 × 10⁻³¹ kg, c = 2.998 × 10⁸ m/s.</p>`,
    safety: ['Cyanine dyes are toxic and stain; methanol is flammable.'],
    setup: R => ({ d: DYES.map(d => d.l + R.between(-3, 3, 0)) }),
    prelab: [
      { q: 'Energy of a 600-nm photon.', unit: 'J', ans: h * c0 / 600e-9, tol: 0.005 },
      { q: 'For N = 8 π electrons, the HOMO has quantum number n =', ans: 4, int: true }
    ],
    parts: [{ title: 'Absorption spectra', steps: ['Prepare ~5 µM solutions in methanol.', 'Blank with methanol and scan each dye from 400 to 800 nm. Read λmax.'], sim: S => ({ type: 'spectro', title: 'UV–vis spectrophotometer', l0: 550, range: [400, 800], samples: [{ v: 'blank', l: 'Methanol blank', blank: true }].concat(DYES.map((d, i) => ({ v: 'dye' + (i + 1), l: d.n, A: C.bands([[S.d[i], 0.62, 18], [S.d[i] - 38, 0.22, 22]]) }))) }) }],
    questions: [
      { q: 'λmax of the cyanine (N = 6).', unit: 'nm', ans: S => S.d[0], atol: 3 },
      { q: 'λmax of the carbocyanine (N = 8).', unit: 'nm', ans: S => S.d[1], atol: 3 },
      { q: 'λmax of the dicarbocyanine (N = 10).', unit: 'nm', ans: S => S.d[2], atol: 3 },
      { q: 'ΔE of the HOMO→LUMO transition for the cyanine.', unit: 'J', ans: S => h * c0 / (S.d[0] * 1e-9), tol: 0.008 },
      { q: 'Box length L for the cyanine.', unit: 'Å', ans: S => Lbox(S.d[0], 6), tol: 0.008 },
      { q: 'Box length L for the dicarbocyanine.', unit: 'Å', ans: S => Lbox(S.d[2], 10), tol: 0.008 },
      { q: 'Each added –CH=CH– unit lengthens the box by about…', unit: 'Å', ans: S => (Lbox(S.d[2], 10) - Lbox(S.d[0], 6)) / 2, tol: 0.05 },
      { q: 'Why does λmax shift to longer wavelength as the chain gets longer?', choices: ['A longer box gives more closely spaced energy levels', 'More electrons repel more', 'The molecule is heavier', 'The solvent changes'], ans: 0 },
      { q: 'Compare your L values with the length of the conjugated path estimated from bond lengths (1.39 Å per bond). What does the comparison say about the model?', text: true }
    ],
    key: S => [['λmax', S.d.join(', ') + ' nm'], ['L (Å)', S.d.map((l, i) => Lbox(l, DYES[i].N).toFixed(2)).join(', ')]]
  });

  // ------------------------------------------------------------------ 4
  CL.lab({
    id: 'pc-04', course: 'pc', n: 4, title: 'Thermodynamics of a Galvanic Cell from E vs T', time: '2.5 h', skills: 'electrochemical thermodynamics · temperature coefficient',
    goals: ['Measure the emf of a Pb | PbCl₂ | KCl | AgCl | Ag cell at several temperatures.', 'Determine the temperature coefficient (∂E/∂T).', 'Calculate ΔG°, ΔS° and ΔH° for the cell reaction.'],
    intro: `<div class="eq">Pb(s) + 2 AgCl(s) → PbCl₂(s) + 2 Ag(s) &nbsp;&nbsp; n = 2</div>
      <p>Every species is a pure solid in a saturated KCl electrolyte, so the measured emf equals E°. Thermodynamics links the emf to the state functions:</p>
      <div class="eq">ΔG = −nFE &nbsp;&nbsp; ΔS = nF(∂E/∂T)_P &nbsp;&nbsp; ΔH = ΔG + TΔS = −nF[E − T(∂E/∂T)]</div>`,
    safety: ['Lead compounds are toxic — gloves; collect waste.', 'Use a high-impedance voltmeter so negligible current flows.'],
    setup: R => ({ E0: R.between(0.4880, 0.4920, 4), dEdT: R.between(-1.95e-4, -1.75e-4) }),
    prelab: [
      { q: 'ΔG for n = 2, E = 0.490 V.', unit: 'kJ/mol', ans: -2 * 96485 * 0.49 / 1000, tol: 0.003 },
      { q: 'If ∂E/∂T is negative, ΔS of the cell reaction is…', choices: ['positive', 'negative', 'zero'], ans: 1 }
    ],
    parts: [{ title: 'Emf vs temperature', sim: [{ type: 'bench', title: 'Thermostatted cell & voltmeter', instrument: 'Emf (V)', icon: 'meter', controls: [{ k: 'T', l: 'Bath temperature', type: 'range', min: 10, max: 50, step: 5, val: 25, u: '°C', auto: [10, 15, 20, 25, 30, 35, 40, 45, 50] }], actions: [{ l: 'Equilibrate & read emf', key: c => 'Ec_' + c.T, label: c => `Emf at ${c.T}.0 °C`, read: (S, c) => ({ v: CL.meas(S.E0 + S.dEdT * (c.T - 25), 0.00008, 4), u: 'V', dp: 4 }) }] }, { type: 'graph', k: 'et', title: 'E vs T', short: 'E vs T', xl: 'T (K)', yl: 'E (V)', rows: 9, fill: (S, D) => [10, 15, 20, 25, 30, 35, 40, 45, 50].map(T => [T + 273.15, D('Ec_' + T)]) }] }],
    questions: [
      { q: 'Temperature coefficient ∂E/∂T from your plot.', unit: 'V/K', ans: (S, D) => D('et_slope'), tol: 0.01, truth: S => S.dEdT, ttol: 0.1 },
      { q: 'E at 298.15 K from your fit.', unit: 'V', ans: (S, D) => D('et_slope') * 298.15 + D('et_int'), atol: 0.0003, truth: S => S.E0, tatol: 0.001 },
      { q: 'ΔG° at 298 K.', unit: 'kJ/mol', ans: (S, D) => -2 * 96485 * (D('et_slope') * 298.15 + D('et_int')) / 1000, tol: 0.003 },
      { q: 'ΔS°.', unit: 'J/(mol·K)', ans: (S, D) => 2 * 96485 * D('et_slope'), tol: 0.01 },
      { q: 'ΔH° at 298 K.', unit: 'kJ/mol', ans: (S, D) => (-2 * 96485 * (D('et_slope') * 298.15 + D('et_int')) + 298.15 * 2 * 96485 * D('et_slope')) / 1000, tol: 0.005 },
      { q: 'Why must almost no current flow while the emf is measured?', text: true }
    ],
    key: S => [['E°(25 °C)', S.E0 + ' V'], ['∂E/∂T', S.dEdT.toExponential(3) + ' V/K'], ['ΔS°', (2 * 96485 * S.dEdT).toFixed(1) + ' J/mol·K']]
  });
})();
