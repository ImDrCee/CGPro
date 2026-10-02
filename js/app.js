(function (g) {
  const CGP = g.CGP;
  const R = CGP.ref, E = CGP.E, U = CGP.U, C = CGP.C, V = CGP.V, I = CGP.icon;
  const $ = s => document.querySelector(s);

  let theme = 'light';
  try { theme = localStorage.getItem('jp-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch (e) {}

  const S = (CGP.state = {
    view: (location.hash || '#pulse').slice(1), days: 7, channel: 'all', district: 'all', theme,
    chat: [], sel: 'raipur', metric: 'concern', tf: { channel: 'all', speaker: 'all', topic: 'all' }, seatQ: '', seatD: 'all'
  });

  const NAV = [
    ['pulse', 'Pulse', 'pulse'], ['ask', 'Ask', 'ask'], ['districts', 'Districts', 'map'], ['opposition', 'Opposition', 'opp'],
    ['traction', 'Traction', 'trend'], ['leaders', 'Leaders', 'users'], ['brief', 'Brief', 'doc'], ['data', 'Data', 'db']
  ];
  const TITLES = {
    pulse: ['CM Pulse', 'What is being said about the Chief Minister and the state'],
    ask: ['Ask', 'Questions answered from the data, with evidence'],
    districts: ['Districts', 'Concerns and sentiment across the 10 districts'],
    opposition: ['Opposition', 'Issues raised, traction and government-side response'],
    traction: ['Traction', 'Which posts travelled and who is talking about what'],
    leaders: ['Leaders & MLAs', 'Coverage of leaders and constituencies'],
    brief: ['Daily brief', 'A shareable summary from the current window'],
    data: ['Data & method', 'Sources, parameters, imports and ground rules']
  };

  function rail() {
    return `<div class="logo" title="Jan Pulse"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h4l3-7 4 14 3-7h6"/></svg></div>
      <nav>${NAV.map(n => `<button class="nav ${S.view === n[0] ? 'on' : ''}" data-view="${n[0]}" aria-label="${n[1]}">${I(n[2], 21)}<span>${n[1]}</span></button>`).join('')}</nav>
      <div class="rail-foot"><button class="nav" data-toggle-theme aria-label="Toggle theme">${I(S.theme === 'dark' ? 'sun' : 'moon', 20)}<span>${S.theme === 'dark' ? 'Light' : 'Dark'}</span></button></div>`;
  }

  function topbar() {
    const t = TITLES[S.view];
    const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    const needsFilters = S.view !== 'ask' && S.view !== 'data';
    return `<div class="tb-l"><h1>${t[0]}</h1><p>${t[1]} · ${date}</p></div>
      <div class="tb-r">
        ${needsFilters || S.view === 'ask' ? `<div class="seg" role="group" aria-label="Time window">${[[1, '24h'], [3, '3d'], [7, '7d'], [14, '14d']].map(d => `<button class="${S.days === d[0] ? 'on' : ''}" data-days="${d[0]}">${d[1]}</button>`).join('')}</div>
        <select class="sel" data-fd aria-label="District"><option value="all">All 10 districts</option>${R.districts.map(d => `<option value="${d.id}" ${S.district === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}</select>
        <select class="sel" data-fc aria-label="Channel"><option value="all">All channels</option>${R.channels.map(c => `<option ${S.channel === c.id ? 'selected' : ''}>${c.id}</option>`).join('')}</select>` : ''}
        <div class="avatar me" title="Demo user">DM</div>
      </div>`;
  }

  function ribbon() {
    return CGP.source === 'sample'
      ? `<span class="pdot"></span><span><b>Sample data.</b> Headlines, posts and numbers are illustrative, generated to demonstrate the product. Connect live sources in <a href="#data" data-view="data">Data</a>.</span>`
      : `<span class="pdot live"></span><span><b>Imported data.</b> ${CGP.items.length} items loaded from your file.</span>`;
  }

  function render(opts) {
    opts = opts || {};
    document.documentElement.setAttribute('data-theme', S.theme);
    $('#rail').innerHTML = rail();
    $('#topbar').innerHTML = topbar();
    $('#ribbon').innerHTML = ribbon();
    const v = $('#view');
    v.className = 'view v-' + S.view;
    v.innerHTML = V[S.view](S);
    if (!opts.keepScroll) window.scrollTo(0, 0);
    countUp();
    if (S.view === 'ask') {
      const m = $('#msgs');
      if (m) {
        const users = m.querySelectorAll('.msg.user');
        const last = users[users.length - 1];
        m.scrollTop = last ? Math.max(0, last.offsetTop - 18) : m.scrollHeight;
      }
      const q = $('#q'); if (q && !opts.noFocus) q.focus({ preventScroll: true });
    }
  }

  function countUp() {
    document.querySelectorAll('.cu').forEach(el => {
      const raw = el.getAttribute('data-v');
      if (!/^\d+$/.test(raw)) return;
      const end = +raw, t0 = performance.now(), dur = 650;
      (function step(t) {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(end * e) + (el.getAttribute('data-s') || '');
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }

  function go(view) {
    S.view = view;
    history.replaceState(null, '', '#' + view);
    render();
  }

  function ask(q) {
    q = (q || '').trim();
    if (!q) return;
    S.chat.push({ role: 'user', text: q });
    const pending = { role: 'ai', pending: true };
    S.chat.push(pending);
    if (S.view !== 'ask') { S.view = 'ask'; history.replaceState(null, '', '#ask'); }
    render({ keepScroll: true });
    setTimeout(() => {
      let res;
      try { res = CGP.Q.answer(q, S); } catch (err) { console.error(err); res = { p: CGP.Q.parse(q, S), html: '<p class="lead">Something went wrong while answering that. Please rephrase.</p>' }; }
      pending.pending = false; pending.html = res.html; pending.p = res.p;
      if (S.view === 'ask') render({ keepScroll: true });
    }, 520 + Math.random() * 300);
  }

  // ───────── import ─────────
  function findDistrict(v) {
    if (!v) return '';
    const s = String(v).toLowerCase();
    const d = R.districts.filter(x => x.id === s || x.name.toLowerCase() === s || s.indexOf(x.name.toLowerCase().split('-')[0]) >= 0)[0];
    return d ? d.id : '';
  }
  function findTopic(v) {
    if (!v) return 'governance';
    const s = String(v).toLowerCase();
    const t = R.topics.filter(x => x.id === s || x.name.toLowerCase() === s || x.short.toLowerCase() === s)[0];
    if (t) return t.id;
    const k = R.topics.filter(x => new RegExp('(?:^|[^a-z])(?:' + x.kw + ')', 'i').test(s))[0];
    return k ? k.id : 'governance';
  }
  function normalize(r, i) {
    const ts = typeof r.ts === 'number' ? r.ts : Date.parse(r.ts || r.date || r.published || '') || Date.now();
    const text = r.text || r.snippet || r.body || r.headline || '';
    const headline = r.headline || r.title || text.slice(0, 110);
    const entities = Array.isArray(r.entities) ? r.entities : [];
    const stance = typeof r.stance === 'number' ? Math.sign(r.stance) : /pos|support/i.test(r.stance || '') ? 1 : /neg|crit/i.test(r.stance || '') ? -1 : typeof r.sentiment === 'number' ? (r.sentiment > 0.15 ? 1 : r.sentiment < -0.15 ? -1 : 0) : 0;
    const channel = R.channels.some(c => c.id === r.channel) ? r.channel : /x|twitter/i.test(r.channel || '') ? 'X' : /face/i.test(r.channel || '') ? 'Facebook' : /insta/i.test(r.channel || '') ? 'Instagram' : /you/i.test(r.channel || '') ? 'YouTube' : /print|paper/i.test(r.channel || '') ? 'News · Print' : 'News · Online';
    const topic = findTopic(r.topic || (headline + ' ' + text));
    const district = findDistrict(r.district) || findDistrict(headline + ' ' + text);
    return {
      id: r.id || 'I' + (1000 + i), ts, channel, source: r.source || r.outlet || r.handle || 'Unknown', language: r.language || 'Hindi', mediaType: r.mediaType || 'Post', prominence: r.prominence || '',
      speakerType: R.speakers[r.speakerType] ? r.speakerType : 'media', speaker: r.speaker || r.source || '',
      district, constituency: r.constituency || '', topic, scheme: r.scheme || '', issue: r.issue || headline, narrative: r.narrative || r.issue || headline,
      entities, mentionsCM: r.mentionsCM != null ? !!r.mentionsCM : entities.indexOf(R.cm) >= 0 || /chief minister|vishnu deo sai|\bcm\b/i.test(headline + ' ' + text),
      stance, sentiment: typeof r.sentiment === 'number' ? r.sentiment : stance * 0.5, emotion: r.emotion || 'neutral', intent: r.intent || 'inform', hashtags: r.hashtags || [],
      likes: +r.likes || 0, shares: +r.shares || 0, comments: +r.comments || 0, views: +r.views || 0, misinfo: +r.misinfo || 0, headline, text
    };
  }
  function importItems(file, kind) {
    const out = $('#imp');
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const j = JSON.parse(rd.result);
        if (kind === 'mlas') {
          (Array.isArray(j) ? j : j.mlas || []).forEach(m => { if (m.constituency) CGP.mlas[m.constituency] = m; });
          render({ keepScroll: true }); const o = $('#imp'); if (o) o.textContent = 'MLA roster loaded: ' + Object.keys(CGP.mlas).length + ' constituencies.';
          return;
        }
        const arr = (Array.isArray(j) ? j : j.items || []).map(normalize);
        if (!arr.length) throw new Error('No items found');
        CGP.finalize(arr); CGP.setItems(arr); CGP.source = 'import'; S.chat = [];
        render({ keepScroll: true }); const o = $('#imp'); if (o) o.textContent = 'Loaded ' + arr.length + ' items.';
      } catch (err) { if (out) out.textContent = 'Could not read that file: ' + err.message; }
    };
    rd.readAsText(file);
  }
  function resetSample() { CGP.setItems(CGP.generate()); CGP.source = 'sample'; CGP.mlas = {}; S.chat = []; render(); }
  function downloadSchema() {
    const ex = [{ id: 'N1', ts: new Date().toISOString(), channel: 'News · Print', source: 'Hindi Daily A', speakerType: 'media', district: 'Raipur', topic: 'Women Empowerment', headline: 'Example headline', text: 'Example body text', stance: 'critical', likes: 0, shares: 12, views: 25000, entities: ['Vishnu Deo Sai'] },
      { id: 'X1', ts: new Date().toISOString(), channel: 'X', source: '@example', speakerType: 'opp', district: 'Korba', topic: 'Power', headline: 'Example post', text: 'Example post text', stance: -1, likes: 410, shares: 90, comments: 33, views: 18000 }];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(ex, null, 2)], { type: 'application/json' }));
    a.download = 'janpulse-example.json'; a.click();
  }

  // ───────── events ─────────
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-view],[data-nav],[data-ask],[data-item],[data-district],[data-district-open],[data-metric],[data-days],[data-close],[data-toggle-theme],[data-copy-brief],[data-download-schema],[data-reset],.modal');
    if (!t) return;
    if (t.classList.contains('modal')) { if (e.target === t) closeModal(); return; }
    if (t.dataset.view) { e.preventDefault(); return go(t.dataset.view); }
    if (t.dataset.nav) return go(t.dataset.nav);
    if (t.dataset.ask) return ask(t.dataset.ask);
    if (t.dataset.item) return openItem(t.dataset.item);
    if (t.hasAttribute('data-close')) return closeModal();
    if (t.dataset.districtOpen) { S.sel = t.dataset.districtOpen; return go('districts'); }
    if (t.dataset.district) { S.sel = t.dataset.district; if (S.view !== 'districts') return go('districts'); return render({ keepScroll: true }); }
    if (t.dataset.metric) { S.metric = t.dataset.metric; return render({ keepScroll: true }); }
    if (t.dataset.days) { S.days = +t.dataset.days; return render({ keepScroll: true, noFocus: true }); }
    if (t.hasAttribute('data-toggle-theme')) { S.theme = S.theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('jp-theme', S.theme); } catch (x) {} return render({ keepScroll: true, noFocus: true }); }
    if (t.hasAttribute('data-copy-brief')) { const txt = V.briefText(S); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).catch(() => {}); t.innerHTML = I('check', 16) + ' Copied'; return; }
    if (t.hasAttribute('data-download-schema')) return downloadSchema();
    if (t.hasAttribute('data-reset')) return resetSample();
  });

  document.addEventListener('submit', e => {
    if (e.target.id === 'composer') { e.preventDefault(); const q = $('#q'); const v = q.value; q.value = ''; ask(v); }
  });

  document.addEventListener('change', e => {
    const el = e.target;
    if (el.hasAttribute('data-fd')) { S.district = el.value; render({ keepScroll: true }); }
    else if (el.hasAttribute('data-fc')) { S.channel = el.value; render({ keepScroll: true }); }
    else if (el.dataset.tf) { S.tf[el.dataset.tf] = el.value; render({ keepScroll: true }); }
    else if (el.hasAttribute('data-seatd')) { S.seatD = el.value; render({ keepScroll: true }); }
    else if (el.dataset.import && el.files && el.files[0]) importItems(el.files[0], el.dataset.import);
  });

  document.addEventListener('input', e => {
    if (e.target.hasAttribute('data-seatq')) {
      S.seatQ = e.target.value; const pos = e.target.selectionStart;
      render({ keepScroll: true, noFocus: true });
      const n = document.querySelector('[data-seatq]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); }
    }
  });

  function openItem(id) {
    const it = CGP.index[id]; if (!it) return;
    const m = $('#modal'); m.innerHTML = V.item(it); m.classList.add('open');
  }
  function closeModal() { $('#modal').classList.remove('open'); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // tooltip
  const tip = () => $('#tip');
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('[data-tip]');
    if (!t || !t.getAttribute('data-tip')) { tip().classList.remove('on'); return; }
    tip().innerHTML = t.getAttribute('data-tip'); tip().classList.add('on');
  });
  document.addEventListener('mousemove', e => {
    const el = tip(); if (!el.classList.contains('on')) return;
    const w = el.offsetWidth, h = el.offsetHeight;
    el.style.left = Math.min(innerWidth - w - 12, e.clientX + 14) + 'px';
    el.style.top = (e.clientY + h + 24 > innerHeight ? e.clientY - h - 14 : e.clientY + 16) + 'px';
  });
  document.addEventListener('mouseout', e => { if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('[data-tip]')) tip().classList.remove('on'); });

  window.addEventListener('hashchange', () => { const v = location.hash.slice(1); if (V[v] && v !== S.view) { S.view = v; render(); } });

  // boot
  if (/[?&]still/.test(location.search)) document.documentElement.classList.add('still');
  if (!V[S.view]) S.view = 'pulse';
  CGP.mlas = {};
  CGP.setItems(CGP.generate());
  CGP.source = 'sample';
  document.addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();
  function boot() {
    if (boot.done) return; boot.done = true;
    new URLSearchParams(location.search).getAll('ask').forEach(q => {
      const r = CGP.Q.answer(q, S);
      S.chat.push({ role: 'user', text: q }, { role: 'ai', html: r.html, p: r.p });
      S.view = 'ask';
    });
    render({ noFocus: true });
  }
})(window);
