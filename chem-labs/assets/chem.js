/* Virtual Chem Labs — chemistry helpers (pH solver, indicators, spectra, colors) */
(function () {
  'use strict';
  const CL = (window.CL = window.CL || {});
  const Chem = (CL.chem = {});

  Chem.Kw = 1e-14;
  Chem.R = 8.314;          // J/(mol K)
  Chem.Ratm = 0.082057;    // L atm/(mol K)
  Chem.F = 96485;          // C/mol
  Chem.NA = 6.02214e23;

  // Molar masses used across labs (g/mol)
  Chem.M = {
    H: 1.008, C: 12.011, N: 14.007, O: 15.999, Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.086, P: 30.974,
    S: 32.06, Cl: 35.45, K: 39.098, Ca: 40.078, Fe: 55.845, Cu: 63.546, Zn: 65.38, Ag: 107.87, Ba: 137.33,
    Pb: 207.2, I: 126.90, Br: 79.904, Mn: 54.938, Co: 58.933, Ni: 58.693, Sn: 118.71, B: 10.81,
    KHP: 204.22, NaOH: 39.997, HCl: 36.46, CH3COOH: 60.052, H2O: 18.015, CuSO4: 159.61, MgO: 40.304,
    NaHCO3: 84.007, Na2CO3: 105.99, NaCl: 58.44, AgCl: 143.32, CaCO3: 100.09, KIO3: 214.00
  };

  /** Average number of protons lost by a polyprotic acid H_nA at [H+] = h. */
  Chem.nbar = function (h, pKas) {
    let term = 1, sum = 1, nb = 0;
    for (let j = 0; j < pKas.length; j++) {
      term *= Math.pow(10, -pKas[j]) / h;
      sum += term;
      nb += (j + 1) * term;
    }
    return nb / sum;
  };

  /** Fractions alpha_0..alpha_n of H_nA species at pH. */
  Chem.alphas = function (pH, pKas) {
    const h = Math.pow(10, -pH);
    const t = [1];
    for (let j = 0; j < pKas.length; j++) t.push(t[j] * Math.pow(10, -pKas[j]) / h);
    const s = t.reduce((a, b) => a + b, 0);
    return t.map(v => v / s);
  };

  /**
   * Solve the charge balance for pH.
   * sol = { V: litres, sa: mol strong acid (as Cl-), sb: mol strong base cation (Na+),
   *         wa: [{ n: mol, pKa: [..], z: charge of the fully protonated form }] }
   */
  Chem.pH = function (sol) {
    const V = Math.max(sol.V, 1e-9);
    const ca = (sol.sa || 0) / V, cb = (sol.sb || 0) / V;
    const wa = sol.wa || [];
    const f = pH => {
      const h = Math.pow(10, -pH);
      let s = h + cb - Chem.Kw / h - ca;
      for (const w of wa) s += (w.n / V) * ((w.z || 0) - Chem.nbar(h, w.pKa));
      return s;
    };
    let lo = -2, hi = 16;
    for (let i = 0; i < 70; i++) {
      const mid = (lo + hi) / 2;
      if (f(mid) > 0) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  };

  // ---------- indicators ----------
  // a: acid-form RGBA, b: base-form RGBA; pK and transition width (pH units per decade)
  Chem.indicators = {
    phenolphthalein: { l: 'Phenolphthalein', pK: 9.3, w: 0.45, a: [255, 255, 255, 0], b: [226, 36, 140, 0.8] },
    bromothymol: { l: 'Bromothymol blue', pK: 7.1, w: 0.5, a: [232, 205, 40, 0.75], b: [38, 84, 205, 0.75] },
    methylorange: { l: 'Methyl orange', pK: 3.7, w: 0.4, a: [222, 48, 40, 0.75], b: [244, 176, 30, 0.75] },
    methylred: { l: 'Methyl red', pK: 5.1, w: 0.5, a: [220, 38, 72, 0.75], b: [242, 206, 40, 0.75] },
    thymolblue: { l: 'Thymol blue (base range)', pK: 8.9, w: 0.5, a: [240, 214, 50, 0.7], b: [40, 80, 200, 0.75] },
    bromocresol: { l: 'Bromocresol green', pK: 4.7, w: 0.5, a: [235, 210, 50, 0.75], b: [40, 110, 200, 0.75] },
    none: { l: 'No indicator', pK: 7, w: 1, a: [255, 255, 255, 0], b: [255, 255, 255, 0] }
  };

  Chem.mixRGBA = function (a, b, f) {
    return a.map((v, i) => v + (b[i] - v) * f);
  };
  Chem.rgba = c => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${(c[3] ?? 1).toFixed(3)})`;
  Chem.hexToRGBA = function (hex, a = 1) {
    const m = hex.replace('#', '');
    const n = parseInt(m.length === 3 ? m.split('').map(x => x + x).join('') : m, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
  };

  Chem.indFrac = function (key, pH) { const ind = Chem.indicators[key] || Chem.indicators.none; return 1 / (1 + Math.pow(10, (ind.pK - pH) / ind.w)); };
  Chem.indicatorColor = function (key, pH) {
    const ind = Chem.indicators[key] || Chem.indicators.none;
    const f = 1 / (1 + Math.pow(10, (ind.pK - pH) / ind.w));
    return Chem.mixRGBA(ind.a, ind.b, f);
  };

  // ---------- spectra & colour ----------
  /** Gaussian absorption band; returns molar absorptivity at λ. */
  Chem.band = (lmax, eps, sd) => l => eps * Math.exp(-0.5 * Math.pow((l - lmax) / sd, 2));
  Chem.bands = list => l => list.reduce((s, b) => s + b[1] * Math.exp(-0.5 * Math.pow((l - b[0]) / b[2], 2)), 0);

  /** Approximate visible colour (RGB 0-255) of a wavelength in nm. */
  Chem.wlRGB = function (wl) {
    let r = 0, g = 0, b = 0;
    if (wl >= 380 && wl < 440) { r = -(wl - 440) / 60; b = 1; }
    else if (wl < 490) { g = (wl - 440) / 50; b = 1; }
    else if (wl < 510) { g = 1; b = -(wl - 510) / 20; }
    else if (wl < 580) { r = (wl - 510) / 70; g = 1; }
    else if (wl < 645) { r = 1; g = -(wl - 645) / 65; }
    else if (wl <= 780) { r = 1; }
    let f = 1;
    if (wl < 420) f = 0.3 + 0.7 * (wl - 380) / 40;
    else if (wl > 700) f = 0.3 + 0.7 * (780 - wl) / 80;
    if (wl < 380 || wl > 780) f = 0;
    const gam = c => Math.round(255 * Math.pow(Math.max(0, c * f), 0.8));
    return [gam(r), gam(g), gam(b)];
  };

  /** Perceived colour of a solution given absorbance function A(λ). Returns rgba array. */
  Chem.solutionColor = function (Afn) {
    let R = 0, G = 0, B = 0, R0 = 0, G0 = 0, B0 = 0;
    for (let l = 400; l <= 700; l += 5) {
      const c = Chem.wlRGB(l);
      const T = Math.pow(10, -Math.max(0, Math.min(4, Afn(l))));
      R += c[0] * T; G += c[1] * T; B += c[2] * T;
      R0 += c[0]; G0 += c[1]; B0 += c[2];
    }
    const rgb = [255 * R / R0, 255 * G / G0, 255 * B / B0];
    const mx = Math.max(...rgb), mn = Math.min(...rgb);
    const sat = mx > 0 ? (mx - mn) / mx : 0;
    const dark = 1 - mx / 255;
    return [rgb[0], rgb[1], rgb[2], Math.min(0.92, 0.12 + sat * 0.9 + dark * 0.8)];
  };

  /** Smooth logistic step from 0 to 1 centred at x0 with width w. */
  Chem.step = (x, x0, w) => 1 / (1 + Math.exp(-(x - x0) / w));

  // Water vapour pressure (torr) — Antoine equation, valid 1–100 °C
  Chem.pH2O = T => Math.pow(10, 8.07131 - 1730.63 / (233.426 + T));
})();
