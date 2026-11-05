/* Organic Chemistry II — virtual lab definitions */
(function () {
  'use strict';
  CL.course({ id: 'oc2', code: 'CHEM 222L', title: 'Organic Chemistry II', short: 'Organic II', color: '#C2501F', blurb: 'NMR and MS structure determination, Grignard, Diels–Alder, aromatic substitution, carbonyl chemistry, reductions and qualitative organic analysis.' });

  const pctYield = (D, k, MWsm, MWp, ratio = 1) => D(k + '_mprod') / (D(k + '_msm') / MWsm * ratio * MWp) * 100;
  const theo = (D, k, MWsm, MWp, ratio = 1) => D(k + '_msm') / MWsm * ratio * MWp;

  // ------------------------------------------------------------------ 1
  const NMR = [
    { n: 'Ethyl acetate', f: 'C₄H₈O₂', C: 4, H: 8, M: 88, h: [[4.12, 2, 'q', 7.1], [2.05, 3, 's'], [1.26, 3, 't', 7.1]], c: [[171.1, 0.5], [60.4, 1], [21.0, 1], [14.2, 1]], ms: [[88, 8], [73, 4], [70, 10], [61, 15], [45, 18], [43, 100], [29, 22]] },
    { n: '2-Butanone', f: 'C₄H₈O', C: 4, H: 8, M: 72, h: [[2.44, 2, 'q', 7.3], [2.14, 3, 's'], [1.06, 3, 't', 7.3]], c: [[209.3, 0.4], [36.9, 1], [29.4, 1], [7.9, 1]], ms: [[72, 25], [57, 8], [43, 100], [29, 30], [27, 15]] },
    { n: '2-Propanol', f: 'C₃H₈O', C: 3, H: 8, M: 60, h: [[4.03, 1, 'sept', 6.1], [2.20, 1, 'br'], [1.20, 6, 'd', 6.1]], c: [[64.2, 1], [25.3, 1.8]], ms: [[60, 2], [59, 5], [45, 100], [43, 18], [27, 14]] },
    { n: 'Toluene', f: 'C₇H₈', C: 7, H: 8, M: 92, h: [[7.20, 5, 'm', 7.5], [2.35, 3, 's']], c: [[137.9, 0.4], [129.1, 1.6], [128.3, 1.6], [125.4, 0.8], [21.5, 1]], ms: [[92, 65], [91, 100], [65, 12], [39, 10]] },
    { n: 'Ethylbenzene', f: 'C₈H₁₀', C: 8, H: 10, M: 106, h: [[7.22, 5, 'm', 7.5], [2.65, 2, 'q', 7.6], [1.24, 3, 't', 7.6]], c: [[144.3, 0.4], [128.4, 1.6], [127.9, 1.6], [125.7, 0.8], [29.0, 1], [15.6, 1]], ms: [[106, 30], [91, 100], [77, 8], [65, 6], [51, 6]] },
    { n: 'Propanoic acid', f: 'C₃H₆O₂', C: 3, H: 6, M: 74, h: [[11.6, 1, 'br'], [2.38, 2, 'q', 7.5], [1.16, 3, 't', 7.5]], c: [[181.5, 0.4], [27.6, 1], [9.0, 1]], ms: [[74, 80], [73, 20], [57, 25], [45, 40], [29, 100], [28, 90]] },
    { n: '1-Bromopropane', f: 'C₃H₇Br', C: 3, H: 7, X: 1, M: 122, h: [[3.40, 2, 't', 6.8], [1.89, 2, 'sext', 7.0], [1.03, 3, 't', 7.4]], c: [[35.9, 1], [26.2, 1], [13.0, 1]], ms: [[124, 24], [122, 25], [43, 100], [41, 40], [27, 30]] },
    { n: 'Isopropylbenzene (cumene)', f: 'C₉H₁₂', C: 9, H: 12, M: 120, h: [[7.24, 5, 'm', 7.5], [2.90, 1, 'sept', 6.9], [1.25, 6, 'd', 6.9]], c: [[148.8, 0.4], [128.3, 1.6], [126.4, 1.6], [125.8, 0.8], [34.2, 1], [24.0, 1.8]], ms: [[120, 25], [105, 100], [79, 8], [77, 12], [51, 6]] },
    { n: 'tert-Butyl methyl ether', f: 'C₅H₁₂O', C: 5, H: 12, M: 88, h: [[3.21, 3, 's'], [1.19, 9, 's']], c: [[72.7, 0.4], [49.4, 1], [27.0, 2]], ms: [[88, 1], [73, 100], [57, 25], [41, 20], [29, 15]] },
    { n: 'Methyl benzoate', f: 'C₈H₈O₂', C: 8, H: 8, M: 136, h: [[8.04, 2, 'd', 7.6], [7.55, 1, 't', 7.4], [7.43, 2, 't', 7.6], [3.91, 3, 's']], c: [[167.1, 0.4], [132.9, 1], [130.2, 0.4], [129.6, 1.6], [128.4, 1.6], [52.1, 1]], ms: [[136, 35], [105, 100], [77, 75], [51, 30]] }
  ];
  const dou = m => (2 * m.C + 2 - m.H - (m.X || 0)) / 2;
  const nmrSpec = (m, tag) => [{ v: tag + 'h', l: `${tag === 'a' ? 'Unknown A' : 'Unknown B'} — ¹H NMR (300 MHz, CDCl₃)`, kind: 'hnmr', peaks: m.h }, { v: tag + 'c', l: `${tag === 'a' ? 'Unknown A' : 'Unknown B'} — ¹³C NMR`, kind: 'cnmr', peaks: m.c }, { v: tag + 'm', l: `${tag === 'a' ? 'Unknown A' : 'Unknown B'} — EI mass spectrum`, kind: 'ms', peaks: m.ms }];
  CL.lab({
    id: 'oc2-01', course: 'oc2', n: 1, title: 'Structure Determination by NMR & Mass Spectrometry', time: '2 h', skills: '¹H/¹³C NMR · splitting · MS',
    goals: ['Use the molecular formula to calculate degrees of unsaturation.', 'Interpret chemical shifts, integration and splitting in ¹H NMR, and the number of ¹³C signals.', 'Combine NMR and MS data to identify two unknowns.'],
    intro: `<p><b>Degrees of unsaturation</b> (rings + π bonds) = (2C + 2 + N − H − X)/2. A value of 4 or more suggests a benzene ring.</p>
      <p><b>¹H NMR:</b> the <i>number of signals</i> is the number of sets of equivalent hydrogens. The <i>chemical shift</i> shows the environment: alkyl 0.9–1.8, next to C=O or on a benzylic carbon 2.0–2.7, next to O 3.3–4.5, aromatic 6.5–8.0, CHO 9–10, COOH 10–12 ppm. The <i>integration</i> gives the relative number of H in each signal. <i>Splitting</i> follows the n + 1 rule: a signal next to n equivalent neighbouring H splits into n + 1 peaks (s, d, t, q, …). An ethyl group shows a 2H quartet plus a 3H triplet. An isopropyl group shows a 1H septet plus a 6H doublet.</p>
      <p><b>¹³C NMR:</b> one line per unique carbon. C=O carbons appear at 160–220 ppm, aromatic at 120–150, C–O at 50–80. <b>MS:</b> the molecular ion M⁺ gives the molar mass. Two peaks of equal height at M and M+2 mean bromine is present.</p>`,
    safety: ['Dry lab. Real NMR tubes are fragile and CDCl₃ is toxic — handle in the hood.'],
    setup: R => { const ids = R.shuffle(NMR.map((_, i) => i)); return { a: ids[0], b: ids[1] }; },
    prelab: [
      { q: 'Degrees of unsaturation in C₈H₁₀.', ans: 4, int: true },
      { q: 'A CH₂ next to a CH₃ (and nothing else with H) appears as a…', choices: ['singlet', 'doublet', 'triplet', 'quartet'], ans: 3 },
      { q: 'How many ¹H NMR signals does CH₃CH₂OCH₂CH₃ give?', ans: 2, int: true }
    ],
    parts: [{ title: 'Spectra of your unknowns', note: S => `<p>Unknown A: <b>${NMR[S.a].f}</b> &nbsp;·&nbsp; Unknown B: <b>${NMR[S.b].f}</b></p>`, sim: S => ({ type: 'spectrum', title: 'Spectra', spectra: nmrSpec(NMR[S.a], 'a').concat(nmrSpec(NMR[S.b], 'b')) }) }],
    questions: [
      { h: 'Unknown A' },
      { q: S => `Degrees of unsaturation of unknown A (${NMR[S.a].f}).`, ans: S => dou(NMR[S.a]), int: true },
      { q: 'Number of signals in the ¹H NMR of unknown A.', ans: S => NMR[S.a].h.length, int: true },
      { q: 'Number of signals in the ¹³C NMR of unknown A (exclude CDCl₃).', ans: S => NMR[S.a].c.length, int: true },
      { q: 'm/z of the molecular ion of unknown A.', ans: S => NMR[S.a].M, int: true },
      { q: 'Identity of unknown A.', choices: NMR.map(m => m.n), ans: S => S.a },
      { h: 'Unknown B' },
      { q: S => `Degrees of unsaturation of unknown B (${NMR[S.b].f}).`, ans: S => dou(NMR[S.b]), int: true },
      { q: 'Number of signals in the ¹H NMR of unknown B.', ans: S => NMR[S.b].h.length, int: true },
      { q: 'Identity of unknown B.', choices: NMR.map(m => m.n), ans: S => S.b },
      { q: 'For unknown A, assign every ¹H signal (shift, integration, multiplicity) to a group of protons in your structure.', text: true, rows: 6 }
    ],
    key: S => [['Unknown A', NMR[S.a].n + ' ' + NMR[S.a].f], ['Unknown B', NMR[S.b].n + ' ' + NMR[S.b].f]]
  });

  // ------------------------------------------------------------------ 2
  CL.lab({
    id: 'oc2-02', course: 'oc2', n: 2, title: 'Grignard Synthesis of Triphenylmethanol', time: '3.5 h', skills: 'organometallics · anhydrous technique · IR',
    goals: ['Prepare phenylmagnesium bromide under anhydrous conditions.', 'Add the Grignard reagent to benzophenone and work up the alkoxide.', 'Purify and characterize triphenylmethanol (yield, mp, IR).'],
    intro: `<div class="eq">PhBr + Mg → PhMgBr (in dry ether) &nbsp;&nbsp; PhMgBr + Ph₂C=O → Ph₃C–O⁻ MgBr⁺ → (H₃O⁺) → Ph₃C–OH</div>
      <p>Grignard reagents are very strong bases and nucleophiles. Even traces of water destroy them (PhMgBr + H₂O → benzene), so all glassware must be dry and the ether anhydrous. A small iodine crystal, or crushing the Mg, exposes fresh metal and starts the reaction. The main side product is <b>biphenyl</b> (from PhMgBr + PhBr), which is removed by washing the crude product with cold hexanes (trituration).</p>
      <div class="eq">benzophenone 182.22 g/mol (limiting) &nbsp;&nbsp; triphenylmethanol 260.33 g/mol, mp 162–164 °C</div>`,
    safety: ['Diethyl ether is extremely flammable and forms peroxides — no flames anywhere in the lab.', 'The Grignard formation is exothermic; keep an ice bath ready.', 'Bromobenzene is an irritant.'],
    setup: R => ({ m0: R.between(1.80, 2.00, 3) }),
    prelab: [
      { q: 'Theoretical yield of triphenylmethanol from 1.82 g benzophenone.', unit: 'g', ans: 1.82 / 182.22 * 260.33, tol: 0.01 },
      { q: 'Why must the glassware be oven-dried?', choices: ['Water protonates and destroys the Grignard reagent', 'Water makes ether boil', 'Water oxidizes Mg', 'It does not matter'], ans: 0 }
    ],
    parts: [
      {
        title: 'Synthesis', sim: S => ({
          type: 'synth', k: 'grig', title: 'Grignard reaction', sm: { name: 'benzophenone', MW: 182.22, mass: S.m0, label: 'Benzophenone (limiting); PhMgBr prepared from 1.1 equiv bromobenzene + Mg' }, product: { name: 'triphenylmethanol', MW: 260.33, mp: [162, 164] }, base: 0.72,
          steps: [
            { k: 'glass', l: 'Glassware & atmosphere:', opts: [{ v: 'dry', l: 'Oven-dried glassware, CaCl₂ drying tube', y: 1, p: 1 }, { v: 'wet', l: 'Glassware rinsed with water and air-dried briefly', fail: 'The Grignard reagent was quenched by water — mostly benzene formed.' }] },
            { k: 'solv', l: 'Solvent:', opts: [{ v: 'ether', l: 'Anhydrous diethyl ether', y: 1, p: 1 }, { v: 'etoh', l: 'Ethanol', fail: 'Ethanol (an acid) destroyed PhMgBr instantly.' }, { v: 'wetether', l: 'Ether from an old, opened bottle', y: 0.55, p: 0.95 }] },
            { k: 'init', l: 'Initiation:', opts: [{ v: 'iodine', l: 'Crush the Mg and add one small I₂ crystal', y: 1, p: 1 }, { v: 'none', l: 'Just wait', y: 0.75, p: 1, note: 'It took 25 min to start.' }] },
            { k: 'add', l: 'Adding benzophenone:', opts: [{ v: 'drop', l: 'Dissolved in ether, added dropwise with stirring', y: 1, p: 1 }, { v: 'dump', l: 'Added all at once as a solid', y: 0.85, p: 0.92 }] },
            { k: 'work', l: 'Workup:', opts: [{ v: 'acid', l: '3 M H₂SO₄ over ice, separate, wash, dry, evaporate', y: 1, p: 1 }, { v: 'water', l: 'Water only', y: 0.75, p: 0.95, note: 'A gelatinous Mg(OH)₂ emulsion trapped product.' }] },
            { k: 'pur', l: 'Purification:', opts: [{ v: 'trit', l: 'Triturate with cold hexanes, then recrystallize from isopropanol', y: 0.9, p: 1 }, { v: 'none', l: 'None', y: 1, p: 0.82, note: 'The solid smelled of biphenyl and looked waxy.' }] }
          ]
        })
      },
      { title: 'IR of starting material and product', sim: { type: 'spectrum', title: 'IR spectra', spectra: [{ v: 'sm', l: 'Benzophenone', kind: 'ir', peaks: [[3060, 0.3, 10], [1660, 1.5, 10], [1598, 0.6, 6], [1447, 0.5, 6], [1318, 0.6, 8], [1277, 0.9, 10], [940, 0.3, 8], [700, 1.0, 8]] }, { v: 'pr', l: 'Your product', kind: 'ir', peaks: [[3470, 0.8, 40], [3060, 0.3, 10], [1595, 0.3, 6], [1490, 0.6, 6], [1448, 0.6, 6], [1158, 0.5, 10], [1010, 0.6, 10], [760, 0.8, 8], [700, 1.1, 8]] }] } }
    ],
    questions: [
      { q: 'Theoretical yield of triphenylmethanol.', unit: 'g', ans: (S, D) => theo(D, 'grig', 182.22, 260.33), tol: 0.004 },
      { q: 'Percent yield.', unit: '%', ans: (S, D) => pctYield(D, 'grig', 182.22, 260.33), atol: 0.3 },
      { q: 'Onset of your product’s melting range.', unit: '°C', ans: (S, D) => D('grig_mplo'), atol: 0.5, truth: 161, tatol: 3 },
      { q: 'Main organic side product removed by trituration with hexanes.', choices: ['Biphenyl', 'Benzene', 'Benzoic acid', 'Diphenylmethanol'], ans: 0 },
      { q: 'Which IR change confirms the reaction?', choices: ['C=O at 1660 cm⁻¹ disappears and O–H near 3470 cm⁻¹ appears', 'C–H at 3060 disappears', 'A new C=O appears', 'No change'], ans: 0 },
      { q: 'Write the mechanism for the addition of PhMgBr to benzophenone and the acidic workup.', text: true }
    ],
    key: S => [['Benzophenone', S.m0 + ' g'], ['Theoretical yield', (S.m0 / 182.22 * 260.33).toFixed(3) + ' g']]
  });

  // ------------------------------------------------------------------ 3
  CL.lab({
    id: 'oc2-03', course: 'oc2', n: 3, title: 'Diels–Alder Reaction: Anthracene + Maleic Anhydride', time: '2.5 h', skills: 'pericyclic reactions · reflux · anhydrides',
    goals: ['Carry out a [4 + 2] cycloaddition at reflux.', 'Isolate and characterize the adduct.', 'Explain the reactivity of anthracene’s central ring.'],
    intro: `<div class="eq">anthracene (diene, 178.23 g/mol) + maleic anhydride (dienophile, 98.06 g/mol) → 9,10-dihydroanthracene-9,10-α,β-succinic anhydride (276.29 g/mol, mp 262–264 °C)</div>
      <p>The Diels–Alder reaction is a concerted, suprafacial cycloaddition. Anthracene reacts across its central ring (C9 and C10), because that leaves two intact benzene rings in the product. The reaction is slow at room temperature, so you reflux it in high-boiling xylene (bp ≈ 140 °C). Water must be kept out, because it hydrolyses the anhydride to a dicarboxylic acid.</p>
      <p>You will use 0.50 g maleic anhydride (excess) with about 0.80 g anthracene.</p>`,
    safety: ['Maleic anhydride is corrosive and a respiratory sensitizer.', 'Xylene is flammable; reflux with a heating mantle.'],
    setup: R => ({ m0: R.between(0.78, 0.82, 3) }),
    prelab: [
      { q: 'Moles in 0.50 g maleic anhydride.', unit: 'mol', ans: 0.5 / 98.06, tol: 0.005 },
      { q: 'With 0.80 g anthracene and 0.50 g maleic anhydride, the limiting reagent is…', choices: ['anthracene', 'maleic anhydride'], ans: 0 }
    ],
    parts: [
      {
        title: 'Synthesis', sim: S => ({
          type: 'synth', k: 'da', title: 'Diels–Alder cycloaddition', sm: { name: 'anthracene', MW: 178.23, mass: S.m0, label: 'Anthracene (limiting) + 0.50 g maleic anhydride' }, product: { name: 'Diels–Alder adduct', MW: 276.29, mp: [262, 264] }, base: 0.86,
          steps: [
            { k: 'solv', l: 'Solvent (10 mL):', opts: [{ v: 'xyl', l: 'Xylene', y: 1, p: 1 }, { v: 'etoh', l: 'Ethanol', y: 0.2, p: 0.7, note: 'Ethanol is too cool for a fast reaction and opened the anhydride to an ester-acid.' }, { v: 'water', l: 'Water', fail: 'Maleic anhydride hydrolysed to maleic acid; anthracene did not dissolve.' }] },
            { k: 'time', l: 'Reaction time at reflux:', opts: [{ v: '30', l: '30 min', y: 1, p: 1 }, { v: '5', l: '5 min', y: 0.4, p: 0.9, note: 'Yellow anthracene colour persisted.' }] },
            { k: 'tube', l: 'Moisture protection:', opts: [{ v: 'cacl2', l: 'CaCl₂ drying tube on the condenser', y: 1, p: 1 }, { v: 'open', l: 'Open condenser', y: 1, p: 0.95 }] },
            { k: 'iso', l: 'Isolation:', opts: [{ v: 'filt', l: 'Cool, ice bath, vacuum-filter, rinse with cold ethyl acetate', y: 1, p: 1 }, { v: 'evap', l: 'Evaporate all the xylene to dryness', y: 1.1, p: 0.82, note: 'Excess maleic anhydride stayed in the solid.' }] }
          ]
        })
      },
      { title: 'IR of the product', sim: { type: 'spectrum', title: 'IR spectrum', spectra: [{ v: 'pr', l: 'Diels–Alder adduct', kind: 'ir', peaks: [[3070, 0.25, 10], [2970, 0.2, 10], [1860, 0.7, 8], [1780, 1.6, 10], [1460, 0.5, 6], [1230, 0.9, 12], [940, 0.7, 10], [760, 0.9, 8]] }] } }
    ],
    questions: [
      { q: 'Theoretical yield of the adduct.', unit: 'g', ans: (S, D) => theo(D, 'da', 178.23, 276.29), tol: 0.004 },
      { q: 'Percent yield.', unit: '%', ans: (S, D) => pctYield(D, 'da', 178.23, 276.29), atol: 0.3 },
      { q: 'The pair of IR bands at 1860 and 1780 cm⁻¹ shows the product contains a(n)…', choices: ['cyclic anhydride', 'carboxylic acid', 'ketone', 'alcohol'], ans: 0 },
      { q: 'Why is xylene used as the solvent?', choices: ['Its high boiling point speeds up the reaction and it does not react with the anhydride', 'It is a dienophile', 'It is polar protic', 'It dissolves water'], ans: 0 },
      { q: 'Why does anthracene react at C9/C10 instead of an outer ring?', choices: ['The product keeps two aromatic benzene rings', 'C9 is more electronegative', 'Steric hindrance', 'It reacts at random'], ans: 0 },
      { q: 'Describe the Diels–Alder mechanism, including the movement of electrons and why it is called concerted.', text: true }
    ],
    key: S => [['Anthracene', S.m0 + ' g'], ['Theoretical', (S.m0 / 178.23 * 276.29).toFixed(3) + ' g']]
  });

  // ------------------------------------------------------------------ 4
  CL.lab({
    id: 'oc2-04', course: 'oc2', n: 4, title: 'Electrophilic Aromatic Substitution: Nitration of Methyl Benzoate', time: '3 h', skills: 'EAS · directing effects · ¹H NMR',
    goals: ['Nitrate methyl benzoate with mixed acid under temperature control.', 'Recrystallize the product and calculate the yield.', 'Use ¹H NMR to prove meta substitution.'],
    intro: `<p>Concentrated H₂SO₄ protonates HNO₃, which then loses water to form the nitronium ion, NO₂⁺, a powerful electrophile. The ester group (–CO₂CH₃) withdraws electrons, so it <b>deactivates</b> the ring and directs substitution to the <b>meta</b> position. Ortho or para attack would put positive charge on the carbon bearing the electron-withdrawing group.</p>
      <div class="eq">methyl benzoate (136.15 g/mol, d 1.09 g/mL) → methyl 3-nitrobenzoate (181.15 g/mol, mp 78 °C)</div>
      <p>Keep the temperature below 15 °C, because warmer conditions give dinitration.</p>`,
    safety: ['Conc. HNO₃/H₂SO₄ is extremely corrosive and a strong oxidizer — face shield, gloves, hood.', 'Always add acid to ice/water, never water to acid.'],
    setup: R => ({ m0: R.between(2.10, 2.25, 3) }),
    prelab: [
      { q: 'Mass of 2.00 mL methyl benzoate (d 1.09).', unit: 'g', ans: 2.18, tol: 0.005 },
      { q: 'The electrophile in this reaction is…', choices: ['NO₂⁺', 'NO₃⁻', 'H₂SO₄', 'HNO₂'], ans: 0 }
    ],
    parts: [
      {
        title: 'Synthesis', sim: S => ({
          type: 'synth', k: 'nit', title: 'Nitration', sm: { name: 'methyl benzoate', MW: 136.15, mass: S.m0, label: '2.00 mL methyl benzoate in 6 mL conc. H₂SO₄' }, product: { name: 'methyl 3-nitrobenzoate', MW: 181.15, mp: [77, 78] }, base: 0.74,
          steps: [
            { k: 'acid', l: 'Nitrating mixture:', opts: [{ v: 'mixed', l: '1.5 mL conc. HNO₃ + 1.5 mL conc. H₂SO₄ (pre-cooled)', y: 1, p: 1 }, { v: 'hno3', l: 'Conc. HNO₃ only', y: 0.3, p: 0.95, note: 'Without H₂SO₄, little NO₂⁺ formed.' }, { v: 'dil', l: '3 M HNO₃', fail: 'No nitration — dilute nitric acid cannot generate NO₂⁺.' }] },
            { k: 'temp', l: 'Temperature during addition:', opts: [{ v: 'cold', l: 'Dropwise, kept at 5–15 °C in ice', y: 1, p: 1 }, { v: 'warm', l: 'Allowed to warm to 50 °C', y: 0.8, p: 0.75, note: 'Dinitration and oxidation side products formed.' }] },
            { k: 'quench', l: 'Quench:', opts: [{ v: 'ice', l: 'Pour the mixture onto 20 g of crushed ice', y: 1, p: 1 }, { v: 'water', l: 'Add 20 mL water into the acid flask', y: 0.9, p: 0.95, note: 'Violent spattering — dangerous and some product lost.' }] },
            { k: 'rx', l: 'Purification:', opts: [{ v: 'meoh', l: 'Recrystallize from hot methanol', y: 0.88, p: 1 }, { v: 'none', l: 'Air-dry the crude solid', y: 1, p: 0.85 }] }
          ]
        })
      },
      { title: '¹H NMR of the product', sim: { type: 'spectrum', title: '¹H NMR (300 MHz, CDCl₃)', spectra: [{ v: 'p', l: 'Your product', kind: 'hnmr', peaks: [[8.87, 1, 's'], [8.42, 1, 'd', 8.2], [8.37, 1, 'd', 7.8], [7.66, 1, 't', 8.0], [3.99, 3, 's']] }] } }
    ],
    questions: [
      { q: 'Theoretical yield.', unit: 'g', ans: (S, D) => theo(D, 'nit', 136.15, 181.15), tol: 0.004 },
      { q: 'Percent yield.', unit: '%', ans: (S, D) => pctYield(D, 'nit', 136.15, 181.15), atol: 0.3 },
      { q: 'Onset of your product’s melting range.', unit: '°C', ans: (S, D) => D('nit_mplo'), atol: 0.5, truth: 76.5, tatol: 3 },
      { q: 'Number of aromatic ¹H signals in your product’s spectrum.', ans: 4, int: true },
      { q: 'The NMR shows the product is the…', choices: ['meta isomer', 'para isomer', 'ortho isomer'], ans: 0, why: 'A para isomer would show only two aromatic doublets (2H each).' },
      { q: 'Why is the ester a meta director?', choices: ['It withdraws electrons, destabilizing the ortho/para σ-complexes', 'It donates electrons by resonance', 'Steric hindrance only', 'It is ortho/para directing'], ans: 0 },
      { q: 'Draw (describe) the resonance structures of the σ-complex for meta attack and explain why it is the least destabilized.', text: true }
    ],
    key: S => [['Methyl benzoate', S.m0 + ' g'], ['Theoretical', (S.m0 / 136.15 * 181.15).toFixed(3) + ' g']]
  });

  // ------------------------------------------------------------------ 5
  CL.lab({
    id: 'oc2-05', course: 'oc2', n: 5, title: 'Aldol Condensation: Synthesis of Dibenzalacetone', time: '2.5 h', skills: 'enolates · crossed aldol · conjugation',
    goals: ['Carry out a base-catalysed double crossed-aldol condensation.', 'Control stoichiometry to favour the double condensation product.', 'Characterize the product by melting point and explain its colour.'],
    intro: `<div class="eq">2 PhCHO (106.12 g/mol) + CH₃COCH₃ (58.08 g/mol) → (NaOH, EtOH/H₂O) → PhCH=CH–CO–CH=CHPh (234.29 g/mol) + 2 H₂O</div>
      <p>Hydroxide deprotonates acetone to form an enolate, which adds to benzaldehyde. Benzaldehyde has no α-H, so it cannot enolize itself. The aldol product dehydrates to a conjugated enone. Because acetone has α-H on both sides, this happens twice. With at least 2 equivalents of benzaldehyde the main product is <b>dibenzalacetone</b>, a yellow solid (mp 110–111 °C, trans,trans). Its extended conjugation absorbs violet-blue light.</p><p>Acetone is the limiting reagent.</p>`,
    safety: ['NaOH solution is corrosive.', 'Benzaldehyde is an irritant.'],
    setup: R => ({ m0: R.between(0.58, 0.64, 3) }),
    prelab: [
      { q: 'Moles in 0.58 g acetone.', unit: 'mol', ans: 0.58 / 58.08, tol: 0.005 },
      { q: 'Why can benzaldehyde not undergo self-condensation?', choices: ['It has no α-hydrogens', 'It is too hindered', 'It is not electrophilic', 'It is a ketone'], ans: 0 }
    ],
    parts: [{
      title: 'Synthesis', sim: S => ({
        type: 'synth', k: 'ald', title: 'Crossed aldol condensation', sm: { name: 'acetone', MW: 58.08, mass: S.m0, label: 'Acetone (limiting)' }, product: { name: 'dibenzalacetone', MW: 234.29, mp: [110, 111] }, base: 0.82,
        steps: [
          { k: 'ratio', l: 'Benzaldehyde : acetone mole ratio:', opts: [{ v: '2.2', l: '2.2 : 1', y: 1, p: 1 }, { v: '1', l: '1 : 1', y: 0.6, p: 0.75, note: 'TLC shows a lot of benzalacetone (mono product).' }, { v: '0.3', l: '1 : 3', y: 0.25, p: 0.6, note: 'Mostly benzalacetone, an oil.' }] },
          { k: 'base', l: 'Catalyst:', opts: [{ v: 'naoh', l: '10% NaOH in ethanol/water', y: 1, p: 1 }, { v: 'hcl', l: '1 M HCl', fail: 'No enolate formed under these conditions — no reaction in 30 min.' }, { v: 'bicarb', l: 'NaHCO₃ (sat.)', y: 0.1, p: 0.9, note: 'Too weak a base; a trace of yellow solid.' }] },
          { k: 'time', l: 'Reaction time:', opts: [{ v: '30', l: 'Stir 30 min at room temperature', y: 1, p: 1 }, { v: '2', l: '2 min', y: 0.35, p: 0.9 }] },
          { k: 'pur', l: 'Purification:', opts: [{ v: 'rx', l: 'Wash with water, recrystallize from hot ethanol', y: 0.88, p: 1 }, { v: 'none', l: 'Filter and dry only', y: 1, p: 0.85, note: 'Sticky yellow solid.' }] }
        ]
      })
    }],
    questions: [
      { q: 'Theoretical yield of dibenzalacetone.', unit: 'g', ans: (S, D) => theo(D, 'ald', 58.08, 234.29), tol: 0.004 },
      { q: 'Percent yield.', unit: '%', ans: (S, D) => pctYield(D, 'ald', 58.08, 234.29), atol: 0.3 },
      { q: 'Onset of your product’s melting range.', unit: '°C', ans: (S, D) => D('ald_mplo'), atol: 0.5, truth: 109.5, tatol: 3 },
      { q: 'Number of aldol condensation steps per acetone molecule.', ans: 2, int: true },
      { q: 'Why is dibenzalacetone yellow?', choices: ['Extended conjugation lowers the π→π* energy into the visible region', 'It contains iron', 'It is an aldehyde', 'It fluoresces in UV only'], ans: 0 },
      { q: 'Write the mechanism of the first aldol addition and dehydration (E1cB).', text: true }
    ],
    key: S => [['Acetone', S.m0 + ' g'], ['Theoretical', (S.m0 / 58.08 * 234.29).toFixed(3) + ' g']]
  });

  // ------------------------------------------------------------------ 6
  CL.lab({
    id: 'oc2-06', course: 'oc2', n: 6, title: 'Fischer Esterification: Isopentyl Acetate (Banana Oil)', time: '3 h', skills: 'equilibrium · reflux · extraction · IR',
    goals: ['Synthesize an ester by acid-catalysed Fischer esterification.', 'Use Le Châtelier’s principle to drive the equilibrium.', 'Purify by extraction and distillation; confirm by IR.'],
    intro: `<div class="eq">CH₃COOH + (CH₃)₂CHCH₂CH₂OH ⇌ (H₂SO₄) ⇌ CH₃COOCH₂CH₂CH(CH₃)₂ + H₂O &nbsp;&nbsp; K ≈ 4</div>
      <p>Fischer esterification is an equilibrium, so it is driven forward by using excess acetic acid. H₂SO₄ catalyses it by protonating the carbonyl so the alcohol can add. In the workup, NaHCO₃ removes acetic and sulfuric acid (CO₂ is released), brine and Na₂SO₄ dry the product, and distillation (bp 142 °C) purifies it.</p>
      <div class="eq">isopentyl alcohol 88.15 g/mol (5.0 mL, d 0.810, limiting) &nbsp;&nbsp; isopentyl acetate 130.19 g/mol</div>`,
    safety: ['Glacial acetic acid and conc. H₂SO₄ are corrosive.', 'Vent the separatory funnel during the bicarbonate wash.'],
    setup: R => ({ m0: R.between(3.95, 4.15, 3) }),
    prelab: [
      { q: 'Theoretical yield of isopentyl acetate from 4.05 g isopentyl alcohol.', unit: 'g', ans: 4.05 / 88.15 * 130.19, tol: 0.01 },
      { q: 'Role of H₂SO₄:', choices: ['Catalyst', 'Limiting reagent', 'Solvent', 'Drying agent'], ans: 0 }
    ],
    parts: [
      {
        title: 'Synthesis', sim: S => ({
          type: 'synth', k: 'est', title: 'Fischer esterification', sm: { name: 'isopentyl alcohol', MW: 88.15, mass: S.m0, label: '5.0 mL 3-methyl-1-butanol (limiting)' }, product: { name: 'isopentyl acetate', MW: 130.19, bp: 142 }, base: 0.72,
          steps: [
            { k: 'cat', l: 'Catalyst:', opts: [{ v: 'h2so4', l: '1 mL conc. H₂SO₄', y: 1, p: 1 }, { v: 'none', l: 'None', y: 0.08, p: 1, note: 'Without acid the reaction barely proceeds.' }, { v: 'naoh', l: '1 mL 6 M NaOH', fail: 'Base converts acetic acid to acetate, which cannot be attacked — no ester.' }] },
            { k: 'hoac', l: 'Acetic acid:', opts: [{ v: 'xs', l: '7 mL glacial (≈ 2.7 equiv)', y: 1, p: 1 }, { v: 'eq', l: '2.6 mL (1.0 equiv)', y: 0.68, p: 0.97 }] },
            { k: 'heat', l: 'Heating:', opts: [{ v: 'reflux', l: 'Reflux 60 min', y: 1, p: 1 }, { v: 'short', l: 'Reflux 10 min', y: 0.45, p: 0.95 }, { v: 'open', l: 'Boil in an open beaker 60 min', y: 0.3, p: 0.9, note: 'The banana smell filled the room — the product evaporated.' }] },
            { k: 'wash', l: 'Washing:', opts: [{ v: 'bicarb', l: 'Water, then 5% NaHCO₃ until CO₂ stops, then brine', y: 0.95, p: 1 }, { v: 'water', l: 'Water only', y: 1, p: 0.82, note: 'Product smells of vinegar.' }] },
            { k: 'dry', l: 'Drying:', opts: [{ v: 'na2so4', l: 'Anhydrous Na₂SO₄', y: 0.97, p: 1 }, { v: 'none', l: 'None', y: 1, p: 0.9 }] },
            { k: 'dist', l: 'Distillation — collect:', opts: [{ v: 'right', l: '138–143 °C', y: 0.92, p: 1 }, { v: 'low', l: '100–120 °C', y: 0.2, p: 0.75 }] }
          ]
        })
      },
      { title: 'IR comparison', sim: { type: 'spectrum', title: 'IR spectra', spectra: [{ v: 'sm', l: 'Isopentyl alcohol', kind: 'ir', peaks: [[3340, 1.1, 110], [2958, 0.9, 12], [2930, 0.6, 10], [2872, 0.5, 10], [1468, 0.4, 10], [1385, 0.3, 8], [1367, 0.3, 8], [1058, 0.8, 12]] }, { v: 'pr', l: 'Your product', kind: 'ir', peaks: [[2960, 0.8, 12], [2875, 0.4, 10], [1742, 1.6, 10], [1470, 0.3, 10], [1367, 0.5, 8], [1240, 1.4, 15], [1055, 0.7, 12]] }] } }
    ],
    questions: [
      { q: 'Theoretical yield.', unit: 'g', ans: (S, D) => theo(D, 'est', 88.15, 130.19), tol: 0.004 },
      { q: 'Percent yield.', unit: '%', ans: (S, D) => pctYield(D, 'est', 88.15, 130.19), atol: 0.3 },
      { q: 'IR evidence for ester formation:', choices: ['O–H band gone; strong C=O at 1742 and C–O at 1240 cm⁻¹', 'Broad O–H 2500–3300 cm⁻¹', 'C=O at 1710 only', 'N–H at 3300 cm⁻¹'], ans: 0 },
      { q: 'Why use excess acetic acid?', choices: ['To shift the equilibrium toward the ester (Le Châtelier)', 'To dry the product', 'Acetic acid is the catalyst', 'To lower the boiling point'], ans: 0 },
      { q: 'Purpose of the NaHCO₃ wash:', choices: ['Remove residual acetic and sulfuric acids', 'Hydrolyse the ester', 'Remove water', 'Remove unreacted alcohol'], ans: 0 },
      { q: 'Suggest one other way to drive this equilibrium toward the ester, and explain.', text: true }
    ],
    key: S => [['Alcohol', S.m0 + ' g'], ['Theoretical', (S.m0 / 88.15 * 130.19).toFixed(3) + ' g']]
  });

  // ------------------------------------------------------------------ 7
  CL.lab({
    id: 'oc2-07', course: 'oc2', n: 7, title: 'Sodium Borohydride Reduction of 9-Fluorenone', time: '2.5 h', skills: 'hydride reduction · TLC monitoring · IR',
    goals: ['Reduce a ketone to a secondary alcohol with NaBH₄.', 'Monitor the reaction by TLC.', 'Confirm the product by IR, melting point and the colour change.'],
    intro: `<div class="eq">4 (9-fluorenone, 180.20 g/mol, yellow) + NaBH₄ → (MeOH; then H₃O⁺) → 4 (9-fluorenol, 182.22 g/mol, white, mp 153–154 °C)</div>
      <p>Borohydride delivers hydride (H⁻) to the carbonyl carbon. Each BH₄⁻ can deliver four hydrides. Acidic workup protonates the alkoxide and destroys excess hydride (H₂ gas). 9-Fluorenone is yellow because its C=O is conjugated with the aromatic rings. Fluorenol is white. Fluorenol's OH group makes it <b>more polar</b>, so it has the lower Rf.</p>`,
    safety: ['NaBH₄ reacts with acid to release flammable H₂ — add acid slowly in the hood.', 'Methanol is toxic and flammable.'],
    setup: R => ({ m0: R.between(0.48, 0.52, 3) }),
    prelab: [
      { q: 'Moles of hydride that one mole of NaBH₄ can deliver.', ans: 4, int: true },
      { q: 'Minimum mass of NaBH₄ (37.83 g/mol) to reduce 0.500 g fluorenone.', unit: 'g', ans: 0.5 / 180.2 / 4 * 37.83, tol: 0.01 }
    ],
    parts: [
      {
        title: 'Reduction', sim: S => ({
          type: 'synth', k: 'red', title: 'NaBH₄ reduction', sm: { name: '9-fluorenone', MW: 180.20, mass: S.m0, label: '9-Fluorenone in 10 mL methanol' }, product: { name: '9-fluorenol', MW: 182.22, mp: [153, 154] }, base: 0.86,
          steps: [
            { k: 'red', l: 'Reagent:', opts: [{ v: 'nabh4', l: 'NaBH₄ (0.05 g, excess) in portions', y: 1, p: 1 }, { v: 'naoh', l: 'NaOH (0.05 g)', fail: 'No reduction — the yellow colour never faded.' }, { v: 'little', l: 'NaBH₄ (0.005 g)', y: 0.5, p: 0.7, note: 'Solution stayed pale yellow.' }] },
            { k: 'mon', l: 'When to stop:', opts: [{ v: 'tlc', l: 'When TLC shows the fluorenone spot is gone (≈ 15 min)', y: 1, p: 1 }, { v: 'fixed', l: 'After 1 min, regardless', y: 0.7, p: 0.75 }] },
            { k: 'work', l: 'Workup:', opts: [{ v: 'acid', l: 'Add 3 M H₂SO₄ dropwise, then cold water; vacuum-filter', y: 1, p: 1 }, { v: 'evap', l: 'Evaporate the methanol and weigh the residue', y: 1.15, p: 0.75, note: 'Borate salts contaminated the solid.' }] },
            { k: 'rx', l: 'Purification:', opts: [{ v: 'rx', l: 'Recrystallize from hexane/acetone', y: 0.88, p: 1 }, { v: 'none', l: 'None', y: 1, p: 0.9 }] }
          ]
        })
      },
      { title: 'TLC monitoring', sim: { type: 'tlc', title: 'TLC plate', mix: { l: 'Ethyl acetate in hexane', short: 'EtOAc/hexane', min: 0, max: 60, step: 5, val: 25, e: p => 0.05 + 0.007 * p }, autoPct: 30, lanes: [{ k: 'sm', l: 'Fluorenone', short: 'SM', spots: [{ p: 0.38, color: 'rgba(225,190,40,.9)' }] }, { k: 'co', l: 'Co-spot', short: 'Co', spots: [{ p: 0.38, color: 'rgba(225,190,40,.9)' }, { p: 0.55 }] }, { k: 'pr', l: 'Reaction (15 min)', short: 'Rxn', spots: [{ p: 0.55 }] }] } },
      { title: 'IR comparison', sim: { type: 'spectrum', title: 'IR spectra', spectra: [{ v: 'sm', l: '9-Fluorenone', kind: 'ir', peaks: [[3060, 0.3, 10], [1715, 1.5, 10], [1610, 0.6, 6], [1450, 0.5, 6], [1300, 0.4, 8], [920, 0.3, 8], [740, 1.0, 8]] }, { v: 'pr', l: 'Your product', kind: 'ir', peaks: [[3300, 0.9, 90], [3040, 0.3, 10], [1450, 0.6, 6], [1050, 0.6, 10], [1020, 0.5, 10], [740, 1.1, 8]] }] } }
    ],
    questions: [
      { q: 'Theoretical yield of 9-fluorenol.', unit: 'g', ans: (S, D) => theo(D, 'red', 180.20, 182.22), tol: 0.004 },
      { q: 'Percent yield.', unit: '%', ans: (S, D) => pctYield(D, 'red', 180.20, 182.22), atol: 0.3 },
      { q: 'Rf of 9-fluorenone on your plate.', ans: (S, D) => D('d_sm_1') / D('tlc_front'), atol: 0.012 },
      { q: 'Rf of 9-fluorenol (product lane).', ans: (S, D) => D('d_pr_1') / D('tlc_front'), atol: 0.012 },
      { q: 'Why does fluorenol have the lower Rf?', choices: ['Its O–H hydrogen-bonds to silica (more polar)', 'It is heavier', 'It is coloured', 'It is less polar'], ans: 0 },
      { q: 'Why does the yellow colour disappear?', choices: ['The conjugated C=O chromophore is converted to an sp³ C–OH', 'NaBH₄ bleaches dyes', 'Methanol is colourless', 'The product precipitates'], ans: 0 },
      { q: 'Explain how the IR spectra prove the reduction, citing specific bands.', text: true }
    ],
    key: S => [['Fluorenone', S.m0 + ' g'], ['Theoretical', (S.m0 / 180.2 * 182.22).toFixed(3) + ' g']]
  });

  // ------------------------------------------------------------------ 8
  const TESTS = { dnp: '2,4-DNP', tol: 'Tollens’ reagent', iod: 'Iodoform (I₂/NaOH)', luc: 'Lucas reagent (ZnCl₂/HCl)', jon: 'Jones / chromic acid', br2: 'Br₂ in CH₂Cl₂', fe: 'FeCl₃ (aq)', bic: 'NaHCO₃ (aq)' };
  const POS = { dnp: ['Yellow-orange precipitate', '#f0a020'], tol: ['Silver mirror on the tube', '#c8c8c8'], iod: ['Yellow precipitate (CHI₃), antiseptic smell', '#f3d64a'], luc: ['', '#eeeeee'], jon: ['Orange solution turns blue-green within seconds', '#2f8f6a'], br2: ['Red-brown colour disappears immediately', null], fe: ['Intense violet colour', '#6a2a9a'], bic: ['Vigorous bubbling (CO₂)', null] };
  const NEG = { dnp: 'No precipitate (solution stays yellow)', tol: 'No mirror; solution stays clear', iod: 'No yellow precipitate', luc: 'Stays clear for 10 min', jon: 'Stays orange', br2: 'Red-brown colour persists', fe: 'Pale yellow (no change)', bic: 'No bubbles' };
  const ORG = [
    { n: 'Butanal', t: ['dnp', 'tol', 'jon'] }, { n: '2-Butanone', t: ['dnp', 'iod'] }, { n: 'Cyclohexanone', t: ['dnp'] }, { n: 'Acetophenone', t: ['dnp', 'iod'] },
    { n: '1-Butanol', t: ['jon'] }, { n: '2-Butanol', t: ['jon', 'iod', 'luc5'] }, { n: '2-Methyl-2-propanol', t: ['luc0'] }, { n: 'Cyclohexene', t: ['br2'] }, { n: 'Phenol', t: ['fe', 'br2'] }, { n: 'Propanoic acid', t: ['bic'] }
  ];
  const orgObs = (o, t) => {
    if (t === 'luc') { if (o.t.includes('luc0')) return { obs: 'Cloudy immediately — a separate layer forms', color: 'rgba(230,230,230,.7)', layer: 'rgba(240,240,240,.85)' }; if (o.t.includes('luc5')) return { obs: 'Turns cloudy after ~5 min', color: 'rgba(230,230,230,.55)' }; return { obs: NEG.luc, color: 'rgba(210,230,245,.3)' }; }
    if (o.t.includes(t)) { const [txt, col] = POS[t]; return { obs: txt, color: t === 'jon' ? 'rgba(47,143,106,.65)' : t === 'fe' ? 'rgba(106,42,154,.7)' : t === 'br2' ? 'rgba(240,240,230,.3)' : 'rgba(220,230,240,.4)', ppt: t === 'dnp' || t === 'iod' ? col : null, gas: t === 'bic', swatch: col || undefined }; }
    return { obs: NEG[t], color: t === 'jon' ? 'rgba(235,130,30,.65)' : t === 'br2' ? 'rgba(170,70,30,.6)' : t === 'fe' ? 'rgba(240,220,120,.45)' : 'rgba(210,230,245,.3)' };
  };
  CL.lab({
    id: 'oc2-08', course: 'oc2', n: 8, title: 'Qualitative Organic Analysis: Classification Tests', time: '3 h', skills: 'functional-group tests · deductive identification',
    goals: ['Perform classic functional-group tests on known compounds.', 'Interpret positive and negative results chemically.', 'Identify two unknown compounds from their test pattern.'],
    intro: `<table><tr><th>Test</th><th>Positive for</th><th>Positive result</th></tr>
      <tr><td>2,4-DNP</td><td>aldehydes & ketones</td><td>yellow–orange precipitate (hydrazone)</td></tr>
      <tr><td>Tollens'</td><td>aldehydes</td><td>silver mirror (Ag⁺ → Ag)</td></tr>
      <tr><td>Iodoform</td><td>methyl ketones, CH₃CH(OH)–</td><td>yellow CHI₃ precipitate</td></tr>
      <tr><td>Lucas</td><td>3° (immediate) and 2° (≈ 5 min) alcohols</td><td>cloudiness (alkyl chloride)</td></tr>
      <tr><td>Jones (CrO₃/H₂SO₄)</td><td>1° and 2° alcohols, aldehydes</td><td>orange → blue-green (Cr⁶⁺ → Cr³⁺)</td></tr>
      <tr><td>Br₂/CH₂Cl₂</td><td>alkenes (and phenols)</td><td>red-brown colour vanishes</td></tr>
      <tr><td>FeCl₃</td><td>phenols</td><td>violet/blue complex</td></tr>
      <tr><td>NaHCO₃</td><td>carboxylic acids</td><td>CO₂ bubbles</td></tr></table>
      <p>Test the known compounds first so you recognise what a positive looks like. Then test your unknowns and narrow down their identity by elimination.</p>`,
    safety: ['Chromium(VI) is a carcinogen — collect all Jones waste separately.', 'Never store Tollens’ reagent; it can form explosive silver nitride. Destroy it with dilute HNO₃ right away.', 'Bromine is toxic and corrosive.'],
    setup: R => { const ids = R.shuffle(ORG.map((_, i) => i)); return { a: ids[0], b: ids[1] }; },
    prelab: [
      { q: 'A compound gives a positive 2,4-DNP test but a negative Tollens test. It is likely a(n)…', choices: ['aldehyde', 'ketone', 'alcohol', 'alkene'], ans: 1 },
      { q: 'Which alcohol reacts fastest with Lucas reagent?', choices: ['1-butanol', '2-butanol', '2-methyl-2-propanol'], ans: 2 },
      { q: 'Which compound gives a positive iodoform test?', choices: ['2-butanone', '3-pentanone', 'cyclohexanone'], ans: 0 }
    ],
    parts: [{
      title: 'Classification tests', steps: ['Run each test on a few known compounds to learn the positive and negative appearances.', 'Run all eight tests on Unknown A and Unknown B.'],
      sim: { type: 'bench', title: 'Spot-test rack', instrument: 'Observation', icon: 'tube', controls: [{ k: 's', l: 'Compound', opts: ORG.map((o, i) => ({ v: i, l: o.n })).concat([{ v: 'A', l: 'UNKNOWN A' }, { v: 'B', l: 'UNKNOWN B' }]) }, { k: 't', l: 'Test', opts: Object.entries(TESTS).map(([v, l]) => ({ v, l })) }], actions: [{ l: 'Run test', key: c => `qt_${c.s}_${c.t}`, label: c => `${c.s === 'A' || c.s === 'B' ? 'Unknown ' + c.s : ORG[c.s].n}: ${TESTS[c.t]}`, read: (S, c) => orgObs(ORG[c.s === 'A' ? S.a : c.s === 'B' ? S.b : c.s], c.t) }] }
    }],
    questions: [
      { q: 'Identity of Unknown A.', choices: ORG.map(o => o.n), ans: S => S.a },
      { q: 'Identity of Unknown B.', choices: ORG.map(o => o.n), ans: S => S.b },
      { q: 'Why does 2-butanol give a positive iodoform test even though it is not a ketone?', choices: ['I₂/NaOH first oxidizes it to 2-butanone, a methyl ketone', 'It is an aldehyde', 'Alcohols always give iodoform', 'It contains iodine'], ans: 0 },
      { q: 'Why is 2-methyl-2-propanol negative in the Jones test?', choices: ['Tertiary alcohols have no H on the carbinol carbon to remove', 'It is too volatile', 'It is an aldehyde', 'Chromium is reduced too fast'], ans: 0 },
      { q: 'For each unknown, list the tests that were positive and negative and explain how they lead to your identification.', text: true, rows: 6 }
    ],
    key: S => [['Unknown A', ORG[S.a].n], ['Unknown B', ORG[S.b].n]]
  });
})();
