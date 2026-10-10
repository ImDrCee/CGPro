/* Jan Darpan · daily clipping file reader. Reads a day's clippings page by page, like the original file.
   There is no download: pages are shown from the images linked on this device. */
(function (g) {
  const CGP = g.CGP, U = CGP.U, I = CGP.icon;
  const imgPath = (d, pg) => d + '/' + String(pg).padStart(3, '0') + '.jpg';
  const clips = d => (CGP.items || []).filter(i => i.clipId && i.clipDate === d).sort((a, b) => a.clipPg - b.clipPg);

  function pages(d) {
    const ci = CGP.clipImg, its = clips(d), byPg = {};
    its.forEach(i => (byPg[i.clipPg] = i));
    let list = [{ pg: 0, item: null }].concat(its.map(i => ({ pg: i.clipPg, item: i })));
    if (ci.status === 'ready' && ci.source === 'folder') list = list.filter(p => ci.files[imgPath(d, p.pg)]);
    return list;
  }

  CGP.openReader = (d, idx) => {
    const list = pages(d); if (!list.length) return;
    idx = Math.max(0, Math.min(list.length - 1, idx || 0));
    CGP.rd = { d, i: idx };
    const ui = CGP.clipUI, cur = list[idx], it = cur.item, ci = CGP.clipImg;
    const rows = list.map((p, k) => `<button class="rdrow ${k === idx ? 'on' : ''}" data-rdidx="${k}">${p.item ? ui.badge(p.item.source) : '<span class="pbadge" style="--c:#8a8fa3">·</span>'}<span><b>p.${p.pg}</b> ${p.item ? U.esc(p.item.headline || ui.pname(p.item.source)) : 'Cover'}</span></button>`).join('');
    const main = ci.status === 'ready'
      ? `<a class="clipfull rdimg" href="#" data-zoom data-clipimg="${imgPath(d, cur.pg)}"><span class="ph">${I('doc', 22)}</span></a>`
      : `<div class="clipnoimg">${I('doc', 28)}<b>${ci.status === 'denied' ? 'Access to the clippings library was refused' : 'Connect the clippings library to read the file'}</b><p>The scanned pages are kept in a private library, not on the website.</p>${ci.status === 'permission' ? '<button class="btn" data-clipreconnect>Reconnect clipping images</button>' : '<button class="btn" data-clipconnect>Connect clippings library</button>'}</div>`;
    const html = `<div class="mcard reader"><button class="mclose" data-close aria-label="Close">${I('close', 18)}</button>
      <header class="rdh"><div><h3>${ui.dlabel(d)} 2026 · daily clippings</h3><p class="muted">${cur.pg === 0 ? 'Cover' : 'Page ' + cur.pg + (it ? ' · ' + U.esc(ui.pname(it.source)) : '')} · ${idx + 1} of ${list.length}</p></div>
        <div class="rdnav"><button class="btn ghost sm" data-rdgo="-1" ${idx ? '' : 'disabled'}>&lsaquo; Previous</button><input type="number" min="1" max="${list.length}" value="${idx + 1}" data-rdjump aria-label="Go to page"/><button class="btn ghost sm" data-rdgo="1" ${idx < list.length - 1 ? '' : 'disabled'}>Next &rsaquo;</button><button class="btn ghost sm" data-rdzoomall>Zoom</button></div></header>
      <div class="rdbody"><aside class="rdlist">${rows}</aside><section class="rdpage">${main}${it ? `<div class="rdcap"><b>${U.esc(it.headline || '')}</b><div class="chips">${(it.people || []).slice(0, 4).map(e => `<span class="chip ghost">${U.esc(e)}</span>`).join('')}${it.issue && !it.generic ? `<span class="chip on">${U.esc(it.issue)}</span>` : ''}<button class="chip ghost" data-clip="${it.clipId}">Tags and metrics</button></div></div>` : ''}</section></div></div>`;
    CGP.openModal(html);
    setTimeout(() => { const on = document.querySelector('.rdrow.on'); if (on) on.scrollIntoView({ block: 'nearest' }); }, 40);
  };
  const go = k => { if (CGP.rd) CGP.openReader(CGP.rd.d, k); };
  const isOpen = () => { const m = document.getElementById('modal'); return !!(m && m.classList.contains('open') && m.querySelector('.mcard.reader')); };
  const reopen = () => { if (CGP.rd && isOpen()) go(CGP.rd.i); };

  // refresh the reader after images are linked
  const ci = CGP.clipImg;
  const link = ci.link, reconnect = ci.reconnect, linkFiles = ci.linkFiles;
  ci.link = async () => { const ok = await link(); if (ok) reopen(); return ok; };
  ci.reconnect = async () => { const ok = await reconnect(); if (ok) reopen(); return ok; };
  ci.linkFiles = f => { linkFiles(f); reopen(); };

  document.addEventListener('clipimg-change', reopen);
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-reader],[data-rdidx],[data-rdgo],[data-rdzoomall]'); if (!t) return;
    e.preventDefault(); e.stopPropagation();
    if (t.hasAttribute('data-reader')) {
      const d = t.getAttribute('data-reader'), pg = t.getAttribute('data-rdpage'), list = pages(d);
      const k = pg == null ? 0 : Math.max(0, list.findIndex(p => p.pg === +pg));
      return CGP.openReader(d, k);
    }
    if (t.hasAttribute('data-rdidx')) return go(+t.getAttribute('data-rdidx'));
    if (t.hasAttribute('data-rdgo')) return go(CGP.rd.i + +t.getAttribute('data-rdgo'));
    if (t.hasAttribute('data-rdzoomall')) { const a = document.querySelector('.rdimg'); if (a) a.classList.toggle('big'); }
  }, true);
  document.addEventListener('change', e => { const el = e.target; if (el.hasAttribute && el.hasAttribute('data-rdjump')) go((+el.value || 1) - 1); });
  document.addEventListener('keydown', e => {
    if (!isOpen() || /INPUT|TEXTAREA|SELECT/.test((e.target.tagName || ''))) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(CGP.rd.i + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(CGP.rd.i - 1); }
  });
})(typeof window !== 'undefined' ? window : globalThis);
