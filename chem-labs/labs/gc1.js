/* General Chemistry I — virtual lab definitions */
(function () {
  'use strict';
  const C = CL.chem, M = C.M, sig = CL.sig;
  CL.course({ id: 'gc1', code: 'CHEM 101L', title: 'General Chemistry I', short: 'Gen Chem I', color: '#1F5FAD', blurb: 'Measurement, matter, stoichiometry, atomic structure, bonding, thermochemistry, gases and solutions.' });

  const rhoW = T => 0.999974950 * (1 - Math.pow(T - 3.983035, 2) * (T + 301.797) / (522528.9 * (T + 69.34881)));
  const waterTable = () => `<table><tr><th>T (°C)</th>${[18, 19, 20, 21, 22, 23, 24, 25, 26].map(t => `<td>${t}</td>`).join('')}</tr><tr><th>ρ (g/mL)</th>${[18, 19, 20, 21, 22, 23, 24, 25, 26].map(t => `<td>${rhoW(t).toFixed(5)}</td>`).join('')}</tr></table>`;
  const vpTable = () => `<table><tr><th>T (°C)</th>${[18, 19, 20, 21, 22, 23, 24, 25, 26].map(t => `<td>${t}</td>`).join('')}</tr><tr><th>P<sub>H₂O</sub> (torr)</th>${[18, 19, 20, 21, 22, 23, 24, 25, 26].map(t => `<td>${C.pH2O(t).toFixed(1)}</td>`).join('')}</tr></table>`;
  const interp = (fn, T) => fn(T);
  const sd = arr => { const v = arr.filter(isFinite); if (v.length < 2) return NaN; const m = v.reduce((a, b) => a + b, 0) / v.length; return Math.sqrt(v.reduce((s, x) => s + (x - m) * (x - m), 0) / (v.length - 1)); };
  const mean = arr => arr.length && arr.every(isFinite) ? arr.reduce((a, b) => a + b, 0) / arr.length : NaN;
  const needPrev = (D, k, what) => (D.has(k) ? null : { err: `Do this first: ${what}.` });

  // ------------------------------------------------------------------ 1
  CL.lab({
    id: 'gc1-01', course: 'gc1', n: 1, title: 'Measurement, Significant Figures & Glassware Precision', time: '2 h', skills: 'balance · glassware · statistics',
    goals: ['Use an analytical balance and volumetric glassware correctly.', 'Determine the density of water three ways and compare precision and accuracy.', 'Apply significant-figure rules and calculate mean, standard deviation and percent error.'],
    intro: `<p>Every measurement has uncertainty. A measurement's <b>precision</b> is how closely repeated measurements agree. Its <b>accuracy</b> is how close they are to the true value. The glassware you choose sets a limit on both.</p>
      <p>You will deliver about 10 mL of water with three pieces of glassware: a <b>beaker</b> (rough markings, ±5%), a <b>10-mL graduated cylinder</b> (±0.1 mL) and a <b>10.00-mL volumetric pipet</b> (±0.02 mL). Weighing the delivered water and dividing by its nominal volume gives the density of water:</p>
      <div class="eq">ρ = m / V &nbsp;&nbsp;&nbsp; mass of water = (beaker + water) − (empty beaker)</div>
      <p>Density of water depends on temperature, so read the thermometer and compare your results with the accepted values:</p>${waterTable()}
      <p>Report each result to the correct number of significant figures. A balance reading of 30.125 g has 5 significant figures; the beaker's "10 mL" mark has at most 1–2.</p>
      <div class="eq">mean x̄ = Σxᵢ / n &nbsp;&nbsp; s = √[Σ(xᵢ − x̄)² / (n − 1)] &nbsp;&nbsp; % error = |experimental − accepted| / accepted × 100</div>`,
    safety: ['Wear splash goggles at all times.', 'Never pipet by mouth — use a pipet bulb.', 'Report broken glassware; never pick up shards by hand.'],
    equipment: ['Analytical balance (±0.001 g)', '50-mL beaker', '10-mL graduated cylinder', '10.00-mL volumetric pipet & bulb', 'Thermometer', 'Distilled water'],
    setup: R => ({ T: R.between(19.5, 24.5, 1), bias: { bk: R.between(-0.06, 0.06), gc: R.between(-0.012, 0.012), pip: R.between(-0.0012, 0.0012) } }),
    prelab: [
      { q: 'How many significant figures are in the measurement 0.04050 g?', ans: 4, int: true },
      { q: 'An object has a mass of 25.4 g and a volume of 9.6 mL. What is its density?', unit: 'g/mL', ans: 25.4 / 9.6, tol: 0.01 },
      { q: 'A 10-mL graduated cylinder has marks every 0.1 mL. Which reading is recorded correctly?', choices: ['7 mL', '7.4 mL', '7.45 mL', '7.452 mL'], ans: 2, why: 'Estimate one digit beyond the smallest graduation: 0.1-mL marks → read to 0.01 mL.' },
      { q: 'Three trials give 0.981, 0.982 and 0.981 g/mL for a liquid whose true density is 0.997 g/mL. The results are…', choices: ['precise and accurate', 'precise but not accurate', 'accurate but not precise', 'neither precise nor accurate'], ans: 1 }
    ],
    parts: [{
      title: 'Deliver and weigh water with three kinds of glassware',
      steps: ['Read the thermometer in the water reservoir and record the temperature.', 'Choose a glassware type and trial number. Weigh a clean, dry 50-mL beaker.', 'Deliver ~10 mL of water with the chosen glassware into the beaker and weigh again.', 'Repeat for three trials with each of the three types of glassware (9 deliveries in total).'],
      sim: {
        type: 'bench', title: 'Analytical balance & water reservoir', instrument: 'Balance (g)', icon: 'balance',
        controls: [
          { k: 'g', l: 'Glassware', opts: [{ v: 'bk', l: '50-mL beaker (fill to 10-mL mark)' }, { v: 'gc', l: '10-mL graduated cylinder (10.0 mL)' }, { v: 'pip', l: '10.00-mL volumetric pipet' }] },
          { k: 't', l: 'Trial', opts: [{ v: 1, l: 'Trial 1' }, { v: 2, l: 'Trial 2' }, { v: 3, l: 'Trial 3' }] }
        ],
        actions: [
          { l: 'Read thermometer', key: 'T', label: 'Water temperature', read: S => ({ v: CL.meas(S.T, 0.05, 1), u: '°C', dp: 1 }) },
          { l: 'Weigh empty beaker', key: c => `m0_${c.g}_${c.t}`, label: c => `${{ bk: 'Beaker', gc: 'Grad. cylinder', pip: 'Pipet' }[c.g]} trial ${c.t}: empty beaker`, read: () => ({ v: CL.round(29.5 + Math.random() * 2, 3), u: 'g', dp: 3 }) },
          {
            l: 'Deliver water & weigh', key: c => `m1_${c.g}_${c.t}`, label: c => `${{ bk: 'Beaker', gc: 'Grad. cylinder', pip: 'Pipet' }[c.g]} trial ${c.t}: beaker + water`,
            read: (S, c, ctx) => {
              const m0 = ctx.D(`m0_${c.g}_${c.t}`); if (!isFinite(m0)) return { err: 'Weigh the empty beaker for this glassware and trial first.' };
              const sdv = { bk: 0.35, gc: 0.05, pip: 0.008 }[c.g];
              const V = 10 * (1 + S.bias[c.g]) + sdv * CL.gauss();
              return { v: CL.round(m0 + V * rhoW(S.T), 3), u: 'g', dp: 3 };
            }
          }
        ]
      }
    }],
    questions: [
      { h: 'Volumetric pipet' },
      { q: 'Mass of water delivered by the pipet in trial 1.', unit: 'g', ans: (S, D) => D('m1_pip_1') - D('m0_pip_1'), atol: 0.0015, needs: 'pipet trial 1 masses' },
      { q: 'Density of water from pipet trial 1 (use V = 10.00 mL).', unit: 'g/mL', ans: (S, D) => (D('m1_pip_1') - D('m0_pip_1')) / 10, atol: 0.0003 },
      { q: 'Mean density from the three pipet trials.', unit: 'g/mL', ans: (S, D) => mean([1, 2, 3].map(t => (D(`m1_pip_${t}`) - D(`m0_pip_${t}`)) / 10)), atol: 0.0003, needs: 'all three pipet trials' },
      { q: 'Sample standard deviation of the three pipet densities.', unit: 'g/mL', ans: (S, D) => sd([1, 2, 3].map(t => (D(`m1_pip_${t}`) - D(`m0_pip_${t}`)) / 10)), tol: 0.12, atol: 0.00005 },
      { h: 'Other glassware' },
      { q: 'Mean density from the graduated-cylinder trials (V = 10.0 mL).', unit: 'g/mL', ans: (S, D) => mean([1, 2, 3].map(t => (D(`m1_gc_${t}`) - D(`m0_gc_${t}`)) / 10)), atol: 0.0006 },
      { q: 'Mean density from the beaker trials (V = 10 mL).', unit: 'g/mL', ans: (S, D) => mean([1, 2, 3].map(t => (D(`m1_bk_${t}`) - D(`m0_bk_${t}`)) / 10)), atol: 0.002 },
      { h: 'Accuracy' },
      { q: 'Accepted density of water at your measured temperature (interpolate from the table).', unit: 'g/mL', ans: (S, D) => rhoW(D('T')), atol: 0.00012, needs: 'water temperature' },
      { q: 'Percent error of your mean pipet density.', unit: '%', ans: (S, D) => Math.abs(mean([1, 2, 3].map(t => (D(`m1_pip_${t}`) - D(`m0_pip_${t}`)) / 10)) - rhoW(D('T'))) / rhoW(D('T')) * 100, atol: 0.03 },
      { q: 'Which glassware gave the most precise and accurate results?', choices: ['Beaker', 'Graduated cylinder', 'Volumetric pipet', 'All were equivalent'], ans: 2 },
      { q: 'Explain, using your standard deviations and percent errors, when it is acceptable to use a beaker to measure volume and when a pipet is required.', text: true }
    ],
    key: S => [['Water temperature', S.T + ' °C'], ['Accepted density', rhoW(S.T).toFixed(5) + ' g/mL'], ['Pipet bias', (S.bias.pip * 100).toFixed(2) + '%']]
  });

  // ------------------------------------------------------------------ 2
  const METALS = [{ n: 'Aluminum', d: 2.70 }, { n: 'Titanium', d: 4.51 }, { n: 'Zinc', d: 7.13 }, { n: 'Iron', d: 7.87 }, { n: 'Copper', d: 8.96 }, { n: 'Lead', d: 11.34 }];
  const LIQS = [{ n: 'Hexane', d: 0.659 }, { n: 'Ethanol', d: 0.789 }, { n: 'Toluene', d: 0.867 }, { n: 'Ethylene glycol', d: 1.113 }, { n: 'Glycerol', d: 1.261 }];
  CL.lab({
    id: 'gc1-02', course: 'gc1', n: 2, title: 'Density: Identifying an Unknown Metal and Liquid', time: '2 h', skills: 'water displacement · density · identification',
    goals: ['Determine the volume of an irregular solid by water displacement.', 'Calculate the densities of an unknown metal and an unknown liquid.', 'Identify both unknowns by comparing with accepted densities.'],
    intro: `<p>Density is an <b>intensive</b> property: it does not depend on how much of the substance you have, so you can use it to identify a substance. For an irregular solid, measure the volume by <b>water displacement</b>. The rise in water level in a graduated cylinder equals the volume of the submerged solid.</p>
      <div class="eq">V_metal = V_final − V_initial &nbsp;&nbsp;&nbsp; ρ = m / V</div>
      <p>For a liquid, deliver an exact volume with a volumetric pipet and weigh it.</p>
      <table><tr><th>Metal</th>${METALS.map(m => `<td>${m.n}</td>`).join('')}</tr><tr><th>ρ (g/cm³)</th>${METALS.map(m => `<td>${m.d}</td>`).join('')}</tr></table>
      <table><tr><th>Liquid</th>${LIQS.map(m => `<td>${m.n}</td>`).join('')}</tr><tr><th>ρ (g/mL)</th>${LIQS.map(m => `<td>${m.d}</td>`).join('')}</tr></table>`,
    safety: ['Tilt the cylinder and slide the metal in — dropping it can crack the glass.', 'Organic liquids are flammable: no open flames.', 'Dispose of organic liquids in the labelled waste container.'],
    setup: R => { const metal = R.pick(METALS), liq = R.pick(LIQS); return { metal, liq, mm: CL.round(metal.d * R.between(5.5, 8.5), 3), Vi: R.between(12.0, 15.0, 2) }; },
    prelab: [
      { q: 'Water rises from 12.4 mL to 17.9 mL when a 43.2 g stone is added. Density of the stone?', unit: 'g/mL', ans: 43.2 / 5.5, tol: 0.01 },
      { q: 'Density is an intensive property. This means it…', choices: ['depends on sample size', 'does not depend on sample size', 'only applies to liquids', 'changes with mass'], ans: 1 },
      { q: 'What volume does 15.0 g of ethanol (ρ = 0.789 g/mL) occupy?', unit: 'mL', ans: 15 / 0.789, tol: 0.01 }
    ],
    parts: [
      {
        title: 'Part A — Unknown metal', steps: ['Weigh the dry metal pellets.', 'Partly fill a 25-mL graduated cylinder with water and read the volume (bottom of the meniscus, to ±0.1 mL).', 'Tilt the cylinder, slide the metal in, tap off air bubbles and read the new volume.'],
        sim: {
          type: 'bench', title: 'Balance & graduated cylinder', instrument: 'Reading',
          actions: [
            { l: 'Weigh metal', key: 'mm', label: 'Mass of unknown metal', read: S => ({ v: CL.meas(S.mm, 0.0005, 3), u: 'g', dp: 3 }) },
            { l: 'Read initial water volume', key: 'Vi', label: 'Initial water volume', read: S => ({ v: CL.meas(S.Vi, 0.04, 1), u: 'mL', dp: 1 }) },
            { l: 'Add metal & read volume', key: 'Vf', label: 'Water + metal volume', read: (S, c, ctx) => needPrev(ctx.D, 'Vi', 'read the initial volume') || ({ v: CL.meas(S.Vi + S.mm / S.metal.d, 0.04, 1), u: 'mL', dp: 1 }) }
          ],
          visual: (S, c, last) => `<svg viewBox="0 0 120 220" class="drawing" aria-hidden="true"><path d="M40 10 V200 H80 V10" class="glass" fill="none"/><rect x="42" y="${200 - (last && last.u === 'mL' ? last.v : S.Vi) * 6.5}" width="36" height="${(last && last.u === 'mL' ? last.v : S.Vi) * 6.5 - 2}" fill="rgba(140,180,220,.45)"/>${[5, 10, 15, 20, 25].map(v => `<line x1="40" x2="52" y1="${200 - v * 6.5}" y2="${200 - v * 6.5}" class="tickline"/><text x="34" y="${204 - v * 6.5}" text-anchor="end" class="dlabel">${v}</text>`).join('')}${last && last.u === 'mL' && last.v > S.Vi + 0.5 ? '<rect x="50" y="178" width="20" height="18" rx="4" fill="#8a8f96"/>' : ''}</svg>`
        }
      },
      {
        title: 'Part B — Unknown liquid', steps: ['Weigh a clean, dry 50-mL beaker.', 'Pipet exactly 10.00 mL of the unknown liquid into the beaker and weigh it again.'],
        sim: {
          type: 'bench', title: 'Analytical balance', instrument: 'Balance (g)',
          actions: [
            { l: 'Weigh empty beaker', key: 'b0', label: 'Empty beaker', read: () => ({ v: CL.round(30 + Math.random() * 2, 3), u: 'g', dp: 3 }) },
            { l: 'Pipet 10.00 mL liquid & weigh', key: 'b1', label: 'Beaker + 10.00 mL unknown liquid', read: (S, c, ctx) => needPrev(ctx.D, 'b0', 'weigh the empty beaker') || ({ v: CL.round(ctx.D('b0') + 10 * S.liq.d * (1 + 0.0008 * CL.gauss()), 3), u: 'g', dp: 3 }) }
          ]
        }
      }
    ],
    questions: [
      { h: 'Part A — Metal' },
      { q: 'Volume of the metal sample.', unit: 'mL', ans: (S, D) => D('Vf') - D('Vi'), atol: 0.02 },
      { q: 'Density of the metal.', unit: 'g/mL', ans: (S, D) => D('mm') / (D('Vf') - D('Vi')), tol: 0.008, truth: S => S.metal.d, ttol: 0.06 },
      { q: 'Identity of the unknown metal.', choices: METALS.map(m => m.n), ans: S => METALS.indexOf(S.metal) },
      { q: 'Percent error of your metal density compared with the accepted value for its identity.', unit: '%', ans: (S, D) => Math.abs(D('mm') / (D('Vf') - D('Vi')) - S.metal.d) / S.metal.d * 100, atol: 0.4 },
      { h: 'Part B — Liquid' },
      { q: 'Density of the unknown liquid.', unit: 'g/mL', ans: (S, D) => (D('b1') - D('b0')) / 10, atol: 0.0008 },
      { q: 'Identity of the unknown liquid.', choices: LIQS.map(m => m.n), ans: S => LIQS.indexOf(S.liq) },
      { q: 'Which measurement limits the precision of your metal density, and how could you improve it?', text: true }
    ],
    key: S => [['Metal', `${S.metal.n} (${S.metal.d} g/cm³)`], ['Metal mass', S.mm.toFixed(3) + ' g'], ['Metal volume', (S.mm / S.metal.d).toFixed(2) + ' mL'], ['Liquid', `${S.liq.n} (${S.liq.d} g/mL)`]]
  });

  // ------------------------------------------------------------------ 3
  CL.lab({
    id: 'gc1-03', course: 'gc1', n: 3, title: 'Separation of a Mixture: Sand, Salt & Ammonium Chloride', time: '2.5 h', skills: 'sublimation · decanting · % composition',
    goals: ['Separate a three-component mixture using differences in physical properties.', 'Determine the mass percent of each component.', 'Calculate percent recovery and identify sources of loss.'],
    intro: `<p>A heterogeneous mixture can be separated by exploiting the different <b>physical properties</b> of its parts:</p>
      <ul><li><b>NH₄Cl</b> sublimes (solid → gas) when heated, so it leaves the dish as white fumes.</li><li><b>NaCl</b> dissolves in water; sand (SiO₂) does not. Decant the salt solution and evaporate it to recover the NaCl.</li><li><b>Sand</b> stays behind and is dried.</li></ul>
      <div class="eq">mass % = (mass of component / mass of mixture) × 100 &nbsp;&nbsp; % recovery = (Σ recovered masses / mass of mixture) × 100</div>`,
    safety: ['Heat in a fume hood — NH₄Cl fumes are irritating.', 'Hot evaporating dishes look exactly like cold ones; use crucible tongs.', 'Avoid spattering when evaporating the salt solution — heat gently.'],
    setup: R => { const fN = R.between(0.12, 0.30), fS = R.between(0.25, 0.45); return { mmix: R.between(2.0, 3.0, 4), fN, fS, fSand: 1 - fN - fS, d1: R.between(38, 46, 3), d2: R.between(38, 46, 3) }; },
    prelab: [
      { q: 'Which component of the mixture sublimes?', choices: ['NaCl', 'SiO₂ (sand)', 'NH₄Cl', 'Water'], ans: 2 },
      { q: 'A 2.50 g mixture contains 0.85 g NaCl. Mass percent of NaCl?', unit: '%', ans: 34.0, atol: 0.1 },
      { q: 'Why is the salt solution decanted rather than heated with the sand?', choices: ['Sand is soluble in hot water', 'To physically separate the dissolved NaCl from insoluble sand', 'To sublime the NaCl', 'To make the reaction go faster'], ans: 1 }
    ],
    parts: [{
      title: 'Separation procedure', steps: ['Weigh evaporating dish #1, add the mixture and weigh again.', 'Heat in the hood until no more white fumes appear (NH₄Cl sublimes). Cool and weigh.', 'Weigh evaporating dish #2. Add water to dish #1 to dissolve NaCl, decant the solution into dish #2 (repeat twice), then evaporate it to dryness and weigh.', 'Dry the wet sand left in dish #1 and weigh it.'],
      sim: {
        type: 'bench', title: 'Mixture separation bench', instrument: 'Balance (g)',
        actions: [
          { l: '1 · Weigh dish #1', key: 'd1', label: 'Evaporating dish #1 (empty)', read: S => ({ v: CL.meas(S.d1, 0.0005, 3), u: 'g', dp: 3 }) },
          { l: '2 · Add mixture & weigh', key: 'd1mix', label: 'Dish #1 + mixture', read: (S, c, ctx) => needPrev(ctx.D, 'd1', 'weigh dish #1') || ({ v: CL.round(ctx.D('d1') + S.mmix, 3), u: 'g', dp: 3 }) },
          { l: '3 · Sublime NH₄Cl, cool & weigh', key: 'd1heat', label: 'Dish #1 after subliming NH₄Cl', read: (S, c, ctx) => needPrev(ctx.D, 'd1mix', 'add and weigh the mixture') || ({ v: CL.round(ctx.D('d1mix') - S.mmix * S.fN * (0.985 + 0.015 * Math.random()), 3), u: 'g', dp: 3, note: 'White fumes of NH₄Cl rose from the dish until heating was complete.' }) },
          { l: '4 · Weigh dish #2', key: 'd2', label: 'Evaporating dish #2 (empty)', read: S => ({ v: CL.meas(S.d2, 0.0005, 3), u: 'g', dp: 3 }) },
          { l: '5 · Decant NaCl solution, evaporate, weigh #2', key: 'd2salt', label: 'Dish #2 + dry NaCl', read: (S, c, ctx) => needPrev(ctx.D, 'd2', 'weigh dish #2') || needPrev(ctx.D, 'd1heat', 'sublime the NH₄Cl') || ({ v: CL.round(ctx.D('d2') + S.mmix * S.fS * (0.955 + 0.035 * Math.random()), 3), u: 'g', dp: 3 }) },
          { l: '6 · Dry sand & weigh #1', key: 'd1sand', label: 'Dish #1 + dry sand', read: (S, c, ctx) => needPrev(ctx.D, 'd2salt', 'recover the NaCl') || ({ v: CL.round(ctx.D('d1') + S.mmix * S.fSand * (0.985 + 0.015 * Math.random()), 3), u: 'g', dp: 3 }) }
        ]
      }
    }],
    questions: [
      { q: 'Mass of the original mixture.', unit: 'g', ans: (S, D) => D('d1mix') - D('d1'), atol: 0.0015 },
      { q: 'Mass of NH₄Cl (lost on heating).', unit: 'g', ans: (S, D) => D('d1mix') - D('d1heat'), atol: 0.0015 },
      { q: 'Mass of NaCl recovered.', unit: 'g', ans: (S, D) => D('d2salt') - D('d2'), atol: 0.0015 },
      { q: 'Mass of sand recovered.', unit: 'g', ans: (S, D) => D('d1sand') - D('d1'), atol: 0.0015 },
      { q: 'Mass percent of NH₄Cl in the mixture.', unit: '%', ans: (S, D) => (D('d1mix') - D('d1heat')) / (D('d1mix') - D('d1')) * 100, atol: 0.15, truth: S => S.fN * 100, tatol: 1.5 },
      { q: 'Mass percent of NaCl.', unit: '%', ans: (S, D) => (D('d2salt') - D('d2')) / (D('d1mix') - D('d1')) * 100, atol: 0.15 },
      { q: 'Mass percent of sand.', unit: '%', ans: (S, D) => (D('d1sand') - D('d1')) / (D('d1mix') - D('d1')) * 100, atol: 0.15 },
      { q: 'Percent recovery (sum of the three masses ÷ mixture mass × 100).', unit: '%', ans: (S, D) => (D('d1mix') - D('d1heat') + D('d2salt') - D('d2') + D('d1sand') - D('d1')) / (D('d1mix') - D('d1')) * 100, atol: 0.2 },
      { q: 'Your percent recovery is probably below 100%. At which step was mass most likely lost, and why?', text: true }
    ],
    key: S => [['Mixture mass', S.mmix.toFixed(4) + ' g'], ['True % NH₄Cl', (S.fN * 100).toFixed(1) + '%'], ['True % NaCl', (S.fS * 100).toFixed(1) + '%'], ['True % sand', (S.fSand * 100).toFixed(1) + '%']]
  });

  // ------------------------------------------------------------------ 4
  const HYD = [
    { n: 'copper(II) sulfate', f: 'CuSO₄', M: 159.61, x: 5, c0: 'blue crystals', c1: 'pale gray-white powder' },
    { n: 'magnesium sulfate', f: 'MgSO₄', M: 120.37, x: 7, c0: 'colourless crystals', c1: 'white powder' },
    { n: 'barium chloride', f: 'BaCl₂', M: 208.23, x: 2, c0: 'white crystals', c1: 'white powder' },
    { n: 'cobalt(II) chloride', f: 'CoCl₂', M: 129.84, x: 6, c0: 'pink-red crystals', c1: 'blue powder' },
    { n: 'nickel(II) sulfate', f: 'NiSO₄', M: 154.76, x: 6, c0: 'green crystals', c1: 'yellow powder' },
    { n: 'zinc sulfate', f: 'ZnSO₄', M: 161.47, x: 7, c0: 'colourless crystals', c1: 'white powder' }
  ];
  const lastHeat = D => { let n = 0; for (let i = 1; i <= 10; i++) if (D.has('heat' + i)) n = i; return n ? D('heat' + n) : NaN; };
  CL.lab({
    id: 'gc1-04', course: 'gc1', n: 4, title: 'Formula of a Hydrate', time: '2 h', skills: 'heating to constant mass · mole ratios',
    goals: ['Remove water of hydration by heating a hydrate to constant mass.', 'Determine the mole ratio of water to anhydrous salt.', 'Write the formula of the hydrate and calculate its percent water.'],
    intro: `<p>A <b>hydrate</b> is an ionic compound with a fixed number of water molecules built into its crystal lattice, written as <i>salt</i>·<i>x</i>H₂O. Heating drives the water off and leaves the <b>anhydrous</b> salt:</p>
      <div class="eq">salt·xH₂O(s) → salt(s) + x H₂O(g)</div>
      <p>To be sure all of the water is gone, heat, cool and weigh repeatedly until two consecutive masses agree within 0.002 g (<b>constant mass</b>). Then</p>
      <div class="eq">x = mol H₂O / mol anhydrous salt = (m_water / 18.015) / (m_anhydrous / M_salt)</div>
      <p>Your instructor will tell you which salt your hydrate contains (shown on the procedure card). Your job is to find <i>x</i>.</p>`,
    safety: ['The crucible reaches >500 °C. Handle it only with crucible tongs and let it cool on a clay triangle or wire gauze.', 'Cobalt and nickel salts are toxic — wash your hands after the lab.', 'Heat gently at first to avoid spattering.'],
    setup: R => ({ salt: R.pick(HYD), mh: R.between(1.5, 2.5, 4), cru: R.between(18, 24, 4) }),
    prelab: [
      { q: 'A 2.000 g hydrate sample loses 0.720 g of water. What percent water is it?', unit: '%', ans: 36.0, atol: 0.1 },
      { q: 'Why must the crucible be weighed only after it has cooled to room temperature?', choices: ['Hot objects are lighter because of convection currents and buoyancy, giving false low masses', 'It is safer, but the mass would be the same', 'Hot crucibles absorb water', 'The balance cannot read above 50 g'], ans: 0 },
      { q: 'Molar mass of CuSO₄·5H₂O.', unit: 'g/mol', ans: 159.61 + 5 * 18.015, tol: 0.002 }
    ],
    parts: [{
      title: 'Dehydrate to constant mass',
      note: S => `<p><b>Your hydrate:</b> ${S.salt.n} hydrate, ${S.salt.f}·xH₂O (anhydrous molar mass ${S.salt.M} g/mol). Appearance: ${S.salt.c0}.</p>`,
      steps: ['Weigh a clean crucible and lid that have already been heated and cooled.', 'Add the hydrate and weigh again.', 'Heat strongly for 10 min, cool and weigh. Repeat until two consecutive masses agree within 0.002 g.'],
      sim: {
        type: 'bench', title: 'Crucible, burner & balance', instrument: 'Balance (g)',
        actions: [
          { l: 'Weigh crucible + lid', key: 'cru', label: 'Crucible + lid (empty)', read: S => ({ v: CL.meas(S.cru, 0.0004, 4), u: 'g', dp: 4 }) },
          { l: 'Add hydrate & weigh', key: 'cruhyd', label: 'Crucible + lid + hydrate', read: (S, c, ctx) => needPrev(ctx.D, 'cru', 'weigh the empty crucible') || ({ v: CL.round(ctx.D('cru') + S.mh, 4), u: 'g', dp: 4 }) },
          {
            l: 'Heat 10 min, cool & weigh', auto: 4, key: (c, S, out) => out.key, label: (c, S, out) => out.label,
            read: (S, c, ctx) => {
              if (!ctx.D.has('cruhyd')) return { err: 'Add and weigh the hydrate first.' };
              const h = (ctx.st.h = ctx.st.h || {}); h.heats = (h.heats || 0) + 1; ctx.save();
              const frac = [0, 0.82, 0.975, 0.9985, 1, 1, 1, 1, 1, 1, 1][Math.min(h.heats, 10)];
              const mw = S.mh * (S.salt.x * 18.015) / (S.salt.M + S.salt.x * 18.015);
              return { v: CL.round(ctx.D('cruhyd') - mw * frac + 0.0003 * CL.gauss(), 4), u: 'g', dp: 4, key: 'heat' + h.heats, label: `After heating #${h.heats}`, note: h.heats === 1 ? `The ${S.salt.c0} changed toward ${S.salt.c1}; steam was visible.` : '' };
            }
          }
        ]
      }
    }],
    questions: [
      { q: 'Mass of hydrate used.', unit: 'g', ans: (S, D) => D('cruhyd') - D('cru'), atol: 0.0002 },
      { q: 'Mass of anhydrous salt (use your final constant mass).', unit: 'g', ans: (S, D) => lastHeat(D) - D('cru'), atol: 0.0002 },
      { q: 'Mass of water driven off.', unit: 'g', ans: (S, D) => D('cruhyd') - lastHeat(D), atol: 0.0002 },
      { q: 'Moles of water.', unit: 'mol', ans: (S, D) => (D('cruhyd') - lastHeat(D)) / 18.015, tol: 0.005 },
      { q: 'Moles of anhydrous salt.', unit: 'mol', ans: (S, D) => (lastHeat(D) - D('cru')) / S.salt.M, tol: 0.005 },
      { q: 'Mole ratio x = mol H₂O / mol salt (unrounded).', ans: (S, D) => ((D('cruhyd') - lastHeat(D)) / 18.015) / ((lastHeat(D) - D('cru')) / S.salt.M), tol: 0.01, truth: S => S.salt.x, ttol: 0.06 },
      { q: 'Percent water in the hydrate (experimental).', unit: '%', ans: (S, D) => (D('cruhyd') - lastHeat(D)) / (D('cruhyd') - D('cru')) * 100, atol: 0.1 },
      { q: 'What whole number x gives the formula of your hydrate?', choices: ['1', '2', '3', '4', '5', '6', '7', '10'], ans: S => [1, 2, 3, 4, 5, 6, 7, 10].indexOf(S.salt.x) },
      { q: 'If you had stopped after the first heating, would x be too high or too low? Explain.', text: true }
    ],
    key: S => [['Salt', `${S.salt.f}·${S.salt.x}H₂O`], ['Hydrate mass', S.mh.toFixed(4) + ' g'], ['True % water', (100 * S.salt.x * 18.015 / (S.salt.M + S.salt.x * 18.015)).toFixed(2) + '%']]
  });

  // ------------------------------------------------------------------ 5
  CL.lab({
    id: 'gc1-05', course: 'gc1', n: 5, title: 'Stoichiometry & the Limiting Reactant', time: '2 h', skills: 'precipitation · gravimetry · limiting reactant',
    goals: ['Determine the limiting reactant in a mixture by testing the supernatant.', 'Measure the mass of precipitate formed.', 'Calculate the percent composition of the original salt mixture.'],
    intro: `<p>Your unknown is a solid mixture of calcium chloride dihydrate and sodium carbonate. When it dissolves in water the ions react to form insoluble calcium carbonate:</p>
      <div class="eq">CaCl₂·2H₂O(aq) + Na₂CO₃(aq) → CaCO₃(s) + 2 NaCl(aq) + 2 H₂O(l)</div>
      <p>The reactant that runs out first, the <b>limiting reactant</b>, sets how much CaCO₃ forms. Test the clear liquid above the precipitate (the supernatant) to find it. If adding CaCl₂ makes more precipitate, excess CO₃²⁻ is left, so CaCl₂·2H₂O was limiting. If adding Na₂CO₃ makes more precipitate, Na₂CO₃ was limiting.</p>
      <div class="eq">mol limiting reactant = mol CaCO₃ (1 : 1) &nbsp;&nbsp; M(CaCl₂·2H₂O) = 147.01, M(Na₂CO₃) = 105.99, M(CaCO₃) = 100.09 g/mol</div>`,
    safety: ['Goggles on. Sodium carbonate solutions are mildly basic and irritating to eyes.', 'Do not let filter paper touch the burner when drying.'],
    setup: R => { let f = R.between(0.35, 0.72); if (Math.abs(f - 0.581) < 0.05) f = f < 0.581 ? 0.50 : 0.66; return { mmix: R.between(0.900, 1.100, 4), fCa: f, fp: R.between(0.850, 0.950, 4), rec: R.between(0.955, 0.99) }; },
    prelab: [
      { q: '0.500 g CaCl₂·2H₂O and 0.500 g Na₂CO₃ are mixed. Which is limiting?', choices: ['CaCl₂·2H₂O', 'Na₂CO₃', 'Neither'], ans: 0, why: '0.500/147.01 = 3.40 mmol Ca²⁺ vs 0.500/105.99 = 4.72 mmol CO₃²⁻.' },
      { q: 'Theoretical mass of CaCO₃ from 3.40 × 10⁻³ mol of limiting reactant?', unit: 'g', ans: 3.40e-3 * 100.09, tol: 0.01 },
      { q: 'You add Na₂CO₃ to the supernatant and a precipitate forms. That means the excess ion in the supernatant was…', choices: ['CO₃²⁻', 'Ca²⁺', 'Na⁺', 'Cl⁻'], ans: 1 }
    ],
    parts: [{
      title: 'Precipitate, test and weigh', steps: ['Weigh the salt mixture and dissolve it in ~50 mL of distilled water. Stir and let the precipitate settle.', 'Test two small portions of the clear supernatant: one with 0.5 M CaCl₂, the other with 0.5 M Na₂CO₃.', 'Weigh a filter paper, filter the CaCO₃, dry it and weigh it.'],
      sim: {
        type: 'bench', title: 'Precipitation bench', instrument: 'Reading', icon: 'tube',
        actions: [
          { l: 'Weigh mixture', key: 'mmix', label: 'Mass of salt mixture', read: S => ({ v: CL.round(S.mmix, 4), u: 'g', dp: 4 }) },
          { l: 'Test supernatant + CaCl₂', key: 'testCa', label: 'Supernatant + 2 drops 0.5 M CaCl₂', read: S => { const nCa = S.mmix * S.fCa / 147.01, nC = S.mmix * (1 - S.fCa) / 105.99; return nC > nCa ? { obs: 'White precipitate forms', color: 'rgba(220,230,240,.6)', ppt: '#f4f4f4' } : { obs: 'Stays clear — no precipitate', color: 'rgba(200,225,240,.3)' }; } },
          { l: 'Test supernatant + Na₂CO₃', key: 'testCO3', label: 'Supernatant + 2 drops 0.5 M Na₂CO₃', read: S => { const nCa = S.mmix * S.fCa / 147.01, nC = S.mmix * (1 - S.fCa) / 105.99; return nCa > nC ? { obs: 'White precipitate forms', color: 'rgba(220,230,240,.6)', ppt: '#f4f4f4' } : { obs: 'Stays clear — no precipitate', color: 'rgba(200,225,240,.3)' }; } },
          { l: 'Weigh filter paper', key: 'fp', label: 'Filter paper (dry)', read: S => ({ v: CL.meas(S.fp, 0.0002, 4), u: 'g', dp: 4 }) },
          { l: 'Filter, dry & weigh', key: 'fpppt', label: 'Filter paper + dry CaCO₃', read: (S, c, ctx) => { if (!ctx.D.has('fp')) return { err: 'Weigh the filter paper first.' }; const nCa = S.mmix * S.fCa / 147.01, nC = S.mmix * (1 - S.fCa) / 105.99; return { v: CL.round(ctx.D('fp') + Math.min(nCa, nC) * 100.09 * S.rec, 4), u: 'g', dp: 4 }; } }
        ]
      }
    }],
    questions: [
      { q: 'Mass of CaCO₃ collected.', unit: 'g', ans: (S, D) => D('fpppt') - D('fp'), atol: 0.0003 },
      { q: 'Moles of CaCO₃.', unit: 'mol', ans: (S, D) => (D('fpppt') - D('fp')) / 100.09, tol: 0.005 },
      { q: 'Which reactant was limiting?', choices: ['CaCl₂·2H₂O', 'Na₂CO₃'], ans: S => (S.mmix * S.fCa / 147.01 < S.mmix * (1 - S.fCa) / 105.99 ? 0 : 1) },
      { q: 'Mass of the limiting reactant in your mixture.', unit: 'g', ans: (S, D) => (D('fpppt') - D('fp')) / 100.09 * (S.mmix * S.fCa / 147.01 < S.mmix * (1 - S.fCa) / 105.99 ? 147.01 : 105.99), tol: 0.006 },
      { q: 'Mass percent of CaCl₂·2H₂O in the mixture.', unit: '%', ans: (S, D) => { const lim = S.mmix * S.fCa / 147.01 < S.mmix * (1 - S.fCa) / 105.99; const n = (D('fpppt') - D('fp')) / 100.09; const mCa = lim ? n * 147.01 : D('mmix') - n * 105.99; return mCa / D('mmix') * 100; }, atol: 0.4, truth: S => S.fCa * 100, tatol: 5 },
      { q: 'Explain how the supernatant tests identified the limiting reactant.', text: true }
    ],
    key: S => { const nCa = S.mmix * S.fCa / 147.01, nC = S.mmix * (1 - S.fCa) / 105.99; return [['Mixture', S.mmix.toFixed(4) + ' g'], ['True % CaCl₂·2H₂O', (S.fCa * 100).toFixed(1) + '%'], ['Limiting', nCa < nC ? 'CaCl₂·2H₂O' : 'Na₂CO₃'], ['Ideal CaCO₃', (Math.min(nCa, nC) * 100.09).toFixed(4) + ' g'], ['Recovery factor', (S.rec * 100).toFixed(1) + '%']]; }
  });

  // ------------------------------------------------------------------ 6
  const FLAME = {
    Li: { n: 'Lithium (Li⁺)', c: '#d61f3a', o: 'crimson red', lines: [[670.8, 1], [610.4, 0.3]] },
    Na: { n: 'Sodium (Na⁺)', c: '#ffb21a', o: 'intense yellow-orange', lines: [[589.0, 1], [589.6, 0.9]] },
    K: { n: 'Potassium (K⁺)', c: '#c8a2e8', o: 'pale lilac / violet', lines: [[766.5, 1], [769.9, 0.9], [404.4, 0.35]] },
    Ca: { n: 'Calcium (Ca²⁺)', c: '#ff6a2a', o: 'orange-red (brick red)', lines: [[422.7, 0.6], [554, 0.45], [616.2, 0.5], [622, 0.9]] },
    Sr: { n: 'Strontium (Sr²⁺)', c: '#ff2a1a', o: 'bright scarlet red', lines: [[460.7, 0.5], [606, 0.8], [640.8, 0.7], [650.4, 0.6]] },
    Ba: { n: 'Barium (Ba²⁺)', c: '#b8e05a', o: 'pale yellow-green', lines: [[455.4, 0.5], [493.4, 0.4], [553.5, 1]] },
    Cu: { n: 'Copper (Cu²⁺)', c: '#2fd0a0', o: 'blue-green', lines: [[510.6, 0.8], [515.3, 0.9], [521.8, 1]] }
  };
  CL.lab({
    id: 'gc1-06', course: 'gc1', n: 6, title: 'Atomic Emission Spectra & Flame Tests', time: '2 h', skills: 'spectroscope · Bohr model · photon energy',
    goals: ['Measure the visible emission lines of hydrogen and relate them to Bohr-model transitions.', 'Determine the Rydberg constant graphically.', 'Identify an unknown metal ion by its flame colour and line spectrum.'],
    intro: `<p>An electrically excited atom emits light only at specific wavelengths, which form its <b>line spectrum</b>. Each line comes from an electron dropping from a higher energy level <i>n</i><sub>i</sub> to a lower one <i>n</i><sub>f</sub>. For hydrogen's visible (Balmer) series, <i>n</i><sub>f</sub> = 2:</p>
      <div class="eq">1/λ = R_H (1/n_f² − 1/n_i²) &nbsp;&nbsp;&nbsp; E_photon = hν = hc/λ</div>
      <p>where h = 6.626 × 10⁻³⁴ J·s, c = 2.998 × 10⁸ m/s and R<sub>H</sub> = 1.097 × 10⁷ m⁻¹. A plot of 1/λ against 1/n<sub>i</sub>² is a straight line with slope −R<sub>H</sub>.</p>
      <p>Metal ions in a flame emit their own characteristic lines, and the combined colour is distinctive enough to identify the ion (a <b>flame test</b>).</p>`,
    safety: ['Gas discharge tubes run at several thousand volts — do not touch the power supply while it is on.', 'Tie back hair and keep loose clothing away from the burner.', 'Dip the nichrome wire in 6 M HCl to clean it; avoid splashing the acid.'],
    setup: R => ({ unk: R.pick(Object.keys(FLAME)) }),
    prelab: [
      { q: 'Energy of one photon with λ = 500. nm.', unit: 'J', ans: 6.626e-34 * 2.998e8 / 500e-9, tol: 0.01 },
      { q: 'Which transition in hydrogen emits the longest-wavelength Balmer line?', choices: ['n = 3 → 2', 'n = 4 → 2', 'n = 6 → 2', 'n = 2 → 1'], ans: 0, why: 'The smallest energy gap gives the longest wavelength.' },
      { q: 'Frequency of light with λ = 656 nm.', unit: 's⁻¹', ans: 2.998e8 / 656e-9, tol: 0.01 }
    ],
    parts: [
      {
        title: 'Part A — Hydrogen and other gas-discharge spectra', steps: ['View each discharge tube through the spectroscope.', 'For hydrogen, click each of the four visible lines to record its wavelength. Line 1 is the longest wavelength (red).', 'Compare the hydrogen spectrum with helium and mercury.'],
        sim: { type: 'spectrum', title: 'Spectroscope', clickLog: true, spectra: [{ v: 'h', l: 'Hydrogen discharge tube', kind: 'lines', peaks: [[656.3, 1], [486.1, 0.6], [434.0, 0.35], [410.2, 0.25]] }, { v: 'he', l: 'Helium discharge tube', kind: 'lines', peaks: [[447.1, 0.4], [471.3, 0.2], [492.2, 0.2], [501.6, 0.5], [587.6, 1], [667.8, 0.5], [706.5, 0.4]] }, { v: 'hg', l: 'Mercury discharge tube', kind: 'lines', peaks: [[404.7, 0.5], [435.8, 1], [546.1, 1], [577.0, 0.6], [579.1, 0.6]] }] }
      },
      {
        title: 'Part B — Rydberg plot',
        note: '<p>Enter your four hydrogen wavelengths as 1/λ in m⁻¹ against 1/n<sub>i</sub>² (n<sub>i</sub> = 3, 4, 5, 6), or use <b>Fill from my data</b>. Record the best-fit line.</p>',
        sim: { type: 'graph', k: 'ryd', title: 'Rydberg plot', short: 'Rydberg plot', xl: '1/nᵢ²', yl: '1/λ (m⁻¹)', rows: 4, fill: (S, D) => [3, 4, 5, 6].map((n, i) => [1 / (n * n), 1 / (D('h_line' + (i + 1)) * 1e-9)]) }
      },
      {
        title: 'Part C — Flame tests', steps: ['Clean the nichrome wire loop in 6 M HCl until it imparts no colour to the flame.', 'Dip the loop in each known chloride solution and hold it in the hottest part of the flame. Record the colour.', 'Test your unknown, and view its flame through the spectroscope.'],
        sim: [{
          type: 'bench', title: 'Bunsen burner & nichrome loop', instrument: 'Flame colour',
          controls: [{ k: 's', l: 'Solution on the loop', opts: Object.keys(FLAME).map(k => ({ v: k, l: FLAME[k].n.split(' ')[0] + ' chloride (known)' })).concat([{ v: 'unk', l: 'UNKNOWN solution' }]) }],
          actions: [{ l: 'Hold in flame', key: c => 'flame_' + c.s, label: c => 'Flame colour: ' + (c.s === 'unk' ? 'unknown' : FLAME[c.s].n), read: (S, c) => { const f = FLAME[c.s === 'unk' ? S.unk : c.s]; return { obs: f.o, flame: f.c }; } }]
        }, { type: 'spectrum', title: 'Spectroscope view of the unknown flame', spectra: S => [{ v: 'unk', l: 'Unknown flame', kind: 'lines', xr: [380, 780], peaks: FLAME[S.unk].lines }] }]
      }
    ],
    questions: [
      { q: 'Measured wavelength of the red hydrogen line (line 1).', unit: 'nm', ans: (S, D) => D('h_line1'), atol: 0.6, truth: 656.3, tatol: 3 },
      { q: 'Frequency of that red line.', unit: 's⁻¹', ans: (S, D) => 2.998e8 / (D('h_line1') * 1e-9), tol: 0.006 },
      { q: 'Energy of one photon of that red line.', unit: 'J', ans: (S, D) => 6.626e-34 * 2.998e8 / (D('h_line1') * 1e-9), tol: 0.006 },
      { q: 'Energy of one mole of those photons.', unit: 'kJ/mol', ans: (S, D) => 6.626e-34 * 2.998e8 / (D('h_line1') * 1e-9) * 6.022e23 / 1000, tol: 0.006 },
      { q: 'Rydberg constant from your graph (R = −slope).', unit: 'm⁻¹', ans: (S, D) => -D('ryd_slope'), tol: 0.01, truth: 1.097e7, ttol: 0.03, needs: 'recorded best-fit line' },
      { q: 'The 486 nm line corresponds to which transition?', choices: ['n = 3 → 2', 'n = 4 → 2', 'n = 5 → 2', 'n = 6 → 2', 'n = 4 → 3'], ans: 1 },
      { q: 'Identity of the unknown metal ion.', choices: Object.keys(FLAME).map(k => FLAME[k].n), ans: S => Object.keys(FLAME).indexOf(S.unk) },
      { q: 'Why does each element produce its own unique set of lines? Use the idea of quantized energy levels.', text: true }
    ],
    key: S => [['Unknown ion', FLAME[S.unk].n + ' — ' + FLAME[S.unk].o], ['H lines', '656.3, 486.1, 434.0, 410.2 nm']]
  });

  // ------------------------------------------------------------------ 7
  const EG = ['linear', 'trigonal planar', 'tetrahedral', 'trigonal bipyramidal', 'octahedral'];
  const MG = ['linear', 'trigonal planar', 'bent', 'tetrahedral', 'trigonal pyramidal', 'trigonal bipyramidal', 'seesaw', 'T-shaped', 'octahedral', 'square pyramidal', 'square planar'];
  const VAL = { H: 1, B: 3, C: 4, N: 5, O: 6, F: 7, P: 5, S: 6, Cl: 7, Br: 7, Xe: 8, I: 7 };
  const MOLS = [
    { f: 'CO₂', center: 'C', lig: ['O', 'O'], lp: 0, mg: 0, polar: 0 },
    { f: 'BF₃', center: 'B', lig: ['F', 'F', 'F'], lp: 0, mg: 1, polar: 0 },
    { f: 'SO₂', center: 'S', lig: ['O', 'O'], lp: 1, mg: 2, polar: 1 },
    { f: 'CH₂O', center: 'C', lig: ['O', 'H', 'H'], lp: 0, mg: 1, polar: 1 },
    { f: 'CH₄', center: 'C', lig: ['H', 'H', 'H', 'H'], lp: 0, mg: 3, polar: 0 },
    { f: 'NH₃', center: 'N', lig: ['H', 'H', 'H'], lp: 1, mg: 4, polar: 1 },
    { f: 'H₂O', center: 'O', lig: ['H', 'H'], lp: 2, mg: 2, polar: 1 },
    { f: 'CCl₄', center: 'C', lig: ['Cl', 'Cl', 'Cl', 'Cl'], lp: 0, mg: 3, polar: 0 },
    { f: 'PCl₅', center: 'P', lig: ['Cl', 'Cl', 'Cl', 'Cl', 'Cl'], lp: 0, mg: 5, polar: 0 },
    { f: 'SF₄', center: 'S', lig: ['F', 'F', 'F', 'F'], lp: 1, mg: 6, polar: 1 },
    { f: 'ClF₃', center: 'Cl', lig: ['F', 'F', 'F'], lp: 2, mg: 7, polar: 1 },
    { f: 'XeF₂', center: 'Xe', lig: ['F', 'F'], lp: 3, mg: 0, polar: 0 },
    { f: 'SF₆', center: 'S', lig: ['F', 'F', 'F', 'F', 'F', 'F'], lp: 0, mg: 8, polar: 0 },
    { f: 'BrF₅', center: 'Br', lig: ['F', 'F', 'F', 'F', 'F'], lp: 1, mg: 9, polar: 1 },
    { f: 'XeF₄', center: 'Xe', lig: ['F', 'F', 'F', 'F'], lp: 2, mg: 10, polar: 0 }
  ];
  const egOf = m => ({ 2: 0, 3: 1, 4: 2, 5: 3, 6: 4 })[m.lig.length + m.lp];
  const angleOf = m => ({ 2: 180, 3: 120, 4: 109.5, 6: 90 })[m.lig.length + m.lp];
  const veOf = m => VAL[m.center] + m.lig.reduce((s, a) => s + VAL[a], 0);
  CL.lab({
    id: 'gc1-07', course: 'gc1', n: 7, title: 'Lewis Structures & Molecular Geometry (VSEPR)', time: '2 h', skills: 'model kit · VSEPR · polarity',
    goals: ['Draw Lewis structures and count electron domains around a central atom.', 'Predict electron-domain and molecular geometries with VSEPR theory.', 'Use 3D models to decide bond angles and molecular polarity.'],
    intro: `<p><b>Valence-shell electron-pair repulsion (VSEPR)</b> theory says that the electron domains around a central atom (bonds and lone pairs) spread out to be as far apart as possible. A single, double or triple bond each counts as <i>one</i> domain.</p>
      <table><tr><th>Domains</th><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td></tr><tr><th>Electron geometry</th><td>linear</td><td>trigonal planar</td><td>tetrahedral</td><td>trigonal bipyramidal</td><td>octahedral</td></tr><tr><th>Ideal angle</th><td>180°</td><td>120°</td><td>109.5°</td><td>90°, 120°</td><td>90°</td></tr></table>
      <p>The <b>molecular geometry</b> describes only the positions of the atoms. Lone pairs take up space but are "invisible" in the name: NH₃ has tetrahedral electron geometry but is <i>trigonal pyramidal</i>. In a trigonal bipyramid, lone pairs go into the roomier <b>equatorial</b> positions.</p>
      <p>A molecule is <b>polar</b> if its bond dipoles do not cancel. That happens with an asymmetric shape, or when different atoms surround the central atom.</p>`,
    safety: ['This is a dry lab — no chemical hazards. Keep model-kit pieces off the floor.'],
    setup: R => { const ids = R.shuffle(MOLS.map((_, i) => i)); const lpIds = R.shuffle(MOLS.map((m, i) => (m.lp ? i : -1)).filter(i => i >= 0)); const exp = R.shuffle([8, 9, 10, 11, 13, 14]); const ang = R.shuffle(MOLS.map((m, i) => (m.lig.length + m.lp !== 5 ? i : -1)).filter(i => i >= 0)); return { a: ids[0], b: lpIds[0], c: exp[0], d: ang[0], e: ids[1], f: lpIds[1], g: ids[2] }; },
    prelab: [
      { q: 'Total valence electrons in the Lewis structure of NH₃.', ans: 8, int: true },
      { q: 'How many electron domains surround the carbon in CO₂ (O=C=O)?', ans: 2, atol: 0, why: 'Each double bond counts as one domain.' },
      { q: 'A molecule with 4 electron domains and 2 lone pairs has which molecular geometry?', choices: MG, ans: 2 }
    ],
    parts: [{
      title: 'Build and examine the models', steps: ['Draw the Lewis structure of each species on paper first.', 'Select the species in the model kit and rotate it. Turn lone pairs on and off to see how they affect the shape.', 'Answer the analysis questions for the species assigned to you there.'],
      sim: { type: 'vsepr', title: '3D model kit', molecules: MOLS }
    }],
    questions: [
      { q: S => `Electron-domain geometry of <b>${MOLS[S.a].f}</b>.`, choices: EG, ans: S => egOf(MOLS[S.a]) },
      { q: S => `Molecular geometry of <b>${MOLS[S.a].f}</b>.`, choices: MG, ans: S => MOLS[S.a].mg },
      { q: S => `Molecular geometry of <b>${MOLS[S.b].f}</b>.`, choices: MG, ans: S => MOLS[S.b].mg },
      { q: S => `Molecular geometry of <b>${MOLS[S.c].f}</b>.`, choices: MG, ans: S => MOLS[S.c].mg },
      { q: S => `Ideal bond angle predicted by the electron geometry of <b>${MOLS[S.d].f}</b>.`, unit: '°', ans: S => angleOf(MOLS[S.d]), atol: 0.6 },
      { q: S => `Is <b>${MOLS[S.e].f}</b> polar?`, choices: ['Nonpolar', 'Polar'], ans: S => MOLS[S.e].polar },
      { q: S => `Number of lone pairs on the central atom of <b>${MOLS[S.f].f}</b>.`, ans: S => MOLS[S.f].lp, int: true },
      { q: S => `Total valence electrons in the Lewis structure of <b>${MOLS[S.g].f}</b>.`, ans: S => veOf(MOLS[S.g]), int: true },
      { q: 'XeF₄ and SF₄ both have four fluorine atoms, but different shapes and polarities. Explain why.', text: true }
    ],
    key: S => ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(k => [`Species ${k}`, `${MOLS[S[k]].f}: ${EG[egOf(MOLS[S[k]])]} / ${MG[MOLS[S[k]].mg]}, ${MOLS[S[k]].polar ? 'polar' : 'nonpolar'}, ${MOLS[S[k]].lp} LP, ${veOf(MOLS[S[k]])} e⁻`])
  });

  // ------------------------------------------------------------------ 8
  const SPH = [{ n: 'Aluminum', c: 0.897 }, { n: 'Titanium', c: 0.523 }, { n: 'Iron', c: 0.449 }, { n: 'Copper', c: 0.385 }, { n: 'Tin', c: 0.228 }, { n: 'Lead', c: 0.129 }];
  CL.lab({
    id: 'gc1-08', course: 'gc1', n: 8, title: 'Calorimetry: Specific Heat & Heat of Neutralization', time: '2.5 h', skills: 'coffee-cup calorimeter · q = mcΔT',
    goals: ['Use a coffee-cup calorimeter and temperature probe.', 'Determine the specific heat of an unknown metal and identify it.', 'Measure the enthalpy of neutralization of a strong acid with a strong base.'],
    intro: `<p>In an insulated calorimeter, heat lost by one part of the system is gained by another:</p>
      <div class="eq">q = m c ΔT &nbsp;&nbsp;&nbsp; q_metal = −(m_water c_water + C_cal) ΔT_water &nbsp;&nbsp; c_water = 4.184 J/(g·°C)</div>
      <p>C<sub>cal</sub> is the heat capacity of the calorimeter itself (given on your bench card). Read the final temperature as the highest temperature reached on the curve. Heat leaks out slowly, so extrapolate the cooling line back to the moment of mixing if the curve slopes down.</p>
      <p>For neutralization, H⁺(aq) + OH⁻(aq) → H₂O(l). The heat released per mole of water formed is ΔH<sub>neut</sub> = q<sub>rxn</sub>/n, where q<sub>rxn</sub> = −(m<sub>soln</sub>c + C<sub>cal</sub>)ΔT. Assume the solutions have a density of 1.00 g/mL and c = 4.184 J/(g·°C).</p>
      <table><tr><th>Metal</th>${SPH.map(m => `<td>${m.n}</td>`).join('')}</tr><tr><th>c (J/g·°C)</th>${SPH.map(m => `<td>${m.c}</td>`).join('')}</tr></table>`,
    safety: ['Boiling water and hot metal cause burns — use tongs.', '1.0 M HCl and 1.0 M NaOH are corrosive. Rinse spills with plenty of water.'],
    setup: R => { const metal = R.pick(SPH); return { metal, mm: R.between(30, 50, 3), cup: R.between(3.8, 4.4, 3), mw: R.between(48.5, 52.5, 3), Tw: R.between(20.0, 23.0, 2), Th: R.between(99.0, 99.9, 1), Ccal: R.int(12, 30), Tw2: R.between(20.5, 23.5, 2) }; },
    prelab: [
      { q: '25.0 g of water warms from 21.0 °C to 28.5 °C. Heat absorbed?', unit: 'J', ans: 25 * 4.184 * 7.5, tol: 0.01 },
      { q: 'Moles of water formed when 50.0 mL 1.00 M HCl is mixed with 50.0 mL 1.00 M NaOH.', unit: 'mol', ans: 0.05, tol: 0.005 },
      { q: 'Neutralization is exothermic. The sign of ΔH_neut is…', choices: ['positive', 'negative', 'zero'], ans: 1 }
    ],
    parts: [
      {
        title: 'Part A — Specific heat of an unknown metal',
        note: S => `<p>Bench card: calorimeter heat capacity <b>C<sub>cal</sub> = ${S.Ccal} J/°C</b>.</p>`,
        steps: ['Weigh the metal and heat it in a boiling-water bath for 10 min. Record the bath temperature.', 'Weigh the empty cup, add ~50 mL of water and weigh again.', 'Start data collection and transfer the hot metal into the cup when t = 60 s. Read the maximum temperature.'],
        sim: [{
          type: 'bench', title: 'Balance & bath thermometer', instrument: 'Reading',
          actions: [
            { l: 'Weigh metal', key: 'mm', label: 'Mass of metal', read: S => ({ v: CL.meas(S.mm, 0.0005, 3), u: 'g', dp: 3 }) },
            { l: 'Read boiling bath temperature', key: 'Th', label: 'Temperature of hot metal (bath)', read: S => ({ v: CL.meas(S.Th, 0.05, 1), u: '°C', dp: 1 }) },
            { l: 'Weigh empty cup', key: 'cup', label: 'Empty calorimeter cups', read: S => ({ v: CL.meas(S.cup, 0.0005, 3), u: 'g', dp: 3 }) },
            { l: 'Weigh cup + water', key: 'cupw', label: 'Cups + water', read: S => ({ v: CL.meas(S.cup + S.mw, 0.0005, 3), u: 'g', dp: 3 }) }
          ]
        }, {
          type: 'series', title: 'Temperature probe — metal into water', x: { l: 'Time', u: 's', max: 300, dt: 2 }, y: { l: 'Temperature', u: '°C', dp: 2 }, noise: 0.015,
          run: S => { const k = S.mm * S.metal.c, w = S.mw * 4.184 + S.Ccal; const Tf = (k * S.Th + w * S.Tw) / (k + w); return { key: 'calA', l: 'Part A: metal + water', short: 'Metal + water', f: t => (t < 60 ? S.Tw : Tf - (Tf - S.Tw) * Math.exp(-(t - 60) / 10) - 0.0012 * (t - 60)), note: 'Metal is added at t = 60 s.' }; }
        }]
      },
      {
        title: 'Part B — Heat of neutralization',
        steps: ['Place 50.0 mL of 1.00 M HCl in the dry calorimeter. Measure 50.0 mL of 1.00 M NaOH at the same temperature.', 'Start data collection. At t = 60 s pour in the NaOH, stir, and record the maximum temperature.'],
        sim: { type: 'series', title: 'Temperature probe — HCl + NaOH', x: { l: 'Time', u: 's', max: 300, dt: 2 }, y: { l: 'Temperature', u: '°C', dp: 2 }, noise: 0.015, run: S => { const dT = 0.05 * 55840 / (100 * 4.184 + S.Ccal); return { key: 'calB', l: 'Part B: HCl + NaOH', short: 'HCl + NaOH', f: t => (t < 60 ? S.Tw2 : S.Tw2 + dT * (1 - Math.exp(-(t - 60) / 7)) - 0.0018 * (t - 60)) }; } }
      }
    ],
    questions: [
      { h: 'Part A' },
      { q: 'Temperature change of the water, ΔT = T_final − T_initial.', unit: '°C', ans: S => { const k = S.mm * S.metal.c, w = S.mw * 4.184 + S.Ccal; return (k * S.Th + w * S.Tw) / (k + w) - S.Tw; }, atol: 0.15 },
      { q: 'Heat gained by the water and calorimeter.', unit: 'J', ans: (S, D) => { const k = S.mm * S.metal.c, w = S.mw * 4.184 + S.Ccal; const dT = (k * S.Th + w * S.Tw) / (k + w) - S.Tw; return ((D('cupw') - D('cup')) * 4.184 + S.Ccal) * dT; }, tol: 0.05, needs: 'cup and water masses' },
      { q: 'Specific heat of the metal.', unit: 'J/(g·°C)', ans: S => S.metal.c, tol: 0.07 },
      { q: 'Identity of the metal.', choices: SPH.map(m => m.n), ans: S => SPH.indexOf(S.metal) },
      { h: 'Part B' },
      { q: 'ΔT for the neutralization.', unit: '°C', ans: S => 0.05 * 55840 / (100 * 4.184 + S.Ccal), atol: 0.2 },
      { q: 'Heat absorbed by the solution and calorimeter (positive value).', unit: 'J', ans: S => 0.05 * 55840, tol: 0.05 },
      { q: 'ΔH of neutralization per mole of water (include the sign).', unit: 'kJ/mol', ans: -55.84, tol: 0.06 },
      { q: 'Name two sources of error in coffee-cup calorimetry and say whether each makes ΔH_neut too large or too small in magnitude.', text: true }
    ],
    key: S => { const k = S.mm * S.metal.c, w = S.mw * 4.184 + S.Ccal; const Tf = (k * S.Th + w * S.Tw) / (k + w); return [['Metal', `${S.metal.n} (c = ${S.metal.c})`], ['T water / T hot', S.Tw + ' / ' + S.Th + ' °C'], ['T final (A)', Tf.toFixed(2) + ' °C'], ['ΔT (B)', (0.05 * 55840 / (100 * 4.184 + S.Ccal)).toFixed(2) + ' °C'], ['C_cal', S.Ccal + ' J/°C']]; }
  });

  // ------------------------------------------------------------------ 9
  CL.lab({
    id: 'gc1-09', course: 'gc1', n: 9, title: "Hess's Law: Enthalpy of Formation of MgO", time: '2.5 h', skills: 'calorimetry · enthalpy · Hess’s law',
    goals: ['Measure the enthalpies of reaction of Mg and of MgO with hydrochloric acid.', "Combine reactions with Hess's law to find ΔH°f of MgO.", 'Compare your result with the accepted value.'],
    intro: `<p>Burning magnesium in a calorimeter is impractical, but Hess's law lets you find its enthalpy indirectly. ΔH for an overall reaction is the sum of ΔH for any series of steps that add up to it:</p>
      <div class="eq">(1) Mg(s) + 2 HCl(aq) → MgCl₂(aq) + H₂(g) &nbsp;&nbsp; ΔH₁ (measure)<br>(2) MgO(s) + 2 HCl(aq) → MgCl₂(aq) + H₂O(l) &nbsp;&nbsp; ΔH₂ (measure)<br>(3) H₂(g) + ½ O₂(g) → H₂O(l) &nbsp;&nbsp; ΔH₃ = −285.8 kJ/mol<br>Target: Mg(s) + ½ O₂(g) → MgO(s) &nbsp;&nbsp; ΔH = ΔH₁ − ΔH₂ + ΔH₃</div>
      <p>For each run, q<sub>rxn</sub> = −(m<sub>soln</sub> c + C<sub>cal</sub>)ΔT, with 100.0 mL of 1.0 M HCl (100.0 g, c = 4.184 J/g·°C). Then ΔH = q<sub>rxn</sub>/n.</p><p>Accepted ΔH°f(MgO) = −601.6 kJ/mol.</p>`,
    safety: ['Mg reacts vigorously with acid and releases flammable H₂ — no flames nearby.', 'HCl is corrosive.', 'MgO powder is a dust irritant; avoid breathing it.'],
    setup: R => ({ mMg: R.between(0.200, 0.300, 4), mMgO: R.between(0.450, 0.650, 4), Ccal: R.int(15, 32), dH1: R.between(-466, -458, 1), dH2: R.between(-150, -143, 1), T1: R.between(20.5, 22.5, 2), T2: R.between(20.5, 22.5, 2) }),
    prelab: [
      { q: 'Reaction A has ΔH = −120 kJ. What is ΔH for the reverse of A?', unit: 'kJ', ans: 120, atol: 0.1 },
      { q: 'Moles in 0.250 g Mg.', unit: 'mol', ans: 0.25 / 24.305, tol: 0.005 },
      { q: "Hess's law works because enthalpy is a…", choices: ['path function', 'state function', 'kinetic quantity', 'catalyst'], ans: 1 }
    ],
    parts: [{
      title: 'Measure ΔH₁ and ΔH₂', note: S => `<p>Bench card: C<sub>cal</sub> = <b>${S.Ccal} J/°C</b>; 100.0 mL of 1.0 M HCl per run.</p>`,
      steps: ['Weigh the Mg ribbon (or MgO powder).', 'Put 100.0 mL of 1.0 M HCl in the calorimeter and start recording.', 'Add the solid at t = 30 s, stir and record until the temperature peaks and begins to fall.'],
      sim: [{
        type: 'bench', title: 'Analytical balance', instrument: 'Balance (g)',
        actions: [{ l: 'Weigh Mg ribbon', key: 'mMg', label: 'Mass of Mg', read: S => ({ v: CL.round(S.mMg, 4), u: 'g', dp: 4 }) }, { l: 'Weigh MgO', key: 'mMgO', label: 'Mass of MgO', read: S => ({ v: CL.round(S.mMgO, 4), u: 'g', dp: 4 }) }]
      }, {
        type: 'series', title: 'Calorimeter temperature', x: { l: 'Time', u: 's', max: 360, dt: 3 }, y: { l: 'Temperature', u: '°C', dp: 2 }, noise: 0.015,
        controls: [{ k: 'r', l: 'Reaction', opts: [{ v: 1, l: 'Rxn 1: Mg + HCl' }, { v: 2, l: 'Rxn 2: MgO + HCl' }] }],
        run: (S, c) => { const n = c.r === 1 ? S.mMg / 24.305 : S.mMgO / 40.304; const dH = c.r === 1 ? S.dH1 : S.dH2; const dT = -n * dH * 1000 / (100 * 4.184 + S.Ccal); const T0 = c.r === 1 ? S.T1 : S.T2; const tau = c.r === 1 ? 22 : 12; return { key: 'hess' + c.r, l: c.r === 1 ? 'Rxn 1: Mg + HCl' : 'Rxn 2: MgO + HCl', short: c.r === 1 ? 'Mg + HCl' : 'MgO + HCl', f: t => (t < 30 ? T0 : T0 + dT * (1 - Math.exp(-(t - 30) / tau)) - 0.0015 * (t - 30)) }; }
      }]
    }],
    questions: [
      { q: 'ΔT for reaction 1 (Mg).', unit: '°C', ans: S => -(S.mMg / 24.305) * S.dH1 * 1000 / (100 * 4.184 + S.Ccal), atol: 0.2 },
      { q: 'q_rxn for reaction 1 (include the sign).', unit: 'J', ans: S => (S.mMg / 24.305) * S.dH1 * 1000, tol: 0.04 },
      { q: 'ΔH₁ per mole of Mg.', unit: 'kJ/mol', ans: S => S.dH1, tol: 0.04 },
      { q: 'ΔT for reaction 2 (MgO).', unit: '°C', ans: S => -(S.mMgO / 40.304) * S.dH2 * 1000 / (100 * 4.184 + S.Ccal), atol: 0.15 },
      { q: 'ΔH₂ per mole of MgO.', unit: 'kJ/mol', ans: S => S.dH2, tol: 0.05 },
      { q: "ΔH°f of MgO from Hess's law.", unit: 'kJ/mol', ans: S => S.dH1 - S.dH2 - 285.8, tol: 0.03 },
      { q: 'Why was reaction 2 reversed when combining the equations?', choices: ['MgO must appear as a product in the target equation', 'Reaction 2 is endothermic', 'Hess’s law always reverses the second step', 'To cancel O₂'], ans: 0 },
      { q: 'Calculate your percent error relative to −601.6 kJ/mol and discuss the largest source of error.', text: true }
    ],
    key: S => [['ΔH₁ (set)', S.dH1 + ' kJ/mol'], ['ΔH₂ (set)', S.dH2 + ' kJ/mol'], ['ΔHf MgO', (S.dH1 - S.dH2 - 285.8).toFixed(1) + ' kJ/mol'], ['C_cal', S.Ccal + ' J/°C']]
  });

  // ------------------------------------------------------------------ 10
  CL.lab({
    id: 'gc1-10', course: 'gc1', n: 10, title: 'Gas Laws: The Gas Constant & Boyle’s Law', time: '2 h', skills: 'eudiometer · Dalton’s law · PV = nRT',
    goals: ['Collect hydrogen gas over water and correct for water vapour pressure.', 'Determine the ideal gas constant R and the molar volume of H₂ at STP.', 'Verify Boyle’s law with a pressure sensor and syringe.'],
    intro: `<p>Magnesium reacts with acid to produce hydrogen, which is collected over water in an inverted gas tube (eudiometer):</p>
      <div class="eq">Mg(s) + 2 HCl(aq) → MgCl₂(aq) + H₂(g) &nbsp;&nbsp; n(H₂) = n(Mg)</div>
      <p>The collected gas is a mixture of H₂ and water vapour. By <b>Dalton's law</b>: P<sub>H₂</sub> = P<sub>bar</sub> − P<sub>H₂O</sub> (when the water levels inside and outside the tube are equal).</p>${vpTable()}
      <div class="eq">R = PV / nT &nbsp;&nbsp; (1 atm = 760 torr; T in K) &nbsp;&nbsp;&nbsp; V_STP = V × (P/760) × (273.15/T)</div>
      <p><b>Boyle's law:</b> for a fixed amount of gas at constant T, PV = constant, so a graph of P against 1/V is a straight line through the origin with slope nRT.</p>`,
    safety: ['Concentrated HCl (6 M) is corrosive; wear gloves when filling the eudiometer.', 'Hydrogen is flammable.'],
    setup: R => ({ mMg: R.between(0.0300, 0.0450, 4), T: R.between(20.0, 25.0, 1), Pbar: R.between(742, 772, 1), Pk: R.between(99.5, 103.0, 2) }),
    prelab: [
      { q: 'Water vapour pressure at 22 °C is 19.8 torr. Barometric pressure is 755.0 torr. P(H₂)?', unit: 'torr', ans: 735.2, atol: 0.1 },
      { q: 'Convert 735.2 torr to atm.', unit: 'atm', ans: 735.2 / 760, tol: 0.003 },
      { q: 'At constant T, if the volume of a gas is halved, the pressure…', choices: ['halves', 'doubles', 'is unchanged', 'quadruples'], ans: 1 }
    ],
    parts: [
      {
        title: 'Part A — Molar volume of hydrogen', steps: ['Weigh a 3–4 cm piece of Mg ribbon and cage it in copper wire.', 'Add 10 mL of 6 M HCl to the eudiometer, fill it with water, invert it in a beaker of water and insert the Mg.', 'When the reaction stops, equalize the water levels and read the gas volume. Record the water temperature and barometric pressure.'],
        sim: {
          type: 'bench', title: 'Eudiometer station', instrument: 'Reading', icon: 'tube',
          actions: [
            { l: 'Weigh Mg ribbon', key: 'mMg', label: 'Mass of Mg ribbon', read: S => ({ v: CL.round(S.mMg, 4), u: 'g', dp: 4 }) },
            { l: 'Read gas volume', key: 'Vgas', label: 'Volume of gas collected', read: S => ({ v: CL.meas(S.mMg / 24.305 * 0.0820574 * (S.T + 273.15) / ((S.Pbar - C.pH2O(S.T)) / 760) * 1000, 0.02, 2), u: 'mL', dp: 2, color: 'rgba(200,225,240,.25)', gas: true }) },
            { l: 'Read water temperature', key: 'T', label: 'Water temperature', read: S => ({ v: CL.meas(S.T, 0.04, 1), u: '°C', dp: 1 }) },
            { l: 'Read barometer', key: 'Pbar', label: 'Barometric pressure', read: S => ({ v: CL.round(S.Pbar, 1), u: 'torr', dp: 1 }) }
          ]
        }
      },
      {
        title: 'Part B — Boyle’s law', steps: ['Connect a 20-mL syringe set at 10.0 mL to the pressure sensor.', 'Move the plunger to each volume and record the pressure.', 'Plot P against 1/V and record the best-fit line.'],
        sim: [{
          type: 'bench', title: 'Syringe & gas pressure sensor', instrument: 'Pressure (kPa)', icon: 'meter',
          controls: [{ k: 'V', l: 'Syringe volume', type: 'range', min: 5, max: 20, step: 1, val: 10, u: 'mL', auto: [5, 8, 10, 12, 15, 20] }],
          actions: [{ l: 'Record pressure', key: c => 'P_' + c.V, label: c => `Pressure at ${c.V}.0 mL`, read: (S, c) => ({ v: CL.meas(S.Pk * 10 / c.V, 0.08, 1), u: 'kPa', dp: 1 }) }]
        }, { type: 'graph', k: 'boyle', title: 'Boyle’s law', short: 'Boyle plot', xl: 'V (mL)', yl: 'P (kPa)', tx: ['x', '1/x'], autoTx: '1/x', rows: 6, fill: (S, D) => [5, 8, 10, 12, 15, 20].map(v => [v, D('P_' + v)]) }]
      }
    ],
    questions: [
      { h: 'Part A' },
      { q: 'Moles of H₂ produced.', unit: 'mol', ans: (S, D) => D('mMg') / 24.305, tol: 0.003 },
      { q: 'Water vapour pressure at your temperature.', unit: 'torr', ans: (S, D) => C.pH2O(D('T')), atol: 0.35 },
      { q: 'Partial pressure of H₂.', unit: 'torr', ans: (S, D) => D('Pbar') - C.pH2O(D('T')), atol: 0.4 },
      { q: 'Experimental value of R.', unit: 'L·atm/(mol·K)', ans: (S, D) => ((D('Pbar') - C.pH2O(D('T'))) / 760) * (D('Vgas') / 1000) / ((D('mMg') / 24.305) * (D('T') + 273.15)), tol: 0.006, truth: 0.08206, ttol: 0.02 },
      { q: 'Molar volume of H₂ at STP (0 °C, 1 atm).', unit: 'L/mol', ans: (S, D) => (D('Vgas') / 1000) * ((D('Pbar') - C.pH2O(D('T'))) / 760) * (273.15 / (D('T') + 273.15)) / (D('mMg') / 24.305), tol: 0.006, truth: 22.41, ttol: 0.02 },
      { h: 'Part B' },
      { q: 'Slope of your P vs 1/V graph (kPa·mL).', ans: (S, D) => D('boyle_slope'), tol: 0.01, truth: S => S.Pk * 10, ttol: 0.03, needs: 'recorded best-fit line using 1/x' },
      { q: 'Moles of air in the syringe (slope = nRT; R = 8.314 L·kPa/(mol·K), T = 295 K; convert mL to L).', unit: 'mol', ans: (S, D) => D('boyle_slope') / 1000 / (8.314 * 295), tol: 0.02 },
      { q: 'Why must the water levels inside and outside the eudiometer be equal when you read the volume?', text: true }
    ],
    key: S => [['Mg mass', S.mMg + ' g'], ['T / P', S.T + ' °C, ' + S.Pbar + ' torr'], ['Ideal V(H₂)', (S.mMg / 24.305 * 0.0820574 * (S.T + 273.15) / ((S.Pbar - C.pH2O(S.T)) / 760) * 1000).toFixed(2) + ' mL'], ['Boyle nRT', (S.Pk * 10).toFixed(1) + ' kPa·mL']]
  });

  // ------------------------------------------------------------------ 11
  const cNaOH = (D, k) => D(k + '_m') / 204.22 / ((D(k + '_Vf') - D(k + '_Vi')) / 1000);
  const cMean = D => mean(['k1', 'k2', 'k3'].map(k => cNaOH(D, k)).filter(isFinite).length >= 2 ? ['k1', 'k2', 'k3'].map(k => cNaOH(D, k)).filter(isFinite) : [NaN]);
  CL.lab({
    id: 'gc1-11', course: 'gc1', n: 11, title: 'Acid–Base Titration: Standardizing NaOH & Analyzing Vinegar', time: '3 h', skills: 'buret · primary standard · molarity',
    goals: ['Standardize a NaOH solution against the primary standard KHP.', 'Read a buret to ±0.01 mL and detect a phenolphthalein endpoint.', 'Determine the molarity and mass percent of acetic acid in vinegar.'],
    intro: `<p>In a <b>titration</b>, a solution of known concentration (the titrant) is added from a buret until it has exactly reacted with the analyte. That point is the equivalence point, which you detect as the <b>endpoint</b> when the indicator changes colour.</p>
      <p>Solid NaOH absorbs water and CO₂, so a NaOH solution's concentration must be <b>standardized</b> against a <i>primary standard</i>: potassium hydrogen phthalate (KHP, KHC₈H₄O₄, 204.22 g/mol), a monoprotic acid.</p>
      <div class="eq">KHC₈H₄O₄ + NaOH → KNaC₈H₄O₄ + H₂O &nbsp;&nbsp; M_NaOH = (g KHP / 204.22) / L NaOH</div>
      <div class="eq">CH₃COOH + NaOH → CH₃COONa + H₂O &nbsp;&nbsp; M_HOAc = M_NaOH × V_NaOH / V_vinegar</div>
      <p>Phenolphthalein is colourless in acid and turns pink above pH ≈ 8.2. The endpoint is the <b>first faint pink that lasts 30 s</b>. A deep magenta solution means you overshot.</p>`,
    safety: ['NaOH is corrosive to skin and especially eyes — goggles at all times.', 'Lower the buret to eye level to fill it, below your face; use a funnel and remove it before titrating.'],
    setup: R => ({ Cb: R.between(0.0950, 0.1080, 4), mk: [0, 1, 2].map(() => R.between(0.40, 0.55, 4)), Cv: R.between(0.75, 0.92, 3) }),
    prelab: [
      { q: 'Moles of KHP in 0.5105 g.', unit: 'mol', ans: 0.5105 / 204.22, tol: 0.003 },
      { q: '0.5105 g KHP requires 24.65 mL NaOH. Molarity of the NaOH?', unit: 'M', ans: 0.5105 / 204.22 / 0.02465, tol: 0.004 },
      { q: 'Why is phenolphthalein, not methyl orange, used for a weak acid–strong base titration?', choices: ['Its colour change (pH 8.2–10) brackets the basic equivalence-point pH', 'It is cheaper', 'It changes colour at pH 4', 'It reacts with NaOH'], ans: 0 }
    ],
    parts: [
      {
        title: 'Part A — Standardize NaOH with KHP (3 trials)',
        steps: ['Each flask contains a weighed sample of KHP dissolved in ~50 mL water with 3 drops phenolphthalein (the mass is recorded for you).', 'Read and record the initial buret reading.', 'Add NaOH quickly at first, then dropwise as the pink colour starts to linger. Stop at the first permanent faint pink.', 'Record the final buret reading. Repeat for trials 2 and 3.'],
        sim: S => ({
          type: 'titration', title: 'Titration: KHP with NaOH', titrant: { l: `NaOH (aq), ~0.1 M — to be standardized`, C: S.Cb, kind: 'base', short: 'NaOH' }, indicator: 'phenolphthalein',
          trials: ['k1', 'k2', 'k3'].map((k, i) => ({ k, l: `Trial ${i + 1} — KHP`, desc: `Flask contains <b>${S.mk[i].toFixed(4)} g KHP</b> + ~50 mL water + phenolphthalein.`, logs: [{ k: k + '_m', l: `Trial ${i + 1}: mass of KHP`, v: S.mk[i], u: 'g', dp: 4 }], sol: { V0: 50, sb: S.mk[i] / 204.22, wa: [{ n: S.mk[i] / 204.22, pKa: [2.95, 5.41] }] } }))
        })
      },
      {
        title: 'Part B — Acetic acid in vinegar (2 trials)',
        steps: ['Pipet 3.00 mL of vinegar into a flask, add ~40 mL water and 3 drops phenolphthalein.', 'Titrate with your standardized NaOH to the first permanent faint pink. Repeat.'],
        sim: S => ({
          type: 'titration', title: 'Titration: vinegar with NaOH', titrant: { l: 'NaOH (aq), your standardized solution', C: S.Cb, kind: 'base', short: 'NaOH' }, indicator: 'phenolphthalein',
          trials: ['v1', 'v2'].map((k, i) => ({ k, l: `Vinegar trial ${i + 1}`, desc: '3.00 mL vinegar + ~40 mL water + phenolphthalein.', sol: { V0: 43, wa: [{ n: S.Cv * 3e-3, pKa: [4.76] }] } }))
        })
      }
    ],
    questions: [
      { h: 'Part A' },
      { q: 'Moles of KHP in trial 1.', unit: 'mol', ans: (S, D) => D('k1_m') / 204.22, tol: 0.002 },
      { q: 'Molarity of NaOH from trial 1.', unit: 'M', ans: (S, D) => cNaOH(D, 'k1'), tol: 0.004, truth: S => S.Cb, ttol: 0.012 },
      { q: 'Molarity of NaOH from trial 2.', unit: 'M', ans: (S, D) => cNaOH(D, 'k2'), tol: 0.004, truth: S => S.Cb, ttol: 0.012 },
      { q: 'Molarity of NaOH from trial 3.', unit: 'M', ans: (S, D) => cNaOH(D, 'k3'), tol: 0.004, truth: S => S.Cb, ttol: 0.012 },
      { q: 'Mean molarity of NaOH (use all good trials).', unit: 'M', ans: (S, D) => cMean(D), tol: 0.004, truth: S => S.Cb, ttol: 0.012 },
      { h: 'Part B' },
      { q: 'Moles of acetic acid in vinegar trial 1.', unit: 'mol', ans: (S, D) => cMean(D) * (D('v1_Vf') - D('v1_Vi')) / 1000, tol: 0.006 },
      { q: 'Mean molarity of acetic acid in the vinegar.', unit: 'M', ans: (S, D) => mean(['v1', 'v2'].map(k => cMean(D) * (D(k + '_Vf') - D(k + '_Vi')) / 3.00)), tol: 0.006, truth: S => S.Cv, ttol: 0.02 },
      { q: 'Mass/volume percent of acetic acid (g per 100 mL).', unit: '% (w/v)', ans: (S, D) => mean(['v1', 'v2'].map(k => cMean(D) * (D(k + '_Vf') - D(k + '_Vi')) / 3.00)) * 60.05 / 10, tol: 0.008 },
      { q: 'If air bubbles in the buret tip escaped during a KHP trial, would your NaOH molarity be too high or too low? Explain.', text: true }
    ],
    key: S => [['[NaOH] true', S.Cb.toFixed(4) + ' M'], ['KHP masses', S.mk.map(m => m.toFixed(4)).join(', ') + ' g'], ['Ideal V (KHP)', S.mk.map(m => (m / 204.22 / S.Cb * 1000).toFixed(2)).join(', ') + ' mL'], ['[HOAc]', S.Cv + ' M'], ['Ideal V (vinegar)', (S.Cv * 3 / S.Cb).toFixed(2) + ' mL'], ['% (w/v)', (S.Cv * 6.005).toFixed(2) + '%']]
  });

  // ------------------------------------------------------------------ 12
  const blue1 = C.bands([[630, 1, 27], [585, 0.2, 22], [410, 0.09, 30]]);
  CL.lab({
    id: 'gc1-12', course: 'gc1', n: 12, title: "Spectrophotometry & Beer's Law: Dye in a Sports Drink", time: '2 h', skills: 'spectrophotometer · calibration curve · dilution',
    goals: ['Record an absorption spectrum and choose the analytical wavelength.', "Prepare a Beer's-law calibration curve from standards.", 'Determine the concentration of FD&C Blue 1 in a beverage.'],
    intro: `<p>A coloured solution absorbs some wavelengths of visible light. <b>Beer's law</b> relates absorbance to concentration:</p>
      <div class="eq">A = ε b c &nbsp;&nbsp; (ε = molar absorptivity, b = path length 1.00 cm, c = mol/L)</div>
      <p>Measure at the wavelength of maximum absorbance (λ<sub>max</sub>). That is where the method is most sensitive and least affected by small wavelength errors. First, zero (blank) the instrument with a cuvette of distilled water at the chosen wavelength.</p>
      <p>Standards are made by diluting a stock solution of Blue 1 (2.00 × 10⁻⁵ M): 2.00, 4.00, 6.00 and 8.00 mL of stock, each diluted to 20.00 mL.</p>
      <div class="eq">M₁V₁ = M₂V₂ &nbsp;&nbsp;&nbsp; c_unknown = (A_unknown − intercept) / slope</div><p>Molar mass of FD&C Blue 1 = 792.85 g/mol.</p>`,
    safety: ['Handle cuvettes by the frosted sides only, and wipe them with lens tissue.', 'Food dyes stain — wear gloves.'],
    setup: R => ({ eps: R.between(1.26e5, 1.34e5, 0), cu: R.between(2.5e-6, 7.0e-6) }),
    prelab: [
      { q: 'Concentration of the standard made from 6.00 mL of 2.00 × 10⁻⁵ M stock diluted to 20.00 mL.', unit: 'M', ans: 6e-6, tol: 0.005 },
      { q: 'A solution has A = 0.520 in a 1.00-cm cell with ε = 1.30 × 10⁵ M⁻¹cm⁻¹. Concentration?', unit: 'M', ans: 0.52 / 1.3e5, tol: 0.01 },
      { q: 'A blue solution looks blue because it absorbs mainly…', choices: ['blue light', 'orange/red light', 'green light', 'no light'], ans: 1 }
    ],
    parts: [{
      title: 'Spectrum, calibration and unknown',
      steps: ['Scan the most concentrated standard to find λmax.', 'Set the wavelength to λmax and zero the instrument with the blank.', 'Measure the absorbance of each standard and of the sports drink.', 'Graph absorbance against concentration and record the best-fit line.'],
      sim: [{
        type: 'spectro', title: 'Spectrophotometer', l0: 500,
        samples: S => [{ v: 'blank', l: 'Blank (distilled water)', blank: true }].concat([2, 4, 6, 8].map((mL, i) => ({ v: 's' + (i + 1), l: `Standard ${i + 1} (${mL}.00 mL stock / 20.00 mL)`, A: l => S.eps * blue1(l) * mL * 1e-6 }))).concat([{ v: 'unk', l: 'Sports drink (unknown)', A: l => S.eps * blue1(l) * S.cu + 0.004 }])
      }, { type: 'graph', k: 'beer', title: "Beer's-law calibration", short: 'Calibration', xl: 'Concentration (M)', yl: 'Absorbance', rows: 5, fill: (S, D) => [[0, 0]].concat([1, 2, 3, 4].map(i => [i * 2e-6, D('A_s' + i)])) }]
    }],
    questions: [
      { q: 'λmax of FD&C Blue 1 from your spectrum.', unit: 'nm', ans: 630, atol: 5 },
      { q: 'Concentration of standard 3.', unit: 'M', ans: 6e-6, tol: 0.004 },
      { q: 'Slope of your calibration line (this is ε·b).', unit: 'M⁻¹', ans: (S, D) => D('beer_slope'), tol: 0.01, truth: S => S.eps, ttol: 0.05, needs: 'recorded best-fit line' },
      { q: 'Concentration of Blue 1 in the sports drink.', unit: 'M', ans: (S, D) => (D('A_unk') - D('beer_int')) / D('beer_slope'), tol: 0.015, truth: S => S.cu, ttol: 0.06, needs: 'unknown absorbance and calibration line' },
      { q: 'Mass of Blue 1 in a 591-mL (20 oz) bottle.', unit: 'mg', ans: (S, D) => (D('A_unk') - D('beer_int')) / D('beer_slope') * 0.591 * 792.85 * 1000, tol: 0.02 },
      { q: 'If you had measured all standards at 580 nm instead of λmax, how would the slope change, and would the unknown concentration still be correct?', text: true }
    ],
    key: S => [['ε at 630 nm', S.eps.toFixed(0) + ' M⁻¹cm⁻¹'], ['Unknown c', S.cu.toExponential(3) + ' M'], ['Ideal A(unknown)', (S.eps * S.cu).toFixed(3)], ['mg per 591 mL', (S.cu * 0.591 * 792.85 * 1000).toFixed(3)]]
  });
})();
