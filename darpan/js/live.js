/* Live data: rule-based tagger for Hindi + English headlines, story clustering, link normalisation and dataset assembly.
   Tags are AUTO and UNVERIFIED. Low-confidence items go to the review queue; curator corrections override them. */
(function (g) {
  const CGP = g.CGP, R = CGP.ref, U = CGP.U, ST = CGP.store;
  const DAY = 86400000;
  const rxg = s => new RegExp(s, 'gi'), rxi = s => new RegExp(s, 'i');
  const TOPIC = R.topics.map(t => ({ id: t.id, rx: rxg(t.kw) }));
  const DIST = R.districts.map(d => ({ id: d.id, rx: rxi(d.kw) }));
  const OTHER = rxi(R.otherPlaces);
  const LEAD = R.leaders.map(l => ({ name: l.name, group: l.group, rx: rxi(l.kw) }));
  const ENT = R.entities.map(e => ({ name: e.name, rx: rxi(e.kw) }));
  const ISS = R.issues.map(i => Object.assign({}, i, { rx: rxi(i.kw) }));
  const NEG = rxg(R.lex.neg), POS = rxg(R.lex.pos), OPP = rxi(R.lex.opp), GOVT = rxi(R.lex.govt), BJP = rxi(R.lex.bjp);
  const MIS = /अफवाह|फर्जी|भ्रामक|वायरल|rumou?r|fake|misleading|false claim|hoax/i;
  const CGSIG = rxi(['chhattisgarh|छत्तीसगढ़|छत्तीसगढ|chhattisgarhi|छत्तीसगढ़ी|नवा रायपुर|साय|बघेल|महंत|बैज|सिंहदेव|महतारी|नियद|अरुण साव|विजय शर्मा|hasdeo|हसदेव|व्यापम|cspdcl|मार्कफेड|bhilai|भिलाई|\\bcg\\b|राज्योत्सव'].concat(R.districts.map(d => d.kw), [R.otherPlaces]).join('|'));
  const CGSRC = rxi('lalluram|dainik chhattisgarh|khabar36|chhattisgarh|cg news|cmo ');
  const SEATS = [];
  if (R.seatNames && R.seatNames.length) R.seatNames.forEach(s => SEATS.push(s)); else R.districts.forEach(d => d.seats.forEach(s => SEATS.push([s, s.toLowerCase()])));
  const cnt = (s, rx) => { const m = s.match(rx); return m ? m.length : 0; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dev = s => { let d = 0, l = 0; for (const c of s) { if (/[\u0900-\u097F]/.test(c)) d++; if (/[A-Za-z\u0900-\u097F]/.test(c)) l++; } return l ? d / l : 0; };

  const L = (CGP.live = {});
  L.cutoff = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setMonth(d.getMonth() - (R.archiveMonths || 12)); return d.getTime(); };
  CGP.socialOn = p => !!(g.CGP_SOCIAL && g.CGP_SOCIAL.meta && g.CGP_SOCIAL.meta.status && g.CGP_SOCIAL.meta.status[p] && g.CGP_SOCIAL.meta.status[p].connected);
  L.tok = t => String(t || '').toLowerCase().replace(/\s+[-–|]\s+[^-–|]{2,40}$/, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(w => w.length > 2);
  L.jac = (a, b) => { if (!a.length || !b.length) return 0; const A = new Set(a); let i = 0; const B = new Set(b); B.forEach(x => { if (A.has(x)) i++; }); return i / (A.size + B.size - i); };

  // Raw {id, ts, t, text, u, s, c, l, v, k, ...} -> full item
  L.tag = function (raw) {
    const text = (raw.t || '') + ' ' + (raw.text || '');
    // topic: most keyword hits, ties by taxonomy order
    let best = null, bc = 0;
    TOPIC.forEach(t => { const c = cnt(text, t.rx); if (c > bc) { bc = c; best = t.id; } });
    let issue = null, specific = false;
    for (const i of ISS) { if (i.rx.test(text) && (!best || i.topic === best)) { issue = i; break; } }
    if (!issue) for (const i of ISS) { if (i.rx.test(text)) { issue = i; break; } }
    let topic = issue ? issue.topic : best || 'governance';
    specific = !!issue;
    const issueName = issue ? issue.name : U.tshort(topic) + ' coverage';

    // district: earliest match among tracked districts
    let district = '', place = '', pos = 1e9;
    DIST.forEach(d => { const m = d.rx.exec(text); if (m && m.index < pos) { pos = m.index; district = d.id; place = U.dname(d.id); } });
    if (!district) { const m = OTHER.exec(text); if (m) place = m[0]; }
    let constituency = '';
    const low = text.toLowerCase();
    for (const s of SEATS) if (low.indexOf(s[1]) >= 0) { constituency = s[0]; break; }

    const neg = cnt(text, NEG), pos2 = cnt(text, POS);
    let stance = Math.sign(pos2 - neg);
    if (!stance && !neg && !pos2 && issue && issue.pol) stance = issue.pol;
    const sentiment = +clamp((pos2 - neg) / (pos2 + neg + 1.5), -1, 1).toFixed(2);

    let speakerType = 'media';
    if (OPP.test(text)) speakerType = 'opp'; else if (GOVT.test(text)) speakerType = 'govt'; else if (BJP.test(text)) speakerType = 'bjp';
    const entities = [];
    let lead = '';
    LEAD.forEach(l => { if (l.rx.test(text)) { entities.push(l.name); if (!lead && ((speakerType === 'opp' && l.group === 'opp') || (speakerType === 'govt' && l.group === 'govt'))) lead = l.name; } });
    ENT.forEach(e => { if (e.rx.test(text)) entities.push(e.name); });
    const mentionsCM = entities.indexOf(R.cm) >= 0;
    const people = [];
    (R.people || []).forEach(p => { if (p.rx.test(text) || p.en.test(text)) people.push(p.name); });
    const speaker = speakerType === 'media' ? (raw.s || 'Unknown') : lead || (speakerType === 'opp' ? 'Opposition (from headline)' : speakerType === 'govt' ? 'Government (from headline)' : 'BJP (from headline)');
    const misinfo = MIS.test(text) ? 0.6 : 0.05;
    const conf = +clamp(0.3 + (district ? 0.18 : 0) + (specific ? 0.22 : 0) + (stance ? 0.15 : 0) + (bc >= 2 ? 0.1 : 0) + (speakerType !== 'media' ? 0.05 : 0), 0, 0.95).toFixed(2);

    return {
      id: raw.id, ts: raw.ts, channel: raw.c || 'News · Online', source: raw.s || 'Unknown', language: raw.l === 'en' || dev(text) < 0.2 ? 'English' : 'Hindi',
      mediaType: raw.c === 'YouTube' ? 'Video' : raw.c === 'News · Print' ? 'Report (e-paper brand)' : raw.c === 'X' || raw.c === 'Facebook' || raw.c === 'Instagram' ? 'Post' : 'Article', prominence: '',
      speakerType, speaker, district, place, constituency, topic, scheme: (R.topics.filter(x => x.id === topic)[0] || {}).scheme || '',
      issue: issueName, narrative: issueName, entities, people, mentionsCM, stance, sentiment,
      emotion: stance < 0 ? 'concern' : stance > 0 ? 'pride' : 'neutral', intent: speakerType === 'opp' ? 'allege' : misinfo > 0.5 ? 'rumour' : 'inform',
      hashtags: (text.match(/#[\w\u0900-\u097F]+/g) || []).slice(0, 4),
      likes: raw.k || 0, shares: raw.shares || 0, comments: raw.comments || 0, views: raw.v || 0, raw: 0, misinfo, headline: raw.t || '', text: raw.text || '',
      link: raw.u || '', origin: raw.origin || 'live', auto: true, conf, pickup: 1, story: raw.id,
      broad: !!(issue && issue.broad) || !issue, generic: !issue, offState: !(CGSIG.test(text) || CGSRC.test(raw.s || ''))
    };
  };

  // Story clustering: items from different outlets with similar titles within 4 days form one story. pickup = distinct outlets.
  L.cluster = function (items) {
    const a = items.slice().sort((x, y) => x.ts - y.ts);
    const tk = a.map(i => L.tok(i.headline));
    const parent = a.map((_, i) => i);
    const find = i => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
    const idx = new Map();
    a.forEach((it, i) => {
      const cand = {};
      tk[i].forEach(w => { const l = idx.get(w); if (l) { for (let j = l.length - 1; j >= Math.max(0, l.length - 60); j--) { const k = l[j]; if (it.ts - a[k].ts > 4 * DAY) break; cand[k] = (cand[k] || 0) + 1; } } });
      Object.keys(cand).forEach(k => { if (cand[k] >= 3 && L.jac(tk[i], tk[k]) >= 0.5) parent[find(i)] = find(+k); });
      tk[i].forEach(w => { let l = idx.get(w); if (!l) idx.set(w, (l = [])); l.push(i); });
    });
    const groups = {};
    a.forEach((it, i) => { const r = find(i); (groups[r] = groups[r] || []).push(it); });
    Object.values(groups).forEach(gr => {
      const srcs = new Set(gr.map(x => x.source));
      gr.forEach(x => { x.pickup = srcs.size; x.story = gr[0].id; });
    });
  };

  // Traction for items without platform metrics: story pickup plus any public view/like counts.
  L.rawScore = it => (it.raw && it.raw > 0 ? it.raw : 12 + 40 * (Math.max(1, it.pickup) - 1) + it.views / 40 + it.likes + 3 * it.shares + 2 * it.comments);

  // ───── links ─────
  const catByHost = h => R.mediaCatalog.filter(m => m.site && h.indexOf(m.site.replace(/^www\./, '')) >= 0)[0];
  L.detect = function (url) {
    let u; try { u = new URL(/^https?:/i.test(url) ? url : 'https://' + url); } catch (e) { return null; }
    const h = u.hostname.replace(/^www\./, '').toLowerCase(), seg = u.pathname.split('/').filter(Boolean);
    if (h.indexOf('.') < 0 && h !== 'localhost') return null;
    let channel = 'News · Online', kind = 'article', source = h, handle = '';
    if (/(^|\.)(x|twitter)\.com$/.test(h)) { channel = 'X'; kind = seg[1] === 'status' ? 'post' : 'handle'; handle = seg[0] ? '@' + seg[0] : ''; source = handle || 'X'; }
    else if (/(^|\.)(facebook|fb)\.com$|fb\.watch/.test(h)) { channel = 'Facebook'; kind = /posts|videos|photo|permalink|reel|watch/.test(u.pathname) ? 'post' : 'page'; handle = seg[0] || ''; source = handle || 'Facebook'; }
    else if (/instagram\.com$/.test(h)) { channel = 'Instagram'; kind = /^(p|reel|reels|tv)$/.test(seg[0]) ? 'post' : 'handle'; handle = /^(p|reel|reels|tv)$/.test(seg[0]) ? '' : '@' + (seg[0] || ''); source = handle || 'Instagram'; }
    else if (/youtube\.com$|youtu\.be$/.test(h)) { channel = 'YouTube'; kind = /watch|shorts|^youtu\.be/.test(u.pathname + h) || h === 'youtu.be' ? 'video' : 'channel'; handle = seg[0] && seg[0][0] === '@' ? seg[0] : ''; source = handle || 'YouTube'; }
    else { const m = catByHost(h); if (m) { source = m.name; channel = m.type === 'Newspaper' ? 'News · Print' : 'News · Online'; } }
    return { host: h, channel, kind, source, handle, url: u.toString() };
  };
  L.slugTitle = url => { try { const p = new URL(url).pathname.split('/').filter(Boolean).pop() || ''; const t = decodeURIComponent(p).replace(/\.(html?|php|aspx?)$/i, '').replace(/[-_]+/g, ' ').replace(/\d{5,}/g, '').trim(); return t.length > 8 ? t : ''; } catch (e) { return ''; } };
  L.fromLink = function (k) {
    const d = L.detect(k.url) || { channel: 'News · Online', source: 'Link' };
    const raw = { id: 'K' + k.id, ts: k.date || k.addedAt, t: k.title || L.slugTitle(k.url) || k.url, text: [k.note, (k.tags || []).map(x => '#' + x).join(' ')].filter(Boolean).join(' '), u: k.url, s: k.source || d.source, c: k.channel || d.channel, l: 'hi', v: +(k.metrics && k.metrics.views) || 0, k: +(k.metrics && k.metrics.likes) || 0, shares: +(k.metrics && k.metrics.shares) || 0, comments: +(k.metrics && k.metrics.comments) || 0, origin: 'link' };
    const it = L.tag(raw);
    if (k.speakerType) { it.speakerType = k.speakerType; if (!k.source) it.speaker = it.source; }
    if (k.district) it.district = k.district;
    if (k.topic) it.topic = k.topic;
    if (k.stance !== undefined && k.stance !== '' && k.stance !== null) it.stance = +k.stance;
    it.conf = 1; it.auto = false; it.curated = true; it.linkId = k.id; it.collection = k.collection || '';
    if (k.speakerType && k.speakerType !== 'media') it.speaker = k.source || d.source;
    return it;
  };

  L.applyOverrides = function (items) {
    const ov = ST.overrides.all();
    items.forEach(it => { const o = ov[it.id]; if (!o) return; Object.assign(it, o); it.curated = true; it.auto = false; it.conf = 1; if (o.topic && !o.issue) it.issue = U.tshort(o.topic) + ' coverage'; });
  };

  // ───── assembly ─────
  L.liveItems = function () {
    if (L._live) return L._live;
    const base = (g.CGP_LIVE && g.CGP_LIVE.items) || [], have = {};
    base.forEach(r => (have[r.id] = 1));
    const extra = [];
    ((g.CGP_ACCOUNTS && g.CGP_ACCOUNTS.accounts) || []).forEach(a => a.items.forEach(r => { if (!have[r.id]) { have[r.id] = 1; extra.push(r); } }));
    ((g.CGP_SOCIAL && g.CGP_SOCIAL.items) || []).forEach(r => { if (!have[r.id]) { have[r.id] = 1; extra.push(r); } });
    const src = base.concat(extra);
    const clipItems = ((g.CGP_CLIPS && g.CGP_CLIPS.items) || []).map(c => Object.assign({}, c, { offState: false }));
    const all = src.map(r => L.tag(r)).concat(clipItems);
    const cut = L.cutoff();
    const items = all.filter(i => !i.offState && i.ts >= cut);
    CGP.liveExcluded = all.length - items.length;
    L.cluster(items);
    CGP.liveMeta = (g.CGP_LIVE && g.CGP_LIVE.meta) || null;
    return (L._live = items);
  };
  L.sampleItems = function () { return L._sample || (L._sample = CGP.generate()); };
  L.linkItems = function () { return ST.links.all().filter(k => k.include !== false).map(L.fromLink); };

  L.assemble = function (mode) {
    let items = [];
    if (mode === 'live' || mode === 'both') items = items.concat(L.liveItems());
    if (mode === 'sample' || mode === 'both') items = items.concat(L.sampleItems());
    items = items.concat(L.linkItems());
    items.forEach(it => { it.raw = L.rawScore(it); });
    L.applyOverrides(items);
    CGP.finalize(items);
    return items;
  };
})(typeof window !== 'undefined' ? window : globalThis);

