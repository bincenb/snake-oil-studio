/* Virtual Chem Labs — core engine: profiles, seeded unknowns, routing, questions, notebook, report */
(function () {
  'use strict';
  const CL = (window.CL = window.CL || {});
  CL.courses = []; CL.labs = []; CL.byId = {}; CL.sims = CL.sims || {};
  CL.course = c => { CL.courses.push(c); };
  CL.lab = l => { CL.labs.push(l); CL.byId[l.id] = l; };

  // ---------------- utilities ----------------
  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  CL.esc = esc;
  CL.$ = (s, el = document) => el.querySelector(s);
  CL.$$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  CL.round = (x, dp) => { const f = Math.pow(10, dp); return Math.round(x * f) / f; };
  CL.fix = (v, dp) => (typeof v === 'number' && isFinite(v) ? v.toFixed(dp) : (v ?? '—'));
  CL.sig = function (v, n = 3) {
    if (typeof v !== 'number' || !isFinite(v)) return '—';
    if (v === 0) return '0';
    const a = Math.abs(v);
    if (a >= 1e5 || a < 1e-3) {
      const [m, e] = v.toExponential(n - 1).split('e');
      return `${m} × 10<sup>${Number(e)}</sup>`;
    }
    return Number(v.toPrecision(n)).toString();
  };
  CL.gauss = function () {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  /** Measurement with instrument noise sd, rounded to dp decimals. */
  CL.meas = (v, sd, dp) => CL.round(v + (sd || 0) * CL.gauss(), dp);
  CL.clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  function hashStr(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }
  CL.hash = hashStr;
  CL.rng = function (seedStr) {
    let a = hashStr(seedStr);
    const r = function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const R = {
      r,
      between: (lo, hi, dp) => { const v = lo + (hi - lo) * r(); return dp == null ? v : CL.round(v, dp); },
      int: (lo, hi) => lo + Math.floor(r() * (hi - lo + 1)),
      pick: arr => arr[Math.floor(r() * arr.length)],
      shuffle: arr => { const b = arr.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; },
      gauss: () => { let u = r() || 1e-9, v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
    };
    return R;
  };

  // ---------------- storage ----------------
  const mem = {};
  const LS = {
    get(k) { try { const v = localStorage.getItem(k); if (v != null) return JSON.parse(v); } catch (e) { /* ignore */ } return mem[k] ?? null; },
    set(k, v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
    del(k) { delete mem[k]; try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };
  CL.LS = LS;

  CL.profile = LS.get('vcl:profile');
  const normName = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normSection = s => String(s || '').trim().toUpperCase().replace(/\s+/g, '');
  CL.seedBase = (p = CL.profile) => p ? normSection(p.section) + '|' + normName(p.name) : 'anon';
  const stateKey = id => 'vcl:' + CL.seedBase() + ':' + id;
  const blankState = () => ({ prelab: {}, log: [], ans: {}, series: {}, plots: {}, synth: {}, notes: '', started: Date.now() });
  CL.loadState = id => Object.assign(blankState(), LS.get(stateKey(id)) || {});

  /** Unknowns/parameters for a lab are deterministic for (class code, student name, lab). */
  CL.labSetup = function (lab, profile = CL.profile) {
    const R = CL.rng(CL.seedBase(profile) + '|' + lab.id);
    return lab.setup ? lab.setup(R) : {};
  };

  function makeD(st) {
    const find = k => st.log.find(e => e.k === k);
    const D = k => { const e = find(k); return e && typeof e.v === 'number' ? e.v : NaN; };
    D.has = k => !!find(k);
    D.text = k => { const e = find(k); return e ? String(e.v) : ''; };
    D.series = k => st.series[k];
    D.keys = () => st.log.map(e => e.k);
    D.sum = (...ks) => ks.reduce((s, k) => s + D(k), 0);
    D.mean = (...ks) => { const v = ks.map(D).filter(isFinite); return v.length === ks.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN; };
    D.meanAny = (...ks) => { const v = ks.map(D).filter(x => isFinite(x)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN; };
    return D;
  }
  CL.makeD = makeD;

  function makeCtx(lab, opt) {
    opt = opt || {};
    const S = opt.S || CL.labSetup(lab);
    const st = opt.st || CL.loadState(lab.id);
    const ctx = {
      lab, S, st, D: makeD(st), listeners: [], quiet: !!opt.quiet,
      save() { st.updated = Date.now(); if (!opt.st) LS.set(stateKey(lab.id), st); ctx.listeners.forEach(f => f()); },
      log(e) {
        const entry = Object.assign({ t: Date.now() }, e);
        if (!entry.k) entry.k = 'obs_' + (st.log.length + 1) + '_' + Math.floor(Math.random() * 1e4);
        const i = st.log.findIndex(x => x.k === entry.k);
        if (i >= 0) st.log[i] = entry; else st.log.push(entry);
        ctx.save();
        if (!ctx.quiet) CL.toast(`Recorded: ${entry.l} = ${fmtVal(entry)}`);
      },
      onChange(f) { ctx.listeners.push(f); }
    };
    return ctx;
  }

  function fmtVal(e) {
    if (typeof e.v === 'number') return (e.dp != null ? e.v.toFixed(e.dp) : CL.sig(e.v, 4).replace(/<\/?sup>/g, m => m === '<sup>' ? '^' : '')) + (e.u ? ' ' + e.u : '');
    return String(e.v);
  }
  CL.fmtVal = fmtVal;
  function fmtValHTML(e) {
    if (typeof e.v === 'number') return (e.dp != null ? e.v.toFixed(e.dp) : CL.sig(e.v, 4)) + (e.u ? ' ' + esc(e.u) : '');
    return esc(e.v);
  }

  // ---------------- toast ----------------
  let toastTimer;
  CL.toast = function (msg) {
    if (CL.quiet) return;
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  };

  // ---------------- plotting ----------------
  function niceTicks(min, max, n = 5) {
    const span = max - min; if (!(span > 0)) return [min];
    const step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0))), err = step0 / mag;
    const step = (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1) * mag;
    const t = [];
    for (let v = Math.ceil(min / step - 1e-9) * step; v <= max + step * 1e-9; v += step) t.push(+v.toPrecision(12));
    return t;
  }
  CL.niceTicks = niceTicks;
  const fmtTick = v => { const a = Math.abs(v); if (a !== 0 && (a < 1e-3 || a >= 1e5)) return v.toExponential(1); return String(+v.toPrecision(6)); };
  CL.palette = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)', 'var(--s6)'];

  /**
   * Build an SVG plot. o = {w,h,xr,yr,xl,yl,xrev,series:[{pts,color,mode:'line'|'pts'|'stick',label,width}],
   *   lines:[{m,b,color}], extra:(X,Y)=>svg}
   */
  CL.plot = function (o) {
    const W = o.w || 600, H = o.h || 300, m = { l: o.ml || 60, r: 16, t: 14, b: 44 };
    let [x0, x1] = o.xr, [y0, y1] = o.yr;
    if (x1 === x0) x1 = x0 + 1; if (y1 === y0) y1 = y0 + 1;
    const pw = W - m.l - m.r, ph = H - m.t - m.b;
    const X = v => m.l + (o.xrev ? (x1 - v) : (v - x0)) / (x1 - x0) * pw;
    const Y = v => m.t + (y1 - v) / (y1 - y0) * ph;
    let s = `<svg viewBox="0 0 ${W} ${H}" class="plot" role="img" aria-label="${esc(o.aria || ((o.yl || 'y') + ' versus ' + (o.xl || 'x')))}">`;
    s += `<defs><clipPath id="clip${o.id || ''}"><rect x="${m.l}" y="${m.t}" width="${pw}" height="${ph}"/></clipPath></defs>`;
    if (!o.noYTicks) for (const t of niceTicks(y0, y1, o.yt || 5)) {
      s += `<line class="grid" x1="${m.l}" x2="${m.l + pw}" y1="${Y(t)}" y2="${Y(t)}"/><text class="tick" x="${m.l - 6}" y="${Y(t) + 4}" text-anchor="end">${fmtTick(t)}</text>`;
    }
    for (const t of niceTicks(x0, x1, o.xt || 6)) {
      s += `<line class="grid" y1="${m.t}" y2="${m.t + ph}" x1="${X(t)}" x2="${X(t)}"/><text class="tick" x="${X(t)}" y="${m.t + ph + 16}" text-anchor="middle">${fmtTick(t)}</text>`;
    }
    s += `<rect class="axes" x="${m.l}" y="${m.t}" width="${pw}" height="${ph}"/>`;
    if (o.xl) s += `<text class="axlabel" x="${m.l + pw / 2}" y="${H - 6}" text-anchor="middle">${esc(o.xl)}</text>`;
    if (o.yl) s += `<text class="axlabel" transform="translate(14 ${m.t + ph / 2}) rotate(-90)" text-anchor="middle">${esc(o.yl)}</text>`;
    s += `<g clip-path="url(#clip${o.id || ''})">`;
    (o.lines || []).forEach(L => {
      s += `<line class="fit" stroke="${L.color || 'var(--accent-2)'}" x1="${X(x0)}" y1="${Y(L.m * x0 + L.b)}" x2="${X(x1)}" y2="${Y(L.m * x1 + L.b)}"/>`;
    });
    (o.series || []).forEach((se, i) => {
      const col = se.color || CL.palette[i % CL.palette.length];
      const pts = (se.pts || []).filter(p => isFinite(p[0]) && isFinite(p[1]));
      if (se.mode === 'pts') pts.forEach(p => { s += `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="${se.r || 4}" fill="${col}" class="pt"/>`; });
      else if (se.mode === 'stick') pts.forEach(p => { s += `<line x1="${X(p[0])}" x2="${X(p[0])}" y1="${Y(se.base ?? y0)}" y2="${Y(p[1])}" stroke="${col}" stroke-width="${se.width || 2}"/>`; });
      else if (pts.length) s += `<path d="M${pts.map(p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join('L')}" fill="none" stroke="${col}" stroke-width="${se.width || 2}" stroke-linejoin="round"/>`;
    });
    if (o.extra) s += o.extra(X, Y);
    s += `</g><line class="xhair" x1="-10" x2="-10" y1="${m.t}" y2="${m.t + ph}"/>`;
    if (o.legend && (o.series || []).some(se => se.label)) {
      let ly = m.t + 14;
      (o.series || []).forEach((se, i) => {
        if (!se.label) return;
        s += `<rect x="${m.l + pw - 170}" y="${ly - 9}" width="10" height="10" rx="2" fill="${se.color || CL.palette[i % CL.palette.length]}"/><text class="legend" x="${m.l + pw - 155}" y="${ly}">${esc(se.label).slice(0, 26)}</text>`;
        ly += 16;
      });
    }
    s += '</svg>';
    const inv = px => o.xrev ? x1 - (px - m.l) / pw * (x1 - x0) : x0 + (px - m.l) / pw * (x1 - x0);
    return { svg: s, X, Y, inv, W, H, m, pw, ph };
  };

  /** Attach hover crosshair. cb(x) returns label HTML. */
  CL.hover = function (holder, P, cb) {
    const svg = holder.querySelector('svg.plot'); if (!svg) return;
    const line = svg.querySelector('.xhair');
    let tip = holder.querySelector('.tip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; holder.appendChild(tip); }
    const move = e => {
      const r = svg.getBoundingClientRect();
      const cx = (e.touches ? e.touches[0].clientX : e.clientX);
      const px = (cx - r.left) / r.width * P.W;
      if (px < P.m.l || px > P.m.l + P.pw) { tip.style.display = 'none'; line.setAttribute('x1', -10); line.setAttribute('x2', -10); return; }
      line.setAttribute('x1', px); line.setAttribute('x2', px);
      const html = cb(P.inv(px));
      if (!html) { tip.style.display = 'none'; return; }
      tip.innerHTML = html; tip.style.display = 'block';
      const hx = (cx - holder.getBoundingClientRect().left);
      tip.style.left = Math.min(hx + 10, holder.clientWidth - tip.offsetWidth - 4) + 'px';
    };
    svg.addEventListener('mousemove', move);
    svg.addEventListener('touchmove', move, { passive: true });
    svg.addEventListener('mouseleave', () => { tip.style.display = 'none'; line.setAttribute('x1', -10); line.setAttribute('x2', -10); });
  };

  CL.linfit = function (pts) {
    const p = pts.filter(q => isFinite(q[0]) && isFinite(q[1]));
    const n = p.length; if (n < 2) return null;
    let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
    p.forEach(([x, y]) => { sx += x; sy += y; sxx += x * x; sxy += x * y; syy += y * y; });
    const d = n * sxx - sx * sx; if (d === 0) return null;
    const m = (n * sxy - sx * sy) / d, b = (sy - m * sx) / n;
    const ssr = p.reduce((s, [x, y]) => s + Math.pow(y - (m * x + b), 2), 0);
    const sst = syy - sy * sy / n;
    return { m, b, r2: sst > 0 ? 1 - ssr / sst : 1, n };
  };
  CL.extent = function (vals, pad = 0.06, incl0) {
    const v = vals.filter(isFinite); if (!v.length) return [0, 1];
    let lo = Math.min(...v), hi = Math.max(...v);
    if (incl0) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
    if (lo === hi) { lo -= Math.abs(lo) * 0.1 || 1; hi += Math.abs(hi) * 0.1 || 1; }
    const p = (hi - lo) * pad; return [lo - (incl0 && lo === 0 ? 0 : p), hi + p];
  };

  // ---------------- number parsing & answer checking ----------------
  CL.parseNum = function (s) {
    if (s == null) return NaN;
    let t = String(s).trim().replace(/,/g, '').replace(/[−–]/g, '-').replace(/\s+/g, ' ');
    t = t.replace(/\s*[x×*·]\s*10\s*\^?\s*\(?\s*([+-]?\d+)\s*\)?/i, 'e$1');
    t = t.replace(/^([+-]?[\d.]+)\s*e\s*([+-]?\d+)/i, '$1e$2');
    const m = t.match(/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i);
    return m ? parseFloat(m[0]) : NaN;
  };
  const resolve = (v, ...a) => (typeof v === 'function' ? v(...a) : v);
  CL.resolve = resolve;

  function gradeable(q) { return !q.h && !q.text; }

  function checkQ(q, raw, ctx) {
    if (q.choices) {
      const a = resolve(q.ans, ctx.S, ctx.D);
      const v = parseInt(raw, 10);
      if (!isFinite(v)) return { state: 'none', msg: 'Choose an answer.' };
      const ok = Array.isArray(a) ? a.includes(v) : v === a;
      return { state: ok ? 'ok' : 'bad', msg: ok ? 'Correct.' : 'Not correct — reconsider your evidence.' };
    }
    const v = CL.parseNum(raw);
    if (!isFinite(v)) return { state: 'none', msg: 'Enter a number (scientific notation like 2.5e-4 or 2.5 x 10^-4 is fine).' };
    const a = resolve(q.ans, ctx.S, ctx.D);
    if (typeof a !== 'number' || !isFinite(a)) return { state: 'wait', msg: 'Cannot check yet — record the measurements this answer depends on first' + (q.needs ? ` (${q.needs}).` : '.') };
    const tol = q.int ? 1e-9 : Math.max(q.atol || 0, (q.tol ?? 0.03) * Math.abs(a));
    const ok = Math.abs(v - a) <= tol;
    if (ok && q.truth != null) {
      const tr = resolve(q.truth, ctx.S, ctx.D);
      const ttol = Math.max(q.tatol || 0, (q.ttol ?? 0.04) * Math.abs(tr));
      if (isFinite(tr) && Math.abs(v - tr) > ttol) {
        const off = tr !== 0 ? Math.abs((v - tr) / tr * 100).toFixed(1) + '%' : 'too far';
        return { state: 'bad', msg: `Your arithmetic matches your data, but the result is ${off} away from the true value. The problem is in the measurement (for example an overshot endpoint, a misread scale or a skipped step). Repeat that measurement and recalculate.` };
      }
    }
    let msg = ok ? 'Correct — within tolerance.' : 'Not within tolerance. Re-check your calculation, units and data.';
    return { state: ok ? 'ok' : 'bad', msg, dir: ok ? 0 : (v > a ? 1 : -1) };
  }

  function renderQuestions(host, list, ctx, bucket) {
    const store = ctx.st[bucket];
    let n = 0;
    host.innerHTML = list.map((q, i) => {
      if (q.h) return `<h3 class="qhead">${q.h}</h3>`;
      n++;
      const id = q.id || (bucket + i);
      const saved = store[id] || {};
      const prompt = resolve(q.q, ctx.S, ctx.D);
      let input;
      if (q.choices) {
        const ch = resolve(q.choices, ctx.S);
        input = `<div class="choices" role="radiogroup">${ch.map((c, j) => `<label class="opt"><input type="radio" name="${bucket}-${id}" value="${j}" ${String(saved.v) === String(j) ? 'checked' : ''}> <span>${c}</span></label>`).join('')}</div>`;
      } else if (q.text) {
        input = `<textarea rows="${q.rows || 4}" data-in placeholder="Write your answer in complete sentences.">${esc(saved.v || '')}</textarea>`;
      } else {
        input = `<div class="numin"><input type="text" inputmode="decimal" autocomplete="off" data-in value="${esc(saved.v ?? '')}" aria-label="Answer"><span class="unit">${q.unit ? esc(q.unit) : ''}</span></div>`;
      }
      const fb = saved.state ? feedbackHTML(saved, q) : '';
      return `<div class="q" data-qi="${i}" data-id="${esc(id)}">
        <div class="qnum">${n}</div>
        <div class="qbody"><div class="qtext">${prompt}</div>${input}
        ${q.text ? '<div class="small muted">Saved automatically. Graded by your instructor.</div>' : `<div class="qact"><button class="btn sm" data-check>Check</button><span class="att">${saved.n ? saved.n + ' attempt' + (saved.n > 1 ? 's' : '') : ''}</span></div>`}
        <div class="fb" aria-live="polite">${fb}</div></div></div>`;
    }).join('');

    CL.$$('.q', host).forEach(el => {
      const q = list[+el.dataset.qi]; const id = el.dataset.id;
      const getRaw = () => q.choices ? (CL.$('input[type=radio]:checked', el) || {}).value : CL.$('[data-in]', el).value;
      if (q.text) {
        CL.$('textarea', el).addEventListener('input', e => { store[id] = { v: e.target.value }; clearTimeout(el._t); el._t = setTimeout(() => ctx.save(), 400); });
        return;
      }
      const btn = CL.$('[data-check]', el);
      const run = () => {
        const raw = getRaw();
        const res = checkQ(q, raw, ctx);
        const prev = store[id] || {};
        const rec = { v: raw, n: (prev.n || 0) + (res.state === 'ok' || res.state === 'bad' ? 1 : 0), state: res.state, msg: res.msg, dir: res.dir, ok: prev.ok || res.state === 'ok' };
        if (res.state === 'ok') rec.ok = true;
        store[id] = rec; ctx.save();
        CL.$('.fb', el).innerHTML = feedbackHTML(rec, q);
        CL.$('.att', el).textContent = rec.n ? rec.n + ' attempt' + (rec.n > 1 ? 's' : '') : '';
      };
      btn.addEventListener('click', run);
      const inp = CL.$('input[data-in]', el);
      if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
    });
  }

  function feedbackHTML(rec, q) {
    const cls = rec.state === 'ok' ? 'good' : rec.state === 'bad' ? 'bad' : 'warn';
    let s = `<span class="${cls}">${rec.state === 'ok' ? '✓ ' : rec.state === 'bad' ? '✗ ' : ''}${esc(rec.msg || '')}</span>`;
    if (rec.state === 'bad' && rec.n >= 2 && rec.dir) s += ` <span class="muted">Your value is too ${rec.dir > 0 ? 'high' : 'low'}.</span>`;
    if (rec.state === 'bad' && rec.n >= 3 && q.hint) s += `<div class="hint"><b>Hint:</b> ${q.hint}</div>`;
    if ((rec.state === 'ok' || rec.n >= 3) && q.why) s += `<div class="why">${q.why}</div>`;
    return s;
  }

  function scoreOf(list, store) {
    const g = list.filter(gradeable);
    const ok = g.filter((q, i) => { const id = q.id || null; return id && store[id] && store[id].ok; }).length;
    return { ok, n: g.length };
  }
  // ensure every question has an id
  function ensureIds(lab) {
    (lab.prelab || []).forEach((q, i) => { if (!q.h && !q.id) q.id = 'p' + (i + 1); });
    (lab.questions || []).forEach((q, i) => { if (!q.h && !q.id) q.id = 'q' + (i + 1); });
  }

  // ---------------- pages ----------------
  const app = () => document.getElementById('app');
  const courseOf = id => CL.courses.find(c => c.id === id);
  const labsOf = cid => CL.labs.filter(l => l.course === cid).sort((a, b) => a.n - b.n);

  function labProgress(lab) {
    if (!CL.profile) return null;
    ensureIds(lab);
    const st = CL.loadState(lab.id);
    const a = scoreOf(lab.questions || [], st.ans), p = scoreOf(lab.prelab || [], st.prelab);
    const touched = st.log.length || Object.keys(st.ans).length || Object.keys(st.prelab).length;
    return { a, p, touched, data: st.log.length };
  }

  function header(crumbs) {
    const who = CL.profile ? `<button class="chip" id="whoami" title="Change student">${esc(CL.profile.name)}${CL.profile.section ? ' · ' + esc(CL.profile.section) : ''}</button>` : '';
    return `<header class="top"><div class="top-in"><a class="brand" href="#/"><span class="flask" aria-hidden="true"></span>Virtual Chem Labs</a>
      <nav class="crumbs" aria-label="Breadcrumb">${crumbs.map(c => c.href ? `<a href="${c.href}">${esc(c.l)}</a>` : `<span>${esc(c.l)}</span>`).join('<i>/</i>')}</nav>${who}</div></header>`;
  }
  function bindHeader() {
    const w = document.getElementById('whoami');
    if (w) w.addEventListener('click', () => { location.hash = '#/'; setTimeout(() => { const f = document.getElementById('pname'); if (f) f.focus(); }, 50); });
  }

  function profileForm() {
    const p = CL.profile || {};
    return `<form class="profile" id="profile" autocomplete="off">
      <div class="pf-row"><label>Your full name<input id="pname" required maxlength="60" value="${esc(p.name || '')}" placeholder="First Last"></label>
      <label>Class code<input id="psec" maxlength="30" value="${esc(p.section || '')}" placeholder="from your instructor, e.g. CHEM101-F26"></label>
      <button class="btn" type="submit">${CL.profile ? 'Update' : 'Start'}</button></div>
      <p class="small muted">Your name and class code generate your personal unknowns, so use them exactly the same way every time. Your work is saved in this browser.</p>
      ${CL.profile ? `<p class="small">Signed in as <b>${esc(p.name)}</b>${p.section ? ' — class code <b>' + esc(p.section) + '</b>' : ''}.</p>` : ''}
    </form>`;
  }

  function home() {
    document.title = 'Virtual Chem Labs';
    const total = CL.labs.length;
    app().innerHTML = header([]) + `<main class="wrap">
      <section class="hero"><p class="eyebrow">Online laboratory course pack</p><h1>Virtual Chemistry Labs</h1>
      <p class="lead">${total} complete online labs for General Chemistry I &amp; II, Organic Chemistry I &amp; II, Analytical, Biochemistry and Physical Chemistry. Each lab has background, a pre-lab, interactive instruments, a data notebook, auto-checked analysis and a printable report.</p>
      ${profileForm()}</section>
      <section class="courses">${CL.courses.map(c => {
        const ls = labsOf(c.id);
        return `<article class="course" style="--cc:${c.color}"><div class="course-h"><p class="eyebrow">${esc(c.code)}</p><h2><a href="#/course/${c.id}">${esc(c.title)}</a></h2><p class="small muted">${esc(c.blurb)}</p></div>
          <ol class="lablist">${ls.map(l => labItem(l)).join('')}</ol></article>`;
      }).join('')}</section>
      <footer class="foot"><a href="#/key">Instructor answer key</a> · <a href="#/about">How these labs work</a></footer></main>`;
    bindHeader();
    document.getElementById('profile').addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('pname').value.trim();
      if (!name) return;
      CL.profile = { name, section: document.getElementById('psec').value.trim() };
      LS.set('vcl:profile', CL.profile);
      CL.toast('Saved. Choose a lab to begin.');
      home();
    });
  }

  function labItem(l) {
    const pr = labProgress(l);
    let badge = '';
    if (pr && pr.touched) badge = `<span class="badge ${pr.a.ok === pr.a.n && pr.a.n ? 'done' : ''}">${pr.a.ok}/${pr.a.n}</span>`;
    return `<li><a href="#/lab/${l.id}"><span class="ln">${l.n}</span><span class="lt">${esc(l.title)}</span>${badge}</a></li>`;
  }

  function coursePage(cid) {
    const c = courseOf(cid); if (!c) return home();
    document.title = c.title + ' — Virtual Chem Labs';
    app().innerHTML = header([{ l: 'All courses', href: '#/' }, { l: c.title }]) + `<main class="wrap">
      <section class="hero slim" style="--cc:${c.color}"><p class="eyebrow">${esc(c.code)}</p><h1>${esc(c.title)}</h1><p class="lead">${esc(c.blurb)}</p></section>
      <section class="labcards">${labsOf(cid).map(l => {
        const pr = labProgress(l);
        return `<a class="labcard" href="#/lab/${l.id}" style="--cc:${c.color}"><span class="ln big">Lab ${l.n}</span><h3>${esc(l.title)}</h3>
        <p class="small muted">${esc((l.goals || [])[0] || '')}</p><p class="small"><span class="tagline">${esc(l.skills || '')}</span>${pr && pr.touched ? ` · <b>${pr.a.ok}/${pr.a.n}</b> analysis correct` : ''}</p></a>`;
      }).join('')}</section></main>`;
    bindHeader();
  }

  const TABS = [['overview', 'Overview'], ['prelab', 'Pre-lab'], ['experiment', 'Experiment'], ['data', 'Data'], ['analysis', 'Analysis'], ['report', 'Report']];

  function labPage(id, tab) {
    const lab = CL.byId[id]; if (!lab) return home();
    ensureIds(lab);
    const c = courseOf(lab.course);
    document.title = `${c.short} Lab ${lab.n}: ${lab.title}`;
    if (!CL.profile) {
      app().innerHTML = header([{ l: 'All courses', href: '#/' }, { l: c.title, href: '#/course/' + c.id }, { l: 'Lab ' + lab.n }]) +
        `<main class="wrap"><section class="hero slim"><h1>${esc(lab.title)}</h1><p class="lead">Enter your name and class code first — they generate your personal unknowns.</p>${profileForm()}</section></main>`;
      bindHeader();
      document.getElementById('profile').addEventListener('submit', e => {
        e.preventDefault(); const name = document.getElementById('pname').value.trim(); if (!name) return;
        CL.profile = { name, section: document.getElementById('psec').value.trim() }; LS.set('vcl:profile', CL.profile); labPage(id, tab);
      });
      return;
    }
    const ctx = makeCtx(lab);
    CL.current = ctx;
    const labs = labsOf(lab.course); const idx = labs.indexOf(lab);
    const prev = labs[idx - 1], next = labs[idx + 1];
    app().innerHTML = header([{ l: 'All courses', href: '#/' }, { l: c.title, href: '#/course/' + c.id }, { l: 'Lab ' + lab.n }]) + `<main class="wrap lab" style="--cc:${c.color}">
      <section class="labhead"><p class="eyebrow">${esc(c.short)} · Lab ${lab.n}${lab.time ? ' · ' + esc(lab.time) : ''}</p><h1>${esc(lab.title)}</h1></section>
      <nav class="tabs" role="tablist">${TABS.map(([k, l], i) => `<button role="tab" data-tab="${k}" aria-selected="${k === tab}"><span class="tn">${i + 1}</span>${l}<span class="tb" data-badge="${k}"></span></button>`).join('')}</nav>
      <div class="panes">${TABS.map(([k]) => `<section class="pane" data-pane="${k}" ${k === tab ? '' : 'hidden'}></section>`).join('')}</div>
      <nav class="pager">${prev ? `<a href="#/lab/${prev.id}">← Lab ${prev.n}: ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a href="#/lab/${next.id}">Lab ${next.n}: ${esc(next.title)} →</a>` : '<span></span>'}</nav>
    </main>`;
    bindHeader();
    const pane = k => CL.$(`[data-pane="${k}"]`);
    renderOverview(pane('overview'), ctx, c);
    renderPrelab(pane('prelab'), ctx);
    renderExperiment(pane('experiment'), ctx);
    renderAnalysis(pane('analysis'), ctx);
    const show = k => {
      CL.$$('.tabs [role=tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === k));
      CL.$$('.pane').forEach(p => { p.hidden = p.dataset.pane !== k; });
      if (k === 'data') renderData(pane('data'), ctx);
      if (k === 'report') renderReport(pane('report'), ctx, c);
      if (k === 'analysis') renderAnalysis(pane('analysis'), ctx);
      history.replaceState(null, '', `#/lab/${lab.id}/${k}`);
      updateBadges(ctx);
    };
    CL.$$('.tabs [role=tab]').forEach(b => b.addEventListener('click', () => { show(b.dataset.tab); CL.$('.tabs').scrollIntoView({ block: 'start', behavior: 'smooth' }); }));
    CL.$$('[data-goto]').forEach(b => b.addEventListener('click', () => show(b.dataset.goto)));
    ctx.onChange(() => updateBadges(ctx));
    show(TABS.some(t => t[0] === tab) ? tab : 'overview');
  }

  function updateBadges(ctx) {
    const set = (k, t) => { const b = CL.$(`[data-badge="${k}"]`); if (b) b.textContent = t; };
    const p = scoreOf(ctx.lab.prelab || [], ctx.st.prelab), a = scoreOf(ctx.lab.questions || [], ctx.st.ans);
    set('prelab', p.n ? `${p.ok}/${p.n}` : '');
    set('data', ctx.st.log.length ? String(ctx.st.log.length) : '');
    set('analysis', a.n ? `${a.ok}/${a.n}` : '');
  }

  function renderOverview(el, ctx, c) {
    const lab = ctx.lab;
    el.innerHTML = `<div class="cols"><div class="main">
      <h2>Objectives</h2><ul class="goals">${(lab.goals || []).map(g => `<li>${g}</li>`).join('')}</ul>
      <h2>Background</h2><div class="prose">${resolve(lab.intro, ctx.S)}</div></div>
      <aside class="side">
        ${lab.safety ? `<div class="card warnc"><h3>Safety in the real lab</h3><ul>${lab.safety.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
        ${lab.equipment ? `<div class="card"><h3>Equipment &amp; reagents</h3><ul>${lab.equipment.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
        <div class="card"><h3>Your workflow</h3><ol class="small"><li>Read the background.</li><li>Complete the pre-lab.</li><li>Run the experiment — every reading you record goes to your <b>Data</b> notebook.</li><li>Use your data to answer the <b>Analysis</b>.</li><li>Print or save your <b>Report</b> as PDF and submit it.</li></ol>
        <button class="btn" data-goto="prelab">Start pre-lab →</button></div>
      </aside></div>`;
  }

  function renderPrelab(el, ctx) {
    const lab = ctx.lab;
    el.innerHTML = `<h2>Pre-lab questions</h2><p class="muted">Answer before you start the experiment. Explanations appear once you answer correctly.</p><div class="qs"></div>
      <div class="next"><button class="btn" data-goto="experiment">Go to experiment →</button></div>`;
    renderQuestions(CL.$('.qs', el), lab.prelab || [], ctx, 'prelab');
    CL.$$('[data-goto]', el).forEach(b => b.addEventListener('click', () => CL.$(`[data-tab="${b.dataset.goto}"]`).click()));
  }

  function renderExperiment(el, ctx) {
    const lab = ctx.lab;
    el.innerHTML = (lab.parts || []).map((p, i) => `<article class="part">
      <h2>${esc(p.title)}</h2>
      ${p.steps ? `<details class="proc" open><summary>Procedure</summary><ol>${resolve(p.steps, ctx.S).map(s => `<li>${s}</li>`).join('')}</ol></details>` : ''}
      ${p.note ? `<div class="prose">${resolve(p.note, ctx.S)}</div>` : ''}
      <div class="simhost" data-part="${i}"></div></article>`).join('') +
      `<div class="next"><button class="btn" data-goto="data">Review my data →</button></div>`;
    (lab.parts || []).forEach((p, i) => {
      const host = CL.$(`[data-part="${i}"]`, el);
      const sim0 = resolve(p.sim, ctx.S); const sims = Array.isArray(sim0) ? sim0 : (sim0 ? [sim0] : []);
      sims.forEach((s, j) => {
        const cfg = resolve(s, ctx.S);
        const box = document.createElement('div');
        box.className = 'sim sim-' + cfg.type;
        host.appendChild(box);
        const fn = CL.sims[cfg.type];
        if (!fn) { box.textContent = 'Unknown instrument: ' + cfg.type; return; }
        try { fn(box, cfg, ctx, `${i}_${j}`); } catch (err) { console.error(err); box.innerHTML = `<p class="bad">Instrument failed to load: ${esc(err.message)}</p>`; }
      });
    });
    CL.$$('[data-goto]', el).forEach(b => b.addEventListener('click', () => CL.$(`[data-tab="${b.dataset.goto}"]`).click()));
  }

  function renderData(el, ctx) {
    const st = ctx.st;
    const rows = st.log.map((e, i) => `<tr><td>${esc(e.l)}</td><td class="num">${e.color ? `<span class="sw" style="background:${esc(e.color)}"></span>` : ''}${fmtValHTML(e)}</td><td><button class="link" data-del="${i}" aria-label="Delete ${esc(e.l)}">delete</button></td></tr>`).join('');
    const ser = Object.entries(st.series);
    el.innerHTML = `<h2>Data notebook</h2>
      <p class="muted">Every reading you record appears here. Delete a reading to re-measure it. Use these values in the Analysis.</p>
      ${st.log.length ? `<div class="tablewrap"><table class="data"><thead><tr><th>Measurement</th><th>Value</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="empty">No data recorded yet. Go to the Experiment tab.</p>'}
      ${ser.length ? `<h3>Recorded runs &amp; curves</h3><div class="runs">${ser.map(([k, s]) => `<figure class="run">${seriesSVG(s, 'd' + k)}<figcaption>${esc(s.l)} <button class="link" data-delser="${esc(k)}">delete</button> <button class="link" data-csv="${esc(k)}">download CSV</button></figcaption></figure>`).join('')}</div>` : ''}
      <h3>Observations &amp; notes</h3><textarea class="notes" rows="5" placeholder="Record qualitative observations, sources of error, anything unusual…">${esc(st.notes || '')}</textarea>`;
    CL.$$('[data-del]', el).forEach(b => b.addEventListener('click', () => { st.log.splice(+b.dataset.del, 1); ctx.save(); renderData(el, ctx); }));
    CL.$$('[data-delser]', el).forEach(b => b.addEventListener('click', () => { delete st.series[b.dataset.delser]; ctx.save(); renderData(el, ctx); }));
    CL.$$('[data-csv]', el).forEach(b => b.addEventListener('click', () => {
      const s = st.series[b.dataset.csv];
      const csv = `${s.xl || 'x'},${s.yl || 'y'}\n` + s.pts.map(p => p.join(',')).join('\n');
      download(`${ctx.lab.id}-${b.dataset.csv}.csv`, csv, 'text/csv');
    }));
    CL.$('.notes', el).addEventListener('input', e => { st.notes = e.target.value; clearTimeout(el._t); el._t = setTimeout(() => ctx.save(), 400); });
  }

  function seriesSVG(s, id) {
    const xs = s.pts.map(p => p[0]), ys = s.pts.map(p => p[1]);
    const P = CL.plot({ id, w: 520, h: 240, xr: s.xr || CL.extent(xs, 0.02), yr: s.yr || CL.extent(ys), xl: s.xl, yl: s.yl, xrev: s.xrev, series: [{ pts: s.pts, mode: s.mode || 'line' }] });
    return P.svg;
  }
  CL.seriesSVG = seriesSVG;

  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  CL.download = download;

  function renderAnalysis(el, ctx) {
    const lab = ctx.lab;
    el.innerHTML = `<h2>Analysis</h2><p class="muted">Use the values in your Data notebook. Numerical answers are checked against your own data with a small tolerance — carry extra digits until the end.</p>
      <details class="datapeek"><summary>Show my data (${ctx.st.log.length} readings)</summary><div class="peek"></div></details>
      <div class="qs"></div><div class="next"><button class="btn" data-goto="report">Build my report →</button></div>`;
    const peek = CL.$('.peek', el);
    peek.innerHTML = ctx.st.log.length ? `<table class="data compact"><tbody>${ctx.st.log.map(e => `<tr><td>${esc(e.l)}</td><td class="num">${fmtValHTML(e)}</td></tr>`).join('')}</tbody></table>` : '<p class="empty">No data yet.</p>';
    renderQuestions(CL.$('.qs', el), lab.questions || [], ctx, 'ans');
    CL.$$('[data-goto]', el).forEach(b => b.addEventListener('click', () => CL.$(`[data-tab="${b.dataset.goto}"]`).click()));
  }

  function answerText(q, rec, ctx) {
    if (!rec || rec.v == null || rec.v === '') return '<span class="muted">(no answer)</span>';
    if (q.choices) { const ch = resolve(q.choices, ctx.S); return ch[+rec.v] ?? esc(rec.v); }
    if (q.text) return esc(rec.v).replace(/\n/g, '<br>');
    return esc(rec.v) + (q.unit ? ' ' + esc(q.unit) : '');
  }

  function renderReport(el, ctx, c) {
    const lab = ctx.lab, st = ctx.st, p = CL.profile;
    const pre = scoreOf(lab.prelab || [], st.prelab), an = scoreOf(lab.questions || [], st.ans);
    const totalAtt = (lab.questions || []).reduce((s, q) => s + ((st.ans[q.id] || {}).n || 0), 0);
    const code = (CL.hash(CL.seedBase() + lab.id + pre.ok + an.ok + st.log.length) % 1e6).toString().padStart(6, '0');
    const qlist = list => { let n = 0; return list.map(q => { if (q.h) return `<h4>${q.h}</h4>`; n++; const rec = (q.id && (list === lab.prelab ? st.prelab : st.ans)[q.id]); const mark = q.text ? '' : rec && rec.ok ? '<span class="good">✓</span>' : rec && rec.n ? '<span class="bad">✗</span>' : '<span class="muted">–</span>'; return `<div class="rq"><div class="rqh"><b>${n}.</b> ${resolve(q.q, ctx.S, ctx.D)}</div><div class="rqa">${mark} ${answerText(q, rec, ctx)}${rec && rec.n ? ` <span class="muted small">(${rec.n} attempt${rec.n > 1 ? 's' : ''})</span>` : ''}</div></div>`; }).join(''); };
    const ser = Object.values(st.series);
    const plots = Object.values(st.plots).filter(pl => pl.fit);
    el.innerHTML = `<div class="report-actions"><button class="btn" id="printbtn">Print / Save as PDF</button><button class="btn ghost" id="dlbtn">Download report (.html)</button><button class="btn ghost danger" id="resetbtn">Reset this lab</button></div>
      <article class="report" id="report">
        <header class="rh"><div><p class="eyebrow">${esc(c.title)} · Lab ${lab.n}</p><h2>${esc(lab.title)}</h2></div>
        <table class="rmeta"><tr><th>Student</th><td>${esc(p.name)}</td></tr><tr><th>Class code</th><td>${esc(p.section || '—')}</td></tr><tr><th>Date</th><td>${new Date().toLocaleDateString()}</td></tr><tr><th>Pre-lab</th><td>${pre.ok}/${pre.n} correct</td></tr><tr><th>Analysis</th><td>${an.ok}/${an.n} auto-checked correct (${totalAtt} attempts)</td></tr><tr><th>Verification</th><td><code>${code}</code></td></tr></table></header>
        <section><h3>Objectives</h3><ul>${(lab.goals || []).map(g => `<li>${g}</li>`).join('')}</ul></section>
        <section><h3>Data</h3>${st.log.length ? `<table class="data compact"><thead><tr><th>Measurement</th><th>Value</th></tr></thead><tbody>${st.log.map(e => `<tr><td>${esc(e.l)}</td><td class="num">${e.color ? `<span class="sw" style="background:${esc(e.color)}"></span>` : ''}${fmtValHTML(e)}</td></tr>`).join('')}</tbody></table>` : '<p class="empty">No data recorded.</p>'}
        ${ser.length ? `<div class="runs">${ser.map((s, i) => `<figure class="run">${seriesSVG(s, 'r' + i)}<figcaption>${esc(s.l)}</figcaption></figure>`).join('')}</div>` : ''}
        ${plots.length ? `<div class="runs">${plots.map((pl, i) => `<figure class="run">${CL.fitSVG ? CL.fitSVG(pl, 'rp' + i) : ''}<figcaption>${esc(pl.title || 'Graph')}: y = ${CL.sig(pl.fit.m, 4)} x ${pl.fit.b >= 0 ? '+' : '−'} ${CL.sig(Math.abs(pl.fit.b), 4)}, R² = ${pl.fit.r2.toFixed(4)}</figcaption></figure>`).join('')}</div>` : ''}
        ${st.notes ? `<h4>Observations</h4><p>${esc(st.notes).replace(/\n/g, '<br>')}</p>` : ''}</section>
        ${Object.keys(st.synth).length ? `<section><h3>Synthesis record</h3>${Object.values(st.synth).map(s => `<p><b>${esc(s.title)}</b> — attempt ${s.attempts}: ${esc(s.summary)}</p>`).join('')}</section>` : ''}
        <section><h3>Pre-lab</h3>${qlist(lab.prelab || [])}</section>
        <section><h3>Analysis &amp; conclusions</h3>${qlist(lab.questions || [])}</section>
      </article>`;
    CL.$('#printbtn', el).addEventListener('click', () => window.print());
    CL.$('#dlbtn', el).addEventListener('click', () => {
      const css = Array.from(document.styleSheets).map(ss => { try { return Array.from(ss.cssRules).map(r => r.cssText).join('\n'); } catch (e) { return ''; } }).join('\n');
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(lab.title)} — ${esc(p.name)}</title><style>${css}</style></head><body class="printdoc"><main class="wrap">${CL.$('#report').outerHTML}</main></body></html>`;
      download(`${lab.id}-${normName(p.name).replace(/\s/g, '-')}-report.html`, html, 'text/html');
    });
    CL.$('#resetbtn', el).addEventListener('click', () => {
      if (!confirm('Erase all of your data and answers for this lab? This cannot be undone.')) return;
      LS.del(stateKey(lab.id)); labPage(lab.id, 'overview');
    });
  }

  // ---------------- instructor key ----------------
  function keyPage() {
    document.title = 'Instructor answer key — Virtual Chem Labs';
    const saved = LS.get('vcl:keyq') || {};
    app().innerHTML = header([{ l: 'All courses', href: '#/' }, { l: 'Instructor key' }]) + `<main class="wrap">
      <section class="hero slim"><h1>Instructor answer key</h1><p class="lead">Every student's unknowns are generated from their <b>class code + name</b>. Enter them exactly as the student did to see that student's unknowns and the expected answers.</p>
      <form class="profile" id="keyf"><div class="pf-row"><label>Student name<input id="kname" required value="${esc(saved.name || '')}"></label><label>Class code<input id="ksec" value="${esc(saved.section || '')}"></label>
      <label>Course<select id="kcourse"><option value="">All courses</option>${CL.courses.map(c => `<option value="${c.id}" ${saved.course === c.id ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}</select></label><button class="btn">Show key</button></div>
      <p class="small muted">Open a lab to see this student's unknowns, the pre-lab key, and expected analysis results.</p></form></section>
      <section id="keyout"></section></main>`;
    bindHeader();
    const unitOf = q => (q.unit ? ' ' + esc(q.unit) : '');
    const qtext = (q, S) => { const t = String(resolve(q.q, S, () => NaN) || '').replace(/<[^>]+>/g, ''); return esc(t.length > 90 ? t.slice(0, 88) + '…' : t); };
    const ansList = (lab, S, D, sim) => (lab.questions || []).filter(q => !q.h).map(q => {
      let a;
      try {
        if (q.text) a = '<span class="muted">free response — instructor graded</span>';
        else if (q.choices) { const ch = resolve(q.choices, S); const ai = resolve(q.ans, S, D); a = '<b>' + (Array.isArray(ai) ? ai : [ai]).map(i => ch[i]).join(' / ') + '</b>'; }
        else {
          const v = resolve(q.ans, S, D);
          const tv = q.truth != null ? resolve(q.truth, S, D) : NaN;
          if (isFinite(v)) a = (sim ? '≈ ' : '') + '<b>' + CL.sig(v, 4) + '</b>' + unitOf(q) + (isFinite(tv) && Math.abs(tv - v) > 1e-9 * Math.abs(tv) ? ` <span class="muted">(true value ${CL.sig(tv, 4)})</span>` : '');
          else if (isFinite(tv)) a = '≈ <b>' + CL.sig(tv, 4) + '</b>' + unitOf(q) + ' <span class="muted">(true value)</span>';
          else a = '<span class="muted">from student data</span>';
        }
      } catch (err) { a = '<span class="muted">from student data</span>'; }
      return `<li><span class="kq">${qtext(q, S)}</span><br>${a}</li>`;
    }).join('');
    // Run every instrument of a lab off-screen like a careful student, to produce typical data.
    async function simulate(lab, S) {
      const st = blankState();
      const ctx = makeCtx(lab, { S, st, quiet: true });
      const host = document.createElement('div');
      host.style.cssText = 'position:absolute;left:-10000px;top:0;width:1000px;visibility:hidden';
      document.body.appendChild(host);
      CL.quiet = true;
      try {
        const boxes = [];
        (lab.parts || []).forEach((p, i) => { (sl => Array.isArray(sl) ? sl : sl ? [sl] : [])(resolve(p.sim, S)).forEach((sm, j) => { const cfg = resolve(sm, S); const box = document.createElement('div'); host.appendChild(box); if (CL.sims[cfg.type]) { CL.sims[cfg.type](box, cfg, ctx, `k${i}_${j}`); boxes.push(box); } }); });
        for (const b of boxes) if (b.__auto) await b.__auto();
      } finally { CL.quiet = false; document.body.removeChild(host); }
      return ctx.D;
    }
    const go = e => {
      if (e) e.preventDefault();
      const prof = { name: CL.$('#kname').value, section: CL.$('#ksec').value };
      const course = CL.$('#kcourse').value;
      LS.set('vcl:keyq', Object.assign({ course }, prof));
      if (!prof.name.trim()) return;
      const out = CL.$('#keyout');
      const emptyD = makeD(blankState());
      out.innerHTML = CL.courses.filter(c => !course || c.id === course).map(c => `<h2 class="keyc">${esc(c.title)}</h2>` + labsOf(c.id).map(lab => {
        ensureIds(lab);
        const S = CL.labSetup(lab, prof);
        const keyRows = lab.key ? lab.key(S) : [];
        const ps = (lab.prelab || []).filter(q => !q.h).map(q => { let a; if (q.choices) { const ch = resolve(q.choices, S); a = ch[resolve(q.ans, S)]; } else { const v = resolve(q.ans, S, emptyD); a = isFinite(v) ? CL.sig(v, 4) + unitOf(q) : '—'; } return `<li><span class="kq">${qtext(q, S)}</span><br><b>${a}</b></li>`; }).join('');
        return `<details class="keylab" data-lab="${lab.id}"><summary><b>Lab ${lab.n}:</b> ${esc(lab.title)}</summary><div class="keyin">
          ${keyRows.length ? `<h4>This student's unknowns</h4><table class="data compact"><tbody>${keyRows.map(r => `<tr><th>${esc(r[0])}</th><td>${r[1]}</td></tr>`).join('')}</tbody></table>` : ''}
          <div class="keycols"><div><h4>Pre-lab</h4><ol>${ps}</ol></div><div><h4>Analysis</h4><p class="small muted" data-note>Simulating a careful run of this lab…</p><ol data-ans>${ansList(lab, S, emptyD, false)}</ol></div></div></div></details>`;
      }).join('')).join('');
      CL.$$('details.keylab', out).forEach(det => det.addEventListener('toggle', async () => {
        if (!det.open || det.dataset.done) return;
        det.dataset.done = '1';
        const lab = CL.byId[det.dataset.lab], S = CL.labSetup(lab, prof);
        try {
          const D = await simulate(lab, S);
          CL.$('[data-ans]', det).innerHTML = ansList(lab, S, D, true);
          CL.$('[data-note]', det).textContent = 'Values marked ≈ come from a simulated careful run with realistic noise. Students are graded against their own recorded data, so their numbers will differ slightly.';
        } catch (err) { console.error(err); CL.$('[data-note]', det).textContent = 'Could not simulate this lab: ' + err.message; }
      }));
    };
    CL.$('#keyf').addEventListener('submit', go);
    if (saved.name) go();
  }

  function aboutPage() {
    document.title = 'How these labs work — Virtual Chem Labs';
    app().innerHTML = header([{ l: 'All courses', href: '#/' }, { l: 'About' }]) + `<main class="wrap"><section class="hero slim"><h1>How these labs work</h1></section>
      <div class="prose narrow">
      <h3>For students</h3><ol><li>Enter your full name and the class code your instructor gave you. Use exactly the same spelling every time — your unknowns depend on it.</li>
      <li>Open a lab. Read the <b>Overview</b>, answer the <b>Pre-lab</b>, then do the <b>Experiment</b>. Every time you press a Record/Measure button the reading is saved to your <b>Data</b> notebook.</li>
      <li>In <b>Analysis</b>, calculate results from <i>your</i> data. Press <b>Check</b> to see whether you are within tolerance. Attempts are counted on your report.</li>
      <li>Open <b>Report</b> and choose <b>Print / Save as PDF</b> to submit.</li></ol>
      <p>Your work is stored in this browser only. If you switch computers, download your report first.</p>
      <h3>For instructors</h3><ul><li>Pick a class code for each section (for example <code>CHEM101-F26-02</code>) and give it to students. Changing the code each term gives every student new unknowns.</li>
      <li>The <a href="#/key">answer key</a> shows each student's unknowns and expected results. It is not password-protected, so don't share its link with students.</li>
      <li>Each report shows auto-checked results, attempt counts and a verification code, and leaves the free-response conclusions for you to grade.</li>
      <li>Measurements include realistic random noise, so two students with the same unknown still report slightly different data.</li></ul></div></main>`;
    bindHeader();
  }

  function route() {
    const tst = document.getElementById('toast'); if (tst) tst.classList.toggle('show', false);
    const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
    if (!parts.length) home();
    else if (parts[0] === 'course') coursePage(parts[1]);
    else if (parts[0] === 'lab') labPage(parts[1], parts[2] || 'overview');
    else if (parts[0] === 'key') keyPage();
    else if (parts[0] === 'about') aboutPage();
    else home();
    if (!parts[2]) window.scrollTo(0, 0);
  }
  CL.start = function () {
    window.addEventListener('hashchange', () => {
      // tab changes inside a lab use replaceState, so hashchange means real navigation
      route();
    });
    route();
  };
})();
