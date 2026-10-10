/* Jan Darpan · clipping images. The scanned pages stay on the team's own machines; this links a local folder of
   page images (<date>/<nnn>.jpg) so clippings can be opened inside the app. Nothing is uploaded. */
(function (g) {
  const CGP = g.CGP;
  const DB = 'jd-clips', STORE = 'kv';
  const idb = () => new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const idbGet = async k => { try { const db = await idb(); return await new Promise(res => { const q = db.transaction(STORE).objectStore(STORE).get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }); } catch (e) { return null; } };
  const idbSet = async (k, v) => { try { const db = await idb(); await new Promise(res => { const t = db.transaction(STORE, 'readwrite'); t.objectStore(STORE).put(v, k); t.oncomplete = res; t.onerror = res; }); } catch (e) { /* storage unavailable */ } };

  const I = (CGP.clipImg = { status: 'none', files: {}, urls: {}, dir: null, count: 0 });
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
    I.status = I.count ? 'ready' : 'empty';
  }

  I.url = async path => {
    if (I.urls[path]) return I.urls[path];
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
    I.files = files; I.count = Object.keys(files).length; I.urls = {}; I.status = I.count ? 'ready' : 'empty';
  };
  I.reconnect = async () => {
    if (!I.dir) return false;
    try { if ((await I.dir.requestPermission({ mode: 'read' })) === 'granted') { await indexDir(I.dir); return true; } } catch (e) { /* denied */ }
    return false;
  };

  (async () => {
    const dir = await idbGet('dir');
    if (!dir) return;
    I.dir = dir;
    try {
      if ((await dir.queryPermission({ mode: 'read' })) === 'granted') await indexDir(dir); else I.status = 'permission';
    } catch (e) { I.status = 'permission'; }
    if (CGP.render) CGP.render({ keepScroll: true, noFocus: true });
  })();

  async function hydrate() {
    const els = document.querySelectorAll('[data-clipimg]:not([data-done])');
    for (const el of els) {
      const u = I.status === 'ready' ? await I.url(el.getAttribute('data-clipimg')) : null;
      if (!u) continue;
      el.setAttribute('data-done', '1');
      el.innerHTML = `<img src="${u}" alt="" loading="lazy"/>`;
    }
  }
  let t = null;
  new MutationObserver(() => { clearTimeout(t); t = setTimeout(hydrate, 30); }).observe(document.documentElement, { childList: true, subtree: true });
})(typeof window !== 'undefined' ? window : globalThis);
