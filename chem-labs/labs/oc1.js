/* Organic Chemistry I — virtual lab definitions */
(function () {
  'use strict';
  const C = CL.chem;
  CL.course({ id: 'oc1', code: 'CHEM 221L', title: 'Organic Chemistry I', short: 'Organic I', color: '#7A3EA8', blurb: 'Purification and separation techniques, chromatography, IR spectroscopy, substitution and elimination reactions, stereochemistry.' });
  const mean = a => (a.length && a.every(isFinite) ? a.reduce((x, y) => x + y, 0) / a.length : NaN);

  // ------------------------------------------------------------------ 1
  const MPC = [{ k: 'ba', n: 'Benzoic acid', mp: [122, 123] }, { k: 'nap', n: '2-Naphthol', mp: [121, 123] }, { k: 'acn', n: 'Acetanilide', mp: [113, 115] }, { k: 'flu', n: 'Fluorene', mp: [114, 116] }, { k: 'urea', n: 'Urea', mp: [132, 134] }, { k: 'cin', n: 'trans-Cinnamic acid', mp: [133, 134] }];
  const mpRead = (S, s, rate) => {
    const u = S.unk; let lo, hi;
    if (s === 'unk' || s === u.k) { lo = u.mp[0] - 0.4; hi = u.mp[1] + 0.2; }
    else { const o = MPC.find(m => m.k === s); const dep = 10 + (CL.hash(u.k + s) % 9); lo = Math.min(u.mp[0], o.mp[0]) - dep; hi = lo + 5 + (CL.hash(s + u.k) % 4); }
    const lag = 0.35 * rate, w = 0.3 * rate;
    return [CL.round(lo + lag + 0.3 * CL.gauss(), 1), CL.round(hi + lag + w + 0.3 * CL.gauss(), 1)];
  };
  CL.lab({
    id: 'oc1-01', course: 'oc1', n: 1, title: 'Melting Point & Identification by Mixed Melting Point', time: '2 h', skills: 'melting-point apparatus · purity · eutectics',
    goals: ['Determine an accurate melting range with a melting-point apparatus.', 'Explain how impurities depress and broaden a melting range.', 'Identify an unknown solid by mixed melting points.'],
    intro: `<p>A pure crystalline solid melts sharply, over 1–2 °C. Impurities disrupt the crystal lattice, so an impure sample melts at a <b>lower</b> temperature and over a <b>broader</b> range (melting-point depression).</p>
      <p>Two different compounds can have nearly the same melting point. To tell them apart, grind the unknown 1 : 1 with a known standard. If they are the same compound, the mixture melts sharply at the same temperature. If they are different, each acts as an impurity in the other, and the mixture melts low and broad.</p>
      <p>Heat quickly to about 15 °C below the expected melting point, then at <b>1–2 °C/min</b>. Faster heating makes the thermometer lag behind the sample, which gives readings that are too high and too broad.</p>
      <table><tr><th>Standard</th>${MPC.map(m => `<td>${m.n}</td>`).join('')}</tr><tr><th>mp (°C)</th>${MPC.map(m => `<td>${m.mp[0]}–${m.mp[1]}</td>`).join('')}</tr></table>`,
    safety: ['The heating block reaches 250 °C. Let it cool before inserting new capillaries.', 'Dispose of used capillaries in the broken-glass box.'],
    setup: R => ({ unk: R.pick(MPC) }),
    prelab: [
      { q: 'A sample melts at 118–122 °C; the pure compound melts at 122–123 °C. The sample is…', choices: ['pure', 'impure', 'a different compound'], ans: 1 },
      { q: 'Heating at 10 °C/min near the melting point gives readings that are…', choices: ['too low and narrow', 'too high and broad', 'unaffected'], ans: 1 },
      { q: 'An unknown mixed 1:1 with benzoic acid melts at 109–115 °C. The unknown is…', choices: ['benzoic acid', 'not benzoic acid'], ans: 1 }
    ],
    parts: [{
      title: 'Melting-point determinations', steps: ['Pack 2–3 mm of finely powdered sample into a capillary.', 'Measure the melting range of your unknown at 1–2 °C/min.', 'Prepare 1:1 mixtures of the unknown with each standard whose melting point is close, and measure each one.'],
      sim: {
        type: 'bench', title: 'Melting-point apparatus', instrument: 'Melting range', icon: 'meter',
        controls: [{ k: 's', l: 'Capillary', opts: [{ v: 'unk', l: 'Unknown alone' }].concat(MPC.map(m => ({ v: m.k, l: `Unknown + ${m.n} (1:1)` }))) }, { k: 'r', l: 'Heating rate near mp', opts: [{ v: 1, l: '1 °C/min' }, { v: 2, l: '2 °C/min' }, { v: 10, l: '10 °C/min (fast)' }], val: 2, auto: [10, 2] }],
        actions: [{ l: 'Heat & observe melting', read: (S, c) => { const [lo, hi] = mpRead(S, c.s, c.r); const lab = c.s === 'unk' ? 'Unknown' : 'Unknown + ' + MPC.find(m => m.k === c.s).n; return { obs: `${lo.toFixed(1)}–${hi.toFixed(1)} °C`, logs: [{ k: `mp_${c.s}_lo`, l: `${lab}: melting begins (${c.r} °C/min)`, v: lo, u: '°C', dp: 1 }, { k: `mp_${c.s}_hi`, l: `${lab}: melting complete (${c.r} °C/min)`, v: hi, u: '°C', dp: 1 }] }; } }]
      }
    }],
    questions: [
      { q: 'Onset of melting of your unknown (heated at 1–2 °C/min).', unit: '°C', ans: (S, D) => D('mp_unk_lo'), atol: 0.11, truth: S => S.unk.mp[0] - 0.4, tatol: 1.5 },
      { q: 'End of the melting range of your unknown.', unit: '°C', ans: (S, D) => D('mp_unk_hi'), atol: 0.11, truth: S => S.unk.mp[1] + 0.2, tatol: 2 },
      { q: 'Identity of the unknown.', choices: MPC.map(m => m.n), ans: S => MPC.indexOf(S.unk) },
      { q: 'Why did the mixtures with the other standards melt lower and over a broader range?', choices: ['Each compound acted as an impurity in the other', 'The mixtures were wet', 'The mixtures decomposed', 'Mixing raises the melting point'], ans: 0 },
      { q: 'Compare your 10 °C/min and 2 °C/min results for the same capillary contents and explain the difference.', text: true }
    ],
    key: S => [['Unknown', `${S.unk.n} (${S.unk.mp.join('–')} °C)`]]
  });

  // ------------------------------------------------------------------ 2
  const SOLTEST = { water: ['Water', 'Insoluble', 'Dissolves completely near boiling'], etoh: ['Ethanol', 'Dissolves readily at room temperature', 'Dissolves'], hex: ['Hexane', 'Insoluble', 'Still insoluble at boiling'], tol: ['Toluene', 'Partly soluble', 'Dissolves'] };
  CL.lab({
    id: 'oc1-02', course: 'oc1', n: 2, title: 'Recrystallization: Purifying Acetanilide', time: '3 h', skills: 'solvent selection · hot filtration · % recovery',
    goals: ['Choose a recrystallization solvent from solubility tests.', 'Purify crude acetanilide by recrystallization.', 'Evaluate purity (melting point) and percent recovery.'],
    intro: `<p>Recrystallization purifies a solid because solubility changes with temperature. A good solvent dissolves the compound <b>poorly when cold</b> but <b>well when hot</b>, and keeps impurities either dissolved or completely undissolved.</p>
      <ol><li>Dissolve the crude solid in the <b>minimum</b> amount of boiling solvent.</li><li>Add decolorizing charcoal if the solution is coloured, then do a <b>hot gravity filtration</b> to remove insoluble material.</li><li>Cool <b>slowly</b> to room temperature, then in ice. Slow growth gives large, pure crystals.</li><li>Collect the crystals by vacuum filtration and rinse with a little <b>ice-cold</b> solvent.</li></ol>
      <div class="eq">% recovery = (mass of pure crystals / mass of crude) × 100</div><p>Pure acetanilide melts at 113–115 °C. Some product always stays dissolved in the cold solvent (the mother liquor), so recovery is never 100%.</p>`,
    safety: ['Use a hot plate, never a flame, with organic solvents.', 'Add charcoal only to a solution that is slightly below boiling, or it will foam over.', 'Acetanilide is harmful if swallowed.'],
    setup: R => ({ m0: R.between(1.80, 2.20, 3) }),
    prelab: [
      { q: 'A compound dissolves in solvent X at room temperature. Is X a good recrystallization solvent?', choices: ['Yes', 'No — too much product would stay dissolved when cold'], ans: 1 },
      { q: '2.00 g of crude solid gives 1.52 g of pure crystals. % recovery?', unit: '%', ans: 76, atol: 0.1 },
      { q: 'Why rinse the crystals with ice-cold solvent rather than room-temperature solvent?', choices: ['To minimize redissolving the product', 'To dissolve the product faster', 'To remove the charcoal', 'It does not matter'], ans: 0 }
    ],
    parts: [
      { title: 'Part A — Solvent selection', steps: ['Put ~50 mg of crude acetanilide in each of four test tubes.', 'Add 1 mL of each solvent at room temperature and record the solubility. Then heat to boiling and record again.'], sim: { type: 'bench', title: 'Solubility tests', instrument: 'Observation', icon: 'tube', controls: [{ k: 's', l: 'Solvent', opts: Object.entries(SOLTEST).map(([v, a]) => ({ v, l: a[0] })) }, { k: 't', l: 'Temperature', opts: [{ v: 0, l: 'Room temperature' }, { v: 1, l: 'Boiling' }] }], actions: [{ l: 'Observe', key: c => `sol_${c.s}_${c.t}`, label: c => `Acetanilide in ${SOLTEST[c.s][0]} (${c.t ? 'hot' : 'cold'})`, read: (S, c) => { const o = SOLTEST[c.s][1 + c.t]; return { obs: o, color: /Insoluble|insoluble|Partly/.test(o) ? 'rgba(220,220,225,.4)' : 'rgba(210,230,245,.3)', ppt: /Insoluble|insoluble/.test(o) ? '#e8e2d0' : /Partly/.test(o) ? '#efe9da' : null }; } }] } },
      {
        title: 'Part B — Recrystallize the crude product', sim: S => ({
          type: 'synth', k: 'rx', title: 'Recrystallization procedure', sm: { name: 'crude acetanilide', MW: 135.17, mass: S.m0, label: 'Crude acetanilide (tan, contains a coloured impurity and some insoluble grit)' }, product: { name: 'pure acetanilide', MW: 135.17, mp: [113, 115], ratio: 1 }, base: 0.80,
          steps: [
            { k: 'solv', l: 'Recrystallization solvent:', opts: [{ v: 'water', l: 'Water', y: 1, p: 1 }, { v: 'etoh', l: 'Ethanol', y: 0.35, p: 0.98, note: 'Most of the product stayed dissolved even in ice.' }, { v: 'hex', l: 'Hexane', fail: 'The acetanilide never dissolved, so nothing was purified.' }, { v: 'tol', l: 'Toluene', y: 0.6, p: 0.97, note: 'Recovery was poor because the product is too soluble cold.' }] },
            { k: 'vol', l: 'Amount of boiling solvent:', opts: [{ v: 'min', l: 'Just enough to dissolve the solid', y: 1, p: 1 }, { v: 'x2', l: 'About twice the minimum', y: 0.72, p: 1 }, { v: 'x5', l: 'A large excess (5×)', y: 0.3, p: 1, note: 'Few crystals appeared on cooling.' }] },
            { k: 'char', l: 'Decolorizing:', opts: [{ v: 'yes', l: 'Add a spatula-tip of charcoal to the hot solution', y: 0.97, p: 1 }, { v: 'no', l: 'Skip the charcoal', y: 1, p: 0.93, note: 'The crystals were tan, not white.' }] },
            { k: 'filt', l: 'Remove insolubles:', opts: [{ v: 'hot', l: 'Hot gravity filtration through fluted paper', y: 1, p: 1 }, { v: 'vac', l: 'Vacuum-filter the hot solution', y: 0.82, p: 1, note: 'The solution cooled in the filter flask and crystals clogged the funnel.' }, { v: 'none', l: 'Skip filtration', y: 1, p: 0.9, note: 'Grit and charcoal ended up in the product.' }] },
            { k: 'cool', l: 'Cooling:', opts: [{ v: 'slow', l: 'Cool slowly to room temperature, then 10 min in ice', y: 1, p: 1 }, { v: 'crash', l: 'Plunge the hot flask straight into ice', y: 1.02, p: 0.93, note: 'A fine powder crashed out, trapping impurities.' }] },
            { k: 'col', l: 'Collection:', opts: [{ v: 'cold', l: 'Vacuum filtration, rinse with 2 mL ice-cold water', y: 1, p: 1 }, { v: 'warm', l: 'Vacuum filtration, rinse with 10 mL room-temperature water', y: 0.84, p: 1 }, { v: 'norinse', l: 'Vacuum filtration, no rinse', y: 1, p: 0.95 }] }
          ]
        })
      }
    ],
    questions: [
      { q: 'Best recrystallization solvent for acetanilide (from Part A).', choices: ['Water', 'Ethanol', 'Hexane', 'Toluene'], ans: 0 },
      { q: 'Percent recovery.', unit: '%', ans: (S, D) => D('rx_mprod') / D('rx_msm') * 100, atol: 0.2, needs: 'a completed recrystallization' },
      { q: 'Onset of the melting range of your purified product.', unit: '°C', ans: (S, D) => D('rx_mplo'), atol: 0.5, truth: 112.5, tatol: 2 },
      { q: 'Why is the minimum amount of hot solvent used?', choices: ['To maximize recovery — excess solvent keeps product dissolved when cold', 'To make the solution boil faster', 'To remove coloured impurities', 'To lower the melting point'], ans: 0 },
      { q: 'Why does slow cooling give purer crystals?', choices: ['Slow growth excludes impurities from the lattice', 'It dissolves impurities', 'It increases the melting point of impurities', 'It evaporates the solvent'], ans: 0 },
      { q: 'Explain why 100% recovery is impossible, even with perfect technique.', text: true }
    ],
    key: S => [['Crude mass', S.m0 + ' g'], ['Best-choice recovery', '≈ 80%']]
  });

  // ------------------------------------------------------------------ 3
  CL.lab({
    id: 'oc1-03', course: 'oc1', n: 3, title: 'Acid–Base Extraction of a Three-Component Mixture', time: '3 h', skills: 'separatory funnel · pKa · liquid–liquid extraction',
    goals: ['Separate a carboxylic acid, an amine and a neutral compound by liquid–liquid extraction.', 'Use acid–base reactions to move compounds between organic and aqueous layers.', 'Recover each component and determine the composition of the mixture.'],
    intro: `<p>Your mixture contains <b>benzoic acid</b> (an acid, pKa 4.2), <b>ethyl 4-aminobenzoate</b> (an amine base, conjugate-acid pKa ≈ 2.5) and <b>naphthalene</b> (neutral), dissolved in an organic solvent.</p>
      <ul><li>Washing with aqueous <b>HCl</b> protonates the amine to an ammonium salt, which is ionic and moves into the aqueous layer.</li><li>Washing with aqueous <b>NaOH or NaHCO₃</b> deprotonates the acid to a carboxylate salt, which also moves into water.</li><li>The neutral compound stays in the organic layer. Dry it with anhydrous Na₂SO₄ and evaporate the solvent.</li></ul>
      <p>Each extract is then neutralized to precipitate the original compound: acidify the carboxylate (to pH 2) and basify the ammonium salt (to pH 12). Which layer is on top depends on density: dichloromethane (1.33 g/mL) sinks below water, and diethyl ether (0.71 g/mL) floats on it.</p>`,
    safety: ['Vent the separatory funnel often — NaHCO₃ releases CO₂ and pressure builds quickly.', 'Diethyl ether is extremely flammable; dichloromethane is a suspected carcinogen. Work in the hood.', 'Never discard any layer until you are certain the product is safe.'],
    setup: R => { const fA = R.between(0.25, 0.40), fB = R.between(0.25, 0.40); return { m0: R.between(1.40, 1.60, 3), fA, fB, fN: 1 - fA - fB, rec: [R.between(0.88, 0.95), R.between(0.86, 0.94), R.between(0.88, 0.96)] }; },
    prelab: [
      { q: 'Which reagent extracts the amine into the aqueous layer?', choices: ['3 M HCl', '3 M NaOH', 'Saturated NaCl', 'Water'], ans: 0 },
      { q: 'With dichloromethane as the solvent, the aqueous layer is on…', choices: ['top', 'bottom'], ans: 0 },
      { q: 'Benzoate ion is converted back into benzoic acid by adding…', choices: ['HCl', 'NaOH', 'Na₂SO₄', 'NaHCO₃'], ans: 0 }
    ],
    parts: [{
      title: 'Plan and run the extraction', note: '<p>Design the sequence. The outcome reflects every choice you make.</p>',
      sim: S => ({
        type: 'synth', k: 'ex', title: 'Separatory funnel workflow', sm: { name: 'three-component mixture', mass: S.m0, label: 'Mixture of benzoic acid, ethyl 4-aminobenzoate and naphthalene' }, product: { name: 'components' },
        steps: [
          { k: 'solv', l: 'Dissolve the mixture in:', opts: [{ v: 'dcm', l: 'Dichloromethane (d 1.33)', y: 1 }, { v: 'ether', l: 'Diethyl ether (d 0.71)', y: 1 }, { v: 'etoh', l: 'Ethanol', y: 0, fail: 1 }] },
          { k: 'w1', l: 'First extraction (3 × 10 mL):', opts: [{ v: 'hcl', l: '3 M HCl', y: 1 }, { v: 'naoh', l: '3 M NaOH', y: 1 }, { v: 'nahco3', l: 'Saturated NaHCO₃', y: 1 }, { v: 'water', l: 'Water', y: 0.5 }] },
          { k: 'w2', l: 'Second extraction (3 × 10 mL):', opts: [{ v: 'naoh', l: '3 M NaOH', y: 1 }, { v: 'nahco3', l: 'Saturated NaHCO₃', y: 1 }, { v: 'hcl', l: '3 M HCl', y: 0.99 }, { v: 'water', l: 'Water', y: 0.5 }] },
          { k: 'keep', l: 'The organic layer in your funnel is the…', opts: [{ v: 'bottom', l: 'Bottom layer', y: 1 }, { v: 'top', l: 'Top layer', y: 0.99 }] },
          { k: 'dry', l: 'Before evaporating the organic layer:', opts: [{ v: 'na2so4', l: 'Dry over anhydrous Na₂SO₄ and decant', y: 1 }, { v: 'none', l: 'Evaporate it directly', y: 0.9 }] },
          { k: 'recA', l: 'To recover the acid from its basic extract:', opts: [{ v: 'hcl', l: 'Add 6 M HCl to pH 2, cool, vacuum-filter', y: 1 }, { v: 'naoh', l: 'Add more NaOH, cool, filter', y: 0.1 }] },
          { k: 'recB', l: 'To recover the amine from its acidic extract:', opts: [{ v: 'naoh', l: 'Add 6 M NaOH to pH 12, cool, vacuum-filter', y: 1 }, { v: 'hcl', l: 'Add more HCl, cool, filter', y: 0.1 }] }
        ],
        custom: (S, ch, opts, m0) => {
          const lines = [], logs = [{ k: 'ex_mmix', l: 'Mass of mixture', v: m0, u: 'g', dp: 3 }];
          if (ch.solv === 'etoh') return { lines: ['<span class="bad">Ethanol mixes completely with water — no layers formed, so nothing could be separated.</span>'], logs, summary: 'failed — ethanol is water-miscible' };
          const washes = [ch.w1, ch.w2];
          const getB = washes.includes('hcl'), getA = washes.includes('naoh') || washes.includes('nahco3');
          const orgOK = (ch.solv === 'dcm' && ch.keep === 'bottom') || (ch.solv === 'ether' && ch.keep === 'top');
          let mA = 0, mB = 0, mN = 0;
          if (getA) mA = ch.recA === 'hcl' ? m0 * S.fA * S.rec[0] : 0;
          if (getB) mB = ch.recB === 'naoh' ? m0 * S.fB * S.rec[1] : 0;
          if (orgOK) { mN = m0 * S.fN * S.rec[2] + (getA ? 0 : m0 * S.fA * 0.9) + (getB ? 0 : m0 * S.fB * 0.9); if (ch.dry === 'none') mN *= 1.07; }
          if (!getA) lines.push('No basic wash was used, so benzoic acid stayed in the organic layer.');
          if (!getB) lines.push('No acidic wash was used, so the amine stayed in the organic layer.');
          if (getA && ch.recA !== 'hcl') lines.push('<span class="warn">Adding more base left the benzoate dissolved — no benzoic acid precipitated.</span>');
          if (getB && ch.recB !== 'naoh') lines.push('<span class="warn">Adding more acid left the ammonium salt dissolved — no amine precipitated.</span>');
          if (!orgOK) lines.push(`<span class="bad">With ${ch.solv === 'dcm' ? 'dichloromethane the organic layer is on the bottom' : 'ether the organic layer is on top'} — you discarded it, and the neutral compound with it.</span>`);
          if (ch.dry === 'none' && orgOK) lines.push('<span class="warn">The "neutral" residue was wet and oily.</span>');
          lines.push(`<span class="good">Recovered: benzoic acid ${mA.toFixed(3)} g · ethyl 4-aminobenzoate ${mB.toFixed(3)} g · neutral residue ${mN.toFixed(3)} g.</span>`);
          logs.push({ k: 'ex_macid', l: 'Benzoic acid recovered (dry)', v: CL.round(mA, 3), u: 'g', dp: 3 }, { k: 'ex_mbase', l: 'Ethyl 4-aminobenzoate recovered (dry)', v: CL.round(mB, 3), u: 'g', dp: 3 }, { k: 'ex_mneut', l: 'Neutral fraction recovered (dry)', v: CL.round(mN, 3), u: 'g', dp: 3 });
          return { lines, logs, summary: `acid ${mA.toFixed(3)} g, amine ${mB.toFixed(3)} g, neutral ${mN.toFixed(3)} g` };
        }
      })
    }],
    questions: [
      { q: 'Mass percent of benzoic acid in the mixture (based on what you recovered).', unit: '%', ans: (S, D) => D('ex_macid') / D('ex_mmix') * 100, atol: 0.2, truth: S => S.fA * S.rec[0] * 100, tatol: 3 },
      { q: 'Mass percent of ethyl 4-aminobenzoate.', unit: '%', ans: (S, D) => D('ex_mbase') / D('ex_mmix') * 100, atol: 0.2, truth: S => S.fB * S.rec[1] * 100, tatol: 3 },
      { q: 'Mass percent of naphthalene.', unit: '%', ans: (S, D) => D('ex_mneut') / D('ex_mmix') * 100, atol: 0.2, truth: S => S.fN * S.rec[2] * 100, tatol: 3 },
      { q: 'Total percent recovery.', unit: '%', ans: (S, D) => (D('ex_macid') + D('ex_mbase') + D('ex_mneut')) / D('ex_mmix') * 100, atol: 0.3 },
      { q: 'Why does the amine dissolve in aqueous HCl?', choices: ['It is protonated to an ionic ammonium salt', 'HCl is an organic solvent', 'The amine reacts to form an amide', 'It is oxidized'], ans: 0 },
      { q: 'Why might NaHCO₃ be preferred over NaOH to extract a carboxylic acid?', choices: ['It is a weaker base, so it extracts carboxylic acids but not less acidic compounds such as phenols', 'It is a stronger base', 'It does not produce gas', 'It is not basic'], ans: 0 },
      { q: 'Write balanced equations for the reaction of benzoic acid with NaOH and for the regeneration of benzoic acid with HCl.', text: true }
    ],
    key: S => [['Mixture', S.m0 + ' g'], ['True %', `acid ${(S.fA * 100).toFixed(1)}, amine ${(S.fB * 100).toFixed(1)}, neutral ${(S.fN * 100).toFixed(1)}`], ['Recovery factors', S.rec.map(r => (r * 100).toFixed(0) + '%').join(', ')]]
  });

  // ------------------------------------------------------------------ 4
  const ant = (A, B, Cc) => T => Math.pow(10, A - B / (Cc + T));
  const Pc = ant(6.84130, 1201.53, 222.65), Pt = ant(6.95464, 1344.8, 219.482);
  const bubble = x => { let lo = 60, hi = 125; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (x * Pc(m) + (1 - x) * Pt(m) > 760) hi = m; else lo = m; } return (lo + hi) / 2; };
  function distill(fc, stages) {
    let nc = 30 * fc * 0.779 / 84.16, nt = 30 * (1 - fc) * 0.867 / 92.14;
    const pts = [], fr = [[0, 0], [0, 0], [0, 0]];
    let V = 0;
    while (V < 25) {
      const x0 = nc / (nc + nt); let x = x0, xTop = x0, y = x0;
      for (let s = 0; s < stages; s++) { const T = bubble(x); const a = Pc(T) / Pt(T); y = a * x / (1 + (a - 1) * x); xTop = x; x = y; }
      const T = bubble(xTop);
      const dV = 0.1; const vm = y * 84.16 / 0.779 + (1 - y) * 92.14 / 0.867; const dn = dV / vm;
      nc = Math.max(0, nc - dn * y); nt = Math.max(0, nt - dn * (1 - y));
      const fi = V < 8 ? 0 : V < 16 ? 1 : 2; fr[fi][0] += dn * y * 84.16; fr[fi][1] += dn * (1 - y) * 92.14;
      if (Math.abs(V / 0.5 - Math.round(V / 0.5)) < 1e-6) pts.push([CL.round(V, 2), T]);
      V = CL.round(V + dV, 4);
    }
    return { pts, fr: fr.map(f => f[0] / (f[0] + f[1])) };
  }
  const interpPts = (pts, x) => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (pts[i][0] >= x) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); } return pts[pts.length - 1][1]; };
  CL.lab({
    id: 'oc1-04', course: 'oc1', n: 4, title: 'Simple & Fractional Distillation with GC Analysis', time: '3 h', skills: 'distillation curves · Raoult’s law · gas chromatography',
    goals: ['Separate a cyclohexane–toluene mixture by simple and by fractional distillation.', 'Interpret temperature–volume distillation curves.', 'Use gas chromatography to compare the purity of the fractions.'],
    intro: `<p>An ideal liquid mixture's vapour is richer in the more volatile component (Raoult's and Dalton's laws). One vaporization–condensation cycle is a <b>theoretical plate</b>. Simple distillation provides about one plate. A packed fractionating column provides several, so it separates liquids with close boiling points much better.</p>
      <p>Cyclohexane boils at 80.7 °C and toluene at 110.6 °C. In a good fractional distillation the head temperature stays near 81 °C while cyclohexane distils, rises sharply, then levels off near 110 °C. The volume where it rises tells you how much cyclohexane was in the pot.</p>
      <p><b>Gas chromatography:</b> the more volatile, less polar cyclohexane elutes first. Peak area % approximates mass %.</p>`,
    safety: ['Never heat a closed system, and never distil to dryness.', 'Add boiling chips before heating.', 'Cyclohexane and toluene are flammable; toluene is toxic. No flames.'],
    setup: R => { const fc = R.between(0.40, 0.62, 3); return { fc, simp: distill(fc, 2), frac: distill(fc, 5) }; },
    prelab: [
      { q: 'Which component is enriched in the first distillate?', choices: ['Cyclohexane (lower bp)', 'Toluene (higher bp)', 'Neither'], ans: 0 },
      { q: 'A fractional distillation of 30.0 mL shows the sharp temperature rise at 14.5 mL. Approximate volume % cyclohexane?', unit: '%', ans: 48.3, atol: 0.3 },
      { q: 'Why is a fractionating column more effective than simple distillation?', choices: ['It provides many vaporization–condensation cycles (theoretical plates)', 'It heats the liquid faster', 'It cools the vapour more', 'It removes water'], ans: 0 }
    ],
    parts: [
      {
        title: 'Distillation curves', steps: ['Place 30.0 mL of the mixture and a boiling chip in the distilling flask.', 'Heat so that distillate collects at about 1 drop per second. Record the head temperature against the volume collected.', 'Collect fractions A (0–8 mL), B (8–16 mL) and C (16–25 mL). Repeat with the fractionating column packed.'],
        sim: { type: 'series', title: 'Head thermometer', x: { l: 'Volume of distillate', u: 'mL', max: 25, dt: 0.5 }, y: { l: 'Head temperature', u: '°C', dp: 1, min: 75, max: 115 }, noise: 0.15, controls: [{ k: 'm', l: 'Apparatus', opts: [{ v: 'simp', l: 'Simple distillation' }, { v: 'frac', l: 'Fractional distillation (packed column)' }] }], run: (S, c) => ({ key: 'dist_' + c.m, l: c.m === 'simp' ? 'Simple distillation' : 'Fractional distillation', short: c.m === 'simp' ? 'Simple' : 'Fractional', f: v => interpPts(S[c.m].pts, v) }) }
      },
      { title: 'GC of the fractions', sim: S => ({ type: 'spectrum', title: 'Gas chromatograms', spectra: [['simp', 'Simple'], ['frac', 'Fractional']].flatMap(([m, n]) => ['A', 'B', 'C'].map((f, i) => ({ v: m + f, l: `${n} — fraction ${f}`, kind: 'chrom', tmax: 5, peaks: [[2.10, 3 * S[m].fr[i] + 0.002, 0.05], [3.62, 3 * (1 - S[m].fr[i]) + 0.002, 0.06]] }))) }) }
    ],
    questions: [
      { q: 'Head temperature at the start of the fractional distillation (first 1 mL).', unit: '°C', ans: S => interpPts(S.frac.pts, 1), atol: 1.2 },
      { q: 'Head temperature at the start of the simple distillation.', unit: '°C', ans: S => interpPts(S.simp.pts, 1), atol: 1.2 },
      { q: 'From the fractional curve, the volume of cyclohexane in the original 30.0 mL mixture.', unit: 'mL', ans: S => S.fc * 30, atol: 2.0 },
      { q: 'GC area % cyclohexane in simple-distillation fraction A.', unit: '%', ans: S => 100 * S.simp.fr[0], atol: 1.5 },
      { q: 'GC area % cyclohexane in fractional-distillation fraction A.', unit: '%', ans: S => 100 * S.frac.fr[0], atol: 1.5 },
      { q: 'Which method gave the better separation?', choices: ['Simple distillation', 'Fractional distillation', 'They were equivalent'], ans: 1 },
      { q: 'Explain, using the idea of theoretical plates, why fraction B of the fractional distillation is an intermediate mixture.', text: true }
    ],
    key: S => [['Cyclohexane', (S.fc * 100).toFixed(1) + ' vol % (' + (S.fc * 30).toFixed(1) + ' mL)'], ['Fraction A %C6H12 (simple/frac)', (S.simp.fr[0] * 100).toFixed(1) + ' / ' + (S.frac.fr[0] * 100).toFixed(1)]]
  });

  // ------------------------------------------------------------------ 5
  const ANAL = { ibu: ['Ibuprofen', 0.30, 'Ibu'], asp: ['Aspirin', 0.42, 'Asp'], apap: ['Acetaminophen', 0.55, 'APAP'], caf: ['Caffeine', 0.62, 'Caf'] };
  const COMBOS = [['asp', 'apap', 'caf'], ['apap'], ['ibu'], ['asp', 'caf'], ['apap', 'caf'], ['asp'], ['ibu', 'caf']];
  const comboName = c => c.map(k => ANAL[k][0]).join(' + ');
  const TLCSOL = [{ v: 'hex', l: 'Hexane', e: 0.05 }, { v: 'h3', l: '3 : 1 hexane / ethyl acetate', e: 0.30 }, { v: 'h1', l: '1 : 1 hexane / ethyl acetate', e: 0.45 }, { v: 'ea', l: 'Ethyl acetate + 0.5% acetic acid', e: 0.60 }];
  CL.lab({
    id: 'oc1-05', course: 'oc1', n: 5, title: 'Thin-Layer Chromatography of Analgesics', time: '2 h', skills: 'TLC · Rf · polarity',
    goals: ['Spot, develop and visualize TLC plates.', 'Calculate Rf values and relate them to polarity.', 'Identify the active ingredients of an unknown analgesic tablet.'],
    intro: `<p>In TLC, compounds move up a polar silica-gel plate carried by a less polar solvent. Polar compounds bind tightly to silica and move only a short distance. Non-polar compounds travel farther.</p>
      <div class="eq">R_f = distance travelled by spot / distance travelled by solvent front</div>
      <p>A more polar solvent moves <i>every</i> spot farther (higher Rf). The best solvent spreads the spots out between Rf 0.2 and 0.8. These analgesics are colourless, so view the plate under a 254-nm UV lamp: the compounds show up as dark spots against the green fluorescent background.</p>`,
    safety: ['Never look directly at the UV lamp.', 'Develop plates in a covered chamber in the hood.'],
    setup: R => ({ unk: R.pick(COMBOS) }),
    prelab: [
      { q: 'A spot travels 2.4 cm when the solvent front travels 6.0 cm. Rf?', ans: 0.4, atol: 0.005 },
      { q: 'Changing from hexane to ethyl acetate will make the Rf values…', choices: ['increase', 'decrease', 'stay the same'], ans: 0 },
      { q: 'The origin line is drawn with…', choices: ['pencil', 'ink pen', 'marker'], ans: 0, why: 'Ink would dissolve and chromatograph with the samples.' }
    ],
    parts: [{
      title: 'Develop a plate', steps: ['Spot the four standards and the dissolved unknown tablet on the origin.', 'Develop the plate in a chosen solvent. Pick one that separates the standards well.', 'Visualize under UV and measure each spot.'],
      sim: S => ({ type: 'tlc', title: 'TLC plate', solvents: TLCSOL, autoSol: 'ea', lanes: Object.entries(ANAL).map(([k, a]) => ({ k, l: a[0], short: a[2], spots: [{ p: a[1] }] })).concat([{ k: 'unk', l: 'Unknown tablet', short: 'Unk', spots: S.unk.map(k => ({ p: ANAL[k][1] })) }]) })
    }],
    questions: [
      { q: 'Rf of aspirin on your plate.', ans: (S, D) => D('d_asp_1') / D('tlc_front'), atol: 0.012, needs: 'aspirin spot and solvent front' },
      { q: 'Rf of acetaminophen on your plate.', ans: (S, D) => D('d_apap_1') / D('tlc_front'), atol: 0.012 },
      { q: 'Number of components in your unknown tablet.', ans: S => S.unk.length, int: true },
      { q: 'Active ingredient(s) in the unknown.', choices: COMBOS.map(comboName), ans: S => COMBOS.indexOf(S.unk) },
      { q: 'Which standard is the most polar (lowest Rf)?', choices: Object.values(ANAL).map(a => a[0]), ans: 3 },
      { q: 'Which solvent gave the best separation, and why did hexane alone fail?', text: true }
    ],
    key: S => [['Unknown', comboName(S.unk)]]
  });

  // ------------------------------------------------------------------ 6
  CL.lab({
    id: 'oc1-06', course: 'oc1', n: 6, title: 'Column Chromatography: Fluorene & 9-Fluorenone', time: '3 h', skills: 'column packing · gradient elution · TLC monitoring',
    goals: ['Pack and run a silica-gel column.', 'Separate fluorene from 9-fluorenone by increasing solvent polarity.', 'Check the fractions by TLC and determine the composition of the mixture.'],
    intro: `<p>Column chromatography uses the same principle as TLC, but on a scale large enough to collect the separated compounds. Fluorene is a non-polar hydrocarbon (white). 9-Fluorenone has a polar ketone group and is bright yellow, so it binds more strongly to silica.</p>
      <p>Elute first with <b>hexane</b> to wash out fluorene. Then switch to a <b>more polar eluent</b> (30% acetone in hexane) to move the yellow fluorenone band. Fluorene is colourless, so check each fraction by TLC. A well-packed column with no air bubbles or cracks and a narrow starting band gives clean separation.</p>`,
    safety: ['Silica dust is a respiratory hazard — weigh it in the hood.', 'Hexane and acetone are flammable.'],
    setup: R => ({ m0: R.between(0.180, 0.220, 3), ff: R.between(0.40, 0.60, 3) }),
    prelab: [
      { q: 'Which compound elutes first from silica with hexane?', choices: ['Fluorene', '9-Fluorenone'], ans: 0 },
      { q: 'Why is fluorenone retained more strongly?', choices: ['Its polar C=O group interacts with silica', 'It is heavier', 'It is yellow', 'It is less soluble in hexane'], ans: 0 }
    ],
    parts: [
      {
        title: 'Run the column', sim: S => ({
          type: 'synth', k: 'col', title: 'Column chromatography', sm: { name: 'fluorene/fluorenone mixture', mass: S.m0, label: 'Fluorene / 9-fluorenone mixture' }, product: { name: 'fractions' },
          steps: [
            { k: 'pack', l: 'Packing:', opts: [{ v: 'slurry', l: 'Slurry-pack silica in hexane, tap out bubbles', y: 1, p: 1 }, { v: 'dry', l: 'Pour dry silica in quickly', y: 1, p: 0.8 }, { v: 'none', l: 'No silica — just cotton plug and sand', y: 0, fail: 1 }] },
            { k: 'load', l: 'Loading:', opts: [{ v: 'narrow', l: 'Dissolve in minimum DCM, apply as a narrow band', y: 1, p: 1 }, { v: 'wide', l: 'Dissolve in 10 mL DCM and pour on', y: 1, p: 0.82 }] },
            { k: 'e1', l: 'First eluent:', opts: [{ v: 'hex', l: 'Hexane', y: 1, p: 1 }, { v: 'polar', l: '1 : 1 hexane / acetone', y: 1, p: 0.6 }] },
            { k: 'e2', l: 'Second eluent (after fluorene is off):', opts: [{ v: 'polar', l: '30% acetone in hexane', y: 1, p: 1 }, { v: 'hex', l: 'Continue with hexane', y: 0.4, p: 1 }] },
            { k: 'mon', l: 'Deciding which fractions contain product:', opts: [{ v: 'tlc', l: 'TLC every fraction', y: 1, p: 1 }, { v: 'eye', l: 'Judge by colour only', y: 0.8, p: 1 }] }
          ],
          custom: (S, ch, opts, m0) => {
            const logs = [{ k: 'col_mmix', l: 'Mass of mixture loaded', v: m0, u: 'g', dp: 3 }];
            if (ch.pack === 'none') return { lines: ['<span class="bad">With no stationary phase, both compounds washed straight through together.</span>'], logs, summary: 'failed — no silica' };
            const p = opts.reduce((x, o) => x * (o.p ?? 1), 1);
            let fl = m0 * S.ff * 0.88 * (ch.mon === 'eye' ? 0.75 : 1), fo = m0 * (1 - S.ff) * 0.88 * (ch.e2 === 'hex' ? 0.12 : 1);
            const cross = (1 - p) * 0.5; const fl2 = fl * (1 - cross) + fo * cross, fo2 = fo * (1 - cross) + fl * cross; fl = fl2; fo = fo2;
            const lines = [`Collected the colourless fraction(s) and the yellow band.${ch.e2 === 'hex' ? ' <span class="warn">The yellow band barely moved in hexane.</span>' : ''}${ch.mon === 'eye' ? ' <span class="warn">Some fluorene-containing fractions were discarded because they looked "empty".</span>' : ''}`, p < 0.95 ? `<span class="warn">TLC shows the two fractions are cross-contaminated (estimated purity ${(p * 100).toFixed(0)}%).</span>` : '<span class="good">TLC shows each fraction contains a single compound.</span>', `<span class="good">After evaporation: fluorene fraction ${fl.toFixed(3)} g, fluorenone fraction ${fo.toFixed(3)} g.</span>`];
            logs.push({ k: 'col_mfl', l: 'Fluorene fraction (dry)', v: CL.round(fl, 3), u: 'g', dp: 3 }, { k: 'col_mfo', l: 'Fluorenone fraction (dry)', v: CL.round(fo, 3), u: 'g', dp: 3 });
            return { lines, logs, summary: `fluorene ${fl.toFixed(3)} g, fluorenone ${fo.toFixed(3)} g` };
          }
        })
      },
      { title: 'TLC of the fractions', sim: { type: 'tlc', title: 'TLC plate', mix: { l: 'Ethyl acetate in hexane', short: 'EtOAc/hexane', min: 0, max: 50, step: 5, val: 10, e: pct => 0.05 + 0.007 * pct }, autoPct: 10, lanes: [{ k: 'std1', l: 'Fluorene std', short: 'Flu', spots: [{ p: 0.12 }] }, { k: 'std2', l: 'Fluorenone std', short: 'Fone', spots: [{ p: 0.38, color: 'rgba(225,190,40,.9)' }] }, { k: 'mix', l: 'Crude mixture', short: 'Mix', spots: [{ p: 0.12 }, { p: 0.38, color: 'rgba(225,190,40,.9)' }] }, { k: 'fa', l: 'Fraction A', short: 'Fr A', spots: [{ p: 0.12 }] }, { k: 'fb', l: 'Fraction B', short: 'Fr B', spots: [{ p: 0.38, color: 'rgba(225,190,40,.9)' }] }] } }
    ],
    questions: [
      { q: 'Mass percent fluorene in the mixture, from your recovered masses.', unit: '%', ans: (S, D) => D('col_mfl') / (D('col_mfl') + D('col_mfo')) * 100, atol: 0.3, truth: S => S.ff * 100, tatol: 5 },
      { q: 'Total percent recovery.', unit: '%', ans: (S, D) => (D('col_mfl') + D('col_mfo')) / D('col_mmix') * 100, atol: 0.3 },
      { q: 'Rf of fluorene on your plate.', ans: (S, D) => D('d_std1_1') / D('tlc_front'), atol: 0.012 },
      { q: 'Rf of fluorenone on your plate.', ans: (S, D) => D('d_std2_1') / D('tlc_front'), atol: 0.012 },
      { q: 'Which compound has the higher Rf, and why?', choices: ['Fluorene — it is less polar', 'Fluorenone — it is less polar', 'Fluorenone — it is coloured', 'They are equal'], ans: 0 },
      { q: 'Describe how your TLC results confirm (or contradict) the purity of the column fractions.', text: true }
    ],
    key: S => [['Mixture', S.m0 + ' g'], ['% fluorene', (S.ff * 100).toFixed(1) + '%']]
  });

  // ------------------------------------------------------------------ 7
  const IRC = ['Alkane only', 'Alkene', 'Alkyne', 'Aromatic', 'Alcohol', 'Carboxylic acid', 'Aldehyde', 'Ketone', 'Ester', 'Amine', 'Nitrile'];
  const IRLIB = [
    { n: 'Hexane', c: 0, p: [[2960, 0.9, 12], [2925, 1.1, 12], [2870, 0.6, 10], [2855, 0.6, 10], [1465, 0.5, 10], [1380, 0.3, 8], [725, 0.2, 10]] },
    { n: '1-Hexene', c: 1, p: [[3080, 0.35, 8], [2960, 0.8, 12], [2925, 0.9, 12], [2860, 0.5, 10], [1642, 0.45, 8], [1460, 0.4, 10], [993, 0.6, 8], [910, 0.9, 8]] },
    { n: '1-Hexyne', c: 2, p: [[3310, 0.9, 10], [2960, 0.7, 12], [2935, 0.7, 12], [2870, 0.4, 10], [2120, 0.3, 6], [1465, 0.3, 10], [630, 0.8, 15]] },
    { n: 'Toluene', c: 3, p: [[3030, 0.4, 10], [2920, 0.3, 10], [1605, 0.35, 6], [1495, 0.6, 6], [1460, 0.4, 8], [1080, 0.15, 8], [730, 1.2, 10], [695, 1.0, 8]] },
    { n: '1-Butanol', c: 4, p: [[3330, 1.2, 120], [2960, 0.8, 12], [2935, 0.6, 12], [2875, 0.45, 10], [1465, 0.3, 10], [1380, 0.2, 8], [1070, 0.8, 14], [1030, 0.5, 10]] },
    { n: 'Butanoic acid', c: 5, p: [[3000, 1.0, 330], [2965, 0.5, 12], [2880, 0.3, 10], [1712, 1.7, 14], [1415, 0.4, 12], [1285, 0.6, 14], [935, 0.4, 25]] },
    { n: 'Butanal', c: 6, p: [[2965, 0.6, 12], [2880, 0.4, 10], [2820, 0.25, 8], [2720, 0.3, 8], [1730, 1.6, 10], [1460, 0.3, 10], [1390, 0.2, 8], [1100, 0.2, 10]] },
    { n: '2-Butanone', c: 7, p: [[2980, 0.5, 12], [2940, 0.35, 12], [2880, 0.2, 10], [1717, 1.6, 10], [1460, 0.4, 10], [1365, 0.5, 8], [1170, 0.6, 10], [760, 0.15, 10]] },
    { n: 'Acetophenone', c: 7, p: [[3060, 0.25, 10], [3005, 0.15, 8], [1686, 1.6, 10], [1600, 0.4, 6], [1450, 0.4, 6], [1360, 0.6, 8], [1265, 1.1, 12], [760, 0.7, 8], [690, 0.8, 8]] },
    { n: 'Ethyl acetate', c: 8, p: [[2985, 0.4, 12], [1742, 1.6, 10], [1375, 0.5, 8], [1240, 1.4, 16], [1047, 0.8, 12], [940, 0.2, 10]] },
    { n: 'Butylamine', c: 9, p: [[3370, 0.45, 30], [3290, 0.4, 30], [2960, 0.7, 12], [2930, 0.6, 12], [2870, 0.45, 10], [1605, 0.4, 15], [1460, 0.3, 10], [1070, 0.25, 12], [800, 0.6, 40]] },
    { n: 'Benzonitrile', c: 10, p: [[3065, 0.3, 10], [2229, 0.9, 6], [1600, 0.3, 6], [1490, 0.5, 6], [1447, 0.5, 6], [757, 0.9, 8], [688, 0.9, 8]] }
  ];
  const strongest = c => c.p.filter(q => q[0] > 1500 && q[2] < 100).reduce((b, q) => (q[1] > b[1] ? q : b), [0, -1])[0];
  CL.lab({
    id: 'oc1-07', course: 'oc1', n: 7, title: 'Infrared Spectroscopy: Identifying Functional Groups', time: '2 h', skills: 'FT-IR · correlation tables',
    goals: ['Interpret IR spectra using characteristic absorption frequencies.', 'Assign the functional group present in two unknown liquids.', 'Identify each unknown from a list of candidates.'],
    intro: `<p>Bonds absorb infrared light at frequencies that depend on bond strength and atom masses. Look first at the region above 1500 cm⁻¹. The fingerprint region below 1500 cm⁻¹ is too complex to assign peak by peak.</p>
      <table><tr><th>Group</th><th>Absorption (cm⁻¹)</th><th>Appearance</th></tr>
      <tr><td>O–H alcohol</td><td>3200–3550</td><td>strong, broad</td></tr><tr><td>O–H carboxylic acid</td><td>2500–3300</td><td>very broad, overlaps C–H</td></tr><tr><td>N–H amine</td><td>3300–3500</td><td>medium; two spikes for –NH₂</td></tr>
      <tr><td>≡C–H</td><td>~3300</td><td>strong, sharp</td></tr><tr><td>=C–H (alkene/aromatic)</td><td>3000–3100</td><td>medium, just above 3000</td></tr><tr><td>C–H (sp³)</td><td>2850–2960</td><td>strong, just below 3000</td></tr>
      <tr><td>aldehyde C–H</td><td>~2720 & 2820</td><td>two weak peaks</td></tr><tr><td>C≡N</td><td>2210–2260</td><td>medium, sharp</td></tr><tr><td>C≡C</td><td>2100–2260</td><td>weak</td></tr>
      <tr><td>C=O ester</td><td>1735–1750</td><td>strong</td></tr><tr><td>C=O aldehyde</td><td>1720–1740</td><td>strong</td></tr><tr><td>C=O ketone</td><td>1705–1720 (conjugated ~1685)</td><td>strong</td></tr><tr><td>C=O acid</td><td>1700–1725</td><td>strong</td></tr>
      <tr><td>C=C alkene</td><td>1620–1680</td><td>medium</td></tr><tr><td>C=C aromatic</td><td>~1600 & 1500</td><td>medium, sharp</td></tr><tr><td>C–O</td><td>1000–1300</td><td>strong</td></tr></table>`,
    safety: ['Clean the ATR crystal with isopropanol and a soft wipe only.'],
    setup: R => { const ids = R.shuffle(IRLIB.map((_, i) => i)); return { u1: ids[0], u2: IRLIB[ids[1]].c === IRLIB[ids[0]].c ? ids[2] : ids[1] }; },
    prelab: [
      { q: 'A strong, sharp peak at 1715 cm⁻¹ indicates…', choices: ['O–H', 'C=O', 'C≡N', 'C–H'], ans: 1 },
      { q: 'A very broad absorption from 2500–3300 cm⁻¹ plus a peak at 1710 cm⁻¹ indicates a…', choices: ['ketone', 'alcohol', 'carboxylic acid', 'amine'], ans: 2 },
      { q: 'C–H stretches just above 3000 cm⁻¹ indicate…', choices: ['sp³ C–H', 'sp² C–H', 'aldehyde C–H', 'O–H'], ans: 1 }
    ],
    parts: [{ title: 'Unknown spectra', steps: ['Record the ATR-IR spectrum of each unknown (shown below).', 'Hover to read the wavenumbers of the major peaks and compare with the correlation table.'], sim: S => ({ type: 'spectrum', title: 'FT-IR spectra', spectra: [{ v: 'u1', l: 'Unknown 1', kind: 'ir', peaks: IRLIB[S.u1].p }, { v: 'u2', l: 'Unknown 2', kind: 'ir', peaks: IRLIB[S.u2].p }] }) }],
    questions: [
      { h: 'Unknown 1' },
      { q: 'Wavenumber of the strongest sharp absorption above 1500 cm⁻¹ in unknown 1.', unit: 'cm⁻¹', ans: S => strongest(IRLIB[S.u1]), atol: 15 },
      { q: 'Functional group class of unknown 1.', choices: IRC, ans: S => IRLIB[S.u1].c },
      { q: 'Identity of unknown 1.', choices: IRLIB.map(c => c.n), ans: S => S.u1 },
      { h: 'Unknown 2' },
      { q: 'Functional group class of unknown 2.', choices: IRC, ans: S => IRLIB[S.u2].c },
      { q: 'Identity of unknown 2.', choices: IRLIB.map(c => c.n), ans: S => S.u2 },
      { q: 'For each unknown, list the peaks you used and what each one tells you.', text: true, rows: 6 }
    ],
    key: S => [['Unknown 1', IRLIB[S.u1].n + ' (' + IRC[IRLIB[S.u1].c] + ')'], ['Unknown 2', IRLIB[S.u2].n + ' (' + IRC[IRLIB[S.u2].c] + ')']]
  });

  // ------------------------------------------------------------------ 8
  const SUBS = {
    b1: ['1-Bromobutane', [3, 0.6], [null, 12], 'Br'], c1: ['1-Chlorobutane', [null, 7], [null, null], 'Cl'], b2: ['2-Bromobutane', [16, 3], [9, 2], 'Br'],
    tb: ['2-Bromo-2-methylpropane', [null, null], [0.2, 0.1], 'Br'], bb: ['Bromobenzene', [null, null], [null, null], 'Br'], bn: ['Benzyl chloride', [1, 0.2], [2.5, 0.5], 'Cl'], np: ['1-Bromo-2,2-dimethylpropane', [null, null], [null, null], 'Br']
  };
  const UNKS = ['b1', 'c1', 'b2', 'tb', 'bn', 'bb'];
  const subObs = (k, rg, T) => {
    const s = SUBS[k]; const t = (rg === 'nai' ? s[1] : s[2])[T];
    if (t == null) return { obs: 'No precipitate after 20 min', color: 'rgba(210,230,245,.3)' };
    const tt = CL.round(t * (1 + 0.12 * CL.gauss()), 1);
    const ppt = rg === 'nai' ? (s[3] === 'Cl' ? 'NaCl' : 'NaBr') + ' (white)' : (s[3] === 'Cl' ? 'AgCl (white)' : 'AgBr (pale yellow)');
    return { obs: `Precipitate of ${ppt} after ~${Math.max(0.1, tt)} min`, color: 'rgba(225,230,235,.55)', ppt: rg === 'agno3' && s[3] === 'Br' ? '#f1e9b8' : '#f4f4f4' };
  };
  CL.lab({
    id: 'oc1-08', course: 'oc1', n: 8, title: 'Nucleophilic Substitution: SN1 & SN2 Reactivity', time: '2 h', skills: 'reaction rates · substrate structure · leaving groups',
    goals: ['Compare SN2 rates with NaI in acetone and SN1 rates with AgNO₃ in ethanol.', 'Relate rate to substrate structure (1°, 2°, 3°, benzylic, aryl) and leaving group.', 'Classify an unknown alkyl halide.'],
    intro: `<p><b>SN2 (NaI in acetone):</b> I⁻ attacks the carbon from the back side in one step. The rate depends on steric hindrance: methyl > 1° > 2° ≫ 3° (no reaction). NaCl and NaBr are insoluble in acetone, so a precipitate signals reaction.</p>
      <p><b>SN1 (AgNO₃ in ethanol):</b> Ag⁺ helps pull off the halide to give a carbocation. The rate depends on carbocation stability: 3° ≈ benzylic > 2° ≫ 1°. A precipitate of AgX signals reaction.</p>
      <p>Aryl and vinyl halides do neither reaction. Neopentyl halides are 1° but too hindered for SN2, and they can't form a stable cation for SN1. Bromide is a better leaving group than chloride.</p>`,
    safety: ['Alkyl halides are toxic and volatile; work in the hood.', 'AgNO₃ stains skin.'],
    setup: R => ({ unk: R.pick(UNKS) }),
    prelab: [
      { q: 'Which substrate reacts fastest by SN2?', choices: ['1-bromobutane', '2-bromobutane', '2-bromo-2-methylpropane'], ans: 0 },
      { q: 'Which substrate reacts fastest by SN1?', choices: ['1-bromobutane', '2-bromobutane', '2-bromo-2-methylpropane'], ans: 2 },
      { q: 'Why is acetone used for the SN2 test?', choices: ['It is polar aprotic and NaBr/NaCl are insoluble in it', 'It is a nucleophile', 'It dissolves silver salts', 'It forms carbocations'], ans: 0 }
    ],
    parts: [{
      title: 'Reactivity tests', steps: ['Add 2 drops of each halide to 1 mL of 15% NaI in acetone and, separately, to 1 mL of 1% AgNO₃ in ethanol.', 'Record the time for a precipitate to appear. If none forms in 5 min at room temperature, warm the tube in a 50 °C bath.'],
      sim: { type: 'bench', title: 'Test-tube rack & timer', instrument: 'Observation', icon: 'tube', controls: [{ k: 's', l: 'Alkyl halide', opts: Object.entries(SUBS).map(([v, a]) => ({ v, l: a[0] })).concat([{ v: 'unk', l: 'UNKNOWN halide' }]) }, { k: 'r', l: 'Reagent', opts: [{ v: 'nai', l: '15% NaI in acetone (SN2)' }, { v: 'agno3', l: '1% AgNO₃ in ethanol (SN1)' }] }, { k: 'T', l: 'Temperature', opts: [{ v: 0, l: 'Room temperature' }, { v: 1, l: '50 °C water bath' }] }], actions: [{ l: 'Mix & watch', key: c => `sn_${c.s}_${c.r}_${c.T}`, label: c => `${c.s === 'unk' ? 'Unknown' : SUBS[c.s][0]} + ${c.r === 'nai' ? 'NaI/acetone' : 'AgNO₃/EtOH'} (${c.T ? '50 °C' : 'RT'})`, read: (S, c) => subObs(c.s === 'unk' ? S.unk : c.s, c.r, c.T) }] }
    }],
    questions: [
      { q: 'Which substrate reacted fastest with NaI/acetone?', choices: Object.values(SUBS).map(s => s[0]), ans: 5 },
      { q: 'Which substrate reacted fastest with AgNO₃/ethanol?', choices: Object.values(SUBS).map(s => s[0]), ans: 3 },
      { q: 'Why did 1-chlorobutane react more slowly than 1-bromobutane with NaI?', choices: ['Cl⁻ is a poorer leaving group than Br⁻', 'Cl is larger than Br', '1-chlorobutane is tertiary', 'NaCl is soluble in acetone'], ans: 0 },
      { q: 'Why is benzyl chloride reactive under both sets of conditions?', choices: ['It is unhindered (SN2) and forms a resonance-stabilized cation (SN1)', 'Chloride is the best leaving group', 'It is tertiary', 'It is an aryl halide'], ans: 0 },
      { q: 'Why does 1-bromo-2,2-dimethylpropane fail both tests?', choices: ['The β-branching blocks back-side attack, and a primary carbocation is too unstable', 'It is an aryl halide', 'Bromide cannot leave', 'It is too volatile'], ans: 0 },
      { q: 'Identity of your unknown halide.', choices: UNKS.map(k => SUBS[k][0]), ans: S => UNKS.indexOf(S.unk) },
      { q: 'Draw (describe) the SN2 mechanism for 1-bromobutane with iodide, including the stereochemical outcome at carbon.', text: true }
    ],
    key: S => [['Unknown', SUBS[S.unk][0]]]
  });

  // ------------------------------------------------------------------ 9
  const IR_TBUOH = [[3360, 1.1, 110], [2975, 0.9, 12], [2930, 0.4, 10], [1470, 0.3, 10], [1380, 0.4, 8], [1365, 0.5, 8], [1205, 0.8, 12], [915, 0.3, 10]];
  const IR_TBUCL = [[2980, 0.9, 12], [2935, 0.4, 10], [1470, 0.4, 10], [1395, 0.3, 8], [1370, 0.6, 8], [1240, 0.4, 10], [1155, 0.5, 12], [570, 0.9, 12]];
  CL.lab({
    id: 'oc1-09', course: 'oc1', n: 9, title: 'SN1 Synthesis of tert-Butyl Chloride', time: '3 h', skills: 'separatory funnel workup · distillation · % yield',
    goals: ['Convert a tertiary alcohol into an alkyl chloride by an SN1 reaction.', 'Carry out an aqueous workup, drying and simple distillation.', 'Calculate the percent yield and confirm the product by IR.'],
    intro: `<div class="eq">(CH₃)₃C–OH + HCl → (CH₃)₃C–Cl + H₂O</div>
      <p>Protonating the OH turns it into a good leaving group (H₂O). It leaves to give the stable tertiary carbocation, which chloride captures. The product is less dense than water (0.84 g/mL), so it forms the <b>upper</b> layer. A NaHCO₃ wash neutralizes leftover HCl and releases CO₂, so vent often. Dry the product over anhydrous CaCl₂ and distil it (bp 51 °C).</p>
      <div class="eq">theoretical yield = (g alcohol / 74.12) × 92.57 g/mol &nbsp;&nbsp; % yield = actual / theoretical × 100</div>`,
    safety: ['Concentrated HCl is corrosive and its fumes are harmful — hood only.', 'Vent the separatory funnel immediately and frequently.', 'tert-Butyl chloride is extremely flammable.'],
    setup: R => ({ m0: R.between(7.60, 7.90, 3) }),
    prelab: [
      { q: 'Theoretical yield of t-BuCl from 7.75 g t-butanol.', unit: 'g', ans: 7.75 / 74.12 * 92.57, tol: 0.01 },
      { q: 'The rate-determining step of this SN1 reaction is…', choices: ['loss of water to form the carbocation', 'attack of chloride', 'protonation of the alcohol', 'deprotonation'], ans: 0 }
    ],
    parts: [
      {
        title: 'Synthesis & workup', sim: S => ({
          type: 'synth', k: 'tbu', title: 'Preparation of 2-chloro-2-methylpropane', sm: { name: 't-butanol', MW: 74.12, mass: S.m0, label: '10.0 mL of 2-methyl-2-propanol (t-butanol, d 0.781 g/mL)' }, product: { name: 't-butyl chloride', MW: 92.57, bp: 51, ratio: 1 }, base: 0.78,
          steps: [
            { k: 'acid', l: 'Reagent (25 mL):', opts: [{ v: 'conc', l: 'Concentrated (12 M) HCl', y: 1, p: 1 }, { v: 'dil', l: '1 M HCl', y: 0.15, p: 1, note: 'The layers barely changed — too little HCl.' }, { v: 'nacl', l: 'Saturated aqueous NaCl', fail: 'No reaction — chloride ion alone cannot displace OH⁻.' }] },
            { k: 'mix', l: 'Mixing in the separatory funnel:', opts: [{ v: 'vent', l: 'Swirl, then shake gently with frequent venting for 15 min', y: 1, p: 1 }, { v: 'shake', l: 'Shake vigorously for 1 min, no venting', y: 0.55, p: 1, note: 'The stopper popped and product was lost.' }] },
            { k: 'layer', l: 'The organic (product) layer is…', opts: [{ v: 'top', l: 'the top layer', y: 1, p: 1 }, { v: 'bottom', l: 'the bottom layer', fail: 'You kept the aqueous acid layer and discarded the product.' }] },
            { k: 'wash', l: 'Wash the organic layer with:', opts: [{ v: 'bicarb', l: '5% NaHCO₃ (vent!), then water', y: 1, p: 1 }, { v: 'naoh', l: '6 M NaOH', y: 0.6, p: 0.95, note: 'Strong base caused some hydrolysis/elimination of the product.' }, { v: 'none', l: 'No wash', y: 1, p: 0.85 }] },
            { k: 'dry', l: 'Drying:', opts: [{ v: 'cacl2', l: 'Anhydrous CaCl₂ until the liquid is clear', y: 0.97, p: 1 }, { v: 'none', l: 'Skip drying', y: 1, p: 0.88, note: 'The distillate was cloudy.' }] },
            { k: 'dist', l: 'Distillation — collect the fraction boiling at:', opts: [{ v: 'right', l: '48–53 °C', y: 1, p: 1 }, { v: 'wrong', l: '75–85 °C', y: 0.05, p: 0.6, note: 'Almost everything had distilled before you started collecting.' }] }
          ]
        })
      },
      { title: 'IR comparison', sim: { type: 'spectrum', title: 'IR spectra', spectra: [{ v: 'sm', l: 't-Butanol (starting material)', kind: 'ir', peaks: IR_TBUOH }, { v: 'pr', l: 'Your product', kind: 'ir', peaks: IR_TBUCL }] } }
    ],
    questions: [
      { q: 'Theoretical yield of t-butyl chloride.', unit: 'g', ans: (S, D) => D('tbu_msm') / 74.12 * 92.57, tol: 0.004 },
      { q: 'Percent yield.', unit: '%', ans: (S, D) => D('tbu_mprod') / (D('tbu_msm') / 74.12 * 92.57) * 100, atol: 0.3 },
      { q: 'Which IR evidence shows the reaction worked?', choices: ['Loss of the broad O–H band near 3360 cm⁻¹', 'Appearance of C=O at 1715 cm⁻¹', 'Appearance of C–H at 2980 cm⁻¹', 'Loss of the 570 cm⁻¹ band'], ans: 0 },
      { q: 'Purpose of the NaHCO₃ wash.', choices: ['Neutralize and remove residual HCl', 'Dry the product', 'Convert alcohol to alkene', 'Increase the density'], ans: 0 },
      { q: 'Why does this reaction go by SN1 rather than SN2?', choices: ['The tertiary carbon is too hindered for SN2 and forms a stable 3° cation', 'Chloride is a strong nucleophile', 'Water is aprotic', 'It is primary'], ans: 0 },
      { q: 'Identify the main source of product loss in your procedure.', text: true }
    ],
    key: S => [['t-BuOH mass', S.m0 + ' g'], ['Theoretical yield', (S.m0 / 74.12 * 92.57).toFixed(2) + ' g']]
  });

  // ------------------------------------------------------------------ 10
  CL.lab({
    id: 'oc1-10', course: 'oc1', n: 10, title: 'E1 Dehydration of 2-Methylcyclohexanol', time: '3 h', skills: 'elimination · Zaitsev’s rule · GC analysis',
    goals: ['Dehydrate an alcohol with acid, distilling the alkenes as they form.', 'Determine the product distribution by gas chromatography.', 'Relate the distribution to Zaitsev’s rule and carbocation rearrangements.'],
    intro: `<p>Heating an alcohol with a strong acid eliminates water (E1). The protonated OH leaves to give a carbocation, which loses a β-proton to form an alkene. 2-Methylcyclohexanol can give three alkenes: <b>1-methylcyclohexene</b> (trisubstituted, the Zaitsev product), <b>3-methylcyclohexene</b> (disubstituted) and <b>methylenecyclohexane</b>.</p>
      <p>The alkenes (bp ≈ 104–110 °C) boil below the alcohol (165 °C). Distilling them off as they form drives the equilibrium toward products (Le Châtelier). Bromine decolourizes when it adds to an alkene, which is a quick test for unsaturation.</p>
      <div class="eq">C₇H₁₄O (114.19 g/mol) → C₇H₁₂ (96.17 g/mol) + H₂O</div>`,
    safety: ['85% H₃PO₄ and conc. H₂SO₄ are corrosive.', 'Alkenes are flammable; distil with a heating mantle.'],
    setup: R => { const r3 = R.between(0.02, 0.05), r2 = R.between(0.18, 0.30); return { m0: R.between(4.50, 4.80, 3), r1: 1 - r2 - r3, r2, r3 }; },
    prelab: [
      { q: 'Theoretical yield of methylcyclohexenes from 4.65 g of 2-methylcyclohexanol.', unit: 'g', ans: 4.65 / 114.19 * 96.17, tol: 0.01 },
      { q: 'Zaitsev’s rule predicts the major product is the…', choices: ['most substituted alkene', 'least substituted alkene', 'terminal alkene'], ans: 0 }
    ],
    parts: [
      {
        title: 'Dehydration', sim: S => ({
          type: 'synth', k: 'deh', title: 'Acid-catalysed dehydration', sm: { name: '2-methylcyclohexanol', MW: 114.19, mass: S.m0, label: '5.0 mL of 2-methylcyclohexanol (cis/trans mixture)' }, product: { name: 'methylcyclohexene mixture', MW: 96.17, bp: '104–110', ratio: 1 }, base: 0.72,
          steps: [
            { k: 'cat', l: 'Catalyst:', opts: [{ v: 'h3po4', l: '85% H₃PO₄ + 10 drops conc. H₂SO₄', y: 1, p: 1 }, { v: 'naoh', l: '6 M NaOH', fail: 'No elimination — base cannot make OH a leaving group.' }, { v: 'none', l: 'No catalyst', fail: 'Only unreacted alcohol distilled at 165 °C.' }] },
            { k: 'heat', l: 'Heating method:', opts: [{ v: 'dist', l: 'Distil the products as they form (head T < 110 °C)', y: 1, p: 1 }, { v: 'reflux', l: 'Reflux for 1 h, then distil', y: 0.6, p: 0.95 }, { v: 'hot', l: 'Distil fast with head T up to 160 °C', y: 1.05, p: 0.8, note: 'Unreacted alcohol co-distilled.' }] },
            { k: 'wash', l: 'Wash the distillate with:', opts: [{ v: 'brine', l: 'Saturated NaCl, then separate', y: 0.96, p: 1 }, { v: 'none', l: 'No wash', y: 1, p: 0.92 }] },
            { k: 'dry', l: 'Drying:', opts: [{ v: 'na2so4', l: 'Anhydrous Na₂SO₄', y: 0.97, p: 1 }, { v: 'none', l: 'None', y: 1, p: 0.9 }] }
          ]
        })
      },
      { title: 'GC analysis & bromine test', sim: S => [{ type: 'spectrum', title: 'Gas chromatogram of the product', spectra: [{ v: 'gc', l: 'Product mixture', kind: 'chrom', tmax: 6, peaks: [[2.45, 3 * S.r3, 0.04], [2.80, 3 * S.r2, 0.045], [3.05, 3 * S.r1, 0.05]] }] }, { type: 'bench', title: 'Unsaturation test', instrument: 'Observation', icon: 'tube', controls: [{ k: 's', l: 'Sample', opts: [{ v: 'sm', l: 'Starting alcohol' }, { v: 'pr', l: 'Your product' }] }], actions: [{ l: 'Add 2 drops Br₂ in CH₂Cl₂', key: c => 'br2_' + c.s, label: c => 'Br₂ test: ' + (c.s === 'sm' ? 'starting alcohol' : 'product'), read: (S, c) => (c.s === 'pr' ? { obs: 'Red-brown colour disappears immediately', color: 'rgba(240,240,230,.3)' } : { obs: 'Red-brown colour persists', color: 'rgba(170,70,30,.6)' }) }] }] }
    ],
    questions: [
      { q: 'Theoretical yield of alkenes.', unit: 'g', ans: (S, D) => D('deh_msm') / 114.19 * 96.17, tol: 0.004 },
      { q: 'Percent yield.', unit: '%', ans: (S, D) => D('deh_mprod') / (D('deh_msm') / 114.19 * 96.17) * 100, atol: 0.3 },
      { q: 'Percent 1-methylcyclohexene in the alkene mixture (GC).', unit: '%', ans: S => S.r1 * 100, atol: 1 },
      { q: 'Percent 3-methylcyclohexene (GC).', unit: '%', ans: S => S.r2 * 100, atol: 1 },
      { q: 'Why is 1-methylcyclohexene the major product?', choices: ['It is the most substituted, most stable alkene (Zaitsev)', 'It boils the lowest', 'It forms by SN2', 'It is the kinetic product of an E2 with a bulky base'], ans: 0 },
      { q: 'What does the bromine test show?', choices: ['The product contains C=C', 'The product contains O–H', 'The product is an alkyl bromide', 'No reaction occurred'], ans: 0 },
      { q: 'Propose a mechanism that explains how methylenecyclohexane can form.', text: true }
    ],
    key: S => [['Alcohol', S.m0 + ' g'], ['GC %', `1-Me ${(S.r1 * 100).toFixed(1)}, 3-Me ${(S.r2 * 100).toFixed(1)}, methylene ${(S.r3 * 100).toFixed(1)}`]]
  });

  // ------------------------------------------------------------------ 11
  const POL = { suc: ['Sucrose (0.100 g/mL in water)', 66.5, 0.1], R: ['(R)-(−)-carvone (0.100 g/mL in ethanol)', -61.0, 0.1], Sc: ['(S)-(+)-carvone (0.100 g/mL in ethanol)', 61.0, 0.1], unk: ['Unknown carvone sample (0.100 g/mL)', null, 0.1] };
  const specRot = (D, s) => { for (const l of [1, 2]) { const a = D(`alpha_${s}_${l}`); if (isFinite(a)) return a / (l * POL[s][2]); } return NaN; };
  CL.lab({
    id: 'oc1-11', course: 'oc1', n: 11, title: 'Stereochemistry & Polarimetry: Enantiomers of Carvone', time: '2 h', skills: 'polarimeter · specific rotation · enantiomeric excess',
    goals: ['Measure optical rotation with a polarimeter.', 'Calculate specific rotation.', 'Determine the enantiomeric excess and composition of an unknown carvone sample.'],
    intro: `<p>Enantiomers have identical physical properties except that they rotate plane-polarized light in opposite directions, by equal amounts. Living organisms can also tell them apart: (R)-carvone smells of spearmint and (S)-carvone of caraway.</p>
      <div class="eq">[α] = α / (l · c) &nbsp;&nbsp; (l in dm, c in g/mL) &nbsp;&nbsp;&nbsp; ee (%) = |[α]_obs / [α]_pure| × 100</div>
      <div class="eq">% major enantiomer = (100 + ee)/2 &nbsp;&nbsp; % minor = (100 − ee)/2</div><p>A racemic (50 : 50) mixture has α = 0. Literature: [α]<sub>D</sub>(sucrose) = +66.5°.</p>`,
    safety: ['Carvone is a skin sensitizer; wear gloves.', 'Fill the polarimeter tube without air bubbles.'],
    setup: R => ({ ee: R.between(20, 90, 1), sgn: R.pick([1, -1]) }),
    prelab: [
      { q: 'A sample in a 1.00-dm tube at 0.100 g/mL rotates light +4.12°. [α]?', unit: '°', ans: 41.2, atol: 0.05 },
      { q: 'A sample has 80% ee of the (S) enantiomer. Percent (S)?', unit: '%', ans: 90, atol: 0.05 },
      { q: 'A racemic mixture has an observed rotation of…', ans: 0, atol: 0.001 }
    ],
    parts: [{
      title: 'Measure optical rotations', steps: ['Zero the polarimeter with a tube of pure solvent.', 'Fill the tube with each solution and read the rotation. Note the sign (+ clockwise, − counterclockwise).'],
      sim: { type: 'bench', title: 'Polarimeter (sodium D line, 589 nm)', instrument: 'Rotation α (°)', icon: 'meter', controls: [{ k: 's', l: 'Sample', opts: Object.entries(POL).map(([v, a]) => ({ v, l: a[0] })) }, { k: 'l', l: 'Tube length', opts: [{ v: 1, l: '1.00 dm' }, { v: 2, l: '2.00 dm' }] }], actions: [{ l: 'Read rotation', key: c => `alpha_${c.s}_${c.l}`, label: c => `α, ${POL[c.s][0]}, ${c.l}.00-dm tube`, read: (S, c) => { const sp = c.s === 'unk' ? S.sgn * 61 * S.ee / 100 : POL[c.s][1]; return { v: CL.meas(sp * c.l * POL[c.s][2], 0.02, 2), u: '°', dp: 2, note: c.s === 'R' ? 'Odour: spearmint.' : c.s === 'Sc' ? 'Odour: caraway (rye bread).' : c.s === 'unk' ? `Odour: mostly ${S.sgn > 0 ? 'caraway' : 'spearmint'}.` : '' }; } }] }
    }],
    questions: [
      { q: 'Specific rotation of sucrose from your data.', unit: '°', ans: (S, D) => specRot(D, 'suc'), atol: 0.25, truth: 66.5, tatol: 1.5 },
      { q: 'Specific rotation of (R)-(−)-carvone.', unit: '°', ans: (S, D) => specRot(D, 'R'), atol: 0.25, truth: -61, tatol: 1.5 },
      { q: 'Specific rotation of your unknown sample.', unit: '°', ans: (S, D) => specRot(D, 'unk'), atol: 0.25 },
      { q: 'Enantiomeric excess of the unknown.', unit: '%', ans: (S, D) => Math.abs(specRot(D, 'unk')) / 61 * 100, atol: 0.6, truth: S => S.ee, tatol: 2 },
      { q: 'Percent of the major enantiomer.', unit: '%', ans: (S, D) => (100 + Math.abs(specRot(D, 'unk')) / 61 * 100) / 2, atol: 0.4 },
      { q: 'The major enantiomer in your unknown is…', choices: ['(R)-(−)-carvone', '(S)-(+)-carvone'], ans: S => (S.sgn > 0 ? 1 : 0) },
      { q: 'Number of stereocentres in carvone.', ans: 1, int: true },
      { q: 'Why does doubling the tube length double α but not change [α]?', text: true }
    ],
    key: S => [['Unknown', `${S.ee}% ee ${S.sgn > 0 ? '(S)-(+)' : '(R)-(−)'}`], ['Expected α (1 dm)', (S.sgn * 61 * S.ee / 100 * 0.1).toFixed(2) + '°']]
  });
})();
