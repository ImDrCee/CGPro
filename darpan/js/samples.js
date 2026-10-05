/* Fictional sample statements and commitments. Speakers are fictional on purpose: the public demo never puts invented quotes in real politicians' mouths. */
(function (g) {
  const CGP = g.CGP;
  const DAY = 86400000;
  CGP.makeSamples = function () {
    const now = Date.now(), d = n => now - n * DAY;
    CGP.sampleStatements = [
      { id: 'SS1', speaker: 'Leader R (rival party, fictional)', party: 'Rival', topic: 'farmers', stance: 1, date: d(640), venue: 'Rally (fictional)', quote: 'The paddy price scheme is a necessary relief for farmers.', url: '', sample: true },
      { id: 'SS2', speaker: 'Leader R (rival party, fictional)', party: 'Rival', topic: 'farmers', stance: -1, date: d(21), venue: 'Press conference (fictional)', quote: 'The paddy procurement scheme is a fraud on farmers.', url: '', sample: true },
      { id: 'SS3', speaker: 'Spokesperson S (our party, fictional)', party: 'Own', topic: 'farmers', stance: 1, date: d(300), venue: 'Assembly (fictional)', quote: 'Every farmer will be paid within 72 hours of procurement.', url: '', sample: true },
      { id: 'SS4', speaker: 'Leader R (rival party, fictional)', party: 'Rival', topic: 'women', stance: 1, date: d(520), venue: 'Interview (fictional)', quote: 'Direct cash support for women is the right approach.', url: '', sample: true },
      { id: 'SS5', speaker: 'Leader R (rival party, fictional)', party: 'Rival', topic: 'women', stance: -1, date: d(35), venue: 'Social post (fictional)', quote: "The women's cash scheme is being quietly wound down.", url: '', sample: true },
      { id: 'SS6', speaker: 'Spokesperson S (our party, fictional)', party: 'Own', topic: 'power', stance: 0, date: d(120), venue: 'Press note (fictional)', quote: 'A new substation plan for the Korba belt is under review.', url: '', sample: true },
      { id: 'SS7', speaker: 'Leader R (rival party, fictional)', party: 'Rival', topic: 'jobs', stance: -1, date: d(410), venue: 'Rally (fictional)', quote: 'One lakh jobs will be given in the first year.', url: '', sample: true }
    ];
    const iso = n => new Date(d(n)).toISOString().slice(0, 10);
    CGP.sampleCommitments = [
      { id: 'SC1', text: 'Pay paddy procurement dues within 72 hours (fictional pledge)', who: 'State government (fictional)', announced: iso(300).slice(0, 7), deadline: iso(-60), kw: 'paddy', place: 'Statewide', sample: true },
      { id: 'SC2', text: 'Restore reliable power in the Korba belt (fictional pledge)', who: 'Power utility (fictional)', announced: iso(400).slice(0, 7), deadline: iso(10), kw: 'power|outage', place: 'Korba', sample: true },
      { id: 'SC3', text: 'Hand over 20,000 PM Awas houses (fictional target)', who: 'State government (fictional)', announced: iso(420).slice(0, 7), deadline: iso(40), kw: 'awas', place: 'Statewide', sample: true },
      { id: 'SC4', text: 'Convert security camps into schools and health centres (fictional)', who: 'State government (fictional)', announced: iso(240).slice(0, 7), deadline: iso(-120), kw: 'camps converted|schools and health', place: 'Bastar', sample: true },
      { id: 'SC5', text: 'Re-verify Mahtari Vandan beneficiary lists (fictional)', who: 'State government (fictional)', announced: iso(90).slice(0, 7), deadline: iso(25), kw: 'mahtari.*(exclu|ekyc)|exclu.*mahtari', place: 'Statewide', sample: true },
      { id: 'SR1', text: 'Create one lakh jobs in the first year (fictional rival pledge)', who: 'Rival party (fictional)', announced: iso(410).slice(0, 7), deadline: iso(45), kw: 'recruit|jobs', place: 'Statewide', rival: true, sample: true }
    ];
  };
})(typeof window !== 'undefined' ? window : globalThis);
