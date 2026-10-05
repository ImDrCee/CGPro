/* Jan Darpan · MLA roster. Reads data/mlas.js (built by scripts/build_mlas.py) and wires it into the reference data. */
(function (g) {
  const CGP = g.CGP, R = CGP.ref;
  const src = g.CGP_MLAS;
  CGP.mlas = CGP.mlas || {};
  CGP.roster = { asOf: '', source: '', count: 0 };
  R.otherSeats = [];
  R.seatHi = {};
  if (!src || !Array.isArray(src.mlas)) return;

  const byFocus = {};
  src.mlas.forEach(m => {
    CGP.mlas[m.constituency] = m;
    if (m.hi) R.seatHi[m.constituency] = m.hi;
    if (m.focus && m.focus !== 'other') (byFocus[m.focus] = byFocus[m.focus] || []).push(m.constituency);
    else R.otherSeats.push({ seat: m.constituency, official: m.district });
  });
  R.districts.forEach(d => { if (byFocus[d.id]) d.seats = byFocus[d.id]; });
  CGP.roster = { asOf: src.asOf, source: src.source, count: src.mlas.length };

  // Names used to tag headlines to a seat. Longest first so "Raipur City North" wins over "Raipur".
  // Kota is skipped because it collides with Kota in Rajasthan. Seats named after their own district (Bastar, Korba, Bilaspur...)
  // are skipped too: a headline naming the district is not evidence about the seat.
  const names = [];
  src.mlas.forEach(m => {
    if (m.constituency === 'Kota' || m.constituency === m.district) return;
    names.push([m.constituency, m.constituency.toLowerCase()]);
    if (m.hi && m.hi !== 'कोटा') names.push([m.constituency, m.hi]);
  });
  R.seatNames = names.sort((a, b) => b[1].length - a[1].length);

  CGP.mlaList = () => src.mlas.slice();
  CGP.partyCount = () => { const c = {}; src.mlas.forEach(m => (c[m.party] = (c[m.party] || 0) + 1)); return c; };
})(typeof window !== 'undefined' ? window : globalThis);
