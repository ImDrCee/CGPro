/* Jan Darpan · clipping images. The scanned pages stay on the team's own machines; this links a local folder of
   page images (<date>/<nnn>.jpg) so clippings can be opened inside the app. Nothing is uploaded. */
(function (g) {
  const CGP = g.CGP;
  const DB = 'jd-clips', STORE = 'kv';
  const idb = () => new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const idbGet = async k => { try { const db = await idb(); return await new Promise(res => { const q = db.transaction(STORE).objectStore(STORE).get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }); } catch (e) { return null; } };
  const idbSet = async (k, v) => { try { const db = await idb(); await new Promise(res => { const t = db.transaction(STORE, 'readwrite'); t.objectStore(STORE).put(v, k); t.oncomplete = res; t.onerror = res; }); } catch (e) { /* storage unavailable */ } };

  const I = (CGP.clipImg = { status: 'none', files: {}, urls: {}, dir: null, count: 0, source: 'none' });
  const REPO = { owner: 'ImDrCee', name: 'CGPro-clips' }, TK = 'jd-clip-token';
  I.repo = REPO;
  const token = () => { try { return localStorage.getItem(TK) || ''; } catch (e) { return ''; } };
  const changed = () => { document.dispatchEvent(new Event('clipimg-change')); if (CGP.render) CGP.render({ keepScroll: true, noFocus: true }); };
  const api = (path, tk) => fetch('https://api.github.com/repos/' + REPO.owner + '/' + REPO.name + path, { headers: { Authorization: 'Bearer ' + (tk || token()), Accept: 'application/vnd.github.raw+json' } });
  const canPick = typeof g.showDirectoryPicker === 'function';
  I.canPick = canPick;

  async function indexDir(dir) {
    const files = {};
    for await (const [name, h] of dir.entries()) {
      if (h.kind === 'directory') {
        for await (const [n2, h2] of h.entries()) if (h2.kind === 'file' && /\.jpe?g$/i.test(n2)) files[name + '/' + n2] = h2;
      } else if (/^\d{4}-\d\d-\d\d[_\/]\d+\.jpe?g$/i.test(name)) files[name.replace('_', '/')] = h;
    }
    I.files = files; I.count = Object.keys(files).length; I.urls = {};
    I.status = I.count ? 'ready' : 'empty'; if (I.count) I.source = 'folder';
  }

  I.url = async path => {
    if (I.urls[path]) return I.urls[path];
    if (I.source === 'github') {
      try {
        const r = await api('/contents/' + path);
        if (r.status === 401 || r.status === 403 || r.status === 404) { if (I.status !== 'denied') { I.status = 'denied'; changed(); } return null; }
        if (!r.ok) return null;
        return (I.urls[path] = URL.createObjectURL(await r.blob()));
      } catch (e) { return null; }
    }
    const h = I.files[path]; if (!h) return null;
    const f = h.getFile ? await h.getFile() : h;
    return (I.urls[path] = URL.createObjectURL(f));
  };

  I.link = async () => {
    if (!canPick) return false;
    try {
      const dir = await g.showDirectoryPicker({ id: 'jd-clips', mode: 'read' });
      await idbSet('dir', dir); I.dir = dir; await indexDir(dir);
    } catch (e) { return false; }
    return true;
  };
  // Fallback for browsers without the directory picker: choose the folder once per visit.
  I.linkFiles = fileList => {
    const files = {};
    Array.from(fileList).forEach(f => { const m = (f.webkitRelativePath || f.name).match(/(\d{4}-\d\d-\d\d)[\/\\](\d+\.jpe?g)$/i); if (m) files[m[1] + '/' + m[2]] = f; });
    I.files = files; I.count = Object.keys(files).length; I.urls = {}; I.status = I.count ? 'ready' : 'empty'; if (I.count) I.source = 'folder';
  };

  // Connect the private library with a read-only token (kept on this device only).
  I.connect = async tk => {
    tk = (tk || '').trim(); if (!tk) return { ok: false, msg: 'Paste your access token.' };
    try {
      const r = await fetch('https://api.github.com/repos/' + REPO.owner + '/' + REPO.name, { headers: { Authorization: 'Bearer ' + tk } });
      if (r.status === 401) return { ok: false, msg: 'GitHub did not accept that token.' };
      if (r.status === 404 || r.status === 403) return { ok: false, msg: 'This token cannot see the clippings library. Ask the owner for access, and give the token read access to it.' };
      if (!r.ok) return { ok: false, msg: 'Could not reach GitHub (' + r.status + ').' };
    } catch (e) { return { ok: false, msg: 'Could not reach GitHub. Check the connection.' }; }
    try { localStorage.setItem(TK, tk); } catch (e) { return { ok: false, msg: 'This browser blocks saving.' }; }
    I.urls = {}; I.source = 'github'; I.status = 'ready'; changed(); return { ok: true };
  };
  I.disconnect = () => { try { localStorage.removeItem(TK); } catch (e) { /* ignore */ } I.urls = {}; if (I.source === 'github') { I.source = 'none'; I.status = 'none'; } changed(); };
  if (token()) { I.source = 'github'; I.status = 'ready'; }
  I.reconnect = async () => {
    if (!I.dir) return false;
    try { if ((await I.dir.requestPermission({ mode: 'read' })) === 'granted') { await indexDir(I.dir); return true; } } catch (e) { /* denied */ }
    return false;
  };

  (async () => {
    const dir = await idbGet('dir');
    if (!dir || I.source === 'github') return;
    I.dir = dir;
    try {
      if ((await dir.queryPermission({ mode: 'read' })) === 'granted') await indexDir(dir); else I.status = 'permission';
    } catch (e) { I.status = 'permission'; }
    if (CGP.render) CGP.render({ keepScroll: true, noFocus: true });
  })();

  let running = false;
  async function hydrate() {
    if (running) return; running = true;
    try {
      for (let round = 0; round < 40; round++) {
        const modal = document.getElementById('modal');
        const all = Array.from(document.querySelectorAll('[data-clipimg]:not([data-done])')).filter(el => {
          if (modal && modal.contains(el)) return true;
          const r0 = el.getBoundingClientRect(); return !(r0.top > innerHeight + 900 || r0.bottom < -900);
        });
        if (!all.length || I.status !== 'ready') break;
        all.sort((a, b) => (modal && modal.contains(b) ? 1 : 0) - (modal && modal.contains(a) ? 1 : 0));
        const batch = all.slice(0, 6);
        await Promise.all(batch.map(async el => {
          const u = await I.url(el.getAttribute('data-clipimg'));
          if (!u) { el.setAttribute('data-done', '0'); return; }
          el.setAttribute('data-done', '1');
          el.innerHTML = `<img src="${u}" alt="" loading="lazy"/>`;
        }));
      }
    } finally { running = false; }
  }
  let t = null;
  const kick = () => { clearTimeout(t); t = setTimeout(hydrate, 30); };
  new MutationObserver(kick).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('scroll', kick, { passive: true, capture: true });

  // connect dialog
  const dlg = (msg) => `<div class="mcard form"><button class="mclose" data-close aria-label="Close">${CGP.icon('close', 18)}</button>
    <h3>${I.source === 'github' ? 'Clippings library' : 'Connect the clippings library'}</h3>
    <p class="muted">The scanned pages are kept in a private library, not on the website. Paste a read-only access token to view them here. The token stays on this device.</p>
    ${I.source === 'github' ? '<p><span class="tag pos">Connected</span></p>' : ''}
    <ol class="how"><li>Ask the owner to give you access to the private repository <b>${REPO.owner}/${REPO.name}</b>.</li><li>On GitHub create a <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">fine-grained token</a> for that repository only, with <b>Contents: Read-only</b>.</li><li>Paste it below.</li></ol>
    <div class="fld full"><label for="cliptk">Access token</label><input id="cliptk" type="password" autocomplete="off" placeholder="github_pat_…"/></div>
    <p class="muted sm" id="clipmsg" style="color:var(--neg)">${msg || ''}</p>
    <div class="fact"><button class="btn ghost" data-clipdisc ${I.source === 'github' ? '' : 'hidden'}>Disconnect</button>${canPick ? '<button class="btn ghost" data-clipfolder>Use a local folder instead</button>' : ''}<button class="btn" data-clipsave>Connect</button></div></div>`;
  let back = null;
  I.dialog = msg => { if (!msg) { const m = document.getElementById('modal'); back = m && m.classList.contains('open') && m.querySelector('.mcard.reader') && CGP.rd ? { d: CGP.rd.d, i: CGP.rd.i } : null; } if (CGP.openModal) CGP.openModal(dlg(msg)); };
  document.addEventListener('click', async e => {
    const el = e.target.closest && e.target.closest('[data-clipconnect],[data-clipsave],[data-clipdisc]'); if (!el) return;
    e.preventDefault(); e.stopPropagation();
    if (el.hasAttribute('data-clipconnect')) return I.dialog('');
    if (el.hasAttribute('data-clipdisc')) { I.disconnect(); if (CGP.closeModal) CGP.closeModal(); return CGP.toast && CGP.toast('Disconnected'); }
    const r = await I.connect((document.getElementById('cliptk') || {}).value);
    if (r.ok) { if (back && CGP.openReader) CGP.openReader(back.d, back.i); else if (CGP.closeModal) CGP.closeModal(); back = null; CGP.toast && CGP.toast('Clippings library connected'); } else { const m = document.getElementById('clipmsg'); if (m) m.textContent = r.msg; }
  }, true);
})(typeof window !== 'undefined' ? window : globalThis);
