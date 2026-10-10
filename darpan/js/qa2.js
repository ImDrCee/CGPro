/* Jan Darpan · perception questions about leaders over a period (default: the last 3 months).
   Extends the question answering with trajectory, turning points, strengths and vulnerabilities, comparison and movers.
   Every number is computed from the items; tone describes how stories were reported, not a judgement of anyone. */
(function (g) {
  const CGP = g.CGP, R = CGP.ref, E = CGP.E, U = CGP.U, C = CGP.C, Q = CGP.Q, I = CGP.icon;
  const DAY = 86400000, WEEK = 7 * DAY;
  const esc = U.esc, sgn = n => (n > 0 ? '+' : '') + n;
  const pct = (a, n) => (n ? Math.round((100 * a) / n) : 0);
  const D = ts => new Date(ts).getDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][new Date(ts).getMonth()];
  const tiles = a => `<div class="tiles">${a.map(t => `<div class="tile-s"><span>${t.l}</span><b>${t.v}</b>${t.d ? `<em class="${t.dc || ''}">${t.d}</em>` : ''}</div>`).join('')}</div>`;
  const section = (t, h) => `<div class="blk"><h5>${t}</h5>${h}</div>`;
  const note = h => `<p class="muted sm">${h}</p>`;

  Q.extra = Q.extra || {};

  const has = (it, name) => (it.people || []).indexOf(name) >= 0 || it.entities.indexOf(name) >= 0;
  const forWho = (items, name) => items.filter(i => has(i, name));
  const tone = items => { const n = items.length, sup = items.filter(i => i.stance > 0).length, crit = items.filter(i => i.stance < 0).length; return { n, sup, crit, net: n ? Math.round((100 * (sup - crit)) / n) : 0 }; };
  const specific = items => items.filter(i => i.issue && !i.generic && !i.broad);
  const issueTone = items => {
    const m = {};
    specific(items).forEach(i => { const o = m[i.issue] || (m[i.issue] = { k: i.issue, n: 0, sup: 0, crit: 0, items: [] }); o.n++; o.items.push(i); if (i.stance > 0) o.sup++; else if (i.stance < 0) o.crit++; });
    return Object.values(m);
  };
  const topIssues = (items, k) => issueTone(items).sort((a, b) => b.n - a.n).slice(0, k);
  const outletTone = items => { const m = {}; items.forEach(i => { const o = m[i.source] || (m[i.source] = { k: i.source, n: 0, sup: 0, crit: 0 }); o.n++; if (i.stance > 0) o.sup++; else if (i.stance < 0) o.crit++; }); return Object.values(m).sort((a, b) => b.n - a.n); };
  const bar = (crit, sup, n) => `<div class="divbar"><i class="pos" style="width:${pct(sup, n)}%"></i><i class="neg" style="width:${pct(crit, n)}%"></i></div>`;
  const pillNet = v => `<span class="pill" style="--c:${v > 10 ? 'var(--pos)' : v < -10 ? 'var(--neg)' : 'var(--pri2)'}">${sgn(v)}</span>`;
  const thin = (p, who) => ({ html: `<p class="lead">There are too few items about <b>${esc(who)}</b> in ${p.label} to describe a trend (at least 5 are needed). Try a longer window, or add links in the Library.</p>` });

  const windows = p => { const a = p.range[0], b = p.range[1], span = b - a; return { a, b, span, prev: [a - span, a] }; };
  const archiveNote = (p, w) => {
    const first = Math.min.apply(null, CGP.items.filter(i => !i.clipId).map(i => i.ts).concat([Date.now()]));
    return w.prev[0] < first ? note('The archive starts on ' + D(first) + ', so the comparison with the previous period is partial.') : '';
  };

  // ---------- one leader ----------
  function single(p, name, all) {
    const w = windows(p), cur = E.scope(all, { range: p.range, channel: p.channel || 'all' }), prevAll = E.scope(all, { range: w.prev, channel: p.channel || 'all' });
    const items = forWho(cur, name), prev = forWho(prevAll, name);
    if (items.length < 5) return thin(p, name);
    const t = tone(items), tp = tone(prev), who = R.people.find(x => x.name === name) || {};
    const nw = Math.max(1, Math.ceil(w.span / WEEK)), weeks = [];
    for (let k = 0; k < nw; k++) { const a = w.a + k * WEEK, its = items.filter(i => i.ts >= a && i.ts < a + WEEK); weeks.push({ a, items: its, t: tone(its), iss: topIssues(its, 1)[0] }); }
    const ok = weeks.filter(x => x.t.n >= 3);
    const hi = ok.slice().sort((x, y) => y.t.net - x.t.net)[0], lo = ok.slice().sort((x, y) => x.t.net - y.t.net)[0];
    const third = w.span / 3, slices = [0, 1, 2].map(k => items.filter(i => i.ts >= w.a + k * third && i.ts < w.a + (k + 1) * third));
    const iss = issueTone(items), strengths = iss.filter(x => x.sup > x.crit).sort((x, y) => (y.sup - y.crit) - (x.sup - x.crit)).slice(0, 3), weak = iss.filter(x => x.crit > x.sup).sort((x, y) => (y.crit - y.sup) - (x.crit - x.sup)).slice(0, 3);
    const outs = outletTone(items).slice(0, 6), ev = [];
    const pick = (arr, f) => { const x = arr.filter(f).sort((a, b) => b.traction - a.traction)[0]; if (x) ev.push(x); return x; };
    const dir = t.net - tp.net;
    const trend = !tp.n ? 'There is no earlier period to compare with.' : Math.abs(dir) < 6 ? 'Tone is about the same as in the previous period.' : dir > 0 ? `Tone is more positive than in the previous period (${sgn(dir)} points).` : `Tone is more negative than in the previous period (${sgn(dir)} points).`;
    const html = `<p class="lead"><b>${esc(name)}</b>${who.role ? ' (' + esc(who.role) + ')' : ''} was covered in <b>${t.n}</b> items in the <b>${p.label}</b>: <b>${pct(t.sup, t.n)}%</b> supportive, <b>${pct(t.crit, t.n)}%</b> critical (net <b>${sgn(t.net)}</b>). ${trend}</p>
      ${tiles([{ l: 'Items', v: t.n }, { l: 'Supportive', v: pct(t.sup, t.n) + '%' }, { l: 'Critical', v: pct(t.crit, t.n) + '%' }, { l: 'Net, previous period', v: tp.n ? sgn(tp.net) : '—' }])}
      ${note('Collection grew over time, so compare tone and the mix of issues rather than raw volumes. A week marked no data means nothing was collected for it, not that nothing was reported.')}
      ${archiveNote(p, w)}
      ${section('Week by week', `<table class="tbl"><thead><tr><th>Week of</th><th class="r">Items</th><th>Tone</th><th class="r">Net</th><th>Main issue</th></tr></thead><tbody>${weeks.map(x => `<tr><td>${D(x.a)}</td><td class="r">${x.t.n || '<span class="muted">no data</span>'}</td><td>${x.t.n ? bar(x.t.crit, x.t.sup, x.t.n) : ''}</td><td class="r">${x.t.n >= 3 ? pillNet(x.t.net) : '<span class="muted">—</span>'}</td><td class="muted">${x.iss ? esc(x.iss.k) : ''}</td></tr>`).join('')}</tbody></table>`)}
      ${hi && lo && hi !== lo ? section('Turning points', `<div class="orow"><div><b>High point: week of ${D(hi.a)}</b><p>Net ${sgn(hi.t.net)} on ${hi.t.n} items${hi.iss ? ', mainly ' + esc(hi.iss.k) : ''}. ${(() => { const x = pick(hi.items, i => i.stance > 0); return x ? '“' + esc(x.headline) + '” (' + esc(x.source) + ')' : ''; })()}</p></div></div>
        <div class="orow"><div><b>Low point: week of ${D(lo.a)}</b><p>Net ${sgn(lo.t.net)} on ${lo.t.n} items${lo.iss ? ', mainly ' + esc(lo.iss.k) : ''}. ${(() => { const x = pick(lo.items, i => i.stance < 0); return x ? '“' + esc(x.headline) + '” (' + esc(x.source) + ')' : ''; })()}</p></div></div>`) : ''}
      ${section('Issues, period by period', `<div class="mgrid">${slices.map((s, k) => `<section><h5>${D(w.a + k * third)} to ${D(w.a + (k + 1) * third - 1)}</h5>${topIssues(s, 3).map(x => `<div class="orow"><div>${CGP.W.ilink(x.k)}<p>${x.n} items · ${x.crit} critical · ${x.sup} supportive</p></div></div>`).join('') || '<p class="muted">Not enough items.</p>'}</section>`).join('')}</div>`)}
      ${section('Strengths and vulnerabilities', `<div class="mgrid"><section><h5>Strengths</h5>${strengths.map(x => `<div class="orow"><div>${CGP.W.ilink(x.k)}<p>${x.sup} supportive vs ${x.crit} critical</p></div></div>`).join('') || '<p class="muted">No issue where supportive coverage leads.</p>'}</section><section><h5>Vulnerabilities</h5>${weak.map(x => `<div class="orow"><div>${CGP.W.ilink(x.k)}<p>${x.crit} critical vs ${x.sup} supportive</p></div></div>`).join('') || '<p class="muted">No issue where critical coverage leads.</p>'}</section></div>`)}
      ${section('How outlets reported', `<table class="tbl"><tbody>${outs.map(o => `<tr><td><b>${esc(o.k)}</b></td><td class="r">${o.n}</td><td>${bar(o.crit, o.sup, o.n)}</td></tr>`).join('')}</tbody></table>${note('Tone describes how each story was reported, not a judgement of the outlet. Small counts vary a lot.')}`)}`;
    strengths.concat(weak).forEach(x => { const e = x.items.slice().sort((a, b) => b.traction - a.traction)[0]; if (e) ev.push(e); });
    return { html, ev: ev.slice(0, 5) };
  }

  // ---------- two leaders ----------
  function compare(p, a, b, all) {
    const w = windows(p), cur = E.scope(all, { range: p.range, channel: p.channel || 'all' }), prevAll = E.scope(all, { range: w.prev, channel: p.channel || 'all' });
    const col = name => { const it = forWho(cur, name), pv = forWho(prevAll, name), t = tone(it), tp = tone(pv); return { name, it, t, tp, iss: topIssues(it, 3), outs: outletTone(it).slice(0, 3), crit: issueTone(it).filter(x => x.crit > x.sup).sort((x, y) => y.crit - x.crit).slice(0, 2) }; };
    const A = col(a), B = col(b);
    if (A.t.n < 5 && B.t.n < 5) return thin(p, a + ' or ' + b);
    const row = (l, f) => `<tr><td class="muted">${l}</td><td>${f(A)}</td><td>${f(B)}</td></tr>`;
    const html = `<p class="lead"><b>${esc(a)}</b> and <b>${esc(b)}</b> compared over the <b>${p.label}</b>: ${esc(a)} in <b>${A.t.n}</b> items (net ${sgn(A.t.net)}), ${esc(b)} in <b>${B.t.n}</b> items (net ${sgn(B.t.net)}).</p>
      <table class="tbl"><thead><tr><th></th><th>${esc(a)}</th><th>${esc(b)}</th></tr></thead><tbody>
      ${row('Items', c => c.t.n)}
      ${row('Tone', c => c.t.n ? bar(c.t.crit, c.t.sup, c.t.n) + `<small>${pct(c.t.sup, c.t.n)}% supportive · ${pct(c.t.crit, c.t.n)}% critical</small>` : '—')}
      ${row('Net, previous period', c => (c.tp.n ? sgn(c.tp.net) : '—'))}
      ${row('Main issues', c => c.iss.map(x => esc(x.k) + ' (' + x.n + ')').join('<br>') || '—')}
      ${row('Where criticism sits', c => c.crit.map(x => esc(x.k) + ' (' + x.crit + ')').join('<br>') || '—')}
      ${row('Most reported by', c => c.outs.map(x => esc(x.k) + ' (' + x.n + ')').join('<br>') || '—')}</tbody></table>${archiveNote(p, w)}`;
    return { html, ev: E.top(A.it.concat(B.it), 5) };
  }

  // ---------- who improved or declined ----------
  function movers(p, all, group, mode) {
    const w = windows(p), cur = E.scope(all, { range: p.range, channel: p.channel || 'all' }), prevAll = E.scope(all, { range: w.prev, channel: p.channel || 'all' });
    const rows = R.people.filter(x => group === 'rival' ? x.group === 'opp' : x.group === 'govt' || x.group === 'bjp').map(x => { const t = tone(forWho(cur, x.name)), tp = tone(forWho(prevAll, x.name)); const sh = 100 * t.n / Math.max(1, cur.length), shp = 100 * tp.n / Math.max(1, prevAll.length); return { name: x.name, role: x.role, t, tp, d: t.net - tp.net, vol: Math.round((sh - shp) * 10) / 10, sh }; }).filter(r => r.t.n >= 8 && r.tp.n >= 8);
    const label = group === 'rival' ? 'rival leaders' : 'our leaders';
    if (rows.length < 2) {
      const now = R.people.filter(x => group === 'rival' ? x.group === 'opp' : x.group === 'govt' || x.group === 'bjp').map(x => { const t = tone(forWho(cur, x.name)); return { name: x.name, role: x.role, t, sh: 100 * t.n / Math.max(1, cur.length) }; }).filter(r => r.t.n >= 5).sort((a, b) => b.sh - a.sh).slice(0, 8);
      if (!now.length) return { html: `<p class="lead">There is not enough coverage of ${label} in the <b>${p.label}</b> to rank them.</p>` };
      return { html: `<p class="lead">The period before the <b>${p.label}</b> has too little collected coverage to measure change for ${label}. Here is where they stand now: <b>${esc(now[0].name)}</b> has the largest share of coverage (${now[0].sh.toFixed(1)}%).</p><table class="tbl"><thead><tr><th>Name</th><th class="r">Items</th><th class="r">Share of coverage</th><th class="r">Net</th></tr></thead><tbody>${now.map(r => `<tr><td><b>${esc(r.name)}</b><small>${esc(r.role || '')}</small></td><td class="r">${r.t.n}</td><td class="r">${r.sh.toFixed(1)}%</td><td class="r">${pillNet(r.t.net)}</td></tr>`).join('')}</tbody></table>${note('A longer archive would allow a before-and-after comparison.')}`, ev: E.top(cur.filter(i => (i.people || []).indexOf(now[0].name) >= 0), 5) };
    }
    const up = rows.slice().sort((x, y) => y.d - x.d).slice(0, 5), dn = rows.slice().sort((x, y) => x.d - y.d).slice(0, 5);
    const tb = list => `<table class="tbl"><thead><tr><th>Name</th><th class="r">Items</th><th class="r">Net now</th><th class="r">Net before</th><th class="r">Change</th></tr></thead><tbody>${list.map(r => `<tr><td><b>${esc(r.name)}</b><small>${esc(r.role || '')}</small></td><td class="r">${r.t.n}</td><td class="r">${sgn(r.t.net)}</td><td class="r">${sgn(r.tp.net)}</td><td class="r">${pillNet(r.d)}</td></tr>`).join('')}</tbody></table>`;
    const prom = rows.slice().sort((x, y) => y.vol - x.vol).slice(0, 5);
    if (mode === 'prominence') {
      const dn2 = rows.slice().sort((x, y) => x.vol - y.vol).slice(0, 3);
      const tbp = list => `<table class="tbl"><thead><tr><th>Name</th><th class="r">Items</th><th class="r">Share of coverage</th><th class="r">Change in share</th><th class="r">Net now</th></tr></thead><tbody>${list.map(r => `<tr><td><b>${esc(r.name)}</b><small>${esc(r.role || '')}</small></td><td class="r">${r.t.n}</td><td class="r">${r.sh.toFixed(1)}%</td><td class="r">${(r.vol > 0 ? '+' : '') + r.vol} pts</td><td class="r">${sgn(r.t.net)}</td></tr>`).join('')}</tbody></table>`;
      return { html: `<p class="lead">Among ${label}, <b>${esc(prom[0].name)}</b> gained the most visibility over the <b>${p.label}</b>: ${prom[0].sh.toFixed(1)}% of all coverage (${prom[0].vol > 0 ? '+' : ''}${prom[0].vol} points against the period before).</p>${section('Gaining visibility', tbp(prom))}${section('Losing visibility', tbp(dn2))}${note('Share of coverage compares leaders fairly even though the amount collected grew over time. Issues they are linked with are in the leader view: ask about a named leader.')}`, ev: E.top(cur.filter(i => (i.people || []).indexOf(prom[0].name) >= 0), 5) };
    }
    const html = `<p class="lead">Among ${label} with enough coverage, <b>${esc(up[0].name)}</b> improved most over the <b>${p.label}</b> (${sgn(up[0].d)} points) and <b>${esc(dn[0].name)}</b> declined most (${sgn(dn[0].d)} points). Net is supportive minus critical, as a % of items, compared with the period before.</p>
      ${section('Improved most', tb(up))}${section('Declined most', tb(dn))}${section('Biggest gain in visibility', tb(prom))}`;
    return { html, ev: E.top(cur.filter(i => (i.people || []).indexOf(up[0].name) >= 0 || (i.people || []).indexOf(dn[0].name) >= 0), 5) };
  }

  Q.extra.perception = (p, scope, all) => {
    if (p.who.length >= 2) return compare(p, p.who[0], p.who[1], all);
    if (p.who.length === 1) return single(p, p.who[0], all);
    return movers(p, all, /rival|opposition|opp\b/.test(p.q.toLowerCase()) ? 'rival' : 'ours', /prominen|visib|fastest|emerg|rise|risen|grown/.test(p.q.toLowerCase()) ? 'prominence' : 'tone');
  };

  // ---------- parsing hook ----------
  const baseParse = Q.parse;
  const TOPICAL = /\b(image|perception|perceived|trajectory|reputation|turning points?|high and low|highs and lows|strengths?\b.*\bvulnerab|vulnerabilit|media profile|media scorecard|improved .*(most|image)|declined .*(most|image)|(improved|declined|grown|risen|fallen)\b|changed over|shifted over|tone .*(changed|trend)|trend in (tone|coverage))/;
  Q.parse = (q, st) => {
    const p = baseParse(q, st), s = q.toLowerCase();
    p.who = []; (R.people || []).forEach(x => { if (x.en.test(q) && p.who.indexOf(x.name) < 0) p.who.push(x.name); });
    if (p.leader && p.who.indexOf(p.leader) < 0) p.who.unshift(p.leader);
    const leaders = /\bleaders?\b|\bministers?\b|\bmlas?\b/.test(s);
    if ((TOPICAL.test(s) && (p.who.length || leaders) || (/\bcompare\b|\bversus\b|\bvs\b/.test(s) && p.who.length >= 2)) && !/\bsay\b|said|statement|quote|promise|commitment/.test(s)) {
      p.intent = 'perception';
      if (!p.explicit) { p.days = 90; p.range = E.range(90); p.label = 'last 90 days'; }
    }
    return p;
  };
  const baseChips = Q.chips;
  Q.chips = p => { const c = baseChips(p); if (p.intent === 'perception') c[0] = ['Intent', 'Leader perception']; return c; };
})(typeof window !== 'undefined' ? window : globalThis);
