/* Question answering over the structured item store. Rule-based intent parsing; every number is computed, never generated. */
(function (g) {
  const CGP = g.CGP;
  const R = CGP.ref, E = CGP.E, U = CGP.U, C = CGP.C, I = CGP.icon;
  const DAY = 86400000;
  const Q = (CGP.Q = {});

  C.postRow = it => `<div class="prow" data-item="${it.id}">
    ${C.chBadge(it.channel)}
    <div class="pbody"><div class="pmeta"><b>${U.esc(it.source)}</b><span>${U.ago(it.ts)} · ${U.dname(it.district)}</span>${C.stanceTag(it.stance)}</div><p>${U.esc(it.headline)}</p></div>
    <div class="pstats"><span>${I('heart', 14)}${U.fmt(it.likes)}</span><span>${I('share', 14)}${U.fmt(it.shares)}</span><span>${I('eye', 14)}${U.fmt(it.views)}</span><em class="tr" data-tip="Traction score (0-100)">${it.traction}</em></div></div>`;

  const tiles = a => `<div class="tiles">${a.map(t => `<div class="tile-s"><span>${t.l}</span><b>${t.v}</b>${t.d ? `<em class="${t.dc || ''}">${t.d}</em>` : ''}</div>`).join('')}</div>`;
  const section = (t, h) => `<div class="blk"><h5>${t}</h5>${h}</div>`;
  const T = p => (/^last/.test(p.label) ? 'the ' : '') + '<b>' + p.label + '</b>';
  const delta = (cur, prev) => (!prev ? null : { t: (cur >= prev ? '+' : '') + Math.round((100 * (cur - prev)) / prev) + '% vs prev', c: cur >= prev ? 'up' : 'down' });
  const netColor = n => (n > 10 ? 'var(--pos)' : n < -10 ? 'var(--neg)' : 'var(--pri2)');
  const sgn = n => (n > 0 ? '+' : '') + n;

  Q.parse = (q, st) => {
    const s = q.toLowerCase();
    const p = { q, days: st.days, range: null, label: null, district: null, districts: [], topics: [], speaker: null, channel: null, leader: null };
    let m;
    if (/yesterday/.test(s)) { const t = U.todayStart(); p.range = [t - DAY, t]; p.label = 'yesterday'; p.days = 1; }
    else if (/\btoday\b|last 24|past 24|24 ?h/.test(s)) { p.range = [U.todayStart(), Date.now() + 1]; p.label = 'today'; p.days = 1; }
    else if ((m = s.match(/(?:last|past|previous|in the)\s+(\d+)\s*(day|week|month)/))) { const n = Math.min(365, +m[1] * { day: 1, week: 7, month: 30 }[m[2]]); p.days = n; p.label = 'last ' + n + ' days'; }
    else if (/this week|last week|past week/.test(s)) { p.days = 7; p.label = 'last 7 days'; }
    else if (/this month|last month|past month|\bmonth\b/.test(s)) { p.days = 30; p.label = 'last 30 days'; }
    else if (/this year|last year|past year/.test(s) && !/same period|year on year|vs\.? last year/.test(s)) { p.days = 365; p.label = 'last 365 days'; }
    const MN = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const ym = s.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(20\d\d)\b/);
    const mo = s.match(/\b(?:in|during|for|of)\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/);
    if (ym) { const mi = MN.indexOf(ym[1].slice(0, 3)), y = +ym[2]; p.range = [new Date(y, mi, 1).getTime(), new Date(y, mi + 1, 1).getTime()]; p.label = ym[1][0].toUpperCase() + ym[1].slice(1) + ' ' + y; p.days = 30; }
    else if ((m = s.match(/\b(?:in|during)\s+(20\d\d)\b/))) { p.range = [new Date(+m[1], 0, 1).getTime(), new Date(+m[1] + 1, 0, 1).getTime()]; p.label = m[1]; p.days = 365; }
    else if ((m = s.match(/\bsince\s+(20\d\d)\b/))) { p.range = [new Date(+m[1], 0, 1).getTime(), Date.now() + 1]; p.label = 'since ' + m[1]; p.days = 365; }
    if (mo) p.month = MN.indexOf(mo[1].slice(0, 3));
    if ((m = s.match(/next\s+(\d+)\s*(week|month)/))) p.ahead = +m[1] * (m[2] === 'week' ? 7 : 30);    if (!p.range) { p.range = E.range(p.days); p.label = p.label || (p.days <= 1 ? 'last 24 hours' : 'last ' + p.days + ' days'); }

    const pos = {};
    R.districts.forEach(d => {
      const key = d.name.toLowerCase().split('-')[0];
      const i = s.indexOf(key);
      if (i >= 0 || s.indexOf(d.hi) >= 0) { p.districts.push(d.id); pos[d.id] = i; }
    });
    p.districts.sort((a, b) => pos[a] - pos[b]);
    p.district = p.districts[0] || (st.district !== 'all' ? st.district : null);

    const tp = [];
    R.topics.forEach(t => {
      const re = new RegExp('(?:^|[^a-z])(?:' + t.kw + ')', 'i');
      const mm = re.exec(s);
      if (mm) tp.push([mm.index, t.id]);
    });
    p.topics = tp.sort((a, b) => a[0] - b[0]).map(x => x[1]);

    if (/opposition|congress|\binc\b/.test(s)) p.speaker = 'opp';
    else if (/\bbjp\b/.test(s)) p.speaker = 'bjp';
    else if (/\bgovt\b|government|official/.test(s)) p.speaker = 'govt';
    else if (/citizen|public|people/.test(s)) p.speaker = 'citizen';

    if (/\bx\b|twitter|tweet/.test(s)) p.channel = 'X';
    else if (/facebook|\bfb\b/.test(s)) p.channel = 'Facebook';
    else if (/insta/.test(s)) p.channel = 'Instagram';
    else if (/youtube|\byt\b/.test(s)) p.channel = 'YouTube';
    else if (/newspaper|print|dailies|e-?paper/.test(s)) p.channel = 'News · Print';
    else if (/online news|portal|website/.test(s)) p.channel = 'News · Online';
    if (!p.channel && st.channel !== 'all') p.channel = st.channel;

    [['sai', 'Vishnu Deo Sai'], ['arun sao', 'Arun Sao'], ['vijay sharma', 'Vijay Sharma'], ['mahant', 'Charandas Mahant'], ['baghel', 'Bhupesh Baghel'], ['baij', 'Deepak Baij'], ['singh deo', 'T.S. Singh Deo']].forEach(a => {
      if (!p.leader && new RegExp('(?:^|[^a-z])' + a[0] + '(?:[^a-z]|$)').test(s)) p.leader = a[1];
    });

    // intent
    let it;
    if (p.month != null && /each year|every year|year by year|across years|since 20\d\d|over the years|per year/.test(s)) it = 'periods';
    else if (/same period last year|year on year|\byoy\b|vs\.? last year|compared? (to|with) (the )?(same|last year)|this month.*last year/.test(s)) it = 'yoy';
    else if (/promise|commitment|pledge|deadline|due soon/.test(s)) it = 'promise';
    else if (/next (\d+ )?(weeks?|months?)|coming weeks|expect|outlook|seasonal|upcoming/.test(s)) it = 'outlook';
    else if (/who (was|is|were)|as of /.test(s) && /minister|cm\b|chief|deputy|opposition|president|speaker|role/.test(s)) it = 'asof';
    else if (/(happened|occurred|came up|seen|had) (this )?before|earlier|precedent|history of|last time|previous(ly)?|recur|repeat|again\b|how often|every (year|monsoon|season)|trouble/.test(s)) it = 'history';
    else if (/\bsay(s|ing)?\b|\bsaid\b|statement|quote|quoted|claimed|stance|position on/.test(s) && (p.leader || p.topics.length || /leader r|spokesperson/.test(s))) it = 'statement';
    else if (/compare|\bvs\b|versus|difference between/.test(s) && (p.districts.length >= 2 || p.topics.length >= 2)) it = 'compare';
    else if (/how many|number of|count|how much|volume/.test(s) && /post|item|stor|mention|article|coverage|tweet|news|topic|volume|count/.test(s)) it = 'topic_count';
    else if (/\bmlas?\b|constituenc|legislator/.test(s)) it = 'mla';
    else if (p.leader && !/issue|raised|allege/.test(s)) it = 'leader';
    else if (/rumou?r|fake|misinfo|disinfo|false claim|viral claim/.test(s)) it = 'misinfo';
    else if (/traction|viral|engag|best perform|top post|most (liked|shared|viewed|popular)|trending|perform/.test(s)) it = 'traction';
    else if (/\bbrief\b|digest|daily summary|summary of the day/.test(s)) it = 'brief';
    else if (/oppos|congress|\binc\b|baghel|mahant|baij/.test(s)) it = 'opposition';
    else if (/negative|critic|backlash|anger|sentiment|unhappy|dislike/.test(s)) it = 'negative';
    else if (/concern|issue|problem|complain|grievance|pain point|worry/.test(s)) it = p.districts.length === 1 ? 'district' : 'concerns';
    else if (/\bcms?\b|chief minister|vishnu|published|coverage|pulse|mention/.test(s)) it = 'cm';
    else if (p.districts.length === 1) it = 'district';
    else if (p.topics.length) it = 'topic_count';
    else it = 'search';
    p.intent = it;
    return p;
  };

  const INTENT_LABEL = { history: 'History / precedent', outlook: 'Seasonal outlook', promise: 'Promises', yoy: 'Same period last year', periods: 'Period by period', asof: 'Role as of a date', statement: 'Statement record', cm: 'CM coverage', concerns: 'District concerns', negative: 'Negative drivers', opposition: 'Opposition issues', traction: 'Post traction', topic_count: 'Topic volume', mla: 'MLAs & constituencies', leader: 'Leader profile', district: 'District brief', compare: 'Comparison', misinfo: 'Rumours & misinformation', brief: 'Daily brief', search: 'Keyword search' };

  Q.chips = p => [
    ['Intent', INTENT_LABEL[p.intent]], ['Window', p.label],
    ['District', p.districts.length ? p.districts.map(U.dname).join(' + ') : p.district ? U.dname(p.district) : 'All 10'],
    ['Topic', p.topics.length ? p.topics.map(U.tshort).join(' + ') : 'Any'], ['Channel', p.channel || 'All']
  ];

  function evidence(items) {
    if (!items.length) return '';
    return `<div class="srcs"><span>Evidence</span>${items.slice(0, 5).map(i => `<button class="src" data-item="${i.id}">${C.chBadge(i.channel)}<em>${U.esc(i.source)}</em></button>`).join('')}</div>`;
  }

  Q.answer = (q, st) => {
    const p = Q.parse(q, st);
    const f = { range: p.range, channel: p.channel || 'all' };
    const all = CGP.items;
    let scope = E.scope(all, Object.assign({}, f, { district: p.districts.length === 1 || (p.district && p.intent !== 'compare') ? p.district : 'all' }));
    if (p.speaker && ['traction', 'topic_count', 'misinfo'].indexOf(p.intent) >= 0) scope = scope.filter(i => i.speakerType === p.speaker);
    if (p.topics.length && ['district', 'concerns', 'negative', 'cm', 'opposition', 'misinfo', 'brief'].indexOf(p.intent) >= 0) scope = scope.filter(i => p.topics.indexOf(i.topic) >= 0);
    const out = { p, html: '', ev: [] };
    const fn = A[p.intent] || A.search;
    const r = fn(p, scope, all, f);
    out.html = r.html; out.ev = r.ev || [];
    out.html += evidence(out.ev);
    return out;
  };

  const none = (p, extra) => ({ html: `<p class="lead">I could not find matching items for <b>${p.label}</b>${extra || ''} in the current dataset. Try a wider window, or clear the district or channel filter.</p>` });

  const A = {
    cm(p, scope, all, f) {
      const items = scope.filter(i => i.mentionsCM);
      if (!items.length) return none(p, ' mentioning the CM');
      const s = E.stats(items), prev = E.stats(E.scope(all, { range: E.range(p.days, 1), channel: f.channel, cm: true, district: p.district || 'all' }));
      const d = delta(s.n, prev.n);
      const topics = E.countBy(items, 'topic').slice(0, 6).map(x => {
        const ti = items.filter(i => i.topic === x.k), ts = E.stats(ti);
        return { label: U.tname(x.k), value: x.n, right: x.n + ' · net ' + sgn(ts.net), color: netColor(ts.net), sub: ts.critical + ' critical · ' + ts.support + ' supportive' };
      });
      const ch = E.countBy(items, 'channel').map(x => ({ v: x.n, color: U.chColor(x.k), label: x.k }));
      const html = `<p class="lead">In ${T(p)}, the Chief Minister was mentioned in <b>${s.n}</b> items across <b>${ch.length}</b> channels. <b>${U.pct(s.support, s.n)}%</b> were supportive and <b>${U.pct(s.critical, s.n)}%</b> critical (net <b>${sgn(s.net)}</b>). Biggest themes: <b>${topics.slice(0, 3).map(t => t.label).join(', ')}</b>.</p>
        ${tiles([{ l: 'Mentions', v: s.n, d: d && d.t, dc: d && d.c }, { l: 'Est. reach', v: (s.reach ? U.fmt(s.reach) : '—') }, { l: 'Supportive', v: U.pct(s.support, s.n) + '%' }, { l: 'Critical', v: U.pct(s.critical, s.n) + '%' }])}
        ${section('Channel mix', C.stack(ch) + `<div class="legend">${ch.map(c => `<span><i style="background:${c.color}"></i>${c.label} ${c.v}</span>`).join('')}</div>`)}
        ${section('What was written about the CM', C.hbars(topics))}
        ${section('Most amplified', E.top(items, 3).map(C.postRow).join(''))}`;
      return { html, ev: E.top(items, 5) };
    },

    concerns(p, scope, all, f) {
      const crit = scope.filter(i => i.stance < 0);
      if (!crit.length) return none(p);
      const rows = E.districts(scope, p.range).filter(r => r.concerns.length).sort((a, b) => b.concernScore - a.concernScore);
      const top = E.concerns(scope, 3, p.range);
      const html = `<p class="lead">Across the districts in ${T(p)}, the strongest concerns are <b>${top.map(t => t.issue).join('</b>, <b>')}</b>. Highest concern load: <b>${rows.slice(0, 3).map(r => r.d.name).join(', ')}</b>.</p>
        ${section('Key concern by district', `<table class="tbl"><thead><tr><th>District</th><th>Top concern</th><th>Next</th><th class="r">Critical items</th><th class="r">Net</th></tr></thead><tbody>${rows.map(r => `<tr class="click" data-district-open="${r.d.id}"><td><b>${r.d.name}</b></td><td>${U.esc(r.concerns[0].issue)} <small>(${r.concerns[0].n})</small></td><td class="muted">${r.concerns[1] ? U.esc(r.concerns[1].issue) : '—'}</td><td class="r">${r.st.critical}</td><td class="r"><span class="pill" style="--c:${netColor(r.st.net)}">${sgn(r.st.net)}</span></td></tr>`).join('')}</tbody></table>`)}
        ${section('Statewide concerns by weighted score', C.hbars(E.concerns(scope, 6, p.range).map(c => ({ label: U.esc(c.issue), value: c.score, right: c.n + ' items', color: 'var(--neg)', sub: 'Hotspots: ' + c.topDist.slice(0, 3).map(U.dname).join(', ') + (c.trend ? ' · ' + (c.trend > 0 ? '▲' : '▼') + Math.abs(c.trend) + '%' : '') }))))}`;
      return { html, ev: E.top(crit, 5) };
    },

    negative(p, scope, all, f) {
      const crit = scope.filter(i => i.stance < 0);
      if (!crit.length) return none(p);
      const s = E.stats(scope);
      const who = Object.keys(R.speakers).map(k => ({ v: crit.filter(i => i.speakerType === k).length, color: R.speakers[k].color, label: R.speakers[k].label }));
      const con = E.concerns(scope, 6, p.range);
      const html = `<p class="lead"><b>${U.pct(s.critical, s.n)}%</b> of items in ${T(p)} are critical (${s.critical} of ${s.n}). Sentiment is one signal among many, so the drivers matter more: <b>${con.slice(0, 3).map(c => c.issue).join('</b>, <b>')}</b>.</p>
        ${section('What is driving the criticism', C.hbars(con.map(c => ({ label: U.esc(c.issue), value: c.n, right: c.n + ' items', color: 'var(--neg)', sub: U.tname(c.topic) + ' · avg traction ' + c.avgTraction }))))}
        ${section('Who is saying it', C.stack(who) + `<div class="legend">${who.map(c => `<span><i style="background:${c.color}"></i>${c.label} ${c.v}</span>`).join('')}</div>`)}
        ${section('Most amplified critical posts', E.top(crit, 3).map(C.postRow).join(''))}`;
      return { html, ev: E.top(crit, 5) };
    },

    opposition(p, scope, all, f) {
      const o = E.opposition(scope, p.range);
      if (!o.length) return none(p, ' from the opposition');
      const oppItems = scope.filter(i => i.speakerType === 'opp');
      const html = `<p class="lead">The opposition raised <b>${o.length}</b> distinct issues in <b>${oppItems.length}</b> items in ${T(p)}. Leading: <b>${o.slice(0, 3).map(x => x.issue).join('</b>, <b>')}</b>. ${o.filter(x => x.gap).length} of them have little visible government-side response.</p>
        ${section('Issues raised by the opposition', `<table class="tbl"><thead><tr><th>Issue</th><th class="r">Items</th><th class="r">Traction</th><th>Where</th><th>Govt response</th></tr></thead><tbody>${o.slice(0, 8).map(x => `<tr><td><b>${U.esc(x.issue)}</b><small>${U.tname(x.topic)}</small></td><td class="r">${x.n}</td><td class="r">${x.avgTraction}</td><td class="muted">${Object.keys(x.dist).sort((a, b) => x.dist[b] - x.dist[a]).slice(0, 2).map(U.dname).join(', ')}</td><td>${x.gap ? '<span class="tag neg">Gap</span>' : '<span class="tag pos">Covered</span>'}</td></tr>`).join('')}</tbody></table>`)}
        ${section('Highest-traction opposition posts', E.top(oppItems, 3).map(C.postRow).join(''))}`;
      return { html, ev: E.top(oppItems, 5) };
    },

    traction(p, scope) {
      let items = scope;
      if (p.topics.length) items = items.filter(i => p.topics.indexOf(i.topic) >= 0);
      if (!items.length) return none(p);
      const top = E.top(items, 6);
      const chs = {}; items.forEach(i => { (chs[i.channel] = chs[i.channel] || []).push(i.traction); });
      const bych = Object.keys(chs).map(k => ({ label: k, value: Math.round(chs[k].reduce((a, b) => a + b, 0) / chs[k].length), color: U.chColor(k), right: 'avg ' + Math.round(chs[k].reduce((a, b) => a + b, 0) / chs[k].length) })).sort((a, b) => b.value - a.value);
      const html = `<p class="lead">The best-performing item in ${T(p)}${p.topics.length ? ' on ' + p.topics.map(U.tshort).join(' / ') : ''} is <b>"${U.esc(top[0].headline)}"</b> by ${U.esc(top[0].source)}, with <b>${U.fmt(top[0].views)}</b> views and <b>${U.fmt(top[0].shares)}</b> shares (traction ${top[0].traction}).</p>
        ${section('Top posts by traction', top.map(C.postRow).join(''))}
        ${section('Average traction by channel', C.hbars(bych))}`;
      return { html, ev: top };
    },

    topic_count(p, scope) {
      const social = i => i.channel.indexOf('News') !== 0;
      const ids = p.topics.length ? p.topics : R.topics.map(t => t.id);
      const rows = ids.map(id => {
        const its = scope.filter(i => i.topic === id), so = its.filter(social);
        const by = {}; Object.keys(R.speakers).forEach(k => (by[k] = its.filter(i => i.speakerType === k).length));
        return { id, its, so, by };
      });
      if (!rows.some(r => r.its.length)) return none(p);
      const tot = rows.reduce((a, r) => a + r.its.length, 0);
      const lead = p.topics.length
        ? `In ${T(p)}${p.district ? ' in <b>' + U.dname(p.district) + '</b>' : ''}${p.channel ? ' on <b>' + p.channel + '</b>' : ''}: ` + rows.map(r => `<b>${U.tname(r.id)}</b> had <b>${r.its.length}</b> items (${r.so.length} social posts, ${r.its.length - r.so.length} news)`).join('; ') + '.'
        : `<b>${tot}</b> items in ${T(p)}. Most discussed: <b>${rows.sort((a, b) => b.its.length - a.its.length).slice(0, 3).map(r => U.tname(r.id)).join(', ')}</b>.`;
      const legend = `<div class="legend">${Object.keys(R.speakers).map(k => `<span><i style="background:${R.speakers[k].color}"></i>${R.speakers[k].label}</span>`).join('')}</div>`;
      const html = `<p class="lead">${lead}</p>
        ${section('Who is talking about it', rows.sort((a, b) => b.its.length - a.its.length).slice(0, 10).map(r => `<div class="trow"><span>${U.tname(r.id)}</span>${C.stack(Object.keys(R.speakers).map(k => ({ v: r.by[k], color: R.speakers[k].color, label: R.speakers[k].label })), { cls: 'thin' })}<b>${r.its.length}</b></div>`).join('') + legend)}
        ${p.topics.length === 1 ? section('Official side vs opposition', tiles([{ l: 'Govt + BJP posts', v: rows[0].by.govt + rows[0].by.bjp }, { l: 'Opposition posts', v: rows[0].by.opp }, { l: 'Media items', v: rows[0].by.media }, { l: 'Citizen posts', v: rows[0].by.citizen }])) : ''}`;
      return { html, ev: E.top(rows.reduce((a, r) => a.concat(r.its), []), 5) };
    },

    mla(p, scope) {
      const seats = E.seats(scope).filter(s => !p.districts.length || p.districts.indexOf(s.district) >= 0).sort((a, b) => b.n - a.n);
      const html = `<p class="lead">Constituency coverage for ${T(p)}${p.districts.length ? ' in ' + p.districts.map(U.dname).join(', ') : ''}. The busiest are <b>${seats.slice(0, 3).map(s => s.seat).join(', ')}</b>. MLA names and party need the ECI import (Data tab).</p>
        ${section('Constituencies', `<table class="tbl"><thead><tr><th>Constituency</th><th>District</th><th>MLA</th><th class="r">Items</th><th class="r">Net</th><th>Top issue</th></tr></thead><tbody>${seats.slice(0, 12).map(s => `<tr><td><b>${s.seat}</b></td><td class="muted">${U.dname(s.district)}</td><td class="muted">${U.esc((CGP.mlas[s.seat] || {}).name || 'Pending import')}</td><td class="r">${s.n}</td><td class="r"><span class="pill" style="--c:${netColor(s.st.net)}">${s.n ? sgn(s.st.net) : '—'}</span></td><td>${U.esc(s.top)}</td></tr>`).join('')}</tbody></table>`)}`;
      return { html, ev: E.top(scope.filter(i => seats.slice(0, 3).some(s => s.seat === i.constituency)), 4) };
    },

    leader(p, scope) {
      const items = scope.filter(i => i.entities.indexOf(p.leader) >= 0);
      if (!items.length) return none(p, ' mentioning ' + p.leader);
      const s = E.stats(items), l = R.leaders.filter(x => x.name === p.leader)[0];
      const html = `<p class="lead"><b>${p.leader}</b> (${l.role}, ${l.party}) appeared in <b>${s.n}</b> items in ${T(p)}${l.group === 'govt' ? `: <b>${U.pct(s.support, s.n)}%</b> supportive, <b>${U.pct(s.critical, s.n)}%</b> critical` : `, mostly in coverage of <b>${E.countBy(items, 'topic').slice(0, 2).map(x => U.tname(x.k)).join('</b> and <b>')}</b>`}.</p>
        ${tiles([{ l: 'Mentions', v: s.n }, { l: 'Est. reach', v: (s.reach ? U.fmt(s.reach) : '—') }, l.group === 'govt' ? { l: 'Net', v: sgn(s.net) } : { l: 'Avg traction', v: s.avgTraction }, { l: 'Avg traction', v: s.avgTraction }].filter((t, i, a) => i < 3 || l.group === 'govt'))}
        ${section('Linked topics', C.hbars(E.countBy(items, 'topic').slice(0, 5).map(x => ({ label: U.tname(x.k), value: x.n }))))}
        ${section('Top items', E.top(items, 3).map(C.postRow).join(''))}`;
      return { html, ev: E.top(items, 5) };
    },

    district(p, scope) {
      if (!scope.length) return none(p, ' for ' + U.dname(p.district));
      const d = R.districts.filter(x => x.id === p.district)[0], s = E.stats(scope);
      const con = E.concerns(scope, 4, p.range);
      const html = `<p class="lead"><b>${d.name}</b> (${d.note}) had <b>${s.n}</b> items${p.topics.length ? ' on <b>' + p.topics.map(U.tshort).join(' / ') + '</b>' : ''} in ${T(p)}, net <b>${sgn(s.net)}</b>. ${con.length ? 'Top concern: <b>' + U.esc(con[0].issue) + '</b>.' : ''}</p>
        ${tiles([{ l: 'Items', v: s.n }, { l: 'Est. reach', v: (s.reach ? U.fmt(s.reach) : '—') }, { l: 'Critical', v: U.pct(s.critical, s.n) + '%' }, { l: 'Supportive', v: U.pct(s.support, s.n) + '%' }])}
        ${section('Concerns raised', C.hbars(con.map(c => ({ label: U.esc(c.issue), value: c.score, right: c.n + ' items', color: 'var(--neg)', sub: U.tname(c.topic) }))))}
        ${section('Most amplified', E.top(scope, 3).map(C.postRow).join(''))}`;
      return { html, ev: E.top(scope, 5) };
    },

    compare(p, scope, all, f) {
      const byDist = p.districts.length >= 2;
      const keys = byDist ? p.districts.slice(0, 3) : p.topics.slice(0, 3);
      const cols = keys.map(k => {
        const its = E.scope(all, Object.assign({}, f, byDist ? { district: k } : { topic: k, district: p.district || 'all' }));
        return { k, s: E.stats(its), c: E.concerns(its, 1, p.range)[0], its };
      });
      const nm = k => (byDist ? U.dname(k) : U.tname(k));
      const html = `<p class="lead">Comparing <b>${cols.map(c => nm(c.k)).join(' vs ')}</b> over ${T(p)}.</p>
        ${section('Side by side', `<table class="tbl"><thead><tr><th></th>${cols.map(c => `<th class="r">${nm(c.k)}</th>`).join('')}</tr></thead><tbody>
          <tr><td>Items</td>${cols.map(c => `<td class="r">${c.s.n}</td>`).join('')}</tr>
          <tr><td>Est. reach</td>${cols.map(c => `<td class="r">${U.fmt(c.s.reach)}</td>`).join('')}</tr>
          <tr><td>Supportive</td>${cols.map(c => `<td class="r">${U.pct(c.s.support, c.s.n)}%</td>`).join('')}</tr>
          <tr><td>Critical</td>${cols.map(c => `<td class="r">${U.pct(c.s.critical, c.s.n)}%</td>`).join('')}</tr>
          <tr><td>Net stance</td>${cols.map(c => `<td class="r"><span class="pill" style="--c:${netColor(c.s.net)}">${sgn(c.s.net)}</span></td>`).join('')}</tr>
          <tr><td>Top concern</td>${cols.map(c => `<td class="r">${c.c ? U.esc(c.c.issue) : '—'}</td>`).join('')}</tr></tbody></table>`)}`;
      return { html, ev: E.top(cols.reduce((a, c) => a.concat(c.its), []), 4) };
    },

    misinfo(p, scope) {
      const items = scope.filter(i => i.misinfo >= 0.5);
      if (!items.length) return { html: `<p class="lead">No items scored as high misinformation risk in ${T(p)}.</p>` };
      const g = E.countBy(items, 'issue');
      const html = `<p class="lead"><b>${items.length}</b> items in ${T(p)} score as high misinformation risk, mostly about <b>${g.slice(0, 2).map(x => x.k).join('</b> and <b>')}</b>. These are model risk scores that need a human check, not verdicts.</p>
        ${section('Claims under watch', C.hbars(g.map(x => { const its = items.filter(i => i.issue === x.k); return { label: U.esc(x.k), value: x.n, right: x.n + ' posts', color: 'var(--warn)', sub: 'Reach ' + U.fmt(its.reduce((a, i) => a + i.views, 0)) + ' · ' + Object.keys(its.reduce((m, i) => ((m[i.channel] = 1), m), {})).join(', ') }; })))}
        ${section('Most shared', E.top(items, 3, 'shares').map(C.postRow).join(''))}`;
      return { html, ev: E.top(items, 5) };
    },

    brief(p, scope) {
      const b = E.brief(scope, p.range, p.label);
      if (!b.st.n) return none(p);
      const html = `<p class="lead">Here is the brief for ${T(p)}: <b>${b.st.n}</b> items, CM mentioned in <b>${b.cm.n}</b>. Top concerns: <b>${b.con.slice(0, 3).map(c => c.issue).join('</b>, <b>')}</b>. Hotspots: <b>${b.dists.map(d => d.d.name).join(', ')}</b>.</p>
        ${section('Positives worth amplifying', C.hbars(b.pos.map(x => ({ label: U.esc(x.k), value: x.n, color: 'var(--pos)' }))))}
        <button class="btn" data-nav="brief">${I('doc', 16)} Open full brief</button>`;
      return { html, ev: b.top };
    },

    search(p, scope) {
      const words = p.q.toLowerCase().replace(/[^a-z0-9\u0900-\u097f ]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !/^(what|which|show|tell|about|from|with|that|this|have|were|been|last|days|posts)$/.test(w));
      const hit = scope.filter(i => { const t = (i.headline + ' ' + i.text + ' ' + i.issue + ' ' + i.hashtags.join(' ')).toLowerCase(); return words.some(w => t.indexOf(w) >= 0); });
      if (!hit.length) return { html: `<p class="lead">I did not find a match for that. I can answer questions on <b>CM coverage, district concerns, negative drivers, opposition issues, post traction, topic volume, MLAs and rumours</b>. Try one of the suggestions on the right.</p>` };
      return { html: `<p class="lead">Found <b>${hit.length}</b> items matching <b>${words.join(', ')}</b> in ${T(p)}.</p>${section('Top matches', E.top(hit, 5).map(C.postRow).join(''))}`, ev: E.top(hit, 5) };
    }
  };

  // ───── memory and history intents ─────
  const STOP = /^(what|which|show|tell|about|from|with|that|this|have|were|been|last|days|posts|happen|happened|before|earlier|there|trouble|again|issue|issues|time|previous|previously|many|often|does|come|came|seen|ever|year)$/;
  const lifeRow = e => `<div class="orow"><div><b>${CGP.M.lifecycle(e)}</b><p>${Object.keys(e.dists).sort((a, b) => e.dists[b] - e.dists[a]).slice(0, 3).map(U.dname).join(', ') || 'place not stated'} · ${e.ids.length} items</p></div>${CGP.W.ev(e.ids, 1).replace('<span>Evidence</span>', '')}</div>`;
  Object.assign(A, {
    history(p) {
      const M = CGP.M, W = CGP.W, St = M.S;
      const words = p.q.toLowerCase().replace(/[^a-z0-9\u0900-\u097f ]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !STOP.test(w));
      const cands = Object.keys(St.byIssue).map(k => { const kl = k.toLowerCase(), arr = St.byIssue[k]; let sc = words.filter(w => kl.indexOf(w) >= 0).length; if (p.topics.length && p.topics.indexOf(arr[0].topic) >= 0) sc += 1; if (p.district && arr.some(i => i.district === p.district)) sc += 0.3; return { k, sc, n: arr.length, neg: arr.filter(i => i.stance < 0).length / arr.length }; })
        .filter(x => x.sc >= 1 && x.n >= 3).sort((a, b) => b.sc - a.sc || b.neg - a.neg || b.n - a.n).slice(0, 3);
      if (!cands.length) return { html: `<p class="lead">I could not match that to an issue in the archive (it starts ${U.dstr(St.dmin)}). Try naming the issue or topic, for example “Has paddy procurement trouble happened before?”.</p>` };
      const h0 = M.historyLine(cands[0].k, p.district);
      const lead = h0.kind === 'none' ? `For <b>${U.esc(cands[0].k)}</b>: ${U.esc(h0.text)}` : `Yes. For <b>${U.esc(cands[0].k)}</b>: ${U.esc(h0.text)}`;
      const blocks = cands.map(c => { const pre = M.precedents(c.k, p.district, 3), h = M.historyLine(c.k, p.district); return `<div class="blk"><h5>${U.esc(c.k)}</h5>${W.hist(c.k, p.district)}${c === cands[0] ? (pre.length ? pre.map(lifeRow).join('') : '<p class="muted sm">No closed precedent yet.</p>') : ''}</div>`; }).join('');
      return { html: `<p class="lead">${lead}</p>${blocks}<p class="muted sm">Precedents are matched by issue, topic and place. Association only; episode counts show how much evidence stands behind each line.</p>`, ev: h0.ids ? h0.ids.map(id => CGP.index[id]).filter(Boolean) : [] };
    },
    outlook(p) {
      const M = CGP.M, W = CGP.W, d = p.ahead || M.HORIZON, out = M.outlook(d), cal = M.calendarNow(d);
      if (!out.length) return { html: `<p class="lead">History does not show an unusual pattern for the next ${d} days. The archive covers ${Math.round((M.S.now - M.S.dmin) / (30 * DAY))} month(s); seasonal reads need about a year.</p>${cal.length ? '<div class="blk"><h5>Calendar</h5>' + cal.map(c => `<div class="orow"><div><b>${c.name}</b><p>${c.note}</p></div></div>`).join('') + '</div>' : ''}` };
      return { html: `<p class="lead">In the next <b>${d} days</b> history says to watch <b>${out.slice(0, 3).map(o => o.issue).join('</b>, <b>')}</b>. These issues were unusually active in the same weeks of earlier years.</p>
        <div class="blk"><h5>Seasonal watch</h5>${out.slice(0, 6).map(o => `<div class="orow"><div>${W.ilink(o.issue)}<p>${o.hist.join(', ')} items in the same weeks of earlier years vs ${o.base.toFixed(0)} typical (${o.lift.toFixed(1)}×) · ${o.eps.length} episode(s) then</p></div>${C.meter(o.conf)}</div>`).join('')}</div>
        ${cal.length ? '<div class="blk"><h5>Calendar context</h5>' + cal.map(c => `<div class="orow"><div><b>${c.name}</b><p>${c.note}</p></div></div>`).join('') + '</div>' : ''}`, ev: [] };
    },
    promise(p) {
      const M = CGP.M, W = CGP.W, all = M.commitments().filter(c => !c.rival), due = all.filter(c => c.dueSoon);
      if (!all.length) return { html: '<p class="lead">No commitments are tracked yet. Add them on the Promises screen.</p>' };
      const row = c => `<tr><td><b>${U.esc(c.text)}</b><small>${U.esc(c.who)}</small></td><td>${c.deadline || '—'}${c.daysLeft != null ? `<small>${c.daysLeft >= 0 ? c.daysLeft + ' days left' : -c.daysLeft + ' days past'}</small>` : ''}</td><td>${W.pill(c.status, /Delivered/.test(c.status) ? 'pos' : /Delayed|rising/.test(c.status) ? 'neg' : 'neu')}</td><td class="r">${c.ev.total}</td></tr>`;
      return { html: `<p class="lead"><b>${all.length}</b> commitments are tracked; <b>${due.length}</b> ${due.length === 1 ? 'is' : 'are'} due within 30 days or just missed and not yet delivered per coverage. Status reflects media coverage, not official data.</p>
        <div class="blk"><h5>${due.length ? 'Due soon' : 'Register'}</h5><table class="tbl"><thead><tr><th>Commitment</th><th>Deadline</th><th>Status</th><th class="r">Evidence</th></tr></thead><tbody>${(due.length ? due : all).map(row).join('')}</tbody></table></div>`, ev: (due[0] || all[0]).ids.map(id => CGP.index[id]).filter(Boolean) };
    },
    yoy(p) {
      const M = CGP.M, W = CGP.W, St = M.S, days = Math.max(7, Math.min(90, p.days <= 1 ? 30 : p.days)), A = [St.now - days * DAY, St.now], B = [A[0] - 365 * DAY, A[1] - 365 * DAY];
      if (B[0] < St.dmin - 2 * DAY) return { html: `<p class="lead">I cannot compare with the same period last year yet: the archive starts <b>${U.dstr(St.dmin)}</b> and that window begins ${U.dstr(B[0])}. I can compare with the previous ${days} days instead (ask “compare with the previous ${days} days”). The archive grows every day.</p>` };
      const items = p.district ? St.items.filter(i => i.district === p.district) : St.items, c = M.compare(items, A, B);
      return { html: `<p class="lead">Last <b>${days} days</b> (${c.na} items) versus the same days a year earlier (${c.nb} items). The biggest shifts in share: <b>${c.issues.slice(0, 3).map(x => x.k).join('</b>, <b>')}</b>.</p>
        <div class="blk"><h5>Topic share</h5>${C.hbars(c.topics.slice(0, 7).map(x => ({ label: U.tname(x.k), value: Math.round(x.a * 100) + 1, right: Math.round(x.a * 100) + '% vs ' + Math.round(x.b * 100) + '%', color: x.a >= x.b ? 'var(--warn)' : 'var(--sky)' })))}</div>
        <div class="blk"><h5>Issue shifts</h5><table class="tbl"><tbody>${c.issues.map(x => `<tr><td>${W.ilink(x.k)}</td><td class="r">${x.na} vs ${x.nb}</td><td class="r">${W.pill(x.ratio >= 1 ? x.ratio.toFixed(1) + '× more' : (1 / x.ratio).toFixed(1) + '× less', x.ratio >= 1 ? 'warn' : 'pos')}</td></tr>`).join('')}</tbody></table></div>`, ev: [] };
    },
    periods(p) {
      const M = CGP.M, W = CGP.W, St = M.S, mn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][p.month];
      const y0 = (p.range && /^since/.test(p.label)) ? new Date(p.range[0]).getFullYear() : new Date(St.dmin).getFullYear(), y1 = new Date().getFullYear();
      const rows = []; let ev = [];
      for (let y = y0; y <= y1; y++) {
        const a = new Date(y, p.month, 1).getTime(), b = new Date(y, p.month + 1, 1).getTime();
        if (b < St.dmin || a > St.now) continue;
        let its = St.items.filter(i => i.ts >= a && i.ts < b && i.stance < 0);
        if (p.topics.length) its = its.filter(i => p.topics.indexOf(i.topic) >= 0);
        const top = E.countBy(its, 'issue').slice(0, 3);
        rows.push({ y, n: its.length, top, partial: a < St.dmin || b > St.now }); ev = ev.concat(its.slice(0, 2));
      }
      if (!rows.length || rows.every(r => !r.n)) return { html: `<p class="lead">Nothing in the archive for ${mn}${p.topics.length ? ' on ' + p.topics.map(U.tshort).join('/') : ''}. The archive starts ${U.dstr(St.dmin)}.</p>` };
      return { html: `<p class="lead">Main concerns in <b>${mn}</b>${p.topics.length ? ' on <b>' + p.topics.map(U.tshort).join(' / ') + '</b>' : ''}, year by year. Years before the archive starts are missing, not empty.</p>
        <div class="blk"><table class="tbl"><thead><tr><th>Year</th><th class="r">Critical items</th><th>Top issues</th></tr></thead><tbody>${rows.map(r => `<tr><td><b>${r.y}</b>${r.partial ? '<small>partial month</small>' : ''}</td><td class="r">${r.n}</td><td>${r.top.map(t => `${W.ilink(t.k)} <small>${t.n}</small>`).join('<br>') || '—'}</td></tr>`).join('')}</tbody></table></div>`, ev };
    },
    asof(p) {
      const M = CGP.M, W = CGP.W, ts = /^(since|last|next)/.test(p.label || '') || !p.range ? Date.now() : p.range[0];
      const roles = M.asOf(ts);
      return { html: `<p class="lead">Roles on record as of <b>${U.dstr(ts)}</b>. Dates are approximate, from public reports; a curator should verify them.</p><div class="blk">${roles.map(r => `<div class="orow"><div><b>${U.esc(r.who)}</b><p>${U.esc(r.role)} · since ${U.esc(r.from)}</p></div></div>`).join('') || '<p class="muted">No role on record for that date.</p>'}</div>` };
    },
    statement(p) {
      const M = CGP.M, ss = M.statements().filter(s => (!p.leader || s.speaker.toLowerCase().indexOf(p.leader.toLowerCase().split(' ')[0]) >= 0) && (!p.topics.length || p.topics.indexOf(s.topic) >= 0));
      if (!ss.length) return { html: `<p class="lead">No stored statements${p.leader ? ' for ' + U.esc(p.leader) : ''}${p.topics.length ? ' on ' + p.topics.map(U.tshort).join('/') : ''}. Add verbatim quotes on the Voices screen; I do not paraphrase from memory.</p>` };
      return { html: `<p class="lead"><b>${ss.length}</b> stored statement(s), verbatim.</p><div class="blk">${ss.slice(0, 6).map(s => `<blockquote class="stq"><p>“${U.esc(s.quote)}”</p><cite>${U.esc(s.speaker)} · ${U.dstr(s.date)}${s.venue ? ' · ' + U.esc(s.venue) : ''}${s.sample ? ' · fictional' : ''}</cite></blockquote>`).join('')}</div>` };
    }
  });

  CGP.mlas = CGP.mlas || {};
})(typeof window !== 'undefined' ? window : globalThis);



