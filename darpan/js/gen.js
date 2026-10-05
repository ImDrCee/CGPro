/* Synthetic sample-data generator. Everything produced here is ILLUSTRATIVE, not real news or real posts. */
(function (g) {
  const CGP = g.CGP;
  const R = CGP.ref;

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // spk = relative weight of who talks about it; cm = probability the CM is mentioned
  const T = [
    { topic: 'women', issue: 'Mahtari Vandan payouts on time', pol: 1, spk: { govt: 3, bjp: 3, media: 3, citizen: 1 }, intent: 'praise', emo: 'pride', cm: 0.6, tags: ['#MahtariVandan'],
      hl: 'Mahtari Vandan instalment reaches women beneficiaries in {d}', sn: 'Women in {d} received the monthly Mahtari Vandan transfer directly in their bank accounts, officials said.' },
    { topic: 'women', issue: 'Mahtari Vandan eKYC delays', pol: -1, spk: { citizen: 5, media: 3, opp: 2 }, intent: 'complaint', emo: 'frustration', cm: 0.3, tags: ['#MahtariVandan', '#eKYC'],
      hl: 'Women in {d} say Mahtari Vandan payment delayed after eKYC', sn: 'Several beneficiaries in {d} report that payments stopped until biometric eKYC was completed, and that centres are crowded.' },
    { topic: 'women', issue: 'Mahtari Vandan exclusion allegations', pol: -1, spk: { opp: 8, media: 2 }, intent: 'allege', emo: 'anger', cm: 0.5, tags: ['#MahtariVandan'],
      hl: 'Opposition alleges eligible women excluded from Mahtari Vandan in {d}', sn: 'Opposition leaders claim that eligible women in {d} were dropped from the beneficiary list and demand a transparent re-verification.' },
    { topic: 'women', issue: 'SHG livelihood stories', pol: 1, spk: { media: 3, bjp: 2, citizen: 2, govt: 2 }, intent: 'inform', emo: 'joy', cm: 0.2, tags: ['#WomenSHG'],
      hl: 'Self-help group women in {d} start micro-enterprises with Mahtari Vandan support', sn: 'A group of women in {d} pooled monthly assistance to start a small food-processing unit.' },
    { topic: 'women', issue: 'Rumour: Mahtari Vandan stopping', pol: -1, spk: { citizen: 8, opp: 1 }, intent: 'rumour', emo: 'fear', cm: 0.4, misinfo: 1, tags: ['#MahtariVandan', '#Viral'],
      hl: 'Viral message claims Mahtari Vandan will be discontinued', sn: 'A forwarded message circulating in {d} claims the scheme will end next month; officials have not confirmed any such decision.' },

    { topic: 'housing', issue: 'PM Awas handovers', pol: 1, spk: { govt: 3, bjp: 3, media: 3, citizen: 1 }, intent: 'inform', emo: 'joy', cm: 0.5, tags: ['#PMAwas'],
      hl: 'PM Awas houses handed over to beneficiaries in {d}', sn: 'Families in {d} moved into new pucca houses under PM Awas Yojana at a handover event.' },
    { topic: 'housing', issue: 'PM Awas instalment delays', pol: -1, spk: { citizen: 4, media: 3, opp: 3 }, intent: 'complaint', emo: 'frustration', cm: 0.2, tags: ['#PMAwas'],
      hl: 'Beneficiaries in {d} allege pending PM Awas instalments', sn: 'Residents in {d} say construction is stalled as the next instalment has not been released.' },
    { topic: 'housing', issue: 'PM Awas survey list errors', pol: -1, spk: { opp: 6, media: 2, citizen: 2 }, intent: 'allege', emo: 'anger', cm: 0.2, tags: ['#PMAwas'],
      hl: 'Opposition questions PM Awas survey list errors in {d}', sn: 'Opposition members claim eligible families were left out of the PM Awas list in {d}.' },

    { topic: 'farmers', issue: 'Paddy procurement delays', pol: -1, spk: { citizen: 5, media: 4, opp: 3 }, intent: 'complaint', emo: 'anger', cm: 0.4, tags: ['#DhanKharidi', '#Farmers'], dists: ['janjgir', 'rajnandgaon', 'durg', 'bilaspur'],
      hl: 'Farmers in {d} protest long queues and token delays at paddy procurement centres', sn: 'Farmers in {d} spent days waiting at procurement centres, citing token shortages and slow lifting of stock.' },
    { topic: 'farmers', issue: 'Paddy procurement payouts', pol: 1, spk: { govt: 4, bjp: 3, media: 3 }, intent: 'inform', emo: 'pride', cm: 0.6, tags: ['#DhanKharidi'],
      hl: 'Government says paddy payments released to farmers in {d}', sn: 'Officials said payments for procured paddy were credited to farmers in {d}, and procurement is on track.' },
    { topic: 'farmers', issue: 'Paddy procurement scam allegations', pol: -1, spk: { opp: 8, media: 2 }, intent: 'allege', emo: 'anger', cm: 0.6, tags: ['#DhanKharidi', '#Scam'],
      hl: 'Opposition raises irregularities in paddy procurement', sn: 'Opposition leaders alleged irregularities in paddy procurement and demanded an independent inquiry.' },
    { topic: 'farmers', issue: 'MSP and bonus clarity', pol: 0, spk: { citizen: 4, media: 3 }, intent: 'question', emo: 'concern', cm: 0.2, tags: ['#MSP'],
      hl: 'Farmers in {d} seek clarity on MSP and bonus timeline', sn: 'Farmer groups in {d} asked for a clear schedule for MSP-linked payments and bonus.' },
    { topic: 'farmers', issue: 'Fertiliser shortage', pol: -1, spk: { citizen: 5, media: 3, opp: 3 }, intent: 'complaint', emo: 'frustration', cm: 0.2, tags: ['#Fertiliser'],
      hl: 'Farmers in {d} queue for fertiliser as stocks run short', sn: 'Farmers in {d} said urea and DAP stocks at cooperative societies ran out within hours.' },
    { topic: 'farmers', issue: 'Krishak Unnati uptake', pol: 1, spk: { govt: 3, media: 3, bjp: 2, citizen: 1 }, intent: 'inform', emo: 'joy', cm: 0.2, tags: ['#KrishakUnnati'],
      hl: 'Farmers in {d} adopt new support under Krishak Unnati Yojana', sn: 'Agriculture officials said more farmers in {d} enrolled for irrigation and input support.' },

    { topic: 'bastar', issue: 'Camps converted to schools and hospitals', pol: 1, spk: { govt: 4, media: 4, bjp: 3 }, intent: 'inform', emo: 'pride', cm: 0.6, tags: ['#NewBastar'], dists: ['bastar', 'dantewada'],
      hl: 'Security camps in {d} converted into schools and health centres', sn: 'Former security camps in {d} are being repurposed for classrooms and primary health centres.' },
    { topic: 'bastar', issue: 'Surrender and rehabilitation', pol: 1, spk: { govt: 3, media: 4, bjp: 2 }, intent: 'inform', emo: 'relief', cm: 0.5, tags: ['#NewBastar'], dists: ['bastar', 'dantewada'],
      hl: 'Rehabilitation drive for surrendered cadres continues in {d}', sn: 'Officials reviewed training and livelihood support for surrendered cadres in {d}.' },
    { topic: 'bastar', issue: 'Bastar development pace', pol: -1, spk: { citizen: 3, opp: 4, media: 3 }, intent: 'complaint', emo: 'frustration', cm: 0.3, tags: ['#Bastar'], dists: ['bastar', 'dantewada'],
      hl: 'Villagers in {d} say promised roads and clinics are slow to arrive', sn: 'Residents of remote villages in {d} said basic services have not kept pace with announcements.' },
    { topic: 'bastar', issue: 'Niyad Nellanar progress', pol: 0, spk: { govt: 3, media: 4 }, intent: 'inform', emo: 'neutral', cm: 0.3, tags: ['#NiyadNellanar'], dists: ['bastar', 'dantewada'],
      hl: 'Officials review Niyad Nellanar progress in {d} villages', sn: 'A review meeting in {d} took stock of roads, ration shops and schools in targeted villages.' },

    { topic: 'health', issue: 'Ayushman health camps', pol: 1, spk: { govt: 3, bjp: 2, media: 3 }, intent: 'inform', emo: 'joy', cm: 0.2, tags: ['#AyushmanBharat'],
      hl: 'Health camp benefits thousands in {d}', sn: 'A free health camp in {d} screened residents and enrolled eligible families for Ayushman cards.' },
    { topic: 'health', issue: 'Doctor and medicine shortage', pol: -1, spk: { citizen: 4, media: 4, opp: 3 }, intent: 'complaint', emo: 'worry', cm: 0.2, tags: ['#Health'],
      hl: 'Shortage of doctors and medicines reported at {d} district hospital', sn: 'Patients at the district hospital in {d} said specialists are unavailable and some medicines are out of stock.' },

    { topic: 'education', issue: 'Teacher vacancies and school merger', pol: -1, spk: { opp: 4, citizen: 3, media: 3 }, intent: 'complaint', emo: 'worry', cm: 0.3, tags: ['#Education'],
      hl: 'Teacher vacancies and school merger worries in {d}', sn: 'Parents in {d} fear that school mergers will increase travel for children, while teacher posts remain vacant.' },
    { topic: 'education', issue: 'New classrooms and digital labs', pol: 1, spk: { govt: 3, bjp: 2, media: 3 }, intent: 'inform', emo: 'pride', cm: 0.3, tags: ['#Education'],
      hl: 'New school building and digital classrooms inaugurated in {d}', sn: 'A new school building with smart classrooms was opened in {d}.' },

    { topic: 'law', issue: 'Law and order incidents', pol: -1, spk: { opp: 4, media: 4, citizen: 3 }, intent: 'allege', emo: 'fear', cm: 0.4, tags: ['#LawAndOrder'],
      hl: 'Law and order concerns after theft and assault incidents in {d}', sn: 'Residents and opposition leaders in {d} questioned police patrolling after a string of incidents.' },
    { topic: 'law', issue: 'Police action on crime', pol: 1, spk: { govt: 3, bjp: 3, media: 3 }, intent: 'inform', emo: 'relief', cm: 0.3, tags: ['#LawAndOrder'],
      hl: 'Police crackdown on organised crime in {d} draws praise', sn: 'Police arrested members of a gang in {d}; local residents welcomed the action.' },

    { topic: 'power', issue: 'Power outages', pol: -1, spk: { citizen: 5, media: 3, opp: 2 }, intent: 'complaint', emo: 'frustration', cm: 0.2, tags: ['#PowerCut'], dists: ['korba', 'raipur', 'bilaspur'],
      hl: 'Frequent power cuts disrupt daily life in {d}', sn: 'Residents in {d} reported repeated outages during evening hours and sought a clear explanation.' },
    { topic: 'power', issue: 'New substations', pol: 1, spk: { govt: 4, bjp: 2, media: 2 }, intent: 'inform', emo: 'relief', cm: 0.2, tags: ['#Power'],
      hl: 'New substation commissioned; supply improves in {d}', sn: 'A new substation was commissioned in {d} to improve voltage and reduce outages.' },

    { topic: 'drugs', issue: 'Drugs and opium cultivation', pol: -1, spk: { opp: 6, media: 3, citizen: 1 }, intent: 'allege', emo: 'anger', cm: 0.4, tags: ['#Drugs', '#Opium'],
      hl: 'Opposition raises drug trade and opium cultivation concerns near {d}', sn: 'Opposition leaders alleged that illegal cultivation and drug trade are rising and asked for stricter action.' },
    { topic: 'drugs', issue: 'Narcotics seizures', pol: 1, spk: { govt: 3, media: 4, bjp: 2 }, intent: 'inform', emo: 'relief', cm: 0.2, tags: ['#Narcotics'],
      hl: 'Police seize narcotics consignment in {d}', sn: 'Police said a large consignment of narcotics was seized in {d}, and arrests were made.' },

    { topic: 'jobs', issue: 'Recruitment exams and jobs', pol: -1, spk: { citizen: 4, opp: 4, media: 2 }, intent: 'complaint', emo: 'anxiety', cm: 0.3, tags: ['#Jobs'],
      hl: 'Youth in {d} demand recruitment exam dates and jobs', sn: 'Young job seekers in {d} asked for a recruitment calendar and quicker results.' },
    { topic: 'jobs', issue: 'Skilling and placement', pol: 1, spk: { govt: 3, bjp: 2, media: 3 }, intent: 'inform', emo: 'joy', cm: 0.2, tags: ['#Skilling'],
      hl: 'Skill and placement drive in {d} offers jobs to youth', sn: 'A placement drive in {d} connected local youth with employers.' },

    { topic: 'corruption', issue: 'Tender and contract allegations', pol: -1, spk: { opp: 7, media: 3 }, intent: 'allege', emo: 'anger', cm: 0.5, tags: ['#Corruption'],
      hl: 'Opposition alleges irregularities in a tender in {d}', sn: 'Opposition leaders alleged favouritism in awarding a contract in {d} and sought documents.' },

    { topic: 'infra', issue: 'Roads and bridge delays', pol: -1, spk: { citizen: 4, media: 4, opp: 2 }, intent: 'complaint', emo: 'frustration', cm: 0.2, tags: ['#Roads'],
      hl: 'Damaged roads and delayed bridge work irk residents of {d}', sn: 'Commuters in {d} faced potholes and detours as bridge work missed its deadline.' },
    { topic: 'infra', issue: 'Road and bridge sanctions', pol: 1, spk: { govt: 4, bjp: 3, media: 2 }, intent: 'inform', emo: 'pride', cm: 0.4, tags: ['#Roads'],
      hl: 'Road and bridge projects sanctioned for {d}', sn: 'Officials announced new road and bridge works for {d}.' },

    { topic: 'tribal', issue: 'Mining and land acquisition protests', pol: -1, spk: { citizen: 4, opp: 4, media: 3 }, intent: 'complaint', emo: 'anger', cm: 0.3, tags: ['#Tribal', '#Mining'], dists: ['korba', 'raigarh', 'surguja', 'bastar'],
      hl: 'Tribal groups in {d} protest mining and land acquisition', sn: 'Villagers in {d} said consent processes were bypassed and demanded the project be reviewed.' },
    { topic: 'tribal', issue: 'Forest rights claims', pol: 0, spk: { govt: 3, media: 3 }, intent: 'inform', emo: 'neutral', cm: 0.1, tags: ['#ForestRights'],
      hl: 'Forest rights claims under review in {d}', sn: 'Officials in {d} are reviewing pending forest rights claims.' },

    { topic: 'water', issue: 'Drinking water shortage', pol: -1, spk: { citizen: 5, media: 3, opp: 2 }, intent: 'complaint', emo: 'worry', cm: 0.2, tags: ['#Water'],
      hl: 'Residents of {d} face drinking water shortage', sn: 'Several colonies in {d} are receiving water only on alternate days.' },
    { topic: 'water', issue: 'Jal Jeevan connections', pol: 1, spk: { govt: 3, bjp: 2, media: 2 }, intent: 'inform', emo: 'joy', cm: 0.2, tags: ['#JalJeevan'],
      hl: 'Tap connections expand under Jal Jeevan in {d}', sn: 'More households in {d} now have tap water connections.' },

    { topic: 'culture', issue: 'Cultural events', pol: 1, spk: { govt: 3, media: 3, citizen: 2, bjp: 1 }, intent: 'inform', emo: 'joy', cm: 0.4, tags: ['#Chhattisgarh'],
      hl: 'Cultural festival draws crowds in {d}', sn: 'A folk-arts festival in {d} showcased local music and handicrafts.' },

    { topic: 'governance', issue: 'CM district visit', pol: 1, spk: { govt: 4, bjp: 4, media: 3 }, intent: 'inform', emo: 'pride', cm: 1, tags: ['#CMSai'],
      hl: 'CM Vishnu Deo Sai visits {d}, reviews development works', sn: 'The Chief Minister reviewed ongoing works in {d} and met beneficiaries of welfare schemes.' },
    { topic: 'governance', issue: 'Announcements versus delivery', pol: -1, spk: { opp: 7, media: 2, citizen: 1 }, intent: 'allege', emo: 'anger', cm: 1, tags: ['#CMSai'],
      hl: 'Opposition says CM announcements lag on the ground in {d}', sn: 'Opposition leaders argued that announcements made for {d} have not translated into visible work.' },
    { topic: 'culture', issue: 'Memes and satire', pol: -1, spk: { citizen: 9 }, intent: 'satire', emo: 'sarcasm', cm: 0.7, tags: ['#Meme'],
      hl: 'Meme mocking government response goes viral in {d}', sn: 'A satirical image about government announcements is being widely shared in {d}.' }
  ];

  // ───── 24-month history: seasons, past episodes (with logged actions), chains, fictional contractor, coordinated bursts ─────
  const SEASON = {
    'Paddy procurement delays': m => ([10, 11, 0].indexOf(m) >= 0 ? 3.2 : 0.35),
    'Paddy procurement scam allegations': m => ([10, 11, 0, 1].indexOf(m) >= 0 ? 2.6 : 0.4),
    'Paddy procurement payouts': m => ([10, 11, 0, 1].indexOf(m) >= 0 ? 2.8 : 0.4),
    'MSP and bonus clarity': m => ([9, 10, 11].indexOf(m) >= 0 ? 2.8 : 0.4),
    'Power outages': m => ([3, 4, 5].indexOf(m) >= 0 ? 3 : [11, 0, 1, 2].indexOf(m) >= 0 ? 0.6 : 1),
    'Fertiliser shortage': m => ([5, 6, 7].indexOf(m) >= 0 ? 3.2 : 0.4),
    'Drinking water shortage': m => ([3, 4, 5].indexOf(m) >= 0 ? 3 : 0.8),
    'Roads and bridge delays': m => ([6, 7, 8].indexOf(m) >= 0 ? 2.5 : 0.8),
    'Announcements versus delivery': m => ([1, 2].indexOf(m) >= 0 ? 2.2 : 1),
    'Mahtari Vandan eKYC delays': m => ([11, 0, 1, 2, 3, 4, 5].indexOf(m) >= 0 ? 1.8 : 0.35)
  };
  const EVENTS = [ // recent events: day indexes back from today
    { issue: 'Paddy procurement delays', dists: ['janjgir', 'rajnandgaon'], from: 0, to: 2, boost: 7 },
    { issue: 'Paddy procurement scam allegations', from: 0, to: 3, boost: 4 },
    { issue: 'Power outages', dists: ['korba'], from: 2, to: 4, boost: 6 },
    { issue: 'Drinking water shortage', dists: ['korba'], from: 0, to: 2, boost: 5 }, // follows the power episode
    { issue: 'Mahtari Vandan eKYC delays', dists: ['raipur', 'bilaspur'], from: 4, to: 6, boost: 5 },
    { issue: 'Rumour: Mahtari Vandan stopping', from: 0, to: 1, boost: 5 },
    { issue: 'Camps converted to schools and hospitals', dists: ['bastar', 'dantewada'], from: 1, to: 3, boost: 4 },
    { issue: 'Law and order incidents', dists: ['raipur'], from: 1, to: 2, boost: 6 },
    { issue: 'Mining and land acquisition protests', dists: ['surguja', 'raigarh'], from: 0, to: 3, boost: 4 },
    { issue: 'Drugs and opium cultivation', from: 1, to: 4, boost: 3 }
  ];

  const OUTLETS = {
    'News · Print': ['Hindi Daily A · Raipur ed.', 'Hindi Daily B · Raipur ed.', 'Hindi Daily C · Bilaspur ed.', 'English Daily D · Raipur', 'Regional Daily E · Bastar'],
    'News · Online': ['Regional Portal A', 'Regional Portal B', 'National Portal C', 'Hindi News Site D', 'District News Site E'],
    YouTube: ['News Channel A', 'News Channel B', 'Local Vlogger C', 'Regional Channel D']
  };
  const OPP_LEADERS = ['Charandas Mahant', 'Bhupesh Baghel', 'Deepak Baij', 'T.S. Singh Deo'];
  const SPEAKERS = {
    govt: ['CM Office (official)', 'Public Relations Dept (official)', 'Department handle (official)'],
    bjp: ['BJP state unit', 'BJP district unit', 'BJP MLA (district)'],
    opp: ['Congress state unit', 'Congress spokesperson', 'Opposition MLA (district)', 'Congress leader'],
    citizen: ['Citizen post', 'Local influencer', 'Farmers group', 'Residents forum']
  };
  const TOPIC_ENT = { power: 'CSPDCL (power distribution)', infra: 'Public Works Dept', farmers: 'Markfed / procurement centres', health: 'Health Dept / CGMSC', water: 'Municipal corporation', housing: 'Municipal corporation' };
  const CONTRACTOR = 'Contractor Z (fictional)';

  function pickW(rnd, obj) {
    const keys = Object.keys(obj);
    let tot = 0; keys.forEach(k => (tot += obj[k]));
    let r = rnd() * tot;
    for (const k of keys) { r -= obj[k]; if (r <= 0) return k; }
    return keys[0];
  }
  function pick(rnd, arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function norm(rnd) { return Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd()); }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Past episodes: random but reproducible. Some carry a logged response that visibly shortens the episode.
  function planEpisodes(rnd, days) {
    const eps = [], actions = [];
    const pool = ['Paddy procurement delays', 'Power outages', 'Drinking water shortage', 'Rumour: Mahtari Vandan stopping', 'Mahtari Vandan exclusion allegations', 'Roads and bridge delays', 'Law and order incidents', 'Mining and land acquisition protests', 'Doctor and medicine shortage', 'Fertiliser shortage', 'Teacher vacancies and school merger', 'Drugs and opium cultivation', 'PM Awas instalment delays'];
    const dpool = ['korba', 'bilaspur', 'raipur', 'durg', 'raigarh', 'surguja', 'bastar', 'janjgir', 'rajnandgaon'];
    const isRumour = n => /Rumour|exclusion/.test(n);
    pool.forEach(issue => {
      const n = 2 + Math.floor(rnd() * 3);
      let used = [];
      for (let k = 0; k < n; k++) {
        let start = 14 + Math.floor(rnd() * (days - 30));
        if (used.some(u => Math.abs(u - start) < 40)) continue;
        used.push(start);
        const hasAct = rnd() < 0.6, len = (hasAct ? 6 : 3) + Math.floor(rnd() * 6), dn = 1 + Math.floor(rnd() * 3), ds = [];
        for (let j = 0; j < dn; j++) ds.push(pick(rnd, dpool));
        // recurrence: water shortage and power repeatedly hit korba / bilaspur
        if (issue === 'Drinking water shortage' || issue === 'Power outages') ds.push(rnd() < 0.7 ? 'korba' : 'bilaspur');
        if (issue === 'Roads and bridge delays' && rnd() < 0.6) ds.push('bilaspur');
        const e = { issue, dists: ds, from: start - len, to: start, boost: 5 + rnd() * 4, contractor: /Drinking water|Roads/.test(issue) && ds.indexOf('bilaspur') >= 0 };
        if (hasAct) {
          const kind = isRumour(issue) ? (rnd() < 0.7 ? 'District officer clarification' : 'State press note') : pick(rnd, ['District officer clarification', 'State press note', 'Field team visit', 'Social media update']);
          e.actionDay = start - 3; e.actionDecay = kind === 'District officer clarification' || kind === 'Field team visit' ? 0.22 : kind === 'State press note' ? 0.6 : 0.5;
          actions.push({ id: 'SA' + actions.length, issue, topic: (T.filter(t => t.issue === issue)[0] || {}).topic || '', district: ds[0], type: kind, dayIdx: e.actionDay, note: 'Illustrative logged response', sample: true });
        }
        eps.push(e);
        // chain: a power outage episode is often followed by a water episode within two days
        if (issue === 'Power outages' && rnd() < 0.8) eps.push({ issue: 'Drinking water shortage', dists: ds.slice(), from: start - len - 1, to: start - 1, boost: 4, contractor: ds.indexOf('bilaspur') >= 0 });
      }
    });
    return { eps, actions };
  }

  function generate(opts) {
    opts = opts || {};
    const days = opts.days || 730;
    const rnd = rng(opts.seed || 20261002);
    const now = Date.now();
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    const mid = midnight.getTime();
    const out = [];
    const distMap = {}; R.districts.forEach(d => (distMap[d.id] = d));
    const plan = planEpisodes(rnd, days);
    const EV = EVENTS.concat(plan.eps);
    let seq = 0;

    for (let day = days - 1; day >= 0; day--) {
      const dayDate = new Date(mid - day * 86400000);
      const month = dayDate.getMonth();
      const nItems = Math.round((day < 30 ? 52 : 16) * (0.8 + rnd() * 0.4));
      const tw = {};
      T.forEach((t, idx) => {
        let w = (t.pol < 0 ? 0.62 : t.pol > 0 ? 1.2 : 1);
        const evOn = EV.some(e => e.issue === t.issue && day >= e.from && day <= e.to);
        if (!evOn && SEASON[t.issue]) w *= SEASON[t.issue](month);
        EV.forEach(e => {
          if (e.issue !== t.issue || day < e.from || day > e.to) return;
          let b = 1 + (e.boost - 1) / (e.dists ? 1.4 : 1);
          if (e.actionDay != null && day < e.actionDay) b = 1 + (b - 1) * e.actionDecay;
          w *= b;
        });
        tw[idx] = w;
      });
      for (let n = 0; n < nItems; n++) {
        const t = T[+pickW(rnd, tw)];
        const dw = {};
        R.districts.forEach(d => {
          let w = d.weight;
          if (t.dists && t.dists.indexOf(d.id) >= 0) w *= 3.2;
          EV.forEach(e => { if (e.issue === t.issue && e.dists && e.dists.indexOf(d.id) >= 0 && day >= e.from && day <= e.to) w *= 4; });
          dw[d.id] = w;
        });
        const dist = distMap[pickW(rnd, dw)];
        const inContractorEp = EV.some(e => e.contractor && e.issue === t.issue && day >= e.from && day <= e.to && e.dists.indexOf(dist.id) >= 0);

        const sp = pickW(rnd, t.spk);
        let channel;
        if (sp === 'media') channel = pickW(rnd, { 'News · Print': 3, 'News · Online': 5, YouTube: 1.2 });
        else if (sp === 'govt') channel = pickW(rnd, { X: 4, Facebook: 2.5, Instagram: 2, YouTube: 1.3 });
        else if (sp === 'bjp') channel = pickW(rnd, { X: 5, Facebook: 2.5, Instagram: 1.5, YouTube: 1 });
        else if (sp === 'opp') channel = pickW(rnd, { X: 5, Facebook: 3, Instagram: 1, YouTube: 1 });
        else channel = pickW(rnd, { X: 4, Facebook: 3.5, Instagram: 2, YouTube: 0.5 });
        const isNews = channel.indexOf('News') === 0;
        let speaker;
        if (sp === 'media' || (channel === 'YouTube' && sp !== 'govt')) speaker = pick(rnd, OUTLETS[channel] || OUTLETS['News · Online']);
        else speaker = pick(rnd, SPEAKERS[sp]).replace('(district)', '· ' + dist.name);
        if (sp === 'citizen') speaker += ' · ' + dist.name;

        const hour = rnd() < 0.5 ? 7 + rnd() * 5 : 16 + rnd() * 7;
        let ts = mid - day * 86400000 + hour * 3600000;
        if (ts > now) ts = now - rnd() * 6 * 3600000;

        const mentionsCM = rnd() < t.cm;
        const entities = [];
        if (mentionsCM) entities.push(R.cm);
        if (t.topic === 'law' && rnd() < 0.4) entities.push('Vijay Sharma');
        if ((t.topic === 'infra' || t.topic === 'power') && rnd() < 0.3) entities.push('Arun Sao');
        if (sp === 'opp' && rnd() < 0.7) entities.push(pick(rnd, OPP_LEADERS));
        if (TOPIC_ENT[t.topic] && rnd() < 0.35) entities.push(TOPIC_ENT[t.topic]);
        if (inContractorEp ? rnd() < 0.8 : (/Drinking water|Roads/.test(t.issue) && rnd() < 0.07)) entities.push(CONTRACTOR);
        const seat = pick(rnd, dist.seats);

        const pol = t.pol;
        const sentiment = clamp(pol * (0.35 + rnd() * 0.6) + (pol === 0 ? (rnd() - 0.5) * 0.4 : 0), -1, 1);
        const misinfo = t.misinfo ? 0.6 + rnd() * 0.35 : Math.min(0.3, rnd() * 0.18 + (t.intent === 'allege' ? 0.08 : 0));
        const lang = isNews ? (rnd() < 0.78 ? 'Hindi' : 'English') : (rnd() < 0.62 ? 'Hindi' : rnd() < 0.9 ? 'English' : 'Chhattisgarhi');
        const mediaType = isNews ? (channel === 'News · Print' ? (rnd() < 0.12 ? 'Editorial' : 'Report') : 'Article') : channel === 'YouTube' ? 'Video' : channel === 'Instagram' ? (rnd() < 0.5 ? 'Reel' : 'Post') : 'Post';
        const prominence = channel === 'News · Print' ? pick(rnd, ['Front page', 'Page 3', 'City pages', 'City pages', 'District pages']) : channel === 'News · Online' ? pick(rnd, ['Top story', 'Regular', 'Regular']) : '';

        const chScale = { X: 1, Facebook: 1.3, Instagram: 1.7, YouTube: 2.4, 'News · Print': 0.5, 'News · Online': 1 }[channel];
        const spB = { govt: 1.5, bjp: 1.7, opp: 1.8, media: 1.2, citizen: 0.45 }[sp];
        const base = Math.exp(norm(rnd) * 1.1) * chScale * spB * (pol < 0 ? 1.08 : 1) * (t.misinfo ? 1.6 : 1) * (mentionsCM ? 1.3 : 1);
        const r = () => 0.6 + rnd() * 0.8;
        let likes = Math.round(70 * base * r()), shares = Math.round(18 * base * r()), comments = Math.round(9 * base * r()), views = Math.round(2400 * base * r() * (isNews ? 3 : 1));
        if (isNews) { likes = 0; comments = Math.round(comments * 0.3); }
        out.push({
          id: 'S' + (1000 + seq++), ts: Math.round(ts), channel, source: speaker, language: lang, mediaType, prominence, speakerType: sp, speaker,
          district: dist.id, constituency: seat, topic: t.topic, scheme: (R.topics.filter(x => x.id === t.topic)[0] || {}).scheme || '',
          issue: t.issue, narrative: t.issue, entities, mentionsCM, stance: pol, sentiment: +sentiment.toFixed(2), emotion: t.emo, intent: t.intent, hashtags: t.tags,
          likes, shares, comments, views, raw: likes + 3 * shares + 2 * comments + views / 40, misinfo: +misinfo.toFixed(2),
          headline: t.hl.replace('{d}', dist.name), text: t.sn.replace(/\{d\}/g, dist.name), sample: true, origin: 'sample', conf: 1, pickup: 1, story: 'S' + (1000 + seq)
        });
      }
    }

    // Coordinated bursts: identical text from many citizen accounts within ~90 minutes
    [[1, 'Meme mocking government response goes viral'], [96, 'Same copy-pasted claim appears across accounts'], [310, 'Same copy-pasted claim appears across accounts']].forEach((b, bi) => {
      const baseTs = mid - b[0] * 86400000 + 19 * 3600000;
      for (let k = 0; k < 9; k++) {
        const d = pick(rnd, R.districts);
        out.push({ id: 'SC' + bi + '_' + k, ts: Math.round(baseTs + rnd() * 5400000), channel: 'X', source: 'Citizen post · ' + d.name + ' #' + (k + 1), language: 'Hindi', mediaType: 'Post', prominence: '', speakerType: 'citizen', speaker: 'Citizen post · ' + d.name + ' #' + (k + 1),
          district: d.id, constituency: '', topic: 'governance', scheme: '', issue: 'Announcements versus delivery', narrative: 'Announcements versus delivery', entities: [], mentionsCM: true, stance: -1, sentiment: -0.6, emotion: 'sarcasm', intent: 'satire', hashtags: ['#Jumla'],
          likes: 40 + Math.floor(rnd() * 60), shares: 20 + Math.floor(rnd() * 40), comments: 5, views: 3000 + Math.floor(rnd() * 3000), raw: 0, misinfo: 0.3, headline: b[1], text: 'Identical message posted by many accounts within minutes (illustrative).', sample: true, origin: 'sample', conf: 1, pickup: 1, story: 'SC' + bi });
      }
    });
    // Resurfaced old content: clones of old items re-posted in the last two days
    const old = out.filter(i => i.ts < now - 150 * 86400000 && i.stance < 0 && i.channel === 'YouTube');
    for (let k = 0; k < 3 && old.length; k++) {
      const o = pick(rnd, old);
      out.push(Object.assign({}, o, { id: 'SR' + k, ts: now - (2 + k * 7) * 3600000, source: 'Local Vlogger C', speaker: 'Local Vlogger C', views: o.views * 2, shares: o.shares * 3, misinfo: 0.7, resurfaced: true, story: 'SR' + k }));
    }

    CGP.sampleActions = plan.actions.map(a => Object.assign({}, a, { ts: mid - a.dayIdx * 86400000 + 10 * 3600000 }));
    finalize(out);
    CGP.sampleContext = sampleContext(out, rnd);
    return out;
  }

  // Fictional "official" dataset: monthly grievances per district for power topics, deliberately diverging from coverage in two districts
  function sampleContext(items, rnd) {
    const months = [];
    const d0 = new Date(); d0.setDate(1);
    for (let i = 5; i >= 0; i--) { const d = new Date(d0.getFullYear(), d0.getMonth() - i, 1); months.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')); }
    const rows = [];
    R.districts.forEach(d => months.forEach(m => {
      const cov = items.filter(i => i.topic === 'power' && i.stance < 0 && i.district === d.id && new Date(i.ts).toISOString().slice(0, 7) === m).length;
      let v = Math.round(cov * (0.8 + rnd() * 0.5) * 1.6);
      if (d.id === 'raipur') v = Math.round(v * 0.2);       // coverage high, official counts low
      if (d.id === 'dantewada') v = v * 4 + 12;               // official counts high, coverage thin
      rows.push({ district: d.id, period: m, value: v });
    }));
    return { id: 'ctx-sample', name: 'Power-supply grievances logged (illustrative, fictional)', topic: 'power', unit: 'grievances', rows, sample: true };
  }
  // Compute traction score (0-100) and urgency (0-100)
  function finalize(items) {
    let max = 1;
    items.forEach(it => { if (!it.raw) it.raw = it.likes + 3 * it.shares + 2 * it.comments + it.views / 40; if (it.raw > max) max = it.raw; });
    const now = Date.now();
    items.forEach(it => {
      it.traction = Math.round(100 * Math.pow(it.raw / max, 0.42));
      const ageH = (now - it.ts) / 3600000;
      const fresh = Math.max(0, 1 - ageH / 72);
      it.urgency = Math.round(clamp(100 * (0.45 * (it.stance < 0 ? 1 : 0.2) * (it.traction / 100) + 0.3 * it.misinfo + 0.25 * fresh * (it.stance < 0 ? 1 : 0.3)), 0, 100));
    });
    items.sort((a, b) => b.ts - a.ts);
    return items;
  }

  CGP.generate = generate;
  CGP.finalize = finalize;
})(typeof window !== 'undefined' ? window : globalThis);


