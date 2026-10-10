(function (g) {
  const CGP = g.CGP;
  const R = CGP.ref, E = CGP.E, U = CGP.U, C = CGP.C, I = CGP.icon;
  const DAY = 86400000;
  const V = (CGP.V = {});
  const sgn = n => (n > 0 ? '+' : '') + n;
  const netColor = n => (n > 10 ? 'var(--pos)' : n < -10 ? 'var(--neg)' : 'var(--pri2)');
  const initials = n => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const card = o => `<section class="card ${o.cls || ''}">${o.title ? `<header class="ch"><div><h3>${o.title}</h3>${o.sub ? `<p>${o.sub}</p>` : ''}</div>${o.right || ''}</header>` : ''}${o.body}</section>`;
  const dchip = (cur, prev, ok) => {
    if (!ok || !prev) return '';
    const p = Math.round((100 * (cur - prev)) / prev);
    return `<span class="delta ${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p)}%</span>`;
  };
  const cu = (v, suffix) => `<b class="cu" data-v="${v}" data-s="${suffix || ''}">${v}${suffix || ''}</b>`;
  const legend = rows => `<div class="legend">${rows.map(r => `<span><i style="background:${r.color}"></i>${r.label}${r.n != null ? ' <em>' + r.n + '</em>' : ''}</span>`).join('')}</div>`;

  function ctx(S) {
    const range = E.range(S.days), prevRange = E.range(S.days, 1);
    const items = E.scope(CGP.items, { range, channel: S.channel, district: S.district });
    const prev = E.scope(CGP.items, { range: prevRange, channel: S.channel, district: S.district });
    return { range, prevRange, items, prev, st: E.stats(items), pst: E.stats(prev), prevOk: prevRange[0] >= CGP.dataMin - DAY, label: S.days <= 1 ? 'last 24 hours' : 'last ' + S.days + ' days' };
  }
  V.ctx = ctx;

  // ───────────── Pulse ─────────────
  V.pulse = S => {
    const x = ctx(S);
    const cm = x.items.filter(i => i.mentionsCM), cmS = E.stats(cm);
    const cmPrev = x.prev.filter(i => i.mentionsCM), cmP = E.stats(cmPrev);
    const ser = E.series(cm, S.days), all = E.series(x.items, S.days);
    const alerts = E.alerts(CGP.items, S);
    const con = E.concerns(x.items, 6, x.range);
    const dist = E.districts(x.items, x.range);
    const chs = E.countBy(x.items, 'channel');
    const top = E.top(x.items, 4);
    const eng = x.st.eng, engP = x.pst.eng;

    const hero = `<section class="card hero">
        <div class="blob b1"></div><div class="blob b2"></div>
        <div class="hero-top"><div class="avatar lg">${initials(R.cm)}</div><div><span class="eyebrow">Chief Minister pulse · ${x.label}</span><h2>Honorable ${R.cm}</h2></div></div>
        <div class="hero-mid"><div class="big">${cu(cmS.n)}<small>items mention the CM</small>${dchip(cmS.n, cmP.n, x.prevOk)}</div><div class="hero-spark">${C.spark(ser.totals, { h: 74, color: '#fff' })}</div></div>
        <div class="hero-bot">
          <div><span>Supportive</span><b>${U.pct(cmS.support, cmS.n)}%</b></div>
          <div><span>Critical</span><b>${U.pct(cmS.critical, cmS.n)}%</b></div>
          <div><span>Est. reach</span><b>${cmS.reach ? U.fmt(cmS.reach) : '—'}</b></div>
          <div><span>Net stance</span><b>${sgn(cmS.net)}</b></div>
        </div></section>`;

    const kpis = `<div class="kpi-grid">
      ${card({ cls: 'kpi', body: `<span class="kl">Items tracked</span><div class="kv">${cu(x.st.n)}${dchip(x.st.n, x.pst.n, x.prevOk)}</div><div class="ks">${C.spark(all.totals, { h: 34, color: 'var(--pri)' })}</div>` })}
      ${card({ cls: 'kpi', body: `<span class="kl">Net stance · all items</span><div class="kv"><b>${sgn(x.st.net)}</b></div>${C.gauge(x.st.net)}` })}
      ${card({ cls: 'kpi', body: `<span class="kl">Engagement</span><div class="kv">${eng ? cu(U.fmt(eng)) : '<b>—</b>'}${dchip(eng, engP, x.prevOk)}</div><div class="ks">${C.spark(all.pos, { h: 34, color: 'var(--pos)' })}</div>` })}
      ${card({ cls: 'kpi ' + (alerts.length ? 'warn' : ''), body: `<span class="kl">Active alerts</span><div class="kv">${cu(alerts.length)}</div><p class="kp">${alerts.length ? U.esc(alerts[0].issue) : 'All quiet'}</p>` })}
    </div>`;

    const area = card({ cls: 'span8', title: 'Coverage over time', sub: 'Items per ' + (S.days <= 1 ? 'hour' : 'day') + ', by channel', right: `<span class="chip">${x.items.length} items</span>`,
      body: C.stackedArea(all) + legend(R.channels.filter(c => chs.some(h => h.k === c.id)).map(c => ({ label: c.id, color: c.color }))) });

    const donut = card({ cls: 'span4', title: 'Channel mix', sub: 'Where the conversation happens',
      body: `<div class="donut-wrap">${C.donut(chs.map(c => ({ label: c.k, value: c.n, color: U.chColor(c.k) })), { big: U.fmt(x.items.length), small: 'items' })}<div class="dl">${chs.map(c => `<div><i style="background:${U.chColor(c.k)}"></i><span>${c.k}</span><b>${U.pct(c.n, x.items.length)}%</b></div>`).join('')}</div></div>` });

    const concerns = card({ cls: 'span5', title: 'Key concerns', sub: 'Weighted by volume and traction', right: `<button class="link" data-ask="What are the key concerns from the 10 districts?">Ask ${I('up', 14)}</button>`,
      body: (con.length ? C.hbars(con.map(c => ({ label: `<button class="ilink" data-open-issue="${U.esc(c.issue)}">${U.esc(c.issue)}</button>`, value: c.score, right: c.n, color: 'var(--neg)', sub: c.topDist.slice(0, 3).map(U.dname).join(' · ') + (c.trend > 25 ? ' · ▲ rising' : c.trend < -25 ? ' · ▼ easing' : '') }))) + '<h5>History</h5>' + con.slice(0, 3).map(c => CGP.W.hist(c.issue)).join('') : '<p class="empty">No critical items in this window.</p>') });

    const map = card({ cls: 'span7', title: 'District heat', sub: 'Concern load per district · click for detail',
      right: `<button class="link" data-nav="districts">Open ${I('up', 14)}</button>`,
      body: C.tileMap(dist.map(r => ({ d: r.d, value: r.concernScore, label: r.concernScore, tone: 'var(--neg)', tip: `<b>${r.d.name}</b> · ${r.st.n} items<br>Net ${sgn(r.st.net)}<br>${r.concerns[0] ? U.esc(r.concerns[0].issue) : ''}` }))) });

    const al = card({ cls: 'span5', title: 'Alerts', sub: 'Last 24h vs the prior 6-day daily average',
      body: alerts.length ? `<div class="alerts">${alerts.map(a => `<button class="alert ${a.sev}" data-ask="What are the key concerns in ${U.dname(a.topDist[0])}?"><span class="ad">${I('alert', 16)}</span><div><b>${U.esc(a.issue)}</b><p>${a.topDist.map(U.dname).join(', ')} · ${a.last24} items in 24h vs ${a.base.toFixed(1)}/day${a.misinfo >= 2 ? ' · rumour risk' : ''}</p></div><em>${a.ratio >= 10 ? '10x+' : a.ratio.toFixed(1) + 'x'}</em></button>`).join('')}</div>` : '<p class="empty">No spikes detected.</p>' });

    const posts = card({ cls: 'span7', title: 'Top posts by traction', sub: 'Across all channels', right: `<button class="link" data-nav="social">All posts ${I('up', 14)}</button>`, body: top.map(C.postRow).join('') });

    const W = CGP.W, M = CGP.M;
    const role = R.roles.find(r => r.id === S.role) || R.roles[0];
    const quick = card({ cls: 'span12 quick', body: `<div class="qrow"><div><span class="eyebrow dark">${role.mode} view · ${role.label}</span><p>${role.blurb}</p></div><div class="chips">${role.quick.map(q => `<button class="btn ghost" ${q[1].indexOf('ask:') === 0 ? `data-ask="${U.esc(q[1].slice(4))}"` : `data-nav="${q[1].slice(4)}"`}>${q[0]}</button>`).join('')}</div></div>` });
    const hist = con.slice(0, 3).map(c => W.hist(c.issue)).join('');
    const out = M.outlook().slice(0, 3), sys = M.systemic().slice(0, 1), an = M.analogues().slice(0, 1), rs = M.resurfacing().slice(0, 2), co = M.coordinated().slice(0, 1);
    const sig = card({ cls: 'span12', title: 'Memory signals', sub: 'What history adds to today\'s picture', right: `<button class="link" data-nav="memory">Open memory ${I('up', 14)}</button>`, body: `<div class="sigs">
      <div><h5>Seasonal watch</h5>${out.length ? out.map(o => `<div class="orow"><div>${W.ilink(o.issue)}<p>${o.lift.toFixed(1)}× typical in these weeks of earlier years</p></div>${C.meter(o.conf)}</div>`).join('') : '<p class="muted sm">No seasonal signal yet. Needs about a year of history.</p>'}</div>
      <div><h5>Patterns</h5>${sys.concat(an, co).map(W.corr).join('') || '<p class="muted sm">No systemic, analogue or coordinated pattern right now.</p>'}</div>
      <div><h5>Resurfacing</h5>${rs.length ? rs.map(r => `<div class="orow"><div><b>${U.esc(r.recent.headline.slice(0, 90))}</b><p>Close match to ${U.dstr(r.original.ts)} (${U.esc(r.original.source)})</p></div>${W.pill('check', 'warn')}</div>`).join('') : '<p class="muted sm">No old content resurfacing.</p>'}</div></div>` });

    return `<div class="bento">${quick}${hero}${kpis}${area}${donut}${concerns}${map}${al}${posts}${sig}</div>`;
  };

  // ───────────── Ask ─────────────
  const PROMPTS = [
    ['cm', 'What was published about the CM in the last 7 days?', 'CM coverage', 'pulse'],
    ['concerns', 'Key concerns from the 10 districts', 'District concerns', 'map'],
    ['hist', 'Has paddy procurement trouble happened before?', 'Has this happened before?', 'clock'],
    ['opp', 'All issues raised by the opposition in the last 7 days', 'Opposition issues', 'opp'],
    ['season', 'What should we expect in the next 6 weeks?', 'Seasonal outlook', 'trend'],
    ['promise', 'Which promises are due soon?', 'Promises', 'check'],
    ['yoy', 'Compare this month with the same period last year', 'Same period last year', 'layers'],
    ['topic', 'How many posts on women empowerment and housing?', 'Topic volume', 'users']
  ];  V.prompts = PROMPTS;

  V.chatMsg = m => {
    if (m.role === 'user') return `<div class="msg user"><div class="bub">${U.esc(m.text)}</div></div>`;
    if (m.pending) return `<div class="msg ai"><div class="avatar sm ai">${I('spark', 16)}</div><div class="bub thinking"><span></span><span></span><span></span></div></div>`;
    return `<div class="msg ai"><div class="avatar sm ai">${I('spark', 16)}</div><div class="bub ans">
      <div class="interp">${Q_chips(m.p)}</div>${m.html}
      <div class="ans-foot">Computed from the structured dataset · every claim links to evidence items${CGP.mode === 'sample' ? ' · <b>sample data</b>' : CGP.mode === 'live' ? ' · auto-tagged public headlines' : ''}</div></div></div>`;
  };
  const Q_chips = p => CGP.Q.chips(p).map(c => `<span class="ichip"><em>${c[0]}</em>${U.esc(c[1])}</span>`).join('');

  V.ask = S => {
    const empty = !S.chat.length;
    const chat = empty
      ? `<div class="welcome"><div class="avatar xl ai">${I('spark', 30)}</div><h2>Ask Jan Darpan</h2><p>Questions on the Chief Minister, districts, the opposition, traction, and now history: precedents, seasons, promises and “same period last year”. Answers are computed from the data and cite their evidence.</p>
          <div class="pgrid">${PROMPTS.map(p => `<button class="pcard" data-ask="${U.esc(p[1])}"><span class="pi">${I(p[3], 18)}</span><b>${p[2]}</b><p>${p[1]}</p></button>`).join('')}</div></div>`
      : `<div class="msgs" id="msgs">${S.chat.map(V.chatMsg).join('')}</div>`;
    return `<div class="askwrap">
      <section class="card chatcard">${chat}
        <form class="composer" id="composer"><input id="q" autocomplete="off" placeholder="Ask anything, e.g. “Korba power cuts in the last 3 days” or “Compare Raipur vs Bilaspur”"/><button class="send" type="submit" aria-label="Send">${I('send', 18)}</button></form></section>
      <aside class="side">
        ${card({ title: 'Try asking', body: `<div class="sugs">${[
          'Key negative sentiment this week', 'Issues raised by Congress in the last 3 days', 'Top posts on Mahtari Vandan', 'Farmers concerns in Janjgir-Champa',
          'Compare Raipur vs Bilaspur', 'How many X posts on farmers?', 'What did Bhupesh Baghel say?', 'Brief for today'].map(s => `<button data-ask="${s}">${I('search', 14)}${s}</button>`).join('')}</div>` })}
        ${card({ title: 'How it answers', body: `<ol class="how"><li><b>Parse</b> window, district, topic, channel, intent</li><li><b>Query</b> the store of 25+ parameters per item</li><li><b>Compose</b> with numbers and evidence links</li></ol><p class="muted sm">An LLM layer can sit on top for free-form summaries; the numbers always come from the store.</p>` })}
      </aside></div>`;
  };

  // ───────────── Districts ─────────────
  V.districts = S => {
    const x = ctx(S);
    const rows = E.districts(x.items, x.range);
    const sel = rows.filter(r => r.d.id === S.sel)[0] || rows[0];
    const mval = r => (S.metric === 'volume' ? r.st.n : S.metric === 'net' ? Math.abs(r.st.net) + 4 : r.concernScore);
    const mlabel = r => (S.metric === 'net' ? sgn(r.st.net) : S.metric === 'volume' ? r.st.n : r.concernScore);
    const map = card({ cls: 'span7', title: 'Chhattisgarh · 10 districts', sub: 'Stylised tile map. Darker means higher.',
      right: `<div class="seg">${[['concern', 'Concern'], ['volume', 'Volume'], ['net', 'Net stance']].map(m => `<button class="${S.metric === m[0] ? 'on' : ''}" data-metric="${m[0]}">${m[1]}</button>`).join('')}</div>`,
      body: C.tileMap(rows.map(r => ({ d: r.d, value: mval(r), label: mlabel(r), tone: S.metric === 'net' ? (r.st.net >= 0 ? 'var(--pos)' : 'var(--neg)') : S.metric === 'volume' ? 'var(--pri)' : 'var(--neg)', tip: `<b>${r.d.name}</b><br>${r.st.n} items · net ${sgn(r.st.net)}<br>Concern ${r.concernScore}` })), { sel: sel.d.id }) });
    const s = sel.st, topics = E.countBy(sel.items, 'topic').slice(0, 5);
    const detail = card({ cls: 'span5 detail', title: sel.d.name + ' <small>' + sel.d.hi + '</small>', sub: sel.d.note,
      right: `<button class="link" data-ask="What are the key concerns in ${sel.d.name}?">Ask ${I('up', 14)}</button>`,
      body: `<div class="tiles">${[['Items', s.n], ['Reach', (s.reach ? U.fmt(s.reach) : '—')], ['Critical', U.pct(s.critical, s.n) + '%'], ['Net', sgn(s.net)]].map(t => `<div class="tile-s"><span>${t[0]}</span><b>${t[1]}</b></div>`).join('')}</div>
        <h5>Top concerns</h5>${sel.concerns.length ? C.hbars(sel.concerns.map(c => ({ label: U.esc(c.issue), value: c.score, right: c.n, color: 'var(--neg)', sub: U.tname(c.topic) }))) : '<p class="empty">No critical items.</p>'}
        <h5>Talked about</h5><div class="chips">${topics.map(t => `<span class="chip">${U.tshort(t.k)} <b>${t.n}</b></span>`).join('')}</div>
        <h5>Constituencies</h5><div class="chips">${sel.d.seats.map(st => `<a class="chip ghost pin" target="_blank" rel="noopener" href="${U.mapsUrl(st + ', ' + sel.d.name + ', Chhattisgarh')}" data-tip="Open ${U.esc(st)} in Google Maps">${I('pin', 12)}${st}</a>`).join('')}</div>` });
    const mapCard = card({ cls: 'span12 mapcard', title: sel.d.name + ' on the map', sub: 'Interactive Google Map. Drag, zoom, or open it full screen.',
      right: `<a class="btn ghost" target="_blank" rel="noopener" href="${U.mapsUrl(sel.d.name + ', Chhattisgarh')}">${I('pin', 16)} Open in Google Maps</a>`,
      body: `<iframe class="gmap" title="Map of ${U.esc(sel.d.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${U.mapsEmbed(sel.d.name + ', Chhattisgarh, India')}"></iframe>` });
    const table = card({ cls: 'span12', title: 'All districts', sub: 'Click a row to focus',
      body: `<table class="tbl"><thead><tr><th>District</th><th class="r">Items</th><th class="r">Reach</th><th>Stance split</th><th class="r">Net</th><th>Top concern</th></tr></thead><tbody>${rows.slice().sort((a, b) => b.concernScore - a.concernScore).map(r => `<tr class="click ${r.d.id === sel.d.id ? 'hl' : ''}" data-district="${r.d.id}"><td><b>${r.d.name}</b></td><td class="r">${r.st.n}</td><td class="r">${(r.st.reach ? U.fmt(r.st.reach) : '—')}</td><td style="min-width:140px">${C.stack([{ v: r.st.support, color: 'var(--pos)', label: 'Supportive' }, { v: r.st.neutral, color: 'var(--line)', label: 'Neutral' }, { v: r.st.critical, color: 'var(--neg)', label: 'Critical' }], { cls: 'thin' })}</td><td class="r"><span class="pill" style="--c:${netColor(r.st.net)}">${sgn(r.st.net)}</span></td><td>${r.concerns[0] ? U.esc(r.concerns[0].issue) : '—'}</td></tr>`).join('')}</tbody></table>` });
    const posts = card({ cls: 'span12', title: 'Most amplified in ' + sel.d.name, body: E.top(sel.items, 3).map(C.postRow).join('') || '<p class="empty">No items.</p>' });
    return `<div class="bento">${map}${detail}${mapCard}${table}${posts}</div>`;
  };

  // ───────────── Opposition ─────────────
  V.opposition = S => {
    const x = ctx(S);
    const o = E.opposition(x.items, x.range);
    const oppItems = x.items.filter(i => i.speakerType === 'opp');
    const os = E.stats(oppItems);
    const gaps = o.filter(i => i.gap).length;
    const leaders = E.leaders(x.items).filter(l => l.l.group === 'opp');
    const kp = [['Opposition items', oppItems.length], ['Issues raised', o.length], ['Avg traction', os.avgTraction], ['Response gaps', gaps]];
    const kpiRow = kp.map(k => card({ cls: 'span3 kpi', body: `<span class="kl">${k[0]}</span><div class="kv">${cu(k[1])}</div>` })).join('');
    const issues = o.slice(0, 8).map(it => {
      const respPct = Math.min(100, Math.round((100 * it.responses) / Math.max(1, it.recent * 2.5)));
      return `<article class="card issue">
        <header><div><span class="chip">${U.tshort(it.topic)}</span><h4>${U.esc(it.issue)}</h4></div><span class="delta ${it.trend >= 0 ? 'down' : 'up'}" data-tip="${it.trend >= 0 ? 'Rising' : 'Easing'} versus the first half of the window">${it.trend >= 0 ? '▲' : '▼'} ${Math.abs(it.trend)}%</span></header>
        <p class="claim">${U.esc(it.text)}</p>
        ${CGP.W.hist(it.issue)}
        <div class="ispark">${C.spark(it.days, { h: 40, color: 'var(--pri)' })}</div>
        <div class="imeta"><span><b>${it.n}</b> items</span><span><b>${it.avgTraction}</b> traction</span><span>${Object.keys(it.dist).sort((a, b) => it.dist[b] - it.dist[a]).slice(0, 2).map(U.dname).join(', ')}</span></div>
        <div class="resp"><span>Govt-side response</span><div class="rbar"><i style="width:${respPct}%"></i></div>${it.gap ? '<span class="tag neg">Gap</span>' : '<span class="tag pos">Covered</span>'}</div>
        <div class="chips">${Object.keys(it.ch).map(c => C.chBadge(c)).join('')}<button class="link" data-open-issue="${U.esc(it.issue)}">Rebuttal & precedents ${I('up', 14)}</button><button class="link" data-ask="Tell me about ${U.esc(it.issue)} from the opposition">Ask ${I('up', 14)}</button></div>
      </article>`;
    }).join('');
    const side = card({ title: 'Opposition voices', sub: 'Mentions in the window',
      body: leaders.map(l => `<div class="lrow"><div class="avatar opp">${initials(l.l.name)}</div><div><b>${l.l.name}</b><p>${l.l.role}</p></div><div class="lm"><b>${l.st.n}</b><span>${l.st.avgTraction} avg traction</span></div></div>`).join('') });
    const posts = card({ cls: 'compact', title: 'Highest-traction opposition posts', body: E.top(oppItems, 3).map(C.postRow).join('') || '<p class="empty">None.</p>' });
    return `<div class="bento">${kpiRow}<div class="span8 issues-grid">${issues || '<p class="empty">No opposition items in this window.</p>'}</div><div class="span4 stackcol">${side}${posts}</div></div>`;
  };

  // ───────────── Traction ─────────────
  V.traction = S => {
    const x = ctx(S);
    const tf = S.tf;
    let list = x.items;
    if (tf.channel !== 'all') list = list.filter(i => i.channel === tf.channel);
    if (tf.speaker !== 'all') list = list.filter(i => i.speakerType === tf.speaker);
    if (tf.topic !== 'all') list = list.filter(i => i.topic === tf.topic);
    const opts = (arr, cur) => arr.map(a => `<option value="${a[0]}" ${cur === a[0] ? 'selected' : ''}>${a[1]}</option>`).join('');
    const filters = `<div class="filters">
      <select data-tf="channel">${opts([['all', 'All channels']].concat(R.channels.map(c => [c.id, c.id])), tf.channel)}</select>
      <select data-tf="speaker">${opts([['all', 'All voices']].concat(Object.keys(R.speakers).map(k => [k, R.speakers[k].label])), tf.speaker)}</select>
      <select data-tf="topic">${opts([['all', 'All topics']].concat(R.topics.map(t => [t.id, t.name])), tf.topic)}</select></div>`;
    const top = E.top(list, 12);
    const posts = card({ cls: 'span7', title: 'Top posts by traction', sub: list.length + ' items match', right: filters,
      body: top.map((it, i) => `<div class="rank"><span class="rn">${i + 1}</span>${C.postRow(it)}</div>`).join('') || '<p class="empty">No items match.</p>' });
    const tp = E.topics(x.items);
    const total = tp.reduce((a, t) => a + t.n, 0);
    const sp = Object.keys(R.speakers).map(k => ({ label: R.speakers[k].label, color: R.speakers[k].color, value: x.items.filter(i => i.speakerType === k).length }));
    const share = card({ cls: 'span5', title: 'Share of voice', sub: 'Who is driving the conversation',
      body: `<div class="donut-wrap">${C.donut(sp, { big: U.fmt(total), small: 'items' })}<div class="dl">${sp.map(s => `<div><i style="background:${s.color}"></i><span>${s.label}</span><b>${s.value}</b></div>`).join('')}</div></div>` });
    const topics = card({ cls: 'span5', title: 'Posts per topic', sub: 'Social posts and news items, split by voice',
      body: tp.filter(t => t.n).slice(0, 12).map(t => {
        const so = t.items.filter(i => i.channel.indexOf('News') !== 0).length;
        return `<div class="trow" data-ask="How many posts on ${U.esc(t.t.name)}?"><span>${t.t.name}<small>${so} social · ${t.n - so} news</small></span>${C.stack(Object.keys(R.speakers).map(k => ({ v: t.by[k], color: R.speakers[k].color, label: R.speakers[k].label })), { cls: 'thin' })}<b>${t.n}</b></div>`;
      }).join('') + legend(Object.keys(R.speakers).map(k => ({ label: R.speakers[k].label, color: R.speakers[k].color }))) });
    return `<div class="bento">${posts}<div class="span5 stackcol">${share}${topics}</div></div>`;
  };

  // ───────────── Leaders ─────────────
  V.leaders = S => {
    const x = ctx(S);
    const ls = E.leaders(x.items);
    const cards = ls.map(l => {
      const ser = E.series(l.items, Math.max(S.days, 7));
      return `<article class="card leader ${l.l.group}">
        <header><div class="avatar lg ${l.l.group}">${initials(l.l.name)}</div><div><h4>${l.l.name}</h4><p>${l.l.role}</p></div><span class="party ${l.l.party}">${l.l.party}</span></header>
        <div class="tiles">${[['Mentions', l.st.n], ['Reach', U.fmt(l.st.reach)], l.l.group === 'govt' ? ['Net', sgn(l.st.net)] : ['Traction', l.st.avgTraction]].map(t => `<div class="tile-s"><span>${t[0]}</span><b>${t[1]}</b></div>`).join('')}</div>
        <div class="ispark">${C.spark(ser.totals, { h: 44, color: l.l.group === 'govt' ? 'var(--warn)' : 'var(--sky)' })}</div>
        <div class="chips">${l.topics.map(t => `<span class="chip">${U.tshort(t.k)} <b>${t.n}</b></span>`).join('')}</div>
        <button class="link" data-ask="What did ${l.l.name} get covered for in the last 7 days?">Ask about ${l.l.name.split(' ')[0]} ${I('up', 14)}</button></article>`;
    }).join('');
    const q = (S.seatQ || '').toLowerCase();
    const seats = E.seats(x.items).filter(s => {
      const m = CGP.mlas[s.seat] || {};
      if (S.seatD !== 'all' && s.district !== S.seatD) return false;
      if ((S.seatP || 'all') !== 'all' && m.party !== S.seatP) return false;
      return !q || [s.seat, m.hi, m.name, m.nameHi, m.district, m.role].join(' ').toLowerCase().indexOf(q) >= 0;
    }).sort((a, b) => ((CGP.mlas[a.seat] || {}).no || 999) - ((CGP.mlas[b.seat] || {}).no || 999));
    const pc = CGP.partyCount ? CGP.partyCount() : {}, ro = CGP.roster || {};
    const tiles = Object.keys(pc).length ? `<div class="tiles">${Object.keys(pc).sort((a, b) => pc[b] - pc[a]).map(k => `<div class="tile-s"><span>${U.esc(k)}</span><b>${pc[k]}</b></div>`).join('')}<div class="tile-s"><span>Seats</span><b>${ro.count || 0}</b></div></div>` : '';
    const tbl = card({ cls: 'span12', title: 'MLAs and constituencies', sub: ro.count ? `All ${ro.count} seats with the sitting MLA. Click a row for the profile. ${U.esc(ro.source)}; roster as of ${U.esc(ro.asOf)}. Roles and by-election changes need a curator check.` : 'Import the MLA roster in the Data tab.',
      right: `<div class="filters"><input class="search" data-seatq placeholder="Search constituency, MLA or role" value="${U.esc(S.seatQ)}"/><select data-seatd><option value="all">All districts</option>${R.districts.map(d => `<option value="${d.id}" ${S.seatD === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}<option value="other" ${S.seatD === 'other' ? 'selected' : ''}>Other districts</option></select><select data-seatp><option value="all">All parties</option>${Object.keys(pc).map(k => `<option value="${U.esc(k)}" ${S.seatP === k ? 'selected' : ''}>${U.esc(k)}</option>`).join('')}</select></div>`,
      body: `${tiles}<div class="mla-tbl-wrap"><table class="tbl mla-tbl"><thead><tr><th>#</th><th>Constituency</th><th>District</th><th>MLA</th><th>Party</th><th>Role</th><th class="r">2023 margin</th><th class="r">Items</th><th class="r">Net</th><th>Top issue</th></tr></thead><tbody>${seats.map(s => { const m = CGP.mlas[s.seat] || {}; const dn = m.district || U.dname(s.district); return `<tr class="click" tabindex="0" data-mla="${U.esc(s.seat)}"><td class="muted">${m.no || ''}</td><td><b>${U.esc(s.seat)}</b>${m.reserved && m.reserved !== 'GEN' ? ` <span class="tag neu">${m.reserved}</span>` : ''}${m.hi ? `<small>${U.esc(m.hi)}</small>` : ''}</td><td class="muted">${U.esc(dn)}</td><td>${m.name ? `<b>${U.esc(m.name)}</b>${m.nameHi ? `<small>${U.esc(m.nameHi)}</small>` : ''}` : '<span class="muted">Pending import</span>'}</td><td>${m.party ? `<span class="party ${U.esc(m.party)}">${U.esc(m.party)}</span>` : '<span class="muted">\u2014</span>'}</td><td class="muted role">${U.esc(m.role ? m.role.split(';')[0] : '')}</td><td class="r">${m.margin ? m.margin.toLocaleString('en-IN') : ''}</td><td class="r">${s.n}</td><td class="r"><span class="pill" style="--c:${netColor(s.st.net)}">${s.n ? sgn(s.st.net) : '\u2014'}</span></td><td>${U.esc(s.top)}</td></tr>`; }).join('')}</tbody></table></div>${seats.length ? '' : '<p class="muted">No seat matches the filters.</p>'}` });
    return `<div class="bento"><div class="span12 leaders-grid">${cards}</div>${tbl}</div>`;
  };

  // MLA profile modal
  V.mla = seat => {
    const m = CGP.mlas[seat]; if (!m) return '';
    const items = (CGP.M && CGP.M.S && CGP.M.S.items) || [];
    const nm = (m.name || '').toLowerCase();
    const mine = items.filter(i => i.constituency === seat || (nm.length > 6 && (i.headline || '').toLowerCase().indexOf(nm) >= 0) || (m.nameHi && (i.headline || '').indexOf(m.nameHi) >= 0)).sort((a, b) => b.ts - a.ts);
    const st = E.stats(mine), con = E.concerns(mine, 3);
    const wiki = t => 'https://en.wikipedia.org/wiki/' + encodeURIComponent(String(t).replace(/ /g, '_'));
    const kv = [['Constituency', `${m.no}. ${m.constituency}${m.hi ? ' (' + m.hi + ')' : ''}`], ['Reservation', m.reserved === 'GEN' ? 'General' : m.reserved === 'ST' ? 'Scheduled Tribes' : 'Scheduled Castes'], ['District', m.district],
      ['Party', m.party], ['Role', m.role || 'Member of the Legislative Assembly'], ['Elected', m.term], ['Votes', m.votes.toLocaleString('en-IN') + ' (' + m.pct + '%)'], ['Winning margin', m.margin.toLocaleString('en-IN')], ['Runner-up', m.runnerUp + ' (' + m.runnerUpParty + ')']];
    return `<div class="mcard"><button class="mclose" data-close aria-label="Close">${I('close', 18)}</button>
      <div class="mhead"><span class="party ${U.esc(m.party)}">${U.esc(m.party)}</span><span>MLA \u00b7 ${U.esc(m.district)}</span></div>
      <h3>${U.esc(m.name)}${m.nameHi ? ' \u00b7 ' + U.esc(m.nameHi) : ''}</h3>
      <p class="mtext">${U.esc(m.constituency)} constituency. ${m.role ? U.esc(m.role) + '.' : ''}</p>
      <div class="kvgrid">${kv.map(k => `<div><span>${k[0]}</span><b>${U.esc(k[1])}</b></div>`).join('')}</div>
      <h5>In the collected coverage</h5>
      ${mine.length ? `<p class="mtext">${mine.length} items \u00b7 net ${sgn(st.net)} \u00b7 top concerns: ${con.length ? con.map(c => U.esc(c.issue)).join(', ') : '\u2014'}</p><div class="list">${mine.slice(0, 6).map(i => `<div class="orow"><div><a href="${U.esc(i.link || '#')}" target="_blank" rel="noopener"><b>${U.esc(i.headline)}</b></a><p>${U.esc(i.source)} \u00b7 ${U.when(i.ts)}</p></div></div>`).join('')}</div>` : '<p class="muted">No item in the current archive names this seat or MLA. Add links in the Library to build the record.</p>'}
      <p class="mact"><a class="btn ghost" href="${U.mapsUrl(m.constituency + ', ' + m.district + ', Chhattisgarh')}" target="_blank" rel="noopener">${I('pin', 16)} Google Maps</a> <a class="btn ghost" href="${wiki(m.wiki || m.constituency + ' Assembly constituency')}" target="_blank" rel="noopener">${I('up', 16)} Wikipedia</a> <a class="btn ghost" href="https://results.eci.gov.in/" target="_blank" rel="noopener">${I('up', 16)} ECI results</a> <button class="btn ghost" data-ask="What is said about ${U.esc(m.name)}?">${I('chat', 16)} Ask</button></p></div>`;
  };

  // ───────────── Brief ─────────────
  V.briefData = S => {
    const x = ctx(S);
    const b = E.brief(x.items, x.range, x.label);
    const acts = [];
    b.con.slice(0, 3).forEach(c => { const pb = CGP.M.playbook(c.issue, c.topic); acts.push(pb ? `On “${c.issue}”: ${pb.text}` : `Verify on the ground and share a status update on “${c.issue}” (hotspots: ${c.topDist.slice(0, 2).map(U.dname).join(', ')}).`); });
    b.opp.filter(o => o.gap).slice(0, 2).forEach(o => acts.push(`Prepare a factual response note for “${o.issue}”; little government-side response is visible.`));
    b.rumours.slice(0, 1).forEach(r => acts.push(`Check the claim “${r.k}” and publish a clarification if it is false.`));
    b.pos.slice(0, 2).forEach(p => acts.push(`Amplify the positive story “${p.k}” on official channels.`));
    return { x, b, acts };
  };
  V.briefText = S => {
    const { x, b, acts } = V.briefData(S);
    const L = [];
    L.push('JAN DARPAN · CHHATTISGARH · DAILY BRIEF' + (CGP.mode === 'live' ? ' (AUTO-TAGGED PUBLIC HEADLINES)' : ' (SAMPLE DATA)'));
    L.push(x.label + ' · ' + b.st.n + ' items · CM mentioned in ' + b.cm.n);
    L.push('');
    L.push('KEY CONCERNS');
    b.con.forEach((c, i) => L.push((i + 1) + '. ' + c.issue + ' – ' + c.n + ' items; ' + c.topDist.slice(0, 3).map(U.dname).join(', ') + '\n   History: ' + CGP.M.historyLine(c.issue, c.topDist[0]).text));
    L.push(''); L.push('OPPOSITION WATCH');
    b.opp.forEach(o => L.push('- ' + o.issue + ' (' + o.n + ' items, traction ' + o.avgTraction + ')' + (o.gap ? ' [response gap]' : '')));
    L.push(''); L.push('POSITIVES');
    b.pos.forEach(p => L.push('- ' + p.k + ' (' + p.n + ')'));
    L.push(''); L.push('SUGGESTED ACTIONS');
    acts.forEach(a => L.push('- ' + a));
    return L.join('\n');
  };
  V.brief = S => {
    const { x, b, acts } = V.briefData(S);
    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return `<div class="briefwrap"><article class="card brief">
      <div class="brief-h"><div><span class="eyebrow">Daily brief · Chhattisgarh</span><h2>${today}</h2><p>${x.label} · ${b.st.n} items · CM mentioned in ${b.cm.n} · net stance ${sgn(b.st.net)}</p></div>
        <div class="brief-act"><button class="btn ghost" data-copy-brief>${I('copy', 16)} Copy</button><button class="btn" onclick="window.print()">${I('print', 16)} Print / PDF</button></div></div>
      <div class="bgrid">
        <section><h5>Key concerns</h5>${C.hbars(b.con.map(c => ({ label: `<button class="ilink" data-open-issue="${U.esc(c.issue)}">${U.esc(c.issue)}</button>`, value: c.score, right: c.n + ' items', color: 'var(--neg)', sub: c.topDist.slice(0, 3).map(U.dname).join(' · ') })))}<h5>History</h5>${b.con.slice(0, 4).map(c => CGP.W.hist(c.issue, c.topDist[0])).join('')}</section>
        <section><h5>Opposition watch</h5>${b.opp.map(o => `<div class="orow"><div><b>${U.esc(o.issue)}</b><p>${o.n} items · traction ${o.avgTraction}</p></div>${o.gap ? '<span class="tag neg">Response gap</span>' : '<span class="tag pos">Covered</span>'}</div>`).join('') || '<p class="empty">None.</p>'}</section>
        <section><h5>Positives to amplify</h5>${C.hbars(b.pos.map(p => ({ label: U.esc(p.k), value: p.n, color: 'var(--pos)' })))}</section>
        <section><h5>Districts to watch</h5>${b.dists.map(d => `<div class="orow"><div><b>${d.d.name}</b><p>${d.concerns[0] ? U.esc(d.concerns[0].issue) : '—'}</p></div><span class="pill" style="--c:${netColor(d.st.net)}">${sgn(d.st.net)}</span></div>`).join('')}</section>
      </div>
      ${b.rumours.length ? `<section class="wide"><h5>Rumours under watch</h5>${b.rumours.map(r => `<div class="orow"><div><b>${U.esc(r.k)}</b><p>${r.n} high-risk items</p></div><span class="tag warn">Verify</span></div>`).join('')}</section>` : ''}
      <section class="wide"><h5>Suggested actions</h5><ol class="acts">${acts.map(a => `<li>${U.esc(a)}</li>`).join('')}</ol></section>
      <section class="wide"><h5>Top posts</h5>${b.top.map(C.postRow).join('')}</section></article></div>`;
  };

  // ───────────── Data ─────────────
  V.data = S => {
    const n = CGP.items.length, mn = new Date(CGP.dataMin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), mx = new Date(Math.max.apply(null, CGP.items.map(i => i.ts))).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const st = { live: ['Live', 'pos'], next: ['Next', 'neu'], key: ['Needs API key', 'warn'], vendor: ['Needs vendor', 'warn'] };
    const hs = { found: ['Found', 'pos'], verify: ['Verify', 'warn'], todo: ['To collect', 'neu'] };
    const status = card({ cls: 'span5', title: 'Dataset', sub: CGP.source === 'sample' ? 'Illustrative sample data' : 'Imported data',
      body: `<div class="tiles">${[['Items', n], ['From', mn], ['To', mx]].map(t => `<div class="tile-s"><span>${t[0]}</span><b>${t[1]}</b></div>`).join('')}</div>
        <div class="dz" id="dz">${I('upload', 22)}<b>Import items (JSON)</b><p>Array of items or {"items":[…]}. Use this for the daily news analysis once parsed.</p><label class="btn">Choose file<input type="file" accept=".json,application/json" data-import="items" hidden/></label></div>
        <div class="dz">${I('users', 22)}<b>Import MLA roster (JSON)</b><p>[{"constituency":"Raipur City North","name":"…","party":"BJP"}]</p><label class="btn ghost">Choose file<input type="file" accept=".json,application/json" data-import="mlas" hidden/></label></div>
        <div class="row-btns"><button class="btn ghost" data-download-schema>${I('download', 16)} Example JSON</button><button class="btn ghost" data-reset>Reset to sample</button></div><p class="msg-import" id="imp"></p>` });
    const conn = card({ cls: 'span7', title: 'Data connectors', sub: 'What feeds the platform',
      body: `<table class="tbl"><tbody>${R.connectors.map(c => `<tr><td><b>${c.name}</b><small>${c.desc}</small></td><td class="r"><span class="tag ${st[c.state][1]}">${st[c.state][0]}</span></td></tr>`).join('')}</tbody></table>` });
    const hand = card({ cls: 'span7', title: 'Handles and pages to follow', sub: 'From public sources. Verify before connecting.',
      body: `<table class="tbl"><tbody>${R.handles.map(h => `<tr><td><b>${h.handle}</b><small>${h.platform} · ${h.owner}</small></td><td class="r"><span class="tag ${hs[h.status][1]}">${hs[h.status][0]}</span></td></tr>`).join('')}</tbody></table>` });
    const par = card({ cls: 'span5', title: '25+ parameters per item', sub: 'Sentiment is only one of them',
      body: R.params.map(p => `<div class="prm"><h6>${p[0]}</h6><div class="chips">${p[1].map(x => `<span class="chip ${x.indexOf('Sentiment') === 0 ? 'on' : ''}">${x}</span>`).join('')}</div></div>`).join('') });
    const rules = card({ cls: 'span12', title: 'Ground rules', body: `<ul class="rules"><li><b>Public data only.</b> No private groups, accounts or messages.</li><li><b>Aggregate and public-figure focus.</b> No profiling of private citizens or journalists.</li><li><b>Human in the loop.</b> Rumour and misinformation scores are flags for review, not verdicts.</li><li><b>Licensing.</b> E-paper and social data need the right licences or APIs.</li><li><b>Election period.</b> Check Model Code of Conduct and platform policies before campaign use.</li></ul>` });
    return `<div class="bento">${status}${conn}${hand}${par}${rules}</div>`;
  };

  // Item detail modal
  V.item = it => {
    const kv = [
      ['Channel', it.channel], ['Outlet / handle', it.source], ['Language', it.language], ['Media type', it.mediaType], ['Prominence', it.prominence || '—'], ['Pickup (outlets)', it.pickup || 1],
      ['Speaker type', R.speakers[it.speakerType] ? R.speakers[it.speakerType].label : it.speakerType], ['Entities', it.entities.join(', ') || '—'], ['Mentions CM', it.mentionsCM ? 'Yes' : 'No'],
      ['District', it.district ? U.dname(it.district) : (it.place || '—')], ['Constituency', it.constituency || '—'],
      ['Topic', U.tname(it.topic)], ['Scheme', it.scheme || '—'], ['Issue / concern', it.issue], ['Narrative', it.narrative], ['Hashtags', it.hashtags.join(' ') || '—'],
      ['Stance', it.stance > 0 ? 'Supportive' : it.stance < 0 ? 'Critical' : 'Neutral'], ['Sentiment', it.sentiment], ['Emotion', it.emotion], ['Intent', it.intent], ['Tag confidence', it.curated ? 'curated' : Math.round((it.conf || 0) * 100) + '%'],
      ['Likes', U.fmt(it.likes)], ['Shares', U.fmt(it.shares)], ['Comments', U.fmt(it.comments)], ['Views', U.fmt(it.views)], ['Traction', it.traction + '/100'],
      ['Misinformation risk', Math.round(it.misinfo * 100) + '%'], ['Urgency', it.urgency + '/100']
    ];
    const origin = it.origin === 'sample' ? '<span class="tag warn">Sample</span>' : it.origin === 'link' ? '<span class="tag neu">Saved link</span>' : it.auto ? '<span class="tag neu">Auto-tagged</span>' : '';
    const hl = it.stance < 0 || it.issue ? CGP.W.hist(it.issue, it.district) : '';
    return `<div class="mcard"><button class="mclose" data-close aria-label="Close">${I('close', 18)}</button>
      <div class="mhead">${C.chBadge(it.channel)}<span>${U.esc(it.source)} · ${U.when(it.ts)}</span>${origin}</div>
      <h3>${U.esc(it.headline)}</h3>${it.text && it.text !== it.headline ? `<p class="mtext">${U.esc(it.text)}</p>` : ''}
      ${it.link ? `<p><a class="btn ghost" href="${U.esc(it.link)}" target="_blank" rel="noopener">${I('up', 16)} Open source</a> <button class="btn ghost" data-open-issue="${U.esc(it.issue)}">${I('clock', 16)} Issue history</button></p>` : ''}
      ${hl}<div class="kvgrid">${kv.map(k => `<div><span>${k[0]}</span><b>${U.esc(k[1])}</b></div>`).join('')}</div></div>`;
  };})(typeof window !== 'undefined' ? window : globalThis);


