/* Biochemistry — virtual lab definitions */
(function () {
  'use strict';
  const C = CL.chem;
  CL.course({ id: 'bc', code: 'CHEM 451L', title: 'Biochemistry', short: 'Biochem', color: '#A07800', blurb: 'Amino-acid acid–base chemistry, protein quantitation, enzyme kinetics and protein electrophoresis.' });

  // ------------------------------------------------------------------ 1
  const AA = [{ n: 'Glycine', pKa: [2.34, 9.60], z: 1, pI: 5.97 }, { n: 'Aspartic acid', pKa: [1.88, 3.65, 9.60], z: 1, pI: 2.77 }, { n: 'Glutamic acid', pKa: [2.19, 4.25, 9.67], z: 1, pI: 3.22 }, { n: 'Histidine', pKa: [1.82, 6.00, 9.17], z: 2, pI: 7.59 }, { n: 'Lysine', pKa: [2.18, 8.95, 10.53], z: 2, pI: 9.74 }];
  const aaSol = (S, V) => ({ V: (40 + V) / 1000, sa: S.aa.z * 1e-3, sb: 0.1 * V / 1000, wa: [{ n: 1e-3, pKa: S.aa.pKa, z: S.aa.z }] });
  CL.lab({
    id: 'bc-01', course: 'bc', n: 1, title: 'Titration Curve of an Unknown Amino Acid', time: '3 h', skills: 'polyprotic titration · pKa · isoelectric point',
    goals: ['Titrate a fully protonated amino acid with NaOH while recording pH.', 'Determine the number of ionizable groups and their pKa values.', 'Identify the amino acid and calculate its isoelectric point.'],
    intro: `<p>Amino acids have at least two ionizable groups, the α-COOH (pKa ≈ 2) and the α-NH₃⁺ (pKa ≈ 9–10). Some also have an ionizable side chain. Starting from the fully protonated form (the amino acid dissolved in HCl), each equivalent of NaOH removes one proton. Each group shows a buffering plateau centred at its pKa (the half-equivalence point).</p>
      <p>The <b>isoelectric point</b> (pI) is the pH at which the net charge is zero. It is the average of the two pKa values on either side of the neutral (zwitterion) form. Acidic side chain: pI = (pKa₁ + pKa₂)/2. Basic side chain: pI = (pKa₂ + pKa₃)/2.</p>
      <table><tr><th>Amino acid</th>${AA.map(a => `<td>${a.n}</td>`).join('')}</tr><tr><th>pKa values</th>${AA.map(a => `<td>${a.pKa.join(', ')}</td>`).join('')}</tr></table>
      <p>Your sample: 1.00 mmol amino acid in 40 mL water (fully protonated with HCl). Titrant: 0.100 M NaOH, so each equivalent takes 10.0 mL.</p>`,
    safety: ['NaOH is corrosive.'],
    setup: R => ({ aa: R.pick(AA) }),
    prelab: [
      { q: 'How many mL of 0.100 M NaOH are needed per equivalent for 1.00 mmol of amino acid?', unit: 'mL', ans: 10, atol: 0.01 },
      { q: 'pI of glycine (pKa 2.34 and 9.60).', ans: 5.97, atol: 0.01 },
      { q: 'At pH 7, glycine exists mainly as…', choices: ['H₃N⁺–CH₂–COOH', 'H₃N⁺–CH₂–COO⁻ (zwitterion)', 'H₂N–CH₂–COO⁻'], ans: 1 }
    ],
    parts: [{ title: 'pH titration', steps: ['Calibrate the pH meter.', 'Add NaOH in 0.5–1 mL portions, recording pH, until pH ≈ 12.'], sim: S => ({ type: 'titration', title: 'Amino acid titration', ph: true, plotMax: 35, titrant: { l: '0.100 M NaOH', C: 0.1, kind: 'base', short: 'NaOH' }, indicators: ['none'], trials: [{ k: 'aa', l: 'Unknown amino acid', desc: '1.00 mmol unknown amino acid (fully protonated) in 40 mL water', sol: { V0: 40, sa: S.aa.z * 1e-3, wa: [{ n: 1e-3, pKa: S.aa.pKa, z: S.aa.z }] } }] }) }],
    questions: [
      { q: 'Number of ionizable groups (equivalents of NaOH consumed).', ans: S => S.aa.pKa.length, int: true },
      { q: 'pH at the first half-equivalence point (5.0 mL).', ans: S => C.pH(aaSol(S, 5)), atol: 0.15 },
      { q: 'pH at the second half-equivalence point (15.0 mL).', ans: S => C.pH(aaSol(S, 15)), atol: 0.15 },
      { q: 'Identity of the amino acid.', choices: AA.map(a => a.n), ans: S => AA.indexOf(S.aa) },
      { q: 'Isoelectric point of your amino acid (use literature pKa values for the identified amino acid).', ans: S => S.aa.pI, atol: 0.05 },
      { q: 'Why does the first pKa read from the curve differ from the literature value?', choices: ['At low pH a significant fraction of [H⁺] comes from the acid itself, so pH at half-equivalence ≠ pKa exactly', 'The pH meter is broken', 'The amino acid decomposed', 'NaOH is not a strong base'], ans: 0 },
      { q: 'Sketch (describe) the charge of your amino acid in each region of the curve.', text: true }
    ],
    key: S => [['Amino acid', `${S.aa.n} (pKa ${S.aa.pKa.join(', ')}; pI ${S.aa.pI})`]]
  });

  // ------------------------------------------------------------------ 2
  const brad = C.band(595, 1, 45);
  const bradA = (S, c) => S.Am * c / (S.K + c);
  CL.lab({
    id: 'bc-02', course: 'bc', n: 2, title: 'Protein Quantitation by the Bradford Assay', time: '2 h', skills: 'colorimetric assay · standard curve · dilution',
    goals: ['Prepare BSA standards and react them with Coomassie dye reagent.', 'Construct a standard curve at 595 nm.', 'Determine the protein concentration of an unknown.'],
    intro: `<p>Coomassie Brilliant Blue G-250 binds proteins, mainly at arginine and aromatic residues. Binding shifts the dye's absorbance maximum from 465 nm (reddish-brown free dye) to <b>595 nm</b> (blue). A595 rises with protein concentration. The response is linear only over a limited range and curves at high concentration.</p>
      <p>Standards: bovine serum albumin (BSA) at 0.10–1.00 mg/mL. Your unknown was diluted <b>1 : 5</b> before the assay. Zero the instrument against a reagent blank (buffer + dye).</p>`,
    safety: ['Bradford reagent contains phosphoric acid and methanol — gloves and goggles.'],
    setup: R => { const K = R.between(4.5, 6.0, 2); return { K, Am: CL.round(R.between(0.68, 0.78) * (K + 1), 3), c0: R.between(1.5, 4.0, 2) }; },
    prelab: [
      { q: 'The diluted unknown reads 0.48 mg/mL. Concentration of the original (1:5 dilution)?', unit: 'mg/mL', ans: 2.4, atol: 0.001 },
      { q: 'Why is the absorbance measured at 595 nm?', choices: ['It is the λmax of the protein-bound dye', 'Proteins absorb there', 'The free dye absorbs there', 'It is the only visible wavelength'], ans: 0 }
    ],
    parts: [{ title: 'Standards and unknown', sim: [{ type: 'spectro', title: 'Spectrophotometer', l0: 500, samples: S => [{ v: 'blank', l: 'Reagent blank', blank: true }].concat([0.1, 0.25, 0.5, 0.75, 1.0].map((c, i) => ({ v: 'b' + (i + 1), l: `BSA ${c.toFixed(2)} mg/mL`, A: l => bradA(S, c) * brad(l) }))).concat([{ v: 'unk', l: 'Unknown (diluted 1:5)', A: l => bradA(S, S.c0 / 5) * brad(l) }]) }, { type: 'graph', k: 'brad', title: 'Bradford standard curve', short: 'Standard curve', xl: 'BSA (mg/mL)', yl: 'A595', rows: 6, fill: (S, D) => [[0, 0]].concat([0.1, 0.25, 0.5, 0.75, 1.0].map((c, i) => [c, D('A_b' + (i + 1))])) }] }],
    questions: [
      { q: 'Wavelength you used.', unit: 'nm', ans: 595, atol: 6 },
      { q: 'Slope of your standard curve.', unit: 'mL/mg', ans: (S, D) => D('brad_slope'), tol: 0.01 },
      { q: 'Protein concentration of the diluted unknown.', unit: 'mg/mL', ans: (S, D) => (D('A_unk') - D('brad_int')) / D('brad_slope'), tol: 0.015, truth: S => S.c0 / 5, ttol: 0.1 },
      { q: 'Protein concentration of the original unknown.', unit: 'mg/mL', ans: (S, D) => (D('A_unk') - D('brad_int')) / D('brad_slope') * 5, tol: 0.015, truth: S => S.c0, ttol: 0.1 },
      { q: 'Why was the unknown diluted before the assay?', choices: ['To bring its absorbance within the linear range of the standards', 'To save reagent', 'To change λmax', 'To denature the protein'], ans: 0 },
      { q: 'Your standard curve is slightly curved. How would this affect an unknown that falls near the top of the range?', text: true }
    ],
    key: S => [['Unknown (original)', S.c0 + ' mg/mL'], ['Model', `A = ${S.Am}·c/(${S.K} + c)`]]
  });

  // ------------------------------------------------------------------ 3
  const SC = [0.10, 0.20, 0.40, 0.80, 1.60, 3.20];
  const eps = 0.018; // A per µM (p-nitrophenolate, 405 nm, 1 cm)
  CL.lab({
    id: 'bc-03', course: 'bc', n: 3, title: 'Enzyme Kinetics: Michaelis–Menten & Inhibition', time: '3 h', skills: 'initial rates · Lineweaver–Burk · inhibition',
    goals: ['Measure initial rates of alkaline phosphatase at several substrate concentrations.', 'Determine Km and Vmax from a Lineweaver–Burk plot.', 'Identify the type of inhibition caused by phosphate and estimate Ki.'],
    intro: `<p>Alkaline phosphatase hydrolyses p-nitrophenyl phosphate (pNPP) to p-nitrophenolate, which is yellow (ε<sub>405</sub> = 18 000 M⁻¹cm⁻¹ = 0.018 µM⁻¹cm⁻¹). The initial rate v₀ comes from the slope of absorbance against time over the first 90 s:</p>
      <div class="eq">v₀ (µM/s) = (ΔA/Δt) / 0.018 &nbsp;&nbsp; Michaelis–Menten: v₀ = Vmax[S]/(Km + [S])</div>
      <div class="eq">Lineweaver–Burk: 1/v₀ = (Km/Vmax)(1/[S]) + 1/Vmax &nbsp;&nbsp; Km = slope/intercept, Vmax = 1/intercept</div>
      <p>A <b>competitive</b> inhibitor raises the apparent Km, K<sub>m,app</sub> = Km(1 + [I]/Ki), and leaves Vmax unchanged. On a Lineweaver–Burk plot the lines meet on the y-axis. A noncompetitive inhibitor lowers Vmax instead.</p>`,
    safety: ['pNPP and p-nitrophenol are irritants.', 'Keep enzyme stocks on ice.'],
    setup: R => ({ Vm: R.between(0.10, 0.15, 4), Km: R.between(0.15, 0.40, 3), Ki: R.between(0.30, 0.60, 3) }),
    prelab: [
      { q: 'An absorbance slope of 0.00180 s⁻¹ corresponds to what v₀?', unit: 'µM/s', ans: 0.1, tol: 0.003 },
      { q: 'At [S] = Km, v₀ equals…', choices: ['Vmax', 'Vmax/2', '2 Vmax', 'Km'], ans: 1 }
    ],
    parts: [
      {
        title: 'Progress curves', steps: ['Mix buffer, pNPP and (if used) 0.50 mM phosphate inhibitor in a cuvette. Add enzyme, mix, and record A405 for 180 s.', 'Repeat for every [S], with and without inhibitor. The initial rate (slope of the first 90 s) is recorded automatically at the end of each run.'],
        sim: { type: 'series', title: 'Kinetics at 405 nm', x: { l: 'Time', u: 's', max: 180, dt: 5 }, y: { l: 'A405', u: '', dp: 4, min: 0, max: 0.5 }, noise: 0.0004, controls: [{ k: 's', l: '[pNPP]', opts: SC.map(c => ({ v: c, l: c.toFixed(2) + ' mM' })) }, { k: 'i', l: 'Inhibitor', opts: [{ v: 0, l: 'None' }, { v: 0.5, l: '0.50 mM phosphate' }] }], run: (S, c) => { const Kapp = S.Km * (1 + c.i / S.Ki); const v = S.Vm * c.s / (Kapp + c.s); return { key: `kin_${c.s}_${c.i}`, l: `[S] = ${c.s} mM${c.i ? ', + inhibitor' : ''}`, short: `${c.s} mM${c.i ? ' +I' : ''}`, f: t => 0.035 + eps * v * t * (1 - 0.0002 * t), after: pts => { const f = CL.linfit(pts.filter(p => p[0] <= 90)); return [{ k: `v_${c.s}_${c.i}`, l: `Initial slope ΔA/Δt, [S] = ${c.s} mM${c.i ? ' + inhibitor' : ''}`, v: f.m, u: 's⁻¹' }]; } }; } }
      },
      { title: 'Lineweaver–Burk plots', note: '<p>Convert each slope to v₀ (µM/s) yourself, or use <b>Fill from my data</b>, which does it for you. Plot 1/v₀ against 1/[S] for each series and record the best-fit lines.</p>', sim: [{ type: 'graph', k: 'lb', title: 'No inhibitor', short: 'LB (no inhibitor)', xl: '1/[S] (mM⁻¹)', yl: '1/v₀ (s/µM)', rows: 6, fill: (S, D) => SC.map(c => [1 / c, eps / D(`v_${c}_0`)]) }, { type: 'graph', k: 'lbi', title: 'With 0.50 mM inhibitor', short: 'LB (+ inhibitor)', xl: '1/[S] (mM⁻¹)', yl: '1/v₀ (s/µM)', rows: 6, fill: (S, D) => SC.map(c => [1 / c, eps / D(`v_${c}_0.5`)]) }] }
    ],
    questions: [
      { q: 'v₀ at [S] = 0.40 mM without inhibitor.', unit: 'µM/s', ans: (S, D) => D('v_0.4_0') / eps, tol: 0.01, truth: S => S.Vm * 0.4 / (S.Km + 0.4), ttol: 0.05 },
      { q: 'Km (no inhibitor).', unit: 'mM', ans: (S, D) => D('lb_slope') / D('lb_int'), tol: 0.01, truth: S => S.Km, ttol: 0.12, needs: 'Lineweaver–Burk line' },
      { q: 'Vmax (no inhibitor).', unit: 'µM/s', ans: (S, D) => 1 / D('lb_int'), tol: 0.01, truth: S => S.Vm, ttol: 0.08 },
      { q: 'Apparent Km with 0.50 mM inhibitor.', unit: 'mM', ans: (S, D) => D('lbi_slope') / D('lbi_int'), tol: 0.01, truth: S => S.Km * (1 + 0.5 / S.Ki), ttol: 0.15 },
      { q: 'Type of inhibition.', choices: ['Competitive', 'Noncompetitive', 'Uncompetitive'], ans: 0 },
      { q: 'Ki for phosphate, from Km,app = Km(1 + [I]/Ki).', unit: 'mM', ans: (S, D) => 0.5 / ((D('lbi_slope') / D('lbi_int')) / (D('lb_slope') / D('lb_int')) - 1), tol: 0.02, truth: S => S.Ki, ttol: 0.35 },
      { q: 'Why are only initial rates used, rather than the whole progress curve?', text: true }
    ],
    key: S => [['Vmax', S.Vm + ' µM/s'], ['Km', S.Km + ' mM'], ['Ki', S.Ki + ' mM'], ['Km,app', (S.Km * (1 + 0.5 / S.Ki)).toFixed(3) + ' mM']]
  });

  // ------------------------------------------------------------------ 4
  const LADDER = [250, 150, 100, 75, 50, 37, 25, 20, 15, 10];
  const PROT = [{ n: 'β-Galactosidase', mw: 116 }, { n: 'Bovine serum albumin', mw: 66.5 }, { n: 'Ovalbumin', mw: 44.3 }, { n: 'Carbonic anhydrase', mw: 29.0 }, { n: 'Myoglobin', mw: 17.0 }, { n: 'Lysozyme', mw: 14.3 }];
  const GA = 1.507, GB = 0.587;
  CL.lab({
    id: 'bc-04', course: 'bc', n: 4, title: 'SDS-PAGE: Molecular Weight of Proteins', time: '3 h', skills: 'electrophoresis · semi-log calibration',
    goals: ['Separate denatured proteins by SDS-polyacrylamide gel electrophoresis.', 'Construct a calibration plot of log(MW) against Rf from a protein ladder.', 'Determine the molecular weights of two unknown proteins.'],
    intro: `<p>SDS denatures proteins and coats them with a uniform negative charge per unit mass. β-Mercaptoethanol reduces disulfide bonds. Proteins then migrate through the gel according to <b>size only</b>, with small proteins moving farthest. Over the useful range, log(MW) falls linearly as relative mobility increases:</p>
      <div class="eq">R_f = distance migrated by band / distance migrated by dye front &nbsp;&nbsp; log₁₀(MW) = m·R_f + b</div>
      <p>Ladder (kDa): ${LADDER.join(', ')}. Bands are listed from the top of the gel (band 1 = 250 kDa) to the bottom.</p>`,
    safety: ['Unpolymerized acrylamide is a neurotoxin — gloves at all times.', 'Turn off the power supply before opening the tank (high voltage).', 'Coomassie stain contains methanol and acetic acid.'],
    setup: R => { const ids = R.shuffle(PROT.map((_, i) => i)); return { p1: ids[0], p2: ids[1] }; },
    prelab: [
      { q: 'A band moves 4.2 cm when the dye front moves 7.0 cm. Rf?', ans: 0.6, atol: 0.005 },
      { q: 'Purpose of SDS:', choices: ['Denature proteins and give a uniform charge-to-mass ratio', 'Stain the proteins', 'Reduce disulfides', 'Polymerize the gel'], ans: 0 }
    ],
    parts: [
      { title: 'Run and stain the gel', sim: S => ({ type: 'tlc', mode: 'gel', title: 'SDS-PAGE gel (12%)', A: GA, B: GB, lanes: [{ k: 'lad', l: 'Ladder', short: 'Ladder', bands: LADDER }, { k: 'u1', l: 'Unknown 1', short: 'Unk 1', bands: [PROT[S.p1].mw] }, { k: 'u2', l: 'Unknown 2', short: 'Unk 2', bands: [PROT[S.p2].mw] }] }) },
      { title: 'Calibration plot', sim: { type: 'graph', k: 'gel', title: 'log MW vs Rf', short: 'Calibration', xl: 'Rf', yl: 'log₁₀(MW, kDa)', rows: 10, fill: (S, D) => LADDER.map((mw, i) => [D('d_lad_' + (i + 1)) / D('gel_front'), Math.log10(mw)]) } }
    ],
    questions: [
      { q: 'Rf of unknown 1.', ans: (S, D) => D('d_u1_1') / D('gel_front'), atol: 0.008 },
      { q: 'Molecular weight of unknown 1.', unit: 'kDa', ans: (S, D) => Math.pow(10, D('gel_slope') * D('d_u1_1') / D('gel_front') + D('gel_int')), tol: 0.02, truth: S => PROT[S.p1].mw, ttol: 0.1 },
      { q: 'Molecular weight of unknown 2.', unit: 'kDa', ans: (S, D) => Math.pow(10, D('gel_slope') * D('d_u2_1') / D('gel_front') + D('gel_int')), tol: 0.02, truth: S => PROT[S.p2].mw, ttol: 0.1 },
      { q: 'Most likely identity of unknown 1.', choices: PROT.map(p => `${p.n} (${p.mw} kDa)`), ans: S => S.p1 },
      { q: 'Most likely identity of unknown 2.', choices: PROT.map(p => `${p.n} (${p.mw} kDa)`), ans: S => S.p2 },
      { q: 'Purpose of β-mercaptoethanol in the sample buffer:', choices: ['Reduce disulfide bonds so subunits separate', 'Add negative charge', 'Make the proteins fluoresce', 'Increase the pH'], ans: 0 },
      { q: 'A protein runs at 120 kDa without β-mercaptoethanol but at 60 kDa with it. What does this tell you about its structure?', text: true }
    ],
    key: S => [['Unknown 1', PROT[S.p1].n + ' ' + PROT[S.p1].mw + ' kDa'], ['Unknown 2', PROT[S.p2].n + ' ' + PROT[S.p2].mw + ' kDa']]
  });
})();
