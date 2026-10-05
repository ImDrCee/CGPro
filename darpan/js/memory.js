/* Institutional memory + correlation engine (MEM / COR). Pure functions over the current item list.
   Every output states its type, evidence count, time span and confidence, and uses non-causal wording. */
(function (g) {
  const CGP = g.CGP, R = CGP.ref, U = CGP.U, ST = CGP.store, L = CGP.live;
  const DAY = 86400000, HR = 3600000;
  const M = (CGP.M = {});
  const med = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const sum = a => a.reduce((x, y) => x + y, 0);
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  U.dstr = ts => { const d = new Date(ts); return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); };
  U.mstr = ts => { const d = new Date(ts); return MON[d.getMonth()] + ' ' + d.getFullYear(); };
  U.ord = n => n + (['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10 < 4 ? n % 10 : 0]);
  U.hrs = h => (h < 36 ? Math.max(1, Math.round(h)) + ' h' : Math.round(h / 24) + ' days');
  const isGov = i => i.speakerType === 'govt' || i.speakerType === 'bjp';
  const conf = (n, yrs) => (n >= 6 || (yrs >= 2 && n >= 3) ? 'high' : n >= 3 ? 'medium' : n >= 2 ? 'low' : 'thin');
  M.conf = conf;

  M.corr = (type, text, o) => Object.assign({ id: type + ':' + text.length + ':' + text.charCodeAt(2) + text.charCodeAt(text.length >> 1), type, text, n: 0, span: null, conf: 'thin', ids: [] }, o);

  // ───── episodes (issue memory) ─────
  function stats(items, issue) {
    const first = items[0], last = items[items.length - 1];
    const days = {}, dists = {}, chFirst = {}, spk = {};
    let neg = 0, pos = 0;
    items.forEach(i => {
      const d = Math.floor(i.ts / DAY); days[d] = (days[d] || 0) + 1;
      if (i.district) dists[i.district] = (dists[i.district] || 0) + 1;
      if (chFirst[i.channel] == null) chFirst[i.channel] = i.ts;
      spk[i.speakerType] = (spk[i.speakerType] || 0) + 1;
      if (i.stance < 0) neg++; else if (i.stance > 0) pos++;
    });
    let peakDay = 0, peak = 0;
    Object.keys(days).forEach(d => { if (days[d] > peak) { peak = days[d]; peakDay = +d; } });
    return { id: 'E' + first.id, issue, topic: first.topic, start: first.ts, end: last.ts, n: items.length, days: Math.max(1, Math.round((last.ts - first.ts) / DAY) + 1), peak, peakDay: peakDay * DAY,
      dists, chFirst, c48: items.filter(i => i.ts - first.ts <= 2 * DAY).length, first: { id: first.id, channel: first.channel, source: first.source, speaker: first.speaker },
      neg, pos, pol: neg > pos ? -1 : pos > neg ? 1 : 0, spk, ids: items.map(i => i.id), active: false, resp: null };
  }
  // Episodes are runs of unusually busy days for an issue, not any cluster of items.
  // A day is busy when it has at least T items; T scales with the issue's own average.
  function episodesOf(arr, issue, o) {
    o = o || {};
    if (!arr.length) return [];
    const byDay = {}; arr.forEach(it => { const d = Math.floor(it.ts / DAY); (byDay[d] = byDay[d] || []).push(it); });
    const span = Math.max(30, (arr[arr.length - 1].ts - arr[0].ts) / DAY), mean = arr.length / span;
    const T = o.T || Math.max(2, Math.ceil(mean * 2.2)), bridge = (o.bridge || 3) + 1;
    const days = Object.keys(byDay).map(Number).sort((x, y) => x - y), groups = []; let cur = null;
    days.forEach(d => { if (byDay[d].length < T) return; if (cur && d - cur.last <= bridge) { cur.days.push(d); cur.last = d; } else { cur = { days: [d], last: d }; groups.push(cur); } });
    return groups.map(gp => {
      const lo = gp.days[0], hi = gp.last, its = []; for (let d = lo; d <= hi; d++) if (byDay[d]) its.push.apply(its, byDay[d]);
      return { its, nd: gp.days.length };
    }).filter(x => x.its.length >= (o.minN || 4) && x.nd >= (o.minDays || 2)).map(x => stats(x.its, issue));
  }
  M.build = function (items) {
    const now = Date.now();
    const S = (M.S = { items, now, dmin: items.reduce((m, i) => Math.min(m, i.ts), now) });
    S.byIssue = {};
    items.forEach(i => { if (i.issue) (S.byIssue[i.issue] = S.byIssue[i.issue] || []).push(i); });
    Object.keys(S.byIssue).forEach(k => S.byIssue[k].sort((a, b) => a.ts - b.ts));
    S.gov = {};
    items.filter(i => isGov(i) && i.stance >= 0).sort((a, b) => a.ts - b.ts).forEach(i => (S.gov[i.topic] = S.gov[i.topic] || []).push(i));
    S.episodes = [];
    const broad = k => !!(S.byIssue[k][0] || {}).generic;
    Object.keys(S.byIssue).forEach(k => {
      if (broad(k)) return;
      episodesOf(S.byIssue[k], k).forEach(e => {
        e.active = now - e.end < 3 * DAY;
        if (e.pol < 0) { const g1 = (S.gov[e.topic] || []).find(x => x.ts >= e.start && x.ts <= e.end + 3 * DAY); if (g1) e.resp = { ts: g1.ts, lag: (g1.ts - e.start) / HR, id: g1.id, speaker: g1.speaker }; }
        S.episodes.push(e);
      });
    });
    S.episodes.sort((a, b) => a.start - b.start);
    S.fam = []; // recurrence families, statewide
    const byI = {}; S.episodes.forEach(e => { if (e.pol <= 0) (byI[e.issue] = byI[e.issue] || []).push(e); });
    Object.keys(byI).forEach(k => {
      const a = byI[k]; if (a.length < 2) return;
      const iv = []; for (let i = 1; i < a.length; i++) iv.push((a[i].start - a[i - 1].start) / DAY);
      S.fam.push({ issue: k, topic: a[0].topic, eps: a, count: a.length, meanInterval: sum(iv) / iv.length, last: a[a.length - 1], active: a[a.length - 1].active });
    });
    S.fam.sort((x, y) => y.count - x.count || y.last.start - x.last.start);
    S.famD = []; // recurrence families by place
    // place-level recurrence: districts that were part of at least two episodes of the same issue
    S.fam.forEach(f => {
      const dd = {}; f.eps.forEach(e => Object.keys(e.dists).forEach(d => { if (e.dists[d] >= 2) (dd[d] = dd[d] || []).push(e); }));
      Object.keys(dd).forEach(d => { const eps = dd[d]; if (eps.length < 2) return; const iv = []; for (let i = 1; i < eps.length; i++) iv.push((eps[i].start - eps[i - 1].start) / DAY); S.famD.push({ issue: f.issue, district: d, topic: f.topic, eps, count: eps.length, meanInterval: sum(iv) / iv.length, last: eps[eps.length - 1] }); });
    });    S.famD.sort((x, y) => y.count - x.count || y.last.start - x.last.start);
    M._c = {};
    return S;
  };
  const memo = (k, f) => () => { const c = M._c; if (!(k in c)) c[k] = f(); return c[k]; };

  // ───── precedents + history line (UC-MC01, MC40) ─────
  M.precedents = function (issue, district, k) {
    const S = M.S; k = k || 3;
    const topic = ((S.byIssue[issue] || [])[0] || {}).topic;
    return S.episodes.filter(e => !e.active && e.pol <= 0 && (e.issue === issue || (topic && e.topic === topic && e.pol < 0))).map(e => {
      let sc = e.issue === issue ? 3 : 1;
      if (district && (e.dists[district] || 0) >= 2) sc += 1.5;
      sc += Math.max(0, 1 - (M.S.now - e.end) / (730 * DAY));
      return { e, sc };
    }).sort((a, b) => b.sc - a.sc).slice(0, k).map(x => x.e);
  };
  M.lifecycle = e => `${U.mstr(e.start)}: ${e.days} day${e.days > 1 ? 's' : ''}, ${e.n} items, peak ${e.peak}/day` + (e.resp ? `, first official voice in coverage after ${U.hrs(e.resp.lag)}` : e.pol < 0 ? ', no official voice visible in coverage' : '');

  M.historyLine = function (issue, district) {
    const S = M.S;
    const eps = S.episodes.filter(e => e.issue === issue);
    const closed = eps.filter(e => !e.active), act = eps.filter(e => e.active)[0];
    if (!closed.length) return { kind: 'none', text: `No earlier episode of this issue in the archive (archive starts ${U.dstr(S.dmin)}).`, n: 0, conf: 'thin', ids: [], span: [S.dmin, S.now] };
    const last = closed[closed.length - 1];
    const months = Math.max(1, Math.round((S.now - closed[0].start) / (30 * DAY)));
    const act1 = M.actionFor(last);
    let t = `${U.ord(closed.length + 1)} episode in ${months} months. Last time (${M.lifecycle(last)})`;
    if (act1 && act1.effect && act1.effect.reliable) t += `; after "${act1.type}" coverage was ${act1.effect.pct <= 0 ? 'down ' + Math.abs(act1.effect.pct) : 'up ' + act1.effect.pct}% over 72 h`;
    t += '.';
    const sameSeason = closed.filter(e => Math.abs(new Date(e.start).getMonth() - new Date(S.now).getMonth()) <= 1).length;
    if (sameSeason >= 2) t += ` ${sameSeason} of ${closed.length} earlier episodes began in this season.`;
    return { kind: 'recurrence', text: t, n: closed.length + (act ? 1 : 0), conf: conf(closed.length, 1), ids: last.ids.slice(0, 5), span: [closed[0].start, S.now], eps: closed };
  };

  // ───── actions → outcomes (UC-MC15, MC16) ─────
  M.actions = function () {
    const s = CGP.mode === 'live' ? [] : (CGP.sampleActions || []);
    return s.concat(ST.actions.all()).map(a => Object.assign({}, a, { effect: M.effect(a) })).sort((a, b) => b.ts - a.ts);
  };
  M.effect = function (a, win) {
    win = (win || 3) * DAY;
    const S = M.S, arr = a.issue ? (S.byIssue[a.issue] || []) : S.items.filter(i => i.topic === a.topic);
    const f = i => !a.district || i.district === a.district || a.scope === 'state';
    const wide = a.issue && a.district ? arr.filter(i => f(i) || true) : arr;
    const before = wide.filter(i => i.ts >= a.ts - win && i.ts < a.ts).length, after = wide.filter(i => i.ts >= a.ts && i.ts < a.ts + win).length;
    const ready = a.ts + win <= S.now;
    return { before, after, pct: before ? Math.round((100 * (after - before)) / before) : null, reliable: before >= 5 && ready, ready };
  };
  M.actionFor = e => M.actions().find(a => (a.issue === e.issue) && Math.abs(a.ts - e.start) < 5 * DAY);
  M.playbook = function (issue, topic) {
    const done = M.actions().filter(a => a.effect.reliable && (a.issue === issue || a.topic === topic));
    if (!done.length) return null;
    const by = {}; done.forEach(a => (by[a.type] = by[a.type] || []).push(a.effect.pct));
    const rows = Object.keys(by).map(k => ({ type: k, n: by[k].length, avg: Math.round(sum(by[k]) / by[k].length) })).sort((a, b) => a.avg - b.avg);
    return { rows, n: done.length, text: `In ${done.length} logged response${done.length > 1 ? 's' : ''} on similar issues, "${rows[0].type}" was followed by the largest fall in coverage (avg ${rows[0].avg}% over 72 h, ${rows[0].n} case${rows[0].n > 1 ? 's' : ''}). Association only; sample sizes are small.`, ids: [] };
  };

  // ───── seasonal outlook (UC-MC03) ─────
  M.HORIZON = 42;
  M.outlook = function (days) {
    days = days || M.HORIZON;
    const S = M.S, now = S.now, res = [];
    Object.keys(S.byIssue).forEach(issue => {
      const arr = S.byIssue[issue]; if (arr.length < 8 || arr[0].broad) return;
      if (arr.filter(i => i.stance > 0).length / arr.length >= 0.5) return;
      const span = Math.max(30, (now - S.dmin) / DAY), base = (arr.length / span) * days;
      const hist = [];
      for (let y = 1; y <= 3; y++) { const a = now - y * 365 * DAY, b = a + days * DAY, cov = (b - Math.max(a, S.dmin)) / (b - a); if (cov < 0.6) break; hist.push(Math.round(arr.filter(i => i.ts >= a && i.ts < b).length / cov)); }
      if (!hist.length) return;
      const avg = sum(hist) / hist.length, lift = avg / Math.max(base, 0.5);
      if (lift >= 1.25 && avg >= 3) res.push({ issue, topic: arr[0].topic, lift, avg, base, yrs: hist.length, hist, conf: conf(Math.round(avg), hist.length), eps: S.episodes.filter(e => e.issue === issue && [1, 2, 3].some(y => e.start >= now - y * 365 * DAY && e.start < now - y * 365 * DAY + days * DAY)) });
    });
    return res.sort((a, b) => b.lift * Math.log(2 + b.avg) - a.lift * Math.log(2 + a.avg));
  };
  M.calendarNow = function (days) {
    const now = new Date(), end = new Date(now.getTime() + (days || M.HORIZON) * DAY);
    return R.calendar.filter(c => {
      const y = now.getFullYear();
      for (const yy of [y - 1, y, y + 1]) {
        const a = new Date(yy, c.from[0] - 1, c.from[1]), b = new Date(c.to[0] < c.from[0] ? yy + 1 : yy, c.to[0] - 1, c.to[1], 23, 59);
        if (a <= end && b >= now) return true;
      }
      return false;
    });
  };

  // ───── correlations ─────
  // Entity over-representation (common factor, UC-MC19)
  M.commonFactors = memo('cf', function () {
    const S = M.S, neg = S.items.filter(i => i.stance < 0 && i.entities.length), N = neg.length, out = [];
    if (N < 30) return out;
    const all = {}; neg.forEach(i => new Set(i.entities).forEach(e => (all[e] = (all[e] || 0) + 1)));
    Object.keys(S.byIssue).forEach(issue => {
      const a = S.byIssue[issue].filter(i => i.stance < 0); if (a.length < 8 || a[0].broad) return;
      const c = {}; a.forEach(i => new Set(i.entities).forEach(e => { if (e !== R.cm) c[e] = (c[e] || 0) + 1; }));
      Object.keys(c).forEach(e => {
        const share = c[e] / a.length, base = (all[e] || 1) / N, lift = share / base;
        if (c[e] >= 4 && lift >= 1.8 && share >= 0.12) {
          const ids = a.filter(i => i.entities.indexOf(e) >= 0).sort((x, y) => y.ts - x.ts);
          out.push(M.corr('common-factor', `"${e}" appears in ${Math.round(share * 100)}% of critical items on "${issue}" vs ${Math.round(base * 100)}% of all critical items with a named entity (${lift.toFixed(1)}×). Associated in coverage, not shown to be a cause.`,
            { n: c[e], span: [ids[ids.length - 1].ts, ids[0].ts], conf: conf(c[e], 1) === 'thin' ? 'low' : conf(c[e], 1), ids: ids.slice(0, 6).map(x => x.id), entity: e, issue, lift, districts: Object.keys(ids.reduce((m, x) => ((m[x.district] = 1), m), {})).filter(Boolean) }));
        }
      });
    });
    return out.sort((a, b) => b.lift * Math.log(1 + b.n) - a.lift * Math.log(1 + a.n)).slice(0, 10);
  });

  // Linked-issue chains (UC-MC20)
  M.chains = memo('ch', function () {
    const eps = M.S.episodes.filter(e => e.pol < 0), pairs = {}, nA = {};
    const dset = e => Object.keys(e.dists).filter(d => e.dists[d] >= 2);
    eps.forEach(a => {
      nA[a.issue] = (nA[a.issue] || 0) + 1;
      const da = dset(a); const seen = {};
      eps.forEach(b => {
        if (b.issue === a.issue || b.start < a.start || b.start - a.start > 3 * DAY || seen[b.issue]) return;
        if (!dset(b).some(d => da.indexOf(d) >= 0)) return;
        seen[b.issue] = 1; const k = a.issue + '>' + b.issue; (pairs[k] = pairs[k] || []).push([a, b]);
      });
    });
    return Object.keys(pairs).map(k => {
      const [A, B] = k.split('>'), n = pairs[k].length, p = n / nA[A];
      return M.corr('chain', `"${B}" began within 72 h of "${A}" in the same district in ${n} of ${nA[A]} episodes (${Math.round(p * 100)}%). Sequence in coverage only.`,
        { n, span: [pairs[k][0][0].start, pairs[k][n - 1][1].start], conf: conf(n, 1), A, B, p, ids: pairs[k].slice(-2).flatMap(x => [x[0].ids[0], x[1].ids[0]]) });
    }).filter(c => c.n >= 2 && c.p >= 0.4 && c.n >= 0.4 * 0).sort((a, b) => b.n * b.p - a.n * a.p).slice(0, 8);
  });

  // Lead-lag and source first-mover (UC-MC26, MC29)
  M.leadLag = memo('ll', function () {
    const eps = M.S.episodes.filter(e => e.n >= 5 && Object.keys(e.chFirst).length >= 2);
    const by = {}, first = {}, tot = eps.length;
    eps.forEach(e => {
      Object.keys(e.chFirst).forEach(c => { (by[c] = by[c] || []).push((e.chFirst[c] - e.start) / HR); });
      const k = e.first.source; first[k] = (first[k] || 0) + 1;
    });
    const rows = Object.keys(by).map(c => ({ channel: c, n: by[c].length, med: med(by[c]), shareFirst: by[c].filter(x => x === 0).length / tot })).sort((a, b) => a.med - b.med);
    const srcs = Object.keys(first).map(s => ({ source: s, n: first[s], share: first[s] / tot })).sort((a, b) => b.n - a.n).slice(0, 8);
    return { rows, srcs, episodes: tot, conf: conf(tot, 1) };
  });

  // Systemic vs local (UC-MC21)
  M.systemic = memo('sys', function () {
    const S = M.S, out = [], today = Math.floor(S.now / DAY);
    Object.keys(S.byIssue).forEach(issue => {
      const a = S.byIssue[issue].filter(i => i.stance < 0 && i.district); if (a.length < 10 || a[0].broad) return;
      const byDay = {}; a.forEach(i => { const d = Math.floor(i.ts / DAY); (byDay[d] = byDay[d] || new Set()).add(i.district); });
      const days = Object.keys(byDay).map(Number).sort((x, y) => x - y);
      const win = d => { const s = new Set(); for (let k = 0; k < 3; k++) (byDay[d - k] || []).forEach(x => s.add(x)); return s.size; };
      const cur = win(today), curIds = a.filter(i => today - Math.floor(i.ts / DAY) < 3);
      let mx = 0; days.forEach(d => { if (today - d >= 3) mx = Math.max(mx, win(d)); });
      if (cur >= 3 && cur > mx) out.push(M.corr('systemic', `"${issue}" appears in ${cur} districts in the last 3 days; the previous maximum in the archive was ${mx}. Pattern is wider than any earlier episode.`, { n: cur, span: [S.dmin, S.now], conf: conf(days.length, 1), issue, cur, mx, ids: curIds.slice(-6).map(x => x.id) }));
    });
    return out.sort((a, b) => b.cur - a.cur);
  });
  M.spread = memo('spr', function () {
    const S = M.S, out = [];
    Object.keys(S.byIssue).forEach(issue => {
      const a = S.byIssue[issue].filter(i => i.stance < 0 && i.district);
      const now7 = new Set(a.filter(i => S.now - i.ts < 7 * DAY).map(i => i.district)), prev7 = new Set(a.filter(i => S.now - i.ts >= 7 * DAY && S.now - i.ts < 14 * DAY).map(i => i.district));
      if (now7.size - prev7.size >= 2 && now7.size >= 3) out.push({ issue, now: now7.size, prev: prev7.size, dists: [...now7] });
    });
    return out.sort((a, b) => b.now - b.prev - (a.now - a.prev));
  });

  // Analogue escalation (UC-MC28): early trajectory vs past episodes. Not a forecast.
  M.analogues = memo('an', function () {
    const S = M.S, out = [];
    S.episodes.filter(e => e.active && e.pol < 0 && e.n >= 3).forEach(e => {
      const cands = S.episodes.filter(x => !x.active && x.pol < 0 && x.topic === e.topic && x.id !== e.id && Math.abs(Math.log((x.c48 + 1) / (e.c48 + 1))) < 0.7);
      const same = cands.filter(x => x.issue === e.issue), use = (same.length >= 2 ? same : cands).slice(-8);
      const esc = use.filter(x => x.n >= 3 * Math.max(1, x.c48)).length;
      out.push(M.corr('analogue', use.length < 2 ? `Early pattern of "${e.issue}" has too few comparable past episodes (${use.length}) for a precedent read.`
        : `Early pattern of "${e.issue}" resembles ${use.length} past episode${use.length > 1 ? 's' : ''}; ${esc} grew to at least 3× their first-48-hour volume. Median duration ${Math.round(med(use.map(x => x.days)))} days. Precedent, not a forecast.`,
        { n: use.length, span: use.length ? [use[0].start, use[use.length - 1].end] : null, conf: use.length >= 5 ? 'medium' : use.length >= 2 ? 'low' : 'thin', issue: e.issue, esc, cur: e, eps: use, ids: e.ids.slice(-4) }));
    });
    return out;
  });

  // Resurfacing of old content (UC-MC13): recent items whose title nearly matches one older than 90 days
  M.resurfacing = memo('rs', function () {
    const S = M.S, cut = S.now - 90 * DAY, idx = new Map(), out = [];
    const old = S.items.filter(i => i.ts < cut); if (!old.length) return out;
    const tk = new Map();
    old.forEach(i => { const t = L.tok(i.headline); tk.set(i.id, t); t.forEach(w => { let l = idx.get(w); if (!l) idx.set(w, (l = [])); if (l.length < 400) l.push(i); }); });
    S.items.filter(i => S.now - i.ts < 14 * DAY).forEach(r => {
      const t = L.tok(r.headline); if (t.length < 4) return;
      const cand = new Map(); t.forEach(w => (idx.get(w) || []).forEach(o => cand.set(o, (cand.get(o) || 0) + 1)));
      let best = null, bj = 0; cand.forEach((c, o) => { if (c >= 3) { const j = L.jac(t, tk.get(o.id)); if (j > bj) { bj = j; best = o; } } });
      if (best && bj >= 0.7) out.push({ recent: r, original: best, sim: bj });
    });
    return out.sort((a, b) => b.recent.ts - a.recent.ts).slice(0, 10);
  });

  // Coordinated pattern: identical text from many distinct social accounts in a short window (UC-MC27)
  M.coordinated = memo('co', function () {
    const m = {};
    M.S.items.filter(i => ['X', 'Facebook', 'Instagram'].indexOf(i.channel) >= 0 && i.speakerType === 'citizen').forEach(i => { const k = L.tok(i.headline).join(' '); if (k) (m[k] = m[k] || []).push(i); });
    const out = [];
    Object.keys(m).forEach(k => {
      const a = m[k].sort((x, y) => x.ts - y.ts);
      for (let s = 0; s < a.length; s++) { const w = a.filter(i => i.ts >= a[s].ts && i.ts - a[s].ts <= 3 * HR); const src = new Set(w.map(i => i.source)); if (src.size >= 5) { out.push(M.corr('coordinated', `${src.size} distinct accounts posted near-identical text within ${Math.round((w[w.length - 1].ts - w[0].ts) / 60000)} minutes ("${a[s].headline}"). A signal for review; not proof of coordination.`, { n: src.size, span: [w[0].ts, w[w.length - 1].ts], conf: src.size >= 8 ? 'medium' : 'low', ids: w.slice(0, 5).map(x => x.id), ts: w[0].ts })); break; }
      }
    });
    return out.sort((a, b) => b.ts - a.ts);
  });

  // Responsiveness (coverage context only; aggregate by place, UC-MC17)
  M.responsiveness = memo('rp', function () {
    const S = M.S;
    return R.districts.map(d => {
      const lags = [];
      S.episodes.filter(e => e.pol < 0 && (e.dists[d.id] || 0) >= 2 && !/Rumour/.test(e.issue)).forEach(e => {
        const gv = (S.gov[e.topic] || []).find(x => x.ts >= e.start && x.ts <= e.end + 3 * DAY && (!x.district || x.district === d.id));
        lags.push(gv ? (gv.ts - e.start) / HR : null);
      });
      const seen = lags.filter(x => x != null);
      return { d, n: lags.length, answered: seen.length, med: med(seen) };
    }).filter(r => r.n >= 2).sort((a, b) => (a.med == null) - (b.med == null) || (a.med || 0) - (b.med || 0));
  });

  // Narratives (UC-MC24, MC25): rumours and attack lines with origin, spread and revivals
  M.narratives = memo('nr', function () {
    const S = M.S, out = [];
    Object.keys(S.byIssue).forEach(issue => {
      const a = S.byIssue[issue]; if (a.length < 6) return;
      const mis = a.filter(i => i.misinfo >= 0.5).length, opp = a.filter(i => i.speakerType === 'opp').length / a.length;
      if (mis < 2 && opp < 0.5) return;
      const eps = episodesOf(a, issue, { bridge: 10, minN: 4 }); if (!eps.length) return;
      const f = a[0], gv = (S.gov[f.topic] || []).find(x => x.ts >= f.ts);
      out.push({ issue, topic: f.topic, type: mis >= 2 ? 'Rumour / misinformation risk' : 'Attack line', n: a.length, eps, first: f, revivals: eps.length - 1, debunkLag: gv ? (gv.ts - f.ts) / HR : null, last: a[a.length - 1],
        weekly: (() => { const w = new Array(26).fill(0); a.forEach(i => { const k = 25 - Math.floor((S.now - i.ts) / (7 * DAY)); if (k >= 0 && k < 26) w[k]++; }); return w; })(), conf: conf(eps.length, 1) });
    });
    return out.sort((a, b) => b.last.ts - a.last.ts);
  });

  // Period comparison (UC-MC06). Shares are used so different coverage volumes do not distort the comparison.
  M.compare = function (items, A, B) {
    const a = items.filter(i => i.ts >= A[0] && i.ts < A[1]), b = items.filter(i => i.ts >= B[0] && i.ts < B[1]);
    const share = (arr, key) => { const m = {}; arr.forEach(i => (m[i[key]] = (m[i[key]] || 0) + 1)); Object.keys(m).forEach(k => (m[k] = m[k] / Math.max(1, arr.length))); return m; };
    const diff = key => { const sa = share(a, key), sb = share(b, key), ks = new Set(Object.keys(sa).concat(Object.keys(sb))); return [...ks].map(k => ({ k, a: sa[k] || 0, b: sb[k] || 0, ratio: (sa[k] || 0.001) / (sb[k] || 0.001), na: a.filter(i => i[key] === k).length, nb: b.filter(i => i[key] === k).length })).filter(x => x.na + x.nb >= 4); };
    return { na: a.length, nb: b.length, topics: diff('topic').sort((x, y) => y.a - y.b - (x.a - x.b)), issues: diff('issue').sort((x, y) => Math.abs(Math.log(y.ratio)) - Math.abs(Math.log(x.ratio))).slice(0, 10) };
  };

  // ───── commitments (UC-MC07..10) ─────
  const DELIV = /पूर्ण|पूरा हुआ|complet|लोकार्पण|उद्घाटन|deliver|handed|सौंपा|जारी|released|credited|खाते में|सफल/i;
  const DELAY = /देरी|delay|अटका|लंबित|pending|विफल|अधूरा|incomplete|आरोप|complain|परेशान|शिकायत|रुका|stalled|नहीं मिला|missed/i;
  const parseD = s => (s ? new Date(s.length === 4 ? s + '-01-01' : s.length === 7 ? s + '-01' : s).getTime() : null);
  M.commitments = function () {
    const S = M.S;
    const seeds = (CGP.mode === 'sample' ? [] : R.commitments).concat(CGP.mode === 'live' ? [] : (CGP.sampleCommitments || []));
    return seeds.concat(ST.commitments.all()).map(c => {
      const rx = new RegExp(c.kw || c.text.split(/\s+/).slice(0, 3).join('|'), 'i'), from = parseD(c.announced) || 0;
      const ev = S.items.filter(i => i.ts >= from && rx.test(i.headline + ' ' + i.text)).sort((a, b) => b.ts - a.ts);
      const cl = { delivered: 0, progress: 0, delay: 0, dispute: 0 };
      ev.forEach(i => { const d = DELIV.test(i.headline), x = DELAY.test(i.headline) || i.stance < 0; if (i.speakerType === 'opp' && i.stance < 0) cl.dispute++; else if (d && !x) cl.delivered++; else if (x) cl.delay++; else cl.progress++; });
      const dl = parseD(c.deadline), daysLeft = dl ? Math.round((dl - S.now) / DAY) : null, total = ev.length;
      let status = 'No coverage evidence';
      if (total) status = cl.delivered >= Math.max(2, cl.delay) ? 'Delivered (per coverage)' : dl && dl < S.now && cl.delay >= cl.delivered ? 'Delayed (per coverage)' : cl.delay > cl.delivered * 1.5 && cl.delay >= 3 ? 'Delay coverage rising' : cl.dispute >= 3 && cl.dispute > cl.progress ? 'Disputed by opposition' : 'In progress (per coverage)';
      const dueSoon = dl && daysLeft <= 30 && daysLeft >= -30 && status.indexOf('Delivered') < 0;
      return Object.assign({}, c, { ev: Object.assign({ total }, cl), status, daysLeft, dueSoon, ids: ev.slice(0, 6).map(i => i.id) });
    });
  };

  // ───── statements (UC-MC11, MC12, MC14) ─────
  M.statements = () => ((CGP.mode === 'live' ? [] : CGP.sampleStatements || [])).concat(ST.statements.all()).sort((a, b) => b.date - a.date);
  M.positionShifts = function () {
    const by = {}; M.statements().forEach(s => { if (s.stance !== undefined && s.stance !== '' && s.topic) (by[s.speaker + '|' + s.topic] = by[s.speaker + '|' + s.topic] || []).push(s); });
    return Object.keys(by).map(k => { const a = by[k].sort((x, y) => x.date - y.date); const f = a[0], l = a[a.length - 1]; return a.length >= 2 && Math.sign(+f.stance) !== Math.sign(+l.stance) ? { speaker: f.speaker, topic: f.topic, a: f, b: l, n: a.length } : null; }).filter(Boolean);
  };
  M.verifyQuote = function (q) {
    const t = L.tok(q); if (t.length < 3) return [];
    const pool = M.statements().map(s => ({ kind: 'Statement store', text: s.quote, who: s.speaker, ts: s.date, url: s.url, tk: L.tok(s.quote) })).concat(M.S.items.map(i => ({ kind: 'Archive item', text: i.headline, who: i.source, ts: i.ts, url: i.link, id: i.id, tk: null })));
    const res = [];
    pool.forEach(p => { const tk = p.tk || L.tok(p.text); if (!tk.length) return; const A = new Set(t); let inter = 0; tk.forEach(w => { if (A.has(w)) inter++; }); const sc = inter / Math.min(A.size, new Set(tk).size); if (sc >= 0.6 && inter >= 3) res.push(Object.assign({ sc }, p)); });
    return res.sort((a, b) => b.sc - a.sc || a.ts - b.ts).slice(0, 6);
  };

  // ───── drafting helpers (rebuttal workflow, prep pack) ─────
  M.rebuttal = function (issue) {
    const S = M.S, a = S.byIssue[issue] || [], opp = a.filter(i => i.speakerType === 'opp');
    const first = a[0], hl = M.historyLine(issue), pb = M.playbook(issue, (first || {}).topic);
    const cm = M.commitments().filter(c => c.ev.total && c.ids.some(id => (CGP.index[id] || {}).topic === (first || {}).topic)).slice(0, 2);
    const claim = (opp[opp.length - 1] || a[a.length - 1] || {}).headline || '';
    return {
      claim, first: first && { ts: first.ts, source: first.source }, history: hl, playbook: pb, commitments: cm,
      draft: [`Context: ${hl.text}`, 'Facts to confirm with the department: [official figure / date / status].', `Point of record: ${cm.length ? 'Relevant public commitment — ' + cm[0].text + ' (status per coverage: ' + cm[0].status + ').' : '[cite the relevant public commitment or scheme order]'}`, `Suggested messenger and channel: ${pb ? 'based on logged responses — ' + pb.rows[0].type : '[choose after the response log has more cases]'}.`, 'Draft is a skeleton: every number must be filled in and verified by the spokesperson before use.'],
      ids: opp.slice(-4).map(i => i.id)
    };
  };

  // ───── people, places, time ─────
  const pd = (s, end) => { if (!s) return end ? 8.64e15 : -8.64e15; const p = s.split('-').map(Number); return end ? (p.length === 3 ? Date.UTC(p[0], p[1] - 1, p[2], 23, 59) : Date.UTC(p[0], p[1], 0, 23, 59)) : Date.UTC(p[0], (p[1] || 1) - 1, p[2] || 1); };
  M.asOf = ts => R.roleHistory.filter(r => pd(r.from) <= ts && ts <= pd(r.to, true));
  M.tenures = () => R.roleHistory.map(r => {
    const a = pd(r.from), b = r.to ? pd(r.to, true) : M.S.now, lead = R.leaders.find(l => l.name === r.who), rx = lead && new RegExp(lead.kw, 'i');
    const n = rx ? M.S.items.filter(i => i.ts >= a && i.ts <= b && i.entities.indexOf(r.who) >= 0).length : 0;
    return Object.assign({}, r, { a, b, n, covered: a >= M.S.dmin - 3 * DAY });
  });
  M.dossier = function (district, seat) {
    const S = M.S, term = Math.max(pd('2023-12-13'), S.dmin), from = term;
    const its = S.items.filter(i => i.district === district && i.ts >= from && (!seat || i.constituency === seat));
    const fam = S.famD.filter(f => f.district === district), act = S.episodes.filter(e => e.active && e.pol < 0 && (e.dists[district] || 0) >= 2);
    const cm = M.commitments().filter(c => c.ev.total && c.ids.some(id => (CGP.index[id] || {}).district === district));
    const byM = {}; its.forEach(i => { const k = new Date(i.ts).toISOString().slice(0, 7); byM[k] = (byM[k] || 0) + 1; });
    return { district, seat, from, its, fam, act, cm, byMonth: byM, visits: its.filter(i => /दौरा|visit|भ्रमण/i.test(i.headline)).length, thin: its.length < 10 };
  };
  M.electoralClock = () => { const due = Date.UTC(2028, 11, 3); return { due, days: Math.round((due - Date.now()) / DAY), needFrom: due - 2 * 365 * DAY - (Date.UTC(2023, 11, 3) - Date.UTC(2021, 11, 3)) }; };

  // ───── media vs ground truth (UC-MC31, MC32) ─────
  M.datasets = () => ((CGP.mode === 'live' ? [] : CGP.sampleContext ? [CGP.sampleContext] : [])).concat(ST.datasets.all());
  M.groundTruth = function (ds) {
    const S = M.S, per = {}; ds.rows.forEach(r => (per[r.period] = 1));
    const months = Object.keys(per);
    const cov = {}, off = {};
    R.districts.forEach(d => { cov[d.id] = 0; off[d.id] = 0; });
    S.items.forEach(i => { if (i.topic === ds.topic && i.stance < 0 && i.district && months.indexOf(new Date(i.ts).toISOString().slice(0, 7)) >= 0) cov[i.district]++; });
    ds.rows.forEach(r => { if (off[r.district] != null) off[r.district] += +r.value || 0; });
    const tc = sum(Object.values(cov)), to = sum(Object.values(off));
    const rows = R.districts.map(d => { const cs = tc ? cov[d.id] / tc : 0, os = to ? off[d.id] / to : 0, ratio = os ? cs / os : null; return { d, cov: cov[d.id], off: off[d.id], cs, os, ratio, flag: tc >= 10 && to >= 10 && ratio != null ? (ratio >= 2 ? 'over' : ratio <= 0.5 ? 'under' : '') : '' }; });
    return { rows, tc, to, months, sufficient: tc >= 10 && to >= 10 };
  };

  // ───── feedback metric (hypothesis H8: >= 70% of history lines useful) ─────
  M.verdictStats = () => { const v = ST.verdicts.all(), k = Object.keys(v); const u = k.filter(x => v[x] === 'useful').length; return { n: k.length, useful: u, pct: k.length ? Math.round((100 * u) / k.length) : null }; };
})(typeof window !== 'undefined' ? window : globalThis);

