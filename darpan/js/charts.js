/* Tiny dependency-free chart helpers. Every function returns an HTML/SVG string. */
(function (g) {
  const CGP = g.CGP;
  const U = CGP.U;
  const C = (CGP.C = {});
  let uid = 0;
  C.uid = () => 'g' + ++uid;

  function smooth(pts) {
    if (pts.length < 2) return '';
    let d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
    const t = 0.18;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
      const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
      d += ' C' + c1[0].toFixed(1) + ',' + c1[1].toFixed(1) + ' ' + c2[0].toFixed(1) + ',' + c2[1].toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
    }
    return d;
  }

  C.spark = (vals, o) => {
    o = o || {};
    const w = o.w || 120, h = o.h || 36, color = o.color || 'var(--pri)', id = C.uid();
    const max = Math.max.apply(null, vals.concat([1]));
    const pts = vals.map((v, i) => [(i / Math.max(1, vals.length - 1)) * w, h - 3 - (v / max) * (h - 8)]);
    if (pts.length < 2) return '';
    const line = smooth(pts);
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${o.fixed ? w : '100%'}" height="${h}" preserveAspectRatio="none">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      <path d="${line} L${w},${h} L0,${h} Z" fill="url(#${id})"/>
      <path d="${line}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
  };

  C.stackedArea = (s, o) => {
    o = o || {};
    const W = 800, H = o.h || 260, L = 38, B = 28, T = 10, Rr = 10;
    const N = s.labels.length, keys = s.keys.filter(k => s.data[k].some(v => v > 0));
    const max = Math.max.apply(null, s.totals.concat([4])) * 1.12;
    const x = i => L + (i / Math.max(1, N - 1)) * (W - L - Rr);
    const y = v => H - B - (v / max) * (H - B - T);
    let cum = new Array(N).fill(0), layers = '';
    keys.forEach(k => {
      const bot = cum.slice();
      cum = cum.map((c, i) => c + s.data[k][i]);
      const top = cum.slice();
      const tp = top.map((v, i) => [x(i), y(v)]), bp = bot.map((v, i) => [x(i), y(v)]);
      const d = smooth(tp) + ' L' + bp[N - 1][0].toFixed(1) + ',' + bp[N - 1][1].toFixed(1) + ' ' + smooth(bp.slice().reverse()).replace(/^M[^C]*/, '') + ' Z';
      const col = U.chColor(k), id = C.uid();
      layers += `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".85"/><stop offset="1" stop-color="${col}" stop-opacity=".45"/></linearGradient></defs><path d="${d}" fill="url(#${id})" stroke="${col}" stroke-width="1.2"/>`;
    });
    let grid = '';
    for (let i = 0; i <= 4; i++) {
      const v = (max / 4) * i, yy = y(v);
      grid += `<line x1="${L}" x2="${W - Rr}" y1="${yy}" y2="${yy}" class="gl"/><text x="${L - 8}" y="${yy + 4}" class="gt" text-anchor="end">${Math.round(v)}</text>`;
    }
    const every = Math.ceil(N / 8);
    let xl = '', hov = '';
    const bw = (W - L - Rr) / Math.max(1, N - 1);
    for (let i = 0; i < N; i++) {
      if (i % every === 0 || i === N - 1) xl += `<text x="${x(i)}" y="${H - 8}" class="gt" text-anchor="middle">${s.labels[i]}</text>`;
      const tip = `<b>${s.labels[i]}</b> · ${s.totals[i]} items<br>` + keys.filter(k => s.data[k][i]).map(k => `<i style="background:${U.chColor(k)}"></i>${k} ${s.data[k][i]}`).join('<br>');
      hov += `<rect class="hov" x="${x(i) - bw / 2}" y="${T}" width="${bw}" height="${H - B - T}" data-tip="${U.esc(tip)}"/>`;
    }
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%">${grid}${layers}${xl}${hov}</svg>`;
  };

  C.columns = (vals, labels, o) => {
    o = o || {};
    const n = vals.length, max = Math.max.apply(null, vals.concat([1])), every = Math.ceil(n / 10);
    return `<div class="cols" style="--h:${o.h || 120}px;--col:${o.color || 'var(--pri)'}">${vals.map((v, i) => `<div class="cb" data-tip="${U.esc(labels[i] + ' · ' + v)}"><i style="height:${Math.max(3, (v / max) * 100)}%;--o:${(0.35 + 0.65 * (v / max)).toFixed(2)}"></i><em>${i % every === 0 ? labels[i] : ''}</em></div>`).join('')}</div>`;
  };
  C.donut = (parts, o) => {
    o = o || {};
    const S = o.size || 160, th = o.thick || 20, r = (S - th) / 2, cx = S / 2, c = 2 * Math.PI * r;
    const tot = parts.reduce((a, p) => a + p.value, 0) || 1;
    let off = 0, segs = '';
    parts.forEach(p => {
      if (!p.value) return;
      const len = (p.value / tot) * c, gap = parts.length > 1 ? 3 : 0;
      segs += `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${p.color}" stroke-width="${th}" stroke-linecap="round" stroke-dasharray="${Math.max(0, len - gap)} ${c}" stroke-dashoffset="${-off}" transform="rotate(-90 ${cx} ${cx})" data-tip="${U.esc(p.label + ' · ' + p.value + ' (' + Math.round((100 * p.value) / tot) + '%)')}"/>`;
      off += len;
    });
    return `<div class="donut" style="width:${S}px;height:${S}px"><svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}"><circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="var(--line)" stroke-width="${th}"/>${segs}</svg>
      <div class="donut-c"><b>${o.big != null ? o.big : tot}</b><span>${o.small || 'items'}</span></div></div>`;
  };

  C.stack = (parts, o) => {
    const tot = parts.reduce((a, p) => a + p.v, 0) || 1;
    return `<div class="stackbar ${(o && o.cls) || ''}">${parts.filter(p => p.v > 0).map(p => `<span style="width:${(100 * p.v) / tot}%;background:${p.color}" data-tip="${U.esc(p.label + ' · ' + p.v)}"></span>`).join('')}</div>`;
  };

  C.hbars = rows => {
    const max = Math.max.apply(null, rows.map(r => r.value).concat([1]));
    return `<div class="hbars">${rows.map(r => `
      <div class="hb ${r.attrs ? 'click' : ''}" ${r.attrs || ''}>
        <div class="hb-top"><span class="hb-l">${r.label}</span><span class="hb-r">${r.right != null ? r.right : r.value}</span></div>
        <div class="hb-track"><i style="width:${Math.max(3, (100 * r.value) / max)}%;background:${r.color || 'var(--pri)'}"></i></div>
        ${r.sub ? `<div class="hb-sub">${r.sub}</div>` : ''}
      </div>`).join('')}</div>`;
  };

  C.gauge = net => {
    const a = (net / 100) * 80; // -80..80 degrees
    const id = C.uid();
    const R1 = 70, cx = 90, cy = 88;
    const pt = deg => { const t = ((deg - 90) * Math.PI) / 180; return [cx + R1 * Math.cos(t), cy + R1 * Math.sin(t)]; };
    const s = pt(-90), e = pt(90), n = pt(a);
    return `<svg viewBox="0 0 180 104" width="100%" class="gauge"><defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#FF5C70"/><stop offset=".5" stop-color="#FFB020"/><stop offset="1" stop-color="#14C48B"/></linearGradient></defs>
      <path d="M${s[0]},${s[1]} A${R1},${R1} 0 0 1 ${e[0]},${e[1]}" fill="none" stroke="var(--line)" stroke-width="12" stroke-linecap="round"/>
      <path d="M${s[0]},${s[1]} A${R1},${R1} 0 0 1 ${e[0]},${e[1]}" fill="none" stroke="url(#${id})" stroke-width="12" stroke-linecap="round" opacity=".95"/>
      <circle cx="${n[0]}" cy="${n[1]}" r="9" fill="var(--card)" stroke="var(--ink)" stroke-width="3"/></svg>`;
  };

  // Stylised tile cartogram of the 10 districts
  C.tileMap = (rows, o) => {
    o = o || {};
    const max = Math.max.apply(null, rows.map(r => r.value).concat([1]));
    return `<div class="tilemap">${rows.map(r => {
      const k = r.value / max;
      return `<button class="tile ${o.sel === r.d.id ? 'sel' : ''}" data-district="${r.d.id}" style="grid-column:${r.d.tile[0] + 1};grid-row:${r.d.tile[1] + 1};--i:${(0.12 + 0.88 * k).toFixed(2)};--tone:${r.tone || 'var(--pri)'};--fg:${k > 0.55 ? '#fff' : 'var(--ink)'}" data-tip="${U.esc(r.tip || '')}">
        <span class="t-name">${r.d.name}</span><span class="t-hi">${r.d.hi}</span><b class="t-val">${r.label != null ? r.label : r.value}</b></button>`;
    }).join('')}</div>`;
  };

  // Month x issue heat grid. rows: [{label, vals:[...12 or n]}], cols: labels
  C.heatGrid = (rows, cols, o) => {
    o = o || {};
    const max = Math.max.apply(null, [].concat.apply([], rows.map(r => r.vals)).concat([1]));
    return `<div class="heat" style="--cols:${cols.length}"><div class="hrow hh"><span></span>${cols.map(c => `<em>${c}</em>`).join('')}</div>` +
      rows.map(r => `<div class="hrow"><span class="hl" title="${U.esc(r.label)}">${r.click ? `<button class="ilink" data-open-issue="${U.esc(r.label)}">${U.esc(r.label)}</button>` : U.esc(r.label)}</span>${r.vals.map((v, i) => `<i style="--k:${(v / max).toFixed(2)};--c:${o.color || 'var(--neg)'}" data-tip="${U.esc(r.label + ' · ' + cols[i] + ' · ' + v)}"></i>`).join('')}</div>`).join('') + '</div>';
  };

  // Horizontal timeline of episodes: bars positioned between from..to
  C.timelineStrip = (eps, from, to, o) => {
    o = o || {};
    const W = 100, span = Math.max(1, to - from);
    return `<div class="tl">${eps.map(e => { const l = Math.max(0, ((e.start - from) / span) * W), w = Math.max(1.2, ((e.end - e.start) / span) * W); return `<i style="left:${l.toFixed(2)}%;width:${Math.min(W - l, w).toFixed(2)}%;--h:${Math.min(1, 0.35 + e.peak / (o.maxPeak || 12))}" data-tip="${U.esc(e.issue + ' · ' + U.dstr(e.start) + ' · ' + e.days + ' day(s) · ' + e.n + ' items')}"></i>`; }).join('')}</div>`;
  };

  // Association network (circular layout): nodes [{id,label,w}], links [{a,b,w}]
  C.network = (nodes, links, o) => {
    o = o || {};
    const W = 560, H = 360, cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 56;
    const pos = {}; nodes.forEach((n, i) => { const a = (i / nodes.length) * 2 * Math.PI - Math.PI / 2; pos[n.id] = [cx + r * Math.cos(a) * 1.35, cy + r * Math.sin(a)]; });
    const mw = Math.max.apply(null, links.map(l => l.w).concat([1])), mn = Math.max.apply(null, nodes.map(n => n.w).concat([1]));
    return `<svg class="chart net" viewBox="0 0 ${W} ${H}" width="100%">${links.map(l => pos[l.a] && pos[l.b] ? `<line x1="${pos[l.a][0]}" y1="${pos[l.a][1]}" x2="${pos[l.b][0]}" y2="${pos[l.b][1]}" stroke="var(--pri)" stroke-opacity="${(0.15 + 0.7 * l.w / mw).toFixed(2)}" stroke-width="${(1 + 4 * l.w / mw).toFixed(1)}" data-tip="${U.esc(l.tip || '')}"/>` : '').join('')}` +
      nodes.map(n => `<g data-tip="${U.esc(n.label + ' · ' + n.w + ' items')}"><circle cx="${pos[n.id][0]}" cy="${pos[n.id][1]}" r="${(6 + 9 * n.w / mn).toFixed(1)}" fill="${n.color || 'var(--pri)'}" fill-opacity=".85"/><text x="${pos[n.id][0]}" y="${pos[n.id][1] + 24 + 4 * n.w / mn}" text-anchor="middle" class="gt">${U.esc(n.label.length > 22 ? n.label.slice(0, 21) + '…' : n.label)}</text></g>`).join('') + '</svg>';
  };

  C.meter = c => { const k = { high: 3, medium: 2, low: 1, thin: 0 }[c] || 0; return `<span class="meter m${k}" data-tip="Confidence: ${c}"><i></i><i></i><i></i><em>${c}</em></span>`; };

  C.chBadge = ch => `<span class="chb" style="--c:${U.chColor(ch)}" data-tip="${U.esc(ch)}">${U.chAbbr(ch)}</span>`;
  C.stanceDot = s => `<span class="sdot ${s > 0 ? 'pos' : s < 0 ? 'neg' : 'neu'}"></span>`;
  C.stanceTag = s => (s > 0 ? '<span class="tag pos">Supportive</span>' : s < 0 ? '<span class="tag neg">Critical</span>' : '<span class="tag neu">Neutral</span>');
})(typeof window !== 'undefined' ? window : globalThis);
