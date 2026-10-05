/* Persistence: localStorage with an in-memory fallback. Everything the user adds is kept here and can be exported. */
(function (g) {
  const CGP = g.CGP;
  const P = 'jd1.';
  const mem = {};
  let ok = true;
  try { localStorage.setItem(P + 't', '1'); localStorage.removeItem(P + 't'); } catch (e) { ok = false; }

  const S = (CGP.store = {});
  S.persistent = ok;
  S.get = (k, d) => { try { const v = ok ? localStorage.getItem(P + k) : mem[k]; return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  S.set = (k, v) => { try { const s = JSON.stringify(v); if (ok) localStorage.setItem(P + k, s); else mem[k] = s; } catch (e) { /* quota */ } return v; };
  S.uid = p => (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const list = key => ({
    all: () => S.get(key, []),
    add: o => { const a = S.get(key, []); o.id = o.id || S.uid(key[0]); o.addedAt = o.addedAt || Date.now(); a.unshift(o); S.set(key, a); return o; },
    update: (id, patch) => { const a = S.get(key, []); const i = a.findIndex(x => x.id === id); if (i >= 0) { a[i] = Object.assign({}, a[i], patch); S.set(key, a); } return a[i]; },
    remove: id => S.set(key, S.get(key, []).filter(x => x.id !== id)),
    replace: a => S.set(key, a)
  });
  S.links = list('links');       // saved links (articles, posts, videos, pages)
  S.tracked = list('tracked');   // watch-list of handles / pages / channels
  S.actions = list('actions');   // action-outcome ledger
  S.statements = list('statements');
  S.commitments = list('commitments');
  S.datasets = list('datasets');

  S.map = key => ({ all: () => S.get(key, {}), set: (k, v) => { const m = S.get(key, {}); if (v === undefined) delete m[k]; else m[k] = v; S.set(key, m); } });
  S.overrides = S.map('overrides');   // curator corrections of auto tags, keyed by item id
  S.verdicts = S.map('verdicts');     // analyst verdicts on correlations / history lines
  S.rebuttals = S.map('rebuttals');   // rebuttal workflow status per issue
  S.settings = S.map('settings');

  S.exportAll = () => ({
    app: 'Jan Darpan', version: 1, exportedAt: new Date().toISOString(),
    links: S.links.all(), tracked: S.tracked.all(), actions: S.actions.all(), statements: S.statements.all(), commitments: S.commitments.all(),
    datasets: S.datasets.all(), overrides: S.overrides.all(), verdicts: S.verdicts.all(), rebuttals: S.rebuttals.all(), settings: S.settings.all()
  });
  S.importAll = (j, merge) => {
    const lists = ['links', 'tracked', 'actions', 'statements', 'commitments', 'datasets'];
    lists.forEach(k => {
      if (!Array.isArray(j[k])) return;
      const cur = merge ? S[k].all() : [];
      const ids = {}; cur.forEach(x => (ids[x.id] = 1));
      S[k].replace(cur.concat(j[k].filter(x => !ids[x.id])));
    });
    ['overrides', 'verdicts', 'rebuttals', 'settings'].forEach(k => { if (j[k] && typeof j[k] === 'object') S.set(k, Object.assign(merge ? S.get(k, {}) : {}, j[k])); });
  };
  S.clearAll = () => { try { Object.keys(localStorage).filter(k => k.indexOf(P) === 0).forEach(k => localStorage.removeItem(k)); } catch (e) {} Object.keys(mem).forEach(k => delete mem[k]); };
})(typeof window !== 'undefined' ? window : globalThis);
