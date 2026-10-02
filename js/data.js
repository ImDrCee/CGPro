/* Reference data for the Chhattisgarh POC. Roles/handles come from public web sources and must be verified. */
(function (g) {
  const CGP = (g.CGP = g.CGP || {});

  CGP.ref = {
    state: 'Chhattisgarh',
    cm: 'Vishnu Deo Sai',

    districts: [
      { id: 'raipur', name: 'Raipur', hi: 'रायपुर', tile: [2, 2], weight: 1.7, note: 'State capital', seats: ['Raipur City North', 'Raipur City South', 'Raipur City West', 'Raipur Rural', 'Abhanpur', 'Arang', 'Dharsiwa'] },
      { id: 'durg', name: 'Durg', hi: 'दुर्ग', tile: [1, 2], weight: 1.3, note: 'Bhilai steel belt', seats: ['Durg City', 'Durg Rural', 'Bhilai Nagar', 'Vaishali Nagar', 'Ahiwara', 'Patan'] },
      { id: 'bilaspur', name: 'Bilaspur', hi: 'बिलासपुर', tile: [1, 1], weight: 1.3, note: 'High Court, rail zone', seats: ['Bilaspur', 'Bilha', 'Beltara', 'Takhatpur', 'Masturi', 'Kota'] },
      { id: 'korba', name: 'Korba', hi: 'कोरबा', tile: [2, 1], weight: 1.0, note: 'Coal and power', seats: ['Korba', 'Katghora', 'Pali-Tanakhar', 'Rampur'] },
      { id: 'raigarh', name: 'Raigarh', hi: 'रायगढ़', tile: [3, 0], weight: 1.0, note: 'Mining and industry', seats: ['Raigarh', 'Kharsia', 'Dharamjaigarh', 'Lailunga'] },
      { id: 'rajnandgaon', name: 'Rajnandgaon', hi: 'राजनांदगांव', tile: [0, 2], weight: 0.9, note: 'Paddy and urban mix', seats: ['Rajnandgaon', 'Dongargarh', 'Dongargaon', 'Khujji'] },
      { id: 'bastar', name: 'Bastar', hi: 'बस्तर', tile: [2, 3], weight: 0.9, note: 'Tribal belt, Naxal-to-development', seats: ['Jagdalpur', 'Chitrakot', 'Bastar', 'Bakawand'] },
      { id: 'dantewada', name: 'Dantewada', hi: 'दंतेवाड़ा', tile: [2, 4], weight: 0.6, note: 'Security camps to schools', seats: ['Dantewada'] },
      { id: 'surguja', name: 'Surguja', hi: 'सरगुजा', tile: [1, 0], weight: 0.8, note: 'North tribal region', seats: ['Ambikapur', 'Lundra', 'Sitapur'] },
      { id: 'janjgir', name: 'Janjgir-Champa', hi: 'जांजगीर-चांपा', tile: [3, 1], weight: 0.9, note: 'Major paddy belt', seats: ['Janjgir-Champa', 'Akaltara', 'Jaijaipur', 'Pamgarh'] }
    ],

    topics: [
      { id: 'women', name: 'Women Empowerment', short: 'Women', scheme: 'Mahtari Vandan', kw: 'women|mahtari|ladies|महतारी|महिला|ekyc' },
      { id: 'housing', name: 'Housing', short: 'Housing', scheme: 'PM Awas', kw: 'awas|housing|house|home|आवास' },
      { id: 'farmers', name: 'Farmers & Paddy', short: 'Farmers', scheme: 'Dhan Kharidi', kw: 'farmer|paddy|dhan|msp|krishak|agri|किसान|धान|mandi' },
      { id: 'bastar', name: 'Bastar & Naxalism', short: 'Bastar', scheme: 'Niyad Nellanar', kw: 'bastar|naxal|maoist|niyad|nellanar|surrender|बस्तर' },
      { id: 'health', name: 'Health', short: 'Health', scheme: 'Ayushman Bharat', kw: 'health|hospital|doctor|ayushman|medicine|स्वास्थ्य' },
      { id: 'education', name: 'Education', short: 'Education', scheme: 'School Education', kw: 'school|teacher|education|student|शिक्षा' },
      { id: 'law', name: 'Law & Order', short: 'Law & Order', scheme: '', kw: 'law|order|crime|police|theft|assault|क्राइम' },
      { id: 'power', name: 'Power & Electricity', short: 'Power', scheme: '', kw: 'power|electric|outage|bijli|substation|बिजली' },
      { id: 'jobs', name: 'Jobs & Recruitment', short: 'Jobs', scheme: '', kw: 'job|youth|recruit|employment|exam|skill|रोजगार' },
      { id: 'drugs', name: 'Drugs & Opium', short: 'Drugs', scheme: '', kw: 'drug|opium|narcotic|ganja|नशा' },
      { id: 'corruption', name: 'Corruption Allegations', short: 'Corruption', scheme: '', kw: 'corrupt|scam|tender|irregular|contract|भ्रष्टाचार' },
      { id: 'infra', name: 'Roads & Infrastructure', short: 'Infra', scheme: '', kw: 'road|bridge|infra|highway|सड़क' },
      { id: 'tribal', name: 'Tribal Rights & Mining', short: 'Tribal', scheme: 'Forest Rights', kw: 'tribal|mining|forest|adivasi|land acquisition|आदिवासी' },
      { id: 'water', name: 'Drinking Water', short: 'Water', scheme: 'Jal Jeevan', kw: 'water|jal|पानी' },
      { id: 'governance', name: 'Governance & CM Outreach', short: 'Governance', scheme: '', kw: 'governance|announcement|outreach|cm visit|review meeting' },
      { id: 'culture', name: 'Culture & Events', short: 'Culture', scheme: '', kw: 'culture|festival|event|rajyotsava|उत्सव' }
    ],

    channels: [
      { id: 'X', abbr: 'X', color: '#5B5BF0' },
      { id: 'Facebook', abbr: 'Fb', color: '#3BA7FF' },
      { id: 'Instagram', abbr: 'Ig', color: '#FF5DA2' },
      { id: 'YouTube', abbr: 'Yt', color: '#FF7A59' },
      { id: 'News · Print', abbr: 'Pr', color: '#FFB020' },
      { id: 'News · Online', abbr: 'Web', color: '#14C48B' }
    ],

    speakers: {
      govt: { label: 'Government', color: '#F5A524' },
      bjp: { label: 'BJP', color: '#FB7C3C' },
      opp: { label: 'Opposition', color: '#3BA7FF' },
      media: { label: 'Media', color: '#8A63F5' },
      citizen: { label: 'Citizens', color: '#94A3B8' }
    },

    leaders: [
      { id: 'cm', name: 'Vishnu Deo Sai', role: 'Chief Minister', party: 'BJP', group: 'govt' },
      { id: 'dcm1', name: 'Arun Sao', role: 'Deputy Chief Minister', party: 'BJP', group: 'govt' },
      { id: 'dcm2', name: 'Vijay Sharma', role: 'Deputy Chief Minister', party: 'BJP', group: 'govt' },
      { id: 'lop', name: 'Charandas Mahant', role: 'Leader of Opposition', party: 'INC', group: 'opp' },
      { id: 'bb', name: 'Bhupesh Baghel', role: 'Former CM · MLA, Patan', party: 'INC', group: 'opp' },
      { id: 'db', name: 'Deepak Baij', role: 'PCC President', party: 'INC', group: 'opp' },
      { id: 'ts', name: 'T.S. Singh Deo', role: 'Former Deputy CM', party: 'INC', group: 'opp' }
    ],

    handles: [
      { platform: 'X', handle: '@vishnudsai', owner: 'Chief Minister', status: 'found' },
      { platform: 'X', handle: '@ChhattisgarhCMO', owner: 'CM Office', status: 'found' },
      { platform: 'Instagram · Facebook · YouTube · WhatsApp', handle: 'linktr.ee/chhattisgarhcmo1', owner: 'CM Office', status: 'verify' },
      { platform: 'X · Facebook · Instagram', handle: 'Deputy CMs, BJP Chhattisgarh, DPR', owner: 'Govt / BJP', status: 'todo' },
      { platform: 'X · Facebook · Instagram', handle: 'Charandas Mahant, Bhupesh Baghel, Deepak Baij, INC Chhattisgarh', owner: 'Opposition', status: 'todo' },
      { platform: 'X · Facebook · Instagram', handle: 'MLA and district pages (10 districts)', owner: 'Districts', status: 'todo' }
    ],

    connectors: [
      { name: 'Sample data generator', desc: 'Synthetic items for demo', state: 'live' },
      { name: 'JSON import', desc: 'Load items, daily analysis, MLA list', state: 'live' },
      { name: 'News RSS / site feeds', desc: 'Hindi and English dailies, portals', state: 'next' },
      { name: 'X API', desc: 'Tracked handles and hashtags (paid tier)', state: 'key' },
      { name: 'Facebook / Instagram', desc: 'Licensed vendor or manual export of public pages', state: 'vendor' },
      { name: 'YouTube Data API', desc: 'Public channels, titles, transcripts', state: 'next' },
      { name: 'LLM extraction', desc: 'Topic, stance, claim, district tagging', state: 'next' }
    ],

    params: [
      ['Source', ['Channel', 'Outlet / handle', 'Language', 'Media type', 'Prominence']],
      ['Who', ['Speaker type', 'Speaker', 'Entities mentioned', 'Mentions CM']],
      ['Where', ['District', 'Constituency']],
      ['What', ['Topic', 'Scheme', 'Issue / concern', 'Narrative cluster', 'Hashtags']],
      ['Stance', ['Stance on CM / govt', 'Sentiment score', 'Emotion', 'Intent']],
      ['Traction', ['Likes', 'Shares', 'Comments', 'Views', 'Traction score']],
      ['Quality', ['Misinformation risk', 'Urgency']]
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
