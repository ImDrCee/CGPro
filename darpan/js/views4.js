/* Jan Darpan · Clippings screen: the team's daily newspaper clippings, read, tagged and linked to the analysis. */
(function (g) {
  const CGP = g.CGP, R = CGP.ref, U = CGP.U, C = CGP.C, V = CGP.V, I = CGP.icon, W = CGP.W;
  const card = W.card, pill = W.pill, empty = W.empty;
  const PCOL = { 'Navbharat (Chhattisgarh)': '#E8680E', 'Hari Bhoomi': '#1FA971', 'Dainik Bhaskar': '#D6383A', 'Patrika': '#2A78D6', 'Nai Dunia': '#8B5CF6', 'Swadesh': '#C9922B' };
  const PABB = { 'Navbharat (Chhattisgarh)': 'NB', 'Hari Bhoomi': 'HB', 'Dainik Bhaskar': 'DB', 'Patrika': 'PT', 'Nai Dunia': 'ND', 'Swadesh': 'SW' };
  const PORDER = Object.keys(PCOL);
  const PSHORT = { 'Navbharat (Chhattisgarh)': 'Navbharat' };
  const pname = p => PSHORT[p] || p || 'Unidentified paper';
  const badge = p => `<span class="pbadge" style="--c:${PCOL[p] || '#8a8fa3'}" data-tip="${U.esc(pname(p))}">${PABB[p] || '·'}</span>`;
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dlabel = d => { const p = d.split('-'); return +p[2] + ' ' + MON[+p[1] - 1]; };
  const sgn = n => (n > 0 ? '+' : '') + n;

  const clips = () => (CGP.items || []).filter(i => i.clipId);
  CGP.clipCount = () => clips().length;
  const F = S => (S.cf = S.cf || { day: 'all', month: 'all', paper: 'all', tone: 'all', topic: 'all', person: 'all', q: '', sort: 'page', n: 48 });

  function filtered(S, skip) {
    const f = F(S), q = (f.q || '').trim().toLowerCase();
    let l = clips().filter(i => (f.month === 'all' || i.clipDate.slice(5, 7) === f.month) && (skip === 'day' || f.day === 'all' || i.clipDate === f.day)
      && (skip === 'paper' || f.paper === 'all' || i.source === f.paper)
      && (skip === 'base' || f.tone === 'all' || (f.tone === 'crit' ? i.stance < 0 : f.tone === 'sup' ? i.stance > 0 : i.stance === 0))
      && (skip === 'base' || f.topic === 'all' || i.topic === f.topic)
      && (skip === 'base' || f.person === 'all' || (i.people || []).indexOf(f.person) >= 0)
      && (skip === 'base' || !q || (i.headline + ' ' + i.issue + ' ' + i.place + ' ' + (i.people || []).join(' ') + ' ' + i.entities.join(' ') + ' ' + i.source).toLowerCase().indexOf(q) >= 0));
    const po = p => { const k = PORDER.indexOf(p); return k < 0 ? 99 : k; };
    l.sort((a, b) => b.clipDate.localeCompare(a.clipDate) || (f.sort === 'crit' ? (a.sentiment - b.sentiment) : f.sort === 'pickup' ? (b.pickup - a.pickup) : (po(a.source) - po(b.source) || a.clipPg - b.clipPg)));
    return l;
  }

  function stats(l) {
    const n = l.length, crit = l.filter(i => i.stance < 0).length, sup = l.filter(i => i.stance > 0).length;
    const iss = {}, ent = {}, pap = {};
    l.forEach(i => { if (i.issue && !i.generic && !i.broad) iss[i.issue] = (iss[i.issue] || 0) + 1; (i.people || []).forEach(e => { const o = ent[e] || (ent[e] = { name: e, n: 0, sup: 0, crit: 0 }); o.n++; if (i.stance > 0) o.sup++; else if (i.stance < 0) o.crit++; }); pap[i.source] = (pap[i.source] || 0) + 1; });
    return { n, crit, sup, neu: n - crit - sup, iss: Object.keys(iss).map(k => [k, iss[k]]).sort((a, b) => b[1] - a[1]), ent: Object.values(ent).sort((a, b) => b.n - a.n), pap, picked: l.filter(i => i.pickup > 1).length, cm: l.filter(i => i.mentionsCM).length };
  }

  const pct = (a, n) => (n ? Math.round((100 * a) / n) : 0);
  const imgPath = i => i.clipDate + '/' + String(i.clipPg).padStart(3, '0') + '.jpg';
  const imgBox = (i, cls) => `<div class="clipimg ${cls || ''}" data-clipimg="${imgPath(i)}">${CGP.clipImg.status === 'ready' ? '' : `<div class="ph">${I('doc', 22)}</div>`}</div>`;

  const linkBar = () => {
    const ci = CGP.clipImg;
    if (ci.status === 'ready') return `<span class="chip on">${I('check', 13)} ${ci.count} clipping images linked</span> <button class="btn ghost sm" data-clipfolder>Change folder</button>`;
    if (ci.status === 'permission') return `<button class="btn sm" data-clipreconnect>${I('link', 14)} Reconnect clipping images</button>`;
    return `<button class="btn sm" data-clipfolder>${I('link', 14)} Link clipping images</button>`;
  };

  const wday = d => new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short' });
  const MFULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function monthBar(S) {
    const f = F(S), all = clips(), m = {};
    all.forEach(i => { const k = i.clipDate.slice(5, 7); const o = m[k] || (m[k] = { n: 0, d: {} }); o.n++; o.d[i.clipDate] = 1; });
    const keys = Object.keys(m).sort().reverse();
    return `<div class="monthbar"><button class="mtile ${f.month === 'all' ? 'on' : ''}" data-cf="month=all"><b>All</b><span>${all.length} clippings</span></button>${keys.map(k => `<button class="mtile ${f.month === k ? 'on' : ''}" data-cf="month=${k}"><b>${MFULL[+k - 1]}</b><span>${m[k].n} clippings · ${Object.keys(m[k].d).length} days</span></button>`).join('')}</div>`;
  }
  function dayRail(S) {
    const f = F(S), all = clips(), days = {};
    all.forEach(i => (days[i.clipDate] = (days[i.clipDate] || 0) + 1));
    const ds = Object.keys(days).sort().reverse(), max = Math.max.apply(null, ds.map(d => days[d]).concat([1]));
    const groups = [...new Set(ds.map(d => d.slice(5, 7)))].filter(k => f.month === 'all' || f.month === k);
    const tile = d => { const p = d.split('-'); return `<button class="daytile ${f.day === d ? 'on' : ''}" data-cf="day=${f.day === d ? 'all' : d}" data-tip="${days[d]} clippings on ${dlabel(d)}"><span class="dw">${wday(d)}</span><b class="dd">${+p[2]}</b><span class="dm">${MON[+p[1] - 1]}</span><em>${days[d]} clippings</em><i style="width:${Math.round(100 * days[d] / max)}%"></i></button>`; };
    return monthBar(S) + groups.map(k => `${f.month === 'all' ? `<h5 class="mhead">${MFULL[+k - 1]} 2026</h5>` : ''}<div class="daygrid">${ds.filter(d => d.slice(5, 7) === k).map(tile).join('')}</div>`).join('');
  }

  function card1(i) {
    const crit = i.stance < 0, sup = i.stance > 0;
    return `<article class="clipcard ${crit ? 'crit' : sup ? 'sup' : ''}" tabindex="0" data-clip="${i.clipId}">
      ${CGP.clipImg.status === 'ready' ? imgBox(i, 'thumb') : ''}
      <div class="cmeta">${badge(i.source)}<span>${U.esc(pname(i.source))} · p.${i.clipPg}${i.clipEd ? ' · ' + U.esc(i.clipEd) : ''}</span><span class="grow"></span>${C.stanceTag(i.stance)}</div>
      <h4>${U.esc(i.headline || ('Clipping from ' + pname(i.source) + ', page ' + i.clipPg))}</h4>
      <div class="chips">${i.issue && !i.generic ? `<span class="chip on">${U.esc(i.issue)}</span>` : ''}${i.place ? `<span class="chip ghost">${U.esc(i.place)}</span>` : ''}${(i.people || []).slice(0, 3).map(e => `<span class="chip ghost">${U.esc(e)}</span>`).join('')}${i.pickup > 1 ? `<span class="chip ghost" data-tip="Reported by ${i.pickup} outlets">${i.pickup} outlets</span>` : ''}</div>
      <small class="muted">${dlabel(i.clipDate)}</small></article>`;
  }

  const rdDay = (f, all) => f.day !== 'all' ? f.day : [...new Set(all.filter(i => f.month === 'all' || i.clipDate.slice(5, 7) === f.month).map(i => i.clipDate))].sort().reverse()[0];
  function wall(S) {
    const f = F(S), l = filtered(S), st = stats(l), all = clips();
    if (!all.length) return `<div class="bento">${card({ cls: 'span12', title: 'Clippings', body: empty('No clippings loaded', 'The daily clippings have not been added yet.') })}</div>`;
    const topics = R.topics.map(t => [t.id, t.short]);
    const people = stats(all).ent.slice(0, 60).map(e => [e.name, e.name]);
    const sel = (a, list, cur, all0) => `<select class="sel" data-cfs="${a}"><option value="all">${all0}</option>${list.map(o => `<option value="${U.esc(o[0])}" ${cur === o[0] ? 'selected' : ''}>${U.esc(o[1])}</option>`).join('')}</select>`;
    const papers = {}; all.forEach(i => (papers[i.source] = (papers[i.source] || 0) + 1));
    const pl = Object.keys(papers).sort((a, b) => PORDER.indexOf(a) - PORDER.indexOf(b));
    const shown = l.slice(0, f.n);
    const maxIss = st.iss.length ? st.iss[0][1] : 1;
    return `<div class="bento">
      ${card({ cls: 'span12', title: f.day !== 'all' ? 'Clippings of ' + dlabel(f.day) : f.month !== 'all' ? MFULL[+f.month - 1] + ' clippings' : 'All clippings', sub: 'Read from the team\'s daily newspaper clippings. Every clipping is tagged like any other item and counts in the analysis.', right: `<div class="row-btns"><button class="btn" data-reader="${rdDay(f, all)}">${I('news', 16)} Read the ${dlabel(rdDay(f, all))} file</button>${linkBar()}</div>`,
        body: `${dayRail(S)}
        <div class="filters cf">${`<button class="chip ${f.paper === 'all' ? 'on' : ''}" data-cf="paper=all">All papers</button>`}${pl.map(p => `<button class="chip ${f.paper === p ? 'on' : ''}" data-cf="paper=${U.esc(p)}">${badge(p)} ${U.esc(pname(p))} <span class="cnt">${papers[p]} clippings</span></button>`).join('')}</div>
        <div class="filters cf"><div class="seg">${[['all', 'All tones'], ['crit', 'Critical'], ['neu', 'Neutral'], ['sup', 'Supportive']].map(t => `<button class="${f.tone === t[0] ? 'on' : ''}" data-cf="tone=${t[0]}">${t[1]}</button>`).join('')}</div>${sel('topic', topics, f.topic, 'All topics')}${sel('person', people, f.person, 'Anyone')}${sel('sort', [['page', 'Page order'], ['crit', 'Most critical first'], ['pickup', 'Most reported first']], f.sort, 'Page order').replace('<option value="all">Page order</option>', '')}<input class="search" data-cfq placeholder="Search headlines, people, places" value="${U.esc(f.q)}"/></div>` })}
      ${card({ cls: 'span12', body: `<div class="tiles">${[['Clippings', st.n], ['Papers', Object.keys(st.pap).length], ['Critical', pct(st.crit, st.n) + '%'], ['Supportive', pct(st.sup, st.n) + '%'], ['Mention the CM', st.cm], ['Reported by 2+ outlets', st.picked]].map(z => `<div class="tile-s"><span>${z[0]}</span><b>${z[1]}</b></div>`).join('')}</div>` })}
      <div class="span8">${shown.length ? `<div class="clipgrid">${shown.map(card1).join('')}</div>${l.length > shown.length ? `<div class="more"><button class="btn ghost" data-cfmore>Show more (${l.length - shown.length} left)</button></div>` : ''}` : card({ title: 'Nothing matches', body: empty('No clipping matches these filters', 'Clear a filter to see more.') })}</div>
      <div class="span4 side">
        ${card({ title: 'Who is in the news', sub: 'Mentions in this selection', body: st.ent.slice(0, 10).map(e => `<div class="orow click" data-cf="person=${U.esc(e.name)}"><div><b>${U.esc(e.name)}</b><p>${e.n} clippings · ${e.sup} supportive · ${e.crit} critical</p></div><span class="pill" style="--c:${e.sup > e.crit ? 'var(--pos)' : e.sup < e.crit ? 'var(--neg)' : 'var(--pri2)'}">${sgn(e.sup - e.crit)}</span></div>`).join('') || '<p class="muted">No names detected.</p>' })}
        ${card({ title: 'Issues', sub: 'Most reported', body: st.iss.slice(0, 8).map(x => `<div class="orow"><div>${W.ilink(x[0])}</div><div class="cbar" style="--w:${Math.round(100 * x[1] / maxIss)}%"><i></i></div><span class="muted">${x[1]}</span></div>`).join('') || '<p class="muted">No specific issue.</p>' })}
      </div></div>`;
  }

  function peopleTab(S) {
    const f = F(S), l = filtered(S, 'base'), st = stats(l), all = clips();
    if (!all.length) return `<div class="bento">${card({ cls: 'span12', title: 'People', body: empty('No clippings loaded', '') })}</div>`;
    const papers = Object.keys(stats(all).pap).sort((a, b) => PORDER.indexOf(a) - PORDER.indexOf(b));
    const rows = st.ent.slice(0, 60).map(e => {
      const its = l.filter(i => (i.people || []).indexOf(e.name) >= 0), byP = {};
      its.forEach(i => (byP[i.source] = (byP[i.source] || 0) + 1));
      const iss = {}; its.forEach(i => { if (i.issue && !i.generic && !i.broad) iss[i.issue] = (iss[i.issue] || 0) + 1; });
      const top = Object.keys(iss).sort((a, b) => iss[b] - iss[a])[0] || '';
      const avg = its.length ? its.reduce((t, i) => t + i.sentiment, 0) / its.length : 0;
      return `<tr class="click" tabindex="0" data-cf="person=${U.esc(e.name)}" data-go="wall"><td><b>${U.esc(e.name)}</b></td><td class="r">${e.n}</td><td class="r">${e.sup}</td><td class="r">${e.crit}</td><td class="r">${e.n - e.sup - e.crit}</td>
        <td><div class="divbar"><i class="neg" style="width:${pct(e.crit, e.n)}%"></i><i class="pos" style="width:${pct(e.sup, e.n)}%"></i></div></td>
        <td class="r"><span class="pill" style="--c:${avg > 0.05 ? 'var(--pos)' : avg < -0.05 ? 'var(--neg)' : 'var(--pri2)'}">${(avg > 0 ? '+' : '') + avg.toFixed(2)}</span></td>
        <td>${papers.filter(p => byP[p]).map(p => `<span class="pn" data-tip="${U.esc(pname(p))}: ${byP[p]}">${badge(p)}<b>${byP[p]}</b></span>`).join('')}</td><td class="muted">${U.esc(top)}</td></tr>`;
    }).join('');
    return `<div class="bento">${card({ cls: 'span12', title: 'People in the clippings', sub: 'Every public figure named in the selected clippings, with how each paper covers them. Tone is the share of supportive and critical clippings; score is the average sentiment (-1 to +1). Click a row to see the clippings.',
      right: `<div class="filters cf"><div class="seg"><button class="${f.paper === 'all' ? 'on' : ''}" data-cf="paper=all">All papers</button>${papers.map(p => `<button class="${f.paper === p ? 'on' : ''}" data-cf="paper=${U.esc(p)}">${U.esc(pname(p))}</button>`).join('')}</div></div>`,
      body: `<div class="mla-tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th class="r">Clippings</th><th class="r">Supportive</th><th class="r">Critical</th><th class="r">Neutral</th><th>Tone</th><th class="r">Score</th><th>By paper</th><th>Main issue</th></tr></thead><tbody>${rows}</tbody></table></div>` })}</div>`;
  }

  function issuesTab(S) {
    const f = F(S), l = clips().filter(i => (f.day === 'all' || i.clipDate === f.day)), all = clips();
    if (!all.length) return `<div class="bento">${card({ cls: 'span12', title: 'Issues', body: empty('No clippings loaded', '') })}</div>`;
    const g2 = {};
    l.forEach(i => { if (!i.issue || i.generic || i.broad) return; const o = g2[i.issue] || (g2[i.issue] = { k: i.issue, n: 0, sup: 0, crit: 0, p: {}, st: {} }); o.n++; if (i.stance > 0) o.sup++; else if (i.stance < 0) o.crit++; o.p[i.source] = 1; o.st[i.story] = (o.st[i.story] || 0) + 1; });
    const rows = Object.values(g2).sort((a, b) => b.n - a.n).slice(0, 40);
    return `<div class="bento">${card({ cls: 'span12', title: 'Issues in the clippings', sub: 'What the papers are reporting, with how many papers carry each issue.', right: dayRailSmall(S),
      body: `<div class="mla-tbl-wrap"><table class="tbl"><thead><tr><th>Issue</th><th class="r">Clippings</th><th class="r">Papers</th><th class="r">Critical</th><th class="r">Supportive</th><th>Tone</th></tr></thead><tbody>${rows.map(o => `<tr><td>${W.ilink(o.k)}</td><td class="r">${o.n}</td><td class="r">${Object.keys(o.p).length}</td><td class="r">${o.crit}</td><td class="r">${o.sup}</td><td><div class="divbar"><i class="neg" style="width:${pct(o.crit, o.n)}%"></i><i class="pos" style="width:${pct(o.sup, o.n)}%"></i></div></td></tr>`).join('')}</tbody></table></div>` })}</div>`;
  }
  const dayRailSmall = S => { const f = F(S), ds = [...new Set(clips().map(i => i.clipDate))].sort().reverse(); return `<select class="sel" data-cfs="day"><option value="all">All days</option>${ds.map(d => `<option value="${d}" ${f.day === d ? 'selected' : ''}>${dlabel(d)}</option>`).join('')}</select>`; };

  V.clippings = S => {
    const tabs = [['wall', 'Clippings'], ['people', 'People'], ['issues', 'Issues']];
    let t = W.cur(S, 'wall');
    if (/^\d{4}-\d\d-\d\d-\d+$/.test(t)) { const id = t; S.tab.clippings = 'wall'; t = 'wall'; history.replaceState(null, '', '#clippings'); setTimeout(() => CGP.openClip(id), 60); }
    return W.tabs(S, tabs) + (t === 'people' ? peopleTab(S) : t === 'issues' ? issuesTab(S) : wall(S));
  };

  V.clip = id => {
    const i = clips().find(x => x.clipId === id); if (!i) return '';
    const S = CGP.state, l = filtered(S), k = l.findIndex(x => x.clipId === id);
    const prev = k > 0 ? l[k - 1] : null, next = k >= 0 && k < l.length - 1 ? l[k + 1] : null;
    const rel = clips().filter(x => x.story === i.story && x.clipId !== id);
    const kv = [['Paper', pname(i.source)], ['Edition', i.clipEd || '—'], ['Date', dlabel(i.clipDate) + ' 2026'], ['Page in the file', i.clipPg], ['Topic', U.tname(i.topic)], ['Issue', i.issue || '—'], ['District', i.place || '—'], ['Constituency', i.constituency || '—'],
      ['Speaker type', R.speakers[i.speakerType] ? R.speakers[i.speakerType].label : i.speakerType], ['Tone', i.stance > 0 ? 'Supportive' : i.stance < 0 ? 'Critical' : 'Neutral'], ['Sentiment', (i.sentiment > 0 ? '+' : '') + i.sentiment], ['Reported by', i.pickup + (i.pickup > 1 ? ' outlets' : ' outlet')], ['Tag confidence', Math.round((i.conf || 0) * 100) + '%']];
    const ci = CGP.clipImg;
    const imgSide = ci.status === 'ready' ? `<a class="clipfull" data-clipimg="${imgPath(i)}" href="#" data-zoom><span class="ph">${I('doc', 22)}</span></a>` : `<div class="clipnoimg">${I('doc', 28)}<b>Clipping image not linked</b><p>The scanned page stays on the team's own devices. Link the clippings folder to see it here.</p>${ci.status === 'permission' ? `<button class="btn" data-clipreconnect>Reconnect clipping images</button>` : `<button class="btn" data-clipfolder>Link clipping images</button>`}</div>`;
    return `<div class="mcard clipm"><button class="mclose" data-close aria-label="Close">${I('close', 18)}</button>
      <div class="cimgcol">${imgSide}</div>
      <div class="cinfo"><div class="mhead">${badge(i.source)}<span>${U.esc(pname(i.source))} · page ${i.clipPg} · ${dlabel(i.clipDate)}</span>${C.stanceTag(i.stance)}</div>
        <h3>${U.esc(i.headline || ('Clipping from ' + pname(i.source)))}</h3>
        <div class="chips">${(i.people || []).map(e => `<button class="chip on" data-cf="person=${U.esc(e)}" data-go="wall">${U.esc(e)}</button>`).join('')}${i.entities.filter(e => (i.people || []).indexOf(e) < 0).map(e => `<span class="chip ghost">${U.esc(e)}</span>`).join('')}</div>
        <div class="kvgrid">${kv.map(x => `<div><span>${x[0]}</span><b>${U.esc(x[1])}</b></div>`).join('')}</div>
        ${rel.length ? `<h5>Same story in other clippings</h5>${rel.slice(0, 5).map(x => `<div class="orow click" data-clip="${x.clipId}"><div><b>${U.esc(x.headline)}</b><p>${U.esc(pname(x.source))} · p.${x.clipPg} · ${dlabel(x.clipDate)}</p></div></div>`).join('')}` : ''}
        <p class="mact"><button class="btn ghost" data-reader="${i.clipDate}" data-rdpage="${i.clipPg}">${I('news', 16)} Open in the day's file</button> ${i.issue && !i.generic ? `<button class="btn ghost" data-open-issue="${U.esc(i.issue)}">${I('clock', 16)} Issue history</button>` : ''} <button class="btn ghost" data-ask="What is said about ${U.esc((i.people || [])[0] || i.issue || 'this')}?">${I('chat', 16)} Ask</button></p>
        <div class="cnav">${prev ? `<button class="btn ghost sm" data-clip="${prev.clipId}">&lsaquo; Previous</button>` : '<span></span>'}<small class="muted">${k >= 0 ? (k + 1) + ' of ' + l.length : ''}</small>${next ? `<button class="btn ghost sm" data-clip="${next.clipId}">Next &rsaquo;</button>` : '<span></span>'}</div></div></div>`;
  };

  CGP.clipUI = { badge, pname, dlabel };
  CGP.openClip = id => { const h = V.clip(id); if (h && CGP.openModal) CGP.openModal(h); };

  // events (delegated)
  let bound = false, deb;
  if (!bound) {
    bound = true;
    document.addEventListener('click', e => {
      const t = e.target.closest && e.target.closest('[data-clip],[data-cf],[data-cfmore],[data-clipfolder],[data-clipreconnect],[data-zoom]'); if (!t) return;
      const S = CGP.state;
      if (t.hasAttribute('data-zoom')) { e.preventDefault(); t.classList.toggle('big'); return; }
      if (t.hasAttribute('data-clipfolder')) { e.preventDefault(); (async () => { if (CGP.clipImg.canPick) { if (await CGP.clipImg.link()) { CGP.toast('Clipping images linked'); CGP.render({ keepScroll: true, noFocus: true }); } } else { const inp = document.getElementById('clipfolder'); if (inp) inp.click(); } })(); return; }
      if (t.hasAttribute('data-clipreconnect')) { e.preventDefault(); CGP.clipImg.reconnect().then(ok => { if (ok) { CGP.toast('Clipping images linked'); CGP.render({ keepScroll: true, noFocus: true }); } }); return; }
      if (t.hasAttribute('data-cfmore')) { F(S).n += 48; CGP.render({ keepScroll: true, noFocus: true }); return; }
      if (t.hasAttribute('data-cf')) {
        e.preventDefault(); const kv = t.getAttribute('data-cf').split('='), f = F(S); f[kv[0]] = kv.slice(1).join('='); f.n = 48; if (kv[0] === 'month') f.day = 'all';
        if (t.hasAttribute('data-go')) { S.tab.clippings = 'wall'; if (CGP.closeModal) CGP.closeModal(); if (S.view !== 'clippings') { S.view = 'clippings'; } history.replaceState(null, '', '#clippings'); }
        CGP.render({ keepScroll: !t.hasAttribute('data-go'), noFocus: true }); return;
      }
      if (t.hasAttribute('data-clip')) { e.preventDefault(); e.stopPropagation(); CGP.openClip(t.getAttribute('data-clip')); }
    }, true);
    document.addEventListener('change', e => {
      const el = e.target; if (!el.hasAttribute || !(el.hasAttribute('data-cfs'))) return;
      const S = CGP.state, f = F(S); f[el.getAttribute('data-cfs')] = el.value; f.n = 48; CGP.render({ keepScroll: true, noFocus: true });
      if (el.type === 'file') return;
    });
    document.addEventListener('input', e => {
      const el = e.target; if (!el.hasAttribute || !el.hasAttribute('data-cfq')) return;
      const S = CGP.state; F(S).q = el.value; F(S).n = 48;
      clearTimeout(deb); deb = setTimeout(() => { const pos = el.selectionStart; CGP.render({ keepScroll: true, noFocus: true }); const n = document.querySelector('[data-cfq]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }, 160);
    });
    document.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.clipcard,[data-cf][tabindex]')) { e.preventDefault(); e.target.click(); }
      const m = document.getElementById('modal');
      if (m && m.classList.contains('open') && m.querySelector('.clipm') && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        const b = m.querySelectorAll('.cnav [data-clip]'); const pick = e.key === 'ArrowLeft' ? Array.from(b).find(x => /Previous/.test(x.textContent)) : Array.from(b).find(x => /Next/.test(x.textContent)); if (pick) pick.click();
      }
    });
    document.addEventListener('change', e => {
      const el = e.target; if (el.id !== 'clipfolder') return;
      CGP.clipImg.linkFiles(el.files); CGP.toast(CGP.clipImg.count + ' clipping images linked'); CGP.render({ keepScroll: true, noFocus: true });
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
