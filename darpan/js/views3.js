/* Views, part 3: Voices, Social, People, Library, forms, issue modal. */
(function (g) {
  const CGP = g.CGP, R = CGP.ref, E = CGP.E, U = CGP.U, C = CGP.C, V = CGP.V, I = CGP.icon, M = CGP.M, ST = CGP.store, W = CGP.W, L = CGP.live;
  const DAY = 86400000;
  const sgn = n => (n > 0 ? '+' : '') + n;
  const initials = n => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const card = W.card, pill = W.pill, empty = W.empty;
  const opts = (arr, cur) => arr.map(a => `<option value="${U.esc(a[0])}" ${String(cur) === String(a[0]) ? 'selected' : ''}>${U.esc(a[1])}</option>`).join('');
  const platformUrl = (p, h) => { h = String(h || '').replace(/^@/, ''); if (/^https?:/i.test(h)) return h; return { X: 'https://x.com/' + h, Facebook: 'https://www.facebook.com/' + h, Instagram: 'https://www.instagram.com/' + h, YouTube: /^(channel|c|user)\//.test(h) ? 'https://www.youtube.com/' + h : 'https://www.youtube.com/@' + h.replace(/^@/, '') }[p] || ''; };
  CGP.platformUrl = platformUrl;

  // ───────────── forms ─────────────
  W.field = f => {
    const v = f.v == null ? '' : f.v, id = 'f_' + f.n, req = f.req ? 'required' : '';
    let el;
    if (f.t === 'textarea') el = `<textarea id="${id}" name="${f.n}" rows="${f.rows || 3}" placeholder="${U.esc(f.ph || '')}" ${req}>${U.esc(v)}</textarea>`;
    else if (f.t === 'select') el = `<select id="${id}" name="${f.n}" ${req}>${opts(f.o, v)}</select>`;
    else if (f.t === 'check') el = `<label class="chk"><input type="checkbox" id="${id}" name="${f.n}" ${v ? 'checked' : ''}/> ${U.esc(f.cb || '')}</label>`;
    else el = `<input id="${id}" name="${f.n}" type="${f.t || 'text'}" value="${U.esc(v)}" placeholder="${U.esc(f.ph || '')}" ${req} ${f.step ? 'step="' + f.step + '"' : ''}/>`;
    return `<div class="fld ${f.w || ''}"><label for="${id}">${f.l}${f.req ? ' *' : ''}</label>${el}${f.h ? `<small>${f.h}</small>` : ''}</div>`;
  };
  W.formHtml = spec => `<div class="mcard form"><button class="mclose" data-close aria-label="Close">${I('close', 18)}</button><h3>${spec.title}</h3>${spec.intro ? `<p class="mtext">${spec.intro}</p>` : ''}
    <form id="modalform" class="fgrid">${spec.fields.map(W.field).join('')}<div class="fact"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn" type="submit">${spec.submit || 'Save'}</button></div></form></div>`;

  const dayStr = ts => new Date(ts).toISOString().slice(0, 10);
  const topicOpts = [['', 'Auto-detect']].concat(R.topics.map(t => [t.id, t.name]));
  const distOpts = [['', 'Auto-detect']].concat(R.districts.map(d => [d.id, d.name]));
  CGP.forms = {
    addLink: () => ({ title: 'Add a link', intro: 'Saved in this browser. Paste any article, post, video or page. Topic, district and stance are auto-detected unless you set them. Social platforms are not scraped, so add engagement numbers here when you have them.',
      fields: [
        { n: 'url', l: 'URL', req: true, ph: 'https://…', w: 'full' }, { n: 'title', l: 'Headline or post text', ph: 'Optional. Taken from the URL if empty.', w: 'full' },
        { n: 'note', l: 'Notes', t: 'textarea', w: 'full' }, { n: 'date', l: 'Published', t: 'date', v: dayStr(Date.now()) },
        { n: 'collection', l: 'Collection', ph: 'e.g. Daily analysis, Opposition, To rebut' }, { n: 'tags', l: 'Tags', ph: 'comma separated' },
        { n: 'speakerType', l: 'Speaker', t: 'select', o: [['media', 'Media'], ['opp', 'Opposition'], ['govt', 'Government'], ['bjp', 'BJP'], ['citizen', 'Citizen']], v: 'media' },
        { n: 'stance', l: 'Stance toward government', t: 'select', o: [['', 'Auto-detect'], ['-1', 'Critical'], ['0', 'Neutral'], ['1', 'Supportive']] },
        { n: 'topic', l: 'Topic', t: 'select', o: topicOpts }, { n: 'district', l: 'District', t: 'select', o: distOpts },
        { n: 'likes', l: 'Likes', t: 'number' }, { n: 'shares', l: 'Shares / reposts', t: 'number' }, { n: 'comments', l: 'Comments', t: 'number' }, { n: 'views', l: 'Views', t: 'number' },
        { n: 'include', l: 'Analytics', t: 'check', cb: 'Include in dashboards and answers', v: true, w: 'full' }],
      submit: 'Save link',
      onSubmit: v => { const d = L.detect(v.url); if (!d) return 'That does not look like a valid URL.'; ST.links.add({ url: d.url, title: v.title, note: v.note, date: v.date ? new Date(v.date).getTime() + 12 * 3600000 : Date.now(), collection: v.collection, tags: (v.tags || '').split(',').map(s => s.trim()).filter(Boolean), speakerType: v.speakerType, stance: v.stance, topic: v.topic, district: v.district, metrics: { likes: +v.likes || 0, shares: +v.shares || 0, comments: +v.comments || 0, views: +v.views || 0 }, include: !!v.include, kind: d.kind, channel: d.channel, source: d.source }); return null; } }),
    editLink: id => { const k = ST.links.all().find(x => x.id === id) || {}; const m = k.metrics || {}; const f = CGP.forms.addLink(); f.title = 'Edit link'; f.intro = ''; f.submit = 'Update';
      const vals = { url: k.url, title: k.title, note: k.note, date: dayStr(k.date || Date.now()), collection: k.collection, tags: (k.tags || []).join(', '), speakerType: k.speakerType || 'media', stance: k.stance == null ? '' : String(k.stance), topic: k.topic || '', district: k.district || '', likes: m.likes, shares: m.shares, comments: m.comments, views: m.views, include: k.include !== false };
      f.fields = f.fields.map(x => Object.assign({}, x, { v: vals[x.n] })); const base = f.onSubmit;
      f.onSubmit = v => { const d = L.detect(v.url); if (!d) return 'That does not look like a valid URL.'; ST.links.update(id, { url: d.url, title: v.title, note: v.note, date: v.date ? new Date(v.date).getTime() + 12 * 3600000 : k.date, collection: v.collection, tags: (v.tags || '').split(',').map(s => s.trim()).filter(Boolean), speakerType: v.speakerType, stance: v.stance, topic: v.topic, district: v.district, metrics: { likes: +v.likes || 0, shares: +v.shares || 0, comments: +v.comments || 0, views: +v.views || 0 }, include: !!v.include, kind: d.kind, channel: d.channel, source: d.source }); return null; }; return f; },
    bulkLinks: () => ({ title: 'Paste many links', intro: 'One link per line. Optionally add a title after the URL, separated by a space or " | ". Each becomes a saved link.',
      fields: [{ n: 'text', l: 'Links', t: 'textarea', rows: 9, req: true, w: 'full', ph: 'https://…\nhttps://… | headline' }, { n: 'collection', l: 'Collection', ph: 'e.g. Daily analysis 4 Oct' }, { n: 'speakerType', l: 'Speaker', t: 'select', o: [['media', 'Media'], ['opp', 'Opposition'], ['govt', 'Government'], ['bjp', 'BJP'], ['citizen', 'Citizen']], v: 'media' }],
      submit: 'Save all',
      onSubmit: v => { let n = 0; v.text.split(/\n+/).forEach(line => { const m = line.trim().match(/^(\S+)(?:\s*\|\s*|\s+)?(.*)$/); if (!m) return; const d = L.detect(m[1]); if (!d) return; ST.links.add({ url: d.url, title: m[2] || '', date: Date.now(), collection: v.collection, tags: [], speakerType: v.speakerType, include: true, kind: d.kind, channel: d.channel, source: d.source, metrics: {} }); n++; }); return n ? null : 'No valid URLs found.'; } }),
    addTracked: preset => ({ title: 'Track an account, page or channel', intro: 'Your watch-list. It is saved here and will drive the live connectors (X API, YouTube) once keys are added.',
      fields: [{ n: 'platform', l: 'Platform', t: 'select', o: [['X', 'X'], ['Facebook', 'Facebook'], ['Instagram', 'Instagram'], ['YouTube', 'YouTube'], ['Web', 'Website / RSS']], v: (preset && preset.platform) || 'X' },
        { n: 'handle', l: 'Handle, channel or URL', req: true, v: (preset && preset.handle) || '', ph: '@name or https://…' }, { n: 'name', l: 'Name', v: (preset && preset.name) || '' },
        { n: 'group', l: 'Group', t: 'select', o: [['media', 'Media'], ['govt', 'Government'], ['bjp', 'BJP'], ['opp', 'Opposition'], ['influencer', 'Influencer / creator'], ['other', 'Other']], v: (preset && preset.group) || 'media' }, { n: 'notes', l: 'Notes', t: 'textarea', w: 'full' }],
      submit: 'Add to watch-list', onSubmit: v => { ST.tracked.add({ platform: v.platform, handle: v.handle.trim(), name: v.name, group: v.group, notes: v.notes, active: true }); return null; } }),
    addCommitment: kind => ({ title: kind === 'rival' ? 'Add a rival commitment' : 'Add a public commitment', intro: 'Only measurable public commitments. Keywords link later coverage to it as evidence (use | for alternatives).',
      fields: [{ n: 'text', l: 'Commitment', req: true, w: 'full' }, { n: 'who', l: 'Made by', v: kind === 'rival' ? 'Rival party' : 'State government' }, { n: 'announced', l: 'Announced (YYYY-MM)', ph: '2025-01' }, { n: 'deadline', l: 'Deadline (YYYY-MM-DD)', t: 'date' }, { n: 'place', l: 'Place', ph: 'Statewide / district' }, { n: 'budget', l: 'Budget' }, { n: 'kw', l: 'Evidence keywords', w: 'full', ph: 'e.g. महतारी वंदन|mahtari vandan', h: 'Matched against headlines in Hindi or English.' }],
      submit: 'Add', onSubmit: v => { ST.commitments.add({ text: v.text, who: v.who, announced: v.announced, deadline: v.deadline || null, place: v.place, budget: v.budget, kw: v.kw, rival: kind === 'rival' }); return null; } }),
    addStatement: () => ({ title: 'Add a public statement', intro: 'Verbatim quotes by public figures in their public roles. Keep the exact words, the date and the source.',
      fields: [{ n: 'speaker', l: 'Speaker', req: true }, { n: 'party', l: 'Party / role' }, { n: 'quote', l: 'Verbatim quote', t: 'textarea', req: true, w: 'full' }, { n: 'date', l: 'Date', t: 'date', v: dayStr(Date.now()) }, { n: 'venue', l: 'Venue / medium', ph: 'Assembly, rally, interview, post' },
        { n: 'topic', l: 'Topic', t: 'select', o: R.topics.map(t => [t.id, t.name]) }, { n: 'stance', l: 'Stance on the topic', t: 'select', o: [['1', 'Supportive'], ['0', 'Neutral'], ['-1', 'Critical']], v: '0' }, { n: 'url', l: 'Source URL', w: 'full' }],
      submit: 'Save statement', onSubmit: v => { ST.statements.add({ speaker: v.speaker, party: v.party, quote: v.quote, date: v.date ? new Date(v.date).getTime() : Date.now(), venue: v.venue, topic: v.topic, stance: +v.stance, url: v.url }); return null; } }),
    logAction: issue => ({ title: 'Log a response', intro: 'Record what was done. After 3 days the platform shows the change in coverage of the same issue.',
      fields: [{ n: 'issue', l: 'Issue', t: 'select', o: [['', 'Whole topic (choose below)']].concat(Object.keys(M.S.byIssue).sort().map(k => [k, k])), v: issue || '' }, { n: 'topic', l: 'Topic (if no issue)', t: 'select', o: R.topics.map(t => [t.id, t.name]) },
        { n: 'type', l: 'Response', t: 'select', o: ['District officer clarification', 'State press note', 'Field team visit', 'Social media update', 'Spokesperson statement', 'Minister visit', 'Other'].map(x => [x, x]) }, { n: 'district', l: 'Place', t: 'select', o: [['', 'Statewide']].concat(R.districts.map(d => [d.id, d.name])) },
        { n: 'date', l: 'Date', t: 'date', v: dayStr(Date.now()) }, { n: 'note', l: 'Notes', t: 'textarea', w: 'full' }],
      submit: 'Log response', onSubmit: v => { const first = v.issue ? (M.S.byIssue[v.issue] || [])[0] : null; ST.actions.add({ issue: v.issue, topic: v.issue ? (first || {}).topic : v.topic, type: v.type, district: v.district, ts: new Date(v.date).getTime() + 10 * 3600000, note: v.note }); return null; } }),
    addDataset: () => ({ title: 'Add an official dataset', intro: 'Paste rows as CSV: district, period (YYYY-MM), value. District may be a name or id. Stays in this browser.',
      fields: [{ n: 'name', l: 'Name', req: true, ph: 'e.g. Mahtari Vandan beneficiaries (official)' }, { n: 'topic', l: 'Compare with topic', t: 'select', o: R.topics.map(t => [t.id, t.name]) }, { n: 'unit', l: 'Unit', ph: 'grievances, payments…' },
        { n: 'csv', l: 'Rows', t: 'textarea', rows: 8, req: true, w: 'full', ph: 'Raipur,2026-08,120\nKorba,2026-08,75' }],
      submit: 'Save dataset', onSubmit: v => { const rows = []; v.csv.split(/\n+/).forEach(l => { const p = l.split(','); if (p.length < 3) return; const d = R.districts.find(x => x.id === p[0].trim().toLowerCase() || x.name.toLowerCase() === p[0].trim().toLowerCase()); if (d && /^\d{4}-\d{2}$/.test(p[1].trim())) rows.push({ district: d.id, period: p[1].trim(), value: +p[2] || 0 }); });
        if (!rows.length) return 'No valid rows. Use: district,YYYY-MM,value'; ST.datasets.add({ name: v.name, topic: v.topic, unit: v.unit, rows }); return null; } })
  };

  // ───────────── issue modal ─────────────
  V.issueModal = name => {
    const St = M.S, arr = St.byIssue[name] || [], topic = (arr[0] || {}).topic;
    const last7 = arr.filter(i => St.now - i.ts < 7 * DAY).length, prev7 = arr.filter(i => St.now - i.ts >= 7 * DAY && St.now - i.ts < 14 * DAY).length;
    const pre = M.precedents(name, null, 3), pb = M.playbook(name, topic), rb = M.rebuttal(name);
    const rel = M.chains().filter(c => c.A === name || c.B === name).concat(M.commonFactors().filter(c => c.issue === name));
    const status = ST.rebuttals.all()[name] || '';
    const dists = {}; arr.forEach(i => { if (i.district) dists[i.district] = (dists[i.district] || 0) + 1; });
    return `<div class="mcard issuem"><button class="mclose" data-close aria-label="Close">${I('close', 18)}</button>
      <div class="mhead"><span class="chip">${U.tname(topic || 'governance')}</span><span>${arr.length} items in archive · ${last7} in 7 days (${prev7} the week before)</span></div>
      <h3>${U.esc(name)}</h3>${W.hist(name)}
      <div class="mgrid">
        <section><h5>Precedents</h5>${pre.length ? pre.map(e => `<div class="orow"><div><b>${M.lifecycle(e)}</b><p>${Object.keys(e.dists).sort((a, b) => e.dists[b] - e.dists[a]).slice(0, 3).map(U.dname).join(', ') || 'place not stated'} · ${e.issue === name ? 'same issue' : 'same topic'}</p></div>${W.ev(e.ids, 2).replace('<span>Evidence</span>', '')}</div>`).join('') : '<p class="muted">No closed precedent in the archive.</p>'}</section>
        <section><h5>What tended to follow a response</h5>${pb ? `<p>${U.esc(pb.text)}</p>` : '<p class="muted">No reliable logged responses on this issue or topic yet.</p>'}<button class="btn ghost" data-form="logAction" data-arg="${U.esc(name)}">${I('plus', 16)} Log a response</button></section>
        <section><h5>Related patterns</h5>${rel.length ? rel.slice(0, 3).map(W.corr).join('') : '<p class="muted">No chain or common factor found for this issue.</p>'}</section>
        <section><h5>Rebuttal skeleton</h5>${rb.claim ? `<p class="claim">Latest line in coverage: “${U.esc(rb.claim)}”</p>` : ''}<ol class="acts">${rb.draft.map(d => `<li>${U.esc(d)}</li>`).join('')}</ol>
          <div class="seg">${[['', 'Not started'], ['drafting', 'Drafting'], ['approved', 'Approved'], ['sent', 'Sent'], ['skip', 'No response']].map(s => `<button class="${status === s[0] ? 'on' : ''}" data-rb-issue="${U.esc(name)}" data-rb-status="${s[0]}">${s[1]}</button>`).join('')}</div></section>
      </div>
      <h5>Latest items</h5>${E.top(arr.slice().sort((a, b) => b.ts - a.ts).slice(0, 40), 4, 'ts').map(CGP.C.postRow).join('')}
      <div class="chips" style="margin-top:12px"><button class="btn ghost" data-ask="What was published about ${U.esc(name)} in the last 30 days?">${I('ask', 16)} Ask about this</button></div></div>`;
  };

  // ───────────── Voices ─────────────
  V.voices = S => {
    const tabs = [['attack', 'Attack lines'], ['board', 'Rebuttal board'], ['statements', 'Statements'], ['pack', 'Prep pack']];
    const t = W.cur(S, 'attack'), x = V.ctx(S);
    let body = '';
    if (t === 'attack') body = V.opposition(S);
    else if (t === 'board') {
      const o = E.opposition(x.items, x.range), st = ST.rebuttals.all();
      const col = (key, label, tone) => { const rows = o.filter(i => (st[i.issue] || '') === key); return `<div class="kcol"><h5>${label} <em>${rows.length}</em></h5>${rows.map(i => `<button class="kcard" data-open-issue="${U.esc(i.issue)}"><b>${U.esc(i.issue)}</b><small>${i.n} items · traction ${i.avgTraction} · ${U.tshort(i.topic)}</small>${i.gap ? '<span class="tag neg">Response gap</span>' : ''}</button>`).join('') || '<p class="muted sm">Empty</p>'}</div>`; };
      body = `<div class="bento">${card({ cls: 'span12', title: 'Rebuttal board', sub: 'Open an issue to see precedents, what worked before and a rebuttal skeleton, then move it along.', body: `<div class="kanban">${col('', 'Not started')}${col('drafting', 'Drafting')}${col('approved', 'Approved')}${col('sent', 'Sent')}${col('skip', 'No response')}</div>` })}</div>`;
    } else if (t === 'statements') {
      const sts = M.statements().filter(s => !S.stq || (s.speaker + ' ' + s.quote + ' ' + s.topic).toLowerCase().indexOf(S.stq.toLowerCase()) >= 0), sh = M.positionShifts();
      const vr = S.vres;
      body = `<div class="bento">
        ${card({ cls: 'span12', title: 'Verify a quote', sub: 'Paste a quote that is going around. The platform looks for it in the statement store and the archive.', body: `<form id="vqform" class="inline-form"><input id="vq" placeholder="Paste the quote or claim…" value="${U.esc(S.vq || '')}"/><button class="btn" type="submit">${I('search', 16)} Check</button></form>${vr ? (vr.length ? vr.map(m => `<div class="orow"><div><b>${U.esc(m.text)}</b><p>${m.kind} · ${U.esc(m.who)} · ${U.dstr(m.ts)} · match ${Math.round(m.sc * 100)}%</p></div>${m.id ? `<button class="src" data-item="${m.id}">View</button>` : m.url ? `<a class="src" target="_blank" rel="noopener" href="${U.esc(m.url)}">Source</a>` : ''}</div>`).join('') : '<p class="muted">No match in the store or the archive. That does not make the quote false: the archive only holds what it has collected.</p>') : ''}` })}
        ${sh.length ? card({ cls: 'span12 warncard', title: 'Possible position shifts', sub: 'Same speaker, same topic, opposite stance. Both quotes shown. Human judgement required.', body: sh.map(p => `<div class="shift"><b>${U.esc(p.speaker)} · ${U.tname(p.topic)}</b><div class="two"><blockquote>${U.esc(p.a.quote)}<cite>${U.dstr(p.a.date)} · ${U.esc(p.a.venue || '')}</cite></blockquote><blockquote>${U.esc(p.b.quote)}<cite>${U.dstr(p.b.date)} · ${U.esc(p.b.venue || '')}</cite></blockquote></div></div>`).join('') }) : ''}
        ${card({ cls: 'span12', title: 'Public statement record', sub: 'Verbatim quotes, newest first. Public figures in public roles only.', right: `<div class="filters"><input class="search" data-stq placeholder="Search statements" value="${U.esc(S.stq || '')}"/><button class="btn" data-form="addStatement">${I('plus', 16)} Add statement</button></div>`,
          body: sts.length ? sts.map(s => `<blockquote class="stq"><p>“${U.esc(s.quote)}”</p><cite><b>${U.esc(s.speaker)}</b> · ${U.tname(s.topic)} · ${U.dstr(s.date)}${s.venue ? ' · ' + U.esc(s.venue) : ''} ${s.stance != null ? C.stanceTag(+s.stance) : ''}${s.url ? ` · <a href="${U.esc(s.url)}" target="_blank" rel="noopener">source</a>` : ''}${s.sample ? ' · <span class="tag warn">Fictional</span>' : `<button class="icon-btn" data-del="statements|${s.id}" aria-label="Delete">${I('trash', 14)}</button>`}</cite></blockquote>`).join('') : empty('No statements yet', 'Add verbatim public statements. The demo dataset has fictional examples; real names are never invented.') })}</div>`;
    } else {
      const tid = S.packTopic || 'farmers', tp = R.topics.find(z => z.id === tid), items = E.scope(CGP.items, { range: E.range(30) }).filter(i => i.topic === tid), st = E.stats(items);
      const o = E.opposition(items, E.range(30)).slice(0, 3), stm = M.statements().filter(s => s.topic === tid).slice(0, 4), cm = M.commitments().filter(c => c.ids.some(id => (CGP.index[id] || {}).topic === tid)).slice(0, 3);
      body = `<div class="bento">${card({ cls: 'span12 pack', title: 'Debate prep pack: ' + tp.name, sub: 'Facts, claims and records for one topic, last 30 days', right: `<div class="filters"><select data-pack>${opts(R.topics.map(z => [z.id, z.name]), tid)}</select><button class="btn" onclick="window.print()">${I('print', 16)} Print</button></div>`,
        body: `<div class="tiles">${[['Items', st.n], ['Critical', U.pct(st.critical, st.n) + '%'], ['Supportive', U.pct(st.support, st.n) + '%'], ['Reach', U.fmt(st.reach)]].map(z => `<div class="tile-s"><span>${z[0]}</span><b>${z[1]}</b></div>`).join('')}</div>
          <h5>Lines the other side is using</h5>${o.length ? o.map(i => `<div class="orow"><div>${W.ilink(i.issue)}<p>${i.n} items · traction ${i.avgTraction}</p>${W.hist(i.issue)}</div></div>`).join('') : '<p class="muted">No opposition issue on this topic in the window.</p>'}
          <h5>Public record on the topic</h5>${stm.length ? stm.map(s => `<blockquote class="stq"><p>“${U.esc(s.quote)}”</p><cite>${U.esc(s.speaker)} · ${U.dstr(s.date)}${s.sample ? ' · fictional' : ''}</cite></blockquote>`).join('') : '<p class="muted">No statements stored for this topic.</p>'}
          <h5>Commitments touching it</h5>${cm.length ? cm.map(c => `<div class="orow"><div><b>${U.esc(c.text)}</b><p>${U.esc(c.who)} · ${c.deadline || 'no deadline'}</p></div>${pill(c.status, /Delivered/.test(c.status) ? 'pos' : /Delayed|rising/.test(c.status) ? 'neg' : 'neu')}</div>`).join('') : '<p class="muted">None linked.</p>'}
          <h5>Most amplified</h5>${E.top(items, 3).map(C.postRow).join('')}` })}</div>`;
    }
    return W.tabs(S, tabs) + body;
  };

  // ───────────── Social ─────────────
  V.social = S => {
    const tabs = [['traction', 'Traction'], ['tags', 'Trends & amplification'], ['official', 'Official content']];
    const t = W.cur(S, 'traction'), x = V.ctx(S);
    let body = '';
    if (t === 'traction') body = V.traction(S);
    else if (t === 'tags') {
      const tag = {}, ptag = {};
      x.items.forEach(i => i.hashtags.forEach(h => (tag[h] = (tag[h] || 0) + 1))); x.prev.forEach(i => i.hashtags.forEach(h => (ptag[h] = (ptag[h] || 0) + 1)));
      const tags = Object.keys(tag).sort((a, b) => tag[b] - tag[a]).slice(0, 10);
      const iss = E.countBy(x.items, 'issue').slice(0, 10).map(r => ({ k: r.k, n: r.n, p: x.prev.filter(i => i.issue === r.k).length }));
      const amp = x.items.filter(i => i.stance > 0 && ['media', 'govt', 'bjp'].indexOf(i.speakerType) >= 0).sort((a, b) => (b.conf || 0) - (a.conf || 0) || a.traction - b.traction).filter(i => i.traction <= 55).sort((a, b) => b.ts - a.ts).slice(0, 8);
      body = `<div class="bento">${card({ cls: 'span6', title: 'Trending hashtags', sub: 'Mentions in the window vs the previous one', body: tags.length ? C.hbars(tags.map(h => ({ label: U.esc(h), value: tag[h], right: tag[h] + ' (' + (ptag[h] || 0) + ' before)', color: tag[h] > (ptag[h] || 0) ? 'var(--warn)' : 'var(--sky)' }))) : empty('No hashtags in this data', 'News headlines rarely carry hashtags. Posts you add to the Library with #tags show up here.') })}
        ${card({ cls: 'span6', title: 'Trending issues', sub: 'Items in the window vs the previous one', body: C.hbars(iss.map(r => ({ label: W.ilink(r.k), value: r.n, right: r.n + ' (' + r.p + ' before)', color: r.n > r.p ? 'var(--warn)' : 'var(--sky)' }))) })}
        ${card({ cls: 'span12', title: 'Amplification candidates', sub: 'Positive stories that have not travelled yet. Check facts and the source before sharing.', body: amp.length ? amp.map(i => `<div class="amp">${C.postRow(i)}<button class="btn ghost" data-copy="${U.esc((i.headline + (i.link ? ' ' + i.link : '')).slice(0, 280))}">${I('copy', 16)} Copy draft</button></div>`).join('') : empty('No under-amplified positive story right now') })}</div>`;
    } else {
      const off = x.items.filter(i => i.speakerType === 'govt' || i.speakerType === 'bjp'), opp = x.items.filter(i => i.speakerType === 'opp');
      const avg = a => (a.length ? Math.round(a.reduce((s, i) => s + i.traction, 0) / a.length) : 0);
      const by = {}; off.forEach(i => (by[i.channel] = by[i.channel] || []).push(i));
      body = `<div class="bento">${card({ cls: 'span5', title: 'Official vs opposition traction', sub: 'Average traction score in the window', body: `<div class="tiles">${[['Official items', off.length], ['Avg traction', avg(off)], ['Opposition items', opp.length], ['Avg traction ', avg(opp)]].map(z => `<div class="tile-s"><span>${z[0]}</span><b>${z[1]}</b></div>`).join('')}</div><h5>By channel (official)</h5>${C.hbars(Object.keys(by).map(k => ({ label: k, value: avg(by[k]) + 1, right: 'avg ' + avg(by[k]) + ' · ' + by[k].length, color: U.chColor(k) })))}` })}
        ${card({ cls: 'span7', title: 'Best official content', sub: 'Highest traction from government and party voices', body: E.top(off, 6).map(C.postRow).join('') || empty('No official-voice items in this window', 'Add official posts to the Library with their engagement numbers.') })}</div>`;
    }
    return W.tabs(S, tabs) + body;
  };

  // ───────────── People ─────────────
  V.people = S => {
    const tabs = [['leaders', 'Leaders & MLAs'], ['roles', 'Roles as of a date'], ['dossier', 'Dossier']];
    const t = W.cur(S, 'leaders');
    let body = '';
    if (t === 'leaders') body = V.leaders(S);
    else if (t === 'roles') {
      const asOf = S.asOf ? new Date(S.asOf).getTime() : Date.now(), ten = M.tenures(), now = Date.now();
      body = `<div class="bento">${card({ cls: 'span5', title: 'Who held which role?', sub: 'Historical items are linked to the person in post at the time, not today\'s holder.', right: `<input type="date" data-asof value="${S.asOf || dayStr(now)}"/>`,
        body: M.asOf(asOf).map(r => `<div class="orow"><div><b>${U.esc(r.who)}</b><p>${U.esc(r.role)} · since ${U.esc(r.from)}</p></div>${pill('in post')}</div>`).join('') || '<p class="muted">No role on record for that date.</p>' })}
        ${card({ cls: 'span7', title: 'Tenures and coverage', sub: 'Approximate dates from public reports; a curator should verify them. Counts are mentions in the archive.',
          body: `<table class="tbl"><thead><tr><th>Person</th><th>Role</th><th>From</th><th>To</th><th class="r">Mentions</th></tr></thead><tbody>${ten.map(r => `<tr><td><b>${U.esc(r.who)}</b></td><td>${U.esc(r.role)}</td><td>${U.esc(r.from)}</td><td>${r.to ? U.esc(r.to) : 'present'}</td><td class="r">${r.covered ? r.n : '<span class="muted" data-tip="Before the archive starts">n/a</span>'}</td></tr>`).join('')}</tbody></table>` })}</div>`;
    } else {
      const d = S.dosD || 'raipur', dos = M.dossier(d, S.dosSeat || ''), dist = R.districts.find(x => x.id === d);
      const mk = Object.keys(dos.byMonth).sort();
      body = `<div class="bento">${card({ cls: 'span12', title: 'Constituency and district dossier', sub: 'Public record for the current term (from Dec 2023, or the start of the archive). One-page summary first.', right: `<div class="filters"><select data-dos>${opts(R.districts.map(z => [z.id, z.name]), d)}</select><select data-dosseat>${opts([['', 'Whole district']].concat(dist.seats.map(s => [s, s])), S.dosSeat || '')}</select></div>`,
        body: dos.thin ? empty('Thin record', 'Fewer than 10 items for this selection in the archive. Add links or widen the archive.') : `<div class="tiles">${[['Items', dos.its.length], ['Recurring issues', dos.fam.length], ['Open issues now', dos.act.length], ['Visits covered', dos.visits]].map(z => `<div class="tile-s"><span>${z[0]}</span><b>${z[1]}</b></div>`).join('')}</div>
          <h5>Coverage by month</h5>${C.columns(mk.map(k => dos.byMonth[k]), mk.map(k => k.slice(2)), { h: 110 })}
          <div class="mgrid"><section><h5>Recurring issues here</h5>${dos.fam.slice(0, 6).map(f => `<div class="orow"><div>${W.ilink(f.issue)}<p>${f.count} episodes · about every ${Math.round(f.meanInterval)} days</p></div></div>`).join('') || '<p class="muted">None with two or more episodes.</p>'}</section>
          <section><h5>Open now</h5>${dos.act.map(e => `<div class="orow"><div>${W.ilink(e.issue)}<p>since ${U.dstr(e.start)} · ${e.n} items</p></div></div>`).join('') || '<p class="muted">No active critical issue.</p>'}</section>
          <section><h5>Commitments with coverage here</h5>${dos.cm.map(c => `<div class="orow"><div><b>${U.esc(c.text)}</b></div>${pill(c.status, /Delivered/.test(c.status) ? 'pos' : 'neu')}</div>`).join('') || '<p class="muted">None linked yet.</p>'}</section></div>` })}</div>`;
    }
    return W.tabs(S, tabs) + body;
  };

  // ───────────── Library ─────────────
  V.library = S => {
    const tabs = [['links', 'Links'], ['tracked', 'Tracked accounts'], ['sources', 'Sources'], ['review', 'Review queue'], ['data', 'Data & method']];
    const t = W.cur(S, 'links');
    return W.tabs(S, tabs) + (V['lib_' + t] || V.lib_links)(S);
  };

  V.lib_links = S => {
    const all = ST.links.all(), f = S.lib, cols = [...new Set(all.map(k => k.collection).filter(Boolean))];
    const list = all.filter(k => (!f.q || (k.title + ' ' + k.url + ' ' + (k.note || '') + ' ' + (k.tags || []).join(' ')).toLowerCase().indexOf(f.q.toLowerCase()) >= 0) && (f.col === 'all' || (k.collection || '') === f.col) && (f.ch === 'all' || ((L.detect(k.url) || {}).channel === f.ch)));
    const row = k => { const d = L.detect(k.url) || { channel: 'News · Online', source: 'Link' }, it = CGP.index['K' + k.id], title = k.title || L.slugTitle(k.url) || k.url;
      return `<article class="link-row ${k.include === false ? 'off' : ''}">${C.chBadge(k.channel || d.channel)}
        <div class="lbody"><a href="${U.esc(k.url)}" target="_blank" rel="noopener" class="ltitle">${U.esc(title)}</a>
          <div class="lmeta"><span>${U.esc(k.source || d.source)}</span><span>${U.dstr(k.date || k.addedAt)}</span>${k.collection ? `<span class="chip ghost">${U.esc(k.collection)}</span>` : ''}${(k.tags || []).map(x => `<span class="chip ghost">#${U.esc(x)}</span>`).join('')}${k.metrics && (k.metrics.views || k.metrics.likes || k.metrics.shares) ? `<span>${I('heart', 13)} ${U.fmt(k.metrics.likes || 0)} · ${I('share', 13)} ${U.fmt(k.metrics.shares || 0)} · ${I('eye', 13)} ${U.fmt(k.metrics.views || 0)}</span>` : ''}</div>
          ${k.note ? `<p class="lnote">${U.esc(k.note)}</p>` : ''}
          ${it && k.include !== false ? `<div class="ltags"><span class="tag neu">${U.tshort(it.topic)}</span>${it.district ? `<span class="tag neu">${U.dname(it.district)}</span>` : ''}${C.stanceTag(it.stance)}<span class="tag neu">${(R.speakers[it.speakerType] || {}).label || it.speakerType}</span></div>` : ''}</div>
        <div class="lact"><label class="chk" data-tip="Include in dashboards and answers"><input type="checkbox" data-link-toggle="${k.id}" ${k.include !== false ? 'checked' : ''}/> In analytics</label><button class="icon-btn" data-form="editLink" data-arg="${k.id}" aria-label="Edit">${I('edit', 15)}</button><button class="icon-btn" data-del="links|${k.id}" aria-label="Delete">${I('trash', 15)}</button></div></article>`; };
    return `<div class="bento">${card({ cls: 'span12', title: 'Link library', sub: ST.persistent ? 'Everything here is saved in this browser and survives reloads. Nothing is uploaded. Export a backup regularly.' : '<b>Storage is blocked in this browser, so links will be lost on reload.</b> Export often.',
      right: `<div class="filters"><button class="btn" data-form="addLink">${I('plus', 16)} Add link</button><button class="btn ghost" data-form="bulkLinks">Paste many</button><button class="btn ghost" data-export="json">${I('download', 16)} JSON</button><button class="btn ghost" data-export="csv">CSV</button><label class="btn ghost">${I('upload', 16)} Import<input type="file" hidden accept=".json,application/json" data-import="links"/></label></div>`,
      body: `<div class="filters libf"><input class="search" data-libq placeholder="Search saved links" value="${U.esc(f.q)}"/><select data-libcol><option value="all">All collections</option>${cols.map(c => `<option ${f.col === c ? 'selected' : ''}>${U.esc(c)}</option>`).join('')}</select><select data-libch>${opts([['all', 'All platforms']].concat(R.channels.map(c => [c.id, c.id])), f.ch)}</select></div>
        <p class="muted sm">${all.length} saved · ${all.filter(k => k.include !== false).length} in analytics. Links with engagement numbers count toward traction. Social posts are not scraped; this is how X, Facebook and Instagram posts get in until an API or vendor is connected.</p>
        ${list.length ? list.map(row).join('') : empty(all.length ? 'No link matches' : 'No links saved yet', 'Use “Add link” for one, “Paste many” for a list, or import a JSON file. Each link is tagged and joins the dashboards.')}` })}</div>`;
  };

  // ????????????? tracked-account updates (data/accounts.js, written by scripts/track.py) ?????????????
  const ACC = () => (g.CGP_ACCOUNTS && g.CGP_ACCOUNTS.accounts) || [];
  const norm = h => String(h || '').toLowerCase().replace(/^@/, '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  const accRef = () => (g.CGP_ACCOUNTS && Date.parse(g.CGP_ACCOUNTS.meta.generated)) || Date.now();
  const accTagged = () => { const m = {}; try { L.liveItems().forEach(i => (m[i.id] = i)); } catch (e) { /* no live data */ } return m; };
  // Only items the tagger kept as Chhattisgarh-relevant (an outlet's national or sports stories are dropped).
  const accItems = (a, tg) => (Object.keys(tg).length ? a.items.filter(i => tg[i.id]) : a.items);
  const accStats = (a, tg, ref) => {
    const list = accItems(a, tg), its = list.map(i => tg[i.id] || null), has = its.filter(Boolean);
    const iss = {}; has.forEach(i => { if (i.issue && !i.generic && !i.broad) iss[i.issue] = (iss[i.issue] || 0) + 1; });
    const top = Object.keys(iss).sort((x, y) => iss[y] - iss[x])[0] || '';
    const net = has.reduce((t, i) => t + (i.stance || 0), 0);
    return { n7: list.filter(i => i.ts >= ref - 7 * DAY).length, n30: list.length, top, net, last: list[0] || null };
  };
  const feedBadge = a => {
    const f = a.feeds || [], ok = t => f.some(x => x.type === t && x.ok);
    const parts = []; if (ok('site') || ok('rss')) parts.push('site'); if (ok('youtube')) parts.push('YouTube'); if (ok('mentions')) parts.push('mentions');
    return parts.length ? pill(parts.join(' + '), 'pos') : pill('no feed', 'neg');
  };
  V.account = key => {
    const a = ACC().find(x => x.key === key); if (!a) return '';
    const tg = accTagged(), ref = accRef();
    return `<div class="mcard"><button class="mclose" data-close aria-label="Close">${I('close', 18)}</button>
      <div class="mhead"><span>${U.esc(a.group === 'govt' ? 'Government' : a.group === 'media' ? 'Media' : a.group)}</span>${feedBadge(a)}</div>
      <h3>${U.esc(a.name)}</h3>
      <div class="chips">${(a.handles || []).map(h => `<a class="chip ghost" target="_blank" rel="noopener" href="${U.esc(platformUrl(h.platform, h.handle))}">${U.esc(h.platform)} ${U.esc(h.handle)}</a>`).join('')}${a.site ? `<a class="chip ghost" target="_blank" rel="noopener" href="https://${U.esc(a.site)}">${U.esc(a.site)}</a>` : ''}</div>
      <h5>How this account is collected</h5>
      ${(a.feeds || []).map(f => `<div class="orow"><div><b>${U.esc(f.type)}</b><p>${U.esc(f.note)}</p></div>${pill(f.ok ? 'ok' : 'failed', f.ok ? 'pos' : 'neg')}</div>`).join('') || '<p class="muted">Nothing collected yet.</p>'}
      <h5>Latest updates (${accItems(a, tg).length}, last ${(g.CGP_ACCOUNTS.meta || {}).days || 30} days)</h5>
      ${accItems(a, tg).slice(0, 20).map(i => { const t = tg[i.id]; return `<div class="orow"><div><a href="${U.esc(i.u)}" target="_blank" rel="noopener"><b>${U.esc(i.t)}</b></a><p>${U.esc(i.s)} ? ${U.when(i.ts)}${i.v ? ' ? ' + U.fmt(i.v) + ' views' : ''}${i.kind === 'mention' ? ' ? cites the account' : ''}${t && t.issue && !t.generic ? ' ? ' + U.esc(t.issue) : ''}</p></div>${t ? pill(t.stance > 0 ? 'supportive' : t.stance < 0 ? 'critical' : 'neutral', t.stance > 0 ? 'pos' : t.stance < 0 ? 'neg' : 'neu') : ''}</div>`; }).join('') || '<p class="muted">No items in the window.</p>'}</div>`;
  };
  V.trackedUpdates = () => {
    const accts = ACC(), meta = (g.CGP_ACCOUNTS && g.CGP_ACCOUNTS.meta) || {};
    if (!accts.length) return card({ cls: 'span12', title: 'Updates from tracked accounts', body: empty('No collection yet', 'Run scripts/track.py to fetch the latest from every account below. It writes data/accounts.js.') });
    const tg = accTagged(), ref = accRef();
    const rows = accts.map(a => ({ a, s: accStats(a, tg, ref) })).sort((x, y) => (y.s.n7 - x.s.n7) || (y.s.n30 - x.s.n30));
    const all7 = []; accts.forEach(a => accItems(a, tg).forEach(i => { if (i.ts >= ref - 7 * DAY) all7.push({ a, i, t: tg[i.id] }); }));
    const byIssue = {};
    all7.forEach(r => { if (!r.t || !r.t.issue || r.t.generic || r.t.broad) return; const k = r.t.issue; (byIssue[k] = byIssue[k] || { k, n: 0, net: 0, who: {}, ex: r }); byIssue[k].n++; byIssue[k].net += r.t.stance || 0; byIssue[k].who[r.a.name] = 1; });
    const pts = Object.values(byIssue).sort((x, y) => y.n - x.n).slice(0, 8);
    const latest = all7.sort((x, y) => y.i.ts - x.i.ts).slice(0, 8);
    const mine = ST.tracked.all(), seen = {};
    mine.forEach(m => { const k = norm(m.handle); const hit = accts.find(a => (a.handles || []).some(h => norm(h.handle) === k) || (a.site && norm(a.site) === k) || a.name.toLowerCase() === String(m.name || '').toLowerCase()); if (!hit) seen[m.id] = m; });
    const pending = Object.values(seen);
    return `${card({ cls: 'span12', title: 'Key points from tracked accounts, last 7 days', sub: `Collected ${U.esc((meta.generated || '').slice(0, 10))} from ${accts.length} accounts. ${U.esc(meta.note || '')}`,
      right: `<button class="btn ghost" data-export="watchlist">${I('up', 16)} Download watch-list</button>`,
      body: `<div class="mgrid"><section><h5>Issues raised</h5>${pts.map(p => `<div class="orow"><div>${W.ilink(p.k)}<p>${p.n} items ? ${Object.keys(p.who).slice(0, 3).map(U.esc).join(', ')}${Object.keys(p.who).length > 3 ? ' +' + (Object.keys(p.who).length - 3) : ''}</p></div>${pill(p.net > 0 ? 'supportive' : p.net < 0 ? 'critical' : 'mixed', p.net > 0 ? 'pos' : p.net < 0 ? 'neg' : 'neu')}</div>`).join('') || '<p class="muted">No tagged issue in the last 7 days.</p>'}</section>
      <section><h5>Latest updates</h5>${latest.map(r => `<div class="orow"><div><a href="${U.esc(r.i.u)}" target="_blank" rel="noopener"><b>${U.esc(r.i.t)}</b></a><p>${U.esc(r.a.name)} ? ${U.when(r.i.ts)}</p></div></div>`).join('') || '<p class="muted">Nothing in the last 7 days.</p>'}</section></div>` })}
    ${card({ cls: 'span12', title: 'Account by account', sub: 'Click an account for its latest updates and how it was collected. X, Facebook and Instagram posts cannot be scraped; those rows show news that cites the handle.',
      body: `<div class="mla-tbl-wrap"><table class="tbl"><thead><tr><th>Account</th><th>Handles</th><th>Collected via</th><th class="r">7 days</th><th class="r">30 days</th><th>Top issue</th><th>Latest</th></tr></thead><tbody>${rows.map(r => `<tr class="click" tabindex="0" data-account="${U.esc(r.a.key)}"><td><b>${U.esc(r.a.name)}</b><small>${U.esc(r.a.group === 'govt' ? 'Government' : r.a.type || r.a.group)}${r.a.user ? ' ? yours' : ''}</small></td><td>${(r.a.handles || []).map(h => C.chBadge(h.platform)).join(' ')}</td><td>${feedBadge(r.a)}</td><td class="r">${r.s.n7}</td><td class="r">${r.s.n30}</td><td>${U.esc(r.s.top)}</td><td>${r.s.last ? `<small>${U.when(r.s.last.ts)}</small>` : '<span class="muted">?</span>'}</td></tr>`).join('')}</tbody></table></div>` })}
    ${pending.length ? card({ cls: 'span12', title: 'Added by you, not collected yet', sub: 'These are saved in this browser only. Download the watch-list, save it as data/watchlist.json, and run scripts/track.py; the next collection includes them.',
      body: pending.map(m => `<div class="orow"><div><b>${U.esc(m.name || m.handle)}</b><p>${U.esc(m.platform)} ? ${U.esc(m.handle)}</p></div>${pill('waiting')}</div>`).join('') }) : ''}`;
  };

  V.lib_tracked = S => {
    const tr = ST.tracked.all(), have = {}; tr.forEach(x => (have[(x.platform + ':' + x.handle).toLowerCase()] = 1));
    const presets = [];
    R.govHandles.filter(h => h.status === 'verified').forEach(h => presets.push({ platform: h.platform, handle: h.handle, name: h.owner, group: /CM|Chief|DPR|Directorate/.test(h.owner) ? 'govt' : 'govt' }));
    R.mediaCatalog.forEach(m => { [['X', m.x], ['Facebook', m.fb], ['Instagram', m.ig], ['YouTube', m.yt]].forEach(p => { if (p[1]) presets.push({ platform: p[0], handle: p[0] === 'X' || p[0] === 'Instagram' ? '@' + p[1] : p[1], name: m.name, group: 'media' }); }); });
    return `<div class="bento">${V.trackedUpdates()}${card({ cls: 'span12', title: 'Tracked accounts', sub: 'Your watch-list. Saved here; it drives live connectors once an X API key or vendor is added.', right: `<button class="btn" data-form="addTracked">${I('plus', 16)} Add account</button>`,
      body: tr.length ? `<table class="tbl"><thead><tr><th>Account</th><th>Platform</th><th>Group</th><th>Notes</th><th></th></tr></thead><tbody>${tr.map(x => `<tr><td><a href="${U.esc(platformUrl(x.platform, x.handle))}" target="_blank" rel="noopener"><b>${U.esc(x.name || x.handle)}</b></a><small>${U.esc(x.handle)}</small></td><td>${C.chBadge(x.platform === 'Web' ? 'News · Online' : x.platform)} ${x.platform}</td><td>${U.esc(x.group || '')}</td><td>${U.esc(x.notes || '')}</td><td><button class="icon-btn" data-del="tracked|${x.id}" aria-label="Remove">${I('trash', 15)}</button></td></tr>`).join('')}</tbody></table>` : empty('Nothing on the watch-list yet', 'Add accounts below with one click, or add your own.') })}
      ${card({ cls: 'span12', title: 'Verified accounts to add', sub: 'Handles taken from each outlet\'s own website or the DPR site. Individual journalists and creators are not listed: add them yourself.',
        body: `<div class="presets">${presets.map(p => `<div class="preset"><div>${C.chBadge(p.platform)}<div><b>${U.esc(p.name)}</b><small>${U.esc(p.handle)}</small></div></div>${have[(p.platform + ':' + p.handle).toLowerCase()] ? pill('added', 'pos') : `<button class="btn ghost sm" data-track='${U.esc(JSON.stringify(p))}'>${I('plus', 14)} Track</button>`}</div>`).join('')}</div>` })}</div>`;
  };

  V.lib_sources = S => {
    const meta = CGP.liveMeta, St = M.S;
    const cnt = {}; St.items.forEach(i => (cnt[i.source] = (cnt[i.source] || 0) + 1));
    const bySrc = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).slice(0, 10);
    const months = []; const n0 = new Date(); for (let k = 11; k >= 0; k--) { const d = new Date(n0.getFullYear(), n0.getMonth() - k, 1); months.push(d.toISOString().slice(0, 7)); }
    const mrows = bySrc.map(s => { const v = months.map(() => 0); St.items.forEach(i => { if (i.source === s) { const k = months.indexOf(new Date(i.ts).toISOString().slice(0, 7)); if (k >= 0) v[k]++; } }); return { label: s, vals: v }; });
    const rows = R.mediaCatalog.map(m => { const rx = new RegExp(m.match, 'i'); return Object.assign({}, m, { n: St.items.filter(i => rx.test(i.source)).length }); });
    const ln = (p, h) => (h ? `<a class="src" target="_blank" rel="noopener" href="${U.esc(platformUrl(p, p === 'X' || p === 'Instagram' ? '@' + h : h))}">${C.chBadge(p)}</a>` : '');
    return `<div class="bento">
      ${card({ cls: 'span5', title: 'Collection status', sub: 'Public feeds gathered by scripts/scrape.py', body: meta ? `<div class="tiles">${[['Items', U.fmt(meta.totalItems || 0)], ['From', meta.dateFrom], ['To', meta.dateTo]].map(z => `<div class="tile-s"><span>${z[0]}</span><b>${z[1]}</b></div>`).join('')}</div><p class="muted sm">Collected ${new Date(meta.generated).toLocaleString('en-IN')}. Refresh with <code>python scripts/scrape.py</code> and push the new data files.</p>${(meta.notes || []).map(n => `<p class="muted sm">• ${U.esc(n)}</p>`).join('')}` : empty('No collected data file found', 'Run <code>python scripts/scrape.py</code> to create data/live.js.') })}
      ${card({ cls: 'span7', title: 'Feeds', sub: 'What worked and what did not', body: meta ? `<table class="tbl"><thead><tr><th>Source</th><th>Via</th><th class="r">Kept</th><th>Note</th></tr></thead><tbody>${(meta.sources || []).slice(0, 40).map(s => `<tr><td>${U.esc(s.name)}</td><td>${U.esc(s.via)}</td><td class="r">${s.kept}</td><td class="muted">${s.error ? W.pill(U.esc(String(s.error).slice(0, 60)), 'warn') : ''}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">—</p>' })}
      ${card({ cls: 'span12', title: 'Back-fill coverage by source', sub: 'Items per month for the busiest sources (memory coverage report)', body: mrows.length ? C.heatGrid(mrows, months.map(m => m.slice(5)), { color: 'var(--pri)' }) : empty('No items') })}
      ${card({ cls: 'span12', title: 'Chhattisgarh media catalogue', sub: 'Impact tier from readership where known (AIR, lakh, from an undated IRS-based summary; treat as approximate). Handles from each outlet\'s own site.',
        body: `<table class="tbl"><thead><tr><th>Outlet</th><th>Type</th><th>Language</th><th class="r">Tier</th><th class="r">AIR (lakh)</th><th class="r">In archive</th><th>Profiles</th><th></th></tr></thead><tbody>${rows.map(m => `<tr><td><b>${m.name}</b><small>${m.site}</small></td><td>${m.type}</td><td>${m.lang}</td><td class="r">${m.tier}</td><td class="r">${m.air || '—'}</td><td class="r">${m.n}</td><td><div class="chips">${ln('X', m.x)}${ln('Facebook', m.fb)}${ln('Instagram', m.ig)}${ln('YouTube', m.yt)}</div></td><td><a class="link" target="_blank" rel="noopener" href="https://${m.site}">Site ${I('up', 13)}</a></td></tr>`).join('')}</tbody></table>` })}</div>`;
  };

  V.lib_review = S => {
    const ov = ST.overrides.all(), items = CGP.items.filter(i => i.auto && !i.curated && i.conf < 0.65).sort((a, b) => b.ts - a.ts).slice(0, 30);
    const rev = Object.keys(ov).filter(k => ov[k].reviewed), same = rev.filter(k => ov[k].unchanged).length;
    const sel = (n, list, cur) => `<select data-rv-f="${n}">${opts(list, cur)}</select>`;
    return `<div class="bento">${card({ cls: 'span12', title: 'Review queue', sub: 'The tagger is rule-based and can be wrong. Confirm or correct low-confidence items; corrections are saved and override the auto tags everywhere.',
      right: `<span class="chip">${rev.length} reviewed · ${rev.length ? Math.round((100 * same) / rev.length) + '% auto-tags were right' : 'no accuracy yet'}</span>`,
      body: items.length ? items.map(i => `<div class="rvrow" data-rv-row="${i.id}"><div class="rvh"><a href="${U.esc(i.link)}" target="_blank" rel="noopener">${U.esc(i.headline)}</a><small>${U.esc(i.source)} · ${U.dstr(i.ts)} · confidence ${Math.round(i.conf * 100)}%</small></div>
        <div class="rvc">${sel('topic', R.topics.map(t => [t.id, t.short]), i.topic)}${sel('district', [['', 'Other / none']].concat(R.districts.map(d => [d.id, d.name])), i.district)}${sel('stance', [['-1', 'Critical'], ['0', 'Neutral'], ['1', 'Supportive']], i.stance)}${sel('speakerType', Object.keys(R.speakers).map(k => [k, R.speakers[k].label]), i.speakerType)}<button class="btn sm" data-rv-save="${i.id}">${I('check', 14)} Confirm</button></div></div>`).join('') : empty('Nothing to review', 'All items are high-confidence or already reviewed.') })}</div>`;
  };

  V.lib_data = S => {
    const st = { live: ['Live', 'pos'], next: ['Next', 'neu'], key: ['Needs API key', 'warn'], vendor: ['Needs vendor', 'warn'] };
    const vs = M.verdictStats();
    return `<div class="bento">
      ${card({ cls: 'span5', title: 'Data in use', sub: 'Collected public headlines plus your saved links', body: `<p class="muted sm">Real public headlines, auto-tagged and unverified. Saved links always count.</p>
        <div class="tiles">${[['Items', U.fmt(CGP.items.length)], ['Live', U.fmt(L.liveItems().length)], ['Links', ST.links.all().length]].map(z => `<div class="tile-s"><span>${z[0]}</span><b>${z[1]}</b></div>`).join('')}</div>
        <div class="dz">${I('upload', 22)}<b>Import items (JSON)</b><p>Array or {"items":[…]}. Each record becomes a saved link, so the daily news analysis can be loaded here.</p><label class="btn">Choose file<input type="file" hidden accept=".json,application/json" data-import="items"/></label></div>
        <div class="dz">${I('users', 22)}<b>Import MLA roster (JSON)</b><p>[{"constituency":"Raipur City North","name":"…","party":"BJP"}]</p><label class="btn ghost">Choose file<input type="file" hidden accept=".json,application/json" data-import="mlas"/></label></div>
        <p class="msg-import" id="imp"></p>` })}
      ${card({ cls: 'span7', title: 'Backup and restore', sub: 'Links, watch-list, commitments, statements, response ledger, datasets, corrections and verdicts live in this browser.', body: `<div class="row-btns"><button class="btn" data-export="all">${I('download', 16)} Export everything</button><label class="btn ghost">${I('upload', 16)} Restore<input type="file" hidden accept=".json" data-import="all"/></label><button class="btn ghost" data-clear-all>${I('trash', 16)} Clear all my data</button></div>
        <h5>Usefulness of history lines and correlations</h5><div class="tiles"><div class="tile-s"><span>Rated</span><b>${vs.n}</b></div><div class="tile-s"><span>Useful</span><b>${vs.pct == null ? '—' : vs.pct + '%'}</b></div><div class="tile-s"><span>Target</span><b>≥ 70%</b></div></div><p class="muted sm">Hypothesis H8 from the blueprint: analysts judge history and precedents useful. Rate cards with the thumbs.</p>` })}
      ${card({ cls: 'span6', title: 'Connectors', body: `<table class="tbl"><tbody>${R.connectors.map(c => `<tr><td><b>${c.name}</b><small>${c.desc}</small></td><td class="r">${pill(st[c.state][0], st[c.state][1])}</td></tr>`).join('')}</tbody></table>` })}
      ${card({ cls: 'span6', title: '25+ parameters per item', sub: 'Sentiment is one of them', body: R.params.map(p => `<div class="prm"><h6>${p[0]}</h6><div class="chips">${p[1].map(x => `<span class="chip ${x.indexOf('Sentiment') === 0 ? 'on' : ''}">${x}</span>`).join('')}</div></div>`).join('') })}
      ${card({ cls: 'span6', title: 'Built vs roadmap', sub: 'Honest status against the stakeholders document', body: `<ul class="rules"><li><b>Built (demo level):</b> archive, issue episodes, precedents and history lines, recurrence and hotspots, seasonal outlook, narratives, response ledger, commitments, statements and position shifts, quote check, common factors, chains, lead–lag, analogues, resurfacing, coordinated patterns, media vs data, role history, dossier, rebuttal board, prep pack, link library, review queue.</li><li><b>Needs real data or a backend:</b> long back-fill, TV and video transcripts, official datasets, X/Facebook/Instagram feeds, multi-user accounts, alerts by SMS or WhatsApp.</li><li><b>Not built (Phase 3):</b> image and video fingerprints, calibrated escalation risk bands, forecasts, pre-event pattern watch, regulatory memory.</li></ul>` })}
      ${card({ cls: 'span6', title: 'Ground rules', body: `<ul class="rules"><li><b>Public data only.</b> No private groups, accounts or messages. No scraping of X, Facebook or Instagram.</li><li><b>Public figures in public roles.</b> No profiling of private citizens or journalists. Correlations are about coverage, not individuals.</li><li><b>Non-causal language.</b> Associated with, followed by, coincided with.</li><li><b>Evidence or silence.</b> Thin memory is shown as thin.</li><li><b>Human in the loop.</b> Auto-tags, rumour scores and drafts need review before external use.</li><li><b>Election period.</b> Check Model Code of Conduct and platform policies before campaign use.</li></ul>` })}</div>`;
  };
})(typeof window !== 'undefined' ? window : globalThis);

