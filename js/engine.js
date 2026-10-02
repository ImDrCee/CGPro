/* Analytics engine: pure functions over the item list. No DOM. */
(function (g) {
  const CGP = g.CGP;
  const R = CGP.ref;
  const DAY = 86400000;

  const U = (CGP.U = {});
  U.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.fmt = n => {
    n = Math.round(n);
    const t = (v, s) => v.toFixed(1).replace(/\.0$/, '') + s;
    if (n >= 1e7) return t(n / 1e7, 'Cr');
    if (n >= 1e5) return t(n / 1e5, 'L');
    if (n >= 1e3) return t(n / 1e3, 'K');
    return String(n);
  };
  U.pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
  U.ago = ts => {
    const m = Math.max(1, Math.round((Date.now() - ts) / 60000));
    if (m < 60) return m + 'm ago';
    if (m < 1440) return Math.round(m / 60) + 'h ago';
    return Math.round(m / 1440) + 'd ago';
  };
  U.when = ts => new Date(ts).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  U.dname = id => { const d = R.districts.filter(x => x.id === id)[0]; return d ? d.name : id; };
  U.tname = id => { const t = R.topics.filter(x => x.id === id)[0]; return t ? t.name : id; };
  U.tshort = id => { const t = R.topics.filter(x => x.id === id)[0]; return t ? t.short : id; };
  U.chColor = id => { const c = R.channels.filter(x => x.id === id)[0]; return c ? c.color : '#999'; };
  U.chAbbr = id => { const c = R.channels.filter(x => x.id === id)[0]; return c ? c.abbr : id; };
  U.todayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
  U.mapsUrl = q => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
  U.mapsEmbed = q => 'https://maps.google.com/maps?q=' + encodeURIComponent(q) + '&z=10&output=embed';

  const E = (CGP.E = {});

  // Window helpers. days<=1 means rolling 24h; otherwise whole calendar days ending today.
  E.range = (days, back) => {
    back = back || 0;
    if (days <= 1) { const to = Date.now() - back * DAY; return [to - DAY, to + 1]; }
    const to = U.todayStart() + DAY - back * days * DAY;
    return [to - days * DAY, to];
  };

  E.scope = (items, f) => {
    f = f || {};
    const rg = f.range || (f.days ? E.range(f.days, f.back) : null);
    return items.filter(it =>
      (!rg || (it.ts >= rg[0] && it.ts < rg[1])) &&
      (!f.channel || f.channel === 'all' || it.channel === f.channel) &&
      (!f.district || f.district === 'all' || it.district === f.district) &&
      (!f.topic || it.topic === f.topic) &&
      (!f.speaker || it.speakerType === f.speaker) &&
      (!f.cm || it.mentionsCM) &&
      (!f.stance || (f.stance === 'critical' ? it.stance < 0 : f.stance === 'support' ? it.stance > 0 : it.stance === 0))
    );
  };

  E.stats = items => {
    const s = { n: items.length, reach: 0, eng: 0, support: 0, critical: 0, neutral: 0, cm: 0, misinfo: 0, traction: 0, net: 0 };
    items.forEach(i => {
      s.reach += i.views; s.eng += i.likes + i.shares + i.comments;
      if (i.stance > 0) s.support++; else if (i.stance < 0) s.critical++; else s.neutral++;
      if (i.mentionsCM) s.cm++;
      if (i.misinfo >= 0.5) s.misinfo++;
      s.traction += i.traction;
    });
    s.avgTraction = s.n ? Math.round(s.traction / s.n) : 0;
    s.net = s.n ? Math.round((100 * (s.support - s.critical)) / s.n) : 0;
    return s;
  };

  E.countBy = (items, keyFn) => {
    const m = {};
    items.forEach(i => { const k = typeof keyFn === 'function' ? keyFn(i) : i[keyFn]; if (k == null || k === '') return; m[k] = (m[k] || 0) + 1; });
    return Object.keys(m).map(k => ({ k, n: m[k] })).sort((a, b) => b.n - a.n);
  };

  // Time series split by channel
  E.series = (items, days) => {
    const hourly = days <= 1;
    const N = hourly ? 24 : days;
    const rg = E.range(days);
    const step = hourly ? 3600000 : DAY;
    const keys = R.channels.map(c => c.id);
    const data = {}; keys.forEach(k => (data[k] = new Array(N).fill(0)));
    const totals = new Array(N).fill(0), neg = new Array(N).fill(0), pos = new Array(N).fill(0);
    items.forEach(it => {
      const idx = Math.floor((it.ts - rg[0]) / step);
      if (idx < 0 || idx >= N) return;
      data[it.channel][idx]++; totals[idx]++;
      if (it.stance < 0) neg[idx]++; else if (it.stance > 0) pos[idx]++;
    });
    const labels = [];
    for (let i = 0; i < N; i++) {
      const d = new Date(rg[0] + i * step);
      labels.push(hourly ? d.getHours() + ':00' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
    }
    return { labels, keys, data, totals, neg, pos };
  };

  E.concerns = (items, limit, range) => {
    const mid = range ? (range[0] + range[1]) / 2 : 0;
    const m = {};
    items.filter(i => i.stance < 0).forEach(i => {
      const o = m[i.issue] || (m[i.issue] = { issue: i.issue, topic: i.topic, n: 0, traction: 0, score: 0, dist: {}, spk: {}, ch: {}, recent: 0, early: 0, misinfo: 0, ids: [] });
      o.n++; o.traction += i.traction; o.score += 1 + i.traction / 40 + i.misinfo * 0.4;
      o.dist[i.district] = (o.dist[i.district] || 0) + 1;
      o.spk[i.speakerType] = (o.spk[i.speakerType] || 0) + 1;
      o.ch[i.channel] = (o.ch[i.channel] || 0) + 1;
      if (i.misinfo >= 0.5) o.misinfo++;
      if (mid) { if (i.ts >= mid) o.recent++; else o.early++; }
      o.ids.push(i.id);
    });
    const arr = Object.keys(m).map(k => {
      const o = m[k];
      o.topDist = Object.keys(o.dist).sort((a, b) => o.dist[b] - o.dist[a]);
      o.avgTraction = Math.round(o.traction / o.n);
      o.trend = o.early ? Math.round((100 * (o.recent - o.early)) / o.early) : o.recent ? 100 : 0;
      return o;
    }).sort((a, b) => b.score - a.score);
    return limit ? arr.slice(0, limit) : arr;
  };

  E.districts = (items, range) =>
    R.districts.map(d => {
      const its = items.filter(i => i.district === d.id);
      const st = E.stats(its);
      const con = E.concerns(its, 3, range);
      const concernScore = Math.round(its.filter(i => i.stance < 0).reduce((a, i) => a + 1 + i.traction / 40, 0));
      return { d, items: its, st, concerns: con, concernScore, topTopic: (E.countBy(its, 'topic')[0] || {}).k };
    });

  E.opposition = (items, range) => {
    const opp = items.filter(i => i.speakerType === 'opp');
    const mid = (range[0] + range[1]) / 2;
    const days = Math.max(1, Math.round((range[1] - range[0]) / DAY));
    const m = {};
    opp.forEach(i => {
      const o = m[i.issue] || (m[i.issue] = { issue: i.issue, topic: i.topic, n: 0, traction: 0, ch: {}, spk: {}, dist: {}, first: i.ts, last: i.ts, recent: 0, early: 0, days: new Array(Math.min(days, 14)).fill(0), ids: [], text: i.text });
      o.n++; o.traction += i.traction;
      o.ch[i.channel] = (o.ch[i.channel] || 0) + 1; o.spk[i.speaker] = (o.spk[i.speaker] || 0) + 1; o.dist[i.district] = (o.dist[i.district] || 0) + 1;
      if (i.ts < o.first) o.first = i.ts; if (i.ts > o.last) o.last = i.ts;
      if (i.ts >= mid) o.recent++; else o.early++;
      const di = Math.floor((i.ts - (range[1] - o.days.length * DAY)) / DAY);
      if (di >= 0 && di < o.days.length) o.days[di]++;
      o.ids.push(i.id);
    });
    const resp = items.filter(i => (i.speakerType === 'govt' || i.speakerType === 'bjp') && i.stance >= 0 && i.ts >= mid);
    return Object.keys(m).map(k => {
      const o = m[k];
      o.avgTraction = Math.round(o.traction / o.n);
      o.trend = o.early ? Math.round((100 * (o.recent - o.early)) / o.early) : 100;
      o.responses = resp.filter(r => r.topic === o.topic).length;
      o.gap = o.recent > 0 && o.responses < o.recent * 2.5;
      o.score = o.n * (1 + o.avgTraction / 50);
      return o;
    }).sort((a, b) => b.score - a.score);
  };

  E.topics = items =>
    R.topics.map(t => {
      const its = items.filter(i => i.topic === t.id);
      const by = {}; Object.keys(R.speakers).forEach(k => (by[k] = 0));
      its.forEach(i => by[i.speakerType]++);
      const st = E.stats(its);
      return { t, n: its.length, by, st, items: its };
    }).sort((a, b) => b.n - a.n);

  E.leaders = items =>
    R.leaders.map(l => {
      const its = items.filter(i => i.entities.indexOf(l.name) >= 0);
      const st = E.stats(its);
      return { l, items: its, st, topics: E.countBy(its, 'topic').slice(0, 3), top: its.slice().sort((a, b) => b.traction - a.traction)[0] };
    });

  E.seats = items => {
    const out = [];
    R.districts.forEach(d => d.seats.forEach(s => {
      const its = items.filter(i => i.constituency === s);
      const st = E.stats(its);
      const con = E.concerns(its, 1)[0];
      out.push({ seat: s, district: d.id, n: its.length, st, top: con ? con.issue : (E.countBy(its, 'issue')[0] || {}).k || '—' });
    }));
    return out;
  };

  E.alerts = (all, f) => {
    const now = Date.now();
    const base = E.scope(all, { channel: f.channel, district: f.district }).filter(i => i.stance < 0);
    const m = {};
    base.forEach(i => {
      const o = m[i.issue] || (m[i.issue] = { issue: i.issue, topic: i.topic, last24: 0, prior: 0, dist: {}, misinfo: 0, tr: 0, ids: [] });
      const age = now - i.ts;
      if (age <= DAY) { o.last24++; o.dist[i.district] = (o.dist[i.district] || 0) + 1; o.tr += i.traction; if (i.misinfo >= 0.5) o.misinfo++; o.ids.push(i.id); }
      else if (age <= 7 * DAY) o.prior++;
    });
    return Object.keys(m).map(k => {
      const o = m[k];
      o.base = o.prior / 6;
      o.ratio = o.last24 / Math.max(o.base, 0.5);
      o.topDist = Object.keys(o.dist).sort((a, b) => o.dist[b] - o.dist[a]).slice(0, 2);
      o.sev = o.misinfo >= 2 || o.last24 >= 8 ? 'high' : 'med';
      o.rank = o.last24 * o.ratio;
      return o;
    }).filter(o => o.last24 >= 3 && o.ratio >= 2.2).sort((a, b) => b.rank - a.rank).slice(0, 5);
  };

  E.top = (items, n, by) => items.slice().sort((a, b) => b[by || 'traction'] - a[by || 'traction']).slice(0, n);
  E.byId = id => CGP.index[id];

  // Plain-text/HTML-free structured daily brief
  E.brief = (items, range, label) => {
    const st = E.stats(items);
    const cmItems = items.filter(i => i.mentionsCM);
    const cm = E.stats(cmItems);
    const con = E.concerns(items, 5, range);
    const opp = E.opposition(items, range).slice(0, 4);
    const pos = E.countBy(items.filter(i => i.stance > 0 && (i.speakerType === 'media' || i.speakerType === 'citizen')), 'issue').slice(0, 3);
    const dists = E.districts(items, range).sort((a, b) => b.concernScore - a.concernScore).slice(0, 3);
    const rumours = items.filter(i => i.misinfo >= 0.5);
    return { label, st, cm, con, opp, pos, dists, rumours: E.countBy(rumours, 'issue').slice(0, 2), top: E.top(items, 3) };
  };

  CGP.index = {};
  CGP.setItems = items => {
    CGP.items = items;
    CGP.index = {};
    items.forEach(i => (CGP.index[i.id] = i));
    CGP.dataMin = items.reduce((m, i) => Math.min(m, i.ts), Infinity);
  };
})(typeof window !== 'undefined' ? window : globalThis);
