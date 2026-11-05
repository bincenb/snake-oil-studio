/* Virtual Chem Labs — interactive instruments */
(function () {
  'use strict';
  const CL = window.CL, Chem = CL.chem, esc = CL.esc, $ = CL.$, $$ = CL.$$, resolve = CL.resolve;
  const sims = (CL.sims = CL.sims || {});

  // ---------- shared controls ----------
  function fmtCtl(v, d) { return d.dp != null ? Number(v).toFixed(d.dp) : v; }
  function ctlHTML(defs, c, S) {
    return defs.map(d => {
      const opts = d.opts ? resolve(d.opts, S) : null;
      if (c[d.k] === undefined) c[d.k] = d.val !== undefined ? d.val : (opts ? opts[0].v : (d.min ?? 0));
      if (d.type === 'range') return `<label class="ctl"><span>${d.l}: <b data-out="${d.k}">${fmtCtl(c[d.k], d)}</b> ${d.u || ''}</span><input type="range" data-k="${d.k}" min="${d.min}" max="${d.max}" step="${d.step || 1}" value="${c[d.k]}"></label>`;
      if (d.type === 'number') return `<label class="ctl"><span>${d.l}${d.u ? ' (' + d.u + ')' : ''}</span><input type="number" data-k="${d.k}" min="${d.min ?? ''}" max="${d.max ?? ''}" step="${d.step || 'any'}" value="${c[d.k]}"></label>`;
      if (d.type === 'check') return `<label class="ctl chk"><input type="checkbox" data-k="${d.k}" ${c[d.k] ? 'checked' : ''}> <span>${d.l}</span></label>`;
      return `<label class="ctl"><span>${d.l}</span><select data-k="${d.k}">${opts.map(o => `<option value="${esc(o.v)}" ${String(o.v) === String(c[d.k]) ? 'selected' : ''}>${esc(o.l)}</option>`).join('')}</select></label>`;
    }).join('');
  }
  function bindCtl(el, defs, c, S, on) {
    $$('[data-k]', el).forEach(inp => {
      const d = defs.find(x => x.k === inp.dataset.k); if (!d) return;
      inp.addEventListener(inp.tagName === 'SELECT' || inp.type === 'checkbox' ? 'change' : 'input', () => {
        let v;
        if (inp.type === 'checkbox') v = inp.checked;
        else if (d.type === 'range' || d.type === 'number') { v = parseFloat(inp.value); if (!isFinite(v)) return; }
        else { const o = resolve(d.opts, S).find(o => String(o.v) === inp.value); v = o ? o.v : inp.value; }
        c[d.k] = v;
        const out = $(`[data-out="${d.k}"]`, el); if (out) out.textContent = fmtCtl(v, d);
        on && on(d.k);
      });
    });
  }
  CL.ctlHTML = ctlHTML; CL.bindCtl = bindCtl;

  const cart = lists => lists.reduce((acc, l) => acc.flatMap(a => l.map(x => a.concat([x]))), [[]]);
  CL.cart = cart;
  const head = (cfg, def) => `<div class="sim-h"><h3>${cfg.title || def}</h3>${cfg.sub ? `<p class="small muted">${cfg.sub}</p>` : ''}</div>`;

  // ---------- small SVG drawings ----------
  const svgTube = (out) => {
    const liq = out.color || 'rgba(190,215,235,.35)';
    const ppt = out.ppt;
    return `<svg viewBox="0 0 120 220" class="drawing" aria-hidden="true">
      <rect x="40" y="10" width="40" height="8" rx="2" class="glass"/>
      <path d="M44 18 V180 a16 16 0 0 0 32 0 V18" class="glass" fill="none"/>
      <path d="M45 ${out.level ?? 90} V180 a15 15 0 0 0 30 0 V${out.level ?? 90} Z" fill="${liq}"/>
      ${ppt ? `<path d="M45 178 a15 15 0 0 0 30 0 Z" fill="${ppt}"/><ellipse cx="60" cy="182" rx="13" ry="9" fill="${ppt}"/>` : ''}
      ${out.layer ? `<path d="M45 ${(out.level ?? 90)} V${(out.level ?? 90) + 22} H75 V${out.level ?? 90} Z" fill="${out.layer}"/>` : ''}
      ${out.gas ? [0, 1, 2, 3, 4].map(i => `<circle class="bubble" style="animation-delay:${i * 0.35}s" cx="${52 + (i * 7) % 18}" cy="170" r="${2 + i % 2}"/>`).join('') : ''}
      <path d="M44 18 V180 a16 16 0 0 0 32 0 V18" class="glass-o" fill="none"/></svg>`;
  };
  const svgFlame = (out) => `<svg viewBox="0 0 120 220" class="drawing" aria-hidden="true">
      <path class="flame" d="M60 40 C40 80 38 110 48 140 C52 152 68 152 72 140 C82 110 80 80 60 40Z" fill="${out.flame}" opacity=".9"/>
      <path d="M60 95 C52 115 52 130 56 140 C58 145 62 145 64 140 C68 130 68 115 60 95Z" fill="rgba(120,160,255,.6)"/>
      <rect x="50" y="148" width="20" height="50" class="metal"/><rect x="36" y="196" width="48" height="10" rx="3" class="metal"/>
      <line x1="60" y1="20" x2="95" y2="120" stroke="#999" stroke-width="2"/><circle cx="62" cy="108" r="3" fill="#aaa"/></svg>`;
  const svgBalance = () => `<svg viewBox="0 0 160 160" class="drawing" aria-hidden="true"><rect x="16" y="96" width="128" height="40" rx="6" class="metal"/><rect x="40" y="108" width="80" height="18" rx="3" fill="#0f2a1e"/><ellipse cx="80" cy="88" rx="52" ry="8" class="metal"/><rect x="76" y="88" width="8" height="10" class="metal"/><rect x="58" y="62" width="44" height="26" rx="4" class="glass" fill="rgba(200,220,240,.25)"/></svg>`;
  const svgMeter = (label) => `<svg viewBox="0 0 160 160" class="drawing" aria-hidden="true"><rect x="20" y="20" width="90" height="70" rx="8" class="metal"/><rect x="30" y="32" width="70" height="26" rx="3" fill="#0f2a1e"/><text x="65" y="80" text-anchor="middle" class="dlabel">${esc(label || 'meter')}</text><path d="M110 55 C140 55 135 100 135 130" fill="none" stroke="#444" stroke-width="3"/><rect x="130" y="110" width="10" height="40" rx="4" fill="#777"/></svg>`;

  // ======================================================================
  // BENCH — generic measurement station
  // cfg: {title, instrument, icon, controls:[...], actions:[{l, key:(c,S)=>, label:(c,S)=>, read:(S,c,ctx)=>({v,u,dp}|{obs,color,ppt,flame}|{err})}], visual:(S,c,last)=>svg, info:(S,c)=>html}
  // ======================================================================
  sims.bench = function (el, cfg, ctx) {
    const S = ctx.S, c = {}, defs = resolve(cfg.controls, S) || [];
    el.innerHTML = head(cfg, 'Measurement station') + `<div class="bench"><div class="viz" data-viz></div><div class="bpanel">
      <div class="ctls">${ctlHTML(defs, c, S)}</div><div class="info small" data-info></div>
      <div class="lcd" data-lcd><span class="lcd-l">${esc(cfg.instrument || 'Reading')}</span><span class="lcd-v">—</span></div>
      <div class="acts">${cfg.actions.map((a, i) => `<button class="btn sm ${i ? 'ghost' : ''}" data-act="${i}">${a.l}</button>`).join('')}</div>
      <div class="msg small" data-msg aria-live="polite"></div></div></div>`;
    const viz = $('[data-viz]', el), lcdv = $('.lcd-v', el), msg = $('[data-msg]', el), info = $('[data-info]', el);
    let last = null;
    const draw = () => {
      let s = cfg.visual ? cfg.visual(S, c, last) : null;
      if (!s) s = last && last.flame ? svgFlame(last) : last && (last.color || last.ppt) ? svgTube(last) : cfg.icon === 'tube' ? svgTube({}) : cfg.icon === 'meter' ? svgMeter(cfg.instrument) : svgBalance();
      viz.innerHTML = s;
      info.innerHTML = cfg.info ? cfg.info(S, c) || '' : '';
    };
    bindCtl(el, defs, c, S, () => { last = null; lcdv.textContent = '—'; msg.textContent = ''; draw(); });
    const doAct = a => {
      const out = a.read(S, c, ctx);
      if (!out) return;
      if (out.err) { msg.innerHTML = `<span class="warn">${out.err}</span>`; return; }
      msg.innerHTML = out.note || '';
      last = out;
      if (typeof out.v === 'number') lcdv.textContent = (out.dp != null ? out.v.toFixed(out.dp) : String(+out.v.toPrecision(4))) + (out.u ? ' ' + out.u : '');
      else lcdv.textContent = out.obs || '';
      if (!a.nolog && !out.nolog) {
        if (out.logs) out.logs.forEach(e => ctx.log(e));
        else ctx.log({ k: resolve(a.key, c, S, out), l: resolve(a.label, c, S, out) || a.l, v: typeof out.v === 'number' ? out.v : out.obs, u: out.u, dp: out.dp, color: out.swatch || out.flame || out.color });
      }
      draw();
    };
    $$('[data-act]', el).forEach(b => b.addEventListener('click', () => doAct(cfg.actions[+b.dataset.act])));
    el.__auto = async () => {
      const lists = defs.map(d => d.auto ? resolve(d.auto, S).map(v => [d.k, v]) : (!d.type || d.type === 'select') ? resolve(d.opts, S).map(o => [d.k, o.v]) : [[d.k, c[d.k]]]);
      for (const combo of cart(lists)) { combo.forEach(([k, v]) => { c[k] = v; }); cfg.actions.forEach(a => { for (let i = 0; i < (a.auto || 1); i++) doAct(a); }); }
    };
    draw();
  };

  // ======================================================================
  // TITRATION — buret, flask with indicator, optional pH meter & live curve
  // cfg: {trials:(S)=>[{k,l,desc,logs:[...],sol:{V0 mL, sa, sb, wa}}], titrant:{l, C, kind:'base'|'acid'},
  //       indicators:[keys], indicator, ph:true, endpoint:{Veq:(S,tr)=>mL, from, to}, plotMax}
  // ======================================================================
  sims.titration = function (el, cfg, ctx, uid) {
    const S = ctx.S, trials = resolve(cfg.trials, S);
    const T = {};
    let cur = trials[0].k;
    let ind = cfg.indicator || (cfg.indicators ? cfg.indicators[0] : 'phenolphthalein');
    const tState = k => {
      if (!T[k]) {
        const tr = trials.find(t => t.k === k);
        T[k] = { tr, Vi: CL.round(0.2 + Math.random() * 2.6, 3), add: 0, pts: [] };
        if (tr.logs && !tr._logged) { tr.logs.forEach(e => { if (!ctx.D.has(e.k)) ctx.log(e); }); tr._logged = true; }
        if (cfg.ph) T[k].pts.push([0, phOf(T[k])]);
      }
      return T[k];
    };
    function solAt(t) {
      const s = t.tr.sol; if (!s) return null;
      const n = cfg.titrant.C * t.add / 1000;
      return { V: (s.V0 + t.add) / 1000, sa: (s.sa || 0) + (cfg.titrant.kind === 'acid' ? n : 0), sb: (s.sb || 0) + (cfg.titrant.kind === 'acid' ? 0 : n), wa: s.wa || [] };
    }
    function phOf(t) { const s = solAt(t); return s ? Chem.pH(s) : NaN; }
    function liquidColor(t) {
      const base = [205, 225, 240, 0.35];
      if (cfg.endpoint) {
        const Veq = resolve(cfg.endpoint.Veq, S, t.tr);
        const f = Chem.step(t.add, Veq, cfg.endpoint.w || 0.012);
        return Chem.rgba(Chem.mixRGBA(Chem.hexToRGBA(cfg.endpoint.from, cfg.endpoint.fa ?? 0.7), Chem.hexToRGBA(cfg.endpoint.to, cfg.endpoint.ta ?? 0.7), f));
      }
      const ic = Chem.indicatorColor(ind, phOf(t));
      const a = ic[3];
      return Chem.rgba([base[0] * (1 - a) + ic[0] * a, base[1] * (1 - a) + ic[1] * a, base[2] * (1 - a) + ic[2] * a, Math.max(base[3], a)]);
    }
    const reading = t => t.Vi + t.add;

    el.innerHTML = head(cfg, 'Titration station') + `<div class="titr">
      <div class="viz" data-viz></div>
      <div class="bpanel">
        <div class="ctls"><label class="ctl"><span>Flask / trial</span><select data-trial>${trials.map(t => `<option value="${t.k}">${esc(t.l)}</option>`).join('')}</select></label>
        ${cfg.indicators && cfg.indicators.length > 1 ? `<label class="ctl"><span>Indicator</span><select data-ind>${cfg.indicators.map(k => `<option value="${k}" ${k === ind ? 'selected' : ''}>${Chem.indicators[k].l}</option>`).join('')}</select></label>` : ''}</div>
        <div class="info small" data-desc></div>
        <div class="titrant small">Titrant: <b>${esc(cfg.titrant.l)}</b></div>
        <div class="acts pour">${[[10, '+10 mL'], [5, '+5 mL'], [1, '+1 mL'], [0.5, '+0.5 mL'], [0.1, '+0.1 mL'], [0.05, '1 drop'], [0.025, '½ drop']].map(([v, l]) => `<button class="btn sm ghost" data-add="${v}">${l}</button>`).join('')}</div>
        ${cfg.ph ? `<div class="lcd"><span class="lcd-l">pH meter</span><span class="lcd-v" data-ph>—</span></div>` : ''}
        <div class="readbox"><div class="zoom" data-zoom></div>
          <div class="recrow"><label class="ctl"><span>Your buret reading (mL)</span><input type="text" inputmode="decimal" data-rd placeholder="e.g. 12.34"></label>
          <div class="acts"><button class="btn sm" data-rec="Vi">Record initial</button><button class="btn sm" data-rec="Vf">Record final</button></div></div>
          <p class="small muted">Read the bottom of the meniscus to ±0.01 mL (estimate one digit past the 0.1 mL marks).</p></div>
        <div class="acts"><button class="btn sm ghost" data-reset>Refill buret &amp; new flask</button></div>
        <div class="msg small" data-msg aria-live="polite"></div>
      </div></div>
      ${cfg.ph ? `<div class="plotbox" data-plot></div>` : ''}`;
    const viz = $('[data-viz]', el), msg = $('[data-msg]', el), zoom = $('[data-zoom]', el);

    function drawViz(t) {
      const r = reading(t), lvl = 30 + (r / 50) * 220;
      const col = liquidColor(t);
      viz.innerHTML = `<svg viewBox="0 0 200 400" class="drawing" aria-label="Buret and flask">
        <rect x="88" y="20" width="24" height="250" rx="3" class="glass"/>
        ${[0, 10, 20, 30, 40, 50].map(v => `<line x1="88" x2="98" y1="${30 + v / 50 * 220}" y2="${30 + v / 50 * 220}" class="tickline"/><text x="84" y="${34 + v / 50 * 220}" text-anchor="end" class="dlabel">${v}</text>`).join('')}
        <rect x="90" y="${Math.min(lvl, 268)}" width="20" height="${Math.max(0, 268 - lvl)}" fill="${cfg.titrant.color || 'rgba(170,200,230,.55)'}"/>
        <rect x="80" y="270" width="40" height="10" rx="3" class="metal"/><rect x="97" y="280" width="6" height="22" class="glass"/>
        <path d="M70 300 L130 300 L130 312 L172 380 Q176 392 162 392 L38 392 Q24 392 28 380 L70 312 Z" class="glass" fill="rgba(255,255,255,.05)"/>
        <path d="M${50 - 0} 350 L150 350 L170 382 Q173 390 162 390 L38 390 Q27 390 30 382 Z" fill="${col}"/>
        <path d="M70 300 L130 300 L130 312 L172 380 Q176 392 162 392 L38 392 Q24 392 28 380 L70 312 Z" class="glass-o" fill="none"/>
        <rect x="70" y="392" width="60" height="6" rx="2" class="metal"/></svg>`;
      // magnified meniscus
      const lo = r - 0.8, hi = r + 0.8, H = 160, Y = v => (v - lo) / (hi - lo) * H;
      let ticks = '';
      for (let v = Math.ceil(lo * 10) / 10; v <= hi + 1e-9; v += 0.1) {
        const vv = Math.round(v * 10) / 10; if (vv < 0 || vv > 50) continue;
        const whole = Math.abs(vv - Math.round(vv)) < 1e-6, half = Math.abs(vv * 2 - Math.round(vv * 2)) < 1e-6;
        ticks += `<line x1="0" x2="${whole ? 46 : half ? 34 : 24}" y1="${Y(vv)}" y2="${Y(vv)}" class="tickline"/>` + (whole ? `<text x="52" y="${Y(vv) + 5}" class="dlabel big">${vv}</text>` : '');
      }
      zoom.innerHTML = `<svg viewBox="0 0 120 ${H}" class="drawing zoomsvg" aria-label="Magnified buret scale"><rect x="0" y="0" width="120" height="${Math.max(0, Y(r) - 4)}" fill="none"/>
        <rect x="0" y="${Y(r) - 3}" width="120" height="${H}" fill="${cfg.titrant.color || 'rgba(140,180,220,.35)'}"/>
        <path d="M0 ${Y(r) - 5} Q60 ${Y(r) + 6} 120 ${Y(r) - 5}" fill="none" stroke="var(--ink)" stroke-width="2"/>${ticks}</svg>`;
      const ph = $('[data-ph]', el);
      if (ph) ph.textContent = CL.meas(phOf(t), 0.005, 2).toFixed(2);
    }
    function drawPlot(t) {
      const box = $('[data-plot]', el); if (!box) return;
      const pts = t.pts.slice().sort((a, b) => a[0] - b[0]);
      const xmax = Math.max(cfg.plotMax || 30, t.add * 1.05);
      const P = CL.plot({ id: 'tp' + uid, w: 640, h: 280, xr: [0, xmax], yr: [0, 14], xl: `Volume ${cfg.titrant.short || 'titrant'} added (mL)`, yl: 'pH', series: [{ pts, mode: 'line' }, { pts, mode: 'pts', r: 2.5 }] });
      box.innerHTML = P.svg;
      CL.hover(box, P, x => { if (!pts.length) return ''; let b = pts[0]; pts.forEach(p => { if (Math.abs(p[0] - x) < Math.abs(b[0] - x)) b = p; }); return `V = ${b[0].toFixed(2)} mL<br>pH = ${b[1].toFixed(2)}`; });
    }
    function saveCurve(t) {
      if (!cfg.ph) return;
      const pts = t.pts.slice().sort((a, b) => a[0] - b[0]).map(p => [CL.round(p[0], 3), CL.round(p[1], 3)]);
      ctx.st.series['curve_' + t.tr.k] = { l: `${t.tr.l}: titration curve`, xl: `Volume ${cfg.titrant.short || 'titrant'} added (mL)`, yl: 'pH', pts, yr: [0, 14] };
      clearTimeout(saveCurve._t); saveCurve._t = setTimeout(() => ctx.save(), 300);
    }
    function show() {
      const t = tState(cur);
      $('[data-desc]', el).innerHTML = resolve(t.tr.desc, S) || '';
      drawViz(t); drawPlot(t);
    }
    $('[data-trial]', el).addEventListener('change', e => { cur = e.target.value; msg.textContent = ''; show(); });
    const indSel = $('[data-ind]', el); if (indSel) indSel.addEventListener('change', e => { ind = e.target.value; show(); });
    $$('[data-add]', el).forEach(b => b.addEventListener('click', () => {
      const t = tState(cur);
      let v = parseFloat(b.dataset.add);
      v = v >= 0.5 ? v * (1 + 0.004 * CL.gauss()) : v * (1 + 0.08 * CL.gauss());
      if (reading(t) + v > 50) { msg.innerHTML = '<span class="warn">Not enough titrant left in the buret. Record your final reading, then refill.</span>'; return; }
      t.add += v;
      if (cfg.ph) { t.pts.push([t.add, CL.meas(phOf(t), 0.005, 3)]); saveCurve(t); }
      msg.textContent = '';
      show();
    }));
    $$('[data-rec]', el).forEach(b => b.addEventListener('click', () => {
      const t = tState(cur);
      const typed = CL.parseNum($('[data-rd]', el).value);
      if (!isFinite(typed)) { msg.innerHTML = '<span class="warn">Type the reading you see on the magnified scale first.</span>'; return; }
      const r = reading(t);
      if (Math.abs(typed - r) > 0.03) { msg.innerHTML = `<span class="warn">That doesn't match the buret. Look again: numbers increase downward, read at the bottom of the curved meniscus, and estimate to the hundredths place.</span>`; return; }
      const which = b.dataset.rec;
      ctx.log({ k: `${t.tr.k}_${which}`, l: `${t.tr.l}: ${which === 'Vi' ? 'initial' : 'final'} buret reading`, v: CL.round(typed, 2), u: 'mL', dp: 2 });
      $('[data-rd]', el).value = '';
    }));
    $('[data-reset]', el).addEventListener('click', () => { delete T[cur]; msg.textContent = 'New flask prepared and buret refilled.'; show(); });
    el.__auto = async () => {
      for (const tr of trials) {
        cur = tr.k; const t = tState(cur);
        ctx.log({ k: `${tr.k}_Vi`, l: `${tr.l}: initial buret reading`, v: CL.round(reading(t), 2), u: 'mL', dp: 2 });
        const acid = cfg.titrant.kind === 'acid';
        const done = add => { const tt = Object.assign({}, t, { add }); if (cfg.endpoint) return add > resolve(cfg.endpoint.Veq, S, tr); const f = Chem.indFrac(ind, phOf(tt)); if (ind === 'none') return acid ? phOf(tt) < 2.6 : phOf(tt) > 11.6; return acid ? f < 0.5 : f > 0.25; };
        let lo = 0, hi = 49 - t.Vi;
        if (!done(hi)) { t.add = hi * 0.98; } else { for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (done(m)) hi = m; else lo = m; } t.add = hi + 0.02; }
        if (cfg.ph) { t.pts = []; const end = Math.min(49 - t.Vi, t.add * (ind === 'none' ? 1.0 : 1.4)); for (let v = 0; v <= end; v += 0.25) t.pts.push([v, phOf(Object.assign({}, t, { add: v }))]); saveCurve(t); }
        ctx.log({ k: `${tr.k}_Vf`, l: `${tr.l}: final buret reading`, v: CL.round(reading(t), 2), u: 'mL', dp: 2 });
      }
    };
    show();
  };

  // ======================================================================
  // SERIES — run an experiment and record y(t)
  // cfg: {title, x:{l,u,max,dt}, y:{l,u,min,max,dp}, controls, run:(S,c,ctx)=>({key,l,f,logs,err,xmax}), noise, rate}
  // ======================================================================
  sims.series = function (el, cfg, ctx, uid) {
    const S = ctx.S, c = {}, defs = resolve(cfg.controls, S) || [];
    let timer = null, curKey = null;
    el.innerHTML = head(cfg, 'Data collection') + `<div class="ctls row">${ctlHTML(defs, c, S)}</div><div class="info small" data-info></div>
      <div class="acts"><button class="btn sm" data-run>▶ Start run</button><button class="btn sm ghost" data-stop disabled>■ Stop</button>
      <label class="ctl inline"><span>Speed</span><select data-speed><option value="1">1×</option><option value="5" selected>5×</option><option value="20">20×</option><option value="100">Instant</option></select></label></div>
      <div class="lcd"><span class="lcd-l">${esc(cfg.y.l)}</span><span class="lcd-v" data-y>—</span><span class="lcd-l" data-x></span></div>
      <div class="plotbox" data-plot></div><div class="msg small" data-msg aria-live="polite"></div>
      <details class="pts"><summary>Data points of the selected run</summary><div class="tablewrap" data-tbl></div></details>`;
    const msg = $('[data-msg]', el);
    const mine = () => Object.entries(ctx.st.series).filter(([, s]) => s.sim === ctx.lab.id + uid);
    const updateInfo = () => { $('[data-info]', el).innerHTML = cfg.info ? cfg.info(S, c) || '' : ''; };
    function draw() {
      const runs = mine();
      const all = runs.flatMap(([, s]) => s.pts);
      const xr = [0, Math.max(cfg.x.max, ...all.map(p => p[0]))];
      const yr = cfg.y.min != null ? [cfg.y.min, cfg.y.max] : CL.extent(all.map(p => p[1]));
      const P = CL.plot({ id: 'sp' + uid, w: 680, h: 300, xr, yr, xl: `${cfg.x.l} (${cfg.x.u})`, yl: `${cfg.y.l}${cfg.y.u ? ' (' + cfg.y.u + ')' : ''}`, legend: true, series: runs.map(([k, s], i) => ({ pts: s.pts, label: s.short || s.l, width: k === curKey ? 2.5 : 1.5 })) });
      const box = $('[data-plot]', el); box.innerHTML = P.svg;
      CL.hover(box, P, x => runs.map(([, s], i) => { if (!s.pts.length) return ''; let b = s.pts[0]; for (const p of s.pts) if (Math.abs(p[0] - x) < Math.abs(b[0] - x)) b = p; return `<span style="color:${CL.palette[i % 6]}">●</span> ${esc(s.short || s.l)}: ${cfg.x.l.toLowerCase()} ${+b[0].toFixed(2)} ${cfg.x.u}, <b>${b[1].toFixed(cfg.y.dp ?? 2)}</b> ${cfg.y.u || ''}`; }).join('<br>'));
      const s = curKey && ctx.st.series[curKey];
      $('[data-tbl]', el).innerHTML = s ? `<table class="data compact"><thead><tr><th>${esc(cfg.x.l)} (${esc(cfg.x.u)})</th><th>${esc(cfg.y.l)} ${cfg.y.u ? '(' + esc(cfg.y.u) + ')' : ''}</th></tr></thead><tbody>${s.pts.map(p => `<tr><td class="num">${+p[0].toFixed(3)}</td><td class="num">${p[1].toFixed(cfg.y.dp ?? 2)}</td></tr>`).join('')}</tbody></table>` : '<p class="empty">Run the experiment to collect data.</p>';
    }
    bindCtl(el, defs, c, S, updateInfo);
    updateInfo();
    const stop = () => { clearInterval(timer); timer = null; $('[data-run]', el).disabled = false; $('[data-stop]', el).disabled = true; ctx.save(); draw(); };
    $('[data-stop]', el).addEventListener('click', () => { stop(); msg.textContent = 'Run stopped. Data kept.'; });
    const startRun = forceInstant => {
      const R = cfg.run(S, c, ctx);
      if (!R || R.err) { msg.innerHTML = `<span class="warn">${R ? R.err : 'Cannot run.'}</span>`; return; }
      (R.logs || []).forEach(e => ctx.log(e));
      curKey = R.key;
      const xmax = R.xmax || cfg.x.max, dt = R.dt || cfg.x.dt;
      const s = (ctx.st.series[R.key] = { l: R.l, short: R.short, xl: `${cfg.x.l} (${cfg.x.u})`, yl: `${cfg.y.l}${cfg.y.u ? ' (' + cfg.y.u + ')' : ''}`, pts: [], sim: ctx.lab.id + uid, xr: [0, xmax], yr: cfg.y.min != null ? [cfg.y.min, cfg.y.max] : undefined });
      let t = 0;
      const speed = forceInstant ? 100 : +$('[data-speed]', el).value;
      const noise = R.noise ?? cfg.noise ?? 0;
      const tick = () => {
        const per = speed >= 100 ? 1e9 : ({ 1: 1, 5: 3, 20: 10 }[speed] || 1);
        for (let i = 0; i < per && t <= xmax + 1e-9; i++) {
          const y = R.f(t);
          s.pts.push([CL.round(t, 4), CL.round(y + noise * CL.gauss(), (cfg.y.dp ?? 2) + 1)]);
          t += dt;
        }
        const lp = s.pts[s.pts.length - 1];
        $('[data-y]', el).textContent = lp ? lp[1].toFixed(cfg.y.dp ?? 2) + ' ' + (cfg.y.u || '') : '—';
        $('[data-x]', el).textContent = lp ? `${cfg.x.l} = ${+lp[0].toFixed(2)} ${cfg.x.u}` : '';
        draw();
        if (t > xmax + 1e-9) { stop(); msg.innerHTML = R.done || 'Run complete. The curve is saved to your Data notebook.'; if (R.after) (R.after(s.pts) || []).forEach(e => ctx.log(e)); }
      };
      $('[data-run]', el).disabled = true; $('[data-stop]', el).disabled = false; msg.innerHTML = R.note || 'Collecting data…';
      if (speed >= 100) tick(); else timer = setInterval(tick, 100);
    };
    $('[data-run]', el).addEventListener('click', () => startRun(false));
    el.__auto = async () => {
      const lists = defs.map(d => d.auto ? resolve(d.auto, S).map(v => [d.k, v]) : (!d.type || d.type === 'select') ? resolve(d.opts, S).map(o => [d.k, o.v]) : [[d.k, c[d.k]]]);
      for (const combo of cart(lists)) { combo.forEach(([k, v]) => { c[k] = v; }); startRun(true); }
    };
    draw();
  };

  // ======================================================================
  // SPECTRO — single-beam spectrophotometer
  // cfg: {samples:(S)=>[{v,l,A:(λ)=>abs}], l0, fixed, key:(s,λ)=>, scan:true, range:[380,750]}
  // ======================================================================
  sims.spectro = function (el, cfg, ctx, uid) {
    const S = ctx.S, samples = resolve(cfg.samples, S);
    const rng = cfg.range || [380, 750];
    let cur = samples[0].v, lam = cfg.l0 || 500, blankAt = null;
    el.innerHTML = head(cfg, 'Spectrophotometer') + `<div class="bench"><div class="viz" data-viz></div><div class="bpanel">
      <div class="ctls"><label class="ctl"><span>Cuvette in sample holder</span><select data-s>${samples.map(s => `<option value="${esc(s.v)}">${esc(s.l)}</option>`).join('')}</select></label>
      <label class="ctl"><span>Wavelength: <b data-lo>${lam}</b> nm</span><input type="range" min="${rng[0]}" max="${rng[1]}" step="1" value="${lam}" data-l ${cfg.fixed ? 'disabled' : ''}></label></div>
      <div class="lcd"><span class="lcd-l">Abs</span><span class="lcd-v" data-a>—</span><span class="lcd-l" data-t></span></div>
      <div class="acts"><button class="btn sm ghost" data-blank>Zero with blank</button><button class="btn sm" data-meas>Measure &amp; record</button>${cfg.scan !== false ? '<button class="btn sm ghost" data-scan>Scan spectrum</button>' : ''}</div>
      <div class="msg small" data-msg aria-live="polite"></div></div></div><div class="plotbox" data-plot></div>`;
    const msg = $('[data-msg]', el);
    const sample = () => samples.find(s => s.v === cur);
    function drawViz() {
      const s = sample();
      const col = s.A ? Chem.rgba(Chem.solutionColor(s.A)) : 'rgba(200,220,240,.2)';
      const beam = Chem.wlRGB(lam);
      $('[data-viz]', el).innerHTML = `<svg viewBox="0 0 220 160" class="drawing" aria-hidden="true"><rect x="8" y="40" width="204" height="100" rx="10" class="metal"/>
        <rect x="20" y="86" width="70" height="4" fill="rgb(${beam.join(',')})" opacity=".9"/><rect x="130" y="86" width="70" height="4" fill="rgb(${beam.join(',')})" opacity=".6"/>
        <rect x="95" y="20" width="30" height="95" rx="3" class="glass" fill="${col}"/><rect x="95" y="20" width="30" height="20" fill="rgba(255,255,255,.15)"/><text x="110" y="132" text-anchor="middle" class="dlabel">${esc(s.l).slice(0, 26)}</text></svg>`;
    }
    $('[data-s]', el).addEventListener('change', e => { cur = e.target.value; $('[data-a]', el).textContent = '—'; $('[data-t]', el).textContent = ''; drawViz(); });
    $('[data-l]', el).addEventListener('input', e => { lam = +e.target.value; $('[data-lo]', el).textContent = lam; drawViz(); });
    $('[data-blank]', el).addEventListener('click', () => {
      const s = sample();
      if (s.A && !s.blank) { msg.innerHTML = '<span class="warn">Zero the instrument with the <b>blank</b> cuvette (solvent only) in the holder.</span>'; return; }
      blankAt = lam; $('[data-a]', el).textContent = '0.000'; $('[data-t]', el).textContent = '100.0 %T';
      msg.textContent = `Instrument zeroed at ${lam} nm.`;
    });
    $('[data-meas]', el).addEventListener('click', () => {
      const s = sample();
      if (blankAt !== lam) { msg.innerHTML = `<span class="warn">Zero the instrument with the blank at ${lam} nm before measuring (the baseline changes with wavelength).</span>`; return; }
      if (!s.A) { msg.textContent = 'That is the blank: A = 0.000.'; return; }
      const a0 = s.A(lam);
      const A = CL.meas(Math.min(a0, 3.5), 0.0015 + 0.004 * a0, 3);
      $('[data-a]', el).textContent = A.toFixed(3); $('[data-t]', el).textContent = (100 * Math.pow(10, -A)).toFixed(1) + ' %T';
      msg.textContent = a0 > 1.5 ? 'Note: absorbance above ~1.5 is less reliable (too little light reaches the detector).' : '';
      ctx.log({ k: cfg.key ? cfg.key(s, lam) : `A_${s.v}`, l: `Absorbance, ${s.l} at ${lam} nm`, v: A, dp: 3 });
    });
    const scanBtn = $('[data-scan]', el);
    if (scanBtn) scanBtn.addEventListener('click', () => {
      const s = sample(); if (!s.A) { msg.textContent = 'Choose a sample (not the blank) to scan.'; return; }
      const pts = []; for (let l = rng[0]; l <= rng[1]; l += 2) pts.push([l, CL.round(Math.min(3.5, s.A(l)) + 0.002 * CL.gauss(), 4)]);
      ctx.st.series['scan_' + s.v] = { l: 'Absorption spectrum: ' + s.l, xl: 'Wavelength (nm)', yl: 'Absorbance', pts };
      ctx.save(); drawScans(); msg.textContent = 'Spectrum saved. Hover over the plot to read values.';
    });
    function drawScans() {
      const scans = samples.filter(s => ctx.st.series['scan_' + s.v]).map(s => ctx.st.series['scan_' + s.v]);
      const box = $('[data-plot]', el);
      if (!scans.length) { box.innerHTML = ''; return; }
      const ymax = Math.max(0.2, ...scans.flatMap(s => s.pts.map(p => p[1]))) * 1.08;
      const P = CL.plot({ id: 'sc' + uid, w: 680, h: 260, xr: rng, yr: [0, ymax], xl: 'Wavelength (nm)', yl: 'Absorbance', legend: true, series: scans.map(s => ({ pts: s.pts, label: s.l.replace('Absorption spectrum: ', '') })) });
      box.innerHTML = P.svg;
      CL.hover(box, P, x => scans.map((s, i) => { const p = s.pts.reduce((b, q) => Math.abs(q[0] - x) < Math.abs(b[0] - x) ? q : b, s.pts[0]); return `<span style="color:${CL.palette[i % 6]}">●</span> ${p[0]} nm: A = ${p[1].toFixed(3)}`; }).join('<br>'));
    }
    el.__auto = async () => {
      const real = samples.filter(s => s.A);
      let best = rng[0], bA = -1;
      real.forEach(s => { for (let l = rng[0]; l <= rng[1]; l++) { const a = s.A(l); if (a > bA && a < 3) { bA = a; best = l; } } });
      lam = cfg.autoL || best; blankAt = lam;
      real.forEach(s => ctx.log({ k: cfg.key ? cfg.key(s, lam) : `A_${s.v}`, l: `Absorbance, ${s.l} at ${lam} nm`, v: CL.meas(Math.min(s.A(lam), 3.5), 0.0015, 3), dp: 3 }));
    };
    drawViz(); drawScans();
  };

  // ======================================================================
  // GRAPH — student-entered data, transforms, linear regression
  // cfg: {k, title, xl, yl, rows, tx:['x','1/x','ln x'], ty:[...], fill:(S,D)=>[[x,y],...], xlabel per transform}
  // ======================================================================
  const TX = { 'x': v => v, '1/x': v => 1 / v, 'ln x': v => Math.log(v), 'log x': v => Math.log10(v), 'x²': v => v * v, '1/x²': v => 1 / (v * v), '√x': v => Math.sqrt(v) };
  const TY = { 'y': v => v, 'ln y': v => Math.log(v), '1/y': v => 1 / v, 'log y': v => Math.log10(v), 'y²': v => v * v };
  const txLabel = (t, l) => t === 'x' || t === 'y' ? l : t.replace(/[xy]/, l);
  sims.graph = function (el, cfg, ctx, uid) {
    const S = ctx.S, st = ctx.st;
    const store = (st.plots[cfg.k] = st.plots[cfg.k] || { rows: [], tx: (cfg.tx || ['x'])[0], ty: (cfg.ty || ['y'])[0] });
    store.title = cfg.title || 'Graph';
    const nrows = Math.max(cfg.rows || 6, store.rows.length);
    while (store.rows.length < nrows) store.rows.push(['', '']);
    el.innerHTML = head(cfg, 'Graphing & linear regression') + `<div class="graph">
      <div class="gtable"><table class="data compact"><thead><tr><th>${esc(cfg.xl)}</th><th>${esc(cfg.yl)}</th></tr></thead><tbody data-rows></tbody></table>
      <div class="acts"><button class="btn sm ghost" data-addrow>+ Row</button>${cfg.fill ? '<button class="btn sm ghost" data-fill>Fill from my data</button>' : ''}<button class="btn sm ghost" data-clear>Clear</button></div>
      <div class="ctls">${(cfg.tx || []).length > 1 ? `<label class="ctl"><span>Plot on x-axis</span><select data-tx>${cfg.tx.map(t => `<option ${t === store.tx ? 'selected' : ''}>${t}</option>`).join('')}</select></label>` : ''}
      ${(cfg.ty || []).length > 1 ? `<label class="ctl"><span>Plot on y-axis</span><select data-ty>${cfg.ty.map(t => `<option ${t === store.ty ? 'selected' : ''}>${t}</option>`).join('')}</select></label>` : ''}</div></div>
      <div class="gplot"><div class="plotbox" data-plot></div><div class="fitres" data-fit></div><div class="acts"><button class="btn sm" data-save>Record best-fit line</button></div></div></div>`;
    const rowsEl = $('[data-rows]', el);
    const drawRows = () => {
      rowsEl.innerHTML = store.rows.map((r, i) => `<tr><td><input data-r="${i}" data-c="0" value="${esc(r[0])}" inputmode="decimal" aria-label="x ${i + 1}"></td><td><input data-r="${i}" data-c="1" value="${esc(r[1])}" inputmode="decimal" aria-label="y ${i + 1}"></td></tr>`).join('');
      $$('input', rowsEl).forEach(inp => inp.addEventListener('input', () => { store.rows[+inp.dataset.r][+inp.dataset.c] = inp.value; recompute(); clearTimeout(el._t); el._t = setTimeout(() => ctx.save(), 500); }));
    };
    const pts = () => store.rows.map(r => [TX[store.tx](CL.parseNum(r[0])), TY[store.ty](CL.parseNum(r[1]))]).filter(p => isFinite(p[0]) && isFinite(p[1]));
    function recompute() {
      const p = pts(), fit = CL.linfit(p);
      const xl = txLabel(store.tx, cfg.xl), yl = txLabel(store.ty, cfg.yl);
      const P = CL.plot({ id: 'g' + uid, w: 560, h: 300, xr: CL.extent(p.map(q => q[0]), 0.08, cfg.zero), yr: CL.extent(p.map(q => q[1]), 0.1, cfg.zero), xl, yl, series: [{ pts: p, mode: 'pts' }], lines: fit ? [fit] : [] });
      const box = $('[data-plot]', el); box.innerHTML = P.svg;
      CL.hover(box, P, x => fit ? `x = ${CL.sig(x, 4)}<br>fit y = ${CL.sig(fit.m * x + fit.b, 4)}` : '');
      $('[data-fit]', el).innerHTML = fit ? `<b>y = ${CL.sig(fit.m, 5)} x ${fit.b >= 0 ? '+' : '−'} ${CL.sig(Math.abs(fit.b), 5)}</b><br>slope = ${CL.sig(fit.m, 5)}, intercept = ${CL.sig(fit.b, 5)}, R² = ${fit.r2.toFixed(5)}, n = ${fit.n}` : '<span class="muted">Enter at least two points.</span>';
      store.cur = { fit, pts: p, xl, yl };
    }
    $('[data-addrow]', el).addEventListener('click', () => { store.rows.push(['', '']); drawRows(); });
    $('[data-clear]', el).addEventListener('click', () => { store.rows = store.rows.map(() => ['', '']); drawRows(); recompute(); ctx.save(); });
    const fb = $('[data-fill]', el);
    if (fb) fb.addEventListener('click', () => {
      const rows = cfg.fill(S, ctx.D, ctx);
      const filled = rows.filter(r => isFinite(r[0]) && isFinite(r[1]));
      if (!filled.length) { CL.toast('No matching data recorded yet.'); return; }
      store.rows = rows.map(r => [isFinite(r[0]) ? String(+r[0].toPrecision(6)) : '', isFinite(r[1]) ? String(+r[1].toPrecision(6)) : '']);
      drawRows(); recompute(); ctx.save();
      if (filled.length < rows.length) CL.toast(`Filled ${filled.length} of ${rows.length} rows — some measurements are missing.`);
    });
    const tx = $('[data-tx]', el), ty = $('[data-ty]', el);
    if (tx) tx.addEventListener('change', e => { store.tx = e.target.value; recompute(); });
    if (ty) ty.addEventListener('change', e => { store.ty = e.target.value; recompute(); });
    $('[data-save]', el).addEventListener('click', () => {
      const cur = store.cur; if (!cur || !cur.fit) { CL.toast('Need at least two points.'); return; }
      store.fit = cur.fit; store.pts = cur.pts; store.xl = cur.xl; store.yl = cur.yl;
      const tag = cfg.short || cfg.title || 'Graph';
      ctx.st.log = ctx.st.log.filter(e => ![cfg.k + '_slope', cfg.k + '_int', cfg.k + '_r2'].includes(e.k));
      ctx.st.log.push({ k: cfg.k + '_slope', l: `${tag}: slope (${cur.yl} vs ${cur.xl})`, v: cur.fit.m, t: Date.now() });
      ctx.st.log.push({ k: cfg.k + '_int', l: `${tag}: y-intercept`, v: cur.fit.b, t: Date.now() });
      ctx.st.log.push({ k: cfg.k + '_r2', l: `${tag}: R²`, v: cur.fit.r2, dp: 5, t: Date.now() });
      ctx.save(); CL.toast('Best-fit line recorded in your Data notebook.');
    });
    el.__auto = async () => { if (fb) fb.click(); if (cfg.autoTx) store.tx = cfg.autoTx; if (cfg.autoTy) store.ty = cfg.autoTy; recompute(); $('[data-save]', el).click(); };
    drawRows(); recompute();
  };
  CL.fitSVG = function (pl, id) {
    const P = CL.plot({ id, w: 520, h: 260, xr: CL.extent(pl.pts.map(q => q[0]), 0.08), yr: CL.extent(pl.pts.map(q => q[1]), 0.1), xl: pl.xl, yl: pl.yl, series: [{ pts: pl.pts, mode: 'pts' }], lines: [pl.fit] });
    return P.svg;
  };

  // ======================================================================
  // TLC / GEL — plate development and distance measurement
  // tlc cfg: {lanes:(S)=>[{k,l,spots:[{p, color?}]}], solvents:[{v,l,e}] | mix:{l,min,max,e:(pct)=>e}, rf:(p,e)=>Rf}
  // gel cfg: {mode:'gel', lanes:(S)=>[{k,l,bands:[mw,...]}], A, B}
  // ======================================================================
  sims.tlc = function (el, cfg, ctx, uid) {
    const S = ctx.S, lanes = resolve(cfg.lanes, S), gel = cfg.mode === 'gel';
    const rfModel = cfg.rf || ((p, e) => 0.02 + 0.95 / (1 + Math.exp(7 * (p - e))));
    let dev = null, uv = false, eSel = cfg.solvents ? cfg.solvents[0].v : null, pct = cfg.mix ? (cfg.mix.val ?? 20) : 0;
    const needsUV = !gel && lanes.some(l => l.spots.some(s => !s.color));
    el.innerHTML = head(cfg, gel ? 'Gel electrophoresis' : 'Thin-layer chromatography') + `<div class="bench"><div class="viz tlcviz" data-viz></div><div class="bpanel">
      <div class="ctls">${gel ? '' : cfg.solvents ? `<label class="ctl"><span>Developing solvent</span><select data-sol>${cfg.solvents.map(s => `<option value="${esc(s.v)}">${esc(s.l)}</option>`).join('')}</select></label>` :
        `<label class="ctl"><span>${esc(cfg.mix.l)}: <b data-po>${pct}</b>%</span><input type="range" min="${cfg.mix.min ?? 0}" max="${cfg.mix.max ?? 100}" step="${cfg.mix.step || 5}" value="${pct}" data-pct></label>`}</div>
      <div class="acts"><button class="btn sm" data-dev>${gel ? 'Run gel & stain' : 'Develop plate'}</button>${needsUV ? '<button class="btn sm ghost" data-uv>UV lamp: off</button>' : ''}</div>
      <p class="small muted">${gel ? 'After staining, click each band to measure its migration distance from the well.' : 'After developing, visualize the spots and click each one to measure its distance from the origin (the solvent front is recorded automatically).'}</p>
      <div class="msg small" data-msg aria-live="polite"></div></div></div>`;
    const msg = $('[data-msg]', el);
    const W = 60 + lanes.length * 52, H = gel ? 300 : 280;
    const plateTop = 20, plateLen = gel ? 9 : 7, origin = gel ? 0.4 : 1.0, scale = (H - 40) / plateLen;
    const yAt = d => plateTop + (gel ? (origin + d) : (plateLen - origin - d)) * scale;
    function draw() {
      let s = `<svg viewBox="0 0 ${W} ${H}" class="drawing plate" aria-label="${gel ? 'Gel' : 'TLC plate'}">`;
      s += `<rect x="30" y="${plateTop}" width="${W - 40}" height="${plateLen * scale}" rx="3" class="${gel ? 'gelbg' : 'platebg'} ${uv ? 'uv' : ''}"/>`;
      // ruler
      for (let cm = 0; cm <= plateLen; cm++) { const y = gel ? plateTop + cm * scale : plateTop + (plateLen - cm) * scale; s += `<line x1="20" x2="28" y1="${y}" y2="${y}" class="tickline"/><text x="16" y="${y + 4}" text-anchor="end" class="dlabel">${gel ? cm : cm}</text>`; }
      s += `<text x="8" y="${plateTop - 6}" class="dlabel">cm</text>`;
      if (!gel) s += `<line x1="32" x2="${W - 12}" y1="${yAt(0)}" y2="${yAt(0)}" class="pencil"/>`;
      if (dev && !gel) s += `<line x1="32" x2="${W - 12}" y1="${yAt(dev.front)}" y2="${yAt(dev.front)}" class="pencil dashed"/>`;
      lanes.forEach((ln, i) => {
        const x = 62 + i * 52;
        if (gel) s += `<rect x="${x - 16}" y="${plateTop + 2}" width="32" height="8" class="well"/>`;
        else s += `<circle cx="${x}" cy="${yAt(0)}" r="2" class="pencil"/>`;
        s += `<text x="${x}" y="${H - 4}" text-anchor="middle" class="dlabel">${esc(ln.short || ln.l).slice(0, 8)}</text>`;
        if (dev) dev.pos[i].forEach((d, j) => {
          const sp = gel ? {} : ln.spots[j];
          if (!gel && !sp.color && !uv) return;
          const y = yAt(d);
          if (gel) s += `<rect data-spot="${i}_${j}" x="${x - 15}" y="${y - 2.5}" width="30" height="5" rx="1.5" class="band" style="opacity:${0.45 + 0.55 * (ln.amt ? ln.amt[j] : 1)}"/>`;
          else s += `<ellipse data-spot="${i}_${j}" cx="${x}" cy="${y}" rx="8" ry="5.5" fill="${sp.color || 'rgba(70,40,120,.75)'}" class="spot"/>`;
        });
      });
      s += '</svg>';
      $('[data-viz]', el).innerHTML = s;
      $$('[data-spot]', el).forEach(sp => sp.addEventListener('click', () => {
        const [i, j] = sp.dataset.spot.split('_').map(Number);
        const d = CL.round(dev.pos[i][j] + 0.02 * CL.gauss(), 2);
        ctx.log({ k: `d_${lanes[i].k}_${j + 1}`, l: `${lanes[i].l}: ${gel ? 'band' : 'spot'} ${j + 1} distance from ${gel ? 'well' : 'origin'}${dev.label ? ' (' + dev.label + ')' : ''}`, v: d, u: 'cm', dp: 2 });
        $$('[data-spot]', el).forEach(o => o.classList.remove('sel')); sp.classList.add('sel');
      }));
    }
    const sol = $('[data-sol]', el); if (sol) sol.addEventListener('change', e => { eSel = e.target.value; });
    const pc = $('[data-pct]', el); if (pc) pc.addEventListener('input', e => { pct = +e.target.value; $('[data-po]', el).textContent = pct; });
    const uvb = $('[data-uv]', el); if (uvb) uvb.addEventListener('click', () => { uv = !uv; uvb.textContent = 'UV lamp: ' + (uv ? 'on' : 'off'); draw(); });
    $('[data-dev]', el).addEventListener('click', () => {
      if (gel) {
        const front = CL.round(8.0 + 0.1 * CL.gauss(), 2);
        dev = { front, pos: lanes.map(ln => ln.bands.map(mw => Math.max(0.2, Math.min(front, (cfg.A - cfg.B * Math.log10(mw)) * front)))) };
        ctx.log({ k: 'gel_front', l: 'Dye front distance from well', v: front, u: 'cm', dp: 2 });
        msg.textContent = 'Gel stained. Click bands to measure them.';
      } else {
        const e = cfg.solvents ? cfg.solvents.find(s => s.v === eSel).e : cfg.mix.e(pct);
        const label = cfg.solvents ? cfg.solvents.find(s => s.v === eSel).l : `${pct}% ${cfg.mix.short || ''}`.trim();
        const front = CL.round(5.0 + 0.15 * CL.gauss(), 2);
        dev = { e, front, label, pos: lanes.map(ln => ln.spots.map(sp => Math.max(0, CL.clamp(rfModel(sp.p, e) + 0.008 * CL.gauss(), 0, 0.99) * front))) };
        ctx.log({ k: 'tlc_front', l: `Solvent front distance (${label})`, v: front, u: 'cm', dp: 2 });
        ctx.st.tlcLast = { e, label }; ctx.save();
        msg.textContent = needsUV && !uv ? 'Plate developed. Turn on the UV lamp to see colourless compounds.' : 'Plate developed. Click spots to measure them.';
      }
      draw();
    });
    el.__auto = async () => {
      if (cfg.solvents && cfg.autoSol) eSel = cfg.autoSol;
      if (cfg.mix && cfg.autoPct != null) pct = cfg.autoPct;
      uv = true; $('[data-dev]', el).click();
      dev.pos.forEach((arr, i) => arr.forEach((d, j) => ctx.log({ k: `d_${lanes[i].k}_${j + 1}`, l: `${lanes[i].l}: spot ${j + 1}`, v: CL.round(d, 2), u: 'cm', dp: 2 })));
    };
    draw();
  };

  // ======================================================================
  // SPECTRUM — IR, 1H NMR, 13C NMR, MS, chromatogram, emission lines
  // cfg: {spectra:(S)=>[{v,l,kind,peaks, mhz}], clickLog}
  // ======================================================================
  const nmrPattern = (mult, J) => {
    const pas = { s: [1], d: [1, 1], t: [1, 2, 1], q: [1, 3, 3, 1], quint: [1, 4, 6, 4, 1], sext: [1, 5, 10, 10, 5, 1], sept: [1, 6, 15, 20, 15, 6, 1] };
    if (mult === 'dd') { const [a, b] = J; return [[-a / 2 - b / 2, 1], [-a / 2 + b / 2, 1], [a / 2 - b / 2, 1], [a / 2 + b / 2, 1]]; }
    if (mult === 'm') return [-1.5, -1, -0.5, 0, 0.5, 1, 1.5].map((o, i) => [o * (J || 7), [1, 3, 5, 6, 5, 3, 1][i]]);
    const p = pas[mult] || [1]; const n = p.length;
    return p.map((w, i) => [(i - (n - 1) / 2) * (J || 7), w]);
  };
  function specData(sp) {
    const k = sp.kind;
    if (k === 'ir') {
      const pts = [];
      for (let x = 4000; x >= 400; x -= 4) {
        let a = 0; sp.peaks.forEach(([c, d, w]) => { a += d * (w * w) / ((x - c) * (x - c) + w * w); });
        pts.push([x, CL.clamp(96 * Math.pow(10, -a) + 0.4 * Math.sin(x / 37), 0, 100)]);
      }
      return { pts, xr: [400, 4000], yr: [0, 100], xrev: true, xl: 'Wavenumber (cm⁻¹)', yl: '% Transmittance' };
    }
    if (k === 'hnmr') {
      const mhz = sp.mhz || 300, w = 0.0045;
      const lines = [];
      sp.peaks.forEach(([d, n, mult, J]) => {
        const pat = nmrPattern(mult, J); const tot = pat.reduce((s, q) => s + q[1], 0);
        pat.forEach(([off, wgt]) => lines.push([d + off / mhz, n * wgt / tot, mult === 'br' ? 0.03 : w]));
      });
      if (sp.solvent !== false) lines.push([7.26, 0.05, w]);
      lines.push([0, 0.15, w]);
      const pts = [];
      const lo = -0.3, hi = sp.max || 12;
      for (let x = hi; x >= lo; x -= 0.002) {
        let y = 0; for (const [c, h, ww] of lines) { const dx = x - c; if (Math.abs(dx) < 0.2) y += h * ww * ww / (dx * dx + ww * ww); }
        pts.push([x, y]);
      }
      const ymax = Math.max(...pts.map(p => p[1])) * 1.25;
      const minN = Math.min(...sp.peaks.map(p => p[1]));
      const ints = sp.peaks.map(p => [p[0], CL.round(p[1] / minN * (1 + 0.015 * Math.sin(p[0] * 13)), 2)]);
      return { pts, xr: [lo, hi], yr: [0, ymax], xrev: true, xl: 'Chemical shift δ (ppm)', yl: 'Intensity', ints, noY: true };
    }
    if (k === 'cnmr') {
      const lines = sp.peaks.map(p => [p[0], p[1] || 1]);
      if (sp.solvent !== false) { lines.push([77.36, 0.5], [77.0, 0.5], [76.64, 0.5]); }
      return { sticks: lines, xr: [0, 220], yr: [0, 1.3 * Math.max(...lines.map(l => l[1]))], xrev: true, xl: 'Chemical shift δ (ppm)', yl: 'Intensity', noY: true };
    }
    if (k === 'ms') {
      const mx = Math.max(...sp.peaks.map(p => p[0]));
      return { sticks: sp.peaks, xr: [Math.max(0, (sp.min ?? 10)), Math.ceil((mx + 10) / 10) * 10], yr: [0, 110], xl: 'm/z', yl: 'Relative abundance (%)', label: true };
    }
    if (k === 'chrom') {
      const tmax = sp.tmax || Math.max(...sp.peaks.map(p => p[0])) * 1.25 + 0.5;
      const pts = [];
      for (let t = 0; t <= tmax; t += tmax / 900) {
        let y = 0; sp.peaks.forEach(([c, area, w]) => { y += area / (w * Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * Math.pow((t - c) / w, 2)); });
        pts.push([t, y]);
      }
      const ymax = Math.max(...pts.map(p => p[1])) * 1.15;
      return { pts, xr: [0, tmax], yr: [0, ymax], xl: 'Retention time (min)', yl: 'Detector response', noY: true, chrom: true };
    }
    if (k === 'lines') return { lines: sp.peaks, xr: sp.xr || [380, 720], yr: [0, 1], xl: 'Wavelength (nm)', yl: '', noY: true };
    return { pts: sp.pts, xr: sp.xr, yr: sp.yr, xl: sp.xl, yl: sp.yl };
  }
  sims.spectrum = function (el, cfg, ctx, uid) {
    const S = ctx.S, list = resolve(cfg.spectra, S);
    let cur = list[0].v, zoom = null;
    el.innerHTML = head(cfg, 'Spectrum viewer') + `<div class="ctls row"><label class="ctl"><span>Spectrum</span><select data-sp>${list.map(s => `<option value="${esc(s.v)}">${esc(s.l)}</option>`).join('')}</select></label>
      <span class="zoomctl" data-zc hidden><label class="ctl inline"><span>From</span><input type="number" step="any" data-z0></label><label class="ctl inline"><span>to</span><input type="number" step="any" data-z1></label><button class="btn sm ghost" data-zr>Full range</button></span></div>
      <div class="plotbox spec" data-plot></div><div class="small muted" data-help></div><div data-extra></div>`;
    function draw() {
      const sp = list.find(s => s.v === cur), d = specData(sp);
      const isNMR = sp.kind === 'hnmr' || sp.kind === 'cnmr';
      $('[data-zc]', el).hidden = !(isNMR || sp.kind === 'chrom' || sp.kind === 'ir');
      let xr = d.xr.slice();
      if (zoom && zoom.v === cur) xr = [Math.min(zoom.a, zoom.b), Math.max(zoom.a, zoom.b)];
      const series = [];
      if (d.pts) series.push({ pts: d.pts.filter(p => p[0] >= xr[0] - 1e-9 && p[0] <= xr[1] + 1e-9), color: 'var(--s1)', width: 1.4 });
      if (d.sticks) series.push({ pts: d.sticks, mode: 'stick', color: 'var(--s1)', base: 0 });
      let ymax = d.yr[1];
      if (d.pts && zoom && zoom.v === cur && isNMR) ymax = Math.max(...series[0].pts.map(p => p[1]), 1e-6) * 1.25;
      const P = CL.plot({
        id: 'sv' + uid, w: 760, h: 320, xr, yr: [d.yr[0], ymax], xrev: d.xrev, xl: d.xl, yl: d.yl, noYTicks: d.noY, series, xt: 10,
        extra: (X, Y) => {
          let s = '';
          if (d.lines) { s += `<rect x="${X(xr[0])}" y="${Y(1)}" width="${X(xr[1]) - X(xr[0])}" height="${Y(0) - Y(1)}" fill="#05060a"/>`; d.lines.forEach(([l, I]) => { const c = Chem.wlRGB(l); s += `<rect x="${X(l) - 1.5}" y="${Y(1)}" width="3" height="${Y(0) - Y(1)}" fill="rgb(${c.join(',')})" opacity="${0.35 + 0.65 * I}"/>`; }); }
          if (d.ints) d.ints.forEach(([x, v]) => { if (x >= xr[0] && x <= xr[1]) s += `<text class="intlabel" x="${X(x)}" y="${Y(ymax) + 14}" text-anchor="middle">${v.toFixed(2)}</text>`; });
          if (d.label && d.sticks) d.sticks.filter(p => p[1] >= 12).forEach(p => { s += `<text class="intlabel" x="${X(p[0])}" y="${Y(p[1]) - 4}" text-anchor="middle">${p[0]}</text>`; });
          if (d.chrom) sp.peaks.forEach(([t], i) => { s += `<text class="intlabel" x="${X(t)}" y="${Y(ymax) + 14}" text-anchor="middle">${t.toFixed(2)}</text>`; });
          return s;
        }
      });
      const box = $('[data-plot]', el); box.innerHTML = P.svg;
      CL.hover(box, P, x => {
        if (d.sticks) { const p = d.sticks.reduce((b, q) => Math.abs(q[0] - x) < Math.abs(b[0] - x) ? q : b, d.sticks[0]); return sp.kind === 'ms' ? `m/z ${p[0]} — ${p[1].toFixed(0)}%` : `δ ${p[0].toFixed(1)} ppm`; }
        if (d.lines) return `${x.toFixed(0)} nm`;
        if (sp.kind === 'ir') { const p = d.pts.reduce((b, q) => Math.abs(q[0] - x) < Math.abs(b[0] - x) ? q : b, d.pts[0]); return `${x.toFixed(0)} cm⁻¹, ${p[1].toFixed(0)}% T`; }
        if (sp.kind === 'hnmr') return `δ ${x.toFixed(2)} ppm`;
        return `${x.toFixed(2)} ${sp.kind === 'chrom' ? 'min' : ''}`;
      });
      if (cfg.clickLog && (d.lines || d.chrom)) {
        $('svg', box).addEventListener('click', e => {
          const r = $('svg', box).getBoundingClientRect(); const px = (e.clientX - r.left) / r.width * P.W; const x = P.inv(px);
          if (d.lines) {
            const near = d.lines.map((l, i) => [l[0], i]).reduce((b, q) => Math.abs(q[0] - x) < Math.abs(b[0] - x) ? q : b);
            if (Math.abs(near[0] - x) > 6) { CL.toast('Click directly on a line.'); return; }
            const sorted = d.lines.map(l => l[0]).sort((a, b) => b - a);
            const idx = sorted.indexOf(near[0]) + 1;
            ctx.log({ k: `${sp.v}_line${idx}`, l: `${sp.l}: line ${idx} wavelength`, v: CL.round(near[0] + 0.6 * CL.gauss(), 0), u: 'nm', dp: 0 });
          }
        });
      }
      $('[data-help]', el).innerHTML = sp.kind === 'hnmr' ? 'Numbers above the peaks are relative integrations. Use From/To to zoom in on a multiplet and read its splitting.' :
        sp.kind === 'ir' ? 'Hover to read wavenumbers. Focus on 4000–1500 cm⁻¹ (functional groups) before the fingerprint region.' :
          sp.kind === 'ms' ? 'Hover to read m/z. The highest-mass significant peak is usually the molecular ion (M⁺).' :
            sp.kind === 'chrom' ? 'Retention times are labelled above each peak; see the integration report below.' :
              sp.kind === 'lines' ? (cfg.clickLog ? 'Click a line to record its wavelength.' : 'Hover to read wavelengths.') : sp.kind === 'cnmr' ? 'Proton-decoupled ¹³C spectrum; the triplet near 77 ppm is the CDCl₃ solvent.' : '';
      const ex = $('[data-extra]', el);
      if (d.chrom) {
        const tot = sp.peaks.reduce((s, p) => s + p[1], 0);
        ex.innerHTML = `<table class="data compact"><thead><tr><th>Peak</th><th>Ret. time (min)</th><th>Area</th><th>Area %</th></tr></thead><tbody>${sp.peaks.map((p, i) => `<tr><td>${i + 1}</td><td class="num">${p[0].toFixed(2)}</td><td class="num">${Math.round(p[1] * 1000)}</td><td class="num">${(100 * p[1] / tot).toFixed(1)}</td></tr>`).join('')}</tbody></table>
          ${cfg.recordChrom ? '<button class="btn sm" data-recchrom>Record integration report</button>' : ''}`;
        const rb = $('[data-recchrom]', ex);
        if (rb) rb.addEventListener('click', () => sp.peaks.forEach((p, i) => { ctx.log({ k: `${sp.v}_rt${i + 1}`, l: `${sp.l}: peak ${i + 1} retention time`, v: p[0], u: 'min', dp: 2 }); ctx.log({ k: `${sp.v}_area${i + 1}`, l: `${sp.l}: peak ${i + 1} area`, v: Math.round(p[1] * 1000), dp: 0 }); }));
      } else ex.innerHTML = '';
    }
    $('[data-sp]', el).addEventListener('change', e => { cur = e.target.value; zoom = null; $('[data-z0]', el).value = ''; $('[data-z1]', el).value = ''; draw(); });
    const zc = () => { const a = parseFloat($('[data-z0]', el).value), b = parseFloat($('[data-z1]', el).value); if (isFinite(a) && isFinite(b) && a !== b) { zoom = { v: cur, a, b }; draw(); } };
    $('[data-z0]', el).addEventListener('change', zc); $('[data-z1]', el).addEventListener('change', zc);
    $('[data-zr]', el).addEventListener('click', () => { zoom = null; $('[data-z0]', el).value = ''; $('[data-z1]', el).value = ''; draw(); });
    el.__auto = async () => {
      list.forEach(sp => {
        if (cfg.clickLog && sp.kind === 'lines') sp.peaks.map(l => l[0]).sort((a, b) => b - a).forEach((l, i) => ctx.log({ k: `${sp.v}_line${i + 1}`, l: `${sp.l}: line ${i + 1}`, v: Math.round(l), u: 'nm', dp: 0 }));
        if (cfg.recordChrom && sp.kind === 'chrom') sp.peaks.forEach((p, i) => { ctx.log({ k: `${sp.v}_rt${i + 1}`, l: 'rt', v: p[0], u: 'min', dp: 2 }); ctx.log({ k: `${sp.v}_area${i + 1}`, l: 'area', v: Math.round(p[1] * 1000), dp: 0 }); });
      });
    };
    draw();
  };

  // ======================================================================
  // SYNTH — synthesis workflow with decisions
  // cfg: {k, title, sm:{name, MW, mass:(S)=>g, label}, product:{name, MW, mp:[lo,hi], ratio}, steps:[{k,l,opts:[{v,l,y,p,fail,note}]}],
  //       base:(S)=>fraction, liquid:true (no mp; report bp/purity), after:(S,ch,res)=>[logs]}
  // ======================================================================
  sims.synth = function (el, cfg, ctx) {
    const S = ctx.S, st = ctx.st;
    const ch = {};
    const rec = (st.synth[cfg.k] = st.synth[cfg.k] || { title: cfg.title, attempts: 0, summary: 'not run' });
    const smMass = resolve(cfg.sm.mass, S);
    el.innerHTML = head(cfg, 'Synthesis') + `<div class="synth"><div class="sm card"><b>Starting material:</b> ${cfg.sm.label || esc(cfg.sm.name)} — you will weigh about ${smMass.toFixed(2)} g (MW ${cfg.sm.MW} g/mol).${cfg.reagents ? `<div class="small muted">${cfg.reagents}</div>` : ''}</div>
      <ol class="steps">${cfg.steps.map(s => `<li><label class="ctl"><span>${s.l}</span><select data-st="${s.k}"><option value="">— choose —</option>${s.opts.map(o => `<option value="${esc(o.v)}">${esc(o.l)}</option>`).join('')}</select></label></li>`).join('')}</ol>
      <div class="acts"><button class="btn" data-run>Run the procedure</button><span class="small muted" data-att>${rec.attempts ? 'Attempts so far: ' + rec.attempts : ''}</span></div>
      <div class="notebook" data-nb aria-live="polite"></div></div>`;
    $$('[data-st]', el).forEach(s => s.addEventListener('change', () => { ch[s.dataset.st] = s.value; }));
    const runSynth = instant => {
      const missing = cfg.steps.filter(s => !ch[s.k]);
      if (missing.length) { $('[data-nb]', el).innerHTML = `<p class="warn">Choose an option for every step first (missing: ${missing.map(m => esc(m.l.replace(/:$/, ''))).join('; ')}).</p>`; return; }
      rec.attempts++;
      $('[data-att]', el).textContent = 'Attempts so far: ' + rec.attempts;
      const opts = cfg.steps.map(s => s.opts.find(o => o.v === ch[s.k]));
      const lines = [];
      const m0 = CL.round(smMass * (1 + 0.004 * CL.gauss()), 3);
      lines.push(`Weighed ${m0.toFixed(3)} g of ${esc(cfg.sm.name)}.`);
      let fail = null, y = resolve(cfg.base, S) ?? 0.8, p = 1;
      opts.forEach((o, i) => {
        lines.push(`<b>${esc(cfg.steps[i].l.replace(/:$/, ''))}:</b> ${esc(o.l)}. ${o.note || ''}`);
        if (o.fail && !fail) fail = o.fail;
        y *= o.y ?? 1; p *= o.p ?? 1;
      });
      const logs = [{ k: cfg.k + '_msm', l: `Mass of ${cfg.sm.name} used`, v: m0, u: 'g', dp: 3 }];
      let summary;
      if (cfg.custom) {
        const r = cfg.custom(S, ch, opts, m0);
        r.lines.forEach(l => lines.push(l)); (r.logs || []).forEach(e => logs.push(e)); summary = r.summary;
      } else if (fail) {
        lines.push(`<span class="bad">Result: ${fail}</span>`);
        summary = 'failed — ' + fail.replace(/<[^>]+>/g, '');
      } else {
        const theo = m0 / cfg.sm.MW * (cfg.product.ratio || 1) * cfg.product.MW;
        y = CL.clamp(y * (1 + 0.04 * CL.gauss()), 0.02, 0.98);
        const mass = CL.round(theo * y * (1 + 0.6 * (1 - p)), 3);
        logs.push({ k: cfg.k + '_mprod', l: `Mass of ${cfg.product.name} obtained (dry)`, v: mass, u: 'g', dp: 3 });
        let res = `Isolated <b>${mass.toFixed(3)} g</b> of ${esc(cfg.product.name)}`;
        if (cfg.product.mp) {
          const lo = CL.round(cfg.product.mp[0] - (1 - p) * 28 + 0.6 * CL.gauss(), 0), hi = CL.round(cfg.product.mp[1] - (1 - p) * 9 + 0.4 * CL.gauss(), 0);
          logs.push({ k: cfg.k + '_mplo', l: `${cfg.product.name}: melting point, start`, v: Math.min(lo, hi - 1), u: '°C', dp: 0 });
          logs.push({ k: cfg.k + '_mphi', l: `${cfg.product.name}: melting point, end`, v: hi, u: '°C', dp: 0 });
          res += `, melting range ${Math.min(lo, hi - 1)}–${hi} °C`;
        }
        if (cfg.product.bp) res += `, distilled near ${cfg.product.bp} °C`;
        logs.push({ k: cfg.k + '_purity', l: `${cfg.product.name}: purity estimate (GC/TLC)`, v: CL.round(100 * p * (1 - 0.01 * Math.abs(CL.gauss())), 0), u: '%', dp: 0 });
        lines.push(`<span class="good">Result: ${res}.</span>${p < 0.9 ? ' <span class="warn">The product looks impure — think about which step caused it.</span>' : ''}`);
        if (cfg.after) (cfg.after(S, ch, { mass, y, p }) || []).forEach(e => logs.push(e));
        summary = res.replace(/<[^>]+>/g, '') + ` (choices: ${opts.map(o => o.l).join('; ')})`;
      }
      rec.summary = summary; ctx.save();
      const nb = $('[data-nb]', el); nb.innerHTML = '';
      if (instant) { nb.innerHTML = lines.map(l => `<p>${l}</p>`).join(''); logs.forEach(e => ctx.log(e)); return; }
      lines.forEach((ln, i) => setTimeout(() => { const p = document.createElement('p'); p.innerHTML = ln; nb.appendChild(p); if (i === lines.length - 1) logs.forEach(e => ctx.log(e)); }, 280 * i));
    };
    $('[data-run]', el).addEventListener('click', () => runSynth(false));
    el.__auto = async () => {
      cfg.steps.forEach(st2 => { const best = st2.opts.slice().sort((a, b) => ((b.fail ? -1 : (b.y ?? 1) * (b.p ?? 1)) - (a.fail ? -1 : (a.y ?? 1) * (a.p ?? 1))))[0]; ch[st2.k] = best.v; });
      runSynth(true);
    };
  };

  // ======================================================================
  // VSEPR — 3D model viewer
  // cfg: {molecules:[{f, center, lig:['H',...], lp, note}]}
  // ======================================================================
  const GEO = {
    2: [[1, 0, 0], [-1, 0, 0]],
    3: [[0, 1, 0], [0.866, -0.5, 0], [-0.866, -0.5, 0]],
    4: [[0, 1, 0], [0.943, -0.333, 0], [-0.471, -0.333, 0.816], [-0.471, -0.333, -0.816]],
    5: [[1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866], [0, 1, 0], [0, -1, 0]],
    6: [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]]
  };
  const ECOL = { H: '#f2f2f2', C: '#3a3a3a', N: '#3060e0', O: '#e03a30', F: '#8fd14f', Cl: '#2fbf3a', Br: '#a33a22', I: '#8a2d9c', S: '#f0d23a', P: '#f08a20', B: '#f5a8a0', Be: '#b8e8a0', Xe: '#5ab8d8', Se: '#e0a040', Si: '#c0a080', As: '#c080e0', Kr: '#5cc', Te: '#c87' };
  sims.vsepr = function (el, cfg) {
    const mols = cfg.molecules;
    let cur = 0, yaw = 0.6, pitch = 0.35, showLP = true, drag = null;
    el.innerHTML = head(cfg, '3D molecular model kit') + `<div class="ctls row"><label class="ctl"><span>Molecule / ion</span><select data-m>${mols.map((m, i) => `<option value="${i}">${m.label || m.f}</option>`).join('')}</select></label>
      <label class="ctl chk"><input type="checkbox" data-lp checked> <span>Show lone pairs on central atom</span></label></div>
      <div class="vsepr" data-v tabindex="0" aria-label="3D model. Drag or use arrow keys to rotate."></div><p class="small muted">Drag (or use arrow keys) to rotate. Lone pairs are shown as translucent lobes.</p>`;
    const host = $('[data-v]', el);
    function draw() {
      const m = mols[cur];
      const sn = m.lig.length + m.lp; const pos = GEO[sn] || GEO[4];
      let lpIdx = [];
      if (sn === 5) lpIdx = [0, 1, 2].slice(0, m.lp);
      else if (sn === 6) lpIdx = [0, 1].slice(0, m.lp).concat(m.lp > 2 ? [2, 3].slice(0, m.lp - 2) : []);
      else lpIdx = Array.from({ length: m.lp }, (_, i) => i);
      const ligPos = pos.filter((_, i) => !lpIdx.includes(i)), lpPos = lpIdx.map(i => pos[i]);
      const rot = ([x, y, z]) => { const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch); const x1 = cy * x + sy * z, z1 = -sy * x + cy * z; const y1 = cp * y - sp * z1, z2 = sp * y + cp * z1; return [x1, y1, z2]; };
      const items = [];
      const C = 160, Lb = 95;
      items.push({ z: 0, s: `<circle cx="${C}" cy="${C}" r="26" fill="${ECOL[m.center] || '#c9c'}" class="atom"/><text x="${C}" y="${C + 5}" text-anchor="middle" class="alabel ${['C', 'I', 'Br', 'N'].includes(m.center) ? 'light' : ''}">${m.center}</text>` });
      ligPos.forEach((p, i) => {
        const [x, y, z] = rot(p); const el2 = m.lig[i]; const r = el2 === 'H' ? 14 : 20;
        const X = C + x * Lb, Y = C - y * Lb;
        items.push({ z: z / 2 - 0.01, s: `<line x1="${C}" y1="${C}" x2="${X}" y2="${Y}" class="bond"/>` });
        items.push({ z, s: `<circle cx="${X}" cy="${Y}" r="${r * (1 + z * 0.12)}" fill="${ECOL[el2] || '#c9c'}" class="atom"/><text x="${X}" y="${Y + 4}" text-anchor="middle" class="alabel ${['C', 'I', 'Br', 'N'].includes(el2) ? 'light' : ''}" style="font-size:${el2.length > 1 ? 11 : 13}px">${el2}</text>` });
      });
      if (showLP) lpPos.forEach(p => { const [x, y, z] = rot(p); const X = C + x * 58, Y = C - y * 58; const ang = Math.atan2(-y, x) * 180 / Math.PI; items.push({ z, s: `<ellipse cx="${X}" cy="${Y}" rx="30" ry="17" transform="rotate(${ang} ${X} ${Y})" class="lp"/><circle cx="${X - 5}" cy="${Y}" r="2.5" class="lpdot"/><circle cx="${X + 5}" cy="${Y}" r="2.5" class="lpdot"/>` }); });
      items.sort((a, b) => a.z - b.z);
      host.innerHTML = `<svg viewBox="0 0 320 320" class="drawing mol">${items.map(i => i.s).join('')}</svg><div class="molf">${m.label || m.f}${m.charge ? '' : ''}</div>`;
    }
    $('[data-m]', el).addEventListener('change', e => { cur = +e.target.value; draw(); });
    $('[data-lp]', el).addEventListener('change', e => { showLP = e.target.checked; draw(); });
    const start = e => { const p = e.touches ? e.touches[0] : e; drag = [p.clientX, p.clientY, yaw, pitch]; };
    const move = e => { if (!drag) return; const p = e.touches ? e.touches[0] : e; yaw = drag[2] + (p.clientX - drag[0]) * 0.012; pitch = CL.clamp(drag[3] + (p.clientY - drag[1]) * 0.012, -1.5, 1.5); draw(); if (e.cancelable) e.preventDefault(); };
    host.addEventListener('mousedown', start); host.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('mousemove', move); host.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('mouseup', () => { drag = null; }); host.addEventListener('touchend', () => { drag = null; });
    host.addEventListener('keydown', e => { const k = { ArrowLeft: [-0.15, 0], ArrowRight: [0.15, 0], ArrowUp: [0, -0.15], ArrowDown: [0, 0.15] }[e.key]; if (k) { yaw += k[0]; pitch = CL.clamp(pitch + k[1], -1.5, 1.5); draw(); e.preventDefault(); } });
    draw();
  };
})();
