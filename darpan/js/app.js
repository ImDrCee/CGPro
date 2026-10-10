(function (g) {
  const CGP = g.CGP, R = CGP.ref, E = CGP.E, U = CGP.U, C = CGP.C, V = CGP.V, I = CGP.icon, ST = CGP.store, L = CGP.live, M = CGP.M, W = CGP.W;
  const $ = s => document.querySelector(s);
  const set = ST.settings;
  let theme = set.all().theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  const NAV = [['pulse', 'Pulse', 'pulse'], ['ask', 'Ask', 'ask'], ['clippings', 'Clippings', 'news'], ['districts', 'Districts', 'map'], ['voices', 'Voices', 'opp'], ['social', 'Social', 'trend'], ['memory', 'Memory', 'clock'],
    ['promises', 'Promises', 'check'], ['patterns', 'Patterns', 'net'], ['people', 'People', 'users'], ['brief', 'Brief', 'doc'], ['library', 'Library', 'link']];
  const TITLES = {
    pulse: ['Jan Darpan', 'What is being said now, with what history behind it'], ask: ['Ask', 'Questions answered from the archive, with evidence'],
    clippings: ['Clippings', 'The daily newspaper clippings: who is covered, in which paper, and how'],
    districts: ['Districts', 'Concerns, sentiment and maps across the 10 districts'], voices: ['Voices', 'Attack lines, rebuttals, statements and prep packs'],
    social: ['Social', 'Traction, trends, amplification and official content'], memory: ['Memory', 'Issue history, recurrence, seasons, narratives and responses'],
    promises: ['Promises', 'Public commitments and what coverage says about delivery'], patterns: ['Patterns', 'Correlations across time, places, entities and sources'],
    people: ['People', 'Leaders, roles as of a date, constituency dossiers'], brief: ['Daily brief', 'A shareable summary with history lines'],
    library: ['Library', 'Saved links, tracked accounts, sources, review queue, data']
  };

  const parseHash = () => { const h = (location.hash || '').slice(1).split(':'); return { view: h[0], tab: h[1] }; };
  const ph = parseHash();
  const role0 = set.all().role || 'social';
  const S = (CGP.state = {
    view: ph.view && V[ph.view] ? ph.view : (R.roles.find(r => r.id === role0) || R.roles[0]).home, tab: {}, days: 7, channel: 'all', district: 'all', theme,
    role: role0, chat: [], sel: 'raipur', metric: 'concern', tf: { channel: 'all', speaker: 'all', topic: 'all' }, seatQ: '', seatD: 'all',
    lib: { q: '', col: 'all', ch: 'all' }, cmp: 'yoy', stq: '', vq: '', vres: null, packTopic: 'farmers', dsId: null, asOf: '', dosD: 'raipur', dosSeat: ''
  });
  if (ph.tab) S.tab[S.view] = ph.tab;

  CGP.refresh = () => { CGP.setMode(CGP.mode); };
  CGP.setMode = mode => {
    CGP.mode = mode; set.set('mode', mode);
    const items = L.assemble(mode);
    CGP.setItems(items);
    M.build(items);
  };

  function rail() {
    return `<div class="logo" title="Jan Darpan"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/><path d="M3 12h2M19 12h2"/></svg></div>
      <nav>${NAV.map(n => `<button class="nav ${S.view === n[0] ? 'on' : ''}" data-view="${n[0]}" aria-label="${n[1]}">${I(n[2], 20)}<span>${n[1]}</span></button>`).join('')}</nav>
      <div class="rail-foot"><button class="nav" data-toggle-theme aria-label="Toggle theme">${I(S.theme === 'dark' ? 'sun' : 'moon', 19)}<span>${S.theme === 'dark' ? 'Light' : 'Dark'}</span></button></div>`;
  }
  function topbar() {
    const t = TITLES[S.view], date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    const filters = S.view !== 'library' && S.view !== 'clippings';
    return `<div class="tb-l"><h1>${t[0]}</h1><p>${t[1]} · ${date}</p></div>
      <div class="tb-r">
        ${filters ? `<div class="seg" role="group" aria-label="Time window">${[[1, '24h'], [3, '3d'], [7, '7d'], [14, '14d'], [30, '30d'], [90, '90d'], [365, '1y']].map(d => `<button class="${S.days === d[0] ? 'on' : ''}" data-days="${d[0]}">${d[1]}</button>`).join('')}</div>
        <select class="sel" data-fd aria-label="District"><option value="all">All 10 districts</option>${R.districts.map(d => `<option value="${d.id}" ${S.district === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}</select>
        <select class="sel" data-fc aria-label="Channel"><option value="all">All channels</option>${R.channels.map(c => `<option ${S.channel === c.id ? 'selected' : ''}>${c.id}</option>`).join('')}</select>` : ''}
        <select class="sel role" data-role aria-label="View as" data-tip="Changes the home screen and the shortcuts">${R.roles.map(r => `<option value="${r.id}" ${S.role === r.id ? 'selected' : ''}>${r.label}</option>`).join('')}</select>
      </div>`;
  }
  function ribbon() {
    const meta = CGP.liveMeta, n = ST.links.all().length;
    const gen = meta ? new Date(meta.generated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
    const live = `<b>Live coverage.</b> ${L.liveItems().length ? U.fmt(L.liveItems().length) + ' items from news sites, YouTube and the daily clippings, updated ' + gen + '. ' : 'No coverage data is available right now. '}Topic, district and stance are <b>generated automatically</b> and can be corrected in the <a href="#library:review" data-nav="library:review">review queue</a>. Add social posts in the <a href="#library:links" data-nav="library:links">Library</a>.`;
    const samp = `<b>Sample data.</b> Fictional, with 24 months of seasons, episodes and responses to demonstrate memory. Switch to <a href="#" data-mode="live">Live</a> for real headlines.`;
    const msg = CGP.mode === 'live' ? live : CGP.mode === 'sample' ? samp : `<b>Live and sample data are mixed.</b> Use this only to explore; numbers combine real headlines with fictional items.`;
    return `<span class="pdot ${CGP.mode === 'live' ? 'live' : ''}"></span><span>${msg}${n ? ` · ${n} saved link${n > 1 ? 's' : ''} included` : ''}</span>`;
  }

  function render(opts) {
    opts = opts || {};
    document.documentElement.setAttribute('data-theme', S.theme);
    $('#rail').innerHTML = rail(); $('#topbar').innerHTML = topbar(); $('#ribbon').innerHTML = ribbon();
    const v = $('#view'); v.className = 'view v-' + S.view;
    try { v.innerHTML = V[S.view](S); } catch (err) { console.error(err); v.innerHTML = `<div class="card"><h3>Something went wrong on this screen</h3><p class="muted">${U.esc(err.message)}</p></div>`; }
    if (!opts.keepScroll) window.scrollTo(0, 0);
    countUp();
    if (S.view === 'ask') {
      const m = $('#msgs');
      if (m) { const us = m.querySelectorAll('.msg.user'), last = us[us.length - 1]; m.scrollTop = last ? Math.max(0, last.offsetTop - 18) : m.scrollHeight; }
      const q = $('#q'); if (q && !opts.noFocus) q.focus({ preventScroll: true });
    }
  }
  function countUp() {
    document.querySelectorAll('.cu').forEach(el => {
      const raw = el.getAttribute('data-v'); if (!/^\d+$/.test(raw)) return;
      const end = +raw, t0 = performance.now(), dur = 600;
      (function step(t) { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(end * e) + (el.getAttribute('data-s') || ''); if (k < 1) requestAnimationFrame(step); })(t0);
    });
  }
  CGP.render = (o) => render(o);
  function go(view, tab) {
    if (!V[view]) return;
    S.view = view; if (tab) S.tab[view] = tab;
    history.replaceState(null, '', '#' + view + (S.tab[view] ? ':' + S.tab[view] : ''));
    render();
  }
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2600); }
  CGP.toast = toast;

  function ask(q) {
    q = (q || '').trim(); if (!q) return;
    S.chat.push({ role: 'user', text: q });
    const pending = { role: 'ai', pending: true }; S.chat.push(pending);
    if (S.view !== 'ask') { S.view = 'ask'; history.replaceState(null, '', '#ask'); }
    render({ keepScroll: true });
    setTimeout(() => {
      let res;
      try { res = CGP.Q.answer(q, S); } catch (err) { console.error(err); res = { p: CGP.Q.parse(q, S), html: '<p class="lead">Something went wrong while answering that. Please rephrase.</p>' }; }
      pending.pending = false; pending.html = res.html; pending.p = res.p;
      if (S.view === 'ask') render({ keepScroll: true });
    }, 380 + Math.random() * 250);
  }

  // ───── modal + forms ─────
  let formSpec = null;
  const modal = () => $('#modal');
  function openModal(html) { modal().innerHTML = html; modal().classList.add('open'); }
  function closeModal() { modal().classList.remove('open'); formSpec = null; }
  function openForm(name, arg) {
    const f = CGP.forms[name]; if (!f) return;
    formSpec = f(arg); openModal(W.formHtml(formSpec));
    setTimeout(() => { const el = modal().querySelector('input:not([type=checkbox]),textarea'); if (el) el.focus(); }, 40);
  }
  function openIssue(name) { openModal(V.issueModal(name)); }
  CGP.openModal = openModal; CGP.closeModal = closeModal;
  function openItem(id) { const it = CGP.index[id]; if (it) openModal(V.item(it)); }

  // ───── import / export ─────
  const download = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'application/json' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  const csvq = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  function doExport(kind) {
    const stamp = new Date().toISOString().slice(0, 10);
    if (kind === 'watchlist') return download('watchlist.json', JSON.stringify({ app: 'Jan Darpan', tracked: ST.tracked.all() }, null, 2));
    if (kind === 'all') return download('jan-darpan-backup-' + stamp + '.json', JSON.stringify(ST.exportAll(), null, 2));
    const ls = ST.links.all();
    if (kind === 'json') return download('jan-darpan-links-' + stamp + '.json', JSON.stringify({ app: 'Jan Darpan', links: ls }, null, 2));
    const head = ['url', 'title', 'date', 'collection', 'tags', 'source', 'channel', 'speakerType', 'stance', 'topic', 'district', 'likes', 'shares', 'comments', 'views', 'note'];
    download('jan-darpan-links-' + stamp + '.csv', [head.join(',')].concat(ls.map(k => [k.url, k.title, new Date(k.date || k.addedAt).toISOString().slice(0, 10), k.collection, (k.tags || []).join(' '), k.source, k.channel, k.speakerType, k.stance, k.topic, k.district, (k.metrics || {}).likes, (k.metrics || {}).shares, (k.metrics || {}).comments, (k.metrics || {}).views, k.note].map(csvq).join(','))).join('\n'), 'text/csv');
  }
  const rec2link = (r, col) => {
    const url = r.url || r.u || r.link || ''; if (!url) return null;
    const d = L.detect(url); if (!d) return null;
    const ts = typeof r.ts === 'number' ? r.ts : Date.parse(r.ts || r.date || r.published || '') || Date.now();
    const stance = typeof r.stance === 'number' ? Math.sign(r.stance) : /pos|support/i.test(r.stance || '') ? 1 : /neg|crit/i.test(r.stance || '') ? -1 : /neutral/i.test(r.stance || '') ? 0 : '';
    const topic = R.topics.find(t => t.id === r.topic || t.name.toLowerCase() === String(r.topic || '').toLowerCase() || t.short.toLowerCase() === String(r.topic || '').toLowerCase());
    const dist = R.districts.find(x => x.id === String(r.district || '').toLowerCase() || x.name.toLowerCase() === String(r.district || '').toLowerCase());
    return { url: d.url, title: r.title || r.t || r.headline || '', note: r.note || r.text || r.summary || '', date: ts, collection: col, tags: r.tags || [], speakerType: R.speakers[r.speakerType] ? r.speakerType : 'media', stance, topic: topic ? topic.id : '', district: dist ? dist.id : '',
      metrics: { likes: +r.likes || 0, shares: +r.shares || 0, comments: +r.comments || 0, views: +r.views || 0 }, include: true, kind: d.kind, channel: R.channels.some(c => c.id === r.channel) ? r.channel : d.channel, source: r.source || r.s || r.outlet || d.source };
  };
  function doImport(kind, file) {
    const rd = new FileReader();
    rd.onload = () => {
      const say = t => { const o = $('#imp'); if (o) o.textContent = t; toast(t); };
      try {
        const j = JSON.parse(rd.result);
        if (kind === 'mlas') { (Array.isArray(j) ? j : j.mlas || []).forEach(m => { if (m.constituency) CGP.mlas[m.constituency] = m; }); render({ keepScroll: true }); return say('MLA roster loaded: ' + Object.keys(CGP.mlas).length + ' constituencies.'); }
        if (kind === 'all') { ST.importAll(j, true); CGP.refresh(); render({ keepScroll: true }); return say('Backup restored.'); }
        if (kind === 'links') { const arr = Array.isArray(j) ? j : j.links || []; const cur = ST.links.all(), ids = {}; cur.forEach(x => (ids[x.id] = 1)); ST.links.replace(cur.concat(arr.filter(x => x.url && !ids[x.id]))); CGP.refresh(); render({ keepScroll: true }); return say('Links imported: ' + arr.length + '.'); }
        const arr = Array.isArray(j) ? j : j.items || [];
        if (arr.length > 3000) return say('That file has ' + arr.length + ' items; import at most 3000 at a time (browser storage limit).');
        const col = 'import ' + new Date().toISOString().slice(0, 10) + ' ' + file.name.replace(/\.json$/i, '');
        let n = 0, skip = 0; arr.forEach(r => { const k = rec2link(r, col); if (k) { ST.links.add(k); n++; } else skip++; });
        CGP.refresh(); S.tab.library = 'links'; render({ keepScroll: true }); say('Imported ' + n + ' items as saved links' + (skip ? ' (' + skip + ' skipped: no URL)' : '') + '.');
      } catch (err) { say('Could not read that file: ' + err.message); }
    };
    rd.readAsText(file);
  }

  // ───── events ─────
  const SEL = '[data-view],[data-nav],[data-tab],[data-mode],[data-ask],[data-item],[data-followclips],[data-mla],[data-account],[data-district],[data-district-open],[data-metric],[data-days],[data-close],[data-toggle-theme],[data-copy-brief],[data-form],[data-open-issue],[data-verdict-id],[data-rb-issue],[data-del],[data-export],[data-cmp],[data-track],[data-copy],[data-rv-save],[data-clear-all],.modal';
  function reopen() { if (modal().classList.contains('open') && modal().querySelector('.issuem')) { const h = modal().querySelector('.issuem h3'); if (h) openIssue(h.textContent); } }
  document.addEventListener('click', e => {
    const t = e.target.closest(SEL); if (!t) return;
    if (t.classList.contains('modal')) { if (e.target === t) closeModal(); return; }
    const d = t.dataset;
    if (d.view) { e.preventDefault(); return go(d.view); }
    if (d.nav) { e.preventDefault(); const p = d.nav.split(':'); return go(p[0], p[1]); }
    if (d.tab) { S.tab[S.view] = d.tab; history.replaceState(null, '', '#' + S.view + ':' + d.tab); return render({ keepScroll: true, noFocus: true }); }
    if (d.mode) { e.preventDefault(); CGP.setMode(d.mode); return render({ keepScroll: true, noFocus: true }); }
    if (d.ask !== undefined) { closeModal(); return ask(d.ask); }
    if (t.hasAttribute('data-followclips')) { const n = CGP.followClipSources(); toast(n ? 'Following ' + n + ' accounts' : 'Already following all'); return render({ keepScroll: true, noFocus: true }); }
    if (d.mla) return openModal(V.mla(d.mla));
    if (d.account) return openModal(V.account(d.account));
    if (d.item) return openItem(d.item);
    if (d.openIssue) return openIssue(d.openIssue);
    if (t.hasAttribute('data-close')) return closeModal();
    if (d.form) return openForm(d.form, d.arg);
    if (d.districtOpen) { S.sel = d.districtOpen; closeModal(); return go('districts'); }
    if (d.district) { S.sel = d.district; if (S.view !== 'districts') return go('districts'); return render({ keepScroll: true }); }
    if (d.metric) { S.metric = d.metric; return render({ keepScroll: true }); }
    if (d.days) { S.days = +d.days; return render({ keepScroll: true, noFocus: true }); }
    if (d.cmp) { S.cmp = d.cmp; return render({ keepScroll: true }); }
    if (t.hasAttribute('data-toggle-theme')) { S.theme = S.theme === 'dark' ? 'light' : 'dark'; set.set('theme', S.theme); return render({ keepScroll: true, noFocus: true }); }
    if (t.hasAttribute('data-copy-brief')) { (navigator.clipboard ? navigator.clipboard.writeText(V.briefText(S)) : Promise.reject()).catch(() => {}); t.innerHTML = I('check', 16) + ' Copied'; return; }
    if (d.copy !== undefined) { (navigator.clipboard ? navigator.clipboard.writeText(d.copy) : Promise.reject()).then(() => toast('Draft copied'), () => toast('Copy not available')); return; }
    if (d.verdictId) { const cur = ST.verdicts.all()[d.verdictId]; ST.verdicts.set(d.verdictId, cur === d.verdictVal ? undefined : d.verdictVal); render({ keepScroll: true, noFocus: true }); return reopen(); }
    if (d.rbIssue !== undefined) { ST.rebuttals.set(d.rbIssue, d.rbStatus || undefined); openIssue(d.rbIssue); return render({ keepScroll: true, noFocus: true }); }
    if (d.del) { const p = d.del.split('|'); if (!confirm('Delete this entry?')) return; ST[p[0]].remove(p[1]); CGP.refresh(); toast('Deleted'); return render({ keepScroll: true, noFocus: true }); }
    if (d.export) return doExport(d.export);
    if (d.track) { try { ST.tracked.add(Object.assign(JSON.parse(d.track), { active: true })); toast('Now following'); } catch (x) { /* ignore */ } return render({ keepScroll: true, noFocus: true }); }
    if (d.rvSave) {
      const row = document.querySelector('[data-rv-row="' + d.rvSave + '"]'), it = CGP.index[d.rvSave]; if (!row || !it) return;
      const v = {}; row.querySelectorAll('[data-rv-f]').forEach(s => (v[s.dataset.rvF] = s.value));
      const o = { topic: v.topic, district: v.district, stance: +v.stance, speakerType: v.speakerType, reviewed: true };
      o.unchanged = o.topic === it.topic && o.district === it.district && o.stance === it.stance && o.speakerType === it.speakerType;
      ST.overrides.set(d.rvSave, o); CGP.refresh(); toast('Saved'); return render({ keepScroll: true, noFocus: true });
    }
    if (t.hasAttribute('data-clear-all')) { if (confirm('Delete every saved link, commitment, statement, correction and setting from this device?')) { ST.clearAll(); CGP.refresh(); toast('All saved data cleared'); render({ keepScroll: true }); } return; }
  });

  document.addEventListener('submit', e => {
    const id = e.target.id;
    if (id === 'composer') { e.preventDefault(); const q = $('#q'), v = q.value; q.value = ''; return ask(v); }
    if (id === 'vqform') { e.preventDefault(); S.vq = $('#vq').value; S.vres = M.verifyQuote(S.vq); return render({ keepScroll: true, noFocus: true }); }
    if (id === 'modalform') {
      e.preventDefault(); if (!formSpec) return;
      const v = {}; formSpec.fields.forEach(f => { const el = e.target.elements[f.n]; v[f.n] = f.t === 'check' ? el.checked : el.value; });
      let err; try { err = formSpec.onSubmit(v); } catch (x) { err = x.message; }
      const old = e.target.querySelector('.ferr'); if (old) old.remove();
      if (err) { const p = document.createElement('p'); p.className = 'ferr'; p.textContent = err; e.target.insertBefore(p, e.target.querySelector('.fact')); return; }
      closeModal(); CGP.refresh(); toast('Saved'); render({ keepScroll: true, noFocus: true });
    }
  });

  document.addEventListener('change', e => {
    const el = e.target, d = el.dataset;
    if (el.hasAttribute('data-fd')) { S.district = el.value; render({ keepScroll: true }); }
    else if (el.hasAttribute('data-fc')) { S.channel = el.value; render({ keepScroll: true }); }
    else if (el.hasAttribute('data-role')) { S.role = el.value; set.set('role', S.role); const r = R.roles.find(x => x.id === S.role); toast('Viewing as ' + r.label); go(r.home); }
    else if (d.tf) { S.tf[d.tf] = el.value; render({ keepScroll: true }); }
    else if (el.hasAttribute('data-seatd')) { S.seatD = el.value; render({ keepScroll: true }); }
    else if (el.hasAttribute('data-seatp')) { S.seatP = el.value; render({ keepScroll: true }); }
    else if (el.hasAttribute('data-ds')) { S.dsId = el.value; render({ keepScroll: true }); }
    else if (el.hasAttribute('data-pack')) { S.packTopic = el.value; render({ keepScroll: true }); }
    else if (el.hasAttribute('data-asof')) { S.asOf = el.value; render({ keepScroll: true }); }
    else if (el.hasAttribute('data-dos')) { S.dosD = el.value; S.dosSeat = ''; render({ keepScroll: true }); }
    else if (el.hasAttribute('data-dosseat')) { S.dosSeat = el.value; render({ keepScroll: true }); }
    else if (el.hasAttribute('data-libcol')) { S.lib.col = el.value; render({ keepScroll: true }); }
    else if (el.hasAttribute('data-libch')) { S.lib.ch = el.value; render({ keepScroll: true }); }
    else if (d.linkToggle) { ST.links.update(d.linkToggle, { include: el.checked }); CGP.refresh(); render({ keepScroll: true, noFocus: true }); }
    else if (d.import && el.files && el.files[0]) doImport(d.import, el.files[0]);
  });
  let deb;
  document.addEventListener('input', e => {
    const el = e.target, m = { 'data-seatq': 'seatQ', 'data-libq': 'lib.q', 'data-stq': 'stq' };
    const k = Object.keys(m).find(a => el.hasAttribute(a)); if (!k) return;
    if (m[k] === 'lib.q') S.lib.q = el.value; else S[m[k]] = el.value;
    clearTimeout(deb); deb = setTimeout(() => { const pos = el.selectionStart; render({ keepScroll: true, noFocus: true }); const n = document.querySelector('[' + k + ']'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }, 160);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  const tip = () => $('#tip');
  document.addEventListener('mouseover', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (!t || !t.getAttribute('data-tip')) { tip().classList.remove('on'); return; } tip().innerHTML = t.getAttribute('data-tip'); tip().classList.add('on'); });
  document.addEventListener('mousemove', e => { const el = tip(); if (!el.classList.contains('on')) return; const w = el.offsetWidth, h = el.offsetHeight; el.style.left = Math.min(innerWidth - w - 12, e.clientX + 14) + 'px'; el.style.top = (e.clientY + h + 24 > innerHeight ? e.clientY - h - 14 : e.clientY + 16) + 'px'; });
  document.addEventListener('mouseout', e => { if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('[data-tip]')) tip().classList.remove('on'); });
  window.addEventListener('hashchange', () => { const p = parseHash(); if (V[p.view] && (p.view !== S.view || (p.tab && p.tab !== S.tab[p.view]))) { S.view = p.view; if (p.tab) S.tab[p.view] = p.tab; render(); } });

  // ───── boot ─────
  if (/[?&]still/.test(location.search)) document.documentElement.classList.add('still');
  CGP.mlas = CGP.mlas || {};
  // Follow the newspapers the team clips every day (one time, so removing one stays removed).
  CGP.followClipSources = () => {
    const have = {}; ST.tracked.all().forEach(x => (have[(x.platform + ':' + x.handle).toLowerCase()] = 1));
    let n = 0;
    R.mediaCatalog.filter(m => m.clip).forEach(m => {
      const note = 'In the daily clippings' + (m.clip.pages ? ' (' + m.clip.pages + ' clippings, 23 Sep to 10 Oct)' : '');
      [['Web', m.site], ['X', m.x && '@' + m.x], ['Facebook', m.fb], ['Instagram', m.ig && '@' + m.ig], ['YouTube', m.yt]].forEach(p => {
        if (!p[1] || have[(p[0] + ':' + p[1]).toLowerCase()]) return;
        ST.tracked.add({ platform: p[0], handle: p[1], name: m.name, group: 'media', notes: note, active: true, clip: true }); n++;
      });
    });
    return n;
  };
  if (!set.all().clipsSeeded) { CGP.followClipSources(); set.set('clipsSeeded', 1); }
  CGP.makeSamples();
  const hasLive = !!(g.CGP_LIVE && g.CGP_LIVE.items && g.CGP_LIVE.items.length);
  CGP.setMode(hasLive ? 'live' : 'sample');
  function boot() {
    if (boot.done) return; boot.done = true;
    new URLSearchParams(location.search).getAll('ask').forEach(q => { const r = CGP.Q.answer(q, S); S.chat.push({ role: 'user', text: q }, { role: 'ai', html: r.html, p: r.p }); S.view = 'ask'; });
    render({ noFocus: true });
  }
  document.addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();
})(window);
