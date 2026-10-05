/* Views, part 2: shared components, Memory, Promises, Patterns. */
(function (g) {
  const CGP = g.CGP, R = CGP.ref, E = CGP.E, U = CGP.U, C = CGP.C, V = CGP.V, I = CGP.icon, M = CGP.M, ST = CGP.store;
  const DAY = 86400000;
  const W = (CGP.W = {});
  const sgn = n => (n > 0 ? '+' : '') + n;
  const sum = a => a.reduce((x, y) => x + y, 0);

  W.card = o => `<section class="card ${o.cls || ''}">${o.title ? `<header class="ch"><div><h3>${o.title}</h3>${o.sub ? `<p>${o.sub}</p>` : ''}</div>${o.right || ''}</header>` : ''}${o.body}</section>`;
  W.tabs = (S, list) => { const cur = S.tab[S.view] || list[0][0]; return `<div class="tabs" role="tablist">${list.map(t => `<button role="tab" class="${cur === t[0] ? 'on' : ''}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div>`; };
  W.cur = (S, def) => S.tab[S.view] || def;
  W.ilink = name => `<button class="ilink" data-open-issue="${U.esc(name)}">${U.esc(name)}</button>`;
  W.ev = (ids, n) => { const its = (ids || []).map(id => CGP.index[id]).filter(Boolean).slice(0, n || 5); return its.length ? `<div class="srcs"><span>Evidence</span>${its.map(i => `<button class="src" data-item="${i.id}">${C.chBadge(i.channel)}<em>${U.esc(i.source)} · ${U.dstr(i.ts)}</em></button>`).join('')}</div>` : ''; };
  W.verdict = id => { const v = ST.verdicts.all()[id]; return `<span class="verd" data-tip="Was this useful? Feeds the usefulness metric (target ≥ 70%)"><button data-verdict-id="${U.esc(id)}" data-verdict-val="useful" class="${v === 'useful' ? 'on' : ''}" aria-label="Useful">${I('thumbup', 13)}</button><button data-verdict-id="${U.esc(id)}" data-verdict-val="not" class="${v === 'not' ? 'on neg' : ''}" aria-label="Not useful">${I('thumbdown', 13)}</button></span>`; };
  const TYPE = { 'common-factor': 'Common factor', chain: 'Linked-issue chain', systemic: 'Systemic pattern', analogue: 'Analogue', coordinated: 'Coordinated pattern', 'lead-lag': 'Lead–lag', recurrence: 'Recurrence', seasonal: 'Seasonal' };
  W.corr = c => `<article class="corr t-${c.type}"><header><span class="ctype">${TYPE[c.type] || c.type}</span>${C.meter(c.conf)}</header><p>${U.esc(c.text)}</p>
    <footer><span class="cmeta">${c.n} supporting${c.span ? ' · ' + U.mstr(c.span[0]) + ' – ' + U.mstr(c.span[1]) : ''}</span>${W.verdict(c.id)}</footer>${W.ev(c.ids, 4)}</article>`;
  W.hist = (issue, district) => {
    const h = M.historyLine(issue, district);
    return `<div class="hist ${h.kind}"><span class="hi">${I('clock', 13)}</span><span class="ht"><b>History</b> ${U.esc(h.text)}</span>${C.meter(h.conf)}${W.verdict('H:' + issue)}</div>`;
  };
  W.empty = (t, sub) => `<div class="empty-state">${I('clock', 22)}<b>${t}</b><p>${sub || ''}</p></div>`;
  W.pill = (t, tone) => `<span class="tag ${tone || 'neu'}">${t}</span>`;
  const statusTone = s => (/Delivered/.test(s) ? 'pos' : /Delayed|rising/.test(s) ? 'neg' : /Disputed/.test(s) ? 'warn' : 'neu');

  // ───────────── Memory ─────────────
  V.memory = S => {
    const tabs = [['overview', 'Overview'], ['recur', 'Recurrence'], ['season', 'Seasonal'], ['narr', 'Narratives'], ['compare', 'Compare'], ['impact', 'Responses']];
    const t = W.cur(S, 'overview'), St = M.S;
    let body = '';
    if (t === 'overview') {
      const months = Math.max(1, Math.round((St.now - St.dmin) / (30 * DAY)));
      const byM = {}; St.items.forEach(i => { const k = new Date(i.ts).toISOString().slice(0, 7); byM[k] = (byM[k] || 0) + 1; });
      const keys = Object.keys(byM).sort();
      const closed = St.episodes.filter(e => !e.active), act = St.episodes.filter(e => e.active);
      const out = M.outlook().slice(0, 4), an = M.analogues().slice(0, 2), rs = M.resurfacing().slice(0, 3);
      const mem = months >= 12 ? 'Good: a full year of history allows seasonal and year-on-year views.' : months >= 3 ? 'Basic: precedents work; seasonal views need 12+ months.' : 'Thin: too little history for reliable precedents.';
      body = `<div class="bento">
        ${W.card({ cls: 'span5', title: 'The archive', sub: 'Memory starts on day one. It cannot be bought later.', body: `<div class="tiles">${[['Items kept', U.fmt(St.items.length)], ['Since', U.dstr(St.dmin)], ['Months', months], ['Issue episodes', St.episodes.length]].map(x => `<div class="tile-s"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
          <h5>Items per month</h5>${C.columns(keys.map(k => byM[k]), keys.map(k => k.slice(5)), { h: 110, color: 'var(--pri)' })}<p class="muted sm">${mem}</p>` })}
        ${W.card({ cls: 'span7', title: 'Next 6 weeks: what history says to watch', sub: 'Issues that were unusually active in the same weeks of past years', right: `<span class="chip">${M.calendarNow().map(c => c.name).join(' · ') || 'No seasonal calendar entry'}</span>`,
          body: out.length ? out.map(o => `<div class="orow"><div>${W.ilink(o.issue)}<p>${o.avg.toFixed(0)} items in the same weeks of ${o.yrs} earlier year${o.yrs > 1 ? 's' : ''} vs ${o.base.toFixed(0)} typical (${o.lift.toFixed(1)}×) · ${o.eps.length} episode${o.eps.length === 1 ? '' : 's'} then</p></div>${C.meter(o.conf)}</div>`).join('') : W.empty('No seasonal signal yet', 'Needs about a year of history. The archive covers ' + months + ' month(s).') })}
        ${W.card({ cls: 'span6', title: 'Chronic hotspots and recurring issues', sub: 'Same issue, same place, again', right: `<button class="link" data-tab="recur">All ${I('up', 14)}</button>`,
          body: St.famD.length ? St.famD.slice(0, 6).map(f => `<div class="orow"><div>${W.ilink(f.issue)}<p>${U.dname(f.district)} · ${f.count} episodes · about every ${Math.round(f.meanInterval)} days · latest ${U.mstr(f.last.start)}</p></div>${W.pill(f.count + '×', 'warn')}</div>`).join('') : W.empty('No recurrence found', 'Recurrence needs at least two separate episodes of the same issue in one place.') })}
        ${W.card({ cls: 'span6', title: 'Early-warning precedents', sub: 'Active issues compared with similar past episodes. Not a forecast.', body: an.length ? an.map(W.corr).join('') : W.empty('No active issue with enough comparable history') })}
        ${W.card({ cls: 'span12', title: 'Old content resurfacing', sub: 'Recent items whose wording nearly matches something older than 90 days',
          body: rs.length ? rs.map(r => `<div class="resf"><div><span class="tag warn">Possible resurfacing</span> ${W.ilink(r.recent.issue)}</div><p><b>Now</b> ${U.dstr(r.recent.ts)} · ${U.esc(r.recent.source)}: ${U.esc(r.recent.headline)}</p><p><b>Earlier</b> ${U.dstr(r.original.ts)} · ${U.esc(r.original.source)}: ${U.esc(r.original.headline)}</p><div class="chips"><button class="src" data-item="${r.recent.id}">View now</button><button class="src" data-item="${r.original.id}">View original</button>${C.meter(r.sim >= 0.9 ? 'high' : 'medium')}</div></div>`).join('') : W.empty('No resurfaced content detected', 'Compares titles from the last 14 days with the older archive.') })}
      </div>`;
    } else if (t === 'recur') {
      const from = St.dmin, to = St.now;
      body = `<div class="bento">${W.card({ cls: 'span12', title: 'Recurrence families (statewide)', sub: 'An issue that came back after it had gone quiet', body: St.fam.length ? `<table class="tbl"><thead><tr><th>Issue</th><th class="r">Episodes</th><th class="r">Typical gap</th><th>Timeline</th><th>Latest</th></tr></thead><tbody>${St.fam.slice(0, 14).map(f => `<tr><td>${W.ilink(f.issue)}<small>${U.tname(f.topic)}</small></td><td class="r">${f.count}</td><td class="r">${Math.round(f.meanInterval)} d</td><td style="min-width:200px">${C.timelineStrip(f.eps, from, to)}</td><td>${U.mstr(f.last.start)} ${f.active ? W.pill('active', 'neg') : ''}</td></tr>`).join('')}</tbody></table>` : W.empty('No recurring issue yet') })}
        ${W.card({ cls: 'span12', title: 'Chronic hotspot register (by place)', sub: 'Issue × district with at least two episodes', body: St.famD.length ? `<table class="tbl"><thead><tr><th>Issue</th><th>District</th><th class="r">Episodes</th><th class="r">Typical gap</th><th>Latest</th></tr></thead><tbody>${St.famD.slice(0, 20).map(f => `<tr><td>${W.ilink(f.issue)}</td><td><button class="ilink" data-district-open="${f.district}">${U.dname(f.district)}</button></td><td class="r">${f.count}</td><td class="r">${Math.round(f.meanInterval)} d</td><td>${U.mstr(f.last.start)}</td></tr>`).join('')}</tbody></table>` : W.empty('No hotspot yet') })}</div>`;
    } else if (t === 'season') {
      const top = Object.keys(St.byIssue).filter(k => St.byIssue[k].length >= 12 && St.byIssue[k].filter(i => i.stance < 0).length / St.byIssue[k].length > 0.5).sort((a, b) => St.byIssue[b].length - St.byIssue[a].length).slice(0, 10);
      const rows = top.map(k => { const v = new Array(12).fill(0); St.byIssue[k].forEach(i => v[new Date(i.ts).getMonth()]++); return { label: k, vals: v, click: true }; });
      const out = M.outlook();
      body = `<div class="bento">${W.card({ cls: 'span12', title: 'Seasonal profile', sub: 'Items by calendar month across the whole archive. Darker means busier.', body: rows.length ? C.heatGrid(rows, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']) + `<p class="muted sm">With ${Math.round((St.now - St.dmin) / (30 * DAY))} months of history each month has ${(St.now - St.dmin) / DAY >= 700 ? 'about two' : 'at most one'} observation. Treat single-year seasons as a prompt, not a rule.</p>` : W.empty('Not enough history') })}
        ${W.card({ cls: 'span7', title: 'Outlook: next 6 weeks', body: out.length ? out.map(o => `<div class="orow"><div>${W.ilink(o.issue)}<p>Same weeks in past years: ${o.hist.join(', ')} items (typical ${o.base.toFixed(0)}) · ${o.eps.map(e => U.dstr(e.start) + ' (' + e.days + ' d)').join('; ') || 'no episode start in those weeks'}</p></div>${C.meter(o.conf)}</div>`).join('') : W.empty('No seasonal signal in the coming weeks') })}
        ${W.card({ cls: 'span5', title: 'Calendar', sub: 'Context that explains some seasons', body: M.calendarNow(60).map(c => `<div class="orow"><div><b>${c.name}</b><p>${c.note}</p></div>${W.pill(c.from[1] + '/' + c.from[0] + ' – ' + c.to[1] + '/' + c.to[0])}</div>`).join('') || '<p class="empty">Nothing in the next 60 days.</p>' })}</div>`;
    } else if (t === 'narr') {
      const ns = M.narratives();
      body = `<div class="bento"><div class="span12 issues-grid">${ns.length ? ns.map(n => `<article class="card issue"><header><div><span class="chip">${n.type}</span><h4>${W.ilink(n.issue)}</h4></div>${C.meter(n.conf)}</header>
        <div class="ispark">${C.spark(n.weekly, { h: 44, color: 'var(--warn)' })}</div>
        <div class="imeta"><span>First seen <b>${U.dstr(n.first.ts)}</b> on ${U.esc(n.first.channel)}</span><span><b>${n.n}</b> items</span><span><b>${n.eps.length}</b> episode${n.eps.length > 1 ? 's' : ''}${n.revivals ? ' · ' + n.revivals + ' revival' + (n.revivals > 1 ? 's' : '') : ''}</span></div>
        <p class="claim">${n.debunkLag != null ? 'First official voice in coverage ' + U.hrs(n.debunkLag) + ' after first sighting.' : 'No official voice on this topic after first sighting in the archive.'} Last seen ${U.dstr(n.last.ts)}.</p>${W.ev([n.first.id, n.last.id], 2)}</article>`).join('') : W.empty('No tracked narrative', 'Needs a rumour or an attack line with at least six items.')}</div></div>`;
    } else if (t === 'compare') {
      const days = Math.max(7, Math.min(90, S.days)), mode = S.cmp || 'yoy';
      const A = [St.now - days * DAY, St.now], B = mode === 'yoy' ? [A[0] - 365 * DAY, A[1] - 365 * DAY] : [A[0] - days * DAY, A[0]];
      const have = B[0] >= St.dmin - 2 * DAY, cmp = have ? M.compare(St.items, A, B) : null, clk = M.electoralClock();
      body = `<div class="bento">${W.card({ cls: 'span12', title: 'Same-period comparison', sub: `Last ${days} days versus ${mode === 'yoy' ? 'the same days a year earlier' : 'the previous ' + days + ' days'}. Shares are used so different volumes do not distort it.`,
        right: `<div class="seg"><button class="${mode === 'yoy' ? 'on' : ''}" data-cmp="yoy">Year on year</button><button class="${mode === 'prev' ? 'on' : ''}" data-cmp="prev">Previous period</button></div>`,
        body: !have ? W.empty('Archive too short for that comparison', 'The archive starts ' + U.dstr(St.dmin) + '; the comparison window begins ' + U.dstr(B[0]) + '.') : `<div class="tiles">${[['Now', cmp.na + ' items'], ['Then', cmp.nb + ' items']].map(x => `<div class="tile-s"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
          <h5>Topic share: now vs then</h5>${C.hbars(cmp.topics.slice(0, 8).map(x => ({ label: U.tname(x.k), value: Math.round(x.a * 100) + 1, right: Math.round(x.a * 100) + '% vs ' + Math.round(x.b * 100) + '%', color: x.a >= x.b ? 'var(--warn)' : 'var(--sky)', sub: x.na + ' vs ' + x.nb + ' items' })))}
          <h5>Biggest issue shifts</h5><table class="tbl"><tbody>${cmp.issues.map(x => `<tr><td>${W.ilink(x.k)}</td><td class="r">${x.na} vs ${x.nb}</td><td class="r">${W.pill(x.ratio >= 1 ? x.ratio.toFixed(1) + '× more' : (1 / x.ratio).toFixed(1) + '× less', x.ratio >= 1 ? 'warn' : 'pos')}</td></tr>`).join('')}</tbody></table>` })}
        ${W.card({ cls: 'span12', title: 'Election clock', sub: 'Electoral-cycle comparison aligns periods by days-to-poll', body: `<div class="tiles"><div class="tile-s"><span>Next Assembly election</span><b>about ${U.fmt(clk.days)} days</b></div><div class="tile-s"><span>Due</span><b>by Dec 2028</b></div></div><p class="muted">A like-for-like comparison with the previous cycle (same days-to-poll before the 2023 election, around ${U.mstr(Date.UTC(2023, 11, 3) - clk.days * DAY)}) needs an archive going back to then. The current archive starts ${U.dstr(St.dmin)}, so this view stays off until that history is back-filled.</p>` })}</div>`;
    } else {
      const acts = M.actions(), rs = M.responsiveness();
      const by = {}; acts.filter(a => a.effect.reliable).forEach(a => (by[a.type] = by[a.type] || []).push(a.effect.pct));
      const rows = Object.keys(by).map(k => ({ label: k, value: Math.abs(Math.round(sum(by[k]) / by[k].length)) + 2, right: Math.round(sum(by[k]) / by[k].length) + '% (n=' + by[k].length + ')', color: sum(by[k]) <= 0 ? 'var(--pos)' : 'var(--neg)' }));
      body = `<div class="bento">${W.card({ cls: 'span12', title: 'Response ledger: action → outcome', sub: 'Log what you did. The platform measures coverage 3 days before and after on the same issue.', right: `<button class="btn" data-form="logAction">${I('plus', 16)} Log a response</button>`,
        body: acts.length ? `<table class="tbl"><thead><tr><th>When</th><th>Issue</th><th>Response</th><th>Place</th><th class="r">Before</th><th class="r">After</th><th class="r">Change</th><th></th></tr></thead><tbody>${acts.map(a => `<tr><td>${U.dstr(a.ts)}${a.sample ? ' <small>sample</small>' : ''}</td><td>${a.issue ? W.ilink(a.issue) : U.tname(a.topic)}</td><td>${U.esc(a.type)}${a.note ? '<small>' + U.esc(a.note) + '</small>' : ''}</td><td>${a.district ? U.dname(a.district) : 'Statewide'}</td><td class="r">${a.effect.before}</td><td class="r">${a.effect.ready ? a.effect.after : '…'}</td><td class="r">${a.effect.pct == null ? '—' : `<span class="pill" style="--c:${a.effect.pct <= 0 ? 'var(--pos)' : 'var(--neg)'}">${sgn(a.effect.pct)}%</span>`}${a.effect.reliable ? '' : ' <small>thin</small>'}</td><td>${a.sample ? '' : `<button class="icon-btn" data-del="actions|${a.id}" aria-label="Delete">${I('trash', 14)}</button>`}</td></tr>`).join('')}</tbody></table>` : W.empty('No response logged yet', 'Log the first response; the effect appears once 3 days have passed.') })}
        ${W.card({ cls: 'span6', title: 'What tends to follow which response', sub: 'Average change in coverage over 72 h. Association, small samples.', body: rows.length ? C.hbars(rows) : W.empty('Needs reliable cases', 'A case is reliable with at least 5 items before the response.') })}
        ${W.card({ cls: 'span6', title: 'Responsiveness by district (coverage context)', sub: 'Median time to the first official voice in coverage. Aggregate; not a performance verdict.', body: rs.length ? `<table class="tbl"><tbody>${rs.map(r => `<tr><td><b>${r.d.name}</b></td><td class="r">${r.med == null ? 'no official voice seen' : U.hrs(r.med)}</td><td class="r muted">${r.answered}/${r.n} episodes</td></tr>`).join('')}</tbody></table>` : W.empty('Not enough episodes per district') })}</div>`;
    }
    return W.tabs(S, tabs) + body;
  };

  // ───────────── Promises ─────────────
  V.promises = S => {
    const all = M.commitments(), t = W.cur(S, 'ours'), list = all.filter(c => (t === 'rival' ? c.rival : !c.rival));
    const cnt = k => list.filter(c => k.test(c.status)).length;
    const due = list.filter(c => c.dueSoon);
    const head = [['Delivered', cnt(/Delivered/)], ['In progress', cnt(/In progress/)], ['Delayed / rising', cnt(/Delayed|rising/)], ['Due within 30 days', due.length]];
    const rowsHtml = list.map(c => `<tr><td><b>${U.esc(c.text)}</b><small>${U.esc(c.who)} · announced ${U.esc(c.announced || '—')}${c.place ? ' · ' + U.esc(c.place) : ''}${c.seed ? ' · seed from public reports, verify' : ''}${c.sample ? ' · fictional' : ''}</small>${c.note ? `<small>${U.esc(c.note)}</small>` : ''}</td>
      <td>${c.deadline ? U.esc(c.deadline) + `<small>${c.daysLeft >= 0 ? c.daysLeft + ' days left' : -c.daysLeft + ' days past'}</small>` : '<span class="muted">none</span>'}</td>
      <td>${W.pill(c.status, statusTone(c.status))}</td>
      <td style="min-width:150px">${C.stack([{ v: c.ev.delivered, color: 'var(--pos)', label: 'Delivered' }, { v: c.ev.progress, color: 'var(--sky)', label: 'Progress' }, { v: c.ev.delay, color: 'var(--neg)', label: 'Delay / complaint' }, { v: c.ev.dispute, color: 'var(--warn)', label: 'Disputed' }], { cls: 'thin' })}<small>${c.ev.total} items per coverage</small></td>
      <td>${W.ev(c.ids, 2).replace('<span>Evidence</span>', '')}${c.id && !c.seed && !c.sample ? `<button class="icon-btn" data-del="commitments|${c.id}" aria-label="Delete">${I('trash', 14)}</button>` : ''}</td></tr>`).join('');
    return W.tabs(S, [['ours', 'Government / own'], ['rival', 'Rival record']]) + `<div class="bento">
      ${head.map(h => W.card({ cls: 'span3 kpi', body: `<span class="kl">${h[0]}</span><div class="kv"><b>${h[1]}</b></div>` })).join('').replace(/span3 kpi/g, 'span3 kpi mini')}
      ${due.length ? W.card({ cls: 'span12 warncard', title: 'Deadline early warning', sub: 'Due within 30 days (or just missed) and not yet delivered per coverage', body: due.map(c => `<div class="orow"><div><b>${U.esc(c.text)}</b><p>${c.deadline} · ${c.daysLeft >= 0 ? c.daysLeft + ' days left' : -c.daysLeft + ' days past'} · ${c.ev.delay} delay/complaint item(s)</p></div>${W.pill(c.status, statusTone(c.status))}</div>`).join('') }) : ''}
      ${W.card({ cls: 'span12', title: (t === 'rival' ? 'Rival promise record' : 'Commitment register') + ' <small>' + list.length + ' tracked</small>', sub: 'Status is "per coverage": it reflects what the media reported. Attach official progress data to make it authoritative.', right: `<button class="btn" data-form="addCommitment" data-arg="${t === 'rival' ? 'rival' : ''}">${I('plus', 16)} Add commitment</button>`,
        body: list.length ? `<table class="tbl"><thead><tr><th>Commitment</th><th>Deadline</th><th>Status</th><th>Evidence</th><th></th></tr></thead><tbody>${rowsHtml}</tbody></table><p class="muted sm">Separate measurable commitments from aspirations. A curator should confirm each entry. Neutral wording, evidence trail for every status.</p>` : W.empty('Nothing tracked here yet', 'Add a public commitment: what, who, when announced, deadline, and a few keywords to link evidence.') })}</div>`;
  };

  // ───────────── Patterns ─────────────
  V.patterns = S => {
    const sys = M.systemic(), spr = M.spread(), cf = M.commonFactors(), ch = M.chains(), ll = M.leadLag(), an = M.analogues(), co = M.coordinated();
    const dss = M.datasets(), ds = dss.find(d => d.id === S.dsId) || dss[0];
    const gt = ds ? M.groundTruth(ds) : null;
    const window = E.scope(CGP.items, { range: E.range(Math.max(30, S.days)) }).filter(i => i.entities.length >= 2);
    const ec = {}, pc = {};
    window.forEach(i => { const es = [...new Set(i.entities)].slice(0, 5); es.forEach(e => (ec[e] = (ec[e] || 0) + 1)); for (let a = 0; a < es.length; a++) for (let b = a + 1; b < es.length; b++) { const k = [es[a], es[b]].sort().join('|'); pc[k] = (pc[k] || 0) + 1; } });
    const nodes = Object.keys(ec).sort((a, b) => ec[b] - ec[a]).slice(0, 12).map(k => ({ id: k, label: k, w: ec[k], color: R.leaders.some(l => l.name === k) ? (R.leaders.find(l => l.name === k).group === 'opp' ? 'var(--sky)' : 'var(--warn)') : 'var(--pri)' }));
    const ids = {}; nodes.forEach(n => (ids[n.id] = 1));
    const links = Object.keys(pc).map(k => { const [a, b] = k.split('|'); return { a, b, w: pc[k], tip: a + ' + ' + b + ' · ' + pc[k] + ' items' }; }).filter(l => ids[l.a] && ids[l.b] && l.w >= 2);
    const cards = (arr, empty) => (arr.length ? arr.map(W.corr).join('') : W.empty(empty));
    return `<div class="bento">
      ${W.card({ cls: 'span12 note', body: `<p class="muted"><b>Correlation is not causation.</b> Every card shows its type, how many episodes support it, the time span and a confidence level. Wording is "appeared with", "followed by", "coincided with". Mark each card useful or not: that feeds the usefulness metric.</p>` })}
      ${W.card({ cls: 'span6', title: 'Systemic or local?', sub: 'Issues in more districts than ever before, or spreading week on week', body: cards(sys, 'No issue is currently wider than its past maximum.') + (spr.length ? `<h5>Spreading</h5>${spr.slice(0, 4).map(s => `<div class="orow"><div>${W.ilink(s.issue)}<p>${s.prev} → ${s.now} districts in a week: ${s.dists.map(U.dname).join(', ')}</p></div>${W.pill('spreading', 'warn')}</div>`).join('')}` : '') })}
      ${W.card({ cls: 'span6', title: 'Common factors', sub: 'Entities that appear far more often with an issue than expected', body: cards(cf.slice(0, 5), 'No entity stands out. Entities come from names in headlines; more history sharpens this.') })}
      ${W.card({ cls: 'span6', title: 'Chains of consequence', sub: 'Issues that tend to begin soon after another in the same district', body: cards(ch.slice(0, 4), 'No repeating sequence with at least two cases.') })}
      ${W.card({ cls: 'span6', title: 'Who reports first (lead–lag)', sub: 'Median hours after the first signal, by channel', body: ll.rows.length ? `<table class="tbl"><thead><tr><th>Channel</th><th class="r">Median lag</th><th class="r">First in</th></tr></thead><tbody>${ll.rows.map(r => `<tr><td>${C.chBadge(r.channel)} ${r.channel}</td><td class="r">${r.med === 0 ? '0 h' : U.hrs(r.med)}</td><td class="r">${Math.round(r.shareFirst * 100)}%</td></tr>`).join('')}</tbody></table><h5>First-mover outlets</h5>${C.hbars(ll.srcs.slice(0, 5).map(s => ({ label: U.esc(s.source), value: s.n, right: Math.round(s.share * 100) + '% of episodes' })))}<p class="muted sm">${ll.episodes} episodes · confidence ${ll.conf}. Source behaviour as seen in this archive, not a reliability rating.</p>` : W.empty('Not enough multi-channel episodes') })}
      ${W.card({ cls: 'span6', title: 'Analogue early warnings', sub: 'Active issues vs similar past episodes. Not a forecast.', body: cards(an.slice(0, 4), 'No active issue to compare.') })}
      ${W.card({ cls: 'span6', title: 'Coordinated patterns', sub: 'Identical text from many distinct social accounts within hours', body: cards(co, 'None detected. News syndication is not counted; only citizen posts on X, Facebook and Instagram.') })}
      ${W.card({ cls: 'span12', title: 'Media versus ground truth', sub: 'Coverage share against an official dataset, by district', right: `<div class="filters">${dss.length ? `<select data-ds>${dss.map(d => `<option value="${d.id}" ${ds && ds.id === d.id ? 'selected' : ''}>${U.esc(d.name)}</option>`).join('')}</select>` : ''}<button class="btn ghost" data-form="addDataset">${I('upload', 16)} Add dataset</button></div>`,
        body: !ds ? W.empty('No official dataset loaded', 'Add a dataset with district, period (YYYY-MM) and value, for example grievances or scheme disbursement.') : `<p class="muted">${U.esc(ds.name)} · topic ${U.tname(ds.topic)} · ${gt.months.length} month(s) · ${gt.tc} critical items in coverage vs ${gt.to} ${U.esc(ds.unit || 'records')}${ds.sample ? ' · <b>fictional data</b>' : ''}</p>` +
          (gt.sufficient ? `<table class="tbl"><thead><tr><th>District</th><th class="r">Coverage</th><th class="r">Official</th><th>Share of coverage vs official</th><th>Read</th></tr></thead><tbody>${gt.rows.map(r => `<tr><td><b>${r.d.name}</b></td><td class="r">${r.cov}</td><td class="r">${r.off}</td><td style="min-width:220px">${C.stack([{ v: Math.round(r.cs * 100), color: 'var(--pri)', label: 'Coverage' }], { cls: 'thin' })}<small>coverage ${Math.round(r.cs * 100)}% · official ${Math.round(r.os * 100)}%</small></td><td>${r.flag === 'over' ? W.pill('More coverage than data suggests', 'warn') : r.flag === 'under' ? W.pill('Less coverage than data suggests', 'neg') : '<span class="muted">in line</span>'}</td></tr>`).join('')}</tbody></table><p class="muted sm">A divergence is a question to check (are grievances being recorded? is coverage proportionate?), not a finding.</p>` : W.empty('Not enough overlap', 'Needs at least 10 coverage items and 10 records in the same months.')) })}
      ${W.card({ cls: 'span12', title: 'Public association network', sub: 'Public figures and bodies that appear together in coverage in the selected window', body: nodes.length > 2 && links.length ? C.network(nodes, links) : W.empty('Not enough co-mentions in this window', 'Widen the time window.') })}
    </div>`;
  };
})(typeof window !== 'undefined' ? window : globalThis);

