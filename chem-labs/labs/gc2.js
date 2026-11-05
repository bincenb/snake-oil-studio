/* General Chemistry II — virtual lab definitions */
(function () {
  'use strict';
  const C = CL.chem;
  CL.course({ id: 'gc2', code: 'CHEM 102L', title: 'General Chemistry II', short: 'Gen Chem II', color: '#0E7C86', blurb: 'Solutions, kinetics, equilibrium, acids & bases, solubility, thermodynamics and electrochemistry.' });
  const mean = a => (a.length && a.every(isFinite) ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
  const vol = (D, k) => D(k + '_Vf') - D(k + '_Vi');
  const needPrev = (D, k, what) => (D.has(k) ? null : { err: `Do this first: ${what}.` });
  const T2K = t => t + 273.15;

  // ------------------------------------------------------------------ 1
  const SOLUTES = [{ n: 'Benzoic acid', M: 122.12 }, { n: '1,4-Dichlorobenzene', M: 147.00 }, { n: 'Biphenyl', M: 154.21 }, { n: 'Anthracene', M: 178.23 }, { n: 'Triphenylmethane', M: 244.33 }];
  function coolCurve(o) {
    const { T0, Tb, k, Tf, slope, plat, sc } = o;
    const t1 = -Math.log((Tf - Tb) / (T0 - Tb)) / k;
    return t => {
      if (t < t1) return Tb + (T0 - Tb) * Math.exp(-k * t);
      const u = t - t1;
      if (u < plat) return Tf - slope * u - sc * Math.exp(-u / 9) * (1 - Math.exp(-u / 2.5));
      const Te = Tf - slope * plat;
      return Tb + (Te - Tb) * Math.exp(-k * 1.4 * (u - plat));
    };
  }
  CL.lab({
    id: 'gc2-01', course: 'gc2', n: 1, title: 'Molar Mass by Freezing-Point Depression', time: '2.5 h', skills: 'cooling curves · colligative properties',
    goals: ['Record cooling curves for a pure solvent and a solution.', 'Determine the freezing-point depression and molality of the solution.', 'Calculate the molar mass of an unknown solute and identify it.'],
    intro: `<p>A <b>colligative property</b> depends on the number of solute particles, not on what they are. Dissolving a non-volatile solute lowers the freezing point of a solvent:</p>
      <div class="eq">ΔT_f = T_f(pure) − T_f(solution) = K_f · m &nbsp;&nbsp;&nbsp; m = mol solute / kg solvent</div>
      <p>The solvent is lauric acid (C₁₂H₂₄O₂), which freezes near 44 °C and has K<sub>f</sub> = 3.9 °C·kg/mol. When the cooling curve levels off as crystals form, that plateau is the freezing point. A solution's plateau slopes downward, because the remaining liquid gets more concentrated as solvent freezes out. Use the temperature where freezing <i>begins</i>. Ignore the brief dip from supercooling.</p>
      <div class="eq">molar mass = g solute / (m × kg solvent)</div>`,
    safety: ['Hot water baths and molten lauric acid cause burns.', 'Do not pull the thermometer out of solidified lauric acid — remelt it first.'],
    setup: R => ({ sol: R.pick(SOLUTES), tt: R.between(24, 27, 3), mla: R.between(7.80, 8.20, 3), msol: R.between(0.90, 1.10, 3), Tf: R.between(43.6, 44.0, 2), Kf: 3.9 }),
    prelab: [
      { q: '1.00 g of solute in 8.00 g of solvent lowers the freezing point by 3.20 °C (Kf = 3.9). Molality?', unit: 'mol/kg', ans: 3.2 / 3.9, tol: 0.01 },
      { q: 'Using that molality, what is the molar mass of the solute?', unit: 'g/mol', ans: 1.0 / (3.2 / 3.9 * 0.008), tol: 0.01 },
      { q: 'If some solute did not dissolve, your molar mass would be…', choices: ['too high', 'too low', 'unaffected'], ans: 0, why: 'Fewer dissolved particles → smaller ΔTf → smaller molality → larger calculated molar mass.' }
    ],
    parts: [
      {
        title: 'Weigh solvent and solute', steps: ['Weigh a clean, dry test tube. Add ~8 g of lauric acid and weigh again.', 'After the pure-solvent run, add ~1 g of the unknown, weigh again, melt and stir until it dissolves.'],
        sim: {
          type: 'bench', title: 'Balance', instrument: 'Balance (g)', actions: [
            { l: 'Weigh empty test tube', key: 'tt', label: 'Empty test tube', read: S => ({ v: CL.meas(S.tt, 0.0005, 3), u: 'g', dp: 3 }) },
            { l: 'Add lauric acid & weigh', key: 'tla', label: 'Tube + lauric acid', read: (S, c, ctx) => needPrev(ctx.D, 'tt', 'weigh the empty tube') || ({ v: CL.round(ctx.D('tt') + S.mla, 3), u: 'g', dp: 3 }) },
            { l: 'Add unknown & weigh', key: 'tsol', label: 'Tube + lauric acid + unknown', read: (S, c, ctx) => needPrev(ctx.D, 'tla', 'weigh the lauric acid') || ({ v: CL.round(ctx.D('tla') + S.msol, 3), u: 'g', dp: 3 }) }
          ]
        }
      },
      {
        title: 'Cooling curves', steps: ['Melt the sample in a 65 °C water bath, then move it to a room-temperature bath and record temperature every 3 s while stirring.', 'Run the pure solvent first, then the solution.'],
        sim: {
          type: 'series', title: 'Temperature probe', x: { l: 'Time', u: 's', max: 600, dt: 3 }, y: { l: 'Temperature', u: '°C', dp: 2, min: 20, max: 66 }, noise: 0.02,
          controls: [{ k: 's', l: 'Sample', opts: [{ v: 'pure', l: 'Pure lauric acid' }, { v: 'soln', l: 'Lauric acid + unknown' }] }],
          run: (S, c, ctx) => {
            if (c.s === 'soln' && !ctx.D.has('tsol')) return { err: 'Add and weigh the unknown first.' };
            const dT = S.Kf * (S.msol / S.sol.M) / (S.mla / 1000);
            const f = coolCurve({ T0: 65, Tb: 21, k: 0.012, Tf: c.s === 'pure' ? S.Tf : S.Tf - dT, slope: c.s === 'pure' ? 0.0004 : 0.0045, plat: c.s === 'pure' ? 230 : 190, sc: c.s === 'pure' ? 0.5 : 0.7 });
            return { key: 'fp_' + c.s, l: c.s === 'pure' ? 'Cooling curve: pure lauric acid' : 'Cooling curve: solution', short: c.s === 'pure' ? 'Pure solvent' : 'Solution', f };
          }
        }
      }
    ],
    questions: [
      { q: 'Freezing point of pure lauric acid (from your cooling curve).', unit: '°C', ans: S => S.Tf, atol: 0.25 },
      { q: 'Freezing point of the solution.', unit: '°C', ans: S => S.Tf - S.Kf * (S.msol / S.sol.M) / (S.mla / 1000), atol: 0.3 },
      { q: 'ΔTf.', unit: '°C', ans: S => S.Kf * (S.msol / S.sol.M) / (S.mla / 1000), atol: 0.3 },
      { q: 'Molality of the solution.', unit: 'mol/kg', ans: S => (S.msol / S.sol.M) / (S.mla / 1000), tol: 0.08 },
      { q: 'Moles of unknown solute.', unit: 'mol', ans: (S, D) => (S.msol / S.sol.M) / (S.mla / 1000) * ((D('tla') - D('tt')) / 1000), tol: 0.08, needs: 'masses' },
      { q: 'Molar mass of the unknown.', unit: 'g/mol', ans: S => S.sol.M, tol: 0.08 },
      { q: 'Identity of the unknown.', choices: SOLUTES.map(s => `${s.n} (${s.M} g/mol)`), ans: S => SOLUTES.indexOf(S.sol) },
      { q: 'Why does the solution’s freezing plateau slope downward while the pure solvent’s is flat?', text: true }
    ],
    key: S => { const dT = S.Kf * (S.msol / S.sol.M) / (S.mla / 1000); return [['Unknown', `${S.sol.n} (${S.sol.M})`], ['Masses', `lauric acid ${S.mla} g, solute ${S.msol} g`], ['Tf pure / soln', `${S.Tf.toFixed(2)} / ${(S.Tf - dT).toFixed(2)} °C`], ['ΔTf', dT.toFixed(2) + ' °C']]; }
  });

  // ------------------------------------------------------------------ 2
  CL.lab({
    id: 'gc2-02', course: 'gc2', n: 2, title: 'Chemical Kinetics I: Rate Law of Crystal Violet Fading', time: '2.5 h', skills: 'spectrophotometric kinetics · integrated rate laws',
    goals: ['Follow a reaction by monitoring absorbance over time.', 'Use integrated rate-law graphs to find the order with respect to crystal violet.', 'Determine the order in hydroxide and the rate constant k.'],
    intro: `<p>Crystal violet (CV⁺, purple, λ<sub>max</sub> = 590 nm) reacts with hydroxide to form a colourless product:</p>
      <div class="eq">CV⁺(aq) + OH⁻(aq) → CVOH(aq) &nbsp;&nbsp;&nbsp; rate = k [CV⁺]ᵐ [OH⁻]ⁿ</div>
      <p>OH⁻ is present in large excess, so its concentration stays essentially constant. The rate law reduces to a <b>pseudo-rate law</b>, rate = k′[CV⁺]ᵐ, where k′ = k[OH⁻]ⁿ. Absorbance is proportional to [CV⁺] (Beer's law), so you can follow absorbance instead of concentration.</p>
      <table><tr><th>Order m</th><th>Linear plot</th><th>Slope</th></tr><tr><td>0</td><td>A vs t</td><td>−k′·εb</td></tr><tr><td>1</td><td>ln A vs t</td><td>−k′</td></tr><tr><td>2</td><td>1/A vs t</td><td>k′/εb</td></tr></table>
      <p>Repeating the run with twice the [OH⁻] shows how k′ depends on [OH⁻], which gives n. Then k = k′/[OH⁻]ⁿ.</p>`,
    safety: ['Crystal violet stains skin and clothing; wear gloves.', '0.10 M NaOH is an eye hazard.'],
    setup: R => ({ k: R.between(0.16, 0.24, 4), A0: R.between(0.62, 0.78, 3) }),
    prelab: [
      { q: 'For a first-order reaction with k = 0.0040 s⁻¹, what is the half-life?', unit: 's', ans: Math.log(2) / 0.004, tol: 0.01 },
      { q: 'A plot of ln A vs t is linear. The reaction is ___ order in the absorbing species.', choices: ['zero', 'first', 'second'], ans: 1 },
      { q: 'Doubling [OH⁻] doubles k′. The order in OH⁻ is…', ans: 1, int: true }
    ],
    parts: [
      {
        title: 'Collect absorbance–time data', steps: ['Set the colorimeter to 590 nm and zero it with distilled water.', 'Mix 10.0 mL of 2.0 × 10⁻⁵ M CV with 10.0 mL of NaOH to give the [OH⁻] chosen below. Quickly fill a cuvette and start collecting.', 'Run once with [OH⁻] = 0.020 M and once with 0.040 M.'],
        sim: {
          type: 'series', title: 'Colorimeter at 590 nm', x: { l: 'Time', u: 's', max: 600, dt: 10 }, y: { l: 'Absorbance', u: '', dp: 3, min: 0, max: 0.85 }, noise: 0.0015,
          controls: [{ k: 'oh', l: '[OH⁻] after mixing', opts: [{ v: 20, l: '0.020 M' }, { v: 40, l: '0.040 M' }] }],
          run: (S, c) => { const kp = S.k * c.oh / 1000; return { key: 'cv_' + c.oh, l: `Crystal violet, [OH⁻] = 0.0${c.oh / 10} M`, short: `[OH⁻] = 0.0${c.oh / 10} M`, xmax: c.oh === 40 ? 300 : 600, f: t => S.A0 * Math.exp(-kp * t) }; }
        }
      },
      {
        title: 'Graphical analysis', note: '<p>For each run, try A, ln A and 1/A on the y-axis. Pick the transformation that gives a straight line (R² closest to 1), then record that best-fit line.</p>',
        sim: [
          { type: 'graph', k: 'cv1', title: 'Run 1: [OH⁻] = 0.020 M', short: 'Run 1', xl: 't (s)', yl: 'A', ty: ['y', 'ln y', '1/y'], autoTy: 'ln y', rows: 20, fill: (S, D) => { const s = D.series('cv_20'); return s ? s.pts.filter((p, i) => i % 3 === 0).map(p => [p[0], p[1]]) : []; } },
          { type: 'graph', k: 'cv2', title: 'Run 2: [OH⁻] = 0.040 M', short: 'Run 2', xl: 't (s)', yl: 'A', ty: ['y', 'ln y', '1/y'], autoTy: 'ln y', rows: 20, fill: (S, D) => { const s = D.series('cv_40'); return s ? s.pts.filter((p, i) => i % 3 === 0).map(p => [p[0], p[1]]) : []; } }
        ]
      }
    ],
    questions: [
      { q: 'Which plot is linear?', choices: ['A vs t (zero order)', 'ln A vs t (first order)', '1/A vs t (second order)'], ans: 1 },
      { q: 'Order of the reaction in crystal violet, m.', ans: 1, int: true },
      { q: 'Pseudo-rate constant k′ for run 1 (0.020 M OH⁻).', unit: 's⁻¹', ans: (S, D) => -D('cv1_slope'), tol: 0.01, truth: S => S.k * 0.02, ttol: 0.05, needs: 'run-1 best-fit line' },
      { q: 'Pseudo-rate constant k′ for run 2 (0.040 M OH⁻).', unit: 's⁻¹', ans: (S, D) => -D('cv2_slope'), tol: 0.01, truth: S => S.k * 0.04, ttol: 0.05, needs: 'run-2 best-fit line' },
      { q: 'Order in hydroxide, n (from k′₂/k′₁).', ans: 1, int: true },
      { q: 'Rate constant k (use run 1).', unit: 'M⁻¹s⁻¹', ans: (S, D) => -D('cv1_slope') / 0.02, tol: 0.01, truth: S => S.k, ttol: 0.05 },
      { q: 'Half-life of CV in run 1.', unit: 's', ans: (S, D) => Math.log(2) / -D('cv1_slope'), tol: 0.01 },
      { q: 'Write the full rate law and explain why the excess OH⁻ makes the reaction "pseudo-first-order".', text: true }
    ],
    key: S => [['k', S.k + ' M⁻¹s⁻¹'], ["k′ (0.020 / 0.040 M)", (S.k * 0.02).toExponential(3) + ' / ' + (S.k * 0.04).toExponential(3) + ' s⁻¹'], ['A₀', S.A0]]
  });

  // ------------------------------------------------------------------ 3
  const CLOCK = { 1: [0.0400, 0.0200], 2: [0.0800, 0.0200], 3: [0.0400, 0.0400] };
  CL.lab({
    id: 'gc2-03', course: 'gc2', n: 3, title: 'Chemical Kinetics II: Iodine Clock Reaction & Activation Energy', time: '3 h', skills: 'method of initial rates · Arrhenius plot',
    goals: ['Use the method of initial rates to find reaction orders.', 'Determine the rate constant at room temperature.', 'Measure k at several temperatures and find the activation energy from an Arrhenius plot.'],
    intro: `<p>Persulfate oxidizes iodide: S₂O₈²⁻ + 2 I⁻ → 2 SO₄²⁻ + I₂. A small, fixed amount of thiosulfate instantly turns each I₂ back into I⁻ (I₂ + 2 S₂O₃²⁻ → 2 I⁻ + S₄O₆²⁻). Once the thiosulfate is used up, I₂ builds up and turns the starch indicator blue-black. That moment is the "clock".</p>
      <p>All runs have the same total volume, 50.0 mL, with [S₂O₃²⁻]₀ = 1.00 × 10⁻³ M. So at the colour change, Δ[S₂O₈²⁻] = ½(1.00 × 10⁻³ M), and</p>
      <div class="eq">rate = 5.00 × 10⁻⁴ M / t &nbsp;&nbsp;&nbsp; rate = k [I⁻]ˣ [S₂O₈²⁻]ʸ</div>
      <table><tr><th>Run</th><th>0.200 M KI</th><th>0.100 M (NH₄)₂S₂O₈</th><th>[I⁻]₀</th><th>[S₂O₈²⁻]₀</th></tr><tr><td>1</td><td>10.0 mL</td><td>10.0 mL</td><td>0.0400 M</td><td>0.0200 M</td></tr><tr><td>2</td><td>20.0 mL</td><td>10.0 mL</td><td>0.0800 M</td><td>0.0200 M</td></tr><tr><td>3</td><td>10.0 mL</td><td>20.0 mL</td><td>0.0400 M</td><td>0.0400 M</td></tr></table>
      <div class="eq">Arrhenius: ln k = −(Eₐ/R)(1/T) + ln A &nbsp;&nbsp; slope = −Eₐ/R, R = 8.314 J/(mol·K)</div>`,
    safety: ['Ammonium persulfate is a strong oxidizer — keep it away from organics and skin.', 'Ice and hot-water baths: avoid glass thermal shock.'],
    setup: R => ({ k25: R.between(0.0100, 0.0130, 5), Ea: R.between(48, 56, 1) * 1000, Tr: R.between(21.5, 24.0, 1) }),
    prelab: [
      { q: 'The clock time is 54 s. What is the rate (M/s)?', unit: 'M/s', ans: 5e-4 / 54, tol: 0.01 },
      { q: 'Doubling [I⁻] halves the clock time. The order in I⁻ is…', ans: 1, int: true },
      { q: 'An Arrhenius plot has slope −6250 K. What is Ea?', unit: 'kJ/mol', ans: 6250 * 8.314 / 1000, tol: 0.01 }
    ],
    parts: [
      {
        title: 'Clock runs', steps: ['Mix KI, thiosulfate, starch and water in one flask and the persulfate in another. Bring both to the bath temperature.', 'Pour them together and start the timer. Stop it at the first blue-black colour.', 'Do runs 1–3 at room temperature, then repeat run 1 at about 5, 15 and 35 °C.'],
        sim: {
          type: 'bench', title: 'Clock reaction station', instrument: 'Timer (s)', icon: 'tube',
          controls: [{ k: 'r', l: 'Mixture', opts: [{ v: 1, l: 'Run 1' }, { v: 2, l: 'Run 2' }, { v: 3, l: 'Run 3' }] }, { k: 'T', l: 'Bath', opts: [{ v: 'room', l: 'Room temperature' }, { v: 5, l: 'Ice bath (5.0 °C)' }, { v: 15, l: 'Cool bath (15.0 °C)' }, { v: 35, l: 'Warm bath (35.0 °C)' }] }],
          actions: [
            { l: 'Read room thermometer', key: 'Troom', label: 'Room temperature', read: S => ({ v: CL.meas(S.Tr, 0.05, 1), u: '°C', dp: 1 }) },
            { l: 'Mix & time until blue', key: c => `t_${c.r}_${c.T}`, label: c => `Clock time, run ${c.r} at ${c.T === 'room' ? 'room T' : c.T + '.0 °C'}`, read: (S, c) => { const T = c.T === 'room' ? S.Tr : c.T; const k = S.k25 * Math.exp(-S.Ea / 8.314 * (1 / T2K(T) - 1 / 298.15)); const [I, P] = CLOCK[c.r]; return { v: CL.round(5e-4 / (k * I * P) * (1 + 0.012 * CL.gauss()), 1), u: 's', dp: 1, color: 'rgba(30,30,70,.85)' }; } }
          ]
        }
      },
      {
        title: 'Arrhenius plot', note: '<p>For run 1 at each temperature, k = rate / ([I⁻][S₂O₈²⁻]) = rate / 8.00 × 10⁻⁴. Plot ln k against 1/T (in K).</p>',
        sim: { type: 'graph', k: 'arr', title: 'Arrhenius plot', short: 'Arrhenius', xl: '1/T (K⁻¹)', yl: 'ln k', rows: 4, fill: (S, D) => [[5, 't_1_5'], [15, 't_1_15'], ['room', 't_1_room'], [35, 't_1_35']].map(([T, k]) => [1 / T2K(T === 'room' ? D('Troom') : T), Math.log(5e-4 / D(k) / 8e-4)]) }
      }
    ],
    questions: [
      { q: 'Rate of run 1 at room temperature.', unit: 'M/s', ans: (S, D) => 5e-4 / D('t_1_room'), tol: 0.01 },
      { q: 'Rate of run 2.', unit: 'M/s', ans: (S, D) => 5e-4 / D('t_2_room'), tol: 0.01 },
      { q: 'Rate of run 3.', unit: 'M/s', ans: (S, D) => 5e-4 / D('t_3_room'), tol: 0.01 },
      { q: 'Order in I⁻ (x), rounded to a whole number.', ans: 1, int: true },
      { q: 'Order in S₂O₈²⁻ (y), rounded to a whole number.', ans: 1, int: true },
      { q: 'Rate constant k at room temperature (from run 1).', unit: 'M⁻¹s⁻¹', ans: (S, D) => 5e-4 / D('t_1_room') / 8e-4, tol: 0.01, truth: S => S.k25 * Math.exp(-S.Ea / 8.314 * (1 / T2K(S.Tr) - 1 / 298.15)), ttol: 0.05 },
      { q: 'Activation energy from your Arrhenius plot.', unit: 'kJ/mol', ans: (S, D) => -D('arr_slope') * 8.314 / 1000, tol: 0.01, truth: S => S.Ea / 1000, ttol: 0.1, needs: 'Arrhenius best-fit line' },
      { q: 'Using collision theory, explain why the clock time is so sensitive to temperature.', text: true }
    ],
    key: S => [['k at 25 °C', S.k25 + ' M⁻¹s⁻¹'], ['Ea', S.Ea / 1000 + ' kJ/mol'], ['Room T', S.Tr + ' °C'], ['Ideal t (run 1, room)', (5e-4 / (S.k25 * Math.exp(-S.Ea / 8.314 * (1 / T2K(S.Tr) - 1 / 298.15)) * 8e-4)).toFixed(1) + ' s']]
  });

  // ------------------------------------------------------------------ 4
  const LC = {
    'co:base': ['Co²⁺/CoCl₄²⁻ (start)', 'Violet — a mixture of pink and blue species', 'rgba(150,80,170,.65)'],
    'co:hcl': ['Co: add 12 M HCl', 'Turns deep blue', 'rgba(40,70,200,.75)'],
    'co:water': ['Co: add water', 'Turns pink', 'rgba(235,120,160,.6)'],
    'co:heat': ['Co: hot water bath', 'Turns blue', 'rgba(60,80,210,.7)'],
    'co:ice': ['Co: ice bath', 'Turns pink', 'rgba(235,120,170,.6)'],
    'co:ag': ['Co: add AgNO₃', 'Turns pink; white precipitate forms', 'rgba(235,130,170,.55)', '#eeeeee'],
    'fe:base': ['Fe³⁺/SCN⁻ (start)', 'Orange-red', 'rgba(200,80,40,.55)'],
    'fe:fe': ['Fe: add Fe(NO₃)₃', 'Becomes darker blood-red', 'rgba(150,20,20,.8)'],
    'fe:scn': ['Fe: add KSCN', 'Becomes darker blood-red', 'rgba(150,20,25,.8)'],
    'fe:hpo': ['Fe: add Na₂HPO₄', 'Fades to pale yellow', 'rgba(235,215,120,.45)'],
    'fe:heat': ['Fe: hot water bath', 'Colour becomes lighter (more orange-yellow)', 'rgba(225,140,60,.45)'],
    'cr:base': ['CrO₄²⁻/Cr₂O₇²⁻ (start)', 'Yellow', 'rgba(240,210,40,.65)'],
    'cr:hcl': ['Cr: add 1 M HCl', 'Turns orange', 'rgba(240,120,20,.75)'],
    'cr:naoh': ['Cr: add 1 M NaOH (after acid)', 'Turns back to yellow', 'rgba(240,210,40,.65)'],
    'cr:ba': ['Cr: add BaCl₂', 'Yellow precipitate (BaCrO₄); solution paler', 'rgba(245,225,120,.4)', '#f0d24a'],
    'nh:base': ['NH₃ + phenolphthalein (start)', 'Pink', 'rgba(226,40,140,.55)'],
    'nh:nh4': ['NH₃: add solid NH₄Cl', 'Pink fades noticeably', 'rgba(226,90,160,.25)'],
    'nh:hcl': ['NH₃: add 1 M HCl dropwise', 'Becomes colourless', 'rgba(220,230,240,.25)']
  };
  const DIR = ['Shifts right (toward products)', 'Shifts left (toward reactants)', 'No shift'];
  CL.lab({
    id: 'gc2-04', course: 'gc2', n: 4, title: "Chemical Equilibrium: Le Châtelier's Principle", time: '2 h', skills: 'qualitative equilibrium · stresses',
    goals: ['Apply concentration and temperature stresses to four equilibrium systems.', 'Explain each observation using Le Châtelier’s principle.', 'Deduce the sign of ΔH from temperature effects.'],
    intro: `<p><b>Le Châtelier's principle:</b> when a system at equilibrium is disturbed, it shifts in the direction that partly counteracts the disturbance. Adding a species shifts the equilibrium away from it, and removing a species shifts it toward that species. Heating favours the endothermic direction.</p>
      <div class="eq">(1) Co(H₂O)₆²⁺ (pink) + 4 Cl⁻ ⇌ CoCl₄²⁻ (blue) + 6 H₂O<br>(2) Fe³⁺ (pale yellow) + SCN⁻ ⇌ FeSCN²⁺ (blood red)<br>(3) 2 CrO₄²⁻ (yellow) + 2 H⁺ ⇌ Cr₂O₇²⁻ (orange) + H₂O<br>(4) NH₃ + H₂O ⇌ NH₄⁺ + OH⁻ (phenolphthalein shows OH⁻ as pink)</div>
      <p>Some reagents remove a species: Ag⁺ precipitates Cl⁻ as AgCl, HPO₄²⁻ binds Fe³⁺, Ba²⁺ precipitates CrO₄²⁻, and H⁺ neutralizes OH⁻.</p>`,
    safety: ['12 M HCl is highly corrosive and releases fumes — dispense in the hood.', 'Chromate and cobalt compounds are toxic/carcinogenic — gloves, and collect all waste.', 'AgNO₃ stains skin black.'],
    setup: () => ({}),
    prelab: [
      { q: 'For N₂ + 3H₂ ⇌ 2NH₃ (ΔH < 0), raising the temperature shifts the equilibrium…', choices: DIR, ans: 1 },
      { q: 'Adding a reactant to a system at equilibrium causes K to…', choices: ['increase', 'decrease', 'stay the same'], ans: 2, why: 'Only temperature changes K; concentration changes shift the position, not K.' },
      { q: 'A precipitate of AgCl forms when Ag⁺ is added. Which ion’s concentration decreases?', choices: ['Ag⁺ only', 'Cl⁻', 'NO₃⁻', 'H⁺'], ans: 1 }
    ],
    parts: [{
      title: 'Stress each system', steps: ['Look at each system in its starting state (the "start" option).', 'Apply each stress to a fresh portion, observe the colour change and record it.'],
      sim: { type: 'bench', title: 'Equilibrium test tubes', instrument: 'Observation', icon: 'tube', controls: [{ k: 'x', l: 'System & stress', opts: Object.keys(LC).map(k => ({ v: k, l: LC[k][0] })) }], actions: [{ l: 'Observe', key: c => 'lc_' + c.x.replace(':', '_'), label: c => LC[c.x][0], read: (S, c) => ({ obs: LC[c.x][1], color: LC[c.x][2], ppt: LC[c.x][3] }) }] }
    }],
    questions: [
      { q: 'System 1: adding 12 M HCl.', choices: DIR, ans: 0 },
      { q: 'System 1: adding water.', choices: DIR, ans: 1 },
      { q: 'System 1: heating turns the solution blue. The forward reaction is…', choices: ['endothermic (ΔH > 0)', 'exothermic (ΔH < 0)'], ans: 0 },
      { q: 'System 1: why does AgNO₃ turn the solution pink?', choices: ['Ag⁺ removes Cl⁻ as AgCl, shifting left', 'Ag⁺ is pink', 'NO₃⁻ reacts with Co²⁺', 'It raises the temperature'], ans: 0 },
      { q: 'System 2: adding Na₂HPO₄.', choices: DIR, ans: 1 },
      { q: 'System 2: heating lightens the colour. The forward reaction is…', choices: ['endothermic', 'exothermic'], ans: 1 },
      { q: 'System 3: adding HCl.', choices: DIR, ans: 0 },
      { q: 'System 4: adding NH₄Cl.', choices: DIR, ans: 1 },
      { q: 'For system 2, explain in your own words why adding KSCN made the colour darker, referring to Q and K.', text: true }
    ]
  });

  // ------------------------------------------------------------------ 5
  const feq = (K, F, Sc) => { const b = K * (F + Sc) + 1; return (b - Math.sqrt(b * b - 4 * K * K * F * Sc)) / (2 * K); };
  const fescn = C.band(447, 1, 52);
  CL.lab({
    id: 'gc2-05', course: 'gc2', n: 5, title: 'Determination of an Equilibrium Constant (FeSCN²⁺)', time: '3 h', skills: 'spectrophotometry · ICE tables · Kc',
    goals: ['Prepare a calibration curve for FeSCN²⁺ using a large excess of Fe³⁺.', 'Measure equilibrium [FeSCN²⁺] in mixtures with comparable reactant concentrations.', 'Use ICE tables to calculate Kc and judge its constancy.'],
    intro: `<p>Iron(III) and thiocyanate form a blood-red complex:</p><div class="eq">Fe³⁺(aq) + SCN⁻(aq) ⇌ FeSCN²⁺(aq) &nbsp;&nbsp; Kc = [FeSCN²⁺] / ([Fe³⁺][SCN⁻])</div>
      <p><b>Standards:</b> when Fe³⁺ is in huge excess (0.200 M), essentially all SCN⁻ is converted, so [FeSCN²⁺] = [SCN⁻]₀. Standards: 5.00 mL 0.200 M Fe³⁺ + <i>x</i> mL 0.00100 M SCN⁻ (x = 1–5), diluted to 25.00 mL.</p>
      <p><b>Equilibrium mixtures:</b> 5.00 mL 0.00200 M Fe³⁺ + <i>y</i> mL 0.00200 M SCN⁻ (y = 1–5) + 0.1 M HNO₃ to 10.00 mL. Here the reaction does <i>not</i> go to completion. Find [FeSCN²⁺]<sub>eq</sub> from the calibration line, then complete an ICE table:</p>
      <div class="eq">[Fe³⁺]eq = [Fe³⁺]₀ − [FeSCN²⁺]eq &nbsp;&nbsp; [SCN⁻]eq = [SCN⁻]₀ − [FeSCN²⁺]eq</div>`,
    safety: ['Fe(NO₃)₃ solutions are made up in HNO₃ — corrosive.', 'Keep cuvettes clean and dry outside.'],
    setup: R => ({ K: R.between(115, 175, 1), eps: R.between(4400, 4900, 0) }),
    prelab: [
      { q: 'Concentration of FeSCN²⁺ in standard 3 (3.00 mL of 0.00100 M SCN⁻ diluted to 25.00 mL).', unit: 'M', ans: 1.2e-4, tol: 0.005 },
      { q: 'Initial [Fe³⁺] in each equilibrium mixture (5.00 mL of 0.00200 M → 10.00 mL).', unit: 'M', ans: 1e-3, tol: 0.005 },
      { q: 'Initial [SCN⁻] in mixture 3 (3.00 mL of 0.00200 M → 10.00 mL).', unit: 'M', ans: 6e-4, tol: 0.005 }
    ],
    parts: [{
      title: 'Measure standards and mixtures', steps: ['Scan standard 5 to find λmax, then set the wavelength there.', 'Zero with the blank (0.1 M HNO₃) and measure every standard and mixture.', 'Graph absorbance against [FeSCN²⁺] for the standards and record the best-fit line.'],
      sim: [{
        type: 'spectro', title: 'Spectrophotometer', l0: 520,
        samples: S => [{ v: 'blank', l: 'Blank (0.1 M HNO₃)', blank: true }]
          .concat([1, 2, 3, 4, 5].map(x => ({ v: 'std' + x, l: `Standard ${x} (${CL.sig(x * 4e-5, 2).replace(/<\/?sup>/g, '')} M)`, A: l => S.eps * fescn(l) * x * 4e-5 })))
          .concat([1, 2, 3, 4, 5].map(y => ({ v: 'mix' + y, l: `Mixture ${y} (${y}.00 mL SCN⁻)`, A: l => S.eps * fescn(l) * feq(S.K, 1e-3, y * 2e-4) })))
      }, { type: 'graph', k: 'fe', title: 'Calibration: A vs [FeSCN²⁺]', short: 'Calibration', xl: '[FeSCN²⁺] (M)', yl: 'Absorbance', rows: 6, fill: (S, D) => [[0, 0]].concat([1, 2, 3, 4, 5].map(x => [x * 4e-5, D('A_std' + x)])) }]
    }],
    questions: [
      { q: 'λmax of FeSCN²⁺.', unit: 'nm', ans: 447, atol: 6 },
      { q: 'Slope of your calibration line.', unit: 'M⁻¹', ans: (S, D) => D('fe_slope'), tol: 0.01, truth: S => S.eps, ttol: 0.06 },
      { q: '[FeSCN²⁺]eq in mixture 3.', unit: 'M', ans: (S, D) => (D('A_mix3') - D('fe_int')) / D('fe_slope'), tol: 0.02, truth: S => feq(S.K, 1e-3, 6e-4), ttol: 0.07 },
      { q: '[Fe³⁺]eq in mixture 3.', unit: 'M', ans: (S, D) => 1e-3 - (D('A_mix3') - D('fe_int')) / D('fe_slope'), tol: 0.01 },
      { q: '[SCN⁻]eq in mixture 3.', unit: 'M', ans: (S, D) => 6e-4 - (D('A_mix3') - D('fe_int')) / D('fe_slope'), tol: 0.015 },
      { q: 'Kc from mixture 3.', ans: (S, D) => { const x = (D('A_mix3') - D('fe_int')) / D('fe_slope'); return x / ((1e-3 - x) * (6e-4 - x)); }, tol: 0.03, truth: S => S.K, ttol: 0.12 },
      { q: 'Average Kc for mixtures 2–5.', ans: (S, D) => { const ks = [2, 3, 4, 5].map(y => { const x = (D('A_mix' + y) - D('fe_int')) / D('fe_slope'); return x / ((1e-3 - x) * (y * 2e-4 - x)); }); return ks.every(isFinite) ? mean(ks) : NaN; }, tol: 0.04, truth: S => S.K, ttol: 0.12, needs: 'all four mixtures' },
      { q: 'Is Kc constant across your mixtures? Discuss which mixture is least reliable and why.', text: true }
    ],
    key: S => [['Kc', S.K], ['ε(447)', S.eps], ['[FeSCN²⁺] mix 1–5', [1, 2, 3, 4, 5].map(y => feq(S.K, 1e-3, y * 2e-4).toExponential(2)).join(', ')]]
  });

  // ------------------------------------------------------------------ 6
  const UNKA = [{ n: 'Chloroacetic acid', pKa: 2.87 }, { n: 'Formic acid', pKa: 3.75 }, { n: 'Benzoic acid', pKa: 4.20 }, { n: 'Acetic acid', pKa: 4.76 }, { n: 'Hypochlorous acid', pKa: 7.53 }];
  const SOLNS = S => ({
    HCl: ['0.10 M HCl', { V: 1, sa: 0.1 }], HOAc: ['0.10 M acetic acid', { V: 1, wa: [{ n: 0.1, pKa: [4.76] }] }], NaOAc: ['0.10 M sodium acetate', { V: 1, sb: 0.1, wa: [{ n: 0.1, pKa: [4.76] }] }],
    NH3: ['0.10 M ammonia', { V: 1, wa: [{ n: 0.1, pKa: [9.25], z: 1 }] }], NH4Cl: ['0.10 M ammonium chloride', { V: 1, sa: 0.1, wa: [{ n: 0.1, pKa: [9.25], z: 1 }] }], NaCl: ['0.10 M NaCl', { V: 1 }],
    unk: ['0.100 M unknown weak acid HA', { V: 1, wa: [{ n: 0.1, pKa: [S.acid.pKa] }] }]
  });
  const bufSol = (c, addA, addB, V = 20) => { const t = c.va + c.vb; const fa = c.vb / t; return { V: (V + addA + addB) / 1000, sb: (0.1 * fa * V + 0.1 * addB) / 1000, sa: 0.1 * addA / 1000, wa: [{ n: 0.1 * V / 1000, pKa: [4.76] }] }; };
  CL.lab({
    id: 'gc2-06', course: 'gc2', n: 6, title: 'pH, Weak-Acid Ka & Buffer Design', time: '2.5 h', skills: 'pH meter · Henderson–Hasselbalch · buffer capacity',
    goals: ['Measure the pH of strong and weak acids, bases and salts.', 'Determine Ka of an unknown weak acid from a single pH measurement.', 'Design an acetate buffer of a target pH and test its buffer capacity.'],
    intro: `<p>For a weak acid HA at initial concentration C: Ka = [H⁺]²/(C − [H⁺]). Salts can be acidic (NH₄⁺), basic (CH₃COO⁻) or neutral (NaCl).</p>
      <p>A <b>buffer</b> is a weak acid with its conjugate base. It resists pH change because added H⁺ is consumed by A⁻ and added OH⁻ by HA. The Henderson–Hasselbalch equation gives its pH:</p>
      <div class="eq">pH = pKa + log([A⁻]/[HA]) &nbsp;&nbsp;&nbsp; acetic acid: pKa = 4.76</div>
      <p>Mixing V<sub>A</sub> mL of 0.10 M CH₃COONa with V<sub>HA</sub> mL of 0.10 M CH₃COOH gives [A⁻]/[HA] = V<sub>A</sub>/V<sub>HA</sub>.</p>`,
    safety: ['Calibrate and rinse the pH electrode between solutions; store it in storage solution, never let it dry out.', '0.10 M HCl and NaOH are irritants.'],
    setup: R => ({ acid: R.pick(UNKA), target: R.between(4.30, 5.20, 2) }),
    prelab: [
      { q: 'pH of 0.0025 M HCl.', ans: -Math.log10(0.0025), atol: 0.01 },
      { q: 'A 0.10 M solution of a weak acid has pH 2.88. Ka?', ans: Math.pow(10, -5.76) / (0.1 - Math.pow(10, -2.88)), tol: 0.03 },
      { q: 'Required [A⁻]/[HA] for an acetate buffer of pH 5.06.', ans: Math.pow(10, 0.3), tol: 0.01 }
    ],
    parts: [
      {
        title: 'Part A — pH of solutions', steps: ['Calibrate the pH meter with pH 4, 7 and 10 buffers.', 'Measure the pH of each solution, rinsing the electrode between samples.'],
        sim: { type: 'bench', title: 'pH meter', instrument: 'pH', icon: 'meter', controls: S => [{ k: 's', l: 'Solution', opts: Object.entries(SOLNS(S)).map(([v, a]) => ({ v, l: a[0] })) }], actions: [{ l: 'Measure pH', key: c => 'pH_' + c.s, label: (c, S) => 'pH of ' + SOLNS(S)[c.s][0], read: (S, c) => ({ v: CL.meas(C.pH(SOLNS(S)[c.s][1]), 0.006, 2), dp: 2 }) }] }
      },
      {
        title: 'Part B — Design and test a buffer', note: S => `<p><b>Your target pH: ${S.target.toFixed(2)}</b>. Choose volumes of 0.10 M CH₃COOH and 0.10 M CH₃COONa (total about 40 mL) to make this buffer, then test 20.0-mL portions.</p>`,
        sim: {
          type: 'bench', title: 'Buffer bench with pH meter', instrument: 'pH', icon: 'meter',
          controls: [{ k: 'va', l: '0.10 M CH₃COOH', type: 'number', min: 0.5, max: 50, step: 0.1, val: 20, u: 'mL', auto: S => [CL.round(40 / (1 + Math.pow(10, S.target - 4.76)), 1)] }, { k: 'vb', l: '0.10 M CH₃COONa', type: 'number', min: 0.5, max: 50, step: 0.1, val: 20, u: 'mL', auto: S => [CL.round(40 - 40 / (1 + Math.pow(10, S.target - 4.76)), 1)] }],
          info: (S, c) => `Mixing ratio [A⁻]/[HA] = ${(c.vb / c.va).toFixed(3)}`,
          actions: [
            { l: 'Measure buffer pH', key: 'buf_pH', label: c => `Buffer pH (${c.va} mL HA + ${c.vb} mL A⁻)`, read: (S, c) => ({ v: CL.meas(C.pH(bufSol(c, 0, 0)), 0.006, 2), dp: 2 }) },
            { l: '20 mL buffer + 1.00 mL 0.10 M HCl', key: 'buf_acid', label: 'Buffer + 1.00 mL HCl', read: (S, c) => ({ v: CL.meas(C.pH(bufSol(c, 1, 0)), 0.006, 2), dp: 2 }) },
            { l: '20 mL buffer + 1.00 mL 0.10 M NaOH', key: 'buf_base', label: 'Buffer + 1.00 mL NaOH', read: (S, c) => ({ v: CL.meas(C.pH(bufSol(c, 0, 1)), 0.006, 2), dp: 2 }) },
            { l: '20 mL distilled water', key: 'w_pH', label: 'Distilled water', read: () => ({ v: CL.meas(5.72, 0.05, 2), dp: 2, note: 'Distilled water is slightly acidic because it absorbs CO₂ from the air.' }) },
            { l: 'Water + 1.00 mL 0.10 M HCl', key: 'w_acid', label: 'Water + 1.00 mL HCl', read: () => ({ v: CL.meas(C.pH({ V: 0.021, sa: 1e-4 }), 0.006, 2), dp: 2 }) },
            { l: 'Water + 1.00 mL 0.10 M NaOH', key: 'w_base', label: 'Water + 1.00 mL NaOH', read: () => ({ v: CL.meas(C.pH({ V: 0.021, sb: 1e-4 }), 0.006, 2), dp: 2 }) }
          ]
        }
      }
    ],
    questions: [
      { h: 'Part A' },
      { q: 'Measured pH of 0.10 M acetic acid.', ans: (S, D) => D('pH_HOAc'), atol: 0.011, truth: C.pH({ V: 1, wa: [{ n: 0.1, pKa: [4.76] }] }), tatol: 0.05 },
      { q: 'Ka of acetic acid calculated from that pH.', ans: (S, D) => { const h = Math.pow(10, -D('pH_HOAc')); return h * h / (0.1 - h); }, tol: 0.04 },
      { q: 'Ka of your unknown acid.', ans: (S, D) => { const h = Math.pow(10, -D('pH_unk')); return h * h / (0.1 - h); }, tol: 0.04, truth: S => Math.pow(10, -S.acid.pKa), ttol: 0.1 },
      { q: 'Identity of the unknown acid.', choices: UNKA.map(a => `${a.n} (pKa ${a.pKa})`), ans: S => UNKA.indexOf(S.acid) },
      { q: 'Why is 0.10 M ammonium chloride acidic?', choices: ['NH₄⁺ is a weak acid', 'Cl⁻ is a weak base', 'NH₄Cl contains H⁺ ions from HCl', 'It is not acidic'], ans: 0 },
      { h: 'Part B' },
      { q: 'Required ratio [A⁻]/[HA] for your target pH.', ans: S => Math.pow(10, S.target - 4.76), tol: 0.02 },
      { q: 'Measured pH of the buffer you made.', ans: (S, D) => D('buf_pH'), atol: 0.011, truth: S => S.target, tatol: 0.06 },
      { q: 'ΔpH of the buffer when 1.00 mL of 0.10 M HCl was added (include sign).', ans: (S, D) => D('buf_acid') - D('buf_pH'), atol: 0.015 },
      { q: 'ΔpH of the water when 1.00 mL of 0.10 M HCl was added.', ans: (S, D) => D('w_acid') - D('w_pH'), atol: 0.015 },
      { q: 'Use your data to explain how the buffer resisted the pH change, writing net ionic equations for the reactions with HCl and NaOH.', text: true }
    ],
    key: S => [['Unknown acid', `${S.acid.n} (pKa ${S.acid.pKa})`], ['Ideal pH of 0.1 M unknown', C.pH(SOLNS(S).unk[1]).toFixed(2)], ['Target pH', S.target], ['Required ratio', Math.pow(10, S.target - 4.76).toFixed(3)]]
  });

  // ------------------------------------------------------------------ 7
  const ACIDS = [{ n: 'Benzoic acid', M: 122.12, pKa: [4.20] }, { n: 'Acetylsalicylic acid', M: 180.16, pKa: [3.50] }, { n: 'Potassium hydrogen phthalate', M: 204.22, pKa: [2.95, 5.41], salt: 1 }, { n: 'Ascorbic acid', M: 176.12, pKa: [4.17, 11.6] }, { n: 'Sulfanilic acid', M: 173.19, pKa: [3.23] }];
  const acidSol = (S, V) => ({ V: (50 + V) / 1000, sb: (S.acid.salt ? S.n : 0) + S.Cb * V / 1000, wa: [{ n: S.n, pKa: S.acid.pKa }] });
  const phoSol = (S, V) => ({ V: (50 + V) / 1000, sb: S.Cb * V / 1000, wa: [{ n: S.Cp * 0.01, pKa: [2.15, 7.20, 12.35] }] });
  CL.lab({
    id: 'gc2-07', course: 'gc2', n: 7, title: 'Potentiometric Titration: Ka & Molar Mass of an Unknown Acid', time: '3 h', skills: 'pH titration curve · half-equivalence · polyprotic acids',
    goals: ['Record pH titration curves with a pH meter.', 'Locate equivalence points and use the half-equivalence point to find pKa.', 'Determine the molar mass of an unknown solid acid and analyze a polyprotic acid.'],
    intro: `<p>Titrating a weak acid with NaOH and plotting pH against volume gives a curve with a steep jump at the <b>equivalence point</b> (V<sub>eq</sub>), where mol OH⁻ = mol HA. Locate it at the middle of the steepest part of the curve.</p>
      <p>At the <b>half-equivalence point</b> (V<sub>eq</sub>/2), half of the HA has been converted to A⁻. Then [HA] = [A⁻], and by Henderson–Hasselbalch, <b>pH = pKa</b>.</p>
      <div class="eq">mol acid = M_NaOH × V_eq &nbsp;&nbsp;&nbsp; molar mass = g acid / mol acid</div>
      <p>A polyprotic acid such as H₃PO₄ shows one jump for each proton that is acidic enough to titrate. The pH halfway between the first and second equivalence points equals pKa₂.</p>`,
    safety: ['NaOH is corrosive.', 'Keep the stir bar away from the pH bulb.'],
    setup: R => { const acid = R.pick(ACIDS); const n = R.between(2.0e-3, 2.6e-3); return { acid, n, m: CL.round(n * acid.M, 4), Cb: R.between(0.0985, 0.1045, 4), Cp: R.between(0.080, 0.115, 4) }; },
    prelab: [
      { q: 'An acid sample needs 23.40 mL of 0.1012 M NaOH to reach equivalence. Moles of acid (monoprotic)?', unit: 'mol', ans: 0.0234 * 0.1012, tol: 0.003 },
      { q: 'At the half-equivalence point of a weak acid titration, pH = …', choices: ['7.00', 'pKa', '14 − pKa', '½ pKa'], ans: 1 },
      { q: 'The pH at the half-equivalence point is 4.20. Ka?', ans: Math.pow(10, -4.2), tol: 0.02 }
    ],
    parts: [
      {
        title: 'Part A — Unknown monoprotic acid', note: S => `<p>NaOH (standardized): <b>${S.Cb.toFixed(4)} M</b>. Your sample: <b>${S.m.toFixed(4)} g</b> of unknown acid in 50 mL water (a little ethanol is added to help it dissolve).</p>`,
        steps: ['Calibrate the pH meter. Record the initial buret reading.', 'Add NaOH in 1-mL portions at first, then 0.1-mL portions (or drops) through the steep region, and keep going about 5 mL past it.', 'Use the curve to find Veq and the pH at Veq/2.'],
        sim: S => ({ type: 'titration', title: 'pH titration — unknown acid', ph: true, plotMax: 40, titrant: { l: `NaOH ${S.Cb.toFixed(4)} M`, C: S.Cb, kind: 'base', short: 'NaOH' }, indicators: ['none', 'phenolphthalein'], trials: [{ k: 'u1', l: 'Unknown acid', desc: `${S.m.toFixed(4)} g unknown acid + 50 mL water`, logs: [{ k: 'm_acid', l: 'Mass of unknown acid', v: S.m, u: 'g', dp: 4 }], sol: { V0: 50, sb: S.acid.salt ? S.n : 0, wa: [{ n: S.n, pKa: S.acid.pKa }] } }] })
      },
      {
        title: 'Part B — Phosphoric acid', steps: ['Pipet 10.00 mL of H₃PO₄ (unknown concentration) into a beaker and add 40 mL of water.', 'Titrate with NaOH past the second equivalence point (pH ≈ 11).'],
        sim: S => ({ type: 'titration', title: 'pH titration — H₃PO₄', ph: true, plotMax: 30, titrant: { l: `NaOH ${S.Cb.toFixed(4)} M`, C: S.Cb, kind: 'base', short: 'NaOH' }, indicators: ['none'], trials: [{ k: 'p1', l: 'H₃PO₄ sample', desc: '10.00 mL H₃PO₄ + 40 mL water', sol: { V0: 50, wa: [{ n: S.Cp * 0.01, pKa: [2.15, 7.20, 12.35] }] } }] })
      }
    ],
    questions: [
      { h: 'Part A' },
      { q: 'Equivalence-point volume from your curve.', unit: 'mL', ans: S => S.n / S.Cb * 1000, atol: 0.3 },
      { q: 'pH at the half-equivalence point.', ans: S => C.pH(acidSol(S, S.n / S.Cb * 500)), atol: 0.12 },
      { q: 'Ka of the unknown acid.', ans: S => Math.pow(10, -C.pH(acidSol(S, S.n / S.Cb * 500))), tol: 0.3 },
      { q: 'Moles of acid in your sample.', unit: 'mol', ans: S => S.n, tol: 0.015 },
      { q: 'Molar mass of the unknown acid.', unit: 'g/mol', ans: S => S.acid.M, tol: 0.025 },
      { q: 'Identity of the unknown acid.', choices: ACIDS.map(a => `${a.n} (${a.M} g/mol, pKa ${a.pKa[a.salt ? 1 : 0]})`), ans: S => ACIDS.indexOf(S.acid) },
      { h: 'Part B' },
      { q: 'Volume of NaOH at the first equivalence point.', unit: 'mL', ans: S => S.Cp * 10 / S.Cb, atol: 0.3 },
      { q: 'Molarity of the H₃PO₄.', unit: 'M', ans: S => S.Cp, tol: 0.03 },
      { q: 'pKa₂ of H₃PO₄ (pH halfway between the first and second equivalence points).', ans: S => C.pH(phoSol(S, 1.5 * S.Cp * 10 / S.Cb)), atol: 0.15 },
      { q: 'Why is no third equivalence point visible for H₃PO₄?', text: true }
    ],
    key: S => [['Acid', `${S.acid.n} (${S.acid.M} g/mol)`], ['Mass / mol', `${S.m} g / ${S.n.toExponential(4)} mol`], ['[NaOH]', S.Cb], ['Veq', (S.n / S.Cb * 1000).toFixed(2) + ' mL'], ['[H₃PO₄]', S.Cp + ' M (Veq1 ' + (S.Cp * 10 / S.Cb).toFixed(2) + ' mL)']]
  });

  // ------------------------------------------------------------------ 8
  const sCommon = (Ksp, Ca) => { let lo = 0, hi = 0.05; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if ((Ca + m) * 4 * m * m > Ksp) hi = m; else lo = m; } return (lo + hi) / 2; };
  CL.lab({
    id: 'gc2-08', course: 'gc2', n: 8, title: 'Solubility Product of Calcium Hydroxide', time: '2 h', skills: 'Ksp · common-ion effect · acid titration',
    goals: ['Titrate saturated Ca(OH)₂ solutions with standard HCl.', 'Calculate the molar solubility and Ksp of Ca(OH)₂.', 'Measure the common-ion effect of added Ca²⁺.'],
    intro: `<p>Calcium hydroxide is only slightly soluble: Ca(OH)₂(s) ⇌ Ca²⁺(aq) + 2 OH⁻(aq), Ksp = [Ca²⁺][OH⁻]². Titrating the filtered saturated solution with HCl measures [OH⁻].</p>
      <div class="eq">[OH⁻] = M_HCl V_HCl / V_sample &nbsp;&nbsp; s = [OH⁻]/2 &nbsp;&nbsp; In water: Ksp = s(2s)² = 4s³</div>
      <p>In 0.0500 M CaCl₂, the Ca²⁺ already present (a common ion) lowers the solubility: Ksp = (0.0500 + s)(2s)².</p>`,
    safety: ['Ca(OH)₂ is caustic; avoid dust.', 'Filter carefully — any undissolved solid in the sample will give a falsely high [OH⁻].'],
    setup: R => ({ Ksp: R.between(4.6e-6, 6.4e-6) }),
    prelab: [
      { q: '25.00 mL of saturated Ca(OH)₂ needs 11.30 mL of 0.0500 M HCl. [OH⁻]?', unit: 'M', ans: 0.0113 * 0.05 / 0.025, tol: 0.005 },
      { q: 'Using that [OH⁻], Ksp of Ca(OH)₂?', ans: 4 * Math.pow(0.0113 * 0.05 / 0.025 / 2, 3), tol: 0.02 },
      { q: 'Adding CaCl₂ to saturated Ca(OH)₂ causes the solubility to…', choices: ['increase', 'decrease', 'stay the same'], ans: 1 }
    ],
    parts: [{
      title: 'Titrate saturated solutions', note: '<p>Each flask holds 25.00 mL of filtered saturated solution and bromothymol blue. Titrant: <b>0.0500 M HCl</b>. The endpoint is the change from blue to green-yellow.</p>',
      sim: S => ({
        type: 'titration', title: 'Ca(OH)₂ titration', titrant: { l: '0.0500 M HCl', C: 0.05, kind: 'acid', short: 'HCl' }, indicator: 'bromothymol',
        trials: [['w1', 'Water trial 1', 0], ['w2', 'Water trial 2', 0], ['c1', '0.0500 M CaCl₂ trial 1', 0.05], ['c2', '0.0500 M CaCl₂ trial 2', 0.05]].map(([k, l, ca]) => { const s = ca ? sCommon(S.Ksp, ca) : Math.cbrt(S.Ksp / 4); return { k, l, desc: `25.00 mL saturated Ca(OH)₂ in ${ca ? '0.0500 M CaCl₂' : 'distilled water'} + bromothymol blue`, sol: { V0: 25, sb: 2 * s * 0.025 } }; })
      })
    }],
    questions: [
      { q: '[OH⁻] in water trial 1.', unit: 'M', ans: (S, D) => 0.05 * vol(D, 'w1') / 25, tol: 0.006, truth: S => 2 * Math.cbrt(S.Ksp / 4), ttol: 0.025 },
      { q: 'Mean molar solubility of Ca(OH)₂ in water.', unit: 'M', ans: (S, D) => mean(['w1', 'w2'].map(k => 0.05 * vol(D, k) / 25 / 2)), tol: 0.006 },
      { q: 'Ksp of Ca(OH)₂ (from your mean solubility).', ans: (S, D) => 4 * Math.pow(mean(['w1', 'w2'].map(k => 0.05 * vol(D, k) / 25 / 2)), 3), tol: 0.02, truth: S => S.Ksp, ttol: 0.08 },
      { q: 'Mean molar solubility in 0.0500 M CaCl₂.', unit: 'M', ans: (S, D) => mean(['c1', 'c2'].map(k => 0.05 * vol(D, k) / 25 / 2)), tol: 0.008, truth: S => sCommon(S.Ksp, 0.05), ttol: 0.05 },
      { q: 'Ksp calculated from the CaCl₂ data.', ans: (S, D) => { const s = mean(['c1', 'c2'].map(k => 0.05 * vol(D, k) / 25 / 2)); return (0.05 + s) * 4 * s * s; }, tol: 0.03 },
      { q: 'The solubility in CaCl₂ is lower because…', choices: ['the common ion Ca²⁺ shifts the equilibrium left', 'CaCl₂ reacts with OH⁻', 'Ksp decreases in salt solutions', 'Cl⁻ forms a precipitate'], ans: 0 },
      { q: 'Why must the saturated solution be filtered, and what would undissolved Ca(OH)₂ in the flask do to your Ksp?', text: true }
    ],
    key: S => [['Ksp', S.Ksp.toExponential(3)], ['s (water)', Math.cbrt(S.Ksp / 4).toExponential(3) + ' M → V ' + (2 * Math.cbrt(S.Ksp / 4) * 25 / 0.05).toFixed(2) + ' mL'], ['s (CaCl₂)', sCommon(S.Ksp, 0.05).toExponential(3) + ' M → V ' + (2 * sCommon(S.Ksp, 0.05) * 25 / 0.05).toFixed(2) + ' mL']]
  });

  // ------------------------------------------------------------------ 9
  const boraxK = (S, T) => S.K25 * Math.exp(-S.dH / 8.314 * (1 / T2K(T) - 1 / 298.15));
  CL.lab({
    id: 'gc2-09', course: 'gc2', n: 9, title: 'Thermodynamics of Borax Dissolution', time: '3 h', skills: 'Ksp vs T · van ’t Hoff plot · ΔH, ΔS, ΔG',
    goals: ['Measure the solubility of borax at several temperatures by titration.', 'Construct a van ’t Hoff plot of ln Ksp against 1/T.', 'Determine ΔH°, ΔS° and ΔG° for the dissolution.'],
    intro: `<p>Borax dissolves as Na₂B₄O₅(OH)₄·8H₂O(s) ⇌ 2 Na⁺ + B₄O₅(OH)₄²⁻ + 8 H₂O. If s = [B₄O₅(OH)₄²⁻], then [Na⁺] = 2s and</p>
      <div class="eq">Ksp = (2s)²(s) = 4s³</div>
      <p>The borate ion is a base: B₄O₅(OH)₄²⁻ + 2 H⁺ + 3 H₂O → 4 H₃BO₃. Titrating 5.00 mL of saturated solution with 0.100 M HCl (bromocresol green, blue → yellow) gives mol borate = ½ mol HCl.</p>
      <div class="eq">ΔG° = −RT ln K = ΔH° − TΔS° &nbsp;&nbsp;⇒&nbsp;&nbsp; ln Ksp = −(ΔH°/R)(1/T) + ΔS°/R</div>`,
    safety: ['Borax is an eye irritant. Use a warm pipet for the hot samples so borax does not crystallize inside it.', 'Water baths up to 60 °C — handle beakers with tongs.'],
    setup: R => ({ dH: R.between(100, 115, 1) * 1000, K25: R.between(1.0e-3, 1.6e-3), Ts: [R.between(24, 26, 1), R.between(34, 36, 1), R.between(44, 46, 1), R.between(54, 56, 1)] }),
    prelab: [
      { q: '5.00 mL of saturated borax needs 12.40 mL of 0.100 M HCl. [borate]?', unit: 'M', ans: 0.0124 * 0.1 / 2 / 0.005, tol: 0.005 },
      { q: 'Ksp for that solution (Ksp = 4s³).', ans: 4 * Math.pow(0.124, 3), tol: 0.01 },
      { q: 'ΔG° is negative at high T but positive at low T. ΔH° and ΔS° are…', choices: ['both positive', 'both negative', 'ΔH° > 0, ΔS° < 0', 'ΔH° < 0, ΔS° > 0'], ans: 0 }
    ],
    parts: [{
      title: 'Titrate saturated borax at four temperatures', note: '<p>Each flask holds 5.00 mL of saturated borax solution (decanted at the recorded temperature) + ~20 mL water + bromocresol green. Titrant: <b>0.100 M HCl</b>.</p>',
      sim: S => ({
        type: 'titration', title: 'Borax titration', titrant: { l: '0.100 M HCl', C: 0.1, kind: 'acid', short: 'HCl' },
        endpoint: { Veq: (SS, tr) => tr.veq, from: '#2a6fd0', to: '#e8d23a', w: 0.03 },
        trials: S.Ts.map((T, i) => { const k = 'b' + (i + 1); const s = Math.cbrt(boraxK(S, T) / 4); return { k, l: `Sample at ~${[25, 35, 45, 55][i]} °C`, veq: 2 * s * 5 / 0.1, desc: `5.00 mL saturated borax, decanted at <b>${T.toFixed(1)} °C</b>`, logs: [{ k: 'T_' + k, l: `Temperature of sample ${i + 1}`, v: T, u: '°C', dp: 1 }] }; })
      })
    }, {
      title: 'van ’t Hoff plot', sim: { type: 'graph', k: 'vh', title: 'ln Ksp vs 1/T', short: 'van ’t Hoff', xl: '1/T (K⁻¹)', yl: 'ln Ksp', rows: 4, fill: (S, D) => [1, 2, 3, 4].map(i => { const s = 0.1 * vol(D, 'b' + i) / 2 / 5; return [1 / T2K(D('T_b' + i)), Math.log(4 * s * s * s)]; }) }
    }],
    questions: [
      { q: '[B₄O₅(OH)₄²⁻] in sample 1 (~25 °C).', unit: 'M', ans: (S, D) => 0.1 * vol(D, 'b1') / 2 / 5, tol: 0.006, truth: S => Math.cbrt(boraxK(S, S.Ts[0]) / 4), ttol: 0.03 },
      { q: 'Ksp at ~25 °C.', ans: (S, D) => 4 * Math.pow(0.1 * vol(D, 'b1') / 2 / 5, 3), tol: 0.02 },
      { q: 'Ksp at ~55 °C.', ans: (S, D) => 4 * Math.pow(0.1 * vol(D, 'b4') / 2 / 5, 3), tol: 0.02, truth: S => boraxK(S, S.Ts[3]), ttol: 0.08 },
      { q: 'ΔH° of dissolution from your plot.', unit: 'kJ/mol', ans: (S, D) => -D('vh_slope') * 8.314 / 1000, tol: 0.01, truth: S => S.dH / 1000, ttol: 0.08 },
      { q: 'ΔS° of dissolution from your plot.', unit: 'J/(mol·K)', ans: (S, D) => D('vh_int') * 8.314, atol: 3, truth: S => S.dH / 298.15 + 8.314 * Math.log(S.K25), tatol: 30 },
      { q: 'ΔG° at 298 K from your ΔH° and ΔS°.', unit: 'kJ/mol', ans: (S, D) => (-D('vh_slope') * 8.314 - 298.15 * D('vh_int') * 8.314) / 1000, atol: 0.6 },
      { q: 'Is borax dissolution entropy-driven or enthalpy-driven? Use your signs of ΔH° and ΔS° to explain.', text: true }
    ],
    key: S => [['ΔH°', S.dH / 1000 + ' kJ/mol'], ['Ksp(25 °C)', S.K25.toExponential(3)], ['ΔS°', (S.dH / 298.15 + 8.314 * Math.log(S.K25)).toFixed(1) + ' J/mol·K'], ['Veq at each T', S.Ts.map(T => (2 * Math.cbrt(boraxK(S, T) / 4) * 50).toFixed(2)).join(', ') + ' mL']]
  });

  // ------------------------------------------------------------------ 10
  const HALF = { Cu: ['Cu | Cu²⁺', 0.340], Ag: ['Ag | Ag⁺', 0.800], Pb: ['Pb | Pb²⁺', -0.126], Fe: ['Fe | Fe²⁺', -0.447], Zn: ['Zn | Zn²⁺', -0.762], M: ['Unknown M | M²⁺', null] };
  const UNKM = [{ n: 'Nickel', E: -0.257 }, { n: 'Cadmium', E: -0.403 }, { n: 'Chromium', E: -0.913 }, { n: 'Manganese', E: -1.185 }];
  const Ehalf = (S, k) => (k === 'M' ? S.unk.E : HALF[k][1]);
  CL.lab({
    id: 'gc2-10', course: 'gc2', n: 10, title: 'Electrochemistry: Galvanic Cells & the Nernst Equation', time: '2.5 h', skills: 'voltmeter · reduction potentials · Nernst',
    goals: ['Build galvanic cells and measure their potentials.', 'Determine the reduction potential of an unknown metal and identify it.', 'Verify the Nernst equation with a concentration series.'],
    intro: `<p>A galvanic cell turns a spontaneous redox reaction into electrical work. Oxidation happens at the <b>anode</b> (− terminal) and reduction at the <b>cathode</b> (+ terminal). A salt bridge completes the circuit.</p>
      <div class="eq">E°cell = E°cathode − E°anode &nbsp;&nbsp;&nbsp; ΔG° = −nFE°</div>
      <p>With the black (COM) lead on the anode and the red lead on the cathode, a positive reading means you assigned them correctly.</p>
      <div class="eq">Nernst (25 °C): E = E° − (0.05916/n) log Q &nbsp;&nbsp; For Zn | Zn²⁺(1 M) || Cu²⁺(x M) | Cu: E = E° + (0.05916/2) log[Cu²⁺]</div>
      <table><tr><th>Half-reaction</th><td>Ag⁺/Ag</td><td>Cu²⁺/Cu</td><td>Pb²⁺/Pb</td><td>Ni²⁺/Ni</td><td>Cd²⁺/Cd</td><td>Fe²⁺/Fe</td><td>Cr²⁺/Cr</td><td>Zn²⁺/Zn</td><td>Mn²⁺/Mn</td></tr><tr><th>E° (V)</th><td>+0.800</td><td>+0.340</td><td>−0.126</td><td>−0.257</td><td>−0.403</td><td>−0.447</td><td>−0.913</td><td>−0.762</td><td>−1.185</td></tr></table>`,
    safety: ['Lead and silver salts are toxic; collect all solutions as heavy-metal waste.', 'Sand electrodes clean before use; do not let the salt bridge dry out.'],
    setup: R => ({ unk: R.pick(UNKM), off: R.between(-0.008, 0.008, 4) }),
    prelab: [
      { q: 'E°cell for Zn | Zn²⁺ || Ag⁺ | Ag.', unit: 'V', ans: 0.8 + 0.762, atol: 0.002 },
      { q: 'ΔG° for a 2-electron cell with E° = 1.102 V.', unit: 'kJ', ans: -2 * 96485 * 1.102 / 1000, tol: 0.005 },
      { q: 'In the Zn/Cu cell, diluting the Cu²⁺ solution makes Ecell…', choices: ['larger', 'smaller', 'unchanged'], ans: 1 }
    ],
    parts: [
      {
        title: 'Part A — Standard cells (all solutions 1.0 M)', steps: ['Choose the half-cells for the anode (black lead) and cathode (red lead) and record the potential.', 'Measure each metal against Cu | Cu²⁺, including the unknown.'],
        sim: { type: 'bench', title: 'Galvanic cell & voltmeter', instrument: 'Voltmeter (V)', icon: 'meter', controls: [{ k: 'a', l: 'Anode (black, COM)', opts: Object.keys(HALF).map(k => ({ v: k, l: HALF[k][0] })), val: 'Zn' }, { k: 'c', l: 'Cathode (red, +)', opts: Object.keys(HALF).map(k => ({ v: k, l: HALF[k][0] })), val: 'Cu' }], actions: [{ l: 'Measure cell potential', key: c => `E_${c.a}_${c.c}`, label: c => `E(${HALF[c.a][0]} || ${HALF[c.c][0]})`, read: (S, c) => (c.a === c.c ? { v: CL.meas(0, 0.001, 3), u: 'V', dp: 3 } : { v: CL.meas(Ehalf(S, c.c) - Ehalf(S, c.a) + S.off, 0.0015, 3), u: 'V', dp: 3 }) }] }
      },
      {
        title: 'Part B — Nernst equation', steps: ['Use Zn | Zn²⁺ (1.0 M) as the anode. Make serial dilutions of Cu²⁺ (1.0 to 1.0 × 10⁻⁴ M) and measure each cell.', 'Plot E against log[Cu²⁺].'],
        sim: [{ type: 'bench', title: 'Concentration series', instrument: 'Voltmeter (V)', icon: 'meter', controls: [{ k: 'x', l: '[Cu²⁺] at cathode', opts: [0, -1, -2, -3, -4].map(e => ({ v: e, l: `1.0 × 10^${e} M` })) }], actions: [{ l: 'Measure', key: c => 'En_' + (-c.x), label: c => `E with [Cu²⁺] = 1.0e${c.x} M`, read: (S, c) => ({ v: CL.meas(1.102 + 0.02958 * c.x + S.off, 0.0015, 3), u: 'V', dp: 3 }) }] },
          { type: 'graph', k: 'nern', title: 'E vs log[Cu²⁺]', short: 'Nernst plot', xl: 'log[Cu²⁺]', yl: 'E (V)', rows: 5, fill: (S, D) => [0, 1, 2, 3, 4].map(e => [-e, D('En_' + e)]) }]
      }
    ],
    questions: [
      { q: 'Measured E for Zn | Zn²⁺ || Cu²⁺ | Cu.', unit: 'V', ans: (S, D) => D('E_Zn_Cu'), atol: 0.002, truth: 1.102, tatol: 0.03 },
      { q: 'ΔG° for the Zn/Cu cell from your measured E.', unit: 'kJ', ans: (S, D) => -2 * 96485 * D('E_Zn_Cu') / 1000, tol: 0.005 },
      { q: 'E° of the unknown M²⁺/M from your measurement of M vs Cu.', unit: 'V', ans: (S, D) => 0.34 - D('E_M_Cu'), atol: 0.003, truth: S => S.unk.E, tatol: 0.025, needs: 'E with M as anode and Cu as cathode' },
      { q: 'Identity of the unknown metal.', choices: UNKM.map(u => `${u.n} (E° = ${u.E} V)`), ans: S => UNKM.indexOf(S.unk) },
      { q: 'Slope of your Nernst plot.', unit: 'V', ans: (S, D) => D('nern_slope'), tol: 0.03, truth: 0.02958, ttol: 0.08 },
      { q: 'Number of electrons transferred, n = 0.05916/slope.', ans: (S, D) => 0.05916 / D('nern_slope'), tol: 0.03 },
      { q: 'Predicted E for the Zn/Cu cell with [Cu²⁺] = 0.050 M (Zn²⁺ = 1.0 M).', unit: 'V', ans: 1.102 + 0.02958 * Math.log10(0.05), atol: 0.003 },
      { q: 'Your measured potentials differ slightly from the tabulated values. Suggest two reasons.', text: true }
    ],
    key: S => [['Unknown', `${S.unk.n} (${S.unk.E} V)`], ['Expected E(M | Cu)', (0.34 - S.unk.E + S.off).toFixed(3) + ' V'], ['Junction offset', S.off + ' V']]
  });

  // ------------------------------------------------------------------ 11
  CL.lab({
    id: 'gc2-11', course: 'gc2', n: 11, title: "Electrolysis: Faraday's Constant & Avogadro's Number", time: '2 h', skills: 'electroplating · Faraday’s law',
    goals: ['Electroplate copper at constant current.', 'Relate charge passed to the moles of copper deposited.', 'Determine the Faraday constant and Avogadro’s number.'],
    intro: `<p>In an electrolytic cell, an external power supply drives a non-spontaneous reaction. With two copper electrodes in acidified CuSO₄:</p>
      <div class="eq">Cathode: Cu²⁺ + 2e⁻ → Cu(s) (gains mass) &nbsp;&nbsp; Anode: Cu(s) → Cu²⁺ + 2e⁻ (loses mass)</div>
      <div class="eq">Q = I·t &nbsp;&nbsp; mol e⁻ = 2 × mol Cu &nbsp;&nbsp; F = Q / mol e⁻ &nbsp;&nbsp; N_A = F / e (e = 1.602 × 10⁻¹⁹ C)</div>`,
    safety: ['Turn off the power supply before connecting or touching the electrodes.', 'Acidified CuSO₄ is corrosive and toxic to aquatic life — collect waste.'],
    setup: R => ({ cat: R.between(9, 12, 4), an: R.between(9, 12, 4), eff: R.between(0.975, 0.995, 4) }),
    prelab: [
      { q: 'Charge passed by 0.500 A for 20.0 min.', unit: 'C', ans: 600, tol: 0.003 },
      { q: 'Moles of electrons in 600 C.', unit: 'mol', ans: 600 / 96485, tol: 0.005 },
      { q: 'Mass of Cu deposited by that charge.', unit: 'g', ans: 600 / 96485 / 2 * 63.546, tol: 0.005 }
    ],
    parts: [{
      title: 'Electroplate copper', steps: ['Clean and dry both electrodes and weigh them.', 'Set the current and run time, start the electrolysis, and read the ammeter and timer.', 'Rinse the electrodes with water then acetone, dry them, and weigh again.'],
      sim: {
        type: 'bench', title: 'Electrolysis cell', instrument: 'Reading', icon: 'meter',
        controls: [{ k: 'I', l: 'Current setting', type: 'range', min: 0.20, max: 0.60, step: 0.05, val: 0.40, u: 'A', dp: 2 }, { k: 't', l: 'Run time', type: 'range', min: 10, max: 30, step: 1, val: 20, u: 'min' }],
        actions: [
          { l: 'Weigh cathode (before)', key: 'cat0', label: 'Cathode mass before', read: S => ({ v: CL.round(S.cat, 4), u: 'g', dp: 4 }) },
          { l: 'Weigh anode (before)', key: 'an0', label: 'Anode mass before', read: S => ({ v: CL.round(S.an, 4), u: 'g', dp: 4 }) },
          { l: 'Run electrolysis', nolog: true, read: (S, c, ctx) => { if (!ctx.D.has('cat0') || !ctx.D.has('an0')) return { err: 'Weigh both electrodes first.' }; ctx.st.h = ctx.st.h || {}; ctx.st.h.run = { I: c.I * (1 + 0.004 * CL.gauss()), t: c.t * 60 }; ctx.save(); return { obs: `Electrolysis ran ${c.t} min`, note: 'Pinkish copper deposited on the cathode. Now read the ammeter average and timer, then weigh.' }; } },
          { l: 'Read average current', key: 'I', label: 'Average current', read: (S, c, ctx) => { const r = ctx.st.h && ctx.st.h.run; return r ? { v: CL.round(r.I, 3), u: 'A', dp: 3 } : { err: 'Run the electrolysis first.' }; } },
          { l: 'Read elapsed time', key: 'tsec', label: 'Elapsed time', read: (S, c, ctx) => { const r = ctx.st.h && ctx.st.h.run; return r ? { v: r.t, u: 's', dp: 0 } : { err: 'Run the electrolysis first.' }; } },
          { l: 'Weigh cathode (after)', key: 'cat1', label: 'Cathode mass after', read: (S, c, ctx) => { const r = ctx.st.h && ctx.st.h.run; return r ? { v: CL.round(S.cat + r.I * r.t / 96485 / 2 * 63.546 * S.eff, 4), u: 'g', dp: 4 } : { err: 'Run the electrolysis first.' }; } },
          { l: 'Weigh anode (after)', key: 'an1', label: 'Anode mass after', read: (S, c, ctx) => { const r = ctx.st.h && ctx.st.h.run; return r ? { v: CL.round(S.an - r.I * r.t / 96485 / 2 * 63.546 * (S.eff + 0.012), 4), u: 'g', dp: 4 } : { err: 'Run the electrolysis first.' }; } }
        ]
      }
    }],
    questions: [
      { q: 'Charge passed, Q.', unit: 'C', ans: (S, D) => D('I') * D('tsec'), tol: 0.003 },
      { q: 'Mass of copper deposited on the cathode.', unit: 'g', ans: (S, D) => D('cat1') - D('cat0'), atol: 0.0002 },
      { q: 'Moles of electrons transferred (from the cathode mass).', unit: 'mol', ans: (S, D) => 2 * (D('cat1') - D('cat0')) / 63.546, tol: 0.004 },
      { q: 'Experimental Faraday constant.', unit: 'C/mol e⁻', ans: (S, D) => D('I') * D('tsec') / (2 * (D('cat1') - D('cat0')) / 63.546), tol: 0.004, truth: 96485, ttol: 0.03 },
      { q: 'Experimental Avogadro’s number.', unit: 'mol⁻¹', ans: (S, D) => D('I') * D('tsec') / (2 * (D('cat1') - D('cat0')) / 63.546) / 1.602e-19, tol: 0.005, truth: 6.022e23, ttol: 0.03 },
      { q: 'Did the anode lose the same mass the cathode gained? Explain any difference.', text: true }
    ],
    key: S => [['Current efficiency', (S.eff * 100).toFixed(1) + '%'], ['Expected F (from efficiency)', (96485 / S.eff).toFixed(0) + ' C/mol']]
  });

  // ------------------------------------------------------------------ 12
  const QUAL = ['Ag', 'Pb', 'Hg'];
  const qualObs = (ions, test) => {
    const has = i => ions.includes(i);
    if (test === 'hcl') return ions.length ? { obs: 'White precipitate forms', color: 'rgba(225,235,245,.5)', ppt: '#f3f3f3' } : { obs: 'No precipitate', color: 'rgba(200,225,240,.3)' };
    if (!ions.length) return { obs: 'Nothing to test — no Group I precipitate formed', color: 'rgba(200,225,240,.3)' };
    if (test === 'hot') return has('Pb') ? { obs: 'Bright yellow precipitate (PbCrO₄) in the hot-water extract', color: 'rgba(240,220,90,.5)', ppt: '#f2cf2a' } : { obs: 'Hot-water extract + K₂CrO₄: stays clear yellow, no precipitate', color: 'rgba(245,225,100,.45)' };
    const rest = ions.filter(i => i !== 'Pb');
    if (test === 'nh3') return !rest.length ? { obs: 'No residue left after hot-water wash', color: 'rgba(200,225,240,.3)' } : has('Hg') ? { obs: 'Residue turns gray-black on adding NH₃', color: 'rgba(200,225,240,.35)', ppt: '#4a4a4a' } : { obs: 'White residue dissolves completely in NH₃', color: 'rgba(200,225,240,.3)' };
    if (test === 'hno3') return has('Ag') ? { obs: 'White precipitate (AgCl) reappears when the NH₃ solution is acidified', color: 'rgba(225,235,245,.5)', ppt: '#f3f3f3' } : { obs: 'No precipitate on acidifying', color: 'rgba(200,225,240,.3)' };
  };
  const YN = ['Present', 'Absent'];
  CL.lab({
    id: 'gc2-12', course: 'gc2', n: 12, title: 'Qualitative Analysis of Group I Cations', time: '2.5 h', skills: 'selective precipitation · complex ions · flow charts',
    goals: ['Separate Ag⁺, Pb²⁺ and Hg₂²⁺ by selective precipitation.', 'Confirm each ion with a specific test.', 'Analyze an unknown and report which ions it contains.'],
    intro: `<p>Group I cations form insoluble chlorides: AgCl, PbCl₂ and Hg₂Cl₂ are all white. They are separated step by step:</p>
      <ol><li><b>6 M HCl</b> precipitates all three chlorides.</li><li><b>Hot water</b> dissolves PbCl₂, which is much more soluble when hot. Add K₂CrO₄ to the hot extract: Pb²⁺ + CrO₄²⁻ → PbCrO₄(s), yellow.</li>
      <li><b>6 M NH₃</b> on the remaining solid: AgCl dissolves as [Ag(NH₃)₂]⁺. Hg₂Cl₂ disproportionates to Hg(l) + HgNH₂Cl(s), which looks <b>gray-black</b>.</li><li><b>6 M HNO₃</b> on the ammonia solution destroys the complex, and AgCl precipitates again (white): confirms Ag⁺.</li></ol>
      <p>Run a known mixture of all three ions alongside your unknown so you know what a positive test looks like.</p>`,
    safety: ['Mercury(I) and lead compounds are highly toxic — gloves, and all waste into the heavy-metal container.', 'Concentrated NH₃ and HNO₃: use the hood.'],
    setup: R => { let ions = QUAL.filter(() => R.r() < 0.55); if (!ions.length) ions = [R.pick(QUAL)]; return { ions }; },
    prelab: [
      { q: 'Why does hot water separate PbCl₂ from AgCl and Hg₂Cl₂?', choices: ['PbCl₂ is much more soluble in hot water', 'AgCl decomposes in hot water', 'Hot water oxidizes Hg₂²⁺', 'Pb²⁺ forms an ammine complex'], ans: 0 },
      { q: 'Which ion forms a soluble complex with NH₃?', choices: ['Ag⁺', 'Pb²⁺', 'Hg₂²⁺'], ans: 0 },
      { q: 'A gray-black residue with NH₃ confirms…', choices: ['Ag⁺', 'Pb²⁺', 'Hg₂²⁺'], ans: 2 }
    ],
    parts: [{
      title: 'Run the separation scheme', steps: ['Run each step on the known mixture, then on your unknown.', 'Record every observation.'],
      sim: {
        type: 'bench', title: 'Qualitative analysis bench', instrument: 'Observation', icon: 'tube',
        controls: [{ k: 's', l: 'Sample', opts: [{ v: 'known', l: 'Known: Ag⁺ + Pb²⁺ + Hg₂²⁺' }, { v: 'Ag', l: 'Known: Ag⁺ only' }, { v: 'Pb', l: 'Known: Pb²⁺ only' }, { v: 'Hg', l: 'Known: Hg₂²⁺ only' }, { v: 'unk', l: 'UNKNOWN' }] }, { k: 't', l: 'Step', opts: [{ v: 'hcl', l: '1 · Add 6 M HCl' }, { v: 'hot', l: '2 · Hot water, then K₂CrO₄ on extract' }, { v: 'nh3', l: '3 · Add 6 M NH₃ to residue' }, { v: 'hno3', l: '4 · Acidify NH₃ solution with HNO₃' }] }],
        actions: [{ l: 'Perform step', key: c => `q_${c.s}_${c.t}`, label: c => `${c.s === 'unk' ? 'Unknown' : c.s === 'known' ? 'Known mixture' : c.s + ' only'}: step ${({ hcl: 1, hot: 2, nh3: 3, hno3: 4 })[c.t]}`, read: (S, c) => qualObs(c.s === 'unk' ? S.ions : c.s === 'known' ? QUAL : [c.s], c.t) }]
      }
    }],
    questions: [
      { q: 'Ag⁺ in your unknown:', choices: YN, ans: S => (S.ions.includes('Ag') ? 0 : 1) },
      { q: 'Pb²⁺ in your unknown:', choices: YN, ans: S => (S.ions.includes('Pb') ? 0 : 1) },
      { q: 'Hg₂²⁺ in your unknown:', choices: YN, ans: S => (S.ions.includes('Hg') ? 0 : 1) },
      { q: 'Net ionic equation for the confirmatory test for Pb²⁺:', choices: ['Pb²⁺ + CrO₄²⁻ → PbCrO₄(s)', 'Pb²⁺ + 2Cl⁻ → PbCl₂(s)', 'Pb²⁺ + 2NH₃ → Pb(NH₃)₂²⁺', 'PbCl₂ → Pb + Cl₂'], ans: 0 },
      { q: 'Draw (describe) your flow chart, citing the specific observations that led to each conclusion about your unknown.', text: true, rows: 6 }
    ],
    key: S => [['Unknown contains', S.ions.map(i => ({ Ag: 'Ag⁺', Pb: 'Pb²⁺', Hg: 'Hg₂²⁺' })[i]).join(', ')]]
  });
})();
